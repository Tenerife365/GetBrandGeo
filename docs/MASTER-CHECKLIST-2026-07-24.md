# BrandGEO — Master Pending Checklist (exported 2026-07-24)

Complete record of every pending task, uncommitted change, manual step, and
scheduled item, pulled from CLAUDE.md, the spec docs, memory, and live git/routine
state. Nothing here has been executed. Use it to seed the specialized chats.

> **Live state confirmed today:** `main` HEAD = `2d73755`. On main: T0 (`db33fa7`),
> T1a/b/c (`610552c`), AI SEO Phase 2 (`f227a0c`), brand_name fix (`e30b67e`), plus
> two new commits I did not make: `4f6234d Add cPanel auto-deploy configuration` +
> `2d73755 Testing auto-deploy`. The overnight branches do NOT exist on the remote.

---

## 0. CROSS-CUTTING BLOCKER (do this first)

- [ ] **Cloud routines fired but pushed nothing.** Three jobs ran and produced no
  commits/branches: Wed BG-018 (07-22), overnight-pricing-build (07-23),
  overnight-content-10day (07-23). Root cause unknown — most likely the cloud
  sessions lack **git push credentials** to `github.com/Tenerife365/GetBrandGeo`,
  or they errored. **Check each run log before re-running anything.** Until fixed,
  all recurring content routines (Wed/Thu/Fri/Mon) will keep silently failing.
- [ ] Confirm what `Add cPanel auto-deploy configuration` + `Testing auto-deploy`
  (new on main) actually do — this may change the "manual cPanel upload" assumption
  in every content handoff below.

---

## 1. Infrastructure & Database (Supabase · Netlify · cPanel)

### Supabase — migrations to apply (each is a repo-root `.sql`; apply BEFORE its commit ships)
- [ ] `supabase-seo-briefs-migration.sql` — AI SEO Phase 1 (seo_briefs)
- [ ] `supabase-seo-pages-migration.sql` — AI SEO Phase 2 (seo_pages, seo_crawls)
- [ ] `supabase-admin-plan-grants-migration.sql` — Admin Pass 1 (plan_source, grants, client_events, client_notifications)
- [ ] `supabase-admin-notifications-migration.sql` — Admin Pass 2 (admin_notifications, RLS admin-only)
- [ ] `supabase-social-cancel-status-migration.sql` — social cancel/edit ('canceled' status)
- [ ] Verify the **`social-media` public Storage bucket** exists (cover images) — run
  `supabase-social-media-bucket.sql` or create it in the dashboard. Recorded as
  live-verified 2026-07-21, so likely already done — confirm.
- [ ] **Enable Google auth provider** in Supabase Auth (signup redesign Phase 1 / Google SSO)
- [ ] (Already applied+verified per record — no action: social-profile-binding,
  social-all-networks, assistant_events, signup_attempts, RLS-helper search_path pin)

### Netlify — env vars + deploys
- [ ] Confirm `SERPAPI_KEY` set (Google AI Mode engine)
- [ ] `AYRSHARE_DOMAIN` (`id-5d2IR`) + `AYRSHARE_PRIVATE_KEY` — needed for self-service
  SSO; verified live on 2 clients 2026-07-21, so set. Re-confirm after any env change
  (env changes need a REDEPLOY).
- [ ] **Restore `GOOGLE_JSON_KEY`** — deleted to fit the 4KB env limit; only the manual
  SEO indexing tools (`force-index.js`) use it. Restore via **Function-scoped** env on
  the Pro plan.
- [ ] Confirm these BUILT-but-not-deployed items actually deploy (push to main auto-deploys):
  Admin Pass 1, Admin Pass 2, delete-account, social cancel/edit, AI SEO Phase 1
  (confirm live), signup redesign Phase 1.
- [ ] Jamie hot-lead: `claude-sonnet-5` returns non-200 on the product key — check
  `[Assistant] claude-sonnet-5 non-200: XXX` in the `assistant` function log
  (403 = enable Sonnet on the key; 404 = wrong model id). Hot leads currently fall back to Haiku.

### cPanel — static site uploads (getbrandgeo.com) — pending the de-AI / no-em-dash pass
- [ ] **Re-upload `index.html` + `site.js`** — the earlier uploads did NOT land
  (served `Last-Modified: 2026-07-18`); confirm the served date flips after re-upload.
- [ ] Upload the final leftover group (8 files): `terms.html`, `privacy.html`,
  `cookies.html`, `support.html`, `welcome.html`, `thanks.html`, `news/index.html`,
  `news/real-time-ai-visibility-engine-launch/index.html`
- [ ] Upload `article-builder.html` (de-dashed, incl. its generated-article template)
- [ ] (Recorded as already uploaded: the 13 top pages + 35 deep content pages — but
  `index.html` still needs the one re-upload above)
- [ ] Verify every upload via `Last-Modified` (a cache flush / query-param buster will
  NOT fix a file that never overwrote). **NOTE:** the new cPanel auto-deploy config may
  make some/all of this automatic — resolve item 0 first.
- [ ] `.htaccess` CSP `connect-src` must keep `https://app.getbrandgeo.com` (Jamie +
  Instant Audit depend on it) — verify it survived any edits.

---

## 2. Code & Pricing Features (PRICING-STRATEGY-2026-07)

### Done + on main
- T0 (`db33fa7`), T1a/b/c (`610552c`), T0b (OpenAI-migration audit — no savings), T6 (checklist written)

### Pending BUILD (were the overnight pricing-build job; it did not land)
- [ ] **T2a** — client UI: collection-cooldown countdown + usage/limit meters (engines,
  prompts, AI SEO pages/drafts, AI Social channels/posts)
- [ ] **T2b** — admin plan-management UI extensions
- [ ] **T3** — promotions/discounts system (Stripe coupons + promo banner + strikethrough price)
- [ ] **T4** — marketing-site pricing page redesign to the new ladder
  (Free / Essentials €99 / Growth €299 / Growth PRO €449 / Managed from €1,500 / Enterprise)
- [ ] **T5** — admin Content Studio: build articles/news/announcements/all site content
  from the admin dashboard, INCLUDING the programmatic brand image generator (reuse
  `social-image.js` / `_card_font.js`, no AI image gen)
- [ ] **T7** — QA pass across all of the above

### Manual Stripe work (T6-STRIPE-CHECKLIST.md)
- [ ] Create products + monthly/annual prices: Essentials 99/990, Growth 299/2990,
  Growth PRO 449/4490, Managed 1500/15000, Enterprise (no public price)
- [ ] Create add-on prices: Instagram, TikTok (Growth PRO only), extra collection
  allowance, extra AI SEO pages/drafts, Pro/Ent extras (per-unit prices TBD)
- [ ] Map new price IDs → plan in `stripe-webhook.js` (incl. annual → same plan)
- [ ] Create coupons (for T3 Promotions)
- [ ] Migrate existing subs at next renewal: old Managed €900 → €1,500; old Pro €1,500 →
  Managed; Growth price unchanged but note engine change (lost Google AI Mode → Growth PRO+)
- [ ] **IG/TikTok add-on entitlement** (column + Stripe) — currently blocked for self-serve until built

### Other BUILT-but-not-deployed code (each = apply migration if any, then commit/push, then test)
- [ ] Admin Pass 1 (plan management / trials / comps) — `set-client-plan.js`,
  `expire-plan-grants.js`, `Account.tsx` Manage-plan card, `ClientBanner.tsx`
- [ ] Admin Pass 2 (notification bell) — `AdminBell.tsx`, `_admin_notify.js`, `client-users.js`
- [ ] Delete account — `delete-client.js` + danger-zone card (commit/push only, no migration)
- [ ] Social cancel/edit — `social-delete.js` + Calendar edit/cancel
- [ ] Signup redesign Phase 1 — Google SSO + email + onboarding (needs Google provider enabled)
- [ ] AI SEO Phase 3 (Consistency checker) — NOT built (`seo-consistency.js` + tab)
- [ ] Set BpR's real billing dates via the admin "Edit dates" editor (manual)

---

## 3. Content & Social (BG-018 · LinkedIn · AI Social)

### Content pipeline (nothing landed — routines pushed nothing)
- [ ] **BG-018** — methodology article on measurement accuracy (grounded in shipped
  `_analysis.js` / `_competitor_filter.js` accuracy work). Re-run once credentials fixed, or build locally.
- [ ] **BG-018 LinkedIn post** (depends on BG-018)
- [ ] **10-day content batch** — articles / news / announcements / blog + matching
  LinkedIn posts + programmatic images (the overnight content job's target)
- [ ] Thursday LinkedIn repurpose routine — never fired
- [ ] Friday distribution routine — never fired (recurring)

### AI Social — live tests + loose ends
- [ ] Real **publish + schedule test on Paunescu** (client 5, 3 live channels) — never run
- [ ] Cancel/edit safe test (schedule an hour out → edit → cancel, nothing goes public)
- [ ] **Talentwelove (client 19)** still bound to Ayrshare "Primary Profile" — unlink + reconnect to its own profile
- [ ] `brand_voice` writer UI — largely resolved (Brand Kit now writes it), confirm
- [ ] Verify the locked/upgrade state for plans without AI Social (feature gating shipped)

### AI Social BACKLOG — DISCUSS/DEBATE before building (do NOT build)
- [ ] Reviews + comment inbox + autopilot answering (Google/Facebook reviews, cross-post
  comments, optional AI replies, approval-first)
- [ ] RSS-driven auto-posting of new content (LinkedIn first, test on our own pages first)

---

## 4. Routines & Credentials (Git push · failed triggers)

- [ ] **Fix git-push for cloud routines** (the cross-cutting blocker) — without this,
  every content/build routine keeps producing nothing.
- [ ] Verify the **Monday roadmap routine** actually commits its `ROADMAP-*.md`
  (`ROADMAP-2026-07-20.md` is untracked locally — may indicate the same push failure)
- [ ] Re-arm the two one-time routines after the fix (both now disabled = `run_once_fired`):
  - pricing-build: `trig_01FBe6GBLvdMTYeXdSV4cHyt`
  - content-10day: `trig_014oxK1AiQHHJTqFazPZuE4u`
- [ ] Recurring routines that will keep firing (same credential risk): Wed BG-018
  (`trig_01AziMs7we8oVV8rAxRT95eE`), Thu repurpose, Fri distribution, Mon roadmap
- [ ] Confirm the new `cPanel auto-deploy` commits are intended and working
- [ ] Deep-research competitor-pricing verification — re-run (was blocked on a session limit)

---

## 5. Uncommitted local changes (this machine)
- [ ] `AI-SOCIAL.md` — 2 new backlog entries (reviews/inbox/autopilot + RSS) — uncommitted
- [ ] Large pre-existing working tree — the de-AI / de-em-dash edits across
  `brandgeo/web/*.html` (code-complete, upload pending per §1 cPanel)
- [ ] `CLAUDE.md` — always shows modified; **stays uncommitted on purpose** (do not commit)
- [ ] This file (`MASTER-CHECKLIST-2026-07-24.md`) — new, untracked

---

### Suggested chat split
- **Chat A — Infra/Deploy:** §0 blocker + §1 (migrations, Netlify env, cPanel) + §4
- **Chat B — Pricing:** §2 (T2a→T7 + Stripe T6)
- **Chat C — Content/Social:** §3 (BG-018, 10-day batch, AI Social live tests)
- Keep §2 "BUILT-not-deployed" items in whichever chat owns their feature area.
