# BrandGEO Core State

Last verified against the live sites and the working tree: 2026-07-26.
Every claim below was checked, not remembered. If you change something here,
check it the same way.

<archive_policy>
- DO NOT read, scan, or query files inside `archives/` or `archive_docs/` unless explicitly commanded with "INSPECT ARCHIVE".
- WRITE POLICY: Write all session outputs, code diffs, or fresh documentation strictly to the root or designated active src folders. NEVER append or modify files in `archives/`.
</archive_policy>

## Agent Operating System
- Constitution: `docs/AGENT-OS.md` (roster, model routing, waterfall, handoff
  packet schema, command set, guardrails). Binding on every agent and session.
- Agent prompts: `.claude/agents/*.md` (10 agents, disjoint write scopes).
  Roster and quickstart: `.claude/agents/README.md`.
- Handoff packets: `.claude/handoffs/` (the only state that crosses a session
  boundary). Template: `.claude/handoffs/_TEMPLATE.md`.
- Artifact directories: `docs/strategy/`, `docs/arch/`, `docs/design/`,
  `docs/copy/`, `docs/qa/`.
- Start any multi-department initiative with `bg-orchestrator /plan`, run each
  stage in a fresh session, `/clear` between stages.

## Technical Stack & Architecture
- Frontend: React (Vite + Tailwind) on Netlify (`app.getbrandgeo.com`).
- Marketing Web: static HTML/JS on cPanel (`getbrandgeo.com`).
- Onboarding: `brandgeo-signup` wizard checkout.
- Collection functions:
  - `collect-prompt.js`, the fast HTTP engines. `FAST_ENGINES` is
    `['gemini','perplexity','meta','google_ai']` (`:33`).
  - `collect-claude.js` (Claude SSE), `collect-chatgpt.js` (ChatGPT plus
    `web_search_preview`), `_analysis.js` (shared response analysis).
- Engine lineup: `meta` is RETIRED as of 2026-07-16 and is in no plan set. It is
  kept in `ENGINE_META` so historical rows still render, and in `FAST_ENGINES` so
  a stale request does not error (`planConfig.ts:41`, `collect-prompt.js:31`).
  `google_ai` (Google AI Mode via SerpApi) went live 2026-07-16 and is Growth PRO
  and up only, to cap SerpApi spend (`planConfig.ts:43`).
- Collection is server-side: a queue plus `collection-worker-background` plus an
  hourly `schedule-collections` cron that is inert while `refresh_cadence` is
  `manual` (the default). Note `docs/STATE-OF-PRODUCT.md` §4.1 is STALE on this
  and still describes the old browser-driven model.
- Plan ladder single source of truth is `src/lib/planConfig.ts`. `_cost.js` is a
  current mirror and is the copy that ENFORCES entitlement and budget.
  `_plans.js` is a DRIFTED mirror, see the Growth PRO defect below.

## Deploy Pipelines (read this before reporting a deploy as broken)

Two independent pipelines. A failure in one says nothing about the other.

- **`getbrandgeo.com` (marketing) deploys via GitHub webhook to
  `brandgeo/web/deploy.php` on cPanel.** Netlify is not involved.
- **`app.getbrandgeo.com` (dashboard) deploys via Netlify** from
  `brandgeo-dashboard/`.

**Netlify showing "Canceled" on a run of deploys is normal and intended.**
`brandgeo-dashboard/netlify.toml` sets
`ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."`. Netlify's
`ignore` inverts the usual convention: exit 0 means cancel. `git diff --quiet`
exits 0 when nothing changed, so any push that does not touch
`brandgeo-dashboard/` is cancelled on purpose, and the UI labels that "Canceled"
rather than "Skipped". Without it the dashboard would rebuild on every marketing
and blog push. `$CACHED_COMMIT_REF` tracks the last commit actually built, so the
diff is cumulative and no dashboard change is ever lost to a run of cancellations.

Verified live 2026-07-26:
- `getbrandgeo.com/site.js` line 1 is `/* build: 2026-07-26 hook-rebuild */`, so
  the cPanel pipeline is delivering. `index.html` carries the same stamp as its
  first `<body>` comment.
- CSP is a response header from `brandgeo/web/.htaccess`, not a meta tag, and the
  live header includes `connect-src ... https://app.getbrandgeo.com`.
  `deploy.php` has no dotfile filter, so `.htaccess` copies normally.

## Active & Delivered State
- Marketing site: live and current. Homepage hook rebuild, CSP fix, build stamp,
  and the instant-audit endpoint fix are all deployed and verified.
- Content pipeline: BG-001 through BG-019 are live in `brandgeo/web/`
  (19 `bg-*.html` files, counted).
- Dashboard: UI/shell redesign phases 0 to 5 delivered. **No dashboard commit has
  landed since `2c0f281` (2026-07-24 02:28).** The live bundle was confirmed by
  fetching it: it contains `Managed €900` and does not contain `€449`,
  `Pro (legacy)`, or `promotions-admin`.

## Dashboard: committed 2026-07-26, NOT YET PUSHED

Two commits sit on local `main` and have not been pushed, so they are not live.
Pushing them is the first dashboard deploy since `2c0f281` and Netlify WILL
build this time, because `brandgeo-dashboard/` finally changed.

- `34e41bb` `fix(app)`: aligns `PLAN_TIERS` with the 2026 ladder (Free,
  Essentials €99, Growth €299, Growth PRO €449, Managed from €1,500, Enterprise
  custom). Legacy `pro` is dropped from the offered ladder and re-inserted,
  labelled legacy, only for a client still on it, positioned before Enterprise
  per `planConfig.ts:159` so Enterprise still reads as an upgrade for them. This
  closes the live mismatch where the dashboard showed Managed €900 while the
  marketing site published €1,500 in its JSON-LD product schema
  (`index.html:82` to `:85`).
- `3dadd8b` `feat(app)`: the admin Promotions panel plus its backend,
  `promotions-admin.js` (list/create/toggle, service key behind
  `requireAuth({ adminOnly: true })`), plus
  `db/supabase-promotions-migration.sql`.

**The promotions migration has NOT been applied.** Until it is, every query
fails with Postgres 42P01 and `promotions-admin.js` returns 404, which is the
exact signal `PromotionsPanel.tsx` keys its "backend isn't deployed yet" banner
off (`:77`, `:113`, `:124`). Deploying ahead of the migration is safe and
degrades visibly. Nothing on the checkout path reads the table and no Stripe
coupon is created, so applying it cannot change what any customer is charged.

Note `promotions-admin.js` validates plans against `_cost.js`, not `_plans.js`.
Validating against the drifted mirror would reject a promo targeting Growth PRO,
which is C1 one layer down. `_auth.js:28` derives its plan list the same way.

## Growth PRO Is Unsellable And Unassignable (revenue defect)

Found by `bg-architect`, recorded in `docs/arch/activation-path.md` §3.
`planConfig.ts` is authoritative and `_cost.js` matches it, so entitlement and
spend are NOT affected. `_plans.js` is the lone drifted mirror, and it has two
customer-visible consequences:

- **C1.** `_plans.js:9` `PLAN_ORDER` has no `growth_pro`, and
  `set-client-plan.js:116` gates on its `isValidPlan`. `set-client-plan` is the
  only admin path that writes `clients.plan`, so Growth PRO cannot be assigned by
  anyone. It also has no Stripe price or checkout link (`site.js:513`,
  `stripe-webhook.js:37` to `:45`), so it cannot be bought self-serve either. The
  €449 tier at the centre of `docs/PRICING-STRATEGY-2026-07.md` exists in
  `planConfig.ts`, `_cost.js` and the Account UI, and nowhere that can put a
  client on it.
- **C2.** `_plans.js:20` gives Growth five engines including `google_ai`.
  `planConfig.ts:49` and `_cost.js:112` give four, deliberately. So a client
  upgrading to Growth is emailed a written promise of "Google AI Mode", an engine
  the product will never collect for them, at the moment they pay more.

Fix direction is specified in `activation-path.md` §3.4 (regenerate `_plans.js`
from `planConfig.ts`, delete its duplicate `PLAN_ENGINES` and require `_cost.js`
instead). It is `bg-backend` work and must follow `bg-verify`.

## Conversion Initiative: where the waterfall actually stands

Plan: two independent waterfalls off one shared strategy stage. See
`docs/AGENT-OS.md` §3 for the protocol.

| Stage | Agent | Artifact | State |
|---|---|---|---|
| S0 | bg-strategy | `docs/strategy/hook-thesis-web.md`, `docs/strategy/activation-thesis-app.md` | DONE |
| A1 | bg-design | `docs/design/homepage-hook.md` | DONE |
| A2 | bg-copy | `docs/copy/homepage-hook.md` | NOT STARTED, `docs/copy/` is empty |
| A3 | bg-web | `brandgeo/web/index.html`, `site.js` | NOT STARTED |
| A4 | bg-verify | `docs/qa/web-hook-verification.md` | NOT STARTED |
| B1 | bg-verify | `docs/qa/product-funnel-gating-truth.md` | **NOT RUN, `docs/qa/` is empty** |
| (unplanned) | bg-architect | `docs/arch/activation-path.md` | DONE, ran in B1's slot |
| B2 to B5 | design, copy, app, verify | | BLOCKED on B1 |

Known protocol breaks, fix before continuing:

1. **B1 was skipped.** `bg-architect` ran where `bg-verify` was scheduled. B1 was
   mandatory-before-build because the surface touches billing and plan gating.
   `activation-path.md:498` even writes B1's acceptance criteria, assuming it runs.
2. **The packet trail is missing.** `.claude/handoffs/` holds only `001`.
   `homepage-hook.md:3` cites packet `002` and `activation-path.md:3` cites `003`;
   neither file exists, so nothing downstream can cold-start per §4.
3. **Packet number collision.** `bg-architect` ran as `003`, while
   `homepage-hook.md` §13 drafts its `bg-copy` packet as `003` and `bg-web` as
   `004`. Renumber before materialising any of them.
4. **Filename drift.** The plan named `docs/design/web-hook-and-conversion.md`;
   the artifact is `docs/design/homepage-hook.md`. Downstream `scope_read` lists
   must cite the real name.
5. `bg-architect` read the WORKING TREE, not `HEAD`. Its `Account.tsx:41`
   citation points at the uncommitted ladder above. C1's core claim
   (`set-client-plan.js:116`) is committed code and stands regardless.

## Priority Backlog & Open Actions

Ordered. Top item is the one that costs money today.

- [ ] **Fix `_plans.js` drift (C1 and C2 above).** A paying Growth customer is
      currently promised an engine they do not receive, and the €449 tier cannot
      be sold or assigned. `bg-verify` first, then `bg-backend`.
- [ ] **Push `34e41bb` and `3dadd8b`**, then apply
      `db/supabase-promotions-migration.sql` to the live project. Until the push
      the pricing mismatch is still live; until the migration the Promotions
      panel shows its "not deployed yet" banner (which is correct, not a bug).
- [ ] **Run B1 (`bg-verify`) before any product build**, with the mandate widened
      to adjudicate C1/C2 and to independently confirm the `role` provisioning
      path. `provision-account.js:57` writes `role: 'viewer'` and
      `signup-client.js:21` states it writes no role, so `SECURITY-AUDIT.md` F1
      looks closed, but that reading came from `bg-architect`, not from an
      independent review.
- [ ] **Continue Waterfall A**: `bg-copy` against `docs/design/homepage-hook.md`
      §13.1, then `bg-web`, then `bg-verify`.
- [ ] Wire promotions to Stripe coupons and to redemption at checkout. The table
      and admin CRUD exist as of `3dadd8b`; nothing prices or discounts anything
      yet, by design (`PRICING-STRATEGY-2026-07.md` §8).
- [ ] Create the Stripe price and checkout link for Growth PRO (external
      dependency, sequencing is `bg-strategy`'s per `activation-path.md` §5.5).
- [ ] Decide whether `PLAN_PROMPTS` is enforced server-side or stays display-only
      (`activation-path.md` §5.4).
- [ ] Decide whether `free` clients get a non-manual `refresh_cadence`, a spend
      decision against a €0.30 monthly budget (`activation-path.md` §5.3).
- [ ] Refresh `docs/STATE-OF-PRODUCT.md` §4.1, stale on collection architecture.
- [ ] Sonnet 5 / Opus 4.8 hybrid model migration in the collection functions.
- [ ] Shared authentication / SSO with TalentWeLove and RecruiterAI portals.

Closed 2026-07-26:
- ~~Confirm cPanel re-upload of `index.html` + `site.js` (CSP fix landing).~~
  Verified live: build stamp present in both files, CSP header carries
  `app.getbrandgeo.com`. See Deploy Pipelines above.
- ~~Scheduled background triggers for engine evaluation runs.~~ Already built:
  `schedule-collections` runs hourly and is inert by default. What remains is the
  cadence decision, listed above.

## 9. Weekly Content Pipeline Log (Roadmap / Wednesday content / Friday LinkedIn)

Recent `ROADMAP-*.md` and `linkedin-posts-*.md` files live in `docs/`, not the
repo root, per the reorg commit `5326a59`. Older docs in `docs/` and `brandgeo/`
reference a much longer numbered `CLAUDE.md` (sections 8, 11, 12, 13, 14, 18.1)
that no longer exists; that history is not recoverable here, so do not try to
reconstruct it. The BG-001 through BG-005 staleness flagged on 2026-07-24 is
fixed above: 19 pages are live.

- **2026-07-24 (Friday LinkedIn task):** Reconstructed the week from
  `docs/ROADMAP-2026-07-20.md`, `docs/linkedin-post-bg-018-2026-07-22.md`,
  `brandgeo/BG-018-linkedin-asset.md`, `brandgeo/BG-019-linkedin-asset.md`, and
  git log. Real publishes: BG-018 (live 2026-07-22) and BG-019 (committed
  2026-07-24, `e6d9af4`, hero image present). Drafted
  `docs/linkedin-posts-2026-07-24.md`: 4 personal plus 4 company posts (BG-019
  new angle, a BG-018 plus BG-019 series post, London city research, BG-011
  Reddit citations), all previously unfeatured on LinkedIn. Newsletter skipped
  (Issue #2 not due until ~2026-08-13). Native Article skipped (last one
  2026-07-16, cadence is 3 to 4 weeks). Zero em dashes, verified by grep.
