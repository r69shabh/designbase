// Approved looks: how each control is drawn in the team's Storybook, at rest, on hover and with
// keyboard focus (and disabled). A story render records the computed look of every control it
// shows; the visual check then requires every control on a page to match one of them, in each
// state. Measured values only: colours as hex, sizes in px.
import type { Page } from "playwright";
import { deltaE2000 } from "./color.ts";

/** The visible focus indicator: an outline, or a box-shadow ring. */
export interface Ring { style: "outline" | "shadow"; width: number; color: string }

/** One state's appearance. */
export interface StateLook {
  bg: string | null;
  color: string;
  border: string | null;
  radius: number;
  padding: number[]; // top right bottom left
  fontSize: number;
  fontWeight: number;
  height: number;
  ring: Ring | null;
}

export interface Look extends StateLook {
  /** "button", "input:text", "select", "textarea", or the ARIA role (checkbox, switch, tab…). */
  kind: string;
  /** Disabled controls are their own approved looks, compared only with disabled controls. */
  disabled?: boolean;
  hover?: StateLook;
  focus?: StateLook;
}

export interface RawControl {
  id: number;
  kind: string;
  disabled: boolean;
  bg: string;
  color: string;
  border: string;
  radius: number;
  padding: number[];
  fontSize: number;
  fontWeight: number;
  height: number;
  outline: { style: string; width: number; color: string };
  shadow: string;
  /** Longest transition on the element, so state captures wait for it to finish. */
  transitionMs: number;
  label: string;
  sel: string;
  /** Full class list: controls share captured states only when this matches too. */
  classes: string;
}

/**
 * Runs in the page (self-contained): the computed look of every visible control under `scope`.
 * With `tag`, each gets a data-db-ctl id so its states can be driven; with `only`, just that one is
 * measured. Text-like inputs share one kind; other inputs and role-bearing elements keep their own.
 */
export function measureControls(opts: { scope: string | null; tag?: boolean; only?: number }): RawControl[] {
  const root = (opts.scope && document.querySelector(opts.scope)) || document.body;
  const px = (v: string) => Math.round((parseFloat(v) || 0) * 10) / 10;
  const ms = (v: string) => Math.max(0, ...v.split(",").map((t) => (t.trim().endsWith("ms") ? parseFloat(t) : parseFloat(t) * 1000) || 0));
  const out: RawControl[] = [];
  const els = opts.only !== undefined ? Array.from(document.querySelectorAll(`[data-db-ctl="${opts.only}"]`)) : Array.from(root.querySelectorAll("button, input, select, textarea, [role]"));
  els.forEach((el, i) => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    const type = tag === "input" ? ((el as HTMLInputElement).type || "text") : "";
    if (type === "hidden") return;
    const kind = role && role !== "button" && role !== "textbox" ? role
      : tag === "input" ? (/^(text|email|password|search|tel|url|number|date|time)$/.test(type) ? "input:text" : `input:${type}`)
      : tag === "select" || tag === "textarea" ? tag
      : tag === "button" || role === "button" ? "button" : "";
    if (!kind || !/^(button|input:|select$|textarea$|checkbox$|switch$|radio$|tab$|combobox$|menuitem$|option$|slider$)/.test(kind)) return;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    // Visually hidden natives (a 1px checkbox under a custom-drawn one) aren't what the user sees.
    if (r.width <= 2 || r.height <= 2 || s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return;
    const id = opts.only ?? i;
    if (opts.tag) el.setAttribute("data-db-ctl", String(id));
    const side = ["top", "right", "bottom", "left"].find((d) => px(s.getPropertyValue(`border-${d}-width`)) > 0 && s.getPropertyValue(`border-${d}-style`) !== "none");
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 2).filter(Boolean) : [];
    out.push({
      id,
      kind,
      disabled: !!(el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true",
      bg: s.backgroundColor,
      color: s.color,
      border: side ? s.getPropertyValue(`border-${side}-color`) : "",
      radius: px(s.borderTopLeftRadius),
      padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(px),
      fontSize: px(s.fontSize),
      fontWeight: Number(s.fontWeight) || 400,
      height: Math.round(r.height),
      outline: { style: s.outlineStyle, width: px(s.outlineWidth), color: s.outlineColor },
      shadow: s.boxShadow,
      transitionMs: Math.min(1000, Math.max(...s.transitionDuration.split(",").map((d, k) => ms(d) + ms(s.transitionDelay.split(",")[k] ?? "0")))),
      label: ((el as HTMLElement).innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim().slice(0, 30),
      sel: tag + (cls.length ? "." + cls.join(".") : ""),
      classes: `${tag} ${typeof el.className === "string" ? el.className.trim() : ""}`,
    });
  });
  return out;
}

// Translucent fills (Carbon's hover is rgba(141,141,141,0.12)) are reported as seen over white,
// the same way on both sides of every comparison.
const hex = (css: string): string | null => {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a0 = 1] = m[1].split(/[,\s/]+/).filter(Boolean).map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : Number(v)));
  const a = Math.min(1, a0);
  if (a < 0.1) return null;
  return "#" + [r, g, b].map((v) => Math.round(v * a + 255 * (1 - a)).toString(16).padStart(2, "0")).join("").toUpperCase();
};

function ringOf(c: RawControl): Ring | null {
  if (c.outline.style !== "none" && c.outline.width > 0) {
    const color = hex(c.outline.color);
    if (color) return { style: "outline", width: c.outline.width, color };
  }
  // A shadow with a solid spread reads as a ring: "rgb(…) 0px 0px 0px 2px", outside or inset (Carbon).
  for (const part of c.shadow === "none" ? [] : c.shadow.split(/,(?![^(]*\))/)) {
    const color = hex(part.match(/rgba?\([^)]+\)/)?.[0] ?? "");
    const lengths = part.replace(/rgba?\([^)]+\)/, "").replace("inset", "").trim().split(/\s+/).map((v) => parseFloat(v) || 0);
    const spread = lengths[3] ?? 0;
    if (color && spread > 0) return { style: "shadow", width: spread, color };
  }
  return null;
}

const stateOf = (c: RawControl): StateLook => ({
  bg: hex(c.bg), color: hex(c.color) ?? "#000000", border: c.border ? hex(c.border) : null,
  radius: c.radius, padding: c.padding, fontSize: c.fontSize, fontWeight: c.fontWeight, height: c.height, ring: ringOf(c),
});

export const toLook = (c: RawControl): Look => ({ kind: c.kind, ...(c.disabled ? { disabled: true } : {}), ...stateOf(c) });

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Measure every control under `scope` at rest, then drive hover and keyboard focus on each distinct
 * one (up to `max`) and measure again. Identical controls share their representative's states.
 */
export async function captureLooks(page: Page, scope: string | null, opts: { max?: number; states?: boolean } = {}): Promise<{ raw: RawControl; look: Look }[]> {
  const raws = await page.evaluate(measureControls, { scope, tag: true });
  const out = raws.map((raw) => ({ raw, look: toLook(raw) }));
  if (opts.states === false) return out;
  const reps: { look: Look; classes: string }[] = [];
  for (const o of out) {
    if (o.look.disabled) continue;
    // Same resting look and same classes: same states. A different class (a focus override) gets its own capture.
    const rep = reps.find((r) => r.classes === o.raw.classes && sameLook(r.look, o.look))?.look;
    if (rep) {
      if (rep.hover) o.look.hover = rep.hover;
      if (rep.focus) o.look.focus = rep.focus;
      continue;
    }
    if (reps.length >= (opts.max ?? 12)) continue;
    reps.push({ look: o.look, classes: o.raw.classes });
    const sel = `[data-db-ctl="${o.raw.id}"]`;
    const settle = () => wait(Math.min(o.raw.transitionMs, 600) + 40);
    const measure = async () => (await page.evaluate(measureControls, { scope: null, only: o.raw.id }))[0];
    try {
      await page.hover(sel, { timeout: 2000, force: true });
      await settle();
      const h = await measure();
      if (h) o.look.hover = stateOf(h);
      await page.mouse.move(0, 0);
      // A key press first, so focus() counts as keyboard focus and :focus-visible styles apply.
      await page.keyboard.press("Shift");
      await page.focus(sel, { timeout: 2000 });
      await settle();
      const f = await measure();
      if (f) o.look.focus = stateOf(f);
    } catch {
      // Covered or detached controls keep their resting look only.
    } finally {
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.()).catch(() => {});
      await page.mouse.move(0, 0).catch(() => {});
    }
  }
  return out;
}

const col = (d: string[], what: string, a: string | null, b: string | null, tol = 3) => {
  if (a === b) return;
  if (!a || !b || deltaE2000(a, b) > tol) d.push(`${what} ${a ?? "none"} vs ${b ?? "none"}`);
};

/** Differences between an element's look (one state) and an approved one; empty means it matches. */
export function lookDiff(actual: StateLook, approved: StateLook): string[] {
  const d: string[] = [];
  col(d, "background", actual.bg, approved.bg);
  col(d, "text", actual.color, approved.color);
  col(d, "border", actual.border, approved.border);
  if (Math.abs(actual.radius - approved.radius) > 1 && !(actual.radius > 999 && approved.radius > 999)) d.push(`radius ${actual.radius} vs ${approved.radius}`);
  if (actual.padding.some((p, i) => Math.abs(p - approved.padding[i]) > 2)) d.push(`padding ${pad(actual.padding)} vs ${pad(approved.padding)}`);
  if (Math.abs(actual.fontSize - approved.fontSize) > 0.5) d.push(`font ${actual.fontSize}px vs ${approved.fontSize}px`);
  if (Math.abs(actual.fontWeight - approved.fontWeight) >= 100) d.push(`weight ${actual.fontWeight} vs ${approved.fontWeight}`);
  if (Math.abs(actual.height - approved.height) > 2) d.push(`height ${actual.height} vs ${approved.height}`);
  return d;
}

/** Focus also compares the focus indicator: a missing ring is the difference that matters most. */
export function focusDiff(actual: StateLook, approved: StateLook): string[] {
  const d = lookDiff(actual, approved);
  const a = actual.ring, b = approved.ring;
  if (b && !a) d.unshift(`no visible focus indicator (approved: ${describeRing(b)})`);
  else if (a && b) {
    col(d, "focus ring", a.color, b.color, 5);
    if (Math.abs(a.width - b.width) > 1) d.push(`focus ring ${a.width}px vs ${b.width}px`);
  }
  return d;
}

const pad = (p: number[]) => (p[0] === p[2] && p[1] === p[3] ? `${p[0]}×${p[1]}` : p.join("/"));
export const describeRing = (r: Ring) => `${r.style === "outline" ? "outline" : "ring"} ${r.width}px ${r.color}`;

/** What changes from the resting look: "background #0353E9" or "outline 2px #0F62FE, border #0F62FE". */
export function describeChange(rest: StateLook, state: StateLook): string {
  const out: string[] = [];
  if (state.bg !== rest.bg) out.push(state.bg ? `background ${state.bg}` : "no fill");
  if (state.color !== rest.color) out.push(`text ${state.color}`);
  if (state.border !== rest.border) out.push(state.border ? `border ${state.border}` : "no border");
  if (state.ring && JSON.stringify(state.ring) !== JSON.stringify(rest.ring)) out.push(describeRing(state.ring));
  return out.join(", ") || "no visible change";
}

/** "background #0F172A, text #F8FAFC, 14px/500, radius 6, padding 8×16, 36px tall; hover: …; focus: …" */
export const describeLook = (l: Look) =>
  [
    [l.bg ? `background ${l.bg}` : "no fill", `text ${l.color}`, l.border ? `border ${l.border}` : null, `${l.fontSize}px/${l.fontWeight}`, `radius ${l.radius > 999 ? "pill" : l.radius}`, `padding ${pad(l.padding)}`, `${l.height}px tall`].filter(Boolean).join(", "),
    l.hover ? `hover: ${describeChange(l, l.hover)}` : null,
    l.focus ? `focus: ${describeChange(l, l.focus)}` : null,
  ].filter(Boolean).join("; ");

export const sameLook = (a: Look, b: Look) => a.kind === b.kind && !!a.disabled === !!b.disabled && !lookDiff(a, b).length;
