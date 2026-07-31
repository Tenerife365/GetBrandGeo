# Multi-site tenancy: one login, many sites (ROADMAP D1)

Written 2026-07-31 by `bg-architect`. Binding on `bg-backend` and `bg-app`.
`bg-verify` reviews the authorization boundary **before any build**, per
ROADMAP D1's own sequencing and AGENT-OS §6: this is auth.

The ask, Constantin 2026-07-31: clients and agencies with several websites or
products need ONE login with a dashboard per site, not one login per site. Each
site carries its own plan and its own subscription.

Every claim about current behaviour below carries a `path:line` or a production
query. Nothing here is from `CLAUDE.md`, which is documented as drifting.

---

## 1. Current state, verified

### 1.1 The headline: half of D1 is already built, deployed, and has never held a row

The roadmap item says user-to-client "becomes" many-to-many. It already is, in
the database. What is missing is the write path and the server-side gate.

Queried against production (`duiyifepitvugyulobqm`) 2026-07-31, read-only:

| Fact | Value |
|---|---|
| `public.user_clients` exists | yes |
| its shape | `user_id uuid NOT NULL`, `client_id integer NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()` |
| primary key | `user_clients_pkey PRIMARY KEY (user_id, client_id)` |
| foreign keys | `user_id → auth.users(id) ON DELETE CASCADE`, `client_id → clients(id) ON DELETE CASCADE` |
| rows in `user_clients` | **0** |
| RLS policies on it | exactly one: `user_clients_own_read` SELECT, `((user_id = auth.uid()) OR is_admin())` |
| INSERT / UPDATE / DELETE policies | **none** — deny-all to `authenticated`, `service_role` bypasses |

And the membership predicate already exists as a database function:

```sql
CREATE OR REPLACE FUNCTION public.has_client_access(cid integer)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select cid = public.get_my_client_id()
      or exists (
        select 1 from public.user_clients uc
        where uc.user_id = auth.uid() and uc.client_id = cid
      );
$function$
```

It is referenced by **15 live RLS policies** (§3, Group A), including every
policy on `ai_results`, `prompts`, `competitors` and `clients` itself.

So the most sensitive tables in the product are **already membership-aware and
have been for some time**, and the feature has never activated because nothing
in the codebase writes a row to `user_clients`. Verified: the only reference in
`brandgeo-dashboard/netlify/functions/` is a DELETE
(`delete-client.js:98`, cascade cleanup); the only reference in `src/` is a
READ (`clientContext.tsx:174`). There is no admin UI, no function, and no
migration file in `db/` that inserts one.

The table landed in `42b7de6` ("multi-brand switcher") and its cleanup path in
`9ec7458`. It is dead infrastructure that already passed through the RLS layer.

**Consequence for this spec:** D1 is materially smaller than the roadmap item
assumes. It is not a tenancy model change. It is finishing a tenancy model
change that was started, wired into RLS, and abandoned before the write path.

### 1.2 What is genuinely still single-tenant

| Layer | State | Citation |
|---|---|---|
| Netlify auth gate | single FK equality | `_auth.js:116` `if (String(profile.client_id) !== String(clientId))` |
| 19 inline ownership checks | single FK equality, copy-pasted | §2.2 ledger |
| 31 RLS policies | single FK equality via `get_my_client_id()` / `my_client_id()` | §3, Group B |
| Client switcher UI | gated on `isAdmin`, not on membership count | `Layout.tsx:372` `{isAdmin && clients.length > 0 && (` |
| Stripe checkout resolution | resolves target site via `user_profiles.client_id` | `stripe-webhook.js:273-280` |
| Stripe subscription events | fan out to **every** client sharing a customer id | `stripe-webhook.js:458` + `:469`, `:507` + `:516` |

Note `clientContext.tsx` is **not** in that list. Its frontend half is already
multi-site: `:170-176` reads `user_clients` and unions it with
`profile.client_id`, and `:189` sets `clients` for members with the comment
"members now get their accessible brands". The comment at `:33` calling
`clients[]` "populated for admin only" is **stale** and contradicted 156 lines
below it. The roadmap item inherited that stale comment. Only `Layout.tsx:372`
still hides the switcher.

### 1.3 Production data shape, which decides the migration cost

```
clients                                  36
user_profiles                            10
user_profiles where role = 'admin'        1
user_profiles where client_id is null     0
user_clients rows                         0
distinct users in user_clients            0
clients with stripe_customer_id       **0**
clients with stripe_subscription_id   **0**
```

Two numbers govern everything downstream.

**`user_profiles.client_id` is NOT NULL in practice for all 10 rows.** So a
backfill of `user_clients` from `user_profiles` is total: 10 inserts, no
exceptions to reason about, and it is idempotent (`ON CONFLICT DO NOTHING`
against the composite PK).

**Zero clients carry a Stripe customer or subscription id.** There is no live
Stripe-to-site binding to migrate. The billing decision in §4 is free to make
today and expensive to make after the first subscription lands.

### 1.4 Prompt caps are already enforced server-side, and already per-site

ROADMAP A5 states `PLAN_PROMPTS` "is read at `planConfig.ts:516` for the plan
card and enforced nowhere server-side". **That is refuted.** Production carries
a trigger:

```
CREATE TRIGGER trg_enforce_prompt_cap BEFORE INSERT OR UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION enforce_prompt_cap()
```

`enforce_prompt_cap()` is `SECURITY DEFINER`, reads `plan_prompt_caps` keyed by
`clients.plan`, counts `prompts where client_id = new.client_id and is_active`,
and raises `prompt_cap_reached` with `errcode = 'check_violation'`. It falls back
to the **free** cap on an unknown plan, deliberately stricter than `_cost.js`.

`plan_prompt_caps` and `planConfig.ts:427` agree exactly, checked value by value:
`free 5, essentials 15, growth 35, growth_pro 35, managed 120, pro 120,
enterprise 100000`. No drift.

It counts **per `client_id`**, so it is already per-site and survives D1 with no
change. This matters for §6: Constantin's 2026-07-31 ruling that `PLAN_PROMPTS`
must be both enforced and displayed is already half-satisfied, on the enforcement
half, by a mechanism nobody recorded.

One hole, recorded for A6 rather than fixed here: the trigger returns early for
`current_user in ('service_role','postgres')`, so every Netlify function that
inserts prompts bypasses the cap entirely.

---

## 2. The boundary decision

### 2.1 Ruling

**Keep `user_clients` as the membership table. Add a role column to it. Keep
`user_profiles.client_id` as a denormalised default site, do not drop it, and
bind it with a database invariant. Move every authorization predicate in the
product from FK equality to `has_client_access()`.**

One line of reasoning: a new membership table would orphan a
`SECURITY DEFINER` function and 15 working RLS policies that already reference
the existing one, and dropping `user_profiles.client_id` would touch ~30 policies
and 22 function call sites in a single irreversible step, which is the shape of
change this project has already been burned by.

### 2.2 What changes at the Netlify layer

`_auth.js:116` today:

```js
if (clientId !== null && profile.role !== 'admin') {
  if (String(profile.client_id) !== String(clientId)) {
    return { response: err(403, 'Forbidden: client mismatch', origin) }
  }
}
```

This is one of **22** places the same decision is made. Only ONE function passes
`clientId` into `requireAuth` (`create-portal-session.js:30`). The other 19
re-implement the check inline, and 2 more read `profile.client_id` as the target
without checking anything because it IS the target:

| File | Line | Shape |
|---|---|---|
| `_auth.js` | 116 | the gate, used by 1 caller |
| `collect-chatgpt.js` | 39 | inline equality |
| `collect-claude.js` | 40 | inline equality |
| `collect-prompt.js` | 58 | inline equality |
| `enqueue-collection.js` | 37 | inline equality |
| `generate-recommendations.js` | 94 | inline equality |
| `seo-audit-page.js` | 85 | inline equality |
| `seo-crawl.js` | 32 | inline equality |
| `seo-draft.js` | 142 | inline equality |
| `seo-opportunities.js` | 36 | inline equality |
| `social-accounts.js` | 21 | inline equality |
| `social-boost.js` | 42 | inline equality |
| `social-brandkit.js` | 120 | inline equality |
| `social-delete.js` | 39 | inline equality |
| `social-generate.js` | 179 | inline equality |
| `social-image.js` | 51 | inline equality |
| `social-link.js` | 26 | inline equality |
| `social-publish.js` | 87 | inline equality |
| `social-queue.js` | 34 | inline equality |
| `social-status.js` | 22 | inline equality |
| `create-portal-session.js` | 37 | `clientId ?? auth.profile.client_id` fallback |
| `suggest-prompts.js` | 105 | `auth.profile.client_id` as implicit target |
| `support-request.js` | 120 | `auth.profile.client_id` as implicit target |

Nineteen copies of a security check is nineteen places to get it wrong. The
ruling is that all 19 collapse to one call.

`_auth.js` gains one exported function. This is its contract, not its body:

```ts
/**
 * The ONLY membership predicate in the Netlify layer.
 * Returns true iff the authenticated user may act on targetClientId.
 * Throws on any Supabase error — it never returns false-by-error, and it
 * never returns true-by-error.
 */
function assertClientAccess(
  auth: AuthResult,          // the object returned by requireAuth
  targetClientId: number | string,
): Promise<{ ok: true } | { ok: false; response: NetlifyResponse }>
```

`requireAuth`'s existing `clientId` option is re-implemented on top of it, so
`create-portal-session.js` needs no edit and its behaviour widens automatically.

### 2.3 The invariant a reviewer can test

> **INVARIANT M.** For any request that names a target `clientId`, access is
> granted if and only if
> **(a)** `user_profiles.role = 'admin'` for the authenticated user, **or**
> **(b)** a row exists in `user_clients` with
> `user_id = <authenticated user>` and `client_id = <target>`.
>
> No other predicate grants access. After migration step 6,
> `user_profiles.client_id` is **never** consulted for an authorization decision
> anywhere in the product.

Testable three ways, all of which `bg-verify` must run:

1. **Static.** After step 6, `grep -rn "profile.client_id" netlify/functions/`
   returns hits only in `client-users.js` (an admin-only listing query, not an
   authorization decision), `delete-client.js`, `provision-account.js` and
   `stripe-webhook.js` (all provisioning writes, not gates). Zero hits inside a
   comparison against a request-supplied `client_id`.
2. **Dynamic, positive.** A viewer with a membership row for site B gets 200
   from each of the 19 endpoints when passing B.
3. **Dynamic, negative.** The same viewer gets 403 for a site C they hold no
   membership in, from all 19, with `user_profiles.client_id` set to C's value
   removed. This is the test that proves (b) and not (a) is doing the work.

### 2.4 How it stays fail-closed

Three rules, each stated because the natural implementation breaks one of them.

**F1. An error is a denial, never a fallback.** Today `_auth.js:99-107` destructures
`{ data: profile }` and discards the error, so a failed query yields
`profile === null` and a 403. That accident is the correct behaviour and must
become deliberate. The membership query must return 403 on error. It must never
degrade to "the membership table is unreachable, so fall back to
`profile.client_id`". Write the error branch first.

**F2. Absence of a row is a denial.** `user_clients` returning zero rows means no
access, full stop. A `.maybeSingle()` that yields null must not be read as
"unrestricted".

**F3. The permissive OR is temporary and dated.** Migration step 3 (§7)
deliberately introduces
`profile.client_id === target || membership exists` — that is the permissive
step, and it is the thing this project's own history says to do (apply the
permissive change while the old path still works, verify, then close the old
path). Step 6 deletes the first disjunct. A build that ships step 3 and never
ships step 6 leaves the equality path live forever, which is not a leak but is a
silent failure to migrate. The step-6 grep in §2.3 is the check that catches it.

### 2.5 Roles

Two role axes, deliberately separate:

- `user_profiles.role` stays the **platform** role: `admin | viewer`. `admin`
  means BrandGEO staff and continues to mean "any client". It is not per-site
  and must not become per-site.
- `user_clients.role` becomes the **per-site** role: `owner | member`.
  - `owner` — may manage billing for that site (portal, plan changes reaching
    Stripe) and may add or remove other members of that site.
  - `member` — full read and write of that site's product data, no billing, no
    membership management.

`user_clients.role` is **not** consulted by INVARIANT M. Membership decides
*whether*; role decides *what*. Conflating them is how a read gate becomes a
write gate by accident.

---

## 3. Every RLS policy, enumerated

Queried from `pg_policies` on `duiyifepitvugyulobqm` 2026-07-31. All 77 policies
in `public` are classified. Nothing is left as "update the policies".

### Group A — already membership-aware. NO CHANGE. (15 policies)

Every one of these already reads `has_client_access(...)`.

| Table | Policy | Cmd | Predicate today |
|---|---|---|---|
| `ai_results` | `ai_results_client_read` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `ai_results` | `ai_results_select` | SELECT | `my_role() = 'admin' OR has_client_access(client_id)` |
| `clients` | `clients_select` | SELECT | `my_role() = 'admin' OR has_client_access(id)` |
| `competitors` | `competitors_client_read` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `competitors` | `competitors_select` | SELECT | `my_role() = 'admin' OR has_client_access(client_id)` |
| `competitors` | `competitors_insert` | INSERT | `my_role() = 'admin' OR has_client_access(client_id)` |
| `competitors` | `competitors_delete` | DELETE | `my_role() = 'admin' OR has_client_access(client_id)` |
| `prompts` | `prompts_client_read` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `prompts` | `prompts_select` | SELECT | `my_role() = 'admin' OR has_client_access(client_id)` |
| `prompts` | `prompts_insert` | INSERT | `is_admin() OR has_client_access(client_id)` |
| `prompts` | `prompts_update` | UPDATE | `is_admin() OR has_client_access(client_id)` |
| `prompts` | `prompts_delete` | DELETE | `is_admin() OR has_client_access(client_id)` |
| `recommendation_runs` | `recommendation_runs_select` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `recommendations` | `recommendations_select` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `recommendations` | `recommendations_update` | UPDATE | `is_admin() OR has_client_access(client_id)` |

**Hazard recorded, not fixed here.** `ai_results`, `competitors` and `prompts`
each carry TWO overlapping SELECT policies, one for `{authenticated}` and one for
`{public}`. Permissive policies OR together — that is precisely the mechanism
behind the nine permissive policies of CLAUDE.md §6.4 step 7. Both members of
each pair are correctly scoped today, so there is no leak. But the duplication is
a live trap: a future edit that relaxes only one of the pair produces a leak that
reads as fixed in the other. **Filed as a separate named artifact, not folded
into D1** — see §8.

### Group B — equality, MUST CHANGE. (31 policies)

Mechanical substitution in every case:

- `client_id = get_my_client_id()` → `has_client_access(client_id)`
- `client_id = my_client_id()` → `has_client_access(client_id)`
- `ticket_client_id(ticket_id) = get_my_client_id()` → `has_client_access(ticket_client_id(ticket_id))`

| Table | Policy | Cmd | Function used today |
|---|---|---|---|
| `client_notifications` | `client_notifications_select` | SELECT | `get_my_client_id()` |
| `client_notifications` | `client_notifications_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `collection_jobs` | `collection_jobs_select` | SELECT | `my_client_id()` |
| `collection_runs` | `collection_runs_select` | SELECT | `my_client_id()` |
| `seo_briefs` | `seo_briefs_select` | SELECT | `get_my_client_id()` |
| `seo_briefs` | `seo_briefs_insert` | INSERT | `get_my_client_id()` |
| `seo_briefs` | `seo_briefs_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `seo_briefs` | `seo_briefs_delete` | DELETE | `get_my_client_id()` |
| `seo_crawls` | `seo_crawls_select` | SELECT | `get_my_client_id()` |
| `seo_crawls` | `seo_crawls_insert` | INSERT | `get_my_client_id()` |
| `seo_pages` | `seo_pages_select` | SELECT | `get_my_client_id()` |
| `seo_pages` | `seo_pages_insert` | INSERT | `get_my_client_id()` |
| `seo_pages` | `seo_pages_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `seo_pages` | `seo_pages_delete` | DELETE | `get_my_client_id()` |
| `social_accounts` | `social_accounts_select` | SELECT | `get_my_client_id()` |
| `social_accounts` | `social_accounts_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `social_accounts` | `social_accounts_delete` | DELETE | `get_my_client_id()` |
| `social_post_targets` | `social_targets_select` | SELECT | `get_my_client_id()` |
| `social_post_targets` | `social_targets_insert` | INSERT | `get_my_client_id()` |
| `social_post_targets` | `social_targets_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `social_post_targets` | `social_targets_delete` | DELETE | `get_my_client_id()` |
| `social_posts` | `social_posts_select` | SELECT | `get_my_client_id()` |
| `social_posts` | `social_posts_insert` | INSERT | `get_my_client_id()` |
| `social_posts` | `social_posts_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `social_posts` | `social_posts_delete` | DELETE | `get_my_client_id()` |
| `social_profiles` | `social_profiles_select` | SELECT | `get_my_client_id()` |
| `social_profiles` | `social_profiles_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `tickets` | `tickets_select` | SELECT | `get_my_client_id()` |
| `tickets` | `tickets_insert` | INSERT | `get_my_client_id()` (inside a longer conjunction — preserve every other clause verbatim) |
| `ticket_comments` | `ticket_comments_select` | SELECT | `ticket_client_id(ticket_id) = get_my_client_id()` |
| `ticket_comments` | `ticket_comments_insert` | INSERT | `ticket_client_id(ticket_id) = get_my_client_id()` |

`tickets_insert` and both `ticket_comments` policies carry additional
conjunctions (`source = 'customer'`, `created_by = auth.uid()`,
`is_internal = false`, status/priority/assignee pinning). **Substitute the one
disjunct and change nothing else.** Rewriting these from scratch is how a
customer gains the ability to open a ticket pre-assigned and resolved.

### Group C — no client scoping to change. NO CHANGE. (21 policies)

Admin-gated, self-gated, or reference data. Listed so the enumeration is
complete and a reviewer can confirm nothing was skipped.

`admin_notifications_select`, `admin_notifications_update`,
`client_events_select`, `promotions_select`, `promotions_insert`,
`promotions_update`, `recommendations_insert`, `recommendations_delete`,
`recommendation_runs_insert`, `social_accounts_insert`,
`social_profiles_insert`, `tickets_update` (all `is_admin()`);
`service_insert_ai_results` (`service_role`); `user_profiles_select_own`,
`profiles_read_own`, `user_clients_own_read` (self-scoped on `auth.uid()`);
`plan_prompt_caps_select`, `contract_templates_are_readable`,
`retention_policies_are_readable` (`true`, reference data).

`user_clients_own_read`'s predicate `((user_id = auth.uid()) OR is_admin())` is
already correct for multi-site and needs no edit. It is also why
`clientContext.tsx:174` can read the table with the anon key today.

### Group D — not BrandGEO tables. OUT OF SCOPE. (10 policies)

`subscribers`, `contracts`, `contract_events`, `quotes`, `quote_roles` scope on
`subscribers.owner_user_id` and are driven by `twl_`-prefixed trigger functions.
This is TalentWeLove schema sharing the BrandGEO Postgres instance. D1 does not
touch them. Their presence is worth a separate decision by Constantin
(§9, Q4) but is not a D1 blocker.

### 3.1 Optimising `has_client_access` at step 6

At step 6, after backfill is verified complete, the first disjunct becomes
provably redundant and is removed:

```sql
CREATE OR REPLACE FUNCTION public.has_client_access(cid integer)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.user_clients uc
    where uc.user_id = auth.uid() and uc.client_id = cid
  );
$function$
```

This is the single point at which `user_profiles.client_id` stops being an
authorization input for the entire database layer. It is one `CREATE OR REPLACE`,
and its rollback is the previous body, which is reproduced verbatim in §1.1.

**Do not perform this replacement before the backfill trigger of step 2 has been
live long enough to have caught every new signup.** Between steps 2 and 6 the
function is doing belt and braces on purpose.

---

## 4. Data contracts

### 4.1 `user_clients` after migration

```sql
-- existing, unchanged
user_id     uuid        not null references auth.users(id) on delete cascade
client_id   integer     not null references clients(id)    on delete cascade
created_at  timestamptz not null default now()
primary key (user_id, client_id)

-- added by D1
role        text        not null default 'member'
                        check (role in ('owner','member'))
created_by  uuid        null references auth.users(id) on delete set null
```

`created_by` is nullable because the 10 backfilled rows have no author. It exists
so a membership granted by an admin is distinguishable from one a site owner
granted, which is the audit question that gets asked after an incident.

Uniqueness is the composite PK, already present. No second unique constraint is
needed and none should be added: a user may hold at most one row per site by
construction, which is exactly the desired rule.

### 4.2 The membership invariant, enforced in the database

```sql
-- Every user_profiles.client_id must have a matching membership row.
-- Enforced by trigger, not by application code, because provisioning
-- happens from four different call sites.
```

Trigger `AFTER INSERT OR UPDATE OF client_id ON user_profiles`, function
`sync_primary_membership()`, `SECURITY DEFINER`, body specified as:

> When `NEW.client_id IS NOT NULL`, insert
> `(NEW.id, NEW.client_id, 'owner')` into `user_clients`
> `ON CONFLICT (user_id, client_id) DO NOTHING`. Never delete.

Role `'owner'` and not `'member'` because a profile's primary client is the site
they were provisioned onto, and the person a site is provisioned for owns it.

Never deleting matters: an admin moving `user_profiles.client_id` from A to B
must not silently revoke access to A. Revocation is an explicit action, never a
side effect of an update.

The four call sites this covers, none of which need to change:
`stripe-webhook.js:363`, `stripe-webhook.js:395`, `provision-account.js:181`,
and `onboard-client.js`'s equivalent insert.

### 4.3 Netlify function contract: manage memberships

One new function, `client-members.js`. Contract, not implementation:

```ts
// POST /.netlify/functions/client-members
type Request =
  | { action: 'list';   client_id: number }
  | { action: 'invite'; client_id: number; email: string; role: 'owner' | 'member' }
  | { action: 'remove'; client_id: number; user_id: string }

type Member = {
  user_id:         string          // uuid
  email:           string | null   // null when auth.admin cannot resolve it
  role:            'owner' | 'member'
  is_primary:      boolean         // user_profiles.client_id === client_id
  created_at:      string          // ISO 8601
  last_sign_in_at: string | null
}

type Response =
  | { members: Member[] }                       // list
  | { member: Member; invited: boolean }        // invite; invited=true if a new auth user was created
  | { removed: true }                           // remove

type ErrorResponse = { error: string }          // shape already used across the function layer
```

Status codes, exhaustively:

| Code | Condition |
|---|---|
| 200 | success |
| 400 | malformed body, unknown `action`, invalid `role`, malformed email |
| 401 | missing or invalid token (from `requireAuth`) |
| 403 | caller is neither platform admin nor `owner` of `client_id` |
| 404 | `client_id` does not exist |
| 409 | `invite` for a user who already holds a membership on that site |
| 422 | `remove` targeting the last remaining `owner` of a site — refused |
| 500 | Supabase or auth-admin error |

Authorization for this endpoint is **stricter than INVARIANT M**: membership
alone is not enough. `invite` and `remove` require
`user_profiles.role = 'admin'` OR `user_clients.role = 'owner'` for that exact
site. `list` requires membership only.

The 422 rule is load-bearing. Without it an owner can remove themselves and
strand a paying site with no one able to manage it, recoverable only by
Constantin with a service key.

### 4.4 Frontend contract

`clientContext.tsx` needs one addition to `ClientCtx` and one deletion of a
stale comment:

```ts
interface ClientCtx {
  // ... everything currently there, unchanged ...

  /** Per-site role for the ACTIVE client. 'admin' for platform staff.
   *  null while loading or when the user holds no membership. */
  activeMembershipRole: 'owner' | 'member' | 'admin' | null

  /** True when the user can reach more than one site. Drives the switcher.
   *  For a platform admin this is true whenever clients.length > 1. */
  canSwitchClient: boolean
}
```

`clients: Client[]` keeps its type and its population logic (`:170-193`) exactly
as they are. The comment at `:33` reading "populated for admin only" is deleted;
it has been false since `42b7de6`.

Loading, empty and error states for the switcher:

| State | Condition | Render |
|---|---|---|
| loading | `loading === true` | existing skeleton, unchanged |
| single site | `canSwitchClient === false` | no switcher, no placeholder, no disabled control |
| multi site | `canSwitchClient === true` | the existing switcher currently behind `Layout.tsx:372` |
| membership fetch failed | `user_clients` query threw | fall back to the primary site only, and surface nothing — a failed membership read must never render an empty site list |

The last row is the frontend mirror of F1: a failed read degrades to *less*
access, never to more and never to a blank screen.

**Who owns the fetch:** `ClientProvider` alone, in `init()`. No page component
queries `user_clients` directly. This is already the pattern (`:174`) and D1 does
not change it.

---

## 5. State ownership map

| State | Owner | Readers | Invalidated by |
|---|---|---|---|
| `activeClientId` | `ClientProvider` + `localStorage['brandgeo_client']` | every page | user switching sites; `init()` re-run |
| `clients[]` (accessible sites) | `ClientProvider.init()` | `Layout` switcher, every page's guard | sign-in, sign-out, token refresh (`onAuthStateChange`, `:206`) |
| membership rows | Postgres `user_clients` | `has_client_access()` in RLS; `assertClientAccess()` in functions; `ClientProvider.init()` | `client-members.js` invite/remove |
| `user_profiles.client_id` | `provision-account.js`, `stripe-webhook.js`, `onboard-client.js` | **after step 6: nothing that authorizes.** Landing-site default only | admin reassignment |
| `activeMembershipRole` | `ClientProvider`, derived | billing UI, member-management UI | `activeClientId` change |
| per-site plan + entitlements | `clients` row | `planConfig.ts`, `_cost.js`, `enforce_prompt_cap()` | `set-client-plan.js`, `stripe-webhook.js`, `expire-plan-grants.js` |

### 5.1 The same value derived twice — named, as required

1. **Accessible-site membership is derived in three places.**
   `has_client_access()` in SQL, `clientContext.tsx:170-176` in TypeScript
   (`[cid, ...links]` union), and — after D1 — `assertClientAccess()` in
   `_auth.js`. Three implementations of one rule. They cannot be collapsed to one
   (different runtimes), so the requirement is that all three encode the SAME two
   disjuncts and change together in the same commit. Step 6 removes the first
   disjunct from **all three at once**, or from none.
   `clientContext.tsx:175`'s `Array.from(new Set([cid, ...links...]))` is the
   TypeScript spelling of the first disjunct and must be dropped in step 6.

2. **Platform-admin-ness is derived twice in SQL,** by `is_admin()` and by
   `my_role() = 'admin'`. Both read `user_profiles.role`. Group A and Group B
   policies use them interchangeably, sometimes on the same table
   (`prompts_select` uses `my_role()`, `prompts_insert` uses `is_admin()`).
   Harmless today; both are `STABLE SECURITY DEFINER` over the same column.
   **Not consolidated by D1** — it is a rename touching ~40 policies for zero
   behaviour change, which is a refactor smuggled into a feature. Filed in §8.

3. **The plan ladder is mirrored between `planConfig.ts:427` and
   `plan_prompt_caps`.** Verified identical today. D1 adds no new copy and must
   not: a sixth copy of the ladder is forbidden by `custom-entitlements.md` §3.4's
   standing rule.

---

## 6. Billing per site

### 6.1 Ruling: one Stripe Customer per SITE, not per account

Four reasons, in order of weight.

**R1. The alternative silently breaks cancellation today.**
`handleSubscriptionUpdated` resolves its target with
`stripe-webhook.js:458` `.eq('stripe_customer_id', custId)` and then iterates
**every** matching row at `:469`. `handleSubscriptionDeleted` does the same at
`:507` and `:516`. The moment one Stripe customer maps to three clients,
cancelling site B's subscription runs the downgrade loop over sites A, B and C.
A customer who cancels one of three sites is downgraded on all three. This is not
a hypothetical: the loop is written to handle multiple rows, so it will not error,
it will just do the wrong thing quietly.

**R2. `checkout.session.completed` has no site selector.** It resolves the target
through `user_profiles.client_id` (`:273-280`) and, finding one, updates that
client's plan at `:338-345`. An agency's second purchase would overwrite their
first site's plan. One-customer-per-account makes this worse, not better, because
it removes the only remaining distinguishing key.

**R3. A1's package machinery is already per-site and stays free.**
`plan_source`, `plan_grant_until`, `plan_grant_note` and `stripe_subscription_id`
all live on the `clients` row, which IS the site.
`expire-plan-grants.js:169-173` selects on `clients`, and its liveness guard
(`:95`) reads `clients.stripe_subscription_id`. Under one-customer-per-site every
one of those keeps working with **zero changes**. Under one-customer-per-account,
the guard would have to decide which of N subscriptions belongs to the site whose
grant is expiring, from a customer id that identifies all of them equally. It
cannot, and there is no column that would let it.

**R4. It is free today and not free later.** Production carries **0 clients with
a `stripe_customer_id` and 0 with a `stripe_subscription_id`**. There is nothing
to migrate. This decision costs one paragraph now and a data migration across
live billing later.

### 6.2 What that means concretely

| Column | Disposition |
|---|---|
| `clients.stripe_customer_id` | **unchanged.** Stays per-site. Becomes non-unique across an account — the same human is several Stripe Customers, one per site |
| `clients.stripe_subscription_id` | **unchanged.** Exactly one subscription per site, or null |
| `clients.plan`, `plan_source`, `plan_grant_until`, `plan_grant_note` | **unchanged.** Already per-site |

`create-portal-session.js` already takes `client_id` and looks up that client's
`stripe_customer_id` (`:37`, `:43-47`), so the billing portal is **already
per-site** and needs no change beyond the widened `requireAuth` gate it inherits
from §2.2.

Accepted cost, stated plainly so nobody discovers it later: a customer with three
sites receives three separate invoices, manages three separate portal sessions,
and enters card details up to three times. That is the price of R1 through R4.
§9 Q2 puts the alternative to Constantin.

### 6.3 The one webhook change D1 requires

`handleCheckoutCompleted` must stop inferring the target site.

**Contract:** the checkout session carries `metadata.client_id` naming the target
site. Resolution order becomes:

1. `session.metadata.client_id` present and the buyer holds a membership on it →
   provision that site.
2. `session.metadata.client_id` present but the buyer holds no membership on it →
   **provision nothing**, raise a `checkout_wrong_site` admin event carrying the
   session id, the claimed client id and the email. Money has been taken; the
   failure must be visible in the product, exactly as
   `reportUnprovisionedPackage` (`:423-443`) already does for packages.
3. `metadata.client_id` absent AND the buyer holds **zero** memberships →
   unchanged: create a new client and invite. This is the self-serve first
   purchase and it is the majority path.
4. `metadata.client_id` absent AND the buyer holds **one or more** memberships →
   **provision nothing**, raise `checkout_ambiguous_site`. Do not guess. Do not
   fall back to `user_profiles.client_id`.

Branch 4 is the whole point. Guessing here is how an agency's second purchase
silently downgrades their first site.

Branches 2 and 4 must **not** throw. `stripe-webhook.js:140-145` deletes the
idempotency row and returns 500 on a throw, so Stripe redelivers on its retry
schedule and re-alerts forever. The existing package path already reasons this
out at `:223-227`; follow it.

Reuse `reportUnprovisionedPackage`'s shape rather than inventing a second alert
format. It already handles `client_id: null` (`:429`, with the note that
`admin_notifications.client_id` is nullable).

---

## 7. Roll-up: DEFERRED, explicitly

**D1 does not include a cross-site roll-up view.** Stated plainly rather than
left ambiguous, as asked.

Reasons: a roll-up is a read-only view over data that the membership model makes
reachable, so it cannot be built before D1 lands and it gates nothing. It needs
its own `bg-strategy` pass on what an agency actually wants to compare (score
across sites? spend? competitor overlap?) and a `bg-design` pass, neither of
which exists. Folding it into D1 would put an unspecified analytics surface
inside a security-boundary change, which is the worst possible pairing for
review.

What D1 ships instead: the switcher. One login, a site picker, a full dashboard
per site. That is exactly Constantin's stated ask, verbatim: "one login and a
dashboard per site".

Recommendation: file roll-up as **D2**, sequenced `bg-strategy` → `bg-design` →
`bg-app`, after D1 is verified. Note that `clientContext.tsx:189` already carries
the comment "for the switcher + Compare", so a Compare surface has been
contemplated; there is no `Compare` page in `src/pages/` today, confirmed.

---

## 8. Interaction with A5 and A6

### 8.1 Everything entitlement-shaped is per-site, and mostly already is

Constantin ruled 2026-07-31 that `PLAN_PROMPTS` must be **both** enforced
server-side **and** displayed. §1.4 establishes that the enforcement half already
exists as `trg_enforce_prompt_cap`, keyed on `new.client_id`. It is per-site
today and D1 changes nothing about it.

**Binding constraint on A5's design, stated here because A5 has not been written
yet:** no entitlement column may live on `user_profiles` or on `user_clients`.
Bonus prompts, prompt-limit overrides, and API-budget top-ups all go on the
`clients` row, because the plan is a property of the site and a user may hold
sites on three different plans simultaneously. `custom-entitlements.md` §3.4's
`prompt_limit_override int` on `clients` is the correct shape and D1 endorses it
unchanged. Confirmed absent from production: `clients` has no
`prompt_limit_override` column today.

**Binding constraint on A6's design:** the client-visible limits and consumption
view renders for exactly ONE site, the active one, and follows the switcher. It
must never sum across sites. An agency holding an Essentials site and a Growth
site has two allowances, not one pooled allowance of 50. A summed number would be
a limit shown to a customer that the server does not apply, which is the precise
failure ROADMAP A6 says it exists to prevent.

### 8.2 One hole A6 must close, recorded not fixed

`enforce_prompt_cap()` returns early for
`current_user in ('service_role','postgres')`. Every Netlify function inserts as
`service_role`. So `onboard-client.js` and `provision-account.js` can seed a
client past their cap, and the customer then sees a limit the server did not
apply on the path that created their data. Not a D1 defect and not fixed here.
Owner: A6.

---

## 9. File plan

Every row is a `scope_write` line. Disjoint by owner.

### 9.1 `bg-backend` — SQL, in `db/`

| File | Action | Reason |
|---|---|---|
| `db/supabase-multisite-membership-migration.sql` | create | Steps 1-2: `user_clients.role` + `created_by`, backfill from `user_profiles`, `sync_primary_membership()` trigger |
| `db/supabase-multisite-rls-migration.sql` | create | Step 4: the 31 Group B policy replacements, one `DROP POLICY` / `CREATE POLICY` pair each |
| `db/supabase-multisite-close-legacy-migration.sql` | create | Step 6: `CREATE OR REPLACE has_client_access` dropping the equality disjunct |
| `db/supabase-multisite-rollback.sql` | create | Down path for all three, per AUTONOMY §2 |

### 9.2 `bg-backend` — Netlify functions

| File | Action | Reason |
|---|---|---|
| `netlify/functions/_auth.js` | modify | Add `assertClientAccess()`; re-implement `requireAuth`'s `clientId` check on it; step 3 permissive OR, step 6 removal |
| `netlify/functions/client-members.js` | create | The missing write path for `user_clients` (§4.3) |
| `netlify/functions/stripe-webhook.js` | modify | §6.3 four-branch site resolution in `handleCheckoutCompleted` |
| `collect-chatgpt.js`, `collect-claude.js`, `collect-prompt.js`, `enqueue-collection.js`, `generate-recommendations.js`, `seo-audit-page.js`, `seo-crawl.js`, `seo-draft.js`, `seo-opportunities.js`, `social-accounts.js`, `social-boost.js`, `social-brandkit.js`, `social-delete.js`, `social-generate.js`, `social-image.js`, `social-link.js`, `social-publish.js`, `social-queue.js`, `social-status.js` | modify (19 files, one line each) | Replace the inline equality with `assertClientAccess()` |

### 9.3 `bg-app` — dashboard

| File | Action | Reason |
|---|---|---|
| `src/lib/clientContext.tsx` | modify | Add `activeMembershipRole` + `canSwitchClient`; delete the stale `:33` comment; step 6 removes the `[cid, ...]` union at `:175` |
| `src/components/Layout.tsx` | modify | `:372` `isAdmin && clients.length > 0` → `canSwitchClient` |
| `src/pages/Account.tsx` | modify | Members panel calling `client-members.js`, visible to owners and admins |

### 9.4 `/cheap` assessment

Only the 19-file batch in §9.2 is mechanical in shape (one identical
substitution per file). **It is nonetheless NOT routed to the local model.**
AGENT-OS §2 restricts Qwen to work "where being wrong is not immediately
visible", and a wrong ownership check is invisible until it is a cross-tenant
leak. Route it to Sonnet with a full diff review by `bg-verify`.

---

## 10. Performance budget

Numbers, measured against what exists.

| Metric | Budget |
|---|---|
| Bundle delta, `brandgeo-dashboard` | **≤ 4 KB gzipped.** No new dependency. Two context fields, one boolean in `Layout.tsx`, one panel in `Account.tsx` reusing existing components |
| New npm dependencies | **0.** The stack stays React 18, Vite, Tailwind, Recharts, lucide-react |
| Extra Supabase round trips on dashboard load | **0.** `clientContext.tsx:174` already queries `user_clients` on every init. D1 adds a column to that same select, not a query |
| Extra Supabase round trips per gated Netlify call | **≤ 1.** `requireAuth` already fetches the profile (`:99-104`). `assertClientAccess` adds at most one `user_clients` lookup, and only when the profile is not admin and the target differs from the primary. Both are covered PK lookups |
| RLS per-row cost, Group A tables (`ai_results`, `prompts`, `competitors`, `clients`) | **unchanged.** They already call `has_client_access` |
| RLS per-row cost, Group B tables | **≤ 1 additional index lookup per row.** `get_my_client_id()` is one PK lookup on `user_profiles`; `has_client_access()` is that plus one PK lookup on `user_clients_pkey (user_id, client_id)`. After step 6 it is one lookup, i.e. **net zero** |
| New indexes required | **0.** `user_clients_pkey` on `(user_id, client_id)` already covers the membership probe |
| Time to first meaningful paint, `/` | **no regression beyond ±50 ms.** No new blocking request is introduced |
| Sequential scans introduced | **0.** Any `EXPLAIN` in step 5 showing a seq scan on `user_clients` is a failed criterion, not a tuning note |

---

## 11. Migration sequence

Seven steps. Each is independently shippable and independently revertible. The
governing lesson, which this project has already paid for: **apply the permissive
step while the old path still works, verify it, and only then close the old
path.**

### Step 1 — schema, additive only

`db/supabase-multisite-membership-migration.sql`, part one:
`ALTER TABLE user_clients ADD COLUMN role ... DEFAULT 'member'`, `ADD COLUMN
created_by ...`, and the `check (role in ('owner','member'))`.

Nothing reads the new columns yet. The table is empty, so the default applies to
zero rows and the check constraint validates instantly.

**Consistency:** none broken. **Reversible:** `ALTER TABLE ... DROP COLUMN`.

### Step 2 — backfill and the invariant trigger

Same file, part two: insert one `(user_id, client_id, 'owner')` row per
`user_profiles` row with a non-null `client_id`, `ON CONFLICT DO NOTHING`. Then
create `sync_primary_membership()` and its trigger (§4.2).

Expected: **10 rows inserted**, matching the 10 profiles, 0 of which have a null
`client_id`.

The moment this lands, `has_client_access()`'s second disjunct starts returning
true for every existing user, making the first disjunct redundant — while the
first disjunct still runs. **This is the window in which both paths are live, and
it is deliberate.** It must stay open across steps 3, 4 and 5.

**Consistency:** none broken; the two paths agree by construction.
**Reversible:** `DROP TRIGGER`, `DROP FUNCTION`, `DELETE FROM user_clients`. Safe
because nothing has written a membership that is not a copy of a profile yet.

### Step 3 — `_auth.js`, permissive

Add `assertClientAccess()` with **both** disjuncts (F3). Rewrite the 19 inline
checks to call it. Widen `requireAuth`'s `clientId` branch to use it.

Every existing user's access is byte-identical, because every one of them now has
a membership row that agrees with their `client_id`. No user gains or loses
anything.

**Consistency:** none broken. **Reversible:** revert the commit. Deploy is
Netlify, so revert-and-push is the rollback.

### Step 4 — RLS, the 31 Group B policies

`db/supabase-multisite-rls-migration.sql`. One `DROP POLICY` + `CREATE POLICY`
pair per policy, in a single transaction.

Still no behaviour change for existing users, same reason as step 3.

**Consistency:** the transaction is the boundary. A partial application is not
possible; a failed one rolls back whole. **Reversible:**
`supabase-multisite-rollback.sql` recreates all 31 with the predicates recorded
verbatim in §3 Group B.

### Step 5 — the write path and the UI

Ship `client-members.js`, the `Account.tsx` members panel, and
`Layout.tsx:372`'s switcher condition.

**This is the first step with user-visible behaviour change**, and the first at
which a second membership can exist. It ships only after 1-4 are verified live.

**Consistency:** none broken. **Reversible:** revert the commit. Any membership
rows already created remain valid and simply become unreachable through the UI —
they do not become dangerous, because steps 3 and 4 already honour them
correctly.

### Step 6 — close the legacy path

`db/supabase-multisite-close-legacy-migration.sql` replaces `has_client_access()`
with the single-disjunct body (§3.1). The same commit removes the equality
disjunct from `assertClientAccess()` in `_auth.js` and the
`[cid, ...links]` union at `clientContext.tsx:175`.

**All three, in one commit.** §5.1 finding 1 is why: three implementations of one
rule, and a partial close means SQL and JavaScript disagree about who can see
what.

> **This is the only step with a window of inconsistency, and it is between
> deploy targets, not inside one.** The SQL migration applies to Supabase
> instantly; the JavaScript reaches production only when Netlify finishes
> building. For that interval — typically one to three minutes — the database has
> closed the legacy path while the running bundle still assumes it is open.
>
> The interval is **fail-closed, not fail-open**: the database is the stricter of
> the two, so the worst case is a user briefly seeing fewer sites than they
> should, never more. That is the correct direction, and it is why the SQL goes
> first rather than last.
>
> To hold it near zero: apply the SQL **immediately after** Netlify reports the
> deploy live, not before. If the two must be separated, separate them in that
> order and never the reverse. Deploying the JavaScript first against the
> two-disjunct function is also safe and is the acceptable fallback.

**Reversible:** `CREATE OR REPLACE` with the body reproduced verbatim in §1.1,
plus a git revert. Both halves restore independently and in either order, because
the two-disjunct form is a superset of the one-disjunct form.

### Step 7 — billing

`stripe-webhook.js`'s §6.3 four-branch resolution.

Sequenced last on purpose. It is the only step touching money, and it is
unreachable until a user can hold two sites, which requires step 5.

**Consistency:** none broken. Branch 3 preserves today's behaviour exactly, and
it is the only branch any of the 36 existing clients can currently reach, since
zero of them carry a `stripe_customer_id`.
**Reversible:** revert the commit.

### 11.1 Rollback summary

| Step | Undo |
|---|---|
| 1 | `ALTER TABLE user_clients DROP COLUMN role, DROP COLUMN created_by;` |
| 2 | `DROP TRIGGER ... ON user_profiles; DROP FUNCTION sync_primary_membership(); DELETE FROM user_clients;` — safe only before step 5 creates a non-backfill row. After step 5, delete only rows where `created_by IS NULL` |
| 3 | `git revert`, push, Netlify rebuilds |
| 4 | `supabase-multisite-rollback.sql`, recreating the 31 predicates verbatim from §3 |
| 5 | `git revert`, push. Orphaned membership rows are inert, not dangerous |
| 6 | `CREATE OR REPLACE FUNCTION has_client_access` with §1.1's body, plus `git revert`. Either half alone restores service |
| 7 | `git revert`, push |

Steps 3, 5, 6 and 7 are pure `git revert` because the dashboard and functions
deploy from `main` via Netlify. Steps 1, 2, 4 and 6 need SQL, and each has a
named down file, per AUTONOMY §2's "every migration ships a down path".

---

## 12. Acceptance criteria

Written so `bg-verify` can execute them. In the style of
`custom-entitlements.md` §4. **D1 is done when all of these hold.**

### 12.1 Membership model

1. `user_clients` has columns `user_id, client_id, created_at, role, created_by`;
   `role` is `NOT NULL` with a `CHECK (role in ('owner','member'))`; the PK is
   still `(user_id, client_id)`.
2. `select count(*) from user_clients` equals
   `select count(*) from user_profiles where client_id is not null`, and every
   backfilled row has `role = 'owner'` and `created_by is null`.
3. Inserting a `user_profiles` row with a non-null `client_id` produces a
   matching `user_clients` row automatically. Verify by insert, then rollback.
4. Updating `user_profiles.client_id` from A to B produces a membership on B and
   **leaves the membership on A intact**.

### 12.2 The authorization boundary — INVARIANT M

5. `grep -rn "profile\.client_id" brandgeo-dashboard/netlify/functions/` returns
   hits **only** in `client-users.js`, `delete-client.js`,
   `provision-account.js`, `stripe-webhook.js`, and `_auth.js`'s own profile
   select. **Zero** hits inside a comparison against a request-supplied
   `client_id`.
6. A non-admin user with a membership on site B, whose `user_profiles.client_id`
   points at site A, receives **200** from all 19 endpoints in §2.2 when passing
   B. This is the test that proves membership and not the FK is doing the work.
7. The same user receives **403** for a site C they hold no membership on, from
   all 19. Not 500, not 200-with-empty-data.
8. With `user_clients` made unreadable (revoke, or point the client at a bad
   table name), every gated endpoint returns **403**, never 200. F1.
9. A user with **zero** memberships and a null `user_profiles.client_id` receives
   403 everywhere, never 200. F2.
10. Under an anon (unauthenticated) session,
    `select count(*) from ai_results` returns 0 rows and does not error.

### 12.3 RLS

11. `select count(*) from pg_policies where schemaname='public' and
    (qual like '%get_my_client_id%' or with_check like '%get_my_client_id%'
     or qual like '%my_client_id()%' or with_check like '%my_client_id()%')`
    returns **0**.
12. All 15 Group A policies are byte-identical to §3's table. This is a
    regression check: D1 must not have "tidied" a working policy.
13. All 21 Group C policies are unchanged.
14. `tickets_insert`'s `with_check` still contains every one of
    `source = 'customer'`, `created_by = auth.uid()`, `status = 'open'`,
    `priority = 'normal'`, `assignee IS NULL`, `resolved_at IS NULL`. Only the
    `client_id` disjunct changed.
15. `ticket_comments_insert` and `ticket_comments_select` still contain
    `is_internal = false` and, for insert, `author = auth.uid()`.
16. A member of sites A and B sees rows from both, and only both, in
    `ai_results`, `prompts`, `competitors`, `seo_pages`, `social_posts`,
    `tickets` and `client_notifications`. Test with a third site C present and
    populated, and assert **zero** C rows.

### 12.4 Membership management

17. `client-members.js` returns 403 to a `member` attempting `invite` or
    `remove`, and 200 to an `owner` and to a platform admin.
18. `remove` targeting the last `owner` of a site returns **422** and changes
    nothing.
19. `invite` for a user who already holds a membership on that site returns
    **409**, not a duplicate row and not a 500 from the PK violation.
20. `list` returns 403 to a user holding no membership on the named site.

### 12.5 Billing

21. A `checkout.session.completed` carrying `metadata.client_id` for a site the
    buyer is a member of provisions **that** site and no other.
22. The same event naming a site the buyer is **not** a member of provisions
    nothing AND records an admin event. Verify no `clients` row changed.
23. The same event with **no** `metadata.client_id`, from a buyer who already
    holds ≥1 membership, provisions nothing AND records an admin event. This is
    the agency-second-purchase case and it is the one that must not guess.
24. The same event with no `metadata.client_id`, from a buyer with **zero**
    memberships, behaves **exactly as it does today**: creates a client, invites,
    inserts a profile. Regression risk, not a hope — `createClientRow` is shared.
25. Neither failure branch throws. Assert the handler returns 200 and the
    `stripe_events` idempotency row **survives**, so Stripe does not redeliver.
26. `expire-plan-grants.js` reverts exactly the site whose grant expired and
    leaves the buyer's other sites untouched. Fixture: one user, three sites, one
    expiring package.
27. A subscription cancellation on site B downgrades **only** site B. This is the
    R1 fan-out bug; a fixture with three clients sharing nothing must prove the
    loop at `stripe-webhook.js:516` touches one row.
28. No hardcoded plan list is added anywhere. Five copies is not a fix for four
    (`custom-entitlements.md` §4.5, inherited verbatim).

### 12.6 Performance

29. `EXPLAIN (ANALYZE, BUFFERS)` on a member's `select * from ai_results where
    client_id = $1` shows an index scan and **no sequential scan on
    `user_clients`**.
30. Production bundle size for `brandgeo-dashboard` grows by **≤ 4 KB gzipped**
    against the pre-D1 build. Measure both, do not estimate one.
31. `package.json` dependency count is unchanged.

### 12.7 Frontend

32. A user with one site sees **no** switcher control at all — not a disabled
    one, not an empty one.
33. A user with two sites sees the switcher, and switching re-renders every page
    against the new site with no stale data from the previous one.
34. A platform admin's view is unchanged from today.
35. If the `user_clients` read fails, the user still reaches their primary site
    and sees no error state or blank list.

---

## 13. What this spec deliberately does NOT do

Scope discipline. Each of these is a real improvement and each is filed rather
than smuggled in.

1. **No cross-site roll-up or Compare view.** §7. Needs `bg-strategy` first.
   File as **D2**.
2. **No agency tier and no per-site pricing change.** D1 makes several sites
   possible; it does not price them. `docs/PRICING-SPEC.md:24` already lists
   "Multi-country, multi-brand" as a Pro-tier line and `:61` puts it in the
   feature matrix, so a commercial position partly exists. Reconciling it is
   Constantin's, §14 Q1.
3. **No consolidation of the duplicate SELECT policies** on `ai_results`,
   `prompts` and `competitors` (§3 Group A hazard). Both members of each pair are
   correct today. Deduplicating them is a security refactor touching working
   policies during a security migration, which doubles the review surface for
   zero behaviour change. File as **"RLS policy deduplication"**.
4. **No consolidation of `is_admin()` and `my_role() = 'admin'`** (§5.1 finding
   2). ~40 policies, zero behaviour change. File as **"admin predicate
   consolidation"**.
5. **No rename or drop of `user_profiles.client_id`.** After step 6 it is a
   landing-site default with no authorization meaning. Renaming it to
   `primary_client_id` would touch ~30 policies and 22 call sites for
   documentation value. File as **"user_profiles.client_id rename"**, low
   priority.
6. **No migration file for `clients.plan`.** Still the only column on `clients`
   with no migration on disk. Pre-existing hygiene, unrelated to tenancy.
7. **No fix for the `service_role` prompt-cap bypass** (§8.2). Owner A6.
8. **No decision on the TalentWeLove tables** sharing this Postgres instance
   (§3 Group D). §14 Q4.
9. **No SSO or organisation object.** D1 gives a user many sites. It does not
   introduce an "Account" or "Organisation" entity above sites. Two nullable
   columns and one existing table cover every case Constantin described, and a
   new top-level entity would be a second place for tenancy to be defined — the
   exact failure mode `custom-entitlements.md` §3.4 refused for entitlements.
10. **No change to `_cost.js`, `planConfig.ts` or the plan ladder.** D1 adds no
    copy of it.

---

## 14. Decisions that are Constantin's, not mine

Each carries my recommendation rather than a silent deferral.

**Q1. Is there an agency tier, and does a second site cost less than the first?**
Not an architecture question. D1 makes each site independently billable at its
own plan; whether site two is discounted is pricing.
*Recommendation:* ship D1 with no discount and no agency SKU. Each site pays its
own tier. Revisit once a real agency asks, with their site count as the input.
`PRICING-SPEC.md:24` already promises "multi-brand" inside Pro, which is a claim
D1 makes true for the first time — worth checking that page does not now promise
something cheaper than the per-site model delivers.

**Q2. Confirm one Stripe Customer per site, accepting separate invoices.**
§6.1's four reasons are technical and I have ruled on them. The customer-facing
consequence is commercial: three sites means three invoices and three card
entries.
*Recommendation:* accept it. It is free today (0 clients carry a
`stripe_customer_id`) and it is the only shape under which A1's package expiry
and the cancellation path stay correct without a rewrite. If separate invoices
are commercially unacceptable, say so **before step 7**, because the alternative
is a different design for `expire-plan-grants.js`, not a flag.

**Q3. Roll-up in D1 or D2?** I have ruled D2 (§7).
*Recommendation:* hold. The switcher is the whole of the stated ask. Adding an
unspecified analytics surface to a security-boundary change is the pairing most
likely to produce a review that misses something.

**Q4. TalentWeLove tables in the BrandGEO database.** `subscribers`, `contracts`,
`contract_events`, `quotes`, `quote_roles` and seven `twl_*` functions live in
`public` on `duiyifepitvugyulobqm` alongside BrandGEO's schema.
*Recommendation:* out of scope for D1, but worth a deliberate decision. They are
correctly RLS-scoped on `subscribers.owner_user_id` and leak nothing today. The
risk is a future BrandGEO migration that enumerates `public` and touches them.

---

## 15. Handoff packets

Three, with disjoint `scope_write`. `bg-verify` runs **twice**: once on this
document before any build, per ROADMAP D1's sequencing, and once after.

### Packet A — `bg-architect` → `bg-verify` (pre-build)

```
to: bg-verify   model: opus   status: READY
scope_write: docs/qa/multi-site-tenancy-boundary-review.md
scope_read:  docs/arch/multi-site-tenancy.md,
             brandgeo-dashboard/netlify/functions/_auth.js,
             brandgeo-dashboard/src/lib/clientContext.tsx,
             brandgeo-dashboard/netlify/functions/stripe-webhook.js,
             live Supabase (read-only)
```
Adjudicate INVARIANT M (§2.3) and the fail-closed rules (§2.4) **before a line is
written**. Re-derive §3's 77-policy classification independently from
`pg_policies` and report any policy this document missed or misfiled. Confirm
`user_clients` still holds 0 rows and that no write path has appeared.

### Packet B — `bg-architect` → `bg-backend` (steps 1-4, 6, 7)

```
to: bg-backend   model: opus   status: BLOCKED on Packet A
scope_write: db/supabase-multisite-membership-migration.sql,
             db/supabase-multisite-rls-migration.sql,
             db/supabase-multisite-close-legacy-migration.sql,
             db/supabase-multisite-rollback.sql,
             brandgeo-dashboard/netlify/functions/_auth.js,
             brandgeo-dashboard/netlify/functions/client-members.js,
             brandgeo-dashboard/netlify/functions/stripe-webhook.js,
             + the 19 files listed in §9.2
scope_read:  docs/arch/multi-site-tenancy.md,
             docs/arch/custom-entitlements.md,
             docs/qa/multi-site-tenancy-boundary-review.md
```
Opus, not Sonnet: auth and billing, AGENT-OS §2. Ship steps in the §11 order, one
commit per step, never two steps in one commit.

### Packet C — `bg-architect` → `bg-app` (step 5)

```
to: bg-app   model: sonnet   status: BLOCKED on Packet B step 4
scope_write: brandgeo-dashboard/src/lib/clientContext.tsx,
             brandgeo-dashboard/src/components/Layout.tsx,
             brandgeo-dashboard/src/pages/Account.tsx
scope_read:  docs/arch/multi-site-tenancy.md §4.4, §9.3, §12.7
```

**Disjointness proof.** A writes only `docs/qa/`. B writes only `db/` and
`brandgeo-dashboard/netlify/functions/`. C writes only
`brandgeo-dashboard/src/`. The three sets share no path and no prefix. AGENT-OS
§1's directory rule is satisfied because each packet names exact files, not
directories.

**Ordering is not disjointness.** B and C touch different files but C's step 5 is
meaningless before B's step 4, and B's step 6 must land after C's step 5. Run
them serially in the §11 order despite the disjoint scopes. Git stays serialized
regardless (AUTONOMY §2).

---

## 16. Answers to the `bg-architect` calibration

1. Three collection entry points in
   `brandgeo-dashboard/netlify/functions/`: `collect-prompt.js`,
   `collect-claude.js`, `collect-chatgpt.js`. Shared module: `_analysis.js`
   (via `_collect.js`, which the three are now thin wrappers over).
2. `buildSystemContext(cfg, marketLabel, regionLabel)` — not re-verified this
   session; it sits outside D1's read allowlist and no claim in this document
   depends on it. Recorded as unverified rather than asserted.
3. The dashboard authenticates by sending the Supabase JWT as
   `Authorization: Bearer <token>`; `_auth.js:85-96` extracts it and calls
   `supabase.auth.getUser(token)`, 401 on missing (`:88`) or invalid (`:95`).
   Origin is separately whitelisted at `_auth.js:80`.
4. Tables written by the collection path: `ai_results` (the
   `service_insert_ai_results` policy for `service_role` is the only INSERT
   policy on it), plus `collection_jobs` and `collection_runs` for queue state.
5. **Unknown.** The current production bundle size of `brandgeo-dashboard` was
   not measured this session. To measure: `npm run build` in
   `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard`, then
   read the gzip column of Vite's `dist/assets/index-*.js` line. Criterion 30
   requires this baseline before and after; guessing it would fail AUTONOMY §1.
6. `docs/AGENT-OS.md` §1: `bg-architect` | Opus 5 | owns `docs/arch/` | never
   writes any implementation file.

**CALIBRATED** — with answers 2 and 5 recorded as unverified and unknown
respectively, neither load-bearing for anything above.
