# Admin plan management, trials/bonuses & notifications

> Opened 2026-07-21. Admin flexibility on client accounts: change a client's
> plan/tier from the dashboard, grant one-off trials/comps (no fee) for a period
> with a congratulatory notification, auto-expire grants back to Free, and (Pass 2)
> an admin notification bell + email for new signups and account changes.

## Confirmed decisions (founder, 2026-07-21)
1. **Trial/comp expiry:** auto-downgrade to Free when the period ends, log it, and
   alert the admin (most scalable — no manual cleanup as users grow).
2. **Client notification channel:** email **and** in-dashboard banner.
3. **Sequencing:** Pass 1 = the actions (plan management + grants + client emails +
   auto-expiry + audit log); **Pass 2 = the admin notification bell + new-signup /
   account-change alerts** (not built yet).

## Status — Pass 1 BUILT + verified (2026-07-21), NOT yet deployed
`tsc --noEmit` clean, `npm run build` passes, `node --check` clean on all 4 new
functions. Needs the migration applied + a commit/push to go live. The frontend
degrades gracefully if deployed before the migration (CLIENT_SELECT has a fallback;
ClientBanner + the audit-trail read are wrapped in try/catch), but `set-client-plan`
writes the new columns, so **apply the migration first.**

### Files (all under `brandgeo-dashboard/` except the migration)
**DB**
- `supabase-admin-plan-grants-migration.sql` (repo root, NEW) — adds `clients.plan_source`,
  `clients.plan_grant_until`, `clients.plan_grant_note`; creates `client_events`
  (append-only audit log, admin-SELECT via RLS, service-role-write) and
  `client_notifications` (client-facing banners; owning client + admins SELECT, client
  can UPDATE only to dismiss its own; service-role insert). **NOT yet applied to
  `duiyifepitvugyulobqm`.** Safe to re-run.

**Netlify functions**
- `_plans.js` (NEW) — CJS mirror of `planConfig.ts` (PLAN_ORDER, PLAN_LABELS,
  PLAN_ENGINES, live-engine set, per-plan blurb, `planUnlocks()`). Hand-synced, same
  tradeoff as `_cost.js`/`_score.js`. **Update together with planConfig.ts.**
- `_email.js` (NEW) — shared Resend wrapper with a branded HTML shell (violet header,
  BrandGEO wordmark, optional bullets + CTA button). `sendBrandedEmail(...)` fails soft
  (missing `RESEND_API_KEY` → `{skipped:true}`, never throws). Sender
  `BrandGEO <noreply@mail.getbrandgeo.com>`. First shared email helper — the older
  functions still inline their own Resend fetch; migrate them to this opportunistically.
- `set-client-plan.js` (NEW, admin-only) — `POST {client_id, plan, grant_type:
  manual|trial|comp, period_days?|grant_until?, note?, notify?, message?}`. Validates
  the plan server-side, updates `clients` (service key), writes a `client_events` row,
  and when `notify` (default true) inserts a `client_notifications` banner **and** emails
  the client's login address(es) (resolved via `user_profiles` → `auth.admin.getUserById`).
  Warns if the client has a live Stripe subscription (a webhook may later overwrite a
  manual change). `netlify.toml` timeout=26.
- `expire-plan-grants.js` (NEW, scheduled `0 6 * * *`) — reverts any `trial`/`comp`
  whose `plan_grant_until` has passed to Free, logs `trial_expired`, drops a client
  banner, and emails the admin a summary (`ADMIN_ALERT_EMAIL` env, default
  `constantin@getbrandgeo.com`). Only touches grants; paid/stripe plans are never
  auto-changed.

**Frontend**
- `src/lib/clientContext.tsx` — `Client` gains `plan_source`/`plan_grant_until`/
  `plan_grant_note`; added to `CLIENT_SELECT` + both fallback objects; new
  `patchClient(clientId, patch)` context method so a plan change updates engine gating
  + the profile locally without a refetch.
- `src/pages/Account.tsx` — admin-only "Manage plan" card: plan picker, type
  (Assign / Free trial / Complimentary), period (days) with a live end-date preview,
  internal note, "Notify the client" toggle + optional extra message line, and a
  "Recent changes" audit trail read from `client_events`. Calls `set-client-plan` then
  `patchClient`.
- `src/components/ClientBanner.tsx` (NEW) + wired into `Layout.tsx` above the routed
  page — dismissible in-dashboard banners for the active client, read from
  `client_notifications` via RLS; dismiss sets `dismissed_at`.
- `src/types/index.ts` — `ClientNotification` type.

### `clients.plan_source` values
`stripe` (paid self-serve) · `manual` (admin-assigned, no expiry) · `trial` / `comp`
(time-limited grant, auto-reverts) · `signup` (initial free default) · `expired` (a
grant that lapsed) · null (legacy).

## Founder handoff — deploy Pass 1
1. **Apply the migration** (Supabase SQL editor, `duiyifepitvugyulobqm`): run all of
   `supabase-admin-plan-grants-migration.sql`.
2. **Commit + push** (targeted, to avoid sweeping in the unrelated uncommitted web-page
   changes):
   ```
   git add brandgeo-dashboard/netlify/functions/_plans.js brandgeo-dashboard/netlify/functions/_email.js brandgeo-dashboard/netlify/functions/set-client-plan.js brandgeo-dashboard/netlify/functions/expire-plan-grants.js brandgeo-dashboard/netlify.toml brandgeo-dashboard/src/lib/clientContext.tsx brandgeo-dashboard/src/pages/Account.tsx brandgeo-dashboard/src/components/ClientBanner.tsx brandgeo-dashboard/src/components/Layout.tsx brandgeo-dashboard/src/types/index.ts supabase-admin-plan-grants-migration.sql
   git commit -m "Admin plan management: change plan, grant trials/comps, client notifications, auto-expiry"
   git push
   ```
   After deploy, `POST` unauthenticated to `.../set-client-plan` → expect **401**.
3. **Env (optional):** `ADMIN_ALERT_EMAIL` (defaults to `constantin@getbrandgeo.com`)
   for the expiry summary. `RESEND_API_KEY` already set.
4. **Test the Talentwelove bonus:** open `/account` as admin, switch to Talentwelove →
   Manage plan → plan **Managed**, type **Complimentary**, period e.g. **30** days,
   note "Managed launch bonus", keep Notify on → **Grant complimentary**. Verify: the
   card shows "Reverts to Free …", Talentwelove's email arrives, and logging in as that
   client shows the congrats banner. Engine gating jumps to the 5 live engines
   immediately.

## Status — Pass 2 BUILT + verified (2026-07-21), NOT yet deployed
Admin notification bell + proactive new-signup / subscription / trial-expiry alerts,
plus client-email visibility in the Manage-plan card. `tsc`/`build`/`node --check` clean.
**Needs its own migration applied + the same commit/push.**

### Files (new + edited)
**DB**
- `supabase-admin-notifications-migration.sql` (repo root, NEW) — `admin_notifications`
  table (`type, client_id, title, body, meta, created_at, read_at`), RLS: admins SELECT +
  UPDATE (mark read), service-role insert. Shared `read_at` (small admin team). **Apply
  before deploying.**

**Netlify functions**
- `_admin_notify.js` (NEW) — `recordAdminEvent(supabase, {type, client_id, title, body,
  meta, email})`: inserts a feed row and (default) emails `ADMIN_ALERT_EMAIL`
  (`constantin@getbrandgeo.com`). Best-effort, never throws.
- `client-users.js` (NEW, admin-only) — `POST {client_id}` → the client's login users
  (`email, role, last_sign_in_at, confirmed`) via `user_profiles` → `auth.admin`. Backs
  the email-visibility line. `netlify.toml` timeout=26.
- `signup-client.js` — on a successful free signup, `recordAdminEvent('new_signup')`
  (bell + admin email). (Previously only `console.log`.)
- `stripe-webhook.js` — `subscription_new` (checkout: new client, linked client, existing
  client), `subscription_changed` (subscription.updated), `subscription_canceled`
  (subscription.deleted). Bell + admin email each.
- `expire-plan-grants.js` — also posts a `trial_expired` bell row per client (email:false;
  the job still sends its own single summary email).

**Frontend**
- `src/components/AdminBell.tsx` (NEW) + wired into `Layout.tsx` sidebar header (admin-only)
  — Bell + unread badge, dropdown feed, mark-all-read, 90s poll, click-through to the
  related client's `/account`. Fixed-positioned dropdown so it never clips the sidebar.
  (Known v1 limit: on mobile the badge shows only when the drawer is open — desktop is the
  admin's environment.)
- `src/pages/Account.tsx` — Manage-plan card now shows **"Users on this account
  (notifications go here)"**: each login email + role + confirmed + last sign-in, read via
  `client-users`. This is what surfaced that Talentwelove's on-file address was the test
  `…@gmail.com` from the signup test — a wrong/test email is now visible without opening
  Supabase.

### Founder handoff — deploy Pass 2
1. **Apply the migration** (`supabase-admin-notifications-migration.sql`) in the Supabase
   SQL editor, project `duiyifepitvugyulobqm`.
2. **Commit + push** (targeted):
   ```
   git add brandgeo-dashboard/netlify/functions/_admin_notify.js brandgeo-dashboard/netlify/functions/client-users.js brandgeo-dashboard/netlify/functions/signup-client.js brandgeo-dashboard/netlify/functions/stripe-webhook.js brandgeo-dashboard/netlify/functions/expire-plan-grants.js brandgeo-dashboard/netlify.toml brandgeo-dashboard/src/components/AdminBell.tsx brandgeo-dashboard/src/components/Layout.tsx brandgeo-dashboard/src/pages/Account.tsx supabase-admin-notifications-migration.sql
   git commit -m "Admin notification bell + new-signup/subscription alerts + client-email visibility"
   git push
   ```
   After deploy, `POST` unauthenticated to `.../client-users` → expect **401**.
3. **Test:** run a throwaway signup at `app.getbrandgeo.com/signup` → the bell (top of the
   sidebar) should show a "New signup" within ~90s (or on refresh), and an alert email
   should reach `constantin@getbrandgeo.com`. Open `/account` on any client to see its
   "Users on this account" line.

## Delete account — BUILT + verified (2026-07-21), NOT yet deployed. No migration.
The schema does NOT cascade cleanly (deleting an auth user leaves the client; deleting a
client is blocked by the no-cascade FKs from `ai_results`/`prompts`/`competitors`/
`user_profiles`). So one admin function owns the correct order.
- **`delete-client.js`** (NEW, admin-only) — `POST {client_id, confirm}` where `confirm`
  must equal the client's `slug` (typed-confirmation guard). **Refuses if any attached user
  is an admin** (can't nuke an administrator). Order: delete each attached auth user
  (`auth.admin.deleteUser`, cascades their profile) → delete leftover `user_profiles` →
  delete no-cascade children (`ai_results`, `prompts`, `competitors`, `user_clients`) →
  delete the `clients` row (cascades `social_*`/`recommendations`/`client_events`/
  `client_notifications`). Logs an `account_deleted` row to the admin feed (best-effort).
  `netlify.toml` timeout=26.
- **`Account.tsx`** — a red "Delete account" danger-zone card (admin-only) at the bottom:
  typed slug confirmation enables the Delete button; on success it reloads so the app
  re-inits onto a remaining client. No context change (reload keeps it collision-free).
- **Handoff:** just commit + push (no migration). After deploy, `POST` unauthenticated to
  `.../delete-client` → expect **401**.

## Feature gating / upgrade-locked state — BUILT + verified (2026-07-21). Frontend-only.
Reusable framework in `planConfig.ts`, applied to AI Social (**Growth and up** — Constantin's
call; Free/Essentials see it locked).
- **`planConfig.ts`** — new `FeatureId` type, `FEATURE_MIN_PLAN` ({ ai_social: 'growth' }),
  `FEATURE_META` (locked-screen copy), and `planRank` / `hasFeature(plan, feature)` /
  `featureUnlockPlan(feature)` helpers. Add a feature id + min plan to gate the next one.
- **`FeatureLocked.tsx`** (NEW) — the reusable locked/upgrade screen (lock icon, feature
  blurb, "unlocks on the X plan", "See plans" → `/account`).
- **`Social.tsx`** — early-returns `<FeatureLocked feature="ai_social" />` when the active
  client's plan is below Growth. **Admins always keep access** (they set up publishing for
  any client). Guard placed after all hooks, so hook order is stable.
- **`Layout.tsx`** — the AI Social nav item shows a small lock (right-aligned) for
  below-Growth clients and still routes to the upgrade screen (good for conversion).
- No migration, no new functions. Commit + push only.

## Still pending
- Optional: per-admin read state (bell is currently shared), realtime feed instead of the
  90s poll, a mobile-visible bell badge, and a "resend last notification" control.
