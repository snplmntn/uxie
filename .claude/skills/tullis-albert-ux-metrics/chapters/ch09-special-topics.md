# Chapter 9: Special Topics (Live-Site Data, Card Sorting, Accessibility, ROI, Six Sigma)

## Core Idea
Usability measurement extends beyond the lab: live-site analytics (click-through, drop-off, A/B tests), card-sorting statistics, accessibility as usability for specific users, ROI, and Six Sigma-style improvement claims.

## Frameworks Introduced
- **Live website data**
  - **Page views and visits** (a visit = requests by one user within a window, often 30 minutes). Filter search bots; watch seasonality; compare day-matched weeks with a **paired t-test**.
  - **Click-through rate** = clicks ÷ times shown. Compare two links with **chi-square on raw counts** (click vs. no-click, mutually exclusive and exhaustive).
  - **Drop-off rate**: in a multi-page process, subtract consecutive completion percentages; the biggest drop marks the step to fix.
  - **A/B (A/B/C) tests**: show alternatives simultaneously, assigned randomly or by rule, with a cookie for consistency.
- **Card sorting**: open sort (users create groups) then closed sorts (predefined groups). Build a participant-by-pair distance matrix, then analyze with **hierarchical cluster analysis** (tree; choose the number of clusters and check how well it matches each participant's pairings) and **multidimensional scaling (MDS)** (2D map of similarity). Closed sorts: % of items placed in the "correct" group compares information architectures. About **15 participants** gave a correlation of 0.90 with the full dataset (Tullis & Wood, 2004).
- **Accessibility as usability**: "accessibility is really just usability for a particular set of users"; all the book's metrics apply. Best: test with representative users with disabilities. Otherwise, check against guidelines (WCAG, Section 508). Automated checkers find true errors but miss many, so manual inspection or a screen reader is needed.
  - Metrics: % of pages failing at each priority level (classify each page by its most severe error); distribution of pages by error count (0, 1–2, 3–10, >10); % of pages passing all Section 508 standards.
- **ROI**: benefit from time saved (× wage × users × frequency) and from higher completion (× transactions × fee). Easier when users are employees; customer ROI is indirect (loyalty, acquisition). State assumptions; show conservative and aggressive versions.
- **Six Sigma for usability**: claim a Six-Sigma improvement when the new version's mean (lower limit of its 99.7% CI) exceeds the old mean + 3 SD.

## Key Concepts
- **Drop-off percentage**: users reaching a step minus users completing it.
- **Distance matrix**: for each card pair, how many participants put them in different groups.
- **Page-level accessibility metric**: more meaningful than raw error counts.

## Mental Models
- A change in page views may come from news, seasons or bots rather than your design; control with simultaneous A/B tests.
- Copy changes can beat layout changes: in one A/B/C test, rewritten text gave **+15.6%** sales while a two-column redesign gave **−53.3%** (Usborne, 2005).
- For accessibility, task metrics expose the real gap. Nielsen (2001c) across 19 sites:

| | Screen reader users | Screen magnifier users | Control |
|---|---|---|---|
| Task success | 12.5% | 21.4% | 78.2% |
| Task time | 16:46 | 15:26 | 7:14 |
| Errors | 2.0 | 4.5 | 0.6 |
| Rating (1–7) | 2.5 | 2.9 | 4.6 |

## Anti-patterns
- **Chi-square on percentages** instead of counts.
- **Trusting automated accessibility checkers alone.**
- **ROI chains built on one unsupported big assumption** (e.g. "a quarter of residents use the site monthly"); use real usage data.
- **Testing A and B at different times.**

## Worked Example
Drop-off in a 5-page account-opening flow. Completed: page 1 89%, page 2 80%, page 3 73%, page 4 52%, page 5 49% → drop-offs 11%, 9%, 7%, **21%**, 3%. Page 4 is where to investigate and redesign first.

ROI (Withrow et al., 2000, state portal redesign): completion rose from 72% to 95% and time fell from 2.2 to 0.84 min. Time savings of 79 s/task × an assumed quarter of 2.7M residents monthly ≈ $1.2M/yr; plus the 23% newly succeeding on fee transactions ≈ $552K/yr. That totals about $1.75M, entirely contingent on the usage assumptions.

## Key Takeaways
1. On live sites, look beyond hits: click-through, drop-off and simultaneous A/B tests, checked with chi-square.
2. Card sorting: open then closed; cluster analysis plus MDS; about 15 participants.
3. Accessibility = usability for specific users: test with them, and check WCAG/508 per page.
4. Tie metrics to ROI with explicit, data-backed assumptions.
5. A Six-Sigma claim needs the new mean's lower 99.7% bound to clear the old mean + 3 SD.

## Connects To
- **Ch 2**: paired t-test and chi-square.
- **Ch 3**: scenarios 1, 4, 5 and 9 use live-site and card-sorting data.
- **Ch 4**: task success, time and efficiency feed ROI.
- **Ch 11.7**: speak the language of business.
