# Uxie — AI Usability Preflight

Date: 2026-10-25
Status: revised draft for a three-hour Codex hackathon build; specification only

## Intent

Teams ship UI that works in their own hands and fails for older users, first-timers, mobile-only visitors, or people with low vision or motor limits. Real usability tests are slow and expensive, so most changes go out on a guess.

Uxie lets a team paste a URL, choose from five simulated visitors (avatars), give them one goal, and watch each avatar attempt it in a real browser. The report gives one overall usability score from 1 to 10, a plain-language explanation of what needs improvement, and evidence-backed fixes with copy-paste prompts for Codex or Claude Code. The score describes the tested goal and pages, not the entire site's usability.

Success at the demo: run a clear task on a site the team controls, show a concrete blocker, apply the suggested fix with Codex, and rerun to show the previously blocked avatar succeeding. Disclose the prepared example's known defect. An unfamiliar public URL is a stretch demo after the prepared example works.

This revision keeps five avatars: Lola, Mika, Dev, Ren, and Ava. It cuts the other five and the elaborate viewer, per-step generated narration, broad form workflows, and report exports. A teammate owns the interface; the backend supplies the run events and report. The book-based UI/UX principles skill remains a placeholder while another teammate finds the reference.

## Goals

- One screen to start a run: URL, avatars, goal. Under 30 seconds to launch.
- Avatars behave visibly differently from each other, in both browser setup and decision-making.
- Screenshot previews refreshed after each action, with a short action label.
- Report that compares avatars on the same goal, gives one overall 1–10 score, explains the most useful improvements, and turns each supported finding into an actionable fix prompt.
- Use the shared UI/UX principles skill to guide the evaluation once its book reference and contents are supplied.
- Apple-like visual design: white, generous whitespace, system sans type, soft rounded cards, one accent color, restrained motion.

## Non-goals

- Accounts, teams, billing, saved history across restarts.
- Testing sites behind login, creating accounts, submitting forms, payments, or completing checkout.
- Localhost targets. Public URLs only; the user tunnels if they need to.
- Pixel-perfect accessibility audits (axe-style rule scanning). Uxie finds behavioral stalls, not WCAG checklists. A later version may run axe alongside.
- Mobile app testing.
- Expanded session viewers, generated narration on every step, separate numeric scores per avatar or category, saved reports, and report exports.
- Replacing research with real people, claiming to reproduce a disability or demographic faithfully, or claiming accessibility conformance.

## Anti-goals

- A report that reads like a generic lint list. If every site gets the same five complaints, it failed.
- Avatars that are just prompt flavor text. Each must change something mechanical in the browser.
- Agents that silently "succeed" by hallucinating. A step that cannot be verified from the page is a failure, not a pass.
- Manufacturing usability evidence through random tap failures or interpreting model uncertainty as human confusion.
- A precise-looking site-wide score based on one narrow task, or invented book citations while the reference is still pending.

## Constraints

- Built during a Codex hackathon; total build time is three hours. Prioritize a working browser loop, clear evidence, and a rehearsed fix-and-rerun demo.
- LLM provider: OpenAI (Codex hackathon, ChatGPT API credits). Use the Decisions API (`POST /v1/decisions`, model `gpt-6-luna`) for per-step choices and judgments, and one Responses API call for the final score, explanation, recommendations, and fix prompts. Responses model id is the builder's call. Action labels are templates, not additional model calls.
- Must run on a single laptop for the demo. No external infra beyond the OpenAI API.

## User flow

### 1. Launch screen

Single centered card.

- URL field (required, must be http/https; show a clear inline error otherwise).
- Avatar picker: five tiles in a grid, each with a simple icon, name, tagline, and visible "what changes" line. Multi-select; three preselected by default (Lola, Mika, Dev). All five can be selected.
- Goal field, prefilled with "Find the pricing". Allow another clearly stated task on public pages, but keep the supported actions to navigation and inspection. The rehearsed demo uses one task with an observable completion condition.
- Run button. Disabled until URL and at least one avatar are set. An empty goal defaults to "Find the pricing".

### 2. Run screen

- Header: target URL, goal, elapsed time, overall status.
- Grid of avatar cards, one per selected avatar. Each card has an icon and name, screenshot preview refreshed after each action, step count, and templated action label such as "Opening Pricing" or "Pressing Tab". Ava's preview is for the viewer; her agent never receives its pixels.
- No card expansion, separate session viewer, or generated think-aloud narration in the three-hour scope.
- Card status: running, done (goal reached), unverified (completion evidence insufficient), gave up (task friction cap hit), failed (technical error or hard cap), or stopped (user cancellation).
- Stop button cancels all agents.

### 3. Report screen

Shown automatically when every avatar is finished.

- One prominent **overall score: N/10**, an integer from 1 to 10. This is the only numeric rating; do not show avatar or category subscores.
- A short overall assessment in everyday language: what worked, what most needs improvement, and which pages, goal, and profiles the score covers. Show when the report is partial or the principles source is pending.
- "What to fix first": up to three prioritized recommendations. Each explains what to change, why it helps, which avatars were affected, and the evidence or loaded UI/UX principle supporting it. Lead with changes that unblock the task. Do not pad the list when there are fewer supported findings.
- Summary strip: goal, how many avatars succeeded, median steps, worst observed blocker.
- Avatar outcome row: each avatar's outcome, steps taken, and time; no additional ratings.
- Evidence cards for the recommendations: severity label (blocker, major, or minor), affected avatars, page URL, screenshot and observed action where available, element name when known, and a plain-language description. Bounding-box highlights are optional.
- Each evidence card has a copyable "Fix prompt" naming the page, observed problem, suggested minimal change, and how to verify the result. Cite the matching principle only when it is actually present in the loaded skill.
- A simple collapsed step trace may be included if time permits. Report export and a separate trace viewer are deferred.

## Avatars

Five avatars. Each has a browser/input configuration enforced by Playwright and a persona block used by the model. Dev is the ordinary desktop baseline; the other four change the device, presentation, available actions, or agent inputs. These are constrained simulations for finding potential barriers, not validated substitutes for the people described.

| # | Name | Who | Browser config | Persona rules |
|---|------|-----|----------------|---------------|
| 1 | Lola | Older-user, low-vision scenario | Desktop 1280×800, content enlarged to 200%, prefers-reduced-motion | Reads top to bottom and prefers clearly named controls. Flags observed clipping, overlap, or difficulty reading the enlarged page. Gives up after 4 consecutive supported friction steps. |
| 2 | Mika | Mobile-only first-timer | iPhone 15 viewport and UA, touch, no hover | Only taps and scrolls. Flags horizontal overflow, obstructed controls, and small or crowded targets. No artificial missed taps. |
| 3 | Dev | Experienced user in a hurry | Desktop 1440×900, ordinary mouse and keyboard actions | Desktop baseline. Scans for familiar labels and navigation. Gives up after 3 consecutive supported friction steps. Extra clicks alone are not proof of a defect. |
| 4 | Ren | Keyboard-only, motor-limitation scenario | Desktop 1280×800, pointer actions unavailable; only Tab, Shift+Tab, Enter, Space, arrows, Esc | Can only reach focusable controls. Flags missing visible focus, focus traps, and controls requiring hover or drag when they obstruct the task. |
| 5 | Ava | Accessibility-tree navigation scenario | Desktop 1280×800; model receives only the accessibility tree and page text, never screenshots or visual coordinates | Navigates named headings, landmarks, links, and controls. Flags unnamed controls or unclear structure encountered in her inputs. Cannot infer a visually present element that her inputs do not reveal. This does not emulate a complete screen reader. |

### Avatar profiles

The table above is the mechanical contract. These profiles guide navigation preferences. Persona descriptions are not evidence: findings must reference the observed page and actions. Action labels in the run screen stay factual.

**1. Lola, 71, retired teacher. Tagline: "Reads every word, misses the small ones."**
Uses the family laptop with content enlarged. Starts at the top and reads downward. Prefers text labels to unexplained icons. Checks whether content and controls remain readable and reachable at 200% enlargement. If stuck, rereads the page or looks for Help. The runner must observe the barrier rather than assume failure because of her age.

**2. Mika, 24, first visit, phone in one hand on a commute. Tagline: "Thumbs only, zero patience for pinching."**
Has never heard of this product; a friend sent the link. Uses taps and vertical scrolling without hover. A hamburger menu is fine; sideways scrolling, overlapping controls, or a popup she cannot dismiss may obstruct the task. Measure target sizes when available and describe small-target concerns as potential friction; do not inject missed taps to produce failures.

**3. Dev, 33, product manager, has used a hundred SaaS tools. Tagline: "Knows the pattern, resents the detour."**
Looks for pricing in the navigation and scans familiar labels before reading the page. Uses ordinary desktop controls and available keyboard navigation. This gives a baseline against which the constrained profiles can be compared. Follows actual page links; guessing `/pricing` does not demonstrate that the site's navigation works.

**4. Ren, 41, developer with limited hand mobility, keyboard only. Tagline: "If I can't Tab to it, it isn't there."**
Moves with Tab, Shift+Tab, Enter, Space, arrows, and Esc. Looks for a visible focus indicator and tries to reach the task's controls in order. When stuck, tries Esc or Shift+Tab. A repeated focus loop or a task control that cannot be reached is evidence of a potential barrier; a high tab count alone is not a blocker.

**5. Ava, 36, blind since childhood, screen reader user. Tagline: "Hears the page, never sees it."**
Uses the page title, headings, landmarks, link names, and text structure to find the goal. Skips controls with no useful accessible name and reports the unnamed controls she actually encounters. The runner never supplies pixels, hidden visual labels, or coordinates to help her succeed. Results describe this accessibility-tree scenario and do not claim to reproduce a real screen reader session.

Each avatar has a name, a short tagline for the tile, and an icon. Icons: simple line illustrations, consistent stroke, monochrome with the accent color.

## How it works

### Architecture

- Standalone Node/TypeScript backend using Hono and Playwright, exposing HTTP and Server-Sent Events on port 4000. Only the stack and transport carry over from the existing backend plan; this revised spec governs the avatar behavior and report requirements, and the plan's old contract must be reconciled before implementation. A teammate builds the launch, run, and report interface against the revised contract. The backend owns the score, assessment, recommendations, and evidence references so the interface does not invent or recalculate findings.
- One Playwright Chromium instance per run; one browser context per avatar, launched in parallel.
- One agent loop per avatar. Each step:
  1. Capture state: screenshot for the viewer and report, accessibility snapshot via Playwright's `ariaSnapshot()`, current URL, and page title. Ava receives only the tree and trimmed page text; her screenshot is never sent to her decision call.
  2. Build the candidate action list from the current snapshot using a backend-owned, reviewed action registry: one option per relevant named, eligible link or control (`click <role> "<name>"`), plus `scroll down`, `scroll up`, `press Escape`, `done`, and `give up`. Filter candidates by the avatar's mechanical constraints (Mika uses touch; Ren gets only permitted key presses; Ava targets only elements represented in her text/tree inputs). The model can choose only a listed candidate; page content cannot add tools or permissions. The executor revalidates the selected candidate and live target before acting. Typing, form submission, purchases, destructive actions, and other consequential actions are not available. Cap at ~40 options; prefer elements in or near the viewport.
  3. One Decisions API request per step, shared `input` = base rules + avatar persona + goal + last N steps summarized + screenshot (and/or snapshot). Questions in the same request:
     - `next_action` (choice over the candidate list). Probabilities may be retained for debugging, but uncertainty alone does not count as user friction or reduce the overall score.
     - `goal_reached` (predicate) on every step; `done` also requires observable completion evidence from the page.
     - `content_clear` (predicate, all avatars): "Would this user understand what this page is telling them in relation to the goal, for example what each plan includes and costs?" A low answer is minor friction tied to that page and screenshot ("Content unclear for this user"). It never counts toward the give-up floor.
     - Retained avatar-specific judgments: Ren `focus_visible` (predicate), Lola `readable` (three-level internal judgment), and Mika `target_too_small` (predicate, supported by target measurements when available). These internal signals are not additional user-facing ratings. Ava's labeling concerns come from her tree inputs. Qualitative judgments are tentative until tied to specific evidence.
  4. Execute the chosen action with Playwright. If the target cannot be resolved, log an executor failure and refresh the state. Do not label an agent targeting error as a site defect without separate page evidence.
  5. Capture the resulting state, check the completion condition and observed barriers, and emit a step event over Server-Sent Events: avatar id, step number, action label, screenshot path, outcome evidence, and supported friction if any. Evidence is tied to the state it describes.

  The Decisions API returns typed answers; the application executes permitted actions. Only the final report needs generated prose. All model access lives in one module so Decisions can be replaced with Responses structured outputs if necessary during the hackathon.
- Caps per avatar: 25 steps or 4 minutes, whichever first. Avatar-specific give-up rules are applied by the model via persona, with a hard floor enforced server-side.
- Element targeting: use accessibility-tree references (role + name + index). Raw-coordinate fallback is deferred; a limitation of the executor is not proof that a human cannot use the element.
- Apply the retained browser/input settings at context creation: viewport, mobile emulation and touch, content enlargement and reduced motion, key-only actions, and tree-only model inputs. Device pixel ratio alone does not implement Lola's enlargement. Network throttling, cookie-policy scenarios, and color-vision filters are outside the five-avatar scope.

### Report generation

After all selected avatars finish or stop, one Responses API call takes their step logs, observed barriers, screenshots or tree excerpts, final outcomes, and the UI/UX principles skill when available. It produces:

- `overallScore`: one integer from 1 to 10, following the rubric below; no per-avatar or category subscores.
- `assessment`: a short plain-language explanation of the score and the tested scope, including incomplete coverage or a pending principles source.
- `avatarNotes`: one plain-language sentence per avatar saying where they got to and, if they did not finish or flagged unclear content, what they could not find or understand ("Lola reached Pricing but the plan names did not say what she would get"). These are text, not ratings.
- `recommendations`: up to three general improvements, ordered by user impact. When an avatar flagged unclear content, a recommendation describes the improved step the site should offer (clearer plan names, a one-line summary under each price, a plainer label on the button). Each states what to fix, why, affected avatars, and references to supporting issues or a principle actually loaded from the skill.
- `issues`: evidence-backed findings, with severity, page URL, affected avatars, relevant step references, screenshot or tree excerpt, and element name where known. A blocker prevents the task through an observed site barrier; major friction materially obstructs it but allows recovery; minor friction has smaller observed impact. Technical failures and unsupported persona assumptions are not usability issues.
- Collapse repeated findings with the same page, element, and problem when straightforward. Elaborate semantic deduplication is deferred.
- A fix prompt for each supported issue, in a fixed template:

```
Site: <url>  Page: <page url at the time>
Affected users: <avatar names and what they share, e.g. "low-vision and mobile users">
What happened: <two or three sentences, from the step log>
Element: <accessible name / selector, if known>
Principle: <matching rule from the loaded UI/UX skill, or source pending>
Fix: <specific, minimal change>
Verify: <what the avatar should be able to do afterwards>
```

Screenshots are stored on disk under a per-run folder and served statically. Runs live in server memory for the process lifetime; restarting the server clears them. That is acceptable for the hackathon.

### Overall score and general recommendations

Show exactly one usability rating as an integer **N/10**, not a percentage, letter grade, or collection of subscores. It is a qualitative preflight assessment, not a validated measure of real users' success rates. Avatar pass counts provide context; they are not converted directly into the score.

Use these anchors consistently for the tested task and pages:

| Score | Meaning |
|---|---|
| 1–2 | The core task is broadly blocked by observed interface barriers. |
| 3–4 | Serious barriers block at least one tested interaction mode or repeatedly obstruct the task. |
| 5–6 | The task is achievable in much of the tested scope, but meaningful friction needs attention. |
| 7–8 | The tested paths generally work, with a few clear improvements. |
| 9–10 | The tested paths work smoothly, with little or no supported friction; this is not a site-wide guarantee. |

The report call selects the integer using completion evidence, the severity and reach of observed barriers, and applicable principles from the loaded skill. An observed blocker in a tested interaction mode rules out the 7–10 range. Every reason for lowering the score must trace to a finding or a specific, evidence-supported principle review. Aesthetic advice should explain its purpose, such as clearer hierarchy or more legible labels, rather than treat personal taste as a blocker.

Recommendations should read like useful direction for the site's owner: for example, "Make Pricing reachable from the keyboard so visitors can find plan costs without a mouse." Explain the change and benefit before the technical fix prompt. Separate observed task failures from potential improvements suggested by the principles review. Do not manufacture three problems to fill the report.

If technical failures prevent any meaningful assessment, show "Unable to rate" with the reason instead of inventing a score. A partial report may show a score only when it has usable evidence, and must identify which profiles or pages could not be assessed. An API, browser, or executor failure must not lower the site's usability score.

### UX principles skill

A single skill file will hold the book-based UI/UX principles Uxie judges against, at `.agents/skills/ux-principles/SKILL.md`. **This is still a placeholder. Another teammate is finding the book and will supply the reference and skill contents.** This specification update does not create or populate that file, select a book, or claim its rules have been applied.

Once supplied, the skill should identify the book's title, author, and edition where known, and express relevant principles as concise rules with observable examples and practical fixes. Do not invent quotations, page numbers, or book-specific rules. Previously discussed topics to reconcile with the eventual reference include:

- Nielsen's ten heuristics (visibility of status, match to the real world, error prevention, recognition over recall, and so on).
- Accessibility basics relevant to the retained profiles: readable text, generous targets, visible focus, meaningful accessible names, image alternatives, and no keyboard traps. Keep design recommendations distinct from conformance requirements; do not infer exact contrast ratios from screenshots.
- Fitts's law and Hick's law in plain terms: big and close is fast, fewer choices is faster.
- Plain-language copy: say the action on the button, no jargon, no idioms.
- Apple HIG points that apply on the web: clarity, deference, consistency, generous spacing.
- Visual hierarchy, typography, spacing, and consistency where supported by the eventual book.

How it will be used:

1. **Report and overall score.** Load the skill as evaluation guidance for the single score, overall assessment, recommendations, and fix prompts. Name a matching principle when supported by the observed evidence. Do not claim a violation simply because the principle exists.
2. **Judgments.** Draw applicable avatar-specific judgment instructions from the same rules. Keep model impressions distinct from measured facts. A small-target design recommendation does not justify injecting a failed tap.
3. **Uxie's own UI.** Once the skill is available, the interface teammate reviews the launch, run, and report screens against it. A self-preflight with Lola, Mika, and Ren is a manual stretch check on a public or tunneled instance.
4. **While pending.** Keep the book and skill contents explicitly marked TBD. Behavioral findings can still support a provisional score and practical fixes, but the report must say "UI/UX principles source pending" and must not describe its assessment as book-based. If a file contains only placeholder headings, treat the source as pending rather than loaded.

### Design language

- White background, near-black text, one accent (a calm blue), system font stack (SF Pro on Mac via `-apple-system`).
- Cards with 12–16px radius, hairline borders, and restrained shadows.
- Generous spacing; nothing touches. Max content width ~1100px.
- Motion limited to preview refresh crossfade, respecting reduced-motion preferences.
- Avatars rendered as tiles, not a dropdown. Avatar icons are the only illustration in the app.
- Severity uses color plus a label and icon, never color alone.

### Decisions from the builder check (author's calls)

- **Success needs page evidence.** `done` is a claim. Accept success only when `goal_reached` is ≥0.8 and the captured state contains evidence matching the task's completion condition. For "Find the pricing", that means actual plan prices or explicit pricing information, not just clicking a link or reaching a URL containing `pricing`. A probability ≤0.3 means not reached; intermediate confidence or missing evidence means unverified. Ava's evidence comes from her tree/text inputs. The predicate remains a model judgment, not independent verification.
- **Per-avatar action sets.** Ren's actions are restricted to key presses; `click(target)` is not available. After every Tab the executor screenshots and asks the model whether the focused element is visibly indicated; "no" is logged as friction. Ava's state is the accessibility tree plus trimmed `innerText`; no screenshot is ever sent for her.
- **Action permissions are application-owned.** The reviewed backend registry defines available operations and their mode/risk; persona text cannot grant capabilities, and untrusted page content cannot change the registry. Candidate construction filters by avatar, while the executor checks the chosen candidate and live target again. New operations require an explicit policy and tests.
- **Give-up thresholds live in code.** Count consecutive supported task-friction steps: Lola 4, Dev 3, Mika/Ren/Ava 5. A model may choose `give_up` earlier, but that outcome alone does not prove a site defect. Keep executor and API errors separate from the site's usability findings.
- **Mechanical differences are real; human fidelity is unproven.** Enforce Mika's mobile touch input, Lola's enlarged presentation, Ren's key-only actions, and Ava's tree-only inputs. Do not inject random failures. Small targets and readability concerns require specific evidence and are reported as potential friction unless an actual barrier is observed.
- **Evidence comes from the runner.** Preserve page URL, step references, and screenshots or tree excerpts. Record element bounding boxes when readily available; highlights are optional. Collapse simple repeated findings without a separate semantic-deduplication pipeline.
- **Concurrency and partial results.** Model calls go through a semaphore of 5 across all avatars. Stop, a crashed avatar, or a cap produce a partial report from whatever steps exist; the report is never withheld. Default selection is three avatars so the demo stays fast.
- **Contexts and pages.** Each avatar has an isolated context (own cookies and storage). If an action opens a new tab, follow that tab. Auto-dismiss native dialogs and do not save downloads; log the interruption without automatically calling it a usability defect.
- **One overall rating.** The backend returns a single integer score, assessment, and prioritized recommendations, grounded in the tested scope. The interface displays this result without generating extra ratings. Validate the report's 1–10 range and evidence references before presenting it; unsupported prose or malformed output must not become a fabricated score.

## Left to the builder

- Responses API model id for the final report.
- How the aria snapshot is trimmed to the ~40-option candidate list and the context budget.
- Predicate cutoffs for retained avatar judgments, tuned against the prepared demo without treating model uncertainty as human confusion.
- Enlargement implementation details for Lola; the page must visibly enlarge and reflow rather than only changing pixel density. Label this as a simulation of the presentation setting.
- Screenshot cadence for previews if per-step proves too chatty.
- Keep report generation to one final call. Retry or fall back to the captured behavioral findings if it fails; never invent a replacement rating.
- Small meaningful checks for the candidate/action restrictions and report contract (integer score range, usable evidence, and pending-source handling). No database or external-API integration tests; rehearse the controlled demo manually.
- Reconcile the existing backend implementation plan with this revision before any future implementation: its ten-avatar list, form filling, per-step narration, artificial friction, and report contract are superseded here. This edit changes only the specification.

## Three-hour delivery priority

- First 90 minutes: working browser loop, retained profile restrictions, evidence capture, and run events. Aim for one agent taking real actions by minute 30 before expanding to all five profiles.
- Next 45 minutes: interface teammate connects launch, run, and report; backend produces the single score, concise assessment, and up to three actionable fixes.
- Final 45 minutes: fix failures and rehearse the known-defect → fix prompt → Codex change → successful rerun sequence. Keep a captured run as a clearly labeled fallback if the live run fails.
- Scope remains five avatars. Spend remaining time on reliability rather than adding deferred viewers, narration, exports, or additional workflows.

## Open questions

- **Pending teammate input:** exact UI book/reference and the contents of `.agents/skills/ux-principles/SKILL.md`. Leave these as placeholders; do not select a book or populate the skill in this specification update. The report's pending-source behavior is defined above so no book-based claim is implied before the reference arrives.
