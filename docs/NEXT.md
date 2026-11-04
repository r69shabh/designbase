# designbase — what's next

*4 Nov 2026. Follows [ROADMAP.md](ROADMAP.md) (phases 1–7, the core build). This document covers what comes after and around it: the next horizons for the backend, modeling and benchmarking; how consistency is actually guaranteed; what others are shipping; and an open list of what we're still missing. It's meant to keep growing. Every horizon ends by pointing at the next one.*

---

## 1. Where we are (honest status)

| Area | State | Evidence |
|---|---|---|
| Engine (brief, lint, render, visual check) | ✅ working | 22 tests; off-brand fixtures fail, exemplars pass |
| Playbook format, store, versions | ✅ | DTCG 2025.10 round-trip, semantic diffs |
| AI layer | ✅ | 4 providers, fallback past dead keys; validated output |
| Designer: foundations | ✅ on live pages; 🟡 on screenshots | Exact colours, spacing base, fonts and type on Almanac; screenshots give colours only |
| Designer: components | ✅ discovery + build + verify on live pages | Live run (free NVIDIA model): 5/6 components passed at 82–98; Card 68 |
| API + jobs | ✅ | End-to-end test: extract → review → apply → brief → check |
| Benchmarks | 🟡 partial | Free-tier models only. Text-in-prompt conditions score 82–98, the check loop lifts every model to 95–100 in 1–2 rounds. **The headline comparison (screenshot vs designbase) isn't measured yet**: it needs a vision model with a working key. |

The partial benchmark already says something important: once a model has the design system **as text**, it follows it well, and the check loop closes most of what's left. The real gap is getting the system into text in the first place, which is the designer agent's job. So the product's value sits at both ends: **extraction** (no one has to write the playbook) and **enforcement** (nothing ships off-system).

---

## 2. What others are building (Nov 2026) and what it means for us

| Who | What they shipped | Implication |
|---|---|---|
| **Figma** | Config 2026: Figma Agent with Skills, Connectors and MCP, visible-to-team agent conversations, Code Layers, Motion, 20+ new MCP integrations ([recap](https://forum.figma.com/product-updates-3/everything-announced-at-config-2026-55221), [TechRadar](https://www.techradar.com/pro/figma-is-making-its-ai-agents-smarter-and-more-connected-to-help-boost-your-designs)). On-canvas Design Agent applies your library (May 2026). | Figma owns "design inside Figma with your library". We win on **teams whose truth is the shipped product and code, not a clean Figma file**, and on **enforcement in code**, which Figma doesn't do. Be a first-class *Figma connector and MCP peer*, not a competitor to the canvas. |
| **v0 / Lovable / Bolt / Replit** | Design-system support is mostly a "Knowledge" text field per project; Bolt and v0 import Figma and screenshots; v0 is tied to shadcn ([comparison](https://annaarteeva.substack.com/p/design-systems-lovable-bolt-v0-and), [2026 roundup](https://toolhalla.ai/blog/bolt-new-vs-lovable-vs-replit-vs-v0-2026)). | Their consistency is "paste rules and hope". designbase can **feed** them (export a brief, DESIGN.md or knowledge block) and **check** what they produce. That's a distribution channel, not a threat. |
| **Impeccable and other design-review CI gates** | Render changed routes at desktop and mobile in CI and check token usage, spacing and colour ([overview](https://doop.design/blog/ai-design-review-tools-mcp)). | **Direct overlap with our check.** Our edge has to be: (1) the playbook is *learned*, not hand-configured; (2) the check runs *inside the agent loop*, not after the PR; (3) component substitution and pattern conformance, not only tokens. Ship the CI gate anyway: it's expected. |
| **Supernova / Knapsack / Builder.io** | Design-system MCP servers; Supernova's Editor MCP lets agents *write* to the system. | Enterprise DS teams are covered. We stay focused on teams without a DS team, and on the learning loop. |
| **Moda** ($7.5M seed) | Learns a brand from existing materials for decks and marketing assets. | Same "learn from what exists" thesis, applied to marketing. Product UI is open. Marketing surfaces are a later expansion. |
| **Design Arena, WebDev Arena, UI-Bench** | Public leaderboards for *taste*: pairwise human votes on generated UI ([Design Arena](https://www.designarena.ai), [WebDev Arena](https://arena.ai/blog/webdev-arena), [UI-Bench](https://arxiv.org/abs/2508.20410v2)). | Nobody measures **adherence to *your* system**. DesignBench fills that gap, and publishing it is cheap marketing with real signal. |

---

## 3. How designbase keeps design consistent

Consistency isn't one feature. It's a stack of defences, each catching what the one before missed. Today we have layers 1–5 and partial 8. The rest are planned below.

```
 1. Source of truth      versioned playbook (tokens + components + patterns + rules + voice), pinned per project
 2. Context              get_brief: only what this task needs, with exact component APIs
 3. Constrained output   Tailwind theme with defaults removed, so off-system classes don't compile   ← exists as export, not enforced yet
 4. In-loop check        lint + rendered measurement after every edit (Claude Code hook) → agent fixes in the same turn
 5. Rendered verify      real render at 3 widths: tokens, contrast, overflow
 6. Composition check    does the page follow its pattern? are components used as documented?        ← missing
 7. Cross-screen check   do screens built at different times look like the same product?             ← missing
 8. Gate                 CI check on PRs, blocking errors                                               ← missing
 9. Drift watch          re-crawl the live product weekly, diff against the playbook                    ← missing
10. Learning             every rejection and edit becomes a rule, voice line or example                 ← Phase 7
```

The principle behind all of it: **values are measured, never guessed; rules are checked, never only stated; every failure produces a specific fix.**

---

## 4. Horizon A: finish the core (next ~4–6 weeks)

From ROADMAP phases 4–7, in priority order:

1. **Screenshot parity.** Spacing, type and radius from screenshots (text-line detection, whitespace runs, corner sampling) and component detection on screenshots (VLM boxes + crop-embedding clustering). Many users only have screenshots.
2. **Patterns (5.5).** Classify page layouts, store skeleton plus rhythm, attach exemplars. This is needed for layer 6.
3. **Typed component APIs in briefs (5.6).** Briefs show `propSpecs` and one usage example per component. This fixes the misuse seen in the benchmark.
4. **`/generate` (6.2).** Task → brief → model → check → fix loop as a service: the benchmark's D condition, productized.
5. **Judge calibration (6.3).** About 100 human ratings, pick the judge with the best agreement, and report agreement next to every judge score.
6. **Learning loop (7.x).** Reviews and edits become taste memory, drift analysis and re-extraction diffs.

**Exit:** a team points designbase at their product URL and, with no hand-writing, gets a playbook whose generated screens pass the check and score ≥ 8/10 with the calibrated judge.

Next: Horizon B makes this trustworthy at scale.

---

## 5. Horizon B: benchmarking program (continuous, starting now)

Benchmarks are the product's conscience. Four of them, all run nightly or per release, and all versioned.

### B1. DesignBench, the public model leaderboard
*Question: which models follow a product's design system best?*
- **Run the full suite:** 17+ models × 4 conditions × 10 tasks, with a judge. Blocked on a working OpenRouter key.
- **More playbooks:** add 3 deliberately different systems (dense dark enterprise, playful rounded consumer, brutalist editorial) so results aren't Almanac-shaped. Add 1–2 public systems (for example Primer, Carbon) rebuilt as playbooks.
- **More tasks:** 30, with 10 held out and never published, to stop overfitting.
- **Agents, not only models:** run Claude Code, Cursor, Codex and v0 as harnesses (manual-run scorer for collected outputs).
- **Report** cost per passing screen and latency, not only scores.
- **Publish** a leaderboard page and refresh it monthly. Positioning: *Design Arena measures taste; DesignBench measures discipline.*

### B2. designbase uplift, the product benchmark
*Question: how much better does each model get with designbase?*
- Same harness, conditions A–D, plus **E: designbase with an *extracted* playbook** (not hand-written). This is the honest end-to-end number.
- Track uplift per release. A regression in uplift blocks the release.

### B3. ExtractBench, extraction accuracy ✅ v1 built (`npm run bench:extract`)
*v1 results: 13 cases (Almanac, 8 seeded synthetic systems, and 4 real published systems: GitHub Primer, Bootstrap 5, Bulma 1, IBM Carbon). All five gates pass. Live-page colour F1 99, spacing 99, type 100, component recall 100, and **role naming 100% on every case**. Screenshot colour F1 97, screenshot roles 92%. On the real systems, colour precision is 100% (live and screenshot) and component recall 100%. The only off-scale values reported are ones the libraries' own CSS uses (Primer 3/5/15px, Bootstrap 12px, Carbon 14px). Next truth sets: Polaris, Radix Themes, Material, and real product pages with hand-labelled truth.*

*Question: how close is the learned playbook to the truth?*
- **Ground truth:** (a) our playbooks rendered to about 20 screens each, where truth is exact; (b) open design systems with published token files and docs sites (Primer, Carbon, Atlassian, Polaris, Radix Themes, Material), where truth comes from their token JSON.
- **Metrics:** colour F1 at ΔE₀₀ < 3, role accuracy, spacing-scale F1, type-scale error, radius and shadow accuracy, **component recall** (true components found), and **component fidelity** (render-and-compare score).
- Split by source type (URL vs screenshot) and by model.

### B4. Self-benchmarks (us)
- **Regression suite in CI:** golden extractions with cached model responses, so it's deterministic and free.
- **Judge-vs-human agreement**, tracked over time.
- **Cost:** dollars per extraction, per component and per generated screen. Latency p50/p95 per job type.
- **Reviewer acceptance rate:** the share of proposals accepted unchanged. This is the truest product metric.

Next: B1–B4 produce the data that Horizon C trains on.

---

## 6. Horizon C: modeling (from prompting to owning models)

Today everything is prompting frontier models. Over time, the data we generate lets us own the parts that matter most.

| # | What | Why | Data source we already produce |
|---|---|---|---|
| C1 | **Eval-driven model routing.** Per-task policy (interpret, build component, generate, judge) chosen by benchmark results and cost, not by hand. | Cheapest model that passes the bar. | B1–B4 |
| C2 | **Prompt registry and A/B.** Versioned prompts, every call tagged, offline comparison on cached inputs. | Safe iteration. | Response cache |
| C3 | **Embedding retrieval.** Components, patterns and exemplars embedded, so `get_brief` and `find_component` use semantic search. | Keyword matching breaks on real vocabularies. | Playbooks |
| C4 | **Fine-tuned small judge.** Train on human ratings plus pairwise preferences. Research shows small fine-tuned judges close a large part of the gap to human agreement ([Design Crit summary](https://www.besthub.dev/articles/can-ai-really-judge-good-design-findings-from-the-design-crit-study-251cb83bc8e8)). | Cheaper, calibrated, ours. | B4 ratings, reviews |
| C5 | **Synthetic training data from our renderer.** Render playbooks × components × variants × layouts into labelled screenshots with exact boxes, names and token values. | Train our own UI detector and token reader for screenshot-only sources, avoiding AGPL detectors. | `src/render.ts` + playbooks, unlimited |
| C6 | **Component-builder distillation.** Each verified build is a (measured description → code, score) pair. Fine-tune a small model to write components in one shot. | Cost and speed; the verify loop becomes a safety net, not a crutch. | Discovery jobs |
| C7 | **Per-workspace taste model.** Preference learning from accept, reject and edit decisions (pairwise → reward model), used to rank generations and proposals. | "Learns *your* taste" stops being a slogan. | Phase 7 reviews |
| C8 | **Local and private mode.** Open-weight models via NVIDIA, Groq or local runtimes, for teams that can't send screens out. | Enterprise and privacy. | — |

Next: owned models need the backend of Horizon D to serve them.

---

## 7. Horizon D: backend for real users

| # | Item | Notes |
|---|---|---|
| D1 | **Postgres + object storage** behind the existing `Store` interface | SQLite stays for local mode |
| D2 | **Separate worker pool** with per-workspace concurrency and budgets | Discovery jobs are long and model-heavy |
| D3 | **Sandboxed rendering** | We render *model-written code* in Chromium. Hosted, that's untrusted code: isolate it (container or VM per job, no network except fonts, CPU and time limits). **Security-critical before any hosted launch.** |
| D4 | **Prompt-injection defence for crawled pages** | A crawled site can contain text addressed to our interpreter. Treat page text as data: strip it from prompts where possible, quote and delimit it where not, and never let it trigger actions. |
| D5 | **Crawl guardrails** | Hosted crawling only on domains the workspace has verified, so designbase doesn't become a "clone a competitor's design system" tool. |
| D6 | Auth: OAuth and SSO, org/team roles, scoped keys | — |
| D7 | OpenAPI spec, generated TypeScript SDK, webhooks (job done, proposal created, drift found) | — |
| D8 | Observability: traces per job, cost dashboards, alerting | — |
| D9 | Data retention, encryption at rest, export and delete, then SOC 2 groundwork | — |

Next: with a safe backend, the deferred surfaces (Horizon E) can ship.

---

## 8. Horizon E: surfaces (deferred until the core is proven)

- **MCP server v2:** a thin client of the API (hosted, OAuth), with `get_brief`, `check`, `generate`, `find_component` and `propose_component`.
- **Hooks and gates:** Claude Code and Cursor hooks, a GitHub App that runs the CI check on PRs with inline comments, and a pre-commit hook.
- **Connectors:** Figma (variables, styles and components in; write-back of proposals as a library), GitHub repo scan (Tailwind config, CSS vars, existing components), Storybook.
- **Web app:** review queue (the heart of it: source crop vs render side by side), playbook library, version diffs, generation playground, drift dashboard, public playbook gallery, and the DesignBench leaderboard page.
- **Exports for other builders:** a one-click knowledge block for v0, Lovable and Bolt, a DESIGN.md, Cursor rules and a Tailwind preset.

Next: everything below is where we go once these are live.

---

## 9. What we're missing: the open list

None of these is scheduled yet. Each one is real, and each will become a horizon item when its turn comes. Roughly ordered by how much they'd hurt us if a customer hit them today.

**Coverage of the design system**
1. ✅ *v1 built: repo scan (React/TSX, cva, forwardRef, shadcn patterns, CSS-variable tokens); discovery reuses existing components. Tailwind v3 configs, Storybook CSF stories and tailwind-variants added 4 Nov. Storybook rendering (images, measured tokens, drift) and approved looks (controls must match a rendered story; briefs describe each state) added 4 Nov. Story images to agents over MCP (briefs, components, failed checks) and a store-backed MCP server added 4 Nov. Hover, focus and disabled states captured and compared added 4 Nov. Next: Vue/Svelte, pressed/invalid states (hover/focus/disabled), approved looks for layout components, GitHub connector for hosted mode.* **Existing component libraries.** Most teams *already have* `Button` in their repo (shadcn, MUI, Chakra, their own). designbase should index their real components (repo scan or Storybook) and **prefer them over generating new ones**, mapping discovered UI to existing code. *Probably the single biggest gap for real adoption.*
2. **Interaction states:** hover, focus, active, disabled, loading, error and empty. Extraction sees only resting state; Playwright can trigger hover and focus and diff the styles.
3. **Responsive behaviour:** we measure at one width. Measure at 3–4 widths to learn breakpoints, stacking rules and mobile spacing.
4. **Theming and modes:** dark mode, multiple brands, density modes. DTCG 2025.10 has a Resolver module for this; extract light and dark from `prefers-color-scheme`.
5. **Layout grid and composition:** columns, max widths, alignment rules, plus a pattern-conformance check (layer 6).
6. **Motion:** durations, easings and transitions as tokens; Figma is pushing motion hard.
7. **Iconography and illustration:** detect the icon set, stroke width and size scale, and lint mixed icon sets.
8. **Data visualisation:** chart palettes, axis styles and gridlines; dashboards are a top use case.
9. **Content and voice:** microcopy rules (sentence case, verbs on buttons, no exclamation marks) as checkable lint, not only prose.
10. **Accessibility beyond contrast:** focus visibility, keyboard order, ARIA roles, target sizes.

**Reach**

11. **Non-Tailwind codebases:** CSS Modules, styled-components, vanilla CSS, design-token CSS variables. The linter is Tailwind-shaped today; the rendered check isn't.
12. **Other frameworks:** Vue, Svelte, React Native, SwiftUI, Flutter, for briefs, component output and lint.
13. **Non-UI surfaces:** emails, slides, social and marketing pages (Moda's territory), as a later expansion.

**Product loop**

14. **Token-change codemods:** when a token is renamed or a component API changes, open a PR that migrates the code.
15. **Adoption and debt analytics:** where off-system code lives, what's re-invented, and the trend over time (Omlet-like, but fed by our checks).
16. **Distinctiveness, not just consistency:** practitioners say AI tools are "good at consistency, bad at distinctiveness". Add an explore mode: on-brand variations that push the system without breaking it, with the judge scoring novelty *and* adherence.
17. **Designer collaboration:** comments on proposals, assignment, approval rules ("tokens auto-accept ≥ 0.9; components need a designer").
18. **Playbook marketplace and gallery:** start from a public playbook, fork it, publish yours. (Inspired-by aesthetics only; no clones of other companies' systems.)

**Trust and business**

19. **Ethics guardrail on extraction** (D5): only your own products in hosted mode.
20. **Pricing and packaging:** free local and open-source core (engine + local MCP), paid hosted extraction, components, generation, CI gate and team review. Decide before the web app.

When the list runs low, the next places to look are the benchmark failure clusters (B1–B4), reviewer rejection reasons (Phase 7 data) and drift reports (layer 9). Those three keep refilling this list.

---

## 10. The next three moves

1. **Unblock the headline number.** Renew the OpenRouter key (or Gemini billing) and run `npm run bench:run -- --suite tool` with a judge. That gives the screenshot-vs-designbase comparison for frontier models and a first public DesignBench table.
2. **Build ExtractBench (B3)** with Primer and Carbon as the first public truth sets, then finish screenshot parity and patterns against it.
3. **Start missing #1, existing component libraries:** a repo scan that maps a team's real components into the playbook, so designbase works with what teams already have.

## Decisions that are yours

- **Open-source the core** (engine + local MCP + DesignBench) now, or later?
- **First design partner:** which real product do we extract first (yours, or 2–3 friendly startups)?
- **Publish DesignBench** publicly once the full run exists?
- **Budget** for model spend on benchmarks (the full run is about $35–100 per pass)?
