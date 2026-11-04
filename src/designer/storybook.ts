// Render a team's Storybook: every story is an approved state, so its pixels and computed styles
// are ground truth for what the components really look like. Works against a running Storybook
// (dev server or deployed URL) or a static build folder (storybook-static), which we serve
// read-only. Storybook does the rendering with the repo's own dependencies; we only look.
import { createServer, type Server } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import type { AddressInfo } from "node:net";
import type { Page } from "playwright";
import { getBrowser } from "../visual.ts";
import { captureLooks, sameLook, type Look } from "../looks.ts";
import { collect, type ElementSample } from "./measure.ts";

export interface IndexEntry { id: string; title: string; name: string; importPath: string }
export interface StoryRender {
  entry: IndexEntry;
  url: string;
  png: Buffer | null;
  box: { x: number; y: number; w: number; h: number } | null;
  elements: ElementSample[];
  /** Computed look of every control the story shows. */
  looks: Look[];
  error: string | null;
}

const MIME: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf", ".ico": "image/x-icon", ".map": "application/json",
};

/** A URL to a Storybook, serving a static build folder on localhost if given a path. */
export async function openStorybook(uri: string): Promise<{ base: string; close: () => Promise<void> }> {
  if (/^https?:\/\//.test(uri)) return { base: uri.replace(/\/(index\.html|iframe\.html)?(\?.*)?$/, ""), close: async () => {} };
  const root = resolve(uri);
  if (!existsSync(join(root, "iframe.html"))) throw new Error(`${uri} isn't a Storybook build (no iframe.html). Run \`npx storybook build\` in the repo, or pass the URL of a running Storybook.`);
  const server: Server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    const file = normalize(join(root, path === "/" ? "index.html" : path));
    if (!(file === root || file.startsWith(root + sep)) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const { port } = server.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}`, close: () => new Promise((ok) => server.close(() => ok())) };
}

/** Stories (not docs pages) from index.json (Storybook 7+) or stories.json (6.4+). */
export async function loadIndex(base: string): Promise<IndexEntry[]> {
  for (const name of ["index.json", "stories.json"]) {
    const res = await fetch(`${base}/${name}`).catch(() => null);
    if (!res?.ok) continue;
    const json = (await res.json()) as { entries?: Record<string, IndexEntry & { type?: string }>; stories?: Record<string, IndexEntry & { type?: string; kind?: string }> };
    const all = Object.values(json.entries ?? json.stories ?? {});
    return all.filter((e) => (e.type ?? "story") === "story").map((e) => ({ id: e.id, title: e.title ?? (e as { kind?: string }).kind ?? "", name: e.name, importPath: e.importPath ?? "" }));
  }
  throw new Error(`No index.json or stories.json at ${base}; is this a Storybook (v6.4 or newer)?`);
}

/** Render one story in Storybook's bare iframe, crop to what the story drew, and measure it. */
export async function renderStory(base: string, entry: IndexEntry, viewport = { width: 1024, height: 768 }): Promise<StoryRender> {
  return (await renderStories(base, [entry], { viewport, concurrency: 1 }))[0];
}

/**
 * Render many stories. Each worker loads the preview once, then switches stories over Storybook's
 * channel (setCurrentStory → storyRendered), the way Storybook's own test-runner does, instead of
 * reloading the whole preview bundle per story. Previews without a channel get a fresh load each time.
 */
export async function renderStories(
  base: string,
  entries: IndexEntry[],
  opts: { viewport?: { width: number; height: number }; concurrency?: number; onRendered?: (r: StoryRender, done: number) => void } = {},
): Promise<StoryRender[]> {
  const viewport = opts.viewport ?? { width: 1024, height: 768 };
  const browser = await getBrowser();
  const out: StoryRender[] = new Array(entries.length);
  let next = 0, done = 0;
  const worker = async () => {
    const page = await browser.newPage({ viewport });
    await page.addInitScript("window.__name = (f) => f");
    let loaded = false;
    try {
      while (next < entries.length) {
        const i = next++;
        out[i] = await renderOn(page, base, entries[i], loaded).catch(async (e) => {
          loaded = false;
          return { entry: entries[i], url: storyUrl(base, entries[i]), png: null, box: null, elements: [], looks: [], error: (e as Error).message.split("\n")[0].slice(0, 200) };
        });
        loaded = out[i].error === null || loaded;
        opts.onRendered?.(out[i], ++done);
      }
    } finally {
      await page.close();
    }
  };
  await Promise.all(Array.from({ length: Math.min(opts.concurrency ?? 4, entries.length) }, worker));
  return out;
}

const storyUrl = (base: string, e: IndexEntry) => `${base}/iframe.html?id=${encodeURIComponent(e.id)}&viewMode=story`;

async function renderOn(page: Page, base: string, entry: IndexEntry, loaded: boolean): Promise<StoryRender> {
  const url = storyUrl(base, entry);
  const out: StoryRender = { entry, url, png: null, box: null, elements: [], looks: [], error: null };
  const switched = loaded && (await page.evaluate((id) => new Promise<string>((resolve) => {
    const ch = (window as unknown as { __STORYBOOK_ADDONS_CHANNEL__?: { on: (e: string, f: () => void) => void; off: (e: string, f: () => void) => void; emit: (e: string, d: unknown) => void } }).__STORYBOOK_ADDONS_CHANNEL__;
    if (!ch) return resolve("none");
    const events = ["storyRendered", "storyErrored", "storyThrewException", "storyMissing"];
    const handlers = events.map((ev) => {
      const f = () => finish(ev);
      ch.on(ev, f);
      return [ev, f] as const;
    });
    const timer = setTimeout(() => finish("timeout"), 20_000);
    function finish(r: string) {
      clearTimeout(timer);
      for (const [ev, f] of handlers) ch!.off(ev, f);
      resolve(r);
    }
    ch.emit("setCurrentStory", { storyId: id, viewMode: "story" });
  }), entry.id)) !== "none";
  if (!switched) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    // #storybook-root (v7+) or #root (v6); wait until the story has drawn something.
    await page.waitForFunction(() => {
      const root = document.querySelector("#storybook-root") ?? document.querySelector("#root");
      return (root && root.childElementCount > 0) || document.body.classList.contains("sb-show-errordisplay");
    }, null, { timeout: 30_000 });
  }
  await page.waitForLoadState("networkidle", { timeout: 3_000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
  const err = await page.evaluate(() => (document.body.classList.contains("sb-show-errordisplay") ? (document.querySelector("#error-message")?.textContent ?? "story threw an error").trim() || "story threw an error" : null));
  if (err) {
    out.error = err.slice(0, 200);
    return out;
  }
  // The story's own footprint: the union of what it paints (text, fills, borders, media). Transparent
  // block wrappers are skipped: they stretch to the canvas width without drawing anything.
  const box = await page.evaluate(() => {
    const root = (document.querySelector("#storybook-root") ?? document.querySelector("#root"))!;
    const clear = (c: string) => c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of Array.from(root.querySelectorAll("*"))) {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width < 1 || r.height < 1 || s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) continue;
      const text = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim());
      const paints = text || !clear(s.backgroundColor) || s.backgroundImage !== "none" || s.boxShadow !== "none" || ["Top", "Right", "Bottom", "Left"].some((d) => parseFloat(s.getPropertyValue(`border-${d.toLowerCase()}-width`)) > 0 && !clear(s.getPropertyValue(`border-${d.toLowerCase()}-color`))) || /^(IMG|SVG|svg|INPUT|TEXTAREA|SELECT|CANVAS|VIDEO|PICTURE|IFRAME)$/.test(el.tagName);
      if (!paints) continue;
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top + scrollY); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom + scrollY);
    }
    return Number.isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  });
  if (!box) {
    out.error = "story rendered nothing visible";
    return out;
  }
  const pad = 8;
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  const x = Math.max(0, Math.floor(box.x - pad)), y = Math.max(0, Math.floor(box.y - pad));
  out.box = { x, y, w: Math.max(1, Math.min(docW - x, Math.ceil(box.w + 2 * pad))), h: Math.min(4000, Math.ceil(box.h + 2 * pad)) };
  out.png = await page.screenshot({ clip: { x: out.box.x, y: out.box.y, width: out.box.w, height: out.box.h }, fullPage: true });
  out.elements = await page.evaluate(collect);
  // At rest, on hover and with keyboard focus (after the screenshot, so the image shows the resting state).
  for (const { look } of await captureLooks(page, "#storybook-root, #root", { max: 8 })) if (!out.looks.some((x) => sameLook(x, look))) out.looks.push(look);
  return out;
}

/** Storybook's id slug for an export name: InAForm → in-a-form. */
export const storySlug = (s: string) => s.replace(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, "-").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
