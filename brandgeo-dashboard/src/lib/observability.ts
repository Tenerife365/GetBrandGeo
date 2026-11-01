/**
 * observability.ts  (docs/arch/observability.md sections 3.5, 7 and 9, path A)
 *
 * Browser error reporting for app.getbrandgeo.com. This file is the only one
 * that lands in the main chunk. It never imports @sentry/browser: the SDK lives
 * in ./observabilitySentry, which is loaded with a dynamic import after the
 * page has finished loading.
 *
 * initObservability() returns immediately, with no import and no network, unless
 * ALL of these hold:
 *   - import.meta.env.PROD
 *   - import.meta.env.VITE_SENTRY_DSN is non-empty
 *   - location.hostname === 'app.getbrandgeo.com'
 *   - !isDemoMode
 *
 * Until the SDK is ready, a small buffer (max 10 entries) holds uncaught errors
 * and unhandled rejections so that nothing thrown during start-up is lost.
 *
 * scrubEvent (section 7) is exported and pure, so a plain Node test can run it
 * against tests/fixtures/observability-pii.json. The rule list mirrors
 * netlify/functions/_observability.js and must stay identical to it.
 */

import { isDemoMode } from './supabase'

const PROD_HOST = 'app.getbrandgeo.com'
const MAX_BUFFER = 10
const IDLE_TIMEOUT_MS = 5000
const FALLBACK_DELAY_MS = 1000

// Section 7 patterns. The same list lives in netlify/functions/_observability.js
// and in tests/fixtures/observability-pii.json (its "patterns" block).
export const OBS_PATTERNS = {
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
const P = OBS_PATTERNS
const EXEMPT_TAGS = ['fn', 'pg_code']
const SUBS: [RegExp, string][] = [
  [P.email, '[email]'],
  [P.jwt, '[jwt]'],
  [P.bearer, 'Bearer [redacted]'],
  [P.mcpKey, '[key]'],
  [P.stripe, '[stripe]'],
  [P.longRun, '[secret]'],
]

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

// ── Scrub (section 7) ───────────────────────────────────────────────────────

function cleanUrls(s: string): string {
  return s.replace(P.url, (u) => u.replace(/[?#].*/, '')).replace(P.pathToken, '$1[token]')
}

function scrubString(s: unknown, limit: number): string {
  let out = cleanUrls(String(s))
  for (const [re, to] of SUBS) out = out.replace(re, to)
  return out.slice(0, limit)
}

// Copies an object without its denied keys, mapping the values that stay.
function keep(o: Obj, f: (v: unknown, k: string) => unknown): Obj {
  const out: Obj = {}
  for (const [k, v] of Object.entries(o)) if (!P.denyKey.test(k)) out[k] = f(v, k)
  return out
}

// Deletes denied keys at any depth; replaces strings unless `raw`.
function scrubTree(v: unknown, raw: boolean): unknown {
  if (typeof v === 'string') return raw ? v : scrubString(v, 300)
  if (Array.isArray(v)) return v.map((x) => scrubTree(x, raw))
  return isObj(v) ? keep(v, (x) => scrubTree(x, raw)) : v
}

/**
 * Pure. Returns a scrubbed deep copy of an error event. Throws if the event
 * cannot be serialised; callers that send must treat a throw as "drop".
 */
export function scrubEvent<T extends object>(input: T): T {
  const e: Obj = JSON.parse(JSON.stringify(input || {}))

  // Rule 1: never sent at all.
  delete e.user
  delete e.breadcrumbs
  delete e.server_name
  if (isObj(e.request)) {
    const r = e.request
    delete r.cookies
    delete r.headers
    delete r.data
    delete r.query_string
    if (typeof r.url === 'string') r.url = scrubString(r.url, 300)
  }
  if (isObj(e.contexts)) {
    delete e.contexts.device
    e.contexts = keep(e.contexts, (v, k) => scrubTree(v, k === 'trace'))
  }

  // Rules 3 and 4 on tags: fn and pg_code are exempt from both.
  if (isObj(e.tags)) {
    const out: Obj = {}
    for (const [k, v] of Object.entries(e.tags)) {
      if (EXEMPT_TAGS.includes(k)) out[k] = v
      else if (!P.denyKey.test(k) && !(v !== null && typeof v === 'object')) {
        out[k] = typeof v === 'string' ? scrubString(v, 300) : v
      }
    }
    e.tags = out
  }

  if (isObj(e.extra)) e.extra = scrubTree(e.extra, false)
  if (typeof e.message === 'string') e.message = scrubString(e.message, 300)

  if (isObj(e.exception) && Array.isArray(e.exception.values)) {
    for (const ex of e.exception.values as unknown[]) {
      if (!isObj(ex)) continue
      if (typeof ex.value === 'string') ex.value = scrubString(ex.value, 500)
      const frames = isObj(ex.stacktrace) && Array.isArray(ex.stacktrace.frames) ? ex.stacktrace.frames : []
      for (const f of frames as unknown[]) {
        if (!isObj(f)) continue
        if (typeof f.filename === 'string') f.filename = scrubString(f.filename, 300)
        if (typeof f.abs_path === 'string') f.abs_path = cleanUrls(f.abs_path)
      }
    }
  }
  return e as T
}

// ── Pre-load buffer and lazy start (section 3.5) ────────────────────────────

/** One uncaught error or unhandled rejection captured before the SDK loaded. */
export type BufferedError = { kind: 'error' | 'rejection'; error: unknown; message: string }

function messageOf(v: unknown): string {
  if (v instanceof Error) return v.message
  return typeof v === 'string' ? v : ''
}

function whenLoaded(fn: () => void): void {
  const afterLoad = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fn, { timeout: IDLE_TIMEOUT_MS })
    } else {
      window.setTimeout(fn, FALLBACK_DELAY_MS)
    }
  }
  if (document.readyState === 'complete') afterLoad()
  else window.addEventListener('load', afterLoad, { once: true })
}

export function initObservability(): void {
  try {
    if (!import.meta.env.PROD) return
    const dsn: unknown = import.meta.env.VITE_SENTRY_DSN
    if (typeof dsn !== 'string' || dsn.trim() === '') return
    if (typeof window === 'undefined' || window.location.hostname !== PROD_HOST) return
    if (isDemoMode) return

    const buffer: BufferedError[] = []
    const push = (entry: BufferedError) => {
      if (entry.message.includes('ResizeObserver loop')) return
      if (buffer.length < MAX_BUFFER) buffer.push(entry)
    }
    const onError = (ev: ErrorEvent) =>
      push({ kind: 'error', error: ev.error ?? null, message: ev.message || messageOf(ev.error) })
    const onRejection = (ev: PromiseRejectionEvent) =>
      push({ kind: 'rejection', error: ev.reason, message: messageOf(ev.reason) })
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    const detach = () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }

    whenLoaded(() => {
      import('./observabilitySentry')
        .then((m) => {
          m.startSentry(buffer.splice(0), scrubEvent, detach)
        })
        .catch(() => {
          // Blocked or failed chunk: reporting is optional, never break the app.
          detach()
          buffer.length = 0
        })
    })
  } catch {
    // Reporting must never break the app.
  }
}
