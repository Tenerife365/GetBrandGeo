/**
 * _analysis.js
 * Shared response-analysis pipeline for the three collect-* functions
 * (collect-prompt.js, collect-claude.js, collect-chatgpt.js).
 *
 * Extracted 2026-07-09 (Master-Reasoning §8.4 / reasoning-audit-findings.md).
 * Previously this exact logic was copy-pasted into all three collectors (§2.1),
 * which had already drifted: collect-chatgpt.js split ranked-list names on
 * `[--]` (two ASCII hyphens) while the other two used `[–—]` (en/em-dash).
 * This module reconciles all three onto the en/em-dash form (the canonical
 * behaviour, used by 2 of the 3 collectors and the one LLM listicles actually
 * produce, e.g. "Brand Name — tagline"). No other behavioural change vs. the
 * prompt/claude version — this is a refactor, not a fix. The accuracy fixes
 * flagged in the audit (sentiment, mention boundaries, position, truncation)
 * land here next, in one place, each behind a unit-test fixture.
 *
 * The `_` prefix keeps Netlify from exposing this as an HTTP endpoint (§4.6),
 * same convention as `_auth.js`.
 *
 * Pure functions only — no I/O, no env, no Supabase. Safe to unit-test.
 */

// ─── Text normalisation ───────────────────────────────────────────────────────

function normalizeText(t) {
  // Strip lone surrogates before normalising — web-scraped content (especially
  // from non-UTF-8 pages that Claude's web search may include) can contain
  // \uD800–\uDFFF code units that are not valid paired surrogates.
  // String.prototype.normalize('NFC') throws a RangeError on lone surrogates,
  // which crashes the handler silently and prevents the Supabase insert.
  const safe = t.replace(/[\uD800-\uDFFF]/g, '')
  try {
    return safe
      .replace(/\s+/g, ' ')
      .normalize('NFC')
  } catch {
    return safe.replace(/\s+/g, ' ')
  }
}

// ─── Analysis helpers ─────────────────────────────────────────────────────────

function extractTopRankedResults(text) {
  const items = []
  // Also matches emoji-prefixed lines: '🥇 1. **Name**' — common in Claude web-search responses
  const listRe = /(?:^|\n)[^\d\n]{0,6}(\d+)[.)](?:\*{0,2})\s+([^\n]{2,120})/gm
  let m
  while ((m = listRe.exec(text)) !== null) {
    const pos = parseInt(m[1], 10)
    if (pos < 1 || pos > 10) continue
    let name = m[2].trim()
      .replace(/\*\*/g, '')
      .replace(/\*([^*]+)\*/g, '$1')
      .split(/\s*[–—]\s+/)[0]
      .split(/\s*:\s+/)[0]
      .split(/\s*\((?!$)/)[0]
      .replace(/[.:,;!?\s]+$/, '')
      .trim()
    if (name.length >= 2 && name.length <= 80 && !items.some(x => x.pos === pos))
      items.push({ pos, name })
  }
  return items.sort((a, b) => a.pos - b.pos).slice(0, 5)
}

function detectListPosition(text, aliases, aliasesStripped, website) {
  const listRe = /(?:^|\n)\s*(\d+)[.)]\s+(.{0,200})/g
  let m
  while ((m = listRe.exec(text)) !== null) {
    const num     = parseInt(m[1], 10)
    const segment = m[2]
    if (matchesAlias(segment, aliases, aliasesStripped, website)) return num
  }
  const sentences = text.split(/(?<=[.!?])\s+/)
  for (let i = 0; i < sentences.length; i++) {
    if (matchesAlias(sentences[i], aliases, aliasesStripped, website)) return i + 1
  }
  return null
}

/**
 * Match a text segment against brand aliases.
 * Checks both verbatim (lowercased) AND space-stripped forms so that
 * "Bucate pe Roate" matches the alias "bucateperoate" and vice-versa.
 */
function matchesAlias(segment, aliases, aliasesStripped, website) {
  const sl  = segment.toLowerCase()
  const sls = sl.replace(/[\s\-_.]/g, '')
  return aliases.some(a => sl.includes(a)) ||
         aliasesStripped.some(a => a && sls.includes(a)) ||
         (website && sl.includes(website))
}

/**
 * Reject descriptive phrases that AI engines sometimes list as numbered items
 * instead of actual company names (e.g. "Experiență Masivă", "Record De Capacitate").
 * Applied before saving competitors_mentioned so the DB stays clean.
 */
const NOT_A_COMPANY = [
  // Romanian abstract nouns — virtually never appear in real company names
  'experienta', 'experiență', 'recomandare', 'capacitate', 'planificare',
  'infrastructur', 'specializare', 'diversitate', 'acoperire', 'competitivitate',
  'masiva', 'masivă', 'proprie', 'proprii',
  // Mid-string Romanian prepositions that signal descriptive phrases
  ' pentru ', 'datorit', 'grație', 'gratie',
  // English generic terms
  'options', 'providers', 'vendors', 'services', 'alternatives', 'solutions',
  // Romanian filler list phrases
  'alte ', 'altele', 'optiuni', 'opțiuni', 'furnizori', 'companii de',
  'firme de', 'si altele', 'și altele',
]

function isCompanyName(name) {
  if (!name || name.length < 2 || name.length > 60) return false
  const lower = name.toLowerCase()
  if (NOT_A_COMPANY.some(t => lower.includes(t))) return false
  // Must contain at least one letter
  return /[a-zA-ZăâîșțÎȘȚĂÂ]/.test(name)
}

/**
 * Secondary pass: scan the full response text for known competitor names that
 * may appear in prose rather than in a numbered list.
 * e.g. "...options like Flavours Catering or Elegant Catering..."
 * Also tries a "short form" with generic catering words stripped so that
 * "Fratelli Catering" matches responses that just say "Fratelli".
 * Assigned pos=99 so they sort after numbered-list entries.
 */
const CATERING_STRIP_RE = /\b(catering|events?|restaurant|&)\b/gi

function scanForKnownCompetitors(text, knownCompetitors, aliases, aliasesStripped, website) {
  if (!Array.isArray(knownCompetitors) || knownCompetitors.length === 0) return []
  const lower = text.toLowerCase()
  const found = []
  for (const comp of knownCompetitors) {
    if (!comp || comp.length < 2) continue
    const compLower = comp.toLowerCase().trim()
    // Skip if this matches the brand itself
    if (matchesAlias(compLower, aliases, aliasesStripped, website)) continue
    // Also try short form: strip common catering words so "Fratelli Catering" → "fratelli"
    const shortForm = compLower.replace(CATERING_STRIP_RE, ' ').replace(/\s+/g, ' ').trim()
    const matched = lower.includes(compLower) ||
      (shortForm.length >= 4 && shortForm !== compLower && lower.includes(shortForm))
    if (matched) {
      found.push({ pos: 99, name: comp })
    }
  }
  return found
}

function analyseResponse(text, cfg) {
  const aliases         = (cfg.brand_aliases || []).map(a => a.toLowerCase())
  const aliasesStripped = aliases.map(a => a.replace(/[\s\-_.]/g, ''))
  const website = ((cfg.brand_website || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, ''))
  const lower      = normalizeText(text).toLowerCase()
  const lowerStrip = lower.replace(/[\s\-_.]/g, '')

  const topResults  = extractTopRankedResults(text)
  const brandInList = topResults.find(item =>
    matchesAlias(item.name, aliases, aliasesStripped, website)
  )
  const mentionedInText =
    aliases.some(a => lower.includes(a)) ||
    aliasesStripped.some(a => a && lowerStrip.includes(a)) ||
    (website && lower.includes(website))
  const mentioned = !!brandInList || mentionedInText

  let position = null
  if (brandInList)   position = brandInList.pos
  else if (mentioned) position = detectListPosition(text, aliases, aliasesStripped, website)

  const posWords = ['recomandat','recomandam','recommend','best','top','excelen','calitat',
                    'profesional','lider','prima','leading','trusted','award']
  const negWords = ['evita','avoid','problema','complaint','slab','negativ','poor','worst']
  let sentiment = 'neutral'
  if (mentioned) {
    if (posWords.some(w => lower.includes(w))) sentiment = 'positive'
    else if (negWords.some(w => lower.includes(w))) sentiment = 'negative'
  }

  let snippet = null
  if (mentioned) {
    // Try each alias verbatim first, then website domain
    const searchTerms = [...aliases, website].filter(Boolean)
    for (const a of searchTerms) {
      const idx = lower.indexOf(a)
      if (idx !== -1) { snippet = text.slice(Math.max(0, idx - 50), idx + 250).trim(); break }
    }
  }
  if (!snippet) snippet = text.slice(0, 300).trim()

  const competitors = topResults
    .filter(item => !matchesAlias(item.name, aliases, aliasesStripped, website))
    .filter(item => isCompanyName(item.name))
    .map(({ pos, name }) => ({ pos, name }))

  // Secondary pass: catch known competitors mentioned in prose (not just in lists)
  const knownScan = scanForKnownCompetitors(text, cfg.known_competitors || [], aliases, aliasesStripped, website)
  for (const kc of knownScan) {
    const already = competitors.some(c =>
      c.name.toLowerCase().includes(kc.name.toLowerCase()) ||
      kc.name.toLowerCase().includes(c.name.toLowerCase())
    )
    if (!already) competitors.push(kc)
  }

  return {
    brand_mentioned:       mentioned,
    brand_position:        position,
    sentiment,
    response_snippet:      snippet,
    competitors_mentioned: competitors.length ? JSON.stringify(competitors) : null,
  }
}

module.exports = {
  analyseResponse,
  // exported for unit testing / future accuracy fixes:
  normalizeText,
  extractTopRankedResults,
  detectListPosition,
  matchesAlias,
  isCompanyName,
  scanForKnownCompetitors,
  NOT_A_COMPANY,
}
