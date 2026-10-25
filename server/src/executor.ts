import type { Locator, Page } from 'playwright'
import type { Action, Avatar, Box } from './types.ts'

export type ExecResult = { ok:boolean; box?:Box; element?:string; reason?:string }

// role|name|index; split on first and last '|' since accessible names may contain '|'
export function resolveLocator(page:Page, ref:string): Locator {
  const a = ref.indexOf('|'), b = ref.lastIndexOf('|')
  const role = ref.slice(0, a) as Parameters<Page['getByRole']>[0]
  const name = ref.slice(a + 1, b), index = Number(ref.slice(b + 1))
  // name:'' matches only empty accessible names, consistent with candidates.ts per-(role,name) indexing
  return page.getByRole(role, { name, exact: true }).nth(index)
}

export function labelFor(action:Action, avatar:Avatar): string {
  switch (action.kind) {
    case 'click': return `${avatar.browser.touch ? 'Tapping' : 'Opening'} "${action.label}"`
    case 'scroll': return action.direction === 'down' ? 'Scrolling down' : 'Scrolling up'
    case 'press': return `Pressing ${action.key}`
    case 'done': return 'Done'
    case 'give_up': return 'Giving up'
  }
}

export async function applyAction(page:Page, action:Action, avatar:Avatar): Promise<ExecResult> {
  const result:ExecResult = { ok: true }
  try {
    if (action.kind === 'click') {
      const loc = resolveLocator(page, action.ref)
      result.box = (await loc.boundingBox()) ?? undefined
      result.element = action.ref
      await (avatar.browser.touch ? loc.tap() : loc.click())
    } else if (action.kind === 'scroll') {
      await page.mouse.wheel(0, action.direction === 'down' ? 600 : -600)
      // Let the scroll settle and the compositor paint; an immediate capture at 2x DPR is a blank frame.
      await page.evaluate(() => new Promise<void>(r => { let last = -1; const tick = () => { if (scrollY === last) return r(); last = scrollY; setTimeout(tick, 100) }; tick() })).catch(() => {})
      await page.waitForTimeout(250)
    } else if (action.kind === 'press') {
      await (action.kind === 'press' && action.key === 'Alt+ArrowLeft' ? page.goBack({ waitUntil:'domcontentloaded' }).then(() => page.url() === 'about:blank' ? page.goForward({ waitUntil:'domcontentloaded' }) : null).catch(() => null) : page.keyboard.press(action.key))
    } else return result // done / give_up: nothing to do
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    return result
  } catch (err) {
    return { ok: false, box: result.box, element: result.element, reason: (err as Error).message }
  }
}
