# Generates sidecars for: instagram/feed, instagram/stories, instagram/reels
#
# Feed and Reels sidecars are CAPTION then a blank line then HASHTAGS, which is
# the single paste into the caption box. POSTS.md keeps them as separate blocks
# so the hashtags can be moved to a first comment instead; that is a posting
# choice and the first-comment URL and the alt text stay in POSTS.md, since
# each goes into a different field.
#
# A story has no caption box. The one thing pasted is the link sticker URL, so
# that is what the story sidecars hold. The headline is already drawn on the
# frame and the hashtag sticker is optional, per instagram/stories/POSTS.md.

from _common import write

F = "instagram/feed/"
S = "instagram/stories/"
R = "instagram/reels/"


def reel(stem, body):
    """The same caption sits beside both masters of one cut."""
    write(R + stem + "-silent.txt", body)
    write(R + stem + "-scored.txt", body)


# ------------------------------------------------------ feed posts

# Post 1 is a 4 slide carousel. The caption sits beside slide 1, the slide
# uploaded first and the one the post is read from. Slides 2 to 4 are pages of
# the same post and carry no caption of their own.
write(F + "feed-01-invented-name-s1.txt", """
Two AI engines returned the same firm name for a firm that does not exist.

It happened in Chicago corporate law on 24 July 2026. Then the identical invented name came back in Boston, in a different category, from the same two engines. Both runs fired five engines. All five returned usable data. Neither run had a collection error.

Fair reading of it: two of the five produced the name and the other three did not. So this is a property of some engines on thin, fragmented categories rather than a property of engines in general, and a lot of professional services sit in exactly those categories.

The part worth taking away is not the invented name. It is the near miss. An engine that will assemble a firm which does not exist will also assemble a merged version of two real companies, a slightly wrong legal suffix, or a trading name you dropped years ago. Those look correct at a glance, which is what makes them expensive.

We ask ChatGPT, Claude, Gemini, Perplexity and Google AI Mode the same buyer questions on a schedule and keep what comes back, so a wrong name has somewhere to be counted.

Link in bio.

#AIVisibility #AIHallucination #GenerativeEngineOptimization #AISearch #BrandMonitoring #LegalMarketing #ProfessionalServices #AEO #DataQuality
""")

write(F + "feed-02-converge-fragment.txt", """
Property management reached 5 of 5 AI engines in Boston. Real estate agents reached 2 of 5.

Same city, same day, same five engines, same method. Houston ran the same six categories and split the same way: property management at 4 of 5, real estate agents at 2 of 5.

Our explanation for the split is a hypothesis and not a measured cause. Companies have documentation. Individuals have listings. A property management company has a site, a services page, reviews, coverage, and a name that resolves to one entity. An individual agent has a profile on a portal and a phone number, and plenty of them share overlapping names. An engine assembling an answer needs something it can be confident about, and one of those two gives it far more to work with.

The limit, stated plainly: two cities, six categories in each, one collection pass, collected 24 July 2026. That is a pattern worth testing, not a law.

If your category looks like the second one, the default answer has not settled yet. That is a different plan from trying to displace one that has.

Link in bio.

#AIVisibility #AISearch #GenerativeEngineOptimization #LocalSEO #PropertyManagement #RealEstateMarketing #MarketResearch #AEO #CrossEngineConsensus
""")

write(F + "feed-03-first-and-absent.txt", """
One brand was the top answer on several AI engines and had zero mentions on another.

Same brand. The same 20 real customer questions. Run identically. Published 2 July 2026.

To be clear about what this is not: it is not an argument that search rankings stopped mattering. They still matter, and the pages that earn them are the same pages an engine reads when it assembles an answer. That foundation is necessary. It is just not sufficient on its own.

The difference is the unit being measured. A results page tells you where you sit among ten links the buyer still has to work through. A generated answer names a handful of options and the buyer works through nothing else. A strong number in one does not carry across into the other.

One admission, since the figure is ours: that audit ran on an engine lineup which is not the lineup we run today, so we publish no engine count beside it. The finding does not need one. A brand can be first in some answers and absent from another, and that is as true at three engines as at any number.

Link in bio.

#SEO #GenerativeEngineOptimization #AIVisibility #AISearch #SearchMarketing #AEO #LLMSEO #TechnicalSEO #ContentStrategy
""")

write(F + "feed-04-one-prompt-five-engines.txt", """
One buyer prompt, fired at five AI engines on the same day, and all five named the same company.

The prompt was "Top-rated property management companies in Chicago", collected 24 July 2026. ChatGPT ranked it first. Claude ranked it first. Perplexity second. Gemini fourth. Google AI Mode surfaced it by name.

What the run does not show is agreement on rank. The engines agree the company belongs in the answer and then place it anywhere from first to fourth. Presence and position are two separate measurements and this run settles only the first.

Convergence like that is a result about the category, not a trophy for the company. Five engines landing on one name means the category holds enough public, comparable material for them to agree. Other categories in the same city, on the same day, came back with almost no overlap between engines at all.

The honest caveat on reproducing it: these systems are not deterministic, so an identical prompt tomorrow can return different ranks. That is the argument for keeping a record over time instead of treating one screenshot as the answer, and it is why the collection date is on the card.

Link in bio.

#AIVisibility #AISearch #GenerativeEngineOptimization #ChatGPTSearch #PerplexityAI #GoogleAIMode #PropertyManagement #OpenResearch #AEO
""")

# --------------------------------------------------------- stories

write(S + "story-01-invented-name.txt", "https://getbrandgeo.com/ai-visibility-for-chicago.html")
write(S + "story-02-converge-fragment.txt", "https://getbrandgeo.com/ai-visibility-for-boston.html")
write(S + "story-03-first-and-absent.txt", "https://getbrandgeo.com/bg-004.html")
write(S + "story-04-one-prompt-five-engines.txt", "https://getbrandgeo.com/ai-visibility-for-chicago.html")

# ----------------------------------------------------------- reels

reel("20260729-2200-instagram", """
There is no analytics event for an answer you were left out of.

A search engine sends a visit, so it leaves a row in your report. A generated answer is read on the engine's own screen. The buyer sees a short list of names, picks one, and the brands that were not named produce no session, no referrer, no bounce, nothing to look at later.

That is the part worth sitting with. Not that traffic fell, but that the report was complete and the loss was still invisible inside it.

We ask ChatGPT, Gemini, Claude, Perplexity and Google AI Mode the same buyer questions on a schedule and keep what comes back, so the thing that leaves no row has somewhere to be counted.

Link in bio.

#AIVisibility #GenerativeEngineOptimization #ZeroClickSearch #AISearch #AnswerEngineOptimization #MarketingAnalytics #AttributionGap #LLMSEO #BrandStrategy
""")

reel("20260729-2318-instagram", """
A default answer is self reinforcing, and that is the uncomfortable part.

An engine assembles its answer out of what already exists about a brand. Coverage, comparisons, mentions on pages it treats as reliable. A brand that gets named tends to get written about, and being written about is the raw material for getting named again.

Concession where it belongs: this is not permanent, and it does not hold the same way across categories. Some categories have settled on one small set of names. Others hand back a different answer on the same day from the same engine. Which of those you are in changes the entire plan, and it is checkable rather than a matter of opinion.

We check it across ChatGPT, Gemini, Claude, Perplexity and Google AI Mode.

Link in bio.

#AIVisibility #GenerativeEngineOptimization #AISearch #ShareOfModel #BrandPositioning #CompetitiveIntelligence #AEO #LLMSEO #CategoryStrategy
""")

reel("20260730-0013-instagram", """
Companies have documentation. Individuals have listings.

That is the explanation we would offer for the split in this cut, and it is a hypothesis rather than a measured cause. A property management company has a site, a services page, reviews, coverage, and a stable name that resolves to one entity. An individual agent has a profile on a portal and a phone number, and many of them share overlapping names.

An engine assembling an answer needs something it can be confident about. One of those two gives it far more to work with.

The limit, stated plainly: two cities, six categories in each, one collection pass. That is a pattern worth testing, not a law. Both cities ran at ChatGPT, Gemini, Claude, Perplexity and Google AI Mode, and the tables are published category by category.

Link in bio.

#AIVisibility #AISearch #GenerativeEngineOptimization #LocalSEO #PropertyManagement #RealEstateMarketing #MarketResearch #AEO #CrossEngineConsensus
""")

reel("20260730-0113-instagram", """
To be clear about what this is not: it is not an argument that search rankings stopped mattering.

They still matter, and the pages that earn them are the same pages an engine reads when it assembles an answer. That foundation is necessary. It is just not sufficient on its own.

The difference is the unit being measured. A results page tells you where you sit among ten links the buyer still has to work through. A generated answer names a handful of options and the buyer works through nothing else. Those are two different measurements, and a strong number in one does not carry across into the other.

In the audit this cut is drawn from, 20 real buyer questions were run identically across engines. The same brand came back as the top recommendation on several of them, and did not appear at all on another.

Link in bio.

#SEO #GenerativeEngineOptimization #AIVisibility #AISearch #SearchMarketing #AEO #LLMSEO #TechnicalSEO #ContentStrategy
""")

reel("20260730-0216-instagram", """
Convergence like that is a result about the category, not a trophy for the company.

Five engines landing on one name means the category holds enough public, comparable material for them to agree. In the same city, on the same day, other categories in that run came back with almost no overlap between engines at all.

The honest caveat on reproducing it: these systems are not deterministic. Run the identical prompt tomorrow and the ranks can move. That is the argument for keeping a record over time rather than treating one screenshot as the answer, and it is why the collection date sits on screen at all.

The prompt, the engines, the ranks and the date are published in full, so checking it does not depend on trusting us.

Link in bio.

#AIVisibility #AISearch #GenerativeEngineOptimization #ChatGPTSearch #PerplexityAI #GoogleAIMode #PropertyManagement #OpenResearch #AEO
""")

reel("20260730-0313-instagram", """
Three things to look for once the answer comes back, because the check is easy and reading it is not.

One. Whether you are named at all. That is the blunt version, and on its own it tells you little.

Two. The sentence attached to your name. An engine writes a line about you, assembled from pages you did not write. Being described badly and being absent are different problems with different fixes.

Three. Who else is in there. The names above yours are the set your buyer is choosing between, and that set is usually more useful to you than your own position in it.

Then run the same question on a second engine. If the two answers disagree, that is a finding in itself, and it is easy to miss when you check once and stop.

Link in bio.

#AIVisibility #AISearch #GenerativeEngineOptimization #SmallBusinessMarketing #MarketingTips #AEO #ChatGPTSearch #PerplexityAI #LocalMarketing
""")

reel("20260730-0413-instagram", """
Absence in a log is not absence in the world. That distinction is the whole post.

Analytics is an arrivals record. It is honest about what it covers and silent about what it does not, and the silence looks identical whether nothing happened or something happened somewhere the log cannot reach.

A generated answer is one of those places. It is written on the engine's surface, read there, and acted on there. If your name was left out of it, the outcome is a buyer who went elsewhere and a report that looks exactly like a quiet week.

The fix is not a cleverer reading of the report. It is a second record, taken where the answers are actually produced. We ask ChatGPT, Gemini, Claude, Perplexity and Google AI Mode the same buyer questions on a schedule and keep what comes back.

Link in bio.

#AIVisibility #ZeroClickSearch #MarketingAnalytics #GenerativeEngineOptimization #AISearch #AttributionGap #DarkFunnel #AEO #DemandGeneration
""")

reel("20260730-0513-instagram", """
The lever on that sentence is mostly not your own website, which is the part that stings.

The line an engine writes about you is assembled from sources it can compare against each other. Your homepage is one of them, and it is the source with an obvious motive of its own, so it tends to carry less weight than a review, a comparison page, a directory entry, or a thread where someone described you in their own words.

Which means rewriting your hero copy moves that sentence slowly, and getting described accurately in the places engines read moves it faster.

Practical version: search for yourself the way a stranger would, read the sentence that comes back, and work out where each part of it came from. Some of it will trace to a page you have not looked at in two years.

We read the wording, not just the mention.

Link in bio.

#AIVisibility #BrandReputation #GenerativeEngineOptimization #AISearch #BrandNarrative #OnlineReputationManagement #AEO #LLMSEO #BrandMonitoring
""")

reel("20260730-0613-instagram", """
The reading that matters here is the one about your own name, not about the invented one.

An engine that will assemble a firm name which does not exist will also assemble a near miss of one that does. A merged version of two companies. A slightly wrong legal suffix. An old trading name you dropped years ago. Those are much harder to catch than an outright fiction, because they look correct at a glance.

Fair reading of the run: two of the five engines produced the invented name, in both cities. The other three did not. So the finding is narrower than it looks. It is a property of some engines on thin, fragmented categories, which happens to be where a lot of professional services sit.

Both runs collected 24 July 2026. Five engines fired, five returned usable data, no collection errors. The tables are on the city pages.

Link in bio.

#AIVisibility #AIHallucination #GenerativeEngineOptimization #AISearch #BrandMonitoring #LegalMarketing #ProfessionalServices #AEO #DataQuality
""")

print("gen_instagram: done")
