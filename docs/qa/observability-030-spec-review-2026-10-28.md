FAIL

# Packet 030 observability spec, pre-build review

Reviewer: bg-verify (Opus). Date: 2026-10-28.

Subject: `docs/arch/observability.md` (801 lines) and `docs/ops/alerting-runbook.md` (241 lines), both by bg-architect. Reviewed against packet `.claude/handoffs/030-bg-orchestrator-to-devops-team-error-tracking-uptime-alerting.md`.

Method: read-only. Production reads were SELECT only, on project `duiyifepitvugyulobqm`. Nothing was built, run, committed or sent. No reviewed file was edited.

## Verdict

**FAIL. Do not start the build from the spec as written.**

Two findings block it:

- **F1.** The file plan modifies four collection functions. None of them is in the packet's `scope_write`, and none is in the architect's proposed amendment. A builder must either break scope or skip coverage of failure 5. Breaking scope is an automatic BLOCK at review.
- **F2.** Read literally, the watchdog's `ok` rule marks every quiet, healthy hour as a failed send. From runbook step 9 onward, `health.js` would return 503 permanently. UptimeRobot would show "down" from the moment its monitor is created, and real outages would be masked behind it.

Everything else can be fixed as text in the same revision. The design is sound:

- The `ops` grant model holds.
- `:50` collides with nothing.
- The engine rules reproduce the stated backtest with no false positive.
- The SPA Sentry configuration cannot ship request bodies, headers or tokens.

Route:

1. bg-architect revises sections 3.1, 3.2, 3.3, 3.6, 7, 10 and 11, plus the runbook.
2. The orchestrator amends the packet scope.
3. bg-verify re-reviews only the changed sections.

## Findings, ranked

### F1. HIGH. Collectors are missing from scope_write

**Evidence**

- `observability.md` section 3.2 (lines 267 to 271) and section 10 (lines 665 to 667) modify `collect-prompt.js`, `collect-claude.js` and `collect-chatgpt.js`. They also wrap `collection-worker-background.js`.
- The packet's `scope_write` names none of these four files. A grep of the packet for those names returns nothing.
- The amendment list in section 10 (lines 703 to 715) adds `package-lock.json`, `.gitignore`, the tests, the fixture, two db files, `observabilitySentry.ts` and the workflow. It does not add the four collectors.

**What breaks (process)**

- If bg-backend builds to the file plan, bg-verify calibration step 1 finds four files outside `scope_write`. That is an automatic BLOCK.
- If bg-backend skips those files instead, failure 5 (section 4 table, row 5) loses its B-path coverage.

**Change**

In section 10, "These are added", list:

- `brandgeo-dashboard/netlify/functions/collect-prompt.js`
- `brandgeo-dashboard/netlify/functions/collect-claude.js`
- `brandgeo-dashboard/netlify/functions/collect-chatgpt.js`
- `brandgeo-dashboard/netlify/functions/collection-worker-background.js`

Give each the note "wrap and one capture at the insert or upsert error, no other change". The orchestrator writes the same four into the packet's `scope_write`.

### F2. HIGH. The watchdog `ok` rule reads every quiet hour as a failed send

**Evidence**

- Section 3.6, lines 437 to 438: "ok = false only when the PREVIOUS run's request in net._http_response is non-2xx or absent after 10 minutes".
- Section 3.6, "Cost when healthy": the watchdog "makes no `pg_net` call ... when there are no findings".
- `job_runs.detail` is specified as `{findings, sent, send_failed}` with no request id. `request_id` exists only on `ops.alert_log` rows, and a quiet run writes none.
- The predicate row `watchdog_send_failed` (line 459) reads "The previous run's `request_id` has a non-2xx or missing response". It leaves the no-request case undefined too.

**Exploit path**

1. After the first digest, Constantin fixes the reported problem.
2. The next run finds nothing and sends nothing.
3. The run after that finds the previous request "absent" and writes `ok = false`.
4. Every run after that does the same.
5. `health.js` reads the newest `obs-watchdog` row and answers 503 (section 3.3, line 313: `false` when that row has `ok = false`).
6. UptimeRobot alerts on state change only. Constantin gets one "down" email, then silence.
7. The monitor is now stuck at down, so a real outage later causes no further state change.

The very first run has no previous run, so it hits the same branch. Under this rule, the runbook claim in step 9.4 ("Health now reads `watchdog.ok: true` after the first run") is false.

**Change**

Replace lines 437 to 438 and the `watchdog_send_failed` rule with:

> `watchdog_run()` writes `detail.request_id`: the bigint returned by `net.http_post`, or null when nothing was sent.
>
> `ok = false` only when the previous `obs-watchdog` row has a non-null `detail.request_id`, and `net._http_response` for that id either:
> - is a row with `status_code` outside 200 to 299, or
> - has no row while `now() - previous.ran_at > interval '10 minutes'`.
>
> A previous row with a null `request_id`, or no previous row at all, gives `ok = true`.

Add a V-check: two consecutive dry runs with no findings both write `ok = true`.

### F3. MEDIUM. The watchdog alerts on itself on its first run, against its own seed comment

**Evidence**

- Line 403 seeds `obs-watchdog job_runs 3h (self, read by health.js, not alerted on by itself)`.
- The predicate table excludes `obs-watchdog` only from `job_unscheduled` (line 455).
- `job_silent` (line 454) and `job_failed` (line 453) apply to every enabled expectation.
- `watchdog_run()` computes findings in step 1 and inserts its own `job_runs` row in step 3 (lines 428 to 436).

**Exploit path**

- At the runbook step 8.2 dry run and at the first scheduled run (step 9), no `obs-watchdog` row exists yet. `job_silent:obs-watchdog` is returned and emailed.
- That contradicts section 11 step 9 and runbook section 2, which say: "Expected: `engine_down:claude` ... and nothing else".
- After any failed send, `job_failed:obs-watchdog` is queued for email through the same Resend path that just failed. It also uses up the day's dedupe slot.

**Change**

Do one of the following:

- Add to the predicate table: "`obs-watchdog` is excluded from every `job_*` kind; its health is reported only by `watchdog_send_failed` and by `health.js`."
- Or seed the row with `enabled = false` and a note that `health.js` reads it directly.

Update the section 11 step 9 expectation to match.

### F4. MEDIUM. The simulate gate must fail closed, but the obvious code to reuse fails open

**Evidence**

- Section 3.3, lines 323 to 324: "honoured only with header `X-Internal-Key` equal to `INTERNAL_AUDIT_KEY`".
- The only existing implementation of that comparison is `checkInternalKey` in `collection-worker-background.js:35-43`. It returns `true` when `INTERNAL_AUDIT_KEY` is unset.
- A naive `headers['x-internal-key'] === process.env.INTERNAL_AUDIT_KEY` is also true when both sides are `undefined`.

**Exploit path**

If the variable is ever unset or renamed:

- Any anonymous caller can send `GET /.netlify/functions/health?simulate=timeout`. Each request holds a function for 10 s.
- With no pepper there is no throttle, because section 3.3 skips the rate limit when `IP_HASH_PEPPER` is unset.
- `?simulate=error` spends the Sentry free quota and pages the project address.

This is not live today: the variable was confirmed set on 2026-07-28, and the code is not built.

**Change**

Add to section 3.3:

> If `INTERNAL_AUDIT_KEY` is unset or empty, every `simulate` request answers 403. Compare with `crypto.timingSafeEqual` on equal-length buffers, after a length check. Do not reuse the worker's `checkInternalKey`.

Add a unit test case "key unset, header absent" that expects 403.

### F5. MEDIUM. An awaited Sentry send can push a collector past its 26 s timeout

**Evidence**

- Section 3.1 rules 2 and 3 (lines 254 to 259): each send is awaited with a 2,000 ms abort (1,000 ms only on the near-timeout path), with up to 5 events per invocation.
- `netlify.toml:88-95` gives the three collectors `timeout = 26`.
- The insert error capture runs after the engine call (`collect-chatgpt.js:85-89`, `collect-claude.js:76-80`).
- CLAUDE.md section 2.2 records ChatGPT web-search calls at 20 to 25 s.

**Exploit path**

1. The engine returns at about 25 s and the insert fails.
2. `captureException` waits up to 2 s on a slow or unreachable ingest.
3. Netlify kills the function at 26 s.
4. The client gets a 5xx instead of the `{ done: false, reason: 'insert_error' }` it is coded to read.

Two related problems:

- Five sequential captures can add 10 s to any wrapped function.
- If the 5-event counter is a module variable, a warm container keeps the count across invocations. After its fifth event, it stops reporting for the rest of its lifetime.

**Change**

Replace rules 2 and 3 with:

> - Every send's abort is `min(2000, context.getRemainingTimeInMillis() - 500)`.
> - A send is skipped when that value is below 300 ms.
> - Total send time per invocation is capped at 2,000 ms across all events.
> - The event counter and the time budget live in the closure the wrapper creates per invocation, never at module scope.

Add a test that fakes `getRemainingTimeInMillis()` at 1,000 ms and asserts no send is attempted.

### F6. MEDIUM. Once the watchdog exists, the health `jobs` check cannot see pg_net or Netlify silence

**Evidence**

- Section 3.3, lines 303 to 307: `jobs` is "the newest `job_runs.ran_at` of any job ... 3 hours of silence means `pg_cron` or `pg_net` stopped".
- The watchdog writes its own `job_runs` row every hour, from inside Postgres, without `pg_net` (line 436).
- Production evidence: there are **0** `job_runs` rows between 05:15 and 12:05 UTC on 2026-10-21 (SELECT `count(*)`, this review).
  - In that window, `schedule-collections` was lost every hour and `expire-plan-grants` was lost at 06:10.
  - Meanwhile, `cron.job_run_details` recorded every one of those runs as succeeded.

**Exploit path**

1. The same failure happens after go-live.
2. `obs-watchdog` rows keep arriving hourly, so the `jobs` check stays green.
3. The only remaining signal is the watchdog's `job_silent` email. That email goes through `pg_net`, which may be the component that stopped.
4. Detection now depends on F2 being right and on `watchdog_send_failed`, one hop later than designed.

**Change**

In section 3.3, change the check to: "`jobs` is the newest `job_runs.ran_at` where `job <> 'obs-watchdog'`."

Correct the rationale to say what each check proves:

- `jobs` covers `pg_net` plus Netlify.
- `watchdog` covers `pg_cron` plus Resend.

### F7. MEDIUM. Capturing a PostgREST error object can carry response text to Sentry

**Evidence**

- Section 3.2 tells builders to `captureException` at the insert error in `collect-claude.js` (`insErr`, line 78) and `collect-chatgpt.js` (line 86).
- Those are PostgREST error objects, not `Error` instances. Their fields are `message`, `details`, `hint` and `code`.
- For a not-null or check violation, Postgres puts `Failing row contains (...)` in `details`. For `ai_results`, that row includes `response_snippet` and `competitors_mentioned`.
- Section 3.1 does not say how `captureException(err: unknown)` serializes a non-Error.
- The section 7 scrub rules do not catch it:
  - Rule 3's key regex deletes `text|body|snippet` keys, but not `details` or `hint`.
  - Rule 4 scrubs emails, tokens and long character runs, not prose.

**Exploit path**

1. A builder passes `insErr` straight to the capture.
2. The module copies its own fields into the event.
3. An engine answer about a named client leaves for a third party.

That breaks rule 6: "No prompt text, no response text".

**Change**

Add to section 3.1:

> For a non-Error input, the event carries only `String(err.message)` (truncated by rule 5) and `err.code` as the tag `pg_code`. `details`, `hint` and every other field are never read.

Also:

- Add `details` and `hint` to the rule 3 regex.
- Add a fixture case with a `Failing row contains` string that must not appear in the output.

### F8. LOW. Scrub rule 4 would destroy the release and the event id

**Evidence**

- Section 7 rule 4 replaces "any run of 32 or more hex or base64 characters" in "String values".
- Section 3.5 sets `release` to `VITE_RELEASE`, a 40-character commit hash.
- Sentry's `event_id` and `contexts.trace.trace_id` are 32 hex characters.
- Runbook section 2 triage depends on comparing the release to `origin/main`.

**Exploit path**

If the scrub walks the whole event, every event arrives with `release: [secret]`, and the runbook's "release does not match" check becomes impossible.

**Change**

Rule 4 applies only to:

- `exception.values[].value`
- `message`
- `extra`
- `tags`, except `fn` and `pg_code`
- `contexts`, except `trace`
- frame `filename`

`event_id`, `release`, `environment` and `timestamp` are never rewritten. The shared fixture asserts that `release` survives.

### F9. LOW. Dedupe is spent on a failed send, and the send-failure finding is mailed through the failed path

**Evidence**

- Section 3.6 step 2 inserts `alert_log` rows when the request is queued, not when it succeeds.
- The primary key `(alert_key, day)` then suppresses those keys until the next UTC day.
- `watchdog_send_failed` is a `Finding.kind` (line 422), so `watchdog_run()` would mail it through Resend. Line 459 itself calls Resend "the thing that failed".

**Exploit path**

1. At 09:50 the Resend key is wrong, and `engine_down:perplexity` is logged as sent.
2. Constantin fixes the key at 11:00.
3. That outage is not mailed again until the next day, while it continues.

**Change**

- When `watchdog_run()` detects a failed previous send (the F2 rule), it first deletes that run's `alert_log` rows by `request_id`, before step 1. The findings then re-send on the next good run.
- Exclude `watchdog_send_failed` from the email set. Report it only through `job_runs.ok` and `health.js`.

### F10. LOW. `ping-sitemap` "no urls parsed" is a silent failure the rule misses

**Evidence**

- Production `job_runs` holds two rows with `ok = true` and `detail` `{"note": "no urls parsed", "pinged": 0, "changed": 0}`, at 2026-08-03 05:10 and 2026-10-27 05:10 (SELECT, this review).
- The `job_failed` rule (line 453) tests three conditions: `ok = false`, `detail ? 'error'`, or `attempted > 0 and indexnowOk = 0`. Neither row matches any of them.

**Exploit path**

If the sitemap breaks so that the parser finds no URLs, the job reports success every day and nothing alerts. This is the failure 1 class (silent daily success) that section 4 claims to cover.

**Change**

- Extend the `ping-sitemap` clause with `or detail->>'note' = 'no urls parsed'`.
- Use `consecutive` 2 on that clause only, because one empty run after an unchanged sitemap may be legitimate.
- Record both dates in the backtest.

### F11. LOW. The health spec contradicts itself on a thrown error

**Evidence**

- Section 3.1 says the wrapper rethrows after capture.
- Section 3.3 line 327 says `simulate=error` "throws inside the wrapper ... and answers 500", and V7 expects 500.
- Section 3.3 also requires: "Every failure branch answers with a fixed string."

**Exploit path**

A rethrown exception is answered by the Netlify runtime, not by `health.js`. Its status and body are therefore outside the spec's fixed-string rule, on an unauthenticated endpoint. Any unexpected throw would expose a runtime-formatted error to anyone who calls it.

**Change**

Add to section 3.3:

> `health.js` catches every exception at its top level. After `captureException` it answers `500 { error: 'internal' }`. `health.js` never rethrows. The rethrow rule applies only to the collectors and the worker, which keep their current behaviour.

V7 then expects exactly 500.

### F12. LOW. `_build_info.json` must be a static require, or it may not ship

**Evidence**

- Section 3.1: `buildInfo()` "reads `_build_info.json`, null when absent".
- Section 3.4 writes the file in `prebuild`.
- `netlify.toml` sets `node_bundler = "esbuild"` for one function (line 377) and uses the default bundler elsewhere.
- Neither bundler traces a computed-path `fs.readFileSync`.

**Exploit path**

The file is absent at runtime, so `commit` is always null. Section 11 step 6 and runbook step 7.3 can never pass.

**Change**

`buildInfo()` uses this, with that literal path:

```js
try { return require('./_build_info.json') } catch { return { commit: null, built_at: null } }
```

V-check: the live `commit` equals `origin/main`. Step 6 already covers this.

### F13. LOW. The rate-limit RPC needs a deadline and a stated failure mode

**Evidence**

- Section 3.3 calls `affiliate_rate_check` before the Supabase check. It is a SECURITY DEFINER insert-or-increment (`db/supabase-affiliate-migration-2026-09-12.sql:562-575`).
- The spec gives the call no timeout and does not say what an RPC error does.

**Exploit path**

- If Supabase hangs, the unbounded RPC runs into the 10 s function timeout.
  - UptimeRobot records a runtime 5xx instead of the designed `503 { checks.supabase.ok: false }`.
  - The body that tells the operator what failed is lost.
- If a builder maps an RPC error to 429, a Supabase outage reads as "rate limited".

**Change**

> Race the rate check against 1,500 ms. On error or timeout, skip it (fail open) and continue to the checks.

The total stays under 10 s: 1,500 ms for the rate check, 4,000 ms for the Supabase check, plus the F5 send budget.

### F14. LOW. The Netlify secrets scanner can fail the build on the inlined DSN

**Evidence**

- `netlify.toml:18-23` records that the scanner once flagged an inlined `VITE_` value, and that `SUPABASE_URL` had to be omitted from the scan.
- Section 3.5 inlines `VITE_SENTRY_DSN` into `dist`.

**Exploit path**

The push in runbook step 7 fails at the scan and uses up one of the day's Netlify builds. A browser DSN is public by design, so nothing is gained by scanning for it.

**Change**

- In the section 10 `netlify.toml` row, add `VITE_SENTRY_DSN` to `SECRETS_SCAN_OMIT_KEYS`, with a one-line comment.
- Never omit `SENTRY_DSN` (the Functions DSN).

### F15. LOW. The CI workflow (Q1) holds a secret in a public repository with no trigger specified

**Evidence**

- Section 10 (line 677) and Q1 (line 789) add a workflow that holds the secret `RESEND_API_KEY`.
- The spec names no trigger and no `permissions` block.
- The repository is public.

**Exploit path**

A builder might choose `pull_request_target`, or `pull_request` with a head-ref checkout and the secret in env. Either way, a fork pull request runs attacker code with the Resend key, which can send mail as `mail.getbrandgeo.com`.

**Change**

- Trigger only on `on: push: branches: [main]`.
- No `pull_request_target` and no `workflow_run`.
- Top-level `permissions: contents: read`.
- Pass the Resend key only to the final mail step's `env`.

### F16. INFO. Function hygiene in the `ops` SQL

**Evidence**

- Section 3.6 does not say whether the three functions are SECURITY INVOKER or pin `search_path`.
- This project pinned `search_path = public` on every affiliate function, and the Supabase advisor flags mutable paths.

**Change**

- Add `set search_path = ''` to all three functions and schema-qualify every reference.
- Leave them SECURITY INVOKER. They run as the cron owner and need no definer rights.

## Answers to the seven attack lines

### 1. health.js

**What it leaks.** The body exposes:

- `commit` (already public, since the repository is public)
- `built_at`
- `time`
- the Supabase check timing
- the newest job time
- whether the watchdog can send

None of these is a secret. Telling a caller that alerting is degraded is minor, and the runbook needs it. No finding.

**Rate limit.**

- `affiliate_rate_check` works as specified with the service key. Execute is revoked from PUBLIC, anon and authenticated and granted only to service_role (lines 574 to 575).
- Window rows are purged after 1 day (`db/supabase-affiliate-cron-2026-09-12.sql:43`).
- UptimeRobot makes 288 calls a day, which cannot reach 30 a minute.
- The deadline gap is F13.
- When the pepper is unset, the check is skipped and no hash is written at all. That is better than the `'brandgeo-dev-pepper-change-in-prod'` fallback in `affiliate-redirect.js:31-36`, and health must not reuse that fallback.

**Simulate.** The key is accepted in a header only, which is correct. The fail-closed case is F4.

**Does a 503 cause an alert loop?** No:

- `health.js` writes nothing.
- The watchdog never reads `health.js`.
- UptimeRobot alerts on state change only.

The real risk is a stuck 503, which is F2.

### 2. The ops schema

**Proof from the SQL in the spec that anon and authenticated cannot read or call anything:**

- `revoke all on schema ops from public, anon, authenticated` (line 389) removes USAGE. Without USAGE on the schema, those roles cannot name any table or function in `ops`, whatever the object grants say.
- RLS is enabled with no policies on both tables (lines 412 to 413). That is a second, independent denial.
- EXECUTE is revoked on all three functions (line 443). Functions are created with EXECUTE granted to PUBLIC by default, so this revoke is required, and it is present.

**Measured in production:**

- `pg_default_acl` holds per-schema entries only, none global, so no default grant reaches a new `ops` object.
- `pg_event_trigger` holds only the six Supabase standard triggers: `issue_graphql_placeholder`, `pgrst_ddl_watch`, `pgrst_drop_watch`, `issue_pg_cron_access`, `issue_pg_net_access`, `issue_pg_graphql_access`. None grants on a new schema. The last three act only on extension creation.
- The `ops` schema does not exist yet.

**Vault and pg_net:**

- The Resend key is read inside the function. It never appears in `cron.job.command` or `cron.job_run_details.command`; only `select ops.watchdog_run();` does.
- The `net` schema gives anon and authenticated USAGE but no table grant, so they cannot read queued request headers.
- Vault holds only `cron_secret` today.

**Dedupe.** Correct, apart from F9.

**Schedule.** `cron.job` currently holds seven active jobs:

| Schedule | Job |
|---|---|
| `0 3` | purge-old-ai-results |
| `5 4` | purge-old-prospect-audits |
| `10 5` | ping-sitemap |
| `10 6` | expire-plan-grants |
| `10 *` | schedule-collections |
| `35 4` | affiliate-retention |
| `40 4` | affiliate-mature |

None runs at minute 50, so there is no collision.

**Still open.** PostgREST's exposed schemas are configured outside the database; the `authenticator` role has no `db_schemas` setting. V10 must check them in Supabase settings.

### 3. Sentry PII

**Browser:**

- `defaultIntegrations: false` with an explicit list. `httpContextIntegration` and breadcrumbs are excluded, so the page URL is not attached.
- That matters here: `/audit/:token` (24-character base64url) and `/affiliate/join/:token` (32-character base64url, from `randomToken(24)` in `affiliate-admin.js`) carry tokens in the path. Rule 4's hex or base64 run would not match either.
- `httpClientIntegration` with `sendDefaultPii: false` attaches only the URL, method and status. No request or response headers, no cookies, no body.
- Rule 2 removes the query string, which strips the token from `get-audit-report?token=`.
- The fixture should still include the two path shapes, so that a later change adding `httpContextIntegration` fails the test.

**Functions.** See F7 and F8.

**CSP.** The `connect-src` at `netlify.toml:54` has no Sentry host today. Section 10 adds `https://*.ingest.de.sentry.io`, which matches EU DSN hosts of the form `o<id>.ingest.de.sentry.io`. The lazy chunk loads from `'self'`. Correct as specified.

### 4. _observability.js

- Rethrows: yes for the collectors. For `health.js`, see F11.
- No-op without a DSN: yes (rule 1).
- The 5-event cap and the 2 s timeout: **as written, they can extend a function past its timeout** (F5).

### 5. Watchdog backtest (SELECT only)

**`job_failed`: reproduced exactly.**

- `schedule-collections` with consecutive 2 fires on 2026-09-11 to 09-14, and stays silent on 08-28 and 09-10.
- `ping-sitemap` fires on 14 days: 07-28 (`NO_CREDENTIALS`) plus 13 `sitemap_fetch` days.
- `expire-plan-grants` fires on 3 days: 08-27 (a JWT issued in the future), and 09-12 and 09-14 (Gateway Timeout).
- All of these are true positives.
- One false-negative class exists: F10.

**`engine_down` and `engine_degraded`.** Evaluated hourly at `:50` over 75 days, they reproduce the stated windows. No false positive in a quiet, healthy week.

**`job_silent`.** The spec does not backtest it. Measured here:

- `schedule-collections` (2h threshold) would fire on the 2026-10-21 window, a true positive. Its history has 19 gaps over 2 h.
- Daily jobs at 48 h never fire for a single missed run. The longest measured gap is `expire-plan-grants` at 2 days 00:00:01, and with the `:50` offset that does not cross 48 h at any run.
- This matches the packet's "2x interval" rule. Recorded, not a finding.

**`collection_jobs_failed`.** Cannot be backtested: all 1,196 rows are `done`, and no `failed` row has ever existed. Its first real trigger is untested.

Suggested V-check: insert one `failed` row inside a rolled-back transaction, then run `watchdog_findings()`.

**The six failures:**

| # | Caught? |
|---|---|
| 1 | Yes. |
| 2 | Yes, through A and B. |
| 3 | Only if Q1 is ruled yes. |
| 4 | Only if Q1 is ruled yes. |
| 5 | Yes. B needs F1; C is untested, see above. |
| 6 | Yes. |

The first run also returns `job_silent:obs-watchdog` (F3).

### 6. Write-scope disjointness

- The bg-backend and bg-app sets in section 10 do not intersect.
- `package.json` belongs to bg-backend only, which is correct.
- The amendment's removals (`_auth.js`, `.htaccess`, `web/observability.js`) are consistent with the design.
- The additions miss the four collectors (F1).
- The files dirty from other sessions are correctly fenced: `unlock-audit-report.js`, `revenue-report.js`, `_revenue.js`, `Revenue.tsx`, `site.js`.

### 7. Deploy sequence (runbook section 3, arch section 11)

The order is correct for every dependency but one:

1. Accounts, environment variables and Vault come first, and are inert.
2. Then the push, with `watchdog: null` treated as not failing.
3. Then part A, the test send, and part B.
4. Monitors come last.

No fail-closed gate exists in this design.

The exception is F2. Under it, the watchdog row goes to `ok = false` from the first or second run after step 9, so the step 10 monitors are created already down.

Minor inconsistency: runbook step 10 is headed "(after step 7)", but arch section 11 places it after step 9. Use "after step 9" in both, so that no monitor exists before the watchdog's first good run has been read back.

## Regression surface (found by grep)

- **Handlers to wrap:** `collect-prompt.js:40`, `collect-claude.js:21`, `collect-chatgpt.js:20`, `collection-worker-background.js:121`, and the new `health.js`.
- **Callers that must see no change:**
  - The single-cell refresh in `collectionContext.tsx`, which reads `done` and `reason` from the three collectors.
  - `schedule-collections` and `enqueue-collection`, which invoke the worker.
- **Shared configuration:** the `netlify.toml` changes (build command, CSP, a new function block) affect every route on app.getbrandgeo.com.
- **Manual look after the build:**
  - The AI Visibility single-cell refresh, with one forced insert error.
  - The CSP header on a live page.

## Data and claim integrity

- Every backtest number in the spec that this review re-ran matched: the `job_failed` days, the engine windows and the run counts.
- Three claims in the documents are wrong or incomplete:

| Claim | Problem | Finding |
|---|---|---|
| Expected first digest: "`engine_down:claude` and nothing else" | Incomplete | F3 |
| "3 hours of silence means pg_cron or pg_net stopped" | False once the watchdog runs | F6 |
| "Health now reads `watchdog.ok: true` after the first run" | False under the literal rule | F2 |

## Dash scan

`rg` was run on this file with a positive control. The result is in the hand-back.

## What was not checked

- **Sentry SDK.** Not executed. `httpClientIntegration`'s payload was judged from its documented behaviour with `sendDefaultPii: false`. V7 and V8 must read the real event JSON.
- **PostgREST exposed schemas.** Not readable from SQL here; left to V10.
- **Netlify error responses.** Not checked: the exact status and body Netlify returns for a rethrown error or a killed function. F11 avoids depending on this, and V8 records it.
- **Secrets scanner.** Not checked whether Netlify's scanner actually flags `VITE_SENTRY_DSN`. F14 is a precaution based on this repo's own precedent.
- **`pg_net` retention.** Only the 8 rows (about 6 hours) seen in `net._http_response`. That is enough for an hourly lookback, but retention was not measured over days.
- **The 2026-10-21 gap.** Only its effect was measured (0 rows, every cron run "succeeded"), not its cause.
- **Claude's status today.** Not checked. It determines the runbook's expected first finding.
- **UptimeRobot.** Not checked how it handles a 429 or a non-JSON 5xx.
- **Fixture and test file.** Not reviewed; they do not exist yet.
- **CI workflow body.** Not reviewed; it does not exist yet.
