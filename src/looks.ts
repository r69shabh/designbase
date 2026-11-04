// Approved looks: how each control is drawn in the team's Storybook. A story render records the
// computed look of every control it shows; the visual check then requires every control on a page
// to match one of them. Measured values only: colours as hex, sizes in px.
import { deltaE2000 } from "./color.ts";

export interface Look {
  /** "button", "input:text", "select", "textarea", or the ARIA role (checkbox, switch, tab…). */
  kind: string;
  bg: string | null;
  color: string;
  border: string | null;
  radius: number;
  padding: number[]; // top right bottom left
  fontSize: number;
  fontWeight: number;
  height: number;
}

export interface RawControl extends Omit<Look, "bg" | "color" | "border"> { bg: string; color: string; border: string; label: string; sel: string }

/**
 * Runs in the page (self-contained): the computed look of every visible, enabled control under `scope`.
 * Text-like inputs share one kind; other inputs and role-bearing elements keep their own.
 */
export function measureControls(scope: string | null): RawControl[] {
  const root = (scope && document.querySelector(scope)) || document.body;
  const px = (v: string) => Math.round((parseFloat(v) || 0) * 10) / 10;
  const out: RawControl[] = [];
  for (const el of Array.from(root.querySelectorAll("button, input, select, textarea, [role]"))) {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    const type = tag === "input" ? ((el as HTMLInputElement).type || "text") : "";
    if (type === "hidden" || (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") continue;
    const kind = role && role !== "button" && role !== "textbox" ? role
      : tag === "input" ? (/^(text|email|password|search|tel|url|number|date|time)$/.test(type) ? "input:text" : `input:${type}`)
      : tag === "select" || tag === "textarea" ? tag
      : tag === "button" || role === "button" ? "button" : "";
    if (!kind || !/^(button|input:|select$|textarea$|checkbox$|switch$|radio$|tab$|combobox$|menuitem$|option$|slider$)/.test(kind)) continue;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    // Visually hidden natives (a 1px checkbox under a custom-drawn one) aren't what the user sees.
    if (r.width <= 2 || r.height <= 2 || s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) continue;
    const side = ["top", "right", "bottom", "left"].find((d) => px(s.getPropertyValue(`border-${d}-width`)) > 0 && s.getPropertyValue(`border-${d}-style`) !== "none");
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 2).filter(Boolean) : [];
    out.push({
      kind,
      bg: s.backgroundColor,
      color: s.color,
      border: side ? s.getPropertyValue(`border-${side}-color`) : "",
      radius: px(s.borderTopLeftRadius),
      padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(px),
      fontSize: px(s.fontSize),
      fontWeight: Number(s.fontWeight) || 400,
      height: Math.round(r.height),
      label: ((el as HTMLElement).innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim().slice(0, 30),
      sel: tag + (cls.length ? "." + cls.join(".") : ""),
    });
  }
  return out;
}

const hex = (css: string): string | null => {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (a < 0.1) return null;
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
};

export const toLook = (c: RawControl): Look => ({
  kind: c.kind, bg: hex(c.bg), color: hex(c.color) ?? "#000000", border: c.border ? hex(c.border) : null,
  radius: c.radius, padding: c.padding, fontSize: c.fontSize, fontWeight: c.fontWeight, height: c.height,
});

/** Differences between an element's look and an approved one; empty means it matches. */
export function lookDiff(actual: Look, approved: Look): string[] {
  const d: string[] = [];
  const col = (what: string, a: string | null, b: string | null) => {
    if (a === b) return;
    if (!a || !b || deltaE2000(a, b) > 3) d.push(`${what} ${a ?? "none"} vs ${b ?? "none"}`);
  };
  col("background", actual.bg, approved.bg);
  col("text", actual.color, approved.color);
  col("border", actual.border, approved.border);
  if (Math.abs(actual.radius - approved.radius) > 1 && !(actual.radius > 999 && approved.radius > 999)) d.push(`radius ${actual.radius} vs ${approved.radius}`);
  if (actual.padding.some((p, i) => Math.abs(p - approved.padding[i]) > 2)) d.push(`padding ${pad(actual.padding)} vs ${pad(approved.padding)}`);
  if (Math.abs(actual.fontSize - approved.fontSize) > 0.5) d.push(`font ${actual.fontSize}px vs ${approved.fontSize}px`);
  if (Math.abs(actual.fontWeight - approved.fontWeight) >= 100) d.push(`weight ${actual.fontWeight} vs ${approved.fontWeight}`);
  if (Math.abs(actual.height - approved.height) > 2) d.push(`height ${actual.height} vs ${approved.height}`);
  return d;
}

const pad = (p: number[]) => (p[0] === p[2] && p[1] === p[3] ? `${p[0]}×${p[1]}` : p.join("/"));

/** "background #0F172A, text #F8FAFC, 14px/500, radius 6, padding 8×16, 36px tall" */
export const describeLook = (l: Look) =>
  [l.bg ? `background ${l.bg}` : "no fill", `text ${l.color}`, l.border ? `border ${l.border}` : null, `${l.fontSize}px/${l.fontWeight}`, `radius ${l.radius > 999 ? "pill" : l.radius}`, `padding ${pad(l.padding)}`, `${l.height}px tall`].filter(Boolean).join(", ");

export const sameLook = (a: Look, b: Look) => a.kind === b.kind && !lookDiff(a, b).length;
