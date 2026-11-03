import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBrief, dumpPlaybook } from "../../src/brief.ts";
import type { Playbook } from "../../src/playbook.ts";
import type { Message, Part } from "./models.ts";

export interface Task { id: string; prompt: string }

export const CONDITIONS = {
  "A-screenshot": "Task + screenshots of two approved screens. Today's paste-a-Figma-screenshot workflow.",
  "B-dump": "Task + the entire playbook pasted into the system prompt (a DESIGN.md-style dump).",
  "C-brief": "Task + designbase get_brief output: only the rules, tokens, pattern and components this task needs.",
  "D-loop": "C, then designbase check (lint + rendered measurement) feeds violations back; up to 3 fix rounds.",
} as const;
export type Condition = keyof typeof CONDITIONS;

const ASK = (task: Task) =>
  `${task.prompt}

Write it as a single React component file in TypeScript using Tailwind CSS classes, with a default export. Use realistic sample data inline. Output only the code, in one \`\`\`tsx block.`;

const COMPONENT_IMPORTS = `Playbook components are available: import them as \`import { Button } from "@/components/Button"\` (same for every component name). Do not re-implement them.`;

const image = (path: string): Part => ({ type: "image_url", image_url: { url: `data:image/png;base64,${readFileSync(path).toString("base64")}` } });

export function initialMessages(pb: Playbook, condition: Condition, task: Task, assetsDir: string): Message[] {
  switch (condition) {
    case "A-screenshot":
      return [
        {
          role: "user",
          content: [
            { type: "text", text: `${ASK(task)}\n\nThese two screenshots are approved screens from our product. Match their visual design language exactly.` },
            image(join(assetsDir, "dashboard.png")),
            image(join(assetsDir, "settings.png")),
          ],
        },
      ];
    case "B-dump":
      return [
        { role: "system", content: `You build UI for our product. Follow this design system exactly.\n\n${COMPONENT_IMPORTS}\n\n${dumpPlaybook(pb)}` },
        { role: "user", content: ASK(task) },
      ];
    case "C-brief":
    case "D-loop":
      return [
        { role: "system", content: `You build UI for our product. Follow this design brief exactly.\n\n${COMPONENT_IMPORTS}\n\n${buildBrief(pb, task.prompt)}` },
        { role: "user", content: ASK(task) },
      ];
  }
}

export function fixMessage(report: string): Message {
  return {
    role: "user",
    content: `designbase check failed on your file:\n\n${report}\n\nFix every error. Return the complete corrected file in one \`\`\`tsx block.`,
  };
}
