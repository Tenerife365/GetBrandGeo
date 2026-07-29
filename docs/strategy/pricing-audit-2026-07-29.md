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

**Figures below restated 2026-07-29** after the cost model was rebuilt (§8). The
per-prompt 5-engine cost is **€0.137**, not the €0.125 the old constants implied.
Every conclusion in this section survives the correction; the margins are
slightly tighter.

| Plan | Full run | Monthly budget | Full runs affordable | Cadence advertised | Outcome |
|---|---|---|---|---|---|
| Essentials €99 | €2.42 | €11.88 | 4.9 | 72h (=10/mo) | blocked after 4.9 |
| Growth €299 | €10.28 | €35.88 | **3.5** | 48h (=15/mo) | blocked after 3.5 |
| Growth PRO €449 | €13.70 | €53.88 | 3.9 | 36h (=20/mo) | blocked after 3.9 |
| Managed €1,500 | €137.00 | €180.00 | **1.3** | on demand | blocked after 1.3 |

Counting only genuinely marginal spend (excluding the two fixed-fee engines, §8),
a Growth prompt costs €0.090 rather than €0.137, which would buy 5.3 full runs.
That gap is itself an argument for separating fixed from variable cost in the
budget gate rather than blocking collection over a subscription already paid for.

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


---

## 8. The cost model was rebuilt (2026-07-29)

Everything in section 3 rests on per-engine costs, so the constants were checked
before any pricing decision was taken. They did not survive the check.

### 8.1 Nothing was ever metered

`cost_eur` looked like measured spend and was not. `costForRow()` returned a flat
per-engine constant and wrote it to the column, so every row for a given engine
carried an identical value. Confirmed in production:

```
llm          rows  distinct cost_eur
claude        235                  1
chatgpt       226                  1
gemini        202                  1
perplexity    199                  1
google_ai     141                  1
meta           62                  1
```

Meanwhile the comment in `Usage.tsx` asserted the column "now meters this per row
for real". It stored the estimate in the database; it measured nothing.

The data needed for real metering was being **discarded at the point of
collection**. Every `callX()` in `_collect.js` returned `{text, errorCode, detail}`
and dropped the usage block that OpenAI, Anthropic, Gemini and OpenRouter all
return for free on every response.

### 8.2 The total was accidentally right; the attribution was not

Modelled against list prices verified 2026-07-29:

| engine | was | modelled | error |
|---|---|---|---|
| chatgpt | EUR 0.060 | EUR 0.056 | ok |
| claude | EUR 0.010 | EUR 0.033 | **3.3x under** |
| gemini | EUR 0.034 | EUR 0.032 | ok at list price |
| perplexity | EUR 0.006 | EUR 0.001 | **5x over** |
| google_ai | EUR 0.015 | fixed fee | not a marginal cost |

A 5-engine run modelled at EUR 0.135 against the EUR 0.125 the constants implied,
8% out in total, because the two large errors pointed in opposite directions and
cancelled. Per-engine attribution is what `Usage.tsx` displays and what any
"which engine do we cut" decision rests on, so being right in aggregate and wrong
per engine is the worse failure. **Claude looked like the cheapest engine when it
is the second most expensive.**

### 8.3 Why Claude was 3.3x under, a known and flagged TODO

EUR 0.010 is exactly the *no-web-search* cost: ~500 input + ~600 output on
`claude-sonnet-4-6` is $0.0105, which is EUR 0.010 to three decimals.

Task #63 removed web search from Claude and the constant was set for that shape.
Then `8b7496c` was reverted and web search restored, because removing it had
silently made the engine answer from training data only and stop seeing
web-present businesses. The restore note in `_collect.js` is explicit about the
consequence and ends with **"reconcile the cost math"**. That reconciliation had
never happened. Web search adds a $10/1,000 tool fee *and* bills the retrieved
results as input tokens.

The header comment on that same function still read "NO web search", contradicting
the restore note twenty lines below it. Corrected.

### 8.4 Two of the five are not per-call costs at all

- **gemini** grounding is $35/1,000 prompts, but the first **1,500 requests per
  day** are free and retrieved context is not billed as tokens. BrandGEO has made
  ~200 grounded calls in total, so the true marginal cost is **EUR 0**.
- **google_ai** via SerpApi is a fixed monthly subscription and unused searches
  expire at renewal. Marginal cost inside the plan is **EUR 0**; the real cost is
  `plan_fee / searches_actually_used`, which at ~141 searches is far above any
  per-search rate.

Modelling these as marginal is a category error: the budget gate blocks
collection over spend that is incurred whether or not you collect.

### 8.5 What changed

- Every collect function now captures the token usage its provider already
  returned. ChatGPT and OpenRouter read it from the JSON response; Claude
  accumulates it across `message_start`, `message_delta` and `server_tool_use`
  SSE events, including on a time-budget cancel (those tokens were still
  generated and still billed).
- `estimateCostEur(llm, usage)` prices a call from real tokens plus per-call tool
  fees. `costForRow()` takes an optional third argument and meters when usage is
  present, falling back to the constant when it is not, so every existing
  two-argument call site keeps working.
- The constants were corrected and relabelled as fallbacks, with
  `FIXED_FEE_ENGINES` marking the two that are not marginal.
- `Usage.tsx`'s claim that metering was already real was corrected in place.

Verified: `npx tsc --noEmit` clean, `npm run build` green, and a harness
confirming metered matches modelled per engine, free error codes still cost zero,
and legacy two-argument calls unchanged.

### 8.6 Still open

- **gpt-5.5 is legacy.** OpenAI doubled the GPT-5 line on 2026-04-23 ($2.50 to
  $5.00 in, $15 to $30 out) and superseded it with GPT-5.6 in 2026-07. If the
  model id in `_collect.js` is bumped, `MODEL_PRICE_USD` must move in the same
  commit.
- **The budget gate still charges fixed-fee engines per call.** Separating fixed
  from variable would raise Growth from 3.5 to 5.3 affordable full runs per month
  without spending a cent more.
- **Prices are list, not invoice.** Confirm against actual OpenAI, Anthropic,
  OpenRouter and SerpApi statements. The SerpApi tier in particular determines
  whether EUR 0.015 per search is optimistic (Starter is $0.025) or pessimistic.
- **`USD_TO_EUR` is hardcoded at 0.92.** Fine at this spend; revisit if it grows.
