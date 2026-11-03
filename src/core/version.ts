import { createHash } from "node:crypto";
import { flatten, type DtcgTree } from "./dtcg.ts";
import type { PlaybookContent } from "./schema.ts";

/** Stable JSON: object keys sorted, so equal content always hashes the same. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export const contentHash = (content: PlaybookContent) => createHash("sha256").update(canonical(content)).digest("hex").slice(0, 16);

export interface Change {
  area: "token" | "component" | "pattern" | "rule" | "voice" | "meta" | "exemplar";
  op: "added" | "removed" | "changed";
  key: string;
  before?: unknown;
  after?: unknown;
}

function diffKeyed<T>(area: Change["area"], a: T[], b: T[], key: (x: T) => string): Change[] {
  const before = new Map(a.map((x) => [key(x), x]));
  const after = new Map(b.map((x) => [key(x), x]));
  const out: Change[] = [];
  for (const [k, x] of before) {
    if (!after.has(k)) out.push({ area, op: "removed", key: k });
    else if (canonical(x) !== canonical(after.get(k))) out.push({ area, op: "changed", key: k });
  }
  for (const k of after.keys()) if (!before.has(k)) out.push({ area, op: "added", key: k });
  return out;
}

/** Semantic diff between two versions: "color.accent changed #B8401A → #C2410C", "Card added". */
export function diffContent(a: PlaybookContent, b: PlaybookContent): Change[] {
  const tokA = new Map(flatten(a.tokens as DtcgTree).map((t) => [t.path.join("."), canonical(t.value)]));
  const tokB = new Map(flatten(b.tokens as DtcgTree).map((t) => [t.path.join("."), canonical(t.value)]));
  const changes: Change[] = [];
  for (const [k, v] of tokA) {
    if (!tokB.has(k)) changes.push({ area: "token", op: "removed", key: k, before: JSON.parse(v) });
    else if (tokB.get(k) !== v) changes.push({ area: "token", op: "changed", key: k, before: JSON.parse(v), after: JSON.parse(tokB.get(k)!) });
  }
  for (const [k, v] of tokB) if (!tokA.has(k)) changes.push({ area: "token", op: "added", key: k, after: JSON.parse(v) });

  changes.push(...diffKeyed("component", a.components, b.components, (c) => c.name));
  changes.push(...diffKeyed("pattern", a.patterns, b.patterns, (p) => p.name));
  changes.push(...diffKeyed("rule", a.rules, b.rules, (r) => r.id));
  changes.push(...diffKeyed("exemplar", a.exemplars, b.exemplars, (e) => e.file));
  if (a.voice !== b.voice) changes.push({ area: "voice", op: "changed", key: "voice" });
  if (a.name !== b.name || a.description !== b.description) changes.push({ area: "meta", op: "changed", key: "name/description" });
  return changes;
}

export function describeChange(c: Change): string {
  const fmt = (v: unknown) => (v && typeof v === "object" && "hex" in v ? (v as { hex: string }).hex : v && typeof v === "object" && "value" in v ? `${(v as { value: number }).value}${(v as { unit?: string }).unit ?? ""}` : JSON.stringify(v));
  if (c.area === "token" && c.op === "changed") return `token ${c.key}: ${fmt(c.before)} → ${fmt(c.after)}`;
  if (c.area === "token" && c.op === "added") return `token ${c.key} added: ${fmt(c.after)}`;
  return `${c.area} ${c.key} ${c.op}`;
}
