// Bridges stored playbook content and the on-disk layout the engine (lint, visual, brief, render) reads.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { loadPlaybook, type Playbook, type Tokens } from "../playbook.ts";
import { tokensFromDtcg, tokensToDtcg } from "./dtcg.ts";
import { PlaybookContent, type ComponentSpec } from "./schema.ts";

const BINARY = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".woff", ".woff2"]);

/** Read a playbook directory (the Phase 0 layout) into validated content. */
export function fromDirectory(dir: string): PlaybookContent {
  const read = (f: string) => readFileSync(join(dir, f), "utf8");
  const legacyTokens = JSON.parse(read("tokens.json")) as Tokens;
  const components = (JSON.parse(read("components.json")) as (Omit<ComponentSpec, "code"> & { file: string })[]).map(({ file, ...c }) => ({
    ...c,
    code: read(file),
  }));
  const exemplarDir = join(dir, "exemplars");
  const exemplars = existsSync(exemplarDir)
    ? readdirSync(exemplarDir).sort().map((file) => {
        const binary = BINARY.has(extname(file));
        const buf = readFileSync(join(exemplarDir, file));
        return { name: file.replace(/\.[^.]+$/, ""), file, content: buf.toString(binary ? "base64" : "utf8"), encoding: binary ? ("base64" as const) : ("utf8" as const) };
      })
    : [];
  return PlaybookContent.parse({
    schema: "designbase/playbook@1",
    name: legacyTokens.name,
    description: legacyTokens.description,
    tokens: tokensToDtcg(legacyTokens),
    voice: existsSync(join(dir, "voice.md")) ? read("voice.md").trim() : "",
    rules: JSON.parse(read("rules.json")),
    components,
    patterns: existsSync(join(dir, "patterns.json")) ? JSON.parse(read("patterns.json")) : [],
    exemplars,
  });
}

/**
 * Write content to a directory in the engine's layout and load it. The directory is replaced.
 * `asset` resolves stored assets (story images) so they ship with the playbook as stories/<hash>.png.
 */
export function materialize(content: PlaybookContent, dir: string, opts: { asset?: (hash: string) => Buffer | null | undefined } = {}): Playbook {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "components"), { recursive: true });
  mkdirSync(join(dir, "exemplars"), { recursive: true });
  const write = (f: string, data: string | Buffer) => writeFileSync(join(dir, f), data);

  write("tokens.json", JSON.stringify(tokensFromDtcg(content.tokens, { name: content.name, description: content.description }), null, 2));
  write("voice.md", content.voice + "\n");
  write("rules.json", JSON.stringify(content.rules, null, 2));
  write("patterns.json", JSON.stringify(content.patterns, null, 2));
  write(
    "components.json",
    JSON.stringify(content.components.map(({ code, ...c }) => ({ ...c, file: `components/${c.name}.tsx` })), null, 2),
  );
  for (const c of content.components) write(`components/${c.name}.tsx`, c.code);
  const images = [...new Set(content.components.flatMap((c) => c.stories.map((s) => s.image)).filter((h): h is string => !!h))];
  if (images.length && opts.asset) {
    mkdirSync(join(dir, "stories"), { recursive: true });
    for (const h of images) {
      const data = opts.asset(h);
      if (data) write(`stories/${h}.png`, data);
    }
  }
  for (const e of content.exemplars) write(`exemplars/${e.file}`, e.encoding === "base64" ? Buffer.from(e.content, "base64") : e.content);
  return loadPlaybook(dir);
}
