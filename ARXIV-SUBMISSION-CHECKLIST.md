# arXiv Submission Checklist: Cross-Engine Consensus Paper

Paper: "Cross-Engine Consensus in AI-Generated Brand Recommendations: An
Empirical Study Across Seven Cities and Five Large Language Models"

Files: `arxiv-paper/main.tex` (source), `arxiv-paper/main.pdf` (compiled,
10 pages, verified clean with `pdflatex`, no em dashes in the rendered
text, no undefined citations, no fatal errors), plus renamed copies
`brandgeo-cross-engine-consensus.tex`/`.pdf` for convenience.

This is written as a numbered, do-this-yourself checklist per the
project's execution-delegation convention. Claude prepared the paper and
researched the process; the actual account creation and submission need
your own login.

## 0. The one real blocker, read this first

arXiv changed its endorsement policy on 2026-01-21. As of that date, a
first-time submitter to a category (which this is, for both the paper and
for you as an author) needs one of two things:

1. Both an institutional academic/research email address on your arXiv
   account, and prior authorship on an existing accepted arXiv paper in
   the same subject area. Or:
2. A personal endorsement from an already-established arXiv author in the
   same subject area, obtained through arXiv's own endorsement code
   system.

You have neither an institutional email (autonomo, no academic
affiliation) nor a prior arXiv paper, so path 1 is closed. Path 2 needs
you to find one working scientist active in a related field (information
retrieval, NLP, human-computer interaction, digital marketing/computer
science) willing to vouch for you. arXiv staff cannot do this and cannot
waive the requirement. It is a real, external dependency, not a form to
fill in.

Two ways to handle this. Pick one, or both:

- **Try for arXiv anyway.** Realistic paths to find an endorser: (a) a
  professor or PhD researcher you already know personally, even loosely;
  (b) cold-emailing an author of a recent, closely related paper, for
  example the GEO paper this work cites and builds on, arXiv:2311.09735
  (its authors are exactly the right kind of endorser, and the paper
  gives you a genuine, specific reason to reach out), with the PDF
  attached and a short, honest note explaining what the paper is and
  asking if they would be willing to endorse; (c) posting in a relevant
  academic Slack/Discord/subreddit (for example r/MachineLearning) asking
  if anyone active in cs.IR would review and consider endorsing. Budget
  for this to take days to weeks and to possibly fail, since it depends
  entirely on a stranger's goodwill.
- **Use a no-endorsement preprint server instead, now, in parallel.** This
  achieves the actual underlying goal: a real, permanent, citable,
  crawlable, DOI-bearing research artifact that AI engines and search
  engines can index and cite back to BrandGEO, without the endorsement
  bottleneck. Recommended: **Zenodo** (CERN-run, free, issues a real DOI
  immediately on upload, no gatekeeping, indexed by Google Scholar, and
  widely accepted as a legitimate open-access repository for exactly this
  kind of applied/industry empirical work). **SSRN** is a secondary
  option, also DOI-bearing and Google Scholar indexed, more of a
  working-paper convention but it does accept CS/IR-adjacent work.

**Recommendation: do both, in this order.** Publish to Zenodo first (same
day, no blocker, gets a real DOI and a citable URL usable everywhere
immediately: LinkedIn, the site, the Index report, outreach). Pursue
arXiv endorsement in parallel as a slower, higher-prestige upgrade. If it
comes through, arXiv accepts and even encourages papers that already
exist as a preprint elsewhere, so nothing is lost by publishing to Zenodo
first.

## 1. If pursuing arXiv: category selection

- **Primary category: `cs.IR`** (Information Retrieval). This paper's
  core contribution, measuring convergence and divergence in what a
  retrieval-and-generation system surfaces for a query, sits squarely in
  cs.IR's scope (recommender systems, ranking, retrieval behavior).
- **Optional cross-list: `cs.CL`** (Computation and Language), relevant
  given the paper's bilingual/language-effect findings (Berlin, Madrid,
  Paris, Rome).
- **Optional cross-list: `cs.CY`** (Computers and Society), relevant given
  the consumer-facing, market-structure implications discussed in
  Section 5.
- Do not cross-list into more than two or three categories total; arXiv
  moderators can reject over-broad cross-listing.
- Endorsement is required per category. If cross-listing, a separate
  endorsement may be needed for `cs.CL`/`cs.CY` unless `cs.IR`'s
  endorsement domain already covers them. Start with `cs.IR` alone; add
  cross-lists later via arXiv's revision/reclassification process once
  it is clear whether one endorsement covers all three.

## 2. Account setup (arXiv)

1. Go to `arxiv.org`, then Register. Use a real, working email checked
   regularly (the endorsement code arrives here).
2. Fill in name and affiliation exactly as they should appear on the
   paper: `Constantin Daniel` / `BrandGEO`.
3. Once registered, go to Submit, then New Submission. arXiv will state
   at this point whether the account is already endorsed (unlikely, per
   Section 0) or needs an endorsement code.
4. If an endorsement is needed: arXiv's submission flow generates a
   unique endorsement request link/code for the specific category. Send
   this, along with the paper PDF and a short explanation, to whoever
   agrees to endorse (see Section 0's options). They enter the code on
   arXiv's site themselves; self-endorsement is not possible.

## 3. Preparing the actual submission package

- Uploading both `main.tex` and `main.pdf` is not how arXiv works. arXiv
  wants the LaTeX source (it recompiles on their own servers), or a
  source-plus-PDF combination for specific cases. The safe, standard
  path: submit `main.tex` alone. It has zero external file dependencies
  (no separate `.bib` file, no image files, no custom `.sty` files beyond
  standard TeX Live packages already on arXiv's servers), as a single
  `.tex` file, or zipped if arXiv's uploader requires an archive.
- arXiv's own TeX Live version may differ slightly from this sandbox's.
  If arXiv's auto-compile step reports an error, the single most likely
  cause is a package version mismatch. Try removing the `\usepackage{array}`
  line first (it only affects one table's cell alignment, not the
  paper's substance) if that specific line causes trouble.
- Compare the compiled PDF arXiv produces against the 10-page PDF already
  verified in `arxiv-paper/main.pdf` before finalizing the submission
  (arXiv shows a preview before confirming).

## 4. Submission metadata (the actual web form fields)

- **Title:** Cross-Engine Consensus in AI-Generated Brand Recommendations:
  An Empirical Study Across Seven Cities and Five Large Language Models
- **Authors:** Constantin Daniel (BrandGEO)
- **Abstract:** paste directly from the compiled paper's abstract. Do not
  retype by hand, to avoid a transcription error.
- **Comments (optional but recommended):** something like "10 pages, 2
  tables. Dataset collected via BrandGEO's production AI-visibility
  monitoring pipeline." This is a free-text field readers see on the
  abstract page, a good place to briefly flag the applied/industry origin
  of the dataset for full transparency.
- **Subject class:** cs.IR (primary), per Section 1.
- **License:** choose **CC BY 4.0** (Creative Commons Attribution). This
  is the most permissive license arXiv offers. It explicitly allows
  anyone, including AI systems and search engines, to reproduce, cite,
  and quote the paper with attribution, which is exactly what serves the
  paper's stated purpose of supporting BrandGEO's GEO, AEO, and SEO
  visibility and authority. A more restrictive license (arXiv's default
  non-exclusive license, or a no-derivatives license) would work against
  that goal.
- **DOI / journal reference:** leave blank. This is a first submission,
  not tied to a journal.

## 5. After it is live (arXiv, Zenodo, or both)

1. Add the permanent URL (arXiv abstract page and/or Zenodo DOI landing
   page) to getbrandgeo.com. A natural home is a new short blog post, or
   an addition to the existing AI Visibility Index/research hub pointing
   to it, plus a mention in `llms-full.txt` (CLAUDE.md Section 9.20),
   since that file already exists to give AI systems a citable index of
   BrandGEO's research.
2. Add it to the Organization/Person JSON-LD on `index.html` if there is
   a natural `sameAs` or `citation` field to extend. A real academic
   citation is a strong trust and authority signal, exactly the kind of
   entity disambiguation Section 9.20 already built.
3. Cite it from a LinkedIn post, ideally a native Article rather than a
   link-out post, per `LINKEDIN-STRATEGY.md`'s guidance on algorithmic
   throttling of off-platform links, and from the next scheduled LinkedIn
   content batch.
4. Consider a short, plain-language BrandGEO Research article summarizing
   the paper's findings for a non-academic reader, cross-linking to the
   arXiv/Zenodo record as the primary source. This is the same cite-the-
   primary-source pattern already used throughout BG-005 through BG-016.
5. If arXiv endorsement succeeds after a Zenodo-first publication, submit
   to arXiv referencing the Zenodo DOI as a note. arXiv explicitly permits
   and does not penalize simultaneous or prior preprint posting elsewhere.

## 6. What not to do

- Do not submit to arXiv under a misleading "independent researcher"
  framing to dodge institutional-affiliation questions. The affiliation
  line "BrandGEO" is accurate and should stay as-is. Misrepresenting
  affiliation is a real integrity problem on an academic record, not a
  marketing choice.
- Do not fabricate co-authors purely to gain automatic endorsement
  eligibility, for the same reason.
- Do not resubmit a reworded version of a rejected or declined submission
  hoping moderators will not notice. If arXiv moderation ever declines the
  paper (unlikely given its factual, disclosed-limitations framing, but
  possible on category-fit grounds), address the actual stated reason
  rather than resubmitting unchanged.
