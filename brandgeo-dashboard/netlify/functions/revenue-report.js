/**
 * revenue-report.js — admin-only Revenue report for a single month (S21).
 *
 * POST /.netlify/functions/revenue-report
 * Body: { period?: 'YYYY-MM' }   defaults to the current UTC month
 * Auth: requireAuth(event, { adminOnly: true })
 *
 * Returns exactly the JSON shape in docs/arch/revenue-report-data-contract.md
 * §6b, which is BINDING for this function and for the React page being built
 * against it. Every formula lives in _revenue.js as a pure function; this file
 * is I/O and assembly only. If a number here looks wrong, the arithmetic is in
 * _revenue.js and its evidence is tests/revenue_report.test.js.
 *
 * READ-ONLY, AND THAT IS A PROPERTY OF THE FILE, NOT A HABIT. It calls only
 * Stripe `list`/`retrieve` and Supabase `select`. It creates, modifies and
 * deletes nothing, in Stripe or in Supabase (contract §2, §7). Anything that
 * would write belongs in a different function.
 *
 * ── CSA SCALE NOTE (contract §6, rule 8) ────────────────────────────────────
 * This function PAGES EVERY INVOICE ON THE ACCOUNT ON EVERY LOAD, and it has to:
 * affiliate attribution (contract §4) can only be read off a customer's earliest
 * tagged invoice, so the whole history is required to compute one month's
 * commission. That is fine at today's volume — 38 clients, 2 invoices, 1 charge,
 * 0 subscriptions (verified 2026-08-02) — and it breaks well before 10,000
 * subscribers. There is no caching and nothing is memoised between calls.
 *
 * The upgrade path is a monthly `revenue_snapshots` table written by a scheduled
 * job, with this function reading snapshots for closed months and computing only
 * the open one. Noted now, built later, tracked as S21 Phase 2 alongside the
 * already-registered `operating_costs` table. NOT built in this task.
 *
 * The hard caps below (MAX_STRIPE_OBJECTS, page limits on the Supabase reads)
 * exist so that the failure mode at scale is a visible warning on the page
 * rather than a function that times out with no explanation.
 *
 * ── SUBSCRIPTIONS ARE DELIBERATELY NOT FETCHED ──────────────────────────────
 * Contract §2 lists Subscriptions as a source "for MRR", but §6b — the binding
 * response shape — carries no MRR field anywhere, in global, byPlan or byClient.
 * Fetching a list to compute a number the contract gives nowhere to put would be
 * inventing a field the UI is not being built against. Raised in the handoff
 * rather than resolved here. There are 0 live subscriptions today either way.
 *
 * Requires env vars: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY.
 * No new environment variable is introduced by this function.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { ENGINE_COST_EUR } = require('./_cost')
const {
  periodForMonth,
  sumApiCostByClient,
  aggregateRevenue,
  computeEngagementPipeline,
} = require('./_revenue')

/**
 * Fallback price-id -> plan map. A HAND COPY of stripe-webhook.js's PRICE_TO_PLAN,
 * and it is a copy for the same reason _cost.js's constants are: that map is a
 * module-level const in a file whose module load constructs a Stripe client and
 * a service-role Supabase client from environment variables. Requiring it from a
 * read-only report to borrow one object would drag both of those in.
 *
 * Only the FALLBACK is duplicated, never the resolution rule: the primary source
 * is metadata.plan on the line or the price, exactly as the webhook resolves it
 * (stripe-webhook.js:358), and _revenue.js's planForInvoiceLine implements that
 * order. This map only ever answers for a price whose metadata went missing.
 *
 * Keep in step with stripe-webhook.js:75-94 by hand. A price missing from both
 * is not silent: the invoice lands under "(unknown)" and says so in
 * meta.warnings, which is the whole reason that bucket exists.
 */
const PRICE_TO_PLAN = {
  price_1Ty5ZyKh2GaZE2B4UBLxnzdc: 'essentials', // Essentials €99/mo
  price_1Ty5a0Kh2GaZE2B4cRsrKalr: 'essentials', // Essentials €990/yr
  price_1Ty5a3Kh2GaZE2B4WSWURHv8: 'growth',     // Growth €299/mo
  price_1Ty5a5Kh2GaZE2B4NivZ8zmd: 'growth',     // Growth €2,990/yr
  price_1Ty5a7Kh2GaZE2B4vQhoTktV: 'growth_pro', // Growth PRO €449/mo
  price_1Ty5a9Kh2GaZE2B4ibycxUST: 'growth_pro', // Growth PRO €4,490/yr
  // Superseded catalogue, kept for the same reason the webhook keeps it: the old
  // payment links are still active, so an invoice raised through one must still
  // resolve to a tier rather than landing under "(unknown)".
  price_1TrLPgKh2GaZE2B4kqgmQsiO: 'essentials',
  price_1TrLSeKh2GaZE2B48iVobXF9: 'essentials',
  price_1TrLQhKh2GaZE2B4gLPWMger: 'growth',
  price_1TrLR6Kh2GaZE2B4mYqOHBhQ: 'growth',
}

/** Contract §9's population and thresholds. Stated here so the response echoes them. */
const PIPELINE_WINDOW_DAYS = 60
const PIPELINE_ENGAGED_WEEKS = 3
const PIPELINE_PLANS = ['free']
const RESEARCH_CATEGORY = 'research'

/**
 * Hard ceiling per Stripe collection. Reaching it produces a warning ON THE PAGE
 * rather than a silently truncated total — an admin must never read a number
 * that is quietly missing half its inputs. See the CSA note above.
 */
const MAX_STRIPE_OBJECTS = 5000
const SUPABASE_PAGE = 1000
const SUPABASE_MAX_PAGES = 60   // 60,000 rows

/**
 * Strip anything that could be a credential out of a string before it is logged
 * or returned. Stripe's own error messages do not normally echo the key, but
 * "normally" is not a guarantee worth making about a public repo's error path,
 * and this function's response goes to a browser. Covers Stripe secret/restricted
 * keys and JWT-shaped values (the Supabase service key).
 */
function redact(text) {
  return String(text === null || text === undefined ? '' : text)
    .replace(/\b[sr]k_(live|test)_[A-Za-z0-9]+/g, '[redacted-key]')
    .replace(/\bey[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g, '[redacted-token]')
}

/**
 * Drain a Stripe list into an array. Auto-pagination, capped.
 *
 * The cap is a WARNING, not a silent break: a truncated invoice list would
 * understate revenue and, worse, could drop the earliest tagged invoice and zero
 * a partner's commission without anything on screen changing.
 */
async function listAll(label, listResult, cap, warn) {
  const out = []
  for await (const item of listResult) {
    out.push(item)
    if (out.length >= cap) {
      warn(`More than ${cap} ${label} exist on the account; this report reads only the first ${cap}. Totals are INCOMPLETE — see the scale note in revenue-report.js.`)
      break
    }
  }
  return out
}

/**
 * Drain a Supabase select with range pagination.
 *
 * PostgREST caps a select at 1,000 rows by default and returns the truncated set
 * with no error and no flag. ai_results is the largest table in the project, so
 * an unpaged read would silently report a fraction of the month's API cost and
 * look entirely plausible doing it. `build()` is called per page because a
 * PostgREST query builder is single-use.
 */
async function selectAll(label, build, warn) {
  const out = []
  for (let page = 0; page < SUPABASE_MAX_PAGES; page++) {
    const from = page * SUPABASE_PAGE
    const { data, error } = await build().range(from, from + SUPABASE_PAGE - 1)
    if (error) throw new Error(`${label} query failed: ${error.message}`)
    const rows = data || []
    out.push(...rows)
    if (rows.length < SUPABASE_PAGE) return out
  }
  warn(`More than ${SUPABASE_MAX_PAGES * SUPABASE_PAGE} ${label} rows in this window; the report reads only the first ${SUPABASE_MAX_PAGES * SUPABASE_PAGE}. Cost figures are INCOMPLETE.`)
  return out
}

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  const headers = auth.headers
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  let body = {}
  if (event.body) {
    try { body = JSON.parse(event.body) || {} } catch { return json(400, { error: 'Invalid JSON' }) }
  }

  const warnings = []
  const warn = (msg) => { if (msg && !warnings.includes(msg)) warnings.push(msg) }

  // periodForMonth falls back to the current UTC month for anything it cannot
  // parse rather than throwing (contract §6b makes the parameter optional). The
  // fallback is silent by construction, so it is announced here — an admin who
  // typed '2026-13' must not read August's numbers believing they are
  // December's.
  const period = periodForMonth(body.period)
  if (body.period !== undefined && body.period !== null
      && !(typeof body.period === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(String(body.period).trim()))) {
    warn(`Requested period ${JSON.stringify(body.period)} is not a 'YYYY-MM' value; reporting on ${period.label} instead.`)
  }

  const log = (...a) => console.log('[revenue-report]', ...a)

  try {
    // ── Clients ─────────────────────────────────────────────────────────────
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      // Named, never printed.
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY are not configured for this function')
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

    // .order('id'): CQO review F10 -- Postgres does not guarantee stable row
    // order across LIMIT/OFFSET without an ORDER BY, so a paged read with none
    // can skip or repeat rows across pages. Not reachable at today's row
    // counts, but ai_results already holds more rows than one page.
    const clients = await selectAll('clients', () =>
      supabase.from('clients').select('id, name, plan, category, stripe_customer_id').order('id'), warn)

    // ── Stripe ──────────────────────────────────────────────────────────────
    // Constructed HERE, not at module load, so a missing key produces a
    // diagnosable 500 with a named variable instead of an opaque platform error
    // before the handler ever runs. The value itself is never read, logged or
    // returned anywhere in this file.
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured for this function')
    }
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

    const periodStartIso = new Date(period.startMs).toISOString()
    const periodEndIso = new Date(period.endMsExclusive).toISOString()

    // THE FULL INVOICE HISTORY, not just the period. Contract §4: the coupon's
    // duration is `once`, so a customer's attribution lives on their earliest
    // tagged invoice and nowhere else. Fetching one month would zero every
    // commission on the page. The period filter is applied inside
    // aggregateRevenue, per figure (created vs paid_at).
    const invoices = await listAll('invoices',
      stripe.invoices.list({ limit: 100, expand: ['data.discounts'] }), MAX_STRIPE_OBJECTS, warn)

    // Refunds are period-scoped: contract §5 nets "refunds in the period".
    // data.charge is expanded because a Refund names a charge, not an invoice —
    // the refund -> charge -> invoice/customer chain of contract §2.
    const refunds = await listAll('refunds',
      stripe.refunds.list({
        limit: 100,
        created: { gte: Math.floor(period.startMs / 1000), lt: Math.floor(period.endMsExclusive / 1000) },
        expand: ['data.charge'],
      }), MAX_STRIPE_OBJECTS, warn)

    const customers = await listAll('customers',
      stripe.customers.list({ limit: 100 }), MAX_STRIPE_OBJECTS, warn)

    const promoCodes = await listAll('promotion codes',
      stripe.promotionCodes.list({ limit: 100 }), MAX_STRIPE_OBJECTS, warn)

    const coupons = await listAll('coupons',
      stripe.coupons.list({ limit: 100 }), MAX_STRIPE_OBJECTS, warn)

    // Indexed three ways — by promotion-code id, by human code, and by the
    // coupon id behind it — so an invoice's discount resolves however deeply
    // Stripe expanded it (a bare `discounts` array gives ids, an expanded one
    // gives objects). findAffiliateAttribution tries all three.
    const promotionCodes = {}
    for (const pc of promoCodes) {
      if (!pc || !pc.id) continue
      promotionCodes[pc.id] = pc
      if (pc.code) promotionCodes[pc.code] = pc
      const couponId = pc.coupon && pc.coupon.id
      if (couponId && !promotionCodes[couponId]) promotionCodes[couponId] = pc
    }

    // An affiliate coupon with no promotion code carrying metadata.affiliate can
    // never be attributed — the tag lives on the CODE, not the coupon (§4). That
    // is a partner whose referrals would silently accrue nothing, so it is said
    // out loud rather than left to be discovered from a zero.
    const taggedCouponIds = new Set(promoCodes
      .filter((pc) => pc && pc.metadata && String(pc.metadata.affiliate || '').trim())
      .map((pc) => pc.coupon && pc.coupon.id)
      .filter(Boolean))
    for (const coupon of coupons) {
      if (!coupon || !coupon.metadata) continue
      const terms = String(coupon.metadata.affiliate_terms || '').trim()
      if (terms && !taggedCouponIds.has(coupon.id)) {
        warn(`Coupon ${coupon.id} carries affiliate_terms "${terms}" but no promotion code on it has metadata.affiliate, so redemptions of it accrue no commission in this report.`)
      }
    }

    // ── API cost for the period (contract §5) ───────────────────────────────
    // The SAME rows and the SAME rule as Usage.tsx's Cost tab: sum the metered
    // cost_eur, fall back to the flat per-engine estimate only for legacy NULL
    // rows. Contract §5 requires the two tabs never to disagree.
    const costRows = await selectAll('ai_results (cost)', () =>
      supabase.from('ai_results')
        .select('client_id, llm, cost_eur')
        .gte('checked_at', periodStartIso)
        .lt('checked_at', periodEndIso)
        .order('id'), warn)

    const { costByClientId, totalEstimatedRows } = sumApiCostByClient(costRows, ENGINE_COST_EUR)
    if (totalEstimatedRows > 0) {
      warn(`${totalEstimatedRows} of ${costRows.length} ai_results rows in this period have no metered cost_eur and were priced from the flat per-engine estimate (see _cost.js ENGINE_COST_EUR).`)
    }

    // ── Engagement pipeline (contract §9) ───────────────────────────────────
    const pipelineClients = clients.filter((c) =>
      c && PIPELINE_PLANS.includes(c.plan) && c.category !== RESEARCH_CATEGORY)

    const windowStartIso = new Date(Date.now() - PIPELINE_WINDOW_DAYS * 86400000).toISOString()
    const pipelineRows = pipelineClients.length === 0 ? [] : await selectAll('ai_results (pipeline)', () =>
      supabase.from('ai_results')
        .select('client_id, checked_at')
        .in('client_id', pipelineClients.map((c) => c.id))
        .gte('checked_at', windowStartIso)
        .order('id'), warn)

    const pipeline = computeEngagementPipeline({
      freeClients: pipelineClients,
      aiResultsRows: pipelineRows,
      windowDays: PIPELINE_WINDOW_DAYS,
      engagedWeeks: PIPELINE_ENGAGED_WEEKS,
    })

    // ── Aggregate ───────────────────────────────────────────────────────────
    const { global, byPlan, byClient, affiliates, warnings: aggWarnings } = aggregateRevenue({
      invoices,
      refunds,
      customers,
      clients,
      costByClientId,
      period,
      priceToPlanFallback: PRICE_TO_PLAN,
      promotionCodes,
    })
    for (const w of aggWarnings) warn(w)

    // ── meta ────────────────────────────────────────────────────────────────
    // The account id is read rather than assumed: this project migrated from a
    // Romanian account to a Spanish one on 2026-08-02, and a report that named
    // the wrong account would be worse than one that named none.
    let stripeAccountId = null
    try {
      const account = await stripe.accounts.retrieve()
      stripeAccountId = account && account.id ? account.id : null
    } catch (e) {
      warn('The Stripe account id could not be read; the figures above are still from whichever account this function is keyed to.')
      console.warn('[revenue-report] accounts.retrieve failed:', redact(e && e.message))
    }

    // livemode off a real object rather than off the key, which is never
    // inspected here. null when the account holds nothing to read it from.
    const liveModeSource = [invoices[0], customers[0], promoCodes[0], coupons[0], refunds[0]]
      .find((o) => o && typeof o.livemode === 'boolean')
    const liveMode = liveModeSource ? liveModeSource.livemode : null

    log(`${period.label}: ${invoices.length} invoices, ${refunds.length} refunds, ${customers.length} customers, `
      + `${costRows.length} cost rows, ${byClient.length} client rows, ${warnings.length} warning(s)`)

    return json(200, {
      period: { start: period.start, end: period.end, label: period.label },
      global,
      byPlan,
      byClient,
      pipeline,
      affiliates,
      meta: {
        generatedAt: new Date().toISOString(),
        stripeAccountId,
        liveMode,
        warnings,
      },
    })
  } catch (err) {
    // NEVER SWALLOWED. Logged with enough context to diagnose (which period, and
    // the message), and returned in the { error } shape every other function in
    // this directory uses, so the page can render a real failure instead of an
    // empty table that reads as "you earned nothing this month".
    const message = redact(err && err.message ? err.message : String(err))
    console.error(`[revenue-report] failed for period ${period.label}: ${message}`)
    if (err && err.stack) console.error(redact(err.stack))
    return json(500, { error: `Revenue report failed: ${message}` })
  }
}

// Test-only surface. Netlify routes on exports.handler and ignores everything
// else, so this adds no endpoint and changes no behaviour.
exports.__test__ = { PRICE_TO_PLAN, redact }
