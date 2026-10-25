import type { Action, Avatar, AvatarRun, AvatarStatus, Friction, RunEvent, Step } from './types.ts'
import type { Decision } from './judge.ts'
import type { ExecResult } from './executor.ts'
import type { PageState } from './browser.ts'
import type { BrowserContext, Page } from 'playwright'
import { SHARED_JUDGMENTS } from './avatars.ts'
import { buildCandidates, unnamedControls } from './candidates.ts'
import { decide } from './judge.ts'
import { openAvatarPage, captureState, currentPage } from './browser.ts'
import { applyAction, labelFor } from './executor.ts'

export type AgentCtx = { runId:string; url:string; goal:string; avatar:Avatar; runDir:string; isStopping:()=>boolean; emit:(e:RunEvent)=>void }

const MAX_STEPS = 25, MAX_MS = 240_000, MIN_TARGET = 44

export function frictionFromStep(decision:Decision, exec:ExecResult, avatar:Avatar, snapshot:string, focused?:string): Friction[] {
  if (!exec.ok) return []
  const out: Friction[] = []
  for (const j of [...SHARED_JUDGMENTS, ...avatar.judgments]) {
    // Focus visibility is only judgeable once a Tab has landed on something.
    if (j.name === 'focus_visible' && (!focused || focused === 'none')) continue
    const v = decision.judgments[j.name]
    if (j.name === 'target_too_small' && exec.box) {
      // A measured box overrides the model's guess either way.
      const { width:w, height:h } = exec.box
      if (w < MIN_TARGET || h < MIN_TARGET)
        out.push({ severity:j.severity, description:j.description, element:exec.element, box:exec.box, measured:`${Math.round(w)}×${Math.round(h)}px` })
    } else if (v !== undefined && j.frictionWhen(v)) {
      out.push({ severity:j.severity, description:j.description, ...(exec.element ? { element:exec.element, box:exec.box } : {}) })
    }
  }
  if (avatar.browser.noScreenshot) {
    const n = unnamedControls(snapshot)
    if (n > 0) out.push({ severity:'minor', description:`${n} unnamed controls in the accessibility tree` })
  }
  return out
}

export function consecutiveTaskFriction(steps:Step[]): number {
  let n = 0
  for (let i = steps.length - 1; i >= 0 && steps[i].friction.some(f => f.severity !== 'minor'); i--) n++
  return n
}

export function finalStatus(goalReached:number, end:'done'|'gave_up'|'cap'|'stopped'): AvatarStatus {
  if (end === 'stopped') return 'stopped'
  if (end === 'gave_up') return 'gave_up'
  if (goalReached >= 0.8) return 'done'
  if (end === 'done' && goalReached > 0.3) return 'unverified'
  return 'gave_up'
}

async function capture(page:Page, avatar:Avatar, path:string): Promise<PageState> {
  try { return await captureState(page, avatar, path) } catch {
    await page.waitForLoadState('domcontentloaded').catch(() => {})
    return captureState(page, avatar, path)
  }
}

export async function runAvatar(ctx:AgentCtx): Promise<AvatarRun> {
  const { avatar } = ctx
  const run: AvatarRun = { avatarId:avatar.id, status:'running', steps:[], startedAt:new Date().toISOString() }
  const t0 = Date.now()
  let context: BrowserContext | undefined
  const end = (status:AvatarStatus, reason?:string) => { run.status = status; if (reason) run.reason = reason }
  try {
    let opened
    try { opened = await openAvatarPage(avatar, ctx.url) }
    catch (e) { end('failed', 'navigation: ' + (e as Error).message); return run }
    context = opened.context
    context.setDefaultTimeout(5000)
    const { interruptions } = opened
    const lastG = () => run.steps.at(-1)?.goalReached ?? 0
    for (let n = 1; ; n++) {
      if (ctx.isStopping()) { end(finalStatus(lastG(), 'stopped')); break }
      if (n > MAX_STEPS || Date.now() - t0 > MAX_MS) { end(finalStatus(lastG(), 'cap'), 'cap'); break }
      const page = currentPage(context)
      if (!page) { end('failed', 'page closed'); break }
      const file = `${avatar.id}-${n}.png`
      let state: PageState
      try { state = await capture(page, avatar, `${ctx.runDir}/${file}`) }
      catch (e) { end('failed', 'capture: ' + (e as Error).message); break }
      let decision: Decision
      try {
        decision = await decide({ avatar, goal:ctx.goal, url:state.url, title:state.title, snapshot:state.snapshot, pageText:state.pageText,
          screenshotB64:state.screenshotB64, focused:state.focused, history:run.steps.map(s => s.label), candidates:buildCandidates(state.snapshot, avatar) })
      } catch (e) { end('failed', (e as Error).message); break }
      const action: Action = decision.candidate.action
      const terminal = action.kind === 'done' || action.kind === 'give_up'
      const exec: ExecResult = terminal ? { ok:true } : await applyAction(page, action, avatar)
      const step: Step = {
        avatarId:avatar.id, n, url:state.url, title:state.title, action, label:labelFor(action, avatar),
        screenshot:`/screenshots/${ctx.runId}/${file}`, friction:frictionFromStep(decision, exec, avatar, state.snapshot, state.focused),
        confidence:decision.confidence, judgments:decision.judgments, goalReached:decision.goalReached, at:new Date().toISOString(),
      }
      if (avatar.browser.noScreenshot) step.treeExcerpt = state.snapshot.slice(0, 1500)
      if (exec.box) step.box = exec.box
      if (!exec.ok) step.executorError = exec.reason
      if (interruptions.length) step.interruption = interruptions.splice(0).join('; ')
      run.steps.push(step)
      ctx.emit({ type:'step', step })
      if (action.kind === 'done') { end(finalStatus(decision.goalReached, 'done')); break }
      if (action.kind === 'give_up') { end('gave_up', 'model'); break }
      if (consecutiveTaskFriction(run.steps) >= avatar.giveUpAfter) { end('gave_up', 'friction floor'); break }
    }
    return run
  } catch (e) {
    end('failed', (e as Error).message)
    return run
  } finally {
    await context?.close().catch(() => {})
    run.endedAt = new Date().toISOString()
    ctx.emit({ type:'avatar_status', avatarId:avatar.id, status:run.status, ...(run.reason ? { reason:run.reason } : {}) })
  }
}
