// Manual live rehearsal (not part of npm test): cd server && node --env-file=../.env scripts/rehearse.ts
// Env: URL, GOAL, AVATARS (comma-separated). Exits 1 on a navigation failure or a run over 6 minutes.
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'
import type { Report, RunEvent } from '../src/types.ts'

process.env.PORT = '4100'
const { RUNS_DIR } = await import('../src/run.ts')
await import('../src/index.ts')
const base = 'http://localhost:4100'

const url = process.env.URL || 'https://withamplify.ai'
const goal = process.env.GOAL || 'Find the pricing'
const avatarIds = (process.env.AVATARS || 'lola,mika,dev').split(',').map(s => s.trim()).filter(Boolean)

const res = await fetch(`${base}/runs`, { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ url, goal, avatarIds }) })
const body = await res.json()
if (!res.ok) { console.error('POST /runs failed:', body.error); process.exit(1) }
const runId: string = body.runId
console.log(`run ${runId}: ${url} — "${goal}" — ${avatarIds.join(', ')}`)

const abort = new AbortController()
const timer = setTimeout(() => abort.abort(), 6 * 60_000)
let report: Report | undefined
let navFailure = false
try {
  const stream = await fetch(`${base}/runs/${runId}/events`, { signal:abort.signal })
  const decoder = new TextDecoderStream()
  let buf = ''
  outer: for await (const chunk of stream.body!.pipeThrough(decoder)) {
    buf += chunk
    let i: number
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, i); buf = buf.slice(i + 2)
      const data = frame.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trimStart()).join('\n')
      if (!data) continue
      const e = JSON.parse(data) as RunEvent
      if (e.type === 'step') {
        const s = e.step
        console.log(`[${s.avatarId}] #${s.n} ${s.label}`)
        for (const f of s.friction) console.log(`  ⚠ ${f.severity}: ${f.description}`)
        if (s.executorError) console.log(`  ✗ executor: ${s.executorError}`)
      } else if (e.type === 'avatar_status') {
        if (e.status !== 'running') console.log(`[${e.avatarId}] → ${e.status}${e.reason ? ` (${e.reason})` : ''}`)
        if (e.status === 'failed' && e.reason?.startsWith('navigation:')) navFailure = true
      } else if (e.type === 'report') report = e.report
      else if (e.type === 'run_status' && e.status === 'finished') break outer
    }
  }
} catch (err) {
  if (!abort.signal.aborted) throw err
} finally { clearTimeout(timer); abort.abort() }

if (!report) { console.error('run did not finish within 6 minutes'); process.exit(1) }

console.log(JSON.stringify(report, null, 2))
const jsonPath = `${RUNS_DIR}rehearsal-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
writeFileSync(jsonPath, JSON.stringify(report, null, 2))

console.log('\n=== Summary ===')
console.log(report.overallScore === null ? `Score: Unable to rate: ${report.unableToRateReason}` : `Score: ${report.overallScore}`)
if (report.partial) console.log('(partial results)')
if (report.principlesSource === 'pending') console.log('UI/UX principles source pending')
console.log(`Assessment: ${report.assessment}`)
console.log('Recommendations:')
for (const r of report.recommendations) console.log(`- ${r.title}: ${r.why}`)
console.log('Avatars:')
for (const a of report.avatars) console.log(`- ${a.avatarId}: ${a.status}, ${a.steps} steps, ${a.seconds}s`)
console.log('Top issues:')
for (const is of report.issues.slice(0, 3)) console.log(`- [${is.severity}] ${is.description}${is.element ? ` (element: ${is.element})` : ''}`)

const desk = `${homedir()}/Desktop/uxie-rehearsal`
rmSync(desk, { recursive:true, force:true })
mkdirSync(desk, { recursive:true })
const pngs = readdirSync(`${RUNS_DIR}${runId}`).filter(f => f.endsWith('.png'))
for (const f of pngs) cpSync(`${RUNS_DIR}${runId}/${f}`, `${desk}/${f}`)
execFileSync('open', [desk])
console.log(`\nJSON: ${jsonPath}`)
console.log(`Screenshots (${pngs.length}): ${desk}`)
process.exit(navFailure ? 1 : 0)
