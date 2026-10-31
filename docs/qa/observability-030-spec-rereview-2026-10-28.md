PASS WITH FINDINGS

# Observability spec re-review, packet 030 (revision 2)

Reviewer: bg-verify. Run on 2026-10-31. The file name keeps the packet's
date, 2026-10-28.
Subject: `docs/arch/observability.md` (revision 2, 1,009 lines, untracked),
`docs/ops/alerting-runbook.md` (280 lines), and the uncommitted
`scope_write` amendment in
`.claude/handoffs/030-bg-orchestrator-to-devops-team-error-tracking-uptime-alerting.md`.
First review: `docs/qa/observability-030-spec-review-2026-10-28.md` (FAIL,
blockers F1 and F2).
Method: I read both documents in full, read the collectors that the spec
now names, and ran SELECT queries against production `duiyifepitvugyulobqm`.
I edited nothing, ran no git write, ran no build, and sent nothing.

**Verdict in one line.** Both blockers are closed. F3 to F16 are closed in
the text. Nothing new blocks the build. Three new findings (N1 to N3) and
one note (N4) should be fixed in the text before the builder starts,
because each one is a place where the prose and the contract disagree.

## 1. What this review was asked to do

| # | Asked | Result | Evidence |
|---|---|---|---|
| 1 | Re-check every first-review finding | Done, section 2 | spec line numbers per row |
| 2 | Look for anything the revision introduced | N1 to N4, section 3 | spec lines 538 to 540, 590 to 593, 638; runbook lines 25, 59 |
| 3 | `job_runs` shape and recent rows | Matches the spec | section 4.1 |
| 4 | `cron.job` slots, `:50` free | Free | section 4.2 |
| 5 | `ai_results` outages caught by the engine rules | All three caught, plus one window the spec does not list | section 4.3 |
| 6 | Packet scope covers the file plan | Covered | section 5 |

## 2. First-review findings

| ID | First-review title | Status | Where it is closed |
|---|---|---|---|
| F1 (BLOCKER) | Collectors missing from scope | CLOSED | Spec section 10, lines 830 to 833 and 868 to 878, names `collect-prompt.js`, `collect-claude.js`, `collect-chatgpt.js` and `collection-worker-background.js`. The packet `scope_write` lists all four. The hook points the spec names match the code: `collect-prompt.js:152` to `:154` (insert error), `collect-claude.js:77` to `:80`, `collect-chatgpt.js:85` to `:88`, and `collection-worker-background.js:92` to `:96` (failed update). |
| F2 (BLOCKER) | A quiet hour read as a failed send | CLOSED | Section 3.6, lines 520 to 552: `ops.watchdog_prev_ok` returns true when `request_id` is null, when there is no previous row, or when the previous row is older than 5 hours. V9b and V9c (lines 933 to 934) test a quiet run, a 2xx run and a refused run. Section 11 step 9 (line 916) and runbook step 9.5 (lines 202 to 211) require two quiet runs to read `ok = true` before the monitor is added. The 5-hour cut is sound: production `pg_net.ttl` reads `6 hours`. |
| F3 | Watchdog alerts on itself | CLOSED | Seed lines 488 to 493 (`obs-watchdog` `enabled = false`, with a note). The predicate table at line 576 excludes it by name from every `job_*` kind, whatever the row says. |
| F4 | Simulate gate fails open | CLOSED | Section 3.3, lines 400 to 406: without `INTERNAL_AUDIT_KEY` the answer is 403, never the simulated path. Covered by V1 and V6. |
| F5 | A Sentry send can run past the 26 s timeout | CLOSED | Section 3.1 rule 2 (lines 267 to 279) and rule 3 (lines 280 to 288) set a budget per invocation with AsyncLocalStorage. Section 9 lines 801 to 806; the tests at line 838. |
| F6 | `jobs` check blind to `pg_net` and Netlify | CLOSED | Section 3.3, lines 360 to 370: `jobs` excludes `obs-watchdog`. Production evidence for the gap is cited at lines 366 to 368. |
| F7 | PostgREST `details` leak | CLOSED | Section 3.1 rule 5 (lines 291 to 298) and section 7 rule 3 (lines 687 to 692), with a fixture at lines 722 to 724. |
| F8 | Scrubbing destroys `release` | CLOSED | Section 7 rule 4, lines 693 to 699. |
| F9 | Dedupe spent on a failed send | CLOSED | The Finding union has no send-failed kind (lines 518 and 584). Step 0 deletes the lost run's `alert_log` rows (lines 538 to 540, but see N2). `watchdog_send_test` writes nothing (lines 553 to 555). |
| F10 | "no urls parsed" missed | CLOSED | Line 577 has a separate `ping-sitemap` clause with a count of 2. The backtest is at lines 602 to 607. |
| F11 | Contradiction on rethrowing the health error | CLOSED | Lines 391 to 397 and 409 to 410 now agree. |
| F12 | Static require of `_build_info.json` | CLOSED | Rule 7, lines 301 to 306. |
| F13 | RPC deadline | CLOSED | Lines 383 to 387. |
| F14 | Secrets scanner | CLOSED | Line 834 and runbook step 4.5 (lines 127 to 131): only `VITE_SENTRY_DSN` is omitted. |
| F15 | CI hardening | CLOSED | Line 842, and runbook step 6 (lines 149 to 151): CI runs on push to `main` only, and only the mail step reads the secrets. |
| F16 | `search_path` | CLOSED | Lines 557 to 564 and V10. |
| Runbook | Step 10 should read "after step 9" | CLOSED | Runbook line 213, "Step 10. UptimeRobot monitors (after step 9)", and the reason at lines 215 to 218. |

Section 16 of the spec (lines 980 to 1009) maps each finding to its fix.
I checked each row of that table against the cited lines. None was taken
on the table's word.

## 3. New findings

No security finding. Every item below is a spec-text defect, ranked by
how likely it is to produce wrong code or a wrong operator action.

### N1, MEDIUM, not blocking: watchdog staleness is 3 hours in the contract and 2 hours in the prose

- **Where.** The contract says 3 hours: spec line 348 (`watchdog: ... max_age_s: 10800`) and line 375 ("older than 3 hours"). The prose says 2 hours: spec line 638 ("ages past 2 hours"), runbook line 25 (alert table row 4) and runbook line 59 ("the watchdog row is older than 2 hours").
- **How it breaks.** The builder implements the contract, 10800 seconds. If `pg_cron` stops just after a `:50` run, the watchdog row reaches 3 hours at the following `:50` plus 2 hours. UptimeRobot reports it on its next 5-minute check. The operator was told 2 hours, so for an hour or more the operator reads a silent health check as proof that `pg_cron` is fine. Line 638 then builds an argument on 2 hours ("`jobs` alone would not show it within 3 hours"), and that argument only holds if the two numbers differ.
- **Fix.** Pick one number. 3 hours is what V-steps and the type contract use, so change spec line 638 and runbook lines 25 and 59 to 3 hours, and reword the parenthesis on line 638. If 2 hours is wanted instead, change `max_age_s` to 7200 at line 348 and the text at line 375.

### N2, MEDIUM, not blocking: step 0 uses `prev.request_id`, which is not a column

- **Where.** Spec section 3.6, lines 538 to 540: `delete from ops.alert_log where request_id = prev.request_id`. Line 537, one line above, correctly reads the id as `(prev.detail->>'request_id')::bigint`. `job_runs` has the columns `id`, `job`, `ran_at`, `ok` and `detail` (read in production), and no `request_id`.
- **How it breaks.** A builder who copies line 539 into PL/pgSQL, with `prev` typed as a `job_runs` row, gets a runtime error ("record has no field request_id") the first time that branch runs. That branch runs only when the previous mail was lost. So the recovery path that F9 was fixed for aborts exactly when it is needed. That run writes no `job_runs` row, the watchdog row ages, and `health` goes red after the staleness window. It fails visibly, not silently, but the resend never happens.
- **Fix.** Line 539 should read `request_id = (prev.detail->>'request_id')::bigint`, or bind it once to a local variable shared with line 537. Add one V-step that exercises the branch: insert a fake previous row whose `request_id` points at a non-2xx response, run `ops.watchdog_run()`, and check that the matching `alert_log` rows are gone and the findings are sent again.

### N3, LOW: the engine backtest is incomplete, and one window it omits shows how the 2-row threshold behaves

- **Where.** Spec lines 588 to 593, and the claim "No other window fires" at line 593.
- **Evidence.** I replayed both engine rules at every hourly `:50` since 2026-07-15 against production `ai_results`. The spec omits two things:
  - **Google AI Mode.** `engine_down` fires for `google_ai` from 2026-07-18 to 2026-07-19, for 24 hourly runs. Its rows: 1 ok on 2026-07-16, then 2 `empty_response` errors on 2026-07-18. Two rows meet the "2 or more errors, 0 ok" rule.
  - **Claude.** The spec says Claude fires "on 2026-10-27". The replay fires from 2026-10-27 to 2026-10-30, for 50 hourly runs. Claude's rows: 2026-10-26 had 3 `api_error` and 3 ok (no fire, ok rows present), 2026-10-27 had 2 `api_error`, 2026-10-29 had 55 `api_error`, and 2026-10-31 had 61 ok.
- **Why it matters.** The google_ai window was a real failure (empty answers), so this is a true positive and not a false alarm. But it shows that on an engine with few rows, two errors in 24 hours are enough. Google AI Mode is Growth PRO and above only, so it will always be low-volume. The claim on line 593 is false as written, and the next reviewer would trust it.
- **Fix.** Correct lines 590 to 593 to list the google_ai window and the full Claude window. Record in the spec whether 2 rows is the intended floor for low-volume engines. That is a product choice, not a defect.

### N4, INFO: the runbook's expected first digest is now stale

- **Where.** Runbook lines 61 to 63, and step 9.3 (lines 198 to 200): "the expected one is `engine_down:claude`, if Claude is still failing".
- **Evidence.** Claude recovered. `ai_results` shows 61 ok Claude rows on 2026-10-31 and none in error that day.
- **Effect.** The sentence is conditional, so it is not wrong. But the first digest will most likely be empty, and the operator should expect no mail at the first `:50`. A builder updating the runbook before go-live should say so.

## 4. Production evidence (SELECT only)

### 4.1 `job_runs`

- **Columns:** `id`, `job`, `ran_at`, `ok`, `detail` (jsonb). These match the spec's reads, except for N2.
- **Last 7 days, read 2026-10-31:**
  - `schedule-collections`: 168 rows (hourly, unbroken), newest 12:10Z, 0 failures.
  - `ping-sitemap`: 7 rows, newest 05:10Z, 0 failures.
  - `expire-plan-grants`: 7 rows, newest 06:10Z, 0 failures.
- **What this means for the `jobs` health check.** It would read green today, with the newest row under one hour old.
- **What I did not re-run.** The first review verified the `job_failed` backtest (lines 595 to 607) and the two "no urls parsed" rows. I did not run them again.

### 4.2 `cron.job`

Seven jobs, all `active = true`:

| jobid | Job | Schedule |
|---|---|---|
| 1 | `purge-old-ai-results` | `0 3 * * *` |
| 4 | `purge-old-prospect-audits` | `5 4 * * *` |
| 5 | `ping-sitemap` | `10 5 * * *` |
| 6 | `expire-plan-grants` | `10 6 * * *` |
| 7 | `schedule-collections` | `10 * * * *` |
| 8 | `affiliate-retention` | `35 4 * * *` |
| 9 | `affiliate-mature` | `40 4 * * *` |

- **The `:50` slot.** No job uses minute 50, so the watchdog collides with nothing.
- **Seed coverage.** Every job name above has a row in the seed (spec lines 483 to 489). With `obs-watchdog` and `poll-inbound-replies` added, the seed has nine rows, as runbook step 8.2 says. So `job_unwatched` would report nothing on the first run.
- **`pg_net.ttl`:** `6 hours`.

### 4.3 `ai_results`: the three named outages under the spec's rules

I replayed the rules at every hourly `:50` since 2026-07-15.

| Outage named in the task | Rule | Fires at `:50` | Caught |
|---|---|---|---|
| ChatGPT, 2026-08-28 to 09-21 | `engine_down` | 2026-08-28 to 09-22, 118 runs | Yes |
| OpenRouter Perplexity and Grok `quota_exceeded`, 2026-10-06 to 10-27 | `engine_down` | Perplexity 2026-09-18 to 10-25 (339 runs); Grok 2026-09-18 to 10-25 (324 runs) | Yes |
| (same, the earlier mixed period) | `engine_degraded` | Perplexity and Grok, 2026-09-11 to 09-12, 24 runs each | Yes |
| Anthropic credit balance, 2026-10-26 to 10-29 | `engine_down` | Claude 2026-10-27 to 10-30, 50 runs | Yes. First detection on 10-27, because 10-26 still had ok rows mixed in. |
| (not in the spec) | `engine_down` | google_ai 2026-07-18 to 07-19, 24 runs | N3 |

- **Why the Claude outage is caught under either error mapping.** `engine_down` keys on `status = 'error'`, not on `error_code`. So it catches the outage whether rows are mapped `api_error` (before `6aa4454`) or `quota_exceeded` (after it). `_collect.js:475` maps a body containing "credit balance" to `quota_exceeded`, and that is still a `status: 'error'` row (`_collect.js:994`, `:1007`, `:1021`).
- **`collection_jobs`.** 1,317 rows, all `done`; `scheduled_for` is NOT NULL. The queue migration allows the statuses `pending`, `running`, `done` and `failed`, and has no `cancelled` status, so the non-terminal clause of `collection_jobs_failed` (line 583) cannot misfire on a terminal row. The worker's retry path sets `pending` with a future `scheduled_for`, so `coalesce(scheduled_for, created_at) < now() - 2h` does not flag a row that is merely waiting to retry.

## 5. Scope coverage

The amended `scope_write` in packet 030 (uncommitted diff) covers every file in the spec's section 10 file plan:

| Group | Files |
|---|---|
| Docs | `docs/arch/observability.md`, `docs/ops/alerting-runbook.md` |
| Netlify functions | `netlify/functions/_observability.js`, `netlify/functions/health.js` |
| Collectors | the four collector files (F1) |
| Dashboard config | `netlify.toml`, `package.json`, `package-lock.json`, `.gitignore` |
| Tests | `tests/observability.test.js` and its fixture |
| SPA | `src/lib/observability.ts`, `src/lib/observabilitySentry.ts`, `src/main.tsx` |
| Database | both `db/` files |
| CI | `.github/workflows/dashboard-ci.yml` (Q1 ruled yes) |
| Packet | the packet status line |

The amendment removes `_auth.js`, `brandgeo/web/.htaccess` and `brandgeo/web/observability.js`, and the spec no longer plans changes to any of the three. No file in the plan falls outside scope, and no scope entry lacks a matching plan line.

## 6. Security

No security finding.

- **Secret handling.** The spec and runbook never ask for a value to be pasted. Runbook lines 10 to 12 forbid it, step 11.1 reads the internal key with `Read-Host` and removes the variable afterwards, and Vault is checked by name only (step 5.5).
- **Public DSN.** The browser DSN is treated as public, which it is. The functions DSN stays build-secret.
- **Simulate gate.** It fails closed (F4).
- **No new auth bypass.** `requireAuth` is not touched.
- **Pre-existing exposure, not this packet's.** `collection-worker-background.js:35` to `:43` (`checkInternalKey`) fails open when `INTERNAL_AUDIT_KEY` is unset. This is already recorded as R1 in CLAUDE.md. Constantin confirmed on 2026-07-28 that the key is set, so it is latent, not live. The spec adds Sentry calls to this file but does not touch the gate. It is PRE-EXISTING, and I do not block on it.

## 7. Accessibility

Not applicable at spec stage, and not checked. The only UI the packet
adds is the lazy Sentry loader, which renders nothing. This review
reached no new text-on-surface pair, interactive element or heading.

## 8. Regression surface

The surface is the four collectors (one envelope call each, on their
existing error branches), `main.tsx` (lazy import), `netlify.toml`
(function timeout, scanner key, health redirect if any) and
`package.json`.

I ran `rg` for the four collector names across `brandgeo-dashboard`,
excluding `dist` and `node_modules`.

- **No module loads a collector.** `rg "require\(['\"]\./(collect-...)"`
  over `netlify` and `tests` exits 1.
- **The collectors are called over HTTP**, from three places:
  - `src/lib/collectionContext.tsx:365` to `:367`;
  - `netlify/functions/_enqueue.js:269`, which calls the worker;
  - `netlify.toml`, which sets the timeouts.
- **One dependency reads source, not behaviour.**
  `tests/engine_routing.test.js:55` reads the text of `collect-prompt.js`
  and extracts the `const FAST_ENGINES` declaration. The builder must
  leave that declaration as a single literal list, or that test breaks.
- **What the post-build review must check:**
  - `npm test` still passes `engine_routing.test.js` and
    `enqueue_history.test.js`;
  - each collector's response body is unchanged
    (`{ done: false, reason: 'insert_error' }` in `collect-prompt.js`),
    because `collectionContext.tsx:352` to `:381` parses it.

The remaining hits are comments, retired `commit_*.bat` scripts, or
modules that name the endpoints without loading them: `_collect.js`,
`_cost.js`, `_analysis.js`, `_cron_auth.js`, `_prospect_engines.js`,
`seo-crawl.js`, `planConfig.ts`, `BrandSentiment.tsx` and `Onboard.tsx`.
I did not open each of these one by one.

## 9. Data and claim integrity

| Claim | Status |
|---|---|
| Engine backtest, lines 588 to 593 | Partly untrue (N3). |
| `job_failed` backtest, lines 595 to 607 | Verified by the first review, not re-run. |
| `pg_net` gap on 2026-10-21, lines 366 to 368 | Verified by the first review, not re-run. |
| `pg_net.ttl` of 6 hours | Verified. |
| Cron slots | Verified. |
| Seed of nine rows | Verified. |
| Claude credit outage mapping | Verified at `_collect.js:475`. |

The runbook's alert table (section 1) agrees with the spec's predicate
table, except for the 2-hour figure (N1).

## 10. What was not checked

- **Code.** Nothing is built. I did not run `npx tsc --noEmit`, `npm run build` or the tests, because no implementation exists and the build is out of scope.
- **Database functions.** I did not exercise `ops.watchdog_prev_ok`, `ops.watchdog_run` or `ops.watchdog_findings` (they do not exist yet). My replay of the engine rules is my own SQL that follows the predicate text, not the builder's.
- **Runtime behaviour.** I did not check AsyncLocalStorage under Netlify's Lambda runtime, or that the 1.5 s budget holds under a slow Sentry ingest.
- **Third parties.** I did not check Sentry EU ingest, the CSP line, the Resend send-only key scope, or UptimeRobot behaviour.
- **Repeated checks.** I did not re-read `cron.job_run_details`, and I did not re-run the `job_failed` and "no urls parsed" backtests.
- **CI workflow.** It is only described in the spec, so I did not review GitHub Actions permissions or step isolation.
- **Packet state.** The packet amendment and the spec are uncommitted and untracked. I reviewed the working tree as it stood on 2026-10-31, and the build should start from a commit of it.
- **Secret scan.** I ran no secret scan over a diff, because the change under review is two documents, not code. Neither document contains a key, DSN or token value. I checked by reading both in full.
