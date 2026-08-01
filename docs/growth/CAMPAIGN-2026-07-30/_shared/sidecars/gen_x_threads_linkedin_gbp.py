# Generates sidecars for: x/, threads/, linkedin/, google-business-profile/
# Copy is transcribed verbatim from each channel's POSTS.md. check_pairing.py
# re-verifies every paragraph against that POSTS.md independently.

from _common import write, unwrap, unquote

# ---------------------------------------------------------------- X

X = "x/images/"

write(X + "x-thread-a-firm-that-does-not-exist-1600x900.txt", """
Two of the five AI engines we ran returned the same law firm name. That firm does not exist. Chicago, corporate law, collected 24 July 2026. All five engines returned usable data on every prompt, no collection errors.
""")

write(X + "x-thread-a-firm-that-does-not-exist-1600x900-p2.txt", """
It was not a typo. Both engines took a real firm and swapped one of the names in it for a name from somewhere else. What comes back reads like a firm you could look up and instruct. There is no such firm.
""")

write(X + "x-thread-a-firm-that-does-not-exist-1600x900-p3.txt", """
Then it happened again. Boston, same collection date, a different category: biotech and life sciences law. Same invented name. Same two engines, ChatGPT and Gemini. Again five engines fired and five returned usable data.
""")

write(X + "x-thread-a-firm-that-does-not-exist-1600x900-p4.txt", """
We left it in the published dataset instead of correcting it. Two engines producing the identical error independently, in two cities, in two categories, is the finding. Cleaning it up would have deleted it.
""")

write(X + "x-thread-a-firm-that-does-not-exist-1600x900-p5.txt", """
The other three engines did not produce that name. So this is not a fact about AI answers in general. It is a fact about some engines, in categories built from a long tail of similar local firms.
""")

write(X + "x-thread-a-firm-that-does-not-exist-1600x900-p6.txt", """
The invented firm is the easy case, because you can check that it does not exist. The hard case is the near miss: your name merged with another, a trading name you dropped, a wrong legal suffix. Those read as correct.
""")

write(X + "x-thread-a-firm-that-does-not-exist-1600x900-p7.txt", """
Both runs are published with their prompts and their per-engine results. If you want to know which version of your own name is coming back, that is a thing you can check. getbrandgeo.com
""")

write(X + "x-thread-b-language-picked-the-shortlist-1600x900.txt", """
We asked one question twice, in French and in English: best wealth management advisors in Paris. What came back was not the same list reordered. It was a different set of firms. Paris, collected 10 July 2026.
""")

write(X + "x-thread-b-language-picked-the-shortlist-1600x900-p2.txt", """
The French answers named independent boutique French firms. The English answers named large international private banks. Same city, same category, same day. The language of the question is what changed, and nothing else did.
""")

write(X + "x-thread-b-language-picked-the-shortlist-1600x900-p3.txt", """
One boutique firm appeared in three of the four French-language answers and in zero of the English ones. Four answers per language, one from each engine that responded that day.
""")

write(X + "x-thread-b-language-picked-the-shortlist-1600x900-p4.txt", """
The limit, stated plainly. Four engines ran on 10 July 2026. ChatGPT's collection failed on every Paris prompt, and one of the four that did run has since been retired from our lineup. There is no engine consensus figure here and we are not offering one.
""")

write(X + "x-thread-b-language-picked-the-shortlist-1600x900-p5.txt", """
What survives that limit is the shape of the result. A firm that publishes only in French was not ranked lower in the English answers. It was not in them at all.
""")

write(X + "x-thread-b-language-picked-the-shortlist-1600x900-p6.txt", """
If you sell in more than one language, AI visibility is not one number. It is one number per language, and the two can disagree about who your competitors are.
""")

write(X + "x-thread-b-language-picked-the-shortlist-1600x900-p7.txt", """
The Paris run is published with its prompts, its per-language answers, and the ChatGPT failure disclosed on the page rather than dropped. Worth checking your own category in both languages. getbrandgeo.com
""")

write(X + "x-standalone-1-one-question-five-engines-1600x900.txt", """
One buyer question, five AI engines, 24 July 2026: "Top-rated property management companies in Chicago". One company came back from all five. ChatGPT 1st, Claude 1st, Perplexity 2nd, Gemini 4th, Google AI Mode named it without ranking it. getbrandgeo.com
""")

write(X + "x-standalone-2-what-a-five-of-five-counts-1600x900.txt", """
A 5 of 5 in an AI visibility report can mean five engines agreed. In our own Rome run, 10 July 2026, it means one engine returned five names, in two languages. Ask what the 5 counts before you read it as consensus. getbrandgeo.com
""")

# ---------------------------------------------------------- Threads

T = "threads/images/"

write(T + "threads-1-companies-converge-1080x1350.txt", """
Here's a pattern that turned up in two cities on the same day, and it changes what AI visibility work is worth in a given category.

We ran six buyer categories in Boston and six in Houston on 24 July 2026, five engines each: ChatGPT, Claude, Gemini, Perplexity and Google AI Mode. Property management converged hard. One company was named by all five engines in Boston, and two companies were named by four of the five in Houston.
""")

write(T + "threads-1-companies-converge-1080x1350-p2.txt", """
Then we asked the same engines "Best real estate agents for buying a home in Boston", and the Houston equivalent. No individual agent's name got past a loose match across two of the five, in either city.

Companies converge. Individuals fragment. Before you decide whether AI visibility is worth your time, it's worth knowing which side of that line your category already sits on.
""")

write(T + "threads-2-an-emoji-changed-the-score-1080x1350.txt", """
An emoji changed one of our clients' scores, and it took us five rounds of bug fixes to get to it.
""")

write(T + "threads-2-an-emoji-changed-the-score-1080x1350-p2.txt", """
Two AI answers, functionally the same: the brand named as the top recommendation, praised in the line right underneath. One answer put a medal emoji in front of the heading, the other didn't. Before we fixed it, the first scored rank 1 and positive sentiment, the second scored no rank at all and neutral. Our position detection counted the characters between the start of a line and the rank digit to decide whether that line was a ranked list item, and the emoji ate the budget.
""")

write(T + "threads-2-an-emoji-changed-the-score-1080x1350-p3.txt", """
After the fifth false positive in six weeks, adding a sixth rule stopped feeling like the right instinct. So we wrote all five up instead, and put a regression suite behind them.
""")

write(T + "threads-3-the-near-miss-1080x1350.txt", """
Two of the five engines we ran returned a law firm name that does not exist. Chicago, corporate law, 24 July 2026. Then the identical invented name came back in Boston, in a different category, from the same two engines, on the same collection date.

We left it in the published data. Two engines making the same mistake independently, in two cities, is more interesting than a tidy table.
""")

write(T + "threads-3-the-near-miss-1080x1350-p2.txt", """
The invented firm isn't really the risk though. You can check whether a firm exists. What's harder to catch is the near miss: your company name merged with another one, a trading name you dropped years ago, a wrong legal suffix. Those look right at a glance, and they're what reaches a buyer with your name attached.

Worth checking which version of yours is coming back.
""")

write(T + "threads-4-an-empty-field-1080x1350.txt", """
We took a fallback out of our own scoring in July and the product got quieter on purpose.

If an AI answer says "here are the top three, in order", that's a rank. If it says "here are a few good options" and then bullets them, it isn't one. To a parser counting bullet points those two look identical, and our older scorer treated them identically. It also treated a brand mentioned in the third sentence as rank 3, which isn't a rank at all, it's a position in a paragraph.
""")

write(T + "threads-4-an-empty-field-1080x1350-p2.txt", """
Now a number only appears when the engine actually claimed one. Otherwise the field is empty.

An empty field is uncomfortable to put in front of a customer. It's still better than a number that can't be traced back to anything.
""")

# --------------------------------------------------------- LinkedIn

L = "linkedin/"

LI1 = unwrap("""
Two AI engines returned the same law firm name. The firm does not exist.

Chicago, collected 2026-07-24. Six commercial categories, five engines: ChatGPT,
Gemini, Claude, Perplexity and Google AI Mode. All five returned usable data on
every prompt, so the denominator is genuinely five.

In corporate law, ChatGPT and Gemini each returned a real firm's name with one
word swapped. A plausible name with no firm behind it, produced by two engines
independently.

Then it repeated. Boston, same collection date, same five engines, a different
category, biotech and life sciences law. Same two engines, same name that does
not exist.

We kept it as reported rather than quietly correcting it. Correcting it would
have been tidier and would have deleted the finding.

The limit, in the same breath as the result: two cities, one collection date. We
have not re-run it, so we cannot say whether the error is stable over weeks.

We are not naming the firm. The finding does not need it.

If you are checking whether AI engines mention your brand, that is half the
question. The other half is whether they get it right. An absence is quiet. A
confident misspelling is not, and it reaches a buyer looking like a fact.

We monitor seven engines today. That run predates two of them.

Source: BrandGEO City Research Program, Chicago and Boston datasets, 6
categories each, 5 engines, collected 2026-07-24.
getbrandgeo.com/ai-visibility-for-chicago.html
""")

LI2 = unwrap("""
One prompt, asked in French and then in English. The answers were not the same
firms in a different order. They were different firms.

Paris, collected 2026-07-10. Four categories, each asked once in French and once
in English.

In wealth management, the French-language answers named independent boutique
French firms. The English-language answers named major international private
banks. One boutique firm appeared in three of the four French-language responses
and in none of the four English ones.

That is not a ranking change. The considered set changed.

The denominator, stated with the finding: four engines returned usable data on
that run. ChatGPT's collection failed on every Paris prompt, a technical error,
and we recorded it on the page rather than dropping it. One of the four engines
in that run has since been retired from our lineup. So the four is a fact about
2026-07-10, not a description of what we run now.

The practical consequence, if you sell in more than one language: a visibility
check in one language tells you very little about the other. You are not looking
at a translated version of the same shortlist. You are looking at a different
shortlist, drawn from a different pool, and the way to find out which one you are
on is to ask in both.

Source: BrandGEO City Research Program, Paris dataset, 4 categories asked in
French and English, 4 engines returning usable data, collected 2026-07-10.
getbrandgeo.com/ai-visibility-for-paris.html
""")

LI3 = unwrap("""
Three of our own research pages, all built from the same day's collection, each
claim to hold a record across the whole program. At most one can be right.

Madrid, Paris and Dublin, all collected 2026-07-10. Each page describes its own
headline result as the peak of the research program to date. Madrid's claim and
Paris's claim are directly incompatible.

We found it with a scanner written for a marketing campaign rather than through
a reader complaint, which is the uncomfortable part.

A scan of all 27 city pages, run 2026-07-30, found a claim of that shape on 16
of them.

The cause is structural rather than careless. Each page is written from inside
its own dataset. A claim about every other page in the corpus is the one claim
the page making it is not in a position to check.

None of the underlying tables are affected. Those are measurements and they
stand. What is coming out is the ranking sentence sitting on top of them, because
a ranking claim ages the moment a new city is collected, and it was never
checkable from where it sat.

Two of the last research pieces we published were about mistakes in our own
scoring code. This one is a mistake in our own writing.

If you are comparing vendors in this category, the useful question is not whether
the numbers look impressive. It is whether the page you are reading is in a
position to check the claim it is making.

Source: BrandGEO City Research Program, Madrid, Paris and Dublin datasets,
collected 2026-07-10. Corpus scan of 27 city pages run 2026-07-30.
""")

LI4 = unwrap("""
A result in our Rome data looks like five engines agreeing. It is one engine
agreeing with itself.

Rome, collected 2026-07-10. Four categories, each asked once in Italian and once
in English, four engines returning usable data.

For the business-dinner restaurant prompt, one engine named the same five
restaurants, in the same order, in both languages. Not a stable top pick with the
rest shuffled. A fully reproduced ranked list, twice.

Read quickly, that is a five out of five. Read properly, the five counts
restaurants inside one engine's answer. It is not a count of engines. No other
engine returned that list, and the other three each returned their own, different
set.

Stability and consensus are two different readings. Stability is one engine
repeating itself, which tells you that engine's answer is fixed for now.
Consensus is separate engines arriving at the same name, which is the reading
that tells you a category has converged. A single figure can be either, and the
label rarely says which.

The limits, in the same paragraph as the finding: one collection date, one city,
four categories. ChatGPT's collection failed on every Rome prompt that run, which
is why the count is four. The engine that produced the repeated list has since
been retired from our lineup, so this is a record of that day rather than a live
claim.

Ask any figure what its numerator and its denominator count. Ours included.

Source: BrandGEO City Research Program, Rome dataset, 4 categories asked in
Italian and English, 4 engines returning usable data, collected 2026-07-10.
getbrandgeo.com/ai-visibility-for-rome.html
""")

write(L + "feed/li-01-same-wrong-name-1200x1200.txt", LI1)
write(L + "feed/li-02-language-picked-the-list-1080x1350.txt", LI2)
write(L + "feed/li-03-pages-contradict-1200x1200.txt", LI3)
# Post 4 has two alternate media, the 8-slide carousel and this square fallback.
# Same post, so the same caption sits beside both. Never post both.
write(L + "feed/li-04-what-five-of-five-counts-1200x1200.txt", LI4)
write(L + "carousel/li-c-01-1080x1350.txt", LI4)

# ------------------------------------------ Google Business Profile

G = "google-business-profile/"

write(G + "gbp-1-free-audit-1200x900.txt", unquote("""
> BrandGEO checks whether AI engines name your brand when a customer asks about
> your category. The free audit puts your domain to five engines, ChatGPT,
> Gemini, Claude, Perplexity and Google AI Mode, and returns a score with a
> breakdown per engine. It takes under a minute and asks for no card. What you
> get back is one snapshot: one day, one set of questions. That is enough to see
> whether you are named at all. If you are not in the answer, that is your
> result. Not a lower rank. Absent. The audit is free and the plan behind it
> starts at EUR 0. Run it at getbrandgeo.com.
"""))

write(G + "gbp-2-essentials-1200x900.txt", unquote("""
> Essentials is EUR 99 a month. It monitors ChatGPT, Gemini and Claude against
> 15 of your own buyer questions, refreshed weekly, and keeps every answer it
> collects. The paid tier is not a bigger number on day one. A single audit
> gives you a point. A weekly record gives you a direction, which is what tells
> you whether something you changed moved anything. The free plan stays
> free: one engine, five questions, refreshed monthly. Move up when the snapshot
> has told you what it can. Pick a plan at getbrandgeo.com.
"""))

write(G + "gbp-3-growth-pro-1200x900.txt", unquote("""
> Growth PRO is EUR 449 a month and monitors seven engines: ChatGPT, Gemini,
> Claude, Perplexity, Google AI Mode, Grok and Google AI Overviews. Grok and
> Google AI Overviews went live on 29 July 2026. Google AI Mode and Google AI
> Overviews are two different products. One is a tab a person opts into. The
> other is the summary block on an ordinary results page. Growth, at EUR 299 a
> month, covers five of them. If your customers reach you through ordinary
> Google results, that is the difference between the two tiers. Compare them at
> getbrandgeo.com.
"""))

write(G + "gbp-4-plan-ladder-1200x900.txt", unquote("""
> For every answer an engine gives, BrandGEO records four things: whether your
> brand was named, where it sat in the list, what the answer said about you, and
> which competitors appeared alongside you. Engines do not have to agree. Each
> writes its own version, and your customer reads one of them. You are not sent
> a copy. Plans run from Free at EUR 0 through Essentials at EUR 99, Growth at
> EUR 299 and Growth PRO at EUR 449, up to Managed from EUR 1,500, which is the
> done-for-you tier. Start on the free plan at getbrandgeo.com.
"""))

print("gen_x_threads_linkedin_gbp: done")
