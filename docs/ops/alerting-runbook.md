# Alerting runbook

Owner: Constantin. Design record: `docs/arch/observability.md` (packet 030).
Written 2026-10-28, before the build. Each step says if it can be done now
or only after a later step. Revised the same day after bg-verify's
pre-build review; Q1 to Q4 are ruled (design section 14), so nothing below
is conditional.

**Rules.**
- No key, DSN, or secret value is ever pasted into chat, a commit, an
  issue, or this file. You type values straight into the place that keeps
  them.
- Every account and alert contact uses the project address, the one set as
  `ADMIN_ALERT_EMAIL` in Netlify today. Never a personal address, never a
  TalentWeLove address.
- Agents create no accounts. Every account below is yours to create.

## 1. Every alert in one table

| # | Alert | What it means | Source | Recipient | Cap |
|---|---|---|---|---|---|
| 1 | Sentry: new issue, `brandgeo-app` | A JavaScript error in the dashboard, or a function answered the dashboard with a 5xx (timeouts included) | Sentry | project address | one email per new issue; 100 events an hour per key |
| 2 | Sentry: new issue, `brandgeo-functions` | A collector could not save a result, a scheduled collection job failed, or a function came within 1.5 s of its timeout | Sentry | project address | same |
| 3 | `[BrandGEO alert]` digest | A scheduled job failed, went quiet, was unscheduled, or is not watched; an AI engine is down or degraded; collection jobs failed or stuck | Postgres `ops.watchdog_run()` through Resend | Vault `alert_email` (project address) | at most one email an hour; each alert key at most once a UTC day |
| 4 | UptimeRobot: `health` down or up | The dashboard host is down; Supabase is unreachable; no scheduled Netlify job (the `pg_net` path) has written for 3 hours; the watchdog row is older than 3 hours (`pg_cron` stopped); or the watchdog's previous email was refused (Resend) | UptimeRobot | project address | on change only |
| 5 | UptimeRobot: getbrandgeo.com down or up | The marketing site is down | UptimeRobot | project address | on change only |
| 6 | `[BrandGEO CI]` (Q1 ruled yes 2026-10-28) | Tests failed on `main`, or the dashboard did not go live within 20 minutes of a push | GitHub Actions through Resend | GitHub secret `ALERT_EMAIL` (project address) | one per failing run |
| 7 | Existing event emails, unchanged | See section 1.1 | Netlify functions through Resend | `ADMIN_ALERT_EMAIL` | one per event |

### 1.1 Existing event emails (already live, listed for completeness)

| Event type | Sent by | When |
|---|---|---|
| new subscription, package or paid signup | `stripe-webhook.js` | a paid checkout provisions an account |
| `checkout_without_acceptance` | `stripe-webhook.js` | a payment arrived with no terms acceptance on record |
| `package_unprovisioned` | `stripe-webhook.js` | a package was paid but could not be provisioned |
| `subscription_changed` | `stripe-webhook.js` | a subscription changed plan |
| `subscription_canceled` | `stripe-webhook.js` | a subscription was canceled |
| `plan_expiry_held` | `expire-plan-grants.js` | a granted plan reached its end date and was held, not reverted |
| `trial_expired` | `expire-plan-grants.js` | a trial ended |
| `account_deleted` | `delete-client.js` | an admin deleted an account |
| `new_signup` | `provision-account.js` | a self-serve signup finished onboarding |
| `support_ticket` | `support-request.js` | a support ticket marked high or urgent |
| affiliate admin mails | `_affiliate_email.js` | affiliate applications and payouts |
| assistant lead | `assistant-lead.js` | the website assistant captured a lead |

## 2. What to do when an alert arrives

| Alert | First check | Usual fix |
|---|---|---|
| `job_failed:<job>` | `select ran_at, ok, detail from job_runs where job = '<job>' order by ran_at desc limit 5;` | Read `detail.error`. A missing secret means a Netlify variable plus a redeploy. `NO_CREDENTIALS` and `gmail not configured` are this class. For `ping-sitemap`, two days of `detail.note = 'no urls parsed'` means the live `sitemap.xml` is not parseable: open it and check it is well-formed XML. |
| `job_silent:<job>` | `select jobid, jobname, active from cron.job;` | The job is paused, deleted or failing before it writes. Check `cron.job_run_details` for its jobid. |
| `job_unscheduled:<job>` | the same query | Expected after a deliberate unschedule; set `enabled = false` on its row in `ops.watch_expectations`. |
| `job_unwatched:<job>` | the same query | A new cron job exists. Add a row to `ops.watch_expectations` with `max_silence` at twice its interval. |
| `engine_down:<llm>` | `select status, error_code, count(*) from ai_results where llm = '<llm>' and checked_at > now() - interval '24 hours' group by 1,2;` | `quota_exceeded`: top up that provider (OpenRouter for perplexity and grok). `api_error` or `auth_error`: check the key in Netlify. Confirm with one admin single-cell refresh. |
| `engine_degraded:<llm>` | the same query | As above, watch the next hour. |
| `collection_jobs_failed` | `select status, count(*), max(error) from collection_jobs where created_at > now() - interval '24 hours' group by 1;` | Read `error`; it pairs with a Sentry event in `brandgeo-functions`. |
| Sentry new issue | Open the issue; read the `fn` tag and the release | A release that does not match `origin/main` means the deploy is stale, not that the code is wrong. |
| UptimeRobot `health` down | Open `https://app.getbrandgeo.com/.netlify/functions/health` | The body says which check failed. `supabase` false: Supabase is down or the service key is wrong. `jobs` false: no scheduled Netlify job wrote for 3 hours, so `pg_net` or Netlify's function path stopped; read `select * from net._http_response order by id desc limit 5;` and the Netlify function log. `watchdog` false: either the watchdog row is older than 3 hours (`pg_cron` stopped; check `cron.job_run_details`) or its last email was refused (Resend; read the `net._http_response` row whose id is the previous run's `detail.request_id`, then fix Vault `resend_api_key`). |

The first watchdog run will report every current problem at once. Claude
recovered on 2026-10-31 (61 ok rows that day, none in error), so the first
digest is most likely empty: expect no mail at the first :50. If one
arrives, it names a problem that is open at that moment. `obs-watchdog` itself never appears in a
finding; if it does, the build is wrong.

A refused watchdog email is never itself emailed (the mail path is what
failed). It shows up only as `health` going down on `watchdog`. Once the
key is fixed, the next run re-sends the findings that mail lost.

## 3. Setup, in order

Do not reorder. Each step only makes things exist; nothing alerts before
step 9.

### Step 1. Sentry account and two projects (now)

1. Open sentry.io and sign up with the project address.
2. When asked for the data storage location, pick **European Union**. The
   build assumes it. If you pick US, tell the orchestrator before the build,
   because one CSP line changes.
3. Create the first project: Projects, Create Project, platform **Browser
   JavaScript**, name `brandgeo-app`, alert setting "Alert me on every new
   issue".
4. Create the second project the same way: platform **Node.js**, name
   `brandgeo-functions`, the same alert setting.
5. In each project: Settings, Security and Privacy.
   - Data Scrubber: on.
   - Use Default Scrubbers: on.
   - Prevent Storing of IP Addresses: on.
6. In `brandgeo-app` only: Settings, Security and Privacy, Allowed Domains,
   enter `app.getbrandgeo.com`.
7. In each project: Settings, Client Keys (DSN), Configure, Rate Limiting,
   set 100 events per hour.
8. User Settings, Notifications: confirm issue alerts go to the project
   address.
9. Leave both Client Keys pages open for step 4. Do not copy the DSNs
   anywhere else.

### Step 2. Resend send-only keys (now)

1. Open resend.com, API Keys, Create API Key.
2. Name `supabase-watchdog`, permission **Sending access**, domain
   `mail.getbrandgeo.com`. Create, and keep the page open for step 5.
3. One more, named `github-ci`, with the same settings (Q1 ruled yes).
   Keep it open for step 6.

The existing Netlify `RESEND_API_KEY` stays as it is. Separate keys let you
revoke one place without breaking the others.

### Step 3. UptimeRobot account (now, but no monitors yet)

1. Open uptimerobot.com and sign up with the project address.
2. My Settings, Alert Contacts: confirm the project address is the default
   email contact.
3. Create no monitor yet. Monitors are step 10, after the endpoint exists.

### Step 4. Netlify environment variables (now)

1. Open app.netlify.com, the dashboard site, Site configuration,
   Environment variables, Add a variable, Add a single variable.
2. Key `SENTRY_DSN`, value the DSN from Sentry `brandgeo-functions`.
   Scopes: **Functions** only. Same value for all deploy contexts. Create.
3. Key `VITE_SENTRY_DSN`, value the DSN from Sentry `brandgeo-app`.
   Scopes: **Builds** only. Create.
4. Do not trigger a deploy for these. They are read at the next build, and
   nothing reads them until the code ships.
5. The build lists `VITE_SENTRY_DSN` in `SECRETS_SCAN_OMIT_KEYS` in
   `netlify.toml`, because a browser DSN is public by design and the
   scanner would otherwise fail the build. `SENTRY_DSN` is never on that
   list. Nothing to do here; it is noted so a failed scan is not a
   surprise.

### Step 5. Supabase Vault secrets (now)

1. Open the Supabase dashboard, project `duiyifepitvugyulobqm`,
   Integrations, Vault, Secrets, Add new secret.
2. Name `resend_api_key`, value the `supabase-watchdog` key from step 2.
   Save.
3. Name `alert_email`, value the project address. Save.
4. If the Vault page is not available, use the SQL editor with
   `select vault.create_secret('<value>', '<name>');`. Do not save that
   query as a snippet. Clear the editor afterwards.
5. Check, without revealing values:
   `select name, created_at from vault.secrets order by name;`
   should list `alert_email`, `cron_secret` and `resend_api_key`.

### Step 6. GitHub secrets (now; Q1 ruled yes)

The workflow runs only on a push to `main`, never on a pull request, and
only its final mail step can read these two secrets. A pull request from a
fork therefore never sees them.


1. Open github.com, the repository, Settings, Secrets and variables,
   Actions, New repository secret.
2. Name `RESEND_API_KEY`, value the `github-ci` key. Add.
3. Name `ALERT_EMAIL`, value the project address. Add.

### Step 7. Build and push (after the build is reviewed)

1. In PowerShell:

   ```
   cd "C:\Users\const\Constantin Daniel Goane\BrandGEO"
   git log origin/main..HEAD --oneline
   $env:BATCH_PUSH=1; git push
   ```

2. Wait about 2 minutes.
3. Open `https://app.getbrandgeo.com/.netlify/functions/health`. Expect
   `"status":"ok"` and a `commit` equal to the newest hash from
   `git log -1 --format=%H`. The `watchdog` check reads `null` until step 9,
   which is correct.

### Step 8. Watchdog part A, then a dry run (after step 7)

1. Supabase dashboard, SQL editor. Open
   `db/supabase-observability-watchdog-2026-10-28.sql`, copy **part A
   only**, and run it.
2. Read back:
   - `select * from ops.watch_expectations order by job;`
     should give nine rows. The `obs-watchdog` row reads `enabled = false`
     on purpose: the watchdog never alerts on itself.
   - `select * from ops.watchdog_findings();`
     lists what would be emailed right now.
3. Send one proof email: `select ops.watchdog_send_test();`. Within a
   minute, a mail with subject `[BrandGEO alert] test` reaches the project
   address.
4. If it does not arrive, read
   `select id, status_code, content from net._http_response order by id desc limit 1;`.
   A 401 or 403 means the Vault key is wrong. Fix it in step 5 and retry.

### Step 9. Watchdog part B, the schedule (after step 8 worked)

1. SQL editor: run **part B** of the same file.
2. Check: `select jobid, jobname, schedule, active from cron.job where jobname = 'obs-watchdog';`
   should show one row, `50 * * * *`, active.
3. At the next :50, a digest arrives if any finding is open. Claude
   recovered on 2026-10-31, so the most likely outcome is no mail at all.
   Use step 9.5 (two quiet runs reading `ok = true`) as the proof, not the
   arrival of a digest.
4. Health now reads `watchdog.ok: true` after the first run.
5. After the second run (the :50 an hour later), read:

   ```
   select ran_at, ok, detail from job_runs where job = 'obs-watchdog' order by ran_at desc limit 2;
   ```

   Both rows read `ok = true`. A run that sent nothing has `sent` 0 and
   `request_id` null. If a quiet run reads `ok = false`, pause the job
   (section 5) and send the two rows to the orchestrator: health would
   otherwise go down every hour with nothing wrong.

### Step 10. UptimeRobot monitors (after step 9)

Not before. Health treats a missing watchdog row as not failing, so an
earlier monitor would stay quiet, but it would also be watching a chain
that is not complete yet. After step 9 every check in the health body is
live and step 9.5 has shown the watchdog reads `ok = true` when quiet.


1. Add New Monitor, type **HTTP(s)**:
   - Friendly name `BrandGEO health`
   - URL `https://app.getbrandgeo.com/.netlify/functions/health`
   - Interval 5 minutes
   - Alert contact: the project address
   - Create.
2. Add New Monitor, type **HTTP(s)**:
   - Friendly name `getbrandgeo.com`
   - URL `https://getbrandgeo.com/`
   - Interval 5 minutes
   - The same contact
   - Create.
3. Both should read Up within 5 minutes.

Each monitor is about 8,640 checks a month. Only the health monitor runs a
Netlify function.

### Step 11. Proof that each path reaches you (after step 10)

1. **Sentry functions path.** In PowerShell, typing the key yourself from
   Netlify (never paste it into chat):

   ```
   $k = Read-Host "INTERNAL_AUDIT_KEY"
   curl.exe -s -o NUL -w "%{http_code}`n" -H "X-Internal-Key: $k" "https://app.getbrandgeo.com/.netlify/functions/health?simulate=error"
   Remove-Variable k
   ```

   Expect exactly `500` (the body is `{"error":"internal"}`). A `403`
   means the key was mistyped. A Sentry new-issue email from
   `brandgeo-functions` arrives, and the issue's release equals the newest
   commit on `origin/main`.
2. **Watchdog path.** Already proven in step 8.3.
3. **UptimeRobot path.** Pause and resume one monitor; UptimeRobot mails on
   the state change.

## 4. Changing the alert address

The address lives in six places. Change all six the same day:

1. Netlify variable `ADMIN_ALERT_EMAIL`, then one redeploy.
2. Vault: delete and re-add `alert_email` (Integrations, Vault).
3. GitHub secret `ALERT_EMAIL`.
4. Sentry: User Settings, Account Details and Notifications.
5. UptimeRobot: My Settings, Alert Contacts.
6. The code fallback `'support@getbrandgeo.com'` in `_admin_notify.js`,
   `expire-plan-grants.js` and `_affiliate_email.js`. It only matters when
   item 1 is unset. A builder changes it, not you.

## 5. Turning things off

| To stop | Do |
|---|---|
| The watchdog, temporarily | `select cron.alter_job(job_id => (select jobid from cron.job where jobname = 'obs-watchdog'), active => false);` |
| The watchdog, for good | `select cron.unschedule('obs-watchdog');` then `drop schema ops cascade;` then delete Vault `resend_api_key` and `alert_email` |
| Sentry sending | Delete `SENTRY_DSN` and `VITE_SENTRY_DSN` in Netlify, then one redeploy; the code becomes a no-op |
| One monitor | UptimeRobot, the monitor, Pause |
| A leaked Resend key | Resend, API Keys, revoke that one key; only its location stops sending |

`cron.unschedule` deletes the job row. To pause, use `cron.alter_job`.
