import { test } from 'node:test'; import assert from 'node:assert/strict'
import { iconCandidates } from '../src/favicon.ts'
test('iconCandidates prefers apple-touch-icon, resolves relative hrefs, ends with /favicon.ico', () => {
  const html = `<link href="favicon.svg" rel="icon" type="image/svg+xml"><link rel='apple-touch-icon' href='/a.png'><link rel="stylesheet" href="x.css">`
  assert.deepEqual(iconCandidates(html, 'https://s.com/en/'), ['https://s.com/a.png', 'https://s.com/en/favicon.svg', 'https://s.com/favicon.ico'])
  assert.deepEqual(iconCandidates('', 'https://s.com'), ['https://s.com/favicon.ico'])
})
import { sameSite } from '../src/browser.ts'
test('allowlist header goes to the tested site and its subdomains only', () => {
  assert.ok(sameSite('https://chatgpt.com/api', 'https://chatgpt.com/'))
  assert.ok(sameSite('https://cdn.chatgpt.com/x.js', 'https://www.chatgpt.com/'))
  assert.ok(!sameSite('https://evilchatgpt.com/', 'https://chatgpt.com/'))
  assert.ok(!sameSite('https://www.google-analytics.com/c', 'https://chatgpt.com/'))
})
