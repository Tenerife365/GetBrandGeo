# Invite links that last 7 days

Status: SPEC, written 2026-11-13 by bg-architect, AMENDED the same day after two bg-verify design reviews (`docs/qa/invite-link-7-days-design-review-security-2026-11-13.md`, BLOCK; `docs/qa/invite-link-7-days-design-review-delivery-2026-11-13.md`, BLOCK). Every BLOCKER, MAJOR and MEDIUM of both is closed in this text; rejected items are listed in section 14. AMENDED a second time the same day after the bg-verify re-read (`docs/qa/invite-link-7-days-design-rereview-2026-11-13.md`): M1 to M4 closed in sections 0, 3, 4, 6.1, 6.4 and 10. Nothing built.
Owner's request, 2026-11-13: "we need to fix the link expire time, it needs to last 7 days, its way to short".
Binding owner fact, 2026-11-13, stated after the first draft: the project's Supabase "Email OTP expiration" is ALREADY 86400 s (24 hours). It must not change. No step may ask the owner to paste or reveal a key or a token.
Binding on: bg-backend (Opus), bg-app (Sonnet).

Requirement: a person who receives an invite email can use the link in it for 7 days, and the admin panel shows the real state of that link. Every other email link (password reset, magic link, email change, confirmation) keeps the project's Supabase lifetime, 24 hours today, untouched.

---

## 0. For the owner

**What you get.**
- Invites for viewer logins sent from the Pending invites panel (Resend), the Onboard wizard and the lead import carry a link that works for 7 days. That email now comes from BrandGEO's own sending address, not from Supabase.
- The panel stops saying "Link expired" after one hour. A link Supabase sent shows its real 24 hours; a 7 day link shows the days left.
- Resend, and a new "Copy link" button, kill the earlier link (both the earlier 7 day link and any earlier Supabase link). The earlier 7 day link dies at once, even when the kill switch is set; the earlier Supabase link dies only once a new link has actually gone out, so if both our email and Supabase's refuse, the person keeps the Supabase link they already hold.
- Unchanged: the Supabase setting stays at 24 hours; password reset links stay at 24 hours; self-serve signups and paid checkouts keep the Supabase 24 hour invite (one Resend from the panel gives them 7 days); admin-role logins keep the Supabase invite.

**What you do by hand, in this order.** Nothing here asks you to open, paste or share a key.
1. Resend dashboard, by looking only: for the sending domain, confirm click tracking and open tracking are OFF. If either is on, stop and tell the orchestrator before anything is pushed.
2. Resend dashboard, by looking only: note whether the API key Netlify uses has "Sending access" or "Full access", and tell the orchestrator which (question Q7). Change nothing.
3. Netlify, Site configuration, Environment variables: confirm `RESEND_API_KEY` exists and its scopes include Functions. Do not open its value.
4. Supabase SQL Editor: run the checks P1 to P3 of section 5.1; if all match, run the file `db/supabase-client-invite-links-2026-11-13.sql`; then run R1 to R6 and send the answers back.
5. After the orchestrator commits, in PowerShell: `cd "C:\Users\const\Constantin Daniel Goane\BrandGEO"; $env:BATCH_PUSH=1; git push`. One Netlify build. Then hard reload (Ctrl+Shift+R) any open admin tab.
6. Live check, section 12 step 5 (five numbered steps, a private window, a test client deleted at the end).
7. Press Resend once on each pending row of the panel (section 8).

Do NOT change Supabase's "Email OTP expiration". Leave it at 86400.

**Open questions, the build uses the default (section 13).**
- Q1 Self-serve signups also on 7 day links? Default: no, this release.
- Q5 A separate "Revoke link" button? Default: no; Resend or Copy link revokes, and section 5.1 has a one-line bulk revoke for an incident.
- Q6 7 day links for admin-role logins? Default: no.
- Q7 If the Resend key has Full access: swap it for a sending-only key? Default: ship as is and record it; the swap would be your own action in Resend and Netlify, never pasted to anyone, and is a separate decision.

---

## 1. Current state, verified (paths under `brandgeo-dashboard/` unless they start with `docs/` or `db/`)

| # | Fact | Citation |
|---|---|---|
| 1 | Admin resend calls `inviteUserByEmail(user.email, { redirectTo })`; Supabase sends its invite template. | `netlify/functions/resend-invite.js:319` |
| 2 | The lifetime shown to the admin is a hand-kept mirror, env `INVITE_LINK_TTL_MINUTES`, default 60, and the header comment claims "about ONE HOUR". Both are wrong against the owner's 86400 s: this is the display error the owner saw. | `resend-invite.js:7-10`, `:52-58`, `:242` |
| 3 | "Accepted" is `email_confirmed_at || last_sign_in_at`; "pending" needs `invited_at`. | `resend-invite.js:86-95` |
| 4 | Race guard deletes a user created between check and call if `created_at` is unparseable or within 10 min (review L1 of the pending invites work asks for 60 s and never a user with a profile). Existing codes `already_accepted` 409, `orphan_created` 500. | `resend-invite.js:315`, `:327`, `:331-356` |
| 5 | Audit row `client_events` type `invite_resent`, last and non-fatal, no email in meta. | `resend-invite.js:360-377` |
| 6 | Provisioning (admin wizard and lead import) runs Check B (a fresh auth listing) and then the invite with no awaited call between them; the returned user is "ours" only if new and `created_at >= tInv - 5 s`; a "not ours" user returns `inviteSent: true` because GoTrue re-sent that person an invite. | `netlify/functions/_provision_client.js:343-385` |
| 7 | `onStep('invite')` runs right after the invite and before the profile insert; the lead import stamps `invite_sent_at` there and on any result carrying `userId` or `inviteSent`; a rate-limit result pauses the import for an hour. | `_provision_client.js:400-404`; `explee-import-background.js:996-999`, `:1065-1068`, `:1099-1107` |
| 8 | The admin wizard can create an `admin` role login through the same path. | `_provision_client.js:501-504` |
| 9 | Self-serve signup invites from a public endpoint; payment provisioning invites from the webhook. Both get the Supabase invite, which lives 24 h. | `netlify/functions/signup-client.js:119-123`; `netlify/functions/stripe-webhook.js:678` |
| 10 | `/reset-password` reads `token_hash` and `type` from the URL once on mount, strips the address bar, and calls `verifyOtp` only on Save, then `updateUser({ password })`. | `src/pages/ResetPassword.tsx:67-70`, `:106-110`, `:164-198` |
| 11 | Accepted link types and the token_hash shape. | `src/lib/authLinkState.ts:12`, `:19-20`, `:56-61` |
| 12 | After "Password saved", Continue goes to `/`, which routes a profiled viewer to the dashboard. | `ResetPassword.tsx:243-250`; `src/App.tsx:219`, `:296` |
| 13 | `/reset-password` is a public, lazy route. | `src/App.tsx:18`, `:279` |
| 14 | The panel derives "Link expired" client-side from `invited_at + link_ttl_minutes`, fallback `FALLBACK_TTL_MINUTES = 60`. | `src/components/PendingInvitesPanel.tsx:78`, `:107-114`, `:141-146`, `:344`, `:377` |
| 15 | Panel types declare `client_name` and `plan` as non-null strings although the server sends null (pending invites review L2). | `PendingInvitesPanel.tsx:25-39`; `resend-invite.js:211-212` |
| 16 | Our own transactional mail: `sendBrandedEmail` over Resend, never throws, `{ ok:false, skipped:true }` without `RESEND_API_KEY`; its `fetch` has no timeout. | `netlify/functions/_email.js:14`, `:149`, `:212-227`, `:244` |
| 17 | Test fake: `generateLink` returns only an `action_link`, no user, and ignores `authBehaviour`; `inviteUserByEmail` runs `beforeInvite` and `invite` hooks and records `db.invites`. Test env deletes `RESEND_API_KEY`. | `tests/helpers/fake_supabase_mem.js:466-486`; `tests/helpers/affiliate_test_env.js:35` |
| 18 | Onboard copy says the invite link lets them set a password; a comment says links expire after about an hour (wrong, 24 h). | `src/pages/Onboard.tsx:730`, `:822` |
| 19 | Same-origin requests carry the full URL as Referer. | `netlify.toml:33` |
| 20 | A viewer can create MCP API keys for its own client. | `netlify/functions/client-api-keys.js:38-39`, `:109-110` |
| 21 | Email OTP expiration is 86400 s (owner statement, 2026-11-13; not read from this seat, reading it needs the Management API and a token). | owner |

Supabase behaviour this spec relies on, verified by the security review against GoTrue source `supabase/auth` `internal/api/mail.go` (functions `adminGenerateLink`, `sendInvite`, read on master) and the docs page `guides/auth/auth-email-passwordless`: one setting, Email OTP expiration, governs every email token including ones minted by `generateLink`; `generateLink` sends no email and has no limiter; `generateLink` type `invite` on an existing unconfirmed user overwrites `confirmation_token`, `confirmation_sent_at` and `invited_at` (so any earlier Supabase invite link and any earlier minted token die), on a confirmed user answers 422 `email_exists`, on an unknown address CREATES a user and stamps `invited_at`; `sendInvite` has no per-user frequency check; `verifyOtp({ token_hash, type: 'invite' })` is single use and confirms the user; above 86400 s is Management API only and discouraged.

Two places derive the same value today, both removed by this spec: the link expiry (`INVITE_LINK_TTL_MINUTES` default in the function and `FALLBACK_TTL_MINUTES` in the panel, both 60 against a real 1440), and "accepted" (`resend-invite.js:86-88`, to be shared with the new redeem function).

---

## 2. The boundary decision

**Ruling: BrandGEO issues its own 7 day invite token and sends the invite email itself through Resend. The email links to a new public page `/invite`. Only when the person presses Continue does a new public function, `invite-redeem`, check our token and mint a FRESH Supabase invite token with `auth.admin.generateLink`; the page then hands that fresh token to the existing `/reset-password` form, unchanged.** Reason: it is the only design in which the link in the email lives 7 days while the Supabase setting stays at 24 hours for every other link, and it costs no Supabase setting, no template edit and no change to the password form.

Alternatives considered and rejected:

| Option | Why not |
|---|---|
| Raise Email OTP expiration | Already 86400 s, the documented ceiling for the dashboard. 7 days would need the Management API, is discouraged, and would stretch reset and magic links too. |
| Carry our token through Supabase's invite template via user metadata (`{{ .Data }}`) | `generateLink` and a resend to an existing unconfirmed user ignore `data`, so a resend could never carry a new token; it also needs a template edit that cannot be tested or rolled back from code. |
| Our own token, but Supabase still sends its email | Two emails per invite, one dying in 24 hours. Confusing. |
| Mint at GET time (function that redirects) | A mail scanner's GET would mint and could follow into verify. A page with a button press mints nothing on GET. |
| Consume our token at mint time | A person who opens the form and closes the tab would lose the link. Our token dies on acceptance instead (section 4). |

Scope of the new channel ("BrandGEO channel"): invites for logins whose `user_profiles.role` is `viewer` with a `client_id`, sent by `resend-invite.js` and `_provision_client.js` (admin wizard and lead import). Everything else stays on the Supabase invite email ("Supabase channel"), unchanged, at 24 hours:

- `admin` role logins from the wizard: a 7 day bearer link to an admin account is a risk with no matching need.
- `signup-client.js` (self-serve, public): not edited. The person signed up seconds earlier and gets a 24 hour link; if it expires, `/reset-password`'s expired view offers "Send me a new link" (`ResetPassword.tsx:214`).
- `stripe-webhook.js`: NOT edited. A paying self-serve customer gets Supabase's 24 hour invite, exactly as today, and appears in the Pending invites panel, where one Resend gives a 7 day link.
- Fallback: whenever the BrandGEO channel cannot complete (table missing, Resend key missing, Resend refuses or times out, kill switch set), the code sends the Supabase invite exactly as today (24 hours). In provisioning the channel is chosen before the user exists (section 6.4), so a wrong deploy order runs today's exact line.

---

## 3. Mechanism, end to end

1. **Issue** (`_invite_link.js`, called by the two senders): revoke the user's active link (`revoked_reason 'superseded'`), insert a row holding `sha256(token)`, `created_at` and `expires_at = created_at + 7 days` from one clock; send our email with the link `https://app.getbrandgeo.com/invite#t=<token>`; on the resend path, only after Resend accepted that email (or just before a copy return), rotate the user's Supabase invite token (section 4, "Revocation of the previous link"). On any failure, fall back (section 2), with no rotation by us.
2. **Open**: a GET of `/invite` serves the static SPA. The page reads `t` from the fragment ONLY, validates the shape, strips the address bar to `/invite`, starts prefetching the `ResetPassword` chunk, and makes NO function call. It shows one button.
3. **Continue**: POST `invite-redeem` with the token. The function checks it (section 4) and calls `generateLink({ type: 'invite', email: <stored address of the bound user> })`. It returns exactly `{ ok: true, token_hash, type }`. Our row is NOT consumed; `redeem_count` and `last_redeemed_at` are updated by a conditional update.
4. **Hand-off**: the page awaits the `ResetPassword` chunk (already prefetched), checks `type` is `invite` or `signup`, then calls `navigate('/reset-password?token_hash=<h>&type=<t>', { replace: true })`. Because the chunk is already loaded, no request is made while the query is in the address bar, so the token reaches no server log and no Referer; `ResetPassword.tsx:106-110` strips it on mount. From here the existing flow runs unchanged: Save validates the password, `verifyOtp`, `updateUser`, Continue to the dashboard. The minted token lives 24 hours (the project setting) until used or rotated.
5. **Acceptance kills our token**: after `verifyOtp` the user is confirmed. The next redeem of the same link finds `isAccepted(user)`, stamps `accepted_at` on the row and answers `used`. GoTrue itself also refuses `generateLink('invite')` for a confirmed user (422), mapped to `used` too.

Scanner prefetch: a GET of `/invite` mints nothing and activates nothing. A scanner that runs scripts and presses the button would only mint a Supabase token it never sees used; activation needs `verifyOtp`, which needs a typed password. Our token is untouched in every case. No Supabase token (and no `email_otp`) exists until someone presses Continue, which is less exposure than today.

---

## 4. Security rulings

| Topic | Ruling |
|---|---|
| Token | 32 bytes from `crypto.randomBytes`, base64url without padding: exactly 43 chars matching `^[A-Za-z0-9_-]{43}$`. 256 bits. |
| Storage | Only `sha256(token)` as lowercase hex (64 chars) in our table. The token exists in three places: the email in the person's inbox, Resend's stored copy of the sent email (readable with a Full access Resend key; see Q7), and, for copy delivery, one admin response. Never in a log, an audit row or browser storage. The rate limit key carries only the first 16 hex chars of the hash. |
| Lookup | `.eq('token_hash', sha256(token))` on a unique index. A constant-time compare is not needed: the database compares digests, and timing reveals nothing usable about a 256 bit preimage. |
| Binding | Row binds `user_id` and `client_id`. Redeem requires: row exists, not revoked, not accepted, `expires_at > now` (strict), auth user exists, profile `role = 'viewer'` and `client_id` equal to the row's. Address used is the auth user's stored email, never anything from the request. |
| Active tokens | At most one per user: partial unique index on `user_id` where `revoked_at is null and accepted_at is null`. Every issue supersedes the previous row. |
| Revocation of the previous link | On the resend path (email and copy), after the new row is inserted and after Resend accepted the email, or before the copy return, `deliverInvite` calls `generateLink({ type: 'invite', email: user.email })` and discards the result (never logs `data`). Per GoTrue this overwrites the user's `confirmation_token`, killing any earlier Supabase invite link and any token minted by an earlier redeem; it sends no email and has no limiter. Guards: 422 or `/already.*(regist\|exist\|confirm)/` means the user is accepted: set `accepted_at = now` on the new row and answer `already_accepted`; a returned user id different from `user.id` means the user vanished and GoTrue created one: set the new row `revoked_at = now, revoked_reason = 'revoked'` and answer `user_changed` with that user, so the caller runs the race guard below; any other error: log status only, continue, report `previousLinkRevoked: false`. Skipped in `_provision_client.js`, whose `generateLink` just created the user. Running it AFTER the supersede also closes the race of a redeem that minted just before the supersede. Never run when our email was refused, skipped or timed out: the fallback `inviteUserByEmail` rotates the token itself when it succeeds, and when it fails (for example 429) the person keeps the Supabase link they already hold and GoTrue's `invited_at` stays where it was, so the panel's estimate stays true. Cost of rotating after the send: a recipient who presses Continue within the rotation's latency (well under a second) gets a token that `verifyOtp` refuses; the 7 day row is untouched, so opening the same email link again works. |
| What a stolen link allows | Setting the password of that one viewer login once, until the first of: acceptance, 7 days, a newer issue, a revoke. Access obtained that way persists (sessions, which a later password change does not end, and MCP keys the viewer creates, `client-api-keys.js:38-39`) until an admin deletes the login or revokes its keys. Same exposure as the 24 h Supabase link today, with a longer window. Not an admin login (section 2). |
| Account creation | Redeem never creates a user. If `generateLink` returns a user id different from the row's (the bound user vanished and GoTrue created one), delete that new user only when its `created_at` parses, is `>= startedAt - 60 s`, and it has no `user_profiles` row; then answer `invalid`. The same rule replaces the 10 minute window in `resend-invite.js:339` (closes pending invites review L1); an unparseable `created_at` is no longer deleted. |
| Rate limits | `affiliate_rate_check` RPC, fixed window: `invite:ip:<hashIp(event)>` 20 per 3600 s, then `invite:tok:<first 16 hex of token_hash>` 10 per 3600 s, both BEFORE the row lookup. `hashIp` is `require('./_prospect_guard').hashIp` (`_prospect_guard.js:57`). An RPC error is logged and the request proceeds (fail open): the security rests on token entropy. |
| Public answers | `invalid` (unknown, malformed, user gone, profile mismatch, `send_failed` or `revoked` row, table missing) is one indistinguishable 404. `expired`, `replaced`, `used` are distinguished (410): only a holder of a real 256 bit token can see them. Nothing reveals whether an email address has an account. |
| Response whitelist | The 200 body is built from exactly `{ ok: true, token_hash, type }`. Neither `data`, `properties`, `action_link`, `email_otp` nor the user object is ever logged or returned, in any branch, including the 503 for an unexpected `verification_type`. |
| Logging | `[invite-redeem] link <row id> user <user uuid>: <outcome>`, or `[invite-redeem] unknown token`. Never the token, the hash, an address, the request body or a `generateLink` response. Same rule in `_invite_link.js`. |
| Leakage | Token in the fragment only (no query fallback), so it never reaches Netlify's CDN logs or a Referer. The page strips the address bar on mount. Redeem responses and the copy response of `resend-invite` carry `Cache-Control: no-store`; redeem also `Referrer-Policy: no-referrer`. Precondition: click and open tracking OFF on the Resend sending domain (owner step 1). The visit stays in browser history, inherent to emailed links and bounded by acceptance and 7 days. |
| Origin | Use `corsHeaders` and `ALLOWED_ORIGINS` from `_auth.js`: OPTIONS 204, POST only (405), a present foreign Origin 403. No JWT. |
| Kill switches | Env `INVITE_LINK_CHANNEL`: absent or `brandgeo` uses the new channel; `supabase` forces today's behaviour in both senders. A Resend under the kill switch or without a Resend key still supersedes the viewer's active row (best effort), so a forwarded 7 day link is cut off even while the channel is off. Env `INVITE_REDEEM_DISABLED`: when `1`, redeem answers 503 `unavailable` after the shape check, before any table read. Both need one redeploy (Netlify, Deploys, Trigger deploy; one build). The instant path is the bulk revoke SQL of 5.1. |

---

## 5. Data

### 5.1 Migration file: `db/supabase-client-invite-links-2026-11-13.sql`

Additive, one transaction (`begin; ... commit;`), idempotent (`if not exists` everywhere, constraints inline in the `create table`). No existing row touched. Header in the style of `db/supabase-client-locations-2026-11-13.sql:1-56`: purpose, order rule (section 7), what a wrong order does (nothing breaks, see 7), pre-checks, read-back, rollback, and the incident runbook below.

Table `public.client_invite_links`:

| Column | Type | Rule |
|---|---|---|
| `id` | `bigint generated always as identity primary key` | |
| `user_id` | `uuid not null references auth.users(id) on delete cascade` | |
| `client_id` | `integer not null references public.clients(id) on delete cascade` | |
| `token_hash` | `text not null` | `unique`; check `token_hash ~ '^[0-9a-f]{64}$'` |
| `source` | `text not null` | check in `('onboard-client','explee-import','resend-invite')` |
| `created_by` | `uuid null` | the admin's auth id; null for the lead import. No FK. |
| `created_at` | `timestamptz not null default now()` | written explicitly by `_invite_link.js` from the same clock as `expires_at` |
| `expires_at` | `timestamptz not null` | check `expires_at > created_at and expires_at <= created_at + interval '30 days'` |
| `revoked_at` | `timestamptz null` | |
| `revoked_reason` | `text null` | check null or in `('superseded','send_failed','revoked')`; check `(revoked_at is null) = (revoked_reason is null)` |
| `accepted_at` | `timestamptz null` | |
| `last_redeemed_at` | `timestamptz null` | |
| `redeem_count` | `integer not null default 0` | check `>= 0` |

Indexes: `client_invite_links_one_active` unique on `(user_id) where revoked_at is null and accepted_at is null`; `client_invite_links_user_idx` on `(user_id, created_at desc)`; `client_invite_links_client_idx` on `(client_id)` (the cascade).
Security: `enable row level security`; no policy at all; `revoke all on public.client_invite_links from anon, authenticated`; `revoke all on sequence public.client_invite_links_id_seq from anon, authenticated` (the default name of the identity sequence; R5 confirms it through `pg_get_serial_sequence`); `grant select, insert, update on public.client_invite_links to service_role` (no delete grant: rows leave only by cascade). Table comment naming this spec.

Pre-apply checks (read only; any other answer STOPS the apply):
- P1 `select data_type from information_schema.columns where table_schema='public' and table_name='clients' and column_name='id';` EXPECT `integer` (if `bigint`, change `client_id` to `bigint` before applying).
- P2 `select to_regclass('public.client_invite_links');` EXPECT null (or the table, on a re-run).
- P3 `select proname from pg_proc where pronamespace='public'::regnamespace and proname='affiliate_rate_check';` EXPECT 1 row.

Read-back set (run after apply):
- R1 columns of the table: EXPECT the 13 above with those types and nullability.
- R2 `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.client_invite_links'::regclass;` EXPECT pkey, 2 FKs both `ON DELETE CASCADE`, token unique, 6 checks (the `revoked_reason` one listing three values).
- R3 `select indexname, indexdef from pg_indexes where tablename='client_invite_links';` EXPECT the pkey, the token unique, and the 3 above (one_active is `WHERE ((revoked_at IS NULL) AND (accepted_at IS NULL))`).
- R4 `select relrowsecurity from pg_class where oid='public.client_invite_links'::regclass;` EXPECT true; `select count(*) from pg_policies where tablename='client_invite_links';` EXPECT 0.
- R5 for each of `anon` and `authenticated` and each of `select`, `insert`, `update`, `delete`: `select has_table_privilege('<role>','public.client_invite_links','<priv>');` EXPECT false in all eight; and `select has_sequence_privilege('anon', pg_get_serial_sequence('public.client_invite_links','id'), 'usage'), has_sequence_privilege('authenticated', pg_get_serial_sequence('public.client_invite_links','id'), 'usage');` EXPECT false, false.
- R6 `select count(*) from public.client_invite_links;` EXPECT 0.

Incident runbook (in the migration header; the owner runs it in the SQL Editor, no key involved): to stop every unaccepted 7 day link at once, `update public.client_invite_links set revoked_at = now(), revoked_reason = 'revoked' where revoked_at is null and accepted_at is null;`. Effective immediately; redeem answers 404 for those links. Tokens minted by earlier Continue presses live up to 24 hours more in GoTrue; to kill those too, press Resend on each affected pending row (rotates the Supabase token and sends a new link to the stored address) or delete the login. For a stop without SQL, set `INVITE_REDEEM_DISABLED=1` and redeploy (one build).

Rollback: `drop table if exists public.client_invite_links;`. Safe with the new code live: provisioning's readiness probe fails and runs today's line; resend falls back to Supabase; redeem maps the missing table (Postgres `42P01`) to 404 `invalid`, whose copy tells the person to ask for a new link. Retention: no purge job. Rows hold no address and no token, leave by cascade with the user or the client, and number tens per month. Revisit only past 100,000 rows.

### 5.2 State ownership map

| State | Owner (writes) | Readers | Invalidates when |
|---|---|---|---|
| Our token row | `_invite_link.js` (issue, supersede, send_failed, revoked on user change, accepted on 422); `invite-redeem.js` (conditional redeem stamp, `accepted_at`); owner SQL (bulk `revoked`) | `invite-redeem.js`, `resend-invite.js` list | newer issue, acceptance, 7 days, revoke, cascade |
| Accepted | GoTrue (`email_confirmed_at`, `last_sign_in_at`) | `isAccepted` exported ONCE from `_invite_link.js`, imported by `resend-invite.js` and `invite-redeem.js` | never reverts |
| Link expiry shown to the admin | `resend-invite.js` list computes `link_expires_at`: with an active row (`revoked_at is null and accepted_at is null`, EXPIRED rows included), the row's `expires_at`, which always wins over `invited_at` because GoTrue moves `invited_at` at every mint and every rotation; without one, `invited_at + linkTtlMinutes()`, an estimate (GoTrue clocks from `confirmation_sent_at`, equal to `invited_at` at an `inviteUserByEmail`) | panel compares with the clock only | as above |
| Supabase link lifetime | Supabase setting, 86400 s, not changed by this work; mirrored ONCE as `SUPABASE_EMAIL_LINK_TTL_MINUTES = 1440` in `resend-invite.js`, overridable by `INVITE_LINK_TTL_MINUTES` | `linkTtlMinutes()` | if the owner ever changes the setting, the override must follow |
| Fresh Supabase token | GoTrue via `generateLink` | `/invite` page (memory only), then `/reset-password` | single use; 24 hours; the next `generateLink` for that user |
| Token from the email | the email | `/invite` page state, never storage | page unload |

---

## 6. Contracts

### 6.1 New `netlify/functions/_invite_link.js` (CommonJS, requires only `crypto` and `./_email`; no `.ts` require; also loaded by the esbuild-bundled `explee-import-background.js`)

```ts
const INVITE_LINK_DAYS = 7
const INVITE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
const SEND_TIMEOUT_MS = 8000
function generateInviteToken(): string                 // randomBytes(32).toString('base64url')
function hashInviteToken(token: string): string        // sha256 hex, lowercase
function buildInviteUrl(token: string): string         // 'https://app.getbrandgeo.com/invite#t=' + token
function isAccepted(user: AuthUser | null): boolean    // moved from resend-invite.js:86-88, unchanged
function channelEnabled(): boolean                      // process.env.INVITE_LINK_CHANNEL !== 'supabase'
async function channelReady(supabase, role: string): Promise<boolean>
  // true only when role === 'viewer' AND channelEnabled() AND process.env.RESEND_API_KEY is non-empty
  // AND a zero-row read of client_invite_links succeeds (select id, limit 0). Never throws.

type InviteSource = 'onboard-client' | 'explee-import' | 'resend-invite'
type DeliverArgs = {
  user: { id: string; email: string }       // resolved by the caller, never from a request
  clientId: number
  clientName: string | null
  role: string                               // only 'viewer' may use the BrandGEO channel
  source: InviteSource
  actor: string | null
  delivery: 'email' | 'copy'                 // 'copy' only from resend-invite
  rotate: boolean                            // true from resend-invite, false from _provision_client
  now?: () => Date
}
type DeliverResult =
  | { ok: true; channel: 'brandgeo'; linkId: number; expiresAt: string; issuedAt: string;
      previousLinkRevoked: boolean; inviteUrl?: string }        // inviteUrl only for 'copy'; previousLinkRevoked true when rotate is false
  | { ok: true; channel: 'supabase'; supabaseUser: AuthUser | null; issuedAt: string }   // fallback sent
  | { ok: false; code: 'busy' | 'link_unavailable' | 'email_rate_limited' | 'invite_error' | 'already_accepted'; message: string }
  | { ok: false; code: 'user_changed'; otherUser: AuthUser; message: string }
async function deliverInvite(supabase, args: DeliverArgs): Promise<DeliverResult>
```

`deliverInvite` order, exactly:
1. If `role !== 'viewer'`: copy delivery answers `{ ok:false, code:'link_unavailable' }`; email delivery goes to step 7 with no table write. If `role === 'viewer'` and `!channelEnabled()`: copy delivery answers `link_unavailable`. If `role === 'viewer'`, email delivery, and (`!channelEnabled()` or `RESEND_API_KEY` empty): run step 2's supersede first as a best effort (an error is logged by status only and ignored; no insert, no rotation), then go to step 7.
2. `update client_invite_links set revoked_at=now, revoked_reason='superseded' where user_id=? and revoked_at is null and accepted_at is null`. Error: step 7 (copy: `link_unavailable`).
3. Insert the row with `created_at = now` and `expires_at = now + 7 days`, both from `args.now()`. Unique violation (23505) on the partial index: repeat steps 2 and 3 once; a second 23505 answers `{ ok:false, code:'busy' }`. Any other error: step 7 (copy: `link_unavailable`).
4. Rotation, the one routine steps 5 and 6 call when `rotate` is true: `generateLink({ type: 'invite', email: user.email })`, result discarded, per section 4 "Revocation of the previous link". 422 or `/already.*(regist\|exist\|confirm)/`: set `accepted_at = now` on the new row and answer `already_accepted`. A returned user id different from `user.id`: set the new row `revoked_at = now, revoked_reason = 'revoked'` and answer `user_changed` with that user. Any other error: log status only, `previousLinkRevoked = false`, continue. Rotation is never run at this point of the order, only from steps 5 and 6, and never on the path to step 7.
5. Copy delivery: when `rotate`, run the rotation of step 4 just before the return (its 422 and `user_changed` answers replace the return). Then return `{ ok:true, channel:'brandgeo', inviteUrl, ... }`. No email.
6. Race `sendBrandedEmail({ to: user.email, kind: 'transactional', subject, heading, paragraphs, cta: { label, url: buildInviteUrl(token) }, footerNote })` (copy of section 9) against a `SEND_TIMEOUT_MS` timer; `_email.js` is not edited. `ok` true within the timer: when `rotate`, run the rotation of step 4 now, after Resend accepted the email (its 422 and `user_changed` answers replace the return; the email already sent then carries a link that answers `used` or `invalid`); then return the brandgeo result. Refusal, skip or timeout: no rotation; update the row `revoked_at=now, revoked_reason='send_failed'`, log the Resend error message or `timeout` (never the address), go to step 7. A timed-out send may still deliver; its link then answers `invalid`, and the fallback email carries a working link. If the fallback also fails, nothing of the user's auth state was touched by this call: `confirmation_token` and `invited_at` are as before, so the person keeps their earlier Supabase link and the panel's estimate for it stays true.
7. Fallback: `inviteUserByEmail(user.email, { redirectTo: 'https://app.getbrandgeo.com/reset-password' })`. Error with status 429 or `/rate.?limit/`: `email_rate_limited`; other error: `invite_error`. Success: `{ ok:true, channel:'supabase', supabaseUser: data.user }`.

### 6.2 New `netlify/functions/invite-redeem.js` (public)

Request: `POST { token: string }`, Content-Type JSON.
Check order: OPTIONS, method, Origin, JSON object, `INVITE_TOKEN_RE` (else 400), `INVITE_REDEEM_DISABLED === '1'` (503), IP rate, token rate, row lookup, row state, `getUserById`, profile, `isAccepted`, `generateLink`, race guard, conditional update.

| Status | Body | When |
|---|---|---|
| 200 | exactly `{ ok: true, token_hash: string, type: 'invite' \| 'signup' }` | minted. `type` is `properties.verification_type`; any other value answers 503 `unavailable` and logs the outcome only. `token_hash` must match `authLinkState.ts:20`; otherwise 503. |
| 400 | `{ ok: false, code: 'bad_request' }` | not JSON, not an object, token missing or wrong shape |
| 404 | `{ ok: false, code: 'invalid' }` | unknown hash, `send_failed` or `revoked` row, table missing (`42P01`), user gone, profile not a viewer of `client_id`, race-guard case |
| 410 | `{ ok: false, code: 'replaced' }` | `revoked_reason = 'superseded'` (checked before expiry) |
| 410 | `{ ok: false, code: 'used' }` | `accepted_at` set, or `isAccepted(user)`, or `generateLink` answers 422 or `/already.*(regist\|exist\|confirm)/` (these two stamp `accepted_at`) |
| 410 | `{ ok: false, code: 'expired' }` | `expires_at <= now` |
| 429 | `{ ok: false, code: 'rate_limited' }` | either limiter false; or `generateLink` 429 |
| 503 | `{ ok: false, code: 'unavailable' }` | `INVITE_REDEEM_DISABLED`, other lookup error, `getUserById` error, other `generateLink` error. Token kept; the person may retry. |
| 403 / 405 | `{ error }` / `Method Not Allowed` | foreign Origin / not POST |

After a successful mint: `update client_invite_links set last_redeemed_at=now, redeem_count=redeem_count+1 where id=? and revoked_at is null and accepted_at is null returning id`. Zero rows (a concurrent supersede, revoke or acceptance): call `generateLink({ type:'invite', email })` once more and discard it (rotates away the token just minted), re-read the row, and answer by its state (`superseded` 410 `replaced`, `revoked` 404, accepted 410 `used`); the minted `token_hash` is never returned. If that second call fails, still answer the non-200 and log the outcome. Headers on every answer: `Content-Type: application/json`, `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, plus `corsHeaders(origin)`. No `netlify.toml` change: the default 10 s timeout fits at most nine Supabase calls, and a timeout is a non-JSON 502 the page treats as a network failure with a working retry.

### 6.3 Changed `netlify/functions/resend-invite.js`

- `linkTtlMinutes()`: default becomes the constant `SUPABASE_EMAIL_LINK_TTL_MINUTES = 1440`, with a comment citing the owner's statement of 2026-11-13 (Email OTP expiration 86400 s) and stating that nothing reads the real value, because reading it needs the Management API and a token this work must not ask for. `INVITE_LINK_TTL_MINUTES` stays as an optional override; no owner step sets it.
- `list` response, additive: top level `invite_link_days: 7`; per row `link_channel: 'brandgeo' | 'supabase' | 'unknown'`, `link_expires_at: string | null`, `link_last_pressed_at: string | null`. One extra read: active rows (`revoked_at is null and accepted_at is null`) for the listed viewer ids. With an active row (expired or not): `link_channel 'brandgeo'`, `link_expires_at = expires_at`, `link_last_pressed_at = last_redeemed_at`, and `invited_at = row.created_at` (the send time; GoTrue's `invited_at` moves at every mint and rotation). Without: `'supabase'`, `link_expires_at = invited_at + linkTtlMinutes()` or null, pressed null. If that read errors: every row `link_channel 'unknown'`, `link_expires_at null`, logged, still 200. `link_ttl_minutes` stays and now means the Supabase channel only.
- `inviteStatus` and the `not_invited` refusal are unchanged: GoTrue stamps `invited_at` on a user created by `generateLink` (security review I1).
- `resend` request gains optional `delivery: 'email' | 'copy'` (default `'email'`; any other value 400 `bad_request`). Copy is allowed with `user_id` or `client_id`, not with legacy `{ email }`.
- `sendInvite` keeps its refusals, then calls `deliverInvite({ user, clientId: profile.client_id, clientName, role: profile.role, source: 'resend-invite', actor: auth.user.id, delivery, rotate: true })`. The race guard (`:331-356`, tightened per section 4) runs on `supabaseUser` of a Supabase-channel result AND on `otherUser` of a `user_changed` result. Error mapping: `busy` 409 "Another resend for this login is in progress. Refresh and try again."; `link_unavailable` 503 "Invite links are not available right now. Use Resend to email the invite instead."; `already_accepted` 409 (existing `ALREADY`); `email_rate_limited` 429 `rate_limited` (existing sentence); `invite_error` 502 `invite_failed` (existing sentence).
- 200 response, additive: `channel`, `delivery`, `link_expires_at` (BrandGEO: row; Supabase: `invited_at + ttl`), `previous_link_revoked: boolean` (BrandGEO channel only), and `invite_url` ONLY when `delivery = 'copy'`, in which case the response carries `Cache-Control: no-store`. `invited_at` = `issuedAt`.
- Audit meta becomes `{ source:'resend-invite', user_id, via, channel, delivery, invite_link_id? }`. Never the token, hash or address. Type stays `invite_resent` (no CHECK change).
- Header comment `:7-10` rewritten: Supabase channel 24 hours (owner, 2026-11-13), BrandGEO channel 7 days, the "ONE HOUR" claim goes.
- New error codes in the header list: `busy`, `link_unavailable`.

### 6.4 Changed `netlify/functions/_provision_client.js`

- Channel choice BEFORE the user exists and BEFORE Check B: `const useLink = await channelReady(supabase, role)` placed before `loadAuthEmails` at `:347`, so the rule "no awaited call between Check B and the invite call" (`:344-346`) still holds.
- Step 2: when `useLink`, replace `inviteUserByEmail(contact, ...)` at `:359` with `generateLink({ type: 'invite', email: contact, options: { redirectTo: REDIRECT_TO } })`. It creates the user and sends nothing. `authData.user`, the error mapping at `:360-372` and the "ours" test at `:378-385` stay. When not `useLink` (admin role, kill switch, no key, table missing): the existing `inviteUserByEmail` line, untouched.
- "Not ours" on the `generateLink` branch: before returning, call `inviteUserByEmail(contact, { redirectTo: REDIRECT_TO })` once, today's exact side effect, because `generateLink` just rotated that person's token. Success keeps today's return (`inviteSent: true`). Error: log the status only and return the same result as success, `inviteSent: true` included (today's two "not ours" returns at `_provision_client.js:383-384`, unchanged). On this branch `inviteSent` means this call touched the address's auth state (`generateLink` rotated that person's token), which is what the lead import's stamp and stop rule need (`explee-import-background.js:1067-1068`, `:1070-1084`: only a result carrying `inviteSent` stamps `invite_sent_at` and calls `stopCreation(run, 'not_ours')`; `:1086-1091` does neither). The wizard does not read it (`onboard-client.js:210` maps by `code` only). Cost, stated: when that restore fails, the existing person's earlier invite link is dead and no new one went out; the stop rule bounds this to one person per import run, as today's V1 guarantee (`_provision_client.js:373-385`) bounds a clock-skew misjudgement.
- New step 2b, immediately after the "ours" test and BEFORE `onStep('invite')` at `:400`, only on the `generateLink` branch: `deliverInvite({ user, clientId: client.id, clientName: client.name ?? input.name ?? null, role, source: ctx.source, actor: ctx.actor || null, delivery: 'email', rotate: false })`. On `{ ok:false }`: delete the user (`deleteUser`), then the client; if both succeed return `fail('invite', code === 'email_rate_limited' ? 'email_rate_limited' : 'invite_error', message)` with NO `userId` and NO `inviteSent` (byte-identical to today's invite-error results at `:363-365`); if a delete fails return `fail('invite', 'rollback_failed', message, { clientId: client.id, userId: user.id })`. Because the email goes before `onStep('invite')`, every later step keeps today's meaning ("an email went out"). Only a live Resend refusal or timeout reaches the generateLink-then-inviteUserByEmail sequence (no per-user frequency check in GoTrue `sendInvite`).
- `client_events` `onboarded` meta gains `invite_channel: 'brandgeo' | 'supabase'`. The return object gains `inviteChannel`. Nothing else in the return shape changes.
- `onboard-client.js` and `explee-import-background.js` are NOT edited.

### 6.5 New page `src/pages/Invite.tsx`, route `/invite`, and pure `src/lib/inviteLink.ts`

`src/lib/inviteLink.ts` (no imports, loadable by `tests/helpers/ts_require`):
```ts
export const INVITE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/   // same literal as _invite_link.js; pinned by a mirror test
export function parseInviteToken(href: string): string | null   // fragment 't' ONLY; must match INVITE_TOKEN_RE; a query 't' is ignored
export type LinkState = 'expired' | 'valid' | 'unknown'
export function linkStateFromExpiry(expiresAt: string | null, now?: number): LinkState  // unknown if null or unparseable; expired if now >= t
export type RedeemResult =
  | { ok: true; token_hash: string; type: 'invite' | 'signup' }
  | { ok: false; code: 'bad_request' | 'invalid' | 'expired' | 'replaced' | 'used' | 'rate_limited' | 'unavailable' }
```

`Invite.tsx`: public route in `App.tsx` beside `/reset-password` (lazy, no `PrivateRoute`, no `OnboardGate`, no `Layout`); same shell as `ResetPassword.tsx:326-341`. Stages: `ready | working | invalid | expired | replaced | used | error`. Mount: `parseInviteToken(window.location.href)` once, `history.replaceState` to `/invite`, start `import('./ResetPassword')` (prefetch), no function call; no token gives `invalid`. Continue: POST `/.netlify/functions/invite-redeem`; on 200, refuse any `type` other than `invite` or `signup` (stage `error`), await the prefetched import, then `navigate('/reset-password?token_hash=' + encodeURIComponent(h) + '&type=' + t, { replace: true })`; 400 and 404 give `invalid`; 410 maps to its stage; 429, 503, a non-JSON answer and a network failure stay on `ready` with an inline error and a working button. Demo mode: Continue goes straight to `/reset-password` with no token. Token held in `useState` only, never storage, never logged. Focus moves to the heading on each stage change (the ResetPassword pattern).

### 6.6 Changed `src/components/PendingInvitesPanel.tsx`

- Types: `InviteRow` gains `link_channel: 'brandgeo' | 'supabase' | 'unknown'`, `link_expires_at: string | null`, `link_last_pressed_at: string | null`; `client_name: string | null`, `plan: string | null` (closes pending invites review L2; render "Unnamed client" and hide the plan badge when null). `InviteListResponse` gains `invite_link_days`. `ResendResponse` gains `channel`, `delivery`, `link_expires_at`, `previous_link_revoked?`, `invite_url?`. `InviteErrorCode` gains `busy`, `link_unavailable`, `orphan_created`.
- Delete `linkState`, `FALLBACK_TTL_MINUTES` and the `ttl` state (`:78`, `:344`, `:377`); `LinkBadge` uses `linkStateFromExpiry(row.link_expires_at)`. "Link expired" now means: the link in the newest invite email can no longer be used.
- Valid badge shows time left (C-P1); a "Continue pressed {age}" note when `link_last_pressed_at` is set (C-P3).
- After a successful resend, patch the row with `invited_at`, `link_channel`, `link_expires_at` from the response; clear `link_last_pressed_at`. Success copy branches on `channel` (C-P7); when `previous_link_revoked` is false, add C-P8.
- New per-row action "Copy link" on pending rows: a confirm step (C-P5), then `resend` with `delivery: 'copy'`, then show `invite_url` in a read-only field with a Copy button and the warning (C-P6). Kept in component state only; cleared on reload or close. Shares the existing 60 s row lock.
- `src/pages/Onboard.tsx`: text at `:730` (C-O1) and the comment at `:822` (24 hours on the Supabase channel, 7 days on the BrandGEO channel).

---

## 7. Migration sequence and order rule

Order: (1) apply the migration and run R1 to R6; (2) push (one Netlify build); (3) owner live check; (4) Resend the pending invites. Email OTP expiration stays at 86400 s throughout; the design does not depend on it except through the display constant `SUPABASE_EMAIL_LINK_TTL_MINUTES`.

There is no window of inconsistency, and any order is safe:
- Push before the migration: provisioning's `channelReady` read fails, so the wizard and the lead import run today's exact `inviteUserByEmail` line; resend's step 2 errors and it falls back to the Supabase email (24 hours); the panel shows `link_channel 'unknown'` (list read error) until the migration lands; Copy link answers 503. Nothing is stranded.
- `RESEND_API_KEY` missing: `channelReady` is false and resend skips to the fallback. Today's behaviour.
- Migration with the old bundle: the table is unused. Harmless.
- No Supabase dashboard change is required: no template, no redirect allow list (the fresh token is used through `verifyOtp`, not `action_link`), no setting.

Rollback, per step: (2) set `INVITE_LINK_CHANNEL=supabase` in Netlify and redeploy (one build; links already sent keep working), or revert the commit; to stop links already sent, the bulk revoke SQL of 5.1 (instant) or `INVITE_REDEEM_DISABLED=1` and a redeploy; (1) `drop table` per 5.1, only after (2).

---

## 8. Existing pending invites (19 today)

They were resent about two hours before the request, so their Supabase links still work until about 24 hours after that resend; only the badge was wrong. After the deploy the panel shows them as Supabase links with their real expiry. After step 3 of section 7, the owner presses Resend once on each pending row (the 60 s row lock applies per row, not across rows). Each gets a BrandGEO email with a 7 day link, the Supabase link they hold is rotated away, and the badge reads "Link valid". For a lead he is writing to personally, he may use Copy link instead and paste the link into his own message; that also kills any emailed link, is audited as `invite_resent` with `delivery 'copy'`, and the link is a bearer credential for that login until accepted or 7 days pass, so it goes only to that person. If a link reached the wrong person and was used, delete the login and onboard again (a password change does not end that person's sessions or MCP keys).

---

## 9. Copy slots (all English literals `copy: pending bg-copy`; no em or en dash)

Email (BrandGEO channel):
- C-E1 subject: "Your BrandGEO login is ready"
- C-E2 heading: "Set up your BrandGEO login"
- C-E3 paragraph, with client name: "You have been invited to see how AI engines describe {clientName}." Without: "You have been invited to BrandGEO, where you can see how AI engines describe your brand."
- C-E4 paragraph: "Choose a password to open your dashboard. This link works for 7 days."
- C-E5 CTA label: "Set up my login"
- C-E6 footerNote: "If you did not expect this email, you can ignore it. Nothing happens until you choose a password."

`/invite` page:
- C-I1 title "Set up your login · BrandGEO"; heading "Set up your BrandGEO login"; body "Continue to choose your password."; button "Continue"; working "Opening..."
- C-I2 invalid: "We could not open this invite" / "The link may be incomplete or no longer active. Ask the person who invited you to send a new one, or sign in if you already have a password."
- C-I3 expired: "This invite has expired" / "Invite links work for 7 days. Ask the person who invited you to send a new one."
- C-I4 replaced: "A newer invite was sent" / "Please use the link in the most recent invite email."
- C-I5 used: "This invite was already used" / "Sign in with your email and password. If you never chose a password, use Forgot your password." button "Sign in"
- C-I6 inline errors: "Too many attempts. Please wait a few minutes and try again." / "Something went wrong. Please try again."
- C-I7 links under every dead-end state: "Sign in" (`/login`), "Forgot your password?" (`/reset-password`)

Panel and wizard:
- C-P1 badge valid: "Link valid, {n} days left" (under a day: "Link valid, {h} hours left")
- C-P2 badge expired: "Link expired" (unchanged); unknown: "Link state unknown" (unchanged)
- C-P3 note: "Continue pressed {age}"
- C-P4 button: "Copy link"
- C-P5 confirm: "This creates a new link. The link in the last invite email stops working. Continue?"
- C-P6 warning beside the link: "Anyone with this link can set up this login until {date}. Send it only to this person."
- C-P7 resend success: channel `brandgeo`: "Invite sent. The link works for 7 days."; channel `supabase`: "Invite sent. The link works for 24 hours."
- C-P8 after a resend whose `previous_link_revoked` is false: "The previous email link may still work for up to 24 hours."
- C-O1 `Onboard.tsx:730`: "We will email this address an invite link, valid for 7 days, to set their own password and log in."

---

## 10. Tests

bg-backend, `node` test files, no network. "MUST FAIL before the change" marks the tests that prove the fix.

`tests/invite_link.test.js` (new), `_invite_link.js` with `_email.js` mocked through the require cache (the way the auth mock replaces `_auth.js`), `RESEND_API_KEY` set to a dummy test string where the channel must be on:
1. Token: 43 chars, matches `INVITE_TOKEN_RE`, 1,000 draws all distinct; hash is 64 lowercase hex and equals node's sha256.
2. `buildInviteUrl` puts the token in the fragment and has no query.
3. Issue supersedes the earlier active row (`superseded`); the new row has `expires_at - created_at` exactly 7 days, both written by the function; no column holds the token.
4. Viewer, email, `rotate false`: exactly one Resend call to the user's stored address with the CTA url equal to `buildInviteUrl(token)`, zero `inviteUserByEmail`, zero `generateLink`. MUST FAIL before the change.
5. Insert error: zero Resend calls, one `inviteUserByEmail`, channel `supabase`.
6. Resend skipped: row revoked `send_failed`, one `inviteUserByEmail`.
7. `role 'admin'` (also with `INVITE_LINK_CHANNEL=supabase` set, and also with `RESEND_API_KEY` empty): no table write, one `inviteUserByEmail`.
7b. Viewer, email delivery, `INVITE_LINK_CHANNEL=supabase` plus an active row for that viewer: one `deliverInvite` call leaves zero active rows (the earlier row `superseded`), inserts no row, makes zero `generateLink` and one `inviteUserByEmail` call. The same with the channel on and `RESEND_API_KEY` empty. A supersede error is logged by status only and the `inviteUserByEmail` still runs. (Pins re-read M2.)
8. Copy: no email, `inviteUrl` returned; copy with the channel off answers `link_unavailable`.
9. 23505 twice answers `busy` after exactly one retry.
10. Captured console output never contains the token, its hash, the address or the fake's `action_link` or `email_otp`; subject and paragraphs contain no U+2014 or U+2013 (with a positive control that the scan fires).
11. Send timeout: a `sendBrandedEmail` that never resolves; after `SEND_TIMEOUT_MS` (fake timers or an injected short value) the row is `send_failed` and one `inviteUserByEmail` ran.
12. Rotation, `rotate true`: exactly one `generateLink('invite')` for the stored address, after the Resend call answered ok (email delivery) or before the return (copy delivery), checked by call order; the fake user's earlier `confirmation_token` value has changed; `previousLinkRevoked` true. Rotation 422: new row has `accepted_at`, result `already_accepted` (email delivery: the one Resend call already made, none after it). Rotation returns another user: new row `revoked`, result `user_changed` carrying that user. Rotation other error: result brandgeo, `previousLinkRevoked` false.
12b. `rotate true`, email delivery, Resend refuses and the fallback `inviteUserByEmail` answers 429: result `email_rate_limited`, zero `generateLink` calls, and the fake user's `confirmation_token` and `invited_at` are unchanged. The same with a Resend timeout. (Pins re-read M1.)
13. `channelReady`: false for admin, for the kill switch, for an empty key, for a table read error; true otherwise.

`tests/invite_redeem.test.js` (new): every row of the 6.2 table, including: unknown 404 with no `generateLink`; `INVITE_REDEEM_DISABLED=1` 503 with zero table reads; table missing (`42P01`) 404; expired at exactly `expires_at` (strict); replaced before expired; `send_failed` and `revoked` are 404; user missing 404; profile admin or other client 404; accepted user 410 and `accepted_at` stamped; `generateLink` 422 is 410; happy path calls `generateLink` with `type 'invite'` and the STORED address, answers the fake's `hashed_token`, the 200 body's keys equal exactly `ok, token_hash, type`, bumps `redeem_count`, and a SECOND redeem of the same token also answers 200 (not consumed on mint); conditional update hitting zero rows (row superseded between read and update) answers 410 `replaced`, never returns the minted hash, and calls `generateLink` a second time; race guard deletes a fresh profile-less different user and spares one older than 60 s and one with a profile; limiter false gives 429 with zero table reads; limiter RPC error proceeds; the token rate key holds 16 hex chars, not the full hash; `Cache-Control: no-store` on every answer; foreign Origin 403; no log line holds token, hash, address, `action_link` or `email_otp`.

`tests/resend_invite.test.js` (extend). Assertions that change ON PURPOSE: `:208` and `:229` expect 1440, not 60; `:212` (list row key set) gains `link_channel`, `link_expires_at`, `link_last_pressed_at`; `:301` (audit meta) gains `channel`, `delivery`, `invite_link_id`. New: with the TTL env unset, a Supabase row invited 2 h ago reads a `link_expires_at` in the future and one invited 25 h ago in the past; list with an active row (fields of 6.3, `invited_at` taken from the row, an EXPIRED active row still reports its own `expires_at`); list survives a table read error with `link_channel 'unknown'`; resend email returns `channel 'brandgeo'`, `link_expires_at` 7 days out and `previous_link_revoked true` (MUST FAIL before the change); copy returns `invite_url`, sends nothing, carries `Cache-Control: no-store`; legacy `{ email }` with `delivery 'copy'` is 400; audit meta carries `channel` and `delivery` and no address; `user_changed` runs the tightened race guard; the 60 s rule replaces the 10 minute window. The rest of sections 1 to 8 stay green.

`tests/helpers/fake_supabase_mem.js`: `generateLink({ type: 'invite' })` runs the same `authBehaviour.beforeInvite` and `authBehaviour.invite` hooks as the fake `inviteUserByEmail`, honours `stampCreatedAt`, treats an existing unconfirmed user exactly as the fake `inviteUserByEmail` does under the same flags (so a race test behaves the same on both branches), refuses a confirmed one with 422 `email_exists`, writes a new `confirmation_token` value on the user at every call, stamps `invited_at`, records `db.generatedLinks`, and returns `{ user, properties: { hashed_token: <56 hex>, verification_type: 'invite', action_link, email_otp } }`; other types keep today's answer (the affiliate tests depend on it); a unique index entry for `client_invite_links.token_hash` and the one-active rule; the `returning` and conditional update used by 6.2; a table-missing switch answering `42P01`.

Provisioning suites (`tests/provision_client.test.js`, `tests/provision_locations.test.js`, `tests/explee_import.test.js`, `tests/refresh_cadence.test.js`): every provisioning case runs TWICE, once with `INVITE_LINK_CHANNEL=supabase` (pins today's path byte for byte) and once with the channel on, `RESEND_API_KEY` set to a dummy test string and `sendBrandedEmail` stubbed through the require cache to `{ ok: true }` (pins the new path). The race tests (`provision_client.test.js:91-99`, `:446-456`, `:505`, `:510`; `explee_import.test.js:427`, `:491`, `:510`, `:1292-1363`) must pass on both runs, with their hooks firing at the call that creates the user. Assertion that changes ON PURPOSE: `provision_client.test.js:516-524` accepts `generateLink(` or `inviteUserByEmail(` as the first call after Check B, and gains `deliverInvite` between the "ours" test and `onStep('invite')`, and `channelReady` before `loadAuthEmails`. New cases: viewer with the channel on uses `generateLink` and one Resend email, zero `inviteUserByEmail`; admin role uses `inviteUserByEmail`; table missing with the channel on uses `inviteUserByEmail` only (M3); delivery failure returns `{ ok:false, stage:'invite', code }` with no `userId`, deletes the user and the client; "not ours" on the `generateLink` branch makes exactly one `inviteUserByEmail` and keeps `inviteSent: true`; "not ours" on the `generateLink` branch with a failed restore still returns `inviteSent: true`, and the lead import stamps `invite_sent_at` and stops with `not_ours` (`tests/explee_import.test.js:1359-1367` must pass on both runs with its fixture unchanged).

Invite-count assertions on the channel-on run (today `db.invites` is asserted in `explee_import.test.js`, `provision_client.test.js` and `provision_locations.test.js`, and every such assertion is wrong by construction on the channel-on run, because the user is created by `generateLink` and the email goes through Resend). Translate each of them through two helpers defined once per suite: `usersCreatedByAuth(db)`, the `generateLink` plus `inviteUserByEmail` calls the fake recorded as creating a user; and `emailsSent(db)`, the stubbed `sendBrandedEmail` calls that answered ok (the stub records each call on `db`) plus the `inviteUserByEmail` calls that answered without error. Expected raw counts on the channel-on run: normal create, 1 `generateLink`, 1 Resend ok, zero `inviteUserByEmail` (helpers 1 and 1); fallback, 1 `generateLink`, 1 Resend refusal, 1 `inviteUserByEmail` (helpers 1 and 1); not ours, 1 `generateLink`, 1 `inviteUserByEmail`, zero Resend. An assertion that counted emails today asserts `emailsSent(db)` with the same expected number on both runs; one that counted created users asserts `usersCreatedByAuth(db)`. A `generateLink` call is never counted as an email: it sends nothing. No fixture flag (`inviteResendsPending`, `stampCreatedAt`, `authBehaviour`) may differ between the two runs of one case. A case that cannot hold the same expected number on both runs is reported to the orchestrator, not resolved by changing a fixture.

bg-app: `tests/invite_link_client.test.js` (new): `parseInviteToken` (fragment; a query `t` alone gives null; 42 and 44 chars refused; `+` and `/` refused; malformed URL null), `linkStateFromExpiry` (null, unparseable, boundary), and a mirror check that reads `src/lib/inviteLink.ts` and `netlify/functions/_invite_link.js` as text and asserts the two `INVITE_TOKEN_RE` literals are equal.

Untested, stated: real GoTrue `generateLink('invite')` on the deployed version (source read on master), its 422 text; real Resend delivery, spam placement, the stored-email exposure and click tracking; a real mail scanner; the browser flow; the RLS lockdown beyond R4 and R5; the generateLink-then-inviteUserByEmail sequence in provisioning after a live Resend refusal (never run in production, bounded by M3 to that case).

---

## 11. Performance and cost budget

- Entry chunk: at most +0.3 kB (one lazy route). New `Invite` chunk at most 6 kB raw. Onboard lazy chunk (the panel) at most +3 kB. No new dependency.
- `/invite` load: 0 function calls (plus the `ResetPassword` chunk prefetch, a static asset). Continue: 1 invocation, at most 9 Supabase round trips (2 rate RPCs, 1 lookup, `getUserById`, 1 profile read, `generateLink`, 1 conditional update; on a zero-row update, 1 more `generateLink` and 1 re-read). Then the existing `verifyOtp` and `updateUser`.
- Each resend issue: 2 Supabase writes, 1 GoTrue rotation, 1 Resend POST bounded at 8 s, 1 audit insert. Each provisioning issue: 1 readiness read, 2 writes, 1 Resend POST. Fallback adds 1 write and 1 GoTrue call.
- List: +1 Supabase read.
- No cron. Resend emails replace Supabase emails one for one, outside Supabase's email rate limit, subject to the Resend plan's own quota; a Resend refusal degrades to today's behaviour.

---

## 12. Packets (disjoint write scopes) and order

0. **bg-verify (Opus), read-only, BEFORE the build: DONE.** Two design reviews, both BLOCK, both closed by this amendment. 0b, the read-only re-read, DONE: `docs/qa/invite-link-7-days-design-rereview-2026-11-13.md`, four MEDIUM (M1 to M4), all closed by the second amendment (sections 0, 3, 4, 6.1, 6.4, 10).

1. **bg-backend (Opus).** scope_write:
   - `db/supabase-client-invite-links-2026-11-13.sql` (new)
   - `brandgeo-dashboard/netlify/functions/_invite_link.js` (new)
   - `brandgeo-dashboard/netlify/functions/invite-redeem.js` (new)
   - `brandgeo-dashboard/netlify/functions/resend-invite.js`
   - `brandgeo-dashboard/netlify/functions/_provision_client.js`
   - `brandgeo-dashboard/tests/invite_link.test.js` (new)
   - `brandgeo-dashboard/tests/invite_redeem.test.js` (new)
   - `brandgeo-dashboard/tests/resend_invite.test.js`
   - `brandgeo-dashboard/tests/provision_client.test.js`
   - `brandgeo-dashboard/tests/provision_locations.test.js`
   - `brandgeo-dashboard/tests/explee_import.test.js`
   - `brandgeo-dashboard/tests/refresh_cadence.test.js`
   - `brandgeo-dashboard/tests/helpers/fake_supabase_mem.js`

2. **bg-app (Sonnet), in parallel with 1.** scope_write:
   - `brandgeo-dashboard/src/lib/inviteLink.ts` (new)
   - `brandgeo-dashboard/src/pages/Invite.tsx` (new)
   - `brandgeo-dashboard/src/App.tsx` (one lazy import, one public route)
   - `brandgeo-dashboard/src/components/PendingInvitesPanel.tsx`
   - `brandgeo-dashboard/src/pages/Onboard.tsx` (`:730` text, `:822` comment only)
   - `brandgeo-dashboard/tests/invite_link_client.test.js` (new; reads `_invite_link.js` as text, never writes it)

Disjointness: no path appears in both lists; the two share only the contracts of section 6. Nobody touches `stripe-webhook.js`, `signup-client.js`, `onboard-client.js`, `explee-import-background.js`, `accept-terms.js`, `_terms_gate.js`, `expire-plan-grants.js`, `_affiliate_stripe.js`, `_plans.js`, `_email.js`, `_auth.js`, `_prospect_guard.js`, `client-api-keys.js`, `tests/helpers/affiliate_test_env.js`, `ResetPassword.tsx`, `authLinkState.ts` or `netlify.toml`.

3. **bg-verify (Opus)** on the combined diff (auth, rate limits, the rotation, the fallback paths, the copy-link exposure, the doubled provisioning runs).

4. **Orchestrator** runs `tsc`, the node tests and the build on a machine with memory to spare, commits by pathspec, and hands the owner step 5 of section 0.

5. **Owner live check, after the push and the hard reload** (in place of section 0 step 6):
   1. In the admin browser, open Onboard: plan Free, one prompt, access Viewer, contact an address on the project's own domain that he reads (written here as the placeholder `invite-test@example.com`). The wizard starts a small Free collection.
   2. Open that email in a PRIVATE window (so the admin session is not replaced), press "Set up my login", then Continue, set a password, and see "Password saved".
   3. Back in the admin window, reload Pending invites: the row has left the pending list or reads accepted.
   4. In the private window, open the same email link again: it reads "This invite was already used".
   5. Delete the test client: Account, Delete account.

---

## 13. Open questions (the build uses the default)

| # | Question | Default |
|---|---|---|
| Q1 | Should self-serve signups (`signup-client.js`) also get a 7 day link? | No, this release (section 2). |
| Q2 | (closed) Email OTP expiration. | 86400 s (owner, 2026-11-13). Not changed by this work. |
| Q3 | (closed, now a precondition) Click and open tracking on the Resend sending domain. | Must be OFF; owner confirms by looking (section 0 step 1). If on, stop before the push. |
| Q4 | Reply-to on the invite email? | None, like the other transactional emails. |
| Q5 | A separate "Revoke link" action without sending a new one? | No. Copy link or Resend supersedes and rotates; the bulk SQL of 5.1 covers an incident; deleting the login removes it. |
| Q6 | Should the link be offered to admin-role logins too? | No (section 2). |
| Q7 | The Resend key Netlify uses has Full access (it can read every sent email, including live 7 day links). Swap for a sending-only key? | Ship as is and record it. A swap is the owner's own action in Resend and Netlify, never pasted to anyone, and a separate decision. |

---

## 14. Review findings not applied

| Finding | Reason |
|---|---|
| Delivery L2 (restore the superseded 7 day link when a resend's email fails) | Conflicts with the revocation promise that security MEDIUM-1 makes true and C-P5 states: an admin who presses Resend to cut off a forwarded link must not see it revived by a Resend outage. The fallback still emails a working 24 hour Supabase link, so the lead is not stranded. |
| Security LOW-4, the key swap as a mandatory owner step | The owner rule forbids any step that has him paste a key. Kept as the exposure statement in section 4 and as Q7 with a default; the look-only check stays (section 0 step 2). |
| Security LOW-5, a "query token" stage that tells the person to ask for a new link | Not needed: with the fragment as the only channel, a query token gives the existing `invalid` stage, whose copy already says to ask for a new link. |
| Security I1, the extra `pending` rule for a user with a row but no `invited_at` | Removed rather than kept: GoTrue stamps `invited_at` on a user created by `generateLink`, so the rule had no case to cover. |
