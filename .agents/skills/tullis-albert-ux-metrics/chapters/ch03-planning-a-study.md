# Chapter 3: Planning a Usability Study

## Core Idea
Choose metrics from two things: the study goal (formative = improve the design; summative = judge it against criteria) and the user goal (performance vs. satisfaction). Then plan budget, method, participants, data capture and cleanup before collecting anything.

## Frameworks Introduced
- **Formative vs. summative usability** ("chef vs. food critic")
  - Formative: iterative, before the design is final; find and fix issues. Only worth running if the design can still change.
  - Summative: after the dish leaves the oven; did we meet goals, how do we compare, did the release improve? Plan follow-up actions with it.
- **Performance vs. satisfaction** as the two user-goal dimensions. They do not always correlate, so measure both.
- **Ten Common Usability Study Scenarios** (Table 3.1) and their recommended metrics:

| Scenario | Recommended metrics |
|---|---|
| 1. Completing a transaction | task success, efficiency, issues-based, self-reported (expectations, likelihood to return), live-site drop-off |
| 2. Comparing products | task success, efficiency, self-reported satisfaction, combined/comparative |
| 3. Frequent use of same product | task time, efficiency, learnability, self-reported (awareness, usefulness) |
| 4. Navigation / information architecture | task success, lostness, card-sorting |
| 5. Increasing awareness | interactions with the element, self-reported noticeability/memory, eye-tracking, live-site/A-B |
| 6. Problem discovery | issues-based metrics (frequency, type, severity) |
| 7. Critical product (defibrillator, ballot) | errors, binary success vs. a target, efficiency; self-report matters little |
| 8. Overall positive experience | self-reported (expectations, likelihood to recommend), physiological |
| 9. Impact of subtle changes | live-site A/B tests, large online studies |
| 10. Comparing alternative designs | issues-based (counts of high/medium/low by design), forced-choice preference |

- **Three evaluation methods**: small lab test (4–10, formative, issue-focused), larger lab test (10–50, adds performance and self-report), online study (100+, subtle changes, preferences).

## Key Concepts
- **Clear end-state**: a task must have a verifiable finish for success to be measurable.
- **Lostness**: steps taken relative to the minimum needed (navigation efficiency; see Ch 4).
- **Design bakeoff**: comparing semi-functional prototypes early; beware learning effects across similar designs.
- **Data cleanup**: filtering extremes, creating new variables (top-2-box, overall success), verifying responses, consistency checks, moving data between tools.
- **Coding scheme**: everyone logging data must know it (success = 1, failure = 0); flipped scales ruin data.

## Mental Models
- Formative + small n → report frequencies ("6 of 8"), not percentages, to avoid overgeneralizing.
- Critical product → binary success, tied to time and zero errors; what users *think* matters far less than whether they succeed.
- Positive-UX product → what users feel at the end matters more than early stumbles; "exceeded expectations" beats "satisfied".
- Comparing designs with small samples → issue counts by severity are more informative than performance data.
- Sample-size rules of thumb: formative 6–8 per iteration (≥4 per distinct user group); summative 50–100 (20 minimum, high variance); subtle changes ≥100.

## Anti-patterns
- **Formative testing with no chance to change the design**: wasted effort.
- **Summative testing with no planned follow-up**: knowing isn't enough.
- **Same participant, same task, every similar design**: learning effects swamp differences even with counterbalancing.
- **Underestimating cleanup and analysis time**: online studies split roughly half setup, half cleanup/analysis (about 100–200 person-hours, ±50%).
- **Trusting focus groups as usability tests**: prototypes praised in focus groups can fail when people actually use them.

## Worked Example
Problem discovery on an already-built product with no prior testing: participants work in their own context, possibly on self-generated tasks, so cross-participant comparison is hard. Issue metrics still work: categorize every issue, then report e.g. "40% of issues concern top-level navigation, 20% terminology," and use frequency × severity to produce a quick-hit list of fixes.

## Key Takeaways
1. Decide formative vs. summative first.
2. Measure both performance and satisfaction; they diverge.
3. Use the ten-scenario table to shortlist metrics, then add metrics that fit your goals.
4. Add a 10% buffer to time and budget; metrics add little cost to small formative studies.
5. Plan data capture (numeric coding, templates, trained loggers) and cleanup up front.

## Connects To
- **Ch 4**: performance metrics; **Ch 5**: issues-based; **Ch 6**: self-reported; **Ch 7**: behavioral; **Ch 8**: combined; **Ch 9**: live-site and card-sorting.
- **Ch 11.4**: "Plan early and often".
