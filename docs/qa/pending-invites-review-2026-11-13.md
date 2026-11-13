VERDICT: PASS WITH FINDINGS (0 blocker, 0 major, 0 medium, 2 low, 6 info)

# Pending invites review, 2026-11-13

Reviewer: bg-verify (Opus), read only. Subject: the uncommitted "pending invites" change of 2026-11-11:
`brandgeo-dashboard/netlify/functions/resend-invite.js`, `brandgeo-dashboard/src/components/PendingInvitesPanel.tsx` (new),
`brandgeo-dashboard/src/pages/Onboard.tsx`, `brandgeo-dashboard/netlify.toml`, `brandgeo-dashboard/tests/resend_invite.test.js` (new),
`db/supabase-client-events-invite-resent-2026-11-11.sql` (new, not applied).

Method: every file above read in full from the working tree, plus `_auth.js`, `onboard-client.js`, the two earlier
`client_events` CHECK migrations, the `client_events` insert sites, the shared `ui` Button and tailwind tokens.
No git command was run (so the old version of `resend-invite.js` was judged only from its own header comment), no
tsc, no build, no browser, no database. One command was run:

```
node tests/resend_invite.test.js   (from brandgeo-dashboard/)
...
  ok - legacy runs the same checks: accepted 409, self-serve 409, admin with no client 404, no invite

39 checks passed
exit 0
```

Safe to commit as it stands? **Yes.** No blocker, no major, no medium. The two LOW findings can ride as follow-ups.

---

## 1. Findings

### L1, LOW: the race guard can delete a legitimate login in a narrow window
`resend-invite.js:332-355`. When `inviteUserByEmail` returns a user id different from the one resolved, the code
deletes that user if its `created_at` is within 10 minutes before the request started, or if `created_at` does not
parse (`:338-339`, `!Number.isFinite(createdMs)` counts as fresh).

Concrete scenario: the admin opens the legacy wizard resend (or a panel row) for viewer A. Between the resolve and the
send (the legacy path first pages all auth users, `:295`, so the window is a full listing long), A's client is deleted
(`delete-client.js` removes the auth user) and the same address is onboarded again through `onboard-client.js`, which
creates user B by invite. The resend then calls `inviteUserByEmail(address)`; GoTrue finds B unconfirmed, re-invites
it and returns B. `B.id !== A.id`, B was created minutes ago, so B is deleted although it is a real, intended login
created by another admin path. Whether B's `user_profiles` row survives depends on the FK behaviour, which was not
checked. Likelihood is very low (needs a delete and a re-onboard of the same address inside the request), but the
action is destructive and silent to the second admin flow.

What the rollback deletes in the intended case: only the auth user GoTrue created for the address in that call, never
the resolved user, never a user whose `created_at` is older than 10 minutes (test section 6 proves the old-user branch
does not delete).

Fix: delete only when the returned user was demonstrably created by this call: require a parseable `created_at` no
earlier than `startedAt` minus a small clock allowance (for example 60 s, not 10 min), and refuse the delete when a
`user_profiles` row exists for `sent.id` (a profile means some flow bound it on purpose). Treat an unparseable
`created_at` as "not fresh" (no delete, log, 409).

### L2, LOW: panel types claim non-null fields the server can send as null
`PendingInvitesPanel.tsx:28-29` types `client_name: string` and `plan: string`; `resend-invite.js:211-212` returns
`null` for both when the client row is not found (`clients.get(...) || null`). Result: `aria-label="Resend invite to
null"` (`PendingInvitesPanel.tsx:183`), an empty accent `Badge` and a blank company cell. Reachable when a viewer
profile points at a client id with no `clients` row (the list filter at `resend-invite.js:191` keeps any non-null
`client_id`). The resend itself then answers 404 (`loadClient`, `:269`), so no wrong email is sent.

Fix: type both as `string | null` and render a fallback ("Unknown company", `Client #<id>`) in `CompanyCell` and the
aria-label.

### I1, INFO: `auth_users_truncated` is never read by the panel
`resend-invite.js:245` adds it past 20 pages of 1,000 users; `PendingInvitesPanel.tsx` never reads it, rows past the
cap become `missing_user` and are filtered out of the pending list (`:199`), and the empty state then says
"Everyone you invited has accepted" (`:242`). The legacy `{ email }` path past the cap answers "No login exists for
that address" (`:300`) without saying the listing was cut. Unreachable below 20,000 auth users. Fix when convenient:
show a warn `Notice` when the flag is present, and return `read_failed` or a distinct code from the legacy path when
`truncated` is true and no match was found.

### I2, INFO: two sentences state things the code does not establish
`resend-invite.js:253` (`NOT_INVITED`) says a login without `invited_at` "was created by a self-serve signup". Self-serve
signup in `signup-client.js:120` uses `inviteUserByEmail`, so an unaccepted self-serve signup reads `pending` and is
resendable, and `not_invited` comes from other creation paths. The panel empty state (`PendingInvitesPanel.tsx:242`)
"Everyone you invited has accepted" is also false when `not_invited` or `missing_user` rows exist. Route to bg-copy.

### I3, INFO: the "predates the request" race branch answers 409 `not_found` after an email was sent
`resend-invite.js:341-344`. In that branch GoTrue has already sent an invite to the other user's address, no audit row
is written, and the admin sees "No pending invite was found". Not exploitable (the address is the stored one), but the
admin is told nothing went out when something did. Consider a distinct code (`race_other_user`) and an audit row.

### I4, INFO: no server-side throttle on resends
The only throttle is the panel's 60 s per-row lock (`PendingInvitesPanel.tsx:79`, `:411-417`) plus the Supabase Auth
email rate limit (mapped to 429 at `resend-invite.js:324-326`). Two admin tabs, or a script holding an admin token, can
send repeatedly to one address up to Supabase's limit. Admin-only, so not an abuse path for a viewer or the public.
Not verified: whether each GoTrue invite invalidates the previous link (if it does, a quick double resend kills the
link the person may be clicking).

### I5, INFO: link lifetime is a hand-kept mirror
`INVITE_LINK_TTL_MINUTES` (`resend-invite.js:55-58`, default 60) mirrors the Supabase "Email OTP expiration". The
default 3,600 s matches 60 minutes, but the project's actual setting was not read. If it differs, the panel's "Link
expired" / "Link valid" badges are wrong. Read the setting once and record it in the header.

### I6, INFO: the migration is a drop then add without an explicit transaction
`db/supabase-client-events-invite-resent-2026-11-11.sql:29-43`. The SQL Editor runs a paste as one transaction, so this
is fine there; run statement by statement in an autocommit client, there is a moment with no CHECK at all. Wrapping it in
`begin; ... commit;` costs nothing.

---

## 2. What was confirmed, by area

**Authorisation.**
- `requireAuth(event, { adminOnly: true })` is the first statement of the handler (`resend-invite.js:134-135`) and the
  service-key client is created only afterwards (`:153`). There is one handler and every action (`list`, `resend`,
  legacy `{ email }`) runs after it, so a viewer cannot reach any of them.
- `_auth.js:67-122`: OPTIONS gets a preflight and nothing else; a present but foreign `Origin` is 403; a missing Origin
  is allowed (pre-existing, logged in the comment at `:76-79`); a Bearer token is required and verified with
  `auth.getUser`; the role comes from `user_profiles` and `adminOnly` refuses anything but `admin`. A missing profile
  is 403. So an unauthenticated caller gets 401, a viewer 403, before any listing or email.
- Legacy `{ email }` (`resend-invite.js:172-177`, `:294-307`): the request address is only used to find an EXISTING
  auth user in the full listing; no match is 404 before `inviteUserByEmail`. The address sent is `user.email`, the
  stored one (`:319`). An address with an auth user but no profile, or a profile with no client, or a client id with
  no `clients` row, is refused. So the legacy path cannot make Supabase create or email an arbitrary address, apart
  from the race window in L1 and I3, where the address is still one that belonged to a resolved user.
- `inviteUserByEmail` is called at exactly one place (`:319`), in `sendInvite`, after `isAccepted` and `invited_at`
  checks.
- The panel sits behind the `isAdmin` early return: `Onboard.tsx:94` returns before the JSX that mounts it at
  `Onboard.tsx:517`. This is presentation only; the server gate above is what protects the data.

**Abuse and cost.** Listing is bounded at 20 pages of 1,000 (`:63`, loop `:110-118`); the test proves the stop on a
short page and at the cap. A resend by `user_id` reads one profile, one client and one `getUserById`, no listing (test
section 4 asserts zero list calls). By `client_id` it does one `getUserById` per viewer of that client. `list` cost is
two PostgREST reads plus ceil(users / 1000) `listUsers` calls; with today's user count that is one page. The worst case
time at the cap (20 sequential `listUsers` calls) was not measured against the 26 s timeout.

**Data exposure.** `list` returns, per viewer: user id, client id, client name, plan, category, email, role, three
timestamps, accepted flag, status. Admin only. Error sentences are fixed strings; the legacy 404 does not echo the
address (asserted by the test). Driver and GoTrue messages go to the log only, never the body (asserted for
`read_failed` and `invite_failed`). Logs carry user ids, client ids and GoTrue messages, no email written by this code.
The audit row meta is `{ source, user_id, via }`, no address (asserted). The success body echoes `user.email`, the
stored address, which the admin already sees in the list.

**Correctness.**
- Status: no auth user is `missing_user`; `email_confirmed_at` or `last_sign_in_at` is `accepted`; otherwise
  `invited_at` decides `pending` versus `not_invited` (`:86-95`). Consistent with how `onboard-client.js` /
  `_provision_client.js:226`, `signup-client.js:120` and `stripe-webhook.js:678` create users (all by invite).
- Works without the migration: the audit insert is the last step (`:363-377`), wrapped in try/catch, an `error`
  result only logs, and the response is built afterwards with `audit_logged: false`. Test section 4 proves a CHECK
  refusal still answers 200.
- Redirect target `https://app.getbrandgeo.com/reset-password` (`:49-50`), the same target as `signup-client.js:122`
  and `stripe-webhook.js:680`, so it is already on whatever allow list those use.
- Link text: header (`:7-10`) and `Onboard.tsx:492` both say about an hour, matching the default of
  `linkTtlMinutes()` (see I5).
- `netlify.toml:171-172`: `[functions."resend-invite"] timeout = 26`.

**Panel.** No email input anywhere; a resend always posts `{ action: 'resend', user_id, client_id }` from a listed row
(`:405`). Per-row state keyed by `user_id` with an in-flight set against double clicks, `loading` disables the button,
60 s sent lock, timers cleared on unmount. Demo mode: the load effect returns before fetching (`:389-392`) and the
component renders `null` (`:435`), so no network call. Loading, error (with Retry), empty and phone card states are
present. Tokens only (`bg-surface-2`, `border-line`, `rounded-card`, `text-ink`, `text-ink-2`, `text-neg`,
`text-pos-ink`, all defined in `tailwind.config.js`), shared `ui` components, no `motion` import, no
`dangerouslySetInnerHTML`. Every `Button` of size `sm` carries `max-md:min-h-[44px]` from `buttonClasses`
(`ui/Button.tsx:21`), so Refresh, Retry and Resend meet 44 px on a phone. `aria-live` on the row result and on the
loading state.

**Tests.** The file loads the real `netlify/functions/resend-invite.js` through `fn('resend-invite.js')`, not a copy.
`_auth.js` is replaced by `installAuthMock`, so the real `requireAuth` is not exercised by it; I confirmed the gate by
reading `_auth.js` instead.

**SQL.** Additive and safe to re-run (`drop constraint if exists` then `add constraint`); the new list is a superset of
the old one, so validation of existing rows cannot fail. Against the two files it names: the eight values of
`supabase-client-events-type-check-2026-07-31.sql:48-57` plus `mcp_fix_marked` from
`supabase-mcp-fix-writes-2026-11-06.sql:163-172`, plus `invite_resent`. A grep of every `from('client_events')` insert
in `netlify/functions/` finds only `trial_expired`, `mcp_fix_marked`, `signup`, `invite_resent`, the
`set-client-plan.js` event types, the `stripe-webhook.js` types and `onboarded`, all in the list.

## 3. Claims with no test

- The real `requireAuth` (mocked in the test).
- L1: a fresh, legitimate user returned by the invite (only the old-user branch and a freshly created orphan are tested);
  an unparseable `created_at`.
- `getUserById` failing with a non-404 error (should be `read_failed`).
- The legacy `{ email }` path when the listing hits the page cap.
- The panel: no component or harness test exists for it.
- Timing of `list` against the 26 s timeout.

## 4. What I did not check

- The diff against the committed version (no git allowed); the old behaviour is taken from the header comment only.
- tsc, `npm run build`, the entry or Onboard chunk size, the other node tests.
- Secret scan and dash scan over the git diff (both need git); I did read every changed file and saw no secret value.
- Real GoTrue behaviour: invite on an existing unconfirmed user, the exact error text for a confirmed one, whether a new
  invite invalidates the previous link, the Supabase email rate limit and the "Email OTP expiration" setting.
- The `user_profiles` foreign key behaviour on auth user deletion (matters for L1).
- The panel in a browser at any viewport, light or dark, keyboard and screen reader, contrast measured.
- The live Supabase redirect allow list, and the migration against production (not applied, not read).
