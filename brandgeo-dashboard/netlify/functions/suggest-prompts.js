/**
 * suggest-prompts.js - AI Discover, the prompt suggestion helper behind
 * Prompts.tsx.
 *
 * WHAT THIS USED TO BE, and why it had to change (2026-07-29 audit):
 *
 *     const auth = await requireAuth(event)
 *     ...
 *     body: JSON.stringify({
 *       model: 'gpt-4o-mini',
 *       messages: body.messages,            // caller-supplied, verbatim
 *       max_tokens: body.max_tokens ?? 800  // caller-supplied, unclamped
 *     })
 *
 * That is not a prompt suggester, it is an OpenAI proxy on BrandGEO's key. The
 * caller chose the entire conversation AND the output length, requireAuth was
 * called with no clientId so checkCollectionLimits never ran, and nothing
 * counted calls. Any authenticated account could send arbitrary chat traffic,
 * indefinitely, at our expense. That includes free-tier signups, and a
 * competitor has already self-served onto the free tier once.
 *
 * FOUR THINGS CLOSE IT, layered deliberately rather than as one check:
 *
 *   1. THE SYSTEM PROMPT IS BUILT HERE, not accepted. Any system message the
 *      caller sends is dropped. This is what turns the endpoint back into a
 *      prompt suggester: you can no longer instruct the model to be anything
 *      else. It is the single most important line in this file.
 *   2. Conversation size is bounded, in turns and in characters.
 *   3. max_tokens is clamped server-side.
 *   4. A per-client daily call cap, counted in assistant_events, which already
 *      exists and already carries a `kind` discriminator, so this needs no
 *      migration.
 *
 * The cap fails OPEN on a counting error, matching assistant-lead.js: a broken
 * counter should not stop a paying customer using a feature. The other three
 * bounds fail closed and are what actually limit spend.
 *
 * The system prompt also now forbids naming the client's own brand. The audit
 * found one paying account whose entire visibility score came from a single
 * prompt naming the customer, which guarantees a mention and measures nothing.
 * _prospect_prompts.js has always forbidden this for anonymous prospects; there
 * was no reason for the paying path to be laxer than the free one.
 */
const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')

const MODEL           = 'gpt-4o-mini'
const MAX_TOKENS_CAP  = 1200      // hard ceiling, whatever the caller asks for
const MAX_TURNS       = 12        // a discovery chat, not a long conversation
const MAX_TOTAL_CHARS = 12000     // across all forwarded turns
const MAX_TURN_CHARS  = 4000
const DAILY_CALL_CAP  = 40        // per client per day

// Built here so the caller cannot replace it. Deliberately close to what
// Prompts.tsx used to send, so the legitimate UX is unchanged.
function systemPrompt(brand, website) {
  return (
`You are an AI visibility monitoring expert. Your task: generate prompts (search queries) that real users type into AI assistants such as ChatGPT, Perplexity, Gemini and Claude when looking for products or services.

${brand ? `Business: ${brand}` : ''}
${website ? `Website: ${website}` : ''}

Rules:
1. Generate 8 to 12 prompts that sound like natural human searches, NOT marketing copy.
2. Write in the language the business operates in, inferred from the brand name and website.
3. Match the REAL scale and niche of this business.
4. NEVER include the business's own brand name in a prompt. A prompt that names the brand guarantees a mention and measures nothing.
5. Cover several angles: discovery, comparison, use case, local or geographic, and price or value.
6. Assign a category to each prompt: general, local, comparison, or use_case.

Respond with ONLY a valid JSON array, no markdown and no commentary:
[{ "text": "prompt text here", "category": "general" }]`
  )
}

exports.handler = async (event) => {
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: auth.headers,
      body: JSON.stringify({ error: 'OpenAI API key not configured on server' })
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' }
  }

  const json = (statusCode, obj) =>
    ({ statusCode, headers: auth.headers, body: JSON.stringify(obj) })

  // Scoped to the caller's OWN client from their verified profile, never from
  // the request body.
  const clientId = auth.profile ? auth.profile.client_id : null
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // assistant_events.ip_hash is NOT NULL and is the column its existing
  // composite index (ip_hash, kind, created_at DESC) is built on. For an
  // AUTHENTICATED endpoint the meaningful subject is the client, not an IP, so
  // the client id is written into that column with a prefix that makes the
  // difference obvious to anyone reading the table. Using it rather than a
  // jsonb `contains` on meta also means the cap query hits the index instead of
  // scanning, and it satisfies the NOT NULL that would otherwise have made
  // every log insert fail and the cap silently never fire.
  const subject = `client:${clientId === null || clientId === undefined ? 'none' : clientId}`

  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const { count } = await supabase
      .from('assistant_events')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', subject)
      .eq('kind', 'suggest_prompts')
      .gte('created_at', since)
    if (count !== null && count >= DAILY_CALL_CAP) {
      return json(429, {
        error: `Prompt suggestions are limited to ${DAILY_CALL_CAP} per day. Add the ones you already have, or contact support@getbrandgeo.com.`
      })
    }
  } catch (e) {
    // Fail open, same as assistant-lead.js. The bounds below are the real limit.
    console.warn('[SuggestPrompts] rate-limit check failed (continuing):', e.message)
  }

  // ── Bound the conversation ──────────────────────────────────────────────────
  const incoming = Array.isArray(body.messages) ? body.messages : []
  let total = 0
  const turns = []
  for (const m of incoming) {
    if (!m || typeof m.content !== 'string') continue
    // A caller-supplied system message is DROPPED, never forwarded. This is the
    // line that stops the endpoint being a general-purpose model proxy.
    const role = m.role === 'assistant' ? 'assistant' : 'user'
    const content = m.content.slice(0, MAX_TURN_CHARS)
    if (total + content.length > MAX_TOTAL_CHARS) break
    total += content.length
    turns.push({ role, content })
  }
  const recent = turns.slice(-MAX_TURNS)
  if (recent.length === 0) {
    return json(400, { error: 'Describe your business so we can suggest prompts.' })
  }

  const maxTokens = Math.min(
    Math.max(parseInt(body.max_tokens, 10) || 800, 100),
    MAX_TOKENS_CAP
  )

  const messages = [
    {
      role: 'system',
      content: systemPrompt(
        typeof body.brand === 'string' ? body.brand.slice(0, 200) : '',
        typeof body.website === 'string' ? body.website.slice(0, 200) : ''
      ),
    },
    ...recent,
  ]

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens })
  })

  const data = await res.json()

  // Record the call so the cap above can see it. Best effort: a failed log must
  // not fail a request the customer has already waited for.
  try {
    await supabase.from('assistant_events').insert([{
      ip_hash: subject,
      kind: 'suggest_prompts',
      meta: {
        client_id: clientId,
        user_id: auth.user ? auth.user.id : null,
        turns: recent.length,
        chars: total,
        max_tokens: maxTokens,
        status: res.status,
      },
    }])
  } catch (e) {
    console.warn('[SuggestPrompts] usage log failed:', e.message)
  }

  return { statusCode: res.status, headers: auth.headers, body: JSON.stringify(data) }
}
