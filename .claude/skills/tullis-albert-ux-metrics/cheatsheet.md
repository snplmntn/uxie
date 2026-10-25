# Cheatsheet — Measuring the User Experience (decision aid)

## Pick metrics by situation
| If the goal is… | Measure first | Then |
|---|---|---|
| Find what's broken (formative) | issue frequency + severity | success, time (report as "x of n") |
| Complete a transaction | binary success, drop-off | severity, likelihood to return, expectations |
| Navigation/IA | task success, lostness, first click | card sort (≈15 people) |
| Critical/safety product | errors, binary success vs. target | time; self-report matters little |
| Delightful experience | expectations, likelihood to recommend, SUS | performance secondary |
| Compare designs (small n) | high/med/low issue counts per design | forced-choice preference |
| Subtle changes | live A/B (≥100s of users) | chi-square on counts |
| "How did it do?" | % meeting combined goal | SUM / scorecard / expert ratio |

## Decision rules
- **When** success depends only on finishing → binary success; **when** partial completion has value → levels of success.
- **When** data are ordinal (severity, 4-point scale) → report frequencies, **never** averages.
- **When** n < 20 → show "6 of 8" + CI, not "75%".
- **When** the participant chose when to quit → include failed-task times; **when** the moderator called tasks → successful tasks only.
- **When** counting steps/clicks → successful tasks only.
- **When** an issue was seen by only one participant → keep it only if there's a consistent, logical story behind it.
- **When** CIs don't overlap → significant; **when** they overlap → run the t-test/ANOVA.
- **When** combining metrics → transform so higher = better; weight on purpose.
- **When** time data are skewed → median or geometric mean.

## Severity
| Level | Definition |
|---|---|
| High | directly causes task failure — no way to hit it and still finish |
| Medium | contributes to failure; users need workarounds |
| Low | annoys/derails, user recovers |

Numeric option (Lewis): **% affected × weight** — failure 10 · >1 min recovery 5 · <1 min recovery 2 · minor inefficiency 1.
Nielsen 2×2: large impact + many users = High; small + few = Low; mixed = Medium.

## Thresholds & defaults
- Lostness: **<0.4** fine · **>0.5** lost
- SUS: mean **66**, median **69**; **<60** poor · **>80** good
- Detection p ≈ **0.3** → 5 users ≈ 83% of issues; **~5 per distinct user group**
- Formative **6–8**/iteration (≥4 per group); summative **50–100** (min 20); subtle changes **≥100**
- Time threshold: your own time **× 2**; outliers **> 3 SD**; online speeders **5–10%**
- Eye-tracking "looked at it": **≥500 ms** total fixation
- Load time acceptability flips between **3 and 5 s**
- Budget buffer **+10%**; issue categories **3–8**; pie ≤6 slices; stacked bar ≤3 segments
- Small-n success CIs: 4/5 → 36–98% · 8/10 → 48–95% · 16/20 → 58–95%

## Expectation quadrant
| | Experience easy | Experience hard |
|---|---|---|
| **Expected easy** | Don't touch it | **Fix it fast** |
| **Expected hard** | Promote it | Big opportunity |

## Tells & smells
- Averages meet the goal but few individuals do → report % meeting combined goal.
- Unique issues fall, per-participant issues don't → you fixed rare issues, not common ones.
- Many users agree on the **same wrong first click** → that link mislabels itself.
- Fast + successful but rated low → scale confusion or capture error; check data.
- Struggled but rated high → users say ≠ do; trust performance.
- Issue statement names no element → not actionable; rewrite.
