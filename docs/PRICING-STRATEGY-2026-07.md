# PRICING-STRATEGY-2026-07.md — Final pricing, packaging & delivery-cost model

> **Status:** APPROVED for build (Constantin, 2026-07-21). Supersedes the tier
> shape in `PRICING-SPEC.md` (2026-07-09). This is the single source of truth —
> every surface copies numbers from here; a mismatch between any two surfaces is
> a bug. Nothing is implemented in this doc; the build task list is §12.

---

## 1. Decisions locked (this session)

- **Ladder collapsed & repositioned:** self-serve autopilot ladder tops out at
  **Growth PRO €449**; done-for-you starts at **Managed from €1,500**; Enterprise
  is **contact-only** (no public price). Old Managed €900 + Pro €1,500 are merged
  into the new Managed.
- **Growth is the hero** (highest-margin, zero-labor, full-loop, the tier to scale).
  **Essentials is the 2nd hero** (competitive entry, capped to create the upgrade itch).
- **Prompts reduced to market-minimum** — we out-*feature* competitors (the
  measure → act → distribute loop), not out-*number* them.
- **AI Social starts at Growth** (not Essentials).
- **Google AI Mode (SerpApi) = Growth PRO only** — protects the expensive SerpApi spend.
- **Collection cooldown** (countdown on the Run button) + **12% monthly € budget**
  are a **dual cap** (frequency + hard margin ceiling). Both required.
- **No grandfathering:** existing clients migrate to new prices, informed at next renewal.

---

## 2. The ladder + positioning

| | Free | **Essentials €99** | **Growth €299** ⭐ | **Growth PRO €449** | **Managed from €1,500** | Enterprise |
|---|---|---|---|---|---|---|
| Motion | self-serve | self-serve | self-serve | self-serve | done-for-you (+ full dashboard) | bespoke |
| Role | funnel | 2nd hero (entry) | **HERO** (full loop, 1 brand) | power self-serve | your AI-visibility team | contact |
| Audience line | "See where you stand." | "Track your brand in AI answers." | "Measure it, fix it, get it posted." | "Scale the whole loop." | "Your team, less than one hire." | "At scale, bespoke." |
| Annual | — | 2 months free | 2 months free | 2 months free | 2 months free (setup waived) | quoted |

Prices: Free €0 · Essentials €99 · Growth €299 · Growth PRO €449 · Managed from €1,500 · Enterprise custom.

---

## 3. The limit matrix (FINAL)

| Metered dimension | Free | Essentials €99 | Growth €299 ⭐ | Growth PRO €449 | Managed €1,500+ |
|---|---|---|---|---|---|
| **AI engines** | 1 (ChatGPT) | 3 (+Gemini, Claude) | **4** (+Perplexity) | **5** (+Google AI Mode) | 5+/all |
| **Buyer prompts** | 5 | 20 | **75** | 100 | custom |
| **Collection cooldown** | monthly | 72h | 48h | 36h | on-demand |
| **Monthly API budget (hard cap = 12% of price)** | €0.30 | €12 | €36 | €54 | higher/custom |
| **AI SEO — pages audited** | — | 1 (landing) | 10 | 30 | full site |
| **AI SEO — audits** | — | 1/week | 1/week | 1/week | ≥1/week |
| **AI SEO — content drafts / mo** | — | 2 | 10 | 30 | higher |
| **AI Social — channels** | — | — | **1** (of the 3 easy) | **3** (LinkedIn + GBP + Facebook) | full |
| **AI Social — Instagram / TikTok** | — | — | — | **add-on** | managed |
| **AI Social — posts / mo per channel** | — | — | 12 | 30 | higher |
| Onboarding / support | — | email | +1 call | priority | dedicated team |

**Why the numbers work (per-collection cost from `_cost.js`):**
ChatGPT €0.060 + Gemini €0.034 + Claude €0.010 + Perplexity €0.006 + Google AI €0.015.
- Essentials: 20 × €0.104 (3 eng) = €2.08/collection → €12 budget ≈ **~6 collections/mo** (~weekly).
- Growth: 75 × €0.110 (4 eng) = €8.25/collection → €36 budget ≈ **~4 collections/mo** (~weekly).
- Growth PRO: 100 × €0.125 (5 eng) = €12.50/collection → €54 budget ≈ **~4 collections/mo** (~weekly).
Everyone gets roughly weekly collection at **~88% gross margin**. The cooldown stops
button-thrash *within* the week; the budget caps the monthly total.

---

## 4. Social channel entitlements (cost-of-delivery tiering)

- **Included ("easy for us"):** LinkedIn, Google Business Profile, Facebook.
  - Growth = pick **1** of the three. Growth PRO = **all 3**.
- **Paid add-on ("harder": needs media + more support):** Instagram, TikTok —
  **Growth PRO only.** Enforced via the `FEATURE_MIN_PLAN` / entitlement framework.
- One **Ayrshare profile = one social-active client** (a profile holds all its
  channels), so channel count never adds a profile — only client count does.

---

## 5. Delivery-cost model & margins (summary — full working in chat 2026-07-21)

**Per-client variable cost at MAX (budget-capped) vs. charge:**

| Plan | Max variable / mo | Charge | Contribution | Margin |
|---|---|---|---|---|
| Free | €0.30 | €0 | −€0.30 (funnel) | — |
| Essentials | ~€12 | €99 | ~€87 | 88% |
| Growth ⭐ | ~€36 | €299 | ~€263 | 88% |
| Growth PRO | ~€54 | €449 | ~€395 | 87% |

**Fixed monthly base (keeps the product running, independent of client count):**
Ayrshare (stepped, see below) + Netlify €50 + Claude Max €137.50 (mandatory —
runs automations/support/lead-gen) + SerpApi (Growth-PRO-only now, ~€50 base).

**Ayrshare = stepped fixed cost keyed to social-active clients (Growth + Growth PRO + Managed = S):**
| S | Plan | €/mo |
|---|---|---|
| ≤10 | Launch | €300 |
| 11–30 | Business | €599 |
| >30 | €599 + per-profile (linear, no more jumps) | €599+ |
Watch the **€300→€599 step at social client #11** (it's a discrete jump, not gradual).

**Key economic truths:**
1. Variable cost self-caps at the 12% budget → **~88% gross even fully maxed.**
2. **ChatGPT/OpenAI ≈ 60% of every collection** (€0.060, 6× Claude). The ChatGPT
   engine can't be swapped (it measures ChatGPT), so the lever is frequency
   (cooldown) + auditing *non-measurement* OpenAI calls → Claude/Gemini (task §12).
3. **Pre-scale, the ~€590 fixed base dominates** (9 paying clients ≈ €65/client;
   at 50 ≈ €12). Profitability = volume of self-serve Growth clients — the hero.
   Gross must still cover OPEX (ads, sales, office, labour, taxes, Stripe ~1.5–3.4%+€0.25/txn).

---

## 6. Anti-abuse / fair-use (dual cap)

- **Cooldown (frequency, user-facing):** Run Collection button locks after a run,
  shows a live **countdown** until the plan's cooldown (72/48/36h) elapses.
- **Monthly € budget (hard margin cap, backstop):** when the month's collection
  spend hits 12% of price, the button shows "monthly allowance reached, resets [date]."
- **Composer/scheduling cap:** posts/mo per channel per plan (§3) enforced in the
  publish/schedule path.
- Existing caps stay: SerpApi weekly cap, AI SEO draft/page caps.
- **Transparency:** every metered surface shows "X of Y used" so limits never surprise.

---

## 7. Pricing-page presentation (emulate the Ayrshare pattern)

From Ayrshare's own cards (2026-07-21 reference), adopt:
- **Cumulative value stacking:** each card = "**Everything in [lower tier]**, plus…".
- **One dark "Most Popular" highlighted card → on Growth** (the hero), with an
  **"X included" badge** (e.g. "Full loop, 1 brand included").
- **Per-tier audience descriptor** ("For …").
- **"Flexible pricing that grows with your business"** note under Growth PRO / Managed
  (the add-ons story).
- **Per-tier CTAs:** Free "Start free" · Essentials/Growth/Growth PRO "Start free trial" /
  "Get started" · Managed "Book a call" · Enterprise "Contact sales".
- **Two-group layout** (Software / self-serve · Done-for-you) + monthly/annual toggle
  + a **live promo banner** (from §8).
- GEO/SEO: the page itself must be quotable — headline claims, a real comparison
  table, FAQPage JSON-LD, Offer JSON-LD.

---

## 8. Promotions / discounts feature (admin-driven, propagates everywhere)

Scalable architecture (build once, right):
- **Money:** native **Stripe Coupons + Promotion Codes** (proration/duration/stacking).
- **Data:** a `promotions` table (percent/fixed, plans, start/end, label, active).
- **Public read:** `active-promo.js` Netlify function returns the current promo.
- **Site propagation (the "refresh the static site" win):** the pricing page runs a
  small script that fetches `active-promo` and renders the banner + strikethrough
  prices **live** — no cPanel re-upload to run a promo.
- **Admin:** a Promotions panel (create → activates the Stripe coupon + the promo
  record; auto-expire), reusing the existing plan-management UI.

---

## 9. Admin Content Studio (NEW feature)

An admin page to **build articles / news / announcements / all SEO-GEO website content**
from the dashboard, so content production is not only the Wed/Thu/Fri routines.
- Compose or AI-generate a piece on the **bg-* template**, scored with
  `geo-seo-scoring-prompt.md` (≥90/90), enforcing the **no-em-dash** + content-integrity rules.
- **Integrated image generator:** reuse the **same programmatic brand-card generator**
  built this session (`social-image.js` `renderCard` / `og_image_generator.py` line) so
  hero/card images follow the **same content + visual line** — brand colours, logo,
  no AI image generation.
- Output: generated HTML + images, staged for the standard **cPanel upload handoff**
  (Claude/admin can't auto-deploy the static site), wired into blog/sitemap/related-research.

---

## 10. Add-ons catalog (expansion revenue)

- **Extra social channels:** Instagram, TikTok (Growth PRO only).
- **Extra collection allowance / prompts** (any self-serve tier).
- **Extra AI SEO pages / drafts.**
- **Pro/Enterprise:** additional markets, brands, engines, seats.
Per-unit prices set in Stripe / the proposal, not fixed here.

---

## 11. Migration

Existing clients move to the new prices/plans **at next renewal, informed** (no silent
change, no grandfathering). Current Managed (€900) clients move to the repositioned
Managed (from €1,500) — a real increase, communicated with the new "your team vs.
hiring" value framing.

---

## 12. Implementation task list (split across agents — see chat for sequencing)

Foundation first (blocks everything), then parallel groups by non-overlapping scope;
**git serialized** (one committer at a time) per CLAUDE.md §0.

- **T0 · planConfig limits** — `planConfig.ts`: engines, prompts, cooldowns, 12% budgets,
  AI SEO page/draft caps, AI Social channel/post caps, channel entitlements, add-on ids. (BLOCKS all)
- **T0b · OpenAI-usage audit** (read-only) — where is OpenAI used beyond the ChatGPT engine; report migratable calls.
- **T1a · Collection enforcement** — cooldown + 12% budget + AI Mode→Growth-PRO gating (collect-*, _cost, _enqueue).
- **T1b · AI SEO caps** — page-audit limit + audits/week + draft caps (seo-crawl, seo-audit-page, seo-draft).
- **T1c · AI Social caps** — channel-count + entitlements (IG/TikTok add-on) + posts/mo/channel (social-*).
- **T2a · Dashboard client UI** — cooldown countdown, allowance meters, FeatureLocked add-on channels (AIVisibility/Social/SEO pages).
- **T2b · Admin plan management + promotions panel** — Account/admin pages.
- **T3 · Promotions system** — `promotions` migration + `active-promo.js` + Stripe coupon wiring + site promo script.
- **T4 · Marketing site** — index.html pricing redesign (Ayrshare pattern, Most-Popular=Growth, 5 tiers, Managed reframe, promo script, JSON-LD) · faq.html · terms.html.
- **T5 · Admin Content Studio** — content composer + geo-scoring + integrated brand-image generator.
- **T6 · Stripe + migration** — new prices/add-ons/coupons checklist + renewal migration.
- **T7 · QA** — end-to-end: caps enforce, site matches, Stripe matches, promo propagates.

---

## 13. Open items
- Per-extra-profile Ayrshare rate (>30 profiles) — Constantin to supply, finalizes the >30 cost line.
- Add-on unit prices (channels, prompts, pages) — set in Stripe.
- OpenAI-audit outcome — confirms real savings before any engine-cost change.
