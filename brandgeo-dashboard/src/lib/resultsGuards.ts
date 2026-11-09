/**
 * resultsGuards.ts - the client-switch guards, as pure functions so node tests
 * can prove each one (docs/arch/phase2-results-layer-spec.md section 3.3 items
 * 4 and 5, and section 3.4). Rows or snapshots that belong to another client or
 * key are never exposed, not even for one render.
 */
import type { ResultsState } from './resultsLoader'

/**
 * The state a consumer may see for `key`. A snapshot of any other key is hidden
 * and the status reads 'loading', so the pages show their skeleton until the
 * new load lands.
 */
export function visibleSnapshot(state: ResultsState, key: string): ResultsState {
  const foreign = state.snapshot !== null && state.snapshot.key !== key
  if (!foreign) return state
  return { snapshot: null, status: 'loading', loadError: false }
}

/** True when a client-tagged state belongs to `clientId`. */
export function isOwn(state: { clientId: number }, clientId: number): boolean {
  return state.clientId === clientId
}

/** The rows of a client-tagged state, or `fallback` when they belong to another client. */
export function ownRows<R>(state: { rows: R; clientId: number }, clientId: number, fallback: R): R {
  return isOwn(state, clientId) ? state.rows : fallback
}

/** True when the loader state is a committed, error-free snapshot of `key`. */
export function committedOk(state: ResultsState, key: string): boolean {
  return state.status === 'ready' && !state.loadError && state.snapshot !== null && state.snapshot.key === key
}

/**
 * Sequencing for async page reads (phase 2 final review R1). Each read takes a
 * ticket with nextSeq() before it starts and drops its result when isStale()
 * says a newer read (or a client switch, which re-runs the read) has started.
 */
export interface SeqRef { current: number }

export function nextSeq(ref: SeqRef): number {
  ref.current += 1
  return ref.current
}

/** True when a newer read has started since ticket `mine` was taken. */
export function isStale(ref: SeqRef, mine: number): boolean {
  return mine !== ref.current
}

/**
 * A reload that resolved false is only a failure of the page on screen when the
 * client is still the one the click started on (phase 2 final review R2).
 */
export function shouldReportReloadFailure(ok: boolean, startedFor: number, currentClient: number): boolean {
  return !ok && startedFor === currentClient
}
