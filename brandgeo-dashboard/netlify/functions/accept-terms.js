/**
 * accept-terms.js
 * The only thing that knows a Stripe checkout URL (ROADMAP.md Stream C item C3).
 *
 * POST { plan, period, accepted, accepted_version, honeypot? }
 *   -> 200 { ok: true, url }   after recording a terms_acceptances row
 *   -> 403 { error, reason }   when the contract was not accepted
 *   -> 500 { error }           when the acceptance could not be recorded
 *
 * WHY AN ENDPOINT AT ALL. Before this, the six live payment links sat in
 * brandgeo/web/site.js and were served to every visitor, so no client-side gate
 * could have been more than a suggestion: the destination was in the page.
 * Moving the links behind this function is what makes the gate real. The buyer's
 * browser learns the URL only in the response to a request that carried an
 * acceptance, and the decision itself lives in _terms_gate.js, which is pure and
 * is exercised directly by scripts/check-contract-gate.sh.
 *
 * FAIL CLOSED, IN BOTH DIRECTIONS. If the acceptance cannot be written, no URL
 * is returned, even though the gate would otherwise have allowed it. A checkout
 * that proceeds without evidence is the exact state C3 exists to end, and the
 * cost of the refusal is one retry by a buyer who is still on the page. This is
 * the opposite trade to the audit endpoints, which degrade gracefully because
 * nothing there is a contract.
 *
 * WHAT IT DOES NOT DO. It does not create a Stripe object, take a payment, or
 * touch provisioning: the payment links are ordinary Stripe Payment Links and
 * stripe-webhook.js still owns everything after the money moves. The acceptance
 * `reference` rides along as client_reference_id so the two can be matched later
 * from Stripe's own dashboard. Consuming it in the webhook is a separate change
 * on the provisioning path and is deliberately not made here.
 */

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const { corsHeaders, preflight, err, hashIp, PUBLIC_ALLOWED_ORIGINS } = require('./_prospect_guard')
const { resolveCheckout, withReference, TERMS_VERSION } = require('./_terms_gate')

// Affiliate fields are optional and shape-checked only: a code is 3 to 32
// [A-Z0-9_-] characters, a visit token is base64url up to 64 characters, a
// program slug is lowercase [a-z0-9-] up to 40. Anything else becomes null,
// never an error: a bad affiliate cookie must not block a purchase.
const AFF_CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/
const AFF_TOKEN_RE = /^[A-Za-z0-9_-]{8,64}$/
const AFF_SLUG_RE = /^[a-z0-9][a-z0-9-]{1,39}$/
function readAffiliateRef(body) {
  const code = String(body.affiliate_ref || '').trim().toUpperCase()
  const visit = String(body.affiliate_visit || '').trim()
  const program = String(body.affiliate_program || '').trim().toLowerCase()
  return {
    code: AFF_CODE_RE.test(code) ? code : null,
    visit: AFF_TOKEN_RE.test(visit) ? visit : null,
    program: AFF_SLUG_RE.test(program) ? program : null,
  }
}
exports.readAffiliateRef = readAffiliateRef

exports.handler = async (event) => {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(origin), body: 'Method Not Allowed' }
  if (origin && !PUBLIC_ALLOWED_ORIGINS.includes(origin)) return err(403, 'Forbidden: origin not allowed', origin)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return err(400, 'Invalid JSON', origin) }

  // Same convention as unlock-audit-report.js: answer a bot with a shape that
  // looks like success and contains nothing. Note what is NOT here -- no url.
  if (body.honeypot) {
    return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ ok: true }) }
  }

  const decision = resolveCheckout({
    plan: body.plan,
    period: body.period,
    accepted: body.accepted,
    acceptedVersion: body.accepted_version,
  })

  if (!decision.ok) {
    console.warn(`[AcceptTerms] refused: ${decision.reason} (${decision.detail})`)
    // 403, not 400: this is a refusal to act, not a malformed request. The
    // reason is returned so the page can tell a buyer holding a stale tab to
    // reload rather than press the button again.
    return {
      statusCode: 403,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'Please accept the current Terms and Conditions to continue.', reason: decision.reason }),
    }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const reference = crypto.randomUUID()

  // Affiliate attribution (2026-09-12). The tracking snippet on getbrandgeo.com
  // (affiliate-track.js) adds these three fields when the visitor arrived via
  // an /r/ link. They are validated by shape only and stored on the acceptance
  // row; stripe-webhook.js reads them back through client_reference_id when
  // the payment lands (_affiliate_stripe.js resolveContext). Nothing here
  // decides who gets paid: that is the server-side conversion path.
  const affiliate = readAffiliateRef(body)

  const { error: insErr } = await supabase.from('terms_acceptances').insert([{
    reference,
    terms_version: decision.version,
    plan: decision.plan,
    period: decision.period,
    // Not collected at the gate today; the column exists so that changing our
    // mind costs no migration. See the migration header.
    email: null,
    requester_ip_hash: hashIp(event),
    user_agent: String(event.headers['user-agent'] || '').slice(0, 500),
    origin: origin || null,
    affiliate_code: affiliate.code,
    affiliate_visit_token: affiliate.visit,
    affiliate_program: affiliate.program,
  }])

  if (insErr) {
    // No row, no URL. See "fail closed" above: this is the whole point of the
    // endpoint, so it must not degrade into handing the link over anyway.
    console.error('[AcceptTerms] could not record acceptance:', insErr.message)
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'We could not record your acceptance just now. Please try again.' }),
    }
  }

  console.log(`[AcceptTerms] ${decision.plan}/${decision.period} v${TERMS_VERSION} ref:${reference}`)

  return {
    statusCode: 200,
    headers: corsHeaders(origin),
    body: JSON.stringify({ ok: true, url: withReference(decision.url, reference), reference }),
  }
}
