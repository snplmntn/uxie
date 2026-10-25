# Chapter 1: Introduction

## Core Idea
Usability can be measured. A usability metric is an observable, quantifiable measure of some aspect of the user experience (effectiveness, efficiency or satisfaction), and its job is to support a decision, not to be an end in itself.

## Frameworks Introduced
- **Three definitions of usability** (ISO 9241-11, UPA, Krug): all share *a user* doing *something* with *a product*.
  - ISO 9241-11: "the extent to which a product can be used by specified users to achieve specified goals with effectiveness, efficiency, and satisfaction in a specified context of use."
  - The authors take the broad view: "measuring usability" means measuring the whole user experience.
- **What makes something a usability metric**
  - When to use: deciding whether a number belongs in a usability report.
  - Criteria: (1) observable, directly or indirectly; (2) quantifiable; (3) reflects an aspect of the experience of *actually using* the thing. Preferences not tied to use (approval ratings, CPI, purchase frequency) are not usability metrics.
- **Three outcomes of a before/after comparison**: new version tests better (ship with confidence), worse (remediate), or no difference (UX is not what decides this release's success).
- **Ten Common Myths about usability metrics** (each refuted):
  1. They take too much time. 2. They cost too much. 3. They're useless for small improvements. 4. They don't explain causes. 5. The data are too noisy. 6. You can trust your gut. 7. They don't apply to new products. 8. No metric exists for our issue. 9. Management doesn't understand them. 10. Small samples can't give reliable data.

## Key Concepts
- **Usability vs. user experience**: usability = ability to complete a task; UX = the entire interaction plus resulting thoughts, feelings and perceptions.
- **Effectiveness**: being able to complete the task.
- **Efficiency**: effort required to complete it.
- **Satisfaction**: how happy the user was with the experience.
- **Magnitude of an issue**: how many users are likely to hit it; metrics turn "some people struggled" into an estimate.
- **Baseline metrics**: first measurements of a new product, which later iterations are compared against.
- **Target metrics**: goals a product should hit before release (success, satisfaction, efficiency).

## Mental Models
- Think of metrics as the way to estimate the **size** of a problem, not just its existence: 2 of 8 participants failing is a guess without a confidence interval.
- Use metrics when a decision depends on "is the new version actually better?"; there is no other reliable way to know.
- Treat counter-intuitive results as the payoff: e.g. putting everything above the fold can *slow* users when white space disappears.
- Small inefficiencies (re-entering data on each screen) are invisible in observation but show up in metrics.

## Anti-patterns
- **Reporting only that issues exist**: without magnitude, a launch-blocker and a low-priority bug look the same.
- **Deciding by gut feel**: right answers are often counter-intuitive.
- **Skipping metrics for a new product**: you lose the baseline every later iteration needs.

## Worked Example
The 2007 Atlanta bus crash: an exit sign for "Northside Drive" carried the HOV diamond and was read as the continuation of the HOV lane. Seven people died. The authors pose it as a metrics question: how would you test candidate signage? (E.g. % of drivers choosing the correct lane in a simulator, decision time, error rate under time pressure.) The point: usability failures can be life-and-death, and only measurement can compare alternatives before deployment.

## Key Takeaways
1. A usability metric must be observable, quantifiable, and tied to actual use.
2. Every metric reflects effectiveness, efficiency or satisfaction (or a mix).
3. Metrics estimate how big a problem is and whether a redesign improved things.
4. Metrics are cheap to add to everyday testing (a few questions, a severity count).
5. Small samples (8–10) are usable if you report confidence intervals.

## Connects To
- **Ch 2**: confidence intervals that answer Myth 10.
- **Ch 5**: issue frequency and severity, the cheapest metrics (Myths 1–3).
- **Ch 9**: ROI calculations mentioned here.
