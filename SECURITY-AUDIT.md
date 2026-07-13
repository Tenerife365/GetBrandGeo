# SECURITY-AUDIT.md — BrandGEO Immediate-Risk Security Audit

> **Session:** `Master-Security` (per CLAUDE.md §11) — first-pass, immediate-risk
> audit, prioritized by actual exploitability, not exhaustive coverage.
> **Date:** 2026-07-09 · **Auditor model:** Opus 4.8 (per hybrid-routing rule, §0)
> **Scope covered:** RLS coverage on every `client_id` table (re-verifying §6.4
> step 7's fix holds), Netlify-function auth + service-key exposure, rate-limit
> enforcement, secrets hygiene, admin-role-creation abuse (#108), CORS/origin
> whitelist integrity.
> **Method:** live Supabase inspection (project `duiyifepitvugyulobqm`) via
> `pg_policies` / `pg_class` / `pg_proc` + Supabase security advisors, plus a
> read of all 12 files in `brandgeo-dashboard/netlify/functions/` and the
> tracked-secrets state of the repo. **No code or DB changes were made** — this
> is findings-only, with exact remediation commands handed off per the
> execution-delegation rule (§0).

---

## 0. Executive summary

The multi-tenant isolation model is **fundamentally sound and the §6.4 leak is
still fixed** — RLS is enabled on every table, no `qual: true` permissive
policies remain, users cannot self-escalate their own role, every invocable
function authenticates, and the admin-only functions (#108) are correctly
gated. No secrets are committed. There is **no evidence of any exploitation**
(exactly one legitimate admin account exists).

**But there is one latent CRITICAL landmine** that must be fixed before the
self-serve signup path is ever repaired or re-enabled, and a handful of
medium/low hardening items. The single most important takeaway:

> **`signup-client.js` assigns `role: 'admin'` to self-serve signups, and the
> RLS model treats `role = 'admin'` as _global, cross-tenant_ access to every
> client's data. This is not exploitable _today_ only because the same function
> is broken (it inserts columns that don't exist in the `clients` table), so
> signups fail before the admin profile is ever written. The moment someone
> "fixes" signup to make it work, every new signup becomes a platform-wide
> admin who can read every client's data.**

Priority order: **fix F1 (signup admin-role) before touching signup at all** →
then F2 (signup abuse throttle) → then the DB hardening items (F3/F4) → then
low-priority cleanup.

---

## 0.4 📧 Follow-up bug — signup sent NO confirmation email (fixed 2026-07-13)

The first real signup created the account correctly but **no email ever
arrived**. Root cause, proven on live data (not guessed):

> **`auth.admin.createUser()` DOES NOT SEND ANY EMAIL.** It is a silent admin
> operation. `email_confirm: false` only marks the user *unconfirmed* — it does
> **not** trigger a confirmation email.

The original file asserted the opposite in a comment ("Supabase sends the
confirmation email automatically"), and that false assumption was carried
through the F1 rewrite without being verified. The live `auth.users` row proved
it: `confirmation_sent_at = NULL`, `invited_at = NULL`, **and no confirmation
token was ever generated** — so it wasn't a spam-folder or SMTP issue, the mail
was never sent and never would have been.

**Fix:** signup now uses **`inviteUserByEmail()`**, which *does* send — and is
already the pattern used by `onboard-client.js` **and** `stripe-webhook.js`,
with the branded, DKIM/SPF/DMARC-verified Resend template from #106. Signup was
the only provisioning path not using it, and the only one that didn't email.
Confirmed by contrast in the same table: the Onboard-wizard user has
`confirmation_sent_at` set; the signup user does not.

**Consequence (deliberate, chosen by Constantin):** the user no longer picks a
password on the signup form. They get the invite email → `/reset-password` →
set their own. So **no password ever transits this public endpoint** — strictly
better for an unauthenticated route. `Signup.tsx`'s password field is removed.

**Verified:** `node --check` passes, `npx tsc --noEmit` exits 0 (both on
Windows). `createUser` no longer appears anywhere in the function except in the
warning comments.

---

## 0.5 Remediation status (updated 2026-07-13)

**F1 and F2 are FIXED, DEPLOYED, and LIVE (2026-07-13).** Constantin chose the
"full repair" option: fix the security hole *and* make free signup actually
work. Built, committed, pushed; Netlify deploy confirmed **Published**; the
`signup_attempts` migration was run and verified live (RLS enabled, 0 policies
= deny-all, indexed) — so the throttle is backed and cannot fail open.

| Finding | Status |
|---|---|
| **F1** — signup grants global admin | ✅ **FIXED + LIVE** — `role: 'admin'` → `role: 'viewer'` |
| **F2** — no throttle on public signup | ✅ **FIXED + LIVE** — honeypot + per-IP daily cap (3/day) |
| *(new)* signup was never functional | ✅ **FIXED + LIVE** — both broken inserts corrected |
| *(new)* self-serve users can't add prompts | ✅ **FIXED + LIVE** — RLS + frontend deployed |
| F3 — `search_path` on RLS helpers | ⏳ open (SQL ready in §F3) |
| F4/F5/F7 | ⏳ open (low priority) |

**The critical cross-tenant landmine is closed.** No `role: 'admin'` assignment
exists anywhere outside `onboard-client.js`, which is gated behind
`requireAuth({ adminOnly: true })`. A self-serve signup can no longer obtain
global read access to every client's data.

**Worth doing once, now that signup actually works:** run a real end-to-end
signup and confirm the new account lands as `viewer` with its own `client_id`
(not `admin`):

```sql
select up.role, up.client_id, c.slug, c.plan, c.default_market_id
from user_profiles up join clients c on c.id = up.client_id
order by up.created_at desc limit 3;
-- Expect the newest row: role='viewer'. If it EVER says 'admin', stop and revert.
```

**What changed (3 files + 1 migration):**

1. **`netlify/functions/signup-client.js`** — rewritten.
   - `role: 'viewer'` (matches `stripe-webhook.js`, the paid self-serve path).
     A loud security header now sits at the top of the file explaining *why*
     `admin` must never be written here, so a future edit can't re-arm it.
   - **Both broken inserts fixed.** The audit found signup had *never* worked,
     and there were **two** schema bugs, not one: `clients` was written with
     `company_name`/`brand_domain`/`status` (real columns: `name`/`slug`/
     `brand_website`/`brand_aliases`/`plan`/`default_market_id`), and
     `user_profiles` was written with an **`email` column that does not exist**
     (real columns: `id`/`client_id`/`role`/`created_at`). Both corrected.
     `slug` is UNIQUE, so it now retries with a suffix on collision.
     `default_market_id: 'WW'` — never defaults to a country (§4.1 / #104).
   - **Abuse hardening (F2):** honeypot field + per-IP daily cap (3/day),
     reusing `_prospect_guard.js`'s existing `hashIp`/`normalizeDomain`/
     `isPlausibleDomain` helpers rather than a second, divergent guard. IP is
     stored only as `sha256(ip + pepper)`, never raw (GDPR minimisation).
   - **Reordered to kill the email-bomb vector:** validate → create `clients`
     row → *then* `createUser` (which is what actually sends the email). The
     old order emailed the address before a doomed signup had even been
     checked. Rollback unwinds in reverse.

2. **`src/pages/Signup.tsx`** — hidden honeypot input (`company_website`,
   off-screen, `tabIndex={-1}`, `aria-hidden`) + sends it in the POST body.

3. **`supabase-signup-attempts-migration.sql`** (new, repo root) — the
   `signup_attempts` table backing the throttle. RLS enabled, **zero policies =
   deny-all** (service_role only), indexed on `(ip_hash, created_at DESC)`.

**Verified:** `node --check signup-client.js` PASSES and `npx tsc --noEmit`
exits **0 errors** — both run on Windows (the sandbox bash mount was serving a
stale 104-line view of the real 250-line file, the documented
`brandgeo_bash_mount_staleness` issue; the Windows run is authoritative).
Confirmed by grep that **no `role: 'admin'` assignment remains anywhere**
outside `onboard-client.js`, which is correctly gated behind
`requireAuth({ adminOnly: true })`.

### ✅ RESOLVED 2026-07-13 — self-serve users can now manage their own prompts

**RLS is applied and live** (migration `prompts_own_client_writes`; source of
truth kept at `supabase-prompts-own-client-writes-migration.sql`). The
**frontend half is code-complete but needs a deploy** — see the handoff at the
end of this section.

`prompts` INSERT/UPDATE/DELETE are now `is_admin() OR client_id =
get_my_client_id()`, scoped to `authenticated`. **UPDATE carries both `USING`
and `WITH CHECK`** — `USING` alone would have let a viewer reassign
`client_id` on a row they legitimately own, i.e. *move a prompt into another
tenant*. That's the subtle hole this avoids.

**Verified by impersonating a real viewer's JWT against the live DB** (inside a
DO block that raised at the end, so nothing persisted — confirmed 0 leftover
rows):

| Test | Result |
|---|---|
| viewer INSERT for **own** client | ✅ ALLOWED |
| viewer INSERT for **another** client | ✅ BLOCKED |
| viewer **moves** own prompt to another tenant | ✅ BLOCKED |
| viewer DELETE another tenant's prompts | ✅ 0 rows |

**Frontend (`src/pages/Prompts.tsx`)** — the "AI Discover" and "Add prompt"
buttons were gated behind `isAdmin`, so fixing RLS alone would have changed
nothing visible. That gate is removed; cross-tenant safety is enforced in the
DB, not the UI. (Note the row-level edit/delete buttons were *never* gated —
viewers already saw buttons that would silently fail against the old RLS.)
`npx tsc --noEmit` exits 0.

**Trade-off, accepted deliberately:** Managed/done-for-you clients are also
`viewer`, so they can now edit their own prompts — including deleting ones
BrandGEO set up for them. Harmless security-wise (it's their own data), but
worth knowing.

**Requires deploy:** `npm run build` → commit `Prompts.tsx` +
`supabase-prompts-own-client-writes-migration.sql` → push → confirm Netlify
**Published**.

<details>
<summary>Original finding (kept for the record)</summary>

### 🟠 New finding surfaced by this fix — self-serve users cannot add prompts

Making signup work exposes the next problem: the `prompts` RLS write policies
are **admin-only** (`prompts_insert`/`update`/`delete` all require
`my_role() = 'admin'`). So a `viewer` — which is now *every* self-serve
account — **cannot create prompts for their own client.** A free signup
therefore lands on an empty dashboard with no way to fill it.

**This is not limited to free signup.** `stripe-webhook.js` also provisions
**paying** Essentials/Growth customers as `viewer`, so paying self-serve
customers have the same problem. It's a live product gap on the revenue path,
not just a free-tier one.

It is **not** a security hole (no cross-tenant exposure), so it was not fixed
here — the correct fix is a product decision. The cleanest minimal option,
which fixes free *and* paid self-serve without inventing a new role:

```sql
-- Let any user manage prompts for THEIR OWN client (admins keep global access).
-- Trade-off: Managed/done-for-you clients (also viewers) could then edit their
-- own prompts too. Harmless from a security standpoint — decide if it's wanted.
DROP POLICY IF EXISTS prompts_insert ON public.prompts;
DROP POLICY IF EXISTS prompts_update ON public.prompts;
DROP POLICY IF EXISTS prompts_delete ON public.prompts;

CREATE POLICY prompts_insert ON public.prompts FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR client_id = get_my_client_id());
CREATE POLICY prompts_update ON public.prompts FOR UPDATE TO authenticated
  USING (is_admin() OR client_id = get_my_client_id());
CREATE POLICY prompts_delete ON public.prompts FOR DELETE TO authenticated
  USING (is_admin() OR client_id = get_my_client_id());
```

The alternative is a third role (`owner` = own-client read-write, never
global), which is cleaner conceptually but touches `_auth.js`, the frontend
`isAdmin` logic, and `Prompts.tsx`'s viewer gating. **Not taken** — the
minimal own-client-writes fix above was chosen instead.

</details>

---

## 1. What was verified as CORRECT (no action needed)

These are the things that held up — recorded so a future session doesn't
re-chase them.

- **RLS enabled everywhere.** All 5 `public` tables (`ai_results`, `clients`,
  `competitors`, `prompts`, `user_profiles`) and all 4 `archive.*` legacy
  tables have `relrowsecurity = true`. The archive tables have **0 policies =
  deny-all** (only `service_role` reaches them) — the §5 #102 lockdown holds.
- **§6.4 step-7 leak is still fixed.** No permissive policy with `qual: true`
  exists on any table. Every policy is scoped to `admin-or-own-client`. The
  leaky `authenticated`/`qual:true` policies dropped during the restructuring
  have **not** reappeared.
- **Role self-escalation is blocked.** `user_profiles` has **only** SELECT
  policies (`id = auth.uid()`), no INSERT/UPDATE/DELETE. A signed-in user
  therefore **cannot** change their own `role` or `client_id` via the API.
  Profile rows are only ever written by `service_role` inside functions.
- **Every invocable function authenticates.** All 8 HTTP-invocable functions
  (`collect-prompt`, `collect-claude`, `collect-chatgpt`,
  `generate-recommendations`, `onboard-client`, `resend-invite`,
  `suggest-prompts`, and `signup-client`*) call `requireAuth` first — except
  `signup-client` (public by design) and `purge-old-results` (scheduled). See
  §2/§5 for those two.
- **#108 admin-role abuse is correctly mitigated.** `onboard-client.js` and
  `resend-invite.js` both call `requireAuth(event, { adminOnly: true })` at the
  very top. A non-admin cannot reach the `role: 'admin'` creation path — the
  request is rejected 403 before any body is parsed. This is the _intended_
  platform-admin creation path and it is properly guarded.
- **Collect functions enforce per-client ownership.** Although
  `collect-prompt/claude/chatgpt` call `requireAuth(event)` _without_ passing
  `clientId`, each one re-checks ownership after parsing the body:
  `if (role !== 'admin' && profile.client_id !== body.client_id) → 403`. So a
  viewer cannot trigger collection (or writes) against another tenant's
  `client_id`. Verified in all three files.
- **Service key is server-only; no secrets committed.** `SUPABASE_SERVICE_KEY`
  appears only via `process.env` inside `netlify/functions/*`, never in `src/`.
  The frontend uses only the anon key (`VITE_SUPABASE_ANON`, public by design).
  `git ls-files` shows **no** tracked `.env`, `credentials.json`, `token.json`,
  `.pem`, or `.key` files; `.gitignore` covers `.env` / `credentials.json` /
  `token.json`, dashboard `.gitignore` covers `.env*.local`. A `git grep` for
  hardcoded `sk-…` / `service_role` / JWT patterns in `src/` and `netlify/`
  returned nothing.

---

## 2. Findings by severity

### 🔴 F1 — CRITICAL (latent): self-serve signup grants global cross-tenant admin

**Where:** `brandgeo-dashboard/netlify/functions/signup-client.js`, Step 3.

```js
await supabase.from('user_profiles').insert({
  id: userId,
  client_id: clientData.id,
  role: 'admin',          // ← every self-serve signup becomes role='admin'
  email: ...,
})
```

**Why it's critical:** the RLS policies define admin as *global*:

```
ai_results_select  →  (my_role() = 'admin') OR (client_id = my_client_id())
clients_select     →  (my_role() = 'admin') OR (id = my_client_id())
prompts_select     →  (my_role() = 'admin') OR (client_id = my_client_id())
competitors_*      →  (my_role() = 'admin') OR (client_id = my_client_id())
```

`my_role()` just reads `user_profiles.role` for `auth.uid()`. So **any** user
with `role='admin'` — including a stranger who signs up from the public form —
can read (and for prompts/competitors, write/delete) **every other client's
data**. The signup code conflates "admin of my own account" with "platform
admin," but the RLS only understands the latter.

**Why it isn't exploitable right now (the only thing saving you):**
`signup-client.js` Step 2 inserts into `clients` using columns that **do not
exist** in the live table — it writes `company_name`, `brand_domain`,
`status`, but the real columns are `name`, `brand_website`, `plan`,
`brand_aliases`, … (no `company_name`/`brand_domain`/`status`). That insert
fails, the function rolls back (deletes the auth user), and **never reaches the
`role:'admin'` write in Step 3.** Confirmed against the live schema. Confirmed
against live data: exactly **1 admin** exists (Constantin's real account,
client_id 1, created 2026-07-02) and **4 viewers** — no stray self-serve admin
profiles. So this has never fired.

**The trap:** the obvious next task — "self-serve signup is broken, fix the
column names so it works" — would silently arm this. Whoever does that must
**not** ship it with `role:'admin'`.

**Remediation (do both; do NOT re-enable signup until both are done):**

1. **Change the signup role.** In `signup-client.js` Step 3, set
   `role: 'viewer'` (an account owner should be a viewer of their own client
   under the current model), and fix the `clients` insert to use real columns
   (`name`, `brand_website`, `plan`, …) if/when signup is repaired.

2. **Decide the admin model deliberately.** "Account owner" and "platform
   operator" should not be the same role. Two clean options:
   - *Simplest:* keep `admin` = platform-only (created solely via
     `onboard-client.js`, admin-gated), and account owners stay `viewer`. If
     viewers need to manage their own prompts, add per-client
     INSERT/UPDATE/DELETE policies scoped to `client_id = my_client_id()`
     (today prompts writes are admin-only).
   - *More flexible:* introduce a third role (e.g. `owner`) that is
     own-client-read-write but **not** global, and reserve `admin` for
     platform staff. Requires updating the RLS `qual`s to
     `is_admin() OR client_id = my_client_id()` consistently and never letting
     signup mint `admin`.

**Interim safety:** confirm the self-serve signup UI is not reachable/linked in
production right now (it's non-functional anyway), and add a comment/guard in
`signup-client.js` so a future fix can't accidentally ship `role:'admin'`.

---

### 🟠 F2 — MEDIUM: public signup endpoint has no throttle (auth-user / email abuse)

**Where:** `signup-client.js` — no `requireAuth`, no rate limit, no captcha.

Even though the client insert fails, **Step 1 (`auth.admin.createUser`) runs
first and succeeds** before the rollback. An attacker scripting this endpoint
can:
- Burn Supabase Auth user quota (rapid create/rollback churn), and
- **Email-bomb a victim address** — `createUser` with `email_confirm:false`
  triggers a Supabase confirmation email to whatever address is posted, with no
  rate limit and no proof the requester controls it.

The `_auth.js` 150-rows/hr limit does **not** apply here (it's keyed on
`ai_results`, and this function doesn't use `requireAuth` at all).

**Remediation:** before re-enabling signup, add (a) a captcha (Supabase has
built-in hCaptcha/Turnstile support for the auth endpoints) or an IP-based
rate limit, and (b) validate/normalize input before calling `createUser` so a
failing signup doesn't send an email at all. Also enable Supabase's built-in
CAPTCHA protection under Auth settings.

---

### 🟠 F3 — MEDIUM: `SECURITY DEFINER` RLS-helper functions have mutable `search_path`

**Where:** `public.my_role`, `public.my_client_id`, `public.is_admin`,
`public.get_my_client_id` — all `SECURITY DEFINER`, all with `proconfig = null`
(no pinned `search_path`). Flagged by Supabase's own advisor
(`function_search_path_mutable`, WARN).

These four functions *are* the trust anchor for every RLS policy. A
`SECURITY DEFINER` function with an unpinned `search_path` is the classic
Postgres privilege-escalation vector (object-name hijacking via a shadowing
schema). Exploitability here is low (creating objects in `public` is
restricted on Supabase), but because these functions gate all tenant
isolation, they should be hardened.

**Remediation (hand-run in Supabase SQL Editor):**

```sql
ALTER FUNCTION public.my_role()          SET search_path = '';
ALTER FUNCTION public.my_client_id()     SET search_path = '';
ALTER FUNCTION public.is_admin()         SET search_path = '';
ALTER FUNCTION public.get_my_client_id() SET search_path = '';
-- functions already fully-qualify public.user_profiles, so '' is safe.
```

(The same advisor also lists these as "anon/authenticated can execute via
`/rpc/…`". That's expected — RLS calls them internally — and harmless since
they only ever read the *caller's own* profile via `auth.uid()`. No action
needed on the RPC-executable warnings beyond the `search_path` pin above.)

---

### 🟡 F4 — LOW: duplicate RLS policies + two parallel helper-function families

**Where:** `ai_results` and `user_profiles` each carry **two** SELECT policies
that mean the same thing, backed by **two** parallel helper families:
- `ai_results_client_read` (uses `get_my_client_id()` / `is_admin()`, role
  `authenticated`) **and** `ai_results_select` (uses `my_client_id()` /
  `my_role()`, role `public`).
- `user_profiles`: `profiles_read_own` **and** `user_profiles_select_own`
  (identical `id = auth.uid()`).

Both copies are correctly scoped, so this is **not a hole today** — but it's
exactly the kind of redundancy that *caused* the §6.4 leak (two policy sets,
one edited, one forgotten). Drift risk.

**Remediation (low priority, cleanup):** consolidate to one policy per
action and one helper family (`is_admin()`/`get_my_client_id()` is the clearer
pair). Drop the redundant `*_select` duplicates + the `my_role`/`my_client_id`
functions after confirming nothing else references them. Verify with
`pg_policies` afterward. Do this as its own small scoped task, not in a rush.

---

### 🟡 F5 — LOW: `purge-old-results.js` is unauthenticated

**Where:** `purge-old-results.js` — no `requireAuth`. It's a scheduled
(cron, 03:00 UTC) cleanup that deletes `ai_results` older than 24 months.

If Netlify still exposes it at `/.netlify/functions/purge-old-results`, anyone
who knows the path can invoke it. Harm is bounded (it only deletes rows already
past the 24-month retention line and returns no data), so this is low — but
it's an unauthenticated mutation endpoint.

**Remediation:** confirm it's configured as schedule-only in `netlify.toml`
(scheduled functions aren't meant to be publicly hit), or add a shared-secret
header check (`if (event.headers['x-purge-secret'] !== process.env.PURGE_SECRET)
return 401`). Low priority.

---

### 🟡 F6 — LOW / informational: origin check allows empty `Origin`

**Where:** `_auth.js` §2 — a request with **no** `Origin` header bypasses the
origin whitelist (documented in-code as intentional, to not break server-side
callers). A valid JWT is still required, so this is defense-in-depth only, not
a hole. Non-browser callers (curl/scripts) with a stolen/valid token skip the
origin gate — but they'd need a valid token regardless. Acceptable; noted so
it's a conscious choice, not a surprise. No action required.

---

### 🟡 F7 — LOW: Supabase Auth hardening toggles off

- **Leaked-password protection is disabled** (advisor `auth_leaked_password_
  protection`, WARN) — enable the HaveIBeenPwned check in Supabase → Auth →
  Passwords.
- `signup-client.js` enforces only `password.length >= 8`, no complexity.

Low priority, quick wins in the Supabase dashboard.

---

## 3. Non-issues confirmed (so they aren't re-flagged)

- `archive.*` tables showing "RLS enabled, no policy" (advisor INFO) — that's
  the **intended** deny-all lockdown, correct as-is.
- `relforcerowsecurity = false` on all tables — table-*owner* bypasses RLS, but
  the API never connects as the table owner (only `anon`/`authenticated`/
  `service_role`), so this is informational, not exploitable.
- Anon/authenticated being able to `EXECUTE` the RLS helper functions via
  `/rpc/…` — expected and harmless (they only read the caller's own profile).

---

## 4. Prioritized remediation checklist

| # | Severity | Action | Owner / where |
|---|----------|--------|---------------|
| F1 | 🔴 Critical (latent) | Do **not** ship a signup fix with `role:'admin'`; change to `viewer` + decide admin model; guard against regression | `signup-client.js` + RLS decision |
| F2 | 🟠 Medium | Add captcha / rate-limit to signup; validate before `createUser` | `signup-client.js` + Supabase Auth settings |
| F3 | 🟠 Medium | Pin `search_path=''` on the 4 SECURITY DEFINER helpers (SQL in §F3) | Supabase SQL Editor |
| F4 | 🟡 Low | Consolidate duplicate RLS policies + helper families | Supabase SQL (own scoped task) |
| F5 | 🟡 Low | Lock down / secret-gate `purge-old-results` | `netlify.toml` / function |
| F7 | 🟡 Low | Enable leaked-password protection; consider password complexity | Supabase Auth settings |
| F6 | 🟡 Info | Empty-Origin pass-through — conscious accept, no action | — |

**Nothing here requires an emergency hotfix** (F1 is latent behind an
unrelated bug), but **F1 must be resolved before signup is repaired/enabled**,
and F3 is a cheap, high-value DB hardening you can run in five minutes.

---

## 5. Coordination / handoff notes

- All remediation is handed off as exact SQL/steps per the execution-delegation
  rule (§0) — nothing was changed live this session.
- **F1 and F4 overlap the RLS model** — if Master-GTM/Master-Billing add a
  self-serve checkout that provisions accounts, that provisioning path inherits
  F1's risk. Whoever builds real self-serve account creation must use the
  `viewer`/`owner` role decision from F1, never `admin`.
- Per §11.3, once `Master-Billing`'s Stripe work exists, payment/customer data
  should get its own follow-up security pass — out of scope here (no billing
  code exists in the repo yet; confirmed via grep in the GTM/Billing notes).
- Files inspected: all of `brandgeo-dashboard/netlify/functions/` +
  `_auth.js`; live Supabase project `duiyifepitvugyulobqm` (pg_policies,
  pg_class, pg_proc, advisors). CLAUDE.md stays uncommitted (§4.10); this doc
  is a new repo-root file — Constantin's call whether to commit it, same as the
  other `Master-*.md` strategy docs.
