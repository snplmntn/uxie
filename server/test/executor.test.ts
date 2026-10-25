// server/test/executor.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { labelFor, resolveLocator } from '../src/executor.ts'; import { getAvatar } from '../src/avatars.ts'
test('labels are templated per action and avatar', () => {
  assert.equal(labelFor({kind:'click',ref:'link|Pricing|0',label:'Pricing'}, getAvatar('dev')!), 'Opening "Pricing"')
  assert.equal(labelFor({kind:'click',ref:'link|Pricing|0',label:'Pricing'}, getAvatar('mika')!), 'Tapping "Pricing"')
  assert.equal(labelFor({kind:'press',key:'Shift+Tab'}, getAvatar('ren')!), 'Pressing Shift+Tab')
  assert.equal(labelFor({kind:'scroll',direction:'down'}, getAvatar('lola')!), 'Scrolling down')
})

test('resolveLocator maps role|name|index to exact getByRole + nth', () => {
  const calls:unknown[] = []
  const page = { getByRole: (role:string, opts:unknown) => { calls.push(['getByRole', role, opts]); return { nth: (i:number) => { calls.push(['nth', i]); return {} } } } }
  resolveLocator(page as any, 'link|Sign in|1')
  resolveLocator(page as any, 'link|a|b|0')
  resolveLocator(page as any, 'button||0')
  assert.deepEqual(calls, [
    ['getByRole', 'link', { name:'Sign in', exact:true }], ['nth', 1],
    ['getByRole', 'link', { name:'a|b', exact:true }], ['nth', 0],
    ['getByRole', 'button', { name:'', exact:true }], ['nth', 0],
  ])
})
