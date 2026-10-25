import { test } from 'node:test'; import assert from 'node:assert/strict'
import { AVATARS, getAvatar, SHARED_JUDGMENTS } from '../src/avatars.ts'
test('five avatars in spec order with persona, viewport and give-up floor', () => {
  assert.deepEqual(AVATARS.map(a => a.id), ['lola','mika','ava','dev','grace'])
  assert.equal(getAvatar('mika')!.interactionConstraints.activationMode, 'touch')
  assert.equal(getAvatar('ava')!.interactionConstraints.activationMode, 'keyboard')
  assert.equal(getAvatar('ava')!.interactionConstraints.modelReceivesScreenshot, false)
  assert.equal(getAvatar('grace')!.interactionConstraints.neverAcceptOptionalCookies, true)
  for (const a of AVATARS) { assert.ok(a.persona.length > 100); assert.ok(a.browser.viewport.width > 0); assert.ok(a.tagline && a.whatChanges) }
})
test('spec-pinned mechanics', () => {
  assert.equal(getAvatar('lola')!.giveUpAfter, 4); assert.equal(getAvatar('dev')!.giveUpAfter, 3)
  for (const id of ['mika','ava','grace']) assert.equal(getAvatar(id)!.giveUpAfter, 5)
  assert.equal(getAvatar('lola')!.browser.zoom, 2); assert.equal(getAvatar('lola')!.browser.reducedMotion, true)
  assert.equal(getAvatar('mika')!.browser.device, 'iPhone 15'); assert.equal(getAvatar('mika')!.browser.touch, true)
  assert.equal(getAvatar('ava')!.browser.keyboardOnly, true); assert.equal(getAvatar('ava')!.browser.noScreenshot, true)
  assert.deepEqual(getAvatar('dev')!.judgments, [])
  assert.deepEqual(SHARED_JUDGMENTS.map(j => j.name), ['content_clear']); assert.equal(SHARED_JUDGMENTS[0].severity, 'minor')
  assert.deepEqual(getAvatar('ava')!.judgments, [])
  assert.deepEqual(getAvatar('grace')!.judgments.map(j => j.name), ['consent_choice_clear'])
  assert.deepEqual(getAvatar('lola')!.judgments.map(j => j.name), ['readable'])
  const readable = getAvatar('lola')!.judgments[0]
  assert.deepEqual(readable.levels!.map(l => l.label), ['clear','strained','unreadable'])
  assert.equal(readable.frictionWhen(1.9), true); assert.equal(readable.frictionWhen(1.0), false)
  assert.deepEqual(getAvatar('mika')!.judgments.map(j => j.name), ['target_too_small'])
})
