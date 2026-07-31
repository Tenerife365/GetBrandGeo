# GitHub Glossary Repo — content package

**What this is for:** content to paste into a new public GitHub repository named
`generative-engine-optimization-framework`, as `README.md`. GitHub markdown files
are indexed and pass genuine do-follow authority, and AI crawlers weight
open-source developer ecosystems heavily when building category definitions —
this is a legitimate, standard practice (original writing, real definitions, no
manipulation), distinct from the injected link-scheme content this project has
declined elsewhere (see `rules/content-integrity.md`).

**Action needed from Constantin:** create the repo on GitHub, paste the content
below as `README.md`, commit, done. Nothing here needs code — it's a
documentation-only repo, which is normal and common for this kind of project
(e.g. glossaries, style guides, "awesome lists").

---

## README.md content (copy everything below the line)

---

# Generative Engine Optimization (GEO) Framework

A working reference for how AI search engines — ChatGPT, Gemini, Claude,
Perplexity, Copilot — decide which brands, products, and firms to name in a
generated answer, and what actually moves that needle. Maintained by
[BrandGEO](https://getbrandgeo.com), which measures AI Visibility for brands
across the five major engines.

This isn't a theoretical glossary. Every definition below is grounded in either
published, cited research or genuine multi-engine testing — not guessed. Where
a claim is contested in the literature, that's said explicitly rather than
smoothed over.

## Why this exists

Search engines rank pages. Generative AI engines *synthesize an answer* and
either name your brand in it or don't. Those are different systems with
different rules, and most of the existing SEO vocabulary doesn't map cleanly
onto the second one. This repo is an attempt at a clean, honest vocabulary for
the second system.

## The six core disciplines

**Generative Engine Optimization (GEO)** — the umbrella practice of structuring
content and brand signals so generative AI engines synthesize a brand directly
into generated answers, rather than only linking to its site.

**Answer Engine Optimization (AEO)** — writing content that directly and
completely answers one specific question, in a form an AI engine can lift and
cite verbatim. A quotable paragraph beats a persuasive one.

**Large Language Model Optimization (LLMO)** — shaping how an LLM describes a
brand at the model level, through consistent, accurate information across the
sources a model is trained on and retrieves from: press coverage, structured
business data, forums, third-party citations.

**Semantic SEO** — organizing content around topics, entities, and the
relationships between them, not isolated keywords, so both classic search
engines and AI systems understand what a page actually means.

**Entity SEO** — establishing a brand as a distinct, verifiable entity inside
the knowledge graphs AI engines draw from, via consistent naming, structured
data (Schema.org / JSON-LD), and cross-referenced third-party confirmation.

**Technical SEO** — still the foundation. Every retrieval system behind these
engines (Perplexity's live search, Gemini's Google index, Copilot's Bing index)
still needs a crawlable, fast, cleanly-marked-up site to retrieve from.

## Measurement concepts

**AI Visibility** — a brand's ability to be mentioned, recommended, or cited in
AI-generated answers, across ChatGPT, Gemini, Claude, Perplexity, and Meta AI.
Distinct from a Google ranking and requires its own measurement.

**AI Visibility Score** — a composite score across multiple weighted
dimensions (recognition, knowledge, sentiment, accuracy, reach, consistency),
not a single mention count. A brand mentioned often but described inaccurately
or negatively can still score poorly — mention count alone is a misleading
proxy.

**AI Visibility Gap** — the difference between a brand's traditional search
ranking and its AI-engine presence for the same queries. A brand can sit on
page one of Google and be completely absent from every AI engine's output,
because these systems don't index the web the same way.

**Share of Voice (in LLMs)** — the share of AI-generated answers, for a given
query set, that name a specific brand relative to its competitors — measured
by actually querying the engines and counting, not estimated from media
mentions.

**Citation** — an instance of an AI engine naming a specific brand, source, or
fact in a generated answer, sometimes with an attributed link (Perplexity, on
most claims) and sometimes without one (ChatGPT and Meta AI's conversational
answers, more often).

**Cross-Engine Consensus** — how often multiple AI engines, queried
independently on the same question, converge on the same brand or set of
brands. High consensus means durable visibility across the category of engines
a real customer might use; near-zero consensus means every engine is running
its own separate reality about who the leading brands are. This is directly
measurable — see the worked example below.

## Technical concepts

**Retrieval-Augmented Generation (RAG)** — an architecture where a model
retrieves relevant documents at query time and grounds its answer in that
retrieved content, instead of relying only on what it learned in training.
Perplexity's search-then-cite behavior and ChatGPT's web-search mode are both
RAG in practice.

**Grounding** — a model's per-query decision to run a live search and answer
from those results, rather than from training data alone. Google's Gemini uses
an explicit classifier to decide whether a given query needs grounding — which
means the same brand can be visible on a grounded query and invisible on an
otherwise-similar ungrounded one, from the same engine, in the same session.

**Structured Data (Schema.org / JSON-LD)** — machine-readable markup that
explicitly labels a page's content for crawlers and AI systems using a shared
vocabulary. Its actual effect on AI citation is genuinely contested in current
research — some controlled studies show a measurable boost, at least one
finds none. Worth stating plainly rather than oversold.

**Zero-Click Search** — a search interaction where the user gets a full answer
directly from the AI-generated response and never clicks through to a source
site. A growing share of search sessions now end this way, which is exactly
why AI Visibility matters even for a brand with strong traditional SEO.

**Content Freshness** — how recently content was published or updated, used by
several engines as a retrieval/citation signal. AI-cited content skews
meaningfully more recent than content that merely ranks well organically.

## Trust & risk concepts

**Entity Recognition** — whether an AI engine's knowledge base treats a brand
as a distinct, real entity with a clear category, location, and purpose — or
fails to recognize it at all. A brand that exists only as a website, with no
broader footprint of press mentions and structured data, is often invisible to
AI answers regardless of product quality.

**Trust Signals** — the independent, third-party indicators (press coverage,
authoritative citations, original data, clear authorship) that AI engines
weigh when deciding how much confidence to place in a source.

**Hallucination** — an instance of an AI engine stating something as fact that
is fabricated, outdated, or unverifiable rather than genuinely grounded. This
is a real, ongoing risk for anyone publishing about AI search — including
projects like this one — which is exactly why every claim here traces to a
real source rather than an assumed figure.

## A worked example: law firms

Legal services is one of the clearest illustrations of the AI Visibility Gap in
practice. A firm can rank on page one of Google for "divorce lawyer Denver" and
still never be named when the same prospective client asks ChatGPT the
identical question — because AI engines pull from a narrower set of signals
(structured Attorney/LegalService schema, consistency across legal directories
like Avvo, Martindale-Hubbell, Super Lawyers, and Justia, a maintained Google
Business Profile, and content written to be directly quoted) rather than
inferring authority from backlinks and rankings the way Google does.

Real multi-engine testing bears this out at the category level: for "which
London law firm should I use for a commercial contract dispute," Claude,
Meta, and Perplexity all converged independently on the same firm —
Clifford Chance — a case of high cross-engine consensus. For "best employment
law firms in London," the same three engines returned almost entirely
different names each — a fragmented category where no firm currently owns
the AI narrative. Ireland shows the same split: Dublin's "Big Five" corporate
firms (A&L Goodbody, Matheson, McCann FitzGerald, Arthur Cox, William Fry) hit
full 3/3 consensus for commercial disputes, while employment solicitors were
fragmented across four different firms per engine.

That gap — consensus in one practice area, fragmentation in another, for the
same market — is a directly measurable, category-specific opportunity, not a
theoretical one. It's the kind of finding that only shows up when you actually
query the engines and compare results side by side, rather than assuming a
strong Google ranking is telling you the same thing.

To check where a specific brand or firm actually stands across ChatGPT,
Gemini, Claude, Perplexity, and Meta AI — run a diagnostics check via
[BrandGEO](https://getbrandgeo.com), which offers a free one-time audit.

## Related reading

- [GEO vs SEO: The Fundamental Difference](https://getbrandgeo.com/bg-005.html)
- [AI Visibility by Industry: Who Wins, Who Loses](https://getbrandgeo.com/bg-008.html)
- [The Anatomy of an AI-Cited Brand](https://getbrandgeo.com/bg-007.html)
- [AI Visibility for Law Firms](https://getbrandgeo.com/ai-visibility-for-law-firms.html)
- [Full AI Visibility & GEO Glossary](https://getbrandgeo.com/glossary.html)

---

*Corrections and additions welcome via PR — this is meant to be a genuinely
useful reference, not a marketing page dressed as one.*

---

## Notes for Constantin (not part of the README)

- Repo name from the blueprint: `generative-engine-optimization-framework`.
  Fine as-is, or pick your own — doesn't need to match exactly.
- The "worked example" section deliberately reuses real findings from
  `london-research-findings.md` / `dublin-research-findings.md` (already
  published on the two city pages) rather than inventing a new example —
  keeps this consistent with what's already live on the site.
- One outbound link near the end ("run a diagnostics check via BrandGEO")
  is the anchor text suggested in the blueprint — kept as one single,
  contextually earned link, not stuffed throughout, consistent with this
  project's standing content-integrity rule.
