# ExtractBench

How close is the designer agent's extraction to the truth? Deterministic stages only (measure → synthesize → discover); no model calls. Generated 2026-11-03.

**Closed-world cases** (Almanac, seeded synthetic systems) know exactly which tokens and components their pages use, so precision and recall are both meaningful. **Open-world cases** are real published design systems (GitHub Primer, Bootstrap 5, Bulma 1, IBM Carbon) rendered from their own CSS: colours are checked against every colour the library's CSS can produce, scales against its published tokens (so only precision, "did we report real values?", is meaningful), and the core roles (page background, text, primary action, border) against the computed colours of the elements that define them. Colours match at CIEDE2000 ΔE ≤ 3, sizes exactly (type ±0.5px). Components match by box overlap (IoU ≥ 0.6) with the truth instances.

## Gates (closed-world averages)

| Gate | Value | |
|---|---|---|
| URL colour F1 ≥ 0.95 | 99 | ✅ |
| URL spacing F1 ≥ 0.90 | 99 | ✅ |
| URL type-scale F1 ≥ 0.90 | 100 | ✅ |
| Screenshot colour F1 ≥ 0.85 | 97 | ✅ |
| Component recall ≥ 0.80 | 100 | ✅ |

## Per case: live page (URL)

| Case | Score | Colour P/R | Roles | Spacing P/R | Type P/R | Body | Fonts | Radius P/R | Pill | Shadows | Components R/P | Variants |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| almanac | **93.3** | 100/100 | 100 | 100/88 | 100/100 | – | 100 | 100/50 | ✓ | ✓ | 100/100 | 100 |
| synth-1 (light, 4px, r8) | **100** | 100/100 | 100 | 100/100 | 100/100 | ✓ | 100 | 100/100 | ✓ | ✓ | 100/100 | 100 |
| synth-2 (light, 8px, r16, shadows) | **100** | 100/100 | 100 | 100/100 | 100/100 | ✓ | 100 | 100/100 | ✓ | ✓ | 100/100 | 100 |
| synth-3 (light, 4px, r0) | **100** | 100/100 | 100 | 100/100 | 100/100 | ✗ | 100 | 100/100 | ✓ | ✓ | 100/100 | 100 |
| synth-4 (light, 8px, r8) | **100** | 100/100 | 100 | 100/100 | 100/100 | ✓ | 100 | 100/100 | ✓ | ✓ | 100/100 | 100 |
| synth-5 (light, 8px, r16, shadows) | **100** | 100/100 | 100 | 100/100 | 100/100 | ✗ | 100 | 100/100 | ✓ | ✓ | 100/100 | 100 |
| synth-6 (light, 4px, r16, shadows) | **100** | 100/100 | 100 | 100/100 | 100/100 | ✓ | 100 | 100/100 | ✓ | ✓ | 100/100 | 100 |
| synth-7 (dark, 4px, r8) | **99.1** | 100/90 | 100 | 100/100 | 100/100 | ✗ | 100 | 100/100 | ✓ | ✓ | 100/100 | 100 |
| synth-8 (dark, 4px, r8, shadows) | **99.1** | 100/90 | 100 | 100/100 | 100/100 | ✗ | 100 | 100/100 | ✓ | ✓ | 100/100 | 100 |
| primer (GitHub, open world) | **87.5** | 100/– | – | 63/– | 100/– | – | – | 100/– | – | – | 100/80 | 100 |
| bootstrap 5 (open world) | **94.4** | 100/– | 100 | 83/– | 100/– | – | – | 100/– | – | – | 100/100 | 100 |
| bulma 1 (open world) | **100** | 100/– | 100 | 100/– | 100/– | – | – | 100/– | – | – | 100/100 | 100 |
| carbon (IBM) (open world) | **91.7** | 100/– | 100 | 75/– | 100/– | – | – | 100/– | – | – | 100/100 | 90 |

## Per case: screenshot only (colours)

| Case | Colour P/R | F1 | Roles |
|---|---|---|---|
| almanac | 100/90 | 95 | 100 |
| synth-1 (light, 4px, r8) | 100/100 | 100 | 100 |
| synth-2 (light, 8px, r16, shadows) | 100/100 | 100 | 100 |
| synth-3 (light, 4px, r0) | 100/90 | 95 | 100 |
| synth-4 (light, 8px, r8) | 100/90 | 95 | 100 |
| synth-5 (light, 8px, r16, shadows) | 100/100 | 100 | 100 |
| synth-6 (light, 4px, r16, shadows) | 100/90 | 95 | 100 |
| synth-7 (dark, 4px, r8) | 90/90 | 90 | 100 |
| synth-8 (dark, 4px, r8, shadows) | 100/100 | 100 | 100 |
| primer (GitHub, open world) | 100/– | – | – |
| bootstrap 5 (open world) | 100/– | – | 50 |
| bulma 1 (open world) | 100/– | – | 75 |
| carbon (IBM) (open world) | 100/– | – | 75 |

## What was missed

- **almanac:** spacing missed 4 · radius missed 2
- **synth-7 (dark, 4px, r8):** colours missed #171212
- **synth-8 (dark, 4px, r8, shadows):** colours missed #171412
- **primer (GitHub, open world):** extra spacing 3,5,15 · unmatched candidates box×3
- **bootstrap 5 (open world):** extra spacing 12
- **carbon (IBM) (open world):** extra spacing 14
