/**
 * _prospect_prompts.js
 * Auto prompt-generation for the Instant Audit Engine — SALES-ENGINE.md §2.1,
 * "the one genuinely new piece": given a bare domain, generate 5-8 commercial
 * buyer prompts automatically. Today (the real product) this is manual per
 * client (CLAUDE.md §1.1 "Stores commercial buyer prompts per client").
 *
 * Two steps, one LLM call total:
 *   1. Best-effort fetch the domain's homepage (title + meta description) to
 *      ground the guess — asking an LLM to categorise a bare domain string
 *      with zero page content is exactly the kind of ungrounded guess that
 *      produces plausible-sounding nonsense.
 *   2. One gpt-4o-mini call (same cheap/fast model suggest-prompts.js already
 *      uses for the dashboard's own "AI Discover" feature) asking for strict
 *      JSON: { category, prompts[] }. Prompts are generic buyer queries
 *      ("best CRM software for small business") — never the brand/domain name
 *      itself, matching how the real product's own prompts work.
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
      const signal = [title, desc].filter(Boolean).join(' — ').slice(0, 500)
      if (signal) return signal
    } catch { /* try next scheme, or fall through to null */ }
  }
  return null
}

function extractJson(raw) {
  // Strip markdown code fences if the model wrapped its JSON in ```json ... ```
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(stripped)
}

/**
 * Returns { category, prompts: string[], lowConfidence: boolean }.
 * Falls back to a generic domain-name-only guess (flagged lowConfidence) if
 * the homepage can't be fetched or the LLM call/parse fails — an audit that
 * runs on a best-effort guess beats a hard failure, as long as it's flagged
 * honestly rather than presented with false confidence.
 */
async function generateAuditPrompts(domain) {
  const apiKey = process.env.OPENAI_API_KEY
  const homepageSignal = await fetchHomepageSignal(domain)

  if (apiKey) {
    const grounding = homepageSignal
      ? `Its homepage title/description reads: "${homepageSignal}"`
      : `Its homepage could not be fetched — infer only from the domain name itself, and note this is a lower-confidence guess.`

    const system = `You analyse a business from its domain and generate realistic buyer research prompts. Respond with ONLY strict JSON, no markdown, no commentary, matching exactly: {"category": string, "prompts": string[]}. "category" is a short (2-5 word) description of the business category (e.g. "email marketing software", "Bucharest catering company"). "prompts" must contain exactly ${PROMPT_COUNT} realistic questions a prospective buyer would type into an AI assistant (ChatGPT, Gemini, etc.) when searching for companies like this one — generic buyer research questions (e.g. "best email marketing tools for small ecommerce brands", "top catering companies in Bucharest for corporate events"). NEVER include the domain name or the business's own name in the prompts — they must be the kind of question someone would ask BEFORE knowing this business exists.`

    const user = `Domain: ${domain}\n${grounding}`

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
            lowConfidence: !homepageSignal,
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
  // as a real result.
  const base = domain.split('.')[0].replace(/[-_]/g, ' ')
  return {
    category: 'unknown (domain-name guess only)',
    prompts: [
      `best companies like ${base}`,
      `top alternatives to ${base}`,
      `recommended providers similar to ${base}`,
    ],
    lowConfidence: true,
  }
}

module.exports = { generateAuditPrompts, fetchHomepageSignal, PROMPT_COUNT }
