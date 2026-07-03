/**
 * collect-prompt.js
 * On-demand LLM collection for a single prompt across all 5 engines.
 * Called sequentially by the admin UI (one prompt at a time) with progress tracking.
 *
 * POST body: { prompt_id, prompt_text, client_id, client_config }
 * client_config: { brand_aliases: string[], brand_website: string, known_competitors: string[] }
 */

const { createClient } = require('@supabase/supabase-js')

// ─── Analysis helpers (mirrors Python collector logic) ────────────────────────

function extractCompetitors(text, knownCompetitors = []) {
  const lower = text.toLowerCase()
  const found = []

  for (const comp of knownCompetitors) {
    if (lower.includes(comp.toLowerCase())) {
      const idx = lower.indexOf(comp.toLowerCase())
      found.push(text.slice(idx, idx + comp.length))
    }
  }

  // Bold markdown items (e.g. **Company Name**)
  const boldRe = /\*\*([A-Z][^*\n]{1,50}?)\*\*/g
  let m
  while ((m = boldRe.exec(text)) !== null) {
    const name = m[1].trim().replace(/^[\s:.\-]+|[\s:.\-]+$/g, '')
    if (name.length > 2 && name.length < 60) found.push(name)
  }

  const seen = new Set()
  const skip = new Set(['best', 'top', 'the', 'and', 'for', 'not', 'see', 'all'])
  return found.filter(f => {
    const k = f.toLowerCase().trim()
    if (skip.has(k) || seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, 8)
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
  const aliases  = (cfg.brand_aliases || []).map(a => a.toLowerCase())
  const website  = (cfg.brand_website || '').toLowerCase()
  const lower    = text.toLowerCase()

  const mentioned = aliases.some(a => lower.includes(a)) || (website && lower.includes(website))
  const position  = mentioned ? detectListPosition(text, aliases, website) : null

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
    for (const a of aliases) {
      const idx = lower.indexOf(a)
      if (idx !== -1) { snippet = text.slice(Math.max(0, idx - 50), idx + 250).trim(); break }
    }
  }
  if (!snippet) snippet = text.slice(0, 300).trim()

  const competitors = extractCompetitors(text, cfg.known_competitors)
  return {
    brand_mentioned:      mentioned,
    brand_position:       position,
    sentiment,
    response_snippet:     snippet,
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

async function callChatGPT(prompt) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 1000, temperature: 0.3 }),
  })
  const d = await r.json()
  return d.choices?.[0]?.message?.content ?? null
}

async function callGemini(prompt) {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash']
  for (const model of models) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
    )
    const d = await r.json()
    if (d.candidates?.[0]?.content?.parts?.[0]?.text) return d.candidates[0].content.parts[0].text
    if (r.status === 404) continue
    break
  }
  return null
}

async function callClaude(prompt) {
  // Routed through OpenRouter — no separate Anthropic key needed
  return callOpenRouter('anthropic/claude-haiku-4-5', prompt)
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
  chatgpt:    p => callChatGPT(p),
  gemini:     p => callGemini(p),
  claude:     p => callClaude(p),
  perplexity: p => callOpenRouter('perplexity/sonar', p),
  meta:       p => callOpenRouter('meta-llama/llama-3.3-70b-instruct', p),
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

  // Check which LLMs already have results this month (dedup guard)
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const { data: existing } = await supabase
    .from('ai_results')
    .select('llm')
    .eq('prompt_id', prompt_id)
    .eq('client_id', client_id)
    .gte('checked_at', monthStart.toISOString())

  const done = new Set((existing || []).map(r => r.llm))
  const toRun = Object.keys(LLM_CALLERS).filter(llm => !done.has(llm))

  if (toRun.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ skipped: true, prompt_id }) }
  }

  // Call all pending LLMs in parallel (20s timeout each)
  const settled = await Promise.allSettled(
    toRun.map(llm => withTimeout(LLM_CALLERS[llm](prompt_text), 20000))
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
      brand_mentioned:      analysis.brand_mentioned,
      brand_position:       analysis.brand_position,
      sentiment:            analysis.sentiment,
      response_snippet:     analysis.response_snippet,
      competitors_mentioned: analysis.competitors_mentioned,
      checked_at:           new Date().toISOString(),
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
