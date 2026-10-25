# Chapter 5: Issues-Based Metrics

## Core Idea
Usability issues, usually treated as purely qualitative, can be counted, rated for severity and analyzed (by frequency, participant, category and task) without slowing iterative design. Make issues actionable, decide whether each is real, and treat severity ratings as imperfect but better than nothing.

## Frameworks Introduced
- **What is a usability issue?** (examples, not a definition): anything that prevents task completion; takes someone off course; creates confusion; produces an error; not seeing something that should be noticed; assuming something is correct when it isn't; assuming a task is complete when it isn't; performing the wrong action; misinterpreting content; not understanding the navigation.
- **Actionable issue test**: an issue should point to (or hint at) the part of the interface causing it. Bad: "The mental model of the application does not match the user's mental model." Good: "Many participants were confused by the top-level navigation menu, often jumping between sections trying to find what they wanted," plus concrete examples.
- **Real vs. false issues**: if only one participant hit it, ask whether there is a **consistent story** behind their behavior. A logical rationale ("the link wording made it seem like the right place") makes it real; no rationale ("it was just there") makes it idiosyncratic.
- **When issues begin and end**: an issue begins at the first doubt or departure from the ideal path. It ends with task failure, replacement by a different issue, recovery ("Oh, now I get it!"), or irrelevance.
- **Three-level severity based on user experience**:
  - **Low**: annoys or frustrates but plays no role in task failure; may take the user off course, but they recover.
  - **Medium**: contributes to but doesn't directly prevent task failure; users develop workarounds.
  - **High**: directly leads to task failure; there is no way to hit it and still complete the task.
- **Other severity schemes**:
  - Nielsen (1993) 2×2: impact (small/large) × frequency (few/many users) → low/medium/high; large impact + many users = high.
  - Rubin (1994): severity 1–4 (irritant, moderate, severe, unusable) + frequency 1–4 (<10%, 11–50%, 51–89%, >90%) = criticality score 2–8.
  - Three-factor sum: UX impact + predicted frequency + business impact (each 1–3) = 3–9.
  - Wilson (1999) five levels, from minimal error to catastrophic (data loss, hardware damage); align with your bug tracker. Some schemes add "catastrophe/showstopper" or "cosmetic" levels.
- **Using a severity system**: (1) use one system consistently across studies; (2) define each level with examples; (3) have 2+ specialists rate independently, then reconcile; (4) track issues (in the bug tracker or a separate database).
- **Five analyses of issue metrics**: frequency of unique issues (optionally by severity); issues per participant; frequency of participants hitting a specific issue; issues by category (3–8 categories); issues by task.

## Key Concepts
- **Unique issues**: count each distinct issue once (A = 10, B = 14, 6 shared → 18 unique).
- **Positive findings**: report what worked, to build goodwill, protect good parts from being "broken" later, and show neutrality. Lead reports with one.
- **Granularity**: fine-grained (a specific missed link) vs. big picture (confused by the site's overall organization). Use big picture early in design and detail later.
- **Evaluator effect** (Hertzum et al., 2002): specialists rate issues they found themselves as more severe.
- **CUE studies** (Molich): little agreement between teams on which issues exist (CUE-1: 1 of 141 found by all four teams).
- **p (probability of detection)**: the share of all issues a single participant reveals; averages around 0.3. Issues found by n users = 1 − (1 − p)ⁿ.
- **Conditional verbatims**: in automated studies, ask "why?" only after a low ease rating; this gives sharper comments.

## Mental Models
- **Bigger issues are more reproducible**: two teams agreed on 38% of all issues but 88% of high-severity ones (Tullis, 2005). Focus on the highs.
- **Task coverage beats participant count**: more tasks correlated with finding more problems (r = 0.82); more participants did not (Lindgaard & Chattratichart, 2007). Use a core task set plus per-participant extras.
- **"Five is enough", with conditions**: about 5 per distinct user group finds most important issues when scope is limited (5–10 tasks, 20–30 pages) and the audience is well defined.
- **Unique issues fall but per-participant issues don't** → the rare issues are being fixed while the common ones remain.
- **Expected issues aren't the ones you find**: predict, but stay open. (Apple's "black-and-white monitor" question failed because monochrome monitors showed green text.)

## Anti-patterns
- **Handing developers 82 unprioritized issues**: severity exists so the team fixes what matters.
- **Vague, non-actionable issue statements.**
- **Trusting one rater's severity**: evaluator effect and low agreement between specialists.
- **Fuzzy issue definitions when counting participants per issue**: document each issue's exact nature.
- **Too many categories**: more than 8 gives no direction.

## Reference Tables
**Nielsen severity matrix**

| | Few users affected | Many users affected |
|---|---|---|
| Small impact | Low | Medium |
| Large impact | Medium | High |

**Detection curve at p = 0.3**: 1 user ≈ 30%, 3 users ≈ 66%, 5 users ≈ 83% of issues.

## Worked Example
Computing p and the sample needed: list all issues in columns and participants in rows, and mark which issues each participant hit. Each participant's proportion = issues hit ÷ total issues; average them (the book's example gives p = 0.49). Then the share of issues found with n = 3 users = 1 − (1 − 0.49)³ = 1 − 0.133 ≈ **87%**. If p were 0.3, three users would find only about 66%.

Turning issues into a report: 4 issues across 10 participants → Figure 5.5 style: "Did not see checkout link: 6 participants; Confused by navigation choices: 4; Did not know how to return to shopping: 2; Confused about shipping options: 1." Add severity: the checkout-link issue blocked purchase, so it is **High**; the shipping-options issue was recovered from, so it is **Low**.

## Key Takeaways
1. Make every issue actionable: name the element, the behavior, examples.
2. Accept single-participant issues only when there is a consistent story behind them.
3. Pick one severity system, define levels with examples, and rate with 2+ people.
4. Report unique issues, % of participants per issue, and issues by task and category, especially for high severity.
5. Report positive findings, and lead with them.
6. Widen task coverage before adding participants; about 5 per user group usually suffices for limited scope.

## Connects To
- **Ch 4**: errors are outcomes; issues are their causes.
- **Ch 3**: problem discovery and design comparison rely on issue metrics.
- **Ch 10.2**: Lewis's severity = % of participants × impact weight (10/5/2/1).
- **Ch 7**: verbal and nonverbal cues help detect issues.
