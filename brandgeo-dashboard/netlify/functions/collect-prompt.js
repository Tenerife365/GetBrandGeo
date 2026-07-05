/**
 * collect-prompt.js
 * On-demand LLM collection for a single prompt across all 5 engines.
 *
 * POST body:
 *   { prompt_id, prompt_text, client_id, client_config, force?,
 *     market_label?, region_label?, market_id? }
 *
 * market_label / region_label — human-readable geo context (e.g. "Romania", "Bucharest")
 * market_id — ISO 3166-1 alpha-2 country code (e.g. "RO", "DE", "GB").
 *   Used to set ChatGPT's user_location so web_search_preview actually searches
 *   from the client's market, not the US Netlify server.
 *
 * client_config: { brand_aliases, brand_website, known_competitors }
 */

const { createClient } = require('@supabase/supabase-js')

// ─── Geographic / language context ───────────────────────────────────────────
// Without geo context, API calls from our US Netlify server return US-centric
// results. Real users in e.g. Romania get location-aware results because
// search engines use their IP. We replicate this by telling every LLM exactly
// where the end-user is searching from.
//
// Priority:
//   1. market_label / region_label from POST body (explicit, always correct)
//   2. TLD inference from brand_website (fallback only — unreliable for
//      clients who target markets different from their domain's TLD)

function buildSystemContext(cfg, marketLabel, regionLabel) {
  let location = 'the relevant local market'

  if (marketLabel) {
    // Explicit market from dashboard — always correct, use as-is
    const hasSpecificRegion =
      regionLabel &&
      !regionLabel.startsWith('All ') &&
      regionLabel !== 'All regions' &&
      regionLabel !== 'All states' &&
      regionLabel !== 'All provinces' &&
      regionLabel !== 'All emirates'
    location = hasSpecificRegion ? `${regionLabel}, ${marketLabel}` : marketLabel
  } else {
    // Fallback: infer from brand_website TLD (last resort only)
    const raw = (cfg.brand_website || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const tld  = raw.split('.').pop()?.toLowerCase()
    const tldMap = {
      ro: 'Romania',      uk: 'United Kingdom', de: 'Germany',    fr: 'France',
      es: 'Spain',        it: 'Italy',           nl: 'Netherlands', pl: 'Poland',
      au: 'Australia',    ca: 'Canada',          us: 'United States', pt: 'Portugal',
      be: 'Belgium',      ch: 'Switzerland',     at: 'Austria',    hu: 'Hungary',
      cz: 'Czech Republic', se: 'Sweden',        dk: 'Denmark',    fi: 'Finland',
    }
    location = tldMap[tld] || 'the relevant local market'
  }

  return (
    `You are simulating a real user searching from ${location}. ` +
    `Use web search to find current, locally relevant results. ` +
    `When asked about businesses, services, or providers, prioritise companies operating in ${location}. ` +
    `Respond in the same language as the user's question.`
  )
}

// ─── Text normalisation ───────────────────────────────────────────────────────

function normalizeText(t) {
  return t
    .replace(/[          ​﻿]/g, ' ')
    .replace(/\s+/g, ' ')
    .normalize('NFC')
}

// ─── Analysis helpers ─────────────────────────────────────────────────────────

function extractTopRankedResults(text) {
  const items = []
  const listRe = /(?:^|\n)\s*(?:\*{0,2})(\d+)[.)]\*{0,2}\s+([^\n]{2,120})/gm
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
  if (brandInList)  position = brandInList.pos
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
    .map(({ pos, name }) => ({ pos, name }))

  return {
    brand_mentioned:       mentioned,
    brand_position:        position,
    sentiment,
    response_snippet:      snippet,
    competitors_mentioned: competitors.length ? JSON.stringify(competitors) : null,
  }
}

// ─── LLM callers ─────────────────────────────────────────────────────────────

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ])
}

// ChatGPT — OpenAI Responses API with forced web_search_preview tool + geo context.
// user_location makes web_search_preview actually query from the client's country,
// not from the US Netlify server. marketId is ISO 3166-1 alpha-2 (e.g. "RO").
async function callChatGPT(prompt, ctx, marketId, regionLabel) {
  // Build user_location for truly geo-targeted search results.
  // Without this, the search runs from the US regardless of the system prompt.
  const isSpecificRegion = regionLabel &&
    !regionLabel.startsWith('All ') &&
    regionLabel !== 'All regions' &&
    regionLabel !== 'All states' &&
    regionLabel !== 'All provinces' &&
    regionLabel !== 'All emirates'
  const userLocation = (marketId && marketId !== 'WW')
    ? { type: 'approximate', country: marketId, ...(isSpecificRegion ? { city: regionLabel } : {}) }
    : null

  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model:        'gpt-4o',
      instructions: ctx,
      tools:        [{ type: 'web_search_preview', ...(userLocation ? { user_location: userLocation } : {}) }],
      input:        prompt,
    }),
  })
  const d = await r.json()
  if (d.error) { console.error('[ChatGPT]', JSON.stringify(d.error)); return null }
  // Responses API: output[] contains web_search_call and message blocks
  const text = (d.output || [])
    .filter(o => o.type === 'message')
    .flatMap(o => (o.content || []).filter(c => c.type === 'output_text').map(c => c.text))
    .join('\n')
  if (text) {
    console.log('[ChatGPT] location used:', userLocation || 'none (worldwide)', '| preview:', text.slice(0, 200))
  } else {
    console.warn('[ChatGPT] empty output — full response:', JSON.stringify(d).slice(0, 500))
  }
  return text || null
}

// Gemini — Google Search grounding + systemInstruction for geo context
async function callGemini(prompt, ctx) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: ctx }] },
            contents:          [{ parts: [{ text: prompt }] }],
            tools:             [{ googleSearch: {} }],
          }),
        }
      )
      const d = await r.json()
      if (d.candidates?.[0]?.content?.parts?.[0]?.text) {
        const t = d.candidates[0].content.parts[0].text
        console.log(`[Gemini] ${model} ok | preview:`, t.slice(0, 200))
        return t
      }
      if (r.status === 404 || d.error?.code === 404) continue
      if (d.error) {
        console.warn(`[Gemini] ${model} search failed (${d.error.message}), retrying without grounding`)
        const r2 = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: ctx }] },
              contents:          [{ parts: [{ text: prompt }] }],
            }) }
        )
        const d2 = await r2.json()
        if (d2.candidates?.[0]?.content?.parts?.[0]?.text) return d2.candidates[0].content.parts[0].text
        continue
      }
      break
    } catch (e) { console.error(`[Gemini] ${model}:`, e.message); continue }
  }
  return null
}

// Claude — Anthropic direct API, training-data mode (no web search tool).
//
// WHY no web search: the web-search-2025-03-05 beta requires a manual multi-turn
// tool-use loop (Claude returns stop_reason:"tool_use", caller must execute the
// search and return results, then Claude answers). That loop adds 2-3 round trips
// and easily exceeds the 26s Netlify function limit.
//
// We already have 3 live-web engines (ChatGPT, Gemini, Perplexity). Claude here
// contributes its strong training-data brand knowledge — useful for awareness and
// sentiment signals that don't require today's search results.
async function callClaude(prompt, ctx) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[Claude] ANTHROPIC_API_KEY not set in Netlify env vars.')
    return null
  }
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 1024,
        system:     ctx,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    const d = await r.json()
    if (d.error) {
      console.error('[Claude] API error:', d.error.type, d.error.message)
      return null
    }
    const textBlocks = (d.content || []).filter(b => b.type === 'text')
    if (textBlocks.length > 0) {
      const text = textBlocks.map(b => b.text).join('\n')
      console.log('[Claude] ok (training data) | preview:', text.slice(0, 200))
      return text
    }
    console.warn('[Claude] empty response — stop_reason:', d.stop_reason)
    return null
  } catch (e) {
    console.error('[Claude] request threw:', e.message)
    return null
  }
}

// OpenRouter — Perplexity (web search built-in) and Meta (training data only)
async function callOpenRouter(model, prompt, ctx) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error(`[OpenRouter:${model}] OPENROUTER_API_KEY not set — engine skipped`)
    return null
  }
  const messages = [
    { role: 'system', content: ctx },
    { role: 'user',   content: prompt },
  ]
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://getbrandgeo.com',
      'X-Title':      'BrandGEO Monitor',
    },
    body: JSON.stringify({ model, messages, max_tokens: 1000 }),
  })
  const d = await r.json()
  if (d.error) {
    console.error(`[OpenRouter:${model}] error:`, JSON.stringify(d.error))
    return null
  }
  const text = d.choices?.[0]?.message?.content ?? null
  if (text) {
    console.log(`[OpenRouter:${model}] ok | preview:`, text.slice(0, 200))
  } else {
    console.warn(`[OpenRouter:${model}] empty response:`, JSON.stringify(d).slice(0, 300))
  }
  return text
}

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }

  const { prompt_id, prompt_text, client_id, client_config, force, market_label, region_label, market_id } = body
  if (!prompt_id || !prompt_text || !client_id || !client_config)
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Build geo context — explicit market takes priority over TLD inference
  const ctx = buildSystemContext(client_config, market_label, region_label)

  // LLM_CALLERS defined here so ctx is captured in closure
  const LLM_CALLERS = {
    chatgpt:    p => callChatGPT(p, ctx, market_id, region_label),                 // web search via Responses API + geo-targeted
    gemini:     p => callGemini(p, ctx),                                           // web search via Google grounding
    claude:     p => callClaude(p, ctx),                                           // web search via Anthropic beta
    perplexity: p => callOpenRouter('perplexity/sonar', p, ctx),                   // web search built-in
    meta:       p => callOpenRouter('meta-llama/llama-3.1-70b-instruct', p, ctx),  // training data only (no web search)
  }

  let toRun

  if (force) {
    await supabase.from('ai_results').delete().eq('prompt_id', prompt_id).eq('client_id', client_id)
    toRun = Object.keys(LLM_CALLERS)
  } else {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { data: existing } = await supabase
      .from('ai_results')
      .select('llm')
      .eq('prompt_id', prompt_id)
      .eq('client_id', client_id)
      .gte('checked_at', monthStart.toISOString())
    const done = new Set((existing || []).map(r => r.llm))
    toRun = Object.keys(LLM_CALLERS).filter(llm => !done.has(llm))
    if (toRun.length === 0)
      return { statusCode: 200, body: JSON.stringify({ skipped: true, prompt_id }) }
  }

  // 22s per LLM — parallel, fits within Netlify's 26s function timeout
  const settled = await Promise.allSettled(
    toRun.map(llm => withTimeout(LLM_CALLERS[llm](prompt_text), 22000))
  )

  const summary = {}
  const inserts = []

  for (let i = 0; i < toRun.length; i++) {
    const llm    = toRun[i]
    const result = settled[i]
    if (result.status === 'rejected' || !result.value) {
      summary[llm] = `failed: ${result.reason?.message || 'no response'}`
      continue
    }
    const analysis = analyseResponse(result.value, client_config)
    inserts.push({
      prompt_id,
      llm,
      client_id,
      brand_mentioned:       analysis.brand_mentioned,
      brand_position:        analysis.brand_position,
      sentiment:             analysis.sentiment,
      response_snippet:      analysis.response_snippet,
      competitors_mentioned: analysis.competitors_mentioned,
      checked_at:            new Date().toISOString(),
    })
    summary[llm] = analysis.brand_mentioned ? 'mentioned' : 'not_mentioned'
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from('ai_results').insert(inserts)
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }

  // ctx_geo: what location was actually used — helps debug collection results
  const ctxGeo = market_label
    ? (region_label && !region_label.startsWith('All ') ? `${region_label}, ${market_label}` : market_label)
    : ctx.split('from ')[1]?.split('.')[0] ?? 'unknown'

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: true, prompt_id, summary, ctx_geo: ctxGeo }),
  }
}
