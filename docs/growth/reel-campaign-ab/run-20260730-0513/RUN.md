# Run 20260730-0513

**Hook driver: #2, status threat, SECOND PASS.** Replication round. Next run
advances to #3, curiosity gap, second pass.

**Music: `tension-minor`** on all four, held constant for all eight runs.

---

## Status

| Platform | Silent | Scored | Audio streams (silent) | Band | Scored start |
|---|---|---|---|---|---|
| instagram | 28.500s | 28.500s | 0 | 20 to 30 s, yes | 0.0026 |
| facebook | 26.400s | 26.400s | 0 | 20 to 30 s, yes | 0.0026 |
| tiktok | 31.000s | 31.000s | 0 | 25 to 40 s, yes | 0.0030 |
| youtube | 43.000s | 43.000s | 0 | 30 to 45 s, yes | 0.0027 |

## Safe zones

| Platform | Reserves | Headroom | Binding |
|---|---|---|---|
| instagram | 220/420/180 | 62 / 55 / 100 | furniture, type 111px clear |
| facebook | 220/440/180 | 382 / 93 / 45 | **type**, tightest of the run |
| tiktok | 200/360/200 | 56 / 80 / 64 | **type**, 65px clear |
| youtube | 180/380/180 | 496 / 307 / 137 | type |

## All four found the same shape, by four different routes

Run 2's spine on every platform was OCCUPANCY: a rival holds the slot, a default
repeats. That was banned this round. Three shapes were offered. **All four
agents independently chose MISDESCRIPTION**, and each entered it differently:

- **tiktok, the asymmetry.** `BEING ABSENT / IS QUIET.` against `BEING WRONG /
  SOUNDS RIGHT.` The sharpest line in the campaign, and one the occupancy
  framing structurally cannot reach.
- **facebook, ownership.** `You did not write it. / You do not get a copy.` Then
  `It reaches your buyer with your name on it.`
- **instagram, authorship.** `It was assembled from what other pages say. / Your
  own site is one source in that.` Its engine block sits under `WHO IS WRITING
  IT` as a list of authors rather than a scoreboard.
- **youtube, the category error.** `You can be named / and still be the
  comparison, not the recommendation.`

**None carries a figure, and that is correct.** The corpus cannot currently
evidence misdescription. Inventing a number for it was the easy failure and
nobody took it.

**A product-truth correction fell out of the swap**, spotted by youtube: run 2
claimed engines CONVERGE ("no page two of an answer"); this pass claims they
DIVERGE ("Each engine writes its own version. They do not have to agree."). The
second is the more defensible claim and is why BrandGEO stores a row per engine.
`response_snippet` and `sentiment` are stored separately from `brand_mentioned`,
so misdescription is a capability the product actually has, not a fear it
invents.

## Four verification findings, all corrections to how this campaign checks itself

**1. A scan that passes everything is indistinguishable from one that works.**
instagram's measured-subject scanner returned 34 false positives; fixing those
surfaced two real harvester bugs that had been letting genuine candidates
through, so it was silently broken in BOTH directions. It then injected an
actual company name from a city page, confirmed the scan fired, restored, and
re-ran to exit 0. **Every green result in this campaign came from a scanner
nobody had proven could go red.** Now the top rule in the brief.

**2. Intent to differ is not evidence of difference.** youtube wrote its cut
deliberately not to reuse run 2, read both files, and still shipped a seven-word
run from run 2's product beat into a rendered layer, plus a collided list
header. An n-gram diff of the drawn strings caught what reading did not.

**3. Take the FLOOR of a plateau centre, never the round.** An even-width
plateau has no integer centre, so rounding gives a uniform +1 frame offset that
reads exactly like timeline drift. The tell it was the detector: the offset
appeared at ink thresholds 90 and 150 and vanished at 70 and 120. **A render
fault cannot come and go with the measurement threshold.**

**4. If furniture ALWAYS binds, the safe-zone pass is not testing the copy.**
Run 2's TikTok progress bar set x0, x1 and y1 on every frame, so its measured
box described the bar. Replacing it with a vertical left rail let type own the
right edge for the first time on that platform. Report both numbers: the union
the platform crops against, and the widest TYPE extent, which is what a copy
edit moves.

## Judgement calls worth keeping

tiktok adjudicated `cannot` rather than rewriting it: `YOU CANNOT / EDIT IT.`
describes one viewer's position and quantifies over nobody, so it stayed under
the brief's 2026-07-30 refinement. The scanner flags, judgement resolves,
correct copy survives.

tiktok also labelled its illustrative card `FOR EXAMPLE` before any row appears,
so `wrong category` / `old pricing` / `a dropped service` cannot be misread as a
captured answer.

youtube declined the CC BY 4.0 line on the correct grounds: there is no voice in
this run, and the credit belongs to the LibriTTS model, so adding it would be a
false statement about the asset rather than harmless over-attribution.

## Previous run verification, 20260730-0413

All four in band, silent masters at zero audio streams, scored at one with
matching durations, covers present. Four em dashes fixed in
`instagram/NOTES.md`. No Grok or AI Overviews percentage, no superlative, no
measured subject named.

## Upload guidance

Silent masters for organic, paired with each platform's in-app audio. Scored
cuts for paid, embeds and decks.
