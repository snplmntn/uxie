import { chromium, devices } from 'playwright'
import type { Browser, BrowserContext, Page } from 'playwright'
import type { Avatar } from './types.ts'
import { parseSnapshot } from './candidates.ts'

export type PageState = { url:string; title:string; snapshot:string; pageText?:string; screenshotB64?:string; focused?:string }

let browserPromise: Promise<Browser> | undefined

export async function getBrowser(): Promise<Browser> {
  browserPromise ??= chromium.launch({ headless: true }).then(
    b => { b.on('disconnected', () => { browserPromise = undefined }); return b },
    e => { browserPromise = undefined; throw e },
  )
  return browserPromise
}

export async function openAvatarPage(avatar:Avatar, url:string): Promise<{ context:BrowserContext; page:Page; interruptions:string[] }> {
  const b = avatar.browser
  const browser = await getBrowser()
  // Device preset first so the avatar's own viewport wins (iPhone 15 preset is 393x659).
  const context = await browser.newContext({
    ...(b.device ? devices[b.device] : {}),
    viewport: b.viewport,
    hasTouch: !!b.touch,
    ...(b.reducedMotion ? { reducedMotion: 'reduce' as const } : {}),
  })
  if (b.zoom) {
    await context.addInitScript(zoom => {
      document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.zoom = String(zoom) })
    }, b.zoom)
  }
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
  const shot = await page.screenshot({ path: screenshotPath })
  const state: PageState = { url: page.url(), title: await page.title(), snapshot: await page.locator('body').ariaSnapshot() }
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
