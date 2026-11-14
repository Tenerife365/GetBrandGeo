/**
 * platform-activity.js
 * Admin Platform activity page: who is using the platform, what the engines
 * are doing, and which clients are near their budget. Read only.
 * Admin only. Requires SUPABASE_SERVICE_KEY.
 *
 * Binding spec: docs/arch/platform-activity.md (sections 2, 3.1 to 3.5).
 *
 * POST bodies:
 *
 *   { action: 'summary' }
 *     -> SummaryResponse (spec 3.3): tiles, one row per client, a spend
 *        cross check against the budget gate's RPC, truncation flags.
 *
 *   { action: 'feed', since?: ISO string, limit?: 1..100 }
 *     -> FeedResponse (spec 3.4): merged events from client_events,
 *        collection_runs, failed collection_jobs, ai_results error rows,
 *        admin_notifications (account_deleted only) and viewer sign ins.
 *
 * Errors: { error: '<sentence for an admin>', code } with codes bad_request,
 * method_not_allowed, read_failed. 401 and 403 come from requireAuth.
 *
 * Privacy (spec 3.5, binding): no email address, website, free text note,
 * Stripe id, auth user id or job error text leaves this function, in a
 * response body or a log line. client_events.meta is never spread or
 * returned: every detail object is built field by field from a per type
 * whitelist. From GoTrue only id and last_sign_in_at are kept.
 *
 * Read only: no insert, update, upsert or delete anywhere in this file, and
 * the only rpc is sum_cost_eur, through sumCostEur from _auth.js. Every query
 * is windowed and capped (spec 3.3.3 and 3.4.4).
 *
 * Spend rule: the budget gate's rule (cost_eur summed, null counted as 0),
 * not sumApiCostByClient's flat estimate, so "over 80 percent" predicts what
 * the gate will do (spec section 2, ruling 3).
 *
 * Added 2026-11-14.
 */

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const authMod = require('./_auth')
const { PLAN_MONTHLY_API_BUDGET_EUR, PLAN_LIVE_ENGINES, activeEnginesFor, RESEARCH_CATEGORY } = require('./_cost')

// ── constants (spec 3.1), exported for the test ─────────────────────────────
const FEED_DEFAULT_LOOKBACK_MS = 24 * 3600 * 1000
const FEED_MAX_LOOKBACK_MS     = 7 * 24 * 3600 * 1000
const FEED_SOURCE_LIMIT        = 50        // rows per source per call
const FEED_DEFAULT_LIMIT       = 50
const FEED_MAX_LIMIT           = 100
const PAGE_SIZE                = 1000
const AI_RESULTS_MAX_PAGES     = 20        // 20,000 row ceiling on the month read
const AUTH_USERS_PAGING        = { perPage: 1000, maxPages: 5 }
const CLIENTS_LIMIT            = 2000
const PROFILES_LIMIT           = 5000
const RUNS_LOOKBACK_MS         = 30 * 24 * 3600 * 1000
const RUNS_LIMIT               = 2000
const BUDGET_WARN_PCT          = 80
const BUDGET_BAD_PCT           = 90
const HEALTH_WARN_RATE         = 0.03
const HEALTH_BAD_RATE          = 0.10
const HEALTH_MIN_CALLS         = 20
const OUTAGE_MIN_CALLS         = 5
const OUTAGE_RATE              = 0.5

const DAY_MS = 24 * 3600 * 1000

// The two limits a test may shrink are read from module.exports at call time,
// so the test can set them on the required module. Nothing else writes them.
function cfg() { return module.exports }

const READ_FAILED_SENTENCE = 'Could not read platform activity. Check the function logs and try again.'

// ── privacy helpers (spec 3.5) ──────────────────────────────────────────────

/** A detail string: null for a non-string or any string holding '@'. */
function scrubDetail(s) {
  if (typeof s !== 'string') return null
  return s.includes('@') ? null : s
}

/** A client name: `Client <id>` for a non-string or any string holding '@'. */
function scrubClientName(name, id) {
  if (typeof name !== 'string' || name.includes('@')) return `Client ${id}`
  return name
}

/** A log message with every whitespace delimited token holding '@' redacted. */
function scrubLog(msg) {
  return String(msg == null ? '' : msg)
    .split(/(\s+)/)
    .map((tok) => (tok.includes('@') ? '[redacted]' : tok))
    .join('')
}

/** A finite number, or null. Strings are not coerced. */
function num(v) { return typeof v === 'number' && Number.isFinite(v) ? v : null }

function round(n, places) {
  const f = 10 ** places
  return Math.round(n * f) / f
}

/** Milliseconds of an ISO string, or NaN. */
function ms(v) { return typeof v === 'string' ? Date.parse(v) : NaN }

function maxIso(a, b) {
  if (!a) return b || null
  if (!b) return a
  return ms(a) >= ms(b) ? a : b
}

class ReadError extends Error {
  constructor(source, cause) {
    super(cause && cause.message ? cause.message : String(cause))
    this.source = source
  }
}

/** Awaits one builder; throws ReadError(source) on an error result or a throw. */
async function read(source, builder) {
  let res
  try { res = await builder } catch (e) { throw new ReadError(source, e) }
  const { data, error } = res || {}
  if (error) throw new ReadError(source, error)
  return Array.isArray(data) ? data : []
}

/**
 * Every auth user's id and last_sign_in_at in one paged pass. The GoTrue
 * objects are dropped at once: nothing else of them is kept, logged or
 * returned. -> { users: Array<{ id, last_sign_in_at }>, truncated }
 */
async function loadSignIns(supabase) {
  const { perPage, maxPages } = cfg().AUTH_USERS_PAGING
  const users = []
  for (let page = 1; page <= maxPages; page++) {
    let res
    try { res = await supabase.auth.admin.listUsers({ page, perPage }) } catch (e) { throw new ReadError('auth_users', e) }
    const { data, error } = res || {}
    if (error) throw new ReadError('auth_users', error)
    const list = (data && Array.isArray(data.users)) ? data.users : []
    for (const u of list) {
      if (u && typeof u.id === 'string') users.push({ id: u.id, last_sign_in_at: typeof u.last_sign_in_at === 'string' ? u.last_sign_in_at : null })
    }
    if (list.length < perPage) return { users, truncated: false }
  }
  return { users, truncated: true }
}

function loadClients(supabase, cols) {
  return read('clients', supabase.from('clients').select(cols).order('id').limit(CLIENTS_LIMIT))
}

function loadProfiles(supabase) {
  return read('user_profiles', supabase.from('user_profiles').select('id, role, client_id').limit(PROFILES_LIMIT))
}

// ── summary (spec 3.3) ──────────────────────────────────────────────────────

async function buildSummary(supabase, invId) {
  const nowMs = Date.now()
  const generatedAt = new Date(nowMs).toISOString()
  const d = new Date(nowMs)
  const dayStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString()
  const monthStart = authMod.monthStartIso()
  const last24hStart = new Date(nowMs - DAY_MS).toISOString()
  const readSince = ms(monthStart) <= ms(last24hStart) ? monthStart : last24hStart
  const runsSince = new Date(nowMs - RUNS_LOOKBACK_MS).toISOString()

  const warnings = new Set()

  // S1, S2, S3, S5 in parallel.
  const [clients, profiles, signIns, runs] = await Promise.all([
    loadClients(supabase, 'id, name, plan, category, engines_enabled'),
    loadProfiles(supabase),
    loadSignIns(supabase),
    read('collection_runs', supabase.from('collection_runs')
      .select('id, client_id, trigger, created_by, created_at')
      .gte('created_at', runsSince)
      .lte('created_at', generatedAt)
      .order('created_at', { ascending: false })
      .limit(RUNS_LIMIT)),
  ])

  const clientById = new Map()
  for (const c of clients) clientById.set(String(c.id), c)
  const isResearchId = (id) => { const c = clientById.get(String(id)); return !!c && c.category === RESEARCH_CATEGORY }
  const isCustomerId = (id) => { const c = clientById.get(String(id)); return !!c && c.category !== RESEARCH_CATEGORY }

  const profileById = new Map()
  for (const p of profiles) if (p && p.id) profileById.set(p.id, p)
  const signInById = new Map()
  for (const u of signIns.users) signInById.set(u.id, u.last_sign_in_at)

  // Per client accumulators.
  const acc = new Map()
  for (const c of clients) {
    acc.set(String(c.id), {
      requests: 0, errors: 0, spent: 0, engines: new Set(), viewers: 0,
      viewerIds: new Set(), lastSignIn: null, lastManualRun: null, lastResult: null,
    })
  }

  // Viewers and tile 1.
  const activeViewers = new Set()
  const activeClients = new Set()
  for (const p of profiles) {
    if (!p || p.role !== 'viewer' || p.client_id === null || p.client_id === undefined) continue
    const a = acc.get(String(p.client_id))
    if (!a) continue
    a.viewers += 1
    a.viewerIds.add(p.id)
    const last = signInById.get(p.id) || null
    a.lastSignIn = maxIso(a.lastSignIn, last)
    if (last && ms(last) >= ms(last24hStart) && ms(last) <= nowMs && isCustomerId(p.client_id)) {
      activeViewers.add(p.id)
      activeClients.add(String(p.client_id))
    }
  }

  // Runs: tile 2 and last manual run by one of the client's own viewers.
  const runsToday = { customer: 0, research: 0, manual: 0, scheduled: 0, engine_calls: 0 }
  for (const r of runs) {
    const key = String(r.client_id)
    const a = acc.get(key)
    if (ms(r.created_at) >= ms(dayStart)) {
      if (isResearchId(r.client_id)) runsToday.research += 1
      else if (isCustomerId(r.client_id)) {
        runsToday.customer += 1
        if (r.trigger === 'manual') runsToday.manual += 1
        if (r.trigger === 'scheduled') runsToday.scheduled += 1
      }
    }
    if (a && r.trigger === 'manual' && r.created_by && a.viewerIds.has(r.created_by)) {
      a.lastManualRun = maxIso(a.lastManualRun, r.created_at)
    }
  }

  // S4: the month's ai_results, paged sequentially, one pass for everything.
  const maxPages = cfg().AI_RESULTS_MAX_PAGES
  let monthTruncated = false
  let pagedTotal = 0
  let nullCostRows = 0
  const health = { calls: 0, ok: 0, errors: 0 }
  const byLlm = new Map()
  const monthStartMs = ms(monthStart)
  const last24hMs = ms(last24hStart)
  const dayStartMs = ms(dayStart)
  for (let page = 0; page < maxPages; page++) {
    const from = page * PAGE_SIZE
    const rows = await read('ai_results_month', supabase.from('ai_results')
      .select('id, client_id, llm, status, error_code, cost_eur, checked_at')
      .gte('checked_at', readSince)
      .lte('checked_at', generatedAt)
      .order('id')
      .range(from, from + PAGE_SIZE - 1))
    for (const r of rows) {
      const t = ms(r.checked_at)
      if (!Number.isFinite(t)) continue
      const customer = isCustomerId(r.client_id)
      const isError = r.status === 'error'
      if (t >= monthStartMs) {
        const cost = num(r.cost_eur === null || r.cost_eur === undefined ? null : Number(r.cost_eur))
        if (r.cost_eur === null || r.cost_eur === undefined) nullCostRows += 1
        pagedTotal += cost || 0
        const a = acc.get(String(r.client_id))
        if (a) {
          a.requests += 1
          if (isError) a.errors += 1
          a.spent += cost || 0
          if (r.status === 'ok' && typeof r.llm === 'string') a.engines.add(r.llm)
          a.lastResult = maxIso(a.lastResult, r.checked_at)
        }
      }
      if (customer && t >= last24hMs) {
        health.calls += 1
        if (isError) health.errors += 1
        if (r.status === 'ok') health.ok += 1
        const llm = typeof r.llm === 'string' ? r.llm : 'unknown'
        const b = byLlm.get(llm) || { llm, calls: 0, errors: 0 }
        b.calls += 1
        if (isError) b.errors += 1
        byLlm.set(llm, b)
      }
      if (customer && t >= dayStartMs) runsToday.engine_calls += 1
    }
    if (rows.length < PAGE_SIZE) break
    if (page === maxPages - 1) monthTruncated = true
  }
  if (monthTruncated) {
    const ceiling = maxPages * PAGE_SIZE
    warnings.add(`More than ${ceiling} engine calls this month; per client figures cover only the first ${ceiling} and are incomplete.`)
    console.error(`[platform-activity/${invId}] ai_results month read hit the page cap (${maxPages} pages of ${PAGE_SIZE})`)
  }

  // S6: the platform cross check, after S4. Its failure does not fail the call.
  let rpcTotal = null
  try {
    const res = await authMod.sumCostEur(supabase, { since: monthStart, clientId: null })
    if (res && res.ok) rpcTotal = round(res.sum, 4)
    else {
      console.error(`[platform-activity/${invId}] spend_rpc failed: ${scrubLog(res && (res.error || res.reason))}`)
      warnings.add('The budget gate total could not be read; the spend cross check is unavailable.')
    }
  } catch (e) {
    console.error(`[platform-activity/${invId}] spend_rpc failed: ${scrubLog(e && e.message)}`)
    warnings.add('The budget gate total could not be read; the spend cross check is unavailable.')
  }
  const pagedTotalR = round(pagedTotal, 4)
  const delta = rpcTotal === null ? null : round(rpcTotal - pagedTotalR, 4)
  if (delta !== null && Math.abs(delta) > 1.00) {
    warnings.add(`Paged spend and the budget gate total differ by EUR ${delta.toFixed(2)}.`)
  }

  // Per client rows.
  const budget = { customers_measured: 0, over_80: 0, over_90: 0, over_100: 0 }
  const rows = clients.map((c) => {
    const a = acc.get(String(c.id))
    const plan = typeof c.plan === 'string' ? c.plan : ''
    const planKnown = Object.prototype.hasOwnProperty.call(PLAN_LIVE_ENGINES, plan) && !!PLAN_LIVE_ENGINES[plan]
    // The budget gate's two step rule (_auth.js): unknown plan reads as
    // essentials, a missing budget entry falls back to free. The own property
    // check (planKnown) keeps a plan named like a prototype key, for example
    // "toString", from selecting a function, matching the gate's
    // VALID_PLANS.includes(plan) over own keys (review L8).
    const key = planKnown ? plan : 'essentials'
    const budgetEur = PLAN_MONTHLY_API_BUDGET_EUR[key] ?? PLAN_MONTHLY_API_BUDGET_EUR.free
    const spent = round(a.spent, 4)
    const pct = budgetEur > 0 ? round((a.spent / budgetEur) * 100, 1) : null
    const level = pct === null ? 'ok' : pct >= BUDGET_BAD_PCT ? 'bad' : pct >= BUDGET_WARN_PCT ? 'warn' : 'ok'
    const isResearch = c.category === RESEARCH_CATEGORY
    if (!isResearch && pct !== null) {
      budget.customers_measured += 1
      if (pct >= BUDGET_WARN_PCT) budget.over_80 += 1
      if (pct >= BUDGET_BAD_PCT) budget.over_90 += 1
      if (pct >= 100) budget.over_100 += 1
    }
    let lastActive = null
    let lastSource = null
    if (a.lastSignIn) { lastActive = a.lastSignIn; lastSource = 'sign_in' }
    if (a.lastManualRun && (!lastActive || ms(a.lastManualRun) > ms(lastActive))) { lastActive = a.lastManualRun; lastSource = 'manual_run' }
    return {
      client_id: Number(c.id),
      name: scrubClientName(c.name, c.id),
      plan: scrubDetail(plan) || '',
      plan_known: planKnown,
      is_research: isResearch,
      requests_month: a.requests,
      errors_month: a.errors,
      spent_eur: spent,
      budget_eur: budgetEur,
      budget_pct: pct,
      budget_level: level,
      engines_used: Array.from(a.engines).map(scrubDetail).filter(Boolean).sort(),
      // `key`, not c.plan: _cost.js activeEnginesFor uses a truthy lookup, so a
      // plan named like a prototype key would hand it a function and throw,
      // failing the whole summary. `key` is already an own plan or essentials.
      engines_entitled: activeEnginesFor(key, c.engines_enabled),
      viewers: a.viewers,
      last_sign_in_at: a.lastSignIn,
      last_manual_run_at: a.lastManualRun,
      last_active_at: lastActive,
      last_active_source: lastSource,
      last_result_at: a.lastResult,
    }
  })
  rows.sort((x, y) => {
    if (x.is_research !== y.is_research) return x.is_research ? 1 : -1
    if (x.budget_pct !== y.budget_pct) {
      if (x.budget_pct === null) return 1
      if (y.budget_pct === null) return -1
      return y.budget_pct - x.budget_pct
    }
    if (x.requests_month !== y.requests_month) return y.requests_month - x.requests_month
    return x.name < y.name ? -1 : x.name > y.name ? 1 : 0
  })

  // Tile 3.
  const errorRate = health.calls > 0 ? round(health.errors / health.calls, 4) : null
  const byLlmArr = Array.from(byLlm.values()).sort((x, y) => (y.errors - x.errors) || (x.llm < y.llm ? -1 : x.llm > y.llm ? 1 : 0))
  const outage = byLlmArr.filter((b) => b.calls >= OUTAGE_MIN_CALLS && b.errors / b.calls >= OUTAGE_RATE).map((b) => b.llm).sort()
  let level = 'ok'
  let reason = null
  if (outage.length) { level = 'bad'; reason = 'engine_outage' }
  else if (health.calls >= HEALTH_MIN_CALLS && health.errors / health.calls >= HEALTH_BAD_RATE) { level = 'bad'; reason = 'rate' }
  else if (health.calls >= HEALTH_MIN_CALLS && health.errors / health.calls >= HEALTH_WARN_RATE) { level = 'warn'; reason = 'rate' }

  const truncated = {
    ai_results_month: monthTruncated,
    auth_users: signIns.truncated,
    clients: clients.length >= CLIENTS_LIMIT,
    profiles: profiles.length >= PROFILES_LIMIT,
    collection_runs: runs.length >= RUNS_LIMIT,
  }
  if (truncated.auth_users) warnings.add('More sign in records exist than were read; sign in figures may be incomplete.')
  if (truncated.clients) warnings.add(`Only the first ${CLIENTS_LIMIT} clients were read.`)
  if (truncated.profiles) warnings.add(`Only the first ${PROFILES_LIMIT} user profiles were read.`)
  if (truncated.collection_runs) warnings.add(`Only the latest ${RUNS_LIMIT} collection runs of the last 30 days were read.`)

  return {
    generated_at: generatedAt,
    windows: { day_start_utc: dayStart, month_start: monthStart, last_24h_start: last24hStart, read_since: readSince },
    tiles: {
      active_users_24h: { viewers: activeViewers.size, clients: activeClients.size },
      runs_today: runsToday,
      engine_health_24h: {
        calls: health.calls,
        ok: health.ok,
        errors: health.errors,
        error_rate: errorRate,
        by_llm: byLlmArr.map((b) => ({ llm: scrubDetail(b.llm) || 'unknown', calls: b.calls, errors: b.errors })),
        level,
        reason,
        outage_llms: outage.map(scrubDetail).filter(Boolean),
      },
      budget_watch: budget,
    },
    clients: rows,
    spend_check: { paged_total_eur: pagedTotalR, rpc_total_eur: rpcTotal, delta_eur: delta, null_cost_rows: nullCostRows },
    truncated,
    warnings: Array.from(warnings),
  }
}

// ── feed (spec 3.4) ─────────────────────────────────────────────────────────

const EVENT_TYPES = {
  plan_change:      { badge: 'PLAN_CHANGE',      tone: 'info' },
  trial_grant:      { badge: 'TRIAL_GRANT',      tone: 'ok' },
  comp_grant:       { badge: 'COMP_GRANT',       tone: 'ok' },
  trial_expired:    { badge: 'TRIAL_EXPIRED',    tone: 'warn' },
  onboarded:        { badge: 'ONBOARDED',        tone: 'ok' },
  signup:           { badge: 'SIGNUP',           tone: 'ok' },
  stripe_change:    { badge: 'STRIPE_CHANGE',    tone: 'info' },
  stripe_provision: { badge: 'STRIPE_PROVISION', tone: 'ok' },
  mcp_fix_marked:   { badge: 'MCP_FIX_MARKED',   tone: 'ok' },
  invite_resent:    { badge: 'INVITE_RESENT',    tone: 'neutral' },
  location_change:  { badge: 'LOCATION_CHANGE',  tone: 'info' },
}

const LOCATION_ACTIONS = new Set(['add', 'archive', 'set_primary'])

/** The detail object of one client_events row, built field by field. */
function eventDetail(type, row) {
  const meta = row.meta && typeof row.meta === 'object' && !Array.isArray(row.meta) ? row.meta : {}
  const fromPlan = scrubDetail(row.from_plan)
  const toPlan = scrubDetail(row.to_plan)
  switch (type) {
    case 'plan_change':
    case 'trial_grant':
    case 'comp_grant':
      return { kind: 'plan', from_plan: fromPlan, to_plan: toPlan, grant_until: scrubDetail(meta.grant_until) }
    case 'trial_expired':
      return { kind: 'trial_expired', from_plan: fromPlan, to_plan: toPlan, was: scrubDetail(meta.was) }
    case 'onboarded':
      return { kind: 'onboarded', to_plan: toPlan, prompts_created: num(meta.prompts_created), locations_created: num(meta.locations_created), invite_channel: scrubDetail(meta.invite_channel) }
    case 'signup':
      return { kind: 'signup', to_plan: toPlan, account_type: scrubDetail(meta.account_type) }
    case 'stripe_change':
      return { kind: 'stripe', from_plan: fromPlan, to_plan: toPlan, reason: scrubDetail(meta.reason) }
    case 'stripe_provision':
      return { kind: 'stripe', from_plan: null, to_plan: toPlan, reason: null }
    case 'mcp_fix_marked': {
      const fix = scrubDetail(meta.fix_id)
      const via = meta.grant_id !== undefined && meta.grant_id !== null ? 'oauth' : meta.key_id !== undefined && meta.key_id !== null ? 'key' : null
      return { kind: 'mcp_fix', fix_id: fix === null ? null : fix.slice(0, 64), via }
    }
    case 'invite_resent':
      return { kind: 'invite', channel: scrubDetail(meta.channel), delivery: scrubDetail(meta.delivery) }
    case 'location_change':
      return {
        kind: 'location',
        action: LOCATION_ACTIONS.has(meta.action) ? meta.action : null,
        over_limit: meta.limit_override === true,
        count: Array.isArray(meta.pairs) ? meta.pairs.length : null,
      }
    default:
      return null
  }
}

/** Opaque LOGIN id: the user id never leaves the function. */
function loginId(userId, signInMs) {
  const h = crypto.createHash('sha256').update(String(userId)).digest('hex').slice(0, 12)
  return `login:${h}:${signInMs}`
}

/** limit: an integer 1..100, a digit string without a leading zero, or absent. */
function parseLimit(v) {
  if (v === undefined || v === null) return FEED_DEFAULT_LIMIT
  if (typeof v === 'number') return Number.isInteger(v) && v >= 1 && v <= FEED_MAX_LIMIT ? v : null
  if (typeof v === 'string' && /^[1-9][0-9]{0,2}$/.test(v)) {
    const n = Number(v)
    return n <= FEED_MAX_LIMIT ? n : null
  }
  return null
}

function windowed(builder, col, since, until) {
  return builder.gt(col, since).lte(col, until).order(col, { ascending: false }).limit(FEED_SOURCE_LIMIT)
}

async function buildFeed(supabase, sinceMs, untilMs, limit) {
  const since = new Date(sinceMs).toISOString()
  const until = new Date(untilMs).toISOString()
  const warnings = new Set()

  // F1 to F8, all in parallel.
  const [events, runs, jobs, engineErrors, deleted, clients, profiles, signIns] = await Promise.all([
    read('client_events', windowed(supabase.from('client_events').select('id, client_id, actor, type, from_plan, to_plan, meta, created_at'), 'created_at', since, until)),
    read('collection_runs', windowed(supabase.from('collection_runs').select('id, client_id, trigger, force, total_jobs, created_at'), 'created_at', since, until)),
    read('collection_jobs', windowed(supabase.from('collection_jobs').select('id, client_id, attempts, engines, error, finished_at').eq('status', 'failed'), 'finished_at', since, until)),
    read('engine_errors', windowed(supabase.from('ai_results').select('id, client_id, llm, error_code, checked_at').eq('status', 'error'), 'checked_at', since, until)),
    read('account_deleted', windowed(supabase.from('admin_notifications').select('id, client_id, created_at').eq('type', 'account_deleted'), 'created_at', since, until)),
    loadClients(supabase, 'id, name, category'),
    loadProfiles(supabase),
    loadSignIns(supabase),
  ])

  const clientById = new Map()
  for (const c of clients) clientById.set(String(c.id), c)
  const profileById = new Map()
  for (const p of profiles) if (p && p.id) profileById.set(p.id, p)

  const out = []
  const push = (idStr, at, badge, tone, clientId, detail, actorRole = null) => {
    const t = ms(at)
    if (!Number.isFinite(t)) return
    const cid = clientId === null || clientId === undefined ? null : Number(clientId)
    const c = cid === null ? null : clientById.get(String(cid))
    out.push({
      id: idStr,
      at: new Date(t).toISOString(),
      badge,
      tone,
      client_id: Number.isFinite(cid) ? cid : null,
      client_name: c ? scrubClientName(c.name, c.id) : null,
      is_research: !!c && c.category === RESEARCH_CATEGORY,
      actor_role: actorRole,
      detail,
    })
  }

  let unknown = 0
  for (const e of events) {
    const map = EVENT_TYPES[e.type]
    if (!map) { unknown += 1; continue }
    let actorRole = null
    if (e.actor === null || e.actor === undefined) actorRole = 'system'
    else {
      const p = profileById.get(e.actor)
      if (p && (p.role === 'admin' || p.role === 'viewer')) actorRole = p.role
    }
    push(`ev:${e.id}`, e.created_at, map.badge, map.tone, e.client_id, eventDetail(e.type, e), actorRole)
  }
  if (unknown > 0) warnings.add(`${unknown} events of an unknown type were skipped.`)

  for (const r of runs) {
    push(`run:${r.id}`, r.created_at, 'RUN_STARTED', 'info', r.client_id, {
      kind: 'run',
      trigger: r.trigger === 'scheduled' ? 'scheduled' : 'manual',
      force: r.force === true,
      total_jobs: num(r.total_jobs),
    })
  }

  for (const j of jobs) {
    // error is read only to compute has_error_text; the text is dropped here.
    const hasErrorText = j.error !== null && j.error !== undefined && j.error !== ''
    push(`job:${j.id}`, j.finished_at, 'JOB_FAILED', 'bad', j.client_id, {
      kind: 'job_failed',
      attempts: num(j.attempts),
      engines: Array.isArray(j.engines) ? j.engines.map(scrubDetail).filter(Boolean) : [],
      has_error_text: hasErrorText,
    })
  }

  for (const r of engineErrors) {
    push(`err:${r.id}`, r.checked_at, 'ENGINE_ERROR', 'warn', r.client_id, {
      kind: 'engine_error',
      llm: scrubDetail(r.llm) || 'unknown',
      error_code: scrubDetail(r.error_code),
    })
  }

  for (const n of deleted) {
    push(`del:${n.id}`, n.created_at, 'ACCOUNT_DELETED', 'warn', n.client_id, { kind: 'account_deleted' })
  }

  for (const u of signIns.users) {
    const t = ms(u.last_sign_in_at)
    if (!Number.isFinite(t) || t <= sinceMs || t > untilMs) continue
    const p = profileById.get(u.id)
    if (!p || p.role !== 'viewer') continue
    push(loginId(u.id, t), u.last_sign_in_at, 'LOGIN', 'neutral', p.client_id, { kind: 'login' })
  }

  out.sort((a, b) => {
    const d = ms(b.at) - ms(a.at)
    if (d !== 0) return d
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0
  })

  const truncated = {
    client_events: events.length >= FEED_SOURCE_LIMIT,
    collection_runs: runs.length >= FEED_SOURCE_LIMIT,
    collection_jobs: jobs.length >= FEED_SOURCE_LIMIT,
    engine_errors: engineErrors.length >= FEED_SOURCE_LIMIT,
    account_deleted: deleted.length >= FEED_SOURCE_LIMIT,
    logins: signIns.truncated,
    merged: out.length > limit,
  }
  if (clients.length >= CLIENTS_LIMIT) warnings.add(`Only the first ${CLIENTS_LIMIT} clients were read; some client names may be missing.`)
  if (profiles.length >= PROFILES_LIMIT) warnings.add(`Only the first ${PROFILES_LIMIT} user profiles were read; some sign ins may be missing.`)

  return {
    rows: out.slice(0, limit),
    cursor: until,
    server_time: new Date().toISOString(),
    window: { since, until },
    truncated,
    warnings: Array.from(warnings),
  }
}

// ── handler (spec 3.1) ──────────────────────────────────────────────────────

async function handler(event) {
  const auth = await authMod.requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  const headers = auth.headers
  const invId = crypto.randomBytes(4).toString('hex')
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })
  const fail = (statusCode, code, error) => json(statusCode, { error, code })

  if (event.httpMethod !== 'POST') return fail(405, 'method_not_allowed', 'Method Not Allowed')

  let body
  try { body = JSON.parse(event.body) } catch { body = undefined }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail(400, 'bad_request', 'The request body must be a JSON object.')
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  try {
    if (body.action === 'summary') return json(200, await buildSummary(supabase, invId))

    if (body.action === 'feed') {
      const untilMs = Date.now()
      let sinceMs = untilMs - FEED_DEFAULT_LOOKBACK_MS
      if (body.since !== undefined && body.since !== null) {
        const t = typeof body.since === 'string' ? Date.parse(body.since) : NaN
        if (!Number.isFinite(t)) return fail(400, 'bad_request', 'since must be an ISO date.')
        sinceMs = Math.min(Math.max(t, untilMs - FEED_MAX_LOOKBACK_MS), untilMs)
      }
      const limit = parseLimit(body.limit)
      if (limit === null) return fail(400, 'bad_request', 'limit must be a whole number from 1 to 100.')
      return json(200, await buildFeed(supabase, sinceMs, untilMs, limit))
    }

    return fail(400, 'bad_request', 'Unknown action. Use "summary" or "feed".')
  } catch (e) {
    const source = e instanceof ReadError ? e.source : 'internal'
    console.error(`[platform-activity/${invId}] read_failed at ${source}: ${scrubLog(e && e.message)}`)
    return fail(500, 'read_failed', READ_FAILED_SENTENCE)
  }
}

module.exports = {
  handler,
  FEED_DEFAULT_LOOKBACK_MS,
  FEED_MAX_LOOKBACK_MS,
  FEED_SOURCE_LIMIT,
  FEED_DEFAULT_LIMIT,
  FEED_MAX_LIMIT,
  PAGE_SIZE,
  AI_RESULTS_MAX_PAGES,
  AUTH_USERS_PAGING,
  CLIENTS_LIMIT,
  PROFILES_LIMIT,
  RUNS_LOOKBACK_MS,
  RUNS_LIMIT,
  BUDGET_WARN_PCT,
  BUDGET_BAD_PCT,
  HEALTH_WARN_RATE,
  HEALTH_BAD_RATE,
  HEALTH_MIN_CALLS,
  OUTAGE_MIN_CALLS,
  OUTAGE_RATE,
  scrubDetail,
  scrubClientName,
  scrubLog,
}
