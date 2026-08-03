# Content pipeline: what we render, and where it goes

Adopted 2026-08-03, mirroring the TalentWeLove convention agreed 2026-08-01.
Same rules, one difference: **this library stays on the local machine, not on
Drive.** Every deviation from TWL is marked below and has a reason.

## The rule that everything else follows

**One campaign renders one final asset per slot. No alternates.**

No silent cut beside a scored cut. No three covers to choose from. If a choice
needs making, it is made before the render, not after it, and it is made once.

TWL learned this the expensive way: 612 files and 108 MB for one campaign, and
the choosing never happened, so eight sets sat unposted. **BrandGEO has the same
problem right now.** `CAMPAIGN-2026-07-30` is 628 files, nine sets, every video
rendered twice, and none of it posted. That folder is the reason this one exists.

## Where things live

```
docs/growth/social/
  0-Voice-samples/   raw voice recordings. Source material, never published.
  1-Pending/         campaigns built and not yet posted
  2-Posted/          campaigns that have gone out
  _scored/           see the deviation note at the bottom
```

**The repository holds the generators and the editable sources, not the finished
media.** `scripts/` keeps the renderers and `docs/growth/og-cards/` keeps the
card builder. Rendered video and intermediate frames are regenerable and belong
in neither git nor a backup. `docs/growth/social/` is gitignored for exactly
this reason, the same way `CAMPAIGN-*` already was.

## Campaign folder naming

```
2026-08-03 August 3 - Berlin language gap
```

Numeric prefix first so folders sort chronologically, the written month kept
because it reads better, then a short title naming the focus.

The numeric prefix is not decoration. `August` sorts before `December` and after
`April`, so a name-ordered list would be in alphabetical month order, which is
no order at all.

**DEVIATION FROM TWL: a campaign here is one posting day, not one launch.** TWL
ships campaigns; BrandGEO is depleting a built runway on a daily cadence. Mapping
one campaign to one day means the folder you open in the morning is the complete
answer to "what goes out today", across every channel, and it still satisfies
"one asset per slot" because a day carries one Instagram post, one Facebook post
and so on.

## Inside a campaign

```
2026-08-03 August 3 - Berlin language gap/
  campaign.md                what this is, the destination link, the UTM
  linkedin/
    feed/     image.png   post.md
    article/  cover.png   post.md
  facebook/
    link/     link.png    post.md
    reel/     reel.mp4    cover.jpg   post.md
  instagram/
    feed/     feed.png    post.md
    reel/     reel.mp4    cover.jpg   post.md
    story/    story.png   post.md
  tiktok/
    video/    video.mp4   cover.jpg   post.md
  youtube/
    shorts/   short.mp4   cover.jpg   post.md
  x/
    feed/     image.png   post.md
  threads/
    feed/     image.png   post.md
  gbp/
    post/     image.png   post.md
```

Format folders use each channel's own word: a Reel on Instagram and Facebook, a
Short on YouTube, plain video on TikTok. Normalised names would be easier for a
poster and harder for a human checking a folder before it goes out, and the human
check is the one that catches mistakes.

Not every campaign uses every channel. Leave out what you are not posting rather
than creating an empty folder.

## post.md

One per format folder. A person reads it as a caption; a future poster reads the
front matter.

```markdown
---
channel: instagram
format: reel
asset: reel.mp4
cover: cover.jpg
link: https://getbrandgeo.com/?utm_source=instagram&utm_medium=reels&utm_campaign=campaign2607#free-audit
alt: "Text card reading: there is no analytics event for an answer you were left out of"
scheduled: 2026-08-05T08:00:00Z
posted_at:
posted_url:
---
The caption exactly as it should appear.

#AIVisibility #GEO
```

`posted_at` and `posted_url` stay empty until the post goes out. **Filling them
is what makes a campaign eligible to move from `1-Pending` to `2-Posted`**, so
the permalink is captured at the moment it exists rather than hunted for later.
This replaces the tickbox ledger that was in `PUBLISHING-PLAN.md`.

`alt` is not optional. Every channel supports alternative text and a post without
it is unreadable to anyone using a screen reader.

`link` carries the UTM. Three channels cannot carry a link in the caption at all,
so for Instagram feed and reels, TikTok, and Threads the `link` field records the
bio link that is live for that platform, and the caption says "Link in bio."

## Moving a campaign

`1-Pending` to `2-Posted`, by hand. There is no approved folder: a campaign is
approved by being built, because the visual, design, message and content
decisions are made before the render.

## Copy rules

Everything in `post.md` is client-facing and obeys house style:

- No em dashes or en dashes. En dashes between digits are correct and stay.
- None of: delve, unlock, unleash, elevate, harness, leverage as a verb,
  game-changer, supercharge, revolutionize, seamless, robust, cutting-edge,
  transformative, "let's dive in", "it's not just X, it's Y", or a
  rhetorical-question opener.
- No invented statistic, client or testimonial. Every figure traces to a file, a
  query or a cited source. If it cannot be sourced, cut it.

**One BrandGEO rule TWL does not have: a measurement keeps the denominator it
was measured with.** If a caption reports what four engines answered on 10 July
2026, that stays four engines even though the product now covers seven. Rewriting
a past measurement to match the current product falsifies the record. Present
tense claims about what the product covers are different and must name the plan,
because the engine set varies by tier.

## The two deviations from TWL, both deliberate

**1. Local, not Drive.** TWL's library is on Google Drive because it is
reviewable from a phone and a future auto-poster reads from it. BrandGEO keeps
its library on the local machine by decision. Everything else about the structure
is identical.

**2. `_scored/` exists, and TWL would not allow it.** TWL's rule says delete the
alternate. BrandGEO's `-scored.mp4` cuts carry an original music bed and have a
documented separate use: paid placements, embeds and decks, where in-app audio
does not exist. They are moved out of the campaign tree rather than deleted, so
campaign folders obey "one asset per slot" while nothing is lost.

**The rule that governs every video upload stays: post the `-silent` master.**
The silent cuts carry no audio stream at all, so the platform pairs them with
in-app audio, which is what earns distribution on Reels, TikTok and Shorts.
Anything in `_scored/` is not for organic posting.
