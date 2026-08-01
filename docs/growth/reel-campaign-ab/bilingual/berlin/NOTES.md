# Berlin, bilingual pair: German and English cuts

Two vertical cuts of one finding from
`brandgeo/web/ai-visibility-for-berlin.html`, collected **2026-07-10**.

| File | What it is |
|---|---|
| `berlin-de-silent.mp4` | German upload master. Zero audio streams. |
| `berlin-de-scored.mp4` | Same picture, BrandGEO-composed bed. |
| `berlin-de-cover.png` | Literal frame 0 of the German master. |
| `berlin-en-silent.mp4` | English upload master. Zero audio streams. |
| `berlin-en-scored.mp4` | Same picture, BrandGEO-composed bed. |
| `berlin-en-cover.png` | Literal frame 0 of the English master. |

Both cuts are 900 frames, 30.000s, 1080x1920, 30fps, yuv420p, H.264. Same
structure, same scene lengths, same type size, so the pair is comparable.

---

## The data constraint, and exactly how it is honoured on screen

The run behind this page fired **four** engines on **2026-07-10**: Claude,
Gemini, Meta AI, Perplexity. Both cuts draw a provenance card that names all
four next to the date, built one row at a time so the count is read rather than
asserted.

**ChatGPT is not drawn anywhere, in any form.** It was excluded from that run by
an account-level API quota failure. The page discloses this and so does the
Zenodo paper. The cut does not mention it at all: on a 30 second vertical, a
viewer scanning a list of engine names is more likely to absorb the name than
the negation attached to it, and "the four that ran, with the date" is already
exact and needs no denominator. A scanner check enforces this on the drawn
bytes rather than on intent, and its negative control confirms the check fires
when `ChatGPT` is injected.

**Meta AI is named and its status is disclosed.** German:
`Meta AI lief damals mit.` / `Heute läuft es nicht mehr mit.` English:
`Meta AI ran that day.` / `We no longer run it.` The English wording is
deliberate: Meta AI was retired from BrandGEO's lineup on 2026-07-16, which is
a fact about our engine set, not about Meta AI being shut down.

**Nothing is framed as current.** The date is on screen twice in each cut, once
on the provenance card and once in the closing gloss (German `Stand:
10.07.2026.`, English `As measured 2026-07-10.`). No line uses a present tense
that implies the measurement is live.

**No engine count from today's lineup appears.** `VIER KI-SYSTEME.` /
`FOUR ENGINES.` is a count of the engines drawn on the card, on the collection
date, and it sits directly under them.

### The page's own `<title>` is wrong and was ignored

`ai-visibility-for-berlin.html` line 21 reads "German vs. English Answers from
ChatGPT, Gemini & Perplexity", which names an engine that was not in the run and
omits two that were. The body, the FAQ and the JSON-LD `WebPage.description`
are all correct and agree on Claude, Gemini, Meta AI, Perplexity. The cuts
follow the body.

Two further instances of the same defect, found while reading the page and
worth filing alongside the title: the `og:title` at line 24 repeats the wrong
lineup verbatim, and the JSON-LD `mentions` array at lines 49 to 53 lists
ChatGPT as one of five `SoftwareApplication` entries. So the wrong lineup is
published in three places, one of which is machine-readable and is the copy an
AI engine is most likely to parse.

### No cross-corpus superlative

The Paris page's "one of the strongest results found anywhere in this research
program" and anything shaped like it is absent. A superlative is a claim about
every other page in the corpus, so the page asserting it cannot confirm it. The
scanner rejects `first`, `only`, `most`, `best`, `biggest`, and the German
`erste`, `einzige`, `beste`, `größte`, on the drawn bytes.

---

## On-screen text, verbatim: GERMAN (`berlin-de`)

Persistent on every frame: `BRANDGEO` at the bottom of the safe zone, and a
violet rail down the left margin that fills as the cut runs.

| # | Frames | In / out | On screen |
|---|---|---|---|
| 1 | 12 | 0.000 to 0.400 | `DIESELBE FRAGE.` |
| 2 | 14 | 0.400 to 0.867 | `DIESELBE FRAGE.` / `ZWEI SPRACHEN.` |
| 3 | 24 | 0.867 to 1.667 | + `ZWEI ANTWORTEN.` (accent) |
| 4 | 20 | 1.667 to 2.333 | label `BERLIN`, rule, `ERHOBEN AM 10.07.2026`, row `Claude` |
| 5 | 20 | 2.333 to 3.000 | + row `Gemini` |
| 6 | 20 | 3.000 to 3.667 | + row `Meta AI` |
| 7 | 26 | 3.667 to 4.533 | + row `Perplexity` |
| 8 | 46 | 4.533 to 6.067 | + `VIER KI-SYSTEME.` |
| 9 | 74 | 6.067 to 8.533 | + `Meta AI lief damals mit.` / `Heute läuft es nicht mehr mit.` |
| 10 | 56 | 8.533 to 10.400 | `VIER KATEGORIEN.` / `JE ZWEIMAL` / `GEFRAGT.` |
| 11 | 62 | 10.400 to 12.467 | `JE EINMAL` / `AUF DEUTSCH.` / `AUF ENGLISCH.` |
| 12 | 60 | 12.467 to 14.467 | label `EINE DER VIER FRAGEN` + `ZWEI SYSTEME` / `ANTWORTETEN` / `AUF DEUTSCH.` |
| 13 | 78 | 14.467 to 17.067 | label `EINE DER VIER FRAGEN` + `AUF ENGLISCH:` / `NICHTS` (accent) / `BRAUCHBARES.` (accent) + gloss `Gleiche Frage. Gleiches System.` |
| 14 | 62 | 17.067 to 19.133 | `EINE KATEGORIE:` / `4 VON 4 EINIG.` / `AUF DEUTSCH.` |
| 15 | 62 | 19.133 to 21.200 | `EINE ANDERE:` / `KEIN KONSENS.` + gloss `In beiden Sprachen.` |
| 16 | 78 | 21.200 to 23.800 | `SICHTBARKEIT` / `HÄNGT AN DER` / `SPRACHE.` (accent) + gloss `Das heißt: einmal messen reicht nicht.` |
| 17 | 186 | 23.800 to 30.000 | `PRÜFEN SIE BEIDE` / `SPRACHEN.` (accent) + gloss `Stand: 10.07.2026.` + logo + `getbrandgeo.com` |

### Why this German, and why it is not a translation

Written German-first, then the English cut was written to match its shape. Short
declaratives, no anglicism where a normal German word exists: `KI-SYSTEME` not
"Engines", `FRAGEN` not "Prompts", `KEIN KONSENS` not "kein Match". The address
is `Sie`, which is what a Berlin business owner or marketer expects from a
product they have not bought yet.

`ANTWORTETEN` in scene 12 is preterite against scene 9's `lief`, both of which
put the finding in the past on the grammar rather than on a disclaimer. The
closing `Stand: 10.07.2026.` is the ordinary German construction for the date a
figure was valid, which is exactly the claim being made.

`Das heißt: einmal messen reicht nicht.` is a statement about the METHOD. It
quantifies over nothing and no counterexample about other people can refute it.

## On-screen text, verbatim: ENGLISH (`berlin-en`)

| # | Frames | In / out | On screen |
|---|---|---|---|
| 1 | 12 | 0.000 to 0.400 | `SAME QUESTION.` |
| 2 | 14 | 0.400 to 0.867 | `SAME QUESTION.` / `TWO LANGUAGES.` |
| 3 | 24 | 0.867 to 1.667 | + `TWO ANSWERS.` (accent) |
| 4 | 20 | 1.667 to 2.333 | label `BERLIN`, rule, `COLLECTED 2026-07-10`, row `Claude` |
| 5 | 20 | 2.333 to 3.000 | + row `Gemini` |
| 6 | 20 | 3.000 to 3.667 | + row `Meta AI` |
| 7 | 26 | 3.667 to 4.533 | + row `Perplexity` |
| 8 | 46 | 4.533 to 6.067 | + `FOUR ENGINES.` |
| 9 | 74 | 6.067 to 8.533 | + `Meta AI ran that day.` / `We no longer run it.` |
| 10 | 56 | 8.533 to 10.400 | `FOUR CATEGORIES.` / `EACH ASKED` / `TWICE.` |
| 11 | 62 | 10.400 to 12.467 | `ONCE EACH` / `IN GERMAN.` / `IN ENGLISH.` |
| 12 | 60 | 12.467 to 14.467 | label `ONE OF THE FOUR QUESTIONS` + `TWO ENGINES` / `ANSWERED` / `IN GERMAN.` |
| 13 | 78 | 14.467 to 17.067 | label `ONE OF THE FOUR QUESTIONS` + `IN ENGLISH:` / `NOTHING` (accent) / `USABLE.` (accent) + gloss `Same question. Same engine.` |
| 14 | 62 | 17.067 to 19.133 | `ONE CATEGORY:` / `4 OF 4 AGREED.` / `IN GERMAN.` |
| 15 | 62 | 19.133 to 21.200 | `ANOTHER:` / `NO AGREEMENT.` + gloss `In either language.` |
| 16 | 78 | 21.200 to 23.800 | `VISIBILITY` / `TRACKS THE` / `LANGUAGE.` (accent) + gloss `Measuring once is not enough.` |
| 17 | 186 | 23.800 to 30.000 | `CHECK BOTH` / `LANGUAGES.` (accent) + gloss `As measured 2026-07-10.` + logo + `getbrandgeo.com` |

---

## Where every claim on screen comes from

| On screen | Source in `ai-visibility-for-berlin.html` |
|---|---|
| `ERHOBEN AM 10.07.2026` / `COLLECTED 2026-07-10` | `.updated-note`: "data collected 2026-07-10"; JSON-LD `datePublished` |
| `Claude` `Gemini` `Meta AI` `Perplexity` | FAQ: "the 4 engines that returned usable results: Claude, Gemini, Meta AI, and Perplexity" |
| `VIER KATEGORIEN` / `FOUR CATEGORIES` and asked twice | findings bar: "4 Categories tested, each as a paired German and English prompt (8 prompts total)" |
| two engines answered in German, nothing usable in English | callout: "Gemini and Meta AI both gave rich, multi-brand answers in German, but when asked the identical question in English, both returned nothing usable at all" |
| `4 VON 4 EINIG.` / `4 OF 4 AGREED.` in German | consensus table: "4 of 4 (German)" |
| `KEIN KONSENS.` / `NO AGREEMENT.` in both languages | table row "No consensus leader / N/A"; checklist 3: "zero cross-engine agreement in either language" |
| `SICHTBARKEIT HÄNGT AN DER SPRACHE` / `VISIBILITY TRACKS THE LANGUAGE` | hero: "a real, measurable gap in how AI engines treat a market depending on the language you approach it in" |
| `einmal messen reicht nicht` / `Measuring once is not enough` | checklist 4: "Re-run this regularly, not once" |
| `PRÜFEN SIE BEIDE SPRACHEN` / `CHECK BOTH LANGUAGES` | checklist 1: "Check your visibility in both German and English" |

`4 VON 4` is the only figure on screen. It was measured by BrandGEO's own
collection pipeline and published on a dated BrandGEO page, so it passes the
provenance test as applied to the FIGURE rather than to the page it sits in. It
is not a borrowed third-party statistic.

**Which two engines went blank in English is deliberately not named.** They are
engines, so naming them would be permitted. It is withheld because a
2026-07-10 result about one engine's English coverage would read on a feed as a
current statement about that engine, and the finding does not need it: "two of
the four, same question, same engine" carries the whole point.

**The categories are not named either.** "Accounting software" and "employment
lawyers" are categories rather than parties and would have been safe, but
naming the category makes the reader one step from the brand that won it, and
the brand is a measured subject.

### No measured subject is named

The page names five: Lexware, Lexoffice, Personio, Charité, Helios Klinikum
Berlin-Buch. None appears in either cut. Enforcement is mechanical, see below.

---

## Compliance scan, on the drawn bytes

Every `drawtext` in this build writes its string to its own UTF-8 file and
references it with `textfile=`. The scanner parses `textfile='...'` back out of
the 34 filtergraph files that were handed to ffmpeg and reads those files, so it
checks the exact bytes ffmpeg drew, not the copy module and not this document.

86 drawn strings per cut, 39 unique per cut, exit 0.

```
[berlin-de] engines drawn: ['claude', 'gemini', 'meta ai', 'perplexity']
            non-ASCII drawn: U+00C4 Ä, U+00DC Ü, U+00DF ß, U+00E4 ä
            judgement flags: ['kein', 'nichts']
[berlin-en] engines drawn: ['claude', 'gemini', 'meta ai', 'perplexity']
            non-ASCII drawn: (none)
            judgement flags: ['no ', 'not ']
```

**Non-ASCII is expected and correct in the German cut.** Only the dash
codepoints are banned: em U+2014, en U+2013, figure U+2012, minus U+2212,
horizontal bar U+2015. `KI-SYSTEME` uses U+002D hyphen-minus, which is not one
of them.

**The judgement flags were adjudicated, not auto-rewritten.** `KEIN KONSENS.`,
`NICHTS BRAUCHBARES.`, `NO AGREEMENT.` and `Measuring once is not enough.` all
describe a measured outcome or a property of the method. None quantifies over
people or businesses, so none is a universal in the sense the rule bans. Had any
read "niemand" or "nobody", it would have been rewritten.

### The measured-subject matcher folds, it does not compare raw bytes

A raw-byte match is worthless on German copy. `Engel & Völkers`,
`Engel & Volkers` and `Engel & Voelkers` are one company and only the first
would have fired. The corpus is harvested mechanically from the
`Top AI-visible name(s)` column of all 37 `ai-visibility-for-*.html` pages, 218
names, and both sides of the comparison are folded:

```
lowercase
eszett -> ss                          Weiß      -> weiss
NFKD, drop combining marks            Völkers   -> volkers
collapse ae/oe/ue -> a/o/u            Voelkers  -> volkers
keep [a-z0-9] only                    drops spaces, &, punctuation
```

The `ae/oe/ue` collapse is the step NFKD alone cannot do, because the German
transliterations are separate letters rather than decomposed forms. It unifies
`Müller`, `Mueller` and `Muller` to `muller`.

Prose cells were tried as a corpus source and dropped: they yield sentence
fragments such as `Categories` and `Business`, and `Categories` collides with
this build's own `FOUR CATEGORIES.` Every Berlin subject appears in the result
column anyway.

### Negative control: 37 injections, all caught

Before trusting the scan, each rule had the thing it is supposed to catch
injected into a file the scanner actually reads, then the file was restored and
the scan re-run to exit 0.

```
em dash / en dash / minus sign                         CAUGHT
banned style word (seamless)                           CAUGHT
superlative, English (first) and German (beste)        CAUGHT
universal, English (nobody) and German (niemand)       CAUGHT
out-of-run engine (ChatGPT), today's lineup            CAUGHT
engine lineup, Perplexity removed                      CAUGHT
collection date, both occurrences removed              CAUGHT
measured subjects, 25 injections across 8 names in
  every spelling each name admits: as published,
  diacritic stripped, ae/oe/ue transliterated,
  uppercase, uppercase stripped                        CAUGHT
```

The subject injections include the exact case that motivated the fix:
`Engel & Völkers`, `Engel & Volkers` and `Engel & Voelkers` all fire, as do
`Charité`/`Charite`, `Hôtel du Petit Moulin`/`Hotel du Petit Moulin` and
`Société Générale Private Banking`/`Societe Generale Private Banking`.

**The control caught a bug in itself, which is the point of running it.** The
first version blanked ONE occurrence of the collection date and reported the
date check as a miss. The date is drawn in two distinct strings per cut, so
removing one leaves the guarantee intact and the check was right to stay
silent. The control now removes all occurrences, and separately confirms the
check is correctly silent when only one of the two is restored.

---

## Glyph render verification

This is the failure mode the task called out: `drawtext` with a font missing a
glyph draws a filled `.notdef` box and exits 0. "ffmpeg succeeded" proves
nothing.

### What a missing glyph looks like in this font, measured first

Three codepoints Inter certainly does not have were rendered at 200pt through
the identical path:

```
U+E000     ink 12001  box (92,158,80,301)  fill 0.807
U+E001     ink 12001  box (92,158,80,301)  fill 0.807
U+10FFFD   ink 12001  box (92,158,80,301)  fill 0.807
```

Byte-identical for all three: a solid 67x222 rectangle, fill 0.807. That is the
signature to rule out.

### The seven German characters, at 200pt, against their base letters

```
U+00C4 Ä  ink 13031  fill 0.471   base A  ink 11433   identical to base: False
U+00D6 Ö  ink 13515  fill 0.507   base O  ink 11891   identical to base: False
U+00DC Ü  ink 12658  fill 0.533   base U  ink 11034   identical to base: False
U+00E4 ä  ink  9924  fill 0.630   base a  ink  8303   identical to base: False
U+00F6 ö  ink  9854  fill 0.574   base o  ink  8230   identical to base: False
U+00FC ü  ink  9996  fill 0.610   base u  ink  8372   identical to base: False
U+00DF ß  ink 11877  fill 0.686   base s  ink  7697   identical to base: False
```

None matches the tofu signature and none is a duplicate of its base letter.

### Then verified on the DELIVERED mp4, not on an intermediate

Four lines were located inside frames decoded out of `berlin-de-silent.mp4` and
matched against standalone reference renders.

```
scene 16 frame 675  'HÄNGT AN DER'                            U+00C4
   whole line vs correct reference       IoU 0.9675
   whole line vs tofu-substituted        IoU 0.4682
   isolated glyph Ä at frame x 186..238, box 50x64
      fill 0.493   full-width rows 0 of 64   solid rectangle: False

scene 17 frame 807  'PRÜFEN SIE BEIDE'                        U+00DC
   whole line vs correct reference       IoU 0.9487
   whole line vs tofu-substituted        IoU 0.6116
   isolated glyph Ü at frame x 226..271, box 45x65
      fill 0.532   full-width rows 0 of 65   solid rectangle: False

scene 16 frame 675  'Das heißt: einmal messen reicht nicht.'  U+00DF
   whole line vs correct reference       IoU 0.9028
   whole line vs tofu-substituted        IoU 0.7079
   isolated glyph ß at frame x 259..280, box 21x26
      fill 0.537   full-width rows 0 of 26   solid rectangle: False

scene 09 frame 219  'Heute läuft es nicht mehr mit.'          U+00E4
   whole line vs correct reference       IoU 0.8878
   whole line vs tofu-substituted        IoU 0.4646
   isolated glyph ä at frame x 252..272, box 20x26
      fill 0.563   full-width rows 0 of 26   solid rectangle: False
```

**The whole-line comparison alone is weak evidence and was not relied on.**
Substituting one character in a 37-character line leaves most of the line
intact, which is why the ß case still scores 0.71 against a tofu reference. The
decisive stage isolates the glyph's own columns, bracketed by the ink width of
the prefix before it and the prefix including it, and measures fill and
solidity there. Every glyph measures fill 0.49 to 0.56 with zero full-width
rows, against the tofu signature of 0.807 and 100 percent full-width rows.

### Diaeresis shape, and a threshold trap

A diaeresis is two dots over a letter, so its own column window must show ink,
a gap, then the body. Swept:

```
Ä  thr  11  ink11 GAP1 ink52      thr 40..160  ink10 GAP4 ink49
Ü  thr  11  ink65 (no gap)        thr 40..160  ink10 GAP5 ink50
ä  thr  11  ink4  GAP1 ink21      thr 40..160  ink4  GAP3 ink19
```

At threshold 11, two above the canvas, the antialiased skirt bridges a gap that
is about one pixel at 66pt, and the Ü reads as one solid band. That is a
measurement artefact, not a render fault: the gap opens at every threshold from
40 up and its width is then constant to 160. A missing glyph would be solid at
every threshold.

---

## Safe-zone measurement

The **tightest** reserve across the four platforms was used so one master serves
all of them: **200px top, 360px bottom, 200px right**. Usable box is
`y 200..1559`, `x ..879`. Every number comes from frames decoded out of the
DELIVERED mp4 files.

### Ink threshold, argued from a measured control

```
text-free control, identical pipeline:  gray min 9  max 9   (only value: 9)
colours deliberately drawn, BT.601 luma:
   rail track   #1B1D2B   30.0
   label rule   #7C3AED   98.1
   rail fill    #8B5CF6  123.6
   gloss        #9BA1AC  160.5
   accent text  #A78BFA  160.0
   ink          #E8E9ED  233.2
-> threshold 11, two above the control peak
```

The background is one flat value with zero variance, so 10 to 29 is empty.
Threshold 11 sits just above the canvas rather than in the middle of the gap,
so every antialiased skirt is counted and the reported box can only be larger
than the design box, never smaller.

Identical control for both cuts, because the canvas and the pipeline are
identical and only the drawn content differs.

### Method A, absolute gray threshold, all 900 frames, swept

```
GERMAN                                 ENGLISH
thr  11   x 100..790  y 260..1472      thr  11   x 100..779  y 260..1472   <- reported
thr  15   x 100..789  y 260..1471      thr  15   x 100..777  y 260..1471
thr  20   x 100..789  y 260..1471      thr  20   x 100..777  y 260..1471
thr  40   x 100..789  y 260..1471      thr  40   x 100..777  y 260..1471
thr  60   x 100..789  y 260..1471      thr  60   x 100..777  y 260..1471
thr  96   x 100..789  y 260..1471      thr  96   x 100..777  y 260..1471
thr 150   x 142..788  y 460..1471      thr 150   x 141..776  y 460..1471
```

One or two pixels of movement between 11 and 15, then nothing at all up to 96,
including at 96 where the rail track at luma 30 drops out entirely and the left
edge does not move. At 150 the rail and the label rule are gone by design,
which is why the left edge jumps to the type column. Nothing in the layout
depends on where the threshold sits.

### Method B, diff against a text-free control, with a measured noise floor

The control is a flat canvas pushed through the **identical** encode: numbered
frame sequence at `-framerate 30`, `libx264 -preset slow -crf 18`,
`-profile:v high -level 4.0`, `yuv420p`, same 900 frames. It carries the same
codec artefacts. The floor was measured in three regions empty by design, on all
17 scene midpoints, before any threshold was chosen:

```
y1600..1900  (below every drawn element)     max |delta| = 0
x900..1079   (right of the text column)      max |delta| = 0
y0..230      (above the rail)                max |delta| = 0
-> diff threshold 1, one above the measured floor
```

The floor really is zero on both cuts. That is worth stating rather than
assuming, because an earlier run in this campaign measured 7 in the same test;
the difference is content density, and this canvas is flat with sparse ink, so
x264 at crf 18 reproduces the empty regions bit-exactly.

```
GERMAN   method B   x 94..791  y 256..1479
ENGLISH  method B   x 94..779  y 256..1479
```

B runs about 6px wider on the left and 7px lower than A, because single-channel
fringing survives an RGB max-channel comparison and is averaged away by the
gray conversion. **B is taken wherever it is larger.** It is confirmed to be
measuring ink rather than a codec artefact: it does not touch the frame edge on
any side, which is the signature of the yuv420p row-0 artefact that produced a
false failure earlier in this campaign.

### Method C, declared rects, for what no pixel method can see

43 rects per cut recorded at draw time: the rail track, 17 rail fills, the
label rules, and the logo overlay.

```
both cuts   method C   x 100..339  y 260..1399
```

Inside both measured boxes. The overlay `y` is 1010, already even, so the
`overlay`-rounds-an-odd-`y`-down trap cannot bite and the declared rect equals
the effective rect. This build has no dark-on-dark element: the dimmest thing
drawn is the rail track at luma 30 against a canvas of 9, a 21-step separation
both pixel methods resolve. The declared union is a redundancy here rather than
the only witness, which is the desired state.

### Reported box, union of all three methods

```
                    GERMAN                    ENGLISH
UNION          x  94..791  y 256..1479    x  94..779  y 256..1479
limits         x    ..879  y 200..1559    x    ..879  y 200..1559
headroom top        56px                       56px
headroom bottom     80px                       80px
headroom right      88px                      100px
verdict        ALL 900 FRAMES INSIDE      ALL 900 FRAMES INSIDE
```

Every edge clears the 20px minimum by at least a factor of 2.8. `verify.py`
exits non-zero if any edge falls under 20.

### Widest TYPE extent, which is what a copy edit moves

Same threshold with the left rail (`x < 140`), the bottom wordmark
(`y >= 1440`) and the logo card (`x 140..272, y 1010..1142`) excluded:

```
GERMAN   TYPE  x 140..790  y 460..1223     type right headroom  89px
ENGLISH  TYPE  x 140..779  y 460..1223     type right headroom 100px
```

**The union and the type box differ, and the type owns the right edge.** Union
`x0` is 94 (the rail, found by the RGB method) against type `x0` of 140, and
union `y` spans 256..1479 against type 460..1223. So the furniture sets the
left, top and bottom, and the copy sets the right, which is the edge a longer
line would move. If the two boxes never differed, the measurement would carry
no headroom information and a longer line could fail silently.

The German cut runs 11px wider than the English at the type's right edge, which
is the German-first budgeting showing up in the delivered file: German words
are longer, German set the size, and English inherited it with slack.

### Scene boundaries

Designed cuts are at frames 12, 26, 50, 70, 90, 110, 136, 182, 256, 312, 374,
434, 512, 574, 636, 714, identical for both cuts. All 900 frames are decoded
sequentially in ONE pass and indexed; `-ss` is not used to sample near a cut.

Ink-count step detection, swept:

```
          GERMAN                            ENGLISH
thr  11   17 detected, 1 spurious (250)     17 detected, 1 spurious (250)
thr  40   16 detected, EXACT                16 detected, EXACT
thr  90   16 detected, EXACT                15 detected, 256 missed
thr 150   14 detected, 256 and 512 missed   16 detected, EXACT
```

**This is the detector, not the render, and the sweep is what proves it.** A
render fault cannot come and go with the measurement threshold, and this one
does: German is exact at 40 and 90 and drops two at 150, English is exact at 40
and 150 and drops one at 90. The mechanism is that an ink-count detector is
blind whenever two adjacent scenes happen to carry a similar ink TOTAL, and
which pairs collide depends on which colours the threshold admits.

**The load-bearing observation: no cut is ever detected at the WRONG frame.**
Across all eight threshold runs, every detected boundary except the single
spurious 250 at threshold 11 sits exactly on a designed frame. The failure mode
is omission, never displacement, so there is no timeline drift to explain.

### Independent boundary detector, frame-difference

Because an ink-count detector answers the wrong question, a second detector was
run that asks how much the PICTURE changed between consecutive frames. Within a
scene every frame is the same PNG, so the only difference is quantisation noise;
at a cut it is the whole layout. Frame hashing would not work here, since
identical pictures get different noise, but the MAGNITUDE separates the two
cases by orders of magnitude. The threshold is not chosen: it is placed in the
largest gap in the sorted difference values, and the gap is printed.

```
                                        GERMAN      ENGLISH
intra-scene changed-pixel count, max         14            1
smallest real cut changed-pixel count      2381         2381
largest RATIO gap                          170x        2381x
-> threshold                                188           68
detected 16 cuts, designed 16, identical:  True         True
stable across the whole gap (5% to 95%):   True         True
intra-scene, cuts excluded: mean         0.0170       0.0011
                            max              14            1
                            nonzero    2 of 883     1 of 883
```

Changed pixels at each designed cut:

```
GERMAN   39139 67371 55407  2381  2680  3323 15686  7633
         72465 42903 56929 53452 67976 58389 62703 68252
ENGLISH  40298 66293 52507  2381  2680  3323 14194  5782
         67106 37946 50502 46086 60922 56857 55139 59112
```

**All 16 boundaries land on the exact designed frame in both cuts**, and the
answer does not move anywhere in the gap. The intra-scene floor is 14 changed
pixels in German and 1 in English, against a smallest real cut of 2381: a
separation of 170x and 2381x. Within a scene, 881 of 883 frame pairs differ by
literally zero pixels above the magnitude gate.

**Two wrong versions of this detector were built and thrown away before this
one, and both failed in the way the campaign brief warns about: uniformly, so
they looked like a render defect rather than a measurement fault.**

1. *Mean absolute difference over the frame.* Found 11 of 16, missing exactly
   the five card build-up scenes. The mean is dominated by frame AREA, so
   adding one engine row to an otherwise identical card moved it by 0.2 while
   intra-scene quantisation noise at a keyframe reached 1.6. The measure could
   not distinguish a real small change from noise.
2. *Changed-pixel count with the threshold at the largest ABSOLUTE gap.* The
   measure was now right, but the threshold rule was not: this quantity spans
   orders of magnitude, so the largest absolute gap fell between the small cuts
   (~2.4k) and the large ones (~39k), splitting the cuts instead of separating
   cuts from noise. Still 11 of 16, with an apparently well-justified threshold.

The fix is the largest RATIO gap, which is scale-free. The tell that both
failures were the detector and not the render: **the same five cuts went
missing in both cuts of the pair, at identical frame indices, with identical
changed-pixel counts of 2381, 2680 and 3323 in German and English alike.** Two
independently written videos cannot share a render fault that precisely; they
can trivially share a measurement fault.

---

## Duration and stream integrity, exact ffprobe of the DELIVERED files

A mux can exit 0 and be unreadable, so every delivered file was probed rather
than assumed from the exit status.

```
berlin-de-silent.mp4   format 30.000000   nb_streams 1
                       video  30.000000   900 frames   1080x1920 yuv420p h264
berlin-de-scored.mp4   format 30.000000   nb_streams 2
                       video  30.000000   900 frames   1080x1920 yuv420p h264
                       audio  30.000000  1408 frames   48000Hz 2ch aac

berlin-en-silent.mp4   format 30.000000   nb_streams 1
                       video  30.000000   900 frames   1080x1920 yuv420p h264
berlin-en-scored.mp4   format 30.000000   nb_streams 2
                       video  30.000000   900 frames   1080x1920 yuv420p h264
                       audio  30.000000  1408 frames   48000Hz 2ch aac
```

**30.000000s each**, inside the 25 to 35s target. 900 frames at 30fps is
exactly 30.000s with no rounding anywhere, because the timeline is a numbered
frame sequence rather than a duration list.

**Both silent masters have zero audio streams**, not a silent audio track.
`nb_streams=1` is what `-an` buys.

**Neither scored cut drifted.** Video and audio stream durations both read
30.000000; `-shortest` pins the trailing 1024-sample AAC quantisation tail out
of the stream duration rather than letting it extend the container.

**The video is stream-copied into each scored variant**, so every picture
measurement above holds for the scored cuts too. Full video-stream MD5:

```
berlin-de  silent and scored both  f36c99358ce10397d02b8ea76034a924
berlin-en  silent and scored both  e3c8ad350a962d85c2f88913aacdc5c8
```

## Covers

Each cover is the literal first frame, extracted from the encoded master, then
compared to frame 0 of that master as raw rgb24:

```
berlin-de-cover.png  and frame 0    75d5792391261534e3daa7643c1893b5
berlin-en-cover.png  and frame 0    2934c7ed9b7d6ee4121fe93701a67dca
```

Byte-identical in both cases.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build.
Frame 0 measures 26,391 ink pixels in German and 26,466 in English; a faded
frame 0 would measure 0. The thumbnail the feed picks up is `DIESELBE FRAGE.`
and `SAME QUESTION.` at full opacity.

## Audio, measured on the DELIVERED scored files

```
                                   GERMAN      ENGLISH     required
first 64 samples, peak |amplitude| 0.001870    0.001870    < 0.005   OK
last 64 samples, peak              0.000000    0.000000    fade lands on silence
whole-file peak                    0.614760    0.614760
delivered integrated loudness      -16.02      -16.02      LUFS
delivered true peak                -4.21       -4.21       dBTP
delivered LRA                      3.60        3.60        LU
```

First eight left-channel samples, both files:

```
0.000128  0.000157  0.000163  0.000183  0.000252  0.000279  0.000285  0.000330
```

The two cuts are bit-identical in audio because the same 30.000s excerpt of the
same source is used for both, which is deliberate: the language is the variable
under test, so varying the bed would leave a result with two explanations.

Integrated lands at -16.02 LUFS, 0.02 LU off target after AAC encoding. True
peak is -4.21 dBTP, well under the -1.5 ceiling rather than at it: `linear=true`
applies one flat gain, so the peak falls wherever the integrated target puts it.
-1.5 is a ceiling not to exceed, so this is compliant with 2.7 dB spare.
Single-pass was not used; pass 1 shows it would have landed at -14.89.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed via
`scripts/compose_music.py`, owned outright, cleared for commercial use
including paid advertising, and carrying **no attribution line**
(`assets/audio/ATTRIBUTION.md` line 65). 60.000s source, 48kHz stereo, C minor
at 100 BPM. Nothing was downloaded and nothing was synthesized for these cuts.

Trimmed to 30.000s, **0.08s fade in** and **1.5s fade out** starting at 28.5s.
The fade in is mandatory rather than cosmetic: the source is already at 0.195
peak inside its first 0.1s, so starting playback at sample 0 would click.

Loudness, two-pass `loudnorm` with `linear=true`, identical for both cuts
because the source excerpt is identical:

```
pass 1 measured:   I -16.20   TP -4.41   LRA 3.60   thresh -26.25   offset -1.11
pass 2 applied:    linear=true, I=-16, TP=-1.5, LRA=11
```

**Honest read: nobody has listened to either file.** Everything above is
measurement. LRA is 3.60 LU over this 30s window against 6.80 LU over the full
60s track, so the excerpt is less dynamic than the whole piece. The mix is
centre-dominant, side-to-mid -11.2 dB, so it will not read as wide on a phone
speaker. Cuts are driven by reading time and the track runs at a fixed 100 BPM,
so picture and music are not locked; where they agree it is coincidence.

---

## Commands

Fonts are referenced by bare filename with ffmpeg's cwd set to the build folder.
Load-bearing on Windows: a drive-letter colon inside a filtergraph option value
terminates the option even when quoted, so `fontfile=C:/...` fails to parse.

**1. Type fitter, German first.** Every unique German headline is rendered alone
at 100pt and its real ink width read off a decoded frame; the largest size on
the ladder 78/72/66/60/54/48 whose widest line fits the 680px column is taken.
The English cut then reuses that size so the pair stays visually comparable.

```
ffmpeg -hide_banner -loglevel error -y -f lavfi -i color=c=0x090A0F:s=2600x400 \
  -/filter_complex probe_g.txt -map "[out]" -frames:v 1 \
  -f rawvideo -pix_fmt gray -
```

```
widest German at 100pt   979px   ZWEI ANTWORTEN.
78pt -> predicted 763.6px   over budget
72pt -> predicted 704.9px   over budget
66pt -> predicted 646.1px   FITS      <- chosen
re-measured at 66pt: widest real German 646px, widest real English 634px
```

Point-size scaling of a hinted TTF is not exactly linear, so every line was
re-rendered at 66pt and re-measured rather than trusted to the scaling.

**A first pass chose 66pt on a different line and was rejected.** German
`KEINE ÜBEREINSTIMMUNG.` measured 679px against the 680px budget, a one-pixel
margin, which is the paper-pass pattern the brief warns about. It was rewritten
to `KEIN KONSENS.`, which is better German anyway, and the binding line moved to
`ZWEI ANTWORTEN.` at 646px with 34px of slack.

**2. Scene stills**, one PNG per scene, 17 per cut:

```
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i color=c=0x090A0F:s=1080x1920 \
  -/filter_complex scenes_berlin-de/g09.txt -map "[out]" \
  -frames:v 1 -update 1 -pix_fmt rgb24 scenes_berlin-de/s09.png
```

Scene 17 additionally takes `-i logo.png` and ends
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=140:1010[out]`. **The overlay `y`
is 1010, already even**, so the `overlay`-rounds-an-odd-`y`-down trap cannot
bite and the declared rect equals the effective rect.

The full graph body for German scene 9, verbatim from
`scenes_berlin-de/g09.txt` (newlines added for reading, the file is one line):

```
[0:v]drawbox=x=100:y=260:w=6:h=1140:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=100:y=260:w=6:h=604:color=0x8B5CF6@1:t=fill:replace=1,
drawtext=fontfile='fonts/Inter-Bold.ttf':textfile='tf/t0049.txt':x=140:y=1450:fontsize=30:fontcolor=0xA78BFA,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':textfile='tf/t0050.txt':x=140:y=460:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=140:y=510:w=200:h=4:color=0x7C3AED@1:t=fill:replace=1,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':textfile='tf/t0051.txt':x=140:y=542:fontsize=36:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':textfile='tf/t0052.txt':x=140:y=625:fontsize=44:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':textfile='tf/t0053.txt':x=140:y=703:fontsize=44:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':textfile='tf/t0054.txt':x=140:y=781:fontsize=44:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':textfile='tf/t0055.txt':x=140:y=859:fontsize=44:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-ExtraBold.ttf':textfile='tf/t0021.txt':x=140:y=975:fontsize=66:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-Medium.ttf':textfile='tf/t0056.txt':x=140:y=1093:fontsize=34:fontcolor=0x9BA1AC,
drawtext=fontfile='fonts/Inter-Medium.ttf':textfile='tf/t0057.txt':x=140:y=1141:fontsize=34:fontcolor=0x9BA1AC[out]
```

`t0049` to `t0057` and `t0021` hold `BRANDGEO`, `BERLIN`,
`ERHOBEN AM 10.07.2026`, the four engine names, `VIER KI-SYSTEME.` and the two
gloss lines. Those files are the bytes the compliance scanner reads.

`replace=1` is on **every** `drawbox`. The source is opaque RGB so blending
would have worked, but a vanished-at-alpha-0 rule is cheap enough to make
structurally impossible rather than to reason about per call.

The rail is drawn as 17 static boxes, one per scene still, each with its own
height. `drawbox` cannot animate on 8.1.2: it has no `eval` option and
evaluates `x/y/w/h` once at init, so `h='1140*t/30'` would have silently frozen
at its t=0 value.

**3. Silent master.** No ffconcat anywhere. Each scene PNG is copied into a
numbered frame sequence, `f` copies for an `f`-frame scene, so the timeline is
frame-exact by construction rather than by cumulative float durations:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i frames_berlin-de/f%05d.png \
  -vf "format=yuv420p" -frames:v 900 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an berlin-de-silent.mp4
```

`-an` is what makes this a true silent master rather than a silent audio track.

**4. Text-free control**, the same command over 900 copies of a blank canvas
PNG, so it shares every codec artefact and differs only in content.

**5. Cover**, the literal first frame of the encoded master:

```
ffmpeg -hide_banner -loglevel error -y -i berlin-de-silent.mp4 \
  -frames:v 1 -update 1 berlin-de-cover.png
```

**6. Scored cut:**

```
ffmpeg -hide_banner -loglevel error -y -i music.wav -t 30.0 \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=28.5:d=1.5" \
  -ar 48000 -c:a pcm_s24le cut_berlin-de.wav

ffmpeg -hide_banner -i cut_berlin-de.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i cut_berlin-de.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.20:measured_TP=-4.41:\
measured_LRA=3.60:measured_thresh=-26.25:offset=-1.11:linear=true" \
  -ar 48000 -c:a pcm_s24le norm_berlin-de.wav

ffmpeg -hide_banner -loglevel error -y -i berlin-de-silent.mp4 -i norm_berlin-de.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart berlin-de-scored.mp4
```

**7. Verification.** All 900 frames are decoded sequentially in ONE pass and
indexed. `-ss` is not used to sample near a cut: seeking lands on the
neighbouring scene often enough to make a boundary check meaningless.

---

## Design tokens

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, `#7C3AED` for the label
rule, `#8B5CF6` for the rail fill, `#1B1D2B` for the rail track, `#9BA1AC` for
gloss. **`#8B5CF6` is used for no text anywhere**; it measures 4.2:1 on this
canvas and fails. Inter ExtraBold 66 for headlines, SemiBold 44 for engine rows,
SemiBold 36 for the date line, SemiBold 30 for labels, Medium 34 for gloss and
the URL, Bold 30 for the wordmark. All vendored from
`docs/growth/grok-launch/images/_build/fonts/`. Logo is
`docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png` scaled to 132.
Dark only. No pricing, no plan names. TOFU, soft CTA.

### One layout mechanic worth carrying to any future non-English cut

`drawtext` aligns the **ink top** to `y`, not the baseline and not the cap top.
A line carrying an umlaut is therefore drawn about 45px lower at 200pt, 16px at
66pt, than a line without one, because the diaeresis raises the string's ink
top. Left uncorrected, `HÄNGT AN DER` would have sat 16px below
`SICHTBARKEIT` and `SPRACHE.` in the same block.

Each line is measured before it is drawn: rendered alone, its row profile
scanned for a full-width empty band near the top, and the cap-top offset
subtracted from its `y`. The correction is measured per line rather than
inferred from which characters are present, so it is right for any string.

## Open items

- Nobody has heard either scored cut. See the music section.
- The two engines that went blank in English are unnamed on purpose. If a
  fresher Berlin collection lands, a version that names them becomes defensible
  and would hit harder.
- The wrong engine lineup is published in three places on the source page: the
  `<title>`, the `og:title`, and the JSON-LD `mentions` array. The JSON-LD one
  is the worst, since it is the copy an AI engine parses. Worth its own fix.
</content>
