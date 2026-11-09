/**
 * resultsLoader.ts - the cache and load state machine behind ResultsProvider
 * (docs/arch/phase2-results-layer-spec.md section 3).
 *
 * Pure: no React, no supabase.ts. The two fetchers are injected, so node tests
 * drive it with fakes. One snapshot per (user, client) key; pages read it
 * through useResults() instead of each paging ai_results themselves.
 */
import type { Prompt } from '../types'
import type { ResultRow } from './metrics'
import { committedOk } from './resultsGuards'

export const RESULTS_MAX_AGE_MS = 60_000

export interface ResultsSnapshot {
  key: string
  clientId: number
  /** Rows of public.client_results_latest, id desc. */
  rows: ResultRow[]
  /** Every prompt of the client, position then id. */
  prompts: Prompt[]
  /** prompts with is_active, same order. */
  activePrompts: Prompt[]
  loadedAt: number
  /** Bumped on every successful apply, so consumers can memoise on it. */
  version: number
  /** True when the row read hit the paging ceiling. */
  truncated: boolean
}

export type ResultsStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ResultsState {
  snapshot: ResultsSnapshot | null
  status: ResultsStatus
  /** A quiet reload failed and the previous snapshot was kept. */
  loadError: boolean
}

export interface SnapshotFetch {
  (clientId: number): Promise<{ rows: ResultRow[]; truncated: boolean; error: unknown | null }>
}

export interface PromptsFetch {
  (clientId: number): Promise<{ data: Prompt[] | null; error: unknown | null }>
}

export interface LoadOptions {
  /** Keep the current snapshot on screen while reloading, keep it on failure. */
  quiet?: boolean
  /** Reload only the prompts list, keep the rows. */
  promptsOnly?: boolean
  /** Ignore the max-age check. */
  force?: boolean
}

export interface ResultsLoader {
  getState(): ResultsState
  subscribe(listener: () => void): () => void
  /** Register a mounted consumer. Loads only run while at least one is held. */
  retain(): () => void
  /** Ask for the snapshot of (key, clientId). Resolves when the request settled. */
  load(key: string, clientId: number, opts?: LoadOptions): Promise<void>
  /** Like load, resolves true only when the load committed without error for this key (spec 3.2). */
  loadOk(key: string, clientId: number, opts?: LoadOptions): Promise<boolean>
  /**
   * Consumer-mount revalidation (spec 3.3 item 6): with a snapshot for this
   * key, stale or dirty means a quiet full load, otherwise a quiet
   * promptsOnly load; with none, a plain non-quiet load.
   */
  revalidate(key: string, clientId: number): Promise<void>
  /** The next load for the current key ignores max-age. */
  markDirty(): void
  /** Drop everything (sign out, user change). */
  clear(): void
}

const IDLE: ResultsState = { snapshot: null, status: 'idle', loadError: false }

export function createResultsLoader(
  fetchSnapshot: SnapshotFetch,
  fetchPrompts: PromptsFetch,
  now: () => number = Date.now,
): ResultsLoader {
  let state: ResultsState = IDLE
  const listeners = new Set<() => void>()
  let interest = 0
  let seq = 0
  let dirty = false
  let inFlight: Promise<void> | null = null
  let inFlightKey: string | null = null
  let flightId = 0
  let pending: { key: string; clientId: number; opts: LoadOptions } | null = null
  let version = 0

  const emit = (next: ResultsState) => {
    state = next
    listeners.forEach(l => l())
  }

  const build = (
    key: string, clientId: number, rows: ResultRow[], prompts: Prompt[], truncated: boolean,
  ): ResultsSnapshot => ({
    key, clientId, rows, prompts,
    activePrompts: prompts.filter(p => p.is_active),
    loadedAt: now(),
    version: ++version,
    truncated,
  })

  async function run(key: string, clientId: number, opts: LoadOptions): Promise<void> {
    const mySeq = ++seq
    const prev = state.snapshot && state.snapshot.key === key ? state.snapshot : null
    const quiet = !!opts.quiet && prev !== null
    if (!quiet) emit({ snapshot: prev && opts.promptsOnly ? prev : null, status: 'loading', loadError: false })
    dirty = false
    try {
      if (opts.promptsOnly && prev) {
        const p = await fetchPrompts(clientId)
        if (mySeq !== seq) return
        if (p.error || !p.data) throw p.error ?? new Error('prompts')
        emit({ snapshot: build(key, clientId, prev.rows, p.data, prev.truncated), status: 'ready', loadError: false })
        return
      }
      const [s, p] = await Promise.all([fetchSnapshot(clientId), fetchPrompts(clientId)])
      if (mySeq !== seq) return
      if (s.error || p.error || !p.data) throw s.error ?? p.error ?? new Error('results')
      if (s.truncated) console.warn('[results] snapshot truncated at the paging ceiling for client', clientId)
      emit({ snapshot: build(key, clientId, s.rows, p.data, s.truncated), status: 'ready', loadError: false })
    } catch {
      if (mySeq !== seq) return
      if (quiet && prev) emit({ snapshot: prev, status: 'ready', loadError: true })
      else emit({ snapshot: null, status: 'error', loadError: true })
    }
  }

  function start(key: string, clientId: number, opts: LoadOptions): Promise<void> {
    const id = ++flightId
    inFlightKey = key
    const p: Promise<void> = run(key, clientId, opts).then(async () => {
      if (flightId !== id) return
      inFlight = null
      inFlightKey = null
      const next = pending
      pending = null
      if (next) await load(next.key, next.clientId, { ...next.opts, force: true })
    })
    inFlight = p
    return p
  }

  function load(key: string, clientId: number, opts: LoadOptions = {}): Promise<void> {
    if (interest === 0) { dirty = true; return Promise.resolve() }
    const snap = state.snapshot
    const sameKey = snap !== null && snap.key === key
    const fresh = sameKey && !dirty && !opts.force && !opts.promptsOnly
      && state.status === 'ready' && !state.loadError
      && now() - (snap as ResultsSnapshot).loadedAt < RESULTS_MAX_AGE_MS
    if (fresh) return Promise.resolve()
    if (inFlight) {
      if (inFlightKey !== key) {
        // A different client was asked for: the old flight is stale. run()
        // bumps seq so its response is dropped, and emits the loading state.
        pending = null
        return start(key, clientId, { ...opts, quiet: false, promptsOnly: false })
      }
      // A promptsOnly request during a full load is dropped (it reads prompts).
      if (opts.promptsOnly) return inFlight
      if (!opts.force && !dirty) return inFlight
      pending = { key, clientId, opts }
      return inFlight
    }
    return start(key, clientId, opts)
  }

  return {
    getState: () => state,
    subscribe(l) { listeners.add(l); return () => { listeners.delete(l) } },
    retain() {
      interest++
      let released = false
      return () => { if (!released) { released = true; interest = Math.max(0, interest - 1) } }
    },
    load,
    async loadOk(key, clientId, opts) {
      await load(key, clientId, opts)
      return committedOk(state, key)
    },
    revalidate(key, clientId) {
      const snap = state.snapshot
      if (!snap || snap.key !== key) return load(key, clientId)
      const stale = dirty || state.status !== 'ready' || state.loadError
        || now() - snap.loadedAt >= RESULTS_MAX_AGE_MS
      return load(key, clientId, stale ? { quiet: true, force: true } : { quiet: true, promptsOnly: true })
    },
    markDirty() { dirty = true },
    clear() {
      seq++
      flightId++
      dirty = false
      pending = null
      inFlight = null
      inFlightKey = null
      emit(IDLE)
    },
  }
}
