PASS WITH FINDINGS

# Explee lead import, build review: correctness, operations, tests

Reviewer: bg-verify (read-only). Date: 2026-11-11.
Subject: the UNCOMMITTED build of `docs/arch/explee-lead-import.md` revision 2.
Lens: correctness against the spec, operations and tests.

INTENT: review explee-lead-import build | SCOPE: docs/qa/ (write), read-only elsewhere | MODEL: opus | STOP AFTER: /verify

Verdict in one line: nothing here blocks the migration or a dry-run deploy;
four MEDIUM findings (M1 to M4) should be closed before `mode='live'`
(D13 step 8). No criterion was found failing. Criteria 1, 21 (partly), 25 and
26 could not be checked under this run's rules.

---

## 0. Calibration

1. Changed files. New (untracked): `explee-import-background.js`,
   `_explee_rules.js`, `_explee_client.js`, `_provision_client.js`,
   `db/supabase-explee-lead-import-2026-11-11.sql`, `tests/explee_rules.test.js`,
   `tests/explee_import.test.js`, `tests/provision_client.test.js`,
   `tests/helpers/fake_explee.js`. Modified: `onboard-client.js` (187 lines
   changed), `_prospect_prompts.js` (+118, additive only), `fake_supabase_mem.js`
   (+60 -4), `refresh_cadence.test.js` (+5 -2). All 13 are in spec section 11.
   The working tree also carries other sessions' edits to `netlify.toml`
   (`resend-invite` timeout 15 to 26), `resend-invite.js`, `src/pages/Onboard.tsx`
   (PendingInvitesPanel), `tests/affiliate_*.test.js`, `fake_clock.js`. By
   content none of those is Explee work; the commit must be by pathspec.
2. Secret and address scan on the new files: 0 key-shaped values. Address scan
   (`rg -o` for addresses, minus `.example`): 2 hits, both `.example` test
   variants (`ANA@Acme.Example`, `xbo@acme.examplex`). Count only.
3. Criteria: the 26 rows of spec section 7, all objectively checkable; 1, 25
   and 26 need tsc, a build or a Supabase copy, which this run forbids.
4. Baseline: tsc and build not run (forbidden in this run). Test baseline for
   the files that load `onboard-client.js`: see section 1 row 1.
5. Most sensitive path: the invite, guarded by `requireCronAuth`
   (`_cron_auth.js:49-77`) on the importer and `requireAuth(event, { adminOnly: true })`
   (`onboard-client.js:72`) on the wizard; Rule U pre-check at
   `_provision_client.js:97-99`.
6. My only write is this file. No reviewed file was edited. One stray control
   file I created at `%TEMP%\ctrl.txt` for the dash positive control was
   deleted the same minute.

CALIBRATED

---

## 1. Acceptance criteria

| # | Criterion (short) | Result | Evidence |
|---|---|---|---|
| 1 | node --check, tsc 0, every test file passes | NOT CHECKED (partly met) | `node --check` ok on all 6 changed or new function files (pasted below). tsc and the full test folder not run (forbidden). Run here: `explee_rules` 110 passed 0 failed; `explee_import` 50 passed 0 failed; `provision_client` 29 passed 0 failed; `refresh_cadence` 17 assertions passed. No segfault. |
| 2 | rules test: every D3 row in order, decline regex, unsubscribe alone, earlier unsubscribe, referral labels, reply_count no effect, hold and include, >= 70 checks | MET | `tests/explee_rules.test.js` 110 checks; rows 1 to 10 named one by one; decline list at `:151`, non-decline at `:154`; reply_count section `:158-165`. |
| 3 | domains: fallback, excluded referral, subdomain both ways, profile domain wins | MET | rules test cases "a free-mail or platform company_domain falls back", "both excluded gives null", "domainsMatch ...", "brand domain is the profile domain when usable"; code `_explee_rules.js:301-309`, `:242-247`. |
| 4 | replier cases incl. null email on email_changed creating for the body address | MET | rules test "rule 9 ..." x4 and "criterion 4: ..."; code `_explee_rules.js:207-214`, `:397-418`. |
| 5 | validatePrompts cases, one valid JA, ZH, TH, count pinned to planConfig | MET (see M4, L1) | rules test `:342-353`; pin reads `src/lib/planConfig.ts`. The criterion passes as written; M4 is a gap the criterion does not ask about. |
| 6 | 450 candidates, max_threads 200, all rowed after run 1, decided after 3 | MET | `explee_import.test.js:282-294`. |
| 7 | empty project_ids reads only projects; unlisted project never read | MET | `explee_import.test.js:197-216`; code `explee-import-background.js:193`. |
| 8 | Lost after dry run gives team_lost; disappearance gives hidden; incomplete listing changes nothing | MET (see M2) | `explee_import.test.js:297-331`. |
| 9 | interleaved runs: one account per identity, cap counts creating | MET | `explee_import.test.js:404-432`; the test asserts a real reservation conflict happened (`:413`). |
| 10 | live: one client, invite redirect, viewer, 5 prompts, audit, scheduled run, one note, zero reply and status POSTs | MET | `explee_import.test.js:347-375`. |
| 11 | Rule U: pending and profile-less users untouched, no deletes | MET | `explee_import.test.js:384-393`; `provision_client.test.js` section 3. |
| 12 | wizard parity, viewer-only helper, source-text guard | MET | `provision_client.test.js` section 1 runs `feed1d5` (the last commit on `onboard-client.js`, confirmed with `git log`) against the new file in 11 scenarios; section 5 source guard; grep finds no `'admin'` literal in the importer or rules module. |
| 13 | dry run over >= 20: own tables only, zero POSTs, <= 5 OpenAI calls, payloads, clean request | MET | `explee_import.test.js:240-264`. |
| 14 | caps 5 then 1, referral 1 per run, day window across midnight | MET (see M1) | `explee_import.test.js:435-466`. |
| 15 | breaker on 429 and "rate limit", not on "generate" or "limit" | MET | `explee_import.test.js:467-495`; regex `_provision_client.js:66-68`. |
| 16 | erased and hidden created lead found by reconcile; declined event | MET | `explee_import.test.js:529-555`. |
| 17 | off modes, bogus mode, off mid-run, refused gate, exception | MET | `explee_import.test.js:144-194`, `:496-503`. |
| 18 | retention, no excerpt for final declines, phone masked, summary clean | MET | `explee_import.test.js:566-609`. |
| 19 | injected clock, 23:59 and first of month, summary once per date >= 07:00, no test reads the real date | MET | grep for `Date.now` and argless `new Date()` in the new code and tests: only `explee-import-background.js:111` and `onboard-client.js:158`, both production deps. Code under test that reads the real clock (`_auth.js` month bounds, `_enqueue.js` capped engines) does not change any asserted outcome. |
| 20 | seven calls only, `/` rejected, nothing after 402, abort signal | MET | `explee_import.test.js:650-680`; `_explee_client.js:83-84`, `:63`. |
| 21 | fake changes opt-in, every existing test passes | NOT CHECKED by run | Diff read: every new behaviour sits behind a new option (`extraUnique`, `sumCostEur`, `pagedListUsers`, `authBehaviour`); the default `inviteUserByEmail` still returns `createUser({ email })`; `deleteUser` is a new method not previously defined. The other suites using the fake (affiliate, oauth, mcp, phase2) were not run. |
| 22 | no real person, address or key; no dash | MET | address scan section 0; `rg -c` for U+2014 and U+2013 on the 9 new files exit 1 (no match), on added lines of the 4 modified files exit 1, positive control matched (exit 0). |
| 23 | listed files untouched | MET for this build | By content, the edits to `netlify.toml`, `resend-invite.js`, `Onboard.tsx`, affiliate tests and `fake_clock.js` belong to the invite-recovery session. The working tree is not clean: commit by pathspec. |
| 24 | exactly one new env var | MET | `process.env` reads in new code: `EXPLEE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`; `_prospect_prompts.js` additions read `OPENAI_API_KEY` (existing). |
| 25 | migration on a copy of production, anon and non-admin probes | NOT CHECKED | No Supabase access in this run. Read-only review of the SQL in section 6. |
| 26 | entry chunk does not grow | NOT CHECKED | No build. No file under `src/` is part of this build. |

`node --check` output:

```
check ok explee-import-background.js
check ok _explee_rules.js
check ok _explee_client.js
check ok _provision_client.js
check ok onboard-client.js
check ok _prospect_prompts.js
```

---

## 2. Findings, ranked

### M1. MEDIUM. Failed provisions are not counted against any cap, so a systematic post-invite failure mails dead invite links to every qualifying lead, up to 3 times each

Where: `explee-import-background.js:683` (per-run cap reads `run.createsThisRun`),
`:762` (incremented only on success), `:802-804` (`provision_error`, non-final,
creation continues); daily cap `:706-712` counts `creating`/`created` only and
the failure path clears `reserved_at` (`:771`, `:803`).
`_provision_client.js:150` sends the invite, then `:175-203` rolls back on a
profile, prompts or progress-write failure.

Inputs and state: live mode, 17 qualifying rows, any failure after the invite
step that repeats (a `user_profiles` insert error, a `prompts` insert error, or
the `onStep('invite')` write to `explee_leads` failing). Each row: invite email
sent by GoTrue, then the user is deleted, then `failed provision_error`
non-final. `createsThisRun` stays 0, so the next row is provisioned in the same
run; the daily count stays 0. Next run, the same rows again, until
`attempts = 3`. Result: up to 3 invite emails per lead, each with a dead link,
from the owner's sign-in address, to real prospects. The only brake is the
SMTP rate-limit breaker, if it trips.

Fix (smallest): count attempts, not successes. Increment `run.createsThisRun`
(and `referralsThisRun` for referrals) immediately before `deps.provision(...)`,
and on `provision_error` set `run.stopCreating = true` so one failure stops the
run's creation. Add a test: `failInsert: ['user_profiles']` with 6 qualifying
leads gives exactly 1 invite in run 1.

### M2. MEDIUM. The hidden inference trusts an offset-paged listing that is sorted most recent first, and ignores `has_more`; a lead that gets new activity during paging is finalised as `hidden`

Where: `explee-import-background.js:355-370` (`complete` = last page shorter
than 200), `:256-267` (absent from a complete listing gives `skipped hidden`,
final, email and sha nulled); `_explee_client.js:114` parses `hasMore` and
nothing reads it. OpenAPI: the inbox is "most recent first" with
`limit`/`offset` paging (`InboxContactsResponse.has_more`, `next_offset`).

Inputs and state: 951 conversations, 5 pages. Lead X has a non-final row
(for example `would_create`, or a `hot_lead` held as `replied_by_other`) and
sits at position 450. Between the read of page 1 and page 2, X gets new
activity (a reply, or a message sent from the Explee inbox or autopilot) and
moves to position 0. Pages 2 to 5 no longer contain X, page 1 was read before
the move, the last page is short, so the listing is `complete` and X is absent:
its row becomes `skipped hidden`, final. It is never re-decided, although the
new activity is exactly what should re-decide it. The same outcome follows,
for every stored row past the first page, if Explee ever serves fewer than
`limit` items on a non-final page. The fake (`tests/helpers/fake_explee.js:90-98`)
keeps insertion order and never moves an item, so no test can see this.

Fix (smallest): mark hidden only after absence from two complete listings at
least one run apart, using the existing `listing_seen_at` (for example: absent
now AND `listing_seen_at` older than 90 minutes). Also treat a page as last
only when `hasMore === false` (fall back to the length rule when the field is
missing). Add a fake mode that moves an item to index 0 between page reads.

### M3. MEDIUM. Only the decide loop is bounded by the 12 minute guard; the listing, retry passes and the daily reconcile are not, against the 15 minute background limit, and a kill writes no `job_runs` row

Where: guard `explee-import-background.js:326` (decide loop) and `:886`
(follow-ups) only. Unbounded: `readListing` `:355` (up to `max_inbox_pages`
= 50 pages), `retryCollections` `:827`, `retryNotes` `:864` (GET plus POST
per row), `reconcile` `:966-1000` (up to `max_reconcile_per_day` = 100 thread
GETs). Each Explee call may take 10 s, or 22 s with the one retry
(`_explee_client.js:63`, `:86-89`).

Inputs and state: a live run at 07:xx UTC on a slow Explee day. The decide
loop stops at 12 min, then `retryNotes` and the 100-GET reconcile start. At
10 s per GET the reconcile alone needs 16 min. Netlify kills the function at
15 min: no `job_runs` row is written (`runImport` writes it last, `:152-158`),
`last_reconcile_date` is not set, so every following run after 07:00 starts
the same reconcile again and is killed again. The watchdog reports silence
after 2 hours, but the daily summary and erasure handling stop until Explee
speeds up.

Fix (smallest): one helper `timeLeft(run)` and a check before each iteration
of the listing, the three retry passes and the reconcile; stop at about
13 minutes, write `detail.truncated = '<stage>'`, and set
`last_reconcile_date` only when the reconcile finished its list.

### M4. MEDIUM. The brand-term rule of `validatePrompts` never fires in Japanese, Chinese, Thai or Korean text, so self-referential prompts pass in those markets

Where: `_explee_rules.js:443`, term regex
`(?<![\p{L}\p{N}])term(?![\p{L}\p{N}])` on the folded prompt.

Inputs and state: market JP, brand "Acme". Generated candidate
`東京でacmeのような会計ソフトは` (folded). The character before `acme` is
`で` and after it `の`, both `\p{L}`, so neither lookaround holds and the
prompt is kept. Han, kana, Thai and Hangul attach particles directly to the
noun, so a brand name in those scripts (or a Latin brand inside them) is
almost never bounded by a non-letter. Markets affected today: JP, TW, HK, TH,
KR (and CN if listed). The generator is told not to use the name
(`_prospect_prompts.js` system prompt), but the validator is the only check
and it is silent here. A prompt that names the brand inflates the account's
visibility score from day one. The criterion 5 test uses brand `Acme` with
prompts that do not contain it (`tests/explee_rules.test.js:342-345`), so it
cannot catch this.

Fix (smallest): when the prompt contains a Han, kana, Thai or Hangul
character, match each brand term as a plain folded substring; keep the
lookaround match for other scripts. Test: the example above is rejected
`brand_term`.

### L1. LOW. Hangul is not in the dense-script length rule

`_explee_rules.js:58`, `:456-461`. Korean prompts go through the 15 to 200
character and 3 word rule. `서울 회계사 추천해 주세요` (13 characters, 4 words) is
rejected `length`. With 8 candidates for 5 slots, a KR lead fails
`prompts_invalid` more often. Fix: add `\p{Script=Hangul}` to the dense rule,
or lower the floor for Hangul to 8 characters.

### L2. LOW. A follow-up answered 200 with `ok: false` is recorded as sent

`_explee_client.js:154` drops `data.ok`; `explee-import-background.js:921-923`
marks every non-403/409/429 answer `sent`. OpenAPI `SendReplyResponse.ok` is
"whether the reply was accepted for sending". Fix: return `ok` from
`postReply` and treat `ok !== true && !deduped` as `failed`.

### L3. LOW. A follow-up that failed 3 times is re-read every live run, forever

`explee-import-background.js:888` lets `failed` rows through, `:891` reads the
thread, then `_explee_rules.js:519` answers `off` and the loop continues
without writing a terminal state. One thread GET per such row per hour,
indefinitely. Fix: when `follow_up_attempts >= 3`, skip before the GET (or
write a terminal status).

### L4. LOW, needs a product ruling. Enabling the follow-up later mails every past import at once

`_explee_rules.js:514-528` has a minimum delay and no maximum age;
`explee-import-background.js:884` has no per-run cap. When the owner sets
`follow_up_enabled = true` at D13 step 9, every `created` row with a null
status gets the "your account was set up" reply in the same run, however old.
Fix if unwanted: a `follow_up_max_age_days` setting or a per-run cap.
/escalate: whether old imports should get it is the owner's call.

### L5. LOW. A listed project id the key cannot see imports nothing and still reports `ok = true` every hour

`explee-import-background.js:195-196`, `:226` (`listed.length && ...` is false
when every listed id is missing). A typo in `project_ids` is only visible in
`detail.projectsMissing`. Fix: `ok = false, error = 'projects_missing'` when
`listed` is empty but `project_ids` is not.

### L6. LOW. `retryNotes` writes notes for erased or undone created rows

`explee-import-background.js:864-872` checks `client_id` and `campaign_id`
only; `followUps` checks `erased_at` and `undone_at` (`:887`), `retryNotes`
does not. A created row erased after a failed note gets a POST to the erased
lead. Fix: skip `erased_at` or `undone_at` rows.

### L7. LOW. A kill between the client insert and the `client` progress write leaves an orphan client that is later reported as `already_customer`, with no event

`_provision_client.js:126-147`; importer reclaim `:481-483` (no ids, so
re-decided) and dup check 3 `:611-614` (the orphan's `brand_website` now
matches). The window is one database round trip. Fix: before step 1, write
the intended slug or a marker on the lead row, or have the reclaim path look
for a client whose `brand_website` equals the reserved `brand_domain` and
created at or after `reserved_at`, and raise `explee_orphan`.

### INFO

- I1. `attempts` is never reset when a row changes stage, so two transient
  thread failures plus one prompt failure make a row final
  (`explee-import-background.js:505`, `:518`, `:718`).
- I2. A dry run sends no daily summary (`:939-943`). This follows the dry-run
  write rule (D8) over the summary rule; the owner reviews with SQL during
  D13 steps 5 and 6. Worth stating in the runbook.
- I3. A dry run also loads the auth users (`:317`), which the performance
  budget listed as live only. It makes the dry run's `already_customer`
  honest; keep it.
- I4. Unpaged reads (`loadRows` `:376`, `reconcile` `:952`, retry passes,
  `clients` `:315`) will meet PostgREST's default 1,000 row cap. Far away at
  today's volume (17 candidate rows).
- I5. `provision_client.test.js` section 1 pins the wizard to `feed1d5`. Any
  later intended change to `onboard-client.js` will fail it; retire section 1
  once this ships. CI checks out with `fetch-depth: 0`
  (`.github/workflows/dashboard-ci.yml:40`), and the test skips cleanly when
  the commit is unreadable.
- I6. The invite-recovery session's edit to `Onboard.tsx` says invite links
  expire "after about an hour". That bears on Q3 (D13 step 8 precondition)
  and on the follow-up text in D9.
- I7. Erased skeleton listing items may carry `person_id: null` (OpenAPI
  `InboxContactItem.person_id` is nullable). Such a row would end as `hidden`
  rather than `erased`, losing its `email_sha256` suppression hash
  (`:262-265`). Unverified on the live account (0 erased today).

---

## 3. Explee calls against the OpenAPI file

Read from the third-party file as data. All paths, methods, parameters and
field names match: `GET /autogtm/projects` (`projects[]`), `GET
/autogtm/projects/{project_id}/inbox` with `limit` <= 200 and `offset`
(`contacts`, `has_more`, `next_offset`), `GET
/autogtm/campaigns/{campaign_id}/inbox/{person_id}` (`messages[].type`,
`from_email`, `to_email`, `cc`, `body_text`, `intent`, `ts`, `can_reply`,
`reply_blocked_reason`, `latest_intent`, `lead.company_domain`, `lead.country`),
note GET/POST with `{ note }`, reply POST with `{ body_text, reply_all }`,
`GET /me` (`plan`, `balance.remain`). `ProjectItem` has no `name`; the code
stores null for it, harmless. `reply_count` is used only by `isCandidate`, never
by a rule (L confirmed: the OpenAPI calls it "human replies", the live account
contradicts it, the code follows the live fact). A null inbox `email` gives an
unknown replier (`_explee_rules.js:207-214`), never the enriched profile
address.

## 4. Cursor, caps, partial failure, timeout

- No cursor: the table is the queue. A run stopped by the guard or a cap
  leaves rows `seen` or decided; `release()` (`:433-443`) restores the claimed
  row. Nothing is lost by stopping early, except as in M2 and M3.
- Caps: correct for successes; see M1 for failures. The day window counts the
  reserving row itself and refuses at `> max` (`:708`), so 30 means 30.
- Breaker: sets `paused_until = now + 1 h` (`:790`), next run skips at step 5.
- Partial failure after a successful provision: enqueue, note, follow-up each
  keep their own status and retry counter; none can undo the account.
- Timeout class: background, 15 minutes, no `netlify.toml` entry needed
  (`netlify.toml` unchanged by this build). See M3.

## 5. job_runs and watchdog

One row per authenticated run, written last (`:152-158`); a refused gate writes
none (test `:144-153`). `mode='off'` with no key writes `ok=true skipped=off`:
no hourly noise. A missing key in `dry_run` or `live` writes `ok=false
stage=config` every hour once the cron exists; that is the spec's intent, and
the watch row (`consecutive 2`, `2 hours`) turns it into one alert. The
watchdog also fails a row that carries `detail.error`
(`db/supabase-observability-watchdog-2026-10-28.sql:103-110`); the importer
sets `error` only on `ok=false` paths. `job_runs.ran_at` comes from the column
default, which the spec does not forbid.

## 6. Migration file (read, not applied)

Idempotent: `create table if not exists`, `create index if not exists`,
policies dropped then created, settings row and watch row `on conflict do
nothing` (`ops.watch_expectations.job` is the primary key). RLS on both
tables, one SELECT policy each for `is_admin()`, no insert, update or delete
policy, `anon` revoked. Touches no existing table's data; the only link is the
FK to `clients(id) on delete set null`. Safe before the deploy: nothing reads
the tables until the function exists and the cron is commented out. CHECKs
agree with every write path I traced: `creating` always carries
`email_sha256`, `brand_domain`, `reserved_at` (`:696-699`); `created` always
carries `created_at_account` with `email`, and the only paths that null `email`
on a created row set `erased_at` or `undone_at` (`:451-456`, `:969-972`);
`country` passes through `resolveMarket`. The service role bypasses the prompt
cap trigger (`db/supabase-prompt-cap-bypass-fix-2026-11-09.sql:68-70`), so the
5 Free prompts insert.

## 7. First collection on the Free plan

`_enqueue.js:94-268` with `force: true, replaceExisting: false, trigger:
'scheduled'`: `replace` is false, so nothing is deleted; all 5 prompts get the
plan's engines (`gemini`); a `collection_runs` row with `trigger='scheduled'`
is written, so the 720 h manual cooldown (`:299-312`, manual only) is not
spent. `last_refresh_at` is stamped at creation, so `schedule-collections`
does not collect again for 30 days. If the lead clicks Run straight away, the
second EUR 0.16 meets the EUR 0.30 budget gate. Correct.

## 8. Tests: what they prove, what they do not

Behavioural, not mirrors: they drive the real importer, client, rules,
provisioning, `_auth.checkCollectionLimits` and `_enqueue` through two fakes,
and assert on database rows, the Explee call log and captured OpenAI bodies.
They use fixed clocks, so they will still pass a year from now.

Untested: M1 (repeated post-invite failure), M2 (item moving during paging,
`has_more`), M3 (slow reconcile), M4 (brand inside CJK text), the reclaim
completion path where both ids and every step are present (`:470-473`),
`rollback_failed` from the importer side (`:793-800`), `blocked_budget` and
`enqueue_failed` retries, note failure and its retries, follow-up 403, 409,
429 and 5xx handling, `auth_lookup_incomplete` in live mode.

Existing tests: the two files that load `onboard-client.js`
(`provision_client.test.js`, `refresh_cadence.test.js`) pass.

## 9. Regression surface (by grep)

- `onboard-client.js` is the live admin wizard. New behaviours: a pre-check
  `listUsers` pass on every call (a listing error now answers 500), and an
  existing pending user now gets the 409 text. Needs the owner's smoke test
  (D13 step 4): create and delete one test client.
- `tests/helpers/fake_supabase_mem.js` is used by `affiliate_*`, `oauth_*`,
  `mcp_server`, `client_api_keys`, `phase2_*`, `resend_invite` and others; not
  run here (criterion 21).
- `_prospect_prompts.js` is used by the audit and prospect paths; the change is
  two new exports at the end, existing exports untouched (diff read).
- `refresh_cadence.test.js` lists now name `_provision_client.js`.

## 10. Data and claim integrity

No user-facing number or claim is added. Stored values trace to Explee fields
(section 3) or the injected clock. The note line and the summary carry counts,
labels, reason codes, masked addresses and ids only (`_explee_rules.js:531-533`,
`explee-import-background.js:1028-1037`).

## 11. Not checked

tsc; `npm run build` and the entry chunk; the full `tests/` folder (only the
four files above were run); the migration on a copy of production and the RLS
probes as `anon` and as a non-admin (criterion 25); real Explee behaviour for
item order during paging, erased skeleton `person_id`, thread reads of hidden
conversations; GoTrue's real `created_at` and invite answers; Supabase SMTP
limits; the OpenAI model's real output in non-English markets; the abuse and
security lens beyond what touched operations (a separate review covers it).
I ran `node` once to read the OpenAPI JSON as data, in addition to the test
files and `node --check`.
