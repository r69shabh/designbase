// Automated benchmark runner. See bench/README.md.
//   npm run bench:run -- --suite models|tool [--models a,b] [--tasks 01-dashboard,...] [--conditions A-screenshot,...]
//                        [--judge <model>|none] [--concurrency 6] [--force] [--dry-run]
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { loadPlaybook } from "../src/playbook.ts";
import { closeBrowser } from "../src/visual.ts";
import { CONDITIONS, fixMessage, initialMessages, type Condition, type Task } from "./lib/conditions.ts";
import { complete, extractCode, listModels, type Message } from "./lib/models.ts";
import { scoreFile, type Score } from "./lib/score.ts";

interface Config { judge: string; maxFixRounds: number; concurrency: number; suites: Record<string, Condition[]>; models: string[] }
export interface RunResult {
  model: string;
  condition: Condition;
  task: string;
  rounds: { composite: number; lint: number; visual: number | null; rendered: boolean }[];
  score: Omit<Score, "report"> | null;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  error?: string;
  finishedAt: string;
}

const BENCH = "bench";
const config: Config = JSON.parse(readFileSync(join(BENCH, "config.json"), "utf8"));
const tasks: (Task & { exemplar: string })[] = JSON.parse(readFileSync(join(BENCH, "tasks.json"), "utf8"));
const { values: args } = parseArgs({
  options: {
    suite: { type: "string", default: "tool" },
    models: { type: "string" },
    tasks: { type: "string" },
    conditions: { type: "string" },
    judge: { type: "string" },
    concurrency: { type: "string" },
    force: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

const slug = (model: string) => model.replace(/[/:]/g, "__");
export const runDir = (model: string, condition: string, task: string) => join(BENCH, "runs", slug(model), condition, task);

const models = args.models ? args.models.split(",") : config.models;
const conditions = (args.conditions ? args.conditions.split(",") : config.suites[args.suite!]) as Condition[];
if (!conditions) throw new Error(`Unknown suite ${args.suite}. Suites: ${Object.keys(config.suites).join(", ")}`);
for (const c of conditions) if (!(c in CONDITIONS)) throw new Error(`Unknown condition ${c}`);
const selectedTasks = args.tasks ? tasks.filter((t) => args.tasks!.split(",").includes(t.id)) : tasks;
const judge = args.judge === "none" ? undefined : args.judge ?? config.judge;
const concurrency = Number(args.concurrency ?? config.concurrency);

const catalog = await listModels();
for (const m of [...models, ...(judge ? [judge] : [])]) if (!catalog.has(m)) throw new Error(`OpenRouter has no model "${m}"`);

const jobs = models.flatMap((model) =>
  conditions.flatMap((condition) =>
    selectedTasks
      // Screenshot condition needs a vision model.
      .filter(() => condition !== "A-screenshot" || catalog.get(model)!.vision)
      .map((task) => ({ model, condition, task })),
  ),
);
const todo = jobs.filter((j) => args.force || !existsSync(join(runDir(j.model, j.condition, j.task.id), "result.json")));

// Rough token budget per job, for the estimate only. Reasoning models can use several times more output.
const EST: Record<Condition, { in: number; out: number }> = {
  "A-screenshot": { in: 4_000, out: 5_000 },
  "B-dump": { in: 7_000, out: 5_000 },
  "C-brief": { in: 4_500, out: 5_000 },
  "D-loop": { in: 16_000, out: 11_000 },
};
const estimate = todo.reduce((sum, j) => {
  const m = catalog.get(j.model)!;
  const e = EST[j.condition];
  const judgeCost = judge ? 4_000 * catalog.get(judge)!.promptPrice + 300 * catalog.get(judge)!.completionPrice : 0;
  return sum + e.in * m.promptPrice + e.out * m.completionPrice + judgeCost;
}, 0);

console.log(`designbase bench — suite "${args.suite}"`);
console.log(`  models: ${models.length}  conditions: ${conditions.join(", ")}  tasks: ${selectedTasks.length}  judge: ${judge ?? "none"}`);
console.log(`  jobs: ${jobs.length} (${jobs.length - todo.length} cached, ${todo.length} to run)  estimated cost: ~$${estimate.toFixed(2)} (reasoning-heavy models can run 2-3× higher)`);
if (args["dry-run"]) process.exit(0);

const pb = loadPlaybook();
const assets = join(BENCH, "assets");
let done = 0;
let spent = 0;

async function runJob({ model, condition, task }: (typeof todo)[number]): Promise<void> {
  const dir = runDir(model, condition, task.id);
  mkdirSync(dir, { recursive: true });
  const exemplar = join(assets, `${task.exemplar}.png`);
  const messages: Message[] = initialMessages(pb, condition, task, assets);
  const result: RunResult = { model, condition, task: task.id, rounds: [], score: null, inputTokens: 0, outputTokens: 0, cost: 0, latencyMs: 0, finishedAt: "" };
  const maxRounds = condition === "D-loop" ? config.maxFixRounds + 1 : 1;

  try {
    for (let round = 0; round < maxRounds; round++) {
      const res = await complete(model, messages);
      result.inputTokens += res.inputTokens;
      result.outputTokens += res.outputTokens;
      result.cost += res.cost;
      result.latencyMs += res.latencyMs;
      const code = extractCode(res.text);
      const file = join(dir, round === 0 ? "output.tsx" : `output.round${round}.tsx`);
      writeFileSync(file, code);
      messages.push({ role: "assistant", content: res.text });

      const last = round === maxRounds - 1;
      // Judge only the final file, so the loop's cost doesn't multiply the judge's.
      let s = await scoreFile(pb, file, join(dir, `work${round}`), last ? judge : undefined, exemplar);
      result.rounds.push({ composite: s.composite, lint: s.lint.score, visual: s.visual?.score ?? null, rendered: s.render.ok });
      if (s.passed || last) {
        if (!last && judge) s = await scoreFile(pb, file, join(dir, "final"), judge, exemplar);
        if (s.screenshot) copyFileSync(s.screenshot, join(dir, "screenshot.png"));
        const { report, ...rest } = s;
        result.score = rest;
        writeFileSync(join(dir, "final.tsx"), code);
        writeFileSync(join(dir, "report.txt"), report);
        break;
      }
      messages.push(fixMessage(s.report));
    }
  } catch (e) {
    result.error = (e as Error).message;
  }
  result.finishedAt = new Date().toISOString();
  // Transcript without image payloads.
  writeFileSync(join(dir, "transcript.json"), JSON.stringify(messages.map((m) => ({ ...m, content: typeof m.content === "string" ? m.content : m.content.map((p) => (p.type === "text" ? p : { type: "image" })) })), null, 2));
  if (!result.error) writeFileSync(join(dir, "result.json"), JSON.stringify(result, null, 2));
  else writeFileSync(join(dir, "error.json"), JSON.stringify(result, null, 2));

  spent += result.cost;
  done++;
  const s = result.score;
  console.log(
    `[${done}/${todo.length}] ${model} ${condition} ${task.id}: ` +
      (result.error ? `ERROR ${result.error.slice(0, 120)}` : `composite ${s!.composite} (lint ${s!.lint.score}, visual ${s!.visual?.score ?? "no render"}${s!.judge ? `, judge ${s!.judge.score}/10` : ""}${condition === "D-loop" ? `, rounds ${result.rounds.length}` : ""}) $${result.cost.toFixed(3)} — total $${spent.toFixed(2)}`),
  );
}

// Simple worker pool.
const queue = [...todo];
await Promise.all(
  Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    for (let job; (job = queue.shift()); ) await runJob(job);
  }),
);
await closeBrowser();
console.log(`Done. Spent $${spent.toFixed(2)}. Run \`npm run bench:report\` for the leaderboard.`);
