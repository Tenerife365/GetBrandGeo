# FAIL

One review of packets `020` (contact route resolver and promotion) and `021`
(reply handling parts A and B), run against the final working-tree state on
2026-08-20. `bg-verify`, Opus. Nothing in the reviewed code was edited. No
writing git command was run. Every production write happened inside a
transaction that was rolled back, and the rollback was verified afterwards.

## Why FAIL and not PASS WITH FINDINGS

Four independent reasons, any one of which is sufficient.

1. **Two of the packets' own headline claims are false.** `021` claim 7
   ("sender matching cannot misattribute") and `021` claim 2 ("the backfill
   guard actually holds") both break under a case I reproduced. Both produce
   the same outcome: a prospect's outreach record becomes untrue, which is the
   one thing `prospect_touches` exists to prevent. See F1 and F2.
2. **The S1 `occurred_at` floor, closed as BLOCKING on 2026-08-15, is reopened
   on the new poller path.** `recordTouch()` validates nothing by design, and
   the poller is the caller that does not re-apply the bound. A remote sender
   controls the value. See F3.
3. **`npm run build` does not pass in the tree that would be committed.** The
   cause is not `020` or `021`, and I prove that below, but a reviewer cannot
   certify a build it watched fail. See F4 and the tree-instability warning.
4. **`020` claim 5, as restated in this review's brief, is false at the code
   level.** The resolver *can* emit a `source_url` on a host that is neither
   the prospect's domain nor `play.google.com`. It did not emit the RocketReach
   row (F13 shows who did, with evidence), but the negative guarantee the whole
   provenance design rests on is not actually enforced by the code. See F5.

Mitigating, and stated so the verdict is not read as worse than it is: the
promotion path is clean. Claims 1, 2 and 3 of `020` all hold under direct
attack, RLS holds at role level against a real non-admin account, the migration
is exactly what it claims, the backfill is exactly what it claims, and all 157
test assertions pass. The failures are concentrated in the poller and in the
resolver's fetch and time budgeting, not in the write path a human clicks.

---

## 1. Calibration and provenance of this review

| # | Check | Result |
|---|---|---|
| 1 | `git diff --stat` and scope | 15 tracked files modified plus 5 untracked. Files belonging to `020`/`021`: `netlify/functions/prospects-admin.js`, `_touches.js` (new), `poll-inbound-replies.js` (new), `netlify.toml`, `tests/prospects_admin_whitelist.test.js`, `tests/touches_record.test.js` (new), `db/supabase-prospect-channels-migration.sql`, `db/supabase-prospect-touches-external-id-2026-08-20.sql` (new). **Files dirty in the same tree that belong to neither packet:** `_revenue.js`, `revenue-report.js`, `unlock-audit-report.js`, `src/lib/collectionContext.tsx`, `src/pages/{AIVisibility,Account,AuditReport,Competitors,Dashboard,Mentions,Prompts,Revenue}.tsx`, `db/supabase-prospect-leads-utm-migration.sql`, `brandgeo/web/site.js`, `.gitignore`, `CLAUDE.md`, `docs/growth/*`, `.claude/agents/gtm-outbound.md`. Not a scope violation *by* these packets. See F4. |
| 2 | Secret scan | 12 hits across the diff, 21 across the new untracked files. **Zero secret values.** Every hit is a variable name, a `process.env.*` reference, or prose. No `HUMAN CHECKPOINT` triggered on this axis. |
| 3 | Criteria checkable? | `020` has 7 claims and 5 gaps, `021` has 9 claims and 6 gaps. All are objectively checkable except `020` gap 2 and `021`'s "adminOnly branch unproven live", which cannot be closed by any agent (no admin credential exists for an agent, per the standing rule). Stated, not faked. |
| 4 | tsc / build baseline | `npx tsc --noEmit` exits **2** with two errors, both in `src/lib/collectionContext.tsx`. That file is dirty from a **concurrent session**, not from these packets (F4). Netlify functions are not compiled at all: `tsconfig.json:20` is `"include": ["src"]`, so tsc says nothing about `_touches.js` or `poll-inbound-replies.js` either way. |
| 5 | Auth on the most sensitive function touched | `prospects-admin.js:492` `const auth = await requireAuth(event, { adminOnly: true })`; `resolve-contact-routes.js:221` identical; `poll-inbound-replies.js:184` `const gate = requireCronAuth(event)`, which fails **closed** with 503 when `CRON_SECRET` is unset (`_cron_auth.js`, the `if (!expected)` branch). |
| 6 | Write access | Wrote exactly one file, `docs/qa/contact-routes-and-reply-handling-review-2026-08-20.md`. Edited no reviewed file. |

**CALIBRATED**, with the caveat in F4.

### Live endpoint probes (correction 1 in the brief, reproduced)

```
resolve-contact-routes             HTTP 401  {"error":"Unauthorized: missing token"}
prospects-admin                    HTTP 401  {"error":"Unauthorized: missing token"}
poll-inbound-replies               HTTP 404  <!DOCTYPE html> ...
a-function-that-never-existed      HTTP 404  <!DOCTYPE html> ...

resolve-contact-routes with Authorization: Bearer not.a.real.jwt
                                   HTTP 401  {"error":"Unauthorized: invalid or expired token"}
```

Confirms: the resolver is deployed and gated. `poll-inbound-replies` is **not**
deployed, and answers identically to a name that never existed, which matches
packet `021`'s own statement. The bogus-bearer probe is slightly stronger than
the missing-token probe (it reaches the JWT verification branch rather than the
presence check) but it is **still not the adminOnly test**. A valid viewer JWT
would be needed for that and no agent can mint one. `020` gap 2 stays open and
is not closed by this review.

---

## 2. Acceptance criteria, packet 020

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | `promote` cannot write an arbitrary value | **PASS** | `promotionPatch()` (`prospects-admin.js:409-437`) emits object literals with hard-coded keys only. Attacked with seven hostile candidate rows carrying `x_verified`, `linkedin_verified`, `stage`, `plan`, a `__proto__` kind, an object `value` and a `toString` coercion on `email_kind`. Output keys were never anything but `["contact_email","contact_email_source","contact_email_kind"]`, `["linkedin_url"]` or `["x_url"]`. `kind: "__proto__"` returns `400 Candidate has an unrecognised kind.` because `VALID_CANDIDATE_KINDS` is a `Set`. See F14 for the one residual. |
| 2 | `promote` never sets `x_verified` / `linkedin_verified` | **PASS** | Same run: neither key appears on any branch. Confirmed independently at the database level by the rollback probe below, which diffed the **whole row** as `jsonb` rather than checking named columns. |
| 3 | `update`'s whitelist unchanged, surfaces disjoint | **PASS** | `WRITABLE_FIELDS` printed live: `["stage","notes","owner","next_action_at","last_contacted_at","replied_at","reply_note"]`, 7 fields, unchanged. `has('contact_email')` false, `has('linkedin_url')` false, `has('x_url')` false, `has('x_verified')` false. `git diff` shows no change to that Set. |
| 4 | RLS on `prospect_contact_candidates`, 4 policies, all `is_admin()` | **PASS**, proven at role level | See the role probe below. |
| 5 | The resolver never guesses and never queries a lead database | **FAIL as stated** | Guessing: PASS, no pattern generator exists and the test suite asserts the negative. Provenance: **FAIL**, `fetchPage()` records `res.url` after `redirect: 'follow'`, so any host can become a `source_url`. See F5. |
| 6 | The Play Store fallback cannot attach a stranger's address | **FAIL** | `playListingMatches()` is a bare substring test. Defeated. See F6. |
| 7 | Fetch safety / SSRF | **FAIL** | No private-address guard, no host allowlist, `redirect: 'follow'`. See F7. |

### 020 gap 1: promote rollback probe, run independently

Reproduced with a whole-row `jsonb` diff so nothing could hide in a column I
forgot to name. Candidate 3 (`sales@casepacer.com`, kind `email`, `email_kind`
`role`) onto prospect 33, inside `begin; ... rollback;`.

```
tbl               column_changed         before                              after
candidate.id=3    promoted               false                               true
prospects.id=33   contact_email          (null)                              sales@casepacer.com
prospects.id=33   contact_email_kind     (null)                              role
prospects.id=33   contact_email_source   (null)                              https://www.casepacer.com/contact-us
prospects.id=33   updated_at             2026-08-20T22:38:30.567164+00:00    2026-08-20T22:51:55.21611+00:00
```

Every other column on both rows was byte-identical in transaction, including
`x_url`, `linkedin_url`, `x_verified`, `linkedin_verified` and `stage`.
Confirmed after rollback:

```
promoted_rows_after_rollback  0
with_email                    9
p33_email                     (null)
p33_updated_at                2026-08-20 22:38:30.567164+00
x_verified                    7
li_verified                   5
```

`updated_at` also moves. Constantin's own probe did not name it. It is correct
behaviour (the `prospects_set_updated_at` trigger), and it is recorded here so
the next reviewer does not treat it as a surprise. **020 gap 1 is CLOSED.**

### 020 gap 4 and correction 3: RLS proven at role level, not from `pg_policies`

`pg_policies` reports 4 policies per verb on all three tables, `{authenticated}`,
`using`/`with check` = `is_admin()`, `relrowsecurity = true`. That is what the
migration says, so it proves nothing on its own. The probe below sets the actual
role and JWT claim inside a rolled-back transaction, using a **real** non-admin
`user_profiles` row (`59be5684-...`, one of the 10 non-admin accounts, the set
that includes the competitor signup) and the real admin (`f4f647c2-...`).

```
viewer is_admin()                            false
viewer SELECT candidates (rows visible)      0
viewer SELECT prospects (rows visible)       0
viewer SELECT touches (rows visible)         0
viewer UPDATE candidate 3 (rows affected)    0
viewer DELETE candidate 3 (rows affected)    0
viewer INSERT candidate                      DENIED sqlstate 42501
admin  is_admin()                            true
admin  SELECT candidates (rows visible)      10
anon   SELECT candidates (rows visible)      0
```

A signed-in non-admin sees nothing, changes nothing, and is refused on insert
with a real permission error rather than a silent no-op. **020 gap 4 is CLOSED.**
`get_advisors(security)` returns no finding naming `prospect_contact_candidates`
or `prospect_touches`, and no new `SECURITY DEFINER` function; every advisor hit
is pre-existing accepted posture.

### 020 gap 3: the timeout arithmetic

**Does not hold.** See F6b. This gap is not closed.

### 020 gap 5: false positives never re-measured

Not closed and not closeable without re-running the resolver against 43 live
third-party sites, which is outside a read-only review. Recorded in section 7.

---

## 3. Acceptance criteria, packet 021

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | The extraction changed no behaviour | **PASS WITH FINDINGS** | Line-by-line `git diff` of the removed inline block against `_touches.js`. The retry lookup, FK 404, forward-only stamp, 0-row refetch and structured `touch_id` are all semantically identical. Three undeclared contract changes came with it. See F8. The riskiest sub-claim, the `retry_of` path, is **untested** by the new suite. See F9. |
| 2 | The backfill guard holds | **FAIL** | Holds for the case it was designed for, proven against a real rolled-back transaction. Breaks for an outbound backfill logged after an inbound reply. See F2. |
| 3 | A count failure cannot clear a live schedule | **PASS** | `_touches.js:281-291` sets `countFailed` and returns before `nextActionAtFor()` is ever called, and the only other route to a `null` value is `FOLLOW_UP_STEPS_DAYS[n]` running off the end, which requires a successful count. `touches_record.test.js` asserts `written.schedule === null` on a scripted count error and that the caller gets a `warning` on a **success** outcome. |
| 4 | `skip` and `value: null` never collapse | **PASS** | `nextActionAtFor()` returns `{ skip: true }` for every member of `TERMINAL_STAGES` and for an unparseable `occurred_at`, and `{ value: null }` for inbound and for an exhausted sequence. `recordTouch` gates the UPDATE on `if (!decision.skip)`. Both suites assert it; the terminal case is also asserted at the call level (`written.schedule === null`). |
| 5 | The poller cannot send, modify mail, or write a stage | **PASS** | Only two Gmail calls exist, both `GET`: `messages?...q=` (`:252`) and `messages/{id}?format=metadata` (`:310`). No `POST`, no `/send`, no `/modify`, no `/trash`, no label write. The OAuth exchange requests no scope at all (it uses the refresh token's existing grant), so scope is set outside this file and is the one thing I cannot verify. `recordTouch` never emits `stage`, asserted across four control-flow paths. |
| 6 | Autoresponder detection | **PARTIAL** | The four headers are checked correctly and case-insensitively. It cannot catch a vacation responder that sets none of them. See F10. |
| 7 | Sender matching cannot misattribute | **FAIL** | `parseFromAddress()` returns the first angle-bracketed token, which RFC 5322 does not guarantee is the address. Reproduced. See F1. |
| 8 | The timeout arithmetic | **PASS WITH FINDINGS** | 40 messages, 22s budget, 26s platform ceiling, and `skipped_time_budget` is reported in `job_runs.detail`. `job_runs.ok` is `errors.length === 0`, so it is false whenever any API error occurred, including a dedupe read failure. Two residuals: a budget-stopped run still reports `ok = true` (F11), and a chunk-loop cap can starve addresses 26 and up (F12). |
| 9 | The migration is safe | **PASS** | Verified against production, not read from the file. |

### 021 claim 9, verified against production

```
column_name   data_type                   is_nullable  column_default
external_id   text                        YES          (null)

prospect_touches_external_id_key
  CREATE UNIQUE INDEX ... ON public.prospect_touches USING btree (external_id)
  WHERE (external_id IS NOT NULL)
```

14 touches exist, `with_external_id = 0`, so every pre-existing row and every
future manual touch is outside the index. RLS on `prospect_touches` is
unchanged: 4 policies, one per verb, all `is_admin()`, all `{authenticated}`,
and the role probe above shows a viewer sees 0 of 14 rows.

### 021 claim 2, the backfill guard, against a real rolled-back transaction

Prospect 4 (`pagelightprime.com`), 1 outbound touch, `last_contacted_at`
2026-08-16 17:48, `next_action_at` 2026-08-20 17:48.

```
step                                        last_contacted_at            next_action_at               out  stamp_rows
BEFORE (prospect 4)                         2026-08-16 17:48:27.6562+00  2026-08-20 17:48:27.6562+00  1    -
AFTER backfill touch (2026-08-10)           2026-08-16 17:48:27.6562+00  2026-08-20 17:48:27.6562+00  2    0
AFTER new touch, stamp only                 2026-08-16 17:48:27.6562+00  2026-08-20 17:48:27.6562+00  3    1
AFTER schedule (3rd outbound = exhausted)   2026-08-20 12:00:00+00       (null)                       3    -
```

The mechanism is sound: `stamp_rows` is exactly 0 for the backfill and exactly 1
for the genuine later touch, so "write `next_action_at` only when the stamp
applied" is a real signal and not a hopeful one. The history still records both
touches. That half of claim 2 is proven. F2 is the half that is not.

### The `next_action_at` backfill, verified

13 rows carry a date, matching the packet exactly:

```
8 due 2026-08-20  (ids 4, 6, 3, 5, 11, 13, 14, 12)   all 1 outbound touch, last_contacted 08-16, +4d
4 due 2026-08-21  (ids 26, 30, 33, 24)               all 1 outbound touch, last_contacted 08-17, +4d
1 due 2026-08-24  (id 7, glood.ai)                   2 outbound touches, last_contacted 08-17, +7d
```

Every one recomputes correctly from `FOLLOW_UP_STEPS_DAYS = [4, 7]` and that
prospect's own outbound count. `prospects = 71` (unchanged), `touches = 14`,
`inbound = 0`, `replied = 0`, `x_verified = 7`, `linkedin_verified = 5`,
`promoted = 0`. Nothing moved that should not have.

`cron.job` holds 5 active jobs and **`poll-inbound-replies` is not among them**,
matching the packet. I did not schedule it.

---

## 4. Findings, ranked

### F1. HIGH. A crafted `From` header attributes a reply to the wrong prospect

**What.** `parseFromAddress()` takes the first `<...>` token in the header. RFC
5322 permits a quoted display-name containing `<` and `>`, in which case the
first token is not the addr-spec.

**Where.** `brandgeo-dashboard/netlify/functions/poll-inbound-replies.js:140-146`,
consumed at `:334-335`.

**Reproduced.**

```
"Lead <lead@hoowla.com>"                              -> "lead@hoowla.com"
"\"<lead@hoowla.com>\" <attacker@evil.example>"       -> "lead@hoowla.com"
"\"Lead <lead@hoowla.com>\" <attacker@evil.example>"  -> "lead@hoowla.com"
"\"reply-to <sales@casepacer.com>\" <spoof@mailer.example>" -> "sales@casepacer.com"
```

**Exploit path.** The outbound mailbox address is public. Prospect contact
addresses are guessable for role inboxes (`sales@casepacer.com` is one of the 9
already on file) and discoverable for individuals. An attacker sends one message
to that mailbox with a display-name of `"<sales@casepacer.com>"`. Gmail's `from:`
operator matches display names as well as addresses, so the message enters the
candidate list; `parseFromAddress` then extracts the spoofed address, `byAddress`
hits, and `recordTouch` writes an inbound touch, stamps `replied_at`, and clears
`next_action_at`. The prospect silently leaves the follow-up queue. That is the
exact outcome packet `021` claim 6 calls "worse than no automation", reached
through claim 7 instead. The second exact check the packet relies on does not
help, because the value it compares is already the spoofed one.

**Fix.** Parse the last addr-spec, not the first, and require it to be outside
any quoted string. Minimum viable: take the **last** `<...>` match
(`from.match(/<([^>]*)>/g).pop()`), which is the addr-spec for every well-formed
`name-addr`, and reject a header containing more than one `@` outside the chosen
token. Better: strip quoted-strings first, then match. Add the four reproduced
headers as regression cases in a poller test file, which does not exist yet.

---

### F2. HIGH. An outbound backfill re-arms the queue on a prospect who already replied

**What.** The forward-only guard is applied per **stamp column**. An outbound
touch is compared against `last_contacted_at` and never against `replied_at`, so
an outbound touch that is older than a logged reply but newer than
`last_contacted_at` counts as "applied" and schedules a follow-up.

**Where.** `_touches.js:203-216` (the stamp is built from `stampFieldFor` alone)
and `:270-318` (the schedule is gated only on `stampApplied`). The consequence
lands in `src/pages/Prospects.tsx:196-201`, `isActionableNow()`, which never
consults `replied_at`.

**Reproduced against production inside `begin; ... rollback;`.** Prospect 4:

```
step                                     last_contacted_at            replied_at             next_action_at         stamp_rows
BEFORE (1 outbound touch)                2026-08-16 17:48:27.6562+00  (null)                 2026-08-20 17:48:27+00  -
after inbound reply 08-19 (schedule cleared) 2026-08-16 17:48:27.6562+00  2026-08-19 08:00:00+00  (null)             -
after OUTBOUND BACKFILL 08-18 (stamp)    2026-08-16 17:48:27.6562+00  2026-08-19 08:00:00+00  (null)                 1
after OUTBOUND BACKFILL 08-18 (schedule) 2026-08-18 09:00:00+00       2026-08-19 08:00:00+00  2026-08-25 09:00:00+00 -
```

Final state: `replied_at = 2026-08-19`, `next_action_at = 2026-08-25`. The row is
back in the actionable queue and will render as overdue on 2026-08-25.

**Exploit path (no attacker needed, this is ordinary use).** The design and the
UI both advertise backfilling as supported: log the email you just sent, then
remember the LinkedIn message from two days ago. Do that after a reply has been
logged, whether by a human or by the poller, and the person who answered you gets
chased again. Given F1, an attacker can also cause the inbound half of this.

**Fix.** Two parts, both small.
1. In `nextActionAtFor()`, add `if (prospect.replied_at && Date.parse(occurredAtIso) <= Date.parse(prospect.replied_at)) return { skip: true }`, and pass `replied_at` in (it is already in both callers' `selectCols`). An outbound touch that predates a reply is history, not a schedule input.
2. In `Prospects.tsx:196-201`, make `isActionableNow()` return false when `p.replied_at` is set and no human has explicitly set a later `next_action_at`. Defence in depth, and it is the layer a human actually looks at.

---

### F3. HIGH. The S1 `occurred_at` floor is not enforced on the poller path

**What.** `_touches.js` states in its own header that it never validates input
and that callers do. `prospects-admin.js` validates via `validateTouch()`. The
poller builds its insert directly from Gmail headers (`:343-355`) and applies
only an upper clamp. The S1 lower bound, closed as BLOCKING on 2026-08-15, is not
re-applied.

**Where.** `poll-inbound-replies.js:177-181` (`occurredAtFrom`), used at `:347`.

**Reproduced.**

```
"Thu, 01 Jan 1970 00:00:00 +0000"  -> 1970-01-01T00:00:00.000Z
"Tue, 01 Jan 1901 00:00:00 GMT"    -> 1901-01-01T00:00:00.000Z
"Mon, 01 Jan 1900 00:00:00 GMT"    -> 1900-01-01T00:00:00.000Z
"Fri, 01 Jan 2100 00:00:00 GMT"    -> 2026-08-20T22:51:30.380Z   (upper clamp works)

validateTouch on the same value, admin path:
{"error":"occurred_at cannot predate 2026-01-01T00:00:00.000Z."}
```

**Exploit path.** The sender controls the `Date` header. A reply with
`Date: Thu, 01 Jan 1970` writes `occurred_at = 1970-01-01` into
`prospect_touches`, and because the prospect query filters on `replied_at IS
NULL`, the forward-only stamp's `is null` branch matches and `replied_at` is set
to 1970 on a real prospect row. The reply history and the "replied N days ago"
reading in the UI are then wrong, permanently, and no admin action produced it.
Broken mail clients do this by accident; a hostile sender does it on purpose.

**Fix.** Clamp both ends in `occurredAtFrom`, reusing the exported constant
rather than a second copy: `if (!Number.isFinite(ms) || ms < TOUCH_MIN_OCCURRED_AT) return new Date().toISOString()`.
Export `TOUCH_MIN_OCCURRED_AT` from `_touches.js` (it currently lives in
`prospects-admin.js:217`, which is the wrong home now that there are two
callers) so the bound cannot drift between the two paths. This is the same
one-copy-two-callers argument that justified `_touches.js` in the first place.

---

### F4. HIGH (process, not code). The build fails, and the working tree moved during this review

**What.** `npx tsc --noEmit` exits 2. `npm run build` is `tsc && vite build`, so
vite never runs and no bundle is produced.

```
src/lib/collectionContext.tsx(250,81): error TS2322: Type '(...) => Promise<void>'
  is not assignable to type '(...) => Promise<RunCollectionResult>'.
src/lib/collectionContext.tsx(250,96): error TS2322: Type '(...) => Promise<void>'
  is not assignable to type '(...) => Promise<RunSinglePromptResult>'.
```

**Attribution, so this is not charged to the wrong packet.** `RunCollectionResult`
and `RunSinglePromptResult` are introduced by an **uncommitted** change to
`collectionContext.tsx` (`git diff` shows the interfaces added and the two
signatures changed from `Promise<void>`), and the `createContext` default stub
was not updated to match. Neither `020` nor `021` names that file. Its mtime is
`2026-08-20T23:55:01`, which is **after this review started**; the `020`/`021`
files were last written at 23:40 to 23:45.

**The larger problem.** `git status` returned a different file list three times
during this review. At the start, 4 dashboard files were dirty. By the middle, 13.
By the end, `AIVisibility.tsx` had appeared as well. **A parallel session is
editing `brandgeo-dashboard/src/` right now.** Per `docs/AGENT-OS.md` section 1
("Git is never partitioned") and `rules/parallel-task-scoping.md`, this is the
exact condition that corrupted `.git/index` on 2026-07-08.

**Consequence for the verdict.** I cannot certify a green build for the reviewed
state, and neither can anyone else until the tree stops moving. I can certify
that neither packet's own files are compiled by tsc at all
(`tsconfig.json:20`, `"include": ["src"]`).

**Fix.** Do not commit this tree as one unit. Land `020`/`021` as their own
commit naming only the 8 files listed in calibration step 1, after the other
session's `collectionContext.tsx` work either lands or is reverted, and re-run
`npm run build` on the result. Nothing in `020`/`021` should ride in the same
commit as the Revenue or collectionContext work.

---

### F5. MEDIUM. `source_url` provenance is not enforced: `redirect: 'follow'` records the final URL

**What.** `fetchPage()` returns `res.url`, the URL after redirects, and that
value becomes the candidate's `source_url`. So the claim "the resolver crawls
only the prospect's own pages plus a Play Store fallback, therefore it cannot
emit a foreign `source_url`" is false as a property of the code.

**Where.** `resolve-contact-routes.js:109-122`, specifically
`return { url: res.url || url, html }`, consumed at `:154-155`, `:184`, `:204`.

**Exploit path.** Any of the 12 candidate paths on a prospect's own domain can
302 to a third-party host. The resolver then extracts addresses and profile URLs
from *that* page and stores them with the third party's URL as provenance. The
comment at `:120-121` is honest about the intent ("provenance records where the
string actually was") but the design document and the packet both state the
stronger guarantee, and the stronger guarantee is what a reviewer reading a
`source_url` column will assume.

This is what makes candidate id 10 unresolvable from the code alone, and why F13
had to be settled by data rather than by reading. It is not the *cause* of that
row, but it means the code cannot be used as proof of innocence.

**Fix.** Keep `res.url` for display, and add an enforced boolean:
`own_domain BOOLEAN` computed with the existing `isOwnDomainSource(res.url, domain) || isPlayStoreSource(res.url)`. Refuse to insert a candidate whose final
URL passes neither, or insert it with `confidence = 'low'` and a distinct marker.
`scoreConfidence()` already has both predicates; only the write path lacks the
gate.

---

### F6. MEDIUM. `playListingMatches()` is a bare substring test and is trivially defeated

**What.** `return html.toLowerCase().includes(d)`. Any listing whose HTML
contains the prospect's domain **as a substring** is accepted as verified.

**Where.** `_contact_routes.js:416-420`, gate at `resolve-contact-routes.js:202`.

**Reproduced.**

```
listing HTML: "Developer website: https://www.casepacer.com"
  prospect domain casepacer.com -> true   (correct)
  prospect domain pacer.com     -> true   (WRONG)
  prospect domain acer.com      -> true   (WRONG)

listing HTML: "contact dev@staircase.com"
  prospect domain case.com      -> true   (WRONG)
```

**Exploit path.** No attacker required. A short prospect domain that is a
substring of any string on a Play listing passes the guard, and the resolver then
extracts a **stranger's Google-verified developer contact address** and stages it
against that prospect. The packet's own premise is that a name search for
"PageLightPrime" returned 12 apps, 11 unrelated, so the search reliably supplies
wrong listings for the guard to reject. This guard is the only thing standing
between that and a wrong address, and the address it produces is exactly the kind
that looks most trustworthy.

**Fix.** Match on a host boundary, not a substring. Extract every URL and every
bare hostname from the listing HTML and compare with the existing
`isOwnDomainSource`-style rule (`h === d || h.endsWith('.' + d)`), or at minimum
require the match to be preceded by a non `[A-Za-z0-9.-]` character. The
`hostOf()` and `isOwnDomainSource()` helpers needed for this already exist in the
same file.

---

### F6b. MEDIUM. The resolver's invocation budget can exceed the 26s platform timeout

**What.** `PER_PROSPECT_BUDGET_MS` (18000) is enforced by a **pre-check**
(`budgetLeft()`), not a deadline. A listing fetch that starts at t=17.9s runs to
t=23.9s under `PER_PAGE_TIMEOUT_MS` of 6000. So `resolveOne()` worst case is
about 24s, not 18s.

**Where.** `resolve-contact-routes.js:176` (`budgetLeft`), `:196-206` (the loop
that starts a 6s fetch after the check), `:275` (the invocation gate).

**The arithmetic.** The gate admits a second prospect while
`elapsed <= INVOCATION_BUDGET_MS - PER_PROSPECT_BUDGET_MS` = 22000 - 18000 =
4000ms. If prospect 1 finishes in 3.9s (a fast site, all 12 pages in parallel,
no Play link), prospect 2 starts at 3.9s and may run to 27.9s. `netlify.toml`
gives the function 26s. **The invocation is killed and returns nothing**, which
is precisely the failure mode the header comment at `:66-74` says the budgets
exist to prevent. Prospect 1's candidate rows survive (they are upserted inside
the loop) but the caller sees a timeout and, per the same comment, a company
nobody finished looking at is indistinguishable from one with no address.

**Fix.** Make the subtrahend the real worst case:
`INVOCATION_BUDGET_MS - (PER_PROSPECT_BUDGET_MS + PER_PAGE_TIMEOUT_MS)` =
22000 - 24000, which is negative and correctly means a second prospect can never
start under the current constants. Then either lower `PER_PROSPECT_BUDGET_MS`
to about 10s so two prospects genuinely fit, or set `MAX_PROSPECTS_PER_CALL = 1`
and say so. The current value of 3 is not achievable.

---

### F7. MEDIUM. SSRF: no private-address guard, no host allowlist, redirects followed

**What.** `normaliseDomain()` requires only a dot, so bare IPv4 and internal
hostnames pass, and `fetchPage` follows redirects to anywhere.

**Where.** `_contact_routes.js:150-159` and `:166-170`;
`resolve-contact-routes.js:109-112`.

**Reproduced.**

```
"localhost"                -> null                    (rejected, needs a dot)
"127.0.0.1"                -> "127.0.0.1"             https://127.0.0.1
"169.254.169.254"          -> "169.254.169.254"       https://169.254.169.254
"10.0.0.5"                 -> "10.0.0.5"              https://10.0.0.5
"192.168.1.1:8080"         -> "192.168.1.1:8080"      https://192.168.1.1:8080
"metadata.google.internal" -> "metadata.google.internal"
```

**Exploit path.** Two entries. (a) A prospect site under someone else's control
answers any of the 12 candidate paths with a 302 to `http://169.254.169.254/...`
or `http://127.0.0.1:<port>/`; the resolver fetches it and runs `EMAIL_RE` over
the response, and anything that matches becomes a candidate row visible in the
admin UI, with the internal URL as `source_url`. That is a blind-ish read oracle.
(b) A `domain` column set to a bare IP, which is admin-only today because
`domain` is not in `WRITABLE_FIELDS`, but it is set by hand-run SQL and no
constraint prevents it.

**Not live today.** Verified against production: `ip_like_domains = 0`,
`internal_like = 0` across all 71 rows. Exploitability against Netlify's Lambda
runtime is also limited, because credentials there live in environment variables
rather than behind EC2 IMDS. This is why the finding is MEDIUM, not HIGH.

**Fix.** In `fetchPage`, set `redirect: 'manual'` and re-issue at most 3
redirects yourself, running each hop through a guard that rejects any host
resolving to a private, loopback, link-local or unique-local address, plus a
literal-IP reject in `normaliseDomain`. Combine with F5: the guard and the
provenance check are the same check applied at the same place.

---

### F8. LOW. Three undeclared contract changes rode in on the "no behaviour change" extraction

Packet `021` claim 1 says the extraction changed no behaviour. Three things did.

1. **The 5xx `code` strings were renamed.** `touch:retry_lookup` became
   `touch:retry_lookup_failed`, `touch:insert` became `touch:insert_failed`,
   `touch:stamp` became `touch:stamp_failed`, `touch:restamp_fetch` became
   `touch:refetch_failed`. These are in the response body, which is a client
   contract. Grepped: nothing in `src/` reads them, so no live caller breaks.
2. **`TOUCH_COLS` gained `external_id`.** Every `touch`, `update`, `promote` and
   `list` response now carries an extra key on every `Touch`. Additive.
3. **A `warning` key can now appear on a 200 `touch` response**
   (`prospects-admin.js:638`). New, additive, undocumented in the file's own
   header contract block at `:20-29`.

**Fix.** State all three in the packet, and add the `warning` key to the header
contract block so the next reader of that file learns it from the file.

---

### F9. LOW. The riskiest sub-claim of the extraction has zero test coverage

`grep -c "retryOf\|retry_of" tests/touches_record.test.js` returns **0**. The
`retry_of` branch (`_touches.js:152-175`) is the only part of `recordTouch` with
its own control flow, produces two of the six failure kinds
(`retry_lookup_failed`, `retry_not_found`), and is named first in packet `021`
claim 1. It is not exercised. `refetch_failed` is also untested. The
endpoint-level mapping from outcome kind to HTTP status
(`prospects-admin.js:612-630`) is untested in either suite.

The suite is otherwise honest and good: it says in its own header that it proves
control flow and nothing about Postgres, and it does prove the things that
matter most (skip versus clear, the count-failure skip, the backfill guard at the
call level, and that no path writes `stage`). This finding is about what is
missing, not about what is claimed.

**Fix.** Three more cases: retry with a matching row (asserts no insert), retry
with a wrong `prospect_id` (asserts `retry_not_found`), and a refetch error after
a 0-row stamp (asserts `refetch_failed` plus `touch_id`).

---

### F10. LOW. `isAutomated()` cannot see the most common out-of-office

`poll-inbound-replies.js:156-167` checks `Auto-Submitted`, `Precedence`,
`X-Autoreply` and `X-Autorespond`, correctly and case-insensitively. Microsoft
Exchange and Outlook automatic replies frequently set **none** of the four; they
are identified by `X-MS-Exchange-Inbox-Rules-Loop` or by the message being a
`multipart/report` with `report-type=disposition-notification`. Gmail's own
vacation responder does set `Auto-Submitted: auto-replied`, so the Gmail case is
covered.

Consequence when it misses: an out-of-office is logged as a reply, `replied_at`
is stamped and `next_action_at` is cleared, and the prospect leaves the queue
without a human ever seeing an answer. Packet `021` names this outcome as worse
than no automation.

**Fix.** Add `X-MS-Exchange-Inbox-Rules-Loop` and `X-Auto-Response-Suppress` to
the `metadataHeaders` list at `:312-314` and to `isAutomated`, and treat a
`Subject` matching `/^(automatic reply|out of office|autoreply)/i` as automated.
None of these is a full solution; they are the cheap 80 percent.

---

### F11. INFO. A budget-stopped poller run still reports `job_runs.ok = true`

`poll-inbound-replies.js:393` is `recordJobRun(supabase, errors.length === 0, detail)`.
A run that hit `INVOCATION_BUDGET_MS` records `skipped_time_budget > 0` in
`detail` but `ok = true`. Packet `021` claim 8 as written is satisfied, because
a budget stop is not an API error. But `CLAUDE.md` criticises `ping-sitemap` for
exactly the pattern of `ok` not distinguishing a complete run from a partial one,
and this reintroduces a narrower version of it. Not blocking, and the detail
field does carry the signal.

---

### F12. LOW. The message cap can starve every address past the first 25

`poll-inbound-replies.js:248-249`: the chunk loop breaks when
`messageIds.length >= MAX_MESSAGES_PER_RUN` (40), and the cap is applied
**before** the `alreadyLogged` dedupe (`:265` then `:297`). If chunk 1 (the first
25 addresses) returns 40 messages inside the 30-day window, chunks 2 and up never
execute, on this run and on every subsequent run, because the same 40 messages
keep coming back. Addresses 26 and up are never queried at all.

Not live: only 9 prospects have a `contact_email` and the poller is not deployed.
It becomes live the moment more than 25 prospects are awaiting a reply, which is
the stated goal of the resolver.

**Fix.** Run every chunk, then dedupe, then apply the cap to the surviving
unlogged ids. Or rotate the chunk start offset per run.

---

### F13. PRE-EXISTING, not caused by this change set. Candidate id 10 was not written by the resolver

The brief asked me to test whether any code path can emit a `source_url` off the
prospect's own domain or `play.google.com`. **F5 shows one can**, via redirect
following, so the code cannot be used to exonerate itself. I settled it with data
instead, and the data is conclusive.

**Production state of `prospect_contact_candidates`:**

```
id  prospect_id  kind      confidence  created_at                      source_host        prospect_domain
1   26           email     high        2026-08-17 09:51:04.547387+00   www.hoowla.com     hoowla.com
2   26           linkedin  medium      2026-08-17 09:51:04.547387+00   www.hoowla.com     hoowla.com
3   33           email     high        2026-08-17 09:51:04.547387+00   www.casepacer.com  casepacer.com
4   33           x         medium      2026-08-17 09:51:04.547387+00   www.casepacer.com  casepacer.com
5   24           linkedin  medium      2026-08-17 09:51:04.547387+00   runsensible.com    runsensible.com
6   24           x         medium      2026-08-17 09:51:04.547387+00   runsensible.com    runsensible.com
7   30           email     medium      2026-08-17 09:51:04.547387+00   amberlo.io         amberlo.io
8   30           x         low         2026-08-17 09:51:04.547387+00   amberlo.io         amberlo.io
9   29           linkedin  medium      2026-08-17 09:51:04.547387+00   jovelegal.com      jovelegal.com
10  24           linkedin  medium      2026-08-17 10:33:10.400507+00   rocketreach.co     runsensible.com
```

**The finding, and it is larger than candidate 10.** All nine rows of the 09:51
batch share `created_at` to the **microsecond**, `2026-08-17 09:51:04.547387+00`,
across **five different prospects**. `created_at` defaults to `now()`, which in
Postgres is transaction start time. `resolve-contact-routes.js:316-318` upserts
**once per prospect, inside a sequential loop**, each call its own PostgREST
request and therefore its own transaction, each preceded by up to 19 network
fetches under an 18-second per-prospect budget. Five prospects cannot share one
transaction timestamp. Additionally `MAX_PROSPECTS_PER_CALL` is 3, so five
prospects cannot even be one invocation.

**Therefore none of the ten rows was written by `resolve-contact-routes.js`.**
All nine of the 09:51 batch came from a single hand-written `INSERT`, and
candidate 10 came from a second one 42 minutes later. Corroborating and
independent: `poll-inbound-replies` aside, the commit that introduces the
resolver, `5452e59`, was authored `2026-08-16T23:11:37+01:00` and, per
`CLAUDE.md`'s own dated record, was not pushed or deployed until 2026-08-20, so
the function did not exist in production on 2026-08-17 at all.

**Ruling.** This is a **process** problem, outside this change set, and it should
not be counted against the code. `020` claim 5's *intent* is intact: nothing in
`_contact_routes.js` generates, permutes or guesses an address, and
`tests/contact_routes.test.js` asserts that no exported function is even *named*
for doing so. But the standing never-query list (Hunter, Apollo, RocketReach,
Clearbit, Snov) was violated by a human, the result was written straight into the
provenance table whose `source_url NOT NULL` column exists to make that visible,
and outbound touch id 18 went out on the back of it.

**What is owed, and it is not a code change.**
1. Decide the fate of candidate id 10. It should be deleted, not promoted. Note that `promote` would write its RocketReach URL into `contact_email_source`-equivalent provenance, laundering a lead-database result into the record as first-party evidence.
2. Re-derive candidate 5 and 6 (`runsensible.com`, same prospect, same batch) from the site itself, since the batch's authorship is now in doubt as a whole.
3. Consider a CHECK or trigger on `prospect_contact_candidates` rejecting a `source_url` whose host is on the never-query list. It is three lines and it makes the rule unrepresentable rather than remembered. This is the same argument that made `source_url` NOT NULL.

---

### F14. INFO. `promote` guarantees provenance, not format

`promotionPatch()` writes `candidate.value` verbatim into `contact_email` with no
address validation anywhere in the chain. The real guarantee is "this string came
from a candidate row", which given F13 is weaker than "this string was seen by
the resolver at a URL". Not a privilege escalation: only an admin can write
candidates, and an admin can already write `prospects` directly through
PostgREST. Recorded so the guarantee is not overstated in future summaries.

---

### F15. INFO. A failed OAuth response body is logged verbatim

`poll-inbound-replies.js:113-114` logs `text.slice(0, 300)` of a non-2xx token
exchange response. Google's error bodies carry `error` and `error_description`
and never echo the client secret, so this is safe as written. Flagged only
because it is a log line inside a credential exchange and the repo is public;
if the endpoint is ever changed, this line should be re-checked.

---

### F16. PRE-EXISTING. `job_runs` has RLS enabled with no policies

`get_advisors(security)` reports `public.job_runs` (and 11 other tables) with RLS
enabled and zero policies, which means deny-all for `anon` and `authenticated`
and full access for `service_role`. That is the intended posture for a job log
written by a cron function, so it is correct behaviour reported as an INFO lint.
Named here only because `poll-inbound-replies.js` writes to it and a reviewer
checking the new table would otherwise wonder.

---

## 5. Regression surface, found by grep

Direct importers of what changed:

```
netlify/functions/poll-inbound-replies.js:51   require('./_touches')      -> recordTouch
netlify/functions/prospects-admin.js:171       require('./_touches')      -> recordTouch, nextActionAtFor,
                                                                             stampFieldFor, buildAdvanceOnlyFilter,
                                                                             TOUCH_COLS, FOLLOW_UP_STEPS_DAYS,
                                                                             TERMINAL_STAGES
netlify/functions/resolve-contact-routes.js:53 require('./prospects-admin') -> parseId
netlify/functions/resolve-contact-routes.js:63 require('./_contact_routes')
tests/contact_routes.test.js:25                _contact_routes.js
tests/prospects_admin_whitelist.test.js        prospects-admin.js (re-exports)
tests/touches_record.test.js:24                _touches.js
```

Paths that need a manual look, and why:

| Path | Why |
|---|---|
| `netlify/functions/resolve-contact-routes.js:53` | It imports `parseId` from `prospects-admin.js`, which means loading the whole admin endpoint module (and `@supabase/supabase-js`, and `_touches.js`) as a side effect of wanting one 4-line pure function. Cold-start cost, and a circular-ish coupling between two endpoints that should not know about each other. `parseId` belongs in a `_ids.js` or in `_touches.js`. |
| `src/pages/Prospects.tsx:196-201`, `:203-205`, `:227-237` | The consumer of `next_action_at`. F2 lands here. `isActionableNow` and `isOverdue` never read `replied_at`. |
| `src/pages/Prospects.tsx:1058-1075` | Optimistic client-side update that writes `replied_at` locally before the server answers. Not re-verified this pass; it now diverges from the server, which also writes `next_action_at`, so an optimistic row can show a stale schedule until the next `list`. |
| `src/types/index.ts:153-155`, `:170`, `:206` | `ContactCandidate` and `Touch`. `Touch` needs `external_id` added if the response now carries it (F8 item 2). Not checked whether it was. |
| `netlify.toml` `[functions."poll-inbound-replies"] timeout = 26` | Declared for a function that is not committed, so the toml entry will deploy before the function does if these are split. Harmless, but land them together. |
| `db/supabase-scheduled-jobs-migration.sql` | Where the pg_cron entry for the poller will have to go. Not written yet, correctly. |

No delete affordance for a prospect exists anywhere in `src/`, so the
`ON DELETE RESTRICT` on `prospect_contact_candidates` closes a latent risk rather
than a live one. Consistent with the 2026-08-15 S3 finding.

---

## 6. Accessibility

Scope: the interactive elements added by `020`'s UI half in
`src/pages/Prospects.tsx` (the resolve button, the candidate list, the promote
control). `021` adds no UI.

**Keyboard reachability: PASS.** Every new control is a native `<button>`
(`:700`, `:733`) or `<a>` (`:685`). No `div` with an `onClick`. Nothing sets
`tabindex="-1"`.

**Focus visibility: PASS.** `src/index.css:618-620` sets a global
`:focus-visible { outline: 2px solid rgb(var(--rail-active)); outline-offset: 2px }`
and none of the new classNames overrides it. The ring measures **6.75:1**
against the candidate panel surface, well clear of the 3:1 that WCAG 1.4.11 asks.

**Heading order: PASS.** The candidates block (`:730-760`) introduces no heading
and sits inside the existing prospect card, so no level is skipped.

**Contrast.** Computed for every new text-on-surface pair. Panel surface is
`bg-dark-900/40` composited on the `dark-800` card, which is `rgb(13,20,37)`.

| Pair | Surface | Ratio | AA 4.5:1 |
|---|---|---|---|
| candidate value, `text-slate-200` | rgb(13,20,37) | 14.89:1 | PASS |
| confidence `high`, `text-slate-300` | rgb(30,41,59) | 9.85:1 | PASS |
| confidence `medium`, `text-slate-400` | rgb(30,41,59) | 5.71:1 | PASS |
| **confidence `low`, `text-slate-500`** | rgb(30,41,59) | **3.07:1** | **FAIL** |
| **"source" link, `text-slate-500`** | rgb(13,20,37) | **3.86:1** | **FAIL** |
| **"N found" count, `text-slate-500`** | rgb(15,23,42) | **3.75:1** | **FAIL** |
| "Role inbox" badge, `text-amber-300` | rgb(36,34,34) | 10.98:1 | PASS |
| "Individual" badge, `text-slate-400` | rgb(30,41,59) | 5.71:1 | PASS |
| "In use" chip, `text-brand-300` | rgb(26,27,58) | 9.02:1 | PASS |
| "Use this" / "Replace", `text-slate-300` | rgb(23,33,50) | 10.88:1 | PASS |
| "Find contact routes", `text-slate-300` | rgb(24,34,52) | 10.74:1 | PASS |
| hover state, `text-brand-300` | rgb(24,34,52) | 8.64:1 | PASS |

**A17. Three of twelve new pairs fail AA, all `text-slate-500`.** None qualifies
for the 3:1 large-text exception: the low badge is `text-[10px]` and the source
link `text-[11px]`, against a threshold of 18.66px bold or 24px. `index.css:16`
already records that `rgb(100 116 139)` is 4.01:1 on `--dark-900` and fails, so
this is a known-bad token reused in new UI. The worst of the three is the `low`
confidence badge at 3.07:1, and that is the label a reviewer most needs to read,
because per the code's own comment a low-confidence candidate is usually a real
address belonging to a different company. **Fix:** move these three to
`text-slate-400` (5.71:1 on the same surfaces), which is already used two lines
away for the `medium` badge and the `Individual` badge.

**A18. Control boundary 1.77:1, below WCAG 1.4.11's 3:1.** `border-dark-600`
`rgb(51,65,85)` against the panel `rgb(13,20,37)` on the "Use this" button
(`:705`); the `bg-dark-700/60` fill adds only about 1.3:1 more. The button is
identifiable by its text, so this is not a blocker, and it matches the pattern
already logged in `CLAUDE.md`'s backlog (side panel 1.07:1, active nav tab
1.24:1). Recorded for that same fix pass rather than as new work.

**A19. Two new targets below 24 by 24 CSS px (WCAG 2.2 AA 2.5.8).** Computed from
the classes, not measured in a browser. "Use this" / "Replace" is
`px-2 py-1 text-[11px]`, roughly 24.5px tall, borderline. The "source" link
(`:685-693`) has **no padding at all**, roughly 16.5px tall by 45px wide, clearly
under. The inline exception in 2.5.8 is arguable here since the link sits in a
flex row of chips rather than in a block of prose. **Fix:** give the source link
`px-1.5 py-1`.

**Honest limit on this section.** Contrast and target sizes are **computed** from
the token values and the utility classes, not observed in a browser at a named
viewport, because `/prospects` is behind an admin login no agent can obtain
(`no-agent-created-admin` is a standing rule). The composited surface values
assume the prospect card is `bg-dark-800`; if it is not, the three failing ratios
move but stay below 4.5:1 for any surface darker than `rgb(30,41,59)`.

---

## 7. Data and claim integrity

Every user-facing number in the reviewed code and packets, traced.

| Claim | Source | Verdict |
|---|---|---|
| "13 prospects at `stage='contacted'`, 0 with `next_action_at`" (pre-backfill) | packet `021` | Consistent. Post-backfill measured: 13 contacted, 13 with a date. |
| "8 due 08-20, 4 due 08-21, glood.ai 08-24" | packet `021` | **Verified exactly.** Query output in section 3. |
| "`FOLLOW_UP_STEPS_DAYS = [4, 7]`" | Constantin's 2026-08-20 ruling, `docs/arch/reply-handling.md` | Traced. Every one of the 13 dates recomputes from it. |
| "76 assertions" / "20 assertions" / "61 assertions" | packets | **Verified.** All three suites run and print exactly those counts, exit 0. |
| "14 outbound touches, 6 email" | packet `021` | Outbound count 14 verified. The 6-email split was not re-derived. |
| "43 prospects at `stage='new'` with zero contact routes" | migration header, packet `020` | Not re-derived; today's state is 9 with a `contact_email`, 10 candidate rows, 0 promoted. |
| "Nothing has ever been promoted" | `CLAUDE.md` | **Verified.** `promoted = 0`. |
| Confidence tone copy, `Prospects.tsx:639-652` | code | Honest. It describes sourcing, never identity, matching the design ruling. No overclaim. |
| "It never guesses one from a name pattern" (button tooltip, `:737`) | user-facing copy | **True of the code.** `tests/contact_routes.test.js` asserts no exported function is named for guessing and that a page naming a founder with no address yields zero email candidates. |
| `source_url` provenance, "Seen at {url}" (`:690`) | user-facing copy | **Not fully true.** F5 means the URL may be a redirect target, and F13 means at least one row in production carries a lead-database URL under this label. The copy asserts more than the system enforces. |

**AI-tell scan.** `rg -n "(em or en dash class)"` across all ten reviewed source, test, migration
and packet files plus `docs/arch/reply-handling.md`: **zero hits**. The single
hit in the `netlify.toml` diff is on an unchanged context line inside the
pre-existing S21 comment block, so it was not introduced here. This report
contains no em dash and no en dash.

**Untraceable claims: none, with one qualification.** Nothing in the code states
a number I could not trace. F13's ruling turns on a timestamp comparison rather
than a document, and the reasoning is shown in full so it can be checked.

---

## 8. What was NOT checked

Stated plainly. A reviewer who lists nothing here did not review.

1. **The `adminOnly` branch, live, with a real viewer JWT.** Both `020` gap 2 and
   `021`'s equivalent stay OPEN. The 401 on a missing token and the 401 on a
   malformed bearer are both weaker tests. I proved the RLS layer beneath it at
   role level, which is defence in depth, not the gate itself.
2. **Anything against real Gmail.** No `GMAIL_*` variable exists, the function is
   not deployed, and I did not connect to the mailbox. F1, F3 and F10 are derived
   from the code and reproduced against the functions in isolation, not observed
   in a live run. F1 additionally assumes Gmail's `from:` operator matches display
   names, which is documented behaviour I did not test.
3. **The OAuth scope actually attached to `GMAIL_REFRESH_TOKEN`.** The code
   requests no scope at the exchange, so `gmail.readonly` is a property of a grant
   that does not yet exist. Claim 5 passes on the code and is unverifiable on the
   credential.
4. **`npm run build` on a clean tree.** It fails on this tree for a foreign
   reason (F4). No bundle was produced, so nothing about the deployed dashboard
   was checked.
5. **Any browser observation at any viewport.** `/prospects` needs an admin login.
   All accessibility numbers in section 6 are computed, not measured.
6. **The false-positive rate after the 2026-08-16 role-list widening**
   (`020` gap 5). Closing it means re-running the resolver against 43 live
   third-party sites, which a read-only review must not do.
7. **The Play Store path end to end.** F6 is proven against `playListingMatches`
   in isolation. I did not fetch `play.google.com`, so I did not verify that
   Google's rendered listing HTML contains the developer website in the form the
   guard expects, nor that the search page still yields the app ids
   `extractPlayAppIds` looks for.
8. **`_auth.js` itself.** Treated as trusted prior art. The `requireAuth`
   implementation, its origin whitelist and its role lookup were not re-reviewed
   this pass.
9. **Concurrency between two simultaneous touches on one prospect.** The stamp is
   atomic by construction (one conditional UPDATE), and I proved the filter's
   semantics. The **schedule** write at `_touches.js:302-306` is a second,
   unconditional statement with no advance-only guard, so two concurrent touches
   can race on `next_action_at`. I did not build a concurrent probe for it.
10. **Whether `src/types/index.ts` `Touch` was updated for `external_id`.**
    Grepped, not read in full. F8 item 2.
11. **The other ten dirty files in the tree** (`_revenue.js`, `revenue-report.js`,
    `unlock-audit-report.js`, `Revenue.tsx`, seven other pages,
    `db/supabase-prospect-leads-utm-migration.sql`, `brandgeo/web/site.js`).
    They belong to other sessions and to no packet under review. They are
    unreviewed and should not ship in the same commit as this work.
12. **Whether the 9 rows written by hand on 2026-08-17 are factually correct.**
    F13 establishes who wrote them, not whether the addresses are right.

---

## 9. What must be fixed before this ships

Block list, in order.

1. **F1** sender spoofing in `parseFromAddress`.
2. **F2** outbound backfill re-arming a replied prospect, both the server rule and `isActionableNow`.
3. **F3** the S1 floor on the poller path, with `TOUCH_MIN_OCCURRED_AT` moved to `_touches.js`.
4. **F4** split the commit and get a green `npm run build` on a tree containing only these packets' files.
5. **F6** host-boundary matching in `playListingMatches`. This one is live in production now.
6. **F6b** the resolver invocation arithmetic. Also live now.

Should be fixed in the same round, cheap while the files are open: **F5**, **F7**,
**F8**, **F9**, **A17**.

Needs a decision from Constantin, not a fix: **F13** (what to do with candidate
10 and with the 09:51 batch, and whether the never-query list becomes a database
constraint) and the standing ruling on the TalentWeLove mailbox scope that
packet `021` records as unresolved.

Not blocking, log and move on: **F10**, **F11**, **F12**, **F14**, **F15**,
**F16**, **A18**, **A19**.
