# 01. Blog (MOFU)

**Slug:** `bg-020-retrieval-not-engine-count`
**Driver:** Contrarian. **~1,600 words.**
**CTA:** Free audit on getbrandgeo.com. No price in body copy.
**Note for `bg-web`:** BG number is provisional. `bg-020` was earmarked for the
cross-city consensus follow-up in `docs/ROADMAP-2026-07-27.md`. Assign the next
free number at publish time.

---

## We shipped two AI engines today. The more useful story is the two we turned down.

Every tool in this category advertises a number. Five engines, seven, twelve. The
number is easy to raise and it is almost never the thing that determines whether
your measurement is any good.

Here is the question that separates them: when that engine answered, did it go
and look, or did it answer from memory?

Those produce different answers to the same question, and only one of them tells
you anything about today.

### What an engine without retrieval is actually measuring

A large language model with no retrieval answers from its training data. Ask it
which companies do commercial catering in a given city and it will give you a
confident, fluent, well-formatted list of what was true at some point before its
training cutoff.

For brand visibility work that is close to useless, and worse, it is convincingly
useless. A business that launched this year is invisible to it. A business that
has been quietly winning for eighteen months is invisible to it. A competitor
that shut down two years ago may still be ranked third. You get a clean number, a
tidy chart, and a picture of the past.

The failure is silent. Nothing in the output says "this answer is from memory."
It reads exactly like the engines that did go and look.

### We retired an engine over this

BrandGEO monitored Meta AI until 16 July 2026. It is not in any plan now.

The reason was retrieval. The Llama models we could reach ran training-data only,
with no web search available in that path. It kept producing answers that looked
plausible and were structurally incapable of reflecting what had changed. For a
product whose job is telling you what AI engines say about your brand right now,
an engine that cannot see right now is not a feature. It is a number on a pricing
page that makes the product worse.

Removing it lowered our engine count. We did it anyway.

### The same reasoning keeps DeepSeek out

DeepSeek comes up regularly. It is capable, it is cheap, and adding it would move
our advertised number up by one.

Every DeepSeek model available to us through OpenRouter is retrieval-free. It
would answer from training data only. That is the identical shape that got Meta
AI retired, so adding it would mean reversing a decision we had just made, for
the sole benefit of a larger number on a marketing page.

Copilot is out for a different reason. Microsoft ships no public API for it, so
anyone claiming to monitor Copilot is either using an undocumented path or
measuring something adjacent and calling it Copilot. We would rather say we do
not cover it.

### The first engine we added today: Grok

Grok went live on 29 July 2026, on Growth PRO and above.

It passed the same test, but only just, and only because of a specific
configuration choice. Grok on its own answers from training data. We run it with
the web plugin enabled, which is what makes it a measurement instrument rather
than a memory test. Had that not been available, Grok would have joined DeepSeek
on the outside.

The second reason it earned a slot is that it reads something the others do not.
Grok is xAI's model, and it has access to X. The rest see the open web: your
site, your listings, publisher coverage, review sites. Grok also sees the
conversation. Plenty of brands have a strong web footprint and a thin social one,
or the reverse. Those brands look different to Grok, and until now that gap was
not something you could measure.

### The second one is the one most tools are missing

We also added Google AI Overviews today, as a separate engine from Google AI
Mode, which we have monitored since 16 July.

That distinction is the point, and it gets collapsed constantly. They are two
different Google products:

**Google AI Mode** is a tab. The searcher has to switch to it on purpose. It is a
conversational surface and the people using it have opted in.

**Google AI Overviews** is the AI summary block that appears by default at the top
of an ordinary Google results page. Nobody opts in. It is simply there, above the
links, for a very large share of ordinary searches.

Different reach, different answers. A tool that measures AI Mode and reports it as
"Google" is describing the surface fewer people see, and calling it the whole
picture. We measure both, separately, because they disagree often enough that
averaging them would hide the thing you need to know.

There is one more property of this engine worth stating plainly, because it
inverts how a measurement is normally read. **If Google renders no AI Overview at
all for a query, we record that as a result, not as an error.** Whether an AI
summary appears above the links for the questions your customers ask is itself a
finding, and often a more actionable one than your position inside a summary that
does appear.

### What the ladder looks like now

- **Free:** ChatGPT
- **Essentials:** ChatGPT, Gemini, Claude
- **Growth:** the above plus Perplexity and Google AI Mode
- **Growth PRO and above:** the above plus Grok and Google AI Overviews

Seven engines at the top. Every one of them retrieves. That is not a coincidence
of which models we happened to pick. It is the entry requirement, and it is why
the list is seven and not twelve.

Every paid plan refreshes weekly.

### Four questions worth asking your current vendor

None of this is unique to us in principle. Any tool could adopt the same
standard. Most do not publish enough for you to check, so ask directly.

**1. For each engine you list, was web search enabled when you queried it?**
Not "does the model support search." Was it on, in your pipeline, for the run that
produced my report.

**2. When you say you monitor Google, which Google?** AI Mode, AI Overviews, or
one of them reported as though it were both. This is the question most likely to
produce a pause.

**3. Which engines in your list have never returned a result for my account?** An
engine can sit on a pricing page for months without collecting anything. Coverage
claimed and coverage delivered are different columns.

**4. What is your standard for removing an engine?** Everyone has an
add-an-engine story. Ask for the remove-an-engine story. If there is not one, the
list only ever grows, and a list that only grows is a marketing artifact.

### The uncomfortable version of this

This argument stops favouring us the moment a competitor runs eight engines with
retrieval on. That is fine. It is the correct standard even when it costs us the
comparison, and it is one we have already applied against our own interest twice,
by retiring an engine we had shipped and by declining a cheap one we could have
added this month.

Engine count is the easiest number in this category to move and the least
informative. Ask what was switched on.

---

**CTA block for `bg-web`:**

> See which engines mention your brand, and which do not.
> Run the free audit on your own domain. No card required.
> [Start the free audit](https://getbrandgeo.com)

---

## JSON-LD

Three blocks. `BlogPosting`, `FAQPage`, `BreadcrumbList`.

**Validation status: all three parsed with `json.loads` after the seven-engine
rebuild, 2026-07-29.** Re-validate after `bg-web` converts to HTML. The three live
FAQPage failures on Baltimore, Charlotte and Detroit were introduced at exactly
that step, not in the draft, and the site audit confirms they are now fixed.

`bg-web`: fill `datePublished`, `dateModified`, the final URL and the hero image
path at publish. Do not ship the placeholder strings.

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "We shipped two AI engines today. The more useful story is the two we turned down.",
  "description": "Engine count is the easiest number in AI visibility tooling to raise and the least informative. What matters is whether retrieval was enabled. Why BrandGEO retired Meta AI, keeps DeepSeek out, and added Grok and Google AI Overviews with search on.",
  "image": "https://getbrandgeo.com/images/bg-020-hero.png",
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
    "@id": "https://getbrandgeo.com/bg-020-retrieval-not-engine-count.html"
  },
  "articleSection": "AI Visibility Research",
  "keywords": "AI visibility, generative engine optimization, Grok, Google AI Overviews, retrieval, AI search monitoring"
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Which AI engines does BrandGEO monitor?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Seven. ChatGPT, Gemini, Claude, Perplexity and Google AI Mode are available from the Growth plan. Grok and Google AI Overviews are available on Growth PRO and above. All seven are queried with live web search enabled. Free includes ChatGPT; Essentials includes ChatGPT, Gemini and Claude."
      }
    },
    {
      "@type": "Question",
      "name": "What is the difference between Google AI Mode and Google AI Overviews?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "They are two different Google products and BrandGEO measures them separately. AI Mode is a tab the searcher switches to on purpose. AI Overviews is the AI summary shown by default at the top of an ordinary Google results page, which reaches far more searchers. They frequently give different answers, so reporting only one of them under the label Google would hide the surface most people see."
      }
    },
    {
      "@type": "Question",
      "name": "Why does BrandGEO not monitor Meta AI any more?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Meta AI was retired on 16 July 2026. The models reachable in that path answered from training data only, with no web search, so the results could not reflect current conditions."
      }
    },
    {
      "@type": "Question",
      "name": "Why is DeepSeek not included?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Every DeepSeek model available through OpenRouter is retrieval-free and would answer from training data only. That is the same reason Meta AI was retired, so including it would contradict the standard applied to every other engine."
      }
    },
    {
      "@type": "Question",
      "name": "What does Grok add that the other engines do not?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Grok is xAI's model and has access to X in addition to the open web. The other engines see the open web only. A brand with a strong website and a thin social presence can look materially different to Grok than to ChatGPT."
      }
    },
    {
      "@type": "Question",
      "name": "How often does BrandGEO refresh its results?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Weekly on every paid plan."
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
      "name": "We shipped two AI engines today",
      "item": "https://getbrandgeo.com/bg-020-retrieval-not-engine-count.html"
    }
  ]
}
```
