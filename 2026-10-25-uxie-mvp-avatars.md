# Uxie MVP — Five Avatar Reference

The current design spec is canonical. This page is a short orientation for the five constrained simulations, not a separate action-permission list. Executable actions are defined centrally by the backend registry and filtered by profile constraints.

| Avatar | Summary | Mechanical difference | Main evidence |
|---|---|---|---|
| **Lola — Low-vision scenario** | A careful reader who prefers clearly named controls. | Desktop at 200% content enlargement with reduced motion. | Enlarged screenshot, clipping/overlap, page and action references. Give-up floor: 4 supported friction steps. |
| **Mika — Mobile first-timer** | A first-time visitor using a phone in a hurry. | iPhone 15 emulation, touch-only; no artificial missed taps. | Mobile layout, measured target size, overflow, page and action references. Give-up floor: 5. |
| **Ava — Keyboard and non-visual access** | A blind visitor using keyboard navigation and accessible page structure. | Keyboard-only: Tab, Shift+Tab, Enter, Space, arrows, and Escape; model sees tree/text, never screenshots or visual coordinates. | Focused control, focus visibility, accessible names/structure, and action trace. Give-up floor: 5. |
| **Dev — Experienced desktop user** | A familiar SaaS user looking for the direct route. | Standard desktop baseline. | Actual navigation path and captured task-completion evidence. Give-up floor: 3. |
| **Grace — Trust, privacy, and clarity** | A careful visitor who wants clear wording and product/pricing information before sharing data. | Standard desktop; rejects optional cookies when a safe decline choice exists; never enters personal data. Merges Tita Baby's plain-language and Jun's literal-label concerns. | Exact consent/copy evidence and what was shown before a personal-data request. Give-up floor: 5. |

All five share a 25-step and 240-second cap, the `content_clear` minor judgment, and evidence-based completion checks. Ren's keyboard-only focus-path scenario is merged into Ava; Tita Baby's plain-language and Jun's literal-label scenarios are merged into Grace. These are limited simulations, not validated substitutes for usability research with real participants.
