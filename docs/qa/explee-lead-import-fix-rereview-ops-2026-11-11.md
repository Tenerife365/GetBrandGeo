PASS WITH FINDINGS

# Explee lead import, fix round re-review: correctness, operations, tests

Reviewer: bg-verify (read-only). Date: 2026-11-11.
Subject: the UNCOMMITTED fix round on the build of `docs/arch/explee-lead-import.md`
revision 3, against the ops-lens findings of
`docs/qa/explee-lead-import-build-review-ops-2026-11-11.md`.

INTENT: re-review explee-lead-import fix round (ops lens) | SCOPE: docs/qa/ (write), read-only elsewhere | MODEL: opus | STOP AFTER: /verify

Verdict in one line: all 13 findings of this lens are closed by my own runs
against the repo's fakes, each with at least one variation the builder's tests
do not cover. Two new LOW findings (N1 time guard not re-checked between
prompt generation and provisioning, and before the summary email; N2 a
FULLWIDTH Latin brand inside Japanese text passes the brand-term rule). Nothing
blocks the migration or a dry-run deploy. The import still ships in
`mode='dry_run'` with the cron commented out; nothing in this review changed
that, and I edited no reviewed file.

---

## 0. Method and rules kept

- Read the fix in the code, then wrote throwaway probe scripts in the session
  scratchpad (outside the repo) that drive the REAL importer, client, rules
  and provisioning modules through `tests/helpers/fake_supabase_mem.js` and
  `tests/helpers/fake_explee.js` with an injected clock. The probes were
  deleted after the run.
- No git write, no migration, no Supabase, no network, no tsc, no build, no
  browser. Only `node tests/<file>.test.js` one at a time, `node --check`, and
  the probe scripts.
- My only write in the repo is this file.

## 1. Re-runs

```
explee_rules.test.js      exit 0   134 passed, 0 failed
explee_import.test.js     exit 0    86 passed, 0 failed
provision_client.test.js  exit 0    41 passed, 0 failed
refresh_cadence.test.js   exit 0    17 assertions passed.

check ok explee-import-background.js
check ok _explee_rules.js
check ok _explee_client.js
check ok _provision_client.js
check ok onboard-client.js
check ok _prospect_prompts.js
```

Every other test file that requires `fake_supabase_mem.js` (criterion 21),
each run alone, each exit 0:

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

Dash scan (`rg -c` with a class of U+2014 and U+2013) on the 9 new files: exit 1 (no match). On the
added lines of the 4 modified files (`onboard-client.js`,
`_prospect_prompts.js`, `fake_supabase_mem.js`, `refresh_cadence.test.js`):
exit 1. Positive control file with one em dash and one en dash: count 1,
exit 0, deleted after.

Address scan (`rg -o` for address shapes over the same set, minus
`.example`): 4 distinct hits. One is `xbo@acme.examplex` (a deliberate
`.example` variant). Three sit on our own sending domains (one on
`mail.trybrandgeo.com`, two on `getbrandgeo.com`), all in
`tests/explee_rules.test.js:469-498` and `tests/explee_import.test.js` section
26. Criterion 48 names those exact addresses, so the spec mandates them; they
name no third party. Recorded as INFO N8, count only.

---

## 2. Findings of this lens, one by one

| Id | Status | Evidence (code read, then my own probe) |
|---|---|---|
| M1 | CLOSED | Counter before the call `explee-import-background.js:971-973`; post-invite keeps `reserved_at` and is final `:1048-1055`; `stopCreation` on every `provision_error` `:1060`; daily window counts failed `provision_error` `:819-826`; helper returns `userId` and `inviteSent` after the invite `_provision_client.js:230-232`. Builder test section 12 passes (user_profiles failing, and clients failing). My variations (section 3.1): prompts insert failing, 4 runs: 4 invites to 4 distinct addresses, the run-1 address invited once; `onStep('invite')` progress write failing (stage invite WITH userId): 1 invite, final, `reserved_at` kept, user compensated, not re-invited next run; GoTrue `invite_error` without userId: non-final, `reserved_at` null, 1 call; a failing referral consumes the referral place (`referralsThisRun 1`). Residual by design: INFO N5. |
| M2 | CLOSED | `readListing` `:415-445`: `has_more === false` ends, `has_more` absent ends only on an empty page, a non-advancing offset or an error is incomplete; `absent_since` first absence `:300-305`, 50 minute confirmation `:306`, thread read `confirmAbsence` `:461-483`; created rows go to reconcile, creating and processing rows are skipped `:297-298`. Builder section 18 passes (move to front, truly gone, short page with `has_more` true, `has_more` omitted). My variations (3.3): a DELETION in page 1 that makes the boundary item of page 2 skipped gives only `absent_since`, cleared the next run; `has_more: true` with an empty page is incomplete, nothing stamped; `next_offset` equal to the current offset is incomplete; `has_more` omitted AND pages capped at 150 reads 4 pages and 450 items; at +49 minutes no thread read, at +50 one read and `hidden`. Residual by design: INFO N4. |
| M3 | CLOSED for every stage the finding named | `canCall` before every listing page `:422`, hidden read `:307`, reconcile read with its 5 minute stop `:1284`, lead claim at 11 minutes `:387`, thread read `:659`, createLive and dry payload `:898`, `:730`, every retry iteration `:1097`, `:1144`, `:1172`, note `:1115`, worker `:396`; `job_runs` written last in `runImport` `:179-185` on every path. Builder sections 19 and 27 pass. My variations (3.2): 40 note retries at 30 s a call: 26 calls, none at or after 13 minutes, `truncated ["notes"]`, one `job_runs` row; 60 second-absence reads at 20 s a call: none at or after 13, `truncated ["hidden","decide"]`; a throwing dependency still writes exactly one `job_runs` row `ok=false`. Two outbound calls are still started after 13 minutes: see new finding N1 (LOW; the run still ends well before 15 minutes and writes its row). |
| M4 | CLOSED | `brandTermRegex` `_explee_rules.js:497-500`: only a non-dense letter or digit blocks the match. Builder section 14 passes. My variations (3.4): Hangul brand with a particle, Han brand in Chinese, Thai brand with vowel marks, a two-word Latin brand, an upper-case Latin brand and a Latin brand with a diacritic, each inside dense text: all `brand_term`. `acmesoft` in English and in Japanese, `pacmen` in English, `acme2` in Japanese: kept. Adjacent gap found: a FULLWIDTH Latin brand is kept, new finding N2 (LOW). |
| L1 | CLOSED | `DENSE_CLASS` includes `\p{Script=Hangul}` `_explee_rules.js:59`; dense length 6 to 80 `:526-527`. First-round probe (13 characters, 4 words) kept; 5 characters `length`; my variations: 6 characters kept (the floor), 81 characters `length`. |
| L2 | CLOSED | `postReply` returns `ok` only for `data.ok === true` `_explee_client.js:159`; importer `:1227-1234`. Builder section 20 passes. My variation: a 200 with body `{}` gives `failed`, attempts 1. |
| L3 | CLOSED | `followUpPreGate` gives `gave_up` before any read `_explee_rules.js:600-608`; importer writes it `:1174-1180`; terminal statuses are filtered out of the selection `:1168`. My variation: three REAL failures (200 `{ ok: false }`) in three runs, then the fourth run writes `gave_up` with 0 thread GETs and the fifth makes 0 Explee calls for the row (the daily reconcile pinned as done, since it reads every `created` row by its own rule). |
| L4 | CLOSED | `follow_up_max_age_hours` and `max_follow_ups_per_run` `:1174-1185`, expiry before any read. Builder section 20 passes. My variations: created exactly 72 h ago is sent, 72 h 1 min ago is `skipped_expired` with 0 thread GETs; cap 2 with 6 young rows: 2 POSTs and thread reads `1,1,0,0,0,0` (rows past the cap are not read). |
| L5 | CLOSED | `:223-226` throws `StopRun('explee','projects_missing')` before the pause check and before any inbox read. Builder section 21 passes. My variations: the key sees no project at all gives `ok=false stage=explee projects_missing`; `project_ids = {}` stays `ok=true skipped=no_projects` (an empty list imports nothing, not an error, per D1 step 4). |
| L6 | CLOSED | `retryNotes` `:1137-1141` and `writeNote` `:1111-1114`. Builder section 22 passes (failed note plus erased, or undone). My variation: a never-noted row (`note_status` null) with `erased_at`: 0 note GETs or POSTs, `note_status='skipped'`. |
| L7 | CLOSED | `onBeforeClient` before each insert `_provision_client.js:158-162`, importer hook `:956-959`; reclaim by exact `pending_slug` plus equal `brand_website` `:604-629`; a dry run never takes a stale `creating` row `:338`. Builder sections 17 and 28 pass. My variations: a slug clash on the first attempt writes `pending_slug` twice (`["acme","acme-ssss"]`) and the client lands on the second; a stale `creating` row with `pending_slug` is left untouched by a dry run (0 events). Residual: INFO N7. |
| ops I1 | CLOSED | `failure()` `:546-550` (same reason as the stored failed row adds one, anything else starts at 1); `finish()` resets to 0 on any non-failed decision `:530`. Builder section 23 passes. My variation: `email_rate_limited` 12 times stays non-final at attempts 9 (inside `check (attempts between 0 and 10)`). Residual by the spec rule: INFO N3. |
| ops I7 | CLOSED | Skeletons counted, never rowed `:435`; `hidden` and `erased` keep `email_sha256` `:473`, `:479`, `:482`; `suppresses()` covers `erased_at` and final `hidden` `:766-770`. Builder section 24 passes. My variations: skeletons with `person_id` `""` and `"a/b"`: not rowed, `skeletons 2`, `ok=true`; a stored row whose conversation turns into a skeleton (`person_id` null) gets `absent_since`, then `skipped erased` with `erased_at` and the hash kept; a second absence whose thread now answers 404 gives `hidden`, hash kept, `email` null, and the same address under a new person later gives `already_customer`. |

### Do the new tests fail on the old behaviour? (read, and reasoned against the pre-fix lines quoted in the first round)

- Section 12: the old counter rose only on success (first round `:762`), so 6 invites in run 1; the test asserts 1. Fails on old.
- Section 18: old `complete` was "last page shorter than 200" and one absence gave `hidden`; the tests assert `final false`, 4 pages, 450 items. Fail on old (the move-to-front test carries "was hidden", the paging tests "was 1").
- Section 19: old reconcile had no stop; with 10 s per call 100 reads pass 13 minutes. Fails on old.
- Section 20: old answer handling marked every 2xx sent, old loop read the thread of a 3-times-failed row, no cap or age. Each case fails on old.
- Sections 21, 22, 23, 28: old `ok=true`, old note POST to an erased row, old attempts 3 final, old orphan event on any slug match. Each fails on old.
- Section 27: old `createLive` started the homepage read with no time check. Fails on old.
- Section 29 is a text check on the migration; it would fail without the revoke line.

---

## 3. Probe output (pasted)

### 3.1 Caps and attempts

```
PROBE ok   M1 var: prompts insert failing, 6 leads: 1 invite run 1, run 2 a different address, run 1 address never again :: invites after 4 runs: 4, distinct 4, window 4
PROBE ok   M1 var: onStep('invite') progress write fails: final, reserved_at kept, never re-invited :: invites 2, stopCreating=provision_error
PROBE ok   M1 var: invite_error without userId: non-final, reserved_at null, 1 call this run :: attempts 1
PROBE ok   M1 var: a failing referral uses the referral place (counted before the call) :: createsAttempted 1, referralsThisRun 1, invites 0, decisions [["p1","failed","provision_error"],["p2",null,null]]
PROBE ok   ops I1 var: explee_error and prompts_invalid alternating, 6 runs: attempts never reach 3 :: explee_error:1:false prompts_invalid:1:false explee_error:1:false prompts_invalid:1:false explee_error:1:false prompts_invalid:1:false; OpenAI calls 6
PROBE ok   ops I1 var: email_rate_limited 12 times stays non-final and within the CHECK (<= 10) :: attempts 9
```

### 3.2 Time guard

```
PROBE FAIL M3 var: thread read ends at 12.6 min, slow generation: does the invite start at or after 13 min?
     invite started at 13.53 min (guard is 13)
PROBE ok   M3 var: 40 created rows needing a note retry, 30 s per Explee call: no call at 13 min, job_runs row, truncated notes :: calls 26, truncated ["notes"], elapsedMs 780000
PROBE ok   M3 var: 60 rows due for the second-absence thread read, 20 s per call: guard holds in step 8 :: hidden confirmed 37/60, truncated ["hidden","decide"]
PROBE ok   M3 var: daily summary notify after a run that spent 13+ minutes :: summary notify started at 14.0 min
PROBE ok   M3 var: an exception in a dependency still writes exactly one job_runs row with ok=false :: error unhandled
```

(The summary probe is recorded "ok" because it only measured; its 14.0
minute start is part of N1.)

### 3.3 Listing and hidden

```
PROBE ok   M2 var: a deletion in page 1 skips the boundary item on page 2: absent_since only, re-seen next run :: complete true
PROBE ok   M2 var: has_more true and 0 items: incomplete, nothing stamped absent :: pages 2
PROBE ok   M2 var: next_offset equal to the current offset with has_more true: incomplete :: pages 1
PROBE ok   M2 var: has_more omitted AND pages capped at 150: no short-page stop, complete only at the empty page :: pages 4
PROBE ok   M2 var: second absence at +49 min gives no thread read; at +50 min one read and hidden :: at 49: final=false; at 50: reason=hidden final=true
PROBE ok   M2 residual: an active lead missed by two consecutive complete listings is finalised hidden :: p301 decision skipped reason hidden final true
PROBE ok   ops I7 var: skeletons with person_id "" and "a/b": not rowed, counted, run ok :: skeletons 2
PROBE ok   ops I7 var: second absence with thread 404: hidden final, hash kept, same address later already_customer :: p3 skipped already_customer
PROBE ok   ops I7 var: the conversation of a stored would_create row turns into a skeleton: two absences then thread read :: absentFirst true; then skipped erased erased_at true sha true
```

### 3.4 Prompt validation

```
PROBE ok   M4 first-round probe (JP, Latin brand between kana) :: brand_term
PROBE ok   M4 var: Hangul brand term in a Korean prompt with a particle :: brand_term
PROBE ok   M4 var: Han brand term inside Chinese text :: brand_term
PROBE ok   M4 var: Thai brand term (with vowel marks) inside Thai text :: brand_term
PROBE ok   M4 var: two-word Latin brand inside Japanese :: brand_term
PROBE ok   M4 var: uppercase Latin brand inside Japanese :: brand_term
PROBE ok   M4 var: Latin brand with a diacritic inside Japanese :: brand_term
PROBE FAIL M4 var: FULLWIDTH Latin brand inside Japanese (common in JP typesetting)
     got kept, want brand_term
PROBE ok   M4 var: Latin brand glued to a digit inside Japanese (acme2) :: kept
PROBE ok   M4 keep: acmesoft inside Latin English :: kept
PROBE ok   M4 keep: acmesoft inside Japanese :: kept
PROBE ok   M4 keep: Latin word boundary still required, acme-like substring in English :: kept
PROBE ok   L1 first-round probe: 13-char Korean prompt of 4 words :: kept
PROBE ok   L1: 5-char Hangul rejected length :: length
PROBE ok   L1 var: 6-char Hangul is the floor, kept :: kept
PROBE ok   L1 var: 81-char Hangul rejected length :: length
```

### 3.5 Follow-up, notes, orphan

```
PROBE ok   L2 var: reply POST answered 200 {} is failed, not sent :: failed, attempts 1
PROBE ok   L3 var: three real failures in three runs, then gave_up with 0 thread GETs, then 0 calls :: posts 3
PROBE ok   L4 var: created exactly 72 h ago is sent; 72 h 1 min ago is skipped_expired :: p1 sent, p2 skipped_expired, p2 thread GETs 0
PROBE ok   L4 var: cap 2 with 6 young rows: 2 POSTs, rows past the cap get no thread read :: thread reads per row 1,1,0,0,0,0
PROBE ok   L5 var: the key sees no project at all, project_ids {11}: ok=false projects_missing :: stage explee
PROBE ok   L5 var: project_ids {} is ok=true skipped no_projects (not projects_missing) :: skipped no_projects
PROBE ok   L6 var: created row with note_status null and erased_at set: no note GET or POST, skipped :: note_status skipped
PROBE ok   L7 var: pending_slug client on the same website (not ours): what happens :: failed half_made, orphan events 1, deletes 0, invites 0
PROBE ok   L7 var: a stale creating row with pending_slug is left alone by a dry run :: processing creating
PROBE ok   L7 var: onBeforeClient is called before EACH slug attempt and pending_slug ends on the slug that landed :: pending writes ["acme","acme-ssss"], created slug acme-ssss, lead created
```

(My first L3 run failed on a date typo of my own in the probe, which let the
daily reconcile read the row; corrected to keep the reconcile pinned as done,
then it held. Not a code defect.)

---

## 4. New findings, ranked

### N1. LOW. The 13 minute guard is not re-checked between prompt generation and provisioning, before the second generation attempt, or before the daily summary email

Where: `explee-import-background.js:898` is the only `canCall` in
`createLive`; after it come the reservation, `fetchHomepage` (6 s abort,
`_prospect_prompts.js:725`), up to two OpenAI calls (20 s abort each,
`_prospect_prompts.js:793`, loop `:835-848`), the settings re-read and the
provisioning call `:974` (clients insert, GoTrue invite). The same holds for
the dry payload after `:730`. `maybeSummary` `:1325-1338` sends the emailed
summary with no time check.

Inputs and state: live, `last_me_at` recent, each Explee call 4.2 minutes on
the injected clock, so the lead's thread read ends at 12.6 minutes; homepage
6 s, first generation answer invalid, second valid, 25 s each. Measured: the
invite started at 13.53 minutes. Separately, a run whose inbox page returned
at 14.0 minutes at 07:05 UTC started the summary notify at 14.0 minutes.

Why only LOW: the worst case after a check that passes at 12:59 is about 46 s
of generation plus a few seconds of provisioning, so the run still ends near
13:50 and writes its `job_runs` row before Netlify's 15 minute limit; and a
kill mid-provision is caught by Rule U on reclaim. It breaks the letter of D8
"Time guard" ("No ... other outbound call is STARTED when elapsed >= 13
minutes") and of criterion 36's intent, not the outcome M3 described.

Fix (smallest): repeat `if (!canCall(run)) { truncate(run, 'decide'); return release(run, row, token) }`
immediately after `generateValidated` (and before the second attempt inside
`generateValidated`, by passing a `canCall` closure), keeping the F4 settings
re-read as the last awaited call before `deps.provision`; in `maybeSummary`,
skip the send when `!canCall(run)` (the next run sends it, since
`last_summary_date` is not stamped). Test: the probe above, asserting no
invite and the row released.

### N2. LOW. A FULLWIDTH Latin brand inside Japanese text passes the brand-term rule

Where: `_explee_rules.js:125-127` `fold()` uses `normalize('NFD')`, which
does not map compatibility forms; `brandTermRegex` `:497-500` then compares
the folded prompt with the folded term.

Inputs and state: brand terms `['acme']`, prompt
`東京でＡＣＭＥのような会計ソフトは` (fullwidth A C M E, ordinary in Japanese
typesetting). Measured: `kept`; the same prompt with ASCII `ACME` is
`brand_term`. A self-referential prompt then inflates the new account's
visibility from day one, the M4 harm, in the JP market.

Fix (smallest): normalise with `NFKC` before folding inside
`validatePrompts` and `brandTermMatches` only (both the prompt and the term),
leaving `fold()` itself unchanged for its other callers. Test: the prompt
above is rejected `brand_term`.

### INFO

- N3 (ops I1 by the spec's own rule). Two failure reasons that alternate
  (`explee_error` then `prompts_invalid`, repeated) never reach 3 consecutive,
  so the row is retried every live run indefinitely; measured 6 runs, attempts
  `1,1,1,1,1,1`, 6 OpenAI calls. The rule is exactly D8 "Attempts"; it needs
  intermittent Explee failures on the same lead. A spec-level cap on total
  attempts (for example 10, the CHECK ceiling) would bound it. bg-architect's
  call, not a build defect.
- N4 (M2 residual by the spec's own rule). An active lead that is missed by
  two complete listings at least 50 minutes apart (it moves during paging in
  both runs) and whose thread reads normally is finalised `hidden` (measured).
  D1 step 8 says "Any other answer ... `skipped hidden`". The thread read
  could clear `absent_since` instead when its latest message is newer than
  `absent_since`. Needs two coincidences in a row; bg-architect's call.
- N5 (M1 by the spec's own rule, Q8). With a post-invite step failing for
  every lead, each live run still sends one dead-link invite to a NEW lead
  (measured 4 runs, 4 distinct addresses). D8 C4 states this; the summary
  lists the final `provision_error` rows. A pause after, for example, two runs
  ending in a post-invite failure would stop it within the hour; owner's call.
- N6. `notify()` for `explee_daily_summary` and the per-account event are the
  only emails; neither is bounded by `max_*` settings. No defect found, noted
  for the runbook.
- N7 (L7). A client that someone else made on the SAME website with the same
  slug inside the reclaim window is named in an `explee_orphan` event and
  recorded on the lead (measured: `failed half_made`, 1 event, 0 deletes,
  0 invites). Harmless (nothing is deleted or invited); the event text may
  mislead. Needs the wizard and a killed run on the same domain within 20
  minutes.
- N8. Three fixture addresses sit on our own sending domains (criterion 48
  mandates them by name). They name no third party; listed so the
  "no address off `.example`" rule has its recorded exception.

---

## 5. Migration file, read as SQL (not applied)

- Idempotent: `create table if not exists`, `create index if not exists`,
  `drop policy if exists` then `create policy`, settings row and watch row
  `on conflict do nothing`, `revoke` repeats safely. Re-running after a later
  column edit would not add columns (normal for this repo's migrations; the
  file is unapplied, so revision 3 edits land on first apply).
- Ships `mode text not null default 'dry_run'`, `project_ids` empty, watch row
  `enabled false`, Part B `cron.schedule` inside comments only. Test section
  29 pins all three by text and passes.
- RLS on both tables; one SELECT policy each for `is_admin()`; no write
  policy; `anon` revoked; `authenticated` loses insert, update, delete and
  truncate (`:126`).
- CHECKs against every write path I traced:
  - `creating` needs `email_sha256`, `brand_domain`, `reserved_at`: the
    reservation writes all three `:912-916`; `release` restores the previous
    values; the reclaim reset nulls them together with `decision` `:630`.
  - `created` needs `created_at_account` and one of `email`, `erased_at`,
    `undone_at`: `:998-1003` writes both; reconcile nulls `email` only with
    `undone_at` `:1289-1291` or `erased_at` (erasure patch); the reclaim
    completion `:592` keeps the stored `email`.
  - `attempts between 0 and 10`: `failure()` caps at 10, rate limit at 9
    (probe: 9 after 12 failures).
  - `follow_up_status` list: every value the code writes (`sent`, `failed`,
    `skipped_referral`, `skipped_blocked`, `skipped_declined`,
    `skipped_answered`, `skipped_expired`, `gave_up`) is in the CHECK; `wait`
    and `off` are never written.
  - `note_status` (`written`, `failed`, `skipped`) and `collection_status`
    (`enqueued`, `blocked_budget`, `enqueue_failed`) match.
  - `reply_excerpt <= 280`: `excerpt()` cuts at 280 code points, and Postgres
    `length()` counts characters.
  - New settings: `follow_up_max_age_hours 1..720` (code floors at 1),
    `max_follow_ups_per_run 0..50` (0 sends nothing), `own_sender_domains`
    array, `last_dry_reconcile_date` date (the code writes `YYYY-MM-DD`).
  - Unique partial indexes on `email_sha256` and `brand_domain` for
    `creating`/`created`: a post-invite `failed provision_error` row keeps its
    hash but leaves the index (decision `failed`), so it does not block the
    human reset; suppression is done by `suppresses()` instead.

## 6. job_runs and truncation

One row per authenticated run, written last and on every path, including a
throw (probe: `ok=false error=unhandled`) and every truncated run (sections
19, 27 and my probes). `detail.truncated` names the stage (`listing:<id>`,
`hidden`, `reconcile`, `decide`, `notes`, `collections`, `follow_ups`).
`last_reconcile_date` is stamped only when the list finished (section 19).

## 7. Regression surface (grep)

`tests/helpers/fake_supabase_mem.js` is required by 14 test files; all 14 pass
(section 1). `onboard-client.js` is the live admin wizard and now goes through
`provisionAdminWizardClient`; its parity is pinned by
`provision_client.test.js` section 1 (passes). `_prospect_prompts.js` gains
exports only (first round, unchanged since). No file under `src/` is in this
build.

## 8. Not checked

- tsc, `npm run build`, the entry chunk (forbidden in this run).
- The migration on a copy of production and the `has_table_privilege` probes
  of criterion 33 (no Supabase access).
- Real Explee behaviour: item order while paging, skeleton shape, thread
  answers for hidden conversations, `has_more` and `next_offset` on the live
  account.
- Real GoTrue paging (`nextPage`) and invite answers; Supabase SMTP limits.
- Real OpenAI output in JP, KR, TH and ZH markets (how often fullwidth Latin
  appears, N2).
- The auth lens items (F1 to F5, auth I1, I3, listUsers paging, A1 to A4)
  beyond where they overlap this lens: provision_client sections 4c and 4d
  passed in the suite run but I wrote no probe for them.
- `provision_client.test.js` and `explee_rules.test.js` were run, not read
  test by test; section 2 judges the import test sections only.
- Netlify's real 15 minute kill and the real duration of a GoTrue invite.
