import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lintSource, scoreViolations } from "../src/lint.ts";
import { loadPlaybook } from "../src/playbook.ts";

const RUNS = "bench/runs";
const pb = loadPlaybook();
const ratings: Record<string, Record<string, number>> = existsSync("bench/ratings.json") ? JSON.parse(readFileSync("bench/ratings.json", "utf8")) : {};

const conditions = readdirSync(RUNS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
if (!conditions.length) {
  console.log(`No runs yet. Put outputs in ${RUNS}/<condition>/<task-id>.tsx (see bench/README.md).`);
  process.exit(0);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const fmt = (n: number) => (Number.isNaN(n) ? "–" : n.toFixed(1));
const lines = ["# Benchmark results", "", `Playbook: ${pb.tokens.name}. Generated ${new Date().toISOString().slice(0, 10)}.`, ""];
const summary = ["| Condition | Files | Mean score | Mean errors | Mean warnings | Mean rating |", "|---|---|---|---|---|---|"];
const detail: string[] = [];

for (const cond of conditions) {
  const files = readdirSync(join(RUNS, cond)).filter((f) => /\.(tsx|jsx)$/.test(f)).sort();
  const rows = files.map((f) => {
    const vs = lintSource(pb, readFileSync(join(RUNS, cond, f), "utf8"));
    const task = f.replace(/\.(tsx|jsx)$/, "");
    const byRule = Object.entries(vs.reduce<Record<string, number>>((m, v) => ((m[v.rule] = (m[v.rule] ?? 0) + 1), m), {}))
      .sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ×${n}`).join(", ");
    return {
      task,
      score: scoreViolations(vs),
      errors: vs.filter((v) => v.severity === "error").length,
      warns: vs.filter((v) => v.severity === "warn").length,
      rating: ratings[cond]?.[task],
      byRule,
    };
  });
  const rated = rows.map((r) => r.rating).filter((r): r is number => r !== undefined);
  summary.push(`| ${cond} | ${rows.length} | ${fmt(mean(rows.map((r) => r.score)))} | ${fmt(mean(rows.map((r) => r.errors)))} | ${fmt(mean(rows.map((r) => r.warns)))} | ${fmt(mean(rated))} |`);
  detail.push(`## ${cond}`, "", "| Task | Score | Errors | Warnings | Rating | Top violations |", "|---|---|---|---|---|---|");
  for (const r of rows) detail.push(`| ${r.task} | ${r.score} | ${r.errors} | ${r.warns} | ${r.rating ?? "–"} | ${r.byRule || "–"} |`);
  detail.push("");
}

const out = [...lines, ...summary, "", ...detail].join("\n");
writeFileSync("bench/results.md", out);
console.log(out);
