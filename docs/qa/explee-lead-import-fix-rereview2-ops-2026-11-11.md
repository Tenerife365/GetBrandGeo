PASS WITH FINDINGS

# Explee lead import, second fix round re-review: correctness, operations, tests

Reviewer: bg-verify (read-only). Date: 2026-11-11.
Subject: the UNCOMMITTED revision 4 fix round of `docs/arch/explee-lead-import.md`,
lens CORRECTNESS, OPERATIONS AND TESTS. Items judged: N1 (with auth I-4), N2,
N3, N4, N8, and the two spec-text items taken from builder deviations
(criterion 60, `pending_slug` with `brand_website`; criterion 29, the
sequential answer). Previous round of this lens:
`docs/qa/explee-lead-import-fix-rereview-ops-2026-11-11.md`.

```
INTENT: re-review explee-lead-import rev 4 fix round (ops lens)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Verdict in one line: every item of this lens is CLOSED by my own runs against
the repo fakes, each with the previous round's probe plus at least one
variation the builder's tests do not cover. Two new INFO items, no new LOW or
higher. Nothing in this lens blocks shipping in `dry_run` with the cron off,
and nothing in this lens blocks the later switch to `live`. The migration
still ships `mode='dry_run'` with Part B commented out; I edited no reviewed
file.

---

## 0. Method and rules kept

- Read each fix in the code, then wrote throwaway probe scripts in the session
  scratchpad (outside the repo) that drive the REAL importer, rules, client
  and provisioning modules through `tests/helpers/fake_supabase_mem.js` and
  `tests/helpers/fake_explee.js` with an injected clock. All probe scripts
  were deleted after the run.
- No git write, no migration, no Supabase, no network, no tsc, no build, no
  browser. Only `node tests/<file>.test.js` one at a time, `node --check`, and
  the probes. My only write in the repo is this file.

## 1. Re-runs (each alone, each exit 0)

```
explee_rules.test.js      exit 0   155 passed, 0 failed
explee_import.test.js     exit 0   111 passed, 0 failed
provision_client.test.js  exit 0    51 passed, 0 failed
refresh_cadence.test.js   exit 0    17 assertions passed.

check ok explee-import-background.js
check ok _explee_rules.js
check ok _explee_client.js
check ok _provision_client.js
check ok onboard-client.js
check ok _prospect_prompts.js
```

Every other test file that requires `tests/helpers/fake_supabase_mem.js`:

```
affiliate_auth exit 0 :: 16 checks passed
affiliate_flow exit 0 :: 67 checks passed
affiliate_promo_link exit 0 :: 16 checks passed
affiliate_stripe exit 0 :: 19 checks passed
client_api_keys exit 0 :: 26 passed
mcp_server exit 0 :: 83 passed
oauth_core exit 0 :: 22 passed
oauth_flow exit 0 :: 35 passed
phase2_collector_gate exit 0 :: 48 passed, 0 failed
phase2_prompt_ownership exit 0 :: 99 passed, 0 failed
phase2_schedule_worker_trigger exit 0 :: 11 passed, 0 failed
resend_invite exit 0 :: 39 checks passed
```

No segfault and no stray parse error on this run.

Dash scan, `rg -c "[U+2014 U+2013]"`:
- the 9 new files: exit 1 (no match);
- added lines (`git diff -U0 | rg "^\+"`) of the 4 modified files
  (`onboard-client.js`, `_prospect_prompts.js`, `fake_supabase_mem.js`,
  `refresh_cadence.test.js`): exit 1;
- positive control file with one em dash and one en dash: count 2, exit 0,
  deleted after.

Address scan (criterion 59, N8): see N8 in section 2.

---

## 2. Items of this lens, one by one

| Id | Status | Evidence (code read, then my own probe) |
|---|---|---|
| N1 (= auth I-4) | CLOSED | `canCall` before the homepage read `explee-import-background.js:982`; inside `generateValidated` before EACH attempt `:863-867` (closure passed at `:985`); after the F4 re-read and before the C1 counters `:1013-1026`, with no awaited call between `:1021` and `deps.provision` `:1027`; `guardRelease` `:974-978` releases like F4, `truncate('decide')`, `stopCreating='guard'`. Dry payload checks (a) and (b) in `buildPayload` `:890-894`. `maybeSummary` `:1411-1415` sends nothing, stamps nothing, sets `deferred_guard` and `truncated` `summary`. Previous round's exact probe: was invite at 13.53 min, now 0 invites, row released (3.1). Variations not in the builder's test: a fast invalid first answer so the RETRY starts at 12.78 and returns at 13.2 valid (stopped at check (c), `createsAttempted 0`, neither counter raised); the F4 settings re-read itself taking 40 s across 13 min (stopped by (c)); dry run with the thread read ending past 13 (0 homepage, 0 OpenAI, `would_create` kept, no payload); dry run with the homepage returning at 13.05 (0 OpenAI, payload built by the next run); summary deferred two runs in a row, sent once on the third; a run with no slowness still creates 2 with no truncation. Residual outside the rule's four check points: INFO N9. |
| N2 | CLOSED | `brandFold` = NFKC then `fold()` `_explee_rules.js:563-565`; `brandTermMatches` `:567-571`; `validatePrompts` folds the terms with `brandFold` `:576` and calls `brandTermMatches` `:597`; `fold()` unchanged `:134-136`; length, duplicate and template rules still use the raw text or `fold()` `:589-600`. Previous round's probe (`東京でＡＣＭＥのような会計ソフトは`): was `kept`, now `brand_term`. Variations: fullwidth TERM against ASCII text, fullwidth lower case, fullwidth inside English, halfwidth katakana term against fullwidth katakana text, a two-word brand split by an ideographic space, the `ﬁ` ligature: each `brand_term`. Keeps: fullwidth `ＡＣＭＥ２` and `ＡＣＭＥＳＯＦＴ` (boundary still applies after NFKC), criterion 37's `acmesoft` in Japanese and in English. M4 regressions (ASCII inside Japanese, Hangul in Korean): `brand_term`. `fold('ＡＣＭＥ')` returns the fullwidth string unchanged. |
| N3 | CLOSED | `failure()` `:565-571`: `attempts_total` +1 on every failed write except `email_rate_limited`, capped at `MAX_TOTAL_ATTEMPTS = 10` (`_explee_rules.js:73`); `isFinalFailure` `:337-339` = forced or attempts >= 3 or total >= 10. Every `decision:'failed'` write in the importer goes through `failure()` (grep of `'failed'`: `:616`, `:645`, `:675`, `:692`, `:988`, `:1101`, `:1110`, `:1125`, `:1130`). Previous round's probe (alternating `explee_error` and `prompts_invalid`): was never final over 6 runs, now final at run 10 with `prompts_invalid`, attempts 1 throughout, then runs 11 and 12 make 0 Explee calls and 0 OpenAI calls for the row. Variations: pre-invite `provision_error` (clients insert refused) alternating with `explee_error`: final at 10, 0 invites; `email_rate_limited` interleaved with `explee_error`: total counts only the latter (3 after 6 runs); an F4 release raises neither counter; after the documented human reset (attempts and `attempts_total` to 0) three identical failures finalise at 3/3; 25 forced re-selections never push either counter past 10 (inside both CHECKs). Summary line "Final after 10 failures" pinned by the builder's section 36. |
| N4 | CLOSED | `confirmAbsence` `:472-500`, order erased, declined, newer message, hidden; a message of any `type` whose `ts` parses and is strictly later than `absent_since` returns `{ clear: true }`; step 8 `:311-318` clears `absent_since`, keeps the row non-final, counts `absentCleared`. Previous round's probe ("an active lead missed by two complete listings is finalised hidden"): now `final false`, `absent_since` null, `absentCleared 1`; its control without a newer message: `hidden final`. Variations: a newer OUTBOUND `sent` message clears (spec: any type, see INFO N10); a message with `ts` EQUAL to `absent_since` gives `hidden`; a message with an unparseable or null `ts` gives `hidden`; a thread read answering 500 twice, even with a newer message stored, gives `hidden`; a cleared row still absent is re-stamped next run and, with nothing newer than the new stamp, becomes `hidden` at the next read (1 thread read per cycle, bounded); a row cleared in a dry period and listed again is created by the next live run. Guard regression: 60 rows due for the second-absence read, half with a newer message, 20 s per call: 18 cleared, 19 hidden, 0 calls started at or after 13 minutes, `truncated ["hidden"]`, one `job_runs` row. |
| N8 | CLOSED | `rg -o` for address shapes over the 9 new files and the added lines of the 4 modified files: every domain is `.example` (including the deliberate negatives `acme.examplex` and `acme.example.evil.example`) except `getbrandgeo.com` and `mail.trybrandgeo.com`, with the invented local parts `ana` and `sales` only, all in `tests/explee_rules.test.js` (`:472-473`, `:490-496`, `:634`) and `tests/explee_import.test.js` (`:1212`, `:1463`). The function files carry no address. This is exactly the recorded exception of criterion 22 and criterion 59. Added lines of the 4 modified files: no address. |
| Criterion 60 (`pending_slug` needs equal `brand_website`) | CLOSED | `processRow` `:625-650`: the client found by `pending_slug` is the orphan only when `normalizeDomain(brand_website)` equals the row's `brand_domain` `:639`. Builder's section 38 passes. Variations: `brand_website` null and no client with that slug: decided again and created on a suffixed slug, 0 orphan events; `acme.example/path?x=1`: `half_made`, 1 event, 0 deletes; `shop.acme.example` (a subdomain, not equal): no orphan event, `pending_slug` cleared, then D5 duplicate 3 decides `already_customer` (a client monitors a matching domain), which is the correct sequential answer, not a defect. |
| Criterion 29 amended (sequential answer) | CLOSED | The builder's section 14 accepts either reason without tying it to the winner, so I tied it. Two interleaved live runs (both pass D5 before either reserves), then a sequential run, for both related-domain cases and for both winners (inbox order swapped): when the winner's client monitors a domain matching the loser, the loser is `already_customer`; when it does not (winner p2 `other.example`, loser p1 `acme.example`), the loser is `company_has_account`. Every case: final, exactly 1 invite in total, never `created`. INFO N11 suggests pinning this in the test. |

### Do the builder's new tests fail on the old behaviour?

I did not mutate the reviewed files (forbidden). Evidence instead: my re-run of
the previous round's exact probes for N1 and N2 printed FAIL on the code of
that round (pasted in that report, sections 3.2 and 3.4) and prints ok now;
the N3 probe measured attempts `1,1,1,1,1,1` and never final then, and final
at 10 now; the N4 probe measured `hidden` then and kept now. The builder's
sections 35 to 38 assert those exact outcomes (`counter.n === 1`, 0 invites,
`final === (run === 10)`, `absentCleared === 1`), so each would fail on the
previous code.

---

## 3. Probe output (pasted)

### 3.1 N1, time guard

```
PROBE ok   N1 prev-round probe: thread read ends 12.6, homepage 6 s, gen 1 invalid, gen 2 valid, 25 s each: no invite at or after 13 :: gen starts 12.70 invites 0
PROBE ok   N1 var: gen 1 fast (5 s) invalid at 12.8, gen 2 starts 12.8 runs 25 s to 13.2 valid: guard (c) after the re-read stops provisioning :: gen starts 12.70,12.78 createsAttempted 0
PROBE ok   N1 var: the F4 settings re-read itself takes 40 s and crosses 13 min: guard (c) is after it :: settings reads 5, invites 0, gen 1
PROBE ok   N1 var: dry run, thread read ends at 13.0+: no homepage and no OpenAI call started after 13, would_create kept, no payload :: homepage 0, openai 0, decision would_create
PROBE ok   N1 var: dry run, homepage returns at 13.05: generation not started, payload null this run, next run builds it :: run1 openai 0; run2 prompts 5
PROBE ok   N1 var: summary deferred twice in a row, sent once on the third run :: deferred_guard, deferred_guard, sent; notifies 1; job_runs 3
PROBE ok   N1 measure: a provisioning started at 12.99 min whose invite takes 60 s then rollback fails: orphan email start time :: invites 1; orphan event at 13.96 min (email:true); job_runs 1
PROBE ok   N1 regression: a run with no slowness still creates (guard does not misfire) :: created 2, truncated none
```

(The "measure" line only measured; it is INFO N9.)

### 3.2 N2, brand-term rule

```
PROBE ok   N2 prev-round probe: fullwidth ACME inside Japanese :: brand_term
PROBE ok   N2 var: fullwidth TERM against ASCII acme in Japanese text :: brand_term
PROBE ok   N2 var: fullwidth lowercase letters inside Japanese :: brand_term
PROBE ok   N2 var: fullwidth brand inside English text :: brand_term
PROBE ok   N2 var: fullwidth brand glued to a fullwidth digit (acme2) stays kept :: kept
PROBE ok   N2 var: fullwidth inside a longer Latin word (acmesoft) stays kept :: kept
PROBE ok   N2 var: halfwidth katakana brand term against fullwidth katakana prompt :: brand_term
PROBE ok   N2 var: two-word brand with an ideographic space in the prompt :: brand_term
PROBE ok   N2 var: ligature fi in the prompt against brand fizzco :: brand_term
PROBE ok   N2 keep: criterion 37 acmesoft in Japanese still kept :: kept
PROBE ok   N2 keep: ASCII acmesoft in English still kept :: kept
PROBE ok   M4 regression: ASCII ACME inside Japanese still brand_term :: brand_term
PROBE ok   M4 regression: Hangul brand inside Korean :: brand_term
PROBE ok   N2: fold() itself unchanged for fullwidth (NFKC only in brandTermMatches) :: "ａｃｍｅ"
PROBE ok   N2 regression: length rule still on the raw text (fullwidth 6-char dense floor) :: kept
PROBE ok   N2 regression: validatePrompts filters terms shorter than 2 after NFKC (fullwidth single letter) :: kept
```

### 3.3 N3, N4 and criterion 60

```
PROBE ok   N3 prev-round probe: explee_error and prompts_invalid alternating: attempts 1, total 1..10, final at 10, then 0 calls :: explee_error:1/1:false:2c0o prompts_invalid:1/2:false:1c2o explee_error:1/3:false:2c0o prompts_invalid:1/4:false:1c2o explee_error:1/5:false:2c0o prompts_invalid:1/6:false:1c2o explee_error:1/7:false:2c0o prompts_invalid:1/8:false:1c2o explee_error:1/9:false:2c0o prompts_invalid:1/10:true:1c2o prompts_invalid:1/10:true:0c0o prompts_invalid:1/10:true:0c0o
PROBE ok   N3 var: pre-invite provision_error (clients insert refused) alternating with explee_error: final at 10, never 3 consecutive :: explee_error:1/1:false provision_error:1/2:false explee_error:1/3:false provision_error:1/4:false explee_error:1/5:false provision_error:1/6:false explee_error:1/7:false provision_error:1/8:false explee_error:1/9:false provision_error:1/10:true
PROBE ok   N3 var: email_rate_limited interleaved with explee_error: only explee_error counts toward total :: explee_error:1/1:false email_rate_limited:1/1:false explee_error:1/2:false email_rate_limited:1/2:false explee_error:1/3:false email_rate_limited:1/3:false
PROBE ok   N3 var: guard, F4 and reservation releases raise neither counter :: after F4 release: attempts 0, total 0, decision null
PROBE ok   N3 var: human reset (attempts=0, attempts_total=0, keeps invite_sent_at) then 3 same failures finalise at 3, total 3 :: after reset: explee_error 3/3 final true
PROBE ok   N3 CHECK: no write path pushes attempts or attempts_total outside 0..10 over 25 alternating runs :: max attempts_total 10, max attempts 1
PROBE ok   N4 prev-round probe: active lead missed by two complete listings, newer reply: kept, absentCleared 1 :: final false, absentCleared 1
PROBE ok   N4 prev-round control: missed twice, nothing newer: hidden final :: hidden final true
PROBE ok   N4 var: the newer message is an outbound sent (spec: any type): kept :: final false
PROBE ok   N4 var: message ts EQUAL to absent_since (not strictly later): hidden :: hidden
PROBE ok   N4 var: newer message with unparseable ts, or ts null: hidden :: hidden,hidden
PROBE ok   N4 var: thread read 500 (twice) on the second absence, even with a newer message: hidden :: hidden
PROBE ok   N4 var: the cleared row is still absent: re-stamped next run, another read at +50 min (bounded: 1 thread read per cycle) :: restamped true; after next read: hidden final true; thread reads in 2 runs 2
PROBE ok   N4 var: N4 in live mode does not create, cleared row is worked normally when it reappears :: after reappear in live: created
PROBE ok   criterion 60 var: pending_slug client brand_website other.example :: created, orphan events 0, deletes 0, clients 2, pending_slug null
PROBE ok   criterion 60 var: pending_slug client brand_website https://www.ACME.example/ :: half_made, orphan events 1, deletes 0, clients 1, pending_slug acme
PROBE ok   criterion 60 var: pending_slug client brand_website null website :: created, orphan events 0, deletes 0, clients 2, pending_slug null
PROBE ok   criterion 60 var: pending_slug client brand_website shop.acme.example (subdomain, not equal) :: already_customer, orphan events 0, deletes 0, clients 1, pending_slug null
PROBE ok   criterion 60 var: pending_slug client brand_website acme.example/path?x=1 :: half_made, orphan events 1, deletes 0, clients 1, pending_slug acme
PROBE ok   criterion 60 var: pending_slug client brand_website no client with that slug :: created, orphan events 0, deletes 0, clients 1, pending_slug null
```

Two lines failed on my first run and were probe errors of mine, not code
defects: the "ts EQUAL" probe read the thread through the fake's listing
lookup after the lead was hidden (null), and I first expected `created` for
the subdomain website, where D5 duplicate 3 correctly answers
`already_customer`. Both corrected, rerun shown above.

### 3.4 Criterion 29, sequential answer

```
PROBE ok   criterion 29 amended: p2 brand shop.acme.example, inbox order p1 first :: winner p1 (acme.example), loser p2 -> already_customer final true, invites total 1
PROBE ok   criterion 29 amended: p2 brand shop.acme.example, inbox order p2 first :: winner p2 (shop.acme.example), loser p1 -> already_customer final true, invites total 1
PROBE ok   criterion 29 amended: p2 brand other.example, email domain acme.example, inbox order p1 first :: winner p1 (acme.example), loser p2 -> already_customer final true, invites total 1
PROBE ok   criterion 29 amended: p2 brand other.example, email domain acme.example, inbox order p2 first :: winner p2 (other.example), loser p1 -> company_has_account final true, invites total 1
```

### 3.5 Regressions on the same lines (earlier rounds)

```
PROBE ok   M3 regression with N4: 60 rows due for the second-absence read, half with a newer message, 20 s per call: no read at or after 13 min, job_runs written :: cleared 18, hidden 19, truncated ["hidden"], elapsedMs 780000
PROBE ok   M1 regression: profile insert failing, 3 hourly live runs: 1 invite per run, 3 distinct, never re-invited :: per run 1,1,1, distinct 3
```

---

## 4. New findings, ranked

No BLOCKER, MAJOR, MEDIUM or LOW. Three INFO.

### N9. INFO. An emailed admin event that follows a provisioning call can start after 13 minutes

Where: `explee-import-background.js:1109-1118` (the `rollback_failed` branch
calls `notify(... orphanEvent ..., email: true)`), also the
`explee_account_created` event `:1059` (bell only, `email: false`). They run
after a provisioning call that check (c) correctly allowed before 13 minutes.

Inputs and state: live, provisioning started at 12.99 minutes, the fake invite
takes 60 s, the profile insert and the rollback's clients delete both fail.
Measured: the orphan event (with email) started at 13.96 minutes; the run
then wrote its `job_runs` row (1 row).

Why INFO: D8's N1 rule names four check points and all four hold; the general
sentence ("no ... other outbound call is STARTED") would also cover this
email. Skipping it would lose the only alert for a half-made account, since
the event is not re-sent later. The run still ends well before 15 minutes.
Owner of the call: bg-architect, to state that post-provision alerts are
exempt (or defer their email to the next run); no build change asked.

### N10. INFO. N4 counts our own outbound `sent` messages as activity

Where: `confirmAbsence` `:494-497`, per D1 step 8 revision 4 ("a message of
any `type`").

Measured: a hidden row whose thread gained a newer `sent` message (a sequence
step from our side) is kept and not `hidden`. Bounded: each clear costs one
thread read and the row is re-stamped the next run; with nothing newer than
the new stamp it becomes `hidden` at the next read (probe: 2 reads over 2
runs, then `hidden`). Spec-level choice; if Explee keeps sequencing a
conversation it no longer lists, each step buys one more cycle. bg-architect
may narrow it to `type = 'reply'`; nothing to build now.

### N11. INFO. Criterion 29's test does not tie the sequential reason to the winner

Where: `tests/explee_import.test.js:886` accepts `company_has_account` or
`already_customer` whatever the winner. My probe (3.4) shows the code follows
the amended rule exactly in all four combinations, so this is a test
precision gap only: asserting the reason from the winner's `brand_website`
(as the probe does) would pin the D5 3-before-4 order.

---

## 5. Migration file, read as SQL against every write path (not applied)

- Idempotent: `create table if not exists`, `create index if not exists`
  (including the new `idx_explee_leads_invite_sent`), `drop policy if exists`
  then `create policy`, settings and watch rows `on conflict do nothing`,
  `revoke` repeats safely. As before, re-running after a column edit would not
  add a column; the file is unapplied (by every prior record; not checked on
  the database here), so `invite_sent_at` and `attempts_total` land on first
  apply.
- Ships `mode text not null default 'dry_run'` (`:26`), `project_ids` empty,
  watch row `enabled false` (`:135`), `cron.schedule` only inside comments
  (`:208-213`). The builder's section 39 pins all of it and passes.
- New columns against the code:
  - `attempts_total integer not null default 0 check (0..10)` (`:90`):
    written only by `failure()`, `Math.min(10, ...)`, never lowered by code;
    rate limit keeps the previous value; probe max 10 over 25 runs. The human
    reset comment (`:190-191`) sets it to 0, matching D8 C3.
  - `invite_sent_at timestamptz` (`:87`): written by `onStep('invite')` in the
    same UPDATE as `user_id` (`:999`) or by the final write when the result
    carries `userId` or `inviteSent` and it is still null (`:1067-1068`);
    never in `release()` (`:575-581`) or the reclaim reset (`:651`), so it is
    never cleared by code, as D8 C2 requires.
  - `follow_up_status` CHECK carries `skipped_label` (`:97`), the only new
    value the code writes.
- Existing CHECKs on the rev 4 write paths: the V1 "not ours" row is
  `decision='skipped'` (no decision CHECK applies) with `email_sha256` and
  `reserved_at` kept and `email` null; it leaves both partial unique indexes
  (they cover `creating`/`created` only), so it cannot collide with a later
  real create of a different lead; `attempts` still `Math.min(10, ...)` and
  9 for the rate limit.

## 6. job_runs and truncation

One row per run on every path I drove, including the truncated ones: the N1
summary probe (3 runs, 3 rows), the M3 regression (`truncated ["hidden"]`,
1 row, `elapsedMs 780000`), and the half-made probe that ended past 13
minutes (1 row). `detail.truncated` now also names `summary`;
`detail.summary` is `deferred_guard`, `sent` or `skipped_dry_run`.

## 7. Regression surface (grep)

- `_provision_client.js`, `_explee_rules.js` and the importer are required by
  `onboard-client.js` and `explee-import-background.js` only (grep of
  `netlify/` and `src/`). No file under `src/` changed.
- `tests/helpers/fake_supabase_mem.js` is required by 14 test files; all 14
  pass (section 1).
- Manual look still owed (unchanged from round one): one wizard create and
  delete of a test client after deploy.

## 8. Ship answers

- **Blocks shipping in `dry_run` with the cron off (migration applied, code
  deployed, mode `dry_run`)?** No. Every item of this lens is closed; the
  three new items are INFO; a dry run sends no email, creates nothing and
  writes its `job_runs` row on every path I drove.
- **Blocks switching to `live` later?** Nothing in this lens. N1, N2, N3 and
  N4, the four items of this lens marked "must close before live" in the
  revision 4 table, are closed by measurement. The switch still waits on the
  other preconditions of D13 (Q3, the auth lens verdict on V1 to V4 and I-1,
  the database grant read-back), which this lens did not judge.

## 9. Not checked

- tsc, `npm run build`, the entry chunk (forbidden in this run).
- The migration on a database: whether Part A was ever applied (which would
  leave the two rev 4 columns missing), and the `has_table_privilege` read
  back of criterion 33.
- Real Explee: message `ts` format and whether hidden conversations still
  receive sequence steps (N10), `has_more`/`next_offset`, skeleton shapes.
- Real OpenAI output in JP, KR, TH, ZH markets, and how often compatibility
  forms appear beyond the ones probed (N2).
- Real GoTrue latency and Resend latency (N9's real start time), Netlify's
  real 15 minute kill.
- The auth lens items V1, V2, V3, V4 and I-1 beyond where they share lines
  with this lens (the V1 and V2 tests passed in the suite runs; I wrote no
  probe for them).
- `explee_rules.test.js` and `provision_client.test.js` were run, not read
  test by test; I read sections 30 to 39 of `explee_import.test.js` and the
  N2 section of `explee_rules.test.js`.
- Mutation of the reviewed files to prove each new test fails on old code
  (forbidden); argued from the previous round's measured outcomes instead.
