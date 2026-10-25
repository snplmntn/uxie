# Chapter 10: Case Studies

## Core Idea
Six practitioner case studies show metrics in real projects: cheap iterative redesign, formative problem discovery with severity scoring, large-scale first-click testing, competitive benchmarking with SUM, eye-tracking for safety, and a warning about metrics that don't matter.

## Frameworks Introduced
- **10.1 Redesigning a website cheaply and quickly** (Loranger): three phases in four months: competitor testing (15 people) → three design concepts (7) → single design. A **Website Appeal score** combined 7-point ratings of Credible, Easy to use, Fun, Engaging, Helpful, Annoying, Frustrating, Boring. Ads were tested as related vs. unrelated and dense vs. sparse. Seven test days and 27 participants were enough to guide decisions.
- **10.2 Speech-recognition IVR evaluation** (Lewis): 6 participants; reported task time, success and satisfaction with **90% CIs**, plus PSSUQ. Problems were scored by impact level:
  1. caused task failure · 2. more than 1 minute to recover · 3. less than 1 minute to recover · 4. minor inefficiency
  - **Severity score = % of participants affected × impact weight** (weights 10, 5, 2, 1; maximum 1,000).
  - **Sample-size adequacy check**: estimate p from the participant × problem matrix (observed 0.278, adjusted for small samples to 0.134) → estimated share of problems discovered ≈ 58%, signalling that more participants would help.
- **10.3 Redesign of CDC.gov** (Bailey, Wolfson, Nall): used **Bailey's five usability testing levels** (1 inspection → 5 tightly controlled with sample sizes large enough for strong inference); mostly Levels 4–5. **FirstClick testing**: 65 participants, 136 scenarios, recording only the first click (a wrong first click predicted failure and long times). When many participants agree on the *same wrong link*, that link is erroneously attracting clicks. Baseline → prelaunch: success 62→78%, time 96→81 s, page views 8.3→4.9, satisfaction 46→78.
- **10.4 Mobile music & video benchmarking** (Weiss & Whitby): three handsets compared; success = goal reached within a time limit; attempt counting was dropped (success came on the 1st or 2nd attempt, otherwise users gave up); **SUM** normalized time, success and ease against goals on a Six Sigma scale; outliers traced to specific design flaws.
- **10.5 Drug label design and similarity** (Bojko): errors alone were too rare and insensitive, so time, fixation count, fixation duration and pupil diameter were added, each precisely defined, to separate the effect of label *design* from cross-label *similarity*.
- **10.6 Making metrics matter** (Zazelenchuk): IU's OneStart portal measured personalization tasks carefully, but logs later showed only 1% of users ever used personalization. Metrics need a frame of reference and a focus on core tasks you'll revisit.

## Key Concepts
- **Impact-weighted severity** (Lewis): frequency × impact weight.
- **First click**: the decisive early action in web navigation.
- **Usability testing levels** (Bailey): inspection < algorithmic review < moderate control (about 8 people) < tight control, weak inference < tight control, strong inference.

## Mental Models
- Small, fast, mixed-method studies can carry a redesign if each phase answers one question.
- Report CIs even at n = 6; they document how precise (or not) the numbers are.
- Stop optimizing a scenario once it meets its goal; spend effort on the weakest scenarios.
- Measure what users will actually do: check logs before investing in metrics for a feature.

## Anti-patterns
- **Relying on error rate alone for rare but critical errors.**
- **Elaborate metrics on non-core tasks** (the OneStart personalization lesson).
- **Expert inspection as the main evidence** (CDC skipped Level 1 because of its documented weaknesses).

## Worked Example
Lewis-style severity for an IVR issue: "Asked for store rather than service location" caused task failure (impact 1, weight 10) for 2 of 6 participants (33%) → severity ≈ 33 × 10 = **333**. "Phone numbers play a little fast" was a minor inefficiency (weight 1) for 3 of 6 (50%) → **50**. Sorting by score puts the menu-order problem first; the recommendation was to place "Find service" right after "Find a store" (callers often barge in one option past their choice).

## Key Takeaways
1. Severity = frequency × impact weight gives a sortable, defensible priority list.
2. First-click accuracy is a cheap, high-volume navigation metric.
3. SUM works for competitive benchmarks.
4. Add behavioral and physiological measures when errors are too rare to measure.
5. Only measure what feeds a decision about core tasks.

## Connects To
- **Ch 5**: severity systems; **Ch 8**: SUM; **Ch 7**: eye-tracking; **Ch 6**: PSSUQ and ratings; **Ch 11.9**: don't misuse metrics.
