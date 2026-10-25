'use client'

import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { AV, ORDER } from '@/lib/avatars'
import { DEMO_URL, GOALS } from '@/lib/demo'
import type { AvatarId, RunRequest } from '@/lib/types'
import { Avatar } from './Avatar'
import { EASE, EASE_IN, LAND, favLetter, hostOf, isValidUrl, join, lowerFirst } from './ui'

const CHECK = <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
const HEADLINE = [['See', 'your', 'site', 'through'], ['five', 'other', 'pairs', 'of', 'eyes.']]
const CLUSTER: AvatarId[] = ['mika', 'lola', 'ava', 'dev', 'grace']

// A finished question settles into a one-line summary with a Change button.
function DoneRow({ label, value, onChange, motionProps, layout, children }: { label: string; value: string; onChange: () => void; motionProps: HTMLMotionProps<'div'>; layout: boolean; children: React.ReactNode }) {
  return (
    <motion.div layout={layout} className="done-row" {...motionProps}>
      <span className="done-ic" aria-hidden="true">{CHECK}</span>
      {children}
      <div style={{ minWidth: 0 }}><div className="done-l">{label}</div><div className="done-v">{value}</div></div>
      <button className="link-btn" type="button" onClick={onChange}>Change</button>
    </motion.div>
  )
}

export function Launch({ initial, startStep, onRun }: { initial: RunRequest; startStep: 0 | 1 | 2; onRun: (r: RunRequest) => void }) {
  const reduce = useReducedMotion()
  const [step, setStep] = useState<0 | 1 | 2>(startStep)
  const [url, setUrl] = useState(initial.url)
  const [touched, setTouched] = useState(false)
  const [sel, setSel] = useState<AvatarId[]>(initial.avatarIds)
  const [goal, setGoal] = useState(initial.goal)
  const [hover, setHover] = useState<AvatarId | null>(null)
  const [auto, setAuto] = useState({ seq: 0, dur: 3.4 })
  const pasted = useRef(false)
  const adv = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(adv.current), [])

  const valid = isValidUrl(url)
  const host = hostOf(url)
  const names = sel.map((id) => AV[id].name)
  const who = names.length <= 3 ? join(names) : `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
  const goalNow = goal.trim() || GOALS[0]
  const showErr = touched && !!url.trim() && !valid

  const goStep = (n: 0 | 1 | 2) => {
    clearTimeout(adv.current)
    if (n === 1) setAuto((a) => ({ seq: a.seq + 1, dur: 3.4 }))
    setStep(n)
  }
  const later = (n: 0 | 1 | 2, ms: number) => { clearTimeout(adv.current); adv.current = setTimeout(() => goStep(n), ms) }
  const submitUrl = () => (valid ? goStep(1) : setTouched(true))
  const toggle = (id: AvatarId) => {
    setSel((s) => ORDER.filter((x) => (x === id ? !s.includes(id) : s.includes(x))))
    setAuto((a) => ({ seq: a.seq + 1, dur: 1.8 }))
  }
  const run = () => { if (valid && sel.length) onRun({ url: url.trim(), goal: goalNow, avatarIds: sel }) }

  const rise = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, y: 28, filter: 'blur(10px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, exit: { opacity: 0, y: -12, filter: 'blur(6px)', transition: { duration: 0.24, ease: EASE_IN } }, transition: { duration: 0.75, ease: EASE } }
  const settle = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, filter: 'blur(4px)' }, animate: { opacity: 1, filter: 'blur(0px)' }, exit: { opacity: 0 }, transition: { duration: 0.45, ease: EASE } }
  const item = (i: number, base = 0.22, gap = 0.03) => reduce ? {} : {
    initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: LAND, delay: base + i * gap },
  }
  let wi = 0

  return (
    <div className={`launch ${step === 0 ? 'center' : 'top'}`}>
      {step === 0 && (
        <>
          <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
          <div className="hero">
            <div className="cluster" aria-hidden="true">
              {CLUSTER.map((id, i) => (
                <motion.div key={id} style={{ position: 'relative', zIndex: 5 - Math.abs(2 - i) }} {...(reduce ? {} : { initial: { opacity: 0, y: 26 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: LAND, delay: i * 0.07 } })}>
                  <div className="cl-av" style={{ animationDelay: `-${i * 0.55}s` }}><Avatar id={id} mood={i % 2 ? 'happy' : 'idle'} size={54} /></div>
                </motion.div>
              ))}
            </div>
            <h1 className="h1">
              {HEADLINE.map((line, li) => (
                <span key={li}>
                  {li > 0 && <br />}
                  {line.map((w) => {
                    const i = wi++
                    return (
                      <span key={w} className="w">
                        <motion.span {...(reduce ? {} : { initial: { y: '110%', opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.9, ease: EASE, delay: 0.12 + i * 0.045 } })}>{w}</motion.span>{' '}
                      </span>
                    )
                  })}
                </span>
              ))}
            </h1>
            <motion.p className="sub" {...rise}>Paste a link. Pick who visits, give them one goal, and watch where they get stuck.</motion.p>
          </div>
        </>
      )}

      <div className="thread">
        <AnimatePresence mode="popLayout" initial={false}>
          {step === 0 ? (
            <motion.div key="s0" layout={!reduce} className={`composer ${showErr ? 'err' : ''}`} {...rise}>
              <div className="url-row">
                <svg className="url-ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>
                <label className="sr" htmlFor="uxie-url">Website address to test</label>
                <input
                  id="uxie-url" className="url-in" type="url" inputMode="url" autoComplete="url" spellCheck={false} autoFocus
                  placeholder="Paste a URL to test, like https://yoursite.com" value={url} aria-invalid={showErr} aria-describedby={showErr ? 'uxie-url-err' : undefined}
                  onChange={(e) => {
                    const v = e.target.value, ok = isValidUrl(v)
                    setUrl(v); setTouched((t) => t && !ok)
                    if (pasted.current && ok) later(1, 450)
                    pasted.current = false
                  }}
                  onPaste={() => { pasted.current = true }}
                  onBlur={() => setTouched(true)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitUrl() } }}
                />
                <button className="send" type="button" disabled={!valid} onClick={submitUrl} aria-label="Continue"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" /></svg></button>
              </div>
              {showErr && (
                <div className="err-msg" role="alert" id="uxie-url-err"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM12 8v5M12 16v.2" /></svg>That doesn’t look like a public web address. Start it with http:// or https://</div>
              )}
            </motion.div>
          ) : (
            <DoneRow key="d0" label="Site" value={host} onChange={() => goStep(0)} motionProps={settle} layout={!reduce}><span className="fav" aria-hidden="true">{favLetter(host)}</span></DoneRow>
          )}

          {step === 1 && (
            <motion.section key="s1" layout={!reduce} className="step" aria-labelledby="q-personas" {...rise}>
              <span className="q-n">Step 2 of 3</span>
              <h2 className="q" id="q-personas">Who should visit {host}?</h2>
              <p className="q-sub">Each visitor changes the browser itself, not just the wording. Hover one to see how.</p>
              <div className="tiles">
                {ORDER.map((id, i) => {
                  const a = AV[id], on = sel.includes(id), hov = hover === id
                  return (
                    <motion.button
                      key={id} type="button" className={`tile ${on ? 'on' : ''}`} aria-pressed={on} aria-label={`${a.name}, ${a.tag} ${a.changes}`}
                      style={on ? { background: a.soft, borderColor: a.ink, boxShadow: `inset 0 0 0 1px ${a.ink}` } : undefined}
                      onClick={() => toggle(id)} onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover((h) => (h === id ? null : h))} onFocus={() => setHover(id)} onBlur={() => setHover((h) => (h === id ? null : h))}
                      {...item(i)}
                    >
                      <span className="check" style={{ background: a.ink }} aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                      <span className="tile-av"><Avatar id={id} mood={on ? 'happy' : 'idle'} size={62} /></span>
                      <span className="nm">{a.name}</span>
                      <span className={`tg ${hov ? 'chg' : ''}`}>{hov ? a.changes : a.tag}</span>
                    </motion.button>
                  )
                })}
              </div>
              <div className="auto">
                <div className="autobar" aria-hidden="true">
                  <i key={auto.seq} className={sel.length ? 'a' : 'off'} style={{ animationDuration: `${auto.dur}s` }} onAnimationEnd={() => { if (sel.length) goStep(2) }} />
                </div>
                <div className="auto-row" aria-live="polite">
                  <span>{sel.length ? `Continuing with ${who}…` : 'Pick at least one visitor to continue'}</span>
                  {sel.length > 0 && <button className="text-btn" type="button" onClick={() => goStep(2)}>Continue now</button>}
                </div>
              </div>
            </motion.section>
          )}
          {step > 1 && (
            <DoneRow key="d1" label="Visitors" value={who || 'No one yet'} onChange={() => goStep(1)} motionProps={settle} layout={!reduce}>
              <div className="stack" aria-hidden="true">{sel.map((id) => <span key={id} className="st-av"><Avatar id={id} mood="happy" size={30} /></span>)}</div>
            </DoneRow>
          )}

          {step === 2 && (
            <motion.section key="s2" layout={!reduce} className="step" aria-labelledby="q-goal" {...rise}>
              <span className="q-n">Step 3 of 3</span>
              <h2 className="q" id="q-goal">What should they try to do?</h2>
              <p className="q-sub">Pick one or describe it. Visitors only browse and read: no typing, sign-ups or purchases.</p>
              <div className="chips">
                {GOALS.map((c, i) => (
                  <motion.button key={c} type="button" className={`chip ${goal === c ? 'on' : ''}`} aria-pressed={goal === c} onClick={() => setGoal(c)} {...item(i, 0.22, 0.035)}>{c}</motion.button>
                ))}
              </div>
              <label className="sr" htmlFor="uxie-goal">Goal in your own words</label>
              <input id="uxie-goal" className="goal-in" type="text" placeholder="Or describe the goal in your own words" value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run() } }} />
              <div className="goal-bar">
                <div className="stack" aria-hidden="true">
                  {sel.map((id) => <motion.span key={id} layoutId={`av-${id}`} className="st-av"><Avatar id={id} mood="happy" size={30} /></motion.span>)}
                </div>
                <div className="bar-txt">{sel.length ? `${who} will try to ${lowerFirst(goalNow)}` : 'Pick at least one visitor to run'}</div>
                <button className="run" type="button" disabled={!valid || !sel.length} onClick={run}>Run preflight<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {step === 0 && (
        <motion.div className="demo" {...rise}>
          <button className="ghost" type="button" onClick={() => { setUrl(DEMO_URL); setTouched(false); later(1, 450) }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5" /></svg>
            No site handy? Try the demo site
          </button>
        </motion.div>
      )}
    </div>
  )
}
