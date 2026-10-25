# Patterns & Techniques — Measuring the User Experience

## Binary Success with Binomial CI
**When to use**: any task with a verifiable end-state where only completion matters.
**How**: code 1/0 per participant per task; success rate = mean; report the Adjusted Wald 95% CI. For n < ~20 write "6 of 8".
**Trade-offs**: hides near-misses and struggle; pair with levels of success or the 4-point scale.

## 4-Point Task Experience Scale
**When to use**: you want to separate "succeeded smoothly" from "succeeded after a struggle".
**How**: 1 no problem · 2 minor problem (quick recovery) · 3 major problem (big detour, still succeeded) · 4 failure/gave up. Report frequencies as stacked bars; collapse to binary if needed.
**Trade-offs**: ordinal, so never average it; needs consistent scorer definitions.

## Time-on-Task with Cleaning
**When to use**: efficiency matters (repeated tasks, competitive comparison).
**How**: start when task reading ends, stop when interaction stops; remove times > 3 SD above the mean and below the fastest possible; report mean (or median/geomean) ± CI; or % under a threshold (your own time × 2).
**Trade-offs**: think-aloud distorts times; including failed-task times only works if participants chose when to quit.

## Lostness
**When to use**: navigation and information-architecture efficiency.
**How**: N distinct pages, S total visits, R minimum pages; L = sqrt[(N/S−1)² + (R/N−1)²]; <0.4 fine, >0.5 lost. Successful tasks only.
**Trade-offs**: requires knowing the optimal path.

## Efficiency = Success ÷ Time
**When to use**: one number blending effectiveness and speed (CIF core efficiency).
**How**: per task: completion rate ÷ mean minutes; per participant: tasks completed ÷ total minutes.
**Trade-offs**: scale depends on the time unit chosen; tasks must be comparable.

## Three-Level Severity
**When to use**: prioritizing issues in any formative study.
**How**: High = directly causes task failure; Medium = contributes, users work around it; Low = annoys, users recover. Two raters, independently, then reconcile.
**Trade-offs**: low agreement between specialists; define levels with examples.

## Impact × Frequency Severity Score (Lewis)
**When to use**: you need a sortable numeric priority.
**How**: impact 1 failure (×10) · 2 >1 min recovery (×5) · 3 <1 min recovery (×2) · 4 minor inefficiency (×1); score = % participants affected × weight (max 1,000). Alternatives: Rubin severity 1–4 + frequency 1–4 (2–8); UX + frequency + business impact, each 1–3 (3–9).
**Trade-offs**: weights are conventions; still subjective impact judgments.

## Issue Frequency Analyses
**When to use**: reporting issues across participants, iterations or designs.
**How**: unique issues (by severity) per design; issues per participant; % of participants hitting each issue; issues by category (3–8); issues by task.
**Trade-offs**: fuzzy issue definitions make the counts meaningless.

## Detection Probability & Sample Size
**When to use**: judging whether you've tested enough people.
**How**: participant × issue matrix → p = mean proportion of issues each participant hit; found(n) = 1 − (1 − p)ⁿ. About 5 per distinct user group for limited scope.
**Trade-offs**: assumes equal detectability; small n overestimates p (adjust).

## Expectation vs. Experience Quadrant
**When to use**: prioritizing tasks with self-report.
**How**: rate expected difficulty before, experienced after (1–7); plot; lower-right "Fix it fast", upper-right "Don't touch it", upper-left "Promote it", lower-left "Big opportunity".
**Trade-offs**: needs a pre-task rating step.

## SUS Scoring
**When to use**: overall perceived usability; small-sample comparisons.
**How**: odd items: score − 1; even items: 5 − score; sum × 2.5 (0–100). Benchmarks: mean 66, median 69; <60 poor, >80 good.
**Trade-offs**: don't interpret individual items.

## Combined Goal Attainment
**When to use**: one score for stakeholders.
**How**: define multi-condition goals; each participant 1/0 for meeting all; report the %.
**Trade-offs**: depends on well-chosen goals.

## Percent-Transform Average
**When to use**: combining unlike metrics without goals.
**How**: known max → x ÷ max; errors → 1 − x ÷ max; time → fastest ÷ x; weighted mean with deliberate weights; add a CI.
**Trade-offs**: arbitrary extremes for open-ended metrics.

## z-Score Combination / SUM
**When to use**: comparing iterations, groups or conditions on blended performance.
**How**: z = (x − mean) ÷ SD on the pooled data; flip "lower is better"; average. SUM: standardize completion, time, errors and satisfaction per task, weighted equally.
**Trade-offs**: z-mean is always 0, so only relative comparisons are meaningful.

## Positive:Negative Comment Ratio
**When to use**: tracking sentiment across iterations.
**How**: code each comment (strongly or other positive or negative, suggestion, question, variation from expectation, confusion, frustration); compare ratios.
**Trade-offs**: meaningful only comparatively.

## Drop-Off Analysis
**When to use**: multi-step flows (signup, checkout).
**How**: % completing each step; drop = previous − current; fix the largest drop first.
**Trade-offs**: shows where, not why.
