# designbase — build roadmap

*3 Nov 2026. **Progress:** Phase 1 core ✅ (schema, DTCG, versions, store) · Phase 2 API ✅ (all routes below except `/generate`; OpenAPI doc and CLI pending) · Phase 3 AI layer ✅ (Anthropic-direct provider and prompt registry pending) · Phase 4 designer v1 🟡 (URL + screenshot measurement, synthesis, VLM interpretation, proposals/review/apply done; screenshot spacing/type, verify stage and the public extraction benchmark pending) · Phase 5 designer v2 🟡 (5.1 URL discovery, 5.3 synthesis, 5.4 render-and-compare loop, 5.7 `replaces` → lint done; 5.2 screenshot discovery, 5.5 patterns, 5.6 typed APIs in briefs pending). Scope: the core system first (engine, backend, AI layer, designer agent). The MCP server v2, connectors (Figma, GitHub, Storybook) and the web frontend come later and build on the API defined here.*

## 1. What the research changed

| Finding | Source | Consequence for the build |
|---|---|---|
| Figma shipped an on-canvas **Design Agent** (May 2026) that applies a team's components and variables when generating screens. Figma Make does the same for prototypes. | [Figma blog](https://www.figma.com/blog/the-figma-agent-is-here/), [designcompass](https://designcompass.org/en/2026/05-1tp-3tea/22/figma-design-agent-on-canvas/) | "Generate on-brand screens inside Figma" is taken. designbase's agent has to win where Figma can't reach: teams **without** a clean Figma library (it learns from shipped product, screenshots and code), and **every coding agent outside Figma** (Claude Code, Cursor, Codex). |
| **Reverse-engineering design systems** from screenshots and live sites with multimodal LLMs is on the Thoughtworks Radar (Assess, Apr 2026). Existing tools give *approximate* hex and spacing. | [Thoughtworks Radar](https://www.thoughtworks.com/radar/techniques/reverse-engineering-for-design-system), [HF Design Token Extractor](https://huggingface.co/spaces/nextussocial/DesignTokenExtractor/blame/main/README.md) | The idea is validated, and accuracy is the open problem. Use a **hybrid extractor**: deterministic measurement for values (DOM computed styles, pixel sampling) and the vision model only for *meaning* (roles, names, component boundaries, voice). Build an extraction accuracy benchmark from day one. |
| **DTCG Design Tokens Format 2025.10** is stable (a Community Group report, not a W3C standard), with Figma, Adobe and Atlassian participating. | [W3C announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), [Format Module](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/) | Store tokens natively as **DTCG JSON**. Import and export are then free with Tokens Studio, Style Dictionary and Figma variables. Components, patterns, rules and voice extend it as designbase-specific files. |
| UI parsing models such as **OmniParser** detect elements well, but the detector is AGPL. | [OmniParser overview](https://learnopencv.com/omniparser-vision-based-gui-agent/), [Replicate](https://replicate.com/microsoft/omniparser-v2) | Don't ship AGPL in the core. Use DOM structure for live sites, and frontier VLMs with bounding boxes for screenshots. Keep the detector pluggable. |
| VLM-as-judge agreement with designers is **mixed**: strong zero-shot on holistic aesthetics in one study, weak on diagnosis in others. Few-shot can *lower* agreement. | [MLLM as a UI Judge](https://arxiv.org/html/2510.08783v1), [VisJudge-Bench](https://arxiv.org/pdf/2510.22373), [HCII 2026 award](https://2026.hci.international/MOBILE-best-paper-award.html) | Keep deterministic checks as the backbone and the judge as one signal. Calibrate the judge against a small human-rated set before trusting it, and use a judge from a different family than the generator. |
| Design2Code found automatic metrics and human judgment disagree, and that models mostly fail at **layout and recall of elements**. | [Design2Code](https://arxiv.org/abs/2403.03163v3) | Measure layout separately (element bounding-box match against the source), not only colours and type. |
| **Moda** ($7.5M seed, Mar 2026) learns a brand from existing materials for decks and marketing assets. **Omlet** tracks React component adoption. | [Moda](https://www.citybiz.co/article/822682/moda-raises-7-5m/), [Omlet](https://postmake.io/tools/omlet) | "Learn the brand from what exists" is a funded pattern, but for marketing assets, not product UI. Adoption and drift analytics is a known need that designbase can serve from its check data. |
| Our Phase 0 benchmark (partial, free-tier models): with the full system as text, strong models already score 88–100. The brief and the check loop push them to ~100, and the loop fixes nearly everything in 1–2 rounds. Failures that remain are **component API misuse** (e.g. `DataTable` `render` signature). | `bench/results/` | The biggest gap is *not having the system as text at all* (the screenshot workflow), which is exactly what the designer agent fixes. Component specs need exact, typed APIs, not prose. |

## 2. System overview

```
                 ┌───────────────────────── designbase core ─────────────────────────┐
 sources         │                                                                    │   consumers (later)
 ─────────       │  ┌──────────────┐   proposals   ┌───────────┐   versions          │   ──────────────
 screenshots ───▶│  │  DESIGNER    │──────────────▶│ PLAYBOOK  │◀────────────┐       │   MCP server v2
 live URLs   ───▶│  │  AGENT       │               │ STORE     │             │       │   web app
 code repos  ───▶│  │ ingest →     │◀── feedback ──│ DTCG +    │   review    │       │   Figma plugin
 (Figma later)   │  │ measure →    │               │ components│   (accept / │       │   CI check
                 │  │ interpret →  │               │ patterns  │    edit /   │       │
                 │  │ synthesize → │               │ rules     │    reject)  │       │
                 │  │ verify       │               │ voice     │─────────────┘       │
                 │  └──────┬───────┘               └─────┬─────┘                     │
                 │         │ uses                        │ read by                   │
                 │  ┌──────▼───────┐               ┌─────▼─────────────────────┐     │
                 │  │  AI LAYER    │               │  ENGINE                   │     │
                 │  │ model router │◀──────────────│ brief · lint · render ·   │     │
                 │  │ structured   │               │ visual check · judge ·    │     │
                 │  │ output, evals│               │ generate (brief+loop)     │     │
                 │  └──────────────┘               └───────────────────────────┘     │
                 │                     HTTP API (Hono) + job queue + SQLite + files    │
                 └────────────────────────────────────────────────────────────────────┘
```

Four layers, each with one job:

1. **Engine** (exists from Phase 0, gets generalised): brief, lint, render, visual check, judge, generate-with-loop. Pure functions over a playbook. No I/O beyond the browser.
2. **Playbook store:** versioned playbooks in DTCG + designbase JSON, source assets, proposals and review state, feedback. SQLite (Node's built-in `node:sqlite`) plus a content-addressed file store. Moves to Postgres when hosted.
3. **AI layer:** one model router over OpenRouter, Gemini, Groq, NVIDIA and Anthropic. It handles structured output with zod validation and repair-retry, cost and latency accounting, prompt versioning and caching of responses by hash.
4. **Designer agent:** the product's brain. It turns sources into a playbook, keeps the playbook alive as the product changes, and generates on-brand UI through the engine.

### Monorepo shape (introduced in Phase 1)

```
src/
  core/       playbook schema (zod), DTCG io, versioning, diff
  engine/     brief, lint, render, visual, judge, generate      (moved from src/ + bench/lib)
  ai/         model router, providers, structured output, prompt registry
  designer/   ingest/, measure/, interpret/, synthesize/, verify/, learn/
  store/      sqlite schema + repositories, file store
  api/        Hono app, routes, auth, job runner
  cli/        designbase CLI (brief, check, extract, serve)
  mcp/        MCP server (thin client of engine/store; rewritten on the API later)
bench/        DesignBench + uplift + (new) extraction benchmark
```

One package for now. Split into workspaces only once the web app needs to import from it.

## 3. Data model

```
Workspace ─┬─ Playbook ─┬─ Version (immutable snapshot: tokens.json [DTCG], components, patterns, rules, voice, exemplars)
           │            ├─ Source (screenshot | url | repo | figma*) ── Asset (content-hashed file)
           │            ├─ ExtractionRun (job) ── Observation (measured fact + evidence)
           │            ├─ Proposal (add/change token | component | pattern | rule | voice) ── Review (accept/edit/reject + note)
           │            ├─ CheckRun (target, violations, score, screenshots)
           │            └─ Generation (task, transcript, rounds, final code, score)
           └─ ApiKey
* Figma comes with connectors, later.
```

Key design choices:

- **Every fact carries evidence.** An observation is "colour `#B8401A` on 14 elements, mostly as button background, in `sources/landing.png` at bbox (…)". Proposals cite observations, and reviews cite proposals. This is how users come to trust extraction, and how the agent learns which inferences get rejected.
- **Playbook versions are immutable**, with semantic diffs ("accent changed", "Card gained `variant`"). A coding agent can pin a version.
- **Rules become data.** Today's lint rules are hard-coded against Almanac's token names. Phase 1 makes each rule a typed config (`spacing-scale: { values: [...] }`, `use-components: { map: { button: "Button" } }`), so extracted playbooks get working checks automatically.
- **Components get typed APIs.** Each component has a props schema (name, type, required, description, example), source code, a reference render and usage notes. The benchmark showed agents misuse components when the API is prose.

## 4. Phases

Durations assume one developer working with Claude Code. Each phase ends with an **exit gate**, a measurable condition that must pass before the next phase starts.

---

### Phase 0: Thesis harness ✅ (done)

Local MCP server, Almanac sample playbook, linter, visual checker, Claude Code hook, and two automated benchmarks (model leaderboard, designbase uplift) with real rendering.

**Remaining:** the full benchmark run with a renewed OpenRouter key (screenshot condition, frontier models, judge).

---

### Phase 1: Core engine and data model (≈ 2 weeks)

**Goal:** a playbook format and engine that work for *any* design system, not only Almanac.

| # | Deliverable | Detail |
|---|---|---|
| 1.1 | Playbook schema v1 (zod) | `PlaybookVersion` = DTCG tokens + components (with typed props) + patterns + rules (typed configs) + voice + exemplars + metadata. JSON Schema exported for third parties. |
| 1.2 | DTCG import/export | Read and write DTCG 2025.10 (`$value`, `$type`, aliases `{color.ink}`, groups). Map semantic roles via `$extensions.designbase`. Export CSS vars, Tailwind v4 `@theme` and v3 config from DTCG. |
| 1.3 | Rules as data | Rewrite lint and visual rules to read their parameters from the playbook. Rule catalogue: palette, spacing scale, type scale, radius, shadows, gradients, fonts, component substitution map, primary-action limit, heading order, alt, contrast, overflow. |
| 1.4 | Versioning and diff | Content-hash versions, a semantic diff between versions, `parent` links. |
| 1.5 | Migrate Almanac | Almanac becomes a DTCG playbook and every existing test keeps passing. Add a second, very different sample playbook (dense, dark, sharp-cornered) to prove rules aren't Almanac-shaped. |
| 1.6 | Store | `node:sqlite` schema for workspace, playbook, version, source, asset, run, observation, proposal, review, check, generation. Content-addressed asset store on disk. |

**Exit gate:** both sample playbooks load, round-trip through DTCG unchanged, and lint plus visual-check their own exemplars clean. Off-brand fixtures fail both. Benchmark results reproduce within ±1 point.

---

### Phase 2: Backend API and job system (≈ 2 weeks)

**Goal:** everything the designer agent and future clients need, over HTTP.

| # | Deliverable | Detail |
|---|---|---|
| 2.1 | Hono API | `/v1/workspaces`, `/playbooks`, `/playbooks/:id/versions`, `/sources` (multipart upload or URL), `/extractions`, `/proposals` (+ `/review`), `/brief`, `/check`, `/generate`, `/jobs/:id` with SSE progress. OpenAPI document generated from the zod schemas. |
| 2.2 | Auth | Workspace API keys (hashed), scoped read/write. Local mode with no auth. |
| 2.3 | Job runner | Durable queue in SQLite (`jobs` table, leases, retries, cancellation), workers in-process for local and as a separate process when hosted. Long jobs (extraction, generation) stream progress events. |
| 2.4 | Asset pipeline | Upload, hash, dedupe, thumbnails, and screenshots of URL sources captured at 3 widths. |
| 2.5 | Observability | Structured logs, per-job cost and token accounting (from the AI layer), request tracing ids. |
| 2.6 | CLI on the API | `designbase serve`, `designbase extract <url|images…>`, `designbase review`, `designbase generate "<task>"`. |

**Exit gate:** API contract tests for every route. A job survives a server restart. A 10-image upload plus extraction job runs end to end through the API with live progress.

---

### Phase 3: AI layer (≈ 1 week, overlaps Phase 2)

**Goal:** model access the designer agent can depend on.

| # | Deliverable | Detail |
|---|---|---|
| 3.1 | Router | Providers: Anthropic (direct), OpenRouter, Gemini, Groq, NVIDIA. Per-task model policy in config ("vision-extract: claude-sonnet-5.5 → gemini-4-argon fallback"). Retries, rate-limit backoff, key checks (from the bench client). |
| 3.2 | Structured output | `generateObject(schema, messages)`: JSON mode or tool-call per provider, zod validation, one repair round with the validation errors, typed result. |
| 3.3 | Prompt registry | Prompts as versioned files with `{{vars}}`. Every call records prompt id and version for evals. |
| 3.4 | Cache | Response cache keyed by (model, prompt version, inputs hash). This makes re-runs and evals cheap. |
| 3.5 | Accounting | Tokens, cost and latency per call, rolled up per job and workspace. |

**Exit gate:** the same extraction prompt returns schema-valid output from at least 3 providers. Malformed output is repaired or rejected, never passed through.

---

### Phase 4: Designer agent v1, foundations extraction (≈ 3–4 weeks)

**Goal:** turn screenshots and live URLs into a correct *foundations* playbook (tokens, voice, rules) that a person can review in minutes.

Pipeline: **ingest → measure → interpret → synthesize → verify → propose**

| Stage | Live URL | Screenshot |
|---|---|---|
| **Measure** (deterministic) | Playwright crawl of the given pages at 3 widths. Collect computed styles for every visible element: colours (text, bg, border), font family, size, weight and line-height, padding, margin and gap, radius, shadow, plus element boxes and DOM paths. | Pixel analysis: colour quantisation (k-means in OKLab) with per-cluster area, exact hex from flat regions, text-region detection for type sizes (cap-height to px), edge and whitespace analysis for spacing rhythm and radii. |
| **Interpret** (VLM) | Name roles: which colour is background, primary text, accent, success… Spot the voice (density, flatness, alignment, typographic contrast). | Same, plus element bounding boxes and labels (button, card, input, nav, table) with structured output. Values come from *Measure*, not from the model. |
| **Synthesize** | Cluster observations into scales: snap spacing to the best-fitting base (4/8/…), derive the type scale (ratio fit), dedupe colours within ΔE₀₀ < 2, assign semantic names, write `voice.md`, and derive rules from absence (no shadows observed → `no-shadows`). | Same. |
| **Verify** | Re-render exemplars with the extracted tokens and compare them to the source: colour distance per role, type-size error, spacing-scale coverage. Low-confidence items get flagged. | Same against the screenshots. |
| **Propose** | Every token, rule and voice line becomes a proposal with confidence and evidence (crops, counts) for review. | Same. |

**Extraction benchmark (new, built first in this phase):**

- Ground truth: (a) the two sample playbooks rendered into ~20 screens each, where the true tokens are known exactly; (b) ~10 public open-source design systems whose docs sites are built from published tokens (for example Primer, Carbon, Atlassian, Radix themes), taken from their published token files.
- Metrics: colour recall/precision (match at ΔE₀₀ < 3), role accuracy, type-scale error (px), spacing-scale F1, radius and shadow presence accuracy, voice rated by the judge against the reference.
- Track per source type (URL vs screenshot).

**Exit gate:** on the extraction benchmark, URL sources reach colour F1 ≥ 0.95, spacing-scale F1 ≥ 0.9 and type-scale error ≤ 1px. Screenshot sources reach colour F1 ≥ 0.85 and spacing-scale F1 ≥ 0.75. A person reviewing a real product's extraction accepts ≥ 80% of proposals unchanged.

---

### Phase 5: Designer agent v2, components and patterns (≈ 3–4 weeks)

**Goal:** go from "the right colours" to "the right building blocks", meaning reusable components with real code, and page patterns.

| # | Deliverable | Detail |
|---|---|---|
| 5.1 | Component discovery (URL) | Structural signatures of DOM subtrees (tag shape + style tokens + size class). Cluster repeated subtrees across pages, so 14 similar boxes become one `Card` candidate, with variants found by differing style dimensions (primary/secondary button). |
| 5.2 | Component discovery (screenshot) | VLM detection with boxes, plus visual-embedding clustering of crops across screenshots. |
| 5.3 | Component synthesis | For each candidate, generate a typed React + Tailwind component (props schema, variants, states) that uses only playbook tokens. |
| 5.4 | Render-and-compare loop | Render the generated component next to its source crops and score it: layout box IoU, colour and type match from the visual checker, and judge similarity. Feed the differences back, up to N rounds. This is the extraction-side twin of the D-loop. |
| 5.5 | Patterns | Classify page layouts (dashboard, settings, list, detail, auth, marketing), derive skeleton and spacing rhythm, attach the source page as an exemplar. |
| 5.6 | Typed component API in briefs | Briefs include exact prop types and one usage example per component, fixing the misuse seen in the benchmark. |
| 5.7 | Lint rules from components | Auto-derive the `use-components` substitution map (raw `<button>` → `Button`) and variant rules from the discovered library. |

**Exit gate:** on the sample playbooks' rendered screens, ≥ 80% of true components are discovered, with generated components scoring ≥ 85 on render-and-compare. In the uplift benchmark, playbooks *extracted by the agent* deliver ≥ 80% of the uplift of the hand-written ones.

---

### Phase 6: Generation and enforcement service (≈ 2 weeks)

**Goal:** the engine as a service: any client (MCP, CI, web) can ask for briefs, checks and generated screens.

| # | Deliverable | Detail |
|---|---|---|
| 6.1 | `/check` | Lint plus rendered check for code, URL or uploaded HTML. Returns violations with fixes, scores and screenshots, and stores a `CheckRun`. |
| 6.2 | `/generate` | Task → brief → model → check → fix loop (D-loop) → final code, screenshot and score. Streams rounds. Model chosen by policy. |
| 6.3 | Judge, calibrated | Collect ~100 human ratings (you and 2–3 designers) on generated screens, choose the judge model and prompt with the best agreement (Spearman ρ), and report its agreement next to every judge score. |
| 6.4 | Layout check | Compare a generated page's element layout with its pattern skeleton (Design2Code-style box matching) to catch "right tokens, wrong composition". |

**Exit gate:** `/generate` produces a passing screen for ≥ 90% of benchmark tasks on 2+ models, with judge agreement ρ ≥ 0.6 against human ratings.

---

### Phase 7: Learning loop (≈ 2 weeks)

**Goal:** the agent gets better at *this* team's taste over time.

| # | Deliverable | Detail |
|---|---|---|
| 7.1 | Feedback capture | Every review (accept/edit/reject plus an optional note) and every human edit to a generated screen is stored with its context. |
| 7.2 | Taste memory | Distil feedback into playbook-level preferences ("prefers whitespace over dividers", "never use the accent for links"). These are proposals the user approves, then voice lines or rules. Retrieved into briefs and judge prompts. |
| 7.3 | Drift analysis | Aggregate check runs: which rules break most, which components get re-invented. Propose playbook changes, such as adding a `StatTile` because agents keep hand-building one. |
| 7.4 | Re-extraction | Re-run extraction on sources when they change (a URL re-crawled on a schedule) and propose diffs, not rewrites. |

**Exit gate:** after 20 reviews on a real product, a fresh extraction of new screens needs ≥ 30% fewer edits than the first run.

---

### Later (explicitly out of scope until Phase 7 ships)

- **MCP server v2** as a thin client of the API (hosted, OAuth), plus Claude Code, Cursor and Codex hooks.
- **Connectors:** Figma (REST variables, styles and components; plugin for write-back), GitHub (repo token and component scan, PR checks), Storybook.
- **Web app:** playbook library, review queue, generation playground, drift dashboard, public playbook gallery, and a DesignBench public leaderboard page.
- **Billing, teams, SSO.**

## 5. Cross-cutting

- **Testing:** unit tests per stage, contract tests for the API, golden-file tests for extraction (with a cached-model mode so tests are deterministic and free), and benchmarks as nightly jobs.
- **Evals as gates:** each phase's exit gate is a benchmark number recorded in `bench/results/`, never a vibe.
- **Cost control:** response cache, cheap models for interpretation drafts and strong ones for synthesis, and a per-job budget cap.
- **Privacy:** sources and assets stay local in local mode. Hosted mode encrypts assets at rest and never trains on customer data.
- **Licensing:** no AGPL dependencies in core.

## 6. Order of work, at a glance

```
Phase 1 core ──▶ Phase 2 API ──▶ Phase 4 designer v1 (foundations) ──▶ Phase 5 designer v2 (components) ──▶ Phase 6 service ──▶ Phase 7 learning
                 Phase 3 AI ──┘          ▲ extraction benchmark first
```
