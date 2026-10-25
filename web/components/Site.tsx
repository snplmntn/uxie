import type { CSSProperties } from 'react'
import type { Variant } from '@/lib/avatars'
import type { Preview, SiteTarget } from '@/lib/types'

// The fake "Brightside" site each visitor sees in the scripted demo, drawn in container units so it scales with its card.
type Props = Preview & { variant: Variant; accent: string; flag?: boolean; cursor?: boolean }

// Where the pointer sits for each target, in % of the preview (desktop) or of the phone screen (mobile).
const DESK: Partial<Record<SiteTarget, [number, number]>> = { navLogo: [8, 5], navProduct: [25, 5], navPricing: [32, 5], navSignin: [88, 5], navSignup: [94, 5], heroCta: [12, 50], heroPlay: [23, 50], chart: [72, 40], pricing: [40, 55], footer: [86, 95], cookieAccept: [16, 89], cookieReject: [32, 89], cookieClose: [34, 80] }
const MOB: Partial<Record<SiteTarget, [number, number]>> = { heroCta: [50, 45], navSignup: [70, 51], navMenu: [86, 9], cookieAccept: [50, 90], cookieReject: [50, 96], pricing: [55, 50] }
const EASE = 'cubic-bezier(.2,.8,.2,1)'

export function Site({ variant, target = '', overlay = '', scroll = 0, press: pressed, accent, flag = false, cursor = true }: Props) {
  const isMobile = variant === 'mobile', isTree = variant === 'tree', zoom = variant === 'zoom'
  const keys = !!pressed

  const r = (id: SiteTarget, radius: string): CSSProperties => {
    if (target !== id) return { borderRadius: radius }
    if (isTree) return { borderRadius: radius, background: accent + '1F', boxShadow: `inset 0.35cqw 0 0 ${accent}` }
    const w = isMobile ? '1cqw' : '0.32cqw', off = isMobile ? '1.2cqw' : '0.45cqw'
    return { borderRadius: radius, outline: `${w} ${flag ? 'dashed' : 'solid'} ${flag ? '#F79009' : accent}`, outlineOffset: off, animation: 'stPulse 1.6s ease-in-out infinite' }
  }

  const p = [0, 45, 100][scroll], vh = zoom ? 31.25 : 62.5
  const cur = DESK[target] ?? [62, 30]
  const tap = MOB[target]
  const showCursor = cursor && !isMobile && !isTree && !zoom && !keys

  return (
    <div style={{ containerType: 'inline-size', position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden', background: '#FFFFFF', fontFamily: "-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif", color: '#1A1A1A', textAlign: 'left', lineHeight: 1.3 }} aria-hidden="true">
      {!isMobile && !isTree && (
        <div style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', ...(zoom ? { width: '50%', height: '50%', transform: 'scale(2)', transformOrigin: '0 0' } : { width: '100%', height: '100%' }) }}>
          <div style={{ transform: p ? `translateY(calc(${-p}% + ${(p * vh) / 100}cqw))` : 'none', transition: `transform .9s ${EASE}` }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: zoom ? 'nowrap' : 'wrap', gap: '1.2cqw 2.4cqw', padding: '1.8cqw 4cqw', borderBottom: '0.1cqw solid #F0F0F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8cqw', ...r('navLogo', '0.6cqw') }}>
                <div style={{ width: '2.2cqw', height: '2.2cqw', borderRadius: '50%', background: '#FDB022', boxShadow: '0 0 0 0.45cqw #FEF0C7' }} />
                <span style={{ fontSize: '1.7cqw', fontWeight: 700, letterSpacing: '-0.03em' }}>Brightside</span>
              </div>
              <div style={{ display: 'flex', gap: '2.4cqw', marginLeft: '2.4cqw', fontSize: '1.25cqw', color: '#555555' }}>
                <span style={r(target === 'invisible' ? 'invisible' : 'navProduct', '0.4cqw')}>Product</span>
                <span style={r('navPricing', '0.4cqw')}>Pricing</span>
                <span>Help</span>
              </div>
              <div style={{ display: 'flex', gap: '1.1cqw', marginLeft: 'auto', fontSize: '1.05cqw', color: '#BDBDBD' }}>
                <span style={r('navSignin', '0.3cqw')}>Sign in</span>
                <span style={r('navSignup', '0.3cqw')}>Sign up</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4cqw', padding: '5cqw 4cqw 3cqw', alignItems: 'center' }}>
              <div style={{ flex: '1 1 40cqw', minWidth: 0 }}>
                <div style={{ display: 'inline-block', fontSize: '1cqw', padding: '0.5cqw 1.1cqw', borderRadius: '9cqw', background: '#F4F4F5', color: '#555555', marginBottom: '1.8cqw' }}>New · Budgets that breathe</div>
                <div style={{ fontSize: '5.2cqw', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1 }}>Money, made calm.</div>
                <div style={{ fontSize: '1.5cqw', lineHeight: 1.45, color: '#6B6B6B', marginTop: '1.6cqw', maxWidth: '36cqw' }}>Let’s get this show on the road. Budgets that breathe with you, not against you.</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.4cqw', marginTop: '2.6cqw' }}>
                  <span style={{ background: '#111111', color: '#FFFFFF', fontSize: '1.3cqw', fontWeight: 600, padding: '1.3cqw 2.4cqw', whiteSpace: 'nowrap', ...r('heroCta', '9cqw') }}>Start your journey</span>
                  <span style={{ width: '4.2cqw', height: '4.2cqw', border: '0.12cqw solid #DDDDDD', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', ...r('heroPlay', '50%') }}><svg viewBox="0 0 24 24" style={{ width: '1.6cqw', height: '1.6cqw' }}><path d="M8 5v14l11-7z" fill="#111111" /></svg></span>
                </div>
              </div>
              <div style={{ flex: '1 1 30cqw', minWidth: 0 }}>
                <div style={{ background: '#F7F7F8', padding: '2.2cqw', ...r('chart', '2cqw') }}>
                  <div style={{ fontSize: '1cqw', color: '#777777' }}>This month</div>
                  <div style={{ fontSize: '3cqw', fontWeight: 700, letterSpacing: '-0.03em', marginTop: '0.4cqw' }}>$2,340</div>
                  <svg viewBox="0 0 200 80" style={{ width: '100%', height: 'auto', display: 'block', marginTop: '1cqw' }}><path d="M0 60C30 55 50 30 80 34S130 20 160 14S190 10 200 8" fill="none" stroke="#22A06B" strokeWidth="3" strokeLinecap="round" /><path d="M0 40C30 45 50 52 80 48S130 60 160 58S190 64 200 66" fill="none" stroke="#E5484D" strokeWidth="3" strokeLinecap="round" /></svg>
                  <div style={{ display: 'flex', gap: '1.6cqw', marginTop: '1cqw', fontSize: '0.95cqw', color: '#777777' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5cqw' }}><i style={{ width: '0.9cqw', height: '0.9cqw', borderRadius: '50%', background: '#22A06B', display: 'block' }} />Saved</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5cqw' }}><i style={{ width: '0.9cqw', height: '0.9cqw', borderRadius: '50%', background: '#E5484D', display: 'block' }} />Spent</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2cqw', padding: '3cqw 4cqw' }}>
              {[['#FEF0C7', 'Sync your workspace', 'Connect banks and cards in one dashboard.'], ['#DCFCE7', 'Smart buckets', 'Split every paycheck automatically.'], ['#E0E7FF', 'Calm alerts', 'Only the notifications that matter.']].map(([bg, h, t]) => (
                <div key={h} style={{ flex: '1 1 24cqw', border: '0.1cqw solid #EEEEEE', borderRadius: '1.6cqw', padding: '1.8cqw' }}>
                  <div style={{ width: '3cqw', height: '3cqw', borderRadius: '0.8cqw', background: bg }} />
                  <div style={{ fontSize: '1.35cqw', fontWeight: 600, marginTop: '1.2cqw' }}>{h}</div>
                  <div style={{ fontSize: '1.05cqw', color: '#777777', marginTop: '0.5cqw', lineHeight: 1.45 }}>{t}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '3cqw 4cqw', ...r('pricing', '1cqw') }}>
              <div style={{ fontSize: '2.4cqw', fontWeight: 700, letterSpacing: '-0.03em' }}>Simple pricing</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2cqw', marginTop: '1.6cqw' }}>
                {PLANS.map(([n, v], i) => (
                  <div key={n} style={{ flex: '1 1 20cqw', background: i === 1 ? '#111111' : '#F7F7F8', color: i === 1 ? '#FFFFFF' : undefined, borderRadius: '1.4cqw', padding: '1.6cqw' }}>
                    <div style={{ fontSize: '1.1cqw', color: i === 1 ? '#BBBBBB' : '#777777' }}>{n}</div><div style={{ fontSize: '2.2cqw', fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.6cqw', padding: '2cqw 4cqw 2.6cqw', borderTop: '0.1cqw solid #F0F0F0', fontSize: '0.8cqw', color: '#C4C4C4', ...r('footer', '0') }}>
              <span>© 2026 Brightside</span><span style={{ marginLeft: 'auto' }}>Pricing</span><span>Privacy</span><span>Terms</span><span>Cookies</span>
            </div>
          </div>

          {overlay === 'cookie' && (
            <div style={{ position: 'absolute', left: '3cqw', bottom: '3cqw', width: '34cqw', background: '#FFFFFF', borderRadius: '1.6cqw', boxShadow: '0 1cqw 4cqw rgba(0,0,0,0.16)', padding: '2cqw', animation: `stIn .5s ${EASE} both` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.35cqw', fontWeight: 650 }}>We value your privacy</span>
                <span style={{ display: 'flex', ...r('cookieClose', '0.4cqw') }}><svg viewBox="0 0 24 24" style={{ width: '1.5cqw', height: '1.5cqw' }}><path d="M6 6l12 12M18 6L6 18" stroke="#999999" strokeWidth="2.4" strokeLinecap="round" /></svg></span>
              </div>
              <div style={{ fontSize: '1.05cqw', color: '#666666', lineHeight: 1.45, marginTop: '0.8cqw' }}>We use cookies to personalise content and improve your experience.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.6cqw', marginTop: '1.4cqw' }}>
                <span style={{ flex: 1, textAlign: 'center', background: '#111111', color: '#FFFFFF', fontSize: '1.15cqw', fontWeight: 600, padding: '1cqw', ...r('cookieAccept', '9cqw') }}>Accept all</span>
                <span style={{ fontSize: '0.85cqw', color: '#B5B5B5', ...r('cookieReject', '0.3cqw') }}>Manage</span>
              </div>
            </div>
          )}
        </div>
      )}

      {isMobile && (
        <div style={{ position: 'absolute', inset: 0, background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ height: '93%', aspectRatio: '9/19.5', background: '#111111', borderRadius: '3.4cqw', padding: '0.55cqw', boxShadow: '0 1.2cqw 3cqw rgba(0,0,0,0.18)' }}>
            <div style={{ containerType: 'inline-size', position: 'relative', width: '100%', height: '100%', borderRadius: '2.9cqw', overflow: 'hidden', background: '#FFFFFF' }}>
              <div style={{ position: 'absolute', top: '3cqw', left: '50%', transform: 'translateX(-50%)', width: '28cqw', height: '7.5cqw', borderRadius: '9cqw', background: '#111111', zIndex: 4 }} />
              <div style={{ transform: scroll === 1 ? 'translate(-18cqw,-150cqw)' : scroll === 2 ? 'translateY(calc(-100% + 216cqw))' : 'none', transition: `transform .9s ${EASE}` }}>
                <div style={{ height: '14cqw' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.4cqw', padding: '2cqw 6cqw' }}>
                  <div style={{ width: '6cqw', height: '6cqw', borderRadius: '50%', background: '#FDB022' }} />
                  <span style={{ fontSize: '6cqw', fontWeight: 700, letterSpacing: '-0.03em' }}>Brightside</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2cqw', padding: '1.5cqw', ...r('navMenu', '1.5cqw') }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: '6cqw', height: '0.7cqw', background: '#111111', display: 'block', borderRadius: '1cqw' }} />)}</span>
                </div>
                <div style={{ padding: '8cqw 6cqw 4cqw' }}>
                  <div style={{ display: 'inline-block', fontSize: '3.4cqw', padding: '1.4cqw 3cqw', borderRadius: '9cqw', background: '#F4F4F5', color: '#555555' }}>New · Budgets that breathe</div>
                  <div style={{ fontSize: '13cqw', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1, marginTop: '5cqw' }}>Money, made calm.</div>
                  <div style={{ fontSize: '4.4cqw', lineHeight: 1.45, color: '#6B6B6B', marginTop: '4cqw' }}>Let’s get this show on the road. Budgets that breathe with you.</div>
                  <div style={{ marginTop: '6cqw', background: '#111111', color: '#FFFFFF', textAlign: 'center', fontSize: '4.6cqw', fontWeight: 600, padding: '4cqw', ...r('heroCta', '9cqw') }}>Start your journey</div>
                  <div style={{ marginTop: '3cqw', textAlign: 'center', fontSize: '3.2cqw', color: '#B5B5B5' }}>Have an account? Sign in · <span style={r('navSignup', '1cqw')}>Sign up</span></div>
                </div>
                <div style={{ margin: '4cqw 6cqw', background: '#F7F7F8', borderRadius: '5cqw', padding: '5cqw' }}>
                  <div style={{ fontSize: '3.4cqw', color: '#777777' }}>This month</div>
                  <div style={{ fontSize: '9cqw', fontWeight: 700, letterSpacing: '-0.03em' }}>$2,340</div>
                  <svg viewBox="0 0 200 80" style={{ width: '100%', height: 'auto', display: 'block', marginTop: '2cqw' }}><path d="M0 60C30 55 50 30 80 34S130 20 160 14S190 10 200 8" fill="none" stroke="#22A06B" strokeWidth="3" /><path d="M0 40C30 45 50 52 80 48S130 60 160 58S190 64 200 66" fill="none" stroke="#E5484D" strokeWidth="3" /></svg>
                </div>
                <div style={{ padding: '6cqw', ...r('pricing', '3cqw') }}>
                  <div style={{ fontSize: '7cqw', fontWeight: 700, letterSpacing: '-0.03em' }}>Simple pricing</div>
                  <div style={{ display: 'flex', gap: '3cqw', marginTop: '4cqw', width: '130cqw' }}>
                    {PLANS.map(([n, v], i) => (
                      <div key={n} style={{ flex: 1, background: i === 1 ? '#111111' : '#F7F7F8', color: i === 1 ? '#FFFFFF' : undefined, borderRadius: '4cqw', padding: '4cqw' }}>
                        <div style={{ fontSize: '3.4cqw', color: i === 1 ? '#BBBBBB' : '#777777' }}>{n}</div><div style={{ fontSize: '7cqw', fontWeight: 700 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '6cqw', fontSize: '2.8cqw', color: '#C4C4C4', borderTop: '0.3cqw solid #F0F0F0' }}>© 2026 Brightside · Privacy · Terms</div>
              </div>
              {overlay === 'cookie' && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#FFFFFF', borderRadius: '6cqw 6cqw 0 0', boxShadow: '0 -2cqw 8cqw rgba(0,0,0,0.14)', padding: '6cqw 6cqw 5cqw', zIndex: 3, animation: `stIn .5s ${EASE} both` }}>
                  <div style={{ fontSize: '4.6cqw', fontWeight: 650 }}>We value your privacy</div>
                  <div style={{ fontSize: '3.4cqw', color: '#666666', lineHeight: 1.45, marginTop: '2cqw' }}>We use cookies to personalise content and improve your experience.</div>
                  <div style={{ marginTop: '4cqw', background: '#111111', color: '#FFFFFF', textAlign: 'center', fontSize: '4.2cqw', fontWeight: 600, padding: '3.6cqw', ...r('cookieAccept', '9cqw') }}>Accept all</div>
                  <div style={{ marginTop: '3cqw', textAlign: 'center' }}><span style={{ fontSize: '2.8cqw', color: '#B5B5B5', ...r('cookieReject', '1cqw') }}>Manage</span></div>
                </div>
              )}
              {cursor && tap && (
                <div style={{ position: 'absolute', left: `${tap[0]}%`, top: `${tap[1]}%`, width: '14cqw', height: '14cqw', margin: '-7cqw 0 0 -7cqw', borderRadius: '50%', background: accent, zIndex: 5, pointerEvents: 'none', animation: 'stTap 1.3s ease-out infinite', transition: `left .7s ${EASE},top .7s ${EASE}` }} />
              )}
            </div>
          </div>
        </div>
      )}

      {isTree && (
        <div style={{ position: 'absolute', inset: 0, background: '#FBFBFD', padding: '2.4cqw 3cqw', fontFamily: "ui-monospace,'SF Mono',Menlo,Consolas,monospace", fontSize: '1.3cqw', lineHeight: 1.7, color: '#3A3A3C', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8cqw', fontFamily: "-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif", fontSize: '1.05cqw', fontWeight: 600, color: '#8A8A8E', marginBottom: '1cqw', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <svg viewBox="0 0 24 24" style={{ width: '1.6cqw', height: '1.6cqw' }}><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" fill="none" stroke="#8A8A8E" strokeWidth="2" strokeLinecap="round" /></svg>
            Accessibility tree · no screenshot
          </div>
          <div>document “Brightside · Money, made calm”</div>
          <div style={{ paddingLeft: '2.4cqw' }}>banner</div>
          <div style={{ paddingLeft: '4.8cqw', ...r('navLogo', '0.5cqw') }}>link “Brightside”</div>
          <div style={{ paddingLeft: '4.8cqw', ...r(target === 'invisible' ? 'invisible' : 'navProduct', '0.5cqw') }}>link “Product”</div>
          <div style={{ paddingLeft: '4.8cqw', ...r('navPricing', '0.5cqw') }}>link “Pricing”   link “Help”</div>
          <div style={{ paddingLeft: '4.8cqw', ...r('navSignin', '0.5cqw') }}>link “Sign in”   link “Sign up”</div>
          {overlay === 'cookie' ? (
            <>
              <div style={{ paddingLeft: '2.4cqw' }}>dialog “We value your privacy” <span style={{ color: '#B54708', fontWeight: 600 }}>(focus trapped)</span></div>
              <div style={{ paddingLeft: '4.8cqw', ...r('cookieAccept', '0.5cqw') }}>text “Accept all” <span style={{ color: '#B54708', fontWeight: 600 }}>(not a button)</span></div>
              <div style={{ paddingLeft: '4.8cqw', ...r('cookieClose', '0.5cqw') }}>button <span style={{ color: '#B54708', fontWeight: 600 }}>(no name)</span></div>
              <div style={{ paddingLeft: '4.8cqw', ...r('cookieReject', '0.5cqw') }}>link “Manage”</div>
            </>
          ) : (
            <>
              <div style={{ paddingLeft: '2.4cqw' }}>main</div>
              <div style={{ paddingLeft: '4.8cqw' }}>heading “Money, made calm.” level 1</div>
              <div style={{ paddingLeft: '4.8cqw', ...r('heroCta', '0.5cqw') }}>button “Start your journey”</div>
              <div style={{ paddingLeft: '4.8cqw', ...r('heroPlay', '0.5cqw') }}>button <span style={{ color: '#B54708', fontWeight: 600 }}>(no name)</span></div>
              <div style={{ paddingLeft: '4.8cqw', ...r('pricing', '0.5cqw') }}>heading “Simple pricing” level 2</div>
            </>
          )}
        </div>
      )}

      {showCursor && (
        <div style={{ position: 'absolute', left: `${cur[0]}%`, top: `${cur[1]}%`, width: '2.4cqw', height: '2.4cqw', zIndex: 6, pointerEvents: 'none', filter: 'drop-shadow(0 0.2cqw 0.4cqw rgba(0,0,0,0.25))', transition: `left .8s ${EASE},top .8s ${EASE}` }}>
          <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', display: 'block' }}><path d="M5 3l14 8-6 1.6L10 19z" fill="#111111" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        </div>
      )}
      {keys && (
        <div style={{ position: 'absolute', right: '2cqw', bottom: '2cqw', zIndex: 6, display: 'flex', alignItems: 'center', gap: '0.6cqw', background: '#111111', color: '#FFFFFF', fontSize: '1.1cqw', fontWeight: 600, padding: '0.7cqw 1.1cqw', borderRadius: '0.9cqw' }}>
          <span style={{ border: '0.12cqw solid rgba(255,255,255,0.5)', borderRadius: '0.4cqw', padding: '0 0.6cqw' }}>{pressed}</span>
          {target === 'invisible' ? 'focus not visible' : target ? 'focus moved' : 'ready'}
        </div>
      )}
    </div>
  )
}

const PLANS = [['Free', '$0'], ['Plus', '$6/mo'], ['Family', '$12/mo']]
