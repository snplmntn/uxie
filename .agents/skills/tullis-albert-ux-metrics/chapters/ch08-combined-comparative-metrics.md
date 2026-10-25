# Chapter 8: Combined and Comparative Metrics

## Core Idea
Stakeholders ask "How did it do?" and want one answer. Derive it by combining metrics (percentage of participants meeting goals, percent-transformed averages, z-scores, SUM), by showing a scorecard, or by comparing results to predefined goals or expert performance.

## Frameworks Introduced
- **Combining metrics based on target goals**: give each participant 1 if they met *all* goal conditions and 0 otherwise; report the % who met the combined goal.
  - Why it works: averages can each look fine while few individuals actually succeed.
- **Combining metrics based on percentages**: convert each metric to 0–100% (higher = better), then average, optionally weighted.
  - Min 0, max 100 (SUS) → already a percentage.
  - Min 0, max known (tasks, rating scale) → score ÷ max (code scales from 0).
  - Min 0, max unknown (errors) → 1 − (errors ÷ max errors observed) = "accuracy".
  - No defined min or max (time) → best (fastest) time ÷ observed time.
  - Weighted average = Σ(percentage × weight) ÷ Σweights. Weight self-report more for consumer products with competitors, and performance more for safety-critical products (AEDs).
- **Combining metrics based on z-scores**: z = (x − mean) ÷ SD (Excel `STANDARDIZE`). Reverse "lower is better" metrics (multiply time z by −1), then average. Each metric contributes equally. The overall mean is always 0, so use z-scores **only to compare subsets** (iterations, groups, conditions), and standardize the combined dataset, not each study separately.
- **SUM: Single Usability Metric** (Sauro & Kindlund, 2005): per task and participant, enter completion (0/1), errors (with error opportunities), time, and post-task satisfaction (an average of ease, satisfaction and perceived time). The four metrics are standardized and weighted equally (PCA showed they contribute about equally), producing a SUM % per task and overall, with confidence intervals.
- **Usability scorecards**: combination column + line chart (2 metrics per task); radar chart (3+ metrics overall); **Harvey Balls** comparison table (3+ metrics per task; tasks ordered by SUM). Key used: Excellent 90–100%, Very good 80–89%, Good 70–79%, Fair 60–69%, Poor <60%.
- **Comparison to goals**: task-level ("90% will reserve a suitable room") or overall ("SUS ≥ 80"). Goals must be measurable. Chart the % of goal achieved per task.
- **Comparison to expert performance**: have real experts (ideally several) do the tasks. Ratio = expert time ÷ actual time per task; the average ratio can serve as an overall usability score.

## Key Concepts
- **Combined goal**: several conditions that must all be met by the same participant.
- **Accuracy**: errors transformed so higher = better.
- **Expert/actual ratio**: closer to 100% = closer to expert efficiency; it adjusts for tasks that are inherently long.

## Mental Models
- **Look at individuals, not averages**: average completion 82% and average time 67 s both "met" an 80% / 70 s goal, yet only 3 of 8 participants (38%) met both.
- Equal-weight averaging of 2 performance + 1 self-report metric silently gives performance double weight; choose weights on purpose.
- A 62% overall score feels like a failing grade, so give its CI (51–72% in the book's example) and context.
- Expert comparison works best for time: experts are assumed to have 100% success and zero errors.

## Anti-patterns
- **Reporting only metric averages** when a combined individual-level goal is what matters.
- **z-scoring each study separately and then comparing**: both means are forced to 0, so the comparison is meaningless.
- **Averaging metrics pointing in opposite directions** (mixing "higher is better" with "lower is better").
- **Undefined or unmeasurable goals.**

## Reference Tables
**Percent transformation example** (one participant): 65 s per task (fastest anyone took = 25 s → 25/65 = 38%), 7 of 15 tasks (47%), rating 2.4 of 4 (60%) → equal-weight average **48%**; with rating weight 2 → (38 + 47 + 2×60) ÷ 4 = **51%**.

**Expert comparison example**: actual 124 s vs. expert 85 s → 69%; actual 101 s vs. expert 50 s → 50%. Across 10 tasks the average ratio was 66%, which serves as the overall score.

## Worked Example
Goal: "complete ≥80% of tasks in ≤70 s average."

| P | Completion | Time (s) | Goal met? |
|---|---|---|---|
| 1 | 85% | 68 | 1 |
| 2 | 70% | 59 | 0 |
| 3 | 80% | 79 | 0 |
| 4 | 75% | 62 | 0 |
| 5 | 90% | 72 | 0 |
| 6 | 80% | 60 | 1 |
| 7 | 80% | 56 | 1 |
| 8 | 95% | 78 | 0 |
| **Avg** | **82%** | **67** | **38%** |

The averages pass, 75% meet the completion goal and 62% meet the time goal, but only 38% had an experience meeting the full goal. That last figure is the one to report.

## Key Takeaways
1. "% of participants meeting a combined goal" is the easiest single score to compute and to explain.
2. To average different metrics, transform each to 0–100% with its proper min and max, then weight deliberately.
3. Use z-scores only for comparing subsets standardized together.
4. SUM combines completion, time, errors and satisfaction per task with CIs.
5. Show a scorecard (Harvey Balls) to see tasks × metrics at a glance.
6. Compare to predefined goals when you have them; otherwise compare to expert performance.

## Connects To
- **Ch 4**: the performance inputs; **Ch 6**: SUS and post-task ratings as inputs.
- **Ch 10.4**: SUM used in a mobile benchmark.
- **Ch 11.10**: present one summary slide of key metrics.
