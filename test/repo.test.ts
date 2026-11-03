import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApp } from "../src/api/app.ts";
import { startWorker } from "../src/api/worker.ts";
import { runDiscovery } from "../src/designer/discover-job.ts";
import { scanRepo } from "../src/designer/repo.ts";
import { parseCssColor, tokensFromCode } from "../src/designer/repo-tokens.ts";
import { Store } from "../src/store/db.ts";
import { closeBrowser } from "../src/visual.ts";

const REPO = resolve("test/fixtures/repo");
const REPO_V3 = resolve("test/fixtures/repo-v3");
after(closeBrowser);

test("finds the team's components with props, variants and what they stand in for", () => {
  const { components } = scanRepo(REPO);
  const by = Object.fromEntries(components.map((c) => [c.name, c]));
  assert.deepEqual(Object.keys(by).sort(), ["Badge", "Button", "Card", "Input", "StatCard", "Table"], "no hooks, no route pages");

  assert.equal(by.Button.importPath, "@/components/ui/button");
  assert.deepEqual(by.Button.replaces, ["button"], "asChild ? Slot : \"button\" resolves to <button>");
  assert.deepEqual(by.Button.variants, { variant: ["default", "destructive", "outline", "ghost"], size: ["default", "sm", "lg"] });
  assert.equal(by.Button.defaultVariants.variant, "default");
  assert.match(by.Button.summary, /primary action control/);
  assert.ok(by.Button.propSpecs.some((p) => p.name === "asChild" && p.type === "boolean" && !p.required));
  assert.equal(by.Button.usedBy, 1, "imported by the route page");

  assert.deepEqual(by.Input.replaces, ["input"], "ComponentProps<\"input\">");
  assert.deepEqual(by.Table.replaces, ["table"], "forwardRef<HTMLTableElement> even though it renders a wrapper div");
  assert.deepEqual(by.Card.parts, ["CardHeader", "CardTitle", "CardContent"]);
  assert.equal(by.Badge.propSpecs.find((p) => p.name === "variant")!.type, '"default" | "secondary" | "destructive" | "outline"');
  assert.equal(by.StatCard.exportName, "default");
  assert.deepEqual(by.StatCard.propSpecs.map((p) => `${p.name}${p.required ? "" : "?"}`), ["label", "value", "trend?", "delta?"]);
});

test("reads declared tokens exactly, including oklch and calc()", () => {
  assert.equal(parseCssColor("oklch(0.577 0.245 27.325)"), "#E7000B");
  assert.equal(parseCssColor("222.2 47.4% 11.2%"), "#0F172A", "shadcn v3 bare HSL");
  const scan = scanRepo(REPO);
  const { tokens, darkColors } = tokensFromCode(scan.cssFiles, scan.components.flatMap((c) => c.classes), REPO);
  const get = (cat: string, name: string) => tokens.find((t) => t.category === cat && t.name === name)?.value;
  assert.equal(get("color", "primary"), "#171717");
  assert.equal(get("color", "destructive"), "#E7000B");
  assert.equal(get("color", "brand"), "#4F46E5");
  assert.equal(get("radius", "sm"), 6, "calc(var(--radius) - 4px)");
  assert.equal(get("font", "sans"), "Geist");
  assert.equal(get("spacing", "4"), 16, "p-4 × --spacing 0.25rem");
  assert.equal(get("fontSize", "sm"), 14);
  assert.equal(darkColors.background, "#0A0A0A");
});

test("Tailwind v3: reads tailwind.config.js statically and resolves hsl(var(--x)) against the CSS", () => {
  const scan = scanRepo(REPO_V3);
  assert.equal(scan.tailwind.length, 1);
  assert.ok(scan.tailwind[0].unresolved.includes("slate: colors.slate"), "Tailwind's own palette needs running code; reported, not guessed");
  assert.deepEqual(scan.fontVars, { "--font-inter": "Inter" }, "next/font variable");
  const { tokens, darkColors } = tokensFromCode(scan.cssFiles, scan.components.flatMap((c) => c.classes), REPO_V3, { tailwind: scan.tailwind, fontVars: scan.fontVars });
  const get = (cat: string, name: string) => tokens.find((t) => t.category === cat && t.name === name)?.value;
  assert.equal(get("color", "primary"), "#0F172A", "DEFAULT + <alpha-value>");
  assert.equal(get("color", "primary-foreground"), "#F8FAFC");
  assert.equal(get("color", "danger"), "#DC2626", "rgb channels");
  assert.equal(get("color", "brand-500"), "#6366F1", "const palette object");
  assert.equal(get("color", "danger-rgb"), undefined, "variables the config maps aren't proposed twice");
  assert.equal(get("radius", "md"), 6);
  assert.equal(get("font", "sans"), "Inter");
  assert.equal(get("font", "display"), "Fraunces");
  assert.equal(get("fontSize", "display"), 48);
  assert.equal(get("spacing", "18"), 72);
  assert.ok(get("shadow", "card"));
  assert.equal(darkColors.background, "#020817");
});

test("tailwind-variants tv() tables are read like cva", () => {
  const chip = scanRepo(REPO_V3).components.find((c) => c.name === "Chip")!;
  assert.deepEqual(chip.variants, { tone: ["neutral", "brand"], size: ["sm", "md"] });
  assert.deepEqual(chip.defaultVariants, { tone: "neutral", size: "sm" });
  assert.ok(chip.classes.includes("bg-brand-50"), "array-valued classes");
});

test("Storybook: stories attach to their components as approved states", () => {
  const { components, storyFiles } = scanRepo(REPO_V3);
  assert.equal(storyFiles, 2);
  const by = Object.fromEntries(components.map((c) => [c.name, c]));
  assert.deepEqual(Object.keys(by).sort(), ["Button", "Chip", "Tabs", "TextField"]);
  assert.equal(by.Tabs.renders, "TabsPrimitive.Root", "re-exported primitive leads its parts");
  assert.deepEqual(by.Tabs.parts, ["TabsList", "TabsTrigger"]);
  const b = by.Button;
  assert.equal(b.importPath, "~/components/Button", "jsconfig alias");
  assert.deepEqual(b.variants.intent, ["primary", "secondary", "danger"], "argTypes options fill variants the types don't spell out");
  assert.match(b.summary, /single main action/, "docs description");
  assert.deepEqual(b.stories.map((s) => s.name), ["Primary", "Secondary", "Danger", "Loading", "In A Form"]);
  assert.equal(b.stories[1].example, `<Button intent="secondary">Save changes</Button>`, "meta args + spread of Primary.args; fn() handlers dropped");
  assert.equal(b.stories[4].example, `<form className="space-y-4"> <Button>Save changes</Button> </form>`, "custom render keeps the composition");
  const t = by.TextField;
  assert.equal(t.exportName, "default");
  assert.deepEqual(t.stories.map((s) => s.name), ["Default", "With error"], "CSF2 Template.bind + storyName");
  assert.equal(t.stories[1].example, `<TextField label="Email" placeholder="you@example.com" error="That email is already taken" />`);
});

const store = new Store(mkdtempSync(join(tmpdir(), "designbase-repo-")));
const app = createApp(store, { auth: "local" });
const worker = startWorker(store, { pollMs: 50 });
after(async () => {
  await worker.stop();
  store.close();
});
const call = async (method: string, path: string, body?: unknown) => {
  const res = await app.request(path, { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: (res.headers.get("content-type") ?? "").includes("json") ? await res.json() : await res.text() };
};
const waitFor = async (id: string) => {
  for (let i = 0; i < 400; i++) {
    const { body } = await call("GET", `/v1/jobs/${id}`);
    if (["done", "failed"].includes(body.status)) return body;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("timeout");
};

test("scan → review → apply: briefs import the team's components and lint enforces them", { timeout: 120_000 }, async () => {
  const pb = (await call("POST", "/v1/playbooks", { name: "Acme" })).body;
  assert.equal((await call("POST", `/v1/playbooks/${pb.id}/sources`, { repo: REPO })).status, 201);
  const done = await waitFor((await call("POST", `/v1/playbooks/${pb.id}/scan`)).body.id);
  assert.equal(done.status, "done", done.error);
  assert.equal(done.result.components.length, 6);

  const open = (await call("GET", `/v1/playbooks/${pb.id}/proposals?status=open`)).body.proposals;
  await call("POST", `/v1/playbooks/${pb.id}/proposals/accept`, { minConfidence: 0.8 });
  for (const p of open.filter((p: { kind: string }) => p.kind === "component")) await call("POST", `/v1/proposals/${p.id}/review`, { decision: "accept" });
  assert.equal((await call("POST", `/v1/playbooks/${pb.id}/apply`, { message: "From repo" })).status, 201);

  const head = (await call("GET", `/v1/playbooks/${pb.id}/versions/head`)).body.content;
  const button = head.components.find((c: { name: string }) => c.name === "Button");
  assert.equal(button.origin, "repo");
  assert.equal(button.importPath, "@/components/ui/button");

  const brief = (await call("POST", `/v1/playbooks/${pb.id}/brief`, { task: "settings card with a save button" })).body;
  assert.match(brief, /import \{ Button \} from "@\/components\/ui\/button"/);
  assert.match(brief, /import \{ Card, CardHeader, CardTitle, CardContent \} from "@\/components\/ui\/card"/);

  const bad = (await call("POST", `/v1/playbooks/${pb.id}/check`, { code: `<form><input className="border" /><button className="bg-blue-500">Save</button></form>` })).body;
  const msgs = bad.violations.map((v: { message: string }) => v.message).join("\n");
  assert.match(msgs, /Raw <button> — use <Button>/);
  assert.match(msgs, /Raw <input> — use <Input>/);
  const good = (await call("POST", `/v1/playbooks/${pb.id}/check`, { code: `<Card><Input /><Button className="bg-primary text-primary-foreground">Save</Button></Card>` })).body;
  assert.equal(good.passed, true, good.report);
});

test("discovery reuses the repo's components instead of generating new ones", { timeout: 120_000 }, async () => {
  const pb = (await call("GET", "/v1/playbooks")).body.playbooks.find((p: { name: string }) => p.name === "Acme");
  store.addSource(pb.id, "url", { uri: resolve("playbook/exemplars/settings.html") });
  store.enqueue("discover", { playbookId: pb.id }, pb.id);
  // Pause the API worker's claim by running discovery directly with a synthesizer that must not be called for reused kinds.
  const job = store.claimJob()!;
  const built: string[] = [];
  const result = await runDiscovery(store, job, async ({ candidate }) => {
    built.push(candidate.kind);
    throw new Error("stub");
  });
  const reused = Object.fromEntries(result.reused.map((r) => [r.candidate.split("×")[0], r.component]));
  assert.equal(reused.button, "Button");
  assert.equal(reused.input, "Input");
  assert.ok(!built.includes("button") && !built.includes("input"), "never asked the model to build what exists");
});

test("v3 repo end to end: briefs show Storybook states and the no-shadows rule is dropped", { timeout: 120_000 }, async () => {
  const pb = (await call("POST", "/v1/playbooks", { name: "Legacy" })).body;
  await call("POST", `/v1/playbooks/${pb.id}/sources`, { repo: REPO_V3 });
  const done = await waitFor((await call("POST", `/v1/playbooks/${pb.id}/scan`)).body.id);
  assert.equal(done.status, "done", done.error);
  assert.deepEqual(done.result.tailwindConfigs, ["tailwind.config.js"]);
  assert.equal(done.result.stories, 7);
  const open = (await call("GET", `/v1/playbooks/${pb.id}/proposals?status=open`)).body.proposals;
  assert.ok(!open.some((p: { key: string }) => p.key === "no-shadows"), "config declares shadows");
  await call("POST", `/v1/playbooks/${pb.id}/proposals/accept`, { minConfidence: 0.8 });
  for (const p of open.filter((p: { kind: string }) => p.kind === "component")) await call("POST", `/v1/proposals/${p.id}/review`, { decision: "accept" });
  assert.equal((await call("POST", `/v1/playbooks/${pb.id}/apply`, { message: "From repo" })).status, 201);
  const head = (await call("GET", `/v1/playbooks/${pb.id}/versions/head`)).body.content;
  const button = head.components.find((c: { name: string }) => c.name === "Button");
  assert.equal(button.stories.length, 5);
  assert.equal(button.example, `<Button intent="primary">Save changes</Button>`);
  const brief = (await call("POST", `/v1/playbooks/${pb.id}/brief`, { task: "form with a save button" })).body;
  assert.match(brief, /Approved states \(Storybook\): Primary, Secondary, Danger, Loading, In A Form/);
  assert.match(brief, /- Danger: `<Button intent="danger">Delete project<\/Button>`/);
  assert.match(brief, /import \{ Button \} from "~\/components\/Button"/);
});

test("tsconfig comments are stripped without breaking strings", async () => {
  const { stripJsonc } = await import("../src/designer/repo.ts");
  const src = `{\n  // aliases\n  "compilerOptions": { /* note */ "baseUrl": "https://x.dev/a//b", "paths": { "@/*": ["./src/*"], }, },\n}`;
  assert.deepEqual(JSON.parse(stripJsonc(src)).compilerOptions.paths, { "@/*": ["./src/*"] });
  assert.equal(JSON.parse(stripJsonc(src)).compilerOptions.baseUrl, "https://x.dev/a//b");
});
