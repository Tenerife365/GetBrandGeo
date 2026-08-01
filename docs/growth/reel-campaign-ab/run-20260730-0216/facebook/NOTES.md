# Facebook Reel, run 20260730-0216

Built with ffmpeg 8.1.2 directly. Remotion is not installed and nothing was
installed. Nothing here has been posted or scheduled. No git command was run.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master.** Zero audio streams, not a muted one. Pair with a track from Facebook's in-app music library. |
| `facebook-scored.mp4` | Identical video bitstream plus the BrandGEO-composed track `tension-minor`. For paid, site embeds and decks. |
| `facebook-cover.png` | 1080x1920 cover. Verified byte-identical to frame 0 of the master. |

---

## Hook driver

**#5, concrete proof.** "Here is the exact question a buyer typed, and here is
what came back."

This driver is structurally different from the four before it, and the
difference is the thing under test:

- Run 1 **loss aversion**: you are already losing something.
- Run 2 **status threat**: someone else is in your slot.
- Run 3 **curiosity gap**: we ran a study, here is what we withheld.
- Run 4 **contrarian**: you believe X, X is wrong.
- This run **asserts nothing**. It shows an artefact and lets the viewer check
  it. There is no threat, no tease, and no argument. Beat 1 is a real prompt
  quoted exactly. Beats 4 is the raw result, engine by engine, including the
  result that is least flattering to the story.

**The strongest evidence in the cut is the row that weakens it.** Gemini ranked
the company 4th, not 1st. A persuasion-first edit would drop that row and show
four engines agreeing. It is on screen because the whole mechanism of a proof
hook is that the viewer can go and check, and a viewer who checks and finds a
row missing has been told the video is not trustworthy. The same reasoning put
`named` rather than an invented rank against Google AI Mode: the source records
that it surfaced the company by name without giving it a list position, so the
column is deliberately not uniform.

**Facebook-native execution.** Plain business language, no category jargon, short
declaratives, six slow beats over 29 s (Instagram and TikTok cuts of this driver
run faster and blunter). The average beat is 4.4 s, the prompt beat is 5.4 s and the result beat is 8.2 s.

---

## On-screen text, verbatim

Read back out of the twenty eight text files ffmpeg actually draws from, not
retyped. Line breaks are rendering breaks; they do not alter any string.

**Beat 1, 0.000 to 5.400 s.** Cover beat. No fade in, no stagger, no rise, so
frame 0 is a fully opaque still. Eyebrow accent, quote in ink.

```
THE EXACT QUESTION

"Top-rated property
management companies
in Chicago"
```

**Beat 2, 5.600 to 10.000 s.** Third line accent.

```
We put that exact
question to five
AI engines.
```

**Beat 3, 10.200 to 14.200 s.** Second line accent. This beat exists only to
give the pronoun in beat 4 an antecedent, so no company has to be named.

```
One company came
back from all five.
```

**Beat 4, 14.400 to 22.600 s.** The artefact. Header accent, engine names in
ink, ranks in accent, right-aligned to a fixed column edge at x=840. Rows
stagger in at 0.12 s intervals. Longest beat in the cut at 8.2 s, having
absorbed 0.6 s from beat 5 in the correction below.

```
WHERE IT LANDED

ChatGPT                1st
Claude                 1st
Perplexity             2nd
Gemini                 4th
Google AI Mode       named
```

**Beat 5, 22.800 to 26.000 s.** Third line accent. Rewritten, see the correction
section below.

```
Six questions.
Five engines.
Every one answered.
```

**Beat 6, 26.200 to 29.000 s.** Fourth line accent. Soft CTA, no pricing.

```
Chicago, 24 July 2026.
The full run is
published.
getbrandgeo.com
```

**Persistent, whole runtime:** the icon mark at 68 px plus the wordmark
`BrandGEO` at 72% opacity, bottom left.

Exact rendered strings, as read out of the line files:

```
l00 'THE EXACT QUESTION'       l14 '1st'
l01 '"Top-rated property'      l15 'Claude'
l02 'management companies'     l16 '1st'
l03 'in Chicago"'              l17 'Perplexity'
l04 'We put that exact'        l18 '2nd'
l05 'question to five'         l19 'Gemini'
l06 'AI engines.'              l20 '4th'
l07 'One company came'         l21 'Google AI Mode'
l08 'back from all five.'      l22 'named'
l09 'Six questions.'           l23 'Chicago, 24 July 2026.'
l10 'Five engines.'            l24 'The full run is'
l11 'Every one answered.'      l25 'published.'
l12 'WHERE IT LANDED'          l26 'getbrandgeo.com'
l13 'ChatGPT'                  wordmark 'BrandGEO'
```

---

## The prompt, and why this one

**Exact string on screen:**

```
"Top-rated property management companies in Chicago"
```

**Source: `brandgeo/web/ai-visibility-for-chicago.html`, line 309**, prompt card
3 of 6. Data collected 2026-07-24, BrandGEO's own AI Visibility pipeline.

Verified mechanically, not by reading: the three on-screen line files joined
with single spaces compare `True` against the source string, and the string is
confirmed present verbatim in the page. It was not tidied, retyped or
paraphrased. The quotation marks are the page's own.

**This page is the only city page whose denominator survives the brief's engine
check.** The lineup on the collection date was ChatGPT, Claude, Gemini, Google
AI Mode and Perplexity, stated at line 297 as "each fired at". That is exactly
today's Growth five in `planConfig.ts`. The page's single mention of Meta AI is
the note recording that Google AI Mode was run **in place of** it, so the
retired engine is not in the set. The page also states "All 5 engines returned
usable data on every prompt this run, no collection errors", which is what makes
the denominator 5 rather than 4. Both facts were checked before the count went
on screen, per the brief's rule that an engine count is a claim about the lineup
on the day of collection.

**Every figure on screen traces to a MEASUREMENT, not merely to a page:**

| On screen | Where it was measured |
|---|---|
| the prompt itself | prompt card 3, `ai-visibility-for-chicago.html:309` |
| "five AI engines" | line 297 lineup, plus the zero-collection-error note |
| "One company came back from all five" | findings bar `5/5`, and the callout: "appears in every single one of the 5 engines' responses for [that prompt]". The superlative attached to that figure on the page is NOT used, see the correction section |
| ChatGPT 1st, Claude 1st | callout: "ChatGPT and Claude both rank it #1" |
| Perplexity 2nd | callout: "Perplexity ranks it #2" |
| Gemini 4th | callout: "Gemini names it #4" |
| Google AI Mode `named` | callout: "Google AI Mode surfaces it by name at 4.8 stars", no rank given, so no rank shown |
| "Six questions." | "We ran 6 real Chicago categories", and the page renders 6 prompt cards |
| "Every one answered." | "All 5 engines returned usable data on every prompt this run, no collection errors" |

All nine are BrandGEO's own pipeline output. Nothing here is a third-party
statistic. `bg-005.html`'s 48% and 93% figures were not used and were never
candidates: they sit inside a first-party page but were measured by someone
else, which is the loophole the brief closed on 2026-07-30.

**Sources deliberately not used:** `bg-016.html` (four engines including retired
Meta AI) and `bg-004.html` (claims five engines while naming six, including
Copilot and Meta AI). No engine count was taken from either. The phrase
"27 cities" appears nowhere.

---

## Correction: beat 5 was re-rendered, and the SOURCE PAGE carries a false claim

The first build's beat 5 read `The first time all / five agreed on / one
company.` It was cut and re-rendered after review. The replacement is
`Six questions. / Five engines. / Every one answered.`

**That line was not an inference and not an invention.** The Chicago page states
it outright, four times, in the findings bar, the hero and the callout:

> the first fully unanimous result (5 of 5 engines) measured anywhere in this
> research program

**The page is wrong.** Checked against every city page in the program:

| City | Collected | Unanimous 5-of-5 single-brand consensus |
|---|---|---|
| boston | 2026-07-24 | **three separate ones**, and the page claims Boston is "the most 5/5-dense city measured across this entire research program" |
| atlanta | 2026-07-24 | one |
| chicago | 2026-07-24 | one, claimed as "the first" |

All three were collected on the same day, so there is no ordering for Chicago to
be first in, and Boston carries three. The claim is not merely unsourced, it is
contradicted by a sibling page asserting a competing superlative over the same
dataset.

**One thing the review's own measurement over-counted, worth recording so the
correction is not itself carried forward wrongly.** A raw grep for `5/5` across
city pages returns twelve to fourteen hits, but not all are engine consensus.
Rome (2026-07-10, the only page predating Chicago) reads
"5/5 Restaurants Meta AI named, in the exact same order, in both Italian and
English", that is five *restaurants* named by one engine across two languages,
not five engines agreeing. Rome is not a counterexample. The real counterexamples
are Boston and Atlanta, and they are enough.

**Why this mattered more on this driver than it would on any other.** Concrete
proof works because the viewer can go and check. An unsourced superlative sitting
three beats away from a real prompt and a real result does not fail on its own,
it makes the checkable parts look decorative too, and this one is refutable in
about thirty seconds from our own site.

The replacement was chosen to do positive work rather than just vacate the slot.
It answers the obvious objection to any 5-of-5 result, which is whether some
engines simply failed to return anything, and it is the one methodology fact the
page states plainly. It was not hedged to "one of the first" or "the first time
we have seen", which are the same unsourced claim with deniability.

The 0.6 s recovered went to beat 4, the strongest thing in the cut, taking it
from 7.6 s to 8.2 s. Total duration is unchanged at 29.000 s.

### Open item for whoever owns `brandgeo/web`

**`ai-visibility-for-chicago.html` still publishes the false claim in four
places, and `ai-visibility-for-losangeles.html` repeats it in a cross-link card**
("An even stronger result: the first fully unanimous, 5-of-5, single-brand
consensus measured in this program"). That is a live factual error on the public
site, on a research page, for a product whose whole thesis is being checkable.
Out of scope for this render and not touched here. Filed rather than fixed.

---

## No measured subject is named, verified mechanically

Run at the end of the build by `namecheck.py`, against the rendered text files
rather than the script.

The source page names thirteen real parties across its result sets. The video
names **none** of them. The sweep that the whole cut is built on belongs to a
property management company that is never identified, which is why beat 3 exists
at all: it establishes "one company" so that beat 4 can say `1st` without a
subject.

Method: every capitalised multi-word run in the page body was harvested by
regex (49 candidates), then matched case-insensitively against the union of all
on-screen strings. Two hits came back and both were adjudicated in the check
itself rather than waved through:

- `AI Engines` is a category noun from the page heading, with no company
  referent.
- `In Chicago` is a fragment of the quoted prompt. A city is a market, not a
  measured subject.

A hard assertion over the thirteen named parties (Landmark, Kirkland, Ellis,
Minsky, McCormick, Hallagan, Clifford, CBRE, Vesta, Cipolla, Aparicio,
McDermott, Schulte) passes with all absent.

The five engines **are** named, which the brief permits and this driver requires:
they are the instruments being measured, not the subject. Removing them would
make the artefact uncheckable, so by the brief's own test they stay.

Also asserted and passing: no `Meta AI`, `Copilot`, `Grok`, `DeepSeek` or
`AI Overviews` anywhere on screen; no banned vocabulary; no em or en dashes; no
non-ASCII characters at all. The single hyphen-minus is inside `Top-rated`, part
of the quoted prompt, and cannot be removed without falsifying it.

---

## Safe zone, measured on the DELIVERED file

Facebook Reels reserves: **top 220, bottom 440, right 180.** Ink limits
therefore `y >= 220`, `y <= 1480`, `x <= 900`. Frames decoded sequentially in
one pass out of `facebook-silent.mp4` and indexed. No `-ss` seeking. All 870
frames measured, not a sample.

**Threshold justification.** The text-free control's peak luma measures **21.01**.
Ink is `#E8E9ED` at luma 233.1 and accent `#A78BFA` at luma 153.0. Threshold
**60** sits in the empty gap between 21 and 153.

| Method | Result |
|---|---|
| A, absolute luma > 60 | x 100..838, y 444..1383 |
| B, diff vs text-free control > 11 | x 100..839, y 442..1383 |
| C, declared geometry (furniture) | x 100..204, y 444..1400 |
| **Union** | **x 100..839, y 442..1400** |

A and B agree to within 2 px on top, 1 px on right, 0 px on left and bottom.
Where they differ the larger box was taken, per the brief.

| Edge | Reserve | Ink | Headroom | Verdict |
|---|---|---|---|---|
| top | 220 | 442 | **222 px** | PASS |
| bottom | 440 | 1400 | **80 px** | PASS |
| right | 180 | 839 | **61 px** | PASS |

Left ink sits at x=100; no left reserve is declared for this platform.

**The binding constraint on the right is type, as predicted, not furniture.**
The widest line in the cut is `management companies`, line 2 of the quoted
prompt, ending at x=839. Everything else clears by 100 px or more. This is the
first run in the cycle where a string that cannot be edited sets the margin.

**The bottom constraint came from method C and neither pixel method could see
it.** Both A and B stop at y=1383, the bottom of the wordmark's descender. The
logo mark's declared rect runs to y=1400, and its lower rows differ from the
canvas by too little for either method to detect. Folding the declared rect in
cost 17 px of claimed headroom, 97 down to 80. This is the documented dark-on-dark
blind spot and it was load-bearing here, not theoretical.

### Method B's threshold was itself measured, after a false failure

First attempt used a diff threshold of 6 and returned `x 3..1068, y 4..1914`, an
apparent failure on every edge. Per the brief, ink at the literal frame edge
means suspect the codec, so the noise floor was characterised instead of the
number being adjusted by feel.

Adding text changes libx264's rate control and macroblock decisions across the
**whole** frame, so the render differs from the control in regions where nothing
is drawn. Measuring three regions that are empty by design (x >= 950,
y >= 1500, y < 400) returned a maximum diff of exactly **7** in all three,
consistently. The threshold of 6 was sitting *below* the encoder noise floor,
which is why it lit the entire frame. At 11 the two methods converge to within
2 px.

The brief's rule that a control cancels codec artefacts holds for artefacts the
control shares, such as the yuv420p frame-edge chroma effect. It does not hold
for noise the presence of text creates. A control makes method B trustworthy
only once its threshold is set above measured noise.

---

## Render integrity

- **Cover is frame 0.** `md5` over raw RGB of `facebook-cover.png` and of frame 0
  decoded from the delivered master both give
  `1bc9e0521f4486fa8a1f2db219b93f2d`. Byte-identical.
- **No fade on scene 1.** Beat 1 carries no fade in, no stagger and no rise.
  Frame 0 measures 40,046 ink pixels against frame 1's 40,027, so the cover is
  fully opaque at t=0 rather than ramping.
- **`drawbox` cannot animate on 8.1.2**, so each accent rule's fade is built from
  stacked static boxes on staggered `enable` windows, 28 `drawbox` ops for 6
  rules. `replace=1` is set on every one: without it `drawbox` blends instead of
  writing alpha and vanishes silently. Confirmed written, not blended, by
  sampling inside the beat 1 rule at t=0, mean RGB `150,126,224` against a
  background of `13,10,25` immediately below it.
- **No ffconcat.** The timeline is one filtergraph over a looped still at
  `-framerate 30`, frame-exact by construction. Verified: ink-pixel step changes
  land at 5.30, 5.70, 9.90, 10.30, 14.10, 15.10, 22.50, 22.90, 25.90, 26.30 and
  28.90 s, each on its declared beat boundary.
- **Scene detection by ink count, not frame hashing.** Identical pictures get
  different quantisation noise in H.264, so hashes are unreliable.
- **PNG intermediates, never JPEG.** The background plate and the cover are both
  PNG, so the pipeline stays limited-range `yuv420p` and never picks up the
  `yuvj420p` full-range shift.
- **The delivered files were probed, not assumed.** A mux can exit 0 and be
  unreadable. Both were re-probed at their final path after copying.

| Probe of the delivered file | silent | scored |
|---|---|---|
| container duration | **29.000000 s** | **29.000000 s** |
| streams | 1 | 2 |
| audio streams | **0** | 1 |
| video | h264, 1080x1920, 30/1, yuv420p | identical bitstream, `-c:v copy` |
| frames | 870 | 870 |

29.000 s sits inside Facebook Reels' 20 to 30 s band.

---

## Audio

`tension-minor.wav`, BrandGEO-composed, cleared for commercial use, no
attribution line required. Held **constant** across all four platforms this run;
the hook is the variable under test.

- Trimmed to 29 s from a 60 s source.
- **Fade in `0.08 s`, mandatory.** The source's first 64 samples peak at
  **0.0617** and it reaches 0.2063 inside its first 0.1 s, so cutting in at
  sample 0 would click audibly.
- Fade out 1.5 s, starting at 27.5 s.
- Two-pass `loudnorm`, measured then applied linearly. Single-pass undershoots by
  about 0.9 LU. Pass 1 measured `I=-16.12, TP=-4.41, LRA=3.60, thresh=-26.23,
  offset=-1.18`.

**Verified on the DELIVERED file**, decoded to f32:

| Check | Value | Verdict |
|---|---|---|
| peak amplitude, first 64 samples | **0.00295** | PASS, under 0.005 |
| peak amplitude, last 64 samples | 0.00000 | fade out lands at silence |
| integrated loudness re-measured | **-16.01 LUFS** | on target |
| true peak | -4.28 dBTP | under the -1.5 ceiling |
| overall sample peak | 0.6096 | no clipping |

Decoded audio runs 29.0133 s against a 29.000 s video because AAC quantises to
1024-sample frames. `-shortest` held the container to exactly 29.000000 s.

**How the track actually sounds:** a sparse minor-key bed, sustained pad with a
slow pulse, no drums and no melodic hook. It suits a slow six-beat proof cut
better than it suited run 4's argument cut, because it does not compete with
reading. It is a bed, not a track; it carries tension without asking for
attention. Fine as the paid and embed fallback. The silent master remains the
one to post organically, since Facebook favours audio picked from its own in-app
library.

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
  Quote SemiBold 62 px, body SemiBold 64 px, table rows SemiBold 52 px with
  ranks ExtraBold 52 px, eyebrows Bold 40 px, URL ExtraBold 60 px, wordmark
  Bold 40 px. Nothing downloaded, nothing substituted.
- Logo: `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png` scaled
  to 68 px.
- Motion per line: 0.40 s fade in, 22 px rise over 0.55 s, 0.12 s stagger within
  a beat, 0.35 s fade out. Beat 1 has none of these.
- 56 draw operations, 28 `drawtext` and 28 `drawbox`.
  `md5(fc.txt) = d789c9bdc31f08aa52698ff86ee428ab`.

### The type budget, which set the layout

The quoted prompt is 52 characters and cannot be paraphrased, so it was budgeted
**first** and everything else fitted around it.

At the brief's 44 px floor it measures **1242 px** on one line against 800 px of
usable width, so wrapping was forced rather than chosen. Candidate wraps were
measured with the real Inter metrics before anything was rendered:

| Wrap | Size | Widest line | Right ink | Headroom |
|---|---|---|---|---|
| 3-line | 68 px | 820 | 920 | **-20, fails** |
| 3-line | 64 px | 758 | 858 | 42 |
| **3-line** | **62 px** | **734** | **834** | **66, chosen** |
| 4-line | 72 px | 777 | 877 | 23, a paper pass |

The 3-line break was kept over the 4-line one because it preserves the question's
three sense units, so the viewer parses it in a single pass, which is the entire
point of a proof hook. 62 px is 18 px above the brief's floor and the prompt was
never truncated. Predicted right ink was 844 px from tight glyph bboxes; the
delivered frame measured 839 px, so the prediction was conservative by 5 px in
the safe direction.

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

56 draw operations, generated by `build.py` so every coordinate is computed
rather than typed. `drawbox` takes no alpha expression and cannot animate, so
each accent rule fade is built from five stacked static boxes on staggered
`enable` windows, all carrying `replace=1`. Beat 1 has no fade in, no stagger
and no rise, so frame 0 is a clean fully-opaque still that doubles as the cover.
Text is passed by file rather than inline so the commas in
`Chicago, 24 July 2026.` and the double quotes in the prompt need no filtergraph
escaping. Header and tail:

```
[1:v]scale=68:68[lg];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+18*sin(2*PI*t/26)':y='(in_h-out_h)/2-26*(t/29.0)',format=rgb24[bg];
[bg][lg]overlay=x=100:y=1332:format=rgb[bgl];
[bgl]drawbox=x=100:y=524:w=104:h=6:color=0xA78BFA@0.9:t=fill:replace=1:enable='between(t\,0.000\,5.050)',
...
drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=t/wordmark.txt:x=190:y=1345:fontsize=40:fontcolor=0xE8E9ED:alpha=0.72,format=yuv420p[v]
```

---

## What a reviewer should push back on

1. **62 px is the smallest body type this campaign has shipped.** It clears the
   44 px floor comfortably and the prompt is the largest block on screen, but if
   Facebook's right reserve ever moves past 180 px this cut is the first to
   break, and the offending string cannot be shortened without falsifying it.
   The fallback is the 4-line wrap, not smaller type.
2. **Beat 4 asks the viewer to read a five-row table in 8.2 s.** That is
   comfortable on a paused frame and brisk in a scrolling feed. It is the
   deliberate cost of showing the artefact rather than summarising it, and it is
   the thing most worth watching in the retention curve.
3. **The cut never says what the viewer should do about any of it.** That is the
   driver working as specified, and it is also why this one may convert worse
   than run 1 while being more trustworthy. Comparing those two numbers is the
   point of the A/B.
4. **`named` in a column of ordinals** is honest but slightly awkward. The
   alternative was inventing a rank, which was not an option.
