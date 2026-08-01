# Run 20260729-2318

**Hook driver: #2, status threat.** "Your competitor is the default answer and
you are not." Next run advances to #3, curiosity gap.

**Music: `tension-minor`** on all four, BrandGEO-composed, no attribution line.

---

## Why the music does NOT vary with the hook, decided this run

The Facebook agent raised it: `tension-minor` was recorded in run 1 as the match
for driver #1, and run 2 uses it again for driver #2, so runs 1 and 2 sound
identical. It asked whether music should vary with the hook the way copy does.

**It should not, and the reason is experimental design.** This is an A-B test
whose variable is the hook. Changing the music at the same time confounds it: a
run that performs better would have two candidate explanations and no way to
separate them. Music is a control, held constant, and the brief's driver-to-track
mapping is a starting assignment rather than a per-run instruction.

The other three tracks stay in the library for when the hook cycle completes and
music becomes the variable under test, or for a run deliberately scoped to that.
Record the choice here every run either way, so the constancy is visible rather
than assumed.

## Status

| Platform | Silent | Scored | Audio streams (silent) | Band |
|---|---|---|---|---|
| tiktok | 32.000s | 32.000s | 0 | 25 to 40 s, yes |
| facebook | 28.000s | 28.000s | 0 | 20 to 30 s, yes |
| youtube | 41.800s | 41.800s | 0 | 30 to 45 s, yes |
| instagram | 28.000s | REBUILD PENDING | 0 | 20 to 30 s, yes |

## Coordinator error, recorded because the rule exists to prevent exactly this

The four agents are given disjoint write scopes so they cannot collide. I then
wrote into `instagram/` myself to fix the music fade while that agent was still
running, and the two writes raced. `instagram-scored.mp4` came out 4.7 MB with
`duration=N/A`, unreadable.

`instagram-silent.mp4` is intact at 28.000s with zero audio streams, and that is
the upload asset, so nothing load bearing was lost. The scored cut is rebuilt
from the silent master after the agent finishes.

**Rule for future runs: the coordinator does not touch a run folder until every
agent for that run has reported completion.** File existence is not evidence an
agent is done; only the completion notification is. Fix ups are a post-pass, not
a concurrent one.

## Measured safe zones

| Platform | Reserves t/b/r | Measured headroom | Binding edge |
|---|---|---|---|
| tiktok | 200/360/200 | 48 / 49 / 61 | right, by design |
| facebook | 220/440/180 | 318 / 69 / 69 | bottom and right, tied |

Both cleared the 20px floor. TikTok's 61px was designed in before the first
render rather than discovered after, which is the correct response to run 1
needing a reshoot from a 1px pass.

## Two agents disagreed on the music fade in, and one was wrong

TikTok added `afade=t=in:d=0.08`, reasoning the track does not start at zero.
Facebook deliberately omitted it, reasoning the track "opens on a downbeat".

Measured: `tension-minor` sample 0 sits at amplitude 0.025 and the track peaks
at 0.206 inside its first 0.1s. Where the beat falls is irrelevant; a click
comes from the instantaneous step out of digital silence. First 64 samples of
the delivered files:

| | before | after |
|---|---|---|
| tiktok-scored | 0.0018 | unchanged, was already correct |
| facebook-scored | 0.0541 | **0.0020**, re-muxed |

Run 1's four scored cuts had the same defect (0.0520) and were re-muxed at the
same time. The fade in is now a rule in the campaign brief, so it stops being a
judgement call.

## Facebook: the two measurement methods disagreed, and the diff was right

Absolute threshold put the bottom ink at 1394, per-frame diff against a
text-free control put it at 1411. The 17px gap is the icon mark's own dark
bottom rows, which differ from the plate by more than 12 levels but fall below
the luma threshold. That made real bottom headroom 49px rather than the 69px the
absolute method claimed, so furniture was the binding constraint again, which is
run 1's Instagram failure with different numbers. The lockup was raised 20px and
re-rendered, for 45 seconds of cost.

**Worth generalising: when two measurement methods disagree, the one that finds
MORE ink is the one to trust.** Both are approximations of the same truth and
only one of them can be over-reporting harm.

## Facebook did not need `replace=1`, and removed the precondition instead

The plate is forced to `rgb24` and the overlay pinned to `format=rgb`, so no
alpha plane exists in the draw chain and the run 1 trap cannot fire. `replace=1`
would in fact have been wrong there, because the accent rule's fade is stacked
boxes that must alpha blend.

Positive proof rather than assertion: the rule is drawn at y=538 and the measured
minimum ink y across all 840 frames is exactly 538. Had it vanished the measured
top would have been 586.

## Upload guidance

Silent masters for organic posts, paired with audio from each platform's own
library. Scored cuts for paid, embeds and decks.
