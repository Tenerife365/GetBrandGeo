# AI SEO — the content-action layer (spec)

> Opened 2026-07-21. The missing middle of the product loop:
> **AI Visibility measures → AI SEO acts on content → AI Social distributes.**
> AI Visibility tells a brand where it's absent from AI answers; Recommendations
> says "publish/fix content"; today nothing turns that into actual content work.
> AI SEO is that engine: generate new content for the gaps, audit + optimize the
> brand's existing pages to be more quotable, flag cross-page inconsistencies —
> and feed the result into AI Social.

## Confirmed decisions (founder, 2026-07-21)
1. **Scope v1 = the full loop:** new-content briefs from visibility gaps **and**
   crawl + optimize existing pages **and** consistency/accuracy flags, all feeding
   AI Social. (Built phased — see Phasing; Phase 1 ships the new-content half,
   which needs no crawler.)
2. **Output = tiered:** a **brief** by default (cheap, always), with a **"Draft it"**
   action that generates the full GEO-scored piece on demand.
3. **Process:** this spec first, then build in a dedicated "AI SEO" chat.

## Module boundaries — what AI SEO OWNS vs REUSES

**Owns (new):** a gated `/seo` page (Opportunities / Site audit / Consistency tabs),
the brief→draft pipeline, the crawler + per-page GEO audit, and cross-page
consistency detection. New tables + functions below.

**Reuses (do NOT rebuild):**
- **`social-boost.js`** already turns GEO data (prompt-level mention-rate gaps from
  `ai_results`, open `recommendations`, `competitors`) into grounded idea cards with a
  `context` string. **Factor its data-gathering into a shared `_geo_signals.js`** that
  both `social-boost` and the new `seo-opportunities` call, so Social and SEO draw from
  one grounded source of truth. AI SEO's "Opportunities" is the same signals shaped as
  *content* briefs (pages/articles) instead of *social post* ideas.
- **`social-generate.js`** — the per-platform writer. The AI SEO → AI Social handoff is:
  pass a brief/draft's `context` into `social-generate` (exactly how Social Boost already
  bridges to it). No new social plumbing.
- **GEO scoring rubric** — `geo-seo-scoring-prompt.md` (repo root) scores drafts; reuse
  it as the draft acceptance gate (target ≥90/90 like the bg-* articles).
- **Feature gating** — `planConfig.ts` `FEATURE_MIN_PLAN` / `hasFeature` / `FeatureLocked`
  (shipped 2026-07-21). AI SEO is another gated feature; add `ai_seo` there.
- **Recommendations engine** — `generate-recommendations.js` / `Recommendations.tsx`.
  AI SEO is the DEEP content layer beneath the "Fix This" recs, not a replacement.
  A rec like "publish content about X" becomes an AI SEO brief.
- **Content pipeline knowledge** — the Master-Writer article conventions (`bg-*` template,
  related-research blocks, hero-image guide) for what a good GEO page looks like.

## Data flow

```
AI Visibility (ai_results, prompts)  ┐
Recommendations (recommendations)    ├─►  _geo_signals.js  ──► seo-opportunities  ──► seo_briefs
Competitors (competitors)            ┘        (shared)              (deterministic)      │
                                                                                          │ "Draft it"
client site (sitemap + Firecrawl) ──► seo-crawl ──► seo_pages ──► seo-audit-page          ▼
                                                        │            (LLM, per page)    seo-draft (LLM, GEO-scored)
                                                        └──────────► seo-consistency        │
                                                                     (LLM, corpus)          ▼
                                                                                     AI Social (social-generate)
```

## The crawler (existing-content ingestion) — the one genuinely new capability

To optimize existing content we must fetch the client's pages. Decision for the build
chat (recommendation in **bold**):
- **Firecrawl via the `prometheus` skill** (available in this environment) for robust
  crawl of JS-rendered sites + clean markdown extraction — **recommended**, with a
- **sitemap.xml + server-side `fetch` fallback** for simple static sites (free, no dep).
- Respect `robots.txt`; cap pages/crawl by plan (e.g. 25/50/100); crawl is slow →
  a **Netlify Background Function** (`seo-crawl-background`, up to 15 min, no `timeout`
  key — same pattern as `run-full-audit-background`). Cache pages in `seo_pages`; only
  re-crawl on demand or a schedule.

## Data model (new tables — all client_id + standard RLS `is_admin() OR client_id = get_my_client_id()`)

- **`seo_briefs`** — new-content opportunities.
  `id, client_id, source ('visibility_gap'|'recommendation'|'competitor'|'manual'),
   title, target_prompt, outline jsonb, guidance text, target_entities jsonb,
   status ('idea'|'drafting'|'drafted'|'published'|'dismissed'), draft_text,
   geo_score jsonb, context text, created_at, updated_at`.
- **`seo_pages`** — crawled-page cache + audit.
  `id, client_id, url, title, content_md text, fetched_at, geo_score int,
   audit jsonb ({issues:[], suggestions:[]}), status ('audited'|'stale'), created_at`.
  Unique `(client_id, url)`.
- **`seo_consistency`** — cross-page flags.
  `id, client_id, kind ('conflict'|'outdated'|'missing'), description, urls jsonb,
   severity ('low'|'med'|'high'), status ('open'|'resolved'|'dismissed'), created_at`.
- **`seo_crawls`** (optional run log) — `id, client_id, started_at, finished_at,
   pages int, status, error`.

## Backend functions (new, `netlify/functions/`)

- **`_geo_signals.js`** — shared: extract social-boost's gap/rec/competitor gathering.
  (Refactor `social-boost.js` to consume it — no behaviour change.)
- **`seo-opportunities.js`** — deterministic, admin-or-owner. `_geo_signals` → content
  briefs (outline + target prompt + guidance + entities), upsert into `seo_briefs`.
- **`seo-draft.js`** — LLM (Haiku default / Sonnet for premium). Turns a brief into a
  full GEO-scored draft; stores `draft_text` + `geo_score`. The tiered "Draft it" step.
- **`seo-crawl-background.js`** — background: sitemap + Firecrawl → `seo_pages`.
- **`seo-audit-page.js`** — LLM per page: GEO-quality audit (clear claims, entities,
  FAQ/schema, freshness, direct answers) → `audit` + `geo_score`.
- **`seo-consistency.js`** — LLM over the crawled corpus → `seo_consistency` flags.
- Handoff to social reuses **`social-generate.js`** (pass brief/draft `context`).

Timeouts: LLM functions = 26; crawl = background (no timeout key). Follow the
`_admin_notify`/`social-*` conventions. Every failure path returns HTTP 200 `{error}`.

## Frontend

- **`src/pages/SEO.tsx`** — three tabs:
  - **Opportunities** — brief cards (source badge like Social Boost's Gap/Fix/Vs),
    each with outline + "Draft it" (→ `seo-draft`) + "Send to AI Social" (→ prefill the
    composer via the existing Social Boost path) + dismiss.
  - **Site audit** — a "Crawl my site" action, then per-page rows with GEO score +
    issues + suggested edits; "Draft revision."
  - **Consistency** — flagged conflicts/outdated facts across pages, with the pages
    involved; resolve/dismiss.
- **Route** `/seo` (PrivateRoute + Layout), **nav** in Layout's Manage group (icon e.g.
  `Search`/`FileSearch`), gated with `hasFeature(plan,'ai_seo')` + the nav lock pattern
  just shipped for AI Social.
- **Gate:** `SEO.tsx` early-returns `<FeatureLocked feature="ai_seo" />` for below-plan
  clients; admins keep access.

## Feature gating — OPEN DECISION (confirm at build)
`FEATURE_MIN_PLAN.ai_seo`: **Growth** (parity with AI Social — they're one loop, easiest
to sell as a bundle) vs **Managed** (premium upsell, given the crawl + heavier LLM cost).
Recommendation: **Growth** for the Opportunities half, but consider Managed-gating the
crawl/audit half if cost warrants. Decide when Phase 2 lands.

## Cost & scale
- Opportunities briefs = deterministic (free) + optional draft (1 LLM call). Cheap.
- Crawl + per-page audit + consistency = the heavy part: ~1 LLM call/page + 1 corpus call.
  **Cap pages/crawl by plan, cache in `seo_pages`, re-crawl only on demand/schedule.**
- Reuse the cost-accounting the product already tracks (fold new LLM calls into it).
- Draft generation should have a per-plan monthly cap (mirror the SerpApi weekly-cap idea).

## Phasing (scope is "both", sequenced so value ships early)
- **Phase 1 — Opportunities (no crawler):** `_geo_signals` refactor, `seo-opportunities`,
  `seo-draft`, `SEO.tsx` Opportunities tab + gating + nav. Ships the new-content half fast
  off data we already have; proves value. **This is the first build-chat target.**
- **Phase 2 — Site audit:** `seo-crawl-background` (Firecrawl + sitemap), `seo-audit-page`,
  the Site-audit tab. The crawl/optimize half.
- **Phase 3 — Consistency:** `seo-consistency` + tab.
- **Phase 4 — Polish:** scheduled re-crawl, GEO-score trends, deeper AI Social handoff
  (auto-repurpose a published page into a social campaign), CMS-publish exploration.

## Open decisions / risks (resolve in the build chat)
1. `ai_seo` min plan (Growth vs Managed) — above.
2. Crawler: Firecrawl (paid, robust) vs sitemap+fetch (free, limited) — recommend
   Firecrawl + fallback.
3. "Publish" semantics: v1 provides the content + AI Social handoff; pushing to the
   client's CMS/WordPress is OUT of scope for v1 (big integration surface).
4. Draft cost cap per plan.
5. Multi-language: clients are worldwide; audit/draft prompts must not assume EN/RO
   (the same lesson as the `_analysis.js` lexicon rounds).

## Kickoff for the build chat
Open a fresh chat, title `AI SEO · 2026-07-21` (or `#seo · phase 1`), first message:
`Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then start AI SEO
Phase 1 per AI-SEO-SPEC.md — refactor social-boost's signal-gathering into
_geo_signals.js, then build seo-opportunities + seo-draft + the SEO.tsx Opportunities
tab with feature gating (ai_seo).`
This is architecture/reasoning — Opus 4.8 per the hybrid-routing rule. Set the model
before sending.

---

## ✅ Phase 1 BUILT (2026-07-21) — code-complete + build-verified, NOT yet deployed

The Opportunities half is built end to end. `tsc --noEmit` clean, `npm run build`
passes, `node --check` clean on all new/changed functions.

**Decisions taken at build:**
- **`ai_seo` min plan = Growth** (parity with AI Social; the spec's own recommendation
  for the Opportunities half). One-line flip in `planConfig.ts` (`FEATURE_MIN_PLAN`) if
  you'd rather Managed-gate it — revisit when the Phase 2 crawl/audit half lands.
- **Draft model = Haiku default / Sonnet on `premium:true` (Haiku fallback)**, reusing
  `ANTHROPIC_API_KEY`. Premium is wired in the function but NOT yet exposed in the UI.
- **Per-plan monthly draft cap** (cost control): growth 10 / managed 30 / pro 60 /
  enterprise 200; **admins bypass** it (managed/done-for-you work). Counted via
  `seo_briefs.drafted_at`.
- **Phase 1 migration = `seo_briefs` only.** The crawler tables (`seo_pages`,
  `seo_consistency`, `seo_crawls`) are deliberately deferred to Phase 2/3.

**Files:**
- **Migration** `supabase-seo-briefs-migration.sql` (repo root) — `seo_briefs` table +
  standard RLS (`is_admin() OR client_id = get_my_client_id()`) + `seo_set_updated_at()`
  trigger. Unique `(client_id, source, source_ref)` makes the generator idempotent.
- **`netlify/functions/_geo_signals.js`** — shared GEO signal gathering, extracted from
  `social-boost.js` (which now consumes it — no behaviour change; verified). Both AI
  Social and AI SEO now draw from one source of truth.
- **`netlify/functions/seo-opportunities.js`** — deterministic (no LLM). Signals →
  content briefs, UPSERTed into `seo_briefs` (omits status/draft/geo_score on the
  payload so a dismissed or already-drafted brief keeps its state across regenerations).
- **`netlify/functions/seo-draft.js`** — the "Draft it" LLM step. Loads a brief (scoped
  to the client), enforces the monthly cap, writes a full GEO-scored draft + self-score
  into `draft_text`/`geo_score`/`status='drafted'`. Fail-open (HTTP 200 `{error}`), and
  language-agnostic (writes in the buyer query's own language, per open-decision 5).
- **`src/pages/SEO.tsx`** — Opportunities tab (brief cards with source badge, expandable
  outline, Draft it, Send to AI Social, dismiss + inline draft/score view). Site audit
  and Consistency tabs render clear "coming next" placeholders (Phase 2/3 shells).
  Early-returns `<FeatureLocked feature="ai_seo" />` for below-plan clients; admins keep
  access.
- **`src/pages/Social.tsx`** — reads a `brandgeo_social_prefill` sessionStorage handoff
  on mount so "Send to AI Social" lands a brief + grounding straight in the composer
  (applied once, after the workspace-reset effect, so it isn't wiped).
- **`src/App.tsx`** `/seo` route; **`src/components/Layout.tsx`** nav entry (Manage group,
  `FileSearch` icon) + lock for below-plan clients; **`planConfig.ts`** `ai_seo` feature;
  **`src/types/index.ts`** `SeoBrief`/`SeoGeoScore` types; **`netlify.toml`** timeouts
  (seo-opportunities 15, seo-draft 26).

**REQUIRES CONSTANTIN'S ACTION to go live (in order):**
1. **Apply the migration FIRST:** run `supabase-seo-briefs-migration.sql` once in the
   Supabase SQL editor (project `duiyifepitvugyulobqm`). Safe to re-run. Verify with the
   query in the file header (RLS on, all policies `{authenticated}`, no bare `qual=true`).
2. **Commit + push** the dashboard changes (Netlify auto-deploys the functions + frontend).
   No new env vars — `ANTHROPIC_API_KEY` is already set. Targeted add (another session
   may have uncommitted `social-brandkit`/other work): the 8 files listed above under
   `brandgeo-dashboard/` plus `netlify.toml`, and `supabase-seo-briefs-migration.sql` at
   repo root.
3. **Smoke-test** on a Growth+ client (or as admin on any client): open **AI SEO →
   Opportunities → Find opportunities** (best after a collection has run so there are real
   gaps), then **Draft it** on a brief, then **Send to AI Social** (should land in the
   composer with the brief + grounding prefilled).

**Next:** Phase 2 (Site audit) — `seo-crawl-background` (Firecrawl via `prometheus` skill
+ sitemap fallback), `seo-audit-page`, the Site-audit tab; then Phase 3 (Consistency).
