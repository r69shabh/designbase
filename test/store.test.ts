import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fromDirectory, materialize } from "../src/core/materialize.ts";
import { tokensFromDtcg } from "../src/core/dtcg.ts";
import { Store } from "../src/store/db.ts";

const tmp = () => mkdtempSync(join(tmpdir(), "designbase-"));

test("Almanac round-trips through DTCG unchanged", async () => {
  const c = fromDirectory("playbook");
  const { readFileSync } = await import("node:fs");
  assert.deepEqual(tokensFromDtcg(c.tokens, { name: c.name, description: c.description }), JSON.parse(readFileSync("playbook/tokens.json", "utf8")));
  const pb = materialize(c, join(tmp(), "pb"));
  assert.equal(pb.components.length, 9);
  assert.deepEqual(pb.components.find((x) => x.name === "Button")?.replaces, ["button"]);
});

test("versions are content-addressed, immutable and diffed", () => {
  const store = new Store(tmp());
  const ws = store.createWorkspace("Acme");
  const content = fromDirectory("playbook");
  const pb = store.createPlaybook(ws.id, "Almanac", content);
  const v1 = pb.headVersion!;
  assert.equal(store.commit(pb.id, content, "same").created, false);

  const next = structuredClone(content);
  (next.tokens as any).color.accent.$value.hex = "#C2410C";
  const v2 = store.commit(pb.id, next, "Warmer accent");
  assert.ok(v2.created);
  assert.deepEqual(v2.changes.map((c) => `${c.area}:${c.key}:${c.op}`), ["token:color.accent:changed"]);
  assert.equal(store.version(pb.id)!.parent, v1);
  assert.equal(store.versions(pb.id).length, 2);
  store.close();
});

test("jobs: claim, progress, finish; expired leases are reclaimed", () => {
  const store = new Store(tmp());
  const job = store.enqueue("extract", { x: 1 });
  const claimed = store.claimJob(-1)!; // lease already expired
  assert.equal(claimed.id, job.id);
  assert.equal(store.claimJob()!.attempts, 2, "an expired lease is reclaimable");
  store.progress(job.id, "measuring", 0.01);
  store.finishJob(job.id, { result: { ok: true } });
  const done = store.job(job.id)!;
  assert.equal(done.status, "done");
  assert.equal(done.progress[0].message, "measuring");
  assert.equal(store.claimJob(), null);
  store.close();
});

test("proposals and reviews; assets dedupe; api keys", () => {
  const store = new Store(tmp());
  const ws = store.createWorkspace("Acme");
  const pb = store.createPlaybook(ws.id, "Draft");
  const p = store.addProposal({ playbookId: pb.id, jobId: null, kind: "token", key: "color.accent", data: { hex: "#B8401A" }, confidence: 0.9, evidence: [] });
  store.review(p.id, "accept", { edited: { hex: "#C2410C" }, note: "warmer" });
  assert.deepEqual(store.proposal(p.id)!.data, { hex: "#C2410C" });
  assert.equal(store.proposals(pb.id, "open").length, 0);
  const a = store.putAsset(Buffer.from("x"), "text/plain");
  assert.equal(store.putAsset(Buffer.from("x"), "text/plain").hash, a.hash);
  const key = store.createApiKey(ws.id, "write");
  assert.deepEqual(store.resolveApiKey(key), { workspaceId: ws.id, scope: "write" });
  assert.equal(store.resolveApiKey("dbk_nope"), null);
  store.close();
});
