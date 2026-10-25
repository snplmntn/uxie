import { chromium, devices } from 'playwright'
import type { Browser, BrowserContext, Page } from 'playwright'
import type { Avatar } from './types.ts'
import { parseSnapshot } from './candidates.ts'

export type PageState = { url:string; title:string; snapshot:string; pageText?:string; screenshotB64?:string; focused?:string; scrollY:number }

let browserPromise: Promise<Browser> | undefined

export async function getBrowser(): Promise<Browser> {
  // Full Chromium build: the default headless shell leaves page videos black.
  browserPromise ??= chromium.launch({ headless: true, channel: 'chromium' }).then(
    b => { b.on('disconnected', () => { browserPromise = undefined }); return b },
    e => { browserPromise = undefined; throw e },
  )
  return browserPromise
}

// The default desktop identity says "HeadlessChrome", which Cloudflare blocks on sight; a person's Chrome says "Chrome".
let uaPromise: Promise<string> | undefined
const desktopUA = (browser:Browser) => uaPromise ??= browser.newPage()
  .then(async p => { const ua = await p.evaluate(() => navigator.userAgent); await p.context().close(); return ua.replace('HeadlessChrome', 'Chrome') })
  .catch(e => { uaPromise = undefined; throw e })

// Site-owner allowlist: requests to the tested site (and its subdomains) carry this header, which a Cloudflare custom
// rule can match to skip bot checks. Never sent to third parties, so the token does not leak.
export const ALLOW_HEADER = 'x-uxie-token'
export const sameSite = (request:string, target:string) => {
  try {
    const r = new URL(request).hostname, t = new URL(target).hostname.replace(/^www\./, '')
    return r === t || r.endsWith('.' + t)
  } catch { return false }
}

// videoDir: record the session as a WebM there (Playwright names the file; the caller renames it).
export async function openAvatarPage(avatar:Avatar, url:string, videoDir?:string): Promise<{ context:BrowserContext; page:Page; interruptions:string[] }> {
  const b = avatar.browser
  const browser = await getBrowser()
  // Device preset first so the avatar's own viewport wins (iPhone 15 preset is 393x659).
  // Enlargement is emulated the way browser zoom works: a narrower CSS viewport at a higher pixel ratio,
  // so content reflows and screenshots stay correct (CSS zoom on <html> produced blank captures after scrolling).
  const zoom = b.zoom ?? 1
  const context = await browser.newContext({
    ...(b.device ? devices[b.device] : { userAgent: await desktopUA(browser) }),
    viewport: { width: Math.round(b.viewport.width / zoom), height: Math.round(b.viewport.height / zoom) },
    ...(b.zoom ? { deviceScaleFactor: zoom } : {}),
    hasTouch: !!b.touch,
    ...(b.reducedMotion ? { reducedMotion: 'reduce' as const } : {}),
    ...(videoDir ? { recordVideo: { dir: videoDir, size: { width: Math.round(b.viewport.width / zoom), height: Math.round(b.viewport.height / zoom) } } } : {}),
  })
  const token = process.env.UXIE_ALLOWLIST_TOKEN
  if (token) await context.route(u => sameSite(u.href, url), r => r.continue({ headers: { ...r.request().headers(), [ALLOW_HEADER]: token } }))
  const interruptions: string[] = []
  const wire = (p:Page) => {
    p.on('dialog', d => { interruptions.push('dialog: ' + d.message()); d.dismiss().catch(() => {}) })
    p.on('download', d => { d.cancel().catch(() => {}) })
  }
  context.on('page', wire) // popups; followed via currentPage
  const page = await context.newPage()
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }) }
  catch (e) { await context.close().catch(() => {}); throw e }
  return { context, page, interruptions }
}

export async function captureState(page:Page, avatar:Avatar, screenshotPath:string): Promise<PageState> {
  const b = avatar.browser
  let shot = await page.screenshot({ path: screenshotPath, timeout: 20_000 })  // heavy third-party pages (Calendly) exceed the 5 s action timeout
  if (shot.length < 8_000) {  // a near-empty PNG is an unpainted frame, not the page; give the compositor a moment and retake once
    await page.waitForTimeout(600)
    shot = await page.screenshot({ path: screenshotPath, timeout: 20_000 })
  }
  const state: PageState = { url: page.url(), title: await page.title(), snapshot: await page.locator('body').ariaSnapshot(), scrollY: await page.evaluate(() => Math.round(scrollY)).catch(() => 0) }
  if (b.noScreenshot) state.pageText = (await page.locator('body').innerText()).slice(0, 4000)
  else state.screenshotB64 = shot.toString('base64')
  if (b.keyboardOnly) {
    state.focused = await focusedRef(page)
  }
  return state
}

// ariaSnapshot of the focused element lists its subtree and flattens unnamed generic wrappers,
// so the first parsed node is only trusted if it resolves back to the focused element itself.
async function focusedRef(page:Page): Promise<string> {
  const focus = page.locator(':focus').last()
  // ponytail: a focus change mid-capture falls back to 'none' rather than failing the step
  const tree = await focus.count() ? await focus.ariaSnapshot({ timeout: 2000 }).catch(() => '') : ''
  const node = parseSnapshot(tree.split('\n')[0])[0]
  if (!node) return 'none'
  const isFocused = await page.getByRole(node.role as Parameters<Page['getByRole']>[0], { name: node.name, exact: true })
    .evaluateAll(els => {
      let el = document.activeElement
      while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement
      return els.includes(el as Element)
    }).catch(() => false)
  return isFocused ? `${node.role}|${node.name}` : 'none'
}

export function currentPage(context:BrowserContext): Page {
  const pages = context.pages()
  return pages[pages.length - 1]
}
