import { readFileSync } from "node:fs";
import { buildBrief, dumpPlaybook } from "../src/brief.ts";
import { loadPlaybook } from "../src/playbook.ts";

const [condition, taskId] = process.argv.slice(2);
const tasks: { id: string; prompt: string }[] = JSON.parse(readFileSync(new URL("./tasks.json", import.meta.url), "utf8"));
const task = tasks.find((t) => t.id === taskId);
if (!task || !condition) {
  console.error(`usage: bench:prompt -- <A-screenshot|B-dump|C-brief|D-loop> <task-id>\ntasks: ${tasks.map((t) => t.id).join(", ")}`);
  process.exit(1);
}
const pb = loadPlaybook();
const ask = `${task.prompt}\n\nWrite it as a single React component file using Tailwind CSS classes. Output only the file.`;

switch (condition) {
  case "A-screenshot":
    console.log(`${ask}\n\nMatch the visual style of the attached screenshot exactly.\n\n[attach bench/assets/dashboard.png and bench/assets/settings.png]`);
    break;
  case "B-dump":
    console.log(`${ask}\n\nFollow this design system exactly:\n\n${dumpPlaybook(pb)}`);
    break;
  case "C-brief":
    console.log(`${ask}\n\nFollow this design brief exactly:\n\n${buildBrief(pb, task.prompt)}`);
    break;
  case "D-loop":
    console.log(`${ask}\n\nUse the designbase MCP tools: call get_brief first, build with the playbook components, then call check on your file and fix everything it reports until it passes. Save the file to bench/runs/D-loop/${task.id}.tsx.`);
    break;
  default:
    console.error(`Unknown condition ${condition}`);
    process.exit(1);
}
