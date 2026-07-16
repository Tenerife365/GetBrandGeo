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
 */
async function generateAuditPrompts(domain) {
  const apiKey = process.env.OPENAI_API_KEY
  const homepage = await fetchHomepageSignal(domain)

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

module.exports = { generateAuditPrompts, fetchHomepageSignal, buildProspectAliases, PROMPT_COUNT }
