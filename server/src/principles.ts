import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DEFAULT_PATH = fileURLToPath(new URL('../../.agents/skills/ux-principles/SKILL.md', import.meta.url))

// Pending when the file is missing, holds only headings/frontmatter (<300 chars of body), or is still marked TBD.
export function loadPrinciples(path = DEFAULT_PATH): { source:'loaded'|'pending'; text:string } {
  let text: string
  try { text = readFileSync(path, 'utf8') } catch { return { source:'pending', text:'' } }
  const body = text.replace(/^---\n[\s\S]*?\n---\n?/, '').split('\n')
    .filter(l => !/^\s*#/.test(l)).map(l => l.trim()).join(' ').trim()
  return { source: body.length < 300 || text.includes('TBD') ? 'pending' : 'loaded', text }
}
