// Local store: node:sqlite for records, a content-addressed directory for files.
// Hosted mode will swap this for Postgres + object storage behind the same functions.
import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PlaybookContent, type PlaybookContent as Content } from "../core/schema.ts";
import { contentHash, diffContent, type Change } from "../core/version.ts";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS api_keys (hash TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, label TEXT, scope TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS playbooks (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL,
  head_version TEXT, created_at TEXT NOT NULL, UNIQUE (workspace_id, slug));
CREATE TABLE IF NOT EXISTS versions (
  id TEXT NOT NULL, playbook_id TEXT NOT NULL, parent TEXT, message TEXT, content TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY (playbook_id, id));
CREATE TABLE IF NOT EXISTS assets (hash TEXT PRIMARY KEY, mime TEXT NOT NULL, size INTEGER NOT NULL, name TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY, playbook_id TEXT NOT NULL, kind TEXT NOT NULL, uri TEXT, asset TEXT, meta TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, playbook_id TEXT, status TEXT NOT NULL, payload TEXT NOT NULL, result TEXT, error TEXT,
  progress TEXT NOT NULL DEFAULT '[]', attempts INTEGER NOT NULL DEFAULT 0, lease_until TEXT, cost REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS jobs_status ON jobs (status, created_at);
CREATE TABLE IF NOT EXISTS observations (id TEXT PRIMARY KEY, job_id TEXT NOT NULL, source_id TEXT, kind TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY, playbook_id TEXT NOT NULL, job_id TEXT, kind TEXT NOT NULL, key TEXT NOT NULL, data TEXT NOT NULL,
  confidence REAL NOT NULL, evidence TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS proposals_open ON proposals (playbook_id, status);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY, proposal_id TEXT NOT NULL, decision TEXT NOT NULL, edited TEXT, note TEXT, created_at TEXT NOT NULL);
`;

const now = () => new Date().toISOString();
const json = <T>(s: unknown): T => JSON.parse(String(s)) as T;

export type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";
export interface Job {
  id: string;
  kind: string;
  playbookId: string | null;
  status: JobStatus;
  payload: unknown;
  result: unknown;
  error: string | null;
  progress: { at: string; message: string }[];
  attempts: number;
  cost: number;
  createdAt: string;
  updatedAt: string;
}
export interface Proposal {
  id: string;
  playbookId: string;
  jobId: string | null;
  kind: "token" | "component" | "pattern" | "rule" | "voice" | "meta";
  key: string;
  data: unknown;
  confidence: number;
  evidence: unknown[];
  /** superseded: replaced by a newer extraction; applied: accepted and committed into a version. */
  status: "open" | "accepted" | "rejected" | "superseded" | "applied";
  createdAt: string;
}

export class Store {
  readonly db: DatabaseSync;
  readonly assetDir: string;

  constructor(readonly dir = process.env.DESIGNBASE_DATA ?? ".designbase/data") {
    mkdirSync(join(dir, "assets"), { recursive: true });
    this.assetDir = resolve(dir, "assets");
    this.db = new DatabaseSync(join(dir, "designbase.db"));
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    this.db.exec(SCHEMA);
  }

  close() {
    this.db.close();
  }

  // --- workspaces & keys ---

  createWorkspace(name: string) {
    const id = randomUUID();
    this.db.prepare("INSERT INTO workspaces VALUES (?, ?, ?)").run(id, name, now());
    return { id, name };
  }
  workspaces() {
    return this.db.prepare("SELECT id, name, created_at AS createdAt FROM workspaces ORDER BY created_at").all();
  }
  createApiKey(workspaceId: string, scope: "read" | "write", label?: string) {
    const key = `dbk_${randomUUID().replace(/-/g, "")}`;
    this.db.prepare("INSERT INTO api_keys VALUES (?, ?, ?, ?, ?)").run(hashKey(key), workspaceId, label ?? null, scope, now());
    return key;
  }
  resolveApiKey(key: string): { workspaceId: string; scope: "read" | "write" } | null {
    const row = this.db.prepare("SELECT workspace_id, scope FROM api_keys WHERE hash = ?").get(hashKey(key));
    return row ? { workspaceId: String(row.workspace_id), scope: row.scope as "read" | "write" } : null;
  }

  // --- playbooks & versions ---

  createPlaybook(workspaceId: string, name: string, content?: Content) {
    const id = randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    this.db.prepare("INSERT INTO playbooks (id, workspace_id, name, slug, created_at) VALUES (?, ?, ?, ?, ?)").run(id, workspaceId, name, slug, now());
    if (content) this.commit(id, content, "Initial version");
    return this.playbook(id)!;
  }
  playbook(id: string) {
    const row = this.db.prepare("SELECT * FROM playbooks WHERE id = ?").get(id);
    return row ? { id: String(row.id), workspaceId: String(row.workspace_id), name: String(row.name), slug: String(row.slug), headVersion: row.head_version as string | null, createdAt: String(row.created_at) } : null;
  }
  playbooks(workspaceId: string) {
    return this.db.prepare("SELECT id, name, slug, head_version AS headVersion, created_at AS createdAt FROM playbooks WHERE workspace_id = ? ORDER BY created_at").all(workspaceId);
  }

  /** Store a new immutable version and move head. Committing identical content is a no-op. */
  commit(playbookId: string, content: Content, message: string): { id: string; changes: Change[]; created: boolean } {
    const parsed = PlaybookContent.parse(content);
    const id = contentHash(parsed);
    const pb = this.playbook(playbookId);
    if (!pb) throw new Error(`No playbook ${playbookId}`);
    const parent = pb.headVersion ? this.version(playbookId, pb.headVersion) : null;
    if (parent?.id === id) return { id, changes: [], created: false };
    this.db
      .prepare("INSERT OR IGNORE INTO versions VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, playbookId, pb.headVersion ?? null, message, JSON.stringify(parsed), now());
    this.db.prepare("UPDATE playbooks SET head_version = ? WHERE id = ?").run(id, playbookId);
    return { id, changes: parent ? diffContent(parent.content, parsed) : [], created: true };
  }
  version(playbookId: string, id = this.playbook(playbookId)?.headVersion ?? "") {
    const row = this.db.prepare("SELECT * FROM versions WHERE playbook_id = ? AND id = ?").get(playbookId, id);
    return row ? { id: String(row.id), parent: row.parent as string | null, message: String(row.message), createdAt: String(row.created_at), content: json<Content>(row.content) } : null;
  }
  versions(playbookId: string) {
    return this.db.prepare("SELECT id, parent, message, created_at AS createdAt FROM versions WHERE playbook_id = ? ORDER BY created_at DESC").all(playbookId);
  }

  // --- assets (content-addressed) ---

  putAsset(data: Buffer, mime: string, name?: string) {
    const hash = createHash("sha256").update(data).digest("hex");
    const path = join(this.assetDir, hash);
    if (!existsSync(path)) writeFileSync(path, data);
    this.db.prepare("INSERT OR IGNORE INTO assets VALUES (?, ?, ?, ?, ?)").run(hash, mime, data.length, name ?? null, now());
    return { hash, path, mime, size: data.length };
  }
  asset(hash: string) {
    const row = this.db.prepare("SELECT * FROM assets WHERE hash = ?").get(hash);
    return row ? { hash, mime: String(row.mime), size: Number(row.size), name: row.name as string | null, path: join(this.assetDir, hash), read: () => readFileSync(join(this.assetDir, hash)) } : null;
  }

  // --- sources ---

  addSource(playbookId: string, kind: "screenshot" | "url" | "code" | "repo" | "storybook", init: { uri?: string; asset?: string; meta?: unknown }) {
    const id = randomUUID();
    this.db.prepare("INSERT INTO sources VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, playbookId, kind, init.uri ?? null, init.asset ?? null, JSON.stringify(init.meta ?? {}), now());
    return { id, kind, ...init };
  }
  sources(playbookId: string) {
    return this.db
      .prepare("SELECT * FROM sources WHERE playbook_id = ? ORDER BY created_at")
      .all(playbookId)
      .map((r) => ({ id: String(r.id), kind: String(r.kind) as "screenshot" | "url" | "code" | "repo" | "storybook", uri: r.uri as string | null, asset: r.asset as string | null, meta: json<Record<string, unknown>>(r.meta) }));
  }

  // --- jobs ---

  enqueue(kind: string, payload: unknown, playbookId?: string): Job {
    const id = randomUUID();
    const t = now();
    this.db.prepare("INSERT INTO jobs (id, kind, playbook_id, status, payload, created_at, updated_at) VALUES (?, ?, ?, 'queued', ?, ?, ?)").run(id, kind, playbookId ?? null, JSON.stringify(payload), t, t);
    return this.job(id)!;
  }
  job(id: string): Job | null {
    const r = this.db.prepare("SELECT * FROM jobs WHERE id = ?").get(id);
    if (!r) return null;
    return {
      id: String(r.id), kind: String(r.kind), playbookId: r.playbook_id as string | null, status: r.status as JobStatus,
      payload: json(r.payload), result: r.result ? json(r.result) : null, error: r.error as string | null,
      progress: json(r.progress), attempts: Number(r.attempts), cost: Number(r.cost), createdAt: String(r.created_at), updatedAt: String(r.updated_at),
    };
  }
  /** Claim the oldest queued job (or one whose lease expired: its worker died). */
  claimJob(leaseMs = 10 * 60_000): Job | null {
    const t = now();
    const row = this.db
      .prepare("SELECT id FROM jobs WHERE status = 'queued' OR (status = 'running' AND lease_until < ?) ORDER BY created_at LIMIT 1")
      .get(t);
    if (!row) return null;
    const changed = this.db
      .prepare("UPDATE jobs SET status = 'running', attempts = attempts + 1, lease_until = ?, updated_at = ? WHERE id = ? AND (status = 'queued' OR lease_until < ?)")
      .run(new Date(Date.now() + leaseMs).toISOString(), t, String(row.id), t);
    return changed.changes ? this.job(String(row.id)) : null;
  }
  progress(id: string, message: string, cost = 0) {
    const job = this.job(id);
    if (!job) return;
    const progress = [...job.progress, { at: now(), message }];
    this.db.prepare("UPDATE jobs SET progress = ?, cost = cost + ?, updated_at = ? WHERE id = ?").run(JSON.stringify(progress), cost, now(), id);
  }
  finishJob(id: string, outcome: { result?: unknown; error?: string }) {
    this.db
      .prepare("UPDATE jobs SET status = ?, result = ?, error = ?, lease_until = NULL, updated_at = ? WHERE id = ?")
      .run(outcome.error ? "failed" : "done", outcome.result === undefined ? null : JSON.stringify(outcome.result), outcome.error ?? null, now(), id);
  }
  cancelJob(id: string) {
    this.db.prepare("UPDATE jobs SET status = 'cancelled', updated_at = ? WHERE id = ? AND status IN ('queued', 'running')").run(now(), id);
  }
  jobs(playbookId?: string) {
    const rows = playbookId
      ? this.db.prepare("SELECT id FROM jobs WHERE playbook_id = ? ORDER BY created_at DESC").all(playbookId)
      : this.db.prepare("SELECT id FROM jobs ORDER BY created_at DESC LIMIT 100").all();
    return rows.map((r) => this.job(String(r.id))!);
  }

  // --- observations, proposals, reviews ---

  addObservation(jobId: string, kind: string, data: unknown, sourceId?: string) {
    this.db.prepare("INSERT INTO observations VALUES (?, ?, ?, ?, ?)").run(randomUUID(), jobId, sourceId ?? null, kind, JSON.stringify(data));
  }
  observations(jobId: string) {
    return this.db.prepare("SELECT kind, source_id AS sourceId, data FROM observations WHERE job_id = ?").all(jobId).map((r) => ({ kind: String(r.kind), sourceId: r.sourceId as string | null, data: json(r.data) }));
  }

  addProposal(p: Omit<Proposal, "id" | "status" | "createdAt">): Proposal {
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO proposals (id, playbook_id, job_id, kind, key, data, confidence, evidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, p.playbookId, p.jobId, p.kind, p.key, JSON.stringify(p.data), p.confidence, JSON.stringify(p.evidence), now());
    return this.proposal(id)!;
  }
  proposal(id: string): Proposal | null {
    const r = this.db.prepare("SELECT * FROM proposals WHERE id = ?").get(id);
    return r
      ? { id: String(r.id), playbookId: String(r.playbook_id), jobId: r.job_id as string | null, kind: r.kind as Proposal["kind"], key: String(r.key), data: json(r.data), confidence: Number(r.confidence), evidence: json(r.evidence), status: r.status as Proposal["status"], createdAt: String(r.created_at) }
      : null;
  }
  proposals(playbookId: string, status?: Proposal["status"]) {
    const rows = status
      ? this.db.prepare("SELECT id FROM proposals WHERE playbook_id = ? AND status = ? ORDER BY kind, confidence DESC").all(playbookId, status)
      : this.db.prepare("SELECT id FROM proposals WHERE playbook_id = ? ORDER BY created_at").all(playbookId);
    return rows.map((r) => this.proposal(String(r.id))!);
  }
  review(proposalId: string, decision: "accept" | "reject", opts: { edited?: unknown; note?: string } = {}) {
    this.db.prepare("INSERT INTO reviews VALUES (?, ?, ?, ?, ?, ?)").run(randomUUID(), proposalId, decision, opts.edited === undefined ? null : JSON.stringify(opts.edited), opts.note ?? null, now());
    this.db.prepare("UPDATE proposals SET status = ? WHERE id = ?").run(decision === "accept" ? "accepted" : "rejected", proposalId);
    if (opts.edited !== undefined) this.db.prepare("UPDATE proposals SET data = ? WHERE id = ?").run(JSON.stringify(opts.edited), proposalId);
    return this.proposal(proposalId)!;
  }
  supersedeOpen(playbookId: string) {
    this.db.prepare("UPDATE proposals SET status = 'superseded' WHERE playbook_id = ? AND status = 'open'").run(playbookId);
  }
  markApplied(ids: string[]) {
    const stmt = this.db.prepare("UPDATE proposals SET status = 'applied' WHERE id = ?");
    for (const id of ids) stmt.run(id);
  }
  reviews(playbookId: string) {
    return this.db
      .prepare("SELECT r.*, p.kind, p.key FROM reviews r JOIN proposals p ON p.id = r.proposal_id WHERE p.playbook_id = ? ORDER BY r.created_at")
      .all(playbookId);
  }
}

const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");
