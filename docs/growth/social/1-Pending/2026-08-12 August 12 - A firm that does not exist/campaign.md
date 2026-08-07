# August 12: A firm that does not exist

Video cut 8, status threat (second pass), run `20260730-0513`. Static: GBP 3
(Growth PRO) and Threads' existing post 2 (an emoji changed the score,
chained across 3 posts).

**Channels:** facebook (feed, reel), gbp (post), instagram (feed, reel),
threads (feed), tiktok (video), x (feed), youtube (shorts), linkedin (feed,
article, announcement, founder-repost).

**Destination:** mostly `getbrandgeo.com/ai-visibility-for-chicago.html`
(via the sentence-wording finding), `bg-033.html` for the new BG-033 slots,
`bg-027.html` for the new X thread, and the GBP CTA link, plus the bio link
for Instagram, Threads and TikTok (no in-caption link on any of the three).

**UTM campaign:** `campaign2607` on every link that predates this pass.
`pulse` on the new facebook/feed, instagram/feed and x/feed links. The
LinkedIn bundle keeps BG-033's own `utm_campaign=bg-033`, unchanged from the
source files in `docs/growth/linkedin-series-2026-08/BG-033/`, since that
series has its own established attribution convention that predates and is
independent of this backfill pass's `pulse` tag.

Per `docs/growth/PUBLISHING-PLAN.md`, week 2, Wed 08-12, this day is scheduled
for "Threads P10" (text only), not the Threads post already built here; see
the session report. Also note: the plan names Cut 7 for this day; the video
files actually on disk here are Cut 8, one weekday's worth of drift.

---

## Backfill pass, 2026-08-07

Added the four slots this day was missing against the brief's gap table,
confirmed against the actual files on disk (`docs/growth/CAMPAIGN-2026-07-30/`,
which the brief cites for X thread material, no longer exists in this repo at
all, so the X slot below is fresh copy rather than reused material):

- **facebook/feed** and **instagram/feed**: both draw on `bg-033.html`
  (how to check your own brand's multilingual AI visibility), the article this
  day's LinkedIn bundle publishes. Facebook carries the ten minute method and
  the "one engine produced five zero-overlap comparisons" caution. Instagram
  is a four-card carousel walking the article's three named mistakes
  (reading one run as a measurement, counting a blank as a zero, assuming
  local language always matters most). No image rendered this pass (PNG/JPG
  under `docs/growth/social/` are gitignored and this container is
  ephemeral); each `post.md` alt text is the full card description a render
  would follow.
- **linkedin (feed, article, announcement, founder-repost)**: BG-033's four
  already-written, already-verified files copied verbatim from
  `docs/growth/linkedin-series-2026-08/BG-033/` into
  `linkedin/{feed,article,announcement,founder-repost}/source-0N-*.md`, same
  procedure and naming (`source-01-post.md` through `source-04-founder-
  repost.md`) as BG-030's bundle at the already-posted 2026-08-03 Berlin day.
  `og-bg-033.png` copied alongside feed and article (not tracked by git,
  gitignored same as every other image under this tree; the file exists
  locally for this session only).
- **x/feed**: a fresh 4-tweet thread, not reused material, since
  `CAMPAIGN-2026-07-30/x/POSTS.md` (cited in the original brief as a source
  of unclaimed X content) does not exist anywhere in this repository as of
  this pass. Sourced instead from the unused Berlin employment lawyer example
  in `bg-027.html` (German answer names individual lawyers, English answer
  names commercial firms) plus the study's "13 of 46 comparisons shared
  nothing" headline stat, both distinct from the Paris and Rome examples
  already used on Monday and Tuesday. Character counts verified
  programmatically; all four tweets clear 280 characters with margin.

Nothing pre-existing in this folder was edited.
