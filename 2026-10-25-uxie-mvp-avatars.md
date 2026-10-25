# Uxie MVP — Five Avatar Contracts

## Purpose

This is the implementation contract for the five-avatar hackathon MVP. Each avatar must have a mechanical browser constraint, behavior rules, a server-enforced give-up threshold, and reportable evidence. A persona without a mechanical constraint is not an avatar.

## Shared rules

- Every avatar runs in an isolated Playwright browser context.
- Record every action with its URL, accessibility reference, screenshot when allowed, narration, and friction.
- A failed action counts as one friction event.
- Stop at 25 steps or 4 minutes.
- An avatar may give up earlier; the server enforces each avatar's friction cap.
- A completed goal requires separate verification. `unclear` is not a success.

---

## 1. Lola — Low Vision User

**Purpose:** Find interfaces that become unreadable or difficult to operate when enlarged.

### Browser setup

- Desktop: 1280×800
- Page zoom: 200%
- Reduced motion enabled
- Large default font enabled

### Behavior

- Reads top-to-bottom; does not skim.
- Takes one action per step.
- Does not use text that appears smaller than roughly 16px effective size.
- Treats low-contrast text and tightly packed targets as friction.

### Give-up rule

End after 4 consecutive friction events.

### Report evidence

- Zoomed screenshot
- Target bounding box when applicable
- Description of unreadable text, weak contrast, or difficult target

---

## 2. Mika — Mobile First-Timer

**Purpose:** Find mobile layout, touch-target, and first-visit discoverability failures.

### Browser setup

- iPhone 15 viewport and user agent
- Touch input only
- No hover or right-click

### Behavior

- Has never used the site.
- Uses only taps and scrolling.
- Targets smaller than 44×44px have a deterministic 30% missed-tap chance.
- Horizontal scrolling, blocked popups, or unclear next actions are friction.

### Give-up rule

End after 5 consecutive friction events.

### Report evidence

- Mobile screenshot
- Target dimensions
- Whether horizontal overflow or a missed small target caused the stall

---

## 3. Ava — Non-Visual Access User

**Purpose:** Find features that cannot be discovered or operated from the accessibility tree.

### Browser setup

- Desktop context
- Keyboard-only actions: Tab, Shift+Tab, Enter, Space, arrows, Escape
- The model receives accessibility tree and trimmed page text only
- Never send page screenshots to the model

### Behavior

- Navigates by headings, landmarks, links, buttons, and form labels.
- Treats unnamed controls, missing labels, and visual-only information as unavailable.
- Cannot use mouse, coordinates, hover, or drag actions.

### Give-up rule

End after 5 consecutive friction events.

### Report evidence

- Accessibility-tree excerpt
- Missing accessible name, label, heading, or landmark
- Visible element exists but is absent or unusable in the tree

---

## 4. Dev — Experienced User in a Hurry

**Purpose:** Find inefficient navigation and flows that violate common web expectations.

### Browser setup

- Desktop: 1440×900
- Keyboard shortcuts allowed

### Behavior

- Skims; does not read marketing copy.
- Expects Login, Pricing, search, and common actions in predictable places.
- May use Tab, Enter, Cmd/Ctrl+K, and direct URL guesses such as `/login`.
- Any action that does not advance the goal is friction.

### Give-up rule

End after 3 consecutive friction events.

### Report evidence

- Step trace showing unnecessary clicks or detours
- Expected destination or navigation pattern
- Number of wasted steps before progress

---

## 5. Grace — Trust & Clarity User

**Purpose:** Find confusing copy, jargon, premature data requests, and privacy dark patterns.

### Browser setup

- Desktop: 1440×900
- Third-party cookies blocked

### Behavior

- Rejects cookie banners; never accepts them.
- Wants to understand the product and see pricing before sharing email, phone, or card details.
- Treats jargon, vague calls to action, hidden decline options, pre-checked boxes, and misleading dismissals as friction.
- Prefers plain action labels such as “Create account” over “Get started.”

### Give-up rule

End after 5 consecutive friction events.

### Report evidence

- Screenshot and element reference
- Exact confusing label or dark-pattern behavior
- What information was unavailable before the site requested personal data

## Deferred avatars

- **Paolo:** Slow-connection testing is best added as a focused performance pass.
- **Theo:** Color-only meaning is best added as a targeted visual/DOM check.
- **Ren:** His keyboard-only behavior is included in Ava's MVP contract.
- **Tita Baby and Jun:** Their plain-language needs are included in Grace's MVP contract.
