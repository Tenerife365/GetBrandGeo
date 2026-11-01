/**
 * health.js  GET /.netlify/functions/health  (docs/arch/observability.md 3.3)
 *
 * Public, unauthenticated health endpoint for the external pinger and the CI
 * deploy-lag step. No CORS headers, Cache-Control: no-store, timeout 10 s.
 *
 *   checks.supabase  one Supabase round trip under a 4,000 ms deadline
 *   checks.jobs      newest job_runs row other than obs-watchdog, ok when it
 *                    is at most 3 hours old (proves pg_net plus Netlify)
 *   checks.watchdog  newest obs-watchdog row: null when none exists yet,
 *                    false when ok = false or older than 3 hours (proves
 *                    pg_cron plus Resend)
 *
 * 200 'ok' when every check.ok is true or null, 503 'degraded' otherwise.
 * 429 rate_limited, 405 method_not_allowed, 403 forbidden (simulate without
 * the right key), 500 internal. Every failure branch answers a fixed string;
 * no driver message leaves this function, and no exception reaches the
 * runtime: the top-level catch reports it and answers 500 itself.
 *
 * ?simulate=error|timeout is honoured only with header X-Internal-Key equal
 * to INTERNAL_AUDIT_KEY, and fails closed when that variable is unset.
 * Simulate never calls an LLM, never enqueues anything, never writes job_runs.
 */

'use strict'

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const { withObservability, captureException, buildInfo } = require('./_observability')

const MAX_AGE_S = 10800
const SUPABASE_DEADLINE_MS = 4000
const RATE_DEADLINE_MS = 1500
const RATE_LIMIT = 30
const RATE_WINDOW_S = 60
const SIMULATE_TIMEOUT_MS = 12000
const WATCHDOG_JOB = 'obs-watchdog'

let pepperWarned = false

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

function respond(method, statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: { ...BASE_HEADERS, ...(extraHeaders || {}) },
    body: method === 'HEAD' ? '' : JSON.stringify(body),
  }
}

function header(event, name) {
  const h = (event && event.headers) || {}
  const want = name.toLowerCase()
  for (const [k, v] of Object.entries(h)) {
    if (k.toLowerCase() === want) return v
  }
  return undefined
}

function clientIp(event) {
  const direct = header(event, 'x-nf-client-connection-ip')
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  const fwd = header(event, 'x-forwarded-for')
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0].trim()
  return 'unknown'
}

// Same construction as affiliate-redirect.js dailyIpHash, without its
// built-in fallback pepper: no pepper means no rate check at all.
function dailyIpHash(event, pepper, now) {
  const day = now.toISOString().slice(0, 10)
  return crypto.createHash('sha256').update(`${clientIp(event)}:${pepper}:${day}`).digest('hex')
}

function keyMatches(provided, expected) {
  if (typeof expected !== 'string' || expected === '') return false
  if (typeof provided !== 'string') return false
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function withDeadline(promise, ms, onTimeout) {
  let timer = null
  const limit = new Promise((resolve) => {
    timer = setTimeout(() => {
      if (onTimeout) onTimeout()
      resolve({ timedOut: true })
    }, ms)
  })
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer))
}

// Returns true when the request may proceed, false when it is rate limited.
// Fails open on an RPC error or on the deadline.
async function rateAllowed(event, supabase, now) {
  const pepper = process.env.IP_HASH_PEPPER
  if (!pepper) {
    if (!pepperWarned) {
      pepperWarned = true
      console.warn('[health] IP_HASH_PEPPER unset, rate check skipped')
    }
    return true
  }
  try {
    const call = supabase.rpc('affiliate_rate_check', {
      p_key: 'health:' + dailyIpHash(event, pepper, now),
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_WINDOW_S,
    })
    const res = await withDeadline(Promise.resolve(call), RATE_DEADLINE_MS)
    if (!res || res.timedOut) {
      console.warn('[health] rate check timed out, skipped')
      return true
    }
    if (res.error) {
      console.warn('[health] rate check failed, skipped')
      return true
    }
    return res.data !== false
  } catch {
    console.warn('[health] rate check failed, skipped')
    return true
  }
}

function ageSeconds(ranAt, nowMs) {
  const t = Date.parse(ranAt)
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.round((nowMs - t) / 1000))
}

// Two filtered reads issued together under one deadline (see the handoff:
// PostgREST cannot express both subqueries in one request without a new RPC).
async function runChecks(supabase, nowFn) {
  const controller = new AbortController()
  const started = nowFn().getTime()
  const newestOther = supabase
    .from('job_runs').select('ran_at')
    .neq('job', WATCHDOG_JOB)
    .order('ran_at', { ascending: false }).limit(1)
    .abortSignal(controller.signal)
  const newestWatchdog = supabase
    .from('job_runs').select('ran_at, ok')
    .eq('job', WATCHDOG_JOB)
    .order('ran_at', { ascending: false }).limit(1)
    .abortSignal(controller.signal)

  let res
  try {
    res = await withDeadline(
      Promise.all([newestOther, newestWatchdog]),
      SUPABASE_DEADLINE_MS,
      () => controller.abort(),
    )
  } catch {
    res = null
  }

  const failed = {
    supabase: { ok: false, ms: null },
    jobs: { ok: false, newest_age_s: null, max_age_s: MAX_AGE_S },
    watchdog: { ok: null, age_s: null, max_age_s: MAX_AGE_S },
  }
  if (!res || res.timedOut || !Array.isArray(res)) {
    console.warn('[health] supabase check failed or timed out')
    return failed
  }
  const [other, wd] = res
  if (!other || other.error || !wd || wd.error) {
    console.warn('[health] supabase check failed')
    return failed
  }

  const nowMs = nowFn().getTime()
  const ms = Math.max(0, nowMs - started)

  const otherRow = Array.isArray(other.data) ? other.data[0] : null
  const newestAge = otherRow ? ageSeconds(otherRow.ran_at, nowMs) : null
  const jobs = {
    ok: newestAge !== null && newestAge <= MAX_AGE_S,
    newest_age_s: newestAge,
    max_age_s: MAX_AGE_S,
  }

  const wdRow = Array.isArray(wd.data) ? wd.data[0] : null
  let watchdog
  if (!wdRow) {
    watchdog = { ok: null, age_s: null, max_age_s: MAX_AGE_S }
  } else {
    const age = ageSeconds(wdRow.ran_at, nowMs)
    watchdog = {
      ok: wdRow.ok === true && age !== null && age <= MAX_AGE_S,
      age_s: age,
      max_age_s: MAX_AGE_S,
    }
  }

  return { supabase: { ok: true, ms }, jobs, watchdog }
}

function defaultGetSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const defaultDeps = {
  getSupabase: defaultGetSupabase,
  now: () => new Date(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

async function handle(event, deps, context) {
  const d = { ...defaultDeps, ...(deps || {}) }
  const method = String((event && event.httpMethod) || 'GET').toUpperCase()
  try {
    if (method !== 'GET' && method !== 'HEAD') {
      return respond('GET', 405, { error: 'method_not_allowed' }, { Allow: 'GET, HEAD' })
    }

    const supabase = d.getSupabase()

    if (!(await rateAllowed(event, supabase, d.now()))) {
      return respond(method, 429, { error: 'rate_limited' })
    }

    const q = (event && event.queryStringParameters) || {}
    if (Object.prototype.hasOwnProperty.call(q, 'simulate')) {
      if (!keyMatches(header(event, 'x-internal-key'), process.env.INTERNAL_AUDIT_KEY)) {
        return respond(method, 403, { error: 'forbidden' })
      }
      if (q.simulate === 'error') throw new Error('simulated error')
      if (q.simulate === 'timeout') await d.sleep(SIMULATE_TIMEOUT_MS)
    }

    const checks = await runChecks(supabase, d.now)
    const healthy = Object.values(checks).every((c) => c.ok === true || c.ok === null)
    const info = buildInfo()
    return respond(method, healthy ? 200 : 503, {
      status: healthy ? 'ok' : 'degraded',
      commit: info.commit,
      built_at: info.built_at,
      time: d.now().toISOString(),
      checks,
    })
  } catch (err) {
    await captureException(err, { fn: 'health', tags: { reason: 'internal' } })
    console.error('[health] internal error', err && err.name ? err.name : 'unknown')
    return respond(method, 500, { error: 'internal' })
  }
}

exports.handler = withObservability('health', (event, context) => handle(event, defaultDeps, context))
exports.handle = handle
