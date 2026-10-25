// Manual check, no API calls: cd server && node scripts/smoke-browser.ts
import { AVATARS } from '../src/avatars.ts'
import { captureState, getBrowser, openAvatarPage } from '../src/browser.ts'

for (const avatar of AVATARS) {
  const { context, page } = await openAvatarPage(avatar, 'https://example.com')
  const s = await captureState(page, avatar, `runs/smoke/${avatar.id}.png`)
  console.log(avatar.id, 'snapshot', s.snapshot.length, s.pageText !== undefined ? `pageText ${s.pageText.length}` : '', s.screenshotB64 ? 'b64' : 'no-b64', s.focused ?? '')
  if (avatar.browser.keyboardOnly) {
    await page.keyboard.press('Tab')
    console.log(avatar.id, 'after Tab focused', (await captureState(page, avatar, `runs/smoke/${avatar.id}-tab.png`)).focused)
    // Focused containers must not report a descendant: expect none for each
    await page.evaluate(() => document.body.insertAdjacentHTML('beforeend',
      '<div id="wrap" tabindex="-1"><a href="#">Inner</a></div><main id="main" tabindex="-1"><a href="#">In main</a></main><h2 id="h" tabindex="-1">Heading</h2>'))
    for (const sel of ['#wrap', '#main', '#h']) {
      await page.focus(sel)
      console.log(avatar.id, `focused ${sel}`, (await captureState(page, avatar, `runs/smoke/${avatar.id}-tab.png`)).focused)
    }
  }
  await context.close()
}
await (await getBrowser()).close()
