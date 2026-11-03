import type { Playbook } from "./playbook.ts";
import { rule } from "./playbook.ts";

export interface Violation {
  rule: string;
  severity: "error" | "warn";
  message: string;
  fix: string;
  line?: number;
  excerpt?: string;
  count?: number;
  examples?: string[];
}

const TW_PALETTE = /^(slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d{2,3})?$/;
const COLOR_PREFIX = /^(bg|text|border(?:-[xytrblse])?|ring|ring-offset|fill|stroke|from|via|to|divide|outline|decoration|placeholder|accent|caret|shadow)-(.+)$/;
const SPACING = /^-?(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)-(.+)$/;
const GENERIC_FONTS = /\b(Inter|Roboto|Arial|Helvetica|Open Sans|Poppins|Montserrat|system-ui|-apple-system|Segoe UI)\b/;
const RAW_ELEMENTS: Record<string, string> = { button: "Button", input: "Field", table: "DataTable" };

const lineOf = (src: string, index: number) => src.slice(0, index).split("\n").length;
const lineText = (src: string, line: number) => src.split("\n")[line - 1]?.trim().slice(0, 140) ?? "";

/** String literals (and static template-literal chunks) with their offsets: where Tailwind classes live. */
function* strings(src: string): Generator<{ value: string; index: number }> {
  const re = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g;
  for (let m; (m = re.exec(src)); ) {
    const value = m[1] ?? m[2] ?? (m[3] ?? "").replace(/\$\{[^}]*\}/g, " ");
    yield { value, index: m.index };
  }
}

/** Strip variant prefixes (md:, hover:, dark:) and the important marker. */
const baseClass = (cls: string) => cls.split(":").pop()!.replace(/^!/, "").replace(/!$/, "");

export interface LintOptions {
  /** Files inside the playbook's component folder may use raw elements. */
  isComponentSource?: boolean;
}

export function lintSource(pb: Playbook, src: string, opts: LintOptions = {}): Violation[] {
  const out: Violation[] = [];
  const t = pb.tokens;
  const palette = new Set([...Object.keys(t.color), "transparent", "current", "inherit"]);
  const spacingKeys = new Set([...Object.keys(t.spacing), "auto"]);
  const sizeKeys = new Set(Object.keys(t.fontSize));
  const radiusKeys = new Set(Object.keys(t.radius));
  const fontKeys = new Set(Object.keys(t.font));
  const allowShadows = Object.keys(t.shadow).length > 0;

  const add = (id: string, index: number, message: string) => {
    const r = rule(pb, id);
    const line = lineOf(src, index);
    out.push({ rule: id, severity: r.severity, message, fix: r.fix, line, excerpt: lineText(src, line) });
  };

  for (const { value, index } of strings(src)) {
    if (/^\s*(\.|@|https?:|\/)/.test(value) || value.includes("/>")) continue; // import paths, urls
    for (const raw of value.split(/\s+/).filter(Boolean)) {
      const cls = baseClass(raw);
      if (!/^-?[a-z]/.test(cls)) continue;

      if (/\[.+\]/.test(cls) && /^-?[a-z-]+-\[/.test(cls)) {
        add("no-arbitrary-values", index, `Arbitrary value \`${raw}\``);
        continue;
      }
      if (/^(bg-gradient|bg-linear|bg-radial|bg-conic)/.test(cls)) {
        add("no-gradients", index, `Gradient \`${raw}\``);
        continue;
      }
      if (/^(shadow|drop-shadow)(-|$)/.test(cls) && !/^shadow-none$/.test(cls) && !allowShadows) {
        if (/^shadow-(inner|xs|sm|md|lg|xl|2xl)$|^shadow$|^drop-shadow/.test(cls)) {
          add("no-shadows", index, `Shadow \`${raw}\``);
          continue;
        }
      }
      if (/^rounded(-[trblse]{1,2})?(-[a-z0-9]+)?$/.test(cls)) {
        const size = cls.match(/^rounded(?:-[trblse]{1,2})?(?:-([a-z0-9]+))?$/)?.[1];
        const sizeName = size && /^[trblse]{1,2}$/.test(size) ? undefined : size;
        if (!sizeName || !radiusKeys.has(sizeName)) add("radius-scale", index, `Radius \`${raw}\` is off-scale`);
        continue;
      }
      const sp = cls.match(SPACING);
      if (sp) {
        if (!spacingKeys.has(sp[2])) {
          const px = sp[2] === "px" ? 1 : Number(sp[2]) * 4;
          const steps = Object.entries(t.spacing).sort((a, b) => a[1] - b[1]);
          const below = steps.filter(([, v]) => v < px).pop();
          const above = steps.find(([, v]) => v > px);
          const prefix = cls.replace(/-[^-]+$/, "");
          const options = [below, above].filter(Boolean).map(([k, v]) => `${prefix}-${k} (${v}px)`).join(" or ");
          add("spacing-scale", index, `Spacing \`${raw}\` (${px}px) is off-scale → ${options}`);
        }
        continue;
      }
      if (/^text-(xs|sm|base|lg|xl|[2-9]xl)$/.test(cls)) {
        if (!sizeKeys.has(cls.slice(5))) add("type-scale", index, `Font size \`${raw}\` is outside the type scale`);
        continue;
      }
      if (/^font-(sans|serif)$/.test(cls)) {
        add("font-families", index, `\`${raw}\` uses a generic family`);
        continue;
      }
      if (/^font-[a-z]+$/.test(cls) && !/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(cls)) {
        if (!fontKeys.has(cls.slice(5))) add("font-families", index, `Unknown font family \`${raw}\``);
        continue;
      }
      const c = cls.match(COLOR_PREFIX);
      if (c) {
        const name = c[2].split("/")[0];
        if (palette.has(name)) continue;
        if (TW_PALETTE.test(name) || name === "white" || name === "black") {
          add("no-raw-colors", index, `\`${raw}\` uses Tailwind's default palette, not a playbook colour`);
        }
      }
    }
  }

  // Raw colour literals anywhere (styles, theme objects, SVG fills).
  for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(/g)) {
    const before = src.slice(Math.max(0, m.index - 12), m.index);
    if (/href=["'`]?$|id=["'`]?$/.test(before)) continue;
    add("no-raw-colors", m.index, `Raw colour \`${m[0]}\``);
  }

  for (const m of src.matchAll(/style=\{\{([^}]*)\}\}/g)) {
    if (/\d+(px|rem|em)?|#|rgb|color|font|margin|padding|gap|radius|shadow/.test(m[1])) {
      add("no-inline-styles", m.index, "Inline style with hard-coded values");
    }
  }

  for (const m of src.matchAll(/fontFamily|font-family/g)) {
    const window = src.slice(m.index, m.index + 120);
    if (GENERIC_FONTS.test(window)) add("font-families", m.index, `Generic font: ${window.match(GENERIC_FONTS)![0]}`);
  }

  if (!opts.isComponentSource) {
    for (const [el, comp] of Object.entries(RAW_ELEMENTS)) {
      for (const m of src.matchAll(new RegExp(`<${el}\\b`, "g"))) add("use-components", m.index, `Raw <${el}> — use <${comp}>`);
    }
  }

  const primaries = [...src.matchAll(/variant=(["'{`])\s*["']?primary/g)];
  if (primaries.length > 1) add("one-primary-action", primaries[1].index, `${primaries.length} primary buttons in one view`);

  const headings = [...src.matchAll(/<h([1-6])\b/g)].map((m) => ({ level: Number(m[1]), index: m.index }));
  // PageHeader renders the page's h1.
  const hasPageHeader = /<PageHeader\b/.test(src);
  let prev = hasPageHeader ? 1 : 0;
  let h1s = hasPageHeader ? 1 : 0;
  for (const h of headings) {
    if (h.level === 1) h1s++;
    if (h1s > 1 && h.level === 1) add("heading-order", h.index, "More than one h1");
    else if (prev && h.level > prev + 1) add("heading-order", h.index, `h${h.level} after h${prev} skips a level`);
    prev = h.level;
  }

  for (const m of src.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) add("img-alt", m.index, "<img> without alt");

  return out.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
}

export function scoreViolations(vs: Violation[]): number {
  const errors = vs.filter((v) => v.severity === "error").reduce((n, v) => n + (v.count ?? 1), 0);
  const warns = vs.filter((v) => v.severity === "warn").reduce((n, v) => n + (v.count ?? 1), 0);
  return Math.max(0, 100 - errors * 8 - warns * 3);
}

export function formatViolations(vs: Violation[], file?: string): string {
  if (!vs.length) return `✓ ${file ?? "source"}: no playbook violations.`;
  const errors = vs.filter((v) => v.severity === "error").length;
  const lines = [`✗ ${file ?? "source"}: ${errors} error(s), ${vs.length - errors} warning(s). Score ${scoreViolations(vs)}/100.`];
  for (const v of vs) {
    const where = v.line ? `L${v.line} ` : "";
    lines.push(`  ${v.severity === "error" ? "error" : "warn "} ${where}[${v.rule}] ${v.message}${v.count && v.count > 1 ? ` ×${v.count}` : ""}`);
    if (v.excerpt) lines.push(`        ${v.excerpt}`);
    if (v.examples?.length) lines.push(`        e.g. ${v.examples.join(", ")}`);
    lines.push(`        fix: ${v.fix}`);
  }
  return lines.join("\n");
}
