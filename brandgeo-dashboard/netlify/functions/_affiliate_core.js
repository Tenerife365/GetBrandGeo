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
  'services_commission_bps',
]

/**
 * The rules that apply to one payment. Layers, lowest first: the program's
 * columns, membership.custom_rules (a rate for one affiliate),
 * attribution.custom_rules (a rate for one referred account, added
 * 2026-10-22), then `override` (a rate for one payment, used by a one-time
 * fee). Every layer is a partial object: a key present and not null wins over
 * the layers below it, so a custom rate is never a whole copy.
 * custom_source names the highest layer that changed anything.
 */
function effectiveRules(program, membership, attribution = null, override = null) {
  const layerOf = (row) => row && row.custom_rules && typeof row.custom_rules === 'object' && !Array.isArray(row.custom_rules) ? row.custom_rules : {}
  const layers = [
    ['membership', layerOf(membership)],
    ['account', layerOf(attribution)],
    ['payment', override && typeof override === 'object' && !Array.isArray(override) ? override : {}],
  ]
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k) && o[k] !== undefined && o[k] !== null
  const rules = {}
  let source = null
  for (const k of RULE_KEYS) rules[k] = program[k]
  if (rules.services_commission_bps === undefined) rules.services_commission_bps = null
  for (const [name, layer] of layers) {
    let used = false
    for (const k of RULE_KEYS) if (has(layer, k)) { rules[k] = layer[k]; used = true }
    if (used) source = name
  }
  rules.currency = program.currency || 'EUR'
  rules.approval_days = Number(program.approval_days ?? 30)
  rules.attribution_days = Number(program.attribution_days ?? 30)
  rules.attribution_mode = program.attribution_mode || 'last_touch'
  rules.custom = source !== null
  rules.custom_source = source
  return rules
}

function percentOf(amountCents, bps) {
  if (!isSafeInt(amountCents) || !isSafeInt(bps)) throw new Error('percentOf: non-integer input')
  return Math.floor((amountCents * bps + 5000) / 10000)
}

/**
 * computeCommission({ rules, conversionType, amountCents, occurredAt, attribution, service })
 *   -> { amountCents, snapshot } | { amountCents: 0, snapshot, reason }
 *
 * `attribution` supplies first_sale_at and recurring_until for recurring
 * payments. `service` marks a one-time fee for custom services (setup, audit,
 * project): it earns services_commission_bps once, unless a rate was given for
 * that one fee (custom_source 'payment') or no services rate is set anywhere,
 * in which case the sale rule applies as before. A zero result is still returned with the reason so the caller can
 * record WHY nothing is owed (the audit trail matters more than the amount).
 */
function computeCommission({ rules, conversionType, amountCents, occurredAt, attribution = null, service = false }) {
  const amount = parseCents(amountCents) ?? 0
  const snapshot = {
    conversion_type: conversionType,
    currency: rules.currency,
    custom: !!rules.custom,
  }
  if (rules.custom_source) snapshot.custom_source = rules.custom_source

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

  const serviceBps = rules.services_commission_bps
  if (conversionType === 'custom' && service && rules.custom_source !== 'payment' && serviceBps !== null && serviceBps !== undefined) {
    const bps = Number(serviceBps)
    const c = percentOf(amount, bps)
    const snap = { ...snapshot, rule: 'percent_of_service', bps, base_amount_cents: amount }
    return c > 0 ? { amountCents: c, snapshot: snap } : { amountCents: 0, snapshot: snap, reason: amount === 0 ? 'zero_amount' : 'zero_rate' }
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
function summarizeRules(program, membership = null, attribution = null) {
  const r = effectiveRules(program, membership, attribution)
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
  if (Number(r.services_commission_bps) > 0) {
    parts.push(`${(Number(r.services_commission_bps) / 100).toString().replace(/\.0+$/, '')}% once on custom services`)
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
  if (has('services_commission_bps')) {
    if (body.services_commission_bps === null || body.services_commission_bps === '') out.services_commission_bps = null
    else {
      const n = Number(body.services_commission_bps)
      if (!isSafeInt(n) || n < 0 || n > 10000) errors.push('services_commission_bps must be empty (use the sale rule) or 0 to 10000')
      else out.services_commission_bps = n
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
  for (const k of ['sale_commission_bps', 'recurring_commission_bps', 'services_commission_bps']) {
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

// ── Referred accounts: what an affiliate has earned and can still earn ──────

/**
 * Monthly list prices in cents, used ONLY to estimate an affiliate's future
 * commission on an account they referred. Billing never reads this map; Stripe
 * and the hand invoice are what a customer pays. It mirrors the published
 * ladder (getbrandgeo.com pricing, PLAN_TIERS in src/pages/Account.tsx).
 * Radar is at its EUR 29 launch price, Managed at its "from" price. Free,
 * Enterprise and the legacy Pro have no list price, so no estimate.
 */
const PLAN_LIST_PRICE_CENTS = { radar: 2900, essentials: 9900, growth: 29900, growth_pro: 44900, managed: 150000 }

/** Plan sources that are given away, so an account on them pays nothing until it converts. */
const UNPAID_PLAN_SOURCES = ['comp', 'trial']
const EARNED_STATUSES = ['pending', 'approved', 'payable', 'paid']

function firstPaymentCommission(rules, basisCents) {
  if (rules.sale_commission_type === 'fixed') return parseCents(rules.sale_commission_cents) ?? 0
  if (rules.sale_commission_type === 'percent') return percentOf(basisCents, Number(rules.sale_commission_bps || 0))
  return 0
}

/**
 * The price an account really pays, set by the admin on its attribution
 * (billing_amount_cents, billing_interval, billing_paid_until, billing_note).
 * A hand-sold account rarely pays the list price: a package paid once, an
 * annual invoice, a custom monthly fee, or nothing at all.
 *   month  a recurring monthly amount
 *   year   a recurring yearly amount
 *   once   one payment that covers a period (a prepaid package); no renewal
 *          is estimated, billing_paid_until says until when it runs
 *   none   the account pays nothing (complimentary)
 */
const BILLING_INTERVALS = ['month', 'year', 'once', 'none']

/**
 * validateBilling(body) -> { errors, patch }
 *
 * body: { interval, amount | amount_cents, paid_until, note } or { clear: true }.
 * patch holds the four attribution columns, all null when cleared.
 */
function validateBilling(body) {
  const errors = []
  const empty = { billing_amount_cents: null, billing_interval: null, billing_paid_until: null, billing_note: null }
  if (!body || typeof body !== 'object') return { errors: ['billing is required'], patch: null }
  if (body.clear === true) return { errors, patch: empty }
  const interval = String(body.interval || '').trim()
  if (!BILLING_INTERVALS.includes(interval)) return { errors: ['interval must be one of ' + BILLING_INTERVALS.join(', ')], patch: null }
  let cents = 0
  if (interval !== 'none') {
    if (body.amount_cents !== undefined && body.amount_cents !== null && body.amount_cents !== '') cents = parseCents(body.amount_cents)
    else if (body.amount !== undefined && body.amount !== null && body.amount !== '') cents = majorToCents(body.amount)
    else cents = null
    if (cents === null) errors.push('amount must be a decimal with at most two places')
    else if (cents <= 0) errors.push('amount must be above zero; use interval none for an account that pays nothing')
  }
  let paidUntil = null
  if (body.paid_until) {
    const d = new Date(body.paid_until)
    if (isNaN(d.getTime())) errors.push('paid_until is not a date')
    else paidUntil = d.toISOString()
  }
  if (errors.length) return { errors, patch: null }
  return { errors, patch: { billing_amount_cents: interval === 'none' ? 0 : cents, billing_interval: interval, billing_paid_until: paidUntil, billing_note: str(body.note, 500) } }
}

/** A one-time fee recorded by the admin: commissioned once, never an estimate basis. */
function isOneTimeFee(conversion) {
  return !!conversion && conversion.conversion_type === 'custom' && !!conversion.metadata && conversion.metadata.one_time === true
}

/** A one-time fee for custom services (the default kind), as opposed to plan time paid up front. */
function isServiceFee(conversion) {
  return isOneTimeFee(conversion) && conversion.metadata.fee_kind !== 'plan'
}

/**
 * projectReferredAccount({ rules, attribution, account, payments, commissions, now })
 *
 * One row of the affiliate's "Referred accounts" panel. `payments` are the
 * confirmed paying conversions on this attribution (one-time fees included),
 * `commissions` the commissions on them, `account` the clients row when the
 * attribution maps to one ({ plan, plan_source }).
 *
 * The estimate is what is STILL to come, never what is already earned. Its
 * basis, in order:
 *   1. set_price     the price the admin set on the attribution
 *   2. list_price    the plan's list price, monthly, for a self-serve account
 *   3. last_payment  the last plan payment, monthly, when the plan has none
 * An account the admin attached by hand (source manual) never falls back to
 * the list price: a hand-sold deal is not the list price, so without a set
 * price there is no estimate (estimate_cents null, basis price_not_set).
 * One-time fees count in earned and never in the estimate.
 */
function projectReferredAccount({ rules, attribution, account = null, payments = [], commissions = [], now = new Date() }) {
  const at = new Date(now)
  const fees = payments.filter(isOneTimeFee)
  const sorted = payments.filter((p) => !isOneTimeFee(p)).sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
  const last = sorted.length ? sorted[sorted.length - 1] : null
  const sum = (statuses) => commissions.filter((c) => statuses.includes(c.status)).reduce((s, c) => s + Number(c.amount_cents || 0), 0)
  const plan = account && account.plan ? account.plan : null
  const interval = BILLING_INTERVALS.includes(attribution.billing_interval) ? attribution.billing_interval : null
  const out = {
    plan,
    payments_count: sorted.length,
    last_payment_at: last ? new Date(last.occurred_at).toISOString() : null,
    fees_count: fees.length,
    fees_total_cents: fees.reduce((s, f) => s + Number(f.amount_cents || 0), 0),
    earned_cents: sum(EARNED_STATUSES),
    paid_cents: sum(['paid']),
    first_sale_at: attribution.first_sale_at || (sorted[0] ? new Date(sorted[0].occurred_at).toISOString() : null),
    window_ends_at: attribution.recurring_until || null,
    prepaid_until: null,
    payments_left: 0,
    estimate_cents: 0,
    basis_cents: null,
    basis_interval: null,
    monthly_basis_cents: null,
    estimate_basis: null,
    status: 'paying',
    currency: rules.currency,
  }

  if (attribution.is_self_referral) return { ...out, status: 'not_eligible' }
  if (attribution.subscription_ended_at && new Date(attribution.subscription_ended_at) <= at) return { ...out, status: 'cancelled' }

  let step = 1
  if (interval) {
    out.estimate_basis = 'set_price'
    if (interval === 'none') return { ...out, status: sorted.length ? 'no_further_payments' : 'complimentary' }
    out.basis_cents = Number(attribution.billing_amount_cents) || 0
    out.basis_interval = interval
    if (interval === 'month') out.monthly_basis_cents = out.basis_cents
    if (interval === 'once') {
      out.prepaid_until = attribution.billing_paid_until ? new Date(attribution.billing_paid_until).toISOString() : null
      // A prepaid package is usually recorded as a one-time fee (admin page,
      // Attached accounts, "Record payment"), which never sets first_sale_at;
      // either way it is paid, so it is not estimated a second time.
      if (out.first_sale_at || fees.length) return { ...out, status: 'prepaid' }
      out.status = 'not_paying_yet'
      out.payments_left = out.basis_cents > 0 ? 1 : 0
      out.estimate_cents = out.basis_cents > 0 ? firstPaymentCommission(rules, out.basis_cents) : 0
      return out
    }
    step = interval === 'year' ? 12 : 1
  } else {
    if (!sorted.length && account && UNPAID_PLAN_SOURCES.includes(account.plan_source)) return { ...out, status: 'complimentary' }
    if (attribution.source === 'manual') {
      out.estimate_basis = 'price_not_set'
      out.estimate_cents = null
      if (!out.first_sale_at) out.status = 'not_paying_yet'
      return out
    }
    if (plan && PLAN_LIST_PRICE_CENTS[plan]) { out.basis_cents = PLAN_LIST_PRICE_CENTS[plan]; out.estimate_basis = 'list_price' }
    else if (last && Number(last.amount_cents) > 0) { out.basis_cents = Number(last.amount_cents); out.estimate_basis = 'last_payment' }
    if (out.basis_cents !== null) { out.basis_interval = 'month'; out.monthly_basis_cents = out.basis_cents }
  }
  const basis = out.basis_cents
  const rb = Number(rules.recurring_commission_bps || 0)
  // An unlimited recurring window is estimated over its first 12 months, so a
  // number on screen is never "forever".
  const months = rules.recurring_months === null || rules.recurring_months === undefined ? 12 : Math.max(0, Number(rules.recurring_months))

  if (!out.first_sale_at) {
    out.status = 'not_paying_yet'
    if (!basis) return out
    // Renewal k lands k * step months after the first payment and earns while
    // it is still inside the window.
    let renewals = 0
    if (rb > 0) for (let k = 1; k * step < months; k++) renewals++
    out.payments_left = 1 + renewals
    out.estimate_cents = firstPaymentCommission(rules, basis) + renewals * percentOf(basis, rb)
    return out
  }

  if (rb <= 0) return { ...out, status: 'one_time' }
  const first = new Date(out.first_sale_at)
  const until = attribution.recurring_until ? new Date(attribution.recurring_until) : addMonths(first, months)
  out.window_ends_at = until.toISOString()
  // Renewal m lands on first + m months; it earns while it is still inside
  // the window (computeCommission refuses one dated after recurring_until).
  let left = 0
  for (let m = step; m <= 600; m += step) {
    const d = addMonths(first, m)
    if (d >= until) break
    if (d > at) left++
  }
  if (left === 0) return { ...out, status: 'window_ended' }
  out.payments_left = left
  out.estimate_cents = basis ? left * percentOf(basis, rb) : 0
  return out
}

/**
 * affiliateBalances(commissions, programs) -> { [currency]: balance }
 *
 * What the affiliate is owed, as money and dates only (the portal shows no
 * rates). Per currency, in cents:
 *   to_receive  pending + approved + payable (everything not yet paid)
 *   available   approved + payable (cleared the approval period)
 *   in_payout   payable (in a payout being prepared)
 *   on_hold     pending (inside the approval period, a refund still cancels it)
 *   paid        paid out
 *   min_payout  the highest minimum among the programs in that currency, the
 *               same threshold the admin's payout grouping applies
 *   upcoming    pending amounts grouped by the day they clear (approve_after),
 *               earliest first, at most 12 days
 * Reversed and rejected commissions count nowhere. `programs` seeds a zero
 * balance for each currency the affiliate can earn in.
 */
function affiliateBalances(commissions = [], programs = []) {
  const out = {}
  const cur = (c) => {
    const k = c || 'EUR'
    if (!out[k]) out[k] = { to_receive_cents: 0, available_cents: 0, in_payout_cents: 0, on_hold_cents: 0, paid_cents: 0, min_payout_cents: 0, upcoming: new Map() }
    return out[k]
  }
  for (const p of programs) {
    const b = cur(p.currency)
    b.min_payout_cents = Math.max(b.min_payout_cents, Number(p.min_payout_cents || 0))
  }
  for (const c of commissions) {
    const amount = Number(c.amount_cents || 0)
    const b = cur(c.currency)
    if (c.status === 'pending') {
      b.on_hold_cents += amount
      b.to_receive_cents += amount
      const day = c.approve_after ? new Date(c.approve_after).toISOString().slice(0, 10) : null
      if (day) b.upcoming.set(day, (b.upcoming.get(day) || 0) + amount)
    } else if (c.status === 'approved') {
      b.available_cents += amount
      b.to_receive_cents += amount
    } else if (c.status === 'payable') {
      b.available_cents += amount
      b.in_payout_cents += amount
      b.to_receive_cents += amount
    } else if (c.status === 'paid') {
      b.paid_cents += amount
    }
  }
  for (const b of Object.values(out)) {
    b.upcoming = [...b.upcoming.entries()].sort((x, y) => x[0].localeCompare(y[0])).slice(0, 12).map(([date, amount_cents]) => ({ date, amount_cents }))
    b.next_available_at = b.upcoming.length ? b.upcoming[0].date : null
    b.next_available_cents = b.upcoming.length ? b.upcoming[0].amount_cents : 0
    b.meets_minimum = b.available_cents > 0 && b.available_cents >= b.min_payout_cents
  }
  return out
}

/** What a commission was earned on, in words the affiliate reads: never a rate. */
function commissionKind(conversion) {
  if (!conversion) return null
  if (isOneTimeFee(conversion)) return 'one_time_fee'
  if (conversion.conversion_type === 'recurring') return 'renewal'
  if (conversion.conversion_type === 'lead' || conversion.conversion_type === 'qualified_lead') return 'lead'
  return 'payment'
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
  PLAN_LIST_PRICE_CENTS, BILLING_INTERVALS, validateBilling, isOneTimeFee, isServiceFee, projectReferredAccount,
  affiliateBalances, commissionKind,
  decideAttribution, touchIsFresh, isSelfReferral, canTransition, COMMISSION_TRANSITIONS,
  buildRedirectUrl, isSafeDestination,
  validateProgramInput, validateCustomRules, validateApplication, sanitizePayoutDetails, validateConversionInput,
  csvCell, toCsv, str,
}
