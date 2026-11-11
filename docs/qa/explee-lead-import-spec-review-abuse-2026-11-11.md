Verdict: BLOCK (the build may not start until the 7 MUST items below are written into the spec). The design itself is sound with those changes: structured verdict SOUND WITH CHANGES.

# Spec review, abuse, auth and data lens: Explee lead import

Reviewer: bg-verify, read-only. Date: 2026-11-11.
Subject: `docs/arch/explee-lead-import.md` (1,007 lines, read in full).
Scope of this lens: reply text as an injection channel, harvested addresses,
accounts bound to the wrong company or person, competitor access, duplicates
and takeover against existing accounts and auth users, the cron gate, the
service key path, role, RLS, third-party personal data, the public repo, dry
run and the kill switch, overlapping runs.

Owner rulings R1 to R4 are taken as given and are not re-argued. Where a
finding touches them (for example a competitor replying), it is recorded as
INFO only.

Method: read the spec, the repo files it cites, and the published Explee
OpenAPI document saved in the session scratchpad (read with a local node
script, treated as data). No npm, tsc, build, server, browser, external call
or git write was made.

---

## 1. Lens checklist (what was attacked, and the result)

| # | Attack | Result | Evidence |
|---|---|---|---|
| 1 | Invite to an address that already has an auth user | **BREAKS** (M1) | `onboard-client.js:160-183`; `resend-invite.js:319-333` calls `inviteUserByEmail` on an existing pending user and expects the same id back |
| 2 | Two runs, one person or one company | **BREAKS** (M2) | spec `:436-445`, unique indexes only on `decision='created'` at `:739-742` |
| 3 | Inbound reply sent by someone other than the contacted person | **UNDEFINED, can bind a stranger** (M3) | spec rule 9 `:225` never says which address is the replier; Explee `InboxContactItem.email` is null when a colleague or our team replied |
| 4 | Lead marked Lost or Unqualified after first sight, then re-decided | **BREAKS R2** (M4) | spec `:233-235`, `:417-419`; Explee says a status change does not bring a conversation back |
| 5 | Replies from a non-BrandGEO Explee project | **BREAKS** (M5) | spec `:681` `project_ids` empty means every project the key reaches |
| 6 | Free-mail or platform domain as Explee `company_domain` | **BREAKS D4 promise** (M6) | spec `:291-298` applies `FREE_MAIL_DOMAINS` only to the fallback |
| 7 | Erasure after account creation | **BREAKS** (M7) | spec `:193-197` vs CHECK at `:736`; Explee hides such conversations from the feed |
| 8 | Reply text into the prompt generator | holds | generator input is domain, country, homepage, company name (spec `:346-357`) |
| 9 | Reply text into stored data or admin UI | holds with gaps (S3, S4) | excerpt 280 chars masked (`:187-192`); `_email.js:144-154` escapes paragraphs |
| 10 | Referral harvesting an address not in the text | holds | literal substring asserted (`:257-260`, criterion 3) |
| 11 | Role escalation to admin | holds, weakly (S6) | `onboard-client.js:108`; helper honours role by a `source` string (`:864`) |
| 12 | RLS on the new tables | holds | spec `:748-753`; `is_admin()` reads `user_profiles.role` (`db/supabase-multitenant-migration.sql:48-51`); viewers can only read their own profile row (`:66-67`) |
| 13 | Cron gate and unauthenticated reach | holds, doc wrong (S1) | `_cron_auth.js:49-77`; background functions answer 202 to everyone |
| 14 | Dry run creating or sending | holds if S2 is applied | spec `:411-414`, criterion 4 |
| 15 | Kill switch failing open | gap (S2) | spec `:422-425`: off applies from the next run only |
| 16 | Service key and Explee key exposure | holds with gaps (S5) | `_observability.js:45-55` scrub; the Explee key has write scope over campaigns, budgets and suppress lists |
| 17 | Public repo exposure | holds | spec criterion 12; no ids, keys or addresses in the DDL |
| 18 | Competitor replying to get monitoring | INFO, ruled by R2 | see section 5 |

---

## 2. MUST change before a build

### M1. An existing unconfirmed auth user is re-invited, then deleted by the rollback

**What.** The shared helper keeps the rollback chain "as `onboard-client.js:165-211`"
(spec `:446-449`). That chain inserts `user_profiles` with
`id = authData.user.id` and, on failure, calls
`supabase.auth.admin.deleteUser(authData.user.id)`
(`onboard-client.js:175-183`). GoTrue does not refuse an invite for an address
whose user exists but has not confirmed; it re-sends and returns the SAME user.
The repo depends on exactly that behaviour: `resend-invite.js:319` calls
`inviteUserByEmail` on an existing pending user and treats a returned id equal
to the resolved user as success (`:330-333`). Only a confirmed user produces
the "already registered" error the spec relies on (D5 duplicate 2, `:317-318`).

**Exploit path, concrete.**
1. The admin onboarded client A by hand last week; the invite to
   `owner@a.example` is still pending (it appears in the new
   PendingInvitesPanel).
2. The same person replies to a cold email from a campaign about a sister
   brand. Explee profile `company_domain = b.example`, so D5 duplicate 3 (domain)
   does not match, and D5 duplicate 1 only looks at `explee_leads`.
3. The importer inserts client B, calls `inviteUserByEmail('owner@a.example')`,
   gets back the existing user id U, inserts `user_profiles(id=U)`, which fails
   on the primary key, and the rollback runs `deleteUser(U)`.
4. Result: client A loses its only login (the profile cascades), the person
   receives a second invite email whose link is dead, client B is deleted, the
   row is recorded `failed provision_error` and retried next run, which repeats
   nothing harmful only because U is now gone. A paying or hand-sold client can
   be silently disconnected by an automatic job.

The same path fires for a self-serve signup that never confirmed
(`signup-client.js` creates the auth user with no profile): there the profile
insert SUCCEEDS and the importer binds a stranger's pending self-serve user to
a new Free client it chose. `signup-client.js:24-27` records this exact hazard
class ("a deleteUser on a pre-existing account") as removed from that path; the
spec reintroduces it on an unattended path.

**Fix (smallest).** In `_provision_client.js`, before step 1, resolve the
address the way `resend-invite.js` does (a lookup of the auth user by email).
If any auth user exists, return `{ ok: false, code: 'email_registered' }`
without creating anything, so the importer records `already_customer`. Keep
the compensating delete only for a user whose id did not exist before the call
(the `resend-invite.js:330-340` race guard pattern). Add to
`tests/provision_client.test.js`: an existing pending user and an existing
profile-less user each give `email_registered`, zero `deleteUser` calls, and
the existing user untouched. Note in the spec that this also closes the same
latent defect in the admin wizard (PRE-EXISTING, section 4).

### M2. Overlapping runs create two accounts; the unique indexes fire only after the emails went out

**What.** The claim is per `person_id` (`:437-441`). The email and domain
uniqueness is enforced by partial indexes `where decision = 'created'`
(`:739-742`), and the spec calls them "the last line" (`:443`). The row only
becomes `created` after provisioning, which already sent the invite. The
domain list of existing clients is read once per run (`:321-322`) and the daily
cap is counted from `created_at_account` (`:427`), so neither sees work in
flight in another run.

**Exploit path.** The owner runs the dry pull or a manual `net.http_post` by
hand (D13 step 4 says he may, `:638-640`) while the :35 cron run is mid-flight.
Two colleagues at `c.example` both replied (two `person_id`s), or one person
appears under two campaigns as two `person_id`s with the same email.
- Same domain: run X provisions client C1 for colleague 1 while run Y
  provisions C2 for colleague 2. Both invites are sent. Run Y's update to
  `decision='created'` violates `uq_explee_leads_created_domain`, the row stays
  `processing`, the account C2 exists unrecorded: no note, no enqueue retry,
  no summary line, and it is reclaimed after 20 minutes (`:442`) where D5
  duplicate 3 now skips it as `already_customer`. An orphan the owner cannot
  see.
- Same email: run Y's invite returns run X's still-unconfirmed user, so M1
  fires and run Y's rollback deletes run X's auth user. Client C1 is recorded
  `created` with no login.
- Both runs read `createsToday = 29`, both create 5: the daily cap is 30 on
  paper and 34 in practice.

**Fix (smallest).** Make the claim cover the identity, not only the person:
before any side effect, a conditional UPDATE sets `decision = 'creating'` with
`email_sha256` and `company_domain` filled, and both partial unique indexes
become `where decision in ('creating','created')`. A 23505 on that UPDATE
means another run owns the identity: skip, retry next run. Count
`creating` plus `created` rows for the daily cap. Write `client_id` and
`user_id` to the row immediately after the client insert, so a killed run
leaves a traceable row, not an orphan. Criterion 7 must be tested with the two
runs interleaved INSIDE provisioning (the fake invite yields between calls),
not run one after the other.

### M3. "Replier email" is undefined; the wrong address can own the account

**What.** Rule 9 says "no replier email" (`:225`) and D4 uses
`ctx.replierEmail` (`:832`), but the spec never says which field that is. The
input type carries three candidates: `item.email`, `thread.lead.email` and
each inbound `messages[].from_email` (`:806-815`). Explee documents that
`InboxContactItem.email` is revealed only once the contacted person replied
from it, and that a reply from someone else on the thread, a colleague or our
own team, does not reveal it.

**Exploit path.**
- A builder falls back to the latest inbound `from_email`: the contacted CEO
  forwards the cold email to an outside consultant at `rival.example`, who
  replies in the thread. Explee threads it as an inbound reply. The importer
  takes `company_domain = target.example` from the profile (D5 uses the
  profile domain first, `:291-292`) and invites `x@rival.example`, who now owns
  the free account monitoring the target's brand. D5 duplicate 3 then blocks
  the real company from ever getting an account through this path
  (`company_has_account` / `already_customer`), and the Explee note tells the
  owner the target has an account.
- A builder falls back to `thread.lead.email`: a colleague replied, the
  contacted person never did, and the contacted person gets the account,
  against R2 ("never people who did not reply").

**Fix (smallest).** Define it in D3: the replier is `item.email`, used only
when it is non-null AND equals (case-insensitive) the `from_email` of at least
one inbound message in the thread. When `item.email` is null but inbound
messages exist from another address, the lead is held as
`replied_by_other` (soft), never invited; the owner can extend later. Add both
cases to the D3 test table.

### M4. Stored rows are re-decided on stale status, so Lost and Unqualified leads get accounts

**What.** Held rows are re-decided when the owner adds a label, "at most 50
per run" (`:233-235`), and `would_create` rows are re-decided on the first live
run (`:417-419`). Rule 3 (Lost, Unqualified) reads `lead_status` from the feed
item (`:219`). Explee states that `lead_status` is as of the call and that a
status changed in the app does NOT bring the conversation back. The thread
response has no `lead_status` field at all.

**Exploit path.** Day 1, dry run: a reply classified `question` is held as
`unknown_intent` with `lead_status = null`. Day 3: the team reads it and marks
the lead Unqualified in Explee (no feed event). Day 5: the owner adds
`question` to `include_intents` and switches to live. The next run re-decides
the stored row, rule 3 sees the stored null, and an account plus invite go to
a lead the team excluded. The same holds for a lead that unsubscribed or asked
to be erased in between: the feed hides it (Explee: a hidden conversation stops
coming back), so only a fresh thread read would show it, and the spec does not
say the re-decision re-reads the thread.

**Fix (smallest).** State in D3 and D8: no account is created from stored
data. Every create, first sight or re-decision, uses a thread fetched in the
same run (erased, `reply_blocked_reason`, latest intent) and a `lead_status`
read in the same run from `GET /projects/{id}/inbox` (paged once per run into
a map by `person_id`). If either read fails or the person is absent from the
inbox listing, hold. Add a test: a held row whose status changed to Lost in the
fake Explee, with no feed event, is skipped `team_lost` when its label is
added.

### M5. Default project scope is "every project the key reaches"

**What.** `project_ids integer[] not null default '{}'` with the comment
"empty = every project the key reaches" (`:681`), and Q6 defaults to it
(`:984`). An Explee project is per sending domain (`ProjectItem.domain`). The
owner runs more than one business; any other outreach project under the same
Explee account is in scope by default.

**Exploit path.** The key reaches a second project used for recruiting or
another company's outreach. A candidate replies "yes, interested" there. The
importer creates a BrandGEO Free account for the candidate's employer domain
and Supabase sends a BrandGEO invite to a person who has never heard of
BrandGEO, on a domain whose reputation matters, with no human in the loop (R1).

**Fix (smallest).** Fail closed: empty `project_ids` means no project is
polled, and the run records `stage='config', error='no_projects'`. The dry
pull lists the projects the key reaches (id and domain from `GET projects`) in
`job_runs.detail`, and the owner sets the BrandGEO project id explicitly in D13
step 5. Change Q6's default accordingly.

### M6. Free-mail and shared-platform domains are only filtered on the fallback path

**What.** D5 takes `normalizeDomain(profile.company_domain)` whenever
`isPlausibleDomain` accepts it, and applies `FREE_MAIL_DOMAINS` only to the
replier-email fallback (`:291-298`). `isPlausibleDomain` is a format check
(`_prospect_guard.js:64-68`); it accepts `gmail.com`, `outlook.com` or a
platform host. Explee's enrichment states any field may be wrong or null, and
sole traders are commonly enriched to a mail or platform domain. D4's referral
rule then trusts that domain as "the company" (`:264-265`).

**Exploit path.** Profile `company_domain = gmail.com`. An out-of-office reply
reads "for urgent matters write to someone.else@freemail.example". D4: the address is
literal, sits on the "company domain", and is the only candidate, so a
BrandGEO invite and account go to an unrelated mailbox harvested from reply
text, the outcome D4 says can never happen ("never ... a personal mailbox or a
third party", `:277-279`). Separately, the first such lead creates a client for
brand `gmail.com`, and `uq_explee_leads_created_domain` then skips every later
lead whose profile carries that domain as `company_has_account`.

**Fix (smallest).** Apply the domain exclusion to `profile.company_domain` and
to the D4 candidate domain, not only to the fallback, and extend the frozen
list with shared hosting and profile platforms (for example `wixsite.com`,
`github.io`, `blogspot.com`, `linktr.ee`, `facebook.com`, `linkedin.com`,
`google.com` sites). A hit is `no_company_domain` (final). Test: profile
`company_domain` of a free-mail domain gives `no_company_domain`, and a
referral on it returns null.

### M7. Erasure after creation is never seen, and when seen the update is refused

**What.** Two independent breaks in D2 (`:193-197`).
1. The spec learns erasure only from the change feed. Explee says a hidden
   conversation (for example after an unsubscribe) stops coming back, and an
   erased contact is reduced to a skeleton. A created lead who later asks to be
   removed may never re-appear, so `email`, `company_name` and `reply_excerpt`
   stay on the row indefinitely and no admin event is raised.
2. When it is seen, D2 nulls `email` on a `created` row, but the table CHECK
   says `decision is distinct from 'created' or (email is not null and
   created_at_account is not null)` (`:736`). The UPDATE fails; the plain
   address stays.

The test in D12 (`:606-607`) uses a fake feed that returns the erased item, so
it would pass while production never exercises the path.

**Fix (smallest).** Change the CHECK to
`(email is not null or erased_at is not null)` for `created`. Add a
reconciliation pass, at most once a day, that re-reads the thread of every row
still holding personal data (`email` or `reply_excerpt` not null), oldest
check first, capped (for example 100 threads a day, about 0.01 of the hourly
Explee limit); `erased` there nulls the personal fields and raises the emailed
admin event. Test against a fake in which the erased conversation is absent
from the change feed.

---

## 3. SHOULD change

**S1. The background function answers 202 to anyone; the spec says 401.**
Section 5.2 (`:775`) says 401, 405 and 503 come "before" the platform's 202.
On Netlify a background function returns 202 to every caller and the
handler's return value is discarded, so an unauthenticated caller sees the
same 202 as the cron. The gate still works inside the handler. Consequences to
write into the spec: `requireCronAuth` is the first statement, before reading
settings, env or Explee; an auth failure writes NO `job_runs` row (otherwise
anyone on the internet can fill `job_runs` and trip the watchdog); the owner's
hand-run dry pull must be judged by the `job_runs` row, not by the HTTP answer;
criterion 10 and the 401 test are unit-level only.

**S2. Kill switch and dry run hardening.**
(a) `mode='off'` applies from the next run (`:423-424`), so a run already in
progress can still create up to 5 accounts over 12 minutes. Re-read `mode` and
`paused_until` before each provisioning call. (b) Say that a missing settings
row, an unreadable row or an unknown mode value means `off`, never the column
default `dry_run` or anything higher. (c) Say explicitly that the retry passes
for already-created rows (enqueue, note, follow-up) run in `live` only, so a
body override `{"mode":"dry_run"}` or a switch back to dry run also stops them.

**S3. Retention and minimisation of third-party data.**
- The 30-day excerpt purge runs "by the function itself on every run"
  (`:190-191`), but `mode='off'` returns before anything else (`:409-410`), so
  turning the system off stops the purge. Run the purge before the mode check
  (amend criterion 10), or as its own SQL `pg_cron` statement.
- Store `reply_excerpt` only for rows a human must judge (`unknown_intent`,
  `auto_reply_no_referral`, `would_create`), never for `declined`,
  `team_lost` or `erased`.
- `email_sha256` is an unsalted hash of an address, reversible by anyone who
  holds a candidate address. Dedupe uses only created rows (`:315-316`), so
  store it only for `creating`, `created` and `would_create`.
- Plain `email` on `would_create` rows lives forever if the owner never goes
  live, and on `failed` final rows and undone accounts (`client_id` set null by
  a delete, `:465-468`) it has no remaining purpose. Null it on undo and after
  30 days on `would_create` and final `failed`.
- The excerpt mask covers digit runs of 6 or more (`:189`). A phone written
  with spaces or dots passes. Mask any run of 7 or more digits allowing
  spaces, dots, hyphens, brackets and a leading plus.

**S4. The daily summary email.** It lists "the failed rows, the held rows"
(`:461-462`) and goes to the shared alert mailbox (`_admin_notify.js:22`)
through the email provider. Limit it to counts, reasons, labels and
`person_id`s; no address and no excerpt leaves the database. HTML escaping is
already done by `_email.js:144-154`.

**S5. The Explee key is a full-power key.** The published API lets the same
key create, start and stop campaigns, change budgets and delete suppress lists.
Write into D12: `_explee_client.js` exposes only the calls the importer uses
(projects list, inbox list, change feed, thread read, note read and write,
reply, me) and has no generic request method; `person_id` and `campaign_id`
are validated against a strict pattern and passed through
`encodeURIComponent` before they enter a path, since they arrive from the feed
and a `/` in one would reach another endpoint with a POST; request headers are
never logged. Ask the owner in Q-list whether Explee offers a narrower key.

**S6. Role is controlled by a string.** The helper honours `role` when
`ctx.source === 'onboard-client'` (`:864`). One wrong literal in the importer
re-opens admin creation. Prefer two exports: `provisionClient` (always
`viewer`, no `role` field) used by the importer, and the admin wrapper used by
`onboard-client.js` only. Keep criterion 6 and add a source-text test that
`explee-import-background.js` and `_explee_rules.js` contain no `'admin'`
literal.

**S7. Domain duplicate check is exact match.** D5 duplicate 3 compares the
lead domain to `normalizeDomain(brand_website)` (`:319-322`), which strips only
`www.` (`_prospect_guard.js:70-75`). `shop.acme.example` against an existing
client `acme.example` (or the reverse) creates a second account for a monitored
company. Compare on the registrable domain, in both directions.

**S8. State the generator input as an invariant.** D6 is right that no reply
text reaches OpenAI, but it is implicit. Add: the OpenAI request body never
carries reply text, a person's name or an email address; assert in
`explee_import.test.js` that the captured generator request contains none of
the fixture reply sentences and no `@`.

**S9. A created lead who later declines or writes "remove".** The follow-up
copy tells people to reply "remove" (`:497-498`). Such a reply resurfaces in
the feed, but `created` rows are final and only `erased` raises an event. Raise
an emailed admin event when a created row's thread shows a new inbound
message with a declining or unsubscribe intent.

**S10. Dry pull output stays in the database.** D13 step 5 has the owner
review real labels and decisions. Add a line that nothing from those SELECTs
is written into `docs/` or any committed file, since the repository is public.

**S11. Referral over-match.** Explee states `body_text` already has quoted
history stripped, which helps. Still, a signature block can list several
colleagues; "exactly one remaining" (`:266`) handles that. Add one guard: if
the inbound body holds more than 3 distinct addresses in total, return null.

---

## 4. Pre-existing findings (not caused by this change, recorded separately)

- **PRE-EXISTING, M1 root, live in the admin wizard today.**
  `onboard-client.js:175-183` deletes the auth user returned by the invite when
  the profile insert fails, without checking that the user was created by this
  call. An admin onboarding a client with the address of a pending invitee of
  another client deletes that invitee. Low frequency because a human chooses
  the address; not a live external exposure. The M1 fix in the shared helper
  closes it for both callers.
- **PRE-EXISTING, low.** `fetchHomepageSignal` follows redirects to any host
  (`_prospect_prompts.js:29-31`), as the public audit path already does with a
  visitor-supplied domain. The importer adds Explee-supplied domains to the same
  call. No exploit was demonstrated here; the off-domain redirect refusal used
  by the contact route resolver is the model if it is ever hardened.

---

## 5. INFO

- **Competitor recon (ruled by R2).** A competitor in the owner's own lead
  list who replies gets a Free viewer account. Viewer isolation is unchanged:
  `explee_leads` and the settings row are admin-only by RLS, `job_runs` has RLS
  with no policy, and `is_admin()` reads a role a viewer cannot write. Only
  the owner's own campaigns can feed the importer once M5 is applied.
- **Prompt injection via the lead's homepage.** Title, description and
  `og:site_name` are lead-controlled and reach the generator. The validator
  (no URL, no braces, 15 to 200 characters, no brand term) bounds the outcome
  to five odd prompts shown only to that lead and five Gemini checks of cost.
- **Webhook.** None in release one, so there is no signature, replay or timing
  surface to review. Any later "kick" endpoint must sit behind the same cron
  gate.
- **Public repo.** The DDL, the commented cron statement (Vault lookup, no
  value) and the test plan carry no id, key or address. Criterion 12 holds as
  written.

---

## 6. Regression surface (by citation, not by grep of a diff; no code exists yet)

The build will touch a live admin path. Callers that need a manual look after
it: `onboard-client.js` (refactored onto the helper), `src/pages/Onboard.tsx`
(caller, uncommitted edits by another session, must stay untouched),
`resend-invite.js` and `PendingInvitesPanel.tsx` (read the same auth users the
helper will now pre-check), `delete-client.js:75-91` (the undo path, now
leaving `explee_leads.client_id` null), `_enqueue.js` (new server-side caller
with `trigger='scheduled'`).

## 7. Data and claim integrity

The spec's Explee claims were checked against the saved OpenAPI document:
the intent examples (`hot_lead`, `not_interested`, `out_of_office`,
`unsubscribe`), the absence of domain and country on the feed item, the
`LeadProfile` fields, `can_reply` and `reply_blocked_reason`, the "hidden
conversation stops coming back" rule, and the fact that a status change does
not resurface a conversation (the last two are what M4 and M7 rest on). Two
facts the spec under-uses: `InboxContactItem.email` is null when someone other
than the contact replied (M3), and `ThreadMessage.body_text` already has quoted
history stripped (S11). The 10,000 requests an hour figure was not re-read
here either.

## 8. What was not checked

- GoTrue's exact answer for an invite to an existing unconfirmed user was
  inferred from how `resend-invite.js` uses it, not reproduced against Supabase.
- Whether Netlify retries a failed background invocation was not checked;
  M2 stands on the manual-run overlap alone.
- The Supabase SMTP hourly limit and invite link lifetime (owner's settings).
- Real Explee payloads, labels, plan and key scope: no key exists on our side.
- Whether Explee's enrichment really returns free-mail or platform domains as
  `company_domain` in this owner's data (M6 rests on the field being
  unconstrained and documented as possibly wrong).
- Correctness of D6 prompt quality, D7 budget arithmetic, the market mapping
  and the follow-up timing: other lenses.
- No test, build or `tsc` was run; nothing exists to run.
