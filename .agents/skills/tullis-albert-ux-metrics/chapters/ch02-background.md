# Chapter 2: Background (Study Design, Data Types, Statistics, Graphs)

## Core Idea
Know your data. How you pick participants, order tasks and classify data (nominal, ordinal, interval, ratio) dictates which statistics are valid; and every reported metric should carry a confidence interval.

## Frameworks Introduced
- **Four questions for designing a study**: What participants? How many? One group or several? Counterbalance task order?
- **Sampling strategies**: random, systematic (every nth), stratified (quotas per subgroup), and samples of convenience (most common; know their biases).
- **Within- vs. between-subjects design**
  - Within (repeated measures): same people try every condition; smaller sample, no group differences, but **carryover effects** (practice, fatigue) → counterbalance.
  - Between: different people per condition; needs a larger sample, no carryover.
  - Mixed: one between factor (e.g. gender) + one within factor (e.g. trials).
- **Counterbalancing**: vary task order so each task appears in each position once (Latin-square style). Skip it when tasks are unrelated or have a natural order.
- **Independent vs. dependent variables**: what you manipulate (design, user group) vs. what you measure (success, time, errors, satisfaction).
- **The four data types** (Table 2.3, "Choosing the right statistics"):

| Type | Usability examples | Valid statistics |
|---|---|---|
| Nominal | binary task success, binary errors, top-2-box | frequencies, crosstabs, chi-square |
| Ordinal | severity ratings, design rankings | frequencies, chi-square, Wilcoxon, Spearman |
| Interval | Likert data, SUS scores | all descriptives, t-tests, ANOVA, correlation, regression |
| Ratio | completion time, aggregated success | all of the above + geometric mean |

- **Choosing a test for comparing means**: same people → paired t-test; different people → independent t-test; n < 30 → t-test, n ≥ 30 → z-test; 3+ groups → ANOVA (a significant ANOVA shows an overall effect, not which pairs differ).

## Key Concepts
- **Confidence interval**: range likely to contain the true population value. Always report it.
- **Mean / median / mode**: use the median when extreme values (common in time data) skew the mean.
- **Standard deviation**: square root of variance, in the data's own units.
- **p-value / alpha**: alpha = 0.05 means accepting a 5% chance of a false "difference"; always state alpha.
- **Correlation (r)**: −1 to +1 strength of relationship; plot a scatterplot first.
- **Chi-square**: tests whether observed category counts differ from expected-by-chance (use raw counts, not percentages).
- **Coding nominal data**: numeric codes are labels, not quantities. Exception: success = 1, failure = 0, so the mean is the success rate.
- **Interval-like rating scales**: labelling only the end anchors makes ratings closer to interval data.

## Mental Models
- Ask "does a point halfway between two scale points make sense?" If yes, treat it as interval data.
- Ask "does 'Task 1½' make sense?" If not, use a bar graph, not a line graph.
- Report one more significant digit than the raw data had (35.1 s, not 35.08333 s).
- Users say and do different things: struggling participants often still give good ratings, so check relationships, don't assume them.

## Anti-patterns
- **Averaging ordinal data** (e.g. mean severity): statistically meaningless; report frequencies.
- **Overgeneralizing 8/10 to 80%**: with n=10 the 95% CI is 48–95%.
- **Bar axes not starting at 0, or exceeding 100%**: distorts bar lengths.
- **Colour as the only code** in a chart; vertical axis labels; 3D charts; overloaded graphs.
- **Pie or stacked bars whose parts don't sum to 100%**, or with more than ~6 slices / 3 segments.

## Reference Tables
**Table 2.1: confidence interval vs. sample size at an 80% observed success rate**

| Successful / participants | 95% CI |
|---|---|
| 4 / 5 | 36–98% |
| 8 / 10 | 48–95% |
| 16 / 20 | 58–95% |
| 24 / 30 | 62–91% |
| 40 / 50 | 67–89% |
| 80 / 100 | 71–86% |

**Graph selection**: bar = continuous values for discrete categories; line = continuous over continuous (trials, age); scatterplot = paired continuous values (add a trend line and R²); pie/stacked bar = parts of a 100% whole.

## Worked Example
Chi-square across experience groups: 20 novices, 20 intermediates, 20 experts attempt one task; 6, 12 and 18 succeed. The expected count per group under "no difference" is total successes ÷ number of groups; Excel's `CHITEST(actual_range, expected_range)` compares observed to expected. The book reports p ≈ 0.029 < 0.05, so success differs by experience group. (The book's text says 33 total successes, though 6+12+18 = 36; the method is what matters.) Lesson: binary success across groups is nominal data, so use chi-square, not a t-test.

## Key Takeaways
1. Decide participants, sample size, design (within/between) and task order before testing.
2. Identify the data type first; it limits the statistics you may use.
3. Always present confidence intervals (error bars on charts).
4. Use the median or geometric mean for skewed time data.
5. Choose the graph type by data type; start bar axes at 0.

## Connects To
- **Ch 4**: binomial (Adjusted Wald) intervals for task success.
- **Ch 5**: severity ratings are ordinal.
- **Ch 8**: z-scores build on the standard deviation.
- **Ch 11.8**: "Show your confidence".
