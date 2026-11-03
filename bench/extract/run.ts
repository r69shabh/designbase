// ExtractBench: how close is what the designer agent extracts to the truth?
//   npm run bench:extract [-- --cases almanac,synth-1 --seeds 8]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { findCandidates } from "../../src/designer/discover.ts";
import { measureImage, measureUrl, type UrlMeasurement } from "../../src/designer/measure.ts";
import { synthesize, tokensFromProposals } from "../../src/designer/synthesize.ts";
import { closeBrowser, getBrowser, toUrl } from "../../src/visual.ts";
import { scoreComponents, scoreTokens, type ComponentScores, type TokenScores, type TruthBox, type TruthTokens } from "./score.ts";
import { makePages, makeSystem } from "./synth.ts";

type TruthSpec = { attr: "data-truth" } | { selectors: { component: string; selector: string; variants?: string[] }[] };
interface Case {
  name: string;
  /** closed: truth lists exactly what the pages use (precision and recall). open: truth is the whole system (precision only). */
  world: "closed" | "open";
  pages: string[];
  truth: TruthTokens;
  boxes: TruthSpec;
}

const WORK = ".designbase/extractbench";
const { values: args } = parseArgs({ options: { cases: { type: "string" }, seeds: { type: "string", default: "8" } } });

// ---------- cases ----------

function almanacCase(): Case {
  const t = JSON.parse(readFileSync("playbook/tokens.json", "utf8"));
  const hex = (k: string) => t.color[k].value as string;
  return {
    name: "almanac",
    world: "closed",
    pages: ["dashboard", "settings"].map((p) => resolve(`playbook/exemplars/${p}.html`)),
    truth: {
      // accent-ink shares paper's hex; ink-3 etc. are all used on the two pages.
      colors: Object.fromEntries(Object.keys(t.color).filter((k) => k !== "accent-ink").map((k) => [k, hex(k)])),
      spacing: [4, 8, 12, 16, 24, 32, 48, 64],
      fontSizes: [12, 14, 16, 20, 40, 56],
      fonts: ["Fraunces", "IBM Plex Sans", "IBM Plex Mono"],
      radii: [2, 6],
      pill: true,
      shadows: false,
      roles: { background: hex("paper"), accent: hex("accent"), border: hex("line") },
    },
    boxes: {
      selectors: [
        { component: "button", selector: ".btn", variants: ["primary", "ghost", "danger"] },
        { component: "badge", selector: ".badge", variants: ["positive", "warning", "negative"] },
        { component: "card", selector: ".card" },
        { component: "stat", selector: ".stat" },
        { component: "input", selector: ".field input" },
        { component: "table", selector: "table" },
        { component: "header", selector: ".page-header" },
      ],
    },
  };
}

function synthCase(seed: number): Case {
  const sys = makeSystem(seed);
  const { pages, truth } = makePages(sys);
  const dir = join(WORK, `synth-${seed}`);
  mkdirSync(dir, { recursive: true });
  const files = Object.entries(pages).map(([name, html]) => {
    const f = resolve(dir, `${name}.html`);
    writeFileSync(f, html);
    return f;
  });
  writeFileSync(join(dir, "system.json"), JSON.stringify({ sys, truth }, null, 2));
  return {
    name: `synth-${seed} (${sys.mode}, ${sys.spacing[0] === 4 ? "4" : "8"}px, r${sys.radius.card}${sys.shadow ? ", shadows" : ""})`,
    world: "closed",
    pages: files,
    truth: {
      colors: truth.colors,
      spacing: truth.spacing,
      fontSizes: truth.fontSizes,
      bodySize: truth.bodySize,
      fonts: truth.fonts,
      radii: truth.radii,
      pill: truth.pill,
      shadows: truth.shadows,
      roles: { background: sys.colors.background, text: sys.colors.text, accent: sys.colors.accent, border: sys.colors.border },
    },
    boxes: { attr: "data-truth" },
  };
}

/** GitHub's Primer: real production CSS, truth from its published primitives (open world: precision only). */
function primerCase(): Case {
  const nm = resolve("node_modules/@primer");
  const css = [
    "primitives/dist/css/base/size/size.css",
    "primitives/dist/css/base/typography/typography.css",
    "primitives/dist/css/functional/size/size.css",
    "primitives/dist/css/functional/size/border.css",
    "primitives/dist/css/functional/size/radius.css",
    "primitives/dist/css/functional/spacing/space.css",
    "primitives/dist/css/functional/typography/typography.css",
    "primitives/dist/css/functional/themes/light.css",
    "css/dist/primer.css",
  ].map((f) => `<link rel="stylesheet" href="${pathToFileURL(join(nm, f)).href}">`).join("\n");
  const page = (title: string, body: string) => `<!doctype html><html lang="en" data-color-mode="light" data-light-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${css}</head><body><div class="container-lg p-4">${body}</div></body></html>`;
  const dashboard = page("Primer dashboard", `
<div class="Subhead"><h1 class="Subhead-heading">Invoices</h1><div class="Subhead-actions"><button data-truth="button:primary" class="btn btn-primary">New invoice</button></div></div>
<div class="border rounded-2 color-bg-default color-border-default mb-4" data-truth="card:default"><div class="Box-header"><h2 class="h4">Recent invoices</h2></div>
${[["INV-0412", "Northwind", "success", "Paid"], ["INV-0411", "Contoso", "attention", "Due soon"], ["INV-0409", "Fabrikam", "danger", "Overdue"]].map(([id, c, tone, l]) => `<div class="d-flex flex-items-center px-3 py-2 border-top color-border-muted"><span class="text-mono mr-3">${id}</span><span class="flex-auto">${c}</span><span data-truth="badge:${tone}" class="d-inline-block border rounded-2 px-2 f6 color-fg-${tone} color-border-${tone}-emphasis">${l}</span></div>`).join("")}
</div>
<div class="d-flex gap-2"><button data-truth="button:default" class="btn">Export</button><button data-truth="button:danger" class="btn btn-danger">Void</button><button data-truth="button:default" class="btn btn-sm">More</button></div>`);
  const settings = page("Primer settings", `
<div class="Subhead"><h1 class="Subhead-heading">Settings</h1></div>
<div class="border rounded-2 color-bg-default color-border-default p-3 mb-3" data-truth="card:default"><div class="form-group"><div class="form-group-header"><label for="n">Full name</label></div><div class="form-group-body"><input data-truth="input:default" class="form-control" id="n" value="Ada Okafor"></div></div>
<div class="form-group"><div class="form-group-header"><label for="e">Email</label></div><div class="form-group-body"><input data-truth="input:default" class="form-control" id="e" value="ada@northwind.co"></div></div>
<button data-truth="button:primary" class="btn btn-primary">Save</button></div>
<div class="border rounded-2 color-bg-default color-border-default p-3" data-truth="card:default"><h2 class="h4 mb-2">Danger zone</h2><button data-truth="button:danger" class="btn btn-danger">Delete workspace</button></div>`);
  const dir = join(WORK, "primer");
  mkdirSync(dir, { recursive: true });
  const files = Object.entries({ dashboard, settings }).map(([n, h]) => {
    const f = resolve(dir, `${n}.html`);
    writeFileSync(f, h);
    return f;
  });

  const read = (f: string) => readFileSync(join(nm, f), "utf8");
  const hexes = [...read("primitives/dist/css/functional/themes/light.css").matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].map((m) => {
    const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
    return `#${h.toUpperCase()}`;
  });
  const rems = (f: string, re: RegExp) => [...read(f).matchAll(re)].map((m) => Math.round(Number(m[1]) * (m[2] === "rem" ? 16 : 1)));
  return {
    name: "primer (GitHub, open world)",
    world: "open",
    pages: files,
    truth: {
      colors: Object.fromEntries([...new Set(hexes)].map((h, i) => [`c${i}`, h])),
      spacing: [...new Set([...rems("primitives/dist/css/base/size/size.css", /--base-size-\d+:\s*([\d.]+)(rem|px)/g), 1, 2, 6, 10, 14])],
      fontSizes: [...new Set(rems("primitives/dist/css/base/typography/typography.css", /--base-text-size-[\w-]+:\s*([\d.]+)(rem|px)/g))],
      radii: [...new Set(rems("primitives/dist/css/functional/size/radius.css", /--borderRadius-[\w-]+:\s*([\d.]+)(rem|px)/g))].filter((v) => v > 0 && v < 999),
    },
    boxes: { attr: "data-truth" },
  };
}

// ---------- truth boxes (read from the page by the scorer only) ----------

async function truthBoxes(pages: string[], spec: TruthSpec): Promise<TruthBox[]> {
  const browser = await getBrowser();
  const out: TruthBox[] = [];
  for (const p of pages) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript("window.__name = (f) => f");
    await page.goto(toUrl(p), { waitUntil: "networkidle" });
    const boxes = await page.evaluate((spec) => {
      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
      };
      if ("attr" in spec) {
        return Array.from(document.querySelectorAll("[data-truth]")).map((el) => {
          const [component, variant] = el.getAttribute("data-truth")!.split(":");
          return { component, variant, box: box(el) };
        });
      }
      return spec.selectors.flatMap((s) =>
        Array.from(document.querySelectorAll(s.selector)).map((el) => ({
          component: s.component,
          variant: s.variants?.find((v) => el.classList.contains(v)) ?? "default",
          box: box(el),
        })),
      );
    }, spec);
    out.push(...boxes.map((b) => ({ ...b, page: p })));
    await page.close();
  }
  return out;
}

// ---------- run ----------

interface CaseResult {
  name: string;
  world: Case["world"];
  url: TokenScores;
  screenshot: TokenScores;
  components: ComponentScores;
  extractScore: number;
}

const f1s = (s: TokenScores) => [s.colors.f1, s.spacing?.f1, s.fontSizes?.f1, s.fonts?.f1, s.radii?.f1].filter((x): x is number => x !== undefined && x !== null);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

async function runCase(c: Case): Promise<CaseResult> {
  const urls: UrlMeasurement[] = [];
  for (const p of c.pages) urls.push(await measureUrl(p));
  const fromUrls = synthesize(urls, []);
  const images = await Promise.all(urls.map(async (u, i) => ({ name: `page${i}`, m: await measureImage(u.screenshot) })));
  const fromShots = synthesize([], images);

  const url = scoreTokens(fromUrls.tokens, c.truth);
  const screenshot = scoreTokens(fromShots.tokens, c.truth, { colorsOnly: true });
  const vocab = tokensFromProposals("x", "", fromUrls.tokens);
  const components = scoreComponents(findCandidates(urls, vocab), await truthBoxes(c.pages, c.boxes));
  const metric = c.world === "closed" ? mean([...f1s(url), components.f1]) : mean([url.colors.precision, url.spacing?.precision ?? NaN, url.fontSizes?.precision ?? NaN].filter(Number.isFinite));
  return { name: c.name, world: c.world, url, screenshot, components, extractScore: Math.round(metric * 1000) / 10 };
}

const all: (() => Case)[] = [almanacCase, ...Array.from({ length: Number(args.seeds) }, (_, i) => () => synthCase(i + 1)), primerCase];
const cases = all.map((f) => f()).filter((c) => !args.cases || args.cases.split(",").some((n) => c.name.startsWith(n)));
const results: CaseResult[] = [];
for (const c of cases) {
  process.stdout.write(`${c.name} … `);
  const r = await runCase(c);
  results.push(r);
  console.log(`ExtractScore ${r.extractScore}`);
}
await closeBrowser();

// ---------- report ----------
const pct = (x: number | null | undefined) => (x === null || x === undefined || !Number.isFinite(x) ? "–" : `${Math.round(x * 100)}`);
const yn = (b: boolean | null) => (b === null ? "–" : b ? "✓" : "✗");
const closed = results.filter((r) => r.world === "closed");
const avg = (pickF: (r: CaseResult) => number | null | undefined) => mean(closed.map(pickF).filter((x): x is number => x !== null && x !== undefined && Number.isFinite(x)));

const gates = [
  { name: "URL colour F1 ≥ 0.95", value: avg((r) => r.url.colors.f1), bar: 0.95 },
  { name: "URL spacing F1 ≥ 0.90", value: avg((r) => r.url.spacing?.f1), bar: 0.9 },
  { name: "URL type-scale F1 ≥ 0.90", value: avg((r) => r.url.fontSizes?.f1), bar: 0.9 },
  { name: "Screenshot colour F1 ≥ 0.85", value: avg((r) => r.screenshot.colors.f1), bar: 0.85 },
  { name: "Component recall ≥ 0.80", value: avg((r) => r.components.recall), bar: 0.8 },
];

const lines = [
  "# ExtractBench",
  "",
  `How close is the designer agent's extraction to the truth? Deterministic stages only (measure → synthesize → discover); no model calls. Generated ${new Date().toISOString().slice(0, 10)}.`,
  "",
  "**Closed-world cases** know exactly which tokens and components their pages use, so precision and recall are both meaningful. **Open-world** (Primer) compares against GitHub's whole published token set, so only precision (\"did we report real values?\") is meaningful. Colours match at CIEDE2000 ΔE ≤ 3, sizes exactly (type ±0.5px). Components match by box overlap (IoU ≥ 0.6) with the truth instances.",
  "",
  "## Gates (closed-world averages)",
  "",
  "| Gate | Value | |",
  "|---|---|---|",
  ...gates.map((g) => `| ${g.name} | ${pct(g.value)} | ${g.value >= g.bar ? "✅" : "❌"} |`),
  "",
  "## Per case: live page (URL)",
  "",
  "| Case | Score | Colour P/R | Roles | Spacing P/R | Type P/R | Body | Fonts | Radius P/R | Pill | Shadows | Components R/P | Variants |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
  ...results.map((r) => {
    const u = r.url;
    const pr = (x: { precision: number; recall: number } | null) => (x ? (r.world === "open" ? `${pct(x.precision)}/–` : `${pct(x.precision)}/${pct(x.recall)}`) : "–");
    return `| ${r.name} | **${r.extractScore}** | ${pr(u.colors)} | ${u.roles ? pct(u.roles.accuracy) : "–"} | ${pr(u.spacing)} | ${pr(u.fontSizes)} | ${yn(u.bodySize)} | ${u.fonts ? pct(u.fonts.f1) : "–"} | ${pr(u.radii)} | ${yn(u.pill)} | ${yn(u.shadows)} | ${pct(r.components.recall)}/${pct(r.components.precision)} | ${pct(r.components.variantRecall)} |`;
  }),
  "",
  "## Per case: screenshot only (colours)",
  "",
  "| Case | Colour P/R | F1 | Roles |",
  "|---|---|---|---|",
  ...results.map((r) => `| ${r.name} | ${pct(r.screenshot.colors.precision)}/${r.world === "open" ? "–" : pct(r.screenshot.colors.recall)} | ${r.world === "open" ? "–" : pct(r.screenshot.colors.f1)} | ${r.screenshot.roles ? pct(r.screenshot.roles.accuracy) : "–"} |`),
  "",
  "## What was missed",
  "",
  ...results.flatMap((r) => {
    const m = [
      r.url.colors.missed.length && r.world === "closed" && `colours missed ${r.url.colors.missed.join(" ")}`,
      r.url.colors.extra.length && `extra colours ${r.url.colors.extra.join(" ")}`,
      r.url.roles?.wrong.length && `roles: ${r.url.roles.wrong.join("; ")}`,
      r.url.spacing?.missed.length && r.world === "closed" && `spacing missed ${r.url.spacing.missed.join(",")}`,
      r.url.spacing?.extra.length && `extra spacing ${r.url.spacing.extra.join(",")}`,
      r.url.fontSizes?.missed.length && r.world === "closed" && `type missed ${r.url.fontSizes.missed.join(",")}`,
      r.url.fontSizes?.extra.length && `extra type ${r.url.fontSizes.extra.join(",")}`,
      r.url.radii?.missed.length && r.world === "closed" && `radius missed ${r.url.radii.missed.join(",")}`,
      r.components.missed.length && `components missed ${r.components.missed.join(", ")}`,
      r.components.unmatchedCandidates.length && `unmatched candidates ${r.components.unmatchedCandidates.join(", ")}`,
    ].filter(Boolean);
    return m.length ? [`- **${r.name}:** ${m.join(" · ")}`] : [];
  }),
];
mkdirSync("bench/results", { recursive: true });
writeFileSync("bench/results/extractbench.md", lines.join("\n") + "\n");
writeFileSync("bench/results/extractbench.json", JSON.stringify(results, null, 2));
console.log("\n" + lines.slice(8, 8 + gates.length + 4).join("\n"));
console.log("\nFull report: bench/results/extractbench.md");
