'use client'

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_SEL } from '@/lib/avatars'
import { DEMO_URL, GOALS, createMockClient } from '@/lib/demo'
import { createHttpClient } from '@/lib/http-client'
import type { Report as ReportT, RunClient, RunEvent, RunRequest } from '@/lib/types'
import { Launch } from './Launch'
import { Report, Compiling } from './Report'
import { RunScreen, type AvatarRun } from './RunScreen'
import { EASE, EASE_IN, Fav, hostOf, isLive, mmss } from './ui'

type Screen = 'launch' | 'run' | 'compiling' | 'report'

const API = process.env.NEXT_PUBLIC_UXIE_API
const mock = createMockClient()
// The scripted demo runs whenever there is no backend, and always for the made-up demo site.
const clientFor = (url: string): RunClient => (API && url !== DEMO_URL ? createHttpClient(API) : mock)

// Ticks on each whole second since t0 and re-renders only itself, not the run screen.
function Timer({ t0, endAt }: { t0: number; endAt: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (endAt) return
    let id: ReturnType<typeof setTimeout>
    const tick = () => { const n = Date.now(); setNow(n); id = setTimeout(tick, 1000 - ((n - t0) % 1000) + 5) }
    tick()
    return () => clearTimeout(id)
  }, [t0, endAt])
  return <span className="timer" aria-label="Elapsed time">{mmss(Math.max(0, (endAt || now) - t0) / 1000)}</span>
}

export function Uxie() {
  const reduce = useReducedMotion()
  const [screen, setScreen] = useState<Screen>('launch')
  const [launchStep, setLaunchStep] = useState<0 | 1 | 2>(0)
  const [req, setReq] = useState<RunRequest>({ url: '', goal: GOALS[0], avatarIds: DEFAULT_SEL })
  const [runs, setRuns] = useState<AvatarRun[]>([])
  const [report, setReport] = useState<ReportT | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [t0, setT0] = useState(0)
  const run = useRef<{ client: RunClient; id: string | null; unsub?: () => void } | null>(null)
  const compAt = useRef(0)

  const detach = () => { run.current?.unsub?.(); run.current = null }
  useEffect(() => detach, [])

  const onEvent = useCallback((e: RunEvent) => {
    const at = Date.now()
    if (e.type === 'step') setRuns((rs) => rs.map((r) => (r.id === e.step.avatarId ? { ...r, status: 'running', steps: [...r.steps.filter((s) => s.n !== e.step.n), e.step] } : r)))
    if (e.type === 'frame') setRuns((rs) => rs.map((r) => (r.id === e.avatarId ? { ...r, frame: { n: e.n, url: e.url, screenshot: e.screenshot } } : r)))
    if (e.type === 'avatar_status') setRuns((rs) => rs.map((r) => (r.id === e.avatarId ? { ...r, status: e.status, endedAt: isLive(e.status) ? undefined : at } : r)))
    if (e.type === 'report') setReport(e.report)
  }, [])

  const start = (r: RunRequest) => {
    detach()
    const client = clientFor(r.url)
    const at = Date.now()
    setReq(r); setReport(null); setError(null); setT0(at)
    setRuns(r.avatarIds.map((id) => ({ id, status: 'queued', steps: [], startedAt: at })))
    setScreen('run')
    const me = { client, id: null as string | null, unsub: undefined as undefined | (() => void) }
    run.current = me
    client.start(r).then(({ runId }) => {
      if (run.current !== me) return
      me.id = runId
      me.unsub = client.events(runId, onEvent)
    }, (err: Error) => { if (run.current === me) { setError(err.message); setScreen('launch'); setLaunchStep(2) } })
  }
  const stop = () => { const r = run.current; if (r?.id) r.client.stop(r.id) }
  const home = () => { detach(); setLaunchStep(0); setScreen('launch'); setRuns([]); setReport(null) }

  const allDone = runs.length > 0 && runs.every((r) => !isLive(r.status))
  const endAt = allDone ? Math.max(...runs.map((r) => r.endedAt ?? 0)) : 0

  // Everyone finished: a beat to cheer or droop, then compile, then the report once it arrives.
  useEffect(() => {
    if (screen !== 'run' || !allDone) return
    const t = setTimeout(() => { compAt.current = Date.now(); setScreen('compiling') }, 1300)
    return () => clearTimeout(t)
  }, [screen, allDone])
  useEffect(() => {
    if (screen !== 'compiling' || !report) return
    const t = setTimeout(() => setScreen('report'), Math.max(0, 1500 - (Date.now() - compAt.current)))
    return () => clearTimeout(t)
  }, [screen, report])

  const host = hostOf(req.url)
  const finished = runs.filter((r) => !isLive(r.status)).length
  const isDemo = clientFor(req.url) === mock

  const fx = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }
    : { initial: { opacity: 0, y: 18, filter: 'blur(8px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE } }, exit: { opacity: 0, y: -18, filter: 'blur(8px)', transition: { duration: 0.32, ease: EASE_IN } } }

  return (
    <div className="app">
      <header className={`topbar ${screen === 'launch' ? '' : 'edge'}`}>
        <button className="logo" type="button" onClick={home} aria-label="Uxie, start a new test">
          <span className="mark" aria-hidden="true"><i style={{ background: '#C084FC' }} /><i style={{ background: '#F472B6' }} /><i style={{ background: '#38BDF8' }} /><i style={{ background: '#FBBF24' }} /></span>
          <span>Uxie</span>
        </button>
        {/* The report header already names the site and goal. */}
        {screen !== 'launch' && screen !== 'report' && (
          <div className="target"><Fav url={req.url} /><span className="t-host">{host}</span><span className="t-sep" aria-hidden="true" /><span className="t-goal">{req.goal}</span></div>
        )}
        <div className="bar-r">
          {screen === 'run' && (
            <>
              <Timer t0={t0} endAt={endAt} />
              <span className="pill-run" role="status">{!allDone && <i className="pulse" style={{ color: '#0071E3' }} />}{allDone ? 'All finished' : `${finished} of ${runs.length} finished`}</span>
            </>
          )}
          {screen === 'report' && <button className="btn sm dark" type="button" onClick={home}>Test another site</button>}
        </div>
      </header>

      {error && screen === 'launch' && <p className="err-msg" role="alert" style={{ justifyContent: 'center', paddingTop: 12 }}>Couldn’t start the run: {error}</p>}

      <LayoutGroup>
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
          <motion.main key={screen} {...fx}>
            {screen === 'launch' && <Launch initial={req} startStep={launchStep} onRun={start} />}
            {screen === 'run' && (
              <RunScreen runs={runs} goal={req.goal} onStop={stop} />
            )}
            {screen === 'compiling' && <Compiling runs={runs} />}
            {screen === 'report' && report && <Report req={req} runs={runs} report={report} onRunAgain={() => start(req)} onHome={home} />}
          </motion.main>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}
