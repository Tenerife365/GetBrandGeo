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

// Clean a raw captured name fragment (from a numbered line, a bold span, or a
// bullet) into a bare brand name: drop markdown bold/italic markers, strip any
// leading emoji / medal / bullet residue (🥇, 🌟, •, "-"), and cut off a trailing
// "— tagline" / ": description" / "(note)" descriptor. Splitting descriptors on
// en/em-dash only (not ASCII hyphen) is deliberate — matches the canonical
// behaviour reconciled during the §2.1 extraction (see file header).
function cleanCandidateName(raw) {
  return String(raw).trim()
    .replace(/\*\*/g, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[^\p{L}\p{N}]+/u, '')       // strip leading emoji / medal / bullet residue
    .split(/\s*[–—]\s+/)[0]
    .split(/\s*:\s+/)[0]
    .split(/\s*\((?!$)/)[0]
    .replace(/[.:,;!?\s]+$/, '')
    .trim()
}

// Field-label detection (London run 2026-07-10, §8.11 round 3). In "how to
// choose / key factors / next steps" sections, engines bold criterion labels
// with the colon INSIDE the bold span — "**Best for:**", "**Pricing:**",
// "**Research:**", "**Expertise and Specialisation:**" — then a description. The
// name cleaner strips the colon and the label sailed through as a fake competitor.
// Real company entries never carry the colon inside their bold name (they get a
// "— tagline", an italic subtitle, or a bare newline), so a bold span ending in
// a colon is a clean, structural field-label signal.
function isBoldColonLabel(raw) {
  return /\*\*\s*[^*\n]{1,60}:\s*\*\*/.test(String(raw))
}

// Rank-prefix stripping (CLIENT-HEALTH-BPR.md §4.2, BpR rows 1586 vs 1592/1581).
// Engines write a ranked brand as a markdown heading with a medal emoji:
//   "## 🥇 1. **Bucate pe Roate**"   →  H2, matched
//   "### 🥇 1. **Bucate pe Roate**"  →  H3, did NOT match
// The old fixed budget of [^\d\n]{0,6} before the rank digit counted UTF-16 units:
// "## 🥇 " is exactly 6 (##, space, 🥇 = 2 units, space) and squeaked through, while
// "### 🥇 " is 7 and silently failed — so the SAME #1 recommendation scored
// brand_position=1 under an H2 and null under an H3. Widening the budget would just
// move the cliff; instead strip the heading marker and any emoji/symbol run that sits
// between the line start and the rank, so rank matching sees a bare "1. …".
// The lookahead means lines with no rank are left completely untouched.
function stripRankPrefixes(text) {
  return String(text).replace(/^[ \t]*(?:#{1,6}[ \t]*)?[^\p{L}\p{N}\n]*(?=\d+[.)])/gmu, '')
}

function extractTopRankedResults(text) {
  const items = []
  const listRe = /(?:^|\n)(\d+)[.)](?:\*{0,2})\s+([^\n]{2,120})/gm
  let m
  const src = stripRankPrefixes(text)
  while ((m = listRe.exec(src)) !== null) {
    const pos = parseInt(m[1], 10)
    if (pos < 1 || pos > 10) continue
    if (isBoldColonLabel(m[2])) continue   // "2. **Research:** Use…" is a field label, not a firm
    const name = cleanCandidateName(m[2])
    if (name.length >= 2 && name.length <= 80 && !items.some(x => x.pos === pos))
      items.push({ pos, name })
  }
  return items.sort((a, b) => a.pos - b.pos).slice(0, 5)
}

// ─── Prose / bullet competitor extraction (London run 2026-07-10) ─────────────
// extractTopRankedResults only sees "1." numbered lists. Gemini and Perplexity
// answer with bold names inline in prose ("include **Leigh Day**, **Thompsons**")
// and "* " bullet lists ("*   **Asana**"), so they extracted ZERO competitors
// despite naming real firms. This pass captures bold spans and bullet-leading
// names, in first-appearance order, filtered HARD because bold marks emphasis of
// every kind ("an employer", "best", "Band 2", "Short answer") — not only names.
// Two gates: looksLikeBrandName (Title-Cased, no slash, not a "Band 2" rank label)
// then the shared isCompanyName (rejects instruction steps / metric headings).
const NAME_CONNECTORS = new Set([
  'and', 'of', 'the', 'for', '&', 'de', 'la', 'di', 'von', 'van', 'à', 'y', 'e',
  'del', 'della', 'du', 'des', 'le',
])
// Ranking/label phrases AI engines bold as emphasis ("Band 2", "Tier 1").
const RANK_LABEL_RE = /^(band|tier|level|rank|group|phase|step|part|section|figure|table|chapter|no|note|option|round|point)\s*\d+$/i

function looksLikeBrandName(name) {
  if (/[\/\\|]/.test(name)) return false          // "employee/claimant", "Top-Tier / Magic"
  if (RANK_LABEL_RE.test(name)) return false       // "Band 2", "Tier 1"
  const words = name.trim().split(/\s+/)
  let significant = 0, capped = 0
  for (const w of words) {
    const clean = w.replace(/[^\p{L}\p{N}.]/gu, '')
    if (!clean) continue
    if (NAME_CONNECTORS.has(clean.toLowerCase())) continue
    significant++
    // A significant word must start uppercase / with a digit, or be a lowercase
    // domain token ("monday.com"). This is what separates "Leigh Day" / "Capsule
    // CRM" from emphasis like "an employer" / "Short answer".
    if (/^[\p{Lu}\p{N}]/u.test(clean) || /^[\p{L}]+\.[\p{L}]/u.test(clean)) capped++
  }
  return significant > 0 && capped === significant
}

// Bold section headings that engines (esp. Gemini) emit above their firm lists —
// "For Employer Representation", "First Tier Firms", "Other Highly-Ranked Firms".
// They're Title-Cased so looksLikeBrandName + isCompanyName pass them, but a
// trailing plural CATEGORY noun ("… Firms/Options/Tools") or a leading section
// word ("For …", "Other …") is a strong header signal. Kept deliberately narrow:
// tail nouns exclude real firm suffixes like "Solicitors"/"Lawyers"/"Systems";
// lead words exclude ordinals/superlatives ("First"/"Best"/"Top") so real brands
// like "First Direct" / "Best Buy" survive. Only used in the bold/bullet path.
const CATEGORY_TAIL_NOUNS = new Set([
  'firms', 'companies', 'options', 'providers', 'vendors', 'solutions',
  'services', 'tools', 'apps', 'platforms', 'brands', 'picks', 'choices',
  'recommendations', 'players', 'contenders', 'alternatives', 'agencies',
  'consultancies', 'specialists', 'names',
])
const HEADING_LEAD_WORDS = new Set([
  'for', 'other', 'additional', 'more', 'notable', 'further', 'several', 'various',
])
function looksLikeSectionHeading(name) {
  const words = name.trim().split(/\s+/)
  if (words.length < 2) return false
  const first = words[0].toLowerCase().replace(/[^\p{L}]/gu, '')
  const last = words[words.length - 1].toLowerCase().replace(/[^\p{L}]/gu, '')
  return CATEGORY_TAIL_NOUNS.has(last) || HEADING_LEAD_WORDS.has(first)
}

function extractBoldAndBulletNames(text) {
  const raw = []
  const boldRe = /\*\*([^*\n]{2,80})\*\*/g
  let m
  while ((m = boldRe.exec(text)) !== null) raw.push(m[1])
  // Bullet-leading names: "- Name", "* Name", "•  Name" (name may itself be **bold**).
  const bulletRe = /(?:^|\n)[ \t]*[-*•][ \t]+([^\n]{2,120})/g
  while ((m = bulletRe.exec(text)) !== null) raw.push(m[1])
  const out = []
  const seen = new Set()
  for (const r of raw) {
    // Colon-terminated field label ("**Best for:**", inner "Best for:") — a
    // criterion/field header, not a company (§8.11 round 3).
    if (/:\s*$/.test(r) || /:\s*\*\*/.test(r)) continue
    const name = cleanCandidateName(r)
    if (name.length < 2 || name.length > 60) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    if (looksLikeSectionHeading(name)) continue
    if (!looksLikeBrandName(name)) continue
    if (!isCompanyName(name)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}

function detectListPosition(text, matchers) {
  // Genuine numbered-list rank ONLY. Prose mentions return null — previously
  // this fell back to the *sentence index* (i+1), which landed in the same
  // brand_position column and got averaged with real list ranks into avgPos
  // (finding 1.2: two different units in one field). "Mentioned in prose but
  // not ranked" is legitimately position=null, not "ranked #9".
  // The 1..50 guard rejects a year/price/absurd number that happens to lead a
  // line (e.g. "2019. Brand expanded…") from being read as a rank.
  // Runs on the rank-prefix-stripped text (§4.2): the old \s* prefix could not skip
  // a markdown heading marker, so "### 🥇 1. **Brand**" never matched here either.
  const listRe = /(?:^|\n)\s*(\d+)[.)]\s+(.{0,200})/g
  let m
  const src = stripRankPrefixes(text)
  while ((m = listRe.exec(src)) !== null) {
    const num = parseInt(m[1], 10)
    if (num < 1 || num > 50) continue
    if (matchesAlias(m[2], matchers)) return num
  }
  return null
}

// ─── Brand mention matching (finding 1.3) ────────────────────────────────────
// Mention detection used to be raw substring `includes()` plus a space-stripped
// pass, so a short alias like "bpr" could match INSIDE an unrelated word
// ("subprocess") and silently inflate the flagship mention rate. Instead we
// build, per alias/phrase, a boundary-anchored regex whose words may be
// separated OR smushed:
//   "brand geo" → matches "brand geo", "brandgeo", "brand-geo"
//   but NOT inside a larger word ("rebrandgeography" won't match).
// Boundaries use Unicode letter/number classes so Romanian diacritics count as
// letters. This kills the false positives while keeping the smushed-form matches
// the old stripped pass existed to catch.
// KNOWN GAP (not fixed here, separate from 1.3's false-positive focus): matching
// is diacritic-sensitive, so an ASCII alias ("paunescu si asociatii") still won't
// match diacritic text ("Păunescu și Asociații") — a false-NEGATIVE worth a later
// diacritic-folding pass.

function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

// Boundary-anchored, separator-flexible matcher for one alias/phrase.
function buildAliasRegex(alias) {
  const parts = String(alias).trim().toLowerCase().split(/[\s\-_.]+/).filter(Boolean).map(escapeRe)
  if (!parts.length) return null
  try {
    return new RegExp(`(?<![\\p{L}\\p{N}])${parts.join('[\\s_.-]*')}(?![\\p{L}\\p{N}])`, 'iu')
  } catch { return null }
}

// Precompute the brand's matchers (all aliases + the bare website domain) once
// per analyse call, then reuse across every segment/list-item test.
function buildBrandMatchers(cfg) {
  const website = ((cfg.brand_website || '').toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^\//, '').replace(/\/.*$/, '').replace(/^www\./, ''))
  const terms = [...(cfg.brand_aliases || [])]
  if (website) terms.push(website)
  return terms.map(buildAliasRegex).filter(Boolean)
}

// True if `text` mentions the brand as a bounded token/phrase.
function matchesAlias(text, matchers) {
  const t = String(text)
  return matchers.some(re => re.test(t))
}

/**
 * Return only the sentence(s) / list-item(s) that actually mention the brand,
 * joined + normalised + lowercased. Used to scope sentiment to the brand's own
 * context instead of the whole response (audit finding 1.1): a "best X" listicle
 * contains 'best'/'top'/'recommend' no matter what it says about *this* brand, so
 * scanning the full text scored almost everything positive.
 *
 * Split at sentence boundaries AND newlines (list items are newline-separated,
 * prose is sentence-separated), keep the segments matching the brand, and return
 * them. Splitting must happen on the raw text before normalizeText() collapses
 * newlines. Returns '' if no segment matches (caller falls back to neutral).
 *
 * HEADING EXTENSION (CLIENT-HEALTH-BPR.md §4.3, BpR rows 1586 vs 1592): when an
 * engine names the brand in a markdown HEADING and puts the verdict in the body
 * sentence beneath it, the verdict was excluded and the mention scored neutral —
 * while an otherwise-identical answer that happened to tuck "(Recomandat #1)"
 * inside the heading line itself scored positive. Same praise, different markdown,
 * opposite sentiment. So when a brand-matching segment is a heading, also pull in
 * the first body segment under it (stopping at the next heading), which is the
 * sentence that actually carries the verdict.
 */
function isHeadingSegment(s) { return /^\s*#{1,6}\s/.test(String(s)) }

// NOTE: heading detection must happen at LINE level, before sentence-splitting.
// The old splitter also split on `(?<=[.!?])\s+`, and a ranked heading contains its
// own period — "### 🥇 1. **Bucate pe Roate**" was cut into "### 🥇 1." and
// "**Bucate pe Roate** …". The brand then sat in a fragment that no longer looked
// like a heading (and no longer carried the 🥇), which is precisely why row 1586
// scored neutral while row 1592 — whose praise happened to land inside the same
// fragment as the brand — scored positive.
function extractBrandContext(text, matchers) {
  const lines = String(text).split(/\n/)
  const hits = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    if (isHeadingSegment(line)) {
      // A heading that names the brand: take the whole heading line, plus the first
      // body line beneath it — that is the sentence carrying the actual verdict.
      if (!matchesAlias(line, matchers)) continue
      hits.push(line)
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j]
        if (!next || !next.trim()) continue
        if (isHeadingSegment(next)) break        // next heading → this body ended
        hits.push(next)
        break
      }
      continue
    }

    // Ordinary line: sentence-split and keep only the brand's own sentence(s).
    for (const s of line.split(/(?<=[.!?])\s+/)) {
      if (matchesAlias(s, matchers)) hits.push(s)
    }
  }
  return hits.length ? normalizeText(hits.join(' ')).toLowerCase() : ''
}

/**
 * Reject descriptive phrases that AI engines sometimes list as numbered items
 * instead of actual company names (e.g. "Experiență Masivă", "Record De Capacitate").
 * Applied before saving competitors_mentioned so the DB stays clean.
 *
 * NOTE (2026-07-09): this substring list was tuned for BpR's original catering
 * use case (§1.4/§2.4) and does NOT generalise. Live-testing the Instant Audit
 * Engine (§10.4) showed generic "how to measure/improve X" prompts make engines
 * answer with numbered *instruction steps* and *metric headings* — not company
 * names — which sailed through this filter and got misreported as competitors on
 * both ai_results.competitors_mentioned and prospect_audits.competitor_flags.
 * Real captured false positives: "AI Visibility Score", "Brand Visibility Score",
 * "Define the AI surfaces you care about", "Establish a Fixed Prompt Panel",
 * "Structure Content for AI Extraction". The structural signals below
 * (isCompanyName) generalise across domains/languages so the fix is not another
 * client-specific patch.
 */
const NOT_A_COMPANY = [
  // Romanian abstract nouns — virtually never appear in real company names.
  // 'recomand' is a STEM (was the full form 'recomandare', which missed the plural):
  // BpR row 1588 captured the section heading "Recomandări Top de Catering Impecabil"
  // as a competitor — it has no leading imperative verb and every significant word is
  // Title-Cased ('de' is a name connector), so none of the §8.11 round-3 structural
  // rules fire on it. The stem covers recomandare/recomandări/recomandat/recomandarea.
  // 'sugesti' likewise covers sugestie/sugestii ("Sugestii de Pregătire și Costuri").
  // No real company name contains either stem.
  'experienta', 'experiență', 'recomand', 'sugesti', 'capacitate', 'planificare',
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

// Leading imperative/instructional verbs (English + common Romanian stems).
// AI engines answering generic "how to measure/improve X" prompts return numbered
// lists of STEPS ("Define …", "Establish …", "Structure …") that read as
// instructions, not company names. A leading imperative verb is a strong
// instruction signal — real brand names almost never begin with one. We only
// reject when the phrase ALSO looks clause-shaped (see isCompanyName), so genuine
// verb-led brands ("Focus Features", "Boost Mobile", "Design Within Reach") are
// preserved. Partial coverage: non-EN/RO how-to lists remain a gap (same honesty
// caveat as the sentiment lexicon, finding 1.1b).
const INSTRUCTION_VERBS = new Set([
  'define', 'establish', 'structure', 'create', 'build', 'optimize', 'optimise',
  'monitor', 'track', 'measure', 'identify', 'ensure', 'understand', 'improve',
  'increase', 'use', 'leverage', 'choose', 'add', 'implement', 'consider', 'set',
  'make', 'get', 'start', 'develop', 'maintain', 'provide', 'include', 'avoid',
  'check', 'review', 'update', 'publish', 'write', 'design', 'test', 'run', 'keep',
  'find', 'learn', 'know', 'grow', 'boost', 'enhance', 'align', 'map', 'audit',
  'claim', 'verify', 'register', 'submit', 'prioritize', 'prioritise', 'target',
  'engage', 'respond', 'answer', 'craft', 'curate', 'collect', 'gather', 'analyze',
  'analyse', 'evaluate', 'assess', 'determine', 'select', 'pick', 'apply', 'adopt',
  'embrace', 'position', 'differentiate', 'highlight', 'showcase', 'demonstrate',
  'focus', 'guide', 'ask',
  // Romanian imperative stems (partial coverage)
  'definește', 'defineste', 'stabilește', 'stabileste', 'creează', 'creeaza',
  'optimizează', 'optimizeaza', 'monitorizează', 'monitorizeaza', 'măsoară',
  'masoara', 'identifică', 'identifica', 'asigură', 'asigura', 'folosește',
  'foloseste', 'structurează', 'structureaza', 'adaugă', 'adauga', 'publică',
  'publica', 'alege', 'construiește', 'construieste',
])

// Function words whose presence (as a whole word, case-insensitive) marks a
// phrase as a clause/sentence rather than a Title-Cased brand name. Deliberately
// excludes ambiguous connectors ("of", "and", "&") that appear in real names
// (e.g. "Bank of America", "Ben & Jerry's"). Only consulted alongside the
// leading-verb signal above.
const CLAUSE_FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'for', 'to', 'your', 'you', 'yours', 'with', 'how', 'what',
  'why', 'that', 'about', 'when', 'into', 'via', 'using', 'ways',
])

// Section-heading / metric tail nouns. A numbered item ENDING in one of these is
// a heading or metric label ("AI Visibility Score", "Content Overview"), not a
// company. Kept small and trailing-only to avoid rejecting real brands whose name
// happens to contain a common noun ("Score Media", "Index Ventures").
const HEADING_TAIL_NOUNS = new Set([
  'score', 'scores', 'overview', 'breakdown', 'summary', 'checklist',
  'takeaways', 'recap',
])

// Single-word common evaluation/section/criterion nouns that engines surface as
// standalone bold or numbered items in advice sections ("**Budget** — …",
// "1. **Speed** — …"). Matched as a WHOLE single-word name only, so multi-word
// real company names that merely contain one of these ("Forrester Research",
// "First Sentinel Wealth") are never affected. Trade-off (documented, same spirit
// as NOT_A_COMPANY): a real one-word brand named exactly e.g. "Budget" would be
// dropped — acceptable in BrandGEO's B2B/professional-services verticals, where
// these words are criteria ~always. Non-EN coverage remains a gap. §8.11 round 3.
const COMMON_NON_BRAND = new Set([
  'budget', 'speed', 'pricing', 'research', 'cost', 'quality', 'value',
  'considerations', 'consideration', 'recommendation', 'recommendations',
  'conclusion', 'methodology', 'disclaimer', 'eligibility', 'minimums',
  'regulation', 'verdict', 'background', 'introduction', 'pros', 'cons', 'tips',
  'notes', 'factors', 'criteria', 'timeline', 'availability', 'requirements',
  'features', 'security', 'scalability', 'reliability', 'performance',
  'reputation', 'communication', 'support', 'integrations', 'onboarding',
])

// A multi-word phrase where a non-first, non-connector word is lowercase reads as
// a sentence/criterion ("Commercial strategy", "Your merits", "Opponent
// conflicts"), not a Title-Cased brand ("Clifford Chance", "Slater and Gordon
// Lawyers"). Single-word items are exempt so lowercase-first brands ("eBay") are
// untouched. §8.11 round 3.
function looksLikePhrase(name) {
  const words = name.trim().split(/\s+/)
  if (words.length < 2) return false
  for (let i = 1; i < words.length; i++) {
    const clean = words[i].replace(/[^\p{L}\p{N}.]/gu, '')
    if (!clean) continue
    if (NAME_CONNECTORS.has(clean.toLowerCase())) continue
    if (/^[\p{Ll}]/u.test(clean)) return true
  }
  return false
}

function isCompanyName(name) {
  if (!name || name.length < 2 || name.length > 60) return false
  const lower = name.toLowerCase()
  // Existing domain-phrase filter (RO catering descriptors etc.).
  if (NOT_A_COMPANY.some(t => lower.includes(t))) return false
  // Must contain at least one letter.
  if (!/[a-zA-ZăâîșțÎȘȚĂÂ]/.test(name)) return false

  const words = name.trim().split(/\s+/)
  const wordCount = words.length

  // Rule A — a long phrase is a sentence, not a name. No real brand in a
  // commercial listicle runs to 6+ words. Catches "Define the AI surfaces you
  // care about" outright.
  if (wordCount >= 6) return false

  // Rule B — metric/heading tail noun ("… Score", "… Overview"). Catches
  // "AI Visibility Score" / "Brand Visibility Score".
  const lastWord = words[wordCount - 1].toLowerCase().replace(/[^\p{L}]/gu, '')
  if (HEADING_TAIL_NOUNS.has(lastWord)) return false

  // Single-word common evaluation/criterion noun ("Budget", "Speed", "Pricing").
  if (wordCount === 1 && COMMON_NON_BRAND.has(lower)) return false

  // Multi-word criterion/sentence phrase with a lowercase tail ("Commercial
  // strategy", "Your merits", "Opponent conflicts") — not a Title-Cased brand.
  if (looksLikePhrase(name)) return false

  // Rule C — leading imperative verb + clause-shaped body → instruction step.
  // We require the clause confirmation (a function word, or ≥4 words) so that
  // short Title-Cased verb-led brands ("Focus Features", "Boost Mobile",
  // "Design Within Reach") are NOT dropped. Catches "Establish a Fixed Prompt
  // Panel" (has "a"), "Structure Content for AI Extraction" (has "for").
  const firstWord = lower.split(/[\s\-]+/)[0]
  if (INSTRUCTION_VERBS.has(firstWord)) {
    // A bare single-word imperative verb is a sentence fragment, not a brand.
    // Catches the live "Ask" garbage capture (ChatGPT row 1618, London run) that
    // leaked through numbered extraction. Rare real single-word verb-brands
    // (e.g. "Focus") are an accepted trade-off per the honesty caveat above.
    if (wordCount === 1) return false
    const hasFunctionWord = words.some(w =>
      CLAUSE_FUNCTION_WORDS.has(w.toLowerCase().replace(/[^\p{L}]/gu, '')))
    if (hasFunctionWord || wordCount >= 4) return false
  }

  return true
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

function scanForKnownCompetitors(text, knownCompetitors, matchers) {
  if (!Array.isArray(knownCompetitors) || knownCompetitors.length === 0) return []
  const lower = text.toLowerCase()
  const found = []
  for (const comp of knownCompetitors) {
    if (!comp || comp.length < 2) continue
    const compLower = comp.toLowerCase().trim()
    // Skip if this matches the brand itself
    if (matchesAlias(compLower, matchers)) continue
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
  // Boundary-aware brand matchers (aliases + website), built once (finding 1.3).
  const matchers = buildBrandMatchers(cfg)

  const topResults  = extractTopRankedResults(text)
  const brandInList = topResults.find(item => matchesAlias(item.name, matchers))
  const mentioned   = matchers.length > 0 && (!!brandInList || matchesAlias(text, matchers))

  let position = null
  if (brandInList)   position = brandInList.pos
  else if (mentioned) position = detectListPosition(text, matchers)

  // Sentiment is scored ONLY on the brand's own sentence(s)/list-item(s), not
  // the whole response (audit finding 1.1a). We claim a polarity only when the
  // brand's own context is unambiguous: positive words but no negative → positive,
  // negative but no positive → negative, both-or-neither → neutral (conservative —
  // a mixed or signal-less mention is neutral, not a coin-flip).
  //
  // Word lists use stems (not full forms) so one entry covers inflections:
  // 'recomand' catches recomandat/recomandăm/recomandare/recomandarea/recomandată;
  // 'excelen' catches excelent/excelentă; 'potrivit' catches potrivit/potrivită.
  // Expanded 2026-07-09 from real production data (finding 1.1b): a 🥇 #1
  // "Recomandarea …/cea mai potrivită alegere" and an "în primul rând" first-pick
  // were scoring neutral because the RO praise phrasings weren't covered.
  // STILL a keyword approach → non-RO/EN languages and novel phrasings remain a
  // gap; explicit negation ("nu recomand …") resolves to neutral, not negative
  // (the pos stem also matches). The real fix for full nuance is an LLM-based
  // classifier of the brand clause (finding 1.1b, still the open long-term item).
  const posWords = ['recomand','recommend','best','top','excelen','excellent','calitat',
                    'profesional','lider','leading','prima','primul rând','potrivit',
                    'cea mai bun','cel mai bun','de încredere','trusted','premiat','award',
                    'ideal','reliable','preferat','🥇']
  const negWords = ['evita','avoid','problema','complaint','slab','negativ','poor','worst',
                    'nu recomand','nerecomand','dezamăg','plânger','prost']
  let sentiment = 'neutral'
  if (mentioned) {
    const brandCtx = extractBrandContext(text, matchers)
    const hasPos = posWords.some(w => brandCtx.includes(w))
    const hasNeg = negWords.some(w => brandCtx.includes(w))
    if (hasPos && !hasNeg)      sentiment = 'positive'
    else if (hasNeg && !hasPos) sentiment = 'negative'
    // both signals, or neither → neutral (ambiguous / no signal in brand's context)
  }

  let snippet = null
  if (mentioned) {
    // Centre the snippet on the first brand match (boundary-aware).
    for (const re of matchers) {
      const m = re.exec(text)
      if (m) { const idx = m.index; snippet = text.slice(Math.max(0, idx - 50), idx + 250).trim(); break }
    }
  }
  if (!snippet) snippet = text.slice(0, 300).trim()

  const competitors = topResults
    .filter(item => !matchesAlias(item.name, matchers))
    .filter(item => isCompanyName(item.name))
    .map(({ pos, name }) => ({ pos, name }))

  // Prose / bullet fallback (Gemini, Perplexity, markdown tables): append bold and
  // bullet-leading names not already captured. When there were no numbered results
  // these become the primary competitor list, with sequential appearance-order
  // positions (a reasonable prominence proxy for a "best X" answer — there is no
  // real rank in prose). Capped at 10 to bound noise.
  const dupOf = (name) => competitors.some(c =>
    c.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(c.name.toLowerCase()))
  let nextPos = competitors.length ? Math.max(...competitors.map(c => c.pos)) : 0
  for (const name of extractBoldAndBulletNames(text)) {
    if (competitors.length >= 10) break
    if (matchesAlias(name, matchers)) continue
    if (dupOf(name)) continue
    nextPos++
    competitors.push({ pos: nextPos, name })
  }

  // Secondary pass: catch known competitors mentioned in prose (not just in lists)
  const knownScan = scanForKnownCompetitors(text, cfg.known_competitors || [], matchers)
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
  cleanCandidateName,
  stripRankPrefixes,
  extractTopRankedResults,
  extractBoldAndBulletNames,
  looksLikeBrandName,
  isBoldColonLabel,
  looksLikePhrase,
  detectListPosition,
  buildBrandMatchers,
  buildAliasRegex,
  matchesAlias,
  extractBrandContext,
  isCompanyName,
  scanForKnownCompetitors,
  NOT_A_COMPANY,
}
