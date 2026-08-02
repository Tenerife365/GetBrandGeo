# BG-031 / Asset 02 — LinkedIn Article

**Channel:** BrandGEO company page, native Article composer ("Write article")
**When:** Wednesday 2026-09-02, morning slot
**Cover image:** `docs/growth/og-cards/cards/og-bg-031.png`. It is 1200x630 and
LinkedIn's cover target is 1920x1080, so expect about 7% cropped off the width.
Check the preview for text near the edges.

**Suggested title:**
In Italian, AI Recommends the Trattoria. In English, It Recommends the Three-Star.

**Alternative titles:**
- Rome's AI answers split by language: the trattoria versus the tasting menu
- The one Rome category where the AI language gap nearly vanished

**Paste note:** LinkedIn's Article composer does not read markdown. Bold the
subheads by hand after pasting.

---

## Article body

We asked four AI engines a question a concierge in Rome answers a dozen times a week: where should I eat for a business dinner.

We asked it twice. Once in Italian. Once in English. Same day, same engines, same city, nothing changed except the language.

The Italian answers named Trapizzino, Supplizio, Osteria Fratelli Mori, Glass Hostaria, Alla Bottega Trattoria de Santis, Orma Roma and Ristorante Amedeo.

The English answers named La Pergola, Salumeria Roscioli, Pierluigi, Dal Bolognese, Enoteca la Torre, Aroma Restaurant and Il Metropolitan.

Five names appeared on both lists: Il Convivio, Il Pagliaccio, La Campana, La Gensola and La Rosetta. Everything else split along a line that reads almost editorial. Italian returned the places a Roman might actually book. English returned the places an international visitor has already read about.

What we did

Rome was one of four European cities in a bilingual study we ran on 10 July 2026. Four commercial categories per city, each asked twice, once in the local language and once in English. Four engines answered: Claude, Gemini, Perplexity and Meta AI.

Two disclosures, the same as every piece in this series. ChatGPT returned an API error on all 32 prompts that day, so it is absent from this data rather than recorded as a zero. Meta AI was retired from our own product six days after this run, and its answers stay in the dataset, because removing a measurement to match a later product decision would falsify the record. Gemini's answers were also frequently unparseable for company names in Rome specifically, a point we return to under honest limits below.

Company names were extracted by pattern matching and then filtered by hand. This is a single snapshot from one day, not a trend line, and a name appearing here means an engine printed it on that day, not that the business is good or bad.

Rome landed in the middle of the four cities: 18.0% overlap between the Italian and English answers, and 81.2% of the 133 companies named appeared in only one language. The aggregate is unremarkable next to Berlin's 8.9%. The individual categories are not.

Hotels: three independents English never mentioned

Boutique hotels near the historic centre produced the sharpest named case in the Rome data. Hotel Raphael, Nerva Boutique Hotel and Singer Palace Hotel were each named by two separate engines in Italian and by none in English. In the other direction, G-Rough was named by two engines in English and by none in Italian.

The Italian-only list also included Villa Spalletti Trivelli, JK Place Roma, Hotel Vilòn, Otivm Hotel and Lifestyle Suites Rome. The English-only list included The St. Regis Rome, Portrait Roma, Casa Monti, Margutta 19 and Hotel Artemide.

The exception, and what it teaches

One comparison in Rome came close to full agreement. In real estate agencies, Perplexity named ten companies in Italian and ten in English, and nine of them were the same. It is the single highest-agreement engine and category pair in the entire four-city study.

That is worth more attention than the divergences, because it shows the split is not inevitable. A category where the same firms are documented consistently in both languages, in this case a real estate market with strong national franchise networks and a heavily indexed listings ecosystem, produces one answer rather than two. Tecnocasa was named twice in Italian only and Immobiliare.it twice in English only, but the bulk of the list held steady.

What a Rome business should take from this

The language gap is not a fixed tax on operating in Italian. It is widest where a category is made of independents documented mainly in their own language, restaurants and boutique hotels among them, and narrows to almost nothing where the same firms are described consistently in both languages, as the real estate case shows.

If your restaurant, hotel or practice has a strong web presence in only one language, you are not missing a few extra mentions. You are absent from half the answer entirely, and it is the half you are least likely to be checking, because you read your own site and your own reviews in the language you operate in, not the one you are invisible in.

What we removed before counting

TheFork was removed from the restaurant lists as a booking platform rather than a restaurant. Roman landmarks and districts (Colosseo, Piazza di Spagna, Foro di Augusto, Monti, Prati, Centro Storico) were removed. Street addresses that the extractor picked up as names, several of them in the Italian answers, were removed. Italian navigation fragments such as "Contatti" and "Indirizzo" were removed. Two hotels appeared in the restaurant answers because an engine was recommending their dining rooms; those were kept, since a hotel restaurant is a real answer to the question.

Honest limits

One run on 10 July 2026, four categories, four engines, ChatGPT absent because it errored on every prompt. Gemini produced parseable names in only two of eight Rome prompts, so this comparison leans on Claude, Perplexity and Meta AI. Meta AI has since been retired from the product; its answers stay in because the measurement was real on the day it was taken.

The way to know your own number is not to trust ours. Ask both versions of your own question, of at least three engines, on the same day, and compare the two lists yourself.

Full study, with the category tables: https://getbrandgeo.com/bg-031.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-031

The cross-city result this is part of: https://getbrandgeo.com/bg-027.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-031

Which engine changes its answer most between languages, and why the ranking is not the point: https://getbrandgeo.com/bg-032.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-031

If you would rather check your own brand than take our word for it, the test is free and needs no signup: https://getbrandgeo.com/?utm_source=linkedin&utm_medium=article&utm_campaign=bg-031#free-audit

---

## Subheads to bold after pasting

What we did · Hotels: three independents English never mentioned · The exception, and what it teaches · What a Rome business should take from this · What we removed before counting · Honest limits

## Verification notes

Every figure and every company name is taken from `brandgeo/web/bg-031.html`.
Nothing was recalculated. "Six days after this run" is arithmetic from the two
dates the article states, 10 July and 16 July 2026. The seven Italian and
seven English restaurant names, the five shared names, the three Italian-only
hotels, G-Rough, the Italian-only and English-only hotel lists, the real
estate exception with Tecnocasa and Immobiliare.it, and the "what was removed"
list are all reproduced as stated in the source article.
