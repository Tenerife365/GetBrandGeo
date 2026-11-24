# Cost reduction review: Growth and Growth PRO, 2026-11-24

Measure and propose only. No code, config, model id, plan constant or
database row was changed to write this. All figures come from read-only
SQL on production `ai_results`, `prompts` and `clients` (project
`duiyifepitvugyulobqm`), run 2026-11-24, unless marked "modelled". Research
clients (`category = 'research'`) are left out of every average. Clients are
named by id only.

Code read: `src/lib/planConfig.ts`, `netlify/functions/_cost.js`,
`_collect.js`, `_enqueue.js`, `collect-prompt.js`.

## 1. Summary

- A Growth PRO client using all 56 prompts costs **EUR 60.56 a month**
  metered against a EUR 67.35 budget (90 percent). Real clients match:
  client 1 metered EUR 58.55 in October, client 54 EUR 51.11 from 1 to 24
  November.
- Two engines carry the bill: ChatGPT on gpt-5.5 (EUR 19.22) and Grok
  (EUR 18.32). Together they are 62 percent of the metered cost and 82
  percent of the marginal cash (EUR 37.54 of EUR 45.81).
- **No client is on Growth today** (0 of 36 non-research clients). Growth
  figures below are modelled from the per-row costs measured on Growth PRO.
- Error rows, prompt caching across clients and the Gemini line give
  little or no cash back (section 4).
- **The SerpApi pool is 1,000 credits for USD 25 a month** (Constantin,
  2026-11-24), not the 500 that `_cost.js` assumes. By 24 November the
  platform has used 420 of them (section 2.6), so the pool is not the
  near limit it first looked like.
- Rulings of 2026-11-24 and the re-costing proposal for `_cost.js` are in
  section 8.
- Recommended, in order:
  1. Grok monthly instead of weekly: EUR 13.74 a month per Growth PRO
     client.
  2. A paired test of gpt-4o-mini against gpt-5.5, then switch only if it
     passes: up to EUR 18.61 (Growth PRO) and EUR 11.63 (Growth). If it
     fails, ChatGPT every two weeks: EUR 9.61 and EUR 6.01.
  3. Claude every two weeks: EUR 3.54 and EUR 2.21.

  All three together take Growth PRO from EUR 60.56 to EUR 24.67 metered,
  or EUR 33.67 if the test fails.

## 2. Measured spend

### 2.1 Client census (non-research)

| Plan | Clients | Active prompts | Cadence |
|---|---|---|---|
| free | 24 active, 2 manual | 113, 2 | monthly, manual |
| radar | 2 | 3 | weekly |
| essentials | 5 | 24 | weekly |
| growth | **0** | 0 | |
| growth_pro | 3 (ids 1, 2, 54) | 126 | weekly |

### 2.2 Cost per ok answer, Growth PRO, last 90 days, by model

Only rows stamped with a model are used (the `ai_results.model` column went
live 2026-10-30). Rows from before that date carry a null model. They show
the same per-row figures, except for ChatGPT, which was on another model
before 2026-07-29.

| Engine | Model | Rows | EUR | EUR per ok row |
|---|---|---|---|---|
| chatgpt | gpt-5.5 | 331 | 28.39 | 0.0858 |
| claude | claude-sonnet-4-6 | 428 | 13.53 | 0.0316 |
| gemini | gemini-2.5-flash | 427 | 13.66 | 0.0320 |
| grok | x-ai/grok-4.5 | 428 (327 ok) | 27.17 | 0.0818 |
| perplexity | perplexity/sonar | 428 (350 ok) | 1.84 | 0.0053 |
| google_ai | serpapi | 132 (131 ok) | 6.07 | 0.0460 |
| ai_overview | serpapi | 134 | 11.96 | 0.0893 |

Other plans, for comparison: gpt-4o-mini rows cost EUR 0.0027 on Free and
EUR 0.0012 on Radar. Essentials pays the same per-row figures as Growth PRO
for the engines they share.

Two metering notes:
- ai_overview averages 1.94 SerpApi credits a row (0.0893 / 0.046). The
  cost table in `_cost.js` assumes 1.5.
- The gpt-4o-mini row cost is low because gpt-4o-mini rarely searches.
  `_collect.js` counts each `web_search_call` item in the answer, and
  `_cost.js` adds the USD 0.01 fee once per counted search, so a row with
  no search pays no fee. Measured over 90 days on non-research ok rows:
  gpt-4o-mini searched on 5 of 24 rows (21 percent), average EUR 0.0021 a
  row; gpt-5.5 searched on all 367, average EUR 0.0874. Constantin's view
  (2026-11-24) that no fee applies to gpt-4o-mini therefore holds for most
  rows. The quality question it raises is that gpt-4o-mini mostly answers
  from training data, while gpt-5.5 always reads the web. The paired test
  in R2 records searches per row, so it measures this directly.

### 2.3 Cost per client per month (metered EUR)

| Client | Plan | Month | Total | Token engines | Gemini | SerpApi |
|---|---|---|---|---|---|---|
| 1 | growth_pro | 2026-08 | 37.13 | 28.44 | 4.42 | 4.28 |
| 1 | growth_pro | 2026-09 | 32.44 | 19.38 | 6.53 | 6.53 |
| 1 | growth_pro | 2026-10 | 58.55 | 42.48 | 8.96 | 7.11 |
| 1 | growth_pro | 2026-11 (to 24th) | 41.01 | 28.45 | 5.38 | 7.18 |
| 54 | growth_pro | 2026-11 (to 24th) | 51.11 | 36.67 | 7.04 | 7.41 |
| 2 | growth_pro | 2026-11 (to 24th) | 10.54 | 5.81 | 1.28 | 3.45 |
| 81 | essentials | 2026-11 (to 24th) | 7.91 | 6.30 | | |
| 57 | essentials | 2026-10 | 2.06 | | | |
| 55, 56 | radar | monthly | 0.27, 0.50 | | | |

Client 2 has 25 prompts. Clients 1 and 54 have 56 and 55, which is the full
Growth PRO cap.

### 2.4 Re-ask frequency

Ok rows per (prompt, engine) between 2026-10-25 and 2026-11-23:

| Client | chatgpt | claude | gemini | grok | perplexity | google_ai | ai_overview |
|---|---|---|---|---|---|---|---|
| 1 | 3.00 | 4.00 | 4.00 | 2.82 | 3.16 | 1 | 1 |
| 54 | 3.53 | 4 | 4 | 3.65 | 3.71 | 1 | 1 |
| 2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |

Weekly means 4 asks a month for the token engines and 1 for the SerpApi
engines, which run monthly through `MONTHLY_CAPPED_ENGINES`. Where the count
is below 4, the missing asks are error rows, not skipped asks. No engine is
asked more often than the cadence allows.

### 2.5 Errors and empty rows, non-research, last 90 days

| Engine | Error code | Rows | EUR |
|---|---|---|---|
| perplexity | quota_exceeded | 513 | 0.00 |
| grok | quota_exceeded | 505 | 0.00 |
| chatgpt | quota_exceeded | 309 | 0.00 |
| grok | timeout | 27 | 0.54 |
| ai_overview | timeout | 9 | 0.62 |
| claude | api_error | 3 | 0.10 |
| google_ai | empty_response | 1 | 0.05 |

Error spend is EUR 1.31 in 90 days across the whole platform, or EUR 0.44 a
month. The large quota_exceeded counts are provider outages: they cost
nothing but lose the answer.

### 2.6 SerpApi credits, all clients, by month

Credits are cost_eur / 0.046:

| Month | google_ai | ai_overview | Total of 1,000 |
|---|---|---|---|
| 2026-08 | 50 | 84 | 134 |
| 2026-09 | 73 | 120 | 193 |
| 2026-10 | 118 | 207 | 325 |
| 2026-11 (to 24th) | 149 | 271 | 420 |

At the November pace the month ends near 525 credits (420 / 24 x 30), 52.5
percent of the 1,000 credit pool Constantin confirmed on 2026-11-24. Each
new Growth PRO client at full use adds about 165 credits a month: 56 for
google_ai plus 56 x 1.94 = 109 for ai_overview. Each Growth client adds 35.
The headroom of about 475 credits fits two more Growth PRO clients; a third
would pass 1,000.

### 2.7 How often answers change between consecutive runs

Paired consecutive ok rows of the same client, prompt and engine, since
2026-09-01, on Growth PRO, Essentials and Radar:

| Engine | Pairs | Mention unchanged | Position unchanged | Competitor list identical |
|---|---|---|---|---|
| claude | 860 | 92.4% | 85.5% | 21.9% |
| perplexity | 356 | 82.3% | 86.8% | 18.0% |
| gemini | 873 | 81.9% | 88.2% | 23.4% |
| grok | 316 | 80.7% | 76.6% | 20.3% |
| chatgpt | 585 | 77.6% | 68.4% | 15.2% |
| google_ai | 184 | 69.0% | 91.8% | 38.6% |
| ai_overview | 171 | 62.6% | 97.1% | 45.6% |

Claude is the most stable engine on brand mention. ChatGPT is the least
stable of the weekly engines, so a weekly ChatGPT point carries the most new
information per euro lost if it is dropped.

### 2.8 Other measurements

- **Cross-client duplicates.** There are 268 active non-research prompts and
  268 distinct texts. No text is shared across clients.
- **Paired model data.** Since 2026-09-01, 0 prompts were asked on both
  gpt-4o-mini and gpt-5.5. The only evidence on the model difference is the
  single flip documented in `_collect.js` above `CHATGPT_MODEL_BY_PLAN`.
- **Gemini volume.** At most 81 calls in a day in the last 90 days, about
  30 a day on average, against 1,500 free a day.

## 3. Unit cost per plan at full use (modelled from 2.2)

Weekly means 4 runs in 30 days, as measured in 2.4.

**Growth PRO**: 56 prompts, so 224 rows per weekly engine and 56 per
SerpApi engine.

| Engine | Arithmetic | EUR |
|---|---|---|
| chatgpt | 224 x 0.0858 | 19.22 |
| grok | 224 x 0.0818 | 18.32 |
| claude | 224 x 0.0316 | 7.08 |
| gemini | 224 x 0.0320 | 7.17 |
| perplexity | 224 x 0.0053 | 1.19 |
| google_ai | 56 x 0.046 | 2.58 |
| ai_overview | 56 x 0.0893 | 5.00 |
| **Total metered** | | **60.56** (budget 67.35) |
| Marginal cash (chatgpt, grok, claude, perplexity) | | 45.81 |

**Growth**: 35 prompts on chatgpt, gemini, claude, perplexity and google_ai.

| Engine | Arithmetic | EUR |
|---|---|---|
| chatgpt | 140 x 0.0858 | 12.01 |
| claude | 140 x 0.0316 | 4.42 |
| gemini | 140 x 0.0320 | 4.48 |
| perplexity | 140 x 0.0053 | 0.74 |
| google_ai | 35 x 0.046 | 1.61 |
| **Total metered** | | **23.26** (budget 44.85) |
| Marginal cash (chatgpt, claude, perplexity) | | 17.17 |

Gemini and SerpApi count in the metered total and in the budget gate. Their
marginal cash cost is about zero today: Gemini runs inside its free daily
quota, and SerpApi is a fixed USD 25 (about EUR 23) a month for 1,000
credits while the pool lasts. That is EUR 0.023 a credit, half the 0.046
`_cost.js` meters, so the cash value of the SerpApi lines is half the
metered value: Growth PRO google_ai EUR 1.29 (metered 2.58), ai_overview
EUR 2.50 (metered 5.00); Growth google_ai EUR 0.81 (metered 1.61).

## 4. Levers

All amounts are EUR per client per month at full use.

| # | Lever | Growth | Growth PRO | Arithmetic | What the customer loses |
|---|---|---|---|---|---|
| L1 | ChatGPT gpt-5.5 to gpt-4o-mini | 11.63 (10.35 if the search fee applies) | 18.61 (16.55) | 140 or 224 x (0.0858 minus 0.0027, or minus 0.0119) | The ChatGPT answer comes from a weaker model than the one a person asking ChatGPT gets. One documented mention flip, and no paired data |
| L2 | ChatGPT every two weeks, gpt-5.5 kept | 6.01 | 9.61 | 70 or 112 x 0.0858 | Half the ChatGPT points, on the engine that changes most (22.4% of consecutive mention results differ) |
| L3 | Grok monthly, like SerpApi | 0 | 13.74 | 168 x 0.0818 | Weekly Grok trend; one Grok point a month. Grok changed in 19.3% of consecutive mention results |
| L3b | Grok every two weeks | 0 | 9.16 | 112 x 0.0818 | Half the Grok points |
| L4 | Claude every two weeks, model unchanged | 2.21 | 3.54 | 70 or 112 x 0.0316 | Half the Claude points, on the most stable engine (92.4% unchanged) |
| L5 | All weekly engines every two weeks | 8.59 cash, plus 2.24 Gemini metered | 22.91 cash, plus 3.58 Gemini metered | half of 17.17 and of 45.81 | Breaks the published weekly refresh on both plans; a pricing page change |
| L6 | Perplexity every two weeks | 0.37 | 0.60 | 70 or 112 x 0.0053 | Half the Perplexity points for almost no money. Not worth it |
| L7 | Claude web search off | at least 1.29 | at least 2.06 | 140 or 224 x 0.0092 search fee | Claude answers from training data only, which changes what is measured. Rejected |
| L8 | Grok on a cheaper model | not costed | not costed | no measured price for an alternative | Unknown until measured |
| L9 | Gemini metered at its real cash cost | 0 cash | 0 cash | 4.48 and 7.17 of metered budget freed | Nothing. This is a budget and reporting fix, not a saving, and it needs `_cost.js` (off limits) |
| L10 | Stop paying for error rows | about 0 | about 0 | EUR 0.44 a month platform-wide (2.5) | Nothing to gain |
| L11 | Cache identical prompts across clients | 0 | 0 | 0 shared texts (2.8) | Nothing to gain at today's roster |

### Ranking by savings against risk

| Rank | Lever | Growth PRO saving | Risk | Why |
|---|---|---|---|---|
| 1 | L3 Grok monthly | 13.74 | Low to medium | The second largest line. Monthly is already the cadence for two engines, so the product has precedent and UI for it. Grok is only on Growth PRO and up |
| 2 | L1 gated by a paired test, else L2 | 18.61, or 9.61 | High untested, low after the test | The largest line. It risks changing the headline number, so it ships only on measured evidence |
| 3 | L4 Claude every two weeks | 3.54 | Low | The most stable engine, so the information lost per euro saved is the smallest. Model unchanged, per the ruling |
| 4 | L3b Grok every two weeks | 9.16 | Low | Fallback if Constantin wants to keep more Grok signal than monthly |
| 5 | L5 all every two weeks | 22.91 | High | Breaks a published promise |
| 6 to 11 | L6, L7, L8, L9, L10, L11 | small, zero or unknown | | |

## 5. Recommendations

**Combined effect, Growth PRO at full use:**
- R1 + R2 (swap) + R3 saves 35.89. Metered cost falls from 60.56 to 24.67,
  and marginal cash from 45.81 to 9.92.
- With the R2 fallback (L2) instead, it saves 26.89, so 33.67 metered.

**Combined effect, Growth:**
- R2 (swap) + R3 saves 13.84. Metered cost falls from 23.26 to 9.42.
- With the R2 fallback, it saves 8.22, so 15.04 metered.

**Build constraints common to all three:**
- `MONTHLY_CAPPED_ENGINES` lives in `_cost.js`, which is off limits, and an
  assertion pins its contents. So the build adds a separate per-engine
  minimum interval rather than editing that constant.
- `_cost.js` keeps forecasting the weekly cadence. Its budget gate then
  over-forecasts, which is the safe direction, until Constantin rules on
  re-costing (Open decision 5).

### R1. Grok monthly on Growth PRO and up (L3), EUR 13.74 a month per client

**Files a later build touches:**
- New `netlify/functions/_cadence.js`. It holds one map of the minimum days
  between asks per engine, for example `{ grok: 30 }`. It is plain
  JavaScript, with no `.ts` require (see `tests/ts_require_bundler.test.js`).
- `netlify/functions/_enqueue.js`, step 5. Exclude a (prompt, engine) pair
  asked within its interval. Compute this BEFORE the replace-delete, the same
  way the `cappedSet` query is, and leave the engine out of the delete list.
  Otherwise a force refresh erases the row the interval relies on.
- `netlify/functions/collect-prompt.js`, where `FAST_ENGINES` includes grok.
  Apply the same check beside `isCapped`, before its force-delete.
- `src/pages/AIVisibility.tsx` and `src/lib/planConfig.ts`: the copy that
  explains cadence per engine. The SerpApi engines already show a monthly
  note, so follow it.
- Not the pricing copy. Ruled 2026-11-24: the plan page does not say which
  engines refresh less often.

**Test proving value held:**
- New `tests/engine_cadence.test.js`, modelled on
  `tests/enqueue_history.test.js`. It asserts four things:
  1. A grok pair asked 10 days ago is skipped on a scheduled run.
  2. A grok pair asked 31 days ago runs.
  3. A manual Force Refresh neither re-asks nor deletes a grok row inside
     the interval.
  4. Claude, ChatGPT, Gemini and Perplexity still run weekly.
- After one month live, re-run the query in 2.4. Grok should read 1.0 and
  the others 4.0, and the client's Grok mention rate should stay within the
  week-to-week band of 2.7.

### R2. Paired model test for ChatGPT, then gpt-4o-mini or two-weekly (L1, else L2)

Savings: EUR 18.61 (Growth PRO) and 11.63 (Growth) if the swap passes, else
EUR 9.61 and 6.01.

**The test runs first, as a one-off.** On their next weekly run, ask the
active prompts of clients 1, 2 and 54 (126 prompts) on gpt-4o-mini as well
as gpt-5.5, with the same prompt, geography and day.

- **Cost (corrected 2026-11-24):** about EUR 11 to 12 in all. The
  gpt-5.5 arm is 126 x 0.0858 = EUR 10.81; the gpt-4o-mini arm is about
  EUR 0.26 to 0.34. The EUR 0.34 first written here counted only the mini
  arm.
- **Where the rows go:** a separate store or a dry-run flag, so the
  customer's dashboard is unchanged.

The swap passes only if all three hold:
1. Brand mention agrees between the two models in at least 77.6 percent of
   pairs. That is gpt-5.5's own week-to-week agreement, so the swap must add
   no more disagreement than the engine already has with itself.
2. Pairs where only gpt-5.5 mentions the brand are no more than one more
   than pairs where only gpt-4o-mini does. This rules out a one-sided loss
   of mentions.
3. The position of the brand, where both mention it, matches in at least
   68.4 percent of pairs, the gpt-5.5 week-to-week figure.

If any of the three fails, keep gpt-5.5 and apply L2 (two-weekly) through
the same `_cadence.js` map as R1.

**Files a later build touches:**
- For the test: a one-off script under `scripts/`. It calls the same
  `callChatGPT` path with an explicit model and writes to a side table or a
  file, never to `ai_results` for these clients.
- For the swap: `netlify/functions/_collect.js`, `CHATGPT_MODEL_BY_PLAN`, the
  growth and growth_pro lines.
- For the fallback: `_cadence.js` `{ chatgpt: 14 }`, `_enqueue.js` and
  `collect-chatgpt.js`.

**Test proving value held after the change:**
- Extend `tests/engine_routing.test.js` with the model per plan.
- After a month, compare each client's ChatGPT mention rate with its
  previous four weeks. The change must stay inside the band of 2.7.

### R3. Claude every two weeks (L4), EUR 3.54 (Growth PRO) and 2.21 (Growth)

The model stays claude-sonnet-4-6, per the ruling.

**Files a later build touches:**
- `_cadence.js` `{ claude: 14 }`
- `_enqueue.js`
- `collect-claude.js`
- the same cadence copy as R1

**Test proving value held:**
- `tests/engine_cadence.test.js` gains the claude case (skipped at 7 days,
  run at 15).
- After a month, re-run 2.7 on claude. Mention unchanged between
  consecutive runs should stay near 92.4 percent. A drop well below it would
  mean two weeks hides changes that weekly caught, and the interval goes
  back to 7.

## 6. Open decisions for Constantin

Decisions 1, 2, 4, 5 and 6 were answered on 2026-11-24; see section 8.
Decision 3 is still open. The text below is the question as first asked.

1. **Grok cadence.** Monthly (EUR 13.74) or every two weeks (EUR 9.16) on
   Growth PRO, and whether the public plan copy says so per engine.
2. **The ChatGPT paired test.** Run it on clients 1, 2 and 54, and accept
   the pass rule in R2? If it fails, is two-weekly ChatGPT acceptable on
   paid plans that advertise weekly refresh?
3. **Claude every two weeks.** Same disclosure question as decision 1.
4. **gpt-4o-mini search fee.** Check one day of the OpenAI usage dashboard
   against the metered rows. If the USD 0.01 search fee is real, the swap
   saves EUR 16.55, not 18.61, and `_cost.js` under-meters Free and
   Essentials today.
5. **Re-costing in `_cost.js`.** That file is off limits. Should the plan
   forecast (and the Gemini line at EUR 0.032 a row that costs no cash) be
   re-costed once the cadence changes, or left over-forecasting on purpose?
6. **SerpApi pool.** The platform is at 420 of 500 credits by the 24th.
   ai_overview meters 1.94 credits a row, not 1.5. The next Growth PRO
   client adds about 165 credits a month. Options:
   - a larger SerpApi tier;
   - ai_overview every two months;
   - correct the 1.5 in `SERPAPI_CREDITS_PER_CHECK`, which also needs
     `_cost.js`.

   The 500 credit pool is still not enforced in code.
7. **Growth has no clients.** Every Growth figure here is modelled. Re-run
   sections 2.2 to 2.4 once the first Growth client has a month of data.

## 7. How to reproduce

All figures come from SELECT queries on `ai_results` joined to `clients`
with `category <> 'research'`, except 2.6, which counts all clients:

- **2.2:** group by `llm` and `model` over 90 days. Cost per ok row is
  `sum(cost_eur)` of ok rows divided by their count.
- **2.4:** count ok rows per (prompt_id, llm) between 2026-10-25 and
  2026-11-23.
- **2.6:** `sum(cost_eur) / 0.046` per month for `google_ai` and
  `ai_overview`. 0.046 is the metered rate per credit, which is why it
  recovers the credit count; the cash rate is 0.023 (section 8).
- **2.7:** use a `lag()` window over (client_id, prompt_id, llm) ordered by
  `checked_at`, on ok rows since 2026-09-01.
- **2.8:** `lower(trim(text))` over active prompts.

## 8. Rulings, re-costing proposal and test status (2026-11-24)

### 8.1 Rulings from Constantin

| Decision | Ruling |
|---|---|
| 1. Grok cadence | Monthly (R1 as written, EUR 13.74 per Growth PRO client). |
| 1 and 3. Disclosure | The plan page does not say which engines refresh less often. |
| 2. ChatGPT paired test | Run it (confirmed). Status in 8.4. |
| 3. Claude every two weeks | Not ruled. Still open. |
| 4. gpt-4o-mini search fee | His view: no fee applies. Measured: none on 19 of 24 rows, because the fee is charged only when the model searches (section 2.2). No `_cost.js` change is needed for it. |
| 5. Re-costing `_cost.js` | Asked for a proposal: 8.2. |
| 6. SerpApi pool | 1,000 credits for USD 25 a month, not 500. |

### 8.2 Proposal: re-costing `_cost.js`

Text only. `_cost.js` was not edited. Each item needs Constantin's go and a
`bg-backend` build on Opus, because the file meters every client's spend and
enforces every plan budget.

- **P1. SerpApi rate and pool.** `SERPAPI_COST_PER_SEARCH_EUR` 0.046 to
  0.023 (USD 25 / 1,000 x 0.92) and `SERPAPI_MONTHLY_CREDITS` 500 to 1000.
  Replace the two comments that disagree ($25 per 1,000 against $25 per
  500) and the comment that calls the pool 500 platform-wide. Effect:
  Growth PRO metered drops by EUR 3.79 a month (google_ai 2.58 to 1.29,
  ai_overview 5.00 to 2.50), Growth by EUR 0.80. Old rows keep the cost
  they were metered at.
- **P2. ai_overview credits.** `SERPAPI_CREDITS_PER_CHECK.ai_overview` 1.5
  to 1.94, measured over 134 rows. With P1 the forecast per row becomes EUR
  0.045 (1.94 x 0.023).
- **P3. Gemini stays at EUR 0.032 a row.** That is the price after the free
  tier. The budget gate is a ceiling, and the peak is 81 calls a day against
  a free quota of 1,500, so lowering it only lowers a safety margin.
  Constantin's call.
- **P4. ChatGPT search fee unchanged.** It is already charged per counted
  `web_search_call`, so gpt-4o-mini rows that do not search pay nothing.
  Change it only if one day of the OpenAI usage dashboard disagrees.
- **P5. Forecast reads the engine cadence.** Once R1 ships, the plan
  forecast should read the per-engine interval from the new `_cadence.js`
  (Grok one run a month), so the forecast and the metered spend agree.
- **Plan budgets stay as they are** (EUR 67.35 Growth PRO, 44.85 Growth).
  Only the headroom under them grows.

Metered EUR per client per month at full use, after each step:

| Step | Growth PRO | Growth |
|---|---|---|
| Today | 60.56 | 23.26 |
| P1 (SerpApi re-cost) | 56.77 | 22.46 |
| P1 and R1 (Grok monthly) | 43.03 | 22.46 |
| P1, R1 and R2 swap, if the test passes | 24.42 | 10.83 |
| P1, R1 and L2 (ChatGPT two-weekly), if it fails | 33.42 | 16.45 |
| R3 (Claude two-weekly), if ruled | a further 3.54 off | a further 2.21 off |

Grok is not on Growth, so R1 does not move the Growth column.

### 8.3 The SerpApi pool, re-read

The November pace ends near 525 of 1,000 credits. About 475 credits are
left, so two more Growth PRO clients fit and a third would pass the pool. The
pool is still not enforced in code; a count before each SerpApi call is
worth adding before the third Growth PRO client signs.

### 8.4 ChatGPT paired test: NOT RUN, blocked on the API key

The harness was built and started on 2026-11-24. All 252 calls (126 prompts
x 2 models) failed with `invalid_api_key`: the only OpenAI key on this
machine, in the dashboard's `.env.local`, is revoked. Nothing was spent and
nothing was written to `ai_results` or any other table.

The harness uses the production `callChatGPT`, `buildSystemContext` and
`buildResultRow` from `_collect.js` unchanged, with `OPENAI_COLLECT_MODEL`
cleared. Plan `essentials` gives gpt-4o-mini and `growth_pro` gives gpt-5.5.
It writes one JSON line per call to a local file, resumes where it stopped,
and runs four calls at a time. `score.js` pairs the two arms by prompt,
drops a mini row that fell back to gpt-5.5, scores the three rules of R2
overall and per client, and prints the searches per arm. The kit is outside
the repo, because the prompts are client data:
`C:\Users\const\AppData\Roaming\Claude\side-session-notes\local_3fa72013-04fd-4d86-a195-4bf5ec3261a8\chatgpt-paired-test\`
(`run.js`, `score.js`, `input.json` with the 126 active prompts of clients 1,
2 and 54 and their brand configs).

To run it, with the production OpenAI key, in PowerShell (about 10 to 20 minutes,
about EUR 11 to 12):

1. `cd "C:\Users\const\AppData\Roaming\Claude\side-session-notes\local_3fa72013-04fd-4d86-a195-4bf5ec3261a8\chatgpt-paired-test"`
2. `$k = Read-Host "OpenAI key" -AsSecureString; $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($k))`
3. `node run.js "C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard\netlify\functions\_collect.js" input.json out.jsonl`
4. `node score.js out.jsonl`

The key is read without echo and lives only in that PowerShell window. Paste
the output of step 4 into a session to record it here.

A cheaper variant, if wanted: run only the gpt-4o-mini arm (about EUR 0.30)
and pair it with the stored weekly gpt-5.5 row of the same day. It is weaker,
because the two answers are not taken at the same minute.
