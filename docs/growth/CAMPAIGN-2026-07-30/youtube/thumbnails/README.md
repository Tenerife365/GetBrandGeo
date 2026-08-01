# YouTube Shorts thumbnails, CAMPAIGN-2026-07-30

Nine 1280x720 (16:9) thumbnails, one per Short in `../shorts/`.

The `*-cover.png` already in `../shorts/` is the video's own frame 0. It is a
frame, not a thumbnail: it is 1080x1920, it carries scene 1's full sentence,
and at shelf size it is a grey smear. These are the actual custom thumbnails.

## The constraint that decided the design

**A Shorts thumbnail is seen at roughly 210 px wide in a shelf.** A thumbnail
carrying a sentence is a thumbnail that does not get read. The working ceiling
used here is three to five words, and legibility is measured at 210 px, not at
full size.

Two things are measured on every file by the renderer, at the downsampled size:

1. **Cap height in shelf pixels.** Below about 10 px a capital stops resolving on
   a phone. Lowest in this set: **11.6 px**. Highest: 19.2 px.
2. **Luminance spread across the headline band after Lanczos downsampling.** If
   strokes wash into the canvas this collapses toward zero. Floor set at 60/255.
   Lowest in this set: **226.1/255**.

Both are asserted in `../../google-business-profile/_build/render_gbp_and_thumbnails.py`,
so a future edit that sets a headline too small or too long fails the render
rather than shipping.

## Rules the copy obeys

- **No thumbnail promises anything the video does not deliver.** Every headline
  traces to a specific scene of its own Short, quoted in the table below.
- **No thumbnail carries a figure.** Several of these Shorts do carry measured
  numbers, but a figure has to arrive with its denominator, its date and its
  scope in the same breath, and three words do not have room for it. So no digit
  appears on any of the nine.
- **No engine count appears**, for the same reason: these cuts were collected
  against five engines and the product now monitors seven on Growth PRO. Putting
  a count on a thumbnail would mix the two.

---

## Mapping

| # | Thumbnail | Short (in `../shorts/`) | Words on thumbnail | Hook driver | Claim it represents, from that Short's NOTES |
|---|---|---|---|---|---|
| 1 | `thumb-20260729-2200-youtube-1280x720.png` | `20260729-2200-youtube-silent.mp4` / `-scored.mp4` | NO CLICK. NO REFERRER. | #1 loss aversion, pass 1 | Scene 3 verbatim: "No click. / No referrer. / No row in your / analytics." The cut's argument is that the loss leaves no trace. |
| 2 | `thumb-20260729-2318-youtube-1280x720.png` | `20260729-2318-youtube-silent.mp4` / `-scored.mp4` | SOMEONE ELSE IS THE ANSWER | #2 status threat, pass 1 | Scenes 1 and 2: "Someone is already the default answer in your category." / "Not the top result. The answer." Spine is occupancy. |
| 3 | `thumb-20260730-0013-youtube-1280x720.png` | `20260730-0013-youtube-silent.mp4` / `-scored.mp4` | ONE PATTERN HELD | #3 curiosity gap, pass 1 | Scene 2: "Different cities. Different companies. One pattern held." This is the line that opens the loop; the cut closes it at scene 6, "The category decided it. Not the city." |
| 4 | `thumb-20260730-0113-youtube-1280x720.png` | `20260730-0113-youtube-silent.mp4` / `-scored.mp4` | RANK FIRST. NOT NAMED. | #4 contrarian | Scene 1 "You rank first in Google." against scene 6 "No penalty. No downgrade. / Just never named." The cut explicitly refuses "SEO is dead" at scene 7, and this thumbnail does not imply it either. |
| 5 | `thumb-20260730-0216-youtube-1280x720.png` | `20260730-0216-youtube-silent.mp4` / `-scored.mp4` | THE EXACT QUESTION WE TYPED | #5 concrete proof | Scene 1 verbatim: "The exact question we typed:" The cut shows the prompt, the engines, the date and the per-engine result, then states its own limit at scene 7. |
| 6 | `thumb-20260730-0313-youtube-1280x720.png` | `20260730-0313-youtube-silent.mp4` / `-scored.mp4` | RUN THE CHECK YOURSELF | #6 utility | Scene 10, the cut's own CTA, verbatim. The method in the video is genuinely runnable without the product, which is what the thumbnail is promising. |
| 7 | `thumb-20260730-0413-youtube-1280x720.png` | `20260730-0413-youtube-silent.mp4` / `-scored.mp4` | NOT IN THE ROOM | #1 loss aversion, pass 2 | Scene 1: "A shortlist got made this week. / You were not in the room." Deliberately shares no line with thumbnail 1, because the two cuts exist to separate the driver from the execution. |
| 8 | `thumb-20260730-0513-youtube-1280x720.png` | `20260730-0513-youtube-silent.mp4` / `-scored.mp4` | NAMED, NOT RECOMMENDED | #2 status threat, pass 2 | Scene 4: "You can be named and still be the comparison, not the recommendation." Spine is mis-description, not occupancy, so it shares nothing with thumbnail 2. |
| 9 | `thumb-20260730-0613-youtube-1280x720.png` | `20260730-0613-youtube-silent.mp4` / `-scored.mp4` | SAME QUESTION, TWO LANGUAGES | #3 curiosity gap, pass 2 | Scene 1: "The same question, asked twice. / Once in French. / Once in English." The cut's spine is linguistic where thumbnail 3's is geographic. |

Thumbnails 1 and 7 are both loss aversion, 2 and 8 both status threat, 3 and 9
both curiosity gap. That is the replication design in the run NOTES, not an
accident, and the thumbnails are worded to share nothing within each pair so a
performance difference is attributable to the execution.

## Visual system

Dark canvas `#0a0b0e`, violet vignette, one violet rule `#7c3aed` as a fill, the
headline in Inter ExtraBold `#e8e9ed`, and the BrandGEO lockup bottom left.

The lockup gets clear space of at least the mark's own height on every side.
That is measured, not assumed: the renderer finds the transparent scanline
between the mark and the wordmark in the source PNG, derives the mark's share of
the lockup height from it, and asserts both the bottom margin and the headline
floor against it. The lockup is not scaled above its source raster.

Measured contrast, sRGB relative luminance:

| Pair | Ratio |
|---|---|
| headline `#e8e9ed` on canvas token `#0a0b0e` | 16.22:1 |
| headline `#e8e9ed` on the **brightest rendered pixel**, rgb(26, 22, 43) | 14.50:1 |
| white on `#8b5cf6` | 4.23:1, which is why `#8b5cf6` is a fill here and not a word |

The second row is the one that matters. The vignette adds violet light to the
canvas, so the surface the type actually sits on is brighter than the token, and
quoting the token ratio would be quoting a surface that does not exist on these
files. The vignette strength tried initially, 0.17, put muted text at 4.35:1
and failed the assertion; it is 0.12 now.

## Rebuild

    cd ../../google-business-profile/_build
    python render_gbp_and_thumbnails.py
    python verify_gbp_and_thumbnails.py
