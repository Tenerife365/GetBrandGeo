/**
 * _assistant_kb.js — grounded knowledge base for the site chat assistant
 * (ASSISTANT-SPEC.md §3 "Grounding"). This is the authoritative product/
 * pricing/engine/research fact sheet the assistant answers from — nothing
 * else. It is a faithful, self-contained copy of the facts in
 * brandgeo/web/llms-full.txt.
 *
 * WHY A COPY, NOT A READ. llms-full.txt lives in the static marketing repo
 * (brandgeo/web/), which is NOT bundled with these Netlify functions, so the
 * function cannot fs.readFileSync it at request time. The spec says to inline
 * the grounding; this module is that inline copy, kept in its own file so
 * assistant.js stays legible and so this text has one obvious place to be
 * updated when pricing/engines change. If you edit product facts here, also
 * edit brandgeo/web/llms-full.txt (and vice-versa) so the two never drift.
 *
 * CONTENT-INTEGRITY (CLAUDE.md §0): the assistant must answer ONLY from this
 * text. Anything not here → say so and offer a human hand-off. Never guess a
 * price, a claim, or a testimonial.
 */

const ASSISTANT_KB = `# BrandGEO grounded facts (authoritative; answer only from this)

## Company
- Name: BrandGEO. Website: https://getbrandgeo.com. Contact: support@getbrandgeo.com.
- Founder: Constantin Daniel, Founder. Founded 2026. HQ: Santa Cruz de Tenerife, Canary Islands, Spain (EU/GDPR).
- Category: AI Visibility / Generative Engine Optimization (GEO) monitoring software, a SaaS analytics platform with both self-serve and managed-service tiers, not a marketing agency alone.
- BrandGEO (getbrandgeo.com) is independent and unrelated to any similarly-named domain such as brandgeo.co or brangeo.app.

## What BrandGEO does
BrandGEO monitors how AI engines mention, rank, and describe a brand. It runs a client's real, commercial-buyer-style prompts against five AI engines on a recurring basis: ChatGPT, Gemini, Claude, Perplexity, and Meta AI. (Microsoft Copilot and Google AI Overviews are planned, not yet live.) It also tracks named competitors per prompt, sentiment trends over time, and surfaces a prioritized "Fix This" action hub of specific recommendations.

## Plans (all prices EUR)
- Free (€0/month): 1 project, 5 prompts, ChatGPT only, monthly refresh, self-serve.
- Essentials (€99/month): 30 prompts, ChatGPT + Gemini + Claude, weekly monitoring, competitor tracking, CSV export, self-serve, no setup fee.
- Growth (€299/month): 150 prompts, all 5 AI engines, daily/weekly refresh, 1 onboarding call, self-serve, no setup fee.
- Managed (€900/month or €9,000/year): full managed service (strategy, research, monthly executive report, monthly strategy call, priority support). A one-time €1,250 setup fee applies on the monthly option only; it is waived on the annual option.
- Pro (from €1,500/month, no setup fee): multiple countries, multiple brands, larger prompt coverage, executive reporting, add-ons for extra scale, done-for-you managed service.
- Enterprise (from roughly €10,000/month, custom pricing): unlimited scale across all markets, white-label, dedicated support, done-for-you managed service.

Free, Essentials, and Growth are self-serve software (the client configures their own prompts and markets at app.getbrandgeo.com). Managed, Pro, and Enterprise add a fully managed, done-for-you service on top. The BrandGEO team handles setup, ongoing strategy, research, and monthly reporting/strategy calls. Every tier includes real-time dashboard access.

## Contracts, fees, refunds
- Essentials, Growth, and Managed monthly have no minimum, so you can cancel anytime. Managed yearly and Pro's annual option are 12-month commitments paid upfront.
- No hidden fees. The only extra beyond the listed price is Managed's one-time €1,250 setup fee (monthly option only, waived on annual), always shown upfront.
- Refunds: monthly plans cancel anytime, no proration on partial months already billed. Yearly plans are non-refundable after the first 14 days; full refund within 14 days if no reports have been delivered yet.

## Methodology
Structured query methodology, not a single brand-name lookup. During onboarding the team identifies the real commercial-buyer questions a brand's potential customers ask AI engines (e.g. "best catering company in Madrid"), then runs them across all five engines on a recurring schedule (weekly by default, daily or weekly on Growth and above) with live web search enabled where the engine supports it. Each run measures: mention frequency, position (#1/#2/#3 when multiple brands appear), sentiment/framing, competitor comparison (vs 3-5 named competitors), the AI Visibility Score (0-100), and week-over-week trend.

## AI Visibility Score (0-100, weighted, six dimensions)
- Recognition (25%): overall mention rate, i.e. does the engine mention the brand at all across the prompts that matter.
- Knowledge (20%): when mentioned, how good is the position (#1 scores highest; decays toward a floor as position worsens).
- Sentiment (15%): positive / neutral / negative framing when mentioned.
- Accuracy (15%): share of mentions landing in the top 3 (a mention with no clear numbered position is treated as accurate by default).
- Reach (15%): share of the five engines that mention the brand in at least one prompt.
- Consistency (10%): share of tracked prompts where at least 60% of checked engines mention the brand.
Recalculated on every collection run so a brand can track its trend.

Per-engine, per-query-category status labels shown on the "Fix This" hub:
- KNOW: mentioned accurately and confidently (the target state).
- PARTIAL: mentioned with uncertainty, incomplete, or mixed with incorrect details.
- MISSING: not mentioned at all, or a competitor named instead.
The "Fix This" hub prioritizes moving an engine from MISSING → PARTIAL → KNOW, and moving up in position within an engine that already knows the brand.

## Free audit
A free, one-time AI Visibility audit, available once per brand domain (refreshable after 6 months). It is a snapshot delivered within 48 hours: the AI Visibility Score, per-engine KNOW/PARTIAL/MISSING status, top 3 improvement areas, and a comparison against 1-2 direct competitors. It does NOT include dashboard access or ongoing monitoring; that's what the paid plans are for. Start it at https://app.getbrandgeo.com/signup (the domain can be pre-filled).

## Weekly report (on monitored tiers)
The overall score and its direction, exact quotes of what each engine said about the brand, competitor comparison, which engines did and didn't mention the brand, what changed since last week, and specific prioritized (P0/P1/P2) recommendations.

## Comparison to other tools
Most competing AI visibility tools (Peec, Profound, Otterly, Semrush AI Toolkit, and others) are self-serve SaaS dashboards only. BrandGEO offers that same self-serve path on Free/Essentials/Growth, but also adds a genuinely done-for-you managed service on Managed and Pro (the team handles strategy, research, and reporting directly) at software-level pricing, versus the roughly $1,500-5,000+/month a dedicated GEO agency retainer typically costs. Honest, two-sided comparison pages exist vs Peec AI, Profound, Otterly.AI, Scrunch AI, AthenaHQ, Rankscale, Ahrefs Brand Radar, Semrush AI Toolkit, Conductor, and Goodie AI. Comparison hub: https://getbrandgeo.com/blog.html#compare

## Research
BrandGEO publishes original research (BrandGEO Research) and a peer-citable open-access data paper on Zenodo titled "Cross-Engine Consensus in AI-Generated Brand Recommendations" (Constantin Daniel, BrandGEO, July 2026), DOI 10.5281/zenodo.21395598, CC BY 4.0, analyzing 222 real API responses across seven cities and five engines. Research index: https://getbrandgeo.com/blog.html. There are also per-city AI Visibility Studies (London, Berlin, Madrid, New York, Paris, Rome, Dublin) and per-industry guides (SaaS, e-commerce, law firms, hotels, financial services, healthcare, real estate, home services, restaurants, education).

## Key links
- Pricing: https://getbrandgeo.com/#pricing
- Free audit / signup: https://app.getbrandgeo.com/signup
- Dashboard login: https://app.getbrandgeo.com
- FAQ: https://getbrandgeo.com/faq.html
- Support (existing customers): https://getbrandgeo.com/support.html
- Contact / support email: support@getbrandgeo.com`

module.exports = { ASSISTANT_KB }
