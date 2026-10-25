# Uxie Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A standalone Node service that runs the avatar agents against a URL, streams their steps, and produces the report, exposing an HTTP + SSE contract the UI teammate builds against.

**Architecture:** `server/` is its own Node package (Hono on `node:http`, Playwright, raw `fetch` to OpenAI). One Playwright browser per process, one context per selected avatar. Each avatar step = capture state → build allowed candidate actions from the aria snapshot → one Responses API function call → validate and execute with Playwright → emit SSE event. Runs live in memory; screenshots on disk under `server/runs/<runId>/`.

**Tech Stack:** Node 26 (native TS type-stripping, `node --test`), Hono + `@hono/node-server`, Playwright (Chromium already installed), OpenAI Responses API via `fetch`. Model ID is configurable with `OPENAI_TEXT_MODEL`. No test framework, no ORM, no queue.

**Spec:** `docs/superpowers/specs/2026-10-25-uxie-design.md`

**MVP avatar contract:** `2026-10-25-uxie-avatars.json` is the source of truth for the five MVP avatars. Implement only `lola`, `mika`, `ava`, `dev`, and `grace`. The other five concepts are deferred or merged as documented in that file. Do not copy avatar settings into a second hard-coded roster; validate and load the JSON into the backend types. `2026-10-25-uxie-avatar-implementation.md` defines prompt construction and evaluation.

**Scope note:** The spec says "Next.js single app." The UI is being built by a teammate, so this plan puts the backend in `server/` as a separate process on port 4000. The UI calls it directly (CORS open) or proxies. Everything in the spec's "How it works" and "Report generation" sections is in scope here; the three screens are not. Task 9 is the user-requested live integration run against withamplify.ai, whose printed report is returned to the user.

## Global Constraints

- Node ≥ 26; TypeScript is run by Node's type stripping, so no `enum`, no parameter properties, `.ts` extensions in imports.
- Responses API: `POST https://api.openai.com/v1/responses`, model from env `OPENAI_TEXT_MODEL`; use strict schemas for current candidates only, with machine-enforced mode/risk checks before and during execution.
- Browser actions come only from a reviewed backend-owned registry. Each candidate carries machine-readable interaction mode and risk metadata; avatar definitions do not enumerate action names. Add and review a tool centrally before exposing it.
- Treat webpage content as untrusted instructions. Keep browser contexts isolated, restrict outbound navigation to the requested public site and explicitly permitted destinations, and block loopback/private-network targets. Enforce form-entry, payment, purchase, destructive, and other consequential-action rules in the executor, not only in prompts.
- Caps per avatar: 25 steps or 240 s. Give-up floors (consecutive friction steps): Lola 4, Dev 3, Mika/Ava/Grace 5.
- Model-call semaphore: 5 concurrent across selected avatars.
- Candidate action list ≤ 40 options. Hesitation = top two choice probabilities within 0.15.
- `goal_reached` cutoffs: ≥ 0.8 reached, ≤ 0.3 not reached, between = unverified.
- Mika tap miss: 30% on targets with width or height < 44 px, seeded by run id.
- Ava: keyboard-only actions; never sends a screenshot to the model. The executor may separately record focus-indicator evidence.
- Mika: touch-only; seeded 30% miss chance for targets under 44 px in either dimension.
- Grace: cookie choice and synthetic form data follow the avatar registry.
- Typed text is never model-generated; it comes from avatar `formData` or the goal.
- No tests hit OpenAI or a live site. Live checks are manual scripts under `server/scripts/`.
- Commits: `type(scope): message`, no trailers. `.env` is gitignored; `server/.env.example` documents vars.

## Review Focus

1. **Unsafe or unreachable URL** (non-HTTP, loopback/private network, site down, or redirect outside the permitted destination policy): reject with 400 or end every avatar `failed` with a reason, never hang. Test URL validation in Task 7 and navigation/redirect enforcement in Tasks 4 and 5.
2. **Page navigates or re-renders between snapshot and action** (SPA transitions): resolving a candidate ref fails; must become a failed step counted as friction, not a crash. Pinned in Task 5 (`applyAction` returns `{ok:false}` on resolve error).
3. **Site opens a new tab or native dialog** (OAuth popups, `confirm()`): agent must follow the newest page and auto-dismiss dialogs, logging friction. Pinned in Task 4 (dialog handler) and manual script in Task 7.
4. **Responses API 429/5xx mid-run**: retry twice with backoff, then mark the avatar `failed` with the HTTP status in `reason`; other avatars continue. Pinned in Task 3 (`decide` retry test with a stubbed fetch).
5. **Stop pressed while agents are mid-step**: in-flight step finishes, no further steps, report is still produced from partial data. Pinned in Task 7 (stop sets `stopping`, Task 6 loop checks `run.status` each iteration, Task 8 report accepts partial runs).

---

### Task 1: Server package, types, avatars, principles stub

**Files:**
- Create: `server/package.json`, `server/tsconfig.json`, `server/.env.example`
- Create: `server/src/types.ts`, `server/src/avatars.ts`
- Create: `.agents/skills/ux-principles/SKILL.md` (stub with headings only; owner fills in)
- Test: `server/test/avatars.test.ts`

**Interfaces:**
- Produces `server/src/types.ts`:

```ts
export type AvatarId = 'lola'|'mika'|'ava'|'dev'|'grace'
export type Severity = 'blocker'|'major'|'minor'
export type Box = { x:number; y:number; width:number; height:number }
export type BrowserConfig = {
  viewport?: { width:number; height:number }
  device?: string               // Playwright devices key, e.g. 'iPhone 15'
  zoom?: number                 // CSS zoom, 2 for Lola
  reducedMotion?: boolean
  largeDefaultFont?: boolean
  touch?: boolean
  hover?: boolean
  rightClick?: boolean
  keyboardShortcuts?: boolean
  blockThirdPartyCookies?: boolean
  keyboardOnly?: boolean
  mouse?: boolean
}
export type FormData = { name:string; email:string; password:string; phone:string; search:string }
export type InteractionMode = 'keyboard'|'touch'|'pointer'|'navigation'|'text-entry'|'scroll'|'hover'|'right-click'|'coordinate-click'|'drag'
export type ActionRisk = 'read-only'|'form-entry'|'consequential'
export type SharedActionPolicy = { blockedRisks:ActionRisk[]; formEntryRequiresGoal:boolean; formDataSource:'synthetic-only' }
// Central backend metadata; never copy this action registry into each Avatar.
export type ActionToolPolicy = { kind:Action['kind']; operation:'activate'|'text-entry'|'navigate'|'scroll'|'control'; modes:InteractionMode[]; risk:ActionRisk }
export type InteractionPolicy = { preferredModes:InteractionMode[]; activationMode?:'keyboard'|'touch'|'pointer'; forbiddenModes:InteractionMode[]; hardConstraints:string[]; preferences?:string[] }
export type Avatar = {
  id: AvatarId; name:string; label:string; tagline:string; purpose:string
  browser: BrowserConfig
  perception: { screenshotToModel:boolean; accessibilityTreeToModel:boolean; visibleTextToModel?:boolean }
  interaction: InteractionPolicy
  personaInstructions:string[]
  mechanics: { giveUpAfterConsecutiveFriction:number; smallTargetMiss?: { enabled:boolean; ifWidthOrHeightBelowCssPixels:number; probability:number; seed:string; missCountsAsFriction:boolean } }
  evidence:string[]; formData:FormData
}
export type Action =
  | { kind:'click'; ref:string; label:string }
  | { kind:'tap'; ref:string; label:string }
  | { kind:'type'; ref:string; label:string; value:string }
  | { kind:'navigate'; url:string }
  | { kind:'scroll'; direction:'up'|'down' }
  | { kind:'press'; key:string }
  | { kind:'done' } | { kind:'give_up' }
export type Candidate = { value:string; description:string; action:Action; operation:'activate'|'text-entry'|'navigate'|'scroll'|'control'; modes:InteractionMode[]; risk:ActionRisk }
export type Friction = { severity:Severity; description:string; principle?:string; element?:string; box?:Box }
export type Step = {
  avatarId:AvatarId; n:number; url:string; action:Action; narration:string
  screenshot:string|null; box?:Box; friction:Friction[]
  confidence:number; goalReached:number; at:string
}
export type AvatarStatus = 'queued'|'running'|'done'|'unverified'|'gave_up'|'failed'
export type AvatarRun = { avatarId:AvatarId; status:AvatarStatus; steps:Step[]; reason?:string; startedAt:string; endedAt?:string }
export type RunStatus = 'running'|'stopping'|'finished'
export type Issue = { id:string; severity:Severity; avatarIds:AvatarId[]; pageUrl:string; element?:string; screenshot:string|null; box?:Box; description:string; principle:string; fixPrompt:string }
export type Report = { runId:string; goal:string; succeeded:number; total:number; medianSteps:number; worstBlocker?:string; issues:Issue[]; avatars:{ avatarId:AvatarId; status:AvatarStatus; steps:number; seconds:number }[] }
export type Run = { id:string; url:string; goal:string; status:RunStatus; startedAt:string; avatars:Record<string,AvatarRun>; report?:Report }
export type RunEvent =
  | { type:'step'; step:Step }
  | { type:'avatar_status'; avatarId:AvatarId; status:AvatarStatus; reason?:string }
  | { type:'run_status'; status:RunStatus }
  | { type:'report'; report:Report }
```

- Produces `server/src/avatars.ts`: load and validate the shared JSON registry, expose the five MVP avatars, and provide `getAvatar(id:string): Avatar | undefined`.

- [ ] **Step 1: Create the package**

`server/package.json`: `"type":"module"`, scripts `dev: node --watch src/index.ts`, `start: node src/index.ts`, `test: node --test test/`. Dependencies: `hono`, `@hono/node-server`, `playwright`. Dev: `@types/node`. `tsconfig.json`: `module: nodenext`, `target: es2022`, `strict`, `noEmit`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.

`server/.env.example`:
```
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=
PORT=4000
```

- [ ] **Step 2: Write the failing test**

```ts
// server/test/avatars.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { AVATARS, getAvatar } from '../src/avatars.ts'
test('five MVP avatars load from the shared registry', () => {
  assert.deepEqual(AVATARS.map(a => a.id), ['lola','mika','ava','dev','grace'])
  for (const a of AVATARS) { assert.ok(a.personaInstructions.length > 0); assert.ok(a.mechanics.giveUpAfterConsecutiveFriction >= 3) }
})
test('spec-pinned mechanics', () => {
  assert.equal(getAvatar('lola')!.mechanics.giveUpAfterConsecutiveFriction, 4); assert.equal(getAvatar('dev')!.mechanics.giveUpAfterConsecutiveFriction, 3)
  assert.equal(getAvatar('lola')!.browser.zoom, 2); assert.equal(getAvatar('mika')!.browser.device, 'iPhone 15')
  assert.equal(getAvatar('ava')!.browser.keyboardOnly, true); assert.equal(getAvatar('ava')!.perception.screenshotToModel, false)
  assert.equal(getAvatar('grace')!.mechanics.giveUpAfterConsecutiveFriction, 5)
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd server && npm install && npm test`
Expected: FAIL, cannot find `../src/avatars.ts`

- [ ] **Step 4: Implement `server/src/types.ts` (verbatim above) and `server/src/avatars.ts`**

Avatar definitions, browser settings, persona instructions, action restrictions, give-up caps, evidence requirements, and synthetic form data come from `2026-10-25-uxie-avatars.json`. Do not recreate the roster in TypeScript. The MVP avatar-specific checks are: Lola readability from the zoomed screenshot; Mika small-target size/missed tap from executor measurements; Ava keyboard/accessibility-tree availability plus executor-only focus evidence; Dev observed wasted steps; Grace exact copy/privacy behavior. Model-reported findings must include evidence references.

| avatar | check | source | report rule |
|---|---|---|---|
| Lola | readability | model screenshot observation | report with visual evidence; uncertainty allowed |
| Mika | target size / missed tap | executor measurement and seeded miss | report dimensions and action result |
| Ava | tree availability / keyboard path | accessibility snapshot and action trace | report missing/unusable goal-relevant controls; focus check is executor evidence |
| Dev | wasted steps | action trace | report only observed actions that did not advance the goal |
| Grace | trust / clarity | exact page copy or observed behavior | quote relevant text or identify behavior and element |
- [ ] **Step 5: Create the skill stub**

`.agents/skills/ux-principles/SKILL.md` with frontmatter `name: ux-principles`, `description: UI/UX principles Uxie judges against` and the six headings from the spec's "UX principles skill" section, each with one placeholder line. Content is the owner's to fill.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd server && npm test` → PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add .gitignore server .agents
git commit -m "feat(server): scaffold package, types, five MVP avatars, principles stub"
```

---

### Task 2: Candidate actions from the aria snapshot

**Files:**
- Create: `server/src/action-tools.ts`, `server/src/candidates.ts`
- Test: `server/test/candidates.test.ts`

**Interfaces:**
- Consumes: `Avatar`, `Candidate`, `Action` from Task 1.
- Produces:
  - `export function parseSnapshot(yaml:string): { role:string; name:string; index:number }[]` — interactive nodes in document order; `index` is the 0-based occurrence of the same role+name pair (used with `getByRole(...).nth(index)`).
  - `server/src/action-tools.ts` exports the reviewed central `ACTION_TOOL_POLICIES` registry. Each policy maps an action kind to operation, interaction modes, and risk. New tool kinds require a backend registration and executor implementation, never per-avatar action-list edits.
  - `export function buildCandidates(snapshot:string, avatar:Avatar, goal:string): Candidate[]` — ≤ 40 entries; derive candidates from `ACTION_TOOL_POLICIES` and current page state, tag each with operation, interaction mode, and risk, then omit candidates that conflict with `avatar.interaction.forbiddenModes` or `activationMode` (activation only). Keep prose `hardConstraints` as model guidance; enforce `shared.actionPolicy.blockedRisks`, goal-required synthetic form entry, and Grace's structured cookie/personal-data policies with deterministic state-aware backend checks. Always include compatible `done` and `give_up` controls. Do not enumerate action names in avatar JSON. Ava activates by keyboard; Mika activates by touch and never uses pointer, hover, or right-click.
  - `export function refFor(n:{role:string;name:string;index:number}): string` → `` `${role}|${name}|${index}` ``.
  - `export function fieldValue(label:string, avatar:Avatar, goal:string): string` — keyword match on label/placeholder: email→formData.email, password→password, phone/mobile→phone, search/find→ search term from goal (`/search for (.+)/i` capture) else formData.search, name→name; no match → formData.name.

Interactive roles: `link button textbox searchbox combobox checkbox radio menuitem tab switch option`. Snapshot line grammar handled: `- role "name"`, `- role "name" [attrs]`, `- role "name":` (children), `- role:` (unnamed), nested indentation.

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/candidates.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { parseSnapshot, buildCandidates, fieldValue, refFor } from '../src/candidates.ts'
import { getAvatar } from '../src/avatars.ts'
const snap = `- banner:
  - link "Sign in":
    - /url: /login
  - link "Sign in"
  - button "Menu" [expanded=false]
  - button
- main:
  - heading "Welcome" [level=1]
  - textbox "Email"
  - searchbox "Search docs"
  - link "Pricing"
  - img "hero"`
test('parseSnapshot lists interactive nodes in order with occurrence index', () => {
  const nodes = parseSnapshot(snap)
  assert.deepEqual(nodes.map(n => [n.role, n.name, n.index]), [
    ['link','Sign in',0], ['link','Sign in',1], ['button','Menu',0], ['button','',0], ['textbox','Email',0], ['searchbox','Search docs',0], ['link','Pricing',0] ])
})
test('buildCandidates: clicks, typed fields with avatar data, control actions, cap 40', () => {
  const c = buildCandidates(snap, getAvatar('grace')!, 'Search for refund policy')
  assert.ok(c.some(x => x.action.kind === 'click' && x.action.ref === refFor({role:'link',name:'Pricing',index:0})))
  const email = c.find(x => x.action.kind === 'type' && x.action.label === 'Email')!
  assert.equal((email.action as any).value, getAvatar('grace')!.formData.email)
  const search = c.find(x => x.action.kind === 'type' && x.action.label === 'Search docs')!
  assert.equal((search.action as any).value, 'refund policy')
  assert.deepEqual(c.slice(-5).map(x => x.value), ['scroll_down','scroll_up','press_escape','done','give_up'])
  const big = Array.from({length: 80}, (_, i) => `- link "L${i}"`).join('\n')
  assert.equal(buildCandidates(big, getAvatar('grace')!, 'x').length, 40)
})
test('Ava mode constraints filter candidates without an avatar action allowlist', () => {
  const c = buildCandidates(snap, getAvatar('ava')!, 'log in')
  assert.ok(c.every(x => !x.modes.some(mode => getAvatar('ava')!.interaction.forbiddenModes.includes(mode))))
  assert.ok(c.some(x => x.operation === 'activate' && x.modes.includes('keyboard')))
})
test('fieldValue falls back to name and logs nothing itself', () => {
  assert.equal(fieldValue('Favourite color', getAvatar('lola')!, 'x'), getAvatar('lola')!.formData.name)
  assert.equal(fieldValue('Password', getAvatar('lola')!, 'x'), getAvatar('lola')!.formData.password)
})
```

Add registry-extension and state-guard tests: a newly registered keyboard-compatible tool must be offered to Ava without changing her avatar JSON, while a pointer-only tool must be filtered out; blocked-risk actions and Grace's cookie/personal-data rules must be enforced by backend checks.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npm test -- test/candidates.test.ts` → FAIL, module not found

- [ ] **Step 3: Implement `server/src/candidates.ts`**

Candidate `value` for element actions is `click_<i>` / `type_<i>` (i = position in list); `description` is `click <role> "<name>"` or `type "<value>" into <role> "<name>"`. Unnamed elements get description `click <role> (unlabeled)`. When trimming to 40, keep control actions and drop element actions from the end.

- [ ] **Step 4: Run tests** → PASS (4 tests)

- [ ] **Step 5: Commit** — `feat(server): build candidate actions from aria snapshot`

---

### Task 3: Model client: action selection, narration, summarizer

**Files:**
- Create: `server/src/judge.ts`, `server/src/semaphore.ts`
- Create: `server/scripts/smoke-responses.ts` (manual, live)
- Test: `server/test/judge.test.ts`

**Interfaces:**
- Consumes: `Avatar`, `Candidate`, `Action` from Task 1.
- Produces:

```ts
export type StepInput = { avatar:Avatar; goal:string; url:string; title:string; snapshot:string; pageText?:string; screenshotB64?:string; focused?:string; history:string[]; candidates:Candidate[] }
export type Decision = { candidate:Candidate; narration:string; friction?:{ severity:'blocker'|'major'|'minor'; description:string; evidenceRef?:string }; confidence:number; goalReached:number }
export function buildDecisionRequest(input:StepInput): object        // pure; strict:true schemas for current compatible candidates only
export async function decide(input:StepInput, fetchImpl?: typeof fetch): Promise<Decision>   // semaphore(5), retry 2× on 429/5xx with 500ms·2^n backoff
export async function narrate(avatar:Avatar, action:Action, friction:Friction[], fetchImpl?: typeof fetch): Promise<string>   // Responses API, one line ≤ 140 chars, in persona
export async function summarize(prompt:string, schema:object, fetchImpl?: typeof fetch): Promise<any>   // Responses API with json_schema structured output, returns parsed object
```

Request shape: provide stable base rules, goal, avatar instructions from the JSON registry, current URL/title, trimmed accessibility tree, last 6 history lines, and only the perception inputs allowed by that avatar. Expose one strict:true `select_candidate` function whose `candidate_id` enum contains only the already-filtered current candidates; include structured narration, friction, confidence, and goal-assessment fields. For strict mode, set `additionalProperties:false` and mark every schema property required (use nullable values for optional fields). Resolve the ID to its server-owned action. Validate it still exists and its target reference is fresh, then recheck mode and state-dependent safety rules before execution. Avatar preferences guide model choice but do not define an exhaustive action list. Set `tool_choice:'required'` and `parallel_tool_calls:false` to enforce exactly one selection per decision. Ava receives page text and accessibility tree but no screenshot. The server performs goal verification against the final page state in a separate call.

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/judge.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { buildDecisionRequest, decide } from '../src/judge.ts'
import { getAvatar } from '../src/avatars.ts'
import { buildCandidates } from '../src/candidates.ts'
const base = (id:string) => ({ avatar:getAvatar(id)!, goal:'log in', url:'https://x.test', title:'X', snapshot:'- link "Sign in"', history:[], candidates:buildCandidates('- link "Sign in"', getAvatar(id)!, 'log in') })
test('request exposes current candidates only; Ava has no image and only keyboard-compatible candidates', () => {
  const r:any = buildDecisionRequest({ ...base('dev'), screenshotB64:'AAA=' })
  assert.ok(r.tools.some((tool:any) => tool.type === 'function'))
  assert.ok(r.input[0].content.some((c:any) => c.type === 'input_image'))
  const a:any = buildDecisionRequest({ ...base('ava'), screenshotB64:'AAA=' })
  assert.ok(!a.input[0].content.some((c:any) => c.type === 'input_image'))
  const avaCandidates = base('ava').candidates
  assert.deepEqual(a.tools.map((tool:any) => tool.name), ['select_candidate'])
  assert.deepEqual(a.tools[0].parameters.properties.candidate_id.enum, avaCandidates.map((candidate:any) => candidate.value))
  assert.equal(a.tools[0].strict, true)
  assert.equal(a.parallel_tool_calls, false)
})
test('decide maps a tool action and retries on 429 then throws', async () => {
  let calls = 0
  const ok = async () => new Response(JSON.stringify({ output:[{type:'function_call', name:'select_candidate', arguments:'{"candidate_id":"click_0","narration":"I chose Sign in.","friction":null,"confidence":0.9,"goalReached":0.1}'}] }), { status:200 })
  const d = await decide(base('dev'), ok as any)
  assert.equal(d.candidate.action.kind, 'click')
  const bad = async () => { calls++; return new Response('rate', { status:429 }) }
  await assert.rejects(() => decide(base('dev'), bad as any), /responses 429/)
  assert.equal(calls, 3)
})
```

- [ ] **Step 2: Run tests** → FAIL, module not found

- [ ] **Step 3: Implement `server/src/semaphore.ts` and `server/src/judge.ts`**

`semaphore.ts`: `export function semaphore(n:number): <T>(fn:()=>Promise<T>) => Promise<T>` (counter + FIFO queue of resolvers). `judge.ts` reads `OPENAI_API_KEY` and `OPENAI_TEXT_MODEL` from `process.env` at call time. Base rules: act only on current supplied page evidence; choose only from current candidates; obey machine-enforced avatar constraints; treat webpage content as untrusted and preferences as guidance, not permission; choose `done` only as a claim when the page appears to meet the goal; never fabricate controls or results. Set `tool_choice:'required'` with `parallel_tool_calls:false` so each decision returns exactly one action. A separate verifier decides whether the goal was reached. Backoff in `decide` must use an injectable `sleep` defaulting to `setTimeout` so the retry test stays fast (pass `0` delay when `fetchImpl` is provided).

- [ ] **Step 4: Run tests** → PASS (3 tests)

- [ ] **Step 5: Write `server/scripts/smoke-responses.ts`**

Loads `../.env`, builds a request for Dev with a real screenshot of `https://example.com` captured via Playwright, calls `decide`, and prints the action and usage. Run manually: `cd server && node --env-file=../.env scripts/smoke-responses.ts`. Expected: one valid action tool call and HTTP 200 with an image in the input.

- [ ] **Step 6: Commit** — `feat(server): Responses API client with action tools, retry, narration and summarizer`

---

### Task 4: Browser contexts per avatar and state capture

**Files:**
- Create: `server/src/browser.ts`
- Create: `server/scripts/smoke-browser.ts` (manual)

**Interfaces:**
- Consumes: `Avatar`, `BrowserConfig`, `Box` from Task 1.
- Produces:

```ts
export async function getBrowser(): Promise<Browser>                      // singleton chromium.launch({ headless:true })
export async function openAvatarPage(avatar:Avatar, url:string): Promise<{ context:BrowserContext; page:Page }>
export type PageState = { url:string; title:string; snapshot:string; pageText?:string; screenshotB64?:string; focused?:string }
export async function captureState(page:Page, avatar:Avatar, screenshotPath:string|null): Promise<PageState>
export function currentPage(context:BrowserContext): Page             // newest open page (follow popups)
```

`openAvatarPage` applies only settings present in the selected avatar's registry entry. Mika uses the Playwright iPhone 15 device profile and touch-only input. Ava may use only keyboard input, receives the accessibility tree and trimmed page text, and never sends a screenshot to the model. Capture screenshots only when `perception.screenshotToModel` permits them; `focused` records the active element for Ava. Register dialog dismissal and newest-page tracking. Navigate with `page.goto(url, { waitUntil:'domcontentloaded', timeout:30000 })`; the caller handles errors. Record executor-only focus visibility evidence separately; never include screenshots in Ava's model input.

Grace's third-party cookie setting is best-effort context configuration. If Playwright cannot enforce it consistently, record that limitation and do not claim the scenario blocked cookies.

- [ ] **Step 1: Implement `server/src/browser.ts`** as specified. No unit test (browser-bound); the smoke script is the check.

- [ ] **Step 2: Write `server/scripts/smoke-browser.ts`**

Opens `https://example.com` as `lola`, `mika`, `ava`, `dev`, and `grace`; saves screenshots for avatars whose registry allows model vision, prints snapshot/page-text lengths for Ava, closes the browser.

- [ ] **Step 3: Run it**

Run: `cd server && node scripts/smoke-browser.ts && open runs/smoke`
Expected: four avatar screenshots; Lola's is visibly zoomed, Mika's is phone-shaped, and Ava prints a non-empty `pageText` without creating or sending a model screenshot.

- [ ] **Step 4: Commit** — `feat(server): per-avatar browser contexts and state capture`

---

### Task 5: Action executor

**Files:**
- Create: `server/src/executor.ts`, `server/src/rng.ts`
- Test: `server/test/executor.test.ts`

**Interfaces:**
- Consumes: `Action`, `Avatar`, `Box` from Task 1; `Page` from Playwright.
- Produces:

```ts
export function seededRng(seed:string): () => number           // rng.ts: mulberry32 over fnv1a(seed)
export type ExecResult = { ok:boolean; box?:Box; element?:string; reason?:string; missed?:boolean; timedOut?:boolean; focusVisible?:boolean }
export async function applyAction(page:Page, action:Action, avatar:Avatar, rng:()=>number, waitMs:number): Promise<ExecResult>
export function resolveLocator(page:Page, ref:string): Locator       // `role|name|index` → getByRole(role,{name,exact:true}).nth(index); empty name → getByRole(role).nth(index)
export function shouldMiss(box:Box|undefined, avatar:Avatar, rng:()=>number): boolean   // use Mika's configured dimensions/probability from the registry
```

Behavior: resolve locator, record `boundingBox()` and element reference, then revalidate the action against the reviewed registry, current candidate set, avatar mode restrictions, and state-dependent safety rules before execution. Execute click, Mika touch tap, fill, scroll, key press, or validated navigation only when permitted. Never trust the model or page text to authorize a new tool or consequential action. Any Playwright error → `{ok:false, reason: err.message}`. Mika miss → no tap, `{ok:false, missed:true, box}`. Apply the registry's seeded miss probability only to targets below its configured dimensions. Use the shared navigation wait timeout; the deferred Paolo performance scenario is out of MVP scope.

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/executor.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { seededRng } from '../src/rng.ts'; import { shouldMiss } from '../src/executor.ts'; import { getAvatar } from '../src/avatars.ts'
test('seeded rng is deterministic per seed', () => {
  const a = seededRng('run-1'), b = seededRng('run-1'), c = seededRng('run-2')
  const seq = (r:()=>number) => Array.from({length:5}, r)
  assert.deepEqual(seq(a), seq(b)); assert.notDeepEqual(seq(a), seq(c))
})
test('Mika misses ~30% of small targets, never large ones, others never miss', () => {
  const mika = getAvatar('mika')!, dev = getAvatar('dev')!
  const small = { x:0, y:0, width:30, height:30 }, big = { x:0, y:0, width:120, height:48 }
  let r = seededRng('s'); let misses = 0; for (let i = 0; i < 1000; i++) if (shouldMiss(small, mika, r)) misses++
  assert.ok(misses > 250 && misses < 350, String(misses))
  r = seededRng('s'); assert.equal(shouldMiss(big, mika, r), false); assert.equal(shouldMiss(small, dev, r), false)
})
```

- [ ] **Step 2: Run tests** → FAIL

- [ ] **Step 3: Implement `server/src/rng.ts` and `server/src/executor.ts`**

- [ ] **Step 4: Run tests** → PASS (2 tests)

- [ ] **Step 5: Commit** — `feat(server): action executor with seeded tap misses and timeouts`

---

### Task 6: Avatar agent loop

**Files:**
- Create: `server/src/agent.ts`
- Test: `server/test/agent.test.ts`

**Interfaces:**
- Consumes: `openAvatarPage`, `captureState`, `currentPage` (Task 4); `buildCandidates` (Task 2); `decide`, `narrate` (Task 3); `applyAction`, `seededRng` (Task 5); types from Task 1.
- Produces:

```ts
export type AgentCtx = { runId:string; url:string; goal:string; avatar:Avatar; runDir:string; isStopping:()=>boolean; emit:(e:RunEvent)=>void }
export async function runAvatar(ctx:AgentCtx): Promise<AvatarRun>
export function frictionFromStep(decision:Decision, exec:ExecResult, avatar:Avatar): Friction[]     // pure
export function consecutiveFriction(steps:Step[]): number                                            // pure: trailing steps with friction.length>0
export function finalStatus(goalReached:number, lastAction:Action, reason:'cap'|'gave_up'|'stopped'|'done'): AvatarStatus
```

Loop per step (n from 1): `isStopping()` → break with `stopped`; elapsed > 240 s or n > 25 → break `cap`; capture state according to avatar perception policy; build candidates from the reviewed backend registry and current page, filtering by machine-readable mode constraints and state-dependent guards; call `decide` (on throw → status `failed`, reason = message, break); revalidate the selected candidate and target before execution; `done` ends the attempt and triggers separate goal verification; `give_up` ends as gave_up; otherwise execute the action. Build a Step with the returned narration and friction plus executor evidence; emit it. If the trailing friction count reaches `avatar.mechanics.giveUpAfterConsecutiveFriction`, end as gave_up. Navigation failure → status failed with reason. Always close the context in `finally`.

`frictionFromStep` rules: `exec.ok === false` → major "Could not act on <element>" (Mika miss → minor "Tapped <element> and missed"); include model-reported friction only when it cites current page evidence; include executor measurements for target size, focus path, URL, and action outcome. Do not count model uncertainty alone as a usability issue.

`finalStatus`: `done` with goalReached ≥ 0.8 → `done`; `done` with 0.3 < g < 0.8 → `unverified`; `done` with g ≤ 0.3 → `gave_up` (reason "claimed done, not verified"); `gave_up` → `gave_up`; `cap`/`stopped` → `gave_up` unless g ≥ 0.8 → `done`.

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/agent.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { frictionFromStep, consecutiveFriction, finalStatus } from '../src/agent.ts'
import { getAvatar } from '../src/avatars.ts'
const dec = (o:any) => ({ candidate:{value:'click_0',description:'click link "x"',action:{kind:'click',ref:'link|x|0',label:'x'}}, confidence:0.9, ...o })
test('friction: failed action, miss, evidence-backed model finding, executor focus finding', () => {
  assert.equal(frictionFromStep(dec({}), { ok:false, reason:'gone' }, getAvatar('dev')!)[0].severity, 'major')
  assert.equal(frictionFromStep(dec({}), { ok:false, missed:true }, getAvatar('mika')!)[0].severity, 'minor')
  assert.equal(frictionFromStep(dec({ friction:{severity:'major',description:'Unlabeled control',evidenceRef:'button|0'} }), { ok:true }, getAvatar('ava')!)[0].severity, 'major')
  assert.equal(frictionFromStep(dec({}), { ok:true, focusVisible:false }, getAvatar('ava')!)[0].severity, 'major')
})
test('consecutiveFriction counts trailing run only', () => {
  const s = (f:boolean) => ({ friction: f ? [{severity:'minor',description:'x'}] : [] }) as any
  assert.equal(consecutiveFriction([s(true), s(false), s(true), s(true)]), 2)
})
test('finalStatus applies the 0.8 / 0.3 cutoffs', () => {
  assert.equal(finalStatus(0.9, {kind:'done'}, 'done'), 'done')
  assert.equal(finalStatus(0.5, {kind:'done'}, 'done'), 'unverified')
  assert.equal(finalStatus(0.1, {kind:'done'}, 'done'), 'gave_up')
  assert.equal(finalStatus(0.85, {kind:'scroll',direction:'down'}, 'cap'), 'done')
  assert.equal(finalStatus(0.2, {kind:'scroll',direction:'down'}, 'stopped'), 'gave_up')
})
```

- [ ] **Step 2: Run tests** → FAIL

- [ ] **Step 3: Implement `server/src/agent.ts`**

- [ ] **Step 4: Run tests** → PASS (3 tests)

- [ ] **Step 5: Commit** — `feat(server): avatar agent loop with caps, friction floors and verified completion`

---

### Task 7: Run store and HTTP + SSE API

**Files:**
- Create: `server/src/run.ts`, `server/src/index.ts`
- Create: `server/API.md` (the UI contract, for the teammate)
- Test: `server/test/run.test.ts`

**Interfaces:**
- Consumes: `runAvatar` (Task 6), `AVATARS`/`getAvatar` (Task 1), `getBrowser` (Task 4), `buildReport` (Task 8, called when all avatars end; stub returning `undefined` until Task 8 lands).
- Produces `run.ts`:

```ts
export type RunRequest = { url:string; goal:string; avatarIds:AvatarId[] }
export function parseRunRequest(body:unknown): RunRequest       // throws Error with message on: non-object, url not http(s) or hostname without a dot, empty goal → defaults to "Scroll the landing page and understand what this is", avatarIds empty/unknown
export function createRun(req:RunRequest): Run                  // id = crypto.randomUUID(), runDir server/runs/<id>, starts all avatars in parallel via runAvatar
export function getRun(id:string): Run | undefined
export function stopRun(id:string): void                        // status → 'stopping'
export function subscribe(id:string, fn:(e:RunEvent)=>void): () => void
```

`index.ts` routes (Hono, `cors()` open, port from `PORT` default 4000):

| Method | Path | Response |
|---|---|---|
| GET | `/avatars` | UI-safe avatar metadata only (`id`, `name`, `label`, `tagline`, `purpose`) |
| POST | `/runs` | `{ runId }` or 400 `{ error }` |
| GET | `/runs/:id` | `Run` (404 if unknown) |
| GET | `/runs/:id/events` | SSE; first sends a `run_status` and every existing step, then live `RunEvent`s; `event:` = `type`, `data:` = JSON |
| POST | `/runs/:id/stop` | `{ ok:true }` |
| GET | `/runs/:id/report.md` | `text/markdown` (404 until the report exists) |
| GET | `/screenshots/:runId/:file` | PNG from `server/runs/<runId>/<file>` |

`Step.screenshot` is stored as the public path `/screenshots/<runId>/<file>` so the UI uses it directly.

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/run.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { parseRunRequest } from '../src/run.ts'
test('parseRunRequest validates url and avatars, defaults goal', () => {
  assert.throws(() => parseRunRequest({ url:'localhost:3000', goal:'x', avatarIds:['dev'] }), /url/)
  assert.throws(() => parseRunRequest({ url:'ftp://a.com', goal:'x', avatarIds:['dev'] }), /url/)
  assert.throws(() => parseRunRequest({ url:'https://a.com', goal:'x', avatarIds:[] }), /avatar/)
  assert.throws(() => parseRunRequest({ url:'https://a.com', goal:'x', avatarIds:['nobody'] }), /avatar/)
  const r = parseRunRequest({ url:'https://a.com', goal:'', avatarIds:['dev','lola'] })
  assert.equal(r.goal, 'Scroll the landing page and understand what this is'); assert.deepEqual(r.avatarIds, ['dev','lola'])
})
```

- [ ] **Step 2: Run tests** → FAIL

- [ ] **Step 3: Implement `server/src/run.ts` and `server/src/index.ts`**

Subscribers: a `Set<fn>` per run; `emit` writes to each and appends steps to `run.avatars[id].steps`. When every avatar has ended: `run.status = 'finished'`, `run.report = await buildReport(run)`, emit `report` and `run_status`. SSE via Hono `streamSSE`; on client abort, unsubscribe.

- [ ] **Step 4: Write `server/API.md`**

The route table above, the `RunEvent`/`Step`/`Report` types copied from `types.ts`, the avatar id list, and one `curl` plus one `EventSource` example. This file is what the UI teammate reads.

- [ ] **Step 5: Run tests** → PASS

- [ ] **Step 6: Live check**

Run: `cd server && node --env-file=../.env src/index.ts` then in another terminal:
```bash
curl -s localhost:4000/runs -H 'content-type: application/json' -d '{"url":"https://example.com","goal":"Find the link to more information","avatarIds":["dev","lola"]}'
curl -N localhost:4000/runs/<runId>/events
```
Expected: `step` events for both avatars within ~10 s, PNGs under `server/runs/<runId>/`, then `avatar_status` for each and `run_status: finished`. Press stop via `curl -X POST .../stop` on a second run and confirm the loop ends after the in-flight step.

- [ ] **Step 7: Commit** — `feat(server): run store, HTTP routes, SSE stream and API contract`

---

### Task 8: Report: dedupe, summarizer, markdown

**Files:**
- Create: `server/src/report.ts`
- Modify: `server/src/run.ts` (replace the stub import)
- Test: `server/test/report.test.ts`

**Interfaces:**
- Consumes: `Run`, `Step`, `Friction`, `Issue`, `Report` (Task 1); `summarize` (Task 3); skill file `.agents/skills/ux-principles/SKILL.md`.
- Produces:

```ts
export type Cluster = { key:string; pageUrl:string; element?:string; severity:Severity; avatarIds:AvatarId[]; samples:{ avatarId:AvatarId; step:Step; friction:Friction }[] }
export function clusterFriction(run:Run): Cluster[]           // pure: key = pathname + '|' + (element ?? principle ?? description.slice(0,40)); severity = max over samples; sorted by severity rank then avatar count desc
export async function buildReport(run:Run, summarizeImpl?: typeof summarize): Promise<Report>
export function reportMarkdown(report:Report): string
```

`buildReport`: `clusterFriction`, then one `summarize` call whose prompt contains the skill file text, the goal, each cluster's samples (avatar name, narration, friction description, element, page), and the fix-prompt template verbatim from the spec; JSON schema returns `issues: [{ clusterKey, description, principle, fixPrompt }]`. Issues keep the cluster's `severity`, `avatarIds`, `pageUrl`, `element`, first sample's `screenshot` and `box`. If `summarize` throws, issues fall back to the cluster's own description with `principle: 'unclassified'` and an unfilled template, so a report is always produced. `worstBlocker` = first blocker's description. `medianSteps` over all avatars. `avatars[]` from `AvatarRun` (seconds from `startedAt`/`endedAt`).

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/report.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { clusterFriction, buildReport, reportMarkdown } from '../src/report.ts'
const step = (avatarId:any, n:number, url:string, friction:any[]) => ({ avatarId, n, url, action:{kind:'scroll',direction:'down'}, narration:'', screenshot:null, friction, confidence:1, goalReached:0, at:'' })
const run:any = { id:'r', url:'https://a.com', goal:'g', status:'finished', startedAt:'2026-10-25T00:00:00Z', avatars:{
  lola:{ avatarId:'lola', status:'gave_up', startedAt:'2026-10-25T00:00:00Z', endedAt:'2026-10-25T00:01:00Z', steps:[ step('lola',1,'https://a.com/login',[{severity:'major',description:'Could not act on link|Sign in|0',element:'link|Sign in|0'}]) ] },
  mika:{ avatarId:'mika', status:'done', startedAt:'2026-10-25T00:00:00Z', endedAt:'2026-10-25T00:00:30Z', steps:[ step('mika',1,'https://a.com/login?x=1',[{severity:'blocker',description:'Tapped and missed',element:'link|Sign in|0'}]), step('mika',2,'https://a.com/',[]) ] } } }
test('clusterFriction merges same element on same path across avatars, max severity, blockers first', () => {
  const c = clusterFriction(run)
  assert.equal(c.length, 1); assert.equal(c[0].severity, 'blocker'); assert.deepEqual(c[0].avatarIds.sort(), ['lola','mika'])
})
test('buildReport survives a failing summarizer and reportMarkdown renders issues', async () => {
  const r = await buildReport(run, (async () => { throw new Error('down') }) as any)
  assert.equal(r.succeeded, 1); assert.equal(r.total, 2); assert.equal(r.issues[0].principle, 'unclassified')
  assert.match(reportMarkdown(r), /## Issues[\s\S]*blocker/)
})
```

- [ ] **Step 2: Run tests** → FAIL

- [ ] **Step 3: Implement `server/src/report.ts`; point `run.ts` at it**

- [ ] **Step 4: Run tests** → PASS

- [ ] **Step 5: Live check**

Repeat Task 7's live run; `curl localhost:4000/runs/<id>/report.md` prints a report with at least the avatar outcome table, and `GET /runs/<id>` has `report.issues` with real `fixPrompt` text.

- [ ] **Step 6: Commit** — `feat(server): report clustering, summarizer and markdown export`

---

### Task 9: End-to-end integration run against withamplify.ai

**Files:**
- Create: `server/scripts/e2e.ts` (manual, live; not part of `npm test`)
- Output: `server/runs/e2e-withamplify/` (gitignored under `server/runs/`)

**Interfaces:**
- Consumes: the HTTP API from Task 7 (`POST /runs`, `GET /runs/:id/events`, `GET /runs/:id/report.md`).

The script is the user's requested integration test. It starts the server in-process (import `index.ts` with `PORT=4100`), posts a run for `https://withamplify.ai` with goal `Sign up for an account` and avatars `lola`, `mika`, `dev`, follows the SSE stream printing one line per step (`[avatar] #n action — narration`, plus `⚠ friction` lines), waits for `run_status: finished`, then prints the full `report.md` to stdout and writes it to `server/runs/e2e-withamplify/report.md`. It also copies every PNG for the run into a new flat folder `~/Desktop/uxie-e2e-withamplify/` and opens it in Finder (per the user's review preference).

- [ ] **Step 1: Write `server/scripts/e2e.ts`** as described. Exit code 1 if the run does not finish within 6 minutes or if any avatar ends `failed` with a `navigation:` reason (site unreachable means the test is void, not passed).

- [ ] **Step 2: Add `server/runs/` to `.gitignore`** if not already present (Task 7 writes screenshots there).

- [ ] **Step 3: Run it**

Run: `cd server && node --env-file=../.env scripts/e2e.ts`
Expected: three avatars stream steps; the report lists each avatar's outcome and at least one issue card with a principle and a fix prompt; the Desktop folder opens with the screenshots. Paste the printed report and the Desktop path into the hand-off message to the user, in full, since they asked to see the output.

- [ ] **Step 4: Commit** — `test(server): end-to-end run script against withamplify.ai`

---

## Self-review notes

- Spec coverage: launch/run/report screens are out of scope by the user's instruction; `GET /avatars` supplies the five MVP tiles, SSE supplies previews and narration, and `Report` supplies every field the report screen lists. The five-avatar registry, prompt contract, caps, floors, synthetic form data, accessibility snapshot, Responses API action tools, principles skill (stub + summarizer use), partial reports, popups and dialogs, and single-module model access (`judge.ts`) are each in a task.
- Not covered by tests: anything browser-bound (Tasks 4 and 5's `applyAction`) and the live model calls; those have manual scripts with expected outputs.
