# Run 20260730-0216

**Hook driver: #5, concrete proof.** "Here is the exact prompt, here is the
exact answer." Next run advances to #6, utility, which completes the cycle.

**Music: `tension-minor`** on all four, held constant. The hook is the variable
under test.

Stamp note: the run was briefed as `0213`, one agent created `0216`, and a
second converged onto it rather than split the driver across two folders. That
was the right call. A run is only meaningful if all four platforms sit in one
folder under one driver. The other two were redirected before they wrote.

This file was started by the `instagram` agent, which correctly marked its own
absent rows "not seen" rather than "not built", and filled the youtube row from
an independent ffprobe rather than leaving it wrong. Completed by the
coordinator once all four reported.

---

## Status

| Platform | Silent | Scored | Audio streams (silent) | Band | Scored start |
|---|---|---|---|---|---|
| instagram | 28.000s | 28.000s | 0 | 20 to 30 s, yes | 0.0018 |
| facebook | 29.000s | 29.000s | 0 | 20 to 30 s, yes | 0.0020 |
| tiktok | 34.000s | 34.000s | 0 | 25 to 40 s, yes | 0.0016 |
| youtube | 43.600s | 43.600s | 0 | 30 to 45 s, yes | 0.0017 |

## Safe zones, and the layout prediction

| Platform | Reserves | Headroom | Binding |
|---|---|---|---|
| instagram | 220/420/180 | 62 / 55 / 100 | type, jointly |
| facebook | 220/440/180 | 222 / 80 / 61 | type right, logo rect bottom |
| tiktok | 200/360/200 | 56 / 62 / 78 | furniture |
| youtube | 180/380/180 | 475 / 380 / 102 | the prompt line on frame 0 |

**The prediction was that type would bind for the first time, and it did, on
three of four.** It never became a problem. Nobody truncated a prompt, shrank
below the 44px floor, or swapped in a shorter one. They bought margin by
narrowing furniture instead: instagram shortened its progress bar to the widest
measured type and its right margin went UP, 89px to 100px; tiktok narrowed its
column and took 72pt over 78pt, recovering 56px to 78px.

Facebook's prompt genuinely could not fit on one line, 1242px needed against
800px usable, so its wrap was forced rather than chosen. It refused a 4-line
72px option at 23px of margin as a paper pass.

## The prompt, and why all four agents chose the same one

`"Top-rated property management companies in Chicago"`, quoted byte-exact from
`ai-visibility-for-chicago.html` prompt card 3 of 6.

Four agents chose it independently from six available prompts across six
candidate city pages. Chicago is the only page that survives the engine check:
its lineup on the collection date is exactly today's Growth five, it states its
own substitution of Google AI Mode for retired Meta AI, and it records that all
five engines returned usable data with no collection errors. Both lineup and
denominator are verifiable. `bg-004`, `bg-016` and the first seven city pages
all fail that test, which is why runs 1 to 4 each had to drop an engine count.

## A false claim reached two cuts, and the source was ours

Both tiktok and facebook rendered a version of "the first time all five engines
agreed". I stopped both and asked for a re-render, believing the page had
invited an inference.

**I was wrong about the source and both agents were right.** The Chicago page
ASSERTS it, four times, including inside its FAQPage JSON-LD:

> "the first fully unanimous result (5 of 5 engines) measured anywhere in this
> research program"

My greps for "first time", "first city", "only city" and "never before" all
returned nothing, because the page says "first fully unanimous". The agents
quoted a first-party claim faithfully. It passed a trace-to-a-published-page
test, which is exactly how it reached a render.

**It is not supportable.** Boston, collected the SAME DAY, claims "the most
5/5-dense city measured in this research program" and reports three unanimous
results. Atlanta, also 2026-07-24, has one. With a shared collection date there
is no ordering for Chicago to be first in, and a sibling page asserts a
competing superlative over the same corpus. `ai-visibility-for-losangeles.html`
repeats Chicago's version in a cross-link card.

**One counting trap, and the two agents disagreed about it.** `tiktok` reported
Rome as a counterexample predating Chicago by two weeks, which would have made
the claim false on the day it shipped. `facebook` said Rome's 5/5 counts
restaurants from one engine, not engines. **Facebook is right, and the page
settles it: Rome ran FOUR engines** (Claude, Gemini, Meta AI, Perplexity) on
2026-07-10, so it cannot carry a five-engine consensus at all. A raw `5/5` grep
overcounts. The finding stands on Boston and Atlanta, which is sufficient.

Filed as a task covering all three pages together. Fixing Chicago alone would
leave Los Angeles asserting it.

## The rule this exposes, and it is a real gap

The brief already says provenance runs on the FIGURE, not the page it sits in.
That catches a borrowed third-party statistic. **It does not catch our own page
asserting something false about our own corpus.**

A superlative is a claim about every OTHER page, so it cannot be verified by
reading the page it appears on. Any "first", "only", "most" or "never" needs a
corpus-wide check before it goes on screen. One grep would have caught this.

## What replaced the claim

- **facebook**: `Six questions. / Five engines. / Every one answered.` Not a
  hedge. It vacates the superlative and answers the obvious objection to any
  5-of-5 result, which is whether some engines simply failed to return anything.
  Both figures are page-supported. Recovered 0.6s went to the results beat.
- **tiktok**: cut entirely, not replaced. Its 54 frames went to the two scenes
  that are the actual proof: the answer table to a 4.2s hold and the 5/5 card to
  3.2s. Total frames unchanged, so the music needed no renormalising.

## Three measurement findings, all corrections to rules I wrote

1. **A control diff answers "was this drawn", never "which of two overlapping
   things was drawn."** instagram's bar-animation check reported a frozen bar,
   falsely, because the diff sees the progress TRACK, drawn full width on frame
   0, exactly as it sees the fill sliding across it. Separate overlapping
   elements by a luma threshold between their two values.
2. **A control does NOT cancel noise the text itself creates.** Adding text
   changes libx264 rate control across the WHOLE frame, so the control differs
   from the render even where nothing is drawn. facebook hit a false failure on
   every edge at threshold 6, then measured the noise floor in three
   empty-by-design regions, found exactly 7 in all three, and set the threshold
   above it. Never pick a diff threshold by eye.
3. **A single-method boundary check reports defects that do not exist.**
   youtube's threshold pass showed 27 blank frames in runs of 3 starting one
   frame early, the exact signature of the ffconcat defect. It was the
   threshold: fade tails fall below it either side of a cut. tiktok's sweep
   found the same from the other end, with intra-scene quantisation noise at
   delta 6 exceeding the quietest real boundary.

## Two calls worth keeping

Every agent rendered Google AI Mode as `named` rather than inventing a rank the
source does not give. tiktok called squaring that column "the easiest lie
available here".

facebook kept the row that weakens its own cut: Gemini ranked the company 4th,
not 1st. A proof hook's mechanism is that the viewer can check, so hiding the
weak row would defeat the format.

## Previous run verification, 20260730-0113

All four in band, silent masters at zero audio streams, scored at one with
matching durations, covers and NOTES present. Three em dashes fixed in
`instagram/NOTES.md`. Three apparent AI Overviews percentage hits were prose
documenting figures the agents REJECTED, including in RUN.md itself, so all
false positives. Recording a refusal is not making a claim.

## Upload guidance

Silent masters for organic, paired with each platform's in-app audio. Scored
cuts for paid, embeds and decks.
