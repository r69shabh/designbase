import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deltaE2000, matchSets, scoreTokens } from "../bench/extract/score.ts";
import { makePages, makeSystem } from "../bench/extract/synth.ts";
import { measureUrl } from "../src/designer/measure.ts";
import { synthesize } from "../src/designer/synthesize.ts";
import { closeBrowser } from "../src/visual.ts";

after(closeBrowser);

test("CIEDE2000 behaves like the reference", () => {
  assert.equal(deltaE2000("#336699", "#336699"), 0);
  assert.ok(Math.abs(deltaE2000("#000000", "#FFFFFF") - 100) < 0.01);
  assert.ok(deltaE2000("#B8401A", "#B9411B") < 1, "one-step difference is imperceptible");
  assert.ok(deltaE2000("#B8401A", "#C05040") > 3, "the VLM's guess is a different colour");
});

test("matchSets is one-to-one under tolerance", () => {
  const r = matchSets([8, 16, 20], [8, 16, 24], (a, b) => Math.abs(a - b), 0, String);
  assert.deepEqual([r.precision, r.recall, r.missed, r.extra], [2 / 3, 2 / 3, ["24"], ["20"]]);
});

test("synthetic systems are deterministic and fully marked", () => {
  assert.deepEqual(makeSystem(3), makeSystem(3));
  assert.notDeepEqual(makeSystem(3).colors, makeSystem(4).colors);
  const { pages, truth } = makePages(makeSystem(5));
  assert.deepEqual(Object.keys(truth.components).sort(), ["badge", "button", "card", "input", "stat", "table"]);
  assert.deepEqual(truth.components.button, ["danger", "primary", "secondary"]);
  assert.ok(!/style="[^"]*"[^ >]*"/.test(pages.dashboard), "no broken style attributes");
});

test("a synthetic case extracts exactly from the live page", { timeout: 60_000 }, async () => {
  const sys = makeSystem(1);
  const { pages, truth } = makePages(sys);
  const dir = mkdtempSync(join(tmpdir(), "extractbench-"));
  const urls = [];
  for (const [name, html] of Object.entries(pages)) {
    const f = join(dir, `${name}.html`);
    writeFileSync(f, html);
    urls.push(await measureUrl(f));
  }
  const s = scoreTokens(synthesize(urls, []).tokens, { ...truth, roles: { background: sys.colors.background, accent: sys.colors.accent, border: sys.colors.border } });
  assert.ok(s.colors.f1 >= 0.9, `colour F1 ${s.colors.f1} missed ${s.colors.missed}`);
  assert.equal(s.fontSizes!.f1, 1, `type missed ${s.fontSizes!.missed} extra ${s.fontSizes!.extra}`);
  assert.equal(s.spacing!.recall, 1);
  assert.equal(s.fonts!.f1, 1);
  assert.equal(s.roles!.accuracy, 1, s.roles!.wrong.join("; "));
  assert.equal(s.shadows, true);
});
