import { test, after } from "node:test";
import assert from "node:assert/strict";
import { check } from "../src/check.ts";
import { loadPlaybook } from "../src/playbook.ts";
import { closeBrowser } from "../src/visual.ts";

const pb = loadPlaybook();
after(closeBrowser);

test("exemplars pass the rendered check", { timeout: 60_000 }, async () => {
  for (const f of ["playbook/exemplars/dashboard.html", "playbook/exemplars/settings.html"]) {
    const r = await check(pb, { path: f });
    assert.deepEqual(r.violations, [], f);
  }
});

test("off-brand page fails on measured values", { timeout: 60_000 }, async () => {
  const r = await check(pb, { path: "examples/off-brand.html" });
  const found = new Set(r.violations.map((v) => v.rule));
  for (const rule of ["no-raw-colors", "spacing-scale", "type-scale", "radius-scale", "font-families", "no-shadows", "contrast", "no-horizontal-overflow"]) {
    assert.ok(found.has(rule), `expected ${rule}`);
  }
  assert.equal(r.screenshots.length, 3);
});
