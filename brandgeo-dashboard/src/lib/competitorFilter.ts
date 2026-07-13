/**
 * competitorFilter.ts — the ONE front-end source of truth for reading
 * `ai_results.competitors_mentioned`.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The company-name noise filter was triplicated:
 *   1. netlify/functions/_analysis.js  → isCompanyName    (authoritative, write-time)
 *   2. src/pages/Competitors.tsx       → isLikelyCompanyName
 *   3. src/pages/Recommendations.tsx   → isCompanyName     (its own third copy)
 * ...and CLAUDE.md §2.1 records that this exact pattern already caused real drift
 * once (Competitors.tsx's hardcoded ENGINE_META hex values silently diverged).
 * Recommendations.tsx was about to become a fourth copy, so instead the front-end
 * copies collapse into this module.
 *
 * TWO copies remain, not one, and that is deliberate: `_analysis.js` is CommonJS
 * under `netlify/functions/` and runs at collection time inside the Netlify bundle;
 * this module is ESM/TS and runs in the browser. Importing the former into the Vite
 * bundle would drag ~900 lines of regex across a CJS/ESM boundary that the build is
 * not set up for. The honest framing: `_analysis.js` is authoritative and filters at
 * WRITE time; this is a second line of defence at READ time, which matters because
 * a lot of rows in the database predate the §8.10/§8.11 extraction fixes and still
 * carry section headings and checklist items as "competitors". Keep GENERIC_TOKENS
 * below in sync with NOT_A_COMPANY in `_analysis.js` when that list changes.
 *
 * THE pos:99 SENTINEL
 * -------------------
 * `_analysis.js` writes `pos: 99` for a competitor found by `scanForKnownCompetitors`
 * — a name spotted in prose, never ranked in a list by any engine. Those names only
 * appear because the CLIENT PUT THEM ON THEIR OWN SEED LIST. Counting them equally
 * with genuine rankings is what put "Elegant Catering" (14 mentions, all 14 at pos:99,
 * never ranked once) at #2 on BpR's competitor board and — worse — fed it to the
 * recommendation model as a top competitor. See CLIENT-HEALTH-BPR.md §4.5 / §6.
 *
 * So: `rankedMentions` is the number that should drive any ordering or any claim that
 * a competitor is beating the client. `totalMentions` is context only.
 */

/** Sentinel _analysis.js uses for a prose/known-competitor scan hit (never ranked). */
export const PROSE_POSITION_SENTINEL = 99

/**
 * Descriptive phrases AI engines emit inside numbered lists that are not company
 * names. Mirrors NOT_A_COMPANY in netlify/functions/_analysis.js — including the
 * 'recomand' / 'sugesti' STEMS added in §8.12 (the full form 'recomandare' missed the
 * plural "Recomandări Top de Catering Impecabil", a real BpR false positive).
 */
export const GENERIC_TOKENS = [
  'experienta', 'experiență', 'recomand', 'sugesti', 'capacitate', 'planificare',
  'infrastructur', 'specializare', 'diversitate', 'acoperire', 'competitivitate',
  'masiva', 'masivă', 'proprie', 'proprii',
  ' pentru ', 'datorit', 'grație', 'gratie',
  'options', 'providers', 'vendors', 'services', 'alternatives', 'solutions',
  'alte ', 'altele', 'optiuni', 'opțiuni', 'furnizori', 'companii de',
  'firme de', 'si altele', 'și altele',
]

export function isLikelyCompanyName(name: unknown): name is string {
  if (typeof name !== 'string') return false
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 60) return false
  const lower = trimmed.toLowerCase()
  if (GENERIC_TOKENS.some(t => lower.includes(t))) return false
  return /[a-zA-ZăâîșțÎȘȚĂÂ]/.test(trimmed)
}

/** Title-case for display: "flavours catering" → "Flavours Catering". */
export function toDisplayName(name: string): string {
  return name.replace(/\b\w/g, c => c.toUpperCase())
}

export interface CompetitorAggregate {
  /** Display name, title-cased. */
  name: string
  /** Every appearance, ranked or prose-only. Context, NOT a ranking signal. */
  totalMentions: number
  /** Appearances where an engine actually ranked them in a list. The real signal. */
  rankedMentions: number
  /** True when an engine has never once ranked this name — prose/seed-list artifact. */
  proseOnly: boolean
  /** Average of genuine ranks only; the pos:99 sentinel is excluded. */
  avgPos: number | null
  byEngine: Record<string, number>
}

/** Minimal row shape this module needs — any ai_results row satisfies it. */
export interface CompetitorSourceRow {
  llm?: string | null
  competitors_mentioned?: string | null
}

/**
 * Aggregate competitors across rows.
 *
 * Ordering: genuinely-ranked first (`rankedMentions`), raw mentions only break ties.
 * A prose-only name can therefore never top the list, but it is still RETURNED and
 * flagged — it may be a real competitor the engines discuss without ranking, and
 * silently dropping it would hide signal. Callers must respect `proseOnly` and never
 * present such a name as having outranked the brand.
 *
 * IMPORTANT: pass only rows you have already filtered to `status <> 'error'`.
 * An API-failure row has no competitors and no meaning.
 */
export function aggregateCompetitors(
  rows: CompetitorSourceRow[],
  limit = 6,
): CompetitorAggregate[] {
  const map: Record<string, {
    total: number
    positions: number[]
    byEngine: Record<string, number>
  }> = {}

  for (const row of rows) {
    let comps: unknown
    try {
      comps = JSON.parse(row.competitors_mentioned || '[]')
    } catch {
      continue // malformed JSON — skip the row, not the whole page
    }
    if (!Array.isArray(comps)) continue

    for (const c of comps) {
      const rawName = typeof c === 'string' ? c : (c as { name?: unknown } | null)?.name
      if (!isLikelyCompanyName(rawName)) continue

      const pos = (c && typeof c === 'object')
        ? (c as { pos?: unknown }).pos
        : null

      const key = rawName.toLowerCase().trim()
      if (!map[key]) map[key] = { total: 0, positions: [], byEngine: {} }
      const entry = map[key]
      entry.total++
      if (typeof pos === 'number') entry.positions.push(pos)
      const engine = row.llm ?? 'unknown'
      entry.byEngine[engine] = (entry.byEngine[engine] ?? 0) + 1
    }
  }

  return Object.entries(map)
    .map(([key, v]) => {
      const ranked = v.positions.filter(p => p !== PROSE_POSITION_SENTINEL)
      return {
        name: toDisplayName(key),
        totalMentions: v.total,
        rankedMentions: ranked.length,
        proseOnly: ranked.length === 0,
        avgPos: ranked.length > 0
          ? Math.round((ranked.reduce((a, b) => a + b, 0) / ranked.length) * 10) / 10
          : null,
        byEngine: v.byEngine,
      }
    })
    .sort((a, b) =>
      (b.rankedMentions - a.rankedMentions) || (b.totalMentions - a.totalMentions))
    .slice(0, limit)
}
