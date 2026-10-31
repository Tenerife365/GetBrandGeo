# Observability: error tracking, uptime and alerting

Status: SPEC, binding on bg-backend, bg-app and bg-verify for packet 030.
Author: bg-architect, 2026-10-28. Read-only survey; nothing built.
Revision 2, 2026-10-28: applies bg-verify's pre-build review
(`docs/qa/observability-030-spec-review-2026-10-28.md`, FAIL, F1 to F16).
Every change is listed in section 16, "Review response".

```
INTENT: where do failures become visible, who owns each signal, and what
        does each builder add  |  SCOPE: docs/arch/ and docs/ops/ (write),
        brandgeo-dashboard/, brandgeo/web/, db/ (read)  |  MODEL: opus  |
        STOP AFTER: /build
```

## 0. Provenance: one design, not a panel

Packet 030 asked for three candidate designs scored by three judges. The
orchestrator replaced the panel with one fused design on 2026-10-28, after
Constantin ruled every open question with its default: Sentry free tier,
errors only, on the SPA and the functions; UptimeRobot free; alerts to
`ADMIN_ALERT_EMAIL` as set today; no phone push. With the vendor questions
ruled, three designers would have argued about settled questions. The three
lenses are kept as roles inside one design:

| Lens | Role here |
|---|---|
| 2, standard stack | Backbone: Sentry for the SPA and the functions, UptimeRobot outside. |
| 1, zero new vendors | Fills what Sentry cannot see: a `pg_cron` watchdog that emails through Resend via `pg_net`, and `health.js`. |
| 3, signal over coverage | The proof. Section 4 maps six real failures to the piece that catches each. Anything that catches none is cut (section 5). |

The "judge scores" item in the packet's Done means does not apply. This
section is the record of why.

## 1. Current state, verified 2026-10-28

**Error tracking: none.** `brandgeo-dashboard/package.json:11-25` has no
`@sentry/*` or equivalent. `src/main.tsx` mounts `<App/>` with nothing
around it. There are 65 files under `netlify/functions/` with
`exports.handler`, and 167 `console.error` calls between them. Those logs
are visible only in the Netlify UI.

**Insert failures.** These are the shapes failure 5 took and still takes:
- `collect-prompt.js:151-154` logs `[Insert] FAILED` and sets
  `insertFailed`.
- `collect-prompt.js:174-178` now answers
  `{ done: false, reason: 'insert_error' }`.
- `collect-claude.js:80` and `collect-chatgpt.js:88` answer HTTP 200 with
  `done: false, reason: 'insert_error'`.
- `collection-worker-background.js:93-95` marks a job `failed` and logs.

Nothing outside the log records any of these.

**Health endpoint: none.** No function answers "is the app alive".

**Alerting today: event email only.** `_admin_notify.js:22` sets
`ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'support@getbrandgeo.com'`.
Mail goes through Resend:
- endpoint at `_email.js:13`
- sender `BrandGEO <noreply@mail.getbrandgeo.com>` at `_email.js:14`
- the key is read at `_email.js:213`; a missing key returns
  `{ ok: false, skipped: true }` and never throws (`_email.js:215`)

The callers of `recordAdminEvent(` are:
- `stripe-webhook.js:630, 662, 697, 777, 824, 934, 1014, 1044`
- `expire-plan-grants.js:144, 234`
- `delete-client.js:110`
- `provision-account.js:266`
- `support-request.js:257`

Packet 030 also lists "budget blocks" as an existing alert. That grep finds
no `recordAdminEvent` call for a budget event, so the runbook does not list
one.

**Nothing fires when a cron job fails or stops.**

**Scheduling, measured 2026-10-28 from `cron.job`:**

| jobid | name | schedule | kind |
|---|---|---|---|
| 1 | `purge-old-ai-results` | `0 3 * * *` | SQL |
| 4 | `purge-old-prospect-audits` | `5 4 * * *` | SQL |
| 5 | `ping-sitemap` | `10 5 * * *` | HTTP |
| 6 | `expire-plan-grants` | `10 6 * * *` | HTTP |
| 7 | `schedule-collections` | `10 * * * *` | HTTP |
| 8 | `affiliate-retention` | `35 4 * * *` | SQL |
| 9 | `affiliate-mature` | `40 4 * * *` | SQL |

That is seven active jobs, not the eight the packet assumed.
`poll-inbound-replies` is not scheduled. The HTTP jobs call Netlify with
`X-Cron-Key` from Vault secret `cron_secret`
(`db/supabase-scheduled-jobs-migration.sql`; `_cron_auth.js:54-61`).
`cron_secret` is the only Vault secret today (`vault.secrets`, read
2026-10-28).

**`job_runs`.** Each HTTP job writes one row per run:
- `schedule-collections.js:60`
- `ping-sitemap.js:50`
- `expire-plan-grants.js:104`
- `poll-inbound-replies.js:87`

SQL-only jobs write no row; their only record is `cron.job_run_details`.
Measured totals:

| job | runs | `ok = false` |
|---|---|---|
| `schedule-collections` | 2,186 | 29 |
| `ping-sitemap` | 91 | 14 |
| `expire-plan-grants` | 91 | 3 |
| `poll-inbound-replies` | 1 | 1 |

`ping-sitemap` writes `ok = true` even when nothing was submitted. The real
signal is `detail.attempted` against `detail.indexnowOk`; on 9 runs those
keys are present, on the older 77 only `pinged` is.

**Failures that are in the data and that nobody saw:**
- `schedule-collections` failed 27 times between 2026-09-11 and 2026-09-14
  ("Gateway Timeout"), with runs of up to 11 consecutive hours.
- `ping-sitemap` failed six times between 2026-09-19 and 2026-10-04 at stage
  `sitemap_fetch`.

**Engine outages in `ai_results`, longer than recorded:**
- ChatGPT returned 0 ok rows with `quota_exceeded` from 2026-08-28 to
  2026-09-21.
- Perplexity and Grok had a partial failure on 2026-09-11, then returned 0
  ok rows from 2026-09-18 to 2026-10-25. They recovered on 2026-10-27.
- Claude, live as this is written: 8 rows in the last 72 hours, 3 ok and 5
  `api_error`. The last run, 2026-10-27 18:10Z, returned 0 ok.

Error codes over the last 120 days: `quota_exceeded` 1,375, `timeout` 21,
`empty_response` 11, `api_error` 5.

**Content Security Policy.**
- Dashboard: `netlify.toml:54`; `connect-src` has no ingest host.
- Marketing: the policy is a response header in `brandgeo/web/.htaccess`.

**Environment ceiling.** Netlify functions share a roughly 4 KB environment
ceiling; the Google key was dropped for it (CLAUDE.md, decision
2026-07-28). The current total is not readable from this seat.

**Bundle.** Production size is unknown. The local `dist/` from 2026-10-22
has a 1,671,775 byte raw main chunk, but that is not production. bg-app
measures the live bundle before and after (section 9).

**Rate-limit primitive that already exists.**
`public.affiliate_rate_check(p_key, p_limit, p_window_seconds)` is defined
in `db/supabase-affiliate-migration-2026-09-12.sql:562`. It is executable by
`service_role` only (`:574-575`). Its rows are purged daily by `cron.job` 8.
The daily IP hash pattern is in `affiliate-redirect.js:31-36` (pepper
`IP_HASH_PEPPER`).

**CI: none.** There is no `.github/` directory. The `tests/` directory holds
plain Node test files. CLAUDE.md records `tests/package_provisioning.test.js`
as red at HEAD since 2026-09-03.

## 2. The boundary decision

**Ruling.** There are four signal paths, each with a single owner and none
sharing a channel:

| Path | Lives in | Watches | Alerts through |
|---|---|---|---|
| A. SPA errors | `src/lib/observability.ts`, lazy `@sentry/browser` | uncaught JS errors, and 5xx answers from `/.netlify/functions/*` | Sentry "new issue" email |
| B. Function errors | `netlify/functions/_observability.js`, plain fetch to the Sentry envelope endpoint | the insert failure sites, worker job failures, near-timeout | Sentry "new issue" email |
| C. Data watchdog | `ops` schema in Postgres, `pg_cron` job `obs-watchdog` at `50 * * * *` | job failure, job silence, unscheduled or unwatched jobs, engine degradation, failed collection jobs | Resend via `pg_net`, one digest per run, each alert key at most once a day |
| D. Outside view | UptimeRobot hitting `health.js` and getbrandgeo.com `/` | host down, Supabase unreachable, no scheduled Netlify job writing for 3 hours (`pg_net` or Netlify), watchdog stale (`pg_cron`) or unable to send (Resend) | UptimeRobot email |

Path E, in scope since Q1 was ruled yes on 2026-10-28: a GitHub Actions workflow that
runs the test suite and checks that `health.js` reports the commit that was
pushed. It alerts through Resend.

**Reasoning, one line each:**
- **A** reads every function call from the browser at one choke point
  (fetch). The SPA calls functions from 22 files, 7 of them through a
  generic `fetch(\`/.netlify/functions/${fn}\`)`, so a per-call edit is not
  viable.
- **B** uses no Sentry SDK. `@sentry/node` brings OpenTelemetry and would add
  cold-start cost to every function that imports it. An envelope POST is one
  fetch.
- **C** has to live where the data is. It is the only place that can see a
  job that wrote nothing.
- **D** is what notices C stopping. The watchdog writes a heartbeat row, and
  `health.js` answers 503 when that row is stale or failed.

**What moves.** Nothing moves.

**What is new.**
- One shared function module (`_observability.js`)
- One function (`health.js`)
- One SPA module (`observability.ts`)
- One schema (`ops`)
- One cron job
- Two Vault secrets
- Two Netlify env vars
- One dependency (`@sentry/browser`)
- One workflow (Q1, ruled yes)

**What stays.** `_admin_notify.js` and the existing event emails are
unchanged.

## 3. Components and data contracts

The contracts are types and schemas. Bodies are the builders'.

### 3.1 `_observability.js` (bg-backend)

CommonJS, no dependencies, Node 22 global `fetch`.

```ts
type Primitive = string | number | boolean | null;
type ObsContext = {
  fn: string;                              // function name, e.g. 'collect-claude'
  tags?: Record<string, Primitive>;        // only ids, engine names, codes
  extra?: Record<string, Primitive>;       // scrubbed, see section 7
};
type NetlifyHandler = (event: unknown, context?: { getRemainingTimeInMillis?: () => number }) => Promise<unknown>;

// Wraps a handler once. Creates the per-invocation state (rule 3) and runs
// the handler inside it. On throw: capture, await send (bounded by rule 2),
// rethrow, so Netlify still answers 5xx exactly as today. If context exposes
// getRemainingTimeInMillis, arms a timer at (remaining - 1500 ms) that
// captures 'near_timeout' once; the timer is cleared on completion.
// The rethrow applies to the collectors and the worker. health.js never
// lets an exception reach the wrapper (section 3.3).
withObservability(fn: string, handler: NetlifyHandler): NetlifyHandler;

captureException(err: unknown, ctx: ObsContext): Promise<void>;     // never throws
captureMessage(message: string, level: 'warning' | 'error', ctx: ObsContext): Promise<void>;
scrubEvent(e: SentryEvent): SentryEvent;                             // pure, exported for tests
parseDsn(dsn: string | undefined): { origin: string; projectId: string; publicKey: string } | null;
buildInfo(): { commit: string | null; built_at: string | null };     // see rule 7

// Per-invocation state, created by withObservability, never at module scope:
type InvocationBudget = {
  events_sent: number;          // 0 to 5
  send_ms_spent: number;        // 0 to 2000, summed over every send in this invocation
  remaining?: () => number;     // context.getRemainingTimeInMillis when present
};
```

Wire format sent: a Sentry envelope, `POST {origin}/api/{projectId}/envelope/`
with header
`X-Sentry-Auth: Sentry sentry_version=7, sentry_key={publicKey}, sentry_client=brandgeo-obs/1`.
The body is three newline-separated JSON lines (envelope header, item
header, event).

```ts
type SentryEvent = {
  event_id: string;            // 32 hex
  timestamp: number;           // seconds
  platform: 'node';
  level: 'error' | 'warning';
  release: string | null;      // buildInfo().commit
  environment: 'production';
  server_name?: never;         // never sent
  tags: { fn: string } & Record<string, Primitive>;
  exception?: { values: Array<{ type: string; value: string; stacktrace?: { frames: Array<{ filename: string; function?: string; lineno?: number }> } }> };
  message?: string;
  extra?: Record<string, Primitive>;
  // NEVER present: user, request, contexts.device, breadcrumbs
};
```

Rules that bind the body:
1. If `SENTRY_DSN` is absent or unparseable, every export is a no-op with no
   network call.
2. **Send deadline.** Every send is awaited before the handler returns,
   because the runtime freezes after return. Its `AbortController` deadline
   is `min(2000, remaining() - 500, 2000 - send_ms_spent)` ms, where
   `remaining()` is `context.getRemainingTimeInMillis()`. When the context
   has no such method, `remaining() - 500` is taken as 1,000.
   - A send is skipped, with one `console.warn`, when that deadline is
     below 300 ms. This covers a collector whose engine answered at 25 s:
     the insert error is logged as today, no send is attempted, and the
     client still gets `{ done: false, reason: 'insert_error' }` before the
     26 s kill.
   - Total send time per invocation is capped at 2,000 ms across all
     events, so five captures can never add more than 2 s.
   - A failed or aborted send is one `console.warn` and nothing else.
3. **Per-invocation state.** At most 5 events per invocation, so an error
   inside a loop cannot use up the free quota. The event counter and the
   time budget (`InvocationBudget`) live in state that `withObservability`
   creates for each invocation and holds in an `AsyncLocalStorage` from
   `node:async_hooks` (built in, no dependency), so `captureException`
   called deep inside a handler reaches the right budget. Neither is ever a
   module-level variable: a warm container must not carry the count from
   one invocation into the next. A capture called outside any wrapped
   invocation finds no state and sends nothing.
4. Stack frame filenames are cut to the basename. Absolute build paths are
   never sent.
5. **Non-Error input.** When `err` is not an `Error` instance (a PostgREST
   error object such as `insErr` in `collect-claude.js:77`, or `error` in
   `collect-prompt.js:152`), the event carries only `String(err.message)`,
   cut by section 7 rule 5, as the exception value, with type
   `'NonError'`, and `err.code` as the tag `pg_code` when it is a string.
   `details`, `hint` and every other field are never read. Postgres puts
   `Failing row contains (...)` in `details`, and for `ai_results` that row
   holds `response_snippet` and `competitors_mentioned`.
6. Path B never sends `event.body`, `event.headers`, `event.queryStringParameters`
   or the handler's return value.
7. **Build info.** `buildInfo()` reads the file with a static require of the
   literal relative path, so both bundlers (`node_bundler = "esbuild"` at
   `netlify.toml:377` and the default elsewhere) trace and ship it:
   `require('./_build_info.json')` inside a try, answering
   `{ commit: null, built_at: null }` on any error. A computed path or
   `fs.readFileSync` is not allowed, because neither bundler traces it.

### 3.2 Where path B is applied (bg-backend, exact list)

| File | Change | Catches |
|---|---|---|
| `collect-prompt.js` | wrap the handler (`:40`); `captureException(error, ...)` at `:153` with tags `{ fn, reason: 'insert_error' }` | failure 5 |
| `collect-claude.js` | wrap (`:21`); `captureException(insErr, ...)` at the insert error, after `:78` and before the return at `:80`, tags `{ fn, reason: 'insert_error', llm: 'claude' }` | failure 5 |
| `collect-chatgpt.js` | wrap (`:20`); `captureException(insErr, ...)` after `:86` and before the return at `:88`, tags `{ fn, reason: 'insert_error', llm: 'chatgpt' }` | failure 5 |
| `collection-worker-background.js` | wrap `:121`; `captureMessage('job_failed', 'error')` at `:95` with tags `{ job_id, run_id, attempts }` | failure 5 on the scheduled path; failure 2 class (near-timeout) |
| `health.js` (new) | wrap, with its own top-level catch (section 3.3) | the simulate proof |

Only these five handlers. In the four existing files the change is the
wrap and the one capture, nothing else: no response body, status code,
log line or control flow changes. The capture is awaited where it sits,
and rule 2 of section 3.1 bounds it. The objects passed are the PostgREST
error objects as they are today; rule 5 of section 3.1 decides what of
them is read, so the builder does not pick fields.

Callers that must see no change: the single-cell refresh in
`src/lib/collectionContext.tsx`, which reads `done` and `reason` from the
three collectors, and `schedule-collections` and `enqueue-collection`,
which invoke the worker. The packet's "one wrap in `_auth.js`" is cut:
`requireAuth` runs inside handlers, not around them, so a wrap there would
not see a handler throw. It would also make this an auth change, which needs
bg-verify before build. Every SPA-called function is already covered by
path A, because a throw reaches the browser as a 5xx.

### 3.3 `health.js` (bg-backend)

`GET /.netlify/functions/health`. No auth, no CORS headers, and
`Cache-Control: no-store`. The `netlify.toml` timeout is 10.

```ts
type HealthOk = {
  status: 'ok' | 'degraded';
  commit: string | null;          // 40 hex from _build_info.json, null if unknown
  built_at: string | null;        // ISO
  time: string;                   // ISO, server clock
  checks: {
    supabase: { ok: boolean; ms: number | null };                  // one round trip, 4,000 ms deadline
    jobs: { ok: boolean; newest_age_s: number | null; max_age_s: 10800 };
    watchdog: { ok: boolean | null; age_s: number | null; max_age_s: 10800 };
  };
};
// 200 with status 'ok'       when every check.ok is true or null
// 503 with status 'degraded' when any check.ok is false
// 429 { error: 'rate_limited' }
// 405 { error: 'method_not_allowed' } for anything but GET and HEAD
// 403 { error: 'forbidden' } for a simulate request without the right key
```

The checks:

- **`jobs`** is the newest `job_runs.ran_at` where `job <> 'obs-watchdog'`.
  It fails when that row is older than 3 hours. Those rows are written only
  by Netlify functions that `pg_cron` reached through `pg_net`
  (`schedule-collections` hourly), so this check proves **`pg_net` plus
  Netlify**. The watchdog's own row is excluded because it is written
  inside Postgres without `pg_net` and would keep this check green through
  a `pg_net` or Netlify outage. Production has one such window already:
  0 `job_runs` rows between 05:15 and 12:05 UTC on 2026-10-21 while
  `cron.job_run_details` recorded every run as succeeded (review F6).
- **`watchdog`** reads the newest `job_runs` row with
  `job = 'obs-watchdog'`. It proves **`pg_cron` plus Resend**.
  - `null` when no such row exists yet. Not installed counts as not failing,
    so nothing goes red before the SQL is applied.
  - `false` when that row has `ok = false`, which under the rule in section
    3.6 means the previous run sent mail and Resend refused it or never
    answered, or when the row is older than 3 hours.
- **Round trips.** Both checks come from one query: two filtered subqueries
  (`job <> 'obs-watchdog'` and `job = 'obs-watchdog'`), each the newest row
  by `ran_at`. That is one Supabase round trip plus one rate-limit RPC, two
  in total.
- **Rate limit.** `affiliate_rate_check('health:' || dailyIpHash, 30, 60)`.
  If `IP_HASH_PEPPER` is unset, the check is skipped and the function logs
  once; it never falls back to a built-in pepper such as the one in
  `affiliate-redirect.js:31-36`. The RPC is raced against 1,500 ms. On an
  RPC error or on the deadline, the rate check is skipped (fail open) and
  the function goes on to the checks. An RPC error is never answered as
  429, so a Supabase outage reads as `checks.supabase.ok: false`, not as
  "rate limited".
- **Time budget.** 1,500 ms rate check, 4,000 ms Supabase check, at most
  2,000 ms of Sentry send (section 3.1 rule 2): 7.5 s worst case, inside
  the 10 s timeout.
- **Errors.** Every failure branch answers with a fixed string. No driver
  message leaves the function. `health.js` catches every exception at its
  top level, calls `captureException`, and answers
  `500 { error: 'internal' }`. It never rethrows, so no runtime-formatted
  error body is ever served on this unauthenticated endpoint. The rethrow
  rule of section 3.1 applies only to the collectors and the worker, which
  keep their current behaviour.
- **Simulate.** `?simulate=error` or `?simulate=timeout`, honoured only with
  header `X-Internal-Key` equal to `INTERNAL_AUDIT_KEY`.
  - **Fail closed.** If `INTERNAL_AUDIT_KEY` is unset or empty, every
    `simulate` request answers 403, whatever the header says. Otherwise
    the header is compared with `crypto.timingSafeEqual` on two buffers of
    equal length, after a length check that answers 403 on a mismatch. The
    worker's `checkInternalKey` (`collection-worker-background.js:35-43`)
    is not reused: it returns `true` when the variable is unset. A plain
    `===` is not used either: it is true when both sides are `undefined`.
  - The key goes in a header, never the query, so it stays out of URLs and
    logs.
  - `error` throws inside the handler; the top-level catch sends one Sentry
    event and answers exactly `500 { error: 'internal' }`.
  - `timeout` sleeps 12 s, past the 10 s limit, so bg-verify can see the
    exact status code Netlify returns for a killed function. That code is
    the path A trigger for failure 2.
  - Simulate never calls an LLM, never enqueues a collection, and never
    writes `job_runs`.

### 3.4 Build info (bg-backend)

`netlify.toml` `[build] command` becomes
`npm install && VITE_RELEASE=$COMMIT_REF npm run build`.

`package.json` gains
`"prebuild": "node -e \"<writes netlify/functions/_build_info.json>\""`.
The writer is the builder's.

```json
{ "commit": "40-hex or null", "built_at": "ISO 8601" }
```

`_build_info.json` is added to `brandgeo-dashboard/.gitignore`. A local
build writes `{ "commit": null }`. Reason: Netlify's read-only `COMMIT_REF`
is reliably present at build time, but not reliably at function runtime, so
the value is baked in. The file must sit next to the functions and be read
by the static require in section 3.1 rule 7, or the bundler leaves it out
and `commit` is always null. bg-verify proves the live value equals
`origin/main`.

### 3.5 `src/lib/observability.ts` (bg-app)

```ts
export function initObservability(): void;   // called once from src/main.tsx before render
// Internal contract:
// 1. Returns immediately (no import, no network) unless ALL hold:
//    import.meta.env.PROD, import.meta.env.VITE_SENTRY_DSN non-empty,
//    location.hostname === 'app.getbrandgeo.com', and !isDemoMode.
// 2. Installs a pre-load buffer on 'error' and 'unhandledrejection'
//    (max 10 entries), then dynamic-imports a module that imports
//    @sentry/browser after window 'load' (or requestIdleCallback),
//    calls init, replays the buffer, removes the listeners.
// 3. Sentry.init options, fixed:
//    dsn: VITE_SENTRY_DSN, release: import.meta.env.VITE_RELEASE ?? undefined,
//    environment: 'production', sendDefaultPii: false, tracesSampleRate: 0,
//    no replay, no tracing, defaultIntegrations: false and exactly
//    [inboundFilters, functionToString, linkedErrors, dedupe, globalHandlers,
//     httpClientIntegration({ failedRequestStatusCodes: [[500, 599]],
//                             failedRequestTargets: [/\/\.netlify\/functions\//] })],
//    maxBreadcrumbs: 0, denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:/i],
//    ignoreErrors: ['ResizeObserver loop'], beforeSend: scrub (section 7).
```

No `@sentry/react`: no ErrorBoundary is needed, because React 18 rethrows an
uncaught render error to the global handler. No `user` is ever set. The
breadcrumbs integration is excluded because breadcrumbs carry console text
and URLs.

### 3.6 Watchdog, `ops` schema (bg-backend writes the SQL; Constantin applies)

File: `db/supabase-observability-watchdog-2026-10-28.sql`, in two parts. Part
B is not run until part A has been read back.

```sql
-- PART A: objects, no schedule
create schema if not exists ops;                       -- not in PostgREST exposed schemas
revoke all on schema ops from public, anon, authenticated;

create table ops.watch_expectations (
  job          text primary key,                       -- cron.job.jobname, or a job_runs.job value
  source       text not null check (source in ('job_runs', 'cron')),
  max_silence  interval not null,                      -- 2x the schedule interval
  consecutive  integer not null default 1 check (consecutive between 1 and 5),
  enabled      boolean not null default true,
  note         text
);
-- seed: schedule-collections job_runs 2h consecutive 2;
--       ping-sitemap job_runs 48h 1; expire-plan-grants job_runs 48h 1;
--       purge-old-ai-results cron 48h; purge-old-prospect-audits cron 48h;
--       affiliate-retention cron 48h; affiliate-mature cron 48h;
--       obs-watchdog job_runs 3h enabled=false
--         note 'self: never alerted on by itself; health.js reads job_runs directly';
--       poll-inbound-replies job_runs 2h enabled=false note 'not scheduled, needs GMAIL_* first'
-- The obs-watchdog row exists only so job_unwatched does not report the
-- watchdog's own cron job. It is excluded from every job_* kind by name as
-- well (predicate table), so flipping enabled cannot make it alert on itself.

create table ops.alert_log (
  alert_key   text not null,                            -- e.g. 'job_failed:ping-sitemap'
  day         date not null default (now() at time zone 'utc')::date,
  sent_at     timestamptz not null default now(),
  request_id  bigint,                                   -- net.http_post id
  finding     jsonb not null,                           -- counts and names only, section 7
  primary key (alert_key, day)
);
alter table ops.watch_expectations enable row level security;   -- no policies
alter table ops.alert_log          enable row level security;   -- no policies
```

```ts
// ops.watchdog_findings() returns setof:
type Finding = {
  alert_key: string;     // '<kind>:<subject>'
  kind: 'job_failed' | 'job_silent' | 'job_unscheduled' | 'job_unwatched'
      | 'engine_down' | 'engine_degraded' | 'collection_jobs_failed';
  subject: string;       // job name, engine id, or 'collection_jobs'
  summary: string;       // one plain sentence, no client names, no prompt text
  evidence: Record<string, string | number | boolean | null>;
};
// STABLE, side-effect free, so it can run inside a rolled-back transaction.
// A failed send is NOT a Finding kind and is never emailed (see step 0).

// ops.watchdog_prev_ok(prev_ran_at timestamptz, prev_request_id bigint)
//   returns boolean. STABLE, reads net._http_response only. The rule:
//   - prev_ran_at is null (no previous row)             -> true
//   - prev_request_id is null (previous run sent nothing) -> true
//   - prev_ran_at < now() - interval '5 hours'          -> true, unjudged
//       (pg_net.ttl is 6 hours, read 2026-10-28, so the response may be
//        purged; a gap that long is already a stale-watchdog signal in
//        health.js while it lasts)
//   - a net._http_response row with id = prev_request_id exists:
//       true  when status_code between 200 and 299
//       false otherwise, including status_code null with timed_out or error_msg set
//   - no such row: false when now() - prev_ran_at > interval '10 minutes',
//       else true
//   This function is the whole definition of the watchdog's ok.

// ops.watchdog_run() returns integer (findings emailed this run):
//   0. prev := the newest job_runs row with job = 'obs-watchdog';
//      ok := watchdog_prev_ok(prev.ran_at, (prev.detail->>'request_id')::bigint).
//      If ok is false: delete from ops.alert_log where request_id =
//      (prev.detail->>'request_id')::bigint, so the findings that mail never
//      delivered are sent again by this run instead of waiting for the next
//      UTC day. job_runs has no request_id column; the id lives only in
//      detail, so bind it once to a local variable and use it in both places.
//   1. f := watchdog_findings(); drop keys already in alert_log for today
//   2. if any remain: one net.http_post to https://api.resend.com/emails,
//      key and recipient from vault.decrypted_secrets ('resend_api_key',
//      'alert_email'), from 'BrandGEO <noreply@mail.getbrandgeo.com>',
//      subject '[BrandGEO alert] <n> new: <comma list of alert_key>',
//      text body one line per finding plus the runbook path; insert alert_log
//      rows carrying the returned request id
//   3. insert job_runs (job 'obs-watchdog', ok,
//      detail {findings, sent, request_id, prev_unjudged})
//      request_id is the bigint net.http_post returned, or null when nothing
//      was sent. A quiet run therefore writes request_id null, and the run
//      after it reads ok = true.
// ops.watchdog_send_test() returns bigint: one email through the same path,
//   subject '[BrandGEO alert] test', not deduplicated, writes no job_runs row
//   and no alert_log row, so it never affects ok. For the runbook proof.

// Hygiene, all four functions:
//   SECURITY INVOKER (the default; they run as the cron job's owner and need
//   no definer rights), `set search_path = ''`, and every reference
//   schema-qualified (public.job_runs, public.ai_results,
//   public.collection_jobs, cron.job, cron.job_run_details,
//   net._http_response, net.http_post, vault.decrypted_secrets,
//   ops.watch_expectations, ops.alert_log, pg_catalog functions as needed).
// revoke execute on all four from public, anon, authenticated.
```

```sql
-- PART B: schedule (run only after PART A is read back and findings reviewed)
select cron.schedule('obs-watchdog', '50 * * * *', $$ select ops.watchdog_run(); $$);
```

**Predicates.** Evaluated at each run; `now()` is the run time.

| kind | Rule | Source |
|---|---|---|
| (all `job_*`) | `obs-watchdog` is excluded from every `job_*` kind by name, whatever its expectation row says. Its health is reported only by its own `job_runs.ok` (the `watchdog_prev_ok` rule above) and by `health.js`. | none |
| `job_failed` | For a `job_runs` job: the last `consecutive` rows all fail. A row fails when `ok = false`, or `detail ? 'error'`, or (for `ping-sitemap`) `(detail->>'attempted')::int > 0 and coalesce((detail->>'indexnowOk')::int, 0) = 0`. Second clause, `ping-sitemap` only, with its own count of 2 whatever the row's `consecutive`: the newest 2 rows both carry `detail->>'note' = 'no urls parsed'` (one empty parse after an unchanged sitemap can be legitimate). For a `cron` job: the latest `cron.job_run_details.status <> 'succeeded'`. | `job_runs`, `cron.job_run_details` |
| `job_silent` | Enabled expectation with no run newer than `now() - max_silence`. | same |
| `job_unscheduled` | Enabled expectation whose `cron.job` row is missing or `active = false`. | `cron.job` |
| `job_unwatched` | Active `cron.job.jobname` with no expectation row, enabled or not. | `cron.job` |
| `engine_down` | Per `ai_results.llm` over the trailing 24 h: rows with `status = 'error'` are 2 or more and rows with `status = 'ok'` are 0. | `ai_results` |
| `engine_degraded` | Per `llm` over the trailing 24 h: 10 or more rows, at least 1 ok, error share of 50% or more. | `ai_results` |
| `collection_jobs_failed` | Any `collection_jobs.status = 'failed'` with `finished_at` in the trailing 24 h, or a non-terminal status (not `done`, not `failed`) with `coalesce(scheduled_for, created_at) < now() - interval '2 hours'`. | `collection_jobs` |
| (not a finding) failed send | Defined by `ops.watchdog_prev_ok` above. It sets the run's `job_runs.ok = false` and clears that run's `alert_log` rows. It is never emailed, because Resend is the thing that failed; it reaches a human through `health.js` and UptimeRobot. | `net._http_response` |

**Backtest of the engine rules**, against `ai_results` since 2026-07-15:
- `engine_down` fires for ChatGPT on 2026-08-28 to 2026-09-22.
- It fires for Perplexity and Grok on 2026-09-18 to 2026-10-25.
- It fires for Claude from 2026-10-27 to 2026-10-30, 50 hourly runs
  (the Anthropic credit outage; 2026-10-26 still had 3 ok rows beside 3
  `api_error`, so it does not fire that day). Claude recovered on
  2026-10-31 (61 ok rows), so it would not fire on a go-live run today.
- It fires for Google AI Mode (`google_ai`) from 2026-07-18 to 2026-07-19,
  24 hourly runs, on 2 `empty_response` rows with no ok row in the window
  (1 ok row on 2026-07-16). A real failure, so a true positive.
- `engine_degraded` fires only for Perplexity and Grok on 2026-09-11 and
  2026-09-12.
- These are all the windows the bg-verify replay found
  (`docs/qa/observability-030-spec-rereview-2026-10-28.md` section 4.3).
- **Low-volume engines trip on very few rows.** `engine_down` needs only 2
  error rows and 0 ok rows in 24 hours, so an engine that collects a
  handful of rows a day (Google AI Mode is Growth PRO and above only, and
  will stay low-volume) fires on two failures. The google_ai window shows
  it. A floor of 2 rows is kept on purpose for now; raising it per engine
  is a product choice, not a defect.

**Backtest of `job_failed`**, against all of `job_runs`:
- `schedule-collections` with `consecutive = 2` fires on 2026-09-11, 12, 13
  and 14, and stays silent for the isolated blips on 2026-08-28 and
  2026-09-10.
- `ping-sitemap` fires on 14 days.
- `expire-plan-grants` fires on 3 days.
- All of them are real failures.
- The `ping-sitemap` "no urls parsed" clause: production holds two such
  rows, 2026-08-03 05:10 and 2026-10-27 05:10, both `ok = true`, both
  isolated (the runs before and after each are ordinary empty runs without
  the note, read 2026-10-28). With the clause's count of 2, neither fires;
  with a count of 1, both would. A sitemap that stays unparseable fires on
  its second day.

**Cost when healthy.**
- 24 runs a day. Each runs five small selects: `ai_results` through its
  `checked_at` indexes, about 72 rows a day; `job_runs`, about 2,400 rows
  with `idx_job_runs_job_ran_at`; `cron.job`; `cron.job_run_details` limited
  to the latest per job; and `collection_jobs`.
- It writes one `job_runs` row per run, 24 rows a day.
- It makes no `pg_net` call and no Netlify invocation when there are no
  findings. Such a run writes `request_id` null, and the next run reads
  `ok = true` (step 0).

## 4. The six failures, and what catches each

| # | Failure (history) | Caught by | Time to detection |
|---|---|---|---|
| 1 | A scheduled job fails on every run because a secret is missing. Seen as `ping-sitemap` `NO_CREDENTIALS` (`job_runs`, 2026-07-28, after daily silent failures since 2026-07-19) and `poll-inbound-replies` `gmail not configured` (2026-09-08). | C `job_failed` (`ok = false`, or the `ping-sitemap` detail rule) | Daily job: about 40 minutes (05:10 fail, 05:50 watchdog). Hourly job: under 2 hours. |
| 2 | A function is killed at its timeout and the page reads "found nothing" (`resolve-contact-routes`, 2026-08-20). | A `httpClientIntegration` on the 5xx; B `near_timeout` on the wrapped collectors and worker | Seconds to Sentry, then Sentry's new-issue email. |
| 3 | A dashboard push built ten days late (2026-08-21 to 2026-08-31), and a dashboard push cancelled as "no content change" (2026-10-22). | E deploy-lag step: after a push touching `brandgeo-dashboard/`, poll `health.js` until `commit` equals the newest commit that touched that folder | 20 minutes after the push. Without E: not caught, recorded as such. |
| 4 | The test suite was red for a month, from 2026-08-02 to its discovery on 2026-09-03. | E test step: every `tests/*.test.js` on each push to `main` | About 5 minutes after the push. Without E: not caught. |
| 5 | An insert failure answered as success (`collect-prompt.js`, closed 2026-09-03; the same class lives on in the worker). | B capture at the three insert sites; C `collection_jobs_failed` for the scheduled path | Seconds (B); under 1 hour (C). |
| 6 | Engine outage, every call `quota_exceeded` (Perplexity and Grok, 2026-09-18 to 2026-10-25, found by hand on 2026-10-18; ChatGPT 2026-08-28 to 2026-09-21, never recorded). | C `engine_down` | Within 1 hour of the first collection burst that hits it. Backtested: 2026-09-18 instead of 2026-10-18 for Perplexity. |

The table also catches things that are not on the list: the September
Gateway Timeout run and the six `sitemap_fetch` failures (C), a sitemap
that parses to nothing two days running (C, `ping-sitemap` clause), and
three platform failures through `health.js` (D):

- `pg_net` or Netlify's scheduled path stopping: `jobs` goes false,
  because no scheduled Netlify job has written `job_runs` for 3 hours.
- `pg_cron` stopping: `watchdog` goes false, because the watchdog row
  ages past 3 hours (`max_age_s` 10800, section 3.3). (`pg_cron` also
  drives the scheduled Netlify jobs, so `jobs` goes false at the same
  time. The pair tells the causes apart: both false points at `pg_cron`,
  `jobs` false with `watchdog` green points at `pg_net` or Netlify. That
  separation is why `obs-watchdog` is excluded from `jobs`; section 3.3.)
- Resend refusing the watchdog's mail: `watchdog` goes false through the
  `ok` rule in `ops.watchdog_prev_ok`.

## 5. Cut list (catches none of the six, or ruled out)

| Cut | Why |
|---|---|
| `@sentry/react`, `@sentry/node` | Bundle size and cold start; the plain browser SDK and a fetch envelope catch the same failures. |
| Source map upload and `SENTRY_AUTH_TOKEN` | Catches none of the six; adds a build secret and a new way for the build to fail. Later. |
| Tracing, replay, performance | Ruled errors only. `tracesSampleRate: 0`. |
| Sentry and a CSP change on getbrandgeo.com, `brandgeo/web/observability.js` | Ruled SPA and functions only; catches none of the six. bg-web has no build work. |
| `function_errors` table (lens 1) | Sentry holds the events; a second store would be a second truth. |
| Wrap in `_auth.js` | Sees nothing a handler throw does not already surface (section 3.2); auth risk. |
| Wraps on `stripe-webhook.js`, `mcp-server.js`, `affiliate-*` | No historical failure there; billing risk on the webhook. Later. |
| Uptime monitor on the app root | Same host as `health.js`, which already proves the host. |
| Phone push, Better Stack | Ruled out. |

**Kept although it catches none of the six:** the UptimeRobot monitor on
getbrandgeo.com `/`. The packet names it as the marketing site's target,
and it costs no code and no invocations. It would also have corroborated
the six `sitemap_fetch` failures. Q3 was ruled keep on 2026-10-28.

## 6. Alert table

The same table appears in `docs/ops/alerting-runbook.md`. That file is the
operational copy; this one is the design record.

| Alert | Source | Recipient | Cap |
|---|---|---|---|
| Sentry new issue (SPA) | Sentry project `brandgeo-app` | the Sentry account email, which must be the `ADMIN_ALERT_EMAIL` address | Sentry default, once per new issue; the key is rate limited to 100 events an hour |
| Sentry new issue (functions) | Sentry project `brandgeo-functions` | same | same |
| Watchdog digest | `ops.watchdog_run()` via `pg_net` and Resend | Vault `alert_email` (same address) | One email per run at most (24 a day); each alert key at most once a UTC day |
| Health down | UptimeRobot monitor on `health` | UptimeRobot contact (same address) | UptimeRobot sends on down and on up |
| Marketing down | UptimeRobot monitor on getbrandgeo.com `/` | same | same |
| CI red or deploy lag (Q1, ruled yes) | GitHub Actions via Resend | GitHub secret `ALERT_EMAIL` (same address) | One per failing run; pushes are about 2 a day |
| Existing event emails | `recordAdminEvent` (section 1) | `ADMIN_ALERT_EMAIL` | unchanged |

## 7. PII scrub rules (both surfaces, same list)

These apply to every event before it is sent:

1. **Never sent at all:** `user`, `request.cookies`, `request.headers`,
   `request.data`, `request.query_string`, `breadcrumbs`,
   `contexts.device`, `server_name`.
2. **Every URL,** including `request.url` and frame filenames, loses its
   query string and fragment, and the path segment after `/audit/` or
   `/affiliate/join/` becomes `[token]`.
3. **Any key** in `extra`, `tags` or `contexts`, at any depth, matching
   `/prompt|response|snippet|text|body|brand_|email|token|key|secret|password|authorization|cookie|phone|name|details|hint/i`
   is deleted, not masked. Exceptions: the tags `fn` and `pg_code`
   (section 3.1 rule 5). A Postgres error's `details` and `hint` carry row
   values ("Failing row contains (...)") and are never read by the server
   wrapper; the regex is the second line of defence.
4. **String values** have these replaced. The rule runs on exactly these
   fields and no others: `exception.values[].value`, `message`, every
   string in `extra`, every tag value except `fn` and `pg_code`, every
   string in `contexts` except `contexts.trace`, and every frame
   `filename`. It never rewrites `event_id`, `release`, `environment`,
   `timestamp` or `platform`, because `release` is a 40-hex commit sha and
   the last rule below would otherwise turn it into `[secret]`.
   - email addresses become `[email]`
   - three-segment JWTs (`eyJ...`) become `[jwt]`
   - `Bearer <anything>` becomes `Bearer [redacted]`
   - Stripe secrets and ids (`sk_`, `rk_`, `pk_`, `whsec_`, `cus_`, `in_`,
     `pi_`, `sub_`, `cs_`) become `[stripe]`
   - MCP keys `bgmcp_...` become `[key]`
   - any run of 32 or more hex or base64 characters becomes `[secret]`
5. **Length limits:** each string is cut to 300 characters, and an
   exception `value` to 500.
6. **Server only:** `extra` may hold primitives only, and builders pass only
   ids, engine names, error codes and counts. No prompt text, no response
   text, no client name, no domain.
7. **The watchdog** `finding` and email body carry job names, engine ids,
   counts and timestamps only. `ai_results` is read with `count(*)` grouped
   by `llm`, never with `response_snippet` or `prompt_id` text.

The list exists twice, in `_observability.js` and in `observability.ts`
(section 8). Both builders test against one fixture,
`brandgeo-dashboard/tests/fixtures/observability-pii.json`. Each fixture
case is an input event and the exact expected output. The fixture carries
at least these cases besides one per rule above:

- a non-Error with `message`, `details: 'Failing row contains (...)'`,
  `hint` and `code`: the output holds the message and the `pg_code` tag
  only;
- an event whose `release` is a 40-hex sha: `release` comes out unchanged;
- SPA URLs `/audit/<token>` (24-character base64url) and
  `/affiliate/join/<token>` (32-character base64url): the output reads
  `/audit/[token]` and `/affiliate/join/[token]`. Rule 4's 32-character
  run would miss the first and need not match the second, so rule 2 gains
  one clause: in every URL, the path segment after `/audit/` or
  `/affiliate/join/` becomes `[token]`. Today no integration attaches the
  page URL (section 3.5 excludes `httpContextIntegration`), so this case
  exists to fail the test the day someone adds it.

## 8. State ownership map

| State | Owner (writes) | Readers | Invalidates when |
|---|---|---|---|
| Sentry events | A and B | Constantin in Sentry | Sentry free retention |
| `job_runs` rows | the 4 HTTP jobs and `ops.watchdog_run` | watchdog, `health.js` | never purged (24 extra rows a day) |
| `ops.watch_expectations` | the SQL file; edits by Constantin in the SQL editor | watchdog | a cron job is added or removed (`job_unwatched` makes that visible) |
| `ops.alert_log` | `ops.watchdog_run` | `ops.watchdog_run` (dedup) | new UTC day |
| Build commit | `prebuild` writes `_build_info.json`; `VITE_RELEASE` | `health.js`, B release, A release | every build |
| Recipient address | Netlify `ADMIN_ALERT_EMAIL`, Vault `alert_email`, GitHub `ALERT_EMAIL`, Sentry and UptimeRobot account email | each path | Constantin changes the address |

**The same value held in more than one place, named so nobody is surprised:**

- **Recipient default.** `'support@getbrandgeo.com'` is the hard-coded
  fallback in three files: `_admin_notify.js:22`, `expire-plan-grants.js:41`
  and `_affiliate_email.js:17`. This spec adds three more places holding the
  same address, which are values rather than code. If the address changes,
  the runbook section "Changing the alert address" lists all six. Folding the
  three code defaults into one is a separate refactor, not part of this spec.
- **Sender.** `BrandGEO <noreply@mail.getbrandgeo.com>` lives in
  `_email.js:14` and, once built, in `ops.watchdog_run`. The duplicate is
  forced by SQL not being able to import JS.
- **Resend key.** Netlify `RESEND_API_KEY` (existing), Vault
  `resend_api_key`, and GitHub `RESEND_API_KEY` (Q1). The runbook asks for
  three separate send-only keys, so each can be revoked alone.
- **Scrub list.** `_observability.js` and `observability.ts`, held equal by
  the shared fixture.
- **Rate-limit RPC.** `health.js` borrows `affiliate_rate_check`, so the
  `health:` key prefix lives in the affiliate table. This is accepted:
  renaming it is a migration for no user value.

## 9. Environment, bundle and performance budget

**Netlify environment.**

| Variable | Scope | Bytes counted against the functions' 4 KB | New? |
|---|---|---|---|
| `SENTRY_DSN` | Functions | about 110 (10 name + about 95 value) | new |
| `VITE_SENTRY_DSN` | Builds only | 0 (build scope is not shipped to functions) | new |
| `INTERNAL_AUDIT_KEY` | existing | 0 added | reused |
| `IP_HASH_PEPPER` | existing | 0 added | reused |
| `ADMIN_ALERT_EMAIL` | existing | 0 added | reused |

The total added to the functions environment is about 110 bytes.
`COMMIT_REF` is a Netlify read-only build variable and costs nothing.

**Other secret stores (0 Netlify bytes):**
- Vault: `resend_api_key`, `alert_email`
- GitHub Actions (Q1, ruled yes): `RESEND_API_KEY`, `ALERT_EMAIL`

**SPA bundle.**

| Item | Budget (gzip) |
|---|---|
| Main chunk delta (loader, buffer, DSN check) | 1.5 KB or less |
| New lazy chunk, `@sentry/browser` minimal integrations | 35 KB or less; expected 25 to 30 KB |
| Loaded when | only on app.getbrandgeo.com with the DSN set, after window `load` |
| Time to first meaningful paint, any route | +0 ms; the chunk is fetched after load |
| Requests | +1 chunk per session; +1 ingest POST per error only |
| Supabase round trips from the SPA | +0 |

bg-app records the actual `vite build` gzip sizes in its report. The
dependency is `@sentry/browser`, pinned to an exact version. No existing
dependency (React, Vite, Tailwind, Recharts, lucide-react, motion,
supabase-js, stripe) does this job.

**Functions.** `_observability.js` is about 5 KB of source with no
dependencies. It is bundled into the five files that require it. Cold start
added: about 0. The error path costs at most 2 s in total per invocation,
whatever the number of captures (section 3.1 rule 2), and 0 when less than
300 ms of the function's budget is left. A collector can therefore never be
pushed past its 26 s timeout by a Sentry send.

**Invocations and rows when healthy.**

| Check | Per month |
|---|---|
| UptimeRobot on `health`, 5 min | 8,640 invocations, about 17,280 Supabase calls, about 8,640 rate-limit rows (purged daily) |
| UptimeRobot on getbrandgeo.com `/` | 8,640 requests to cPanel, 0 Netlify |
| Watchdog | 720 runs inside Postgres, 0 Netlify, 720 `job_runs` rows |
| Sentry | 0 when nothing breaks |
| CI (Q1, ruled yes) | about 60 workflow runs, free on a public repository; 2 or 3 `health` calls per run |

Constantin reads the plan's function allowance in Netlify under Usage.
8,640 health calls a month is the only recurring Netlify cost this spec
adds.

## 10. File plan

### bg-backend (Opus; touches an unauthenticated endpoint and a new schema)

| File | Action | Reason |
|---|---|---|
| `brandgeo-dashboard/netlify/functions/_observability.js` | create | path B, section 3.1 |
| `brandgeo-dashboard/netlify/functions/health.js` | create | section 3.3 |
| `brandgeo-dashboard/netlify/functions/collect-prompt.js` | modify | wrap the handler and one capture at the insert error, `:153`; no other change (section 3.2). Builder note: keep `const FAST_ENGINES` (`:38`) one literal list, because `tests/engine_routing.test.js:55` parses it from the source text |
| `brandgeo-dashboard/netlify/functions/collect-claude.js` | modify | wrap the handler and one capture at the insert error, after `:78` and before `:80`; no other change |
| `brandgeo-dashboard/netlify/functions/collect-chatgpt.js` | modify | wrap the handler and one capture at the insert error, after `:86` and before `:88`; no other change |
| `brandgeo-dashboard/netlify/functions/collection-worker-background.js` | modify | wrap the handler at `:121` and one capture at the failed job, `:95`; `checkInternalKey` at 35 to 43 is not touched; no other change |
| `brandgeo-dashboard/netlify.toml` | modify | `[functions."health"] timeout = 10`; build command with `VITE_RELEASE`; CSP `connect-src` gains `https://*.ingest.de.sentry.io` (Q2, ruled EU); `VITE_SENTRY_DSN` appended to `SECRETS_SCAN_OMIT_KEYS` at line 24, with a one-line comment above it saying a browser DSN is public by design (F14). `SENTRY_DSN` is never added to that list. |
| `brandgeo-dashboard/package.json` | modify | `@sentry/browser` exact version; `prebuild` script |
| `brandgeo-dashboard/package-lock.json` | modify | follows the dependency |
| `brandgeo-dashboard/.gitignore` | modify | `netlify/functions/_build_info.json` |
| `brandgeo-dashboard/tests/observability.test.js` | create | wrapper no-op without DSN; envelope shape; scrub against the fixture; 5-event cap per invocation, and two concurrent invocations each get their own cap (AsyncLocalStorage); rethrow preserved; with `getRemainingTimeInMillis()` faked at 700 ms, a capture makes no fetch call (deadline 200 ms, under the 300 ms floor), and faked at 1,000 ms it sends with an abort deadline of 500 ms (section 3.1 rule 2); total send time per invocation never exceeds 2,000 ms with a fetch stub that hangs; a non-Error PostgREST shape sends only message and `pg_code`; `release` survives the scrub; `health.js` `simulate=error` with `INTERNAL_AUDIT_KEY` unset answers 403 and with it empty answers 403; a thrown error inside `health.js` answers exactly 500 `{error:'internal'}` |
| `brandgeo-dashboard/tests/fixtures/observability-pii.json` | create | shared scrub fixture, with the cases listed in section 7 |
| `db/supabase-observability-watchdog-2026-10-28.sql` | create | section 3.6, parts A and B; four functions, all with `set search_path = ''` |
| `db/supabase-observability-watchdog-proof-2026-10-28.sql` | create | `begin`; insert a failing `job_runs` row; `select * from ops.watchdog_findings()`; the `ops.watchdog_prev_ok` cases of V9b; the resend case of V9d; `rollback` |
| `.github/workflows/dashboard-ci.yml` | create (Q1 ruled yes, 2026-10-28) | tests, then the deploy-lag poll, then email via Resend on failure. Hardening (F15), all binding: the only trigger is `on: push: branches: [main]`; no `pull_request`, `pull_request_target` or `workflow_run` trigger; top-level `permissions: contents: read`; `RESEND_API_KEY` and `ALERT_EMAIL` appear only in the `env` of the final mail step, which runs `if: failure()`; no third-party action receives a secret |

### bg-app (Sonnet)

| File | Action | Reason |
|---|---|---|
| `brandgeo-dashboard/src/lib/observability.ts` | create | path A, section 3.5, plus a lazily imported sibling `src/lib/observabilitySentry.ts` |
| `brandgeo-dashboard/src/lib/observabilitySentry.ts` | create | the only file that imports `@sentry/browser`, so it lands in its own chunk |
| `brandgeo-dashboard/src/main.tsx` | modify | one call, `initObservability()`, before render |

### bg-web

None. This drops the packet's `.htaccess` CSP line and
`brandgeo/web/observability.js` by ruling (section 5).

### Proof that the scopes are disjoint

bg-backend's set is `netlify/functions/*`, `netlify.toml`, `package.json`,
`package-lock.json`, `.gitignore` and `tests/*` under `brandgeo-dashboard/`,
plus `db/*` and `.github/*`.

bg-app's set is exactly three paths under `brandgeo-dashboard/src/`.

No path is in both sets. `package.json` is owned by bg-backend alone,
including the SPA dependency, so the two builders never touch it together.

**Scope amendments to packet 030.** The orchestrator has already made
these in the packet's `scope_write` (F1, 2026-10-28); they are listed here
so the spec and the packet can be compared line by line. Added:
- the four collectors, `collect-prompt.js`, `collect-claude.js`,
  `collect-chatgpt.js` and `collection-worker-background.js`, each limited
  to the wrap and one capture at the insert or upsert error, no other change
- `package-lock.json`, `.gitignore`, `tests/observability.test.js` and its
  fixture
- the two `db/` file names
- `observabilitySentry.ts`
- `.github/workflows/dashboard-ci.yml` (Q1, ruled yes)

Removed:
- `_auth.js`
- `brandgeo/web/.htaccess`
- `brandgeo/web/observability.js`

If the packet and this section ever disagree, the builder stops and asks;
neither document silently wins.

**`/cheap`.** Nothing here is mechanical enough for bg-grunt; every row
carries a scrub or ordering decision.

**Files dirty from other sessions, not to be touched or swept into a
commit:** `unlock-audit-report.js`, `revenue-report.js`, `_revenue.js`,
`src/pages/Revenue.tsx`, `brandgeo/web/site.js`. None is in this plan.

**Build order.** bg-verify first reviews this spec's sections 3.3, 3.6 and
7, because there is an unauthenticated endpoint, function grants and a
schema. Then bg-backend builds; it goes first because bg-app needs the
installed dependency. Then bg-app. Then bg-verify on the build.

## 11. Migration sequence

Each step ships alone and reverts alone. No alert can fire before its
endpoint exists: monitors come last, the watchdog schedule comes after a
reviewed dry run, and `health.js` treats a missing watchdog as not failing.

| # | Step | Who | Inconsistency window | Rollback |
|---|---|---|---|---|
| 1 | Create the Sentry account and two projects, the UptimeRobot account (no monitors), and three send-only Resend keys (runbook 1 to 3) | Constantin | none, nothing reads them | delete the accounts or keys |
| 2 | Netlify env `SENTRY_DSN` (Functions) and `VITE_SENTRY_DSN` (Builds) | Constantin | none, inert until code ships | delete the variables |
| 3 | Vault `resend_api_key` and `alert_email`; GitHub secrets `RESEND_API_KEY` and `ALERT_EMAIL` (Q1 ruled yes) | Constantin | none | `delete from vault.secrets where name in (...)`; delete the GitHub secrets |
| 4 | Build, review, one commit per surface by pathspec | bg-backend, bg-app, bg-verify | none, not pushed | discard the commits |
| 5 | One push, `$env:BATCH_PUSH=1; git push` | Constantin | about 2 minutes, while the build runs | `git revert` the commits and push; the env vars can stay |
| 6 | Verify `GET /.netlify/functions/health` returns 200 with `commit` equal to `origin/main`, and the live bundle string | bg-verify | none | none |
| 7 | Apply SQL part A; run `select * from ops.watchdog_findings();` and read it | Constantin | none, nothing is scheduled | `drop schema ops cascade;` |
| 8 | `select ops.watchdog_send_test();`; the email arrives | Constantin | none | none |
| 9 | Apply SQL part B (schedule) | Constantin | **First run sends current findings at once.** Expected: `engine_down:claude` if Claude is still failing, and nothing else as of 2026-10-28. `obs-watchdog` never appears in a finding (seeded `enabled = false` and excluded by name, section 3.6). After two runs, both `job_runs` rows for `obs-watchdog` read `ok = true`, and a run that sent nothing carries `request_id` null. | `select cron.alter_job(job_id => <id>, active => false);` to pause; `select cron.unschedule('obs-watchdog');` to remove |
| 10 | After step 9: UptimeRobot monitors on `health` and getbrandgeo.com `/` (Q3 ruled keep) | Constantin | none: `health` already answers 200, and its `watchdog` check is true once step 9's first run has written its row | pause or delete the monitor |
| 11 | The workflow (Q1 ruled yes) ran on the push in step 5 | none | the first run will mail red if `package_provisioning.test.js` is still red; that is a true alert | delete the workflow file |

## 12. Acceptance checks bg-verify runs

| # | Check | Pass |
|---|---|---|
| V1 | `node tests/observability.test.js` | exit 0. Covers: no network without a DSN; envelope URL and auth header shape; every fixture case scrubbed exactly, including the section 7 cases (`details` and `hint` dropped, `release` intact, path tokens); 5-event cap per invocation, independent across two concurrent invocations; total send time capped at 2,000 ms with a hanging fetch stub; no fetch at 700 ms remaining; a throwing handler still throws after capture; near-timeout fires once; `health.js` simulate with `INTERNAL_AUDIT_KEY` unset and empty answers 403; a thrown error in `health.js` answers exactly 500 `{error:'internal'}`. bg-verify also reads the four collector diffs: each is the wrap plus one capture, nothing else. |
| V2 | `npm run build` and gzip sizes | exit 0; main chunk delta and lazy chunk within section 9. |
| V3 | Live bundle | Contains a string unique to `observability.ts` and none from `@sentry/browser` in the main chunk; the Sentry chunk is a separate file. |
| V4 | Live CSP header on app.getbrandgeo.com | `connect-src` contains the ingest wildcard and nothing else new. |
| V5 | `curl -i https://app.getbrandgeo.com/.netlify/functions/health` | 200, `Cache-Control: no-store`, `commit` equals `origin/main`, body keys exactly as in section 3.3, no hostnames, no error text, no env names. |
| V6 | Health with `?simulate=error` and no key, then a wrong key, then a key of a different length | 403 every time, no Sentry event. The key-unset case is proven by V1 (production has the key set). |
| V7 | Health with `?simulate=error` and the right key (Constantin types the key in his own terminal) | exactly `500` with body `{"error":"internal"}`; one event in `brandgeo-functions`; the captured payload, read in Sentry's JSON view, passes section 7 and its `release` equals `origin/main`; the new-issue email arrives at the project address. |
| V8 | Health with `?simulate=timeout` and the key | Records the status code Netlify returns, and proves `httpClientIntegration`'s 500 to 599 range includes it. If not, the range is amended. |
| V9 | `db/...-proof-2026-10-28.sql` in a transaction | `ops.watchdog_findings()` returns the injected `job_failed` row; a `collection_jobs` row inserted with the failed status inside the same transaction yields `collection_jobs_failed`; no finding names `obs-watchdog`; after `rollback`, `job_runs` and `collection_jobs` have no new row and `ops.alert_log` is unchanged. |
| V9b | `ops.watchdog_prev_ok` cases, same transaction | `(null, null)` true; `(now() - interval '1 hour', null)` true; `(now() - interval '6 hours', <any id>)` true; `(now() - interval '1 hour', <id with no response row>)` false; `(now() - interval '5 minutes', <id with no response row>)` true. With a real request id from `net._http_response` (read, not written): a 2xx id true, a non-2xx id false. |
| V9c | Two quiet runs, after step 9 | `select ran_at, ok, detail from public.job_runs where job = 'obs-watchdog' order by ran_at desc limit 2;` both rows `ok = true`; a row with `detail->>'sent' = '0'` has `detail->'request_id'` null. This is the F2 regression check. |
| V9d | Lost-mail resend branch (N2), in the proof file, inside `begin` ... `rollback` | Insert an `obs-watchdog` `job_runs` row with `ran_at = now() - interval '30 minutes'` and `detail` carrying a `request_id` that reads false under V9b (a real non-2xx id from `net._http_response`, read not written, or an id with no response row and `ran_at = now() - interval '1 hour'`). Insert one `ops.alert_log` row for today with that `request_id` and an `alert_key` that `ops.watchdog_findings()` returns in the same transaction (inject a failing `job_runs` row as in V9). Run `select ops.watchdog_run();`. Expected: no error (the branch reads the id from `detail`, never a `request_id` column); the old `alert_log` row with that `request_id` is gone; a new `alert_log` row exists for the same `alert_key` carrying the new request id; the return value is 1 or more; the new `obs-watchdog` row reads `ok = false`. The `net.http_post` queue insert rolls back with the transaction, so no mail leaves. After `rollback`, `job_runs` and `ops.alert_log` are unchanged. |
| V10 | Grants and hygiene | `anon` and `authenticated` cannot `select` from `ops.*` or `execute` any of the four functions; `ops` is absent from the API's exposed schemas (Supabase settings) and a PostgREST request for it fails; `pg_proc.proconfig` for each of the four reads `search_path=""` and `prosecdef` is false; the Supabase security advisor shows no mutable search path on them. |
| V11 | Rate limit | 31 health requests in a minute from one IP give at least one 429. |
| V12 | Personal addresses | `rg` over the changed files finds no address other than ones on getbrandgeo.com; the runbook says every account and contact uses the project address. |
| V13 | Dashes | `rg '\x{2014}|\x{2013}'` over the added lines returns nothing, with a positive control file that does fire. |
| V14 | No LLM call and no enqueue | Neither simulate branch nor the watchdog references `_collect`, `_enqueue`, or any engine host. |

Report: `docs/qa/observability-030-review.md`.

## 13. HUMAN CHECKPOINTS

1. **Schema change.** New schema `ops`, two tables, four functions, one
   cron job (`obs-watchdog`), two Vault secrets. It is additive and touches
   no existing table. Migration file:
   `db/supabase-observability-watchdog-2026-10-28.sql`. Rollback is
   `cron.unschedule('obs-watchdog')`, then `drop schema ops cascade`, then
   delete the two secrets. Applied by Constantin by hand, part A then
   part B. Packet 029 (staging) is not live, so no rehearsal is possible
   first.
2. **New dependency.** `@sentry/browser`, 35 KB gzip ceiling, in a lazy
   chunk only. This is a new third-party service by ruling (2026-10-28).
3. **Data sent to a third party.** Error events go to Sentry under the
   section 7 rules. Not customer data by construction; bg-verify proves it
   with V7.

## 14. Questions, all RULED 2026-10-28

Constantin ruled all four at the defaults on 2026-10-28 ("Q1-Q4 implicit").
None is open.

| # | Question | Ruling |
|---|---|---|
| Q1 | Add `.github/workflows/dashboard-ci.yml` to catch failures 3 and 4? Alerts go through Resend with a GitHub secret, because GitHub's own failure mail goes to the account email, which may not be a project address. | **RULED 2026-10-28: yes.** In scope, with the F15 hardening in section 10. |
| Q2 | Sentry data region | **RULED 2026-10-28: EU.** CSP `https://*.ingest.de.sentry.io`. |
| Q3 | Keep the getbrandgeo.com `/` monitor, which catches none of the six? | **RULED 2026-10-28: keep.** |
| Q4 | `schedule-collections` alerts after 2 consecutive failures, not 1 | **RULED 2026-10-28: 2.** The backtest shows the single blips were noise. |

## 15. Later (named, not built)

- Source maps
- Wraps on the webhook, MCP and affiliate API
- One recipient constant in place of three code defaults
- Renaming `affiliate_rate_check` to a neutral name
- Purge for `job_runs`
- The marketing site's deploy signal (packet 031 territory)

## 16. Review response (revision 2, 2026-10-28)

Answers `docs/qa/observability-030-spec-review-2026-10-28.md`. One row per
finding. Where the review offered a fix it was applied as written unless
the row says otherwise. Not changed, because the review confirmed them: the
`ops` access model, the `:50` slot, the backtests, the browser Sentry
configuration, the CSP line, and the deploy order apart from step 10.

| Finding | Change made | Sections |
|---|---|---|
| F1 HIGH, collectors missing from `scope_write` | The four collectors are listed under the scope additions, each limited to the wrap and one capture at the insert or upsert error with no other change; section 3.2 names the callers that must see no difference. The orchestrator has already amended the packet. | 3.2, 10 |
| F2 HIGH, quiet hours read as failed sends | A run that sends nothing writes `request_id` null; the next run reads `ok = true`. `ok = false` only when the previous non-null request got a non-2xx answer, or none within 10 minutes. **Refined beyond the review:** (a) a response row with a null `status_code` (`timed_out` or `error_msg` set) also counts as failure; (b) a previous run older than 5 hours is not judged and reads `ok = true` with `prev_unjudged`, because `pg_net.ttl` is 6 hours (read 2026-10-28) and its response may be purged, while `health.js` already flags the stale watchdog itself; (c) the rule lives in one STABLE function, `ops.watchdog_prev_ok`, so V9b can test it in a rolled-back transaction. V9c checks two quiet runs both write `ok = true`. Runbook step 10 now reads "after step 9". | 3.6, 11, 12, runbook 3 |
| F3 MEDIUM, watchdog alerts on itself | Both of the review's options, together: `obs-watchdog` is seeded `enabled = false` with a note, and it is excluded by name from every `job_*` kind. | 3.6, 11 |
| F4 MEDIUM, simulate gate fails open if `checkInternalKey` is reused | The gate fails closed when `INTERNAL_AUDIT_KEY` is unset or empty, compares with `timingSafeEqual` after a length check, and must not reuse `checkInternalKey` or a plain `===`. Tested in V1; V6 adds a different-length key. | 3.3, 10, 12 |
| F5 MEDIUM, a send can push a collector past 26 s | Deadline is `min(2000, remaining() - 500, 2000 - send_ms_spent)`; skip below 300 ms; at most 2,000 ms of send time per invocation in total. **Added:** the per-invocation budget and 5-event cap live in `AsyncLocalStorage` (`node:async_hooks`, built in), never at module scope, so a warm container does not carry them over and a deep capture finds its own budget. | 3.1, 9, 10, 12 |
| F6 MEDIUM, `jobs` cannot see pg_net or Netlify silence | `jobs` excludes `obs-watchdog`; the rationale now reads: `jobs` proves `pg_net` plus Netlify, `watchdog` proves `pg_cron` plus Resend. | 2, 3.3, 4 |
| F7 MEDIUM, PostgREST error objects carry row text | Non-Error input sends only `String(err.message)` with type `NonError` and the tag `pg_code`; `details` and `hint` are never read. The scrub regex gains `details|hint`. **Added:** `pg_code` is exempt from the key-deletion rule alongside `fn`, since otherwise rule 3 would delete it (it contains no listed word today, but the exemption makes the intent explicit). Fixture case added. | 3.1, 7, 10 |
| F8 LOW, scrub destroys `release` and `event_id` | Rule 4 is limited to an explicit field list; `event_id`, `release`, `environment`, `timestamp` and `platform` are never rewritten. Fixture asserts `release` survives; V7 checks it in Sentry. **Added:** the two path-token shapes the review asked for, with a rule 2 clause that rewrites them to `[token]`. | 7, 12 |
| F9 LOW, dedupe spent on a failed send; failure mailed through the failed path | `watchdog_send_failed` is removed from the Finding union entirely, not only from email. A failed send sets `ok = false` and deletes that run's `alert_log` rows, so the findings re-send on the next run. `watchdog_send_test` writes no `job_runs` and no `alert_log` row. | 3.6 |
| F10 LOW, `ping-sitemap` "no urls parsed" missed | New `job_failed` clause for `ping-sitemap`: the newest 2 rows both carry that note. Backtest: the only two such rows (2026-08-03, 2026-10-27) are isolated, so neither fires. | 3.6, 4 |
| F11 LOW, health contradicts itself on a throw | `health.js` has its own top-level catch answering exactly 500 `{"error":"internal"}` and never rethrows; the wrapper's rethrow applies to the collectors and the worker only. V7 expects exactly that body. | 3.1, 3.2, 3.3, 12 |
| F12 LOW, `_build_info.json` may not ship | Static `require('./_build_info.json')` of the literal path in a try, null fallback; computed paths and `fs.readFileSync` forbidden. | 3.1, 3.4 |
| F13 LOW, rate-limit RPC has no deadline | Raced against 1,500 ms; on timeout or error the request is served (fails open), never a 429 on an RPC error, never a fallback pepper. | 3.3 |
| F14 LOW, secrets scanner may fail the build | `VITE_SENTRY_DSN` is appended to `SECRETS_SCAN_OMIT_KEYS` (`netlify.toml:24`) with a one-line comment; `SENTRY_DSN` is never omitted. | 10 |
| F15 LOW, CI workflow trigger and secret | Q1 ruled yes, so the workflow is in scope with the hardening as binding text: push to `main` only, no `pull_request`, `pull_request_target` or `workflow_run`, top-level `permissions: contents: read`, the Resend key only in the final mail step's `env`. | 10, 14 |
| F16 INFO, function hygiene | All four `ops` functions (one more than the review saw, see F2) are SECURITY INVOKER with `set search_path = ''` and every reference schema-qualified; V10 checks `proconfig` and `prosecdef`. | 3.6, 12, 13 |

Rulings folded in: Q1 to Q4 were ruled at the defaults on 2026-10-28
(section 14). Packet 030's `scope_write` workflow line now reads "(Q1 ruled
yes 2026-10-28)", updated by the orchestrator the same day.
