import { AV, ORDER } from './avatars'
import type { AvatarId, AvatarStatus, Friction, Issue, Preview, Report, RunClient, RunEvent, RunRequest, Severity, Step } from './types'

export const DEMO_URL = 'https://brightside.app'
export const GOALS = ['Understand what this product does', 'Find the pricing', 'Find how to get in touch', 'Find the return or refund policy', 'Get an answer from the FAQ or help pages', 'Find out who’s behind this']

// Scripted run against the made-up "Brightside" site for the goal "Find the pricing".
// Actions stay inside the spec's registry: click/tap, scroll, key presses, done, give up. No typing, no forms.
type DemoStep = { label: string; narration: string; preview?: Preview; friction?: Friction & { issue: string } }
const step = (label: string, narration: string, preview?: Preview, friction?: [Severity, string, string]): DemoStep =>
  ({ label, narration, preview, friction: friction && { severity: friction[0], description: friction[1], issue: friction[2] } })

export const SCRIPT: Record<AvatarId, { outcome: AvatarStatus; steps: DemoStep[] }> = {
  lola: { outcome: 'unverified', steps: [
    step('Reading from the top', 'Reading from the top. ‘Money, made calm.’ That sounds nice.'),
    step('Looking at the header', 'Small grey words up top. Is that ‘Product’ or ‘Pricing’? They look alike to me.', { target: 'navPricing' }, ['major', 'Header links are small, grey and close together at 200%', 'faint']),
    step('Scrolling down', 'Scrolling down slowly, looking for the word ‘Pricing’.', { scroll: 1 }),
    step('Reading the plans', '‘Simple pricing.’ Free, Plus, Family. But what do I actually get for six dollars?', { target: 'pricing', scroll: 1 }, ['minor', 'Content unclear for this user: plans show a name and a price only', 'plans']),
    step('Reading the footer', 'Looking for more detail at the bottom. Tiny grey words. I can’t tell them apart.', { target: 'footer', scroll: 2 }, ['major', 'Footer links are tiny light-grey text at 200%', 'faint']),
    step('Checking the result', 'I found prices, but not what they include. I can’t say I found what I need.', { scroll: 1 }),
  ] },
  mika: { outcome: 'done', steps: [
    step('Opening the link', 'My friend sent this. Okay… what is it?', { overlay: 'cookie' }),
    step('Tapping “Manage”', 'Tried the little ‘Manage’ link first. It’s so small I had to aim.', { overlay: 'cookie', target: 'cookieReject' }, ['minor', 'The “Manage” link is 18px tall, under the 44px touch size', 'reject']),
    step('Tapping “Accept all”', 'Fine, accept. I just want it gone.', { overlay: 'cookie', target: 'cookieAccept' }),
    step('Scrolling down', 'Scrolling for prices. Why is the page sliding sideways?', { target: 'pricing', scroll: 1 }, ['major', 'The pricing row is wider than the screen, so the page scrolls sideways', 'overflow']),
    step('Reading the prices', 'Free, six and twelve dollars a month. Found it, finally.', { target: 'pricing', scroll: 1 }),
    step('Done', 'Got the prices. That took more swiping than it should.', { scroll: 1 }),
  ] },
  ava: { outcome: 'gave_up', steps: [
    step('Pressing Tab', 'Tab. Focus is on the logo link, ‘Brightside’.', { target: 'navLogo', press: 'Tab' }),
    step('Pressing Tab', 'Tab again. I’m on ‘Product’, but there is no visible focus ring for anyone helping me.', { target: 'invisible', press: 'Tab' }, ['major', 'Header links remove the focus outline, so focus is not visible', 'focus']),
    step('Pressing Tab', 'Tab. A cookie dialog opened and took focus. ‘Accept all’ and a button with no name.', { overlay: 'cookie', target: 'cookieClose', press: 'Tab' }),
    step('Pressing Tab', 'Tab just loops between those two. ‘Pricing’ is in the tree, but I can’t reach it.', { overlay: 'cookie', target: 'cookieAccept', press: 'Tab' }, ['blocker', 'Cookie dialog traps keyboard focus: Tab loops between two controls', 'trap']),
    step('Pressing Enter', 'Enter on ‘Accept all’. Nothing. It’s announced as text, not a button.', { overlay: 'cookie', target: 'cookieAccept', press: 'Enter' }, ['blocker', '“Accept all” is not a button, so Enter does nothing', 'trap']),
    step('Pressing Escape', 'Escape does nothing either. Shift+Tab loops too.', { overlay: 'cookie', target: 'cookieClose', press: 'Esc' }),
    step('Giving up', 'I can hear the page behind this dialog, but I can’t get to it. Stopping here.', { overlay: 'cookie' }),
  ] },
  dev: { outcome: 'done', steps: [
    step('Scanning the header', 'Pricing should be in the top nav. There it is, next to Product.', { target: 'navPricing' }),
    step('Opening Pricing', 'Clicked Pricing. It jumped down to the plans.', { target: 'pricing', scroll: 1 }),
    step('Reading the plans', '‘Plus’ and ‘Family’. Which one is for me? No feature list.', { target: 'pricing', scroll: 1 }, ['minor', 'Content unclear for this user: plans show a name and a price only', 'plans']),
    step('Done', '$0, $6 and $12 a month. Three steps, fine.', { scroll: 1 }),
  ] },
  grace: { outcome: 'done', steps: [
    step('Looking for “Reject”', 'No ‘Reject’ button. Only ‘Accept all’ and a faint ‘Manage’.', { overlay: 'cookie', target: 'cookieReject' }, ['major', 'No “Reject all” on the first cookie screen; declining is hidden behind “Manage”', 'reject']),
    step('Opening “Manage”', 'Two screens deep just to say no. Rejecting everything optional.', { overlay: 'cookie', target: 'cookieReject' }),
    step('Opening Pricing', 'Pricing first, before anyone asks for my email.', { target: 'navPricing' }),
    step('Reading the plans', 'Free, Plus at $6, Family at $12. Nothing says what Family adds.', { target: 'pricing', scroll: 1 }, ['minor', 'Content unclear for this user: plans show a name and a price only', 'plans']),
    step('Done', 'I have the prices without giving anything away. Good enough.', { scroll: 1 }),
  ] },
}

type DemoIssue = {
  id: string; severity: Severity; title: string; page: string; preview: Preview
  quotes: Partial<Record<AvatarId, string>>; element: string; what: string; fix: string; verify: string
  rec: { title: string; why: string }
}

export const ISSUES: DemoIssue[] = [
  { id: 'trap', severity: 'blocker', title: 'Cookie banner traps keyboard focus', page: '/', preview: { overlay: 'cookie', target: 'cookieClose' },
    quotes: { ava: 'Tab just loops between ‘Accept all’ and a button with no name. Enter does nothing, and Escape does nothing.' },
    element: 'cookie banner (div.cookie-banner), div "Accept all", unnamed close button',
    what: 'The cookie banner takes focus when it opens. Tab cycles only between "Accept all" (a div announced as text, which Enter does not activate) and a close button with no accessible name, and Escape is not handled. A keyboard user cannot reach "Pricing" behind it.',
    fix: 'Make "Accept all", "Reject all" and "Manage" real <button> elements, give the close button aria-label="Close", close the banner on Escape, and do not trap focus (or include every action in the focus order and return focus afterwards).',
    verify: 'Using only Tab, Shift+Tab, Enter and Escape, a user can dismiss the banner and reach the "Pricing" link.',
    rec: { title: 'Let keyboard users dismiss the cookie banner', why: 'Right now it stops keyboard and screen-reader visitors before they reach any prices.' } },
  { id: 'overflow', severity: 'major', title: 'Pricing scrolls sideways on phones', page: '/#pricing', preview: { target: 'pricing', scroll: 1 },
    quotes: { mika: 'Scrolling for prices. Why is the page sliding sideways?' },
    element: 'div.pricing-plans',
    what: 'On a 393px-wide phone the row of pricing cards is wider than the screen and makes the whole page scroll sideways. Mika had to swipe back and forth to read the three prices.',
    fix: 'Below 640px, stack the plans vertically, or give the row overflow-x: auto so only the cards scroll.',
    verify: 'At iPhone 15 width the page has no sideways scroll and all three prices are readable by scrolling down.',
    rec: { title: 'Stack the pricing plans on small screens', why: 'Phone visitors can read every price without swiping sideways.' } },
  { id: 'reject', severity: 'major', title: 'Cookie banner hides “Reject” behind a tiny link', page: '/', preview: { overlay: 'cookie', target: 'cookieReject' },
    quotes: { grace: 'No ‘Reject’ button. Only ‘Accept all’ and a faint ‘Manage’. Two screens deep just to say no.', mika: 'Tried the little ‘Manage’ link first. It’s so small I had to aim.' },
    element: 'button "Accept all" and link "Manage" in div.cookie-banner',
    what: 'The first banner screen offers a large "Accept all" button and a small "Manage" link measured at 18px tall. Declining optional cookies means opening Manage and switching categories off. Grace flagged the hidden decline; on a phone the link is under the 44px touch size.',
    fix: 'Add a "Reject all" button with the same size and style as "Accept all", side by side, each at least 44px tall.',
    verify: 'A user can reject optional cookies in one tap from the first banner screen.',
    rec: { title: 'Offer “Reject all” next to “Accept all”', why: 'Privacy-minded visitors can decline in one step and trust the site sooner.' } },
  { id: 'faint', severity: 'major', title: 'Header and footer links are hard to read when enlarged', page: '/', preview: { target: 'navPricing' },
    quotes: { lola: 'Small grey words up top. Is that ‘Product’ or ‘Pricing’? They look alike to me.' },
    element: 'header nav a, footer a (small light-grey text)',
    what: 'The header links are small grey text set close together, and the footer links are tiny light-grey text. At 200% enlargement Lola could not tell "Product" from "Pricing" and could not read the footer as a fallback route.',
    fix: 'Set nav and footer links to at least 16px in a darker colour, and give each link at least 8px of space around it.',
    verify: 'At 1280×800 with 200% zoom, a user can read every header and footer link, including "Pricing", on the first look.',
    rec: { title: 'Make navigation links larger and darker', why: 'Visitors who enlarge the page can find Pricing on the first look.' } },
  { id: 'focus', severity: 'major', title: 'Header links hide the keyboard focus ring', page: '/', preview: { target: 'invisible', press: 'Tab' },
    quotes: { ava: 'I’m on ‘Product’, but there is no visible focus ring for anyone helping me.' },
    element: 'header nav a (outline: none)',
    what: 'The header nav links set outline: none with no replacement style, so focus becomes invisible after the logo. The executor observed no focus indicator on "Product".',
    fix: 'Remove outline: none and add a :focus-visible style: a 2px solid outline with a 2px offset.',
    verify: 'Every Tab stop in the header shows a visible focus ring.',
    rec: { title: 'Show where keyboard focus is', why: 'Keyboard visitors, and anyone helping them, can see where they are.' } },
  { id: 'plans', severity: 'minor', title: 'Plan names don’t say what you get', page: '/#pricing', preview: { target: 'pricing', scroll: 1 },
    quotes: { lola: '‘Simple pricing.’ Free, Plus, Family. But what do I actually get for six dollars?', dev: '‘Plus’ and ‘Family’. Which one is for me? No feature list.', grace: 'Nothing says what Family adds.' },
    element: 'pricing cards "Free", "Plus", "Family"',
    what: 'Each pricing card shows only a plan name and a price. Visitors found the prices but could not tell what Plus or Family include, so they could not choose a plan.',
    fix: 'Add a one-line summary and three key features under each plan name ("Plus: for one person, unlimited buckets").',
    verify: 'A user can say which plan fits them from the pricing section alone.',
    rec: { title: 'Say what each plan includes', why: 'Visitors can choose a plan instead of only seeing a price.' } },
]

const SEV_RANK: Record<Severity, number> = { blocker: 0, major: 1, minor: 2 }

const join = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1])

const NOTES: Record<AvatarId, Partial<Record<AvatarStatus, string>>> = {
  lola: { unverified: 'Lola reached the pricing section, but the plan names did not say what she would get.' },
  mika: { done: 'Mika found the prices after swiping sideways past the pricing row.' },
  ava: { gave_up: 'Ava never got past the cookie banner: keyboard focus was trapped inside it.' },
  dev: { done: 'Dev found Pricing in the header and read all three prices in four steps.' },
  grace: { done: 'Grace rejected optional cookies the long way, then read the prices without sharing any data.' },
}

type Ran = { id: AvatarId; status: AvatarStatus; steps: Step[]; seconds: number }

// Stand-in for the backend's single report call: only friction that actually happened in this run counts.
export function buildDemoReport(runId: string, req: RunRequest, ran: Ran[]): Report {
  const hits = new Map<string, Step[]>()
  for (const r of ran) for (const s of r.steps) for (const f of s.friction) {
    const key = (f as Friction & { issue?: string }).issue
    if (key) hits.set(key, [...(hits.get(key) ?? []), s])
  }
  const url = req.url.trim().replace(/\/+$/, '')
  const issues: Issue[] = ISSUES.filter((i) => hits.has(i.id)).map((i) => {
    const steps = hits.get(i.id)!
    const avatarIds = ORDER.filter((id) => steps.some((s) => s.avatarId === id))
    const names = avatarIds.map((id) => AV[id].name)
    const pageUrl = url + (i.page === '/' ? '/' : i.page)
    return {
      id: i.id, severity: i.severity, avatarIds, pageUrl, stepRefs: steps.map((s) => ({ avatarId: s.avatarId, n: s.n })),
      screenshot: null, element: i.element, description: i.what, title: i.title, quotes: i.quotes, preview: i.preview,
      fixPrompt: `Site: ${url}  Page: ${pageUrl}\nAffected users: ${names.join(', ')} (${join(avatarIds.map((id) => AV[id].group))} users)\nWhat happened: ${i.what}\nElement: ${i.element}\nPrinciple: UI/UX principles source pending\nFix: ${i.fix}\nVerify: ${i.verify}`,
    }
  }).sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || b.avatarIds.length - a.avatarIds.length)

  const count = (s: Severity) => issues.filter((i) => i.severity === s).length
  const stepped = ran.filter((r) => r.steps.length)
  const blockers = count('blocker')
  const raw = Math.floor(10 - 3 * blockers - count('major') - 0.5 * count('minor'))
  const overallScore = stepped.length ? Math.max(1, Math.min(blockers ? 6 : 10, raw)) : null
  const succeeded = ran.filter((r) => r.status === 'done').length
  const sorted = ran.map((r) => r.steps.length).sort((a, b) => a - b)
  const mid = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : 0
  const stopped = ran.filter((r) => r.status === 'stopped').map((r) => AV[r.id].name)
  const worst = issues.find((i) => i.severity === 'blocker')
  const host = url.replace(/^https?:\/\//, '')

  const assessment = [
    `${succeeded} of ${ran.length} visitors reached the goal on ${host}.`,
    worst ? `${worst.title} blocked ${join(worst.avatarIds.map((id) => AV[id].name))}, which rules out a higher score.` : issues.length ? 'No blockers were observed, but there is friction worth fixing.' : 'No friction was observed on the tested path.',
    `The score covers “${req.goal}” on the pages these visitors saw, not the whole site.`,
    stopped.length ? `Partial: ${join(stopped)} ${stopped.length > 1 ? 'were' : 'was'} stopped early.` : '',
  ].filter(Boolean).join(' ')

  return {
    runId, goal: req.goal, url: req.url, partial: stopped.length > 0, principlesSource: 'pending',
    overallScore, unableToRateReason: overallScore === null ? 'Every visitor was stopped before taking a step, so there is nothing to rate.' : undefined,
    assessment,
    avatarNotes: ran.map((r) => ({ avatarId: r.id, note: NOTES[r.id][r.status] ?? `${AV[r.id].name} was stopped after ${r.steps.length} ${r.steps.length === 1 ? 'step' : 'steps'}.` })),
    recommendations: issues.slice(0, 3).map((i) => {
      const d = ISSUES.find((x) => x.id === i.id)!
      return { title: d.rec.title, why: d.rec.why, avatarIds: i.avatarIds, issueIds: [i.id] }
    }),
    issues, succeeded, total: ran.length, medianSteps: mid, worstBlocker: worst?.title,
    avatars: ran.map((r) => ({ avatarId: r.id, status: r.status, steps: r.steps.length, seconds: r.seconds })),
  }
}

// Replays SCRIPT over time with the same events the backend streams over SSE.
export function createMockClient(): RunClient {
  const runs = new Map<string, { stop: () => void; listeners: Set<(e: RunEvent) => void>; timers: ReturnType<typeof setTimeout>[] }>()

  return {
    async start(req) {
      const runId = 'demo-' + Date.now().toString(36)
      const listeners = new Set<(e: RunEvent) => void>()
      const emit = (e: RunEvent) => listeners.forEach((fn) => fn(e))
      const timers: ReturnType<typeof setTimeout>[] = []
      const t0 = Date.now()
      const state = req.avatarIds.map((id) => ({ id, status: 'running' as AvatarStatus, steps: [] as Step[], seconds: 0 }))
      let reported = false

      const maybeReport = () => {
        if (reported || state.some((s) => s.status === 'running')) return
        reported = true
        timers.push(setTimeout(() => {
          emit({ type: 'report', report: buildDemoReport(runId, req, state) })
          emit({ type: 'run_status', status: 'finished' })
        }, 2700))
      }
      const advance = (i: number, n: number) => {
        const a = state[i], script = SCRIPT[a.id]
        if (a.status !== 'running') return
        if (n >= script.steps.length) {
          a.status = script.outcome; a.seconds = Math.round((Date.now() - t0) / 1000)
          emit({ type: 'avatar_status', avatarId: a.id, status: a.status })
          maybeReport(); return
        }
        const d = script.steps[n]
        const s: Step = { avatarId: a.id, n: n + 1, url: DEMO_URL + '/', title: 'Brightside', label: d.label, narration: d.narration, preview: d.preview ?? {}, screenshot: null, friction: d.friction ? [d.friction] : [], at: new Date().toISOString() }
        a.steps.push(s)
        emit({ type: 'step', step: s })
        timers.push(setTimeout(() => advance(i, n + 1), ((900 + d.narration.length * 22) * AV[a.id].pace)))
      }

      runs.set(runId, {
        listeners, timers,
        stop: () => {
          for (const a of state) if (a.status === 'running') {
            a.status = 'stopped'; a.seconds = Math.round((Date.now() - t0) / 1000)
            emit({ type: 'avatar_status', avatarId: a.id, status: 'stopped' })
          }
          maybeReport()
        },
      })
      // Defer so the caller can subscribe before the first event.
      timers.push(setTimeout(() => {
        emit({ type: 'run_status', status: 'running' })
        state.forEach((a, i) => { emit({ type: 'avatar_status', avatarId: a.id, status: 'running' }); timers.push(setTimeout(() => advance(i, 0), 1300 + i * 380)) })
      }, 0))
      return { runId }
    },
    events(runId, on) {
      const r = runs.get(runId)
      if (!r) return () => {}
      r.listeners.add(on)
      return () => {
        r.listeners.delete(on)
        // Nobody is watching any more (new test, navigated away): stop the clock so nothing fires later.
        if (!r.listeners.size) { r.timers.forEach(clearTimeout); runs.delete(runId) }
      }
    },
    async stop(runId) { runs.get(runId)?.stop() },
  }
}
