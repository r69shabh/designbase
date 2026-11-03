import type { Component, Pattern, Playbook } from "./playbook.ts";

// Phase 0 retrieval is keyword overlap with a small synonym map. Embeddings come later,
// once the benchmark shows that a focused brief beats a full dump at all.
const SYNONYMS: Record<string, string> = {
  login: "auth", signin: "auth", logon: "auth", signup: "auth", register: "auth",
  kpi: "metric", kpis: "metric", stat: "metric", stats: "metric", number: "metric",
  overview: "dashboard", home: "dashboard", analytics: "dashboard",
  preference: "settings", preferences: "settings", account: "settings", profile: "settings",
  rows: "table", grid: "table", listing: "list",
  menu: "nav", navigation: "nav", sidebar: "nav",
  cta: "button", action: "button",
  input: "field", textbox: "field", form: "field",
  tag: "badge", chip: "badge", status: "badge",
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2)
    .flatMap((w) => {
      const stem = w.endsWith("ies") ? w.slice(0, -3) + "y" : w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
      return SYNONYMS[w] || SYNONYMS[stem] ? [w, stem, SYNONYMS[w] ?? SYNONYMS[stem]] : [w, stem];
    });
}

function score(query: Set<string>, keywords: string[], name: string, summary: string): number {
  let s = 0;
  const kw = new Set(keywords.flatMap(tokenize));
  for (const q of query) {
    if (kw.has(q)) s += 3;
    if (tokenize(name).includes(q)) s += 3;
    if (tokenize(summary).includes(q)) s += 1;
  }
  return s;
}

export function rankComponents(pb: Playbook, query: string): { component: Component; score: number }[] {
  const q = new Set(tokenize(query));
  return pb.components
    .map((component) => ({ component, score: score(q, component.keywords, component.name, component.summary) }))
    .sort((a, b) => b.score - a.score);
}

export function rankPatterns(pb: Playbook, query: string): { pattern: Pattern; score: number }[] {
  const q = new Set(tokenize(query));
  return pb.patterns
    .map((pattern) => ({ pattern, score: score(q, pattern.keywords, pattern.name, pattern.summary) }))
    .sort((a, b) => b.score - a.score);
}

export interface BriefOptions {
  /** Include full component source for this many top components (rest get signature only). */
  fullCode?: number;
}

export function selectForTask(pb: Playbook, task: string) {
  const top = rankPatterns(pb, task)[0];
  const pattern = top && top.score >= 3 ? top.pattern : null;
  const ranked = rankComponents(pb, task);
  const chosen = new Map<string, number>();
  for (const name of pattern?.components ?? []) chosen.set(name, 0);
  for (const { component, score } of ranked) if (score >= 3) chosen.set(component.name, score);
  chosen.set("Button", chosen.get("Button") ?? 0);
  const order = (name: string) => (chosen.get(name) ?? 0) + (pattern?.components.includes(name) ? 2 : 0);
  const components = pb.components.filter((c) => chosen.has(c.name)).sort((a, b) => order(b.name) - order(a.name));
  return { pattern, components };
}

export function buildBrief(pb: Playbook, task: string, opts: BriefOptions = {}): string {
  const { pattern, components } = selectForTask(pb, task);
  const t = pb.tokens;
  const fullCode = opts.fullCode ?? 4;
  const out: string[] = [];

  out.push(`# Design brief: ${task}`, "", `Playbook: **${t.name}** — ${t.description}`, "");
  out.push("## Voice", "", pb.voice, "");

  out.push("## Hard rules (the checker enforces these)", "");
  for (const r of pb.rules.filter((r) => r.severity === "error")) out.push(`- **${r.title}.** ${r.fix}`);
  for (const r of pb.rules.filter((r) => r.severity === "warn")) out.push(`- ${r.title} (warning). ${r.fix}`);
  out.push("");

  out.push("## Tokens (Tailwind class names in backticks)", "");
  out.push("Colours:");
  for (const [k, c] of Object.entries(t.color)) out.push(`- \`${k}\` ${c.value} — ${c.role}`);
  out.push("", "Fonts:");
  for (const [k, f] of Object.entries(t.font)) out.push(`- \`font-${k}\` ${f.family} — ${f.use}`);
  out.push(
    "",
    `Type scale: ${Object.entries(t.fontSize).map(([k, v]) => `\`text-${k}\` ${v}px`).join(", ")}`,
    `Spacing scale: ${Object.entries(t.spacing).map(([k, v]) => `${k}=${v}px`).join(", ")} (use only these numbers in p-/m-/gap-/space-)`,
    `Radius: ${Object.entries(t.radius).map(([k, v]) => `\`rounded-${k}\` ${v === 9999 ? "pill" : v + "px"}`).join(", ")}`,
    `Shadows: ${Object.keys(t.shadow).length ? Object.keys(t.shadow).join(", ") : "none — do not use shadow-*"}`,
    "",
  );

  if (pattern) {
    out.push(`## Pattern: ${pattern.name}`, "", pattern.summary, "", "Skeleton:", "```tsx", pattern.skeleton, "```", "", `Rhythm: ${pattern.rhythm}`, "");
    if (pattern.exemplar) out.push(`Approved exemplar: \`${pattern.exemplar}\` (render it to see the target look).`, "");
  } else {
    out.push("## Pattern", "", "No stored pattern matches this task. Compose from the components below and follow the voice and rhythm rules.", "");
  }

  out.push(`## Components to use (import them; never re-create them)`, "");
  const importLine = (c: (typeof components)[number]) => {
    const names = [c.name, ...(c.parts ?? [])].join(", ");
    const path = c.importPath ?? `@/components/${c.name}`;
    return c.exportName === "default" ? `import ${c.name} from "${path}";` : `import { ${names} } from "${path}";`;
  };
  components.forEach((c, i) => {
    out.push(`### ${c.name}`, "", c.summary, "", `\`${importLine(c)}\``, `Props: \`${c.props}\``);
    if (c.example) out.push(`Example: \`${c.example}\``);
    if (c.stories?.length) {
      const names = c.stories.map((s) => s.name);
      out.push(`Approved states (Storybook): ${names.slice(0, 10).join(", ")}${names.length > 10 ? `, +${names.length - 10} more` : ""}`);
      for (const s of c.stories.slice(1, 4)) out.push(`- ${s.name}: \`${s.example}\``);
    }
    if (c.do.length) out.push(`Do: ${c.do.join("; ")}`);
    if (c.dont.length) out.push(`Don't: ${c.dont.join("; ")}`);
    out.push("");
    if (i < fullCode) out.push("```tsx", c.code.trim(), "```", "");
  });
  const others = pb.components.filter((c) => !components.includes(c));
  if (others.length) out.push(`Also available if needed: ${others.map((c) => `${c.name} (${c.summary.split(".")[0]})`).join("; ")}.`, "");

  out.push("## Before you finish", "", "Run the `check` tool on every file you wrote and fix every error it reports. Repeat until it passes.");
  return out.join("\n");
}

/** Everything in the playbook as one document — the "full dump" baseline for the benchmark. */
export function dumpPlaybook(pb: Playbook): string {
  return [
    `# ${pb.tokens.name} playbook`,
    "",
    pb.voice,
    "",
    "## Tokens",
    "```json",
    JSON.stringify(pb.tokens, null, 2),
    "```",
    "## Rules",
    "```json",
    JSON.stringify(pb.rules, null, 2),
    "```",
    "## Patterns",
    "```json",
    JSON.stringify(pb.patterns, null, 2),
    "```",
    "## Components",
    ...pb.components.flatMap((c) => [`### ${c.name}`, c.summary, "```tsx", c.code.trim(), "```"]),
  ].join("\n");
}
