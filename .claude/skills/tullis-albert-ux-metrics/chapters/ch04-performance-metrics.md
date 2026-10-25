# Chapter 4: Performance Metrics

## Core Idea
Performance metrics measure what users *do*, not what they say. There are five types: task success, time-on-task, errors, efficiency and learnability. All require tasks with defined success criteria, and all tell you *what* happened, not *why*.

## Frameworks Introduced
- **Binary success**: pass/fail per task, coded 1/0; the mean is the success rate.
  - When to use: success of the product depends on completing the task; "getting close doesn't count" (buying a book, using a defibrillator).
  - How: predefine the correct end-state; report success per task with a **binomial confidence interval** (Adjusted Wald, per Sauro & Lewis 2005).
- **Levels of success**: partial credit when shades of grey give value. Three perspectives: degree of completion (with/without assistance, partial answer), experience (struggle vs. ease), or path (optimal vs. suboptimal).
  - Six-level scheme: complete success (with/without assistance), partial success (with/without assistance), failure (thought complete but wasn't / gave up).
  - Numeric success score: complete = 1.0, partial = 0.5, gave up or wrong answer = 0.0 (a *score*, not a success rate; hides the type of failure).
  - **4-point experience scale**: 1 = no problem; 2 = minor problem (small detour, quick recovery); 3 = major problem (struggled, major detour, still succeeded); 4 = failure/gave up. It is ordinal, so report frequencies (stacked bars), not averages.
- **What counts as "assistance"**: moderator resets to the homepage, restates the task or probes, answers a question; participant consults outside help (phone, other site, manual, online help).
- **Stopping rules for unsuccessful tasks**: (1) continue until you'd give up in real life; (2) "three strikes and you're out" (define an attempt); (3) call the task after a preset time limit (e.g. 5 minutes; don't tell the participant).
- **Time-on-task**: elapsed time from start to end. Start the clock when the participant finishes reading the task; stop when they stop interacting with the product.
- **Errors vs. issues**: an issue is the underlying *cause*; an error is an incorrect *action* that may result (and may lead to failure).
- **Lostness** (Smith, 1996): L = sqrt[(N/S − 1)² + (R/N − 1)²], where N = distinct pages visited, S = total page visits including revisits, R = minimum pages required. 0 = perfect; < 0.4 = not visibly lost; > 0.5 = definitely lost.
- **Efficiency as success per unit time** (Common Industry Format, NIST 2001): completion rate ÷ mean task time. Per participant: tasks completed ÷ total time.
- **Learnability**: any efficiency metric over trials. Read the slope (learning curve), the asymptote (where proficiency plateaus) and the first-to-last gap (ratio).

## Key Concepts
- **Error opportunity**: a chance to make a specific mistake (a login has two: username and password).
- **Proxy success measure**: when the answer can't be verified remotely, check something observable (e.g. the title of the page showing the balance).
- **Time thresholds**: % of users finishing under an acceptable time (rule of thumb: do it yourself and double it).
- **Outliers**: exclude times more than 3 SD above the mean, or ones below the fastest humanly possible time (5–10% of online participants just click through for the incentive).
- **Geometric mean / median**: alternatives for skewed time data; patterns across tasks usually stay the same.
- **Weighted error score**: trivial = 1, moderate = 2, serious = 3; sum per participant, average per task.
- **Trial**: one round of data collection in a learnability study (same session, with breaks, or across sessions).

## Mental Models
- **Include failed-task times only if participants chose when to quit.** If the moderator sometimes ended tasks, analyze successful tasks only.
- **Efficiency counts (clicks, steps) use successful tasks only**: someone who quits after 3 steps isn't "efficient".
- **Measure errors when** an error causes significant lost efficiency (data loss, re-entry), significant cost (support calls, returns), or task failure (wrong medication, wrong vote, wrong purchase).
- **Define the universe of actions first**, then the errors; don't double-count one event as two error types.
- **Think-aloud inflates time**: ask participants to hold comments until the clock stops (retrospective probing).
- Present at least 12 (ideally >20) participants' success as a frequency distribution to show spread.

## Anti-patterns
- **Tasks without a clear end-state** ("research ways to save for retirement") for success measurement.
- **Write-in answers**: slow to score and noisy; prefer realistic multiple-choice distracters.
- **Reporting averages of 4-point experience scores**: ordinal data, so report frequencies.
- **Over-relying on performance metrics**: they show the what, not the why. Pair them with observation and comments.
- **Telling participants they're timed**: makes them anxious; instead ask them to be "as quick and accurate as possible."

## Reference Tables
**Lostness worked numbers** (task: reach Product Page C1 from the homepage): R = 3; the participant visited N = 6 distinct pages in S = 8 visits → L = sqrt[(6/8 − 1)² + (3/6 − 1)²] ≈ **0.56** → lost.

**Efficiency (CIF) example**: Task 1: 65% completion ÷ 1.5 min = 43%; Task 6: 90% ÷ 1.4 min = 64% (higher is better). Choose a time unit so most values fall between 1 and 100%.

**Binomial CI (Adjusted Wald)**: 4/5 → 36–98%; 16/20 → 58–93%; 80/100 → 71–87%.

## Worked Example
Scoring one checkout task across 8 participants using the 4-point experience scale:
- P1, P4, P7: bought the item without hesitation → **1 (no problem)**
- P2, P5: clicked "Cart" twice before noticing the checkout button, recovered quickly → **2 (minor)**
- P3: entered the shipping address three times due to unclear validation, eventually succeeded → **3 (major)**
- P6, P8: gave up on the payment page → **4 (failure)**

Report as a stacked bar: 38% no problem, 25% minor, 13% major, 25% failure. Binary success = 6/8 (report as "6 of 8"; Adjusted Wald 95% CI is roughly 40–94%). Time analysis: participants chose when to quit, so include all 8 times. Efficiency in steps: successful participants only.

## Key Takeaways
1. Predefine success criteria and stopping rules before testing.
2. Always pair success rates with binomial confidence intervals.
3. Use levels of success when partial completion has value, and report them as frequencies.
4. Clean time data (outliers, impossibly fast) and consider median or geometric mean.
5. Lostness above 0.5 means the user is lost; count steps only on successful tasks.
6. Learnability = efficiency across 3–4+ trials; read slope, asymptote and gap.

## Connects To
- **Ch 2**: confidence intervals and data types.
- **Ch 5**: issues explain *why* the errors and failures happen.
- **Ch 8**: success, time and errors combine into single scores (SUM, % of goal).
- **Ch 3**: which performance metrics fit which scenario.
