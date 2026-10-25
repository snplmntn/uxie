# Chapter 6: Self-Reported Metrics

## Core Idea
Asking users about their experience gives the most direct read on perception and emotion, which often predicts return visits and purchases better than performance does. Collect ratings both after each task and after the session, use validated instruments (SUS is the most reliable at small samples), and guard against social-desirability bias.

## Frameworks Introduced
- **Likert scale**: agreement with a statement, odd number of points (usually 5 or 7) to allow a neutral answer. Avoid intensifying adverbs ("very", "absolutely") in statements.
- **Semantic differential** (Osgood): bipolar adjective pairs (Weak–Strong). Pairs must be true opposites; connotation matters ("Friendly/Hostile" ≠ "Friendly/Not Friendly").
- **Post-task ratings**
  - **Ease of use**: "Overall, this task was: Very Difficult … Very Easy." The simplest version was the **most reliable at small samples** (r = 0.91 with the full dataset at n = 7; Tedesco & Tullis, 2006).
  - **After-Scenario Questionnaire (ASQ, Lewis 1991)**: 3 items on 7-point scales: satisfied with ease, with time taken, with support information.
  - **Expectation measure (Albert & Dixon, 2003)**: rate expected difficulty before tasks and experienced difficulty after. Plot expectation (x) against experience (y) in four quadrants:
    - Expected easy, was hard → **"Fix it fast"** (biggest dissatisfiers; do first)
    - Expected easy, was easy → **"Don't touch it"**
    - Expected hard, was easy → **"Promote it"**
    - Expected hard, was hard → **"Big opportunity"**
  - **Usability Magnitude Estimation (McGee, 2004)**: participants build their own ratio "usability ruler" from reference good and bad designs. Hard for participants online; better suited to moderated sessions.
- **Post-session instruments**
  - **System Usability Scale (SUS, Brooke 1986)**: 10 statements alternating positive and negative, 5-point agreement, scored 0–100. Free to use with attribution.
  - **CSUQ / PSSUQ (Lewis)**: 19 positive statements, 7-point scale; factors are System Usefulness, Information Quality, Interface Quality, Overall Satisfaction.
  - **QUIS (U. Maryland)**: 27 ten-point scales in 5 groups; commercial use requires a license.
  - **USE questionnaire (Lund, 2001)**: 30 items covering Usefulness, Satisfaction, Ease of Use, Ease of Learning.
  - **Product Reaction Cards (Microsoft, Benedek & Miner 2002)**: 118 adjectives; pick all that apply, then explain the top 5; count positive vs. negative words.
- **Live-site / Voice-of-Customer services**: WAMMI (20 items, benchmarked so 50 = average), ACSI/ForeSee (quality drivers → satisfaction → future behavior; prioritize high impact + low score), OpinionLab (page-level floating feedback).

## Key Concepts
- **Top-2-box / bottom-2-box**: % choosing the two highest or lowest points. Once converted, the data are no longer interval, so report frequencies.
- **Degrees of intervalness**: rating data are treated as interval in practice.
- **Social desirability bias**: people rate more positively face to face. Let participants complete surveys privately, ideally anonymously.
- **Awareness–usefulness gap**: % aware of a feature (yes/no) vs. % rating it useful (top-2-box after trying it). A large gap means the feature should be promoted.
- **Awareness / comprehension checks**: after use, with the site hidden, ask which content items were present (include plausible distracters), or quiz on content (incidental learning).
- **Visual appeal forms in 50 ms** (Lindgaard et al., 2006): first impressions are fast and consistent.

## Mental Models
- **SUS benchmarks** (authors' review of 129 conditions across 50 studies): mean 66, median 69, 25th percentile 57, 75th percentile 77. Under about 60 is relatively poor; over about 80 is pretty good. Still report the CI.
- **SUS is the most sensitive at small n**: at n = 8 it found the correct site preference 75% of the time, more often than QUIS, CSUQ, reaction cards or a custom questionnaire (Tullis & Stetson, 2004).
- **Average of task ratings = perception over time; one end-of-session rating = the lasting last impression.** Pick based on the question you're asking.
- **Load-time acceptability crossover**: acceptable flipped to unacceptable between 3 and 5 seconds (authors' intranet study).
- Ask about one attribute several ways and average the answers for reliability; mix positive and negative statements.

## Anti-patterns
- **Looking at individual SUS items**: SUS is meant to be read only as the combined score.
- **Moderator watching while the participant fills out the survey**: inflates ratings.
- **Generic "comments" boxes**: specific open questions ("what was confusing?") are far easier to analyze.
- **Live-site surveys with too many questions**: about 20 is the practical maximum; watch for self-selection bias.

## Worked Example
**Scoring SUS**: for odd items (1, 3, 5, 7, 9), contribution = scale position − 1; for even items (2, 4, 6, 8, 10), contribution = 5 − scale position. Sum the ten contributions (each 0–4) and multiply by 2.5. The book's Figure 6.8 example totals **22 → SUS = 22 × 2.5 = 55**, below the about-60 "relatively poor" line.

Illustrative example (not from the book): responses 4, 2, 4, 1, 4, 2, 5, 2, 4, 2 → contributions 3, 3, 3, 4, 3, 3, 4, 3, 3, 3 = 32 → SUS = **80**, at the "pretty good" line.

## Key Takeaways
1. Collect a quick rating after each task and a standard questionnaire after the session.
2. Use SUS for overall perceived usability; compare against mean 66 / median 69.
3. Use the expectation-vs-experience quadrant to prioritize tasks ("Fix it fast" first).
4. Use top-2-box when you care about the strongly positive or strongly negative share.
5. Collect surveys privately to reduce social-desirability bias.
6. Ask several questions per attribute and average them.

## Connects To
- **Ch 3**: self-report matters most for products users choose; least for critical products.
- **Ch 5**: conditional verbatims after low ratings surface issues.
- **Ch 8**: ratings feed combined scores (percent averages, SUM).
- **Ch 10.2**: PSSUQ in practice.
