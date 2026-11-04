// Job: scan the team's repo for existing components and declared tokens, render their Storybook,
// and propose it all. Declared values come from code; rendered stories confirm them, fill in what
// code doesn't declare, and expose colours the library uses that aren't in the theme (drift).
import { existsSync, statSync } from "node:fs";
import type { Job, Store } from "../store/db.ts";
import { closeBrowser } from "../visual.ts";
import { deltaE2000 } from "../color.ts";
import { cssColorHex, type UrlMeasurement } from "./measure.ts";
import { exampleFor, scanRepo, type RepoComponent } from "./repo.ts";
import { tokensFromCode } from "./repo-tokens.ts";
import { loadIndex, openStorybook, renderStories, storySlug, type IndexEntry, type StoryRender } from "./storybook.ts";
import { rulesFor, synthesize, type TokenProposal } from "./synthesize.ts";

export interface ScanPayload {
  playbookId: string;
  /** Storybook rendering limits: stories per component and in total. */
  perComponent?: number;
  maxStories?: number;
}
export interface DriftColor { hex: string; nearest: string | null; deltaE: number | null; uses: number; stories: string[] }
export interface ScanResult {
  repos: number;
  files: number;
  components: { name: string; importPath: string; usedBy: number; replaces: string[]; stories: number; rendered: number }[];
  tokens: number;
  darkColors: number;
  tailwindConfigs: string[];
  stories: number;
  unresolved: string[];
  storybook: { indexed: number; rendered: number; matched: number; failed: { id: string; error: string }[]; measuredTokens: number; drift: DriftColor[] } | null;
}

const DRIFT_DE = 5; // further than this from every declared colour = not in the theme
const SAME_DE = 2.3; // just-noticeable difference

export async function runScan(store: Store, job: Job): Promise<ScanResult> {
  const { playbookId, perComponent = 4, maxStories = 120 } = job.payload as ScanPayload;
  const log = (m: string) => store.progress(job.id, m);
  const sources = store.sources(playbookId);
  const repos = sources.filter((s) => s.kind === "repo" && s.uri);
  const books = sources.filter((s) => s.kind === "storybook" && s.uri);
  if (!repos.length && !books.length) throw new Error('No repo or Storybook source. Add one with { "repo": "/path/to/your/app" } or { "storybook": "http://localhost:6006" }.');
  const result: ScanResult = { repos: repos.length, files: 0, components: [], tokens: 0, darkColors: 0, tailwindConfigs: [], stories: 0, unresolved: [], storybook: null };

  // Only proposals from earlier scans are replaced; page extraction stays.
  store.db.prepare("UPDATE proposals SET status = 'superseded' WHERE playbook_id = ? AND status = 'open' AND json_extract(evidence, '$[0].source') IN ('code', 'repo', 'storybook')").run(playbookId);

  // 1. Code: components and declared tokens.
  const scanned: RepoComponent[] = [];
  const codeTokens: TokenProposal[] = [];
  let usesShadows = false;
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
    for (const t of tokens) if (!codeTokens.some((x) => x.category === t.category && x.name === t.name)) codeTokens.push(t);
    if (Object.keys(darkColors).length) {
      // Kept as an observation until playbooks support modes (DTCG resolver).
      store.addObservation(job.id, "dark-colors", darkColors, src.id);
      result.darkColors += Object.keys(darkColors).length;
      log(`Found a dark theme (${Object.keys(darkColors).length} colours); stored for when playbooks support modes`);
    }
    usesShadows ||= scan.components.some((c) => c.classes.some((cls) => /^shadow(-(?!none)|$)/.test(cls.split(":").pop()!)));
    scanned.push(...scan.components);
  }

  // 2. Storybook: render the approved states.
  const renders: StoryRender[] = [];
  const imageOf = new Map<string, string>(); // story id → asset hash
  const looksOf = new Map<string, StoryRender["looks"]>();
  const entryFor = (file: string | undefined, exportName: string, index: IndexEntry[]) =>
    index.find((e) => file && e.importPath.replace(/^\.\//, "") === file && e.id.endsWith(`--${storySlug(exportName)}`));
  try {
    for (const src of books) {
      log(`Opening Storybook ${src.uri}`);
      const sb = await openStorybook(src.uri!);
      try {
        const index = await loadIndex(sb.base);
        result.storybook ??= { indexed: 0, rendered: 0, matched: 0, failed: [], measuredTokens: 0, drift: [] };
        result.storybook.indexed += index.length;
        // Stories of components we found in code first, then the rest, a few per component.
        const matched = scanned.flatMap((c) => c.stories.slice(0, perComponent).map((s) => entryFor(s.file, s.exportName, index)).filter((e): e is IndexEntry => !!e));
        const perTitle = new Map<string, number>();
        const rest = index.filter((e) => !matched.includes(e) && (perTitle.set(e.title, (perTitle.get(e.title) ?? 0) + 1).get(e.title)! <= perComponent));
        const pick = [...matched, ...rest].slice(0, maxStories);
        result.storybook.matched += matched.length;
        log(`${index.length} stories indexed; rendering ${pick.length} (${matched.length} matched to components in code)`);
        const rs = await renderStories(sb.base, pick, { onRendered: (_, done) => done % 20 === 0 && log(`Rendered ${done}/${pick.length} stories`) });
        for (const r of rs) {
          if (!r.png) {
            result.storybook.failed.push({ id: r.entry.id, error: r.error ?? "no render" });
            continue;
          }
          imageOf.set(r.entry.id, store.putAsset(r.png, "image/png", `${r.entry.id}.png`).hash);
          looksOf.set(r.entry.id, r.looks);
          renders.push(r);
        }
        for (const s of scanned.flatMap((c) => c.stories)) {
          const e = entryFor(s.file, s.exportName, index);
          if (e && imageOf.has(e.id)) {
            s.image = imageOf.get(e.id);
            s.looks = looksOf.get(e.id);
          }
        }
      } finally {
        await sb.close();
      }
    }
  } finally {
    if (books.length) await closeBrowser();
  }

  // 3. Rendered styles: confirm declared tokens, fill categories code didn't declare, flag drift.
  if (renders.length && result.storybook) {
    result.storybook.rendered = renders.length;
    // Each story is measured as its own small page: elements clipped to the crop, so area shares
    // describe the component, not Storybook's empty canvas.
    const clip = (r: StoryRender) => {
      const b = r.box!;
      return r.elements.flatMap((e) => {
        const x0 = Math.max(e.box.x, b.x), y0 = Math.max(e.box.y, b.y), x1 = Math.min(e.box.x + e.box.w, b.x + b.w), y1 = Math.min(e.box.y + e.box.h, b.y + b.h);
        if (x1 - x0 < 1 || y1 - y0 < 1) return [];
        // Storybook's own canvas padding on <body> isn't the team's spacing.
        const spacing = e.tag === "body" || e.tag === "html" ? { padding: [0, 0, 0, 0], margin: [], gap: [] } : e.spacing;
        return [{ ...e, spacing, box: { x: x0 - b.x, y: y0 - b.y, w: x1 - x0, h: y1 - y0 } }];
      });
    };
    const pages: UrlMeasurement[] = renders.map((r) => ({
      url: r.url,
      title: r.entry.title,
      viewport: { width: r.box!.w, height: r.box!.h },
      elements: clip(r),
      screenshot: r.png!,
      viewportShot: r.png!,
    }));
    const measured = synthesize(pages, []).tokens;
    const declaredColors = codeTokens.filter((t) => t.category === "color");

    // Every colour the stories actually paint, and which stories paint it.
    const painted = new Map<string, Set<string>>();
    const uses = new Map<string, number>();
    for (const r of renders) {
      for (const e of r.elements) {
        if (e.tag === "html" || e.tag === "body") continue;
        for (const css of [e.text > 0 ? e.color : "", e.bg, e.border ?? ""]) {
          const hex = css && cssColorHex(css);
          if (!hex) continue;
          painted.set(hex, (painted.get(hex) ?? new Set()).add(r.entry.id));
          uses.set(hex, (uses.get(hex) ?? 0) + 1);
        }
      }
    }
    if (declaredColors.length) {
      for (const t of declaredColors) {
        const ids = new Set([...painted].filter(([hex]) => deltaE2000(hex, String(t.value)) <= SAME_DE).flatMap(([, s]) => [...s]));
        if (!ids.size) continue;
        t.evidence.push({ source: "storybook", detail: `rendered in ${ids.size} stor${ids.size === 1 ? "y" : "ies"}` });
        t.confidence = Math.min(0.99, t.confidence + 0.03);
      }
      // Off-theme colours, merged when indistinguishable, most used first.
      const drift: DriftColor[] = [];
      for (const [hex, n] of [...uses].sort((a, b) => b[1] - a[1])) {
        const near = declaredColors.map((t) => ({ t, d: deltaE2000(hex, String(t.value)) })).sort((a, b) => a.d - b.d)[0];
        if (near && near.d <= DRIFT_DE) continue;
        const same = drift.find((d) => deltaE2000(d.hex, hex) <= SAME_DE);
        if (same) {
          same.uses += n;
          for (const id of painted.get(hex)!) if (!same.stories.includes(id)) same.stories.push(id);
        } else drift.push({ hex, nearest: near ? `${near.t.name} ${near.t.value}` : null, deltaE: near ? Math.round(near.d * 10) / 10 : null, uses: n, stories: [...painted.get(hex)!] });
      }
      result.storybook.drift = drift.slice(0, 20);
      if (drift.length) {
        store.addObservation(job.id, "storybook-drift", result.storybook.drift);
        log(`${drift.length} colour(s) rendered in stories aren't in the theme, e.g. ${drift.slice(0, 3).map((d) => `${d.hex} in ${d.stories[0]}`).join(", ")}`);
      }
    }
    // Categories the code doesn't declare are taken from what the stories render: measured, not guessed.
    const declared = new Set(codeTokens.map((t) => t.category));
    for (const t of measured) {
      if (declared.has(t.category)) continue;
      codeTokens.push({ ...t, evidence: [{ source: "storybook", detail: `${t.evidence[0]?.detail ?? "computed styles"} across ${renders.length} rendered stories` }] });
      result.storybook.measuredTokens++;
    }
    if (result.storybook.measuredTokens) log(`Measured ${result.storybook.measuredTokens} token(s) the code doesn't declare from rendered stories`);
    if (measured.some((t) => t.category === "shadow")) usesShadows = true;
  }

  for (const t of codeTokens) store.addProposal({ playbookId, jobId: job.id, kind: "token", key: `${t.category}.${t.name}`, data: t, confidence: t.confidence, evidence: t.evidence });
  result.tokens = codeTokens.length;
  if (codeTokens.length) {
    for (const r of rulesFor(codeTokens, !usesShadows && !codeTokens.some((t) => t.category === "shadow"))) {
      store.addProposal({ playbookId, jobId: job.id, kind: "rule", key: r.id, data: r, confidence: 0.8, evidence: [{ source: "code", detail: "derived from declared tokens" }] });
    }
  }
  // Controls rendered in stories become the reference for every control on a page.
  const lookCount = scanned.reduce((n, c) => n + c.stories.reduce((m, s) => m + (s.looks?.length ?? 0), 0), 0);
  if (lookCount) {
    store.addProposal({
      playbookId,
      jobId: job.id,
      kind: "rule",
      key: "approved-looks",
      data: { id: "approved-looks", severity: "warn", kind: "visual", title: "Controls look like an approved Storybook state", why: "Your Storybook shows how each control is meant to look; one that matches none of its states has been restyled or hand-rolled.", fix: "Use the component with one of its approved variants instead of restyling it.", enabled: true, params: {} },
      confidence: 0.85,
      evidence: [{ source: "storybook", detail: `${lookCount} control look(s) measured in rendered stories` }],
    });
    log(`Recorded ${lookCount} approved control look(s) from stories`);
  }

  for (const c of scanned) {
    const words = [c.name, ...(c.storyTitle?.split("/") ?? [])].flatMap((w) => w.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/\s+/)).filter(Boolean);
    const rendered = c.stories.filter((s) => s.image).length;
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
        stories: c.stories.map(({ name, example, image, looks }) => ({ name, example, ...(image ? { image } : {}), ...(looks?.length ? { looks } : {}) })),
        file: c.file,
        usedBy: c.usedBy,
      },
      // The team's own, already-used components are the strongest evidence there is.
      confidence: c.usedBy > 0 || c.stories.length ? 0.95 : 0.85,
      evidence: [{ source: "repo", detail: `${c.file}, imported by ${c.usedBy} file(s)${c.stories.length ? `, ${c.stories.length} Storybook stor${c.stories.length === 1 ? "y" : "ies"}${rendered ? ` (${rendered} rendered)` : ""}` : ""}` }],
    });
    result.components.push({ name: c.name, importPath: c.importPath, usedBy: c.usedBy, replaces: c.replaces, stories: c.stories.length, rendered });
  }
  log(`Proposed ${result.components.length} components and ${result.tokens} tokens`);
  return result;
}
