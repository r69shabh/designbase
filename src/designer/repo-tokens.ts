// Tokens declared in code: CSS custom properties (:root, @theme — shadcn and Tailwind v4 style),
// plus the Tailwind scales the components actually use. Declared values are exact, so these
// proposals carry high confidence. Nothing in the repo is executed.
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import type { TokenProposal } from "./synthesize.ts";

// ---------- colour parsing (hex, rgb, hsl incl. bare "h s% l%", oklch) ----------

const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
const toHex = (rgb: number[]) => "#" + rgb.map((v) => clamp(v).toString(16).padStart(2, "0")).join("").toUpperCase();

function hslToRgb(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

function oklchToRgb(L: number, C: number, H: number) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return lin.map((c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055));
}

const num = (s: string, pct = 1) => (s.endsWith("%") ? (Number(s.slice(0, -1)) / 100) * pct : Number(s));

/** Parse a CSS colour value to #RRGGBB, or null if it isn't one (or is mostly transparent). */
export function parseCssColor(value: string): string | null {
  const v = value.trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = h.split("").map((c) => c + c).join("");
    if (h.length === 8 && parseInt(h.slice(6), 16) < 128) return null;
    return `#${h.slice(0, 6).toUpperCase()}`;
  }
  const fn = v.match(/^(rgba?|hsla?|oklch)\(([^)]*)\)$/);
  const parts = (fn ? fn[2] : v).split(/[\s,/]+/).filter(Boolean);
  const alpha = parts.length === 4 ? num(parts[3], 1) : 1;
  if (alpha < 0.5) return null;
  const kind = fn?.[1] ?? (/^[\d.]+(deg)?\s+[\d.]+%\s+[\d.]+%/.test(v) ? "hsl" : null); // shadcn v3: "222.2 47.4% 11.2%"
  if (!kind) return null;
  if (kind.startsWith("rgb")) return toHex(parts.slice(0, 3).map((p) => num(p, 255)));
  if (kind.startsWith("hsl")) return toHex(hslToRgb(parseFloat(parts[0]), num(parts[1]), num(parts[2])));
  if (kind === "oklch") return toHex(oklchToRgb(num(parts[0]), num(parts[1], 0.4), parseFloat(parts[2] ?? "0") || 0));
  return null;
}

/** "0.625rem" → 10, "6px" → 6, "calc(10px - 4px)" → 6. */
export function parseLength(value: string): number | null {
  const v = value.trim();
  const one = (s: string) => {
    const m = s.trim().match(/^(-?[\d.]+)(px|rem|em)?$/);
    return m ? Number(m[1]) * (m[2] === "rem" || m[2] === "em" ? 16 : 1) : null;
  };
  const calc = v.match(/^calc\((.+)\)$/);
  if (!calc) return one(v);
  const terms = calc[1].split(/\s+([+-])\s+/);
  let total = one(terms[0]);
  for (let i = 1; i < terms.length && total !== null; i += 2) {
    const t = one(terms[i + 1]);
    total = t === null ? null : terms[i] === "+" ? total + t : total - t;
  }
  return total;
}

// ---------- CSS custom properties ----------

export interface CssVar { name: string; value: string; file: string; scope: "root" | "theme" | "dark" }

export function readCssVars(file: string, root: string): CssVar[] {
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const out: CssVar[] = [];
  for (const block of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = block[1].trim();
    const scope = /@theme/.test(selector) ? "theme" : /\.dark|\[data-theme=["']?dark|prefers-color-scheme:\s*dark/.test(selector) ? "dark" : /:root|^html$|^body$/.test(selector) ? "root" : null;
    if (!scope) continue;
    for (const m of block[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.push({ name: m[1], value: m[2].trim(), file: relative(root, file), scope });
  }
  return out;
}

const resolveVars = (value: string, vars: Map<string, string>, depth = 0): string =>
  depth > 8 ? value : value.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (_, name, fallback) => resolveVars(vars.get(name) ?? fallback ?? "", vars, depth + 1));

// ---------- Tailwind class usage ----------

const TW_TEXT: Record<string, number> = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48, "6xl": 60, "7xl": 72 };
const TW_RADIUS: Record<string, number> = { xs: 2, sm: 4, md: 6, lg: 8, xl: 12, "2xl": 16, "3xl": 24 };

export function tokensFromCode(cssFiles: string[], classes: string[], root: string): { tokens: TokenProposal[]; darkColors: Record<string, string> } {
  const vars = cssFiles.flatMap((f) => readCssVars(f, root));
  const light = new Map<string, string>();
  for (const v of vars.filter((v) => v.scope !== "dark")) light.set(v.name, v.value);
  const tokens: TokenProposal[] = [];
  const add = (category: TokenProposal["category"], name: string, value: string | number, role: string, detail: string, confidence = 0.95) => {
    if (tokens.some((t) => t.category === category && t.name === name)) return;
    tokens.push({ category, name, value, role, confidence, evidence: [{ source: "code", detail }] });
  };

  // Colours: --color-x in @theme, or bare --x in :root whose value is a colour.
  for (const v of vars.filter((v) => v.scope !== "dark")) {
    const name = v.name.replace(/^--(color-)?/, "");
    if (/^(radius|spacing|font|text|shadow|breakpoint|container|leading|tracking)/.test(name)) continue;
    const hex = parseCssColor(resolveVars(v.value, light));
    if (hex) add("color", name, hex, `Declared as ${v.name}`, `${v.file}: ${v.name}: ${v.value}`);
  }
  const darkColors: Record<string, string> = {};
  for (const v of vars.filter((v) => v.scope === "dark")) {
    const hex = parseCssColor(resolveVars(v.value, new Map([...light, ...vars.filter((x) => x.scope === "dark").map((x) => [x.name, x.value] as [string, string])])));
    if (hex) darkColors[v.name.replace(/^--(color-)?/, "")] = hex;
  }

  // Fonts.
  for (const v of vars.filter((v) => /^--font-/.test(v.name))) {
    const family = resolveVars(v.value, light).split(",")[0].replace(/["']/g, "").trim();
    if (family && !/^var\(/.test(family)) add("font", v.name.replace("--font-", ""), family, `Declared as ${v.name}`, `${v.file}: ${v.name}`);
  }

  // Radius: declared --radius-* (and the base --radius), else Tailwind defaults for the rounded-* classes used.
  for (const v of vars.filter((v) => /^--radius(-|$)/.test(v.name))) {
    const px = parseLength(resolveVars(v.value, light));
    if (px !== null && px > 0) add("radius", v.name === "--radius" ? "base" : v.name.replace("--radius-", ""), Math.round(px * 10) / 10, `Declared as ${v.name}`, `${v.file}: ${v.name}: ${v.value}`);
  }

  // Scales the components use: spacing (× the declared --spacing base) and type.
  const base = parseLength(resolveVars(light.get("--spacing") ?? "0.25rem", light)) ?? 4;
  const counts = new Map<string, number>();
  for (const c of classes) counts.set(c, (counts.get(c) ?? 0) + 1);
  const spacing = new Map<number, number>();
  const text = new Map<string, number>();
  const radius = new Map<string, number>();
  for (const [raw, n] of counts) {
    const c = raw.split(":").pop()!;
    const sp = c.match(/^-?(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y)-([\d.]+)$/);
    if (sp) spacing.set(Number(sp[1]) * base, (spacing.get(Number(sp[1]) * base) ?? 0) + n);
    const tx = c.match(/^text-(xs|sm|base|lg|xl|[2-7]xl)$/);
    if (tx) text.set(tx[1], (text.get(tx[1]) ?? 0) + n);
    const rd = c.match(/^rounded-(xs|sm|md|lg|xl|2xl|3xl|full)$/);
    if (rd) radius.set(rd[1], (radius.get(rd[1]) ?? 0) + n);
  }
  for (const [px, n] of [...spacing].sort((a, b) => a[0] - b[0])) {
    if (px > 0) add("spacing", String(px / base), px, `${n} use(s) in components`, `p-/m-/gap- classes × --spacing ${base}px`, 0.85);
  }
  for (const [k, n] of text) add("fontSize", k, TW_TEXT[k], `${n} use(s) in components`, `text-${k} (Tailwind scale)`, 0.85);
  for (const [k, n] of radius) {
    if (k === "full") add("radius", "full", 9999, `${n} use(s)`, "rounded-full");
    else if (!tokens.some((t) => t.category === "radius" && t.name === k)) add("radius", k, TW_RADIUS[k], `${n} use(s) in components`, `rounded-${k} (Tailwind default)`, 0.8);
  }
  return { tokens, darkColors };
}
