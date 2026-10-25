// Manual live check: cd server && node --env-file=../.env scripts/smoke-decisions.ts
import { chromium } from 'playwright'
import { getAvatar } from '../src/avatars.ts'
import { buildCandidates } from '../src/candidates.ts'
import { decide } from '../src/judge.ts'

const avatar = getAvatar('dev')!
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: avatar.browser.viewport })
await page.goto('https://example.com')
const snapshot = await page.locator('body').ariaSnapshot()
const screenshotB64 = (await page.screenshot()).toString('base64')
const title = await page.title()
await browser.close()

let usage: unknown
const spy: typeof fetch = async (...args) => {
  const res = await fetch(...args)
  console.log('HTTP', res.status)
  const body = await res.clone().json().catch(() => null)
  usage = body?.usage
  if (!res.ok) console.log(JSON.stringify(body))
  return res
}
const d = await decide({ avatar, goal: 'Find more information about this domain', url: page.url(), title, snapshot, screenshotB64, history: [], candidates: buildCandidates(snapshot, avatar) }, spy)
console.log(JSON.stringify({ decision: d, usage }, null, 2))
