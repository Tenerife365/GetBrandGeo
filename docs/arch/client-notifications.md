# Client-facing notifications

Architecture spec. `bg-architect`, 2026-07-31.

**Objective, in Constantin's words:** "whenever we send a customer an email, they
should also receive a shortened version as a notification inside their own
dashboard, as a general rule for all accounts." Plus a targeted second case: when
the Radar tier goes live, every free client sees an offer to register interest,
so demand is measured before more is built.

**Status:** DESIGNED, NOT BUILT. Nothing in this file has been applied to
production. Every claim about current behaviour carries a `path:line` or a query
that was run against project `duiyifepitvugyulobqm` on 2026-07-31.

**Two things that must route through `bg-verify` before the build stage, not
only after**, per the standing guardrail on auth and RLS:

1. §3, the RLS ruling, because this is the customer-readable boundary.
2. §7.2, the interest-registration write path, because it is the first time a
   customer's own `UPDATE` is used to record a value BrandGEO then counts.

---

## 1. Current state, verified

### 1.1 A customer-facing notification table already exists and is live

This is the single most important finding, and it changes the shape of the
answer. The brief asked whether to build a new table or extend
`admin_notifications`. Neither. **`public.client_notifications` already exists,
is already RLS'd to the owning client, is already written by two functions, and
is already rendered.** It was shipped 2026-07-21 in the same migration as
`admin_notifications` and has been carrying customer notices since.

| Fact | Evidence |
|---|---|
| Table defined | `db/supabase-admin-plan-grants-migration.sql:73` to `:84` |
| SELECT policy, owning client or admin | `db/supabase-admin-plan-grants-migration.sql:93` to `:95` |
| UPDATE policy, owning client or admin, both clauses | `db/supabase-admin-plan-grants-migration.sql:100` to `:103` |
| No INSERT policy, no DELETE policy, deliberately | `db/supabase-admin-plan-grants-migration.sql:105` |
| Rendered as a dismissible banner | `brandgeo-dashboard/src/components/ClientBanner.tsx:28` to `:45` |
| Mounted at the top of the scroll container, every page | `brandgeo-dashboard/src/components/Layout.tsx:784` to `:785` |
| Written on a plan change | `brandgeo-dashboard/netlify/functions/set-client-plan.js:182` to `:185` |
| Written on a grant expiry | `brandgeo-dashboard/netlify/functions/expire-plan-grants.js:209` to `:218` |
| Frontend type | `brandgeo-dashboard/src/types/index.ts:159` to `:170` |

Live shape, read from `information_schema.columns` on 2026-07-31:

```
id bigint pk | client_id integer NOT NULL | kind text NOT NULL | title text NOT NULL
body text NOT NULL | meta jsonb NOT NULL default '{}' | cta_label text | cta_url text
created_at timestamptz NOT NULL default now() | dismissed_at timestamptz
```

Live policy set, read from `pg_policies` on 2026-07-31, exactly two rows:

```
client_notifications | client_notifications_select | SELECT | {authenticated}
    qual: (is_admin() OR (client_id = get_my_client_id()))
client_notifications | client_notifications_update | UPDATE | {authenticated}
    qual:       (is_admin() OR (client_id = get_my_client_id()))
    with_check: (is_admin() OR (client_id = get_my_client_id()))
```

Live volume: **2 rows, both undismissed.** `admin_notifications` holds 3.

### 1.2 The admin feed is a different table with a different posture

`admin_notifications` is gated on `is_admin()` alone
(`db/supabase-admin-notifications-migration.sql:37` to `:45`), read by
`AdminBell.tsx:53` to `:58`, mounted in the sidebar header at `Layout.tsx:305`.
It polls every 90s (`AdminBell.tsx:64` to `:69`) and marks all read with a single
unfiltered `UPDATE ... IS NULL` (`AdminBell.tsx:88`), which is only safe because
the policy already restricts the row set to admins.

Both tables depend on `public.is_admin()` and `public.get_my_client_id()`,
defined `SECURITY DEFINER STABLE` at
`db/supabase-multitenant-migration.sql:43` to `:54`.

### 1.3 The complete inventory of customer-addressed email

Grepped, then each call site read. `sendBrandedEmail` is defined at
`brandgeo-dashboard/netlify/functions/_email.js:131`, with the optional
`signature` block at `:88` and `:46`.

| Call site | Recipient | Writes a client notification? |
|---|---|---|
| `set-client-plan.js:200` | the client's login emails | **Yes**, at `:182`, row before email |
| `expire-plan-grants.js:237` | `ADMIN_ALERT_EMAIL` | n/a, admin mail |
| `_admin_notify.js:50` | `ADMIN_ALERT_EMAIL` | n/a, admin mail |
| `support-request.js:320` | `support@getbrandgeo.com` | n/a, admin mail |
| `assistant-lead.js:59` | `ADMIN_ALERT_EMAIL` | n/a, admin mail |

`support-request.js` and `assistant-lead.js` still hold their own inline Resend
fetch rather than using `_email.js`. Both mail internal addresses only, so they
are out of scope for the mirror rule, and folding them into `_email.js` is a
refactor filed separately in §11, not smuggled in here.

**So the rule Constantin is asking for has exactly one code path today, and that
path already obeys it.** What does not exist is anything that keeps the next call
site obeying it, and the free-plan Gemini email in `docs/copy/free-plan-gemini-update.md`
has no code path at all: §6 of that file sends it by hand with `node -e`, which
mirrors nothing.

One asymmetry worth naming: `expire-plan-grants.js` writes the customer a banner
at `:209` and sends the customer **no email**. The mirror rule is stated as email
implies notification. It is not biconditional, and this path is why.

### 1.4 The segment for case B is not `plan = 'free'`

Measured against production on 2026-07-31, not assumed. `clients` holds 36 rows:
27 `category = 'research'`, 8 real customers, 1 own account (`BrandGEO`, id 2).

Two clients sit on `plan = 'free'`:

| id | name | category | last_sign_in_at |
|---|---|---|---|
| 25 | Slatehq | active | **null, never signed in** |
| 26 | Ai Fy | free | 2026-07-23 09:00:37 UTC |

Client 25 is an abandoned self-service signup on a competitor's domain that never
confirmed its invite and has never logged in. An in-dashboard notification
addressed to it can never be seen, and a pricing announcement addressed to it is
a roadmap signal handed to a competitor's domain for nothing in return.

The 27 research clients hold **zero** `user_profiles` rows, confirmed by query.
Any fan-out that does not exclude them writes 27 rows no human can ever read.

**A naive `plan = 'free'` predicate targets 2. The correct predicate targets 1.**
That gap is 100 percent of the measurement in a sample of one, which is the whole
point of case B. §6 makes the predicate structural rather than remembered.

### 1.5 Radar does not exist yet

`PLAN_ORDER` at `brandgeo-dashboard/src/lib/planConfig.ts:332` is
`['free','essentials','growth','growth_pro','managed','pro','enterprise']`. There
is no `radar`. The tier is signed in `docs/strategy/sprint-ladder-ruling.md` and
priced there, but it is not in the code. **Case B's announcement is therefore
gated on a plan that does not exist**, which is a sequencing fact, not a blocker:
the design below does not name a plan id anywhere, so it ships before Radar does.

---

## 2. The boundary decision

**Ruling: extend `client_notifications`. Do not create a new table. Do not add an
`audience` column to `admin_notifications`.**

Reasoning, one line each.

- **Not a new table.** A customer-readable notification table with the correct
  tenancy policy, a rendering component, and live rows already exists; a second
  one would mean two places a customer notice can hide and two policies to keep
  right.
- **Not an `audience` column on `admin_notifications`.** That table's SELECT
  policy is `is_admin()` with no tenancy term at all
  (`supabase-admin-notifications-migration.sql:39`). Making it serve customers
  means rewriting that policy to carry both an audience test and a tenancy test,
  and one wrong `OR` in that rewrite exposes every admin notification, including
  Stripe and signup detail about other tenants, to every customer. The two
  audiences stay in two tables with two policies that never reference each other.
  This is the direct application of the warning in the brief and of the nine
  permissive policies this repo shipped in `CLAUDE.md` §6.4 step 7.

**What moves:** the customer email send moves out of `set-client-plan.js` and
into a shared `_client_notify.js`, so that writing the row and sending the mail
become one call that cannot be half-performed by a future caller.

**What stays:** the table name, both existing policies unchanged (§3), the
`ClientBanner` component and its mount point, `admin_notifications` and
`AdminBell` untouched.

**What is new:** six columns, one view, one trigger, one shared backend helper,
one broadcast function, one frontend feed component.

---

## 3. The RLS ruling

### 3.1 The policy set does not change

**Ruling: the two existing policies on `client_notifications` are correct for
both case A and case B, and this design changes neither, adds no third policy,
and removes none.**

This is deliberate and it is the strongest available answer to the risk the brief
names. Postgres ORs multiple permissive policies for the same command, so the
effective rule for `SELECT` is the disjunction of every `SELECT` policy on the
table. A table with one `SELECT` policy has an effective rule you can read in one
line. A table with two has a rule you have to reason about, and reasoning about
it is exactly what failed in §6.4 step 7, where nine permissive policies with
`qual: true` sat alongside correct per-client policies and ORed tenant isolation
away entirely.

The design is arranged so that no second policy is ever needed:

- `client_id` is `NOT NULL` (verified in `information_schema.columns`). Every
  row, including every broadcast row, is addressed to exactly one tenant.
- Because `client_id` can never be `NULL`, there is no such thing as a row that
  the existing policy fails to cover. A `NULL` broadcast row would be readable by
  nobody, since `NULL = get_my_client_id()` evaluates to `NULL`, not true, and
  making it readable would require the second policy this ruling forbids.
- §5 therefore rules for fan-out, and the RLS consequence is the deciding reason,
  not a side effect.

**Standing rule for anyone who edits this table later: to change who can read
`client_notifications`, `DROP POLICY IF EXISTS client_notifications_select` and
`CREATE POLICY client_notifications_select` again with the same name. Never
`CREATE POLICY client_notifications_select_2`.** A same-name replacement is
atomic in intent and shows up as one row in `pg_policies`. A second policy is
additive and silently widens access. Acceptance criterion AC-2 counts the rows.

### 3.2 The policies, written out

Unchanged from what is live today. Restated here so a reviewer can diff the file
against `pg_policies` without opening a second document.

```sql
-- SELECT. The owning client, or an admin. One policy, no second policy.
DROP POLICY IF EXISTS client_notifications_select ON public.client_notifications;
CREATE POLICY client_notifications_select ON public.client_notifications
  FOR SELECT TO authenticated
  USING (public.is_admin() OR client_id = public.get_my_client_id());

-- UPDATE. Same row set. WITH CHECK repeats the condition so an update cannot
-- move a row to another tenant, which USING alone would permit.
DROP POLICY IF EXISTS client_notifications_update ON public.client_notifications;
CREATE POLICY client_notifications_update ON public.client_notifications
  FOR UPDATE TO authenticated
  USING      (public.is_admin() OR client_id = public.get_my_client_id())
  WITH CHECK (public.is_admin() OR client_id = public.get_my_client_id());

-- No INSERT policy and no DELETE policy, for anyone. Rows are created by the
-- service role only, and a notification history that a client can delete is not
-- a history. Same reasoning as tickets (db/supabase-tickets-migration.sql:81)
-- and promotions.
```

The effective matrix these produce:

| op | admin | viewer (any non-admin authenticated user) | anon |
|---|---|---|---|
| SELECT | every row, every tenant | own `client_id` only | nothing, no policy names `anon` |
| INSERT | nothing, no policy | nothing, no policy | nothing, no policy |
| UPDATE | any row, any column, subject to §3.4 trigger | own rows only, columns pinned by §3.4 | nothing |
| DELETE | nothing, no policy | nothing, no policy | nothing |

`is_admin()` COALESCEs to false for a JWT with no profile row
(`supabase-multitenant-migration.sql:50` to `:53`), and such a JWT has a `NULL`
`get_my_client_id()`, which matches no row. So an authenticated user with no
profile sees nothing rather than everything, which is the correct failure
direction.

### 3.3 One real gap in the current grants, and the fix

`information_schema.role_table_grants` on 2026-07-31 returns, for
`client_notifications`:

```
anon           DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
authenticated  DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE
```

These are Supabase's default blanket grants; the migration never narrowed them.
**This is not a live vulnerability.** RLS is enabled, both policies are scoped
`TO authenticated`, and `anon` matches no policy, so `anon` reads zero rows and
writes zero rows. The privilege is held and unusable.

It is still wrong, for the reason the tickets migration already argued at
`db/supabase-tickets-migration.sql:257` to `:267`: the grant should express the
intent, so that the day someone adds a policy `TO public` or `TO anon` by
accident, the grant is not already sitting there waiting. The migration in §8
revokes it, matching the tickets precedent exactly.

### 3.4 What RLS cannot do here, and the trigger that covers it

**RLS gates rows, not columns.** The tickets migration hit this and resolved it
by giving customers no `UPDATE` policy at all
(`db/supabase-tickets-migration.sql:53` to `:61`). That option is not available
here, because dismissing and reading a notification is a customer action and
`ClientBanner.tsx:42` already performs it.

So today, a customer can `UPDATE` any column on their own notification row:
`title`, `body`, `cta_url`, `meta`. Harmless while the only consequence is
vandalising a banner only they can see. **It stops being harmless the moment
§7 counts a column a customer can write**, because then a self-reported field
becomes an input to a pricing decision.

Covered by a `BEFORE UPDATE` trigger, not by a policy, because a policy cannot
express it. The trigger does three jobs:

1. Rejects any change to `client_id`, `kind`, `title`, `body`, `meta`,
   `cta_label`, `cta_url`, `created_at`, `batch_id`, `segment`, `action_kind`,
   `action_label`, `banner`. A customer may only move `read_at`, `dismissed_at`
   and `action_value`.
2. Stamps `action_taken_at := now()` and `action_by := auth.uid()` server-side
   whenever `action_value` changes, so neither the timestamp nor the identity is
   client-supplied.
3. Refuses to un-read and un-dismiss: `read_at` and `dismissed_at` may go from
   `NULL` to a value, never back. This is what makes an unread count and a
   dismissal an audit fact rather than a toggle.

The trigger applies to the service role too, because triggers are not bypassed by
`service_role` the way RLS is. Job 1 must therefore exempt the service role, or a
future admin correction to a typo in `title` becomes impossible. It exempts via
`current_setting('role')`, and the exemption is asserted in AC-6 so it cannot
quietly widen.

---

## 4. Data contracts

### 4.1 The row, after this spec

```ts
/** public.client_notifications */
export interface ClientNotification {
  id: number
  /** NOT NULL. The tenancy key the SELECT policy is written on. */
  client_id: number

  /** Semantic type. Drives the icon, not the security. */
  kind:
    | 'plan_grant'        // existing, live
    | 'plan_change'       // existing, live
    | 'trial_expired'     // existing, live
    | 'product_update'    // NEW. Mirror of a product/announcement email.
    | 'account'           // NEW. Mirror of an account or billing email.
    | 'offer'             // NEW. A targeted announcement carrying an action.

  /** Short. See §4.4 for the length contract and why it is a contract. */
  title: string
  body: string

  meta: Record<string, unknown>
  cta_label: string | null
  cta_url: string | null
  created_at: string

  // ── new columns ──────────────────────────────────────────────────────────
  /** true = also render as a full-width banner. false = feed only. */
  banner: boolean
  /** Groups one fan-out into one logical announcement. null for 1-to-1 rows. */
  batch_id: string | null
  /** The named segment this row was addressed by. Provenance, not a filter. */
  segment: string | null

  /** Non-null turns the row into a question. null = a notice. */
  action_kind: 'interest' | null
  /** The button label. Copy, supplied by the caller, never invented by the UI. */
  action_label: string | null
  /** The answer. Client-writable. The ONLY client-writable content column. */
  action_value: 'interested' | 'not_now' | null
  /** Stamped by the trigger, never by the client. */
  action_taken_at: string | null
  action_by: string | null   // auth.users.id

  /** Feed read state. Distinct from dismissal. See §4.5. */
  read_at: string | null
  /** Banner dismissal. Existing column, unchanged semantics. */
  dismissed_at: string | null
}
```

`meta` is free-form and carries diagnostics rather than anything the UI branches
on. The mirror writes `{ email_status: 'sent' | 'failed' | 'skipped',
email_error?: string, email_recipients?: number }`. This is deliberately not a
column: nothing filters on it, only ops reads it, and a jsonb key costs no
migration when its shape changes. AC-4's check command reads it with `->>`.

### 4.2 The backend contract, case A

New shared helper, `netlify/functions/_client_notify.js`. Shaped as the sibling of
`_admin_notify.js:42`, which it deliberately resembles.

```ts
/**
 * The ONLY sanctioned way to send a customer an email.
 * Writes the dashboard mirror first, then sends. Never throws.
 */
function notifyClient(
  supabase: SupabaseClient,   // service-role client, bypasses RLS to insert
  args: {
    client_id: number
    kind: ClientNotification['kind']

    /** The dashboard mirror. Short. See §4.4. */
    title: string
    body: string
    cta?: { label: string; url: string } | null
    banner?: boolean            // default false
    meta?: Record<string, unknown>

    /**
     * The email. Passed straight to sendBrandedEmail (_email.js:131) with `to`
     * resolved from the client's own user_profiles. Omit to write a
     * notification with no email, which is expire-plan-grants.js's case.
     */
    email?: {
      subject: string
      heading: string
      paragraphs: string[]
      bullets?: string[]
      cta?: { label: string; url: string }
      footerNote?: string
      replyTo?: string
      signature?: EmailSignature   // _email.js:46
    } | null
  }
): Promise<{
  ok: boolean                 // true when the ROW was written
  notification_id: number | null
  email: { sent: boolean; skipped?: boolean; error?: string; recipients: number }
}>
```

Error shape: the function never throws, matching `_admin_notify.js:46` and `:58`,
which warn and continue. A notification failure must never take down the plan
change or the billing event that triggered it.

### 4.3 The backend contract, case B

New admin-gated function, `netlify/functions/broadcast-notification.js`, behind
`requireAuth(event, { adminOnly: true })` (`netlify/functions/_auth.js`).

```ts
// POST /.netlify/functions/broadcast-notification
interface BroadcastRequest {
  segment: 'free_plan' | 'all_paid' | 'all'   // resolved via the view in §6.2
  kind: ClientNotification['kind']
  title: string
  body: string
  banner?: boolean                     // default true for an offer
  cta?: { label: string; url: string } | null
  action?: { kind: 'interest'; label: string } | null
  /** Omit to write dashboard-only. Present to also email each recipient. */
  email?: NotifyClientEmail | null
  /** Required. Refuses to send twice with the same key. See §5.4. */
  idempotency_key: string
  /** true = resolve and count the segment, write nothing, send nothing. */
  dry_run?: boolean
}

interface BroadcastResponse {
  ok: true
  batch_id: string          // uuid, the handle for every query in §7.3
  segment: string
  targeted: number          // rows written, or would-be rows when dry_run
  clients: Array<{ id: number; name: string }>   // always returned, so the
                                                 // operator sees WHO before
                                                 // and after
  emails: { sent: number; failed: number; skipped: number }
  dry_run: boolean
}

interface BroadcastError {
  error: string
  code: 'unauthorized' | 'bad_segment' | 'empty_segment'
      | 'duplicate_idempotency_key' | 'copy_rejected'
}
```

`copy_rejected` is not decoration. See §10.

### 4.4 The length contract on the mirror, and why it is a contract

"A shortened version" is the requirement. Left as an adjective it will be
violated by the third caller.

- `title`: <= 60 characters. It is rendered on one line in a 22rem panel
  (`AdminBell.tsx:153` sets that width for the admin equivalent) and truncates
  after that, so anything longer is invisible, not merely long.
- `body`: <= 200 characters. The feed clamps to two lines
  (`line-clamp-2`, `AdminBell.tsx:196`).

**Enforced by CHECK constraint, not by a code review.** An over-long body is
rejected at insert with a database error the caller sees in development, rather
than being silently clipped in a customer's dashboard. AC-3 asserts the refusal.

The email body is not constrained. The mirror is a pointer to the email, not a
copy of it, and this is the line that keeps it one.

### 4.5 Empty, loading and error states, and who owns the fetch

| State | Feed (`ClientBell`) | Banner (`ClientBanner`) |
|---|---|---|
| loading, first paint | bell renders, no badge, panel says "Loading..." only if open | renders nothing |
| empty | panel says "You are all caught up." | renders nothing, unchanged, `ClientBanner.tsx:45` |
| error / table missing | swallow, render as empty | swallow, render as empty, unchanged, `ClientBanner.tsx:35` |
| demo mode | render nothing at all | render nothing, unchanged, `ClientBanner.tsx:25` |

**Ownership of the fetch: the components own it, directly against Supabase with
the anon key and the user's JWT. No context, no Netlify function.**

Reasoning: this is the established pattern for tenant-owned data in this
codebase, argued at `db/supabase-tickets-migration.sql:40` to `:46`, and used by
`ClientBanner.tsx:28` and `AdminBell.tsx:53` today. RLS is the boundary. Routing
the read through a function would add a network hop, a CORS surface and a second
place tenancy is decided, and the second place is how the two disagree.

A shared context is NOT introduced, deliberately. Two components read the same
table with two different filters (`banner = true AND dismissed_at IS NULL` versus
everything), and both are cheap. A context would be the third place the same
rows live and would have to be invalidated by both. Revisit only if a third
consumer appears.

---

## 5. State ownership map

| State | Owner | Readers | Invalidates when |
|---|---|---|---|
| the row itself | Postgres, written by service role only | `ClientBell`, `ClientBanner`, admin queries | never, append-only |
| `read_at` | the client, via `ClientBell` | `ClientBell` badge count | on open of the panel; monotonic, trigger refuses reset |
| `dismissed_at` | the client, via `ClientBanner` | `ClientBanner` filter | on X click; monotonic |
| `action_value` | the client, via `ClientBell` | the §7.3 queries | on button click; may be changed, see §7.4 |
| `action_taken_at`, `action_by` | the §3.4 trigger | the §7.3 queries | server-side only, never client-supplied |
| unread count | derived, `ClientBell` only | the badge | on every load and on `read_at` write |
| `email_status` | `_client_notify.js`, at send | ops queries only | never |

### 5.1 Values currently derived twice, named as the brief requires

1. **"Which client is this about"** is derived from `client_id` at render time in
   `AdminBell.tsx:106` to `:112`, and separately baked into `body` text at write
   time by every caller. The comment at `AdminBell.tsx:91` to `:105` documents
   three production rows that say only "A client canceled" because the writer
   never selected `name`. **`ClientBell` must not repeat this**: the client-facing
   feed is always about the reader's own client, so it must never print a client
   name at all. Naming the reader back to themselves is noise, and it removes the
   whole class of defect.
2. **The client's login email set** is derived by walking `user_profiles` then
   `auth.admin.getUserById` in `set-client-plan.js:188` to `:197`, and would be
   derived again by any second sender. **`_client_notify.js` becomes the one
   implementation**, and `set-client-plan.js` loses its copy. This is the second
   reason the helper exists, after the mirror rule.
3. **"Is this user an admin"** is derived in SQL by `is_admin()` and in TypeScript
   by `useClient().isAdmin`. Not introduced by this spec and not fixed by it, but
   `ClientBell` must gate on neither: it shows the active client's notifications
   whoever is looking, which is the same rule `ClientBanner` already follows via
   `activeClientId` (`ClientBanner.tsx:30`). Consequence, stated because it is
   surprising: **an admin impersonating a client can dismiss that client's
   notification and mark it read.** True today for banners, unchanged here,
   filed in §11 rather than fixed, because fixing it means a per-user read table
   and that is a larger change than the objective.

---

## 6. Segment targeting for case B

### 6.1 Ruling: fan-out, one row per client

**Ruling: a broadcast writes one row per targeted client, joined by a shared
`batch_id`. It does not write one row addressed to a segment.**

Four reasons, in the order that decided it.

1. **The denominator must freeze.** Case B exists to answer "how many free users
   would pay for Radar". A single row plus a live predicate gives a denominator
   that changes after the fact: a free client who upgrades next week silently
   leaves the segment, and the interest rate moves without anyone touching the
   data. Fan-out records who was asked, at the moment they were asked,
   permanently. For a measurement instrument, a moving denominator is
   disqualifying. This is the deciding reason.
2. **RLS stays at one policy.** §3.1. A segment row needs `client_id IS NULL` and
   therefore a second permissive `SELECT` policy on the customer-readable table.
   That is the exact construct this repo has already been burned by.
3. **Read state and dismissal are per-client whether you like it or not.** A
   shared row still needs a per-client `read_at` and `dismissed_at`, which means
   a second table keyed on (notification_id, client_id). That is more tables and
   more joins than fan-out, not fewer.
4. **The interest answer is per-client too**, and it is the payload. A shared row
   cannot hold it.

**Cost, stated in numbers.** The largest segment today is 8 rows. `all` at 36
clients would be 36, and the view in §6.2 cuts that to 8. At 1,000 clients a full
broadcast is 1,000 rows, roughly 200KB, inserted in one statement. **Fan-out
stops being right at roughly 50,000 rows per broadcast, or when broadcasts become
frequent enough that the table grows faster than it is read.** Neither is within
two orders of magnitude of this product. Revisit at 10,000 clients; do not
revisit before.

### 6.2 The eligibility view, and why it is a view

The segment predicate must not be written at each call site, because §1.4 shows
what a remembered predicate costs: `plan = 'free'` targets an abandoned account
on a competitor's domain that can never read it.

```sql
-- Every client that may EVER receive a notification. Broadcasts select from
-- here and add their own filter; none of them re-derive eligibility.
--
-- Three exclusions, each measured against production 2026-07-31:
--   category = 'research'      27 rows, zero user_profiles, no human reader
--   no user_profiles row        a client nobody can log into
--   never signed in             client 25, invited and abandoned; an
--                               in-dashboard notice cannot reach them, and a
--                               pricing announcement to a never-activated
--                               account on a competitor domain is a gift
CREATE OR REPLACE VIEW public.notifiable_clients AS
SELECT c.id, c.name, c.plan, c.category
FROM public.clients c
WHERE c.category IS DISTINCT FROM 'research'
  AND EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN auth.users u ON u.id = up.id
    WHERE up.client_id = c.id
      AND u.last_sign_in_at IS NOT NULL
  );

REVOKE ALL ON public.notifiable_clients FROM anon, authenticated;
```

The `REVOKE` is load-bearing. The view reads `auth.users`, so it must never be
reachable with an anon key. Only the service role selects from it. AC-7 asserts
that.

**Measured today, 2026-07-31:** the view resolves to 8 clients. Filtered to
`plan = 'free'` it resolves to **exactly 1**, Ai Fy, client 26. The raw
`plan = 'free'` predicate resolves to 2.

Named segments, resolved by the broadcast function:

| segment | predicate over `notifiable_clients` | count today |
|---|---|---|
| `free_plan` | `plan = 'free'` | 1 |
| `all_paid` | `plan <> 'free'` | 7 |
| `all` | no filter | 8 |

Deliberately a fixed allowlist and not a free-text predicate from the request
body. A broadcast function that accepts arbitrary SQL from a JSON body is an
injection surface on a table that emails customers.

**`last_sign_in_at` as an eligibility test excludes a real customer who has been
emailed but has genuinely never logged in.** That is the correct call for an
in-dashboard notification, which they cannot see anyway. It is the wrong call if
the broadcast also emails. Ruling: **when `email` is present in the request, the
broadcast targets the view's `category` and `user_profiles` conditions but drops
the `last_sign_in_at` condition**, because email reaches a never-activated
account and the whole point of emailing a dormant free user may be to wake them.
Implemented as a second view, `emailable_clients`, rather than a boolean argument
that flips a security-shaped predicate. Both views ship in the same migration.

### 6.3 `segment` and `batch_id` on the row

`batch_id uuid` groups the fan-out. `segment text` records which named segment
addressed it. Both are provenance: no policy and no UI branches on either. They
exist so §7.3's queries have a handle and so "why did this client get this" is
answerable a year later without reconstructing a predicate.

### 6.4 Idempotency

`idempotency_key` is required, and the function refuses a key already present in
any row's `meta->>'idempotency_key'`. A broadcast is the one operation here whose
double-execution is visible to every customer at once, and a retried POST after a
timeout is the ordinary way that happens.

---

## 7. The interest-registration action

### 7.1 What the button is

An `offer` row carries `action_kind = 'interest'` and `action_label`, for example
"Yes, I want this". The feed renders two buttons on that row and nothing else.
Clicking writes `action_value`.

Two values, not one: `'interested'` and `'not_now'`. A single button conflates "no"
with "did not see it", and for a demand measurement those are different numbers.
The §7.3 query reports all three states for that reason.

### 7.2 Where the click writes, and the ruling

**Ruling: the client `UPDATE`s their own notification row directly, over
PostgREST, through the existing `client_notifications_update` policy. No new
table, no new endpoint, no policy change.**

```
UPDATE public.client_notifications
   SET action_value = 'interested'
 WHERE id = <the row the client is looking at>
```

The policy at §3.2 already restricts this to the client's own rows and already
prevents moving the row to another tenant. The trigger at §3.4 stamps
`action_taken_at` and `action_by` server-side and refuses every other column.

**The rejected alternative and why.** A `register-interest.js` Netlify function
behind `requireAuth` would stamp `auth.uid()` server-side and be tamper-proof by
construction. It was rejected because the trigger achieves the same stamping with
no new endpoint, no CORS surface, no deploy, and no second place tenancy is
decided. The one thing the function would buy that the trigger does not is a
server-side rate limit on how often a client flips their answer, and §7.4 says
why that does not matter.

**This is the item that must go to `bg-verify` before build.** It is the first
customer-authored write whose value BrandGEO then counts, and the whole guarantee
rests on a trigger rather than on a policy.

### 7.3 The named query

**This is the query the whole of case B exists to make answerable.** Recorded
here so it is run rather than reinvented.

```sql
-- Q1. THE ANSWER. Substitute the batch_id returned by the broadcast.
SELECT
  count(*)                                                AS targeted,
  count(*) FILTER (WHERE action_value = 'interested')     AS interested,
  count(*) FILTER (WHERE action_value = 'not_now')        AS declined,
  count(*) FILTER (WHERE action_taken_at IS NULL)         AS no_answer,
  count(*) FILTER (WHERE read_at IS NOT NULL)             AS opened,
  round(
    100.0 * count(*) FILTER (WHERE action_value = 'interested')
    / nullif(count(*), 0)
  , 1)                                                    AS interest_pct_of_targeted,
  round(
    100.0 * count(*) FILTER (WHERE action_value = 'interested')
    / nullif(count(*) FILTER (WHERE read_at IS NOT NULL), 0)
  , 1)                                                    AS interest_pct_of_opened
FROM public.client_notifications
WHERE batch_id = '<BATCH_UUID>';
```

Both percentages are reported on purpose. `interest_pct_of_targeted` is the
number that decides whether to build Radar. `interest_pct_of_opened` is the
number that says whether the first one is trustworthy. At a sample of 1 neither
is a statistic, which §9 states plainly.

```sql
-- Q2. WHO, for the follow-up conversation. This is the row that is worth more
-- than the count at this volume.
SELECT c.id, c.name, c.plan, n.action_value, n.action_taken_at, n.read_at
FROM public.client_notifications n
JOIN public.clients c ON c.id = n.client_id
WHERE n.batch_id = '<BATCH_UUID>'
ORDER BY n.action_value NULLS LAST, c.name;

-- Q3. Every interest signal ever gathered, across batches, for a later
-- cross-offer comparison.
SELECT segment, action_kind,
       count(*) FILTER (WHERE action_value = 'interested') AS interested,
       count(*)                                            AS targeted,
       min(created_at) AS asked_at
FROM public.client_notifications
WHERE action_kind IS NOT NULL
GROUP BY segment, action_kind, batch_id
ORDER BY asked_at DESC;
```

### 7.4 Honest limits of this measurement

Stated because a number that looks harder than it is will be trusted harder than
it should be.

- **The value is self-reported and the client can change it.** The trigger pins
  who and when but not what. A client may click "interested" then "not_now". The
  last write wins and the earlier one is not retained. Accepted: at this volume
  the follow-up conversation is the real instrument and the count is a prompt for
  it. If a version history is ever wanted, it is a separate `notification_actions`
  append-only table, filed in §11, not built now.
- **"Would pay" is not measured. "Said yes to a button" is.** No money changes
  hands, and the gap between the two is large and well documented. The number
  bounds enthusiasm from above, not demand.
- **n is 1 today.** See §9.

---

## 8. What the UI needs

Precise enough for `bg-app` to build without inventing. No tsx here.

### 8.1 Two surfaces, one table

**Ruling: the mirror does not become a banner.** If every mirrored email rendered
as a full-width dismissible banner at the top of every page
(`Layout.tsx:784` to `:785`), the product would nag on every route for every
routine message, and the banner would stop being read exactly when it carries
something that matters.

- **`ClientBanner`, existing, unchanged component logic**, gains one filter:
  `banner = true`. Rows with `banner = false` never reach it. Everything else
  about it stays: mount point, dismissal, the amber-versus-violet split at
  `ClientBanner.tsx:56`, the `activeClientId` filter, the swallow-on-error at
  `:35`.
- **`ClientBell`, new**, is the feed. It is the customer's counterpart to
  `AdminBell` and should be built by copying its structure, because a matching
  shape is worth more here than novelty.

### 8.2 `ClientBell` placement

In the sidebar header, the **same slot** `AdminBell` occupies at
`Layout.tsx:305`. They are mutually exclusive by role: `AdminBell` already
returns `null` for a non-admin (`AdminBell.tsx:81`), and `ClientBell` returns
`null` when there is no `activeClientId` or in demo mode. An admin sees the admin
bell; a customer sees theirs. Two bells side by side for an admin is rejected:
the admin's own account has notifications the admin does not need, and two bells
with different meanings in one 40px space is a puzzle.

Panel geometry: copy `AdminBell.tsx:153` exactly. `fixed`, `left-4 top-16`,
`w-[22rem] max-w-[calc(100vw-2rem)] max-h-[70vh]`, `overflow-hidden`, flex
column, `z-50`. The reason it is `fixed` rather than absolute is that the sidebar
clips an absolute panel; do not rediscover this.

### 8.3 Row rendering

Per row, top to bottom, matching `AdminBell.tsx:190` to `:212`:

- icon, 16px, left, `shrink-0 mt-0.5`. Map by `kind`:
  `plan_grant` Gift, `plan_change` Sparkles, `trial_expired` AlertTriangle
  (all three already mapped at `ClientBanner.tsx:14` to `:18`), `product_update`
  Sparkles, `account` CreditCard, `offer` Gift. Unknown kind falls back to Bell.
  All from `lucide-react`, already a dependency.
- `title`, `text-sm font-medium text-white`, single line, truncate.
- unread dot, `w-1.5 h-1.5 rounded-full bg-brand-400`, right of the title, only
  when `read_at` is null.
- `body`, `text-xs text-slate-400`, `line-clamp-2`.
- **no client name.** §5.1 item 1.
- relative timestamp, `text-[10px] text-slate-600`, using the same `timeAgo`
  helper as `AdminBell.tsx:33`. That function should move to a shared module so
  it is not a third copy.
- if `cta_url`, a link labelled `cta_label ?? 'Open'`.
- if `action_kind === 'interest'` **and** `action_value` is null, two buttons:
  primary labelled `action_label`, secondary labelled "Not right now".
- if `action_kind === 'interest'` **and** `action_value` is set, the buttons are
  replaced by a static line: "Thanks, we have noted that." for `interested`,
  "Noted, thanks." for `not_now`. **The row does not disappear and the answer
  stays changeable**, because a disappearing row reads like a bug.

Read rows: `opacity-60`, matching `AdminBell.tsx:188`.

### 8.4 Unread treatment

- Badge on the bell: count of `read_at IS NULL`, `bg-brand-500`, "9+" above 9.
  Copy `AdminBell.tsx:143` to `:147`.
- **Opening the panel marks every loaded row read**, in one update, after a
  400ms dwell. Not on click of each row. A customer feed is read by looking at
  it, and per-row marking leaves a badge that never clears. The dwell prevents an
  accidental open from clearing a badge the customer never saw.
- The trigger refuses un-reading, so there is no "mark unread" affordance. Do not
  add one; it would fail silently.
- No "Mark all read" button. `AdminBell` has one at `:161` because an admin
  triages a queue. A customer does not triage.

### 8.5 Fetch, polling, ordering

- Query: `select * from client_notifications where client_id = <activeClientId>
  order by created_at desc limit 30`. RLS already restricts it; the `eq` is for
  the admin-impersonation case, exactly as `ClientBanner.tsx:30` does it.
- Poll every 90s while mounted, matching `AdminBell.tsx:64` to `:69`. Not
  realtime: a websocket channel for 8 clients and roughly one notification a
  month is not worth the connection.
- Refetch on `activeClientId` change.

### 8.6 Accessibility

- `aria-label` on the bell including the unread count, as `AdminBell.tsx:140`.
- Panel closes on Escape and on outside click, as `AdminBell.tsx:72` to `:79`.
- The two action buttons are real `<button>`s, focusable, in DOM order after the
  body text.
- Note for `bg-design`: the outstanding contrast defects in the dashboard audit
  apply to this panel too. `text-slate-600` on `bg-dark-800` for the timestamp is
  inherited from `AdminBell` and is very likely below 4.5:1. **Do not copy it
  without measuring it.** This spec does not rule on the token; `bg-design` does.

---

## 9. Where this is over-built for 8 clients, and the cheapest correct version

Required by the brief, and it is the section Constantin should read first.

**Today: 8 customer clients, 1 eligible free client, 2 rows in the table, 1
customer email call site.**

| Piece | Over-built? | Verdict |
|---|---|---|
| Reusing `client_notifications` | No | Free. The table exists. |
| `_client_notify.js` + the grep test | **No, this is the whole rule** | Build it. It is ~60 lines and it is the only thing that makes "every customer email is mirrored" true of the tenth caller as well as the first. |
| `read_at` + `ClientBell` | Mildly | Build it. Without it the mirror has nowhere to live, since §8.1 rules the banner out. |
| `banner` column | No | One column, prevents nagging. |
| §3.4 trigger | **Yes, for case A. No, for case B.** | Build it, but only because §7 counts a client-writable column. Without case B it is not needed. |
| `batch_id`, `segment` | Mildly | Two columns, no code. Keep. |
| `notifiable_clients` view | **No.** | §1.4 measured the failure it prevents: the naive predicate is 100% wrong at n=1. |
| `broadcast-notification.js` | **Yes.** An admin-gated function with idempotency, dry-run and segment resolution, to write **one row**. | See below. |
| Q1's percentages | **Yes.** | An interest rate over n=1 is 0% or 100%. |

### 9.1 The cheapest correct version, if Constantin wants it

**Case B, minimum.** Skip `broadcast-notification.js` entirely. When Radar ships,
Constantin runs one INSERT in the Supabase SQL editor:

```sql
INSERT INTO public.client_notifications
  (client_id, kind, title, body, banner, batch_id, segment,
   action_kind, action_label, cta_label, cta_url)
SELECT id, 'offer', '<title>', '<body>', true, gen_random_uuid(), 'free_plan',
       'interest', '<button label>', NULL, NULL
FROM public.notifiable_clients
WHERE plan = 'free';
```

That is the whole of case B for one recipient. It still uses the view, so it
cannot hit client 25. It still writes `batch_id` and `segment`, so Q1 and Q2 work
unchanged. **What it loses:** no dry-run, no idempotency key, no email leg, and
the SQL is retyped each time. Build the function on the second broadcast, not the
first.

**Case A, minimum.** Today the rule already holds at the only call site
(`set-client-plan.js:182` before `:200`). The absolute minimum is the grep test
in AC-1 plus writing the rule down, with no helper at all. **This is rejected as
the recommendation** but recorded as the option: a test that forbids a pattern
without providing the sanctioned alternative is a test people delete. Build the
helper.

**Estimated saving from taking both minimums:** the broadcast function and its
handoff packet, roughly one build lane. The migration, the helper, the trigger
and `ClientBell` remain.

### 9.2 What is genuinely not worth building at any size here

- Realtime subscriptions. 90s polling is correct at 8 clients and at 8,000.
- Per-user read state. Per-client is right until one client has several logins
  who each need their own unread badge. `Bucate pe Roate` already has 2 profiles,
  so this is the first thing that will actually break. Filed in §11.
- Notification preferences or an opt-out. There are two kinds of notification
  here and both are operational. An opt-out for a plan-expiry notice is a support
  ticket waiting to happen.
- Email-open tracking to make Q1's denominator better. Pixel tracking on 8
  customers for a decision Constantin can make by replying to one person.

---

## 10. Constraints this design is bound by, stated

1. **No euros of API cost, ever, in a notification.** This is `ROADMAP.md` A6's
   constraint at `docs/ROADMAP.md:268` to `:276`, and it binds here because a
   notification is customer-visible copy on the same data. A notification may say
   "your prompts have been re-run" and "3 of your 5 prompts are used". It may
   never say "this run cost EUR 0.064", never show a percentage of a cost budget
   (A6: "the same disclosure wearing a hat"), and never expose
   `PLAN_MONTHLY_API_BUDGET_EUR` or `OVERHEAD_MULTIPLIER` in any form.
   **Enforced, not merely stated:** `broadcast-notification.js` rejects a `title`
   or `body` matching `/(EUR|€)\s?\d|\bcost\b|\bmargin\b|\bAPI spend\b/i` with
   `code: 'copy_rejected'`, and `_client_notify.js` refuses the same. A crude
   filter with false positives is correct here, because the failure it prevents
   is unrecoverable once sent and the operator can always rephrase.
2. **No email system is designed here.** `_email.js` exists, `sendBrandedEmail` at
   `:131` is the sender, `signature` at `:46` is already wired. This spec adds one
   caller and removes one.
3. **No refund window, no guarantee, no SLA** may appear in notification copy.
   Standing rule, restated in `docs/copy/free-plan-gemini-update.md:35` to `:37`.
4. **No price or date for an unbuilt tier.** `docs/copy/free-plan-gemini-update.md:29`
   to `:34` rules that naming EUR 29 before Radar exists turns a live pricing
   decision into a promise. Case B fires **after** Radar is in `planConfig.ts`, so
   its copy may name the real price. It may not fire before.
5. **The words are `bg-copy`'s, not this document's.** Every `<title>` and
   `<body>` above is a placeholder. This spec fixes the length, the constraints
   and the fields; it does not write the sentence.
6. **Sending to a real customer is withheld from the loop** by `docs/AUTONOMY.md`
   §2. Applying the migration is granted; building the function is granted;
   **firing a broadcast that emails a customer is not**, and `bg-verify` should
   check that no scheduled job can call `broadcast-notification.js` with an
   `email` block.

---

## 11. Deliberately out of scope, filed as separate work

Per the standing rule against smuggling a refactor into a feature.

- **`support-request.js:320` and `assistant-lead.js:59` still hold inline Resend
  fetches.** Both mail internal addresses, so neither breaks the mirror rule.
  Folding them into `_email.js` is a tidy-up worth doing and is not this spec.
- **Per-user read state.** `client_notifications` has one `read_at` per row, so
  the two logins on client 1 share a badge. The fix is a
  `client_notification_reads(notification_id, user_id, read_at)` table; the feed
  rows stay as-is. Same shape the admin migration already anticipated at
  `db/supabase-admin-notifications-migration.sql:10` to `:12`.
- **An admin impersonating a client can mark that client's notification read and
  dismiss it.** True today for banners (§5.1 item 3), unchanged by this spec.
- **An append-only `notification_actions` history**, if a changed answer ever
  needs to be recoverable (§7.4).
- **`kind` has no CHECK constraint** on the live table and this spec does not add
  one, because adding it means enumerating a list that will grow and every
  addition becomes a migration. `title` and `body` length are constrained
  instead, since those are the ones a customer sees.

---

## 12. File plan

This becomes each builder's `scope_write` verbatim. No file appears twice.

### Lane 1, `bg-backend`, Opus

| File | Action | Reason |
|---|---|---|
| `db/supabase-client-notifications-feed-migration.sql` | create | The whole of §8's migration: six columns, two views, one trigger, the grants, the length constraints, and the DOWN path. |
| `brandgeo-dashboard/netlify/functions/_client_notify.js` | create | The one sanctioned customer-email path. §4.2. |
| `brandgeo-dashboard/netlify/functions/broadcast-notification.js` | create | Case B fan-out, admin-gated. §4.3. Skip if Constantin takes the §9.1 minimum. |
| `brandgeo-dashboard/netlify/functions/set-client-plan.js` | modify | Replace the inline `client_notifications` insert at `:182` and the `sendBrandedEmail` at `:200` with one `notifyClient` call; delete the email-resolution loop at `:188` to `:197`, which moves into the helper. |
| `brandgeo-dashboard/netlify/functions/expire-plan-grants.js` | modify | Replace the insert at `:209` with `notifyClient({ email: null })`. Its admin email at `:237` is untouched. |
| `brandgeo-dashboard/tests/client_notify.test.js` | create | AC-1's grep assertion and the copy-filter assertion. |

### Lane 2, `bg-app`, Sonnet

| File | Action | Reason |
|---|---|---|
| `brandgeo-dashboard/src/components/ClientBell.tsx` | create | The feed. §8.2 to §8.6. |
| `brandgeo-dashboard/src/components/ClientBanner.tsx` | modify | Add the `banner = true` filter to the query at `:31`. One line. |
| `brandgeo-dashboard/src/components/Layout.tsx` | modify | Mount `ClientBell` in the same slot as `AdminBell` at `:305`. |
| `brandgeo-dashboard/src/types/index.ts` | modify | Extend `ClientNotification` at `:159` to `:170` per §4.1. |
| `brandgeo-dashboard/src/lib/timeAgo.ts` | create | Extract the helper from `AdminBell.tsx:33` so `ClientBell` does not make it a third copy. |
| `brandgeo-dashboard/src/components/AdminBell.tsx` | modify | Import `timeAgo` from the new module, delete the local copy at `:33` to `:39`. Mechanical. |

### Lane 3, `bg-copy`, after lanes 1 and 2

| File | Action | Reason |
|---|---|---|
| `docs/copy/radar-launch-notification.md` | create | The offer copy, the button labels, and the mirror bodies for both existing senders. Bound by §10. |

**Disjointness.** Lane 1 writes only `db/` and `netlify/functions/` and `tests/`.
Lane 2 writes only `src/`. Lane 3 writes only `docs/copy/`. No path appears in two
lanes. Lane 2 depends on lane 1's migration being applied to read the new columns
but does not write any file lane 1 writes, so the two can run concurrently and
lane 2 is verified after the migration lands.

**Mechanical enough for `bg-grunt` on the local model:** the `AdminBell.tsx`
`timeAgo` extraction, and the one-line filter in `ClientBanner.tsx`. Everything
else requires a judgement.

---

## 13. Migration, with the DOWN path

`db/supabase-client-notifications-feed-migration.sql`. Safe to re-run throughout.

### 13.1 UP

```sql
-- ── 1. Columns ──────────────────────────────────────────────────────────────
-- banner: added as DEFAULT true so the two existing live rows keep rendering
-- exactly as they do today, then the default is flipped to false so that a
-- future caller who forgets the flag writes a feed row rather than a banner on
-- every page. This ordering is the migration; do not collapse it.
ALTER TABLE public.client_notifications
  ADD COLUMN IF NOT EXISTS banner boolean NOT NULL DEFAULT true;
ALTER TABLE public.client_notifications
  ALTER COLUMN banner SET DEFAULT false;

ALTER TABLE public.client_notifications
  ADD COLUMN IF NOT EXISTS read_at         timestamptz,
  ADD COLUMN IF NOT EXISTS batch_id        uuid,
  ADD COLUMN IF NOT EXISTS segment         text,
  ADD COLUMN IF NOT EXISTS action_kind     text,
  ADD COLUMN IF NOT EXISTS action_label    text,
  ADD COLUMN IF NOT EXISTS action_value    text,
  ADD COLUMN IF NOT EXISTS action_taken_at timestamptz,
  ADD COLUMN IF NOT EXISTS action_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 2. Constraints ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cn_action_kind_check') THEN
    ALTER TABLE public.client_notifications ADD CONSTRAINT cn_action_kind_check
      CHECK (action_kind IS NULL OR action_kind IN ('interest'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cn_action_value_check') THEN
    ALTER TABLE public.client_notifications ADD CONSTRAINT cn_action_value_check
      CHECK (action_value IS NULL OR action_value IN ('interested','not_now'));
  END IF;
  -- An answer with no question is a data error, not a UI edge case.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cn_action_pairing_check') THEN
    ALTER TABLE public.client_notifications ADD CONSTRAINT cn_action_pairing_check
      CHECK (action_value IS NULL OR action_kind IS NOT NULL);
  END IF;
  -- §4.4. Enforced here so an over-long mirror fails in development rather than
  -- being clipped in a customer's dashboard.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cn_length_check') THEN
    ALTER TABLE public.client_notifications ADD CONSTRAINT cn_length_check
      CHECK (length(title) <= 60 AND length(body) <= 200);
  END IF;
END $$;

-- ── 3. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cn_unread
  ON public.client_notifications(client_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cn_batch
  ON public.client_notifications(batch_id) WHERE batch_id IS NOT NULL;

-- ── 4. Grants. Narrowed to the intent; see §3.3. ────────────────────────────
REVOKE ALL ON public.client_notifications FROM anon;
GRANT SELECT, UPDATE ON public.client_notifications TO authenticated;

-- ── 5. Eligibility views. See §6.2. ─────────────────────────────────────────
CREATE OR REPLACE VIEW public.notifiable_clients AS
SELECT c.id, c.name, c.plan, c.category
FROM public.clients c
WHERE c.category IS DISTINCT FROM 'research'
  AND EXISTS (SELECT 1 FROM public.user_profiles up
              JOIN auth.users u ON u.id = up.id
              WHERE up.client_id = c.id AND u.last_sign_in_at IS NOT NULL);

CREATE OR REPLACE VIEW public.emailable_clients AS
SELECT c.id, c.name, c.plan, c.category
FROM public.clients c
WHERE c.category IS DISTINCT FROM 'research'
  AND EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.client_id = c.id);

REVOKE ALL ON public.notifiable_clients FROM anon, authenticated;
REVOKE ALL ON public.emailable_clients  FROM anon, authenticated;

-- ── 6. The column guard RLS cannot express. See §3.4. ───────────────────────
CREATE OR REPLACE FUNCTION public.client_notifications_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- The service role writes and corrects rows; it is not the threat model.
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.client_id  IS DISTINCT FROM OLD.client_id
  OR NEW.kind       IS DISTINCT FROM OLD.kind
  OR NEW.title      IS DISTINCT FROM OLD.title
  OR NEW.body       IS DISTINCT FROM OLD.body
  OR NEW.meta       IS DISTINCT FROM OLD.meta
  OR NEW.cta_label  IS DISTINCT FROM OLD.cta_label
  OR NEW.cta_url    IS DISTINCT FROM OLD.cta_url
  OR NEW.created_at IS DISTINCT FROM OLD.created_at
  OR NEW.banner     IS DISTINCT FROM OLD.banner
  OR NEW.batch_id   IS DISTINCT FROM OLD.batch_id
  OR NEW.segment    IS DISTINCT FROM OLD.segment
  OR NEW.action_kind  IS DISTINCT FROM OLD.action_kind
  OR NEW.action_label IS DISTINCT FROM OLD.action_label THEN
    RAISE EXCEPTION 'client_notifications: only read_at, dismissed_at and action_value are updatable';
  END IF;

  -- Monotonic. A read notification cannot become unread.
  IF OLD.read_at      IS NOT NULL THEN NEW.read_at      := OLD.read_at;      END IF;
  IF OLD.dismissed_at IS NOT NULL THEN NEW.dismissed_at := OLD.dismissed_at; END IF;

  -- Who and when are stamped here, never accepted from the client.
  IF NEW.action_value IS DISTINCT FROM OLD.action_value THEN
    NEW.action_taken_at := now();
    NEW.action_by       := auth.uid();
  ELSE
    NEW.action_taken_at := OLD.action_taken_at;
    NEW.action_by       := OLD.action_by;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS client_notifications_guard_trg ON public.client_notifications;
CREATE TRIGGER client_notifications_guard_trg
  BEFORE UPDATE ON public.client_notifications
  FOR EACH ROW EXECUTE FUNCTION public.client_notifications_guard();
```

### 13.2 Sequence, and the one window of inconsistency

Four steps, each independently shippable and independently revertible.

| # | Step | Shippable alone? | Notes |
|---|---|---|---|
| 1 | Apply the migration | Yes | Purely additive. Nothing reads the new columns. `ClientBanner` uses `select *` (`ClientBanner.tsx:29`) so it receives the new columns and ignores them. The `banner` default-true backfill means its output is byte-identical. |
| 2 | Ship `_client_notify.js` and refactor the two senders | Yes | Behaviour-preserving. The row and the email are the same; only the caller changes. |
| 3 | Ship `ClientBell` and the `ClientBanner` filter | Yes | **This is the window. See below.** |
| 4 | Ship `broadcast-notification.js` | Yes | Writes nothing until invoked. |

**The window of inconsistency is step 3, and it is between the two frontend
changes, not between backend and frontend.** `ClientBanner` gaining
`banner = true` and `ClientBell` appearing are in the same deploy, but if only one
lands, the states are:

- filter lands, bell does not: rows with `banner = false` are visible **nowhere**.
  Silent, and the customer never knows.
- bell lands, filter does not: every mirrored notification renders **twice**, once
  in the bell and once as a full-width banner on every page.

Both are recoverable and neither loses data. **Ruling: they ship as one commit,
and if that is not possible, ship the bell first**, because a duplicate is visible
and gets fixed, and an invisible row does not.

Steps 1 and 2 have no window at all: after step 1 the schema is a superset of what
step 2 needs, and after step 2 nothing reads the new columns yet.

### 13.3 DOWN

Per `AUTONOMY.md` §2, "every migration ships a down path, or it is not
night-safe."

```sql
-- Reverses §13.1 exactly. Run top to bottom.
DROP TRIGGER  IF EXISTS client_notifications_guard_trg ON public.client_notifications;
DROP FUNCTION IF EXISTS public.client_notifications_guard();

DROP VIEW IF EXISTS public.notifiable_clients;
DROP VIEW IF EXISTS public.emailable_clients;

DROP INDEX IF EXISTS public.idx_cn_unread;
DROP INDEX IF EXISTS public.idx_cn_batch;

ALTER TABLE public.client_notifications
  DROP CONSTRAINT IF EXISTS cn_action_kind_check,
  DROP CONSTRAINT IF EXISTS cn_action_value_check,
  DROP CONSTRAINT IF EXISTS cn_action_pairing_check,
  DROP CONSTRAINT IF EXISTS cn_length_check;

-- Restore the pre-migration grants. NOT a REVOKE: the table carried Supabase's
-- blanket defaults before this migration (§3.3) and a down path that leaves it
-- narrower than it found it is not a down path.
GRANT ALL ON public.client_notifications TO anon, authenticated;

-- ── The destructive part. Read before running. ─────────────────────────────
-- Dropping these columns DISCARDS every interest answer ever recorded, which is
-- the only copy of the data case B exists to gather. There is no restore.
--
-- SAVE IT FIRST:
--   CREATE TABLE public.client_notifications_action_backup AS
--     SELECT id, client_id, batch_id, segment, action_kind, action_value,
--            action_taken_at, action_by, read_at
--     FROM public.client_notifications
--     WHERE action_kind IS NOT NULL OR read_at IS NOT NULL;
--
-- Then:
ALTER TABLE public.client_notifications
  DROP COLUMN IF EXISTS banner,
  DROP COLUMN IF EXISTS read_at,
  DROP COLUMN IF EXISTS batch_id,
  DROP COLUMN IF EXISTS segment,
  DROP COLUMN IF EXISTS action_kind,
  DROP COLUMN IF EXISTS action_label,
  DROP COLUMN IF EXISTS action_value,
  DROP COLUMN IF EXISTS action_taken_at,
  DROP COLUMN IF EXISTS action_by;
```

**Partial DOWN, which is the one that should usually be run.** If the problem is
the trigger or the views, drop only those. The columns are additive and inert;
leaving them costs nothing and dropping them is the only irreversible act in this
migration. **Broadcast rows themselves are never deleted by any down path.** If a
broadcast must be withdrawn, `UPDATE ... SET dismissed_at = now() WHERE batch_id
= '<uuid>'` as the service role. Nothing here ever deletes a customer
notification.

### 13.4 Rollback of each code step

| Step | Rollback |
|---|---|
| 1, migration | §13.3. Prefer the partial form. |
| 2, `_client_notify.js` | `git revert` the commit. The two senders return to their inline form; both are behaviour-identical, so no data is stranded. |
| 3, `ClientBell` | `git revert`. Rows with `banner = false` become invisible rather than lost, and step 1's columns remain, so a re-ship restores the view. |
| 4, broadcast function | `git revert`, then dismiss any rows it wrote by `batch_id` per §13.3. |

---

## 14. Acceptance criteria

Each is a command a reviewer runs. Per `AUTONOMY.md` §1, an item is not done
until a command says so.

**AC-1. `sendBrandedEmail` has exactly three importers, and no new one appears.**
```bash
cd brandgeo-dashboard && \
  grep -rl "sendBrandedEmail" netlify/functions/ | sort | \
  diff - <(printf 'netlify/functions/_admin_notify.js\nnetlify/functions/_client_notify.js\nnetlify/functions/_email.js\n')
```
Exit 0. This is the mirror rule. `set-client-plan.js` and
`expire-plan-grants.js` must have dropped out of the list.

**AC-2. The customer-readable table has exactly two policies, and neither is new.**
```sql
SELECT count(*) FROM pg_policies
WHERE schemaname='public' AND tablename='client_notifications';
-- EXPECT 2
SELECT policyname, cmd, qual, with_check FROM pg_policies
WHERE schemaname='public' AND tablename='client_notifications' ORDER BY cmd;
-- EXPECT client_notifications_select SELECT (is_admin() OR (client_id = get_my_client_id())) null
-- EXPECT client_notifications_update UPDATE (same qual) (same with_check)
```
A third row means someone added a permissive policy. That is the §6.4 step 7
failure and it fails this criterion regardless of what the policy says.

**AC-3. An over-long mirror is refused by the database.**
```sql
BEGIN;
  INSERT INTO public.client_notifications (client_id, kind, title, body)
  VALUES (26, 'product_update', repeat('x', 61), 'ok');
  -- EXPECT: new row violates check constraint "cn_length_check"
ROLLBACK;
```

**AC-4. A customer cannot rewrite their own notification, and cannot un-read it.**
Run as a real viewer, rolled back, in the shape used by
`db/supabase-prompts-own-client-writes-migration.sql:50` to `:55`.
```sql
BEGIN;
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"<VIEWER_UUID_FOR_CLIENT_26>","role":"authenticated"}';
  -- T1 SELECT own rows                          -> EXPECT >= 1
  -- T2 SELECT WHERE client_id = 1               -> EXPECT 0 rows
  -- T3 UPDATE own row SET title='hax'           -> EXPECT exception from the guard trigger
  -- T4 UPDATE own row SET action_value='interested' -> EXPECT 1, and
  --    action_taken_at NOT NULL, action_by = the viewer uuid
  -- T5 UPDATE own row SET action_by='<other uuid>' AND action_value='not_now'
  --                                             -> EXPECT action_by still the viewer
  -- T6 UPDATE own row SET read_at=NULL after it was read -> EXPECT read_at unchanged
  -- T7 UPDATE another client's row              -> EXPECT UPDATE 0
  -- T8 DELETE own row                           -> EXPECT DELETE 0
  -- T9 INSERT a row for own client              -> EXPECT policy violation
ROLLBACK;
```

**AC-5. The eligibility view excludes what §1.4 measured.**
```sql
SELECT count(*) FROM public.notifiable_clients;                       -- EXPECT 8
SELECT count(*) FROM public.notifiable_clients WHERE plan='free';     -- EXPECT 1
SELECT count(*) FROM public.notifiable_clients WHERE id IN (25);      -- EXPECT 0
SELECT count(*) FROM public.notifiable_clients
  WHERE category='research';                                          -- EXPECT 0
```
Counts are a snapshot of 2026-07-31. Re-measure before trusting them; what must
hold permanently is that client 25 and every research client are absent.

**AC-6. The guard trigger exempts the service role and only the service role.**
```sql
SELECT tgname, tgenabled FROM pg_trigger
WHERE tgrelid='public.client_notifications'::regclass AND NOT tgisinternal;
-- EXPECT exactly one row, client_notifications_guard_trg, tgenabled='O'
SELECT prosecdef FROM pg_proc
WHERE proname='client_notifications_guard';                            -- EXPECT true
```
Plus, in the same rolled-back block as AC-4, a service-role `UPDATE ... SET title`
that succeeds.

**AC-7. The views are unreachable with an anon or authenticated key.**
```sql
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND table_name IN ('notifiable_clients','emailable_clients')
  AND grantee IN ('anon','authenticated');
-- EXPECT 0 rows
SELECT grantee, string_agg(privilege_type,',') FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='client_notifications' AND grantee='anon'
GROUP BY grantee;
-- EXPECT 0 rows (anon revoked, §3.3)
```

**AC-8. No notification copy can disclose cost.**
```bash
cd brandgeo-dashboard && node -e "
const {notifyClient} = require('./netlify/functions/_client_notify');
notifyClient(null, {client_id:26, kind:'product_update',
  title:'Your run cost EUR 0.064', body:'x'})
  .then(r => process.exit(r.ok ? 1 : 0));
"
```
Exit 0, meaning the write was refused. Repeat for `€0.06`, `API spend` and
`margin`.

**AC-9. The existing banner is byte-identical after the migration.**
```sql
SELECT id, banner FROM public.client_notifications ORDER BY id;
-- EXPECT both pre-existing rows to have banner = true
SELECT column_default FROM information_schema.columns
WHERE table_name='client_notifications' AND column_name='banner';
-- EXPECT false
```
This is the §13.1 ordering trick. Both halves must hold, or the migration either
hid two live notices or armed every future one as a banner.

**AC-10. A dry-run broadcast names the recipients before anything is written.**
```bash
curl -s -X POST "$APP/.netlify/functions/broadcast-notification" \
  -H "Authorization: Bearer $ADMIN_JWT" -H 'Content-Type: application/json' \
  -d '{"segment":"free_plan","kind":"offer","title":"t","body":"b",
       "idempotency_key":"ac10","dry_run":true}' | jq '.targeted, .clients'
```
EXPECT `1` and a list containing client 26 and **not** client 25. Then assert
`SELECT count(*) FROM client_notifications WHERE segment='free_plan'` is still 0.

**AC-11. The measurement query returns.** After a real broadcast, §7.3 Q1 with
that `batch_id` returns one row with `targeted` equal to AC-10's `targeted`.

---

## 15. Handoff packets

Numbers are allocated by `bg-orchestrator` when each packet is written, never
reserved here. Referenced by from/to/slug.

### Packet, `bg-architect` to `bg-verify`, slug `client-notifications-rls`

**RUN THIS BEFORE ANY BUILD.** Auth and RLS review, per the standing guardrail.

- Read: this file, `db/supabase-admin-plan-grants-migration.sql`,
  `db/supabase-tickets-migration.sql`, `db/supabase-multitenant-migration.sql`,
  `CLAUDE.md` §6.4 step 7.
- Adjudicate: §3.1's ruling that no policy changes; §3.4's trigger as a
  substitute for column privileges, including whether the `current_setting('role')`
  exemption is sound under Supabase's connection pooling; §7.2's ruling that a
  client `UPDATE` is an acceptable way to record a value BrandGEO counts.
- Specifically try to refute: that a `SECURITY DEFINER` trigger can read
  `auth.uid()` correctly in the PostgREST request context, and that
  `current_setting('role', true)` returns `service_role` there rather than
  `postgres` or empty. **If it does not, §3.4 is wrong and the trigger must
  branch on `auth.role()` or on a session GUC instead.** This is the single
  most likely defect in this spec.
- Write: `docs/qa/client-notifications-rls.md`. Verdict PASS or PASS WITH
  FINDINGS or FAIL.

### Packet, `bg-architect` to `bg-backend`, slug `client-notifications-backend`

- `scope_write`: exactly the Lane 1 table in §12.
- Do: §13.1 UP as written, `_client_notify.js` per §4.2, the two sender
  refactors, `broadcast-notification.js` per §4.3 unless Constantin took §9.1.
- Do not: run any git command; fire a broadcast; touch anything in `src/`.
- Acceptance: AC-1 through AC-3, AC-5 through AC-10.

### Packet, `bg-architect` to `bg-app`, slug `client-notifications-ui`

- `scope_write`: exactly the Lane 2 table in §12.
- Do: §8 as written. Copy `AdminBell` structurally.
- Do not: write copy; change any policy; touch `netlify/functions/` or `db/`;
  invent a notification preferences screen.
- Acceptance: AC-9, plus a visual check that a `banner = false` row appears in
  the bell and nowhere else, and that a `banner = true` row appears in both.

### Packet, `bg-architect` to `bg-copy`, slug `radar-launch-notification`

- `scope_write`: `docs/copy/radar-launch-notification.md`.
- Bound by §10 in full, and by the length contract in §4.4. Blocked until Radar
  exists in `planConfig.ts`.

---

## 16. Decisions left to Constantin

1. **Build `broadcast-notification.js`, or take the §9.1 minimum and insert one
   row by hand?** The function is a full build lane to write one row today. The
   architecture recommends the minimum for the first broadcast and the function
   for the second.
2. **Does the Radar announcement also send an email, or is it dashboard-only?**
   Dashboard-only reaches the one free client who has logged in, costs nothing,
   and stays inside `AUTONOMY.md` §2. Email reaches them wherever they are and
   requires Constantin to fire it personally. The design supports both; the
   recommendation is dashboard-only first, then email only to those who have not
   read it after a week.
3. **Is the abandoned Slatehq account (client 25) kept or deleted?** The memory
   note left it "decision pending". The view excludes it either way, so this is
   not blocking, but every future segment count carries an unreachable row until
   it is settled.
4. **Should `expire-plan-grants.js` start emailing the customer?** Today it
   writes them a banner and emails only the admin (`:209` versus `:237`). A plan
   silently reverting to Free with no email to the customer is arguably the most
   important message this product sends. Out of scope here; named because this
   spec is the first document to put the two side by side.
5. **Per-user read state.** Client 1 already has two logins sharing one badge.
   Worth building when a second client does.
