/**
 * assistant.js — PUBLIC site chat assistant (ASSISTANT-SPEC.md).
 *
 * A top-of-funnel concierge for getbrandgeo.com: answers questions about
 * BrandGEO grounded ONLY in _assistant_kb.js, and can emit a structured
 * `action` the widget acts on (start the free audit, capture a sales lead,
 * route an existing customer to support).
 *
 * PUBLIC + UNAUTHENTICATED by design (anonymous marketing-site visitors), so
 * it does NOT use _auth.js's authenticated-origin lock. It reuses the public
 * guard helpers instead (CORS allow-list already includes getbrandgeo.com,
 * per-IP hashing) — same posture as audit-domain.js.
 *
 * CONTRACT
 *   POST /.netlify/functions/assistant
 *   Body: { messages: [{ role: 'user'|'assistant', content: string }, ...], honeypot?: string }
 *   200:  { reply: string, action: null | { type, ... } }
 *         action.type ∈ 'start_audit' { domain } | 'capture_lead' { reason } | 'route_support'
 *   429:  { error } when the per-IP daily cap is hit.
 *
 * FAIL-CLOSED: any missing key / non-200 / timeout / parse failure returns a
 * 200 with a helpful "reach the team" reply — never a broken chat (mirrors the
 * audit widget's fail-to-a-working-path pattern). Abuse is bounded by a per-IP
 * daily message cap (server-side, the real free-Claude-proxy guard) plus a
 * short bounded context and max_tokens.
 */

const { createClient } = require('@supabase/supabase-js')
const { corsHeaders, preflight, hashIp } = require('./_prospect_guard')
const { ASSISTANT_KB } = require('./_assistant_kb')

const HAIKU_MODEL  = 'claude-haiku-4-5-20251001' // default: fast, cheap, grounded lookups
const SONNET_MODEL = 'claude-sonnet-5'           // "hot" leads: consultative depth (gated by body.hot)
const TIMEOUT_MS = 18000       // inside Netlify's 26s window, with headroom
const MAX_TOKENS = 700
const MAX_HISTORY = 14         // last N turns kept — bounds context/cost
const MAX_CONTENT_CHARS = 2000 // per-message truncation
const DAILY_MSG_CAP = 40       // per-IP/day — free-Claude-proxy guard

// Human hand-off text reused by every fail-closed / error path.
const HUMAN_FALLBACK =
  "Sorry — I couldn't reach my knowledge base just now. You can email the team " +
  'at support@getbrandgeo.com, or tap "Talk to a human" and I\'ll pass your ' +
  'details along.'

const SYSTEM_PROMPT =
`You are Jamie, the BrandGEO assistant — a concise, honest product specialist on the BrandGEO marketing website (getbrandgeo.com). BrandGEO is an AI Visibility / Generative Engine Optimization (GEO) monitoring platform.

YOUR JOB
- Answer questions about BrandGEO accurately: what it does, the AI Visibility Score, the five engines, pricing tiers, the free audit, methodology, research.
- Help a visitor start the free audit, talk to sales, or (if they're an existing customer) reach support.

VOICE
- First person singular ("I"). You're Jamie — introduce yourself by name once at the start when it fits naturally, then don't keep repeating it. You are an AI assistant; never pretend to be a person, and when you hand someone to sales or support, that's the human team taking over.
- Short sentences, plain words. Confident but honest. Never hypey, never pushy, no fake urgency.
- No emoji in your prose.
- Always leave a human hand-off available; never gatekeep.
- PLAIN CONVERSATIONAL TEXT ONLY. The chat window does not render markdown, so never use asterisks, bold, headings (#), or bullet-point lists — they show up as raw symbols. If you list a few items, write them in a short sentence separated by commas, or on separate lines with no bullet markers.

HARD RULES (do not break these)
- Answer ONLY from the GROUNDED FACTS below and the conversation. If something isn't in the facts (a price, a claim, a feature, a testimonial), say you can't confirm it and offer to connect them with the team. NEVER guess or invent pricing, numbers, case studies, or testimonials.
- Stay on topic: BrandGEO and AI visibility. Politely decline unrelated requests and steer back.
- Keep replies short — usually 1-4 sentences. Link with plain URLs from the facts when useful.
- For a broad "what does it cost / what are your plans" question, give a SHORT plain-text overview — the three self-serve tiers (Free, Essentials, Growth; €0 to €299/month) and the three managed tiers (Managed, Pro, Enterprise; done-for-you, from €900/month) — then offer the pricing page (https://getbrandgeo.com/#pricing) or to dig into whichever tier fits. Do NOT reproduce every tier's full feature list unless they ask about a specific tier.

STRUCTURED OUTPUT
Reply as a single JSON object and nothing else:
{"reply": "<your message to the visitor>", "action": <null or an action object>, "intent": "browsing" | "considering" | "hot"}

ACTIONS — emit ONLY when the visitor clearly wants that next step:
- Free audit: once you have a domain, {"type":"start_audit","domain":"<their-domain.com>"}. If they want the audit but haven't given a domain, ask for it in "reply" and keep action null.
- Talk to sales / book a call / "email me" / a demo: {"type":"capture_lead","reason":"sales"}. Put a one-line lead-in in "reply" (e.g. that you'll grab a few details).
- Existing customer needing help: {"type":"route_support"}.
Otherwise action is null. Never emit more than one action. Keep "reply" natural — the widget shows buttons for the action, so don't dump raw URLs for it.

INTENT — honestly classify THIS visitor's buying readiness from the whole conversation so far:
- "browsing": general or early questions — what GEO is, how it works, definitions, curiosity. Most visitors are here.
- "considering": actively evaluating — comparing tiers, asking pricing detail, weighing you against a competitor, asking whether it fits their specific business.
- "hot": strong buying signals — asking for a demo or a call, asking specifically about Pro/Enterprise or the managed (done-for-you) service, mentioning a budget, a timeline, multiple brands or countries, or how to get started / sign up for a paid plan. When intent is "hot", proactively offer to connect them with the team (a quick call or an email follow-up) and, if they agree, emit capture_lead.
Be honest — never inflate intent. Only mark "hot" on genuine buying signals; when unsure, use the lower level.

GROUNDED FACTS
${ASSISTANT_KB}`

/** Keep only well-formed user/assistant turns, bounded in count and length. */
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map(m => ({ role: m.role, content: m.content.trim().slice(0, MAX_CONTENT_CHARS) }))
}

const VALID_ACTIONS = new Set(['start_audit', 'capture_lead', 'route_support'])
const VALID_REASONS = new Set(['sales', 'audit', 'support'])
const VALID_INTENTS = new Set(['browsing', 'considering', 'hot'])

/**
 * Extract the FIRST brace-balanced JSON object from a string, ignoring any
 * trailing junk the model appends after it (Haiku occasionally emits e.g.
 * `{...}"}` or a stray `</...>` tag after the object). Tracks string/escape
 * state so a `}` inside a quoted value doesn't close the object early.
 */
function firstJsonObject(s) {
  const start = s.indexOf('{')
  if (start === -1) return null
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < s.length; i++) {
    const ch = s[i]
    if (esc) { esc = false; continue }
    if (ch === '\\') { if (inStr) esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) return s.slice(start, i + 1) }
  }
  return null
}

/**
 * Last-resort recovery: pull the "reply" string value straight out of a
 * malformed envelope with a regex, so a raw {"reply": ...} blob can NEVER be
 * shown to the visitor. Falls back to the raw text only if there's no envelope.
 */
function recoverReply(raw) {
  const m = raw.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (m) {
    try { return JSON.parse('"' + m[1] + '"') } catch { return m[1] }
  }
  return raw
}

/** Tolerantly parse the model's JSON object; validate the action shape. */
function parseModelReply(text) {
  const raw = String(text || '').trim()
  const fallback = { reply: recoverReply(raw).trim(), action: null, intent: null }
  let s = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const jsonStr = firstJsonObject(s)
  if (!jsonStr) return fallback
  let obj
  try { obj = JSON.parse(jsonStr) } catch { return fallback }

  // Unwrap accidental double-encoding: {"reply":"{\"reply\":\"...\",\"action\":...}"}
  let guard = 0
  while (obj && typeof obj.reply === 'string' && /^\s*\{\s*"reply"\s*:/.test(obj.reply) && guard < 3) {
    const inner = firstJsonObject(obj.reply)
    if (!inner) break
    try { obj = JSON.parse(inner) } catch { break }
    guard++
  }
  if (!obj || typeof obj.reply !== 'string') return fallback

  let action = null
  const a = obj.action
  if (a && typeof a === 'object' && VALID_ACTIONS.has(a.type)) {
    if (a.type === 'start_audit') {
      const domain = typeof a.domain === 'string'
        ? a.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
        : ''
      // Only trust an action with a plausible domain; otherwise drop it and let the reply ask.
      if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) {
        action = { type: 'start_audit', domain }
      }
    } else if (a.type === 'capture_lead') {
      action = { type: 'capture_lead', reason: VALID_REASONS.has(a.reason) ? a.reason : 'sales' }
    } else {
      action = { type: 'route_support' }
    }
  }
  const intent = VALID_INTENTS.has(obj.intent) ? obj.intent : null
  return { reply: obj.reply.trim() || fallback.reply, action, intent }
}

/**
 * One Anthropic Messages call with a bounded timeout. Returns the parsed
 * {reply, action, intent} on success, or null on ANY failure (non-200, error
 * body, timeout, throw, empty reply) so the caller can fall back to another model.
 */
async function callAnthropic(model, apiKey, messages, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: MAX_TOKENS, system: SYSTEM_PROMPT, messages }),
    })
    if (!r.ok) { console.error(`[Assistant] ${model} non-200:`, r.status); return null }
    const msg = await r.json()
    if (msg?.error) { console.error(`[Assistant] ${model} error body:`, JSON.stringify(msg.error).slice(0, 200)); return null }
    const rawText = msg?.content?.[0]?.type === 'text' ? msg.content[0].text : ''
    const parsed = parseModelReply(rawText)
    return parsed.reply ? parsed : null
  } catch (e) {
    console.error(`[Assistant] ${model} threw:`, e.message)
    return null
  } finally {
    clearTimeout(timer)
  }
}

exports.handler = async (event) => {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  const headers = corsHeaders(origin)

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  let body
  try { body = JSON.parse(event.body || '{}') } catch { body = {} }

  // Honeypot: a hidden field only a bot fills. Silently return a benign reply.
  if (body.honeypot) {
    return { statusCode: 200, headers, body: JSON.stringify({ reply: 'Thanks!', action: null }) }
  }

  const messages = sanitizeMessages(body.messages)
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No message provided.' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const ipHash = hashIp(event)

  // ── Per-IP daily cap: the real server-side free-proxy guard ────────────────
  try {
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString()
    const { count } = await supabase
      .from('assistant_events')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('kind', 'message')
      .gte('created_at', dayAgo)
    if (count !== null && count >= DAILY_MSG_CAP) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          reply: "We've hit today's chat limit from your connection. You can email the team any time at support@getbrandgeo.com.",
          action: null,
        }),
      }
    }
  } catch (e) {
    // Rate-limit store unreachable — fail OPEN on the limiter (don't block a real
    // visitor over an infra hiccup); the model call below is still bounded.
    console.warn('[Assistant] rate-limit check failed (continuing):', e.message)
  }

  // Best-effort log of this turn (used only for rate-limiting; not awaited-critical).
  supabase.from('assistant_events').insert([{ ip_hash: ipHash, kind: 'message' }])
    .then(({ error }) => { if (error) console.warn('[Assistant] event log failed:', error.message) })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[Assistant] ANTHROPIC_API_KEY not set — returning fail-closed fallback')
    return { statusCode: 200, headers, body: JSON.stringify({ reply: HUMAN_FALLBACK, action: null, intent: null }) }
  }

  // Model routing: once a conversation has gone "hot" (the client echoes back
  // hot:true after any turn we classified hot), the senior specialist — Sonnet 5 —
  // takes over for consultative depth. Everyone else stays on fast/cheap Haiku.
  const hot = body.hot === true
  let parsed = null
  let usedModel = HAIKU_MODEL

  if (hot) {
    // Try the senior model first (shorter budget so a Haiku fallback still fits
    // inside Netlify's 26s window), then fall back to Haiku — a HOT lead must
    // never hit the dead-end human-fallback just because Sonnet is unavailable.
    usedModel = SONNET_MODEL
    parsed = await callAnthropic(SONNET_MODEL, apiKey, messages, 14000)
    if (!parsed) {
      console.warn('[Assistant] senior model failed — falling back to Haiku')
      usedModel = HAIKU_MODEL
      parsed = await callAnthropic(HAIKU_MODEL, apiKey, messages, 10000)
    }
  } else {
    parsed = await callAnthropic(HAIKU_MODEL, apiKey, messages, TIMEOUT_MS)
  }

  if (!parsed) {
    return { statusCode: 200, headers, body: JSON.stringify({ reply: HUMAN_FALLBACK, action: null, intent: null }) }
  }
  console.log(`[Assistant] model:${usedModel} intent:${parsed.intent || 'none'} action:${parsed.action?.type || 'none'}`)
  return { statusCode: 200, headers, body: JSON.stringify(parsed) }
}

// Exported for unit testing (no network involved).
module.exports.parseModelReply = parseModelReply
module.exports.sanitizeMessages = sanitizeMessages
