# Retroactive review: `3dadd8b` (Promotions) and `b6d4038` (View as current user)

**Verdict: PASS WITH FINDINGS.**

Both stated invariants hold. No exploitable defect was found in either subject.
Four findings are recorded, all LOW, none blocking. Two things could not be
closed from source or from the database and are named as open in §5 rather than
reported as verified.

| Field | Value |
|---|---|
| Reviewer | `bg-verify`, independent of both builders |
| Date | 2026-07-29 |
| Subjects | commit `3dadd8b` (admin Promotions panel and backend), commit `b6d4038` (view as current user) |
| Reviewed against | the working tree as of 2026-07-29, not a `git diff`. See §5.4. |
| Scope written | this file only. No reviewed file was edited. |
| Live DB | `duiyifepitvugyulobqm`, read only. Two probe queries ran inside `begin ... rollback`. Nothing was written. |

---

## 1. Subject 1, the `promotions-admin` gate

### 1.1 Is `adminOnly` enforced server side against `user_profiles.role`

**Yes. CONFIRMED from source.** `netlify/functions/_auth.js:67-122` runs a fixed
sequence with no branch that skips it:

1. `:71` OPTIONS returns a preflight.
2. `:80` origin allowlist.
3. `:85-89` the bearer token must be present, otherwise `401 Unauthorized: missing token`.
4. `:93` `supabase.auth.getUser(token)`. This is a server side validation call
   against Supabase Auth using the service key. A forged, expired, or altered
   token fails here and returns `401 Unauthorized: invalid or expired token`.
5. `:99-104` the role is read from the database, `select role, client_id from
   user_profiles where id = user.id`, keyed on the id that step 4 returned.
6. `:109-111` `if (adminOnly && profile.role !== 'admin')` returns
   `403 Forbidden: admin access required`.

The role is never taken from the request. It is never taken from a JWT claim.
It is read from `user_profiles` with the service key, using an identity that
Supabase itself certified one line earlier.

### 1.2 Can it be spoofed from anything client controlled

**No. CONFIRMED.** The only client controlled inputs on this path are the
`Origin` header, the `Authorization` header, and the JSON body.

- The body is parsed at `promotions-admin.js:120`, which is **after** the gate
  at `:111`. Nothing in the body can influence the gate because the gate has
  already returned by then.
- A repo wide grep for an impersonation or role parameter crossing the wire
  returned zero hits in any function or any `src/` file:
  `impersonat|viewing_as|view_as|as_user|body\.role|body\.is_admin|body\.isAdmin`
  matched only two prose comments in `Layout.tsx:293` and `:714`.
- The token is carried in an `Authorization` header, not a cookie, so a cross
  site form post carries no credential. There is no CSRF path to this endpoint.
- `:99-104` destructures only `data`, discarding the error. A transient database
  failure therefore yields `profile === null`, which hits the `403` at `:105-107`.
  The gate fails closed, not open.

### 1.3 Does any code path reach the service key before the gate

**No. CONFIRMED.** `promotions-admin.js:111-112` is the first statement of the
handler. The function's own service key client is not constructed until `:122`,
after the gate, after the method check, and after body parsing.

`requireAuth` does construct a service key client internally at `_auth.js:91`,
before the role check at `:109`. That client is used only to call
`auth.getUser` and to read `user_profiles`, and on any failure the function
returns `{ response }` and the client is discarded. It is returned to the caller
only on success, and for `adminOnly: true` success means an admin.
`promotions-admin.js` ignores it and builds its own. Not a leak.

### 1.4 What the "unauthenticated POST returns 401" evidence actually proved

It proved step 3 only, the missing token branch at `_auth.js:87-89`. It says
nothing about steps 4, 5 and 6. That criticism of the existing evidence is
correct. The gate is now closed at the source level by §1.1 to §1.3. It is
**not** closed by execution against the deployed function. See §5.1.

---

## 2. Subject 1, the RLS policies

### 2.1 The three policies exist and say what their names imply

`pg_policies`, live, 2026-07-29:

| policyname | permissive | roles | cmd | qual | with_check |
|---|---|---|---|---|---|
| `promotions_insert` | PERMISSIVE | `{authenticated}` | INSERT | null | `is_admin()` |
| `promotions_select` | PERMISSIVE | `{authenticated}` | SELECT | `is_admin()` | null |
| `promotions_update` | PERMISSIVE | `{authenticated}` | UPDATE | `is_admin()` | `is_admin()` |

Exactly three rows. Matches `db/supabase-promotions-migration.sql:88-99` verbatim.
`UPDATE` carries both `USING` and `WITH CHECK`, so an admin cannot move a row
out of its own visibility either. `anon` appears in no policy.

`pg_class`: `promotions.relrowsecurity = true`. RLS is on, so the policies are
live rather than inert.

### 2.2 `is_admin()` is not spoofable

```
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT COALESCE((SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid()), false)
$function$
```

`SECURITY DEFINER` with `search_path` pinned to empty and every reference schema
qualified, so it cannot be hijacked by a search_path attack. It resolves the
role from `auth.uid()`, which PostgREST derives from the verified JWT. It
`COALESCE`s to `false`, so a user with no profile row is not an admin rather
than null.

### 2.3 Executed, not only read

Probe run inside a transaction that was rolled back, impersonating a real viewer
(`user_profiles.role = 'viewer'`):

```sql
begin;
select set_config('request.jwt.claims','{"sub":"14b924d5-...","role":"authenticated"}',true);
set local role authenticated;
select current_user, public.is_admin(), (select count(*) from public.promotions);
rollback;
-- acting_as = authenticated, is_admin_says = false, promotions_visible = 0
```

Same probe with the single admin id returned `is_admin_says = true`.

So the predicate that every one of the three policies is built from evaluates
`false` for a real viewer and `true` for the real admin, executed against the
live database rather than inferred.

### 2.4 Can a viewer read or write another tenant's promotions

The question does not have a per-tenant form: `promotions` has no `client_id`
column by design (migration `:19-21`), so a promotion is platform wide. The
correct statement, and the one that was verified, is stronger: **a viewer cannot
read or write any promotion at all.** `is_admin()` is `false` for every one of
the nine viewer profiles, and it is the sole predicate on all three verbs.

### 2.5 Is the missing DELETE policy compensated for anywhere

**No. CONFIRMED.** `pg_policies` returns three rows for `promotions` and none of
them is a DELETE. Under Postgres, a command with RLS enabled and zero permissive
policies for that command is denied unconditionally, for `anon` and
`authenticated` alike. There is no second permissive policy to OR against, which
is the failure mode that caused the 2026-07-08 nine policy leak recorded in
`CLAUDE.md` §6.4 step 7. It has not recurred here.

Table grants are the Supabase default: `anon` and `authenticated` both hold
`SELECT, INSERT, UPDATE, DELETE` on `public.promotions`. That is expected and is
exactly why RLS is the only thing standing. It is standing.

`relforcerowsecurity = false`, so the table owner (`postgres`) and `service_role`
bypass RLS. That is by design and is the mechanism `promotions-admin.js` relies
on, which is why §1 matters more than §2.

`promotions-admin.js` exposes no delete action: the dispatch at `:125`, `:143`,
`:168` handles `list`, `create`, `toggle`, and `:197` rejects anything else.
Intent holds on both halves.

### 2.6 The migration was applied faithfully

`pg_constraint` on `public.promotions` returns `promotions_pkey`,
`promotions_created_by_fkey` (`ON DELETE SET NULL`),
`promotions_discount_type_check`, `promotions_value_check`,
`promotions_window_check`. `pg_indexes` returns `promotions_pkey`,
`promotions_code_lower_key` (`UNIQUE ... btree (lower(code))`),
`promotions_active_created_idx`. Every object in
`db/supabase-promotions-migration.sql` is present with the definition the file
declares. The `lower(code)` unique index in particular is live, so the `23505`
branch at `promotions-admin.js:158` is reachable and duplicate codes cannot be
created by a direct SQL insert that skips the function's upper casing.

`db/supabase-promotions-migration.sql:5-9` still carries a `NOT YET APPLIED`
banner, and `promotions-admin.js:18-23` still says "has not been run yet". Both
are stale. See F1.

### 2.7 Mass assignment on create and toggle

Checked because it is the usual way an admin only writer becomes a problem.
Clean. `validateCreate` (`:64-108`) builds an explicit seven field row and
returns only that. `:149` inserts `{ ...row, created_by: auth.user.id }`, taking
the author from the verified session and not from the body. `id`, `active` and
`created_at` are not settable on create. `toggle` (`:173-178`) updates exactly
`{ active }` and nothing else.

---

## 3. Subject 1, `SECURITY-AUDIT.md` F1, the role provisioning path

**F1 is CLOSED. Independently confirmed, both at the source layer and in the
live database.**

F1's claim was that `signup-client.js` assigned `role: 'admin'` to self serve
signups, and was survivable only because that function was otherwise broken.

**Every writer to `user_profiles` in the repo.** Exhaustive, by grep for
`from('user_profiles')` followed by `insert|upsert|update` across
`netlify/functions/`. There are exactly three:

| Path | Line | Role written | Gate |
|---|---|---|---|
| `onboard-client.js` | `:155` | `userRole` | `requireAuth(event, { adminOnly: true })` at `:72`, and `userRole` is whitelisted at `:108` as `VALID_ROLES.includes(role) ? role : 'viewer'` against `['admin','viewer']` at `:67` |
| `provision-account.js` | `:181` | literal `'viewer'` | JWT verified inline at `:78-84`. Cannot use `requireAuth`, documented at `:22-25`, because the caller has no profile yet by definition |
| `stripe-webhook.js` | `:203`, `:232` | literal `'viewer'` | webhook path |

There is no fourth writer and no `update` of `role` anywhere.
`signup-client.js:21-22` now states in its own header that it creates no role and
no clients row, and a grep for `role` in that file returns only those two comment
lines. The F1 defect is gone from the code, not merely unreachable.

**Can any self serve path reach `role='admin'`.** No. The only path that can
write `'admin'` is `onboard-client.js`, and it is behind `adminOnly: true`, which
§1 established cannot be spoofed. The two self serve paths hardcode the string
literal `'viewer'`, so there is no input to manipulate.

**Can a user escalate their own role after the fact.** No. `pg_policies` on
`user_profiles` returns exactly two rows, both SELECT, both `qual: (id =
auth.uid())`:

| policyname | roles | cmd | qual |
|---|---|---|---|
| `profiles_read_own` | `{authenticated}` | SELECT | `(id = auth.uid())` |
| `user_profiles_select_own` | `{public}` | SELECT | `(id = auth.uid())` |

`relrowsecurity = true`. There is **no INSERT, UPDATE or DELETE policy on
`user_profiles` at all**, so every write verb is denied to `anon` and
`authenticated` unconditionally, exactly as §2.5 establishes for DELETE on
`promotions`. A user cannot write their own role, cannot write anyone else's,
and cannot even read anyone else's.

**Live state.** `select role, count(*) from user_profiles group by role` returns
`admin: 1`, `viewer: 9`. One admin, which is the expected count. No unexpected
admin exists.

---

## 4. Subject 2, `b6d4038`, is "presentation only" true

### 4.1 `isRealAdmin` is never weakened, and the two flags are used correctly

**CONFIRMED.** `src/lib/clientContext.tsx:293-296` is the whole mechanism:

```tsx
isAdmin: isAdmin && !viewingAsUser,
isRealAdmin: isAdmin,
viewingAsUser,
setViewingAsUser: (v: boolean) => setViewingAsUserState(isAdmin ? v : false),
```

`isRealAdmin` is the raw state variable, passed through unmodified. Nothing
assigns to it. The published `isAdmin` is a logical AND with a negation, which
is monotonically restrictive: for any value of `viewingAsUser`, the published
`isAdmin` is less than or equal to the real one. It can only ever remove access.

A grep for `isRealAdmin|viewingAsUser|setViewingAsUser` across all of `src/`
returns hits in exactly two files: `clientContext.tsx` (the definition) and
`Layout.tsx`. `isRealAdmin` is read at exactly one call site, `Layout.tsx:294`,
which is the condition on the enter button. No page, no other component, and no
network call reads it. There is no site where `isRealAdmin` was used in place of
`isAdmin` to keep a privilege alive.

The 40 or so `isAdmin` call sites across `Account.tsx`, `AIVisibility.tsx`,
`Layout.tsx`, `Onboard.tsx`, `Prompts.tsx`, `Recommendations.tsx`, `SEO.tsx`,
`Social.tsx`, `Usage.tsx` and `AdminBell.tsx` all consume the restricted value,
which is the correct default: they hide, they never grant.

A viewer cannot turn the flag on. `setViewingAsUser` collapses to `false` for a
non admin at `:296`. Even if a viewer set the underlying state directly through
React DevTools, `false && !true` is still `false`, so nothing is gained. The
guard is redundant with the expression, which is the right shape.

**Worth knowing, and it is load bearing:** the guard at `:296` closes over the
**raw** `isAdmin` state variable, not the published one. If a later refactor
renamed the derived value to `isAdmin` inside the provider body, the guard would
read `false` while impersonating and the Exit button would stop working, locking
a real admin into the mode until they reloaded. It is correct today and there is
no comment saying why the raw one must be used. Recorded as F3.

### 4.2 No token is minted, swapped or re-scoped

**CONFIRMED.** `viewingAsUser` is a `useState<boolean>` at
`clientContext.tsx:85`. Entering and leaving the mode calls
`setViewingAsUserState` and nothing else. There is no `supabase.auth` call, no
`setSession`, no `signInWithPassword`, no `admin.generateLink`, no fetch, and no
storage write on either transition. The user's JWT is untouched.

The state is deliberately **not** persisted (`:83-84`), so a reload always
returns a real admin to the real admin view. That is the correct choice: it
means the mode cannot outlive a session and strand someone.

### 4.3 No server side check is softened

**CONFIRMED, and this is the important one.** No Netlify function accepts, reads,
or branches on any client supplied claim about who the caller is pretending to
be. The grep in §1.2 covers the whole `brandgeo-dashboard` tree and returned
zero code hits.

Every privileged function decides on the real JWT. The role is resolved server
side from `user_profiles` in all of them, either through `requireAuth`
(`_auth.js:109`, `:115`) or through the explicit `auth.profile.role !== 'admin'`
ownership comparisons in the collect, seo, social and enqueue functions. An admin
in view as user mode therefore still has full server side admin authority. The
mode changes what the browser draws and nothing else, which is precisely what
"presentation only" claims.

That is the invariant working as designed, not a gap. A consequence worth stating
plainly: **writes are unchanged in the mode.** For example `Prompts.tsx:210`
`deletePrompt` issues `supabase.from('prompts').delete().eq('id', id)` under the
admin's own JWT while impersonating, and it will succeed. The protection against
that is the banner naming the client, which §4.4 verifies, not a permission
change.

### 4.4 Is the impersonated state continuously visible

**CONFIRMED.** `Layout.tsx:716-730` renders the amber banner whenever
`viewingAsUser` is true. Three properties make it continuous rather than a
one time announcement:

1. It is placed at `:716`, inside the `flex-1 flex flex-col` column opened at
   `:710` and **outside** the scroll container, with `flex-shrink-0`. It cannot
   be scrolled out of sight.
2. It is above the mobile header at `:733`, so it is present at every viewport,
   not desktop only.
3. Every authenticated route in `App.tsx:106-117` is wrapped in `<Layout>`.
   All twelve. The only routes without `Layout` are `/login`, `/signup`,
   `/welcome`, `/reset-password`, `/audit` and `/audit/:token`, none of which an
   admin can be inside while impersonating, because `/welcome` requires
   `needsOnboarding` and the rest are unauthenticated. There is no reachable
   screen where the mode is active and the banner is absent.

The banner names the client (`Viewing as a user of {activeClient?.name}`), states
that admin controls are hidden, and states that the admin's own permissions are
unchanged, which is honest about §4.3 rather than implying a privilege drop that
did not happen.

The Exit control lives only in the banner, and the Enter control at `:294`
disappears the moment it is used. Those are the same control surface, so the
state cannot be entered from one place and orphaned in another.

### 4.5 The reverse risk, does the mode hide something an admin needs

Considered explicitly. Two effects are real, both LOW, both recorded below as
F2 and F4. Everything else cleared:

- **Cleared.** `AIVisibility.tsx:568`, `:598` hide Force Refresh, which is the
  destructive path that deletes all rows for a prompt before recollecting.
  Hiding it while impersonating is strictly safer, not less safe.
- **Cleared.** `Account.tsx:407` renders `Access level` as `Member` while
  impersonating. `:525-545` hides the Manage plan panel, and with it
  `plan_source` and `plan_grant_until`, both internal only fields. `:648` hides
  `PromotionsPanel`. `:137`, `:153` skip the client event and client user
  fetches entirely, so internal data is not merely hidden in the DOM, it is not
  fetched.
- **Cleared.** `clients`, the full cross tenant list, stays populated in context
  while impersonating (`clientContext.tsx:290` is ungated). Today this leaks
  nothing, because both consumers guard on `isAdmin`: `Layout.tsx:371` (the
  switcher) and `Usage.tsx:83`, `:90`, `:142`. It is a latent trap rather than a
  live defect, recorded as F4.
- **Recorded as F2.** `AdminBell.tsx:81` returns null and its 90 second poll at
  `:66` stops. Admin notifications are not surfaced during the session.

---

## 5. What could not be closed, and what would close it

Named explicitly rather than reported as verified.

**5.1 The deployed `promotions-admin` gate has not been exercised with a valid
non admin viewer JWT.** §1 closes it from source, exhaustively, and §2.3 proves
the role data that the gate reads is correct in production. Neither is the same
as the wire test. Minting a viewer token requires either the service key or a
viewer's credentials, and this review handles neither.

What would close it: sign in as any of the nine viewer accounts on
`https://app.getbrandgeo.com`, take `session.access_token`, and run

```
POST https://app.getbrandgeo.com/.netlify/functions/promotions-admin
Origin: https://app.getbrandgeo.com
Authorization: Bearer <viewer access token>
Content-Type: application/json
{"action":"list"}
```

Expected, per `_auth.js:110`: `403` with body
`{"error":"Forbidden: admin access required"}`. Any `200` is a `BLOCK`.

**5.2 The RLS row filter was not exercised against real rows.**
`select count(*) from public.promotions` as the table owner returns **0**. The
table is empty, so the viewer probe in §2.3 seeing zero rows is not by itself
proof of filtering. What §2.3 does prove is the predicate, `is_admin()`, which is
the entire body of all three policies. Combined with §2.1 (the policy set) and
§2.5 (Postgres denies a verb with no permissive policy) this is a complete proof
of the access model, but it is a proof about the model, not an observation of a
filtered row. Creating a row to prove it would be a write and was not done.

**5.3 INSERT under RLS was not executed.** A rejected insert still evaluates
`nextval` on the `bigserial`, which survives a rollback. That is a trivial side
effect but it is still a mutation, so it was skipped. The INSERT policy is closed
by §2.1 and §2.3, since its `WITH CHECK` is the same `is_admin()` expression that
was proven `false` for a viewer.

**5.4 No `git diff` was read.** The task forbids git commands because other
agents are editing this tree concurrently. This review therefore assesses the
**current working tree state** of the files the two features live in, not the
diffs of `3dadd8b` and `b6d4038`. If either feature has been modified since its
commit, this review covers the modified version. Files read:
`brandgeo-dashboard/netlify/functions/_auth.js`,
`.../promotions-admin.js`, `.../provision-account.js`, `.../onboard-client.js`,
`.../signup-client.js`, `db/supabase-promotions-migration.sql`,
`brandgeo-dashboard/src/lib/clientContext.tsx`,
`.../src/components/Layout.tsx`, `.../src/components/AdminBell.tsx`,
`.../src/components/PromotionsPanel.tsx`, `.../src/App.tsx`,
`.../src/pages/Account.tsx`, `.../src/pages/Prompts.tsx`.

**5.5 Not in scope, not checked.** Accessibility of the banner and the Promotions
panel, contrast ratios, the `admin_notifications` RLS policy set,
`stripe-webhook.js` beyond its `user_profiles` write, and the rest of
`SECURITY-AUDIT.md` beyond F1.

---

## 6. Findings

### F1. LOW, CONFIRMED. Two files still say the promotions migration has not been applied.

**What.** `db/supabase-promotions-migration.sql:5-9` carries a
`NOT YET APPLIED to the live project` banner, and `promotions-admin.js:18-23`
says `db/supabase-promotions-migration.sql has not been run yet`.

**Where.** `db/supabase-promotions-migration.sql:5`,
`brandgeo-dashboard/netlify/functions/promotions-admin.js:18`.

**How it breaks.** Not a runtime defect. It is a correctness defect in the record
that the next agent cold starts from, and this project has already lost a day to
exactly that class of error (`CLAUDE.md`, "State of the protocol, corrected
2026-07-26", item 1). A future session reading either header concludes the table
does not exist, and either reapplies the migration or attributes a real failure
to a missing table. `pg_policies`, `pg_constraint` and `pg_indexes` all confirm
it is applied.

**Fix.** In the SQL file, replace the `NOT YET APPLIED` block with
`APPLIED 2026-07-26, verified 2026-07-29. Safe to re-run (every statement is
IF NOT EXISTS or DROP ... IF EXISTS).` In `promotions-admin.js`, change the
`BEFORE THE MIGRATION IS APPLIED` heading to note the 404 branch is now a
regression guard rather than the expected state.

### F2. LOW, CONFIRMED. Admin notifications are suppressed while impersonating.

**What.** `AdminBell` unmounts and stops polling for the whole duration of a view
as user session, so a new signup, a failed job, or a trial expiry raised during
that window is not surfaced.

**Where.** `brandgeo-dashboard/src/components/AdminBell.tsx:50`, `:66`, `:81`,
all reading the restricted `isAdmin`.

**How it breaks.** An admin enters the mode to debug a customer's view, spends
twenty minutes there, and receives no notification during it. This is deferral,
not loss: `load` is a `useCallback` keyed on `isAdmin` (`:60`) and is re-fired by
the effect at `:62` the moment the flag flips back, so exiting the mode
repopulates the bell from the database. The exposure is the window itself. It is
listed because it is the clearest instance of the reverse risk the review was
asked to consider, not because it is urgent.

**Fix.** Change the three reads in `AdminBell.tsx` from `isAdmin` to
`isRealAdmin`, and suppress only the visual badge while `viewingAsUser` is true
if the intent is that the customer view stays clean. That keeps the poll alive
and the data current. This is a deliberate product call about what the mode is
for, so it belongs with `bg-design` or Constantin, not with a builder.

### F3. LOW, CONFIRMED. The Exit guard depends on an undocumented shadowing detail.

**What.** `setViewingAsUser: (v) => setViewingAsUserState(isAdmin ? v : false)`
at `clientContext.tsx:296` reads the **raw** `isAdmin` state variable declared at
`:82`, not the restricted value published at `:293`. This is correct and
necessary, and nothing says so.

**Where.** `brandgeo-dashboard/src/lib/clientContext.tsx:296`.

**How it breaks.** If a later edit inside the provider body introduced a local
named `isAdmin` holding the derived value, or renamed the raw state to something
else and reused `isAdmin` for the derived one, the guard would evaluate `false`
while impersonating. The Exit button in the banner would then silently do
nothing and a real admin would be stuck in the mode until they reloaded the tab.
The failure is safe in the security sense, it grants nothing, but it is a dead
end with no visible cause, and it would be blamed on the banner rather than on
this line.

**Fix.** Add a comment at `:296`: `// Reads the RAW isAdmin, not the derived
value at :293. Using the derived value here would make Exit a no-op while
impersonating, since the derived value is false in exactly that state.` Optional
and stronger: rename the state variable at `:82` to `realIsAdmin` so the two can
never be confused.

### F4. LOW, PLAUSIBLE. The full cross tenant client list stays in context while impersonating.

**What.** `clientContext.tsx:290` publishes `clients` ungated. For a real admin
that array holds every tenant's row, including `name`, `plan`, `plan_source`,
`paid_until` and `stripe_customer_id` (`CLIENT_SELECT`, `:75`), and it stays
fully populated while `viewingAsUser` is true.

**Where.** `brandgeo-dashboard/src/lib/clientContext.tsx:290`, against the
restriction applied one line later at `:293`.

**How it breaks.** Not today. Both consumers guard correctly: `Layout.tsx:371`
and `Usage.tsx:83`, `:90`, `:142`. It breaks the first time someone adds a
component that reads `clients` without an `isAdmin` guard, which is a reasonable
thing to do since the field's own comment says "populated for admin only". That
component would then render other tenants' names and billing state inside a view
whose entire purpose is to show what a single customer sees, and the banner would
be actively asserting that admin controls are hidden while it happened. Marked
PLAUSIBLE rather than CONFIRMED because no current call site does this. It is a
latent trap, and it is cheap to close permanently.

**Fix.** Make the restriction structural rather than per call site. At `:290`,
publish `clients: viewingAsUser ? clients.filter(c => c.id === activeClientId) :
clients`. Both existing consumers are `isAdmin` gated and render nothing while
impersonating, so this changes no current behaviour and removes the trap. Update
the interface comment at `:33` to say the list is narrowed to the active client
while `viewingAsUser` is true.

---

## 7. Overall verdict

**PASS WITH FINDINGS.**

`3dadd8b` is sound. The `adminOnly` gate resolves the role server side from
`user_profiles` against a Supabase verified identity, nothing client controlled
reaches it, and the service key is never constructed before it. The three RLS
policies are live, permissive, `authenticated` only, and all three are gated on a
`SECURITY DEFINER` `is_admin()` that was executed and returns `false` for a real
viewer. There is no DELETE policy and nothing compensates for its absence, so the
deactivate-never-delete intent holds in the database as well as in the function.
`SECURITY-AUDIT.md` F1 is independently closed: exactly three writers to
`user_profiles` exist, two hardcode `'viewer'`, the third is admin gated with a
whitelist, `user_profiles` has no write policy of any kind so self escalation is
impossible, and the live admin count is 1.

`b6d4038` holds its invariant. `isRealAdmin` is passed through unmodified and is
read at exactly one call site. The published `isAdmin` is a monotonic
restriction. No token is minted or swapped, the state is not persisted, no
function anywhere accepts a claim about who the caller is impersonating, and the
banner is structurally unscrollable and present on every authenticated route at
every viewport.

The four findings are documentation drift, one deliberate product call about
notification visibility, one undocumented dependency that would produce a
confusing dead end, and one latent cross tenant trap that is currently harmless.
None of them justifies blocking, and none of them is a security defect.

The residual is §5.1: the deployed gate has never been hit with a valid viewer
token. That is the one test that would convert this from "closed from source" to
"closed from evidence", the command is written out above, and it takes under a
minute. It should be run before this review is treated as complete.
