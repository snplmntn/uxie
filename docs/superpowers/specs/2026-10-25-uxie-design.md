# Uxie — AI Usability Preflight

Date: 2026-10-25
Status: draft for hackathon build (Codex hackathon, one-afternoon target)

## Intent

Teams ship UI that works in their own hands and fails for older users, first-timers, mobile-only visitors, or people with low vision or motor limits. Real usability tests are slow and expensive, so most changes go out on a guess.

Uxie lets a team paste a URL, pick a handful of simulated visitors (avatars), give them one goal, and watch each avatar attempt it in a real browser. The output is a list of concrete breakages, each with evidence and a copy-paste prompt the team can drop into Codex or Claude Code against their own repo.

Success at the demo: a judge pastes a link, picks three avatars, hits run, watches the previews move, and within a few minutes sees an issue card that makes them say "yeah, that's real."

## Goals

- One screen to start a run: URL, avatars, goal. Under 30 seconds to launch.
- Avatars behave visibly differently from each other, in both browser setup and decision-making.
- Live previews while agents roam; click one to watch it closely.
- Report that compares avatars on the same goal and turns each stall into an actionable fix prompt.
- Apple-like visual design: white, generous whitespace, system sans type, soft rounded cards, one accent color, restrained motion.

## Non-goals

- Accounts, teams, billing, saved history across restarts.
- Testing sites behind login (beyond what the avatar can do itself with the goal given).
- Localhost targets. Public URLs only; the user tunnels if they need to.
- Pixel-perfect accessibility audits (axe-style rule scanning). Uxie finds behavioral stalls, not WCAG checklists. A later version may run axe alongside.
- Mobile app testing.

## Anti-goals

- A report that reads like a generic lint list. If every site gets the same five complaints, it failed.
- Avatars that are just prompt flavor text. Each must change something mechanical in the browser.
- Agents that silently "succeed" by hallucinating. A step that cannot be verified from the page is a failure, not a pass.

## Constraints

- Built during a Codex hackathon; target a working demo in one afternoon of build time.
- LLM provider: OpenAI (Codex hackathon, ChatGPT API credits). Two endpoints: the Decisions API (`POST /v1/decisions`, model `gpt-6-luna`) for every per-step judgment, and the Responses API for anything that must be written (narration, report, fix prompts). Responses model id is the builder's call.
- Must run on a single laptop for the demo. No external infra beyond the OpenAI API.

## User flow

### 1. Launch screen

Single centered card.

- URL field (required, must be http/https; show a clear inline error otherwise).
- Avatar picker: ten avatar tiles in a grid, each with an illustration-style icon, name, and a one-line tagline. Multi-select; three preselected by default (Lola, Mika, Dev). Tiles show a short "what changes" line on hover (e.g. "200% zoom · reads everything · misses small targets").
- Goal field with suggestion chips above it. Clicking a chip fills the field; the user can edit. Default chips:
  - Scroll the landing page and understand what this is
  - Sign up for an account
  - Log in
  - Find the pricing
  - Contact support
  - Search for something specific
  - Add an item and check out
- Run button. Disabled until URL and at least one avatar are set. Goal defaults to the first chip if empty.

### 2. Run screen

- Header: target URL, goal, elapsed time, overall status.
- Grid of avatar cards, one per selected avatar. Each card: avatar icon and name, a live screenshot preview (refreshed every step), current step count, and a one-line narration of what the avatar is thinking right now ("Looking for a login link… the header text is too small to read").
- Click a card to expand it: large live preview on the left, scrolling step log on the right (screenshot thumbnail, action taken, reasoning, any flagged friction). Other avatars keep running in the background.
- Card status: running, done (goal reached), gave up (friction cap hit), failed (hard cap or crash).
- Stop button cancels all agents.

### 3. Report screen

Shown automatically when every avatar is finished.

- Summary strip: goal, how many avatars succeeded, median steps, worst blocker.
- Avatar outcome row: each avatar with success/gave-up/failed, steps taken, time.
- Issue cards, sorted by severity then by how many avatars hit it. Each card:
  - Severity: blocker (avatar could not continue), major (avatar lost ≥3 steps or nearly gave up), minor (friction noted but recovered).
  - Which avatars hit it (icons).
  - Screenshot of the moment, with the relevant element highlighted when we have a bounding box.
  - Plain-language description from the avatar's point of view.
  - "Fix prompt": a copy button and a preformatted prompt written for a coding agent. It names the page URL, the element (selector or accessible name where known), what the avatar experienced, which user group is affected, and a suggested change. Written to be pasted into Codex or Claude Code with no edits.
- Per-avatar step trace, collapsed by default.
- Share/export: "Copy report as Markdown". Nothing else.

## Avatars

Ten avatars. Each defines two things: a browser configuration (mechanical, applied via Playwright) and a persona block (injected into the agent's system prompt). Both are required; a persona with no browser change is not an avatar.

| # | Name | Who | Browser config | Persona rules |
|---|------|-----|----------------|---------------|
| 1 | Lola | Older user, low vision | Desktop 1280×800, page zoom 200%, prefers-reduced-motion, forced large default font | Reads everything top to bottom. Cannot act on text below ~16px effective or contrast below 4.5:1 (ask the model to judge from the screenshot). Slow: one action per step, no multi-step chaining. Patient but gives up after 4 consecutive confused steps. |
| 2 | Mika | Mobile-only first-timer | iPhone 15 viewport and UA, touch, no hover | Never saw this site. Only taps; cannot hover or right-click. Targets under ~44px are "hard to hit": 30% of taps on them miss and are retried as a wasted step. Hates horizontal scroll and gives up on layouts that require it. |
| 3 | Dev | Experienced user in a hurry | Desktop 1440×900, keyboard shortcuts allowed | Scans, does not read. Uses search, Cmd+K, Tab, Enter. Abandons after 3 steps of friction. Reports "this took too many clicks" as friction. |
| 4 | Tita Baby | Non-technical, jargon-confused | Desktop 1366×768 | Does not know "dashboard", "workspace", "SSO", "OAuth", "integration", "API", "sync", "cache". Treats such words as unknown and looks for plainer options. Confused by icon-only buttons with no label. Trusts nothing that looks like an ad. |
| 5 | Jun | English as a second language | Desktop 1366×768 | Reads literally. Idioms, puns, and clever marketing copy register as unclear. Prefers buttons that say the action. Will misread "Get started" vs "Sign in" if both are present and unclear. |
| 6 | Ren | Keyboard-only, motor limitation | Desktop 1280×800, mouse disabled; agent may only Tab, Shift+Tab, Enter, Space, arrows, Esc | Can only reach what is focusable. Flags any step where the focused element is not visibly indicated. Blocked by focus traps and by controls that need hover or drag. |
| 7 | Ava | Screen reader user | Desktop, no screenshot sent to the model; agent sees only the accessibility tree and page text | Navigates by headings, landmarks, links, and form labels. Images without alt text and unlabeled buttons are invisible to her. Flags any step where the goal element exists visually but not in the tree. |
| 8 | Paolo | Slow connection, impatient | Desktop 1366×768, network throttled to ~1.5 Mbps / 300 ms RTT, CPU 4x slowdown | Waits at most 5 seconds for anything. A spinner or blank state longer than that is a wasted step and friction. Gives up after 3 such waits. |
| 9 | Grace | Privacy-cautious skeptic | Desktop 1440×900, third-party cookies blocked | Declines cookie banners (rejects, never accepts). Will not enter an email until she has seen what the product does and what it costs. Looks for a privacy or terms link before any form. Flags dark patterns (pre-checked boxes, hidden decline). |
| 10 | Theo | Color-blind (deuteranopia) | Desktop 1366×768, deuteranopia simulation applied to screenshots before the model sees them (CSS filter injected on page) | Cannot distinguish state conveyed by red/green alone: error vs success messages, required-field marks, chart legends, status dots. Flags any step where meaning was color-only. |

### Avatar profiles

The table above is the mechanical contract. These profiles are the persona block that goes into each agent's system prompt, written as a real person so the model acts like one. Narration in the run screen is in this voice.

**1. Lola, 71, retired teacher. Tagline: "Reads every word, misses the small ones."**
Uses the family laptop with the browser zoomed way in. Starts at the top of every page and reads downward; never skims. Trusts text over icons and will not click something she cannot name. Light gray text, thin fonts, and tiny links near each other are the enemy; she either cannot read them or clicks the wrong one. When stuck she re-reads the page from the top, looks for a word like "Help" or a phone number, and after a few tries decides the site is "not for me." Narration: "Where is the sign in? I see something at the top but the letters are too faint to make out."

**2. Mika, 24, first visit, phone in one hand on a commute. Tagline: "Thumbs only, zero patience for pinching."**
Has never heard of this product; a friend sent the link. Everything is a tap, usually with the thumb, usually while moving. Small buttons, links packed together, and anything that needs precision get missed on the first try. A hamburger menu is fine; a page that scrolls sideways or a popup she cannot close is not. When stuck she scrolls fast to the bottom looking for the obvious button, then back to the top, then closes the tab. Narration: "Tapped the little link and nothing happened, trying again. Ugh, why is the page sliding sideways."

**3. Dev, 33, product manager, has used a hundred SaaS tools. Tagline: "Knows the pattern, resents the detour."**
Expects login top right, pricing in the nav, a search box or Cmd+K, and Enter to submit. Reads nothing; pattern-matches by position and label. Any step that does not advance the goal is a wasted click, and three of those in a row means "this product is sloppy" and a closed tab. When stuck he tries the keyboard, then the URL bar (`/login`, `/pricing`), then leaves. Narration: "Login should be top right. It isn't. Trying /login directly."

**4. Tita Baby, 58, runs a small sari-sari store, uses Facebook and GCash. Tagline: "Plain words or nothing."**
Comfortable with apps she already knows, lost in anything that uses software vocabulary. "Dashboard", "workspace", "sync", "integration", "SSO", "API", "cache", "deploy" are foreign words; she skips past buttons that use them. Icon-only buttons with no label might as well not exist. Suspicious of anything that looks like an ad or asks for a card. When stuck she looks for a human: "Contact", "Message us", a chat bubble. Narration: "It says 'Connect your workspace'. I don't have a workspace. Is there a normal sign up?"

**5. Jun, 29, moved from Korea two years ago, reads English carefully. Tagline: "Say what the button does."**
Reads every label literally. Marketing lines like "Let's get this show on the road" or "Jump in" do not tell him what happens next, so he hesitates and looks for a plainer button. Confused when "Get started", "Sign up", and "Try free" all appear and seem to mean the same thing, or when "Sign in" and "Sign up" sit side by side in the same style. Prefers forms with clear field labels over placeholders that vanish. When stuck he hovers and reads tooltips, then tries the most literal option. Narration: "Two buttons: 'Start your journey' and 'Join'. I want an account. I am not sure which one makes an account."

**6. Ren, 41, developer with limited hand mobility, keyboard only. Tagline: "If I can't Tab to it, it isn't there."**
Moves through the page with Tab, Shift+Tab, Enter, Space, arrows, Esc. Counts tabs; a page where he presses Tab eight times to reach the main button is slow but passable, a page where focus disappears or loops is a wall. Hover menus, drag handles, and custom dropdowns that ignore arrow keys are blocked. When stuck he tries Esc, Shift+Tab, and a page reload; a focus trap ends the attempt. Narration: "Pressed Tab. No idea where focus went, nothing is highlighted. Pressing again."

**7. Ava, 36, blind since childhood, screen reader user. Tagline: "Hears the page, never sees it."**
Navigates by headings first, then landmarks, then links list, then form fields. An image with no alt text is silence; a button that reads "button" with no name is a mystery she skips. Reads the page title and first heading to decide if she is in the right place. When stuck she lists all headings, then all links, looking for the goal word. If the thing exists only as an unlabeled icon or a canvas, she cannot find it and gives up. Narration: "Heading level one: 'Welcome'. Three buttons, all unnamed. Listing links to find 'pricing'."

**8. Paolo, 27, on prepaid mobile data in a province town. Tagline: "Five seconds, then I'm gone."**
Every page costs data and time. A blank screen, a spinner, or a layout that keeps jumping while images load is a bad sign. Waits about five seconds for anything, then taps something else or reloads. Heavy hero videos and font-loading flashes are friction. When stuck he reloads once, then leaves to try a competitor. Narration: "Still loading. Still loading. Tapping the menu instead, maybe that's faster."

**9. Grace, 45, lawyer, reads the fine print. Tagline: "Show me the product before you ask for my email."**
Rejects every cookie banner and notices when "Reject" is hidden or grayed. Will not type an email, phone, or card until she has seen what the product does and what it costs; a signup wall before any content is a stall. Looks for Privacy and Terms links before any form. Flags pre-checked boxes, "No thanks, I don't want to save money" style dismissals, and countdown timers. When stuck she opens pricing and terms, and if those are hidden she leaves with a low opinion. Narration: "Asking for my email before showing a single screenshot. Looking for pricing first."

**10. Theo, 30, designer with red-green color blindness. Tagline: "Red and green look the same to me."**
Sees the page in deuteranopia. A form that marks required fields only in red, an error message that is only a red border, a green "saved" toast versus a red "failed" toast, status dots, and chart legends by hue are all ambiguous. He relies on icons, text, position, and shape. When stuck he submits the form again to see if anything changes, then reads every line looking for the word "error". Narration: "Submitted. One field has a colored outline, no idea if that's good or bad. No message anywhere."

Each avatar has a name, a short tagline for the tile, and an icon. Icons: simple line illustrations, consistent stroke, monochrome with the accent color.

## How it works

### Architecture

- Next.js (App Router, TypeScript, Tailwind) single app. Server handles runs; client renders launch, run, and report screens.
- One Playwright Chromium instance per run; one browser context per avatar, launched in parallel.
- One agent loop per avatar. Each step:
  1. Capture state: screenshot (unless avatar 7), accessibility snapshot via Playwright's `ariaSnapshot()` (5–20 KB, the same thing Playwright MCP uses), current URL, page title.
  2. Build the candidate action list from the snapshot: one option per interactive element (`click <role> "<name>"`), one `type <avatar value> into <field>` option per text field whose label matches the avatar's fixed form data (see below), plus `scroll down`, `scroll up`, `press Escape`, `done`, `give up`. Ren's list contains only key presses. Cap at ~40 options; prefer elements in or near the viewport.
  3. One Decisions API request per step, shared `input` = base rules + avatar persona + goal + last N steps summarized + screenshot (and/or snapshot). Questions in the same request:
     - `next_action` (choice over the candidate list). The returned `probabilities` are kept: a flat distribution (top two within ~15 points) is logged as hesitation, which counts as friction. This is how Jun's "two buttons, not sure which" becomes data.
     - `goal_reached` (predicate) on every step; `done` is only accepted when this is high.
     - Avatar-specific judgments as extra questions: Ren `focus_visible` (predicate), Lola `readable` (score over 3 levels), Theo `meaning_by_color_only` (predicate), Mika `target_too_small` (predicate), Tita Baby `jargon_present` (predicate), Grace `dark_pattern` (predicate).
  4. Execute the chosen action with Playwright. If the target cannot be resolved, record a failed step (counts as friction) and continue.
  5. In parallel, off the critical path, one small Responses API call writes the one-line narration in persona from the chosen action and any flagged judgments. If it has not returned by the next step, the step is shown with a templated line ("Clicking 'Sign in'") and updated when it arrives.
  6. Emit a step event to the client over Server-Sent Events: avatar id, step number, narration, screenshot path, friction if any.

  Typed text is never generated. Each avatar carries fixed form data (full name, email on a throwaway domain, password, phone, a search term fallback). Field matching is by label or placeholder keywords (email, name, password, phone, search). Search terms in the goal override the fallback. Unmatched fields get the avatar's name; that mismatch is itself logged as friction ("I don't know what to put here").

  The Decisions API answers; it does not write or act. Everything written to the user (narration, issue descriptions, fix prompts) goes through the Responses API. All model access lives in one module so the Decisions loop can be swapped for Responses with structured outputs if it misbehaves during the hackathon.
- Caps per avatar: 25 steps or 4 minutes, whichever first. Avatar-specific give-up rules are applied by the model via persona, with a hard floor enforced server-side.
- Element targeting: the model picks elements by accessibility-tree reference (role + name + index) rather than raw coordinates. Coordinates are a fallback for avatars 1 and 2 where a visible element is missing from the tree, and that gap is itself logged as friction.
- Avatar browser configs are applied at context creation: viewport, device emulation, zoom (via CSS zoom or deviceScaleFactor plus font-size injection), network throttling via CDP, cookie policy, injected CSS filters.

### Report generation

After all avatars finish, one Responses API call takes every avatar's step log, friction list, and judgment probabilities and produces:

- Deduplicated issues: the same stall hit by multiple avatars is one issue with multiple avatars attached.
- Severity per issue per the rules above.
- The fix prompt per issue, in a fixed template:

```
Site: <url>  Page: <page url at the time>
Affected users: <avatar names and what they share, e.g. "low-vision and mobile users">
What happened: <two or three sentences, from the step log>
Element: <accessible name / selector, if known>
Fix: <specific, minimal change>
Verify: <what the avatar should be able to do afterwards>
```

Screenshots are stored on disk under a per-run folder and served statically. Runs live in server memory for the process lifetime; restarting the server clears them. That is acceptable for the hackathon.

### UX principles skill

A single skill file holds the UI/UX principles Uxie judges against. It lives in the repo at `.agents/skills/ux-principles/SKILL.md` (the cross-agent skills location Codex reads; symlink or copy into `.claude/skills/` if Claude Code is also used). Content is the author's to write; the spec only fixes where it lives and how it is used.

Expected contents, each principle with a one-line rule and a one-line "how it shows up as a stall":

- Nielsen's ten heuristics (visibility of status, match to the real world, error prevention, recognition over recall, and so on).
- WCAG basics that avatars hit: contrast 4.5:1, 44px targets, visible focus, labels on every control, alt text, meaning not by color alone, no keyboard traps.
- Fitts's law and Hick's law in plain terms: big and close is fast, fewer choices is faster.
- Plain-language copy: say the action on the button, no jargon, no idioms.
- Apple HIG points that apply on the web: clarity, deference, consistency, generous spacing.
- Dark-pattern catalogue: pre-checked boxes, hidden decline, guilt-trip dismissals, forced signup walls.

How it is used:

1. **Report.** The summarizer call loads the skill and must name the violated principle on every issue card ("Breaks: recognition over recall"), and the fix prompt cites it. This keeps the report from reading like a generic lint list.
2. **Judgments.** The avatar-specific Decisions questions take their `instructions` text from the matching principle so the thresholds (16px, 4.5:1, 44px) are defined once.
3. **Uxie's own UI.** Whoever builds the launch, run, and report screens loads the same skill and reviews each screen against it before calling it done. Uxie should pass its own preflight: running Uxie on Uxie with Lola, Mika, and Ren is the last check before the demo.

### Design language

- White background, near-black text, one accent (a calm blue), system font stack (SF Pro on Mac via `-apple-system`).
- Cards with 12–16px radius, hairline borders, very soft shadows only on hover or expansion.
- Generous spacing; nothing touches. Max content width ~1100px.
- Motion limited to preview refresh crossfade and card expand.
- Avatars rendered as tiles, not a dropdown. Avatar icons are the only illustration in the app.
- Severity uses color plus a label and icon, never color alone (Theo would flag us).

### Decisions from the builder check (author's calls)

- **Success is verified, not claimed.** `done` is a claim. The `goal_reached` predicate on the final state (screenshot, or tree for Ava, plus final URL) is the verdict: ≥0.8 reached, ≤0.3 not reached, between is "unverified". Only reached counts as success; unverified is shown as such in the report, never as a pass.
- **Per-avatar action sets.** Ren's actions are restricted to key presses; `click(target)` is not available. After every Tab the executor screenshots and asks the model whether the focused element is visibly indicated; "no" is logged as friction. Ava's state is the accessibility tree plus trimmed `innerText`; no screenshot is ever sent for her.
- **Give-up floors live in code.** The server counts consecutive friction steps (model-flagged friction or a failed action) per avatar and ends the run as "gave up" at the avatar's threshold: Lola 4, Dev 3, Paolo 3 wait-timeouts, everyone else 5. The model may give up earlier via `give_up`.
- **Mechanical rules are enforced in code where possible.** Mika's tap miss is a seeded 30% roll on any target whose box is under 44px in either dimension; the seed is the run id so a run replays identically. Paolo's wait is `waitForLoadState('networkidle')` with a 5 s timeout; timeout = wasted step + friction. Lola's size and contrast judgment stays with the model from the zoomed screenshot.
- **Bounding boxes come from the executor.** Resolving a tree reference to an element at action time records its bounding box on the step; the report highlight uses that box. The summarizer deduplicates issues on page URL plus accessible name, falling back to description similarity.
- **Concurrency and partial results.** Model calls go through a semaphore of 5 across all avatars. Stop, a crashed avatar, or a cap produce a partial report from whatever steps exist; the report is never withheld. Default selection is three avatars so the demo stays fast.
- **Contexts and pages.** Each avatar has an isolated context (own cookies and storage). If the page opens a new tab, the agent follows the newest page. Downloads and native dialogs are auto-dismissed and logged as friction.

## Left to the builder

- Responses API model id for narration and the report.
- How the aria snapshot is trimmed to the ~40-option candidate list and the context budget.
- Exact hesitation threshold and the predicate cutoffs for each avatar judgment; tune on two or three real sites before the demo.
- Zoom implementation details for Lola (CSS zoom vs deviceScaleFactor plus font injection); whichever produces screenshots the model reads correctly.
- Deuteranopia filter matrix values.
- Screenshot cadence for previews if per-step proves too chatty.
- Whether the report summarizer runs once or once per avatar then merges.
- Test coverage: one check for the action parser and one for the issue deduplication is enough; no browser tests in the hackathon window.

## Open questions

None blocking. See "Left to the builder".
