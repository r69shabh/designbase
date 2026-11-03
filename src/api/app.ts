// designbase HTTP API (v1). Local mode (default) needs no key and uses a "local" workspace;
// set DESIGNBASE_AUTH=keys to require `Authorization: Bearer dbk_…`.
import { Hono, type Context } from "hono";
import { streamSSE } from "hono/streaming";
import { HTTPException } from "hono/http-exception";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { buildBrief } from "../brief.ts";
import { check } from "../check.ts";
import { materialize } from "../core/materialize.ts";
import { PlaybookContent } from "../core/schema.ts";
import { describeChange, diffContent } from "../core/version.ts";
import { acceptAbove, applyProposals } from "../designer/extract.ts";
import { loadPlaybook, type Playbook } from "../playbook.ts";
import type { Store } from "../store/db.ts";
import { exportTokens, type TokenFormat } from "../tokens.ts";

type Env = { Variables: { workspaceId: string; scope: "read" | "write" } };

const parse = async <T>(c: Context, schema: z.ZodType<T>): Promise<T> => {
  const body = await c.req.json().catch(() => {
    throw new HTTPException(400, { message: "Body must be JSON" });
  });
  const r = schema.safeParse(body);
  if (!r.success) throw new HTTPException(400, { message: z.prettifyError(r.error) });
  return r.data;
};

export function createApp(store: Store, opts: { auth?: "local" | "keys" } = {}) {
  const auth = opts.auth ?? (process.env.DESIGNBASE_AUTH === "keys" ? "keys" : "local");
  const app = new Hono<Env>();

  app.onError((err, c) => {
    if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
    console.error(err);
    return c.json({ error: err.message }, 500);
  });

  app.get("/v1/health", (c) => c.json({ ok: true, auth }));

  app.use("/v1/*", async (c, next) => {
    if (c.req.path === "/v1/health") return next();
    const header = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (header) {
      const key = store.resolveApiKey(header);
      if (!key) throw new HTTPException(401, { message: "Invalid API key" });
      c.set("workspaceId", key.workspaceId);
      c.set("scope", key.scope);
    } else if (auth === "local") {
      const ws = (store.workspaces() as { id: string; name: string }[]).find((w) => w.name === "local") ?? store.createWorkspace("local");
      c.set("workspaceId", ws.id);
      c.set("scope", "write");
    } else {
      throw new HTTPException(401, { message: "Missing API key" });
    }
    if (c.req.method !== "GET" && c.get("scope") !== "write") throw new HTTPException(403, { message: "Read-only key" });
    await next();
  });

  const playbookOr404 = (c: Context<Env>) => {
    const pb = store.playbook(c.req.param("id")!);
    if (!pb || pb.workspaceId !== c.get("workspaceId")) throw new HTTPException(404, { message: "No such playbook" });
    return pb;
  };
  /** The head version, written out where the engine can read it (cached per version). */
  const engineFor = (playbookId: string, versionId?: string): Playbook => {
    const v = store.version(playbookId, versionId);
    if (!v) throw new HTTPException(409, { message: "Playbook has no version yet. Extract and apply proposals, or import content." });
    const dir = join(store.dir, "materialized", playbookId, v.id);
    return existsSync(join(dir, "tokens.json")) ? loadPlaybook(dir) : materialize(v.content, dir);
  };

  // --- workspaces & keys ---
  app.post("/v1/keys", async (c) => {
    const { scope, label } = await parse(c, z.object({ scope: z.enum(["read", "write"]).default("write"), label: z.string().optional() }));
    return c.json({ key: store.createApiKey(c.get("workspaceId"), scope, label), scope }, 201);
  });

  // --- playbooks ---
  app.get("/v1/playbooks", (c) => c.json({ playbooks: store.playbooks(c.get("workspaceId")) }));
  app.post("/v1/playbooks", async (c) => {
    const { name, content } = await parse(c, z.object({ name: z.string().min(1), content: PlaybookContent.optional() }));
    return c.json(store.createPlaybook(c.get("workspaceId"), name, content), 201);
  });
  app.get("/v1/playbooks/:id", (c) => {
    const pb = playbookOr404(c);
    return c.json({ ...pb, sources: store.sources(pb.id).length, openProposals: store.proposals(pb.id, "open").length });
  });

  // --- versions ---
  app.get("/v1/playbooks/:id/versions", (c) => c.json({ versions: store.versions(playbookOr404(c).id) }));
  app.get("/v1/playbooks/:id/versions/:vid", (c) => {
    const v = store.version(playbookOr404(c).id, c.req.param("vid") === "head" ? undefined : c.req.param("vid"));
    if (!v) throw new HTTPException(404, { message: "No such version" });
    return c.json(v);
  });
  app.post("/v1/playbooks/:id/versions", async (c) => {
    const pb = playbookOr404(c);
    const { content, message } = await parse(c, z.object({ content: PlaybookContent, message: z.string().default("Update") }));
    return c.json(store.commit(pb.id, content, message), 201);
  });
  app.get("/v1/playbooks/:id/diff", (c) => {
    const pb = playbookOr404(c);
    const from = store.version(pb.id, c.req.query("from"));
    const to = store.version(pb.id, c.req.query("to") ?? undefined);
    if (!from || !to) throw new HTTPException(404, { message: "Pass ?from=<version>&to=<version> (to defaults to head)" });
    const changes = diffContent(from.content, to.content);
    return c.json({ from: from.id, to: to.id, changes, text: changes.map(describeChange) });
  });
  app.get("/v1/playbooks/:id/tokens", (c) => {
    const pb = playbookOr404(c);
    const format = (c.req.query("format") ?? "dtcg") as TokenFormat | "dtcg";
    if (format === "dtcg") return c.json(store.version(pb.id)?.content.tokens ?? {});
    return c.text(exportTokens(engineFor(pb.id), format));
  });

  // --- sources ---
  app.get("/v1/playbooks/:id/sources", (c) => c.json({ sources: store.sources(playbookOr404(c).id) }));
  app.post("/v1/playbooks/:id/sources", async (c) => {
    const pb = playbookOr404(c);
    if ((c.req.header("content-type") ?? "").startsWith("multipart/")) {
      const form = await c.req.parseBody({ all: true });
      const files = [form.file ?? form.files ?? []].flat().filter((f): f is File => f instanceof File);
      if (!files.length) throw new HTTPException(400, { message: "Upload image files in a `file` field" });
      const added = [];
      for (const f of files) {
        if (!/^image\/(png|jpeg|webp)$/.test(f.type)) throw new HTTPException(415, { message: `${f.name}: only PNG, JPEG or WebP screenshots` });
        const asset = store.putAsset(Buffer.from(await f.arrayBuffer()), f.type, f.name);
        added.push(store.addSource(pb.id, "screenshot", { asset: asset.hash, meta: { name: f.name, size: f.size } }));
      }
      return c.json({ sources: added }, 201);
    }
    const { url } = await parse(c, z.object({ url: z.string().min(1) }));
    if (!/^https?:\/\//.test(url) && auth !== "local") throw new HTTPException(400, { message: "URL must be http(s)" });
    return c.json(store.addSource(pb.id, "url", { uri: url }), 201);
  });

  // --- extraction & jobs ---
  app.post("/v1/playbooks/:id/extract", async (c) => {
    const pb = playbookOr404(c);
    const body = await c.req.json().catch(() => ({}));
    const { sources, interpret } = z.object({ sources: z.array(z.string()).optional(), interpret: z.boolean().default(true) }).parse(body);
    return c.json(store.enqueue("extract", { playbookId: pb.id, sources, interpret }, pb.id), 202);
  });
  const jobOr404 = (c: Context<Env>) => {
    const job = store.job(c.req.param("jobId")!);
    const pb = job?.playbookId ? store.playbook(job.playbookId) : null;
    if (!job || (pb && pb.workspaceId !== c.get("workspaceId"))) throw new HTTPException(404, { message: "No such job" });
    return job;
  };
  app.get("/v1/jobs/:jobId", (c) => c.json(jobOr404(c)));
  app.post("/v1/jobs/:jobId/cancel", (c) => {
    store.cancelJob(jobOr404(c).id);
    return c.json(store.job(c.req.param("jobId"))!);
  });
  app.get("/v1/jobs/:jobId/events", (c) => {
    const id = jobOr404(c).id;
    return streamSSE(c, async (stream) => {
      let sent = 0;
      for (;;) {
        const job = store.job(id)!;
        for (const p of job.progress.slice(sent)) await stream.writeSSE({ event: "progress", data: JSON.stringify(p) });
        sent = job.progress.length;
        if (["done", "failed", "cancelled"].includes(job.status)) {
          await stream.writeSSE({ event: job.status, data: JSON.stringify({ result: job.result, error: job.error }) });
          return;
        }
        await stream.sleep(500);
      }
    });
  });

  // --- proposals & review ---
  app.get("/v1/playbooks/:id/proposals", (c) => {
    const status = c.req.query("status") as "open" | undefined;
    return c.json({ proposals: store.proposals(playbookOr404(c).id, status) });
  });
  app.post("/v1/proposals/:pid/review", async (c) => {
    const p = store.proposal(c.req.param("pid"));
    if (!p || store.playbook(p.playbookId)?.workspaceId !== c.get("workspaceId")) throw new HTTPException(404, { message: "No such proposal" });
    if (p.status !== "open") throw new HTTPException(409, { message: `Proposal is ${p.status}` });
    const { decision, edited, note } = await parse(c, z.object({ decision: z.enum(["accept", "reject"]), edited: z.unknown().optional(), note: z.string().optional() }));
    return c.json(store.review(p.id, decision, { edited, note }));
  });
  app.post("/v1/playbooks/:id/proposals/accept", async (c) => {
    const { minConfidence } = await parse(c, z.object({ minConfidence: z.number().min(0).max(1) }));
    return c.json({ accepted: acceptAbove(store, playbookOr404(c).id, minConfidence) });
  });
  app.post("/v1/playbooks/:id/apply", async (c) => {
    const pb = playbookOr404(c);
    const { message } = await parse(c, z.object({ message: z.string().default("Apply reviewed proposals") }));
    try {
      const r = applyProposals(store, pb.id, message);
      return c.json({ ...r, text: r.changes.map(describeChange) }, 201);
    } catch (e) {
      throw new HTTPException(409, { message: (e as Error).message });
    }
  });

  // --- engine ---
  app.post("/v1/playbooks/:id/brief", async (c) => {
    const pb = playbookOr404(c);
    const { task, version } = await parse(c, z.object({ task: z.string().min(3), version: z.string().optional() }));
    return c.text(buildBrief(engineFor(pb.id, version), task));
  });
  app.post("/v1/playbooks/:id/check", async (c) => {
    const pb = playbookOr404(c);
    const body = await parse(c, z.object({ code: z.string().optional(), url: z.string().optional(), version: z.string().optional() }).refine((b) => b.code || b.url, "Pass code or url"));
    if (body.url && !/^https?:\/\//.test(body.url) && auth !== "local") throw new HTTPException(400, { message: "URL must be http(s)" });
    const r = await check(engineFor(pb.id, body.version), body.code !== undefined ? { code: body.code } : { url: body.url });
    return c.json({ passed: r.passed, score: r.score, violations: r.violations, report: r.report, screenshots: r.screenshots.map((s) => s.viewport) });
  });

  return app;
}
