import type { Look } from "./looks.ts";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface ColorToken { value: string; role: string }
export interface Tokens {
  name: string;
  description: string;
  color: Record<string, ColorToken>;
  font: Record<string, { family: string; use: string }>;
  fontSize: Record<string, number>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
  shadow: Record<string, string>;
  breakpoints: Record<string, number>;
}
export interface Rule { id: string; severity: "error" | "warn"; kind: string; title: string; why: string; fix: string }
export interface Component {
  name: string; file: string; summary: string; keywords: string[]; props: string; do: string[]; dont: string[]; code: string;
  replaces?: string[]; origin?: "playbook" | "repo" | "generated"; importPath?: string; exportName?: string; parts?: string[]; example?: string;
  stories?: { name: string; example: string; image?: string; looks?: Look[] }[];
}
export interface Pattern { name: string; keywords: string[]; summary: string; components: string[]; skeleton: string; rhythm: string; exemplar: string | null }

export interface Playbook {
  root: string;
  tokens: Tokens;
  voice: string;
  rules: Rule[];
  components: Component[];
  patterns: Pattern[];
}

export const DEFAULT_PLAYBOOK = join(dirname(fileURLToPath(import.meta.url)), "..", "playbook");

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

export function loadPlaybook(dir = process.env.DESIGNBASE_PLAYBOOK ?? DEFAULT_PLAYBOOK): Playbook {
  const root = resolve(dir);
  if (!existsSync(join(root, "tokens.json"))) throw new Error(`No playbook at ${root} (expected tokens.json)`);
  const components = readJson<Omit<Component, "code">[]>(join(root, "components.json")).map((c) => ({
    ...c,
    code: readFileSync(join(root, c.file), "utf8"),
  }));
  return {
    root,
    tokens: readJson<Tokens>(join(root, "tokens.json")),
    voice: readFileSync(join(root, "voice.md"), "utf8").trim(),
    rules: readJson<Rule[]>(join(root, "rules.json")),
    components,
    patterns: readJson<Pattern[]>(join(root, "patterns.json")),
  };
}

export const rule = (pb: Playbook, id: string): Rule => {
  const r = pb.rules.find((r) => r.id === id);
  if (!r) throw new Error(`Unknown rule ${id}`);
  return r;
};
