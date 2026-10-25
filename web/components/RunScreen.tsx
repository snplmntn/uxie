'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AV } from '@/lib/avatars'
import type { AvatarId, AvatarStatus, Step } from '@/lib/types'
import { Avatar } from './Avatar'
import { Site } from './Site'
import { EASE, ICON, Ico, LAND, SEV, Shot, isLive, statusOf } from './ui'

export type AvatarRun = { id: AvatarId; status: AvatarStatus; steps: Step[]; startedAt: number; endedAt?: number; frame?: { n: number; url: string; screenshot: string } }

const MAX_STEPS = 25

// Types the current thought out a few characters at a time, like someone thinking aloud.
function useTyped(text: string, on: boolean) {
  const [n, setN] = useState(on ? 0 : text.length)
  const [prev, setPrev] = useState(text)
  if (prev !== text) { setPrev(text); setN(on ? 0 : text.length) }
  useEffect(() => {
    if (!on || n >= text.length) return
    const t = setTimeout(() => setN((x) => Math.min(text.length, x + 3)), 70)
    return () => clearTimeout(t)
  }, [on, n, text])
  return on ? text.slice(0, n) : text
}

export function StepLog({ steps, current, shots }: { steps: Step[]; current?: boolean; shots?: boolean }) {
  return (
    <>
      {steps.map((s, i) => {
        const f = s.friction[0]
        return (
          <div key={s.n} className={`log-item ${current && i === 0 ? 'cur' : ''}`}>
            <span className="log-n">{s.n}</span>
            <div style={{ minWidth: 0 }}>
              <div className="log-a">{s.label}</div>
              {s.narration && <div className="log-t">{s.narration}</div>}
              {f && <div className={`fr ${f.severity}`}><Ico d={ICON[f.severity]} size={14} sw={2} /><span><b>{SEV[f.severity].label}:</b> {f.description}</span></div>}
              {shots && s.screenshot && <div className="log-shot"><Shot src={s.screenshot} alt={`Screen at step ${s.n}`} zoom /></div>}
            </div>
          </div>
        )
      })}
    </>
  )
}

function useView(r: AvatarRun) {
  const a = AV[r.id], st = r.steps[r.steps.length - 1]
  const running = isLive(r.status)
  const typed = useTyped(st?.narration ?? st?.label ?? '', running)
  const s = statusOf(r.status)
  const total = Math.max(r.steps.length, 6)
  return {
    a, st, running, s,
    mood: running ? (st?.friction.length ? 'sad' : 'think') : s.mood,
    anim: running ? 'bob' : r.status === 'done' ? 'cheer' : r.status === 'gave_up' ? 'droop' : '',
    narr: st ? typed : r.status === 'stopped' ? 'Stopped before the first step.' : r.frame ? 'Looking at the page…' : 'Opening a fresh browser…',
    shimmer: !st && running,
    caret: running && !!st && typed.length < (st.narration ?? st.label).length,
    stepLabel: st ? `Step ${st.n} · ${MAX_STEPS} max` : 'Starting',
    action: st ? st.label : r.frame ? 'Reading the page' : 'Launching',
    pct: running ? (r.steps.length / total) * 100 : 100,
  } as const
}

function Badge({ r }: { r: AvatarRun }) {
  const a = AV[r.id]
  if (isLive(r.status)) return <span className="bdg" style={{ background: a.soft, color: a.ink }}><i className="pulse" />Running</span>
  const s = statusOf(r.status)
  return <span className={`bdg ${s.cls}`}><Ico d={s.icon} sw={2.4} />{s.label}</span>
}

function Preview({ r, full }: { r: AvatarRun; full?: boolean }) {
  const a = AV[r.id], last = r.steps[r.steps.length - 1]
  // The live frame is what they are looking at now, a step ahead of the last decided step.
  const st = r.frame && isLive(r.status) && r.frame.n > (last?.n ?? 0) ? { ...last, ...r.frame } : last
  return (
    <div className="frame">
      <div className="chrome"><i /><i /><i /><span className="url">{st?.url.replace(/^https?:\/\//, '') ?? 'about:blank'}</span><span className="cfg">{a.cfg}</span></div>
      {st?.screenshot && a.variant === 'mobile'
        ? <div className={`phone-stage ${full ? 'full' : ''}`}><div className="phone"><Shot src={st.screenshot} alt={`${a.name}’s screen at step ${st.n}`} zoom={full} /></div></div>
        : st?.screenshot
        ? <Shot src={st.screenshot} alt={`${a.name}’s screen at step ${st.n}`} style={full ? { display: 'block', width: '100%', maxHeight: '62vh', objectFit: 'contain', background: '#F5F5F7' } : { display: 'block', width: '100%', aspectRatio: '16/10', objectFit: 'cover', objectPosition: 'top' }} zoom={full} />
        : st?.preview
          ? <Site variant={a.variant} accent={a.ink} {...st.preview} flag={!!st.friction.length} />
          : <div className="boot" style={full ? { maxHeight: '62vh' } : undefined} role="status" aria-label={`Opening ${a.name}’s browser`}><i style={{ borderTopColor: a.ink }} /></div>}
    </div>
  )
}

function Card({ r, i, onOpen }: { r: AvatarRun; i: number; onOpen: () => void }) {
  const reduce = useReducedMotion()
  const v = useView(r)
  const fin = !v.running && r.status !== 'stopped' ? `fin-${v.s.cls}` : ''
  return (
    <motion.button
      type="button" className={`rcard ${fin}`} onClick={onOpen} aria-label={`Watch ${v.a.name} up close`}
      {...(reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : { initial: { opacity: 0, y: 56 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, ease: LAND, delay: 0.1 + i * 0.09 } })}
    >
      <div className="rc-top">
        <motion.span layoutId={`av-${r.id}`} style={{ display: 'block', flex: 'none' }}><Avatar id={r.id} mood={v.mood} size={42} anim={v.anim} /></motion.span>
        <div className="rc-id"><div className="rc-name">{v.a.name}</div><div className="rc-cfg">{v.a.changes}</div></div>
        <Badge r={r} />
      </div>
      <Preview r={r} />
      <div>
        <div className="stepline"><span>{v.stepLabel}</span><span>{v.action}</span></div>
        <div className="progress"><i style={{ width: `${v.pct}%`, background: v.a.ink }} /></div>
        <p className={`narr ${v.shimmer ? 'shimmer' : ''}`} aria-live="off">{v.narr}{v.caret && <span className="caret" />}</p>
      </div>
    </motion.button>
  )
}

function Panel({ r, onClose }: { r: AvatarRun; onClose: () => void }) {
  const reduce = useReducedMotion()
  const v = useView(r)
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    close.current?.focus()
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  // Portal: the screen transition leaves a CSS filter on an ancestor, which would trap position:fixed inside it.
  return createPortal(
    <>
      <motion.button className="scrim" type="button" aria-label="Close" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
      <motion.div
        className="panel" role="dialog" aria-modal="true" aria-label={`${v.a.name} up close`}
        {...(reduce
          ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
          : { initial: { opacity: 0.6, scale: 0.9, y: 40 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.94, y: 24 }, transition: { duration: 0.5, ease: EASE } })}
      >
        <div className="p-head">
          <Avatar id={r.id} mood={v.mood} size={46} anim={v.anim} />
          <div style={{ minWidth: 0 }}>
            <div className="p-name">{v.a.name}<span className="p-who">{v.a.who}</span></div>
            <div className="p-cfg">{v.a.changes}</div>
          </div>
          <Badge r={r} />
          <button ref={close} className="icon-btn" type="button" aria-label="Close" onClick={onClose}><Ico d="M6 6l12 12M18 6L6 18" size={18} sw={2} /></button>
        </div>
        <div className="p-body">
          <div className="p-left">
            <Preview r={r} full />
            <div className="now">
              <div className="now-l">{v.running ? 'Thinking' : 'Final thought'} · {v.stepLabel}</div>
              <p className={`narr big ${v.shimmer ? 'shimmer' : ''}`}>{v.narr}{v.caret && <span className="caret" />}</p>
            </div>
          </div>
          <div className="p-right">
            <div className="log-h">Step log <span className="count">{r.steps.length} {r.steps.length === 1 ? 'step' : 'steps'}</span></div>
            <StepLog steps={[...r.steps].reverse()} current={v.running} />
          </div>
        </div>
      </motion.div>
    </>,
    document.body,
  )
}

export function RunScreen({ runs, goal, onStop }: { runs: AvatarRun[]; goal: string; onStop: () => void }) {
  const [focus, setFocus] = useState<AvatarId | null>(null)
  const done = runs.every((r) => !isLive(r.status))
  const focusRun = runs.find((r) => r.id === focus)
  const closePanel = useCallback(() => setFocus(null), [])
  return (
    <div className="wrap">
      <div className="run-head">
        <div>
          <h1 className="h-run">{done ? 'Everyone’s done' : `Watching ${runs.length} ${runs.length === 1 ? 'visitor' : 'visitors'}`}</h1>
          <p className="sub-run">Goal: <b>{goal}</b> · each visitor gets their own browser</p>
        </div>
        <div className="actions">
          <button className="btn" type="button" onClick={onStop} disabled={done}><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" /></svg>Stop all</button>
        </div>
      </div>
      <div className="grid">
        {runs.map((r, i) => <Card key={r.id} r={r} i={i} onOpen={() => setFocus(r.id)} />)}
      </div>
      <AnimatePresence>{focusRun && <Panel key="panel" r={focusRun} onClose={closePanel} />}</AnimatePresence>
    </div>
  )
}
