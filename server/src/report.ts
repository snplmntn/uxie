import type { AvatarId, AvatarRun, AvatarStatus, Box, Issue, Report, Run, Severity, StepRef } from './types.ts'
import { getAvatar } from './avatars.ts'
import { summarize } from './judge.ts'
import { loadPrinciples } from './principles.ts'

export type Cluster = { key:string; pageUrl:string; element?:string; severity:Severity; avatarIds:AvatarId[]; stepRefs:StepRef[]; screenshot:string|null; treeExcerpt?:string; box?:Box; description:string }
type Source = 'loaded'|'pending'
type Body = Pick<Report,'overallScore'|'unableToRateReason'|'assessment'|'avatarNotes'|'recommendations'|'issues'>

const PENDING = 'UI/UX principles source pending'
const RANK: Record<Severity, number> = { blocker:0, major:1, minor:2 }
const name = (id:AvatarId) => getAvatar(id)?.name ?? id
const path = (url:string) => { try { return new URL(url).pathname } catch { return url } }

export function clusterFriction(run:Run): Cluster[] {
  const byKey = new Map<string, Cluster>()
  for (const a of Object.values(run.avatars)) {
    // A friction-floor give-up proves the trailing streak blocked the task: promote its majors.
    const promoted = new Set<object>()
    if (a.status === 'gave_up' && a.reason === 'friction floor')
      for (let i = a.steps.length - 1; i >= 0 && promoted.size < (getAvatar(a.avatarId)?.giveUpAfter ?? 0) && a.steps[i].friction.some(f => f.severity !== 'minor'); i--) promoted.add(a.steps[i])
    for (const s of a.steps) for (const raw of s.friction) {
      const f = promoted.has(s) && raw.severity === 'major' ? { ...raw, severity:'blocker' as const } : raw
      const key = `${path(s.url)}|${f.element ?? ''}|${f.description}`
      let c = byKey.get(key)
      if (!c) byKey.set(key, c = { key, pageUrl:s.url, element:f.element, severity:f.severity, avatarIds:[], stepRefs:[], screenshot:s.screenshot, treeExcerpt:s.treeExcerpt, box:f.box ?? s.box, description:f.description })
      if (RANK[f.severity] < RANK[c.severity]) c.severity = f.severity
      if (!c.avatarIds.includes(s.avatarId)) c.avatarIds.push(s.avatarId)
      if (!c.stepRefs.some(r => r.avatarId === s.avatarId && r.n === s.n)) c.stepRefs.push({ avatarId:s.avatarId, n:s.n })
      c.screenshot ??= s.screenshot
    }
  }
  return [...byKey.values()].sort((x, y) => RANK[x.severity] - RANK[y.severity] || y.avatarIds.length - x.avatarIds.length)
}

const OUTCOME: Record<AvatarStatus, string> = {
  done:'reached the goal (done)', gave_up:'gave up', unverified:'ended without verified evidence (unverified)',
  failed:'hit a technical failure (failed)', stopped:'was stopped', queued:'never started', running:'was still running',
}
function templatedNote(a:AvatarRun): string {
  const n = a.steps.length, last = a.steps.at(-1)
  return `${name(a.avatarId)} ${OUTCOME[a.status]} after ${n} step${n === 1 ? '' : 's'}${last ? ` on ${path(last.url)}` : ''}`
}

function issueFromCluster(c:Cluster, d:{ description:string; fixPrompt:string; principle?:string }): Issue {
  const { key, ...rest } = c
  return { id:key, ...rest, description:d.description, fixPrompt:d.fixPrompt, ...(d.principle ? { principle:d.principle } : {}) }
}

export function fallbackReport(run:Run, clusters:Cluster[], source:Source, reason:string): Report {
  const issues = clusters.map(c => issueFromCluster(c, { description:c.description, fixPrompt: [
    `Site: ${run.url}  Page: ${c.pageUrl}`,
    `Affected users: ${c.avatarIds.map(id => `${name(id)} (${getAvatar(id)?.whatChanges ?? id})`).join(', ')}`,
    `What happened: ${c.description} (steps ${c.stepRefs.map(r => `${name(r.avatarId)} #${r.n}`).join(', ')}).`,
    `Element: ${c.element ?? 'unknown'}`,
    `Principle: ${source === 'pending' ? 'source pending' : 'not matched (summarizer unavailable)'}`,
    `Fix: Remove the observed barrier: ${c.description.toLowerCase()}.`,
    `Verify: ${c.avatarIds.map(name).join(', ')} can continue "${run.goal}" on this page without this friction.`,
  ].join('\n') }))
  const assessment = `Unable to rate: ${reason}. The issues below come from captured behavior only.` + (source === 'pending' ? ` ${PENDING}.` : '')
  return assemble(run, clusters, source, { overallScore:null, unableToRateReason:reason, assessment,
    avatarNotes:Object.values(run.avatars).map(a => ({ avatarId:a.avatarId, note:templatedNote(a) })), recommendations:[], issues })
}

const str = (v:unknown): v is string => typeof v === 'string'

export function validateReport(raw:unknown, clusters:Cluster[], source:Source, run:Run): { ok:true; value:Body } | { ok:false; reason:string } {
  const r = (raw ?? {}) as Record<string, any>
  const score = r.overallScore
  if (score !== null && !(Number.isInteger(score) && score >= 1 && score <= 10)) return { ok:false, reason:`overallScore out of range: ${JSON.stringify(score)}` }
  if (!str(r.assessment)) return { ok:false, reason:'assessment missing' }
  if (!Array.isArray(r.avatarNotes) || !Array.isArray(r.recommendations) || !Array.isArray(r.issues)) return { ok:false, reason:'avatarNotes, recommendations or issues not an array' }
  if (r.recommendations.length > 3) return { ok:false, reason:'more than 3 recommendations' }
  const byKey = new Map(clusters.map(c => [c.key, c]))
  const selected = Object.keys(run.avatars) as AvatarId[]
  const principle = (p:unknown) => source === 'loaded' && str(p) && p.trim() ? p : undefined

  const issues: Issue[] = []
  for (const i of r.issues) {
    const c = byKey.get(i?.clusterKey)
    if (!c) return { ok:false, reason:`unknown clusterKey: ${i?.clusterKey}` }
    if (!str(i.description) || !str(i.fixPrompt)) return { ok:false, reason:`issue ${c.key} missing description or fixPrompt` }
    if (!issues.some(x => x.id === c.key)) issues.push(issueFromCluster(c, { description:i.description, fixPrompt:i.fixPrompt, principle:principle(i.principle) }))
  }
  const recommendations: Report['recommendations'] = []
  for (const rec of r.recommendations) {
    if (!str(rec?.title) || !str(rec.why) || !Array.isArray(rec.issueIds)) return { ok:false, reason:'recommendation missing title, why or issueIds' }
    const unknown = rec.issueIds.find((id:unknown) => !byKey.has(id as string))
    if (unknown !== undefined) return { ok:false, reason:`unknown recommendation issueId: ${unknown}` }
    const p = principle(rec.principle)
    recommendations.push({ title:rec.title, why:rec.why, issueIds:rec.issueIds,
      avatarIds:(Array.isArray(rec.avatarIds) ? rec.avatarIds : []).filter((id:AvatarId) => selected.includes(id)), ...(p ? { principle:p } : {}) })
  }
  const notes = new Map<string, string>()
  for (const n of r.avatarNotes) if (selected.includes(n?.avatarId) && str(n.note) && !notes.has(n.avatarId)) notes.set(n.avatarId, n.note)
  const avatarNotes = selected.map(id => ({ avatarId:id, note:notes.get(id) ?? templatedNote(run.avatars[id]) }))

  // ponytail: cap on any observed blocker cluster, a superset of blocker issues the model kept.
  const overallScore = score === null ? null : clusters.some(c => c.severity === 'blocker') ? Math.min(score, 6) : score
  let assessment: string = r.assessment
  if (source === 'pending' && !assessment.includes(PENDING)) assessment += ` ${PENDING}.`
  const unableToRateReason = overallScore === null ? (str(r.unableToRateReason) && r.unableToRateReason ? r.unableToRateReason : 'the report gave no score') : undefined
  return { ok:true, value:{ overallScore, ...(unableToRateReason ? { unableToRateReason } : {}), assessment, avatarNotes, recommendations, issues } }
}

export function runStats(run:Run) {
  const avatars = Object.values(run.avatars).map(a => ({
    avatarId:a.avatarId, status:a.status, steps:a.steps.length,
    seconds:Math.round((Date.parse(a.endedAt ?? new Date().toISOString()) - Date.parse(a.startedAt)) / 1000),
  }))
  const counts = avatars.map(a => a.steps).sort((x, y) => x - y), mid = counts.length >> 1
  const medianSteps = counts.length ? (counts.length % 2 ? counts[mid] : (counts[mid - 1] + counts[mid]) / 2) : 0
  return { avatars, medianSteps, succeeded:avatars.filter(a => a.status === 'done').length, total:avatars.length }
}

function assemble(run:Run, clusters:Cluster[], source:Source, body:Body): Report {
  const stats = runStats(run)
  const partial = run.status === 'stopping' || stats.avatars.some(a => a.status === 'stopped' || a.status === 'failed')
  const worstBlocker = clusters.find(c => c.severity === 'blocker')?.description
  return { runId:run.id, goal:run.goal, url:run.url, partial, principlesSource:source, ...body, ...stats, ...(worstBlocker ? { worstBlocker } : {}) }
}

const ANCHORS = `| Score | Meaning |
|---|---|
| 1–2 | The core task is broadly blocked by observed interface barriers. |
| 3–4 | Serious barriers block at least one tested interaction mode or repeatedly obstruct the task. |
| 5–6 | The task is achievable in much of the tested scope, but meaningful friction needs attention. |
| 7–8 | The tested paths generally work, with a few clear improvements. |
| 9–10 | The tested paths work smoothly, with little or no supported friction; this is not a site-wide guarantee. |`

const FIX_TEMPLATE = `Site: <url>  Page: <page url at the time>
Affected users: <avatar names and what they share, e.g. "low-vision and mobile users">
What happened: <two or three sentences, from the step log>
Element: <accessible name / selector, if known>
Principle: <matching rule from the loaded UI/UX skill, or source pending>
Fix: <specific, minimal change>
Verify: <what the avatar should be able to do afterwards>`

function buildPrompt(run:Run, clusters:Cluster[], principles:{ source:Source; text:string }): string {
  const logs = Object.values(run.avatars).map(a => [
    `## ${name(a.avatarId)} (${a.avatarId}; ${getAvatar(a.avatarId)?.whatChanges}): ${a.status}${a.reason ? ` (${a.reason})` : ''}, ${a.steps.length} steps`,
    ...a.steps.flatMap(s => [
      `#${s.n} ${s.label} @ ${s.url}`,
      ...s.friction.map(f => `  friction [${f.severity}] ${f.description}${f.element ? ` (element ${f.element})` : ''}${f.measured ? ` measured: ${f.measured}` : ''}`),
      ...(s.executorError ? [`  executorError (technical, not usability): ${s.executorError}`] : []),
      ...(s.interruption ? [`  interruption (not automatically a defect): ${s.interruption}`] : []),
    ]),
  ].join('\n'))
  const cl = clusters.map(c => `- clusterKey: ${c.key}\n  severity ${c.severity}; page ${c.pageUrl}; avatars ${c.avatarIds.join(', ')}; steps ${c.stepRefs.map(r => `${r.avatarId}#${r.n}`).join(', ')}${c.treeExcerpt ? `\n  tree: ${c.treeExcerpt.slice(0, 300)}` : ''}`)
  return [
    'You write the final usability report for a preflight run in which simulated users attempted one goal on a website. Return JSON matching the schema.',
    principles.source === 'loaded' ? `UI/UX principles (cite a principle only when the observed evidence supports it):\n${principles.text}` : `${PENDING}. Do not cite principles or describe the assessment as book-based; set every principle to null and say "${PENDING}" in the assessment.`,
    `Pick one integer overallScore from 1 to 10 using these anchors:\n${ANCHORS}\nAn observed blocker in a tested interaction mode rules out the 7–10 range. Every reason for lowering the score must trace to a finding. Technical failures (executorError, API or browser errors) must not lower the score. If technical failures prevent any meaningful assessment, set overallScore to null and explain in unableToRateReason; otherwise set unableToRateReason to null.`,
    'assessment: a short plain-language explanation of the score and the tested scope, including incomplete coverage.',
    'avatarNotes: one note per selected avatar saying where they got to and, if they did not finish or flagged "Content unclear for this user", what they could not find or understand.',
    'recommendations: up to three general improvements ordered by user impact; do not manufacture problems. For any unclear-content finding, include a recommendation that describes the improved step the site should offer (clearer plan names, a one-line summary under each price, a plainer button label). issueIds must be clusterKeys from the list below.',
    `issues: one per supported cluster below, using its exact clusterKey. Skip clusters that are only technical failures or unsupported persona assumptions. Each fixPrompt must follow this template exactly:\n${FIX_TEMPLATE}`,
    `Goal: ${run.goal}\nSite: ${run.url}`,
    `# Avatar outcomes and step logs\n${logs.join('\n\n')}`,
    `# Friction clusters\n${cl.length ? cl.join('\n') : '(none observed)'}`,
  ].join('\n\n')
}

function buildSchema(run:Run, clusters:Cluster[]): object {
  const ids = { type:'string', enum:Object.keys(run.avatars) }
  const key = clusters.length ? { type:'string', enum:clusters.map(c => c.key) } : { type:'string' }
  const obj = (properties:Record<string, object>) => ({ type:'object', properties, required:Object.keys(properties), additionalProperties:false })
  const nstr = { type:['string', 'null'] }
  return obj({
    overallScore:{ type:['integer', 'null'] }, unableToRateReason:nstr, assessment:{ type:'string' },
    avatarNotes:{ type:'array', items:obj({ avatarId:ids, note:{ type:'string' } }) },
    recommendations:{ type:'array', items:obj({ title:{ type:'string' }, why:{ type:'string' }, avatarIds:{ type:'array', items:ids }, issueIds:{ type:'array', items:key }, principle:nstr }) },
    issues:{ type:'array', items:obj({ clusterKey:key, description:{ type:'string' }, principle:nstr, fixPrompt:{ type:'string' } }) },
  })
}

export async function buildReport(run:Run, deps:{ summarizeImpl?:typeof summarize; principles?:ReturnType<typeof loadPrinciples> } = {}): Promise<Report> {
  const principles = deps.principles ?? loadPrinciples()
  const clusters = clusterFriction(run)
  const all = Object.values(run.avatars)
  if (all.length && all.every(a => a.status === 'failed'))
    return fallbackReport(run, clusters, principles.source, 'all avatars failed: ' + all.map(a => `${name(a.avatarId)}: ${a.reason ?? 'unknown'}`).join('; '))
  try {
    const raw = await (deps.summarizeImpl ?? summarize)(buildPrompt(run, clusters, principles), buildSchema(run, clusters))
    const v = validateReport(raw, clusters, principles.source, run)
    return v.ok ? assemble(run, clusters, principles.source, v.value) : fallbackReport(run, clusters, principles.source, 'report validation failed: ' + v.reason)
  } catch (e) {
    return fallbackReport(run, clusters, principles.source, 'report generation failed: ' + ((e as Error)?.message ?? String(e)))
  }
}
