BLOCK: the spec is sound in shape, but it tells the owner to lower Email OTP expiration to 3600 s (which breaks the paid checkout invite) and it keeps the 60 minute display default that produced the false "Link expired"; both must be corrected in the spec before any build.

# Design review, delivery lens: invite links that last 7 days

Reviewer: bg-verify (read only). Date: 2026-11-13.
Subject: `docs/arch/invite-link-7-days.md` (SPEC, nothing built).
Lens: does it work, and does it break anything.
Binding fact from the owner, stated after the spec was written: the project's Supabase "Email OTP expiration" is ALREADY 86400 s (24 h). A Supabase invite link lives 24 h today. The "Link expired" badge two hours after a resend is a display error from `resend-invite.js:55-58` (default 60) and `PendingInvitesPanel.tsx:78` (`FALLBACK_TTL_MINUTES = 60`). The setting must not need to change. No step may ask the owner to paste or reveal a key or token.

## 0. Calibration

1. `git diff --stat`, `tsc`, `npm run build`: not run, by the hard rules of this task (memory pressure). Nothing is built, so there is no diff to review; this is a design review of one spec file plus the code it cites.
2. Secret scan: no diff exists. No secret file was opened. Environment variable NAMES only below.
3. Criteria: the spec's tests (section 10) are objectively checkable; its owner steps (section 12.4) are not exact enough (finding M5).
4. tsc and build baseline: not measured (not allowed); CLAUDE.md records `tsc` exit 0 and 65 of 65 node test files at `0ee54eb`.
5. Most sensitive new function: `invite-redeem.js` (public, mints a GoTrue token). Its guard is the 256 bit token plus the row binding of spec section 4 (`docs/arch/invite-link-7-days.md:82`); it has no JWT by design.
6. Write access used: this one file under `docs/qa/` only. No reviewed file was edited.

CALIBRATED (with steps 1 and 4 not run, by rule).

## 1. Findings, ranked

### B1. BLOCKER: the owner steps lower Email OTP expiration to 3600 s and shorten the paid checkout invite to one hour

Where: spec `:252` (order step 5), `:260` (rollback step 5), `:370` (owner step "read Email OTP expiration and set it to 3600 if it differs"), `:379` (Q2 default), and the premises at `:7`, `:42`, `:48`.

Scenario: the owner follows section 12.4 to the letter. The value differs (it is 86400), so he sets 3600. From that moment every invite that stays on the Supabase channel lives one hour instead of 24: `stripe-webhook.js:678` (a customer who just paid; the brief says this path must not be touched or degraded), `signup-client.js:120` (self-serve), every admin-role wizard invite, every fallback send of `deliverInvite` step 6, every password recovery email, and the "Send me a new link" that `ResetPassword.tsx:214` offers on its expired view. The minted token of `invite-redeem` also drops to one hour, which is harmless, but nothing in the design needs it. The owner has also ruled that the setting must not change.

Change to the spec:
- Delete order step (5) at `:252`, rollback item (5) at `:260`, the last clause of the owner step at `:370`, and row Q2 at `:379`.
- Replace with one sentence in section 7: "Email OTP expiration stays at 86400 s. The design does not depend on it, except the display constant of F1 below."
- Correct `:48`: the setting is already 86,400 s; the option is rejected because 24 h is not 7 days and raising past 86,400 s is discouraged and Management API only. Correct `:7` and `:42`: "Supabase's short lifetime" becomes "Supabase's 24 hour lifetime".
- Correct `:57-58`: the self-serve and paid paths keep a 24 hour link, not a short one.

### M1. MAJOR: the panel keeps the 60 minute default, so "Link expired" stays false for every Supabase-channel row

Where: spec `:143` and `:209` (`link_expires_at = invited_at + linkTtlMinutes()`); code `resend-invite.js:55-58` (default 60), header `resend-invite.js:7-10` ("about ONE HOUR"); `Onboard.tsx:822` comment.

Scenario: after the deploy and before the owner resends each row, all 19 pending rows are Supabase channel. Each reads "Link expired" one hour after `invited_at` while the real link lives 23 more hours: the exact defect the owner reported. The same lie stays permanent for every row that never gets a BrandGEO link: paid checkout customers (`stripe-webhook.js`), admin-role wizard invites, and every fallback send. The goal "the panel must show the real state" is not met for these rows.

Change to the spec:
- In `resend-invite.js`, replace the default 60 with a named constant `SUPABASE_EMAIL_LINK_TTL_MINUTES = 1440`; keep `INVITE_LINK_TTL_MINUTES` as an optional override. No owner step: the default is right without any variable.
- Say that this is an estimate clocked from `invited_at`; GoTrue clocks from `confirmation_sent_at`, which equals `invited_at` at an `inviteUserByEmail`.
- Rewrite the header comment `resend-invite.js:7-10` and the comment at `Onboard.tsx:822` to 24 hours for the Supabase channel and 7 days for the BrandGEO channel.
- Name the test changes as intended: `tests/resend_invite.test.js:208` and `:229` expect 1440, not 60.

### M2. MAJOR: the test plan says existing tests stay green; they cannot, and the race tests would silently stop testing the V1 "ours" rule

Where: spec `:319` ("Existing sections 1 to 8 stay green"), `:323` (fake `generateLink`, other suites "may be edited only to set up the fake").

Evidence:
- `tests/resend_invite.test.js:212` pins the exact key set of a list row (the spec adds `link_channel`, `link_expires_at`, `link_last_opened_at`); `:301` pins the exact audit `meta` (the spec adds `channel`, `delivery`, `invite_link_id`); `:208` and `:229` pin 60 (M1).
- `tests/helpers/affiliate_test_env.js:35` deletes `RESEND_API_KEY`, so in every test file the BrandGEO channel falls to `deliverInvite` step 6. With the channel on by default, every viewer provisioning test runs `generateLink`, then the fallback `inviteUserByEmail` on the user that `generateLink` just created.
- `tests/helpers/fake_supabase_mem.js:466-470`: the fake `generateLink` ignores `authBehaviour`; only `inviteUserByEmail` (`:471-486`) runs `beforeInvite` and `invite`. With `inviteResendsPending` false (the default), the fallback calls `createUser` for an address that exists and answers "already been registered", so `deliverInvite` returns `invite_error` and the provisioning rolls back. `tests/provision_client.test.js:218`, `tests/explee_import.test.js:380`, `tests/provision_locations.test.js:108` would go red.
- The race tests inject a competing user at the invite call: `tests/provision_client.test.js:91-99`, `:446-456`, `:505`, `:510`; `tests/explee_import.test.js:427`, `:491`, `:510`, `:1292-1363`. On the new branch their hooks would fire at the fallback, after the user already exists, so they would no longer test the V1 rule (`_provision_client.js:373-385`) at the call that creates the user. That rule decides whether the lead import binds or deletes somebody else's login.
- `tests/provision_client.test.js:516-524` locates `inviteUserByEmail(`; on the new branch the user is created by `generateLink(`.

Change to the spec:
- The fake `generateLink({ type: 'invite' })` must run the same `authBehaviour.beforeInvite` and `authBehaviour.invite` hooks before it creates or returns the user, honour `stampCreatedAt`, and treat an existing unconfirmed user like `inviteResendsPending` does.
- Every existing suite that provisions (`provision_client`, `provision_locations`, `explee_import`, `refresh_cadence`) runs twice: once with `INVITE_LINK_CHANNEL=supabase`, which pins today's path byte for byte, and once with the channel on and `sendBrandedEmail` stubbed through the require cache to `{ ok: true }`, which pins the new path. The race tests must pass on both.
- List the assertions that change on purpose: `resend_invite.test.js:208`, `:212`, `:229`, `:301`; `provision_client.test.js:516-524` (accept `generateLink(` or `inviteUserByEmail(` after Check B).

### M3. MEDIUM: the "wrong deploy order is today's behaviour" claim is not true for provisioning

Where: spec `:220-221`, `:255-256`; `deliverInvite` steps 2, 3 and 6 at `:182-186`.

Scenario: the code is pushed before the migration, or `RESEND_API_KEY` is absent. The wizard or the lead import calls `generateLink` (creates the user, stamps `confirmation_sent_at`), the table write or the send fails, and then `inviteUserByEmail` runs on the same user about a second later. That is two GoTrue calls in sequence, not today's single call, and the sequence has never run in production. If GoTrue applies a resend frequency guard to that second call (not verified either way; GoTrue was not re-read for this review), it answers 429. `isRateLimit` maps that to `email_rate_limited`; the lead import then pauses itself for an hour (`explee-import-background.js:1099-1107`) and the wizard shows a Supabase rate-limit sentence for a missing table.

Change to the spec: decide the channel BEFORE the user exists. Step 2 uses `generateLink` only when all of these hold: `role === 'viewer'`, `channelEnabled()`, `process.env.RESEND_API_KEY` is set, and a read of `client_invite_links` (`select id ... limit 0`) succeeds. Otherwise run today's `inviteUserByEmail` line unchanged. Then only a live Resend refusal can reach the two-call sequence. List it under "Untested" in section 10.

### M4. MEDIUM: the Resend call has no timeout, and it now sits before the profile insert

Where: `_email.js:222-227` (`fetch` with no abort); spec `:185` and `:221`.

Scenario: Resend hangs. `onboard-client` and `resend-invite` are killed at 26 s (`netlify.toml:140-141`, `:171-172`). In the wizard, the client and the auth user exist with no profile. A retry hits Check B and gets "already has an account" (`_provision_client.js:352-355`), so the admin cannot finish and must clean up by hand. In `resend-invite`, the row is active and nobody knows whether the email went.

Change to the spec: `deliverInvite` races `sendBrandedEmail` against an 8 s timer (no edit to `_email.js`). A timeout is a send failure: revoke `send_failed`, then fall back, accepting a possible duplicate email. Add this as test 11 of `tests/invite_link.test.js`.

### M5. MEDIUM: the owner steps are not exact enough to follow without help

Where: spec `:370`.

Gaps:
- "Onboard ... to an address you control". The wizard's step 6 starts a collection at once (`Onboard.tsx:786-804`), which spends engine budget and leaves a real client behind. The spec has no clean-up step.
- The live check does not say to use a private window. `verifyOtp` signs the browser in as the invited viewer, which replaces the admin session in that browser. The next step ("confirm the panel row reads accepted") then needs the admin session back.
- "push with BATCH_PUSH=1" is not a command he can paste.
- "confirm `RESEND_API_KEY` is set for Functions in Netlify" does not say where to look.

Change to the spec: replace the live check with numbered steps:
1. In the admin browser, open Onboard: plan Free, one prompt, access Viewer. Use an address on the project's own domain that he reads, written in the spec as a placeholder such as `invite-test@example.com`.
2. Open the email in a private window, press Continue, set a password, and see "Password saved".
3. Back in the admin window, reload Pending invites: the row has left the pending list, or reads accepted.
4. In the private window, open the same email link again: it reads "This invite was already used".
5. Delete the test client with Account, Delete account.

Push: `$env:BATCH_PUSH=1; git push` from `C:\Users\const\Constantin Daniel Goane\BrandGEO`. Variable: Netlify, Site configuration, Environment variables, confirm that `RESEND_API_KEY` exists and that its scopes include Functions, without opening its value.

### L1. LOW: section 8 says the existing Supabase links are dead

Where: spec `:264-266`.
With 24 h links, every row resent in the last 24 h has a live Supabase link. A BrandGEO resend does not revoke it, so the person holds two working links until either is used. This is harmless: after acceptance, both answer "used" or expired. Change: correct the sentence, and say that both links stay live until either is used.

### L2. LOW: superseding before sending loses a good 7 day link when Resend fails on a resend

Where: spec `:182-185`.
Scenario: a lead holds a valid BrandGEO link, the admin presses Resend, and Resend refuses. The old row is already `superseded`, the new row becomes `send_failed`, and the fallback Supabase email lives 24 h. The 7 day link the lead had now answers "A newer invite was sent".
Change: when step 5 fails, also clear `revoked_at` and `revoked_reason` on the row this call superseded, if it has not expired. The new row is revoked, so the one-active index allows it. Add a test.

### L3. LOW: on the new branch, the "not ours" result claims an email that was never sent

Where: `_provision_client.js:378-385` (`inviteSent: true`), consumed at `explee-import-background.js:1070-1084`.
Scenario: inside the race window between Check B and the call, `generateLink` returns an existing unconfirmed user. Today `inviteUserByEmail` re-sends that person a working invite, which is why the result says `inviteSent`. `generateLink` sends nothing and regenerates that person's confirmation token, so a live Supabase email link of theirs dies silently. The import still stamps `invite_sent_at` and stops creation for the run.
Change: on the `generateLink` branch, a "not ours" user gets one `inviteUserByEmail(contact)`. That is today's exact side effect, so `inviteSent: true` stays true and the person's link is restored. Add the case to the race tests of M2.

### L4. LOW: a failed link-row read in the list shows 7 day links as expired

Where: spec `:209` ("If that read errors, every row is 'supabase'").
With F1 fixed, a BrandGEO row older than 24 h would read "Link expired" during a transient read error. Change: on that error, send `link_channel: 'unknown'` and `link_expires_at: null`, so the badge reads "Link state unknown".

### L5. LOW: `created_at` and `expires_at` come from two clocks

Where: spec `:111-112`, test 3 at `:308` ("exactly 7 days").
`created_at` defaults to the database `now()` and `expires_at` comes from the function clock, so the exact assertion holds only in the fake. Change: insert `created_at` and `expires_at` from the same `now()` in `_invite_link.js`.

### L6. LOW: the "used" copy assumes the person has a password

Where: spec `:285` (C-I5).
A person whose `verifyOtp` succeeded but who closed the tab before `updateUser`, or whose old Supabase link was consumed by a mail scanner's GET, is "accepted" (`resend-invite.js:86-88`) and has no password. "Sign in with your email and password" is a dead end for them. Change C-I5 to: "If you never chose a password, use Forgot your password." C-I7 already provides the link.

### L7. LOW: the "Opened" note counts scanner presses

Where: spec `:243`, `:292`.
`redeem_count` and `last_redeemed_at` move on any Continue press, including a scripted scanner's. Change the label to "Continue pressed {age}" (copy slot C-P3), or drop it.

### L8. LOW: the token regex lives in two places with no pin test

Where: spec `:155` (`_invite_link.js`) and `:229` (`src/lib/inviteLink.ts`).
The bundler rule (`tests/ts_require_bundler.test.js`) forbids sharing the file, which is correct, but the project pins mirrors elsewhere (`tests/market_regions_mirror.test.js`). Change: `tests/invite_link_client.test.js` reads both sources and asserts that the two regex literals are equal.

### L9. LOW: after a rollback by `drop table`, sent links retry forever

Where: spec `:135`, `:202`, `:237`.
A lookup error is 503 `unavailable`, and the page stays on "Something went wrong. Please try again." with no way forward. Change: map Postgres `42P01` (undefined table) to 404 `invalid`, whose copy C-I2 tells the person to ask for a new link.

### L10. LOW: `hashIp` has no named source

Where: spec `:86`.
The only `hashIp` is `_prospect_guard.js:57-61`. It falls back to a development pepper when `IP_HASH_PEPPER` is unset, which keeps working. Change: name `require('./_prospect_guard').hashIp` in section 6.2.

### Info

- I1. Spec `:80` says the token is never in a log. Resend keeps the sent HTML in its own message log, which contains the 7 day link. Today's Supabase invite has the same exposure if Supabase's SMTP is Resend (`signup-client.js:31-32` says it is). State it as a known exposure.
- I2. After Continue, `/reset-password?token_hash=...` sits in the history entry until `ResetPassword.tsx:58` strips it, so a browser's history database may record it. The token is single use and lives 24 h, not "minutes" (spec `:379`). The Sentry scrub drops queries and breadcrumbs (`src/lib/observability.ts:63-65`, `:96`). Accept, and state the 24 h lifetime.
- I3. `/invite` needs no `netlify.toml` change: the `/*` fallback serves it (`netlify.toml:123-126`). Without the new route, the catch-all at `App.tsx:315` would send the link to `/` and on to login, but the SPA and the function ship in one atomic deploy, so no such window exists.
- I4. `invite-redeem` keeps the 10 s default timeout. Seven sequential Supabase calls fit. A timeout returns a non-JSON 502, which the page treats as a network failure with a working retry. Acceptable.
- I5. An admin tab opened before the deploy runs the old badge logic against the new list. Hard reload (Ctrl+Shift+R) after the deploy, as CLAUDE.md already says.
- I6. Spec `:337` ("removes the burst limit") depends on the Resend plan's quotas. When Resend refuses, the fallback degrades to today's behaviour, which is safe.
- I7. Bundler rule: `_invite_link.js` requires only `crypto` and `_email.js`, both plain JavaScript, and it is loaded by `resend-invite.js` and `onboard-client.js` (default bundler) and by `explee-import-background.js` (esbuild). Satisfied as specified.

## 2. Scenario trace

| Scenario | Result under the spec as written | With the changes above |
|---|---|---|
| `resend-invite.js` resend of a pending viewer | BrandGEO 7 day email; fallback Supabase 24 h | same, plus L2 restores the old link on a failed send |
| `_provision_client.js`, wizard viewer | `generateLink`, then BrandGEO email before `onStep('invite')` | same; M3 routes deterministic failures to today's line |
| `_provision_client.js`, wizard admin role | Supabase invite, unchanged | unchanged |
| Lead import (`explee-import-background.js`) | as the wizard; stamps and breaker unchanged for real failures | M3 stops a false breaker trip; L3 keeps `inviteSent` truthful |
| `signup-client.js` | unchanged, 24 h Supabase link | unchanged; B1 keeps it at 24 h |
| `stripe-webhook.js` paid checkout | unchanged code, but 1 h after owner step 5 | 24 h, step deleted (B1) |
| 19 existing pending | panel still shows "expired" after 1 h | panel shows the 24 h estimate (M1); Resend gives 7 days |
| Click on day 6 | redeem mints a fresh 24 h token; form works | same |
| Click twice, one device | second press mints again; the first token dies, unused | same |
| Two devices | the first device's Save lands on ResetPassword's expired view, whose recovery email works | same; document it |
| Invite was resent | old link answers 410 "replaced" | same |
| Already set a password | 410 "used" | same; L6 copy for no-password |
| Push before migration | wizard and import do two GoTrue calls (M3) | today's exact line |
| Migration before push | table unused | same |
| Supabase down at click | 503, retry kept | same |
| Resend down at send | fallback Supabase email | same, bounded by M4's timeout |
| `RESEND_API_KEY` missing | fallback, two GoTrue calls in provisioning (M3) | today's line |
| `INVITE_LINK_CHANNEL=supabase` | today's behaviour; needs a redeploy (Netlify, Deploys, Trigger deploy, one build) | same; state the build cost |
| `.ts` require rule | satisfied | satisfied |
| `netlify.toml` rewrite | none needed | none needed |
| ResetPassword stages | unchanged; `checking` is never reached from `/invite` | unchanged |

## 3. Regression surface (found by grep)

- `inviteUserByEmail` callers: `resend-invite.js:319`, `_provision_client.js:359`, `signup-client.js:120`, `stripe-webhook.js:678`. `generateLink`: `affiliate-portal.js:193`, whose fake answer at `fake_supabase_mem.js:466-470` the affiliate tests depend on (the spec keeps it for other types).
- `_provision_client.js` is required by `onboard-client.js:67` and `explee-import-background.js:36`; `stripe-webhook.js` does not require it (its requires are at `:56-73`).
- Tests pinning today's behaviour: `tests/resend_invite.test.js` (`:208`, `:212`, `:229`, `:301`, race sections near `:364-380`), `tests/provision_client.test.js` (`:91-99`, `:218`, `:446-456`, `:505-524`), `tests/explee_import.test.js` (`:83-88`, `:380`, `:427-445`, `:491`, `:510`, `:1292-1363`), `tests/provision_locations.test.js` (`:69`, `:108`), `tests/refresh_cadence.test.js` (provisions through the fake), `tests/ts_require_bundler.test.js`, and the affiliate suites through the shared fake.
- Manual look needed: `src/pages/Onboard.tsx:115-136` (the legacy `{ email }` resend now goes through `deliverInvite`) and `:822`; `src/components/PendingInvitesPanel.tsx:78`, `:107-146`.

## 4. Data and claim integrity

- "Email OTP expiration ... default 3600" and "Q2 may have been raised": superseded by the owner's binding statement of 86400 s. Every one-hour premise is listed in B1 and M1.
- "C-E4 This link works for 7 days" and "C-I3 Invite links work for 7 days" trace to `INVITE_LINK_DAYS = 7` and the CHECK at spec `:112`. Consistent.
- "C-P7 resend success: The link works for 7 days" is false when the resend fell back to the Supabase channel. The copy must branch on `channel` (24 hours for `supabase`).

## 5. What was not checked

- GoTrue source and live behaviour: whether `generateLink('invite')` stamps `invited_at`, whether a resend frequency guard applies to `inviteUserByEmail` right after `generateLink` (M3), and the exact 422 text. Taken from the spec's research summary.
- The live Email OTP value: the owner's statement is taken as binding and was not read.
- Resend: click tracking, plan quotas, message-log retention.
- Whether the Supabase invite template uses `{{ .ConfirmationURL }}` or `token_hash`. It does not change any finding.
- The other lenses of this spec (security), and `docs/qa/pending-invites-review-2026-11-13.md` beyond the L1 and L2 that the spec quotes.
- Every line of `tests/explee_import.test.js` and `tests/refresh_cadence.test.js`: only the invite-related assertions were read.
- No git, tsc, build, test run, browser or SQL: forbidden by this task.
