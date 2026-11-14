/**
 * platformActivityFixture.ts: demo data for the Platform activity page.
 * Invented company names only (the repo is public). Used when isDemoMode is
 * true so the page can be checked without the server function.
 */
import type {
  ActivitySource, ClientActivityRow, FeedBatch, FeedResponse, FeedRow, SummaryResponse,
} from './platformActivity'

const iso = (msBack: number, base: number) => new Date(base - msBack).toISOString()

function client(
  id: number, name: string, plan: string, over: Partial<ClientActivityRow> = {},
): ClientActivityRow {
  return {
    client_id: id, name, plan, plan_known: true, is_research: false,
    requests_month: 120, errors_month: 3, spent_eur: 2.4, budget_eur: 8, budget_pct: 30,
    budget_level: 'ok', engines_used: ['chatgpt', 'gemini', 'claude'],
    engines_entitled: ['chatgpt', 'gemini', 'claude', 'perplexity'], viewers: 1,
    last_sign_in_at: null, last_manual_run_at: null, last_active_at: null,
    last_active_source: null, last_result_at: null,
    ...over,
  }
}

export function fixtureSummary(base: number = Date.now()): SummaryResponse {
  const clients: ClientActivityRow[] = [
    client(101, 'Northwind Bakery', 'growth', {
      requests_month: 640, errors_month: 12, spent_eur: 9.4, budget_eur: 10, budget_pct: 94,
      budget_level: 'bad', engines_used: ['chatgpt', 'gemini', 'claude', 'perplexity'],
      last_sign_in_at: iso(14 * 60_000, base), last_active_at: iso(14 * 60_000, base), last_active_source: 'sign_in',
      last_result_at: iso(2 * 3600_000, base),
    }),
    client(102, 'Harbor Clinic', 'essentials', {
      requests_month: 310, errors_month: 4, spent_eur: 4.1, budget_eur: 5, budget_pct: 82,
      budget_level: 'warn', engines_entitled: ['chatgpt', 'gemini', 'claude'], last_manual_run_at: iso(3 * 3600_000, base),
      last_active_at: iso(3 * 3600_000, base), last_active_source: 'manual_run',
      last_result_at: iso(3 * 3600_000, base),
    }),
    client(103, 'Lumen Studio', 'radar', {
      requests_month: 88, errors_month: 0, spent_eur: 0.9, budget_eur: 3, budget_pct: 30,
      engines_used: ['gemini', 'claude'], engines_entitled: ['gemini', 'claude'], last_sign_in_at: iso(26 * 3600_000, base),
      last_active_at: iso(26 * 3600_000, base), last_active_source: 'sign_in',
      last_result_at: iso(26 * 3600_000, base),
    }),
    client(104, 'Pinecrest Legal', 'growth_pro', {
      requests_month: 1180, errors_month: 40, spent_eur: 18.2, budget_eur: 40, budget_pct: 46,
      engines_used: ['chatgpt', 'gemini', 'claude', 'perplexity', 'grok', 'google_ai'],
      engines_entitled: ['chatgpt', 'gemini', 'claude', 'perplexity', 'grok', 'google_ai', 'deepseek'],
      viewers: 2, last_sign_in_at: iso(2 * 86400_000, base),
      last_active_at: iso(2 * 86400_000, base), last_active_source: 'sign_in',
      last_result_at: iso(5 * 3600_000, base),
    }),
    client(105, 'Kestrel Logistics', 'free', {
      requests_month: 15, errors_month: 0, spent_eur: 0.1, budget_eur: 0.3, budget_pct: 33,
      engines_used: ['gemini'], engines_entitled: ['gemini'], viewers: 0,
    }),
    client(901, 'Research City Batch A', 'managed', {
      is_research: true, requests_month: 2400, errors_month: 22, spent_eur: 40, budget_eur: 0,
      budget_pct: null, viewers: 0, last_result_at: iso(9 * 3600_000, base),
    }),
  ]
  return {
    generated_at: new Date(base).toISOString(),
    windows: {
      day_start_utc: new Date(Date.UTC(new Date(base).getUTCFullYear(), new Date(base).getUTCMonth(), new Date(base).getUTCDate())).toISOString(),
      month_start: new Date(Date.UTC(new Date(base).getUTCFullYear(), new Date(base).getUTCMonth(), 1)).toISOString(),
      last_24h_start: iso(86400_000, base),
      read_since: iso(86400_000, base),
    },
    tiles: {
      active_users_24h: { viewers: 2, clients: 2 },
      runs_today: { customer: 9, research: 3, manual: 4, scheduled: 8, engine_calls: 212 },
      engine_health_24h: {
        calls: 420, ok: 404, errors: 16, error_rate: 0.038,
        by_llm: [
          { llm: 'chatgpt', calls: 120, errors: 2 },
          { llm: 'gemini', calls: 120, errors: 1 },
          { llm: 'claude', calls: 100, errors: 3 },
          { llm: 'perplexity', calls: 80, errors: 10 },
        ],
        level: 'warn', reason: 'rate', outage_llms: [],
      },
      budget_watch: { customers_measured: 5, over_80: 2, over_90: 1, over_100: 0 },
    },
    clients,
    spend_check: { paged_total_eur: 74.9, rpc_total_eur: 74.9, delta_eur: 0, null_cost_rows: 0 },
    truncated: { ai_results_month: false, auth_users: false, clients: false, profiles: false, collection_runs: false },
    warnings: [],
  }
}

export function fixtureFeedRows(base: number = Date.now()): FeedRow[] {
  const r = (
    id: string, backMs: number, badge: FeedRow['badge'], tone: FeedRow['tone'],
    clientId: number | null, name: string | null, detail: FeedRow['detail'],
    role: FeedRow['actor_role'] = 'viewer', research = false,
  ): FeedRow => ({
    id, at: iso(backMs, base), badge, tone, client_id: clientId, client_name: name,
    is_research: research, actor_role: role, detail,
  })
  return [
    r('f1', 40_000, 'LOGIN', 'neutral', 101, 'Northwind Bakery', { kind: 'login' }),
    r('f2', 3 * 60_000, 'RUN_STARTED', 'info', 101, 'Northwind Bakery', { kind: 'run', trigger: 'manual', force: false, total_jobs: 12 }),
    r('f3', 9 * 60_000, 'ENGINE_ERROR', 'warn', 104, 'Pinecrest Legal', { kind: 'engine_error', llm: 'perplexity', error_code: 'quota_exceeded' }, 'system'),
    r('f4', 25 * 60_000, 'PLAN_CHANGE', 'info', 102, 'Harbor Clinic', { kind: 'plan', from_plan: 'radar', to_plan: 'essentials', grant_until: null }, 'admin'),
    r('f5', 52 * 60_000, 'JOB_FAILED', 'bad', 104, 'Pinecrest Legal', { kind: 'job_failed', attempts: 3, engines: ['perplexity'], has_error_text: true }, 'system'),
    r('f6', 80 * 60_000, 'RUN_STARTED', 'info', 902, 'Research City Batch B', { kind: 'run', trigger: 'scheduled', force: false, total_jobs: 40 }, 'system', true),
    r('f7', 2 * 3600_000, 'TRIAL_GRANT', 'ok', 103, 'Lumen Studio', { kind: 'plan', from_plan: 'radar', to_plan: 'growth', grant_until: iso(-14 * 86400_000, base) }, 'admin'),
    r('f8', 5 * 3600_000, 'SIGNUP', 'ok', 105, 'Kestrel Logistics', { kind: 'signup', to_plan: 'free', account_type: 'company' }, 'viewer'),
  ]
}

/** Emits the fixture rows as the initial batch, then one new row every few seconds. */
export function createFixtureActivitySource(opts: { tickMs?: number } = {}): ActivitySource {
  const tickMs = opts.tickMs ?? 8000
  return {
    subscribe(onBatch, onStatus) {
      let n = 0
      onStatus?.('live')
      const initial: FeedBatch = { rows: fixtureFeedRows(), initial: true, truncated: false }
      const t0 = setTimeout(() => onBatch(initial), 0)
      const timer = setInterval(() => {
        n += 1
        const row: FeedRow = {
          id: `live-${n}`, at: new Date().toISOString(),
          badge: n % 2 ? 'RUN_STARTED' : 'LOGIN', tone: n % 2 ? 'info' : 'neutral',
          client_id: 103, client_name: 'Lumen Studio', is_research: false, actor_role: 'viewer',
          detail: n % 2
            ? { kind: 'run', trigger: 'manual', force: false, total_jobs: 6 }
            : { kind: 'login' },
        }
        onBatch({ rows: [row], initial: false, truncated: false })
      }, tickMs)
      return () => { clearTimeout(t0); clearInterval(timer) }
    },
  }
}

export const fixtureFeedResponse = (): FeedResponse => ({
  rows: fixtureFeedRows(),
  cursor: new Date().toISOString(),
  server_time: new Date().toISOString(),
  window: { since: new Date(Date.now() - 86400_000).toISOString(), until: new Date().toISOString() },
  truncated: { client_events: false, collection_runs: false, collection_jobs: false, engine_errors: false, account_deleted: false, logins: false, merged: false },
  warnings: [],
})
