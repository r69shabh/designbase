// Job: discover components on the playbook's URL sources and propose built, verified components.
import { join } from "node:path";
import { materialize } from "../core/materialize.ts";
import type { Job, Store } from "../store/db.ts";
import { closeBrowser } from "../visual.ts";
import { buildComponent, llmSynthesizer, type Synthesizer } from "./components.ts";
import { cropBoxes, findCandidates } from "./discover.ts";
import { measureUrl, type UrlMeasurement } from "./measure.ts";

export interface DiscoverPayload {
  playbookId: string;
  /** Cap on candidates to build (each one costs model calls). */
  max?: number;
}

export interface DiscoverResult {
  candidates: number;
  built: { name: string; score: number; passed: boolean; rounds: number }[];
  failed: { candidate: string; error: string }[];
  reused: { candidate: string; component: string }[];
  cost: number;
}

export async function runDiscovery(store: Store, job: Job, synth: Synthesizer = llmSynthesizer): Promise<DiscoverResult> {
  const { playbookId, max = 10 } = job.payload as DiscoverPayload;
  const log = (m: string, cost = 0) => store.progress(job.id, m, cost);
  const head = store.version(playbookId);
  if (!head) throw new Error("Discovery needs foundations first: extract and apply tokens, then discover components.");
  const urls = store.sources(playbookId).filter((s) => s.kind === "url" && s.uri);
  if (!urls.length) throw new Error("Component discovery needs at least one URL source (screenshot-only discovery isn't supported yet).");

  const workRoot = join(store.dir, "work", job.id);
  const pb = materialize(head.content, join(workRoot, "head"));
  const pages: UrlMeasurement[] = [];
  const result: DiscoverResult = { candidates: 0, built: [], failed: [], reused: [], cost: 0 };

  try {
    for (const s of urls) {
      log(`Measuring ${s.uri}`);
      pages.push(await measureUrl(s.uri!));
    }
    const candidates = findCandidates(pages, pb.tokens, { max });
    result.candidates = candidates.length;
    log(`Found ${candidates.length} component candidates: ${candidates.map((c) => `${c.kind}×${c.instances.length}`).join(", ")}`);

    // Names the foundations interpreter gave the components it saw: hints for the builder.
    const nameHints = [...new Set(store.proposals(playbookId).filter((p) => p.kind === "component" && (p.data as { status?: string }).status === "named-only").map((p) => p.key))];
    const taken = new Set(head.content.components.map((c) => c.name));
    store.db.prepare("UPDATE proposals SET status = 'superseded' WHERE playbook_id = ? AND kind = 'component' AND status = 'open'").run(playbookId);

    for (const c of candidates) {
      // The team already has this component (from the repo or an earlier build): use it, don't regenerate.
      const existing = head.content.components.find((x) => x.replaces.includes(c.kind) || x.name.toLowerCase() === c.kind);
      if (existing) {
        result.reused.push({ candidate: `${c.kind}×${c.instances.length}`, component: existing.name });
        log(`${c.kind} already exists as ${existing.name}${existing.importPath ? ` (${existing.importPath})` : ""}; reusing it`);
        continue;
      }
      const page = pages.find((p) => p.url === c.instances[0].page)!;
      const [crop] = await cropBoxes(page.screenshot, [c.instances[0].box]);
      log(`Building ${c.kind} (${c.skins.length} variant${c.skins.length === 1 ? "" : "s"})`);
      try {
        const built = await buildComponent({ candidate: { ...c, crops: [crop] }, playbook: pb, nameHints, takenNames: [...taken] }, head.content, crop, join(workRoot, c.id), synth);
        result.cost += built.cost;
        taken.add(built.draft.name);
        const sourceAsset = store.putAsset(crop, "image/png", `${built.draft.name}-source.png`);
        const renderAsset = built.v.renderPng ? store.putAsset(built.v.renderPng, "image/png", `${built.draft.name}-render.png`) : null;
        store.addProposal({
          playbookId,
          jobId: job.id,
          kind: "component",
          key: built.draft.name,
          data: {
            ...built.draft,
            verification: { score: built.v.score, passed: built.v.passed, rounds: built.rounds, issues: built.v.issues, size: built.v.size, colorSimilarity: built.v.colorSimilarity, model: built.model },
            assets: { source: sourceAsset.hash, render: renderAsset?.hash ?? null },
          },
          confidence: Math.round(built.v.score) / 100,
          evidence: [{ source: "discovery", detail: `${c.kind} seen ${c.instances.length}+ times in ${c.skins.length} treatment(s)`, instances: c.instances.map((i) => ({ page: i.page, box: i.box })) }],
        });
        result.built.push({ name: built.draft.name, score: built.v.score, passed: built.v.passed, rounds: built.rounds });
        log(`${built.draft.name}: score ${built.v.score} after ${built.rounds} round(s)${built.v.passed ? "" : " (needs review)"}`, built.cost);
      } catch (e) {
        result.failed.push({ candidate: c.id, error: (e as Error).message.split("\n")[0] });
        log(`Couldn't build ${c.kind} ${c.id}: ${(e as Error).message.split("\n")[0]}`);
      }
    }
  } finally {
    await closeBrowser();
  }
  return result;
}
