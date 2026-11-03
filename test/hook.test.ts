import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const hook = (file: string) =>
  spawnSync("npx", ["tsx", "src/cli.ts", "hook"], { input: JSON.stringify({ tool_input: { file_path: resolve(file) } }), encoding: "utf8" });

test("hook blocks an off-brand file with exit 2 and feedback on stderr", () => {
  const r = hook("examples/off-brand.tsx");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /breaks the Almanac playbook/);
});

test("hook lets clean files and non-UI files through", () => {
  assert.equal(hook("examples/on-brand.tsx").status, 0);
  assert.equal(hook("package.json").status, 0);
});
