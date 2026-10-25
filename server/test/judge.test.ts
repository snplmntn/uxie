// server/test/judge.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { buildDecisionRequest, decide } from '../src/judge.ts'
import { getAvatar } from '../src/avatars.ts'
import { buildCandidates } from '../src/candidates.ts'
const base = (id:string) => ({ avatar:getAvatar(id)!, goal:'Find the pricing', url:'https://x.test', title:'X', snapshot:'- link "Pricing"', history:[], candidates:buildCandidates('- link "Pricing"', getAvatar(id)!) })
test('request carries next_action, goal_reached and avatar judgments; Ava never gets an image', () => {
  const r:any = buildDecisionRequest({ ...base('grace'), screenshotB64:'AAA=' })
  assert.equal(r.model, 'gpt-6-luna')
  assert.deepEqual(r.questions.map((q:any) => q.name), ['next_action','goal_reached','content_clear','consent_choice_clear'])
  assert.ok(r.input[0].content.some((c:any) => c.type === 'input_image'))
  const a:any = buildDecisionRequest({ ...base('ava'), screenshotB64:'AAA=', pageText:'Plans from $9' })
  assert.ok(!a.input[0].content.some((c:any) => c.type === 'input_image'))
  assert.match(a.input[0].content[0].text, /Plans from \$9/)
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
