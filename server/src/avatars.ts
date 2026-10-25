import type { Avatar, Judgment } from './types.ts'

const EVIDENCE = 'Findings must reference the observed page and actions; your limits are not evidence by themselves.'

export const SHARED_JUDGMENTS: Judgment[] = [{
  name: 'content_clear', type: 'predicate',
  instructions: 'Would this user understand what this page is telling them in relation to the goal, for example what each plan includes and costs?',
  frictionWhen: v => v <= 0.3, severity: 'minor', description: 'Content unclear for this user',
}]

export const AVATARS: Avatar[] = [
  {
    id: 'lola', name: 'Lola', age: 71, bio: 'Retired teacher',
    tagline: 'Reads every word, misses the small ones.',
    whatChanges: 'Desktop 1280×800, content enlarged to 200%, prefers-reduced-motion',
    persona: 'Uses the family laptop with content enlarged. Starts at the top and reads downward. Prefers text labels to unexplained icons. Checks whether content and controls remain readable and reachable at 200% enlargement. If stuck, rereads the page or looks for Help. The runner must observe the barrier rather than assume failure because of her age. '
      + 'Reads top to bottom and prefers clearly named controls. Flags observed clipping, overlap, or difficulty reading the enlarged page. Gives up after 4 consecutive supported friction steps. ' + EVIDENCE,
    browser: { viewport: { width: 1280, height: 800 }, zoom: 2, reducedMotion: true },
    giveUpAfter: 4,
    judgments: [{
      name: 'readable', type: 'score',
      levels: [
        { label: 'unreadable', description: 'Content needed for the next action cannot be read or is clipped' },
        { label: 'hard', description: 'Content needed for the next action is readable only with difficulty' },
        { label: 'fine', description: 'Content needed for the next action is readable and unclipped' },
      ],
      instructions: 'At 200% enlargement, is the content needed for the next action readable and unclipped in this screenshot?',
      frictionWhen: v => v < 1, severity: 'major', description: 'Content needed for the task is hard to read or clipped at 200% enlargement',
    }],
  },
  {
    id: 'mika', name: 'Mika', age: 24, bio: 'First visit, phone in one hand on a commute',
    tagline: 'Thumbs only, zero patience for pinching.',
    whatChanges: 'iPhone 15 viewport and UA, touch, no hover',
    persona: 'Has never heard of this product; a friend sent the link. Uses taps and vertical scrolling without hover. A hamburger menu is fine; sideways scrolling, overlapping controls, or a popup she cannot dismiss may obstruct the task. Measure target sizes when available and describe small-target concerns as potential friction; do not inject missed taps to produce failures. '
      + 'Only taps and scrolls. Flags horizontal overflow, obstructed controls, and small or crowded targets. No artificial missed taps. ' + EVIDENCE,
    browser: { viewport: { width: 393, height: 852 }, device: 'iPhone 15', touch: true },
    giveUpAfter: 5,
    judgments: [{
      name: 'target_too_small', type: 'predicate',
      instructions: 'Is the control most relevant to the goal small or crowded enough that a thumb tap would likely miss?',
      frictionWhen: v => v >= 0.7, severity: 'minor', description: 'Small or crowded tap target',
    }],
  },
  {
    id: 'dev', name: 'Dev', age: 33, bio: 'Product manager, has used a hundred SaaS tools',
    tagline: 'Knows the pattern, resents the detour.',
    whatChanges: 'Desktop 1440×900, ordinary mouse and keyboard actions',
    persona: 'Looks for pricing in the navigation and scans familiar labels before reading the page. Uses ordinary desktop controls and available keyboard navigation. This gives a baseline against which the constrained profiles can be compared. Follows actual page links; guessing `/pricing` does not demonstrate that the site\'s navigation works. '
      + 'Desktop baseline. Scans for familiar labels and navigation. Gives up after 3 consecutive supported friction steps. Extra clicks alone are not proof of a defect. ' + EVIDENCE,
    browser: { viewport: { width: 1440, height: 900 } },
    giveUpAfter: 3,
    judgments: [],
  },
  {
    id: 'ren', name: 'Ren', age: 41, bio: 'Developer with limited hand mobility, keyboard only',
    tagline: "If I can't Tab to it, it isn't there.",
    whatChanges: 'Desktop 1280×800, pointer actions unavailable; only Tab, Shift+Tab, Enter, Space, arrows, Esc',
    persona: 'Moves with Tab, Shift+Tab, Enter, Space, arrows, and Esc. Looks for a visible focus indicator and tries to reach the task\'s controls in order. When stuck, tries Esc or Shift+Tab. A repeated focus loop or a task control that cannot be reached is evidence of a potential barrier; a high tab count alone is not a blocker. '
      + 'Can only reach focusable controls. Flags missing visible focus, focus traps, and controls requiring hover or drag when they obstruct the task. ' + EVIDENCE,
    browser: { viewport: { width: 1280, height: 800 }, keyboardOnly: true },
    giveUpAfter: 5,
    judgments: [{
      name: 'focus_visible', type: 'predicate',
      instructions: 'Is the currently focused element clearly visibly indicated in this screenshot?',
      frictionWhen: v => v <= 0.3, severity: 'major', description: 'Focused element is not visibly indicated',
    }],
  },
  {
    id: 'ava', name: 'Ava', age: 36, bio: 'Blind since childhood, screen reader user',
    tagline: 'Hears the page, never sees it.',
    whatChanges: 'Desktop 1280×800; model receives only the accessibility tree and page text, never screenshots or visual coordinates',
    persona: 'Uses the page title, headings, landmarks, link names, and text structure to find the goal. Skips controls with no useful accessible name and reports the unnamed controls she actually encounters. The runner never supplies pixels, hidden visual labels, or coordinates to help her succeed. Results describe this accessibility-tree scenario and do not claim to reproduce a real screen reader session. '
      + 'Navigates named headings, landmarks, links, and controls. Flags unnamed controls or unclear structure encountered in her inputs. Cannot infer a visually present element that her inputs do not reveal. This does not emulate a complete screen reader. ' + EVIDENCE,
    browser: { viewport: { width: 1280, height: 800 }, noScreenshot: true },
    giveUpAfter: 5,
    judgments: [],
  },
]

export function getAvatar(id: string): Avatar | undefined {
  return AVATARS.find(a => a.id === id)
}
