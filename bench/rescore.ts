// Re-score cached outputs without calling any model, e.g. after a scorer change.
//   npm run bench:rescore [-- --judge <model>]
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { loadPlaybook } from "../src/playbook.ts";
import { closeBrowser } from "../src/visual.ts";
import { scoreFile } from "./lib/score.ts";
import type { RunResult } from "./run.ts";

try {
  process.loadEnvFile(".env");
} catch {}
const { values: args } = parseArgs({ options: { judge: { type: "string" } } });
const pb = loadPlaybook();
const tasks: { id: string; exemplar: string }[] = JSON.parse(readFileSync("bench/tasks.json", "utf8"));

const dirs = readdirSync("bench/runs", { recursive: true, withFileTypes: true })
  .filter((d) => d.name === "result.json")
  .map((d) => d.parentPath);
let n = 0;
for (const dir of dirs) {
  const result: RunResult = JSON.parse(readFileSync(join(dir, "result.json"), "utf8"));
  if (!existsSync(join(dir, "final.tsx"))) continue;
  const exemplar = join("bench/assets", `${tasks.find((t) => t.id === result.task)?.exemplar ?? "dashboard"}.png`);
  const { report, ...score } = await scoreFile(pb, join(dir, "final.tsx"), join(dir, "final"), args.judge, exemplar);
  // Keep a previous judge score unless a new judge was asked for.
  result.score = { ...score, judge: args.judge ? score.judge : result.score?.judge ?? null };
  writeFileSync(join(dir, "result.json"), JSON.stringify(result, null, 2));
  writeFileSync(join(dir, "report.txt"), report);
  console.log(`[${++n}/${dirs.length}] ${result.model} ${result.condition} ${result.task}: ${score.composite}`);
}
await closeBrowser();
