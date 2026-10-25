import { useRef, useState } from 'react'
import type { Mood } from '@/lib/avatars'
import { DEMO_URL } from '@/lib/demo'
import type { AvatarStatus, Severity } from '@/lib/types'

export const ICON = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M7 7l10 10M17 7L7 17',
  q: 'M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.5M12 17v.2',
  stop: 'M8 8h8v8H8z',
  alert: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM12 8v5M12 16v.2',
  blocker: 'M8.6 3.5h6.8l5.1 5.1v6.8l-5.1 5.1H8.6l-5.1-5.1V8.6zM12 8v4.6M12 15.8v.2',
  major: 'M12 4.2l8.6 15H3.4zM12 10v4M12 16.8v.2',
  minor: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM12 11v5M12 8v.2',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4',
}

type St = { label: string; cls: 'ok' | 'bad' | 'warn' | 'mute'; icon: string; mood: Mood; verb: string }
export const STATUS: Record<Exclude<AvatarStatus, 'queued' | 'running'>, St> = {
  done: { label: 'Reached goal', cls: 'ok', icon: ICON.check, mood: 'happy', verb: 'made it' },
  unverified: { label: 'Unverified', cls: 'warn', icon: ICON.q, mood: 'idle', verb: 'couldn’t confirm success' },
  gave_up: { label: 'Gave up', cls: 'bad', icon: ICON.x, mood: 'sad', verb: 'gave up' },
  failed: { label: 'Failed', cls: 'mute', icon: ICON.alert, mood: 'sad', verb: 'hit a technical error (not counted against the site)' },
  stopped: { label: 'Stopped', cls: 'mute', icon: ICON.stop, mood: 'idle', verb: 'were stopped early' },
}
export const statusOf = (s: AvatarStatus): St => (s === 'queued' || s === 'running' ? STATUS.stopped : STATUS[s])
export const isLive = (s: AvatarStatus) => s === 'queued' || s === 'running'

export const SEV: Record<Severity, { label: string }> = { blocker: { label: 'Blocker' }, major: { label: 'Major' }, minor: { label: 'Minor' } }

export function Ico({ d, size = 13, sw = 2.2, className }: { d: string; size?: number; sw?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

// Severity always carries an icon and a label, never color alone.
export function SevPill({ sev }: { sev: Severity }) {
  return <span className={`sev ${sev}`}><Ico d={ICON[sev]} />{SEV[sev].label}</span>
}

export const join = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1])
export const mmss = (sec: number) => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0')
export const lowerFirst = (t: string) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t)
// A bare domain like "site.com/pricing" gets https:// added.
export const normalizeUrl = (u: string) => { const t = (u || '').trim(); return t && !/^[a-z][a-z\d+.-]*:\/\//i.test(t) ? 'https://' + t : t }
// Public http(s) address with a real dotted domain; localhost, IPs and bare words are rejected, as the spec asks.
export const isValidUrl = (u: string) => {
  try {
    const x = new URL(normalizeUrl(u))
    return (x.protocol === 'http:' || x.protocol === 'https:') && /^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+(?:[a-z]{2,63}|xn--[a-z\d-]{1,59})$/i.test(x.hostname)
  } catch { return false }
}
export const hostOf = (u: string) => { try { return new URL(normalizeUrl(u)).host || u.trim() } catch { return u.trim() } }
export const favLetter = (host: string) => (host.replace(/^www\./, '').charAt(0) || 'U').toUpperCase()
const API = process.env.NEXT_PUBLIC_UXIE_API?.replace(/\/+$/, '')
// A real run's screenshot; a quiet note instead of the browser's broken-image icon if it fails to load.
// zoom: click to view full size in a native modal dialog (Esc, focus trap and backdrop come free).
export function Shot({ src, alt, style, zoom }: { src: string; alt: string; style?: React.CSSProperties; zoom?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null)
  const dlg = useRef<HTMLDialogElement>(null)
  if (failed === src) return <div className="boot" style={{ maxHeight: style?.maxHeight }}><span>Screenshot unavailable</span></div>
  const img = <img src={src} alt={alt} style={style} onError={() => setFailed(src)} />
  if (!zoom) return img
  const close = () => dlg.current?.close()
  return (
    <>
      <button type="button" className="shot-btn" onClick={() => dlg.current?.showModal()} aria-label={`Enlarge: ${alt}`}>{img}</button>
      {/* Esc closes only this dialog, not a panel listening on window behind it. */}
      <dialog ref={dlg} className="lightbox" aria-label={alt} onClick={(e) => e.target === e.currentTarget && close()} onKeyDown={(e) => e.key === 'Escape' && e.stopPropagation()}>
        <img src={src} alt={alt} />
        <button type="button" className="lb-x" onClick={close} aria-label="Close"><Ico d={ICON.x} size={18} sw={2.2} /></button>
      </dialog>
    </>
  )
}
// The site's own logo via the backend; the letter badge when there is no backend, for the demo site, or if it fails.
export function Fav({ url }: { url: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  const site = normalizeUrl(url)
  const src = API && site && site !== DEMO_URL && failed !== site ? `${API}/favicon?url=${encodeURIComponent(site)}` : null
  return (
    <span className={`fav ${src ? 'logo' : ''}`} aria-hidden="true">
      {src ? <img src={src} alt="" onError={() => setFailed(site)} /> : favLetter(hostOf(url))}
    </span>
  )
}

export const EASE = [0.32, 0.72, 0, 1] as const
export const LAND = [0.34, 1.4, 0.64, 1] as const
export const EASE_IN = [0.4, 0, 1, 1] as const
