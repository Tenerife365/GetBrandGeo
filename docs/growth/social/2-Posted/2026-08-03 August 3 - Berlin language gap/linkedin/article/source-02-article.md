# BG-028 / Asset 02 — LinkedIn Article

**Channel:** BrandGEO company page, native Article composer ("Write article")
**When:** Wednesday 2026-08-12, morning slot
**Cover image:** `docs/growth/og-cards/cards/og-bg-028.png`. It is 1200x630 and
LinkedIn's cover target is 1920x1080, so expect about 7% cropped off the width.
Check the preview for text near the edges.

**Suggested title:**
Ask AI in German and it names a lawyer. Ask in English and it names a law firm.

**Alternative titles:**
- Berlin had the widest AI language gap in Europe. Here is what it looked like.
- The language of the question decided which companies existed

**Paste note:** LinkedIn's Article composer does not read markdown. Bold the
subheads by hand after pasting.

---

## Article body

We asked four AI engines a question that thousands of Berliners ask every year: who is the best employment lawyer in Berlin.

We asked it twice. Once in German. Once in English. Same day, same engines, same market setting, nothing changed except the language.

The German answers named people. Rechtsanwalt Andreas Martin. HENSCHE Rechtsanwälte. Bechert Rechtsanwälte. Gröning Rechtsanwälte. Rechtsanwalt Benjamin Stumpp. Rechtsanwalt Philipp Kitzmann. Several answers named a specific human being rather than an organisation at all.

The English answers named institutions. CMS Deutschland. Beiten Burkhardt. GÖRG Partnerschaft von Rechtsanwälten. Pusch Wahlig Workplace Law. Schlun und Elseven.

Two names survived the language change: Pascal Croset and Kliemt Arbeitsrecht. Everything else in one list was absent from the other.

What we did

Berlin was one of four European cities in a bilingual study we ran on 10 July 2026. Four commercial categories per city, each asked twice, once in the local language and once in English. Four engines answered: Claude, Gemini, Perplexity and Meta AI.

Two disclosures. ChatGPT returned an API error on all 32 prompts that day, so it is absent from this data rather than recorded as a zero. Meta AI was retired from our own product six days after this run, and its answers stay in the dataset, because removing a measurement to match a later product decision would falsify the record.

Berlin produced the widest gap of the four cities.

8.9% overlap between the German answer and the English answer. 88.5% of the 139 companies named appeared in only one of the two languages. In 4 of 11 engine and category comparisons, the two answers shared no company at all.

What we removed before counting

Both languages produced things our extractor picked up that are not companies, and we took them out by hand: the Arbeitsgericht Berlin, which is the labour court, the Rechtsanwaltskammer Berlin and the Berlin Bar, which are professional bodies, a Best Lawyers directory listing, the neighbourhood Berlin Schöneberg, and fragments such as "Kündigungsschutzklagen" and "Seit 25 Jahren". None are firms and none were counted.

The obvious objection, and why it does not hold

You could reasonably say this is a quirk of professional services. German convention names the lawyer, English convention names the practice, and we have measured a naming habit rather than a visibility gap.

So look at a category where nobody is a person.

We asked, in German, which accounting software German startups use. Two separate engines named Lexware Office, a German product. We asked the identical question in English. Not one engine named it.

We asked, in English, which HR software Berlin startups use. Two engines named HeavenHR. We asked in German. None did.

These are the two clearest cases in the Berlin data. Named by multiple independent engines in one language. Named by nothing in the other. No personal names involved anywhere.

What a German business should take from this

If your customers are German, and you are checking your AI visibility in English because the tool you use only works that way, you are reading a report about a different market.

In four of eleven comparisons here, the German and English answers had no company in common. That is not a worse ranking. It is a different contest with different entrants.

The direction of the asymmetry decides who should care most. A large firm with an English-language site, English press coverage and international directory listings appeared in the English answers and often not in the German ones. A small practice with a German-only web presence appeared in the German answers and not the English ones.

Whichever of those you are, you are invisible in exactly the half you are not looking at.

Honest limits

One run, one day, four categories, four engines, one city. Enough to show the effect is real and large in Berlin. Not enough to tell you the size of your own gap.

German is also the language in this study where our name extraction had the hardest time, because German answers name people, use titles, and build compound words that a pattern matcher handles worse than it handles "Hilton". Some of that 88.5% is extraction difficulty rather than genuine divergence. Not most of it, though: the two software cases involve no personal names at all, and they are as clean as this gets.

The way to know your own number is not to trust ours. Ask both versions of your own question, of at least three engines, on the same day, and compare the two lists yourself.

Full study, with the category tables: https://getbrandgeo.com/bg-028.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-028

The cross-city result this is part of: https://getbrandgeo.com/bg-027.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-028

If you would rather check your own brand than take our word for it, the test is free and needs no signup: https://getbrandgeo.com/?utm_source=linkedin&utm_medium=article&utm_campaign=bg-028#free-audit

---

## Subheads to bold after pasting

What we did · What we removed before counting · The obvious objection, and why it does not hold · What a German business should take from this · Honest limits

## Verification notes

Every figure and every company name is taken from `brandgeo/web/bg-028.html`.
Nothing was recalculated. "Six days after this run" is arithmetic from the two
dates the article states, 10 July and 16 July 2026. "Schlun und Elseven" is
written out rather than with an ampersand because LinkedIn's composer has
mangled ampersands in pasted text before; either form is factually correct.
