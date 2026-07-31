# Radar unit economics, worst case

Written 2026-07-31 by `bg-strategy` for Constantin. Stress test of decision 1 in
`docs/strategy/sprint-ladder-ruling.md`, not a repeat of it. No code was touched,
no price was changed, nothing was written to Stripe.

**The question:** is Radar profitable in the WORST case, where a customer uses
every single thing the plan allows?

---

## The number to remember

> **EUR 4.85 per customer per month.**
>
> That is the maximum collection spend a Radar customer can force, and it is
> **EUR 0.50 above the EUR 4.35 cap that is supposed to stop it**. It is 16.7
> percent of the EUR 29 launch price against a cap designed to hold it at 15.0
> percent. Worst case gross margin is **79.0 percent at EUR 29** after payment
> fees, **83.5 percent at EUR 39**.

**Radar is profitable in the worst case and it is not close.** The tier as ruled
is sound. Three things that are not API cost are what actually put it at risk,
and all three are section 2 and section 5 findings, not section 3 ones.

---

## 0. Where every number comes from

The ruling's own summary table was not used. These figures come from the
enforcing code and, where the code only carries a fallback estimate, from metered
production rows.

| Input | Value | Source |
|---|---|---|
| gemini per check | EUR 0.03200 | `_cost.js:249`. **Always this value**, never metered: `estimateCostEur` has no `MODEL_PRICE_USD['gemini']` entry (`_cost.js:123-137`) so it returns null and `costForRow` falls through to the constant (`_cost.js:347-352`). Confirmed against production: 8 gemini rows written 2026-07-30 and 2026-07-31, every one exactly 0.03200. |
| claude per check, mean | EUR 0.03335 | **Measured.** All 6 metered claude rows in production (2026-07-30 11:57 to 11:59 UTC), min 0.02960, max 0.04014, p95 0.04012. Priced by `estimateCostEur` from `MODEL_PRICE_USD.claude` (`_cost.js:133`) plus `TOOL_FEE_USD.claude` 0.010 (`_cost.js:152`). |
| claude per check, worst | EUR 0.04014 | Same 6 rows, observed maximum. Used for every worst case below. |
| Radar prompts | 7 | Ruling decision 1, signed. |
| Radar budget cap | EUR 4.35 | Ruling decision 1. **Not yet in any file**, see section 7. |
| Radar cooldown | 168h | Ruling decision 1, matching `_cost.js:529-532`. |
| Fixed platform base | EUR 187.50/month attributable | `PRICING-STRATEGY-2026-07.md:90`, Netlify EUR 50 plus Claude Max EUR 137.50. Ayrshare and SerpApi are excluded, see section 4. |
| Stripe fee | 1.5% to 3.4% plus EUR 0.25/txn | `PRICING-STRATEGY-2026-07.md:108`. |

**Sample size warning, stated once and it applies everywhere below.** There are
exactly **6** metered claude rows in the entire database, all written inside an
85 second window on one day. Every claude figure in this document rests on them.
The gemini figure is a constant and needs no sample. If claude's real
distribution has a longer tail than 6 rows can show, the worst case moves; the
direction of the error is unknown, not favourable.

**Where the ruling and the code disagree, the code wins and the difference is
tiny.** The ruling used claude at the `_cost.js:218` fallback of 0.033. Measured
mean is 0.03335. So the ruling's EUR 0.065 per check is really EUR 0.06535, its
EUR 1.972 monthly is really EUR 1.982, and its 93.2 percent margin is really 93.2
percent. **Decision 1's arithmetic is correct.** What it never computed is a
worst case, which is what this document adds.

---

## 1. The worst case, computed

### 1a. What actually limits a Radar customer

Four controls exist. Only one of them binds, and it is not the one the ruling
leans on.

| Control | Value for Radar | Does it bind? |
|---|---|---|
| Manual run cooldown, queue path | 168h (`_cost.js:530`), checked at `enqueue-collection.js:45` via `checkCollectionCooldown` (`_enqueue.js:244`) | **No.** Permits 5 starts in a 31 day month. |
| Manual refresh, per prompt path | **none** | **No, because it does not exist.** See 1b. |
| Hourly abuse ceiling | `max(150, 7 x 2)` = **150 rows/hour** (`_auth.js:200-203`) | **No.** 150 rows is 10.7 complete Radar runs per hour. |
| Monthly EUR budget | EUR 4.35 (`_auth.js:230-239`) | **Yes. This is the only real control.** |

### 1b. The per prompt refresh button has no cooldown, and that is the finding

`runSinglePrompt` in `collectionContext.tsx:145` (the "Refresh this prompt"
button) does **not** go through `enqueue-collection.js`. It posts directly to
`collect-prompt`, `collect-claude` and `collect-chatgpt`. Those three functions
call `checkCollectionLimits` (`collect-claude.js:45`) and **never call
`checkCollectionCooldown`**. Grepping the whole `netlify/functions` directory for
`cooldown` returns hits in exactly two files, `enqueue-collection.js` and
`_enqueue.js`, plus `seo-crawl.js` for its own separate 7 day crawl cooldown.

`force` is read straight from the request body (`collect-claude.js:34`) and a
viewer passes the ownership check for their own client (`collect-claude.js:40`).
So the 168h cadence that the whole tier design rests on is enforced on one of two
paths. On the other path the customer may re-collect as often as they like.

The 150 rows/hour ceiling is the only thing left, and the ruling records it as
"never binding" as if that were reassurance. It is the opposite. If the EUR
budget check were absent or wrong, 150 rows/hour at the worst per check figure is
EUR 10.82 an hour, or **EUR 7,900 a month for one Radar customer**. Everything
rests on one comparison at `_auth.js:232`.

### 1c. The arithmetic

Assumptions, each labelled:

- **A1.** Both engines run on every check. Radar is `['gemini', 'claude']`.
- **A2.** Every claude row costs its observed maximum, EUR 0.04014. Deliberately
  not the mean. Not rounding in our favour.
- **A3.** The customer uses `force` on every run, so nothing is skipped by the
  calendar month check at `collect-claude.js:53-66`.
- **A4.** 31 day month. Longest available, so the most cooldown windows fit.
- **A5.** The automatic cadence fires as sold, weekly, on top of manual use.

```
Per check      = gemini 0.03200 + claude 0.04014            = EUR 0.07214
Per full run   = 7 prompts x 0.07214                        = EUR 0.50498

Runs the CADENCE permits in a 31 day month:
  manual, queue path, 168h apart:  t=0, 168h, 336h, 504h, 672h (day 28) = 5
  scheduled weekly (schedule-collections.js CADENCE_DAYS.weekly = 7)    = 5
  per prompt refresh path, no cooldown                                  = unbounded
  Cadence-permitted minimum                                        = 10 runs
  10 x 0.50498                                                     = EUR 5.0498

So the cadence does NOT bind. The budget does. Recompute against the budget:

  Full runs the EUR 4.35 cap funds outright: 4.35 / 0.50498 = 8.614
  8 complete runs                                          = EUR 4.03984
  9th run is admitted, because 4.03984 < 4.35, and completes
  Settled spend after 9 runs                               = EUR 4.54482
```

**That is the honest worst case if the customer only presses Force Refresh:
EUR 4.545.**

An adversarial customer does better, because the two paths have different
granularity. Single prompt refreshes advance spend in EUR 0.032 to EUR 0.040
steps, so the customer can creep to just under the cap and then fire one whole
14 row queue run that is admitted on the last cent:

```
  Largest spend at which a queue run is still admitted      < EUR 4.35
  Plus one full run                                         + EUR 0.50498
  Structural maximum                                        = EUR 4.85 (approx)
```

**Worst case: EUR 4.855 per customer per month.**

### 1d. The expected case, and it is not what the tier is sold as

Two figures, and the gap between them matters.

**As sold (weekly automatic cadence):** 4.333 runs x 7 prompts x EUR 0.06535
mean per check = **EUR 1.982 per month**. This is the ruling's EUR 1.972,
corrected for measured claude. Correct.

**As actually configured today: EUR 0.457 per month.** Production query,
2026-07-31: all 36 rows in `clients` have `refresh_cadence = 'manual'`. Not one
client on any plan has a cadence set. `schedule-collections.js:68` only selects
clients whose cadence is in `{weekly, biweekly, monthly}`, so **nothing fires
automatically for anybody**. Without force, `collect-claude.js:53-66` skips any
(prompt, engine) pair that already succeeded in the current calendar month, so a
customer who never presses Force Refresh gets exactly one run a month.

**The weekly refresh that Radar is sold on does not happen unless S2 sets
`refresh_cadence = 'weekly'` on every Radar client at provisioning.** That is not
in the ruling's handoff packet. If it is missed, Radar customers pay EUR 29 for a
trend line built from one data point a month, which is the exact thing decision 1
says distinguishes Radar from Free.

---

## 2. Does the budget cap actually hold?

**Directionally yes. Exactly no. And in one plausible S2 configuration, not at
all.**

### 2a. The enforcement path, read rather than assumed

1. `enqueue-collection.js:57` and each of the three HTTP collectors
   (`collect-claude.js:45`, and the same in `collect-prompt.js` and
   `collect-chatgpt.js`) call `checkCollectionLimits(supabase, clientId)`.
2. `_auth.js:180` resolves the client's plan, defaulting to `'essentials'` if the
   plan is not in `VALID_PLANS` (`_auth.js:191`), where
   `VALID_PLANS = Object.keys(PLAN_LIVE_ENGINE_COUNT)` (`_auth.js:28`), derived
   from `PLAN_LIVE_ENGINES` in `_cost.js:377`.
3. `_auth.js:223-229` sums `ai_results.cost_eur` for that client since the start
   of the calendar month.
4. `_auth.js:230-239` blocks when `clientSpent >= clientBudget`.

### 2b. Leak 1: the cap is checked once per run, not once per row

`enqueue-collection.js:54-56` says so in its own comment: "Checked here at
enqueue time (not per-job in the worker) so an over-budget run never gets
created." `collection-worker-background.js` does not appear in a repo-wide grep
for `checkCollectionLimits`. So once a run is admitted, all 14 of its rows are
written regardless of what the running total does.

**Consequence: the cap is `budget + one full run`, not `budget`.** For Radar that
is EUR 4.35 plus EUR 0.505, or EUR 4.855. The claim "in principle spend cannot
exceed it" is false by one run on every plan, and the absolute size of the leak
grows with the tier: for Managed at 200 prompts and 7 engines it is far larger.
This is a general finding, not a Radar one.

### 2c. Leak 2, the serious one: the cap fails OPEN for an unmapped plan

`_auth.js:230`:

```js
const clientBudget = PLAN_MONTHLY_API_BUDGET_EUR[plan]
```

There is **no default**. If `plan` is `'radar'` and
`PLAN_MONTHLY_API_BUDGET_EUR` has no `radar` key, `clientBudget` is `undefined`,
`clientSpent >= undefined` evaluates to `false`, and the function proceeds to the
platform check and returns unblocked. **Radar would have no budget cap at all.**

This is not hypothetical. It is the exact configuration S2 produces if it does
one of its two required edits and not the other:

| S2 ships | `_auth.js:191` resolves plan to | Effective cap | Outcome |
|---|---|---|---|
| `PLAN_LIVE_ENGINES.radar` **and** `PLAN_MONTHLY_API_BUDGET_EUR.radar` | `radar` | EUR 4.35 | Correct |
| `PLAN_LIVE_ENGINES.radar` **only** | `radar` | **none** | **Uncapped. Ceiling becomes 150 rows/hour, roughly EUR 7,900/month per client.** |
| `PLAN_MONTHLY_API_BUDGET_EUR.radar` **only** | `essentials` | EUR 14.85 | 3.4x the intended cap, 51% of the EUR 29 price |

The two maps are keyed independently, they live in the same file thirteen lines
of comment apart (`_cost.js:377` and `_cost.js:508`), and nothing couples them.
The repo already has `scripts/check-ladder-drift.sh` in the ruling's acceptance
criteria; it must cover this pair specifically.

**This is the single change that turns a 79 percent margin negative, and it is a
missing object key.**

### 2d. What the customer experiences when the cap binds

Not a raw error. `_auth.js:237` returns, as HTTP 429:

> `Monthly API budget exceeded for this plan (EUR 4.35 of EUR 4.35). Contact support to raise this limit.`

It is a clean, deliberate message. **It is also the wrong message, and it is
wrong in a way that attacks the number section 5 shows is decisive.**

Three problems, in order of cost:

1. **It routes a EUR 29 customer into a human support queue.** "Contact support
   to raise this limit" is an instruction to open a ticket. Section 5 shows that
   support minutes, not tokens, decide whether Radar is worth operating. This
   message manufactures the expensive input on the cheapest tier, at the moment
   the customer is already frustrated.
2. **It names a number the customer never agreed to.** "EUR 4.35" appears on no
   pricing page, in no invoice, and in no contract. A customer told they have hit
   a EUR 4.35 limit on a EUR 29 subscription will reasonably ask what they are
   paying for.
3. **It reads as a fault, not as a cadence.** The correct shape already exists
   twelve lines away in the same subsystem. `_enqueue.js:268` says: "Collection
   is on cooldown for your plan. The next run is available in about N hours."
   That is a product telling the customer how it works. The budget message is a
   product telling the customer it broke.

**Verdict on section 2's own question:** this is a cap that protects margin by
breaking the product, not one that protects margin cleanly. The margin protection
is real and worth keeping. The message is a copy fix, it belongs to `bg-copy`,
and it should say when the next collection is available and offer the upgrade,
never "contact support".

---

## 3. Gross margin

COGS here is collection API spend plus the payment fee. Fixed platform cost is
handled as an allocation in section 5, not as COGS, because it does not vary with
this customer.

### At EUR 29 (launch price)

| | API | Stripe | COGS | Gross profit | **Gross margin** |
|---|---|---|---|---|---|
| Expected, as sold | 1.982 | 0.685 | 2.667 | **EUR 26.33** | **90.8%** |
| Expected, as configured today | 0.457 | 0.685 | 1.142 | EUR 27.86 | 96.1% |
| **Worst case** | **4.855** | **1.236** | **6.091** | **EUR 22.91** | **79.0%** |

### At EUR 39 (list price)

| | API | Stripe | COGS | Gross profit | **Gross margin** |
|---|---|---|---|---|---|
| Expected, as sold | 1.982 | 0.835 | 2.817 | **EUR 36.18** | **92.8%** |
| **Worst case** | **4.855** | **1.576** | **6.431** | **EUR 32.57** | **83.5%** |

Stripe low case is 1.5% plus EUR 0.25 (European card), high case is 3.4% plus
EUR 0.25 (international card), per `PRICING-STRATEGY-2026-07.md:108`. The worst
case uses the high card rate on the reasoning that worst means worst.

**On API cost alone, ignoring payment fees, for comparison with the ruling's own
figures:** expected 93.2 percent at EUR 29 (matches decision 1 exactly), worst
case **83.3 percent** at EUR 29 and **87.6 percent** at EUR 39.

**Note the direction of the cap at list price.** `PLAN_MONTHLY_API_BUDGET_EUR` is
keyed by plan, not by price, so the EUR 4.35 cap the ruling set at 15 percent of
EUR 29 is only 11.2 percent of EUR 39. A list price customer is capped tighter
relative to what they pay. That is the safe direction and the ruling chose it
deliberately (decision 1, "The budget constant, and a trap inside it"). It is
worth restating because it means **the day the EUR 29 price is retired, worst
case margin at list improves without any other change.**

---

## 4. What a per prompt model misses

### 4a. Gemini is free until it is not, and the modelled figure already covers it

`_cost.js:99-101` and `:112`: gemini grounding is USD 35 per 1,000 grounded
prompts, with the first **1,500 requests per day free**, and retrieved context is
not billed as tokens.

The good news first. EUR 0.032 is the **paid** list rate, already carried in
`ENGINE_COST_EUR` and already inside every figure in this document. So when the
free tier is exhausted, **no modelled number in section 3 changes.** What changes
is cash out, which rises from claude only to the full modelled figure:

| | Modelled cost | True cash out today | Cash out past 1,500/day |
|---|---|---|---|
| Expected, per client | EUR 1.982 | EUR 1.012 (claude only) | EUR 1.982 |
| Worst case, per client | EUR 4.855 | EUR 2.245 (claude only) | EUR 4.855 |

**The ruling's Gemini ceiling is 9x optimistic and this is a correction.**
Decision 1 states the free tier ceiling is "reached at 214 Radar clients on a
single collection day (1,500 / 7)". That arithmetic assumes each client makes
**one run** of 7 gemini calls on that day. At the budget cap a client can make
**nine** runs, which is 63 gemini calls, and nothing prevents them landing on one
day because the per prompt refresh path has no cooldown (section 1b).

```
  1,500 / 7  = 214 clients at one run each      (the ruling's figure, correct as stated)
  1,500 / 63 =  24 clients at maximum usage     (the worst case, unstated)
```

So the free tier saturates at **24 concurrent maximum-usage Radar clients**, not
214. Past that point gemini calls either bill at EUR 0.032 (fine, already
modelled) or fail, depending on whether the account has billing enabled for
grounding. **Which of those two happens is unknown and is the one input in this
document that is neither measured nor derivable from a file.** A silent
collection failure on the entry tier is a churn event, not a cost event, and it
is worth ten minutes of checking before Radar is sold.

`S2 must spread the weekly schedule across weekdays` (ruling decision 1) remains
correct and is now more urgent, but it does not solve this: spreading the
scheduled runs does nothing about manual refreshes, which are the source of the
9x.

### 4b. AI SEO: Radar grants zero, and the server does not agree

The ruling sets `PLAN_SEO_PAGE_CAP.radar = 0` and
`PLAN_SEO_AUDITS_PER_WEEK.radar = 0`. `planConfig.ts` is not the file that
enforces this.

**`seo-crawl.js:16` is a sixth hardcoded copy of the ladder** (after
`planConfig.ts`, `_cost.js`, `_plans.js`, `onboard-client.js` and
`plan_prompt_caps`), and `seo-crawl.js:43` reads it with an **unsafe default**:

```js
const maxPages = CRAWL_PAGE_CAP[client?.plan] ?? 1;
if (maxPages <= 0) { /* refuse */ }
```

A `radar` plan is not a key in that map, so `maxPages` is **1**, the refusal
branch is skipped, and the crawl runs. The UI gate holds (`hasFeature` puts
`ai_seo` at Growth, and `planRank('radar')` would be 1), so this needs a direct
POST rather than a click, but the endpoint is the enforcement boundary and it
does not enforce. This repo has been burned by exactly this shape before.

`seo-draft.js:171` uses `?? 0` and is safe. `seo-audit-page.js` runs Claude Haiku
4.5 at `max_tokens: 1500` (`seo-audit-page.js:11`, `:60`).

**ASSUMPTION:** Haiku 4.5 at USD 1 in / USD 5 out per MTok, roughly 4k input and
1.5k output per page, gives about EUR 0.011 per page audited. One page a week is
about **EUR 0.05 a month**. In euros this is nothing.

**The money is not the finding. The finding is that it is outside the cap
entirely.** `checkCollectionLimits` sums `ai_results.cost_eur` and nothing else
(`_auth.js:223-229`). The `seo-*` functions write to `seo_briefs` and the crawl
tables, never to `ai_results`, and they never call `checkCollectionLimits`. So
`PLAN_MONTHLY_API_BUDGET_EUR` is not an account spend cap. **It is a collection
spend cap, and the product has at least two other LLM spend paths that it does
not see.** For Radar the exposure is EUR 0.05 a month. For Growth PRO at 30
drafts a month on Sonnet 5 at `max_tokens: 4000` (`seo-draft.js:19`, `:106`) it is
not, and that is a separate piece of work.

### 4c. AI Social: genuinely zero, and correctly enforced

`ADMIN_ONLY_FEATURES` contains `ai_social` (`planConfig.ts:366`), `hasFeature`
short circuits on it for every plan including any plan added later
(`planConfig.ts:568`), and all eleven `social-*.js` functions require
`requireAuth({ adminOnly: true })` (`planConfig.ts:361-363`). Radar grants no
social channels and no posts, and the gate is server side, not a hidden link.
**EUR 0, and this one needs no work.**

### 4d. The acquisition cost that arrives before the first euro does

If a Radar buyer comes through the free public audit, `_prospect_engines.js:396`
runs `FULL_ENGINES = ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai']`,
which includes **one SerpApi credit per prompt** on the platform's 500 credit
monthly pool. `estimateAuditCost` (`_prospect_engines.js:416-419`) prices it at
`perPromptCost x promptCount x 1.5 + 0.002`.

Radar itself consumes **zero** SerpApi credits, which is the whole reason the
ruling could scale it to 100. **Its acquisition path does not.** At 100 Radar
signups the audits that produced them drew SerpApi credits from the same 500
credit pool that one Managed client already exhausts (ruling decision 2, breach
3). This is not COGS and it should not be in the margin table, but it belongs in
the sprint's SerpApi arithmetic, and open question 2b does not currently include
it.

### 4e. `OVERHEAD_MULTIPLIER = 1.5`: not defensible, and not because of the number

`_prospect_engines.js:413`, surfaced on `Usage.tsx:368` as "API costs x 1.5
overhead (Supabase, Netlify, hosting, Plausible, domain)".

**The multiplier is the wrong functional form, so no value of it is defensible.**
The costs it names are fixed monthly commitments that do not vary with API spend.
`PRICING-STRATEGY-2026-07.md:89-99` documents the base as Ayrshare (EUR 300 at
ten or fewer social clients) plus Netlify EUR 50 plus Claude Max EUR 137.50 plus
SerpApi about EUR 50, and line 106 gives the correct model in one sentence:
"Pre-scale, the ~EUR 590 fixed base dominates (9 paying clients = EUR 65/client;
at 50 = EUR 12)."

Applied to Radar's expected API spend of EUR 1.982, a 1.5x multiplier allocates
**EUR 0.99** of overhead. The doc's own per client figure at the current book size
is **EUR 65**. The multiplier under-allocates fixed cost by roughly 65x today and
by roughly 12x at 50 clients. It only becomes approximately right somewhere above
600 clients, at which point nobody needs it.

Two consequences:

1. **Never quote a 1.5x-overhead figure as Radar's cost.** It is not conservative.
   It is 60x optimistic at the tier's most fragile moment, which is now.
2. **The multiplier is confined to `estimateAuditCost` and the Usage page, and it
   must stay there.** It never reaches a customer surface today
   (`multi-site-tenancy.md:1400` confirms this) and it must not start.

The right allocation for Radar specifically excludes Ayrshare (stepped on
social-active clients, which are Growth and up) and excludes SerpApi (Radar draws
zero credits). That leaves **Netlify EUR 50 plus Claude Max EUR 137.50 =
EUR 187.50 a month**, which is what section 5 uses.

---

## 5. Break-even customer count

**Attributable fixed cost: EUR 187.50 a month** (`PRICING-STRATEGY-2026-07.md:90`,
Netlify plus Claude Max, Ayrshare and SerpApi excluded per 4e).

**ASSUMPTION, and it is the assumption that decides the answer:** support at 15
minutes per customer per month at EUR 40 an hour fully loaded = **EUR 10 per
customer per month**. No file in this repo records a support minutes figure and
no customer conversation is cited for one. This number is invented and labelled.

| Support assumption | Contribution per customer, expected | Contribution, worst case | **Break-even, expected** | **Break-even, worst** |
|---|---|---|---|---|
| None (API and Stripe only) | EUR 26.33 | EUR 22.91 | **8** | **9** |
| 15 min at EUR 40/h (EUR 10) | EUR 16.33 | EUR 12.91 | **12** | **15** |
| 30 min at EUR 40/h (EUR 20) | EUR 6.33 | EUR 2.91 | **30** | **65** |

**Read the last row.** At thirty minutes of support per customer per month, the
worst case break-even is **65 customers**, which is two thirds of the entire
100 customer target the sprint exists to hit. Radar would spend the whole sprint
paying for itself.

At the 100 subscriber target, EUR 29, worst case on everything:

```
  Revenue                      100 x 29.00   =  EUR 2,900.00
  Collection API               100 x  4.855  =  EUR   485.50
  Stripe                       100 x  1.236  =  EUR   123.60
  Support at 15 min each       100 x 10.00   =  EUR 1,000.00   (ASSUMPTION)
  Attributable fixed base                    =  EUR   187.50
  ------------------------------------------------------------
  Net                                        =  EUR 1,103.40 / month
```

At thirty minutes of support each, the same line is **EUR 103.40 a month** and
50 hours of somebody's time.

**Support minutes, not tokens, decide whether Radar is worth operating.** API
cost is 16.7 percent of price in the worst case and support at half an hour is 69
percent of it. Every design decision that generates a support contact on this
tier is more expensive than every engine decision. Which is why section 2d, a
message that literally says "contact support", is a margin finding and not a copy
nit.

---

## 6. Verdict

**Radar is comfortably profitable in the worst case. Ship it at 7 prompts, weekly,
Gemini and Claude, EUR 29 launch and EUR 39 list, exactly as ruled.**

The headroom, plainly: a customer who forces every refresh the product will let
them force, on every prompt, all month, costs **EUR 4.855** and still leaves
**79.0 percent gross margin at EUR 29** after payment fees. The tier does not need
fewer prompts, a longer cooldown, a different engine pair, or a higher price.
Decision 1's engine amendment is what bought this: at the originally briefed
ChatGPT and Gemini the same worst case would have been roughly EUR 4.35 of a
EUR 4.35 cap with the cap binding on nearly every customer, and the product would
have spent most of the month showing budget errors.

**Nothing about the tier needs to change. Three things about the code do, and one
of them is a single missing object key.**

### The smallest change that fixes the real risk

**Not a pricing change. `_auth.js:230`.**

```js
const clientBudget = PLAN_MONTHLY_API_BUDGET_EUR[plan]              // today
const clientBudget = PLAN_MONTHLY_API_BUDGET_EUR[plan] ?? PLAN_MONTHLY_API_BUDGET_EUR.free   // fix
```

An unmapped plan currently gets `undefined` and therefore **no cap at all**
(section 2c). With a `?? free` default it gets EUR 0.30, the smallest budget in
the ladder, which fails closed and is loudly visible in a day rather than
silently expensive for a month. Cost of the fix: one expression. Cost of not
making it, if S2 lands `PLAN_LIVE_ENGINES.radar` without
`PLAN_MONTHLY_API_BUDGET_EUR.radar`: an uncapped tier whose only remaining limit
is 150 rows an hour, which is roughly EUR 7,900 per customer per month.

**Strongest counter-argument to that fix:** failing closed to EUR 0.30 means a
misconfigured paid plan collects three prompts and then blocks, which looks like
a total product failure rather than a config error, and on a paid tier that is
a refund conversation. It is still the right call, because a loud failure on one
customer is recoverable and a silent one across a launch cohort is not. If the
counter-argument wins, the alternative is an assertion in
`scripts/check-ladder-drift.sh` that every key in `PLAN_LIVE_ENGINES` has a
matching key in `PLAN_MONTHLY_API_BUDGET_EUR`, `PLAN_COLLECTION_COOLDOWN_HOURS`
and `plan_prompt_caps`. Both is better than either.

### The other two, ranked

**Second: the per prompt refresh path has no cooldown** (section 1b). It is why
the worst case is 9 runs rather than 5, why the Gemini free tier ceiling is 24
clients rather than 214, and why the budget cap is doing all the work alone. The
fix is one call to `checkCollectionCooldown` in each of the three HTTP collectors,
matching `enqueue-collection.js:44-52`. **Counter-argument, and it is a real one:**
the per prompt refresh is deliberately the fast immediate path
(`collectionContext.tsx:11-13`) and adding a 168h cooldown to it makes the button
dead for six days out of seven, which is a worse product than the one we have. The
honest answer is probably a shorter, separate per prompt cooldown rather than the
plan cadence, and that is a design decision, not mine to rule alone. **What is
not optional is that the number be chosen rather than absent.**

**Third: `refresh_cadence` must be set to `weekly` at Radar provisioning**
(section 1d). Every one of the 36 clients in production is on `manual` and
therefore nothing automatic has ever fired for anyone. If Radar ships the same
way, the tier is sold on a weekly refresh it does not perform. This is not in the
ruling's handoff packet and it must be.

### What this document corrects in the signed ruling

The ruling was signed today and correcting it now is cheap. Three items, none of
which reverse a decision:

1. **Decision 1's Gemini free tier ceiling of 214 clients is 9x optimistic.** It
   assumes one run per client per day. At the cap a client can run nine times a
   month and cluster them. The real figure is **24 maximum-usage clients on a
   single day** (section 4a).
2. **Decision 1 reads "per client hourly ceiling 150, never binding" as
   headroom.** It is the absence of a second control. Combined with the missing
   cooldown on the HTTP collectors it means the entire cost story rests on one
   comparison at `_auth.js:232` (section 1a, 1b).
3. **Decision 1 says the budget cap means "in principle spend cannot exceed it".**
   It exceeds it by one full run on every plan, because the check runs at enqueue
   and never again (section 2b). For Radar that is EUR 0.50. For Managed it is
   much larger and should be checked before that tier's numbers are trusted.

**Everything else in decision 1 recomputes correctly against the enforcing code
and against metered production rows.** EUR 0.065 per check, EUR 1.972 a month,
93.2 percent expected gross margin, zero SerpApi credits, EUR 227.55 a month saved
at 100 subscribers by the engine amendment, and 7 prompts sitting well inside a
budget that would fund 15. All confirmed.

---

## 7. Conflicts found, named and adjudicated

Per the standing rule: where two files disagree, the one matching shipped
behaviour wins and the loser is flagged stale.

| # | Conflict | Winner | Verdict |
|---|---|---|---|
| C1 | **Radar does not exist in any file.** No `radar` in `Plan` (`planConfig.ts:31`), `PLAN_ORDER` (`:332`), `PLAN_PROMPTS` (`:450`), `PLAN_MONTHLY_API_BUDGET_EUR` (`:322`, `_cost.js:508`), `PLAN_LIVE_ENGINES` (`_cost.js:377`) or `PLAN_COLLECTION_COOLDOWN_HOURS` (`:529`). | n/a | **Every Radar figure in this document is a projection against a tier that is not in code.** S2 has not run. Not a defect, stated so nobody reads section 3 as a measurement. |
| C2 | `planConfig.ts:282` prices chatgpt at **EUR 0.108**. `_cost.js:235` prices it at **EUR 0.014**. The two files carry a "keep in sync" instruction in both directions. | `_cost.js` | **7.7x disagreement between the two copies of the same table.** Does not touch Radar, which has no ChatGPT. It does touch decision 1b's arithmetic and any future re-cut. `_cost.js:219-234` explains the 0.014 deliberately, so `planConfig.ts` is the stale side. |
| C3 | `planConfig.ts:450` `PLAN_PROMPTS` is still `5, 15, 35, 35, 120, 120`. The signed ladder is `5, 7, 18, 35, 56, 200, 200`. | Ruling, once S2 ships | Expected. Recorded so a reader does not mistake the live file for the decision. |
| C4 | `planConfig.ts:403-449`, the comment block directly above `PLAN_PROMPTS`, still tabulates essentials 20 / growth 50 / growth_pro 75 / managed 250 while the constant three lines below says 15 / 35 / 35 / 120. | Constant | The ruling already ordered this block replaced. **Confirmed still present and still self-contradicting within one screen.** |
| C5 | `_cost.js:465-481` still documents the 9%-of-price derivation and `managed: 81.00 (9% of EUR 900)`, while the live constant at `:513` is 225.00 at a EUR 1,500 price. | Constant | Stale comment, three repricings out of date. |
| C6 | `seo-crawl.js:16` gives essentials **1** SEO page. `planConfig.ts:472` gives essentials **0**. | `planConfig.ts` per the 2026-07-29 move of AI SEO to Growth | **Sixth ladder copy, drifted, and it is the copy that enforces.** Plus the `?? 1` default at `:43` gives an unmapped `radar` plan a crawl it was ruled to zero. See 4b. |
| C7 | `seo-draft.js:28` gives essentials **2** drafts a month. `planConfig.ts:484` gives essentials **0**. | `planConfig.ts` | Seventh ladder copy, drifted the same way. Its `?? 0` default is safe, so this is drift without exposure. |
| C8 | `ENGINE_UNLOCK_PLAN` (`planConfig.ts:178-189`) says gemini unlocks at **essentials** and chatgpt unlocks at **free**. `PLAN_ENGINES.free` (`:60`) is `['gemini']`. | `PLAN_ENGINES` | **Live defect today, shipped with decision 1b, wrong in both directions.** The locked-engine label tells a Free user that Gemini needs Essentials when they already have it, and that ChatGPT comes with Free when it no longer does. The ruling predicted one half of this ("Consequence of 1b that S2 owns"); the reality is worse, because `ENGINE_UNLOCK_PLAN` was not updated at all. |

---

## 8. Handoff packet

**FROM** `bg-strategy` **TO** `bg-backend` on Opus (folds into S2), then
`bg-verify`. `bg-copy` owns one item, called out below.

**Objective.** Close the three cost-control gaps this analysis found, inside the
S2 build, before any Radar subscription is sold.

**Blocked by.** Nothing. Every item below is additive to packet S2 and none of
them changes a price, an allowance, or what any existing customer receives.

**scope_write.** `brandgeo-dashboard/netlify/functions/_auth.js`,
`_cost.js`, `collect-prompt.js`, `collect-claude.js`, `collect-chatgpt.js`,
`seo-crawl.js`, `scripts/check-ladder-drift.sh`,
`brandgeo-dashboard/src/lib/planConfig.ts`.

**scope_read.** This file, `docs/strategy/sprint-ladder-ruling.md`,
`docs/PRICING-STRATEGY-2026-07.md` §5.

**Do.**
1. **Default the budget lookup.** `_auth.js:230` must not return `undefined` for
   an unmapped plan. Fail closed to `PLAN_MONTHLY_API_BUDGET_EUR.free`. This is
   the highest value line in the whole packet.
2. **Assert the ladder keys match.** In `scripts/check-ladder-drift.sh`, fail if
   any key in `PLAN_LIVE_ENGINES` is missing from
   `PLAN_MONTHLY_API_BUDGET_EUR`, `PLAN_COLLECTION_COOLDOWN_HOURS` or
   `plan_prompt_caps`. The ruling already requires a `MONTHLY_CAPPED_ENGINES`
   assertion; this is the same defect class one map over.
3. **Give the three HTTP collectors a cadence limit.** Either
   `checkCollectionCooldown` as `enqueue-collection.js:44-52` does it, or a
   separate shorter per prompt cooldown chosen deliberately. Do not ship a third
   option where there is none.
4. **Add `radar: 0` to `CRAWL_PAGE_CAP` in `seo-crawl.js:16`** and change its
   `?? 1` default at `:43` to `?? 0`. While in that file, reconcile
   `essentials: 1` against `planConfig.ts:472`'s `0` (conflict C6).
5. **Set `refresh_cadence = 'weekly'` at Radar provisioning** in
   `onboard-client.js` and in whatever path a Stripe checkout uses. Without it the
   weekly refresh the tier is sold on never fires.
6. **Fix `ENGINE_UNLOCK_PLAN`** (`planConfig.ts:178-189`) for the 1b engine move:
   gemini is `free`, chatgpt is `essentials`, and add `radar` where the map needs
   it. Conflict C8, and it is wrong on the live product right now.

**Do not.**
- Do not change Radar's price, prompt count, cadence, engine set or budget. All
  four are signed and all four survive the worst case.
- Do not raise `PLAN_MONTHLY_API_BUDGET_EUR.radar` above 4.35 to absorb the one
  run overshoot. The overshoot is EUR 0.50 and immaterial; raising the cap to
  hide it gives away margin on every customer to solve a problem on none.
- Do not add a per job budget check inside `collection-worker-background.js`
  without measuring it first. It would close the overshoot at the cost of a
  Supabase aggregate per row.
- Do not run git.

**For `bg-copy`, one item.** Rewrite the budget block message at `_auth.js:237`.
It currently says "Contact support to raise this limit" and names an internal
EUR figure. It should name the date the allowance resets and offer the upgrade.
The correct shape already exists at `_enqueue.js:268`. Section 2d has the
reasoning; this is a margin item, not a polish item.

**Acceptance criteria.**
1. A `radar` client with no `PLAN_MONTHLY_API_BUDGET_EUR.radar` entry is blocked,
   not admitted. Prove it by deleting the key in a test and asserting a 429.
2. `scripts/check-ladder-drift.sh` exits non-zero when any one of the ladder maps
   is missing a plan the others carry.
3. A viewer token cannot re-collect the same prompt twice inside the chosen per
   prompt window on any of the three HTTP collectors.
4. A direct POST to `seo-crawl` as a `radar` client returns the "not included on
   this plan" refusal, not a crawl.
5. A newly provisioned Radar client has `refresh_cadence = 'weekly'`.
6. `getEngineStates` on a Free client shows gemini active and chatgpt locked with
   an unlock label pointing at Essentials, not at Radar.

**Then.** `bg-verify` on the whole diff. This touches the budget gate, which is
billing under AGENT-OS §2. Mandatory review, no exceptions.
