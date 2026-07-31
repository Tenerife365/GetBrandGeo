# Sprint ladder ruling (S1)

Written 2026-07-31 by `bg-strategy` for Constantin. Decision brief, not a build.
No code was touched, no price was changed, nothing was written to Stripe.
Blocks S2 (build the ladder) and S7 (launch coupon).

---

## The 30 second version

Four decisions. **Decision 1: yes, add Radar at EUR 39 list, EUR 29 launch price
for the first 100, ChatGPT and Gemini only, 7 prompts, weekly, 1 website.** It
clears the 15 percent ceiling at both prices and it consumes zero SerpApi
credits, which is the only reason it can scale to 100 subscribers at all.
**Decision 2: the authoritative ladder is 5, 7, 18, 35, 56, 200, 200, sentinel.**
Both existing ladders are wrong: the shipped one inverts twice, and the
documented `5, 20, 50, 75, 250` was costed when ChatGPT was EUR 0.056 a check
and the top plans had 6 engines. At today's metered prices it breaches the 15
percent ceiling by **EUR 5.63 on Growth PRO and EUR 18.25 on Managed**. My
ladder raises three tiers, cuts none, and closes both inversions.
**Decision 3: SUM the pools, MAX the site allowance**, and enforce it at account
level, because today's per-client code would deliver SUM by accident and nobody
would have chosen it. **Decision 4 is already yours from `67a3cf4` and is
carried forward unchanged.**

Two things need your attention beyond the four decisions, both flagged in bold
below: the **free tier cannot finish one collection run inside its own budget**
(EUR 0.54 of work against a EUR 0.30 budget), and **one Managed client at 200
prompts consumes the entire 500 credit SerpApi pool for the whole platform**.

---

## The cost model everything below uses

Two facts change every number in this document, and neither is in the tables the
earlier work reasoned from.

**1. SerpApi engines run monthly, not weekly.** `_cost.js` defines
`MONTHLY_CAPPED_ENGINES = ['google_ai', 'ai_overview']` with
`MONTHLY_CAP_DAYS = 30`, enforced on both the scheduled path (`_enqueue.js`) and
the manual path (`collect-prompt.js`). So a Growth PRO prompt draws its five
token engines 4.333 times a month and its two SerpApi engines once. Every prior
table in the repo multiplied all engines by 4.333 and therefore overstates the
top tiers by roughly 40 percent.

**2. Prices were rebuilt on 2026-07-29 and the ladder tables were not.** ChatGPT
is EUR 0.108 a check, not the EUR 0.056 the `PLAN_PROMPTS` comment block was
written against. Growth PRO carries 7 engines, not the 6 that comment assumed.

Per prompt, per month, at 4.333 weekly runs:

| Plan | Weekly engines | Weekly EUR/check | SerpApi engines | SerpApi EUR/month | **EUR per prompt per month** |
|---|---|---|---|---|---|
| free | chatgpt | 0.108 | none | 0.000 | **0.1080** (monthly cadence, 1 run) |
| radar | chatgpt, gemini | 0.140 | none | 0.000 | **0.6067** (0.140 x 4.333) |
| essentials | + claude | 0.173 | none | 0.000 | **0.7497** |
| growth | + perplexity | 0.178 | google_ai | 0.046 | **0.8173** |
| growth_pro | + grok | 0.198 | + ai_overview | 0.115 | **0.9730** |
| managed, pro | same as growth_pro | 0.198 | same | 0.115 | **0.9730** |

Where a number below is described as "modelled" it uses this table. Where it is
described as "cash" it excludes `FIXED_FEE_ENGINES` (gemini, google_ai,
ai_overview), which are accounting entries against the Gemini free tier and the
SerpApi subscription rather than marginal spend.

---

# Decision 1. Does Radar enter the ladder?

**The question:** do we add a paid entry tier below Essentials, and at what
price, engines, allowance, cadence and website count?

## The arithmetic

Radar is ChatGPT plus Gemini, weekly. That is EUR 0.140 a check and EUR 0.6067
per prompt per month. The 15 percent ceiling is EUR 5.85 at list EUR 39 and EUR
4.35 at launch EUR 29.

| Prompts | Modelled EUR/month | vs EUR 39 budget 5.85 | as % of 39 | vs EUR 29 budget 4.35 | as % of 29 |
|---|---|---|---|---|---|
| 5 | 3.033 | headroom 2.817 | 7.8% | headroom 1.317 | 10.5% |
| 6 | 3.640 | headroom 2.210 | 9.3% | headroom 0.710 | 12.6% |
| **7** | **4.247** | **headroom 1.603** | **10.9%** | **headroom 0.103** | **14.6%** |
| 8 | 4.853 | headroom 0.997 | 12.4% | **BREACH EUR 0.503** | 16.7% |
| 10 | 6.067 | **BREACH EUR 0.217** | 15.6% | **BREACH EUR 1.717** | 20.9% |

**7 is the largest allowance that clears the ceiling at both prices.**

Gross margin, at 7 prompts:

| | Revenue | Modelled cost | Modelled GM | Cash cost | Cash GM |
|---|---|---|---|---|---|
| Launch EUR 29 | 29.00 | 4.247 | **85.4%** | 3.276 | **88.7%** |
| List EUR 39 | 39.00 | 4.247 | **89.1%** | 3.276 | **91.6%** |

Cash is EUR 3.276 because Gemini is a fixed fee engine: EUR 0.032 of the EUR
0.140 check, 22.9 percent of the modelled figure, is accounting against the
Gemini free tier (1,500 requests a day) and not money leaving the account. The
remaining EUR 0.108 is real ChatGPT spend. **Do not quote the 91.6 percent
figure anywhere a customer or an investor can see it**; the modelled figure is
the honest one, because the Gemini free tier is a volume allowance that ends.

## Cadence: weekly, and this is forced by arithmetic, not preference

Fortnightly looked attractive because halving the cadence halves the per prompt
cost and would buy 14 prompts inside the same EUR 4.35. It cannot be done.
Radar has 1 website, so its prompts per site equal its total. Essentials' prompts
per site are bounded by its budget per site: EUR 14.85 over 2 sites is EUR 7.425
a site, which at EUR 0.7497 a prompt buys **9.90 prompts per site, and that is a
hard ceiling no allowance can exceed**. At fortnightly cadence Radar's EUR 4.35
buys 14.34 prompts on its single site. **Radar would beat Essentials per site by
45 percent, permanently, and no Essentials number could fix it.** At weekly
cadence Radar's ceiling is 7.17 per site, safely under 9.90.

Weekly also keeps one cooldown constant across the entire paid ladder
(`PLAN_COLLECTION_COOLDOWN_HOURS = 168` everywhere) and avoids reintroducing
refresh frequency as a tier differentiator, which was deliberately killed on
2026-07-29.

## Why Radar excludes SerpApi engines

`_cost.js` documents 500 SerpApi credits a month as a **platform wide pool
shared by every client**, with unused credits expiring at renewal. It is not a
per client budget and it does not grow when we sell more subscriptions.

If Radar included `google_ai` at 1 credit a check, at the monthly cap:

- 100 Radar clients x 7 prompts x 1 credit x 1 run = **700 credits a month, 140
  percent of the entire platform pool**, consumed by the cheapest tier alone,
  leaving nothing for any Growth, Growth PRO or Managed client.

**That is the reason Radar is ChatGPT and Gemini and nothing else.** It is not a
packaging preference. A cheap tier that draws on a scarce shared pool cannot
scale, and the sprint's whole premise is scaling this tier to 100.

## What 100 Radar subscribers actually costs and breaks

| Measure | At 100 Radar clients |
|---|---|
| Revenue at EUR 29 | **EUR 2,900 / month** |
| Revenue at EUR 39 | **EUR 3,900 / month** |
| Modelled collection cost | 100 x 4.247 = **EUR 424.70 / month** |
| Cash collection cost | 100 x 3.276 = **EUR 327.60 / month** |
| SerpApi credits consumed | **0 of 500** |
| Gemini calls per month | 100 x 7 x 4.333 = **3,033** |
| Platform budget used | 424.70 of `PLATFORM_MONTHLY_API_BUDGET_EUR` 12,000 = **3.5%** |
| Per client hourly ceiling | `max(150, 7 x 2)` = 150, never binding |

**One thing does break, and it is the Gemini free tier, not the euros.** The free
tier is 1,500 requests a day. If every Radar client's weekly run lands on the
same weekday, that day carries 100 x 7 = 700 Gemini calls, 46.7 percent of the
daily ceiling. **The ceiling is reached at 214 Radar clients on a single
collection day** (1,500 / 7). S2 must spread the weekly schedule across weekdays
rather than clustering it, or Radar's second hundred customers start failing
Gemini collection with no error anyone is watching for.

## The launch price mechanism

**RULING: a separate Stripe price at EUR 29, not a coupon on the EUR 39 price.**

Reason in one line: a price object grandfathers the launch cohort automatically
and cannot be deleted out from under them, whereas a `duration: forever` coupon
leaves 100 customers' billing dependent on a coupon object that anyone with
Stripe access can remove.

Strongest counter-argument: only a promotion code carries `max_redemptions`, so
a separate price cannot enforce the "first 100" cap and we may overshoot. Cost of
overshooting is EUR 10 a month per extra customer; ten extra customers is EUR 100
a month, against the risk of repricing the entire launch cohort by accident.
Retirement is observable: S9's scoreboard counts active subscriptions daily, so
deactivate the EUR 29 price the day the 100th Radar subscription goes live.

**Consequence for S7, stated explicitly as that task asked:** Radar's EUR 29 IS
the discount. **LAUNCH30 must not apply to Radar.** Scope the coupon to
Essentials and up. Stacking a launch coupon on a launch price would take Radar to
roughly EUR 20 against a EUR 4.25 cost floor, and the ceiling would move from 15
percent to 21 percent of price with nobody choosing it.

## The budget constant, and a trap inside it

`PLAN_MONTHLY_API_BUDGET_EUR` is keyed by plan, not by price, so it can hold only
one number while two prices are live.

**RULING: set it to EUR 4.35, the 15 percent of the LAUNCH price.** Setting it to
EUR 5.85 while every customer pays EUR 29 makes the real ceiling
5.85 / 29 = **20.2 percent of price**, a 5 point margin giveaway that no decision
would have authorised. Raise it to 5.85 in the same commit that deactivates the
EUR 29 price.

## The binding constraint: Radar must not invert Essentials

| | Price | Sites | Prompts | **Prompts per site** | Budget | **Budget per site** |
|---|---|---|---|---|---|---|
| Radar | 29 | 1 | 7 | **7.00** | 4.35 | 4.35 |
| Essentials | 99 | 2 | **18** | **9.00** | 14.85 | 7.43 |

**Yes, my proposed Essentials number is what makes this work, and it is carried
into decision 2.** At the shipped Essentials figure of 15 prompts the per site
number is 7.50 against Radar's 7.00: correct, but by 6.7 percent, which is close
enough that any future rounding breaks it. At 18 the margin is 28.6 percent.

## Exact constants to ship (S2 pastes these)

```ts
// src/lib/planConfig.ts  (mirror every one in netlify/functions/_cost.js)
export type Plan = 'free' | 'radar' | 'essentials' | 'growth'
                 | 'growth_pro' | 'managed' | 'pro' | 'enterprise'

PLAN_ORDER                    // ['free','radar','essentials','growth','growth_pro','managed','pro','enterprise']
PLAN_LABELS.radar             = 'Radar'
PLAN_ENGINES.radar            = ['chatgpt', 'gemini']
PLAN_LIVE_ENGINES.radar       = ['chatgpt', 'gemini']    // _cost.js
PLAN_PROMPTS.radar            = 7
PLAN_MONTHLY_API_BUDGET_EUR.radar = 4.35   // 15% of the EUR 29 LAUNCH price
PLAN_COLLECTION_COOLDOWN_HOURS.radar = 168 // weekly, same as every paid tier
PLAN_SEO_PAGE_CAP.radar       = 0
PLAN_SEO_AUDITS_PER_WEEK.radar = 0
site_allowance (radar)        = 1          // plan_prompt_caps, per tenancy arch 6.4
```

```
Stripe (create only, live mode, link nowhere customer visible yet)
  Product : BrandGEO Radar
  Price A : EUR 39.00 / month  metadata.plan = radar  metadata.cohort = list
  Price B : EUR 29.00 / month  metadata.plan = radar  metadata.cohort = launch-100
  Sell against Price B. Deactivate Price B at the 100th live Radar subscription.
```

**Hazard for S2, named because it is silent if missed.** `PLAN_ORDER` position is
load bearing: `planRank()` and `hasFeature()` derive from index, so inserting
`radar` anywhere except immediately after `free` shifts every feature gate on the
ladder. `FEATURE_MIN_PLAN.ai_seo = 'growth'` then correctly excludes Radar with
no further edit. Two places compare plan by equality rather than rank and must be
read before shipping: `Layout.tsx:57` (`c.plan === 'free'`) and
`set-client-plan.js:134` (`plan === 'free'`). Neither is a defect today; both
will silently classify Radar as "not free" and may or may not be what is wanted.

### OPEN QUESTION 1a

Radar at 7 prompts is 2 more than Free's 5. The step a buyer is paying for is
engines (1 to 2) and cadence (monthly to weekly), which takes them from 5 checks
a month to 60.7, plus a trend line Free cannot produce because a monthly cadence
gives one data point. **I believe that is a real product and a thin sales line.**
The alternative that would fix the sales line is raising the price to EUR 49,
where the ceiling is EUR 7.35 and buys 12 prompts. I did not recommend it because
the council's judgement is that EUR 99 is already too high a cold entry, and EUR
49 gives back half of that move. Constantin's call if the 7 reads as unsellable.

**DECIDED <date>:**

---

# Decision 2. The authoritative `PLAN_PROMPTS` ladder

**The question:** one set of prompt allowances for all eight plans that resolves
every conflict, closes both inversions, and holds the 15 percent ceiling.

## The four conflicts, each named as resolved

**(a) `5, 15, 35, 35, 120` shipped versus `5, 20, 50, 75, 250` documented.**
RESOLVED against both. The documented ladder was costed at EUR 0.121 for a 3
engine check and EUR 0.145 for 5, with a 6 engine top tier. Today those checks
cost EUR 0.173 and EUR 0.224, and the top tier has 7 engines at EUR 0.313. At
current metered prices the documented ladder costs:

| Plan | Documented prompts | Modelled EUR/month | Budget | Verdict |
|---|---|---|---|---|
| essentials | 20 | 14.993 | 14.85 | **BREACH EUR 0.14** |
| growth | 50 | 40.867 | 44.85 | fits, 13.7% of price, 1.3 points of headroom |
| growth_pro | 75 | 72.975 | 67.35 | **BREACH EUR 5.63** |
| managed | 250 | 243.250 | 225.00 | **BREACH EUR 18.25** |

**The handover's conclusion that "the code is the outlier, not the docs" is
wrong, and this is the single most consequential correction in this brief.** The
code is the only ladder computed since the 2026-07-29 reprice. The documented
ladder is a fossil of a cheaper product and cannot be adopted.

**(b) Growth at 35 versus 50 versus 75.** RESOLVED at **35**. Not because 35 is
shipped, but because 50 makes Growth PRO unfixable. If Growth is 50, its per site
figure is 25.00, so Growth PRO over 3 sites needs at least 76 prompts to clear
it, and 76 prompts costs **EUR 73.95 against a EUR 67.35 ceiling, a breach of EUR
6.60**. Growth at 50, per site monotonicity, and the 15 percent ceiling cannot
all three hold. The cheapest of the three to give up is the number that never
shipped and was priced against costs that no longer exist. The 75 in
`PRICING-STRATEGY-2026-07.md` §3 is stale on the same grounds and by more: it was
written for a 4 engine Growth at EUR 0.110 a check.

**(c) The Growth PRO inversion (11.67 per site, below Growth's 17.50).** RESOLVED
by raising Growth PRO from 35 to **56**, giving 18.67 per site. Constantin has
already ruled that a package sells a tier and not prompts (decision 4), so this
increase is **additional to** the Growth PRO argument, never a substitute for it.
The upsell is still argued on 2 more engines (Grok and AI Overviews, the only
engines that see X and the default Google results block), a third website, and 3x
AI SEO page depth (10 to 30).

**(d) The `pro` inversion (6.00 per site, below Essentials' 7.50).** RESOLVED by
cutting `pro` from 20 sites to **10** and raising it to 200 prompts, making it
identical to Managed on both axes, which is what "legacy, treated as Managed"
already means everywhere else in the code. **This costs no customer anything**:
D1 has not shipped, so no `pro` client has ever held more than one site, and the
20 was a paper allowance in an undelivered feature. Cutting it after D1 ships
would be a customer impacting migration; cutting it now is free.

## Which lever I am pulling

**LEVER A: cut allowances relative to the aspiration, hold the 15 percent
ceiling, keep per site monotonicity.** I am not raising the ceiling and I am not
dropping monotonicity.

**Relative to what customers actually have, nothing is cut.** Every tier either
holds or rises: Free 5 holds, Essentials 15 to 18, Growth 35 holds, Growth PRO 35
to 56, Managed 120 to 200, Pro 120 to 200. That matters because a reduced
allowance is a customer impacting migration under AUTONOMY, and this ruling
requires none.

**I must correct the architecture doc's impossibility proof.**
`multi-site-tenancy.md` §9.2 concludes that "no choice of `PLAN_PROMPTS` can make
per site capacity increase from Growth upward". That proof holds only if every
tier spends its full ceiling. Per site budget ceiling is indeed flat (EUR 22.43,
22.45, 22.50). But per site **prompts** are per site spend divided by per prompt
cost, and per prompt cost rises with the tier (0.8173 to 0.9730). Rising per site
prompts are therefore achievable by having the lower tiers sit further below
their ceiling, which is exactly what this ladder does: Growth spends 63.8 percent
of its ceiling, Growth PRO 80.9 percent, Managed 86.5 percent.

**The honest cost of that, stated plainly:** Growth leaves EUR 16.24 a month
unspent, which is capacity a Growth customer paid for and does not receive. The
strongest counter-argument to this whole ruling is that Growth is the hero tier
and we are under serving it to protect Growth PRO's story. My answer is that
Growth is not being reduced from anything, its step over Essentials is already
real (2 more engines, 1.9x the prompts, AI SEO unlocked), and the alternative is
either a margin breach or an upsell nudge that is false.

## The ladder

Modelled cost uses the per prompt figures above. "Naive" is the same ladder if
the SerpApi monthly cap were ever lifted and all engines ran weekly.

| Plan | Price EUR | Engines | **Prompts** | Sites | **Per site** | Modelled EUR/mo | Budget EUR | Headroom EUR | Cost % of price | Naive EUR/mo |
|---|---|---|---|---|---|---|---|---|---|---|
| free | 0 | 1 | **5** | 1 | **5.00** | 0.540 | 0.30 | **BREACH 0.240** | n/a | 0.540 |
| radar | 29 launch | 2 | **7** | 1 | **7.00** | 4.247 | 4.35 | 0.103 | 14.6% | 4.247 |
| radar | 39 list | 2 | **7** | 1 | **7.00** | 4.247 | 5.85 | 1.603 | 10.9% | 4.247 |
| essentials | 99 | 3 | **18** | 2 | **9.00** | 13.494 | 14.85 | 1.356 | 13.6% | 13.494 |
| growth | 299 | 5 | **35** | 2 | **17.50** | 28.607 | 44.85 | 16.243 | 9.6% | 33.973 |
| growth_pro | 449 | 7 | **56** | 3 | **18.67** | 54.488 | 67.35 | 12.862 | 12.1% | **75.955 BREACH 8.61** |
| managed | 1500 | 7 | **200** | 10 | **20.00** | 194.600 | 225.00 | 30.400 | 13.0% | **271.267 BREACH 46.27** |
| pro (legacy) | 1500 | 7 | **200** | **10** (was 20) | **20.00** | 194.600 | 225.00 | 30.400 | 13.0% | **271.267 BREACH 46.27** |
| enterprise | custom | 7 | **100000** sentinel | 25 | n/a | budget bound | 1500.00 | n/a | n/a | n/a |

Totals: 5, 7, 18, 35, 56, 200, 200. Strictly increasing across every sellable
boundary.
Per site: 5.00, 7.00, 9.00, 17.50, 18.67, 20.00. Strictly increasing across every
sellable boundary. **No inversion anywhere.**

## Breaches, printed rather than described

**1. The free tier cannot complete one collection run inside its own budget.**
5 prompts x EUR 0.108 = **EUR 0.540 against a EUR 0.30 budget. Over by EUR
0.240, which is 80 percent of the budget.** `_auth.js:checkCollectionLimits`
blocks when `clientSpent >= clientBudget`, so a free client collects prompts 1,
2 and 3 (running total EUR 0.324) and then prompt 4 is refused with "Monthly API
budget exceeded for this plan (EUR 0.32 of EUR 0.30). Contact support to raise
this limit." **A free signup sees 3 of the 5 prompts they were promised and a
billing error, at the top of the funnel the entire sprint depends on.** This is
not a new decision of mine; it is a live defect created when ChatGPT was repriced
from EUR 0.056 to EUR 0.108 and the free budget was not moved.

**RULING: raise `PLAN_MONTHLY_API_BUDGET_EUR.free` from 0.30 to 0.60.** That is
EUR 0.54 of collection plus EUR 0.06 of slack. Counter-argument: free earns EUR
0, so every cent is pure cost, and 1,000 free signups is EUR 600 a month. The
containment is that free runs monthly (720h cooldown), so per client cost is
bounded at EUR 0.54 and cannot compound, and `PLATFORM_MONTHLY_API_BUDGET_EUR`
(12,000) is the backstop against a signup flood.

**2. The ladder depends on the SerpApi monthly cap and breaks without it.** The
naive column above shows Growth PRO breaching by **EUR 8.61** and Managed by
**EUR 46.27** if `MONTHLY_CAPPED_ENGINES` is ever removed. That constant is
currently a one word edit in `_cost.js` with no test pinning it. **S2 should add
an assertion that `google_ai` and `ai_overview` are both in
`MONTHLY_CAPPED_ENGINES`**, because deleting it silently reprices two tiers past
their ceiling.

**3. One Managed client consumes the entire platform SerpApi pool.** At the
monthly cap, credits per client per month are prompts x credits per check:

| Plan | Prompts | Credits per check | **Credits / month** | % of the 500 pool |
|---|---|---|---|---|
| radar, essentials, free | any | 0 | **0** | 0% |
| growth | 35 | 1.0 | **35** | 7% |
| growth_pro | 56 | 2.5 | **140** | 28% |
| managed / pro | 200 | 2.5 | **500** | **100%** |

**A book of one Managed client and nothing else exhausts the pool.** One Managed
plus two Growth PRO is 780 credits, 156 percent. This is a hard scaling wall on
the top of the ladder and it is not solved by any prompt number, because credits
are a platform resource and the ladder is per client. It is out of S1's scope to
rule on because it is a vendor purchase decision, and it is recorded here as
OPEN QUESTION 2b.

## Exact constants to ship (S2 pastes these)

```ts
// src/lib/planConfig.ts AND netlify/functions/_cost.js, value for value
export const PLAN_PROMPTS: Record<Plan, number> = {
  free: 5, radar: 7, essentials: 18, growth: 35, growth_pro: 56,
  managed: 200, pro: 200, enterprise: 100000,
}

export const PLAN_MONTHLY_API_BUDGET_EUR: Record<Plan, number> = {
  free:         0.60,   // RAISED from 0.30: 5 prompts x EUR 0.108 = 0.54
  radar:        4.35,   // 15% of the EUR 29 launch price; 5.85 when list resumes
  essentials:  14.85,   // 15% of 99, unchanged
  growth:      44.85,   // 15% of 299, unchanged
  growth_pro:  67.35,   // 15% of 449, unchanged
  managed:    225.00,   // 15% of 1500 floor, unchanged
  pro:        225.00,   // legacy, treated as Managed, unchanged
  enterprise: 1500.00,  // 15% of the 10000 floor, unchanged
}
```

```sql
-- db/supabase-plan-caps-2026-07-31-migration.sql  (ship a down path)
insert into public.plan_prompt_caps (plan, prompt_cap, site_allowance) values
  ('free',         5,  1),
  ('radar',        7,  1),
  ('essentials',  18,  2),
  ('growth',      35,  2),
  ('growth_pro',  56,  3),
  ('managed',    200, 10),
  ('pro',        200, 10),
  ('enterprise', 100000, 25)
on conflict (plan) do update
  set prompt_cap = excluded.prompt_cap,
      site_allowance = excluded.site_allowance,
      updated_at = now();
-- DOWN: restore 5,15,35,35,120,120,100000 and drop the 'radar' row.
```

**SHIPPING CONSTRAINT on this decision, stated because the sprint will hit it.**
`plan_prompt_caps` is a **fifth** copy of the ladder (after `planConfig.ts`,
`_cost.js`, `_plans.js` and `onboard-client.js`) and it is the copy with teeth:
`trg_enforce_prompt_cap` refuses the INSERT at the database. If S2 ships the page
before the migration, a customer sold 18 prompts is refused at prompt 16 by a raw
Postgres error with no message. The migration and the constants must land in the
same deploy, and the trigger's fallback is deliberately `free` for an unknown
plan, so a `radar` row that does not exist yet silently caps Radar customers at
**5**.

### OPEN QUESTION 2a

Essentials at **20** prompts breaches its ceiling by **EUR 0.14 a month**, which
is 0.94 percent of the budget and 0.14 percent of the price. 20 is the round
number marketing wants and the number the pricing doc already publishes. I ruled
18 because the task forbids softening a breach, and 14 cents is still a breach.
Constantin can have 20 by lifting Essentials' ceiling to **15.2 percent** (EUR
15.05), which is a one line decision and costs EUR 0.20 a month per Essentials
customer. I did not take it myself because raising the ceiling for one tier is
lever B, and I ruled lever A.

### OPEN QUESTION 2b

**The SerpApi pool is the binding constraint on the top of the ladder and no
prompt number can fix it.** 500 credits a month at USD 25 supports either one
Managed client, or three Growth PRO clients, or fourteen Growth clients, and
nothing else. Two routes: buy a larger SerpApi plan (a vendor purchase, yours),
or cap SerpApi engines at a subset of the prompt allowance rather than all of it,
which is an architecture change and a copy problem ("AI Overviews on 40 of your
200 prompts"). **This does not block S1 or S2**, because today's book is small
enough to fit, but it becomes live the moment a second Managed client signs.

### OPEN QUESTION 2c

Enterprise's website count is D-3c and explicitly not mine. I have put **25** in
the table so S2 has a value and the migration is complete. It satisfies
monotonicity trivially. Note that `enterprise: 100000` is a sentinel, not a
promise: at EUR 0.9730 a prompt the EUR 1,500 budget stops collection at **1,541
prompts**, so the real cap is 1,541 and the schema says 100,000.

**DECIDED <date>:**

---

# Decision 3. Pooling for D1 shared limits: SUM or MAX

**The question:** when an account holds several websites, does the shared pool
equal the sum of every site's plan allowance, or the largest one?

## The arithmetic, two Essentials sites

At the ruled Essentials figures (18 prompts, EUR 14.85 budget, EUR 0.7497 per
prompt per month), an account with two Essentials sites pays 2 x EUR 99 = **EUR
198 a month**.

| | Prompt pool | Budget pool | Modelled cost | Cost as % of the EUR 198 paid | Budget as % of the EUR 198 paid | What site 1 has after site 2 is added |
|---|---|---|---|---|---|---|
| **MAX** | 18 | 14.85 | 13.494 | **6.8%** | **7.5%** | **fewer prompts than before**, it now shares 18 with site 2 |
| **SUM** | **36** | **29.70** | 26.988 | **13.6%** | **15.0%** | **unchanged at 18**, site 2 brings its own |

**RECOMMENDATION: SUM the pools, MAX the site allowance.**

The number that drives it: **under MAX the second EUR 99 buys 0 prompts and EUR
0.00 of budget.** The customer pays 100 percent more and receives nothing except
permission to divide what they already had. Under SUM the second EUR 99 buys EUR
13.49 of collection at a **marginal gross margin of 86.4 percent**, and the
account's budget lands at exactly 15.0 percent of revenue, which is the number
the entire ladder was designed around. MAX puts it at 7.5 percent, which sounds
like better margin and is actually a product nobody will buy twice.

**The architect's objection is answered by the split, not overruled.**
`multi-site-tenancy.md` §8 argues that under SUM "a customer could always add one
more site to earn room for one more site, so the allowance would bound nothing".
That is true of SUM applied to everything. It is not true of SUM for pools with
MAX for the site allowance: adding a site adds prompts and budget but adds **zero
site allowance**, so two Essentials sites give an allowance of `max(2, 2) = 2` and
the account is full. A third site requires upgrading one site to Growth PRO,
which is the intended upsell. The loop is broken exactly where the architect
feared it.

## What has to be enforced for this ruling to be real

**The trap, and it is live.** `PLAN_MONTHLY_API_BUDGET_EUR` is per client.
`_auth.js:checkCollectionLimits` sums `ai_results.cost_eur` filtered
`.eq('client_id', clientId)` against `PLAN_MONTHLY_API_BUDGET_EUR[plan]`, and
`enforce_prompt_cap()` counts `where client_id = new.client_id`. **A site is a
client row.** So the day D1 ships without touching either, the product delivers
SUM by accident, and this ruling would be decorative rather than chosen.

It is worse than merely accidental, because per client SUM and account level SUM
are **different products the moment sites are on different tiers**, which is
explicitly allowed. A Growth site plus an Essentials site:

| | Growth site can spend | Essentials site can spend | Total |
|---|---|---|---|
| per client (today's code) | 44.85, and not a cent more | 14.85, even if Growth spent 0 | 59.70 |
| **account level SUM (ruled)** | **up to 59.70** | **up to 59.70** | **59.70** |

Four things must change for the ruling to bind:

1. **`checkCollectionLimits` resolves `clients.account_id`**, sums
   `PLAN_MONTHLY_API_BUDGET_EUR[plan]` over every site in the account, and sums
   `ai_results.cost_eur` over every site in the account.
2. **`enforce_prompt_cap()` counts active prompts across the account** and
   compares against the summed `plan_prompt_caps.prompt_cap`.
3. **The site allowance uses MAX**, read from `plan_prompt_caps.site_allowance`
   and ranked by `PLAN_ORDER`, never by comparing allowance numbers, because
   `essentials` and `growth` share an allowance of 2 (tenancy arch §794).
4. **Both checks fail closed.** If the account lookup fails, collection is
   blocked. A budget check that cannot determine the budget must not conclude
   there is none.

Item 4 is not optional: an account level check has a failure mode a per client
check does not, and the safe direction is refusal.

### OPEN QUESTION 3a

SUM makes the account budget grow with every site, so a large account has a large
pool that any one of its sites may drain. An account with nine Essentials sites
and one Growth site has a EUR 178.50 pool that the Growth site could consume
alone in a month, leaving nine sites dark. **I recommend shipping SUM without a
per site sub cap** and instrumenting consumption per site first, because a sub
cap invented before any multi site customer exists is a guess, and D-4 is already
going to surface per site consumption to the customer. If Constantin wants a
guard now, the cheapest is a floor rather than a cap: reserve each site's own
plan budget and pool only the remainder.

**DECIDED <date>:**

---

# Decision 4. A package sells a tier, not prompts

**DECIDED 2026-07-31 by Constantin, commit `67a3cf4`.** Carried forward
unchanged. Not reopened and not re-argued here.

A package sells the tier exactly as it stands. No package copy may promise a
prompt count above the tier's own, and A2 §3.4 is not needed to sell a package.

**The one consequence, restated because decision 2 touches it:** the Growth to
Growth PRO upsell is argued on **engines, websites and AI SEO depth**, never on
volume. Decision 2 raises Growth PRO from 35 to 56 prompts, which makes the
volume claim true where it was previously false, but that increase is
**additional to** the argument, not a replacement for it. The sentence that
sells Growth PRO is: 2 more engines (Grok, the only engine that reads X, and AI
Overviews, the summary block on ordinary Google results that reaches far more
searchers than AI Mode), a third website, and 3x the AI SEO page depth (10 to
30). `bg-copy` owns the wording.

**DECIDED 2026-07-31, `67a3cf4`.**

---

## What this ruling does not decide

- **No refund policy, no guarantee, no SLA, no trial terms.** The ROADMAP warning
  block is binding and nothing here creates one. Note that
  `PRICING-STRATEGY-2026-07.md` §7 carries per tier CTAs reading "Start free
  trial". **No trial mechanism exists in the code and none is ruled here.** That
  copy is either stale or an unwritten commitment, and it is Constantin's to
  settle before Radar's pricing page ships.
- **Enterprise's website count** (D-3c). 25 is provisional, see OPEN QUESTION 2c.
- **The SerpApi plan size** (OPEN QUESTION 2b). Vendor purchase.
- **Nothing in Stripe was created or changed.** Both Radar prices are
  instructions for S2, not actions taken.

## Documents this ruling makes stale

| File | What is now wrong |
|---|---|
| `planConfig.ts:400-420` comment block | The whole cost table. Written at ChatGPT EUR 0.056 and a 6 engine top tier, and it claims a restore that never happened. Replace it, do not amend it. |
| `docs/PRICING-STRATEGY-2026-07.md` §3, §5 | Growth 75 prompts, Growth PRO 100, the 4 and 5 engine counts, the EUR 0.110 / EUR 0.125 check prices, and the 12 percent budget. All superseded. |
| `docs/arch/multi-site-tenancy.md` §9.2, §9.3 | The impossibility proof holds only at full ceiling spend, and the recommended `5, 20, 50, 75, 250` breaches on two tiers at current prices. §9's structure and its `pro` 20 to 10 finding both stand. |
| `docs/ROADMAP.md` "three conflicting Growth prompt counts" | Resolved at 35, not at 50 or 75. |
| `docs/HANDOVER-2026-07-31.md` §5 item 1 | "the code is the outlier, not the docs" is the wrong way round. |

---

## Handoff packet

**FROM** `bg-strategy` (S1) **TO** `bg-backend` on Opus (S2), then `bg-verify`.

**Objective.** Apply decisions 1, 2 and 3 to the ladder, end to end, with no
sixth copy of the numbers created.

**Blocked by.** Constantin's four `DECIDED` lines above. Do not start on any
decision whose line is still blank.

**scope_write.** `brandgeo-dashboard/src/lib/planConfig.ts`,
`brandgeo-dashboard/netlify/functions/_cost.js`, `_plans.js`, `_auth.js`,
`onboard-client.js`, `db/supabase-plan-caps-2026-07-31-migration.sql`,
`brandgeo-dashboard/src/pages/Signup.tsx`, `brandgeo/web/index.html`,
`brandgeo/web/faq.html`, Stripe (create only).

**scope_read.** This file, `docs/arch/multi-site-tenancy.md` §6.4 and §9,
`db/supabase-prompt-cap-migration.sql`.

**Do.**
1. Run `git log -- <each file>` before editing any of them (AUTONOMY §5.3).
2. Land the constants and the migration in the **same deploy**. The trigger falls
   back to the `free` cap for an unknown plan, so a live `radar` plan with no
   `plan_prompt_caps` row silently caps Radar customers at 5 prompts.
3. Ship the migration with a down path. Not night safe: this is billing.
4. Add the `MONTHLY_CAPPED_ENGINES` assertion described under breach 2.
5. Create both Radar Stripe prices, live mode, create only, linked nowhere
   customer visible. `metadata.plan = radar` on both.

**Do not.**
- Do not run git. The orchestrator commits.
- Do not raise the 15 percent ceiling anywhere. If a number does not fit, stop
  and report it rather than widening the ceiling to accommodate it.
- Do not touch `PLAN_COLLECTION_COOLDOWN_HOURS` for any existing plan.
- Do not link either Radar price to a customer visible surface until S7 has ruled
  on LAUNCH30's scope.

**Acceptance criteria.**
1. `PLAN_PROMPTS`, `_cost.js`, `_plans.js`, `onboard-client.js`'s `VALID_PLANS`
   and `plan_prompt_caps` all carry the same eight plans and the same eight
   numbers. Five copies, one value set, verified by query and not by reading.
2. `scripts/check-ladder-drift.sh` exits 0.
3. `node brandgeo-dashboard/tests/package_provisioning.test.js` exits 0.
4. `npx tsc --noEmit` exits 0 and `npm run build` exits 0.
5. A `radar` client can be assigned by `set-client-plan.js` and provisioned by
   `onboard-client.js` without coercion to another tier. This is the exact defect
   class that made Growth PRO unassignable and silently downgraded Growth
   onboardings; a new plan reintroduces it in four places at once.
6. `select plan, prompt_cap, site_allowance from public.plan_prompt_caps order by
   prompt_cap;` returns the eight rows above.
7. The live pricing page and `faq.html` show the ruled numbers, JSON-LD validates
   on every touched page, and no em or en dash appears in any of it.

**Then.** `bg-verify` on the whole diff. Billing change, mandatory review, no
exceptions.

**Also unblocks.** S7 (LAUNCH30 scopes to Essentials and up, Radar is excluded),
D1 (decision 3 gives the pooling rule and the enforcement points), and the
D1-upsell copy, which now has a true sentence available to it for the first time.
