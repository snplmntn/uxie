import type { Mood } from '@/lib/avatars'
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
// Public http(s) address with a dotted host; localhost and bare words are rejected, as the spec asks.
export const isValidUrl = (u: string) => /^https?:\/\/[^\s/$.?#][^\s]*\.[a-z]{2,}(\/[^\s]*)?$/i.test((u || '').trim())
export const hostOf = (u: string) => { try { return new URL(u.trim()).host || u.trim() } catch { return u.trim() } }
export const favLetter = (host: string) => (host.replace(/^www\./, '').charAt(0) || 'U').toUpperCase()

export const EASE = [0.32, 0.72, 0, 1] as const
export const LAND = [0.34, 1.4, 0.64, 1] as const
export const EASE_IN = [0.4, 0, 1, 1] as const
