/**
 * _observability.js  (docs/arch/observability.md section 3.1, path B)
 *
 * Server-side error reporting for a small, named set of Netlify functions
 * (section 3.2). CommonJS, no dependencies: it speaks the Sentry envelope
 * protocol directly over Node 22's global fetch.
 *
 * What it guarantees:
 *   - With SENTRY_DSN unset or unparseable, every export is a no-op and no
 *     network call is ever made.
 *   - Every send is awaited, bounded by min(2000, remaining - 500,
 *     2000 - send_ms_spent) ms, skipped below 300 ms, and capped at 2000 ms
 *     in total and 5 events per invocation. The counters live in an
 *     AsyncLocalStorage store created per invocation by withObservability,
 *     never at module scope, so a warm container carries nothing over.
 *   - A capture outside a wrapped invocation sends nothing.
 *   - Every event passes scrubEvent (section 7) before it leaves.
 *   - The request event, its body, headers, query and the handler's return
 *     value are never read into an event.
 *
 * Shared exports: withObservability, captureException, captureMessage,
 * scrubEvent, parseDsn, buildInfo.
 */

'use strict'

const { AsyncLocalStorage } = require('node:async_hooks')
const crypto = require('node:crypto')

const MAX_EVENTS_PER_INVOCATION = 5
const MAX_SEND_MS_PER_INVOCATION = 2000
const MIN_SEND_DEADLINE_MS = 300
const REMAINING_MARGIN_MS = 500
const NO_CONTEXT_DEADLINE_MS = 1000
const NEAR_TIMEOUT_MARGIN_MS = 1500
const MAX_FRAMES = 30
const STRING_LIMIT = 300
const EXCEPTION_VALUE_LIMIT = 500

const als = new AsyncLocalStorage()

// ── Section 7 patterns. The same list lives in src/lib/observability.ts and
// in tests/fixtures/observability-pii.json (its "patterns" block); the test
// asserts the three stay identical.
const PATTERNS = {
  denyKey: /prompt|response|snippet|text|body|brand_|email|token|key|secret|password|authorization|cookie|phone|name|details|hint/i,
  url: /\bhttps?:\/\/[^\s"'<>]+/g,
  pathToken: /(\/(?:audit|affiliate\/join)\/)[^/?#\s"'<>]+/g,
  email: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  jwt: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  bearer: /\bBearer\s+[^\s,;"']+/gi,
  mcpKey: /\bbgmcp_[A-Za-z0-9_]+/g,
  stripe: /\b(?:sk|rk|pk|whsec|cus|in|pi|sub|cs)_[A-Za-z0-9_]+/g,
  longRun: /[A-Za-z0-9+/_-]{32,}={0,2}/g,
}
const EXEMPT_TAGS = new Set(['fn', 'pg_code'])

// ── DSN and build info ──────────────────────────────────────────────────────

function parseDsn(dsn) {
  if (typeof dsn !== 'string' || dsn.trim() === '') return null
  let u
  try { u = new URL(dsn.trim()) } catch { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  let publicKey
  try { publicKey = decodeURIComponent(u.username || '') } catch { return null }
  const projectId = u.pathname.replace(/^\/+|\/+$/g, '')
  if (!publicKey || !/^[0-9]+$/.test(projectId)) return null
  return { origin: u.origin, projectId, publicKey }
}

function buildInfo() {
  try {
    // Static literal path on purpose (section 3.1 rule 7): both bundlers trace it.
    const b = require('./_build_info.json')
    const commit = b && typeof b.commit === 'string' && /^[0-9a-f]{40}$/.test(b.commit) ? b.commit : null
    const built_at = b && typeof b.built_at === 'string' ? b.built_at : null
    return { commit, built_at }
  } catch {
    return { commit: null, built_at: null }
  }
}

// ── Scrub (section 7) ───────────────────────────────────────────────────────

function cleanUrls(s) {
  return s
    .replace(PATTERNS.url, (u) => u.split('#')[0].split('?')[0])
    .replace(PATTERNS.pathToken, '$1[token]')
}

function scrubString(s, limit) {
  let out = cleanUrls(String(s))
  out = out
    .replace(PATTERNS.email, '[email]')
    .replace(PATTERNS.jwt, '[jwt]')
    .replace(PATTERNS.bearer, 'Bearer [redacted]')
    .replace(PATTERNS.mcpKey, '[key]')
    .replace(PATTERNS.stripe, '[stripe]')
    .replace(PATTERNS.longRun, '[secret]')
  return out.length > limit ? out.slice(0, limit) : out
}

// Deletes denied keys at any depth; replaces strings unless `raw`.
function scrubTree(value, raw) {
  if (typeof value === 'string') return raw ? value : scrubString(value, STRING_LIMIT)
  if (Array.isArray(value)) return value.map((v) => scrubTree(v, raw))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (PATTERNS.denyKey.test(k)) continue
      out[k] = scrubTree(v, raw)
    }
    return out
  }
  return value
}

function scrubEvent(input) {
  const e = JSON.parse(JSON.stringify(input || {}))

  // Rule 1: never sent at all.
  delete e.user
  delete e.breadcrumbs
  delete e.server_name
  if (e.request && typeof e.request === 'object') {
    delete e.request.cookies
    delete e.request.headers
    delete e.request.data
    delete e.request.query_string
    if (typeof e.request.url === 'string') e.request.url = scrubString(e.request.url, STRING_LIMIT)
  }
  if (e.contexts && typeof e.contexts === 'object') {
    delete e.contexts.device
    const out = {}
    for (const [k, v] of Object.entries(e.contexts)) {
      if (PATTERNS.denyKey.test(k)) continue
      out[k] = scrubTree(v, k === 'trace')
    }
    e.contexts = out
  }

  // Rules 3 and 4 on tags: fn and pg_code are exempt from both.
  if (e.tags && typeof e.tags === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(e.tags)) {
      if (EXEMPT_TAGS.has(k)) { out[k] = v; continue }
      if (PATTERNS.denyKey.test(k)) continue
      if (v !== null && typeof v === 'object') continue
      out[k] = typeof v === 'string' ? scrubString(v, STRING_LIMIT) : v
    }
    e.tags = out
  }

  if (e.extra && typeof e.extra === 'object') e.extra = scrubTree(e.extra, false)

  if (typeof e.message === 'string') e.message = scrubString(e.message, STRING_LIMIT)

  if (e.exception && Array.isArray(e.exception.values)) {
    for (const ex of e.exception.values) {
      if (!ex || typeof ex !== 'object') continue
      if (typeof ex.value === 'string') ex.value = scrubString(ex.value, EXCEPTION_VALUE_LIMIT)
      const frames = ex.stacktrace && Array.isArray(ex.stacktrace.frames) ? ex.stacktrace.frames : []
      for (const f of frames) {
        if (!f || typeof f !== 'object') continue
        if (typeof f.filename === 'string') f.filename = scrubString(f.filename, STRING_LIMIT)
        if (typeof f.abs_path === 'string') f.abs_path = cleanUrls(f.abs_path)
      }
    }
  }
  return e
}

// ── Event construction ──────────────────────────────────────────────────────

function basename(p) {
  const s = String(p || '').split('#')[0].split('?')[0]
  const parts = s.split(/[\\/]/)
  return parts[parts.length - 1] || s
}

function parseFrames(stack) {
  if (typeof stack !== 'string') return undefined
  const frames = []
  for (const line of stack.split('\n').slice(1)) {
    const m = /^\s*at (?:(.+?) \()?(.*?):(\d+):(\d+)\)?$/.exec(line)
    if (!m) continue
    const frame = { filename: basename(m[2]), lineno: Number(m[3]) }
    if (m[1]) frame.function = m[1]
    frames.push(frame)
    if (frames.length >= MAX_FRAMES) break
  }
  if (frames.length === 0) return undefined
  return { frames: frames.reverse() }   // Sentry wants the crashing frame last
}

function primitives(obj) {
  const out = {}
  if (!obj || typeof obj !== 'object') return out
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v
  }
  return out
}

function baseEvent(level, ctx) {
  const c = ctx && typeof ctx === 'object' ? ctx : {}
  const fnName = typeof c.fn === 'string' && c.fn ? c.fn : 'unknown'
  const event = {
    event_id: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now() / 1000,
    platform: 'node',
    level,
    release: buildInfo().commit,
    environment: 'production',
    tags: { ...primitives(c.tags), fn: fnName },
  }
  const extra = primitives(c.extra)
  if (Object.keys(extra).length > 0) event.extra = extra
  return event
}

function exceptionFrom(err) {
  if (err instanceof Error) {
    const value = { type: err.name || 'Error', value: String(err.message || '') }
    const st = parseFrames(err.stack)
    if (st) value.stacktrace = st
    return { value, pgCode: null }
  }
  // Section 3.1 rule 5: only message and a string code are ever read.
  const message = err !== null && typeof err === 'object' ? err.message : err
  const code = err !== null && typeof err === 'object' && typeof err.code === 'string' ? err.code : null
  return { value: { type: 'NonError', value: String(message) }, pgCode: code }
}

// ── Sending ─────────────────────────────────────────────────────────────────

function computeDeadline(budget) {
  let remaining = NO_CONTEXT_DEADLINE_MS
  if (typeof budget.remaining === 'function') {
    try { remaining = Number(budget.remaining()) - REMAINING_MARGIN_MS } catch { remaining = 0 }
    if (!Number.isFinite(remaining)) remaining = 0
  }
  return Math.floor(Math.min(MAX_SEND_MS_PER_INVOCATION, remaining, MAX_SEND_MS_PER_INVOCATION - budget.send_ms_spent))
}

async function sendEvent(store, dsn, event) {
  const budget = store.budget
  if (budget.events_sent >= MAX_EVENTS_PER_INVOCATION) {
    if (!store.capWarned) {
      store.capWarned = true
      console.warn(`[obs/${store.fn}] event cap of ${MAX_EVENTS_PER_INVOCATION} reached, further events dropped`)
    }
    return
  }
  const deadline = computeDeadline(budget)
  if (deadline < MIN_SEND_DEADLINE_MS) {
    console.warn(`[obs/${store.fn}] send skipped, only ${Math.max(deadline, 0)}ms left`)
    return
  }
  budget.events_sent += 1
  budget.send_ms_spent += deadline           // reserve, refunded below

  const scrubbed = scrubEvent(event)
  const sentAt = new Date().toISOString()
  const body = [
    JSON.stringify({ event_id: scrubbed.event_id, sent_at: sentAt }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(scrubbed),
  ].join('\n')
  const url = `${dsn.origin}/api/${dsn.projectId}/envelope/`
  const headers = {
    'Content-Type': 'application/x-sentry-envelope',
    'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=brandgeo-obs/1`,
  }

  const started = Date.now()
  const controller = new AbortController()
  let timer = null
  try {
    const request = fetch(url, { method: 'POST', headers, body, signal: controller.signal })
    const limit = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(Object.assign(new Error('deadline'), { obsTimeout: true }))
      }, deadline)
    })
    const res = await Promise.race([request, limit])
    if (!res || !res.ok) console.warn(`[obs/${store.fn}] send rejected, status ${res ? res.status : 'none'}`)
  } catch (e) {
    const why = e && (e.obsTimeout || e.name === 'AbortError') ? 'timed out' : 'network error'
    console.warn(`[obs/${store.fn}] send failed, ${why}`)
  } finally {
    if (timer) clearTimeout(timer)
    const used = Math.min(Date.now() - started, deadline)
    budget.send_ms_spent -= (deadline - used)
  }
}

function track(store, promise) {
  store.pending.add(promise)
  promise.finally(() => store.pending.delete(promise)).catch(() => {})
  return promise
}

async function dispatch(build) {
  try {
    const store = als.getStore()
    if (!store) return
    const dsn = parseDsn(process.env.SENTRY_DSN)
    if (!dsn) return
    const event = build()
    await track(store, sendEvent(store, dsn, event))
  } catch {
    // Reporting must never break the caller.
  }
}

function captureException(err, ctx) {
  return dispatch(() => {
    const event = baseEvent('error', ctx)
    const { value, pgCode } = exceptionFrom(err)
    if (pgCode) event.tags.pg_code = pgCode
    event.exception = { values: [value] }
    return event
  })
}

function captureMessage(message, level, ctx) {
  return dispatch(() => {
    const event = baseEvent(level === 'warning' ? 'warning' : 'error', ctx)
    event.message = String(message)
    return event
  })
}

// ── Wrapper ─────────────────────────────────────────────────────────────────

function withObservability(fn, handler) {
  return async function observedHandler(event, context) {
    const remaining = context && typeof context.getRemainingTimeInMillis === 'function'
      ? () => context.getRemainingTimeInMillis()
      : undefined
    const store = {
      fn,
      budget: { events_sent: 0, send_ms_spent: 0, remaining },
      pending: new Set(),
      capWarned: false,
    }
    return als.run(store, async () => {
      let timer = null
      if (remaining) {
        let ms = 0
        try { ms = Number(remaining()) - NEAR_TIMEOUT_MARGIN_MS } catch { ms = 0 }
        if (Number.isFinite(ms) && ms > 0) {
          timer = setTimeout(() => {
            timer = null
            captureMessage('near_timeout', 'warning', { fn })
          }, ms)
        }
      }
      try {
        return await handler(event, context)
      } catch (err) {
        await captureException(err, { fn, tags: { reason: 'unhandled' } })
        throw err
      } finally {
        if (timer) clearTimeout(timer)
        if (store.pending.size > 0) await Promise.allSettled([...store.pending])
      }
    })
  }
}

module.exports = {
  withObservability,
  captureException,
  captureMessage,
  scrubEvent,
  parseDsn,
  buildInfo,
  _internal: { PATTERNS, computeDeadline, parseFrames },
}
