// Scan a codebase for the components a team already has, so designbase uses them instead of
// generating new ones. Static analysis only (Babel AST); nothing in the repo is executed.
import { parse } from "@babel/parser";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { cleanReplaces } from "./components.ts";
import { readStoryFile, type Story } from "./stories.ts";
import { readTailwindConfig, type TailwindTheme } from "./tailwind-config.ts";

export interface RepoPropSpec { name: string; type: string; required: boolean; description: string }
export interface RepoComponent {
  name: string;
  file: string;
  importPath: string;
  exportName: string; // "default" or the named export
  summary: string;
  propSpecs: RepoPropSpec[];
  variants: Record<string, string[]>;
  defaultVariants: Record<string, string>;
  replaces: string[];
  renders: string | null;
  parts: string[];
  classes: string[];
  code: string;
  usedBy: number;
  /** Storybook stories for it: the team's approved states. */
  stories: Story[];
  storyTitle: string | null;
}

const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", "coverage", ".turbo", ".vercel", "storybook-static", ".designbase"]);
const ELEMENT_OF_TYPE: Record<string, string> = {
  HTMLButtonElement: "button", HTMLInputElement: "input", HTMLTableElement: "table", HTMLSelectElement: "select", HTMLTextAreaElement: "textarea",
  ButtonHTMLAttributes: "button", InputHTMLAttributes: "input", TableHTMLAttributes: "table", SelectHTMLAttributes: "select", TextareaHTMLAttributes: "textarea",
};

export function walk(root: string, accept: (f: string) => boolean, out: string[] = [], dir = root): string[] {
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name) || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(root, accept, out, p);
    else if (accept(p)) out.push(p);
  }
  return out;
}

type N = { type: string; [k: string]: any };
const isPascal = (s: string) => /^[A-Z][A-Za-z0-9]*$/.test(s);

function children(node: N): N[] {
  const out: N[] = [];
  for (const [k, v] of Object.entries(node)) {
    if (k === "loc" || k === "leadingComments" || k === "trailingComments" || k === "extra") continue;
    if (Array.isArray(v)) for (const x of v) x && typeof x.type === "string" && out.push(x);
    else if (v && typeof (v as N).type === "string") out.push(v as N);
  }
  return out;
}
function find(node: N, pred: (n: N) => boolean): N | null {
  if (pred(node)) return node;
  for (const c of children(node)) {
    const r = find(c, pred);
    if (r) return r;
  }
  return null;
}
function each(node: N, fn: (n: N) => void) {
  fn(node);
  for (const c of children(node)) each(c, fn);
}

/** tsconfig allows comments and trailing commas; strip them without touching strings ("https://…"). */
export function stripJsonc(src: string): string {
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"') {
      const start = i;
      for (i++; i < src.length && src[i] !== '"'; i++) if (src[i] === "\\") i++;
      out += src.slice(start, i + 1);
    } else if (ch === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      out += "\n";
    } else if (ch === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i + 2) + 1;
      if (i === 0) break;
    } else out += ch;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}

/** tsconfig "paths" → the import specifier the team would write for a file, and back. */
function importResolver(root: string): { toImport: (file: string) => string; toFile: (spec: string, from: string) => string | null } {
  let paths: Record<string, string[]> = {};
  for (const f of ["tsconfig.json", "jsconfig.json"]) {
    if (!existsSync(join(root, f))) continue;
    try {
      const json = JSON.parse(stripJsonc(readFileSync(join(root, f), "utf8")));
      paths = json.compilerOptions?.paths ?? {};
      break;
    } catch {}
  }
  const aliases = Object.entries(paths)
    .filter(([k, v]) => k.endsWith("/*") && v[0]?.endsWith("/*"))
    .map(([k, v]) => ({ alias: k.slice(0, -1), target: join(root, v[0].slice(0, -1)) }));
  return {
    toImport: (file) => {
      const noExt = file.replace(/\.(tsx|jsx|ts|js)$/, "").replace(/\/index$/, "");
      for (const a of aliases) if (noExt.startsWith(a.target)) return a.alias + relative(a.target, noExt);
      return "./" + relative(root, noExt);
    },
    // Extension-less absolute path, comparable with a component file minus its extension.
    toFile: (spec, from) => {
      if (spec.startsWith(".")) return join(dirname(from), spec).replace(/\/index$/, "");
      const a = aliases.find((a) => spec.startsWith(a.alias));
      return a ? join(a.target, spec.slice(a.alias.length)).replace(/\/index$/, "") : null;
    },
  };
}

/** next/font fills a CSS variable at runtime: const inter = Inter({ variable: "--font-inter" }). */
function nextFontVars(sources: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const src of sources) {
    const imp = src.match(/import\s*\{([^}]+)\}\s*from\s*["']next\/font\/google["']/);
    if (!imp) continue;
    for (const fam of imp[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()!).filter(Boolean)) {
      const call = src.match(new RegExp(`\\b${fam}\\(\\s*\\{[\\s\\S]*?variable:\\s*["'](--[\\w-]+)["']`));
      const original = imp[1].split(",").map((s) => s.trim()).find((s) => s === fam || s.endsWith(` as ${fam}`))!.split(/\s+as\s+/)[0];
      if (call) out[call[1]] = original.replace(/_/g, " ");
    }
  }
  return out;
}

interface Decl { name: string; node: N; init: N | null; leading: string }

function analyseFile(file: string, root: string, toImport: (f: string) => string): RepoComponent[] {
  const code = readFileSync(file, "utf8");
  let ast: N;
  try {
    ast = parse(code, { sourceType: "module", plugins: ["typescript", "jsx"], errorRecovery: true }) as unknown as N;
  } catch {
    return [];
  }
  const text = (n: N | null | undefined) => (n ? code.slice(n.start, n.end) : "");
  const jsdoc = (n: N) => (n.leadingComments ?? []).filter((c: N) => c.type === "CommentBlock" && c.value.startsWith("*")).map((c: N) => c.value.replace(/^\*|\n\s*\*\s?/g, " ").trim()).pop() ?? "";

  // Top-level declarations, types and cva() variant tables.
  const decls = new Map<string, Decl>();
  const types = new Map<string, N>();
  const cvas = new Map<string, { base: string; variants: Record<string, Record<string, string>>; defaults: Record<string, string> }>();
  const exported = new Map<string, string>(); // local name → export name
  const body: N[] = ast.program.body;
  for (const stmt0 of body) {
    let stmt = stmt0;
    const lead = jsdoc(stmt0);
    if (stmt.type === "ExportNamedDeclaration" && stmt.declaration) {
      stmt = stmt.declaration;
      for (const d of stmt.declarations ?? [stmt]) if (d.id?.name) exported.set(d.id.name, d.id.name);
    } else if (stmt.type === "ExportNamedDeclaration") {
      for (const s of stmt.specifiers ?? []) exported.set(s.local.name, s.exported.name);
      continue;
    } else if (stmt.type === "ExportDefaultDeclaration") {
      const d = stmt.declaration;
      if (d.type === "Identifier") exported.set(d.name, "default");
      else if (d.id?.name) {
        exported.set(d.id.name, "default");
        decls.set(d.id.name, { name: d.id.name, node: d, init: d, leading: lead });
      }
      continue;
    }
    if (stmt.type === "FunctionDeclaration" && stmt.id) decls.set(stmt.id.name, { name: stmt.id.name, node: stmt, init: stmt, leading: lead });
    if (stmt.type === "TSInterfaceDeclaration" || stmt.type === "TSTypeAliasDeclaration") types.set(stmt.id.name, stmt);
    if (stmt.type === "VariableDeclaration") {
      for (const d of stmt.declarations) {
        if (d.id?.type !== "Identifier") continue;
        decls.set(d.id.name, { name: d.id.name, node: d, init: d.init, leading: lead });
        // cva(base, { variants }) and tailwind-variants' tv({ base, variants }), whose classes may be string arrays.
        const variantFn = d.init?.type === "CallExpression" ? text(d.init.callee).match(/(^|\.)(cva|tv)$/)?.[2] : undefined;
        if (variantFn) {
          const strOf = (n: N): string => (n?.type === "StringLiteral" ? n.value : n?.type === "TemplateLiteral" ? n.quasis.map((q: N) => q.value.cooked).join(" ") : n?.type === "ArrayExpression" ? n.elements.map(strOf).join(" ") : "");
          const keyOf = (p: N) => p.key?.name ?? p.key?.value;
          const cfg = variantFn === "tv" ? d.init.arguments[0] : d.init.arguments[1];
          const base = variantFn === "tv" ? cfg?.properties?.find((p: N) => keyOf(p) === "base")?.value : d.init.arguments[0];
          const variants: Record<string, Record<string, string>> = {};
          const defaults: Record<string, string> = {};
          for (const p of cfg?.properties ?? []) {
            if (keyOf(p) === "variants") for (const group of p.value.properties ?? []) variants[keyOf(group)] = Object.fromEntries((group.value.properties ?? []).map((o: N) => [String(keyOf(o)), strOf(o.value)]));
            if (keyOf(p) === "defaultVariants") for (const o of p.value.properties ?? []) defaults[keyOf(o)] = strOf(o.value) || text(o.value);
          }
          cvas.set(d.id.name, { base: strOf(base), variants, defaults });
        }
      }
    }
  }

  const unwrap = (n: N | null): { fn: N | null; typeArgs: N[] } => {
    // forwardRef<El, Props>((props, ref) => …), memo(…), React.forwardRef(…)
    if (n?.type === "CallExpression" && /(^|\.)(forwardRef|memo)$/.test(text(n.callee))) {
      const inner = unwrap(n.arguments[0]);
      return { fn: inner.fn, typeArgs: [...(n.typeParameters?.params ?? n.typeArguments?.params ?? []), ...inner.typeArgs] };
    }
    if (n && /Function|ArrowFunction/.test(n.type)) return { fn: n, typeArgs: [] };
    return { fn: null, typeArgs: [] };
  };
  const returnsJsx = (fn: N) => !!find(fn.body ?? fn, (x) => x.type === "JSXElement" || x.type === "JSXFragment");

  const components: RepoComponent[] = [];
  for (const [local, exportName] of exported) {
    const d = decls.get(local);
    if (!d || !isPascal(local)) continue;
    // Re-exported primitives (const Accordion = AccordionPrimitive.Root) are components too, with no props of their own.
    if (d.init?.type === "MemberExpression" && /^[A-Z]/.test(text(d.init))) {
      components.push({ name: exportName === "default" ? local : exportName, file: relative(root, file), importPath: toImport(file), exportName, summary: d.leading, propSpecs: [], variants: {}, defaultVariants: {}, replaces: [], renders: text(d.init), parts: [], classes: [], code, usedBy: 0, stories: [], storyTitle: null });
      continue;
    }
    const { fn, typeArgs } = unwrap(d.init);
    if (!fn || !returnsJsx(fn)) continue;

    // Props: the first parameter's type, forwardRef's second type argument, or the destructured names.
    const param: N | undefined = fn.params[0];
    const propsTypeNode: N | undefined = param?.typeAnnotation?.typeAnnotation ?? typeArgs[1];
    const propSpecs: RepoPropSpec[] = [];
    const replaces = new Set<string>();
    const variantRefs: string[] = [];
    const readType = (t: N | undefined, depth = 0): void => {
      if (!t || depth > 4) return;
      const src = text(t);
      for (const [k, el] of Object.entries(ELEMENT_OF_TYPE)) if (src.includes(k)) replaces.add(el);
      const cp = src.match(/ComponentProps(?:WithoutRef|WithRef)?<\s*["'](\w+)["']\s*>/);
      if (cp) replaces.add(cp[1]);
      for (const m of src.matchAll(/VariantProps<\s*typeof\s+(\w+)\s*>/g)) variantRefs.push(m[1]);
      if (t.type === "TSTypeLiteral") for (const m of t.members) addMember(m);
      if (t.type === "TSIntersectionType") for (const x of t.types) readType(x, depth + 1);
      if (t.type === "TSTypeReference") {
        const ref = types.get(text(t.typeName));
        if (ref?.type === "TSInterfaceDeclaration") {
          for (const m of ref.body.body) addMember(m);
          for (const h of ref.extends ?? []) readType(h, depth + 1);
        } else if (ref?.type === "TSTypeAliasDeclaration") readType(ref.typeAnnotation, depth + 1);
      }
      if (t.type === "TSExpressionWithTypeArguments" || t.type === "TSInterfaceHeritage") readType({ ...t, type: "_heritage" } as N, depth + 1);
    };
    const addMember = (m: N) => {
      if (m.type !== "TSPropertySignature" || !m.key) return;
      const name = m.key.name ?? m.key.value;
      if (propSpecs.some((p) => p.name === name)) return;
      propSpecs.push({ name, type: text(m.typeAnnotation?.typeAnnotation) || "unknown", required: !m.optional, description: jsdoc(m) });
    };
    readType(propsTypeNode);
    for (const t of typeArgs.slice(0, 1)) readType(t);
    // Destructured names are a fallback only when there's no props type to read.
    if (!propSpecs.length && !propsTypeNode && param?.type === "ObjectPattern") {
      for (const p of param.properties) if (p.key?.name && !["className", "children", "ref"].includes(p.key.name)) propSpecs.push({ name: p.key.name, type: "unknown", required: false, description: "" });
    }

    // What it renders: the root JSX element (resolving `const Comp = asChild ? Slot : "button"`).
    const rootEl = find(fn.body ?? fn, (x) => x.type === "JSXElement");
    let renders: string | null = null;
    const tag = rootEl ? text(rootEl.openingElement.name) : "";
    if (/^[a-z]/.test(tag)) renders = tag;
    // Built on a primitive library (Radix, Headless UI…): record it, e.g. "CheckboxPrimitive.Root".
    else if (tag.includes(".")) renders = tag;
    else if (tag) {
      const alias = find(fn.body ?? fn, (x) => x.type === "VariableDeclarator" && x.id?.name === tag);
      const lit = alias && find(alias.init, (x) => x.type === "StringLiteral");
      if (lit) renders = lit.value;
    }
    if (renders && /^[a-z]+$/.test(renders)) replaces.add(renders);
    // A wrapper (div > table) still stands in for the inner control if forwardRef says so.

    // Variants from cva tables referenced by VariantProps<typeof x> or called in the body.
    each(fn, (x) => {
      if (x.type === "CallExpression" && cvas.has(text(x.callee))) variantRefs.push(text(x.callee));
    });
    const variants: Record<string, string[]> = {};
    const defaultVariants: Record<string, string> = {};
    const classes: string[] = [];
    for (const ref of new Set(variantRefs)) {
      const c = cvas.get(ref);
      if (!c) continue;
      classes.push(...c.base.split(/\s+/));
      for (const [k, opts] of Object.entries(c.variants)) {
        variants[k] = Object.keys(opts);
        for (const cls of Object.values(opts)) classes.push(...cls.split(/\s+/));
        const known = propSpecs.findIndex((p) => p.name === k);
        if (known >= 0 && propSpecs[known].type === "unknown") propSpecs.splice(known, 1);
        if (!propSpecs.some((p) => p.name === k)) propSpecs.push({ name: k, type: Object.keys(opts).map((o) => `"${o}"`).join(" | "), required: false, description: c.defaults[k] ? `default "${c.defaults[k]}"` : "" });
      }
      Object.assign(defaultVariants, c.defaults);
    }
    each(fn, (x) => {
      if (x.type === "StringLiteral" || x.type === "JSXText") classes.push(...String(x.value).split(/\s+/));
      if (x.type === "TemplateElement") classes.push(...String(x.value.cooked).split(/\s+/));
    });

    components.push({
      name: exportName === "default" ? local : exportName,
      file: relative(root, file),
      importPath: toImport(file),
      exportName,
      summary: d.leading || jsdoc(d.node) || "",
      propSpecs,
      variants,
      defaultVariants,
      replaces: cleanReplaces([...replaces]),
      renders,
      parts: [],
      classes: classes.filter((c) => /^[a-z!-][\w:/.[\]%-]*$/.test(c)),
      code,
      usedBy: 0,
      stories: [],
      storyTitle: null,
    });
  }

  // Multi-part components (Card, CardHeader, CardTitle…): the part named after the file leads.
  if (components.length > 1) {
    const stem = basename(file, extname(file)).replace(/[-_](\w)/g, (_, c) => c.toUpperCase()).toLowerCase();
    const lead = components.find((c) => c.name.toLowerCase() === stem) ?? components.find((c) => components.every((o) => o === c || o.name.startsWith(c.name)));
    if (lead) {
      lead.parts = components.filter((c) => c !== lead).map((c) => c.name);
      return [lead];
    }
  }
  return components;
}

const isRoute = (rel: string) => /(^|\/)(app|pages)\/(.*\/)?(page|layout|loading|error|not-found|template|route)\.(tsx|jsx)$/.test(rel) || /(^|\/)pages\//.test(rel);

export interface RepoScan {
  components: RepoComponent[];
  cssFiles: string[];
  files: number;
  /** Tailwind v3 configs, statically evaluated. */
  tailwind: TailwindTheme[];
  fontVars: Record<string, string>;
  storyFiles: number;
}

export function scanRepo(root: string): RepoScan {
  const { toImport, toFile } = importResolver(root);
  const files = walk(root, (f) => /\.(tsx|jsx)$/.test(f) && !/\.(test|spec|stories)\.(tsx|jsx)$/.test(f));
  const components = files.filter((f) => !isRoute(relative(root, f))).flatMap((f) => analyseFile(f, root, toImport));

  // Stories attach to the component their meta names (by resolved import, else by name).
  const storyFiles = walk(root, (f) => /\.stories\.(tsx|jsx|ts|js|mjs)$/.test(f));
  for (const sf of storyFiles) {
    const s = readStoryFile(sf);
    if (!s?.component || !s.stories.length) continue;
    const target = toFile(s.component.source, sf);
    const exportName = s.component.imported;
    const c =
      components.find((c) => target && join(root, c.file).replace(/\.(tsx|jsx)$/, "").replace(/\/index$/, "") === target && (c.exportName === exportName || c.name === exportName || c.parts.includes(exportName))) ??
      components.find((c) => c.name === (exportName === "default" ? s.component!.local : exportName));
    if (!c) continue;
    c.stories.push(...s.stories.map((x) => ({ ...x, file: relative(root, sf) })));
    c.storyTitle ??= s.title;
    if (!c.summary && s.description) c.summary = s.description;
    for (const [k, t] of Object.entries(s.argTypes)) {
      if (t.options?.length && !c.variants[k]) c.variants[k] = t.options;
      const p = c.propSpecs.find((p) => p.name === k);
      if (p && !p.description && t.description) p.description = t.description;
    }
  }

  // How often each component is imported across the repo: well-used components are the real system.
  const sources = files.map((f) => readFileSync(f, "utf8"));
  for (const c of components) {
    const spec = c.importPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`from\\s+["']${spec}["']`);
    c.usedBy = sources.filter((s) => re.test(s)).length;
    if (!c.summary) {
      const v = Object.entries(c.variants).map(([k, opts]) => `${k}: ${opts.join("/")}`).join("; ");
      c.summary = `${c.name} from ${c.file}${c.renders ? `, renders <${c.renders}>` : ""}${v ? ` (${v})` : ""}${c.parts.length ? `. Compose with ${c.parts.join(", ")}` : ""}.`;
    } else if (c.parts.length) c.summary += ` Compose with ${c.parts.join(", ")}.`;
  }
  const cssFiles = walk(root, (f) => f.endsWith(".css") && !f.endsWith(".min.css"));
  const tailwind = walk(root, (f) => /(^|\/)tailwind\.config\.(js|cjs|mjs|ts|cts|mts)$/.test(f)).map((f) => readTailwindConfig(f, root)).filter((c): c is TailwindTheme => !!c);
  return {
    components: components.sort((a, b) => b.usedBy - a.usedBy || a.name.localeCompare(b.name)),
    cssFiles,
    files: files.length,
    tailwind,
    fontVars: nextFontVars(sources),
    storyFiles: storyFiles.length,
  };
}

/** A minimal, valid usage line for briefs and render checks. */
export function exampleFor(c: RepoComponent): string {
  if (c.stories.length) return c.stories[0].example;
  const v = Object.entries(c.defaultVariants).map(([k, val]) => ` ${k}="${val}"`).join("");
  if (c.replaces.includes("input")) return `<${c.name}${v} placeholder="Email" />`;
  if (c.replaces.includes("table")) return `<${c.name}${v}><tbody><tr><td>Row</td></tr></tbody></${c.name}>`;
  return `<${c.name}${v}>${c.name}</${c.name}>`;
}

