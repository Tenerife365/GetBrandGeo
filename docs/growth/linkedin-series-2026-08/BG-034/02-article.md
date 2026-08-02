# BG-034 / Asset 02 — LinkedIn Article

**Channel:** BrandGEO company page, native Article composer ("Write article")
**When:** Wednesday 2026-09-23, morning slot
**Cover image:** `docs/growth/og-cards/cards/og-bg-034.png`, also live at
`https://getbrandgeo.com/images/og/og-bg-034.png`. It is 1200x630 and LinkedIn's
Article cover target is 1920x1080, so expect about 7% cropped off the width.
Check the preview for text near the edges before publishing.

**Suggested title:**
The Multilingual AI Visibility Checklist: Nine Things That Decide Whether an Engine Can Answer About You Twice

**Alternative titles:**
- Nine Things That Decide Whether AI Can Answer About You in a Second Language
- The One Category Where Both Languages Agreed, and What It Was Doing Right

**Paste note:** LinkedIn's Article composer does not read markdown. Bold the
subheads by hand after pasting.

---

## Article body

Across four European cities, our bilingual study found that 82.1% of the companies AI engines named appeared in only one of the two languages we asked in. It also found one category, Rome real estate agencies through Perplexity, where 9 of 10 names matched across both languages.

That exception is the useful part. Whatever is different about a market where both languages produce the same answer is the thing worth copying. What was different: those firms are documented consistently in both languages, by sources other than themselves, under names that do not change.

That decomposes into a checklist. It is ordered by effort against plausible effect, so if you stop a third of the way down, you will have done the part that matters most.

A word on certainty, before the list

Nobody outside the engine vendors knows the actual weights here, and anyone handing you a ranked list of AI ranking factors with confident percentages is inventing them. What follows is ordered by reasoning from what we measured, plus ordinary technical hygiene. Items one to four are things whose absence demonstrably prevents an engine from having the information at all. Items five to nine are progressively more speculative, and are labelled as such below.

The four that remove a blocker

The second language pages must actually be indexable pages. Not a JavaScript language switcher that rewrites the same URL. Not a cookie. Not a browser language redirect that sends every crawler to one version. If example.com/de/ does not exist as a fetchable URL returning German content to a plain HTTP request, then for retrieval purposes your German site does not exist. This is the most common failure and the most complete one: everything below is irrelevant until it is fixed. Test it by fetching the URL without a browser. If you get the English page, a redirect loop, or an empty shell that needs JavaScript to populate, you have found your problem.

Declare the pair with hreflang. Reciprocal hreflang tags, each language pointing at the others and at itself, plus x-default. This does not add a signal so much as remove an ambiguity: it says these two pages are the same content in two languages, rather than duplicates or unrelated pages. It is an afternoon of work and there is no argument for skipping it.

Put the structured data in the language of the page. A German page carrying JSON-LD whose description, name and areaServed fields are in English is describing itself to machines in a language its readers do not use. If you publish Organization, LocalBusiness, Product or FAQPage data, publish it per language, alongside the page it describes. While you are in there, validate it. On our own site we found three FAQPage blocks that had been silently invalid for weeks because of one missing brace, which meant they were being dropped entirely rather than misread. Invalid structured data fails quietly, which is the worst way for anything to fail.

Write your own name the same way everywhere. One canonical spelling, in every language, on every page, in your structured data, in your directory listings. Our own study produced a clean example of what inconsistency does: "Only You Boutique Hotel" and "Only YOU Boutique Hotel Madrid" came back as two separate strings from the same run, and any automated system counting mentions counts those twice or matches neither. If your legal name, your trading name and your domain differ, pick the one customers use, lead with it consistently, and mention the others once on an about page rather than alternating between them.

The five that are more speculative

Get described in the second language by something that is not you. This is the item that most plausibly explains our Rome exception, and it is the hardest. Every firm in that converged list was documented by third parties in both languages: national franchise networks, listings platforms, local press. Your own translated site is one source saying one thing twice. A local trade publication, a national directory, a partner's site, or an industry association writing about you in the second language is a different source, and diversity of source is what a retrieval system is built to reward. We cannot prove this from our data. We can say that the one category that converged had it, and the ones that diverged mostly did not.

Answer the buyer question, in the buyer's words, on a page. The prompts that drove this study were category questions: best boutique hotels in central Madrid, which HR software Berlin startups use. If you have a page that answers that exact question in that exact language, an engine has something to retrieve. If your German site has a services page and your English site has a detailed guide, expect the English answer to be better informed.

Do not machine translate and leave it. Translated text that no native speaker has read tends to use the wrong terms of art, and terms of art are what buyer questions are made of. A German employment law page that says "Arbeitsrecht Anwalt" where the market says "Fachanwalt für Arbeitsrecht" is answering a question nobody asks. This costs money and is worth it for the two or three pages that carry your actual commercial intent.

Keep the same facts in both languages. Different opening hours, a different address format, a stale price on the version you update less often. Any system reconciling sources now has a conflict about you, and the cheapest resolution is to trust neither. Pick a single source for facts and generate both language versions from it if you can.

Measure both languages separately, on a schedule. Last on this list because it changes nothing on its own, and first in importance for everything else here, because without it you are guessing which items mattered. A single measurement tells you where you stand. A repeated one tells you whether anything you did worked, and that is the only way any of the eight items above stop being a matter of opinion.

If you only do three

Items one, three and four. Indexable second language URLs, structured data in the page's own language, and one consistent spelling of your own name. All three are cheap, none require a rebuild, and each one removes a way for an engine to fail to know something about you, rather than merely failing to prefer you.

What this checklist will not do

It will not make the two answers identical, and it should not. Our Madrid data showed a category converging because international chains dominate it, and our Paris data showed French independents owning the French answer while global banks owned the English one. Some of that split is a real feature of the markets, not a defect in anyone's website.

The goal is not one answer in two languages. It is to be present in the answer your customers are actually reading, and to know which one that is.

Full checklist with the Rome data: https://getbrandgeo.com/bg-034.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-034

How to measure your own gap first, in about ten minutes: https://getbrandgeo.com/bg-033.html?utm_source=linkedin&utm_medium=article&utm_campaign=bg-034

If you would rather see your own gap than take our word for it, the test is free and needs no signup: https://getbrandgeo.com/?utm_source=linkedin&utm_medium=article&utm_campaign=bg-034#free-audit

---

## Subheads to bold after pasting

A word on certainty, before the list · The four that remove a blocker · The five that are more speculative · If you only do three · What this checklist will not do

## Verification notes

Every figure, example, and item description is taken from
`brandgeo/web/bg-034.html`: the 82.1% headline figure, the Rome real estate
through Perplexity exception (9 of 10 names matching), all nine checklist
items in the article's own order and wording, the three silently invalid
FAQPage blocks, the "Only You Boutique Hotel" naming example, the "Arbeitsrecht
Anwalt" versus "Fachanwalt für Arbeitsrecht" example, the "if you only do
three" callout (items 1, 3, 4), and the closing Madrid and Paris examples of
markets that should not converge. Nothing was recalculated.
