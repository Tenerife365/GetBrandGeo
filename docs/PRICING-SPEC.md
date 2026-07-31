# PRICING-SPEC.md — Proposed New Pricing Model (for sign-off before implementation)

> **Date:** 2026-07-09 · **Owner:** `Master-GTM` (CLAUDE.md §10)
> **Status:** DRAFT for Constantin's approval. **Nothing is implemented yet.**
> This is the alignment artifact — once you approve (or adjust) the numbers and
> the two open sub-decisions in §5, I implement it across all five surfaces in
> §4 in one coordinated pass.
>
> **Decisions already locked (your calls, this session):**
> - Managed repriced **€500 → €900/mo**.
> - New **Growth** tier added at **€299/mo**.
> - Setup fee: **kept, waived on annual** (see recommendation in the chat / §3).

---

## 1. The proposed ladder (6 tiers)

| Tier | Monthly | Annual (2 months free) | Setup | Motion | Live engines | Core limits |
|---|---|---|---|---|---|---|
| **Free** | €0 | — | — | Self-serve | 1 (ChatGPT) | 1 project, 5 prompts, monthly refresh, basic score |
| **Essentials** | €99/mo | €990/yr | none | Self-serve | 3 (ChatGPT, Gemini, Claude) | 30 prompts, weekly, competitor tracking, CSV |
| **Growth** ✨*new* | **€299/mo** | €2,990/yr | none | Self-serve+ | **5 (all live)** | 150 prompts, daily/weekly refresh, competitor tracking, 1 onboarding call, email support |
| **Managed** ⭐ | **€900/mo** | **€9,000/yr** (setup waived) | €1,250 (waived annual) | **Done-for-you** | 5 (all live) | Full service — see §2 |
| **Pro** | **from €1,500/mo** | €15,000/yr | **none** | Done-for-you | 5 (all) | Multi-country, multi-brand, larger prompt coverage + **add-ons** (§3.1) |
| **Enterprise** | **Custom (from ~€10,000/mo)** | Custom | none | Bespoke | all | Everything at scale — e.g. 1,000+ prompts × all markets × all engines; white-label, dedicated support, custom add-ons |

**What changed vs. today:** Managed €500→€900 (annual €6,000→€9,000); **Growth
€299 inserted**; **Pro €1,250→€1,500, setup fee removed, add-ons enabled**
(§3.1); Enterprise reframed as the at-scale tier (from ~€10,000/mo for large
configs). Free & Essentials unchanged. **All existing clients migrate to the new
prices** (no grandfathering — everyone on a plan pays the same; clients are
informed, §5).

### Why this shape
- Kills the old **5× cliff** (€99 → €500). New steps: €0 → €99 → €299 → €900 →
  €1,250 → custom. Every jump is ≤3×, each with a real reason to climb.
- **Growth €299** lands exactly where Peec ($199), Otterly ($189) and AthenaHQ
  ($270–295) cluster — you now have an offer for the "outgrew Essentials, not
  ready for done-for-you" buyer instead of losing them.
- **Managed €900** still undercuts the done-for-you agency floor (~€1,400+/mo)
  while nearly doubling revenue per managed client — the flagship stays the
  value choice, just not a giveaway.

---

## 2. Feature matrix (what each tier includes)

| Capability | Free | Essentials | Growth | Managed | Pro | Enterprise |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| AI Visibility Score (6-dim) | basic | ✅ | ✅ | ✅ | ✅ | ✅ |
| Engines monitored | ChatGPT | +Gemini, Claude | **all 5** | all 5 | all 5+ | all |
| Buyer prompts | 5 | 30 | 150 | Managed for you | Larger coverage | Unlimited |
| Refresh cadence | Monthly | Weekly | Daily/Weekly | Weekly + managed | Weekly | Custom |
| Competitor tracking | — | ✅ | ✅ | ✅ (researched) | ✅ | ✅ |
| Dashboard + CSV export | dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Onboarding call | — | — | 1 | ✅ full onboarding | ✅ | ✅ |
| Support | — | email | email | priority | priority | dedicated |
| **Done-for-you service** | — | — | — | ✅ | ✅ | ✅ |
| Strategy calls | — | — | — | monthly + quarterly | monthly + quarterly | custom |
| Website AI audit + citation analysis | — | — | — | ✅ | ✅ | ✅ |
| Multi-country / multi-brand | — | — | — | — | ✅ | ✅ |
| White-label | — | — | — | — | — | ✅ |

**The line that matters:** everything at/below **Growth is self-serve (you get
the tool)**; everything at/above **Managed is done-for-you (we do the work)**.
That's the story the whole site should tell (§5 of GTM-STRATEGY.md).

---

## 3. Annual billing & setup fee policy (uniform rules)

- **Annual = "2 months free" (pay 10× monthly, ≈17% off)** across all paid tiers
  (Essentials, Growth, Managed, Pro). Matches the existing "Save 17%" toggle on
  the site. Enterprise annual is quoted. *(Locked — uniform, simplest to explain
  and implement; strong pull toward sticky annual commitments.)*
- **Setup fee (€1,250) applies to Managed monthly only, and is waived on the
  annual option.** Free / Essentials / Growth / **Pro** / Enterprise have **no
  setup fee**. (Pro & Enterprise are big-commitment deals where setup friction
  hurts more than it helps; Managed keeps the fee as its annual-commitment
  nudge.)
- **Net effect on Managed:** monthly €900 (+€1,250 setup); annual €9,000/yr
  (≈€750/mo effective) **and** setup waived → annual is dramatically better,
  which is the point: it pulls prospects to the sticky, cash-upfront commitment.

### 3.1 Add-ons (Pro & Enterprise)

Pro includes a base allocation; beyond that, buyers scale via **add-ons** — this
is how a large enterprise wanting, say, 1,000 prompts × all markets × all engines
reaches €10,000+/mo. Add-on *units* (exact per-unit prices set with Stripe / in
the proposal, not fixed here):

- **Prompt packs** (e.g. +100 prompts) — the primary scaling lever.
- **Additional markets / countries.**
- **Additional brands / domains.**
- **Additional engines** beyond the standard 5 as they leave "coming soon"
  (Google AI, Copilot, DeepSeek, Grok).
- **Additional seats** (if/when per-seat matters).

Pro (€1,500/mo, no setup) = base + à-la-carte add-ons. Enterprise = a fully
bundled/negotiated add-on stack, quoted from ~€10,000/mo. This mirrors how Peec /
Otterly / Semrush sell engine and volume add-ons, so it's a buying motion the
market already understands.

---

## 4. Implementation surfaces — everything that must move together

Approved. These change in **one coordinated pass, split across three chats**
(Master-GTM stays strategy-only). PRICING-SPEC.md is the single source of truth —
every chat copies numbers from §1–§3, no improvising (a mismatch between any two
surfaces is exactly the bug we just fixed in terms.html):

| # | Surface | File / system | Owner chat | Change |
|---|---|---|---|---|
| 1 | Marketing pricing page | `brandgeo/web/index.html` | **Master-SiteDesign** | 6 tiers + two-group redesign (§5.1); Managed €500→€900; Pro €1,250→€1,500 no-setup + add-ons note; add Growth; JSON-LD Offers; "Why upgrade" timeline |
| 2 | FAQ pricing answers | `brandgeo/web/faq.html` | **Master-SiteDesign** | 3 pricing Q&As + FAQPage JSON-LD → 6-tier model |
| 3 | Legal terms | `brandgeo/web/terms.html` | **Master-SiteDesign** | Add Growth row, Managed €900/€9,000, Pro €1,500 no-setup + add-ons, Enterprise ~€10k (build on the current-5-tier fix, don't redo 2-tier cleanup) |
| 4 | Product engine-gating | `brandgeo-dashboard/src/lib/planConfig.ts` | **Master-DashboardDesign** | Add `growth` to `PLAN_ORDER`/`PLAN_LABELS`; engine gating per §5 item 7 (B1: all 5 from Growth up) |
| 5 | Billing | **Stripe** | **Master-Billing** | Create Growth/repriced Managed/Pro prices + add-ons (§3.1); migrate all existing subs at next renewal with notice |

**Scopes don't overlap** (SiteDesign = `brandgeo/web/`, DashboardDesign =
`brandgeo-dashboard/`, Billing = Stripe) so all three can run in parallel under
the §0 parallel-work window — but git must still be serialized (DashboardDesign
is the only one committing code; SiteDesign hands web files off for cPanel).

Plus non-file: **all existing clients move to the new prices** (informed, at next
renewal — not silent). Onboarding wizard (`Onboard.tsx`) plan-picker already
reads `PLAN_ORDER`, so adding `growth` to planConfig surfaces it automatically
there.

> ⚠️ **Open sub-decision B — Growth's engine access.** Today's gating (per §1.7):
> free=1, Essentials=3, Managed=4 (adds Perplexity), Pro=5 (adds Meta). The spec
> above gives **Growth all 5 live engines**, which would make Growth's engine
> count ≥ Managed/Pro — breaking the "more engines as you climb" logic. Two clean
> options:
> - **(B1, recommended) Differentiate Managed/Pro by *service & scale*, not
>   engine count.** Growth, Managed, and Pro all get the 5 live engines; what you
>   pay more for above Growth is the *done-for-you work* and multi-brand/country
>   scale — not more engines. Cleanest customer story ("Growth: watch all 5
>   yourself; Managed: we run it for you"). Requires making engine gating
>   uniform from Growth up.
> - **(B2) Keep engine-laddering.** Growth = 4 engines (ChatGPT, Gemini, Claude,
>   Perplexity, matching current Managed), Meta stays a Pro differentiator. Less
>   change to gating logic, but a weaker Growth value story.
>
> This overlaps `Master-Reasoning` §8.1 item 4 (is engine-gating aligned with
> engine *value*) — worth a quick reconcile there before finalizing. **Spec
> defaults to B1; your call.**

---

## 5. Decision status

All locked except one soft default:

1. ✅ Managed **€900** (annual €9,000, setup waived on annual).
2. ✅ Growth **€299** (annual €2,990).
3. ✅ Pro **€1,500, no setup fee, + add-ons** (§3.1); Enterprise from ~€10,000/mo.
4. ✅ Setup fee: **Managed monthly only, waived on annual**; no setup on any other tier.
5. ✅ Annual = **2 months free** uniformly across paid tiers.
6. ✅ **No grandfathering — all existing clients migrate to the new prices**
   (they're informed; everyone on a plan pays the same). *Implementation note:*
   in Stripe this means moving existing subscriptions to the new price, with
   notice, at their next renewal — not a silent change.
7. ⚠️ **Soft default — Growth engine access (sub-decision B):** all 5 engines,
   differentiate Managed/Pro by *service + scale*, not engine count. Cleanest
   story; overlaps `Master-Reasoning` §8.1 item 4 (engine-value) — I'll flag it
   there. Say the word if you'd rather ladder engines (Growth = 4, Meta a Pro
   perk). **This is the only thing I'll assume unless you object.**

Approve and I execute all five surfaces in §4 in one pass (web files handed to
you for cPanel upload; planConfig via the usual build/commit; Stripe as a
checklist for you to run).

---

## 5.1 Design update for the pricing section — yes, recommended

Going from 5 to 6 tiers (plus add-ons copy) breaks the current single-row
5-card `pricing-grid` — 6 equal cards in one row is cramped on desktop and wraps
awkwardly. More importantly, the new model has a real **information-architecture
story** the old flat grid can't tell: *self-serve* (Free / Essentials / Growth)
vs *done-for-you* (Managed / Pro / Enterprise).

**Recommendation: split the pricing section into two labelled groups** —
"Software (self-serve)" and "Done-for-you (managed)" — each with its own row of
cards, keeping the monthly/annual toggle and the "Most Popular" flag on Managed.
This simultaneously (a) solves the 6-card cramming, (b) makes the value ladder
legible, and (c) reinforces the §5 positioning ("start self-serve, graduate to
done-for-you"). Add a short add-ons note under Pro/Enterprise.

This is technically a `Master-Redesign` (marketing site) concern, but it's
**tightly coupled to this pricing change and touches the same `index.html`
markup** — so it's cleaner to do it *as part of this coordinated pass* than to
hand it to a separate initiative (which would then collide on the same file per
the §9.3 no-two-sessions-one-file rule). **I'll fold the two-group redesign into
the index.html implementation** unless you'd prefer to keep the current flat grid
and just add a 6th card.

---

## 6. At-a-glance: today → proposed

```
TODAY:     Free €0 → Essentials €99 → ──────────5×────────→ Managed €500 → Pro €1,250 → Enterprise
PROPOSED:  Free €0 → Essentials €99 → Growth €299 → Managed €900 → Pro €1,500 → Enterprise (from ~€10k)
                                        └ new ┘        └ +80% ┘    └ +setup-free, add-ons ┘
```
