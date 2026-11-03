// The designer agent's foundations pipeline: measure → synthesize → interpret → propose,
// and applying reviewed proposals as a new playbook version.
import type { Store, Job } from "../store/db.ts";
import { closeBrowser } from "../visual.ts";
import { tokensFromDtcg, tokensToDtcg, type DtcgTree } from "../core/dtcg.ts";
import { Component as ComponentSchema, PlaybookContent, type RuleSpec } from "../core/schema.ts";
import { cleanReplaces } from "./components.ts";
import { applyInterpretation, interpret, type Interpretation } from "./interpret.ts";
import { measureImage, measureUrl, type ImageMeasurement, type UrlMeasurement } from "./measure.ts";
import { synthesize, tokensFromProposals, type TokenProposal } from "./synthesize.ts";

export interface ExtractPayload {
  playbookId: string;
  /** Source ids; default: every source of the playbook. */
  sources?: string[];
  interpret?: boolean;
}

export interface ExtractResult {
  sources: number;
  elements: number;
  proposals: number;
  interpretedBy: string | null;
  interpretationError?: string;
  summary: string | null;
  cost: number;
}

export async function runExtraction(store: Store, job: Job): Promise<ExtractResult> {
  const payload = job.payload as ExtractPayload;
  const log = (m: string, cost = 0) => store.progress(job.id, m, cost);
  const sources = store.sources(payload.playbookId).filter((s) => !payload.sources || payload.sources.includes(s.id));
  if (!sources.length) throw new Error("This playbook has no sources. Add screenshots or URLs first.");

  const urls: UrlMeasurement[] = [];
  const images: { name: string; m: ImageMeasurement }[] = [];
  const screens: Buffer[] = [];
  try {
    for (const s of sources) {
      if (s.kind === "url" && s.uri) {
        log(`Measuring ${s.uri}`);
        const m = await measureUrl(s.uri);
        urls.push(m);
        screens.push(m.viewportShot);
        store.addObservation(job.id, "page", { url: s.uri, title: m.title, elements: m.elements.length }, s.id);
      } else if (s.kind === "screenshot" && s.asset) {
        const asset = store.asset(s.asset);
        if (!asset) continue;
        log(`Sampling colours in ${asset.name ?? s.asset.slice(0, 8)}`);
        const buf = asset.read();
        const m = await measureImage(buf, asset.mime);
        images.push({ name: asset.name ?? s.asset, m });
        screens.push(buf);
        store.addObservation(job.id, "image", { name: asset.name, width: m.width, height: m.height, colors: m.colors.slice(0, 20) }, s.id);
      }
    }
  } finally {
    await closeBrowser();
  }

  log("Synthesizing scales and roles");
  const foundations = synthesize(urls, images);
  store.addObservation(job.id, "color-stats", foundations.stats.colors);
  let tokens: TokenProposal[] = foundations.tokens;

  let it: Interpretation | null = null;
  let interpretedBy: string | null = null;
  let interpretationError: string | undefined;
  let cost = 0;
  if (payload.interpret !== false) {
    log("Interpreting names, roles and voice");
    try {
      const { result, usage } = await interpret(screens, tokens);
      it = result;
      interpretedBy = usage.model;
      cost = usage.cost;
      tokens = applyInterpretation(tokens, result);
      log(`Interpreted by ${usage.model}${usage.cached ? " (cached)" : ""}`, usage.cost);
    } catch (e) {
      interpretationError = (e as Error).message.split("\n")[0];
      log(`Interpretation skipped: ${interpretationError}`);
    }
  }

  store.supersedeOpen(payload.playbookId);
  let n = 0;
  for (const t of tokens) {
    store.addProposal({ playbookId: payload.playbookId, jobId: job.id, kind: "token", key: `${t.category}.${t.name}`, data: t, confidence: t.confidence, evidence: t.evidence });
    n++;
  }
  for (const r of foundations.rules) {
    store.addProposal({ playbookId: payload.playbookId, jobId: job.id, kind: "rule", key: r.id, data: r, confidence: 0.8, evidence: [] });
    n++;
  }
  if (it) {
    store.addProposal({ playbookId: payload.playbookId, jobId: job.id, kind: "voice", key: "voice", data: { bullets: it.voice }, confidence: 0.6, evidence: [{ source: "interpretation", detail: interpretedBy }] });
    store.addProposal({ playbookId: payload.playbookId, jobId: job.id, kind: "meta", key: "description", data: { description: it.summary }, confidence: 0.6, evidence: [] });
    // Components are only named here; Phase 5 discovers and builds them.
    for (const c of it.components) {
      store.addProposal({ playbookId: payload.playbookId, jobId: job.id, kind: "component", key: c.name, data: { ...c, status: "named-only" }, confidence: 0.3, evidence: [{ source: "interpretation", detail: c.description }] });
    }
    n += 2 + it.components.length;
  }
  log(`Proposed ${n} changes`);
  return { sources: sources.length, elements: foundations.stats.elements, proposals: n, interpretedBy, interpretationError, summary: it?.summary ?? null, cost };
}

/** Accept every open proposal at or above a confidence threshold (the "looks right, take it" path). */
export function acceptAbove(store: Store, playbookId: string, minConfidence: number) {
  const accepted = store.proposals(playbookId, "open").filter((p) => p.confidence >= minConfidence && p.kind !== "component");
  for (const p of accepted) store.review(p.id, "accept", { note: `auto-accepted at ≥ ${minConfidence}` });
  return accepted.length;
}

/** Commit accepted proposals on top of the current head as a new version. */
export function applyProposals(store: Store, playbookId: string, message = "Apply reviewed proposals") {
  const pb = store.playbook(playbookId);
  if (!pb) throw new Error(`No playbook ${playbookId}`);
  const accepted = store.proposals(playbookId, "accepted");
  if (!accepted.length) throw new Error("No accepted proposals to apply.");
  const head = store.version(playbookId)?.content;

  const base: PlaybookContent = head ?? { schema: "designbase/playbook@1", name: pb.name, description: "", tokens: {}, voice: "", rules: [], components: [], patterns: [], exemplars: [] };
  const tokenProps = accepted.filter((p) => p.kind === "token").map((p) => p.data as TokenProposal);
  // New token proposals replace whole categories they touch, so a re-extraction can remove stale steps.
  const current = tokensFromDtcg(base.tokens as DtcgTree, { name: base.name, description: base.description });
  const fresh = tokensFromProposals(base.name, base.description, tokenProps);
  const merged = { ...current };
  for (const cat of ["color", "font", "fontSize", "spacing", "radius", "shadow"] as const) {
    if (tokenProps.some((t) => t.category === cat)) (merged[cat] as unknown) = fresh[cat];
  }

  const rules = new Map(base.rules.map((r) => [r.id, r]));
  for (const p of accepted.filter((p) => p.kind === "rule")) rules.set(p.key, p.data as RuleSpec);
  // A playbook that turned out to use shadows must not keep a no-shadows rule.
  if (Object.keys(merged.shadow).length) rules.delete("no-shadows");

  // Built components (from discovery) replace same-named ones; name-only proposals carry no code and are skipped.
  const components = new Map(base.components.map((c) => [c.name, c]));
  for (const p of accepted.filter((p) => p.kind === "component" && typeof (p.data as { code?: unknown }).code === "string")) {
    const { verification: _v, assets: _a, propSpecs, ...d } = p.data as Record<string, unknown> & { propSpecs: { name: string; type: string; required: boolean }[] };
    components.set(p.key, ComponentSchema.parse({ ...d, replaces: cleanReplaces((d.replaces as string[]) ?? []), propSpecs, props: propSpecs.map((x) => `${x.name}${x.required ? "" : "?"}: ${x.type}`).join("; ") }));
  }

  const voice = accepted.find((p) => p.kind === "voice");
  const meta = accepted.find((p) => p.kind === "meta");
  const content = PlaybookContent.parse({
    ...base,
    description: meta ? (meta.data as { description: string }).description : base.description,
    tokens: tokensToDtcg(merged),
    voice: voice ? (voice.data as { bullets: string[] }).bullets.map((b) => `- ${b}`).join("\n") : base.voice,
    rules: [...rules.values()],
    components: [...components.values()],
  });
  const commit = store.commit(playbookId, content, message);
  store.markApplied(accepted.map((p) => p.id));
  return commit;
}
