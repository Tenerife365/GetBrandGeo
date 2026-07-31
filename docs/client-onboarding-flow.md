# Client Onboarding Flow — As Implemented

> **Task:** #73 (see `CLAUDE.md` §5)
> **Status:** documents the flow exactly as it exists in code today (2026-07-08). This is a
> description of current behavior, not a proposal — see "What's NOT automated yet" and "Known
> limitations" below for the gaps.
> **Source files read:**
> - `brandgeo-dashboard/src/pages/Onboard.tsx` — the wizard UI
> - `brandgeo-dashboard/netlify/functions/onboard-client.js` — the backend function
> - `brandgeo-dashboard/src/lib/collectionContext.tsx` — the *correct* 3-engine collection
>   pattern used everywhere else in the app, for contrast with Onboard's own hand-rolled loop
> - `brandgeo-dashboard/src/lib/planConfig.ts` — plan/engine gating
> - `brandgeo-dashboard/src/pages/Prompts.tsx` — where prompts are actually created (confirmed
>   onboarding does not create any)
> - `CLAUDE.md` §1 (architecture) and §3 (schema)

---

## 1. Overview

Onboarding is a single admin-only page, `/onboard` (`Onboard.tsx`), that walks through a
5-step wizard, then hands off to one backend Netlify function
(`netlify/functions/onboard-client.js`) that creates the client's database rows and login in a
single atomic call. After that call succeeds, the wizard itself — not the backend function —
runs an initial collection pass by looping over the client's prompts and calling
`collect-prompt.js` once per prompt.

**What the admin does:** fills in company/brand/competitor info across 3 short forms, sets a
login email + password for the client, clicks "Create Client," and watches a progress bar
while the wizard fires collection calls.

**What's collected as input:** company name, URL slug, website domain, brand name aliases
(free-text tags), known competitor names (free-text tags), and a client login
email/password.

**What happens server-side:** `onboard-client.js` inserts one `clients` row, creates one
Supabase Auth user via `auth.admin.createUser`, and links them with one `user_profiles` row
(`role: 'viewer'`) — with rollback on partial failure (see step 4 below).

**What the new client sees:** nothing yet — no welcome email, no in-app onboarding, no prompts
are created for them by this flow. They can log in with the email/password the admin set, but
until prompts exist (added separately, later, via `/prompts`) there is nothing for the
collection engines to run against — see §4 for why this matters.

---

## 2. Step-by-step walkthrough

All state lives in local `useState` inside `Onboard.tsx` (`step: 1 | 2 | 3 | 4 | 5`). Access
is gated by `isAdmin` from `useClient()` — non-admins see "Access restricted to admins."

### Step 1 — Company (`step === 1`)
Fields: `name` (required), `slug` (required, auto-derived from `name` via `autoSlug()` —
lowercases and replaces non-alphanumerics with `-`, editable), `website` (optional, plain
domain string, e.g. `bucateperoate.ro`).

### Step 2 — Brand Aliases (`step === 2`)
Free-text tag input (`aliases: string[]`). Each entry is lowercased and trimmed via
`addAlias()`. These become `clients.brand_aliases` (a `text[]` column) — the values the
response-analysis regex in `analyseResponse()` (see `CLAUDE.md` §1.4) matches against AI
responses to detect brand mentions. No validation beyond dedupe (`!aliases.includes(v)`) — no
minimum count is enforced, so an admin can advance with zero aliases.

### Step 3 — Known Competitors (`step === 3`)
Same free-text tag pattern (`competitors: string[]`) via `addCompetitor()`. Becomes
`clients.known_competitors` — feeds `scanForKnownCompetitors()` in the shared analysis logic.
Explicitly optional (placeholder text says "optional").

### Step 4 — Client Login (`step === 4`)
Fields: `email` (required), `password` (required, `password.length >= 8` enforced client-side
before the button enables — no complexity rules beyond length). Shows a read-only summary of
everything collected in steps 1–3. On submit, `handleCreate()` fires:

```
POST /.netlify/functions/onboard-client
Authorization: Bearer <admin's current session token>
{
  name, slug,
  brand_website: website,
  brand_aliases: aliases,
  known_competitors: competitors,
  contact_email: email,
  contact_password: password,
}
```

**Backend (`onboard-client.js`):**
1. `requireAuth(event, { adminOnly: true })` — rejects unless the caller is an authenticated
   admin (per `CLAUDE.md` §4.6/§1.6 auth pattern).
2. Validates `name`, `slug`, `contact_email`, `contact_password` are all present (400 if not).
3. **Insert `clients` row** — `{ name, slug, brand_website, brand_aliases, known_competitors }`.
   Note: no `plan` field is passed in the insert, so the new client relies entirely on
   whatever default the `clients.plan` column has at the database level (not visible from this
   file — the wizard has no plan-selection step at all, see §4). No `default_market_id` is
   set either.
4. **Create Supabase Auth user** — `supabase.auth.admin.createUser({ email, password,
   email_confirm: true })`. Email is confirmed immediately, no verification email flow.
   On failure: rolls back the `clients` row (`DELETE ... WHERE id = client.id`).
5. **Insert `user_profiles` row** — `{ id: authData.user.id, client_id: client.id, role:
   'viewer' }`, hard-coded to `viewer` (the wizard has no way to create an admin from this
   flow). On failure: rolls back both the auth user and the `clients` row.
6. Returns `{ client_id, client_name, user_id }` on success.

This is the only atomic/transactional part of onboarding — steps 3–5 are sequential with
manual rollback on error, not a real DB transaction, but the rollback logic does correctly
unwind partial state on each failure path.

### Step 5 — Collecting (`step === 5`)
On successful `onboard-client` response, the wizard immediately calls its own local
`runCollection(clientId)` function (defined inside `Onboard.tsx` itself — **not** the
`runCollection` from `collectionContext.tsx`/`useCollection()`, despite the identical name).
This local version:

1. Re-fetches the just-created client's `brand_aliases`, `brand_website`,
   `known_competitors` from Supabase (redundant round-trip — it already has this data in
   local component state from steps 1–3, but re-reads it from the DB instead).
2. Fetches `prompts` where `client_id = <new client>` and `is_active = true`, ordered by
   `position`.
3. If no prompts exist, sets `progress.finished = true` with the message `"No active prompts
   found."` and stops — **see §4, this is the normal case for every new client today**, since
   nothing in this flow creates any prompts.
4. If prompts exist, loops over them **sequentially** (`for` loop with `await` inside, not
   parallel across prompts) and for each one does a single `fetch('/.netlify/functions/
   collect-prompt', ...)` call, updating a progress bar (`done`/`total`/`current`).
5. When the loop finishes, shows a "Collection complete!" card claiming
   `"{total} prompts × 5 engines collected."` and a count of errors (HTTP non-OK responses),
   with copy suggesting failures "will retry next month."
6. A "Go to Dashboard" button navigates to `/`.

**This step is the source of the known limitation below** — see §5.

---

## 3. Database rows created (mapped to `CLAUDE.md` §3 schema)

| Table | Row created | Notes |
|---|---|---|
| `clients` | 1 | `plan` not set by this function — falls through to DB column default; `engines_enabled`, `default_market_id` also untouched |
| `auth.users` (Supabase Auth) | 1 | `email_confirm: true`, no verification email |
| `user_profiles` | 1 | `role` hard-coded to `'viewer'`; `client_id` = new client's id |
| `prompts` | **0** | Nothing in this flow creates any prompts — see §4 |
| `ai_results` | 0 to N | Only if prompts already existed for this `client_id` before onboarding ran (they never do, for a brand-new client) |

---

## 4. What's NOT automated yet

- **No prompts are created during onboarding.** Neither `Onboard.tsx` nor
  `onboard-client.js` inserts any `prompts` rows. `Prompts.tsx` (the `/prompts` CRUD page) is
  the only place prompts get created, and it's a separate page the admin has to visit manually
  *after* the wizard finishes. In practice this means **step 5's "Running Initial Collection"
  will show "No active prompts found." for every single newly onboarded client** — there is
  nothing to collect yet at the moment the wizard runs it. The admin has to go add prompts via
  `/prompts` and then manually trigger collection again from `AIVisibility.tsx` (or
  `Prompts.tsx`'s own per-prompt refresh, task #64) for the client to have any data. This
  contradicts the wizard's own final-step copy ("Collection complete! ... prompts × 5 engines
  collected"), which implies the client is now fully set up.
- **No plan is selected during onboarding.** There's no plan picker anywhere in the wizard.
  `onboard-client.js`'s insert into `clients` omits `plan` entirely, so every new client gets
  whatever the `clients.plan` column's database default is (not verified from these files —
  would need a Supabase schema check to confirm what that default resolves to, and whether
  it's `free` per `planConfig.ts`'s `PLAN_ENGINES.free = ['chatgpt']`). If the intent is for
  new clients to start on a specific plan, that has to be set manually afterward (e.g. via a
  direct Supabase edit, since there's no plan-editing UI referenced in these files either).
- **No `default_market_id` is set.** Per `CLAUDE.md` §7.1/§72 audit findings,
  `marketContext.tsx` defaults any client with no saved market to Romania — this is a
  pre-existing, separately-tracked issue, but onboarding does nothing to prevent it for new
  non-Romanian clients since it never writes `default_market_id`.
- **No welcome/credentials email.** The admin sets the client's login email + password by
  hand in step 4 and (implicitly) has to relay those credentials to the client out-of-band —
  nothing in `onboard-client.js` sends an email.
- **No admin-role creation path.** `user_profiles.role` is hard-coded to `'viewer'` — this
  flow cannot be used to create another admin account.
- **No `engines_enabled` override set.** New clients rely purely on plan defaults from
  `getEngineStates()` in `planConfig.ts`; there's no step to pre-configure per-engine
  overrides during onboarding.

---

## 5. Known limitation — initial collection silently skips Claude and ChatGPT

**Confirmed by reading the code directly.** `Onboard.tsx`'s step-5 `runCollection()`
(lines ~94–149) only ever calls one Netlify function:

```js
const res = await fetch('/.netlify/functions/collect-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(collToken ? { Authorization: `Bearer ${collToken}` } : {}) },
  body: JSON.stringify({ prompt_id: p.id, prompt_text: p.text, client_id: clientId, client_config: clientConfig }),
})
```

Per `CLAUDE.md` §1.2, `collect-prompt.js` only covers **Gemini + Perplexity + Meta**. Claude
and ChatGPT are handled by two entirely separate, dedicated functions —
`collect-claude.js` and `collect-chatgpt.js` — that Onboard's local `runCollection` never
calls. There is no branching, feature flag, or conditional anywhere in this function that
would fire those two functions under any circumstance; the `fetch` call to `collect-prompt` is
the only network call in the whole loop body.

**Contrast with the correct pattern**, used everywhere else in the app
(`collectionContext.tsx`'s `runCollection`, lines ~53–166, and `runSinglePrompt`, lines
~168–228): both fire up to **three** parallel calls per prompt via `Promise.allSettled` —
`collect-prompt` (for whichever of gemini/perplexity/meta are in `active_engines`),
`collect-claude` (if `claude` is active), and `collect-chatgpt` (if `chatgpt` is active).
`Onboard.tsx` does not use `useCollection()` / the shared `CollectionContext` at all — it
reimplements a parallel, simpler version of the same loop from scratch and only replicates
one-third of it.

**Effect:** even if prompts existed at onboarding time (see §4 — today they never do, so this
bug is currently masked by the "no prompts" gap), the wizard's step-5 collection pass would
populate `ai_results` for gemini/perplexity/meta only. The UI's own success message —
`"{total} prompts × 5 engines collected"` — is inaccurate; at most 3 of the 5 non-"coming
soon" engines would have been queried (and only the ones both plan-permitted and
`is_active`, since `client_config` passed here doesn't even carry `active_engines` — every
plan-allowed engine `collect-prompt.js` supports would be attempted regardless of the new
client's plan gating, since the local `runCollection` never fetches or passes
`active_engines` to the payload at all, unlike `collectionContext.tsx` which explicitly
filters by `getActiveEngines(plan, enginesEnabled)`).

**Fix (not yet done):** either delete `Onboard.tsx`'s local `runCollection`/`handleCreate`
collection-trigger code entirely and call `useCollection().runCollection(clientId, true,
undefined, activeEngines)` from `collectionContext.tsx` instead (the same function every
other page already uses correctly), or extend the local copy to also fire `collect-claude`
and `collect-chatgpt` in parallel, matching the pattern in `collectionContext.tsx` lines
143–150. The former is preferable — it removes duplicate collection logic instead of adding a
third copy of it, and would also need `active_engines` (derived from the new client's plan)
threaded into the payload to fix the second gap noted above.

---

## 6. Summary table

| Stage | File | Result |
|---|---|---|
| Steps 1–4 (form) | `Onboard.tsx` | Local component state only, nothing persisted yet |
| Submit (step 4 → 5) | `Onboard.tsx` `handleCreate()` → `POST /.netlify/functions/onboard-client` | — |
| Backend create | `onboard-client.js` | 1 `clients` row, 1 `auth.users` row, 1 `user_profiles` row (`role: viewer`); rollback on partial failure |
| Step 5 collection | `Onboard.tsx` `runCollection()` | Loops active `prompts` (normally zero — see §4), calls `collect-prompt.js` only (Gemini/Perplexity/Meta) — **Claude and ChatGPT never collected here**, see §5 |
| Post-wizard | Manual | Admin must separately add prompts via `/prompts`, verify/adjust plan, and re-trigger a full collection (e.g. Force Refresh in `AIVisibility.tsx`, which correctly uses `collectionContext.tsx` and fires all 5 non-"coming soon" engines within plan limits) for the client to have real, complete data |
