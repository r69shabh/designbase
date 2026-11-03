# designbase uplift

What designbase adds on top of each model. Generated 2026-11-03.

- **A-screenshot**: Task + screenshots of two approved screens. Today's paste-a-Figma-screenshot workflow.
- **B-dump**: Task + the entire playbook pasted into the system prompt (a DESIGN.md-style dump).
- **C-brief**: Task + designbase get_brief output: only the rules, tokens, pattern and components this task needs.
- **D-loop**: C, then designbase check (lint + rendered measurement) feeds violations back; up to 3 fix rounds.

Composite = 35% lint score + 35% rendered-visual score + 30% judge (1–10 → 0–100), or 50/50 lint/visual when no judge ran. A file that fails to render gets 0 on the visual half.

| Model | A | B | C | D | C − B (brief vs dump) | D − A (designbase vs screenshot) | D passes | D rounds | D judge | A judge |
|---|---|---|---|---|---|---|---|---|---|---|
| groq:openai/gpt-oss-120b | – | 98.4 | 90.0 | **100.0** | -8.5 | **–** | 100% | 1.0 | – | – |
| nvidia:mistralai/mistral-large-4-1t-a52b | – | 97.3 | 98.5 | **100.0** | +1.2 | **–** | 100% | 1.6 | – | – |
| nvidia:nvidia/nemotron-3-ultra-550b-a55b | – | 82.0 | 83.2 | **95.0** | +1.3 | **–** | 90% | 2.1 | – | – |
| **Mean** | – | 92.5 | 90.5 | **98.3** | -2.0 | **–** | 97% | | – | – |

**Phase 0 pass bar:** D − A ≥ +30 composite and D judge ≥ A judge + 1, with C > B.

17 job(s) errored and are excluded: gemini:gemini-3.8-flash/A-screenshot/01-dashboard, gemini:gemini-3.8-flash/A-screenshot/03-login, gemini:gemini-3.8-flash/B-dump/01-dashboard, gemini:gemini-3.8-flash/B-dump/03-login, gemini:gemini-3.8-flash/C-brief/01-dashboard, gemini:gemini-3.8-flash/C-brief/03-login, gemini:gemini-3.8-flash/D-loop/01-dashboard, gemini:gemini-3.8-flash/D-loop/03-login, groq:openai/gpt-oss-120b/B-dump/02-settings, groq:openai/gpt-oss-120b/B-dump/05-empty-customers, groq:openai/gpt-oss-120b/B-dump/06-invoice-detail, groq:openai/gpt-oss-120b/B-dump/07-new-customer-form, groq:openai/gpt-oss-120b/B-dump/09-team, groq:openai/gpt-oss-120b/D-loop/01-dashboard, nvidia:mistralai/mistral-large-4-1t-a52b/C-brief/01-dashboard, nvidia:mistralai/mistral-large-4-1t-a52b/C-brief/04-invoice-list, nvidia:mistralai/mistral-large-4-1t-a52b/C-brief/08-pricing. Re-run `npm run bench:run` to retry them.
