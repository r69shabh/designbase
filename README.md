# designbase

An agent that learns your design language and writes the rules every other agent builds with.

## Problem

Coding agents can now generate entire UIs in seconds, but the output always looks generic - agents have no sense of your design language, because that knowledge sits in Figma files and designers' heads, nowhere an agent can read it. Teams without a designer get inconsistent, templated-looking products, and teams with one can't make agents follow their system.

Pasting a Figma screenshot into the chat doesn't fix it. "AI is bad at design" is really three failures:

1. **Context:** the agent never sees the system. A screenshot has no token names, exact spacing or component boundaries.
2. **Adherence:** it sees the system and drifts anyway, back to Tailwind blue, `rounded-xl` and Inter.
3. **No feedback:** nothing checks the output, so the agent never learns it was wrong.

Most tools in this space (Figma's MCP server, Supernova, Knapsack) work on #1. designbase is built around #2 and #3: give the agent **only what the task needs**, then **check its work against the playbook and make it fix what's off**. Market research and the full plan are in [docs/PLAN.md](docs/PLAN.md).

## Target users

- Indie developers and early-stage founders building with coding agents who have no designer
- Designers and design-led teams who want agents to produce on-brand UI without reviewing every screen by hand

## Status: Phase 0 (proving the thesis)

Phase 0 is a local MCP server, a hand-written sample playbook and a benchmark. It exists to answer one question before anything else gets built: **does a focused brief plus a check loop make agents follow a playbook measurably better than pasting a screenshot?**

| Piece | What it does |
|---|---|
| [`playbook/`](playbook) | **Almanac**, a sample editorial paper-and-ink system: tokens, voice, 15 rules, 9 React + Tailwind components, 4 layout patterns, 2 exemplar screens. Swap in your own. |
| `get_brief` | Picks the matching pattern and the components a task needs and returns them with the rules and tokens: a focused brief, not a 40-page dump. |
| `check` (lint) | Static lint of `.tsx`/`.jsx`: Tailwind default colours, raw hex, arbitrary values, off-scale spacing/type/radius, shadows, gradients, generic fonts, hand-rolled `<button>`/`<input>`/`<table>`, multiple primary buttons, heading order, missing alt text. Each error comes with a concrete fix (`p-5 → p-4 (16px) or p-6 (24px)`). |
| `check` (visual) | Renders an `.html` file or a dev-server URL in headless Chromium at 375/768/1280px, measures the computed style of every element against the tokens (colours, fonts, type scale, spacing, radius, shadows, WCAG contrast, horizontal overflow), and returns screenshots for the agent to review against the playbook voice. |
| Claude Code hook | Runs `check` automatically after every UI file edit and sends violations back to Claude, so the agent can't skip it. |
| [`bench/`](bench) | 10 tasks × 4 conditions (screenshot / full dump / brief / brief + check loop), a prompt generator and a scorer. |

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

## Running the benchmark

See [bench/README.md](bench/README.md). In short: run each task in a fresh agent session under each condition, save outputs to `bench/runs/<condition>/<task>.tsx`, rate them 1–5, then:

```bash
npm run bench
```

**Phase 0 passes** if the brief + check loop beats the screenshot workflow by ≥ 30 points of mean lint score and ≥ 1 point of mean human rating.

## Known limits (Phase 0)

- React + Tailwind only for lint. The visual check works on any rendered page but needs an `.html` file or a running dev server, since it doesn't build TSX itself.
- `get_brief` uses keyword matching with a synonym list, not embeddings.
- The visual check measures the declared font family, not whether the webfont actually loaded.
- There's no vision-model judge yet: the calling agent reviews its own screenshots against the voice. A dedicated judge comes after the benchmark shows whether it's needed.
- Playbooks are hand-written. Extracting them from Figma, screenshots, URLs and codebases is Phase 1.

## Project layout

```
src/        playbook loader, brief builder, linter, visual checker, MCP server, CLI + hook
playbook/   Almanac sample playbook
examples/   on- and off-brand samples, Claude Code hook config
bench/      tasks, prompt generator, screenshot assets, scorer, runs/
test/       node:test suite (lint, brief, visual, hook)
docs/       product plan and market research
```
