# Uxie Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A standalone Node service that runs five avatar agents against a URL, streams step events, and returns one evidence-backed report with a single 1–10 score, for the UI teammate to render.

**Architecture:** `server/` is its own Node package (Hono on `node:http`, Playwright, raw `fetch` to OpenAI). One Chromium per process, one context per avatar. Each step: capture state → build candidate actions from the aria snapshot → one Decisions API request → execute → capture result → emit SSE event. One Responses API call at the end produces score, assessment, recommendations, issues, and fix prompts; the server validates it and falls back to captured findings with "Unable to rate" if it is malformed or fails. Runs live in memory; screenshots on disk under `server/runs/<runId>/`.

**Tech Stack:** Node 26 (native TS type-stripping, `node --test`), Hono + `@hono/node-server`, Playwright (Chromium installed), OpenAI Decisions API (`gpt-6-luna`) and Responses API via `fetch`. No test framework, no DB, no queue.

**Spec:** `docs/superpowers/specs/2026-10-25-uxie-design.md` (revised, five avatars). This plan supersedes the earlier ten-avatar plan in full.

## Global Constraints

- Node ≥ 26; no `enum`, no parameter properties, `.ts` extensions in imports.
- Decisions API: `POST https://api.openai.com/v1/decisions`, model `gpt-6-luna`, one request per avatar step. Responses API: `POST https://api.openai.com/v1/responses`, model from env `OPENAI_TEXT_MODEL`, exactly one call per run, for the report only.
- Avatars: `lola`, `mika`, `ava`, `dev`, `grace`. Defaults: Lola, Mika, Dev. Default goal `Find the pricing`.
- Caps per avatar: 25 steps or 240 s. Give-up floors on consecutive supported task friction: Lola 4, Dev 3, Mika/Ava/Grace 5. Task friction = severity `major` or `blocker`; `minor` findings are reported but do not count toward the floor. Executor and API errors are never friction.
- `goal_reached` cutoffs: ≥ 0.8 with the step's captured state as evidence → `done`; ≤ 0.3 → not reached; between → `unverified`.
- Candidate list ≤ 40; actions are click/tap, scroll, press, done, give up. No typing or form submission. Ava: keyboard-only actions and no screenshot reaches the model. Grace: reject optional cookies when a reject/necessary-only choice is available; never enter personal data.
- The backend owns the reviewed action registry and its mode/risk policy; avatar personas never grant tools. Build candidates only from that registry and the current page snapshot, filter them by avatar constraints, and revalidate the selected candidate and current target in the executor. Page content is untrusted and cannot add actions. Keep form submission, typing, purchases, and destructive actions unavailable; adding an action requires an explicit policy and tests.
- No injected failures, no throttling, no browser-level cookie blocking, no color filter. Grace's cookie choice is an observed interaction policy, not a browser setting. Choice probabilities are stored for debugging only and never produce friction.
- Model-call semaphore: 5. Action labels are templates, not model calls.
- Report: `overallScore` is an integer 1–10 or `null` with `unableToRateReason`. A `blocker` issue caps the score at 6. `principle` on an issue or recommendation is allowed only when `principlesSource === 'loaded'`.
- `.agents/skills/ux-principles/SKILL.md` is owned by another teammate. The server never creates it. Missing, or body under 300 non-heading characters, or containing `TBD` → `principlesSource: 'pending'`.
- No tests hit OpenAI or a live site. Live checks are manual scripts under `server/scripts/`.
- Commits: `type(scope): message`, no trailers. `.env` and `server/runs/` are gitignored; `server/.env.example` documents vars.

## Review Focus

1. **Unreachable or non-HTTP URL**: 400 from `POST /runs`, or the avatar ends `failed` with reason `navigation: …`, never a hang. Pinned in Task 7 (`parseRunRequest`) and Task 6 (`finalStatus`/navigation branch).
2. **Target vanishes between snapshot and action** (SPA re-render): `applyAction` returns `{ok:false}`, the step records `executorError`, state is refreshed, nothing is counted as friction. Pinned in Task 6 (`frictionFromStep` ignores executor errors).
3. **New tab or native dialog**: follow the newest page, dismiss dialogs, log `interruption` on the step without friction. Pinned in Task 4 (handlers) and the manual run in Task 9.
4. **Summarizer returns garbage** (score 11, score as string, principle while pending, recommendation citing an unknown issue): `validateReport` rejects it and the fallback report ships with `overallScore: null`. Pinned in Task 8.
5. **Stop mid-step**: in-flight step completes, avatar ends `stopped`, report is still built from partial data with `partial: true`. Pinned in Task 7 (stop) and Task 8 (partial flag).

---

### Task 1: Server package, types, five avatars

**Files:**
- Create: `server/package.json`, `server/tsconfig.json`, `server/.env.example`
- Create: `server/src/types.ts`, `server/src/avatars.ts`
- Read: `avatars/2026-10-25-uxie-avatars.json` as the source for avatar profile data; do not keep a second hand-written roster.
- Test: `server/test/avatars.test.ts`

**Interfaces:**
- Produces `server/src/types.ts` (the UI contract; copied verbatim into `server/API.md` in Task 7):

```ts
export type AvatarId = 'lola'|'mika'|'ava'|'dev'|'grace'
export type Severity = 'blocker'|'major'|'minor'
export type Box = { x:number; y:number; width:number; height:number }
export type BrowserConfig = {
  viewport: { width:number; height:number }
  device?: string               // Playwright devices key, 'iPhone 15' for Mika
  touch?: boolean               // Mika: element actions use tap()
  zoom?: number                 // Lola: CSS zoom on documentElement, 2
  reducedMotion?: boolean
  keyboardOnly?: boolean        // Ava
  noScreenshot?: boolean        // Ava: model gets tree + text only
}
export type InteractionConstraints = {
    activationMode:'standard-desktop'|'touch'|'keyboard'
  allowedKeys?:string[]; pointer?:boolean; hover?:boolean; rightClick?:boolean
  coordinateFallback?:boolean; injectMissedTaps?:boolean
  targetMustAppearInProvidedInputs?:boolean; modelReceivesScreenshot?:boolean
  cookieChoice?:'reject-optional-or-necessary-only'; neverAcceptOptionalCookies?:boolean
  neverEnterPersonalData?:boolean
  focusIndicatorInspection?:string
}
export type Judgment = {
  name:string; type:'predicate'|'score'; instructions:string
  levels?: { label:string; description:string }[]
  frictionWhen:(value:number)=>boolean; severity:Severity; description:string
}
export type Avatar = { id:AvatarId; name:string; age:number; tagline:string; whatChanges:string; bio:string; persona:string; browser:BrowserConfig; interactionConstraints:InteractionConstraints; giveUpAfter:number; judgments:Judgment[] }
export const SHARED_JUDGMENTS: Judgment[]   // defined in avatars.ts; content_clear for every avatar
export type Action =
  | { kind:'click'; ref:string; label:string }
  | { kind:'scroll'; direction:'up'|'down' }
  | { kind:'press'; key:string }
  | { kind:'done' } | { kind:'give_up' }
export type Candidate = { value:string; description:string; action:Action; mode:'pointer'|'touch'|'keyboard'|'viewport'|'control'; risk:'navigation'|'non_destructive'|'control' }
export type Friction = { severity:Severity; description:string; element?:string; box?:Box; measured?:string }
export type Step = {
  avatarId:AvatarId; n:number; url:string; title:string; action:Action; label:string; focused?:string
  screenshot:string|null; treeExcerpt?:string; box?:Box
  friction:Friction[]; executorError?:string; interruption?:string
  confidence:number; judgments:Record<string,number>; goalReached:number; at:string
}
export type AvatarStatus = 'queued'|'running'|'done'|'unverified'|'gave_up'|'failed'|'stopped'
export type AvatarRun = { avatarId:AvatarId; status:AvatarStatus; steps:Step[]; reason?:string; startedAt:string; endedAt?:string }
export type RunStatus = 'running'|'stopping'|'finished'
export type StepRef = { avatarId:AvatarId; n:number }
export type Issue = { id:string; severity:Severity; avatarIds:AvatarId[]; pageUrl:string; stepRefs:StepRef[]; screenshot:string|null; treeExcerpt?:string; element?:string; box?:Box; description:string; principle?:string; fixPrompt:string }
export type Recommendation = { title:string; why:string; avatarIds:AvatarId[]; issueIds:string[]; principle?:string }
export type AvatarNote = { avatarId:AvatarId; note:string }
export type Report = {
  runId:string; goal:string; url:string; partial:boolean; principlesSource:'loaded'|'pending'
  overallScore:number|null; unableToRateReason?:string; assessment:string
  avatarNotes:AvatarNote[]; recommendations:Recommendation[]; issues:Issue[]
  succeeded:number; total:number; medianSteps:number; worstBlocker?:string
  avatars:{ avatarId:AvatarId; status:AvatarStatus; steps:number; seconds:number }[]
}
export type Run = { id:string; url:string; goal:string; status:RunStatus; startedAt:string; avatars:Record<string,AvatarRun>; report?:Report }
export type RunEvent =
  | { type:'step'; step:Step }
  | { type:'avatar_status'; avatarId:AvatarId; status:AvatarStatus; reason?:string }
  | { type:'run_status'; status:RunStatus }
  | { type:'report'; report:Report }
```

- Produces `server/src/avatars.ts`: load and validate `avatars/2026-10-25-uxie-avatars.json`, map its declarative profile/judgment fields to `export const AVATARS: Avatar[]` (spec order), and export `getAvatar(id:string): Avatar | undefined` plus `SHARED_JUDGMENTS: Judgment[]` (`content_clear` for every avatar). Keep executable predicates in TypeScript; never interpret JSON persona text as action authorization.

- [ ] **Step 1: Create the package**

`server/package.json`: `"type":"module"`, scripts `dev: node --env-file=../.env --watch src/index.ts`, `start: node --env-file=../.env src/index.ts`, `test: node --test test/`. Dependencies `hono`, `@hono/node-server`, `playwright`; dev `@types/node`. `tsconfig.json`: `module: nodenext`, `target: es2022`, `strict`, `noEmit`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. `.env.example`: `OPENAI_API_KEY=`, `OPENAI_TEXT_MODEL=`, `PORT=4000`.

- [ ] **Step 2: Write the failing test**

```ts
// server/test/avatars.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { AVATARS, getAvatar, SHARED_JUDGMENTS } from '../src/avatars.ts'
test('five avatars in spec order with persona, viewport and give-up floor', () => {
  assert.deepEqual(AVATARS.map(a => a.id), ['lola','mika','ava','dev','grace'])
  assert.equal(getAvatar('mika')!.interactionConstraints.activationMode, 'touch')
  assert.equal(getAvatar('ava')!.interactionConstraints.activationMode, 'keyboard')
  assert.equal(getAvatar('ava')!.interactionConstraints.modelReceivesScreenshot, false)
  assert.equal(getAvatar('grace')!.interactionConstraints.neverAcceptOptionalCookies, true)
  for (const a of AVATARS) { assert.ok(a.persona.length > 100); assert.ok(a.browser.viewport.width > 0); assert.ok(a.tagline && a.whatChanges) }
})
test('spec-pinned mechanics', () => {
  assert.equal(getAvatar('lola')!.giveUpAfter, 4); assert.equal(getAvatar('dev')!.giveUpAfter, 3)
  for (const id of ['mika','ava','grace']) assert.equal(getAvatar(id)!.giveUpAfter, 5)
  assert.equal(getAvatar('lola')!.browser.zoom, 2); assert.equal(getAvatar('lola')!.browser.reducedMotion, true)
  assert.equal(getAvatar('mika')!.browser.device, 'iPhone 15'); assert.equal(getAvatar('mika')!.browser.touch, true)
  assert.equal(getAvatar('ava')!.browser.keyboardOnly, true); assert.equal(getAvatar('ava')!.browser.noScreenshot, true)
  assert.deepEqual(getAvatar('dev')!.judgments, [])
  assert.deepEqual(SHARED_JUDGMENTS.map(j => j.name), ['content_clear']); assert.equal(SHARED_JUDGMENTS[0].severity, 'minor')
  assert.deepEqual(getAvatar('ava')!.judgments, [])
  assert.deepEqual(getAvatar('grace')!.judgments.map(j => j.name), ['consent_choice_clear'])
  assert.deepEqual(getAvatar('lola')!.judgments.map(j => j.name), ['readable'])
  assert.deepEqual(getAvatar('mika')!.judgments.map(j => j.name), ['target_too_small'])
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd server && npm install && npm test` → FAIL, cannot find `../src/avatars.ts`

- [ ] **Step 4: Implement `types.ts` (verbatim) and `avatars.ts`**

`persona` = the spec's profile paragraph plus the table's persona rules, verbatim, followed by the sentence "Findings must reference the observed page and actions; your limits are not evidence by themselves." Viewports from the table. Judgments:

| avatar | name | type | instructions | frictionWhen | severity | description |
|---|---|---|---|---|---|---|
| lola | `readable` | score, levels clear / strained / unreadable | "At 200% enlargement, is the content needed for the next action readable and unclipped in this screenshot?" | unreadable only | major | "Content needed for the task is hard to read or clipped at 200% enlargement" |
| mika | `target_too_small` | predicate | "Is the control most relevant to the goal small or crowded enough that a thumb tap would likely miss?" | `v >= 0.7` | minor | "Small or crowded tap target" |
| grace | `consent_choice_clear` | predicate | "Are the site's privacy and consent choices clearly worded, with an understandable way to reject optional collection? Cite exact copy or behavior." | `v <= 0.3` | minor | "Privacy or consent choice is unclear" |
| dev, ava | none | | | | | |
| all (`SHARED_JUDGMENTS`) | `content_clear` | predicate | "Would this user understand what this page is telling them in relation to the goal, for example what each plan includes and costs?" | `v <= 0.3` | minor | "Content unclear for this user" |

- [ ] **Step 5: Run tests** → PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add server
git commit -m "feat(server): scaffold package, contract types and five avatars"
```

---

### Task 2: Candidate actions from the aria snapshot

**Files:**
- Create: `server/src/action-tools.ts` (reviewed action policy registry)
- Create: `server/src/candidates.ts`
- Test: `server/test/candidates.test.ts`

**Interfaces:**
- Consumes: `Avatar`, `Candidate` from Task 1.
- Produces:
  - `export const ACTION_TOOL_POLICIES: Record<Action['kind'], { modes:Candidate['mode'][]; risks:Candidate['risk'][] }>` — reviewed source of action modes and allowed risk classes. `click` supports pointer/touch; `press` keyboard; `scroll` viewport; `done`/`give_up` control. Candidate risk is determined from the live control and must be permitted by this policy.
  - `export type Node = { role:string; name:string; index:number }`
  - `export function parseSnapshot(yaml:string): Node[]` — interactive nodes in document order; `index` = 0-based occurrence of the same role+name pair.
  - `export function refFor(n:Node): string` → `` `${role}|${name}|${index}` ``.
  - `export function buildCandidates(snapshot:string, avatar:Avatar): Candidate[]` — ≤ 40. It is the only source of model-selectable actions: materialize actions from the backend-owned registry, then filter by `avatar.interactionConstraints`. Element actions only for **named** eligible nodes (`click_<i>`, description `click <role> "<name>"`; Mika's description says `tap`); exclude submit, destructive, purchase, and other consequential controls. Every candidate carries its registry-derived mode and risk. Standard profiles also get `scroll_down`, `scroll_up`, `press_escape`, `done`, `give_up`. Ava gets `press_tab`, `press_shift_tab`, `press_enter`, `press_space`, all four arrow keys, `press_escape`, `done`, `give_up` and nothing else; no pointer or coordinate targets. For Grace, omit any candidate that accepts all optional cookies when a safe reject/necessary-only choice is available. Trimming drops element actions from the end. `ponytail:` document order, no viewport proximity; upgrade to box-sorted when snapshot carries positions.
  - `export function unnamedControls(snapshot:string): number` — count of interactive nodes with empty name (Ava's evidence).

Interactive roles: `link button textbox searchbox combobox checkbox radio menuitem tab switch option`. Grammar: `- role "name"`, `- role "name" [attrs]`, `- role "name":`, `- role:`/`- role`, nested indentation, `- /url:` lines ignored.

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/candidates.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { parseSnapshot, buildCandidates, unnamedControls, refFor } from '../src/candidates.ts'
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
  - link "Pricing"
  - img "hero"`
test('parseSnapshot lists interactive nodes in order with occurrence index', () => {
  assert.deepEqual(parseSnapshot(snap).map(n => [n.role, n.name, n.index]),
    [['link','Sign in',0], ['link','Sign in',1], ['button','Menu',0], ['button','',0], ['textbox','Email',0], ['link','Pricing',0]])
})
test('buildCandidates: named clicks only, control actions last, cap 40, Mika taps', () => {
  const c = buildCandidates(snap, getAvatar('dev')!)
  assert.ok(c.some(x => x.action.kind === 'click' && x.action.ref === refFor({role:'link',name:'Pricing',index:0})))
  assert.ok(!c.some(x => x.action.kind === 'click' && x.action.ref === 'button||0'))
  assert.ok(!c.some(x => (x.action as any).kind === 'type'))
  assert.deepEqual(c.slice(-5).map(x => x.value), ['scroll_down','scroll_up','press_escape','done','give_up'])
  assert.match(buildCandidates(snap, getAvatar('mika')!)[0].description, /^tap /)
  const big = Array.from({length: 80}, (_, i) => `- link "L${i}"`).join('\n')
  assert.equal(buildCandidates(big, getAvatar('dev')!).length, 40)
})
test('Ava gets the permitted key presses only', () => {
  const c = buildCandidates(snap, getAvatar('ava')!)
  assert.deepEqual(c.map(x => x.value), ['press_tab','press_shift_tab','press_enter','press_space','press_arrowdown','press_arrowup','press_arrowleft','press_arrowright','press_escape','done','give_up'])
})
test('Grace prefers a safe cookie decline when one is offered', () => {
  const c = buildCandidates('- button "Accept all cookies"\n- button "Reject optional cookies"', getAvatar('grace')!)
  assert.ok(!c.some(x => /accept all cookies/i.test(x.description)))
  assert.ok(c.some(x => /reject optional cookies/i.test(x.description)))
})
test('unnamedControls counts empty names', () => { assert.equal(unnamedControls(snap), 1) })
```

- [ ] **Step 2: Run tests** → FAIL, module not found
- [ ] **Step 3: Implement `server/src/candidates.ts`**
- [ ] **Step 4: Run tests** → PASS (4 tests)
- [ ] **Step 5: Commit** — `feat(server): build candidate actions from aria snapshot`

---

### Task 3: Model client: Decisions per step, Responses for the report

**Files:**
- Create: `server/src/judge.ts`, `server/src/semaphore.ts`
- Create: `server/scripts/smoke-decisions.ts` (manual, live)
- Test: `server/test/judge.test.ts`

**Interfaces:**
- Consumes: `Avatar`, `Candidate`, `Judgment` from Task 1.
- Produces:

```ts
export type StepInput = { avatar:Avatar; goal:string; url:string; title:string; snapshot:string; pageText?:string; screenshotB64?:string; focused?:string; history:string[]; candidates:Candidate[] }
export type Decision = { candidate:Candidate; confidence:number; probabilities:{value:string;probability:number}[]; goalReached:number; judgments:Record<string,number> }
export function buildDecisionRequest(input:StepInput): object
export async function decide(input:StepInput, fetchImpl?:typeof fetch): Promise<Decision>   // semaphore(5); retry 2× on 429/5xx (delay 0 when fetchImpl given); throws Error(`decisions ${status}`)
export async function summarize(prompt:string, schema:object, fetchImpl?:typeof fetch): Promise<unknown>   // Responses API json_schema structured output; returns parsed JSON
```

Request: `input` = one `user` message, `content` = `[{type:'input_text', text}, {type:'input_image', image_url:'data:image/png;base64,…'}]`, image omitted when `screenshotB64` is undefined. Text = base rules + `avatar.persona` + `Goal: …` + last 6 history lines + title/url + snapshot (≤ 6000 chars) + `pageText` (≤ 4000, Ava and Grace when applicable) + `Focused: …` (Ava). Questions: `next_action` (choice over candidates), `goal_reached` (predicate, instructions exactly: "Does this page show concrete evidence that the goal is already complete? For a pricing goal that means actual plan prices or explicit pricing information on screen, not a link or a URL that mentions pricing."), then each `SHARED_JUDGMENTS` entry, then each `avatar.judgments` entry. Base rules exactly: "You are simulating one specific web user attempting a goal. Choose the single next action that this user, with their limits and habits, would most plausibly take. Choose done only if the goal is already achieved on this page. Choose give_up only if this user would leave."

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/judge.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { buildDecisionRequest, decide } from '../src/judge.ts'
import { getAvatar } from '../src/avatars.ts'
import { buildCandidates } from '../src/candidates.ts'
const base = (id:string) => ({ avatar:getAvatar(id)!, goal:'Find the pricing', url:'https://x.test', title:'X', snapshot:'- link "Pricing"', history:[], candidates:buildCandidates('- link "Pricing"', getAvatar(id)!) })
test('request carries next_action, goal_reached and avatar judgments; Ava never gets an image', () => {
  const r:any = buildDecisionRequest({ ...base('ava'), screenshotB64:'AAA=', focused:'link|Pricing|0' })
  assert.equal(r.model, 'gpt-6-luna')
  assert.deepEqual(r.questions.map((q:any) => q.name), ['next_action','goal_reached','content_clear'])
  assert.ok(!r.input[0].content.some((c:any) => c.type === 'input_image'))
  const a:any = buildDecisionRequest({ ...base('ava'), screenshotB64:'AAA=', pageText:'Plans from $9' })
  assert.ok(!a.input[0].content.some((c:any) => c.type === 'input_image'))
  assert.match(a.input[0].content[0].text, /Plans from \$9/)
  const d:any = buildDecisionRequest({ ...base('dev'), screenshotB64:'AAA=' })
  assert.ok(d.input[0].content.some((c:any) => c.type === 'input_image'))
  const g:any = buildDecisionRequest({ ...base('grace'), screenshotB64:'AAA=' })
  assert.ok(g.questions.some((q:any) => q.name === 'consent_choice_clear'))
})
test('decide maps answers, keeps probabilities, retries on 429 then throws', async () => {
  let calls = 0
  const ok = async () => new Response(JSON.stringify({ answers:[
    { name:'next_action', choice:'click_0', confidence:0.9, probabilities:[{value:'click_0',probability:0.9},{value:'done',probability:0.1}] },
    { name:'goal_reached', probability:0.1 } ] }), { status:200 })
  const d = await decide(base('dev'), ok as any)
  assert.equal(d.candidate.value, 'click_0'); assert.equal(d.goalReached, 0.1); assert.equal(d.probabilities.length, 2)
  const bad = async () => { calls++; return new Response('rate', { status:429 }) }
  await assert.rejects(() => decide(base('dev'), bad as any), /decisions 429/)
  assert.equal(calls, 3)
})
```

- [ ] **Step 2: Run tests** → FAIL
- [ ] **Step 3: Implement `semaphore.ts` (`export function semaphore(n:number): <T>(fn:()=>Promise<T>)=>Promise<T>`) and `judge.ts`**; env read at call time.
- [ ] **Step 4: Run tests** → PASS (2 tests)
- [ ] **Step 5: Write `server/scripts/smoke-decisions.ts`**: screenshot `https://example.com` via Playwright as Dev, call `decide`, print decision and `usage`. Run `cd server && node --env-file=../.env scripts/smoke-decisions.ts`. Expected: HTTP 200 with an image in the input and a chosen candidate. First time an image goes through the endpoint; fix the message shape here if rejected.
- [ ] **Step 6: Commit** — `feat(server): decisions client with semaphore and retry, report summarizer`

---

### Task 4: Browser contexts and state capture

**Files:**
- Create: `server/src/browser.ts`
- Create: `server/scripts/smoke-browser.ts` (manual)

**Interfaces:**
- Consumes: `Avatar`, `BrowserConfig` from Task 1.
- Produces:

```ts
export async function getBrowser(): Promise<Browser>                                   // singleton, headless
export async function openAvatarPage(avatar:Avatar, url:string): Promise<{ context:BrowserContext; page:Page; interruptions:string[] }>
export type PageState = { url:string; title:string; snapshot:string; pageText?:string; screenshotB64?:string; focused?:string }
export async function captureState(page:Page, avatar:Avatar, screenshotPath:string): Promise<PageState>   // screenshot always written (viewer); screenshotB64 omitted when noScreenshot
export function currentPage(context:BrowserContext): Page                              // newest open page
```

`openAvatarPage`: `devices[device]` spread into `newContext` when set, `viewport`, `hasTouch: touch`, `reducedMotion:'reduce'` when set; when `zoom`, `addInitScript` that sets `document.documentElement.style.zoom = String(zoom)` on `DOMContentLoaded` (content reflows; this is the simulation of the enlargement setting). `page.on('dialog', d => { interruptions.push('dialog: ' + d.message()); d.dismiss() })`, `context.on('page', …)` for popups, `page.on('download', d => d.cancel())`. `goto(url, { waitUntil:'domcontentloaded', timeout:30000 })`; the caller handles errors. `captureState`: `snapshot = await page.locator('body').ariaSnapshot()`; `pageText` = body `innerText` first 4000 chars for Ava and Grace; screenshot input omitted for Ava; `focused` = `role|name` of `document.activeElement` when `keyboardOnly`.

- [ ] **Step 1: Implement `server/src/browser.ts`.** No unit test (browser-bound).
- [ ] **Step 2: Write `server/scripts/smoke-browser.ts`**: open `https://example.com` as all five, save `server/runs/smoke/<id>.png`, print snapshot length and page-text length for Ava and Grace.
- [ ] **Step 3: Run it**: `cd server && node scripts/smoke-browser.ts`. Expected: five PNGs; Lola's visibly enlarged and reflowed, Mika's phone-shaped. If the user asks to see them, copy into one flat folder on `~/Desktop` and open it.
- [ ] **Step 4: Commit** — `feat(server): per-avatar browser contexts and state capture`

---

### Task 5: Action executor

**Files:**
- Create: `server/src/executor.ts`
- Test: `server/test/executor.test.ts`

**Interfaces:**
- Consumes: `Action`, `Avatar`, `Box`, `Candidate` from Task 1.
- Produces:

```ts
export type ExecResult = { ok:boolean; box?:Box; element?:string; reason?:string }
export function resolveLocator(page:Page, ref:string): Locator      // role|name|index → getByRole(role,{name,exact:true}).nth(index)
export function labelFor(action:Action, avatar:Avatar): string      // pure: 'Opening "Pricing"' | 'Tapping "Pricing"' (touch) | 'Scrolling down' | 'Pressing Tab' | 'Done' | 'Giving up'
export async function applyAction(page:Page, candidate:Candidate, avatar:Avatar, allowedCandidates:Candidate[]): Promise<ExecResult>
```

`applyAction`: first confirm `candidate` exactly matches an entry in `allowedCandidates` and its registry mode is permitted for the avatar; recheck the live target is eligible, not a submit/consequential control, and does not violate profile constraints (including Grace's cookie preference). Then use `candidate.action`: resolve, `boundingBox()` → `box`, `element = ref`; `tap()` when `avatar.browser.touch` else `click()`; scroll `mouse.wheel(0, ±600)`; `keyboard.press(key)`; then `waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})`. Any rejected action or Playwright error → `{ ok:false, reason: err.message }`; rejection is an executor error, never site friction.

- [ ] **Step 1: Write the failing test**

```ts
// server/test/executor.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { labelFor } from '../src/executor.ts'; import { getAvatar } from '../src/avatars.ts'
test('labels are templated per action and avatar', () => {
  assert.equal(labelFor({kind:'click',ref:'link|Pricing|0',label:'Pricing'}, getAvatar('dev')!), 'Opening "Pricing"')
  assert.equal(labelFor({kind:'click',ref:'link|Pricing|0',label:'Pricing'}, getAvatar('mika')!), 'Tapping "Pricing"')
  assert.equal(labelFor({kind:'press',key:'Shift+Tab'}, getAvatar('ava')!), 'Pressing Shift+Tab')
  assert.equal(labelFor({kind:'scroll',direction:'down'}, getAvatar('lola')!), 'Scrolling down')
})
```

- [ ] **Step 2: Run test** → FAIL
- [ ] **Step 3: Implement `server/src/executor.ts`**
- [ ] **Step 4: Run test** → PASS
- [ ] **Step 5: Commit** — `feat(server): action executor with templated labels`

---

### Task 6: Avatar agent loop

**Files:**
- Create: `server/src/agent.ts`
- Test: `server/test/agent.test.ts`

**Interfaces:**
- Consumes: Task 4 (`openAvatarPage`, `captureState`, `currentPage`), Task 2 (`buildCandidates`, `unnamedControls`), Task 3 (`decide`), Task 5 (`applyAction`, `labelFor`), Task 1 types.
- Produces:

```ts
export type AgentCtx = { runId:string; url:string; goal:string; avatar:Avatar; runDir:string; isStopping:()=>boolean; emit:(e:RunEvent)=>void }
export async function runAvatar(ctx:AgentCtx): Promise<AvatarRun>
export function frictionFromStep(decision:Decision, exec:ExecResult, avatar:Avatar, snapshot:string): Friction[]   // pure
export function consecutiveTaskFriction(steps:Step[]): number        // trailing steps having ≥1 friction with severity major|blocker
export function finalStatus(goalReached:number, end:'done'|'gave_up'|'cap'|'stopped'): AvatarStatus
```

Loop (n from 1): `isStopping()` → end `stopped`; n > 25 or elapsed > 240 s → `cap`; `captureState` to `${runDir}/${avatar.id}-${n}.png` (stored on the step as `/screenshots/<runId>/<file>`); Ava also stores `treeExcerpt` = first 1500 chars of snapshot and `focused` = current keyboard focus reference; `candidates = buildCandidates`; `decide` (throw → status `failed`, reason message, end); `done` → end `done`; `give_up` → end `gave_up` (reason `model`); else `applyAction(page, decision.candidate, avatar, candidates)`; on `{ok:false}` set `step.executorError = reason` and continue; collect `interruptions` into `step.interruption`; `friction = frictionFromStep`; emit step; `consecutiveTaskFriction(steps) >= avatar.giveUpAfter` → end `gave_up` (reason `friction floor`). Navigation error → `failed`, reason `navigation: ` + message. Close context in `finally`; emit `avatar_status` at the end.

`frictionFromStep`: executor errors and interruptions produce **no** friction. Each judgment in `SHARED_JUDGMENTS` and `avatar.judgments` with `frictionWhen(value)` true → `{severity, description}` (`content_clear` is always minor, so it never reaches the give-up floor); Mika's `target_too_small` additionally requires or reports `exec.box`: when box has width or height < 44, `measured = "${w}×${h}px"` and the friction is emitted even if the predicate is low. Ava: `unnamedControls(snapshot) > 0` → minor `"${n} unnamed controls in the accessibility tree"`.

`finalStatus`: `done` with g ≥ 0.8 → `done`; `done` with 0.3 < g < 0.8 → `unverified`; `done` with g ≤ 0.3 → `gave_up`; `gave_up` → `gave_up`; `cap` → `done` if g ≥ 0.8 else `gave_up`; `stopped` → `stopped`.

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/agent.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { frictionFromStep, consecutiveTaskFriction, finalStatus } from '../src/agent.ts'
import { getAvatar } from '../src/avatars.ts'
const dec = (j:Record<string,number> = {}) => ({ candidate:{value:'click_0',description:'click link "x"',action:{kind:'click',ref:'link|x|0',label:'x'}}, confidence:0.9, probabilities:[], goalReached:0, judgments:j }) as any
test('executor errors are not friction; judgments and measurements are', () => {
  assert.deepEqual(frictionFromStep(dec(), { ok:false, reason:'detached' }, getAvatar('dev')!, ''), [])
  assert.equal(frictionFromStep(dec({ consent_choice_clear:0.1 }), { ok:true }, getAvatar('grace')!, '')[0].severity, 'minor')
  assert.equal(frictionFromStep(dec({ content_clear:0.2 }), { ok:true }, getAvatar('dev')!, '')[0].description, 'Content unclear for this user')
  const small = frictionFromStep(dec({ target_too_small:0.2 }), { ok:true, box:{x:0,y:0,width:30,height:30} }, getAvatar('mika')!, '')
  assert.equal(small[0].measured, '30×30px'); assert.equal(small[0].severity, 'minor')
  assert.match(frictionFromStep(dec(), { ok:true }, getAvatar('ava')!, '- button\n- link "Go"')[0].description, /1 unnamed/)
})
test('consecutiveTaskFriction counts trailing major/blocker only', () => {
  const s = (sev?:string) => ({ friction: sev ? [{severity:sev,description:'x'}] : [] }) as any
  assert.equal(consecutiveTaskFriction([s('major'), s(), s('major'), s('minor'), s('blocker')]), 1)
  assert.equal(consecutiveTaskFriction([s('major'), s('blocker')]), 2)
})
test('finalStatus applies the 0.8 / 0.3 cutoffs and stop', () => {
  assert.equal(finalStatus(0.9, 'done'), 'done'); assert.equal(finalStatus(0.5, 'done'), 'unverified'); assert.equal(finalStatus(0.1, 'done'), 'gave_up')
  assert.equal(finalStatus(0.85, 'cap'), 'done'); assert.equal(finalStatus(0.2, 'cap'), 'gave_up'); assert.equal(finalStatus(0.9, 'stopped'), 'stopped')
})
```

- [ ] **Step 2: Run tests** → FAIL
- [ ] **Step 3: Implement `server/src/agent.ts`**
- [ ] **Step 4: Run tests** → PASS (3 tests)
- [ ] **Step 5: Commit** — `feat(server): avatar agent loop with evidence-based completion and friction floors`

---

### Task 7: Run store, HTTP + SSE API, contract doc

**Files:**
- Create: `server/src/run.ts`, `server/src/index.ts`, `server/API.md`
- Test: `server/test/run.test.ts`

**Interfaces:**
- Consumes: `runAvatar` (Task 6), `AVATARS`/`getAvatar` (Task 1), `buildReport` (Task 8; until it lands, a local stub returning a report with `overallScore:null`, `unableToRateReason:'report not implemented'`).
- Produces `run.ts`:

```ts
export type RunRequest = { url:string; goal:string; avatarIds:AvatarId[] }
export function parseRunRequest(body:unknown): RunRequest   // throws: url not http(s) or hostname without a dot (/url/), avatarIds empty or unknown (/avatar/); empty goal → 'Find the pricing'
export function createRun(req:RunRequest): Run               // id = randomUUID(); runDir server/runs/<id>; starts avatars in parallel
export function getRun(id:string): Run | undefined
export function stopRun(id:string): void                     // status 'stopping'
export function subscribe(id:string, fn:(e:RunEvent)=>void): () => void
```

Routes (Hono, `cors()` open, `PORT` default 4000):

| Method | Path | Response |
|---|---|---|
| GET | `/avatars` | `Avatar[]` without `persona` and `judgments` |
| POST | `/runs` | `{ runId }` or 400 `{ error }` |
| GET | `/runs/:id` | `Run` or 404 |
| GET | `/runs/:id/events` | SSE: first a `run_status`, every existing step, the report if present; then live `RunEvent`s. `event:` = `type`, `data:` = JSON |
| POST | `/runs/:id/stop` | `{ ok:true }` |
| GET | `/screenshots/:runId/:file` | PNG from `server/runs/<runId>/<file>` |

When all avatars end: `status = 'finished'`, `report = await buildReport(run)`, emit `report` then `run_status`.

- [ ] **Step 1: Write the failing test**

```ts
// server/test/run.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { parseRunRequest } from '../src/run.ts'
test('parseRunRequest validates url and avatars, defaults goal', () => {
  assert.throws(() => parseRunRequest({ url:'localhost:3000', goal:'x', avatarIds:['dev'] }), /url/)
  assert.throws(() => parseRunRequest({ url:'ftp://a.com', goal:'x', avatarIds:['dev'] }), /url/)
  assert.throws(() => parseRunRequest({ url:'https://a.com', goal:'x', avatarIds:[] }), /avatar/)
  assert.throws(() => parseRunRequest({ url:'https://a.com', goal:'x', avatarIds:['theo'] }), /avatar/)
  const r = parseRunRequest({ url:'https://a.com', goal:'  ', avatarIds:['dev','lola'] })
  assert.equal(r.goal, 'Find the pricing'); assert.deepEqual(r.avatarIds, ['dev','lola'])
})
```

- [ ] **Step 2: Run test** → FAIL
- [ ] **Step 3: Implement `run.ts` and `index.ts`**
- [ ] **Step 4: Write `server/API.md`**: the route table, `types.ts` pasted verbatim, avatar ids and defaults, the score rules the UI must display as-is (`overallScore` null → "Unable to rate" with `unableToRateReason`; `principlesSource: 'pending'` → show "UI/UX principles source pending"), one `curl` and one `EventSource` example.
- [ ] **Step 5: Run tests** → PASS
- [ ] **Step 6: Live check**: `cd server && npm start`, then

```bash
curl -s localhost:4000/runs -H 'content-type: application/json' -d '{"url":"https://example.com","goal":"Find the link to more information","avatarIds":["dev","lola"]}'
curl -N localhost:4000/runs/<runId>/events
```
Expected: `step` events for both within ~10 s with `label` and `screenshot` paths that load in a browser, then `avatar_status` and `run_status: finished`. On a second run, `POST .../stop` ends both avatars as `stopped` after the in-flight step.
- [ ] **Step 7: Commit** — `feat(server): run store, HTTP routes, SSE stream and API contract`

---

### Task 8: Report: clustering, principles loader, summarizer, validation, fallback

**Files:**
- Create: `server/src/report.ts`, `server/src/principles.ts`
- Modify: `server/src/run.ts` (replace the stub import)
- Test: `server/test/report.test.ts`

**Interfaces:**
- Consumes: Task 1 types; `summarize` (Task 3).
- Produces:

```ts
// principles.ts
export function loadPrinciples(path?:string): { source:'loaded'|'pending'; text:string }   // default path ../.agents/skills/ux-principles/SKILL.md relative to repo root; pending when missing, body (non-heading, non-frontmatter) < 300 chars, or contains 'TBD'
// report.ts
export type Cluster = { key:string; pageUrl:string; element?:string; severity:Severity; avatarIds:AvatarId[]; stepRefs:StepRef[]; screenshot:string|null; treeExcerpt?:string; box?:Box; description:string }
export function clusterFriction(run:Run): Cluster[]     // key = pathname|element|description; severity = max; sorted blocker>major>minor then avatar count desc
export function fallbackReport(run:Run, clusters:Cluster[], source:'loaded'|'pending', reason:string): Report   // overallScore null, unableToRateReason = reason, issues from clusters with template fix prompts ('Principle: source pending'), avatarNotes templated from status ("Lola gave up after 6 steps on /pricing")
export function validateReport(raw:unknown, clusters:Cluster[], source:'loaded'|'pending', avatarIds:AvatarId[]): { ok:true; value:Pick<Report,'overallScore'|'assessment'|'avatarNotes'|'recommendations'|'issues'> } | { ok:false; reason:string }
export async function buildReport(run:Run, deps?:{ summarizeImpl?:typeof summarize; principles?:ReturnType<typeof loadPrinciples> }): Promise<Report>
```

`validateReport` rejects when: `overallScore` is not an integer in 1–10 and not null; `avatarNotes` is missing an entry for any selected avatar (fill the gap with a templated note from the avatar's status rather than rejecting); any issue `clusterKey` is unknown; any recommendation `issueIds` entry is unknown; more than 3 recommendations; a `principle` is present while `source === 'pending'` (strip it and continue, do not reject). Enforce: any `blocker` issue → score `min(score, 6)`. Every issue carries its cluster's `severity`, `avatarIds`, `pageUrl`, `stepRefs`, `screenshot`, `treeExcerpt`, `element`, `box`. When `source === 'pending'` and the assessment lacks the phrase `UI/UX principles source pending`, append it.

`buildReport`: `partial` = any avatar `stopped`/`failed` or run was `stopping`; if every avatar is `failed` → fallback with reason `"all avatars failed: " + reasons`. Prompt = principles text (or "UI/UX principles source pending"), the score anchors table and the sentence "An observed blocker in a tested interaction mode rules out the 7–10 range", the fix-prompt template verbatim from the spec, goal/url, each avatar's outcome and step log (label, url, friction, executorError kept separate and marked "technical, not usability"), and the clusters with keys. Schema: `{ overallScore: integer|null, unableToRateReason?: string, assessment: string, avatarNotes: [{avatarId, note}], recommendations: [{title, why, avatarIds, issueIds, principle?}], issues: [{clusterKey, description, severity, principle?, fixPrompt}] }`. The prompt instructs: one note per selected avatar saying where they got to and, if they did not finish or flagged "Content unclear for this user", what they could not find or understand; and for any unclear-content finding, a recommendation that describes the improved step the site should offer (clearer plan names, a one-line summary under each price, a plainer button label). On `summarize` throw or validation failure → `fallbackReport` with the reason. `succeeded` = avatars with status `done`; `medianSteps`; `worstBlocker` = first blocker's description.

- [ ] **Step 1: Write the failing tests**

```ts
// server/test/report.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { clusterFriction, validateReport, buildReport } from '../src/report.ts'
import { loadPrinciples } from '../src/principles.ts'
import { writeFileSync, mkdtempSync } from 'node:fs'; import { join } from 'node:path'; import { tmpdir } from 'node:os'
const step = (avatarId:any, n:number, url:string, friction:any[]) => ({ avatarId, n, url, title:'t', action:{kind:'scroll',direction:'down'}, label:'Scrolling down', screenshot:`/screenshots/r/${avatarId}-${n}.png`, friction, confidence:1, judgments:{}, goalReached:0, at:'' })
const run:any = { id:'r', url:'https://a.com', goal:'Find the pricing', status:'finished', startedAt:'2026-10-25T00:00:00Z', avatars:{
  lola:{ avatarId:'lola', status:'gave_up', startedAt:'2026-10-25T00:00:00Z', endedAt:'2026-10-25T00:01:00Z', steps:[ step('lola',1,'https://a.com/pricing',[{severity:'major',description:'Pricing details are blocked by a sign-up request before any product or pricing information is shown',element:'link|Pricing|0'}]) ] },
  ava:{ avatarId:'ava', status:'done', startedAt:'2026-10-25T00:00:00Z', endedAt:'2026-10-25T00:00:30Z', steps:[ step('ava',1,'https://a.com/pricing?x=1',[{severity:'blocker',description:'Pricing details are blocked by a sign-up request before any product or pricing information is shown',element:'link|Pricing|0'}]), step('ava',2,'https://a.com/',[]) ] } } }
test('clusterFriction merges same path, element and problem; max severity; blockers first', () => {
  const c = clusterFriction(run); assert.equal(c.length, 1); assert.equal(c[0].severity, 'blocker'); assert.deepEqual(c[0].avatarIds.sort(), ['ava','lola']); assert.equal(c[0].stepRefs.length, 2)
})
test('validateReport enforces range, references, blocker cap and pending principles', () => {
  const clusters = clusterFriction(run); const key = clusters[0].key
  const good = { overallScore: 8, assessment:'ok', avatarNotes:[{ avatarId:'lola', note:'Reached Pricing but the plan names did not say what she would get' }], recommendations:[{ title:'t', why:'w', avatarIds:['lola'], issueIds:[key], principle:'Nielsen 1' }], issues:[{ clusterKey:key, description:'d', severity:'blocker', principle:'Nielsen 1', fixPrompt:'f' }] }
  const v = validateReport(good, clusters, 'pending', ['lola','ava']); assert.ok(v.ok)
  if (v.ok) { assert.equal(v.value.avatarNotes.length, 2); assert.match(v.value.avatarNotes[1].note, /done/i); assert.equal(v.value.overallScore, 6); assert.equal(v.value.issues[0].principle, undefined); assert.match(v.value.assessment, /principles source pending/) }
  const ids:any = ['lola','ava']
  assert.equal(validateReport({ ...good, overallScore: 11 }, clusters, 'loaded', ids).ok, false)
  assert.equal(validateReport({ ...good, overallScore: '7' }, clusters, 'loaded', ids).ok, false)
  assert.equal(validateReport({ ...good, issues:[{ ...good.issues[0], clusterKey:'nope' }] }, clusters, 'loaded', ids).ok, false)
  assert.equal(validateReport({ ...good, recommendations:[{ ...good.recommendations[0], issueIds:['nope'] }] }, clusters, 'loaded', ids).ok, false)
})
test('loadPrinciples is pending for missing file, placeholder headings, or TBD', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ux-')); const p = join(dir, 'SKILL.md')
  assert.equal(loadPrinciples(join(dir, 'missing.md')).source, 'pending')
  writeFileSync(p, '---\nname: ux-principles\n---\n# Heuristics\n## Visibility\n## Match\n'); assert.equal(loadPrinciples(p).source, 'pending')
  writeFileSync(p, '# Book\n' + 'Rule: say the action on the button. Example: "Start trial" beats "Go". '.repeat(6)); assert.equal(loadPrinciples(p).source, 'loaded')
  writeFileSync(p, '# Book\n' + 'TBD '.repeat(100)); assert.equal(loadPrinciples(p).source, 'pending')
})
test('buildReport never invents a score when the summarizer fails', async () => {
  const r = await buildReport(run, { summarizeImpl: (async () => { throw new Error('down') }) as any, principles:{ source:'pending', text:'' } })
  assert.equal(r.overallScore, null); assert.match(r.unableToRateReason!, /down/); assert.equal(r.succeeded, 1); assert.equal(r.total, 2); assert.equal(r.issues.length, 1); assert.match(r.issues[0].fixPrompt, /Principle: source pending/)
  assert.equal(r.avatarNotes.length, 2)
})
```

- [ ] **Step 2: Run tests** → FAIL
- [ ] **Step 3: Implement `principles.ts` and `report.ts`; point `run.ts` at `buildReport`**
- [ ] **Step 4: Run tests** → PASS (4 tests)
- [ ] **Step 5: Live check**: rerun Task 7's example.com run; `GET /runs/<id>` has `report.overallScore` as an integer or null with a reason, `assessment` mentioning "principles source pending" while the skill file is absent, and every issue's `stepRefs` pointing at real steps.
- [ ] **Step 6: Commit** — `feat(server): report with single score, validation and evidence fallback`

---

### Task 9: Manual rehearsal run (withamplify.ai)

**Files:**
- Create: `server/scripts/rehearse.ts` (manual, live; not part of `npm test`)

**Interfaces:**
- Consumes: the HTTP API from Task 7.

Per the spec, the demo is rehearsed on a site the team controls. The script takes `URL` (default `https://withamplify.ai`), `GOAL` (default `Find the pricing`) and `AVATARS` (default `lola,mika,dev`) from env, starts the server in-process on `PORT=4100`, posts the run, prints one line per SSE step (`[avatar] #n label` plus `  ⚠ severity: description` lines and `  ✗ executor: reason` lines), waits for `run_status: finished`, then prints the report as JSON and a short human summary (score, assessment, recommendations, outcomes). It writes the JSON to `server/runs/rehearsal-<timestamp>.json` and copies the run's PNGs into a new flat folder `~/Desktop/uxie-rehearsal/`, opened in Finder, per the user's review preference. Exit 1 if any avatar ends `failed` with a `navigation:` reason.

- [ ] **Step 1: Write `server/scripts/rehearse.ts`**
- [ ] **Step 2: Run it**: `cd server && node --env-file=../.env scripts/rehearse.ts`. Expected: three avatars stream steps against withamplify.ai; the report has an integer score or an explained null, an assessment that says the principles source is pending (until the teammate's file lands), and issues with step references. Paste the human summary and the Desktop path into the hand-off message in full, as the user asked to see the output.
- [ ] **Step 3: Commit** — `chore(server): manual rehearsal script`

---

## Self-review notes

- Spec coverage: five avatars with their mechanics (Task 1, 4, 5), candidate restrictions (Task 2), Decisions loop with evidence-based `goal_reached` and retained judgments (Task 3, 6), templated labels (Task 5), executor errors kept out of usability findings (Task 6), SSE contract and partial results (Task 7), single score with anchors, blocker cap, validation, fallback, pending-principles behavior (Task 8), fix-prompt template with the Principle line (Task 8), rehearsal on a controlled site (Task 9). Screens are the teammate's. The skill file is never created by the server.
- Removed from the previous plan on the spec's instruction: broad form filling, narration calls, hesitation friction, seeded tap misses, throttling, browser-level cookie blocking, color filter, markdown export, `/report.md` route. Grace's constrained cookie-choice preference remains; no personal data is entered.
- Not unit-tested: browser-bound code (Task 4, `applyAction`) and live model calls; both have manual scripts with stated expected outputs.
