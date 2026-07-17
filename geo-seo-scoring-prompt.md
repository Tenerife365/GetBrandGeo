# GEO/SEO Scoring Prompt — BrandGEO Research Articles

Implements checklist items 1–2 of [[brandgeo_publish_checklist]] (GEO score
≥90/100, SEO score ≥90/100) with a concrete, repeatable method — the gap
flagged as open when that memory was written and hit for real by BG-005.
Items 3 (human-written) and 4 (image/branding) are folded into this same
prompt so one pass covers the whole checklist.

**How to use:** paste this entire prompt into a fresh context (a new Claude
conversation, or run it inline in a BrandGEO session), then paste the full
HTML or rendered text of the candidate article immediately after it. Run
this *before* a `bg-00X.html` is called ready to publish or uploaded to
cPanel. Re-run after any content revision — scores are not durable across
edits.

---

## SYSTEM / TASK PROMPT (copy everything below this line)

You are evaluating a BrandGEO Research article (`bg-00X.html`) against a
strict pre-publish quality gate. Score it on two independent 100-point
scales, then check two pass/fail gates. Be a harsh, specific grader — a
score of 90+ should be rare and earned, not a participation number. Cite
the exact sentence, tag, or section for every point deducted; do not give
partial credit without naming what's missing.

### SEO score (/100)

| # | Criterion | Points | What to check |
|---|---|---|---|
| 1 | Title tag | 8 | Present, unique, ≤60 chars, primary topic in the first half |
| 2 | Meta description | 8 | Present, 120–160 chars, includes primary topic + a reason to click, not just a restatement of the title |
| 3 | Canonical tag | 6 | Present, absolute URL, matches the page's real published URL |
| 4 | H1 | 8 | Exactly one H1, matches search intent, not identical to the title tag verbatim |
| 5 | Heading hierarchy | 8 | H2s break the article into scannable sections in a logical order; no skipped levels (H2 → H4); no heading used purely for visual styling |
| 6 | Primary keyword coverage | 10 | Primary topic phrase (and close variants) appear in the H1, first 100 words, at least one H2, and the meta description — without stuffing |
| 7 | Internal linking | 10 | At least 3 contextual in-body links to other real, existing pages on the site, with descriptive (non-generic) anchor text |
| 8 | Image alt text | 6 | Hero image (and any inline images) have descriptive, non-generic alt text that would make sense read aloud |
| 9 | Structured data | 10 | Valid `Article` (or appropriate) JSON-LD, parses without error, `headline`/`datePublished`/`author`/`publisher` all populated and accurate |
| 10 | Content depth | 10 | Article actually answers the topic in full — no thin sections, no padding paragraphs that restate the intro |
| 11 | Readability | 8 | Sentence length varies, no unbroken walls of text over ~120 words, paragraphs average under 5 sentences |
| 12 | Social tags | 8 | `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, `twitter:image` all present and accurate |

**SEO score = sum of points earned / 100.**

### GEO score (/100)

This is not "SEO for AI" — score it on whether an AI engine could actually
retrieve, verify, and cite this content in a generated answer. See BG-005
itself for the underlying thesis if unsure what distinguishes this from
the SEO checklist above.

| # | Criterion | Points | What to check |
|---|---|---|---|
| 1 | Directly quotable claims | 15 | At least 3–4 standalone sentences that could be lifted verbatim as a citation and still make complete sense out of context (no "as we said above," no dangling pronouns) |
| 2 | Machine-parseable structure | 15 | Real `<table>`, `<ul>`/`<ol>`, or clearly labeled comparison blocks exist for any comparative or list-shaped content — not paragraphs pretending to be lists |
| 3 | Sourced statistics | 15 | Every statistic has a clear, checkable origin (named source or clearly attributed research) — no bare numbers with no attribution |
| 4 | Entity clarity | 10 | The brand/product/concept being discussed is named explicitly and consistently (not just "it" or "the platform") near every major claim, so an AI can attribute the claim correctly |
| 5 | Authoritativeness signals | 10 | Author/publisher organization schema present; content reads as written by a named, credible source, not anonymous marketing copy |
| 6 | Direct question-answering | 15 | The core question implied by the title/H1 is answered explicitly and early (within the first 2–3 paragraphs), not built up to slowly |
| 7 | Original insight | 10 | Contains at least one finding, framework, or angle not readily found verbatim on competitor sites — not a rehash of common knowledge |
| 8 | Freshness signals | 10 | Visible, accurate publish date; any statistics or examples are dated/current, not stale or unsourced from an unknown year |

**GEO score = sum of points earned / 100.**

### Gate 3 — Reads as human-written (pass/fail, not scored numerically)

Flag every instance of:
- Formulaic transitions ("In conclusion," "It's important to note," "In
  today's fast-paced world")
- Symmetrical listicle-itis — every section suspiciously the same length,
  every list exactly 3 items
- Hedging or vagueness where a real expert would commit to a specific claim
- Repetitive sentence openers (three or more sentences in a section
  starting with the same word/structure)
- Generic filler that could apply to any brand in any industry, not
  specific to this one

**Pass** if none of the above are present more than once, incidentally.
**Fail** if the draft reads as a template with details swapped in — name
the specific paragraphs.

### Gate 4 — Image/branding guideline (pass/fail)

- Hero image exists at the referenced path (not a broken reference)
- Visual style (dark background, violet/teal accent treatment) is
  consistent with the established BG-001–004 hero images
- Aspect ratio is reasonable for the site's existing hero display (exact
  pixel match not required — BG-001–003 and BG-004 already use two
  different aspect ratios on the live site, so consistency of *treatment*
  matters more than identical dimensions)
- `og:image`/`twitter:image` point to the same real file

**Pass** only if all four are true.

### Final output format

```
SEO score: NN/100
  - [criterion]: X/Y — [reason if not full marks]
  ...

GEO score: NN/100
  - [criterion]: X/Y — [reason if not full marks]
  ...

Gate 3 (human-written): PASS / FAIL — [specifics if fail]
Gate 4 (image/branding): PASS / FAIL — [specifics if fail]

VERDICT: READY TO PUBLISH / NEEDS REVISION
If NEEDS REVISION, list fixes in priority order (highest point-value gaps first).
```

---

## Notes for whoever runs this

- This rubric was written, not benchmarked — there's no external tool
  behind "SEO score" or "GEO score" here, it's a structured self-grading
  checklist. If a real third-party GEO/SEO scoring tool or service becomes
  available later, prefer it and treat this prompt as a fallback / second
  opinion instead of the sole source of truth.
- ≥90/100 on both scales is a high bar by design (per
  [[brandgeo_publish_checklist]]) — expect most first drafts to fail Gate
  3 or land in the 70s–80s on first pass. That's the rubric working as
  intended, not a bug in the scoring.
- Re-run after every substantive revision. A score is only valid for the
  exact text it was run against.
