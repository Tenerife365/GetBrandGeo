/**
 * Fix This hub: stable fix ids, the metric each fix is judged on, and the
 * re-check verdict. Pure functions only, so tests/fix_states.test.js can run
 * them without a browser or a database.
 *
 * Design: docs/arch/fix-states.md (approved 2026-11-06). Storage is
 * public.fix_states (db/supabase-fix-states-migration-2026-11-06.sql); the
 * database trigger repeats the 7-day rule below, so the two must change
 * together.
 *
 * Metric keys encode their own scope, so a done fix can still be re-checked
 * after the card that created it stops being generated (an engine that moved
 * from MISSING to PARTIAL no longer produces its MISSING card, but its
 * `rate:engine:<id>` metric is still measurable from the key alone).
 */

import { computeAiVisibilityScore } from './aiVisibilityScore'
import { competitorKey } from './competitorFilter'

export type FixStatus = 'open' | 'done' | 'verified' | 'reopened' | 'dismissed'

export interface FixStateRow {
  id?: number
  client_id: number
  fix_id: string
  status: FixStatus
  title: string | null
  metric_key: string | null
  baseline_value: number | null
  baseline_n: number | null
  marked_at: string | null
  checked_at: string | null
  check_value: number | null
  check_n: number | null
  /** client_api_keys.id when an AI agent marked this done through MCP (docs/arch/mcp-stage2-fixes.md). */
  marked_by_key?: string | null
  marked_by_grant?: string | null
}

/** A verdict waits for answers collected at least this long after marking done. */
export const VERDICT_WAIT_DAYS = 7
/** Points (on a 0 to 100 scale) the metric must rise to count as verified. */
export const IMPROVE_POINTS = 10
/** Share of the fix's cells that must carry a fresh answer before a verdict. */
export const READY_SHARE = 0.8
/** At most this many per-prompt fixes are generated at once; the next appear as these close. */
export const MAX_PROMPT_GAP_FIXES = 10

const DAY_MS = 86_400_000

// ── Ids ───────────────────────────────────────────────────────────────────────

/** Must stay inside the CHECK on fix_states.fix_id: ^[a-z_]{1,40}(:.{1,150})?$ */
function param(p: string | number): string {
  return String(p).slice(0, 150)
}

export const fixIds = {
  visibilityAll: () => 'visibility:all',
  engineMissing: (engine: string) => `engine_missing:${param(engine)}`,
  engineLow: (engine: string) => `engine_low:${param(engine)}`,
  outranked: (competitorName: string) => `outranked:${param(competitorKey(competitorName) || competitorName.toLowerCase().trim())}`,
  consistency: () => 'consistency',
  ranking: () => 'ranking',
  promptGap: (promptId: number) => `prompt_gap:${param(promptId)}`,
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export type FixScope =
  | { kind: 'all' }
  | { kind: 'engine'; engine: string }
  | { kind: 'prompt'; promptId: number }
  | { kind: 'competitor'; key: string }
  | { kind: 'dimension'; dim: 'consistency' | 'knowledge' }

export const metricKeys = {
  all: () => 'rate:all',
  engine: (engine: string) => `rate:engine:${engine}`,
  prompt: (promptId: number) => `rate:prompt:${promptId}`,
  competitor: (competitorName: string) => `rate:competitor:${competitorKey(competitorName) || competitorName.toLowerCase().trim()}`,
  consistency: () => 'dim:consistency',
  knowledge: () => 'dim:knowledge',
}

export function parseMetricKey(key: string | null | undefined): FixScope | null {
  if (!key) return null
  if (key === 'rate:all') return { kind: 'all' }
  if (key === 'dim:consistency') return { kind: 'dimension', dim: 'consistency' }
  if (key === 'dim:knowledge') return { kind: 'dimension', dim: 'knowledge' }
  if (key.startsWith('rate:engine:')) {
    const engine = key.slice('rate:engine:'.length)
    return engine ? { kind: 'engine', engine } : null
  }
  if (key.startsWith('rate:prompt:')) {
    const promptId = Number(key.slice('rate:prompt:'.length))
    return Number.isInteger(promptId) && promptId > 0 ? { kind: 'prompt', promptId } : null
  }
  if (key.startsWith('rate:competitor:')) {
    const k = key.slice('rate:competitor:'.length)
    return k ? { kind: 'competitor', key: k } : null
  }
  return null
}

/** Short words for the metric, used in "Claude 0% to 40%". */
export function metricLabel(scope: FixScope | null, engineLabel: (id: string) => string, promptText?: (id: number) => string | undefined): string {
  if (!scope) return 'Result'
  switch (scope.kind) {
    case 'all': return 'Mention rate across engines'
    case 'engine': return `${engineLabel(scope.engine)} mention rate`
    case 'prompt': {
      const t = promptText?.(scope.promptId)
      return t ? `Mention rate for "${t.length > 60 ? t.slice(0, 57) + '...' : t}"` : 'Mention rate for this prompt'
    }
    case 'competitor': return 'Your share of the answers that name you or that competitor'
    case 'dimension': return scope.dim === 'consistency' ? 'Consistency score' : 'Ranking score'
  }
}

export interface CellRow {
  brand_mentioned: boolean
  brand_position: number | null
  sentiment: string | null
  checked_at?: string | null
  competitors_mentioned?: string | null
}
export type CellMap = ReadonlyMap<number, ReadonlyMap<string, CellRow>>

function namesIn(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .map(x => (x && typeof x === 'object' ? (x as { name?: unknown }).name : x))
      .filter((n): n is string => typeof n === 'string')
      .map(n => competitorKey(n))
  } catch {
    return []
  }
}

/** The (prompt, engine) cells whose freshness decides whether a verdict can be taken. */
function coverageCells(scope: FixScope, results: CellMap, promptIds: number[], engineIds: string[]): CellRow[] {
  const out: CellRow[] = []
  const pids = scope.kind === 'prompt' ? promptIds.filter(p => p === scope.promptId) : promptIds
  const eids = scope.kind === 'engine' ? engineIds.filter(e => e === scope.engine) : engineIds
  pids.forEach(pid => eids.forEach(eid => {
    const r = results.get(pid)?.get(eid)
    if (r) out.push(r)
  }))
  return out
}

function isFresh(r: CellRow, since: number | null): boolean {
  if (since === null) return true
  if (!r.checked_at) return false
  const t = Date.parse(r.checked_at)
  return Number.isFinite(t) && t >= since
}

/**
 * One decimal, not a whole number: on a fix covering more than 200 answers a
 * single new mention is under 0.5% and would round to 0, hiding exactly the
 * "from none to some" change the verdict rule exists to catch.
 */
function rate(rows: CellRow[]): number | null {
  if (rows.length === 0) return null
  return Math.round((rows.filter(r => r.brand_mentioned).length / rows.length) * 1000) / 10
}

/**
 * The fix's own number, 0 to 100, over the cells in scope. With `sinceIso`,
 * only cells answered at or after that moment count. `n` is how many answers
 * the value rests on; `value` is null when there is nothing to measure.
 */
export function measureFix(
  scope: FixScope,
  results: CellMap,
  promptIds: number[],
  engineIds: string[],
  sinceIso: string | null = null,
): { value: number | null; n: number } {
  const since = sinceIso ? Date.parse(sinceIso) : null
  const cells = coverageCells(scope, results, promptIds, engineIds).filter(r => isFresh(r, since))

  if (scope.kind === 'competitor') {
    // Head to head: of the answers that name the brand or the rival, the share
    // that name the brand. Defined whether or not the rival is still named, so
    // the number before and after is always the same quantity. When neither is
    // named anywhere in range the brand was named in none of those answers, so
    // the share is 0 over every answer in range, not a borrowed overall rate.
    const contested = cells.filter(r => r.brand_mentioned || namesIn(r.competitors_mentioned).includes(scope.key))
    if (contested.length === 0) return { value: cells.length > 0 ? 0 : null, n: cells.length }
    return { value: rate(contested), n: contested.length }
  }

  if (scope.kind === 'dimension') {
    if (cells.length === 0) return { value: null, n: 0 }
    const filtered = new Map<number, Map<string, CellRow>>()
    promptIds.forEach(pid => {
      const m = results.get(pid)
      if (!m) return
      engineIds.forEach(eid => {
        const r = m.get(eid)
        if (r && isFresh(r, since)) {
          if (!filtered.has(pid)) filtered.set(pid, new Map())
          filtered.get(pid)!.set(eid, r)
        }
      })
    })
    const { dimensions } = computeAiVisibilityScore(promptIds, filtered, engineIds)
    return { value: dimensions[scope.dim], n: cells.length }
  }

  return { value: rate(cells), n: cells.length }
}

// ── Verdict ───────────────────────────────────────────────────────────────────

export type Evaluation =
  | { state: 'not_applicable' }
  /** The prompt or engine the fix measured is no longer tracked: nothing can ever arrive. */
  | { state: 'untracked' }
  | { state: 'waiting'; readyAfter: string; fresh: number; needed: number }
  | { state: 'verdict'; status: 'verified' | 'reopened'; value: number; n: number }

export function verdictCutoff(markedAtIso: string): string {
  return new Date(Date.parse(markedAtIso) + VERDICT_WAIT_DAYS * DAY_MS).toISOString()
}

export function isImprovement(baseline: number, now: number): boolean {
  if (baseline <= 0 && now > 0) return true
  return now >= baseline + IMPROVE_POINTS
}

/**
 * Decide a done fix. Only rows in status 'done' with a metric and a baseline
 * can be decided; everything else is not_applicable (manual fixes are final
 * when marked done).
 */
export function evaluateFix(
  row: Pick<FixStateRow, 'status' | 'metric_key' | 'baseline_value' | 'marked_at'>,
  results: CellMap,
  promptIds: number[],
  engineIds: string[],
  nowMs: number = Date.now(),
): Evaluation {
  const scope = parseMetricKey(row.metric_key)
  if (row.status !== 'done' || !scope || row.baseline_value === null || row.baseline_value === undefined || !row.marked_at) {
    return { state: 'not_applicable' }
  }
  const cutoffIso = verdictCutoff(row.marked_at)
  const cutoff = Date.parse(cutoffIso)
  const coverageScope: FixScope = scope.kind === 'competitor' || scope.kind === 'dimension' ? { kind: 'all' } : scope
  const cells = coverageCells(coverageScope, results, promptIds, engineIds)
  if (cells.length === 0) return { state: 'untracked' }
  const needed = Math.max(1, Math.ceil(cells.length * READY_SHARE))
  const fresh = nowMs < cutoff ? 0 : cells.filter(r => isFresh(r, cutoff)).length
  if (nowMs < cutoff || fresh < needed) {
    return { state: 'waiting', readyAfter: cutoffIso, fresh, needed }
  }
  const m = measureFix(scope, results, promptIds, engineIds, cutoffIso)
  if (m.value === null) return { state: 'waiting', readyAfter: cutoffIso, fresh, needed }
  return {
    state: 'verdict',
    status: isImprovement(Number(row.baseline_value), m.value) ? 'verified' : 'reopened',
    value: m.value,
    n: m.n,
  }
}

// ── Ordering for the hub ──────────────────────────────────────────────────────

const OPEN_STATES: ReadonlySet<FixStatus> = new Set(['open', 'reopened'])

/** True when a generated fix belongs in the open list given its stored state. */
export function isOpenState(status: FixStatus | undefined): boolean {
  return status === undefined || OPEN_STATES.has(status)
}
