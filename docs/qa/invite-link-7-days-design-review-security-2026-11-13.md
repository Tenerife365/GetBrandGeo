BLOCK (design review, security and abuse lens). Lifts when the spec is amended for MAJOR-1; no re-architecture needed. The core design (own 256 bit token in the fragment, press-to-mint, mint never creates or confirms an account, viewer-only channel) holds up under attack.

# Invite links that last 7 days: design review, security lens

Reviewer: bg-verify (Opus), read-only. Date: 2026-11-13.
Subject: `docs/arch/invite-link-7-days.md` (spec, nothing built).
Binding owner fact received after the spec was written: the project's Supabase "Email OTP expiration" is ALREADY 86400 s (24 h). A real Supabase invite link lives 24 hours today. "Link expired" two hours after a resend is a display error from `resend-invite.js:55-58` (`linkTtlMinutes()` falls back to 60) and `PendingInvitesPanel.tsx:78`, `:344`, `:377` (`FALLBACK_TTL_MINUTES = 60`). The Supabase setting must not need to change, and no step may ask the owner for a key or token.

Method: read the spec in full and the code it cites (`resend-invite.js`, `_provision_client.js:343-404`, `ResetPassword.tsx`, `authLinkState.ts`, `_email.js:211-242`, `_auth.js:21-42`, `_prospect_guard.js:57-61`, `client-api-keys.js:38-39`, `:101-110`, the `affiliate_rate_check` definition in `db/supabase-affiliate-migration-2026-09-12.sql:560-575` and its prune in `db/supabase-affiliate-cron-2026-09-12.sql:43`, `netlify.toml:28-33`). Checked the Supabase claims against the GoTrue source (`supabase/auth`, `internal/api/mail.go`, functions `adminGenerateLink` and `sendInvite`) and the Supabase docs page `guides/auth/auth-email-passwordless`. No git, tsc, build, server or browser was run.

## 1. Findings, ranked

### MAJOR-1. The spec tells the owner to lower the Supabase setting to 3600 s, which contradicts the binding owner fact and would cut paying customers' invite links from 24 h to 1 h

Where: spec section 7 step (5) (line 252), section 12 step 4 last clause (line 370), Q2 (line 379); the premises at line 7 ("keeps Supabase's short lifetime"), section 2 table row 1 (line 48, written as if 86400 were not the current value), section 3 step 4 and 5.2 ("Email OTP expiration", implied short), section 8 (line 266, "Their Supabase links are dead").

Scenario: the owner follows section 12 step 4 and sets Email OTP expiration to 3600. `signup-client.js` and `stripe-webhook.js` stay on the Supabase channel by design (section 2), so every self-serve and every PAYING customer's invite link drops from 24 h to 1 h. The same applies to every fallback send (table missing, Resend down, kill switch). This recreates, for the customers who just paid, exactly the defect the owner asked to fix, and it is the same class of silent activation break that already shipped once. It also breaks the owner's binding constraint that the setting must not need to change.

Also wrong as a consequence: section 8 says the 19 pending invites' Supabase links "are dead". Any invite sent or resent in the last 24 h (the owner resent them two hours before the request) is still live, which matters for MEDIUM-1 below.

Change to the spec:
- Delete section 7 step (5), the last clause of section 12 step 4, and the default of Q2. Replace Q2 with: "Email OTP expiration is 86400 s (owner, 2026-11-13). Not changed by this work."
- Rewrite line 7: "Every other email link keeps the project's Supabase lifetime (24 h today)."
- Section 2 table row 1: "Already 86400 s; the documented ceiling for the dashboard. 7 days would need the Management API and would stretch reset and magic links too."
- Section 3 and 5.2: the minted token lives 24 h until used or replaced, not "short".
- Section 8: "Links sent in the last 24 hours still work; Resend replaces them with a 7 day link" (and see MEDIUM-1 for what Resend must do to the old one).

### MEDIUM-1. Resend and Copy link do not revoke the earlier Supabase invite link, contrary to section 4 and copy C-P5

Where: spec section 4 "Active tokens" (line 83: "Every issue supersedes the previous one, so Resend (or Copy link) kills the old link"), copy C-P5 (line 294), 6.1 `deliverInvite` steps 2 to 5 (no GoTrue call on the BrandGEO path).

Scenario: a lead writes "I forwarded your invite to a colleague by mistake". The admin presses Copy link (or Resend) believing the old link is now dead, as C-P5 tells him. The forwarded email is a Supabase invite sent within the last 24 h; `deliverInvite` only revokes rows in `client_invite_links` and never touches GoTrue, so the user's `confirmation_token` is unchanged. The colleague opens the forwarded link, sets a password, and holds the login. On rollout day this is the normal case: all 19 pending users were resent Supabase links hours earlier, and those stay valid beside the new 7 day link.

Verified in GoTrue `mail.go` `adminGenerateLink`, invite branch, existing unconfirmed user: it overwrites `confirmation_token`, `confirmation_sent_at`, `invited_at` and creates a new one-time token, sends no email and has no limiter. That is the revocation primitive.

Change to the spec: in `deliverInvite`, on the BrandGEO path, after the row insert and before the email or the copy return, call `generateLink({ type: 'invite', email: user.email })` and discard everything it returns (never log `data`). This rotates the Supabase token, killing any earlier Supabase invite link and any earlier minted token. Guards: skip it in `_provision_client.js` (generateLink has just run there); if it answers 422 treat the user as accepted (revoke our new row, answer `already_accepted`); if the returned user id differs from `user.id`, apply the section 4 race guard; on any other error log it and continue, returning `previous_link_revoked: false` in the result so the panel can say "The previous email link may still work for up to 24 hours". Add a test: after Resend, the fake's earlier `confirmation_token` for that user no longer verifies. Correct line 83 and C-P5 to describe exactly this.

### MEDIUM-2. No way to stop redemption or revoke all live links during an incident

Where: spec section 4 "Kill switch" (line 91: "Redeem keeps serving links already sent"), 5.1 `revoked_reason` check (`'superseded','send_failed'` only), Q5 (no revoke action).

Scenario: the Resend account or its full-access key leaks (LOW-4), or a batch of invite emails went to a wrong list. Every unaccepted link is a 7 day bearer credential to a viewer login. The kill switch only changes how NEW invites are sent; redeem keeps minting for the leaked ones. The only revocation per user is Resend, which emails a NEW bearer link, or deleting the login. There is no bulk path, and a manual SQL revoke would have to mislabel rows `superseded`, telling the attacker "A newer invite was sent".

Change to the spec:
- Add env `INVITE_REDEEM_DISABLED`: when `1`, `invite-redeem` answers 503 `unavailable` after the shape check, before any table read. Document it next to `INVITE_LINK_CHANNEL`.
- Allow `revoked_reason` value `'revoked'` in the 5.1 check; redeem maps it to 404 `invalid`.
- Add a runbook line to the migration header: `update public.client_invite_links set revoked_at = now(), revoked_reason = 'revoked' where revoked_at is null and accepted_at is null;` (owner runs it in the SQL Editor; no key involved), followed by MEDIUM-1's rotation for each affected user if Supabase links may also have leaked.

### MEDIUM-3. The panel still shows a false "Link expired" for every Supabase-channel row

Where: spec 6.3 (line 209: Supabase rows get `link_expires_at = invited_at + linkTtlMinutes()`), section 1 fact 2, `resend-invite.js:55-58` default 60.

Scenario: viewers created by `stripe-webhook.js` and `signup-client.js`, and every fallback send, are Supabase-channel rows. With the default kept at 60, the panel marks their 24 h link expired after one hour, which is the display error the owner reported. The owner then resends links that work, or tells a paying customer the link is dead. The goal states the panel must show the real state.

Change to the spec: default `linkTtlMinutes()` to 1440, with a comment naming the owner's statement of 2026-11-13 and stating that nothing reads the real value (reading it needs the Management API and a token, which this work must not ask for). Keep the env override. Test: with the env unset, a Supabase row invited 2 h ago reads valid and one invited 25 h ago reads expired. Also, per GoTrue, every redeem mint moves `invited_at`: for a row whose BrandGEO link expired and that the owner has not resent, `link_expires_at` must stay the BrandGEO row's `expires_at` (the active-row rule already does this; state it so nobody "simplifies" it to `invited_at`).

### LOW-1. The fresh Supabase token can reach a server Referer header, and it lives 24 h, not minutes

Where: spec section 3 step 4 (line 68: "the fresh token reaches no server log and no Referer").

Scenario: `Invite.tsx` calls `navigate('/reset-password?token_hash=...')`. `ResetPassword` is a lazy route (`App.tsx`), so on a first visit React fetches its chunk AFTER the history change; the document URL now carries the query, and `strict-origin-when-cross-origin` (`netlify.toml:33`) sends the FULL URL as Referer on same-origin requests. The token_hash therefore travels to Netlify's edge in the chunk request. With the 24 h setting the token stays usable until verified or rotated.

Change: `Invite.tsx` awaits `import('./ResetPassword')` before calling `navigate` (prefetch on mount is better: start it in a `useEffect`, await it in the Continue handler). Correct the sentence at line 68. Add the 24 h lifetime to 5.2.

### LOW-2. The redeem response and logs must whitelist fields; the spec does not name the two dangerous ones

Where: spec 6.2 and section 4 "Logging".

Scenario: per GoTrue `adminGenerateLink`, the response carries `properties.action_link` (a working verify URL holding the token) and `properties.email_otp` (a 6 digit code that, with the stored email, verifies for 24 h), plus the user object with the email. A builder who returns `data.properties` or logs `data` on an unexpected `verification_type` leaks a working credential into the browser or the function logs.

Change: state in 6.2 that the 200 body is built from exactly `{ ok: true, token_hash, type }`, and that neither `data`, `properties`, `action_link`, `email_otp` nor the user object is ever logged or returned, including in the 503 branch. Test: the 200 body's keys equal that set exactly, and captured logs contain neither the fake's `action_link` nor its `email_otp`.

### LOW-3. Race: a redeem can mint after a concurrent supersede or revoke

Where: spec 6.2 check order (row state is read before `generateLink`, and the 200 update is unconditional).

Scenario: an attacker holding a leaked link presses Continue at the moment the admin presses Resend to cut it off. Redeem read the row as active, the admin's supersede commits, then redeem mints and returns a fresh Supabase token. The window is milliseconds, and MEDIUM-1's rotation narrows it further only if it runs after the mint.

Change: make the post-mint update conditional: `update ... set last_redeemed_at = now(), redeem_count = redeem_count + 1 where id = ? and revoked_at is null and accepted_at is null returning id`. Zero rows: call `generateLink` once more and discard it (rotates away the token just minted), answer 410 `replaced` (or 404 for `revoked`). Test it with the fake.

### LOW-4. The 7 day token is stored at Resend and readable with a full-access key

Where: spec 6.1 step 5, section 4 "Storage" ("The token exists in the email and ... one admin response").

Scenario: Resend keeps each sent email's HTML, and its retrieve-email API returns it to any full-access API key. Anyone holding such a key (Netlify Functions env, and CLAUDE.md records a `resend_api_key` in the Supabase Vault for the watchdog) can read every unaccepted invite link and set the password on those viewer logins for 7 days. The old Supabase email exposed nothing comparable.

Change: section 4 "Storage" names Resend as a third holder. Section 12 step 4 adds an owner check, by looking only, never by pasting: in the Resend dashboard, confirm the key used by Netlify Functions has "Sending access" rather than "Full access"; if it is full access, create a sending-only key and swap it in Netlify himself. Combined with MEDIUM-2 this gives a recovery path if the account leaks.

### LOW-5. Click tracking and the query fallback can put the 7 day token in third-party and edge logs

Where: spec section 3 step 2 (query `t` as second source), Q3 (line 380, "Assume off").

Scenario: if click tracking is enabled on the sending domain, Resend rewrites the CTA through its tracking host, and the token (fragment included) sits in Resend's redirect URL and logs. If a rewriter moves the token into the query, the GET of `/invite?t=...` and the Referer of the lazy `Invite` chunk request (same origin, full URL) carry the 7 day token to Netlify's edge.

Change: make Q3 a precondition in section 12 step 4 (owner confirms click and open tracking are OFF for the sending domain in the Resend dashboard). Drop the query fallback from `parseInviteToken`, or keep it only if the page then shows a stage that tells the person to ask for a new link without redeeming. The fragment is the only channel this spec should accept.

### LOW-6. "What a stolen link allows" understates the outcome

Where: spec section 4 (line 84).

Scenario: a forwarded or stolen link lets its holder set the password once. The resulting session does not end when the 7 days end or when the real person later uses "Forgot password" (password change does not sign out other sessions), and a viewer can create MCP API keys for its own client (`client-api-keys.js:38-39`, `:101`), which survive a password reset. So the window bounds when the link can be used, not how long the access lasts.

Change: rewrite the row as "Setting the password of that one viewer login once, until the first of acceptance, 7 days, a newer issue. Access obtained that way persists (sessions, MCP keys) until an admin deletes the login or revokes its keys." Add one line to the section 8 guidance: if a link went to the wrong person and was used, delete and re-onboard the login. Same exposure as the 24 h Supabase link today, longer window.

### LOW-7. Read-back R5 checks only SELECT

Where: spec 5.1 R5.

Scenario: Supabase's default privileges grant table and sequence rights to `anon` and `authenticated` at create time. RLS with no policy blocks rows, but a missed `revoke` on INSERT or UPDATE, or on the identity sequence, would not show in R5.

Change: R5 also asserts `has_table_privilege` false for `insert`, `update`, `delete` for both roles, and adds `select has_sequence_privilege('anon', pg_get_serial_sequence('public.client_invite_links','id'), 'usage'), has_sequence_privilege('authenticated', pg_get_serial_sequence('public.client_invite_links','id'), 'usage');` EXPECT false, false (revoke on the sequence in the migration).

### INFO

- I1, Supabase claims verified. GoTrue `adminGenerateLink` (invite): confirmed user returns 422 `email_exists` ("already been registered", matched by the spec's regex); existing unconfirmed user gets a new `confirmation_token`, `confirmation_sent_at`, `invited_at` and a one-time token, and `params.Data` is NOT applied; unknown address creates a user; no email is sent and no limiter applies; `VerificationType` echoes the requested type. GoTrue `sendInvite` has no per-user frequency check, so the fallback `inviteUserByEmail` seconds after a `generateLink` in `_provision_client.js` will not hit a 60 s limit (only the global email limiter). Supabase docs: one "Email OTP expiration" setting governs confirmation, recovery, email change and invitation links; above 86400 s is strongly discouraged and only settable through the Management API. All as the spec states. Two corrections: `generateLink` invite DOES stamp `invited_at` on a new user (the "not byte-verified" note in 6.3 can go; the extra rule is harmless); and the spec cites a "research brief of 2026-11-13" that is not on disk, so cite the source file and the docs URL instead.
- I2, rate limiter: fail-open is acceptable because the security rests on 256 bit entropy; `hashIp` prefers `x-nf-client-connection-ip`, set by Netlify (`_prospect_guard.js:58`); the counters table is pruned daily. The key `invite:tok:<token_hash>` does put the token hash in `affiliate_rate_limits`, which admins can read, contradicting "never in a table". Harmless (a preimage is needed); reword section 4 or key on the first 16 hex chars.
- I3, enumeration: none. Redeem takes no email; the only address-taking path (`resend-invite.js` legacy `{ email }`) is admin only. 404 versus 410 is only reachable with a real token.
- I4, active account takeover: not possible through redeem. `isAccepted` is re-read from GoTrue on every redeem, and GoTrue refuses `generateLink('invite')` for a confirmed user. Recovery links and Google sign-in both confirm the user, so they also end the invite.
- I5, scanners: a GET of `/invite` mints nothing. A detonating scanner that presses Continue mints a token it never uses and sets a misleading "Opened" note in the panel; label it "Continue pressed" or accept it. Net improvement over today: no Supabase token (and no 6 digit `email_otp`) exists until someone presses Continue.
- I6, browser history: the visit to `/invite#t=...` is recorded in history before `replaceState`; inherent to any emailed link, bounded by acceptance and 7 days.
- I7, open redirect: none; the navigate target is a fixed path. `Invite.tsx` should still check `type` is `invite` or `signup` before building the URL.
- I8, Copy link response: add `Cache-Control: no-store` to the `resend-invite` 200 when `delivery = 'copy'`.
- I9, fallback with the migration missing: verified safe. Step 2 errors, `inviteUserByEmail` re-sends to the existing unconfirmed user (no frequency refusal, see I1). Redeem answers 503 with the table missing.
- I10, new table exposure: RLS on, no policy, revokes from `anon` and `authenticated`: a viewer or an anonymous caller reads nothing (subject to LOW-7).

## 2. Acceptance criteria of this review

| Criterion (task lens) | Result | Evidence |
|---|---|---|
| Token theft and replay | Findings | LOW-1, LOW-2, LOW-4, LOW-5 |
| Link forwarded to a colleague | Finding | MEDIUM-1, LOW-6 |
| Scanner or link preview | Pass | Spec 3.2, I5 |
| Enumeration of who has an account | Pass | I3 |
| Takeover of an active account | Pass | I4; GoTrue 422 branch |
| Takeover through a superseded or revoked token | Finding | MEDIUM-1, LOW-3 |
| Race between two clicks or click and resend | Finding | LOW-3; two clicks only cost the first tab its token (GoTrue overwrites `confirmation_token`) |
| Unlimited minting through the public endpoint | Pass | Needs a real token; per-token limit 10/h; fail-open acceptable (I2) |
| Open redirect | Pass | I7 |
| Leakage through logs, Referer, history, admin panel | Findings | LOW-1, LOW-2, LOW-5, I6, I8 |
| What a viewer or anonymous caller can read | Pass, one check to add | I10, LOW-7 |
| Fallback when the migration is missing | Pass | I9 |
| 7 day token versus intended credential strength | Finding | LOW-6, MEDIUM-2 |
| Supabase claims against the cited docs | Pass with corrections | I1; the brief is not on disk |
| Spec consistent with the owner's 24 h fact | FAIL | MAJOR-1, MEDIUM-3 |

## 3. Regression surface (design level, by grep)

`inviteUserByEmail` callers: `resend-invite.js:319`, `_provision_client.js:359`, `signup-client.js`, `stripe-webhook.js` (the last two untouched by the spec, which is why MAJOR-1 matters). `isAccepted` moves out of `resend-invite.js:86-88`. `_provision_client.js` is loaded by `onboard-client.js` and the esbuild-bundled `explee-import-background.js`. `ResetPassword.tsx` and `authLinkState.ts` are reused unchanged. `affiliate_rate_check` is shared with the affiliate and MCP endpoints.

## 4. What was not checked

- Real GoTrue behaviour on this project (versions differ from `master`); the source was read on `master`, not the deployed version.
- Whether the project uses Supabase's built-in mailer or custom SMTP (affects the global email limiter on fallback).
- Resend's actual settings: click tracking, key scope, and retention of email bodies were not read from the account.
- Whether Netlify keeps request or Referer logs on this plan.
- Whether `x-nf-client-connection-ip` can be supplied by a client (relied on as set by Netlify).
- Browser behaviour of `replaceState` in history databases and sync.
- The CSP line in `netlify.toml` was not read in full.
- No code exists yet; this is a design review only. The combined diff needs its own review (spec section 12 step 3).
- Accessibility, copy quality and data integrity lanes were out of this lens.
