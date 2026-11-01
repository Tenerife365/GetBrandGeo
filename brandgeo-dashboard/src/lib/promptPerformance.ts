/**
 * Pure logic behind the AI Visibility prompt list: what each prompt x engine
 * cell is, how a prompt is summarised, which section it lands in, how the
 * sections are ordered, and what the headline sentence says.
 *
 * No React, no Supabase, no I/O. Everything here is a function of the rows the
 * page already loaded (one `prompts` read and one `ai_results` read), so this
 * file adds no reads, no writes and no function invocations.
 *
 * Spec: docs/design/ai-visibility-prompt-focus-spec-2026-10-28.md.
 *
 * Imports are relative and plain TypeScript on purpose, so
 * tests/prompt_performance.test.js can transpile and load this module in Node.
 */
import { isNoAnswerRow } from './aiVisibilityScore'
import {
  PROSE_POSITION_SENTINEL,
  competitorKey,
  isLikelyCompanyName,
  toDisplayName,
} from './competitorFilter'
import { ALL_ENGINES, ENGINE_UNLOCK_PLAN, PLAN_ORDER, RETIRED_ENGINES } from './planConfig'
import type { EngineId } from './planConfig'

// ── Types ─────────────────────────────────────────────────────────────────────

/** The row fields this module reads. `AIResult` satisfies it. */
export interface PerfRow {
  prompt_id: number
  llm: string
  status?: string | null
  brand_mentioned: boolean
  brand_position: number | null
  response_snippet?: string | null
  checked_at: string
  competitors_mentioned?: string | null
  error_code?: string | null
}

/** `locked` is never produced from data; it exists for the UI to render. */
export type CellState = 'mentioned' | 'absent' | 'no_answer' | 'error' | 'pending' | 'locked'

export interface CellView {
  state: CellState
  /** Rank in the engine's list when the brand was mentioned, else null. */
  position: number | null
  /** The newest row for this prompt and engine, whatever its status. */
  current: PerfRow | null
  /**
   * For an error cell: checked_at of the OLDEST row in the unbroken run of
   * error rows that starts at the newest row. That is when it stopped working,
   * not when we last tried.
   */
  errorSince: string | null
  /** For an error cell: the first ok row after that run, or null. */
  previousOk: PerfRow | null
}

export type SectionKey = 'appear' | 'notYet' | 'unchecked'

export interface PromptSummary {
  mentions: number
  /** mentioned + absent. A no-answer, error or pending cell is not an answer. */
  answered: number
  errors: number
  noAnswers: number
  pendings: number
  /** Lowest non-null brand_position over mentioned cells, else null. */
  bestPosition: number | null
  /** Newest checked_at over the current cells, null when every cell is pending. */
  lastCheckedAt: string | null
  /** Oldest errorSince over this prompt's error cells, null when none. */
  oldestErrorSince: string | null
  section: SectionKey
}

export type SortMode = 'best' | 'needs_work' | 'position' | 'recent'

export const SORT_MODES: SortMode[] = ['best', 'needs_work', 'position', 'recent']
export const DEFAULT_SORT_MODE: SortMode = 'best'

/** A bad or missing stored value means the default. */
export function parseSortMode(raw: unknown): SortMode {
  return typeof raw === 'string' && (SORT_MODES as string[]).includes(raw)
    ? (raw as SortMode)
    : DEFAULT_SORT_MODE
}

export function sortStorageKey(clientId: number | string | null | undefined): string {
  return `brandgeo_aiv_sort_${clientId ?? 'none'}`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export interface RankedEntry { pos: number; name: string }

/** Parses `competitors_mentioned` (JSON of `{pos,name}` or plain strings). */
export function parseRankedCompetitors(raw: string | null | undefined): RankedEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return []
    if (typeof parsed[0] === 'object' && parsed[0] !== null && 'pos' in parsed[0]) {
      return (parsed as RankedEntry[]).sort((a, b) => a.pos - b.pos)
    }
    return (parsed as string[]).map((name, i) => ({ pos: i + 1, name }))
  } catch {
    return []
  }
}

/** Newest first. ISO-8601 strings compare correctly; ties keep input order. */
function byCheckedDesc(a: PerfRow, b: PerfRow): number {
  const x = a.checked_at ?? ''
  const y = b.checked_at ?? ''
  return x < y ? 1 : x > y ? -1 : 0
}

function isError(row: PerfRow): boolean {
  return row.status === 'error'
}

/**
 * Given rows for ONE series (newest first), returns the unbroken error run that
 * starts at the newest row: when it began and the first ok row after it.
 */
function errorRun(newestFirst: PerfRow[]): { since: string | null; previousOk: PerfRow | null } {
  if (newestFirst.length === 0 || !isError(newestFirst[0])) return { since: null, previousOk: null }
  let since: string | null = newestFirst[0].checked_at
  let previousOk: PerfRow | null = null
  for (let i = 1; i < newestFirst.length; i++) {
    const r = newestFirst[i]
    if (isError(r)) {
      since = r.checked_at
      continue
    }
    previousOk = r
    break
  }
  return { since, previousOk }
}

// ── Cells ─────────────────────────────────────────────────────────────────────

/**
 * One CellView per prompt and active engine.
 *
 * `current` is the newest row whatever its status, which is what the user
 * should see: an engine that stopped answering last week must not keep showing
 * last month's green tick. The page's existing newest-OK `resultMap` is
 * untouched and still feeds the score, so the score does not swing in an outage.
 *
 * `promptIds`, when given, guarantees an entry (all pending) for prompts that
 * have no rows at all.
 */
export function buildCellViews(
  rows: PerfRow[],
  activeEngines: string[],
  promptIds?: number[],
): Map<number, Map<string, CellView>> {
  const active = new Set(activeEngines)
  const series = new Map<number, Map<string, PerfRow[]>>()

  const sorted = rows.slice().sort(byCheckedDesc)
  for (const r of sorted) {
    if (!active.has(r.llm)) continue
    let perPrompt = series.get(r.prompt_id)
    if (!perPrompt) { perPrompt = new Map(); series.set(r.prompt_id, perPrompt) }
    let list = perPrompt.get(r.llm)
    if (!list) { list = []; perPrompt.set(r.llm, list) }
    list.push(r)
  }

  const ids = new Set<number>(promptIds ?? [])
  series.forEach((_v, id) => ids.add(id))

  const out = new Map<number, Map<string, CellView>>()
  ids.forEach(promptId => {
    const cells = new Map<string, CellView>()
    const perPrompt = series.get(promptId)
    for (const engine of activeEngines) {
      const list = perPrompt?.get(engine)
      if (!list || list.length === 0) {
        cells.set(engine, { state: 'pending', position: null, current: null, errorSince: null, previousOk: null })
        continue
      }
      const current = list[0]
      if (isError(current)) {
        const run = errorRun(list)
        cells.set(engine, {
          state: 'error', position: null, current, errorSince: run.since, previousOk: run.previousOk,
        })
      } else if (isNoAnswerRow(current)) {
        cells.set(engine, { state: 'no_answer', position: null, current, errorSince: null, previousOk: null })
      } else if (current.brand_mentioned) {
        cells.set(engine, {
          state: 'mentioned', position: current.brand_position ?? null, current, errorSince: null, previousOk: null,
        })
      } else {
        cells.set(engine, { state: 'absent', position: null, current, errorSince: null, previousOk: null })
      }
    }
    out.set(promptId, cells)
  })
  return out
}

/**
 * Per engine, across all prompts: the oldest checked_at in the unbroken error
 * run starting at that engine's newest row. null when the newest row is ok.
 */
export function engineErrorSince(rows: PerfRow[]): Record<string, string | null> {
  const byEngine = new Map<string, PerfRow[]>()
  for (const r of rows.slice().sort(byCheckedDesc)) {
    let list = byEngine.get(r.llm)
    if (!list) { list = []; byEngine.set(r.llm, list) }
    list.push(r)
  }
  const out: Record<string, string | null> = {}
  byEngine.forEach((list, engine) => { out[engine] = errorRun(list).since })
  return out
}

// ── Summaries and sections ────────────────────────────────────────────────────

export function summarisePrompt(cells: Map<string, CellView>): PromptSummary {
  let mentions = 0, absent = 0, errors = 0, noAnswers = 0, pendings = 0
  let bestPosition: number | null = null
  let lastCheckedAt: string | null = null
  let oldestErrorSince: string | null = null

  cells.forEach(c => {
    switch (c.state) {
      case 'mentioned':
        mentions++
        if (c.position != null && (bestPosition == null || c.position < bestPosition)) bestPosition = c.position
        break
      case 'absent': absent++; break
      case 'no_answer': noAnswers++; break
      case 'error':
        errors++
        if (c.errorSince && (oldestErrorSince == null || c.errorSince < oldestErrorSince)) oldestErrorSince = c.errorSince
        break
      case 'pending': pendings++; break
      default: break
    }
    const at = c.current?.checked_at ?? null
    if (at && (lastCheckedAt == null || at > lastCheckedAt)) lastCheckedAt = at
  })

  const answered = mentions + absent
  const section: SectionKey = mentions >= 1 ? 'appear' : answered >= 1 ? 'notYet' : 'unchecked'
  return { mentions, answered, errors, noAnswers, pendings, bestPosition, lastCheckedAt, oldestErrorSince, section }
}

export interface SortablePrompt { id: number; position: number }

export interface SortedPrompts {
  /** Section render order. */
  sections: SectionKey[]
  ids: Record<SectionKey, number[]>
}

function rate(s: PromptSummary): number {
  return s.answered > 0 ? s.mentions / s.answered : 0
}

function nullLastAsc(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return a - b
}

/** Within `unchecked`: errors first (oldest failure first), then no answer, then pending. */
function uncheckedRank(s: PromptSummary): number {
  if (s.errors > 0) return 0
  if (s.noAnswers > 0) return 1
  return 2
}

export function sortPrompts(
  prompts: SortablePrompt[],
  summaries: Map<number, PromptSummary>,
  mode: SortMode,
): SortedPrompts {
  const pos = new Map(prompts.map(p => [p.id, p.position]))
  const byPosition = (a: number, b: number) => (pos.get(a) ?? 0) - (pos.get(b) ?? 0)
  const sum = (id: number) => summaries.get(id)!

  const buckets: Record<SectionKey, number[]> = { appear: [], notYet: [], unchecked: [] }
  for (const p of prompts) {
    const s = summaries.get(p.id)
    if (s) buckets[s.section].push(p.id)
  }

  const performance = (reverse: boolean) => (a: number, b: number) => {
    const sa = sum(a), sb = sum(b)
    const r = rate(sb) - rate(sa)                      // best first
    if (r !== 0) return reverse ? -r : r
    const bp = nullLastAsc(sa.bestPosition, sb.bestPosition)
    if (bp !== 0) return bp
    if (sb.answered !== sa.answered) return sb.answered - sa.answered
    return byPosition(a, b)
  }

  let cmp: (a: number, b: number) => number
  switch (mode) {
    case 'needs_work': cmp = performance(true); break
    case 'position': cmp = byPosition; break
    case 'recent':
      cmp = (a, b) => {
        const x = sum(a).lastCheckedAt, y = sum(b).lastCheckedAt
        if (x == null && y == null) return byPosition(a, b)
        if (x == null) return 1
        if (y == null) return -1
        if (x !== y) return x < y ? 1 : -1
        return byPosition(a, b)
      }
      break
    default: cmp = performance(false)
  }

  buckets.appear.sort(cmp)
  buckets.notYet.sort(cmp)
  // Whatever the sort, the unchecked section reads the same way.
  buckets.unchecked.sort((a, b) => {
    const sa = sum(a), sb = sum(b)
    const ra = uncheckedRank(sa), rb = uncheckedRank(sb)
    if (ra !== rb) return ra - rb
    if (ra === 0) {
      const x = sa.oldestErrorSince ?? '', y = sb.oldestErrorSince ?? ''
      if (x !== y) return x < y ? -1 : 1
    }
    return byPosition(a, b)
  })

  const sections: SectionKey[] = mode === 'needs_work'
    ? ['notYet', 'appear', 'unchecked']
    : ['appear', 'notYet', 'unchecked']
  return { sections, ids: buckets }
}

// ── Competitors ───────────────────────────────────────────────────────────────

export interface CompetitorFreqLike { name: string }

export interface PromptCompetitor {
  name: string
  /** Number of engines that named it. */
  k: number
  /** Lowest list position, or null when only named in prose. */
  bestRank: number | null
}

function answeredCells(cells: Map<string, CellView>): [string, CellView][] {
  const out: [string, CellView][] = []
  cells.forEach((c, engine) => {
    if (c.state === 'mentioned' || c.state === 'absent') out.push([engine, c])
  })
  return out
}

/**
 * Who the engines recommended for one prompt, from the current mentioned and
 * absent cells. Order: engines naming it desc, best rank asc (none last),
 * name asc. Maximum five.
 */
export function promptCompetitors(cells: Map<string, CellView>): PromptCompetitor[] {
  const groups = new Map<string, { name: string; engines: Set<string>; bestRank: number | null }>()
  for (const [engine, c] of answeredCells(cells)) {
    for (const e of parseRankedCompetitors(c.current?.competitors_mentioned)) {
      if (!isLikelyCompanyName(e?.name)) continue
      const key = competitorKey(e.name)
      if (!key) continue
      let g = groups.get(key)
      if (!g) { g = { name: toDisplayName(e.name), engines: new Set(), bestRank: null }; groups.set(key, g) }
      g.engines.add(engine)
      if (typeof e.pos === 'number' && e.pos < PROSE_POSITION_SENTINEL && (g.bestRank == null || e.pos < g.bestRank)) {
        g.bestRank = e.pos
      }
    }
  }
  return Array.from(groups.values())
    .map(g => ({ name: g.name, k: g.engines.size, bestRank: g.bestRank }))
    .sort((a, b) => b.k - a.k || nullLastAsc(a.bestRank, b.bestRank) || a.name.localeCompare(b.name))
    .slice(0, 5)
}

// ── Headline ──────────────────────────────────────────────────────────────────

export type HeadlineVariant = 'recommended' | 'notYet' | 'unchecked'

export interface Headline {
  variant: HeadlineVariant
  /** Prompts where the brand appears. */
  a: number
  /** Prompts with at least one real answer. */
  n: number
  /** Distinct competitors named across all current answered cells. */
  k: number
  /** Best engine, or null when none qualifies. */
  engine: EngineId | null
  /** That engine's best list position, or null. */
  pos: number | null
  /** First three names of the page's competitor frequency list. */
  chips: string[]
  /** Distinct engines with an error cell. */
  errorEngines: EngineId[]
  /** Oldest errorSince among those cells. */
  since: string | null
}

/**
 * `summaries` and `cells` cover ALL active prompts (the category filter is
 * ignored on purpose). The caller picks H3 versus H4 for the `unchecked`
 * variant from its own `collecting` flag.
 */
export function buildHeadline(
  summaries: Map<number, PromptSummary>,
  cells: Map<number, Map<string, CellView>>,
  competitorFreq: CompetitorFreqLike[],
): Headline {
  let a = 0, n = 0, notYet = 0
  summaries.forEach(s => {
    if (s.answered >= 1) n++
    if (s.section === 'appear') a++
    else if (s.section === 'notYet') notYet++
  })

  const names = new Set<string>()
  const engineStats = new Map<string, { mentioned: number; answered: number; bestPos: number | null }>()
  const errorEngineSet = new Set<string>()
  let since: string | null = null

  cells.forEach(perPrompt => {
    perPrompt.forEach((c, engine) => {
      if (c.state === 'error') {
        errorEngineSet.add(engine)
        if (c.errorSince && (since == null || c.errorSince < since)) since = c.errorSince
      }
      if (c.state !== 'mentioned' && c.state !== 'absent') return
      const st = engineStats.get(engine) ?? { mentioned: 0, answered: 0, bestPos: null }
      st.answered++
      if (c.state === 'mentioned') {
        st.mentioned++
        if (c.position != null && (st.bestPos == null || c.position < st.bestPos)) st.bestPos = c.position
      }
      engineStats.set(engine, st)
      for (const e of parseRankedCompetitors(c.current?.competitors_mentioned)) {
        if (!isLikelyCompanyName(e?.name)) continue
        const key = competitorKey(e.name)
        if (key) names.add(key)
      }
    })
  })

  // Best engine: highest mentioned/answered, engines with answered 0 excluded,
  // ties to the lowest best position (null last), then ALL_ENGINES order.
  let engine: EngineId | null = null
  let pos: number | null = null
  const order = (e: string) => {
    const i = ALL_ENGINES.indexOf(e as EngineId)
    return i < 0 ? ALL_ENGINES.length : i
  }
  const candidates = Array.from(engineStats.entries())
    .filter(([, st]) => st.answered > 0 && st.mentioned > 0)
    .sort((x, y) => {
      const rx = x[1].mentioned / x[1].answered, ry = y[1].mentioned / y[1].answered
      if (rx !== ry) return ry - rx
      const p = nullLastAsc(x[1].bestPos, y[1].bestPos)
      if (p !== 0) return p
      return order(x[0]) - order(y[0])
    })
  if (candidates.length > 0) {
    engine = candidates[0][0] as EngineId
    pos = candidates[0][1].bestPos
  }

  const variant: HeadlineVariant = a >= 1 ? 'recommended' : notYet >= 1 ? 'notYet' : 'unchecked'
  const errorEngines = ALL_ENGINES.filter(e => errorEngineSet.has(e))
  // An engine id outside ALL_ENGINES (future) still has to be named.
  errorEngineSet.forEach(e => { if (!errorEngines.includes(e as EngineId)) errorEngines.push(e as EngineId) })

  return {
    variant, a, n, k: names.size, engine, pos,
    chips: competitorFreq.slice(0, 3).map(c => c.name),
    errorEngines, since,
  }
}

// ── Locked columns ────────────────────────────────────────────────────────────

/**
 * Locked engines (not retired), cheapest unlock first, then display order.
 * The first two become columns; the rest stay in the chip strip.
 */
export function lockedCandidates(engineStates: Partial<Record<string, string>>): EngineId[] {
  const planIdx = (e: EngineId) => PLAN_ORDER.indexOf(ENGINE_UNLOCK_PLAN[e])
  return ALL_ENGINES
    .filter(e => engineStates[e] === 'locked' && !RETIRED_ENGINES.has(e))
    .sort((a, b) => planIdx(a) - planIdx(b) || ALL_ENGINES.indexOf(a) - ALL_ENGINES.indexOf(b))
}

export function pickLockedColumns(engineStates: Partial<Record<string, string>>): EngineId[] {
  return lockedCandidates(engineStates).slice(0, 2)
}
