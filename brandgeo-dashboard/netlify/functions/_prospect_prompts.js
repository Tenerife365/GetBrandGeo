/**
 * _prospect_prompts.js
 * Auto prompt-generation for the Instant Audit Engine — SALES-ENGINE.md §2.1,
 * "the one genuinely new piece": given a bare domain, generate 5-8 commercial
 * buyer prompts automatically. Today (the real product) this is manual per
 * client (CLAUDE.md §1.1 "Stores commercial buyer prompts per client").
 *
 * Two steps, one LLM call total:
 *   1. Best-effort fetch the domain's homepage (title + meta description +
 *      og:site_name) to ground the guess — asking an LLM to categorise a bare
 *      domain string with zero page content is exactly the kind of ungrounded
 *      guess that produces plausible-sounding nonsense.
 *   2. One gpt-4o-mini call (same cheap/fast model suggest-prompts.js already
 *      uses for the dashboard's own "AI Discover" feature) asking for strict
 *      JSON: { category, brand_name, prompts[] }. Prompts are generic buyer
 *      queries ("best CRM software for small business") — never the brand/
 *      domain name itself, matching how the real product's own prompts work.
 *
 * BRAND-NAME EXTRACTION — added 2026-07-16 to fix a real data-integrity bug.
 * See generateAuditPrompts()'s doc comment and buildProspectAliases() below.
 */

const PROMPT_COUNT = 6   // middle of SALES-ENGINE.md §2.1's "5-8" range

async function fetchHomepageSignal(domain) {
  for (const scheme of ['https://', 'http://']) {
    try {
      const res = await Promise.race([
        fetch(`${scheme}${domain}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrandGEOAuditBot/1.0; +https://getbrandgeo.com)' },
          redirect: 'follow',
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('homepage fetch timeout')), 6000)),
      ])
      if (!res.ok) continue
      const html = await res.text()
      const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim()
      const desc  = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]
        || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] || '').trim()
      // og:site_name is frequently the site's own declared canonical brand name —
      // a much stronger signal than the domain string for brands whose real name
      // diverges from their domain root (e.g. salesmessage.com -> "Salesmsg").
      // Handles both attribute orderings, same as the description regex above.
      const ogSiteName = (html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i)?.[1]
        || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:site_name["']/i)?.[1] || '').trim()
      const signal = [title, desc].filter(Boolean).join(' — ').slice(0, 500)
      if (signal || ogSiteName) {
        return { signal: signal || null, ogSiteName: ogSiteName || null }
      }
    } catch { /* try next scheme, or fall through to null */ }
  }
  return null
}

function extractJson(raw) {
  // Strip markdown code fences if the model wrapped its JSON in ```json ... ```
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(stripped)
}

const BRAND_NAME_PLACEHOLDER_RE = /^(n\/a|na|unknown|none|null|undefined|-)$/i

function cleanBrandName(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  if (!trimmed || BRAND_NAME_PLACEHOLDER_RE.test(trimmed)) return null
  return trimmed.slice(0, 80)
}

// A generic leading phrase a sloppy og:site_name sometimes carries instead of
// (or in front of) the real brand name. Stripped rather than treated as
// disqualifying on its own, since the real name often follows it directly
// ("Welcome to Acme" -> "Acme").
const RECOVERED_NAME_LEADING_GENERIC_RE =
  /^(?:welcome\s*(?:to)?\s*|home\s*[-|:]?\s*|official\s*site\s*(?:of)?\s*|official\s*)/i

// What is left is not a brand name if it is nothing BUT one of these generic
// words, whether or not there was a leading phrase to strip.
const RECOVERED_NAME_GENERIC_WHOLE_RE =
  /^(home|homepage|welcome|official|official site|site|website|index|untitled|untitled document|page|loading)$/i

const MAX_RECOVERED_NAME_WORDS = 4

/**
 * sanitizeRecoveredBrandName(raw) -> string | null
 *
 * R5 (docs/qa/scoring-fixes-review-2026-08-14.md): a raw og:site_name is not
 * always a name. The reviewer's reproduced case,
 * `"Home | Best CRM Software for Teams"`, fed straight into
 * buildProspectAliases() adds "Home" as a standalone lead-word alias (no
 * stopword filter there catches it), which then matches the word "home"
 * anywhere in an engine response. That is a FALSE POSITIVE, the opposite
 * direction from F1 but just as wrong on a public sales asset: a brand gets
 * scored as mentioned when it was never named.
 *
 * Handles, in this order:
 *   1. A generic leading phrase ("Welcome to ", "Home", "Official Site of ")
 *      is stripped, not treated as disqualifying by itself, since the real
 *      name is frequently right after it.
 *   2. Anything still separator-shaped after that (|, :, middot, or a spaced
 *      hyphen) is REJECTED outright rather than guessed at. Picking a side of
 *      "X | Y" risks manufacturing exactly the kind of confident-looking
 *      wrong alias this function exists to prevent, so an ambiguous title is
 *      worth less than no recovery at all.
 *   3. A bare generic word with nothing left to say ("Home", "Site") is
 *      rejected.
 *   4. Anything longer than MAX_RECOVERED_NAME_WORDS reads as a tagline or a
 *      description, not an isolated name, and is rejected.
 *
 * Returns null when nothing trustworthy survives. The caller treats that
 * exactly like a failed recovery fetch: reuse is abandoned in favour of a
 * fresh generation rather than an unverifiable name being used anyway.
 */
function sanitizeRecoveredBrandName(raw) {
  let value = (typeof raw === 'string' ? raw : '').trim()
  if (!value) return null

  value = value.replace(RECOVERED_NAME_LEADING_GENERIC_RE, '').trim()
  if (!value) return null

  if (/[|:·]/.test(value) || / - /.test(value)) return null

  if (RECOVERED_NAME_GENERIC_WHOLE_RE.test(value)) return null

  const words = value.split(/\s+/).filter(Boolean)
  if (words.length === 0 || words.length > MAX_RECOVERED_NAME_WORDS) return null

  return value.slice(0, 80)
}

/**
 * Returns { category, prompts: string[], lowConfidence: boolean, brandName: string|null }.
 * Falls back to a generic domain-name-only guess (flagged lowConfidence) if
 * the homepage can't be fetched or the LLM call/parse fails — an audit that
 * runs on a best-effort guess beats a hard failure, as long as it's flagged
 * honestly rather than presented with false confidence.
 *
 * brandName is the real, canonical brand/company name — distinct from the
 * domain string whenever they diverge (e.g. "gokickflip.com" -> "Kickflip").
 *
 * FIXED 2026-07-16: this field used to be entirely absent, and the callers
 * (audit-domain.js / run-full-audit-background.js) fell back to
 * [domain.split('.')[0]] as the ONLY alias fed into analyseResponse(). That
 * silently failed to match the real brand name whenever it diverged from the
 * domain root — confirmed on 4 real domains (salesmessage.com -> "Salesmsg",
 * gokickflip.com -> "Kickflip", rebuyengine.com -> "Rebuy"/"Rebuy Engine",
 * caretlegal.com -> "CARET Legal"/"CARET"), each named and ranked in the raw
 * engine responses but scored ai_score: 0 because matchesAlias() (_analysis.js,
 * unchanged, already correct) had nothing to match against. Extracted here
 * from og:site_name (real, extracted data, not a guess — used even if the LLM
 * call itself fails) and, when the homepage/LLM call succeeds, from the
 * model's own reading of title + meta + og:site_name together.
 *
 * preFetchedHomepage (optional): pass the return value of an already-made
 * fetchHomepageSignal(domain) call to skip fetching it again here. R4
 * (docs/qa/scoring-fixes-review-2026-08-14.md): getOrGenerateAuditPrompts()'s
 * brand-name recovery path already fetches the homepage before falling
 * through to this function, and without this parameter that fetch happened
 * twice in series, up to 12s each, before a single engine call. Distinguished
 * from "not supplied" by `undefined`, not by truthiness: a prior attempt that
 * genuinely found nothing is a real `null`, and passing that through must
 * skip the fetch too, not repeat it.
 */
async function generateAuditPrompts(domain, preFetchedHomepage) {
  const apiKey = process.env.OPENAI_API_KEY
  const homepage = preFetchedHomepage !== undefined ? preFetchedHomepage : await fetchHomepageSignal(domain)

  if (apiKey) {
    const grounding = homepage?.signal
      ? `Its homepage title/description reads: "${homepage.signal}"`
      : `Its homepage could not be fetched — infer only from the domain name itself, and note this is a lower-confidence guess.`
    const siteNameHint = homepage?.ogSiteName
      ? `\nIts site declares its own name (og:site_name meta tag) as: "${homepage.ogSiteName}"`
      : ''

    const system = `You analyse a business from its domain and generate realistic buyer research prompts. Respond with ONLY strict JSON, no markdown, no commentary, matching exactly: {"category": string, "brand_name": string, "prompts": string[]}. "category" is a short (2-5 word) description of the business category (e.g. "email marketing software", "Bucharest catering company"). "brand_name" is the real, canonical name this business is known by — the actual brand/company name a person or AI assistant would use when referring to it, which often differs from the raw domain string (e.g. domain "gokickflip.com" -> brand_name "Kickflip"; domain "salesmessage.com" -> brand_name "Salesmsg"; domain "caretlegal.com" -> brand_name "CARET Legal"). Infer it from the homepage title, meta description, and site name signal provided below. If you cannot confidently identify a real brand name, return an empty string for "brand_name" rather than guessing. "prompts" must contain exactly ${PROMPT_COUNT} realistic questions a prospective buyer would type into an AI assistant (ChatGPT, Gemini, etc.) when searching for companies like this one — generic buyer research questions (e.g. "best email marketing tools for small ecommerce brands", "top catering companies in Bucharest for corporate events"). NEVER include the domain name or the business's own name in the prompts — they must be the kind of question someone would ask BEFORE knowing this business exists.`

    const user = `Domain: ${domain}\n${grounding}${siteNameHint}`

    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          max_tokens: 600,
          temperature: 0.4,
        }),
      })
      const d = await r.json()
      const raw = d.choices?.[0]?.message?.content
      if (raw) {
        const parsed = extractJson(raw)
        if (parsed?.category && Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
          return {
            category: String(parsed.category).slice(0, 100),
            prompts: parsed.prompts.slice(0, 8).map(p => String(p).slice(0, 300)),
            lowConfidence: !homepage?.signal,
            // Prefer the LLM's inference (sees title + meta + og:site_name
            // together and can pick the real brand over a generic tagline);
            // fall back to the raw og:site_name meta tag if the model
            // declined to answer or returned nothing usable.
            brandName: cleanBrandName(parsed.brand_name) || homepage?.ogSiteName || null,
          }
        }
      }
      console.warn('[Audit/PromptGen] unparseable response, falling back:', JSON.stringify(d).slice(0, 300))
    } catch (e) {
      console.error('[Audit/PromptGen] threw, falling back:', e.message)
    }
  }

  // Fallback: no API key, or the call/parse failed. Best-effort guess from the
  // domain name alone, clearly flagged low-confidence rather than presented
  // as a real result. Still use a real og:site_name signal if the homepage
  // fetch itself succeeded, independent of the LLM call that just failed —
  // that's extracted data, not a guess.
  const base = domain.split('.')[0].replace(/[-_]/g, ' ')
  return {
    category: 'unknown (domain-name guess only)',
    prompts: [
      `best companies like ${base}`,
      `top alternatives to ${base}`,
      `recommended providers similar to ${base}`,
    ],
    lowConfidence: true,
    brandName: homepage?.ogSiteName || null,
  }
}

// Leading words in a multi-word brand name that aren't worth extracting as
// their own alias entry (too generic / not a distinguishing token an AI
// response would use in isolation to refer to the brand).
const LEADING_WORD_STOPWORDS = new Set(['the', 'get', 'my', 'your', 'a', 'an', 'go', 'try'])

/**
 * buildProspectAliases(domain, brandName) -> string[]
 *
 * Builds the multi-entry brand_aliases array fed into analyseResponse() for
 * an anonymous prospect audit — mirroring how real clients' brand_aliases
 * (text[], CLAUDE.md §3) hold multiple name variants, not a single guess.
 *
 * Deliberately does NOT add case/spacing duplicates of the same string —
 * buildAliasRegex() in _analysis.js already tokenises each alias on
 * whitespace/hyphen/underscore/dot and matches case-insensitively with a
 * flexible separator, so "Rebuy Engine" as ONE alias entry already matches
 * "rebuy-engine" / "RebuyEngine" / "rebuy engine" in response text — adding
 * lowercase/no-space variants of the same string would just build identical
 * regexes for nothing. What actually needs a SEPARATE entry is a genuinely
 * different name the brand goes by — most commonly the lead word of a
 * multi-word name, since AI responses often refer to a brand by its primary
 * word alone (e.g. "Rebuy Engine" elsewhere in the same response just as
 * "Rebuy" — and because buildAliasRegex()'s boundary anchoring means a bare
 * "Rebuy" alias also matches "Rebuy" wherever it appears inside "Rebuy
 * Engine"/"Rebuy Smart Personalization", this one extra entry alone tends to
 * catch every variant of a multi-word brand name).
 */
function buildProspectAliases(domain, brandName) {
  const aliases = []
  const domainRoot = (domain || '').split('.')[0]
  if (domainRoot) aliases.push(domainRoot)

  const name = (brandName || '').trim()
  if (name) {
    aliases.push(name)
    const words = name.split(/\s+/).filter(Boolean)
    if (words.length > 1) {
      const lead = words[0]
      if (lead.length >= 2 && !LEADING_WORD_STOPWORDS.has(lead.toLowerCase())) {
        aliases.push(lead)
      }
    }
  }

  // Case-insensitive dedup — buildAliasRegex() is already case-insensitive,
  // so "getresponse" (domain root) and "GetResponse" (extracted brand name)
  // would just build two identical regexes for nothing.
  const seen = new Set()
  return aliases.filter(a => {
    const key = a.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * getOrGenerateAuditPrompts(supabase, domain, opts) -> Promise<{ category, prompts, lowConfidence, brandName, reused }>
 *
 * Wraps generateAuditPrompts() with per-domain persistence so a repeat audit
 * of the same domain is reproducible. See
 * docs/qa/audit-scoring-investigation-2026-08-14.md §4: audit-domain.js used
 * to call generateAuditPrompts(domain) fresh on every single audit, and
 * because that call goes through gpt-4o-mini at temperature 0.4, two audits
 * of revenuehunt.com three minutes apart scored 54 and 0 sharing only 1 of 6
 * prompts. A prospect who re-runs their own audit could be shown a different
 * number, which undoes every other fix to the score.
 *
 * STABILISATION APPROACH CHOSEN: persistence, not temperature:0 alone. The
 * investigation's own R4 flags this and it holds here too: a model version
 * change on OpenAI's side (gpt-4o-mini is not pinned to a dated snapshot) can
 * silently change what temperature:0 deterministically returns, so a
 * temperature-only fix could quietly break again with no code change on our
 * side and no way to detect it short of noticing the scores drift. Reusing
 * the STORED prompt set has no such failure mode.
 *
 * WHAT IS ACTUALLY GUARANTEED (corrected 2026-08-14 per
 * docs/qa/scoring-fixes-review-2026-08-14.md R3, which is right that an
 * earlier version of this comment overclaimed). Two separate things are
 * reused here, and they have different guarantees:
 *   - The PROMPT SET is unconditionally stable once written. Every later
 *     call, reused or freshly generated, keeps converging on the same
 *     earliest row's prompts, because a forced regeneration appends a new row
 *     rather than replacing the earliest one, so it can never become
 *     canonical itself. This holds regardless of network conditions.
 *   - The BRAND NAME is unconditionally stable ONLY once a value has been
 *     successfully written to the canonical row's brand_name column. TWO
 *     paths can do that write (R2, then T1c after R2's own gap was measured):
 *     a successful recovery via fetchHomepageSignal(domain)'s og:site_name, or,
 *     when recovery finds nothing usable, whatever brand name the fallback
 *     generateAuditPrompts() call derives on its own (LLM inference included,
 *     not just og:site_name). Measured against all 70 canonical rows in
 *     production 2026-08-14: recovery alone would have closed 38 (54%); the
 *     fallback write-back closes the other 32, since the LLM path can name a
 *     brand that has no og:site_name meta tag at all, which is exactly why 28
 *     of those 32 could never have satisfied recovery no matter how many
 *     times it ran. Until a domain's FIRST successful write by either path, a
 *     pre-migration domain's brand name is re-derived on every audit, and a
 *     transient failure of the recovery fetch (not an LLM call, a network
 *     fetch) causes THAT SINGLE CALL to abandon reuse and fall through to a
 *     fresh generation instead of silently using no brand name. This is a
 *     materially smaller window than the pre-fix behaviour, which regenerated
 *     on every call unconditionally, but it is not nothing, and if the
 *     fallback ALSO finds no name (a domain with no discoverable brand at
 *     all), nothing is written and that domain regenerates again next time,
 *     which is a correct outcome, not a gap: some domains genuinely have no
 *     name to persist.
 *
 * Reuses the EARLIEST prospect_audits row for this domain that has a non-null
 * generated_prompts (ordered by created_at ASC, not "most recent"). Historical
 * rows are never rewritten wholesale by this function; the two exceptions are
 * the single-column brand_name write-backs described above (recovery success,
 * and fallback success), each scoped to exactly the canonical row's primary
 * key and each firing only when that row's brand_name is still NULL.
 *
 * Falls back to a fresh generateAuditPrompts() call when:
 *   - no prior row exists for this domain (a genuinely new domain gets a
 *     generated set, per the required behaviour), or
 *   - opts.forceRegenerate is true, the deliberate, explicit escape hatch for
 *     when a category has changed or a generation was bad. audit-domain.js
 *     gates this to internal callers only, the same tier as depth:'full', so
 *     a public visitor can never trigger a regeneration by accident or by
 *     spamming refresh. A forced call appends a new row with its own fresh
 *     set; it does not touch, delete, or become the earliest row for the
 *     domain, so it is a one-off rather than a new permanent canonical set,
 *     and the very next unforced call goes straight back to reusing the
 *     original earliest set (see tests/audit_prompt_reproducibility.test.js
 *     section 3 for the exact behaviour this guarantees). NOTE: this escape
 *     hatch does NOT repair a canonical row's brand_name, because it appends
 *     rather than updates (docs/qa/scoring-fixes-review-2026-08-14.md F3/R8).
 *     A stuck brand_name is repaired automatically by the write-back below
 *     instead, the next time this function runs for that domain, or
 *   - the earliest row does not look trustworthy enough to reuse: fewer than
 *     PROMPT_COUNT prompts. That alone means the stored generation fell back
 *     to generateAuditPrompts()'s degenerate path (a 3-prompt,
 *     self-referential guess made when the homepage fetch or the LLM call
 *     failed), which the system prompt explicitly forbids biasing mention
 *     detection with. Declining reuse here means a bad first generation
 *     cannot pin a domain to a bad prompt set forever. DELIBERATELY DOES NOT
 *     also check low_confidence (docs/qa/scoring-fixes-review-2026-08-14.md
 *     R1): that flag means only that the homepage fetch failed, not that the
 *     generation was degenerate, and a low-confidence row can still hold a
 *     full, perfectly good LLM-derived prompt set. An earlier version of this
 *     guard checked both and rejected 3 real, non-degenerate production rows
 *     (brevo.com, jetpackworkflow.com, antidote.legal), which regenerated
 *     their prompt set through gpt-4o-mini on every single audit forever,
 *     reintroducing this whole change's target defect on exactly the domains
 *     the guard was supposed to protect. 0 of 70 production rows trip the
 *     length check alone, so it is a guard against a latent failure mode, not
 *     a fix for a live one, or
 *   - the lookup query itself errors, most likely because
 *     db/supabase-prospect-audits-brand-name-migration.sql has not been run
 *     yet in this environment (the SELECT below reads brand_name). This fails
 *     OPEN to the old always-generate behaviour rather than throwing, so a
 *     deploy of this code ahead of the migration does not break the audit
 *     endpoint. It just does not get the reproducibility fix until the
 *     migration lands. Once it does, no further deploy is needed, or
 *   - the earliest row's brand_name is null AND a cheap recovery attempt also
 *     finds nothing USABLE. See the recovery and sanitisation comments inline
 *     below for the full rationale
 *     (docs/qa/scoring-fixes-review-2026-08-14.md F1, R5).
 */
async function getOrGenerateAuditPrompts(supabase, domain, opts = {}) {
  const forceRegenerate = !!opts.forceRegenerate

  // R4 (docs/qa/scoring-fixes-review-2026-08-14.md): if the recovery branch
  // below fetches the homepage, that exact result is threaded into the
  // fallback generateAuditPrompts() call at the bottom of this function
  // instead of letting it fetch a second time. Stays `undefined` (not `null`)
  // unless a fetch was actually attempted, so generateAuditPrompts can tell
  // "never tried" from "tried and found nothing" and only skips its own fetch
  // in the second case.
  let preFetchedHomepage

  // T1c (docs/qa/scoring-fixes-review-2026-08-14.md): set only in the branch
  // below where a canonical row exists, has no brand_name yet, and recovery
  // via fetchHomepageSignal found nothing usable, right before falling
  // through to a fresh generateAuditPrompts() call. If that fresh call
  // produces a brand name of its own, it is written back onto THIS row after
  // the fallback runs, same as a successful recovery already does. Left null
  // for every other path (a genuinely new domain's own insert already
  // carries its own brand_name and needs no separate write-back; a forced
  // regeneration deliberately does not touch the canonical row; a lookup
  // error never reaches a row at all), so the write-back only ever fires for
  // the one case it exists to close.
  let canonicalRowIdPendingBrandName = null

  if (!forceRegenerate) {
    try {
      const { data, error } = await supabase
        .from('prospect_audits')
        .select('id, generated_prompts, category, low_confidence, brand_name')
        .eq('domain', domain)
        .not('generated_prompts', 'is', null)
        // F4 (docs/qa/scoring-fixes-review-2026-08-14.md): created_at is a JS
        // Date.toISOString() at millisecond resolution, so two concurrent
        // first-time audits of the same brand-new domain can tie. Without a
        // tiebreak the winner depends on Postgres' physical row order, which
        // is not stable across a vacuum or a replica, so the "canonical set"
        // could silently change underneath a domain that was already stable.
        // `id` is the serial PK, a total order, and free to sort on.
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('[Audit/PromptGen] prior-prompt lookup failed, generating fresh:', error.message)
      } else if (
        data
        // R1 (docs/qa/scoring-fixes-review-2026-08-14.md): deliberately no
        // low_confidence check here. See the doc comment above for why.
        && Array.isArray(data.generated_prompts)
        && data.generated_prompts.length >= PROMPT_COUNT
      ) {
        let brandName = data.brand_name || null

        // F1 (docs/qa/scoring-fixes-review-2026-08-14.md), the blocking
        // finding on this file's first pass. The brand_name migration is
        // additive, so every canonical row written before it ran (all 70 in
        // production as of 2026-08-14, 15 already re-audited at least once)
        // has brand_name NULL. Passing that null straight through collapses
        // buildProspectAliases(domain, null) to the domain root alone, which
        // reopens the exact false-zero defect the 2026-07-16 fix closed: the
        // reviewer reproduced a true mention becoming a false zero on
        // caretlegal.com, salesmessage.com and gokickflip.com this way, three
        // of the five domains that fix names by name.
        //
        // Recovered the same cheap, deterministic way generateAuditPrompts()
        // itself already falls back to when its own LLM call declines to name
        // a brand: one HTTP GET, no LLM spend. R5: the raw value is not
        // trusted as-is, see sanitizeRecoveredBrandName() above.
        if (!brandName) {
          try {
            preFetchedHomepage = await fetchHomepageSignal(domain)
          } catch (e) {
            console.warn('[Audit/PromptGen] brand-name recovery fetch threw:', e.message)
            preFetchedHomepage = null
          }
          brandName = sanitizeRecoveredBrandName(preFetchedHomepage?.ogSiteName)
        }

        if (brandName) {
          // R2 (docs/qa/scoring-fixes-review-2026-08-14.md): persist the
          // recovered name onto the CANONICAL row itself, not the new row
          // this audit is about to insert (audit-domain.js writes brand_name
          // onto that new row already, but the new row is never the earliest
          // one, so it was never read again). Without this, every audit of
          // every pre-migration domain paid this fetch forever. Scoped to
          // exactly one column on exactly the row just read, by its primary
          // key, so it can alter nothing else on this row and no other row.
          // Only runs when the row did not already carry a brand_name, so an
          // already-persisted value (this write-back's own prior success, or
          // a post-migration insert that already had one) is never rewritten.
          if (!data.brand_name) {
            try {
              const { error: updateErr } = await supabase
                .from('prospect_audits')
                .update({ brand_name: brandName })
                .eq('id', data.id)
              if (updateErr) console.warn('[Audit/PromptGen] brand-name write-back failed:', updateErr.message)
            } catch (e) {
              console.warn('[Audit/PromptGen] brand-name write-back threw:', e.message)
            }
          }

          return {
            category: data.category || 'unknown',
            prompts: data.generated_prompts.map(p => p.text),
            lowConfidence: !!data.low_confidence,
            brandName,
            reused: true,
          }
        }

        // DECISION: the cheap recovery found nothing usable either (no
        // og:site_name, or R5's sanitiser rejected it as a tagline/generic
        // value). A silently degraded or silently wrong alias set is exactly
        // the class of defect being eliminated here, so reuse is abandoned in
        // favour of a fresh generation rather than returned with a null or
        // unverifiable brand name. Weighed against just accepting the null:
        // this costs one LLM call, but only on the domains where the free
        // og:site_name check could not find a usable name, so it is never
        // worse than the pre-reuse behaviour (which regenerated, and
        // therefore always re-derived the brand name from the LLM's own
        // reading of title/meta/og:site_name together, on every single
        // call). If the domain genuinely carries no discoverable brand name,
        // this fresh call will also return brandName: null, exactly matching
        // generateAuditPrompts()'s own honest behaviour for that case, so
        // nothing is lost by trying again here, and nothing was ever
        // silently downgraded.
        //
        // T1c (docs/qa/scoring-fixes-review-2026-08-14.md): the write-back
        // above only ever fires when RECOVERY succeeds, so a domain whose
        // homepage carries no og:site_name at all (measured: 28 of 70
        // canonical rows, plus 4 more the sanitiser correctly rejects, 32 of
        // 70 in total) could never satisfy it and would regenerate through
        // gpt-4o-mini forever. Recorded here so the fallback call below knows
        // to write ITS OWN result's brand name back onto this same row,
        // still guarded by "only fill a NULL, never overwrite" via
        // `!data.brand_name`, already established true to reach this line.
        if (!data.brand_name) canonicalRowIdPendingBrandName = data.id
        console.warn(`[Audit/PromptGen] reused prompt set for ${domain} has no usable brand_name and homepage recovery found nothing, generating fresh rather than reusing without one`)
      }
    } catch (e) {
      console.warn('[Audit/PromptGen] prior-prompt lookup threw, generating fresh:', e.message)
    }
  }

  const generated = await generateAuditPrompts(domain, preFetchedHomepage)

  // T1c write-back. Fires only for the one path described above: a canonical
  // row existed, had no brand_name, and its own recovery attempt failed. If
  // this fresh generation also found nothing, `generated.brandName` is null
  // and nothing is written; that is a valid end state (some domains genuinely
  // have no discoverable name), not an error. Same shape as the R2 write-back:
  // one column, one row, by primary key, try/catch, warn-and-continue so a
  // write failure can never break the audit response itself.
  if (canonicalRowIdPendingBrandName && generated.brandName) {
    try {
      const { error: updateErr } = await supabase
        .from('prospect_audits')
        .update({ brand_name: generated.brandName })
        .eq('id', canonicalRowIdPendingBrandName)
      if (updateErr) console.warn('[Audit/PromptGen] fallback brand-name write-back failed:', updateErr.message)
    } catch (e) {
      console.warn('[Audit/PromptGen] fallback brand-name write-back threw:', e.message)
    }
  }

  return { ...generated, reused: false }
}

module.exports = {
  generateAuditPrompts, getOrGenerateAuditPrompts, fetchHomepageSignal, buildProspectAliases,
  sanitizeRecoveredBrandName, PROMPT_COUNT,
}
