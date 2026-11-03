// Deterministic measurement: the designer agent's values come from here, never from a model.
//   measureUrl:   computed styles of every visible element on a live page (exact).
//   measureImage: colour histogram of a screenshot (exact for flat fills, approximate for text).
import type { Page } from "playwright";
import { getBrowser, toUrl } from "../visual.ts";

export interface ElementSample {
  /** Index in the elements array, and the index of the nearest measured ancestor (-1 at the top). */
  idx: number;
  parent: number;
  tag: string;
  role: "text" | "heading" | "button" | "input" | "link" | "container" | "image" | "other";
  text: number; // length of own text
  box: { x: number; y: number; w: number; h: number };
  color: string;
  bg: string;
  border: string | null;
  font: string;
  fontStack: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  spacing: { padding: number[]; margin: number[]; gap: number[] };
  radius: number;
  shadow: string;
  layout: { display: string; direction: string; align: string; justify: string };
  /** First characters of the element's own text, for describing components. */
  sample: string;
}

export interface UrlMeasurement {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  elements: ElementSample[];
  /** Full page. */
  screenshot: Buffer;
  /** First viewport only: what the interpreter sees. */
  viewportShot: Buffer;
}

function collect(): ElementSample[] {
  const px = (v: string) => parseFloat(v) || 0;
  const transparent = (c: string) => c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);
  const out: ElementSample[] = [];
  const index = new Map<Element, number>();
  // Include <html> and <body> themselves: sites set the page background and base font there.
  for (const el of [document.documentElement, document.body, ...Array.from(document.body.querySelectorAll("*"))]) {
    if (["SCRIPT", "STYLE", "LINK", "META", "BR", "NOSCRIPT", "TEMPLATE"].includes(el.tagName)) continue;
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (r.width < 1 || r.height < 1 || s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) continue;
    const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent!.trim()).join("").length;
    const tag = el.tagName.toLowerCase();
    const role: ElementSample["role"] =
      /^h[1-6]$/.test(tag) ? "heading"
      : tag === "button" || el.getAttribute("role") === "button" ? "button"
      : ["input", "textarea", "select"].includes(tag) ? "input"
      : tag === "a" ? "link"
      : ["img", "svg", "picture", "video", "canvas"].includes(tag) ? "image"
      : own > 0 ? "text"
      : s.display !== "inline" ? "container" : "other";
    const lh = s.lineHeight === "normal" ? px(s.fontSize) * 1.2 : px(s.lineHeight);
    let parent = -1;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const i = index.get(p);
      if (i !== undefined) {
        parent = i;
        break;
      }
    }
    index.set(el, out.length);
    const ownText = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent!.trim()).join(" ").trim();
    out.push({
      idx: out.length,
      parent,
      tag,
      role,
      text: own,
      box: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      color: s.color,
      bg: transparent(s.backgroundColor) ? "" : s.backgroundColor,
      // The colour of whichever side is drawn (a left-only accent rule counts).
      border: (["Top", "Left", "Bottom", "Right"] as const).map((side) => (px(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 && s.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none" ? s.getPropertyValue(`border-${side.toLowerCase()}-color`) : null)).find((c) => c && !transparent(c)) ?? null,
      font: s.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
      fontStack: s.fontFamily,
      fontSize: px(s.fontSize),
      fontWeight: Number(s.fontWeight) || 400,
      lineHeight: Math.round(lh * 10) / 10,
      spacing: {
        padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(px),
        // Equal horizontal margins are auto-centring, not a spacing decision.
        margin: [s.marginTop, s.marginBottom, ...(px(s.marginLeft) === px(s.marginRight) ? [] : [s.marginLeft, s.marginRight])].map(px),
        gap: s.display.includes("flex") || s.display.includes("grid") ? [px(s.rowGap), px(s.columnGap)] : [],
      },
      radius: px(s.borderTopLeftRadius),
      shadow: s.boxShadow,
      layout: { display: s.display, direction: s.flexDirection, align: s.alignItems, justify: s.justifyContent },
      sample: ownText.slice(0, 40) || (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ? String((el as HTMLInputElement).value ?? "") : "").slice(0, 40) || (el.getAttribute("placeholder") ?? "").slice(0, 40),
    });
  }
  return out;
}

async function withPage<T>(width: number, height: number, fn: (page: Page) => Promise<T>): Promise<T> {
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript("window.__name = (f) => f");
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}

export async function measureUrl(target: string, viewport = { width: 1280, height: 900 }): Promise<UrlMeasurement> {
  return withPage(viewport.width, viewport.height, async (page) => {
    await page.goto(toUrl(target), { waitUntil: "networkidle", timeout: 45_000 });
    // Let webfonts and lazy content settle.
    await page.evaluate(() => document.fonts?.ready);
    const elements = await page.evaluate(collect);
    const screenshot = await page.screenshot({ fullPage: true });
    const viewportShot = await page.screenshot();
    return { url: target, title: await page.title(), viewport, elements, screenshot, viewportShot };
  });
}

export interface ImageColor { hex: string; share: number; pixels: number }
export interface ImageMeasurement { width: number; height: number; colors: ImageColor[] }

/** Is `c` (approximately) a mix of `a` and `b`, the way anti-aliased edges and shadows are? */
function isBlend(c: number[], a: number[], b: number[]): boolean {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
  if (len2 < 400) return false;
  const t = ((c[0] - a[0]) * ab[0] + (c[1] - a[1]) * ab[1] + (c[2] - a[2]) * ab[2]) / len2;
  if (t < 0.06 || t > 0.94) return false;
  return distance(c, [a[0] + t * ab[0], a[1] + t * ab[1], a[2] + t * ab[2]]) < 4;
}

/**
 * Exact colours of a screenshot. Flat UI fills repeat the exact same RGB many times, so a histogram
 * of exact values (merging near-duplicates from compression) recovers them precisely. Small text and
 * 1px borders still leave a few hundred exact pixels, so colours are kept by absolute pixel count;
 * anti-aliasing and shadow blur produce in-between colours, which are dropped when they sit on the
 * line between two stronger colours.
 */
export async function measureImage(png: Buffer, mime = "image/png", opts: { minPixels?: number } = {}): Promise<ImageMeasurement> {
  const minPixels = opts.minPixels ?? 60;
  return withPage(400, 300, async (page) => {
    const result = await page.evaluate(
      async ({ data, mime }) => {
        const img = new Image();
        img.src = `data:${mime};base64,${data}`;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const { data: px } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const counts = new Map<number, number>();
        for (let i = 0; i < px.length; i += 4) {
          if (px[i + 3] < 250) continue;
          const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return { width: canvas.width, height: canvas.height, counts: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6_000) };
      },
      { data: png.toString("base64"), mime },
    );
    const total = result.width * result.height;
    const merged: { rgb: number[]; pixels: number }[] = [];
    for (const [key, n] of result.counts) {
      const rgb = [(key >> 16) & 255, (key >> 8) & 255, key & 255];
      const near = merged.find((c) => distance(c.rgb, rgb) < 6);
      if (near) near.pixels += n;
      else if (n >= minPixels / 3) merged.push({ rgb, pixels: n });
    }
    const kept = merged.filter((c) => c.pixels >= minPixels).sort((a, b) => b.pixels - a.pixels);
    // Blend test against stronger colours only (a blend always has fewer pixels than what it blends).
    const colors = kept.filter((c, i) => !kept.slice(0, i).some((a, j) => kept.slice(0, i).some((b, k) => k > j && isBlend(c.rgb, a.rgb, b.rgb))));
    return { width: result.width, height: result.height, colors: colors.map((c) => ({ hex: rgbHex(c.rgb), share: c.pixels / total, pixels: c.pixels })) };
  });
}

export const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export const rgbHex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
export const distance = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export function cssColorHex(css: string): string | null {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = "1"] = m[1].split(/[,\s/]+/).filter(Boolean);
  if (Number(a) < 0.5) return null;
  return rgbHex([Number(r), Number(g), Number(b)]);
}
