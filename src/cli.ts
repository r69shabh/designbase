#!/usr/bin/env -S npx tsx
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { buildBrief, dumpPlaybook } from "./brief.ts";
import { check } from "./check.ts";
import { loadPlaybook } from "./playbook.ts";
import { exportTokens, type TokenFormat } from "./tokens.ts";
import { closeBrowser } from "./visual.ts";

const USAGE = `designbase — Phase 0

  brief "<task>"            Print the design brief an agent would get for a task
  dump                      Print the whole playbook as one document (benchmark baseline)
  check <file|url> [...]    Lint .tsx/.jsx, or render .html / a URL and measure it. Exit 1 on errors.
  tokens [json|css|tailwind-v4|tailwind-v3]
  hook                      Claude Code PostToolUse hook: reads the hook JSON on stdin, checks the edited file

Env: DESIGNBASE_PLAYBOOK=<dir> to use a playbook other than ./playbook`;

const [cmd, ...args] = process.argv.slice(2);
const pb = loadPlaybook();

switch (cmd) {
  case "brief":
    if (!args.length) fail('usage: brief "<task>"');
    console.log(buildBrief(pb, args.join(" ")));
    break;
  case "dump":
    console.log(dumpPlaybook(pb));
    break;
  case "tokens":
    console.log(exportTokens(pb, (args[0] ?? "tailwind-v4") as TokenFormat));
    break;
  case "check": {
    if (!args.length) fail("usage: check <file|url> [...]");
    let failed = false;
    for (const target of args) {
      const r = await check(pb, /^https?:\/\//.test(target) ? { url: target } : { path: target });
      console.log(r.report);
      for (const s of r.screenshots) console.log(`  screenshot ${s.viewport}: ${s.path}`);
      failed ||= !r.passed;
    }
    await closeBrowser();
    process.exit(failed ? 1 : 0);
  }
  case "hook": {
    // PostToolUse: exit 2 sends stderr back to Claude so it fixes the violations in the same turn.
    const input = JSON.parse(readFileSync(0, "utf8") || "{}");
    const file: string | undefined = input.tool_input?.file_path;
    if (!file || !/\.(tsx|jsx)$/.test(extname(file)) || file.includes("node_modules")) process.exit(0);
    const r = await check(pb, { path: file });
    if (r.passed) process.exit(0);
    process.stderr.write(`designbase: this file breaks the ${pb.tokens.name} playbook. Fix these before moving on.\n${r.report}\n`);
    process.exit(2);
  }
  default:
    console.log(USAGE);
    if (cmd && cmd !== "help" && cmd !== "--help") process.exit(1);
}

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}
