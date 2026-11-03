// Design Tokens Community Group format (2025.10) reader/writer, and the mapping between DTCG
// trees and the flat token categories the engine checks against.
import type { Tokens } from "../playbook.ts";

export type DtcgTree = { [key: string]: DtcgTree | unknown };

export interface FlatToken {
  path: string[];
  type: string;
  value: unknown;
  description?: string;
  extensions?: Record<string, unknown>;
}

const EXT = "dev.designbase";

const isToken = (node: unknown): node is { $value: unknown } => !!node && typeof node === "object" && "$value" in node;
const isGroup = (node: unknown): node is DtcgTree => !!node && typeof node === "object" && !Array.isArray(node) && !isToken(node);

/** Walk a DTCG tree, inheriting $type from groups and resolving {alias.references}. */
export function flatten(tree: DtcgTree): FlatToken[] {
  const out: FlatToken[] = [];
  const walk = (node: DtcgTree, path: string[], inheritedType?: string) => {
    const groupType = typeof node.$type === "string" ? node.$type : inheritedType;
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      if (isToken(child)) {
        const t = child as { $value: unknown; $type?: string; $description?: string; $extensions?: Record<string, unknown> };
        out.push({ path: [...path, key], type: t.$type ?? groupType ?? "unknown", value: t.$value, description: t.$description, extensions: t.$extensions });
      } else if (isGroup(child)) {
        walk(child, [...path, key], groupType);
      }
    }
  };
  walk(tree, []);

  const byPath = new Map(out.map((t) => [t.path.join("."), t]));
  const resolve = (value: unknown, seen: Set<string>): unknown => {
    if (typeof value !== "string") return value;
    const m = value.match(/^\{([^}]+)\}$/);
    if (!m) return value;
    if (seen.has(m[1])) throw new Error(`Circular token alias: ${[...seen, m[1]].join(" → ")}`);
    const target = byPath.get(m[1]);
    if (!target) throw new Error(`Unknown token alias {${m[1]}}`);
    return resolve(target.value, new Set([...seen, m[1]]));
  };
  for (const t of out) t.value = resolve(t.value, new Set([t.path.join(".")]));
  return out;
}

// --- Value helpers (accept both 2025.10 objects and the older string forms) ---

export function colorHex(value: unknown): string {
  if (typeof value === "string") return value.toUpperCase();
  const v = value as { hex?: string; colorSpace?: string; components?: number[] };
  if (v?.hex) return v.hex.toUpperCase();
  if (v?.colorSpace === "srgb" && v.components) {
    return "#" + v.components.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  throw new Error(`Unsupported colour value ${JSON.stringify(value)}`);
}

export function dimensionPx(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const m = value.match(/^(-?[\d.]+)(px|rem)?$/);
    if (!m) throw new Error(`Unsupported dimension ${value}`);
    return Number(m[1]) * (m[2] === "rem" ? 16 : 1);
  }
  const v = value as { value: number; unit: "px" | "rem" };
  return v.unit === "rem" ? v.value * 16 : v.value;
}

const hexColor = (hex: string) => {
  const h = hex.replace("#", "");
  const components = [0, 2, 4].map((i) => Math.round((parseInt(h.slice(i, i + 2), 16) / 255) * 10_000) / 10_000);
  return { colorSpace: "srgb", components, hex: hex.toUpperCase() };
};
const px = (n: number) => ({ value: n, unit: "px" });

// --- Engine categories <-> DTCG ---

type Category = Exclude<keyof Tokens, "name" | "description">;
const CATEGORIES: Category[] = ["color", "font", "fontSize", "spacing", "radius", "shadow", "breakpoints"];

const category = (t: FlatToken): Category | null => {
  const group = t.path[0].toLowerCase();
  const hinted = (t.extensions?.[EXT] as { category?: string } | undefined)?.category;
  if (hinted && (CATEGORIES as string[]).includes(hinted)) return hinted as Category;
  if (t.type === "color") return "color";
  if (t.type === "fontFamily") return "font";
  if (t.type === "shadow") return "shadow";
  if (t.type === "dimension") {
    if (/^(space|spacing|size|gap)/.test(group)) return "spacing";
    if (/^(radius|radii|rounded|corner)/.test(group)) return "radius";
    if (/^(font-?size|text|type)/.test(group)) return "fontSize";
    if (/^(breakpoint|screen)/.test(group)) return "breakpoints";
  }
  return null;
};

/** DTCG tree → the flat categories the linter, visual check and brief use. Names = path minus the group. */
export function tokensFromDtcg(tree: DtcgTree, meta: { name: string; description: string }): Tokens {
  const tokens: Tokens = { ...meta, color: {}, font: {}, fontSize: {}, spacing: {}, radius: {}, shadow: {}, breakpoints: {} };
  for (const t of flatten(tree)) {
    const cat = category(t);
    if (!cat) continue;
    const name = t.path.slice(1).join("-") || t.path[0];
    switch (cat) {
      case "color":
        tokens.color[name] = { value: colorHex(t.value), role: t.description ?? "" };
        break;
      case "font": {
        const family = Array.isArray(t.value) ? String(t.value[0]) : String(t.value);
        tokens.font[name] = { family, use: t.description ?? "" };
        break;
      }
      case "shadow":
        tokens.shadow[name] = JSON.stringify(t.value);
        break;
      default:
        (tokens[cat] as Record<string, number>)[name] = dimensionPx(t.value);
    }
  }
  return tokens;
}

/** Engine categories → a DTCG 2025.10 tree. */
export function tokensToDtcg(t: Tokens): DtcgTree {
  const dims = (type: string, rec: Record<string, number>) => ({
    $type: type,
    ...Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, { $value: px(v) }])),
  });
  const tree: DtcgTree = {
    $description: t.description,
    color: {
      $type: "color",
      ...Object.fromEntries(Object.entries(t.color).map(([k, c]) => [k, { $value: hexColor(c.value), ...(c.role ? { $description: c.role } : {}) }])),
    },
    font: {
      $type: "fontFamily",
      ...Object.fromEntries(Object.entries(t.font).map(([k, f]) => [k, { $value: [f.family], ...(f.use ? { $description: f.use } : {}) }])),
    },
    fontSize: dims("dimension", t.fontSize),
    spacing: dims("dimension", t.spacing),
    radius: dims("dimension", t.radius),
    breakpoints: dims("dimension", t.breakpoints),
  };
  if (Object.keys(t.shadow).length) {
    tree.shadow = { $type: "shadow", ...Object.fromEntries(Object.entries(t.shadow).map(([k, v]) => [k, { $value: JSON.parse(v) }])) };
  }
  return tree;
}
