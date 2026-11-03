// Turns measurements into a foundations proposal: colour roles, spacing/type/radius scales, fonts,
// shadows, and the rules that follow from them. Deterministic; the interpreter only renames and describes.
import type { RuleSpec } from "../core/schema.ts";
import type { Tokens } from "../playbook.ts";
import { cssColorHex, distance, hexRgb, type ImageMeasurement, type UrlMeasurement } from "./measure.ts";

export interface ColorStat {
  hex: string;
  text: number; // characters of text drawn in this colour
  bgArea: number; // px² of background fill
  border: number; // elements with this border colour
  buttonBg: number; // buttons filled with it
  link: number; // links drawn in it
  onFill: number; // text drawn on a filled button: little volume, but part of the system
  imageShare: number; // share of screenshot pixels
  imagePixels: number; // exact-colour pixels in screenshots
}

export interface Evidence { source: string; detail: string }
export interface TokenProposal {
  category: "color" | "font" | "fontSize" | "spacing" | "radius" | "shadow";
  name: string;
  value: string | number;
  role: string;
  confidence: number;
  evidence: Evidence[];
}
export interface Foundations {
  tokens: TokenProposal[];
  rules: RuleSpec[];
  stats: { colors: ColorStat[]; spacingBase: number | null; elements: number; sources: number };
}

const saturation = (hex: string) => {
  const [r, g, b] = hexRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
};
const lightness = (hex: string) => {
  const [r, g, b] = hexRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

function addColor(stats: ColorStat[], hex: string | null, field: keyof Omit<ColorStat, "hex">, amount: number) {
  if (!hex || amount <= 0) return;
  let s = stats.find((c) => distance(hexRgb(c.hex), hexRgb(hex)) < 8);
  if (!s) stats.push((s = { hex, text: 0, bgArea: 0, border: 0, buttonBg: 0, link: 0, onFill: 0, imageShare: 0, imagePixels: 0 }));
  s[field] += amount;
}

const weightOf = (c: ColorStat, totalArea: number) =>
  c.text / 200 + (c.bgArea / Math.max(totalArea, 1)) * 20 + c.border / 4 + c.buttonBg * 2 + c.link / 2 + c.onFill + c.imageShare * 20 + (c.imagePixels >= 60 ? 0.15 : 0);

/** Count values, ignoring 0 and absurd sizes. */
function histogram(values: number[], max = 160): Map<number, number> {
  const h = new Map<number, number>();
  for (const v of values) {
    const r = Math.round(v);
    if (r <= 0 || r > max) continue;
    h.set(r, (h.get(r) ?? 0) + 1);
  }
  return h;
}

/** The largest base unit most spacing values are multiples of. */
export function spacingBase(h: Map<number, number>): number | null {
  const total = [...h.values()].reduce((a, b) => a + b, 0);
  if (!total) return null;
  for (const base of [8, 4, 2]) {
    let on = 0;
    for (const [v, n] of h) if (v % base === 0) on += n;
    if (on / total >= 0.85) return base;
  }
  return 1;
}

const sizeNames = (sizes: number[], base: number) => {
  const below = sizes.filter((s) => s < base).sort((a, b) => b - a);
  const above = sizes.filter((s) => s > base).sort((a, b) => a - b);
  const names = new Map<number, string>([[base, "base"]]);
  ["sm", "xs", "2xs", "3xs"].forEach((n, i) => below[i] !== undefined && names.set(below[i], n));
  ["lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"].forEach((n, i) => above[i] !== undefined && names.set(above[i], n));
  return names;
};

export function synthesize(urls: UrlMeasurement[], images: { name: string; m: ImageMeasurement }[]): Foundations {
  const elements = urls.flatMap((u) => u.elements.map((e) => ({ ...e, source: u.url })));
  const totalArea = urls.reduce((a, u) => a + u.viewport.width * Math.max(...u.elements.map((e) => e.box.y + e.box.h), u.viewport.height), 0);
  const tokens: TokenProposal[] = [];

  // --- colours ---
  const colors: ColorStat[] = [];
  for (const e of elements) {
    if (e.text > 0) addColor(colors, cssColorHex(e.color), e.role === "link" ? "link" : "text", e.text);
    if (e.bg) {
      addColor(colors, cssColorHex(e.bg), "bgArea", e.box.w * e.box.h);
      if (e.role === "button") {
        addColor(colors, cssColorHex(e.bg), "buttonBg", 1);
        if (e.text > 0) addColor(colors, cssColorHex(e.color), "onFill", 1);
      }
    }
    if (e.border) addColor(colors, cssColorHex(e.border), "border", 1);
  }
  for (const { m } of images) {
    for (const c of m.colors) {
      addColor(colors, c.hex, "imageShare", c.share);
      addColor(colors, c.hex, "imagePixels", c.pixels);
    }
  }
  const significant = colors
    .filter((c) => weightOf(c, totalArea) >= 0.15 || c.buttonBg > 0)
    .sort((a, b) => weightOf(b, totalArea) - weightOf(a, totalArea));

  const named = new Map<ColorStat, string>();
  const take = (name: string, pick: (c: ColorStat) => boolean, order: (a: ColorStat, b: ColorStat) => number) => {
    const c = significant.filter((c) => !named.has(c) && pick(c)).sort(order)[0];
    if (c) named.set(c, name);
  };
  const imageOnly = urls.length === 0;
  if (imageOnly) {
    // Pixels only: no element roles, so lean on area and contrast. Works for dark themes too.
    const neutral = (c: ColorStat) => saturation(c.hex) < 0.35;
    take("background", () => true, (a, b) => b.imageShare - a.imageShare);
    const bg = [...named].find(([, n]) => n === "background")?.[0];
    const dl = (c: ColorStat) => (bg ? Math.abs(lightness(c.hex) - lightness(bg.hex)) : 0);
    take("text", neutral, (a, b) => dl(b) - dl(a));
    take("accent", (c) => !neutral(c), (a, b) => b.imageShare - a.imageShare);
    // Near-background neutrals: the biggest is the raised surface, the most contrasting is the border.
    const near = (c: ColorStat) => neutral(c) && dl(c) > 0.02 && dl(c) < 0.35;
    take("surface", near, (a, b) => b.imageShare - a.imageShare);
    take("border", near, (a, b) => dl(b) - dl(a));
  } else {
    take("background", (c) => c.bgArea > 0, (a, b) => b.bgArea - a.bgArea);
    take("text", (c) => c.text > 0, (a, b) => b.text - a.text);
    take("accent", (c) => saturation(c.hex) > 0.35 && (c.buttonBg > 0 || c.link > 0), (a, b) => b.buttonBg * 10 + b.link - (a.buttonBg * 10 + a.link));
    // The most-used neutral border, in light and dark themes alike.
    take("border", (c) => c.border > 0 && saturation(c.hex) < 0.35, (a, b) => b.border - a.border);
    take("surface", (c) => c.bgArea > 0 && saturation(c.hex) < 0.35, (a, b) => b.bgArea - a.bgArea);
  }
  // Remaining neutral text colours, darkest first.
  for (let i = 2; i <= 3; i++) take(`text-${i}`, (c) => c.text > 0 && saturation(c.hex) < 0.35, (a, b) => lightness(a.hex) - lightness(b.hex));
  let other = 1;
  for (const c of significant) if (!named.has(c)) named.set(c, saturation(c.hex) > 0.35 ? `color-${other++}` : `neutral-${other++}`);

  for (const [c, name] of named) {
    const uses = [
      c.text && `text (${c.text} chars)`,
      c.bgArea && `background (${Math.round((c.bgArea / Math.max(totalArea, 1)) * 100)}% of area)`,
      c.buttonBg && `${c.buttonBg} button fill(s)`,
      c.border && `${c.border} border(s)`,
      c.link && `link text`,
      c.onFill && `text on ${c.onFill} filled button(s)`,
      c.imageShare && `${(c.imageShare * 100).toFixed(1)}% of screenshot pixels`,
    ].filter(Boolean);
    tokens.push({
      category: "color",
      name,
      value: c.hex,
      role: uses.join(", "),
      confidence: imageOnly ? 0.6 : 0.9,
      evidence: [{ source: imageOnly ? "screenshot pixels" : "computed styles", detail: uses.join("; ") }],
    });
  }

  // --- spacing ---
  const spacingH = histogram(elements.flatMap((e) => [...e.spacing.padding, ...e.spacing.margin, ...e.spacing.gap]), 128);
  const base = spacingBase(spacingH);
  const spacingTotal = [...spacingH.values()].reduce((a, b) => a + b, 0);
  const spacing = [...spacingH.entries()]
    .filter(([v, n]) => n / spacingTotal >= 0.01 && (!base || v % base === 0))
    .sort((a, b) => a[0] - b[0]);
  for (const [v, n] of spacing) {
    tokens.push({
      category: "spacing",
      name: Number.isInteger(v / 4) ? String(v / 4) : String(Math.round((v / 4) * 100) / 100),
      value: v,
      role: `${n} uses`,
      confidence: Math.min(0.95, 0.5 + n / spacingTotal * 4),
      evidence: [{ source: "computed styles", detail: `${v}px used ${n} times as padding/margin/gap` }],
    });
  }

  // --- type ---
  const textEls = elements.filter((e) => e.text > 0);
  const sizeWeight = new Map<number, number>();
  for (const e of textEls) sizeWeight.set(Math.round(e.fontSize), (sizeWeight.get(Math.round(e.fontSize)) ?? 0) + e.text);
  const textTotal = [...sizeWeight.values()].reduce((a, b) => a + b, 0);
  const headingSizes = new Set(textEls.filter((e) => e.role === "heading").map((e) => Math.round(e.fontSize)));
  const sizes = [...sizeWeight.entries()].filter(([s, w]) => w / textTotal >= 0.005 || headingSizes.has(s)).map(([s]) => s);
  const bodySize = [...sizeWeight.entries()].filter(([s]) => s >= 13 && s <= 18).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 16;
  if (!sizes.includes(bodySize) && textTotal) sizes.push(bodySize);
  for (const [size, name] of sizeNames(sizes, bodySize)) {
    tokens.push({
      category: "fontSize",
      name,
      value: size,
      role: headingSizes.has(size) ? "headings" : size === bodySize ? "body text" : "text",
      confidence: 0.85,
      evidence: [{ source: "computed styles", detail: `${size}px on ${sizeWeight.get(size) ?? 0} characters` }],
    });
  }

  // --- fonts ---
  const famWeight = new Map<string, { text: number; heading: number; mono: boolean }>();
  for (const e of textEls) {
    const f = famWeight.get(e.font) ?? { text: 0, heading: 0, mono: /mono|code|courier|consol/i.test(e.fontStack) };
    f.text += e.text;
    if (e.role === "heading" || e.fontSize >= 24) f.heading += e.text;
    famWeight.set(e.font, f);
  }
  const fams = [...famWeight.entries()].filter(([, f]) => f.text / Math.max(textTotal, 1) >= 0.01);
  const body = fams.filter(([, f]) => !f.mono).sort((a, b) => b[1].text - a[1].text)[0];
  const display = fams.filter(([n, f]) => !f.mono && n !== body?.[0]).sort((a, b) => b[1].heading - a[1].heading)[0];
  const mono = fams.filter(([, f]) => f.mono).sort((a, b) => b[1].text - a[1].text)[0];
  for (const [name, fam, use] of [["body", body, "Most text"], ["display", display, "Headings and large numbers"], ["mono", mono, "Numbers, IDs, code"]] as const) {
    if (!fam) continue;
    tokens.push({ category: "font", name, value: fam[0], role: use, confidence: 0.9, evidence: [{ source: "computed styles", detail: `${fam[1].text} characters` }] });
  }

  // --- radius ---
  const boxed = elements.filter((e) => e.bg || e.border);
  const radiusH = histogram(boxed.map((e) => (e.radius >= Math.min(e.box.h, e.box.w) / 2 ? 9999 : e.radius)), 100_000);
  const radiusTotal = boxed.length || 1;
  const radii = [...radiusH.entries()].filter(([, n]) => n / radiusTotal >= 0.03).map(([v]) => v).sort((a, b) => a - b);
  const finite = radii.filter((v) => v < 9999);
  const rNames = finite.length <= 1 ? ["md"] : finite.length === 2 ? ["sm", "md"] : ["sm", "md", "lg", "xl", "2xl"];
  finite.forEach((v, i) => tokens.push({ category: "radius", name: rNames[i] ?? `r${v}`, value: v, role: `${radiusH.get(v)} elements`, confidence: 0.8, evidence: [{ source: "computed styles", detail: `${v}px on ${radiusH.get(v)} boxed elements` }] }));
  tokens.push({ category: "radius", name: "none", value: 0, role: "Square", confidence: 0.9, evidence: [] });
  if (radii.includes(9999)) tokens.push({ category: "radius", name: "full", value: 9999, role: "Pills", confidence: 0.85, evidence: [{ source: "computed styles", detail: `${radiusH.get(9999)} pill-shaped elements` }] });

  // --- shadows ---
  const shadowed = boxed.filter((e) => e.shadow && e.shadow !== "none");
  const shadowShare = shadowed.length / radiusTotal;
  if (shadowShare >= 0.02) {
    const counts = new Map<string, number>();
    for (const e of shadowed) counts.set(e.shadow, (counts.get(e.shadow) ?? 0) + 1);
    [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([value, n], i) =>
      tokens.push({ category: "shadow", name: ["sm", "md", "lg"][i], value, role: `${n} elements`, confidence: 0.75, evidence: [{ source: "computed styles", detail: `${n} elements` }] }));
  }

  return { tokens, rules: rulesFor(tokens, shadowShare < 0.02 && urls.length > 0), stats: { colors, spacingBase: base, elements: elements.length, sources: urls.length + images.length } };
}

/** The standard rule catalogue, worded with this playbook's own token names. */
export function rulesFor(tokens: TokenProposal[], flat: boolean): RuleSpec[] {
  const names = (cat: TokenProposal["category"]) => tokens.filter((t) => t.category === cat);
  const colorNames = names("color").slice(0, 5).map((t) => t.name);
  const spacing = names("spacing").map((t) => `${t.name}=${t.value}px`).join(", ");
  const sizes = names("fontSize").map((t) => `text-${t.name}`).join(", ");
  const radius = names("radius").map((t) => `rounded-${t.name}`).join(", ");
  const fonts = names("font").map((t) => `font-${t.name} (${t.value})`).join(", ");
  const rule = (id: string, severity: "error" | "warn", kind: string, title: string, why: string, fix: string): RuleSpec => ({ id, severity, kind, title, why, fix, enabled: true, params: {} });
  return [
    rule("no-raw-colors", "error", "lint+visual", "Only palette colours", "Raw values and Tailwind's default palette bypass the system.", `Use a palette token: ${colorNames.map((n) => `bg-${n}`).join(", ")}…`),
    rule("no-arbitrary-values", "error", "lint", "No arbitrary Tailwind values", "Bracket values are off-system by definition.", "Pick the nearest token from the scale."),
    rule("spacing-scale", "error", "lint+visual", "Spacing from the scale only", `Rhythm comes from a fixed scale: ${spacing}.`, "Use the nearest step."),
    rule("type-scale", "error", "lint+visual", "Font sizes from the type scale", `Sizes: ${sizes}.`, `Use ${sizes}.`),
    rule("font-families", "error", "lint+visual", "Playbook fonts only", "Other fonts erase the voice.", `Use ${fonts}.`),
    rule("radius-scale", "error", "lint+visual", "Radius from the scale", `Corners: ${radius}.`, `Use ${radius}.`),
    ...(flat ? [rule("no-shadows", "error", "lint+visual", "No shadows", "None of the source screens use shadows.", "Use a border instead.")] : []),
    rule("no-gradients", "error", "lint", "No gradients", "Flat colour only.", "Use a single palette fill."),
    rule("use-components", "error", "lint", "Use playbook components", "Hand-rolled controls drift from the system.", "Import the playbook component instead."),
    rule("one-primary-action", "warn", "lint", "At most one primary button per view", "The accent marks the single most important action.", "Demote the others to secondary or ghost."),
    rule("no-inline-styles", "error", "lint", "No inline style values", "Inline values skip every token.", "Use token classes."),
    rule("heading-order", "warn", "lint", "One h1, no skipped heading levels", "Hierarchy and accessibility.", "h1 → h2 → h3 in order."),
    rule("img-alt", "error", "lint", "Images need alt text", "Accessibility.", 'Add alt="…" (alt="" for decorative).'),
    rule("contrast", "error", "visual", "Text contrast ≥ 4.5:1 (3:1 for large text)", "Accessibility.", "Use a darker text token on light surfaces."),
    rule("no-horizontal-overflow", "error", "visual", "No horizontal scroll at 375px", "Layouts must reflow on phones.", "Stack columns on small screens."),
  ];
}

/** Proposals → the engine's flat token categories. */
export function tokensFromProposals(name: string, description: string, proposals: TokenProposal[]): Tokens {
  const t: Tokens = { name, description, color: {}, font: {}, fontSize: {}, spacing: {}, radius: {}, shadow: {}, breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 } };
  for (const p of proposals) {
    if (p.category === "color") t.color[p.name] = { value: String(p.value), role: p.role };
    else if (p.category === "font") t.font[p.name] = { family: String(p.value), use: p.role };
    else if (p.category === "shadow") t.shadow[p.name] = JSON.stringify(p.value);
    else t[p.category][p.name] = Number(p.value);
  }
  return t;
}
