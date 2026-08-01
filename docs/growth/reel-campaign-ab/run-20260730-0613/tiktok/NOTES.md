# TikTok cut, run-20260730-0613

**Hook driver:** #3, curiosity gap, **SECOND PASS**. "One prompt, asked in two
languages, and the two answers barely overlap."

Run 3 (`run-20260730-0013`) used the same driver. Its spine was TWELVE CITIES OF
PROPERTY-MANAGEMENT CONSENSUS, then Denver's zero repeated agent names, with the
city list as a deliberate misdirect. **None of that is here.** This pass takes
one of the other curiosity-gap shapes named in the brief: the same question
asked in two LANGUAGES and answered differently. The withheld thing is not
*which city* but *what changed when only the language changed*, and the answer
is that the engines did not reorder a list, they considered a different set of
firms entirely.

Loop opens at 0.867s (`THE LISTS / DID NOT MATCH.`) and closes at 16.433s
(`THE LANGUAGE / PICKED THE / SHORTLIST.`), 55% of the way in, so the payoff
lands well before the drop-off tail.

**Deliverables**

| File | What it is |
|---|---|
| `tiktok-silent.mp4` | Upload master. Zero audio streams. Pick a track in the TikTok in-app library. |
| `tiktok-scored.mp4` | Same picture, BrandGEO-composed bed. For paid, site embeds and decks. |
| `tiktok-cover.png` | Literal frame 0 of the master, verified byte-identical. |

**Silent is the one to upload.** In-app audio is a ranking input on TikTok, not
just a licence convenience.

---

## On-screen text, verbatim

Every line is a separate `drawtext`. Line breaks in the table are literal line
breaks on screen. Boundaries were verified by decoding all 900 frames of the
delivered file in one sequential pass; all 15 cuts land exactly where designed.

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 12 | 0.000 to 0.400 | `ONE PROMPT.` / `TWO LANGUAGES.` |
| 2 | 14 | 0.400 to 0.867 | `ONE CITY.` / `ONE CATEGORY.` |
| 3 | 20 | 0.867 to 1.533 | `THE LISTS` / `DID NOT MATCH.` (line 2 accent) |
| 4 | 51 | 1.533 to 3.233 | `WEALTH ADVISORS` / `IN PARIS.` |
| 5 | 60 | 3.233 to 5.233 | label `ASKED IN FRENCH` + `INDEPENDENT` / `FRENCH FIRMS.` |
| 6 | 60 | 5.233 to 7.233 | label `ASKED IN ENGLISH` + `INTERNATIONAL` / `PRIVATE BANKS.` |
| 7 | 36 | 7.233 to 8.433 | label `ONE FRENCH BOUTIQUE FIRM` + `IN FRENCH` / `3 ANSWERS` |
| 8 | 69 | 8.433 to 10.733 | the same, plus `IN ENGLISH` / `NONE` (accent) |
| 9 | 48 | 10.733 to 12.333 | `NOT A REORDER.` (accent) |
| 10 | 51 | 12.333 to 14.033 | `A DIFFERENT` / `SET OF FIRMS.` |
| 11 | 72 | 14.033 to 16.433 | `THE LANGUAGE` / `PICKED THE` / `SHORTLIST.` (accent) |
| 12 | 63 | 16.433 to 18.533 | `FRENCH COVERAGE` / `DID NOT CARRY` / `INTO ENGLISH.` |
| 13 | 54 | 18.533 to 20.333 | `222 ANSWERS,` / `READ BY HAND.` |
| 14 | 48 | 20.333 to 21.933 | `WE PUBLISHED` / `THE DATA.` |
| 15 | 90 | 21.933 to 24.933 | label `THE FIVE WE RUN` + `CHATGPT` / `GEMINI` / `CLAUDE` / `PERPLEXITY` / `GOOGLE AI MODE` |
| 16 | 152 | 24.933 to 30.000 | `WHICH LIST ARE` / `YOU ON?` plus logo, `BRANDGEO`, `getbrandgeo.com` |

Persistent on every frame: the eyebrow `B R A N D G E O` top left, and a
**vertical violet rail down the left margin** that fills as the cut runs.

### Why the furniture is a left rail and not a progress bar

Run 2's TikTok build had a horizontal progress bar setting `x0`, `x1` and `y1`
on every frame, so its measured safe-zone box described the bar and said nothing
about whether the copy fit. The rail here sits at `x 64..69`, `y 250..999`. Left
has no reserve on any platform, and the rail deliberately **stops 116px above
the lowest type**, so the type owns the bottom edge and the right edge outright.
That is visible in the numbers below: the union and the type box differ by 16px
on the bottom and 38px on the left, and agree on the right, which is exactly the
distribution you want. A layout whose two boxes never differ carries no headroom
information and a longer line fails silently.

### Why the copy is shaped this way

The cheap version of a curiosity gap teases a finding and delivers a product
pitch. This one delivers a published result and then reverses the viewer's
default assumption. Scenes 1 to 4 set up an experiment where only one variable
moves. Scenes 5 and 6 are a hard SWAP, not an accumulation: the French block is
replaced in place by the English block, so the viewer sees the substitution
happen rather than watching a table grow. Scene 7 to 8 lands the count, 3 then
none, and scene 9 names what it is not.

TikTok gets the bluntest of the four cuts. Longest line on screen is 15
characters. Hard cuts only, no fades anywhere.

**The first 1.5 seconds carry three state changes.** Ink COUNT is the wrong
instrument for this and would have understated it badly: scene 2 to scene 3 swaps
two lines for two lines of similar length and moves the ink count by 129px, while
every glyph on screen changes. Counting CHANGED PIXELS is what a viewer sees.
Measured on frames decoded out of the delivered file:

```
cut at f12  (0.400s)   changed pixels  31,102
cut at f26  (0.867s)   changed pixels  34,972
cut at f46  (1.533s)   changed pixels  43,423
largest change on a NON-cut frame in the same window:  297
```

Two orders of magnitude between a cut and the quietest non-cut frame. Raw frame
hashes are not usable for this at all: H.264 gives visually identical frames
different quantisation noise.

---

## Factual position, and where every number comes from

| On screen | Claim | Source | Verified denominator |
|---|---|---|---|
| `ONE PROMPT.` / `TWO LANGUAGES.` / `ONE CITY.` / `ONE CATEGORY.` | Paris was tested bilingually: "4 categories, each asked once in French and once in English" | `brandgeo/web/ai-visibility-for-paris.html` | design fact, not a rate |
| `WEALTH ADVISORS` / `IN PARIS.` | The prompt pair was "Meilleurs conseillers en gestion de patrimoine a Paris" / "Best wealth management advisors in Paris" | same page, prompt table | n/a |
| `INDEPENDENT` / `FRENCH FIRMS.` | "French-language answers consistently named independent, boutique French patrimoine firms" | same page | n/a |
| `INTERNATIONAL` / `PRIVATE BANKS.` | "English-language answers instead converged on major international private banks" | same page | n/a |
| `IN FRENCH` / `3 ANSWERS` | One boutique French firm "appeared in 3 of 4 French-language responses" | same page | **4 French-language responses**, one per responding engine |
| `IN ENGLISH` / `NONE` | "and in zero English-language ones" | same page | **4 English-language responses** |
| `NOT A REORDER.` | "This isn't the same brands reordered by language" / "That's not the same list re-ranked by language" | `ai-visibility-for-paris.html`, `bg-017.html` | n/a |
| `A DIFFERENT` / `SET OF FIRMS.` | "it's a genuinely different competitive set" | `ai-visibility-for-paris.html` | n/a |
| `THE LANGUAGE` / `PICKED THE` / `SHORTLIST.` | "depending only on which language the question was asked in" | same | n/a |
| `FRENCH COVERAGE` / `DID NOT CARRY` / `INTO ENGLISH.` | "A boutique firm that only publishes in French is structurally invisible to English-language AI searchers in this category" | same | n/a |
| `222 ANSWERS,` / `READ BY HAND.` | "222 Real production AI responses read and analyzed by hand" | `bg-017.html` key findings | **222 completed responses**, the paper's analytic dataset |
| `WE PUBLISHED` / `THE DATA.` | "why we published the data itself rather than just our conclusions about it"; open access, permanent DOI | `bg-017.html` | n/a |

### The denominator, and why no engine count appears anywhere near this finding

This is the load-bearing restraint in the cut, and it cost the strongest-looking
screen.

**ChatGPT's collection failed on every Paris prompt in that run** (`status:
error`, disclosed on the page as a data-quality note, not a finding). Paris
therefore ran on **four** engines, and one of those four is **Meta AI, which is
retired**. So:

- The `3` and the `NONE` are shown as **raw counts of ANSWERS**, labelled by
  language, with **no denominator on screen and no engine count anywhere**.
  Putting `3/4` up would have invited the viewer to read four as today's engine
  lineup, which it is not, and putting `4 ENGINES` up would have been a claim
  about a lineup that included a retired engine.
- The brief's rule is exact here: an engine count is a claim about the lineup on
  the day of collection, not a property of the finding. "3 answers, then none"
  needs no denominator and is true as stated.
- `222` is a count of responses, not engines, and is the paper's stated analytic
  dataset. `bg-017` reports it as "across four engines"; that phrase is
  deliberately **not** on screen for the same reason.

### Restraints, each of which cost a stronger screen

1. **No firm is named.** The page names the boutique (and the two international
   banks, and the online bank in the adjacent category). Every one of them is a
   measured SUBJECT: the finding is *about* them, they never agreed to appear in
   advertising, and their reputation would be doing our commercial work. The
   claim survives intact as "one French boutique firm", and that version cannot
   be objected to. Naming the ENGINES is a different act and is allowed: they are
   the instruments, and the product is undescribable without them.
2. **No superlative, at all.** The Paris page carries several that are true of
   its own record and unverifiable from the page asserting them: "the cleanest,
   most unanimous consensus found anywhere in this research program", "the
   cleanest unanimous sweep in this research program so far". `bg-017` adds "the
   paper's most theoretically significant result". A superlative is a claim about
   every other page in the corpus, so none of them are on screen. This is the
   exact trap that put a false Chicago claim into two rendered cuts on run 5.
3. **The unanimous online-banking result is not used**, even though it is the
   strongest number on the page, because it is inseparable from the brand that
   won it.
4. **No rate, no percentage.** Counts only.
5. **`bg-016.html` was not sourced.** No engine count from `bg-004.html`. The
   phrase "27 cities" appears nowhere.
6. **Rome was not used.** Rome ran four engines, so its within-engine result
   cannot be stated as engine consensus, and its 5/5-style figures are not what
   they look like.

Other compliance:

- Engines named are exactly the five in the Growth set, checked mechanically
  against `brandgeo-dashboard/src/lib/planConfig.ts` at render time: ChatGPT,
  Gemini, Claude, Perplexity, Google AI Mode. **No Grok, no AI Overviews** (both
  live 2026-07-29 with 5 and 6 rows from one day). **No Meta AI**, retired.
- No pricing, no plan names. TOFU, soft CTA.
- No em dashes, no en dashes, none of the banned vocabulary.
- No file outside this folder was written. Research pages were read only.

---

## Scanners, and their negative controls

Every check reads the **drawn bytes**: the `text='...'` values parsed back out
of the 16 filtergraph files this build actually fed to ffmpeg. Not the scene
model, not this document, not the brief. Each one carries a negative control:
the thing it is meant to catch is injected, the scan must fire, then it is
restored. An exit code of 0 proves nothing on its own.

| Scanner | Result | Negative control |
|---|---|---|
| dashes (U+2014/2013/2015/2212) | PASS | injected `A — B`, fired |
| banned vocabulary (16 terms) | PASS | injected `SEAMLESS AND ROBUST`, fired on both |
| superlatives (18 patterns) | PASS | injected `THE MOST FRAGMENTED CATEGORY`, fired on `most` |
| universals (17 patterns) | 1 hit, adjudicated | injected `NOBODY DOES THIS BY HAND`, fired |
| measured subjects | PASS | injected `Cheval Blanc Patrimoine`, `Qonto`, `Douglas Elliman`, `Corcoran` — all four fired |
| engine lineup vs `planConfig.ts` | PASS | injected `META AI`, `GROK`, `AI OVERVIEWS` — all three caught |
| pricing / plan names | PASS | injected `FROM EUR 299`, fired |
| n-gram diff vs run 3 | PASS | injected run 3's whole scene 15, fired |

**The universal hit is `none`, and it stays.** Per the brief's refinement, the
test is whether the word quantifies over PEOPLE or BUSINESSES. `NONE` labels the
count of English-language answers containing one firm: it quantifies over four
recorded responses. That is a situational fact about one measurement, in the
same class as "the answers you cannot see", not a claim anyone could refute with
a counterexample. The scanner reports it rather than silently allowing it, and
the adjudication is written into the scanner itself so the next run inherits the
reasoning rather than the verdict.

### Two real scanner defects, found by their own controls

**The measured-subject harvester returned 7 false positives on its first run**:
`Asked`, `Boutique`, `Coverage`, `Independent`, `International`, `Match`,
`Wealth`. All ordinary words that happen to be capitalised somewhere in the
corpus. This is run 8's failure exactly, and a scanner that cries wolf on
`Wealth` is one that will be ignored when it fires on a real firm.

Fixed with an oracle derived from the corpus rather than hand-written: **a
capitalised token is only proper-noun-ish if the corpus never also uses it
lowercase.** `wealth`, `asked`, `coverage`, `independent` all appear lowercase;
`Qonto`, `Elliman`, `Cheval` never do. That collapsed 1,855 candidates to 1,001
real ones, cleared all 7 false positives, and all four injected company names
still fire.

**The n-gram diff's own negative control FAILED, which is how it was caught.**
The first version computed n-grams *within* each `drawtext` string. Run 3 draws
`THE MOST` / `FRAGMENTED` / `CATEGORY WE` / `MEASURED.` as **four separate
layers of one scene**, so a within-layer diff sees only 2-grams of it and a
seven-word reuse walks straight through. That is precisely the run 8 failure the
brief describes. The control injected a two-word fragment, which could not
produce a 3-gram and therefore could not fire, and reported FAIL.

Rebuilt to diff **scene streams**: every `text=` value of a scene, in draw
order, joined, which is what a viewer actually reads off one screen. The control
was rebuilt too, injecting run 3's entire scene 15 rather than a fragment. It
now fires on `most fragmented category we measured` and `the most fragmented
category we`.

---

## N-gram diff against run 3, result

Run against run 3's real drawn bytes, not its notes. Run 3's build directory was
located and confirmed by md5: it re-produces `run-20260730-0013/tiktok/
tiktok-silent.mp4` byte for byte (`0d270750aeaf765f8960f10f0144e37e`), so its 21
filtergraph files are the strings that were actually rendered.

Brand furniture is stripped before tokenising. The letter-spaced wordmark
`B R A N D G E O` tokenises to single letters which then glue onto the first word
of the next layer and manufacture phantom overlaps (`o one`, `o the`, `o we`).
Those appeared in the first run of the diff and are an artefact of letter
spacing, not copy.

```
view A, WITHIN a single drawtext layer
  2-gram   mine  49   run3  57   shared (non-exempt)  0
  3-gram   mine  19   run3  25   shared (non-exempt)  0
  4-gram   mine   7   run3  10   shared (non-exempt)  0
  5-gram   mine   4   run3   5   shared (non-exempt)  0

view B, ACROSS a whole scene, i.e. what a viewer reads
  2-gram   mine  66   run3  83   shared (non-exempt)  0
  3-gram   mine  55   run3  75   shared (non-exempt)  0
  4-gram   mine  40   run3  62   shared (non-exempt)  0
  5-gram   mine  26   run3  49   shared (non-exempt)  0
  6-gram   mine  16   run3  38   shared (non-exempt)  0
  7-gram   mine  11   run3  28   shared (non-exempt)  0

identical whole drawn strings, all 8 of them:
  B R A N D G E O, BRANDGEO, getbrandgeo.com,
  CHATGPT, GEMINI, CLAUDE, PERPLEXITY, GOOGLE AI MODE
```

**Residual overlap is exactly the engine list, the wordmark and the URL**, which
is the target the brief sets. Zero shared 2-grams of copy at either view.

One structural collision was caught and removed rather than argued away. The
card originally rendered a lone **150pt accent `0`** as its punch glyph. That is
run 3's single most distinctive visual (a 260pt accent `0` where a five-row table
had been). Intent to differ is not evidence of difference, and the identical-
string check flagged `0` as shared. The card was rebuilt to read `IN FRENCH /
3 ANSWERS` then `IN ENGLISH / NONE` at 110pt, which is a stronger screen anyway
and shares nothing with run 3.

---

## Safe-zone measurement

TikTok reserves 200px top, 360px bottom, 200px right. Usable box `y 200..1560`,
`x ..880`. Everything below is measured on frames decoded out of the
**delivered** `tiktok-silent.mp4`, sequentially, in one pass per method. No `-ss`
anywhere.

### Ink threshold, argued from a measured control

Measured first, chosen second:

```
delivered file, known-empty band y1650..1899, ALL 900 frames:  min 9   max 9
dimmest colour deliberately drawn:   29   (rail track #1B1D2B)
next dimmest:                        96   (violet rule #7C3AED)
brightest:                          231   (ink #E8E9ED)
```

The encoded background is a single flat value with zero variance across the whole
run, so the range 10 to 28 is empty. **Threshold 11** sits just above the
background rather than mid-gap, so every antialiased skirt is counted and the
reported box can only overstate, never understate.

The result is not threshold-sensitive:

```
thr  10   x  63..811   y 248..1131
thr  11   x  63..811   y 248..1131      <- reported
thr  15   x  64..811   y 250..1112
thr  20   x  64..811   y 250..1112
thr  40   x  64..811   y 250..1112
thr  60   x  64..811   y 250..1112
thr 100   x  64..811   y 250..1112
thr 150   x  64..811   y 250..1112
```

The right edge is 811 at every single threshold from 10 to 150. That is the
number the pass rests on and it does not move.

### Cross-check against a text-free control

Method B is a per-frame RGB diff against a control encoded through the identical
`image2 -> libx264 -crf 18 -preset slow` pipeline with nothing drawn on it. A
control cancels codec artefacts because it carries them too; it cannot cancel
libx264's response to content it does not have, so the diff threshold is set from
a floor measured in the delivered file rather than picked by eye.

```
residual noise in the known-empty band y1650..1899, delivered minus control: 0
threshold 1 therefore sits above the measured floor by construction

thr  1   x  62..811   y 246..1131      <- reported
thr  3   x  62..811   y 248..1129
thr  6   x  63..811   y 248..1113
thr 21   x  64..811   y 250..1113
```

Method B finds 1 to 2px more ink on the left and top, which is expected:
single-channel fringing survives an RGB comparison and is averaged away by the
gray conversion. Per the brief, the wider number is the one reported. **Both
methods agree exactly on the right edge, 811**, which is the edge under a real
reserve.

No frame-edge artefact appeared here. Run 3 hit one (`rgb(7,7,15)` on rows 0 and
1) and correctly diagnosed it as yuv420p chroma at the frame boundary; this
build's diff never reaches row 0, and the control would have cancelled it if it
had.

### Declared rects folded in

Pixel methods are blind to anything within a few luma of the canvas, so geometry
is added explicitly rather than trusted to the measurement:

```
rail track   x  64.. 69   y  250.. 999    (declared, 6x750 at 64,250)
logo card    x 100..231   y 1000..1131    (declared, 132x132 overlaid at 100,1000)
```

The logo's `overlay` y is **1000, even**, so ffmpeg's odd-y-rounds-down does not
apply. Both rects sit inside the measured union, so neither moves it, which is
the outcome to want rather than a reason to have skipped the check. The
independent confirmation is that method A's lowest ink at threshold 11 is
y=1131, the logo's exact declared bottom.

### Reported box, union of everything drawn

```
UNION            x   62..811     y  246..1131
reserves         top 200         bottom y<=1560      right x<=880
HEADROOM         top 46px        bottom 429px        right 69px
tightest         46px            verdict PASS (floor is 20px)
```

### Type alone, chrome excluded, per scene

Columns `x<100` (the rail) and the declared logo rect are masked out:

```
scene01  x 100..767  y 248.. 903     scene09  x 102..703  y 248.. 816
scene02  x 100..687  y 248.. 904     scene10  x 100..615  y 248.. 903
scene03  x 100..704  y 248.. 904     scene11  x 101..666  y 248.. 992
scene04  x 100..807  y 248.. 903     scene12  x 102..811  y 248.. 991
scene05  x 100..659  y 248.. 904     scene13  x 100..667  y 248.. 904
scene06  x 100..703  y 248.. 904     scene14  x 100..640  y 248.. 903
scene07  x 100..763  y 248.. 819     scene15  x 100..619  y 248..1055
scene08  x 100..763  y 248..1059     scene16  x 100..691  y 248..1115
```

```
TYPE UNION       x  100..811     y  248..1115
TYPE HEADROOM    top 48px        bottom 445px        right 69px
```

**Widest actual type is scene 12, `FRENCH COVERAGE` at x1 = 811, 69px clear of
the limit.** Union and type differ by 16px on the bottom (the logo) and 38px on
the left (the rail), and agree on the right, so the box describes the copy rather
than the furniture. A copy edit that lengthens the widest line has 69px of real
room before it fails, and the measurement would move if it did.

### How the margin was designed in rather than discovered

Run 1's TikTok build passed on 1px. The column here was sized before the first
render: left margin 100, column 720, right edge 820, reserving 60px inside the
880 limit by construction. Headline size is then **fitted by measurement**: every
unique headline string is rendered alone at 100pt through the real ffmpeg/Inter
path, its ink width measured, and the largest size from the ladder
78/72/66/60/54 whose widest line fits 720px is taken.

```
widest lines at 100pt:  FRENCH COVERAGE   983 px
                        WEALTH ADVISORS   977 px
                        TWO LANGUAGES.    923 px
78pt predicted:  983 * 0.78 = 766.7 px  against a 720 px budget  -> OVER, rejected
72pt predicted:  983 * 0.72 = 707.8 px  against a 720 px budget  -> FITS
72pt re-measured standalone (not predicted):  708 px
72pt measured on the delivered mp4, scene 12:  710 px (x 102..811)
```

Prediction, standalone re-measurement and the delivered file agree within 2px.
The fitter is still only used to pick a size; the pass/fail number is always the
box measured out of the delivered mp4.

---

## Scene boundaries, and the detector

Boundaries are the PLATEAU CENTRE of the changed-pixel signal, taking the
**FLOOR**, never the round. An even-width plateau has no integer centre and
rounding produces a uniform +1 frame offset on every cut, which reads exactly
like timeline drift. The threshold was swept, because a plateau's WIDTH changes
with threshold and its centre does not:

```
luma-delta  4:  inside-scene max   590   at-boundary min  19,385   thr 9,987   15/15 exact
luma-delta  6:  inside-scene max   520   at-boundary min  19,320   thr 9,920   15/15 exact
luma-delta 10:  inside-scene max   488   at-boundary min  19,252   thr 9,870   15/15 exact
luma-delta 16:  inside-scene max   463   at-boundary min  19,190   thr 9,826   15/15 exact
```

All 15 boundaries land exactly where designed, at every threshold. The gap
between the loudest intra-scene frame (590) and the quietest real cut (19,190) is
a factor of 32, so the threshold is not doing delicate work.

"Changed pixels" is the count of pixels whose luma moved by more than the stated
delta between consecutive frames. Plain ink-count differencing was rejected: it
would have reported the scene 2 to 3 cut as a 129px event, close enough to the
noise floor to be meaningless, while the picture change there is 34,972px.

**No ffconcat.** Run 3 found that cumulative float durations drift: 70/30 =
2.333333 put a boundary a third of a microsecond past a frame edge and landed one
scene a frame late, while the total duration and frame count still came out
exactly right, so nothing about the container looked wrong. Scene stills are
expanded into a 900-file numbered sequence and encoded at `-framerate 30`, which
is frame-exact by construction.

---

## Duration, exact ffprobe on the delivered files

```
tiktok-silent.mp4   format 30.000000   nb_streams 1
                    video  30.000000   900 frames   1080x1920  yuv420p  30/1
                                       duration_ts 460800 @ 1/15360

tiktok-scored.mp4   format 30.000000   nb_streams 2
                    video  30.000000   900 frames   duration_ts 460800 @ 1/15360
                    audio  30.000000  1408 frames   duration_ts 1440000 @ 1/48000
```

30.000s, inside the 25 to 40s TikTok target.

**The silent master has zero audio streams**, not a silent audio track.
`ffprobe -select_streams a -show_entries stream=index` returns an empty string
and `nb_streams=1`. That is what `-an` buys.

**The scored cut did not drift.** The AAC stream holds 1408 frames, which is
1,441,792 samples, 30.037s of raw payload. The container reports 30.000000
because `duration_ts` is 1,440,000 samples exactly, so the trailing quantised
tail is excluded rather than played. `-shortest` is what pins it.

Video is stream-copied into the scored variant, so any picture check on one holds
for the other.

## Cover

`tiktok-cover.png` is the literal first frame, extracted from the encoded master.
Raw `rgb24` MD5 of the cover and of frame 0 of `tiktok-silent.mp4` both read
`93b4eafddb99c935bc331c8cedfa1fd8`. Byte-identical, 1080x1920.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build,
verified by scanning all 16 filtergraph files. Frame 0 renders at full opacity
carrying `ONE PROMPT. / TWO LANGUAGES.`, so the thumbnail the feed picks up is
the hook.

## The rail

`drawbox` cannot animate on 8.1.2: it has no `eval` option and evaluates
`x/y/w/h` once at init, so an expression would silently freeze at its t=0 value
with no warning. The rail is therefore 16 static boxes, one per scene, drawn into
that scene's still. Verified on the delivered file that it actually moves, 16
distinct heights, strictly increasing:

```
10, 22, 38, 81, 131, 181, 212, 268, 308, 351, 411, 463, 508, 548, 623, 750
```

Scene 7 measures 212 against a designed 211: one row of antialiasing at the fill
tip crossing the luma-60 counting threshold. Every other step matches its design
exactly.

`replace=1` is on **every** `drawbox`. The source is opaque RGB so blending would
have worked, but run 1 lost a violet rule to alpha-0 blending with no error, and
making that structurally impossible is cheaper than reasoning about it per call.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed, owned
outright, cleared for commercial use including paid advertising, no attribution
line. 60.000s source, 48kHz stereo. **Held constant across runs on purpose:** the
hook is the variable under test, so the bed must not be.

Trimmed to 30.000s, 0.08s fade in, 1.5s fade out starting at 28.5s.

**The fade in is mandatory, not cosmetic.** Measured on the source:

```
first  16 samples peak |amp|  0.058739
first  64 samples peak |amp|  0.067873
first 512 samples peak |amp|  0.158241
first 0.1s        peak |amp|  0.281608
```

A cut at sample 0 clicks audibly. The brief records the opening amplitude as
0.025; the peak across the first 64 samples measures 0.068, which strengthens the
case rather than weakening it.

Verified on the **delivered** `tiktok-scored.mp4`:

```
first  16 samples  peak |amp|  0.000788
first  64 samples  peak |amp|  0.003512   <- required below 0.005, PASS
first 512 samples  peak |amp|  0.020505
first 0.08s        peak |amp|  0.229207
first 1.0s         peak |amp|  0.331095
last   64 samples  peak |amp|  0.000000   (fade out lands at digital silence)
```

Loudness, two-pass `loudnorm` with `linear=true`:

```
pass 1 measured:  I -16.20   TP -4.41   LRA 3.60   thresh -26.25   offset -1.11
pass 1 also reports what a SINGLE pass would have produced:  I -14.89
pass 2 applied:   linear=true, I=-16, TP=-1.5, LRA=11
verified output:  I -16.00   TP -4.21   LRA 3.60
```

Integrated lands on -16.00 LUFS. The brief is right that single-pass undershoots:
it would have landed at -14.89, 1.11 LU high. True peak is -4.21 dBTP, under the
-1.5 ceiling rather than at it, because linear mode applies one flat gain and the
peak lands wherever the integrated target puts it. -1.5 is a ceiling not to
exceed, so this is compliant with 2.7dB spare.

**Honest read: nobody has listened to this file.** Everything above is
measurement. `astats` on the delivered cut: peak -4.26/-4.23 dBFS, RMS
-16.32/-16.57 dBFS, crest factor 4.01/4.14, flat factor 0. LRA is 3.60 LU over
this 30s window, so the excerpt is less dynamic than the whole piece. The cuts
are driven by reading time and the track runs at a fixed tempo, so they are not
locked to each other and will agree at some cuts by coincidence rather than by
design.

---

## Commands

Fonts are referenced by bare filename with ffmpeg's cwd set to the build folder.
This is load-bearing on Windows: a drive-letter colon inside a filtergraph option
value terminates the option even when the value is quoted, so `fontfile=C:/...`
fails to parse.

**1. Scene stills**, one PNG per scene, 16 total, filtergraph written to a file:

```
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i color=c=0x090A0F:s=1080x1920 \
  -/filter_complex scenes/gNN.txt -map "[out]" \
  -frames:v 1 -update 1 -pix_fmt rgb24 scenes/sNN.png
```

Scene 16 additionally takes `-i logo.png` and ends
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=100:1000[out]`. A representative
graph body, scene 8:

```
[0:v]drawtext=fontfile='Inter-SemiBold.ttf':text='B R A N D G E O':x=100:y=250:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=64:y=250:w=6:h=750:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=64:y=250:w=6:h=268:color=0xA78BFA@1:t=fill:replace=1,
drawtext=fontfile='Inter-SemiBold.ttf':text='ONE FRENCH BOUTIQUE FIRM':x=100:y=560:fontsize=30:fontcolor=0x8B90A0,
drawbox=x=100:y=608:w=120:h=4:color=0x7C3AED@1:t=fill:replace=1,
drawtext=fontfile='Inter-SemiBold.ttf':text='IN FRENCH':x=100:y=680:fontsize=42:fontcolor=0x8B90A0,
drawtext=fontfile='Inter-ExtraBold.ttf':text='3 ANSWERS':x=100:y=736:fontsize=110:fontcolor=0xE8E9ED,
drawtext=fontfile='Inter-SemiBold.ttf':text='IN ENGLISH':x=100:y=920:fontsize=42:fontcolor=0x8B90A0,
drawtext=fontfile='Inter-ExtraBold.ttf':text='NONE':x=100:y=976:fontsize=110:fontcolor=0xA78BFA[out]
```

The violet rule is deliberately 120px wide, not full column. A full-width rule
would set the right edge on every table scene and take ownership of the binding
constraint away from the type, which is the run 2 mistake in a different costume.

**2. Frame-exact sequence, then the silent master.** Each scene still is copied
`frames` times into `seq/f%04d.png`, 900 files. No ffconcat, no float durations:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i seq/f%04d.png \
  -vf "format=yuv420p" -frames:v 900 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an tiktok-silent.mp4
```

`-an` is what makes this a true silent master rather than a silent audio track.

**3. Cover**, the literal first frame:

```
ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 \
  -frames:v 1 -update 1 tiktok-cover.png
```

**4. Scored cut:**

```
ffmpeg -hide_banner -loglevel error -y -i music.wav -t 30.0 \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=28.5:d=1.5" \
  -ar 48000 -c:a pcm_s24le music_cut.wav

ffmpeg -hide_banner -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i music_cut.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.20:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.25:offset=-1.11:linear=true" \
  -ar 48000 -c:a pcm_s24le music_norm.wav

ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 -i music_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart tiktok-scored.mp4
```

**5. Text-free control**, for measurement method B, identical settings:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i cseq/f%04d.png \
  -vf "format=yuv420p" -frames:v 900 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an control.mp4
```

**6. Verification** decodes the delivered file sequentially, never with `-ss`:

```
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt gray  -
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt rgb24 -
```

piped frame by frame into numpy.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, violet `#7C3AED` for the
short rule, rail track `#1B1D2B`, muted label `#8B90A0`. `#8B5CF6` is used for no
text anywhere; it measures 4.2:1 on this canvas and fails. Inter ExtraBold for
headlines and counts, SemiBold for labels, rows and the eyebrow, Bold for the
wordmark, Medium for the URL, all vendored from
`docs/growth/grok-launch/images/_build/fonts/`. Dark only.

## Open items

- **The finding is one category in one city, and the cut is honest about that but
  does not prove it generalises.** Berlin and Madrid used the same paired
  bilingual design and are published. A three-city version of scenes 5 to 8 would
  be a materially stronger asset and needs no new collection, only one figure per
  city pulled from each page rather than from Paris's.
- **`222 ANSWERS, READ BY HAND.` is the weakest beat in the cut.** It is true and
  it is ours, but it arrives after the loop has already closed and it competes
  with `WE PUBLISHED THE DATA.` for the same job. If this driver tests well, cut
  one of the two and give the frames to scene 11, the loop close, which currently
  gets 2.4s.
- **The DOI is not on screen.** `bg-017` has a permanent Zenodo DOI, which is the
  hardest credibility object BrandGEO owns, and a 30-second vertical video is a
  bad place for a string nobody can type. `WE PUBLISHED THE DATA.` is the version
  that survives the format. Worth revisiting for the YouTube cut, which has room.
- **The Paris page carries three superlatives that cannot be verified from the
  page asserting them**, in the same shape as the Chicago defect already filed
  from run 5: "the cleanest, most unanimous consensus found anywhere in this
  research program", "the cleanest unanimous sweep in this research program so
  far", and "one of the strongest single-brand results found anywhere in this
  research program". None reached this cut. They are a content defect on a live
  page and are worth filing separately from this campaign.
- Nobody has heard the scored cut. See the music section.
- `RUN.md` at the run root records which hook driver the run used, per the brief.
  It is outside this task's write scope and was not created here.
