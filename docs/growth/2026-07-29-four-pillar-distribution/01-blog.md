# 01. Blog: four SEO articles, one per pillar

**Run:** 2026-07-29 four-pillar distribution.
**Channel:** Blog / website, matrix row 1.
**Funnel stage:** MOFU for all four. CTA is the free audit on `getbrandgeo.com`.
No price appears in any body copy, per the funnel rule in `00-BRIEF.md`.
**Scope:** this file only. Nothing here has been written into `brandgeo/web/`.

Each article is a commercial-intent piece that USES a research page to answer a
question a buyer is actually searching. None of them restate the source page.
The source pages report what was measured. These tell a buyer what to do with
that. Every one links back to its source so the measurement stays checkable.

**Slugs are provisional.** `bg-021` is taken. `bg-web` assigns the next free
numbers at publish time and fills every `PLACEHOLDER_ISO_DATE`, final URL and
hero image path before shipping.

### JSON-LD validation

All twelve blocks below (four articles, three blocks each) were extracted from
this file and parsed with `json.loads` on 2026-07-29. **12 of 12 parsed. 0
errors.** Re-run the same parse after `bg-web` converts these to HTML: the three
live `FAQPage` failures on Baltimore, Charlotte and Detroit were introduced at
that conversion step, not in the draft.

### Marked unverified

- **`00-BRIEF.md` says "the 37 city pages".** A directory count of
  `brandgeo/web/ai-visibility-for-*.html` on 2026-07-29 returns 38 files, of
  which 10 are industry pages and one is the Index issue, leaving **27 city
  pages**. `CLAUDE.md` also says 27. The count 37 is `[UNVERIFIED]` and is not
  used in any article. Article 2 refers to the city research corpus without
  attaching a number to it.
- **Publication dates.** Every `datePublished` is a placeholder. `[UNVERIFIED]`
  until `bg-web` sets them.
- No article publishes a Grok or Google AI Overviews mention rate, per
  prohibition 1. Both engines are described as live and collecting only.
- No article attributes any `ai_results` row to a named brand, per prohibition 2.
  No article uses the word "up from" or "improving" about any engine, per
  prohibition 3. Every number in every article traces to a published `bg-*` page
  or to the Zenodo record.

---
---

# Article 1 (P1)

**Pillar:** P1, two engines shipped and two turned down.
**Source:** `brandgeo/web/bg-021-retrieval-not-engine-count.html`.
**Funnel:** MOFU. **Hook driver:** Contrarian.
**Provisional slug:** `bg-0XX-two-tools-different-numbers`
**Target query cluster:** "AI visibility tools give different results", "why do
AI visibility tools disagree", "how to compare AI visibility tools", "AI search
monitoring tool comparison".
**Distinct from the existing P1 package** at
`docs/growth/2026-07-29-grok-sixth-engine/01-blog.md`, which is a supply-side
announcement of what we shipped and declined. This one is a buyer-side
reconciliation procedure for someone who is trialling two vendors at once and
has two different numbers on the desk. Different reader, different job.
**Word count:** 1,412.

---

## Two AI Visibility Tools, Same Brand, Same Week, Different Numbers

If you are trialling two AI visibility tools side by side, there is a good
chance you are looking at two different answers for the same brand, collected in
the same week, and wondering which one is lying.

Usually neither is. They measured different things and both called it AI
visibility. The gap is almost always traceable, and it is almost never explained
by the number both vendors put at the top of their pricing page.

Here is how to find it.

### Engine count is the wrong first question

The instinct is to assume the tool with more engines is measuring more. Five
engines, seven, twelve. It is the easiest number in this category to raise, and
it tells you close to nothing about whether either report is any good.

Two tools can both claim seven engines and produce genuinely different scores
for your brand because of what happened inside each of those seven queries. Four
things cause most of the gap. Work through them in order, because the first one
explains more disagreement than the other three put together.

### Cause one: one of them answered from memory

A language model with no retrieval enabled answers from its training data. Ask
it which firms do commercial catering in a given city and you get a confident,
fluent, well formatted list of what was true at some point before its training
cutoff.

That produces a clean number and a picture of the past. A business that launched
this year is invisible to it. A competitor that shut down two years ago may
still sit at position three. And the failure is silent: nothing in the output
says "this answer came from memory". It reads exactly like the engines that went
and looked.

So the gap between your two reports may not be a disagreement about your brand
at all. It may be one tool reporting this week and the other reporting a
snapshot of some earlier year, in the same column, under the same heading.

The question to put to both vendors is narrower than it sounds. Not "does that
model support web search". Was search switched on, in your pipeline, for the run
that produced my report. Those are different claims and only the second one is
worth anything.

This is the standard we applied to ourselves before we applied it to anyone
else. BrandGEO retired Meta AI on 16 July 2026 because the models we could reach
in that path ran training data only. Removing it lowered our engine count, and
we did it anyway. The same reasoning keeps DeepSeek out. The full reasoning,
including why Copilot is absent, is in
[BG-021](https://getbrandgeo.com/bg-021-retrieval-not-engine-count.html).

### Cause two: you are comparing two different Googles

This one is specific and it accounts for a surprising share of unexplained
variance between two reports.

Google runs two separate AI surfaces and they are not the same product.

**Google AI Mode** is a tab. The searcher has to switch to it deliberately. The
people using it opted in.

**Google AI Overviews** is the AI summary block that appears by default at the top
of an ordinary results page. Nobody opts in. It is simply there, above the links,
on a very large share of ordinary searches.

Different reach, and often different answers to the identical question. If tool A
measures AI Mode and reports it in a column labelled "Google", and tool B
measures AI Overviews and reports it in a column labelled "Google", the two
reports will disagree and both will look internally consistent. Neither column
tells you what the other one saw.

BrandGEO measures both, separately, from Growth PRO upward. AI Mode has been
monitored since 16 July 2026 and AI Overviews since 29 July 2026. We keep them
apart because they disagree often enough that averaging them would hide the
thing you actually need to know, which is whether an AI summary appears above
the links at all for the questions your customers ask.

That last point inverts how a measurement is normally read, so it is worth
stating plainly. When Google renders no AI Overview for a query, we record that
as a result, not as a failed collection. An absent summary is a finding, and
often a more useful one than your position inside a summary that does appear.

### Cause three: an engine on the pricing page that has never returned a row

Coverage claimed and coverage delivered are different columns, and only one of
them is on the pricing page.

An engine can sit in a feature list for months without ever writing a row
against your account. Quota failures, an API path that silently degrades, a
provider that never got wired up for your plan. The report still renders. The
engine still appears in the legend. It simply contributes nothing, and a score
averaged across engines quietly becomes a score averaged across fewer engines.

Ask both vendors the same thing: for my account specifically, which engines in
your list have never returned a result, and on what dates did each one last
collect. A vendor that cannot answer that per account is not in a position to
tell you what its own score is made of.

This failure is not hypothetical and it is not unique to any one vendor. Our own
published paper had to exclude an entire engine over exactly this shape: 56
ChatGPT rows came back as recorded API errors during a sustained account level
quota failure in the collection window, so ChatGPT was excluded from the
analysis rather than have its absence read as a finding about ChatGPT. That is
disclosed on page one of the
[record](https://doi.org/10.5281/zenodo.21395598), not in a footnote.

### Cause four: the two runs are not from the same week

AI engines do not return a stable answer forever. If one tool collected on
Monday and the other on the following Thursday, some of the delta is real
movement in the world rather than a difference in method.

BrandGEO refreshes weekly on every paid plan, monthly on Free. Refresh cadence
is not something we sell as a tier upgrade, and it is worth checking whether the
other tool on your desk treats it that way. When you compare two reports, line
up the collection timestamps first. If they are more than a few days apart, some
of the gap is not a methodology question at all.

### The reconciliation, in order

Do this before you conclude that either tool is wrong.

1. **Line up the timestamps.** Same prompt, same market, collection dates within
   a few days of each other. If not, stop and re-run both.
2. **Line up the engine lists,** then strike out every engine that appears in
   only one of the two. Compare only the overlap.
3. **For every engine in that overlap, ask both vendors whether retrieval was on
   for that run.** Any engine where the answer differs is not a disagreement
   about your brand and should be pulled out of the comparison entirely.
4. **Split the Google column** into AI Mode and AI Overviews on both sides. If
   either vendor cannot split it, you now know something specific about that
   report.
5. **Read what is left.** Whatever gap survives all four steps is a real
   methodological difference worth a conversation, and it is usually small.

Most of the time the reconciliation ends at step three.

### The version of this that does not favour us

This argument stops working for us the moment a competitor runs eight engines
with retrieval on across both Google surfaces. That is fine. It is the correct
standard even when it costs us the comparison, and it is one we have already
applied twice against our own interest, by retiring an engine we had shipped and
by declining a cheap one we could have added this month.

Engine count is the easiest number in this category to move and the least
informative. Ask what was switched on.

**CTA block for `bg-web`:**

> Run the free audit on your own domain and compare it against whatever else is
> on your desk. We will show you which engines returned a result, which did not,
> and when each one last looked.
> [Start the free audit](https://getbrandgeo.com)

### JSON-LD, Article 1

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Two AI Visibility Tools, Same Brand, Same Week, Different Numbers",
  "description": "Two AI visibility tools will often report different scores for the same brand in the same week. Four causes explain most of the gap: retrieval disabled on one engine, Google AI Mode compared against Google AI Overviews, engines that never returned a row for the account, and mismatched collection dates. A five step reconciliation procedure for buyers trialling two vendors.",
  "image": "https://getbrandgeo.com/images/bg-0XX-two-tools-hero.png",
  "author": {
    "@type": "Organization",
    "name": "BrandGEO",
    "url": "https://getbrandgeo.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "BrandGEO",
    "logo": {
      "@type": "ImageObject",
      "url": "https://getbrandgeo.com/logo.png"
    }
  },
  "datePublished": "PLACEHOLDER_ISO_DATE",
  "dateModified": "PLACEHOLDER_ISO_DATE",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://getbrandgeo.com/bg-0XX-two-tools-different-numbers.html"
  },
  "articleSection": "AI Visibility Research",
  "keywords": "AI visibility tools, generative engine optimization, Google AI Overviews, Google AI Mode, retrieval, AI search monitoring, tool comparison",
  "citation": {
    "@type": "CreativeWork",
    "name": "We Shipped Two AI Engines Today. The More Useful Story Is the Two We Turned Down.",
    "url": "https://getbrandgeo.com/bg-021-retrieval-not-engine-count.html"
  }
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why do two AI visibility tools report different scores for the same brand?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Four causes explain most of the gap. One tool may have queried an engine with retrieval disabled, so it answered from training data rather than the live web. The two tools may be measuring different Google surfaces, AI Mode against AI Overviews, and reporting both under a single Google column. One tool may list an engine that has never returned a result for that specific account. And the two collection runs may be days or weeks apart, in which case part of the difference is real movement rather than method."
      }
    },
    {
      "@type": "Question",
      "name": "What is the difference between Google AI Mode and Google AI Overviews?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "They are two separate Google products. AI Mode is a tab the searcher switches to deliberately. AI Overviews is the AI summary block shown by default at the top of an ordinary results page, which reaches far more searchers because nobody opts in. They frequently return different answers to the same question, so reporting only one of them under the label Google hides the surface most people see. BrandGEO measures both separately from Growth PRO upward."
      }
    },
    {
      "@type": "Question",
      "name": "Does a higher engine count mean a better AI visibility tool?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Engine count is the easiest figure in this category to raise and among the least informative. An engine queried without web search enabled answers from its training data, which produces a confident and fluent picture of the past rather than a measurement of the present. The useful question is whether retrieval was switched on in the vendor's pipeline for the run that produced the report, not whether the underlying model is capable of search."
      }
    },
    {
      "@type": "Question",
      "name": "How should I compare two AI visibility reports fairly?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Line up the collection timestamps first and re-run if they are more than a few days apart. Compare only the engines that appear in both tools. For each of those, confirm with both vendors whether retrieval was enabled for that run and remove any engine where the answers differ. Split the Google column into AI Mode and AI Overviews on both sides. Whatever gap survives all four steps is a real methodological difference and it is usually small."
      }
    },
    {
      "@type": "Question",
      "name": "What does it mean when Google returns no AI Overview for a query?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "BrandGEO records an absent AI Overview as a measurement rather than a failed collection. Whether an AI summary appears above the links at all for the questions your customers ask is itself a finding, and often more actionable than a position inside a summary that does appear."
      }
    }
  ]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://getbrandgeo.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Research",
      "item": "https://getbrandgeo.com/blog.html"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Two AI Visibility Tools, Same Brand, Different Numbers",
      "item": "https://getbrandgeo.com/bg-0XX-two-tools-different-numbers.html"
    }
  ]
}
```

---
---

# Article 2 (P2)

**Pillar:** P2, cross-engine consensus.
**Source:** `brandgeo/web/bg-016.html`, plus the city research corpus and the
Zenodo record for the seven city version of the same finding.
**Funnel:** MOFU. **Hook driver:** Curiosity gap.
**Provisional slug:** `bg-0XX-has-your-category-been-decided`
**Target query cluster:** "how to rank in AI search", "AI search competitive
analysis", "can I compete in AI search", "do AI engines recommend the same
brands".
**Distinct from BG-016,** which reports what we measured across the cities. This
is a diagnostic a reader runs on their own category, using that finding as the
prior. It ends with two different strategies depending on which answer they get.
**Word count:** 1,466.

---

## How to Tell Whether AI Engines Have Already Picked a Winner in Your Category

Before you spend a quarter trying to become the brand ChatGPT recommends, it is
worth finding out whether that seat is already taken.

In some categories every AI engine independently names the same brand, in
roughly the same order, in more than one language. In others, five engines
produce five entirely different lists with no shared names anywhere. The split
is not random and it is not about category size. It decides what your next
quarter should look like, and it takes about an hour to test.

### Both shapes are common, and they are roughly evenly split

We ran 20 real commercial buyer categories through five AI engines and read every
answer by hand. Ten of the twenty produced a category where three or more engines
independently named the same brand. The other ten produced no agreement worth the
name. The full breakdown is in
[BG-016](https://getbrandgeo.com/bg-016.html).

The converged end of that range is more absolute than people expect. Asked which
online bank to recommend for a French small business, every engine that returned
a structured answer named Qonto first, in French and in English, with no
exceptions. In London, CRM software, fintech business banking and project
management software each produced a clean sweep across every engine tested.
Berlin did the same for accounting software and, nearly, for HR software.

The fragmented end is just as consistent. Employment law scattered in both
London and Berlin: every engine named a different mix of firms and individual
practitioners, and no name appeared on more than two lists. Independent financial
advice in London did the same. Rome was the sharpest case in the whole programme,
the one city where not a single tested category reached even three engine
agreement.

Rome also produced the finding that makes the whole thing legible. Inside a
single engine, the answers were extremely stable: one engine returned an
identical, identically ordered five restaurant list in Italian and in English.
Each engine was perfectly consistent with itself. None of them agreed with each
other. Rome had not failed to form an opinion. It had formed several, and they
did not transfer.

### What actually decides which shape you are in

The variable is documentation density, not market size.

Categories converge when there is a small set of options with consistent,
citable coverage across review sites, comparison articles and press. That is
material any engine can draw the same conclusion from, no matter which engine is
doing the drawing.

Categories fragment when the offering is genuinely large and thinly documented,
especially when the providers are individually named professionals rather than
products. Each engine then leans on whatever narrow slice of the internet it
happened to retrieve, and the slices do not overlap.

The same split showed up independently at the industry level, on a completely
different dataset, in
[BG-008](https://getbrandgeo.com/bg-008.html). Two datasets, same structure. That
is a reasonable basis for treating it as a real property of the category rather
than an artifact of one run.

### Run the test on your own category

You can do a rough version of this yourself in an afternoon, and a precise
version with a tool.

**Write five prompts a buyer would actually type.** Not your brand name. The
question someone asks before they know you exist. "Which firm should I use for an
employment dispute in Dublin" is the shape. "Best employment law" is not, because
nobody types that into an assistant.

**Ask at least three engines the same five prompts on the same day.** Three is
the floor. The reason is in the data: ChatGPT and Perplexity showed only 11
percent overlap in the domains they cited for identical queries. A single engine
check can look completely different from the full picture, and it will look
authoritative either way.

**Count distinct brand names per prompt, not mentions.** For each prompt, list
every brand each engine named, then count how many engines named each brand. That
number is the whole test.

**Read the result:**

- A brand named by three or more engines out of your three to five: **converged.**
  Somebody owns this question.
- No brand named by more than one engine: **fragmented.** Nobody owns it yet.
- One or two brands appearing on two engines, everything else scattered:
  **forming.** This is the most actionable state and the shortest window.

**Repeat the whole thing in every language you sell in.** This is not a
formality. Asking for wealth management advisors in Paris in French surfaced
independent French patrimoine firms, one of which appeared in three of four
French language responses and in zero English ones. The identical question in
English surfaced major international private banks instead. That is not the same
list reordered. It is a different competitive set considered at all, decided
purely by the language of the question. A firm that publishes only in French is
structurally invisible to English language AI searchers in that category, by
design of how the retrieval worked, not by accident.

### What to do with a converged category

First, find out whether you are the name it converged on. Being absent from a
category the engines have already settled is a specific, measurable gap rather
than a vague worry, and it is the single most useful thing an audit tells you.

If you are absent, the job is documentary, not promotional. The incumbent won
because the sources an engine retrieves from agree about them. Comparison
articles, review platforms, structured data, directory listings, and third party
coverage that names you next to the incumbent in the same sentence. You are not
persuading a model. You are changing what it finds when it looks.

Set the expectation accordingly. Converged categories are the hardest to enter
and the most durable once entered, which is exactly why the incumbent is hard to
move.

### What to do with a fragmented category

Treat it as an open door rather than a bad sign. It reads like a negative result
and it is the opposite.

No engine has committed to an incumbent. There is nothing established to
displace. Whichever brand gets its structured data, directory presence and
citable comparison content in order first has a real and currently open shot at
becoming the name every engine converges on next. In a converged category you
are fighting an existing consensus. In a fragmented one you are supplying the
material that forms it.

The window closes. Categories do not stay fragmented forever, and the brand that
documents itself first while the engines are still guessing tends to become the
default answer they settle on.

### What this test does not tell you

Two limits, stated plainly, because a diagnostic that oversells itself is worse
than none.

A single collection day is a snapshot, not a trend. One run tells you the shape
of your category today. It does not tell you which direction it is moving, and
anyone who reads a direction into a single day of data is reading noise. That is
why the measurement is repeated on a schedule rather than run once.

And consensus is not the same as quality. A converged category tells you which
brand the sources agree about. It does not tell you that brand is the best
option, only that it is the best documented one. Those correlate less than the
market would like.

### The version worth remembering

Half of the categories we tested had already been decided. The other half were
still open. Almost nobody in either half knew which one they were in.

**CTA block for `bg-web`:**

> Find out which side of the split your category is on. We will run your real
> buyer questions across the AI engines on your plan and show you exactly where
> the consensus already sits, and where it is still wide open.
> [Request your free AI Visibility audit](https://getbrandgeo.com)

### JSON-LD, Article 2

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "How to Tell Whether AI Engines Have Already Picked a Winner in Your Category",
  "description": "Ten of twenty commercial buyer categories tested produced three or more AI engines independently naming the same brand. The other ten produced no agreement at all. A step by step diagnostic for testing whether your own category has converged or is still open, and the two different strategies each answer demands.",
  "image": "https://getbrandgeo.com/images/bg-0XX-consensus-hero.png",
  "author": {
    "@type": "Organization",
    "name": "BrandGEO",
    "url": "https://getbrandgeo.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "BrandGEO",
    "logo": {
      "@type": "ImageObject",
      "url": "https://getbrandgeo.com/logo.png"
    }
  },
  "datePublished": "PLACEHOLDER_ISO_DATE",
  "dateModified": "PLACEHOLDER_ISO_DATE",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://getbrandgeo.com/bg-0XX-has-your-category-been-decided.html"
  },
  "articleSection": "AI Visibility Research",
  "keywords": "cross-engine consensus, AI search competitive analysis, generative engine optimization, AI brand recommendations, category analysis, multilingual AI search",
  "citation": [
    {
      "@type": "CreativeWork",
      "name": "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
      "url": "https://getbrandgeo.com/bg-016.html"
    },
    {
      "@type": "ScholarlyArticle",
      "name": "Cross-Engine Consensus in AI-Generated Brand Recommendations: An Empirical Study Across Seven Cities and Five Large Language Models",
      "identifier": "https://doi.org/10.5281/zenodo.21395598",
      "url": "https://doi.org/10.5281/zenodo.21395598"
    }
  ]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is cross-engine consensus?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cross-engine consensus is the degree to which independently queried AI engines converge on the same brand, or the same set of brands, for the same commercial question. A brand with high consensus is visible whichever AI tool a buyer reaches for. A brand visible on only one engine is one habit change away from disappearing from that buyer's search entirely."
      }
    },
    {
      "@type": "Question",
      "name": "How do I test whether my category has already converged?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Write five prompts a buyer would genuinely type before they know your brand exists. Ask at least three AI engines the same five prompts on the same day. For each prompt, list every brand each engine named and count how many engines named each brand. A brand named by three or more engines means the category has converged. No brand named by more than one engine means it is still fragmented. Repeat the whole test in every language you sell in."
      }
    },
    {
      "@type": "Question",
      "name": "Why do some categories converge and others fragment?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The deciding variable is documentation density rather than market size. Categories converge when a small set of options has consistent, citable coverage across review sites, comparison articles and press, so any engine draws the same conclusion. Categories fragment when the field is large and thinly documented, particularly when providers are individually named professionals rather than products, because each engine then relies on a different narrow slice of the web."
      }
    },
    {
      "@type": "Question",
      "name": "Is a fragmented category bad news for my brand?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, it is usually the better position to start from. A fragmented category means no engine has committed to an incumbent, so there is nothing established to displace. The brand that gets its structured data, directory presence and citable comparison content in order first has an open shot at becoming the name the engines converge on. Converged categories are the hardest to enter and the most durable once entered."
      }
    },
    {
      "@type": "Question",
      "name": "Is checking one AI engine enough?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. ChatGPT and Perplexity showed only 11 percent overlap in the domains they cited for identical queries, so a single engine check can look completely different from the full picture while appearing equally authoritative. Three engines is the practical floor for drawing any conclusion about a category."
      }
    },
    {
      "@type": "Question",
      "name": "Does the language of the question change the answer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It can change the entire competitive set, not just the order. Asking for wealth management advisors in Paris in French surfaced independent French firms, one of which appeared in three of four French language responses and zero English ones. The identical question in English surfaced major international private banks instead. Any brand selling in more than one language should test each language separately."
      }
    }
  ]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://getbrandgeo.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Research",
      "item": "https://getbrandgeo.com/blog.html"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Has Your Category Already Been Decided",
      "item": "https://getbrandgeo.com/bg-0XX-has-your-category-been-decided.html"
    }
  ]
}
```

---
---

# Article 3 (P3)

**Pillar:** P3, measurement integrity.
**Source:** `brandgeo/web/bg-018.html` and `brandgeo/web/bg-019.html`.
**Funnel:** MOFU. **Hook driver:** Concrete proof.
**Provisional slug:** `bg-0XX-audit-an-ai-visibility-score`
**Target query cluster:** "are AI visibility tools accurate", "how accurate is
AI visibility tracking", "AI visibility tool evaluation", "how do AI visibility
tools detect mentions".
**Distinct from BG-018 and BG-019,** which are engineering postmortems of our own
pipeline. This is a buyer's audit procedure: four tests they can run on any
vendor's export in an afternoon, with our own bugs used as the worked examples of
what each test is looking for.
**Word count:** 1,398.

---

## How to Audit an AI Visibility Score Before You Trust It

Every AI visibility tool solves the same hard problem, and most buyers never see
it. Read an AI engine's free form answer, then decide automatically which words
in it are a real competitor, a real mention, a real rank, a real sentiment.

That is much harder than it looks from outside the pipeline, and the honest
position is that it is never fully solved. It is continuously found and fixed. A
score sitting on top of that work is exactly as trustworthy as the extraction
underneath it.

You do not need to read anyone's source code to test it. Four checks, run on an
export you already have, will tell you most of what you need to know. We know
which four because we found each of these failures in our own pipeline first.

### Test one: read the competitor list for things that are not companies

Export your competitor list and read it as a human. You are looking for entries
that are not company names.

Three specific shapes to look for, because these are the three we found in our
own output:

**Section headings.** AI engines answering a "best providers" question do not
just list companies, they narrate around the list. Phrases like "AI Visibility
Score" or "Structure Content for AI Extraction" are the engine's own headings,
and a naive extractor reports them as competitor brands.

**Bolded field labels.** Engines answering a "how do I choose" question bold their
own evaluation criteria. "Best for:", "Pricing:", "Research:". Those are Title
Cased and sit at the start of a line, exactly like a bolded brand name. The
distinguishing signal turns out to be the colon: a real company name almost never
carries one inside its own bold span, a field label almost always does.

**Single bare criterion words.** "Employment". "Fees". "References". A single
Title Cased word has no phrase shape for a rule to catch, so it slips through
filters built for multi word names.

If any of those appear in a vendor's competitor list, the score above it is
counting section headings as rivals. We published all five of the false positive
shapes we found, in order, in
[BG-018](https://getbrandgeo.com/bg-018.html).

### Test two: check whether the tool ever returns a null rank

Sort the export by position and look for empty cells.

If a mentioned brand always carries a numeric rank, the tool is not more precise
than one that sometimes returns nothing. It is more willing to guess.

Here is the failure that makes this concrete. An earlier version of our own
pipeline fell back to sentence position when it could not find a real ranking: if
a brand was named in the third sentence, it scored rank 3. That felt like a
reasonable fallback and it was wrong on its own terms, because "third sentence to
mention the brand" and "third ranked recommendation" are not the same unit, and
averaging them into one position column silently blends two different
measurements.

We removed the fallback rather than tightening it. A prose mention with no list
and no stated superlative now returns null, whether the brand appears in the
first sentence or the last.

The narrower rule that replaced it accepts three signal types and nothing else:
a genuine numbered list, a bulleted list whose lead in explicitly states an
ordering, and a superlative grammatically anchored to the brand through a copula.
The bullet case requires one of 25 ordering phrases, and 17 counter phrases like
"a few" or "no particular order" override it even when an ordering word is also
present. A list of "a few of the top rated options" contains the word "top" and
still scores no rank, correctly, even when your brand is the first bullet.

Numbered list digits are trusted only between 1 and 50. That guard exists because
of a real line in our test data that began "2019." followed by a brand name.
Without the band, that scores rank 2019 instead of the correct answer, which is
mentioned but not ranked. The full rule set is in
[BG-019](https://getbrandgeo.com/bg-019.html).

A null position is real information. The brand was mentioned and no rank was
actually claimed. Collapsing that into a fabricated number removes information
rather than adding it.

### Test three: reformat the same answer and see whether the score moves

This is the most revealing test and the least obvious.

Take one AI answer where your brand was named as the top recommendation. Change
only the formatting. A different heading depth. An emoji in front of the rank
number. A line break moved. Nothing about the substance.

If the score changes, the tool is measuring markdown rather than meaning.

We hit this in production against a real client. Our position detection counted
the character budget between the start of a line and the rank digit to decide
whether a line was a ranked list item. A medal emoji encoded as two UTF-16 units
landed exactly on the edge of that budget. Under one heading depth the answer
scored a real rank of 1. Under a heading one level deeper, the identical
recommendation scored no rank at all.

It was worse than that. Sentiment logic scoped itself to the line naming the
brand, which is normally right, but a ranked heading and the enthusiastic
sentence beneath it were being split by sentence boundary detection. The same
praise scored positive in one formatting variant and neutral in another, purely
because of where a full stop happened to fall.

Same brand, same praise, same answer in every way a reader would notice.
Different score.

### Test four: ask what the vendor has found and removed

Two questions, and the second one matters more.

**What false positives have you found in your own extraction, and what did you do
about them?** A vendor that has never found one has probably not looked hard
enough. Every tool in this category runs the same extraction problem against the
same messy free text.

**Is there a regression suite standing behind the score, or only the current
behaviour of the current code?** Without one, next month's fix quietly
reintroduces this month's bug. Ours is 156 hand written assertions, every one
built from a real production example rather than a synthetic case invented to
make a fix look good, and five of those exist specifically to stop the rank
fallback from creeping back in. Nothing ships until all of them pass.

### Why we stopped writing rules and added a judgment call

Five rounds of false positives in, the honest read of our own pattern was that a
sixth rule would fix the next language or formatting quirk we happened to see,
and a seventh bug would appear in whichever one we had not tested yet. Rules and
denylists scale by how much test data you have already seen. A product operating
worldwide cannot out write every language's field labels one entry at a time.

So a semantic classifier runs as a final pass, on top of the structural rules
rather than instead of them. Three constraints made it safe to ship. It can only
remove candidates, never add one, so an invented brand name cannot reach a score
no matter what the model returns. It fails open on any error, timeout or
unparseable response, returning the structural list unchanged. And it is bounded
by an 8 second timeout and at most 15 candidates per call, so a degraded model
call cannot hold up a collection run.

### The point of publishing this

None of these failures are unique to us. They are what happens to anyone reading
free text answers at scale, and the reason to publish them is that a category
selling measurement should be able to show its own error log.

Apply the four tests to us as readily as to anyone else. That is the point of
writing them down.

**CTA block for `bg-web`:**

> Run the free audit and read the working. We will show you which mentions were
> ranked, which honestly were not, and how each reading was reached.
> [Request your free AI Visibility audit](https://getbrandgeo.com)

### JSON-LD, Article 3

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "How to Audit an AI Visibility Score Before You Trust It",
  "description": "Four tests a buyer can run on any AI visibility tool's export: read the competitor list for section headings and field labels, check whether the tool ever returns a null rank, reformat an answer and see whether the score moves, and ask what the vendor has found and fixed. Each test is illustrated with a real false positive found in BrandGEO's own extraction pipeline.",
  "image": "https://getbrandgeo.com/images/bg-0XX-audit-score-hero.png",
  "author": {
    "@type": "Organization",
    "name": "BrandGEO",
    "url": "https://getbrandgeo.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "BrandGEO",
    "logo": {
      "@type": "ImageObject",
      "url": "https://getbrandgeo.com/logo.png"
    }
  },
  "datePublished": "PLACEHOLDER_ISO_DATE",
  "dateModified": "PLACEHOLDER_ISO_DATE",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://getbrandgeo.com/bg-0XX-audit-an-ai-visibility-score.html"
  },
  "articleSection": "AI Visibility Research",
  "keywords": "AI visibility score accuracy, competitor extraction, false positives, brand mention detection, rank detection, measurement integrity, generative engine optimization",
  "citation": [
    {
      "@type": "CreativeWork",
      "name": "We Kept Finding New Ways Our Own Score Could Lie",
      "url": "https://getbrandgeo.com/bg-018.html"
    },
    {
      "@type": "CreativeWork",
      "name": "Why Our Scorer Returns Null Instead of a Rank It Can't Prove",
      "url": "https://getbrandgeo.com/bg-019.html"
    }
  ]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How accurate are AI visibility tools?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Accuracy depends almost entirely on the extraction pipeline underneath the score, which reads an AI engine's free form answer and decides which words are a real competitor, mention, rank or sentiment. That problem is never fully solved, only continuously found and fixed. BrandGEO found and published five structurally different false positive bugs in its own extraction logic over six weeks, each caught against real production responses rather than synthetic tests."
      }
    },
    {
      "@type": "Question",
      "name": "What does a false positive look like in AI visibility tracking?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Three common shapes. Section headings from the AI's own answer reported as competitor brand names. Bolded evaluation criteria such as Pricing: or Best for: reported as brands, distinguishable because a real company name almost never carries a colon inside its bold span. And single bare criterion words such as Fees or References, which slip through filters built to catch multi word phrases."
      }
    },
    {
      "@type": "Question",
      "name": "Should an AI visibility tool ever return no rank for a mentioned brand?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. A tool that always produces a number for a mentioned brand is not more precise, it is more willing to guess. BrandGEO reports a rank only when the answer makes one of three checkable claims: a genuine numbered list, a bulleted list whose lead in explicitly states an ordering, or a superlative grammatically anchored to the brand. Everything else returns null, which is real information rather than a gap."
      }
    },
    {
      "@type": "Question",
      "name": "Can formatting change an AI visibility score?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It can, and testing for it is one of the most revealing checks a buyer can run. In one real case, a medal emoji encoded as two UTF-16 units sat exactly on the edge of the character budget used to detect ranked list items. The same recommendation scored rank one under one heading depth and no rank at all under a heading one level deeper, with identical substance in both."
      }
    },
    {
      "@type": "Question",
      "name": "What should I ask a vendor about their measurement pipeline?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ask what false positives they have found in their own extraction and what they did about them, since a vendor that has never found one has probably not looked hard enough. Then ask whether a regression suite stands behind the score rather than only the current behaviour of the current code. BrandGEO's suite holds 156 hand written assertions, each built from a real production example, and no change ships until all of them pass."
      }
    }
  ]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://getbrandgeo.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Research",
      "item": "https://getbrandgeo.com/blog.html"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "How to Audit an AI Visibility Score Before You Trust It",
      "item": "https://getbrandgeo.com/bg-0XX-audit-an-ai-visibility-score.html"
    }
  ]
}
```

---
---

# Article 4 (P4)

**Pillar:** P4, peer-archived research.
**Source:** `brandgeo/web/bg-017.html` and the Zenodo record,
`10.5281/zenodo.21395598`.
**Funnel:** MOFU. **Hook driver:** Utility.
**Provisional slug:** `bg-0XX-checkable-ai-search-statistics`
**Target query cluster:** "AI search statistics", "GEO statistics 2026", "are AI
visibility statistics reliable", "AI search research data".
**Distinct from BG-017,** which announces the paper and summarises its findings.
This is a five question test a reader applies to any statistic in the category,
with our own paper run through that test in public, including the parts it fails
or has to disclose.
**Word count:** 1,441.

---

## Most AI Search Statistics You Will Read This Year Cannot Be Checked

The AI visibility category runs on numbers that nobody can verify. A percentage
in a slide, a share of traffic in a webinar, a claim about how many buyers now
start in an assistant. No dataset, no dates, no denominator, no way to look.

Some of those numbers are probably right. You have no way of knowing which ones,
and neither does the person quoting them at you.

There is a test. Five questions, and almost nothing in circulation survives all
five. Below, we run our own published research through it, including the parts
where it has to disclose rather than claim.

### Question one: can you see the responses, or only the conclusion

A conclusion is a summary of a dataset. If the dataset is not available, the
conclusion is an assertion.

This is the cheapest filter and it eliminates most of what circulates. Ask
whether the underlying responses exist somewhere a reader can reach, or whether
the only artifact is the chart.

**Our answer.** The full text, the complete per city results table, the
methodology and the disclosed limitations are open access at
[doi.org/10.5281/zenodo.21395598](https://doi.org/10.5281/zenodo.21395598), under
a CC BY 4.0 licence. No account, no paywall, no email. The licence matters more
than it sounds: it means anyone, including the AI systems the paper is about, can
freely quote and cite it.

### Question two: what was the denominator, and what came out of it

Every dataset has gaps. The question is whether they are disclosed or absorbed.

A statistic quoted as a clean percentage with no stated denominator is hiding
the most informative part of itself. Ask how many observations the design implied,
how many were actually recorded, and what was excluded and why.

**Our answer, in full.** The design implied 280 engine level responses. 278 were
recorded. Two rows were lost to a transient collection gap and are named as such.
A further 56 rows came back as recorded API errors rather than real answers,
caused by a sustained account level quota failure on the collection account
during the exact window we were gathering data. All 56 were ChatGPT.

That left a choice: report ChatGPT's silence as though it were a finding about
ChatGPT, or exclude the engine and say so. We excluded it. The paper's analytic
dataset is **222 completed responses across four engines**, and that appears on
page one rather than in a footnote.

A percentage computed over 222 is a different object from the same percentage
computed over 280, and a reader who cannot see which one they are holding cannot
use it.

### Question three: when was it collected, and over what window

AI engines do not return a stable answer forever. A statistic without a
collection date is a claim about an unspecified moment.

The related failure is a single day presented as a trend. One collection day
tells you the shape of something on that day. It cannot tell you a direction, and
any language about a figure rising or improving on the strength of one run is
reading noise as a signal.

**Our answer.** The collection ran between 9 and 10 July 2026, stated as a range
rather than a month. The paper claims a structure that held across the cities in
that window. It does not claim a trend, because two days cannot support one.

We apply the same rule to our own live data. Two engines went live on 29 July
2026 and are collecting now. We are not publishing a rate for either of them,
because a single collection day is not a measurement worth a percentage, and a
company selling measurement publishing one anyway would refute its own product.

### Question four: which engines, and was retrieval switched on

An engine queried without web search answers from its training data. It produces
a fluent, confident description of the past, and nothing in the output flags
that.

A statistic built partly on retrieval free engines is a blend of "what is true
now" and "what was true before some training cutoff", reported in one number.

**Our answer, including the uncomfortable part.** The 2026 paper's four analysed
engines were Gemini, Claude, Perplexity and Meta AI. Meta AI was retired from
BrandGEO on 16 July 2026, after the collection window, precisely because the
models reachable in that path ran training data only. Its rows remain in the
paper as a dated historical record of what that engine answered on those days.
They are not a claim about any engine we monitor now, and Meta AI is not part of
any current plan.

That is the honest shape of it. The record stands as a record. The product moved.
Both facts get stated rather than one being quietly dropped.

### Question five: is the record permanent, or can it be edited afterwards

A page can be edited. A number in a slide can be revised between one webinar and
the next. Neither leaves a trace.

Ask whether there is a version of the claim that cannot be silently changed after
publication.

**Our answer.** Zenodo is run by CERN and issues a permanent DOI. The version
cited is fixed. If we later revise the analysis, that becomes a new version with
its own record, and the original stays reachable. That is the property that makes
a claim checkable a year later, and it is the reason we published to a repository
rather than only to our own site.

### The parts we had to leave in

A paper that only reports what worked is a marketing document with citations.
Ours names its own weak points, and this is the part most worth copying if you
publish research of your own.

A Gemini specific extraction pattern, where the model clearly named brands in
prose but our automated pipeline did not parse a structured list from the
formatting, is disclosed and flagged separately from genuine cross engine
disagreement wherever it materially affects a result. One response naming an
apparently closed restaurant, and one with a geographic mismatch, are both
disclosed rather than kept in as if clean. The single most noise corrupted
response in the whole programme is called out by name.

None of that improves the findings. It is what makes them usable, because a
reader can see the edges of what the data supports instead of guessing.

### What the checkable version actually found

Having passed the test, the finding is worth stating, and it is narrower than
most numbers in this category.

Categories with a small number of well documented, frequently reviewed providers
converge, often to full unanimity across every responding engine. Categories with
a long tail of similarly qualified, less differentiated providers, especially
individually named professionals, almost never converge at all. That held
independently in London, New York and Dublin, three cities without the bilingual
design, so it cannot be explained away as an artifact of language.

New York gave it a sharp variant. Three long established brokerages each reached
three of four engine consensus for real estate, while individually named star
agents in the very same responses never reached agreement beyond a single engine.

Paris produced the result with the widest implications. Asked in French, the
responding engines converged on independent French firms for wealth management.
Asked the identical question in English, they converged on major international
private banking divisions instead. A different class of provider considered at
all, decided by the language of the question.

### How to use this

Run the five questions on the next AI search statistic that crosses your desk,
whoever published it. Most will fail at question one.

Then run them on us. The paper is open, the licence permits quoting it, and the
limitations section is where to start rather than where to stop.

**How to cite it:** Constantin Daniel (2026). *Cross-Engine Consensus in
AI-Generated Brand Recommendations: An Empirical Study Across Seven Cities and
Five Large Language Models.* Zenodo. https://doi.org/10.5281/zenodo.21395598

**CTA block for `bg-web`:**

> The same pipeline that produced that paper runs on your brand. Run the free
> audit and see where you stand in the same kind of test, with the working shown.
> [Request your free AI Visibility audit](https://getbrandgeo.com)

### JSON-LD, Article 4

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Most AI Search Statistics You Will Read This Year Cannot Be Checked",
  "description": "Five questions that separate a checkable AI search statistic from an assertion: is the dataset reachable, what was the denominator and what was excluded, when was it collected, which engines and was retrieval enabled, and is the record permanent. BrandGEO's own peer-archived study of 222 production AI responses is run through all five, including what it had to disclose.",
  "image": "https://getbrandgeo.com/images/bg-0XX-checkable-statistics-hero.png",
  "author": {
    "@type": "Organization",
    "name": "BrandGEO",
    "url": "https://getbrandgeo.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "BrandGEO",
    "logo": {
      "@type": "ImageObject",
      "url": "https://getbrandgeo.com/logo.png"
    }
  },
  "datePublished": "PLACEHOLDER_ISO_DATE",
  "dateModified": "PLACEHOLDER_ISO_DATE",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://getbrandgeo.com/bg-0XX-checkable-ai-search-statistics.html"
  },
  "articleSection": "AI Visibility Research",
  "keywords": "AI search statistics, GEO research, open access dataset, research methodology, cross-engine consensus, generative engine optimization, data integrity",
  "citation": {
    "@type": "ScholarlyArticle",
    "name": "Cross-Engine Consensus in AI-Generated Brand Recommendations: An Empirical Study Across Seven Cities and Five Large Language Models",
    "author": {
      "@type": "Person",
      "name": "Constantin Daniel"
    },
    "datePublished": "2026",
    "publisher": {
      "@type": "Organization",
      "name": "Zenodo"
    },
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "identifier": "https://doi.org/10.5281/zenodo.21395598",
    "url": "https://doi.org/10.5281/zenodo.21395598"
  }
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How can I tell whether an AI search statistic is trustworthy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Five questions. Can you reach the underlying responses or only the conclusion. What was the denominator and what was excluded from it. When was the data collected and over what window. Which engines were queried and was retrieval enabled for each. And is there a permanent record that cannot be silently edited after publication. Most statistics circulating in this category fail the first question."
      }
    },
    {
      "@type": "Question",
      "name": "What is in BrandGEO's published research paper?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "56 buyer-intent prompts run across seven cities and multiple AI engines between 9 and 10 July 2026, using BrandGEO's production collection pipeline. The design implied 280 engine-level responses and 278 were recorded. After excluding 56 ChatGPT rows lost to an account-level quota failure, the analytic dataset is 222 completed responses across four engines. It is published on Zenodo under a permanent DOI, 10.5281/zenodo.21395598, licensed CC BY 4.0."
      }
    },
    {
      "@type": "Question",
      "name": "Why was ChatGPT excluded from the paper?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "56 ChatGPT rows came back as recorded API errors rather than real answers, caused by a sustained account-level quota failure on the collection account during the exact data-gathering window. Reporting that silence as though it were a finding about ChatGPT would have been misleading, so the engine was excluded from the analysis and the exclusion is stated on page one rather than in a footnote."
      }
    },
    {
      "@type": "Question",
      "name": "Why does the paper include Meta AI when BrandGEO no longer monitors it?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The collection ran on 9 and 10 July 2026. Meta AI was retired from BrandGEO on 16 July 2026, after that window, because the models reachable in that path answered from training data with no web search. Its rows remain in the paper as a dated historical record of what that engine answered on those days. Meta AI is not part of any current BrandGEO plan and is not presented as a live engine."
      }
    },
    {
      "@type": "Question",
      "name": "What was the paper's main finding?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Categories with a small number of well documented, frequently reviewed providers converge, often to full unanimity across every responding engine. Categories with a long tail of similarly qualified, less differentiated providers, especially individually named professionals, almost never converge. This held independently in London, New York and Dublin, three cities without the bilingual design, so it cannot be attributed to language."
      }
    },
    {
      "@type": "Question",
      "name": "Can I cite or quote BrandGEO's research?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. The paper is open access on Zenodo under a CC BY 4.0 licence, so anyone including AI systems may freely read, quote and cite it with attribution. Cite as: Constantin Daniel (2026). Cross-Engine Consensus in AI-Generated Brand Recommendations: An Empirical Study Across Seven Cities and Five Large Language Models. Zenodo. https://doi.org/10.5281/zenodo.21395598"
      }
    }
  ]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://getbrandgeo.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Research",
      "item": "https://getbrandgeo.com/blog.html"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Most AI Search Statistics Cannot Be Checked",
      "item": "https://getbrandgeo.com/bg-0XX-checkable-ai-search-statistics.html"
    }
  ]
}
```

---
---

## Notes for `bg-web` at publish time

1. **Assign four free BG numbers.** `bg-021` is taken and the grok package's
   draft also asks for a number. Allocate at publish, then update the slug in
   three places per article: the `@id`, the `BreadcrumbList` item, and the
   filename.
2. **Fill every `PLACEHOLDER_ISO_DATE`** and each hero image path. Do not ship a
   placeholder string.
3. **Re-parse all twelve JSON-LD blocks after HTML conversion.** The known live
   failure mode is a truncated `acceptedAnswer` close, `"}]` where `"}}]` is
   required. That is what broke Baltimore, Charlotte and Detroit.
4. **Internal link targets verified 2026-07-29.** `bg-008.html`, `bg-016.html`,
   `bg-017.html`, `bg-018.html`, `bg-019.html`,
   `bg-021-retrieval-not-engine-count.html` and `blog.html` all exist in
   `brandgeo/web/`. Every internal link in all four articles resolves.
5. **No pricing anywhere in these four.** All four are MOFU and the CTA is the
   free audit. Plan names appear only where an engine assignment requires them,
   with no figures attached.
