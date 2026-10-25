# Handoff: wire the Uxie backend to the frontend

Date: 2026-10-25. Branch: `feat/server` at `25061a5` (includes `origin/feat/ui` merged at `bfe51bd`). Not merged into `main`.

## Objective

Make `web/` (Next.js 16, React 19, Tailwind 4, `motion`) run real sessions against `server/` (Hono + Playwright + OpenAI). The frontend is the authority on shape and behavior: where the two disagree, change the backend.

## What is verified

- Backend: 22/22 unit tests (`cd server && npm test`). Live-confirmed on withamplify.ai (pricing 8/10, create-account 8/10, landing 9/10, contact 6/10), Hacker News (submit 6/10, comments 4/10), passport.gov.ph (Unable to rate: Cloudflare bot challenge, zero issues). Confirmed-run report pages: https://claude.ai/artifact/Nu3a6Jqsz9tKdnZCaTqRDs
- Frontend: merged as-is from `feat/ui`, not yet run in this session. It ships a scripted demo client (`web/lib/demo.ts`, fake site "brightside.app") and an HTTP client (`web/lib/http-client.ts`) selected when `NEXT_PUBLIC_UXIE_API` is set and the URL is not the demo site (`web/components/Uxie.tsx:16-19`).
- Contract match, checked by reading both sides: `web/lib/types.ts` is a trimmed copy of `server/src/types.ts` (same `AvatarId` roster, `Step`, `Issue`, `Report`, `RunEvent`, `RunRequest`). SSE framing (`event:` = type, `data:` = full event JSON) matches `server/API.md`. Screenshot paths are prefixed with the API base in the client. `avatar_status: running` is emitted per avatar before its loop, which the UI relies on to leave `queued`.

## Decisions already made (do not reopen)

- Five avatars `lola, mika, ava, dev, grace`; profiles load from `avatars/2026-10-25-uxie-avatars.json`; executable rules stay in `server/src/avatars.ts`.
- One overall score 1–10 or `null` + `unableToRateReason`; blocker caps at 6; `principlesSource: 'pending'` until `.agents/skills/ux-principles/SKILL.md` exists (another teammate owns it).
- No typing, no form submission; consequential buttons are filtered out of candidates.
- Bot-challenge pages end an avatar `failed` with reason `blocked: bot challenge (...)`; all failed → Unable to rate.
- Spec and plan: `docs/superpowers/specs/2026-10-25-uxie-design.md`, `docs/superpowers/plans/2026-10-25-uxie-backend.md`. Contract doc: `server/API.md`.

## Remaining work, in order

1. **Run both locally.** `cd server && npm start` (reads repo-root `.env`: `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL=gpt-6.1-sol`, `PORT=4000`). `cd web && npm install && echo 'NEXT_PUBLIC_UXIE_API=http://localhost:4000' > .env.local && npm run dev`. Launch → paste `https://withamplify.ai` → default avatars → goal "Find the pricing". Watch for the "Scripted demo" pill: if it shows, the env var did not reach the client bundle.
2. **Issue `title`.** `web/components/Report.tsx:77,159` renders `it.title ?? it.description`; the backend never sets `title`, so cards show the full description as the headline. Add `title` (≤ 60 chars, plain language) to the summarizer schema and `Issue` in `server/src/report.ts` / `server/src/types.ts`, keep `description` as is, copy the type line into `server/API.md`, and extend `server/test/report.test.ts` (one assertion). Fallback report: `title` = first clause of `description`.
3. **Per-step narration (optional, UI-rules call).** The run screen types out `step.narration ?? step.label` (`web/components/RunScreen.tsx:51`). Backend sends only templated labels ("Opening Pricing"), which the spec chose to save a model call per step. If the demo feels flat, add a cheap templated `narration` in `server/src/executor.ts` `labelFor` style (persona-flavored, no model call) rather than a Responses call; the spec forbids per-step generated narration.
4. **Compiling screen timing.** The UI shows "compiling" once every avatar ends and waits for the `report` event. Backend sets `run.status='finished'` only after the report, and emits `report` then `run_status`, so this works; confirm it does not hang when the summarizer falls back (fallback still emits `report`).
5. **Stop.** UI `stop()` posts `/runs/:id/stop`; backend ends in-flight steps, marks avatars `stopped`, builds a partial report. Confirm the UI reaches the report screen after Stop (it waits for `allDone`, which `stopped` satisfies).
6. **Run cards during long steps.** First step arrives ~3 s after POST; Lola/Grace steps can take 10–25 s each on heavy pages. The card shows "Opening a fresh browser…" until step 1; acceptable, but check the elapsed timer keeps ticking.
7. **Reconnect/refresh.** Refreshing mid-run loses the EventSource; the UI has no run-id in the URL. Backend replay supports late joins (`GET /runs/:id/events` replays steps, statuses, report, then `run_status` last). Only worth wiring if the demo needs it.
8. **Demo rehearsal.** The spec's demo is: run on a site the team controls, show a blocker, paste the fix prompt into Codex, rerun. Use withamplify.ai with "Find the pricing" (Mika's 42×42px menu button is the reliable finding). `server/scripts/rehearse.ts` prints the full report and opens screenshots on the Desktop: `PORT=4100 OUT=uxie-rehearsal AVATARS=lola,mika,dev node --env-file=../.env scripts/rehearse.ts`.

## Known gaps and risks

- Ava (keyboard-only, tree-only) is the weakest avatar: on two of six goals she ends `gave_up` (reason `loop` or `cap`) rather than finding the target. The report says so plainly; do not hide it.
- HN "submit" scores 6 because `/submit` shows a login wall and the goal check treats that as not reached. Debatable, left as is.
- Grace's `consent_choice_clear` only fires when a consent *button* is in the tree (`server/src/agent.ts`); sites with link-only banners never trigger it.
- `GET /avatars` exists but the UI hardcodes its roster in `web/lib/avatars.ts`; keep them in sync by hand if the JSON changes.
- `server/runs/` grows ~5 MB per run (PNGs); gitignored, clear it before the demo.
- No model-call timeout beyond Node's default; a stuck Decisions call can exceed the 240 s cap.
- `web/` has not been built or linted here. Next.js 16 may differ from training data; read `web/AGENTS.md` and `web/node_modules/next/dist/docs/` before editing React code.

## Useful commands

```bash
cd server && npm test                                   # 22 tests, no network
cd server && npm start                                  # API on :4000, reads ../.env
cd web && npm run dev                                   # UI on :3000, needs .env.local
curl -s localhost:4000/runs -H 'content-type: application/json' \
  -d '{"url":"https://withamplify.ai","goal":"Find the pricing","avatarIds":["lola","mika","dev"]}'
curl -N localhost:4000/runs/<runId>/events
```

## Suggested skills for the next agent

`run` (launch both apps and screenshot the UI), `superpowers:systematic-debugging` for any contract mismatch, `responsive-design` if the run grid breaks on phone width, `user-facing-changes` when reporting back.
