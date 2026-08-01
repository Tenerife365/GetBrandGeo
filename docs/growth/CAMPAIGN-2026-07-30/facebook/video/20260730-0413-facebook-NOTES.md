# Facebook Reel, run 20260730-0413

Built with ffmpeg 8.1.2 directly. Remotion is not installed and nothing was
installed. Nothing here has been posted or scheduled. No git command was run.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master.** Zero audio streams, not a muted one. Pair with a track from Facebook's in-app music library. |
| `facebook-scored.mp4` | Identical video bitstream plus the BrandGEO-composed track `tension-minor`. For paid, site embeds and decks. |
| `facebook-cover.png` | 1080x1920 cover. Verified byte-identical to frame 0 of the delivered master, at the final path. |

---

## Hook driver

**#1, loss aversion. SECOND PASS.** This is a replication of run 1's driver with a
deliberately different execution, so that the driver can be separated from the
cut. If run 1 performs, the pair tells us whether loss aversion works or whether
run 1's particular treatment worked. That only holds if this cut shares the
driver and shares almost nothing else, so the separation was engineered rather
than left to chance.

### What run 1 did, and what this does instead

Run 1 (`run-20260729-2200/facebook`) opened on the **event**: "Someone asked an
AI for a business like yours this morning," then "It gave one answer. Three
names. Yours was not one." Its spine was a single missed transaction and the
viewer's absence from one result.

This cut takes a different shape of the same driver: **a decision already made
without you in the room.** Not a missed sale, an excluded seat. The loss is
structural rather than episodic, and it is stated as a property of how a short
answer works rather than as an event that is asserted to have happened.

| | Run 1 | This run |
|---|---|---|
| Opening move | asserts an event occurred this morning | states how the choice narrows, asserts no event |
| Spine | one answer, three names, yours missing | a shortlist exists and you had no seat at it |
| The invisible part | "No click. No visit. Nothing in analytics." | "Named or not, your reporting looks the same." The gap is framed as an ambiguity in the data, not an absence of it |
| Who the loss is about | the viewer's name being absent from a list | the viewer's absence from the decision |
| Beats | 6 | **7** |
| Engine presentation | five names inside a prose sentence | a **list**, one engine per row, its own beat |
| Furniture | a 104x6 **horizontal** accent dash above each block | a 6px **vertical** accent bar running the full height of each block, so it resizes per beat |
| Block alignment | top-aligned at a fixed y | **centred** on a fixed axis, so blocks of different length breathe differently |
| Accent lines | third line of beats 2, 4 and 6 | beats 3, 4 and 7 only, so the violet is rarer and marks the turn rather than the rhythm |
| Close | "See what they say about you." | "See the answer your buyers get." |

**Not one line is reused.** Run 1's strings were read out of its NOTES and
checked against every string in this build; there is no overlap, including in
the suggested caption. Run 1's phrase "The answers you cannot see" would in any
case fail this run's compliance sweep, because `cannot` was added to the banned
universal list on 2026-07-30, after that cut shipped.

**Facebook-native execution.** Plain business language, no category jargon, no
"GEO", no "AI visibility", short declaratives. Seven beats over 28 s, mean beat
3.83 s, nothing under 3.0 s, 1.20 s of the runtime spent in gaps. Slower than
this driver would run on TikTok, and every sentence is one a non-technical owner
reads at speed.

---

## On-screen text, verbatim

Read back out of the twenty five text files ffmpeg actually draws from, not
retyped. Line breaks below are rendering breaks and alter no string.

**Beat 1, 0.000 to 3.800 s.** Cover beat. No fade in, no stagger, no rise, so
frame 0 is a fully opaque still.

```
The choice narrows
before the phone
rings.
```

**Beat 2, 4.000 to 7.800 s.**

```
An AI answer names
a few businesses.
Then it stops.
```

**Beat 3, 8.000 to 12.200 s.** Third line accent violet, ExtraBold.

```
That is a shortlist.
You were not in
the room.
```

**Beat 4, 12.400 to 16.000 s.** Third line accent.

```
Named or not,
your reporting
looks the same.
```

**Beat 5, 16.200 to 20.200 s.**

```
That answer can be
read. Written down.
Watched over time.
```

**Beat 6, 20.400 to 24.800 s.** Engine rows at 56 px on a 90 px lead, 34 px
group gap under the lead line, staggered in at 0.12 s intervals.

```
BrandGEO reads it in:

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**Beat 7, 25.000 to 28.000 s.** URL in ExtraBold accent. Soft CTA, no pricing.

```
See the answer
your buyers get.
getbrandgeo.com
```

**Persistent, whole runtime:** the icon mark at 68 px plus the wordmark
`BrandGEO` at 72% opacity, bottom left.

Exact rendered strings, as read out of the line files:

```
l00 'The choice narrows'      l13 'read. Written down.'
l01 'before the phone'        l14 'Watched over time.'
l02 'rings.'                  l15 'BrandGEO reads it in:'
l03 'An AI answer names'      l16 'ChatGPT'
l04 'a few businesses.'       l17 'Gemini'
l05 'Then it stops.'          l18 'Claude'
l06 'That is a shortlist.'    l19 'Perplexity'
l07 'You were not in'         l20 'Google AI Mode'
l08 'the room.'               l21 'See the answer'
l09 'Named or not,'           l22 'your buyers get.'
l10 'your reporting'          l23 'getbrandgeo.com'
l11 'looks the same.'         wordmark 'BrandGEO'
l12 'That answer can be'
```

---

## Evidence: what is asserted, and where it comes from

**This cut contains no numbers.** Asserted mechanically by `textcheck.py`, which
counts digit characters across the union of all twenty five drawn strings and
finds zero. No percentage, no city count, no engine count, no rate, no date, no
price. There is also not a single hyphen in the cut, and no non-ASCII character
of any kind.

Zero digits is not a stylistic preference here. It means the brief's hardest
evidence rule has nothing to bite on: there is no figure whose provenance could
be mistaken for a BrandGEO measurement.

| On screen | What kind of claim | Source |
|---|---|---|
| `The choice narrows before the phone rings.` | property of the medium: a short generated answer is a filter applied before contact | asserts no event and no rate; refutable only by claiming AI answers do not shorten anything |
| `An AI answer names a few businesses. Then it stops.` | description of the artefact | observable on any engine; deliberately no count, per the brief's engine-count and figure rules |
| `That is a shortlist. You were not in the room.` | the driver's core, and it is about **process**, not about the viewer's rank | true whether or not the viewer is named: nobody advertising to a stranger can know their rank, and this line does not claim to |
| `Named or not, your reporting looks the same.` | property of the mechanism | an answer that omits you generates no traffic event, and one that names you without a link generates none either, so the two cases are indistinguishable downstream |
| `That answer can be read. Written down. Watched over time.` | property of the method | describes reading, recording and repeating; carries no cadence, volume or coverage promise |
| `BrandGEO reads it in:` + five engines | product coverage | `brandgeo-dashboard/src/lib/planConfig.ts`, `PLAN_ENGINES.growth`, read line by line this session |
| `See the answer your buyers get.` | what the product shows | soft CTA; promises a reading, not a ranking or an outcome |

**A line that was deliberately NOT written.** Run 1 could say "Yours was not
one" because it framed a hypothetical. Repeating that move would have been the
easy replication and would have collapsed the difference between the two cuts.
`You were not in the room.` is the stronger claim precisely because it is the
one that is true regardless: the viewer had no input into the answer either way.

**Engine lineup, checked rather than remembered.** `PLAN_ENGINES.growth` reads
exactly `['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai']`. The five on
screen are those five in `ENGINE_META` label form. `textcheck.py` asserts both
directions: all five present, and none of `Meta AI`, `Meta`, `Llama`, `Copilot`,
`DeepSeek`, `Grok`, `AI Overviews`, `AI Overview` or `Bing` present. Grok and
AI Overviews went live 2026-07-29 but sit on Growth PRO and up, so they are off
this list by plan rather than by oversight, and their one-day sample would have
been unpublishable regardless.

**Sources deliberately not used.** `bg-016.html` was not opened. No engine count
was taken from `bg-004.html`. The phrase "27 cities" appears nowhere.
`bg-005.html`'s 48% and 93% were never candidates: they sit inside a first-party
page but were measured by a third party, so they pass a naive "traces to a
published page" test while tracing to no BrandGEO measurement. The check asks
where a number was **measured**, and this cut has no numbers to ask about.

---

## Compliance sweep, run on the drawn bytes

`textcheck.py` reads `t/*.txt`, the files the `drawtext` filters load, not the
build script and not the brief. It exits non-zero on any violation. Exit code 0.

```
hyphen count            : 0
digit characters        : 0 (none)
banned AI-tell words    : NONE
superlatives            : NONE
universal quantifiers   : NONE
pricing language        : NONE
forbidden figures       : NONE
growth-5 engines present: ALL
off-plan engines present: NONE
capitalised suspects    : NONE
strings drawn           : 25
PASS  (all assertions ran against the drawn bytes)
```

**Superlatives: none.** Asserted as whole words against `first`, `only`, `most`,
`biggest`, `best`, `largest`, `fastest`, `leading`, `unique`, `unmatched`,
`no other`, `ever`, `worst`, `smallest`, `top-rated`, `number one`.

This one caught a real defect during the build, which is the reason the check
exists. Beat 1 originally read `The choice narrows / before the first / phone
call.` `first` there is ordinal, not a ranking claim, and a reviewer reading it
back would almost certainly have waved it through. It was rewritten to `before
the phone / rings.` rather than argued about, because the rule's whole value is
that it does not depend on a case-by-case judgement, and the replacement is
better copy anyway.

**Universal quantifiers: none.** Asserted against `nobody`, `no one`, `noone`,
`everyone`, `everybody`, `always`, `never`, `cannot`, `can't`, `every business`,
`every company`, `every brand`, `anyone`, `all businesses`, `all companies`,
`industry-wide`, `everywhere`, `any business`, plus the hedged forms `hardly
anyone`, `almost nobody`, `nobody else`, `no one else`.

This one also bit. An early draft of beat 1 ended `before anyone contacts you.`
`anyone` is on the list, so it was cut. Every claim in the finished cut is a
property of the method or of the medium, and none of them is refutable by
producing one counterexample somewhere in the world.

**Measured subjects: none, because there is no result set in this cut.** No
company, firm, person or client appears. The only proper nouns on screen are the
five engines, our own wordmark and our own domain.

Method: every capitalised run was harvested by regex from the rendered strings,
allow-listed engine and brand tokens subtracted, then one sentence-initial word
subtracted. Anything remaining would be a suspect. The sweep returns none. Note
that `BrandGEO reads it in:` survives because `BrandGEO` is allow-listed and
`reads` is lowercase, and `Google AI Mode` survives as three allow-listed tokens.

The five engines **are** named, which the brief permits and this driver needs.
They are the instruments and the category, not the subject of any measurement.
By the brief's own removal test, `BrandGEO reads it in:` does not survive
deleting them, so they stay.

---

## Safe zone, measured on the DELIVERED file

Facebook Reels reserves: **top 220, bottom 440, right 180.** Ink limits are
therefore `y >= 220`, `y <= 1480`, `x <= 900`. All 840 frames of
`facebook-silent.mp4` and all 840 of the text-free control were decoded
sequentially in one pass each, in lockstep and indexed by position. No `-ss`
seeking anywhere.

**Threshold justification, argued from a measured control.** The text-free
control's peak luma measures **47** over its whole runtime. Ink `#E8E9ED` is
luma 233.1 and accent `#A78BFA` is 153.0. Threshold **60** sits in the empty gap
between 47 and 153, and no drawn colour in this cut falls between them.

| Method | What it answers | Result |
|---|---|---|
| A, absolute luma > 60 | identity, and which of two overlapping things was drawn | x 100..811, y 540..1383 |
| B, diff vs text-free control > 8 | presence | x 100..811, y 540..1384 |
| C, declared geometry | anything within ~10 luma of the canvas, which no pixel method can see | x 100..168, y 540..1400 |
| **Union** | | **x 100..811, y 540..1400** |

A and B agree **exactly** on the left, the right and the top, and to one pixel on
the bottom. The one-pixel difference is the antialiased last row of the
wordmark's descender falling either side of the threshold. Where they differ the
larger box was taken.

| Edge | Reserve | Ink | Headroom | Verdict |
|---|---|---|---|---|
| top | 220 | 540 | **320 px** | PASS |
| bottom | 1480 | 1400 | **80 px** | PASS |
| right | 900 | 811 | **89 px** | PASS |

Left ink sits at x=100; no left reserve is declared for this platform. Every edge
clears the brief's 20 px floor by at least 4x, so none of these is a paper pass.

**Method B's threshold was measured, not guessed.** The diff noise floor was
characterised in three regions empty by design before any threshold was chosen.
Adding text changes libx264's rate control across the whole frame, so the render
differs from the control even where nothing is drawn; a control cancels artefacts
it shares and cannot cancel the encoder's response to content it does not have.

```
x >= 950   max abs diff 4
y >= 1500  max abs diff 4
y <  400   max abs diff 4
=> threshold 8, four levels above the measured ceiling of 4
```

At that threshold B lands within one pixel of A on every edge. The three regions
returning an identical ceiling of 4 is a stronger result than run 5's 7/7/7 and
reflects a quieter background: this build's plate peaks at luma 40.94 at source,
against run 6's 20.29, but carries less high-frequency glow energy near the type.

**The bottom constraint came from method C and neither pixel method could see
it.** Both A and B stop at y=1383, the bottom of the wordmark's descender. The
logo mark's declared rect runs to y=1400. Sampled directly on the delivered
cover, the logo region means RGB `24.6, 20.0, 43.8`, luma about 22.7, against a
canvas of `16.5, 13.9, 27.6` at the same rows, luma about 15.5. That is far under
the absolute threshold of 60, and its diff against the canvas is around 7, under
the diff threshold of 8, at the rows that matter. Folding the declared rect in
cost 17 px of claimed headroom, 97 down to 80. This is the documented
dark-on-dark blind spot and it was load-bearing again, exactly as the brief
predicted, and by exactly the same 17 px.

**Predicted vs delivered.** `build.py` predicted the right-hand ink at x=816 from
tight Inter glyph bboxes; the delivered frame measured 811, so the prediction was
conservative by 5 px in the safe direction, matching run 6's experience. The
binding string on the right is `BrandGEO reads it in:` in beat 6. Every other
line clears by 113 px or more, and every string in this cut is editable, so a
future reserve change costs a copy edit rather than a redesign.

**Re-measured at the final path.** Method A was re-run against
`facebook-silent.mp4` after it was copied into this folder, decoding all 840
frames again, and returned `x 100..811, y 540..1383`, identical to the build-dir
measurement. The two copies also hash identically
(`md5 0087bb6f02f86b70c46935b281c78de9`).

### The type budget

Every candidate was measured with real Inter metrics before anything was
rendered, against 760 px of usable width (text origin x=140, right limit x=900).

| Line | Face, size | Predicted x1 | Headroom |
|---|---|---|---|
| `BrandGEO reads it in:` | sb 66 | 816 | **84, binding** |
| `An AI answer names` | sb 66 | 787 | 113 |
| `The choice narrows` | sb 66 | 772 | 128 |
| `read. Written down.` | sb 66 | 771 | 129 |
| `Watched over time.` | sb 66 | 765 | 135 |
| `Google AI Mode` | sb 56 | 570 | 330 |

Two sizing passes were run and both are worth recording, because both were
decided on measurement rather than taste. At 62 px the binding line cleared by
118 px, which is 118 px of legible width thrown away on a mobile feed, so the
type was scaled up. At 68 px it cleared by 55 px, a real pass but a thinner one
than a binding element deserves. 66 px was chosen as the point where the binding
line holds 84 px and the body is still the largest it can be.

**One line failed the floor and was rewritten, not excused.** Beat 3 originally
read `That is a shortlist. / You were not in the / room when it was made.` at
62 px. `room when it was made.` predicted x1=883, leaving **17 px** against the
right reserve. That is under the brief's 20 px floor, so it is a failure and not
a near miss. It became `You were not in / the room.`, which measures 455 px, and
the shorter line is the better close for the beat.

---

## Render integrity

- **Cover is frame 0.** `md5` over raw RGB of the delivered `facebook-cover.png`
  and of frame 0 decoded from the delivered `facebook-silent.mp4` both give
  `d3fe6da075c6de190cbd2063a68d2959`. Byte-identical. Checked again after both
  files were copied to this folder, not only in the build directory.
- **No fade on scene 1 from t=0.** Beat 1 carries no fade in, no stagger and no
  rise. Frame 0 measures **30,922** ink pixels against frame 1's 30,896, so the
  cover is fully opaque at t=0 rather than ramping up from nothing.
- **`drawbox` cannot animate on 8.1.2.** It has no `eval` option and evaluates
  `x/y/w/h` once at init, so each accent bar's fade is built from stacked static
  boxes on staggered `enable` windows: 33 `drawbox` ops for 7 bars, 3 for the
  cover beat and 5 for each of the others. Verified on the delivered file that
  the geometry really does change per beat rather than freezing at its t=0 value:

  | Frame | Measured bar rows | Declared | Delta |
  |---|---|---|---|
  | beat 1, t=0.00 | y 682..977 | y 682..977 | 0, 0 |
  | beat 3, t=10.00 | y 682..977 | y 682..977 | 0, 0 |
  | beat 6, t=21.00 | **y 540..1120** | y 540..1120 | 0, 0 |
  | beat 7, t=27.00 | y 684..975 | y 684..975 | 0, 0 |

  Beat 6's bar is 285 px taller than beat 1's because its block carries six rows,
  which is the whole point of choosing a vertical rule over run 1's fixed
  horizontal dash. A frozen `drawbox` would have rendered all seven at beat 1's
  height.
- **`replace=1` is set on every `drawbox`.** Without it `drawbox` blends instead
  of writing alpha on an RGBA source and vanishes silently with no error.
  Confirmed **written, not blended**, by sampling inside beat 1's bar on the
  delivered cover: mean RGB `148.1, 124.0, 225.2` inside the bar against
  `9.1, 8.8, 16.1` thirty pixels to its right.
- **`color=black@0.0` is not used anywhere.** The text layers are drawn directly
  onto the `rgb24` background chain rather than onto a transparent lavfi source,
  so the documented alpha-negotiation failure has no surface to occur on.
- **No `ffconcat`.** The timeline is one filtergraph over a looped still at
  `-framerate 30`, frame-exact by construction. Verified on the delivered file by
  ink-pixel plateau centres, not by frame hashing:

  | Declared gap | Plateau centre | Error |
  |---|---|---|
  | 3.800 to 4.000 | 3.900 s | 0 |
  | 7.800 to 8.000 | 7.900 s | 0 |
  | 12.200 to 12.400 | 12.300 s | 0 |
  | 16.000 to 16.200 | 16.100 s | 0 |
  | 20.200 to 20.400 | 20.300 s | 0 |
  | 24.800 to 25.000 | 24.917 s | +0.017 s, half a frame |
  | tail after 28.000 | 27.950 s | final two frames |

  **The threshold was swept, per the brief's rule.** The persistent lockup floors
  the ink count at 3,434, so a threshold of zero finds nothing; thresholds of
  3,484 / 3,584 / 3,834 / 4,334 were all tried. The plateau **widths** move from
  10 to 11 frames as the threshold rises, and the **centres do not move at all**.
  That is the signature of a correct detector, and the reason the seven boundaries
  are reported as centres rather than as edges.
- **Scene detection by ink count, not frame hashing.** Identical pictures get
  different quantisation noise in H.264, so hashes differ where nothing changed.
- **PNG intermediates, never JPEG.** The background plate and the cover are both
  PNG, so the pipeline stays limited-range `yuv420p` and never picks up the
  `yuvj420p` full-range shift.
- **The delivered files were probed, not assumed.** A mux can exit 0 and be
  unreadable. Both were re-probed at this final path after copying.
- **Video bitstream identity.** The raw H.264 elementary stream extracted from
  the silent master and from the scored file both hash to
  `7116705508960630c00662e80c3b1166`, so `-c:v copy` did what it claims and the
  two cuts are the same picture.

| Probe of the DELIVERED file, at this path | silent | scored |
|---|---|---|
| container duration | **28.000000 s** | **28.000000 s** |
| streams | 1 | 2 |
| **audio streams** | **0** | 1 |
| video | h264, 1080x1920, 30/1 fps, yuv420p | identical bitstream, `-c:v copy` |
| decoded frame count | 840 | 840 |

28.000 s sits inside Facebook Reels' 20 to 30 s band.

---

## Audio

`tension-minor.wav`, BrandGEO-composed, cleared for commercial use, **no
attribution line required** (`assets/audio/ATTRIBUTION.md`, music library
section). Held **constant** across the campaign: the hook is the variable under
test, and on a replication run holding the music fixed is the whole point.

- Trimmed to 28 s from the 60 s source.
- **Fade in 0.08 s, mandatory, and the reason is measured.** The source's first
  64 samples peak at **0.06171** and it reaches **0.20631** inside its first
  0.1 s. Cutting in at sample 0 would step from digital silence to 0.0617 in one
  sample, which is an audible click.
- Fade out 1.5 s, starting at 26.5 s.
- Two-pass `loudnorm`, measured then applied linearly. Single-pass undershoots by
  about 0.9 LU. Pass 1 measured `I=-16.21, TP=-4.41, LRA=3.60, thresh=-26.27,
  offset=-1.14`; pass 2 reported `Normalization Type: Linear`, which matters
  because dynamic mode pumps audibly on a sustained bed.

**Verified on the DELIVERED file at this final path**, decoded to f32:

| Check | Value | Verdict |
|---|---|---|
| peak amplitude, first 64 samples | **0.00284** | **PASS**, under 0.005 |
| peak amplitude, first 32 samples | 0.00179 | ramping from silence, not stepping |
| peak amplitude, first 128 samples | 0.00609 | the 0.08 s ramp still climbing, as designed |
| peak amplitude, last 64 samples | 0.00000 | fade out lands at digital silence |
| integrated loudness re-measured | **-16.02 LUFS** | on target |
| true peak | -4.22 dBTP | under the -1.5 ceiling |
| overall sample peak | 0.61433 | no clipping |
| loudness range | 3.60 LU | |

Decoded audio runs 28.0107 s against a 28.000 s video because AAC quantises to
1024-sample frames. `-shortest` held the container to exactly 28.000000 s.

**How the track actually sounds:** a sparse minor-key bed, sustained pad with a
slow pulse, no drums and no melodic hook. It is a bed, not a track. On this
driver it fits better than it did on run 6's utility cut: the copy is about an
exclusion the viewer has no visibility into, and a tense sustained bed is the
right register for that. It is still the fallback. **The silent master remains
the one to post organically**, because Facebook favours audio picked from its own
in-app library. I have measured this file, not heard it; someone should audition
it once before it goes anywhere public.

---

## Technical spec

- 1080x1920, 9:16, 30 fps, H.264 High@4.0, `yuv420p`, `+faststart`, CRF 18,
  preset slow.
- Background: canvas `#090A0F` with three soft radial glows (`#7C3AED` upper
  left, `#6366F1` right, `#8B5CF6` lower) under a vignette, floored back to the
  brand black so the vignette never dips under it. A 4x4 ordered dither at
  +/- 0.8 levels is baked in because an 8-bit gradient this size bands visibly.
  Measured peak luma **40.94** at source, **47** after encode. Dark only, no white
  anywhere. `md5(bg.png) = d85980458c1d1a0d0188fd2526b4bf63`.
- Motion: the plate is generated at 1188x2112 and cropped to 1080x1920 with a
  slow sinusoidal horizontal drift (18 px, 26 s period) and a slow vertical rise
  (26 px over the runtime), so the frame is never static while the type stays
  still. The 10% overscan guarantees the crop never reaches an edge.
- Text ink `#E8E9ED`, accent `#A78BFA`. `#8B5CF6` appears only in the background
  glows and never as text, per the brief's contrast note.
- Type: vendored Inter from `docs/growth/grok-launch/images/_build/fonts/`. Body
  SemiBold 66 px on a 98 px lead, accent lines ExtraBold 66 px, engine rows
  SemiBold 56 px on a 90 px lead, URL ExtraBold 62 px, wordmark Bold 40 px.
  Nothing downloaded, nothing substituted.
- Logo: `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`
  (`md5 c9e163a7e687b22c5b88166e228a35b0`, confirmed against the source) scaled to
  68 px.
- Layout: vertical accent bar 6 px wide at x=100, spanning each block's height
  plus 10 px either end; text origin x=140; every block vertically centred on
  y=830.
- Motion per line: 0.40 s fade in, 20 px rise over 0.55 s, 0.12 s stagger within
  a beat, 0.35 s fade out. Beat 1 has none of these.
- 58 draw operations, 25 `drawtext` and 33 `drawbox`.
  `md5(fc.txt) = 6d2f6c9ac3e8503af97c64047f9efc30`. Re-running the generator
  reproduces that hash exactly, so the filtergraph quoted below is the one that
  was rendered.

---

## Exact commands

Working directory is the build scratch dir, holding `bg.py`, `build.py`,
`textcheck.py`, `measure.py`, `bg.png`, `logo.png`, `fonts/`, `t/` (one file per
rendered line), `fc.txt` and `fc_ctrl.txt`. Relative paths throughout,
deliberately, to avoid escaping the drive-letter colon inside filtergraph
options.

### 1. Background plate

```sh
python bg.py            # PIL + numpy, 1188x2112 rgb24 PNG, prints peak luma
```

### 2. Filtergraph and line files

```sh
python build.py         # writes t/*.txt, fc.txt, fc_ctrl.txt; prints the type budget
python textcheck.py     # compliance sweep over the drawn bytes, exits non-zero on failure
```

### 3. Silent master

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

### 4. Text-free control, for the threshold and for method B

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

### 5. Music: trim, fade in and out, two-pass loudnorm

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

### 6. Scored cut

Video is copied, not re-encoded.

```sh
ffmpeg -y -i facebook-silent.mp4 -i music_norm.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -shortest \
  facebook-scored.mp4
```

### 7. Cover

```sh
ffmpeg -y -i facebook-silent.mp4 -vf "select=eq(n\,0)" -frames:v 1 -c:v png \
  facebook-cover.png
```

### 8. The filtergraph, `fc.txt`

58 draw operations, generated by `build.py` so every coordinate is computed
rather than typed. Text is passed by file rather than inline so no string needs
filtergraph escaping. Header, one representative bar stack, one representative
`drawtext`, and the tail:

```
[1:v]scale=68:68[lg];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+18*sin(2*PI*t/26)':y='(in_h-out_h)/2-26*(t/28.0)',format=rgb24[bg];
[bg][lg]overlay=x=100:y=1332:format=rgb[bgl];
[bgl]drawbox=x=100:y=682:w=6:h=296:color=0xA78BFA@0.90:t=fill:replace=1:enable='between(t\,0.000\,3.450)',
drawbox=x=100:y=682:w=6:h=296:color=0xA78BFA@0.55:t=fill:replace=1:enable='between(t\,3.450\,3.625)',
drawbox=x=100:y=682:w=6:h=296:color=0xA78BFA@0.22:t=fill:replace=1:enable='between(t\,3.625\,3.800)',
...
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l23.txt:x=140:y='890+20*(1-min(1\,max(0\,(t-25.240))/0.55))':fontsize=62:fontcolor=0xA78BFA:alpha='if(lt(t\,25.240)\,0\,if(lt(t\,25.640)\,(t-25.240)/0.40\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,25.240\,28.000)',
drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=t/wordmark.txt:x=190:y=1345:fontsize=40:fontcolor=0xE8E9ED:alpha=0.72,format=yuv420p[v]
```

---

## Suggested feed caption

Not posted. Provided for review alongside the video. Shares no sentence with run
1's caption.

> When someone asks an AI for a supplier, it comes back with a short answer and a
> handful of names. That is the shortlist now, and it gets drawn up before you
> hear from anybody.
>
> The awkward part is that your reporting looks identical either way. Named or
> not named, same numbers, same day.
>
> BrandGEO reads what ChatGPT, Gemini, Claude, Perplexity and Google AI Mode
> answer when someone asks for a business like yours, writes it down, and keeps
> watching it.
>
> getbrandgeo.com

---

## Open items for whoever reviews this

1. **Audition the scored cut.** The audio has been measured, not heard.
2. **`RUN.md` for this run has not been written.** The brief asks each run to
   record its hook driver in `run-<stamp>/RUN.md`, which sits one level above this
   folder and outside this task's write scope. Driver **#1, loss aversion, second
   pass** for this run.
3. **Decide what the run 1 vs this comparison is being judged on before reading
   it.** These two cuts share a driver and share nothing else, which is what makes
   the comparison informative, but it also means they will not fail in the same
   way. Run 1 asserts a concrete event and will read as more urgent. This one
   asserts a structural exclusion and gives the viewer a sentence about their own
   dashboard that they can check in ten seconds. If the metric is three-second
   retention, run 1's opener is probably stronger. If it is completion and saves,
   the shortlist frame has the better second half.
4. **`Named or not, your reporting looks the same.` is the load-bearing line and
   it is the one to challenge.** It is defensible as a property of the mechanism,
   and I have argued it above, but it is also the only line in the cut that makes
   a claim about the viewer's own data rather than about ours or the medium's. If
   a reviewer thinks it overreaches, it is a one-line re-render and the safe-zone
   measurement would need rerunning.
5. **Nothing on screen distinguishes us from a competitor doing the same thing.**
   After the universal ban, no line can. That is the right trade for TOFU and the
   wrong one if this asset is ever repurposed lower in the funnel.
