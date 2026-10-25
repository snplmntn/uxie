# Uxie MVP — Five Avatar Reference

The current design spec is canonical. This page is a short orientation for the five constrained simulations, not a separate action-permission list. Executable actions are defined centrally by the backend registry and filtered by profile constraints.

| Avatar | Summary | Mechanical difference | Main evidence |
|---|---|---|---|
| **Lola — Low-vision scenario** | A careful reader who prefers clearly named controls. | Desktop at 200% content enlargement with reduced motion. | Enlarged screenshot, clipping/overlap, page and action references. Give-up floor: 4 supported friction steps. |
| **Mika — Mobile first-timer** | A first-time visitor using a phone in a hurry. | iPhone 15 emulation, touch-only; no artificial missed taps. | Mobile layout, measured target size, overflow, page and action references. Give-up floor: 5. |
| **Dev — Experienced desktop user** | A familiar SaaS user looking for the direct route. | Standard desktop baseline. | Actual navigation path and captured task-completion evidence. Give-up floor: 3. |
| **Ren — Keyboard-only scenario** | A visitor with limited hand mobility navigating without a pointer. | Keyboard-only: Tab, Shift+Tab, Enter, Space, arrows, and Escape. | Focused control, visible-focus observation, focus order, and action trace. Give-up floor: 5. |
| **Ava — Accessibility-tree navigation scenario** | A blind visitor navigating from names and page structure. | Model sees the accessibility tree and trimmed page text, never screenshots or visual coordinates. | Tree/text excerpt and the named or unnamed control actually encountered. Give-up floor: 5. |

All five share a 25-step and 240-second cap, the `content_clear` minor judgment, and evidence-based completion checks. These are limited simulations, not validated substitutes for usability research with real participants.
