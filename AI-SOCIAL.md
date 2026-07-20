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

## Status — Phase 1 COMPLETE (backend + frontend) + Phase 2 generator built (2026-07-20)

### ✅ Built + verified (2026-07-20) — NOT yet deployed/applied
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

### ✅ Phase 1 FRONTEND built + build-verified (2026-07-20) — NOT yet deployed
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

### ✅ Phase 2 generator built (2026-07-20) — NOT yet deployed
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
