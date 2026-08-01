# Facebook Reel, run 20260730-0113

Built with ffmpeg 8.1.2 directly. Remotion is not installed and nothing was
installed. Nothing here has been posted or scheduled. No git command was run.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master.** Zero audio streams, not a muted one. Pair with a track from Facebook's in-app music library. |
| `facebook-scored.mp4` | Identical video bitstream plus the BrandGEO-composed track `tension-minor`. For paid, site embeds and decks. |
| `facebook-cover.png` | 1080x1920 cover. Verified byte-identical to frame 0 of the master. |

---

## Hook driver

**#4, contrarian.** "Coming up first on Google does not mean you are the answer
an AI gives."

The mechanism is different from the three runs before it, and it is different in
a specific way that is worth stating because it is the thing under test.

- Run 1 used **loss aversion**: you are already losing something.
- Run 2 used **status threat**: someone else is in your slot.
- Run 3 used **curiosity gap**: we ran a study, here is what we withheld.
- This run attacks **a belief the viewer already holds**. It does not threaten
  the viewer, does not put a rival in the answer, and does not tease a finding.
  It says out loud the thing the viewer believes, then disagrees with it.

The belief is named plainly in beat 1 and named again as a belief in beat 2,
before any evidence appears. That ordering is deliberate: a contrarian hook that
disagrees before it states what it is disagreeing with reads as noise. Beats 3
to 5 are the evidence. Beat 6 is the reconciliation, and it exists to stop the
video overstating.

**The overstatement guard is a whole beat, not a hedge.** "SEO is dead" is false
and easy to refute, and refuting it would discredit everything before it. Beat 6
says "Google still works. It just measures something else." The claim in this
video is a claim about two different measurements, not about one replacing the
other, and the last thing the viewer reads is the concession.

**Facebook-native treatment.** Plain business language, short declaratives, no
category vocabulary. No "GEO", no "AI visibility", no "generative engine", no
"SERP", no "organic", no "ranking" as a noun. Six beats over 28 seconds, and the
final beat gets 5.2 s rather than the 4.2 s the middle beats get, so the
concession and the domain both have time to land. Slower than the same driver
would get on TikTok.

---

## On-screen text, verbatim

Line breaks below are the actual rendered line breaks, one `drawtext` per line.
Nothing else appears on screen except the persistent bottom lockup and the
accent rule.

**Beat 1, 0.000 to 5.000 s.** Four lines. Fully opaque from frame 0. No fade in,
no rise, no stagger, because this frame is the cover. Fourth line accent violet,
Inter ExtraBold.

```
Coming up first on
Google does not
mean you are the
answer AI gives.
```

**Beat 2, 5.200 to 9.400 s.** Third line accent.

```
Most teams treat
them as one result.
They are not.
```

**Beat 3, 9.600 to 13.800 s.** No accent line, all body.

```
We checked a brand
sitting on page one
of Google.
```

**Beat 4, 14.000 to 18.200 s.** Third line accent.

```
Three AI engines
put it first in
their answers.
```

**Beat 5, 18.400 to 22.600 s.** Third line accent.

```
On one engine, in
twenty questions,
it never appeared.
```

Rendered as three lines with the break after "in" and after "it": `On one
engine, in` / `twenty questions, it` / `never appeared.` The accent line is
`never appeared.`

**Beat 6, 22.800 to 28.000 s.** Four lines, its own vertical grid. Fourth line
accent.

```
Google still works.
It just measures
something else.
getbrandgeo.com
```

**Persistent, whole runtime:** the icon mark at 68 px plus the wordmark
`BrandGEO` at 72% opacity, bottom left.

Exact rendered strings, as read back out of the twenty one text files ffmpeg
draws from:

```
l0  'Coming up first on'      l10 'Three AI engines'
l1  'Google does not'         l11 'put it first in'
l2  'mean you are the'        l12 'their answers.'
l3  'answer AI gives.'        l13 'On one engine, in'
l4  'Most teams treat'        l14 'twenty questions, it'
l5  'them as one result.'     l15 'never appeared.'
l6  'They are not.'           l16 'Google still works.'
l7  'We checked a brand'      l17 'It just measures'
l8  'sitting on page one'     l18 'something else.'
l9  'of Google.'              l19 'getbrandgeo.com'
                              wordmark 'BrandGEO'
```

---

## Every number on screen, and where it comes from

All numbers are spelled as words. There is not a single digit character on
screen, confirmed by regex over the rendered strings. They are still numbers so
they still have to trace.

**Single source: `brandgeo/web/bg-004.html`**, published on getbrandgeo.com,
dated July 2, 2026, `BG-004: #1 on Three AI Engines, Absent on Gemini`. It is a
BrandGEO audit of a real client, not a third-party statistic.

| On screen | Claim | What the page states |
|---|---|---|
| "page one of Google" (beat 3) | the brand ranked on Google's first page | "the kind of brand that shows up on page one of Google without trying very hard", and later "A brand with page-one Google rankings should, in theory, have an advantage here" |
| "Three AI engines put it first in their answers." (beat 4) | three engines returned it as the top recommendation | Key Findings: "3 Platforms where the brand was the #1 recommendation" |
| "twenty questions" (beat 5) | twenty prompts | Key Findings: "20 Real customer questions tested, identical across every engine" |
| "On one engine ... it never appeared." (beat 5) | zero appearances on one engine | Key Findings: "0 Times the brand appeared anywhere in Gemini's answers", and the body: "the same brand, answering the same 20 questions, appeared zero times" |
| "Most teams treat them as one result." (beat 2) | most teams do not measure the two separately | `bg-001.html` Key Findings: "&lt;10% Of brands actively monitor or optimize their presence in AI-generated answers" and "0 Standard SEO tools that measure AI Visibility". `bg-005.html`: "The most common response we see is folding GEO into the existing SEO team's task list, measured with the SEO team's existing metrics" |
| "Google still works. It just measures something else." (beat 6) | the two are different measurements, neither is dead | `bg-005.html`: "SEO and GEO need to run in parallel, measured separately", "You still need the SEO foundation", "that foundation is necessary, not sufficient" |

### Five restraints on that evidence, each of which cost the cut something

1. **No engine count is stated anywhere.** BG-004's audit ran five engines, but
   its five were ChatGPT, Gemini, Claude, Perplexity and **Microsoft Copilot**,
   with Meta AI named in the same page's product paragraph. That set is not the
   five on the Growth tier in `planConfig.ts` (`chatgpt`, `gemini`, `claude`,
   `perplexity`, `google_ai`). Saying "five AI engines" over BG-004's numbers
   would attach today's engine lineup to a 2026-07 audit that used a different
   one. This is the same reason run 3 rejected `bg-016.html`. So the video says
   "Three AI engines" and "one engine", both of which are exact, and never
   states the denominator.
2. **No engine is named on screen.** Not the three that put the brand first, not
   the one that never named it. The page names them; naming Gemini as the engine
   that returned nothing would put a specific product in a negative claim inside
   paid media. "On one engine" carries the finding without it.
3. **The client is not named and not characterised.** BG-004 calls it a
   market-leading catering company. The video says "a brand", because the
   industry adds nothing to a contrarian argument and narrows the audience.
4. **"Put it first in their answers" is BG-004's own headline framing**, taken
   from its Key Findings block ("3 Platforms where the brand was the #1
   recommendation"). The body adds a qualifier the video does not carry: it was
   the top recommendation "consistently, across the majority of the 20
   questions", not on every single one of the twenty. Beat 4 does not say
   "every". A reviewer who wants that nuance visible would have to spend a line
   on it, and there is room: beat 4's binding line has 215 px of right clearance.
5. **Nothing is generalised into a law.** The video reports one audit. It does
   not say this happens to most brands, does not attach a rate, and beat 6 hands
   the argument back as "measures something else" rather than as a prediction.

### Google is named on screen. RULED CORRECT, keep it

**Google appears three times** (`l1`, `l9`, `l16`). This was flagged as a
deliberate exception to the brief's never-name-a-third-party rule and escalated
rather than decided here.

**Ruled by the coordinator, 2026-07-30: keep it as rendered, do not apply the
revert below.** The rule was imprecise and has been fixed rather than the video.
It now distinguishes two roles a name can play:

- **Allowed, the engine or platform being measured.** ChatGPT, Gemini, Claude,
  Perplexity, Google AI Mode, and Google itself as the referent for a belief. A
  blanket ban would have forbidden the product from describing what it does.
- **Forbidden, the subject of a measurement.** Any company, firm or person that
  turned up inside a result set. Those parties never agreed to appear in
  advertising and naming them uses their reputation as our commercial proof.

**The test is whether the claim survives removing the name.** "All five engines
named the same two providers" survives, so the names go. "We measure ChatGPT"
does not survive, so the name stays.

This cut passes on both counts: Google is the referent for the belief, and
everything inside the finding stays unnamed, including the client, the three
engines that named it and the one that did not.

The reasoning that was escalated, kept on the record because it is what the
ruling turned on:

- The brief's own definition of driver #4 is "ranking first in **Google** does
  not mean you exist in AI", and this run's brief says in as many words to write
  "coming up first on Google" rather than "SERP position". The instruction to
  name it is more specific than the general rule and postdates nothing.
- The harm the rule addresses does not arise here. Google is not the subject of
  the measured finding, is not implied to have a relationship with BrandGEO, and
  is not being characterised. It is the referent for the belief the video is
  arguing with, and beat 6 says it still works. The rule was written because a
  cut was about to name two hospital systems as the parties inside a result.
- Every party that IS inside the result stays unnamed: the client, the three
  engines that named it, and the one that did not.

**The revert was drafted before the ruling and is NOT to be applied.** It is
kept only so a future cut facing a genuinely forbidden name knows the shape of
the fix: `l1` "Google does not" would become "search does not", `l9` "of
Google." would become "of search." and `l16` "Google still works." would become
"Search still works." All three replacements are shorter than the originals, so
no relayout would be needed, though the safe-zone measurement would still have
to be rerun.

### Other copy compliance, all checked mechanically

The check harvested 236 candidate proper-noun strings out of the four source
pages (`bg-001`, `bg-002`, `bg-004`, `bg-005`) with a regex, then matched every
one of them against the rendered strings ffmpeg actually draws. It was not done
by reading.

```
proper-noun hits in rendered on-screen text:
  AI, BrandGEO, Google, It, Most, On, They, Three, We
explicit org watchlist hits (OpenAI, Gemini, Anthropic, Claude, Perplexity,
  Microsoft, Copilot, Meta, Grok, xAI, ChatGPT, Bing, Semrush, BrightEdge,
  Similarweb, Datos, LinkedIn, Reddit, Penn, Jefferson, Yelp, Bucharest):
  Google only
```

- No em dashes, no en dashes, no figure dash, no minus sign. Zero hits for
  U+2012, U+2013, U+2014, U+2212 across all twenty one rendered strings.
- No banned vocabulary. The thirteen terms in the brief were checked by
  substring against the rendered strings and none occurs. They are not re-listed
  here, because listing them trips a naive scanner reading this file.
- **No percentages and no rates on screen.** The `%` character does not appear.
  No Grok figure, no AI Overviews figure. `bg-005.html` publishes both a 93%
  zero-click figure and a 48% AI Overviews figure and **neither was used**: the
  48% is an AI Overviews rate and is banned outright, and the 93% is a
  third-party clickstream number rather than a BrandGEO measurement, which makes
  it the wrong kind of evidence for a company that sells measurement.
- TOFU, soft CTA. The close is a concession plus the domain. No pricing, no plan
  names, no trial mechanics, no urgency, no imperative.

---

## Duration, exact ffprobe output on the DELIVERED files

Probed at the final delivery path, not in the build scratch directory.

`facebook-silent.mp4`
```
nb_streams      : 1
format duration : 28.000000
video           : h264, 1080x1920, yuv420p, 30/1 fps, 840 frames, duration 28.000000
audio streams   : 0
```

`facebook-scored.mp4`
```
nb_streams      : 2
format duration : 28.000000
video           : h264, 840 frames, duration 28.000000
audio           : aac, 48000 Hz, 2 ch, 1314 frames, stream duration 28.000000
```

**The silent master has zero audio streams**, confirmed directly rather than
inferred from the stream count: `ffprobe -select_streams a -show_entries
stream=index` returns no rows at all.

Both containers report **28.000000 s**. Target band is 20 to 30 s.

The AAC quantisation the brief warns about is present and contained. A raw
decode of the scored cut's audio yields 1,344,512 samples, which is **28.0107 s**
of coded audio, because 1314 AAC frames of 1024 samples overshoot the cut.
`-shortest` plus the mp4 edit list trims playback back to 28.000. The container
number is the one that matters and it is exact.

Video bitstream identity between the two files, confirmed rather than assumed:

```
facebook-silent.mp4  video stream MD5 = a01cf0ab28ce4f0217ff46bc9ef58316
facebook-scored.mp4  video stream MD5 = a01cf0ab28ce4f0217ff46bc9ef58316
```

The scored cut was muxed with `-c:v copy`, so it is the same picture.

---

## Cover, verified against frame 0

Beat 1 hard-starts. Its `alpha` is a constant 1 until the fade-out at 4.650 s,
there is no per-line stagger, and there is no rise term in the `y` expression.
The beat 1 accent rule likewise starts at its full 0.9 opacity rather than
stepping up through 0.3 and 0.6 the way beats 2 to 6 do.

Verified on the delivered files at the final path, decoding both to raw RGB24
and hashing:

```
frame 0 of facebook-silent.mp4   md5 966c350ed814cb256908bd327e11ecde  (6,220,800 bytes)
facebook-cover.png               md5 966c350ed814cb256908bd327e11ecde  (6,220,800 bytes)
byte identical                   True
```

The cover PNG is 1080x1920 rgb24.

And it is not a blank rectangle: the cover carries **56,329 pixels above luma
85**, bounding box `x[100..749] y[526..1394]`, which is the accent rule, four
lines of type and the wordmark.

An independent check that no fade snuck in: per-frame ink counts over the whole
file give frame 0 at **56,385 px** against beat 1's steady state of **56,390 px**
at frames 60 to 64. A five pixel spread is x264 quantisation noise on a static
picture, not a ramp. A one-frame fade would have shown frame 0 near zero.

---

## Safe zone verification

Facebook Reels reserves: **220 px top, 440 px bottom, 180 px right.** Usable
band is `y 220..1480` and `x <= 900`.

### The ink threshold, argued from a measured control

A text-free control was rendered through the identical background pipeline with
identical x264 settings, then decoded back **out of the encoded mp4** and
histogrammed over all 840 frames, 1,741,824,000 pixels:

```
control (background only, decoded from the encoded mp4)
  luma min 2   PEAK 30
  top of the distribution: 20:56.46M  21:39.85M  22:30.57M  23:24.24M
                           24:18.56M  26:14.25M  27:8.42M   28:3.25M
                           29:0.389M  30:0.002M
```

The background peaks at **30** and dies out there. The dimmest thing
deliberately drawn is the accent violet `#A78BFA`, luma about 153 at full alpha
and about 140 where the rule sits at 0.9 over the plate. Body ink `#E8E9ED` is
about 232.

That leaves an empty band from 30 to 140. **Threshold 85 sits in the middle of
it**, 55 levels clear of the background peak and 55 clear of the dimmest ink. A
second pass at **36**, six levels above the measured background peak, was run to
catch antialiased glyph fringes that 85 would drop.

### Method A, absolute threshold, all 840 frames of the delivered file

```
th > 85   union x[100..804]  y[526..1394]
th > 36   union x[100..804]  y[526..1395]

worst frames: right edge 804 @ frame 701 (th 85) and frame 697 (th 36),
              top edge 526 @ frame 0, bottom edge 1394 @ frame 0
```

### Method B, per-frame diff against the text-free control

All 840 frames of both files decoded sequentially in one pass, in lockstep,
compared frame-for-frame, `|delta| > 12` gray levels. **Diffed against the
control, never against an assumed canvas colour**, which is the correction the
brief carries: rows 0 and 1 of a yuv420p frame decode differently from the rest
of the picture and a flat-colour diff reports that codec artefact as ink on
every edge.

```
union x[100..804]  y[526..1395]
worst: right 804 @ frame 696, top 526 @ frame 0, bottom 1395 @ frame 0
```

The control carries the same frame-edge artefact, so the diff cancels it, and
method B did not report ink at `y=0` or `x=0`. That is the positive evidence
that the correction works, not just an assertion that it should.

### Method C, declared geometry of dark-on-dark furniture

Pixel methods cannot see furniture within about 10 luma of the background, and a
per-frame diff shares the blind spot when the element is dark on a dark plate.
The logo mark is exactly that element. Its declared rect is folded in
explicitly:

```
icon mark   overlay x=100 y=1344 at 68x68   ->  rect x[100..168] y[1344..1412]
accent rule beats 1 and 6   drawbox y=526 h=6  ->  top edge 526
```

Both pixel methods stopped short of the logo's real bottom edge, A at 1394 and B
at 1395, because the mark's lower rows are dark. **1412 is the honest number**
and it is the one reported.

### Union of all three, against the three reserves

| Edge | Limit | Measured / declared ink | Headroom | Verdict |
|---|---|---|---|---|
| Top | `y >= 220` | 526 | **306 px** | PASS |
| Bottom | `y <= 1480` | 1412 | **68 px** | PASS |
| Right | `x <= 900` | 804 | **96 px** | PASS |

No edge is under 20 px and none is in single digits. The tightest is the bottom
at 68 px, and it is furniture, not type: the type's own lowest ink is 976, which
would have been 504 px clear.

### Where the methods disagreed, and which one was believed

Only one disagreement, and it resolves toward more ink per the brief's rule.

- **Bottom, 18 px.** A said 1394, B said 1395, the declared logo rect says 1412.
  The rect wins, so the reported bottom headroom is 68 px rather than the 86 px
  the pixel methods alone would have claimed.

The three methods agreed to the pixel on the right edge (804, 804, 804) and on
the top edge (526, 526, 526). A right edge that three independent methods put at
the same pixel is a number worth trusting.

### Line widths were measured before the layout was fixed, not after

Every line was rendered alone on black at its final font and size and its ink
box taken, so the type size was chosen from measurement rather than adjusted
after a failure.

The first draft of beat 1 broke as `Coming up first on` / **`Google does not
mean`** / `you are the answer` / `AI gives.` The second line measured a right
edge of **875**, which is **25 px** of clearance. That is over the brief's 20 px
floor and it was still treated as a failure, because 25 px is one word away from
being a paper pass and the whole point of the floor is that a single copy edit
must not destroy it. Inter-Medium at the same size was measured as an
alternative and was worse at 869. The line was rebroken instead:

```
before   'Google does not mean'  right 875   headroom 25   REJECTED
after    'Google does not'       right 666   headroom 234
         'mean you are the'      right 697   headroom 203
         'answer AI gives.'      right 750   headroom 150  (accent, 80 px)
```

Final measured right edges, worst first:

```
accent Inter-ExtraBold @ 80  l19 'getbrandgeo.com'       right 804   <- binding
body   Inter-SemiBold  @ 72  l7  'We checked a brand'    right 803
                             l14 'twenty questions, it'  right 784
                             l8  'sitting on page one'   right 761
                             l5  'them as one result.'   right 758
accent                       l15 'never appeared.'       right 741
body                         l0  'Coming up first on'    right 736
                             l16 'Google still works.'   right 736
wordmark Inter-Bold @ 40         'BrandGEO'              right 298
```

**Any copy edit that lengthens a line needs this measurement rerun.** The
binding line is `getbrandgeo.com`, which is fixed, and the binding editable line
is `We checked a brand` at 97 px. The practical ceiling is about 20 characters
for a body line and about 16 for an accent line.

### The drawbox traps, and proof neither fired

Two separate `drawbox` failures are documented in the brief and both are handled
by construction rather than by hoping.

**The alpha trap.** On a transparent RGBA source `drawbox` blends instead of
writing alpha, renders at alpha 0 and vanishes with no error. This build removes
the precondition: the plate is forced to `format=rgb24` before any drawing and
the logo overlay is pinned to `format=rgb`, so **no alpha plane exists anywhere
in the draw chain**. `replace=1` is therefore unnecessary and would be wrong
here, because the rule's fade is built from stacked boxes at 0.3 / 0.6 / 0.9 /
0.55 / 0.22 that must alpha-blend against the plate.

The positive check: the accent rule at `y=526` is the only thing drawn above
`y=574`, and the measured minimum ink `y` across all 840 frames is **exactly
526, on frame 0**, by all three methods. If the rule had vanished the measured
top would have been 574, beat 1's first line. It did not.

**The animation trap.** `drawbox` has no `eval` option on 8.1.2 and evaluates
`x/y/w/h` once at init, so any expression in those fields freezes at its t=0
value silently. Nothing in this build animates a box: every rule is a static
rect whose only time dependence is `enable`, which is evaluated per frame and
does work. The fade is three to five stacked static boxes on staggered `enable`
windows. **No `drawbox` geometry field contains `t`.**

### The timeline is not built with ffconcat

The brief records that cumulative float durations in an `ffconcat` list drifted a
scene boundary by one frame while total duration and frame count still looked
right. This build cannot have that failure mode: there is no concat and no
segment list. It is a single looped background at `-framerate 30` with all
timing carried in `enable` and `alpha` expressions, which the filter chain
evaluates per frame.

Verified rather than assumed, by counting ink pixels per frame across all 840
frames of the delivered file and looking for step changes, since frame hashing
does not detect scene changes in an encoded H.264 file:

```
beat starts expected at frames  0, 156, 288, 420, 552, 684
observed transitions (ink count collapsing to the persistent lockup, then rising)
  f144..f146  53483 -> 37632 -> 3366     beat 1 out, ends 5.000 = f150
  f163..f169   3333 -> 15511 -> 40074    beat 2 in,  starts 5.200 = f156 + 0.4s ramp
  f276..f278  39128 -> 25476 -> 3358     beat 2 out, ends 9.400 = f282
  f291..f295   3333 -> 13075 -> 29818    beat 3 in,  starts 9.600 = f288 + ramp
  f410         34792 -> 3344             beat 3 out, ends 13.800 = f414
  f540..f542  36105 -> 21249 -> 3364     beat 4 out, ends 18.200 = f546
  f672..f674  43724 -> 25508 -> 3350     beat 5 out, ends 22.600 = f678
  f834..f836  56258 -> 34752 -> 3380     beat 6 out, ends 28.000 = f840
```

Every transition sits inside its declared 0.35 s fade-out or 0.40 s fade-in
window. The floor between beats is a steady ~3,350 px, which is the persistent
logo and wordmark, so the lockup never disappears.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.

Original BrandGEO composition, cleared for commercial use including paid ads, no
attribution line required. Nothing was synthesized for this cut and nothing was
downloaded. **Held constant across runs on purpose: the hook is the variable
under test, so the bed must not vary with it.** This is the same track, the same
trim length, the same fades and the same normalization as run 3's Facebook cut,
which is what makes the two comparable.

Source is 60.000 s, 48 kHz, 24-bit stereo PCM. Trimmed to the first 28.000 s
with a **0.08 s fade in at t=0** and a **1.5 s fade out starting at 26.500 s**,
then two-pass normalized.

### The fade in is mandatory and the source was re-measured to confirm why

The brief records that an earlier Facebook build skipped the fade in on the
grounds that the track "opens on a downbeat". That was checked again here
directly against the source file and it is false:

```
tension-minor.wav  sample[0]        = (-0.025158, -0.005769)
                   first 64 samples   abs max 0.061709
                   first 10 ms        abs max 0.112205
                   overall peak       0.660526
```

The first sample is already at 0.025 and the first 64 samples reach 0.0617,
exactly the figure the brief cites. A hard cut out of digital silence into that
is a step discontinuity and it clicks regardless of where the musical beat
falls. Whether the arrangement starts on a downbeat is irrelevant to the
question; what matters is the amplitude at sample zero, and it is not zero.

`afade=t=in:st=0:d=0.08` applies a linear ramp over 3840 samples, so sample 63
is attenuated to 63/3840 = 1.6% of its source value.

**Verified on the DELIVERED file**, by decoding the audio back out of
`facebook-scored.mp4` at the final delivery path after AAC encoding:

```
first 64 samples abs max = 0.002845     (requirement: below 0.005)   PASS
first sample pair        = (0.000054, 0.000095)
first 10 ms  abs max     = 0.01342
overall peak             = 0.6143
last 64 samples abs max  = 0.000003     (the fade out lands clean too)
```

### Loudness, two-pass

Pass 1 measured the trimmed and faded excerpt. Pass 2 applied those values with
`linear=true`, which engages because the required gain is small and the
resulting true peak stays well under the ceiling. Linear mode matters here for a
second reason: it is a constant gain, so it cannot distort the 0.08 s fade-in
ramp the way dynamic mode would.

```
pass 1 (measure)   I -16.21   TP -4.41   LRA 3.60   thresh -26.27   offset -1.14
pass 2 (apply)     Output Integrated -15.9 LUFS, True Peak -4.2 dBTP, LRA 3.7 LU
                   Normalization Type: Linear
```

Re-measured after AAC encoding, decoding the audio back out of the delivered
`facebook-scored.mp4`:

```
loudnorm   I -16.02 LUFS   TP -4.22 dBTP   LRA 3.60   thresh -26.07
ebur128    I -16.0  LUFS   true peak -4.2 dBFS   LRA 5.2 LU
                           LRA low -19.1, LRA high -13.9
```

Target is -16 LUFS and the delivered file is at -16.02. True peak is 2.7 dB
under the -1.5 dBTP ceiling. **The two LRA figures disagree, 3.60 against 5.2,
because `loudnorm` and `ebur128` gate differently**; both are reported rather
than picking the flattering one.

### Honest read on how it sounds

I cannot listen to it. What follows is measurement, and someone should audition
it once before it runs anywhere paid.

It is real music rather than a drone, on the two axes a rejected synthesized bed
failed on in an earlier run:

- **Stereo.** L and R differ on **100.00%** of samples, channel correlation
  0.864.
- **Movement.** Per-second RMS of the delivered audio, dBFS:

```
-20 -21 -22 -21 -20 -16 -16 -17 -15 -17 -16 -17 -15 -16 -17 -16 -17 -16
-16 -16 -15 -16 -15 -16 -14 -15 -17 -23
```

The intro, a lift at second 5, a steady body, a small peak at second 24 and the
fade in the last two seconds are all visible in that row.

**One thing changed against run 3 and it is worth knowing.** The music is
identical, but the beat grid is not: run 3 cut beats at 5.2 / 10.2 / 15.2 / 20.2
/ 25.4, and this cut goes 5.2 / 9.6 / 14.0 / 18.4 / 22.8. The lift at second 5
still lands on the beat 1 to beat 2 cut, which was luck in run 3 and is
inherited luck here. The later cuts no longer sit near anything in the
arrangement. Nothing was moved to make either happen and nothing should be read
into it.

The honest qualification, unchanged from run 3 because it is the same excerpt:
this 28 s window measures LRA 3.60 against the parent 60 s track's 6.80. A 28
second window captures part of one section and misses the arrangement's wider
swing, so this cut is calmer than the track it came from. Fine for a bed under
text. Do not quote 6.80 as if it described this file.

**Ship the silent master for the organic post.** Facebook favours audio picked
from its own in-app library.

---

## Technical spec

- 1080x1920, 9:16, 30 fps, H.264 High@4.0, `yuv420p`, `+faststart`, CRF 18,
  preset slow.
- Background is a generated **PNG** intermediate, never JPEG, so the pipeline
  stays limited-range `yuv420p` and does not pick up the `yuvj420p` shift.
- Background: canvas `#090A0F` with three soft radial glows (`#7C3AED` upper
  left, `#6366F1` right, `#8B5CF6` lower) under a vignette, written by a
  dependency-free node PNG encoder (zlib from node core, hand-rolled CRC32,
  colour type 2). A 4x4 ordered dither is baked in at +/- 0.8 levels because an
  8-bit gradient at this size bands visibly without it. Dark only. Measured peak
  luma 30. `md5(bg.png) = dc1010e1d391a9b6ee3dff8ff6bf7774`, byte-identical to
  run 3's plate, so the background is held constant along with the music.
- Motion: the plate is generated at 1188x2112 and cropped to 1080x1920 with a
  slow sinusoidal horizontal drift (18 px, 26 s period) and a slow vertical rise
  (26 px over the runtime), so the frame is never static while the type stays
  still. The 10% overscan guarantees the crop never reaches an edge.
- Text ink `#E8E9ED`, accent `#A78BFA`. `#8B5CF6` appears only in the background
  glows and never as text, per the brief's contrast note.
- Type: vendored Inter from `docs/growth/grok-launch/images/_build/fonts/`.
  SemiBold 72 px body, ExtraBold 80 px accent, Bold 40 px wordmark. Nothing
  downloaded, nothing substituted.
- Logo: `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png` scaled
  to 68 px.
- Motion per line: 0.40 s fade in, 22 px rise over 0.55 s, 0.12 s stagger
  between lines within a beat, 0.35 s fade out. Beat 1 has none of these.

---

## Exact commands

Working directory is the build scratch dir, holding `bg.js`, `bg.png`,
`logo.png`, `fonts/` (copied from the vendored Inter), `t/` (one file per
rendered line) and `fc.txt`. Relative paths throughout, deliberately, to avoid
escaping the drive-letter colon inside filtergraph options.

### 1. Background PNG

```sh
node bg.js bg.png      # dependency-free PNG writer, 1188x2112 rgb24
```

### 2. Silent master

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 28 -i bg.png \
  -loop 1 -framerate 30 -t 28 -i logo.png \
  -/filter_complex fc.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 -movflags +faststart \
  facebook-silent.mp4
```

### 3. Text-free control, for the threshold and for method B

Identical encode, background only, no logo and no text, so the diff can see the
logo as well as the type.

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 28 -i bg.png \
  -/filter_complex fc_ctrl.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 control.mp4
```

`fc_ctrl.txt`, in full:

```
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+18*sin(2*PI*t/26)':y='(in_h-out_h)/2-26*(t/28.0)',format=rgb24,format=yuv420p[v]
```

### 4. Music, trim, fade in and out, two-pass loudnorm

```sh
ffmpeg -y -t 28 -i ../../../../../assets/audio/music/tension-minor.wav \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=26.5:d=1.5" \
  -c:a pcm_s24le -ar 48000 -ac 2 music_cut.wav

# pass 1, measure
ffmpeg -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values linearly
ffmpeg -y -i music_cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:\
measured_I=-16.21:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.27:\
offset=-1.14:linear=true:print_format=summary" \
  -c:a pcm_s24le -ar 48000 -ac 2 music_norm.wav
```

### 5. Scored cut

Video is copied, not re-encoded.

```sh
ffmpeg -y -i facebook-silent.mp4 -i music_norm.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -shortest \
  facebook-scored.mp4
```

### 6. Cover

```sh
ffmpeg -y -i facebook-silent.mp4 -vf "select=eq(n\,0)" -frames:v 1 -c:v png \
  facebook-cover.png
```

### 7. The filtergraph, `fc.txt`

49 draw operations. `drawbox` takes no alpha expression, so each accent rule
fade is built from three to five stacked static boxes on staggered `enable`
windows. Beat 1 has no fade in, no stagger and no rise, so frame 0 is a clean
fully-opaque still that doubles as the cover. Line files `t/l0.txt` through
`t/l19.txt` hold the beat lines in the order listed under "On-screen text"
above, one line of text per file, and `t/wordmark.txt` holds `BrandGEO`. Text is
passed by file rather than inline so the commas inside `On one engine, in` and
`twenty questions, it` need no filtergraph escaping.

`md5(fc.txt) = 4e12a2d66c9f1e9ef8ee8c5c7e8a8ced`. Newlines below sit only at
filter boundaries and are cosmetic.

```
[1:v]scale=68:68[lg];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+18*sin(2*PI*t/26)':y='(in_h-out_h)/2-26*(t/28.0)',format=rgb24[bg];
[bg][lg]overlay=x=100:y=1344:format=rgb[bgl];
[bgl]drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,0.000\,4.650)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,4.650\,4.825)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,4.825\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l0.txt:x=100:y=574:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l1.txt:x=100:y=682:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l2.txt:x=100:y=790:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l3.txt:x=100:y=898:fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,5.200\,5.400)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,5.400\,5.600)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,5.600\,9.050)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,9.050\,9.225)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,9.225\,9.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l4.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-5.200))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.200)\,0\,if(lt(t\,5.600)\,(t-5.200)/0.4\,if(lt(t\,9.050)\,1\,if(lt(t\,9.400)\,(9.400-t)/0.35\,0))))':enable='between(t\,5.200\,9.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l5.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-5.320))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.320)\,0\,if(lt(t\,5.720)\,(t-5.320)/0.4\,if(lt(t\,9.050)\,1\,if(lt(t\,9.400)\,(9.400-t)/0.35\,0))))':enable='between(t\,5.320\,9.400)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l6.txt:x=100:y='850+22*(1-min(1\,max(0\,(t-5.440))/0.55))':fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,5.440)\,0\,if(lt(t\,5.840)\,(t-5.440)/0.4\,if(lt(t\,9.050)\,1\,if(lt(t\,9.400)\,(9.400-t)/0.35\,0))))':enable='between(t\,5.440\,9.400)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,9.600\,9.800)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,9.800\,10.000)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,10.000\,13.450)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,13.450\,13.625)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,13.625\,13.800)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l7.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-9.600))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,9.600)\,0\,if(lt(t\,10.000)\,(t-9.600)/0.4\,if(lt(t\,13.450)\,1\,if(lt(t\,13.800)\,(13.800-t)/0.35\,0))))':enable='between(t\,9.600\,13.800)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l8.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-9.720))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,9.720)\,0\,if(lt(t\,10.120)\,(t-9.720)/0.4\,if(lt(t\,13.450)\,1\,if(lt(t\,13.800)\,(13.800-t)/0.35\,0))))':enable='between(t\,9.720\,13.800)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l9.txt:x=100:y='850+22*(1-min(1\,max(0\,(t-9.840))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,9.840)\,0\,if(lt(t\,10.240)\,(t-9.840)/0.4\,if(lt(t\,13.450)\,1\,if(lt(t\,13.800)\,(13.800-t)/0.35\,0))))':enable='between(t\,9.840\,13.800)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,14.000\,14.200)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,14.200\,14.400)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,14.400\,17.850)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,17.850\,18.025)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,18.025\,18.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l10.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-14.000))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,14.000)\,0\,if(lt(t\,14.400)\,(t-14.000)/0.4\,if(lt(t\,17.850)\,1\,if(lt(t\,18.200)\,(18.200-t)/0.35\,0))))':enable='between(t\,14.000\,18.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l11.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-14.120))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,14.120)\,0\,if(lt(t\,14.520)\,(t-14.120)/0.4\,if(lt(t\,17.850)\,1\,if(lt(t\,18.200)\,(18.200-t)/0.35\,0))))':enable='between(t\,14.120\,18.200)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l12.txt:x=100:y='850+22*(1-min(1\,max(0\,(t-14.240))/0.55))':fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,14.240)\,0\,if(lt(t\,14.640)\,(t-14.240)/0.4\,if(lt(t\,17.850)\,1\,if(lt(t\,18.200)\,(18.200-t)/0.35\,0))))':enable='between(t\,14.240\,18.200)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,18.400\,18.600)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,18.600\,18.800)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,18.800\,22.250)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,22.250\,22.425)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,22.425\,22.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l13.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-18.400))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,18.400)\,0\,if(lt(t\,18.800)\,(t-18.400)/0.4\,if(lt(t\,22.250)\,1\,if(lt(t\,22.600)\,(22.600-t)/0.35\,0))))':enable='between(t\,18.400\,22.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l14.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-18.520))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,18.520)\,0\,if(lt(t\,18.920)\,(t-18.520)/0.4\,if(lt(t\,22.250)\,1\,if(lt(t\,22.600)\,(22.600-t)/0.35\,0))))':enable='between(t\,18.520\,22.600)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l15.txt:x=100:y='850+22*(1-min(1\,max(0\,(t-18.640))/0.55))':fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,18.640)\,0\,if(lt(t\,19.040)\,(t-18.640)/0.4\,if(lt(t\,22.250)\,1\,if(lt(t\,22.600)\,(22.600-t)/0.35\,0))))':enable='between(t\,18.640\,22.600)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,22.800\,23.000)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,23.000\,23.200)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,23.200\,27.650)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,27.650\,27.825)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,27.825\,28.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l16.txt:x=100:y='574+22*(1-min(1\,max(0\,(t-22.800))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,22.800)\,0\,if(lt(t\,23.200)\,(t-22.800)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,22.800\,28.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l17.txt:x=100:y='682+22*(1-min(1\,max(0\,(t-22.920))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,22.920)\,0\,if(lt(t\,23.320)\,(t-22.920)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,22.920\,28.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l18.txt:x=100:y='790+22*(1-min(1\,max(0\,(t-23.040))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,23.040)\,0\,if(lt(t\,23.440)\,(t-23.040)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,23.040\,28.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l19.txt:x=100:y='898+22*(1-min(1\,max(0\,(t-23.160))/0.55))':fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,23.160)\,0\,if(lt(t\,23.560)\,(t-23.160)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,23.160\,28.000)',
drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=t/wordmark.txt:x=184:y=1364:fontsize=40:fontcolor=0xE8E9ED:alpha='0.72',format=yuv420p[v]
```

---

## Suggested feed caption

Not posted. Provided for review alongside the video.

> Coming up first on Google and being the name an AI gives are two different
> measurements. Most teams only run one of them.
>
> We audited a market-leading brand that sits on page one of Google for its
> category. Twenty real customer questions, the same twenty put to every engine.
> Three engines came back naming it as the top recommendation. On one engine it
> did not appear once, across all twenty questions. Not further down the answer.
> Not mentioned in passing. Absent.
>
> Nobody inside that business knew, because nothing they already owned was
> built to check it. Rankings looked fine, because rankings were fine.
>
> None of this means search stopped working. It means the two things are
> measured separately, and only one of them was being watched.
>
> The full audit is BG-004 on our research page.
>
> getbrandgeo.com

---

## Open items for whoever reviews this

1. ~~**Google is named on screen three times.**~~ **CLOSED 2026-07-30 by the
   coordinator: keep it as rendered, do not apply the revert.** The rule was
   imprecise and was rewritten rather than the video. Full ruling and the
   surviving-the-removal test are in the evidence section above. Nothing to do.
   Recorded here because the next cut in this campaign inherits the corrected
   rule, not the old blanket one: naming the engine or platform being measured
   is allowed, naming a party that turned up inside a result set is not.
2. **Audition `facebook-scored.mp4`.** The music has been measured, not heard.
   The first-64-sample check confirms the click is gone (0.002845 against a
   0.005 limit) but that is a number, not an ear.
3. **`RUN.md` for run 20260730-0113 has not been written**, and note that run
   20260730-0013's `RUN.md` records the same gap for its own run. The brief asks
   each run to record its hook driver there, which sits one level above this
   folder and outside this task's write scope. Driver **#4, contrarian**, track
   `tension-minor`, for this run. Next run advances to **#5, concrete proof**.
4. **Driver #5 will collide with the safe zone harder than this one did.** Run
   3's `RUN.md` already flagged that evidence lines run wider than argument
   lines, and this cut confirms it: the two lines carrying figures, `twenty
   questions, it` and `We checked a brand`, are the two widest editable lines in
   the video. "Here is the exact prompt and the exact answer" means quoting
   text that was not written to fit 20 characters. Whoever builds it should
   measure line widths first and pick the finding to fit, not write the finding
   and then discover it does not fit.
5. **BG-004 is a single client, a single audit, and dated July 2, 2026.** It is
   the right evidence for a contrarian argument because the argument is
   qualitative, a claim that two things can diverge, and one clean divergence
   proves it. It would be the wrong evidence for a claim about how often this
   happens, and the video is careful never to make one. If the campaign wants a
   rate, it needs a page that publishes one.
6. **Beat 4 drops a qualifier BG-004 carries.** The page says the brand was the
   top recommendation "across the majority of the 20 questions", not on all
   twenty. The video says "Three AI engines put it first in their answers",
   which matches the page's own Key Findings block but is looser than its body
   text. There are 215 px of right clearance on that beat if a reviewer wants
   the qualifier on screen.
