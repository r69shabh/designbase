# DesignBench: model leaderboard

How well does each model follow a product's design system *on its own*, given either screenshots of approved screens (A) or the full design system pasted into the prompt (B)? Same 10 tasks, same playbook (Almanac), same scoring. Generated 2026-11-03.

Composite = 35% lint score + 35% rendered-visual score + 30% judge (1–10 → 0–100), or 50/50 lint/visual when no judge ran. A file that fails to render gets 0 on the visual half.

| # | Model | Composite | A: screenshot | B: full dump | Lint | Visual | Judge /10 | Renders | Passes | $/task | n |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | groq:openai/gpt-oss-120b | **98.4** | – | 98.4 | 99.2 | 97.6 | – | 100% | 80% | 0.000 | 5 |
| 2 | nvidia:minimaxai/minimax-m3.1-flash | **98.1** | – | 98.1 | 99.2 | 97.0 | – | 100% | 50% | 0.000 | 6 |
| 3 | nvidia:mistralai/mistral-large-4-1t-a52b | **97.3** | – | 97.3 | 98.2 | 96.4 | – | 100% | 50% | 0.000 | 10 |
| 4 | nvidia:nvidia/nemotron-3-ultra-550b-a55b | **82.0** | – | 82.0 | 97.5 | 66.4 | – | 70% | 30% | 0.000 | 10 |

*Passes* = renders with zero error-level violations in lint and in the rendered check.

17 job(s) errored and are excluded: gemini:gemini-3.8-flash/A-screenshot/01-dashboard, gemini:gemini-3.8-flash/A-screenshot/03-login, gemini:gemini-3.8-flash/B-dump/01-dashboard, gemini:gemini-3.8-flash/B-dump/03-login, gemini:gemini-3.8-flash/C-brief/01-dashboard, gemini:gemini-3.8-flash/C-brief/03-login, gemini:gemini-3.8-flash/D-loop/01-dashboard, gemini:gemini-3.8-flash/D-loop/03-login, groq:openai/gpt-oss-120b/B-dump/02-settings, groq:openai/gpt-oss-120b/B-dump/05-empty-customers, groq:openai/gpt-oss-120b/B-dump/06-invoice-detail, groq:openai/gpt-oss-120b/B-dump/07-new-customer-form, groq:openai/gpt-oss-120b/B-dump/09-team, groq:openai/gpt-oss-120b/D-loop/01-dashboard, nvidia:mistralai/mistral-large-4-1t-a52b/C-brief/01-dashboard, nvidia:mistralai/mistral-large-4-1t-a52b/C-brief/04-invoice-list, nvidia:mistralai/mistral-large-4-1t-a52b/C-brief/08-pricing. Re-run `npm run bench:run` to retry them.
