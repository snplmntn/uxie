// server/test/run.test.ts
import { test } from 'node:test'; import assert from 'node:assert/strict'
import { parseRunRequest } from '../src/run.ts'
test('parseRunRequest validates url and avatars, defaults goal', () => {
  assert.throws(() => parseRunRequest({ url:'localhost:3000', goal:'x', avatarIds:['dev'] }), /url/)
  assert.throws(() => parseRunRequest({ url:'ftp://a.com', goal:'x', avatarIds:['dev'] }), /url/)
  assert.throws(() => parseRunRequest({ url:'https://a.com', goal:'x', avatarIds:[] }), /avatar/)
  assert.throws(() => parseRunRequest({ url:'https://a.com', goal:'x', avatarIds:['theo'] }), /avatar/)
  const r = parseRunRequest({ url:'https://a.com', goal:'  ', avatarIds:['dev','lola'] })
  assert.equal(r.goal, 'Find the pricing'); assert.deepEqual(r.avatarIds, ['dev','lola'])
})
