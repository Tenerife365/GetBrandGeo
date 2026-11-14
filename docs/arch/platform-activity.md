# Platform Activity: admin command center (architecture spec)

INTENT: one read-only admin view of who is using the platform, what the engines are doing, and who is near budget | SCOPE: `docs/arch/` (write), `brandgeo-dashboard/` (read) | MODEL: opus | STOP AFTER: /build

Author: bg-architect, 2026-11-14. Binding for bg-backend and bg-app. No schema change, no migration, no new dependency.

Writing rule for builders: every string in this file that will be copied into code is free of em and en dashes. New user-facing strings are English literals marked `// copy: pending bg-copy`.

---

## 1. Current state, verified

### 1.1 Production, read 2026-11-14 (read-only SQL from this seat)

| Fact | Value |
|---|---|
| `pg_publication_tables` for `supabase_realtime` | 0 rows (given; repo has no `.channel(` or `postgres_changes`) |
| `ai_results` rows since month start (Nov 1 to Nov 14) | 2,050, of which 21 `status='error'`, 0 with `cost_eur` null |
| `ai_results` rows in the last 24 h | 310 |
| `ai_results.error_code` values in 30 days | `api_error`, `quota_exceeded`, `timeout`, null |
| month spend, `sum(cost_eur)` | EUR 99.48 |
| `clients` | 69 rows, `category` in `active`, `free`, `research`; 37 are `research`; 0 with null `plan` |
| `user_profiles` | 33 rows, 1 admin; **0 rows with null `client_id`** (the admin profile carries a client id) |
| `auth.users` | 37 rows; 4 have no `user_profiles` row; 2 signed in during the last 24 h |
| `collection_jobs` | 1,827 rows all time, 0 `failed` all time |
| `client_events.type` values ever written | `comp_grant`, `invite_resent`, `mcp_fix_marked`, `onboarded`, `plan_change`, `signup`, `trial_expired` (so `location_change`, `stripe_change`, `stripe_provision`, `trial_grant` have never been written) |
| `admin_notifications` in 30 days | 1 row; types ever written: `account_deleted`, `new_signup`, `package_purchased`, `subscription_canceled`, `subscription_new`, `trial_expired` |
| `sum_cost_eur(p_since, p_client_id)` body | `select coalesce(sum(cost_eur), 0) from public.ai_results where checked_at >= p_since and (p_client_id is null or client_id = p_client_id)` (nulls count as 0) |

Indexes that bound the queries below (from `pg_indexes`):
`idx_ai_results_checked_at (checked_at)`, `idx_ai_results_status (status)`, `idx_ai_results_client_checked (client_id, checked_at desc)`, `idx_client_events_created (created_at desc)`, `idx_collection_runs_client (client_id, created_at desc)`, `idx_collection_jobs_client (client_id, status)`. There is **no** index on `collection_runs.created_at` alone and none on `collection_jobs.finished_at`; both tables are small (74 runs in 30 days, 1,827 jobs all time), so the bounded reads below are cheap seq scans today. Recorded, not fixed (no migration).

RLS on the tables this page reads (`pg_policies`): `client_events_select` is `is_admin()`; `collection_runs_select` and `collection_jobs_select` are `my_role() = 'admin' OR client_id = my_client_id()`; `ai_results` has two SELECT policies (admin or `has_client_access`); `admin_notifications_select` is `is_admin()`; `user_profiles` has only own-row SELECT policies, so **the browser cannot map an actor or a login to a client**. That alone puts the mapping in a function.

### 1.2 Code, read from the working tree

| Claim | Citation |
|---|---|
| `requireAuth(event, { adminOnly, clientId })` returns `{ response }` or `{ user, profile, supabase, headers }`; 401 on missing or invalid token, 403 on origin, missing profile, or non-admin | `brandgeo-dashboard/netlify/functions/_auth.js:67`, `:80`, `:87`, `:94`, `:105`, `:109` |
| `_auth.js` exports `requireAuth, corsHeaders, ALLOWED_ORIGINS, checkCollectionLimits, sumCostEur, monthStartIso` | `_auth.js:354` |
| `sumCostEur(supabase, { since, clientId })` returns `{ ok: true, sum }` or `{ ok: false, reason, error }` | `_auth.js:192` |
| `monthStartIso()` is the first of the month at 00:00 in the server's local zone (UTC on Netlify) | `_auth.js:214` |
| Budget gate: unknown plan coerced to `essentials`, missing budget entry falls back to `free` | `_auth.js:246`, `_auth.js:276` to `:300` |
| `PLAN_LIVE_ENGINES` | `_cost.js:377` |
| `activeEnginesFor(plan, enginesEnabled)`, unknown plan falls back to `essentials` | `_cost.js:468` |
| `PLAN_MONTHLY_API_BUDGET_EUR` | `_cost.js:532` |
| `RESEARCH_CATEGORY = 'research'` | `_cost.js:589` |
| `_cost.js` exports all four | `_cost.js:724` to `:749` |
| Paged read pattern: `SUPABASE_PAGE = 1000`, `SUPABASE_MAX_PAGES = 60`, `selectAll(label, build, warn)` with a warning when the cap is hit | `revenue-report.js:102`, `:103`, `:146` |
| `sumApiCostByClient` adds a flat per-engine estimate for rows whose `cost_eur` is null | `_revenue.js:612` (fallback branch inside) |
| Admin envelope: POST with `{ action }`, JSON object body required, errors `{ error, code }` | `resend-invite.js:165` to `:192` |
| Paged `auth.admin.listUsers({ page, perPage })`, `PAGING = { perPage: 1000, maxPages: 20 }`, truncation flag | `resend-invite.js:87`, `:125` to `:140` |
| `resend-invite` and `revenue-report` run at `timeout = 26` | `netlify.toml:171`, `:232` |
| Test auth mock: `installAuthMock` returns the mock object; its `requireAuth` returns `{ user, role, clientId, headers }` and **no `supabase`**; it exports no `sumCostEur` or `monthStartIso` | `tests/helpers/affiliate_test_env.js:36` to `:61` |
| In-memory fake supports `eq/neq/in/gte/lte/gt/lt/is/order/limit`, `range` via select, `rpc('sum_cost_eur')` with `sumCostEur: true`, paged `listUsers` with `pagedListUsers: true` | `tests/helpers/fake_supabase_mem.js:5`, `:220` to `:229`, `:353`, `:356`, `:486` |
| Lazy routes and the wrapper pattern | `src/App.tsx:30` to `:31`, `:312` to `:313` |
| `MotionConfig` from `motion/react` is imported in the entry | `src/App.tsx:3` |
| Admin sidebar entries in the Manage group | `src/components/Layout.tsx:693` to `:697` |
| Lucide import block in Layout | `src/components/Layout.tsx:3` to `:8` |
| Admin gate in a page: `if (!isAdmin) return (...)` | `src/pages/Revenue.tsx:985` |
| Demo precedent: `if (!isAdmin && !isDemoMode)` lets the demo build render fixtures | `src/pages/AffiliatesAdmin.tsx:187` |
| Authenticated POST helper pattern | `src/pages/Revenue.tsx:242` |
| Motion duration tokens `MOTION_FAST = 0.18`, `MOTION_BASE = 0.26` | `src/lib/motion.ts:27` to `:29` |
| Primitives: `Stat` (tone `neutral|warn|alert`, never recolours the value), `Badge` (tone `neutral|accent|pos|warn|neg`), `Meter` (value 0 to 100, tone `accent|pos|warn|neg`), `Notice` (tone `warn|neg|accent`), `Card` (pad), `tableClasses` (sticky `th`), skeletons | `src/components/ui/Stat.tsx:10`, `Badge.tsx:5`, `Meter.tsx:4`, `Notice.tsx:7`, `Card.tsx:10`, `tableClasses.ts:6`, `skeletons.tsx:23`, `:67`, `:82` |
| Helper classes `.label-caps`, `.table-head-sticky`, `.status-dot.is-live` | `src/index.css:708`, `:713`, `:715` |
| Semantic token triplets, dark under `:root`, light under `html.light` | `src/index.css:13` to `:35`, `:177` |

### 1.3 What the `client_events` insert sites put in `meta` (whitelist input)

| type | Insert site | meta keys written |
|---|---|---|
| `plan_change`, `trial_grant`, `comp_grant` | `set-client-plan.js:184` | `grant_until`, `note` (free text), `notified`, `refresh_cadence` |
| `trial_expired` | `expire-plan-grants.js:208` | `was` (old plan_source), `ended` |
| `onboarded` | `_provision_client.js:558` | `source`, `slug`, `role`, `plan_provided`, `prompts_created`, `refresh_cadence`, `default_market_id`, `invite_channel`, optional `locations_created`, `locations`, `allow_over_cap`, `prompt_cap`, `prompts_requested` |
| `signup` | `provision-account.js:242` | `source`, `account_type`, `slug`, **`brand_website`**, **`email`**, `role`, `refresh_cadence` |
| `stripe_change`, `stripe_provision` | `stripe-webhook.js:255` (`recordPlanEvent`), callers `:611`, `:919`, `:1030`, `:1125` | `source`, `auditMeta()` fields (`:436`), `reason`, `previous_plan_source`, `previous_grant_until`, Stripe ids, `slug`, `name` |
| `mcp_fix_marked` | `mcp-server.js:842` | `grant_id` or `key_id`, `fix_id`, `note` (free text) |
| `invite_resent` | `resend-invite.js:491` | `source`, `user_id`, `via`, `channel`, `delivery`, optional `invite_link_id` |
| `location_change` | `client-locations.js:272`, `:346` | `action`, `by`, `limit_override`, `over_limit`, `limit`, `used_after`, `pairs`; or `action: 'set_primary'`, `from`, `to` |

`signup` carries an email address and a website in `meta`, and `note` fields are free text that can hold anything. **Therefore the function never forwards `meta`.** It builds each detail object from a per-type whitelist (section 3.4).

Two more address risks found while reading: a client created by the Stripe webhook is named after the buyer's email domain (`stripe-webhook.js:1081`, `:1089`), and a personal-brand signup names the client after the person (`provision-account.js:114`). Neither is an address, and both already show on admin pages, but the function scrubs any client name containing `@` (section 3.5).

---

## 2. The boundary decision

**Ruling: one new read-only Netlify function, `platform-activity.js`, with two actions: `feed` (cheap, cursor based, polled every 15 s) and `summary` (tiles plus per-client table, polled every 60 s). The browser never queries Supabase for this page.** Reason: the browser cannot read `auth.users` or other users' `user_profiles` (section 1.1), and the server is the only place that can enforce the no-email whitelist.

Sub-rulings:

1. **Polling, not Realtime.** No table is published and the owner rule is no migration. Polling sits behind a client-side `ActivitySource` interface (section 3.7) so a Realtime source can replace the polled one later without touching the page.
2. **Spend source: ONE bounded paged read of the month's `ai_results`, not one `sumCostEur` RPC per client.** The paged read (`client_id, llm, status, error_code, cost_eur, checked_at`) yields requests, spend, engines, error rate and last result in one pass: about 3 page requests today against about 32 RPCs (customer clients) for spend alone, each of which would still need a second read for the other columns. Ceiling: 20 pages of 1,000 = **20,000 rows**. Today the month holds 2,050 rows at day 14. When the ceiling is hit the response sets `truncated.ai_results_month = true` and the page says so (section 3.3); it never prints a partial number as if whole. **One** `sumCostEur(supabase, { since: monthStart, clientId: null })` call is the platform cross check.
3. **Spend rule = the budget gate's rule, not `sumApiCostByClient`'s.** The gate (`_auth.js:277` via `sum_cost_eur`) sums `cost_eur` with nulls as 0; `sumApiCostByClient` substitutes a flat estimate for nulls. "Above 80 percent of budget" must predict what the gate will do, so this page uses `cost_eur` with null as 0, and reports how many null rows it saw (`spend_check.null_cost_rows`). Today that count is 0, so both rules agree. `sumApiCostByClient` is not required by this function.
4. **Research clients** (`category === RESEARCH_CATEGORY`) are not customers. They are excluded from every tile except a separate research count in tile 2, shown in the feed with a `Research` marker but hidden by default, and listed in the table only behind a "Show research" toggle (off by default).
5. **Admins are excluded from user activity.** The one admin profile has a `client_id` (section 1.1), so filtering on `client_id is null` would count the admin as a customer. Filter on `role === 'viewer'`. Auth users without a profile (4 today, likely affiliates) are ignored.
6. **`admin_notifications`: include only `type = 'account_deleted'`, reading only `id, type, client_id, created_at`. Never `title`, `body` or `meta`.** Reason: every other notification type duplicates a `client_events` signal, and its free text can hold addresses. A deleted client's `client_events` rows cascade away with the client, so the notification is the only trace of a deletion.
7. **No caching** between invocations. At this volume the reads are cheaper than the cache-correctness questions.

---

## 3. Data contracts

### 3.1 Request envelope

```
POST /.netlify/functions/platform-activity
Authorization: Bearer <supabase access token>
Content-Type: application/json
```

```ts
type PlatformActivityRequest =
  | { action: 'summary' }
  | { action: 'feed'; since?: string; limit?: number }
```

Handler order, exactly:

1. `const auth = await requireAuth(event, { adminOnly: true })`; `if (auth.response) return auth.response`. This covers OPTIONS, origin, 401 and 403.
2. `event.httpMethod !== 'POST'` returns 405 `{ error: 'Method Not Allowed', code: 'method_not_allowed' }`.
3. Body must parse as JSON and be a plain object (not array, not null), else 400 `bad_request`.
4. `createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)` inside the handler, the same as `resend-invite.js`. Do not use `auth.supabase` (the test mock does not return one).
5. Dispatch on `action`; anything else is 400 `bad_request` with the sentence `Unknown action. Use "summary" or "feed".`

Feed parameter validation:

| Field | Rule | On violation |
|---|---|---|
| `since` | optional string; `Date.parse` must be finite | 400 `bad_request`, `since must be an ISO date.` |
| `since` value | clamped into `[now - FEED_MAX_LOOKBACK_MS, now]`; absent means `now - FEED_DEFAULT_LOOKBACK_MS` | clamped silently, and the response `window.since` shows the value used |
| `limit` | optional integer 1 to 100 (number, or digit string without leading zero); default 50 | 400 `bad_request`, `limit must be a whole number from 1 to 100.` |

Constants (exported for the test):

```js
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
```

### 3.2 Error shape

```ts
interface PlatformActivityError {
  error: string            // one sentence for an admin; never contains an address
  code: 'bad_request' | 'method_not_allowed' | 'read_failed'
}
```

401 and 403 come from `requireAuth` with body `{ error }` only. Any failed Supabase or GoTrue read returns 500 `read_failed` with `Could not read platform activity. Check the function logs and try again.`; the log line is `[platform-activity/<invId>] read_failed at <source>: <message>` where `<source>` is one of the source names in section 3.4 and the message has any `@`-bearing token replaced (section 3.5). The `sumCostEur` cross check is the one read whose failure does NOT fail the call: it sets `spend_check.rpc_total_eur = null` and adds a warning.

### 3.3 `summary` response

```ts
interface SummaryResponse {
  generated_at: string                    // ISO, server time at the start of the read
  windows: {
    day_start_utc: string                 // today 00:00:00.000Z
    month_start: string                   // monthStartIso()
    last_24h_start: string                // generated_at minus 24 h
    read_since: string                    // min(month_start, last_24h_start): the ai_results read floor
  }
  tiles: {
    active_users_24h: {
      viewers: number                     // distinct viewer users with last_sign_in_at >= last_24h_start, client not research
      clients: number                     // distinct customer clients among them
    }
    runs_today: {
      customer: number                    // collection_runs created since day_start_utc, client not research
      research: number
      manual: number                      // of customer runs, trigger 'manual'
      scheduled: number                   // of customer runs, trigger 'scheduled'
      engine_calls: number                // ai_results rows since day_start_utc, customer clients, ok + error
    }
    engine_health_24h: {
      calls: number                       // customer ai_results rows since last_24h_start
      ok: number
      errors: number
      error_rate: number | null           // errors / calls, 4 decimals; null when calls = 0
      by_llm: Array<{ llm: string; calls: number; errors: number }>   // sorted by errors desc, then llm asc
      level: 'ok' | 'warn' | 'bad'
      reason: 'rate' | 'engine_outage' | null
      outage_llms: string[]               // engines that met the outage rule
    }
    budget_watch: {
      customers_measured: number          // customer clients with a known budget
      over_80: number                     // budget_pct >= 80
      over_90: number                     // budget_pct >= 90
      over_100: number                    // budget_pct >= 100
    }
  }
  clients: ClientActivityRow[]            // every client, customers and research; sorted section 3.3.2
  spend_check: {
    paged_total_eur: number               // sum of cost_eur over month rows read, all clients, 4 decimals
    rpc_total_eur: number | null          // sumCostEur(since month_start, clientId null); null on failure
    delta_eur: number | null              // rpc_total_eur minus paged_total_eur, 4 decimals
    null_cost_rows: number                // month rows with cost_eur null, counted as 0
  }
  truncated: {
    ai_results_month: boolean             // the 20,000 row ceiling was hit
    auth_users: boolean                   // listUsers hit maxPages
    clients: boolean                      // CLIENTS_LIMIT rows returned
    profiles: boolean                     // PROFILES_LIMIT rows returned
    collection_runs: boolean              // RUNS_LIMIT rows returned
  }
  warnings: string[]                      // admin sentences, deduplicated
}

interface ClientActivityRow {
  client_id: number
  name: string                            // scrubbed, section 3.5
  plan: string                            // raw clients.plan; the page maps it with PLAN_LABELS
  plan_known: boolean                     // PLAN_LIVE_ENGINES has the key
  is_research: boolean
  requests_month: number                  // ai_results rows since month_start, ok + error
  errors_month: number
  spent_eur: number                       // sum(cost_eur), null as 0, 4 decimals
  budget_eur: number                      // section 3.3.1
  budget_pct: number | null               // spent / budget * 100, 1 decimal; null when budget_eur <= 0
  budget_level: 'ok' | 'warn' | 'bad'     // >= 90 bad, >= 80 warn, else ok
  engines_used: string[]                  // distinct llm with status 'ok' since month_start, sorted
  engines_entitled: string[]              // activeEnginesFor(plan, engines_enabled)
  viewers: number                         // viewer profiles of this client
  last_sign_in_at: string | null          // max last_sign_in_at over its viewers
  last_manual_run_at: string | null       // max created_at of its manual runs by one of its viewers, last 30 days
  last_active_at: string | null           // max of the two above
  last_active_source: 'sign_in' | 'manual_run' | null
  last_result_at: string | null           // max checked_at of its month rows (activity of the pipeline, not of the user)
}
```

#### 3.3.1 Rules

- Budget lookup mirrors the gate exactly: `const key = PLAN_LIVE_ENGINES[plan] ? plan : 'essentials'`; `budget_eur = PLAN_MONTHLY_API_BUDGET_EUR[key] ?? PLAN_MONTHLY_API_BUDGET_EUR.free`. Both constants are required from `_cost.js`; nothing is redefined.
- `engines_entitled = activeEnginesFor(client.plan, client.engines_enabled)`.
- `is_research = client.category === RESEARCH_CATEGORY`.
- A row of `ai_results` with `checked_at < month_start` (possible only in the first 24 h of a month) counts toward `engine_health_24h` and never toward any month figure.
- `engine_health_24h.level`: `bad` with `reason 'engine_outage'` when any llm with `calls >= OUTAGE_MIN_CALLS` has `errors / calls >= OUTAGE_RATE`; else `bad` with `reason 'rate'` when `calls >= HEALTH_MIN_CALLS` and `error_rate >= HEALTH_BAD_RATE`; else `warn` with `reason 'rate'` when `calls >= HEALTH_MIN_CALLS` and `error_rate >= HEALTH_WARN_RATE`; else `ok` with `reason null`. Below 20 calls the rate alone never turns the tile red, so one failed call on a quiet night does not read as an incident. The outage rule exists because the OpenRouter credit outage of 2026-10-06 was one engine at 100 percent.
- `last_manual_run_at` uses `collection_runs.created_by`, matched to a viewer profile of that client. Admin-triggered and scheduled runs are not user activity.
- When `truncated.ai_results_month` is true the function adds the warning `More than 20000 engine calls this month; per client figures cover only the first 20000 and are incomplete.` and the page shows it in a `Notice tone="warn"` above the tiles and prefixes tile 4 and every table spend cell with "at least".
- When `spend_check.delta_eur` is not null and its absolute value is above 1.00, the function adds the warning `Paged spend and the budget gate total differ by EUR <delta>.` A small positive delta is normal (rows written between the two reads); the paged read runs first, then the RPC.

#### 3.3.2 Sort of `clients`

Customers first, then research. Within each group: `budget_pct` desc (null last), then `requests_month` desc, then `name` asc.

#### 3.3.3 Summary queries (every one windowed or capped)

| # | Source name | Query | Bound |
|---|---|---|---|
| S1 | `clients` | `from('clients').select('id, name, plan, category, engines_enabled').order('id').limit(CLIENTS_LIMIT)` | row cap; the table is the denominator, so no time window applies |
| S2 | `user_profiles` | `from('user_profiles').select('id, role, client_id').limit(PROFILES_LIMIT)` | row cap |
| S3 | `auth_users` | `auth.admin.listUsers({ page, perPage: 1000 })`, pages 1 to 5, stop on a short page | 5 pages; keeps only `id` and `last_sign_in_at` in memory, discards the rest at once |
| S4 | `ai_results_month` | per page: `from('ai_results').select('id, client_id, llm, status, error_code, cost_eur, checked_at').gte('checked_at', read_since).lte('checked_at', generated_at).order('id').range(from, from + 999)` | time window plus 20 pages |
| S5 | `collection_runs` | `from('collection_runs').select('id, client_id, trigger, created_by, created_at').gte('created_at', now - RUNS_LOOKBACK_MS).lte('created_at', generated_at).order('created_at', { ascending: false }).limit(RUNS_LIMIT)` | 30 day window plus cap |
| S6 | `spend_rpc` | `sumCostEur(supabase, { since: month_start, clientId: null })` | single aggregate |

S1, S2, S3 and S5 run in parallel (`Promise.all`); S4 pages run sequentially; S6 runs after S4. Supabase round trips today: 3 + 1 + 3 + 1 + 1 = 9 (plus 2 inside `requireAuth`). Worst case at the ceilings: 1 + 1 + 5 + 20 + 1 + 1 = 29.

### 3.4 `feed` response

```ts
type FeedBadge =
  | 'LOGIN' | 'RUN_STARTED' | 'JOB_FAILED' | 'ENGINE_ERROR' | 'ACCOUNT_DELETED'
  | 'PLAN_CHANGE' | 'TRIAL_GRANT' | 'COMP_GRANT' | 'TRIAL_EXPIRED' | 'ONBOARDED'
  | 'SIGNUP' | 'STRIPE_CHANGE' | 'STRIPE_PROVISION' | 'MCP_FIX_MARKED'
  | 'INVITE_RESENT' | 'LOCATION_CHANGE'

type FeedTone = 'neutral' | 'info' | 'ok' | 'warn' | 'bad'

interface FeedRow {
  id: string                   // stable across polls, section 3.4.2
  at: string                   // ISO event time
  badge: FeedBadge
  tone: FeedTone               // fixed by badge, table 3.4.1
  client_id: number | null
  client_name: string | null   // scrubbed; null when the client no longer exists
  is_research: boolean
  actor_role: 'admin' | 'viewer' | 'system' | null   // client_events only: null actor -> 'system'; others null
  detail: FeedDetail
}

type FeedDetail =
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

interface FeedResponse {
  rows: FeedRow[]              // merged, sorted at desc then id desc, cut to limit
  cursor: string               // = window.until; the client's next since is cursor minus 60 s
  server_time: string
  window: { since: string; until: string }
  truncated: {
    client_events: boolean
    collection_runs: boolean
    collection_jobs: boolean
    engine_errors: boolean
    account_deleted: boolean
    logins: boolean            // listUsers hit maxPages
    merged: boolean            // more rows than limit after the merge
  }
  warnings: string[]
}
```

#### 3.4.1 Badge mapping (real sources only)

| Badge | Source and filter | Tone | Detail fields (whitelist) |
|---|---|---|---|
| `LOGIN` | `auth.users.last_sign_in_at` in `(since, until]`, user has a profile with `role = 'viewer'` | neutral | none |
| `RUN_STARTED` | `collection_runs.created_at` in window | info | `trigger`, `force`, `total_jobs` |
| `JOB_FAILED` | `collection_jobs` `status = 'failed'`, `finished_at` in window | bad | `attempts`, `engines`, `has_error_text = error != null && error !== ''` (the text itself is never read into the response) |
| `ENGINE_ERROR` | `ai_results` `status = 'error'`, `checked_at` in window | warn | `llm`, `error_code` |
| `ACCOUNT_DELETED` | `admin_notifications` `type = 'account_deleted'`, `created_at` in window; select `id, client_id, created_at` only | warn | none |
| `PLAN_CHANGE` | `client_events.type = 'plan_change'` | info | `from_plan`, `to_plan`, `meta.grant_until` |
| `TRIAL_GRANT` | `type = 'trial_grant'` | ok | as PLAN_CHANGE (`kind: 'plan'`) |
| `COMP_GRANT` | `type = 'comp_grant'` | ok | as PLAN_CHANGE (`kind: 'plan'`) |
| `TRIAL_EXPIRED` | `type = 'trial_expired'` | warn | `from_plan`, `to_plan`, `meta.was` |
| `ONBOARDED` | `type = 'onboarded'` | ok | `to_plan`, `meta.prompts_created`, `meta.locations_created`, `meta.invite_channel` |
| `SIGNUP` | `type = 'signup'` | ok | `to_plan`, `meta.account_type` (NOT `email`, NOT `brand_website`, NOT `slug`) |
| `STRIPE_CHANGE` | `type = 'stripe_change'` | info | `from_plan`, `to_plan`, `meta.reason` |
| `STRIPE_PROVISION` | `type = 'stripe_provision'` | ok | `to_plan` (kind `stripe`, `from_plan` null, `reason` null) |
| `MCP_FIX_MARKED` | `type = 'mcp_fix_marked'` | ok | `meta.fix_id` (string, cut to 64 chars), `via = 'oauth'` when `meta.grant_id` present, `'key'` when `meta.key_id` present, else null (NOT `note`) |
| `INVITE_RESENT` | `type = 'invite_resent'` | neutral | `meta.channel`, `meta.delivery` (NOT `user_id`, NOT `invite_link_id`) |
| `LOCATION_CHANGE` | `type = 'location_change'` | info | `meta.action` (only the three listed values, else null), `over_limit = meta.limit_override === true`, `count = Array.isArray(meta.pairs) ? meta.pairs.length : null` |

A `client_events` row whose `type` is not one of the 11 is skipped and counted in a warning (`<n> events of an unknown type were skipped.`); it is never rendered with a guessed badge. Every whitelisted string field passes the scrub in 3.5; every number field is `Number.isFinite` checked or null.

Tones map to existing primitives, no hex anywhere:

| FeedTone | `Badge` tone | Token classes it resolves to (`Badge.tsx:15`) |
|---|---|---|
| neutral | `neutral` | `bg-surface-3 text-ink-2 ring-line-2` |
| info | `accent` | `bg-accent-tint text-accent-ink` |
| ok | `pos` | `bg-pos-tint text-pos-ink` |
| warn | `warn` | `bg-warn-tint text-warn` |
| bad | `neg` | `bg-neg-tint text-neg` |

#### 3.4.2 Row ids and the cursor

| Source | `id` |
|---|---|
| client_events | `ev:<client_events.id>` |
| collection_runs | `run:<id>` |
| collection_jobs | `job:<id>` |
| ai_results | `err:<id>` |
| admin_notifications | `del:<id>` |
| LOGIN | `login:<first 12 hex of sha256(user id)>:<Date.parse(last_sign_in_at)>` |

The LOGIN id is opaque: the user id never leaves the function. Two sign-ins by one user produce two ids because the timestamp differs.

Cursor contract: `window.until` is the server time captured before the first query; every source query is `.gt(col, since).lte(col, until)`. The response `cursor` equals `until`. The client's next request sends `since = cursor minus 60 s` and drops any row whose `id` it has already seen. The 60 s overlap covers rows whose timestamp precedes `until` but whose transaction committed after the read. A source that returns exactly `FEED_SOURCE_LIMIT` rows sets its `truncated` flag; the rows older than the 50th in that interval are not delivered later (the cursor has moved on). The page shows `Some events in a burst were not listed.` when any flag is true. This is a monitoring feed, not an audit export; the tables remain the record.

#### 3.4.3 What LOGIN can and cannot say

Only the latest sign-in per user is knowable: GoTrue keeps one `last_sign_in_at`, and there is no login history table. Consequences, to be stated in a one-line hint under the feed header (`Sign ins show the latest per person.`):

- A user who signs in twice between polls appears once, at the later time.
- On first load (since = now minus 24 h) each viewer appears at most once.
- `last_sign_in_at` moves on a password, magic link or OAuth sign-in, not on a token refresh, so a viewer working in a long-lived session produces no LOGIN row. Tile 1 is therefore labelled "Signed in, last 24 h", not "active".

#### 3.4.4 Feed queries

| # | Source name | Query | Bound |
|---|---|---|---|
| F1 | `client_events` | `select('id, client_id, actor, type, from_plan, to_plan, meta, created_at').gt('created_at', since).lte('created_at', until).order('created_at', { ascending: false }).limit(50)` | window plus 50 |
| F2 | `collection_runs` | `select('id, client_id, trigger, force, total_jobs, created_at')`, same window on `created_at`, limit 50 | window plus 50 |
| F3 | `collection_jobs` | `select('id, client_id, attempts, engines, error, finished_at').eq('status', 'failed')`, window on `finished_at`, limit 50 | window plus 50 |
| F4 | `engine_errors` | `from('ai_results').select('id, client_id, llm, error_code, checked_at').eq('status', 'error')`, window on `checked_at`, limit 50 | window plus 50 |
| F5 | `account_deleted` | `from('admin_notifications').select('id, client_id, created_at').eq('type', 'account_deleted')`, window on `created_at`, limit 50 | window plus 50 |
| F6 | `clients` | as S1 but `select('id, name, category')` | cap 2000 |
| F7 | `user_profiles` | as S2 | cap 5000 |
| F8 | `auth_users` | as S3 | 5 pages |

F3 reads `error` only to compute `has_error_text`; the value is dropped before the row is built. All eight run in parallel. Supabase round trips: 8 today (plus 2 in `requireAuth`), at most 12.

### 3.5 Privacy rules (binding, tested)

1. No email address, no `brand_website`, no free-text `note`, no Stripe id, no auth user id and no job error text appears in any response body or any log line.
2. From GoTrue the function keeps only `id` and `last_sign_in_at` per user; the objects are not logged, not spread, not returned.
3. `scrub(s)`: returns null for a non-string; otherwise, if the string contains `@`, it returns null for detail fields, and for a client name returns `Client <id>`. Applied to every outgoing string field, client names included. Log lines pass error messages through a scrub that replaces any whitespace-delimited token containing `@` with `[redacted]`.
4. `meta` is never spread, serialised or returned. Detail objects are constructed field by field from table 3.4.1.

### 3.6 Loading, empty and error states (page)

| Zone | Loading | Empty | Error |
|---|---|---|---|
| Tiles | 4 x `SkeletonStat` | value `0`, sub line per tile (e.g. `No sign ins in the last 24 h`) | the whole summary area becomes one `Notice tone="neg"` with title `Could not load platform activity` and a Retry action; the feed keeps working |
| Feed | `SkeletonList rows={6}` | one muted line `No activity in the last 24 h.` | inline muted line `Feed paused: could not reach the server. Retrying.` above the existing rows; rows are kept |
| Table | `SkeletonTable rows={8} cols={5}` | `No clients.` | covered by the summary Notice |
| Auth | n/a | n/a | 401 or 403 from either action stops both pollers and renders the admin-required message |

The fetch is owned by the page through the source (feed) and a summary poller hook, both in `src/lib/platformActivity.ts`. No context provider; no other page reads this data.

### 3.7 Client-side source interface

```ts
// src/lib/platformActivity.ts (types mirror sections 3.3 and 3.4 exactly)

export type SourceStatus = 'live' | 'paused' | 'retrying' | 'stopped'

export interface FeedBatch {
  rows: FeedRow[]        // only rows not seen before, newest first
  initial: boolean       // true for the first batch after subscribe
  truncated: boolean     // any truncated flag in the response
}

export interface ActivitySource {
  /** Starts delivery on the first subscriber, stops on the last unsubscribe. */
  subscribe(onBatch: (b: FeedBatch) => void, onStatus?: (s: SourceStatus) => void): () => void
}

export interface PollingSourceOptions {
  fetchFeed: (since: string | null) => Promise<{ status: number; data: FeedResponse | null }>
  intervalMs?: number            // default FEED_POLL_MS
  overlapMs?: number             // default 60_000
  maxBackoffMs?: number          // default 120_000
  seenCap?: number               // default 1000 ids, oldest evicted first
  isHidden?: () => boolean       // default () => document.hidden
  onVisibilityChange?: (cb: () => void) => () => void   // default document listener; injectable for the node test
  setTimer?: typeof setTimeout   // injectable for the node test
  clearTimer?: typeof clearTimeout
}

export function createPollingActivitySource(opts: PollingSourceOptions): ActivitySource
export function createFixtureActivitySource(): ActivitySource    // in platformActivityFixture.ts

export const FEED_POLL_MS = 15_000
export const SUMMARY_POLL_MS = 60_000
export const FEED_RENDER_CAP = 200
```

Behaviour of the polling source:

- First fetch sends `since: null` (server default 24 h). Later fetches send `cursor minus overlapMs`.
- Next poll is scheduled `intervalMs` after the previous one settles (no overlap of in-flight requests).
- While `isHidden()` is true no request is made and status is `paused`. On becoming visible, it fetches at once if the last fetch is older than `intervalMs`.
- On a network error or a 5xx, status `retrying`, the delay doubles up to `maxBackoffMs`, and resets after a success.
- On 401 or 403, status `stopped`, no further polls.
- Deduplication by `id`; a batch with zero new rows is not emitted.

The summary poller (`useSummaryPoll(fetchSummary, { intervalMs: SUMMARY_POLL_MS })`) follows the same hidden, backoff and stop rules.

Future Realtime source: `createRealtimeActivitySource` would emit the same `FeedBatch` for `client_events`, `collection_runs`, `collection_jobs` and engine errors, and would still need the polled source for LOGIN (auth.users cannot be published) and for client names. See section 10.

---

## 4. State ownership map

| State | Owner | Readers | Invalidates |
|---|---|---|---|
| Feed rows (max 200) | `PlatformActivity.tsx` local state, fed by `ActivitySource` | the feed list | each batch prepends; beyond 200 the oldest drop |
| Seen ids, cursor, backoff | inside the polling source closure | nobody else | on unsubscribe (route leave) |
| Summary (tiles, table) | `useSummaryPoll` in the page | tiles, table | every 60 s while visible; replaced whole |
| "Include research" toggle (feed), "Show research" toggle (table) | page local state | feed filter, table | never persisted |
| Budget per plan, engines per plan | `_cost.js` (server) | function only | deploy |
| Plan labels, engine labels | `src/lib/planConfig.ts` `PLAN_LABELS`, `ENGINE_META` | page | deploy |

Values already derived twice elsewhere, recorded because this page adds a third reader:

1. **Month spend per client**: `sum_cost_eur` RPC (budget gate, `_auth.js:278`), `sumApiCostByClient` (`_revenue.js:612`, Revenue page cost line) and `Usage.tsx`'s load per its own comment. The first counts null cost as 0, the second as a flat estimate. This page uses the gate's rule (section 2, ruling 3). Equal today (0 null rows this month).
2. **Engines a client may use**: `planConfig.ts` `getActiveEngines` and `_cost.js` `activeEnginesFor` (the latter documents itself as the mirror, `_cost.js:464`). This page uses the server copy.
3. **Budget fallback for an unknown plan**: `_auth.js:246` (coerce to essentials) plus `:300` region (fallback to free). Section 3.3.1 copies that two-step rule in one line; if the gate ever changes, this line must follow. Named in the acceptance checklist.

---

## 5. File plan

| # | File | Action | Owner | Reason |
|---|---|---|---|---|
| 1 | `brandgeo-dashboard/netlify/functions/platform-activity.js` | create | bg-backend | the read-only `summary` and `feed` actions, sections 3.1 to 3.5 |
| 2 | `brandgeo-dashboard/netlify.toml` | modify | bg-backend | add `[functions."platform-activity"]` with `timeout = 26` |
| 3 | `brandgeo-dashboard/tests/platform_activity.test.js` | create | bg-backend | handler test, section 9 |
| 4 | `brandgeo-dashboard/src/lib/platformActivity.ts` | create | bg-app | response types, `ActivitySource`, polling source, summary poller hook, authed POST, detail line formatter |
| 5 | `brandgeo-dashboard/src/lib/platformActivityFixture.ts` | create | bg-app | demo fixture summary and `createFixtureActivitySource` (invented names only) |
| 6 | `brandgeo-dashboard/src/pages/PlatformActivity.tsx` | create | bg-app | the page; the only file that imports `motion/react` for this feature |
| 7 | `brandgeo-dashboard/src/App.tsx` | modify | bg-app | `const PlatformActivity = lazy(() => import('./pages/PlatformActivity'))` and the route |
| 8 | `brandgeo-dashboard/src/components/Layout.tsx` | modify | bg-app | add `Activity` to the lucide import and one admin-only nav entry |
| 9 | `brandgeo-dashboard/tests/platform_activity_source.test.js` | create | bg-app | node test of the polling source via `tests/helpers/ts_require.js` |

Not touched, by rule: `src/lib/planConfig.ts` (`PLAN_ORDER` and everything else), `netlify/functions/_plans.js`, `netlify/functions/_cost.js`, `netlify/functions/stripe-webhook.js`, `netlify/functions/_auth.js`, `src/components/ui/*`, `src/index.css`, `tailwind.config.js`, `db/`.

Why `timeout = 26` (row 2): the default 10 s is enough for today's summary (about 9 sequential-ish round trips), but the month read can grow to 20 sequential pages plus up to 5 listUsers pages; at 200 to 400 ms each that passes 10 s well before the 20,000 row ceiling, and a Netlify timeout surfaces as an opaque 502 that reads like an outage. 26 matches `revenue-report` and `resend-invite`, the other admin readers of the same shape.

### 5.1 Page structure (bg-app)

- Gate: `const { isAdmin } = useClient()`; `if (!isAdmin && !isDemoMode) return` the same restricted block as `Revenue.tsx:985` but with tokens (`text-ink-2`, link `text-accent-ink`). In demo mode the page uses `createFixtureActivitySource()` and the fixture summary and never calls the function. The sidebar entry is `isAdmin` only, so in demo mode the page is reached by URL `/platform-activity`; that is what a headless check loads.
- Header: `PageHeader title="Platform activity"` with a live indicator: `<span className="status-dot is-live text-pos" />` plus the status word (`Live`, `Paused`, `Retrying`, `Stopped`), and `Updated <relative time>` from `generated_at`.
- Zone 1: a 4 column grid (`grid-cols-2 lg:grid-cols-4`, gap 4) of `Stat`:
  1. `Signed in, last 24 h`: value `viewers`, sub `<clients> clients`.
  2. `AI runs today (UTC)`: value `customer`, sub `<manual> manual, <scheduled> scheduled, <engine_calls> engine calls`; when `research > 0` add `, <research> research runs`.
  3. `Engine success, 24 h`: value `100 minus error_rate as percent, 1 decimal` (or `n/a` via `emptyLabel` when calls = 0); `tone` is `alert` for level `bad`, `warn` for `warn`, else `neutral`; sub: for `engine_outage`, `<ENGINE_META label list> failing` wrapped in `text-neg`; else `<errors> errors of <calls> calls`, in `text-neg` when level is bad. The value number itself is not recoloured (Stat contract).
  4. `Clients over 80% of budget`: value `over_80`, `tone` `alert` when `over_90 > 0`, `warn` when `over_80 > 0`; sub `<over_90> over 90%, <customers_measured> measured`.
  All values use `tabular-nums` (Stat already renders `text-kpi`; add nothing that changes its props).
- Zone 2 (feed): `Card pad="none"` with a header row (`SectionHeader` or a `label-caps` line), the "Include research" `Chip` toggle, the hint line from 3.4.3, then a list `<ol className="font-mono text-meta divide-y divide-line max-h-[480px] overflow-y-auto">`. Each row: time `HH:MM:SS` in `text-ink-3 tabular-nums` (local time, full ISO in `title`), `Badge` with the tone map of 3.4.1 and the badge text, client name in `text-ink`, a `Research` neutral `Badge` when `is_research`, and the detail line (section 5.2) in `text-ink-2`, truncated with `title` holding the full line. Rows are wrapped in `<AnimatePresence initial={false}>`, each row a `motion.li` with `initial={{ opacity: 0, y: -10 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: MOTION_FAST, ease: 'easeOut' }}`, keyed by `id`. No `exit`, no `layout` prop. Reduced motion is already handled by `MotionConfig reducedMotion="user"` at `src/App.tsx`. Accessibility: the list has `aria-live="off"`; a visually hidden `role="status"` element announces `<n> new events` per batch.
- Zone 3 (table): `tableClasses` table inside `tableClasses.wrap`, `th scope="col"`. Columns: Client (name, plus plan label in `text-ink-2` below on phones), Plan (`PLAN_LABELS[plan]`, or the raw value with `(unknown)` when `plan_known` is false), Engine calls this month (`requests_month` right aligned, then a `Meter` with `value={budget_pct}`, `tone` `neg` for `budget_level` bad, `warn` for warn, else `accent`, `valueLabel` `<budget_pct>% of EUR <budget_eur>`, `ariaLabel` `Budget used`), Engines (`<engines_used.length> of <engines_entitled.length>` with labels from `ENGINE_META` in `title`), Last active (relative time from `last_active_at`, with `via sign in` or `via manual run` in `text-ink-3`; `Never` when null). The sticky header comes from `tableClasses.th` (`.table-head-sticky`); on phone widths the wrap scrolls sideways inside its own card (`overflow-x-auto`), on `lg` it is `overflow-clip` so the header sticks to the page scroller. "Show research (<n>)" `Chip` toggle above the table.

### 5.2 Detail line templates (bg-app, in `platformActivity.ts`, `copy: pending bg-copy`)

| kind | Line |
|---|---|
| login | `Viewer signed in` |
| run | `Manual run, <total_jobs> jobs` or `Scheduled run, <total_jobs> jobs`; append `, forced` when `force` |
| job_failed | `Job failed after <attempts> attempts` plus ` on <engine labels>` when engines is not empty |
| engine_error | `<engine label>: <code text>` where code text is `quota exceeded`, `API error`, `auth error`, `timeout`, or `unknown error` for null or any other value |
| account_deleted | `Client <client_id> deleted` |
| plan (PLAN_CHANGE) | `<from label> to <to label>`, append ` until <date>` when `grant_until` |
| plan (TRIAL_GRANT) | `Trial of <to label> until <date>` |
| plan (COMP_GRANT) | `Complimentary <to label> until <date>`, or `with no end date` |
| trial_expired | `<from label> ended, now <to label>` |
| onboarded | `Onboarded on <to label>, <prompts_created> prompts` plus `, <n> locations` when present |
| signup | `Signed up on <to label>` plus ` (<account_type>)` when present |
| stripe (STRIPE_CHANGE) | `<from label> to <to label> through Stripe` plus ` (<reason>)` |
| stripe (STRIPE_PROVISION) | `Created through Stripe on <to label>` |
| mcp_fix | `Fix <fix_id> marked done through MCP` plus ` (OAuth)` or ` (API key)` |
| invite | `Invite resent` plus ` by <channel>, <delivery>` when present |
| location | `Location added`, `Location archived` or `Primary location changed`; append `, over plan limit` when `over_limit` |

### 5.3 Owner's stale names mapped to tokens

| Owner wrote | Use instead | Why |
|---|---|---|
| `--dark-900`, `bg-dark-900` | `bg-canvas` (page) or `bg-surface` (cards) | `--dark-*` are legacy aliases slated for retirement (`src/index.css:38` to `:43`) |
| `--dark-800`, `bg-dark-800` | `bg-surface` | same triplet |
| `bg-dark-700` | `bg-surface-3` | same triplet |
| `border-white/5`, `border-white/10` | `border-line` (rules), `border-edge` (strong edges) | white alpha fails in light mode |
| `text-slate-100`, `text-white` | `text-ink` | theme-safe |
| `text-slate-400`, `text-slate-500` | `text-ink-2` (secondary), `text-ink-3` (meta) | theme-safe |
| `bg-white/5` (glass panel) | `bg-surface-2` | no glassmorphism |
| `shadow-2xl`, glow | `shadow-raised` or `shadow-card` | tokens |
| `text-emerald-400` (ok) | `text-pos-ink` | status token |
| `text-amber-400` (warn) | `text-warn` | status token |
| `text-red-400` (error) | `text-neg` | status token |
| `text-violet-400` (info) | `text-accent-ink` | status token |
| `font-mono` | `font-mono` (Tailwind default stack) | allowed; no new font |

Light mode holds because every class above reads a triplet redefined under `html.light` (`src/index.css:177`). No hex literal appears in the page or lib files.

### 5.4 Wiring

- `src/App.tsx`: after line 31, `const PlatformActivity = lazy(() => import('./pages/PlatformActivity'))`; after the `/prospects` route (line 313), `<Route path="/platform-activity" element={<PrivateRoute><OnboardGate><Layout><RouteView><PlatformActivity /></RouteView></Layout></OnboardGate></PrivateRoute>} />`.
- `src/components/Layout.tsx`: add `Activity` to the lucide import (line 7 or 8); in the Manage group, before the `/usage` entry (line 696), add `...(isAdmin ? [{ to: '/platform-activity', icon: Activity, label: 'Platform activity' }] : []),` with a `// copy: pending bg-copy` comment and a one-line comment that, like Prospects, it is sidebar only and not on the mobile bottom bar. Layout imports nothing new beyond the icon.

---

## 6. Performance budget

| Metric | Budget |
|---|---|
| Entry chunk (`index-*.js`) | at most +1.0 kB raw over the value printed by Vite on the same tree before the change (about 601.3 to 601.6 kB). Only the nav entry, one lucide icon and the lazy stub may land there. `motion` must not be imported by any file Layout imports; `MotionConfig` is already in the entry and does not count against this. |
| Page chunk (`PlatformActivity-*.js`) | at most 30 kB raw, excluding shared chunks (motion, ui primitives). No recharts import. |
| Requests on route load | 2 function POSTs in parallel (`summary`, `feed`) |
| Steady state while visible | feed 4 per minute, summary 1 per minute; 0 while the tab is hidden |
| Function invocations | one admin tab visible for 8 hours: 2,400 per day; hidden: 0 |
| Supabase round trips per call | feed: 8 (+2 auth), max 12; summary: 9 today (+2 auth), max 29 |
| Server time | feed p50 under 800 ms; summary p50 under 2 s today; hard ceiling 26 s |
| Time to meaningful paint on `/platform-activity` | skeletons on first frame; tiles, feed and table populated within 2.5 s on a warm function |
| Feed DOM | at most 200 rows rendered |
| Row ceilings | ai_results month 20,000; feed 50 per source; clients 2,000; profiles 5,000; runs 2,000; auth users 5,000 |

No new dependency. `motion` (already in `package.json`, already used by `AIVisibility.tsx:3` and `Collapse.tsx:21`) and `lucide-react` cover the page.

---

## 7. Migration sequence

There is no schema change, so there is no window of inconsistency.

1. **bg-backend builds rows 1 to 3** (function, toml entry, test). Independently shippable: the function has no caller yet and is admin gated. Revertible by deleting the two files and the toml block.
2. **bg-app builds rows 4 to 9** in parallel with step 1 (disjoint scopes). Independently testable in demo mode against the fixture. If it shipped alone, the live page would show the summary error Notice (404 from the function), which is visible and harmless; it should not ship alone.
3. **bg-verify reviews** the combined diff (section 11 checklist). Recommended pre-build pass on sections 3 and 3.5 too, because the function holds the service key and reads `auth.users`; it changes no auth, RLS or billing behaviour.
4. **One commit set by pathspec, one push** on Constantin's go with `$env:BATCH_PUSH=1`, so one Netlify build. Read back from outside: `platform-activity` answers 401 to an unauthenticated POST; the live entry chunk carries the string `Platform activity`; a lazy chunk carries `Sign ins show the latest per person.`

## 8. Rollback

| Step | Undo |
|---|---|
| 1 | `git revert` the backend commit, or delete `platform-activity.js`, `tests/platform_activity.test.js` and the toml block; push with `BATCH_PUSH=1`. No data written, nothing to clean. |
| 2 | `git revert` the frontend commit; the route and sidebar entry disappear. |
| 4 | Revert both commits in one push. The page holds no persisted state (no localStorage keys), so nothing lingers in browsers. |

---

## 9. Node tests

### 9.1 `tests/platform_activity.test.js` (bg-backend)

Setup, following `tests/resend_invite.test.js`:

- `const mock = installAuthMock({ tokens: { 'admin-jwt': { role: 'admin', ... }, 'viewer-jwt': { role: 'viewer', ..., client_id: 10 } } })`; then `mock.sumCostEur = async (sb, { since, clientId }) => { const { data, error } = await sb.rpc('sum_cost_eur', { p_since: since, p_client_id: clientId ?? null }); return error ? { ok: false, reason: 'query_error', error: error.message } : { ok: true, sum: Number(data) } }` and `mock.monthStartIso = () => MONTH_START` BEFORE the handler is required.
- `@supabase/supabase-js` replaced in `require.cache` so `createClient()` returns `createFakeSupabase({ sumCostEur: true, pagedListUsers: true, ... })`.
- A fake clock via `tests/helpers/fake_clock.js`, fixed at a mid-month instant, plus one case on the first day of a month at 06:00Z.
- Fixtures: invented company names; auth users WITH `email: 'person@example.com'` style addresses; a `signup` event whose `meta` carries `email` and `brand_website`; an `mcp_fix_marked` and a `plan_change` with a `note` holding an address; a job with `error` text holding an address; a client named `someone@example.com`; one research client; one admin profile with a `client_id`; one auth user with no profile.
- A query spy: wrap the fake's `from()` to record, per builder, the table, the filters applied and whether `limit` or `range` was called.

Assertions:

1. No token: 401. Viewer token: 403. Foreign origin: 403. GET with admin token: 405 `method_not_allowed`. Body `[]`, `"x"`, invalid JSON: 400 `bad_request`. Unknown action: 400.
2. `summary` returns every key of `SummaryResponse` with the documented types; `feed` returns every key of `FeedResponse`.
3. **No address anywhere**: for both actions, `JSON.stringify(body)` contains no `@`, no fixture domain, no `brand_website` value, no `note` text, no job error text, no auth user id. Captured `console.log`, `console.warn` and `console.error` output during every case contains no `@`. The client named with an address renders as `Client <id>`.
4. **Every query is bounded**: for each recorded `ai_results`, `client_events`, `collection_runs`, `collection_jobs` and `admin_notifications` builder, there is a lower time bound (`gt` or `gte` on its time column) AND an upper bound (`lte`) AND (`limit` or `range`). `clients` and `user_profiles` builders call `limit`. No builder calls `insert`, `update`, `upsert` or `delete`; the only `rpc` name is `sum_cost_eur`.
5. **Badge mapping**: one fixture row per source and per each of the 11 `client_events` types produces exactly the badge and tone of table 3.4.1 and exactly the detail keys listed (assert `Object.keys(detail)` equals the expected set). An event with an unknown type is skipped and yields the warning.
6. **LOGIN**: a viewer whose `last_sign_in_at` is inside the window yields one LOGIN row whose id matches `^login:[0-9a-f]{12}:\d+$` and does not contain the user id; an admin's sign-in and a profile-less user's sign-in yield none.
7. **Cursor**: `cursor === window.until`; rows exactly at `since` are excluded and rows at `until` included; a second call with `since = cursor minus 60 s` returns the overlap rows with identical ids; `since` older than 7 days is clamped (`window.since` equals now minus 7 days); a non-date `since` and `limit` of `0`, `101`, `1.5`, `"01"`, `true` are 400.
8. **Truncation**: with 51 failed jobs in the window, `truncated.collection_jobs` is true and 50 job rows arrive; with `limit: 10` and 30 rows overall, `truncated.merged` is true and 10 rows arrive newest first. With `AI_RESULTS_MAX_PAGES` shrunk to 1 (exported constant) and 1,500 month rows, `truncated.ai_results_month` is true and the warning text is present; with 999 rows it is false.
9. **Spend and budget**: per-client `spent_eur` equals the fixture sum with null cost counted as 0 and `null_cost_rows` counts them; `budget_eur` uses `PLAN_MONTHLY_API_BUDGET_EUR` required from `_cost.js` (the test reads the same module, no literal); an unknown plan gets the essentials budget; `budget_level` is `warn` at 80.0 and `bad` at 90.0; `spend_check.rpc_total_eur` equals the fake RPC; an RPC error leaves the call 200 with `rpc_total_eur: null` and a warning.
10. **Research and roles**: research clients are absent from every tile count except `runs_today.research`, present in `clients` with `is_research: true`, sorted after customers; the admin's sign-in does not count in `active_users_24h`.
11. **Health levels**: fixtures for `ok`, `warn` (rate 0.03 at 20 calls), `bad` by rate (0.10 at 20 calls), `ok` at 19 calls with 10 errors but no single engine at 5 calls, and `bad` by `engine_outage` (one engine 5 of 5 errors).
12. **Month boundary**: on the first day at 06:00Z, a row from the previous month's last evening counts in `engine_health_24h.calls` and not in any `requests_month`.
13. A failing `client_events` read returns 500 `read_failed` with the fixed sentence.

### 9.2 `tests/platform_activity_source.test.js` (bg-app)

Loads `src/lib/platformActivity.ts` through `tests/helpers/ts_require.js` with injected `setTimer`, `clearTimer`, `isHidden`, `onVisibilityChange` and `fetchFeed`. Asserts: first fetch sends `since: null`; the next sends `cursor minus 60 s`; a repeated id is not re-emitted and an empty batch is not emitted; no fetch while hidden and an immediate fetch on becoming visible after the interval; backoff doubles to the 120 s cap and resets after success; 401 sets status `stopped` and schedules nothing; unsubscribe clears the timer; the seen set evicts beyond `seenCap`. Also asserts the detail line formatter returns no em or en dash for every kind.

---

## 10. Owner ruling, not a migration

Realtime can replace the polled feed for four of its sources later. It needs a statement the owner runs by choice in the SQL Editor. It is NOT part of this work and must not be written as a file in `db/`:

```sql
alter publication supabase_realtime add table public.client_events, public.collection_runs, public.collection_jobs;
```

Consequences to weigh before running it:

1. Realtime `postgres_changes` delivers a row only to subscribers whose JWT passes the table's SELECT policies. The admin passes today: `client_events_select` is `is_admin()`, and `collection_runs_select` and `collection_jobs_select` allow `my_role() = 'admin'`. No new policy is needed for the admin.
2. **Viewers could subscribe too.** The collection policies also allow `client_id = my_client_id()`, so a viewer's browser could subscribe to its own runs and jobs. That matches what it can already SELECT, so it widens nothing, but it adds load per viewer if any page ever subscribes.
3. **The privacy whitelist moves to the browser.** Realtime sends the raw row, so `client_events.meta` would reach the admin's browser with `email`, `brand_website` and `note` intact. The admin can already SELECT those today, but the whitelist in section 3.5 would no longer be enforced server side. If that matters, the alternative is a trigger that broadcasts a scrubbed payload, which is a migration and a separate design.
4. `ai_results` is deliberately left out: publishing it broadcasts every engine call (about 300 a day today, every row evaluated against two SELECT policies per subscriber), for a feed that shows only the error rows.
5. LOGIN cannot come from Realtime (`auth.users` is not published to the browser), so the polled source stays for sign-ins and client names even after the switch.
6. Undo: `alter publication supabase_realtime drop table public.client_events, public.collection_runs, public.collection_jobs;`

---

## 11. Handoff packets

### 11.1 bg-backend (Opus, because the function holds the service key and reads `auth.users`)

- goal: build `platform-activity.js` exactly per sections 3.1 to 3.5, the toml entry per section 5 row 2, and the test per 9.1.
- scope_write: `brandgeo-dashboard/netlify/functions/platform-activity.js`, `brandgeo-dashboard/netlify.toml`, `brandgeo-dashboard/tests/platform_activity.test.js`
- scope_read: this spec; `_auth.js`, `_cost.js`, `revenue-report.js`, `resend-invite.js`, the eight insert sites in section 1.3, `tests/helpers/*`, `tests/resend_invite.test.js`, `tests/ts_require_bundler.test.js`
- must not: write, rpc anything except `sum_cost_eur`, require any `.ts` file, redefine a plan constant, touch `_cost.js`, `_plans.js`, `_auth.js`, `stripe-webhook.js`, `planConfig.ts`, run git.
- done when: `node tests/platform_activity.test.js` passes, `node tests/ts_require_bundler.test.js` passes, `node --check` on the function passes, no em or en dash in the three files (scan with `rg` and a positive control).

### 11.2 bg-app (Sonnet)

- goal: build rows 4 to 9 per sections 3.6, 3.7, 5.1 to 5.4 and 9.2, against the response types in 3.3 and 3.4 verbatim.
- scope_write: `brandgeo-dashboard/src/lib/platformActivity.ts`, `brandgeo-dashboard/src/lib/platformActivityFixture.ts`, `brandgeo-dashboard/src/pages/PlatformActivity.tsx`, `brandgeo-dashboard/src/App.tsx`, `brandgeo-dashboard/src/components/Layout.tsx`, `brandgeo-dashboard/tests/platform_activity_source.test.js`
- scope_read: this spec; `src/components/ui/*`, `src/lib/motion.ts`, `src/lib/planConfig.ts` (read only), `src/pages/Revenue.tsx`, `src/pages/AffiliatesAdmin.tsx`, `src/index.css`, `tailwind.config.js`
- must not: change any `src/components/ui/*` props, import `motion` outside `PlatformActivity.tsx`, add a dependency, use a hex literal or a legacy `slate-*`, `dark-*` or `white/*` class, touch `netlify/`, run git.
- done when: `tsc` exit 0, `npm run build` exit 0 with the entry chunk within +1.0 kB and the page chunk within 30 kB, `node tests/platform_activity_source.test.js` and `node tests/tokens_sync.test.js` pass, the page renders in demo mode at `/platform-activity` at 1440 and 390 wide in both themes with no sideways page scroll, new strings carry `copy: pending bg-copy`.

### 11.3 Disjointness proof

Backend set B = {`netlify/functions/platform-activity.js`, `netlify.toml`, `tests/platform_activity.test.js`}. App set A = {`src/lib/platformActivity.ts`, `src/lib/platformActivityFixture.ts`, `src/pages/PlatformActivity.tsx`, `src/App.tsx`, `src/components/Layout.tsx`, `tests/platform_activity_source.test.js`}. B lies under `netlify/`, the package root file `netlify.toml`, and one `tests/` file; A lies under `src/` and one differently named `tests/` file. The only shared directory is `tests/`, and the two file names differ, so A and B share no file. Neither builder touches `tests/helpers/`. Both can run concurrently; git stays serialized and is the orchestrator's.

---

## 12. Open questions, with the default taken

| # | Question | Default in this spec |
|---|---|---|
| Q1 | Should "active users" include the admin's own sign-ins? | No; viewers only (2.5). |
| Q2 | Is "today" UTC or Canary Islands local time? | UTC midnight, labelled `(UTC)`. Same as UTC in winter, one hour off in summer. |
| Q3 | Red threshold for engine errors | 10 percent at 20 or more calls in 24 h, or any engine failing half of 5 or more calls; amber at 3 percent. One constant each. |
| Q4 | Capacity bar: spend against budget, or requests against a request cap? | Spend against `PLAN_MONTHLY_API_BUDGET_EUR`, because that is the limit the gate enforces; requests are printed as the number. |
| Q5 | Research clients in the feed | Hidden by default, one toggle. |
| Q6 | Include `admin_notifications`? | Only `account_deleted`, ids and time only. |
| Q7 | Show the 4 auth users without a profile anywhere? | No. |
| Q8 | Feed lookback on first load | 24 h, server clamps any `since` to 7 days. |
| Q9 | Should the page stop polling after long inactivity on a visible tab? | No; hidden tabs already cost nothing. Revisit if invocation counts matter. |
| Q10 | Engine error rows: one row per failed call or grouped? | One per call, capped at 50 per poll with a truncation line. |
| Q11 | Indexes on `collection_runs.created_at` and `collection_jobs.finished_at` | Not added (no migration); seq scans are cheap at today's size. File separately if either table passes about 50,000 rows. |

## 13. Acceptance checklist (reviewer)

- [ ] `platform-activity.js` calls `requireAuth(event, { adminOnly: true })` before anything else and creates its own service client.
- [ ] The function contains no `insert`, `update`, `upsert`, `delete`, and no `rpc` other than `sum_cost_eur`.
- [ ] Every `ai_results`, `client_events`, `collection_runs`, `collection_jobs` and `admin_notifications` query has a lower and an upper time bound and a `limit` or `range`.
- [ ] The month read stops at 20 pages and sets `truncated.ai_results_month`; the page shows the warning and "at least".
- [ ] `meta` is never spread or returned; detail keys per badge equal table 3.4.1.
- [ ] No `@`, email, website, note, Stripe id, auth user id or job error text in any response or log (test 9.1.3 passes).
- [ ] Budget lookup is the gate's two-step rule using `_cost.js` constants; no plan constant is redefined.
- [ ] Research clients excluded from tiles 1, 3, 4 and the customer part of tile 2.
- [ ] `requires` contain no `.ts` path; `tests/ts_require_bundler.test.js` passes.
- [ ] `netlify.toml` has `timeout = 26` for `platform-activity`.
- [ ] Feed polls every 15 s, summary every 60 s, neither while hidden, both stop on 401 or 403, backoff caps at 120 s.
- [ ] `motion/react` is imported only in `PlatformActivity.tsx`; entry chunk grew at most 1.0 kB; page chunk at most 30 kB.
- [ ] Only semantic tokens; no hex, no `slate-*`, `dark-*`, `white/*`; light mode checked by screenshot.
- [ ] `src/components/ui/*` unchanged.
- [ ] Sidebar entry visible to admin only; route wrapped like `/prospects`; demo mode renders the fixture at `/platform-activity`.
- [ ] New strings marked `copy: pending bg-copy`; no em or en dash in any changed file (scan with a positive control).
- [ ] Live read after the push: 401 unauthenticated, entry chunk carries `Platform activity`.
