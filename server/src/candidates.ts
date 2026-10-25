import type { Avatar, Candidate } from './types.ts'

export type Node = { role:string; name:string; index:number }

const INTERACTIVE = new Set(['link','button','textbox','searchbox','combobox','checkbox','radio','menuitem','tab','switch','option'])
const LINE = /^\s*- ([a-z]+)(?: "((?:[^"\\]|\\.)*)")?/
const MAX = 40

export function parseSnapshot(yaml:string): Node[] {
  const seen = new Map<string, number>()
  const nodes:Node[] = []
  for (const line of yaml.split('\n')) {
    const m = LINE.exec(line)
    if (!m || !INTERACTIVE.has(m[1])) continue
    const role = m[1], name = (m[2] ?? '').replace(/\\(.)/g, '$1')
    const key = `${role}|${name}`
    const index = seen.get(key) ?? 0
    seen.set(key, index + 1)
    nodes.push({ role, name, index })
  }
  return nodes
}

export function refFor(n:Node): string { return `${n.role}|${n.name}|${n.index}` }

const press = (key:string, value = `press_${key.toLowerCase()}`): Candidate =>
  ({ value, description: `press ${key}`, action: { kind:'press', key } })
const END: Candidate[] = [
  { value:'done', description:'done: the goal is reached', action:{ kind:'done' } },
  { value:'give_up', description:'give up', action:{ kind:'give_up' } },
]

export function buildCandidates(snapshot:string, avatar:Avatar): Candidate[] {
  if (avatar.browser.keyboardOnly) return [
    press('Tab'), press('Shift+Tab', 'press_shift_tab'), press('Enter'), press('Space'),
    press('ArrowDown'), press('ArrowUp'), press('Escape'), ...END,
  ]
  const tail: Candidate[] = [
    { value:'scroll_down', description:'scroll down', action:{ kind:'scroll', direction:'down' } },
    { value:'scroll_up', description:'scroll up', action:{ kind:'scroll', direction:'up' } },
    press('Escape'), ...END,
  ]
  const verb = avatar.browser.touch ? 'tap' : 'click'
  // ponytail: document order, no viewport proximity; upgrade to box-sorted when snapshot carries positions
  const clicks = parseSnapshot(snapshot).filter(n => n.name).slice(0, MAX - tail.length).map((n, i): Candidate => ({
    value: `click_${i}`,
    description: `${verb} ${n.role} "${n.name}"`,
    action: { kind:'click', ref: refFor(n), label: `${n.role} "${n.name}"` },
  }))
  return [...clicks, ...tail]
}

export function unnamedControls(snapshot:string): number {
  return parseSnapshot(snapshot).filter(n => !n.name).length
}
