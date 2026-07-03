/**
 * collect-prompt.js
 * On-demand LLM collection for a single prompt across all 5 engines.
 * Called sequentially by the admin UI (one prompt at a time) with progress tracking.
 *
 * POST body: { prompt_id, prompt_text, client_id, client_config }
 * client_config: { brand_aliases: string[], brand_website: string, known_competitors: string[] }
 */

const { createClient } = require('@supabase/supabase-js')

// ─── Analysis helpers ─────────────────────────────────────────────────────────

/**
 * Extracts the top-5 ranked results from an LLM response.
 * Parses only actual numbered lists from the response text — no config seeds.
 * Returns [{pos, name}, ...] sorted by position (max 5).
 */
function extractTopRankedResults(text) {
  const items = []
  // Match "1. Name", "1) Name", "**1.** Name", "  1. Name"
  const listRe = /(?:^|\n)\s*(?:\*{0,2})(\d+)[.)]\*{0,2}\s+([^\n]{2,120})/gm
  let m
  while ((m = listRe.exec(text)) !== null) {
    const pos = parseInt(m[1], 10)
    if (pos < 1 || pos > 10) continue

    let name = m[2].trim()
      .replace(/\*\*/g, '')               // remove **bold**
      .replace(/\*([^*]+)\*/g, '$1')      // remove *italic*
      .split(/\s*[–—]\s+/)[0]            // strip "— description"
      .split(/\s*:\s+/)[0]               // strip ": description"
      .split(/\s*\((?!$)/)[0]            // strip "(details…"
      .replace(/[.:,;!?\s]+$/, '')       // trailing punctuation
      .trim()

    if (name.length >= 2 && name.length <= 80 && !items.some(x => x.pos === pos)) {
      items.push({ pos, name })
    }
  }

  return items.sort((a, b) => a.pos - b.pos).slice(0, 5)
}

function detectListPosition(text, aliases, website) {
  const listRe = /(?:^|\n)\s*(\d+)[.)]\s+(.{0,200})/g
  let m
  while ((m = listRe.exec(text)) !== null) {
    const num = parseInt(m[1], 10)
    const segment = m[2].toLowerCase()
    if (aliases.some(a => segment.includes(a)) || segment.includes(website)) return num
  }
  const sentences = text.split(/(?<=[.!?])\s+/)
  for (let i = 0; i < sentences.length; i++) {
    const sl = sentences[i].toLowerCase()
    if (aliases.some(a => sl.includes(a)) || sl.includes(website)) return i + 1
  }
  return null
}

function analyseResponse(text, cfg) {
  const aliases = (cfg.brand_aliases || []).map(a => a.toLowerCase())
  const website = (cfg.brand_website || '').toLowerCase()
  const lower   = text.toLowerCase()

  // Extract actual ranked results from the response
  const topResults = extractTopRankedResults(text)

  // Check if brand appears in the ranked list
  const brandInList = topResults.find(item => {
    const nameLower = item.name.toLowerCase()
    return aliases.some(a => nameLower.includes(a)) || (website && nameLower.includes(website))
  })

  // Also check plain text mention (for non-list responses)
  const mentionedInText = aliases.some(a => lower.includes(a)) || (website && lower.includes(website))
  const mentioned = !!brandInList || mentionedInText

  // Position: prefer ranked list, fall back to sentence position
  let position = null
  if (brandInList) {
    position = brandInList.pos
  } else if (mentioned) {
    position = detectListPosition(text, aliases, website)
  }

  // Sentiment
  const posWords = ['recomandat','recomandam','recommend','best','top','excelen','calitat',
                    'profesional','lider','prima','leading','trusted','award']
  const negWords = ['evita','avoid','problema','complaint','slab','negativ','poor','worst']
  let sentiment = 'neutral'
  if (mentioned) {
    if (posWords.some(w => lower.includes(w))) sentiment = 'positive'
    else if (negWords.some(w => lower.includes(w))) sentiment = 'negative'
  }

  // Snippet around brand mention
  let snippet = null
  if (mentioned) {
    for (const a of aliases) {
      const idx = lower.indexOf(a)
      if (idx !== -1) { snippet = text.slice(Math.max(0, idx - 50), idx + 250).trim(); break }
    }
  }
  if (!snippet) snippet = text.slice(0, 300).trim()

  // Competitors = top-5 from ranked list, excluding our own brand
  // Stored regardless of whether brand is mentioned — gives real market picture
  const competitors = topResults
    .filter(item => {
      const nameLower = item.name.toLowerCase()
      return !aliases.some(a => nameLower.includes(a)) && !(website && nameLower.includes(website))
    })
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
    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), ms)),
  ])
}

// ChatGPT — gpt-4o-search-preview performs real-time web search (matches ChatGPT product)
async function callChatGPT(prompt) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-search-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      // temperature not supported by search-preview models
    }),
  })
  const d = await r.json()
  if (d.error) console.error('[ChatGPT] API error:', JSON.stringify(d.error))
  return d.choices?.[0]?.message?.content ?? null
}

// Gemini — googleSearch tool enables Search grounding (matches Gemini product)
async function callGemini(prompt) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ googleSearch: {} }],
          }),
        }
      )
      const d = await r.json()
      if (d.candidates?.[0]?.content?.parts?.[0]?.text) return d.candidates[0].content.parts[0].text
      if (r.status === 404 || d.error?.code === 404) continue
      if (d.error) {
        console.warn(`[Gemini] ${model} search grounding failed (${d.error.message}), retrying without search`)
        const r2 = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
        )
        const d2 = await r2.json()
        if (d2.candidates?.[0]?.content?.parts?.[0]?.text) return d2.candidates[0].content.parts[0].text
        continue
      }
      break
    } catch (e) {
      console.error(`[Gemini] ${model} error:`, e.message)
      continue
    }
  }
  return null
}

// Claude — Anthropic direct API with web_search beta tool (matches Claude.ai product)
// Requires ANTHROPIC_API_KEY in Netlify env vars. Falls back to OpenRouter (no search) if not set.
async function callClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const d = await r.json()
      if (d.error) {
        console.warn('[Claude] Anthropic API error:', d.error.message, '— falling back to OpenRouter')
      } else {
        // Response contains mixed blocks (text + tool_use); collect all text blocks
        const textBlocks = (d.content || []).filter(b => b.type === 'text')
        if (textBlocks.length > 0) return textBlocks.map(b => b.text).join('\n')
      }
    } catch (e) {
      console.warn('[Claude] Direct API failed:', e.message, '— falling back to OpenRouter')
    }
  }
  // Fallback: OpenRouter (training data only, no web search)
  return callOpenRouter('anthropic/claude-sonnet-4-5', prompt)
}

async function callOpenRouter(model, prompt) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://getbrandgeo.com',
      'X-Title': 'BrandGEO Monitor',
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 1000 }),
  })
  const d = await r.json()
  return d.choices?.[0]?.message?.content ?? null
}

const LLM_CALLERS = {
  chatgpt:    p => callChatGPT(p),                                          // ✅ web search via gpt-4o-search-preview
  gemini:     p => callGemini(p),                                           // ✅ web search via Google Search grounding
  claude:     p => callClaude(p),                                           // ✅ web search via Anthropic beta tool
  perplexity: p => callOpenRouter('perplexity/sonar', p),                   // ✅ web search built-in (sonar)
  meta:       p => callOpenRouter('meta-llama/llama-3.3-70b-instruct', p),  // ⚠️  training data only (no web search API for Meta AI)
}

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }

  const { prompt_id, prompt_text, client_id, client_config } = body

  if (!prompt_id || !prompt_text || !client_id || !client_config) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Always run all engines — delete stale results first so re-runs give fresh data
  const toRun = Object.keys(LLM_CALLERS)

  await supabase
    .from('ai_results')
    .delete()
    .eq('prompt_id', prompt_id)
    .eq('client_id', client_id)

  // Call all LLMs in parallel (30s timeout each)
  const settled = await Promise.allSettled(
    toRun.map(llm => withTimeout(LLM_CALLERS[llm](prompt_text), 30000))
  )

  const summary = {}
  const inserts = []

  for (let i = 0; i < toRun.length; i++) {
    const llm    = toRun[i]
    const result = settled[i]

    if (result.status === 'rejected' || !result.value) {
      summary[llm] = 'failed'
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

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: true, prompt_id, summary }),
  }
}