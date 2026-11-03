# designbase — product exploration & plan

*Draft, 3 Nov 2026. Updated 3 Nov 2026: Phase 0 built. **The detailed, phase-wise build plan for the core system (engine, backend, AI layer, designer agent) is in [ROADMAP.md](ROADMAP.md).** This document keeps the market research and product framing.*

## 1. The problem, stated precisely

"AI is bad at design" is really three separate failures:

1. **Context failure.** The model never sees the system. A screenshot is lossy: it gives no exact spacing, token names, component boundaries, states, or responsive behavior, so the model guesses.
2. **Adherence failure.** The model sees the system but drifts anyway. Long playbooks get diluted in context, it reaches for its defaults (Tailwind blue, rounded-xl cards, Inter), and it invents a new button instead of reusing yours.
3. **No feedback loop.** Nothing checks the output against the playbook. The model never finds out it was wrong, and neither do you until you review it by eye.

Almost everyone in the market works on #1. **#2 and #3 are the open space.** That is the wedge.

## 2. Landscape (late 2026)

| Category | Players | What they do | What they don't do |
|---|---|---|---|
| Design-tool MCP | **Figma Dev Mode MCP** (+ Code Connect, design-system rules file) | Gives agents exact node data, variables, and component mappings from Figma | Needs a paid Figma Dev seat and a well-built Figma file. Read-only context with no checking afterwards |
| Design-system platforms with MCP | **Supernova** (read + write Editor MCP), **Knapsack**, **Builder.io MCP**, **zeroheight** | Serve the documented system (tokens, docs, components) to Cursor, Claude Code, and Copilot | Built for enterprise DS teams that already *have* a mature system. Expensive. Docs-centric |
| Component registries | **shadcn registry/MCP**, **21st.dev Magic MCP**, **Storybook MCP** | Let agents pull real, installable components | Generic components, or only your Storybook. No notion of a "playbook" |
| AI app/UI builders | **v0**, **Lovable** (Design Systems, Aesthetics), **Google Stitch** (DESIGN.md), **Figma Make**, **Claude Design**, Magic Patterns, Subframe, UX Pilot | Generate UI with some brand or system input. Lovable and Stitch can extract a system from screenshots and Figma | Locked to their own builder. Consistency holds within a project, not across your tools |
| Design → code | Anima, Locofy, Builder Visual Copilot | Convert Figma frames to code | One-shot conversion. No reusable system, no agent loop |
| Tokens | Tokens Studio, Style Dictionary | Token pipelines | Tokens only, not composition or "taste" |

**Takeaways**

- "Design system → MCP" is now table stakes. Figma, Supernova, Knapsack, and Builder all have it, so **don't compete on just serving tokens over MCP.**
- Stitch's `DESIGN.md` and Figma's rules file show the industry settling on *a plain-text manifest that agents read*. That helps, but it's still advisory: the agent can ignore it.
- Every builder (Lovable, v0, Stitch) has its own walled-garden design system. Users who switch between Cursor, Claude Code, v0, and Lovable have **no portable playbook**. designbase can be that neutral layer.
- Enterprise tools assume a mature DS team. **Indie devs, small startups, and solo designers** have Figma files and screenshots but no formal system, and nothing serves them well.

## 3. Positioning

> **designbase turns your designs into a playbook that AI agents actually obey, and checks their work.**

- **Extract:** from Figma, screenshots, live URLs, or an existing codebase, produce tokens, components, patterns, and rules.
- **Serve:** over MCP, give agents *only what the current task needs*, not the whole book.
- **Enforce:** render what the agent built, compare it to the playbook, and send back specific fixes. Loop until it passes.

The third part is the moat. Nobody closes the loop today.

## 4. Core concepts (the data model)

The "playbook" needs more than tokens. Tokens are where most products stop, which is why output is on-palette but still looks wrong.

```
Playbook
├── Foundations      tokens: color, type scale, spacing, radius, shadow, motion, breakpoints
├── Components       name, anatomy (slots), variants, states, props, code (per framework),
│                    reference render (PNG), usage rules, do/don't examples
├── Patterns         compositions: "settings page", "empty state", "pricing table", "auth form"
│                    each = layout skeleton + which components + spacing rhythm + examples
├── Rules            machine-checkable constraints, e.g.
│                    - only tokens for color/spacing (no raw hex, no arbitrary px)
│                    - max 1 primary button per view
│                    - headings follow scale H1→H3, never skip
│                    - cards use radius.md, never radius.xl
│                    - min contrast 4.5:1
├── Voice & taste    prose: density, mood, "we prefer whitespace over dividers", reference shots
└── Exemplars        approved full screens: the "gold set" agents imitate
```

Every rule should, where possible, be **checkable**: written as a lint (AST/CSS) or a visual assertion, not only prose. Prose rules get ignored; checkable ones get enforced.

## 5. Feature set

### A. Ingest / extract (how a playbook gets built)
1. **Figma import** (REST API + plugin): variables → tokens, components/variants → component specs, frames → exemplars. Map to code via Code Connect if present.
2. **Screenshot / image import.** A vision model segments the screen into a component tree with bounding boxes, then clusters repeats across screenshots into components ("these 14 boxes are the same Card"). It infers tokens from pixel sampling and snaps them to a scale. **This is the core flow for your own workflow (screenshot → paste).**
3. **URL import:** crawl a live site, read computed styles from the DOM. This is far more accurate than pixels.
4. **Codebase import:** scan Tailwind config, CSS variables, the React component library, and Storybook.
5. **Human review step.** Extraction is never 100%, so give users a fast "confirm / merge / rename / reject" UI. That's where trust is built.

### B. Library (the website)
- Browse the playbook: tokens, components with live renders, patterns, and rules.
- Component editor: tweak variants, see code for React/Vue/SwiftUI/HTML+Tailwind.
- Version history with a diff ("v1.3 changed primary from #2B59FF → #1F4BEB").
- Multiple playbooks per account (client work, brands), plus forking public ones.
- **Public gallery:** a community of shareable playbooks ("Linear-ish", "brutalist editorial"). This drives growth and doubles as onboarding for people with no designs yet. *(Inspired-by aesthetics only, no copies of other brands' systems.)*

### C. Serve (MCP server + other channels)
MCP tools exposed to the agent:

| Tool | Purpose |
|---|---|
| `get_brief(task)` | **The key one.** Given "build a settings page", return only the relevant tokens, components, the matching pattern, 1–2 exemplars, and the applicable rules. Small, focused context beats a 40-page dump. |
| `find_component(query)` | Semantic search: "something to show a status" → `Badge` |
| `get_component(name, framework)` | Spec + code + reference image |
| `get_tokens(format)` | CSS vars / Tailwind config / JSON |
| `check(code \| url \| screenshot)` | **Lint + visual review** → list of violations with fixes |
| `propose_component(...)` | Agent suggests a new component when nothing fits; a human approves it on the web |

Also export static files for non-MCP tools: `DESIGN.md`, `.cursor/rules`, `CLAUDE.md` snippets, a Tailwind preset, and a shadcn-compatible registry. Being the neutral source that feeds *every* tool, including Lovable, v0, and Stitch, is the portability pitch.

### D. Enforce (the differentiator)
1. **Static lint:** parse the generated JSX/CSS. Flag raw hex, off-scale spacing, unknown components, a hand-rolled `<button>` where `<Button>` exists, and banned patterns. Cheap, fast, deterministic.
2. **Visual check:** render the output headlessly (Playwright), screenshot it at 3 breakpoints, then:
   - measure actual spacing, colors, and type from the DOM vs. tokens
   - a vision model compares the result with the exemplars and the pattern ("hierarchy is weaker", "3 competing CTAs")
   - accessibility (axe) and contrast
3. **Score + fix list** returned to the agent in a form it can act on: `"Card at line 42 uses p-5 (20px); spacing scale allows 16 or 24 → use p-6"`.
4. **Loop:** the agent fixes the issues and calls `check` again, up to N rounds. Ship as a Claude Code hook / Cursor rule so it runs automatically after UI edits.
5. **Drift dashboard:** over time, which rules are violated most and which components get re-invented. Feed this back to the playbook ("agents keep building a stat tile, so add one").

### E. Generate (later)
An on-site canvas: "design a billing page in my playbook". It generates *from components* (composition, not pixels), and the user can hit "send to Figma" or "copy code". This is where you meet Stitch and Lovable head-on, so do it only after enforce is strong.

## 6. Architecture sketch

```
            ┌──────────── Web app (Next.js) ───────────┐
            │ Library · Review/merge UI · Gallery ·    │
            │ Drift dashboard · Canvas (later)         │
            └───────────────┬──────────────────────────┘
                            │ API
┌──────────┐   ┌────────────▼────────────┐   ┌─────────────────┐
│ Ingest   │──▶│ Playbook store          │◀──│ MCP server      │◀── Claude Code /
│ workers  │   │ Postgres (specs, rules) │   │ (remote, OAuth) │    Cursor / Copilot…
│ Figma ·  │   │ pgvector (embeddings of │   └────────┬────────┘
│ vision · │   │ components, patterns)   │            │ check()
│ DOM ·    │   │ Object store (renders,  │   ┌────────▼────────┐
│ code     │   │ exemplars)              │   │ Checker         │
└──────────┘   └─────────────────────────┘   │ AST lint +      │
                                             │ Playwright render│
                                             │ + vision judge  │
                                             └─────────────────┘
```

- **Stack:** TypeScript end to end. Next.js web app, Postgres + pgvector, a queue for ingest jobs, Playwright workers for rendering, and the MCP TypeScript SDK (streamable HTTP, OAuth) for the remote server. A local `npx designbase` server handles offline use and private code.
- **Models:** a vision-capable LLM for screenshot segmentation and visual judging, and embeddings for `find_component` and `get_brief` retrieval. Plain code for everything deterministic. Don't use an LLM where a parser works.
- **Canonical format:** define an open JSON schema for the playbook (build on the W3C Design Tokens format for foundations). Open-sourcing the spec and the local MCP server builds trust and adoption, and the hosted extraction, checking, and collaboration are what you charge for.

## 7. Roadmap

**Phase 0: Prove the thesis (2–3 weeks).** Before building the website, check that enforcement actually improves output.
- [x] Hand-write one playbook (JSON + exemplars). *Done with a sample system ("Almanac") so the harness could be built and tested; swap in a playbook from your own Figma designs before running the benchmark.*
- [x] Build a tiny local MCP server with `get_brief` + `check`. *Done: `get_brief`, `find_component`, `get_component`, `get_tokens`, `check`, `list_rules`. `check` = static lint (13 rules) + Playwright render at 3 breakpoints with computed-style measurement against tokens (colour, font, type scale, spacing, radius, shadow, contrast, overflow) + screenshots returned to the agent.*
- [x] Make the check impossible to skip. *Done: a Claude Code PostToolUse hook (`designbase hook`) lints every edited `.tsx`/`.jsx` file and sends violations back to the agent.*
- [ ] Vision critique. *Deferred: for now the calling agent reviews its own screenshots against the voice. Add a dedicated judge only if the benchmark shows lint + self-review leaves a visible quality gap.*
- [x] Benchmark harness: 10 UI tasks × {A screenshot-only, B full dump, C designbase brief, D brief + check loop}. See `bench/README.md`.
- [x] **Two benchmarks on one harness.** *Built: an automated runner that calls models through OpenRouter, Gemini, Groq or NVIDIA. Every output is linted, rendered for real (esbuild + React + Tailwind + Chromium), measured against tokens and optionally judged by a vision model.*
  - **DesignBench (model leaderboard):** every model's native adherence to a design system (conditions A and B). This is also a marketing asset: a public "which model follows design systems best" leaderboard.
  - **designbase uplift:** the same models with C and D, giving the per-model gain from the tool.
- [ ] **Run the benchmark** and record results in `bench/results.md`. Pass bar: D beats A by ≥ 30 mean lint points and ≥ 1 mean rating point; C beats B. **If the loop doesn't clearly win, rethink before going further.**

What Phase 0 already taught us:
- Visual measurement catches things lint can't: it flagged a real contrast failure in the sample palette itself (`ink-3` on `paper-2` was 4.48:1), which was fixed in the tokens.
- Measured checks need heuristics to avoid false positives: `margin: 0 auto` centring and text on gradients are now skipped.
- Every rule needs a concrete fix ("`p-5` → `p-4` (16px) or `p-6` (24px)"), not only a description. Agents act on fixes; they argue with descriptions.

**Phase 1: MVP (6–8 weeks).**
- Ingest from screenshots and Figma (tokens + components), with the review/merge UI.
- Library website: tokens, components, rules, exemplars.
- Hosted MCP server with all the tools above, plus `DESIGN.md` / Cursor-rules export.
- Claude Code hook that runs `check` after UI file edits.
- React + Tailwind only.

**Phase 2: Stickiness.**
- URL and codebase ingest, patterns as first-class objects, the drift dashboard.
- Team workspaces, versioning, and approval of agent-proposed components.
- More frameworks (Vue, SwiftUI, React Native).

**Phase 3: Expansion.**
- Generation canvas, write-back to Figma, and a public playbook gallery.
- CI integration: a GitHub check that runs `check` on PRs touching UI, so design review becomes part of code review.

## 8. Risks & honest unknowns

- **Figma could ship this.** It already has the MCP server and a rules file. Defenses: be tool-neutral (screenshots, URLs, code, not only Figma), own the *enforcement loop*, and serve people without a Figma Dev seat.
- **Screenshot extraction quality.** Vision segmentation is still noisy. The human review UI is mandatory, not optional, and URL/DOM ingest is more reliable, so push users toward it when possible.
- **Visual judging is subjective and costly.** Lead with deterministic checks, use the vision judge as a second pass, and cache renders.
- **Agents may ignore the `check` tool.** Ship hooks (Claude Code hooks, Cursor rules, CI) that run it automatically instead of relying on the agent to call it.
- **Market:** enterprise DS teams buy Supernova and Knapsack. Your likely early users are indie devs, small startups, and freelance designers who pay less but adopt faster. Pick one; I'd start with **small product teams and solo builders using Claude Code / Cursor**.

## 9. Open questions for you

1. Who's user #1: you (designer who codes), dev teams without designers, or design-system teams?
2. Open-source core (spec + local MCP) or fully hosted?
3. Is the website mainly a *library/manager* (Supernova-like) or a *design canvas* (Stitch-like)? I recommend library first, canvas later.
4. ~~Name check~~ — settled: **designbase**.

## Sources
- [Figma: design systems, AI & MCP](https://www.figma.com/blog/design-systems-ai-mcp/) · [Figma MCP server guide](https://github.com/figma/mcp-server-guide) · [Figma: MCP vs agent](https://developers.figma.com/docs/figma-mcp-server/mcp-vs-agent)
- [Supernova: design system MCP servers](https://www.supernova.io/blog/design-system-mcp-servers) · [Supernova Editor MCP](https://www.supernova.io/blog/introducing-supernova-editor-mcp)
- [Knapsack MCP server](https://www.knapsack.cloud/blog/knapsacks-mcp-server-turns-design-systems-into-production-engines) · [Builder.io MCP](https://www.builder.io/c/docs/builder-mcp)
- [Google Stitch DESIGN.md](https://www.mindstudio.ai/blog/what-is-google-stitch-design-md-file) · [Stitch review](https://designproject.io/blog/google-stitch-review/)
- [Lovable design systems](https://www.createwith.com/tool/lovable/updates/lovable-design-systems-bring-brand-consistency-to-every-paid-plan) · [Lovable Aesthetics](https://www.createwith.com/tool/lovable/updates/lovable-launches-aesthetics-to-give-users-more-control-over-design-output)
- [Claude Design vs Stitch vs v0 vs Lovable vs Figma Make (2026)](https://mcp.directory/blog/claude-design-vs-stitch-vs-v0-vs-lovable-vs-figma-make-2026) · [Best design MCP servers 2026](https://mcp.directory/blog/best-mcp-servers-for-design-2026)
