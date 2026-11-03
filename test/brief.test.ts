import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBrief, selectForTask } from "../src/brief.ts";
import { loadPlaybook } from "../src/playbook.ts";

const pb = loadPlaybook();

test("tasks map to the right pattern", () => {
  assert.equal(selectForTask(pb, "sign-in screen with email and password").pattern?.name, "Auth form");
  assert.equal(selectForTask(pb, "main dashboard with revenue KPIs").pattern?.name, "Dashboard overview");
  assert.equal(selectForTask(pb, "workspace preferences and profile").pattern?.name, "Settings page");
  assert.equal(selectForTask(pb, "customers page with no customers yet").pattern?.name, "List with empty state");
});

test("a brief includes the pattern's components and always Button", () => {
  const { components } = selectForTask(pb, "login");
  const names = components.map((c) => c.name);
  assert.ok(names.includes("Field") && names.includes("Button"));
  assert.ok(!names.includes("StatTile"));
});

test("a brief is much smaller than the full playbook", () => {
  const brief = buildBrief(pb, "login");
  const full = pb.components.map((c) => c.code).join("").length;
  assert.ok(brief.includes("## Hard rules"));
  assert.ok(brief.length < full + 8000);
});
