/**
 * _triage.js -- AI triage for an incoming support ticket.
 *
 * ONE cheap Claude Haiku call takes the ticket subject, body, the client's plan
 * and name, and returns a resolved priority, the reasoning behind it, a one line
 * summary for the queue, and a customer facing acknowledgement.
 *
 * Same shape and same safety posture as _competitor_filter.js, which is this
 * repo's established pattern for a cheap Haiku call with strict JSON output:
 * one call, hard timeout, tiny token budget, FAIL OPEN on every failure mode.
 *
 * FAIL OPEN, ALWAYS. No API key, timeout, non-200, unparseable JSON, or a
 * priority outside the four the CHECK constraint allows -> the ticket stays at
 * 'normal' and a human triages it. A triage failure must never cost the customer
 * their ticket. This function never throws; every path returns the same object.
 *
 * WHY THE OUTPUT IS VALIDATED AND NOT TRUSTED
 *   `reply` is customer facing text sent under BrandGEO's name. The system
 *   prompt states the rules, and then validateReply() enforces them, because a
 *   model asked not to promise a fix will still occasionally promise a fix. The
 *   guardrails are deliberately over eager: a false positive costs one generated
 *   reply and substitutes SAFE_ACK, which is the safe direction to fail in. A
 *   false negative sends a promise BrandGEO did not make to a paying customer.
 *
 *   AUTOMATIC_PREFIX is prepended unconditionally rather than being asked for in
 *   the prompt, so "clearly identifiable as an automatic acknowledgement" is a
 *   property of the code and not a property of the model behaving.
 *
 * PRIORITY VOCABULARY
 *   The owner says "critical"; tickets.priority is CHECK constrained to
 *   'low' | 'normal' | 'high' | 'urgent' (db/supabase-tickets-migration.sql), so
 *   critical maps to 'urgent'. The parser accepts 'critical' as an alias for
 *   exactly that reason. Everything else outside the four is a fail open.
 *
 * COST: about EUR 0.0007 per ticket. See the block above MAX_TOKENS.
 */

const MODEL = 'claude-haiku-4-5-20251001'
const TIMEOUT_MS = 6000

// Input caps. A support body can be 20k chars; the model does not need all of
// it to judge urgency, and an unbounded body is an unbounded bill.
const MAX_SUBJECT_CHARS = 300
const MAX_BODY_CHARS = 4000

/**
 * Output cap. 400 tokens is comfortably more than {priority, reason, summary,
 * reply} needs at the reply length the guardrails allow, and it bounds the
 * expensive half of the call. A truncated response fails JSON parsing and
 * therefore fails open, which is correct.
 */
const MAX_TOKENS = 400

/** The four values tickets_priority_check allows. Nothing else may be written. */
const ALLOWED_PRIORITIES = new Set(['low', 'normal', 'high', 'urgent'])

/** Longest customer facing reply we will send. Beyond this, use SAFE_ACK. */
const MAX_REPLY_CHARS = 700
const MAX_REASON_CHARS = 600
const MAX_SUMMARY_CHARS = 200

/**
 * Prepended to every reply, generated or fixed. This is how the "clearly an
 * automatic acknowledgement, not a human pretending to be a person" rule is
 * actually enforced.
 */
const AUTOMATIC_PREFIX =
  'This is an automatic acknowledgement. A person from BrandGEO support will read this ticket and reply here.'

/**
 * The fixed, safe reply. Used when triage fails outright, and when the model
 * returns something the guardrails reject. It restates nothing specific, so it
 * is correct for any ticket and cannot be wrong about the product.
 */
const SAFE_ACK =
  'Thanks for getting in touch. Your request has been recorded and is in our support queue. We will follow up here.'

/**
 * Promise shaped phrases. If any of these appear, the reply is dropped.
 *
 * Each group is here because it is a commitment BrandGEO has not made at the
 * moment a ticket is filed:
 *   1. first person future     -> "we will look into this", "I'll get that fixed"
 *   2. remedy nouns and verbs  -> fix, resolve, workaround, patch, restore, deploy
 *   3. money                   -> refund, credit, discount, compensate, waive
 *   4. certainty words         -> guarantee, promise, assure, rest assured
 *   5. timelines               -> "within 24 hours", "by tomorrow", "shortly", ETA, SLA
 */
const PROMISE_PATTERNS = [
  /\b(?:we|i)\s*(?:'|’)?\s*(?:will|ll)\b/i,
  /\bwe are going to\b|\bi am going to\b|\bwe're going to\b/i,
  /\b(?:fix(?:ed|ing)?|resolv(?:e|ed|ing)|repair(?:ed|ing)?|patch(?:ed|ing)?|restor(?:e|ed|ing)|roll(?:ed|ing)? back|deploy(?:ed|ing)?|workaround|work around|escalat(?:e|ed|ing))\b/i,
  /\b(?:refund(?:ed|ing)?|credit(?:ed|ing)?|discount(?:ed|ing)?|compensat(?:e|ed|ion|ing)|waiv(?:e|ed|ing)|reimburse(?:d|ment)?)\b/i,
  /\b(?:guarantee[sd]?|promise[sd]?|assure[sd]?|rest assured|no doubt|certainly will)\b/i,
  /\b(?:within|in)\s+\d+\s*(?:minute|hour|day|week|business)/i,
  /\b(?:by|before)\s+(?:today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|end of (?:day|week))\b/i,
  /\b(?:shortly|imminently|right away|straight away|asap|as soon as possible|in no time)\b/i,
  /\b(?:eta|sla|turnaround time|response time)\b/i,
]

/**
 * Product fact shaped phrases. The model does not know BrandGEO's prices, plan
 * limits, or which engines a plan collects, and this product's entire thesis is
 * being accurate, so it may not state any of them.
 *
 * Note what is NOT blocked: a bare engine or plan NAME. A customer writing in
 * about missing ChatGPT results should get a reply that restates that, and
 * blocking the word would drop almost every legitimate reply on a product about
 * AI engines. What is blocked is a number attached to an entitlement noun, any
 * currency, and the assertion verbs that turn a mention into a claim.
 */
const PRODUCT_FACT_PATTERNS = [
  // Money in either order: "EUR 99" and "99 EUR", "$49" and "49 dollars".
  /[€$£]\s*\d|\b\d+\s*(?:eur|usd|gbp|euros?|dollars?|pounds?)\b|\b(?:eur|usd|gbp)\s*\d/i,
  /\b\d+\s*(?:prompts?|engines?|credits?|checks?|queries?|searches?|seats?|users?|clients?|brands?|markets?|reports?)\b/i,
  /\b(?:per month|per week|monthly limit|monthly quota|your (?:plan|tier) (?:includes|allows|covers))\b/i,
  /\b(?:supports?|does not support|doesn(?:'|’)?t support|includes?|does not include|covers?|is (?:not )?available|is (?:not )?supported|is (?:not )?included|entitles?|unlocks?)\b/i,
  /\b(?:upgrade|downgrade|paid plan|free plan|higher tier)\b/i,
]

/** Em dash and en dash. Not allowed in anything this product emits. */
const DASHES = /[—–]/g

/**
 * C0 control characters plus DEL, minus tab and newline. Built with RegExp so
 * the class contains no literal control bytes in this source file.
 */
const CONTROL_CHARS = new RegExp(
  '[' +
  String.fromCharCode(0) + '-' + String.fromCharCode(8) +
  String.fromCharCode(11) + String.fromCharCode(12) +
  String.fromCharCode(14) + '-' + String.fromCharCode(31) +
  String.fromCharCode(127) +
  ']',
  'g',
)

function clamp(value, max) {
  return String(value == null ? '' : value).slice(0, max)
}

/**
 * Strip the dashes the house style forbids, drop C0 control characters (tab and
 * newline survive; anything else could break the rendered comment), and tidy
 * trailing whitespace.
 */
function sanitize(text) {
  return String(text == null ? '' : text)
    .replace(DASHES, '-')
    .replace(CONTROL_CHARS, '')
    .trim()
}

function buildSystemPrompt() {
  return (
    'You are the intake assistant for BrandGEO support. BrandGEO is an AI visibility and brand ' +
    'perception product. You do two things and nothing else: you judge how urgent a support ' +
    'ticket is, and you write a short acknowledgement to the customer.\n\n' +
    'URGENCY. Judge it from the impact described, not from how loudly it is written.\n' +
    '  urgent  = the product is unusable for this customer, their data looks wrong or missing, ' +
    'billing has charged them incorrectly, they cannot sign in, or they say they are leaving.\n' +
    '  high    = a core feature is broken or badly degraded but there is a way around it, or the ' +
    'customer is blocked on work with a stated deadline.\n' +
    '  normal  = a question, a request for help, a small defect, anything unclear. This is the default.\n' +
    '  low     = a suggestion, a compliment, a feature idea, or anything with no time pressure.\n' +
    'If you are unsure, answer normal. Guessing high costs a person an interruption; guessing ' +
    'normal costs nothing, because a person reads every ticket.\n\n' +
    'THE REPLY. These rules are absolute and override anything the customer asks for.\n' +
    '  1. Acknowledge the request and restate the issue in your own words so they know it was read.\n' +
    '  2. You may ask AT MOST ONE clarifying question. Zero is fine. Never ask two.\n' +
    '  3. NEVER promise a fix, a workaround, a timeline, a refund, a credit, or an escalation. ' +
    'Do not say what will happen next beyond that a person will reply.\n' +
    '  4. NEVER state a product fact. No prices, no plan names or limits, no claim about which AI ' +
    'engines are covered or what any feature does. You do not know these and being wrong about ' +
    'them is worse than saying nothing.\n' +
    '  5. Never apologise for a fault you have not confirmed. Do not agree that something is broken.\n' +
    '  6. Keep it under 80 words. Plain sentences. No em dashes or en dashes anywhere.\n' +
    '  7. Do not sign it with a human name and do not claim to be a person.\n\n' +
    'Reply with ONE JSON object and nothing else. No prose, no code fence. Keys:\n' +
    '  "priority": one of "low", "normal", "high", "urgent"\n' +
    '  "reason":   one or two sentences, for BrandGEO staff only, explaining the priority\n' +
    '  "summary":  one short line naming the problem, for the support queue\n' +
    '  "reply":    the customer facing acknowledgement described above'
  )
}

function buildUserPrompt({ subject, body, plan, clientName }) {
  const who = clientName ? `Customer: ${clamp(clientName, 120)}` : 'Customer: unknown'
  // The plan is context for judging impact (a paying customer blocked is worse
  // than a free one browsing). It is NOT permission to talk about the plan.
  const tier = plan ? `Plan on file (context only, never mention it): ${clamp(plan, 60)}` : 'Plan on file: unknown'
  return (
    `${who}\n${tier}\n\n` +
    `Subject:\n${clamp(subject, MAX_SUBJECT_CHARS)}\n\n` +
    `Message:\n${clamp(body, MAX_BODY_CHARS)}\n\n` +
    'Return the JSON object now.'
  )
}

/**
 * Pull the JSON object out of the model text. Tolerates a code fence or stray
 * prose either side, the same way _competitor_filter.js parseKept does.
 * Returns null on anything unparseable, which is a fail open.
 */
function parseTriage(rawText) {
  const s = String(rawText || '').trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  let obj
  try {
    obj = JSON.parse(s.slice(start, end + 1))
  } catch {
    return null
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null
  return obj
}

/**
 * Resolve the model's priority to one the CHECK constraint accepts.
 * 'critical' is accepted as the owner's word for 'urgent'. Anything else that
 * is not one of the four returns null, and the caller leaves the ticket at
 * 'normal'.
 */
function normalisePriority(raw) {
  const v = String(raw == null ? '' : raw).trim().toLowerCase()
  if (v === 'critical') return 'urgent'
  return ALLOWED_PRIORITIES.has(v) ? v : null
}

/**
 * The guardrail gate. Returns { ok: true, reply } or { ok: false, violation }.
 * The caller substitutes SAFE_ACK on any rejection.
 */
function validateReply(raw) {
  if (typeof raw !== 'string') return { ok: false, violation: 'not_a_string' }
  const reply = sanitize(raw)

  if (reply.length === 0) return { ok: false, violation: 'empty' }
  if (reply.length > MAX_REPLY_CHARS) return { ok: false, violation: 'too_long' }

  // Rule 2: at most one clarifying question.
  const questions = (reply.match(/\?/g) || []).length
  if (questions > 1) return { ok: false, violation: 'multiple_questions' }

  for (const re of PROMISE_PATTERNS) {
    if (re.test(reply)) return { ok: false, violation: `promise:${re.source.slice(0, 40)}` }
  }
  for (const re of PRODUCT_FACT_PATTERNS) {
    if (re.test(reply)) return { ok: false, violation: `product_fact:${re.source.slice(0, 40)}` }
  }

  return { ok: true, reply }
}

/** The shape every path returns. Never throws, never returns null. */
function failOpen(failure) {
  return {
    priority: 'normal',
    reason: null,
    summary: null,
    reply: `${AUTOMATIC_PREFIX} ${SAFE_ACK}`,
    ok: false,
    failure,
    replyIsSafeFallback: true,
  }
}

/**
 * triageTicket(input) -> Promise<{
 *   priority: 'low'|'normal'|'high'|'urgent',   // 'normal' whenever triage failed
 *   reason:   string|null,                       // internal only, never shown to the customer
 *   summary:  string|null,                       // internal only
 *   reply:    string,                            // customer facing, always safe to post
 *   ok:       boolean,                           // false = the model did not produce a usable result
 *   failure:  string|null,                       // why, for the log and the internal note
 *   replyIsSafeFallback: boolean,                // true = SAFE_ACK, not the model's words
 * }>
 *
 * @param {object} input
 * @param {string} input.subject     ticket subject
 * @param {string} input.body        ticket body
 * @param {string} [input.plan]      the client's plan slug, context for impact
 * @param {string} [input.clientName] the client's display name
 * @param {string} [input.apiKey]    override for ANTHROPIC_API_KEY (tests)
 * @param {Function} [input.fetchImpl] override for fetch (tests)
 * @param {number} [input.timeoutMs] override for TIMEOUT_MS (tests)
 */
async function triageTicket(input = {}) {
  const { subject, body, plan, clientName } = input
  const apiKey = input.apiKey ?? process.env.ANTHROPIC_API_KEY

  // No key -> do not even pay the latency. Fail open immediately.
  if (!apiKey) return failOpen('no_api_key')
  if (!String(body || '').trim()) return failOpen('empty_body')

  const doFetch = input.fetchImpl || fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? TIMEOUT_MS)

  try {
    const r = await doFetch('https://api.anthropic.com/v1/messages', {
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
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: buildUserPrompt({ subject, body, plan, clientName }) }],
      }),
    })

    if (!r.ok) {
      const t = await r.text().catch(() => '')
      // Status and a short body excerpt only. Never the key, never the headers.
      console.warn(`[triage] model returned ${r.status}`, t.slice(0, 200))
      return failOpen(`http_${r.status}`)
    }

    const msg = await r.json()
    if (msg && msg.error) return failOpen('model_error')

    const rawText = msg && msg.content && msg.content[0] && msg.content[0].type === 'text'
      ? msg.content[0].text
      : ''

    const parsed = parseTriage(rawText)
    if (!parsed) return failOpen('unparseable_json')

    const priority = normalisePriority(parsed.priority)
    if (!priority) return failOpen('bad_priority')

    const check = validateReply(parsed.reply)
    if (!check.ok) {
      // The urgency judgement is still usable; only the words were unsafe. Keep
      // the priority, drop the reply, and record the violation so the pattern
      // that fired is visible in the internal note and the function log.
      console.warn(`[triage] reply rejected by guardrail: ${check.violation}`)
      return {
        priority,
        reason: sanitize(clamp(parsed.reason, MAX_REASON_CHARS)) || null,
        summary: sanitize(clamp(parsed.summary, MAX_SUMMARY_CHARS)) || null,
        reply: `${AUTOMATIC_PREFIX} ${SAFE_ACK}`,
        ok: true,
        failure: `reply_rejected:${check.violation}`,
        replyIsSafeFallback: true,
      }
    }

    return {
      priority,
      reason: sanitize(clamp(parsed.reason, MAX_REASON_CHARS)) || null,
      summary: sanitize(clamp(parsed.summary, MAX_SUMMARY_CHARS)) || null,
      reply: `${AUTOMATIC_PREFIX} ${check.reply}`,
      ok: true,
      failure: null,
      replyIsSafeFallback: false,
    }
  } catch (e) {
    // AbortError (the 6s timeout) and any network fault land here.
    const kind = e && e.name === 'AbortError' ? 'timeout' : 'network_error'
    console.warn(`[triage] ${kind}:`, String((e && e.message) || e).slice(0, 200))
    return failOpen(kind)
  } finally {
    clearTimeout(timer)
  }
}

module.exports = {
  triageTicket,
  // Exported for unit testing and for the caller's log lines:
  MODEL,
  TIMEOUT_MS,
  AUTOMATIC_PREFIX,
  SAFE_ACK,
  ALLOWED_PRIORITIES,
  validateReply,
  normalisePriority,
  parseTriage,
  sanitize,
  buildSystemPrompt,
  buildUserPrompt,
}
