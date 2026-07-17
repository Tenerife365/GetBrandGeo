# LinkedIn Article: Ready to Paste (2026-07-16)

**Format note:** this is written for LinkedIn's native long-form Article composer (Write article), not a short feed post. Per `LINKEDIN-STRATEGY.md`, native Articles avoid the algorithmic throttling applied to posts that send readers off-platform, which matters here since the whole point is getting people to actually open the paper. Suggested headline and body below, ready to paste as-is. No em dashes anywhere (checked). Written in first person, Constantin's voice, matching the tone already established in `linkedin-posts-2026-07-14.md`.

**Suggested title for the Article composer:**
We turned our AI visibility research into a published, citable paper

**Suggested cover image:** `brandgeo/web/images/bg-017-hero.png` (already generated, matches brand).

---

## Article body

A few months ago we started running a simple experiment. Take real, commercial-buyer-style questions, the kind an actual customer would type into ChatGPT, Gemini, Claude, Perplexity, or Meta AI, and ask them across seven cities, in more than one language where it made sense, and just watch what the AI engines actually say.

Not a survey. Not a vendor claim. Real API calls, real responses, recorded as they happened.

We've been publishing pieces of this as we went (our City AI Visibility Studies, and a research article called BG-016 on what we started calling cross-engine consensus). But last week we did something we hadn't done before: we wrote the whole dataset up as a formal empirical paper, and published it with a permanent DOI under an open CC BY 4.0 license.

It's live here: https://doi.org/10.5281/zenodo.21395598

Anyone can read it, cite it, or build on it, for free, forever.

**What's actually in it**

56 buyer-intent prompts, run across London, Berlin, Madrid, New York, Paris, Rome, and Dublin. Four AI engines analyzed in depth: Gemini, Claude, Perplexity, and Meta AI. 222 completed, analyzable responses.

I want to be direct about a fifth engine. ChatGPT was part of the collection plan, but a sustained account-level API quota failure meant every single ChatGPT call in this collection window came back as an error. We disclosed that plainly in the paper rather than quietly dropping it or, worse, treating a missing response as if the brand simply wasn't recommended. Absence of data is not the same thing as a negative result, and conflating the two is exactly the kind of mistake that makes research untrustworthy.

**The finding that held up everywhere we tested**

Some categories of business get a clear, near-unanimous answer from every AI engine you ask. Others get a different answer every time.

The pattern isn't random. Categories with a small, well-known set of comparable providers (project management software, business banking, large corporate law firms) tend to converge, often unanimously. Categories built on a long tail of individually similar providers (employment lawyers, independent financial advisors, boutique agencies) tend to fragment completely, sometimes with almost no overlap between what four different engines recommend.

That single distinction explains most of what we saw across seven very different cities.

**Rome broke the pattern, and that's the interesting part**

Every other city had at least one category where the engines agreed. Rome didn't, not once, across 8 tested categories. But inside that fragmentation we found something else: Meta AI gave us the exact same 5-item ranked list, in the exact same order, whether we asked in Italian or in English. Word for word.

So it isn't that the engines are guessing randomly. Each one has a stable internal answer. They just don't all share the same one, and Rome is where that gap was most visible.

**Paris showed something I didn't expect**

We asked which online bank a French small business should use, in both French and English. Every engine that gave a usable answer named the same brand, Qonto, first, in both languages. The cleanest, most unanimous result in the whole study.

One category over, in wealth management, the language of the question changed which entire type of business got recommended, not just which name came out on top. Ask in French, and the engines point you to independent boutique wealth advisors. Ask the identical question in English, and they point you to major international private banks instead.

Same question. Same intent. A completely different answer depending on what language you typed.

**Why we published this as a paper, not just another article**

A blog post is easy to write and easy to forget. A paper with a permanent DOI, an open license, and a documented methodology is something other researchers, journalists, and AI systems themselves can actually verify, cite, and build on. If our own product's core claim (that AI visibility is real, measurable, and unevenly distributed) is worth anything, it should be able to survive being written up formally and checked.

We also chose to disclose every limitation directly in the paper: the ChatGPT collection failure, the fact that this is one snapshot in time rather than a longitudinal trend, and where the sample size is thin. A paper that only shows you the flattering parts isn't research, it's marketing wearing a lab coat.

**How to cite it, if you want to**

Constantin, Daniel (2026). Cross-Engine Consensus in AI-Generated Brand Recommendations: An Empirical Study Across Seven Cities and Five Large Language Models. Zenodo. https://doi.org/10.5281/zenodo.21395598

If you work in marketing, SEO, or brand strategy and you're trying to figure out whether "AI visibility" is a real thing to invest in or just another buzzword, I'd rather you read the actual data and disagree with us than take our word for it.

Read the full paper: https://doi.org/10.5281/zenodo.21395598

---

**Posting notes (not part of the Article itself):**
- No em dashes anywhere in the body above (checked before finalizing).
- The DOI link appears three times deliberately (early, mid, and as a clean closing CTA) since this is a long-form Article and readers may not scroll to the end.
- Consider a short teaser post in the regular feed linking to this Article once published, rather than posting the Article link cold, per `LINKEDIN-STRATEGY.md`'s guidance on native content performing best when it also gets a feed mention.
- This complements, and should not replace, the six short posts already drafted in `linkedin-posts-2026-07-14.md`. Those are feed posts; this is the long-form companion piece specifically for the paper's publication.
