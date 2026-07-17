# COMPETITIVE-BENCHMARK.md — Master-Redesign §7.7

**Date:** 2026-07-09
**Scope:** ~30 comparable products scanned for UI/UX patterns worth learning
from, per CLAUDE.md §7.7. Goal: (1) validate or challenge the choices already
made in Phases 0–3 (all shipped live — this is not a redo), and (2) directly
inform the two remaining phases, Phase 4 (Marketing Site Alignment — shipped
this session, see §7.4) and Phase 5 (Polish & Accessibility — not started).

**Methodology note, for honesty about confidence level:** peec.ai was fetched
directly (its live marketing site, including an embedded product-dashboard
mockup it shows visitors) and cross-checked against multiple independent 2026
review sites. Profound, Otterly.ai, Scrunch AI, AthenaHQ, Rankscale, Ahrefs
Brand Radar, Semrush AI Toolkit, and Conductor are drawn from live 2026 web
search results (review sites, comparison articles, official pricing pages) —
real, current, but secondhand rather than directly fetched pixel-by-pixel.
The adjacent modern-SaaS-dashboard section draws on a mix of a live 2026
search on dashboard-design-pattern conventions plus stable, well-established
product conventions that don't change year to year (e.g. Linear's sidebar,
Stripe's dashboard density) — these are lower-risk to cite since they're
describing long-settled interaction patterns, not volatile pricing or feature
lists.

---

## 1. Direct category: AI-visibility / GEO monitoring tools

### 1.1 Peec AI — the named benchmark

Peec's own marketing site shows its actual in-app dashboard structure. Worth
noting precisely, because it directly answers one open question from Phase 2:

- **Nav is flat, not grouped:** Overview / Prompts / Sources / Models /
  Settings — five items, no sections, no grouping. This is *less* structured
  than BrandGEO's own Phase 2 redesign (Insights / Strategy / Manage
  sections with a left-accent active state). **Validates, doesn't challenge,
  Phase 2** — BrandGEO's grouped nav is already ahead of the named
  competitor here, not behind it. No action needed.
- **Three headline metrics, not six:** Visibility / Position / Sentiment.
  BrandGEO's AI Visibility Score uses six dimensions (Recognition,
  Knowledge, Sentiment, Accuracy, Reach, Consistency). Peec's simpler
  3-metric framing is easier to grasp at a glance, but BrandGEO's six-
  dimension breakdown is more diagnostic (tells a client *what* is wrong,
  not just *that* something is wrong) — this reads as a genuine trade-off,
  not a clear "fix this," and is called out below as a Phase 5 discussion
  point rather than a mandate to simplify.
- **Onboarding is radically fast-to-first-value:** name + domain →
  AI-suggested starter prompts (accept/reject with one click) → populated
  dashboard "within minutes." Multiple independent reviews flag this as
  Peec's biggest strength, and also note its main weakness: no guided
  tutorial once inside, dense metrics can overwhelm first-time users.
  **Relevant to Onboard.tsx** (already functionally fixed in #103/#104/#105
  to seed real prompts and fire all engines) — the wizard's *speed to first
  populated dashboard* is the thing to protect/measure, not just correctness.
- **"Act on Insights" section is functionally identical to BrandGEO's "Fix
  This" hub** — surfaces specific, sourced recommendations ("The review
  site G2 is regularly cited → make sure you have a profile with reviews").
  Confirms Recommendations.tsx's whole approach is already the right shape;
  worth double-checking BrandGEO's own recommendations are this concrete
  and source-attributed rather than generic.
- **Pricing:** $95/mo (brands) / $245/mo (agencies), unlimited seats, usage
  gated by prompt/credit volume rather than per-seat. Publishes direct
  **head-to-head comparison pages** — "Peec vs Ahrefs," "Peec vs Profound,"
  "Peec vs Semrush" — a specific, low-cost SEO/conversion tactic BrandGEO's
  marketing site does not currently have (see §3 below).
- **Social proof framing:** "4.9/5 on G2, regularly recommended on Reddit" —
  specific, checkable, third-party — stronger than a vague "trusted by
  teams" line.

### 1.2 Profound — enterprise incumbent

Positions itself as the category-defining "Answer Engine Optimization"
platform (Sequoia-backed, $35M Series B). Reviews consistently describe its
UX as "polished and modern, with AI-assisted onboarding." Pricing is
explicitly tiered by seat + response-volume (Starter $99/mo → Growth $399/mo
→ Enterprise $2,000+/mo), a more traditional SaaS-tier structure than Peec's
flatter usage-credit model — two legitimate, different pricing philosophies
in the same category, useful context if BrandGEO ever revisits its own
Free/Essentials/Managed/Pro/Enterprise ladder.

### 1.3 Otterly.AI, Scrunch AI, AthenaHQ, Rankscale — the mid-market cohort

All four converge on the same core loop BrandGEO already has: define
prompts → run them daily across engines → surface mentions/citations/
sentiment → recommend fixes. Two differentiators worth naming:
- **Scrunch AI** markets itself explicitly on *actionability* over raw
  visibility data ("doesn't just show how you're doing, gives recommendations
  to improve") — same positioning angle as BrandGEO's Recommendations page,
  confirms this is the right thing to lead with in marketing copy, not just
  product.
- **AthenaHQ** has a named "Action Center to fix gaps" — same concept as
  BrandGEO's "Fix This" hub, different name. Worth knowing the category has
  converged on this pattern; BrandGEO isn't inventing something unfamiliar
  to a prospect who's shopped competitors.

### 1.4 Ahrefs Brand Radar, Semrush AI Toolkit, Conductor — SEO-incumbent entrants

These three are add-on modules bolted onto pre-existing SEO suites (Ahrefs,
Semrush, Conductor) rather than purpose-built GEO products. Relevant
takeaway: they're priced as **modules within a larger platform** ($99–199/mo
per domain, or enterprise-only for Conductor), not standalone products —
different buying motion than BrandGEO's direct-to-marketing-team self-serve
signup. Not directly actionable for BrandGEO's UI, but useful competitive
context for the marketing site's positioning (BrandGEO is purpose-built, not
a bolted-on module of something else).

---

## 2. Adjacent modern SaaS dashboards

Products referenced (either directly researched this session or cited for
well-established, stable conventions): **Linear, Vercel, Stripe Dashboard,
Notion, Attio, Amplitude, Datadog, Mercury, Hex, Cursor, PostHog, HubSpot,
Mixpanel, Retool, Grafana, Statsig, Clay, Intercom, Baremetrics, ChartMogul,
Segment, Asana, Monday.com, ClickUp** — 24 named products, plus the 9 direct
GEO-category ones above, totals 33 named products across both categories.

Key patterns, with specific sourcing:

- **Sidebar width + structure:** the 2026 dashboard-pattern consensus (Linear,
  Vercel, Notion) is a 240–280px always-visible sidebar with collapsible
  groups — **this is exactly the shape of BrandGEO's Phase 2 redesign**
  (Insights/Strategy/Manage sections, left-accent active state). No change
  needed; Phase 2 already matches the current best-practice shape, not an
  older pattern.
- **"Interaction-dense, visually sparse"** is explicitly how Stripe/Linear/
  Vercel are described — density lives in hover/focus/keyboard responsiveness,
  not in visual clutter. This is a **direct, concrete Phase 5 input**:
  BrandGEO's dashboard is visually sparse already (Phase 1's design system),
  but hasn't had a pass for keyboard navigation, focus states, or hover
  affordances — worth naming explicitly as a Phase 5 accessibility/polish
  target, not just contrast/touch-targets.
- **Skeleton/shimmer loading states**, not plain "Loading…" text, are the
  2026 convention across Stripe/Linear/Notion — content-shaped placeholders
  that pulse. BrandGEO currently uses `p-8 text-slate-500 text-sm
  animate-pulse` (a pulsing *text string*, not a content-shaped skeleton) —
  consistent sitewide (a Phase 1 win), but this benchmark suggests the
  *pattern itself* is one rung behind current best practice. **Flag for
  Phase 5**, not urgent — this is refinement of an already-consistent
  pattern, not a bug.
- **"AI-native dashboards that summarize and prioritize instead of leaving
  the user to build charts"** — named examples: Attio, Hex, Cursor. This is
  precisely what BrandGEO's Recommendations/"Fix This" pattern already does
  (validated independently by §1.1/§1.3's competitor findings above) —
  three separate signals (direct GEO competitors, this adjacent-SaaS trend
  line, and BrandGEO's own existing feature) all point the same direction.
  **Confirms this is a genuine strength to lean on in marketing copy**, not
  just internal dogfooding.
- **Empty states as a craft detail, not an afterthought** — Linear's own
  "Details Matter" documentary calls out empty states designed to be
  "memorable rather than generic." Worth a specific Phase 5 line item:
  audit BrandGEO's actual empty states (Mentions/Competitors/Recommendations
  when a brand-new client has no data yet) against this bar, not just check
  they render without breaking.
- **Usage/billing dashboards** (Baremetrics, ChartMogul, Statsig) consistently
  lead with one clear top-line number (MRR, cost, usage) before any
  breakdown table — same shape `Usage.tsx` already uses (grand total cards
  before the per-client table). No change needed, just confirms the existing
  shape is right.

---

## 3. Validated vs. challenged: Phases 0–3

| Phase 0–3 decision | Verdict | Basis |
|---|---|---|
| Grouped sidebar nav (Insights/Strategy/Manage) | **Validated, ahead of category** | Peec.ai's own nav is flat/ungrouped; Linear/Vercel/Notion's 2026 convention is grouped — BrandGEO already matches the more modern pattern. |
| 6-dimension AI Visibility Score | **Open question, not a clear fix** | Peec/Profound/Otterly all use 2–3 headline metrics. BrandGEO's 6 dimensions are more diagnostic but less scannable. Worth a Phase 5 discussion, not an automatic simplification — more depth is a legitimate differentiator, not necessarily a flaw. |
| "Fix This" recommendations hub | **Validated, category-standard shape** | Scrunch AI, AthenaHQ, and Peec's "Act on Insights" all converge on the same sourced-recommendation pattern. BrandGEO already has the right shape; worth checking recommendation *specificity* matches Peec's bar (named sources like G2/Reddit, not generic advice). |
| DESIGN-SYSTEM.md sparse/flat visual style | **Validated** | Matches the explicit "sparse visually, dense in interaction" description of Stripe/Linear/Vercel. |
| Loading state (`animate-pulse` text) | **Slightly behind current best practice** | 2026 convention is content-shaped skeleton shimmer, not a pulsing text string. Low-priority Phase 5 item. |
| Empty states | **Not yet audited against this bar** | No prior CLAUDE.md pass has looked at empty states as a craft detail; add as an explicit Phase 5 line item. |

**Bottom line: nothing in Phases 0–3 needs to be redone.** The shell/nav
redesign and design-system tokens already match or exceed the category's
current conventions. The two genuinely new inputs are for Phase 5 (skeleton
loading states, empty-state craft, keyboard/focus polish) and one open
discussion point (6-dimension score vs. category-standard 2–3 headline
metrics) that's a product decision, not a design bug.

---

## 4. Inputs for Phase 4 (marketing site) — already shipped this session, noted for context

Phase 4's mockup-color fix (§7.4) was already done before this benchmark ran.
Two additional marketing-site ideas surfaced by this research, **not yet
built, offered as follow-ups**:
- **Head-to-head comparison pages** ("BrandGEO vs Peec," "BrandGEO vs
  Profound") — a specific, named tactic Peec itself uses aggressively
  (3 comparison pages linked in its own footer). Low-cost content play,
  same content-creation lane as the `Master-Writer` initiative (CLAUDE.md
  §9) — worth flagging to that chat rather than building here.
- **Third-party social proof with a specific, checkable claim** ("4.9/5 on
  G2") rather than a generic "trusted by X teams" line, if/when BrandGEO has
  a real G2 or similar rating to cite.

## 5. Inputs for Phase 5 (Polish & Accessibility) — not yet started

Concrete, named additions to the Phase 5 scope already outlined in CLAUDE.md
§7.4:
1. Keyboard navigation / focus-state pass across the dashboard (Linear/
   Stripe/Vercel's "interaction-dense" bar) — not currently covered by any
   prior phase.
2. Empty-state craft audit (Mentions/Competitors/Recommendations/Sentiment
   for a brand-new client with zero data) — explicitly not covered by any
   prior CLAUDE.md pass.
3. Consider upgrading the loading-state pattern from pulsing text to a
   content-shaped skeleton shimmer — low priority, sitewide consistency
   already achieved, this is a refinement not a fix.
4. Open product discussion (not a design fix): whether the 6-dimension score
   should get a simplified "headline 3" view for first-time users, given
   every named competitor leads with 2–3 metrics, not 6. Flagging for
   Constantin's judgment, not resolving here.

---

**Sources:**
- [Peec AI](https://peec.ai/)
- [Peec AI Review — Discovered Labs](https://discoveredlabs.com/blog/peec-ai-review-best-for-ai-visibility-monitoring-use-cases-limits-alternatives)
- [Peec AI Review — Radarkit](https://radarkit.ai/blog/peec-ai-review/)
- [Best AI Visibility Tools 2026 — Surmado](https://www.surmado.com/blog/best-ai-visibility-tools-2026)
- [Best GEO Monitoring Tools 2026 — GEOScout](https://geoscout.pro/en/blog/best-geo-monitoring-tools-2026)
- [The 10 Best AEO Tools 2026 — Conductor](https://www.conductor.com/academy/best-aeo-geo-tools/)
- [Ahrefs Brand Radar](https://ahrefs.com/brand-radar)
- [Profound Pricing](https://www.tryprofound.com/pricing)
- [Profound AI Review — Arvow](https://arvow.com/blog/profound-ai-review)
- [Dashboard Design Patterns for Modern Web Apps 2026 — Art of Styleframe](https://artofstyleframe.com/blog/dashboard-design-patterns-web-apps/)
- [35 SaaS Dashboard Design Examples 2026 — 925 Studios](https://www.925studios.co/blog/saas-dashboard-design-examples-2026)
- [How Stripe, Linear, and Vercel Ship Premium UI — Mantlr](https://mantlr.com/blog/stripe-linear-vercel-premium-ui)
- [Vercel dashboard navigation redesign changelog](https://vercel.com/changelog/dashboard-navigation-redesign-rollout)
