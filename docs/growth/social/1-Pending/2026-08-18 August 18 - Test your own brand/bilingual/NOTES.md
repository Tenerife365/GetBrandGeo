# Madrid, bilingual pair: language divergence

Two vertical cuts of one finding, one in Spanish and one in English, built with
ffmpeg 8.1.2 directly. Remotion is not installed and nothing was installed.
Nothing here has been posted or scheduled. No git command was run.

| File | What it is |
|---|---|
| `madrid-es-silent.mp4` | **Spanish upload master.** Zero audio streams, not a muted one. |
| `madrid-es-scored.mp4` | Same video bitstream plus the BrandGEO-composed `tension-minor`. |
| `madrid-es-cover.png` | 1080x1920 cover, verified byte-identical to frame 0. |
| `madrid-en-silent.mp4` | **English upload master.** Zero audio streams. |
| `madrid-en-scored.mp4` | Same video bitstream plus the same bed. |
| `madrid-en-cover.png` | 1080x1920 cover, verified byte-identical to frame 0. |

Source: `brandgeo/web/ai-visibility-for-madrid.html`.

---

## The data constraint, and how the cuts stay inside it

That run was collected **2026-07-10** on **four** engines: Claude, Gemini,
Meta AI, Perplexity. **ChatGPT was not in it**: an account-level API quota
failure excluded it, which the page discloses. Meta AI has since been retired.

Both cuts put the date on screen inside the engine card, name the four engines
that actually ran, label Meta AI as retired at the point of naming it, and
disclose the ChatGPT failure on the same card rather than silently omitting it.
Dating it is what makes it checkable.

Not on screen anywhere, and mechanically checked rather than promised:

- No five-engine claim and no reference to today's Growth lineup. `google_ai`
  is absent; injecting it makes the scan exit non-zero.
- ChatGPT appears only inside the failure disclosure. The scan fails if the
  token appears without a disclosure phrase in the SAME cut.
- No superlative. The page's own "the strongest consensus of any category, any
  city, in this program so far" and "the most unanimous result of any city
  tested so far" are cross-corpus claims that the page asserting them cannot
  verify, so neither is used, in either language.
- **No measured subject.** The hotels, agencies and restaurants that appeared
  inside the result sets are never named. The prompt that produced them is
  quoted, which is the checkable half and harms nobody.
- No pricing, no plan names. TOFU, soft CTA.

---

## On-screen text, verbatim

These are the exact bytes of the `textfile=` targets ffmpeg drew from, one
`drawtext` per line. Every scene also carries `BRANDGEO` at the bottom of the
safe zone and a violet rail down the left margin that fills as the cut runs.

Boundaries were recovered by decoding all 930 frames of each delivered master;
all 19 cuts land on the designed frame at four independent ink thresholds, so
the frame numbers below are measured rather than asserted.

### Spanish, `madrid-es-silent.mp4`

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 12 | 0.000 to 0.400 | `UNA PREGUNTA.` |
| 2 | 14 | 0.400 to 0.867 | + `HECHA DOS VECES.` |
| 3 | 20 | 0.867 to 1.533 | + `EN DOS IDIOMAS.` (accent) |
| 4 | 20 | 1.533 to 2.200 | label `LA PREGUNTA` + `¿Qué hotel recomiendan cerca` |
| 5 | 22 | 2.200 to 2.933 | + `del aeropuerto de Madrid-Barajas?` |
| 6 | 20 | 2.933 to 3.600 | + `Which hotel is recommended` |
| 7 | 22 | 3.600 to 4.333 | + `near Madrid-Barajas airport?` |
| 8 | 78 | 4.333 to 6.933 | the card, plus `LAS RESPUESTAS` / `NO COINCIDIERON.` |
| 9 | 18 | 6.933 to 7.533 | label `MADRID, 10 DE JULIO DE 2026` + `Claude` |
| 10 | 18 | 7.533 to 8.133 | + `Gemini` |
| 11 | 20 | 8.133 to 8.800 | + `Meta AI (ya retirado)` |
| 12 | 18 | 8.800 to 9.400 | + `Perplexity` |
| 13 | 74 | 9.400 to 11.867 | + `ChatGPT: fallo de recogida de datos.` + `CUATRO MOTORES.` (accent) |
| 14 | 72 | 11.867 to 14.267 | `GEMINI RESPONDIÓ` / `EN INGLÉS.` / `NADA EN ESPAÑOL.` (accent) |
| 15 | 72 | 14.267 to 16.667 | `META AI CONTESTÓ` / `EN ESPAÑOL.` / `NADA EN INGLÉS.` (accent) |
| 16 | 54 | 16.667 to 18.467 | `MISMA PREGUNTA.` / `SENTIDO OPUESTO.` |
| 17 | 48 | 18.467 to 20.067 | `OTRA PREGUNTA.` / `DOS MOTORES.` |
| 18 | 72 | 20.067 to 22.467 | `CADA UNO DIO` / `DOS LISTAS.` (accent) |
| 19 | 72 | 22.467 to 24.867 | `COMPROBAR UNO` / `NO ES COMPROBAR` / `LOS DOS.` |
| 20 | 184 | 24.867 to 31.000 | `COMPRUEBA` / `LOS DOS IDIOMAS.` (accent) + logo + `getbrandgeo.com` |

### English, `madrid-en-silent.mp4`

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 12 | 0.000 to 0.400 | `ONE PROMPT.` |
| 2 | 14 | 0.400 to 0.867 | + `SENT TWICE.` |
| 3 | 20 | 0.867 to 1.533 | + `TWO LANGUAGES.` (accent) |
| 4 | 20 | 1.533 to 2.200 | label `THE PROMPT` + `¿Qué hotel recomiendan cerca` |
| 5 | 22 | 2.200 to 2.933 | + `del aeropuerto de Madrid-Barajas?` |
| 6 | 20 | 2.933 to 3.600 | + `Which hotel is recommended` |
| 7 | 22 | 3.600 to 4.333 | + `near Madrid-Barajas airport?` |
| 8 | 78 | 4.333 to 6.933 | the card, plus `THE ANSWERS` / `DID NOT MATCH.` |
| 9 | 18 | 6.933 to 7.533 | label `MADRID, 10 JULY 2026` + `Claude` |
| 10 | 18 | 7.533 to 8.133 | + `Gemini` |
| 11 | 20 | 8.133 to 8.800 | + `Meta AI (since retired)` |
| 12 | 18 | 8.800 to 9.400 | + `Perplexity` |
| 13 | 74 | 9.400 to 11.867 | + `ChatGPT: collection error, excluded.` + `FOUR ENGINES.` (accent) |
| 14 | 72 | 11.867 to 14.267 | `GEMINI ANSWERED` / `IN ENGLISH.` / `NOT IN SPANISH.` (accent) |
| 15 | 72 | 14.267 to 16.667 | `META AI ANSWERED` / `IN SPANISH.` / `NOT IN ENGLISH.` (accent) |
| 16 | 54 | 16.667 to 18.467 | `THE SAME PROMPT.` / `OPPOSITE WAYS.` |
| 17 | 48 | 18.467 to 20.067 | `A SECOND PROMPT.` / `TWO ENGINES.` |
| 18 | 72 | 20.067 to 22.467 | `EACH GAVE` / `TWO LISTS.` (accent) |
| 19 | 72 | 22.467 to 24.867 | `CHECKING ONE` / `IS NOT CHECKING` / `BOTH.` |
| 20 | 184 | 24.867 to 31.000 | `CHECK BOTH` / `LANGUAGES.` (accent) + logo + `getbrandgeo.com` |

### On the Spanish being native rather than translated

The Spanish cut is not a rendering of the English one. `HECHA DOS VECES` is not
a translation of `SENT TWICE`, `SENTIDO OPUESTO` is the idiom for a direction
reversal where English wants `OPPOSITE WAYS`, and scene 15 uses `CONTESTÓ`
where scene 14 used `RESPONDIÓ` because repeating one verb across two adjacent
beats reads badly in Spanish and does not in English. Scene 19 is built on
`COMPROBAR`, which carries the checking-a-fact sense the line needs.

The prompt card is bilingual in BOTH cuts, because the finding is about one
question in two languages and showing only one half would remove the reader's
ability to check it.

**Both cuts quote the prompt exactly as published**, including the ASCII hyphen
in `Madrid-Barajas` (U+002D, not an en dash).

---

## Glyph rendering, verified on the delivered files

`drawtext` renders a missing glyph as a box with no error, so this is the
failure mode most likely to ship silently. Four independent checks.

### 1. The font carries the glyphs

`fontTools` over all four vendored weights: all 16 of `¿¡ÁÉÍÓÚÑáéíóúñüÜ` are
present in the cmap AND have a non-zero contour or component count, so none is
an empty glyph behind a valid mapping.

### 2. What a MISSING glyph actually looks like, measured not assumed

Three codepoints no font on the system has (`U+E000`, `U+E001`, `U+10FFFD`)
render byte-identically, which is the true tofu signature. Private-use
codepoints were used specifically because no fallback font can rescue them:

```
Inter-SemiBold  38pt   13 x 42   fill 0.848   full rows 13/42 (31%)
Inter-ExtraBold 66pt   22 x 73   fill 0.790   full rows 22/73 (30%)
```

**Two guesses died here and both were caught by a negative control**, which is
the reason the control exists:

- Inter draws `.notdef` as a **hollow** rectangle, not a solid one. A
  "fill >= 0.98" test would never have fired on real tofu.
- Its fill is **not** flat across a threshold sweep either. It erodes by 0.178,
  because the box has an antialiased edge like anything else. The first
  discriminator required flat fill and therefore classified genuine tofu as a
  real glyph. The control printed `CONTROL FAILED, discriminator is blind` and
  the run aborted.

What does discriminate is the pair (exact width and height, fill fraction). The
corrected control returns `TOFU=True` on `U+E000` in both weights before any
real glyph is tested.

An earlier version used `U+5B57` as the reference, a CJK codepoint that a
fallback font could have served, which would have made the comparison
meaningless. Re-measured: it happens to produce exactly the tofu signature here,
so the earlier result stood, but it stood by luck and now stands by measurement.

### 3. Every Spanish glyph, standalone, threshold swept

All 16 codepoints in both weights, 32 renders, `TOFU=False` on every one. None
comes within the tofu geometry. Representative rows at threshold 60:

```
Inter-SemiBold 38pt    ¿ 17x29 fill 0.414    ¡  6x28 fill 0.76
                       Ó 25x37 fill 0.40     Ñ 23x36 fill 0.56
                       é 19x30 fill 0.49     ü 18x29 fill 0.54
Inter-ExtraBold 66pt   ¿ 33x50 fill 0.45     ¡ 13x49 fill 0.83
                       Ó 46x65 fill 0.48     Ñ 43x64 fill 0.64
```

### 4. In the DELIVERED mp4, isolating each glyph's OWN columns

Whole-line comparison is not sufficient: substituting one character in a
28-character line leaves most of the line intact, so a high line-level score can
coexist with one tofu box. Each glyph is located by prefix ink widths and only
its own columns are measured, on a frame decoded out of the delivered master.

The inverted question mark is tested explicitly, in both cuts, because it is
less commonly subset than an accented vowel.

```
es frame  56  '¿Que hotel...'[0]  = ¿   columns x 140..158   17x29  fill 0.414   PASS
es frame  56  '¿Que hotel...'[3]  = é   columns x 211..234   20x30  fill 0.470   PASS
en frame  56  '¿Que hotel...'[0]  = ¿   columns x 140..158   17x29  fill 0.410   PASS
es frame 392  'GEMINI RESPONDIÓ'[15] = Ó  x 730..781  46x65  fill 0.481   PASS
es frame 392  'EN INGLÉS.'[7]        = É  x 400..438  34x63  fill 0.587   PASS
es frame 392  'NADA EN ESPAÑOL.'[12] = Ñ  x 626..675  43x64  fill 0.625   PASS
```

**The threshold trap is real and was swept for.** At a low ink threshold the
antialiased skirt bridges the gap between an accent and its vowel, so the pair
reads as one band and looks like tofu. Swept at 20/40/60/80/100/120/150, the
accent gap is present at every threshold and widens: `Ó` holds 4 empty rows
through threshold 100 and 5 above it, `Ñ` goes 4 to 6. A tofu box has zero
empty rows at every threshold.

This check also caught a mistake of my own: the first run pointed at
`'NADA EN ESPAÑOL.'[11]`, which is `A`, not `Ñ`. The accent-gap criterion failed
it correctly, which is a small piece of evidence that the criterion works.

**Non-ASCII is expected and correct in the Spanish cut.** "Zero non-ASCII" is
NOT a pass condition here and is not asserted. The banned codepoints are only
the dashes: em, en, figure, minus, horizontal bar, and there are none.

---

## The compliance scan, and its negative controls

`scan.py` parses `textfile='...'` back out of the 40 filtergraph files actually
handed to ffmpeg and reads those bytes. It does not read the copy module, the
brief, or its own intent. 63 unique drawn strings, 945 characters. Every string
is cross-checked as referenced by a filtergraph, so an orphaned or stale string
cannot hide from it, and a half-built corpus fails loudly rather than passing.

**Checks run PER CUT, not over both pooled.** The first version pooled them, and
negative controls NC10/NC11 proved that unsafe: deleting the Spanish retirement
label still passed, because the English label satisfied the check. A per-cut
claim needs per-cut evidence. That bug was found by the control, not by reading.

**Diacritic folding.** Both the harvested corpus and the drawn strings go
through NFKD, combining-mark stripping, then case-folding, in that order, so
`Völkers`, `Volkers` and `VOLKERS` are one token. Comparing raw bytes would let
any name spelled without its diacritic walk past, which matters more here than
usual because Spanish convention drops accents on capitals. Unit-tested:
`Peña/Pena/PEÑA/PENA/peña` collapse to one form, likewise `Martínez` and `Íñigo`.

**Measured-subject corpus:** 15 curated names plus 25 harvested from the source
page. Nav, header and footer are stripped, which removes the generic
capitalised runs that could false-positive against clean copy. **Body prose is
deliberately kept**, against the general advice to harvest the result column
only: on this page four of the six measured subjects (`DiverXo`, `Kabuki`,
`El Prior`, `La Tasquita de Enfrente`) appear ONLY in a narrative paragraph,
`Hotel Urso` and `The Principal Madrid` are in `<td>`, and `Engel & Völkers` is
in `<strong>`. Restricting to the result column would have dropped four of six.
Verified by locating each name in the markup, not assumed.

### Every control fires

15 controls, each injecting or removing the thing the check exists to catch,
then restored and re-run to exit 0.

| Control | Result |
|---|---|
| measured subject, accented `Engel & Völkers` | fires |
| measured subject, unaccented `ENGEL & VOLKERS` | fires |
| measured subject, prose-only `La Tasquita de Enfrente` | fires |
| em dash | fires |
| superlative, English `strongest` | fires |
| superlative, Spanish `mejor` | fires |
| universal over people `nobody` | fires |
| engine not in the run `Google AI Mode` | fires |
| pricing `299 EUR` | fires |
| banned style word `seamless` | fires |
| ChatGPT named, disclosure removed (es) | fires |
| ChatGPT named, disclosure removed (en) | fires |
| Meta AI named, `since retired` removed | fires |
| Meta AI named, `ya retirado` removed | fires |
| collection date removed | fires |

Diacritic variants were swept more widely than the table shows: 14 spellings
across five subject names, every one firing in both cuts.

Clean run:

```
PASS: no dashes, no banned style words, no superlatives, no universals
      no measured subjects, lineup exactly the four that ran, date present
FLAGS needing a judgement call: none
```

Nothing needed adjudication. Neither cut contains `always`, `never`, `cannot`,
`siempre` or `nunca`, so the universal-versus-situational distinction did not
have to be applied to any line.

### N-gram diff against every prior run

Run on the drawn bytes, flattened across line breaks so a shared run that
straddles two rendered lines cannot hide. 36 prior `NOTES.md` files,
**30,509 tokens** harvested from inline backticks AND fenced blocks.

The first version harvested only inline backticks and therefore read **none** of
run `20260730-0613`, which is a cut of this same Madrid finding. Missing it was
the entire risk the rule exists for.

```
es: 91 distinct 4-grams   NO overlap with any prior run
en: 85 distinct 4-grams   NO overlap with any prior run
exact whole-line collisions beyond the allowed residue: none
```

Three English lines were rewritten **after** the diff flagged them, not before:

| was | became | collided with |
|---|---|---|
| `ONE QUESTION.` | `ONE PROMPT.` | run `20260730-0313`'s CTA |
| `SAME QUESTION.` | `THE SAME PROMPT.` | run `20260730-0013`'s opening hook |
| `ASKED TWICE.` | `SENT TWICE.` | run `20260730-0613`'s YouTube cut |

All three are generic enough to read as coincidence and all three were DRAWN
lines in the runs they came from, not prose, so they were changed rather than
argued about. Residual overlap is now only the engine names, the wordmark and
the URL.

**The third one is the reason this diff has to run last.** It did not exist when
the first diff was run: run `20260730-0613`'s YouTube cut landed on disk DURING
this build, and its French/English pair draws `The same question, / asked twice.`
as rendered copy. The corpus grew from 33 files and 30,509 tokens to 36 and
34,643 between the two runs of the same script.

It is also the case that reading the sibling's notes would have found this and
reading them earlier would not have, because the file did not exist yet. Other
agents are writing runs concurrently, so a line clean at render time can collide
minutes later. **Re-run `ngram.py` before this pair is used**; it is cheap and it
is the only check here whose input is not under this build's control.

---

## Safe-zone measurement

Built against the **tightest** reserve of the four platforms so one master
serves every one: **200 top, 360 bottom, 200 right**. Usable box `y 200..1559`,
`x ..879`. Every number below comes from frames decoded out of the **delivered**
masters.

### Ink threshold, argued from a measured control

The text-free control is a flat canvas pushed through the identical pipeline
(numbered frame sequence at `-framerate 30`, `libx264 -preset slow -crf 18`,
`-profile:v high -level 4.0`, `yuv420p`, same frame count).

```
control:            min 9   max 9   (one value, zero variance)
dimmest drawn:      rail track #1B1D2B   luma  30
                    label rule #7C3AED   luma  98
                    rail fill  #8B5CF6   luma 124
                    accent     #A78BFA   luma 160
                    ink        #E8E9ED   luma 233
-> threshold 11, two above the control peak, so every antialiased skirt counts
```

The result is not threshold-sensitive. Full sweep, union over all 930 frames:

```
              SPANISH                    ENGLISH
thr  11   x 100..799  y 260..1472    x 100..815  y 260..1472
thr  15   x 100..799  y 260..1471    x 100..814  y 260..1471
thr  20   x 100..799  y 260..1471    x 100..814  y 260..1471
thr  40   x 100..799  y 260..1471    x 100..814  y 260..1471
thr  60   x 100..799  y 260..1471    x 100..814  y 260..1471
thr  96   x 100..799  y 260..1471    x 100..814  y 260..1471
thr 150   x 141..799  y 470..1471    x 141..814  y 470..1471
```

One pixel of vertical movement between 11 and 15, none on the right edge
anywhere, including at 96 where the rail track drops out entirely.

**The union at threshold t was computed from the per-pixel MAXIMUM over frames,
not a bbox per frame.** A pixel falls inside some frame's box iff its max across
frames exceeds t, so the two are identical, and the collapse removes a
cache-hostile column scan per frame. That identity is not assumed: a brute-force
per-frame union over the first 120 frames was compared against the collapsed
answer and matched exactly on both cuts.

### Method B: control diff, noise floor measured before the threshold

```
y1600..1900  (below every drawn element)   max |delta| = 0
x900..1079   (right of the text column)    max |delta| = 0
y0..230      (above the rail)              max |delta| = 0
-> diff threshold 1, one above the measured floor
```

The floor really is zero on this build, which is worth stating because other
runs in this campaign measured 7 in the same test. This canvas is flat and the
ink sparse, so x264 at crf 18 reproduces the empty regions bit-exactly. It was
still measured rather than assumed. Neither cut's method-B box touches a frame
edge, which is the signature of the yuv420p row-0 artefact that produced a false
failure elsewhere in this campaign.

### Method C: declared rects

51 rects recorded at draw time per cut (rail track, 20 rail fills, 20 label
rules, the logo overlay). Declared union `x 100..359  y 260..1399`, inside both
measured boxes. The logo overlay `y` is 880, already even, so the
`overlay`-rounds-odd-`y`-down trap cannot bite and the declared rect equals the
effective one. Nothing in this build sits near the canvas value: the dimmest
element is the rail track at luma 30 against a canvas of 9, which both pixel
methods resolve, so method C is a redundancy here rather than the only witness.

### Reported boxes, union of all three methods

```
                        SPANISH                 ENGLISH
UNION            x  94..799  y 256..1479   x  94..815  y 256..1479
limits           x   ..879   y 200..1559   x   ..879   y 200..1559
headroom  top          56px                      56px
          bottom       80px                      80px
          right        80px                      64px
verdict    ALL 930 FRAMES INSIDE          ALL 930 FRAMES INSIDE
```

Every edge clears the 20px minimum by at least a factor of three. `verify.py`
exits non-zero if any edge falls under 20.

### TYPE alone, which is what a copy edit moves

Same threshold with the left rail (`x < 130`) and the bottom wordmark
(`y >= 1444`) excluded:

```
                        SPANISH                 ENGLISH
TYPE union       x 140..799  y 468..1091   x 140..815  y 468..1091
widest type ends at      x=799                    x=815
clear of the 879 limit by 80px                     64px
```

**The two numbers differ, and the type owns the right edge in both cuts.** The
union's right edge IS the type's right edge (799 and 815); the union is wider
only on the left, where method B picks up single-channel fringing on the rail at
x=94, and lower, where the wordmark sits at y=1479. So the safe-zone number is a
fact about the words, not about furniture, which is the condition this campaign
requires before a safe-zone pass means anything.

Widest Spanish line is `META AI CONTESTÓ` in scene 15; widest English line is
`META AI ANSWERED` in scene 15. English runs 16px wider than Spanish, so English
has the tighter margin of the two despite Spanish being the longer language
overall.

### Type size was fitted by measurement, and Spanish set it

Column geometry was fixed before the first render: pen `x = 140`, budget 680px,
design right edge 820, which sits 59px inside the 879 limit by construction.

**Both languages were fitted as ONE pool**, so the two cuts share a type size and
stay visually comparable. Spanish lines were budgeted first and are what forced
the ladder down.

```
headlines, 46 unique lines across both languages
  widest at 100pt   1022px   'META AI ANSWERED'
  78pt -> predicted  797.2px   over budget
  72pt -> predicted  735.8px   over budget
  66pt -> predicted  674.5px   FITS      <- chosen
  re-measured at 66pt: widest real 675px against the 680px budget

card rows, 9 unique lines
  widest at 100pt   1675px   'del aeropuerto de Madrid-Barajas?'
  46pt / 42pt over budget, 38pt FITS      <- chosen
  re-measured at 38pt: widest real 636px against 680px
```

Because point-size scaling of a hinted TTF is not exactly linear, every line was
**re-rendered at the chosen size and re-measured** rather than trusted to the
scaling. The pass/fail number is always the box measured out of the delivered
mp4, and those are 799 and 815.

An earlier copy draft had 21-character headlines needing 1358px at 100pt, which
nothing on the ladder could fit at a usable size. Both decks were rewritten to a
16-character ceiling rather than dropping the type below 66pt.

---

## Scene boundaries

19 designed cuts per file. Detected by ink-count step changes on frames decoded
sequentially in one pass. `-ss` is never used to sample near a cut, and frame
hashing is never used: H.264 gives visually identical frames different
quantisation noise.

**A whole-frame ink COUNT missed exactly one cut, and it was the instrument, not
the render.** English scene 14 to 15, at threshold 150 only:

```
scene 14  GEMINI ANSWERED / IN ENGLISH. / NOT IN SPANISH.   bright ink 40,612
scene 15  META AI ANSWERED / IN SPANISH. / NOT IN ENGLISH.  bright ink 40,700
step 88, against an intra-scene noise floor of 214
```

Two three-line headline blocks of nearly equal length carry nearly the same
number of lit pixels. The pictures are completely different words. Evidence it
is the detector and not the render, and this is the distinction the campaign
keeps paying for:

- the same cut IS detected at thresholds 11, 70 and 120
- the Spanish cut's equivalent scene pair steps by 1,617 and is detected
- **a render fault cannot appear and disappear with the measurement threshold**

Splitting each frame into 12 horizontal bands and requiring any one band to step
beyond its own self-calibrated noise floor resolves it, because two scenes with
equal total ink still distribute it differently. `boundaries.py` is
authoritative:

```
es  thr  11 / 70 / 120 / 150   19/19 exact, no false positives, none missed
en  thr  11 / 70 / 120 / 150   19/19 exact, no false positives, none missed
```

38 of 38 boundaries exact across four thresholds on both cuts.

---

## Cover, and the no-fade rule

```
                     SPANISH                            ENGLISH
cover rgb24 md5    4b41e003123ebe45fca0556cb8338616   46e9bb4974e703fa26d1d9cd36c89859
frame 0 md5        4b41e003123ebe45fca0556cb8338616   46e9bb4974e703fa26d1d9cd36c89859
identical          True                               True
frame 0 ink px     25,017                             22,611
```

**Scene 1 does not fade.** There is no `fade` filter anywhere in either build.
A faded frame 0 would measure 0 ink pixels. The thumbnail the feed picks up is
`UNA PREGUNTA.` and `ONE PROMPT.` at full opacity.

## The rail moves

`drawbox` cannot animate on 8.1.2: it has no `eval` option and evaluates
`x/y/w/h` once at init, so `h='1140*t/31'` would have frozen at its t=0 value
with no warning. The rail is drawn as 20 static boxes, one per scene, each with
its own height. Measured on the delivered files at every scene midpoint:

```
designed  40 40 56 81 108 132 159 255 277 299 324 346 436 525 613 679 738 826 914 1140
measured  40 40 56 81 108 132 159 255 277 299 324 346 436 525 613 679 738 826 914 1140
max |designed - measured| = 0   non-decreasing = True    (identical on both cuts)
```

Scenes 1 and 2 read the same because the fill clamps to a 40px minimum so the
rail is visible on frame 0; it is strictly increasing from scene 2 onward.

---

## Duration, exact ffprobe of the delivered files

```
madrid-es-silent.mp4   format 31.000000   nb_streams 1
                       video 31.000000    930 frames   1080x1920  30/1  yuv420p  h264
madrid-es-scored.mp4   format 31.000000   nb_streams 2
                       video 31.000000    930 frames
                       audio 31.000000   1455 frames   aac 48000Hz stereo

madrid-en-silent.mp4   format 31.000000   nb_streams 1
                       video 31.000000    930 frames   1080x1920  30/1  yuv420p  h264
madrid-en-scored.mp4   format 31.000000   nb_streams 2
                       video 31.000000    930 frames
                       audio 31.000000   1455 frames   aac 48000Hz stereo
```

**31.000s each**, inside the 25 to 35s target. 930 frames at 30fps is exactly
31.000s with no rounding anywhere, because the timeline is a numbered frame
sequence rather than a duration list. `ffconcat` is not used: cumulative float
durations drift and can land a cut one frame late while total duration still
looks correct.

**The silent masters have zero audio streams**, not a silent audio track.
`nb_streams=1`. That is what `-an` buys.

Video is stream-copied into each scored variant. Full video-stream MD5:

```
es   c54ced2dc9f23b49921275da144cde68   identical on silent and scored
en   dc8c3bd75772acfdeb252b3a2683f672   identical on silent and scored
```

so every picture measurement above holds for the scored cuts too.

**No drift.** Each scored file decodes 2,977,792 samples (31.0187s of raw
payload) while `duration_ts` is 31.000000s exactly, so the trailing 1024-sample
AAC quantisation tail is excluded by the stream duration rather than played.
`-shortest` pins it. Checked, not assumed.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed, owned
outright, cleared for commercial use including paid advertising, and it carries
**no attribution line**. Nothing was downloaded. The same bed is used on both
cuts so the language is the only variable between them.

Trimmed to 31.000s, 1.5s fade out starting at 29.5s, **0.08s fade in**. The fade
in is mandatory rather than cosmetic: the source is already at 0.195 peak inside
its first 0.1s, so starting at sample 0 would click.

Verified on the DELIVERED files, not the intermediate wav:

```
                                    SPANISH      ENGLISH    required
first 64 samples, peak |amplitude|  0.001974     0.001974   < 0.005   OK
first 8 (L)  0.000153  0.000179  0.000214  0.000250
             0.000293  0.000307  0.000282  0.000300
last 64 samples, peak               4.95e-07     4.95e-07   -126 dBFS, inaudible
whole-file peak                     0.608876     0.608876
```

The tail is **not** exactly zero, and the distinction cost a false failure worth
recording: the six-decimal print above originally read `0.000000` and an
exact-zero assertion failed on it. 4.95e-07 is about -126 dBFS, below the
24-bit noise floor, which is the question the check is actually asking.

Loudness, two-pass `loudnorm` with `linear=true`, re-measured on the delivered
mp4s:

```
pass 1 measured:   I -16.13   TP -4.41   LRA 3.60   thresh -26.18   offset -1.12
pass 2 applied:    linear=true, I=-16, TP=-1.5, LRA=11
delivered:         I -16.02   TP -4.28   LRA 3.60      (identical on both cuts)
```

Integrated lands 0.02 LU off target after AAC encoding. True peak is -4.28 dBTP,
well under the -1.5 ceiling rather than at it: linear mode applies one flat gain,
so the peak falls wherever the integrated target puts it. -1.5 is a ceiling not
to exceed, so this is compliant with 2.8 dB spare. Single-pass was not used;
pass 1 shows it would have landed at -14.88.

**Honest read: nobody has listened to these files.** Everything above is
measurement. LRA is 3.60 LU over this 31s window against 6.80 LU over the full
60s track, so the excerpt is less dynamic than the whole piece. The cuts are
driven by reading time and the track runs at a fixed 100 BPM, so picture and
music are not locked; where they agree it is coincidence.

---

## Commands

Fonts are referenced by bare filename with ffmpeg's cwd set to the build folder.
This is load-bearing on Windows: a drive-letter colon inside a filtergraph option
value terminates the option even when the value is quoted.

**Every drawn string goes through `textfile=`, never `text=`.** The Spanish copy
carries commas and a colon, both filtergraph metacharacters, and routing through
files removes escaping entirely while guaranteeing the bytes reach ffmpeg as
UTF-8 rather than through the Windows console codepage. It also gives the scanner
an exact artefact: the bytes in `txt/` ARE the bytes drawn.

**1. Type fitter**, before any scene is drawn. Each unique line alone on a
3000x500 canvas, ink width read off a decoded frame:

```
ffmpeg -hide_banner -loglevel error -y -f lavfi -i color=c=0x090A0F:s=3000x500 \
  -/filter_complex _fit.txt -map "[out]" -frames:v 1 -f rawvideo -pix_fmt gray -
```

**2. Scene stills**, one PNG per scene, 20 per cut:

```
ffmpeg -hide_banner -loglevel error -y -f lavfi -i color=c=0x090A0F:s=1080x1920 \
  -/filter_complex es/scenes/g08.txt -map "[out]" \
  -frames:v 1 -update 1 -pix_fmt rgb24 es/scenes/s08.png
```

Scene 20 additionally takes `-i logo.png` and ends
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=140:880[out]`. A representative
graph body, Spanish scene 13:

```
[0:v]drawbox=x=100:y=260:w=6:h=1140:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=100:y=260:w=6:h=436:color=0x8B5CF6@1:t=fill:replace=1,
drawtext=fontfile='fonts/Inter-Bold.ttf':textfile='txt/t000.txt':x=140:y=1450:fontsize=30:fontcolor=0xA78BFA:expansion=none,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':textfile='txt/t013.txt':x=140:y=470:fontsize=30:fontcolor=0xA78BFA:expansion=none,
drawbox=x=140:y=524:w=220:h=4:color=0x7C3AED@1:t=fill:replace=1,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':textfile='txt/t014.txt':x=140:y=560:fontsize=38:fontcolor=0xE8E9ED:expansion=none,
... three more engine rows ...
drawtext=fontfile='fonts/Inter-Medium.ttf':textfile='txt/t018.txt':x=140:y=826:fontsize=30:fontcolor=0xE8E9ED:expansion=none,
drawtext=fontfile='fonts/Inter-ExtraBold.ttf':textfile='txt/t019.txt':x=140:y=916:fontsize=66:fontcolor=0xA78BFA:expansion=none[out]
```

`replace=1` is on **every** `drawbox`. The source is opaque RGB so blending would
have worked, but a violet rule that vanished at alpha 0 has cost this campaign a
whole build before, so it is made structurally impossible rather than reasoned
about per call.

**3. Silent master.** No ffconcat. Each scene PNG is copied into a numbered
frame sequence, `f` copies for an `f`-frame scene, so the timeline is
frame-exact by construction:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i es/frames/f%05d.png \
  -vf "format=yuv420p" -frames:v 930 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an es/madrid-es-silent.mp4
```

**4. Text-free control**, the same command over 930 copies of a blank canvas, so
it shares every codec artefact and differs only in content.

**5. Cover**, the literal first frame:

```
ffmpeg -hide_banner -loglevel error -y -i es/madrid-es-silent.mp4 \
  -frames:v 1 -update 1 es/madrid-es-cover.png
```

**6. Scored cut:**

```
ffmpeg -hide_banner -loglevel error -y -i music.wav -t 31.000 \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=29.500:d=1.5" \
  -ar 48000 -c:a pcm_s24le es/mcut.wav

ffmpeg -hide_banner -i es/mcut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i es/mcut.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.13:measured_TP=-4.41:\
measured_LRA=3.60:measured_thresh=-26.18:offset=-1.12:linear=true" \
  -ar 48000 -c:a pcm_s24le es/mnorm.wav

ffmpeg -hide_banner -loglevel error -y -i es/madrid-es-silent.mp4 -i es/mnorm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart es/madrid-es-scored.mp4
```

**7. Verification.** All 930 frames decoded sequentially in ONE pass, streamed
one frame at a time. An earlier version decoded whole videos into arrays: 930
rgb24 frames is 5.8 GB, and with a control alongside it that is 11.6 GB before
any comparison. It thrashed and produced nothing.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, `#7C3AED` for the label
rule, `#8B5CF6` for the rail fill, `#1B1D2B` for the rail track. **`#8B5CF6` is
used for no text anywhere**; it measures 4.2:1 on this canvas and fails. Inter
ExtraBold 66 for headlines, SemiBold 38 for card rows, SemiBold 30 for labels,
Medium 30 for the disclosure note, Bold 30 for the wordmark, Medium 34 for the
URL. All vendored from `docs/growth/grok-launch/images/_build/fonts/`. Logo is
`icon-card-1024.png` scaled to 132. Dark only.

---

## Open items

- The two cuts are 31.000s each and structurally identical scene for scene,
  which is what makes them comparable, but it also means Spanish gets exactly
  the same reading time as English on lines that are longer. Scene 19
  (`COMPROBAR UNO / NO ES COMPROBAR / LOS DOS.`) is the tightest of these at
  three lines in 2.4s. If the Spanish cut underperforms, take frames from
  scene 17 and give them to 19 before changing any words.
- The prompt card holds four rows of 38pt for 2.8s in scenes 4 to 8. That is a
  lot of small type for a feed. It is there because it is the evidence, but a
  variant that shows only the Spanish half and lets the English line arrive on
  the reversal beat would be lighter and worth testing against this one.
- Nobody has heard either scored cut. See the music section.
- `madrid-en-*` has 64px of right-edge headroom against Spanish's 80px, because
  `META AI ANSWERED` is 16px wider than `META AI CONTESTÓ`. Both pass with
  margin, but the English cut is the one to re-measure first if any headline is
  ever edited.
