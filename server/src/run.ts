import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { AvatarId, AvatarRun, Report, Run, RunEvent } from './types.ts'
import { getAvatar } from './avatars.ts'
import { runAvatar } from './agent.ts'

export type RunRequest = { url:string; goal:string; avatarIds:AvatarId[] }

export const RUNS_DIR = fileURLToPath(new URL('../runs/', import.meta.url))
const DEFAULT_GOAL = 'Find the pricing'

const runs = new Map<string, Run>()
const listeners = new Map<string, Set<(e:RunEvent)=>void>>()

export function parseRunRequest(body:unknown): RunRequest {
  const b = (body ?? {}) as Record<string, unknown>
  let u: URL
  try { u = new URL(String(b.url ?? '')) } catch { throw new Error('url must be an absolute http(s) URL') }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('url must use http or https')
  if (!u.hostname.includes('.')) throw new Error('url hostname must contain a dot')
  const ids = b.avatarIds
  if (!Array.isArray(ids) || ids.length === 0) throw new Error('avatarIds must be a non-empty array')
  for (const id of ids) if (typeof id !== 'string' || !getAvatar(id)) throw new Error(`unknown avatar: ${String(id)}`)
  const goal = typeof b.goal === 'string' && b.goal.trim() ? b.goal.trim() : DEFAULT_GOAL
  return { url:u.href, goal, avatarIds:[...new Set(ids as AvatarId[])] }
}

export function getRun(id:string): Run | undefined { return runs.get(id) }

export function subscribe(id:string, fn:(e:RunEvent)=>void): () => void {
  let set = listeners.get(id)
  if (!set) listeners.set(id, set = new Set())
  set.add(fn)
  return () => { set.delete(fn) }
}

function emit(run:Run, e:RunEvent) {
  // Keep the stored Run current so GET /runs/:id and late SSE subscribers see live progress.
  if (e.type === 'step') run.avatars[e.step.avatarId].steps.push(e.step)
  else if (e.type === 'avatar_status') {
    const a = run.avatars[e.avatarId]
    a.status = e.status
    if (e.reason) a.reason = e.reason
    if (e.status !== 'running') a.endedAt ??= new Date().toISOString()
  }
  for (const fn of listeners.get(run.id) ?? []) {
    try { fn(e) } catch (err) { console.error('run listener failed', err) }
  }
}

export function stopRun(id:string): void {
  const run = runs.get(id)
  if (!run || run.status !== 'running') return
  run.status = 'stopping'
  emit(run, { type:'run_status', status:'stopping' })
}

export function createRun(req:RunRequest): Run {
  const id = randomUUID()
  const runDir = RUNS_DIR + id
  mkdirSync(runDir, { recursive:true })
  const now = new Date().toISOString()
  const run: Run = { id, url:req.url, goal:req.goal, status:'running', startedAt:now, avatars:{} }
  for (const avatarId of req.avatarIds) run.avatars[avatarId] = { avatarId, status:'running', steps:[], startedAt:now }
  runs.set(id, run)
  const isStopping = () => run.status === 'stopping'
  const tasks = req.avatarIds.map(avatarId => {
    emit(run, { type:'avatar_status', avatarId, status:'running' })
    return runAvatar({ runId:id, url:req.url, goal:req.goal, avatar:getAvatar(avatarId)!, runDir, isStopping, emit:e => emit(run, e) })
  })
  void finish(run, tasks)
  return run
}

async function finish(run:Run, tasks:Promise<AvatarRun>[]) {
  const results = await Promise.allSettled(tasks)
  results.forEach((r, i) => {
    const a = Object.values(run.avatars)[i]
    if (r.status === 'rejected' && a.status === 'running')
      emit(run, { type:'avatar_status', avatarId:a.avatarId, status:'failed', reason:String((r.reason as Error)?.message ?? r.reason) })
  })
  run.status = 'finished'
  try { run.report = await buildReport(run) }
  catch (e) { console.error('buildReport failed', e); run.report = stubReport(run, 'report failed: ' + (e as Error).message) }
  emit(run, { type:'report', report:run.report })
  emit(run, { type:'run_status', status:'finished' })
  listeners.delete(run.id)
}

// ponytail: stub until Task 8's buildReport lands; only the run statistics are real.
async function buildReport(run:Run): Promise<Report> { return stubReport(run, 'report not implemented') }

function stubReport(run:Run, unableToRateReason:string): Report {
  const avatars = Object.values(run.avatars).map(a => ({
    avatarId:a.avatarId, status:a.status, steps:a.steps.length,
    seconds:Math.round((Date.parse(a.endedAt ?? new Date().toISOString()) - Date.parse(a.startedAt)) / 1000),
  }))
  const counts = avatars.map(a => a.steps).sort((x, y) => x - y)
  const mid = counts.length >> 1
  const medianSteps = counts.length ? (counts.length % 2 ? counts[mid] : (counts[mid - 1] + counts[mid]) / 2) : 0
  return {
    runId:run.id, goal:run.goal, url:run.url, partial:avatars.some(a => a.status === 'stopped'), principlesSource:'pending',
    overallScore:null, unableToRateReason, assessment:'', avatarNotes:[], recommendations:[], issues:[],
    succeeded:avatars.filter(a => a.status === 'done').length, total:avatars.length, medianSteps, avatars,
  }
}
