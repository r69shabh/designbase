// ExtractBench scoring: compare what the designer agent extracted with the known truth.
import type { Candidate } from "../../src/designer/discover.ts";
import type { TokenProposal } from "../../src/designer/synthesize.ts";
import { deltaE2000 } from "../../src/color.ts";

export { deltaE2000 };

export interface PRF { precision: number; recall: number; f1: number; missed: string[]; extra: string[] }
const prf = (tp: number, nPred: number, nTrue: number, missed: string[], extra: string[]): PRF => {
  // Predicting nothing makes no false claims: precision is vacuously 1 (recall carries the miss).
  const precision = nPred ? tp / nPred : 1;
  const recall = nTrue ? tp / nTrue : 1;
  return { precision, recall, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0, missed, extra };
};

/** One-to-one matching under a tolerance (greedy by distance). */

export function matchSets<T>(pred: T[], truth: T[], dist: (a: T, b: T) => number, tol: number, show: (x: T) => string): PRF {
  const pairs = pred.flatMap((p, i) => truth.map((t, j) => ({ i, j, d: dist(p, t) }))).filter((x) => x.d <= tol).sort((a, b) => a.d - b.d);
  const usedP = new Set<number>(), usedT = new Set<number>();
  for (const { i, j } of pairs) if (!usedP.has(i) && !usedT.has(j)) usedP.add(i), usedT.add(j);
  return prf(usedP.size, pred.length, truth.length, truth.filter((_, j) => !usedT.has(j)).map(show), pred.filter((_, i) => !usedP.has(i)).map(show));
}

export interface TruthTokens {
  colors: Record<string, string>;
  spacing?: number[];
  fontSizes?: number[];
  bodySize?: number;
  fonts?: string[];
  radii?: number[];
  pill?: boolean;
  shadows?: boolean;
  /** Roles whose extracted name we check (role → hex). */
  roles?: Record<string, string>;
}

export interface TokenScores {
  colors: PRF;
  roles: { accuracy: number; wrong: string[] } | null;
  spacing: PRF | null;
  fontSizes: PRF | null;
  bodySize: boolean | null;
  fonts: PRF | null;
  radii: PRF | null;
  pill: boolean | null;
  shadows: boolean | null;
}

export function scoreTokens(tokens: TokenProposal[], truth: TruthTokens, opts: { colorsOnly?: boolean } = {}): TokenScores {
  const of = (cat: TokenProposal["category"]) => tokens.filter((t) => t.category === cat);
  const colors = matchSets(of("color").map((t) => String(t.value)), [...new Set(Object.values(truth.colors))], deltaE2000, 3, (x) => x);

  let roles: TokenScores["roles"] = null;
  if (truth.roles) {
    const wrong: string[] = [];
    for (const [role, hex] of Object.entries(truth.roles)) {
      const got = of("color").find((t) => t.name === role);
      if (!got || deltaE2000(String(got.value), hex) > 3) wrong.push(`${role}: expected ${hex}, got ${got?.value ?? "none"}`);
    }
    roles = { accuracy: 1 - wrong.length / Object.keys(truth.roles).length, wrong };
  }
  if (opts.colorsOnly) return { colors, roles, spacing: null, fontSizes: null, bodySize: null, fonts: null, radii: null, pill: null, shadows: null };

  const num = (a: number, b: number) => Math.abs(a - b);
  const radii = of("radius").map((t) => Number(t.value)).filter((v) => v > 0 && v < 9999);
  const body = of("fontSize").find((t) => t.name === "base");
  return {
    colors,
    roles,
    spacing: truth.spacing ? matchSets(of("spacing").map((t) => Number(t.value)), truth.spacing, num, 0, String) : null,
    fontSizes: truth.fontSizes ? matchSets(of("fontSize").map((t) => Number(t.value)), truth.fontSizes, num, 0.5, String) : null,
    bodySize: truth.bodySize !== undefined ? Number(body?.value) === truth.bodySize : null,
    fonts: truth.fonts ? matchSets(of("font").map((t) => String(t.value).toLowerCase()), truth.fonts.map((f) => f.toLowerCase()), (a, b) => (a === b ? 0 : 1), 0, String) : null,
    radii: truth.radii ? matchSets(radii, truth.radii, num, 0.5, String) : null,
    pill: truth.pill !== undefined ? of("radius").some((t) => Number(t.value) === 9999) === truth.pill : null,
    shadows: truth.shadows !== undefined ? of("shadow").length > 0 === truth.shadows : null,
  };
}

// --- components ---

export interface TruthBox { component: string; variant: string; page: string; box: { x: number; y: number; w: number; h: number } }
export interface ComponentScores {
  recall: number;
  precision: number;
  f1: number;
  variantRecall: number;
  found: string[];
  missed: string[];
  unmatchedCandidates: string[];
}

const iou = (a: TruthBox["box"], b: TruthBox["box"]) => {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = x * y;
  return inter / (a.w * a.h + b.w * b.h - inter || 1);
};

export function scoreComponents(candidates: Omit<Candidate, "crops">[], truth: TruthBox[]): ComponentScores {
  const truthComponents = [...new Set(truth.map((t) => t.component))];
  // Each candidate is labelled with the truth component most of its instances overlap.
  const labelled = candidates.map((c) => {
    const votes = new Map<string, number>();
    for (const inst of c.instances) {
      const hit = truth.filter((t) => t.page === inst.page).map((t) => ({ t, v: iou(t.box, inst.box) })).sort((a, b) => b.v - a.v)[0];
      if (hit && hit.v >= 0.6) votes.set(hit.t.component, (votes.get(hit.t.component) ?? 0) + 1);
    }
    const best = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
    return { c, label: best && best[1] / c.instances.length >= 0.5 ? best[0] : null };
  });
  const found = truthComponents.filter((tc) => labelled.some((l) => l.label === tc));
  const missed = truthComponents.filter((tc) => !found.includes(tc));
  const matchedCandidates = labelled.filter((l) => l.label).length;

  // Variants: a component's truth variants vs the colour treatments its candidates found.
  let variantHits = 0, variantTotal = 0;
  for (const tc of truthComponents) {
    const variants = new Set(truth.filter((t) => t.component === tc).map((t) => t.variant));
    variantTotal += variants.size;
    const skins = labelled.filter((l) => l.label === tc).reduce((n, l) => n + l.c.skins.length, 0);
    variantHits += Math.min(variants.size, skins);
  }
  const recall = truthComponents.length ? found.length / truthComponents.length : 1;
  const precision = candidates.length ? matchedCandidates / candidates.length : 1;
  return {
    recall,
    precision,
    f1: recall + precision ? (2 * recall * precision) / (recall + precision) : 0,
    variantRecall: variantTotal ? variantHits / variantTotal : 1,
    found,
    missed,
    unmatchedCandidates: labelled.filter((l) => !l.label).map((l) => `${l.c.kind}×${l.c.instances.length}`),
  };
}
