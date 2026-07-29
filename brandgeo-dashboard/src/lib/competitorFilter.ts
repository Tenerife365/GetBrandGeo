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

/**
 * DECORATION STRIPPING (added 2026-07-29)
 * --------------------------------------
 * Engines decorate list entries and the decoration ends up inside the captured
 * name, so ONE company becomes several rows on the competitor board. Measured
 * across every client's stored rows, not assumed:
 *
 *   "Crowne Plaza Bucharest"          <- clean
 *   "🏨 Crowne Plaza Bucharest"        <- leading category pictograph
 *   "Crowne Plaza Bucharest ⭐⭐⭐⭐⭐"   <- trailing star rating
 *
 * That is one hotel counted three times, each at a third of its real weight, so
 * a genuine rival can rank below a name that appeared once. Medal pictographs
 * (🥇🥈🥉) and coloured dots (🔴🟢🟡) do the same to ranked lists.
 *
 * Also seen and handled: registered/trademark marks ("Denver Personal Injury
 * Lawyers®"), curly vs straight apostrophes ("Sotheby’s" / "Sotheby's"), and a
 * trailing annotation the engine appended to a real name ("Royal Catering –
 * backup / ofertă comparativă").
 *
 * Case folding was ALREADY correct here (the key has always been lowercased),
 * so "PREMIER CATERING & EVENTS" and "Premier Catering & Events" have always
 * merged. Only the decorations were splitting counts.
 */

/** Leading junk: pictographs, bullets, punctuation. Digits are kept ("1st Choice"). */
const LEADING_DECORATION_RE = /^[^\p{L}\p{N}]+/u
/** Trailing junk: star ratings, (R)/(TM), stray punctuation. */
const TRAILING_DECORATION_RE = /[^\p{L}\p{N})]+$/u
/** " – backup / ofertă comparativă" and friends. Spaced dash or pipe only, so
 *  hyphenated brands ("Coca-Cola", "Mercedes-Benz") are never truncated. */
const TRAILING_ANNOTATION_RE = /\s+[–—|]\s+.*$/u
const CURLY_APOSTROPHE_RE = /[‘’‛′]/g
const CURLY_QUOTE_RE = /[“”″]/g

/**
 * Strip decoration while PRESERVING case, so display keeps the brand's own
 * capitalisation ("ZOOMA Paradisul Verde", not "Zooma Paradisul Verde").
 */
export function cleanCompetitorName(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(CURLY_APOSTROPHE_RE, "'")
    .replace(CURLY_QUOTE_RE, '"')
    .replace(TRAILING_ANNOTATION_RE, '')
    .replace(LEADING_DECORATION_RE, '')
    .replace(TRAILING_DECORATION_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The merge key: cleaned, case-folded, and diacritic-folded.
 *
 * Diacritics are folded because Romanian has TWO codepoints that render
 * identically and are used interchangeably by different engines: s-comma
 * (U+0219, correct) and s-cedilla (U+015F, the legacy Windows-1250 form), and
 * the same pair for t. NFKC does not unify them, so "Domeniile Săftica" arrives
 * as two different strings that look the same in the dashboard and count as two
 * competitors. NFD plus combining-mark removal collapses both, and every other
 * accent with them.
 *
 * The cost is that "Muller" and "Müller" merge. That is the right trade for
 * this client base, and the display name keeps whichever spelling the engines
 * actually used, so nothing is shown wrong.
 */
export function competitorKey(raw: string): string {
  return cleanCompetitorName(raw)
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
}

/**
 * Certification bodies, standards and accreditation schemes. A caterer's ISO
 * auditor is not its rival, but engines list them in the same breath as the
 * suppliers ("choose a caterer certified by TÜV / SGS"), and the write-time
 * capture takes the whole line. `_analysis.js` gained `isCertificationName` for
 * this, but every row collected BEFORE that still carries them, and those rows
 * are what the dashboard renders today.
 *
 * SCALABILITY CAVEAT, read before extending this list. For a client who sells
 * certification, these ARE the competitors. `aggregateCompetitors` therefore
 * takes `knownCompetitors` and never filters a name the client themselves
 * seeded. No caller passes it yet because `known_competitors` is not in
 * clientContext's CLIENT_SELECT; wire it there before onboarding a compliance
 * or testing-industry tenant.
 */
const CERTIFICATION_BODIES = [
  'tuv', 'tüv', 'sgs', 'bureau veritas', 'dekra', 'intertek', 'aenor', 'afnor',
  'renar', 'rina', 'eurofins', 'ukas', 'dnv', "lloyd's register", 'nsf international',
]
const CERTIFICATION_PHRASES = [
  'certification', 'certificare', 'acreditare', 'accreditation', 'notified body',
  'organism de certificare',
]
/** "ISO 22000", "FSSC 22000", "IFS Food 8" — scheme token plus a code. */
const STANDARD_SCHEME_RE = /^(iso|en|sr|fssc|ifs|brc|gmp|gfsi)\b.*\d/
const BARE_STANDARD = new Set(['haccp', 'brc', 'gfsi', 'ifs food'])

export function isNonCompetitorEntity(name: string): boolean {
  const lower = competitorKey(name)
  if (!lower) return false
  if (BARE_STANDARD.has(lower)) return true
  if (STANDARD_SCHEME_RE.test(lower)) return true
  if (CERTIFICATION_PHRASES.some(p => lower.includes(p))) return true
  // Word-boundary match so "SGS" does not fire inside an unrelated word.
  return CERTIFICATION_BODIES.some(b =>
    new RegExp(`(^|[^\\p{L}])${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(lower))
}

export function isLikelyCompanyName(name: unknown): name is string {
  if (typeof name !== 'string') return false
  const trimmed = cleanCompetitorName(name)
  if (trimmed.length < 2 || trimmed.length > 60) return false
  const lower = trimmed.toLowerCase()
  if (GENERIC_TOKENS.some(t => lower.includes(t))) return false
  if (!/[a-zA-ZăâîșțÎȘȚĂÂ]/.test(trimmed)) return false
  // A money range is not a company. "100k–£5m" survived every rule above
  // because 'k' and 'm' are letters. Real names stay: "3M" is 1 and 1, not
  // more digits than letters; "7-Eleven" is 1 and 6.
  const digits = (trimmed.match(/\p{N}/gu) ?? []).length
  const letters = (trimmed.match(/\p{L}/gu) ?? []).length
  if (digits > letters) return false
  return true
}

/**
 * Title-case for display: "flavours catering" → "Flavours Catering".
 *
 * NO LONGER USED BY `aggregateCompetitors`, which now carries the brand's own
 * capitalisation through instead. Title-casing destroyed real casing ("ZOOMA"
 * became "Zooma") and mangled possessives, because \b puts a word boundary
 * after an apostrophe: "sotheby's" came out as "Sotheby'S". Kept as an export
 * for any caller that wants it on an already-lowercased string.
 */
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
  /**
   * Every recorded position, INCLUDING the pos:99 prose sentinel — the raw
   * distribution, not the avgPos summary. Most callers want avgPos/rankedMentions
   * instead; kept for parity with what Competitors.tsx tracked before it adopted
   * this module (2026-07-13, CLAUDE.md §14.2).
   */
  positions: number[]
  /**
   * Every prompt_id a row mentioning this competitor came from, deduplicated —
   * lets a caller show a sample prompt for a competitor. Only populated when the
   * source rows carry `prompt_id` (see CompetitorSourceRow below); empty otherwise.
   */
  promptIds: number[]
}

/** Minimal row shape this module needs — any ai_results row satisfies it. */
export interface CompetitorSourceRow {
  llm?: string | null
  competitors_mentioned?: string | null
  /** Optional — only needed by callers that want `promptIds` back (Competitors.tsx). */
  prompt_id?: number | null
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
export interface AggregateOptions {
  limit?: number
  /**
   * The client's own seed list (`clients.known_competitors`). Any name on it is
   * exempt from `isNonCompetitorEntity`, so a certification or testing business
   * can still see its real rivals. See the caveat on CERTIFICATION_BODIES.
   */
  knownCompetitors?: string[]
}

export function aggregateCompetitors(
  rows: CompetitorSourceRow[],
  limitOrOptions: number | AggregateOptions = 6,
): CompetitorAggregate[] {
  const opts: AggregateOptions = typeof limitOrOptions === 'number'
    ? { limit: limitOrOptions }
    : limitOrOptions
  const limit = opts.limit ?? 6
  const seeded = new Set((opts.knownCompetitors ?? []).map(competitorKey))

  const map: Record<string, {
    total: number
    positions: number[]
    byEngine: Record<string, number>
    promptIds: Set<number>
    /** Cleaned original spellings and how often each was seen, for display. */
    displayForms: Map<string, number>
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

      const key = competitorKey(rawName)
      if (!key) continue
      // An auditor is not a rival, unless this client says it is.
      if (!seeded.has(key) && isNonCompetitorEntity(rawName)) continue

      const pos = (c && typeof c === 'object')
        ? (c as { pos?: unknown }).pos
        : null

      if (!map[key]) {
        map[key] = {
          total: 0, positions: [], byEngine: {},
          promptIds: new Set(), displayForms: new Map(),
        }
      }
      const entry = map[key]
      entry.total++
      const display = cleanCompetitorName(rawName)
      entry.displayForms.set(display, (entry.displayForms.get(display) ?? 0) + 1)
      if (typeof pos === 'number') entry.positions.push(pos)
      const engine = row.llm ?? 'unknown'
      entry.byEngine[engine] = (entry.byEngine[engine] ?? 0) + 1
      if (typeof row.prompt_id === 'number') entry.promptIds.add(row.prompt_id)
    }
  }

  return Object.entries(map)
    .map(([key, v]) => {
      const ranked = v.positions.filter(p => p !== PROSE_POSITION_SENTINEL)
      return {
        name: pickDisplayForm(v.displayForms, key),
        totalMentions: v.total,
        rankedMentions: ranked.length,
        proseOnly: ranked.length === 0,
        avgPos: ranked.length > 0
          ? Math.round((ranked.reduce((a, b) => a + b, 0) / ranked.length) * 10) / 10
          : null,
        byEngine: v.byEngine,
        positions: v.positions,
        promptIds: Array.from(v.promptIds),
      }
    })
    .sort((a, b) =>
      (b.rankedMentions - a.rankedMentions) || (b.totalMentions - a.totalMentions))
    .slice(0, limit)
}

/**
 * The spelling the engines used most often wins, so the board shows the brand's
 * real capitalisation.
 *
 * Ties break, in order, on: more diacritics, then more lowercase, then
 * alphabetically. Diacritics come first because "Domeniile Săftica" is the
 * company's actual name and "Domeniile Saftica" is an engine dropping accents;
 * showing a Romanian client a stripped version of their rival's name reads as a
 * bug in our product. Lowercase-count then prefers ordinary "Premier Catering &
 * Events" over shouted "PREMIER CATERING & EVENTS". The final alphabetical
 * comparison guarantees the output is stable across renders no matter what
 * order the rows arrived in.
 */
function pickDisplayForm(forms: Map<string, number>, fallback: string): string {
  const diacritics = (s: string) =>
    (s.normalize('NFD').match(/\p{M}/gu) ?? []).length
  const lowercase = (s: string) => (s.match(/\p{Ll}/gu) ?? []).length
  const better = (a: string, b: string): boolean => {
    if (diacritics(a) !== diacritics(b)) return diacritics(a) > diacritics(b)
    if (lowercase(a) !== lowercase(b)) return lowercase(a) > lowercase(b)
    return a < b
  }

  let best = ''
  let bestCount = -1
  for (const [form, count] of forms) {
    if (count > bestCount || (count === bestCount && better(form, best))) {
      best = form
      bestCount = count
    }
  }
  return best || toDisplayName(fallback)
}
