# August 14: Companies converge

Static only, at the start of this pass: Threads' existing post 1 (companies
converge, individuals fragment, chained across 2 posts) and `bilingual/`, a
German-language caption for a Berlin bilingual video whose actual video file
is not present in this container (see the note below). This was the thinnest
day of the week and most of it was built in this pass.

**Channels:** threads (feed), facebook (feed, reel), instagram (feed, reel),
tiktok (video), youtube (shorts), linkedin (feed, article, announcement,
founder-repost), gbp (post), x (feed).

**Destination:** bio link for Threads, Instagram, TikTok (no in-caption link
on any of the three); `bg-034.html` for the LinkedIn bundle and the new
facebook/instagram statics and video scripts; the GBP CTA link; `#free-audit`
for x.

**UTM campaign:** `campaign2607` on the pre-existing Threads post. `pulse` on
every link added in this pass. The copied LinkedIn bundle keeps BG-034's own
`utm_campaign=bg-034`, unchanged from source, same reasoning as the BG-033
bundle added to Aug 12.

Per `docs/growth/PUBLISHING-PLAN.md`, week 2, Fri 08-14, this day is scheduled
for Cut 9, LinkedIn carousel and Threads P11, none of which match what is
built here now.

---

## Backfill pass, 2026-08-07

### On the missing bilingual video, and the decision this pass made about it

`bilingual/berlin-de-silent.txt` is a German-language caption for a Berlin
bilingual video. Its actual `.mp4` is not on disk in this session: video and
image files under `docs/growth/social/` are gitignored by design (only the
generator scripts and the text sidecars are meant to live in git, per this
folder's own README), and this session runs in an ephemeral container that
is reclaimed after use, so a file rendered in an earlier session and never
committed does not survive into this one. The brief for this pass offered a
choice for this day's four now-missing video platforms: build a proper
facebook/reel (etc.) or explicitly repurpose the existing bilingual asset
across all four. **Decision: neither.** Repurposing a video this session
cannot open, inspect, or confirm still matches the current brand spec would
be asserting something unverifiable. New English-language script-only video
assets were authored instead (see below), aligned with this day's BG-034
LinkedIn bundle rather than with the German Berlin caption, which stays
exactly as it was, untouched, Threads-adjacent evergreen material for a
future German-language push.

### What was added

- **facebook/feed** and **instagram/feed**: static companions to the
  LinkedIn bundle below, both drawing on `bg-034.html`. Facebook carries the
  Rome exception (9 of 10 names matching through Perplexity) and the "if you
  only do three" callout. Instagram is a four-card carousel walking the four
  blocker-removing checklist items. No image rendered this pass (PNG/JPG
  under `docs/growth/social/` are gitignored and this container is
  ephemeral); each `post.md` alt text is the full card description a render
  would follow.
- **facebook/reel, instagram/reel, tiktok/video, youtube/shorts**: all four
  are script-only fallback this pass, per this pipeline's own permitted path
  for a video that cannot be confidently produced and verified in this
  session (no video rendering tooling was attempted for these four; ffmpeg
  and Pillow are both present in this container, but a from-scratch four-cut
  render at the fidelity the rest of this runway holds itself to was judged
  out of scope for a single pass already covering five days across eight
  platforms). Each format folder has a `post.md` (caption, front matter, and
  an explicit "video not rendered this pass" line) and a `NOTES.md` (hook
  driver, full on-screen text script beat by beat, sourcing, and the target
  technical spec this runway uses elsewhere in the pipeline: 1080x1920, 9:16,
  30fps, safe-zone reserves matching each platform's own established figures
  from earlier days in this same pipeline). All four share one script this
  pass, with the hook line adjusted per platform register; the rest of this
  runway writes a fully independent script per cut, and this is a deliberate,
  disclosed scope reduction for an unrendered fallback, not an attempt to
  pass it off as equivalent work.
- **linkedin (feed, article, announcement, founder-repost)**: BG-034's four
  already-written, already-verified files copied verbatim from
  `docs/growth/linkedin-series-2026-08/BG-034/`, same procedure as BG-033 on
  Aug 12. `og-bg-034.png` copied alongside feed and article, gitignored like
  every other image here, present locally only.
- **gbp/post**: `gbp-8`, the free plan, closing the evergreen GBP series
  (`gbp-1` through `gbp-7` now cover the free audit, Essentials, Growth PRO,
  the full ladder, Radar, Growth and Managed respectively). Free was the one
  rung with no post of its own.
- **x/feed**: a fresh 4-tweet thread on the Rome exception from `bg-027.html`
  and `bg-034.html`, distinct from the Paris, Rome-restaurant, Berlin and
  Madrid examples already used earlier in the week (this is the same Rome
  data set as Tuesday's restaurant example, but the real estate finding
  rather than the restaurant one, and used here to explain the exception
  rather than the rule).

Nothing pre-existing in this folder was edited.
