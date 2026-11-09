/**
 * metrics.ts - the one definition of every snapshot number on the customer
 * results pages (docs/arch/phase2-results-layer-spec.md sections 1 and 4).
 *
 * Pure: no React, no supabase.ts (it reads import.meta.env, which node cannot
 * load), no browser globals. Imports are type-only from ../types plus three
 * sibling pure modules, so node tests load it through tests/helpers/ts_require.
 *
 * Population P is one usable cell (newest non-error, non-no-answer row) per
 * (active prompt, active engine). Every rate, average, sentiment score and
 * competitor count is a function of P or of P_m (the mentioned cells of P).
 * Error rows and no-answer rows never enter either (spec 1.1).
 */
import type { AIResult, LLMName, Prompt } from '../types'
import { computeAiVisibilityScore, isNoAnswerRow, type AiVisibilityDimensions } from './aiVisibilityScore'
import { aggregateCompetitors, type CompetitorAggregate } from './competitorFilter'
import { buildFixResultMap, type FixResultMap } from './fixItems'

/**
 * One row of public.client_results_latest (spec 2.3). Extends AIResult so
 * buildFixResultMap, buildCellViews, measureFix and evaluateFix accept it with
 * no cast.
 */
export interface ResultRow extends AIResult {
  status: 'ok' | 'error'
  error_code: string | null
  competitors_mentioned: string | null
  model: string | null
  is_latest: boolean
  is_usable: boolean
  is_last_nonerror: boolean
  is_newest_error: boolean
  is_run_start: boolean
  engine_error_since: string | null
}

// ── Ordering and the reference implementation of the RPC ────────────────────

/** checked_at desc (string compare, as fixItems.ts), then id desc. */
export function compareNewestFirst(
  a: { checked_at: string; id: number },
  b: { checked_at: string; id: number },
): number {
  const x = a.checked_at ?? ''
  const y = b.checked_at ?? ''
  if (x < y) return 1
  if (x > y) return -1
  return b.id - a.id
}

/**
 * Reference implementation of client_results_latest over a client's full
 * history. Used by demo mode and by the parity tests. Output order: id desc.
 * A row with no status (demo data) counts as ok.
 */
export function deriveLatestRows(rows: AIResult[]): ResultRow[] {
  type Work = {
    r: AIResult
    isErr: boolean
    isNoAns: boolean
    rnCell: number
    rnEng: number
  }
  const work: Work[] = rows.map(r => ({
    r,
    isErr: r.status === 'error',
    isNoAns: isNoAnswerRow(r),
    rnCell: 0,
    rnEng: 0,
  }))

  const byCell = new Map<string, Work[]>()
  const byEng = new Map<string, Work[]>()
  for (const w of work) {
    const ck = `${w.r.prompt_id}|${w.r.llm}`
    let c = byCell.get(ck)
    if (!c) { c = []; byCell.set(ck, c) }
    c.push(w)
    let e = byEng.get(w.r.llm)
    if (!e) { e = []; byEng.set(w.r.llm, e) }
    e.push(w)
  }

  // engine level: start of the unbroken error run at the engine's newest row
  const engSince = new Map<string, string | null>()
  byEng.forEach((list, llm) => {
    list.sort((a, b) => compareNewestFirst(a.r, b.r))
    list.forEach((w, i) => { w.rnEng = i + 1 })
    const firstNonErr = list.find(w => !w.isErr)
    const limit = firstNonErr ? firstNonErr.rnEng : list.length + 1
    let since: string | null = null
    for (const w of list) {
      if (w.rnEng < limit && (since === null || w.r.checked_at < since)) since = w.r.checked_at
    }
    engSince.set(llm, since)
  })

  const out: ResultRow[] = []
  byCell.forEach(list => {
    list.sort((a, b) => compareNewestFirst(a.r, b.r))
    list.forEach((w, i) => { w.rnCell = i + 1 })
    const n = list.length
    const kNonErr = list.find(w => !w.isErr)?.rnCell ?? null
    const kUsable = list.find(w => !w.isErr && !w.isNoAns)?.rnCell ?? null
    const kErr = list.find(w => w.isErr)?.rnCell ?? null
    const runStart = (kNonErr ?? n + 1) - 1
    for (const w of list) {
      const isLatest = w.rnCell === 1
      const isUsable = kUsable !== null && w.rnCell === kUsable
      const isLastNonErr = kNonErr !== null && w.rnCell === kNonErr
      const isNewestErr = kErr !== null && w.rnCell === kErr
      const isRunStart = w.rnCell === runStart
      if (!(isLatest || isUsable || isLastNonErr || isNewestErr || isRunStart)) continue
      const r = w.r
      out.push({
        id: r.id,
        prompt_id: r.prompt_id,
        llm: r.llm,
        status: r.status === 'error' ? 'error' : 'ok',
        error_code: r.error_code ?? null,
        brand_mentioned: r.brand_mentioned,
        brand_position: r.brand_position,
        sentiment: r.sentiment,
        response_snippet: r.response_snippet ?? null,
        competitors_mentioned: r.competitors_mentioned ?? null,
        checked_at: r.checked_at,
        model: (r as { model?: string | null }).model ?? null,
        is_latest: isLatest,
        is_usable: isUsable,
        is_last_nonerror: isLastNonErr,
        is_newest_error: isNewestErr,
        is_run_start: isRunStart,
        engine_error_since: engSince.get(r.llm) ?? null,
      })
    }
  })
  out.sort((a, b) => b.id - a.id)
  return out
}

// ── Population ──────────────────────────────────────────────────────────────

export interface Population {
  /** Active prompts, provider order. */
  promptIds: number[]
  /** Active engines, activeEngines order. */
  engineIds: string[]
  /** Usable cell per (promptId, engineId) that has one, prompt-major. */
  cells: AIResult[]
}

export interface SnapshotView {
  /** buildFixResultMap over the snapshot rows sorted compareNewestFirst. */
  results: FixResultMap
  errorEngines: Set<LLMName>
  partialErrorEngines: Set<LLMName>
  latestChecked: string | null
  population: Population
}

export function buildSnapshotView(
  rows: ResultRow[],
  activePromptIds: number[],
  activeEngines: readonly string[],
): SnapshotView {
  const sorted = rows.slice().sort(compareNewestFirst)
  const built = buildFixResultMap(sorted, activeEngines)
  const cells: AIResult[] = []
  for (const pid of activePromptIds) {
    for (const eng of activeEngines) {
      const r = built.results.get(pid)?.get(eng as LLMName)
      if (r) cells.push(r)
    }
  }
  return {
    results: built.results,
    errorEngines: built.errorEngines,
    partialErrorEngines: built.partialErrorEngines,
    latestChecked: built.latestChecked,
    population: { promptIds: activePromptIds.slice(), engineIds: activeEngines.slice(), cells },
  }
}

// ── M1, M2, M2b ─────────────────────────────────────────────────────────────

export interface RateStat { checked: number; mentioned: number; pct: number | null }

/** M1: round(100 x n(P_m) / n(P)); pct null when n(P) = 0. */
export function mentionRate(p: Population): RateStat {
  const checked = p.cells.length
  const mentioned = p.cells.filter(c => c.brand_mentioned).length
  return { checked, mentioned, pct: checked > 0 ? Math.round((100 * mentioned) / checked) : null }
}

type PosCell = { brand_mentioned: boolean; brand_position: number | null }

function positions(cells: ReadonlyArray<PosCell>): number[] {
  const out: number[] = []
  for (const c of cells) {
    if (c.brand_mentioned && c.brand_position != null) out.push(c.brand_position)
  }
  return out
}

/** M2: mean of brand_position over mentioned cells with a position, one decimal. */
export function averagePosition(cells: ReadonlyArray<PosCell>): number | null {
  const ps = positions(cells)
  if (ps.length === 0) return null
  const sum = ps.reduce((s, n) => s + n, 0)
  return Math.round((sum / ps.length) * 10) / 10
}

/** M2b: lowest brand_position over the same cells. */
export function bestPosition(cells: ReadonlyArray<PosCell>): number | null {
  const ps = positions(cells)
  return ps.length === 0 ? null : Math.min(...ps)
}

// ── M3, M3b ─────────────────────────────────────────────────────────────────

export interface SentimentSummary {
  total: number
  positive: number
  neutral: number
  negative: number
  other: number
  score: number | null
  pct: { positive: number; neutral: number; negative: number }
}

/** M3 and M3b. Pass P_m or P; it filters brand_mentioned itself. */
export function sentimentSummary(cells: ReadonlyArray<AIResult>): SentimentSummary {
  const m = cells.filter(c => c.brand_mentioned)
  const total = m.length
  let positive = 0, neutral = 0, negative = 0, other = 0
  for (const c of m) {
    if (c.sentiment === 'positive') positive++
    else if (c.sentiment === 'neutral') neutral++
    else if (c.sentiment === 'negative') negative++
    else other++
  }
  const pc = (n: number) => (total > 0 ? Math.round((100 * n) / total) : 0)
  return {
    total, positive, neutral, negative, other,
    score: total > 0 ? Math.round((100 * positive + 50 * neutral) / total) : null,
    pct: { positive: pc(positive), neutral: pc(neutral), negative: pc(negative) },
  }
}

/** Per engine, for engines with at least one mentioned cell. */
export function sentimentByEngine(p: Population): Record<string, SentimentSummary> {
  const out: Record<string, SentimentSummary> = {}
  for (const e of p.engineIds) {
    const mine = p.cells.filter(c => c.llm === e && c.brand_mentioned)
    if (mine.length > 0) out[e] = sentimentSummary(mine)
  }
  return out
}

// ── M5, M5b ─────────────────────────────────────────────────────────────────

export type EngineBand = 'KNOW' | 'PARTIAL' | 'MISSING' | 'UNAVAILABLE' | 'NOT_MEASURED'

export interface EngineRate {
  engine: string
  checked: number
  mentioned: number
  /** Unrounded fraction, null when checked = 0. */
  rate: number | null
  pct: number | null
  avgPosition: number | null
  bestPosition: number | null
  band: EngineBand
}

/** One entry per p.engineIds, in order. */
export function engineRates(p: Population, errorEngines: ReadonlySet<string>): EngineRate[] {
  return p.engineIds.map(engine => {
    const mine = p.cells.filter(c => c.llm === engine)
    const checked = mine.length
    const mentioned = mine.filter(c => c.brand_mentioned).length
    const rate = checked > 0 ? mentioned / checked : null
    const pct = rate === null ? null : Math.round(100 * rate)
    let band: EngineBand
    if (errorEngines.has(engine) && checked === 0) band = 'UNAVAILABLE'
    else if (checked === 0) band = 'NOT_MEASURED'
    else if ((pct as number) >= 50) band = 'KNOW'
    else if ((pct as number) >= 25) band = 'PARTIAL'
    else band = 'MISSING'
    return {
      engine, checked, mentioned, rate, pct,
      avgPosition: averagePosition(mine),
      bestPosition: bestPosition(mine),
      band,
    }
  })
}

// ── M4 ──────────────────────────────────────────────────────────────────────

export interface EngineCoverage {
  active: string[]
  heardFrom: string[]
  withMention: string[]
  reachPct: number | null
}

export function engineCoverage(p: Population): EngineCoverage {
  const heardFrom = p.engineIds.filter(e => p.cells.some(c => c.llm === e))
  const withMention = heardFrom.filter(e => p.cells.some(c => c.llm === e && c.brand_mentioned))
  return {
    active: p.engineIds.slice(),
    heardFrom,
    withMention,
    reachPct: heardFrom.length > 0 ? Math.round((100 * withMention.length) / heardFrom.length) : null,
  }
}

// ── M6, M6b ─────────────────────────────────────────────────────────────────

/**
 * M6 = aggregateCompetitors(P cells, limit), unchanged. `knownCompetitors` is
 * an optional pass-through of the client's seed list (clients.known_competitors).
 */
export function competitorStats(
  p: Population,
  limit: number,
  knownCompetitors?: string[],
): CompetitorAggregate[] {
  return knownCompetitors && knownCompetitors.length > 0
    ? aggregateCompetitors(p.cells, { limit, knownCompetitors })
    : aggregateCompetitors(p.cells, limit)
}

export interface EngineShareRow {
  engine: string
  brandPct: number
  competitorPct: Record<string, number>
}

/** Engines with checked = 0 are omitted. */
export function competitorEngineShare(
  p: Population,
  competitors: CompetitorAggregate[],
): EngineShareRow[] {
  const rows: EngineShareRow[] = []
  for (const e of p.engineIds) {
    const mine = p.cells.filter(c => c.llm === e)
    const checked = mine.length
    if (checked === 0) continue
    const mentioned = mine.filter(c => c.brand_mentioned).length
    const competitorPct: Record<string, number> = {}
    for (const c of competitors) {
      competitorPct[c.name] = Math.round((100 * (c.byEngine[e] ?? 0)) / checked)
    }
    rows.push({ engine: e, brandPct: Math.round((100 * mentioned) / checked), competitorPct })
  }
  return rows
}

// ── M7 ──────────────────────────────────────────────────────────────────────

export interface CategoryRate { category: string; checked: number; mentioned: number; rate: number }

/** Per prompt category over P, rate ascending. Prompts with no category are skipped. */
export function categoryRates(p: Population, prompts: ReadonlyArray<Prompt>): CategoryRate[] {
  const catOf = new Map<number, string>()
  for (const pr of prompts) if (pr.category) catOf.set(pr.id, pr.category)
  const acc = new Map<string, { checked: number; mentioned: number }>()
  for (const c of p.cells) {
    const cat = catOf.get(c.prompt_id)
    if (!cat) continue
    let a = acc.get(cat)
    if (!a) { a = { checked: 0, mentioned: 0 }; acc.set(cat, a) }
    a.checked++
    if (c.brand_mentioned) a.mentioned++
  }
  return Array.from(acc.entries())
    .map(([category, a]) => ({ category, checked: a.checked, mentioned: a.mentioned, rate: a.mentioned / a.checked }))
    .sort((x, y) => x.rate - y.rate)
}

// ── M8, M9 ──────────────────────────────────────────────────────────────────

/** M8: computeAiVisibilityScore unchanged. `results` is SnapshotView.results. */
export function visibilityScore(
  p: Population,
  results: FixResultMap,
): { dimensions: AiVisibilityDimensions; aiScore: number } {
  return computeAiVisibilityScore(p.promptIds, results, p.engineIds)
}

/** M9: any snapshot row flagged usable, any engine, any prompt. */
export function hasAnyMeasurement(rows: ReadonlyArray<ResultRow>): boolean {
  return rows.some(r => r.is_usable)
}

// ── Row scopes for the existing pure functions ──────────────────────────────

/** Active engines, ALL prompts (as AIVisibility.tsx does today). Order kept. */
export function engineLevelRows(rows: ReadonlyArray<ResultRow>, activeEngines: readonly string[]): ResultRow[] {
  const eng = new Set(activeEngines)
  return rows.filter(r => eng.has(r.llm))
}

/** Rows for buildCellViews: active engines AND active prompts. Order kept. */
export function cellViewRows(
  rows: ReadonlyArray<ResultRow>,
  activePromptIds: readonly number[],
  activeEngines: readonly string[],
): ResultRow[] {
  const eng = new Set(activeEngines)
  const pr = new Set(activePromptIds)
  return rows.filter(r => eng.has(r.llm) && pr.has(r.prompt_id))
}

// ── Engine health ───────────────────────────────────────────────────────────

export interface EngineHealth {
  lastAttemptAt: string | null
  lastAttemptFailed: boolean
  lastErrorCode: string | null
  lastOkAt: string | null
}

/** Same output as the walk at AIVisibility.tsx:533-554 over full history. */
export function engineHealth(
  rows: ReadonlyArray<ResultRow>,
  activeEngines: readonly string[],
): Map<string, EngineHealth> {
  const active = new Set(activeEngines)
  const out = new Map<string, EngineHealth>()
  const latest = rows.filter(r => r.is_latest && active.has(r.llm)).sort(compareNewestFirst)
  for (const r of latest) {
    if (out.has(r.llm)) continue
    out.set(r.llm, {
      lastAttemptAt: r.checked_at,
      lastAttemptFailed: r.status === 'error',
      lastErrorCode: r.error_code ?? null,
      lastOkAt: null,
    })
  }
  const okRows = rows.filter(r => r.is_last_nonerror && active.has(r.llm)).sort(compareNewestFirst)
  for (const r of okRows) {
    const h = out.get(r.llm)
    if (h && h.lastOkAt === null) h.lastOkAt = r.checked_at
  }
  return out
}

/**
 * engine -> engine_error_since. Replaces promptPerformance.engineErrorSince for
 * snapshot rows (that function returns a later date than the truth on a subset).
 */
export function engineErrorSinceByEngine(rows: ReadonlyArray<ResultRow>): Record<string, string | null> {
  const out: Record<string, string | null> = {}
  for (const r of rows) {
    if (!(r.llm in out)) out[r.llm] = r.engine_error_since ?? null
  }
  return out
}

/** Same output as AIVisibility.tsx:877-883 over full history (is_newest_error rows). */
export function newestErrorAtByEngine(
  rows: ReadonlyArray<ResultRow>,
  activeEngines: readonly string[],
): Record<string, string> {
  const active = new Set(activeEngines)
  const out: Record<string, string> = {}
  for (const r of rows) {
    if (!r.is_newest_error || r.status !== 'error' || !active.has(r.llm)) continue
    if (!out[r.llm] || r.checked_at > out[r.llm]) out[r.llm] = r.checked_at
  }
  return out
}

/**
 * Active engines with at least one error and no non-error row at all; count =
 * cells whose newest attempt is an error (failed prompt checks, not calls).
 */
export function engineErrorCells(
  rows: ReadonlyArray<ResultRow>,
  activeEngines: readonly string[],
): { engine: string; count: number }[] {
  const out: { engine: string; count: number }[] = []
  for (const e of activeEngines) {
    const mine = rows.filter(r => r.llm === e)
    if (mine.length === 0) continue
    if (mine.some(r => r.status !== 'error')) continue
    const count = mine.filter(r => r.is_latest && r.status === 'error').length
    if (count > 0) out.push({ engine: e, count })
  }
  return out
}

/** '#2.4', or null. One decimal everywhere a position average is printed. */
export function formatAvgPosition(n: number | null): string | null {
  return n === null || !Number.isFinite(n) ? null : `#${n.toFixed(1)}`
}
