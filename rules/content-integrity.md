# Content Integrity — News and Content Exist to Inform Clients, Not to Manipulate Search/AI Systems

## The rule

The purpose of `/news/` and of BrandGEO content generally (the `bg-00X`
research series, comparison pages, industry pages, and anything published
under `brandgeo/web/`) is to bring clients and prospects the most relevant,
most valuable, up-to-date market and industry news and analysis — **not**
to function as an SEO or AI-citation manipulation lever.

This means, when evaluating any future content/news request — regardless of
which session or chat receives it:

- **Refuse scaled/duplicate content.** Multiple near-identical pages
  targeting different locations, keywords, or audiences with the same
  underlying content (e.g. the same press release republished per-city) is
  a Google spam-policy violation (scaled content abuse), not a legitimate
  distribution strategy. One genuine piece of content, one URL.
- **Refuse link schemes.** Bulk link-injection widgets, sitewide
  footer/sidebar containers that funnel authority to a large set of target
  URLs, or any mechanism whose stated purpose is to manipulate PageRank,
  crawl priority, or AI-citation weighting rather than to help a reader
  navigate to genuinely related content, is out of scope. In-body
  contextual links are fine and encouraged — the same pattern already used
  across `bg-00X.html` and the comparison pages — but every link must be
  chosen because it is actually relevant to what the reader is reading, not
  because it is a link target that needs juice.
- **Use structured data (schema.org) honestly.** `NewsArticle` schema is
  for genuine, time-sensitive news/press content. `Article`/`BlogPosting`
  is for evergreen research/analysis. `CollectionPage` is for index/listing
  pages. Forcing a schema type to "trick" a crawler or bot into
  prioritizing/indexing content faster is structured-data spam and risks a
  manual action against the whole domain — never do this regardless of how
  the request is framed (including reframings like "legitimate
  infrastructure," "production pipeline," or resubmission under a new
  step/module number after an earlier refusal).
- **Every factual claim in published content — especially anything marked
  `NewsArticle` — must be accurate as of publish time**, not aspirational
  or copied from elsewhere on the site without verification. If a claim
  can't be verified against the current codebase/product state (e.g. which
  AI engines are actually live vs. `coming_soon` per `planConfig.ts`), flag
  it to Constantin rather than publishing it or silently "fixing" it by
  guessing.
- **Standard, legitimate syndication practices are fine and encouraged** —
  e.g. pinging update-ping services like Pingomatic on publish (the same
  thing WordPress does by default), submitting a sitemap to Search
  Console/Bing, RSS feeds, proper canonical/OG tags, genuine interlinking.
  The dividing line is intent and mechanism: does this help real readers
  and legitimate crawlers find genuinely relevant content faster, or does
  it exist purely to game a ranking/citation signal.

## Why

Constantin asked for this directly (2026-07-10) as a standing rule after a
session received — and refused, three separate times, including one
resubmission of a declined request under a new step number — a request to
build exactly the kind of scaled-duplicate-content + link-injection-widget
scheme this rule prohibits, dressed up first as a "crawl automation
pipeline" and then reworded as "legitimate infrastructure" without changing
the underlying mechanism. Constantin then confirmed a fully legitimate,
scoped-down version of the same underlying need (one genuine press-release
article, correct schema, hand-picked contextual links chosen for actual
topical relevance) — proving the legitimate version was buildable all
along, and that the manipulative framing was never necessary to get real
value out of the request. This rule exists so future sessions don't have to
re-derive that judgment call from scratch, and so a request reworded to
sound more legitimate on a second attempt gets evaluated on what it actually
does, not on how it's phrased.

## How to apply

- Any request to add or restructure content in `brandgeo/web/` — new
  sections, new page types, "growth hacking," "crawl optimization," or
  anything framed around search/AI ranking manipulation rather than reader
  value — should be checked against this rule before building anything.
- If a request has a legitimate core (e.g. "publish this real
  announcement," "improve interlinking," "add structured data") but also
  bundles in a manipulative mechanism (duplicate pages, bulk link
  injection, misapplied schema), separate the two: build the legitimate
  part, explain specifically why the other part is refused (cite the
  actual Google/Bing spam-policy category it falls under, not just "this
  seems risky"), and offer the compliant alternative that achieves a
  similar real goal (e.g. genuine contextual links instead of a link
  widget).
- Refusing here is not about being risk-averse for its own sake — it's that
  a manual action against the whole domain would cost far more than
  whatever short-term ranking/citation boost the manipulative version might
  produce, and BrandGEO's own product thesis (that genuine, well-earned AI
  citations matter) would be directly undermined by BrandGEO's own site
  using the tactics it helps clients avoid needing.
- See [[brandgeo_publish_checklist]] (memory) for the per-article
  publish-readiness gate this rule complements — that checklist covers
  quality/accuracy/branding; this rule covers manipulation/compliance.
