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
- LLM provider: OpenAI (Codex hackathon). Use the latest vision-capable model; exact model id is the builder's call.
- Must run on a single laptop for the demo. No external infra beyond the OpenAI API.

## User flow

### 1. Launch screen

Single centered card.

- URL field (required, must be http/https; show a clear inline error otherwise).
- Avatar picker: five MVP avatar tiles in a grid (Lola, Mika, Ava, Dev, Grace), each with an illustration-style icon, name, and a one-line tagline. Multi-select; Lola, Mika, and Dev preselected by default. Tiles show a short "what changes" line on hover (e.g. "200% zoom · reads everything · misses small targets").
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

The MVP includes five avatars: Lola, Mika, Ava, Dev, and Grace. Their machine-readable implementation contract is `2026-10-25-uxie-avatars.json`; each defines browser configuration, model perception, allowed actions, persona instructions, friction limits, and evidence requirements. A persona with no mechanical browser/action change is not an avatar. Tita Baby, Jun, Ren, Paolo, and Theo remain future concepts; their original profile notes below are reference material, not MVP implementation requirements.

| # | Name | Who | Browser config | Persona rules |
|---|------|-----|----------------|---------------|
| 1 | Lola | Older user, low vision | Desktop 1280×800, 200% zoom, reduced motion, large default font | Reads top-to-bottom, one action at a time. Reports hard-to-read text or small/crowded targets from screenshot evidence; gives up after 4 consecutive friction steps. |
| 2 | Mika | Mobile-only first-timer | iPhone 15, touch-only, no hover or right-click | First visit; taps and scrolls only. A seeded 30% tap miss applies to targets under 44px in either dimension. Horizontal overflow and blocked popups are friction; gives up after 5 consecutive friction steps. |
| 3 | Ava | Keyboard and screen-reader access | Desktop 1280×800, keyboard-only; model receives accessibility tree and page text, never a screenshot | Navigates by headings, landmarks, links, and form labels. Uses only keyboard actions. Reports missing/unusable controls from tree and keyboard evidence. Focus visibility is separate executor evidence, not something Ava judges visually. |
| 4 | Dev | Experienced user in a hurry | Desktop 1440×900, keyboard shortcuts allowed | Scans for familiar patterns and expects common destinations. Reports avoidable steps only when shown by the action trace; gives up after 3 consecutive friction steps. |
| 5 | Grace | Trust and clarity | Desktop 1440×900, third-party cookies blocked | Rejects optional cookies, expects clear product/pricing information before personal data, and flags jargon, vague labels, hidden decline choices, or pre-checked consent with exact UI evidence. Gives up after 5 consecutive friction steps. |

### Avatar profiles

The five MVP profiles above are the implementation set. The JSON registry is their machine-readable contract. The remaining profiles below are deferred reference material only. Narration in the run screen follows the selected avatar's short persona instructions.

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
  1. Capture state according to the selected avatar's perception settings: screenshot only when allowed, accessibility tree, current URL, and page title.
  2. Call the Responses API with base rules, avatar instructions from the registry, the goal, a short recent history, and current page state.
  3. Model returns one structured, avatar-allowed action plus brief narration and evidence-backed friction. Validate the action schema and target reference before executing it.
  4. `done` is only a claim. Verify goal completion against the resulting page state in a separate verifier call; unclear is never success.
- 5. Execute the action with Playwright. If the target cannot be resolved, record a failed step (counts as friction) and continue.
- 6. Emit a step event to the client over Server-Sent Events: avatar id, step number, narration, screenshot path, friction if any.
- Caps per avatar: 25 steps or 4 minutes, whichever comes first. Give-up thresholds are enforced server-side from the registry: Lola 4, Dev 3, Mika/Ava/Grace 5.
- Element targeting: use current accessibility-tree references (role + name + index). Coordinates are unavailable to Ava; any permitted visual fallback for other avatars must be logged with evidence.
- Avatar browser configs and model-perception rules are loaded from the shared JSON registry. The model never receives a screenshot for Ava.

### Report generation

After all selected avatars finish, one summarizing model call takes their step logs, friction events, and evidence references and produces:

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

### Design language

- White background, near-black text, one accent (a calm blue), system font stack (SF Pro on Mac via `-apple-system`).
- Cards with 12–16px radius, hairline borders, very soft shadows only on hover or expansion.
- Generous spacing; nothing touches. Max content width ~1100px.
- Motion limited to preview refresh crossfade and card expand.
- Avatars rendered as tiles, not a dropdown. Avatar icons are the only illustration in the app.
- Severity uses color plus a label and icon, never color alone.

### Decisions from the builder check (author's calls)

- **Success is verified, not claimed.** `done(summary)` is a claim. A separate verifier model call receives the goal, the final screenshot (or tree for Ava), final URL, and the agent's summary, and returns `reached | not_reached | unclear`. Only `reached` counts as success; `unclear` is shown as "unverified" in the report, never as a pass.
- **Per-avatar action sets.** Ava's actions are restricted to keyboard input and scrolling; the model receives the accessibility tree plus trimmed `innerText`, never a screenshot. Focus visibility, if checked, is attached as executor evidence and is not shown to Ava's model.
- **Give-up floors live in code.** The server counts consecutive evidence-backed friction steps or failed actions and ends the run at registry thresholds: Lola 4, Dev 3, Mika/Ava/Grace 5. The model may give up earlier via `give_up`.
- **Mechanical rules are enforced in code where possible.** Mika's tap miss is a seeded 30% roll on targets under 44px in either dimension; the seed is the run ID. Lola's readability judgment uses the zoomed screenshot and states uncertainty where appearance does not establish a measurement.
- **Bounding boxes come from the executor.** Resolving a tree reference to an element at action time records its bounding box on the step; the report highlight uses that box. The summarizer deduplicates issues on page URL plus accessible name, falling back to description similarity.
- **Concurrency and partial results.** Model calls go through a semaphore of 5 across selected avatars. Stop, a crashed avatar, or a cap produce a partial report from whatever steps exist; the report is never withheld. Default selection is Lola, Mika, and Dev so the demo stays fast.
- **Contexts and pages.** Each avatar has an isolated context (own cookies and storage). If the page opens a new tab, the agent follows the newest page. Downloads and native dialogs are auto-dismissed and logged as friction.

## Left to the builder

- Exact OpenAI model id; prompt quality and report thresholds should be tuned against the fixed avatar evaluation cases before real-site demos.
- How the accessibility tree is serialized and trimmed to fit the context budget.
- Zoom implementation details for Lola (CSS zoom vs deviceScaleFactor plus font injection); whichever produces screenshots the model reads correctly.
- Screenshot cadence for previews if per-step proves too chatty.
- Whether the report summarizer runs once or once per avatar then merges.
- Test coverage: one check for the action parser and one for the issue deduplication is enough; no browser tests in the hackathon window.

## Open questions

None blocking. See "Left to the builder".
