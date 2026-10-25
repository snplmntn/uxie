import { ART, AV, MOOD, ORDER, type Mood } from '@/lib/avatars'
import type { AvatarId } from '@/lib/types'

type Props = { id: AvatarId; mood?: Mood; size?: number; anim?: '' | 'bob' | 'cheer' | 'droop' }

export function Avatar({ id, mood = 'idle', size = 120, anim = '' }: Props) {
  const a = ART[id]
  const m = MOOD[mood]
  const blinkDelay = (ORDER.indexOf(id) * 0.73).toFixed(2)
  const p = (d?: string, fill?: string, stroke?: string, sw?: number) =>
    d ? <path d={d} fill={fill ?? 'none'} stroke={stroke ?? 'none'} strokeWidth={sw ?? 0} strokeLinecap="round" strokeLinejoin="round" /> : null
  return (
    <svg className={anim ? `av av-${anim}` : 'av'} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={AV[id].name} style={{ display: 'block', overflow: 'visible', flex: 'none' }}>
      <circle cx="60" cy="60" r="60" fill={a.bg} />
      {a.hairBack && <path d={a.hairBack} fill={a.hair} />}
      <path d="M52 70h16v21h-16z" fill={a.skin} style={{ filter: 'brightness(.88)' }} />
      <path d="M15 121C15 99 34 88 60 88C86 88 105 99 105 121Z" fill={a.shirt} />
      {p(a.detail, a.detailFill, a.detailStroke, a.detailSw)}
      <path d="M35.5 57a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0ZM75.5 57a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0Z" fill={a.skin} />
      <path d="M60 31C73.5 31 81 41.5 81 55C81 69 72 79 60 79C48 79 39 69 39 55C39 41.5 46.5 31 60 31Z" fill={a.skin} />
      <circle cx="46.5" cy="65" r="3.8" fill="#FF6F8E" opacity=".26" />
      <circle cx="73.5" cy="65" r="3.8" fill="#FF6F8E" opacity=".26" />
      <g className={m.look ? 'av-look' : undefined}>
        <g className="av-eyes" style={{ opacity: m.eyes, animationDelay: `-${blinkDelay}s` }}>
          <ellipse cx="52" cy="56" rx="2.6" ry="3.3" fill="#24170F" />
          <ellipse cx="68" cy="56" rx="2.6" ry="3.3" fill="#24170F" />
        </g>
      </g>
      {m.arc && <path d={m.arc} fill="none" stroke="#24170F" strokeWidth="2.4" strokeLinecap="round" />}
      {m.brows && <path d={m.brows} fill="none" stroke="#24170F" strokeWidth="2.2" strokeLinecap="round" />}
      <path d={m.mouth} fill={m.mf} stroke="#24170F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {a.hairFront && <path d={a.hairFront} fill={a.hair} />}
      {p(a.acc1, a.acc1Fill, a.acc1Stroke, a.acc1Sw)}
      {p(a.acc2, a.acc2Fill, a.acc2Stroke, a.acc2Sw)}
      {p(a.acc3, a.acc3Fill, a.acc3Stroke, a.acc3Sw)}
      {a.text && <text x={a.tx} y={a.ty} fontSize={a.tsz} fontWeight="700" textAnchor="middle" fill={a.tfill} fontFamily="-apple-system,BlinkMacSystemFont,Inter,Segoe UI,sans-serif">{a.text}</text>}
    </svg>
  )
}
