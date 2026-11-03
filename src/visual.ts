import { chromium, type Browser } from "playwright";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Playbook } from "./playbook.ts";
import { rule } from "./playbook.ts";
import type { Violation } from "./lint.ts";

export const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

interface Measured {
  sel: string;
  color: string;
  bg: string;
  effectiveBg: string | null;
  borderColors: string[];
  font: string;
  fontSize: number;
  bold: boolean;
  hasText: boolean;
  spacing: number[];
  radius: number[];
  shadow: string;
}

export interface VisualResult {
  target: string;
  violations: Violation[];
  screenshots: { viewport: string; path: string }[];
  elementsMeasured: number;
}

type RGB = [number, number, number, number];
const parseColor = (s: string): RGB | null => {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = "1"] = m[1].split(/[,\s/]+/).filter(Boolean);
  return [Number(r), Number(g), Number(b), Number(a)];
};
const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16), 1];
};
const luminance = ([r, g, b]: RGB) => {
  const c = [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a: RGB, b: RGB) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const dist = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const toHex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

export function toUrl(target: string): string {
  return /^https?:\/\//.test(target) ? target : pathToFileURL(resolve(target)).href;
}

/** Runs in the page: computed styles of every visible element. */
function measurePage(): Measured[] {
  const px = (v: string) => parseFloat(v) || 0;
  const transparent = (c: string) => c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);
  const selector = (el: Element) => {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 2).filter(Boolean) : [];
    return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (cls.length ? "." + cls.join(".") : "");
  };
  // null when text sits on a gradient or image: contrast can't be computed from styles alone.
  const effectiveBg = (el: Element | null): string | null => {
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== "none") return null;
      if (!transparent(cs.backgroundColor)) return cs.backgroundColor;
    }
    return "rgb(255, 255, 255)";
  };
  const out: Measured[] = [];
  for (const el of Array.from(document.body.querySelectorAll("*"))) {
    if (["SCRIPT", "STYLE", "LINK", "META", "BR", "svg", "path"].includes(el.tagName)) continue;
    const rect = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (rect.width === 0 || rect.height === 0 || s.visibility === "hidden" || s.display === "none") continue;
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim().length > 0)
      || ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && !!(el as HTMLInputElement).value);
    const borders = (["Top", "Right", "Bottom", "Left"] as const)
      .filter((side) => px(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 && s.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none")
      .map((side) => s.getPropertyValue(`border-${side.toLowerCase()}-color`));
    out.push({
      sel: selector(el),
      color: s.color,
      bg: s.backgroundColor,
      effectiveBg: effectiveBg(el),
      borderColors: borders,
      font: s.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
      fontSize: px(s.fontSize),
      bold: Number(s.fontWeight) >= 700,
      hasText,
      spacing: [
        s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft,
        s.marginTop, s.marginBottom,
        // Equal left/right margins are almost always margin: 0 auto centring, not a spacing choice.
        ...(px(s.marginLeft) === px(s.marginRight) && px(s.marginLeft) > 0 ? [] : [s.marginLeft, s.marginRight]),
        s.rowGap, s.columnGap,
      ].map(px),
      radius: [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius].map(px),
      shadow: s.boxShadow,
    });
  }
  return out;
}

class Collector {
  private groups = new Map<string, Violation & { examples: string[] }>();
  constructor(private pb: Playbook) {}
  add(id: string, key: string, message: string, sel: string) {
    const k = `${id}|${key}`;
    const existing = this.groups.get(k);
    if (existing) {
      existing.count! += 1;
      if (existing.examples.length < 3 && !existing.examples.includes(sel)) existing.examples.push(sel);
      return;
    }
    const r = rule(this.pb, id);
    this.groups.set(k, { rule: id, severity: r.severity, message, fix: r.fix, count: 1, examples: [sel] });
  }
  list(): Violation[] {
    return [...this.groups.values()].sort((a, b) => (a.severity === b.severity ? b.count! - a.count! : a.severity === "error" ? -1 : 1));
  }
}

export function evaluate(pb: Playbook, elements: Measured[]): Violation[] {
  const t = pb.tokens;
  const palette = Object.entries(t.color).map(([name, c]) => ({ name, rgb: hexToRgb(c.value) }));
  const families = Object.values(t.font).map((f) => f.family.toLowerCase());
  const sizes = new Set(Object.values(t.fontSize));
  const spacing = new Set(Object.values(t.spacing));
  const steps = Object.values(t.spacing).sort((a, b) => a - b);
  const nearestSteps = (v: number) => [steps.filter((s) => s < v).pop(), steps.find((s) => s > v)].filter((s) => s !== undefined).map((s) => `${s}px`).join(" or ");
  const radii = new Set(Object.values(t.radius));
  const col = new Collector(pb);

  const checkColor = (css: string, what: string, sel: string) => {
    const c = parseColor(css);
    if (!c || c[3] === 0) return;
    const nearest = palette.reduce((best, p) => (dist(p.rgb, c) < dist(best.rgb, c) ? p : best));
    // Translucent colours are compared on their RGB; small tolerance for anti-aliasing and rounding.
    if (dist(nearest.rgb, c) > 6) col.add("no-raw-colors", `${what}:${toHex(c)}`, `${what} ${toHex(c)} is not a palette colour (nearest: ${nearest.name} ${toHex(nearest.rgb)})`, sel);
  };

  for (const el of elements) {
    if (el.hasText) checkColor(el.color, "Text colour", el.sel);
    checkColor(el.bg, "Background", el.sel);
    for (const b of new Set(el.borderColors)) checkColor(b, "Border", el.sel);

    if (el.hasText) {
      if (!families.includes(el.font.toLowerCase())) col.add("font-families", el.font, `Font "${el.font}" is not in the playbook`, el.sel);
      const size = Math.round(el.fontSize * 10) / 10;
      if (!sizes.has(size)) col.add("type-scale", String(size), `Font size ${size}px is off the type scale`, el.sel);

      const fg = parseColor(el.color);
      const bg = el.effectiveBg ? parseColor(el.effectiveBg) : null;
      if (fg && bg) {
        const ratio = contrast(fg, bg);
        const large = el.fontSize >= 24 || (el.fontSize >= 18.66 && el.bold);
        if (ratio < (large ? 3 : 4.5)) col.add("contrast", `${toHex(fg)}/${toHex(bg)}`, `Text ${toHex(fg)} on ${toHex(bg)} is ${ratio.toFixed(2)}:1`, el.sel);
      }
    }

    for (const v of el.spacing) {
      const r = Math.round(v);
      if (r > 0 && !spacing.has(r) && Math.abs(v - r) < 0.01) col.add("spacing-scale", String(r), `Spacing ${r}px is off the scale → ${nearestSteps(r)}`, el.sel);
    }
    for (const v of el.radius) {
      const r = Math.round(v);
      if (r > 0 && r < 999 && !radii.has(r)) col.add("radius-scale", String(r), `Corner radius ${r}px is off the scale`, el.sel);
    }
    if (el.shadow && el.shadow !== "none" && !Object.keys(t.shadow).length) col.add("no-shadows", "shadow", "Element has a box-shadow", el.sel);
  }
  return col.list();
}

let browser: Browser | null = null;
async function getBrowser() {
  browser ??= await chromium.launch();
  return browser;
}
export async function closeBrowser() {
  await browser?.close();
  browser = null;
}

export async function visualCheck(pb: Playbook, target: string, outDir = ".designbase/shots"): Promise<VisualResult> {
  const url = toUrl(target);
  mkdirSync(outDir, { recursive: true });
  const b = await getBrowser();
  const stamp = Date.now();
  const screenshots: VisualResult["screenshots"] = [];
  let violations: Violation[] = [];
  let elementsMeasured = 0;

  for (const vp of VIEWPORTS) {
    const page = await b.newPage({ viewport: { width: vp.width, height: vp.height } });
    // tsx keeps function names by wrapping them in __name(), which doesn't exist in the page.
    await page.addInitScript("window.__name = (f) => f");
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
      const path = join(outDir, `${stamp}-${vp.name}.png`);
      await page.screenshot({ path, fullPage: true });
      screenshots.push({ viewport: vp.name, path: resolve(path) });

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (vp.name === "mobile" && overflow > 1) {
        const r = rule(pb, "no-horizontal-overflow");
        violations.push({ rule: r.id, severity: r.severity, message: `Page is ${overflow}px wider than a 375px viewport`, fix: r.fix });
      }
      // Token conformance is measured once, at desktop, where every element is laid out.
      if (vp.name === "desktop") {
        const elements = await page.evaluate(measurePage);
        elementsMeasured = elements.length;
        violations = [...violations, ...evaluate(pb, elements)];
      }
    } finally {
      await page.close();
    }
  }
  return { target, violations, screenshots, elementsMeasured };
}
