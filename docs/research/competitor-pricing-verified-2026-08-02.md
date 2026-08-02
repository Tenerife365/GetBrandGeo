# Competitor pricing and engine coverage, verified first-party 2026-08-02

This exists because Cluster A and Cluster B of the keyword plan both depend on a
comparison table, and a roundup carrying wrong competitor facts is a credibility
problem on a product whose whole thesis is measurement. Every row below is marked
with how it was obtained. Nothing here is recalled.

**Verification standard.** VERIFIED means the vendor's own pricing page was
fetched today and the figure was read off it. UNVERIFIED means the page gated
its numbers behind JavaScript or a sales form, and the figure is either absent or
comes from a third party. Do not publish an UNVERIFIED number without a
first-party check, and re-check every VERIFIED number before publishing, because
this category reprices constantly (see finding 1).

---

## 1. BrandGEO, from `planConfig.ts`

Source of truth, not the marketing site. Prices in EUR, cadence from
`PLAN_REFRESH_CADENCE`, engines from `PLAN_ENGINES`, allowances from the live
ladder table at `planConfig.ts:497`.

| plan | price | engines | prompts | sites | auto refresh |
|---|---|---|---|---|---|
| free | 0 | 1 (Gemini) | 5 | 1 | monthly |
| radar | 29 launch / 39 list | 2 (Gemini, Claude) | 7 | 1 | weekly |
| essentials | 99 | 3 (ChatGPT, Gemini, Claude) | 18 | 2 | weekly |
| growth | 299 | 5 (+ Perplexity, Google AI Mode) | 35 | 2 | weekly |
| growth_pro | 449 | 7 (+ Grok, AI Overviews) | 56 | 3 | weekly |
| managed | 1500 | 7 | 200 | 10 | weekly |
| enterprise | custom | 7 | n/a | 25 | weekly |

---

## 2. Profound, VERIFIED at tryprofound.com/pricing

| tier | price | engines | prompts | refresh |
|---|---|---|---|---|
| Starter | $99/mo, billed yearly | **1, ChatGPT only** | 50 unique, 1,500 responses/mo | daily |
| Growth | $399/mo, billed yearly | 3: ChatGPT, Perplexity, Google AI Overviews | 100 unique, 9,000 responses/mo | daily |
| Enterprise | custom | up to 9 | tailored | daily |

## 3. Otterly, VERIFIED at otterly.ai/pricing

Closes the open item in CLAUDE.md that recorded Otterly's pricing as
secondary-sourced because they 403 a plain client. They did not block this fetch.

| tier | price | engines | prompts | refresh |
|---|---|---|---|---|
| Lite | $29/mo | 4: ChatGPT, AI Overviews, Perplexity, MS Copilot | 15 | daily |
| Standard | $189/mo, $160 annual | same 4 | 100 | daily |
| Premium | $489/mo, $422 annual | same 4 | 400 | daily |
| Enterprise | custom | same 4 | custom | daily |

**Claude, Google AI Mode and Gemini are paid add-ons at every tier**, not included.

## 4. Peec AI, price UNVERIFIED

Engine list is VERIFIED from peec.ai/pricing: ChatGPT, Google AI Mode, AI
Overviews, Microsoft Copilot, Perplexity, Gemini. That is **6 engines**. Tiers are
Starter, Pro, Advanced, Enterprise, with 1 to 5 projects and daily tracking.

**No price is displayed anywhere on the site**, on the pricing page or the home
page. The widely repeated "$99" is third-party only. Do not publish it.

---

## 5. What this actually says, including the parts we will not enjoy

**Finding 1. The "$499 Profound" figure that half this category repeats is
wrong.** Profound's own page today reads $99 Starter and $399 Growth. At least one
ranking article is built entirely on the $499 number in its headline. Anyone
publishing a comparison off secondary sources right now is publishing a stale
price. That is an opening: being the accurate table is a defensible position for
a brand that already publishes its scoring formula.

**Finding 2. At the 99 price point we win on coverage by a wide margin.**
Profound Starter at $99 tracks **ChatGPT only**. BrandGEO Essentials at EUR 99
tracks three engines. That is a real, checkable, one-line argument.

**Finding 3. And we lose on volume and freshness at every single tier.**
Profound Starter is 50 prompts refreshed daily against Essentials' 18 refreshed
weekly. Otterly Standard is 100 prompts daily at $189. Every competitor verified
here refreshes **daily**; every BrandGEO paid tier refreshes **weekly**. A
comparison table we publish will make that visible, and we should decide
deliberately whether to publish it rather than discover it in a prospect's reply.

**Finding 4, the uncomfortable one. Otterly Lite out-specs Radar at the same
price.** $29 against EUR 29: 4 engines against 2, 15 prompts against 7, daily
against weekly. Radar's one honest defence is narrow but real: Radar's two
engines are **Gemini and Claude**, which are precisely the two Otterly sells as
paid add-ons. So "Radar includes the engines Otterly charges extra for" is true.
"Radar is better value than Otterly Lite" is not established and should not be
claimed. This is worth re-reading `docs/strategy/sprint-ladder-ruling.md` over,
because Radar was priced against our own cost model and not against this.

**Finding 5. Prompt allowances are the weakest column we have.** 7, 18, 35, 56
against competitors' 15, 50, 100, 400. Our per-prompt cost is real and documented,
but a buyer comparing spec sheets does not see cost, they see the smaller number.

---

## 6. Consequences for the article plan

- The three Cluster B "alternatives" pieces are still the right place to start,
  but the angle is **engine coverage per euro and price accuracy**, not "cheaper".
  On raw price we are not always cheaper.
- Any roundup must carry a "verified on" date and re-check before publishing.
- Do not write a Radar versus Otterly comparison until finding 4 is settled.
- Still to verify before a full Cluster A roundup: AthenaHQ, Scrunch, Rankscale,
  Gauge, Semrush AI Toolkit, Ahrefs Brand Radar, Evertune.
