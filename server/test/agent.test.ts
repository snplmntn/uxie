// server/test/agent.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { frictionFromStep, consecutiveTaskFriction, finalStatus } from '../src/agent.ts'
import { getAvatar } from '../src/avatars.ts'
const dec = (j:Record<string,number> = {}) => ({ candidate:{value:'click_0',description:'click link "x"',action:{kind:'click',ref:'link|x|0',label:'x'}}, confidence:0.9, probabilities:[], goalReached:0, judgments:j }) as any
test('executor errors are not friction; judgments and measurements are', () => {
  assert.deepEqual(frictionFromStep(dec(), { ok:false, reason:'detached' }, getAvatar('dev')!, ''), [])
  assert.equal(frictionFromStep(dec({ focus_visible:0.1 }), { ok:true }, getAvatar('ren')!, '', 'link|Pricing')[0].severity, 'major')
  assert.deepEqual(frictionFromStep(dec({ focus_visible:0.9 }), { ok:true }, getAvatar('ren')!, '', 'link|Pricing'), [])
  assert.deepEqual(frictionFromStep(dec({ focus_visible:0.1 }), { ok:true }, getAvatar('ren')!, '', 'none'), [])
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
