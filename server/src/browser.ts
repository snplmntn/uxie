import { chromium, devices } from 'playwright'
import type { Browser, BrowserContext, Page } from 'playwright'
import type { Avatar } from './types.ts'

export type PageState = { url:string; title:string; snapshot:string; pageText?:string; screenshotB64?:string; focused?:string }

let browserPromise: Promise<Browser> | undefined

export async function getBrowser(): Promise<Browser> {
  browserPromise ??= chromium.launch({ headless: true })
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
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  return { context, page, interruptions }
}

export async function captureState(page:Page, avatar:Avatar, screenshotPath:string): Promise<PageState> {
  const b = avatar.browser
  const shot = await page.screenshot({ path: screenshotPath })
  const state: PageState = { url: page.url(), title: await page.title(), snapshot: await page.locator('body').ariaSnapshot() }
  if (b.noScreenshot) state.pageText = (await page.locator('body').innerText()).slice(0, 4000)
  else state.screenshotB64 = shot.toString('base64')
  if (b.keyboardOnly) {
    state.focused = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return 'none'
      const role = el.getAttribute('role') ?? el.tagName.toLowerCase()
      const name = el.getAttribute('aria-label') ?? (el as HTMLElement).innerText?.trim().slice(0, 80) ?? ''
      return `${role}|${name}`
    })
  }
  return state
}

export function currentPage(context:BrowserContext): Page {
  const pages = context.pages()
  return pages[pages.length - 1]
}
