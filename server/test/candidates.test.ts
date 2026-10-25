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
  assert.ok(c.some(x => x.action.kind === 'click' && x.action.label === 'Pricing'))
  assert.ok(!c.some(x => x.action.kind === 'click' && x.action.ref === 'button||0'))
  assert.ok(!c.some(x => (x.action as any).kind === 'type'))
  assert.deepEqual(c.slice(-5).map(x => x.value), ['scroll_down','scroll_up','press_escape','done','give_up'])
  assert.match(buildCandidates(snap, getAvatar('mika')!)[0].description, /^tap /)
  const big = Array.from({length: 80}, (_, i) => `- link "L${i}"`).join('\n')
  assert.equal(buildCandidates(big, getAvatar('dev')!).length, 40)
})
test('Ava gets the permitted key presses only', () => {
  const c = buildCandidates(snap, getAvatar('ava')!)
  assert.deepEqual(c.map(x => x.value), ['press_tab','press_shift_tab','press_enter','press_space','press_arrowup','press_arrowdown','press_arrowleft','press_arrowright','press_escape','press_alt_arrowleft','done','give_up'])
  assert.ok(c.every(x => ['press','done','give_up'].includes(x.action.kind)))
})
test('Grace never gets an accept-cookies candidate when a reject choice exists', () => {
  const banner = `- button "Accept all cookies"\n- button "Reject all"\n- link "Pricing"`
  const g = buildCandidates(banner, getAvatar('grace')!).map(x => x.description)
  assert.ok(!g.some(d => /Accept all/.test(d))); assert.ok(g.some(d => /Reject all/.test(d))); assert.ok(g.some(d => /Pricing/.test(d)))
  assert.ok(buildCandidates(banner, getAvatar('dev')!).some(x => /Accept all/.test(x.description)))
  assert.ok(buildCandidates(`- button "Accept all cookies"`, getAvatar('grace')!).some(x => /Accept all/.test(x.description)))
})
test('parseSnapshot reads single-quoted keys', () => {
  assert.deepEqual(parseSnapshot(`- 'link "Note: x"'\n- 'button "It''s \\"on\\""'`).map(n => [n.role, n.name, n.index]),
    [['link','Note: x',0], ['button','It\'s "on"',0]])
})
test('unnamedControls counts empty names', () => { assert.equal(unnamedControls(snap), 1) })
