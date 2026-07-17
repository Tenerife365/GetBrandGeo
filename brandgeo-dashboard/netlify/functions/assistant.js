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

const MODEL = 'claude-haiku-4-5-20251001'
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
`You are the BrandGEO assistant — a concise, honest product specialist on the BrandGEO marketing website (getbrandgeo.com). BrandGEO is an AI Visibility / Generative Engine Optimization (GEO) monitoring platform.

YOUR JOB
- Answer questions about BrandGEO accurately: what it does, the AI Visibility Score, the five engines, pricing tiers, the free audit, methodology, research.
- Help a visitor start the free audit, talk to sales, or (if they're an existing customer) reach support.

VOICE
- First person singular ("I"). Name yourself only if it's natural; don't repeat it.
- Short sentences, plain words. Confident but honest. Never hypey, never pushy, no fake urgency.
- No emoji in your prose.
- Always leave a human hand-off available; never gatekeep.

HARD RULES (do not break these)
- Answer ONLY from the GROUNDED FACTS below and the conversation. If something isn't in the facts (a price, a claim, a feature, a testimonial), say you can't confirm it and offer to connect them with the team. NEVER guess or invent pricing, numbers, case studies, or testimonials.
- Stay on topic: BrandGEO and AI visibility. Politely decline unrelated requests and steer back.
- Keep replies short — usually 1-4 sentences. Link with plain URLs from the facts when useful.

STRUCTURED ACTIONS
Reply as a single JSON object and nothing else:
{"reply": "<your message to the visitor>", "action": <null or an action object>}
Emit an action ONLY when the visitor clearly wants that next step:
- Free audit: once you have a domain, {"type":"start_audit","domain":"<their-domain.com>"}. If they want the audit but haven't given a domain, ask for it in "reply" and keep action null.
- Talk to sales / book a call / "email me" / a demo: {"type":"capture_lead","reason":"sales"}. Put a one-line lead-in in "reply" (e.g. that you'll grab a few details).
- Existing customer needing help: {"type":"route_support"}.
Otherwise action is null. Never emit more than one action. Keep "reply" natural — the widget shows buttons for the action, so don't dump raw URLs for it.

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

/** Tolerantly parse the model's JSON object; validate the action shape. */
function parseModelReply(text) {
  const fallback = { reply: String(text || '').trim(), action: null }
  let s = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = s.indexOf('{'), end = s.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return fallback
  let obj
  try { obj = JSON.parse(s.slice(start, end + 1)) } catch { return fallback }
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
  return { reply: obj.reply.trim() || fallback.reply, action }
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
    return { statusCode: 200, headers, body: JSON.stringify({ reply: HUMAN_FALLBACK, action: null }) }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })
    if (!r.ok) {
      console.error('[Assistant] Anthropic non-200:', r.status)
      return { statusCode: 200, headers, body: JSON.stringify({ reply: HUMAN_FALLBACK, action: null }) }
    }
    const msg = await r.json()
    if (msg?.error) {
      console.error('[Assistant] Anthropic error body:', JSON.stringify(msg.error).slice(0, 200))
      return { statusCode: 200, headers, body: JSON.stringify({ reply: HUMAN_FALLBACK, action: null }) }
    }
    const rawText = msg?.content?.[0]?.type === 'text' ? msg.content[0].text : ''
    const parsed = parseModelReply(rawText)
    if (!parsed.reply) parsed.reply = HUMAN_FALLBACK
    return { statusCode: 200, headers, body: JSON.stringify(parsed) }
  } catch (e) {
    console.error('[Assistant] call threw:', e.message)
    return { statusCode: 200, headers, body: JSON.stringify({ reply: HUMAN_FALLBACK, action: null }) }
  } finally {
    clearTimeout(timer)
  }
}

// Exported for unit testing (no network involved).
module.exports.parseModelReply = parseModelReply
module.exports.sanitizeMessages = sanitizeMessages
