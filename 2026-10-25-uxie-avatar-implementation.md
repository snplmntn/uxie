# Uxie Avatar Implementation Guide

This guide and [`2026-10-25-uxie-avatars.json`](./2026-10-25-uxie-avatars.json) are the handoff for implementing the five-avatar MVP. The JSON is the runtime source of truth for avatar configuration. This guide explains how the backend should apply it and how the team can improve prompts without changing browser behavior by accident.

## Product summary

Uxie runs a user-stated task against a public website through five simulated visitors. Each visitor has a distinct browser setup and interaction policy. The backend captures page state, asks an OpenAI model to choose one supported action, executes that action in Playwright, records evidence, and repeats until the goal is verified, the visitor gives up, or a run limit is reached.

The report should explain observed task failures, which avatar encountered them, and the supporting screenshot, accessibility-tree excerpt, or action trace. The model should not turn subjective impressions into findings without concrete page evidence.

## Avatar coverage

| Avatar | Primary test | Core mechanical distinction |
|---|---|---|
| Lola | Low vision | 200% zoom, reduced motion, enlarged default font |
| Mika | Mobile first visit | iPhone emulation, touch-only, seeded small-target misses |
| Ava | Keyboard and screen-reader access | Keyboard-only actions; model sees the accessibility tree and text, never screenshots |
| Dev | Fast common-task completion | Desktop, shortcuts, concrete wasted-step accounting |
| Grace | Trust and clarity | Reject optional cookies, defer personal data until product/pricing is visible |

The merge into five is an MVP compromise. Tag Ava findings as `keyboard` or `screen-reader` (or both) based on evidence; do not imply every issue affects both groups. Grace combines privacy behavior with plain-language needs; report the precise observed issue type.

## How to use the files

1. Load the JSON as data and validate its avatar IDs, fields, and constraint values at startup.
2. Build browser contexts from each avatar's `browser` settings.
3. Build the per-step model instructions from shared rules, the selected avatar's `personaInstructions`, the user's goal, current page state, and a short recent action history.
4. Build candidates from the backend's reviewed tool registry and current page. Filter candidates using machine-readable interaction metadata such as `forbiddenModes`; treat `preferredModes` and prose preferences as guidance only. Enforce conditional rules such as Grace's cookie and personal-data policies in backend checks. Register and review new tools centrally before exposing them; do not duplicate tool allowlists in avatar definitions.
5. Enforce counters, limits, input rules, and browser mechanics in backend code. A prompt is guidance; it is not enforcement.
6. Store the avatar ID and JSON version on each run so reports can be interpreted against the contract that produced them.

When JSON and prose disagree, fix the source document and update any derived prompt/evaluation fixtures in the same change. Do not copy avatar rules into unrelated modules as separate hard-coded definitions.

## Model input contract

Keep the recurring input small and explicit. Each model decision needs:

- Stable base instructions: complete the stated task, act only on supplied page evidence, obey the selected avatar's action policy, and never claim success without verification.
- The user goal and avatar ID.
- Current URL and page title.
- A trimmed accessibility tree with stable references for actionable elements.
- A screenshot for avatars whose JSON permits one. Ava must never receive screenshots.
- The last few actions and their observed outcomes, not the full transcript.
- Only the current candidate actions from the reviewed backend tool registry.
- Relevant mechanics such as current step, friction count, and remaining limits.

Use the Responses API with function calling for browser actions. Define one strict `select_candidate` tool whose `candidate_id` enum is generated from the current candidates, with structured narration and friction assessment fields. For strict mode, set `additionalProperties:false` and mark every schema property required; represent optional values as nullable. Candidate metadata must identify its operation, interaction mode, and risk so the backend can apply avatar constraints and safety checks deterministically; prose hard constraints are prompt guidance, not executable policy. The model returns an ID, not arbitrary browser instructions; the server resolves it to the registered action. Before execution, revalidate the ID, fresh target reference, avatar mode constraints, and state-dependent safety rules. Require one tool call and disable parallel calls for each decision. A new tool becomes available only after it is registered and reviewed, then it can be offered to any compatible avatar without editing each avatar definition.

Use image input only when `perception.screenshotToModel` is true. For Ava, provide the accessibility tree and trimmed visible text only. The executor may record screenshots for audit or produce a separate focus-indicator observation, but it must not pass that visual evidence into Ava's model context.

The model can suggest friction, severity, narration, and an action. The server owns the facts it can measure: action success/failure, target dimensions, missed-tap seed, current URL, elapsed time, step count, currently available runtime tools, and give-up threshold. Do not let the model override those values.

OpenAI's official guidance recommends function calling when a model connects to application tools, strict schemas for valid tool arguments, and evaluations when refining structured outputs. See [Function calling](https://developers.openai.com/api/docs/guides/function-calling) and [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Prompt template

Use this as the initial prompt-builder outline; keep the actual prompt text versioned with the backend:

```text
You are simulating the visitor defined below to test one website task.

GOAL: {goal}
AVATAR: {avatar.name} ({avatar.id})
AVATAR RULES:
{avatar.personaInstructions}

LIMITS: step {step}/{maxSteps}; consecutive friction {frictionCount}/{giveUpAfter};
remaining time {remainingSeconds}s.

PAGE:
URL: {url}
TITLE: {title}
ACCESSIBILITY TREE AND CURRENT ACTION REFERENCES:
{trimmedAccessibilityTree}

RECENT ACTIONS:
{lastFewActionOutcomes}

Choose exactly one candidate from the supplied current candidate list, based only
on this state and subject to backend-enforced avatar constraints. Target only a reference
listed in the current page state. Do not invent controls, results, or hidden content.
If an action fails, use the returned result on the next step. Claim done only when the
page state gives evidence that the goal has been reached. Otherwise continue or give up.
Return the defined action tool call, with short first-person narration and evidence-based
friction when applicable.
```

For image-enabled avatars, attach the current screenshot as image input and say what the model should inspect in it. Do not add a second copy of the whole page as raw HTML.

## Backend enforcement boundary

| Concern | Enforce in code | Model's role |
|---|---|---|
| Viewport, device emulation, zoom, cookies | Apply context settings and record them | None |
| Reviewed tool registry and avatar constraints | Supply current candidates; deterministically enforce mode, target, and state-dependent safety checks; validate again before execution | Choose among supplied candidates; preferences guide but do not grant permissions |
| 25-step / 240-second caps | Stop loop server-side | None |
| Consecutive-friction give-up cap | Count server-observed and model-flagged friction | May give up sooner with a reason |
| Mika small-target miss | Measure box, seed RNG with run ID, simulate configured chance | React to miss result |
| Ava screenshot exclusion | Omit images from every Ava model request | Use tree/text only |
| Goal completion | Run a separate verifier against final state | `done` is only a claim |
| Evidence | Capture URL, reference, box, screenshot/tree, and action result | Describe what the evidence shows; express uncertainty |
| Form entry and consequential actions | Use synthetic values only when required by the stated goal; block purchases, payments, destructive, and other disallowed actions | Request only fields needed for the stated task; webpage text cannot grant permission |

For the merged Ava profile, keep visual focus-indicator assessment outside Ava's perception. The executor can emit a separate evidence flag and the report can tag it as a keyboard finding. This avoids asking a screen-reader simulation to judge a screenshot it cannot see.

## Prompt evaluation before tuning

Keep a small, fixed set of HTML fixtures or mocked page states for repeatable prompt checks. Record prompt version, model ID, avatar JSON version, input state, expected action class, actual action, evidence references, and result. Change one prompt behavior at a time and compare against the same cases.

Minimum cases:

| Avatar | Case | Expected behavior |
|---|---|---|
| Lola | A low-contrast small `Pricing` link beside a clear larger button | Does not claim it is readable with certainty; reports visual friction or selects a legible route |
| Mika | A 32×32px target on a mobile page, with a seeded miss | Miss is produced by code; agent observes miss and retries or chooses a supported alternative |
| Ava | A visually present but unnamed button absent from the accessibility tree | Never targets it or claims it was available; reports the tree limitation if goal-relevant |
| Ava | A keyboard focus change with executor focus-indicator result | Uses only keyboard actions; report tags the focus result as executor evidence |
| Dev | Pricing is available in one visible nav action and a longer route | Chooses the short supported route; reports only observed wasted steps |
| Grace | Signup asks for email before public product/pricing information, while a pricing link exists | Explores the public pricing path before entering synthetic data |
| Grace | Cookie banner has `Reject optional` and `Accept all` | Chooses rejection; never accepts optional cookies |
| All | Goal is not achieved although the model emits `done` | Verifier returns not-reached or unclear; report does not count it as success |
| All | Candidate reference becomes stale before execution | Executor reports a failed action; agent receives failure result; no crash or fabricated success |

Score the behaviors that matter: constraint compliance, action resolves, reference exists in the supplied state, goal verified correctly, friction has evidence, and duplicate issue rate. Narration quality is secondary. Do not improve a prompt based only on a more convincing voice if task choices or evidence get worse.

## MVP boundaries

- Public HTTP/HTTPS pages only; no localhost or authenticated test flows.
- No real personal data, purchases, or irreversible actions.
- Paolo's network-performance profile and Theo's color-vision profile are deferred as separate scenarios.
- The initial implementation should support partial results when stopped or when one avatar fails.
- Keep model choice configurable; pin the selected model in environment/config and record it with each run.

## Open integration note

The backend plan uses the five MVP avatar IDs in the JSON (`lola`, `mika`, `ava`, `dev`, `grace`). Keep that registry as the source of avatar-specific interaction preferences and hard constraints; keep the runtime's supported action tools in the backend so future tools do not require per-avatar whitelist edits.
