# Explee lead import: replied leads become set-up Free accounts

Status: SPEC, revision 4, binding on bg-backend. Author: bg-architect,
2026-11-11. Touches auth (invite), RLS (two new tables) and a live
provisioning path (`onboard-client.js`), so `bg-verify` reviews this spec
BEFORE the build starts and the diff after it (AGENT-OS guardrail: auth and
RLS go through verify before build, not only after). A Supabase schema change
is required: HUMAN CHECKPOINT, the migration is applied only on the owner's
go (D13 step 2). The migration file is NOT applied yet, so revisions 3 and 4
change it freely. The import still ships in `mode='dry_run'` with the cron
commented out; nothing in revision 4 changes that.

---

## 0a. Revision 4, 2026-11-11

The fix round to revision 3 was re-reviewed twice, both PASS WITH FINDINGS
with every first-round finding closed:
`docs/qa/explee-lead-import-fix-rereview-auth-2026-11-11.md` ("V" and auth
"I-") and `docs/qa/explee-lead-import-fix-rereview-ops-2026-11-11.md` ("N").
Each item below has one rule in the body and one criterion (50 to 60,
section 7). The body wins over this table.

| Id | Must close before | Closed in (one line) | Criterion |
|---|---|---|---|
| V1 run snapshot lets the importer delete or bind a login made during the run | `mode='live'` | D8 Rule U steps 1 and 2 rewritten: Check A (early) plus Check B (a fresh paged pass immediately before `inviteUserByEmail`, both paths); "ours" needs the id absent from Check B AND `created_at` not older than `T_inv - 5 s`; a profile 23505 proves "not ours"; a not-ours result after an invite stops creation; 5.4 | 50 |
| V2 `half_made` after an invite escapes the daily cap and suppression | `mode='live'` | new column `invite_sent_at`; D8 C2 counts `creating` rows plus every row with `invite_sent_at` in the window; D5 duplicate 2 suppresses `invite_sent_at` rows and `half_made` | 51 |
| V3 re-check and D5 duplicate 4 disagree, endless release | `mode='live'` | one shared predicate `companyConflict` (both rows' `brand_domain` and `email_domain`, excluded domains dropped) used by D5 duplicate 4 and the F3 re-check | 52 |
| V4 follow-up sent after a non-include label | `follow_up_enabled=true` | D9 "Not sent if": send only when every reply label in the thread and both latest labels are in `include_intents`; new terminal `skipped_label`; `DECLINE_RE` gains `opt(ed)?_?out` (D3 rule 2) | 53 |
| I-1 own-domain guard one direction, empty setting drops defaults | `mode='live'` | D3 "Own-domain guard": defaults are code constants the setting only adds to; match in both directions with a parent of at least two labels | 54 |
| N1 (= I-4) 13 minute guard not re-checked before provisioning, the second generation, the summary | `mode='live'` | D8 "Time guard": checks before the homepage read, before each generation attempt, after the settings re-read, before the summary send | 55 |
| N2 fullwidth Latin brand passes the brand-term rule | `mode='live'` | D6 boundary rule: NFKC on prompt and term inside `brandTermMatches` only | 56 |
| N3 alternating reasons never reach 3 consecutive | `mode='live'` | D8 "Attempts": new column `attempts_total`, final at 10 failures of any reason | 57 |
| N4 active lead missed twice is finalised hidden | `mode='live'` | D1 step 8: a thread message newer than `absent_since` clears it and keeps the row | 58 |
| N8 fixture addresses on our own domains | none | criterion 22 exception recorded (own domains, invented local parts); criterion 59 | 59 |
| Builder deviation: orphan by `pending_slug` needs equal `brand_website`; criterion 29 sequential answer | none | D8 Rule U step 4; criterion 29 amended in words | 60 |
| N5, N7 / I-2, I-3 | not in this round | open questions Q11, Q12, Q13 (section 8) | none |

Two reviewer fixes are replaced by a different rule (section 10): V1's
"`created_at >= callStart - 60 s`" (too wide once Check B sits before the
invite) and V4's "labels after `created_at_account` only" (the orchestrator's
required outcome reads the whole thread; the narrower scope is Q14).

---

## 0. Revision 3, 2026-11-11

The build to revision 2 was reviewed twice, both PASS WITH FINDINGS:
`docs/qa/explee-lead-import-build-review-auth-2026-11-11.md` (auth lens, "F"
and auth "I") and `docs/qa/explee-lead-import-build-review-ops-2026-11-11.md`
(ops lens, "M", "L" and ops "I"). Four requirements were added by the
orchestrator from production facts of 2026-11-11 ("A1" to "A4"). Every item
below is closed by a rule in the body; the appendix-free rule is that the
body wins. New criteria are 27 to 49 (section 7).

| Finding | Closed in (one line) |
|---|---|
| F1 cap counts only successes, post-invite failure re-invites | D8 "Caps" rules C1 to C4 (count before the call, keep `reserved_at` past the invite, final `provision_error`, first failure stops creation); criterion 27 |
| F2 follow-up to a lead who declined after creation | D9 "Not sent if" (decline label, unsubscribe block, Lost or Unqualified, hidden); `followUpDecision` 5.3 `skipped_declined`; criterion 28 |
| F3 overlapping runs, related domains | D8 "Identity reservation" step 3 (post-reservation re-check, the row that sees a conflict releases); reviewer's deterministic-winner fix rejected there; criterion 29 |
| F4 kill switch read too early | D8 "Re-checks during a run": settings re-read immediately before `provisionViewerClient`; criterion 30 |
| F5 dry run after live can notify | D8 "Modes" dry run, D8 "Reconciliation" (dry run: no notify, no email, skips `created` rows, stamps `last_dry_reconcile_date` only); Q6; criterion 31 |
| auth I1 reclaim gap orphan client | D8 Rule U step 4 (`pending_slug` written before each client insert, reclaim looks it up); 5.4 `onBeforeClient`; criterion 32 |
| auth I3 `authenticated` keeps table privileges | D2 grants, 5.1 `revoke insert, update, delete, truncate ... from authenticated`; criterion 33 |
| listUsers paging assumption | D8 Rule U step 1 "Paging", 5.4 (end on `nextPage === null` or an empty page, never on `users.length < perPage`); criterion 34 |
| M1 same as F1 | as F1 (union of both fixes); criterion 27 |
| M2 hidden inference on one offset listing, `has_more` ignored | D1 step 6 (paging on `has_more`/`next_offset`), D1 step 8 (two complete absences 50 minutes apart via `absent_since`, then a thread read); reviewer's 90 minute `listing_seen_at` fix declared incomplete there; criterion 35 |
| M3 only the decide loop is time-bounded | D8 "Time guard" (one deadline for every stage, reconcile first with its own budget, `detail.truncated`, `last_reconcile_date` only when finished); criterion 36 |
| M4 brand term never fires inside CJK, Thai, Korean text | D6 brand-term rule (dense-script characters do not count as a word boundary); criterion 37 |
| L1 Hangul missing from the dense length rule | D6 length rule adds `\p{Script=Hangul}`; criterion 38 |
| L2 reply 200 with `ok:false` recorded as sent | D9 "Answers" (`ok !== true` and not `deduped` is `failed`); D11 `postReply` returns `ok`; criterion 39 |
| L3 failed follow-up re-read forever | D9 terminal `gave_up` after 3 failures, no thread read for terminal statuses; criterion 40 |
| L4 enabling follow-up mails every past import | D9 `follow_up_max_age_hours` (72) and `max_follow_ups_per_run` (5), terminal `skipped_expired`; Q7; criterion 41 |
| L5 invisible project id reports `ok=true` | D1 step 4 (`ok=false, error='projects_missing'` when no listed id is visible); criterion 42 |
| L6 `retryNotes` writes to erased or undone rows | D10 (skip `erased_at` or `undone_at`, `note_status='skipped'`); criterion 43 |
| L7 same orphan as auth I1 | as auth I1; criterion 32 |
| ops I1 `attempts` never reset across stages | D8 "Attempts" (counts consecutive failures of the same reason, reset on change or success); criterion 44 |
| ops I7 erased skeleton with null `person_id` | D1 step 7 (null `person_id` never rowed, counted), step 8 (thread read before `hidden`), D2 (`hidden` and `erased` keep `email_sha256`), D5 duplicate 2; criterion 45 |
| A1 account name among the aliases | 5.4 "Aliases rule" on both paths, D5 aliases, criterion 12 amended in words by criterion 46; open design item Q10 |
| A2 follow-up quotes no measured figure | D9 "No figures" (only `{brand}` and `{first_name}`, no `%`, no other placeholder, no results read); future rule in D9; criterion 47 |
| A3 invitee never on one of our sending domains | D3 "Own-domain guard", setting `own_sender_domains`, reason `own_sender_domain`; criterion 48 |
| A4 facts reported by another session | section 3.5, D13 step 8 precondition, Q3; criterion 49 |

Owner-level choices taken as conservative defaults by the orchestrator and
open to the owner: F5 (Q6), L4 (Q7), F1 and M1 union (Q8). Open design item
from A1: Q10.

---

## 0b. Revision 2, 2026-11-11

Revision 1 was reviewed twice, both SOUND WITH CHANGES:
`docs/qa/explee-lead-import-spec-review-abuse-2026-11-11.md` (abuse, "A") and
`docs/qa/explee-lead-import-spec-review-ops-2026-11-11.md` (operations, "O").
This revision closes every must-change finding in the body of the spec, folds
in the live facts measured on the owner's Explee account (section 3.3, "L")
and the owner's rulings of 2026-11-11 (section 2, R5 to R12).

| Finding | Closed in |
|---|---|
| A-M1 rollback deletes an existing auth user; O-M3 the same | Rule U (D8), D5 duplicate 1, 5.4, criteria 11 and 12 |
| A-M2 overlapping runs create two accounts | D8 identity reservation (`decision='creating'`), 5.1 unique indexes on `creating` and `created`, criterion 9 |
| A-M3 replier email undefined; O-S14 the same | D3 "Who is the replier", rule 9 and 10, 5.3 `resolveReplier`, criterion 4 |
| A-M4 re-decision on stale status; O-M2 the same | Rule F (D3), D1 run loop step 6, criterion 8 |
| A-M5 every project the key reaches; O-M6 the same | R9, D1 step 4, 5.1 `project_ids`, criterion 7 |
| A-M6 free mail only filtered on the fallback | D5 domain rules, `EXCLUDED_DOMAINS`, D4 step 4, criterion 3 |
| A-M7 erasure never seen and refused by CHECK; O-M4 the same | D2 erasure, D8 reconciliation pass, 5.1 CHECK, criterion 16 |
| O-M1 cursor advances past unprocessed conversations | D1 (no cursor: the inbox listing is read whole each run; the work queue lives in the table), criterion 6 |
| O-M5 fake cannot run the path; existing test breaks | 5.6 fake extensions, file plan (`refresh_cadence.test.js`), criteria 10 and 21 |
| O-M7 validator rejects every CJK and Thai prompt | D6 validator length rule by script, criterion 5 |
| O-M8 timestamps from DB defaults, UTC unstated | D8 "Clock", 5.1 (no `now()` default on decided columns), criterion 19 |
| O-M9 dry run cannot show the account data | D8 dry run payload, 5.2 `WouldPayload`, criterion 13 |
| L live facts (inbox view and thread, `reply_count`, `email_changed`, unsubscribe label, null email, differing domains) | section 3.3, D1, D3, D4, D5 |
| Owner defaults (labels, caps, project list, unknown-label policy, second person, note) | section 2 R5 to R12, 5.1 settings defaults |
| Task item 5 (injected UTC clock) | D8 "Clock", criterion 19 |

Should-change items taken: A-S1, A-S2, A-S3, A-S4, A-S5, A-S6, A-S7 (suffix
match, no public suffix list), A-S8, A-S9, A-S10, A-S11, O-S1, O-S2, O-S3,
O-S5, O-S7, O-S8 (abortable fetches; the guard uses the injected clock),
O-S9 (shown, not acted on), O-S10, O-S11, O-S12, O-S15, and the two LOW
citation fixes. Declined, with reasons: section 10.

---

## 1. Summary in ten lines

1. One background function, `explee-import-background.js`, run hourly at :35
   by Supabase pg_cron with the existing `X-Cron-Key` gate.
2. Each run reads the WHOLE project inbox listing of each project the owner
   listed (no cursor), and the thread of each lead it works on. It never uses
   the campaign lead list or its `replied` flag.
3. Every conversation with a reply becomes one row in `public.explee_leads`,
   keyed on Explee `person_id`. That row is the work queue and the record of
   the decision.
4. A pure module `_explee_rules.js` decides, from reads made in the same run
   only. Intent labels decide; `reply_count` is never used to tell a human
   from an automatic reply.
5. Provisioning moves out of `onboard-client.js` into `_provision_client.js`,
   which never invites an address that already has an auth user and never
   deletes a user it did not create.
6. Brand, website, aliases and market come from Explee's lead profile plus
   the company homepage. Five prompts come from a new generator and pass a
   validator before anything is created.
7. The first collection is enqueued server side with `trigger='scheduled'`.
8. Mode `off`, `dry_run` (the default) or `live`. In dry run the row carries
   the full account payload the owner must approve: brand, website, market,
   masked invite address, prompts.
9. Caps: 5 provisioning calls an hour, 30 a day (failed calls that reached
   the invite included), 1 referral an hour; the first provisioning failure
   stops creation for the run. In live mode a note is appended to the Explee
   lead; its status is never changed.
10. Nothing is imported until the owner lists the project ids. The dry pull
    prints the project ids the key can see.

---

## 2. Rulings (owner, binding, not re-argued here)

From the first brief, 2026-11-11:

- R1. Fully automatic. No standing approval queue. The dry run in D13 is a
  one-time commissioning step.
- R2. Everyone who REPLIED gets an account, except proper declines,
  unsubscribes, bounces, erasure requests, leads the team marked Lost or
  Unqualified, anyone who already has a BrandGEO account, and anyone who never
  replied.
- R3. The plan is `free`.
- R4. The account carries correct data: market, prompts, brand aliases,
  website, brand name and the owner's email. A follow-up email is wanted.

Rulings and defaults given 2026-11-11 after the reviews:

- R5. An out-of-office or changed-address reply that points to another
  contact is INCLUDED, under the referral rule D4.
- R6. Default label sets: include `hot_lead`; referral `out_of_office` and
  `email_changed`; exclude `not_interested` and `unsubscribe`.
- R7. An unknown label waits and is named in the daily summary. This is a
  default the owner may flip later, so it is a setting
  (`unknown_label_policy`, default `hold`).
- R8. Backfill everyone who ever replied, oldest reply first, under caps of 5
  an hour and 30 a day.
- R9. Only explicitly listed Explee projects are imported. An empty list
  imports nothing.
- R10. A second person from a company that already has an account is skipped
  and listed.
- R11. A note is appended to the Explee lead. Its status is never changed.
- R12. Release in dry run by default.

---

## 3. Facts, with what is unverified

### 3.1 Repo, read 2026-11-11

| Fact | Source |
|---|---|
| Admin provisioning: client insert, then `inviteUserByEmail` to `/reset-password`, then `user_profiles`, then prompts, rolling back earlier steps on a later failure | `onboard-client.js:132-213`, redirect `:68` and `:160-163` |
| The rollback deletes the user the invite returned, without checking it was created by this call (PRE-EXISTING defect, closed by Rule U) | `onboard-client.js:175-183`, `:205-210` |
| `client_events` audit row, last and non-fatal | `onboard-client.js:228-253` |
| Role is coerced to `viewer` unless it is `admin` | `onboard-client.js:108` |
| `last_refresh_at` is stamped at creation | `onboard-client.js:124-139`, `provision-account.js:160-174` |
| Self-serve path: slug retry five times on 23505, `default_market_id: 'WW'`, `onboarding_complete: true` | `provision-account.js:19-21`, `:178-198`, `:190-191` |
| `slugify` and `titleCase` live privately in provision-account | `provision-account.js:49-59` |
| Domain helpers (format check only, accepts free-mail domains) | `_prospect_guard.js:64` `isPlausibleDomain`, `:70` `normalizeDomain` (strips `www.` only) |
| Homepage signal fetch, 6 s `Promise.race` that does not abort the loser | `_prospect_prompts.js:25-53` |
| The audit generator's OpenAI fetch has no timeout | `_prospect_prompts.js:179-190` |
| The audit generator falls back to self-referential prompts | `_prospect_prompts.js:218-228` |
| `cleanBrandName` is private (not exported); `sanitizeRecoveredBrandName` is the sanitiser at `:113`; alias builder | `_prospect_prompts.js:63`, `:113`, `:392-419`, exports `:698-701` |
| Dashboard prompt suggester writes in the business's language | `suggest-prompts.js:47`, `:56-73`, `:65` |
| Enqueue helper and its non-destructive scheduled branch | `_enqueue.js:94-103`, `:115-119`, `:57-71`, `:152-155`, `:183` |
| Worker kick, fire and forget | `_enqueue.js:277-288` |
| Manual cooldown counts only `trigger='manual'`; Free is 720 h | `_enqueue.js:299-312`, `_cost.js:567` |
| Free: engines `['gemini']`, budget EUR 0.30, cadence `monthly`, 5 prompts, DB cap trigger | `_cost.js:408`, `:533`, `:607`; `planConfig.ts:563`, `:556-559` |
| Gemini EUR 0.032 a check, free under 1,500 grounded a day | `_cost.js:249`, `:604` |
| Budget gate reads spend through the `sum_cost_eur` RPC | `_auth.js:235`, `:195` |
| `_auth.js` builds month boundaries in local time | `_auth.js:215-218` |
| Cron gate | `_cron_auth.js:49-77` |
| pg_cron to Netlify pattern with the Vault secret | `db/supabase-scheduled-jobs-migration.sql:119-134` |
| `job_runs` write | `schedule-collections.js:58-65` |
| Watchdog expectation rows | `db/supabase-observability-watchdog-2026-10-28.sql:40-47`, `:54-66` |
| Admin feed row plus optional email, never throws; alert mailbox | `_admin_notify.js:42-61`, `:22` |
| `withObservability` rethrows, so a throw makes Netlify retry a background function | `_observability.js:362-365` |
| Background functions take no `timeout` entry | `netlify.toml:247`, `:271` |
| Functions import `src/lib/markets.ts` directly | `mcp-server.js:59` |
| The app decides onboarding by whether a profile exists | `clientContext.tsx:172` |
| Auth user lookup by a paged `listUsers` pass; invite rate-limit test `error.status === 429 \|\| /rate.?limit/i`; race guard that refuses to delete a user that predates the call | `resend-invite.js:105-121`, `:319-343` |
| Test fake: unique specs, `rpc` knows only three names, `listUsers` ignores paging, `inviteUserByEmail(email)` drops options | `tests/helpers/fake_supabase_mem.js:26-47`, `:252-286`, `:302`, `:308` |
| An existing test reads `onboard-client.js` source for `refreshCadenceFor(` | `tests/refresh_cadence.test.js:190-200`, `:220-222` |

### 3.2 Explee, from the published OpenAPI document (third-party data)

- Auth header `X-API-Key`, base `https://api.explee.com`. Limits: 10,000
  requests an hour, 4 concurrent heavy reads per organisation (inbox list,
  change feed, campaign leads, status), and HTTP 402 on every request when the
  credit balance is not positive.
- Paths used (all under `/public/api/v1`):
  - `GET /autogtm/projects` (list; id, name, domain).
  - `GET /autogtm/projects/{project_id}/inbox?limit=200&offset=N` (no `tab`).
    `project_id` is an integer. Item `InboxContactItem`: `erased`,
    `person_id`, `campaign_id`, `email` (revealed only when the contacted
    person replied from it; null otherwise), `name`, `latest_intent`,
    `reply_count`, `latest_reply_at`, `needs_reply`, `lead_status` (as of the
    call). No company domain, no country.
  - `GET /autogtm/campaigns/{campaign_id}/inbox/{person_id}`: `ThreadResponse`
    with `erased`, `messages[]` (`type` is `sent` for ours, `reply` for
    theirs; `from_email`, `to_email`, `cc`, `body_text` with quoted history
    already stripped, `intent` on replies, `ts`), `can_reply`,
    `reply_blocked_reason` (`unsubscribe` | `no_reply`), `latest_intent`, and
    `lead: LeadProfile` (`erased`, `name`, `email`, `company_name`,
    `company_domain`, `country` ISO alpha-2, `note`). The thread carries NO
    `lead_status`.
  - `GET` and `POST .../inbox/{person_id}/note` (single shared note, last
    write wins).
  - `POST .../inbox/{person_id}/reply` (to the replier only; 403 when the
    lead did not reply or unsubscribed; 429 "too many replies to this contact
    in the last 24h"; 409 "another reply is being sent", `Retry-After`;
    response carries `deduped`).
  - `GET /me`: `plan` and `balance: { remain }`.
- `POST .../status` is NOT used: any status but Hot cancels a pending
  autopilot reply, and Hot, Demo and Won push to HubSpot.
- A hidden conversation (for example after an unsubscribe) stops being
  listed; a status change in the app does not resurface it.
- The key has write scope over campaigns, budgets and suppress lists.

### 3.3 Live facts, measured 2026-11-11 by a read-only probe (counts only)

- Plan free; the key works, can write, reaches every project. 1 outreach
  project, 6 campaigns, all in status outreach. 953 contacted, 7 bounced,
  1 flagged unsubscribed, 0 erased.
- The campaign lead list reports 13 leads with `replied=true`, and its
  `replied` EXCLUDES automatic replies. Latest labels on those 13: `hot_lead`
  6, `not_interested` 5, `unsubscribe` 2. One lead labelled `unsubscribe`
  does NOT carry `unsubscribed=true`: the label must exclude by itself.
- The project inbox (no tab) lists 951 conversations (unsubscribes hidden);
  17 have a classified latest reply: `hot_lead` 6, `email_changed` 5,
  `not_interested` 5, `out_of_office` 1. All 17 have `reply_count > 0`,
  including `email_changed` and `out_of_office`: `reply_count` does NOT
  separate a human reply from an automatic one on this account. For 5 of the
  17 the inbox `email` is null. No conversation was answered from more than
  one address.
- Labels seen live: exactly `hot_lead`, `not_interested`, `unsubscribe`,
  `email_changed`, `out_of_office`.
- Of the 13 human repliers, 4 write from an email domain that differs from
  Explee's `company_domain`; none from a free-mail address; all have a
  `company_domain`; all 13 countries are in `src/lib/markets.ts`.
- A full read of the account took 44 GET requests.
- The 6 hot leads very probably already have BrandGEO accounts the owner
  created by hand this morning: the duplicate checks run on the first live
  run.

### 3.4 Unverified, and how each is closed

| Unknown | Closed by |
|---|---|
| GoTrue's answer to an invite for an existing unconfirmed user | Irrelevant under Rule U: an existing auth user is never invited |
| Whether `ThreadResponse.lead` is ever null | Soft skip `profile_missing`, counted |
| Supabase custom SMTP hourly limit | Caps 5 an hour and 30 a day; rate error opens the breaker (D8). Owner reads it (Q2). |
| Invite link lifetime | Reported raised to 86400 s (section 3.5, not verified by this build); Q3; the follow-up text says how to get a new link (D9) |
| Netlify background retry count | The handler never throws (D8 "Never throw") |
| Whether the inbox `email` is null for the 5 because of an automatic reply or a colleague | Both are handled by D3 rule 9 and 10 |
| Whether Explee keeps item order stable while the inbox is paged | Not assumed: D1 step 8 needs two complete absences and a thread read before `hidden` (M2) |
| Whether an erased listing item carries `person_id` | Not assumed: a null `person_id` is never rowed and a stored row is confirmed by its thread before `hidden` (ops I7) |
| Whether GoTrue caps `listUsers` `perPage` below 1,000 | Not assumed: the pass ends on the response's end marker or an empty page (D8 Rule U step 1) |

### 3.5 Facts reported by another session, NOT verified by the import build (A4)

Each line below was reported on 2026-11-11 by a different session. The import
build did not read them and no reviewer verified them. They are recorded
because they bear on D13 step 8 and on the follow-up text.

- Supabase Auth "Email OTP Expiration" was set to 86400 seconds on
  2026-11-11. Before, it was about one hour, which is why invite links
  expired. (Reported, not verified.)
- The Explee API `GET /me` answers `plan: free`, while the Explee app shows a
  Growth trial that ends 2026-11-13. What the key may read after that date is
  unknown; a 402 or 403 there is handled by D11 as `ok=false, stage='explee'`.
  (Reported, not verified.)
- Explee campaigns have been stopped since 2026-11-11 06:38 UTC on a declined
  card. No new replies arrive while they are stopped; the importer only reads,
  so it is unaffected beyond having nothing new to read. (Reported, not
  verified.)

---

## 4. Decisions

### D1. Trigger and read model: hourly, the whole inbox listing, no cursor

**Decision.** One cron job, `explee-import`, at `35 * * * *` (10
schedule-collections, 20 reserved, 25 reaper, 50 watchdog). It POSTs to
`explee-import-background` with `X-Cron-Key` from Vault. The run loop, in
this order:

1. **Gate.** `requireCronAuth` is the first statement, before env, settings
   or any read. On refusal the handler returns and writes NO `job_runs` row
   (an unauthenticated caller must not be able to fill `job_runs`). The
   platform answers 202 to every caller of a background function, so a hand
   run is judged by its `job_runs` row, never by the HTTP answer.
2. **Purge** (D2 retention), always, whatever the mode.
3. **Settings.** Read the one row. Missing, unreadable, or a `mode` value not
   in `off|dry_run|live` means `off`. `mode='off'`: write `job_runs`
   `ok=true, skipped='off'` and return, even with no key. A body
   `{"mode":"dry_run"}` lowers `live` to `dry_run`; anything else in the body
   is ignored.
4. **Key and projects.** No `EXPLEE_API_KEY`: `ok=false, stage='config'`.
   Otherwise `GET /autogtm/projects` once and record every visible project as
   `{ id, name, domain }` in `detail.projectsVisible`. If
   `settings.project_ids` is empty: `ok=true, skipped='no_projects'`, return
   (import nothing). A listed id the key does not see is recorded in
   `detail.projectsMissing` and skipped. **L5:** when `project_ids` is not
   empty and NONE of its ids is visible, the run writes `ok=false,
   stage='explee', error='projects_missing'` and returns (the watch row turns
   two such runs into an alert). When some listed ids are visible and some
   are not, the run goes on with the visible ones, `ok` stays true, and the
   missing ids are listed in the daily summary.
5. **Pause.** `paused_until > now`: `ok=true, skipped='paused'`.
6. **Listing (M2).** For each listed project, page
   `GET /autogtm/projects/{id}/inbox?limit=200&offset=N` sequentially (never
   in parallel: 4 heavy reads per organisation). The next offset is the
   response's `next_offset` when it is an integer greater than the current
   offset, else `offset + items.length`. A page is the LAST page when the
   response carries `has_more === false`; when `has_more` is absent (not a
   boolean), the last page is the first page that returns 0 items. A short
   page with `has_more === true` or absent is NOT the end. Paging also stops,
   with the listing incomplete, at `max_inbox_pages`, on a page error after
   its retry, on a `next_offset` that does not advance, or at the time guard
   (D8 "Time guard"). Build a map `person_id -> item`. The listing is
   `complete` only when the last page was reached by the rule above and no
   page failed.
7. **Seen rows.** A listing item is a candidate when `latest_intent` is not
   null OR `reply_count > 0`. An item whose `person_id` is null or fails the
   `person_id` pattern is never rowed and never mapped; it is counted in
   `detail.listing[<id>].skeletons` (ops I7: Explee may list an erased
   conversation as a skeleton without `person_id`). Each candidate without a
   row is inserted as `state='seen'` (a 23505 is ignored: another run inserted
   it). For every stored row present in the listing, `listing_seen_at` is set
   to `now` and `absent_since` is set to null. Stored `lead_status`, `intent`
   and `replied_at` on non-final rows are refreshed for the owner's reading;
   they are never input to a create (Rule F).
8. **Hidden (M2, ops I7).** Only when a project's listing is `complete`. A
   stored row of that project that is absent from the listing and is not
   final:
   - if `absent_since` is null, set `absent_since = now` and change nothing
     else (first absence);
   - if `absent_since` is not null and `now - absent_since >= 50 minutes`
     (so at least two complete listings, in two different runs, missed it),
     read its thread once (`campaign_id` and `person_id` are stored; the read
     counts against `max_threads_per_run` and the time guard). Thread or
     profile `erased`: D2 erasure, `skipped erased`, final. Thread read
     answers and carries `reply_blocked_reason='unsubscribe'` or a decline
     label (D3 rule 2): `skipped declined`, final. **Revision 4 (N4):** the
     thread read answers (2xx), is not erased, carries no decline, and holds
     at least one message of any `type` whose `ts` parses and is strictly
     later than the row's `absent_since`: the conversation is active, so
     `absent_since` is set to null, nothing else changes, the row stays
     non-final and is not counted as hidden (counted in
     `detail.listing[<id>].absentCleared`); the next run that lists it
     works it normally. Any other answer, including a thread whose newest
     message is not later than `absent_since`, 403, 404 or a read error
     after its retry: `skipped hidden`, final. The checks run in exactly this
     order: erased, declined, newer message, hidden.
   - A `created` or `creating` row is never set `hidden`: a `created` row
     absent from a complete listing is queued first for reconciliation (D8);
     a `creating` row is handled by reclaim only.
   An incomplete listing infers nothing and leaves `absent_since` as it is.
   A row seen again in any listing has `absent_since` cleared (step 7). The
   reviewer's suggested fix ("absent now AND `listing_seen_at` older than 90
   minutes") is incomplete: `listing_seen_at` is not refreshed by a run whose
   listing was incomplete or that never reached the row's project, so an old
   `listing_seen_at` does not prove a second complete absence. The explicit
   `absent_since` stamp does.
9. **Work queue.** From the table, rows of the listed projects that are
   present in this run's listing and are one of: `state='seen'`; a non-final
   decided row whose listing `latest_reply_at` is newer than
   `decided_reply_at`; a non-final decided row whose `rules_hash` differs from
   the current one (the owner changed a label list or the policy);
   `would_create` rows when the mode is `live`; a `processing` row whose
   `claimed_at` is older than 20 minutes (reclaim, Rule U applies). Ordered by
   listing `latest_reply_at` ascending (oldest first, R8), capped at
   `max_threads_per_run` (which also counts the thread reads of step 8 and of
   reconciliation).
10. **Reconcile**, once per UTC day (D8 "Reconciliation"), placed BEFORE the
    decide loop so a long backfill cannot starve erasure handling (M3). It has
    its own stop at 5 minutes of elapsed run time.
11. **Decide and act** per row (D3 to D8). No new lead is started after 11
    minutes of elapsed run time (D8 "Time guard"), or when the caps are spent
    or creation was stopped (D8 "Caps").
12. **Retry passes** (live only): enqueue, note, follow-up (D7, D9, D10), each
    iteration under the time guard.
13. **Summary**, once per UTC day, live only (D8 "Notifications").

**Reason.** 44 GETs read the whole account; the listing is a few pages and
gives a fresh `lead_status` and presence on every run. With no cursor no
conversation can be passed over (O-M1), and the table is the queue, so the
caps only delay work, never lose it. The campaign lead list is not used: its
`replied` flag excludes automatic replies, so it would miss the
`email_changed` and `out_of_office` referrals R5 includes, and it answers 403
on plans without lead export.

**Rejected.** (a) The change feed with a cursor: the cursor moves past work
the caps defer, and a status change never resurfaces a conversation. (b) A
webhook: no history, a second secret, and the same staleness.

### D2. State: `public.explee_leads` plus `public.explee_import_settings`

**Decision.** DDL in 5.1. One row per Explee `person_id`. Storage rules:

- Always: ids, labels, lead status, timestamps, decision, reason.
- `email_sha256` (sha256 of the lowercased invitee address): written only for
  `would_create`, `creating`, `created`, and kept after erasure, undo,
  `hidden`, a final `failed provision_error`, a `failed half_made`, or on any
  row whose `invite_sent_at` is set (revision 4, V2) as a suppression record, so
  the same person is never created again under a new `person_id`. A row that
  never had an invitee has no hash to keep; that is the limit of "where the
  data allows it" (ops I7).
- Plain invitee `email`: only for `would_create`, `creating`, `created` and
  non-final `failed`. Nulled on erasure, on undo, 30 days after
  `decided_at` for `would_create` and final `failed`.
- `brand_domain`, `email_domain`, `company_name`, `country`, `market_id`,
  `region_id`: business data, stored.
- Person name, job title, LinkedIn and phone: never stored.
- `reply_excerpt`: only for rows a human must judge (`unknown_intent`,
  `auto_reply_no_referral`, `replied_by_other`, `would_create`); never for
  `declined`, `team_lost`, `hidden` or `erased`. First 280 characters of the
  latest reply body; email addresses masked except the referral address the
  rules picked; any run of 7 or more digits that may contain spaces, dots,
  hyphens, brackets and a leading plus is masked.
- `would_payload` (D8): nulled 30 days after `decided_at`, and when the row
  becomes `created`.
- **Purge** (D1 step 2, every run, every mode): `reply_excerpt` and
  `would_payload` older than 30 days, and the plain `email` cases above.
- **Erasure:** a lead whose listing item, thread or profile says `erased`
  keeps `person_id`, `project_id`, `campaign_id`, decision, reason,
  timestamps and `email_sha256`; every other personal field is nulled and
  `erased_at` is set. On a `created` row the decision stays `created` (the
  CHECK in 5.1 allows it) and an emailed admin event `explee_created_erased`
  names the client id, because the account exists and only the owner may
  delete it.

- **Hidden (ops I7):** `skipped hidden` nulls the plain `email`,
  `reply_excerpt` and `would_payload`, and KEEPS `email_sha256` when the row
  has one (Explee hides unsubscribed and erased conversations, so the hash is
  a suppression record).

RLS on both tables; the only policy is SELECT for `public.is_admin()`. No
insert, update or delete policy; the service role writes. Grants (auth I3):
`anon` has every privilege revoked; `authenticated` has `insert`, `update`,
`delete` and `truncate` revoked on both tables and keeps only `select`, which
RLS then limits to admins. Defence in depth: RLS alone already denies the
writes.

**Rejected.** Reusing `public.prospects` (hand-run CRM, seven-field
whitelist); storing the whole reply (third-party data, not needed).

### D3. Qualification: a pure function over fresh reads

**Rule F (closes A-M4 and O-M2).** A create, on first sight or on
re-decision, is decided only from reads made in the SAME run: the listing item
(presence, `lead_status`, `email`, `erased`) and the thread fetched for that
row in this run. Stored columns are never input to `qualifyLead`. If the
listing of the row's project is not complete, or the thread read fails, the
row is not decided this run (it stays as it was, `attempts` is not raised for
a listing failure, and a thread failure records `failed explee_error`
non-final). `would_create` rows go through the same full decision again
before any live create.

**Who is the replier (closes A-M3, O-S14, L null email).** `resolveReplier`:
the replier address is the listing item's `email`, used only when it is not
null AND equals, case-insensitively, the `from_email` of at least one
`reply`-type message in the thread. `LeadProfile.email` (enriched) is never a
replier. If the listing `email` is null or matches no reply message, the
replier is unknown.

**Normalisation.** Labels are lowercased with spaces and hyphens turned into
`_`. `threadIntents` is the set of normalised `intent` values on all
`reply`-type messages plus the thread's and the listing's `latest_intent`.
`latestIntent` is the thread's `latest_intent`, else the listing's.

Rules, first match wins:

| # | Condition | Decision | Kind |
|---|---|---|---|
| 1 | `erased` on the listing item, the thread or the profile | skip `erased` | final |
| 2 | `reply_blocked_reason='unsubscribe'`, or ANY label in `threadIntents` is in `exclude_intents` (default `not_interested`, `unsubscribe`), or matches `DECLINE_RE` = `/(^\|_)(not_?interested\|unsub\|remove\|do_?not\|opt(ed)?_?out\|stop\|bounce\|spam\|complain\|declin)/` (revision 4, V4: `opt(ed)?_?out` replaces `opt_?out`, so `opted_out`, `optedout`, `opt_out` and `optout` all match) | skip `declined` | final |
| 3 | listing `lead_status` in `Lost`, `Unqualified` (case-insensitive) | skip `team_lost` | final |
| 4 | the thread has no `reply`-type message | skip `no_reply` | soft |
| 5 | `thread.lead` is null | skip `profile_missing` | soft |
| 6 | `latestIntent` in `referral_intents` (default `out_of_office`, `email_changed`) | D4: an invitee found gives `create` with `invitee_source='referral'`; none gives skip `auto_reply_no_referral` | soft |
| 7 | `latestIntent` is null, or not in `include_intents` (default `hot_lead`), and `unknown_label_policy='hold'` | skip `unknown_intent` (label recorded, `(none)` for null) | soft, held |
| 8 | latest reply body empty after trimming, and `latestIntent` is not `hot_lead` | skip `empty_reply` | soft |
| 9 | replier unknown (see above) | skip `replied_by_other` | soft, held |
| 10 | otherwise | `create` with `invitee_source='replier'`, invitee = the replier | |

With `unknown_label_policy='include'`, rule 7 does not apply: an unknown label
that passed rule 2 is treated as an include label. Rule 2 always runs first,
so a decline is never included by the policy.

**Own-domain guard (A3, revised in revision 4 for I-1).** Every `create`
produced by rule 6 or rule 10 is checked before `qualifyLead` returns it. Let
`own` be the union of (a) the frozen code constant
`OWN_SENDER_DEFAULTS = ['getbrandgeo.com', 'trybrandgeo.com']` in
`_explee_rules.js`, (b) every domain in the setting `own_sender_domains`,
which can only ADD to the constant (an empty, null or missing setting leaves
`own` holding the two defaults; no setting value can remove them), and (c)
the domain of the `from_email` of every `sent`-type message in this thread
(our outbound mailboxes, whatever their domain). Every domain is passed
through `normalizeDomain`, lowercased, trimmed and stripped of a trailing
dot; empty results are dropped.

`isOwnDomain(d, own)` is true when, for some `o` in `own`, any of these holds
(revision 4, both directions):

1. `d === o`;
2. `d` is under `o`: `d` ends with `'.' + o`;
3. `d` is a parent of `o`: `o` ends with `'.' + d`, AND `d` has at least two
   labels (contains at least one dot), so a bare label such as `example` or
   `com` is never a parent match.

If the invitee address's domain, or the profile `company_domain`, is an own
domain by this rule, the decision is `skip own_sender_domain`, soft, held
(listed in the daily summary, re-decided on a new reply or a `rules_hash`
change, never created), because an account must never be created for, or
monitor, our own sender persona. Example: outbound sent from
`team@mail.persona.example` makes a replier at `persona.example` own (rule 3).
A false positive of rule 3 (a parent of two labels that is a public suffix,
for example a replier domain `co.uk` against `mail.persona.co.uk`) is held,
which is fail-safe. `rulesHash` takes the EFFECTIVE list of (a) plus (b)
(sorted, deduplicated), so `own_sender_domains = '{}'` and
`own_sender_domains = '{getbrandgeo.com,trybrandgeo.com}'` give the same hash.
A thread whose `sent` messages carry no `from_email` is guarded by (a) and (b)
only (recorded residual of the auth re-review I-1). This guard is in addition
to D4 step 5, which already drops our exact addresses from referral
candidates.

`reply_count` is not used in any rule (L: it counts automatic replies too).
The unsubscribe label excludes by itself (rule 2), whatever the lead's
`unsubscribed` flag says.

Duplicate, domain and cap checks (D5, D8) run after `create`, in the I/O
layer, and can turn it into `skip already_customer`,
`skip company_has_account` or `skip no_company_domain` (all final).

**Reason.** A missed lead costs one line in the daily summary; an
unrecognised decline mailed on the owner's domain cannot be undone.

### D4. Who is invited when the reply names someone else

**Decision.** `extractReferral(bodyText, ctx) -> string | null`, pure.

1. Only for `latestIntent` in `referral_intents` (default `out_of_office`,
   `email_changed`).
2. Input: `body_text` of the latest `reply`-type message (Explee strips quoted
   history; lines starting with `>` and everything from a line matching
   `^On .* wrote:$`, `^From:` or `^-----Original Message` onward are removed
   again, harmlessly).
3. If the body holds more than 3 distinct email addresses, return null.
4. Candidates are found by a conservative regex, lowercased, and each must be
   a literal substring of the lowercased input (asserted in code and tests).
5. Candidates are dropped when they are: the replier's address (when known);
   the `from_email` of any `reply`-type message; any address in `from_email`,
   `to_email` or `cc` of a `sent` message (our mailboxes); local parts
   `noreply`, `no-reply`, `donotreply`, `mailer-daemon`, `postmaster`; any
   address whose domain is in `EXCLUDED_DOMAINS` (D5); any address whose
   domain is not in `ctx.allowedDomains` or a subdomain of one.
   `allowedDomains` = the brand domain (D5) plus the domain of the replier's
   address when the replier is known and that domain is not excluded. With an
   unknown replier, only the brand domain.
6. Exactly one candidate must remain, or the result is null.

The referred address is the invitee and account owner
(`invitee_source='referral'`). The original replier receives nothing from
BrandGEO. At most `max_referrals_per_run` (default 1) referral creates a run;
referral creates are listed separately in the daily summary. A later human
reply re-decides the row (D1 step 9).

**Reason.** "Literally present, on the company's own domain, exactly one,
never a free-mail or platform domain" means the system cannot mail an address
it made up, a personal mailbox or a third party.

### D5. Brand data, domains, duplicates, slug, market

**Excluded domains (closes A-M6).** A frozen `EXCLUDED_DOMAINS` list in
`_explee_rules.js`: free mail (gmail.com, googlemail.com, outlook.com,
hotmail.*, live.com, msn.com, yahoo.*, icloud.com, me.com, aol.com, proton.me,
protonmail.com, gmx.*, web.de, mail.ru, yandex.*, zoho.com and the like) and
shared platforms (wixsite.com, github.io, blogspot.com, wordpress.com,
linktr.ee, facebook.com, instagram.com, linkedin.com, google.com,
sites.google.com, notion.site, and the like). A domain is excluded when it
equals an entry or is a subdomain of one; a `.*` entry matches any final
label. `isExcludedDomain` applies to the profile `company_domain`, to the
email domain, and to every D4 candidate.

**Two domains, two jobs (L: 4 of 13 differ).**

- **Brand domain** (the account's `brand_website`, what the brand is
  monitored as): `normalizeDomain(profile.company_domain)` when
  `isPlausibleDomain` accepts it and it is not excluded. Otherwise the
  invitee's email domain, when plausible and not excluded. Otherwise skip
  `no_company_domain`, final. Explee's `company_domain` wins because it is the
  company the outreach was about.
- **Email domain**: the domain of the invitee's address. It does not set the
  website. Both domains decide duplicates.

**Duplicates, all final skips, checked in this order before any write:**

1. An auth user exists for the invitee address, confirmed or not
   (`_provision_client.js` pre-check, Rule U) gives `already_customer`.
2. `email_sha256` equals that of any other row that holds a hash and is in
   `creating` or `created`, or carries `erased_at` or `undone_at`, or carries
   `invite_sent_at` (revision 4, V2: an invite went to that address,
   whatever the row's decision), or is final with reason `erased`, `hidden`,
   `provision_error` or `half_made` (revision 4, V2) (suppression records,
   D2): `already_customer`. In code this is one predicate
   `suppresses(row)`; `SUPPRESSING_REASONS` becomes `erased`, `hidden`,
   `provision_error`, `half_made`.
3. The brand domain or the email domain matches any `clients.brand_website`
   (normalised), where "matches" means equal, or one is a subdomain of the
   other, in both directions: `already_customer`. Research clients included.
   One read per run of `clients(id, brand_website)`.
4. **Revision 4 (V3).** `companyConflict(mine, theirs)` is true for another
   row in `creating` or `created`: `company_has_account` (R10), listed in the
   daily summary. `companyConflict` is ONE pure function in
   `_explee_rules.js`: `mine` = this lead's brand domain and email domain,
   `theirs` = the other row's stored `brand_domain` and `email_domain`; on
   each side null values and every domain for which `isExcludedDomain` is
   true are dropped; the result is true when any domain of `mine` and any
   domain of `theirs` satisfy `domainsMatch` (equal, or one under the other).
   The F3 post-reservation re-check (D8) calls the same function, so a lead
   the re-check releases is always decided `company_has_account` (or an
   earlier duplicate) by the next sequential run and never loops. Revision 3
   compared only the other row's `brand_domain` here; the auth re-review's
   fix (add the other row's `email_domain`, excluded domains dropped) is
   taken as stated, plus the drop on `mine` as well, so a free-mail invitee
   domain never matches another free-mail row.

Unique indexes on `creating`/`created` enforce 2 and 4 in the database too
(5.1).

**Brand name**, in order: `profile.company_name` trimmed with a trailing legal
form removed (`Ltd`, `Limited`, `LLC`, `Inc`, `GmbH`, `SRL`, `S.R.L.`, `SA`,
`S.A.`, `SL`, `S.L.`, `BV`, `AB`, `Oy`, `SAS`, `SpA`, `Pty Ltd`, `PLC`) and
cut to 80 characters; the generator's `brandName`;
`sanitizeRecoveredBrandName(og:site_name)`; `titleCase` of the brand domain
root with hyphens as spaces.

**Aliases:** `buildProspectAliases(brandDomain, brandName)` plus the cleaned
company name and the generator's brand name when they differ; deduplicated
case-insensitively; shorter than 3 characters dropped; capped at 5. The
importer passes this list as `brand_aliases`; `_provision_client.js` then
applies the aliases rule of 5.4 (A1), which puts the lowercased account name
first, so the stored list holds at most 6 entries with the name first. The
3-character floor does not apply to the account name (A1 says always; see
Q10).

**`brand_website`:** the bare brand domain. `known_competitors`: `[]`.

**Slug:** `slugify(brand domain root)`, retried up to 5 times with a
4-character random suffix on 23505 (randomness injected for tests).

**Market:** `resolveMarket(country, MARKETS)`: uppercase; `UK` becomes `GB`;
a value not matching `^[A-Z]{2}$` is null. A market with that id in
`src/lib/markets.ts` sets `default_market_id` and `default_region_id` to its
first region (`ALL`); otherwise `WW` and null. Country is the contact's
country, not necessarily the company's market: when the brand domain has a
two-letter country TLD that is a different market id, the dry payload shows
`countryConflict` (shown, not acted on).

### D6. Prompts: 5, generated without a human, validated before creation

**Decision.** Additive exports in `_prospect_prompts.js` (existing exports and
`fetchHomepageSignal` untouched):

- `fetchHomepageSignalAbortable(domain)`: same parsing as
  `fetchHomepageSignal`, each scheme fetched with
  `AbortSignal.timeout(6000)`.
- `generateClientPrompts(domain, { count, countryName, companyName, homepage }) -> { prompts, brandName, lowConfidence } | { error }`:
  one gpt-4o-mini call (temperature 0.4, max_tokens 600, request aborted
  after 20 s), asking for `count + 3` candidates. The system prompt says to
  write in the language buyers in `countryName` most often use with an AI
  assistant, English when null. No fallback branch: a missing key, HTTP error
  or parse failure returns `{ error }`. A failed homepage still allows the
  call from domain and company name, flagged `lowConfidence`.
- **Invariant (A-S8):** the OpenAI request body never carries reply text, a
  person's name or an email address. Inputs are domain, country name, company
  name and homepage signal only.

**`validatePrompts(candidates, { brandTerms, count })`** (pure, in
`_explee_rules.js`):

- trim and collapse whitespace; no URL, no `@`, no `{`, `}`, `[`, `]`, no
  line break;
- the DENSE scripts are Han, Hiragana, Katakana, Thai and Hangul
  (`DENSE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Hangul}]/u`;
  Hangul added in revision 3, L1);
- length rule by script (closes O-M7 and L1): when the text contains any
  DENSE character, 6 to 80 characters and no word count; otherwise 15 to 200
  characters and 3 to 30 words;
- no brand term (account name, aliases, brand domain root, company name),
  case-insensitive, diacritics folded (O-S10). **Boundary rule (M4):** a term
  matches at a position when the character immediately before it and the
  character immediately after it are each either absent (start or end of the
  text), not a letter or digit, OR a DENSE character. Equivalently, the
  lookarounds forbid only letters and digits that are not DENSE:
  `(?<!(?!DENSE)[\p{L}\p{N}])term(?!(?!DENSE)[\p{L}\p{N}])` with `DENSE` the
  class above. So a Latin term inside Latin text still needs a word boundary
  (a brand term inside a longer Latin word does not reject), while a Latin or
  DENSE term written against kana, Han, Thai or Hangul characters rejects. The
  reviewer's suggested fix (a plain substring match whenever the prompt holds
  a DENSE character) is wider than needed: it would reject a Japanese prompt
  in which a Latin brand term sits inside a longer Latin word. The rule above
  closes the reported case and keeps the whole-word rule for Latin.
  **Revision 4 (N2):** inside `brandTermMatches` only, the prompt and the
  term are each normalised with `String.prototype.normalize('NFKC')` BEFORE
  the existing fold (NFD, marks removed, lowercase, whitespace collapsed) and
  before the boundary test, so fullwidth Latin letters and digits
  (`ＡＣＭＥ`), halfwidth katakana and other compatibility forms compare as
  their ordinary forms. `fold()` itself and every other caller of it (length,
  duplicate, template rules) are unchanged;
- no duplicate after folding; not an audit fallback template (`best companies
  like`, `top alternatives to`, `recommended providers similar to`);
- keep the first `count` survivors; fewer means `ok:false`. `rejected` lists
  each rejection with its rule.

On failure: one retry in the same run, then `failed prompts_invalid` (or
`prompt_gen_error`) with nothing created; up to 3 consecutive attempts of the
same reason across runs (D8 "Attempts"), then final, listed in the summary.
Generation runs after the identity reservation, so a generation failure
releases the reservation (`reserved_at` cleared) and never counts in the
daily window. Count is `PLAN_PROMPTS.free` = 5, mirrored in
`_explee_rules.js` and pinned by a test that reads `planConfig.ts`.

### D7. First collection

After provisioning succeeds, in the same run: `checkCollectionLimits(supabase,
clientId)`, then `enqueueClientCollection(supabase, { clientId, force: true,
replaceExisting: false, trigger: 'scheduled', createdBy: null })`.
`triggerWorker()` once per run when at least one run was enqueued.
`trigger:'scheduled'` keeps the 720 h manual cooldown off the lead's own Run
button. Outcome in `collection_status` (`enqueued`, `blocked_budget`,
`enqueue_failed`); a failure is retried on later live runs, at most 3 times,
only while no `collection_runs` row exists for the client. Cost: 5 x EUR 0.032
= EUR 0.16 against EUR 0.30; real cash EUR 0 under Gemini's free tier.

### D8. Safety rails

**Modes.**

- `off`: purge only, then one `job_runs` row `ok=true, skipped='off'`.
- `dry_run` (column default, shipped value): reads Explee, decides, writes
  `explee_leads` only. For at most `max_dry_payloads_per_run` rows a run that
  decide `would_create` and have no current payload (none, or computed under a
  different `rules_hash` or an older reply), it computes the full account
  payload (closes O-M9; R12 and task item 4): homepage read, generator,
  validator, brand, aliases, website, market, and stores it in
  `would_payload` (5.2 `WouldPayload`), with the invite address masked as the
  first character of the local part, `***@`, and the full domain. No write
  outside `explee_leads`, `explee_import_settings` and `job_runs`; no client,
  user, prompt, invite, enqueue, note or reply; no Explee POST. OpenAI calls
  at most `max_dry_payloads_per_run` (plus one retry each). **F5 (owner
  default, Q6): a dry run sends no notification and no email, ever.** It
  calls no `recordAdminEvent` of any type (no `admin_notifications` row), no
  `notify`, no daily summary. This holds whether the dry mode comes from the
  settings row or from a body `{"mode":"dry_run"}` lowering `live`, and
  whether or not `created` rows exist from an earlier live period. Its
  reconcile pass follows the dry rules in "Reconciliation" below.
- `live`: everything.

**Re-checks during a run (A-S2, F4).** The run re-reads `mode` and
`paused_until` from the settings row IMMEDIATELY BEFORE each call to
`provisionViewerClient`, after prompt generation and after the
post-reservation re-check, with no other awaited call between that read and
the provisioning call. `off`, `dry_run` (from the row or from the body), a
future `paused_until`, or an unreadable settings row releases the reservation
(the row goes back to its previous decision, `reserved_at` and the identity
columns of the reservation cleared, not final, `attempts` unchanged) and stops
creation for the rest of the run. Retry passes (enqueue, note, follow-up) run
in `live` only, and each re-reads the mode once before it starts.

**Kill switch.** `update public.explee_import_settings set mode = 'off';`
Effective before the next provisioning call of a running run, including a
lead whose prompts are being generated when the switch is set (F4). Removing
the key is not a kill switch (it produces hourly failures).

**Caps.** `max_creates_per_run = 5`, `max_creates_per_day = 30`,
`max_referrals_per_run = 1`, `max_threads_per_run = 100`,
`max_dry_payloads_per_run = 5`, `max_follow_ups_per_run = 5` (D9). The cap
rules below are the union of the two reviewers' fixes for F1 and M1 (owner
default, Q8):

- **C1, count before the call.** `createsThisRun` (and `referralsThisRun` for
  a referral invitee) is incremented immediately BEFORE each call to
  `provisionViewerClient`, whatever the call returns. The per-run and
  referral caps are compared against these counters before the reservation,
  so every provisioning call, successful or not, uses one place of the
  per-run cap. A release by the re-checks above happens before the call and
  does not count.
- **C2, the daily window counts every call that reached the invite
  (rewritten in revision 4, V2).** The daily count is the number of rows
  where (`decision = 'creating'` AND `reserved_at` is in the 24 h before
  `now`) OR (`invite_sent_at` is in the 24 h before `now`), whatever the
  row's decision or reason. `invite_sent_at` (new column, 5.1) is written
  from the injected clock, never cleared by the code, by: (i) the
  `onStep('invite')` progress write, in the same UPDATE as `user_id`; and
  (ii) the importer's final write of any provisioning result that carries
  `userId` or `inviteSent: true` (success, post-invite `provision_error`,
  `rollback_failed` after the invite, and the "not ours after the invite"
  `email_registered` of Rule U step 2), when the column is still null. So a
  `half_made`, a `failed provision_error` and a `skipped already_customer`
  that each followed a sent invite stay in the window, and a `created` row
  counts through (i). A failed call that sent no invite (stage `precheck`
  or `client`, `invite` without `userId`, `email_rate_limited`) writes no
  `invite_sent_at` and clears `reserved_at`. A post-invite failure still
  KEEPS `reserved_at`, `email_sha256`, `brand_domain` and `email_domain`.
- **C3, a post-invite failure is final.** A failure at stage `profile` or
  `prompts`, or at stage `invite` with a `userId` returned, is recorded as
  `failed provision_error` with `final = true`, whatever `attempts` says. It
  is never retried by the importer; it is listed in the daily summary; a human
  resets it (`update public.explee_leads set state='seen', decision=null,
  reason=null, final=false, attempts=0, attempts_total=0, reserved_at=null
  where person_id = '<id>';`). Revision 4: the reset does NOT clear
  `invite_sent_at`, so the daily window keeps counting the invite that
  really went out until 24 h have passed. A failure at stage
  `precheck` or `client` other than `email_registered` and
  `auth_lookup_incomplete` stays `failed provision_error` non-final under the
  attempts rule below.
- **C4, the first `provision_error` stops creation.** The first
  `provision_error` of a run (any stage) sets `stopCreating` for the rest of
  the run, as the breaker does for a rate limit. Deciding, payloads and retry
  passes go on. **Revision 4 (V1):** a provisioning result `email_registered`
  that carries `inviteSent: true` (Rule U step 2 judged the user the invite
  returned "not ours") also stops creation for the rest of the run, with
  `stopCreating = 'not_ours'`. It is recorded as `skipped already_customer`,
  final, keeping `email_sha256`, `brand_domain`, `email_domain` and
  `reserved_at`, with `invite_sent_at` set (C2), `client_id`, `user_id`,
  `pending_slug`, plain `email` and `reply_excerpt` null (the user written by
  an earlier `onStep('invite')` is not ours and is not recorded). This bounds the damage of a
  clock-skew misjudgement (Rule U step 2) to one invite a run.
  `email_registered` without `inviteSent` (Check A or Check B found the
  address, no invite) does not stop creation, as in revision 3.

So with a profile insert failing for every lead, run 1 sends exactly one
invite and run 2 re-invites nobody (criterion 27). The ops reviewer's fix
alone (count attempts, stop on the first failure) would still re-invite the
same lead on the next run, and the auth reviewer's fix alone would still let
up to 5 failing calls through in one run; the union closes both.

**Attempts (ops I1).** `attempts` counts CONSECUTIVE failures of the SAME
reason. A failure whose reason equals the stored `reason` of a `failed` row
raises `attempts` by 1; a failure with a different reason, or on a row that
is not `failed`, sets `attempts = 1`; any decision that is not `failed` sets
`attempts = 0`. A non-final `failed` row becomes final when `attempts`
reaches 3. A listing failure never touches `attempts` (Rule F). The claim
guard keeps reading `attempts` as before.

**Total attempts ceiling (revision 4, N3).** A second counter,
`attempts_total` (new column, 5.1, `check (attempts_total between 0 and
10)`), is raised by 1 on EVERY write of `decision = 'failed'` with any reason
except `email_rate_limited` (the breaker is not the lead's fault), in any
mode. The code never lowers it; only the human reset of C3 sets it to 0. A
`failed` row becomes final when `attempts_total` reaches
`MAX_TOTAL_ATTEMPTS = 10` (code constant), whatever `attempts` says, with
the reason of that last failure, and is listed in the daily summary with the
other final failed rows. So two alternating reasons stop after 10 failures;
the 3-consecutive rule above is unchanged and still finalises a repeated
reason sooner. Rows released before any side effect (re-checks, guard,
caps) are not failures and raise neither counter. Equivalent single rule for
the builder: `final = forced || attempts >= 3 || attempts_total >= 10`.

**Time guard (M3).** One injected-clock deadline governs every stage, not
only the decide loop. With `elapsed = now - runStart`:

- No new inbox page, thread read (step 8), reconcile read, retry-pass
  iteration or other outbound call is STARTED when `elapsed >= 13 minutes`.
  Each Explee call is bounded at about 22 s (10 s abort, one retry after 2 s,
  D11), so the last call ends by about 13 min 25 s and the `job_runs` row is
  written well before Netlify's 15 minute limit.
- The reconcile pass (D1 step 10) starts no new read when `elapsed >= 5
  minutes`.
- No new lead is claimed when `elapsed >= 11 minutes` (a lead may take about
  90 s: thread, homepage, two OpenAI calls, provisioning).
- A stage cut short by the guard is named in `detail.truncated` (an array of
  stage names: `listing:<projectId>`, `hidden`, `reconcile`, `decide`,
  `collections`, `notes`, `follow_ups`, and from revision 4 `summary`). A listing cut short is incomplete
  (no hidden inference, no decision for its rows, D1 steps 6 and 8).
- `last_reconcile_date` is stamped only when the reconcile pass processed its
  whole selected list in this run. A truncated reconcile has stamped
  `reconciled_at` on every row it did read, so the next run continues with
  the oldest remaining rows and always makes progress.
- **Revision 4 (N1, auth I-4).** Inside one lead's work, `canCall(run)`
  (elapsed < 13 minutes, synchronous, no await) is evaluated immediately
  before EACH of: (a) the homepage read; (b) each generator attempt (the
  first and the retry; `generateValidated` receives a `canCall` closure and
  does not start the retry when it is false); (c) the provisioning call, at
  the point right AFTER the F4 settings re-read has returned and been judged
  and BEFORE the C1 counters are raised, so no awaited call sits between the
  check and `provisionViewerClient`. When it is false at (a), (b) or (c) in
  `live`: the row is released exactly as the F4 re-check releases it
  (previous decision, `reserved_at` and the reservation's identity columns
  cleared, not final, neither attempt counter raised, no `failed` write),
  `decide` is added to `detail.truncated`, and creation stops for the run
  (`stopCreating = 'guard'`). The same checks (a) and (b) apply to the dry
  payload; when false there the row keeps its decision with no new payload
  this run. (d) The daily summary (D1 step 13): `maybeSummary` sends nothing
  when `canCall(run)` is false; it does not stamp `last_summary_date`, adds
  `summary` to `detail.truncated` and sets `detail.summary =
  'deferred_guard'`, so the next live run at hour 7 or later sends it.

The 12 minute guard of revision 2 is replaced by these three thresholds.

**Circuit breaker.** An invite error with `status === 429` or matching
`/rate.?limit/i` (as `resend-invite.js:324`) rolls back that account, records
`failed email_rate_limited` (non-final), stops all creation for the run, and
sets `paused_until = now + 1 hour`.

**Identity reservation (closes A-M2).** Before any side effect, the run moves
the claimed row to `decision='creating'` with `email_sha256`, `brand_domain`,
`email_domain` and `reserved_at` filled, in one conditional UPDATE on
`person_id`, `state='processing'` and its `claim_token`. A 23505 on that
UPDATE means another run owns the identity: release the claim, leave the row
as it was, try next run. Then, in this order:

1. Count the daily window (C2) including this row; over the cap, revert the
   row to its previous decision and stop creating for the run.
2. **Post-reservation re-check (F3).** Re-run duplicate checks 2 and 4 of D5
   (same `email_sha256`; `companyConflict(mine, theirs)`, the SAME function
   D5 duplicate 4 calls, revision 4 V3) against every OTHER row in
   `creating` or `created`, read AFTER this row's reservation UPDATE
   returned. On any match, this row
   releases: it goes back to its previous decision, not final, `attempts`
   unchanged, no side effect, and the next run decides it sequentially
   (where D5 gives `already_customer` or `company_has_account`). The row that
   sees the conflict always releases, whatever the other row's `reserved_at`.
   Proof that at most one of two conflicting rows proceeds: each row's
   re-check is read after its own reservation committed; if row A's re-check
   saw nothing, A's reservation committed before B's, so B's re-check (after
   B's commit) sees A and B releases. Both may release, which only delays the
   pair by one run. The auth reviewer's suggested tie-break (the smaller
   `(reserved_at, person_id)` wins) is wrong under two runs whose injected
   clocks differ: A can commit first with the later `reserved_at`, see
   nothing, and proceed, while B sees A, judges itself smaller, and proceeds
   too. It is not used.
3. Prompt generation (D6), then the settings re-read (F4), then
   `provisionViewerClient`.

**Claims.** First sight is the `seen` insert. Working a row is a conditional
UPDATE to `state='processing'` with a new `claim_token` and `claimed_at`,
guarded by the row's old `state`, `attempts` and `claimed_at`; it proceeds
only when one row came back. A `processing` row with `claimed_at` older than
20 minutes is reclaimable the same way.

**Rule U (closes A-M1 and O-M3): provisioning never touches what it did not
create, and a half-made account is never provisioned again.**

1. **Check A (early, revision 3 behaviour kept).** Before step 1,
   `_provision_client.js` checks the invitee against every existing auth user
   (the importer passes its once-per-run snapshot in `ctx.authEmails`; the
   admin path loads them per call with a paged `listUsers`, as
   `resend-invite.js:105-121`). Any auth user with that address, confirmed,
   pending or without a profile, returns `email_registered` and nothing is
   created. A listing that hit its page cap returns `auth_lookup_incomplete`
   and nothing is created. Check A is an early filter only: since revision 4
   it never decides whether a user is "ours".

   **Check B (revision 4, V1, both paths).** After the client insert and its
   `onStep('client')` progress write, and IMMEDIATELY before
   `inviteUserByEmail`, the helper reads `T_check = ctx.now()` and runs a
   fresh, complete paged pass with the same exported `loadAuthEmails`
   (never `ctx.authEmails`, never a cached set). No other awaited call sits
   between the end of Check B and the invite call. Outcomes:
   - the pass is incomplete (error, throw, page cap): the client is rolled
     back (deleted); the result is `{ ok:false, stage:'precheck',
     code:'auth_lookup_incomplete' }`; no invite is sent; the importer
     handles it exactly as a Check A `auth_lookup_incomplete`;
   - the invitee address is in the pass: the client is rolled back; the
     result is `{ ok:false, stage:'precheck', code:'email_registered' }`
     with no `userId` and no `inviteSent`; no invite is sent, no user is
     touched; the importer records `skipped already_customer` final (no
     `invite_sent_at`), as for Check A;
   - a rollback of the client that fails gives `rollback_failed` with
     `clientId` (as today).
   The set of user ids returned by Check B is `idsB`. Cost: one extra paged
   pass per provisioning call, at most `max_creates_per_run` (5) a run on the
   importer and one per wizard submit.
   **Paging (listUsers assumption).** The pass calls
   `auth.admin.listUsers({ page, perPage: 1000 })` for `page = 1, 2, ...` and
   ends, complete, only on the response's own end marker or an empty page:
   when `data.nextPage` is present in the response (a number or null), the
   pass ends after the page whose `data.nextPage` is null; when it is absent,
   the pass ends at the first page that returns 0 users. It NEVER ends on
   `users.length < perPage` (GoTrue may cap `perPage` below the request, and a
   short page would then hide every later user from the pre-check). An error,
   a throw, or reaching 20 pages without the end marker gives
   `complete: false` and `auth_lookup_incomplete`. The same assumption sits
   in `resend-invite.js:105-121`, another session's file; it is recorded as a
   follow-up for that file's owner, not changed here.
2. **"Created by this call" (revision 4, V1, replaces the 10 minute
   window).** The helper reads `T_inv = ctx.now()` immediately before
   calling `inviteUserByEmail`. The user the invite returns is OURS only
   when ALL of these hold: (i) its `id` is not in `idsB`; (ii) its
   `created_at` parses as a date; (iii) `created_at >= T_inv - OURS_SKEW_MS`
   with `OURS_SKEW_MS = 5000` (code constant, absorbs the clock difference
   between the function and GoTrue). A missing or unparseable `created_at` is
   NOT ours (revision 3 treated it as fresh). Only an ours user may be bound
   (`user_profiles` insert) or deleted (compensation). A user that is not
   ours is never bound and never deleted: the helper deletes only the
   client it inserted and returns `{ ok:false, stage:'invite',
   code:'email_registered', inviteSent:true }` (an invite email went out to
   that existing address, GoTrue's re-send). The importer records it as in
   C4 (already_customer, `invite_sent_at`, creation stopped).

   **Profile proof (revision 4, V1).** When the `user_profiles` insert for an
   ours user fails with a unique violation (`code === '23505'`, or a message
   matching `/duplicate key/i`), a profile for that user already exists, so
   the user is proven not ours: the helper does NOT delete the user and does
   NOT delete that profile; it deletes the client only and returns
   `{ ok:false, stage:'profile', code:'email_registered', inviteSent:true }`.
   Any other profile or prompts failure is compensated as in revision 3
   (ours user deleted, client deleted, `db_error` with `userId` and
   `inviteSent`).

   **The three timing cases, as required.**
   - User appears BEFORE Check B (including any time after the importer's
     run snapshot, the V1 path of the re-review): Check B finds the address;
     no invite, no bind, no delete of any user; `already_customer`.
   - User appears BETWEEN the start of Check B and the invite, and is
     confirmed (for example a Google sign-in): GoTrue refuses the invite
     ("already registered"); the existing `isAlreadyRegistered` branch gives
     `email_registered` without `inviteSent`; client deleted; no user
     touched. If it is unconfirmed: GoTrue re-sends and returns that user;
     its id is not in `idsB`. If its `created_at` is older than
     `T_inv - 5 s`, it is not ours (no bind, no delete, `inviteSent`). If its
     `created_at` is within the 5 s before `T_inv` and it already has a
     profile, the profile proof applies (no bind, no delete). The one
     remaining case, an unconfirmed login created by someone else within the
     5 s before `T_inv` and after Check B read its page, that has no profile
     yet, is indistinguishable from a user this call created and is bound.
     That residual is bounded by `OURS_SKEW_MS` plus one paged pass, against
     about 13 minutes in revision 3; it binds the address owner's own login
     to an account for their own company and deletes nothing. The atomic
     alternative is Q15.
   - GoTrue returns an existing unconfirmed user (the re-send case) that
     existed at `T_check`: impossible to reach the invite, because Check B
     found its address; if the listing missed it (replication lag), its id
     or its `created_at` older than `T_inv - 5 s` makes it not ours.
   - A user this call really created, with the function clock more than 5 s
     ahead of GoTrue's: judged not ours (fail-safe): not bound, not deleted,
     `inviteSent`, creation stopped for the run (C4); the invited login has
     no profile and is found by Check A on later runs.

   The admin wizard keeps every answer for a new address: Check A and
   Check B both pass, the invite returns a user created at `T_inv` (the test
   fake stamps `created_at` from the injected clock at the invite), and the
   result is identical to revision 3 (`feed1d5` parity, criterion 12 and 46).
   For an address that registered during the wizard call it now answers the
   existing 409 email text instead of binding.
3. The importer persists progress on the lead row as each step lands:
   `client_id` after the client insert, `user_id` and `invite_sent_at`
   (revision 4, one UPDATE) after the invite. A
   reclaimed `creating` row with `client_id` or `user_id` set is never
   provisioned again: it is completed when every step is present, else it
   becomes `failed half_made`, final, with an emailed admin event
   `explee_orphan` naming the client id and user id. A reclaimed `creating`
   row with neither set is handled by step 4.
4. **Orphan client between insert and progress write (auth I1, ops L7).**
   Before EACH `clients` insert attempt (including each slug retry) the
   helper calls `ctx.onBeforeClient(slug)`, and the importer writes that slug
   to the lead row's `pending_slug` (conditional on the row's `claim_token`)
   and awaits it; if that write fails, the helper inserts nothing and returns
   `{ ok:false, stage:'client', code:'db_error' }`. A reclaimed `creating`
   row with neither `client_id` nor `user_id` but with `pending_slug` set
   reads `clients` by `slug = pending_slug` (slugs are unique). **Revision 4
   (the builder's deviation, taken into the spec):** the client found is our
   orphan ONLY when `normalizeDomain(client.brand_website)` equals the row's
   reserved `brand_domain` (our insert carries exactly that value); a client
   with that slug on any other website is treated as not found and is never
   named in an event (the slug may have belonged to another client before our
   insert attempt, which then failed 23505). Found: the row records that
   `client_id`, becomes `failed half_made`, final, and raises the emailed
   `explee_orphan` event; the importer never deletes that client and never
   provisions the lead again (no invite was sent: the invite comes after the
   `client` progress write). Not found: the row is reverted to its previous
   decision, `pending_slug` cleared, and decided again (Rule F). A client on
   the SAME website with the same slug made by someone else inside the
   reclaim window is still taken as the orphan (auth re-review I-2, ops N7):
   nothing is deleted or invited, only the event wording can mislead (Q12).

This also closes the same latent defect in the admin wizard (3.1).

**Clock (closes O-M8, task item 5).** Every timestamp the code writes or
compares (`first_seen_at`, `updated_at`, `decided_at`, `claimed_at`,
`reserved_at`, `created_at_account`, `paused_until`, `follow_up_at`,
`reconciled_at`, `last_summary_date`, `last_reconcile_date`,
`last_dry_reconcile_date`, `last_me_at`, `absent_since`, `listing_seen_at`,
`invite_sent_at`, Rule U's `T_check` and `T_inv`, the 24 h window, the 20 minute reclaim, the 30 day purge, the 50 minute
hidden confirmation, the 5, 11 and 13 minute guards, the follow-up maximum
age, the 07:00 summary hour) comes from one injected `now: () => Date`,
read in UTC. Dates are `now().toISOString().slice(0, 10)`. No decided column
relies on a database default. Tests pass a closure over a fixed date and never
read the real date; they do not import `tests/helpers/fake_clock.js` (another
session's untracked file).

**Never throw (O-S7).** The handler catches everything, writes the `job_runs`
row and returns normally, so Netlify does not retry the invocation.

**Partial failure.** Prompts are generated before any provisioning write
(after the identity reservation, which writes only the lead row). Provisioning
rolls back under Rule U. After a successful provision, enqueue, note and
follow-up each have their own status and retry counter and cannot undo the
account.

**Reconciliation (closes A-M7, A-S9; revised for F5 and M3).** Runs as D1
step 10, before the decide loop, under the 5 minute reconcile stop and the
13 minute guard. Live: in the first run of a UTC day at hour 7 or later whose
date differs from `last_reconcile_date`, re-read the thread of up to
`max_reconcile_per_day` (default 100) rows that still hold personal data
(`email`, `reply_excerpt` or `would_payload` not null) or are `created`:
first `created` rows absent from a complete listing, then oldest
`reconciled_at` first; each row read gets `reconciled_at = now`. `erased`
applies D2 erasure. On a `created` row, a new reply carrying a label in
`exclude_intents` or matching the decline pattern raises an emailed admin
event `explee_created_declined` with the client id. A `created` row whose
`client_id` is now null (the owner deleted the account) is marked
`undone_at`, its plain `email` nulled. `last_reconcile_date` is stamped only
when the whole selected list was processed (M3).

Dry run (F5, owner default Q6): the pass runs in the first dry run of a UTC
day at hour 7 or later whose date differs from `last_dry_reconcile_date`. It
may read threads and update `explee_leads` (erasure of non-created rows,
`reconciled_at`), but it SKIPS every `created` row (those are the only rows
that raise events), calls no notify and no `recordAdminEvent`, and never
stamps `last_reconcile_date`; it stamps `last_dry_reconcile_date` when its
list is done. So the next live run still reconciles that day and raises the
events for `created` rows itself. The orchestrator's default ("may read and
update its own table, no notify, no `last_reconcile_date`") is kept; the two
additions (skip `created` rows, a separate dry date) make it implementable:
without the skip, a dry run would apply erasure to a `created` row and the
live run, finding `erased_at` already set, would never send
`explee_created_erased`; without the separate date, every dry run after
07:00 would re-read up to 100 threads an hour.

**Notifications.**

- Each created account: `recordAdminEvent(..., { type: 'explee_account_created', email: false })`.
- Daily summary (live only, F5): the first LIVE run with UTC hour 7 or later
  whose UTC date differs from `last_summary_date` sends one emailed
  `explee_daily_summary`: mode; counts by decision and reason for the
  previous 24 h; unknown labels with counts; referral creates;
  `company_has_account`, `replied_by_other` and `own_sender_domain` rows;
  failed and held rows, with final `provision_error` rows listed by
  `person_id` (C3); `half_made` and undone counts; `projectsMissing`;
  `detail.truncated` stages of the last 24 h; follow-ups expired; from
  revision 4: rows finalised by `attempts_total` (N3), `already_customer`
  rows with `invite_sent_at` set and runs stopped `not_ours` (V1),
  `skipped_label` follow-ups (V4), and the count of `absentCleared` (N4). Only counts,
  labels, reason codes and `person_id`s: no address, name or excerpt leaves
  the database (A-S4).
- `explee_created_erased`, `explee_created_declined`, `explee_orphan`:
  emailed immediately.

**Undo.** The owner deletes the account on the admin Account page
(`delete-client.js`). The row stays `created`, `client_id` set null by
`ON DELETE SET NULL`, so the lead is never re-created.

### D9. Follow-up email

A reply in the Explee thread (`POST .../reply`, `body_text` only,
`reply_all:false`). OFF unless `follow_up_enabled = true` AND `follow_up_body`
is set. bg-copy writes the text; the owner pastes it.

- **When:** first live run at least `follow_up_delay_min` (60) after
  `created_at_account`, and at most `follow_up_max_age_hours` (default 72)
  after it.
- **Selection (L3, L4).** Only `created` rows with `follow_up_status` null or
  `failed`, no `erased_at`, no `undone_at`. Terminal statuses (`sent`,
  `skipped_answered`, `skipped_referral`, `skipped_blocked`,
  `skipped_declined`, `skipped_expired`, `gave_up`, and from revision 4
  `skipped_label`) are never selected and
  never cause a thread read. Ordered by `created_at_account` ascending. At
  most `max_follow_ups_per_run` (default 5) reply POSTs per run; rows beyond
  the cap wait for the next run.
- **Too old (L4, owner default Q7).** A selected row whose
  `now - created_at_account > follow_up_max_age_hours` is written
  `follow_up_status = 'skipped_expired'` BEFORE any thread read and is never
  mailed. This includes every row created before the follow-up was switched
  on, once it is older than the maximum age.
- **Gave up (L3).** A `failed` row with `follow_up_attempts >= 3` is written
  `follow_up_status = 'gave_up'` before any thread read and is never read
  again.
- **Not sent if** (decided from this run's thread and listing item):
  referral invitee (`skipped_referral`); a `sent` message dated after the
  lead's latest reply exists (`skipped_answered`); `can_reply` false or the
  thread erased (`skipped_blocked`); **F2:** `reply_blocked_reason =
  'unsubscribe'`, or ANY label in the thread's intents (every `reply`-type
  message's `intent`, the thread's and the listing's `latest_intent`) is in
  `exclude_intents` or matches the D3 rule 2 decline pattern, or the listing
  item's `lead_status` is `Lost` or `Unqualified` (`skipped_declined`); the
  row is absent from this run's complete listing, or its project's listing is
  incomplete (no send this run, status unchanged). A `skipped_declined` row
  is also raised to the owner by the reconcile event
  `explee_created_declined` (D8); the follow-up check does not wait for it.
  **Revision 4 (V4), include-only rule.** After the decline checks above and
  before the delay check, `followUpDecision` sends only when every label of
  the thread is an include label: let `L` be the normalised, non-null
  `intent` of EVERY `reply`-type message in the thread (before and after
  `created_at_account`), plus the thread's `latest_intent` and the listing
  item's `latest_intent`. The two `latest_intent` values must each be
  non-null; a null `intent` on an individual message is not a label and is
  ignored. If either `latest_intent` is null, or any member of `L` is not in
  `include_intents` (normalised), the answer is `skipped_label`, a terminal
  status (never selected again, no thread read, listed in the summary). So
  `wrong_person`, `out_of_office`, `email_changed` or an unknown label
  anywhere in the thread blocks the follow-up, and so does an account
  created under `unknown_label_policy='include'` from a label outside
  `include_intents`. `opted_out` is caught earlier as a decline by the
  widened `DECLINE_RE` (D3 rule 2) and answers `skipped_declined`. The
  auth re-review proposed reading only labels after `created_at_account`;
  the whole thread is used because the orchestrator's required outcome says
  so; whether to ignore pre-creation referral labels is Q14.
- **Answers:** 403 gives `skipped_blocked`; 409 is retried next run; 429 is
  retried after 24 h; 5xx retried at most twice, an hour apart. **L2:** a 2xx
  answer counts as sent only when the body has `ok === true` or
  `deduped === true`; any other 2xx body is `failed` and raises
  `follow_up_attempts` by 1. `deduped: true` counts as sent.
- **No figures (A2).** Release one: the follow-up text carries no score,
  count of mentions, percentage, rank, engine result or any other measured
  value. Enforced three ways: (a) the only placeholders the importer
  substitutes are `{brand}` and `{first_name}`; (b) a `follow_up_body` that
  contains any other `{...}` placeholder or a `%` character is invalid: no
  follow-up is sent in that run, statuses stay as they are, and
  `detail.followUpBodyInvalid = true` (named in the summary); (c) the
  follow-up code path reads no `ai_results`, `collection_runs` or
  `client_results_latest` data. Plan facts written by bg-copy as static text
  (for example "5 prompts") are allowed; they describe the plan, not a
  measurement. **Future rule, recorded, not built:** a measured figure may be
  quoted only for an account whose own name is among its `brand_aliases` and
  whose latest finished collection run finished after that was true.
- **Text must contain:** that a free BrandGEO account was set up for {brand}
  with a first AI visibility check; that the login link came from the BrandGEO
  sign-in address (exact sender name); that it expires and a new one is at
  `https://app.getbrandgeo.com/reset-password`; what Free holds (5 prompts,
  Gemini, monthly); reply "remove" to have it removed; no payment ask.
  Placeholders `{brand}` and `{first_name}` (from the thread at send time, not
  stored). No tokenised link.

### D10. Writing back to Explee: a note yes, a status no (R11)

Live only, after a successful provision: `GET .../note`, then `POST .../note`
with the existing text plus one line
`[BrandGEO] Free account created YYYY-MM-DD for <invitee masked>, client <id>.`
(or `for referred colleague ...`), only when the line is not already present.
The masked form is the same as in the dry payload. `note_status` `written`,
`failed` (retried twice) or `skipped`; `note_enabled` default true. No status
write, ever. **L6:** the note retry pass skips any row with `erased_at` or
`undone_at` set, writing `note_status = 'skipped'` without a GET or POST;
the first note attempt right after provisioning applies the same check.

### D11. Environment and settings

One new variable, `EXPLEE_API_KEY` (about 60 bytes), set BEFORE the build
deploy (O-S12; harmless while mode is `dry_run` and the cron is unscheduled).
Reused: `CRON_SECRET`, `INTERNAL_AUDIT_KEY`, `OPENAI_API_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_KEY`. Everything else is in the one-row settings table,
changed by one SQL UPDATE, no deploy.

`_explee_client.js` (A-S5): exposes only `listProjects`, `listInbox`,
`getThread`, `getNote`, `postNote`, `postReply`, `getMe`; no generic request
method. `project_id` and `campaign_id` must be positive int32; `person_id`
must match `^[A-Za-z0-9_-]{1,64}$`; each goes through `encodeURIComponent`.
Every call has `AbortSignal.timeout(10000)`; a 429 or 5xx is retried once
after 2 s; 402 raises `insufficient_credits` (the run stops with
`ok=false, stage='explee'`); a reply 409 is returned to the caller.
`listInbox` returns `{ items, hasMore, nextOffset }` with `hasMore` true,
false or null (absent), and the importer pages by D1 step 6 (M2). `postReply`
returns `{ status, ok, deduped }` with `ok` taken from the body (`true` only
when the body says `ok: true`) for D9 (L2). Request
headers and bodies are never logged. `fetch` and the sleep are injected.

### D12. Functions, modules, tests

| Path | Kind |
|---|---|
| `netlify/functions/explee-import-background.js` | NEW background function, `withObservability('explee-import', ...)`, gate first, never throws |
| `netlify/functions/_explee_rules.js` | NEW pure module; only `crypto` for `emailSha256` and `rulesHash` |
| `netlify/functions/_explee_client.js` | NEW narrow HTTP client (D11) |
| `netlify/functions/_provision_client.js` | NEW shared provisioning (5.4) |
| `netlify/functions/onboard-client.js` | MODIFIED: auth, body parsing, plan validation, HTTP mapping stay; steps move to the helper |
| `netlify/functions/_prospect_prompts.js` | MODIFIED, additive (D6) |
| `db/supabase-explee-lead-import-2026-11-11.sql` | NEW migration (5.1) |
| `tests/explee_rules.test.js`, `tests/explee_import.test.js`, `tests/provision_client.test.js` | NEW |
| `tests/helpers/fake_explee.js` | NEW |
| `tests/helpers/fake_supabase_mem.js` | MODIFIED, additive and opt-in (5.6) |
| `tests/refresh_cadence.test.js` | MODIFIED: list 1 names `_provision_client.js` instead of `onboard-client.js`; list 2 adds `_provision_client.js` |

`provision-account.js` is not moved (separate follow-up
"provision-helper-unification"). `netlify.toml` is not changed.

Minimum test cases are in criteria 2 to 21 (section 7).

### D13. Sequencing

1. **Spec review** by bg-verify. Gate.
2. **Migration**, on the owner's go: two tables, the settings row
   (`mode='dry_run'`, `project_ids='{}'`), the watch row `enabled=false`.
   Nothing reads them yet. Rollback:
   `drop table public.explee_leads, public.explee_import_settings;` and
   `delete from ops.watch_expectations where job='explee-import';`.
3. **Key:** the owner adds `EXPLEE_API_KEY` in Netlify (Functions scope).
   Rollback: remove it.
4. **Build and deploy** (one Netlify build, `BATCH_PUSH=1`, the owner's go),
   including the `onboard-client` refactor. The cron is unscheduled. The owner
   smoke-tests the admin wizard once (create and delete a test client). This
   is the one window where a refactor defect reaches a live path. Rollback:
   revert the commit.
5. **First dry pull** by hand (the `net.http_post` in the migration). With
   `project_ids` empty it records `skipped='no_projects'` and
   `detail.projectsVisible`. The owner reads the ids and sets
   `update public.explee_import_settings set project_ids = '{<id>}';`.
6. **Second dry pull.** The owner reviews with the SELECTs written as
   comments in the migration: decisions by `decision, reason`; labels by
   count; and `would_payload` per `would_create` row (brand, website, market,
   masked address, prompts). Nothing from these results is written into
   `docs/` or any committed file (A-S10). He adjusts the label lists or the
   policy (a changed `rules_hash` re-decides rows on the next run) and re-runs
   until the list is what he expects. Expected on this account: the 6
   `hot_lead` rows decide `already_customer` when he made their accounts by
   hand.
7. **Schedule** the cron (uncomment Part B) and enable the watch row
   (`max_silence 2 hours`, `consecutive 2`). Still dry run.
8. **Switch:** `update public.explee_import_settings set mode='live';`
   Preconditions: Q3 answered (link lifetime; section 3.5 reports 86400 s set
   on 2026-11-11, which the owner confirms in Supabase Auth settings before
   the switch) or recorded as accepted; the Explee key still reads after the
   trial end reported for 2026-11-13 (one hand dry pull after that date
   records `ok=true`); revision 3 findings closed in the build and
   re-reviewed; revision 4 items V1, V2, V3, I-1, N1, N2, N3 and N4 closed
   in the build and re-reviewed (criteria 50 to 52, 54 to 58).
9a. V4 (criterion 53) must be closed and re-reviewed before step 9.
9. **Later:** follow-up text from bg-copy (no figures, A2),
   `follow_up_enabled=true`. Rows older than `follow_up_max_age_hours` at
   that moment become `skipped_expired` (Q7).

Rollback of 7 and 8: `mode='off'` and
`select cron.alter_job(job_id => <id>, active => false);`.

The system is never inconsistent between steps: until step 8 it writes only
its own two tables and `job_runs`.

**Performance budget.** Dashboard entry chunk delta: 0 bytes (server only).
No route affected. Explee per run: 1 projects + about 5 inbox pages + at most
100 threads + note calls (measured: 44 GETs read the whole account). Supabase
per run: settings 1, `clients` 1, auth users 1 paged pass (live only) plus
one paged pass per provisioning call (Check B, revision 4: at most 5 a run;
1 page at today's user count), leads by project 1, then per lead 2 to 4
statements; per created account about 10.
OpenAI at most 5 calls a run in dry run, about 30 to 60 a day live (under
EUR 0.05). Gemini at most 150 checks a day against the shared 1,500 free
(watch).

---

## 5. Data contract

### 5.1 DDL (`db/supabase-explee-lead-import-2026-11-11.sql`)

```sql
create table if not exists public.explee_import_settings (
  id                       boolean primary key default true check (id),
  mode                     text not null default 'dry_run' check (mode in ('off','dry_run','live')),
  project_ids              integer[] not null default '{}',   -- empty = import NOTHING
  include_intents          text[] not null default array['hot_lead'],
  referral_intents         text[] not null default array['out_of_office','email_changed'],
  exclude_intents          text[] not null default array['not_interested','unsubscribe'],
  unknown_label_policy     text not null default 'hold' check (unknown_label_policy in ('hold','include')),
  max_creates_per_run      integer not null default 5   check (max_creates_per_run between 0 and 20),
  max_creates_per_day      integer not null default 30  check (max_creates_per_day between 0 and 200),
  max_referrals_per_run    integer not null default 1   check (max_referrals_per_run between 0 and 5),
  max_threads_per_run      integer not null default 100 check (max_threads_per_run between 1 and 1000),
  max_inbox_pages          integer not null default 50  check (max_inbox_pages between 1 and 500),
  max_dry_payloads_per_run integer not null default 5   check (max_dry_payloads_per_run between 0 and 20),
  max_reconcile_per_day    integer not null default 100 check (max_reconcile_per_day between 0 and 1000),
  note_enabled             boolean not null default true,
  follow_up_enabled        boolean not null default false,
  follow_up_body           text check (follow_up_body is null or length(follow_up_body) <= 4000),
  follow_up_delay_min      integer not null default 60 check (follow_up_delay_min between 0 and 2880),
  follow_up_max_age_hours  integer not null default 72 check (follow_up_max_age_hours between 1 and 720),   -- rev 3, L4
  max_follow_ups_per_run   integer not null default 5  check (max_follow_ups_per_run between 0 and 50),     -- rev 3, L4
  own_sender_domains       text[]  not null default array['getbrandgeo.com','trybrandgeo.com'],            -- rev 3, A3; rev 4, I-1: ADDS to the code constant OWN_SENDER_DEFAULTS, cannot remove it; effective list in rulesHash
  paused_until             timestamptz,
  last_summary_date        date,
  last_reconcile_date      date,
  last_dry_reconcile_date  date,                                                                           -- rev 3, F5
  last_me_at               timestamptz
);
insert into public.explee_import_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.explee_leads (
  person_id           text primary key check (person_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  project_id          integer not null,
  campaign_id         integer,
  state               text not null check (state in ('seen','processing','decided')),
  claim_token         uuid,
  claimed_at          timestamptz,
  decision            text check (decision in ('would_create','creating','created','skipped','failed')),
  reason              text,
  final               boolean not null default false,
  intent              text,
  intents_seen        text[] not null default '{}',
  lead_status         text,
  replied_at          timestamptz,               -- listing latest_reply_at, last seen
  decided_reply_at    timestamptz,               -- latest_reply_at the decision was taken on
  rules_hash          text,                      -- rulesHash(settings) the decision was taken under
  listing_seen_at     timestamptz,
  absent_since        timestamptz,               -- rev 3, M2: first absence from a complete listing; null when seen
  pending_slug        text,                      -- rev 3, auth I1 / L7: slug about to be inserted, written before each client insert
  invitee_source      text check (invitee_source in ('replier','referral')),
  email               text,
  email_sha256        text,
  brand_domain        text,
  email_domain        text,
  company_name        text,
  country             text check (country is null or country ~ '^[A-Z]{2}$'),
  market_id           text,
  region_id           text,
  would_payload       jsonb,
  reply_excerpt       text check (reply_excerpt is null or length(reply_excerpt) <= 280),
  client_id           integer references public.clients(id) on delete set null,
  user_id             uuid,
  reserved_at         timestamptz,
  invite_sent_at      timestamptz,               -- rev 4, V2: set when an invite email went out; never cleared by code; C2 window and D5 suppression
  created_at_account  timestamptz,
  attempts            integer not null default 0 check (attempts between 0 and 10),
  attempts_total      integer not null default 0 check (attempts_total between 0 and 10),   -- rev 4, N3: every failed write except email_rate_limited; final at 10
  collection_status   text check (collection_status in ('enqueued','blocked_budget','enqueue_failed')),
  collection_attempts integer not null default 0,
  note_status         text check (note_status in ('written','failed','skipped')),
  note_attempts       integer not null default 0,
  follow_up_status    text check (follow_up_status in ('sent','failed','skipped_answered','skipped_referral','skipped_blocked',
                                                       'skipped_declined','skipped_expired','gave_up',
                                                       'skipped_label')),   -- rev 3: F2, L4, L3; rev 4: V4
  follow_up_attempts  integer not null default 0,
  follow_up_at        timestamptz,
  erased_at           timestamptz,
  undone_at           timestamptz,
  reconciled_at       timestamptz,
  decided_at          timestamptz,
  first_seen_at       timestamptz not null,      -- written by the code from the injected clock, no default
  updated_at          timestamptz not null,      -- written by the code from the injected clock, no default
  check (decision is distinct from 'creating'
         or (email_sha256 is not null and brand_domain is not null and reserved_at is not null)),
  check (decision is distinct from 'created'
         or (created_at_account is not null
             and (email is not null or erased_at is not null or undone_at is not null)))
);

create unique index if not exists uq_explee_leads_identity_email
  on public.explee_leads (email_sha256) where decision in ('creating','created');
create unique index if not exists uq_explee_leads_identity_domain
  on public.explee_leads (brand_domain) where decision in ('creating','created');
create index if not exists idx_explee_leads_queue
  on public.explee_leads (project_id, final, replied_at);
create index if not exists idx_explee_leads_reserved
  on public.explee_leads (reserved_at) where decision in ('creating','created');
create index if not exists idx_explee_leads_invite_sent                       -- rev 4, V2: C2 window
  on public.explee_leads (invite_sent_at) where invite_sent_at is not null;

alter table public.explee_leads           enable row level security;
alter table public.explee_import_settings enable row level security;
create policy explee_leads_admin_read    on public.explee_leads           for select to authenticated using (public.is_admin());
create policy explee_settings_admin_read on public.explee_import_settings for select to authenticated using (public.is_admin());
revoke all on public.explee_leads, public.explee_import_settings from anon;
revoke insert, update, delete, truncate on public.explee_leads, public.explee_import_settings from authenticated;  -- rev 3, auth I3
-- no insert, update or delete policy: only the service role writes

insert into ops.watch_expectations (job, source, max_silence, consecutive, enabled, note)
values ('explee-import', 'job_runs', interval '2 hours', 2, false, 'enable when the cron job is scheduled')
on conflict (job) do nothing;

-- Review SELECTs (D13 step 6), as comments. Results are never committed.
-- PART B, commented out until D13 step 7:
-- select cron.schedule('explee-import', '35 * * * *', $job$ select net.http_post(
--   url := 'https://app.getbrandgeo.com/.netlify/functions/explee-import-background',
--   body := '{}'::jsonb,
--   headers := jsonb_build_object('Content-Type','application/json','X-Cron-Key',
--     (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
--   timeout_milliseconds := 30000); $job$);
```

Before writing `country`, the code uppercases it and stores null for anything
not matching `^[A-Z]{2}$` (O-S5).

**Migration changes in revision 3** (the file is not applied, so it is edited
in place; the file name stays `db/supabase-explee-lead-import-2026-11-11.sql`):
settings columns `follow_up_max_age_hours`, `max_follow_ups_per_run`,
`own_sender_domains`, `last_dry_reconcile_date`; lead columns `absent_since`,
`pending_slug`; three new `follow_up_status` values; the `revoke ... from
authenticated` line. `reason` stays free text; revision 3 adds the values
`own_sender_domain` (and uses `provision_error` as final under C3). The time
guard thresholds (5, 11, 13 minutes) and the 50 minute hidden confirmation
are code constants, not settings: changing them needs a review, not an
UPDATE. Rollback is unchanged (D13 step 2).

**Migration changes in revision 4** (still not applied, edited in place, same
file name): lead columns `invite_sent_at timestamptz` (V2) and
`attempts_total integer not null default 0 check (attempts_total between 0
and 10)` (N3); the partial index `idx_explee_leads_invite_sent`; the
`follow_up_status` CHECK gains `skipped_label` (V4); the comment on
`own_sender_domains` states that it adds to the code constant (I-1; the
column, its type and its default are unchanged). No settings column is
added or removed. `reason` stays free text and gains no new value (V1 uses
`already_customer`). New code constants, not settings: `OURS_SKEW_MS = 5000`
(Rule U step 2), `MAX_TOTAL_ATTEMPTS = 10` (D8 "Attempts"),
`OWN_SENDER_DEFAULTS` (D3). The `mode` default stays `'dry_run'`, the
settings row still ships with `project_ids = '{}'`, the watch row
`enabled false`, and Part B stays commented out; the text test of criterion
33 and section 29 of `explee_import.test.js` must still pass. Rollback is
unchanged (D13 step 2).

### 5.2 Function I/O

```ts
// POST /.netlify/functions/explee-import-background
// Headers: X-Cron-Key. Body: {} | { mode: 'dry_run' } (may only lower the mode).
// The platform answers 202 to every caller. A refused gate writes no job_runs row.

type ImportRunDetail = {
  invId: string
  mode: 'off' | 'dry_run' | 'live'
  skipped?: 'off' | 'no_projects' | 'paused'
  stage?: 'config' | 'settings' | 'explee' | 'auth_users'   // when ok = false
  error?: string                     // code only, e.g. 'missing_key', 'insufficient_credits', 'projects_missing'; no address; max 300 chars
  truncated?: string[]               // rev 3, M3: stages cut by the time guard; rev 4 adds 'summary'
  summary?: 'sent' | 'skipped_dry_run' | 'deferred_guard'   // rev 4, N1
  followUpBodyInvalid?: boolean      // rev 3, A2
  me?: { plan: string | null; balance_remain: number | null }   // once a day
  projectsVisible: Array<{ id: number; name: string | null; domain: string | null }>
  projectsMissing: number[]
  listing: Record<string, { pages: number; items: number; candidates: number; complete: boolean;
                            skeletons: number; absentFirst: number; hiddenConfirmed: number;
                            absentCleared: number }>   // rev 3, M2 and ops I7; rev 4, N4 absentCleared
  createsAttempted: number           // rev 3, C1: provisioning calls made this run
  stopCreating?: 'cap' | 'day_cap' | 'breaker' | 'provision_error' | 'mode' | 'paused' | 'guard'
               | 'not_ours'          // rev 4, V1 (C4)
  queued: number
  decided: Record<'would_create' | 'created' | 'skipped' | 'failed', number>
  reasons: Record<string, number>
  unknownIntents: Record<string, number>
  dryPayloads: number
  createsToday: number
  referralsThisRun: number
  breaker: boolean
  purged: { excerpts: number; payloads: number; emails: number }
  reconciled: number
  followUps: { sent: number; skipped: number; failed: number; expired: number; gaveUp: number;
               label: number }      // rev 4, V4 skipped_label
  notes: { written: number; failed: number }
  workerTriggered: boolean
  elapsedMs: number
}
// ok = false only for: missing key in a non-off mode, no listed project visible
// (error 'projects_missing', rev 3 L5), unreadable listing of every listed project,
// insufficient_credits, auth user listing failed in live mode.

type WouldPayload = {
  computedAt: string                // ISO UTC
  rulesHash: string
  inviteeMasked: string             // 'a***@example.com'
  inviteeSource: 'replier' | 'referral'
  brandName: string
  website: string                   // bare brand domain
  emailDomain: string | null
  domainsDiffer: boolean
  aliases: string[]
  marketId: string
  regionId: string | null
  country: string | null
  countryConflict: boolean
  prompts: string[]                 // the 5 validated prompts, or [] when generation failed
  promptRejections: Record<string, number>   // rule -> count
  lowConfidence: boolean
  error: 'prompts_invalid' | 'prompt_gen_error' | null
}
```

### 5.3 Pure function signatures (`_explee_rules.js`)

```ts
type Settings = { include_intents: string[]; exclude_intents: string[]; referral_intents: string[];
                  unknown_label_policy: 'hold' | 'include'; own_sender_domains: string[] }   // rev 3: A3

type ListingItem = { erased: boolean; person_id: string; campaign_id: number | null; email: string | null;
                     latest_intent: string | null; reply_count: number | null; lead_status: string | null;
                     latest_reply_at: string | null }
type Thread = { erased: boolean; can_reply: boolean; reply_blocked_reason: string | null; latest_intent: string | null;
                messages: Array<{ type: 'sent' | 'reply' | string; from_email: string | null; to_email: string | null;
                                  cc: string[]; body_text: string | null; intent: string | null; ts: string | null }>;
                lead: { erased: boolean; email: string | null; company_name: string | null;
                        company_domain: string | null; country: string | null } | null }

type Reason =
  | 'erased' | 'declined' | 'team_lost' | 'hidden' | 'no_reply' | 'profile_missing'
  | 'auto_reply_no_referral' | 'unknown_intent' | 'empty_reply' | 'replied_by_other'
  | 'already_customer' | 'company_has_account' | 'no_company_domain'
  | 'prompts_invalid' | 'prompt_gen_error' | 'email_rate_limited' | 'provision_error'
  | 'half_made' | 'explee_error' | 'auth_lookup_incomplete'
  | 'own_sender_domain'                                              // rev 3, A3

type Decision =
  | { action: 'create'; invitee: string; inviteeSource: 'replier' | 'referral'; intent: string | null }
  | { action: 'skip'; reason: Reason; final: boolean; intent: string | null; label?: string }

function normaliseIntent(label: string | null): string | null
function isCandidate(item: ListingItem): boolean                 // latest_intent != null || reply_count > 0
function replyMessages(thread: Thread): Thread['messages']        // type === 'reply'
function resolveReplier(item: ListingItem, thread: Thread): string | null
function stripQuoted(bodyText: string): string
function qualifyLead(input: { item: ListingItem; thread: Thread }, settings: Settings): Decision
function extractReferral(bodyText: string, ctx: { replierEmail: string | null; replyFromEmails: string[];
                         ourAddresses: string[]; allowedDomains: string[] }): string | null
function isExcludedDomain(domain: string): boolean
function domainsMatch(a: string, b: string): boolean              // equal, or one a subdomain of the other
function brandDomainFor(profileDomain: string | null, inviteeEmail: string): string | null
function cleanCompanyName(name: string | null): string | null
function deriveBrand(args: { brandDomain: string; companyName: string | null; llmBrandName: string | null;
                     ogSiteName: string | null }): { brandName: string; aliases: string[]; website: string }
function resolveMarket(country: string | null, markets: Array<{ id: string; regions: Array<{ id: string }> }>):
  { marketId: string; regionId: string | null; country: string | null }
function countryConflict(brandDomain: string, marketId: string): boolean
function validatePrompts(candidates: string[], opts: { brandTerms: string[]; count: number }):
  { ok: boolean; prompts: string[]; rejected: Array<{ text: string; rule: string }> }
function excerpt(bodyText: string, keep: string | null): string   // <= 280, masked per D2
function maskEmail(email: string): string
function emailSha256(email: string): string
function rulesHash(settings: Settings): string                    // sha256 of the sorted lists and the policy
function isOwnDomain(domain: string, ownDomains: string[]): boolean   // rev 4, I-1: equal, under, or a parent of at least two labels
function ownDomainsFor(settings: Settings, thread: Thread): string[]  // rev 4, I-1: OWN_SENDER_DEFAULTS + setting + sent from_email domains
function companyConflict(mine: Array<string | null>, theirs: Array<string | null>): boolean
                                                                       // rev 4, V3: excluded domains dropped on both sides, domainsMatch
function suppresses(row: { decision: string | null; reason: string | null; final: boolean; erased_at: string | null;
                           undone_at: string | null; invite_sent_at: string | null }): boolean   // rev 4, V2 (D5 duplicate 2)
function isFinalFailure(args: { attempts: number; attempts_total: number; forced: boolean }): boolean
                                                                       // rev 4, N3: forced || attempts >= 3 || attempts_total >= 10
function isDenseScript(text: string): boolean                          // rev 3: Han, Hiragana, Katakana, Thai, Hangul
function brandTermMatches(prompt: string, term: string): boolean       // rev 3, M4 boundary rule of D6; rev 4, N2: NFKC on both first
// rev 3: two pure gates evaluated BEFORE any thread read (L3, L4)
function followUpPreGate(args: { row: { created_at_account: string; follow_up_status: string | null;
                         follow_up_attempts: number }; now: Date;
                         settings: { follow_up_max_age_hours: number } }): 'proceed' | 'skipped_expired' | 'gave_up' | 'terminal'
function followUpBodyValid(body: string | null): boolean               // rev 3, A2: only {brand}, {first_name}; no '%'
function followUpDecision(args: { row: { invitee_source: string; created_at_account: string;
                          follow_up_status: string | null; follow_up_attempts: number };
                          thread: Thread; item: ListingItem | null; listingComplete: boolean; now: Date;
                          settings: { follow_up_enabled: boolean; follow_up_body: string | null; follow_up_delay_min: number;
                                      follow_up_max_age_hours: number; exclude_intents: string[];
                                      include_intents: string[] } }):            // rev 4, V4
  'send' | 'wait' | 'skipped_answered' | 'skipped_referral' | 'skipped_blocked' | 'skipped_declined'
  | 'skipped_expired' | 'gave_up' | 'skipped_label' | 'off'
// rev 4 order: off, pre-gate, referral, listing (wait), erased/blocked, declined (unsubscribe, decline
// label, Lost/Unqualified), skipped_label (include-only rule), can_reply false, delay (wait), answered, send
// item null or listingComplete false gives 'wait' (no send this run)
function noteLine(args: { date: string; inviteeMasked: string; clientId: number; referral: boolean }): string
function appendNote(existing: string | null, line: string): string | null   // null = already present
```

### 5.4 Shared provisioning (`_provision_client.js`)

```ts
type ProvisionInput = {
  name: string; slug?: string
  brand_website: string; brand_aliases: string[]; known_competitors: string[]
  plan: string
  default_market_id: string | null; default_region_id: string | null
  contact_email: string
  prompts: string[]
  onboarding_complete?: boolean
}
type ProvisionCtx = {
  actor: string | null
  source: 'onboard-client' | 'explee-import'
  meta?: Record<string, unknown>                 // explee-import: { explee_person_id }
  now: () => Date
  random?: () => number                          // slug suffix, injected in tests
  authEmails?: { set: Set<string>; ids: Set<string>; complete: boolean }  // Check A only (early filter), loaded once per run;
                                                                          // rev 4: never used for Check B or the "ours" test
  onBeforeClient?: (slug: string) => Promise<void>   // rev 3, auth I1 / L7: awaited before EACH clients insert attempt; a throw aborts with stage 'client', code 'db_error'
  onStep?: (step: 'client' | 'invite', ids: { clientId?: number; userId?: string }) => Promise<void>
}
type ProvisionResult =
  | { ok: true; client: { id: number; name: string; slug: string; plan: string; refresh_cadence: string;
                          engines_enabled: unknown }; userId: string; role: 'admin' | 'viewer';
      promptsCreated: number; auditLogged: boolean }
  | { ok: false; stage: 'precheck' | 'client' | 'invite' | 'profile' | 'prompts';
      code: 'slug_taken' | 'email_registered' | 'auth_lookup_incomplete' | 'email_rate_limited'
          | 'db_error' | 'invite_error' | 'rollback_failed';
      message: string; clientId?: number; userId?: string
      inviteSent?: true }   // rev 4: true whenever an invite email went out (post-invite db_error,
                            // rollback_failed after the invite, email_registered judged "not ours" or by profile proof);
                            // clientId set only for rollback_failed; userId set only for an ours user

// Two exports (A-S6); the role is never a field the importer can pass.
function provisionViewerClient(supabase, input: ProvisionInput, ctx: ProvisionCtx): Promise<ProvisionResult>
function provisionAdminWizardClient(supabase, input: ProvisionInput & { role: 'admin' | 'viewer' },
                                    ctx: ProvisionCtx): Promise<ProvisionResult>
```

- Rule U steps 1 and 2 live here. When `ctx.authEmails` is absent the helper
  loads it with the paged `listUsers` pass, which ends only on
  `data.nextPage === null` or an empty page (D8 Rule U step 1), never on a
  short page. The importer's once-per-run load uses the same exported pass.
  Revision 4 (V1): Check B always calls that pass itself, immediately before
  the invite, on both exports; the "ours" test is Rule U step 2
  (`OURS_SKEW_MS = 5000`, missing `created_at` is not ours) and replaces
  `FRESH_WINDOW_MS`; the profile 23505 proof never deletes the user. The
  wizard maps `email_registered` at any stage (with or without
  `inviteSent`) to its existing 409 email text.
- **Aliases rule (A1), both paths.** Brand detection
  (`_analysis.js:407-413` `buildBrandMatchers`) reads only
  `clients.brand_aliases` and the bare `brand_website`; `clients.name` is
  never checked. So the helper, for the admin wizard AND the importer, writes
  `brand_aliases` as: `n = input.name.trim().toLowerCase()`; when `n` is not
  empty, `[n, ...rest]`, where `rest` is `input.brand_aliases` in its given
  order with every entry whose `trim().toLowerCase()` equals `n` removed;
  when `n` is empty, `input.brand_aliases` unchanged. Nothing else in the
  list is changed (no other dedup, trim, case change or cap by the helper).
  This is a deliberate behaviour change of the admin wizard: the `feed1d5`
  parity test in `tests/provision_client.test.js` must pin it as the ONE
  intended difference in the client row (every other column identical), with
  three cases: name absent from the aliases (prepended), name present with
  different case or spaces (moved to first, lowercased, not duplicated), name
  already first and lowercase (list unchanged).
- `onboard-client.js` uses `provisionAdminWizardClient` and maps
  `email_registered` and `slug_taken` to its current 409 texts, the others to
  its current 409 or 500 texts. Behaviour change, deliberate: an address with
  an existing pending or profile-less auth user now gets the existing 409
  email text instead of a re-invite and a possible delete.
- `client_events` keeps `type: 'onboarded'` and adds `meta.source` and, for
  the importer, `meta.explee_person_id`.
- `refresh_cadence` and `last_refresh_at` are written exactly as
  `onboard-client.js:128-139` does, through `refreshCadenceFor`.
- An explicit `slug` keeps today's behaviour (no retry, 409); a derived slug
  retries up to 5 times.
- `rollback_failed` raises the emailed `explee_orphan` event in the importer.

### 5.5 Explee fake (`tests/helpers/fake_explee.js`)

Projects list; inbox listing with offset paging, items that can be removed
(hidden) between runs; threads with `sent` and `reply` messages; mutable
`lead_status` per person that does not touch anything else; note GET and POST;
reply with 403, 409, 429 and `deduped`; `/me`; 402 on demand; a per-call log
for asserting POST counts and paths. Fixtures use `example.com` addresses and
invented companies only.

Revision 3 additions, opt-in: the inbox response carries `has_more` and
`next_offset` (default on, matching the OpenAPI), with options to omit
`has_more`, to serve a short page that is not the last (`has_more: true`),
and to move a named item to index 0 between two page reads of one run (M2);
listing skeleton items with `person_id: null` and `erased: true` (ops I7);
a reply POST answering 200 with `{ ok: false }` (L2); a per-call delay taken
from the injected clock so a test can push elapsed time past the guards (M3).

### 5.6 Supabase fake extensions (`tests/helpers/fake_supabase_mem.js`, additive, opt-in)

Defaults must keep every existing test unchanged (other sessions' tests use
this file).

- UNIQUE specs for `explee_leads`: pk `person_id`; partial on `email_sha256`
  and on `brand_domain` where `decision in ('creating','created')`.
- `rpc('sum_cost_eur', ...)`: sums seeded `ai_results` cost for the client
  and window.
- `auth.admin.inviteUserByEmail(email, options)`: records `options.redirectTo`;
  an opt-in `db.authBehaviour` lets a test (a) return an existing user for an
  existing address (GoTrue's pending-user case), (b) return an injected error
  (`{ status: 429 }`, an "already registered" message), (c) yield between calls
  so two runs interleave inside provisioning. Without the opt-in, behaviour is
  as today.
- `auth.admin.listUsers({ page, perPage })`: honours paging. Revision 3,
  opt-in: an option caps the served page size below the requested `perPage`
  (for example 50 when 1000 is asked) and returns `data.nextPage` (a number,
  or null on the last page); another option omits `nextPage` so the empty
  page rule is exercised.
- Revision 4, opt-in (V1): a new option `stampCreatedAt: true` makes
  `createUser` (and so the default `inviteUserByEmail` path) stamp a new
  user's `created_at` from the fake's injected `now` at the moment of the
  call. Today the fake's `createUser` (`fake_supabase_mem.js:339-346`) writes
  no `created_at`, which revision 4 reads as "not ours", so every test of
  `_provision_client.js`, `onboard-client.js` and the importer that expects
  a successful create passes `stampCreatedAt: true`; other sessions' suites
  do not pass it and see no change. `db.authBehaviour`
  gains (d) a hook `onListUsersEnd` / `beforeInviteAnswer` that lets a test
  add a user (with or without a `user_profiles` row, confirmed or not, with a
  chosen `created_at`) between the run's snapshot and Check B, or between
  Check B and the invite answer; (e) an invite answer that returns an
  existing unconfirmed user (GoTrue's re-send) and refuses a confirmed one
  with "already registered"; (f) a `user_profiles` insert that fails with
  `code: '23505'` when a profile for that id exists (natural unique on `id`).
  A user created without `created_at` (option off) is the "missing
  `created_at`" case. Every new option is off by default, so criterion 21
  (every existing file that requires the fake passes unchanged) still holds.
- A kill between the `clients` insert and the progress write (auth I1) is
  tested by SEEDING the state it leaves (a `clients` row with the slug, a
  `processing` lead row with `pending_slug` set, no ids, `claimed_at` 21
  minutes old), not by a fake hook.

---

## 6. Failure modes

| Failure | Detected by | Effect | Left behind | Recovery |
|---|---|---|---|---|
| Gate refused | `requireCronAuth` | return, no `job_runs` row | nothing | none |
| Settings missing or bad mode | settings read | treated as `off` | nothing | owner fixes the row |
| `EXPLEE_API_KEY` missing | config check | `ok=false stage=config` (not in `off`) | nothing | owner adds key |
| `project_ids` empty | settings | `ok=true skipped=no_projects`, projects listed | nothing | owner sets ids |
| Explee 401/403 | client | `ok=false stage=explee` | nothing | owner checks key |
| Explee 402 | client | `ok=false stage=explee error=insufficient_credits`, run stops | nothing | owner tops up |
| Listing page fails after retry | client | that project's listing incomplete: no hidden inference, no decision for its rows | nothing | next run |
| Thread read fails | client | `failed explee_error`, non-final, `attempts+1` | lead row | next run, max 3 |
| Lead hidden from a complete listing | run loop | first absence stamps `absent_since`; a second complete absence 50+ minutes later plus a thread read gives `erased`, `declined` or `hidden`, final, hash kept; `created` rows reconciled first | lead row | none |
| Status set Lost after a dry pull | fresh listing (Rule F) | `skipped team_lost` | lead row | none |
| Unknown label | rules | `skipped unknown_intent`, held, in summary | lead row with excerpt | owner edits lists or policy |
| Listing `email` null on an include label | rules | `skipped replied_by_other`, held | lead row with excerpt | owner handles by hand |
| Generator or validator fails twice | generator | `failed prompts_invalid`/`prompt_gen_error` | lead row only | 3 attempts, then summary |
| Auth user exists for the invitee | Rule U Check A | `skipped already_customer`, final | nothing | none |
| Login made by the lead (self-serve) during the run, before Check B (rev 4, V1) | Rule U Check B | client rolled back, `skipped already_customer`, final; no invite, no bind, no user delete | nothing | none |
| Unconfirmed login made after Check B read its page, invite re-sends to it (rev 4, V1) | Rule U step 2 (`idsB`, `T_inv - 5 s`, profile 23505) | not ours: client rolled back, `already_customer` with `invite_sent_at`, creation stopped `not_ours`; within 5 s and no profile yet: bound (residual, Q15) | one re-sent invite email | none; residual: the address owner's own login on an account for their company |
| Function clock more than 5 s ahead of GoTrue (rev 4, V1) | Rule U step 2 | own new user judged not ours: not bound, not deleted, creation stopped for the run | an invited login without profile | next runs find it at Check A (`already_customer`); owner checks clock skew from `stopCreating='not_ours'` in `job_runs` |
| Two failure reasons alternate (rev 4, N3) | `attempts_total` | final at 10 failures, in summary | lead row | owner resets |
| Active lead missed by two complete listings (rev 4, N4) | thread read on second absence | message newer than `absent_since`: `absent_since` cleared, not hidden; none newer: `hidden` (residual) | lead row | next listing |
| Guard reached between generation and provisioning (rev 4, N1) | `canCall` before homepage, each generation, provisioning | row released, `truncated` `decide`, creation stopped `guard` | nothing | next run |
| Guard reached before the daily summary (rev 4, N1) | `canCall` in `maybeSummary` | no send, `last_summary_date` unchanged, `truncated` `summary` | nothing | next live run sends |
| Auth user listing incomplete | Rule U | no creation this run, `ok=false stage=auth_users` | nothing | next run |
| Two runs reserve one identity | unique index 23505 | the loser leaves the row as it was | nothing | next run decides |
| Daily cap reached under a race | count after reservation | row reverted, creation stops | nothing | next run |
| Invite rate limit | helper | `failed email_rate_limited`, breaker, pause 1 h | nothing (rolled back) | automatic |
| Profile or prompts insert fails (after the invite) | helper | `failed provision_error`, FINAL (C3), creation stops for the run (C4), stays in the daily window through `invite_sent_at` (C2, rev 4); a profile 23505 is instead the "not ours" proof (Rule U step 2) | rolled back under Rule U; one dead invite email sent | owner resets the row by hand |
| Failure before the invite (precheck, client) | helper | `failed provision_error` non-final, creation stops for the run (C4) | nothing | next run, 3 consecutive (D8 "Attempts") |
| Kill between client insert and progress write | reclaim, `pending_slug` lookup | `failed half_made`, emailed `explee_orphan` | orphan client, no user | owner deletes |
| Item moves during paging, or a short non-final page | `has_more` paging, two absences, thread read | no `hidden` on one absence | `absent_since` stamp | next complete listing clears it |
| Slow Explee, run near 15 minutes | time guard | stages cut, `detail.truncated`, `job_runs` written | rows unprocessed | next run continues |
| Follow-up on, lead declined after creation | `followUpDecision` | `skipped_declined` | none | none |
| Invitee or company on our own sender domain | own-domain guard | `skipped own_sender_domain`, held | lead row | owner fixes lists or handles by hand |
| Rollback fails | helper `rollback_failed` | `failed half_made` final, emailed `explee_orphan`; after an invite: `invite_sent_at` set, counted in the daily window and suppressing the address (rev 4, V2) | orphan client or user | owner deletes |
| Lead's company domain held by another lead's `email_domain` (rev 4, V3) | `companyConflict` in D5 duplicate 4 and the re-check | `company_has_account`, final, in summary | lead row | none |
| Follow-up thread carries a non-include label (rev 4, V4) | `followUpDecision` include-only rule | `skipped_label`, terminal | none | owner mails by hand if wanted |
| Function killed mid-provision | reclaim after 20 min | `client_id`/`user_id` set: `failed half_made` + event; none set but `pending_slug` names an existing client: `failed half_made` + event; otherwise decided again | lead row | owner, if half made |
| Enqueue or budget block | importer | `created`, `collection_status` set | account without data | 3 retries |
| Note fails | client | `note_status='failed'` | none | 2 retries |
| Follow-up 403 / 409 / 429 | client | `skipped_blocked` / next run / after 24 h | none | as listed |
| Lead erased after creation | reconciliation | personal fields nulled, emailed event | account exists | owner decides |
| Created lead later declines | reconciliation | emailed `explee_created_declined` | account exists | owner decides |
| Wrong account created | owner | owner deletes it; row `undone_at` | lead row, no email | never re-created |
| Unhandled exception | top-level catch | `job_runs ok=false`, normal return | partial row state, reclaimable | next run |

---

## 7. Acceptance criteria

1. `node --check` passes on every new and changed function file; `tsc` exits
   0; every node test file passes, including the three named new files
   (`explee_rules.test.js`, `explee_import.test.js`,
   `provision_client.test.js`) and the modified `refresh_cadence.test.js`.
2. `tests/explee_rules.test.js` covers every row of the D3 table in order (an
   erased `hot_lead` is skipped), the decline regex (`Not Interested`,
   `not-interested`, `unsubscribed`, `remove_me`, `do_not_contact` match;
   `interested` does not), `unsubscribe` excluding with no other signal, an
   earlier `unsubscribe` excluding a later `hot_lead`, `email_changed` and
   `out_of_office` taking the referral path, `reply_count` having no effect on
   any decision, the `hold` and `include` policies, and at least 70 checks.
3. Domains: a free-mail or platform `company_domain` falls back to the email
   domain, or gives `no_company_domain` when that is excluded too; a referral
   candidate on an excluded domain returns null; subdomain matching works in
   both directions; brand domain is the profile domain when usable even when
   the email domain differs.
4. Replier: a null listing `email` with an include label gives
   `replied_by_other`; a listing `email` matching no `reply` message gives
   `replied_by_other`; `LeadProfile.email` is never the invitee; a null
   listing `email` on `email_changed` with exactly one company-domain address
   in the body creates for that address.
5. `validatePrompts`: brand term with diacritics, whole-word match (a brand
   term inside a longer word does not reject), URL, too short, duplicate after
   folding, fallback template, 5 kept from 8, 4 valid gives `ok:false`, and
   one valid case each in Japanese, Chinese and Thai. The Free count equals
   `PLAN_PROMPTS.free` read from `planConfig.ts`.
6. A listing of 450 candidates with `max_threads_per_run=200` is fully decided
   after three runs; no candidate is left unrowed after run one.
7. With `project_ids` empty a run reads only the projects list, records
   `projectsVisible`, decides nothing, and writes `ok=true
   skipped='no_projects'`. A conversation of an unlisted project is never
   read.
8. A `would_create` row whose lead is set to `Lost` in the fake Explee after
   the dry run (no other change) is skipped `team_lost` on the live run; a
   `would_create` row whose conversation disappears from two complete
   listings at least 50 minutes apart is skipped `hidden` (revision 3, D1
   step 8; one absence only stamps `absent_since`); an incomplete listing
   changes no row.
9. Two runs interleaved inside provisioning (the fake yields between calls)
   over the same listing create exactly one account per identity: two
   `person_id`s with one email, and two with one brand domain, each give one
   `created` and one `already_customer` or `company_has_account`, and the
   daily cap counts `creating` rows.
10. In `live`, a qualifying lead produces exactly: one `clients` row
    (`plan='free'`, `refresh_cadence='monthly'`, `last_refresh_at` set,
    `onboarding_complete=true`, market from country); one invite with
    `redirectTo` `https://app.getbrandgeo.com/reset-password`; one
    `user_profiles` row `role='viewer'`; 5 `prompts`; one `client_events` row
    with `meta.source='explee-import'`; one `collection_runs` row
    `trigger='scheduled'` (the fake's `sum_cost_eur` answers); one note POST;
    zero reply POSTs while the follow-up is off; zero status POSTs, ever.
11. Rule U: an invitee with an existing pending auth user, and one with an
    existing profile-less auth user, each give `already_customer` with zero
    invites, zero `deleteUser` calls and the existing user unchanged; an
    invite returning a user that was in the pre-check set is never deleted.
12. `tests/provision_client.test.js`: the admin wizard path gives the same
    insert payload except the `brand_aliases` rule of 5.4 (A1, the one
    intended difference, criterion 46), the same response keys (`client_id`, `plan`,
    `engines_enabled` and the rest), the same status codes and 409 texts as
    before, a non-fatal audit row, slug retry on 23505 for a derived slug; and
    `provisionViewerClient` always writes `viewer`. A source-text test asserts
    `explee-import-background.js` and `_explee_rules.js` contain no `'admin'`
    literal and do not import `provisionAdminWizardClient`.
13. In `dry_run`, a run over at least 20 conversations writes to no table but
    `explee_leads`, `explee_import_settings` and `job_runs`, makes zero
    Explee POSTs, at most `max_dry_payloads_per_run` OpenAI calls plus one
    retry each, and each `would_create` row it payloads carries a
    `WouldPayload` with brand name, website, market, masked address and 5
    prompts. The captured OpenAI request contains none of the fixture reply
    sentences, no fixture name and no `@`.
14. Caps: 6 qualifying leads with `max_creates_per_run=5` give 5 then 1; two
    referral-qualifying leads give 1 per run; `max_creates_per_day` holds over
    a 24 h window across a UTC midnight.
15. A 429 or a `rate limit` message on the invite rolls back, sets
    `paused_until`, and creates nothing else that run; a message containing
    `generate` or `limit` alone does not open the breaker.
16. A `created` lead erased in the fake, and absent from the listing, is
    found by the daily reconciliation: personal fields nulled under the CHECK,
    `email_sha256` kept, one emailed `explee_created_erased` event. A created
    lead's new `not_interested` reply raises `explee_created_declined`.
17. `mode='off'` with or without a key writes exactly one `job_runs` row
    (`ok=true`) and runs the purge; a missing settings row and
    `mode='bogus'` behave as `off`; setting `off` between two provisions of one
    run stops the second; a refused gate writes no row; an exception inside
    the run gives `ok=false` and a normal return.
18. Retention: `reply_excerpt` and `would_payload` older than 30 days are
    nulled in every mode; no excerpt is stored for `declined`, `team_lost`,
    `hidden` or `erased`; a phone written `+34 600 12 34 56` is masked; the
    daily summary body holds no `@` and no excerpt.
19. Every timestamp comes from the injected clock: tests run at fixed dates
    including 23:59 UTC and the first of a month, the summary is sent once per
    UTC date at or after 07:00 UTC, and no test reads the real date.
20. `_explee_client.js` exposes only the seven listed calls, rejects a
    `person_id` containing `/`, sends nothing on a 402 after the first, and
    each call carries an abort signal.
21. `fake_supabase_mem.js` changes are opt-in: every existing test file passes
    unchanged.
22. No new file, fixture, test or doc contains a real person, company lead,
    email address or key; addresses use `example.com` (or another `.example`
    domain). A dash scan with a positive control finds no em or en dash in
    added lines. **Recorded exception (revision 4, N8):** our own domains
    `getbrandgeo.com` and `trybrandgeo.com`, and their subdomains, may appear
    in tests with invented local parts only (`ana`, `sales`, `team` and the
    like, never a real mailbox of a person), because criteria 48 and 54 test
    the code constant `OWN_SENDER_DEFAULTS`, which a configured `.example`
    own domain cannot exercise. Moving those fixtures to a `.example` own
    domain was considered and rejected for that reason.
23. Untouched in the diff: `stripe-webhook.js`, `accept-terms.js`,
    `_terms_gate.js`, `expire-plan-grants.js`, `_affiliate_stripe.js`,
    `_plans.js`, `resend-invite.js`, `netlify.toml`, everything under `src/`,
    `tests/resend_invite.test.js`, `tests/affiliate_*.test.js`,
    `tests/helpers/fake_clock.js`.
24. Exactly one new environment variable is read: `EXPLEE_API_KEY`.
25. The migration applies on a copy of production; `anon` cannot select
    either table; an authenticated non-admin reads 0 rows; no DELETE policy
    exists (bg-verify probe).
26. The dashboard entry chunk does not grow (server-only change), against
    580.13 kB.

Revision 3 criteria (each names its inputs and the observable result; all run
on the repo fakes with an injected clock, no network):

27. **F1, M1.** Live, 6 qualifying leads, caps 5 a run and 30 a day, fake
    `failInsert: ['user_profiles']`. Run 1: exactly 1 `inviteUserByEmail`
    call, exactly 1 row `failed provision_error final=true` with `reserved_at`
    not null, the other 5 rows with `reserved_at` null and no `clients` row,
    `detail.createsAttempted = 1`, `detail.stopCreating = 'provision_error'`.
    Run 2 (one hour later, insert still failing): exactly 1 more invite, to a
    DIFFERENT address, and 0 invites to the address of run 1. The daily count
    read after run 2 is 2. A second scenario: `failInsert: ['clients']`
    (failure before the invite): 0 invites, the row non-final with
    `reserved_at` null, creation stopped for the run.
28. **F2.** `followUpDecision` with a `created` row (replier, created 10:00),
    `follow_up_enabled=true`, delay 60, a thread holding the creating
    `hot_lead` reply plus a `not_interested` reply at 10:30, `can_reply`
    true, run at 11:05: returns `skipped_declined`. The same with the label
    replaced by `remove_me`, with `reply_blocked_reason='unsubscribe'`, and
    with the listing item's `lead_status='Lost'`: each `skipped_declined`.
    In the importer, 0 reply POSTs and `follow_up_status='skipped_declined'`.
29. **F3.** Two live runs interleaved (the fake yields between calls) over
    leads p1 brand `acme.example` and p2 brand `shop.acme.example`, both
    qualifying, different invitee addresses: exactly 1 `created` and 1
    invite after both runs; the other row is not `created` and is decided
    `company_has_account` by a third, sequential run. Same result for p1
    brand `acme.example` and p2 with email domain `acme.example` and brand
    `other.example`. **Amended in revision 4 (builder's deviation, taken):**
    the third, sequential run decides the other row `already_customer` when
    the winner's `clients` row monitors a matching domain (D5 duplicate 3
    runs before duplicate 4), else `company_has_account`; in both cases it
    is final, never `created`, and makes 0 invites.
30. **F4.** Live, one qualifying lead; the fake prompt generator sets
    `mode='off'` in the settings row while it runs: 0 `clients` rows,
    0 invites, the lead row back to its previous decision with
    `reserved_at` null and `final=false`. Same with `paused_until` set to
    `now + 1 hour` inside the generator.
31. **F5.** Settings `live`, one `created` row whose thread is now erased and
    one `created` row with a later `not_interested` reply, clock 08:00 UTC,
    `last_reconcile_date` yesterday. A run with body `{"mode":"dry_run"}`:
    0 `admin_notifications` rows, 0 notify or email calls, both `created`
    rows unchanged, `last_reconcile_date` unchanged,
    `last_dry_reconcile_date` = today. The next run without the body (live,
    09:00): one `explee_created_erased` and one `explee_created_declined`
    event, `last_reconcile_date` = today. A dry run at 08:00 with
    `last_summary_date` yesterday sends no summary.
32. **auth I1, L7.** Seeded: a `clients` row with slug `acme`, a lead row
    `state='processing'`, `decision='creating'`, `pending_slug='acme'`,
    `client_id` and `user_id` null, `claimed_at` 21 minutes before `now`.
    A live run: the row becomes `failed half_made final=true` with
    `client_id` set to that client's id, one emailed `explee_orphan` event,
    0 invites, 0 `clients` inserts, 0 `deleteClient`/`deleteUser` calls. A
    second seed with `pending_slug='nomatch'` and no such client: the row is
    reverted and decided again (its normal decision this run). A unit test of
    the helper asserts `onBeforeClient` is awaited before every insert
    attempt, including slug retries, and that a throwing `onBeforeClient`
    inserts nothing.
33. **auth I3.** The migration file contains the line `revoke insert, update,
    delete, truncate on public.explee_leads, public.explee_import_settings
    from authenticated;` (text check). On a copy of production (bg-verify,
    with criterion 25), `has_table_privilege('authenticated',
    'public.explee_leads', 'INSERT')` and the same for UPDATE, DELETE and
    TRUNCATE on both tables return false.
34. **listUsers paging.** Fake option: 2,100 users, served page size capped
    at 50 while 1000 is requested, `nextPage` returned. The pre-check finds a
    user that sits on page 30 and returns `email_registered`. With `nextPage`
    omitted, the pass ends only at the first empty page and still finds it.
    With the cap of 20 pages reached before the end marker: `complete: false`,
    `auth_lookup_incomplete`, 0 invites.
35. **M2.** Fake inbox of 450 items in 3 pages with `has_more`; stored row X
    (non-final, `would_create`) at index 300; the fake moves X to index 0
    after page 1 is read. Run 1: X's row is NOT final and has `absent_since`
    set. Run 2, 60 minutes later, X listed: `absent_since` null, X re-decided.
    A third case: X truly gone; run 1 stamps `absent_since`, run 2 at +60
    minutes reads X's thread once and writes `skipped hidden final=true` with
    `email_sha256` kept. A page of 150 items with `has_more: true` is not
    treated as the last page (a 4th page is requested); with `has_more`
    omitted, paging ends only on an empty page.
36. **M3.** Live, settings with `max_reconcile_per_day=100`, 100 rows to
    reconcile, clock at 07:10 UTC, fake delay 10 s per Explee call. The run
    starts no Explee call at or after elapsed 13 minutes, starts no reconcile
    read at or after 5 minutes, writes its `job_runs` row,
    `detail.truncated` contains `reconcile`, `last_reconcile_date` is NOT
    today, and every row read has `reconciled_at` set. A second run continues
    with the unread rows and stamps `last_reconcile_date` when it finishes the
    list. A listing cut at 13 minutes is `complete:false` and hides nothing.
37. **M4.** `validatePrompts` with brand terms `['acme']` rejects
    `東京でacmeのような会計ソフトは` with rule `brand_term`, rejects a Thai
    prompt containing `acme` between Thai characters, and a Korean prompt
    with `acme` followed by a Hangul particle; keeps the English
    `Is acmesoft a good tool for small shops?` (Latin word boundary still
    required) and a Japanese prompt containing `acmesoft` inside Latin text.
38. **L1.** `validatePrompts` keeps a 13-character Korean prompt of 4 words
    (Hangul is DENSE: 6 to 80 characters, no word count) and rejects a
    5-character Hangul prompt with rule `length`.
39. **L2.** Live follow-up, fake reply POST answers 200 `{ ok: false }`:
    `follow_up_status='failed'`, `follow_up_attempts=1`, counted in
    `detail.followUps.failed`; 200 `{ ok: true }` and 200
    `{ deduped: true }` are `sent`.
40. **L3.** A `created` row with `follow_up_status='failed'` and
    `follow_up_attempts=3`: one live run writes `gave_up` and makes 0 thread
    GETs for it; the next two runs make 0 Explee calls for it.
41. **L4.** `follow_up_enabled` switched on with 8 `created` rows: 2 created
    100 hours ago, 6 created 2 hours ago. Run 1: the 2 old rows become
    `skipped_expired` with 0 thread GETs; exactly 5 reply POSTs; the sixth
    young row is sent in run 2.
42. **L5.** `project_ids = '{999}'` and the key sees only project 1: the run
    writes `ok=false, stage='explee', error='projects_missing'` and reads no
    inbox. `project_ids = '{1,999}'`: `ok=true`, project 1 read,
    `projectsMissing = [999]`.
43. **L6.** A `created` row with `note_status='failed'` and `erased_at` set,
    and one with `undone_at` set: one live run makes 0 note GETs and 0 note
    POSTs for them and writes `note_status='skipped'`.
44. **ops I1.** A row fails `explee_error` twice (attempts 2), then the thread
    reads and prompts fail `prompts_invalid` once: `attempts=1`, not final.
    Two more `prompts_invalid` failures make it final at `attempts=3`. A
    `would_create` decision between failures resets `attempts` to 0.
45. **ops I7.** Listing with a skeleton item `{ person_id: null, erased: true }`:
    no row inserted, `detail.listing[<id>].skeletons = 1`, no error. A stored
    `would_create` row with `email_sha256` whose conversation is absent from
    two complete listings 60 minutes apart and whose thread read answers
    `erased: true`: decided `skipped erased final=true`, `erased_at` set,
    `email_sha256` kept, plain `email` null. A later lead with the same
    invitee address under a new `person_id` is `already_customer`.
46. **A1.** `provisionAdminWizardClient` and `provisionViewerClient` with
    `name: '  Acme Studio '` and `brand_aliases: ['acme', 'ACME STUDIO',
    'acmestudio.example']` write `brand_aliases = ['acme studio', 'acme',
    'acmestudio.example']`; with `brand_aliases: []` they write
    `['acme studio']`; with `['acme studio', 'x-acme']` the list is unchanged.
    The `feed1d5` parity test shows `brand_aliases` as the only differing
    column of the client row for each of its scenarios, and every other
    column identical.
47. **A2.** `followUpBodyValid` returns false for a body with `{score}`,
    `{mentions}` or a `%` character, true for a body with only `{brand}` and
    `{first_name}`. With an invalid body and `follow_up_enabled=true`: 0 reply
    POSTs, statuses unchanged, `detail.followUpBodyInvalid = true`. A
    source-text test asserts the follow-up code path of
    `explee-import-background.js` does not reference `ai_results`,
    `collection_runs` or `client_results_latest`.
48. **A3.** Defaults `own_sender_domains = ['getbrandgeo.com',
    'trybrandgeo.com']`. A `hot_lead` replier at `ana@mail.trybrandgeo.com`
    gives `skip own_sender_domain` (soft, held, 0 invites); a `hot_lead`
    replier at `ana@persona.example` in a thread whose `sent` messages come
    from `team@persona.example` (an outbound persona domain not in the
    setting): `own_sender_domain`; an `email_changed` reply whose only body
    address is `bob@persona.example` in that same thread gives no invitee
    (D4 drops it) or `own_sender_domain`, never a create;
    a replier at `ana@acme.example` with our `sent` messages from
    `sales@getbrandgeo.com` creates normally. `rulesHash` changes when
    `own_sender_domains` changes.
49. **A4.** Section 3.5 of this spec lists the three reported facts, each
    marked "Reported, not verified" (text check by the reviewer).

Revision 4 criteria (repo fakes, injected clock, no network; the fake runs
with `stampCreatedAt: true` unless a case says otherwise):

50. **V1.** Importer, live, one qualifying lead, run snapshot taken at the
    run start. (a) The fake adds an UNCONFIRMED user for the invitee address
    WITH its own `user_profiles` row after the snapshot and before Check B
    (during prompt generation): 0 `inviteUserByEmail` calls, 0 `deleteUser`
    calls, 0 `user_profiles` inserts by the helper, 0 `clients` rows left,
    that user and its profile unchanged, the lead `skipped already_customer
    final`, `invite_sent_at` null. (b) Same without the profile row: same
    counts (0 invites, 0 deletes, 0 binds). (c) The fake adds the user after
    Check B and the invite returns it (re-send) with `created_at` 6 s before
    `T_inv`: 1 invite, 0 `deleteUser`, 0 `user_profiles` inserts, 0 `clients`
    rows left, result `email_registered` with `inviteSent: true`, the lead
    `skipped already_customer final` with `invite_sent_at` set and
    `user_id` null, `detail.stopCreating = 'not_ours'`, and a second
    qualifying lead in the same run gets no provisioning call. (d) As (c)
    but `created_at` 1 s before `T_inv` and a profile already exists: the
    profile insert answers 23505; 0 `deleteUser`, the existing profile
    unchanged, 0 `clients` rows left, `already_customer` with
    `invite_sent_at`. (e) The invite returns a new user with no `created_at`
    (`stampCreatedAt` off): not bound, not deleted, `email_registered` with
    `inviteSent: true`. (f) `provisionAdminWizardClient` for a new address
    with `stampCreatedAt: true`: exactly 2 `listUsers` passes (Check A and
    Check B), the same response and status as before (the parity scenarios
    of criteria 12 and 46 still pass). (g) Wizard, case (a): the existing
    409 email text, 0 invites, 0 deletes. A source-text test asserts the
    helper no longer contains `FRESH_WINDOW_MS` and calls `loadAuthEmails`
    between the `onStep('client')` call and `inviteUserByEmail`.
51. **V2.** Live, `max_creates_per_day = 1`, fake: `user_profiles` insert
    failing AND the rollback's `clients` delete failing (`rollback_failed`
    after the invite), four hourly runs, four qualifying leads: exactly 1
    invite in total; the first row `failed half_made final` with
    `invite_sent_at` set; runs 2 to 4 stop with `stopCreating = 'day_cap'`.
    Second scenario: one address under two `person_id`s of two companies,
    the first ends `half_made` after its invite, the second run is healthy:
    exactly 1 invite in total and the second row `skipped already_customer`.
    A unit test of `suppresses()` returns true for a row with only
    `invite_sent_at` set and for a final `half_made` row.
52. **V3.** p2 `created` with `brand_domain = other.example` and
    `email_domain = sales.acme.example`; p1 qualifies later with brand
    `acme.example` and no client row matching it: run 1 decides p1
    `skipped company_has_account final` with 0 reservations
    (`detail.reservationRechecks` 0) and 0 invites; a run 2 makes 0 Explee
    calls for p1. Unit test: `companyConflict(['acme.example', null],
    ['other.example', 'sales.acme.example'])` is true;
    `companyConflict(['acme.example', 'gmail.com'], ['other.example',
    'gmail.com'])` is false (excluded domains dropped on both sides); a
    source-text test asserts `duplicateOf` and `conflictAfterReservation`
    both call `companyConflict`.
53. **V4.** `followUpDecision`, `created` row (replier, created 10:00),
    follow-up on, delay 60, run 11:05, `include_intents = ['hot_lead']`:
    a thread `hot_lead` reply then an `opted_out` reply gives
    `skipped_declined`; the same with `wrong_person` gives `skipped_label`;
    a thread with an `out_of_office` reply BEFORE the `hot_lead` reply gives
    `skipped_label`; a thread whose replies are all `hot_lead` (one with a
    null `intent` on an individual message) and both `latest_intent`
    `hot_lead` gives `send`; listing `latest_intent` null gives
    `skipped_label`. `DECLINE_RE` matches `opted_out`, `optedout`, `opt_out`,
    `optout` and `opted-out` after normalisation, and not `opted_in`;
    `qualifyLead` on a `hot_lead` thread with an earlier `opted_out` label
    gives `skip declined final`. In the importer, a `skipped_label` row is
    never selected again (0 thread GETs on the next run).
54. **I-1.** `isOwnDomain('persona.example', ['mail.persona.example'])` is
    true; `isOwnDomain('eu.persona.example', ['persona.example'])` is true;
    `isOwnDomain('example', ['mail.persona.example'])` is false;
    `isOwnDomain('acme.example', ['getbrandgeo.com'])` is false. A
    `hot_lead` replier at `ana@persona.example` in a thread whose `sent`
    messages come from `team@mail.persona.example` gives `skip
    own_sender_domain` (soft, held, 0 invites). With `own_sender_domains =
    []` (and with null) a replier at `ana@getbrandgeo.com` and one at
    `ana@mail.trybrandgeo.com` each give `own_sender_domain`. `rulesHash` is
    equal for `own_sender_domains = []` and `['getbrandgeo.com',
    'trybrandgeo.com']`, and differs for `['persona.example']`.
55. **N1.** Live, `last_me_at` recent, fake delay 4.2 minutes per Explee
    call so the lead's thread read ends at 12.6 minutes, homepage 6 s, first
    generation answer invalid and the second valid, 25 s each: no
    `inviteUserByEmail` and no `clients` insert at or after elapsed 13
    minutes; the lead row released (`reserved_at` null, `final=false`,
    `attempts` and `attempts_total` unchanged); `detail.truncated` contains
    `decide`; `detail.stopCreating = 'guard'`. With the first answer at
    12.9 minutes invalid, the retry is not started. A live run whose last
    listing page returns at 14.0 minutes at 07:05 UTC with
    `last_summary_date` yesterday: 0 notify calls, `last_summary_date`
    unchanged, `detail.summary = 'deferred_guard'`, `truncated` contains
    `summary`; the next live run at 08:05 sends the summary once.
56. **N2.** `validatePrompts` with brand terms `['acme']` rejects the
    Japanese prompt of criterion 37 with `acme` written in fullwidth letters
    (U+FF21 U+FF23 U+FF2D U+FF25) with rule `brand_term`, and rejects a
    Japanese prompt with brand term `ＡＣＭＥ` (fullwidth) against ASCII
    `acme` in the text; it still keeps the Japanese prompt with `acmesoft`
    of criterion 37. A unit test asserts `fold('ＡＣＭＥ')` is unchanged by
    revision 4 (NFKC lives in `brandTermMatches` only).
57. **N3.** Live, a lead whose failures alternate `explee_error` and
    `prompts_invalid` every run: `attempts` stays 1, `attempts_total` rises
    1 to 10, the row is final at the 10th failure with the reason of that
    failure and appears in the daily summary; an 11th run makes 0 Explee
    calls and 0 OpenAI calls for it. `email_rate_limited` 12 times raises
    `attempts_total` by 0. The migration text carries
    `attempts_total integer not null default 0 check (attempts_total between
    0 and 10)`.
58. **N4.** A stored non-final `would_create` row absent from two complete
    listings 60 minutes apart, whose thread read on the second absence
    answers with a `reply` message `ts` 10 minutes after `absent_since` and
    no decline: the row stays non-final, `absent_since` null,
    `detail.listing[<id>].absentCleared = 1`, not `hidden`. The same with
    every message older than `absent_since`: `skipped hidden final=true`
    (criterion 35's third case unchanged). An erased thread with a newer
    message still gives `skipped erased` (order: erased, declined, newer
    message, hidden).
59. **N8.** An address scan of every new or changed file of the build
    (`rg -o` for address shapes) finds only `.example` domains (including
    deliberate `.example` variants used as negatives) and, under the
    criterion 22 exception, invented local parts on `getbrandgeo.com`,
    `trybrandgeo.com` or their subdomains; no other domain.
60. **Builder deviation, taken.** Seeded reclaim as criterion 32 but the
    `clients` row with slug `acme` has `brand_website = other.example` while
    the lead's reserved `brand_domain` is `acme.example`: 0 `explee_orphan`
    events, the lead row is not `half_made`, `pending_slug` is cleared, and
    the lead is decided again in the same run (created on a suffixed slug
    when it qualifies). With `brand_website = https://www.ACME.example/` the
    row becomes `failed half_made` with that `client_id` and 1 event, 0
    deletes. Criterion 29's amended sequential answer holds.

---

## 8. Open questions for the owner (the default applies if he stays silent)

| # | Question | Default |
|---|---|---|
| Q1 | Does Explee offer a key narrower than full write scope? | Use the current key; the client exposes only seven calls. |
| Q2 | What hourly email limit does Supabase Auth show (Auth, Rate Limits)? | Caps stay 5 an hour, 30 a day. |
| Q3 | Invite link lifetime raised to 86400 s before the switch to live? | Reported done on 2026-11-11 by another session (section 3.5), not verified by this build; step 8 waits for his confirmation in Supabase Auth settings or his recorded acceptance. |
| Q4 | Invites go out with Supabase's generic template until the follow-up text exists. Accepted for the first batches? | Yes, under R1 (fully automatic). |
| Q5 | Daily summary by email or bell only? | Emailed to the alert mailbox, counts only. |
| Q6 | F5: may a dry run ever notify or email (for example the erasure of a `created` row seen during a dry period)? | No. A dry run sends no notification and no email, ever; its reconcile pass skips `created` rows and does not stamp `last_reconcile_date`, so the next live run does the notifying (D8). Orchestrator default. |
| Q7 | L4: when the follow-up is switched on, should older imports get it? | No. `follow_up_max_age_hours = 72` and `max_follow_ups_per_run = 5`; an older row becomes `skipped_expired`, never mailed (D9). Orchestrator default; both are settings. |
| Q8 | F1 and M1: how strict after a failure that follows a sent invite? | The union of both reviewers' fixes: every provisioning call counts against the per-run and referral caps, every call that reached the invite counts in the daily window, a post-invite failure is final until a human resets it, and the first `provision_error` stops creation for the run (D8 C1 to C4). Orchestrator default. |
| Q9 | A3: are `getbrandgeo.com` and `trybrandgeo.com` the full list of our sender domains? | Yes, plus the domain of every `sent` message in each thread, read at decision time. A new persona domain is one UPDATE of `own_sender_domains`. |
| Q10 | A1 open design item, NOT solved in this revision: `buildAliasRegex` (`_analysis.js:397-403`, joining parts with `[\s_.-]*` at `:401`) lets separators collapse, so an alias or name whose separator-collapsed form is an ordinary word (for example a one-word generic name such as "studio" or "the shop") matches that word in any answer and can produce false mentions. Should provisioning refuse or flag a generic name, and how is "generic" decided? | Open. Release one puts the name first as A1 requires, with no generic-word check; the defect is recorded for a separate design pass on the matcher (named follow-up "alias-generic-word-guard"). |

| Q11 | N5 (ops re-review): with a post-invite step failing for every lead, each live run still sends one dead-link invite to a NEW lead (C4 stops the run, not the next one). Pause creation (for example `paused_until = now + 24 h`) after two consecutive runs that each end with a post-invite failure? | Not built in revision 4. The daily summary lists every final `provision_error` by `person_id`; the owner sets `mode='off'` on reading it. |
| Q12 | N7 / I-2: when a client on the SAME website and slug was made by someone else inside the reclaim window (for example the owner onboarding that lead by hand), the `explee_orphan` event says "delete what is left by hand" about a real client. Reword the event to "check whether client <id> was made by this import before deleting it"? | Wording unchanged in revision 4; nothing is deleted by code either way. |
| Q13 | I-3: the auth listing caps at 20 pages; GoTrue serving 50 users a page makes the pass incomplete above 1,000 users, so the wizard answers 500 and the importer stops (fail closed). Raise the page cap (for example to 200) or page by `nextPage` without a cap below 10,000 users? | Unchanged: 20 pages, fail closed. Today's user count is far below 1,000. |
| Q14 | V4 scope: should labels BEFORE the account was created (for example an `out_of_office` auto-reply that preceded the `hot_lead` reply) block the follow-up? | Yes (revision 4 reads the whole thread, as the orchestrator's required outcome says); such rows end `skipped_label` and are listed. Narrowing to labels after `created_at_account` is one change in `followUpDecision`. |
| Q15 | V1 residual: an unconfirmed login made by someone else within the 5 s before the invite and after Check B, with no profile yet, is bound. The atomic alternative is `auth.admin.createUser({ email })` (refused for ANY existing address) followed by `inviteUserByEmail` to that just-created unconfirmed user, which depends on GoTrue re-sending an invite to an existing unconfirmed user (unverified here; `resend-invite.js` relies on it). Measure that on a staging project and switch? | Not built. Revision 4 ships Check B plus the 5 s rule; the residual is recorded in section 6. |

R5 to R12 answered the revision 1 questions on backfill, referral,
second person, notes and projects.

---

## 9. What this design does not do

- No webhook, no change feed, no reaction faster than one hour.
- No status change in Explee, no HubSpot push, no autopilot change.
- No follow-up text (bg-copy), off until set.
- No admin page; review and switching are SQL in release one.
- No paid plan, trial or Stripe object.
- No account for a free-mail-only lead, a platform domain or a lead with no
  company domain.
- No refactor of `provision-account.js` (named follow-up).
- No terms acceptance row (product question, not decided here).
- No change to collection, cadence, budgets or engines.
- No storage of full reply text, names, job titles, LinkedIn or phones.
- No use of the campaign lead list or its `replied` flag.

---

## 10. Should-change items declined

| Item | Reason |
|---|---|
| O-S4 newest reply first | Owner ruling R8: oldest first. A cap change is one UPDATE if he wants faster drain. |
| O-S6 follow-up as a hard precondition of live | R1 rules fully automatic; recorded as Q3 and Q4 instead. |
| O-S8 `context.getRemainingTimeInMillis()` for the guard | The injected-clock guards (5, 11 and 13 minutes since revision 3) are testable; per-call aborts bound each call. |
| O-S13 cursor reset | No cursor exists in revision 2. |
| A-S7 public suffix list for registrable domains | A new dependency; the both-direction subdomain match closes the reported cases. |
| O-S9 acting on the ccTLD conflict | Shown in the dry payload only; acting on it needs the owner's measured disagreement rate first. |
| Pre-existing: homepage fetch follows redirects to any host | Separate hardening of `_prospect_prompts.js`, not part of this objective. |

Revision 3, reviewer fixes replaced by a different rule (the body states the
rule; reasons in one line each):

| Suggested fix | Ruling |
|---|---|
| F3: the smaller `(reserved_at, person_id)` wins | Wrong when two runs' clocks differ; the row whose re-check sees a conflict releases (D8 reservation step 2). |
| M2: hidden when absent now and `listing_seen_at` older than 90 minutes | Incomplete: `listing_seen_at` is not refreshed by incomplete or partial runs; an explicit `absent_since` stamp plus a thread read is used (D1 step 8). |
| M2: treat a page as last when `has_more === false`, else the length rule | Partly kept: `has_more === false` ends paging; when absent, only an empty page ends it, never a short one (D1 step 6). |
| M4: plain substring match whenever the prompt holds a CJK, Thai or Hangul character | Too wide for Latin terms inside Latin words; dense-script characters simply do not count as a boundary (D6). |
| F2: return `skipped_blocked` on a decline | A distinct `skipped_declined` is used so the summary separates a decline from a blocked thread. |
| F5: "skip the notify calls in dry run, or amend D8" | The first branch, extended: the dry reconcile also skips `created` rows and has its own date (D8 "Reconciliation"). |
| L4: `follow_up_max_age_days` | Hours (`follow_up_max_age_hours`, 72) per the orchestrator default, plus a per-run cap. |
| L7: look up a client by `brand_website` and `created_at` | A `created_at` from the database clock against an injected clock is not exact; an exact `pending_slug` written before the insert is used (D8 Rule U step 4). |

Revision 4, reviewer fixes replaced or completed:

| Suggested fix | Ruling |
|---|---|
| V1: reload the auth set before each provisioning call and require `created_at >= callStart - 60 s` | Incomplete: a reload at the call START still leaves the client insert and progress write between the check and the invite, and 60 s keeps a minute-wide window. Check B sits immediately before the invite and the bound is `T_inv - 5 s` (only clock skew needs absorbing; a misjudgement is fail-safe and stops creation). Added: missing `created_at` is not ours, and a profile 23505 proves not ours (Rule U step 2). |
| V2: count `failed half_made` with `reserved_at` in the window, add `half_made` to `SUPPRESSING_REASONS` | Completed: `half_made` is added as suggested, and the window keys on a new `invite_sent_at` instead of decision and reason, so every row that sent an invite counts, including the V1 "not ours" `already_customer` (C2). |
| V3: add the other row's `email_domain` to D5 duplicate 4 | Taken, plus excluded domains dropped on this row's side too, in one shared `companyConflict` (D5 duplicate 4). |
| V4: labels after `created_at_account` only | Replaced by the whole-thread rule the orchestrator required; the narrower scope is Q14. The regex widening is taken as suggested. |
| I-1: (not a fix, INFO) | Ruled as required: defaults are code constants, match in both directions, parent of at least two labels (D3). |
| N1: `canCall` after `generateValidated`, before the retry, in `maybeSummary` | Taken, plus a check before the homepage read, and the provisioning check placed after the F4 settings re-read so no awaited call follows it (D8 "Time guard"). |
| N2: NFKC inside `validatePrompts` and `brandTermMatches` | Narrowed: NFKC inside `brandTermMatches` only, which `validatePrompts` calls for the brand-term rule; other rules keep `fold()` (D6). |
| N3: cap on total attempts, for example 10 | Taken as a separate `attempts_total` column, final at 10 (D8 "Attempts"). |
| N4: clear `absent_since` when the latest message is newer | Taken, for a message of any type newer than `absent_since`, checked after erased and declined (D1 step 8). |
| N8: record the exception or move the fixtures | Exception recorded (criterion 22); moving to a `.example` own domain cannot test the code constant. |

---

## 11. File plan (the builder's `scope_write`, verbatim)

| File | Action | Reason |
|---|---|---|
| `brandgeo-dashboard/netlify/functions/explee-import-background.js` | create | the importer (D1, D8) |
| `brandgeo-dashboard/netlify/functions/_explee_rules.js` | create | pure decisions (D3 to D6, 5.3) |
| `brandgeo-dashboard/netlify/functions/_explee_client.js` | create | narrow Explee client (D11) |
| `brandgeo-dashboard/netlify/functions/_provision_client.js` | create | shared provisioning with Rule U (5.4) |
| `brandgeo-dashboard/netlify/functions/onboard-client.js` | modify | call `provisionAdminWizardClient` |
| `brandgeo-dashboard/netlify/functions/_prospect_prompts.js` | modify, additive | `fetchHomepageSignalAbortable`, `generateClientPrompts` |
| `db/supabase-explee-lead-import-2026-11-11.sql` | create | tables, RLS, settings row, watch row, commented cron (not applied by the builder) |
| `brandgeo-dashboard/tests/explee_rules.test.js` | create | criteria 2 to 5; rev 3: 28, 37, 38, 47 (pure parts), 48 |
| `brandgeo-dashboard/tests/explee_import.test.js` | create | criteria 6 to 10, 13 to 20; rev 3: 27, 29 to 32, 35, 36, 39 to 45, 47 |
| `brandgeo-dashboard/tests/provision_client.test.js` | create | criteria 11 and 12; rev 3: 32 (helper part), 34, 46 |
| `brandgeo-dashboard/tests/helpers/fake_explee.js` | create | 5.5, rev 3 additions |
| `brandgeo-dashboard/tests/helpers/fake_supabase_mem.js` | modify, additive, opt-in | 5.6, rev 3 additions; defaults unchanged for other sessions' tests |
| `brandgeo-dashboard/tests/refresh_cadence.test.js` | modify | the cadence write moves to `_provision_client.js` |

Revision 3 adds no file. The rev 3 changes land in files already in this
plan: `explee-import-background.js` (D1 steps 4 to 13, D8 caps, attempts,
time guard, reservation re-check, re-read, reclaim, reconcile, D9, D10),
`_explee_rules.js` (own-domain guard, D6 boundary and Hangul, follow-up
gates), `_explee_client.js` (`hasMore`, `nextOffset`, `postReply.ok`),
`_provision_client.js` (aliases rule, `onBeforeClient`, listUsers end
marker), the migration file (5.1 changes) and the tests above.
`onboard-client.js` needs no change for A1: the rule lives in the helper it
already calls. Not in scope and not touched: `resend-invite.js` (its paging
follow-up belongs to its owner), `netlify.toml`, everything under `src/`.

Revision 4 adds no file and the `scope_write` above is unchanged. Changes
land in: `_provision_client.js` (Check B, the "ours" rule, the profile proof,
`inviteSent`; V1), `explee-import-background.js` (C2 window on
`invite_sent_at`, `invite_sent_at` writes, C4 `not_ours`, `attempts_total`,
the N1 guard checks, the N4 newer-message branch, `skipped_label`
handling), `_explee_rules.js` (`DECLINE_RE`, `isOwnDomain` both ways,
`ownDomainsFor` with the constant, `rulesHash` on the effective list,
`companyConflict`, `suppresses`, `isFinalFailure`, NFKC in
`brandTermMatches`, the include-only rule in `followUpDecision`), the
migration file (two columns, one index, one CHECK value, one comment),
`fake_supabase_mem.js` (`stampCreatedAt` and the V1 hooks, opt-in), and the
three test files (criteria 50 to 60). `onboard-client.js` needs no change:
it already maps `result.code === 'email_registered'` to its 409 email text
whatever the stage (`onboard-client.js:191`, read 2026-11-11).
