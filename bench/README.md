# designbase benchmarks

Three benchmarks. **ExtractBench** (below) measures the designer agent's extraction. The other two share one harness, one task set and one scorer:

1. **DesignBench (model leaderboard).** How well does each model follow a product's design system *on its own*? Every model gets the same 10 UI tasks with either screenshots of approved screens or the whole design system pasted in, and is scored the same way. Suite: `models`.
2. **designbase uplift.** How much does designbase improve each model? The same models also run with the designbase brief and with the full check→fix loop. Suite: `tool`, a superset of `models`, so results are shared.

## Conditions

| id | What the model gets |
|---|---|
| `A-screenshot` | Task + screenshots of two approved screens (`assets/*.png`). Today's "paste a Figma screenshot" workflow. Vision models only. |
| `B-dump` | Task + the entire playbook in the system prompt, like a DESIGN.md or a rules file. |
| `C-brief` | Task + designbase `get_brief`: only the rules, tokens, pattern and components this task needs. |
| `D-loop` | C, then designbase `check` (lint + rendered measurement) feeds violations back to the model. Up to 3 fix rounds, the same loop the Claude Code hook runs. |

Every model is asked for one React + TypeScript + Tailwind file with a default export. Tasks are in `tasks.json`.

## Scoring (per output)

| Signal | How |
|---|---|
| **Lint** (0–100) | `src/lint.ts` on the source: off-palette colours, arbitrary values, off-scale spacing/type/radius, shadows, gradients, generic fonts, hand-rolled controls, heading order, alt text. 100 − 3/error − 1/warning. |
| **Render** | The file is bundled with React and the real playbook components (esbuild), Tailwind compiles it with the playbook tokens *added to* Tailwind's defaults (so off-system classes still render and get caught), and it's loaded in headless Chromium. Unknown imports (icons, chart libs) become stubs. A crash or empty page = render failure. |
| **Visual** (0–100) | `src/visual.ts` measures every element's computed style at 1280px against the tokens, plus contrast and 375px overflow. 100 − 6 per distinct error. 0 if it didn't render. |
| **Judge** (1–10) | A vision model compares the rendered screenshot with the approved exemplar for "does this belong to the same product". Optional. |
| **Composite** | 35% lint + 35% visual + 30% judge, or 50/50 lint/visual without a judge. |

*Passes* = renders with zero error-level violations in both lint and the rendered check.

## Running

Model ids are `<provider>:<model>`. Providers: `openrouter` (one key for Claude, GPT, Grok, Qwen, Kimi, GLM…), `gemini`, `groq`, `nvidia`. Set the matching `*_API_KEY` env vars. The runner checks each key first and skips providers whose key is missing or rejected.

```bash
npm run bench:run -- --suite models --dry-run
```

```bash
npm run bench:run -- --suite tool
```

```bash
npm run bench:report
```

Useful flags: `--models gemini:gemini-4-argon,groq:openai/gpt-oss-120b`, `--tasks 01-dashboard,03-login`, `--conditions C-brief,D-loop`, `--judge none`, `--concurrency 2`, `--force` (re-run cached jobs). The roster, judge and fix-round limit are in `config.json`.

Results are cached per job in `runs/<model>/<condition>/<task>/`: `final.tsx`, `result.json`, `report.txt`, `transcript.json`, plus `screenshot.png` (git-ignored). Re-running only does missing or errored jobs. `npm run bench:report` writes `results/leaderboard.md`, `results/uplift.md` and `results/results.json`.

**Phase 0 pass bar:** in the uplift table, D − A ≥ +30 composite and D's judge score ≥ A's + 1, with C > B.

## Manual runs (coding agents)

To benchmark an agent such as Claude Code or Cursor rather than a raw model, generate the exact prompts with `npm run bench:prompt -- <condition> <task-id>`, run each in a fresh session, and save outputs under `runs/<agent-name>/<condition>/<task>/output.tsx`. A scorer for hand-collected runs is a TODO.

## Caveats

- One playbook (Almanac) and one stack (React + Tailwind). Results say nothing yet about other systems or frameworks.
- The A condition is penalised by the `use-components` rule because screenshots can't tell a model which components exist. That's the real-world gap being measured, but read A's lint score with that in mind.
- An LLM judge favours its own model family. Use a judge from a family not under test, or average two.
- Free-tier keys hit rate limits (Groq: 8k tokens/min, too small for the D loop; Gemini: daily quota). Run with `--concurrency 1`, or use paid keys for a full run.

## ExtractBench: extraction accuracy

*How close is what the designer agent extracts to the truth?* It runs the deterministic stages (measure → synthesize → discover components) with no model calls, so it's free and reproducible.

```bash
npm run bench:extract
```

Options: `--cases almanac,synth-3,primer` and `--seeds 8`.

| Case | Truth | World |
|---|---|---|
| `almanac` | The hand-written playbook, on its two exemplar pages | closed |
| `synth-1…N` | Seeded random design systems (light/dark, 4/8px base, type ratio 1.2–1.33, sharp/soft/round corners, with/without shadows, different fonts) rendered into a dashboard and a settings page. The generator records every token it used and marks each component instance with `data-truth` (read only by the scorer). | closed |
| `primer` | GitHub's Primer: real `@primer/css` on pages built from its shipped classes, scored against the published `@primer/primitives` tokens | open (precision only) |

Each case runs twice: from the **live page** (all tokens and components) and from a **screenshot** only (colours).

| Metric | How |
|---|---|
| Colours | One-to-one match at CIEDE2000 ΔE ≤ 3: precision, recall, F1; plus role accuracy (is `background`/`text`/`accent`/`border` the right colour?) |
| Spacing, type, radius | Exact value match (type ±0.5px): precision, recall, F1; body size; pill and shadow presence |
| Fonts | Family set F1 |
| Components | A candidate is labelled with the truth component most of its instances overlap (box IoU ≥ 0.6). Recall, precision, and variant recall (colour treatments found vs used) |

It writes `results/extractbench.md` (gates, per-case tables, and a "what was missed" list) and `results/extractbench.json`.

**Gates** (closed-world averages, from ROADMAP Phase 4/5): URL colour F1 ≥ 0.95, spacing F1 ≥ 0.90, type F1 ≥ 0.90, screenshot colour F1 ≥ 0.85, component recall ≥ 0.80.
