import { readFile } from 'node:fs/promises'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { serve } from '@hono/node-server'
import type { RunEvent } from './types.ts'
import { AVATARS } from './avatars.ts'
import { RUNS_DIR, createRun, getRun, parseRunRequest, stopRun, subscribe } from './run.ts'

const app = new Hono()
app.use(cors())

app.get('/avatars', c => c.json(AVATARS.map(({ persona, judgments, ...a }) => a)))

app.post('/runs', async c => {
  const body = await c.req.json().catch(() => null)
  try { return c.json({ runId:createRun(parseRunRequest(body)).id }) }
  catch (e) { return c.json({ error:(e as Error).message }, 400) }
})

app.get('/runs/:id', c => {
  const run = getRun(c.req.param('id'))
  return run ? c.json(run) : c.json({ error:'run not found' }, 404)
})

app.get('/runs/:id/events', c => {
  const id = c.req.param('id')
  const run = getRun(id)
  if (!run) return c.json({ error:'run not found' }, 404)
  return streamSSE(c, async stream => {
    // Snapshot and subscribe synchronously so no event falls between replay and live.
    const queue: RunEvent[] = [{ type:'run_status', status:run.status }]
    for (const a of Object.values(run.avatars)) {
      for (const step of a.steps) queue.push({ type:'step', step })
      queue.push({ type:'avatar_status', avatarId:a.avatarId, status:a.status, ...(a.reason ? { reason:a.reason } : {}) })
    }
    if (run.report) queue.push({ type:'report', report:run.report })
    let wake: (() => void) | undefined
    const unsubscribe = subscribe(id, e => { queue.push(e); wake?.() })
    stream.onAbort(() => { unsubscribe(); wake?.() })
    try {
      while (!stream.aborted) {
        const e = queue.shift()
        if (e) await stream.writeSSE({ event:e.type, data:JSON.stringify(e) })
        else await new Promise<void>(r => { wake = r })
      }
    } finally { unsubscribe() }
  })
})

app.post('/runs/:id/stop', c => {
  const id = c.req.param('id')
  if (!getRun(id)) return c.json({ error:'run not found' }, 404)
  stopRun(id)
  return c.json({ ok:true })
})

app.get('/screenshots/:runId/:file', async c => {
  const { runId, file } = c.req.param()
  if (!/^[\w-]+$/.test(runId) || !/^[\w-]+\.png$/.test(file)) return c.json({ error:'not found' }, 404)
  try { return c.body(await readFile(`${RUNS_DIR}${runId}/${file}`), 200, { 'content-type':'image/png' }) }
  catch { return c.json({ error:'not found' }, 404) }
})

const port = Number(process.env.PORT) || 4000
serve({ fetch:app.fetch, port }, () => console.log(`uxie server on http://localhost:${port}`))
