import { readFileSync } from 'node:fs'
import type { Avatar, Judgment, Severity } from './types.ts'

// Profile data lives in the shared JSON handoff; executable rules stay here. JSON text never grants actions.
const data = JSON.parse(readFileSync(new URL('../../avatars/2026-10-25-uxie-avatars.json', import.meta.url), 'utf8'))

const EVIDENCE = 'Findings must reference the observed page and actions; your limits are not evidence by themselves.'

type Rule = { frictionWhen:(v:number)=>boolean; severity:Severity; description:string; instructions?:string }
const RULES: Record<string, Rule> = {
  content_clear: {
    frictionWhen: v => v <= 0.3, severity:'minor', description:'Content unclear for this user',
    // Overrides the JSON wording: asked before the goal is reached, the original fired on every landing page.
    instructions: 'Can this user understand the content and controls on this page well enough to choose their next step toward the goal? Answer low only if wording, labels, or structure on this page would confuse this specific user. Do not answer low merely because the goal is not yet reached on this page.',
  },
  // score levels are clear / strained / unreadable (0..2); only unreadable is friction
  readable: { frictionWhen: v => v >= 1.5, severity:'major', description:'Content needed for the task is hard to read or clipped at 200% enlargement' },
  target_too_small: { frictionWhen: v => v >= 0.7, severity:'minor', description:'Small or crowded tap target' },
  consent_choice_clear: { frictionWhen: v => v <= 0.3, severity:'minor', description:'Privacy or consent choice is unclear' },
}

function toJudgment(j:any): Judgment {
  const r = RULES[j.name]
  if (!r) throw new Error(`avatars.json judgment "${j.name}" has no executable rule`)
  return { name:j.name, type:j.type, instructions: r.instructions ?? j.instructions, ...(j.levels ? { levels:j.levels } : {}),
    frictionWhen:r.frictionWhen, severity:r.severity, description:r.description }
}

export const SHARED_JUDGMENTS: Judgment[] = data.shared.judgments.map(toJudgment)

export const AVATARS: Avatar[] = data.avatars.map((a:any): Avatar => ({
  id:a.id, name:a.name, age:a.age, tagline:a.tagline, whatChanges:a.whatChanges, bio:a.bio,
  persona: `${a.persona} ${EVIDENCE}`,
  browser:a.browser, interactionConstraints:a.interactionConstraints,
  giveUpAfter:a.giveUpAfter, judgments:a.judgments.map(toJudgment),
}))

export function getAvatar(id: string): Avatar | undefined {
  return AVATARS.find(a => a.id === id)
}
