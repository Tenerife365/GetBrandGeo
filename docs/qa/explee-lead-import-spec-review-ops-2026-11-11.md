SOUND WITH CHANGES

# Explee lead import spec: review, operations / cost / deliverability / claims lens

Reviewer: bg-verify, read-only. Date: 2026-11-11.
Subject: `docs/arch/explee-lead-import.md` (1,007 lines, read in full).
Method: every repo citation opened at the cited line; the Explee OpenAPI
document read with a small node script (operations `projects/{id}/inbox/changes`,
`projects/{id}/inbox`, `campaigns/{id}/inbox/{person_id}`, `.../reply`,
`.../note`, `.../status`, `/me`, `webhooks`, schemas `InboxContactItem`,
`ThreadResponse`, `ThreadMessage`, `LeadProfile`, `SendReplyResponse`). No npm,
tsc, build, server, browser, external API or mutating git command was run.
The owner's rulings R1 to R4 are not re-argued.

Verdict: the shape is right (one poller, one state table, pure rules, a shared
provisioning helper, dry run first), and almost every citation is accurate.
Nine defects must be closed in the spec before a build, because each one
either loses leads, invites someone the rules exclude, destroys an existing
login, or makes the stated acceptance criteria impossible to pass.

---

## 1. Citations checked

| Spec claim | Result |
|---|---|
| `onboard-client.js:132-213`, `:68`, `:160-163`, `:108`, `:124-139`, `:165-211`, `:228-253` | Correct |
| `provision-account.js:19-21`, `:49-59`, `:160-174`, `:178-198`, `:190-191` | Correct |
| `_prospect_guard.js:64`, `:70` | Correct |
| `_prospect_prompts.js:25-53` (homepage), `:218-228` (fallback), `:392-419` (aliases) | Correct |
| `_prospect_prompts.js:113` as "brand name sanitiser" | Half right: `:113` is `sanitizeRecoveredBrandName`; `cleanBrandName`, which D5 and D6 lean on, is `:63` and is NOT exported (`:698-701`). Usable inside the module only. LOW. |
| `suggest-prompts.js:47`, `:56-73`, `:65` | Correct |
| `_enqueue.js:57-71`, `:94-103`, `:115-119`, `:152-155`, `:277-288`, `:299-312` | Correct |
| `_cost.js:249`, `:408`, `:533`, `:567`, `:604`, `:607` | Correct (gemini 0.032, free `['gemini']`, 0.30, 720 h, 1,500/day, monthly) |
| `planConfig.ts:563` `PLAN_PROMPTS.free = 5` | Correct. Also relevant and not cited: the database trigger `trg_enforce_prompt_cap` (comment at `planConfig.ts:556-559`) caps the insert at 5. |
| `_auth.js:235` | Correct |
| `_cron_auth.js:49-77` | Correct |
| `db/supabase-scheduled-jobs-migration.sql:119-134` | Correct |
| `schedule-collections.js:58-65` | Correct |
| `db/supabase-observability-watchdog-2026-10-28.sql:40-47`, `:54-66` | Correct |
| `_admin_notify.js:42-61`, `:22` | Correct |
| `netlify.toml:247`, `:271` | Correct at HEAD and in the working tree (the other session's diff is at `:172`, above both) |
| `mcp-server.js:59` | Correct |
| `clientContext.tsx:49` as "decides onboarding by whether a profile exists" | Wrong line: `:49` is the type declaration. The decision is `clientContext.tsx:172`. LOW. |
| `db/supabase-collection-queue-migration.sql:20`, `db/supabase-onboarding-complete-migration.sql:7` | Correct |
| `tests/helpers/fake_supabase_mem.js:26-47`, `:52`, `:308` | Correct, but see M5: the fake cannot run the path the spec tests. |
| Section 5.2: "401/405/503 from requireCronAuth before that [202]" | Wrong. A Netlify background function answers 202 to the caller before the handler runs; the handler's return value is discarded. The caller never sees 401 or 503. The gate still works (the handler exits), but nothing outside can observe a refusal. LOW, fix the sentence. |

Explee claims checked against the OpenAPI document:

| Spec claim | Result |
|---|---|
| `inbox/changes`: oldest first, cursor paging, no `since` = from the start, hidden conversations stop coming back, no company domain or country on the item | Correct |
| `latest_intent` examples `hot_lead`, `not_interested`, `out_of_office`, `unsubscribe` | Correct |
| `ThreadMessage.type` value unknown, "confirm in the dry pull" (5.3) | Published: `sent` (ours) or `reply` (theirs). Use it. |
| `body_text` needs quoted history stripped (D4 step 2) | The document says `body_text` is already "quoted history stripped". Stripping again is harmless. |
| `reply` 429 = "at most three replies per lead message" | Partly: the description says three per message; the 429 response says "too many replies to this contact in the last 24h". There is also a 409 "another reply is being sent, retry after Retry-After" the spec does not handle. |
| `/me` returns `balance` as a number (5.2 `me.balance: number`) | Wrong shape: `balance` is an object, `{"remain": 4200}`. |
| 10,000 requests an hour | Correct, plus two limits the spec does not name: 4 concurrent "heavy read" requests per organization, shared by `inbox/changes`, `projects/{id}/inbox`, `campaigns/{id}/leads` and `.../status`; and every request answers 402 when the Explee credit balance is not positive. |
| Thread has `lead_status` | It does NOT. `lead_status` exists only on the inbox list items and the change feed item, and the feed says it is "as of the call; a status changed in the app since does not bring the conversation back, so re-read the thread before you act on it". This drives M2. |

---

## 2. MUST change before a build

### M1. The cursor advances past conversations the run never processed (backlog lost)

Where: D1 (lines 152-159), D8 caps (lines 426-429), 5.1 `cursors`.

Scenario: first live or dry run, null cursor, 1,400 historic conversations with
a reply. The run pages 14 pages of `limit=100` (under the 20-page cap) and
stores `next_cursor`. It then reads at most `max_threads_per_run = 200` threads
and stops at the 12-minute guard. The other 1,200 conversations are behind the
stored cursor. The feed returns a conversation again only when it gets a new
message, so those 1,200 replies are never decided. The spec's own numbers
(2,000 items a run versus 200 threads) make this certain on any real backlog.
D8's "processing row older than 20 minutes is reclaimable" does not help: the
spec never says a run scans the table for unprocessed rows, and the
re-decision index covers `final = false` decided rows only.

Smallest change: every feed item is written to `explee_leads` before the
cursor is saved (a light upsert: ids, `latest_intent`, `reply_count`,
`latest_reply_at`, `lead_status`, `state = 'seen'`), and the cursor is saved
only after those writes succeed. Each run then works a queue read from the
table (`state in ('seen')` plus reclaimable `processing`), bounded by
`max_threads_per_run`. Add an acceptance check: a feed of 450 items with
`max_threads_per_run = 200` is fully decided after three runs.

### M2. Re-decided rows act on a stale lead status and a stale thread

Where: D8 lines 417-420 ("would_create rows are re-decided on the first live
run"), D3 line 235 (held rows re-decided when a label is added), D3 rule 3.

Scenario: D13 step 5 has the owner review the dry list. The natural way to
exclude a lead in Explee is to mark it Lost or Unqualified. That status change
does not bring the conversation back to the feed (documented), and the thread
response carries no status. On the switch to live, the `would_create` row is
re-decided with the `lead_status` stored from the dry pull, and the lead the
owner just marked Lost gets an account and an invite email. Same for a lead
who unsubscribed after the dry pull: hidden conversations stop coming back.

Smallest change: (a) immediately before provisioning, re-read the thread
(fresh `erased`, `can_reply`, `reply_blocked_reason`, latest intent) and
re-run `qualifyLead` on it; (b) once per live run, read the current status of
every candidate from `GET projects/{id}/inbox?tab=replied` (offset paging,
limit 200; at 50 replies a day that is under 10 pages a month of history) and
use that `lead_status`, not the stored one. Acceptance: a `would_create` row
whose lead is set to Lost in the fake Explee after the dry run is skipped
`team_lost` on the live run.

### M3. The shared helper's rollback can delete a login it did not create

Where: 5.4 and D8 "partial failure"; the behaviour moved from
`onboard-client.js:179-184` and `:205-210`. PRE-EXISTING in onboard-client,
but the importer turns it from an admin-typo case into a scheduled one.

Scenario: on 2026-11-11 the owner invited ten leads by hand and none completed
(`resend-invite.js:8-10`). Those are exactly the Explee repliers the backfill
will meet. Suppose one hand-made client stored `brand_website` with a
different domain form than Explee's `company_domain` (a country TLD, a
subdomain), so the D5 domain check misses it. The importer invites the same
address. For an existing but unconfirmed user, GoTrue resends the invite and
returns the existing user rather than an error (not verified live here; the
fix is cheap either way). `user_profiles` insert then fails on its primary key
(the profile already exists), and the rollback runs
`auth.admin.deleteUser(authData.user.id)`: the lead's real pending login on
the hand-made client is deleted. A second path to the same damage: the
function is killed mid-provision, the `processing` row is reclaimed 20 minutes
later, and the re-run invites the half-created user again.
`resend-invite.js:27-35` already documents that `inviteUserByEmail` creates
users and guards it; the helper must not regress that.

Smallest change: in `_provision_client.js`, (a) look the address up among
existing auth users before inviting (the paged `listUsers` pass
`resend-invite.js` already uses) and return `email_registered` without
inviting when one exists, confirmed or not; (b) roll back only a user whose id
was not present before the call; (c) write `client_id` and `user_id` onto the
`explee_leads` row as each step lands, and have a reclaim finish or report a
half-made account instead of provisioning from scratch. Acceptance: a test with
a pre-existing unconfirmed user for the invitee asserts that user still exists
afterwards and the lead is `already_customer`.

### M4. The erasure update violates the table's own CHECK constraint

Where: D2 lines 193-197 versus 5.1 line 736.

Scenario: a created lead later arrives `erased`. D2 says the function nulls
`email` on the row and keeps decision `created`. The table CHECK is
`decision is distinct from 'created' or (email is not null and created_at_account is not null)`.
The UPDATE fails with 23514, the personal data is not removed, and the run
logs an error every hour for that lead. The fake does not model CHECK
constraints, so the planned test would pass while production fails.

Smallest change: drop `email is not null` from the CHECK (keep
`created_at_account is not null`), or add `or erased_at is not null`. Say in
D2 whether `email_sha256` is kept on erasure (it is what stops the same person
being created again under a new `person_id`).

### M5. The planned tests cannot pass as specified, and an existing test breaks

Where: D12 test list, section 7 criteria 5 and 11.

1. `checkCollectionLimits` reads spend through `supabase.rpc('sum_cost_eur')`
   (`_auth.js:195`). The fake knows three RPCs only
   (`fake_supabase_mem.js:255-286`) and answers "unknown rpc" for anything
   else, so the budget check returns `budget_unverifiable`, blocks, and no
   `collection_runs` row is written. Criterion 5 ("one `collection_runs` row
   with `trigger='scheduled'`") fails.
2. The fake's `inviteUserByEmail(email)` (`:308`) drops its options, so
   criterion 5's `redirectTo` assertion has nothing to read.
3. `tests/refresh_cadence.test.js:189-200` asserts that `onboard-client.js`'s
   source calls `refreshCadenceFor(` and contains `refresh_cadence`. After the
   extraction both move to `_provision_client.js`, so this existing test fails.
   It is not in the spec's file list or regression surface.

Smallest change: add to D12 (a) a `sum_cost_eur` RPC in the fake that sums
seeded `ai_results` cost, (b) `inviteUserByEmail(email, options)` recording
`options.redirectTo` and an injectable error (rate limit, already registered),
(c) `tests/refresh_cadence.test.js` modified to check `_provision_client.js`
in both lists, and add that file to the regression surface.

### M6. An empty project list imports every project the key reaches

Where: 5.1 `project_ids ... default '{}' -- empty = every project`, Q6.

Scenario: the owner's Explee organisation also runs outreach that is not
BrandGEO customer acquisition (another business, or a BrandGEO partner
recruitment campaign). A recruiter or prospective affiliate who replies there
gets a BrandGEO Free account and an invite email on the first live run,
automatically and with no human reading it.

Smallest change: empty means NONE (fail closed). The dry pull records every
project and campaign the key reaches with its name in `job_runs.detail`, and
the owner sets `project_ids` explicitly at D13 step 5. Consider a
`campaign_ids` allow list as well, empty meaning every campaign of the allowed
projects.

### M7. The prompt validator rejects every prompt in four live markets

Where: D6 validator rule "3 to 30 words".

Scenario: `markets.ts` contains JP, TW, HK and TH. D6 tells the model to write
in the market's language. Japanese, Chinese and Thai prompts have no spaces,
so each is one "word", all 8 candidates fail, the retry fails, and every lead
in those markets ends `failed prompts_invalid` after three attempts. The
system never creates an account there.

Smallest change: apply the word rule only to scripts that separate words with
spaces; for CJK and Thai use a character range (for example 6 to 80
characters). Add one test per script.

### M8. Clocks: decision timestamps rely on database defaults, and UTC is not stated

Where: 5.1 `first_seen_at default now()`, D2 30-day purge, D8 daily summary,
24 h cap, 20-minute reclaim, `last_me_at`.

Scenario: the 30-day excerpt purge needs a row age. The only age column is
`first_seen_at`, filled by the Postgres default. The in-memory fake applies no
default for a new table, so in tests the column is undefined and the purge
test finds nothing, or a test sets it from the real clock while the code uses
the fake clock (the mix that produced today's affiliate test time bomb,
`tests/helpers/fake_clock.js:7-12`). Separately, "07:00 UTC" and
`last_summary_date` are not required to be computed in UTC; `_auth.js:215-218`
already builds month boundaries in local time, which differs from Netlify on
this Windows machine.

Smallest change: one sentence in D8 and D12: every timestamp the importer
writes or compares (`first_seen_at`, `updated_at`, `created_at_account`,
`paused_until`, `follow_up_at`, the 24 h window, the purge cutoff, the summary
date) comes from one injected `now()`, never from a database default; dates
use `toISOString().slice(0, 10)`; the test suite installs `fake_clock` and
includes cases at 23:59 UTC and on the first of a month. Note that
`fake_clock.js` is UNTRACKED today (another session's file); the build either
depends on it being committed first or carries its own copy.

### M9. The dry run cannot show the account data the owner must approve

Where: D8 line 413 ("makes no OpenAI call") and D13 steps 4 and 5.

Scenario: the commissioning review is the only point where a human sees what
the system will create (R1 rules out a standing queue). R4 makes brand name,
aliases, market and prompts the things that must be correct. In dry run none
of them is computed: no homepage read, no generator, no validator. The owner
approves a `would_create` list of emails and labels; the first live run then
discovers brand names, prompt failures and wrong languages on real accounts.

Smallest change: in dry run, for at most `max_creates_per_run` rows per run,
compute brand, aliases, market and the validated prompt set and store them on
the row (one `would_payload jsonb`, nulled on the 30-day purge). Cost: one
gpt-4o-mini call per row, about EUR 0.0004. Keep "no write outside
`explee_leads`, settings and `job_runs`" as the dry-run invariant.

---

## 3. SHOULD change

S1. Rate-limit detection is too broad. D8's `/rate|limit|429|too many/i`
matches "generate", "separate" and any message containing "limit", so an
unrelated invite error opens the breaker and pauses creation for an hour.
Use what `resend-invite.js:324` already uses: `error.status === 429 ||
/rate.?limit/i.test(message)`.

S2. The documented kill switch writes failures forever. D8 offers "remove
`EXPLEE_API_KEY`" as a kill switch, which produces an `ok=false` row every
hour; with the watch row at `consecutive 2` the watchdog alerts daily until
the key returns, and removing a key also costs a Netlify build. Make the kill
switch `mode = 'off'` only, read the settings row before checking the key, and
in `off` write `ok = true, skipped: 'off'` even without a key. Run the 30-day
excerpt purge in `off` mode too, or the retention promise in D2 stops holding
while the importer is off.

S3. Explee 402 (balance not positive, every request) and the reply 409 (send
in progress, `Retry-After`) are not in the failure table. Map 402 to
`stage = 'explee'`, code `insufficient_credits`, stop the run, keep the
cursor. Treat a reply 409 as "retry next run". Store `/me` as
`{ plan, balance_remain }`.

S4. Oldest-first drain buries today's replies. With 30 a day and a backlog of
a few hundred, a lead who replies today waits a week or more behind replies
from months ago, and the hot ones go cold. Drain newest reply first, or give
replies younger than 7 days priority over the backlog.

S5. The `country ~ '^[A-Z]{2}$'` CHECK can poison a row. If Explee returns a
lower-case or non-ISO value, the claim insert fails and (with M1 unfixed) the
lead is lost; with M1 fixed it fails every run. Uppercase before writing and
store null for anything that does not match.

S6. Live before follow-up means context-free invites. D13 switches to live at
step 7 and only later (step 8) turns the thread reply on. Until then a cold
lead's first message from BrandGEO is Supabase's generic invite template from
an address they have never seen, with a link that dies in an hour
(`resend-invite.js:7-10`), sent from the transactional domain that also
carries paying customers' password resets. Either make an approved follow-up
and a confirmed 86400 s link lifetime preconditions of step 7, or record that
the owner accepts this for the first batches.

S7. A thrown error makes Netlify retry the background function.
`withObservability` rethrows (`_observability.js:362-365`), and Netlify retries
a failed background invocation. Catch everything at the top of the handler,
write the `job_runs` row, and return normally. The per-lead claims make a
retry safe, but it doubles Explee and OpenAI calls for nothing.

S8. Per-call timeouts. The existing generator's OpenAI fetch has no timeout
(`_prospect_prompts.js:179-190`), and the homepage `Promise.race` does not
abort the losing fetch (`:28-34`), so a hung call can push a lead past the
12-minute guard. Require `AbortSignal.timeout` on every outbound call (homepage
6 s per scheme, OpenAI 20 s, Explee 10 s as stated), and use
`context.getRemainingTimeInMillis()` for the guard.

S9. `LeadProfile.country` is the contact's country ("who the contact is"), not
necessarily the market the company sells in. A remote employee of a US
company in Portugal yields market PT and Portuguese prompts. At least
cross-check against a ccTLD of the company domain, and show both in the dry
payload (M9) so the owner sees the disagreement rate before live.

S10. The brand-term rule can reject every prompt of a generic business name
(domain root or name equal to the category, "dental care", "catering
bucharest"). Match brand terms as whole words, and record the rejection count
per rule in the dry payload.

S11. Acceptance criterion 1's "55 or more test files" is fragile: there are
already 54 `*.test.js` files in the working tree (53 tracked plus the other
session's `resend_invite.test.js`). Name the three new files and require all
files to pass instead of a count.

S12. Put `EXPLEE_API_KEY` in place before the step 3 deploy. Mode is
`dry_run` and the cron is not scheduled, so a present key is harmless, and it
saves the extra Netlify build step 4 otherwise needs under the two-builds-a-day
rule.

S13. A second dry pull sees nothing. The first dry pull stores the cursor, so
"re-runs the dry pull until the list is what he expects" (D13 step 5) returns
zero conversations. Document the reset (`cursors = '{}'`) and state that
existing rows are re-decided, not duplicated, when the feed replays them.

S14. Define "replier email". Rule 9 and D2 use it without a definition. The
feed's `email` is revealed only when the lead replied from that address; a
colleague replying on the thread leaves it null. Define it as the feed item's
`email`, never the enriched `LeadProfile.email`, and treat a reply from a
different address on the company domain as a referral candidate under D4.

S15. Referral invites go to addresses nobody has verified, and BrandGEO sees
no bounce from Supabase SMTP. Cap referral creations (for example 1 a run) and
list them separately in the daily summary.

---

## 4. Cost, rate and scale checks

- Free plan numbers in the spec match `_cost.js` and `planConfig.ts`: 5
  prompts, engine `gemini`, EUR 0.30 a month, monthly cadence, 720 h manual
  cooldown. 5 checks at the EUR 0.032 list figure is EUR 0.16, inside 0.30;
  even all five as `api_error` rows at the EUR 0.033 flat metering is 0.165.
- `trigger: 'scheduled'` with `force: true` and `replaceExisting: false` takes
  the non-destructive branch (`_enqueue.js:100-102`, `:183`) and does not start
  the manual cooldown (`:308`). Correct.
- The enqueue writes `region_label = null` for a scheduled run
  (`_enqueue.js:154`), so `default_region_id = 'ALL'` has no effect on the
  first collection. Harmless.
- OpenAI: one or two gpt-4o-mini calls per account at 600 max tokens, well
  under EUR 0.001 each. M9 adds one per dry-run row.
- Explee: about 240 calls a day as estimated, plus under 10 inbox list pages a
  run for M2. Far below 10,000 an hour; the binding limit is 4 concurrent heavy
  reads, so the client must never parallelise feed or inbox reads.
- Supabase auth email: 5 an hour and 30 a day from this path. The real hourly
  SMTP limit is still unread (Q4); the cap is reasonable until it is.
- Netlify: 24 background invocations a day plus at most 24 worker kicks.
  One new environment variable of about 60 bytes. No `netlify.toml` change,
  which matches the brief.
- Gemini free tier: at most 150 grounded checks a day from the importer
  against 1,500, as the spec says.

---

## 5. Regression surface (found by grep)

- `tests/refresh_cadence.test.js:189-200` and `:220-222` read
  `onboard-client.js` source (M5.3).
- `src/pages/Onboard.tsx:177` calls `runCollection` after `onboard-client`
  answers; it depends on the response keys staying identical
  (`client_id`, `plan`, `engines_enabled`). Onboard.tsx has uncommitted edits
  from another session; the refactor must not need to touch it.
- Comments naming `onboard-client.js` as the only `role='admin'` writer:
  `provision-account.js:21`, `signup-client.js:23`. They stay true only if the
  helper honours `role` for `source === 'onboard-client'` alone, as 5.4 says.
- `resend-invite.js` lists every viewer with a pending invite; 30 imported
  accounts a day will dominate that admin list. Not a defect, worth telling the
  owner.
- `delete-client.js` is the undo path; with `ON DELETE SET NULL` on
  `explee_leads.client_id` it needs no change.

---

## 6. What was not checked

- Nothing was run: no tests, tsc, build, migration or Explee call.
- GoTrue's real answer to `inviteUserByEmail` for an existing unconfirmed user
  (M3 is written to be safe either way).
- Whether GoTrue creates a user when the invite email fails on the SMTP rate
  limit (the rollback assumes it may).
- The Supabase custom SMTP hourly limit, and the current Email OTP expiry.
- The current total size of Netlify environment variables against 4 KB.
- Whether Explee's real intent labels, `lead_status` values and country values
  match the published examples.
- Netlify's background-function retry count on this account's plan (S7 relies
  on the documented platform behaviour).
- Whether the homepage fetch of a lead-supplied domain can reach internal
  addresses (`isPlausibleDomain` accepts a dotted IPv4 string, and the fetch
  follows redirects). Outside this lens; flagged for the security review.
- RLS, policy grants and the decline regex were read but not attacked; that is
  the security lens.
