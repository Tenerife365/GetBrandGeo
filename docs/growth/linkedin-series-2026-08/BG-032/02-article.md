# BG-032 / Asset 02 — LinkedIn Article

**Channel:** BrandGEO company page, native Article composer ("Write article")
**When:** Wednesday 2026-09-09, morning slot
**Cover image:** `docs/growth/og-cards/cards/og-bg-032.png`. It is 1200x630 and
LinkedIn's cover target is 1920x1080, so expect about 7% cropped off the width.
Check the preview for text near the edges.

**Suggested title:**
The Most Consistent AI Engine We Measured Still Changed Four Answers in Five Between Languages

**Alternative titles:**
- Which AI engine changes its answer most between languages, and why that is the wrong question
- We ranked four AI engines on language consistency. The ranking is not the point.

**Paste note:** LinkedIn's Article composer does not read markdown. Bold the
subheads by hand after pasting.

---

## Article body

We wanted to know if some AI engines are simply more consistent than others when you change the language of the question. If one were substantially steadier, that would matter: it would be the engine to trust when you can only afford to check one.

We had the data to test it, from the same bilingual study behind the rest of this series: four cities, four commercial categories each, every question asked once in the local language and once in English, on the same day, with each engine's answer compared only against its own answer in the other language.

The short answer is that some engines are steadier than others, and it barely matters, because none of them are steady.

What we did

One collection run, 10 July 2026. Four cities, four commercial categories each, every category asked twice: once in the local language and once in English, with nothing else changed. Four engines answered: Claude, Gemini, Perplexity and Meta AI. ChatGPT returned an API error on all 32 prompts that day, so it is absent rather than recorded as a zero. Meta AI was retired from BrandGEO on 16 July 2026, after this run, and its answers stay in the dataset, because removing a measurement to match a later product decision would falsify the record. Gemini's answers were frequently unparseable for company names, so it appears in fewer comparisons than the other three and is never ranked on its own.

The result, stated plainly

Perplexity answered all 16 comparable pairs across the four cities: 102 companies named in the local language, 95 in English, 31 shared, for 18.7% overlap. That was the highest of the four engines measured.

Claude answered the same 16 pairs: 91 names in the local language, 85 in English, 19 shared, for 12.1% overlap, the lowest.

Meta AI answered 11 comparable pairs: 59 local names, 80 English names, 20 shared, 16.8%. Gemini answered only 3 pairs, because its answers were usually not in a form our extractor could pull company names from: 26 local names, 30 English, 8 shared, 16.7%. We are publishing that number because hiding it would be worse than the alternative, but we are not ranking it alongside the other three, since three pairs is not enough ground to stand on.

Perplexity was the most stable and Claude the least, on identical ground: both answered all 16 pairs. Claude produced five comparisons in which the two languages shared no company whatsoever. Perplexity produced six, but across a much larger shared set overall.

The finding that matters is not the ranking

The spread from the highest overlap to the lowest is about six percentage points. The gap between languages within every single engine is the other eighty-odd.

The most consistent engine we measured still replaced more than four names in five when the language of the question changed.

So the practical answer to "which engine should I optimise for to avoid this" is that there is not one. Choosing an engine does not get you out of measuring both languages. It barely moves the number.

The one bright spot, and what it is actually evidence of

Perplexity's best single category was Rome real estate agencies, where it named ten companies in Italian and ten in English, and nine were the same. That is the highest agreement anywhere across the whole study, in either this piece or the city-by-city ones.

It happened in a market with strong national franchise networks and a heavily indexed listings ecosystem, where the same firms are described consistently in both languages regardless of which one you search in. Consistency looks like a property of how well documented a category is, not a property of the engine that answered it.

A hypothesis we cannot test with this data

One reading of Perplexity leading and Claude trailing is that Perplexity is built around live retrieval and citation, so a question in one language and the same question in another can land on overlapping source documents, while an engine leaning more on its own internal representation of a market has more room for the two languages to diverge.

That is a hypothesis. We measured what each engine printed, not how it arrived there, and a six-point spread across 16 comparisons in one collection run is not a large enough result to carry a mechanism. We are reporting the ranking because it is what we measured, and we are not explaining it, because we did not measure that part.

What to do with this

Do not pick an engine to dodge the language problem. The best engine here still named a different company four times out of five across languages.

Do check more than one engine per language. Claude's five zero-overlap comparisons mean a single-engine check in a single language can be maximally unrepresentative of what the other three would have said.

Treat consistency as something you influence, not something you receive from picking the right tool. The one category that converged did so because the underlying record was already consistent in both languages, not because of which engine was asked.

Honest limits

Four engines, not seven. ChatGPT returned an API error on all 32 prompts in this run and is absent, which is a real gap given it is the engine most people mean by AI search. Meta AI has since been retired from our product. Grok and Google AI Overviews were added to BrandGEO on 29 July 2026, after this data was collected, and are not represented here. A rerun including all seven engines is the obvious next step and would likely change these figures.

Full study, with the city-level detail behind each engine's numbers: https://getbrandgeo.com/bg-032.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-032

The Rome case behind the one consistent category: https://getbrandgeo.com/bg-031.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-032

The full cross-city result this is part of: https://getbrandgeo.com/bg-027.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-032

If you would rather check your own brand across engines than take our word for it, the test is free and needs no signup: https://getbrandgeo.com/?utm_source=linkedin&utm_medium=article&utm_campaign=bg-032#free-audit

---

## Subheads to bold after pasting

What we did · The result, stated plainly · The finding that matters is not the ranking · The one bright spot, and what it is actually evidence of · A hypothesis we cannot test with this data · What to do with this · Honest limits

## Verification notes

Every figure is taken from `brandgeo/web/bg-032.html`: the four-row table
(Perplexity 16/102/95/31/18.7%, Meta AI 11/59/80/20/16.8%, Gemini 3/26/30/8/
16.7%, Claude 16/91/85/19/12.1%), the "about six percentage points" spread
against the "eighty-odd" within-engine gap, the "more than four names in five"
framing, the Rome real estate result (also in `bg-031.html`), the explicitly
unproven retrieval hypothesis, and the honest-limits paragraph including the
29 July 2026 Grok and Google AI Overviews addition. Nothing was recalculated
and no mechanism is asserted beyond what the source article itself asserts.
