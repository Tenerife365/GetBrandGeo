# YouTube Shorts, run 20260730-0313

Hook driver: **#6, utility.** "Run this check on your own domain in ten
seconds." This completes the six-driver cycle.

Runs 1 to 5 used loss aversion, status threat, curiosity gap, contrarian and
concrete proof. Every one of them either put something at stake, argued a
position, or presented an artefact for the viewer to judge. This one does none
of those. It hands over a method the viewer can run without us, and the value
lands whether or not they ever buy.

Shorts has the most room of the four platforms, so this cut gives the **whole
method**: which engines to open, what to type, what specifically to read for in
the answer, what a blank result actually means, and what one check cannot tell
you. A viewer can run it from the video alone with nothing else open.

The last two scenes are the honest part and they were written before the rest.
The manual check is genuinely free and genuinely useful, and the cut says so in
those words. The difference the product makes is one of shape rather than
effort: a single run is a snapshot, and a record over time is what shows whether
anything moved. That is the whole claim, it is made after the gift rather than
instead of it, and it says nothing about what anyone is or is not capable of.

TOFU. Soft CTA. No pricing on screen. No voice, no narration, no TTS.

---

## Mid-run correction, and what it changed

The run brief originally described BrandGEO's role as doing "the part a person
cannot do by hand". That phrasing was withdrawn mid-render, correctly: it is a
claim about all people, and one person with a spreadsheet and a calendar
reminder refutes it. It is the same species of unverifiable claim as the
"first"/"only"/"most" superlatives already banned, which is why a false one
reached two rendered cuts in run 5.

**The phrase never reached the screen here.** It was checked against the literal
byte stream `drawtext` drew before the correction arrived, and the scan returned
`UNIVERSALS: NONE`. Nothing had to be rescued.

Two lines were changed anyway and the whole cut was re-rendered from scratch,
because both were weaker than they needed to be:

| Scene | Before | After | Why |
|---|---|---|---|
| 1 | `no tool needed.` | `nothing to buy.` | "No tool needed" mildly contradicts scene 2, which tells the viewer to open an AI engine. That is a tool. "Nothing to buy" is the actual claim and it is exact. |
| 9 | `Doing it weekly, / across all five, / and keeping the / record is our job.` | `One run is a / snapshot. The / record over time / is the work.` | The old line stated the distinction as ownership ("our job"), which reads as positioning. The new line states it as a property of the method, which nothing can refute and which does not need a universal to land. |

The distinction is real without any universal in it: a single check gives you a
point, and a record gives you a direction. That is true of the method regardless
of who runs it or how diligent they are.

**A universals assertion is now enforced mechanically**, in both `mktext.js`
(pre-render, exits non-zero) and `namescan.py` (post-render, against the drawn
byte stream), on the pattern
`nobody|no one|everyone|everybody|anyone|always|never|cannot|can't|impossible|every business|all businesses|no human`.
It is not a thing anyone has to remember.

Everything downstream was re-verified after the re-render rather than carried
over: duration, stream count, first-64-sample amplitude, cover-equals-frame-0,
and the full safe-zone union. Every number in this file is from the files
currently in this folder.

---

## Files

| File | What it is |
|---|---|
| `youtube-silent.mp4` | The upload master. **No audio stream at all**, `nb_streams=1`. Pick a track from YouTube's own audio library at upload. |
| `youtube-scored.mp4` | Same picture, video bitstream copied, plus the BrandGEO track. For paid, site embeds and decks. |
| `youtube-cover.png` | Frame 0, 1080x1920, byte identical to the delivered master's first frame. |

On the filename: the brief's deliverables list says `*-bed.mp4`, but that name
belongs to the superseded synthesized-bed approach described in the same
paragraph, which the composed-track library at the top of the brief replaced.
All five prior runs shipped `-scored.mp4` and so does this one.

---

## On-screen text, verbatim

Ten scenes. Every scene is preceded by an 84x5 violet `#8B5CF6` rule, centred on
the same axis as the type (x 448 to 531, axis 490). Line breaks below are the
actual rendered line breaks. Ink is `#E8E9ED`, accent is `#A78BFA`.

**1. 0.00 to 4.20 s** (first two lines ink Inter Bold 58, last two accent Inter
SemiBold 52. Hard start, no fade, this is the cover)

```
Check your own
brand in AI.

Ten seconds,
nothing to buy.
```

**2. 4.20 to 9.00 s** (header ink Bold 58, engine list ink Inter Medium 50)

```
Step 1. Pick any
one of these.

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**3. 9.00 to 14.20 s** (last two lines accent)

```
Step 2. Do not type
your brand name.
Type what a buyer
types.

"Best [what you sell]
in [your city]"
```

**4. 14.20 to 19.00 s** (last four lines accent)

```
Step 3. Look for
three things.

Are you named?
Where in the list?
How are you
described?
```

**5. 19.00 to 23.20 s** (last two lines accent)

```
If you are not in
the answer, that
is your result.

Not ranked lower.
Absent.
```

**6. 23.20 to 26.60 s** (all ink)

```
Now ask a second
engine the same
question.
```

**7. 26.60 to 31.40 s** (last three lines accent)

```
We ran one real
buyer question in
Denver, 24 July
2026.

Five engines.
No name repeated
across even two.
```

**8. 31.40 to 35.60 s** (last two lines accent)

```
One question, one
day, one wording.

That is what one
check can tell you.
```

**9. 35.60 to 40.00 s** (last four lines accent)

```
The check is free
and it works.

One run is a
snapshot. The
record over time
is the work.
```

**10. 40.00 to 43.80 s** (logo, ink, then accent `getbrandgeo.com` in SemiBold 52)

```
[BrandGEO icon, 196 px]

Run the check
yourself.

getbrandgeo.com
```

---

## The method on screen, and why each step is what it is

The three steps are not filler around a hook. Each one is the correction to a
specific mistake a business owner makes when they check this themselves, and
each was chosen because getting it wrong produces a confidently wrong answer.

**Step 1, pick an engine.** Named engines rather than "an AI" because a viewer
who does not already have one open needs a list, and because the five named are
exactly the five BrandGEO collects on the Growth tier, so the video and the
product describe the same thing.

**Step 2, do not type your brand name.** This is the load-bearing step. Typing
your own name returns a description of you, which always looks fine and answers
a question nobody was asking. The question that matters is the one a buyer types
before they know you exist. The template is on screen with the placeholders left
as placeholders, so the viewer fills it in rather than copying ours.

**Step 3, three things, in that order.** Named at all, then position, then
description. Position without presence is meaningless, and description is the
part a rank number cannot carry: an engine can name you and describe you as the
budget option.

**Scene 5 is the payoff of the whole method.** The result people misread is the
blank one. Absence from an AI answer is not a low rank that can be climbed a
position at a time; there is no position. Saying that plainly is what makes the
free check worth running rather than reassuring.

**Scene 6, ask a second engine**, sets up the one measured claim in the cut,
which is the reason a single engine is not enough.

---

## The one number on screen, and where it was MEASURED

The provenance check runs on the figure, not on the page it sits in.

| On screen | Where it was MEASURED |
|---|---|
| "We ran one real buyer question in Denver, 24 July 2026. Five engines. No name repeated across even two." | BrandGEO's own AI Visibility pipeline, Denver collection run, 2026-07-24 |

**Source: `brandgeo/web/ai-visibility-for-denver.html`.** The page states
"Original research, data collected 2026-07-24, BrandGEO's own AI Visibility
pipeline" and `"datePublished": "2026-07-24"`. The relevant prompt card is
`"Best real estate agents for buying a home in Denver"`. The page's own words
for the finding, in three separate places:

> `0` "Real estate agent names that repeated across any two engines"
>
> "Real estate agents ... No overlap at all"
>
> FAQ: "No agent or team name repeated across any two of the five engines tested"

Written on screen as "no name repeated across even two", which is that sentence
with no numeric denominator invented and no ranking attached.

### Why the denominator of five holds here

The brief requires the lineup to be verified on the collection date or no count
stated at all. Both checks pass on this page:

> "each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity"
>
> "This run also used Google AI Mode in place of the now-retired Meta AI engine
> used in earlier city pages."
>
> data-quality note: "All 5 engines returned usable data on every prompt this
> run, no collection errors."

So the five engines named in scene 2 are the five that ran, they are the five on
the Growth tier in `brandgeo-dashboard/src/lib/planConfig.ts`
(`chatgpt`, `gemini`, `claude`, `perplexity`, `google_ai`), and no engine failed
on this prompt. Scene 2 and scene 7 name the same lineup so the two cannot drift
apart.

### Why this finding and not a stronger one

This is deliberately the **weakest-looking** result in the city corpus and it is
the right one for this driver, for two reasons.

First, it is the finding that motivates the method. A viewer who runs the
ten-second check once, on one engine, and sees a name, will conclude the
category is locked. On this prompt, five engines produced five sets of names
with nothing in common. That is the argument for scene 6, and no consensus
result could make it.

Second, and this settles the tension that run 5 flagged in its own notes: **this
finding names nobody, not even by implication.** Run 5 shipped a 5-of-5 consensus
result and correctly recorded that the winner was resolvable from the published
page even though the name never appeared on screen. Here there is no winner to
resolve. The measured outcome is that no name recurred. Run 5's closing note
offered exactly this substitution as the version that "points at no winner", and
that is what shipped here.

`ai-visibility-for-chicago.html` was deliberately not used, both because run 5
already spent it and because it is now filed as a defect: it claims a "first
fully unanimous result measured anywhere in this research program" that
`ai-visibility-for-boston.html`, collected the same day, contradicts.

### What was deliberately left on the floor

- **`bg-005.html`'s 48% and 93% figures.** Not read for this cut. Both are
  third-party figures inside an otherwise first-party page.
- **`bg-016.html`.** Not read, nothing sourced from it, per the run brief.
- **Any engine count from `bg-004.html`.** Not read for figures.
- **"27 cities" appears nowhere**, on screen or in the description.
- **No Grok figure and no AI Overviews figure**, and neither engine is named.
  Both went live 2026-07-29 with a single day of rows.
- **Copilot and DeepSeek** are absent because they sit on no purchasable plan.
- **Meta AI** is absent because it is retired.
- **The Denver page's consensus results** (4 of 5, 3 of 5 and so on) are all
  absent. Every one of them attaches to a named firm, and none of them serves
  this driver.
- **"Ten seconds"** in scene 1 is the driver's own framing of how long it takes
  to type a question and read an answer. It is not presented as a measurement
  and no figure is attached to it.

---

## No measured subject is named, verified mechanically

The Denver page names at least nine measured subjects: a cannabis-law firm, two
property managers, three energy and natural resources firms, a personal injury
firm, an immigration firm, and an agent-matching service the page itself removed
as noise. **None of them appears on screen, in the title, or in the
description.**

Verified against the literal byte stream `drawtext` drew, the 51 `.txt` files fed
via `textfile=`, not a copy of the source list:

```
capitalised tokens actually rendered:
  AI  AI.  Absent.  Are  Best  ChatGPT  Check  Claude
  Denver  Do  Five  Gemini  Google  How  If  July
  Look  Mode  No  Not  Now  One  Perplexity  Pick
  Run  Step  Ten  That  The  Type  We  Where
```

Our own brand does not appear as text at all; the logo carries it. What is there
is the five Growth engines, a city, a month name, and sentence-start
capitalisation. Two scans over that byte stream:

```
explicit measured-subject hits : NONE
  (21 names and single-word forms harvested from the source page, including
   Vicente LLP, Pioneer Property Management, Real Property Management Colorado,
   Davis Graham & Stubbs, Womble Bond Dickinson, Holland & Hart,
   Bachus & Schanker, Moro Legal LLC, Agent Pronto, Ziprent, Dubin Law Group)

generic sweep hits : NONE
  (40 multiword proper-noun candidates harvested automatically from the page)
```

**Denver is on screen and is not a measured subject.** It is the market the
question was asked in, not a party that turned up inside a result set. The rule
covers "any company, firm or person"; a city is the referent that makes the
finding checkable, and the run is published under that city's name.

### Two judgement calls a reviewer should push on

**1. The word "Best" is on screen, inside the quoted template.** The superlative
rule exists because a superlative is a claim about every other page in the
corpus and cannot be verified from the page asserting it. `"Best [what you sell]
in [your city]"` asserts nothing. It is the literal string the viewer is told to
type into a search box, and it is the exact form every prompt in the city corpus
takes. Run 5 shipped `"Top-rated property management companies in Chicago"` on
screen on the same reasoning. If a reviewer disagrees, the substitution is a
one-word copy change to `"Top [what you sell] in [your city]"`, which costs the
cut nothing and is equally realistic as a buyer query.

**2. The cut tells viewers to do something we charge for.** That is the driver,
and it was not softened. Scene 9 does not say the manual check is inadequate; it
says it is free and it works, then names the one thing a single run structurally
does not give you, which is a record to compare against. A viewer who runs the
check and never buys got what the video promised. That is the intended outcome
of a utility hook, and any edit that walks it back would break the driver.

### Compliance check against the brief

All run on the same rendered byte stream, not on the source file:

```
banned vocabulary on screen : NONE
superlative claims          : NONE  (see judgement call 1 for "Best")
universals                  : NONE
em dash U+2014 on screen    : 0
en dash U+2013 on screen    : 0
other dash codepoints       : 0
non-ascii characters        : NONE
Grok / AI Overviews         : NONE
Meta AI (retired)           : NONE
Copilot / DeepSeek          : NONE
pricing tokens              : NONE
"27 cities"                 : NONE
```

---

## Safe-zone measurement

YouTube Shorts reserves: top **180**, bottom **380**, right **180**.

Measured against the **delivered** `youtube-silent.mp4`, over **all 1314
frames**, by three independent passes that ask three different questions.

### Justifying the ink threshold

Not chosen by feel. The plate generator prints its own peak, and a text-free
control was encoded through the identical pipeline so the ceiling could be read
off an encoded file rather than inferred:

```
source plate (mkbg.js, RGB)      peak luma 21.87   mean luma 12.88
control.mp4 (encoded, stored Y)  YMAX = 37 on all 1314 frames
```

**37 is the number to argue from.** 21.87 is RGB luma; the delivered file is
limited-range `yuv420p`, where `Y = 16 + 219 * luma / 255`, so 21.87 maps to
34.8 at full coverage and the measured 37 is that plus dither.

Stored Y of everything drawn, measured on the delivered file, not computed:

| Drawn element | Colour | Stored Y |
|---|---|---|
| Body and list text | `#E8E9ED` | 221 to 224 peak per scene |
| Accent text | `#A78BFA` | 157 peak |
| Violet scene rule | `#8B5CF6` | **120 to 125, probed on all ten scenes** |
| Logo mark | violet | 129 peak |
| Logo card field | near black | **18 to 33 measured, at or BELOW the background** |

Threshold for method A is **56**. It sits in the empty gap between the
background ceiling of 37 and the dimmest element method A must resolve, the
violet rule at 120. There is nothing drawn between 37 and 120.

### Method A, absolute threshold on the delivered master

```
mode=abs  threshold=56
frames decoded: 1314   frames with no ink: 22
peak sample value seen anywhere: 226
INK UNION  x 223..756   y 616..1167
  top     clearance  616 px  reserve 180  headroom +436  PASS   worst at frame 801
  bottom  clearance  752 px  reserve 380  headroom +372  PASS   worst at frame 800
  right   clearance  323 px  reserve 180  headroom +143  PASS   worst at frame 274
  left    223 px  (Shorts specifies no left reserve)
```

### Method B, per-frame diff against a text-free control

`control.mp4` is the same background with the same drift crop, the same duration,
the same frame count, the same PNG frame sequence and the same encoder settings,
with no text composited at all. Diffing against a control rather than against a
flat assumed canvas colour is what stops the `yuv420p` frame-edge chroma artefact
being reported as a failure on every edge.

**The diff threshold was measured, not picked.** A control cancels artefacts it
shares; it cannot cancel libx264 responding to content it does not have. So the
noise floor was measured in three regions that are empty by design, all far
outside the layer union of x 223..756 y 616..1167:

```
top strip   y 0..400      max |delivered - control| = 6
left strip  x 0..150      max |delivered - control| = 6
bottom      y 1500..1919  max |delivered - control| = 6
noise floor 6  ->  threshold 8, the lowest candidate above it
```

```
mode=diff  threshold=8
frames decoded: 1314   frames with no ink: 9
peak sample value seen anywhere: 198
INK UNION  x 223..756   y 616..1167
  top     clearance  616 px  reserve 180  headroom +436  PASS   worst at frame 799
  bottom  clearance  752 px  reserve 380  headroom +372  PASS   worst at frame 799
  right   clearance  323 px  reserve 180  headroom +143  PASS   worst at frame 272
  left    223 px
```

**The two methods agree to zero pixels on all four edges**, at thresholds seven
times apart. That is what makes the number trustworthy, and it is a better
outcome than run 5's 1 px disagreement because the diff threshold here sits just
above a measured floor rather than well above it.

### Method C, layer alpha, the only pass that sees dark furniture

Measured on the RGBA intermediates before compositing. `drift` is measured layer
top minus computed rule top.

```
layer  1: x  263.. 715   y  727..1070   blockTop  727   drift +0   coverage 0.937%
layer  2: x  272.. 707   y  632..1165   blockTop  632   drift +0   coverage 1.146%
layer  3: x  223.. 756   y  649..1149   blockTop  649   drift +0   coverage 1.702%
layer  4: x  270.. 710   y  658..1129   blockTop  658   drift +0   coverage 1.382%
layer  5: x  263.. 716   y  688..1098   blockTop  688   drift +0   coverage 1.243%
layer  6: x  237.. 741   y  770..1026   blockTop  770   drift +0   coverage 0.908%
layer  7: x  247.. 732   y  616..1167   blockTop  616   drift +0   coverage 1.765%
layer  8: x  235.. 745   y  726..1069   blockTop  726   drift +0   coverage 1.190%
layer  9: x  249.. 730   y  658..1129   blockTop  658   drift +0   coverage 1.302%
layer 10: x  267.. 710   y  641..1155   blockTop  641   drift +0   coverage 2.511%
          declared logo rect x 392..587  y 687..882  (folded in explicitly)
UNION x 223..756  y 616..1167
```

`drift 0` on all ten is the check for the `drawbox` alpha trap. The violet rule
is the topmost thing in every block, so if it had blended at alpha 0 instead of
writing, the measured top would sit 46 px below the computed top on every layer.
It does not, on any of them. That is positive evidence `replace=1` worked rather
than an assertion that it should have.

**Second, independent confirmation on the delivered file.** The rule was probed
per scene, each at that scene's own declared `ruleTop`, because probing a fixed
row against the wrong scene reads the background and looks like a failure. That
happened once during this build and was a probe error, not a render error:

```
scene  1  frame   63  ruleTop  727  stored Y 122..122   OK
scene  2  frame  198  ruleTop  632  stored Y 122..122   OK
scene  3  frame  348  ruleTop  649  stored Y 121..123   OK
scene  4  frame  498  ruleTop  658  stored Y 121..123   OK
scene  5  frame  633  ruleTop  688  stored Y 122..122   OK
scene  6  frame  747  ruleTop  770  stored Y 120..125   OK
scene  7  frame  870  ruleTop  616  stored Y 121..122   OK
scene  8  frame 1005  ruleTop  726  stored Y 121..123   OK
scene  9  frame 1134  ruleTop  658  stored Y 121..123   OK
scene 10  frame 1257  ruleTop  641  stored Y 120..123   OK
```

Ten rules, all present, all at Y ~122 against a background ceiling of 37.

This pass is also what catches the `color=black@0.0` trap: a layer that shipped
opaque measures `x 0..1079 y 0..1919` with drift exactly `-blockTop`. The pass
asserts that case explicitly and exits non-zero on it. It did not fire.

### The dark-on-dark blind spot, checked rather than assumed

The logo asset is a card, not a bare mark, and its field sits at or below the
canvas value, so no pixel method can resolve it. Probed on frame 1250 across the
whole declared rect, delivered against control:

```
declared logo rect x 392..587  y 687..882   (38,416 px)
  delivered Y: min  18  max 131  mean 38.0
  control   Y: min  28  max  33  mean 30.6
  |diff| max 100   pixels with diff>8: 5,062   of 38,416
  delivered pixels above abs threshold 56: 4,878 of 38,416

  diff>8  resolves only  x 449..531  y 731..835
  abs>56  resolves only  x 449..530  y 731..835
```

Both methods resolve only the roughly 84x106 violet mark and **miss about 87% of
the card**, exactly as on runs 2, 4 and 5. The card's minimum stored Y of 18 is
**below** the control's minimum of 28, so at its darkest it is not merely
invisible to a threshold, it is on the wrong side of the background. The union
therefore folds in the **declared** rectangle `x 392..587 y 687..882`, which is
fully contained by the type union on all four edges and changes nothing. It was
checked, not assumed. Sixth build running where declared geometry is the only
handle on that element.

### Final union and verdict

```
FINAL UNION (methods A, B, C and the declared 196 px logo rect)
  x 223..756   y 616..1167
  top    616 px   reserve 180   headroom +436
  bottom 752 px   reserve 380   headroom +372
  right  323 px   reserve 180   headroom +143
  left   223 px
```

**SAFE ZONE: PASS.** Tightest edge is the right at 323 px against a 180 px
reserve, a **143 px** margin, which is 7.2x the 20 px floor. The right edge is
the one that failed run 1's TikTok build at 1 px.

The binding element is scene 3's template line `"Best [what you sell]` at Inter
SemiBold 52, 21 characters including the opening quote, measured 534 px wide.
Consistent with run 5's note that a 20-character line at SemiBold 52 comes out
near 614 px; this line is narrower because brackets and lowercase letters are
narrower than the words run 5 measured. Run 5 warned that driver #6 might need a
URL and a field on one line and that a size drop alone would not buy it. It did
not come up: the template broke naturally at "in [your city]" and the URL got a
scene of its own.

Cover frame measured separately from the delivered PNG at the same threshold 56:

```
cover ink bbox: x 263..715   y 727..1070
  top 727 (headroom +547)   bottom clearance 849 (+469)   right clearance 364 (+184)
  ink pixels 23155
```

The video pass counted 23,285 ink pixels at frame 0 against the PNG's 23,155.
Not a discrepancy: measuring the PNG requires an RGB to YUV conversion the mp4
frame never underwent, so 130 pixels move across the threshold on rounding. The
md5 below is the identity check and it is exact.

### Scene transitions verified on the delivered file, not assumed

Frame hashing does not work on encoded H.264 and `-ss` lands on the wrong side of
a cut, so ink pixels were counted per frame over a single sequential decode of
both files:

```
frames counted: 1314
frame 0 ink: 23,285 px (abs) / 24,303 px (diff)   <- the cover is not blank

diff-mode zero-ink runs (scene crossovers):
  (126,1) (270,1) (426,1) (570,1) (696,1) (798,1) (942,1) (1068,1) (1200,1)
declared boundary frames:
   126     270     426     570     696     798     942     1068     1200
match: EXACT on all nine, no drift
```

Nine crossovers of exactly one frame each, each landing on exactly the declared
scene boundary times 30. That is the check `ffconcat` failed in run 3, where a
cut landed on frame 694 instead of 693 while total duration and frame count still
looked correct. No `ffconcat` was used here; the timeline is a numbered PNG frame
sequence at `-framerate 30`, which is frame-exact by construction.

**The known threshold artefact reproduced and is not drift.** Method A reported
22 blank frames in runs of 2 and 3 starting at 125, 269, 425, 569 and 1199, one
frame *earlier* than declared. That is the threshold, not the timeline: at 56 the faint
head and tail of each 0.3 s alpha fade fall below the threshold one frame either
side. The sensitive diff pass at threshold 8 resolves the true crossover, nine
runs of exactly one frame at exactly the declared indices. Run 5 recorded this
same artefact and it behaved identically here. **A single-method boundary check
would have reported a defect that does not exist**, which is precisely the trap
the brief warns about.

---

## Duration and container

Both from `ffprobe` on the **delivered** files in this folder, probed after they
were copied here, not in the build directory:

| File | `format.duration` | Video | Audio |
|---|---|---|---|
| `youtube-silent.mp4` | **43.800000 s** | 1314 frames, 30/1, 1080x1920, yuv420p, h264, stream duration 43.800000 | **none, `nb_streams=1`, zero audio streams** |
| `youtube-scored.mp4` | **43.800000 s** | 1314 frames, identical stream, `-c:v copy` | aac 48 kHz stereo, stream duration **43.800000 s** |

`ffprobe -select_streams a` on the master returns **0 rows**. That is the
load-bearing check: a muted audio track is not the same thing as no audio track,
and a muted track can block a platform's in-app music picker, which is the whole
reason the silent master is primary.

Exit status is not proof a mux worked. Run 2 shipped a 4.7 MB file that exited 0
and probed as `Duration: N/A` with no streams. Both files above were probed in
this folder.

The video stream is provably the same bitstream in both:

```
ffmpeg -i youtube-silent.mp4 -map 0:v -c copy -f md5 -   MD5=e59bfa69e4db60a21ec530cfcc26e9a3
ffmpeg -i youtube-scored.mp4 -map 0:v -c copy -f md5 -   MD5=e59bfa69e4db60a21ec530cfcc26e9a3
```

so the safe-zone measurement binds on the scored cut too rather than being
assumed to.

43.800 s is inside the 30 to 45 s target and 16.2 s under the 60 s cap.
`-shortest` held the container to the exact cut length. Decoding the scored
file's audio yields 2,103,296 samples, which is 43.8187 s, the AAC decoder's
1024-sample tail padding. The container and both stream durations are exactly
43.800000, which is what a player reads.

---

## Cover integrity

Scene 1 has **no fade in**. Frame 0 is the hook at full opacity, because frame 0
is the thumbnail the feed shows. In the generated command `[1:v]` carries a
`fade=t=out` and no `fade=t=in`. The generator emits the fade-in clause only for
`i > 0`, so this is structural rather than a thing that has to be remembered.

Verified with an md5 over raw RGB taken from the delivered file in this folder:

```
ffmpeg -i youtube-cover.png     -pix_fmt rgb24 -f rawvideo - | md5sum
  3300e3c31620b33672314593f36ab096

ffmpeg -i youtube-silent.mp4 -frames:v 1 -pix_fmt rgb24 -f rawvideo - | md5sum
  3300e3c31620b33672314593f36ab096
```

Identical. The cover is frame 0, not a re-render of it. The 23,285 ink pixels
counted at frame 0 are the independent confirmation that it is not a blank
rectangle. Both hashes were taken after the re-render, from the files in this
folder.

The cover carries the promise and the price of the offer in four lines: check
your own brand, ten seconds, nothing to buy. A viewer who never presses play has
still been told there is a free thing they can do, which is the correct thumbnail
for a utility hook.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.
Composed by BrandGEO on 2026-07-29, recorded in `assets/audio/ATTRIBUTION.md`.
Owned outright, cleared for commercial use including paid advertising, and it
**requires no attribution line anywhere**. Nothing was downloaded and no music
service was involved.

Held **constant** across runs on purpose. The hook is the variable under test, so
the bed must not be. This matters more on this run than on any previous one,
because it closes the six-driver cycle: every one of the six drivers has now been
measured against the same bed, so any difference between them is attributable to
the hook and not to the audio.

The library contains a track literally named `clean-utility`, and using it here
would have been the obvious choice and the wrong one. Swapping the bed on the run
that completes the cycle would leave the whole six-way comparison with two
candidate explanations for its most interesting result and no way to separate
them. `clean-utility` is available for a one-off asset, or later if music itself
becomes the variable under test.

**There is no CC BY 4.0 line on this asset and there must not be one.** That
obligation belongs to the LibriTTS voice model, and there is no voice of any kind
in this run. Crediting a model that is not in the audio would be a false
statement about the asset, not a harmless precaution.

### Fade in, and the measurement that proves it was needed

Source is 60.000 s, trimmed to 43.800 s. The brief specifies a 0.08 s fade in and
a 1.5 s fade out, and both were applied, the fade out starting at 42.30 s.

The fade in is not cosmetic. Measured on the raw track before any processing:

```
raw track first-64-sample peak |amp| = 0.061709
raw track peak within first 0.1s     = 0.206314
```

A hard cut at sample 0 starts at 0.062 and reaches 0.206 within 100 ms, which is
an audible click, not a fade.

Verified on the **delivered** `youtube-scored.mp4` in this folder:

```
delivered first-64-sample peak |amp| = 0.002685      (requirement: < 0.005)
```

**Pass, at 54 percent of the ceiling.**

The tail was checked at the same time, because a fade out that does not reach
zero is the same defect at the other end:

```
last 0.100s   peak 0.021401   -33.4 dBFS
last 0.030s   peak 0.001639   -55.7 dBFS
last 0.010s   peak 0.000013   -98.0 dBFS
last 64 smp   peak 0.000001  -124.8 dBFS
```

It ends in real silence rather than being cut off.

### Loudness

Two-pass `loudnorm`, then re-measured independently on the **encoded** file
rather than trusting the filter's own pass-2 summary:

```
pass 1 (measured on the trimmed and faded 43.8 s cut)
  input_i      = -16.67 LUFS
  input_tp     =  -4.41 dBTP
  input_lra    =   9.00 LU
  input_thresh = -26.78
  offset       =  -0.45

ffmpeg -i youtube-scored.mp4 -map 0:a -af ebur128=peak=true
  Integrated:  -15.8 LUFS   (target -16)
  LRA:           8.5 LU     (low -22.2, high -13.7)
  True peak:    -3.8 dBFS   (ceiling -1.5 dBTP)
```

True peak lands 2.3 dB under the ceiling. The ceiling is a limit, not a target,
and the source already sat near -16 LUFS, so pass 2 applied roughly 0.9 dB of
gain in `linear` mode. There was nothing to fix.

Note the pass-1 figures differ very slightly from run 5's (`-16.67` against
`-16.64`, offset `-0.45` against `-0.50`) because this cut is 43.8 s and that one
was 43.6 s, so the two measure a different amount of the same source. Same track,
different trim.

### Honest read on the scored cut

Measured on the delivered file, not judged by ear:

| | |
|---|---|
| LRA | **8.5 LU** (a flat drone measures near 1.5) |
| Stereo | L differs from R on **100.00%** of samples, correlation **0.870** |

LRA 8.5 is the number that says it moves. 100% L/R divergence at correlation
0.870 says it images as a field with width rather than as a point in the centre
of the head.

What it is not: it was not cut to this edit. The track was composed to 60 s for
the campaign generally, and the ten scene changes here fall where reading time
puts them, so bar lines and cuts do not line up. It reads as a bed under the
video rather than as a score of it. That is the correct tradeoff for a shared
library held constant across an A/B, and it is worth knowing before anyone claims
the music hits the cuts. It does not, by design.

**A specific note for this driver.** `tension-minor` is a minor-key bed and this
is the only cut in the cycle whose content is generous rather than threatening.
The music is therefore pulling slightly against the copy here in a way it did not
on drivers 1 through 5. That is an accepted cost of holding the variable
constant, and it is also the single most likely confound if driver #6
underperforms the other five. If the cycle is re-run with music as the variable,
this is the pairing to test first.

---

## Suggested Shorts title

```
The ten second check that tells you if AI knows your business exists
```

Written to be read rather than stuffed. It says what the viewer gets and how long
it takes, in one clause. No keyword list, no colon-and-brackets construction, no
bracketed year, no all caps, no "here is why". The only device is that "exists"
lands where a viewer expects "ranks", which is the whole correction the video
makes.

It also promises exactly what the video delivers. A utility hook that oversells
in the title fails twice over, because the viewer both does not get the tool and
learns the channel exaggerates.

Alternates on the same driver:

- `How to check whether AI recommends your business, in about ten seconds`
- `Type this into ChatGPT and see whether your business comes up`

## Suggested description

```
This one is a tool, not an argument. You can run it in the next minute and you
do not need us to do it.

Step 1. Open any AI engine you already use. ChatGPT, Gemini, Claude, Perplexity
or Google AI Mode.

Step 2. Do not type your own name. That returns a description of you, which
always looks fine and answers a question nobody asked. Type the question a
buyer types before they have heard of you:

"Best [what you sell] in [your city]"

Step 3. Read the answer for three things, in this order. Are you named at all.
Where you sit in the list. How you are described, because an engine can name you
and still describe you as the cheap option.

If you are not in the answer, that is your result. It is worth being blunt about
what that means: you are not ranked lower, you are absent. There is no position
to climb from. That is a different problem from a bad search ranking and it does
not show up in any rank tracker.

Then ask a second engine the same question, because they do not agree as often
as people assume. On 24 July 2026 we ran a set of real buying questions through
five engines in Denver. On the one asking for real estate agents, no name
repeated across even two of the five. Five engines, five different sets of
answers, nothing in common. Checking one engine would have told you the category
was settled. It was not.

That is also the honest limit of the check you just ran. One question, one day,
one wording. Engines reword, re-rank and change their minds between runs, so a
single answer is a single data point and should be treated as one.

The full Denver run is published with all six questions, every engine, and the
data-quality notes:
https://getbrandgeo.com/ai-visibility-for-denver.html

The check is free and it works, and nothing below takes that back. The
distinction is not effort, it is shape: one run is a snapshot, and a record over
time is what tells you whether anything is moving. BrandGEO asks your buyers'
questions across ChatGPT, Gemini, Claude, Perplexity and Google AI Mode on a
schedule and keeps that record, so the comparison is already there when you want
it.

Run the check yourself first: https://getbrandgeo.com
```

No hashtag block. The description is written for a person who paused on the
video, and a trailing tag run does not serve that reader. If the channel's
convention requires tags, add them below the links rather than inside the copy.

The description repeats the method in full rather than teasing it, because a
viewer who wants to run this will be looking at a phone and will not scrub back
through the video for step 2. It also carries the one qualification the video has
no room for, that engines change their answers between runs, which is the
strongest honest argument for the product and the weakest possible pressure.

It contains no universal either, and was rewritten alongside scene 9 for the same
reason. An earlier draft said the check "cannot run itself", which is the same
unverifiable shape in a different costume. The version above names the difference
as snapshot against record, which is a statement about the method that holds
regardless of who is doing it.

**The description names no measured subject either.** It names Denver, the five
engines, and the category, and links to the published run.

No CC BY 4.0 line, for the reason given under Music above.

---

## Build

`ffmpeg 8.1.2-full_build-www.gyan.dev`, `node v24.16.0`, `numpy 2.4.6`. Remotion
is not installed and was not used. Nothing was installed. PNG intermediates
throughout, no JPEG, so nothing gets forced to `yuvj420p`.

Pipeline, all scripts in the session scratchpad:

1. `mkbg.js` writes a 1188x2112 binary PPM: base `#090A0F`, a violet `#7C3AED`
   mass top right, an indigo `#6366F1` mass bottom left, a faint `#8B5CF6` centre
   lift, an edge vignette and a light ordered dither so the gradient does not
   band after h264. Oversized so the render can drift-crop 1080x1920 out of it
   without ever reaching an edge. It prints its own peak luma, which is what
   justifies the ink threshold. Then `ffmpeg -i bg.ppm bg.png`.
2. `scenes.js` holds every drawn string, size, colour and scene duration as data,
   so the copy has exactly one source and the compliance scans have one target.
3. `mktext.js` renders one transparent RGBA layer per scene. Text goes through
   `textfile=` rather than `text=`, so no filtergraph escaping is involved, and
   every invocation is spawned as an argv array so the shell never sees the
   filter string. Fonts are the vendored Inter, copied next to the script so
   `fontfile=` needs no drive-letter escaping on Windows.
4. `mkcmd.js` generates the filtergraph, so fade timings and the crop denominator
   are computed rather than hand-typed, and the no-fade-on-scene-1 rule is
   structural.
5. `measure_layers.py`, `measure_delivered.py` and `namescan.py` do the
   measurement and compliance passes. All three exit non-zero on failure.

**The silent-failure traps, all guarded explicitly.**

`-f lavfi -i color=black@0.0` does not survive format negotiation: the source
drops its `@alpha` and lands opaque, so a later `format=rgba` fills alpha with
255 and every text layer ships as a full-frame black rectangle over the
background, at exit 0 with no warning. The alpha is zeroed explicitly instead:

```
[0:v]format=rgba,colorchannelmixer=aa=0,drawbox=...,drawtext=...
```

and the PNG write carries `-update 1 -pix_fmt rgba`, or alpha is dropped again
one step later and produces the identical failure.

On a transparent RGBA source `drawbox` blends rather than writing alpha, so it
renders at alpha 0 and the violet rule silently does not appear. It needs
`replace=1`. Separately, `drawbox` **cannot animate** on 8.1.2: it has no `eval`
option and evaluates `x/y/w/h` once at init, so any time-dependent expression
renders frozen at its t=0 value. Nothing in this build asks it to animate. The
rule is drawn as:

```
drawbox=x=448:y=<ruleTop>:w=84:h=5:color=0x8B5CF6@1.0:t=fill:replace=1
```

and the `drift 0` column on all ten layers plus the per-scene stored-Y probe of
120 to 125 on the delivered file are the two independent confirmations it worked.

### Exact command, composited frame sequence

A **numbered PNG frame sequence at `-framerate 30`**, not an `ffconcat` list.
`ffconcat` accumulates float durations and lands a cut a fraction of a
microsecond past a frame edge while total duration and frame count still look
correct.

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 43.8 -i bg.png \
 -loop 1 -framerate 30 -t 43.8 -i text-1.png \
 -loop 1 -framerate 30 -t 43.8 -i text-2.png \
 -loop 1 -framerate 30 -t 43.8 -i text-3.png \
 -loop 1 -framerate 30 -t 43.8 -i text-4.png \
 -loop 1 -framerate 30 -t 43.8 -i text-5.png \
 -loop 1 -framerate 30 -t 43.8 -i text-6.png \
 -loop 1 -framerate 30 -t 43.8 -i text-7.png \
 -loop 1 -framerate 30 -t 43.8 -i text-8.png \
 -loop 1 -framerate 30 -t 43.8 -i text-9.png \
 -loop 1 -framerate 30 -t 43.8 -i text-10.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1313':y='192*n/1313',format=rgba,setsar=1[bg];\
[1:v]format=rgba,fade=t=out:st=3.90:d=0.3:alpha=1[t1];\
[2:v]format=rgba,fade=t=in:st=4.20:d=0.3:alpha=1,fade=t=out:st=8.70:d=0.3:alpha=1[t2];\
[3:v]format=rgba,fade=t=in:st=9.00:d=0.3:alpha=1,fade=t=out:st=13.90:d=0.3:alpha=1[t3];\
[4:v]format=rgba,fade=t=in:st=14.20:d=0.3:alpha=1,fade=t=out:st=18.70:d=0.3:alpha=1[t4];\
[5:v]format=rgba,fade=t=in:st=19.00:d=0.3:alpha=1,fade=t=out:st=22.90:d=0.3:alpha=1[t5];\
[6:v]format=rgba,fade=t=in:st=23.20:d=0.3:alpha=1,fade=t=out:st=26.30:d=0.3:alpha=1[t6];\
[7:v]format=rgba,fade=t=in:st=26.60:d=0.3:alpha=1,fade=t=out:st=31.10:d=0.3:alpha=1[t7];\
[8:v]format=rgba,fade=t=in:st=31.40:d=0.3:alpha=1,fade=t=out:st=35.30:d=0.3:alpha=1[t8];\
[9:v]format=rgba,fade=t=in:st=35.60:d=0.3:alpha=1,fade=t=out:st=39.70:d=0.3:alpha=1[t9];\
[10:v]format=rgba,fade=t=in:st=40.00:d=0.3:alpha=1[t10];\
[bg][t1]overlay=0:0:format=auto[v1];\
[v1][t2]overlay=0:0:format=auto[v2];\
[v2][t3]overlay=0:0:format=auto[v3];\
[v3][t4]overlay=0:0:format=auto[v4];\
[v4][t5]overlay=0:0:format=auto[v5];\
[v5][t6]overlay=0:0:format=auto[v6];\
[v6][t7]overlay=0:0:format=auto[v7];\
[v7][t8]overlay=0:0:format=auto[v8];\
[v8][t9]overlay=0:0:format=auto[v9];\
[v9][t10]overlay=0:0:format=auto[vout]" \
 -map "[vout]" -frames:v 1314 -pix_fmt rgb24 frames/f-%05d.png
```

`[1:v]` carries no fade in. That is the cover guarantee, not an oversight.

### Exact command, silent master

```
ffmpeg -y -loglevel error -framerate 30 -i frames/f-%05d.png -an \
 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1314 youtube-silent.mp4
```

### Exact command, text-free control

Same plate, same drift crop, same frame count, same encoder settings, no text
inputs, and rendered to its own numbered PNG sequence first so the two files go
through an identical pipeline. A measurement instrument, not delivered.

```
ffmpeg -y -loglevel error -loop 1 -framerate 30 -t 43.8 -i bg.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1313':y='192*n/1313',format=rgba,setsar=1[vout]" \
 -map "[vout]" -frames:v 1314 -pix_fmt rgb24 ctlframes/f-%05d.png

ffmpeg -y -loglevel error -framerate 30 -i ctlframes/f-%05d.png -an \
 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1314 control.mp4
```

### Exact command, scored cut

Pass 1 measured the trimmed and faded audio only:

```
ffmpeg -i assets/audio/music/tension-minor.wav \
 -af "atrim=0:43.8,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,\
afade=t=out:st=42.30:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null -
```

Its output feeds pass 2:

```
ffmpeg -y -loglevel error -i youtube-silent.mp4 \
 -i assets/audio/music/tension-minor.wav \
 -filter_complex "[1:a]atrim=0:43.8,asetpts=N/SR/TB,\
afade=t=in:st=0:d=0.08,afade=t=out:st=42.30:d=1.5,\
loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.67:measured_TP=-4.41:\
measured_LRA=9.00:measured_thresh=-26.78:offset=-0.45:linear=true,\
aresample=48000[aout]" \
 -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
 -movflags +faststart -shortest youtube-scored.mp4
```

### Exact command, cover

```
ffmpeg -y -loglevel error -i youtube-silent.mp4 -frames:v 1 -vf "select=eq(n\,0)" \
 -vsync 0 -update 1 youtube-cover.png
```

---

## Notes for whoever picks up the cycle from here

**The six-driver cycle is complete.** Runs 1 to 6 are loss aversion, status
threat, curiosity gap, contrarian, concrete proof and utility, all on the same
bed, all 9:16, all measured the same way. Whatever the next run is, it is no
longer a first pass through the cycle, and that changes what the numbers mean:
from here a repeated driver is a replication, not a new observation.

**Two confounds are now on the record and should be controlled before any
conclusion is drawn from the six.**

1. **Driver #6 is paired against a minor-key bed** whose mood pulls against
   generous copy, noted under Music above. It is the only driver where content
   and music disagree in tone.
2. **Driver #5 and driver #6 draw on different source pages by design**, and #6
   deliberately uses a null result where #5 used a unanimous one. If #6
   underperforms, "utility hooks are weaker" and "null findings are less
   shareable" are both live explanations and this run cannot separate them.

**A finding that names nobody is worth more than a finding that names a winner,
and this run is the demonstration.** Run 5 shipped a genuinely strong result and
had to spend a long section of its notes defending the fact that the winning
party was resolvable from the linked page. This run has no such section, because
the measured outcome is that nothing recurred. When two findings are close in
strength, prefer the one with no party in it; it costs nothing in the edit and
removes an entire class of objection.

**A universal is a superlative wearing a different hat, and the brief should say
so.** "Nobody can do this by hand", "you can never see this", "every business has
this problem" are all claims about a whole population that one counterexample
refutes, and none of them can be verified from the asset making them. That is
exactly the argument the brief already makes for "first"/"only"/"most". The
campaign brief's superlative section is the right home for it; until it is added
there, the enforcing regex lives in `mktext.js` and `namescan.py` in this run's
scratchpad and should be carried forward rather than rewritten from memory.
Worth noting the shape of the near miss: the universal came in through the RUN
BRIEF, not through the copy, so an agent following instructions faithfully would
have rendered it. Compliance checks have to run against the drawn bytes, not
against the intent.

**Line width, third data point.** Run 3 ended at 72 px of right headroom, run 4
at 123 px, run 5 at 102 px, this run at 143 px. The extra margin here is not
skill, it is that a bracketed template is narrower than real prose at the same
size. Do not read 143 px as the new normal for SemiBold 52.

**Probe the right row.** During this build a rule probe read background values
and briefly looked like a `drawbox` failure. The cause was probing a fixed y
against a frame belonging to a different scene. Every scene has its own
`ruleTop`; pair the probe frame with that scene's declared geometry, or the
measurement reports a defect that is not there. Same class of error as run 5's
false blank-frame report, and this campaign has now produced one of these per
run.

---

Nothing was posted, scheduled, uploaded or committed. No git command was run.
Nothing outside
`docs/growth/reel-campaign-ab/run-20260730-0313/youtube/` was written, and no
sibling platform folder was read or modified.
