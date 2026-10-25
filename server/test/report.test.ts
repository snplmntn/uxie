import { test } from 'node:test'; import assert from 'node:assert/strict'
import { clusterFriction, validateReport, buildReport } from '../src/report.ts'
import { loadPrinciples } from '../src/principles.ts'
import { writeFileSync, mkdtempSync } from 'node:fs'; import { join } from 'node:path'; import { tmpdir } from 'node:os'
const step = (avatarId:any, n:number, url:string, friction:any[]) => ({ avatarId, n, url, title:'t', action:{kind:'scroll',direction:'down'}, label:'Scrolling down', screenshot:`/screenshots/r/${avatarId}-${n}.png`, friction, confidence:1, judgments:{}, goalReached:0, at:'' })
const run:any = { id:'r', url:'https://a.com', goal:'Find the pricing', status:'finished', startedAt:'2026-10-25T00:00:00Z', avatars:{
  lola:{ avatarId:'lola', status:'gave_up', startedAt:'2026-10-25T00:00:00Z', endedAt:'2026-10-25T00:01:00Z', steps:[ step('lola',1,'https://a.com/pricing',[{severity:'major',description:'Content needed for the task is hard to read or clipped at 200% enlargement',element:'link|Pricing|0'}]) ] },
  ren:{ avatarId:'ren', status:'done', startedAt:'2026-10-25T00:00:00Z', endedAt:'2026-10-25T00:00:30Z', steps:[ step('ren',1,'https://a.com/pricing?x=1',[{severity:'blocker',description:'Content needed for the task is hard to read or clipped at 200% enlargement',element:'link|Pricing|0'}]), step('ren',2,'https://a.com/',[]) ] } } }
test('clusterFriction merges same path, element and problem; max severity; blockers first', () => {
  const c = clusterFriction(run); assert.equal(c.length, 1); assert.equal(c[0].severity, 'blocker'); assert.deepEqual(c[0].avatarIds.sort(), ['lola','ren']); assert.equal(c[0].stepRefs.length, 2)
})
test('clusterFriction promotes majors in a friction-floor give-up streak to blocker', () => {
  const f = [{ severity:'major', description:'Hard to read', element:'link|Pricing|0' }]
  const r:any = { ...run, avatars:{ lola:{ ...run.avatars.lola, reason:'friction floor', steps:[1,2,3,4].map(n => step('lola', n, 'https://a.com/pricing', f)) } } }
  const c = clusterFriction(r); assert.equal(c.length, 1); assert.equal(c[0].severity, 'blocker')
})
test('validateReport enforces range, references, blocker cap and pending principles', () => {
  const clusters = clusterFriction(run); const key = clusters[0].key
  const good = { overallScore: 8, assessment:'ok', avatarNotes:[{ avatarId:'lola', note:'Reached Pricing but the plan names did not say what she would get' }], recommendations:[{ title:'t', why:'w', avatarIds:['lola'], issueIds:[key], principle:'Nielsen 1' }], issues:[{ clusterKey:key, description:'d', severity:'blocker', principle:'Nielsen 1', fixPrompt:'f' }] }
  const v = validateReport(good, clusters, 'pending', run); assert.ok(v.ok)
  if (v.ok) { assert.equal(v.value.avatarNotes.length, 2); assert.match(v.value.avatarNotes[1].note, /done/i); assert.equal(v.value.overallScore, 6); assert.equal(v.value.issues[0].principle, undefined); assert.match(v.value.assessment, /principles source pending/) }
  assert.equal(validateReport({ ...good, overallScore: 11 }, clusters, 'loaded', run).ok, false)
  assert.equal(validateReport({ ...good, overallScore: '7' }, clusters, 'loaded', run).ok, false)
  assert.equal(validateReport({ ...good, issues:[{ ...good.issues[0], clusterKey:'nope' }] }, clusters, 'loaded', run).ok, false)
  assert.equal(validateReport({ ...good, recommendations:[{ ...good.recommendations[0], issueIds:['nope'] }] }, clusters, 'loaded', run).ok, false)
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
