import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApp } from "../src/api/app.ts";
import { startWorker } from "../src/api/worker.ts";
import { fromDirectory } from "../src/core/materialize.ts";
import { Store } from "../src/store/db.ts";
import { closeBrowser } from "../src/visual.ts";

const store = new Store(mkdtempSync(join(tmpdir(), "designbase-api-")));
const app = createApp(store, { auth: "local" });
const worker = startWorker(store, { pollMs: 100 });
after(async () => {
  await worker.stop();
  await closeBrowser();
  store.close();
});

const call = async (method: string, path: string, body?: unknown) => {
  const res = await app.request(path, body instanceof FormData ? { method, body } : { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const type = res.headers.get("content-type") ?? "";
  return { status: res.status, body: type.includes("json") ? await res.json() : await res.text() };
};
const waitFor = async (jobId: string) => {
  for (let i = 0; i < 600; i++) {
    const { body } = await call("GET", `/v1/jobs/${jobId}`);
    if (["done", "failed", "cancelled"].includes(body.status)) return body;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("job timed out");
};

test("extract → review → apply → brief → check, through the API", { timeout: 180_000 }, async () => {
  const pb = (await call("POST", "/v1/playbooks", { name: "Extracted Almanac" })).body;
  assert.ok(pb.id);

  for (const f of ["dashboard", "settings"]) {
    const r = await call("POST", `/v1/playbooks/${pb.id}/sources`, { url: resolve(`playbook/exemplars/${f}.html`) });
    assert.equal(r.status, 201);
  }
  const form = new FormData();
  form.append("file", new File([readFileSync("bench/assets/dashboard.png")], "dashboard.png", { type: "image/png" }));
  assert.equal((await call("POST", `/v1/playbooks/${pb.id}/sources`, form)).status, 201);

  const job = (await call("POST", `/v1/playbooks/${pb.id}/extract`, { interpret: false })).body;
  const done = await waitFor(job.id);
  assert.equal(done.status, "done", done.error);
  assert.ok(done.result.proposals > 20);

  // Extraction accuracy against the hand-written Almanac tokens.
  const proposals = (await call("GET", `/v1/playbooks/${pb.id}/proposals?status=open`)).body.proposals;
  const truth = JSON.parse(readFileSync("playbook/tokens.json", "utf8"));
  const values = (cat: string) => new Set(proposals.filter((p: any) => p.kind === "token" && p.data.category === cat).map((p: any) => p.data.value));
  const trueColors = new Set(Object.values(truth.color).map((c: any) => c.value));
  for (const hex of trueColors) assert.ok(values("color").has(hex), `colour ${hex} recovered`);
  for (const px of [8, 12, 16, 24, 32, 48, 64]) assert.ok(values("spacing").has(px), `spacing ${px}px recovered`);
  for (const px of [12, 14, 16, 20, 40, 56]) assert.ok(values("fontSize").has(px), `font size ${px}px recovered`);
  assert.deepEqual([...values("font")].sort(), ["Fraunces", "IBM Plex Mono", "IBM Plex Sans"]);

  const accepted = (await call("POST", `/v1/playbooks/${pb.id}/proposals/accept`, { minConfidence: 0.5 })).body.accepted;
  assert.ok(accepted > 20);
  const applied = await call("POST", `/v1/playbooks/${pb.id}/apply`, { message: "First extraction" });
  assert.equal(applied.status, 201);

  const versions = (await call("GET", `/v1/playbooks/${pb.id}/versions`)).body.versions;
  assert.equal(versions.length, 1);
  const css = (await call("GET", `/v1/playbooks/${pb.id}/tokens?format=css`)).body;
  assert.match(css, /--color-background: #F4F1EA/);

  const brief = (await call("POST", `/v1/playbooks/${pb.id}/brief`, { task: "settings page" })).body;
  assert.match(brief, /Spacing from the scale only/);

  const bad = (await call("POST", `/v1/playbooks/${pb.id}/check`, { code: `<div className="p-5 bg-blue-500 shadow-lg rounded-2xl" />` })).body;
  assert.equal(bad.passed, false);
  const rules = new Set(bad.violations.map((v: any) => v.rule));
  for (const r of ["spacing-scale", "no-raw-colors", "no-shadows", "radius-scale"]) assert.ok(rules.has(r), r);
  const good = (await call("POST", `/v1/playbooks/${pb.id}/check`, { code: `<div className="p-6 bg-background rounded-md" />` })).body;
  assert.equal(good.passed, true, good.report);
});

test("importing content creates a version; diff and auth errors behave", async () => {
  const content = fromDirectory("playbook");
  const pb = (await call("POST", "/v1/playbooks", { name: "Almanac", content })).body;
  assert.ok(pb.headVersion);
  const next = structuredClone(content);
  (next.tokens as any).color.accent.$value.hex = "#C2410C";
  const v2 = (await call("POST", `/v1/playbooks/${pb.id}/versions`, { content: next, message: "Warmer" })).body;
  const diff = (await call("GET", `/v1/playbooks/${pb.id}/diff?from=${pb.headVersion}&to=${v2.id}`)).body;
  assert.deepEqual(diff.text, ["token color.accent: #B8401A → #C2410C"]);

  assert.equal((await call("GET", "/v1/playbooks/nope")).status, 404);
  assert.equal((await call("POST", "/v1/playbooks", { nope: 1 })).status, 400);

  const keyed = createApp(store, { auth: "keys" });
  assert.equal((await keyed.request("/v1/playbooks")).status, 401);
  const key = store.createApiKey(pb.workspaceId, "read");
  const ok = await keyed.request("/v1/playbooks", { headers: { authorization: `Bearer ${key}` } });
  assert.equal(ok.status, 200);
  const denied = await keyed.request("/v1/playbooks", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: "{}" });
  assert.equal(denied.status, 403);
});
