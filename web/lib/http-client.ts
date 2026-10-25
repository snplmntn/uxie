import type { RunClient, RunEvent } from './types'

// Talks to the backend described in docs/superpowers/plans/2026-10-25-uxie-backend.md (Task 7): POST /runs, SSE /runs/:id/events.
export function createHttpClient(base: string): RunClient {
  const api = base.replace(/\/+$/, '')
  return {
    async start(req) {
      const res = await fetch(`${api}/runs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req) })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `Run failed to start (${res.status})`)
      return body as { runId: string }
    },
    events(runId, on) {
      const es = new EventSource(`${api}/runs/${runId}/events`)
      const handle = (m: MessageEvent) => {
        const e = { type: (m as MessageEvent & { type: string }).type, ...JSON.parse(m.data) } as RunEvent
        // Screenshot paths are relative to the backend.
        if (e.type === 'step' && e.step.screenshot?.startsWith('/')) e.step.screenshot = api + e.step.screenshot
        on(e)
      }
      for (const t of ['step', 'avatar_status', 'run_status', 'report']) es.addEventListener(t, handle)
      return () => es.close()
    },
    async stop(runId) { await fetch(`${api}/runs/${runId}/stop`, { method: 'POST' }) },
  }
}
