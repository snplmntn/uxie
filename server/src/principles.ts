import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Only these sections reach the report prompt; the skill's how-to, indexes and scope notes are navigation, not principles.
const KEEP = /^## (Core Frameworks|Applying to Uxie)/
const DEFAULT_PATH = fileURLToPath(new URL('../../.agents/skills/tullis-albert-ux-metrics/SKILL.md', import.meta.url))

// Pending when the file is missing, holds only headings/frontmatter (<300 chars of body), or is still marked TBD.
export function loadPrinciples(path = DEFAULT_PATH): { source:'loaded'|'pending'; text:string } {
  let text: string
  try { text = readFileSync(path, 'utf8') } catch { return { source:'pending', text:'' } }
  const body = text.replace(/^---\n[\s\S]*?\n---\n?/, '').split('\n')
    .filter(l => !/^\s*#/.test(l)).map(l => l.trim()).join(' ').trim()
  const kept = text.split(/^(?=## )/m).filter(s => KEEP.test(s)).join('').trim()
  return { source: body.length < 300 || text.includes('TBD') ? 'pending' : 'loaded', text: kept || text }
}
