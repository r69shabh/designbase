import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatViolations, lintSource, scoreViolations, type Violation } from "../../src/lint.ts";
import type { Playbook } from "../../src/playbook.ts";
import { visualCheck } from "../../src/visual.ts";
import { complete } from "./models.ts";
import { renderTsx } from "./render.ts";

export interface Score {
  lint: { score: number; errors: number; warnings: number; byRule: Record<string, number> };
  render: { ok: boolean; error?: string; stubbed: string[] };
  visual: { score: number; errorGroups: number; byRule: Record<string, number> } | null;
  judge: { score: number; reason: string; model: string } | null;
  composite: number;
  /** Combined lint + visual report, used as feedback in the D-loop condition. */
  report: string;
  passed: boolean;
  screenshot?: string;
}

const byRule = (vs: Violation[]) => vs.reduce<Record<string, number>>((m, v) => ((m[v.rule] = (m[v.rule] ?? 0) + (v.count ?? 1)), m), {});

/** Rendered violations are grouped (one per distinct off-token value), so they're weighted per group. */
const visualScore = (vs: Violation[]) =>
  Math.max(0, 100 - vs.filter((v) => v.severity === "error").length * 6 - vs.filter((v) => v.severity === "warn").length * 2);

export async function scoreFile(pb: Playbook, tsxPath: string, workDir: string, judgeModel?: string, exemplar?: string): Promise<Score> {
  const src = readFileSync(tsxPath, "utf8");
  const lintVs = lintSource(pb, src);
  const lint = {
    score: scoreViolations(lintVs),
    errors: lintVs.filter((v) => v.severity === "error").length,
    warnings: lintVs.filter((v) => v.severity === "warn").length,
    byRule: byRule(lintVs),
  };

  const render = await renderTsx(pb, tsxPath, join(workDir, "render"));
  let visual: Score["visual"] = null;
  let visualVs: Violation[] = [];
  let screenshot: string | undefined;
  if (render.ok) {
    const v = await visualCheck(pb, render.html!, join(workDir, "shots"));
    visualVs = v.violations;
    screenshot = v.screenshots.find((s) => s.viewport === "desktop")?.path;
    visual = { score: visualScore(visualVs), errorGroups: visualVs.filter((x) => x.severity === "error").length, byRule: byRule(visualVs) };
  }

  let judge: Score["judge"] = null;
  if (judgeModel && screenshot && exemplar) judge = await judgeScreenshot(pb, judgeModel, exemplar, screenshot);

  // A file that doesn't render scores 0 on the rendered half: it would ship broken.
  const v = visual?.score ?? 0;
  const composite = judge ? 0.35 * lint.score + 0.35 * v + 0.3 * judge.score * 10 : 0.5 * lint.score + 0.5 * v;

  const report = [
    formatViolations(lintVs, "source"),
    render.ok ? formatViolations(visualVs, "rendered page (1280px)") : `✗ The file does not render: ${render.error}`,
  ].join("\n\n");

  return {
    lint,
    render,
    visual,
    judge,
    composite: Math.round(composite * 10) / 10,
    report,
    passed: render.ok && ![...lintVs, ...visualVs].some((x) => x.severity === "error"),
    screenshot,
  };
}

async function judgeScreenshot(pb: Playbook, model: string, exemplar: string, screenshot: string): Promise<Score["judge"]> {
  const img = (p: string) => ({ type: "image_url" as const, image_url: { url: `data:image/png;base64,${readFileSync(p).toString("base64")}` } });
  try {
    const res = await complete(
      model,
      [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a strict design reviewer. Image 1 is an approved screen from a product's design system. Image 2 is a new screen built by an engineer for the same product.

Design voice:
${pb.voice}

Rate image 2 from 1 to 10 for how convincingly it belongs to the same product as image 1: typography, colour, spacing rhythm, surfaces/borders, density, hierarchy, and the voice above. 10 = indistinguishable from the design team's own work. 5 = same palette but generic layout and details. 1 = unrelated generic UI. Judge only visual design language, not features or content.

Reply with JSON only: {"score": <integer 1-10>, "reason": "<one sentence>"}`,
            },
            img(exemplar),
            img(screenshot),
          ],
        },
      ],
      { maxTokens: 2_000, temperature: 0 },
    );
    const json = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    const score = Math.min(10, Math.max(1, Math.round(Number(json.score))));
    return Number.isFinite(score) ? { score, reason: String(json.reason ?? ""), model } : null;
  } catch {
    return null;
  }
}
