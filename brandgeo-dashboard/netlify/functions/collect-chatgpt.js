/**
 * collect-chatgpt.js
 * Dedicated Netlify function for ChatGPT-only collection.
 *
 * Runs in parallel with collect-prompt.js (fast engines) and collect-claude.js.
 * Having its own function gives ChatGPT the full 26s Netlify window -- gpt-5.5
 * with web_search_preview typically needs 20-25s for Romanian market queries.
 *
 * POST body (same shape as collect-prompt.js):
 *   { prompt_id, prompt_text, client_id, client_config, force?,
 *     market_label?, region_label?, market_id? }
 */

const { createClient } = require('@supabase/supabase-js')

// --- Geo context ------------------------------------------------------------------

function buildSystemContext(cfg, marketLabel, regionLabel) {
  let location = 'the relevant local market'

  if (marketLabel) {
    const hasSpecificRegion =
      regionLabel &&
      !regionLabel.startsWith('All ') &&
      regionLabel !== 'All regions' &&
      regionLabel !== 'All states' &&
      regionLabel !== 'All provinces' &&
      regionLabel !== 'All emirates'
    location = hasSpecificRegion ? `${regionLabel}, ${marketLabel}` : marketLabel
  } else {
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
    `You are a user based in ${location}. ` +
    `Answer as if you are that local user -- use local context and knowledge relevant to ${location}. ` +
    `Respond in the same language as the question.`
  )
}

// --- Text normalisation -----------------------------------------------------------

function normalizeText(t) {
  const safe = t.replace(/[\uD800-\uDFFF]/g, '')
  try {
    return safe.replace(/\s+/g, ' ').normalize('NFC')
  } catch {
    return safe.replace(/\s+/g, ' ')
  }
}

// --- Analysis helpers -------------------------------------------------------------

function extractTopRankedResults(text) {
  const items = []
  const listRe = /(?:^|\n)[^\d\n]{0,6}(\d+)[.)](?:\*{0,2})\s+([^\n]{2,120})/gm
  let m
  while ((m = listRe.exec(text)) !== null) {
    const pos = parseInt(m[1], 10)
    if (pos < 1 || pos > 10) continue
    let name = m[2].trim()
      .replace(/\*\*/g, '')
      .replace(/\*([^*]+)\*/g, '$1')
      .split(/\s*[--]\s+/)[0]
      .split(/\s*:\s+/)[0]
      .split(/\s*\((?!$)/)[0]
      .replace(/[.:,;!?\s]+$/, '')
      .trim()
    if (name.length >= 2 && name.length <= 80 && !items.some(x => x.pos === pos))
      items.push({ pos, name })
  }
  return items.sort((a, b) => a.pos - b.pos).slice(0, 5)
}

function matchesAlias(segment, aliases, aliasesStripped, website) {
  const sl  = segment.toLowerCase()
  const sls = sl.replace(/[\s\-_.]/g, '')
  return aliases.some(a => sl.includes(a)) ||
         aliasesStripped.some(a => a && sls.includes(a)) ||
         (website && sl.includes(website))
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
  if (brandInList)    position = brandInList.pos
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

// --- ChatGPT -- OpenAI Responses API with web_search_preview + geo ---------------
// gpt-5.5 with web search needs 20-25s for some markets. Dedicated 26s function
// gives it the full budget without racing against Gemini/Perplexity/Meta.

async function callChatGPT(prompt, ctx, marketId, regionLabel) {
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
      model:        'gpt-5.5',
      instructions: ctx,
      tools:        [{ type: 'web_search_preview', ...(userLocation ? { user_location: userLocation } : {}) }],
      input:        prompt,
    }),
  })
  const d = await r.json()
  if (d.error) { console.error('[ChatGPT] API error:', JSON.stringify(d.error)); return null }

  const text = (d.output || [])
    .filter(o => o.type === 'message')
    .flatMap(o => (o.content || []).filter(c => c.type === 'output_text').map(c => c.text))
    .join('\n')

  if (text) {
    console.log('[ChatGPT] location used:', userLocation || 'none (worldwide)', '| preview:', text.slice(0, 200))
  } else {
    console.warn('[ChatGPT] empty output -- full response:', JSON.stringify(d).slice(0, 500))
  }
  return text || null
}

// --- Handler ----------------------------------------------------------------------

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const { prompt_id, prompt_text, client_id, client_config, force, market_label, region_label, market_id } = body

  if (!prompt_id || !prompt_text || !client_id || !client_config)
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  console.log(`[ChatGPT/${invId}] prompt_id:${prompt_id} client_id:${client_id} force:${force}`)

  // For non-force: skip if ChatGPT already ran this month
  if (!force) {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { data: existing } = await supabase
      .from('ai_results').select('llm')
      .eq('prompt_id', prompt_id).eq('client_id', client_id).eq('llm', 'chatgpt')
      .gte('checked_at', monthStart.toISOString())
    if (existing?.length > 0) {
      console.log(`[ChatGPT/${invId}] already ran this month -- skipping`)
      return { statusCode: 200, body: JSON.stringify({ skipped: true, llm: 'chatgpt' }) }
    }
  }

  // For force: collect-prompt.js has already deleted all rows for this prompt.
  // Just run and insert.

  const ctx = buildSystemContext(client_config, market_label, region_label)
  const T0  = Date.now()
  const text = await callChatGPT(prompt_text, ctx, market_id, region_label)

  const elapsed = Date.now() - T0
  console.log(`[ChatGPT/${invId}] call finished in ${elapsed}ms`)

  if (!text) {
    console.warn(`[ChatGPT/${invId}] no text -- nothing saved`)
    return { statusCode: 200, body: JSON.stringify({ done: false, llm: 'chatgpt', reason: 'no_response' }) }
  }

  let analysis
  try { analysis = analyseResponse(text, client_config) }
  catch (e) {
    console.error(`[ChatGPT/${invId}] analyseResponse threw:`, e.message)
    return { statusCode: 200, body: JSON.stringify({ done: false, llm: 'chatgpt', reason: 'analysis_error' }) }
  }

  const { error: insErr } = await supabase.from('ai_results').insert([{
    prompt_id,
    llm:                   'chatgpt',
    client_id,
    brand_mentioned:       analysis.brand_mentioned,
    brand_position:        analysis.brand_position,
    sentiment:             analysis.sentiment,
    response_snippet:      analysis.response_snippet,
    competitors_mentioned: analysis.competitors_mentioned,
    checked_at:            new Date().toISOString(),
  }])

  if (insErr) {
    console.error(`[ChatGPT/${invId}] insert FAILED:`, insErr.message)
    return { statusCode: 200, body: JSON.stringify({ done: false, llm: 'chatgpt', reason: 'insert_error', detail: insErr.message }) }
  }

  console.log(`[ChatGPT/${invId}] saved | mentioned:${analysis.brand_mentioned} | position:${analysis.brand_position} | sentiment:${analysis.sentiment}`)
  return {
    statusCode: 200,
    body: JSON.stringify({ done: true, llm: 'chatgpt', summary: { brand_mentioned: analysis.brand_mentioned } }),
  }
}
