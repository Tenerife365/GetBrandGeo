# Product copy, CAMPAIGN-2026-07-30

BOFU. Every block below carries a price and a call to action, per BRIEF
section 3 rule 9.

Every price and engine count here was read from source on 2026-07-30 and
**re-read on 2026-07-31**, after the sprint ladder ruling landed in code. Each
number is listed with its source in `README.md`. Nothing has been created in
Stripe or in Google Business Profile. These are drafts for a human to paste.

**What changed on 2026-07-31, because it makes four of the seven blocks below
different from the version generated the day before.** Radar entered the ladder
between Free and Essentials. Free moved off ChatGPT and onto Gemini, so the Free
block published the day before named an engine that tier no longer runs.
Essentials went from 15 prompts to 18, Growth PRO from 35 to 56, and Managed
from 120 to 200. Sources for all of it are in `README.md` section 7.

Character counts under each fenced block are computed by
`_build/verify_product.py` check D against the block itself. If you edit a
block, re-run the verifier rather than adjusting the number by hand. Check E,
added 2026-07-31, asserts the engine names and prompt numbers in each section
against `PLAN_FACTS`, which is the defect class that produced the stale Free
block.

**Field limits, and what could not be verified.** Stripe's API reference states
no maximum length for a product `name` or `description`, so the caps used here
are self-imposed for legibility at the sizes those fields actually render:
Checkout's order summary and the invoice line, both narrow. Google publishes no
character limit for a Business Profile product field that could be found from
its own help pages either. Both are marked `[UNVERIFIED]` in `README.md`. The
self-imposed budgets are 60 characters for a name and 300 for a description,
with the first 90 characters of every description written to stand alone,
because Google Business Profile truncates hard in the listing view.

---

## Free

Image set: `stripe-free-1024x1024.png`, `gbp-free-1440x1440.png`,
`promo-free-1080x1080.png`, `promo-free-1080x1350.png`,
`promo-free-1200x630.png`, `promo-free-1600x900.png`

### Stripe

Product name

```text
BrandGEO Free
```

_13 characters_

Product description

```text
Track how Gemini answers when buyers ask for a company like yours. 5 buyer prompts, checked monthly, one engine. No card required. Start at getbrandgeo.com.
```

_156 characters_

### Google Business Profile product

Product name

```text
BrandGEO Free
```

_13 characters_

Category

```text
AI visibility monitoring
```

_24 characters_

Price

```text
EUR 0
```

_5 characters_

Description

```text
See what Gemini says about your category. Free, no card. You get 5 buyer prompts, checked once a month, against one engine: Gemini. It is the smallest honest version of the product, not a trial that expires. Radar adds Claude and a weekly check for EUR 29. Start at getbrandgeo.com.
```

_282 characters_

### Direct promotion

Short line, for an ad or a DM

```text
Ask Gemini what it recommends in your category. BrandGEO Free checks 5 prompts a month against it, EUR 0, no card. getbrandgeo.com
```

_130 characters_

Longer paragraph, for a landing block

```text
BrandGEO Free monitors one engine, Gemini, against 5 buyer prompts you write, once a month. That is the whole tier and it does not expire. It exists because the first useful thing to know is whether an AI engine names you at all when somebody asks for a company like yours, and you do not get a copy of that answer. Radar adds Claude and moves the check to weekly for EUR 29. ChatGPT starts at Essentials. EUR 0, no card. Start at getbrandgeo.com.
```

_447 characters_

---

## Radar

Image set: `stripe-radar-1024x1024.png`, `gbp-radar-1440x1440.png`,
`promo-radar-1080x1080.png`, `promo-radar-1080x1350.png`,
`promo-radar-1200x630.png`, `promo-radar-1600x900.png`

**Two prices are live on this tier at once.** EUR 29 is the launch price for the
first 100 subscribers and EUR 39 is list. Every block below quotes EUR 29 and
names EUR 39 as what follows, matching the live pricing card. **The launch
coupon does not apply here**, see note 5 at the end of this file.

### Stripe

Product name

```text
BrandGEO Radar
```

_14 characters_

Product description

```text
Weekly AI visibility on Gemini and Claude. 7 buyer prompts, one website, with mention, position and sentiment per engine. EUR 29 a month launch price, EUR 39 list. getbrandgeo.com
```

_179 characters_

### Google Business Profile product

Product name

```text
BrandGEO Radar
```

_14 characters_

Category

```text
AI visibility monitoring
```

_24 characters_

Price

```text
EUR 29 / mo
```

_11 characters_

Description

```text
Two AI engines, checked weekly: Gemini and Claude. You write up to 7 buyer prompts for one website, and we record whether each engine names you, where in the answer, and which competitors it names instead. EUR 29 a month for our first 100 customers, EUR 39 after. Subscribe at getbrandgeo.com.
```

_293 characters_

### Direct promotion

Short line, for an ad or a DM

```text
Two AI engines, 7 buyer prompts, checked every week. BrandGEO Radar is EUR 29 a month for our first 100 customers. getbrandgeo.com
```

_130 characters_

Longer paragraph, for a landing block

```text
BrandGEO Radar runs 7 buyer prompts against Gemini and Claude every week and records what came back: whether the engine named you, where you sat in the answer, and which competitors it named instead. Free checks one engine once a month, which is a single reading and cannot show you a direction. Radar checks two engines four times as often, on one website, which is what a trend line needs. ChatGPT starts at Essentials. EUR 29 a month for our first 100 customers, EUR 39 after that. Start at getbrandgeo.com.
```

_510 characters_

---

## Essentials

Image set: `stripe-essentials-1024x1024.png`, `gbp-essentials-1440x1440.png`,
`promo-essentials-1080x1080.png`, `promo-essentials-1080x1350.png`,
`promo-essentials-1200x630.png`, `promo-essentials-1600x900.png`

### Stripe

Product name

```text
BrandGEO Essentials
```

_19 characters_

Product description

```text
AI visibility monitoring across ChatGPT, Gemini and Claude. 18 buyer prompts, refreshed weekly, with mention, position and sentiment per engine. EUR 99 per month. getbrandgeo.com
```

_178 characters_

### Google Business Profile product

Product name

```text
BrandGEO Essentials
```

_19 characters_

Category

```text
AI visibility monitoring
```

_24 characters_

Price

```text
EUR 99 / mo
```

_11 characters_

Description

```text
Monitor three AI engines: ChatGPT, Gemini and Claude. You write up to 18 buyer prompts, we run them weekly and record whether each engine names you, where in the answer, and which competitors it names instead. EUR 99 per month. Subscribe at getbrandgeo.com.
```

_257 characters_

### Direct promotion

Short line, for an ad or a DM

```text
Three AI engines, 18 buyer prompts, refreshed weekly. BrandGEO Essentials is EUR 99 a month. getbrandgeo.com
```

_108 characters_

Longer paragraph, for a landing block

```text
BrandGEO Essentials runs your buyer prompts against ChatGPT, Gemini and Claude every week and records what came back: whether the engine named you, where you sat in the answer, and which competitors it named instead. 18 prompts, three engines, and ChatGPT starts here rather than on either tier below. It will not tell you about Perplexity or either Google surface, which start at Growth. EUR 99 per month at getbrandgeo.com.
```

_425 characters_

---

## Growth

Image set: `stripe-growth-1024x1024.png`, `gbp-growth-1440x1440.png`,
`promo-growth-1080x1080.png`, `promo-growth-1080x1350.png`,
`promo-growth-1200x630.png`, `promo-growth-1600x900.png`

### Stripe

Product name

```text
BrandGEO Growth
```

_15 characters_

Product description

```text
AI visibility monitoring across five engines: ChatGPT, Gemini, Claude, Perplexity and Google AI Mode. 35 buyer prompts, refreshed weekly, plus AI SEO on 10 pages. EUR 299 per month. getbrandgeo.com
```

_197 characters_

### Google Business Profile product

Product name

```text
BrandGEO Growth
```

_15 characters_

Category

```text
AI visibility monitoring
```

_24 characters_

Price

```text
EUR 299 / mo
```

_12 characters_

Description

```text
Five AI engines, weekly: ChatGPT, Gemini, Claude, Perplexity and Google AI Mode. 35 buyer prompts, competitor tracking, and AI SEO across 10 of your pages with one audit a week. Google AI Overviews and Grok start at Growth PRO. EUR 299 per month at getbrandgeo.com.
```

_265 characters_

### Direct promotion

Short line, for an ad or a DM

```text
Five AI engines including Perplexity and Google AI Mode, 35 prompts, weekly. BrandGEO Growth, EUR 299 a month. getbrandgeo.com
```

_126 characters_

Longer paragraph, for a landing block

```text
BrandGEO Growth adds Perplexity and Google AI Mode to the three engines Essentials covers, takes your prompt allowance to 35, and turns on AI SEO across 10 pages with one audit a week. Google AI Mode is the conversational tab a searcher switches to deliberately. The summary block on an ordinary results page is a separate product, Google AI Overviews, and it starts at Growth PRO. EUR 299 per month at getbrandgeo.com.
```

_419 characters_

---

## Growth PRO

Image set: `stripe-growth_pro-1024x1024.png`, `gbp-growth_pro-1440x1440.png`,
`promo-growth_pro-1080x1080.png`, `promo-growth_pro-1080x1350.png`,
`promo-growth_pro-1200x630.png`, `promo-growth_pro-1600x900.png`

### Stripe

Product name

```text
BrandGEO Growth PRO
```

_19 characters_

Product description

```text
All seven collecting engines, adding Grok and Google AI Overviews to Growth. 56 buyer prompts, refreshed weekly, plus AI SEO on 30 pages. EUR 449 per month. getbrandgeo.com
```

_172 characters_

### Google Business Profile product

Product name

```text
BrandGEO Growth PRO
```

_19 characters_

Category

```text
AI visibility monitoring
```

_24 characters_

Price

```text
EUR 449 / mo
```

_12 characters_

Description

```text
Seven AI engines, weekly. Growth PRO adds Grok, which reads live posts on X, and Google AI Overviews, the summary block on an ordinary Google results page. 56 buyer prompts, up from 35 on Growth. AI SEO covers 30 pages. EUR 449 per month at getbrandgeo.com.
```

_257 characters_

### Direct promotion

Short line, for an ad or a DM

```text
Growth PRO adds two engines Growth cannot see: Grok and Google AI Overviews. Seven in total, 56 prompts, EUR 449 a month. getbrandgeo.com
```

_137 characters_

Longer paragraph, for a landing block

```text
Growth PRO buys two engines, a deeper prompt allowance and deeper AI SEO. Grok is the one engine with live retrieval from X, so it reads a surface the other six cannot. Google AI Overviews is the summary block shown by default on an ordinary Google results page, which reaches far more searchers than the AI Mode tab does, and a brand can be cited in one and absent from the other. AI SEO goes from 10 pages to 30 and the prompt allowance from 35 to 56. The refresh is weekly on both tiers. EUR 449 per month at getbrandgeo.com.
```

_528 characters_

---

## Managed

Image set: `stripe-managed-1024x1024.png`, `gbp-managed-1440x1440.png`,
`promo-managed-1080x1080.png`, `promo-managed-1080x1350.png`,
`promo-managed-1200x630.png`, `promo-managed-1600x900.png`

### Stripe

Product name

```text
BrandGEO Managed
```

_16 characters_

Product description

```text
Done for you. All seven collecting engines, 200 buyer prompts, AI SEO on 100 pages, written and run by us. From EUR 1,500 per month. Sales assisted, talk to us at getbrandgeo.com.
```

_179 characters_

### Google Business Profile product

Product name

```text
BrandGEO Managed
```

_16 characters_

Category

```text
Managed AI visibility service
```

_29 characters_

Price

```text
from EUR 1,500 / mo
```

_19 characters_

Description

```text
The same seven engines as Growth PRO, run for you rather than by you. 200 buyer prompts written and maintained on your behalf, AI SEO across 100 pages with three audits a week, and the reporting done. Priced from EUR 1,500 per month, quoted per account. Talk to us at getbrandgeo.com.
```

_284 characters_

### Direct promotion

Short line, for an ad or a DM

```text
Seven AI engines, 200 buyer prompts, all of it run for you. BrandGEO Managed, from EUR 1,500 a month. getbrandgeo.com
```

_117 characters_

Longer paragraph, for a landing block

```text
BrandGEO Managed is the same seven engines as Growth PRO with the work taken off you. We write and maintain the 200 buyer prompts, run AI SEO across 100 pages with three audits a week, and hand you the reporting. The engine set is identical to Growth PRO, so what you are buying at this tier is scale and the service, stated plainly rather than dressed up as more coverage. From EUR 1,500 per month, quoted per account. Talk to us at getbrandgeo.com.
```

_450 characters_

---

## Enterprise

Image set: `stripe-enterprise-1024x1024.png`,
`gbp-enterprise-1440x1440.png`, `promo-enterprise-1080x1080.png`,
`promo-enterprise-1080x1350.png`, `promo-enterprise-1200x630.png`,
`promo-enterprise-1600x900.png`

### Stripe

Product name

```text
BrandGEO Enterprise
```

_19 characters_

Product description

```text
Seven collecting engines with no prompt ceiling and no refresh cooldown. AI SEO on 500 pages. Copilot and DeepSeek are reserved and do not collect yet. Custom pricing. getbrandgeo.com
```

_183 characters_

### Google Business Profile product

Product name

```text
BrandGEO Enterprise
```

_19 characters_

Category

```text
Managed AI visibility service
```

_29 characters_

Price

```text
Custom
```

_6 characters_

Description

```text
Seven collecting engines with no published prompt ceiling and no refresh cooldown, AI SEO across 500 pages, and seven audits a week. Two further engines, Copilot and DeepSeek, are reserved on this tier and switch on the day they start collecting. Neither collects today. Priced per account at getbrandgeo.com.
```

_309 characters_

### Direct promotion

Short line, for an ad or a DM

```text
Seven AI engines, no prompt ceiling, no refresh cooldown. BrandGEO Enterprise is priced per account. getbrandgeo.com
```

_116 characters_

Longer paragraph, for a landing block

```text
BrandGEO Enterprise removes the two limits every other tier has: there is no published prompt ceiling and no cooldown between collection runs, so a run can be triggered whenever you need one. AI SEO covers 500 pages with seven audits a week. Two more engines, Copilot and DeepSeek, are reserved against this tier and switch on automatically the day they begin collecting. Neither collects today, and we would rather say so than count them. Priced per account. Talk to us at getbrandgeo.com.
```

_490 characters_

---

## Notes for whoever pastes this

1. **The live Stripe product descriptions are wrong and this copy replaces
   them.** `scripts/stripe-create-catalogue.js` lines 59 and 66 undercount both
   paid tiers: Growth is described with an engine count of 4 when it has 5, and
   Growth PRO with a count of 5 when it has 7. Both strings predate the Grok
   and Google AI Overviews launches of 2026-07-29. The exact defective strings
   are deliberately not quoted here, because this file is scanned for false
   engine claims and a quoted defect is indistinguishable from a committed one.
   That script also has no Radar entry, so the Radar product in Stripe was
   created outside it and the script is now short of the catalogue by one tier.

2. **There is no Stripe product for Free, Managed or Enterprise, and there
   should not be a self-serve one.** Free is provisioned by signup, Managed and
   Enterprise are sales assisted and route to contact. Their Stripe blocks
   above exist so the tier reads correctly if it is ever added to a quote,
   an invoice line or a pricing table, not as an instruction to create a
   checkout for them. Radar is not in this list: it is self-serve and has a
   live payment link, see `README.md` section 5.

3. **Do not claim AI Social on any tier.** `planConfig.ts` sets
   `FEATURE_MIN_PLAN.ai_social` to `enterprise` while the feature is finished,
   and the three `social-*.js` functions are gated `adminOnly`. The
   `PLAN_SOCIAL_CHANNEL_LIMIT` table reads 1 on Growth and 3 on Growth PRO, but
   the feature gate above it means no customer on those tiers can reach it. No
   copy in this file mentions it.

4. **Growth and Growth PRO no longer share a prompt allowance, and the old
   version of this note said they did.** Growth is 35 and Growth PRO is 56 as
   of 2026-07-31. The refresh cadence is still 168 hours on both, so that is
   still not a differentiator and no copy above treats it as one. The step is
   two engines, the prompt allowance and the AI SEO depth.

5. **The launch coupon must not be applied to Radar.** Radar's EUR 29 is
   already the discount, and stacking a launch coupon on a launch price would
   take the tier to roughly EUR 20 against a cost floor that makes the margin
   ceiling meaningless. The ruling scopes the coupon to Essentials and up.
   Source: `docs/strategy/sprint-ladder-ruling.md` decision 1, the launch price
   mechanism.

6. **Deactivate the EUR 29 Stripe price at the 100th live Radar subscription,
   and re-render the Radar images in the same change.** Every Radar image
   carries the words "EUR 29 / mo launch". The moment list pricing resumes those
   files are false, and nothing in the build will notice, because the renderer
   reads the price from `PLAN_FACTS` and `PLAN_FACTS` is a transcription rather
   than a live read of Stripe. Change `price_glyph` to the list price, re-run
   `render_product_images.py`, re-run `verify_product.py`.
