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

interface Progress {
  done: number
  total: number
  clientId: number
  clientName: string
}

interface CollectionCtx {
  collecting: boolean
  progress: Progress | null
  lastCompletedAt: number   // increments as jobs finish -- watch to reload data
  runCollection:    (clientId: number, force?: boolean, markets?: MarketSelection[], activeEngines?: EngineId[]) => Promise<void>
  runSinglePrompt:  (clientId: number, promptId: number, promptText: string, markets?: MarketSelection[], activeEngines?: EngineId[]) => Promise<void>
  stopCollection:   () => void
}

const CollectionContext = createContext<CollectionCtx>({
  collecting: false,
  progress: null,
  lastCompletedAt: 0,
  runCollection:   async () => {},
  runSinglePrompt: async () => {},
  stopCollection:  () => {},
})

const POLL_INTERVAL_MS = 4000

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [collecting, setCollecting] = useState(false)
  const [progress, setProgress]     = useState<Progress | null>(null)
  const [lastCompletedAt, setLastCompletedAt] = useState(0)
  const abortRef = useRef(false)
  // Track whether a collection is in flight (avoids stale closure on `collecting`)
  const runningRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stops the LOCAL poll / progress UI. It does NOT stop the server-side worker —
  // jobs already enqueued keep running (the whole point: the tab is just a
  // watcher). Closing the tab has the same effect.
  const stopCollection = useCallback(() => {
    abortRef.current = true
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
  }, [])

  const runCollection = useCallback(async (
    clientId: number,
    force = false,
    markets?: MarketSelection[],
    activeEngines?: EngineId[],
  ) => {
    if (runningRef.current) return
    runningRef.current = true
    abortRef.current   = false
    setCollecting(true)

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
      const resp = await fetch('/.netlify/functions/enqueue-collection', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          client_id:      clientId,
          force,
          markets,
          active_engines: activeEngines,
        }),
      }).then(r => r.json()).catch(() => null)

      // Nothing to collect (all done this month), blocked by budget, or an error —
      // no run to watch. Refresh once so any just-freed state shows, then stop.
      if (!resp || resp.skipped || !resp.run_id) {
        if (resp && resp.reason) console.log('[Collection] enqueue skipped/blocked:', resp.reason)
        setLastCompletedAt(Date.now())
        return
      }

      const runId = resp.run_id as number
      const total = (resp.total_jobs as number) ?? 0
      console.log(`[Collection] run ${runId} enqueued — ${total} jobs. Worker is running server-side; you can close this tab.`)
      setProgress({ done: 0, total, clientId, clientName })

      // 2. Poll collection_jobs for this run until every job is done/failed.
      //    Reads go through RLS (own-client / admin SELECT). Each poll bumps
      //    lastCompletedAt so the dashboard reloads incrementally as rows land.
      await new Promise<void>((resolve) => {
        const tick = async () => {
          if (abortRef.current) { resolve(); return }
          const { count } = await supabase
            .from('collection_jobs')
            .select('*', { count: 'exact', head: true })
            .eq('run_id', runId)
            .in('status', ['done', 'failed'])
          const done = count ?? 0
          setProgress({ done, total, clientId, clientName })
          setLastCompletedAt(Date.now())
          if (total > 0 && done >= total) { resolve(); return }
          pollRef.current = setTimeout(tick, POLL_INTERVAL_MS)
        }
        tick()
      })
    } finally {
      if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
      runningRef.current = false
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
  ) => {
    const engines = activeEngines ?? ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai'] as EngineId[]
    const runChatgpt    = engines.includes('chatgpt')
    const runClaude     = engines.includes('claude')
    const promptEngines = engines.filter(e => ['gemini', 'perplexity', 'meta', 'google_ai'].includes(e))
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

    try {
      const calls: Promise<any>[] = []
      if (runPrompt)   calls.push(fetch('/.netlify/functions/collect-prompt',  { method: 'POST', headers: singleAuthHeader, body: JSON.stringify(payload) }))
      if (runClaude)   calls.push(fetch('/.netlify/functions/collect-claude',   { method: 'POST', headers: singleAuthHeader, body: JSON.stringify(payload) }))
      if (runChatgpt)  calls.push(fetch('/.netlify/functions/collect-chatgpt', { method: 'POST', headers: singleAuthHeader, body: JSON.stringify(payload) }))
      await Promise.allSettled(calls)
    } catch { /* network blip -- caller handles UI reset */ }

    setLastCompletedAt(Date.now())
    setTimeout(() => setLastCompletedAt(Date.now()), 15000)
    setTimeout(() => setLastCompletedAt(Date.now()), 40000)
  }, [])

  return (
    <CollectionContext.Provider value={{ collecting, progress, lastCompletedAt, runCollection, runSinglePrompt, stopCollection }}>
      {children}
    </CollectionContext.Provider>
  )
}

export const useCollection = () => useContext(CollectionContext)
