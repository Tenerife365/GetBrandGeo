# LinkedIn Article: BG-027, ready to paste (2026-08-02)

**Format note:** written for LinkedIn's native long-form Article composer ("Write
article"), not the feed post. The feed post is a separate asset and lives at
`brandgeo/BG-027-linkedin-asset.md`. Per `docs/LINKEDIN-STRATEGY.md`, native
Articles avoid the algorithmic throttling LinkedIn applies to posts that send
readers off-platform, which is the same problem the link-in-first-comment trick
works around. First person, Constantin's voice, matching
`docs/linkedin-article-published-paper-2026-07-16.md`. No em dashes and no en
dashes anywhere (checked programmatically).

**Suggested title for the Article composer:**
We asked AI the same question in two languages. It described two different markets.

**Alternative titles:**
- Ask in German and you get a person. Ask in English and you get a firm.
- Your AI visibility is not one number. It is one number per language.

**Cover image:** `brandgeo/web/images/og/og-bg-027.png`. See the banner note at the
bottom of this file before you upload it.

---

## Article body

Last month I wrote here about something odd we found in Paris.

We had asked four AI engines which wealth management advisor a client should use, once in French and once in English. Ask in French, and the engines named independent French boutiques. Ask the identical question in English, and they named large international private banks. Not a different ranking of the same firms. A different kind of business entirely.

At the time I noted it as unexpected and moved on. It kept bothering me, so we went back and measured it properly.

**What we did**

Four European cities: Berlin, Madrid, Paris and Rome. Four real commercial categories in each. Every category asked twice, once in the local language and once in English, with nothing else changed. Same day, same engines, same market setting, same phrasing translated as directly as two languages allow.

One collection run, 10 July 2026. Four engines answered: Claude, Gemini, Perplexity and Meta AI.

Two disclosures before any numbers, because they matter more than the numbers do. ChatGPT returned an API error on all 32 prompts that day, so it is absent from this dataset rather than recorded as a zero. Absence of data is not a negative result. And Meta AI was retired from our own product six days after this run. Its answers stay in the data, because removing a measurement to match a later product decision would falsify the record.

**What came back**

The engines named 486 distinct companies. 87 appeared in both languages. 399 appeared in one and never in the other.

That is 82.1% of companies showing up in only one of the two languages.

I do not think that is the most useful number, though, because it counts every company once regardless of how marginal the mention was. The stricter measure compares each engine's answer against its own answer in the other language, category by category, and asks what share of the combined list the two have in common.

That gives 15.9%. Across 46 comparable pairs, the local-language answer and the English answer agreed on roughly one company in six.

Thirteen of those 46 pairs shared nothing at all. Same engine, same question, same day, two languages, zero companies in common.

**City by city**

Berlin, German and English: 139 companies named, 88.5% in one language only, 8.9% overlap
Paris, French and English: 127 named, 81.1% single language, 15.3% overlap
Rome, Italian and English: 133 named, 81.2% single language, 18.0% overlap
Madrid, Spanish and English: 87 named, 74.7% single language, 23.2% overlap

Berlin is the extreme case and Madrid the mildest, and the gap between them is not noise. It tracks something you can act on.

**The shape underneath the numbers**

Reading the actual lists rather than the totals, the same thing happens city after city. The local language surfaces domestic independents. English surfaces international brands.

In Berlin we asked for employment lawyers. The German question returned individual named lawyers and small practices. The English question returned large commercial firms. Ask in German and you are handed a person. Ask in English and you are handed a firm.

In Rome we asked where to take a business dinner. Italian returned Trapizzino, Supplizio, Osteria Fratelli Mori. English returned La Pergola, Salumeria Roscioli, Pierluigi. The internationally famous ones.

And in Paris, the case that started all of this: French returned French independents, English returned global private banks. The handful of names that did appear in both were every one of them large institutions with an established English-language presence.

**Why Madrid was the mildest, and what that says about your own category**

One of Madrid's four categories behaved completely differently from everything else in the study: hotels near the airport. Crowne Plaza, Hilton, Ibis and Melia were named in both languages. That single category is most of the reason Madrid sits at 23.2% rather than Berlin's 8.9%.

The reason is not linguistic. That category is dominated by international chains whose names are identical in every language, whose websites exist in several languages, and which are described in the same terms by the same sources whichever language you read them in. There is nothing for the language to change.

Which gives you a rule you can apply to yourself without running anything:

Chain-dominated categories converge across languages. Independent-dominated categories diverge.

That is exactly backwards from where the attention goes. The independent restaurant, the local law firm, the regional agency: they have the most to lose from this effect, and they are the least likely to be measuring it.

**What I think this means if you sell outside English**

An English-only measurement is a measurement of a different market. If your buyers ask in German, the German answer is your answer. The English one describes a market you may not even sell into.

Being absent from one language is not a small gap. In 13 of 46 comparisons the two answers had nothing in common, which means the set of companies competing for that recommendation was entirely different. You are not ranked lower in the other language. You are in a different contest.

And your competitor set moves with the language. The firms you benchmark against in English may never appear when a domestic customer asks in their own language, and the ones that do appear may not be on your radar at all.

**What this is not**

One run, one day, four cities, sixteen category and language pairs. That is enough to establish the effect is large and consistent in direction. It is not enough to tell you how large it is for your category, in your country, this month. Engines change. A second run would return different names.

It also cannot tell you why an engine chose what it chose. We can see that German returned individual lawyers and English returned large firms. We cannot see whether that comes from what those firms publish, from which sources the engine reached for, or from how the model represents the question. Anyone who tells you they know which, on this evidence, is guessing.

What it is enough for is one decision: if you sell in a non-English market, measure both languages separately, and start now.

Full study, with the city tables and the complete method: https://getbrandgeo.com/bg-027.html

If you would rather check your own brand than take my word for it, the test is free and needs no signup: https://getbrandgeo.com/#free-audit

---

## Posting notes (not part of the Article itself)

**Opening line.** Confirmed by Constantin 2026-08-02 that the 2026-07-16 Article
WAS published, so the opening now references it directly ("Last month I wrote
here about..."). That article covered the seven-city paper and raised the Paris
wealth-management finding without measuring it, which is exactly what this study
went back and did. If for any reason that article is taken down, revert the first
line to "A few weeks ago, running a study across seven cities, we noticed
something odd in Paris."

**Banner.** `og-bg-027.png` is **1200 x 630**, ratio 1.905. LinkedIn's Article
cover target is **1920 x 1080**, ratio 1.778. It will upload and it will look
right, but LinkedIn crops to the narrower ratio, so roughly 7% of the width can
be trimmed from the sides. Check the composer preview before publishing, and if
any text sits close to the left or right edge, either accept the crop or have a
1920 x 1080 version rendered from
`docs/growth/og-cards/build_og_cards.py`.

**Sequencing against the feed post.** These are two different assets covering the
same research, so do not publish them within minutes of each other. Feed post
first for reach, Article a day or two later for the people who want the full
argument without leaving LinkedIn.

**Figures.** Every number here is taken from the published article at
`brandgeo/web/bg-027.html`. Nothing was recalculated. The 6-day gap between the
10 July run and Meta AI's 16 July retirement is arithmetic from the two dates
stated in that article.
