# BG-033 / Asset 02 — LinkedIn Article

**Channel:** BrandGEO company page, native Article composer ("Write article")
**When:** Wednesday 2026-09-16, morning slot
**Cover image:** `docs/growth/og-cards/cards/og-bg-033.png`, also live at
`https://getbrandgeo.com/images/og/og-bg-033.png`. It is 1200x630 and LinkedIn's
Article cover target is 1920x1080, so expect about 7% cropped off the width.
Check the preview for text near the edges before publishing.

**Suggested title:**
How to Check Whether AI Recommends Your Brand in Your Customers' Language

**Alternative titles:**
- The Ten Minute Test That Shows Whether AI Recommends You Abroad
- Ask AI Twice, in Two Languages, and Compare the Two Lists

**Paste note:** LinkedIn's Article composer does not read markdown. Bold the
subheads by hand after pasting.

---

## Article body

We measured this properly across four European cities and found that 82.1% of the companies AI engines named appeared in only one of the two languages we asked in. The obvious follow up question is what your own number looks like. You do not need us to find that out. Here is the method, and more usefully, the ways of getting it wrong.

Write the question your buyer actually types

Not your brand name. This is the single most common mistake, and it invalidates everything that follows.

Asking "what do you know about Acme GmbH" tests whether the engine has heard of you. Almost anything with a website clears that bar, and the answer feels great. Asking "beste Arbeitsrechtsanwälte in Berlin" tests whether the engine recommends you to somebody who has never heard of you, which is the only thing worth measuring.

Good buyer questions share three properties: a category, a place or qualifier, and no brand name. Best boutique hotels in central Madrid. Which HR software do Berlin startups use. Meilleurs conseillers en gestion de patrimoine à Paris. All three are real prompts from our study.

Translate it as literally as the languages allow

The point is to change one variable. If the English version says "best" and the German version says "most recommended," you have changed two things, and you will not know which one moved the answer.

Where a literal translation would be unnatural, prefer the phrasing a native speaker would actually type, and note that you did. A prompt nobody would ever write tests nothing.

Ask both versions, same day, at least three engines

Same day matters, because these systems change. Three engines matters more than most people expect: in our study, one engine produced five separate comparisons in which the two languages shared no company at all. If that had been your only engine, you would have concluded something dramatic from what is partly one engine's own behaviour.

Use a fresh conversation for each question. A follow up question inside an existing chat inherits everything above it, including your previous prompt's language and any brand you have already mentioned.

Write down the lists, not the impression

Two columns, one per language, every company named, in order. This is the step people skip, and it is where the finding actually lives. "It mentioned us in both" is an impression. "We were fourth in German and absent in English, and the English list was four international firms we have never competed with" is a finding you can act on.

Then ask three questions of the two columns. Are you in both? If you are in one, the other is a market you are invisible in. Are the two lists even the same industry? In our Paris data, the French list was independent advisors and the English list was global private banks. Those are not two rankings, they are two categories. Who is in both? Those are the competitors who have solved this, and their sites are worth looking at.

The three mistakes that produce a wrong conclusion

Mistake one is reading a single run as a measurement. One answer on one day is an anecdote. These systems are not deterministic, and asking the same engine the same question twice can produce different lists. A gap that appears once might be noise. A gap that appears across three engines is not. This is exactly why our own study reports 46 comparisons rather than a highlight.

Mistake two is counting a blank answer as a zero. If an engine returns an error, a refusal, or a paragraph with no companies in it, that is not evidence you are invisible. It is a missing measurement. In our study, ChatGPT errored on all 32 prompts on the collection day, and we excluded it entirely rather than report zeros, which would have looked like a dramatic finding and meant nothing.

Mistake three is assuming the local language is automatically the one that matters. It usually is, but check who buys. A Rome hotel selling mainly to international visitors should care more about the English answer. A Berlin employment lawyer should care almost entirely about the German one. The right question is not which language is bigger, it is which language your revenue speaks.

What to do with a gap once you find one

The instinct is to translate the website, and that is necessary but not usually sufficient on its own. Our follow up piece covers what actually seems to move the needle: whether the second language pages exist as real indexable URLs, whether structured data exists in that language, whether your own name is written consistently everywhere, and whether anything other than your own site describes you in the second language, which is the part most companies have never touched.

Honest limits, before you go run this yourself

One run, one day, four categories, four engines, one city, in the version we published for Berlin. Enough to show an effect is real and large. Not enough to tell you the size of your own gap. German is also the language in our study where name extraction had the hardest time, because German answers name people, use titles, and build compound words that a pattern matcher handles worse than it handles a single word brand. Some of the divergence we measured is extraction difficulty rather than genuine absence. Not most of it, though: the clean software cases in our data involve no personal names at all, and those are as solid as this method gets.

The way to know your own number is not to trust ours. Ask both versions of your own question, of at least three engines, on the same day, and compare the two lists yourself.

Full study, with the category tables: https://getbrandgeo.com/bg-033.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-033

The cross city result this is part of, 486 companies across four cities: https://getbrandgeo.com/bg-027.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-033

If you would rather check your own brand than take our word for it, the test is free and needs no signup: https://getbrandgeo.com/?utm_source=linkedin&utm_medium=article&utm_campaign=bg-033#free-audit

---

## Subheads to bold after pasting

Write the question your buyer actually types · Translate it as literally as the languages allow · Ask both versions, same day, at least three engines · Write down the lists, not the impression · The three mistakes that produce a wrong conclusion · What to do with a gap once you find one · Honest limits, before you go run this yourself

## Verification notes

Every figure, prompt example, and named mistake is taken from
`brandgeo/web/bg-033.html`: the 82.1% headline figure, the four step method, the
"one engine produced five comparisons sharing zero companies" detail, the three
named mistakes, and the honest limits paragraph about German name extraction
being the hardest in the study. Nothing was recalculated. The Paris example
(independent advisors versus global private banks) and the "46 comparisons"
figure are both stated in the source article. The three French/German prompt
examples are quoted directly.

Judgement call: the source article's "Honest limits" section is folded in near
the end here rather than placed immediately after the three mistakes, since the
mistakes section already carries most of that caution, and closing on limits
plus a call to run the test yourself reads better as an ending than a middle
section on a native LinkedIn Article, which has no callout boxes to set it
apart visually.
