// Component discovery on live pages: find visual units, group them by DOM shape (ignoring text and
// colour), split groups into variants by colour, and describe each instance in the playbook's own
// token vocabulary so a model can write the component without guessing values.
import type { Tokens } from "../playbook.ts";
import { getBrowser } from "../visual.ts";
import { cssColorHex, distance, hexRgb, type ElementSample, type UrlMeasurement } from "./measure.ts";

export interface Instance {
  page: string;
  idx: number;
  box: ElementSample["box"];
  skin: string;
  description: string;
}
export interface Candidate {
  id: string;
  kind: string;
  shape: string;
  instances: Instance[];
  /** Distinct colour treatments of the same shape, e.g. primary vs secondary buttons. */
  skins: string[];
  subtreeSize: number;
  crops: Buffer[];
}

interface Node extends ElementSample {
  children: Node[];
  size: number;
  page: string;
}

const KIND: Record<string, string> = { button: "button", input: "input", textarea: "input", select: "input", a: "link", table: "table", nav: "nav", ul: "list", ol: "list", li: "item", img: "media", svg: "media", form: "form", header: "header", section: "section", article: "section", aside: "section", label: "label" };
const kindOf = (n: ElementSample) => KIND[n.tag] ?? (n.role === "heading" ? "heading" : n.role === "text" ? "text" : "box");

/** A vocabulary that maps measured values to token names (falls back to raw values). */
export class Vocabulary {
  private colors: { name: string; rgb: number[] }[];
  constructor(private tokens: Tokens) {
    this.colors = Object.entries(tokens.color).map(([name, c]) => ({ name, rgb: hexRgb(c.value) }));
  }
  color(css: string | null | undefined): string | null {
    const hex = css ? cssColorHex(css) : null;
    if (!hex) return null;
    const rgb = hexRgb(hex);
    const best = this.colors.reduce<{ name: string; d: number } | null>((b, c) => {
      const d = distance(c.rgb, rgb);
      return !b || d < b.d ? { name: c.name, d } : b;
    }, null);
    return best && best.d < 10 ? best.name : hex;
  }
  private key(rec: Record<string, number>, v: number, unit = "px") {
    const r = Math.round(v);
    const hit = Object.entries(rec).find(([, x]) => x === r);
    return hit ? hit[0] : `${r}${unit}`;
  }
  space = (v: number) => this.key(this.tokens.spacing, v);
  size = (v: number) => this.key(this.tokens.fontSize, v);
  radius = (v: number, h: number) => (v >= h / 2 && v > 0 ? "full" : this.key(this.tokens.radius, v));
  font = (family: string) => Object.entries(this.tokens.font).find(([, f]) => f.family === family)?.[0] ?? family;
}

function buildTrees(pages: UrlMeasurement[]): Node[] {
  const all: Node[] = [];
  for (const p of pages) {
    const nodes: Node[] = p.elements.map((e) => ({ ...e, children: [], size: 1, page: p.url }));
    for (const n of nodes) if (n.parent >= 0) nodes[n.parent].children.push(n);
    // Subtree sizes, children before parents (children always have higher indices).
    for (let i = nodes.length - 1; i >= 0; i--) nodes[i].size = 1 + nodes[i].children.reduce((a, c) => a + c.size, 0);
    all.push(...nodes);
  }
  return all;
}

const radiusBucket = (n: ElementSample) => (n.radius <= 0 ? "" : n.radius >= n.box.h / 2 ? "~pill" : "~r");

/** Structure-only signature: tag kinds, fill/border presence and corner style, children collapsed. */
function shape(n: Node, depth: number): string {
  const flags = `${n.bg ? "+bg" : ""}${n.border ? "+bd" : ""}${radiusBucket(n)}`;
  if (depth === 0 || !n.children.length) return kindOf(n) + flags;
  const kids: string[] = [];
  for (const c of n.children) {
    const s = shape(c, depth - 1);
    // Repeated siblings collapse, so a list of 3 and a list of 5 (or a row with one or two
    // trailing labels) have the same shape.
    if (kids[kids.length - 1] !== s) kids.push(s);
  }
  return `${kindOf(n)}${flags}(${kids.join(",")})`;
}

function skin(n: Node, v: Vocabulary): string {
  const textColor = (x: Node): string | null => (x.text > 0 ? v.color(x.color) : x.children.map(textColor).find(Boolean) ?? null);
  const bg = v.color(n.bg), border = v.color(n.border);
  return [bg && `bg:${bg}`, border && `border:${border}`, `text:${textColor(n) ?? "-"}`].filter(Boolean).join(" ");
}

/** Compact, token-named description of a subtree, one node per line. */
export function describe(n: Node, v: Vocabulary, maxNodes = 30): string {
  const lines: string[] = [];
  const walk = (x: Node, depth: number) => {
    if (lines.length >= maxNodes) return;
    const p = x.spacing.padding.map(Math.round);
    const pad = p.every((q) => q === 0) ? "" : p[0] === p[2] && p[1] === p[3] ? (p[0] === p[1] ? `p:${v.space(p[0])}` : `py:${v.space(p[0])} px:${v.space(p[1])}`) : `p:${p.map(v.space).join("/")}`;
    const gap = x.spacing.gap.find((g) => g > 0);
    const flex = x.layout.display.includes("flex") ? `flex${x.layout.direction === "column" ? "-col" : ""}` : x.layout.display.includes("grid") ? "grid" : "";
    const attrs = [
      x.bg && `bg:${v.color(x.bg)}`,
      x.border && `border:${v.color(x.border)}`,
      x.radius > 0 && `radius:${v.radius(x.radius, x.box.h)}`,
      x.shadow && x.shadow !== "none" && "shadow",
      pad,
      flex,
      gap && `gap:${v.space(gap)}`,
      x.text > 0 && `text:${v.color(x.color)} size:${v.size(x.fontSize)} font:${v.font(x.font)}${x.fontWeight >= 600 ? " semibold" : x.fontWeight >= 500 ? " medium" : ""}`,
      depth === 0 && `${x.box.w}×${x.box.h}px`,
    ].filter(Boolean);
    lines.push(`${"  ".repeat(depth)}${x.tag}${x.sample ? ` "${x.sample}"` : ""} [${attrs.join(" ")}]`);
    for (const c of x.children) walk(c, depth + 1);
  };
  walk(n, 0);
  if (n.size > maxNodes) lines.push(`${"  ".repeat(1)}… ${n.size - maxNodes} more nodes`);
  return lines.join("\n");
}

export function findCandidates(pages: UrlMeasurement[], tokens: Tokens, opts: { max?: number } = {}): Omit<Candidate, "crops">[] {
  const v = new Vocabulary(tokens);
  const nodes = buildTrees(pages);
  const viewportW = pages[0]?.viewport.width ?? 1280;
  const pageBg = (n: Node) => v.color(n.bg);

  const isUnit = (n: Node) => {
    if (n.size > 80 || n.box.w > viewportW * 0.9 || n.box.h > 700 || n.box.h < 12) return false;
    if (["tr", "td", "th", "thead", "tbody", "html", "body", "span"].includes(n.tag) && !(n.tag === "span" && (n.border || n.bg))) return false;
    // Decorative fills (chart bars, swatches): no text inside, no children, no border.
    if (!n.children.length && n.text === 0 && !n.border && !["button", "input", "textarea", "select"].includes(n.tag)) return false;
    const parent = n.parent >= 0 ? nodes.find((p) => p.page === n.page && p.idx === n.parent) : undefined;
    const ownFill = n.bg && (!parent || pageBg(parent) !== pageBg(n));
    return Boolean(ownFill || n.border || ["button", "input", "textarea", "select", "table", "nav"].includes(n.tag) || (n.radius > 0 && n.bg));
  };

  const groups = new Map<string, Node[]>();
  for (const n of nodes) {
    if (!isUnit(n)) continue;
    const s = shape(n, 3);
    groups.set(s, [...(groups.get(s) ?? []), n]);
  }

  // Containers (cards, panels) hold different content each time, so they never share a full shape.
  // Group the leftovers by their own shell instead: kind, fill, border and corner style.
  const grouped = new Set([...groups.values()].filter((ns) => ns.length >= 2).flat());
  const shells = new Map<string, Node[]>();
  for (const n of nodes) {
    if (grouped.has(n) || !isUnit(n) || n.size < 4 || !(n.bg || n.border)) continue;
    const key = `shell:${kindOf(n)}${n.bg ? `+bg:${v.color(n.bg)}` : ""}${n.border ? `+bd:${v.color(n.border)}` : ""}${radiusBucket(n)}`;
    shells.set(key, [...(shells.get(key) ?? []), n]);
  }
  for (const [key, ns] of shells) {
    if (ns.length < 2) continue;
    for (const n of ns) for (const [s, members] of groups) if (members.length === 1 && members[0] === n) groups.delete(s);
    groups.set(key, ns);
  }

  const singletonOk = new Set(["table", "nav", "input", "button", "form"]);
  let candidates = [...groups.entries()]
    .filter(([, ns]) => ns.length >= 2 || singletonOk.has(kindOf(ns[0])))
    .map(([s, ns], i) => {
      const skins = [...new Set(ns.map((n) => skin(n, v)))];
      // One example per skin first, so variants are visible to the model.
      const ordered = [...skins.map((k) => ns.find((n) => skin(n, v) === k)!), ...ns.filter((n, j) => !skins.some((k) => ns.find((m) => skin(m, v) === k) === n) && j < 6)];
      return {
        id: `c${i}`,
        kind: kindOf(ns[0]),
        shape: s,
        instances: ordered.slice(0, 4).map((n) => ({ page: n.page, idx: n.idx, box: n.box, skin: skin(n, v), description: describe(n, v) })),
        allInstances: ns,
        skins,
        subtreeSize: Math.round(ns.reduce((a, n) => a + n.size, 0) / ns.length),
      };
    });

  // Drop wrappers: a group whose every instance is just a box around an instance of another group.
  const memberOf = new Map<Node, string>();
  for (const c of candidates) for (const n of c.allInstances) memberOf.set(n, c.id);
  candidates = candidates.filter((c) =>
    !c.allInstances.every((n) => n.children.length === 1 && memberOf.has(n.children[0]) && n.children[0].box.w * n.children[0].box.h >= 0.85 * n.box.w * n.box.h));

  // Controls of the same kind are one component with variants (primary, secondary, ghost…).
  for (const kind of ["button", "input", "link"]) {
    const same = candidates.filter((c) => c.kind === kind);
    if (same.length < 2) continue;
    const [first, ...rest] = same.sort((a, b) => b.allInstances.length - a.allInstances.length);
    for (const r of rest) {
      first.skins.push(...r.skins.filter((k) => !first.skins.includes(k)));
      first.instances.push(...r.instances.slice(0, 2));
      first.allInstances.push(...r.allInstances);
    }
    candidates = candidates.filter((c) => !rest.includes(c));
  }

  return candidates
    .sort((a, b) => b.allInstances.length * Math.log2(b.subtreeSize + 1) - a.allInstances.length * Math.log2(a.subtreeSize + 1))
    .slice(0, opts.max ?? 14)
    .map(({ allInstances, ...c }) => c);
}

/** Crop boxes out of a full-page screenshot (browser canvas, no image libraries). */
export async function cropBoxes(png: Buffer, boxes: ElementSample["box"][], pad = 6): Promise<Buffer[]> {
  if (!boxes.length) return [];
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const urls = await page.evaluate(
      async ({ data, boxes, pad }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${data}`;
        await img.decode();
        return boxes.map((b) => {
          const x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad);
          const w = Math.min(img.naturalWidth - x, b.w + pad * 2), h = Math.min(img.naturalHeight - y, b.h + pad * 2);
          const c = document.createElement("canvas");
          c.width = Math.max(1, w);
          c.height = Math.max(1, h);
          c.getContext("2d")!.drawImage(img, x, y, w, h, 0, 0, w, h);
          return c.toDataURL("image/png").split(",")[1];
        });
      },
      { data: png.toString("base64"), boxes, pad },
    );
    return urls.map((u) => Buffer.from(u, "base64"));
  } finally {
    await page.close();
  }
}
