import { readFileSync, existsSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import type { Playbook } from "./playbook.ts";
import { formatViolations, lintSource, scoreViolations, type Violation } from "./lint.ts";
import { visualCheck } from "./visual.ts";

export interface CheckResult {
  target: string;
  mode: "lint" | "visual";
  violations: Violation[];
  score: number;
  passed: boolean;
  screenshots: { viewport: string; path: string }[];
  report: string;
}

const LINTABLE = new Set([".tsx", ".jsx", ".ts", ".js", ".vue", ".svelte", ".astro"]);

export const isRenderable = (target: string) => /^https?:\/\//.test(target) || [".html", ".htm"].includes(extname(target));

export async function check(pb: Playbook, target: { code?: string; path?: string; url?: string }): Promise<CheckResult> {
  if (target.code !== undefined) return finish("inline code", "lint", lintSource(pb, target.code), []);

  const where = target.url ?? target.path;
  if (!where) throw new Error("check needs code, path or url");

  if (isRenderable(where)) {
    if (!target.url && !existsSync(where)) throw new Error(`No such file: ${where}`);
    const v = await visualCheck(pb, where);
    return finish(where, "visual", v.violations, v.screenshots, `Measured ${v.elementsMeasured} elements at 1280px; screenshots at 375/768/1280px.`);
  }

  if (!existsSync(where)) throw new Error(`No such file: ${where}`);
  if (!LINTABLE.has(extname(where))) throw new Error(`Don't know how to check ${extname(where)} files (lint: ${[...LINTABLE].join(" ")}; render: .html or a URL)`);
  const isComponentSource = !relative(resolve(pb.root, "components"), resolve(where)).startsWith("..");
  return finish(where, "lint", lintSource(pb, readFileSync(where, "utf8"), { isComponentSource }), []);
}

function finish(target: string, mode: CheckResult["mode"], violations: Violation[], screenshots: CheckResult["screenshots"], note?: string): CheckResult {
  const passed = !violations.some((v) => v.severity === "error");
  const report = [formatViolations(violations, target), note].filter(Boolean).join("\n");
  return { target, mode, violations, score: scoreViolations(violations), passed, screenshots, report };
}
