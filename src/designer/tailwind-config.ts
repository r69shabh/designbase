// Tailwind v3 themes live in tailwind.config.{js,ts,cjs,mjs}. Configs are code, but almost always
// plain object literals, so we evaluate them statically (Babel AST) instead of running them.
// Anything we can't evaluate (plugins, theme() callbacks, Tailwind's own palette) is reported, not guessed.
import { parse } from "@babel/parser";
import { readFileSync } from "node:fs";
import { relative } from "node:path";

type N = { type: string; [k: string]: any };
export type Value = string | number | boolean | null | Value[] | { [k: string]: Value };
const UNKNOWN = Symbol("unknown");
type Ev = Value | typeof UNKNOWN;

export interface TailwindTheme {
  file: string;
  /** Flattened names as Tailwind writes them in classes: primary, primary-foreground, brand-500. */
  colors: Record<string, string>;
  spacing: Record<string, string>;
  fontSize: Record<string, string>;
  borderRadius: Record<string, string>;
  fontFamily: Record<string, string[]>;
  boxShadow: Record<string, string>;
  /** True when theme.<key> (not extend) replaces Tailwind's default scale. */
  replaces: Record<string, boolean>;
  unresolved: string[];
}

const SECTIONS = ["colors", "spacing", "fontSize", "borderRadius", "fontFamily", "boxShadow"] as const;

export function readTailwindConfig(file: string, root: string): TailwindTheme | null {
  const code = readFileSync(file, "utf8");
  let ast: N;
  try {
    ast = parse(code, { sourceType: "unambiguous", plugins: ["typescript"], errorRecovery: true }) as unknown as N;
  } catch {
    return null;
  }
  const consts = new Map<string, N>();
  let exported: N | null = null;
  const unresolved = new Set<string>();
  const text = (n: N) => code.slice(n.start, n.end);
  const strip = (n: N): N => (/^TS(AsExpression|SatisfiesExpression|NonNullExpression)$|^TSTypeAssertion$|^ParenthesizedExpression$/.test(n.type) ? strip(n.expression) : n);

  for (const stmt of ast.program.body as N[]) {
    const decl = stmt.type === "ExportNamedDeclaration" ? stmt.declaration : stmt;
    if (decl?.type === "VariableDeclaration") for (const d of decl.declarations) if (d.id?.type === "Identifier" && d.init) consts.set(d.id.name, d.init);
    if (stmt.type === "ExportDefaultDeclaration") exported = stmt.declaration;
    // module.exports = {…}
    const e = stmt.type === "ExpressionStatement" ? stmt.expression : null;
    if (e?.type === "AssignmentExpression" && text(e.left) === "module.exports") exported = e.right;
  }
  if (!exported) return null;

  const evaluate = (n0: N | null | undefined, depth = 0): Ev => {
    if (!n0 || depth > 20) return UNKNOWN;
    const n = strip(n0);
    switch (n.type) {
      case "StringLiteral": return n.value;
      case "NumericLiteral": return n.value;
      case "BooleanLiteral": return n.value;
      case "NullLiteral": return null;
      case "TemplateLiteral": {
        let s = n.quasis[0].value.cooked;
        for (let i = 0; i < n.expressions.length; i++) {
          const v = evaluate(n.expressions[i], depth + 1);
          if (v === UNKNOWN || typeof v === "object") return UNKNOWN;
          s += String(v) + n.quasis[i + 1].value.cooked;
        }
        return s;
      }
      case "Identifier": return consts.has(n.name) ? evaluate(consts.get(n.name), depth + 1) : UNKNOWN;
      case "ArrayExpression": {
        const out: Value[] = [];
        for (const el of n.elements) {
          if (el?.type === "SpreadElement") {
            const v = evaluate(el.argument, depth + 1);
            if (Array.isArray(v)) out.push(...v);
            else unresolved.add(`...${text(el.argument)}`);
          } else {
            const v = evaluate(el, depth + 1);
            if (v === UNKNOWN) unresolved.add(text(el));
            else out.push(v);
          }
        }
        return out;
      }
      case "ObjectExpression": {
        const out: Record<string, Value> = {};
        for (const p of n.properties) {
          if (p.type === "SpreadElement") {
            const v = evaluate(p.argument, depth + 1);
            if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, v);
            else unresolved.add(`...${text(p.argument)}`);
            continue;
          }
          if (p.type !== "ObjectProperty" || p.computed) continue;
          const key = p.key.name ?? String(p.key.value);
          const v = evaluate(p.value, depth + 1);
          if (v === UNKNOWN) unresolved.add(`${key}: ${text(p.value).slice(0, 60)}`);
          else out[key] = v;
        }
        return out;
      }
      case "MemberExpression": {
        const obj = evaluate(n.object, depth + 1);
        const key = n.computed ? evaluate(n.property, depth + 1) : n.property.name;
        if (obj && typeof obj === "object" && !Array.isArray(obj) && (typeof key === "string" || typeof key === "number")) return obj[key] ?? UNKNOWN;
        return UNKNOWN;
      }
      default: return UNKNOWN;
    }
  };

  const config = evaluate(exported);
  if (!config || typeof config !== "object" || Array.isArray(config)) return null;
  const theme = (config.theme ?? {}) as Record<string, Value>;
  const extend = (theme.extend ?? {}) as Record<string, Value>;

  const out: TailwindTheme = { file: relative(root, file), colors: {}, spacing: {}, fontSize: {}, borderRadius: {}, fontFamily: {}, boxShadow: {}, replaces: {}, unresolved: [] };
  const flatColors = (v: Value, prefix: string) => {
    if (typeof v === "string") out.colors[prefix] = v;
    else if (v && typeof v === "object" && !Array.isArray(v)) for (const [k, x] of Object.entries(v)) flatColors(x, k === "DEFAULT" ? prefix : prefix ? `${prefix}-${k}` : k);
  };
  for (const section of SECTIONS) {
    const merged: Record<string, Value> = {};
    for (const src of [theme[section], extend[section]]) if (src && typeof src === "object" && !Array.isArray(src)) Object.assign(merged, src);
    out.replaces[section] = !!theme[section] && typeof theme[section] === "object";
    if (section === "colors") flatColors(merged, "");
    for (const [k, v] of Object.entries(merged)) {
      if (section === "fontFamily") {
        const fams = (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []).filter((x): x is string => typeof x === "string").map((x) => x.trim());
        if (fams.length) out.fontFamily[k] = fams;
      } else if (section === "fontSize") {
        const size = Array.isArray(v) ? v[0] : v; // ["3rem", { lineHeight }]
        if (typeof size === "string") out.fontSize[k] = size;
      } else if (section !== "colors" && (typeof v === "string" || typeof v === "number")) (out[section] as Record<string, string>)[k] = String(v);
    }
  }
  out.unresolved = [...unresolved];
  return out;
}
