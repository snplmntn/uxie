// Site logo for the UI: apple-touch-icon (crisp), then any declared icon, then /favicon.ico.
export function iconCandidates(html:string, base:string): string[] {
  const links = (html.match(/<link\b[^>]*>/gi) ?? []).map(tag => ({
    rel:(tag.match(/\brel\s*=\s*["']?([^"'>]+)/i)?.[1] ?? '').toLowerCase(),
    href:tag.match(/\bhref\s*=\s*["']?([^"'\s>]+)/i)?.[1],
  })).filter(l => l.href && /\bicon\b/.test(l.rel))
  const ranked = [...links.filter(l => l.rel.includes('apple-touch-icon')), ...links.filter(l => !l.rel.includes('apple-touch-icon'))]
  const urls = [...ranked.map(l => l.href!), '/favicon.ico'].map(h => { try { return new URL(h, base).href } catch { return null } })
  return [...new Set(urls.filter((u):u is string => !!u && /^https?:/.test(u)))]
}

const MAX = 512 * 1024
// ponytail: unbounded in-memory cache per origin; fine for a demo server, add an LRU if it runs long.
const cache = new Map<string, Promise<{ body:Uint8Array; type:string } | null>>()
const get = (url:string) => fetch(url, { signal:AbortSignal.timeout(5000), redirect:'follow', headers:{ 'user-agent':'Mozilla/5.0 Uxie' } })

export function fetchIcon(site:URL) {
  let p = cache.get(site.origin)
  if (!p) cache.set(site.origin, p = (async () => {
    const page = await get(site.origin).catch(() => null)
    const html = page?.ok && (page.headers.get('content-type') ?? '').includes('html') ? (await page.text()).slice(0, 300_000) : ''
    for (const u of iconCandidates(html, page?.url || site.origin)) {
      const r = await get(u).catch(() => null)
      const type = r?.headers.get('content-type')?.split(';')[0] ?? ''
      if (!r?.ok || !type.startsWith('image/')) continue
      const body = new Uint8Array(await r.arrayBuffer())
      if (body.length && body.length <= MAX) return { body, type }
    }
    return null
  })())
  return p
}
