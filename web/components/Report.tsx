'use client'

import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { AV } from '@/lib/avatars'
import type { AvatarId, Issue, Report as ReportT, RunRequest } from '@/lib/types'
import { Avatar } from './Avatar'
import { StepLog, type AvatarRun } from './RunScreen'
import { Site } from './Site'
import { EASE, ICON, Ico, SevPill, favLetter, hostOf, join, mmss, statusOf } from './ui'

export function Compiling({ runs }: { runs: AvatarRun[] }) {
  const reduce = useReducedMotion()
  const n = runs.length
  const fade = (d: number) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: EASE, delay: d } })
  return (
    <div className="compiling" role="status">
      <div className="hop-row">
        {runs.map((r, i) => (
          <motion.div key={r.id} layoutId={`av-${r.id}`}>
            <div className="hop" style={{ animationDelay: `${i * 0.14}s` }}><Avatar id={r.id} mood={statusOf(r.status).mood} size={58} /></div>
          </motion.div>
        ))}
      </div>
      <motion.p className="c-t shimmer" {...fade(0.35)}>Comparing notes from {n === 1 ? '1 visitor' : `${n} visitors`}…</motion.p>
      <motion.p className="c-s" {...fade(0.45)}>Merging duplicate issues and writing fix prompts</motion.p>
    </div>
  )
}

function CountUp({ value, delay = 0.4 }: { value: number; delay?: number }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduce || value <= 0) return
    const dec = value % 1 ? 1 : 0
    const c = animate(0, value, { duration: 1.1, delay, ease: EASE, onUpdate: (x) => { el.textContent = x.toFixed(dec) } })
    return () => c.stop()
  }, [value, delay, reduce])
  return <span ref={ref}>{value}</span>
}

const RING = 194.78 // 2πr for r = 31

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(t.current), [])
  const flash = (k: string) => { clearTimeout(t.current); setCopied(k); t.current = setTimeout(() => setCopied(null), 1800) }
  const copy = (text: string, k: string, pre?: HTMLElement | null) => {
    const fallback = () => {
      try {
        if (!pre) throw new Error('none')
        const range = document.createRange(); range.selectNodeContents(pre)
        const sel = window.getSelection()!; sel.removeAllRanges(); sel.addRange(range)
        if (!document.execCommand('copy')) throw new Error('blocked')
        flash(k)
      } catch { flash(k + ':fail') }
    }
    try { navigator.clipboard.writeText(text).then(() => flash(k), fallback) } catch { fallback() }
  }
  return { copied, copy }
}

function IssueCard({ it, me, open, onToggle, copied, copy }: { it: Issue; me: AvatarId; open: boolean; onToggle: () => void; copied: string | null; copy: (t: string, k: string, pre?: HTMLElement | null) => void }) {
  const reduce = useReducedMotion()
  const a = AV[me], k = `${me}:${it.id}`
  const pre = useRef<HTMLPreElement>(null)
  const others = it.avatarIds.filter((x) => x !== me).map((x) => AV[x].name)
  const quote = it.quotes?.[me] ?? Object.values(it.quotes ?? {})[0]
  const done = copied === k, fail = copied === k + ':fail'
  return (
    <article className={`iss ${open ? 'open' : ''}`}>
      <button className="iss-h" type="button" aria-expanded={open} onClick={onToggle}>
        <SevPill sev={it.severity} />
        <span className="iss-t">{it.title ?? it.description}</span>
        <svg className={`chev ${open ? 'open' : ''}`} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div className="iss-q">{quote ? `“${quote}”` : it.description}{others.length > 0 && <span className="also">Also hit {join(others)}</span>}</div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="iss-wrap" key="b"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.45, ease: EASE }}
          >
            <div className="iss-b">
              <div className="frame">
                <div className="chrome"><i /><i /><i /><span className="url">{it.pageUrl.replace(/^https?:\/\//, '')}</span><span className="cfg">{a.cfg}</span></div>
                {it.screenshot
                  ? <img src={it.screenshot} alt={`${a.name}’s view when it happened`} style={{ display: 'block', width: '100%' }} />
                  : <Site variant={a.variant} accent={a.ink} {...it.preview} cursor={false} />}
              </div>
              <div className="shot-cap">{a.name}’s view when it happened · {a.cfg}{it.element ? ` · ${it.element}` : ''}</div>
              <div className="prompt">
                <div className="prompt-h">
                  <span>Fix prompt · paste into Codex or Claude Code</span>
                  <button className={`copy ${done ? 'done' : ''}`} type="button" onClick={() => copy(it.fixPrompt, k, pre.current)}>
                    <Ico d={done ? ICON.check : ICON.copy} size={14} />{done ? 'Copied' : fail ? 'Select and copy' : 'Copy'}
                  </button>
                </div>
                <pre ref={pre}>{it.fixPrompt}</pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}

export function Report({ req, runs, report, onRunAgain, onHome }: { req: RunRequest; runs: AvatarRun[]; report: ReportT; onRunAgain: () => void; onHome: () => void }) {
  const reduce = useReducedMotion()
  const ids = runs.map((r) => r.id)
  const [tab, setTab] = useState<AvatarId>(ids[0])
  const [dir, setDir] = useState(1)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const { copied, copy } = useCopy()
  const panelRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<Partial<Record<AvatarId, HTMLButtonElement | null>>>({})
  const host = hostOf(req.url)
  const n = report.total, reached = report.succeeded
  const score = report.overallScore
  const count = (s: Issue['severity']) => report.issues.filter((i) => i.severity === s).length
  const issueById = (id: string) => report.issues.find((i) => i.id === id)

  let headline = `${reached} of ${n} visitors made it.`
  if (n === 1) headline = AV[ids[0]].name + (reached ? ' made it.' : ' didn’t make it.')
  else if (reached === n) headline = `All ${n} visitors made it.`
  else if (reached === 0) headline = `None of the ${n} visitors made it.`

  const select = (id: AvatarId, focusTab = false) => {
    setDir(ids.indexOf(id) >= ids.indexOf(tab) ? 1 : -1)
    setTab(id)
    if (focusTab) tabRefs.current[id]?.focus()
  }
  const showAgent = (id: AvatarId, issueId?: string) => {
    select(id)
    if (issueId) setExpanded((x) => ({ ...x, [`${id}:${issueId}`]: true }))
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }))
  }
  const tabKey = (e: React.KeyboardEvent, id: AvatarId) => {
    const i = ids.indexOf(id)
    const j = e.key === 'ArrowRight' ? (i + 1) % ids.length : e.key === 'ArrowLeft' ? (i - 1 + ids.length) % ids.length : e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : -1
    if (j < 0) return
    e.preventDefault(); select(ids[j], true)
  }

  const md = [
    '# Uxie preflight report', '',
    `Site: ${req.url}`, `Goal: ${req.goal}`,
    `Usability score: ${score === null ? `Unable to rate (${report.unableToRateReason})` : `${score}/10`}`,
    `Result: ${reached} of ${n} visitors reached the goal. Median steps: ${report.medianSteps}.`,
    report.principlesSource === 'pending' ? 'UI/UX principles source pending.' : '', '',
    report.assessment, '',
    '## What to fix first', ...report.recommendations.map((r, i) => `${i + 1}. ${r.title}: ${r.why} (${r.avatarIds.map((x) => AV[x].name).join(', ')})`), '',
    '## Visitors', ...runs.map((r) => `- ${AV[r.id].name} (${AV[r.id].cfg}): ${statusOf(r.status).label}, ${r.steps.length} steps. ${report.avatarNotes.find((x) => x.avatarId === r.id)?.note ?? ''}`), '',
    '## Issues', ...report.issues.map((i, k) => `### ${k + 1}. [${i.severity}] ${i.title ?? i.description}\nHit by: ${i.avatarIds.map((x) => AV[x].name).join(', ')}\n\n\`\`\`text\n${i.fixPrompt}\n\`\`\`\n`),
  ].join('\n')

  const byStatus = new Map<string, string[]>()
  runs.forEach((r) => byStatus.set(r.status, [...(byStatus.get(r.status) ?? []), AV[r.id].name]))
  const outcome = [...byStatus].map(([s, names]) => `${join(names)} ${statusOf(s as AvatarRun['status']).verb}`).join('. ') + '.'

  const enter = (i: number) => (reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } } : { initial: { opacity: 0, y: 18, filter: 'blur(8px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.8, ease: EASE, delay: i * 0.06 } })

  const r = runs.find((x) => x.id === tab) ?? runs[0]
  const st = statusOf(r.status), a = AV[r.id], idx = ids.indexOf(r.id)
  const mine = report.issues.filter((i) => i.avatarIds.includes(r.id))
  const prev = idx > 0 ? ids[idx - 1] : null, next = idx < ids.length - 1 ? ids[idx + 1] : null
  const secs = report.avatars.find((x) => x.avatarId === r.id)?.seconds ?? 0
  const note = report.avatarNotes.find((x) => x.avatarId === r.id)?.note

  return (
    <div className="wrap narrow">
      <motion.div className="r-head" {...enter(0)}>
        <div className="eyebrow"><span className="fav" aria-hidden="true">{favLetter(host)}</span>{host} · Preflight report</div>
        <h1 className="r-h1">{headline}</h1>
        <p className="sub-run">Goal: <b>{req.goal}</b></p>
        <div className="r-actions">
          <button className="btn" type="button" onClick={() => copy(md, 'md')}><Ico d={copied === 'md' ? ICON.check : ICON.doc} size={16} sw={1.9} />{copied === 'md' ? 'Copied' : copied === 'md:fail' ? 'Copy blocked here' : 'Copy report as Markdown'}</button>
          <button className="btn" type="button" onClick={onRunAgain}><Ico d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" size={16} sw={1.9} />Run again</button>
        </div>
      </motion.div>

      <motion.section className="card" aria-label="Overview" {...enter(1)}>
        <div className="ov-top">
          <div className="ring" role="img" aria-label={score === null ? 'Unable to rate' : `Usability score ${score} out of 10`}>
            <svg viewBox="0 0 76 76" width="76" height="76" aria-hidden="true">
              <circle cx="38" cy="38" r="31" fill="none" stroke="#F0F0F2" strokeWidth="8" />
              <motion.circle cx="38" cy="38" r="31" fill="none" stroke="#1D1D1F" strokeWidth="8" strokeLinecap="round" strokeDasharray={RING}
                initial={{ strokeDashoffset: reduce ? RING * (1 - (score ?? 0) / 10) : RING }} animate={{ strokeDashoffset: RING * (1 - (score ?? 0) / 10) }} transition={{ duration: 1.4, ease: EASE, delay: 0.35 }} />
            </svg>
            <span className="ring-t">{score === null ? '–' : <><CountUp value={score} delay={0.35} />/10</>}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="ov-title">{score === null ? 'Unable to rate' : `Usability score: ${score} out of 10`}</div>
            <div className="ov-sub">{score === null ? report.unableToRateReason : report.assessment}</div>
          </div>
        </div>
        <div className="ov-stats">
          <div className="ms"><div className="ms-l">Median steps</div><div className="ms-v"><CountUp value={report.medianSteps} /></div></div>
          <div className="ms"><div className="ms-l st-bad"><Ico d={ICON.blocker} />Blockers</div><div className="ms-v"><CountUp value={count('blocker')} delay={0.48} /></div></div>
          <div className="ms"><div className="ms-l st-warn"><Ico d={ICON.major} />Major</div><div className="ms-v"><CountUp value={count('major')} delay={0.56} /></div></div>
          <div className="ms"><div className="ms-l st-mute"><Ico d={ICON.minor} />Minor</div><div className="ms-v"><CountUp value={count('minor')} delay={0.64} /></div></div>
        </div>
        <div className="people">
          {runs.map((x) => {
            const s = statusOf(x.status)
            return (
              <button key={x.id} className="person" type="button" onClick={() => showAgent(x.id)} aria-label={`See ${AV[x.id].name}’s results, ${s.label}`}>
                <motion.span layoutId={`av-${x.id}`} style={{ display: 'block', flex: 'none' }}><Avatar id={x.id} mood={s.mood} size={30} /></motion.span>
                {AV[x.id].name}
                <Ico d={s.icon} size={14} sw={2.6} className={`st-${s.cls}`} />
              </button>
            )
          })}
        </div>
        <p className="ov-sub" style={{ marginTop: 14 }}>{outcome}{report.partial ? ' This is a partial report.' : ''}</p>
        {report.principlesSource === 'pending' && <p className="ov-sub" style={{ marginTop: 4, fontSize: 12 }}>UI/UX principles source pending: findings are based on observed behavior only.</p>}
        {report.recommendations.length > 0 && (
          <>
            <div className="ov-h">What to fix first</div>
            {report.recommendations.map((rec) => {
              const it = issueById(rec.issueIds[0])
              return (
                <button key={rec.title} className="top-row" type="button" onClick={() => showAgent(rec.avatarIds[0], it?.id)}>
                  {it && <SevPill sev={it.severity} />}
                  <span className="top-t">{rec.title}<span className="also" style={{ fontWeight: 400 }}>{rec.why}</span></span>
                  <span className="mini" aria-hidden="true">{rec.avatarIds.map((id) => <span key={id}><Avatar id={id} mood="sad" size={24} /></span>)}</span>
                  <Ico d="M9 6l6 6-6 6" size={16} sw={2} className="go" />
                </button>
              )
            })}
          </>
        )}
        {report.issues.length === 0 && <div className="empty" style={{ marginTop: 20 }}>No friction recorded for these visitors. Try adding Lola, Ava or Grace.</div>}
      </motion.section>

      <motion.h2 className="h2" {...enter(2)}>Visitor results</motion.h2>
      <motion.div className="tabs" role="tablist" aria-label="Visitors" {...enter(3)}>
        {runs.map((x) => {
          const s = statusOf(x.status), on = x.id === r.id
          return (
            <button key={x.id} ref={(el) => { tabRefs.current[x.id] = el }} className={`tab ${on ? 'on' : ''}`} type="button" role="tab" id={`tab-${x.id}`} aria-controls="agent-panel" aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => select(x.id)} onKeyDown={(e) => tabKey(e, x.id)}>
              {on && <motion.span layoutId="tab-pill" className="tab-pill" transition={reduce ? { duration: 0 } : { duration: 0.55, ease: EASE }} />}
              <Avatar id={x.id} mood={s.mood} size={32} />
              {AV[x.id].name}
              <Ico d={s.icon} size={14} sw={2.6} className={`st-${s.cls}`} />
              <span className="sr">{s.label}</span>
            </button>
          )
        })}
      </motion.div>

      <section ref={panelRef} className="card agent" id="agent-panel" role="tabpanel" aria-labelledby={`tab-${r.id}`} style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div key={r.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0.2, x: dir * 36, filter: 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: -dir * 24, filter: 'blur(4px)' }}
            transition={{ duration: reduce ? 0.15 : 0.4, ease: EASE }}
          >
            <div className="ag-head">
              <Avatar id={r.id} mood={st.mood} size={68} anim={r.status === 'done' ? 'cheer' : r.status === 'gave_up' ? 'droop' : ''} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ag-name">{a.name}</div>
                <div className="ag-who">{a.who}</div>
              </div>
              <span className={`bdg ${st.cls}`} style={{ marginLeft: 0 }}><Ico d={st.icon} sw={2.4} />{st.label}</span>
            </div>
            <div className="ag-meta">{r.steps.length} steps · {mmss(secs)} · {a.cfg}</div>
            {note && <p className="ov-sub" style={{ marginTop: 6 }}>{note}</p>}
            <span className="ag-chg" style={{ background: a.soft, color: a.ink }}>{a.changes}</span>

            <div className="sub-h">Their journey <span className="count">{r.steps.length}</span></div>
            <div className="tl"><StepLog steps={r.steps} /></div>

            <div className="sub-h">What got in the way <span className="count">{mine.length}</span></div>
            {mine.length === 0 && <div className="empty">{a.name} didn’t hit anything worth fixing.</div>}
            {mine.map((it, i) => {
              const k = `${r.id}:${it.id}`
              const open = expanded[k] ?? i === 0
              return <IssueCard key={k} it={it} me={r.id} open={open} onToggle={() => setExpanded((x) => ({ ...x, [k]: !open }))} copied={copied} copy={copy} />
            })}

            <div className="pager">
              <button className="btn" type="button" disabled={!prev} onClick={() => prev && select(prev)}><Ico d="M15 6l-6 6 6 6" size={16} sw={2} />{prev ? AV[prev].name : 'Previous'}</button>
              <button className="btn" type="button" disabled={!next} onClick={() => next && select(next)}>{next ? `Next: ${AV[next].name}` : 'Next'}<Ico d="M9 6l6 6-6 6" size={16} sw={2} /></button>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="foot"><button className="btn dark" type="button" onClick={onHome}>Start a new test</button></div>
    </div>
  )
}
