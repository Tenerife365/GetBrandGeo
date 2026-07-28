# LinkedIn Posts: Batch, 2026-07-24

Weekly draft from the automated Friday LinkedIn content step.

**Note on this run:** the repo-root `CLAUDE.md` no longer contains a numbered
section structure (no §9, §8, §14, etc. found; the file now holds only four
short sections: Archive Policy, Technical Stack, Active & Delivered State,
Priority Backlog). This is a real change from what recent files in this repo
assume exists, most visibly the Content Pipeline line, which still says
"BG-001 through BG-005 written and live" even though `brandgeo/web/` has
BG-001 through BG-019 live on disk. This run did not try to reconstruct the
missing history; it read the actual current files instead (git log, the
Monday roadmap, the Wednesday-dated asset kits, and the live HTML) as the
source of truth, and adds a new §9 log entry at the bottom of `CLAUDE.md` so
future runs have a thread to follow again. Worth Constantin's attention, not
something this run can safely fix on its own. `docs/` (not the repo root) is
where every recent `linkedin-posts-*.md` and `ROADMAP-*.md` actually lives,
per the repo reorg commit, so this batch is saved there too rather than at
the root as the original task instructions describe.

**What actually published this week:** BG-018 ("We Fixed 5 Rounds of False
Positives in Our AI Visibility Scoring"), confirmed live 2026-07-22 per
`docs/linkedin-post-bg-018-2026-07-22.md`, and BG-019 ("Why Our Scorer
Returns Null Instead of a Rank It Can't Prove"), committed today
(2026-07-24, commit `e6d9af4`) with its hero image present at
`brandgeo/web/images/bg-019-hero.png`. Both already have their own dedicated,
ready-to-post asset kits (`brandgeo/BG-018-linkedin-asset.md`,
`brandgeo/BG-019-linkedin-asset.md`, plus the Wednesday
`linkedin-post-bg-018-2026-07-22.md`), so this batch does not repeat that
copy verbatim. Instead: one fresh angle each for BG-019 (new copy, not in
the asset kit), one post connecting BG-018 and BG-019 as a two-part
measurement-integrity story, and two posts on real, already-published,
never-yet-featured-on-LinkedIn material (the London city research,
published 2026-07-10, and BG-011 on Reddit citation share, published
2026-07-09), following the same "pick the next uncovered thing" logic used
in `linkedin-posts-2026-07-17.md`. Checked for em dashes with a direct grep
on the finished file, zero found.

---

## PERSONAL PROFILE POSTS

Human founder voice, first person, matching the reference tone in
`linkedin-posts-2026-07-14.md`.

### Post 1: Why our own AI visibility score sometimes just says "I don't know"

Most tools in our category will hand you a rank for almost anything you ask them to score.

We built ours to refuse, unless the AI actually claimed one.

Here's the problem we ran into: a bulleted list of "a few good options" and a genuinely ranked "here are the top 3, in order" look identical to a parser that only checks for bullet points. Score the first one like the second, and you've invented a rank nobody actually gave.

So now a position only gets assigned when one of three things is really true in the AI's answer: a real numbered list, a bullet list with explicit ordering language ("ranked," "in order of," and 24 similar phrases, with 17 counter-phrases like "no particular order" that override it), or a stated superlative directly anchored to the brand name, not just a superlative and a brand name sitting in the same sentence.

Everything else returns null now, including a brand mentioned partway down a long answer, which our earlier version used to count as a rank. We took that fallback out on purpose. A score that never says "I don't know" isn't more precise, it's just guessing where you can't see it.

Full breakdown: https://getbrandgeo.com/bg-019.html

*Source: BrandGEO's own scoring pipeline, `_analysis.js` position-detection logic, published as BG-019, July 24, 2026.*

### Post 2: Two weeks, two things we found wrong with our own scoring

I want to be straight about something: the last two pieces of research we published were both about mistakes in our own product.

BG-018, two weeks ago: five separate ways our AI-response pipeline could misread a competitor mention, from a bolded field label mistaken for a company name to a medal emoji that quietly shifted a real client's rank. Fixed with 156 regression assertions and a semantic classifier that can only remove candidates, never invent one.

BG-019, this week: our scorer used to count a brand mentioned anywhere in a long answer as a "ranked" result. It shouldn't have. We now require a real numbered list, explicit ranking language, or a superlative directly tied to the brand name, or the score returns null.

Neither of these was a nice-to-have fix. Both changed real client numbers. We're publishing both in detail instead of quietly patching and moving on, because the alternative, an AI visibility vendor that's never wrong about its own measurement, isn't a credible claim from anyone in this category, including us.

BG-018: https://getbrandgeo.com/bg-018.html
BG-019: https://getbrandgeo.com/bg-019.html

*Source: BrandGEO's own engineering log, both fixes shipped and regression-tested in July 2026.*

### Post 3: The same city, two completely different AI visibility stories

We ran our usual research method in London: real buyer questions, fed to real AI engines, answers compared directly. And within that one city, we found the widest gap we've seen yet between two categories.

Ask which project management tool a London startup should use, and Asana, Trello, and ClickUp each got named by all four engines we tested. The most consistent category in the entire research run.

Ask for the best employment law firm in London, and the engines barely agreed on anything. Claude and Meta leaned toward big City firms. Perplexity recommended almost entirely different, more claimant-focused firms. Only one near-match across all three: two engines returning names for what turned out to be the same firm.

Same city, same research method, same day. One category has a de facto AI-recommended answer already. The other one is wide open.

If you're trying to figure out whether AI visibility is worth prioritizing for your category, this is the actual question: not "is AI visibility important," but "has my category already converged on an answer, or is nobody the AI's default yet."

*Source: BrandGEO's own City Research Program, London dataset (client research-london), 8 commercial-buyer prompts across up to 5 engines, collected 2026-07-10.*

### Post 4: Why OpenAI and Google are both paying Reddit, and what it means for your content

Here's a number that changed how I think about where to put content effort: Reddit alone accounted for 24% of all Perplexity citations in January 2026. One in four sources, across every topic Perplexity was asked about, from a single domain.

On Google's side, 44% of AI Overviews' social-source citations trace back to Reddit too. And it's growing: Reddit's AI citation share in commercial categories like tech and electronics grew 73% in Q1 2026 alone.

This isn't an accident. Google is paying Reddit roughly $60M a year for structured data access. OpenAI is paying an estimated $70M a year for the same kind of thing. Over $130M a year, combined, for one platform's content.

The reason isn't just the licensing deal, it's the shape of the writing itself. Reddit threads are first-person, comparison-heavy, full of disagreement and follow-up replies, written the same way people actually type questions into ChatGPT. Marketing copy is written to persuade. Reddit is written to actually answer the question. For a model trying to synthesize a trustworthy answer, that's a fundamentally more useful shape of text.

If your brand has zero real presence in relevant Reddit threads, that's worth fixing before almost anything else on your content list.

Full research: https://getbrandgeo.com/bg-011.html

*Source: citation-tracking research cited in BG-011 ("Why Reddit Mentions Move the Needle on AI Citations"), published July 9, 2026.*

---

## COMPANY PAGE POSTS

Distinct copy from the personal posts above, more official and
product-and-data-forward, matching the reference tone in
`linkedin-company-posts-2026-07-15.md`. Never a verbatim reshare of the
personal section, even where the underlying finding overlaps.

### Post 1: New from BrandGEO Research: why a rank sometimes has to be "unknown"

New research from BrandGEO: "Why Our Scorer Returns Null Instead of a Rank It Can't Prove."

BrandGEO's scoring pipeline now assigns a brand a ranked position only when an AI engine's answer meets one of three specific conditions: a real numbered list bounded to a plausible range, an explicitly ordered bullet list (confirmed by one of 25 ordering phrases and checked against 17 phrases that indicate the opposite), or a stated superlative grammatically anchored to the brand name.

Every other case, including a brand mentioned in passing within a longer answer, now returns null instead of an inferred rank. BrandGEO's earlier scoring logic used sentence position as a fallback signal; that fallback has been removed, because sentence position and list rank are not the same unit of measurement, and blending them into one score was hiding information rather than adding precision.

Read the full methodology: https://getbrandgeo.com/bg-019.html

*Source: BrandGEO engineering log, position-detection logic shipped and regression-tested, published as BG-019, July 24, 2026.*

### Post 2: Two methodology corrections, published in full, two weeks apart

Over the past two weeks, BrandGEO has published two pieces of research documenting corrections to its own AI-response scoring pipeline, rather than treating them as internal-only fixes.

BG-018 (July 22) detailed five distinct false-positive bugs in competitor-mention extraction, resolved with a 156-assertion regression suite and a semantic classifier constrained to only remove already-extracted candidates, never add new ones.

BG-019 (July 24) detailed a correction to how the pipeline assigns ranked positions, replacing an inferred sentence-position fallback with three explicit, verifiable conditions, so an unclear case now returns null rather than a manufactured rank.

Both are structural changes to how BrandGEO measures AI visibility, not cosmetic updates, and both are documented with the same before/after detail BrandGEO applies to any client-facing finding.

BG-018: https://getbrandgeo.com/bg-018.html
BG-019: https://getbrandgeo.com/bg-019.html

*Source: BrandGEO engineering log, both corrections shipped and regression-tested in July 2026.*

### Post 3: New research: London's AI visibility landscape splits sharply by category

New research from BrandGEO's City Research Program: London.

Across 8 commercial-buyer categories tested against up to 5 AI engines, London produced the widest within-city spread yet recorded in the program. Project management software reached full 4-of-4 engine consensus on three tools (Asana, Trello, ClickUp), the most consistent result of the entire research run. Employment law, tested in the same city on the same day, returned almost no overlap at all between engines, with corporate-firm-leaning and claimant-firm-leaning answers splitting cleanly by engine.

The practical implication: AI visibility priority should be set per category, not per market. A brand entering a category that has already converged on an AI-recommended answer faces a different challenge than a brand in a category where no default answer exists yet.

Full London findings: https://getbrandgeo.com/ai-visibility-for-london.html

*Source: BrandGEO's own City Research Program, London dataset, 8 commercial-buyer prompts across up to 5 AI engines, collected 2026-07-10.*

### Post 4: New research: the data behind why Reddit dominates AI citations

New research from BrandGEO: "Why Reddit Mentions Move the Needle on AI Citations."

Citation-tracking data shows Reddit accounted for 24% of all Perplexity citations in January 2026 and 44% of Google AI Overviews' social-source citations, with Reddit's share of citations in commercial categories like tech and electronics growing 73% in Q1 2026 alone. Google and OpenAI's combined data-licensing payments to Reddit now exceed $130 million a year.

BrandGEO's analysis attributes this to more than the licensing relationship: Reddit's first-person, comparison-heavy, question-and-answer format closely mirrors how users phrase queries to AI engines directly, making it a structurally stronger source for AI-generated answers than persuasion-oriented marketing content.

For any brand building an AI-visibility content strategy, this is a concrete argument for prioritizing genuine Reddit presence alongside owned content.

Full research: https://getbrandgeo.com/bg-011.html

*Source: citation-tracking research cited in BG-011, published July 9, 2026.*

---

## LINKEDIN NEWSLETTER ISSUE

Skipped this week. The only issue published so far (Issue #1, "The AI
Visibility Index, Issue #1: July 2026") went live 2026-07-14. Per the
2026-07-20 roadmap run, the standing rule for this initiative requires
roughly 30 days between issues plus a genuine, checkable reason to believe
new trend data exists; Issue #2 is not expected before roughly 2026-08-13.
Ten days have passed since Issue #1. Nothing to adapt into a Newsletter
issue this week.

Caveat still open, repeating it since it hasn't been resolved yet: creating
the LinkedIn Newsletter container itself (the recurring publication readers
subscribe to) is a one-time manual step only Constantin can do inside
LinkedIn's own interface. Nothing in this repo indicates that step has
happened yet. Whenever Issue #2 is due, its content will be ready to paste
in, but the Newsletter itself needs to exist first.

## NATIVE LINKEDIN ARTICLE

Skipped this week. The most recent native LinkedIn Article (covering the
published Zenodo/arXiv paper) went live 2026-07-16, only 8 days ago. Per the
"roughly every 3-4 weeks, not every single week" cadence, this is too soon
for another one. Next candidate when it comes due: BG-016 ("Cross-Engine
Consensus, When AI Engines Agree, and When They Don't") remains the
strongest unpublished-as-native-Article candidate per the 2026-07-17 batch's
note, unless BG-018 or BG-019's measurement-integrity story overtakes it by
then given the real engagement both have already had this week.

---

**Posting notes:**
- No em dashes anywhere above (verified by direct grep on this file).
- The two BG-019 posts (personal Post 1, company Post 1) and the two BG-018+BG-019 series posts (personal Post 2, company Post 2) are new copy, distinct from `brandgeo/BG-018-linkedin-asset.md`, `brandgeo/BG-019-linkedin-asset.md`, and `docs/linkedin-post-bg-018-2026-07-22.md`. Those three files remain the primary ready-to-post assets for BG-018 and BG-019 individually (including hashtags, first-comment copy, and cross-platform variants); this batch's versions are alternates for variety across the week, not replacements.
- Suggested cadence: personal Post 1 (BG-019) first since it's the freshest and most substantive finding, then spread the rest across the week, roughly one post every 1-2 days, personal profile as primary per `LINKEDIN-STRATEGY.md` §2.
- London company post links to `/ai-visibility-for-london.html`; confirm that exact path is live before posting (not independently re-verified in this run beyond the 2026-07-10 collection date cited in the roadmap).
