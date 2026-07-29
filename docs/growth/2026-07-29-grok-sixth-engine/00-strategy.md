# 00. Strategy: the seventh engine package

**Seed:** Two engines went live on 2026-07-29, Growth PRO and up. Grok as the 6th
(`14b411d`) and Google AI Overviews as the 7th (`709b028`).
**Built:** 2026-07-29. **Rebuilt the same day**, see §0.
**Status:** DRAFT. Nothing sent. See the send gate at the bottom.

> **Folder name is stale.** This directory is still
> `2026-07-29-grok-sixth-engine`. The rename to `2026-07-29-seventh-engine-retrieval`
> failed because a process was holding the directory. Rename it when free. The
> contents are correct; the folder name is not.

---

## 0. This package was built wrong once. What happened, and why it matters

The first version of every asset in this folder said **six engines**. It was
written from a reading of `planConfig.ts` taken earlier the same day, before
commit `709b028` landed. Google AI Overviews shipped as a **seventh** engine
while the drafts were being written.

It was caught by the independent site audit
(`docs/qa/web-consistency-audit-2026-07-29.md`), which refused to accept the
ground truth it was handed and re-derived it from source. That is the only reason
a package asserting a false engine count did not go out under a brand that sells
measurement.

**The operational lesson, worth keeping:** on a day when the product is actively
shipping, a fact read at the start of a session is not safe to publish at the end
of it. Re-verify engine counts, prices and caps against `planConfig.ts` and
`_cost.js` immediately before any asset leaves this folder, not when drafting
begins.

---

## 1. The tension I chose, and the four I rejected

**Chosen: "Engine count is a vanity metric. Retrieval is the one that matters."**

The obvious piece is a changelog. We added two engines, here are seven logos.
That is a product note, and any competitor can publish the same sentence with
their own logo grid.

The defensible angle is the standard underneath the additions, because BrandGEO
has now made the same call four times and the record is in the codebase:

| Decision | Date | Reason, from the code |
|---|---|---|
| **Meta AI retired** | 2026-07-16 | Training data only, no web search. Removed from every plan. |
| **DeepSeek kept out** | standing | "Every DeepSeek model on OpenRouter is retrieval-free, so it would answer from training data only, which is the exact low-signal shape that got Meta AI retired." (`planConfig.ts`) |
| **Grok added, web plugin on** | 2026-07-29 | "Grok DOES [need it], and without it Grok answers from training data only." (`_collect.js:200`) |
| **AI Overviews added, separately from AI Mode** | 2026-07-29 | Two different Google products. Measuring one would miss the surface most searchers actually see. (`planConfig.ts:59`) |

That is a consistent, documented standard about measurement quality, and it is
the one claim in this category a competitor cannot copy by find-and-replacing a
brand name. It also inverts the usual competitive axis: a rival advertising nine
engines is inviting the question of how many had retrieval switched on.

**The second beat, and it is better than it looks.** Google AI Mode and Google AI
Overviews are not the same surface. AI Mode is a tab a searcher opts into. AI
Overviews is the summary block shown by default at the top of an ordinary results
page. Different reach, different answers. Almost nobody in this category
distinguishes them, and a tool that measures only AI Mode is missing the surface
most people are actually seen on.

**Rejected:**

- *"Grok reads X."* True, and it is now a supporting beat rather than the spine.
  Any tool can make this claim the week they add Grok.
- *"Seven engines for EUR 449."* Pricing-led, and it lands better attached to the
  Profound comparison than to a launch.
- *"AI search is growing."* A topic, not a tension.
- *"Here is what the two new engines said about your brand."* Strongest available
  hook and **blocked**: zero rows exist for either. Held for the follow-up.

## 2. Hook drivers, per asset

| # | Asset | Funnel | Driver |
|---|---|---|---|
| 01 | Blog | MOFU | Contrarian |
| 02 | LinkedIn | MOFU | Contrarian, first-person open |
| 03 | X thread | TOFU | Status threat |
| 04a | X single | TOFU | Status threat |
| 04b | Threads | TOFU | Curiosity gap |
| 04c | Facebook | MOFU | Loss aversion |
| 05a | IG carousel | MOFU | Curiosity gap |
| 05b | IG Reel | TOFU | Status threat |
| 06 | TikTok | TOFU | Loss aversion |
| 07a | YouTube Shorts | TOFU | Curiosity gap |
| 07b | YouTube long-form | MOFU | Concrete proof |
| 08 | Google Business Profile | BOFU | Utility |

## 3. Facts this package is allowed to state

Re-verified against source after the rebuild. Nothing else may be asserted.

**Engine ladder, `planConfig.ts:53` to `:68`:**

- Free: ChatGPT. **1 engine.**
- Essentials: plus Gemini, Claude. **3 engines.**
- Growth: plus Perplexity, Google AI Mode. **5 engines.**
- Growth PRO and above: plus Grok and Google AI Overviews. **7 engines.**

**Also verified:**

- Grok runs `x-ai/grok-4.5` via OpenRouter with the web plugin on. `_collect.js:764`.
- Without that plugin Grok answers from training data only. `_collect.js:200`.
- Grok is xAI's model and has access to X. Publicly documented by xAI.
- AI Overviews is read from the live SERP via SerpApi, not from a model. `_collect.js:557`.
- **"No AI Overview block was rendered for this query" is recorded as a
  legitimate measurement, not an error.** `_collect.js:564` and `:588`. Whether
  Google shows an AI summary for a query at all is itself a finding.
- AI Mode is a tab the searcher opts into; AI Overviews is the default summary on
  an ordinary results page, reaching far more people. `planConfig.ts:59`.
- Meta AI retired 2026-07-16 for being training-data-only.
- DeepSeek excluded: every model reachable through OpenRouter is retrieval-free.
- Copilot excluded: Microsoft ships no public API.
- Weekly refresh on every paid plan. `PLAN_COLLECTION_COOLDOWN_HOURS` = 168h.
- Prices: Free EUR 0, Essentials EUR 99, Growth EUR 299, Growth PRO EUR 449,
  Managed from EUR 1,500, Enterprise custom.

**Prompt caps: unresolved, and this package avoids them.** The owner's decision on
2026-07-29 was 70/230. `planConfig.ts:365` reads **75/250**, and
`brandgeo/web/index.html:2428` now publishes **"75 commercial prompts vs 50"**, so
the live site was updated to 75 the same day. No asset in this package states a
prompt cap. See §5.

**Forbidden:**

- Any claim that Grok or AI Overviews has returned a result. Zero rows exist.
- Any number describing what either engine found.
- Any customer name, quote, logo or result. None exist.
- Any claim about a named competitor's retrieval configuration. The argument is
  framed as a question the reader asks their own vendor, never as an assertion
  about a rival. Comparison pages are a legal surface.

## 4. Funnel map

- **TOFU** (X thread, X single, Threads, Reel, TikTok, Shorts). Measured on
  3-second view rate and replies. CTA is the free audit. No price.
- **MOFU** (blog, LinkedIn, Facebook, IG carousel, YouTube long-form). Measured on
  scroll depth, watch time, audit starts. CTA is the free audit.
- **BOFU** (Google Business Profile). Measured on signup. The only asset carrying
  a price.

## 5. Product and content asks this generated

Handed over, not acted on.

1. **The prompt cap is now contradicted in three places.** The owner decided
   70/230. `planConfig.ts` enforces 75/250. `index.html:2428` publishes 75. A
   79-file fix pass to 70/230 would move the homepage **away** from what the code
   grants. Settle the number in the code first, then propagate.
2. **`_cost.js:312` is NOT a drift defect.** An earlier note in this file called
   `ai_overview` an unmirrored seventh engine and a repeat of the Growth PRO
   two-mirrors bug. That was wrong. It is a real, deliberate engine and
   `planConfig.ts` carries it too. Correction recorded so nobody spends a cycle
   "fixing" it.
3. **`index.html:2475`** lists Grok under "More engines" in the **Custom
   Enterprise** card, two tiers above where it already ships. Confirmed by the
   audit. Owner: `bg-web`.
4. **Nothing has collected in three days**, any engine, any client.
5. The site audit's own CRITICAL list is separate from this package and larger.
   `terms.html`, `llms.txt`, `llms-full.txt` and the EUR 900 Managed sweep are
   all more urgent than anything here.

## 6. Send gate

**Do not publish assets 01 through 08 until real rows exist for both new engines.**

The package states two engines are live. Today that is true of the code and false
of the data: zero `ai_results` rows for any engine in three days, and none ever
for `grok` or `ai_overview`. Publishing a launch for engines that have never
returned a row is the precise failure this brand cannot afford.

Cheapest way to clear it: one collection on the BrandGEO self tenant. 5 active
prompts across 7 engines, roughly **EUR 1.05** modelled at the current per-engine
costs, and less in real cash since Gemini grounding is free under 1,500 requests
per day and both SerpApi engines sit inside a fixed subscription. That is the
owner's click.

Clearing it also opens the stronger follow-up: the exact prompt, what all seven
answered, and specifically **whether Google rendered an AI Overview at all**,
which is a finding no competitor is currently reporting.
