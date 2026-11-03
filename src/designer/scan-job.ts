// Job: scan the team's repo for existing components and declared tokens, and propose them.
import { existsSync, statSync } from "node:fs";
import type { Job, Store } from "../store/db.ts";
import { exampleFor, scanRepo } from "./repo.ts";
import { tokensFromCode } from "./repo-tokens.ts";
import { rulesFor } from "./synthesize.ts";

export interface ScanPayload { playbookId: string }
export interface ScanResult {
  repos: number;
  files: number;
  components: { name: string; importPath: string; usedBy: number; replaces: string[]; stories: number }[];
  tokens: number;
  darkColors: number;
  tailwindConfigs: string[];
  stories: number;
  unresolved: string[];
}

export async function runScan(store: Store, job: Job): Promise<ScanResult> {
  const { playbookId } = job.payload as ScanPayload;
  const log = (m: string) => store.progress(job.id, m);
  const repos = store.sources(playbookId).filter((s) => s.kind === "repo" && s.uri);
  if (!repos.length) throw new Error("No repo source. Add one with { \"repo\": \"/path/to/your/app\" }.");
  const result: ScanResult = { repos: repos.length, files: 0, components: [], tokens: 0, darkColors: 0, tailwindConfigs: [], stories: 0, unresolved: [] };

  // Only component and code-token proposals from earlier scans are replaced; page extraction stays.
  store.db.prepare("UPDATE proposals SET status = 'superseded' WHERE playbook_id = ? AND status = 'open' AND json_extract(evidence, '$[0].source') IN ('code', 'repo')").run(playbookId);

  for (const src of repos) {
    const root = src.uri!;
    if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error(`Repo path not found: ${root}`);
    log(`Scanning ${root}`);
    const scan = scanRepo(root);
    result.files += scan.files;
    log(`Read ${scan.files} component files and ${scan.cssFiles.length} stylesheets; found ${scan.components.length} components`);
    for (const c of scan.tailwind) {
      result.tailwindConfigs.push(c.file);
      result.unresolved.push(...c.unresolved.map((u) => `${c.file}: ${u}`));
      log(`Read Tailwind config ${c.file}${c.unresolved.length ? ` (${c.unresolved.length} value(s) need running code, skipped: ${c.unresolved.slice(0, 3).join("; ")})` : ""}`);
    }
    const storied = scan.components.filter((c) => c.stories.length);
    result.stories += storied.reduce((n, c) => n + c.stories.length, 0);
    if (scan.storyFiles) log(`Read ${scan.storyFiles} story file(s): ${storied.map((c) => `${c.name} (${c.stories.length})`).join(", ") || "none matched a component"}`);

    const { tokens, darkColors } = tokensFromCode(scan.cssFiles, scan.components.flatMap((c) => c.classes), root, { tailwind: scan.tailwind, fontVars: scan.fontVars });
    for (const t of tokens) store.addProposal({ playbookId, jobId: job.id, kind: "token", key: `${t.category}.${t.name}`, data: t, confidence: t.confidence, evidence: t.evidence });
    result.tokens += tokens.length;
    if (Object.keys(darkColors).length) {
      // Kept as an observation until playbooks support modes (DTCG resolver).
      store.addObservation(job.id, "dark-colors", darkColors, src.id);
      result.darkColors += Object.keys(darkColors).length;
      log(`Found a dark theme (${Object.keys(darkColors).length} colours); stored for when playbooks support modes`);
    }

    const usesShadows = scan.components.some((c) => c.classes.some((cls) => /^shadow(-(?!none)|$)/.test(cls.split(":").pop()!)));
    for (const r of rulesFor(tokens, !usesShadows && !tokens.some((t) => t.category === "shadow"))) {
      store.addProposal({ playbookId, jobId: job.id, kind: "rule", key: r.id, data: r, confidence: 0.8, evidence: [{ source: "code", detail: "derived from declared tokens" }] });
    }

    for (const c of scan.components) {
      const words = [c.name, ...(c.storyTitle?.split("/") ?? [])].flatMap((w) => w.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/\s+/)).filter(Boolean);
      store.addProposal({
        playbookId,
        jobId: job.id,
        kind: "component",
        key: c.name,
        data: {
          name: c.name,
          summary: c.summary,
          keywords: [...new Set([...words, ...c.replaces, ...Object.values(c.variants).flat()])],
          propSpecs: c.propSpecs,
          variants: c.variants,
          replaces: c.replaces,
          do: [`Import it from "${c.importPath}"`],
          dont: [`Re-implement ${c.name} or hand-style a raw ${c.renders ? `<${c.renders}>` : "element"} instead`],
          example: exampleFor(c),
          code: c.code,
          origin: "repo",
          importPath: c.importPath,
          exportName: c.exportName,
          parts: c.parts,
          stories: c.stories,
          file: c.file,
          usedBy: c.usedBy,
        },
        // The team's own, already-used components are the strongest evidence there is.
        confidence: c.usedBy > 0 || c.stories.length ? 0.95 : 0.85,
        evidence: [{ source: "repo", detail: `${c.file}, imported by ${c.usedBy} file(s)${c.stories.length ? `, ${c.stories.length} Storybook stor${c.stories.length === 1 ? "y" : "ies"}` : ""}` }],
      });
      result.components.push({ name: c.name, importPath: c.importPath, usedBy: c.usedBy, replaces: c.replaces, stories: c.stories.length });
    }
  }
  log(`Proposed ${result.components.length} components and ${result.tokens} tokens`);
  return result;
}
