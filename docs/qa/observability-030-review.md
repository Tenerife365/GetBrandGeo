PASS WITH FINDINGS

# Review: packet 030 (observability) plus the P3 force gate fix

```
INTENT: review 030 | SCOPE: docs/qa/ (write), read-only elsewhere | MODEL: opus | STOP AFTER: /verify
```

Reviewer: bg-verify. Date: 2026-11-01. Subject: the UNCOMMITTED working tree
built by bg-backend and bg-app for `.claude/handoffs/030-bg-orchestrator-to-devops-team-error-tracking-uptime-alerting.md`,
plus the P3 force gate fix in `enqueue-collection.js`, which the orchestrator
bundled into this review by name. Binding design: `docs/arch/observability.md`
(sections 3.1, 3.3, 3.5, 3.6, 7, 9, 12, 16). Only this build's hunks were
reviewed (`git diff -- <file>` for tracked files, full read for new files).
Other sessions' dirty files (Revenue.tsx, _revenue.js, revenue-report.js,
unlock-audit-report.js, brandgeo/web/*, db/supabase-prospect-channels-migration.sql,
.claude/agents/gtm-outbound.md, docs/growth/*) were ignored.

No live security exposure was found, so no HUMAN CHECKPOINT was raised. No
secret appears in the diff or in any new file. Nothing was applied to
production; the only production access was read-only SELECTs.

Verdict in one line: the code does what the spec says, every check that can
run before commit passes, no BLOCKER or MAJOR. Five MINOR findings and a set
of INFO notes are below; none blocks the commit. Ten acceptance rows (V3 live,
V4 live, V5 to V8, V9 run, V9c, V11 live, done-means 3 and 4) can only be run
after the commit, the deploy and the SQL apply, and are listed as owed, not
passed.

---

## 1. Calibration (bg-verify)

**1. Diff stat and scope.** `git diff --stat` shows 24 modified tracked files
repo-wide; this build owns 11 of them: `brandgeo-dashboard/.gitignore`,
`netlify.toml`, `collect-chatgpt.js`, `collect-claude.js`, `collect-prompt.js`,
`collection-worker-background.js`, `enqueue-collection.js`, `package.json`,
`package-lock.json`, `src/main.tsx`, `tests/affiliate_flow.test.js`. New
untracked files owned by this build: `_observability.js`, `health.js`,
`src/lib/observability.ts`, `src/lib/observabilitySentry.ts`,
`tests/observability.test.js`, `tests/observability_spa_scrub.test.js`,
`tests/enqueue_force_gate.test.js`, `tests/fixtures/observability-pii.json`,
both `db/supabase-observability-watchdog*-2026-10-28.sql`,
`.github/workflows/dashboard-ci.yml`. The remaining 13 modified files belong to
other sessions and were not reviewed.

Four files are NOT in the packet's `scope_write` (packet line 7):
`netlify/functions/enqueue-collection.js`, `tests/enqueue_force_gate.test.js`,
`tests/observability_spa_scrub.test.js`, `tests/affiliate_flow.test.js`. All
four are named in the orchestrator's review brief with the exact change
expected, and each diff matches that description exactly (section 5, P3; the
affiliate test change is the two `occurred_at: clock.toISOString()` additions
at lines 295 and 345 and nothing else). I treat them as declared by the
orchestrator, not as an undeclared change, so this is not the automatic BLOCK
the calibration rule describes. The packet file itself was never amended, and
that is recorded as finding S5. If the owner does not accept the orchestrator's
brief as a scope declaration, the verdict for those four files becomes BLOCK
until the packet is amended; the 030 files stand on their own either way.

**2. Secret scan.** The prescribed scan over this build's tracked hunks
returns 2 lines; repo-wide it returns 6 (the other 4 are in other sessions'
files). Both of this build's hits are one changed line in `netlify.toml`
(`SECRETS_SCAN_OMIT_KEYS`, removed and re-added with `VITE_SENTRY_DSN`), a
variable name, not a value. New files, scanned for key, JWT, Resend, Stripe
live and DSN-with-key shapes: 2 hits, both in
`tests/fixtures/observability-pii.json` (lines 219 and 228), both synthetic
`alg: none` tokens with payload `sub: example` and a 12 character dummy
signature. Count of real secret values: 0.

**3. Acceptance criteria.** The criteria are arch section 12 V1 to V14 (quoted
in section 2 below) plus packet "Done means" items 1 to 6. All are objectively
checkable. V3, V4, V5, V6, V7, V8, V9 (run), V9c, V11 (live) and done-means 3
and 4 are checkable only after commit, deploy, or SQL apply; they are listed as
owed.

**4. Baseline before this change.** `npx tsc --noEmit` exit 0 and
`npm run build` exit 0 at HEAD (built in a scratch copy of HEAD with the same
`.env` files; main chunk gzip 454.45 kB). `tests/package_provisioning.test.js`
was already red at HEAD (since August, recorded in CLAUDE.md 2026-09-03), so
its failure below is not attributed to this build.

**5. Auth guard on the most sensitive function touched.**
`enqueue-collection.js:31` `requireAuth(event)` then `:26-27`
`effectiveForceFor(role, force)` returns `role === 'admin' && force === true`,
applied at `:49` and passed at `:85`. For `health.js`, which is deliberately
unauthenticated, the guard on the only privileged branch is
`health.js:233-234`: `?simulate` requires `X-Internal-Key` to match
`INTERNAL_AUDIT_KEY` through `keyMatches` (`:78-85`, length check then
`crypto.timingSafeEqual`, false when the env is unset).

**6. Write access.** This report is the only file written outside the session
scratchpad. No reviewed file was edited.

CALIBRATED

---

## 2. Acceptance criteria

Commands run from `brandgeo-dashboard\` unless stated. For the owner to
reproduce, from the repository root in PowerShell:

```powershell
Set-Location .\brandgeo-dashboard
node tests\observability.test.js
node tests\observability_spa_scrub.test.js
node tests\enqueue_force_gate.test.js
node tests\affiliate_flow.test.js
npx tsc --noEmit
npm run build
```

| # | Criterion | Result | Evidence |
|---|---|---|---|
| V1 | `node tests/observability.test.js` exit 0, covering no network without DSN, envelope shape, every fixture case, 5-event cap across two concurrent invocations, 2,000 ms cap with a hanging fetch | PASS | 46 checks, exit 0. Companion `observability_spa_scrub.test.js` 50 checks, exit 0. |
| V2 | `npm run build` exit 0; main chunk delta and lazy chunk within section 9 | PASS on build, FAIL on one budget (finding S4) | Build exit 0, `tsc --noEmit` exit 0. Vite report: main `index-CMj3IdmS.js` 456.26 kB gzip against HEAD 454.45 kB, delta +1.81 kB (budget 1.5 kB); lazy `observabilitySentry-DPEOvNp7.js` 34.00 kB gzip (budget 35 kB). Cross-check with the gzip CLI on both chunks: +1,758 bytes at level 6, +1,784 at level 9. |
| V3 | Live bundle: a string unique to `observability.ts`, no `@sentry/browser` code in the main chunk, Sentry in a separate file | Local PASS, live OWED | Local `dist/assets`: `@sentry/` occurrences in the main chunk 0, `__SENTRY__`/`SDK_VERSION`/`sentry_key` markers 0; lazy chunk carries 4 `__SENTRY__` markers; the main chunk references `observabilitySentry-DPEOvNp7.js` once. Live grep owed after deploy. Note: the production main chunk will contain the DSN host string from `VITE_SENTRY_DSN`; V3 forbids SDK code, not that string. |
| V4 | Live CSP `connect-src` adds the ingest wildcard and nothing else | Source PASS, live OWED | `git diff -- netlify.toml`: the only CSP change is `https://*.ingest.de.sentry.io` appended to `connect-src`. Live header owed. |
| V5 | Live `health` 200, `no-store`, `commit` equals `origin/main`, exact keys, no hostnames or error text | Source PASS, live OWED | `health.js` body keys `status, commit, built_at, time, checks{supabase{ok,ms}, jobs{ok,newest_age_s,max_age_s}, watchdog{ok,age_s,max_age_s}}`; no hostname, error message or env name in any branch (read every `respond(` call). `_observability.js` `buildInfo` re-validates the commit against `^[0-9a-f]{40}$`. |
| V6 | `?simulate` with no key, wrong key, different-length key: 403, no event | Stub PASS, live OWED | Local stub (`scratchpad\rv\health-rate.cjs`): key sent as an array 403; wrong and short keys 403 via `keyMatches`; key-unset case covered in V1. Live run owed. |
| V7 | `?simulate=error` with the right key: exactly 500 `{"error":"internal"}`, one Sentry event passing section 7 | Source PASS, live OWED | `health.js:237` throws inside the wrapped handler; the wrapper's catch returns exactly 500 `{"error":"internal"}` (V1 asserts this). Event and email owed; only the owner can run it, with his key. |
| V8 | `?simulate=timeout` status recorded against `httpClientIntegration`'s range | OWED | Needs the deployed function and Netlify's real timeout response. |
| V9 | Proof file in a transaction: injected `job_failed` found, failed `collection_jobs` found, no `obs-watchdog` finding, rollback leaves nothing | Text PASS, run OWED | Proof file opens `begin;` (line 28), ends with a `raise exception` that aborts the transaction (line 313) and `rollback;` (line 317). `watchdog_findings` excludes `obs-watchdog` at SQL lines 99 and 243. The final report string carries counts, ids and error codes only, no secret. The `net.http_post` queue rows it creates are inside the same transaction and roll back with it. Part A is not applied in production (schema `ops` absent, read 2026-11-01 23:16Z), so the run is owed. |
| V9b | `watchdog_prev_ok` cases | Text PASS, run OWED | Function at SQL line 285, `security invoker`, `set search_path = ''`; the cases are encoded in the proof file. |
| V9c | Two quiet runs after part B | OWED | Needs part B scheduled. |
| V9d | Lost-mail resend branch, in the proof file | Text PASS, run OWED | Proof lines 200 to 235: injects an old `alert_log` row with a lost request id, runs `ops.watchdog_run()`, asserts the old row is gone and a new request id exists; SKIPPED (not FAIL) when a real watchdog row is newer. |
| V10 | No grants to `anon`/`authenticated`, `ops` not exposed, four functions `search_path=""`, not SECURITY DEFINER | Text PASS, live OWED | SQL line 38 `revoke all on schema ops from public, anon, authenticated`; line 76 to 78 RLS on both tables with no policy plus `revoke all`; lines 476 to 479 revoke execute on all four functions; lines 91, 289, 324, 442 `security invoker`; lines 92, 290, 325, 443 `set search_path = ''`. Advisor and PostgREST probe owed after apply. |
| V11 | 31 requests in a minute give a 429 | Stub PASS, live OWED | Stub: RPC returns false gives 429 `{"error":"rate_limited"}`; RPC args `p_limit` 30, `p_window_seconds` 60, `p_key` `health:` plus a 64 hex hash (raw IP never in the key). Live run owed. |
| V12 | No address other than getbrandgeo.com in changed files; runbook says every account uses the project address | PASS | Addresses in new files by domain: example.com 14, sentry.example.com 3 (fixture DSN host), getbrandgeo.com 3, mail.getbrandgeo.com 6. Added lines in tracked files: 0 addresses. Runbook line 13 states every account and alert contact uses the project address. |
| V13 | No em or en dash in added lines, with a positive control | PASS | Control file with one of each: `rg -c` returns 2. All new files: 0. Added lines in this build's tracked hunks: 0. (The base files carry pre-existing dashes in old comments: enqueue-collection 6, worker 7, collect-prompt 13, collect-claude 5, collect-chatgpt 5, netlify.toml 10; none added by this build.) |
| V14 | No LLM call and no enqueue from simulate or watchdog | PASS | `rg` for `_collect`, `_enqueue`, and the OpenAI, Anthropic, Gemini, OpenRouter and SerpApi hosts over `health.js`, `_observability.js` and the watchdog SQL: 0 matches. |
| DM1 | Arch doc with scores and synthesis; runbook with the alert table | PASS | `docs/arch/observability.md` exists with sections 1 to 16; `docs/ops/alerting-runbook.md` section 1 has the six-row alert table. |
| DM2 | Build exit 0, added lines dash-free, a Node test for the wrapper AND the watchdog predicate | PARTIAL (finding S3) | Build and dashes as above. Wrapper: Node-tested (V1). Watchdog predicate: tested only by the SQL proof file, not by a Node test. |
| DM3 | One commit per surface, one build, deploy verified by bundle string and health commit | OWED | Nothing is committed. |
| DM4 | Watchdog proven in a rolled-back transaction; one real email from simulate | OWED | Needs part A applied and the deployed function. |
| DM5 | This report: PII scrub, rate limit, key gate, SQL hygiene | PASS | Sections 3 and 4 below. |
| DM6 | Packet status line | NOT CHECKED | The status line is the orchestrator's to update after this review. |
| P3-a | Viewer token with `force: true`: force dropped, cooldown applies, `force_ignored: true` in the body | PASS | `enqueue-collection.js:49-50` computes `effectiveForce` and `forceIgnored`; `:85` passes `effectiveForce` to `_enqueue`; `:94` and `:104` add `force_ignored: true`. Cooldown and limit checks run on the effective value, unchanged from HEAD. `tests/enqueue_force_gate.test.js` 13 checks, exit 0. |
| P3-b | Admin keeps force | PASS | `effectiveForceFor('admin', true)` true (test); the dashboard's only caller sends a boolean (`src/lib/collectionContext.tsx:190`). |
| P3-c | Nothing else in the file changed behaviour | PASS | `git diff -- netlify/functions/enqueue-collection.js`: the function, its export at `:108`, the log line at `:100`, the two response bodies. Ownership, cooldown, limits and the wrap are as at HEAD apart from the observability wrap. |
| T1 | `node tests/affiliate_flow.test.js` 67 checks | PASS | 67 checks, exit 0. |
| T2 | Full suite, CI style (every `tests/*.test.js`) | PASS except one pre-existing | 30 files: 29 pass, 1 fail, `package_provisioning.test.js`, red at HEAD since August and out of scope. Notable counts: affiliate_flow 67, observability 46, observability_spa_scrub 50, enqueue_force_gate 13, mcp_server 49, prompt_performance 50. |

---

## 3. Security findings

No BLOCKER. No MAJOR. No live exposure.

### S1, MINOR: SQL part A is not idempotent, so a re-run fails

- **Where:** `db/supabase-observability-watchdog-2026-10-28.sql:40`
  (`create table ops.watch_expectations`), `:54-65` (plain `insert` of the nine
  seed rows), `:67` (`create table ops.alert_log`). The schema line (`:37`) and
  the four functions (`create or replace`, `:87`, `:285`, `:320`, `:438`) are
  re-runnable; the tables and the seed are not.
- **Failure scenario:** the orchestrator's brief lists "idempotent re-run" as a
  property to check. It does not hold. Running part A a second time (to pick up
  a corrected function, for example) stops at line 40 with "relation already
  exists". Postgres runs a multi-statement simple query as one implicit
  transaction, so nothing partial should persist; whether the Supabase SQL
  Editor sends the script that way was not verified. Not exploitable; it fails
  loudly, not silently.
- **Proof:** the three statements above, read in the file; `grep` finds no
  `if not exists` on either table and no `on conflict` on the insert.
- **Fix (bg-backend):** `create table if not exists` on both tables and
  `on conflict (job) do nothing` on the seed insert. No claim of idempotency
  exists in the arch doc, the SQL header or the runbook, so this corrects the
  file, not a document.

### S2, MINOR: CI goes red, and emails, on every push to main until `package_provisioning.test.js` is fixed

- **Where:** `.github/workflows/dashboard-ci.yml`, the test loop runs every
  `tests/*.test.js` and fails the job after all have run; the mail step runs
  on `if: failure()`.
- **Failure scenario:** `tests/package_provisioning.test.js` is red at HEAD.
  Once the `RESEND_API_KEY` and `ALERT_EMAIL` repository secrets are set
  (runbook step 6), every push to main, including the daily article routine's
  automatic push, sends a `[BrandGEO CI]` failure email. An alert that fires
  every day for a known cause trains the reader to ignore the channel, which
  defeats the packet's first goal. Until the secrets are set the job only
  shows a red check, so nothing is harmed yet.
- **Proof:** CI-style run of all 30 files above: exactly that file fails. Arch
  section 11 row 11 already notes the red test, so this is documented, not
  hidden.
- **Fix:** fix the test before setting the two GitHub secrets (bg-backend on
  Opus with bg-verify, since it asserts on `stripe-webhook.js`, billing), or
  exclude that one file in the loop with a comment naming the debt. The order
  matters more than the choice.

### S3, MINOR: test gaps on the health rate limit and the watchdog predicate

- **Where:** `tests/observability.test.js` has no case for the health 429 path,
  the RPC error, throw, or hang paths, or the 1,500 ms race. Packet done-means
  item 2 asks for a plain Node test of "the function wrapper and the watchdog
  predicate"; the predicate is covered only by the SQL proof file.
- **Failure scenario:** a later edit that inverts `rateAllowed`'s return value
  or drops the race would pass every test in the repo.
- **Proof:** my own stub (`health-rate.cjs` in the session scratchpad) shows
  the code is correct today: RPC false gives 429; RPC true gives 200; RPC
  error, throw and a hanging RPC all fail open, the hang at 1,504 ms; a
  rate-limited request carrying `?simulate` gets 429 before the key check;
  OPTIONS gives 405 with `Allow: GET, HEAD`. `grep -n "429\|rate" tests/observability.test.js`
  finds no such case.
- **Fix (bg-backend):** add those six cases to `tests/observability.test.js`
  with a stubbed `supabase.rpc`. For the predicate, either accept the SQL proof
  file as the test and record that in the packet, or add a Node test over a
  fixed `job_runs` set if the predicate logic is ever mirrored in JavaScript.

### S4, MINOR: main chunk over its section 9 budget by about 0.3 kB

- **Where:** arch section 9, main chunk delta budget 1.5 kB gzip.
- **Measured:** +1.81 kB by Vite's report (+1,814 bytes), +1.76 to +1.78 kB by
  the gzip CLI. The lazy chunk is within budget at 34.00 kB of 35.
- **Cause:** most of the overrun is Vite's `__vitePreload` helper and its
  `vite:preloadError` handler, which any first dynamic `import()` in the app
  pulls into the main chunk, plus the gate, the 10-event buffer and the scrub
  (needed in the main chunk so events before the SDK loads are scrubbed too).
  None of it is Sentry SDK code (V3 local check).
- **My call:** a budget note for bg-architect, not a blocker. Amend section 9
  to 2 kB and name the preload helper as a fixed cost of the first dynamic
  import. Shaving it would mean hand-rolling the lazy load outside Vite's
  helper, which costs more in risk than 0.3 kB is worth on a 456 kB chunk.

### S5, MINOR (process): four files outside the packet's `scope_write`

- **Where:** packet 030 line 7. Not listed: `netlify/functions/enqueue-collection.js`,
  `tests/enqueue_force_gate.test.js`, `tests/observability_spa_scrub.test.js`,
  `tests/affiliate_flow.test.js`.
- **Scenario:** a cold session reading the packet cannot tell that the P3
  force gate and a fix to an affiliate test ride with observability, and a
  pathspec commit "per surface" from the packet would leave them out or mix
  them in unlabelled.
- **Proof:** calibration step 1. Each diff matches the orchestrator's brief
  exactly.
- **Fix (bg-orchestrator):** amend the packet's `scope_write` or, better,
  commit P3 (`enqueue-collection.js` plus `tests/enqueue_force_gate.test.js`)
  as its own commit with its own message, and the affiliate test fix
  (`tests/affiliate_flow.test.js`, two `occurred_at` lines on the fake clock)
  as another. The SPA scrub test belongs with the observability commit.

### S6, MINOR, PRE-EXISTING: the single-cell refresh still lets any owner force-delete

- **Where:** `netlify/functions/collect-prompt.js:101` (`if (force)` deletes
  the rows for the engines about to re-run), reached from
  `src/lib/collectionContext.tsx:334` (`force: true` on every single-prompt
  refresh).
- **Scenario:** P3 closes the enqueue path for viewers, but a viewer can still
  replace their own latest row for one prompt and engine by refreshing that
  cell. Own tenant only, behind `requireAuth`, the hourly row cap and the
  budget, so it cannot touch another client and cannot erase history beyond
  the rows being replaced.
- **Not this build's change**; recorded so it is not mistaken for closed.
  Not blocking. Owner `bg-backend` if the force rule is meant to hold
  everywhere.

### INFO

| # | Note |
|---|---|
| I1 | `health.js:72` and `:101-106`: with `IP_HASH_PEPPER` unset there is no rate limit at all, and every RPC failure path fails open by design. Whether the pepper is set in production was not checked. Each request costs at most one RPC and two reads, so the amplification ceiling is small. |
| I2 | `health.js` runs two reads where one query would do. Cost only. |
| I3 | Scrub: a stack frame's `abs_path` goes through `cleanUrls` (query, hash and path tokens removed) but not the secret pattern scrub. Not exploitable: script URLs on this host carry no secret. |
| I4 | Scrub over-redacts: `in_progress` becomes `[stripe]` (the `in_` prefix) and a tag key `key2` is dropped by the `key` deny substring. Cosmetic loss in Sentry, never a leak. |
| I5 | `_observability.js` keeps a string Postgres `code` as `pg_code` with no length cap. Postgres codes are five characters; a non-Postgres error could put a longer string there. |
| I6 | `collection-worker-background.js`: the `job_failed` message carries `job_id`; if ids are uuids the long-run pattern may redact them to `[secret]`, which would make the Sentry event less useful. Not verified against a real event. |
| I7 | `enqueue-collection.js:27`: an admin who sends a truthy non-boolean `force` (for example the string "true") no longer forces. The dashboard sends a boolean, so nothing changes today. |
| I8 | `dashboard-ci.yml` pins `actions/checkout@v4` and `actions/setup-node@v4` to major tags, not commit SHAs. Both are first-party; `permissions: contents: read`, `persist-credentials: false`, no `pull_request_target`, secrets only in the final `if: failure()` step and passed through `env`, never interpolated into the script, no `set -x`. The deploy-lag poll is bounded (every 60 s, at most 1,200 s, curl `--max-time 15`). F15 holds. |
| I9 | `ops.watchdog_run()` hands the Resend key to `net.http_post`, so it sits in the `pg_net` request queue until sent. Same pattern as the existing cron functions; the queue is not exposed through the API. |
| I10 | Arch section 11 step 9 expects the first watchdog run to report `engine_down:claude`. Production read 2026-11-01 23:16Z: every latest cron run succeeded, every latest `job_runs` row is ok except the disabled `poll-inbound-replies`, and there are no `ai_results` rows in the last 24 hours, so a first run today should report nothing that step names. Stale expectation, harmless. |
| I11 | Untracked `tsconfig*.tsbuildinfo` and `vite.config` output files sit in `brandgeo-dashboard/` from earlier sessions. Not this build's; do not sweep them into the commit. |

### Section 7 scrub parity, own inputs (claim 4)

Server scrub (`_observability.js`) and SPA scrub (`src/lib/observability.ts`,
transpiled with `isDemoMode` stubbed) fed the same seven inputs not in the
fixture. Result: identical output on all seven, 0 differences, 0 leaks.

| Input | Both surfaces |
|---|---|
| Nested arrays with `Email` and `USER_NAME` keys | dropped |
| Keys differing only in case: `EMAIL`, `User_Name`, `Authorization`, `BrandName` | dropped; `fn` and `pg_code` kept |
| JWT inside a URL query | query and hash stripped; `/audit/<token>` becomes `[token]` |
| Bare JWT in a message | `[jwt]` |
| `cus_`, `in_`, `sub_` ids in a message | `[stripe]` |
| Absolute frame path | path tokens cleaned (see I3) |
| Tag array | dropped |

The Sentry 11.8.0 renames bg-app used are equivalent for this purpose:
`eventFiltersIntegration` is 11's name for the old inbound filters, and
`dataCollection` (set to its strict values at `observabilitySentry.ts:37`)
replaces `sendDefaultPii`. `tracesSampleRate` is 0 (`:44`), `beforeSend` fails
closed (`:60`), no user is set, no `@sentry/react` is installed, and the
package is pinned to exactly 11.8.0 in `package.json`.

---

## 4. Accessibility findings

None, because nothing visible changed. The `src/` diff is two lines in
`main.tsx` (one import, one `initObservability()` call) and two new modules
with no JSX, no DOM nodes, no styles and no interactive element
(`grep -n "<[a-zA-Z]\|className"` over both files returns 3 lines, all
TypeScript generics such as `Record<string, unknown>`, no markup). So there
is no new text-on-surface pair to measure, no new focusable element, no
heading and no hit target. `health.js` returns JSON, not a page.

---

## 5. Regression surface (by grep)

| Changed module | Depends on it | Manual look |
|---|---|---|
| `_observability.js` (new) | `collect-chatgpt.js`, `collect-claude.js`, `collect-prompt.js`, `collection-worker-background.js`, `health.js`; tests `observability.test.js`, `observability_spa_scrub.test.js` | After deploy, one real collection run: confirm `ai_results` rows still land and the three collectors' response bodies are unchanged, since every collector handler is now wrapped. |
| `enqueue-collection.js` | `src/lib/collectionContext.tsx:185-190` (the only caller); comments in `CooldownCountdown.tsx`, `AIVisibility.tsx:571`, `_cost.js`, `_enqueue.js`, the worker | Admin Force Refresh from the AI Visibility page still deletes and re-collects; a viewer's Run Collection still enqueues and still respects the cooldown. |
| `src/lib/observability.ts` | `src/main.tsx:5-7` only | First load of app.getbrandgeo.com after deploy: no console error, and the lazy chunk loads only after the page is idle. |
| `netlify.toml` | build command (`VITE_RELEASE=$COMMIT_REF`), CSP, functions config | Live CSP header (V4); every existing function still answers (the toml now has a `[functions."health"]` block). |
| `package.json` `prebuild` | every Netlify build | First Netlify build log: `_build_info.json` is written and the build does not fail if `COMMIT_REF` is absent. |
| `tests/affiliate_flow.test.js` | none | none |

---

## 6. Data and claim integrity

- **Numbers in this report:** test counts are from runs in this session; gzip
  sizes are Vite's build report plus a gzip CLI cross-check; production facts
  are read-only SELECTs against project `duiyifepitvugyulobqm` at
  2026-11-01 23:16Z (schema `ops` absent; Vault holds `cron_secret` but not
  `resend_api_key` or `alert_email`; `affiliate_rate_check(text, integer, integer)`
  exists; `job_runs.detail` is jsonb; `ai_results.checked_at` is timestamp
  without time zone, which matches the SQL's UTC handling; the seven active
  cron jobs are all seeded in `watch_expectations`, so `job_unwatched` starts
  empty; `collection_jobs` holds only `done` rows, 1,317, with no CHECK on
  status).
- **Customer-facing numbers or copy:** none. This build adds no visible text.
  The only outward-facing words are the alert email subjects and the health
  JSON keys, both traced to arch sections 3.3 and 3.6.
- **Claim corrected:** "idempotent re-run" for SQL part A (finding S1). The
  arch section 11 step 9 expectation is stale (I10).

---

## 7. What was not checked

- Everything marked OWED in section 2: V3 and V4 against the live host, V5 to
  V8 against the deployed function, V9, V9b, V9d run in the SQL Editor, V9c
  after part B, V11 live, done-means 3 and 4. They need the commit, one
  Netlify build, the SQL apply and the owner's own key.
- Whether the Supabase SQL Editor runs part A as one transaction (S1).
- Whether `IP_HASH_PEPPER` is set in production (I1).
- Sentry project settings (data scrubbing, IP storage). The runbook line 90
  says "Prevent Storing of IP Addresses: on"; I did not open Sentry, by rule.
- Resend, UptimeRobot and GitHub repository secrets: not opened, by rule.
- A real Sentry event's shape, including whether `job_id` survives the scrub
  (I6).
- The CI workflow was read, not run on GitHub.
- The Supabase security advisor after apply (part of V10).
- The packet status line (DM6).
- Other sessions' dirty files, by instruction.
