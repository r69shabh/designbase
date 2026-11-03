# designbase

An agent that learns your design language and writes the rules every other agent builds with.

## Problem

Coding agents can now generate entire UIs in seconds, but the output always looks generic - agents have no sense of your design language, because that knowledge sits in Figma files and designers' heads, nowhere an agent can read it. Teams without a designer get inconsistent, templated-looking products, and teams with one can't make agents follow their system.

Pasting a Figma screenshot into the chat doesn't fix it. "AI is bad at design" is really three failures:

1. **Context:** the agent never sees the system. A screenshot has no token names, exact spacing or component boundaries.
2. **Adherence:** it sees the system and drifts anyway, back to Tailwind blue, `rounded-xl` and Inter.
3. **No feedback:** nothing checks the output, so the agent never learns it was wrong.

Most tools in this space (Figma's MCP server, Supernova, Knapsack) work on #1. designbase is built around #2 and #3: give the agent **only what the task needs**, then **check its work against the playbook and make it fix what's off**. Market research is in [docs/PLAN.md](docs/PLAN.md); the phase-wise build plan is in [docs/ROADMAP.md](docs/ROADMAP.md), and what comes after it (benchmarking, modeling, backend, consistency model, open gaps) is in [docs/NEXT.md](docs/NEXT.md).

## Target users

- Indie developers and early-stage founders building with coding agents who have no designer
- Designers and design-led teams who want agents to produce on-brand UI without reviewing every screen by hand

## Status

Phase 0 (thesis harness and benchmarks) is done. The core system is being built, following [docs/ROADMAP.md](docs/ROADMAP.md): playbook format, store, AI layer, backend API and the **designer agent**, which learns a playbook from your shipped product. The MCP server v2, connectors (Figma, GitHub) and the web app come after.

### Core system (new)

```
sources ──▶ designer agent ──▶ proposals ──▶ review ──▶ playbook versions ──▶ engine (brief · lint · render · check)
            measure → synthesize → interpret                 DTCG tokens + components + rules + voice
```

| Piece | Where | What it does |
|---|---|---|
| Playbook format v1 | `src/core/` | Zod schema. Tokens are stored as **DTCG 2025.10**, plus components (with typed props and the raw elements they replace), patterns, rules, voice and exemplars. Content-hashed immutable versions with semantic diffs (`token color.accent: #B8401A → #C2410C`). |
| Store | `src/store/` | `node:sqlite`, with no native deps: workspaces, hashed API keys, playbooks, versions, content-addressed assets, sources, a durable job queue (leases survive restarts), observations, proposals and reviews. |
| AI layer | `src/ai/` | One client for OpenRouter, Gemini, Groq and NVIDIA. A model policy with automatic fallback past dead keys and quotas, zod-validated structured output with a repair round, and a response cache. |
| Designer agent v1 | `src/designer/` | **Measures** live pages (computed styles of every element) and screenshots (exact colours from the pixel histogram), **synthesizes** colour roles, spacing base and scale, type scale, fonts, radii, shadows and rules, then **interprets** with a vision model (semantic names, voice, components seen). Every token is a proposal with confidence and evidence. Values never come from the model. |
| Designer agent v2: components | `src/designer/discover*.ts`, `components.ts` | **Discovers** components on live pages by clustering DOM subtrees by shape (text and colour ignored). Containers like cards are grouped by their shell; colour treatments of one shape become **variants** (primary, secondary, danger…). Each instance is described in the playbook's own token vocabulary (`button "New invoice" [bg:accent radius:md px:4 text:paper size:base]`). A model **writes** a typed React + Tailwind component from that description, then it's **verified**: linted, rendered at the source width, and compared with the source crop for size, colours and token conformance. Specific feedback goes back for up to 3 rounds. Verified components arrive as proposals with source and render images. |
| Repo scan: your existing components | `src/designer/repo*.ts`, `scan-job.ts` | Points at your codebase and finds the components you **already have**: name, import path (from your tsconfig aliases), typed props, `cva` variants and defaults, the raw element each one stands in for (`asChild ? Slot : "button"`, `forwardRef<HTMLTableElement>`, `ComponentProps<"input">`), sub-parts (Card → CardHeader, CardTitle…), what it's built on (`CheckboxPrimitive.Root`), and how many files import it. It also reads declared tokens (CSS variables in `:root` and `@theme`, oklch/hsl/hex, `calc()` radii, dark theme) and the Tailwind scales your components use. Static analysis only, nothing executed. Briefs then say `import { Button } from "@/components/ui/button"`, lint flags a raw `<button>` with "use <Button>", and component discovery **reuses** these instead of generating new ones. Tested on shadcn/ui's own registry (~60 components). |
| API | `src/api/` | Hono REST API with an in-process worker. See below. |

On Almanac's own pages, extraction recovers every colour exactly, the 4px spacing base with its scale, all three font families, and the type sizes the pages use. The vision model named the colours (`background`, `accent`, `text-muted`, `success`, `danger`…) and wrote voice bullets close to the hand-written ones.

### Phase 0 pieces

| Piece | What it does |
|---|---|
| [`playbook/`](playbook) | **Almanac**, a sample editorial paper-and-ink system: tokens, voice, 15 rules, 9 React + Tailwind components, 4 layout patterns, 2 exemplar screens. Swap in your own. |
| `get_brief` | Picks the matching pattern and the components a task needs and returns them with the rules and tokens: a focused brief, not a 40-page dump. |
| `check` (lint) | Static lint of `.tsx`/`.jsx`: Tailwind default colours, raw hex, arbitrary values, off-scale spacing/type/radius, shadows, gradients, generic fonts, hand-rolled `<button>`/`<input>`/`<table>`, multiple primary buttons, heading order, missing alt text. Each error comes with a concrete fix (`p-5 → p-4 (16px) or p-6 (24px)`). |
| `check` (visual) | Renders an `.html` file or a dev-server URL in headless Chromium at 375/768/1280px, measures the computed style of every element against the tokens (colours, fonts, type scale, spacing, radius, shadows, WCAG contrast, horizontal overflow), and returns screenshots for the agent to review against the playbook voice. |
| Claude Code hook | Runs `check` automatically after every UI file edit and sends violations back to Claude, so the agent can't skip it. |
| [`bench/`](bench) | Automated multi-model benchmarks: a model leaderboard and a designbase-uplift table. 10 tasks × 4 conditions, every output rendered and scored. |

## Quick start

Requires Node 22+.

```bash
npm install
```

```bash
npx playwright install chromium --only-shell
```

Try it from the CLI:

```bash
npm run -s brief -- "invoice list with filters and a new-invoice button"
```

```bash
npm run -s check -- examples/off-brand.tsx examples/off-brand.html playbook/exemplars/dashboard.html
```

```bash
npm test
```

### Use it from Claude Code

Inside this repo, `.mcp.json` already registers the server. To use it from another project:

```bash
claude mcp add designbase -- npx --prefix "/path/to/designbase" tsx "/path/to/designbase/src/server.ts"
```

Then ask for UI as usual and tell the agent to call `get_brief` first and `check` before it finishes.

To enforce the check automatically, add the PostToolUse hook from [`examples/claude-code/settings.json`](examples/claude-code/settings.json) to your project's `.claude/settings.json` (quote the paths if they contain spaces). After every `Edit`/`Write` to a `.tsx`/`.jsx` file the hook lints it, and if anything breaks the playbook, Claude gets the list of violations and fixes them in the same turn.

Other MCP clients (Cursor, VS Code, Codex) take the same command: `npx tsx /path/to/designbase/src/server.ts`.

### MCP tools

| Tool | Use |
|---|---|
| `get_brief(task)` | Call first. Rules, tokens, matching pattern and components for one task. |
| `find_component(query)` | "something to show a status" → `Badge`. |
| `get_component(name)` | Full spec and source. |
| `get_tokens(format)` | `json`, `css`, `tailwind-v4` (an `@theme` that removes Tailwind's default palette so off-system classes don't compile), `tailwind-v3`. |
| `check(path \| url \| code)` | Lint source, or render and measure a page. Returns PASS/FAIL, a score, fixes, and screenshots for rendered checks. |
| `list_rules()` | Every rule with why and how to fix it. |

### Use your own playbook

Copy `playbook/` and edit it, then point designbase at it:

```bash
DESIGNBASE_PLAYBOOK=/path/to/my-playbook npm run -s brief -- "settings page"
```

| File | Contents |
|---|---|
| `tokens.json` | Colours (with roles), fonts, type scale, spacing scale (Tailwind key → px), radius, shadows, breakpoints |
| `voice.md` | The taste: how the system should feel, in plain bullets |
| `rules.json` | Rule ids, severity, why and fix text (the checks themselves live in `src/lint.ts` and `src/visual.ts`) |
| `components.json` + `components/*.tsx` | Component metadata (summary, keywords, props, do/don't) and source |
| `patterns.json` | Page-level compositions: which components, layout skeleton, spacing rhythm, exemplar |
| `exemplars/*.html` | Approved screens, rendered by the visual check and used as screenshot references |

## Benchmarks

Two automated benchmarks share one harness ([bench/README.md](bench/README.md)):

- **DesignBench, a model leaderboard:** every model gets the same 10 UI tasks with screenshots of approved screens or the whole design system pasted in, and is scored the same way.
- **designbase uplift:** the same models also run with the designbase brief and with the full check → fix loop, which shows how much the tool adds on top of each one.

Each output is linted, actually rendered (esbuild + React + Tailwind in headless Chromium), measured against the tokens, and optionally rated by a vision-model judge. Models are called through OpenRouter, Gemini, Groq or NVIDIA. Put the keys in your environment or a git-ignored `.env`.

```bash
npm run bench:run -- --suite tool --dry-run
```

```bash
npm run bench:run -- --suite tool
```

```bash
npm run bench:report
```

Results go to `bench/results/leaderboard.md` and `bench/results/uplift.md`.

**Phase 0 passes** if the check loop (D) beats the screenshot workflow (A) by ≥ 30 composite points and ≥ 1 judge point, with the brief (C) beating the full dump (B).

## Known limits

- React + Tailwind only for lint. The visual check works on any rendered page but needs an `.html` file or a running dev server, since it doesn't build TSX itself.
- `get_brief` uses keyword matching with a synonym list, not embeddings.
- The visual check measures the declared font family, not whether the webfont actually loaded.
- The MCP `check` tool has no vision-model judge yet: the calling agent reviews its own screenshots against the voice. The benchmark harness does have an optional judge.
- Component discovery needs live pages (URL sources). Screenshot-only sources give exact colours but no spacing, type scale or components yet. Page patterns (layouts) aren't extracted yet.
- Repo scan reads CSS-variable and `@theme` tokens. A Tailwind v3 `tailwind.config.js` theme isn't parsed yet, and Vue/Svelte files aren't scanned. Dark-theme colours are captured but stored aside until playbooks support modes. Repo components aren't rendered for visual checks, because that needs your app's own dependencies; check your running dev server by URL instead.
- The MCP server still reads a playbook directory. Moving it onto the API is a later phase.

## Running the API

```bash
npm run serve
```

It listens on `http://localhost:4141`. Local mode needs no key; set `DESIGNBASE_AUTH=keys` to require `Authorization: Bearer dbk_…`. Data lives in `.designbase/data` (override with `DESIGNBASE_DATA`). Model keys come from the environment or `.env`.

| Route | Purpose |
|---|---|
| `POST /v1/playbooks` | Create a playbook (optionally with `content`) |
| `POST /v1/playbooks/:id/sources` | Add a `{ "url": … }` or upload screenshots (multipart `file`) |
| `POST /v1/playbooks/:id/extract` | Start the designer agent; returns a job |
| `GET /v1/jobs/:id/events` | Live progress (SSE) |
| `GET /v1/playbooks/:id/proposals?status=open` | What the agent proposes, with confidence and evidence |
| `POST /v1/proposals/:pid/review` | `{ "decision": "accept" \| "reject", "edited"?: …, "note"?: … }` |
| `POST /v1/playbooks/:id/proposals/accept` | Accept everything above `{ "minConfidence": 0.8 }` |
| `POST /v1/playbooks/:id/sources` `{ "repo": "/path" }` then `POST /v1/playbooks/:id/scan` | Scan your codebase for existing components and declared tokens (local mode) |
| `POST /v1/playbooks/:id/discover` | Discover and build components (needs applied foundations); returns a job |
| `GET /v1/assets/:hash` | Source crops and renders attached to component proposals |
| `POST /v1/playbooks/:id/apply` | Commit accepted proposals as a new version |
| `GET /v1/playbooks/:id/versions`, `/diff?from=&to=` | History and semantic diffs |
| `GET /v1/playbooks/:id/tokens?format=dtcg\|css\|tailwind-v4\|tailwind-v3` | Export tokens |
| `POST /v1/playbooks/:id/brief` | `{ "task": … }` → design brief |
| `POST /v1/playbooks/:id/check` | `{ "code" }` or `{ "url" }` → violations, score, fixes |
| `POST /v1/keys` | Create an API key for the workspace |

A full run against a live site:

```bash
PB=$(curl -s -X POST localhost:4141/v1/playbooks -H 'content-type: application/json' -d '{"name":"My product"}' | jq -r .id)
curl -s -X POST localhost:4141/v1/playbooks/$PB/sources -H 'content-type: application/json' -d '{"url":"https://example.com"}'
JOB=$(curl -s -X POST localhost:4141/v1/playbooks/$PB/extract | jq -r .id)
curl -N localhost:4141/v1/jobs/$JOB/events
curl -s "localhost:4141/v1/playbooks/$PB/proposals?status=open" | jq '.proposals[] | {key, confidence}'
```

## Project layout

```
src/core/      playbook schema v1, DTCG io, versioning + diff, materialize
src/store/     SQLite store: playbooks, versions, assets, jobs, proposals, reviews
src/ai/        model client, policy + fallbacks, structured output, cache
src/designer/  designer agent: measure, synthesize, interpret, extract/apply, discover + build components
src/api/       Hono API, worker, server
src/*.ts       engine: brief, lint, render, visual check, MCP server, CLI + hook
playbook/   Almanac sample playbook
examples/   on- and off-brand samples, Claude Code hook config
bench/      model client, renderer, scorer, runner, reports, tasks, runs/, results/
test/       node:test suite (lint, brief, visual, hook, store, API end to end, discovery)
docs/       market research (PLAN.md) and phase-wise build plan (ROADMAP.md)
```
