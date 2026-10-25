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
  }
  await context.close()
}
await (await getBrowser()).close()
