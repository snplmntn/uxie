# Uxie server API

Base URL: `http://localhost:4000` (override with the `PORT` env var). CORS is open to every origin.
All bodies are JSON unless noted. Errors are `{ "error": string }`.

## Routes

| Method | Path | Response |
|---|---|---|
| GET | `/avatars` | `200` `Avatar[]` without `persona` and `judgments` |
| POST | `/runs` | `200` `{ runId }`, or `400` `{ error }` on an invalid body |
| GET | `/runs/:id` | `200` `Run`, or `404` `{ error }` |
| GET | `/runs/:id/events` | `200` Server-Sent Events stream (below), or `404` `{ error }` |
| POST | `/runs/:id/stop` | `200` `{ ok:true }`, or `404` `{ error }` for an unknown run |
| GET | `/screenshots/:runId/:file` | `200` `image/png`, or `404` `{ error }` |

### POST /runs

Body: `{ url:string, goal?:string, avatarIds:AvatarId[] }`

- `url` must be an absolute `http://` or `https://` URL whose hostname contains a dot (`localhost:3000` is rejected). Error message contains `url`.
- `avatarIds` must be non-empty and every id must be one of the avatar ids below. Error message contains `avatar`. Duplicates are dropped.
- `goal` empty, whitespace or missing → `"Find the pricing"`.

The run starts immediately; all chosen avatars run in parallel.

### POST /runs/:id/stop

Sets the run to `stopping`. Each avatar finishes its in-flight step, then ends `stopped`. The run then finishes normally (a `report` with `partial: true`, then `run_status: finished`). Stopping a run that is not `running` is a no-op that still returns `{ ok:true }`.

### GET /runs/:id/events (SSE)

Each message is framed as

```
event: <RunEvent.type>
data: <RunEvent as JSON>

```

On connect the server first replays the current state, then streams live events:

1. one `run_status` with the current status,
2. for each avatar (in request order): every existing `step`, then one `avatar_status` with its current status (`running` if still going),
3. the `report`, if the run already finished.

Live events follow. A new run emits `avatar_status: running` for every avatar, then `step` events as avatars act, one final `avatar_status` per avatar, a `run_status: stopping` if stopped, and when every avatar has ended: **`report` first, then `run_status: finished`**. The server keeps the connection open after that; close your `EventSource` when you receive `run_status: finished` (otherwise the browser reconnects and receives the replay again).

### Screenshots

`Step.screenshot` is a path like `/screenshots/<runId>/<avatarId>-<n>.png`; prefix it with the base URL. It is `null` when no screenshot was taken. Ava (`noScreenshot`) still gets a screenshot file for the UI, but her model never sees it; her steps also carry `treeExcerpt`.

## Avatars

| id | name | age | tagline | what changes | gives up after N consecutive friction steps |
|---|---|---|---|---|---|
| `lola` | Lola | 71 | Reads every word, misses the small ones. | Desktop 1280×800, content enlarged to 200%, prefers-reduced-motion | 4 |
| `mika` | Mika | 24 | Thumbs only, zero patience for pinching. | iPhone 15 viewport and UA, touch, no hover | 5 |
| `dev` | Dev | 33 | Knows the pattern, resents the detour. | Desktop 1440×900, ordinary mouse and keyboard actions | 3 |
| `ren` | Ren | 41 | If I can't Tab to it, it isn't there. | Desktop 1280×800, pointer actions unavailable; only Tab, Shift+Tab, Enter, Space, arrows, Esc | 5 |
| `ava` | Ava | 36 | Hears the page, never sees it. | Desktop 1280×800; model receives only the accessibility tree and page text, never screenshots or visual coordinates | 5 |

Defaults: goal `"Find the pricing"`; each avatar stops after 25 steps or 240 s (status from its last `goalReached`, `reason: "cap"`).

Avatar statuses: `running` → one of `done` (goal reached), `unverified` (said done, goal not clearly confirmed), `gave_up` (`reason` `"model"`, `"friction floor"` or `"cap"`, or none when it said done but the goal was clearly not reached), `failed` (`reason` holds the error, e.g. `"navigation: …"`), `stopped`. `queued` is reserved and not currently emitted.

`Step.judgments` maps judgment name → value: predicates are probabilities 0–1 (`content_clear` on every avatar); scores are on the level index scale, e.g. Lola's `readable` is 0 (unreadable) – 2 (fine). `goalReached` is a probability 0–1.

## Score display rules (show as-is)

- `report.overallScore === null` → show **"Unable to rate"** with `report.unableToRateReason`. Never substitute a number.
- `report.principlesSource === 'pending'` → show **"UI/UX principles source pending"**.
- `report.partial === true` → the run was stopped; label results as partial.

## Types (`server/src/types.ts`, verbatim)

```ts
export type AvatarId = 'lola'|'mika'|'dev'|'ren'|'ava'
export type Severity = 'blocker'|'major'|'minor'
export type Box = { x:number; y:number; width:number; height:number }
export type BrowserConfig = {
  viewport: { width:number; height:number }
  device?: string               // Playwright devices key, 'iPhone 15' for Mika
  touch?: boolean               // Mika: element actions use tap()
  zoom?: number                 // Lola: CSS zoom on documentElement, 2
  reducedMotion?: boolean
  keyboardOnly?: boolean        // Ren
  noScreenshot?: boolean        // Ava: model gets tree + text only
}
export type Judgment = {
  name:string; type:'predicate'|'score'; instructions:string
  levels?: { label:string; description:string }[]
  frictionWhen:(value:number)=>boolean; severity:Severity; description:string
}
export type Avatar = { id:AvatarId; name:string; age:number; tagline:string; whatChanges:string; bio:string; persona:string; browser:BrowserConfig; giveUpAfter:number; judgments:Judgment[] }
export type Action =
  | { kind:'click'; ref:string; label:string }
  | { kind:'scroll'; direction:'up'|'down' }
  | { kind:'press'; key:string }
  | { kind:'done' } | { kind:'give_up' }
export type Candidate = { value:string; description:string; action:Action }
export type Friction = { severity:Severity; description:string; element?:string; box?:Box; measured?:string }
export type Step = {
  avatarId:AvatarId; n:number; url:string; title:string; action:Action; label:string
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

`Judgment.frictionWhen` is a function and never sent over the wire; `/avatars` omits `persona` and `judgments`.

## Examples

```bash
curl -s localhost:4000/runs -H 'content-type: application/json' \
  -d '{"url":"https://example.com","goal":"Find the link to more information","avatarIds":["dev","lola"]}'
# {"runId":"9baf7756-985a-434f-87db-4d8d41f415f9"}
curl -N localhost:4000/runs/9baf7756-985a-434f-87db-4d8d41f415f9/events
curl -s -X POST localhost:4000/runs/9baf7756-985a-434f-87db-4d8d41f415f9/stop
```

```js
const base = 'http://localhost:4000'
const { runId } = await (await fetch(`${base}/runs`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com', goal: '', avatarIds: ['dev', 'lola'] }),
})).json()
const es = new EventSource(`${base}/runs/${runId}/events`)
es.addEventListener('step', e => { const { step } = JSON.parse(e.data); /* step.screenshot → base + step.screenshot */ })
es.addEventListener('avatar_status', e => { const { avatarId, status, reason } = JSON.parse(e.data) })
es.addEventListener('report', e => { const { report } = JSON.parse(e.data) })
es.addEventListener('run_status', e => { if (JSON.parse(e.data).status === 'finished') es.close() })
```
