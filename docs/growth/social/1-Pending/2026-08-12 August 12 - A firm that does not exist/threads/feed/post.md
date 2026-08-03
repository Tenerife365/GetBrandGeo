<!-- This is a 3-post chain (existing Threads post 2, "an emoji changed the score",
     split for the 500-character cap). The image goes on part 1 only; parts 2 and 3
     are chained immediately after. Each part below is copied verbatim from its own
     sidecar .txt. -->
---
channel: threads
format: feed
asset: threads-2-an-emoji-changed-the-score-1080x1350.png
link: https://getbrandgeo.com/?utm_source=threads&utm_medium=bio#free-audit
alt: "[NEEDS ALT]"
scheduled: 2026-08-12T08:00:00Z
posted_at:
posted_url:
---
Part 1 of 3 (image attached):

An emoji changed one of our clients' scores, and it took us five rounds of bug fixes to get to it.

Part 2 of 3:

Two AI answers, functionally the same: the brand named as the top recommendation, praised in the line right underneath. One answer put a medal emoji in front of the heading, the other didn't. Before we fixed it, the first scored rank 1 and positive sentiment, the second scored no rank at all and neutral. Our position detection counted the characters between the start of a line and the rank digit to decide whether that line was a ranked list item, and the emoji ate the budget.

Part 3 of 3:

After the fifth false positive in six weeks, adding a sixth rule stopped feeling like the right instinct. So we wrote all five up instead, and put a regression suite behind them.
