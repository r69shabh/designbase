import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { lintSource } from "../src/lint.ts";
import { loadPlaybook } from "../src/playbook.ts";

const pb = loadPlaybook();
const rules = (src: string) => new Set(lintSource(pb, src).map((v) => v.rule));

test("off-brand example trips every lint rule it was written to trip", () => {
  const found = rules(readFileSync("examples/off-brand.tsx", "utf8"));
  for (const r of ["no-raw-colors", "no-arbitrary-values", "spacing-scale", "type-scale", "font-families", "radius-scale", "no-shadows", "no-gradients", "use-components", "one-primary-action", "no-inline-styles", "heading-order", "img-alt"]) {
    assert.ok(found.has(r), `expected ${r}`);
  }
});

test("on-brand example and every playbook component are clean", () => {
  assert.deepEqual(lintSource(pb, readFileSync("examples/on-brand.tsx", "utf8")), []);
  for (const f of readdirSync("playbook/components")) {
    assert.deepEqual(lintSource(pb, readFileSync(`playbook/components/${f}`, "utf8"), { isComponentSource: true }), [], f);
  }
});

test("variant prefixes and opacity modifiers are understood", () => {
  assert.deepEqual(lintSource(pb, `<div className="md:p-6 hover:bg-paper-2 bg-ink/50 -mt-4 mx-auto" />`), []);
  assert.ok(rules(`<div className="md:p-5" />`).has("spacing-scale"));
  assert.ok(rules(`<div className="hover:bg-blue-500" />`).has("no-raw-colors"));
});

test("spacing errors suggest the nearest steps", () => {
  const [v] = lintSource(pb, `<div className="gap-10" />`);
  assert.match(v.message, /gap-8 \(32px\) or gap-12 \(48px\)/);
});

test("non-class strings don't trigger colour rules", () => {
  assert.deepEqual(lintSource(pb, `const label = "text center"; const k = "border-collapse";`), []);
});
