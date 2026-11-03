// Storybook stories (CSF 2 and 3) are the team's own approved states for each component: which
// variants exist, which prop combinations are sanctioned, and real usage to show agents. Read
// statically like the rest of the repo; nothing is executed.
import { parse } from "@babel/parser";
import { readFileSync } from "node:fs";

type N = { type: string; [k: string]: any };

export interface Story { name: string; example: string }
export interface StoryFile {
  file: string;
  title: string | null;
  /** The `component:` in meta, with the import it came from. */
  component: { local: string; imported: string; source: string } | null;
  description: string;
  argTypes: Record<string, { options?: string[]; description?: string }>;
  stories: Story[];
}

const strip = (n: N): N => (/^TS(AsExpression|SatisfiesExpression|NonNullExpression|TypeAssertion)$|^ParenthesizedExpression$/.test(n?.type) ? strip(n.expression) : n);
const keyOf = (p: N) => p.key?.name ?? (p.key?.value !== undefined ? String(p.key.value) : undefined);
const prop = (obj: N | null | undefined, key: string): N | undefined => (obj?.type === "ObjectExpression" ? obj.properties.find((p: N) => p.type === "ObjectProperty" && keyOf(p) === key)?.value : undefined);

export function readStoryFile(file: string): StoryFile | null {
  const code = readFileSync(file, "utf8");
  let ast: N;
  try {
    ast = parse(code, { sourceType: "module", plugins: ["typescript", "jsx"], errorRecovery: true }) as unknown as N;
  } catch {
    return null;
  }
  const text = (n: N | null | undefined) => (n ? code.slice(n.start, n.end) : "");
  const consts = new Map<string, N>();
  const imports = new Map<string, { imported: string; source: string }>();
  const exportsInOrder: string[] = [];
  const assignedArgs = new Map<string, N>(); // CSF2: Primary.args = {…}
  const assignedNames = new Map<string, string>(); // Primary.storyName = "…"
  let metaNode: N | null = null;

  for (const stmt of ast.program.body as N[]) {
    if (stmt.type === "ImportDeclaration") {
      for (const s of stmt.specifiers) imports.set(s.local.name, { imported: s.type === "ImportDefaultSpecifier" ? "default" : s.imported?.name ?? s.local.name, source: stmt.source.value });
      continue;
    }
    if (stmt.type === "ExportDefaultDeclaration") {
      const d = strip(stmt.declaration);
      metaNode = d.type === "Identifier" ? strip(consts.get(d.name) ?? d) : d;
      continue;
    }
    const decl = stmt.type === "ExportNamedDeclaration" ? stmt.declaration : stmt;
    if (decl?.type === "VariableDeclaration") {
      for (const d of decl.declarations) {
        if (d.id?.type !== "Identifier" || !d.init) continue;
        consts.set(d.id.name, d.init);
        if (stmt.type === "ExportNamedDeclaration") exportsInOrder.push(d.id.name);
      }
    }
    if (decl?.type === "FunctionDeclaration" && decl.id && stmt.type === "ExportNamedDeclaration") {
      consts.set(decl.id.name, decl);
      exportsInOrder.push(decl.id.name);
    }
    const e = stmt.type === "ExpressionStatement" ? stmt.expression : null;
    if (e?.type === "AssignmentExpression" && e.left.type === "MemberExpression" && e.left.object.type === "Identifier") {
      const field = e.left.property.name;
      if (field === "args") assignedArgs.set(e.left.object.name, strip(e.right));
      if (field === "storyName" && e.right.type === "StringLiteral") assignedNames.set(e.left.object.name, e.right.value);
    }
  }
  if (!metaNode || metaNode.type !== "ObjectExpression") return null;

  const titleNode = prop(metaNode, "title");
  const compNode = prop(metaNode, "component");
  const comp = compNode?.type === "Identifier" && imports.has(compNode.name) ? { local: compNode.name, ...imports.get(compNode.name)! } : null;
  const docs = prop(prop(prop(prop(metaNode, "parameters"), "docs"), "description"), "component");
  const leading = (metaNode.leadingComments ?? []).filter((c: N) => c.value.startsWith("*")).pop()?.value.replace(/^\*|\n\s*\*\s?/g, " ").trim() ?? "";

  const argTypes: StoryFile["argTypes"] = {};
  const at = prop(metaNode, "argTypes");
  for (const p of at?.type === "ObjectExpression" ? at.properties : []) {
    const k = keyOf(p);
    if (!k || p.type !== "ObjectProperty") continue;
    const opts = prop(p.value, "options") ?? prop(prop(p.value, "control"), "options");
    const desc = prop(p.value, "description");
    argTypes[k] = {
      ...(opts?.type === "ArrayExpression" ? { options: opts.elements.filter((x: N) => x?.type === "StringLiteral").map((x: N) => x.value) } : {}),
      ...(desc?.type === "StringLiteral" ? { description: desc.value } : {}),
    };
  }

  // Args are kept as source snippets; the story's JSX is rebuilt from them.
  type Args = Map<string, N>;
  const argsOf = (obj: N | undefined, seen: Map<string, Args>): Args => {
    const out: Args = new Map();
    for (const p of obj?.type === "ObjectExpression" ? obj.properties : []) {
      if (p.type === "SpreadElement") {
        // ...Primary.args
        const src = text(p.argument).replace(/\.args$/, "");
        for (const [k, v] of seen.get(src) ?? []) out.set(k, v);
      } else if (p.type === "ObjectProperty" && keyOf(p)) out.set(keyOf(p)!, strip(p.value));
    }
    return out;
  };
  const metaArgs = argsOf(prop(metaNode, "args"), new Map());
  const name = comp?.local ?? "Component";

  const attrs = (args: Args): { attrs: string; children: string } => {
    let a = "", children = "";
    for (const [k, v] of args) {
      if (k === "children") {
        if (v.type === "StringLiteral") children = v.value;
        else if (v.type === "JSXElement" || v.type === "JSXFragment") children = text(v);
        continue;
      }
      if (v.type === "StringLiteral") a += v.value.includes('"') ? ` ${k}={${JSON.stringify(v.value)}}` : ` ${k}="${v.value}"`;
      else if (v.type === "BooleanLiteral") a += v.value ? ` ${k}` : ` ${k}={false}`;
      else if (v.type === "NumericLiteral") a += ` ${k}={${v.value}}`;
      // Handlers (fn(), action("…"), arrows) are test plumbing, not part of the design.
      else if (/Function|CallExpression/.test(v.type)) continue;
      else if (text(v).length <= 60) a += ` ${k}={${text(v)}}`;
    }
    return { attrs: a, children };
  };

  const seen = new Map<string, Args>();
  const stories: Story[] = [];
  for (const exp of exportsInOrder) {
    const node = strip(consts.get(exp)!);
    let storyObj: N | undefined;
    let render: N | undefined;
    if (node.type === "ObjectExpression") {
      storyObj = node;
      render = prop(node, "render");
    } else if (/Function/.test(node.type)) render = node; // CSF2 function story
    else if (!(node.type === "CallExpression" && /\.bind$/.test(text(node.callee)))) continue; // not a story (helpers, data)
    const args = new Map([...metaArgs, ...argsOf(prop(storyObj, "args") ?? assignedArgs.get(exp), seen)]);
    seen.set(exp, args);
    const nameNode = prop(storyObj, "name");
    const storyName = nameNode?.type === "StringLiteral" ? nameNode.value : assignedNames.get(exp) ?? exp.replace(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, " ");
    const { attrs: a, children } = attrs(args);

    let example = children ? `<${name}${a}>${children}</${name}>` : `<${name}${a} />`;
    // A custom render with real composition is better evidence than rebuilt args, if it's short.
    const body = render && strip(render.body?.type === "BlockStatement" ? render.body.body.find((s: N) => s.type === "ReturnStatement")?.argument ?? render.body : render.body ?? render);
    if (body && (body.type === "JSXElement" || body.type === "JSXFragment")) {
      const src = text(body)
        .replace(new RegExp(`<${name}([^>]*?)\\{\\s*\\.\\.\\.args\\s*\\}([^>]*?)/>`, "g"), (_, pre, post) => (children ? `<${name}${pre}${a}${post}>${children}</${name}>` : `<${name}${pre}${a}${post}/>`))
        .replace(/\{\s*\.\.\.args\s*\}/g, a.trim())
        .replace(/\s+/g, " ")
        .replace(/ +>/g, ">");
      if (src.length <= 400) example = src;
    }
    stories.push({ name: storyName, example });
  }

  return {
    file,
    title: titleNode?.type === "StringLiteral" ? titleNode.value : null,
    component: comp,
    description: docs?.type === "StringLiteral" ? docs.value : docs?.type === "TemplateLiteral" ? docs.quasis.map((q: N) => q.value.cooked).join("") : leading,
    argTypes,
    stories,
  };
}
