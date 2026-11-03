# Phase 0 benchmark

Does a focused brief plus a check loop make agents follow a playbook better than what people do today?

## Conditions

| id | What the agent gets | How |
|---|---|---|
| `A-screenshot` | Task + a screenshot of the exemplar | Attach `bench/assets/*.png` (run `npm run bench:shots`). This is today's "paste a Figma screenshot" workflow. |
| `B-dump` | Task + the whole playbook pasted in | `npm run bench:prompt -- B-dump <task-id>` |
| `C-brief` | Task + the `get_brief` output | `npm run bench:prompt -- C-brief <task-id>` |
| `D-loop` | designbase MCP server + PostToolUse hook; agent must call `get_brief` and pass `check` | `npm run bench:prompt -- D-loop <task-id>`, run in a project with `.mcp.json` and the hook from the main README |

Rules for a fair run:
- Same agent, same model, a fresh session for each task × condition.
- One prompt, no follow-up nudges from you (in D the hook's feedback is part of the condition).
- Ask for a single React + Tailwind file. Save it as `bench/runs/<condition>/<task-id>.tsx`.

## Scoring

```bash
npm run bench
```

Lints every file in `bench/runs/` and writes `bench/results.md`: errors, warnings and score per task and the mean per condition.

Lint measures adherence, not quality. Also rate each output 1–5 for "looks like it belongs in this product" (blind if you can: shuffle the files first) in `bench/ratings.json`:

```json
{ "A-screenshot": { "01-dashboard": 2 }, "D-loop": { "01-dashboard": 4 } }
```

`npm run bench` merges the ratings into the results table.

**Pass bar for Phase 0:** D beats A by ≥ 30 points of mean lint score *and* ≥ 1 point of mean rating, with C beating B. If not, rethink the approach before building the web app.
