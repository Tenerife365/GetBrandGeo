# Run 20260730-0313

**Hook driver: #6, utility.** "Run this check on your own domain in ten
seconds." **This completes the six-driver cycle.** Next run wraps to #1, loss
aversion, on a second pass.

**Music: `tension-minor`** on all four, held constant for all six runs.

---

## Status

| Platform | Silent | Scored | Audio streams (silent) | Band | Scored start |
|---|---|---|---|---|---|
| instagram | 29.000s | 29.000s | 0 | 20 to 30 s, yes | 0.0020 |
| facebook | 29.000s | 29.000s | 0 | 20 to 30 s, yes | 0.0020 |
| tiktok | 33.000s | 33.000s | 0 | 25 to 40 s, yes | 0.0018 |
| youtube | 43.800s | 43.800s | 0 | 30 to 45 s, yes | 0.0017 |

## Safe zones

| Platform | Reserves | Headroom | Binding |
|---|---|---|---|
| instagram | 220/420/180 | 62 / 55 / 101 | furniture, all three |
| facebook | 220/440/180 | 222 / 80 / 71 | type right, logo rect bottom |
| tiktok | 200/360/200 | 56 / 62 / 78 | furniture |
| youtube | 180/380/180 | 436 / 372 / 143 | type |

Margins recovered across the board. Instruction copy is the cheapest of the six
drivers: no ratios, no denominators, no quoted prompt.

## The coordinator's own brief carried a bad claim

All four briefs told the agents BrandGEO does "the part nobody does by hand", or
"the part a person cannot do by hand". Both are universals: claims about every
business, or every person, refuted by one counterexample. Same species as the
superlative ban added after run 5. **Written by the coordinator, not by any
agent.** A faithful agent following the brief would have rendered it.

Two caught it independently and rewrote it before the correction arrived. The
other two had already built past it. Nobody shipped it.

The lesson is not "write better briefs", it is that **checks must run on the
bytes ffmpeg draws, after the render, exiting non-zero.** An instruction is not
evidence of what shipped. Both `facebook` and `youtube` added a permanent
universals regex to their build scripts rather than remembering the rule.

Replacement wording, arrived at separately by three agents and converging on the
same idea: state it as a property of the METHOD, not of people.

- tiktok: `ONE CHECK IS A SNAPSHOT.` / `THE RECORD IS THE WORK.`
- facebook: `It is also one snapshot.` / `The record is the work.`
- youtube: `One run is a snapshot. The record over time is the work.`

**facebook rejected tiktok's exact wording on measurement, not taste.** `One
check is a snapshot.` renders at 874px, leaving 26px of right headroom. That
clears the 20px floor and is precisely the paper pass the brief warns about, and
it would have cut its binding margin from 66px to 26px for a copy preference. It
found a third phrasing at 810px, 90px clear.

## The instruction all four converged on

Three agents independently wrote a version of "do not type your own name", and
the fourth wrote "ask it like a buyer would". Nobody was briefed to. It is the
detail that makes the check actually work: typing your own brand produces a
flattering answer that measures nothing.

## youtube picked a NULL result on purpose

Its only factual claim is from `ai-visibility-for-denver.html`: one real buyer
question, five engines, and no agent name repeating across even two of them.

It chose a null finding because run 5 shipped a unanimous result and then had to
spend a section defending that the winning party was resolvable from the linked
page. With nothing recurring there is no party to resolve. That is the
substitution run 5's own notes recommended, acted on without being asked.

## Three measurement faults, all found in the agents' own code

1. **A wrong boundary detector is wrong UNIFORMLY, which looks like a render
   defect.** instagram hit two: a step detector firing on the fade-out ramp,
   5 to 6 frames early on all seven cuts, and a local-minimum detector returning
   the first frame of a plateau, 2 frames early on all seven. Correct answer is
   the plateau CENTRE, confirmed by sweeping the ink threshold, which changes
   plateau width but not centre. Third run in a row to hit this class.
2. **tiktok's boundary sweep found its quietest real boundary was 252px** (one
   progress step) while intra-scene quantisation noise at delta 6 reached 713.
   It took delta 32 for a 132px gap rather than the 15px that delta 12 gave.
3. **Two agents' own compliance scans failed on correct copy and both fixed the
   rule rather than the result.** facebook's proper-noun check flagged `Open
   ChatGPT` because it only exempted single-word sentence-initial tokens.
   instagram's lowercase sweep used `[a-z]{3,}`, so "do", "it" and "we" never
   entered the comparison set and sentence-initial `Do`, `It`, `We` came back as
   measured subjects.

## The decision this cycle now owes

Raised by facebook, and it needs answering before any comparison is made:

**Decide which metric judges the cycle BEFORE looking at results.** A utility
asset asks for almost nothing, so it will probably lose to loss aversion and
status threat on click-through and win on saves and shares. Saves are the better
predictor of onward distribution. Picking the metric after seeing the numbers
means the winner is whichever metric was looked at first.

Also flagged, and correct: nothing on screen in the utility cuts distinguishes
BrandGEO from a competitor doing the same thing. Right trade for a TOFU utility
asset, wrong one if it is repurposed lower in the funnel.

## The music confound, flagged by three agents independently

`tension-minor` is a minor-key tension bed under generous instructional copy.
`assets/audio/music/clean-utility.wav` exists and is the obvious fit. It was
held constant on purpose, because swapping it would confound the only variable
this campaign measures.

**If driver #6 underperforms, the bed is the most likely confound.** The clean
follow-up is the same picture with `clean-utility` as a MUSIC A-B, not folded
into a hook test.

## Previous run verification, 20260730-0216

All four in band, silent masters at zero audio streams, scored at one with
matching durations. One em dash fixed in `facebook/NOTES.md`. No superlatives,
no Grok or AI Overviews percentage, no measured subject named.

## Upload guidance

Silent masters for organic, paired with each platform's in-app audio. Scored
cuts for paid, embeds and decks.
