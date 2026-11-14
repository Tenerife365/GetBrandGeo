/**
 * platformActivity.ts: response types, the polled ActivitySource, the summary
 * poller hook, the authed POST and the detail line formatter for the admin
 * Platform activity page (docs/arch/platform-activity.md sections 3.3, 3.4,
 * 3.7 and 5.2).
 *
 * Imports nothing from `motion`: Layout never imports this file, but keeping it
 * motion free keeps the page chunk the only place the feature touches it.
 * All user visible strings below are English literals, copy: pending bg-copy.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ENGINE_META, PLAN_LABELS } from './planConfig'

// ---------------------------------------------------------------- types (3.3)

export interface ClientActivityRow {
  client_id: number
  name: string
  plan: string
  plan_known: boolean
  is_research: boolean
  requests_month: number
  errors_month: number
  spent_eur: number
  budget_eur: number
  budget_pct: number | null
  budget_level: 'ok' | 'warn' | 'bad'
  engines_used: string[]
  engines_entitled: string[]
  viewers: number
  last_sign_in_at: string | null
  last_manual_run_at: string | null
  last_active_at: string | null
  last_active_source: 'sign_in' | 'manual_run' | null
  last_result_at: string | null
}

export interface SummaryResponse {
  generated_at: string
  windows: {
    day_start_utc: string
    month_start: string
    last_24h_start: string
    read_since: string
  }
  tiles: {
    active_users_24h: { viewers: number; clients: number }
    runs_today: { customer: number; research: number; manual: number; scheduled: number; engine_calls: number }
    engine_health_24h: {
      calls: number
      ok: number
      errors: number
      error_rate: number | null
      by_llm: Array<{ llm: string; calls: number; errors: number }>
      level: 'ok' | 'warn' | 'bad'
      reason: 'rate' | 'engine_outage' | null
      outage_llms: string[]
    }
    budget_watch: { customers_measured: number; over_80: number; over_90: number; over_100: number }
  }
  clients: ClientActivityRow[]
  spend_check: {
    paged_total_eur: number
    rpc_total_eur: number | null
    delta_eur: number | null
    null_cost_rows: number
  }
  truncated: {
    ai_results_month: boolean
    auth_users: boolean
    clients: boolean
    profiles: boolean
    collection_runs: boolean
  }
  warnings: string[]
}

// ---------------------------------------------------------------- types (3.4)

export type FeedBadge =
  | 'LOGIN' | 'RUN_STARTED' | 'JOB_FAILED' | 'ENGINE_ERROR' | 'ACCOUNT_DELETED'
  | 'PLAN_CHANGE' | 'TRIAL_GRANT' | 'COMP_GRANT' | 'TRIAL_EXPIRED' | 'ONBOARDED'
  | 'SIGNUP' | 'STRIPE_CHANGE' | 'STRIPE_PROVISION' | 'MCP_FIX_MARKED'
  | 'INVITE_RESENT' | 'LOCATION_CHANGE'

export type FeedTone = 'neutral' | 'info' | 'ok' | 'warn' | 'bad'

export type FeedDetail =
  | { kind: 'login' }
  | { kind: 'run'; trigger: 'manual' | 'scheduled'; force: boolean; total_jobs: number | null }
  | { kind: 'job_failed'; attempts: number | null; engines: string[]; has_error_text: boolean }
  | { kind: 'engine_error'; llm: string; error_code: string | null }
  | { kind: 'account_deleted' }
  | { kind: 'plan'; from_plan: string | null; to_plan: string | null; grant_until: string | null }
  | { kind: 'trial_expired'; from_plan: string | null; to_plan: string | null; was: string | null }
  | { kind: 'onboarded'; to_plan: string | null; prompts_created: number | null; locations_created: number | null; invite_channel: string | null }
  | { kind: 'signup'; to_plan: string | null; account_type: string | null }
  | { kind: 'stripe'; from_plan: string | null; to_plan: string | null; reason: string | null }
  | { kind: 'mcp_fix'; fix_id: string | null; via: 'oauth' | 'key' | null }
  | { kind: 'invite'; channel: string | null; delivery: string | null }
  | { kind: 'location'; action: 'add' | 'archive' | 'set_primary' | null; over_limit: boolean; count: number | null }

export interface FeedRow {
  id: string
  at: string
  badge: FeedBadge
  tone: FeedTone
  client_id: number | null
  client_name: string | null
  is_research: boolean
  actor_role: 'admin' | 'viewer' | 'system' | null
  detail: FeedDetail
}

export interface FeedResponse {
  rows: FeedRow[]
  cursor: string
  server_time: string
  window: { since: string; until: string }
  truncated: {
    client_events: boolean
    collection_runs: boolean
    collection_jobs: boolean
    engine_errors: boolean
    account_deleted: boolean
    logins: boolean
    merged: boolean
  }
  warnings: string[]
}

// ---------------------------------------------------------------- source (3.7)

export type SourceStatus = 'live' | 'paused' | 'retrying' | 'stopped'

export interface FeedBatch {
  rows: FeedRow[]
  initial: boolean
  truncated: boolean
}

export interface ActivitySource {
  subscribe(onBatch: (b: FeedBatch) => void, onStatus?: (s: SourceStatus) => void): () => void
}

export interface PollingSourceOptions {
  fetchFeed: (since: string | null) => Promise<{ status: number; data: FeedResponse | null }>
  intervalMs?: number
  overlapMs?: number
  maxBackoffMs?: number
  seenCap?: number
  isHidden?: () => boolean
  onVisibilityChange?: (cb: () => void) => () => void
  setTimer?: typeof setTimeout
  clearTimer?: typeof clearTimeout
  /** Injectable clock, only used to compare against the last fetch time. */
  now?: () => number
}

export const FEED_POLL_MS = 15_000
export const SUMMARY_POLL_MS = 60_000
export const FEED_RENDER_CAP = 200

const defaultHidden = () => typeof document !== 'undefined' && document.hidden
const defaultVisibility = (cb: () => void) => {
  if (typeof document === 'undefined') return () => {}
  document.addEventListener('visibilitychange', cb)
  return () => document.removeEventListener('visibilitychange', cb)
}

function anyTruncated(t: FeedResponse['truncated'] | undefined): boolean {
  if (!t) return false
  return Object.values(t).some(Boolean)
}

export function createPollingActivitySource(opts: PollingSourceOptions): ActivitySource {
  const intervalMs = opts.intervalMs ?? FEED_POLL_MS
  const overlapMs = opts.overlapMs ?? 60_000
  const maxBackoffMs = opts.maxBackoffMs ?? 120_000
  const seenCap = opts.seenCap ?? 1000
  const isHidden = opts.isHidden ?? defaultHidden
  const onVis = opts.onVisibilityChange ?? defaultVisibility
  const setT = opts.setTimer ?? setTimeout
  const clearT = opts.clearTimer ?? clearTimeout
  const nowMs = opts.now ?? Date.now

  const subs = new Set<{ onBatch: (b: FeedBatch) => void; onStatus?: (s: SourceStatus) => void }>()
  let seen = new Set<string>()
  let cursor: string | null = null
  let failures = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight = false
  let stopped = false
  let first = true
  let lastFetchAt = 0
  let status: SourceStatus | null = null
  let offVis: (() => void) | null = null

  const setStatus = (s: SourceStatus) => {
    if (status === s) return
    status = s
    subs.forEach((x) => x.onStatus?.(s))
  }
  const clearTick = () => {
    if (timer !== null) { clearT(timer); timer = null }
  }
  const schedule = (delay: number) => {
    clearTick()
    if (stopped) return
    timer = setT(() => { timer = null; void tick() }, delay)
  }

  async function tick(): Promise<void> {
    if (stopped || inFlight || subs.size === 0) return
    if (isHidden()) { setStatus('paused'); return }
    inFlight = true
    lastFetchAt = nowMs()
    let res: { status: number; data: FeedResponse | null } | null = null
    try {
      const since = cursor === null ? null : new Date(Date.parse(cursor) - overlapMs).toISOString()
      res = await opts.fetchFeed(since)
    } catch {
      res = null
    }
    inFlight = false
    if (stopped || subs.size === 0) return
    if (res && (res.status === 401 || res.status === 403)) {
      stopped = true
      setStatus('stopped')
      return
    }
    if (!res || res.status >= 500 || res.status < 200 || res.status >= 300 || !res.data) {
      failures += 1
      setStatus('retrying')
      schedule(Math.min(maxBackoffMs, intervalMs * Math.pow(2, failures)))
      return
    }
    failures = 0
    const data = res.data
    if (typeof data.cursor === 'string') cursor = data.cursor
    const fresh: FeedRow[] = []
    for (const row of data.rows ?? []) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      fresh.push(row)
    }
    if (seen.size > seenCap) {
      const drop = seen.size - seenCap
      let i = 0
      const next = new Set<string>()
      seen.forEach((id) => { if (i++ >= drop) next.add(id) })
      seen = next
    }
    const wasFirst = first
    first = false
    setStatus('live')
    if (fresh.length > 0) {
      const batch: FeedBatch = { rows: fresh, initial: wasFirst, truncated: anyTruncated(data.truncated) }
      subs.forEach((x) => x.onBatch(batch))
    }
    schedule(intervalMs)
  }

  function onVisible() {
    if (stopped || subs.size === 0) return
    if (isHidden()) {
      clearTick()
      setStatus('paused')
      return
    }
    const age = nowMs() - lastFetchAt
    if (lastFetchAt === 0 || age >= intervalMs) {
      clearTick()
      void tick()
    } else if (timer === null && !inFlight) {
      schedule(intervalMs - age)
    }
  }

  function start() {
    stopped = false
    first = true
    seen = new Set()
    cursor = null
    failures = 0
    lastFetchAt = 0
    status = null
    offVis = onVis(onVisible)
    void tick()
  }
  function stop() {
    stopped = true
    clearTick()
    if (offVis) { offVis(); offVis = null }
  }

  return {
    subscribe(onBatch, onStatus) {
      const entry = { onBatch, onStatus }
      subs.add(entry)
      if (subs.size === 1) start()
      else if (status) onStatus?.(status)
      return () => {
        if (!subs.delete(entry)) return
        if (subs.size === 0) stop()
      }
    },
  }
}

// ---------------------------------------------------------------- transport

async function authedPost<T>(body: unknown): Promise<{ status: number; data: T | null }> {
  const { supabase } = await import('./supabase')
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''
  const res = await fetch('/.netlify/functions/platform-activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

export const fetchFeedFromServer = (since: string | null) =>
  authedPost<FeedResponse>(since ? { action: 'feed', since } : { action: 'feed' })

export const fetchSummaryFromServer = () => authedPost<SummaryResponse>({ action: 'summary' })

// ---------------------------------------------------------------- summary poller

export interface SummaryPollState {
  data: SummaryResponse | null
  /** True until the first response, success or failure. */
  loading: boolean
  /** The last request failed (data from an earlier success may still be shown). */
  failed: boolean
  status: SourceStatus
  retry: () => void
}

export function useSummaryPoll(
  fetchSummary: () => Promise<{ status: number; data: SummaryResponse | null }>,
  opts: { intervalMs?: number; enabled?: boolean } = {},
): SummaryPollState {
  const intervalMs = opts.intervalMs ?? SUMMARY_POLL_MS
  const enabled = opts.enabled ?? true
  const [data, setData] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [status, setStatus] = useState<SourceStatus>('live')
  const fetchRef = useRef(fetchSummary)
  fetchRef.current = fetchSummary
  const kick = useRef<() => void>(() => {})

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let inFlight = false
    let stopped = false
    let failures = 0
    let lastAt = 0

    const clear = () => { if (timer !== null) { clearTimeout(timer); timer = null } }
    const schedule = (d: number) => {
      clear()
      if (cancelled || stopped) return
      timer = setTimeout(() => { timer = null; void run() }, d)
    }
    async function run() {
      if (cancelled || stopped || inFlight) return
      if (document.hidden) { setStatus('paused'); return }
      inFlight = true
      lastAt = Date.now()
      let res: { status: number; data: SummaryResponse | null } | null = null
      try { res = await fetchRef.current() } catch { res = null }
      inFlight = false
      if (cancelled) return
      if (res && (res.status === 401 || res.status === 403)) {
        stopped = true
        setStatus('stopped')
        setLoading(false)
        return
      }
      if (!res || res.status < 200 || res.status >= 300 || !res.data) {
        failures += 1
        setFailed(true)
        setLoading(false)
        setStatus('retrying')
        schedule(Math.min(120_000, intervalMs * Math.pow(2, failures)))
        return
      }
      failures = 0
      setData(res.data)
      setFailed(false)
      setLoading(false)
      setStatus('live')
      schedule(intervalMs)
    }
    const onVis = () => {
      if (cancelled || stopped) return
      if (document.hidden) { clear(); setStatus('paused'); return }
      const age = Date.now() - lastAt
      if (lastAt === 0 || age >= intervalMs) { clear(); void run() }
      else if (timer === null && !inFlight) schedule(intervalMs - age)
    }
    kick.current = () => { clear(); failures = 0; setLoading(true); void run() }
    document.addEventListener('visibilitychange', onVis)
    void run()
    return () => {
      cancelled = true
      clear()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [enabled, intervalMs])

  const retry = useCallback(() => kick.current(), [])
  return { data, loading, failed, status, retry }
}

// ---------------------------------------------------------------- formatting

export const BADGE_TEXT: Record<FeedBadge, string> = {
  LOGIN: 'LOGIN',
  RUN_STARTED: 'RUN',
  JOB_FAILED: 'JOB FAILED',
  ENGINE_ERROR: 'ENGINE ERROR',
  ACCOUNT_DELETED: 'DELETED',
  PLAN_CHANGE: 'PLAN',
  TRIAL_GRANT: 'TRIAL',
  COMP_GRANT: 'COMP',
  TRIAL_EXPIRED: 'TRIAL ENDED',
  ONBOARDED: 'ONBOARDED',
  SIGNUP: 'SIGNUP',
  STRIPE_CHANGE: 'STRIPE',
  STRIPE_PROVISION: 'STRIPE NEW',
  MCP_FIX_MARKED: 'MCP FIX',
  INVITE_RESENT: 'INVITE',
  LOCATION_CHANGE: 'LOCATION',
}

export const planText = (p: string | null): string => {
  if (!p) return 'unknown plan'
  return p in PLAN_LABELS ? PLAN_LABELS[p as keyof typeof PLAN_LABELS] : p
}

export const engineText = (id: string): string => {
  const meta = (ENGINE_META as Record<string, { label: string } | undefined>)[id]
  return meta ? meta.label : id
}

const dateOnly = (iso: string | null): string | null => (iso ? iso.slice(0, 10) : null)

const ERROR_CODE_TEXT: Record<string, string> = {
  quota_exceeded: 'quota exceeded',
  api_error: 'API error',
  auth_error: 'auth error',
  timeout: 'timeout',
}

/** Section 5.2. `badge` disambiguates the three `plan` kinds. */
export function formatDetail(row: Pick<FeedRow, 'badge' | 'detail' | 'client_id'>): string {
  const d = row.detail
  switch (d.kind) {
    case 'login':
      return 'Viewer signed in' // copy: pending bg-copy
    case 'run': {
      const base = `${d.trigger === 'manual' ? 'Manual' : 'Scheduled'} run${d.total_jobs !== null ? `, ${d.total_jobs} jobs` : ''}`
      return d.force ? `${base}, forced` : base
    }
    case 'job_failed': {
      const n = d.attempts !== null ? ` after ${d.attempts} attempts` : ''
      const on = d.engines.length > 0 ? ` on ${d.engines.map(engineText).join(', ')}` : ''
      return `Job failed${n}${on}`
    }
    case 'engine_error':
      return `${engineText(d.llm)}: ${(d.error_code && ERROR_CODE_TEXT[d.error_code]) || 'unknown error'}`
    case 'account_deleted':
      return `Client ${row.client_id ?? ''} deleted`.replace('  ', ' ')
    case 'plan': {
      const until = dateOnly(d.grant_until)
      if (row.badge === 'TRIAL_GRANT') return `Trial of ${planText(d.to_plan)}${until ? ` until ${until}` : ''}`
      if (row.badge === 'COMP_GRANT') return `Complimentary ${planText(d.to_plan)}${until ? ` until ${until}` : ' with no end date'}`
      return `${planText(d.from_plan)} to ${planText(d.to_plan)}${until ? ` until ${until}` : ''}`
    }
    case 'trial_expired':
      return `${planText(d.from_plan)} ended, now ${planText(d.to_plan)}`
    case 'onboarded': {
      const p = d.prompts_created !== null ? `, ${d.prompts_created} prompts` : ''
      const l = d.locations_created !== null ? `, ${d.locations_created} locations` : ''
      return `Onboarded on ${planText(d.to_plan)}${p}${l}`
    }
    case 'signup':
      return `Signed up on ${planText(d.to_plan)}${d.account_type ? ` (${d.account_type})` : ''}`
    case 'stripe':
      if (row.badge === 'STRIPE_PROVISION') return `Created through Stripe on ${planText(d.to_plan)}`
      return `${planText(d.from_plan)} to ${planText(d.to_plan)} through Stripe${d.reason ? ` (${d.reason})` : ''}`
    case 'mcp_fix': {
      const via = d.via === 'oauth' ? ' (OAuth)' : d.via === 'key' ? ' (API key)' : ''
      return `Fix ${d.fix_id ?? ''} marked done through MCP${via}`.replace('Fix  marked', 'Fix marked')
    }
    case 'invite': {
      const bits = [d.channel, d.delivery].filter(Boolean).join(', ')
      return `Invite resent${bits ? ` by ${bits}` : ''}`
    }
    case 'location': {
      const base = d.action === 'archive' ? 'Location archived' : d.action === 'set_primary' ? 'Primary location changed' : 'Location added'
      return d.over_limit ? `${base}, over plan limit` : base
    }
  }
}

/** Short relative time, "just now" under a minute. */
export function relativeTime(iso: string | null, nowMs: number): string {
  if (!iso) return 'Never'
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return 'Never'
  const s = Math.max(0, Math.round((nowMs - t) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h} h ago`
  return `${Math.floor(h / 24)} d ago`
}
