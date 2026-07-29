# Pricing audit — BrandGEO

**Run:** 2026-07-29
**Method:** `pricing-strategy` and `micro-saas-launcher` skills, applied to live
Supabase data, `planConfig.ts`, `_cost.js` and `_auth.js`. Every number below is
queried or computed, none estimated.
**Not available:** Stripe revenue. The connected Stripe account is
`acct_1TxtkGQAKgm0Dugx` (**TalentWeLove**), not BrandGEO's
`acct_1LHjKrKh2GaZE2B4`. MRR, churn and ARPU are therefore unknown to this audit
and every conclusion below is drawn from usage, not revenue.

---

## 1. Who is actually on the platform

36 client rows. **27 are research tenants, not customers** — one per city
research page, `category = 'research'`, parked on the legacy `pro` tier. Reading
the plan distribution without excluding them inverts the picture completely.

The real book, all nine of them:

| Client | Plan | Signed up | Days | Active prompts | Collection days | Last run |
|---|---|---|---|---|---|---|
| BrandGEO (self) | managed | 07-02 | 27 | 5 | 3 | 07-22 |
| Bucate pe Roate | managed | 07-02 | 27 | 6 | 6 | 07-21 |
| Paunescu & Asociatii | managed | 07-07 | 22 | 4 | 1 | 07-19 |
| Talentwelove (own co.) | managed | 07-13 | 16 | 2 | 1 | 07-19 |
| Edyta Andrzejczak | growth | 07-16 | 13 | 8 | 1 | 07-16 |
| Restaurante Transilvania | growth | 07-18 | 11 | 2 | 2 | 07-21 |
| Slatehq (competitor) | free | 07-21 | 8 | 0 | 0 | never |
| Ai Fy | free | 07-23 | 6 | 2 | 1 | 07-23 |
| Alexandru Teodor | essentials | 07-23 | 6 | 1 | 1 | 07-23 |

Two of the four Managed accounts are your own companies. So the paying
third-party book is roughly **two Managed, two Growth, one Essentials**.

**Total API spend across all non-research clients, all time: €3.40.**

---

## 2. Finding A — the prompt cap is not a value metric

| Client | Plan | Prompts used | Cap | Utilisation |
|---|---|---|---|---|
| Edyta Andrzejczak | growth | 8 | 75 | **10.7%** |
| Bucate pe Roate | managed | 6 | 1000 | 0.6% |
| BrandGEO | managed | 5 | 1000 | 0.5% |
| Paunescu | managed | 4 | 1000 | 0.4% |
| Restaurante Transilvania | growth | 2 | 75 | 2.7% |
| Talentwelove | managed | 2 | 1000 | 0.2% |
| Alexandru Teodor | essentials | 1 | 20 | 5.0% |

**Nobody has ever exceeded 11% of their prompt allowance.** A limit nobody
approaches cannot drive an upgrade, cannot justify a price difference, and
cannot be the thing you sell on.

This answers the open question about raising `PLAN_PROMPTS` from 75 back to 150
directly: **it would change nothing for any current customer**, because the
heaviest user of the tier is at 8. It is not a decision worth making.

---

## 3. Finding B — the real constraint is invisible, and it contradicts the page

The published limit is prompts. The **enforced** limit is a monthly euro budget
in `_auth.js:230`, which hard-blocks collection with "Monthly API budget
exceeded for this plan. Contact support to raise this limit."

Per-prompt cost across a full engine set is €0.125 for a 5-engine plan
(chatgpt 0.060 + gemini 0.034 + claude 0.010 + perplexity 0.006 + google_ai 0.015).

| Plan | Full run | Monthly budget | Full runs affordable | Cadence advertised | Outcome |
|---|---|---|---|---|---|
| Essentials €99 | €2.08 | €11.88 | 5.7 | 72h (=10/mo) | blocked after 5.7 |
| Growth €299 | €9.38 | €35.88 | 3.8 | 48h (=15/mo) | blocked after 3.8 |
| Growth PRO €449 | €12.50 | €53.88 | 4.3 | 36h (=20/mo) | blocked after 4.3 |
| Managed €1,500 | €125.00 | €180.00 | **1.4** | on demand | blocked after 1.4 |

Inverted, this is how many prompts each tier can actually sustain at the cadence
it advertises, for a full month:

| Plan | Prompts sold | Sustainable at advertised cadence | Share of what's sold |
|---|---|---|---|
| Essentials | 20 | 11 | 57% |
| Growth | 75 | **19** | **26%** |
| Growth PRO | 100 | **21** | **22%** |

A Growth customer who actually used the 75 prompts they bought, at the 48h
refresh the page advertised, would hit a hard block around day 8 and see a
"contact support" message for the rest of the month.

**This has never fired, because no customer has ever used more than 8 prompts.**
It is a latent defect, not a live one. But it is strictly worse than the
150-vs-75 discrepancy corrected in `68b8e1d`, and that correction did not
address it.

**Managed is the worst case.** At €1,500/mo, a "done for you, continuous
monitoring" tier can afford to run its full prompt set **1.4 times a month**.

### Fixed on the page tonight (`499e865` follow-up)

The cooldown is a *rate limiter* — a minimum wait between manual runs — not a
promised cadence. Stating it as "Refresh every 48h" turned a floor into a
guarantee the budget cannot honour. Now stated as what the budget actually buys:

- Essentials: `~5 full refreshes/month + competitor tracking`
- Growth: `~4 full refreshes/month, min 48h apart`
- Growth PRO: `~4 full refreshes/month, min 36h apart, priority queue`

This is honest without changing any spend. It does not fix the underlying
mismatch between the prompt cap and the budget.

---

## 4. Finding C — the ladder has more tiers than customers

Six published tiers (Free, Essentials, Growth, Growth PRO, Managed, Enterprise)
serving five paying accounts, three of which are self-serve.

`micro-saas-launcher` names this explicitly as an anti-pattern ("Multiple
pricing tiers — start simple") and lists "pricing page confuses potential
customers" as a sharp edge. `pricing-strategy` puts the standard at three tiers
and warns that 4+ risks decision paralysis.

**Growth PRO has zero customers and, since the entitlement change, no engine
differentiator.** What remains is +25 prompts (on a metric nobody reaches) and a
12h shorter cooldown (which the budget makes moot). It is €150/mo of price
difference backed by nothing a customer can perceive.

---

## 5. Finding D — this is an activation problem wearing a pricing costume

Every one of the nine accounts is on `refresh_cadence = 'manual'`. Six of nine
have exactly **one** collection day, ever. The two newest signups both ran once
on their signup day and never returned. The competitor who signed up never ran
at all.

The product's value is a *trend* — how your visibility moves — and a trend needs
at least two collection days. **Only two accounts in the entire book have more
than two**, and one of them is your own dogfood tenant.

No pricing change fixes this. Customers are not declining to upgrade because the
price is wrong; they are not using the product at all after day one.

---

## 6. Recommendations, in order

**R1. Do not raise `PLAN_PROMPTS`. Close the question.** The heaviest user is at
11% of the current cap. Raising it would widen the gap in §3 (150 prompts at 48h
would be sustainable at 10% of the cap sold) and roughly double the spend
ceiling for no perceivable benefit.

**R2. Fix the prompt-cap / budget mismatch, then decide which number you sell.**
Two coherent options, both requiring your call:
  - *Sell the sustainable number.* Growth becomes 20 prompts at a genuine 48h
    refresh. Honest, but reads weak against Profound's 100.
  - *Keep 75 and raise the budget to match a weekly cadence.* 75 prompts × 4.3
    runs = €40.3. Raising Growth's budget €35.88 → €41 moves margin at cap from
    88.0% to 86.3%. Given total lifetime spend is €3.40, this costs nothing real.

  Recommended: the second. It keeps a competitive number and makes it true.

**R3. Retire Growth PRO.** It has no customers and, post-entitlement-change, no
differentiator. Three self-serve tiers (Free, Essentials €99, Growth €299) plus
Managed is a ladder a visitor can hold in their head. If you want a €449 tier
later, earn it with something perceivable: more markets, more competitors
tracked, or scheduled auto-refresh.

**R4. Change the value metric to the one customers can feel.** Prompts are
invisible and unreached. What actually varies with value here is *engines ×
freshness × competitors tracked*. Freshness is already what separates the tiers
economically; it is just not what you sell on. Selling "how often we check" is
also self-reinforcing: it is the thing that produces the trend data the product
exists to show.

**R5. Before any of the above, fix activation.** Six of nine accounts have one
collection day. The single highest-leverage change on this list is making the
second collection happen without the customer deciding to trigger it — i.e.
giving paid tiers a non-manual `refresh_cadence`. That is already an open
decision in `activation-path.md` §5.3 and it is worth more than every pricing
change combined.

**R6. Connect the BrandGEO Stripe account** so the next audit can use revenue.
This one is blind on MRR, churn and ARPU.

---

## 7. Competitive position (from the 2026-07-28 scrape)

| | Entry | Mid |
|---|---|---|
| Profound | $99, **ChatGPT only**, 50 prompts | $399, **3 engines**, 100 prompts |
| Otterly * | $29, 15 prompts, 4 engines | $189, 100 prompts |
| AthenaHQ | — | ~$300 |
| **BrandGEO** | **€99, 3 engines, 20 prompts** | **€299, 5 engines, 75 prompts** |

\* secondary-sourced, still unverified first-party.

On engines-per-euro BrandGEO wins clearly at both tiers. That advantage is real
and is not currently stated anywhere on the site. It is a stronger lever than any
price change in this document, and it costs nothing to deploy.

The prompt-count comparison is where BrandGEO looks weak (20 vs Otterly's 15 is
fine; 75 vs Profound's 100 is not). §2 says the metric is meaningless in
practice, which is an argument for competing on engines and freshness rather
than matching them on a number nobody uses.
