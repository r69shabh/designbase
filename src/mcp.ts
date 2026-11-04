// The MCP tools agents call: briefs, components (with rendered Storybook states), tokens, rules and
// the checker. Images go out as MCP image content so agents that can see get the approved look.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { briefImages, buildBrief, rankComponents } from "./brief.ts";
import { check } from "./check.ts";
import { describeLook } from "./looks.ts";
import { storyImage, type Playbook } from "./playbook.ts";
import { exportTokens } from "./tokens.ts";

type Content = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const image = (path: string) => ({ type: "image" as const, data: readFileSync(path).toString("base64"), mimeType: "image/png" });

export function createMcpServer(pb: Playbook): McpServer {
  const server = new McpServer({ name: "designbase", version: "0.0.1" });

  server.registerTool(
    "get_brief",
    {
      title: "Get a design brief",
      description: `Call this FIRST, before writing any UI. Returns the ${pb.tokens.name} playbook rules, tokens, matching layout pattern and the components to use for one task, trimmed to what the task needs.`,
      inputSchema: { task: z.string().describe("What you're about to build, e.g. 'invoice list page with filters'") },
    },
    async ({ task }) => {
      const images = briefImages(pb, task);
      if (!images.length) return text(buildBrief(pb, task));
      return {
        content: [
          { type: "text" as const, text: buildBrief(pb, task) },
          { type: "text" as const, text: "Approved states from the team's Storybook, rendered. Match these exactly: same fills, corners, padding and type." },
          ...images.flatMap((i) => [{ type: "text" as const, text: i.label }, image(i.path)]),
        ],
      };
    },
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
      description: "Full spec and source for one playbook component, with its approved Storybook states rendered as images. Pass `story` to see one state.",
      inputSchema: { name: z.string(), story: z.string().optional().describe("A story name, e.g. 'Secondary'") },
    },
    async ({ name, story }) => {
      const c = pb.components.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (!c) return text(`Unknown component "${name}". Available: ${pb.components.map((c) => c.name).join(", ")}.`);
      const stories = (c.stories ?? []).filter((s) => !story || s.name.toLowerCase() === story.toLowerCase());
      if (story && !stories.length) return text(`${c.name} has no story "${story}". Stories: ${(c.stories ?? []).map((s) => s.name).join(", ") || "none"}.`);
      const spec = [
        `# ${c.name}`, c.summary,
        c.importPath ? `Import: \`${c.exportName === "default" ? `import ${c.name}` : `import { ${[c.name, ...(c.parts ?? [])].join(", ")} }`} from "${c.importPath}"\`` : null,
        `Props: \`${c.props}\``, `Do: ${c.do.join("; ")}`, `Don't: ${c.dont.join("; ")}`,
        ...(story ? [] : ["```tsx", c.code.trim(), "```"]),
      ].filter((x): x is string => x !== null).join("\n");
      const content: Content[] = [{ type: "text", text: spec }];
      for (const s of stories.slice(0, story ? 1 : 6)) {
        const look = s.looks?.[0];
        content.push({ type: "text", text: `Story "${s.name}": \`${s.example}\`${look ? `\nRenders as ${describeLook(look)}` : ""}` });
        const p = storyImage(pb, s.image);
        if (p) content.push(image(p));
      }
      return { content };
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
        const content: Content[] = [
          { type: "text", text: `${r.passed ? "PASS" : "FAIL"} — score ${r.score}/100\n\n${r.report}` },
        ];
        if (r.mode === "visual" && screenshots) {
          for (const s of r.screenshots.filter((s) => s.viewport !== "tablet")) {
            content.push({ type: "image", data: readFileSync(s.path).toString("base64"), mimeType: "image/png" });
          }
          // For controls that drifted, show the approved state they should match.
          const refs = [...new Map(r.violations.filter((v) => v.ref?.image).map((v) => [v.ref!.image!, v.ref!])).values()].slice(0, 4);
          for (const ref of refs) {
            const p = storyImage(pb, ref.image);
            if (!p) continue;
            content.push({ type: "text", text: `Approved look to match: ${ref.component} / ${ref.story}` }, image(p));
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
  return server;
}
