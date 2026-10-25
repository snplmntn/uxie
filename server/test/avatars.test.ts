import { test } from 'node:test'; import assert from 'node:assert/strict'
import { AVATARS, getAvatar, SHARED_JUDGMENTS } from '../src/avatars.ts'
test('five avatars in spec order with persona, viewport and give-up floor', () => {
  assert.deepEqual(AVATARS.map(a => a.id), ['lola','mika','dev','ren','ava'])
  for (const a of AVATARS) { assert.ok(a.persona.length > 100); assert.ok(a.browser.viewport.width > 0); assert.ok(a.tagline && a.whatChanges) }
})
test('spec-pinned mechanics', () => {
  assert.equal(getAvatar('lola')!.giveUpAfter, 4); assert.equal(getAvatar('dev')!.giveUpAfter, 3)
  for (const id of ['mika','ren','ava']) assert.equal(getAvatar(id)!.giveUpAfter, 5)
  assert.equal(getAvatar('lola')!.browser.zoom, 2); assert.equal(getAvatar('lola')!.browser.reducedMotion, true)
  assert.equal(getAvatar('mika')!.browser.device, 'iPhone 15'); assert.equal(getAvatar('mika')!.browser.touch, true)
  assert.equal(getAvatar('ren')!.browser.keyboardOnly, true); assert.equal(getAvatar('ava')!.browser.noScreenshot, true)
  assert.deepEqual(getAvatar('dev')!.judgments, [])
  assert.deepEqual(SHARED_JUDGMENTS.map(j => j.name), ['content_clear']); assert.equal(SHARED_JUDGMENTS[0].severity, 'minor')
  assert.deepEqual(getAvatar('ren')!.judgments.map(j => j.name), ['focus_visible'])
  assert.deepEqual(getAvatar('lola')!.judgments.map(j => j.name), ['readable'])
  assert.deepEqual(getAvatar('mika')!.judgments.map(j => j.name), ['target_too_small'])
})
