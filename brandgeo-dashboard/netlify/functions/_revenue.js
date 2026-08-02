/**
 * _revenue.js — pure money computation for the admin Revenue page (S21).
 *
 * Implements docs/arch/revenue-report-data-contract.md, the RESEARCH-stage
 * artifact approved by Constantin 2026-08-02. Every formula here traces to a
 * numbered section of that document; where a comment cites "§4" it means that
 * file, not this one.
 *
 * ── WHAT THIS FILE IS ───────────────────────────────────────────────────────
 * PURE. No Stripe SDK, no Supabase client, no network, no process.env, no
 * Date.now() outside an injectable `now` parameter. Every function takes
 * already-fetched plain objects and returns computed numbers. revenue-report.js
 * does all the I/O and calls these; tests/revenue_report.test.js calls the SAME
 * functions with hand-built fixtures.
 *
 * That split is the whole point. The live Stripe account has 2 invoices, 1
 * charge, 0 refunds, 0 subscriptions and 0 coupon redemptions (verified
 * 2026-08-02, contract §2/§4), so real data cannot exercise a refund, a paid
 * subscription invoice, an affiliate commission, or the 12-month window
 * expiring. The fixture harness is the only evidence those formulas are right,
 * and it can only be evidence if it calls this code rather than restating it.
 *
 * ── MONEY UNITS, AND THE ONE RULE THAT MATTERS ──────────────────────────────
 * Stripe amounts are INTEGER MINOR UNITS (cents). Everything internal stays in
 * cents. Division by 100 and rounding to 2 decimals happens ONCE, at the output
 * boundary, per the contract. Rounding mid-calculation is how a per-plan table
 * stops summing to its own global total.
 *
 * The single exception is estimatedApiCostEur, which arrives as a EUR float
 * because ai_results.cost_eur is stored that way (see _cost.js). It is kept as a
 * float, never converted to cents, and subtracted at the same final step — so
 * the Cost tab (Usage.tsx, client-side) and the Revenue tab can never disagree
 * about the same number, which contract §5 requires by name.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ───────────────────────────────────────────
 * No Stripe object is created, modified or deleted anywhere in S21. Commission
 * is a Stripe-side APPROXIMATION of what PromoteKit computes for payout (§4,
 * decision 2) — it is labelled an estimate and is not the affiliate payout of
 * record. No PromoteKit call, no operating_costs table, no true net margin
 * (contract §7).
 */

'use strict'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Affiliate commission rate and window, from the live coupon's own metadata:
 * XKfymWe7 carries metadata.affiliate_terms = "20pct-recurring-12mo"
 * (contract §4, verified live 2026-08-02).
 *
 * The window is HALF-OPEN: [attributedAt, attributedAt + 12 months). An invoice
 * dated exactly 12 months after attribution is OUTSIDE it. Stated because "12
 * months" is ambiguous at the boundary and a report that silently includes one
 * extra month overstates what is owed to a partner.
 */
const COMMISSION_RATE = 0.20
const COMMISSION_WINDOW_MONTHS = 12

/**
 * Plan ladder with EUR/month LIST prices, for computeEngagementPipeline's
 * opportunity value only. Nothing on the revenue path reads a price from here —
 * contract §1 is explicit that Stripe is authoritative for every euro figure
 * that describes money which actually moved. This table describes money that
 * has NOT moved (what an engaged free client would be worth if they upgraded),
 * which is why it can be a local estimate at all.
 *
 * ORDER mirrors planConfig.ts's PLAN_ORDER export:
 *   ['free','radar','essentials','growth','growth_pro','managed','pro','enterprise']
 * VALUES mirror src/pages/Account.tsx's local `PLAN_TIERS` array (Account.tsx:38),
 * which carries its own note: "display prices only, source of truth for billing
 * is Stripe / PRICING-STRATEGY-2026-07.md §2". Same framing applies here.
 *
 * Hand-mirrored rather than imported for the reason _cost.js's header already
 * gives: Netlify functions are plain CommonJS and cannot import a Vite-bundled
 * .ts module at runtime. planConfig.ts exports PLAN_ORDER but exports no price
 * table at all, so there is nothing to import even in principle — Account.tsx's
 * array is a page-local const. Keep this in step with it by hand.
 *
 * ⚠️ RADAR IS 39 HERE AND €29 IN Account.tsx, AND THAT IS A REAL DIVERGENCE, NOT
 * A TYPO. Radar ships at EUR 39 LIST with EUR 29 as a launch price for the first
 * 100 subscribers (docs/strategy/sprint-ladder-ruling.md decision 1). Contract
 * §9 asks for "the next paid tier's LIST price" and contract §6b's own worked
 * example shows `"opportunityMonthlyEur": 39, "nextPlan": "radar"`, so the
 * contract is followed here. Account.tsx shows what a buyer is charged TODAY.
 * Both are correct for their own purpose. Flagged for the CQO review: if the
 * pipeline table should value an upgrade at what it would actually be sold for
 * this month, this becomes 29 and the contract's example needs amending.
 *
 * `offered: false` marks a tier that is never an UPGRADE TARGET. 'pro' is
 * legacy with no new signups — Account.tsx excludes it from PLAN_TIERS for
 * exactly this reason and re-appends it (as PRO_TIER_LEGACY) only for a client
 * already on it. A client on Managed must therefore be offered Enterprise, not
 * a sideways move onto a tier nobody can buy.
 *
 * `listPriceEur: null` means "no list price exists" (Enterprise is quoted), so
 * opportunityMonthlyEur is null rather than a made-up number.
 */
const PLAN_LADDER = [
  { plan: 'free',       listPriceEur: 0,    offered: true },
  { plan: 'radar',      listPriceEur: 39,   offered: true },
  { plan: 'essentials', listPriceEur: 99,   offered: true },
  { plan: 'growth',     listPriceEur: 299,  offered: true },
  { plan: 'growth_pro', listPriceEur: 449,  offered: true },
  { plan: 'managed',    listPriceEur: 1500, offered: true },
  { plan: 'pro',        listPriceEur: 1500, offered: false },
  { plan: 'enterprise', listPriceEur: null, offered: true },
]

/** Bucket key for anything whose plan could not be resolved from any line. */
const UNKNOWN_PLAN = '(unknown)'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read a key from either a Map or a plain object, tolerating the number/string
 * key split. Supabase hands `clients.id` back as a number and Stripe hands
 * `metadata.client_id` back as the string "1"; a lookup that only tried one of
 * them would silently drop the founding client's attribution.
 */
function lookup(map, key) {
  if (!map || key === undefined || key === null) return undefined
  const keys = typeof key === 'number' ? [key, String(key)] : [key, Number(key)]
  if (typeof map.get === 'function') {
    for (const k of keys) {
      if (typeof k === 'number' && Number.isNaN(k)) continue
      const hit = map.get(k)
      if (hit !== undefined) return hit
    }
    return undefined
  }
  for (const k of keys) {
    if (typeof k === 'number' && Number.isNaN(k)) continue
    if (Object.prototype.hasOwnProperty.call(map, k)) return map[k]
  }
  return undefined
}

/** Milliseconds from a Stripe unix-seconds int, an ISO string, a Date, or ms. */
function toMs(v) {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime()
  if (typeof v === 'number' && Number.isFinite(v)) {
    // Stripe timestamps are SECONDS. Anything under ~1e11 is seconds, anything
    // above is already milliseconds (1e11 ms is 1973; 1e11 s is the year 5138).
    return v < 1e11 ? Math.round(v * 1000) : Math.round(v)
  }
  if (typeof v === 'string') {
    const parsed = Date.parse(v)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

/** UTC month arithmetic with month-end clamping (2026-01-31 + 1mo = 2026-02-28). */
function addMonthsMs(ms, months) {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const day = d.getUTCDate()
  const lastOfTarget = new Date(Date.UTC(y, m + months + 1, 0)).getUTCDate()
  const clamped = Math.min(day, lastOfTarget)
  return Date.UTC(y, m + months, clamped,
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds())
}

/** Cents -> EUR, rounded to 2dp. The ONLY place rounding is allowed. */
function round2(n) {
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function centsToEur(cents) {
  return round2((Number(cents) || 0) / 100)
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** A trimmed non-empty string, or null. Stripe metadata values are strings. */
function metaString(v) {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

/** An id whether the caller expanded the object or left it as a string. */
function idOf(v) {
  if (!v) return null
  if (typeof v === 'string') return v
  if (typeof v === 'object' && typeof v.id === 'string') return v.id
  return null
}

/**
 * ISO-8601 week key, 'YYYY-Www'. Uses the Thursday rule, so the last days of
 * December can belong to week 1 of the following ISO year and vice versa —
 * which is precisely why the key carries the ISO year and not the calendar one.
 * Without that, a client active on 2026-12-30 and 2027-01-02 would collapse into
 * one "week 1" and read as less engaged than they are.
 */
function isoWeekKey(ms) {
  const d = new Date(ms)
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = t.getUTCDay() || 7          // Mon=1 .. Sun=7
  t.setUTCDate(t.getUTCDate() + 4 - dayNum)  // the Thursday of this ISO week
  const isoYear = t.getUTCFullYear()
  const jan1 = Date.UTC(isoYear, 0, 1)
  const week = Math.ceil(((t.getTime() - jan1) / 86400000 + 1) / 7)
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

function ymd(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

// ─────────────────────────────────────────────────────────────────────────────
// Period
// ─────────────────────────────────────────────────────────────────────────────

/**
 * periodForMonth('YYYY-MM', now?) -> { start, end, label, startMs, endMsExclusive }
 *
 * Defaults to the current UTC month per contract §6b. `end` is the LAST DAY of
 * the month (inclusive, matching §6b's "2026-08-31"), while `endMsExclusive` is
 * the first instant of the next month — the value every comparison below
 * actually uses. Keeping both stops the classic off-by-one where an invoice
 * created at 23:30 on the 31st falls outside its own month.
 */
function periodForMonth(label, now = new Date()) {
  let year, monthIdx
  if (typeof label === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(label.trim())) {
    const [y, m] = label.trim().split('-')
    year = Number(y)
    monthIdx = Number(m) - 1
  } else {
    year = now.getUTCFullYear()
    monthIdx = now.getUTCMonth()
  }
  const startMs = Date.UTC(year, monthIdx, 1)
  const endMsExclusive = Date.UTC(year, monthIdx + 1, 1)
  return {
    start: ymd(startMs),
    end: ymd(endMsExclusive - 86400000),
    label: `${MONTH_NAMES[monthIdx]} ${year}`,
    startMs,
    endMsExclusive,
  }
}

function inPeriod(ms, period) {
  if (ms === null || ms === undefined || !period) return false
  return ms >= period.startMs && ms < period.endMsExclusive
}

// ─────────────────────────────────────────────────────────────────────────────
// Client / customer resolution (contract §3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * resolveClientForCustomer(stripeCustomer, clientsById, clientsByStripeCustomerId)
 *   -> { clientId: number|null, attribution: 'metadata'|'stripe_customer_id'|'unattributed' }
 *
 * The resolution ORDER is contract §3's, and the order is load-bearing:
 *
 *   1. customer.metadata.client_id, if it parses as a whole number AND matches a
 *      real clients row. This is the hand-invoiced / founding-package path —
 *      BpR's real customer cus_UzwgTPWQfZtXOY carries metadata.client_id "1"
 *      while clients.id = 1 does NOT point back at it, so this is the only key
 *      that resolves the single largest invoice on the account.
 *   2. clients.stripe_customer_id === customer.id. The self-serve webhook path.
 *      Populated for exactly 1 of 38 clients today, and that one is scheduled
 *      for deletion — so this branch is real but currently near-dead, and will
 *      become the common case as self-serve subscribers arrive.
 *   3. unattributed. NOT dropped and NOT guessed onto a client. §3 is explicit:
 *      the row still carries its plan and amount and appears in the per-client
 *      table with clientId null, mirroring the "visible, not silent" pattern
 *      stripe-webhook.js already uses for checkout_without_acceptance.
 *
 * Strict integer parse, deliberately, matching resolveBoundClient() in
 * stripe-webhook.js: Number('') is 0 and parseInt('1 BpR') is 1, and attributing
 * revenue to the wrong client silently is worse than reporting it unattributed.
 * A metadata id that does not match a real client FALLS THROUGH to step 2 rather
 * than failing — the customer may still be linked the other way round.
 */
function resolveClientForCustomer(stripeCustomer, clientsById, clientsByStripeCustomerId) {
  const miss = { clientId: null, attribution: 'unattributed' }
  if (!stripeCustomer || typeof stripeCustomer !== 'object') return miss

  const raw = stripeCustomer.metadata ? stripeCustomer.metadata.client_id : undefined
  const text = metaString(raw)
  if (text && /^\d+$/.test(text)) {
    const id = Number(text)
    if (lookup(clientsById, id)) return { clientId: id, attribution: 'metadata' }
  }

  const byCustomer = lookup(clientsByStripeCustomerId, stripeCustomer.id)
  if (byCustomer && byCustomer.id !== undefined && byCustomer.id !== null) {
    return { clientId: Number(byCustomer.id), attribution: 'stripe_customer_id' }
  }

  return miss
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan resolution (contract §2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * planForInvoiceLine(line, priceToPlanFallback) -> string|null
 *
 * Mirrors stripe-webhook.js:358's pattern —
 *   plan = (price?.metadata?.plan) || PRICE_TO_PLAN[priceId]
 * — metadata first, hardcoded price-id map as the fallback for a price whose
 * metadata ever goes missing. The webhook's map is the same one the handler
 * passes in, so the two agree by construction rather than by convention.
 *
 * ⚠️ THREE METADATA LOCATIONS ARE TRIED, and this is defensive rather than
 * decorative. Contract §2 names `lines.data[].metadata.plan`; the webhook reads
 * `price.metadata.plan`; and the account now runs API version 2026-07-29.dahlia,
 * where an invoice line carries `pricing.price_details` instead of an embedded
 * `price` object. All three are checked in that order, so this resolves whether
 * the line was copied from the price's metadata, carries the price inline, or
 * only names it by id. Falling back through them costs nothing and a null plan
 * costs a warning on the admin's screen.
 */
function planForInvoiceLine(line, priceToPlanFallback) {
  if (!line || typeof line !== 'object') return null
  const fallback = priceToPlanFallback || {}

  const fromLine = line.metadata ? metaString(line.metadata.plan) : null
  if (fromLine) return fromLine

  const price = line.price && typeof line.price === 'object' ? line.price : null
  const fromPrice = price && price.metadata ? metaString(price.metadata.plan) : null
  if (fromPrice) return fromPrice

  const details = line.pricing && typeof line.pricing === 'object' ? line.pricing.price_details : null
  const fromDetails = details && details.metadata ? metaString(details.metadata.plan) : null
  if (fromDetails) return fromDetails

  for (const candidate of [
    price && price.id,
    details && details.price,
    details && details.product,
    line.plan && line.plan.id,
  ]) {
    const mapped = candidate ? lookup(fallback, candidate) : undefined
    if (mapped) return String(mapped)
  }

  return null
}

/**
 * planForInvoice(invoice, priceToPlanFallback) -> { plan, mixed, lineCount }
 *
 * ONE plan per invoice, taken from the first line that resolves. `mixed` is true
 * when the lines disagree, which the caller turns into a meta.warnings entry.
 *
 * ATTRIBUTING A WHOLE INVOICE TO ONE PLAN IS A STATED SIMPLIFICATION, not an
 * oversight. Every invoice on the account today is single-line, and per-line
 * amount allocation would need proration and discount apportionment that nothing
 * currently exercises. The `mixed` flag exists so the day a multi-tier invoice
 * appears, it is reported on the page rather than silently mis-bucketed.
 */
function planForInvoice(invoice, priceToPlanFallback) {
  const lines = invoice && invoice.lines && Array.isArray(invoice.lines.data)
    ? invoice.lines.data
    : []
  let plan = null
  let mixed = false
  for (const line of lines) {
    const resolved = planForInvoiceLine(line, priceToPlanFallback)
    if (!resolved) continue
    if (plan === null) plan = resolved
    else if (plan !== resolved) mixed = true
  }
  return { plan, mixed, lineCount: lines.length }
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoice money accessors
// ─────────────────────────────────────────────────────────────────────────────

function invoiceCreatedMs(invoice) {
  return invoice ? toMs(invoice.created) : null
}

function invoicePaidMs(invoice) {
  if (!invoice) return null
  const st = invoice.status_transitions
  return st ? toMs(st.paid_at) : null
}

/**
 * What the invoice ASKED FOR, in cents: `invoice.total`, which is after discount
 * and after tax. An invoice zeroed by a 100% coupon was genuinely invoiced for
 * EUR 0, and the euros given away appear separately as discountsEur — contract
 * §4 frames the discount line as "what the ladder would have earned minus what
 * it actually invoiced", which only holds if `total` is the post-discount figure.
 */
function invoiceTotalCents(invoice) {
  if (!invoice) return 0
  if (Number.isFinite(invoice.total)) return Math.round(invoice.total)
  if (Number.isFinite(invoice.amount_due)) return Math.round(invoice.amount_due)
  return 0
}

function invoicePaidCents(invoice) {
  if (!invoice) return 0
  return Math.round(num(invoice.amount_paid))
}

/** Every discount object reachable from an invoice, however Stripe expanded it. */
function discountObjectsOn(invoice) {
  const out = []
  const push = (d) => { if (d && typeof d === 'object') out.push(d) }
  if (Array.isArray(invoice && invoice.discounts)) invoice.discounts.forEach(push)
  push(invoice && invoice.discount)
  if (Array.isArray(invoice && invoice.total_discount_amounts)) {
    invoice.total_discount_amounts.forEach((entry) => push(entry && entry.discount))
  }
  return out
}

/**
 * invoiceDiscountCents(invoice) -> cents given away on this invoice.
 *
 * Contract §4: total_discount_amounts when Stripe provides it, otherwise the
 * coupon's percent_off/amount_off applied to the PRE-discount subtotal. The
 * fallback exists because total_discount_amounts is not populated on every
 * invoice shape, and a missing discount line would make a 100%-off founding
 * month look like a customer who simply paid nothing.
 */
function invoiceDiscountCents(invoice) {
  if (!invoice) return 0

  const tda = Array.isArray(invoice.total_discount_amounts) ? invoice.total_discount_amounts : null
  if (tda && tda.length) {
    return tda.reduce((sum, entry) => sum + Math.round(num(entry && entry.amount)), 0)
  }

  const subtotal = Number.isFinite(invoice.subtotal)
    ? Math.round(invoice.subtotal)
    : invoiceTotalCents(invoice)

  for (const discount of discountObjectsOn(invoice)) {
    const coupon = discount && discount.coupon
    if (!coupon || typeof coupon !== 'object') continue
    if (Number.isFinite(coupon.amount_off) && coupon.amount_off > 0) {
      return Math.round(coupon.amount_off)
    }
    if (Number.isFinite(coupon.percent_off) && coupon.percent_off > 0) {
      return Math.round(subtotal * coupon.percent_off / 100)
    }
  }
  return 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Affiliate attribution and commission (contract §4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every identifier on an invoice that could name a promotion code: the code's
 * own id, its human code, and the coupon id behind it. All three are returned
 * because the handler indexes promotion codes under all three, and which one an
 * invoice carries depends on how deeply Stripe expanded the discount.
 */
function promotionKeysOnInvoice(invoice) {
  const keys = []
  const add = (v) => { const id = idOf(v); if (id && !keys.includes(id)) keys.push(id) }
  for (const discount of discountObjectsOn(invoice)) {
    add(discount.promotion_code)
    if (discount.promotion_code && typeof discount.promotion_code === 'object') {
      const code = metaString(discount.promotion_code.code)
      if (code && !keys.includes(code)) keys.push(code)
    }
    add(discount.coupon)
  }
  return keys
}

/**
 * findAffiliateAttribution(customerInvoices, promotionCodesByCode) -> attribution|null
 *   attribution = { affiliateCode, attributedAt, promotionCode, invoiceId }
 *
 * WHY THE WHOLE HISTORY HAS TO BE WALKED, and why this cannot read a later
 * invoice directly (contract §4): the live coupon XKfymWe7 has duration `once`,
 * so Stripe applies and tags it on the FIRST invoice only. Invoice 2 onward
 * carries no promotion code at all. Attribution therefore lives exclusively on
 * the earliest invoice that ever carried an affiliate-tagged code, and every
 * later paid invoice inherits it for as long as the window holds.
 *
 * `promotionCodesByCode` may be keyed by promotion-code id, by the human code
 * ('BPRFREE'), or by coupon id — all three are tried, so the caller can index
 * however it likes. The attribution key itself is `metadata.affiliate` on the
 * PROMOTION CODE, verified live: BPRFREE -> promo_1U06XY63lspobjfOcXNBKaSI,
 * metadata.affiliate = "bpr".
 *
 * `invoiceId` is returned so computeCommissionForInvoice can recognise the
 * attributing invoice — the free month itself — and pay zero on it.
 */
function findAffiliateAttribution(customerInvoices, promotionCodesByCode) {
  const list = (Array.isArray(customerInvoices) ? customerInvoices : []).filter(Boolean)
  const sorted = list.slice().sort((a, b) => (invoiceCreatedMs(a) || 0) - (invoiceCreatedMs(b) || 0))

  for (const invoice of sorted) {
    for (const key of promotionKeysOnInvoice(invoice)) {
      const promo = lookup(promotionCodesByCode, key)
      const affiliate = promo && promo.metadata ? metaString(promo.metadata.affiliate) : null
      if (!affiliate) continue
      const createdMs = invoiceCreatedMs(invoice)
      return {
        affiliateCode: affiliate,
        attributedAt: createdMs === null ? null : new Date(createdMs).toISOString(),
        promotionCode: metaString(promo.code) || key,
        invoiceId: invoice.id || null,
      }
    }
  }
  return null
}

/**
 * isWithinCommissionWindow(invoiceDate, attributedAt, months=12) -> boolean
 *
 * HALF-OPEN on purpose: [attributedAt, attributedAt + months). An invoice dated
 * exactly 12 months after attribution is OUT. "20% recurring for 12 months"
 * means twelve monthly invoices, and treating the thirteenth as inside would
 * accrue a thirteenth commission on a twelve-month term.
 *
 * An invoice dated BEFORE attribution is also out — it predates the referral.
 */
function isWithinCommissionWindow(invoiceDate, attributedAt, months = COMMISSION_WINDOW_MONTHS) {
  const invoiceMs = toMs(invoiceDate)
  const fromMs = toMs(attributedAt)
  if (invoiceMs === null || fromMs === null) return false
  if (invoiceMs < fromMs) return false
  return invoiceMs < addMonthsMs(fromMs, months)
}

/**
 * computeCommissionForInvoice(invoice, attribution, rate=0.20) -> cents
 *
 * Zero in four cases, each of which is a real scenario rather than defensive
 * padding:
 *   - no attribution: the customer never redeemed an affiliate code.
 *   - THIS IS THE ATTRIBUTING INVOICE. D-7's ruling is "free month = zero
 *     commission accrues" (contract §4). Matched by invoice id, not by amount,
 *     so it holds even if the free month were ever partially paid.
 *   - nothing was paid: commission accrues on paid revenue, not on an open
 *     invoice. BpR's EUR 3,500 founding invoice is `status: open` right now.
 *   - outside the 12-month window.
 *
 * Dated by paid_at when present, falling back to created. The commission is
 * earned when the money arrives, and an invoice paid late should be measured
 * against the window at the moment it cleared.
 */
function computeCommissionForInvoice(invoice, attribution, rate = COMMISSION_RATE) {
  if (!invoice || !attribution || !attribution.affiliateCode) return 0
  if (attribution.invoiceId && invoice.id === attribution.invoiceId) return 0

  const paidCents = invoicePaidCents(invoice)
  if (paidCents <= 0) return 0

  const when = invoicePaidMs(invoice) !== null ? invoicePaidMs(invoice) : invoiceCreatedMs(invoice)
  if (!isWithinCommissionWindow(when, attribution.attributedAt)) return 0

  return Math.round(paidCents * rate)
}

// ─────────────────────────────────────────────────────────────────────────────
// Refund attribution (contract §2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * refundTarget(refund) -> { invoiceId, customerId }
 *
 * A Refund names a CHARGE, not an invoice, so contract §2's chain is
 * refund -> charge -> invoice/customer. The handler expands `data.charge`, so
 * the expanded object is read here; a bare charge id yields nulls and the caller
 * raises a warning rather than netting the refund against nothing.
 */
function refundTarget(refund) {
  const out = { invoiceId: null, customerId: null }
  if (!refund || typeof refund !== 'object') return out

  const charge = refund.charge && typeof refund.charge === 'object' ? refund.charge : null
  out.invoiceId = idOf(refund.invoice) || (charge ? idOf(charge.invoice) : null)
  out.customerId = idOf(refund.customer) || (charge ? idOf(charge.customer) : null)
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// API cost (contract §5)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sumApiCostByClient(aiResultsRows, engineCostEur) ->
 *   { costByClientId, estimatedRowsByClientId, totalCostEur, totalEstimatedRows }
 *
 * A FAITHFUL SERVER-SIDE COPY of Usage.tsx's load() effect (Usage.tsx:145-192),
 * and it is a copy on purpose. Contract §5 requires the Cost tab and the Revenue
 * tab's cost line to always agree, and the only way to guarantee that is for
 * both to apply the same rule to the same rows: SUM the metered cost_eur, and
 * fall back to the flat per-engine estimate ONLY for legacy rows whose cost_eur
 * is NULL (rows written before metering landed 2026-07-29).
 *
 * `estimatedRowsByClientId` carries how many rows in each client's total came
 * from the flat estimate rather than a measured figure — the same "real vs
 * estimated" split Usage.tsx already surfaces. A Revenue page whose cost line is
 * mostly estimate should say so.
 *
 * `engineCostEur` is _cost.js's ENGINE_COST_EUR, passed in rather than required,
 * so this file stays pure and the harness can substitute a known table.
 */
function sumApiCostByClient(aiResultsRows, engineCostEur) {
  const costs = engineCostEur || {}
  const costByClientId = {}
  const estimatedRowsByClientId = {}
  let totalCostEur = 0
  let totalEstimatedRows = 0

  for (const row of Array.isArray(aiResultsRows) ? aiResultsRows : []) {
    if (!row) continue
    const clientId = row.client_id
    if (clientId === null || clientId === undefined) continue
    const engine = row.llm
    const metered = row.cost_eur

    let cost
    if (metered !== null && metered !== undefined && Number.isFinite(Number(metered))) {
      cost = Number(metered)
    } else {
      cost = num(lookup(costs, engine))
      estimatedRowsByClientId[clientId] = (estimatedRowsByClientId[clientId] || 0) + 1
      totalEstimatedRows += 1
    }

    costByClientId[clientId] = (costByClientId[clientId] || 0) + cost
    totalCostEur += cost
  }

  return { costByClientId, estimatedRowsByClientId, totalCostEur, totalEstimatedRows }
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregation (contract §5, §6b)
// ─────────────────────────────────────────────────────────────────────────────

function emptyBucket(extra) {
  return Object.assign({
    grossCents: 0,
    paidCents: 0,
    refundCents: 0,
    discountCents: 0,
    commissionCents: 0,
    costEur: 0,
    invoiceCount: 0,
  }, extra || {})
}

/**
 * netEur — the ONE place contract §5's formula is evaluated:
 *
 *   net_revenue = paid_revenue - refunds - affiliate_commission_accrued
 *               - estimated_api_cost
 *
 * Cents stay cents until this line; cost is already EUR. Rounded once, here.
 */
function netEur(bucket) {
  const stripeSideCents = bucket.paidCents - bucket.refundCents - bucket.commissionCents
  return round2(stripeSideCents / 100 - bucket.costEur)
}

function shapeMoney(bucket) {
  return {
    grossInvoicedEur: centsToEur(bucket.grossCents),
    paidRevenueEur: centsToEur(bucket.paidCents),
    refundsEur: centsToEur(bucket.refundCents),
    discountsEur: centsToEur(bucket.discountCents),
    affiliateCommissionEstEur: centsToEur(bucket.commissionCents),
    estimatedApiCostEur: round2(bucket.costEur),
    netRevenueEur: netEur(bucket),
  }
}

/**
 * aggregateRevenue({ invoices, refunds, customers, clients, costByClientId,
 *                    period, priceToPlanFallback, promotionCodes })
 *   -> { global, byPlan, byClient, affiliates, warnings }
 *
 * Builds contract §6b's `global`, `byPlan` and `byClient` (plus `affiliates`,
 * and the warnings the handler folds into `meta.warnings`). `pipeline` and
 * `meta` are built elsewhere.
 *
 * ── PASS THE FULL INVOICE HISTORY, NOT JUST THE PERIOD'S ────────────────────
 * `invoices` must be every invoice on the account, not a pre-filtered month.
 * The period filter is applied INSIDE, per figure, because the three top-line
 * numbers use three different dates:
 *
 *   grossInvoicedEur       filtered on invoice.created            (§5)
 *   paidRevenueEur         filtered on status_transitions.paid_at (§5)
 *   discountsEur           filtered on invoice.created, matching gross (§4)
 *
 * and because affiliate attribution has to walk a customer's ENTIRE history to
 * find the earliest tagged invoice (§4) — an invoice from eight months ago is
 * what makes this month's invoice commissionable. Handing this function one
 * month of invoices would silently zero every commission.
 *
 * Gross and paid are deliberately different numbers and the page labels them so:
 * BpR's EUR 3,500 founding invoice is `status: open` and due 2026-08-04, so it
 * is EUR 3,500 of gross invoiced this month and EUR 0 of paid and net revenue
 * until it clears (§5).
 *
 * ── EVERY CLIENT WITH API SPEND GETS A ROW, even with no Stripe activity ────
 * Otherwise the per-client table would not sum to its own global total, and the
 * clients that cost money while earning none — the 27 research studies, a free
 * signup collecting weekly — would be invisible on the one page whose job is to
 * show what the business nets. Those rows carry `attribution: null`; see the
 * note on `attribution` below.
 */
function aggregateRevenue({
  invoices = [],
  refunds = [],
  customers = [],
  clients = [],
  costByClientId = {},
  period,
  priceToPlanFallback = {},
  promotionCodes = {},
  commissionRate = COMMISSION_RATE,
} = {}) {
  const warnings = []
  const warn = (msg) => { if (!warnings.includes(msg)) warnings.push(msg) }

  if (!period || typeof period.startMs !== 'number' || typeof period.endMsExclusive !== 'number') {
    throw new Error('aggregateRevenue: period must come from periodForMonth()')
  }

  // ── Indexes ───────────────────────────────────────────────────────────────
  const clientsById = new Map()
  const clientsByStripeCustomerId = new Map()
  for (const c of clients || []) {
    if (!c || c.id === undefined || c.id === null) continue
    clientsById.set(Number(c.id), c)
    const scid = metaString(c.stripe_customer_id)
    if (scid) clientsByStripeCustomerId.set(scid, c)
  }

  const customersById = new Map()
  for (const cust of customers || []) {
    if (cust && cust.id) customersById.set(cust.id, cust)
  }

  // Resolution per Stripe customer, computed once (contract §3).
  const resolutionByCustomerId = new Map()
  for (const [custId, cust] of customersById) {
    resolutionByCustomerId.set(custId, resolveClientForCustomer(cust, clientsById, clientsByStripeCustomerId))
  }
  const resolutionFor = (custId) => {
    if (!custId) return { clientId: null, attribution: 'unattributed' }
    return resolutionByCustomerId.get(custId) || { clientId: null, attribution: 'unattributed' }
  }

  // ── Affiliate attribution, per customer, over the whole history (§4) ───────
  const invoicesByCustomer = new Map()
  const invoicesById = new Map()
  for (const inv of invoices || []) {
    if (!inv) continue
    if (inv.id) invoicesById.set(inv.id, inv)
    const custId = idOf(inv.customer)
    if (!custId) continue
    if (!invoicesByCustomer.has(custId)) invoicesByCustomer.set(custId, [])
    invoicesByCustomer.get(custId).push(inv)
  }

  const attributionByCustomer = new Map()
  for (const [custId, list] of invoicesByCustomer) {
    const attribution = findAffiliateAttribution(list, promotionCodes)
    if (attribution) attributionByCustomer.set(custId, attribution)
  }

  // ── Buckets ───────────────────────────────────────────────────────────────
  // Keyed so that two Stripe customers resolving to the same client MERGE, while
  // two unattributed customers stay apart as their own rows.
  const clientBuckets = new Map()
  const planBuckets = new Map()
  const affiliateBuckets = new Map()

  const bucketKeyFor = (resolution, custId) =>
    (resolution.clientId !== null && resolution.clientId !== undefined)
      ? `client:${resolution.clientId}`
      : `customer:${custId || 'none'}`

  const clientBucket = (resolution, custId) => {
    const key = bucketKeyFor(resolution, custId)
    let bucket = clientBuckets.get(key)
    if (!bucket) {
      const client = resolution.clientId !== null ? lookup(clientsById, resolution.clientId) : null
      const customer = custId ? customersById.get(custId) : null
      bucket = emptyBucket({
        clientId: resolution.clientId,
        clientName: client
          ? (client.name || `Client ${resolution.clientId}`)
          : (customer ? (customer.name || customer.email || customer.id) : 'Unknown customer'),
        plan: client ? (client.plan || null) : null,
        attribution: resolution.attribution,
        stripeCustomerId: custId || null,
      })
      clientBuckets.set(key, bucket)
    }
    // A client billed through more than one Stripe customer keeps the first id
    // seen rather than flapping; the merge itself is what matters.
    if (!bucket.stripeCustomerId && custId) bucket.stripeCustomerId = custId
    return bucket
  }

  const planBucket = (plan) => {
    const key = plan || UNKNOWN_PLAN
    let bucket = planBuckets.get(key)
    if (!bucket) {
      bucket = emptyBucket({ plan: key })
      planBuckets.set(key, bucket)
    }
    return bucket
  }

  const affiliateBucket = (code) => {
    let bucket = affiliateBuckets.get(code)
    if (!bucket) {
      bucket = { affiliateCode: code, redemptions: 0, attributedCustomerIds: new Set(), commissionCents: 0 }
      affiliateBuckets.set(code, bucket)
    }
    return bucket
  }

  for (const attribution of attributionByCustomer.values()) {
    affiliateBucket(attribution.affiliateCode)
  }
  for (const [custId, attribution] of attributionByCustomer) {
    const bucket = affiliateBucket(attribution.affiliateCode)
    bucket.redemptions += 1
    bucket.attributedCustomerIds.add(custId)
  }

  // ── Invoices ──────────────────────────────────────────────────────────────
  const planByInvoiceId = new Map()

  for (const invoice of invoices || []) {
    if (!invoice) continue

    const custId = idOf(invoice.customer)
    const resolution = resolutionFor(custId)
    const { plan, mixed, lineCount } = planForInvoice(invoice, priceToPlanFallback)
    planByInvoiceId.set(invoice.id, plan)

    const createdMs = invoiceCreatedMs(invoice)
    const paidMs = invoicePaidMs(invoice)
    const createdInPeriod = inPeriod(createdMs, period)
    const paidInPeriod = inPeriod(paidMs, period)

    // Nothing about this invoice lands in this period. Still indexed above for
    // affiliate attribution, which is exactly why it was passed in.
    if (!createdInPeriod && !paidInPeriod) continue

    const cb = clientBucket(resolution, custId)
    const pb = planBucket(plan)

    if (createdInPeriod) {
      const grossCents = invoiceTotalCents(invoice)
      const discountCents = invoiceDiscountCents(invoice)
      cb.grossCents += grossCents
      cb.discountCents += discountCents
      cb.invoiceCount += 1
      pb.grossCents += grossCents
      pb.discountCents += discountCents
      pb.invoiceCount += 1

      if (!plan) {
        warn(`Invoice ${invoice.id || '(no id)'} (${centsToEur(grossCents)} ${String(invoice.currency || 'eur').toUpperCase()}): plan could not be resolved from any of its ${lineCount} line(s); counted under "${UNKNOWN_PLAN}".`)
      }
      if (mixed) {
        warn(`Invoice ${invoice.id || '(no id)'} has lines on more than one plan; the whole invoice is attributed to "${plan}".`)
      }
      if (invoice.currency && String(invoice.currency).toLowerCase() !== 'eur') {
        warn(`Invoice ${invoice.id || '(no id)'} is in ${String(invoice.currency).toUpperCase()}, not EUR; its amount is summed as if it were EUR.`)
      }
      if (invoice.lines && invoice.lines.has_more === true) {
        warn(`Invoice ${invoice.id || '(no id)'} has more line items than were fetched; its plan may be incomplete.`)
      }
      if (resolution.attribution === 'unattributed' && grossCents > 0) {
        warn(`Stripe customer ${custId || '(none)'} (${centsToEur(grossCents)} EUR invoiced) resolves to no client: no metadata.client_id and no clients.stripe_customer_id match.`)
      }
    }

    if (paidInPeriod) {
      const paidCents = invoicePaidCents(invoice)
      cb.paidCents += paidCents
      pb.paidCents += paidCents

      const attribution = custId ? attributionByCustomer.get(custId) : null
      if (attribution) {
        const commissionCents = computeCommissionForInvoice(invoice, attribution, commissionRate)
        if (commissionCents > 0) {
          cb.commissionCents += commissionCents
          pb.commissionCents += commissionCents
          affiliateBucket(attribution.affiliateCode).commissionCents += commissionCents
        }
      }
    }
  }

  // ── Refunds (§2: refund -> charge -> invoice/customer) ────────────────────
  for (const refund of refunds || []) {
    if (!refund) continue
    if (!inPeriod(toMs(refund.created), period)) continue

    const amountCents = Math.round(num(refund.amount))
    if (amountCents === 0) continue

    const { invoiceId, customerId } = refundTarget(refund)
    const invoice = invoiceId ? invoicesById.get(invoiceId) : null
    const custId = customerId || (invoice ? idOf(invoice.customer) : null)

    if (!custId) {
      warn(`Refund ${refund.id || '(no id)'} (${centsToEur(amountCents)} EUR) could not be traced to a charge, invoice or customer; it is in the global total but in no per-client or per-plan row.`)
    }

    const resolution = resolutionFor(custId)
    const plan = invoiceId && planByInvoiceId.has(invoiceId)
      ? planByInvoiceId.get(invoiceId)
      : (resolution.clientId !== null ? (lookup(clientsById, resolution.clientId) || {}).plan || null : null)

    if (custId || resolution.clientId !== null) {
      clientBucket(resolution, custId).refundCents += amountCents
    }
    planBucket(plan).refundCents += amountCents
  }

  // ── API cost per client (§5) ──────────────────────────────────────────────
  // Applied to whichever bucket already exists for that client, or a fresh one.
  // A client that only costs money still gets a row — see the header note.
  const bucketByClientId = new Map()
  for (const bucket of clientBuckets.values()) {
    if (bucket.clientId !== null && bucket.clientId !== undefined) {
      bucketByClientId.set(Number(bucket.clientId), bucket)
    }
  }

  for (const rawId of Object.keys(costByClientId || {})) {
    const clientId = Number(rawId)
    if (!Number.isFinite(clientId)) continue
    const costEur = num(costByClientId[rawId])
    if (costEur === 0) continue

    let bucket = bucketByClientId.get(clientId)
    if (!bucket) {
      const client = lookup(clientsById, clientId)
      bucket = emptyBucket({
        clientId,
        clientName: client ? (client.name || `Client ${clientId}`) : `Client ${clientId}`,
        plan: client ? (client.plan || null) : null,
        // NOT 'unattributed'. Contract §6b defines that value as "no client
        // resolved — clientId: null", and this row HAS a client; it simply has
        // no Stripe customer for the attribution question to be asked about.
        // Reporting it as unattributed would claim a join failure that never
        // happened. Flagged for the CQO review: the contract's enum does not
        // cover a cost-only row.
        attribution: null,
        stripeCustomerId: client ? (metaString(client.stripe_customer_id) || null) : null,
      })
      clientBuckets.set(`client:${clientId}`, bucket)
      bucketByClientId.set(clientId, bucket)
    }
    bucket.costEur += costEur
    planBucket(bucket.plan).costEur += costEur
  }

  // ── Global ────────────────────────────────────────────────────────────────
  const global = emptyBucket()
  for (const bucket of clientBuckets.values()) {
    global.grossCents += bucket.grossCents
    global.paidCents += bucket.paidCents
    global.discountCents += bucket.discountCents
    global.commissionCents += bucket.commissionCents
    global.costEur += bucket.costEur
    global.invoiceCount += bucket.invoiceCount
  }
  // Refunds are summed from the plan buckets, not the client ones: a refund that
  // traces to no customer at all still has to reach the global total (§5 nets
  // ALL refunds in the period), and planBucket(null) always receives it.
  for (const bucket of planBuckets.values()) {
    global.refundCents += bucket.refundCents
  }

  const byPlan = [...planBuckets.values()]
    .map((b) => Object.assign({ plan: b.plan }, shapeMoney(b), { invoiceCount: b.invoiceCount }))
    .sort((a, b) => b.grossInvoicedEur - a.grossInvoicedEur || String(a.plan).localeCompare(String(b.plan)))

  const byClient = [...clientBuckets.values()]
    .map((b) => Object.assign({
      clientId: b.clientId,
      clientName: b.clientName,
      plan: b.plan,
    }, shapeMoney(b), {
      attribution: b.attribution,
      stripeCustomerId: b.stripeCustomerId,
      invoiceCount: b.invoiceCount,
    }))
    .sort((a, b) => b.grossInvoicedEur - a.grossInvoicedEur
      || b.paidRevenueEur - a.paidRevenueEur
      || String(a.clientName).localeCompare(String(b.clientName)))

  const affiliates = [...affiliateBuckets.values()]
    .map((b) => ({
      affiliateCode: b.affiliateCode,
      redemptions: b.redemptions,
      attributedClients: b.attributedCustomerIds.size,
      commissionAccruedEur: centsToEur(b.commissionCents),
    }))
    .sort((a, b) => b.commissionAccruedEur - a.commissionAccruedEur
      || a.affiliateCode.localeCompare(b.affiliateCode))

  return { global: shapeMoney(global), byPlan, byClient, affiliates, warnings }
}

// ─────────────────────────────────────────────────────────────────────────────
// Engagement pipeline (contract §9)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * nextOfferedPlan(plan, ladder) -> { plan, listPriceEur } | null
 *
 * The next rung a client could actually be SOLD. Skips `offered: false` tiers —
 * 'pro' is legacy with no new signups, so a Managed client's upgrade path is
 * Enterprise, not a sideways move onto a tier that cannot be bought. Returns
 * null at the top of the ladder, and a null listPriceEur for Enterprise, which
 * is quoted rather than listed.
 */
function nextOfferedPlan(plan, ladder = PLAN_LADDER) {
  const idx = ladder.findIndex((entry) => entry.plan === plan)
  if (idx === -1) return null
  for (let i = idx + 1; i < ladder.length; i++) {
    if (ladder[i].offered) return { plan: ladder[i].plan, listPriceEur: ladder[i].listPriceEur }
  }
  return null
}

/**
 * computeEngagementPipeline({ freeClients, aiResultsRows, planOrder, windowDays,
 *                             engagedWeeks, now }) -> { clients: [...] }
 *
 * Contract §9. Answers Constantin's own question: which non-paying clients are
 * using the product CONSTANTLY (a campaign target) versus which ran it once and
 * never came back (not a target).
 *
 * ── WHY DISTINCT WEEKS AND NOT A ROW COUNT ─────────────────────────────────
 * A single burst — the collection that fires the day someone signs up — produces
 * dozens of ai_results rows in one afternoon. Counted raw, that client reads as
 * the most engaged account on the platform while having opened the product
 * exactly once. Counting DISTINCT ISO weeks with at least one row makes a
 * hundred rows in one week worth the same as one row in one week, which is the
 * distinction §9 asks for. Engaged at >= 3 distinct weeks in the trailing 60
 * days — explicitly a v1 heuristic to retune once real distribution exists, not
 * a fitted threshold.
 *
 * Rows are filtered to the trailing window here as well as in the query, so the
 * function is correct on whatever it is handed. Clients with zero activity in
 * the window are omitted: the table is a campaign target list, and a free signup
 * who has not run anything in 60 days is neither engaged nor "used it once
 * recently" — they are dormant, and a different campaign's problem.
 *
 * `engaged` is an ADDITIVE field not named in contract §6b. It is the boolean
 * the threshold implies, precomputed so the UI cannot apply a different rule
 * than the report does. Flagged rather than assumed.
 */
function computeEngagementPipeline({
  freeClients = [],
  aiResultsRows = [],
  planOrder = PLAN_LADDER,
  windowDays = 60,
  engagedWeeks = 3,
  now = new Date(),
} = {}) {
  const nowMs = now instanceof Date ? now.getTime() : toMs(now)
  const cutoffMs = nowMs - windowDays * 86400000

  const activity = new Map()
  for (const row of Array.isArray(aiResultsRows) ? aiResultsRows : []) {
    if (!row) continue
    const clientId = row.client_id
    if (clientId === null || clientId === undefined) continue
    const ms = toMs(row.checked_at)
    if (ms === null || ms < cutoffMs) continue

    const key = Number(clientId)
    let stat = activity.get(key)
    if (!stat) { stat = { weeks: new Set(), lastMs: null }; activity.set(key, stat) }
    stat.weeks.add(isoWeekKey(ms))
    if (stat.lastMs === null || ms > stat.lastMs) stat.lastMs = ms
  }

  const rows = []
  for (const client of Array.isArray(freeClients) ? freeClients : []) {
    if (!client || client.id === undefined || client.id === null) continue
    // Defence in depth: §9 excludes research clients from the population, and
    // the handler filters them out. Repeated here so the function is correct on
    // any input — a research study appearing as an "upgrade opportunity" would
    // be a campaign aimed at ourselves.
    if (client.category === 'research') continue

    const stat = activity.get(Number(client.id))
    const distinctActiveWeeks = stat ? stat.weeks.size : 0
    if (distinctActiveWeeks === 0) continue

    const next = nextOfferedPlan(client.plan, planOrder)
    rows.push({
      clientId: Number(client.id),
      clientName: client.name || `Client ${client.id}`,
      plan: client.plan || null,
      distinctActiveWeeks,
      lastActiveAt: stat && stat.lastMs !== null ? new Date(stat.lastMs).toISOString() : null,
      opportunityMonthlyEur: next ? next.listPriceEur : null,
      nextPlan: next ? next.plan : null,
      engaged: distinctActiveWeeks >= engagedWeeks,
    })
  }

  rows.sort((a, b) => b.distinctActiveWeeks - a.distinctActiveWeeks
    || String(b.lastActiveAt || '').localeCompare(String(a.lastActiveAt || ''))
    || a.clientId - b.clientId)

  return { windowDays, engagedThresholdWeeks: engagedWeeks, clients: rows }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // constants
  COMMISSION_RATE,
  COMMISSION_WINDOW_MONTHS,
  PLAN_LADDER,
  UNKNOWN_PLAN,
  // period
  periodForMonth,
  inPeriod,
  // resolution
  resolveClientForCustomer,
  planForInvoiceLine,
  planForInvoice,
  // invoice accessors
  invoiceCreatedMs,
  invoicePaidMs,
  invoiceTotalCents,
  invoicePaidCents,
  invoiceDiscountCents,
  // affiliate
  promotionKeysOnInvoice,
  findAffiliateAttribution,
  isWithinCommissionWindow,
  computeCommissionForInvoice,
  // refunds
  refundTarget,
  // cost
  sumApiCostByClient,
  // aggregation
  aggregateRevenue,
  // pipeline
  nextOfferedPlan,
  computeEngagementPipeline,
  // small helpers, exported for the harness
  isoWeekKey,
  addMonthsMs,
  round2,
  centsToEur,
  toMs,
}
