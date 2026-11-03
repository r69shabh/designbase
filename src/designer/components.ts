// Turns a discovered candidate into a real component: a model writes typed React + Tailwind using
// only playbook tokens, then we lint it, render it next to the source crop, measure the difference,
// and feed the difference back until it matches (the extraction-side twin of the D-loop).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { generateObject, type Usage } from "../ai/generate.ts";
import { check } from "../check.ts";
import { materialize } from "../core/materialize.ts";
import { Component as ComponentSchema, type PlaybookContent } from "../core/schema.ts";
import { lintSource } from "../lint.ts";
import type { Playbook } from "../playbook.ts";
import { renderTsx } from "../render.ts";
import { getBrowser, toUrl } from "../visual.ts";
import { Vocabulary, type Candidate } from "./discover.ts";
import { distance, hexRgb, measureImage } from "./measure.ts";

export const ComponentDraft = z.object({
  name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/).describe("PascalCase component name"),
  summary: z.string().describe("One or two sentences: what it is and when to use it"),
  keywords: z.array(z.string()).describe("Words a task might use when it needs this component"),
  propSpecs: z.array(z.object({ name: z.string(), type: z.string(), required: z.boolean(), description: z.string() })),
  variants: z.record(z.string(), z.array(z.string())).describe('e.g. { "variant": ["primary", "secondary"] }; {} if none'),
  replaces: z.array(z.string()).describe('Raw HTML elements this component should be used instead of, e.g. ["button"]; [] if none'),
  do: z.array(z.string()),
  dont: z.array(z.string()),
  example: z.string().describe("One JSX expression using the component that reproduces the FIRST instance, with its real text"),
  code: z.string().describe("The full .tsx file"),
});
export type ComponentDraft = z.infer<typeof ComponentDraft>;

export interface SynthRequest {
  candidate: Candidate;
  playbook: Playbook;
  nameHints: string[];
  takenNames: string[];
}
export type Synthesizer = (req: SynthRequest, previous?: { draft: ComponentDraft; feedback: string }) => Promise<{ draft: ComponentDraft; usage?: Usage }>;

export interface Verification {
  score: number;
  passed: boolean;
  issues: string[];
  rendered: boolean;
  size: { source: [number, number]; render: [number, number] | null };
  colorSimilarity: number;
  renderPng: Buffer | null;
}

export function vocabularyBrief(pb: Playbook): string {
  const t = pb.tokens;
  return [
    `Colours (use as bg-*, text-*, border-*): ${Object.entries(t.color).map(([k, c]) => `${k} ${c.value}`).join(", ")}`,
    `Spacing keys (p-*, px-*, py-*, m-*, gap-*): ${Object.entries(t.spacing).map(([k, v]) => `${k}=${v}px`).join(", ")}`,
    `Font sizes: ${Object.entries(t.fontSize).map(([k, v]) => `text-${k}=${v}px`).join(", ")}`,
    `Fonts: ${Object.entries(t.font).map(([k, f]) => `font-${k} (${f.family})`).join(", ")}`,
    `Radius: ${Object.entries(t.radius).map(([k, v]) => `rounded-${k}${v === 9999 ? " (pill)" : `=${v}px`}`).join(", ")}`,
    `Shadows: ${Object.keys(t.shadow).length ? Object.keys(t.shadow).map((k) => `shadow-${k}`).join(", ") : "none — never use shadow-*"}`,
  ].join("\n");
}

export const llmSynthesizer: Synthesizer = async (req, previous) => {
  const { candidate: c, playbook: pb } = req;
  const instances = c.instances.map((i, n) => `Instance ${n + 1} (${i.skin}):\n${i.description}`).join("\n\n");
  const messages = [
    {
      role: "system" as const,
      content: `You write production React + TypeScript + Tailwind components for a design system.
Rules:
- Use ONLY these tokens as Tailwind classes. No hex, no arbitrary values like p-[13px], no Tailwind default colours (gray-500, white…), no inline styles.
${vocabularyBrief(pb)}
- One file, \`export function <Name>\` (named export), props typed with an exported interface. Only import from "react".
- Model colour treatments as a \`variant\` (or \`tone\`) prop named by meaning (primary/secondary/danger, positive/warning/negative), never by colour name; text and repeated content as props/children, not hard-coded.
- Reproduce the measured layout: same padding keys, gaps, font sizes, fonts, weights, radius and borders as the instances.
Design voice:
${pb.voice}`,
    },
    {
      role: "user" as const,
      content: `A ${c.kind} that appears ${c.instances.length}+ times across the product, in ${c.skins.length} colour treatment(s): ${c.skins.join(" | ")}.
Measured instances (token names in [brackets], sizes in px):

${instances}

Names the design reviewer used for components on these screens: ${req.nameHints.join(", ") || "none"}.
Names already taken by other components: ${req.takenNames.join(", ") || "none"}.
Write the component.`,
    },
    ...(previous
      ? [
          { role: "assistant" as const, content: JSON.stringify(previous.draft) },
          { role: "user" as const, content: `We rendered your example and compared it with the source. Fix these and return the full corrected JSON:\n${previous.feedback}` },
        ]
      : []),
  ];
  const { object, usage } = await generateObject("text", ComponentDraft, messages, { maxTokens: 8_000 });
  return { draft: object, usage };
};

/**
 * Only real controls can be "replaced": a model that says a card replaces <div> would make the
 * linter flag every div. Attribute selectors (input[type=email]) collapse to the element.
 */
const REPLACEABLE = new Set(["button", "input", "select", "textarea", "table"]);
export const cleanReplaces = (r: string[]) => [...new Set(r.map((x) => x.toLowerCase().replace(/[^a-z].*$/, "")).filter((x) => REPLACEABLE.has(x)))];

const withComponent = (content: PlaybookContent, d: ComponentDraft): PlaybookContent => {
  const component = ComponentSchema.parse({ ...d, replaces: cleanReplaces(d.replaces), props: d.propSpecs.map((p) => `${p.name}${p.required ? "" : "?"}: ${p.type}`).join("; ") });
  return { ...content, components: [...content.components.filter((x) => x.name !== d.name), component] };
};

/** Lint, render and compare one draft against the candidate's first instance. */
export async function verifyDraft(base: PlaybookContent, d: ComponentDraft, c: Candidate, sourceCrop: Buffer, workDir: string): Promise<Verification> {
  const issues: string[] = [];
  const src = c.instances[0].box;
  const fail = (rendered = false): Verification => ({ score: 0, passed: false, issues, rendered, size: { source: [src.w, src.h], render: null }, colorSimilarity: 0, renderPng: null });

  if (!new RegExp(`export\\s+(function|const)\\s+${d.name}\\b`).test(d.code)) issues.push(`The file must have a named export \`${d.name}\`.`);
  let pb: Playbook;
  try {
    pb = materialize(withComponent(base, d), join(workDir, "playbook"));
  } catch (e) {
    issues.push(`Invalid component spec: ${(e as Error).message.slice(0, 300)}`);
    return fail();
  }
  for (const v of lintSource(pb, d.code, { isComponentSource: true }).filter((v) => v.severity === "error")) {
    issues.push(`Line ${v.line}: ${v.message}. ${v.fix}`);
  }

  // Render the example at the source instance's width, on the page background.
  mkdirSync(workDir, { recursive: true });
  const example = join(workDir, "Example.tsx");
  writeFileSync(example, `import { ${d.name} } from "@/components/${d.name}";\nexport default function Example() {\n  return (\n    <div className="p-6">\n      <div style={{ width: ${src.w} }}>\n        ${d.example}\n      </div>\n    </div>\n  );\n}\n`);
  const r = await renderTsx(pb, example, join(workDir, "render"));
  if (!r.ok) {
    issues.push(`The example doesn't render: ${r.error}`);
    return fail();
  }

  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width: Math.max(400, src.w + 96), height: Math.max(300, src.h + 96) } });
  let renderPng: Buffer;
  let box: { width: number; height: number };
  try {
    await page.goto(toUrl(r.html!), { waitUntil: "networkidle" });
    const el = page.locator("#root > div > div > *").first();
    const b = await el.boundingBox();
    if (!b || b.width < 1 || b.height < 1) {
      issues.push("The example rendered an empty element.");
      return fail(true);
    }
    box = b;
    renderPng = await el.screenshot();
  } finally {
    await page.close();
  }

  const ratio = (a: number, b: number) => Math.min(a, b) / Math.max(a, b);
  const hRatio = ratio(box.height, src.h);
  const wRatio = ratio(box.width, src.w);
  if (hRatio < 0.85) issues.push(`Rendered height is ${Math.round(box.height)}px; the source is ${src.h}px. Check vertical padding, line heights and font sizes.`);
  if (wRatio < 0.85) issues.push(`Rendered width is ${Math.round(box.width)}px; the source is ${src.w}px.`);

  const vocab = new Vocabulary(pb.tokens);
  const [a, b] = await Promise.all([measureImage(sourceCrop), measureImage(renderPng)]);
  let similarity = 0;
  const missing: string[] = [];
  for (const sc of a.colors) {
    const match = b.colors.find((rc) => distance(hexRgb(rc.hex), hexRgb(sc.hex)) < 14);
    similarity += Math.min(sc.share, match?.share ?? 0);
    if (!match && sc.share >= 0.02) missing.push(`${vocab.color(`rgb(${hexRgb(sc.hex).join(",")})`)} (${Math.round(sc.share * 100)}% of the source)`);
  }
  if (missing.length) issues.push(`Colours visible in the source but missing in the render: ${missing.join(", ")}.`);

  const visual = await check(pb, { path: r.html! });
  // The example is pinned to the source width, so phone-width overflow says nothing about the component.
  const visualErrors = visual.violations.filter((v) => v.severity === "error" && v.rule !== "no-horizontal-overflow");
  for (const v of visualErrors.slice(0, 5)) issues.push(`Rendered check: ${v.message}. ${v.fix}`);

  const score = Math.max(0, Math.round(100 * (0.3 * hRatio + 0.15 * wRatio + 0.55 * Math.min(1, similarity)) - 5 * visualErrors.length - 10 * issues.filter((i) => i.startsWith("Line ")).length));
  return {
    score,
    passed: score >= 75 && !issues.some((i) => i.startsWith("Line ") || i.startsWith("The file")),
    issues,
    rendered: true,
    size: { source: [src.w, src.h], render: [Math.round(box.width), Math.round(box.height)] },
    colorSimilarity: Math.round(similarity * 100) / 100,
    renderPng,
  };
}

/** Synthesize → verify → feed back, keeping the best draft. */
export async function buildComponent(req: SynthRequest, base: PlaybookContent, sourceCrop: Buffer, workDir: string, synth: Synthesizer = llmSynthesizer, maxRounds = 3) {
  let best: { draft: ComponentDraft; v: Verification } | null = null;
  let previous: { draft: ComponentDraft; feedback: string } | undefined;
  let cost = 0;
  let model: string | undefined;
  let rounds = 0;
  for (let round = 0; round < maxRounds; round++) {
    rounds++;
    let draft: ComponentDraft;
    try {
      const out = await synth(req, previous);
      draft = out.draft;
      cost += out.usage?.cost ?? 0;
      model ??= out.usage?.model;
    } catch (e) {
      if (best) break;
      throw e;
    }
    const v = await verifyDraft(base, draft, req.candidate, sourceCrop, join(workDir, `round${round}`));
    if (!best || v.score > best.v.score) best = { draft, v };
    if (v.passed) break;
    previous = { draft, feedback: v.issues.map((i) => `- ${i}`).join("\n") || "- Match the source more closely." };
  }
  return { ...best!, rounds, cost, model };
}
