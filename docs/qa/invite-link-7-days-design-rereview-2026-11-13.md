BLOCK (design re-read). Lifts when the four MEDIUM findings below are written into the spec. No re-architecture: the boundary decision, the token design, the redeem path and the deploy order all hold. Every BLOCKER, MAJOR and MEDIUM of the two earlier reviews is closed in the text, with one partial (earlier M2, see MEDIUM-4).

# Invite links that last 7 days: re-read of the amended spec

Reviewer: bg-verify (Opus), read-only. Date: 2026-11-13.
Subject: `docs/arch/invite-link-7-days.md`, amended text (nothing built).
Earlier reviews: `docs/qa/invite-link-7-days-design-review-security-2026-11-13.md` (BLOCK), `docs/qa/invite-link-7-days-design-review-delivery-2026-11-13.md` (BLOCK).
Read in full: the spec, both reviews, `resend-invite.js`, `_provision_client.js:280-507`, `_email.js` (header and `:210-244`), `_auth.js:21-42` and its exports, `_prospect_guard.js:57-61` and its exports, `tests/helpers/fake_supabase_mem.js:380-507`, `src/pages/ResetPassword.tsx`, `src/lib/authLinkState.ts`, `src/components/PendingInvitesPanel.tsx` (by grep), `src/App.tsx:18`, `:279`, `src/pages/Onboard.tsx:105-136`, `:705-822` (by grep), `explee-import-background.js:46-48`, `:118-119`, `:985-1134`, `onboard-client.js` (by grep), `tests/resend_invite.test.js:1-170`, `tests/provision_client.test.js:500-528`, `tests/explee_import.test.js:85-88`, `:1292-1374`, `tests/helpers/affiliate_test_env.js` (by grep).

## 0. Calibration

1. `git diff --stat`, `tsc`, `npm run build`, tests: not run, by the hard rules of this task. There is no diff; this is a design re-read.
2. Secret scan: no diff. No secret file opened; environment variable names only.
3. Criteria: the spec's acceptance tests (section 10) are objectively checkable, with one gap (MEDIUM-4). Owner steps: exact except the items in LOW-8.
4. Baseline: not measured (not allowed). CLAUDE.md records `tsc` exit 0 and 65 of 65 node test files at `0ee54eb`.
5. Most sensitive new function: `invite-redeem.js` (public, mints a GoTrue token). Its guard is the 256 bit token plus the row binding of spec section 4; no JWT by design. Most sensitive changed function: `resend-invite.js`, guarded by `requireAuth(event, { adminOnly: true })` at `resend-invite.js:134`.
6. Write access used: this one file under `docs/qa/` only. No reviewed file edited.

CALIBRATED (steps 1 and 4 not run, by rule).

## 1. Closure of the earlier findings, checked in the text

| Earlier finding | Closed? | Where in the amended spec |
|---|---|---|
| Security MAJOR-1 / Delivery B1, lowering Email OTP expiration | Closed | line 5, section 0 "Do NOT change", Q2 closed, section 7 first paragraph, section 2 table row 1 |
| Security MEDIUM-1, Resend does not revoke the Supabase link | Closed, but see MEDIUM-1 and MEDIUM-2 below | section 4 "Revocation of the previous link", 6.1 step 4, C-P5, C-P8 |
| Security MEDIUM-2, no incident stop | Closed | section 4 kill switches, 5.1 `revoked` value and runbook |
| Security MEDIUM-3 / Delivery M1, 60 minute display default | Closed | 6.3 `SUPABASE_EMAIL_LINK_TTL_MINUTES = 1440`, 5.2 active-row rule |
| Delivery M2, tests cannot stay green | Partly closed | fake hooks and double runs in section 10; the list of assertions that change on purpose is incomplete (MEDIUM-4) |
| Delivery M3, two GoTrue calls on a wrong deploy order | Closed | 6.4 `channelReady` before Check B |
| Delivery M4, Resend without timeout | Closed | 6.1 step 6, `SEND_TIMEOUT_MS` |
| Delivery M5, owner steps not exact | Mostly closed | section 0, section 12 step 5; residue in LOW-8 |
| Security LOW-1 to LOW-7, Delivery L1, L3 to L10 | Closed in text | L3 closed with a defect on its failure branch (MEDIUM-3); Delivery L2 and Security LOW-4, LOW-5 (query stage) rejected with stated reasons in section 14, reasons accepted |

## 2. Findings, ranked

### MEDIUM-1. The rotation runs before the send, so a double failure strands the person and the panel then shows a false "Link valid"

Where: spec section 4 "Revocation of the previous link" (rotation "after the new row is inserted and before the email or the copy return"), 6.1 step 4 before steps 5 to 7, 5.2 "Link expiry shown to the admin".

Scenario: a pending viewer holds a working Supabase link sent 3 hours ago. The admin presses Resend. Step 2 supersedes the old row, step 3 inserts the new one, step 4 calls `generateLink`, which per GoTrue overwrites `confirmation_token` (the person's link is now dead) and moves `invited_at` to now. Step 6: Resend refuses (quota or outage); the new row becomes `send_failed`. Step 7: `inviteUserByEmail` answers 429 (Supabase email limiter). Result `email_rate_limited`, the admin sees "Supabase is limiting invite emails right now". The person now holds no working link at all; today the same double failure leaves their link alive, because nothing rotates. Then the admin reloads the panel: no active row exists (one `superseded`, one `send_failed`), so the list falls to the Supabase rule `invited_at + 1440`, and `invited_at` was just moved by the rotation. The badge reads "Link valid, 23 hours left" for a person with no link. That is the exact display defect the owner reported, now on a failure path.

Change to the spec: move the rotation after a successful send. In 6.1, step 4 becomes: "Copy delivery: rotate (as below), then return." and a new step after step 6: "Email delivery, only when `sendBrandedEmail` answered `ok` within the timer and only when `rotate`: rotate." The guards stay: 422 per LOW-1, stamp `accepted_at` on the new row and answer `already_accepted` (the email already went; its link will answer `used`, harmless); another user id, new row `revoked`, answer `user_changed` (its link answers `invalid`); any other error, `previousLinkRevoked = false`. In section 4 change "before the email or the copy return" to "after the email was accepted by Resend, or before the copy return". The sentence "Running it AFTER the supersede also closes the race of a redeem that minted just before the supersede" stays true (the rotation still follows the supersede, and 6.2's conditional update covers the window between them). On a failed send nothing is rotated: the fallback `inviteUserByEmail` rotates by itself when it succeeds, and when it fails the person keeps today's link and the panel keeps telling the truth. Test 12 changes to: exactly one `generateLink('invite')` after the Resend call for email delivery, before the return for copy delivery; and a new case: Resend refuses and the fallback answers 429, then zero `generateLink` calls and the fake user's `confirmation_token` and `invited_at` are unchanged.

### MEDIUM-2. A Resend that falls back at step 1 does not supersede the earlier 7 day link, contrary to section 0

Where: spec section 0 "Resend, and a new Copy link button, kill the earlier link (both the earlier 7 day link and any earlier Supabase link)"; 6.1 step 1 ("email delivery goes to step 7", skipping step 2); section 7 rollback (2) tells the owner to set `INVITE_LINK_CHANNEL=supabase`.

Scenario: the owner has set the kill switch after an incident (the documented rollback), or `RESEND_API_KEY` was removed. A lead writes that their invite was forwarded to the wrong person. The admin presses Resend, as section 0 says that kills the earlier link. Step 1 jumps to step 7: `inviteUserByEmail` rotates the Supabase token, but step 2 never runs, so the 7 day row stays active and the forwarded link still redeems for up to 7 days. The success copy (C-P7) says "Invite sent. The link works for 24 hours." with nothing that warns the old link lives.

Change to the spec: in 6.1 step 1, for `role === 'viewer'` with email delivery, run step 2's supersede first (best effort: an error is logged and ignored), then go to step 7. Add to section 4 "Kill switches": "A Resend under the kill switch or without a Resend key still supersedes the viewer's active row." Add test 7b: with `INVITE_LINK_CHANNEL=supabase` and an active row for a viewer, one Resend leaves zero active rows and one `inviteUserByEmail`; with `role 'admin'` no table write (test 7 unchanged).

### MEDIUM-3. On the `generateLink` branch, a failed "not ours" restore drops `inviteSent`, which removes the lead import's stop and suppression guarantee and contradicts the "race tests pass on both runs" rule

Where: spec 6.4 third bullet ("Error: log the status only and return the same `fail` without `inviteSent`"); section 10 ("The race tests ... must pass on both runs"); code `explee-import-background.js:1070-1085` (only `email_registered` WITH `inviteSent` stamps `invite_sent_at` and calls `stopCreation(run, 'not_ours')`), `:1086-1091` (without it: no stamp, no stop); `_provision_client.js:373-385` (the V1 rule: a not-ours user stops the run, "bounds a clock-skew misjudgement to one").

Scenario A, guarantee change: the import runs while Supabase's email limiter is saturated, and the server clock is skewed so that a user this call created reads as "not ours" (the case the V1 rule exists for). `generateLink` has no limiter, so it creates the user; the restore `inviteUserByEmail` answers 429; the result carries no `inviteSent`; the import takes the `:1086` branch, does not stop, and repeats for every later lead, leaving one unbound, unprofiled auth user per lead. Today the same skew trips `stopCreation('not_ours')` after one lead, because `inviteSent` is always set on that path.

Scenario B, contradiction: `tests/explee_import.test.js:1359-1367` (case e) runs with `stampCreatedAt: false` and the default `inviteResendsPending: false`. On the channel-on run, the fake `generateLink` creates the user without `created_at`, the "not ours" restore calls the fake `inviteUserByEmail`, which for an existing user under the default flag calls `createUser` and errors "already been registered" (`fake_supabase_mem.js:479-485`, `:441-443`). Per the spec the result then has no `inviteSent`, so `assert.ok(r.invite_sent_at)` at `:1366` and `stopCreating === 'not_ours'` at `:1367` fail. A builder can only make the test pass by editing its fixture, which hides the guarantee change.

Change to the spec: replace the third bullet's last sentence with: "Error: log the status only and return the SAME result as success, `inviteSent: true` included. On this branch `inviteSent` means the address's auth state was touched by this call (generateLink rotated that person's token), which is what the lead import's stamp and stop rule need; the wizard does not read it (`onboard-client.js:210`)." Add a provisioning case: "not ours" on the `generateLink` branch with the restore failing still returns `inviteSent: true`, and the lead import still stops creation with `not_ours`.

### MEDIUM-4. The doubled provisioning runs have no rule for the 44 invite-count assertions, so a builder must guess how to rewrite them

Where: spec section 10, provisioning suites paragraph ("Assertion that changes ON PURPOSE: `provision_client.test.js:516-524`" only). Grep: `db.invites` appears 28 times in `tests/explee_import.test.js`, 14 in `tests/provision_client.test.js`, 2 in `tests/provision_locations.test.js` (for example `provision_client.test.js:501`, `:508`; `explee_import.test.js:1363`).

Scenario: on the channel-on run the user is created by `generateLink` (recorded in `db.generatedLinks`) and the email goes through the stubbed `sendBrandedEmail`, so every `db.invites.length === 1` assertion on a normal create is wrong by construction. A builder who "fixes" them by counting `generatedLinks` as invites stops asserting that an email went out; one who sets `inviteResendsPending` to make a case pass changes the case under test. This is the same "tests silently stop testing" risk the delivery review raised as M2.

Change to the spec: add to section 10: "On the channel-on run, translate each invite-count assertion through two helpers defined once per suite: `usersCreatedByAuth(db)` (count of `generateLink` plus `inviteUserByEmail` calls that created a user) and `emailsSent(db)` (stubbed Resend calls plus `inviteUserByEmail` calls). A normal create asserts 1 and 1 with zero `inviteUserByEmail`; a fallback asserts 1 `generateLink`, 1 Resend refusal and 1 `inviteUserByEmail`; the not-ours branch asserts 1 `generateLink` and 1 `inviteUserByEmail`. No fixture flag (`inviteResendsPending`, `stampCreatedAt`, `authBehaviour`) may differ between the two runs of one case."

### LOW-1. Any 422 from `generateLink` is read as "accepted", which stamps `accepted_at` permanently

Where: section 4 (rotation guard: "422 or `/already.*(regist|exist|confirm)/`"), 6.2 (`used` row), 6.1 step 4. Today's code keys on the message regex only (`resend-invite.js:327`).
Scenario: GoTrue answers 422 for a reason other than a confirmed user (a validation error on a stored address). The rotation stamps `accepted_at` on the new row and tells the admin "already accepted"; in redeem the row dies as `used` and the person sees "This invite was already used" with no password. Not demonstrated against the deployed GoTrue (the 422 set was not enumerated), hence LOW.
Change: map to accepted only when `error.code === 'email_exists'` or the message matches the regex; in redeem, re-read `getUserById` and require `isAccepted` before stamping `accepted_at`; any other 422 is the "other error" branch (rotation) or 503 (redeem).

### LOW-2. A missing table may not answer `42P01`

Where: 5.1 rollback, 6.2 404 row (`42P01`), section 10 fake switch.
Scenario: recent PostgREST versions answer a missing relation with `PGRST205` ("Could not find the table ... in the schema cache"), not the Postgres code. After a `drop table` rollback, redeem would fall to 503 and the page would ask the person to retry forever (earlier Delivery L9). Not verified against this project's PostgREST version.
Change: map `42P01`, `PGRST205`, or a message matching `/schema cache|does not exist/` to 404 `invalid`; the fake's table-missing switch answers `PGRST205` in one test and `42P01` in another.

### LOW-3. Section 3 claims no Supabase token exists until Continue; provisioning and the rotation each mint one

Where: section 3 last paragraph ("No Supabase token (and no `email_otp`) exists until someone presses Continue"), 5.1 runbook ("Tokens minted by earlier Continue presses").
Contradiction with 6.4 (provisioning's `generateLink` creates the user and a live 24 hour token) and section 4 (each resend rotation mints one). Exposure equals today's invite (one unseen token per user, 24 hours), so no new risk, but the sentence is false.
Change: "Every issue leaves one unseen Supabase invite token in GoTrue for 24 hours (provisioning's `generateLink`, or the rotation), the same exposure as today's invite; it is never sent, logged or returned." Runbook: "Tokens minted at issue or by earlier Continue presses".

### LOW-4. The zero-row branch of redeem leaves three states undefined and runs `generateLink` before knowing the user still exists

Where: 6.2 paragraph after the table.
Scenario: the bound user is deleted between the read and the update; the row cascades away; the conditional update hits zero rows; the second `generateLink` for that address CREATES a new user, and the spec applies the race guard only to the first call.
Change: on zero rows, re-read the row FIRST. Row gone: 404 `invalid`, no second call. `superseded`: 410 `replaced`; `revoked` or `send_failed`: 404; `accepted_at`: 410 `used`; re-read error: 503. Only when the row still exists, make the second `generateLink` and apply the same race guard to its returned user. The minted hash is never returned in any of these.

### LOW-5. `clientName` has no source in `resend-invite.js`

Where: 6.3 (`deliverInvite({ ..., clientName, ... })`); `loadClient` selects only `id` (`resend-invite.js:256`).
Change: `loadClient` selects `id, name` and the three resend paths pass `name ?? null` to `sendInvite`.

### LOW-6. Step 2b's `rollback_failed` carries `userId` with no email sent; the lead import stamps `invite_sent_at` on it

Where: 6.4 step 2b; `explee-import-background.js:1067-1068`, `:1109-1117`; the comment at `_provision_client.js:395-396` ("carries the userId ... so the importer knows an invite email went out").
The row ends `half_made`, final, with an orphan notice, so the false stamp only adds a 24 hour suppression of an address a human must clean up anyway. Change: state it in 6.4 as accepted ("on this one path `userId` is present for the orphan notice although no email went out"), and update the comment at `:395-396`.

### LOW-7. Section 6.4's "only a live Resend refusal or timeout reaches the generateLink-then-inviteUserByEmail sequence" is false

A transient write error at `deliverInvite` steps 2 or 3 after `channelReady` succeeded also falls to step 7, and the "not ours" restore reaches it by design. Harmless per GoTrue `sendInvite` (no per-user frequency check). Change the sentence to list the three cases; keep the item under "Untested".

### LOW-8. Owner steps: four gaps in exactness

- 5.1 P1: "(if `bigint`, change `client_id` to `bigint` before applying)" asks the owner to edit SQL and contradicts "any other answer STOPS the apply". Change to: "if `bigint`, stop and tell the orchestrator".
- 5.1 R1 has no query. Add: `select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='client_invite_links' order by ordinal_position;`.
- 5.1 R5 needs eight hand-substituted queries. Replace with one: `select r, p, has_table_privilege(r, 'public.client_invite_links', p) from unnest(array['anon','authenticated']) r, unnest(array['select','insert','update','delete']) p;` EXPECT eight rows, all false.
- Section 12 step 5.2: clicking the button in a mail client opens the default browser, where the admin session lives, and `verifyOtp` replaces it. Write: "In the email, right-click Set up my login, copy the link address, paste it into a private window." Add, before 5.2: "Confirm the email came from noreply@mail.getbrandgeo.com with the subject 'Your BrandGEO login is ready', and that the panel row reads 'Link valid, 7 days left'" (proves the BrandGEO channel ran, not the fallback).
Nothing in sections 0 or 12 asks for a key or changes the Supabase setting; the order (look, migrate and read back, push, live check, Resend) is right.

### LOW-9. C-O1 says "valid for 7 days" for every wizard invite

Where: section 9 C-O1, `Onboard.tsx:730`. The wizard's Admin access choice stays on the Supabase channel (24 hours, section 2). Change: branch C-O1 on the access role (Viewer: "valid for 7 days"; Admin: "valid for 24 hours").

### LOW-10. "Log the Resend error message" can log an address

Where: 6.1 step 6. `_email.js:229-231` returns Resend's own `message`; Resend's testing-mode refusal names the account's address. Change: log the HTTP status and a fixed category (`refused`, `skipped`, `timeout`), never the message.

### INFO

- I1. Redeem: no branch returns a minted token for a superseded, revoked, `send_failed` or accepted row (conditional update plus the zero-row rotation). A press within milliseconds of `expires_at` can mint, and that token then lives 24 hours past the 7 days; bounded and acceptable.
- I2. Double press: the `working` stage disables the button; a second press only replaces the first token. Two tabs: the first tab's Save lands on ResetPassword's expired view, whose recovery email works (`ResetPassword.tsx:201-223`). Worth one line in 6.5.
- I3. Rotation cannot confirm a user and creates one only when the bound user vanished, which `user_changed` and the tightened race guard handle. With MEDIUM-1 applied, no failure path leaves two live links or zero links where today there was one.
- I4. The no-log rule of section 4 names `_invite_link.js`; extend it to the `generateLink` response in `_provision_client.js` (it carries `action_link` and `email_otp`).
- I5. If marking a row `send_failed` itself fails, the row stays active and the panel shows a 7 day link nobody received; log it, acceptable.
- I6. `tests/resend_invite.test.js:110-158` replaces `db.auth.admin` with its own GoTrue model that has no `generateLink`; the rotation cases must extend that local model, not only the shared fake.
- I7. `tests/helpers/affiliate_test_env.js:35` deletes `RESEND_API_KEY`; set the dummy key after requiring the helper.
- I8. Lead import timing: provisioning grows by at most one Resend call (8 s) plus one fallback; `GUARD_CALL_MS` is 13 minutes against a 15 minute wall (`explee-import-background.js:46`), so the margin holds.
- I9. In provisioning, a Supabase-channel fallback whose `supabaseUser.id` differs from `user.id` is not checked; it needs the just-created user deleted within the same second. Not worth code.

## 3. Walks requested by the task

| Path | Result |
|---|---|
| Rotation, 422 | Correct in intent; over-broad match (LOW-1); the old link then reads "replaced" for an accepted person, harmless |
| Rotation, `user_changed` | New row revoked, race guard on `otherUser`; with the 60 s and no-profile rule, a fresh GoTrue user is deleted, an older one is spared |
| Rotation, other error | Email still sent, C-P8 shown |
| Rotation then send and fallback both fail | Lockout plus false badge (MEDIUM-1) |
| Resend under kill switch or no key | Earlier 7 day link survives (MEDIUM-2) |
| Redeem, zero-row update | Never returns the hash; three undefined states (LOW-4) |
| Redeem during a resend | Closed by the conditional update and the rotation after the supersede |
| Redeem, accepted user | `isAccepted` before mint, GoTrue 422 after; 410 `used` |
| Redeem, 503 branches | Whitelist holds; token kept |
| Provisioning, `channelReady` placement | Before `loadAuthEmails` (`_provision_client.js:347`); the no-await rule at `:344-346` holds |
| Provisioning, not ours | Restore failure drops the stop rule (MEDIUM-3) |
| Provisioning, step 2b failure and rollback | Byte-identical to `:363-365` when both deletes succeed; `rollback_failed` stamp (LOW-6) |
| Provisioning, `onStep('invite')` ordering | Email before the stamp: `invite_sent_at` keeps meaning "an email went out" on the success path |
| Lead import breaker | Trips only on a real Supabase 429 at the fallback; a Resend refusal alone does not trip it |

## 4. Regression surface (by grep)

`inviteUserByEmail`: `resend-invite.js:319`, `_provision_client.js:359`, `signup-client.js`, `stripe-webhook.js` (last two untouched). `isAccepted`: `resend-invite.js:86-88` moves to `_invite_link.js`. `_provision_client.js` consumers: `onboard-client.js` (reads `code` only, `:210-223`) and `explee-import-background.js` (reads `userId`, `inviteSent`, `code`, `stage`, `:1065-1131`). `generateLink` other caller: `affiliate-portal.js` through the shared fake's answer for other types. Tests pinning today's invite behaviour: `tests/resend_invite.test.js`, `tests/provision_client.test.js`, `tests/explee_import.test.js`, `tests/provision_locations.test.js`, `tests/refresh_cadence.test.js`. Manual look after the build: `PendingInvitesPanel.tsx` badge and Copy link field, `Onboard.tsx:730`, `:822`, the new `Invite.tsx`.

## 5. Data and claim integrity

- "7 days": `INVITE_LINK_DAYS = 7`, CHECK in 5.1; C-E4, C-I3, C-P7 (brandgeo branch) trace to it. C-O1 does not hold for the Admin access choice (LOW-9).
- "24 hours": the owner's statement of 86400 s, mirrored once as `SUPABASE_EMAIL_LINK_TTL_MINUTES`; C-P7 (supabase branch), C-P8 trace to it.
- "No Supabase token exists until Continue": false (LOW-3).
- "Resend kills the earlier link": false on the step 1 fallback (MEDIUM-2).
- Citations checked and true at the cited lines: `resend-invite.js:7-10`, `:52-58`, `:86-95`, `:242`, `:256`, `:315`, `:319`, `:327`, `:331-356`, `:339`, `:360-377`; `_provision_client.js:343-404`, `:501-504`; `explee-import-background.js:996-999`, `:1065-1068`, `:1099-1107`; `ResetPassword.tsx:67-70`, `:106-110`, `:164-198`, `:243-250`, `:326-341`; `authLinkState.ts:12`, `:19-20`, `:56-61`; `App.tsx:18`, `:279`; `PendingInvitesPanel.tsx:28-29`, `:78`, `:109-114`, `:141-146`, `:344`, `:377`; `fake_supabase_mem.js:466-486`; `affiliate_test_env.js:35`; `_prospect_guard.js:57`; `_auth.js` exports `corsHeaders` and `ALLOWED_ORIGINS`. `_email.js:14` is the sender constant, close enough for fact 16.

## 6. What was not checked

- No git, tsc, build, test run, browser or SQL: forbidden by this task.
- GoTrue's deployed version: the 422 error set of `generateLink` and its message texts (LOW-1); the security review read `master` only.
- PostgREST's code for a missing table on this project (LOW-2).
- Resend: tracking settings, key scope, the exact refusal messages (LOW-10).
- `netlify.toml` (headers, CSP) and `App.tsx:219`, `:296` were not re-read; taken from the earlier reviews.
- `db/supabase-client-locations-2026-11-13.sql:1-56` (the header style the migration copies) was not read.
- `tests/refresh_cadence.test.js` and most of `tests/explee_import.test.js` were read only by grep for invite assertions.
- Accessibility and copy quality of the new page and panel: out of this lens; the combined diff needs its own review (spec section 12 step 3).
