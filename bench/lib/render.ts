import { build, type Plugin } from "esbuild";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { Playbook } from "../../src/playbook.ts";
import { getBrowser, toUrl } from "../../src/visual.ts";

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TAILWIND = join(ROOT, "node_modules/.bin/tailwindcss");
const requireFromRoot = createRequire(join(ROOT, "package.json"));

export interface RenderResult {
  ok: boolean;
  html?: string;
  error?: string;
  stubbed: string[];
}

const pascal = (s: string) => s.replace(/\.(tsx|jsx|ts|js)$/, "").split(/[-_]/).map((p) => p[0]?.toUpperCase() + p.slice(1)).join("");

/**
 * Resolve imports the way a forgiving app would: anything named like a playbook component
 * (`@/components/ui/button`, `./Button`) gets the real component; React gets React;
 * everything else (icons, chart libs, next/link) becomes a stub that renders its children.
 */
function resolver(pb: Playbook, stubbed: Set<string>): Plugin {
  const components = new Map(pb.components.map((c) => [c.name.toLowerCase(), resolve(pb.root, c.file)]));
  return {
    name: "designbase-resolver",
    setup(b) {
      b.onResolve({ filter: /\.css$/ }, () => ({ path: "css", namespace: "empty" }));
      b.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === "entry-point" || args.namespace === "wrap" || args.importer.includes("/node_modules/") || args.path.startsWith("/")) return;
        if (/^react(-dom)?(\/.*)?$/.test(args.path)) return { path: requireFromRoot.resolve(args.path) };
        const name = pascal(basename(args.path)).toLowerCase();
        const file = components.get(name);
        if (file && args.importer && !args.importer.startsWith(resolve(pb.root, "components"))) {
          return { path: file, namespace: "wrap", pluginData: { file, name: pb.components.find((c) => c.name.toLowerCase() === name)!.name } };
        }
        if (args.path.startsWith(".") && args.importer) {
          const base = resolve(dirname(args.importer), args.path);
          if ([".tsx", ".ts", ".jsx", ".js", ""].some((ext) => existsSync(base + ext))) return;
        }
        stubbed.add(args.path);
        return { path: args.path, namespace: "stub" };
      });
      b.onLoad({ filter: /.*/, namespace: "empty" }, () => ({ contents: "", loader: "js" }));
      // Re-export so both `import { Button }` and `import Button` work.
      b.onLoad({ filter: /.*/, namespace: "wrap" }, (args) => ({
        contents: `export * from ${JSON.stringify(args.pluginData.file)}; export { ${args.pluginData.name} as default } from ${JSON.stringify(args.pluginData.file)};`,
        loader: "js",
        resolveDir: ROOT,
      }));
      b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
        contents: `const React = require("react");
const Stub = (props) => React.createElement(props && props.href ? "a" : "div", { "data-stub": "", href: props && props.href }, props && typeof props.children !== "function" ? props.children : null);
module.exports = new Proxy({}, { get: (_, key) => key === "__esModule" ? false : Stub });`,
        loader: "js",
        resolveDir: ROOT,
      }));
    },
  };
}

function themeCss(pb: Playbook): string {
  const t = pb.tokens;
  // Tokens are added on top of Tailwind's defaults (not replacing them), so off-system classes
  // like bg-blue-500 or text-4xl still render, and the visual check can measure them.
  return [
    "@theme {",
    ...Object.entries(t.color).map(([k, c]) => `  --color-${k}: ${c.value};`),
    ...Object.entries(t.font).map(([k, f]) => `  --font-${k}: "${f.family}", ${k === "mono" ? "monospace" : k === "display" ? "serif" : "sans-serif"};`),
    ...Object.entries(t.fontSize).map(([k, v]) => `  --text-${k}: ${v / 16}rem;`),
    ...Object.entries(t.radius).filter(([k]) => k !== "none" && k !== "full").map(([k, v]) => `  --radius-${k}: ${v}px;`),
    "}",
  ].join("\n");
}

export async function renderTsx(pb: Playbook, tsxPath: string, outDir: string): Promise<RenderResult> {
  const stubbed = new Set<string>();
  const src = resolve(tsxPath);
  mkdirSync(outDir, { recursive: true });
  const entry = join(outDir, "entry.jsx");
  writeFileSync(
    entry,
    `import * as Mod from ${JSON.stringify(src)};
import { createRoot } from "react-dom/client";
import { createElement } from "react";
const App = Mod.default ?? Object.values(Mod).find((v) => typeof v === "function");
createRoot(document.getElementById("root")).render(createElement(App));
`,
  );

  try {
    await build({
      entryPoints: [entry],
      bundle: true,
      outfile: join(outDir, "app.js"),
      format: "iife",
      jsx: "automatic",
      loader: { ".tsx": "tsx", ".jsx": "jsx" },
      define: { "process.env.NODE_ENV": '"production"' },
      nodePaths: [join(ROOT, "node_modules")],
      plugins: [resolver(pb, stubbed)],
      logLevel: "silent",
    });
  } catch (e) {
    return { ok: false, error: `build: ${(e as Error).message.split("\n").slice(0, 4).join(" ")}`, stubbed: [...stubbed] };
  }

  writeFileSync(
    join(outDir, "in.css"),
    `@import "tailwindcss" source(none);\n@source ${JSON.stringify(src)};\n@source ${JSON.stringify(resolve(pb.root, "components"))};\n${themeCss(pb)}\n`,
  );
  try {
    await run(TAILWIND, ["-i", join(outDir, "in.css"), "-o", join(outDir, "app.css")], { cwd: ROOT });
  } catch (e) {
    return { ok: false, error: `tailwind: ${(e as Error).message.slice(0, 300)}`, stubbed: [...stubbed] };
  }

  const html = join(outDir, "index.html");
  writeFileSync(
    html,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=IBM+Plex+Mono&family=IBM+Plex+Sans:wght@400;500&display=swap">
<link rel="stylesheet" href="app.css"></head><body><div id="root"></div><script src="app.js"></script></body></html>`,
  );

  // Smoke-load once: a component that throws renders nothing and would otherwise "pass" the visual check.
  const browser = await getBrowser();
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(toUrl(html), { waitUntil: "load", timeout: 20_000 });
    const children = await page.evaluate(() => document.getElementById("root")?.childElementCount ?? 0);
    if (errors.length || !children) return { ok: false, html, error: `runtime: ${errors[0] ?? "rendered nothing"}`.slice(0, 300), stubbed: [...stubbed] };
  } finally {
    await page.close();
  }
  return { ok: true, html, stubbed: [...stubbed] };
}
