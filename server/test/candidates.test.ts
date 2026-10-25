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
test('Ren gets the permitted key presses only', () => {
  const c = buildCandidates(snap, getAvatar('ren')!)
  assert.deepEqual(c.map(x => x.value), ['press_tab','press_shift_tab','press_enter','press_space','press_arrowdown','press_arrowup','press_escape','done','give_up'])
})
test('unnamedControls counts empty names', () => { assert.equal(unnamedControls(snap), 1) })
