#!/usr/bin/env -S npx tsx
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { buildBrief, rankComponents } from "./brief.ts";
import { check } from "./check.ts";
import { loadPlaybook } from "./playbook.ts";
import { exportTokens } from "./tokens.ts";
import { closeBrowser } from "./visual.ts";

const pb = loadPlaybook();
const server = new McpServer({ name: "designbase", version: "0.0.1" });
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

server.registerTool(
  "get_brief",
  {
    title: "Get a design brief",
    description: `Call this FIRST, before writing any UI. Returns the ${pb.tokens.name} playbook rules, tokens, matching layout pattern and the components to use for one task, trimmed to what the task needs.`,
    inputSchema: { task: z.string().describe("What you're about to build, e.g. 'invoice list page with filters'") },
  },
  async ({ task }) => text(buildBrief(pb, task)),
);

server.registerTool(
  "find_component",
  {
    title: "Find a component",
    description: "Search the playbook's components by what you need ('something to show a status'). Use before creating any new component.",
    inputSchema: { query: z.string() },
  },
  async ({ query }) => {
    const hits = rankComponents(pb, query).filter((h) => h.score > 0).slice(0, 5);
    if (!hits.length) return text(`No component matches "${query}". Available: ${pb.components.map((c) => c.name).join(", ")}.`);
    return text(hits.map(({ component: c }) => `- **${c.name}** (${c.file}): ${c.summary} Props: \`${c.props}\``).join("\n"));
  },
);

server.registerTool(
  "get_component",
  {
    title: "Get a component",
    description: "Full spec and source for one playbook component.",
    inputSchema: { name: z.string() },
  },
  async ({ name }) => {
    const c = pb.components.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!c) return text(`Unknown component "${name}". Available: ${pb.components.map((c) => c.name).join(", ")}.`);
    return text([`# ${c.name}`, c.summary, `Props: \`${c.props}\``, `Do: ${c.do.join("; ")}`, `Don't: ${c.dont.join("; ")}`, "```tsx", c.code.trim(), "```"].join("\n"));
  },
);

server.registerTool(
  "get_tokens",
  {
    title: "Get design tokens",
    description: "Design tokens as JSON, CSS variables, or a Tailwind v4 @theme / v3 config that removes Tailwind's default palette.",
    inputSchema: { format: z.enum(["json", "css", "tailwind-v4", "tailwind-v3"]).default("tailwind-v4") },
  },
  async ({ format }) => text(exportTokens(pb, format)),
);

server.registerTool(
  "check",
  {
    title: "Check UI against the playbook",
    description:
      "Check your UI output against the playbook. Pass a source file path (.tsx/.jsx: static lint), inline `code`, or an .html file / http URL (renders at 375/768/1280px, measures computed styles against tokens, returns screenshots). Fix every error and call again until it passes.",
    inputSchema: {
      path: z.string().optional().describe("Absolute path to a source or .html file"),
      url: z.string().optional().describe("http(s) URL of a running page, e.g. your dev server"),
      code: z.string().optional().describe("Inline source to lint"),
      screenshots: z.boolean().default(true).describe("For rendered checks, include mobile and desktop screenshots for you to review"),
    },
  },
  async ({ path, url, code, screenshots }) => {
    try {
      const r = await check(pb, { path, url, code });
      const content: ({ type: "text"; text: string } | { type: "image"; data: string; mimeType: string })[] = [
        { type: "text", text: `${r.passed ? "PASS" : "FAIL"} — score ${r.score}/100\n\n${r.report}` },
      ];
      if (r.mode === "visual" && screenshots) {
        for (const s of r.screenshots.filter((s) => s.viewport !== "tablet")) {
          content.push({ type: "image", data: readFileSync(s.path).toString("base64"), mimeType: "image/png" });
        }
        content.push({
          type: "text",
          text: `Now review the screenshots yourself against the playbook voice: is there one clear primary action, does type (not boxes or colour) carry the hierarchy, is spacing generous between sections and compact inside tables, is anything centred that should hang left? Fix what you find.\n\nVoice:\n${pb.voice}`,
        });
      }
      return { content };
    } catch (e) {
      return { content: [{ type: "text" as const, text: `check failed: ${(e as Error).message}` }], isError: true };
    }
  },
);

server.registerTool(
  "list_rules",
  { title: "List playbook rules", description: "Every rule the checker enforces, with why and how to fix.", inputSchema: {} },
  async () => text(pb.rules.map((r) => `- [${r.severity}] **${r.id}** — ${r.title}. ${r.why} Fix: ${r.fix}`).join("\n")),
);

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => closeBrowser().finally(() => process.exit(0)));
await server.connect(new StdioServerTransport());
