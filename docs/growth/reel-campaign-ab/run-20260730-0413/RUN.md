# Run 20260730-0413

**Hook driver: #1, loss aversion, SECOND PASS.** The six-driver cycle completed
at run 6. This begins a replication round.

**Music: `tension-minor`** on all four, held constant for all seven runs.

---

## What this run is actually testing, and what it is not

If run 1 performs well, nothing in the data tells you whether LOSS AVERSION
works or whether THAT PARTICULAR CUT worked. A second, deliberately different
execution of the same driver separates the two.

Every agent read run 1's own NOTES first, then built something structurally
different. Run 1 opened on the EVENT on all four platforms, "someone just asked
an AI", so that opening was banned this round.

**The honest limit, flagged by the tiktok agent about its own work: run 7 tests
whether the driver survives a different execution. It does not test which
execution is better.** A per-cut comparison of run 1 against run 7 confounds
driver, copy and visual device together. The interpretable question is whether
BOTH loss-aversion runs beat the other five drivers.

## Status

| Platform | Silent | Scored | Audio streams (silent) | Band | Scored start |
|---|---|---|---|---|---|
| instagram | 29.000s | 29.000s | 0 | 20 to 30 s, yes | 0.0030 |
| facebook | 28.000s | 28.000s | 0 | 20 to 30 s, yes | 0.0028 |
| tiktok | 31.000s | 31.000s | 0 | 25 to 40 s, yes | 0.0030 |
| youtube | 43.800s | 43.800s | 0 | 30 to 45 s, yes | 0.0027 |

## Safe zones

| Platform | Reserves | Headroom | Binding |
|---|---|---|---|
| instagram | 220/420/180 | 61 / 55 / 101 | furniture top and bottom, right a tie |
| facebook | 220/440/180 | 320 / 80 / 89 | logo declared rect on the bottom |
| tiktok | 200/360/200 | 56 / 62 / 78 | furniture |
| youtube | 180/380/180 | 414 / 367 / 116 | type |

## How each cut differs from run 1

- **instagram** Entirely retrospective, opening on an absence inside a record
  the viewer already owns. Its grammatical subjects are ARTEFACTS, `Your
  report`, `An AI answer`, `A missing row`, against run 1's second-person
  accusatory spine. `You` is the subject only in the CTA.
- **facebook** The decision-already-made shape. `The choice narrows before the
  phone rings.` Run 1 said "Yours was not one", which claims the viewer's rank,
  something an ad cannot know. `You were not in the room.` is true either way.
- **tiktok** Opens on an artefact the viewer owns, a channel report, and carries
  the loss as a GRAPHIC: four filled slots and one empty outlined one. The
  four bars are deliberately identical in width, because varying them would
  imply a channel mix, which would be a measurement, and there is none here.
- **youtube** Redefines the loss as CANDIDACY rather than traffic, and locates
  it upstream of the site, the ads and the reviews. Run 1 carried zero figures
  and this carries one, so it also tests whether the driver survives being made
  checkable.

**Three shapes were available and one is deliberately unused.** "The gap between
your analytics and what actually happened" sits closest to run 1's own middle
third, so youtube reserved it for a third pass rather than spending it here.

## Run 1 versus run 7 is not a like-for-like copy comparison

Three agents independently flagged that run 1's copy would fail today's scans:
`You cannot fix what you cannot see`, `CANNOT SEE.`, and similar.

**Audited, and it clears.** The refined rule asks whether a word QUANTIFIES OVER
PEOPLE, not whether it appears. `cannot see` describes one viewer's situation
and is simply true, since AI answers about you are not reported to you. The only
genuine universal anywhere in run 1 is `nobody will mistake it for a licensed
track`, which is prose in a NOTES file about the REJECTED audio bed. Nothing
shipped.

So the comparison is cleaner than the agents feared. Recorded because the flag
was right to raise and the answer is not obvious.

## The pattern that defined this run

**Four agents hit a false positive in their own checking code and fixed the RULE
rather than the RESULT.**

- facebook, earlier run: its proper-noun check flagged `Open ChatGPT`, because
  it only exempted single-word sentence-initial tokens.
- instagram, earlier run: its lowercase sweep used `[a-z]{3,}`, so `do`, `it`
  and `we` never entered the comparison set and sentence-initial `Do`, `It`,
  `We` came back as measured subjects.
- instagram, this run: `Google` and `Google AI` returned as measured subjects,
  being sub-spans of the allowed `Google AI Mode`. Made the matcher span-aware
  and discarded non-maximal matches.
- facebook, this run: reshot a line predicting 17px of right headroom rather
  than shipping under the 20px floor, and rewrote `first` in "before the first
  phone call" even though an ordinal is not a ranking claim, on the grounds that
  a rule whose value is not depending on judgement should not start depending on
  judgement.

A stoplist would have passed every one of those tests and left the next case
broken.

## New rendering trap

**`overlay` rounds an odd `y` DOWN to even** on yuv420p, because chroma is
subsampled 2x2 and a plane cannot start on an odd row. A declared rect computed
from the requested y is then off by one against what rendered, which matters
when that rect is the only thing carrying a dark-on-dark element through the
safe-zone union. Found by youtube. Compute declared rects from the EFFECTIVE
even y.

## Denominator discipline held again

youtube rejected Seattle, despite a similar figure, because Google AI Mode
failed on 5 of its 6 prompts there. It used Washington DC, where all five
engines returned usable data on every prompt and the lineup on the collection
date matches `PLAN_ENGINES.growth`. It also left off every superlative the DC
page asserts about itself.

## Previous run verification, 20260730-0313

All four in band, silent masters at zero audio streams, scored at one with
matching durations. **Zero dashes across the entire run**, the first time that
has been true without a fix. No superlatives, no universals, no Grok or AI
Overviews percentage, no measured subject named.

## Upload guidance

Silent masters for organic, paired with each platform's in-app audio. Scored
cuts for paid, embeds and decks.
