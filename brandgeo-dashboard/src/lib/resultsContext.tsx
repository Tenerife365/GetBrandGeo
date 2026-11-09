/**
 * resultsContext.tsx - ResultsProvider and useResults()
 * (docs/arch/phase2-results-layer-spec.md section 3).
 *
 * One snapshot per (user, client), loaded once and shared by every results
 * page. Loads only while a consumer is mounted. Depends on the server function
 * public.client_results_latest; when it is missing the load fails and
 * useResults() reports status 'error' (pages show their LoadErrorCard).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Prompt } from '../types'
import { supabase, isDemoMode } from './supabase'
import { useClient } from './clientContext'
import { useCollection } from './collectionContext'
import { useCollectionLanded } from './useCollectionLanded'
import { readAllById } from './keysetRead'
import { visibleSnapshot } from './resultsGuards'
import { deriveLatestRows, type ResultRow } from './metrics'
import {
  createResultsLoader, type ResultsLoader, type ResultsSnapshot, type ResultsState, type ResultsStatus,
} from './resultsLoader'

export interface ResultsContextValue extends ResultsState {
  reload: (opts?: { quiet?: boolean }) => Promise<boolean>
}

const IDLE_VALUE: ResultsContextValue = { snapshot: null, status: 'idle', loadError: false, reload: async () => false }
const ResultsContext = createContext<ResultsContextValue>(IDLE_VALUE)

function makeLoader(): ResultsLoader {
  return createResultsLoader(
    async cid => {
      if (isDemoMode) {
        const { mockAIResults } = await import('./mockData')
        return { rows: deriveLatestRows(mockAIResults), truncated: false, error: null }
      }
      const res = await readAllById<ResultRow>(() => supabase.rpc('client_results_latest', { p_client_id: cid }))
      return { rows: res.rows, truncated: res.truncated, error: res.error }
    },
    async cid => {
      if (isDemoMode) {
        const { mockPrompts } = await import('./mockData')
        return { data: mockPrompts as Prompt[], error: null }
      }
      const { data, error } = await supabase
        .from('prompts').select('*').eq('client_id', cid).order('position').order('id')
      return { data: (data ?? null) as Prompt[] | null, error }
    },
  )
}

export function ResultsProvider({ children }: { children: ReactNode }) {
  const { activeClientId, activeClient, loading } = useClient()
  const { lastCompletedAt } = useCollection()
  const loaderRef = useRef<ResultsLoader | null>(null)
  if (loaderRef.current === null) loaderRef.current = makeLoader()
  const loader = loaderRef.current

  const [state, setState] = useState<ResultsState>(loader.getState())
  const [userId, setUserId] = useState<string | null>(null)
  const [consumers, setConsumers] = useState(0)

  useEffect(() => loader.subscribe(() => setState(loader.getState())), [loader])

  // Session user id, so a different login never sees another's snapshot.
  useEffect(() => {
    if (isDemoMode) return
    let alive = true
    supabase.auth.getSession().then(({ data }) => { if (alive) setUserId(data.session?.user.id ?? null) })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const id = session?.user.id ?? null
      setUserId(prev => {
        if (event === 'SIGNED_OUT' || prev !== id) loader.clear()
        return id
      })
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [loader])

  const ready = isDemoMode
    ? true
    : !loading && activeClient !== null && activeClient !== undefined
      && activeClient.id === activeClientId && userId !== null
  const key = isDemoMode ? `demo:${activeClientId}` : `${userId}:${activeClientId}`

  // Interest gating: loads run only while a consumer is mounted.
  const retainFor = useCallback(() => {
    const release = loader.retain()
    setConsumers(n => n + 1)
    return () => { release(); setConsumers(n => Math.max(0, n - 1)) }
  }, [loader])

  // A consumer mounting (count going up) revalidates: a quiet full load when
  // the snapshot is stale or dirty, a quiet prompts-only load otherwise, so
  // prompts edited on /prompts show on the next results page (spec 3.3 item 6).
  const prevConsumers = useRef(0)
  useEffect(() => {
    const mounted = consumers > prevConsumers.current
    prevConsumers.current = consumers
    if (consumers === 0 || !ready) return
    if (mounted) void loader.revalidate(key, activeClientId)
    else void loader.load(key, activeClientId)
  }, [consumers, ready, key, activeClientId, loader])

  useCollectionLanded(lastCompletedAt, () => {
    loader.markDirty()
    if (consumers > 0 && ready) void loader.load(key, activeClientId, { quiet: true, force: true })
  })

  // Resolves true only when the load committed without error for this key.
  const reload = useCallback(async (opts?: { quiet?: boolean }): Promise<boolean> => {
    if (!ready) return false
    return loader.loadOk(key, activeClientId, { quiet: opts?.quiet, force: true })
  }, [loader, ready, key, activeClientId])

  // A snapshot of another key is never exposed (spec 3.3 items 4 and 5): after
  // a client switch the pages see null and 'loading' until the new load lands.
  const value = useMemo<ResultsContextValue>(() => {
    const seen = visibleSnapshot(state, key)
    return {
      snapshot: seen.snapshot,
      status: seen.status,
      loadError: seen.loadError,
      reload,
      __retain: retainFor,
    } as ResultsContextValue
  }, [state, key, reload, retainFor])
  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>
}

/**
 * The shared snapshot. Mounting a consumer registers interest, which starts
 * the load; unmounting releases it.
 */
export function useResults(): ResultsContextValue & { snapshot: ResultsSnapshot | null; status: ResultsStatus } {
  const ctx = useContext(ResultsContext) as ResultsContextValue & { __retain?: () => () => void }
  const retain = ctx.__retain
  useEffect(() => (retain ? retain() : undefined), [retain])
  return ctx
}
