# Generates sidecars for: facebook/feed, facebook/link, facebook/video, tiktok
#
# The Facebook bodies in POSTS.md are hard wrapped at 78 columns because that
# is a markdown file. A sidecar is pasted into a composer, where those breaks
# would be real line breaks, so unwrap() collapses them back to spaces.
# Paragraph breaks are kept. No word is changed.
#
# Alt text stays in POSTS.md: it goes in a different field.

from _common import write, unwrap

FF = "facebook/feed/"
FL = "facebook/link/"
FV = "facebook/video/"
TT = "tiktok/video/"


def fbvideo(stem, body):
    """The same body sits beside both masters of one cut."""
    text = unwrap(body)
    write(FV + stem + "-silent.txt", text)
    write(FV + stem + "-scored.txt", text)


def tiktok(stem, caption):
    write(TT + stem + "-silent.txt", caption)
    write(TT + stem + "-scored.txt", caption)


# ------------------------------------------------- facebook / feed

write(FF + "fb-feed-01-description-1440x1800.txt", unwrap("""
An AI can name your company and still describe it wrong.

The sentence sitting next to your name is assembled by the engine out of
material it can match to you. Your own pages, directories, review sites, press,
old forum threads. Anything thin or years out of date in that pile is material
the answer gets built out of.

It is also why the engines disagree with each other. They read different
sources and weight them differently, so each one writes its own version, and
there is no single description to go and correct.

Being listed and being described accurately are two separate results. Worth
knowing which one you have before a buyer reads it for you.

getbrandgeo.com
"""))

write(FF + "fb-feed-02-language-split-1440x1800.txt", unwrap("""
We put one question to AI twice in Madrid, once in Spanish and once in English.

Hotels near Madrid-Barajas, one collection day, 10 July 2026. One engine gave a
full, real answer in English and nothing usable in Spanish. Another engine did
the exact reverse on the identical prompt: a real answer in Spanish, nothing in
English.

There is no engine count on that finding, deliberately. A further engine failed
to collect on every Madrid prompt in that run, and the page reports it as a data
gap rather than folding it into a result.

If you sell in more than one language, a clean result in one of them is weak
evidence about the other.

https://getbrandgeo.com/ai-visibility-for-madrid.html
"""))

write(FF + "fb-feed-03-placement-1440x1800.txt", unwrap("""
On 24 July 2026, five AI engines named the same company. Two agreed on the rank.

The question was "Top-rated property management companies in Chicago". ChatGPT
first, Claude first, Perplexity second, Gemini fourth, and Google AI Mode
surfaced the company by name without giving it a position at all.

The Gemini row is the useful one. A rank tracker hands you a single number to
defend. This run handed back five separate answers, and being present in them
is a different question from being placed in them.

All five returned usable data on every prompt in that run. The other five
questions from the same run are on the page.

https://getbrandgeo.com/ai-visibility-for-chicago.html
"""))

write(FF + "fb-feed-04-rank-vs-answer-1440x1800.txt", unwrap("""
A brand sitting on page one of Google appeared zero times in one AI engine's
answers.

We audited it in July 2026 against twenty real customer questions, identical
across every engine we put them to. It came back as the number one
recommendation on three of them, consistently across the majority of the twenty
though not on every single one. On one engine it did not appear at all.

The part worth reading is that the business had no way to notice. The rankings
were fine, so the reporting said everything was fine.

A rank tracker measures a position in a list of links. It has no view of whether
a company gets named inside a generated answer at all.

https://getbrandgeo.com/bg-004.html
"""))

# ------------------------------------------------- facebook / link

write(FL + "fb-link-01-description-1200x630.txt", unwrap("""
An AI answer gives you two results, and the second one is the one your buyer
reads.

The first is whether you were named. The second is how you were described. An
engine can list you and frame you as the budget option, or the one for small
jobs, and that sentence arrives with your name attached to it.

You can get a rough version of this yourself in a few minutes. Type the question
a customer would actually ask, then read past your own name to the sentence
beside it.

The audit on our homepage runs that across the engines we monitor and keeps the
wording, so you can tell whether it moved.

getbrandgeo.com
"""))

write(FL + "fb-link-02-madrid-1200x630.txt", unwrap("""
Two languages, one prompt, and the answers pointed in opposite directions.

Madrid, hotels near the airport, collected 10 July 2026. One engine answered
fully in English and returned nothing usable in Spanish. Another engine did the
exact reverse on the identical question.

We are not attaching an engine count to that. A further engine failed to collect
on every Madrid prompt in that run, and the page calls it a data gap rather than
quietly reporting on what was left.

If your buyers ask in more than one language, those are closer to two separate
markets than to one market with a translation layer.

https://getbrandgeo.com/ai-visibility-for-madrid.html
"""))

write(FL + "fb-link-03-chicago-1200x630.txt", unwrap("""
On 24 July 2026, five AI engines returned the same company for one question.

Chicago, property management. First on ChatGPT, first on Claude, second on
Perplexity, fourth on Gemini, and named by Google AI Mode with no position given
at all.

The fourth-place row is the one that makes the rest of it worth trusting. An edit
made to persuade would have dropped it and shown only the ones that agreed.

There is no single position to hold across five answers. Presence and placement
turn out to be different questions, and only one of them has an equivalent in a
rank tracker.

https://getbrandgeo.com/ai-visibility-for-chicago.html
"""))

write(FL + "fb-link-04-bg004-1200x630.txt", unwrap("""
Page one on Google predicted nothing about whether one AI engine would name the
brand at all.

We put twenty real customer questions to a brand that reaches page one without
trying hard, in July 2026, identical questions across every engine. It came back
as the number one recommendation on three of them, across the majority of the
twenty though not on every single one. On one engine it did not appear anywhere.

Neither measurement replaces the other, and a good result in one is not evidence
about the other. That argument is smaller and more boring than "search is
finished", which is why it holds up.

https://getbrandgeo.com/bg-004.html
"""))

# ------------------------------------------------ facebook / video

fbvideo("20260729-2200-facebook", """
Your analytics reports the people who arrived. It has nothing to say about the
ones who asked an AI, read a short answer with two or three businesses named in
it, and went with one of them. There is no bounce to look at and no session to
attribute. The decision was made before your website was involved at all.

That is a reporting gap rather than a traffic problem, which is why it can sit
there for months without anything looking wrong.

The useful part is that the answer itself is readable. You can put the question
your customers ask to an AI engine yourself and see what comes back. BrandGEO
does it on a schedule across ChatGPT, Gemini, Claude, Perplexity and Google AI
Mode and keeps the record, so you can tell whether anything moved.

getbrandgeo.com
""")

fbvideo("20260729-2318-facebook", """
A name gets repeated by an AI because the engine can find the same facts about
that business in more than one source it trusts. Consistent description, a clear
category, other people saying the same thing about it. That is a different job
from buying attention, which is why the name in the answer does not track
advertising spend.

It also means the position is not permanent. It moves when the material the
engines are reading changes.

The starting point is knowing whose name comes back today rather than guessing.
BrandGEO puts your buyers' questions to ChatGPT, Gemini, Claude, Perplexity and
Google AI Mode and writes down who gets named.

getbrandgeo.com
""")

fbvideo("20260730-0013-facebook", """
The two categories were hospital systems and real estate agents. Same city, same
day, 24 July 2026, both put to ChatGPT, Claude, Gemini, Google AI Mode and
Perplexity.

For hospital systems, all five engines named the same two organisations. For
real estate agents, not one name repeated across any two engines.

Those two results ask opposite things of a business. Where a category has
converged, getting into the answer means being documented better than whoever is
already in it. Where it has not converged, there is no incumbent to displace yet,
which is the cheaper position to be starting from.

The full Philadelphia run is published with all six questions and every engine:

https://getbrandgeo.com/ai-visibility-for-philadelphia.html
""")

fbvideo("20260730-0113-facebook", """
What makes that audit worth reading is not the gap itself. It is that the
business had no way to notice it. Their rankings were fine, so their reporting
said everything was fine.

A rank tracker measures a position in a list of links. It has no view of whether
a company gets named inside a generated answer, because that answer is a
different artefact built by a different system from different signals.

So the two have to be watched separately. Neither replaces the other, and a good
result in one is not evidence about the other. That is the whole argument, and it
is smaller and more boring than "search is finished", which is why it holds up.

The full audit is published, including the exact questions we put to each engine:

https://getbrandgeo.com/bg-004.html
""")

fbvideo("20260730-0216-facebook", """
Worth sitting with the shape of that result. The engines did not agree on the
order. First, first, second, fourth, and one that surfaced the company by name
without giving it a position at all. What they agreed on was the name.

That is the part a rank tracker has no equivalent for. There is no single
position to hold. There are five separate answers, and being present in them is
a different question from being placed in them.

The limits are on the page as well: one city, one question, one collection run.
A real result, not a trend.

Every prompt, every engine response and the data-quality notes from that run:

https://getbrandgeo.com/ai-visibility-for-chicago.html
""")

fbvideo("20260730-0313-facebook", """
Two things to add once you have run it.

First, read past whether you were named. Read how you were described. An engine
can list you and still frame you as the budget option or the one for small jobs,
and that sentence reaches the buyer with your name attached to it.

Second, ask more than one engine. On 24 July 2026 we put a real buying question
about real estate agents to five engines in Denver, and not one name repeated
across any two of them. Checking a single engine would have suggested that
category was already settled. It was not.

The full Denver run, with all six questions and every engine:

https://getbrandgeo.com/ai-visibility-for-denver.html
""")

fbvideo("20260730-0413-facebook", """
The fair objection is that these answers are probably close to random, in which
case there is no shortlist worth the name and nothing to act on.

So we measured it. On 24 July 2026 we ran six real buying questions through
ChatGPT, Claude, Gemini, Google AI Mode and Perplexity in Washington DC. On the
lobbying and government relations question, two firms were named by all five
engines, and four of the five put them in the same rank order.

Five independent systems, one question, one settled answer with an order to it.
Other categories in the same run stayed wide open, which is the other half of
the finding and the reason it is worth checking your own.

https://getbrandgeo.com/ai-visibility-for-washingtondc.html
""")

fbvideo("20260730-0513-facebook", """
That sentence is not invented from nothing. An engine assembles it from material
it can find and match to your company: your own pages, directories, review
sites, press, forum threads, whatever it can read. Anything thin or years out of
date in that pile is material the answer gets built out of.

It is also why the engines disagree with each other. They read different sources
and weight them differently, so each one writes its own version and there is no
single description to go and correct.

BrandGEO puts your buyers' questions to ChatGPT, Gemini, Claude, Perplexity and
Google AI Mode and records the wording that comes back, not only whether you
appear in it.

getbrandgeo.com
""")

fbvideo("20260730-0613-facebook", """
Madrid was a coverage problem. Paris, tested the same day, was something else.

Asked in French about wealth management advisors, the engines named independent
local firms. Asked in English, they named large international private banks. Not
the same list reordered by language. A different set of companies. One firm that showed up
repeatedly in the French answers was missing from the English ones altogether.

So if you sell in more than one language, a clean result in one of them is weak
evidence about the other. They behave like separate markets because the engines
are reading separate sources for each.

Both runs are published, collected 10 July 2026:

https://getbrandgeo.com/ai-visibility-for-madrid.html
https://getbrandgeo.com/ai-visibility-for-paris.html
""")

# ---------------------------------------------------------- tiktok

tiktok("20260729-2200-tiktok", "Your analytics are not broken. They were built before this. #AISearch #GEO")
tiktok("20260729-2318-tiktok", "You hear about this from a lost deal, not a dashboard. #AIVisibility #GEO")
tiktok("20260730-0013-tiktok", "Ask whether your category settled, not whether AI matters. #GEO #AISearch")
tiktok("20260730-0113-tiktok", "Two measurements. The tool you already pay for reports one. #SEO #GEO")
tiktok("20260730-0216-tiktok", "Real prompt, real placements, published with the date on. #AISearch #GEO")
tiktok("20260730-0313-tiktok", "Free today. Do it again next month. That gap is the product. #GEO #AISearch")
tiktok("20260730-0413-tiktok", "No tracking tag fires inside someone else's answer. #Attribution #GEO")
tiktok("20260730-0513-tiktok", "Getting named is the easy half. Getting it right is the rest. #AISearch #GEO")
tiktok("20260730-0613-tiktok", "Publish in one language, sit on one shortlist. #GEO #AISearch #Paris")

print("gen_facebook_tiktok: done")
