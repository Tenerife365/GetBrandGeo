---
id: 030
from: bg-orchestrator
to: devops team (bg-architect on Opus for the design, bg-backend on Opus for functions, cron and alert routing, bg-app on Sonnet for the SPA client, bg-web on Sonnet for the marketing site tag and CSP, bg-verify on Opus)
status: READY
created: 2026-10-14
scope_write: docs/arch/observability.md, docs/ops/alerting-runbook.md, brandgeo-dashboard/netlify/functions/_observability.js, brandgeo-dashboard/netlify/functions/health.js, brandgeo-dashboard/netlify/functions/_auth.js (one wrap only), brandgeo-dashboard/src/lib/observability.ts, brandgeo-dashboard/src/main.tsx, brandgeo-dashboard/netlify.toml, brandgeo-dashboard/package.json, db/supabase-job-runs-watchdog-<date>.sql, brandgeo/web/.htaccess (CSP line only), brandgeo/web/observability.js, .claude/handoffs/030-*.md (status line only)
scope_read: everything under brandgeo-dashboard/, brandgeo/web/, db/, docs/arch/, docs/TECH-STACK.md
model: opus (design, backend, verify), sonnet (app, web)
---

Kickoff line for the new session:

```
Read .claude/handoffs/030-bg-orchestrator-to-devops-team-error-tracking-uptime-alerting.md and design, then build, error tracking, uptime checks and alerting.
```

## Decision

Constantin, 2026-10-14: "o alta sesiune de devops experti sa implementeze
error tracking, uptime check si alertare." Three capabilities, in this
order of value: (1) a silent scheduled job or a failing function is noticed
within a day without anyone opening a dashboard; (2) a JavaScript error in
the product or a thrown error in a function is recorded with its release
and stack; (3) both public hosts are checked from outside every few
minutes. Free tiers only unless a ruling says otherwise.

## What exists today (measured 2026-10-14, do not re-derive)

- No error tracking on either surface. No `@sentry/*` or equivalent in
  `package.json`. Function errors go to Netlify's console log, read only in
  the Netlify UI, retention days, no search across invocations.
- No uptime check anywhere. No health endpoint: `ping-sitemap.js` and
  `social-status.js` are the only names that sound like one, and neither is.
- Alerting is admin email through Resend for a handful of named events
  (checkout without acceptance, account deleted, budget blocks), sent to
  `ADMIN_ALERT_EMAIL`. Nothing fires on a cron job failing or on a job not
  running at all.
- `public.job_runs` records every scheduled run (eight `pg_cron` jobs, all
  via `pg_net` with a Vault secret). Its `ok` column is true whenever a
  submitter was configured; the real signal is inside `detail`. A job that
  stops being scheduled writes nothing, which is the failure nobody sees.
- CSP is strict on both hosts. Dashboard: `netlify.toml` line 51,
  `connect-src` lists Supabase, four API hosts and askmywebsiteai. Marketing
  site: `.htaccess` line 42, `connect-src` lists the app, formsubmit and GA.
  Any ingest host must be added or the client silently sends nothing.
- Netlify functions share one 4 KB environment ceiling (the Google key was
  dropped for it). A DSN is about 100 bytes; budget it anyway.
- Alert mail must use an address on the project domain
  (`alerts@getbrandgeo.com` or the existing `ADMIN_ALERT_EMAIL`), never a
  personal or cross-project address.
- Netlify builds are about two a day platform wide; everything here rides
  one build.

## How to run the expert team

One `Workflow`, concurrency 2, no builds and no browsers inside agents.

**Stage 0, judge panel.** Three designers (Sonnet, effort high) each return
a full `docs/arch/observability.md` candidate; three Opus judges score.
Lenses:

1. **Zero new vendors.** A `pg_cron` watchdog over `job_runs` that emails
   through Resend via `pg_net` when any expected job has no run in its
   window or its last `detail` reports failure; a `health.js` function
   that checks Supabase reachability and the newest `job_runs` row; a
   function-side error wrapper that writes to a `function_errors` table
   and emails on first occurrence per hour. Uptime from a free external
   pinger only.
2. **Standard SaaS stack.** Sentry free tier for SPA (`@sentry/react`) and
   functions (`@sentry/node` wrapped in `_observability.js`), releases
   tagged from Netlify's `COMMIT_REF`, source maps uploaded at build;
   Better Stack or UptimeRobot free tier hitting three URLs; alert routing
   to the project email and, if Constantin wants, a phone push.
3. **Signal over coverage.** Start from the five failures that actually
   happened in this project's history (the cron that fails hourly when a
   secret is missing, the function timeout that reads as "found nothing",
   the deploy that built ten days late, the test suite red for a month,
   the insert failure answered with `done: true`) and design the minimum
   that would have caught each, then stop.

Judges score 1 to 5 on: catches the five historical failures, monthly cost,
bytes of env and bundle added, PII risk, maintenance burden. The
orchestrator synthesises and records provenance in the arch doc.

**Stage 1, build.** bg-backend (functions, cron SQL, alert routing), then
bg-app and bg-web in parallel (disjoint scopes), then bg-verify.

## Design constraints the synthesis must honour

- **Watchdog is mandatory whatever else is chosen.** A `pg_cron` job that
  runs every hour, compares each expected job name against its last
  `job_runs` row and the real success field in `detail`, and sends one
  email per failing job per day through Resend via `pg_net`, with the
  Resend key read from Supabase Vault. It must also alert when a job has
  written nothing for longer than twice its interval, which is the case
  no log-based check can see. SQL file in `db/`, applied by Constantin
  after staging rehearsal if packet 029 is live, otherwise by hand with the
  verification query in the runbook.
- **Health endpoint.** `health.js`: unauthenticated GET, no secrets in the
  response, returns status, commit ref, Supabase round trip in ms, age of
  the newest `job_runs` row, and HTTP 503 when any check fails. Rate limit
  by IP hash like the affiliate functions. Timeout 10 s. It is the uptime
  target for the dashboard; the marketing site target is `/` itself.
- **Error tracking, if a vendor is chosen:** DSN in one env var per surface;
  `beforeSend` strips emails, prompt text, response snippets, tokens and
  anything under `brand_*`; sample rate for performance is zero (errors
  only); the SPA init lives in `src/lib/observability.ts` and is a no-op
  when the DSN is absent so demo and local builds send nothing; functions
  wrap the handler once in `_observability.js`, never per file. CSP lines
  on both hosts gain exactly the ingest host.
- **Alert routing.** One place, the runbook, lists every alert, its
  source, its recipient and its daily cap. No alert goes to a personal
  address. The existing Resend admin alerts are listed too so the picture
  is complete.
- **Cost of silence.** Each check in the design states what it costs when
  healthy (invocations per month, rows per day). A five minute pinger is
  about 8,640 invocations a month per URL; say so and stay under the free
  function quota.
- **Deploy order.** Env vars set in Netlify first (they are read at
  deploy), then one dashboard push with `$env:BATCH_PUSH=1`, then the cron
  SQL, then the external pinger pointed at the live health URL. Never the
  pinger before the endpoint exists, or it alerts on day one.

## Open questions for Constantin (defaults apply if silent)

**RULED 2026-10-28, Constantin: defaults ("Pentru punctul 4, implicit").**
Sentry free tier, errors only, both surfaces; UptimeRobot free;
alerts to `ADMIN_ALERT_EMAIL` as set today; no phone push.

1. Sentry free tier yes or no (default yes, errors only, both surfaces).
2. External pinger: UptimeRobot free (default) or Better Stack free.
3. Alert recipient: `ADMIN_ALERT_EMAIL` as set today (default) or a new
   `alerts@getbrandgeo.com` alias he creates in Workspace.
4. Phone push on a down alert: no (default) or yes via the pinger's app.

## Hard rules, binding

- No em or en dashes anywhere; `rg` scan with a positive control.
- Agents never create accounts or projects on Sentry, UptimeRobot, Better
  Stack or anywhere else; the runbook gives the click path, Constantin
  creates them and types the DSN and keys into Netlify and Vault. No key
  value passes through chat or the repo.
- No real person, client or prospect in any committed file.
- Commit by pathspec; check `.git/index.lock`; PowerShell commands only.
- Never trigger a collection or an audit, never call an LLM API, to "test"
  error capture. Use a dedicated `?simulate=error` branch on `health.js`
  guarded by `INTERNAL_AUDIT_KEY`, and remove nothing else.
- Judge the deploy by a unique string in the live bundle, never a local
  `dist/` hash.

## Done means

1. `docs/arch/observability.md` with the three designs' scores and the
   synthesis; `docs/ops/alerting-runbook.md` with the alert table.
2. Code built, `npm run build` exit 0, added lines dash-free, a test file
   for the function wrapper and the watchdog predicate (plain Node, like
   `tests/`).
3. One commit per surface by pathspec, one Netlify build, deploy verified
   by the live bundle string and by `GET /.netlify/functions/health`
   returning 200 with a commit ref that matches `origin/main`.
4. The watchdog proven: one `job_runs` row inserted with a failing
   `detail` inside a transaction that is rolled back, after observing the
   predicate select it; and one real email received on the project address
   from the simulate branch.
5. bg-verify report `docs/qa/observability-030-review.md`: PII scrub
   checked against a captured payload, CSP lines proven live by header,
   health endpoint leaks nothing, no personal address anywhere.
6. Closing message Completed / Requires your action / Still pending with
   every external click path numbered.

## Not in scope

Log shipping, metrics dashboards, tracing, paid tiers, the marketing site's
deploy signal (packet 031), staging (packet 029).
