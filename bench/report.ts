// Aggregates bench/runs/**/result.json into the model leaderboard and the designbase uplift table.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONDITIONS, type Condition } from "./lib/conditions.ts";
import type { RunResult } from "./run.ts";

const RUNS = "bench/runs";
const OUT = "bench/results";

const results: RunResult[] = [];
const errors: RunResult[] = [];
for (const m of existsSync(RUNS) ? readdirSync(RUNS, { withFileTypes: true }).filter((d) => d.isDirectory()) : []) {
  for (const c of readdirSync(join(RUNS, m.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const t of readdirSync(join(RUNS, m.name, c.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
      const dir = join(RUNS, m.name, c.name, t.name);
      if (existsSync(join(dir, "result.json"))) results.push(JSON.parse(readFileSync(join(dir, "result.json"), "utf8")));
      else if (existsSync(join(dir, "error.json"))) errors.push(JSON.parse(readFileSync(join(dir, "error.json"), "utf8")));
    }
  }
}
if (!results.length) {
  console.log("No results yet. Run `npm run bench:run -- --suite models` first.");
  process.exit(0);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "–");
const pct = (n: number) => (Number.isFinite(n) ? `${Math.round(n * 100)}%` : "–");
const signed = (n: number) => (Number.isFinite(n) ? `${n >= 0 ? "+" : ""}${n.toFixed(1)}` : "–");
const models = [...new Set(results.map((r) => r.model))];
const pick = (model: string, conds: Condition[]) => results.filter((r) => r.model === model && conds.includes(r.condition) && r.score);

function stats(rs: RunResult[]) {
  const s = rs.map((r) => r.score!);
  return {
    n: rs.length,
    composite: mean(s.map((x) => x.composite)),
    lint: mean(s.map((x) => x.lint.score)),
    visual: mean(s.map((x) => x.visual?.score ?? 0)),
    judge: mean(s.filter((x) => x.judge).map((x) => x.judge!.score)),
    renders: mean(s.map((x) => (x.render.ok ? 1 : 0))),
    passes: mean(s.map((x) => (x.passed ? 1 : 0))),
    cost: mean(rs.map((r) => r.cost)),
    rounds: mean(rs.map((r) => r.rounds.length)),
  };
}

const date = new Date().toISOString().slice(0, 10);
const scoring = `Composite = 35% lint score + 35% rendered-visual score + 30% judge (1–10 → 0–100), or 50/50 lint/visual when no judge ran. A file that fails to render gets 0 on the visual half.`;

// --- Leaderboard: native design-system adherence, no designbase.
const base: Condition[] = ["A-screenshot", "B-dump"];
const board = models
  .map((model) => ({ model, all: stats(pick(model, base)), a: stats(pick(model, ["A-screenshot"])), b: stats(pick(model, ["B-dump"])) }))
  .filter((r) => r.all.n)
  .sort((x, y) => y.all.composite - x.all.composite);

const leaderboard = [
  "# DesignBench: model leaderboard",
  "",
  `How well does each model follow a product's design system *on its own*, given either screenshots of approved screens (A) or the full design system pasted into the prompt (B)? Same 10 tasks, same playbook (${"Almanac"}), same scoring. Generated ${date}.`,
  "",
  scoring,
  "",
  "| # | Model | Composite | A: screenshot | B: full dump | Lint | Visual | Judge /10 | Renders | Passes | $/task | n |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ...board.map((r, i) =>
    `| ${i + 1} | ${r.model} | **${f1(r.all.composite)}** | ${f1(r.a.composite)} | ${f1(r.b.composite)} | ${f1(r.all.lint)} | ${f1(r.all.visual)} | ${f1(r.all.judge)} | ${pct(r.all.renders)} | ${pct(r.all.passes)} | ${r.all.cost.toFixed(3)} | ${r.all.n} |`,
  ),
  "",
  "*Passes* = renders with zero error-level violations in lint and in the rendered check.",
].join("\n");

// --- Uplift: same models with designbase.
const upliftRows = models
  .map((model) => {
    const [a, b, c, d] = (["A-screenshot", "B-dump", "C-brief", "D-loop"] as Condition[]).map((k) => stats(pick(model, [k])));
    return { model, a, b, c, d };
  })
  .filter((r) => r.c.n || r.d.n)
  .sort((x, y) => (y.d.composite - y.a.composite) - (x.d.composite - x.a.composite));
const avg = (k: "a" | "b" | "c" | "d", f: "composite" | "passes" | "judge") => mean(upliftRows.map((r) => r[k][f]).filter(Number.isFinite));

const uplift = upliftRows.length
  ? [
      "# designbase uplift",
      "",
      `What designbase adds on top of each model. Generated ${date}.`,
      "",
      ...Object.entries(CONDITIONS).map(([k, v]) => `- **${k}**: ${v}`),
      "",
      scoring,
      "",
      "| Model | A | B | C | D | C − B (brief vs dump) | D − A (designbase vs screenshot) | D passes | D rounds | D judge | A judge |",
      "|---|---|---|---|---|---|---|---|---|---|---|",
      ...upliftRows.map((r) =>
        `| ${r.model} | ${f1(r.a.composite)} | ${f1(r.b.composite)} | ${f1(r.c.composite)} | **${f1(r.d.composite)}** | ${signed(r.c.composite - r.b.composite)} | **${signed(r.d.composite - r.a.composite)}** | ${pct(r.d.passes)} | ${f1(r.d.rounds)} | ${f1(r.d.judge)} | ${f1(r.a.judge)} |`,
      ),
      `| **Mean** | ${f1(avg("a", "composite"))} | ${f1(avg("b", "composite"))} | ${f1(avg("c", "composite"))} | **${f1(avg("d", "composite"))}** | ${signed(avg("c", "composite") - avg("b", "composite"))} | **${signed(avg("d", "composite") - avg("a", "composite"))}** | ${pct(avg("d", "passes"))} | | ${f1(avg("d", "judge"))} | ${f1(avg("a", "judge"))} |`,
      "",
      `**Phase 0 pass bar:** D − A ≥ +30 composite and D judge ≥ A judge + 1, with C > B.`,
    ].join("\n")
  : "";

const errorNote = errors.length ? `\n\n${errors.length} job(s) errored and are excluded: ${errors.map((e) => `${e.model}/${e.condition}/${e.task}`).join(", ")}. Re-run \`npm run bench:run\` to retry them.` : "";

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "leaderboard.md"), leaderboard + errorNote + "\n");
if (uplift) writeFileSync(join(OUT, "uplift.md"), uplift + errorNote + "\n");
writeFileSync(join(OUT, "results.json"), JSON.stringify({ generated: date, results, errors: errors.map(({ model, condition, task, error }) => ({ model, condition, task, error })) }, null, 2));
console.log(leaderboard + "\n\n" + uplift + errorNote);
