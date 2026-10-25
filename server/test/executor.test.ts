// server/test/executor.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { labelFor } from '../src/executor.ts'; import { getAvatar } from '../src/avatars.ts'
test('labels are templated per action and avatar', () => {
  assert.equal(labelFor({kind:'click',ref:'link|Pricing|0',label:'Pricing'}, getAvatar('dev')!), 'Opening "Pricing"')
  assert.equal(labelFor({kind:'click',ref:'link|Pricing|0',label:'Pricing'}, getAvatar('mika')!), 'Tapping "Pricing"')
  assert.equal(labelFor({kind:'press',key:'Shift+Tab'}, getAvatar('ren')!), 'Pressing Shift+Tab')
  assert.equal(labelFor({kind:'scroll',direction:'down'}, getAvatar('lola')!), 'Scrolling down')
})
