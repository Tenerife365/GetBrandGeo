# Facebook Reel, run 20260730-0313

Built with ffmpeg 8.1.2 directly. Remotion is not installed and nothing was
installed. Nothing here has been posted or scheduled. No git command was run.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master.** Zero audio streams, not a muted one. Pair with a track from Facebook's in-app music library. |
| `facebook-scored.mp4` | Identical video bitstream plus the BrandGEO-composed track `tension-minor`. For paid, site embeds and decks. |
| `facebook-cover.png` | 1080x1920 cover. Verified byte-identical to frame 0 of the delivered master. |

---

## Hook driver

**#6, utility.** "Here is a check you can run on your own business."

This closes the six-driver cycle. It is the only driver in the set that does not
try to move the viewer:

- Run 1 **loss aversion**: you are already losing something.
- Run 2 **status threat**: someone else is in your slot.
- Run 3 **curiosity gap**: we ran a study, here is what we withheld.
- Run 4 **contrarian**: you believe X, X is wrong.
- Run 5 **concrete proof**: here is the artefact, go and check it.
- This run **hands over the method**. Three steps, then the engine list. The
  value lands whether or not the viewer ever buys, which is the point.

**The honest line is on screen, not implied.** Beat 6 says the manual check is
free and worth doing. That is true: anyone can type their own customer's
question into an AI engine and read what comes back, and nothing in this product
is required to do it. Beat 7 adds the one thing that check cannot do, which is
persist. Pretending the free check is worthless would have been the easy
version and would have contradicted the driver: a utility hook that undersells
the utility it just handed over reads as a bait.

**One instruction does the real work.** "Do not type your own name" is the
difference between a check that flatters and a check that informs. Searching
your own brand almost always returns something; searching the question a buyer
actually asks is the test. It is the single most useful sentence in the cut and
it is why step one is three lines rather than one.

**Facebook-native execution.** Plain business language, no category jargon,
short declaratives, seven slow beats over 29 s. Mean beat 3.97 s, nothing under
2.8 s, 1.20 s of the runtime spent in gaps between beats. The steps are legible
from the video alone, with no prior knowledge and nothing to click.

---

## On-screen text, verbatim

Read back out of the twenty seven text files ffmpeg actually draws from, not
retyped. Line breaks below are rendering breaks; they do not alter any string.

**Beat 1, 0.000 to 4.200 s.** Cover beat. No fade in, no stagger, no rise, so
frame 0 is a fully opaque still. Eyebrow accent, body ink.

```
TRY THIS TODAY

Three steps.
Nothing to buy.
```

**Beat 2, 4.400 to 8.600 s.**

```
STEP ONE

Open ChatGPT.
Do not type
your own name.
```

**Beat 3, 8.800 to 13.200 s.**

```
STEP TWO

Type what a customer
would ask to find
a business like yours.
```

**Beat 4, 13.400 to 17.800 s.**

```
STEP THREE

Read the answer.
Count who gets named.
See if you are there.
```

**Beat 5, 18.000 to 22.400 s.** Rows at 52 px on an 88 px lead, ink, staggered
in at 0.12 s intervals.

```
THEN IN EACH OF THESE

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**Beat 6, 22.600 to 25.400 s.** No eyebrow. The honest line.

```
That check is free.
It is worth doing.
```

**Beat 7, 25.600 to 29.000 s.** No eyebrow. What we add, then the soft CTA. URL
in ExtraBold accent. No pricing. Rewritten and re-rendered, see the correction
section below.

```
It is also one snapshot.
The record is the work.
getbrandgeo.com
```

**Persistent, whole runtime:** the icon mark at 68 px plus the wordmark
`BrandGEO` at 72% opacity, bottom left.

Exact rendered strings, as read out of the line files:

```
l00 'TRY THIS TODAY'          l13 'Count who gets named.'
l01 'Three steps.'            l14 'See if you are there.'
l02 'Nothing to buy.'         l15 'THEN IN EACH OF THESE'
l03 'STEP ONE'                l16 'ChatGPT'
l04 'Open ChatGPT.'           l17 'Gemini'
l05 'Do not type'             l18 'Claude'
l06 'your own name.'          l19 'Perplexity'
l07 'STEP TWO'                l20 'Google AI Mode'
l08 'Type what a customer'    l21 'That check is free.'
l09 'would ask to find'       l22 'It is worth doing.'
l10 'a business like yours.'  l23 'It is also one snapshot.'
l11 'STEP THREE'              l24 'The record is the work.'
l12 'Read the answer.'        l25 'getbrandgeo.com'
                              wordmark 'BrandGEO'
```

---

## Evidence: what is asserted, and where it comes from

**This cut contains no numbers.** Verified mechanically, not by reading:
`textcheck.py` asserts zero digit characters across the union of all
twenty seven rendered strings, and it passes. There is no percentage, no city
count, no engine count, no rate, no date and no price.

That is a deliberate consequence of the driver rather than an accident. A
utility hook is an instruction set, and an instruction does not need a
denominator. It also means the brief's hardest evidence rule has nothing to bite
on here: there is no figure whose provenance could be mistaken for ours.

| On screen | What kind of claim it is | Source |
|---|---|---|
| `Three steps.` | structural, and the video shows them | self-verifying; beats 2, 3 and 4 |
| `Nothing to buy.` | true of the manual check | the check needs no BrandGEO account |
| `Open ChatGPT.` | instruction | engine label from `planConfig.ts` `ENGINE_META` |
| `ChatGPT / Gemini / Claude / Perplexity / Google AI Mode` | product coverage | `brandgeo-dashboard/src/lib/planConfig.ts` `PLAN_ENGINES.growth`, verified line by line, labels from `ENGINE_META` |
| `That check is free.` | true of the manual check | as above |
| `It is also one snapshot.` | property of the method | a single reading is a single point in time, true by construction |
| `The record is the work.` | what the product does | describes retained history; makes no cadence, volume or coverage promise, and no claim about anyone else |

**Engine lineup, checked rather than remembered.** `PLAN_ENGINES.growth` in
`planConfig.ts` reads exactly `['chatgpt', 'gemini', 'claude', 'perplexity',
'google_ai']`. The five on screen are those five, in `ENGINE_META` label form,
and no sixth appears. `textcheck.py` asserts both directions: all five present,
and none of `Meta AI`, `Copilot`, `DeepSeek`, `Grok`, `AI Overviews`,
`Google AI Overviews` or `Llama` present. Grok and AI Overviews are live but
only from Growth PRO up, so they are off this list by plan, not by oversight.

**No cadence claim.** An earlier draft of beat 7 read "We run it weekly". That
was cut before rendering. `refresh_cadence` defaults to `manual`, the collection
cooldown is 48 h, and the marketing site's own "Daily/weekly refresh" line was
corrected downward on 2026-07-28 for exactly this reason. `The record is the
work.` describes what is produced and carries no rate; "weekly" is a number
dressed as a word.

**Sources deliberately not used.** `bg-016.html` (four engines including retired
Meta AI) and `bg-004.html` (claims five engines while naming six, including
Microsoft Copilot and Meta AI) were not opened for any figure. The phrase
"27 cities" appears nowhere. `bg-005.html`'s 48% and 93% were never candidates:
they sit inside a first-party page but were measured by a third party, which is
the loophole the brief closed on 2026-07-30.

---

## Correction: beat 7 was rewritten and re-rendered

The coordinator's brief described BrandGEO's role as "the part nobody does by
hand", and corrected that wording mid-build after a sibling agent on this run
flagged it. `nobody` is a claim about every business on earth and one
counterexample refutes it, which makes it the same species of defect as the
`first` / `only` / `most` superlative ban already in the brief.

**Nothing had to be unwound.** The rendered cut never contained a universal.
Beat 7 read `Doing it over and over / and keeping the record / is the part we
do.`, which describes a division of labour without asserting anything about
anyone else, and the compliance sweep confirms the absence mechanically rather
than by my reading it back. So the correction found no defect in this cut.

**It was re-rendered anyway, because the replacement is better copy.** The old
beat 7 stated *what we do* but never said *why one check is not enough*, which
is the load-bearing idea and the one the viewer needs to get to a reason. The
new lines say it:

```
It is also one snapshot.
The record is the work.
```

Both are claims about the METHOD. A single reading is a single point in time by
construction, and the accumulated record is what is being produced. Neither can
be refuted by a counterexample somewhere in the world, which is exactly the
property the universal ban exists to protect. The idea is the sibling's; the
wording is this platform's, per the coordinator's instruction to write it in my
own voice.

**Not hedged.** "Almost nobody" and "hardly anyone" were not considered: they
are the same unfalsifiable claim with deniability, and the coordinator ruled
them out explicitly. The manual check is also still not disparaged, which the
brief was right to insist on. Beat 6 says it is free and worth doing, and beat 7
adds only that it does not persist.

**The obvious wording was too wide and was rejected on measurement, not taste.**
`One check is a snapshot.` measures 874 px at SemiBold 64, leaving 26 px against
the right reserve. That clears the brief's 20 px floor and is exactly the paper
pass the brief warns about, and it would have cut the cut's binding right-hand
margin from 66 px to 26 px for a copy preference. Candidates were measured with
real Inter metrics before anything was re-rendered:

| Candidate | x1 | Headroom |
|---|---|---|
| `That check is a snapshot.` | 889 | **11, fails** |
| `One check is a snapshot.` | 874 | 26, a paper pass |
| `We run it again and again` | 877 | 23, a paper pass |
| **`It is also one snapshot.`** | **810** | **90, chosen** |
| `The record is the work.` | 815 | 85 |
| `A check is a snapshot.` | 795 | 105 |

`It is also one snapshot.` also carries a cleaner pronoun chain: beat 6 says
`That check is free. / It is worth doing.`, so beat 7's `It` already has its
referent and no noun has to be reintroduced.

### Re-verified after the re-render, not carried forward

Every number in the sections below was re-measured against the new build. The
things that did NOT change, and why:

- **The safe-zone union is identical** (`x 98..829, y 442..1400`). Beat 7 was
  never the binding element on any edge; `Count who gets named.` in beat 4 binds
  the right and the logo mark binds the bottom, and neither was touched. Beat
  7's block is one line shorter, so its accent rule moved from y=580 to y=586,
  which is interior.
- **The cover is byte-identical to the previous build** (`md5
  4e1cee36308d619056f8bb57db933992`), because beat 1 was not touched. That is
  expected, and it was still re-checked against frame 0 of the new delivered
  master rather than assumed.
- **`control.mp4` was reused rather than re-rendered.** It is a pure function of
  `bg.png` and `fc_ctrl.txt`, and both were confirmed unchanged by md5 across
  the rebuild, so it is still a text-free control through the identical
  pipeline. The noise floor it produces was re-measured anyway against the new
  render, since the encoder's response depends on the content: 7, 8 and 7 in the
  three empty-by-design regions, ceiling 8, unchanged, so threshold 12 still
  clears it.
- Total duration, beat boundaries and beat count are unchanged at 29.000 s and
  seven beats. Beat 7 now carries 3 elements instead of 4 in the same 3.4 s,
  which is more comfortable rather than less.

`md5(fc.txt)` moved from `56640699413f64776eddf8f35f9201d8` to
`a2e25bc93d5b52665577e49aab3f4336`, and the draw-operation count from 61 to 60
(one fewer `drawtext`).

### The check now enforces this, not just this cut

`textcheck.py` gained a universal-quantifier assertion alongside the superlative
one, so the ban is machine-enforced for anything built from this scratch dir:
`nobody`, `no one`, `noone`, `everyone`, `everybody`, `always`, `never`,
`every business`, `every company`, `every brand`, `anyone`, `all businesses`,
`all companies`, `industry-wide`, plus the hedged forms `hardly anyone`,
`almost nobody`, `nobody else` and `no one else`. It reports `NONE` on the
delivered text.

---

## No superlative, and no measured subject, verified mechanically

Run by `textcheck.py` against the rendered text files rather than the script, so
what is tested is what reached the screen. Exit code 0.

**Superlatives: none.** The sweep asserts the absence of `first`, `only`, `most`,
`biggest`, `best`, `largest`, `fastest`, `leading`, `unique`, `unmatched`,
`no other` and `ever` as whole words. **Universal quantifiers: none**, asserted
separately, see the correction section for the full list. This driver needed
neither: an instruction is not a ranking claim and not a claim about the world,
so there was never a reason to reach for one. That is worth stating plainly
given run 5 had to
re-render two cuts after two agents faithfully quoted
`ai-visibility-for-chicago.html`'s "the first fully unanimous result measured
anywhere in this research program", which
`ai-visibility-for-boston.html` refutes with three, collected the same day.

**Measured subjects: none, because there is no result set in this cut.** No
company, firm, person or client appears. The only proper nouns on screen are the
five engines and our own wordmark and domain.

Method: every capitalised token and every capitalised multi-word run was
harvested by regex from the rendered strings, then reduced by removing
allow-listed engine and brand tokens and one sentence-initial word. Anything
left over would be a suspect. Eleven candidates came back and every one was
adjudicated in the check itself rather than waved through:

- `Open ChatGPT` is a sentence-initial verb followed by an allow-listed engine
  name. Remove both and nothing remains.
- `Count`, `Do`, `It`, `Nothing`, `Read`, `See`, `That`, `The`, `Three` and
  `Type` are ordinary sentence-initial words.

The first pass of this check **failed** on `Open ChatGPT` and the check was
fixed rather than the result excused: the original rule only exempted
single-word sentence-initial tokens, so any capitalised run beginning a sentence
and containing an engine name was flagged. The corrected rule subtracts
allow-listed tokens first and then the sentence-initial word.

Also asserted and passing: no banned vocabulary, no em or en dashes, no
non-ASCII characters at all, no pricing language, no `27 cities`, no `48%`, no
`93%`. There is not a single hyphen in the cut.

The five engines **are** named, which the brief permits and this driver
requires. They are the instruments and the category, not the subject of any
measurement. By the brief's own test, "check it in five engines" does not
survive removing them, so they stay.

---

## Safe zone, measured on the DELIVERED file

Facebook Reels reserves: **top 220, bottom 440, right 180.** Ink limits
therefore `y >= 220`, `y <= 1480`, `x <= 900`. Frames decoded sequentially in one
pass out of `facebook-silent.mp4` and out of the control in lockstep, indexed by
position. No `-ss` seeking. All 870 frames measured, not a sample.

**Threshold justification, argued from a measured control, not chosen by feel.**
The text-free control's peak luma measures **21.01**. Ink `#E8E9ED` is luma
233.1 and accent `#A78BFA` is 153.0. Threshold **60** sits in the empty gap
between 21 and 153.

| Method | What it answers | Result |
|---|---|---|
| A, absolute luma > 60 | identity, and overlapping elements | x 100..828, y 442..1383 |
| B, diff vs text-free control > 12 | presence | x 98..829, y 442..1383 |
| C, declared geometry | anything within ~10 luma of the canvas | x 100..204, y 442..1400 |
| **Union** | | **x 98..829, y 442..1400** |

A and B agree to within 2 px on the left, 1 px on the right, and exactly on both
top and bottom. Where they differ the larger box was taken.

| Edge | Reserve | Ink | Headroom | Verdict |
|---|---|---|---|---|
| top | 220 | 442 | **222 px** | PASS |
| bottom | 440 | 1400 | **80 px** | PASS |
| right | 180 | 829 | **71 px** | PASS |

Left ink sits at x=98; no left reserve is declared for this platform. Every edge
clears the brief's 20 px floor by a wide margin, so none of these is a paper
pass.

**Method B's threshold was measured, not guessed.** `noise.py` characterised the
diff noise floor in three regions empty by design before any threshold was
chosen: `x >= 950` returned a max diff of 7, `y >= 1500` returned 8, and
`y < 400` returned 7. Adding text changes libx264's rate control across the whole
frame, so the render differs from the control even where nothing is drawn; that
is encoder response to content, not ink, and a control cannot cancel it because
the control does not have the content. 12 clears the measured ceiling of 8 with
margin. At that threshold B lands within 2 px of A everywhere.

**The bottom constraint came from method C and neither pixel method could see
it.** Both A and B stop at y=1383, the bottom of the wordmark's descender. The
logo mark's declared rect runs to y=1400. Sampled directly on the cover, the
logo region means RGB `24.4, 19.9, 43.6`, luma about 22.6, against a canvas of
`8.1, 8.7, 14.7`. That is under the absolute threshold of 60 and under the diff
threshold of 12 at its lower rows, so it is invisible to both. Folding the
declared rect in cost 17 px of claimed headroom, 97 down to 80. This is the
documented dark-on-dark blind spot and it was load-bearing again here.

**Predicted vs delivered.** `build.py` predicted the right-hand ink at x=834
from tight Inter glyph bboxes; the delivered frame measured 829, so the
prediction was conservative by 5 px in the safe direction. The binding string on
the right is `Count who gets named.`, beat 4. Every other line clears by 100 px
or more, and unlike run 5 this one is editable if Facebook's right reserve ever
moves.

---

## Render integrity

- **Cover is frame 0.** `md5` over raw RGB of the delivered `facebook-cover.png`
  and of frame 0 decoded from the delivered `facebook-silent.mp4` both give
  `4e1cee36308d619056f8bb57db933992`. Byte-identical. Checked again after the
  files were copied to their final path, not only in the build directory.
- **No fade on scene 1.** Beat 1 carries no fade in, no stagger and no rise.
  Frame 0 measures 24,076 ink pixels against frame 1's 24,072, so the cover is
  fully opaque at t=0 rather than ramping up from nothing.
- **`drawbox` cannot animate on 8.1.2** (no `eval` option; `x/y/w/h` evaluate
  once at init), so each accent rule's fade is built from stacked static boxes
  on staggered `enable` windows: 33 `drawbox` ops for 7 rules, 3 for the cover
  beat and 5 for each of the others. `replace=1` is set on every one. Without it
  `drawbox` blends instead of writing alpha on an RGBA source and vanishes
  silently. Confirmed **written, not blended**, by sampling inside beat 1's rule
  on the cover: mean RGB `150.1, 125.4, 222.6` against `12.5, 10.4, 22.7` ten
  pixels below it.
- **No `ffconcat`.** The timeline is one filtergraph over a looped still at
  `-framerate 30`, frame-exact by construction. Verified on the delivered file:
  ink-pixel step changes cluster at 4.10 to 4.87, 8.50 to 9.27, 13.10 to 13.87,
  17.70 to 18.70, 22.30 to 22.83, 25.33 to 26.00 and 28.90 to 28.93 s, which are
  the seven declared beat transitions and nothing else. Each cluster spans a
  beat's fade-out and the next beat's staggered fade-in, so a spread rather than
  a single frame is expected here.
- **Scene detection by ink count, not frame hashing.** Identical pictures get
  different quantisation noise in H.264, so hashes differ where nothing changed.
- **PNG intermediates, never JPEG.** The background plate and the cover are both
  PNG, so the pipeline stays limited-range `yuv420p` and never picks up the
  `yuvj420p` full-range shift.
- **The delivered files were probed, not assumed.** A mux can exit 0 and be
  unreadable. Both were re-probed at their final path after copying.
- **Video bitstream identity.** The raw H.264 elementary stream extracted from
  the silent master and from the scored file both hash to
  `e5861b3b5e8952fc98420b7c1d1798da`, so `-c:v copy` did what it claims and the
  two cuts are the same picture.

| Probe of the DELIVERED file | silent | scored |
|---|---|---|
| container duration | **29.000000 s** | **29.000000 s** |
| streams | 1 | 2 |
| **audio streams** | **0** | 1 |
| video | h264, 1080x1920, 30/1, yuv420p | identical bitstream, `-c:v copy` |
| decoded frame count | 870 | 870 |

29.000 s sits inside Facebook Reels' 20 to 30 s band.

---

## Audio

`tension-minor.wav`, BrandGEO-composed, cleared for commercial use, no
attribution line required. Held **constant** across the run; the hook is the
variable under test, and it is the same track run 5 used, deliberately.

- Trimmed to 29 s from a 60 s source.
- **Fade in `0.08 s`, mandatory.** The source's first 64 samples peak at
  **0.0617** and it reaches 0.2063 inside its first 0.1 s, so cutting in at
  sample 0 would click audibly.
- Fade out 1.5 s, starting at 27.5 s.
- Two-pass `loudnorm`, measured then applied linearly. Single-pass undershoots
  by about 0.9 LU. Pass 1 measured `I=-16.12, TP=-4.41, LRA=3.60,
  thresh=-26.23, offset=-1.18`.

**Verified on the DELIVERED file at its final path**, decoded to f32:

| Check | Value | Verdict |
|---|---|---|
| peak amplitude, first 64 samples | **0.00295** | PASS, under 0.005 |
| peak amplitude, first 32 samples | 0.00204 | ramping from silence, not stepping |
| peak amplitude, last 64 samples | 0.00000 | fade out lands at silence |
| integrated loudness re-measured | **-16.0 LUFS** | on target |
| true peak | -4.3 dBTP | under the -1.5 ceiling |
| overall sample peak | 0.6096 | no clipping |
| loudness range | 4.9 LU | |

Decoded audio runs 29.0133 s against a 29.000 s video because AAC quantises to
1024-sample frames. `-shortest` held the container to exactly 29.000000 s.

**How the track actually sounds:** a sparse minor-key bed, sustained pad with a
slow pulse, no drums and no melodic hook. It is a bed, not a track. On this
driver it sits slightly against the copy: the words are practical and
instructional while the bed is tense, so the pairing is the weakest thing about
the scored cut. It is still fine as the paid and embed fallback, and the silent
master remains the one to post organically, since Facebook favours audio picked
from its own in-app library. If a second BrandGEO-composed track is ever
assigned to this driver, `clean-utility.wav` is the obvious candidate by name
and was deliberately not substituted here, because changing the music mid-cycle
would confound the hook A/B this campaign exists to run.

---

## Technical spec

- 1080x1920, 9:16, 30 fps, H.264 High@4.0, `yuv420p`, `+faststart`, CRF 18,
  preset slow.
- Background: canvas `#090A0F` with three soft radial glows (`#7C3AED` upper
  left, `#6366F1` right, `#8B5CF6` lower) under a vignette, floored back to the
  brand black so the vignette never dips under it. A 4x4 ordered dither at
  +/- 0.8 levels is baked in because an 8-bit gradient at this size bands
  visibly. Measured peak luma **20.29** at source, 21.01 after encode. Dark only.
  `md5(bg.png) = b2c0e33ef0dcdede655367578b580c12`.
- Motion: the plate is generated at 1188x2112 and cropped to 1080x1920 with a
  slow sinusoidal horizontal drift (18 px, 26 s period) and a slow vertical rise
  (26 px over the runtime), so the frame is never static while the type stays
  still. The 10% overscan guarantees the crop never reaches an edge.
- Text ink `#E8E9ED`, accent `#A78BFA`. `#8B5CF6` appears only in the background
  glows and never as text, per the brief's contrast note.
- Type: vendored Inter from `docs/growth/grok-launch/images/_build/fonts/`.
  Body SemiBold 64 px on a 96 px lead, engine rows SemiBold 52 px on an 88 px
  lead, eyebrows Bold 40 px, URL ExtraBold 60 px, wordmark Bold 40 px. Nothing
  downloaded, nothing substituted.
- Logo: `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`
  (`md5 c9e163a7e687b22c5b88166e228a35b0`, confirmed against the source) scaled
  to 68 px.
- Motion per line: 0.40 s fade in, 22 px rise over 0.55 s, 0.12 s stagger within
  a beat, 0.35 s fade out. Beat 1 has none of these.
- 60 draw operations, 27 `drawtext` and 33 `drawbox`.
  `md5(fc.txt) = a2e25bc93d5b52665577e49aab3f4336`.

### The type budget

Every candidate line was measured with real Inter metrics before anything was
rendered (`widths.py`), against 800 px of usable width (left margin 100, right
limit 900).

| Line | Face, size | Predicted x1 | Headroom |
|---|---|---|---|
| `Count who gets named.` | sb 64 | 834 | **66, binding** |
| `The record is the work.` | sb 64 | 815 | 85 |
| `It is also one snapshot.` | sb 64 | 810 | 90 |
| `Type what a customer` | sb 64 | 789 | 111 |
| `a business like yours.` | sb 64 | 770 | 130 |
| `Google AI Mode` | sb 52 | 499 | 401 |

64 px body was kept rather than dropped, because the binding line cleared with
66 px predicted and 71 px delivered. Unlike run 5, no string here is a quotation
and every one of them can be shortened if a future reserve change demands it.

---

## Exact commands

Working directory is the build scratch dir, holding `bg.py`, `bg.png`,
`logo.png`, `fonts/`, `t/` (one file per rendered line) and `fc.txt`. Relative
paths throughout, deliberately, to avoid escaping the drive-letter colon inside
filtergraph options.

### 1. Background PNG

```sh
python bg.py            # PIL + numpy, 1188x2112 rgb24, prints peak luma
```

### 2. Silent master

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 29 -i bg.png \
  -loop 1 -framerate 30 -t 29 -i logo.png \
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
  -loop 1 -framerate 30 -t 29 -i bg.png \
  -/filter_complex fc_ctrl.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 control.mp4
```

`fc_ctrl.txt`, in full:

```
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+18*sin(2*PI*t/26)':y='(in_h-out_h)/2-26*(t/29.0)',format=rgb24,format=yuv420p[v]
```

### 4. Music, trim, fade in and out, two-pass loudnorm

```sh
ffmpeg -y -t 29 -i ../../../../../assets/audio/music/tension-minor.wav \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=27.5:d=1.5" \
  -c:a pcm_s24le -ar 48000 -ac 2 music_cut.wav

# pass 1, measure
ffmpeg -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values linearly
ffmpeg -y -i music_cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:\
measured_I=-16.12:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.23:\
offset=-1.18:linear=true:print_format=summary" \
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

60 draw operations, generated by `build.py` so every coordinate is computed
rather than typed. `drawbox` takes no alpha expression and cannot animate, so
each accent rule fade is built from stacked static boxes on staggered `enable`
windows, all carrying `replace=1`. Beat 1 has no fade in, no stagger and no
rise, so frame 0 is a clean fully-opaque still that doubles as the cover. Text
is passed by file rather than inline so no string needs filtergraph escaping.
Header and tail:

```
[1:v]scale=68:68[lg];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+18*sin(2*PI*t/26)':y='(in_h-out_h)/2-26*(t/29.0)',format=rgb24[bg];
[bg][lg]overlay=x=100:y=1332:format=rgb[bgl];
[bgl]drawbox=x=100:y=566:w=104:h=6:color=0xA78BFA@0.9:t=fill:replace=1:enable='between(t\,0.000\,3.850)',
...
drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=t/wordmark.txt:x=190:y=1345:fontsize=40:fontcolor=0xE8E9ED:alpha=0.72,format=yuv420p[v]
```

---

## What a reviewer should push back on

1. **This cut asks for almost nothing.** There is no threat, no tease, no
   argument and no offer, and the CTA is one URL at the very end. If the metric
   is click-through it will probably lose to run 1. If the metric is saves,
   shares and comments, it is the most likely of the six to win, because it is
   the only one a viewer has a reason to send to someone else. Decide which
   number the cycle is being judged on before comparing.
2. **Step one names one engine and step five names five.** A viewer who stops
   after step one has done a single-engine check and may conclude more than that
   check supports. The engine list at beat 5 is the correction, and it arrives
   14 s in. Moving it earlier was considered and rejected: five names before any
   instruction reads as a feature list, which is the thing this driver is meant
   not to be.
3. **"It is worth doing" is an opinion, on a campaign built on measurement.**
   It is defensible as advice rather than as a finding, and it is not framed as
   a result. It is still the one line in the cut that a strict reading of the
   evidence rule would want gone.
4. **The bed does not fit the copy.** `tension-minor` is tense; these words are
   practical. Held constant on purpose, and flagged rather than fixed, because
   changing the music would confound the hook test.
5. **Nothing on screen distinguishes us from a competitor doing the same
   thing.** `The record is the work.` is a claim about the method, not a
   capability anyone else lacks, and after the universal ban it deliberately
   cannot be one. That is honest and it is also thin. It is the right trade for
   TOFU and the wrong one if this asset is ever repurposed lower in the funnel.
