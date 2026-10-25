---
name: tullis-albert-ux-metrics
description: "Knowledge base from \"Measuring the User Experience: Collecting, Analyzing, and Presenting Usability Metrics\" (1st ed., 2008) by Tom Tullis and Bill Albert. Use when applying Tullis & Albert's frameworks for task success, time-on-task, errors, lostness, issue severity ratings, SUS and self-reported metrics, combined usability scores (SUM, goal attainment, scorecards), or sample size and confidence intervals; when designing Uxie's avatar outcomes, issue cards and report; or when referencing the book."
---

<!-- argument-hint: [topic, framework name, or chapter number] -->

# Measuring the User Experience
**Authors**: Tom Tullis & Bill Albert | **Edition**: 1st (Morgan Kaufmann, 2008) | **Pages**: ~318 | **Chapters**: 11 | **Generated**: 2026-10-25

## How to Use This Skill

- **Without arguments**: use the core frameworks below.
- **With a topic**: e.g. `severity`, `lostness`, `SUS`, `sample size`. Find it in the Topic Index and read that chapter file before answering.
- **With a chapter**: e.g. `ch05`, then load `chapters/ch05-*.md`.
- **Browse**: "what chapters do you have?" → Chapter Index.

If a question goes beyond the Core Frameworks, read the relevant chapter file first. 1st-edition caveat: tool and vendor references (Excel menus, Bobby, WAMMI URLs) are dated, and WCAG is cited as 1.0 priorities; the methods themselves are unchanged in later editions.

---

## Core Frameworks & Mental Models

**What counts as a usability metric (Ch 1)**: observable, quantifiable, and tied to actually using the product; it reflects effectiveness, efficiency or satisfaction. Metrics exist to estimate the *magnitude* of problems and to show whether a redesign *actually* improved things.

**Know your data type (Ch 2)**: nominal (binary success) → frequencies and chi-square; ordinal (severity, 4-point scales) → frequencies only, *never averages*; interval (SUS, Likert) and ratio (time) → means, t-tests, ANOVA. Always report confidence intervals; with small n, write "6 of 8". Use the median or geometric mean for skewed times. 8/10 successes means a 95% CI of 48–95%, not "80%".

**Formative vs. summative (Ch 3)**: formative = iterative fixing before the design is final (issues + severity, 6–8 users per round); summative = judging against goals or competitors (50–100 users). Measure both performance and satisfaction; they often disagree. Use the ten-scenario table (ch03) to pick metrics.

**Five performance metrics (Ch 4)**
- **Binary success** (1/0, Adjusted Wald CI) when only finishing counts; **levels of success** when partial completion has value. The **4-point experience scale**: 1 no problem · 2 minor (quick recovery) · 3 major (big detour, still succeeded) · 4 failure/gave up.
- **Stopping rules**: participant's own give-up point, "three strikes", or a time limit.
- **Time-on-task**: clock starts after the task is read, stops when interaction stops; drop >3 SD outliers and impossibly fast times; include failed-task times only if participants chose when to quit.
- **Errors** are incorrect actions (outcomes); **issues** are causes. Measure errors when they cost efficiency, money, or task success.
- **Efficiency**: steps/clicks on *successful* tasks; **lostness** L = sqrt[(N/S−1)² + (R/N−1)²], where <0.4 is fine and >0.5 is lost; or success rate ÷ time (CIF).
- **Learnability**: an efficiency metric across 3–4+ trials (slope, asymptote, gap).

**Issues-based metrics (Ch 5)**
- An issue is anything that blocks completion, derails, confuses, causes an error, goes unnoticed, makes users assume wrongly, or is misread. It must be **actionable** (name the element and the behavior).
- **Real vs. false**: a single-participant issue counts only if there's a consistent story behind it.
- **Severity (3-level)**: **High** = directly causes task failure; **Medium** = contributes to failure, needs a workaround; **Low** = annoys, user recovers. Also Nielsen's impact × frequency 2×2, Rubin's 2–8 criticality, and Lewis's **% affected × impact weight (10/5/2/1)** (ch10).
- Use one system consistently, define levels with examples, rate with 2+ people (evaluator effect; low agreement between experts). High-severity issues are the most reproducible (88% overlap between teams vs. 38% for all issues).
- Report: unique issues by severity, % of participants per issue, issues by task and category; **lead with positive findings**.
- **Sample size**: found = 1 − (1 − p)ⁿ, p ≈ 0.3 → 5 users ≈ 83%. About 5 per distinct user group for limited scope; *task coverage beats more participants*.

**Self-reported metrics (Ch 6)**: a post-task "Very Difficult…Very Easy" rating is the most reliable at small n. The expectation vs. experience quadrant: expected easy but was hard = **Fix it fast**. **SUS** (odd items: score − 1; even items: 5 − score; sum × 2.5): mean 66, median 69, <60 poor, >80 good; the most sensitive questionnaire at n≈8. Top-2-box for strong opinions. Collect privately (social desirability bias).

**Behavioral cues (Ch 7)**: code comments as positive/negative, question, suggestion, *variation from expectation*, *stated confusion*, *stated frustration*; nonverbal impatience. Eye-tracking: "looked at it" = ≥500 ms total fixation.

**Combined scores (Ch 8)**
- **% of participants meeting a combined goal**: averages can pass while only 38% of individuals do. Prefer this.
- **Percent transforms**: x/max; errors → 1 − x/max; time → fastest/x; weighted mean with deliberate weights.
- **z-scores**: pooled data only, for comparing subsets. **SUM**: completion + time + errors + satisfaction, standardized per task.
- **Scorecards** (Harvey Balls: ≥90 excellent, 80s very good, 70s good, 60s fair, <60 poor); comparison to **goals** or **expert time ÷ actual time**.

**Beyond the lab (Ch 9)**: drop-off per step (fix the biggest drop), click-through compared by chi-square on counts, simultaneous A/B tests; "accessibility is just usability for a particular set of users": test with them, and track pages failing guidelines.

**Practice (Ch 11)**: start small (issues + severity + SUS), sketch the final charts before designing the study, benchmark success/time/satisfaction consistently, show confidence, don't over-measure, and tell each chart as a story.

---

## Applying to Uxie (Claude's mapping — not book content)

Spec: `docs/superpowers/specs/2026-10-25-uxie-design.md`.
- **Avatar outcome (done / gave up / failed)** ≈ binary success plus the stopping rule types (ch04): "gave up" = participant-chosen quit (keep its time); "failed" (hard cap) = moderator-called (exclude from time averages).
- **Issue severity (blocker / major / minor)** ≈ the book's High / Medium / Low (ch05). Spec's "lost ≥3 steps or nearly gave up" ≈ the 4-point "major problem". Consider Lewis's % avatars × weight score for sorting cards (ch10).
- **Sorting cards by severity then by how many avatars hit it** = issue frequency by participant (ch05). Count *unique* issues across avatars.
- **Median steps** → use the median, as the book advises for skewed data (ch02/04); count steps on successful runs only; lostness needs an optimal path (ch04).
- **Avatars as user groups**: about 5 participants per distinct group in real tests (ch05); one simulated run per avatar is a probe, so present counts ("2 of 3 avatars"), never percentages with implied precision (ch11.8).
- **Actionable fix prompts** = the actionable-issue test (ch05): element + behavior + affected group.
- **Narration cues** ("stated confusion", "variation from expectation") = ch07 verbal codes.
- **Report summary** → one summary slide, lead with positives, scorecard per avatar × goal (ch08, ch11).

---

## Chapter Index

| # | Title | Key Frameworks |
|---|-------|----------------|
| [ch01](chapters/ch01-introduction.md) | Introduction | definitions of usability, what makes a metric, ten myths |
| [ch02](chapters/ch02-background.md) | Background | sampling, within/between, counterbalancing, data types, CIs, t-test/ANOVA/chi-square, graph rules |
| [ch03](chapters/ch03-planning-a-study.md) | Planning a Usability Study | formative vs. summative, performance vs. satisfaction, ten study scenarios, sample sizes, data cleanup |
| [ch04](chapters/ch04-performance-metrics.md) | Performance Metrics | binary/levels of success, 4-point scale, stopping rules, time-on-task, errors, lostness, efficiency, learnability |
| [ch05](chapters/ch05-issues-based-metrics.md) | Issues-Based Metrics | what is an issue, real vs. false, severity systems, issue analyses, CUE, magic number 5, p |
| [ch06](chapters/ch06-self-reported-metrics.md) | Self-Reported Metrics | Likert, ASQ, expectation quadrant, SUS, CSUQ, QUIS, USE, reaction cards, awareness gap |
| [ch07](chapters/ch07-behavioral-physiological.md) | Behavioral & Physiological Metrics | verbal/nonverbal coding, eye-tracking, pupil, skin conductance |
| [ch08](chapters/ch08-combined-comparative-metrics.md) | Combined & Comparative Metrics | goal attainment, percent transforms, z-scores, SUM, scorecards, expert comparison |
| [ch09](chapters/ch09-special-topics.md) | Special Topics | live-site data, A/B, drop-off, card sorting, accessibility, ROI, Six Sigma |
| [ch10](chapters/ch10-case-studies.md) | Case Studies | impact-weighted severity, FirstClick, SUM benchmark, eye-tracking for safety |
| [ch11](chapters/ch11-moving-forward.md) | Moving Forward | ten steps to a metrics culture, presenting results |

## Topic Index

- **A/B testing** → ch09, ch03
- **Accessibility** → ch09
- **Adjusted Wald / binomial CI** → ch04, ch02
- **ASQ** → ch06
- **Assistance (definition)** → ch04
- **Awareness–usefulness gap** → ch06
- **Benchmarking** → ch11, ch10, ch08
- **Between/within-subjects** → ch02, ch03
- **Card sorting** → ch09
- **Chi-square** → ch02, ch09
- **Combined goal attainment** → ch08
- **Confidence intervals** → ch02, ch04, ch11
- **Counterbalancing** → ch02
- **CSUQ / PSSUQ** → ch06, ch10
- **CUE studies / evaluator effect** → ch05
- **Data cleanup / outliers** → ch03, ch04
- **Data types** → ch02
- **Drop-off rate** → ch09
- **Efficiency** → ch04
- **Errors** → ch04
- **Expectation quadrant** → ch06
- **Expert comparison** → ch08
- **Eye-tracking** → ch07, ch10
- **FirstClick testing** → ch10
- **Formative vs. summative** → ch03
- **Graphs / charts** → ch02, ch08
- **Harvey Balls / scorecards** → ch08
- **Issues (definition, actionable)** → ch05
- **Learnability** → ch04
- **Levels of success / 4-point scale** → ch04
- **Lostness** → ch04
- **Magic number 5 / sample size** → ch05, ch03, ch02
- **Positive findings** → ch05, ch11
- **Presenting results** → ch11, ch02
- **Probability of detection (p)** → ch05, ch10
- **ROI** → ch09, ch11
- **Self-reported bias** → ch06
- **Severity ratings** → ch05, ch10
- **Six Sigma** → ch09
- **Stopping rules** → ch04
- **SUM (Single Usability Metric)** → ch08, ch10
- **SUS** → ch06, ch11
- **Task success** → ch04
- **Ten study scenarios** → ch03
- **Think-aloud** → ch04, ch05
- **Time-on-task** → ch04
- **Top-2-box** → ch06
- **Verbal / nonverbal coding** → ch07
- **z-scores** → ch08

## Supporting Files

- [glossary.md](glossary.md): all key terms with definitions
- [patterns.md](patterns.md): techniques with when/how/trade-offs
- [cheatsheet.md](cheatsheet.md): decision rules, thresholds, tables

---

## Scope & Limits

Covers the book's content (1st edition) only; chapter files are synthesized summaries, not book text. The "Applying to Uxie" section is Claude's interpretation. For current accessibility standards use WCAG 2.2 rather than the book's WCAG 1.0 priorities. About 25 figures and charts in the source were images and are described only where the text explained them.
