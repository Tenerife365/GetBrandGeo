/**
 * collectionContext.tsx
 * Holds collection state at the App level so it survives tab navigation.
 *
 * Architecture (SCALE-SPEC.md §3 — the collection queue):
 *   - runCollection()   → ENQUEUES a run (enqueue-collection.js) and then POLLS
 *                         collection_jobs for progress. The engines run
 *                         SERVER-SIDE in collection-worker-background.js, so the
 *                         user can close the tab mid-collection and the run still
 *                         finishes. The browser is a watcher, not the runtime.
 *   - runSinglePrompt() → the manual "Refresh this prompt" button. Still calls
 *                         the 3 HTTP endpoints (collect-prompt/claude/chatgpt)
 *                         directly — a fast, immediate, single-prompt path.
 */

import { createContext, useContext, useRef, useState, useCallback } from 'react'
import { supabase } from './supabase'
import type { MarketSelection } from './marketContext'
import type { EngineId } from './planConfig'
import { COLLECT_PROMPT_ENGINES, LIVE_ENGINES } from './planConfig'

interface Progress {
  done: number
  total: number
  clientId: number
  clientName: string
}

// The enqueue endpoint (enqueue-collection.js via _enqueue.js / _auth.js) can
// decline to start a run for several reasons a customer can act on: a plan
// cooldown, a budget ceiling, or simply nothing left to collect. It always
// returns them in the response body, but until now the browser only ever
// logged that body and moved on -- a blocked click produced zero visible
// feedback. `reason` mirrors the server's own strings verbatim (see the
// switch in describeCollectionBlock, AIVisibility.tsx) plus two client-side
// fallbacks ('request_failed', 'already_running') for when the server never
// answered at all.
export interface CollectionBlockReason {
  reason: string
  message?: string
  retryAfterHours?: number
  nextAvailableAt?: string
}

export interface CollectionCallResult {
  engine: string
  ok: boolean
  status: number | null
  // The endpoint's own reported reason when ok is false: an engine error code
  // (quota_exceeded / api_error / auth_error), 'insert_error' when the row was
  // never saved, 'skipped' when the endpoint declined to run, or 'request_failed'
  // when the call never came back with a body worth reading. Undefined when ok
  // is true. All three collect endpoints answer HTTP 200 even on a real engine
  // failure, so this comes from the body, never from the status code alone.
  reason?: string
}

export interface RunCollectionResult {
  blocked: boolean
  blockReason?: CollectionBlockReason
}

export interface RunSinglePromptResult {
  ok: boolean
  calls: CollectionCallResult[]
}

interface CollectionCtx {
  collecting: boolean
  progress: Progress | null
  lastCompletedAt: number   // increments as jobs finish -- watch to reload data
  // Most recent reason a manual enqueue did NOT start a real run. Cleared the
  // instant a run actually starts. Read directly in render (not inside an
  // async handler) so callers never see a stale value from a captured
  // closure -- every button that goes through runCollection shares this one
  // piece of state, so a blocked click is never silent.
  lastBlockReason:  CollectionBlockReason | null
  // Written exactly once per run, in runCollection's finally block, from the
  // poll's own final count. The shell renders its end-of-run notice from this
  // and nothing else: inferring completion from `collecting` flipping false
  // announced "complete" for a run the server refused and for a stopped one.
  lastRunOutcome:   RunOutcome | null
  // Drops any block reason currently on screen without waiting for another
  // enqueue attempt. Needed for one case runCollection itself cannot cover:
  // switching the active client. A cooldown/budget reason belongs to the
  // client that produced it, and this context is app-level (survives tab
  // navigation), so nothing else ever un-sets it when the admin picks a
  // different client from the switcher. Called from AIVisibility's
  // client-change effect, never from inside a request path.
  clearBlockReason: () => void
  runCollection:    (clientId: number, force?: boolean, markets?: MarketSelection[], activeEngines?: EngineId[]) => Promise<RunCollectionResult>
  runSinglePrompt:  (clientId: number, promptId: number, promptText: string, markets?: MarketSelection[], activeEngines?: EngineId[]) => Promise<RunSinglePromptResult>
  stopCollection:   () => void
}

const CollectionContext = createContext<CollectionCtx>({
  collecting: false,
  progress: null,
  lastCompletedAt: 0,
  lastBlockReason: null,
  lastRunOutcome:  null,
  clearBlockReason: () => {},
  runCollection:   async () => ({ blocked: false }),
  runSinglePrompt: async () => ({ ok: true, calls: [] }),
  stopCollection:  () => {},
})

const POLL_INTERVAL_MS = 4000

export type RunOutcome = {
  outcome: 'completed' | 'stopped' | 'blocked'
  done:    number   // jobs observed done or failed when the run ended
  total:   number   // jobs enqueued; 0 for a blocked run
  at:      number   // Date.now() at the write, so two identical runs still read as two
  clientId: number  // the client the run was for, so a consumer can ignore another tenant's outcome
}

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [collecting, setCollecting] = useState(false)
  const [progress, setProgress]     = useState<Progress | null>(null)
  const [lastCompletedAt, setLastCompletedAt] = useState(0)
  const [lastBlockReason, setLastBlockReason] = useState<CollectionBlockReason | null>(null)
  const [lastRunOutcome, setLastRunOutcome] = useState<RunOutcome | null>(null)
  const abortRef = useRef(false)
  // The pending poll promise's resolver, so Stop can end the wait directly.
  const resolveRef = useRef<(() => void) | null>(null)
  // Track whether a collection is in flight (avoids stale closure on `collecting`)
  const runningRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Incremented per run. A tick whose count query was in flight when Stop
  // landed can resolve after the next run has already reset the abort flag;
  // the flag alone cannot tell that tick apart, the sequence number can.
  const runSeqRef = useRef(0)

  // Stops the LOCAL poll / progress UI. It does NOT stop the server-side worker —
  // jobs already enqueued keep running (the whole point: the tab is just a
  // watcher). Closing the tab has the same effect.
  const stopCollection = useCallback(() => {
    abortRef.current = true
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
    // The abort flag is only read at the top of a tick. If Stop lands while
    // the poll is idle between ticks (roughly three seconds in every four),
    // clearing the timeout means no tick ever runs again, the awaited promise
    // never settles, the finally never executes and `collecting` stays true
    // for the rest of the session. Resolving it here ends the wait now.
    if (resolveRef.current) { resolveRef.current(); resolveRef.current = null }
  }, [])

  const clearBlockReason = useCallback(() => {
    setLastBlockReason(null)
  }, [])

  const runCollection = useCallback(async (
    clientId: number,
    force = false,
    markets?: MarketSelection[],
    activeEngines?: EngineId[],
  ): Promise<RunCollectionResult> => {
    if (runningRef.current) {
      return { blocked: true, blockReason: { reason: 'already_running' } }
    }
    runningRef.current = true
    abortRef.current   = false
    const myRun = ++runSeqRef.current
    setCollecting(true)
    // Decided from this function's own variables, never from React state, so
    // the notice the shell shows cannot inherit a previous run's numbers.
    let outcome: Omit<RunOutcome, 'at'> | null = null
    let lastDone = 0

    try {
      // Client name (for the progress label)
      const { data: clientRow } = await supabase
        .from('clients').select('name').eq('id', clientId).single()
      const clientName = clientRow?.name ?? ''

      // Auth token for the enqueue call
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // 1. Enqueue the run — the server creates collection_jobs and kicks the worker.
      const res = await fetch('/.netlify/functions/enqueue-collection', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          client_id:      clientId,
          force,
          markets,
          active_engines: activeEngines,
        }),
      }).catch(() => null)
      const resp = res ? await res.json().catch(() => null) : null

      // Nothing to collect (all done this month), blocked by cooldown or
      // budget, or the request itself never got a usable answer (network
      // failure, a non-2xx status, or a body that would not parse). Either
      // way there is no run to watch. The reason goes into state, not just
      // the console, so the caller (AIVisibility) can actually show it.
      // Cleared below the moment a real run starts.
      if (!res || !res.ok || !resp || resp.skipped || !resp.run_id) {
        const blockReason: CollectionBlockReason = {
          reason:          resp?.reason ?? 'request_failed',
          message:         resp?.error ?? resp?.message ?? undefined,
          retryAfterHours: resp?.retry_after_hours,
          nextAvailableAt: resp?.next_available_at,
        }
        setLastBlockReason(blockReason)
        setLastCompletedAt(Date.now())
        outcome = { outcome: 'blocked', done: 0, total: 0, clientId }
        return { blocked: true, blockReason }
      }

      setLastBlockReason(null)

      const runId = resp.run_id as number
      const total = (resp.total_jobs as number) ?? 0
      console.log(`[Collection] run ${runId} enqueued, ${total} jobs. Worker is running server-side; you can close this tab.`)
      setProgress({ done: 0, total, clientId, clientName })

      // 2. Poll collection_jobs for this run until every job is done/failed.
      //    Reads go through RLS (own-client / admin SELECT). Each poll bumps
      //    lastCompletedAt so the dashboard reloads incrementally as rows land.
      await new Promise<void>((resolve) => {
        resolveRef.current = resolve
        // Bump lastCompletedAt only when the done count actually changes, not
        // on every 4s tick. Consumers (AIVisibility.tsx and others) watch this
        // as a reload trigger, so an unconditional bump replayed a full page
        // reload roughly once per tick even when nothing new had landed. The
        // finally block below still bumps it unconditionally once the run
        // ends, so every consumer sees the final state regardless.
        let prevDone = -1
        const tick = async () => {
          if (abortRef.current || runSeqRef.current !== myRun) { resolve(); return }
          const { count } = await supabase
            .from('collection_jobs')
            .select('*', { count: 'exact', head: true })
            .eq('run_id', runId)
            .in('status', ['done', 'failed'])
          // Stop may have landed while the count query was in flight, and the
          // next run may even have started since; do not write progress or
          // schedule another tick for a run that is over.
          if (abortRef.current || runSeqRef.current !== myRun) { resolve(); return }
          const done = count ?? 0
          lastDone = done
          setProgress({ done, total, clientId, clientName })
          if (done !== prevDone) {
            prevDone = done
            setLastCompletedAt(Date.now())
          }
          if (total > 0 && done >= total) { resolve(); return }
          pollRef.current = setTimeout(tick, POLL_INTERVAL_MS)
        }
        tick()
      })

      outcome = abortRef.current
        ? { outcome: 'stopped',   done: lastDone, total, clientId }
        : { outcome: 'completed', done: lastDone, total, clientId }

      return { blocked: false }
    } finally {
      if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
      resolveRef.current = null
      runningRef.current = false
      setLastRunOutcome(outcome ? { ...outcome, at: Date.now() } : null)
      setCollecting(false)
      setProgress(null)
      setLastCompletedAt(Date.now())
    }
  }, [])

  // Manual "Refresh this prompt" — unchanged: hits the 3 HTTP endpoints directly
  // for an immediate single-prompt re-collect (force). These endpoints are thin
  // wrappers over the same _collect.js the worker uses.
  const runSinglePrompt = useCallback(async (
    clientId: number,
    promptId: number,
    promptText: string,
    markets?: MarketSelection[],
    activeEngines?: EngineId[],
  ): Promise<RunSinglePromptResult> => {
    // Both lists come from planConfig, never inlined here. The inlined version
    // of promptEngines was missing grok and ai_overview, so Refresh silently did
    // nothing for them: they were absent from active_engines, collect-prompt
    // filtered them out, and no row of any kind was written. The fallback was
    // stale in the same way and omitted both plus meta.
    const engines = activeEngines ?? LIVE_ENGINES
    const runChatgpt    = engines.includes('chatgpt')
    const runClaude     = engines.includes('claude')
    const promptEngines = engines.filter(e => COLLECT_PROMPT_ENGINES.includes(e))
    const runPrompt     = promptEngines.length > 0

    const { data: clientRow } = await supabase
      .from('clients')
      .select('brand_aliases, brand_website, known_competitors')
      .eq('id', clientId)
      .single()

    const clientConfig = {
      brand_aliases:     clientRow?.brand_aliases     ?? [],
      brand_website:     clientRow?.brand_website     ?? '',
      known_competitors: clientRow?.known_competitors ?? [],
    }

    const primaryMarket = markets?.[0]
    const market_label  = primaryMarket?.market.label ?? null
    const region_label  = primaryMarket?.region.label ?? null
    const market_id     = primaryMarket?.market.id    ?? null

    const payload = {
      prompt_id:      promptId,
      prompt_text:    promptText,
      client_id:      clientId,
      client_config:  clientConfig,
      force:          true,
      market_label,
      region_label,
      market_id,
      active_engines: promptEngines,
    }

    const { data: { session: singleSession } } = await supabase.auth.getSession()
    const singleToken = singleSession?.access_token ?? ''
    const singleAuthHeader: Record<string, string> = { 'Content-Type': 'application/json' }
    if (singleToken) singleAuthHeader['Authorization'] = `Bearer ${singleToken}`

    // Named per call so a caller can tell which engine(s) actually failed,
    // not just that "something" did. This is what lets handleRefreshCell
    // in AIVisibility.tsx decide whether EVERY call was rejected versus a
    // partial success, instead of guessing from the reload that follows.
    //
    // A 200 from any of the three collect endpoints does NOT mean the engine
    // call succeeded: collect-claude.js and collect-chatgpt.js answer 200 with
    // { done: false, reason: <error_code> } on a real engine failure, and
    // 200 with { done: false, reason: 'insert_error' } when the row was never
    // saved at all. collect-prompt.js always answers 200 with
    // { done: true, summary } even when every requested engine failed, with
    // the per-engine outcome ('mentioned' / 'not_mentioned' vs. an error code
    // or a timeout string) only visible inside `summary`. So `ok` has to come
    // from the parsed body, never from the HTTP status alone.
    let calls: CollectionCallResult[] = []
    try {
      const requests: { engine: string; run: Promise<Response> }[] = []
      if (runPrompt)   requests.push({ engine: 'prompt',  run: fetch('/.netlify/functions/collect-prompt',  { method: 'POST', headers: singleAuthHeader, body: JSON.stringify(payload) }) })
      if (runClaude)   requests.push({ engine: 'claude',  run: fetch('/.netlify/functions/collect-claude',   { method: 'POST', headers: singleAuthHeader, body: JSON.stringify(payload) }) })
      if (runChatgpt)  requests.push({ engine: 'chatgpt', run: fetch('/.netlify/functions/collect-chatgpt', { method: 'POST', headers: singleAuthHeader, body: JSON.stringify(payload) }) })
      const settled = await Promise.allSettled(requests.map(r => r.run))
      calls = await Promise.all(settled.map(async (s, i): Promise<CollectionCallResult> => {
        const engine = requests[i].engine
        if (s.status !== 'fulfilled') {
          return { engine, ok: false, status: null, reason: 'request_failed' }
        }
        const res = s.value
        const responseBody = await res.json().catch(() => null)
        if (!res.ok) {
          return { engine, ok: false, status: res.status, reason: responseBody?.error ?? responseBody?.reason ?? 'http_error' }
        }
        // collect-claude / collect-chatgpt: a single-engine call, done === false
        // (or skipped === true) is the failure signal, done === true is success.
        // collect-prompt: one call can cover several fast engines, so success
        // means every engine actually asked for landed 'mentioned' or
        // 'not_mentioned' in `summary`, not an error code or a timeout string.
        let reason: string | undefined
        if (engine === 'prompt') {
          if (!responseBody || responseBody.skipped === true) {
            reason = 'skipped'
          } else if (responseBody.done !== true || !responseBody.summary) {
            reason = 'unknown_error'
          } else {
            const failingEngine = promptEngines.find(e => {
              const outcome = responseBody.summary[e]
              return outcome !== 'mentioned' && outcome !== 'not_mentioned'
            })
            reason = failingEngine ? String(responseBody.summary[failingEngine]) : undefined
          }
        } else {
          if (!responseBody) reason = 'request_failed'
          else if (responseBody.skipped === true) reason = 'skipped'
          else if (responseBody.done === false) reason = responseBody.reason ?? 'unknown_error'
          else reason = undefined
        }
        return { engine, ok: reason === undefined, status: res.status, reason }
      }))
    } catch { /* network blip -- caller handles UI reset */ }

    setLastCompletedAt(Date.now())
    setTimeout(() => setLastCompletedAt(Date.now()), 15000)
    setTimeout(() => setLastCompletedAt(Date.now()), 40000)

    // ok = at least one call actually succeeded. Zero calls made (the
    // requested engine matched none of the three collect endpoints) counts
    // as rejected too, same as every call failing outright.
    return { ok: calls.length > 0 && calls.some(c => c.ok), calls }
  }, [])

  return (
    <CollectionContext.Provider value={{ collecting, progress, lastCompletedAt, lastBlockReason, lastRunOutcome, clearBlockReason, runCollection, runSinglePrompt, stopCollection }}>
      {children}
    </CollectionContext.Provider>
  )
}

export const useCollection = () => useContext(CollectionContext)
