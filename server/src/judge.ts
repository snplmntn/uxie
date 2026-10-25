import type { Avatar, Candidate, Judgment } from './types.ts'
import { SHARED_JUDGMENTS } from './avatars.ts'
import { semaphore } from './semaphore.ts'

export type StepInput = { avatar:Avatar; goal:string; url:string; title:string; snapshot:string; pageText?:string; screenshotB64?:string; focused?:string; history:string[]; candidates:Candidate[] }
export type Decision = { candidate:Candidate; confidence:number; probabilities:{value:string;probability:number}[]; goalReached:number; judgments:Record<string,number> }

const RULES = 'You are simulating one specific web user attempting a goal. Choose the single next action that this user, with their limits and habits, would most plausibly take. Choose done only if the goal is already achieved on this page. Choose give_up only if this user would leave.'
const GOAL_REACHED = 'Does this page show concrete evidence that the goal is already complete? For a pricing goal that means actual plan prices or explicit pricing information on screen, not a link or a URL that mentions pricing. For a goal about finding a page, control, or route, that page or control must be visible now. For a goal about understanding or reading content, the content that answers it must be visible on this page.'

const judgmentQuestion = (j:Judgment) => ({ name:j.name, type:j.type, instructions:j.instructions, ...(j.levels ? { levels:j.levels } : {}) })

export function buildDecisionRequest(input:StepInput): object {
  const { avatar } = input
  const text = [
    RULES, avatar.persona, `Goal: ${input.goal}`,
    input.history.length ? `Recent actions:\n${input.history.slice(-6).join('\n')}` : '',
    `Page: ${input.title} (${input.url})`,
    `Accessibility tree:\n${input.snapshot.slice(0, 6000)}`,
    input.pageText ? `Page text:\n${input.pageText.slice(0, 4000)}` : '',
    input.focused ? `Focused: ${input.focused}` : '',
  ].filter(Boolean).join('\n\n')
  const content: object[] = [{ type:'input_text', text }]
  if (input.screenshotB64 !== undefined && !avatar.browser.noScreenshot)
    content.push({ type:'input_image', image_url:`data:image/png;base64,${input.screenshotB64}` })
  return {
    model: 'gpt-6-luna',
    input: [{ role:'user', content }],
    questions: [
      { name:'next_action', type:'choice', instructions:'Which action does this user take next?', choices:input.candidates.map(c => ({ value:c.value, description:c.description })) },
      { name:'goal_reached', type:'predicate', instructions:GOAL_REACHED },
      ...SHARED_JUDGMENTS.map(judgmentQuestion),
      ...avatar.judgments.map(judgmentQuestion),
    ],
  }
}

const limit = semaphore(5)

async function post(url:string, body:object, fetchImpl:typeof fetch|undefined, label:string): Promise<any> {
  const f = fetchImpl ?? fetch
  for (let attempt = 0; ; attempt++) {
    let res: Response
    try {
      res = await limit(() => f(url, {
        method:'POST',
        headers:{ 'content-type':'application/json', authorization:`Bearer ${process.env.OPENAI_API_KEY}` },
        body:JSON.stringify(body),
      }))
    } catch (e) {
      // Connection reset / DNS failure: retry like a 5xx.
      if (attempt >= 2) throw new Error(`${label} network: ${(e as Error)?.message ?? String(e)}`)
      if (!fetchImpl) await new Promise(r => setTimeout(r, 500 * 2 ** attempt))
      continue
    }
    if (res.ok) return res.json()
    const retryable = res.status === 429 || res.status >= 500
    if (!retryable || attempt >= 2) throw new Error(`${label} ${res.status}`)
    if (!fetchImpl) await new Promise(r => setTimeout(r, 500 * 2 ** attempt))
  }
}

export async function decide(input:StepInput, fetchImpl?:typeof fetch): Promise<Decision> {
  const data = await post('https://api.openai.com/v1/decisions', buildDecisionRequest(input), fetchImpl, 'decisions')
  const byName = new Map<string, any>(data.answers.map((a:any) => [a.name, a]))
  const next = byName.get('next_action')
  const candidate = input.candidates.find(c => c.value === next?.choice)
  if (!candidate) throw new Error(`decisions unknown choice ${next?.choice}`)
  const judgments: Record<string,number> = {}
  for (const j of [...SHARED_JUDGMENTS, ...input.avatar.judgments]) {
    const a = byName.get(j.name)
    const v = j.type === 'score' ? a?.score : a?.probability
    if (typeof v === 'number') judgments[j.name] = v
  }
  return {
    candidate, confidence:next.confidence, probabilities:next.probabilities ?? [],
    goalReached:byName.get('goal_reached')?.probability ?? 0, judgments,
  }
}

export async function summarize(prompt:string, schema:object, fetchImpl?:typeof fetch): Promise<unknown> {
  const data = await post('https://api.openai.com/v1/responses', {
    model:process.env.OPENAI_TEXT_MODEL, input:prompt,
    text:{ format:{ type:'json_schema', name:'report', schema, strict:true } },
  }, fetchImpl, 'responses')
  const text = data.output_text ?? data.output?.flatMap((o:any) => o.content ?? []).map((c:any) => c.text ?? '').join('')
  return JSON.parse(text)
}
