// Automated benchmark runner. See bench/README.md.
//   npm run bench:run -- --suite models|tool [--models a,b] [--tasks 01-dashboard,...] [--conditions A-screenshot,...]
//                        [--judge <model>|none] [--concurrency 6] [--force] [--dry-run]
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { loadPlaybook } from "../src/playbook.ts";
import { closeBrowser } from "../src/visual.ts";
import { CONDITIONS, fixMessage, initialMessages, type Condition, type Task } from "./lib/conditions.ts";
import { checkProviders, complete, extractCode, parseModel, type Message, type ModelSpec, type Provider } from "./lib/models.ts";
import { scoreFile, type Score } from "./lib/score.ts";

interface Config { judge: string; maxFixRounds: number; concurrency: number; suites: Record<string, Condition[]>; models: ModelSpec[] }
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

// Keys can live in a git-ignored .env as well as the shell environment.
try {
  process.loadEnvFile(".env");
} catch {}

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

const requested: ModelSpec[] = args.models
  ? args.models.split(",").map((id) => config.models.find((m) => m.id === id) ?? { id, vision: false })
  : config.models;
const conditions = (args.conditions ? args.conditions.split(",") : config.suites[args.suite!]) as Condition[];
if (!conditions) throw new Error(`Unknown suite ${args.suite}. Suites: ${Object.keys(config.suites).join(", ")}`);
for (const c of conditions) if (!(c in CONDITIONS)) throw new Error(`Unknown condition ${c}`);
const selectedTasks = args.tasks ? tasks.filter((t) => args.tasks!.split(",").includes(t.id)) : tasks;
let judge = args.judge === "none" ? undefined : args.judge ?? config.judge;
const concurrency = Number(args.concurrency ?? config.concurrency);

// Drop models whose provider key is missing or rejected, instead of failing every call.
const providers = await checkProviders([...new Set([...requested.map((m) => m.id), ...(judge ? [judge] : [])].map((id) => parseModel(id).provider))]);
for (const [p, s] of providers) if (!s.ok) console.warn(`  ! skipping ${p} models: ${s.reason}`);
const available = (id: string) => {
  const { provider, model } = parseModel(id);
  const p = providers.get(provider)!;
  return p.ok && p.models.has(model);
};
const models = requested.filter((m) => {
  if (!providers.get(parseModel(m.id).provider)!.ok) return false;
  if (!available(m.id)) console.warn(`  ! ${m.id}: provider doesn't list this model, skipping`);
  return available(m.id);
});
if (judge && !available(judge)) {
  console.warn(`  ! judge ${judge} unavailable, running without a judge`);
  judge = undefined;
}
const price = (id: string): [number, number] => {
  const { provider, model } = parseModel(id);
  return providers.get(provider)!.prices.get(model) ?? [0, 0];
};

const jobs = models.flatMap((m) =>
  conditions.flatMap((condition) =>
    selectedTasks
      // Screenshot condition needs a vision model.
      .filter(() => condition !== "A-screenshot" || m.vision)
      .map((task) => ({ model: m.id, condition, task })),
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
  const [pin, pout] = price(j.model);
  const e = EST[j.condition];
  const [jin, jout] = judge ? price(judge) : [0, 0];
  return sum + e.in * pin + e.out * pout + 4_000 * jin + 300 * jout;
}, 0);

console.log(`designbase bench — suite "${args.suite}"`);
console.log(`  models: ${models.map((m) => m.id).join(", ")}`);
console.log(`  count: ${models.length}  conditions: ${conditions.join(", ")}  tasks: ${selectedTasks.length}  judge: ${judge ?? "none"}`);
console.log(`  jobs: ${jobs.length} (${jobs.length - todo.length} cached, ${todo.length} to run)  estimated cost: ~$${estimate.toFixed(2)} where the provider publishes prices (OpenRouter, Groq); reasoning-heavy models can run 2-3× higher. Gemini and NVIDIA usage is not estimated.`);
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
