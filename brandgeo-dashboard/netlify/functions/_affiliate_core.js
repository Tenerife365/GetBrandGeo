/**
 * _affiliate_core.js -- the pure rules of the affiliate module.
 *
 * No I/O, no Supabase, no env, no clock (every function that needs "now" takes
 * it as an argument). Same reasoning as _terms_gate.js and _package_checkout.js:
 * this decides how much money an affiliate is owed, so it has to be exercisable
 * directly by tests/affiliate_core.test.js without a database.
 *
 * MONEY. Every amount is an integer number of minor units (cents); every rate
 * is an integer number of basis points (2000 = 20.00%). A percentage
 * commission is floor((amount * bps + 5000) / 10000), which is round-half-up
 * in integer arithmetic and never touches a float. Anything that is not a safe
 * integer is refused rather than coerced.
 */

const crypto = require('crypto')

const PROGRAM_STATUSES = ['draft', 'active', 'paused', 'archived']
const AFFILIATE_STATUSES = ['invited', 'pending', 'active', 'suspended', 'rejected']
const MEMBERSHIP_STATUSES = ['invited', 'pending', 'active', 'suspended', 'rejected']
const CONVERSION_TYPES = ['lead', 'qualified_lead', 'sale', 'recurring', 'custom']
const CONVERSION_STATUSES = ['confirmed', 'refunded', 'cancelled']
const COMMISSION_STATUSES = ['pending', 'approved', 'payable', 'paid', 'rejected', 'reversed']
const ATTRIBUTION_SOURCES = ['link', 'coupon', 'form', 'api', 'stripe', 'manual']
const PAYOUT_METHODS = ['wise', 'revolut', 'paypal', 'bank', 'other']
const SALE_COMMISSION_TYPES = ['none', 'fixed', 'percent']
const ATTRIBUTION_MODES = ['last_touch', 'first_touch']

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,39}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CURRENCY_RE = /^[A-Z]{3}$/

// Payout details we are willing to store, per method. Everything else sent by
// a client is dropped on the floor: no passwords, no card numbers, no API keys.
const PAYOUT_DETAIL_FIELDS = {
  wise:    ['account_holder', 'email', 'iban', 'country', 'note'],
  revolut: ['account_holder', 'revtag', 'email', 'iban', 'note'],
  paypal:  ['account_holder', 'email', 'note'],
  bank:    ['account_holder', 'iban', 'bic', 'bank_name', 'country', 'note'],
  other:   ['account_holder', 'instructions', 'note'],
}

// ── Small helpers ────────────────────────────────────────────────────────────

function isSafeInt(n) { return Number.isSafeInteger(n) }

/** Accepts an integer, or a numeric string with no fraction, and nothing else. */
function parseCents(v) {
  if (typeof v === 'number') return isSafeInt(v) && v >= 0 ? v : null
  if (typeof v === 'string' && /^\d{1,15}$/.test(v.trim())) return Number(v.trim())
  return null
}

/** Money entered by a human as "12.50" (major units) -> 1250. Never floats. */
function majorToCents(v) {
  if (v == null) return null
  const s = String(v).trim().replace(',', '.')
  const m = /^(\d{1,13})(?:\.(\d{1,2}))?$/.exec(s)
  if (!m) return null
  const whole = Number(m[1])
  const frac = m[2] ? Number((m[2] + '00').slice(0, 2)) : 0
  return whole * 100 + frac
}

function centsToMajor(cents) {
  const n = Number(cents || 0)
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const whole = Math.floor(abs / 100)
  const frac = String(abs % 100).padStart(2, '0')
  return `${sign}${whole}.${frac}`
}

function formatMoney(cents, currency) {
  return `${currency || 'EUR'} ${centsToMajor(cents)}`
}

function normalizeCode(s) {
  return String(s == null ? '' : s).trim().toUpperCase()
}

function isValidCode(s) { return CODE_RE.test(normalizeCode(s)) }

function isValidSlug(s) { return typeof s === 'string' && SLUG_RE.test(s) }

function normalizeEmail(s) { return String(s == null ? '' : s).trim().toLowerCase() }

function isValidEmail(s) { return EMAIL_RE.test(normalizeEmail(s)) }

function sha256(s) { return crypto.createHash('sha256').update(String(s)).digest('hex') }

function hashEmail(email) { return sha256(normalizeEmail(email)) }

/** j***@example.com -- enough to recognise, never enough to contact. */
function maskEmail(email) {
  const e = normalizeEmail(email)
  const at = e.indexOf('@')
  if (at <= 0) return 'customer'
  return `${e[0]}***@${e.slice(at + 1)}`
}

function shortRef(s) { return sha256(s).slice(0, 8) }

/** URL-safe random token, 22 chars, 132 bits of entropy. */
function randomToken(bytes = 16) { return crypto.randomBytes(bytes).toString('base64url') }

/** A referral code from a name: first word, letters and digits only, plus a random tail. */
function suggestCode(name, rng = crypto.randomBytes) {
  const base = String(name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').trim().split(/\s+/)[0] || 'AFF'
  const stem = base.slice(0, 10)
  const tail = rng(2).toString('hex').toUpperCase()
  return `${stem}${tail}`.slice(0, 32)
}

function makeApiKey(slug) {
  return `bgaff_${String(slug).replace(/[^a-z0-9]/g, '')}_${crypto.randomBytes(24).toString('hex')}`
}

function hashApiKey(key) { return sha256(key) }

function apiKeyPrefix(key) { return String(key).slice(0, 14) }

function addDays(date, days) { return new Date(new Date(date).getTime() + Number(days) * 86_400_000) }

function addMonths(date, months) {
  const d = new Date(date)
  const m = d.getUTCMonth() + Number(months)
  const out = new Date(Date.UTC(d.getUTCFullYear(), m, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()))
  // Keep the day inside the target month (Jan 31 + 1 month -> Feb 28/29).
  if (out.getUTCDate() !== d.getUTCDate()) out.setUTCDate(0)
  return out
}

// ── Commission rules ─────────────────────────────────────────────────────────

const RULE_KEYS = [
  'lead_commission_cents', 'sale_commission_type', 'sale_commission_cents',
  'sale_commission_bps', 'recurring_commission_bps', 'recurring_months',
]

/**
 * The rules that apply to one membership: the program's columns, with any key
 * present in membership.custom_rules overriding. A custom rate for a specific
 * affiliate is therefore a partial object, never a whole copy.
 */
function effectiveRules(program, membership) {
  const custom = membership && membership.custom_rules && typeof membership.custom_rules === 'object' ? membership.custom_rules : {}
  const rules = {}
  for (const k of RULE_KEYS) {
    rules[k] = Object.prototype.hasOwnProperty.call(custom, k) && custom[k] !== null && custom[k] !== undefined
      ? custom[k]
      : program[k]
  }
  rules.currency = program.currency || 'EUR'
  rules.approval_days = Number(program.approval_days ?? 30)
  rules.attribution_days = Number(program.attribution_days ?? 30)
  rules.attribution_mode = program.attribution_mode || 'last_touch'
  rules.custom = Object.keys(custom).length > 0
  return rules
}

function percentOf(amountCents, bps) {
  if (!isSafeInt(amountCents) || !isSafeInt(bps)) throw new Error('percentOf: non-integer input')
  return Math.floor((amountCents * bps + 5000) / 10000)
}

/**
 * computeCommission({ rules, conversionType, amountCents, occurredAt, attribution })
 *   -> { amountCents, snapshot } | { amountCents: 0, snapshot, reason }
 *
 * `attribution` supplies first_sale_at and recurring_until for recurring
 * payments. A zero result is still returned with the reason so the caller can
 * record WHY nothing is owed (the audit trail matters more than the amount).
 */
function computeCommission({ rules, conversionType, amountCents, occurredAt, attribution = null }) {
  const amount = parseCents(amountCents) ?? 0
  const snapshot = {
    conversion_type: conversionType,
    currency: rules.currency,
    custom: !!rules.custom,
  }

  if (conversionType === 'lead') {
    // A raw lead never pays; only a qualified lead does. Recorded for counts.
    return { amountCents: 0, snapshot: { ...snapshot, rule: 'lead_no_commission' }, reason: 'lead_not_commissionable' }
  }

  if (conversionType === 'qualified_lead') {
    const c = parseCents(rules.lead_commission_cents) ?? 0
    return c > 0
      ? { amountCents: c, snapshot: { ...snapshot, rule: 'fixed_per_qualified_lead', lead_commission_cents: c } }
      : { amountCents: 0, snapshot: { ...snapshot, rule: 'fixed_per_qualified_lead', lead_commission_cents: 0 }, reason: 'program_pays_nothing_for_leads' }
  }

  if (conversionType === 'sale' || conversionType === 'custom') {
    const type = rules.sale_commission_type || 'none'
    if (type === 'fixed') {
      const c = parseCents(rules.sale_commission_cents) ?? 0
      return c > 0
        ? { amountCents: c, snapshot: { ...snapshot, rule: 'fixed_per_sale', sale_commission_cents: c } }
        : { amountCents: 0, snapshot: { ...snapshot, rule: 'fixed_per_sale', sale_commission_cents: 0 }, reason: 'program_pays_nothing_for_sales' }
    }
    if (type === 'percent') {
      const bps = Number(rules.sale_commission_bps || 0)
      const c = percentOf(amount, bps)
      return c > 0
        ? { amountCents: c, snapshot: { ...snapshot, rule: 'percent_of_sale', bps, base_amount_cents: amount } }
        : { amountCents: 0, snapshot: { ...snapshot, rule: 'percent_of_sale', bps, base_amount_cents: amount }, reason: amount === 0 ? 'zero_amount' : 'zero_rate' }
    }
    return { amountCents: 0, snapshot: { ...snapshot, rule: 'none' }, reason: 'program_pays_nothing_for_sales' }
  }

  if (conversionType === 'recurring') {
    const bps = Number(rules.recurring_commission_bps || 0)
    if (bps <= 0) {
      return { amountCents: 0, snapshot: { ...snapshot, rule: 'recurring_disabled' }, reason: 'one_time_commission_only' }
    }
    const until = attribution && attribution.recurring_until ? new Date(attribution.recurring_until) : null
    if (until && new Date(occurredAt) > until) {
      return { amountCents: 0, snapshot: { ...snapshot, rule: 'recurring_percent', bps, recurring_until: until.toISOString() }, reason: 'recurring_window_ended' }
    }
    if (attribution && attribution.subscription_ended_at && new Date(occurredAt) > new Date(attribution.subscription_ended_at)) {
      return { amountCents: 0, snapshot: { ...snapshot, rule: 'recurring_percent', bps }, reason: 'subscription_ended' }
    }
    const c = percentOf(amount, bps)
    return c > 0
      ? { amountCents: c, snapshot: { ...snapshot, rule: 'recurring_percent', bps, base_amount_cents: amount, recurring_until: until ? until.toISOString() : null } }
      : { amountCents: 0, snapshot: { ...snapshot, rule: 'recurring_percent', bps, base_amount_cents: amount }, reason: 'zero_amount' }
  }

  return { amountCents: 0, snapshot: { ...snapshot, rule: 'unknown_type' }, reason: 'unknown_conversion_type' }
}

/** When a recurring window closes for a sale that happened at `firstSaleAt`. */
function recurringUntil(rules, firstSaleAt) {
  if (!rules || Number(rules.recurring_commission_bps || 0) <= 0) return null
  if (rules.recurring_months === null || rules.recurring_months === undefined) return null
  const months = Number(rules.recurring_months)
  if (!Number.isFinite(months) || months <= 0) return new Date(firstSaleAt)
  return addMonths(firstSaleAt, months)
}

function approveAfter(occurredAt, approvalDays) {
  return addDays(occurredAt, Number(approvalDays ?? 30))
}

/** Plain-English summary of a program's rules for the public page and emails. */
function summarizeRules(program, membership = null) {
  const r = effectiveRules(program, membership)
  const cur = r.currency
  const parts = []
  if (r.sale_commission_type === 'percent' && Number(r.sale_commission_bps) > 0) {
    const pct = (Number(r.sale_commission_bps) / 100).toString().replace(/\.0+$/, '')
    if (Number(r.recurring_commission_bps) > 0) {
      const rpct = (Number(r.recurring_commission_bps) / 100).toString().replace(/\.0+$/, '')
      const span = r.recurring_months === null || r.recurring_months === undefined
        ? 'for as long as the customer stays subscribed'
        : `for the first ${r.recurring_months} months`
      parts.push(rpct === pct ? `${pct}% of every payment ${span}` : `${pct}% of the first payment, then ${rpct}% of each renewal ${span}`)
    } else {
      parts.push(`${pct}% of the first payment`)
    }
  } else if (r.sale_commission_type === 'fixed' && Number(r.sale_commission_cents) > 0) {
    parts.push(`${formatMoney(r.sale_commission_cents, cur)} per sale`)
  }
  if (Number(r.lead_commission_cents) > 0) parts.push(`${formatMoney(r.lead_commission_cents, cur)} per qualified lead`)
  return parts.length ? parts.join(', plus ') : 'Commission set per agreement'
}

// ── Attribution policy ───────────────────────────────────────────────────────

/**
 * decideAttribution({ existing, incoming, mode, now })
 *
 * existing: the attribution row already stored for this customer identity in
 *           this program, or null.
 * incoming: { membership_id, source, at, expires_at? }
 * mode:     'last_touch' | 'first_touch'
 *
 * Returns { winner: 'existing'|'incoming', flags: string[] }.
 *
 *  - manual beats everything (an admin decided).
 *  - coupon beats a link-based attribution in either mode.
 *  - a converted attribution is locked: the affiliate who brought the first
 *    sale keeps the customer, and a later different touch is flagged.
 *  - last_touch: the newest valid touch wins. first_touch: the earliest wins
 *    unless it has expired.
 */
function decideAttribution({ existing, incoming, mode = 'last_touch', now }) {
  const flags = []
  if (!existing) return { winner: 'incoming', flags }
  const same = existing.membership_id === incoming.membership_id
  if (!same) flags.push('duplicate_customer')

  if (incoming.source === 'manual') return { winner: 'incoming', flags }
  if (existing.source === 'manual') return { winner: 'existing', flags }
  if (existing.converted_at) return { winner: 'existing', flags }

  if (incoming.source === 'coupon' && existing.source !== 'coupon') return { winner: 'incoming', flags }
  if (existing.source === 'coupon' && incoming.source !== 'coupon') return { winner: 'existing', flags }

  const nowMs = new Date(now || incoming.at).getTime()
  const existingExpired = existing.expires_at ? new Date(existing.expires_at).getTime() < nowMs : false
  if (mode === 'first_touch') return { winner: existingExpired ? 'incoming' : 'existing', flags }
  return { winner: 'incoming', flags }
}

/** Is this click-based touch still inside the program's attribution window? */
function touchIsFresh(touchAt, attributionDays, now) {
  if (!touchAt) return false
  return new Date(now).getTime() <= addDays(touchAt, attributionDays).getTime()
}

function isSelfReferral({ affiliate, customerEmail, customerEmailHash }) {
  if (!affiliate) return false
  const affEmail = normalizeEmail(affiliate.email)
  if (customerEmail) {
    const c = normalizeEmail(customerEmail)
    if (c && c === affEmail) return true
    const affDomain = affEmail.split('@')[1]
    const cDomain = c.split('@')[1]
    // Same private domain is a strong self-referral signal; public mailbox
    // providers are excluded because two strangers can share gmail.com.
    if (affDomain && cDomain && affDomain === cDomain && !PUBLIC_MAIL_DOMAINS.has(affDomain)) return true
    if (affiliate.website) {
      const w = String(affiliate.website).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      if (w && cDomain && (cDomain === w || cDomain.endsWith('.' + w))) return true
    }
  }
  if (customerEmailHash && affiliate.email_hash && customerEmailHash === affiliate.email_hash) return true
  return false
}

const PUBLIC_MAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com',
  'me.com', 'proton.me', 'protonmail.com', 'gmx.com', 'gmx.de', 'web.de', 'mail.com', 'aol.com', 'yandex.com',
])

// ── Commission state machine ─────────────────────────────────────────────────

const COMMISSION_TRANSITIONS = {
  pending:  ['approved', 'rejected', 'reversed'],
  approved: ['payable', 'rejected', 'reversed', 'pending'],
  payable:  ['paid', 'approved', 'reversed'],
  paid:     [],
  rejected: ['pending'],
  reversed: [],
}

function canTransition(from, to) {
  return Array.isArray(COMMISSION_TRANSITIONS[from]) && COMMISSION_TRANSITIONS[from].includes(to)
}

// ── Redirect URL ─────────────────────────────────────────────────────────────

/**
 * buildRedirectUrl({ destination, code, visitToken, programSlug, attributionDays, incomingQuery })
 *
 * Adds ref, bg_rid and ref_days, and the three affiliate UTMs ONLY when the
 * click did not already carry a utm of that name (a partner's own campaign
 * tagging wins). Any other query parameter on the click is passed through.
 */
function buildRedirectUrl({ destination, code, visitToken, programSlug, attributionDays, incomingQuery = {} }) {
  const url = new URL(destination)
  const passthrough = incomingQuery && typeof incomingQuery === 'object' ? incomingQuery : {}
  for (const [k, v] of Object.entries(passthrough)) {
    if (k === 'ref' || k === 'bg_rid' || k === 'ref_days') continue
    if (typeof v === 'string' && v.length <= 200 && k.length <= 40) url.searchParams.set(k, v)
  }
  url.searchParams.set('ref', code)
  if (visitToken) url.searchParams.set('bg_rid', visitToken)
  url.searchParams.set('ref_days', String(Number(attributionDays ?? 30)))
  if (!url.searchParams.has('utm_source')) url.searchParams.set('utm_source', 'affiliate')
  if (!url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium', 'referral')
  if (!url.searchParams.has('utm_campaign')) url.searchParams.set('utm_campaign', programSlug)
  return url.toString()
}

function isSafeDestination(u) {
  try {
    const url = new URL(u)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch { return false }
}

// ── Validation of admin and public input ─────────────────────────────────────

function str(v, max = 500) {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s ? s.slice(0, max) : null
}

function validateProgramInput(body, { partial = false } = {}) {
  const out = {}
  const errors = []
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k)

  if (!partial || has('slug')) {
    const slug = str(body.slug, 40)
    if (!slug || !isValidSlug(slug)) errors.push('slug must be 2 to 40 lowercase letters, digits or hyphens')
    else out.slug = slug
  }
  if (!partial || has('name')) {
    const name = str(body.name, 120)
    if (!name) errors.push('name is required')
    else out.name = name
  }
  if (!partial || has('destination_url')) {
    const d = str(body.destination_url, 500)
    if (!d || !isSafeDestination(d)) errors.push('destination_url must be an http(s) URL')
    else out.destination_url = d
  }
  for (const k of ['tagline', 'description', 'logo_url', 'brand_color', 'terms_md', 'terms_url', 'terms_version', 'payout_schedule']) {
    if (has(k)) out[k] = str(body[k], k === 'description' || k === 'terms_md' ? 20000 : 500)
  }
  if (has('status')) {
    if (!PROGRAM_STATUSES.includes(body.status)) errors.push('status is invalid')
    else out.status = body.status
  }
  if (has('is_public')) out.is_public = body.is_public === true
  if (has('currency')) {
    const c = String(body.currency || '').toUpperCase()
    if (!CURRENCY_RE.test(c)) errors.push('currency must be a 3-letter code')
    else out.currency = c
  }
  if (has('sale_commission_type')) {
    if (!SALE_COMMISSION_TYPES.includes(body.sale_commission_type)) errors.push('sale_commission_type is invalid')
    else out.sale_commission_type = body.sale_commission_type
  }
  if (has('attribution_mode')) {
    if (!ATTRIBUTION_MODES.includes(body.attribution_mode)) errors.push('attribution_mode is invalid')
    else out.attribution_mode = body.attribution_mode
  }
  for (const k of ['lead_commission_cents', 'sale_commission_cents', 'min_payout_cents']) {
    if (has(k)) {
      const c = parseCents(body[k])
      if (c === null) errors.push(`${k} must be a whole number of cents`)
      else out[k] = c
    }
  }
  for (const k of ['sale_commission_bps', 'recurring_commission_bps']) {
    if (has(k)) {
      const n = Number(body[k])
      if (!isSafeInt(n) || n < 0 || n > 10000) errors.push(`${k} must be 0 to 10000`)
      else out[k] = n
    }
  }
  for (const [k, max] of [['attribution_days', 3650], ['approval_days', 365]]) {
    if (has(k)) {
      const n = Number(body[k])
      if (!isSafeInt(n) || n < 0 || n > max) errors.push(`${k} must be 0 to ${max}`)
      else out[k] = n
    }
  }
  if (has('recurring_months')) {
    if (body.recurring_months === null || body.recurring_months === '') out.recurring_months = null
    else {
      const n = Number(body.recurring_months)
      if (!isSafeInt(n) || n < 0 || n > 600) errors.push('recurring_months must be empty (unlimited) or 0 to 600')
      else out.recurring_months = n
    }
  }
  return { errors, row: out }
}

function validateCustomRules(input) {
  if (input === null) return { errors: [], rules: null }
  if (!input || typeof input !== 'object') return { errors: ['custom_rules must be an object or null'], rules: null }
  const errors = []
  const rules = {}
  for (const k of ['lead_commission_cents', 'sale_commission_cents']) {
    if (input[k] !== undefined && input[k] !== null) {
      const c = parseCents(input[k]); if (c === null) errors.push(`${k} must be a whole number of cents`); else rules[k] = c
    }
  }
  for (const k of ['sale_commission_bps', 'recurring_commission_bps']) {
    if (input[k] !== undefined && input[k] !== null) {
      const n = Number(input[k]); if (!isSafeInt(n) || n < 0 || n > 10000) errors.push(`${k} must be 0 to 10000`); else rules[k] = n
    }
  }
  if (input.sale_commission_type !== undefined && input.sale_commission_type !== null) {
    if (!SALE_COMMISSION_TYPES.includes(input.sale_commission_type)) errors.push('sale_commission_type is invalid')
    else rules.sale_commission_type = input.sale_commission_type
  }
  if (input.recurring_months !== undefined) {
    if (input.recurring_months === null) rules.recurring_months = null
    else {
      const n = Number(input.recurring_months); if (!isSafeInt(n) || n < 0 || n > 600) errors.push('recurring_months invalid'); else rules.recurring_months = n
    }
  }
  return { errors, rules: Object.keys(rules).length ? rules : null }
}

function validateApplication(body) {
  const errors = []
  const row = {}
  row.full_name = str(body.full_name, 120)
  if (!row.full_name) errors.push('full_name is required')
  row.email = normalizeEmail(body.email)
  if (!isValidEmail(row.email)) errors.push('email is invalid')
  row.company = str(body.company, 160)
  row.website = str(body.website, 300)
  row.social_url = str(body.social_url, 300)
  if (!row.website && !row.social_url) errors.push('website or social profile is required')
  row.country = str(body.country, 80)
  if (!row.country) errors.push('country is required')
  row.promo_method = str(body.promo_method, 2000)
  if (!row.promo_method) errors.push('promo_method is required')
  if (body.payout_method !== undefined && body.payout_method !== null && body.payout_method !== '') {
    if (!PAYOUT_METHODS.includes(body.payout_method)) errors.push('payout_method is invalid')
    else row.payout_method = body.payout_method
  } else row.payout_method = null
  row.terms_accepted = body.terms_accepted === true
  row.privacy_accepted = body.privacy_accepted === true
  if (!row.terms_accepted) errors.push('terms must be accepted')
  if (!row.privacy_accepted) errors.push('privacy policy must be accepted')
  return { errors, row }
}

function sanitizePayoutDetails(method, details) {
  const allowed = PAYOUT_DETAIL_FIELDS[method] || []
  const out = {}
  if (details && typeof details === 'object') {
    for (const k of allowed) {
      const v = str(details[k], 200)
      if (v) out[k] = v
    }
  }
  return out
}

/**
 * The conversion API's input contract. Amount is accepted as `amount_cents`
 * (integer) or `amount` (major units string/number, two decimals max); the
 * commission is NEVER accepted from the caller.
 */
function validateConversionInput(body) {
  const errors = []
  const row = {}
  row.idempotency_key = str(body.idempotency_key, 200)
  if (!row.idempotency_key) errors.push('idempotency_key is required')
  row.conversion_type = body.conversion_type || body.type
  if (!CONVERSION_TYPES.includes(row.conversion_type)) errors.push('conversion_type must be one of ' + CONVERSION_TYPES.join(', '))
  row.affiliate_code = body.affiliate_code ? normalizeCode(body.affiliate_code) : null
  row.visit_token = str(body.referral_id || body.visit_token, 64)
  row.external_id = str(body.external_id, 200)
  row.external_customer_id = str(body.external_customer_id, 200)
  row.customer_email = body.customer_email ? normalizeEmail(body.customer_email) : null
  if (row.customer_email && !isValidEmail(row.customer_email)) errors.push('customer_email is invalid')
  if (body.amount_cents !== undefined && body.amount_cents !== null) {
    const c = parseCents(body.amount_cents); if (c === null) errors.push('amount_cents must be a whole number'); else row.amount_cents = c
  } else if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
    const c = majorToCents(body.amount); if (c === null) errors.push('amount must be a decimal with at most two places'); else row.amount_cents = c
  } else row.amount_cents = 0
  const cur = String(body.currency || '').toUpperCase()
  if (cur && !CURRENCY_RE.test(cur)) errors.push('currency must be a 3-letter code')
  row.currency = cur || null
  if (body.status !== undefined && body.status !== null) {
    if (!CONVERSION_STATUSES.includes(body.status)) errors.push('status must be one of ' + CONVERSION_STATUSES.join(', '))
    else row.status = body.status
  } else row.status = 'confirmed'
  if (body.occurred_at) {
    const d = new Date(body.occurred_at)
    if (isNaN(d.getTime())) errors.push('occurred_at is not a date')
    else row.occurred_at = d.toISOString()
  }
  let metadata = {}
  if (body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) {
    const serialized = JSON.stringify(body.metadata)
    metadata = serialized.length > 4000 ? { truncated: true } : body.metadata
  }
  row.metadata = metadata
  return { errors, row }
}

// ── CSV ──────────────────────────────────────────────────────────────────────

const EXPORT_COLUMNS = {
  affiliates: ['affiliate_id', 'status', 'full_name', 'email', 'company', 'website', 'social_url', 'country', 'payout_method', 'created_at'],
  memberships: ['membership_id', 'program_slug', 'affiliate_id', 'affiliate_email', 'status', 'primary_code', 'clicks_total', 'approved_at', 'created_at'],
  clicks: ['visit_id', 'program_slug', 'affiliate_id', 'code', 'visit_token', 'landing_path', 'referrer_host', 'utm_source', 'utm_medium', 'utm_campaign', 'created_at'],
  conversions: ['conversion_id', 'program_slug', 'affiliate_id', 'affiliate_email', 'conversion_type', 'status', 'source', 'external_id', 'customer_ref', 'amount', 'currency', 'occurred_at', 'idempotency_key', 'flags'],
  commissions: ['commission_id', 'conversion_id', 'program_slug', 'affiliate_id', 'affiliate_email', 'status', 'amount', 'currency', 'approve_after', 'approved_at', 'paid_at', 'payout_batch_id', 'reconciliation_flag', 'created_at'],
  payout_batches: ['batch_id', 'affiliate_id', 'affiliate_email', 'affiliate_name', 'status', 'currency', 'total', 'item_count', 'payout_method', 'payout_details', 'external_reference', 'created_at', 'paid_at'],
  payout_items: ['batch_id', 'commission_id', 'conversion_id', 'affiliate_email', 'amount', 'currency', 'conversion_type', 'occurred_at'],
}

function csvCell(v) {
  if (v === null || v === undefined) return ''
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  // Neutralise spreadsheet formula injection: a cell starting with = + - @ is
  // prefixed with a quote so Excel treats it as text.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(columns, rows) {
  const lines = [columns.join(',')]
  for (const r of rows) lines.push(columns.map((c) => csvCell(r[c])).join(','))
  return lines.join('\r\n') + '\r\n'
}

module.exports = {
  PROGRAM_STATUSES, AFFILIATE_STATUSES, MEMBERSHIP_STATUSES, CONVERSION_TYPES, CONVERSION_STATUSES,
  COMMISSION_STATUSES, ATTRIBUTION_SOURCES, PAYOUT_METHODS, SALE_COMMISSION_TYPES, ATTRIBUTION_MODES,
  PAYOUT_DETAIL_FIELDS, CODE_RE, SLUG_RE, EXPORT_COLUMNS, RULE_KEYS,
  parseCents, majorToCents, centsToMajor, formatMoney,
  normalizeCode, isValidCode, isValidSlug, normalizeEmail, isValidEmail, sha256, hashEmail, maskEmail, shortRef,
  randomToken, suggestCode, makeApiKey, hashApiKey, apiKeyPrefix, addDays, addMonths,
  effectiveRules, percentOf, computeCommission, recurringUntil, approveAfter, summarizeRules,
  decideAttribution, touchIsFresh, isSelfReferral, canTransition, COMMISSION_TRANSITIONS,
  buildRedirectUrl, isSafeDestination,
  validateProgramInput, validateCustomRules, validateApplication, sanitizePayoutDetails, validateConversionInput,
  csvCell, toCsv, str,
}
