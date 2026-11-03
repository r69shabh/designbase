import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fromDirectory } from "../src/core/materialize.ts";
import type { ComponentDraft, Synthesizer } from "../src/designer/components.ts";
import { findCandidates } from "../src/designer/discover.ts";
import { runDiscovery } from "../src/designer/discover-job.ts";
import { acceptAbove, applyProposals } from "../src/designer/extract.ts";
import { measureUrl } from "../src/designer/measure.ts";
import { loadPlaybook } from "../src/playbook.ts";
import { Store } from "../src/store/db.ts";
import { closeBrowser } from "../src/visual.ts";

after(closeBrowser);
const pages = ["dashboard", "settings"].map((f) => resolve(`playbook/exemplars/${f}.html`));

test("discovery finds Almanac's components and their variants", { timeout: 60_000 }, async () => {
  const pb = loadPlaybook();
  const cs = findCandidates(await Promise.all(pages.map((p) => measureUrl(p))), pb.tokens);
  const byKind = (k: string) => cs.filter((c) => c.kind === k);
  const button = byKind("button")[0];
  assert.ok(button, "button found");
  assert.ok(button.skins.some((s) => s.includes("bg:accent")) && button.skins.some((s) => s.includes("border:brick")), "primary and danger variants");
  assert.ok(byKind("input").length === 1, "one field component");
  assert.ok(byKind("table").length === 1, "table");
  assert.ok(cs.some((c) => c.skins.some((s) => s.includes("border:moss")) && c.skins.some((s) => s.includes("border:brick"))), "badge tones");
  assert.ok(cs.some((c) => c.kind === "section" && c.skins.some((s) => s.includes("border:line"))), "card shell");
  assert.ok(cs.some((c) => c.instances[0].description.includes("size:2xl font:display")), "stat tile");
  // No chart bars.
  assert.ok(!cs.some((c) => c.instances[0].description.match(/^span \[bg:ink-2 \d+×\d+px\]$/)));
});

const almanac = (name: string) => readFileSync(`playbook/components/${name}.tsx`, "utf8");
const draft = (name: string, example: string, extra: Partial<ComponentDraft> = {}): ComponentDraft => ({
  name, summary: `${name} from the stub`, keywords: [name.toLowerCase()], propSpecs: [{ name: "children", type: "ReactNode", required: true, description: "" }],
  variants: {}, replaces: [], do: [], dont: [], example, code: almanac(name), ...extra,
});

// Stands in for the model: returns Almanac's real code for buttons and badges, nothing else.
const goodStub: Synthesizer = async ({ candidate }) => {
  if (candidate.kind === "button") return { draft: draft("Button", `<Button variant="primary">New invoice</Button>`, { replaces: ["button"], variants: { variant: ["primary", "secondary", "ghost", "danger"] } }) };
  if (candidate.skins.some((s) => s.includes("border:moss"))) return { draft: draft("Badge", `<Badge tone="positive">Paid</Badge>`) };
  throw new Error("stub only builds buttons and badges");
};

test("discovery job builds, verifies, proposes and applies components", { timeout: 180_000 }, async () => {
  const store = new Store(mkdtempSync(join(tmpdir(), "designbase-disc-")));
  const ws = store.createWorkspace("t");
  const content = fromDirectory("playbook");
  const pb = store.createPlaybook(ws.id, "Almanac", { ...content, components: [] });
  for (const p of pages) store.addSource(pb.id, "url", { uri: p });

  const job = store.enqueue("discover", { playbookId: pb.id }, pb.id);
  const result = await runDiscovery(store, store.claimJob()!, goodStub);
  assert.equal(store.job(job.id)!.status, "running");
  const built = Object.fromEntries(result.built.map((b) => [b.name, b]));
  assert.ok(built.Button?.passed, `Button verified: ${JSON.stringify(built.Button)}`);
  assert.ok(built.Badge?.score >= 75, `Badge score ${built.Badge?.score}`);
  assert.ok(result.failed.length > 0, "other candidates fail in the stub");

  const proposal = store.proposals(pb.id, "open").find((p) => p.key === "Button")!;
  const data = proposal.data as { verification: { size: { source: number[]; render: number[] } }; assets: { source: string; render: string } };
  assert.ok(store.asset(data.assets.source) && store.asset(data.assets.render), "source crop and render stored");
  assert.ok(Math.abs(data.verification.size.render[1] - data.verification.size.source[1]) <= 2, "rendered height matches the source");

  store.review(proposal.id, "accept");
  const v = applyProposals(store, pb.id, "Add Button");
  assert.deepEqual(v.changes.map((c) => `${c.area}:${c.key}:${c.op}`), ["component:Button:added"]);
  const button = store.version(pb.id)!.content.components.find((c) => c.name === "Button")!;
  assert.deepEqual(button.replaces, ["button"]);
  assert.match(button.props, /children: ReactNode/);
  assert.equal(acceptAbove(store, pb.id, 0), 0, "components are never auto-accepted");
  store.close();
});

test("an off-brand draft scores low and gets specific feedback", { timeout: 180_000 }, async () => {
  const store = new Store(mkdtempSync(join(tmpdir(), "designbase-disc-")));
  const ws = store.createWorkspace("t");
  const pb = store.createPlaybook(ws.id, "Almanac", { ...fromDirectory("playbook"), components: [] });
  store.addSource(pb.id, "url", { uri: pages[0] });
  const feedback: string[] = [];
  const badStub: Synthesizer = async ({ candidate }, previous) => {
    if (previous) feedback.push(previous.feedback);
    if (candidate.kind !== "button") throw new Error("skip");
    return {
      draft: draft("Button", `<Button>New invoice</Button>`, {
        code: `export function Button({ children }: { children: React.ReactNode }) {\n  return <button className="rounded-xl bg-blue-500 px-5 py-1 text-white shadow-lg">{children}</button>;\n}\n`,
      }),
    };
  };
  store.enqueue("discover", { playbookId: pb.id }, pb.id);
  const result = await runDiscovery(store, store.claimJob()!, badStub);
  const button = result.built.find((b) => b.name === "Button")!;
  assert.equal(button.passed, false);
  assert.equal(button.rounds, 3, "kept trying");
  assert.ok(button.score < 60, `score ${button.score}`);
  const text = feedback.join("\n");
  for (const want of ["blue-500", "rounded-xl", "shadow-lg", "px-5", "missing in the render: accent"]) assert.ok(text.includes(want), `feedback mentions ${want}`);
  store.close();
});

test("only real controls can be replaced", async () => {
  const { cleanReplaces } = await import("../src/designer/components.ts");
  assert.deepEqual(cleanReplaces(["input[type=text]", "input[type=email]", "div", "span", "section", "Button", "table"]), ["input", "button", "table"]);
});
