# Content, SEO & Own-GEO Audit — Findings (Master-Writer, 2026-07-09)

First-pass audit of `brandgeo/web/` per CLAUDE.md §9. Audit only — no site
files changed. Verifies/corrects the §9.1 assumptions and ranks what to fix
or write first.

## 0. Headline: §9.1's structured-data worry was wrong; the real gaps are elsewhere

§9.1 item 3 suspected only `bg-001.html` had JSON-LD. Actual state is much
better: **all four articles (bg-001…004) carry `Article` JSON-LD** with rich
`Organization`/`SoftwareApplication` graphs, and **`faq.html` already has
`FAQPage` schema**. The real structured-data gaps are the homepage and the
schema's *coverage*, not its existence.

## 1. Findings by area

### 1.1 Structured data

| Page | JSON-LD | Notes |
|---|---|---|
| bg-001…004 | ✅ `Article` + Organization/SoftwareApplication graph | Good |
| faq.html | ⚠️ `FAQPage` — **only 5 of 18 visible questions** | Biggest quick win |
| index.html | ❌ none | Homepage has zero schema — no `Organization`, `WebSite`, or `SoftwareApplication`. For a product whose thesis is entity signals, this is the most ironic gap on the site |
| blog.html | ❌ none | Could carry `Blog`/`ItemList` |
| terms/privacy/cookies/thanks | ❌ none | Fine — low value, skip |

FAQ schema's 5 questions: What is AI Visibility / What is GEO / Which engines /
How is the Score calculated / What does the free audit include. The other 13
visible questions (KNOW-PARTIAL-MISSING, position numbers, pricing, refund,
etc.) are absent from the schema — exactly the definitional Q&A content AI
engines quote.

### 1.2 Meta / SEO basics

- **Zero `rel="canonical"` tags anywhere on the site** (0/10 pages). Quick,
  mechanical fix; protects against www/non-www and http/https duplicates.
- **index.html metadata is the weakest on the site**: no og: tags, no
  twitter: tags, no canonical, no JSON-LD. The four articles each have 5 og +
  2 twitter tags — the homepage has none.
- faq.html: no og/twitter tags either.
- privacy.html + cookies.html: no meta description (minor).
- **sitemap.xml `lastmod` is stale**: blog.html and bg-001.html were edited
  2026-07-08 (the #98 merge) but sitemap says 2026-06-20. cookies.html isn't
  listed at all (thanks.html excluded — correct).
- robots.txt: ✅ already excellent — explicit allows for GPTBot, ClaudeBot,
  PerplexityBot, OAI-SearchBot, Google-Extended with correct
  grounding-vs-training reasoning in comments. No changes needed.

### 1.3 Interlinking (§9.1 item 2 — confirmed real, uneven)

- **bg-001 — the cornerstone post — has zero in-body contextual links out.**
  Its only article link is the "Read BG-002 →" next-link. Meanwhile bg-002
  and bg-004 both link *into* bg-001 twice each. The hub receives links but
  gives none.
- bg-003: also zero in-body links (only the next-link to bg-004).
- bg-002 (2 in-body → bg-001) and bg-004 (2 in-body → bg-001, bg-003) show
  the correct pattern — contextual, anchor-text-rich prose links.
- **faq.html never deep-links to a specific article** — only generic nav/CTA
  links to /blog.html, despite 18 answers overlapping directly with article
  topics (e.g. the "How is AI Visibility different from SEO?" answer is
  BG-001's exact thesis; "How does BrandGEO measure" overlaps BG-003).
- **index.html links to zero individual articles** — internal links are just
  /blog.html and /faq.html once each.
- **The next-link chain is manually maintained** (bg-001→002→003→004): every
  new post requires editing the previous post's next-link. Maintenance risk
  confirmed; acceptable at 4 posts, worth a "related posts" block convention
  before BG-005…008 quadruple the surface.

### 1.4 Content gaps (§9.1 items 1, 4, 5 — confirmed)

- BG-005…008 confirmed as "Coming soon" stubs in blog.html (lines 265–308),
  no pages exist.
- Glossary: bg-001's six-disciplines section (GEO/AEO/LLMO/Semantic/Entity/
  Technical SEO) exists as `<h3>`s with **no anchor ids** — can't even be
  deep-linked today. A dedicated glossary page remains a strong AI-citation
  play (with `DefinedTerm` schema).
- Case studies: BG-004 is the only one; no pipeline.

## 2. Prioritized plan (each item = one scoped Task chat)

**Items 1 and 2 shipped 2026-07-09 — see CLAUDE.md §9.6 and §9.7 for the
full writeup.** Both code-complete and verified locally; not live until a
manual cPanel re-upload of the same 11 changed files (§9.7 touched no
files beyond that list). Item 2 also fixed two pre-existing bugs found
along the way: bg-001 and bg-003 each had a "what comes next" callout
naming the following article in plain bold text instead of an actual link.

1. **Technical quick wins, one pass, ~30 lines of HTML total** — expand
   FAQPage schema from 5 → all 18 questions; add canonical to all 10 pages;
   add `Organization` + `WebSite` + `SoftwareApplication` JSON-LD + og/twitter
   tags to index.html; fix sitemap lastmod + add cookies.html; add anchor ids
   to bg-001's six discipline headings. Highest value-per-effort on the site,
   and everything later inherits it. Scope: all files in `brandgeo/web/`
   except article bodies.
2. ✅ **DONE 2026-07-09.** **Interlinking pass** — added 3 contextual in-body
   links each to bg-001 and bg-003 (mirroring bg-002/bg-004's existing
   pattern, plus fixing 2 broken "what comes next" callouts along the way);
   deep-linked 6 FAQ answers to their matching articles across all 4
   posts; linked 2 flagship articles from index.html. Scope: bg-001,
   bg-003, faq.html, index.html.
3. ✅ **DONE 2026-07-09 — code-complete, NOT yet cleared to publish.**
   **Write BG-005 ("GEO vs SEO: The Fundamental Difference")** — first of the
   four stubs. Wrote `bg-005.html`, wired into `blog.html`
   (Featured/grid/footer), `bg-004.html`'s forward link, and `sitemap.xml`.
   Introduced the "related posts" block convention (a 4-card grid linking
   BG-001–004) as planned — retrofitting it onto BG-001–004 is a good task
   for whichever session writes BG-006. **Blocked from actually publishing
   by two gaps, see CLAUDE.md §9.9:** no hero image exists (no image-gen
   tool available, `/images/bg-005-hero.png` is a broken reference) and the
   new pre-publish checklist's GEO/SEO score ≥90/100 gates have no defined
   scoring method yet. Then BG-006/007/008 as separate sessions.
4. **Glossary page** (`glossary.html`) — six disciplines + core product terms
   (AI Visibility Score, KNOW/PARTIAL/MISSING, mention rate), `DefinedTerm`
   schema, linked from every article footer + FAQ. Strong citation target.
5. **Dogfooding data (§9.2)** — run BrandGEO's own collection on "BrandGEO"
   vs peec.ai et al. via the dashboard; feed results into BG-008 ("AI
   Visibility by Industry") or a dedicated "we audited ourselves" post.
   Needs Constantin to add BrandGEO-as-client prompts in the dashboard first.
6. **Case-study pipeline** — template for anonymized client audits in the
   BG-004 mold. Later; depends on more client data existing.

Note per §9.3: items 1–2 touch `blog.html`/`bg-00X.html`/`index.html`, which
Master-Redesign Phase 4 may also touch (visual pass). Check CLAUDE.md for
Phase 4 status before starting either; don't run both on the same files in
the same window.

Every change here is local-only until a manual cPanel re-upload from
`C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web\` — same as
#84/#99.
