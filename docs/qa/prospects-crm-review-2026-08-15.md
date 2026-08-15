# PASS WITH FINDINGS

Review of handoff packet `015-bg-backend-to-bg-verify-prospects-crm.md`
(BrandGEO prospect CRM: `public.prospects`, `prospects-admin.js`,
`Prospects.tsx`). Reviewer `bg-verify`, 2026-08-15. Read only throughout: no
file under review was edited, no row in `prospects` was modified, no git
command was run.

**Containment holds.** A client viewer JWT reads **0 rows** from
`public.prospects` and an anonymous caller reads **0 rows**, both measured
against production, not inferred from the policy text. The only admin profile
reads 71. There is no permissive `qual = true` policy anywhere on this table,
and the role that `public.is_admin()` reads cannot be self-edited because
`user_profiles` has no INSERT, UPDATE or DELETE policy at all. No path was
found by which a non-admin reads this table.

**Condition for pushing:** the code half is safe to commit and push as is (see
the commit command in section 10). The two stored-data corrections F1 and F2
must be applied to `public.prospects` **before any row in this table is used
to send an email or open a conversation**, because both put a statement in
front of the one person making sales decisions that the cited source
contradicts. Neither is a code change and neither blocks the deploy.

---

## 1. Calibration

**1. Files changed, and whether each is in scope.**

```
 CLAUDE.md                                          |  43 +-
 brandgeo-dashboard/netlify.toml                    |   5 +
 brandgeo-dashboard/netlify/functions/_revenue.js   |  81 +++
 .../netlify/functions/revenue-report.js            |  11 +-
 brandgeo-dashboard/src/App.tsx                     |   2 +
 brandgeo-dashboard/src/components/Layout.tsx       |   9 +-
 brandgeo-dashboard/src/lib/i18nContext.tsx         |   9 +
 brandgeo-dashboard/src/pages/Revenue.tsx           | 805 +++++++++++++++------
 brandgeo-dashboard/src/types/index.ts              |  41 ++
 9 files changed, 762 insertions(+), 244 deletions(-)
```

Untracked, attributable to this packet:
`brandgeo-dashboard/netlify/functions/prospects-admin.js`,
`brandgeo-dashboard/src/pages/Prospects.tsx`,
`brandgeo-dashboard/tests/prospects_admin_whitelist.test.js`,
`db/supabase-prospects-migration.sql`,
`db/supabase-prospects-backfill-2026-08-15.sql`.

`_revenue.js`, `revenue-report.js` and `Revenue.tsx` (805 lines) are **another
session's uncommitted pending-invoices work**, recorded as such in `CLAUDE.md`
under 2026-08-14. They are not part of this change and are excluded from the
commit command in section 10. Every other changed file was verified
prospects-only by reading its diff: `App.tsx` 2 added lines (import plus
route), `Layout.tsx` 9 (icon import plus one admin nav entry plus its comment),
`i18nContext.tsx` 9 (one `nav_prospects` key per language), `types/index.ts`
41 (the `Prospect` interface and `PROSPECT_WRITABLE_FIELDS` only),
`netlify.toml` 5 (one `[functions."prospects-admin"]` block).

Out of `bg-backend`'s AGENT-OS write scope (`netlify/functions/`, `db/`):
`netlify.toml` and `brandgeo-dashboard/tests/`. See F6.

**2. Secret scan.** Run over the four backend files, names and patterns only:

```
prospects-admin.js:24:  * contact_url, linkedin_url, segment, tier, disqualified_reason, audit_token,
prospects-admin.js:51:  segment, tier, stage, disqualified_reason, audit_token, ai_score,
prospects-admin.js:141: const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
supabase-prospects-migration.sql:69:--   audit_token / ai_score / competitor_count
supabase-prospects-migration.sql:94:  audit_token          text,
supabase-prospects-backfill-2026-08-15.sql:8,19,43  (audit_token as a column name)
prospects_admin_whitelist.test.js:21,76,135,141,145  (the words token/authorization in prose and assertions)
```

**14 hits, 0 values.** Every hit is a column name, an env var name, or the
word "token" in prose. No key, no bearer value, no connection string. Clean.

**3. Acceptance criteria, verbatim from the packet, and whether each is
objectively checkable.**

- Verdict (`PASS` / `PASS WITH FINDINGS` / `BLOCK`) is the first line. Checkable.
- RLS policy query reproduced with pasted output, all four policies confirmed admin-gated. Checkable.
- `node tests/prospects_admin_whitelist.test.js` reproduced independently, 15/15 assertions, output pasted. Checkable.
- Auth-gate no-network claim confirmed by reading `_auth.js` alongside the test, not merely by the test passing. Checkable.
- Whitelist rejection confirmed to reject the WHOLE request (400), for at least `domain` and one audit-derived field, including `disqualified_reason` specifically. Checkable.
- At least 2 of the 9 tier-2 D4 outcomes independently re-derived from raw `prospect_audits` data and confirmed. Checkable.
- 3-5 backfilled rows spot-checked against their cited Drive source file. Checkable.
- No em/en dash confirmed across the 4 files by an independent tool run. Checkable, with one ambiguity: the packet says "the 4 new/changed files" but lists five. Read as all five; all five were scanned.
- Secret scan clean; write scope confirmed correct. Checkable.
- Report written to `docs/qa/`, filename recorded in `CLAUDE.md`. The report is checkable; the `CLAUDE.md` edit is outside `bg-verify`'s write scope and is handed to Constantin in section 10 instead.

All ten are objectively checkable. None had to be reinterpreted to be passed.

**4. Baseline before this change.** `npx tsc --noEmit` in
`brandgeo-dashboard/` exits **0 with no output** on the current working tree,
which already contains both halves of this change plus the other session's
`Revenue.tsx` work. There is therefore no pre-existing typecheck failure to
attribute anywhere. `npm run build` was deliberately not run: it consumes
nothing this review needs that `tsc --noEmit` has not already covered for the
changed TypeScript, and the backend half is CommonJS that `tsconfig.json`
(`"include": ["src"]`) never compiles. Stated as a gap, not claimed as a pass.

**5. Auth check guarding the most sensitive function touched.**
`prospects-admin.js:130` `await requireAuth(event, { adminOnly: true })`,
resolving to `_auth.js:109-111`:

```js
if (adminOnly && profile.role !== 'admin') {
  return { response: err(403, 'Forbidden: admin access required', origin) }
}
```

with `profile.role` read from `user_profiles` at `_auth.js:99-104` using the
service key, keyed on the user id returned by `supabase.auth.getUser(token)`
at `_auth.js:93`.

**6. Write access.** `docs/qa/` only, one file:
`docs/qa/prospects-crm-review-2026-08-15.md`. No file under review was edited.
No git command was run. No row in `prospects` was modified.

**CALIBRATED.**

---

## 2. Acceptance criteria table

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Verdict is the first line | PASS | Line 1 of this file: `# PASS WITH FINDINGS` |
| 2 | RLS query reproduced, all four policies admin-gated | PASS | Section 3, production `pg_policies` output. All four `qual`/`with_check` are `is_admin()`, roles `{authenticated}`, permissive, no bare `true` |
| 3 | Test reproduced independently, 15 assertions | PASS | Section 5, full pasted output, `EXIT=0`, "15 assertions passed." |
| 4 | Auth-gate no-network claim confirmed by reading `_auth.js` | PASS | `_auth.js:85-89` returns 401 before `createClient` at `_auth.js:91`. Section 4 |
| 5 | Whitelist rejects the WHOLE request incl. `disqualified_reason` | PASS | `prospects-admin.js:98-101` returns `{ error }` with no `patch`; handler `:172` turns that into a 400 before any Supabase call. Test lines 65-82. Section 6 |
| 6 | At least 2 of the 9 tier-2 D4 outcomes re-derived | PASS | All 9 re-derived, not 2. Section 7 table, straight from `prospect_audits` |
| 7 | 3 to 5 rows spot-checked against the cited Drive file | PASS | 8 rows checked against 3 Drive files. Section 8 |
| 8 | No em or en dash across the new files | PASS | Section 9. 0 in `prospects-admin.js`, 0 in both SQL files, 0 in the test. `netlify.toml` hits are all pre-existing lines, none added |
| 9 | Secret scan clean, write scope confirmed | PASS with finding | Scan clean (calibration 2). Write scope has a second undeclared exception, F6 |
| 10 | Report in `docs/qa/`, filename recorded in `CLAUDE.md` | PARTIAL | This file exists. The `CLAUDE.md` line is outside `bg-verify`'s write scope and is handed over in section 10 |

Packet "Do" items 1 to 8 additionally: item 1 counts reproduced (section 3),
item 2 done, item 3 done, item 4 done, item 5 done nine times over, item 6
done, item 7 done, item 8 done.

---

## 3. Containment: does the RLS actually contain it

### 3.1 The policies, from production

```sql
select tablename, policyname, cmd, roles, permissive, qual, with_check
from pg_policies where tablename = 'prospects' order by cmd;
```
```
prospects | prospects_delete | DELETE | {authenticated} | PERMISSIVE | is_admin() | (null)
prospects | prospects_insert | INSERT | {authenticated} | PERMISSIVE | (null)     | is_admin()
prospects | prospects_select | SELECT | {authenticated} | PERMISSIVE | is_admin() | (null)
prospects | prospects_update | UPDATE | {authenticated} | PERMISSIVE | is_admin() | is_admin()
```

Four policies, no more. The `pg_policies` view returns every policy on the
table, so this is also the proof that **no fifth leaky policy exists**. This
is the specific failure this project hit in July, when permissive `qual = true`
policies sat alongside correct ones on `ai_results` and `prompts` and silently
defeated per-client isolation. It is not present here.

```sql
select relrowsecurity, relforcerowsecurity, pg_get_userbyid(relowner)
from pg_class ... where relname='prospects';
```
```
relrowsecurity = true | relforcerowsecurity = false | owner = postgres
```

RLS is on. `relforcerowsecurity` false only means the table owner (`postgres`)
is exempt, which is expected and is how the Supabase SQL editor and
`service_role` reach the data at all.

### 3.2 What `public.is_admin()` actually resolves to

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid()),
    false
  )
$function$
```

Three properties matter and all three are right:

1. It reads the role from the **database**, not from the JWT. A forged or
   self-issued claim of `"role":"admin"` in a token buys nothing, because the
   value compared is `user_profiles.role` for `auth.uid()`.
2. `COALESCE(..., false)` means a user with no profile row is **not** an
   admin. It fails closed.
3. `SET search_path TO ''` with a fully qualified `public.user_profiles` means
   a caller cannot shadow the table with a temp schema object. `SECURITY
   DEFINER` without a pinned `search_path` is the classic escalation here, and
   it is pinned.

### 3.3 The escalation path that would defeat it, and why it is closed

`is_admin()` is only as good as the integrity of `user_profiles.role`. If a
viewer could update their own row, they could promote themselves and then read
`prospects` legitimately. Checked:

```sql
select policyname, cmd, roles, qual from pg_policies where tablename='user_profiles';
```
```
profiles_read_own        | SELECT | {authenticated} | (id = auth.uid())
user_profiles_select_own | SELECT | {public}        | (id = auth.uid())
```

Two policies, **both SELECT**. There is no INSERT, UPDATE or DELETE policy on
`user_profiles`, so with RLS enabled a client JWT cannot write that table at
all through PostgREST. The escalation path is closed.

### 3.4 Empirical proof, not policy reading

Executed inside explicit transactions that were rolled back. No row was
written or modified.

Client viewer (a real `user_profiles` row, `role = 'viewer'`, `client_id 52`):

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"2a34086c-...","role":"authenticated"}';
select current_user, public.is_admin(), (select count(*) from public.prospects);
rollback;
```
```
acting_role = authenticated | is_admin_result = false | rows_visible_to_viewer = 0
```

Anonymous:

```
acting_role = anon | rows_visible_to_anon = 0
```

Admin, as the control that proves the test is not trivially returning zero
because the harness is broken:

```
acting_role = authenticated | is_admin_result = true | rows_visible_to_admin = 71
```

**A client viewer sees 0 of 71 rows. An anonymous caller sees 0 of 71 rows.
The single admin sees all 71.** Containment is proven, not asserted.

### 3.5 One structural note, not a finding

`anon` and `authenticated` both hold table-level
`SELECT, INSERT, UPDATE, DELETE` grants on `public.prospects`, inherited from
Supabase's default `grant all on all tables in schema public`. RLS is
therefore the only thing standing between an anonymous PostgREST call and this
data. That is the same posture as every other table in this project and the
policies are correct, so it is recorded for awareness rather than as a defect.
Revoking the `anon` grant would be belt and braces; it would not change any
measured outcome above.

No view or materialized view anywhere in the database reads `public.prospects`,
so there is no `security_invoker = false` view acting as a bypass.

---

## 4. The auth gate on the endpoint

The endpoint holds `SUPABASE_SERVICE_KEY` (`prospects-admin.js:141`), which
**bypasses RLS entirely**. So for the endpoint path, `requireAuth` is not
defence in depth, it is the only gate. The migration's header comment gets
this the right way round and says so.

Order of operations in `_auth.js`, read line by line:

| Line | Check | Effect on a non-admin |
|---|---|---|
| `:71-73` | `OPTIONS` returns 204 preflight | No data, correct |
| `:80-82` | Origin not in allowlist returns 403 | Blocks a hostile page, before any token work |
| `:85-89` | No `Bearer` token returns 401 | Returns **before** `createClient` at `:91`, so no Supabase client is constructed and no network call is made. This is exactly the claim the test makes and it is true by control flow, not by luck |
| `:91-96` | `supabase.auth.getUser(token)` | A forged or expired token returns 401 here. Signature validation is Supabase's, not this code's |
| `:99-104` | Reads `user_profiles.role` for `user.id` using the service key | The role comes from the database |
| `:105-107` | No profile returns 403 | Fails closed |
| `:109-111` | `adminOnly && role !== 'admin'` returns 403 | **A valid viewer JWT is rejected here** |

A valid non-admin token therefore reaches `_auth.js:109`, fails, and receives
`403 Forbidden: admin access required`. It never reaches
`prospects-admin.js:133`, so neither `list` nor `update` executes and no
Supabase query against `prospects` is issued.

**What I could not do, stated plainly.** I could not mint a real viewer JWT.
Doing so needs either the anon key plus a viewer's password or the service key
to forge one, and I am not going to handle either. So the `adminOnly` rejection
is established **from source and control flow**, not from an observed 403. Two
things make that reasoning strong rather than hopeful: this is the identical
`requireAuth({ adminOnly: true })` call used by twelve other privileged
functions in this codebase, and the database-side test in section 3.4 proves
that even if the endpoint gate were bypassed entirely, a viewer's own JWT
still reads zero rows through PostgREST. The one gap that remains is a
hypothetical bug inside `requireAuth` itself, which would affect all twelve
functions and not this one.

The endpoint is not deployed (the code is uncommitted), so a live curl against
`https://app.getbrandgeo.com/.netlify/functions/prospects-admin` would have
proved only that Netlify returns 404 for a function that does not exist yet.
It was not run. Recommended as a post-deploy check in section 11.

---

## 5. Test reproduction

```
$ cd "C:/Users/const/Constantin Daniel Goane/BrandGEO/brandgeo-dashboard"
$ node tests/prospects_admin_whitelist.test.js

Contract: the writable whitelist matches the coordinator packet exactly
  ok - WRITABLE_FIELDS is exactly the 7 fields the packet named, no more, no fewer

validateUpdate(): the write whitelist
  ok - a whitelisted field alone is accepted
  ok - multiple whitelisted fields together are accepted
  ok - domain in patch rejects the WHOLE request (400), does not silently drop it and save stage
  ok - every audit-derived / read-only column is rejected individually, including disqualified_reason
  ok - a stage value outside the CHECK constraint list is rejected before it reaches Postgres
  ok - all 9 stage values from the migration CHECK constraint are individually accepted
  ok - an empty patch is rejected rather than silently succeeding as a no-op update
  ok - a missing or non-numeric id is rejected
  ok - a valid ISO timestamp field round-trips
  ok - a timestamp field can be explicitly cleared to null
  ok - an unparseable timestamp is rejected, not silently coerced

exports.handler(): the auth gate rejects before touching Supabase
[Auth] 401: Unauthorized: missing token
  ok - a POST with no Authorization header is rejected 401 before any Supabase call
[Auth] 403: Forbidden: origin not allowed
  ok - a POST from an origin outside the allowlist is rejected 403 before the token is even read
  ok - CORS preflight is answered without requiring auth, same as every other admin function

15 assertions passed.
EXIT=0
```

15 of 15, exit 0. The test file is also honest about its own limits in its
header comment (it states it cannot prove the `adminOnly` branch), which is
the right posture. One inaccuracy in that header is recorded as F5.

---

## 6. The write whitelist, attacked

`validateUpdate` (`prospects-admin.js:86-127`) is pure and exported, so each
of these was evaluated directly rather than reasoned about.

| Attack | Input | Result | Why |
|---|---|---|---|
| Read-only column | `patch: { domain: 'evil.com', stage: 'won' }` | **400, nothing written** | `:98-101` filters `Object.keys` against the Set and returns on any rejection. `stage` is not saved either. The whole request dies |
| Audit-derived column | `patch: { ai_score: 0 }`, and each of `company`, `contact_name`, `contact_url`, `segment`, `tier`, `audit_token`, `competitor_count`, `source` | **400** | Same path, tested individually in the suite |
| `disqualified_reason` specifically | `patch: { disqualified_reason: 'x' }` | **400** | Confirmed. It is absent from `WRITABLE_FIELDS` (`:63-65`). A UI-driven disqualify leaves the column `null`, which is the documented intent |
| Casing | `patch: { Stage: 'won' }` | **400** | `Set.has` is case sensitive, `'Stage'` is not in the Set |
| Nesting | `patch: { stage: { toString: ... } }` | **400** | `:106` requires `typeof === 'string'` before the Set membership test |
| Array as the patch | `patch: ['stage']` | **400** | `:91` rejects with `Array.isArray` |
| Array as a value | `patch: { notes: ['x'] }`, `patch: { stage: ['new'] }` | **400** | `:115` requires string or null, `:106` requires string |
| Prototype pollution | `patch: { "__proto__": { ... } }` | **400** | `JSON.parse` creates `__proto__` as an **own enumerable** property rather than invoking the setter, so `Object.keys` returns it and `:98` rejects it. Nothing is assigned to any prototype |
| Inherited-key confusion | `patch: { constructor: 'x' }`, `{ toString: 'x' }` | **400** | The whitelist is a `Set`, not an object literal, so there is no inherited-property lookup to fool. This is the correct choice and it is worth keeping |
| Empty patch | `patch: {}` | **400** | `:96` |
| Oversize text | 1 MB `notes` | Accepted, truncated to 10 000 chars | `:116` `slice(0, 10000)`. Bounded |
| Row targeting | `.eq('id', id).single()` at `:174-179` | One row maximum | No mass update is expressible through this endpoint |
| Deletion | no `delete` action exists | Not reachable | Only `list` and `update` are dispatched, `:192` rejects anything else |

Two cosmetic coercions, neither a security issue, both admin-only and both
recorded as F10: `next_action_at: ['2026-01-01']` is coerced by `new Date()`
to a valid date, and `id: true` becomes `1` via `Number()`. Neither writes an
unauthorized column and neither escapes the row-level `eq('id', ...)`.

**Verdict on the whitelist: it is correct, it is hard, and the "reject the
whole request" choice is the right one.** A silent drop would have hidden a
future UI bug behind a partial save.

---

## 7. Backfill honesty

### 7.1 The counts, reproduced independently

```sql
select stage, count(*) from public.prospects group by stage order by stage;
```
```
audited      |  9
disqualified | 19
new          | 43
```

```
tier:   1 -> 17, 3 -> 3, null -> 51
source: inbound -> 2, outbound -> 69
total:  71 rows, 70 with an audit token, 1 (getglossa.com) with none
```

All match the packet exactly.

### 7.2 No fabricated stage

```sql
select count(*) from public.prospects
where stage in ('contacted','replied','meeting','won','lost','qualified');  -- 0
select count(*) from public.prospects
where last_contacted_at is not null or replied_at is not null or reply_note is not null;  -- 0
```

**Zero rows sit at `contacted` or any later stage, and zero rows carry a
contact timestamp or a reply note.** Nobody has been contacted and the table
says so. This was the single most important integrity question in the packet
and it is clean.

### 7.3 Every carried value traced to its source row

One sweep, joining each prospect to the latest `status = 'ready'`
`prospect_audits` row for its domain:

```
prospects_rows                        : 71
ready_domains (distinct)              : 70
prospect_rows_without_ready_audit     : 1     (getglossa.com, correct, never audited)
ready_domains_missing_from_prospects  : 0
token_mismatches                      : 0
score_mismatches                      : 0
comp_mismatches                       : 0
segment_mismatches                    : 0
```

**Zero mismatches across 70 rows on four independently carried fields.** Every
`audit_token`, `ai_score`, `competitor_count` and `segment` in the CRM is the
value on the latest ready audit for that domain. No number in this table was
invented, rounded, or carried from the wrong row. 70 + 1 Drive-only = 71,
which is the arithmetic the packet claimed.

### 7.4 D4 re-derived, all nine rather than the two asked for

D4 as stated: `ai_score < 50 AND competitor_flags non-empty AND NOT
low_confidence`. Computed straight from `prospect_audits`:

| Domain | Audited at (UTC) | ai_score | competitor_flags | low_confidence | D4 | Stored stage |
|---|---|---|---|---|---|---|
| driveschoolpro.com | 2026-08-14 21:53:46 | 0 | 2 | false | **pass** | audited |
| easydvm.com | 2026-08-14 21:52:50 | 0 | 4 | false | **pass** | audited |
| smilenotes.co.uk | 2026-08-14 21:53:19 | 0 | 4 | false | **pass** | audited |
| vibefam.com | 2026-08-14 21:54:59 | 0 | 2 | false | **pass** | audited |
| breww.com | 2026-08-14 21:55:54 | 73 | 0 | false | fail | disqualified |
| captainbook.io | 2026-08-14 21:54:13 | 53 | 1 | false | fail | disqualified |
| getonstage.app | 2026-08-14 21:55:27 | 67 | 3 | false | fail | disqualified |
| storeganise.com | 2026-08-14 21:54:32 | 75 | 1 | false | fail | disqualified |
| unittrac.com | 2026-08-14 21:52:25 | 85 | 1 | false | fail | disqualified |

**All nine outcomes are arithmetically correct and all nine stored stages
match.** `breww.com` fails twice over (score 73 and an empty flags array),
which the stored `disqualified_reason` mentions only as a score failure; minor,
noted, not a finding.

The largest inference this backfill made is sound. It is also, as it turns
out, independently corroborated by a Drive file the backfill did not read,
which is F1.

### 7.5 `revenuehunt.com`, the recorded disagreement

```sql
select id, created_at, ai_score, jsonb_array_length(competitor_flags), low_confidence
from public.prospect_audits where domain = 'revenuehunt.com' order by created_at desc;
```
```
92 | 2026-08-14 21:51:31 | ai_score  0 | flags 1 | low_confidence false
82 | 2026-08-14 21:48:22 | ai_score 54 | flags 2 | low_confidence false
23 | 2026-07-16 06:37:10 | ai_score  0 | flags 7 | low_confidence false
```

The stored row is `stage = 'disqualified'` with `ai_score = 0`, and the stored
`disqualified_reason` reads, in full:

> Disqualified by D4: ai_score 54 (>= 50), measured 2026-08-14 21:48
> (60-evidence-run-2026-08-14.md). SOURCE DISAGREEMENT, unresolved: a re-audit
> 3 minutes later at 21:51 scored 0, which would pass D4. The Drive record's
> disqualification decision was not reversed, so it is kept as recorded here
> (ai_score below is the LATEST audit, 0, per this migration's own rule of
> carrying the latest ready row; it does not match this stage). Needs a human
> decision, not resolved by this migration.

**The conflict is genuinely recorded, not smoothed over.** Both measurements,
both timestamps, the source file, the reason the stored score contradicts the
stored stage, and an explicit statement that a human owes a decision. This is
the correct handling: it preserves the human's recorded decision, refuses to
silently reverse it on a newer number, and makes the inconsistency loud rather
than tidy. Confirmed as asked in the packet.

**One fact for Constantin's decision that the backfill did not surface.** There
is a **third** ready audit, from 2026-07-16, which also scored **0**, with 7
competitor flags. So the measurement history is 0, then 54, then 0. The
disqualifying 54 is the outlier of three, not one of two. That does not decide
anything on its own, and I am not deciding it, but it is material and it was
not in front of the person being asked.

### 7.6 Ten rows spot-checked against their cited Drive sources

Sources read: `51-qualification-recheck-2026-08-14.md`,
`60-evidence-run-2026-08-14.md`, `61-tier2-audit-results-2026-08-14.md`,
`10-prospects.csv`, all under
`G:\My Drive\CST Content\GetBrandGEO\7-Sales\2026-08-14-founder-led-prospecting\`.

| Row | Stored claim | Source | Match |
|---|---|---|---|
| `emailoctopus.com` | "`/contact`, `/contact-us` and `/support` all return 404 ... category mean 53.5 across 11 audits" | 51 line 72, verbatim on both counts | yes |
| `getglossa.com` | "`/contact` and `/contact-us` both return 404, only modal demo forms offered, no blog found" | 51 line 73 | yes |
| `jetpackworkflow.com` | "both 404 ... Category does measure 0, so worth a manual recheck if a working contact route is ever found" | 51 line 74, which says exactly that and adds it would go to tier 1 | yes |
| `caretlegal.com` | "Contact form 403s to plain HTTP clients ... Working contact route is `/contact-us/`, not `/contact/` which 404s" | 51 lines 33-35, verbatim | yes |
| `intellibill.io` | "intellibill.com (no .io) redirects to visual-eyes.ca, an unrelated company" | 51 lines 29-32, verbatim | yes |
| `casetempo.com` | "Was ranked number 1 on the original tier-1 list before this measurement", ai_score 68 | 60, "casetempo.com was ranked number 1 on the list", measured 68 | yes |
| `runsensible.com` | contact "Kaven", "Founder (first name as published)", "Full surname not published on their own site" | `10-prospects.csv`, `named_role` = "Kaven, Founder (first name as published)", `risk_notes` = "Full name not published on own site" | yes |
| `trylantern.com` | "Stefania", "Co-founder (first name as published)" | CSV, identical | yes |
| `personalizerai.com` | "Nandini", "Co-founder marketing (first name as published)" | CSV, identical | yes |
| `loremax.ai`, `prejmer-raceway.com` | `source = 'inbound'`, "never reference the visitor audit" | CSV `risk_notes`, identical, and both are the two `X-unknown-visitor` / `B-local-RO` rows | yes |

**No invented company name, no invented person, no invented URL was found.**
Where a source published only a first name, the row stores only a first name
and says so. Where a contact route was never verified, the note says it was
never verified. The four claims that cite code
(`_prospect_prompts.js` alias mappings for `salesmessage.com`,
`gokickflip.com`, `rebuyengine.com`) were checked against
`netlify/functions/_prospect_prompts.js:42,138,144-145,456` and are accurate.

---

## 8. Findings, ranked

### F1. MEDIUM, data and claim integrity. Four stored rows and the migration header assert a Drive document was never updated. It was, in a companion file the backfill did not read.

**What.** `db/supabase-prospects-backfill-2026-08-15.sql:24-38` states the nine
tier-2 D4 outcomes are "undocumented in the Drive markdown, which still
describes resolving these 9 as EUR 2.02 of future work", and four rows
(`easydvm.com:102`, `smilenotes.co.uk:107`, `driveschoolpro.com:112`,
`vibefam.com:117`) each store a `notes` value ending "Drive doc has not been
updated to reflect this." Those notes are now **in the database** and are
rendered by `Prospects.tsx`.

**Where.** `db/supabase-prospects-backfill-2026-08-15.sql:24-38, 102, 107, 112,
117`, and the four corresponding `public.prospects.notes` values.

**Why it is wrong.**
`G:\My Drive\CST Content\GetBrandGEO\7-Sales\2026-08-14-founder-led-prospecting\61-tier2-audit-results-2026-08-14.md`
exists and is titled "Tier 2 audit results, run 2026-08-14". It records all
nine outcomes, the same four qualified and the same five disqualified, the
same scores, the same competitor counts, and the same audit tokens, plus the
HTTP status of each of the four public report pages. The backfill's source
list names `51-`, `60-`, `10-prospects.csv` and `05-STANDING-` but not `61-`.

**Consequence.** The one person reading this CRM is told a record is missing
when it exists, and told a follow-up is owed that is already done. That sends
him to re-derive or re-run work already completed. It also, less obviously,
understates the confidence of the four qualified rows: they are not a lone
inference by one agent, they are an inference that independently reproduces a
human-written verification document line for line. That is a stronger position
than the note claims.

**Fix.** Read-only correction to four rows plus the file header. Nothing about
the derivation changes, because it was right.

```sql
update public.prospects
set notes = replace(
      notes,
      'Drive doc has not been updated to reflect this.',
      'Independently corroborated by 61-tier2-audit-results-2026-08-14.md, which records the same nine outcomes.')
where domain in ('easydvm.com','smilenotes.co.uk','driveschoolpro.com','vibefam.com');
```

Owner `bg-backend`, and the same correction should be made to the header
comment of `db/supabase-prospects-backfill-2026-08-15.sql` so a re-run does not
reintroduce the claim.

### F2. MEDIUM, data integrity. Five disqualified rows are labelled `tier = 1`, which the tier column's own documentation defines as qualified, and which their cited source contradicts.

**What.** `unittrac.com`, `captainbook.io`, `storeganise.com`,
`getonstage.app` and `breww.com` are stored with `tier = 1` and
`stage = 'disqualified'`.

**Where.** `db/supabase-prospects-backfill-2026-08-15.sql:120-143`, and the
five corresponding rows. Column semantics at
`db/supabase-prospects-migration.sql:65-67`: "tier 1 qualified, 2 open, 3
removed".

**Why it is wrong.** `51-qualification-recheck-2026-08-14.md` records all nine
of these domains under "Tier 2", meaning checks 1 to 3 passed and check 4 was
open. Its Tier 1 heading reads "Passed all four checks" and its Tier 3 heading
reads "Removed". These five then **failed** check 4 on measurement. Labelling
them tier 1 says they passed all four checks, which is the opposite of what
happened, and it contradicts both the source document and the migration's own
column comment. The four that did pass D4 are a defensible promotion to tier 1;
these five are not.

**Consequence.** `Prospects.tsx:298` renders `segment · tier` on every row. A
filter or a future query along the lines of "show me the tier 1 list" returns
17 rows of which 8 are disqualified and 5 of those are mislabelled outright.
The count of genuinely qualified prospects, the number this whole exercise
exists to produce, cannot be read off the tier column.

**Fix.** Decide the intended convention and apply it once. The reading most
consistent with the source and the column comment:

```sql
-- proposal, needs Constantin's or bg-architect's ruling on the convention first
update public.prospects set tier = 3
where domain in ('unittrac.com','captainbook.io','storeganise.com','getonstage.app','breww.com');
```

`casetempo.com`, `caretlegal.com` and `revenuehunt.com` should keep `tier = 1`:
those three genuinely were tier 1 in the source document at the time it was
written, so their label is a faithful transcription of a point-in-time record.
The distinction is worth stating in the migration header, because "tier is
where the source put it" and "tier is where the row belongs today" are
different columns and this table currently mixes them.

### F3. MEDIUM, frontend correctness. A genuine 404 from the update endpoint is reported to the admin as "the backend is not deployed", and the optimistic change is left on screen although nothing was saved.

**What.** `Prospects.tsx:465`:

```js
updateProspect(id, patch).then(({ status, data }) => {
  if (status === 404) { setUnavailable(true); return }
```

**Where.** `brandgeo-dashboard/src/pages/Prospects.tsx:465`, against
`brandgeo-dashboard/netlify/functions/prospects-admin.js:183`, which returns
`404 { error: 'Prospect <id> not found.' }` when `.single()` matches no row
(PostgREST `PGRST116`).

**Why it breaks.** The page uses 404 as its signal that the Netlify function
does not exist yet, which is correct for the `list` call made on mount. On the
`update` call the same status carries a completely different meaning. Two
failures result at once: the admin is told the backend is undeployed when it is
deployed and working, and the `return` skips the rollback branch below it, so
the row keeps the optimistic change while the database has nothing.

**Exploit path, concrete and reachable.** The admin has the page open. The row
is deleted or its id changes (a re-run of the backfill after a `truncate`, a
manual cleanup, a second admin session). The admin marks the prospect
`contacted`. The UI shows `Contacted` and a fresh `last_contacted_at`. The
database has neither. The next queue sort therefore omits a prospect that was
never actually contacted, or keeps one that was. On a page whose stated purpose
is "trusting the queue order enough to act on it", a silently lost stage change
is the worst available failure.

**Fix.** Distinguish the two cases. Treat 404 as "backend missing" only on the
mount-time `list`; on `update`, fall through to the existing rollback branch:

```js
// Prospects.tsx onPatch
updateProspect(id, patch).then(({ status, data }) => {
  if (status === 404 && !data?.error) { setUnavailable(true); return }  // no function deployed
  if (data?.error || !data?.prospect) {                                 // includes "Prospect N not found."
    setErrorMsg(data?.error || 'Could not save that change. Reverted.')
    setProspects(prev => prev.map(p => (p.id === id ? previous : p)))
    return
  }
  ...
```

Owner `bg-app`. `bg-verify` does not edit the code it reviews; this is written
into the finding, not applied.

### F4. LOW, sales operations. Two of the five tier-1 qualified rows store an audit token other than the one whose public report page was actually fetched and verified.

**What.** `60-evidence-run-2026-08-14.md` verified five public report URLs over
HTTP with no key sent. Two of the tokens it verified are not the tokens now in
the CRM:

| Domain | Token verified in the Drive doc | Token stored in `prospects` | Stored audit taken |
|---|---|---|---|
| `lawcus.com` | `_pX4jTDm1b9Jl5DtdNUYgZgZ` | `9E8gooatqve-HmJUByTdEuXq` | 2026-08-15 06:42 |
| `pureclarity.com` | `BmkIwQoi7gEDcLuqdQFba3_i` | `uBm55JUjyf3f4Q7ZTF_Z7Var` | 2026-08-14 21:53 |

**Where.** `db/supabase-prospects-backfill-2026-08-15.sql:59, 72`.

**Why it is minor rather than serious.** This is the migration's own documented
"carry the latest ready row" rule working as designed, not an error. I checked
the risk directly rather than assuming it: every one of the 70 stored tokens
resolves to a `status = 'ready'` audit, and all are `unlocked = true` except
`getbrandgeo.com` and `talentwelove.com`, which are our own two domains and are
disqualified rows nobody will ever send. So the substituted reports should
render. What is missing is only that these two exact URLs were never fetched,
and an email-gated report is precisely the failure
`05-STANDING-CORRECTIONS-AND-RUNBOOK-V2.md` correction 2 exists to catch.

**Fix.** Before the first send, fetch the two URLs with no credentials and
confirm HTTP 200 with `unlocked:true`:

```
https://app.getbrandgeo.com/audit/9E8gooatqve-HmJUByTdEuXq
https://app.getbrandgeo.com/audit/uBm55JUjyf3f4Q7ZTF_Z7Var
```

### F5. LOW, review integrity. The test file cites evidence that does not exist.

**What.** `tests/prospects_admin_whitelist.test.js:19-23` says the `adminOnly`
branch is "proven by the curl in the bg-backend handoff". Packet
`015-bg-backend-to-bg-verify-prospects-crm.md` contains no curl, no command
output, and no reference to one.

**Where.** `brandgeo-dashboard/tests/prospects_admin_whitelist.test.js:21-22`.

**Why it matters.** The comment is otherwise the most honest thing in the file,
correctly stating what the test cannot prove. Pointing at evidence that is not
there converts an honest limitation into an apparent one that has been covered.
A later reader takes the `adminOnly` path as verified when nobody verified it.

**Fix.** Change the sentence to name the real state: the `adminOnly` branch is
established from source (`_auth.js:109-111`) and by the database-side RLS test
in this report, and has not been exercised with a live viewer JWT.

### F6. LOW, scope discipline. A second file outside `bg-backend`'s write scope, undeclared.

**What.** AGENT-OS §1 gives `bg-backend` `brandgeo-dashboard/netlify/functions/`
and `db/`. This change also wrote `brandgeo-dashboard/netlify.toml` and
`brandgeo-dashboard/tests/prospects_admin_whitelist.test.js`. The packet's own
"Do" item 8 asks `bg-verify` to confirm the scope was functions and db only,
"netlify.toml edit is **the one exception**". It was not the one exception,
it was one of two.

**Why it is not a block.** Both are precedented and neither ships to a
customer. `netlify.toml` carries the identical `promotions-admin` block
immediately above, and `brandgeo-dashboard/tests/` already holds
`revenue_report.test.js` and `enqueue_history.test.js` written under the same
department. The file is a test with no runtime path. The failure here is the
declaration, not the act.

**Fix.** Either widen `bg-backend`'s scope in AGENT-OS §1 to include
`brandgeo-dashboard/tests/` and `netlify.toml`, or declare both in each packet.
Owner `bg-orchestrator`.

### F7. LOW, claim integrity. The stored scores predate the reproducibility fix and the CRM does not say so.

**What.** `61-tier2-audit-results-2026-08-14.md` records that the audit
reproducibility fix shipped in commit `8546f0d` at 07:33 on 2026-08-15, after
every audit whose score this backfill carries. Under the old path the prompt
set was regenerated through `gpt-4o-mini` at `temperature: 0.4` on each call,
so a re-run can return a different number. `revenuehunt.com` (section 7.5) is
that risk realised.

**Where.** Every `ai_score` in `public.prospects`, and by extension
`Prospects.tsx:188-215`, which renders the score as a settled fact and sorts
the entire work queue by it (`evidenceStrength`, `:145-148`).

**Why it matters.** Queue order is derived from these numbers. A score that a
re-run might not reproduce is being used to rank who gets contacted first. The
Drive doc's own recommendation is not to re-audit the four stable zeros, which
is reasonable, but the caveat should travel with the data rather than living
only in a Drive markdown file.

**Fix.** One line in the migration header, and ideally a note on the score chip
tooltip in `Prospects.tsx`, recording that scores taken before `8546f0d` came
from the non-reproducible path. Owners `bg-backend` and `bg-app`.

### F8. LOW, cosmetic input coercion in `validateUpdate`.

`next_action_at: ['2026-01-01']` is coerced by `new Date()` through array
stringification into a valid date and accepted. `id: true` becomes `1` via
`Number()` and targets prospect 1. Neither writes a non-whitelisted column,
neither escapes the single-row `eq('id', ...)`, and both require an
authenticated admin. Tighten with `typeof rawPatch[field] === 'string'` before
`parseWhen`, and `typeof body.id === 'number' || typeof body.id === 'string'`
before `Number()`, if this is ever touched again.
`brandgeo-dashboard/netlify/functions/prospects-admin.js:71-75, 87`.

### F9. INFO, PRE-EXISTING, not a defect here. The `/prospects` route is not admin-gated at the router.

`src/App.tsx` mounts `/prospects` inside `PrivateRoute` and `OnboardGate` but
not an admin guard; the nav entry is admin-gated in `Layout.tsx`, which is link
hiding, not protection. A viewer who types the URL is stopped by
`Prospects.tsx:511` ("Access restricted to admins.") and, importantly, by
`:440` `if (!isAdmin) return`, which means no fetch is issued at all. Even if
both were bypassed, the endpoint returns 403 and PostgREST returns zero rows.
Three independent layers hold. Recorded because it is the same shape as the
project's existing route-gating convention, not because this change introduced
a hole.

### F10. INFO. `anon` holds table-level DML grants on `public.prospects`.

Covered in section 3.5. Standard Supabase default, identical on every table in
this project, fully denied by RLS in the measured test. Revoking is optional
hardening, not a fix.

**Closed, not a finding.** The packet flags `src/types/index.ts:111` typing
`tier` as `string | null` against a `smallint` column. On the current working
tree that line reads `tier: number | null`, so it is already fixed. It was
cosmetic regardless: the only consumer is
`Prospects.tsx:298` `{p.tier ? ` · ${p.tier}` : ''}`, a template interpolation
with no string-only method call, so it could not have thrown. `npx tsc
--noEmit` exits 0.

---

## 9. Standing checks

**Em and en dashes.** Independent scan, Python by code point (U+2014, U+2013),
reproducing the builder's method with a different runner:

```
brandgeo-dashboard/netlify/functions/prospects-admin.js      => 0
db/supabase-prospects-migration.sql                          => 0
db/supabase-prospects-backfill-2026-08-15.sql                => 0
brandgeo-dashboard/tests/prospects_admin_whitelist.test.js   => 0
brandgeo-dashboard/netlify.toml                              => 10  (all pre-existing)
brandgeo-dashboard/src/pages/Prospects.tsx                   => 13  (all code comments)
```

`netlify.toml`'s 10 hits are on lines 15, 17, 105, 134, 153 and 177, all
pre-existing and none inside the five lines this change added (verified against
`git diff`). `Prospects.tsx`'s 13 are on lines 2, 12, 24, 30, 43, 44, 69, 102,
143, 185, 292, 457 and 579, every one inside a `/* */` or `//` comment, none
inside a rendered string. Rendered copy on that page is clean. `Layout.tsx`
adds one em dash, also in a comment. Not findings under the guardrail, which
governs customer-facing output; recorded so a future scan does not re-raise
them.

**Secrets.** Clean, 14 name-only hits, 0 values. Calibration answer 2.

**Logging.** `prospects-admin.js:188` logs the prospect id, the patch key names
and the acting user id. No domain, company, contact name or score is logged.
`:163` and `:184` log only `error.message`. No prospect data reaches the logs
and no service key is echoed. `Prospects.tsx` contains no `console.log`.

**Service key exposure.** `SUPABASE_SERVICE_KEY` is referenced only at
`prospects-admin.js:141`, server side, and never returned in a response body.
The client half authenticates with the user's own session token
(`Prospects.tsx:74-79`). Correct.

**Typecheck.** `npx tsc --noEmit` in `brandgeo-dashboard/`: exit 0, no output.

---

## 10. Regression surface

Found by grep, not by intuition.

| What changed | What reads it | Needs a look |
|---|---|---|
| `public.prospects` (new table) | Nothing else. `grep -rn "prospects" netlify/functions/` matches only `prospects-admin.js` and unrelated `prospect_audits` / `prospect_leads` code | No |
| `prospect_audits` | Read only by this backfill. `audit-domain.js` and `unlock-audit-report.js` write it and are untouched | No |
| `prospect_leads` | Deliberately not touched by the migration, header says so, confirmed by grep | No |
| `public.is_admin()` | Now used by 4 more policies. The function itself was not modified (`create or replace` with identical body) | No, but it is now load-bearing for one more table |
| `netlify.toml` | One added block. Netlify config only | No |
| `src/types/index.ts` | Additive only, 41 lines, `Prospect` and `PROSPECT_WRITABLE_FIELDS` | No |
| `src/App.tsx`, `Layout.tsx`, `i18nContext.tsx` | Additive, prospects-only, verified line by line | No |
| `_auth.js` | Not modified. One more caller | No |

Manual look worth having anyway: `brandgeo-dashboard/src/components/Layout.tsx`
mobile bottom nav, since the new admin route is deliberately excluded from the
7-icon strip and reachable only through the sidebar drawer. That is a stated
design decision in the added comment, not a defect, but it is the one
user-visible behaviour nobody has exercised on a phone.

### The two halves agree

`prospects-admin.js` `SELECT_COLS` (`:49-54`) and the `Prospect` interface
(`types/index.ts:102-126`) are field for field identical, 23 fields, same
names. `WRITABLE_FIELDS` (`prospects-admin.js:63-65`) and
`PROSPECT_WRITABLE_FIELDS` (`types/index.ts:128-131`) are the same 7 strings in
the same order. Envelope matches:
`{ action: 'list' } -> { prospects }` and
`{ action: 'update', id, patch } -> { prospect } | { error }`, both sides.

Every patch the UI can construct was traced to the whitelist:
`changeStage` sends `stage` plus `last_contacted_at` or `replied_at`
(`:118-123, 265`); Log touch sends `last_contacted_at` (`:314`); the expanded
panel sends `next_action_at` (`:364`), `owner` (`:376`), `notes` (`:386`),
`reply_note` (`:400`). Seven fields, all whitelisted, nothing else.
`STAGE_ORDER` (`:90-92`) is the same 9 values as `VALID_STAGES`
(`prospects-admin.js:57-59`) and the `prospects_stage_check` constraint.
**The UI cannot construct a patch the server will reject in normal use.** The
one place the two halves disagree is the meaning of a 404, F3.

---

## 11. What was not checked

Explicitly, so nobody reads a gap as a pass.

1. **A live valid non-admin JWT was never sent to the endpoint.** Minting one
   needs credentials I will not handle. The `adminOnly` rejection is
   established from source control flow and from the database-side RLS test,
   not from an observed 403. Section 4 states the reasoning and its limit.
2. **A live valid admin JWT was never sent either.** The happy path of both
   actions has not been exercised end to end against production. The endpoint
   is uncommitted and undeployed, so there was nothing to call.
3. **No write was attempted against `prospects` as a viewer.** The packet
   restricts me to read-only SQL, so INSERT, UPDATE and DELETE containment is
   established from the policy definitions (all four call `is_admin()`) and
   from the fact that the SELECT policy provably denies, not by attempting a
   blocked write. The UPDATE policy carries both `USING` and `WITH CHECK`,
   which is the correct shape.
4. **The four public report URLs were not fetched.** F4 records the two that
   need it. `unlocked = true` was read from the database instead, which is a
   weaker proxy than an HTTP 200.
5. **No browser was opened on `Prospects.tsx`.** No viewport was measured, no
   contrast ratio computed, no keyboard traversal walked, no focus ring
   observed, no hit target measured. The page is uncommitted and undeployed and
   this packet's acceptance criteria are entirely backend. Accessibility on
   this page is **unreviewed**, and the following are unverified rather than
   passing: the `<select>` at `:321-328` has an `aria-label` and the toggle at
   `:345-352` has `aria-expanded`, both read from source, but colour contrast
   on `text-slate-500` and `text-slate-600` against `bg-dark-800` (used at
   `:190, 209, 282, 298, 413`) is exactly the range that failed elsewhere in
   this dashboard at 1.07:1 to 1.39:1, and the `text-[10px]` and `text-[11px]`
   labels are below the project's own type floor. **A `bg-verify` accessibility
   pass or a `dashboard-auditor` run is owed on this page before it is
   considered done.** It is not in this packet's scope and does not affect this
   verdict.
6. **`npm run build` was not run.** `tsc --noEmit` exit 0 covers the changed
   TypeScript; a full build would also compile another session's uncommitted
   `Revenue.tsx` work and tell me nothing about this change.
7. **The 43 rows left at `new` were not individually audited** against their
   sources. Twenty-two of them are the 2026-07-16 batch the packet flags as an
   open question for Constantin. Their stored `ai_score` and
   `competitor_count` were verified against `prospect_audits` in the sweep
   (section 7.3, zero mismatches), but the judgement that they should stay
   `new` was not re-litigated. That is the packet's open question 2 and it is
   his to answer.
8. **Google Drive source files were read, not verified.** They are the
   authority this backfill cites; I confirmed the backfill transcribes them
   accurately. I did not re-run any HTTP check they claim to have made.
9. **No load, concurrency or rate-limit testing.** `prospects-admin` is not
   covered by `checkCollectionLimits` and has no rate limit of its own beyond
   `requireAuth`. Same posture as `promotions-admin`. An admin-only endpoint
   behind a role check, so not raised as a finding.

---

## 12. Open questions for Constantin, unchanged

Both are the packet's, repeated because they are still open and I did not
resolve either.

1. **`revenuehunt.com`.** Keep disqualified as recorded, or re-open on the
   newer measurement? New information from this review: the score history is
   **0 (2026-07-16), 54 (21:48), 0 (21:51)**. The disqualifying 54 is one
   reading of three.
2. **The 22 domains left `new` from the 2026-07-16 batch.** A deliberate
   cleanup pass, or leave them for hand triage?

And one new one raised by F2:

3. **What does `tier` mean once a row has moved on?** The value where the
   source document put it, or the value the row deserves today? The column
   currently holds both meanings and cannot be filtered on until that is
   settled.

---

## 13. Commit command

Per the standing rule from packets `006`, `011` and `012`, `bg-verify` writes
this rather than `bg-backend` drafting it for its own work.

**Do not run two git commands from two sessions at once.** The working tree
carries another session's uncommitted pending-invoices work in
`_revenue.js`, `revenue-report.js` and `Revenue.tsx`. The command below stages
exact paths and never `-A`, so that work is not swept in. Confirm no other
BrandGEO session is mid-git before running it.

```
cd "C:\Users\const\Constantin Daniel Goane\BrandGEO"

git add brandgeo-dashboard/netlify/functions/prospects-admin.js ^
        brandgeo-dashboard/tests/prospects_admin_whitelist.test.js ^
        brandgeo-dashboard/netlify.toml ^
        db/supabase-prospects-migration.sql ^
        db/supabase-prospects-backfill-2026-08-15.sql ^
        brandgeo-dashboard/src/pages/Prospects.tsx ^
        brandgeo-dashboard/src/types/index.ts ^
        brandgeo-dashboard/src/App.tsx ^
        brandgeo-dashboard/src/components/Layout.tsx ^
        brandgeo-dashboard/src/lib/i18nContext.tsx ^
        .claude/handoffs/015-bg-backend-to-bg-verify-prospects-crm.md ^
        docs/qa/prospects-crm-review-2026-08-15.md

git status
```

Read `git status` and confirm exactly twelve paths are staged and that
`_revenue.js`, `revenue-report.js` and `Revenue.tsx` are **not** among them.
Then:

```
git commit -m "feat(crm): prospects table, admin-only endpoint and UI, 71 rows backfilled" -m "New public.prospects with admin-only RLS on all four verbs via public.is_admin(), stage CHECK, updated_at trigger. Migration and backfill already applied to duiyifepitvugyulobqm. prospects-admin.js exposes list and update behind requireAuth adminOnly, with a hard 400 on any patch key outside a 7 field whitelist. Prospects.tsx is the admin work queue. Reviewed in docs/qa/prospects-crm-review-2026-08-15.md, verdict PASS WITH FINDINGS: containment measured, a viewer JWT and an anonymous caller each read 0 of 71 rows. Two stored-data corrections owed before outreach, F1 and F2."
```

Push rides the next batch per the credit-economy rule. This change touches
`brandgeo-dashboard/`, so Netlify will build rather than cancel.

**Owed to Constantin, outside `bg-verify`'s write scope:** add
`docs/qa/prospects-crm-review-2026-08-15.md` to `CLAUDE.md`'s CURRENT STATE
section, alongside the other 2026-08 QA artifacts. Packet acceptance criterion
10 asks for it and `bg-verify` may not write `CLAUDE.md`.

---

## 14. Verdict

**PASS WITH FINDINGS.**

The thing this review existed to establish is established. A client viewer
cannot read this table, an anonymous caller cannot read this table, and the
role that grants access cannot be self-edited. That was measured against
production three ways, with an admin control proving the test was capable of
returning a non-zero answer. There is no leaky permissive policy of the kind
that defeated `ai_results` and `prompts` in July.

The write whitelist is the strongest part of the change: a hard 400 on the
whole request, a `Set` rather than an object so inherited keys cannot fool it,
and immunity to casing, nesting, arrays and `__proto__` confirmed by direct
evaluation rather than by reading.

The backfill is honest. Zero rows claim a contact that never happened, zero
carry a fabricated timestamp, and all 70 audit-derived values match their
source rows exactly with no mismatches on any of four fields. The D4
arithmetic is correct on all nine rows, not just the two the packet asked me to
check, and the `revenuehunt.com` disagreement is recorded in full rather than
resolved by picking a side.

Three MEDIUM findings stand. Two of them (F1, F2) are inaccurate stored text
and an inaccurate stored label, correctable with two `UPDATE` statements and a
ruling; neither invented a fact and both err conservatively. The third (F3) is
a frontend bug that can silently lose a stage change, owned by `bg-app`.

Nothing here blocks the commit or the deploy. The code is safe to ship. The
condition stated at the top stands: fix F1 and F2 in the database before a
single row of this table is used to open a conversation, because the person
opening it is the one being misinformed.
