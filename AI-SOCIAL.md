# AI Social — multi-platform social publishing & scheduling for BrandGEO

> Opened 2026-07-20. Compose (or AI-generate) a post once, adapt per platform,
> schedule, and publish to Instagram / Facebook / LinkedIn / Google Business
> Profile / X from one screen. Internal-first (the founder's brands) but built
> multi-tenant so it can graduate into a customer-facing BrandGEO feature.
> Success test: schedule a full week across all connected platforms in <10 min.

## Confirmed decisions (founder, 2026-07-20)

1. **Publishing layer: Ayrshare** (not self-host). Fits the serverless Netlify +
   Supabase stack with no VPS. Kept behind a swappable abstraction so Postiz/
   Mixpost can replace it later with zero caller changes.
2. **Tenancy: internal-first, multi-tenant-ready.** Every table carries
   `client_id` + the standard RLS (`is_admin() OR client_id = get_my_client_id()`).
   Each workspace maps to an Ayrshare **profile_key** (null = single Premium
   profile).
3. **MVP platforms: Instagram + Facebook + LinkedIn + GBP.** X later (paid API +
   account suspended). Internal ids: `instagram|facebook|linkedin|gbp|x`;
   Ayrshare translation (`gbp`→`gmb`, `x`→`twitter`) is hidden in the provider.

## Ayrshare pricing (verified 2026-07-20) + recommendation

| Plan | $/mo | Profiles (=brands/tenants) | Notes |
|---|---|---|---|
| Premium | 149 | 1 | one brand only |
| **Launch** | **299** | **up to 10** | advanced analytics, webhooks, higher limits; **28-day free trial, no credit card, full Business access during trial** |
| Business | 599 | 30+ | per-profile scaling |

**Recommendation given to founder:** start the **28-day free Launch trial** (no
card) — covers BrandGEO + TalentWeLove + first ~8 customers, cancel anytime.
Decide to pay only after the trial proves the <10-min success test. The build is
tier-agnostic (`profile_key`-per-workspace), so any tier needs zero code change.

## Status — Phase 1 COMPLETE + Phase 2 generator ✅ DEPLOYED LIVE (2026-07-20)

⚠️ **Deploy gotcha, cost one failed build — read before the next AI Social commit.**
The Phase-1 backend (`_publishing.js`, `_publishing_ayrshare.js`, `_social.js`,
`social-accounts|link|publish|status.js`) and the `src/types/index.ts` AI Social
block were **written but never committed** by the backend session. "NOT yet
deployed" in this file meant *not committed*, not *committed but unpushed*. The
frontend commit therefore shipped `Social.tsx` + `social-generate.js` without
them and Netlify failed with `TS2305: Module '"../types"' has no exported member
'SocialPlatform'` (plus a cascading TS7006). A local `npm run build` passes in
that state because the files are on disk, so **the build result proves nothing
about the commit** — check `git status --porcelain` on the touched dirs before
pushing. Fixed by a follow-up commit adding all 8 files + the migration SQL.
**Verified live after deploy:** POSTing unauthenticated to all five
`social-*` endpoints returns **401** (not 404 = deployed, not 500 = the
underscore-prefixed helpers bundle and resolve correctly).

### ✅ Built + verified (2026-07-20) — DEPLOYED LIVE; migration applied
- **`supabase-social-migration.sql`** (repo root) — 4 tables, all with RLS
  mirroring `recommendations`: `social_profiles` (client→profile_key + brand_voice),
  `social_accounts` (connected-account cache), `social_posts` (base compose +
  status + scheduled_at + source manual|ai), `social_post_targets` (per-platform
  text/media override + publish result). Generic `updated_at` trigger. **NOT yet
  applied to live project `duiyifepitvugyulobqm`.**
- **`brandgeo-dashboard/netlify/functions/_publishing.js`** — provider factory +
  documented interface (`isConfigured/listAccounts/createLinkingUrl/publish/
  getStatus/deletePost`). App talks ONLY to this. `PLATFORMS` export.
- **`_publishing_ayrshare.js`** — Ayrshare impl (Bearer auth, `Profile-Key`
  header, one `POST /post` per platform for clean per-target status, JWT/SSO
  linking via `/profiles/generateJWT`, `/user` for accounts, `/post/{id}` status,
  `DELETE /post`). Platform id maps live here.
- **`_social.js`** — `ensureSocialProfile`, `mediaUrlsFrom`, `rollupPostStatus`.
- **`social-accounts.js`** — POST{client_id} → connected accounts (+cache).
- **`social-link.js`** — POST{client_id} → Ayrshare JWT linking URL, or null+hint
  (Premium: link in Ayrshare dashboard).
- **`social-publish.js`** — POST inline compose (or post_id retry) → creates
  post+targets, resolves per-platform overrides against base, publishes/schedules
  via provider, writes per-target results, rolls up post status.
- **`social-status.js`** — POST{client_id,post_id} → refresh target statuses.
- **`netlify.toml`** — `social-publish`/`social-status` timeout=26.
- **`src/types/index.ts`** — `SocialPlatform`, `SocialPostStatus`,
  `SocialTargetStatus`, `SocialMedia`, `SocialAccount`, `SocialPostTarget`,
  `SocialPost`.
- Verification: `node --check` clean on all 6 function files; provider-interface +
  helper wiring smoke-tested (`rollupPostStatus` partial/published cases pass).
  These are Netlify functions — `npm run build` does NOT exercise them; Netlify's
  esbuild bundling at deploy is the real validation (same as every other function).

### ✅ Phase 1 FRONTEND (2026-07-20) — DEPLOYED LIVE
- **`src/pages/Social.tsx`** — three tabs.
  - **Composer** (default tab): AI brief box → `social-generate`; base text +
    media URLs (one per line, parsed into `SocialMedia[]`, `.mp4/.mov/.webm` →
    `video`); platform chips (X disabled, MVP-only; unlinked platforms flagged
    "not linked" but still selectable); per-platform editable cards with live
    character counters against each network's limit and a Reset-to-base control;
    `datetime-local` schedule (empty = publish now) → `social-publish`.
    Client-side guards before publishing: at least one platform, Instagram needs
    media, no target over its char limit, and no empty text.
  - **Calendar**: reads `social_posts` + nested `social_post_targets` directly
    via the RLS'd supabase client (no function needed for a read), split into
    Scheduled / History, per-target status chips + permalinks + errors, and a
    per-post refresh button hitting `social-status`. Real empty state.
  - **Accounts**: `social-accounts` list rendered against all 5 platforms
    (connected or not), Refresh, and Connect → `social-link` (opens the JWT URL
    when the plan supports it, otherwise surfaces the dashboard-linking hint).
    A banner appears when `configured:false` telling you to set `AYRSHARE_API_KEY`.
  - Connected MVP platforms are pre-selected once accounts load; switching the
    active client resets the whole composer.
- **Route** `/social` in `src/App.tsx` (PrivateRoute + Layout).
- **Nav** in `src/components/Layout.tsx` → Manage group, **admin-only**
  (`isAdmin`) since AI Social is internal-first. Icon `Share2`. Mobile bottom nav
  deliberately untouched (space-constrained 7-icon bar).
- Verified: `npx tsc --noEmit` clean and `npm run build` succeeds on Windows.

### ✅ Phase 2 generator (2026-07-20) — DEPLOYED LIVE
- **`netlify/functions/social-generate.js`** — `POST {client_id, brief,
  platforms?, premium?}` → `{base_text, platforms:{...}}`. Claude **Haiku** by
  default, **Sonnet** when `premium:true` **with a Haiku fallback** if Sonnet
  errors (same no-dead-end pattern as `assistant.js`). Per-network rules live in
  a `RULES` map (limits mirror the composer's counters, keep the two in sync)
  plus an explicit **GEO pass** in the prompt (state checkable facts plainly,
  name the brand rather than "we", no invented stats) and the project's
  **no-em-dash voice rule**, belt-and-braces enforced by a `deDash()` pass on
  the output. Brace-balanced JSON extraction (same technique as `assistant.js`),
  platform allow-list against `PLATFORMS`, output truncated to each limit.
  Every failure path returns HTTP 200 `{error}` so the composer degrades to
  manual writing instead of breaking. Reuses `ANTHROPIC_API_KEY`, no new env var.
- `netlify.toml` → `[functions."social-generate"] timeout = 26`.

### ✅ Multi-profile tenancy — one Ayrshare profile per client (2026-07-20)

**The bug this closes.** `social_profiles.profile_key` existed but **nothing ever
wrote it**, so `ensureSocialProfile` returned `null` for every client, the
`Profile-Key` header was omitted, and Ayrshare fell back to the account's
**primary profile**. On an account with one profile per client that means a post
composed for client A publishes to whichever brand owns the primary profile,
silently, with a success response. The provider plumbing was always correct; only
the assignment was missing.

**Hard API constraint (verified against Ayrshare docs, 2026-07-20).**
`GET /profiles` returns `title`, `refId`, `status`, `activeSocialAccounts` but
**never `profileKey`**: *"For security, the Profile Keys are not returned via
this GET call."* A key is disclosed **only** by `POST /profiles/profile` at
creation, or by copying it from the dashboard. So profiles that already exist
cannot be auto-discovered, and binding them requires one human paste per client.
Founder's call: **paste keys once per client**, keeping the already-linked
IG/FB/LinkedIn/GBP accounts intact (the alternative, recreating profiles from the
app, would have meant re-linking every channel).

**Built:**
- `_publishing_ayrshare.js` → `listProfiles()` (identify, no keys),
  `createProfile({title})` (the one path that yields a key, so it must be
  persisted immediately), `verifyProfileKey({profileKey})` (proves a pasted key
  works and reveals whose channels it owns, **before** it is stored).
  Declared in `_publishing.js`'s interface docs as OPTIONAL provider methods, so
  a future Postiz/Mixpost provider without profiles degrades gracefully.
- **`social-profile.js`** (NEW, `adminOnly:true`) — actions `get` / `list` /
  `bind` / `create` / `unbind`. Binding is verified against Ayrshare first; a
  wrong key is rejected rather than silently persisted. The key is **never
  returned to the browser**, only a masked `key_hint` (`7TVR…984N`). `list`
  flags profiles already claimed by another client so two clients cannot be
  pointed at the same channels by accident.
- **`requireBoundProfile(sp)` in `_social.js`** — the guard. Enforced in
  `social-publish` (checked **before any row is written**, so a misconfigured
  client leaves no half-created post/target rows), `social-accounts` (an unbound
  client must NOT call the provider: with no key Ayrshare answers for the primary
  profile and would render another brand's channels as this client's own) and
  `social-status` (same reasoning for post state). Escape hatch for a genuine
  single-profile Premium setup: `AYRSHARE_SINGLE_PROFILE=true`.
- **`Social.tsx`** — a "Publishing profile" panel on the Accounts tab: current
  binding (title, refId, masked key), admin-only picker listing the live Ayrshare
  profiles with the channels each one owns, password-type key field, Verify and
  link, Create profile, Unlink. The Composer shows an amber unbound banner and
  **disables Publish** when the client is unbound; non-admins see the same state
  (surfaced by `social-accounts`) so an empty tab is never unexplained.
- **`supabase-social-profile-binding-migration.sql`** — ✅ **APPLIED + VERIFIED
  LIVE.** Adds `profile_title`, and revokes column-level `SELECT` on
  `profile_key` from `anon`/`authenticated`. That column is a credential and the
  table's RLS let a client read its own row, which would have exposed it to the
  browser; the functions use the service key, which bypasses both RLS and column
  grants. Note the revoke is paired with an explicit re-`GRANT` of the other
  columns, because a column-level revoke alone does not bite while a table-wide
  grant stands. Verified: `information_schema.column_privileges` lists every
  column except `profile_key` for both roles.
- `netlify.toml` → `[functions."social-profile"] timeout = 26`.

**✅ PROVEN ON LIVE DATA 2026-07-20.** Talentwelove (client 19) → "Primary
Profile", BrandGEO (client 2) → its own "BrandGEO" profile, distinct refIds and
distinct key fingerprints. **Multi-profile works on the Launch trial** — the
Business-plan gate below did NOT bite, so no $599 upgrade is needed for
per-client isolation. Channels as linked in Ayrshare: Talentwelove has all four
(IG/FB/LI/GBP); **BrandGEO has only LinkedIn + Google Business** ("BrandGEO
Global"), so IG/FB publishing for BrandGEO fails until they are linked there.

**Three real dead ends hit while binding the first client — check these first if
it ever fails again:**
1. **Plan gate (a red herring, but documented as real):** Ayrshare's docs say a
   Profile Key "is only available for Business or Enterprise plans". Empirically
   the Launch trial accepts them fine. Don't upgrade on the strength of the docs.
2. **`refId` pasted instead of the key.** The 40-hex value shown next to a
   profile (`2e4d2d8a…`) is the refId, NOT the key. The real Profile Key is 35
   chars, short and dashed, revealed by the **key icon**. `social-profile.js` now
   rejects an obvious RSA PEM paste up front and names the likely cause on any
   rejection.
3. **The `AYRSHARE_API_KEY` in Netlify was not an API key at all** (a refId had
   been pasted there too) — every call failed with `code 102 API Key not valid`
   before profiles were ever reached. Fixed by taking the key from the **primary
   account's** API Key section. **Netlify env changes need a redeploy to take
   effect**; without one the functions keep the old value and nothing appears to
   change. `curl -H "Authorization: Bearer KEY" https://api.ayrshare.com/api/profiles`
   is the fastest way to prove a key before touching Netlify.

**Two live-data bugs found by inspecting the result and fixed the same day:**
- **Cross-brand cache poisoning (the exact hazard the guard exists for).** Before
  the guard shipped, Bucate pe Roate (unbound) had called `listAccounts`, received
  the PRIMARY profile's accounts, and cached Talentwelove's 4 channels as its own.
  Nothing was published, so it was stale cache only; those rows were deleted.
- **GBP rows duplicated on every refresh.** Google Business returns no account id,
  so `external_id` is NULL, and `NULL <> NULL` in Postgres means the
  `(client_id, platform, external_id)` unique index never matched: each Accounts
  refresh inserted another gbp row. `social-accounts.js` now **replaces** a
  client's cached rows (delete + insert) instead of upserting, which also drops
  channels that were disconnected at the provider. Existing duplicates purged.

**Binding a client, start to finish:** Accounts tab → Link profile → pick the
client's profile from the live list → paste its Profile Key from the Ayrshare
dashboard (Profiles → key icon) → Verify and link. The reply states how many
channels came back, which is the confirmation that the right profile was bound.

### ✅ Tenant isolation, unlimited channels, client self-service (2026-07-20)

**1. Isolation — VERIFIED ON LIVE DATA, not assumed.** Impersonated the real
Talentwelove (client 19) viewer JWT against the live DB. Across all four social
tables: `own` rows visible, **`other` = 0 everywhere** (accounts own=4 other=0,
posts 0/0, targets 0/0, profiles own=1 other=0). Selecting `profile_key` as that
viewer raises `permission denied`, so the Ayrshare credential is unreadable even
on the client's OWN row. Three independent layers hold this up: RLS
(`is_admin() OR client_id = get_my_client_id()`), the column-level revoke from
the binding migration, and the per-function `profile.client_id` check. Re-run the
impersonation test after any RLS or grant change.

**2. No cap on channels — all 13 networks, any number of accounts.** Previously
capped at 5 in three places that would each have silently broken a client:
`TO_AYR`/`FROM_AYR` **dropped** unknown networks from `listAccounts`, and the DB
`check (platform in (...))` on `social_accounts` + `social_post_targets` would
have **rejected the insert outright** for e.g. a TikTok account. Now all 13
Ayrshare ids (`bluesky, facebook, gmb, instagram, linkedin, pinterest, reddit,
snapchat, telegram, threads, tiktok, twitter, youtube`, docs-verified) are
supported end to end: provider maps (`FROM_AYR` is now *derived* from `TO_AYR` so
they cannot drift), `PLATFORMS`, the `SocialPlatform` type, `social-generate`'s
per-network `RULES`, and both check constraints
(`supabase-social-all-networks-migration.sql`, **APPLIED + VERIFIED**).
UI: the four focus networks always show; any other network appears once the
client actually connects it. The Accounts grid renders **one card per connected
account, not per network**, so several Facebook Pages or Google Business
locations all appear (`Facebook · 2 of 3`) instead of only the first. `NEEDS_MEDIA`
now covers Instagram, TikTok, YouTube and Pinterest rather than Instagram alone.

**3. Client self-service connecting (no shared passwords).** Ayrshare's SSO/JWT
flow, and `createLinkingUrl` was already built for it: BrandGEO mints a
short-lived JWT server-side, the client opens Ayrshare's hosted page, authorises
each network with **that network's own OAuth login**, and comes back. No social
username or password ever reaches BrandGEO, and nothing is stored here but the
provider's revocable tokens. **Docs-verified: available on Launch**, not just
Business, so the current trial covers it. The URL is valid **5 minutes** and is
minted fresh per click. The Accounts tab now leads with a "Connect your channels"
card stating the no-password-sharing guarantee, and the account list auto-refreshes
when the user returns to the tab (the hosted page reports nothing back to us).
🔴 **BLOCKED on two env vars** — `AYRSHARE_DOMAIN` (the exact domain Ayrshare
assigns at onboarding) and `AYRSHARE_PRIVATE_KEY` (RSA key from the dashboard).
Until they are set, `social-link` returns `url: null` plus a hint naming exactly
what is missing, and accounts must be linked inside the Ayrshare dashboard.

### ⏳ Still pending
- Bulk/campaign generation ("8 launch posts across 2 weeks"), brand-kit image gen.
- Editing/canceling a scheduled post from the Calendar (the provider exposes
  `deletePost`, but no endpoint or UI wraps it yet).
- `brand_voice` on `social_profiles` is read by the generator but nothing writes
  it yet — needs a small settings UI (or seeding from the client record).

## Founder handoff — needed for live publishing (not blocking further build)
1. ✅ **DONE 2026-07-20 — the Ayrshare 28-day free Launch trial is ACTIVATED.**
   Remaining sub-step: connect IG/FB/LinkedIn/GBP inside the Ayrshare dashboard
   (on Premium/trial without SSO env, linking happens there, not in-app) — they
   then show up via `social-accounts`. Worth noting which of the four actually
   connect on day one; Instagram and Google Business Profile have the strictest
   requirements (IG needs a Business/Creator account linked to a Facebook Page;
   GBP needs a verified location), so those are the likely blockers.
2. ✅ **DONE 2026-07-20 — migration applied.** Verified live against project
   `duiyifepitvugyulobqm`: `social_profiles`, `social_accounts`, `social_posts`,
   `social_post_targets` all exist.
3. ✅ **DONE 2026-07-20 (founder) — `AYRSHARE_API_KEY` set in Netlify.**
   For the record, the full var list: `AYRSHARE_API_KEY` (required). For in-app
   account linking (Business/Launch multi-profile SSO): `AYRSHARE_DOMAIN` +
   `AYRSHARE_PRIVATE_KEY`. `ANTHROPIC_API_KEY` already set (Phase 2). Optional:
   `PUBLISHING_PROVIDER` (defaults to `ayrshare`).
4. No CSP change needed — the browser calls our Netlify functions (same origin);
   functions call Ayrshare server-side.

## Next session
Deploy (commit + push the dashboard; Netlify auto-deploys), then run the real
end-to-end test: open `/social` as admin, confirm the Accounts tab lists whichever
of IG/FB/LinkedIn/GBP actually linked in the Ayrshare dashboard, generate a post
from a brief, publish one to a single platform, then schedule one and confirm it
appears under Calendar → Scheduled. After that: the "still pending" list above
(bulk generation, cancel/edit a scheduled post, a brand_voice settings UI).
