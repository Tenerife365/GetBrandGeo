# Paris, language divergence. French and English cuts.

Two vertical cuts of one finding, one written in French for a French business
audience and one in English. Same structure, same eleven scenes, same timings,
so the pair is comparable. No voice, no narration, no TTS: on-screen text only.

Source: `brandgeo/web/ai-visibility-for-paris.html`.
**Data collected 2026-07-10.** TOFU. Soft CTA. No pricing on screen.

---

## Files

| File | What it is |
|---|---|
| `paris-fr-silent.mp4` | French master, no audio stream at all (`nb_streams=1`). The one to upload organically. |
| `paris-fr-scored.mp4` | Same picture, video stream copied bit for bit, plus the BrandGEO track. |
| `paris-fr-cover.png` | Frame 0, extracted from the delivered master. |
| `paris-en-silent.mp4` | English master, no audio stream. |
| `paris-en-scored.mp4` | Same picture plus the track. |
| `paris-en-cover.png` | Frame 0, extracted from the delivered master. |

---

## The engine lineup on screen, and why it is what it is

**Named on screen, in both cuts: Claude, Gemini, Meta AI, Perplexity. Four
engines. Date on screen: `COLLECTED 2026-07-10` / `COLLECTE DU 10 JUILLET 2026`.**

Two disclosures are drawn rather than omitted:

- **ChatGPT is stated as absent.** `ChatGPT was not / in this run.` and
  `ChatGPT ne figurait pas / dans cette collecte.` It is never presented as part
  of the run. The source page records an account-level collection failure on
  every Paris prompt.
- **Meta AI is stated as retired.** `Meta AI was in / this run.` +
  `That engine has since / been retired.` and the French equivalent. The engine
  is named because it produced part of this record, and naming it without the
  retirement note would misdescribe today's product.

No count of engines is asserted anywhere, in either language. No plan lineup,
no "five engines", no Google AI Mode, no Copilot, no Grok. An engine count is a
claim about the lineup on the day of collection, and this lineup is not today's.

### What was deliberately NOT used from that page

The page's own headline claim is that one brand was "named the #1 recommendation
by every AI engine that returned a structured result, in both French and
English, a complete, unanimous sweep, one of the strongest single-brand results
found anywhere in this research program."

**None of that is on screen.** Two reasons, both structural:

1. "One of the strongest ... anywhere in this research program" is a
   cross-corpus superlative. The page asserting it is the one source that
   cannot verify it, and the campaign has already had to re-render twice after
   quoting a sibling page's superlative faithfully.
2. "Every AI engine that returned a structured result" hides its denominator.
   The same page's own data-quality note says Gemini and Meta both returned
   blank competitor lists on the English online-banking prompt. So the set the
   sweep quantifies over is smaller than "every engine", and the phrase makes it
   sound broader than it is.

The language-divergence finding needs neither, so the unanimity result was
dropped entirely rather than restated. The one number that IS on screen carries
its denominator explicitly: **3 of the 4 answers given in French**.

### Never name a measured subject

Every finding here is about specific named companies and **not one of those
names appears on screen.** The pattern is stated, the party never is:
`Small local / wealth advisers.` and `Large cross-border / banking groups.` and
`One firm appeared in ...`. Engine names are allowed and used; measured subjects
are not. Verified mechanically against the drawn bytes, see the scanner section.

---

## On-screen text, verbatim

Taken from the `textfile=` bytes ffmpeg consumed, not retyped. Line breaks below
are the rendered line breaks. `head` is Inter ExtraBold 68 `#E8E9ED`, `accent`
is Inter Bold 58 `#A78BFA`, `body` is Inter SemiBold 50 `#E8E9ED`, `meta` is
Inter Medium 36 `#9BA1AC`, `label` is Inter Bold 32 `#9BA1AC`.

### FRENCH, `paris-fr-silent.mp4`

Written as French, not translated from the English cut. Short declaratives, no
anglicisms where a normal French word exists, French spacing before the colon in
`En anglais : zéro.`

**1. 0.000 to 3.000 s** (last two lines accent. Hard start, no fade: this is the cover)
```
Posez la question
en français, puis
en anglais.

Les entreprises
citées changent.
```

**2. 3.000 to 6.200 s** (first line label)
```
PARIS

4 catégories.
Les deux langues.
Une seule collecte.
```

**3. 6.200 to 9.600 s** (first line label, last two meta)
```
COLLECTE DU 10 JUILLET 2026

Claude, Gemini, Meta AI,
Perplexity.

ChatGPT ne figurait pas
dans cette collecte.
```

**4. 9.600 to 12.200 s** (last two lines meta)
```
Meta AI faisait partie
de cette collecte.

Ce moteur a depuis
été retiré.
```

**5. 12.200 to 15.000 s** (first line label)
```
GESTION DE PATRIMOINE À PARIS

Le jeu de concurrents
change dès que la langue
de la question change.
```

**6. 15.000 to 17.800 s** (first line label)
```
RÉPONSES EN FRANÇAIS

Des cabinets de
gestion indépendants.
```

**7. 17.800 to 20.600 s** (first line label)
```
RÉPONSES EN ANGLAIS

De grands groupes
bancaires internationaux.
```

**8. 20.600 to 23.800 s** (last three lines accent)
```
Un même cabinet apparaît
dans 3 réponses sur 4
en français.
En anglais : zéro.
```

**9. 23.800 to 26.800 s** (last line accent)
```
Ce n'est pas le même
classement réordonné.

C'est une autre liste.
```

**10. 26.800 to 29.800 s**
```
La visibilité en français
et la visibilité en anglais
se mesurent séparément.
```

**11. 29.800 to 33.400 s** (last line accent)
```
BrandGEO mesure ce que
les IA disent de votre
marque, langue par langue.

getbrandgeo.com
```

### ENGLISH, `paris-en-silent.mp4`

**1. 0.000 to 3.000 s** (last two lines accent. Hard start, no fade: this is the cover)
```
Ask in French.
Ask in English.

Different companies
come back.
```

**2. 3.000 to 6.200 s** (first line label)
```
PARIS

4 categories.
Both languages.
One collection run.
```

**3. 6.200 to 9.600 s** (first line label, last two meta)
```
COLLECTED 2026-07-10

Claude, Gemini, Meta AI,
Perplexity.

ChatGPT was not
in this run.
```

**4. 9.600 to 12.200 s** (last two lines meta)
```
Meta AI was in
this run.

That engine has since
been retired.
```

**5. 12.200 to 15.000 s** (first line label)
```
WEALTH MANAGEMENT, PARIS

The set of competitors
changes as soon as the
question changes language.
```

**6. 15.000 to 17.800 s** (first line label)
```
FRENCH-LANGUAGE ANSWERS

Small local
wealth advisers.
```

**7. 17.800 to 20.600 s** (first line label)
```
ENGLISH-LANGUAGE ANSWERS

Large cross-border
banking groups.
```

**8. 20.600 to 23.800 s** (last three lines accent)
```
One firm appeared in
3 of the 4 answers
given in French.
In English: zero.
```

**9. 23.800 to 26.800 s** (last line accent)
```
This is not the same
ranking reordered.

It is a different list.
```

**10. 26.800 to 29.800 s**
```
French visibility and
English visibility are
two separate measurements.
```

**11. 29.800 to 33.400 s** (last line accent)
```
BrandGEO measures what
AI engines say about
your brand, language
by language.

getbrandgeo.com
```

---

## Provenance of every claim on screen

| Drawn | Source | Note |
|---|---|---|
| `4 categories.` / `Both languages.` | "4 categories, each asked once in French and once in English" | design fact, not a rate |
| `COLLECTED 2026-07-10` | page `datePublished` and "data collected 2026-07-10" | |
| `Claude, Gemini, Meta AI,` / `Perplexity.` | "the engines that returned usable results: Claude, Gemini, Meta AI, and Perplexity" | the lineup ON THE COLLECTION DATE, not today's |
| `ChatGPT was not / in this run.` | "ChatGPT's collection failed on every Paris prompt this run, a technical error" | stated as absence, never as a result |
| `That engine has since / been retired.` | `planConfig.ts:41`, Meta retired 2026-07-16 | product fact, not from the page |
| `The set of competitors / changes as soon as the / question changes language.` | "it's a genuinely different competitive set, depending only on which language the question was asked in" | |
| `Small local / wealth advisers.` | "independent, boutique French patrimoine firms" | party not named |
| `Large cross-border / banking groups.` | "converged on major international private banks" | party not named; "major" dropped |
| `One firm appeared in` / `3 of the 4 answers` / `given in French.` / `In English: zero.` | "appeared in 3 of 4 French-language responses and in zero English-language ones" | denominator stated, 4 French-language responses, one per responding engine |
| `This is not the same / ranking reordered.` / `It is a different list.` | "This isn't the same brands reordered by language" | |
| `French visibility and / English visibility are / two separate measurements.` | "being visible in French doesn't guarantee any visibility in English" | restated as a property of the method, so it asserts nothing about people |

Nothing on either asset is illustrative and nothing is framed as a measurement
that is not one.

---

## Safe zone

Tightest zone across all four platforms, so one master serves every one of them:
**200 px top, 360 px bottom, 200 px right.** Usable box is therefore
`y 200..1559`, `x .. 879`.

Measured by decoding the DELIVERED mp4s frame by frame, sequentially, no `-ss`.
Background peak luma inside three regions that are empty by design measured **9**,
and the dimmest drawn colour is the violet rail at Y ≈ 124, so thresholds of 40,
60, 90 and 130 all sit in the empty gap between them. All four agree.

| | FR union | FR type | EN union | EN type |
|---|---|---|---|---|
| box | `x 56..752  y 250..1519` | `x 97..752  y 686..1096` | `x 56..795  y 250..1519` | `x 97..795  y 716..1063` |
| top headroom | **50** | 486 | **50** | 516 |
| bottom headroom | **40** | 463 | **40** | 496 |
| right headroom | **127** | 127 | **84** | 84 |

Second method, per-frame diff against a text-free control rendered through the
identical pipeline. Noise floor measured first in the three empty-by-design
regions of the delivered file: **0 in all three**, so the diff threshold is 1.
It returns `x 55..752 y 247..1519` (FR) and `x 55..795 y 247..1519` (EN), i.e. it
finds 1 to 3 px MORE ink around the furniture than the absolute threshold does,
which is the encoder's response to content the control does not carry. Taking the
larger number on every edge:

**Worst headroom anywhere across both cuts: top 47, bottom 40, right 84.** The
floor is 20. Nothing is close to it.

The union and the type extent differ substantially (`y 250..1519` vs `686..1096`
on FR; `x0` 56 vs 97), so the layout carries real headroom information rather
than having furniture bind on every edge. **The type owns the right edge in both
cuts** (union right == type right), because the only furniture is a vertical
violet rail at `x 56..61` and a small wordmark, both hard left.

**One geometry failure was caught and fixed by this measurement.** The first
build put the rail top at y=208 and the wordmark at y=212, giving 8 px of top
headroom and 12 px of bottom. Both are under the 20 px floor, i.e. rounding
artefacts rather than margins. Rail moved to `y 250`, max length 1270, wordmark
to `y 250`, and the build was reshot.

**French set the type size, as instructed, and English then fit inside it with
84 px to spare.** Worth recording that the French cut came out NARROWER than the
English (752 vs 795): French needs more lines, not longer ones, once the copy is
written as French rather than translated. The line count per scene is what French
costs here, and the scene durations absorbed it.

---

## Glyph rendering, the French cut

This is the failure mode most likely to ship silently: `drawtext` with a font
missing a glyph emits `.notdef` and exits 0.

**Step 0, measure the failure signature first.** Five codepoints Inter genuinely
lacks (`U+E000`, `U+E001`, `U+10FFFD`, `U+4E2D`, `U+01EF`) were rendered at
size 240. All five produce a **byte-identical 81x267 box, fill 0.797,
full-row fraction 0.311, zero empty interior rows** — one distinct signature
across all five. Note Inter's `.notdef` is a HOLLOW rectangle, so "every row
full" is false for this font and the discriminator was derived from the measured
0.311 rather than from an assumed solid box.

**Font coverage.** Direct `cmap` parse of all four Inter weights: every drawn
codepoint present, 0 missing. `U+4E2D` confirmed absent (control fires). The
oe/OE ligatures are present in all four weights.

**Step 1 to 4, isolated glyphs vs the measured tofu AND vs the unaccented base.**
Each character rendered alone, because substituting one character inside a long
line leaves the line mostly intact and a line-level comparison scores high even
against tofu.

| glyph | size | fill | full-row | base | not tofu | bigger than base | structure persists over thr 20/40/60/100/150 |
|---|---|---|---|---|---|---|---|
| `é` U+00E9 | 121x187 | 0.466 | 0.102 | `e` 121x136 | yes | taller | accent gap rows 15,15,15,15,15 |
| `è` U+00E8 | 121x187 | 0.466 | 0.102 | `e` | yes | taller | 15,15,15,15,15 |
| `ê` U+00EA | 121x187 | 0.498 | 0.102 | `e` | yes | taller | 16,16,16,16,17 |
| `î` U+00EE | 65x184 | 0.464 | 0.000 | `i` 36x183 | yes | **wider** | 18,18,18,18,19 |
| `à` U+00E0 | 113x187 | 0.503 | 0.000 | `a` 113x136 | yes | taller | 15,15,15,15,15 |
| `À` U+00C0 | 162x228 | 0.363 | 0.000 | `A` 162x175 | yes | taller | 16,16,17,17,17 |
| `ç` U+00E7 | 119x182 | 0.418 | 0.000 | `c` 119x136 | yes | taller | height 182 at every thr vs base 136 |
| `Ç` U+00C7 | 153x227 | 0.368 | 0.000 | `C` 153x180 | yes | taller | height 227 at every thr vs base 180 |
| `œ` U+0153 | 217x136 | 0.578 | 0.000 | `o` 125x136 | yes | 1.74x wider | ligature renders |
| `Œ` U+0152 | 218x175 | 0.510 | 0.000 | `O` 160x180 | yes | 1.36x wider | ligature renders |

Tofu under the same sweep: **zero empty interior rows at every threshold**,
fill 0.812/0.811/0.811/0.797/0.781. Accented glyphs open a gap between the mark
and the letter that persists at every threshold from 20 upward. `î` is the one
case where height does not discriminate, because `i` already carries a tittle,
so the rule is "more ink AND larger in at least one axis" and `î` passes on
width (65 vs 36).

**Step 6, the DELIVERED file.** Frame 480 (inside scene 6, frames 450 to 533)
decoded sequentially, no `-ss`.

- delivered frame vs the ACCENTED render: **0 pixels differ** above 60. The
  delivered H.264 frame is pixel-identical to the render.
- delivered frame vs an ASCII-stripped render of the same scene: **5388 pixels
  differ**.

Per-line shape analysis, on isolated single-line renders:

| line | ascii control | mark ink | where the mark sits |
|---|---|---|---|
| `RÉPONSES EN FRANÇAIS` | `REPONSES EN FRANCAIS` | 53 px | rows 877..881, 21 px, **above the x-height top** (É acute) and rows 909..913, 23 px, **below the baseline** (Ç cedilla) |
| `Des cabinets de` | identical | n/a | no accented character, skipped |
| `gestion indépendants.` | `gestion independants.` | 47 px | rows 866..873, **above the x-height top** (é acute) |

So the cedilla renders as ink below the baseline, the acute renders as ink above
the x-height, on both a capital and a lowercase, in the delivered pipeline.

**Negative controls.** A genuinely missing codepoint run through the identical
pass FAILS the not-tofu test (`U+E000` and `U+4E2D`, fill 0.797, full-row 0.311).
A **clipped** cedilla, simulated by drawing the bare base letter, also FAILS,
which matters because a dropped combining mark does not look like tofu, it looks
like a plain `c`.

### Four false failures this check produced before it was right

Recorded because each looked exactly like a render defect.

1. **Comparing bounding boxes of two independently rendered glyphs.** Both came
   back at `y0 = 150`, the requested `drawtext` y, because drawtext anchors the
   TOP of its own text box at y and sizes that box from the actual glyph
   extents. The accent therefore appeared to move the glyph DOWN. Five of eight
   glyphs "failed".
2. **Placing the mark by the bbox of a pair diff.** A handful of antialias pixels
   at glyph edges set the extreme rows and destroyed the test.
3. **"Ink mass below the baseline >= 0.90" on C-cedilla: measured 0.848.** Inter
   redraws the C bowl slightly when the cedilla is attached, so about 15% of the
   pair residual is a thin outline around the letter itself. Real property of the
   font. A pair-residual test cannot separate that from a fault; isolating the
   glyph removes the question.
4. **An ASCII "control" that still contained the accent.** The strip table
   omitted uppercase É, so `RÉPONSES` produced no diff cluster at all and the
   check silently passed a glyph it had never tested. A control that shares the
   thing under test proves nothing.

And one real layout consequence found on the way: **an accented capital is the
tallest ink on an all-caps line, so `drawtext` lowers that whole line** by the
accent height (measured +7 px on `RÉPONSES EN FRANÇAIS`). Harmless here, both
cuts measured well inside the safe zone, but it is why the per-line diff has to
be aligned before it means anything.

---

## Compliance scanners, run on the DRAWN BYTES

Every check reads the 85 `textfile=` files ffmpeg was actually handed (42 FR,
42 EN, 1 wordmark), not the brief and not these notes.

```
measured subject (fr)        PASS
measured subject (en)        PASS
banned dashes                PASS
unexpected non-ascii         PASS   [allowed and expected in fr: À Ç É ç è é ê î]
superlative (en)             PASS
superlative (fr)             PASS
universal (en)               PASS
universal (fr)               PASS
ai-tell vocabulary           PASS
engine lineup                PASS
collection date on screen    PASS
Meta AI retirement note      PASS
```

**The non-ASCII check is NOT "zero non-ASCII".** That assertion would be wrong on
a French cut. It bans only the five dash codepoints (em `U+2014`, en `U+2013`,
figure `U+2012`, minus `U+2212`, horizontal bar `U+2015`) and allows the French
set. A Cyrillic `а` injected as a control fires; a `ç` injected as a control
correctly does not.

### Measured-subject corpus and diacritic folding

Corpus: **153 names from the result column (`td.leader`) of 37 city research
pages.** Prose cells are deliberately excluded: they yield generic tokens that
collide with legitimate copy, and a false positive there fails clean copy.

Both sides of every comparison are NFKD-normalised, combining marks stripped,
oe/ae ligatures expanded **explicitly** because normalisation alone does not
decompose them, and case-folded AFTER stripping. Demonstrated inline:
`'Cœur Patrimoine'` folds to `'coeur patrimoine'`, while NFKD alone leaves
`'cœur patrimoine'` with the ligature intact.

**One real false positive was found and fixed.** `ai-visibility-for-miami.html`
has a result cell reading `ChatGPT/Claude 2-engine match (loose)`, which
describes an engine-agreement state rather than a company. That put the token
`ChatGPT` into the corpus and made the scanner fail both cuts on an engine name
the brief explicitly allows. Allowed engine and platform names are now
subtracted from the corpus, which is the brief's own rule: the ban is on the
SUBJECT of a measurement, never on the instrument.

### Negative controls, every one fired

```
subject / accented, as published                    FIRES  Société Générale Private Banking
subject / accents stripped                          FIRES
subject / upper-cased with accents                  FIRES
subject / upper-cased, accents dropped (FR convention) FIRES
subject / lower-cased, accents stripped             FIRES
subject / NFD-decomposed                            FIRES
subject / hotel name accented                       FIRES  Hôtel du Petit Moulin
subject / hotel name unaccented                     FIRES
subject / hotel name upper-cased                    FIRES
subject / ligature  (Cœur Patrimoine)               FIRES
subject / ligature expanded (Coeur Patrimoine)      FIRES
subject / ligature upper (CŒUR PATRIMOINE)          FIRES
subject / name CONTAINING an allowed engine word    FIRES  (Google Patrimoine Conseil)
subject / bare engine name                          SILENT (correct, engines are allowed)
dash / em dash, en dash, minus sign                 FIRES
non-ascii / cyrillic а                              FIRES
non-ascii / French ç                                SILENT (correct)
superlative en  ("the best result")                 FIRES
superlative fr  ("le meilleur resultat")            FIRES
superlative fr accented ("la première place")       FIRES
universal en    ("nobody checks this")              FIRES
universal fr    ("personne ne verifie")             FIRES
ai-tell         ("a seamless workflow")             FIRES
engine lineup / extra engine ("and Google AI Mode") FIRES
engine lineup / count claim ("five engines agreed") FIRES
audio / same mux with afade=t=in removed            FIRES  first64 |max| 0.058122 vs limit 0.005
cover / fr cover vs en frame 0                      FIRES  (md5 differs)
glyph / missing codepoint U+E000, U+4E2D            FIRES
glyph / clipped cedilla drawn as bare c, C          FIRES
font  / U+4E2D absent from Inter cmap               FIRES
```

Every scanner in this run was proven to fire on the thing it exists to catch
before its clean result was believed.

---

## n-gram diff against every previous run in this campaign

Run against the prior runs' drawn text extracted from their `NOTES.md`
(fenced on-screen blocks, backticked scene strings and quoted drawn lines), not
against their prose, because their prose quotes the same source page and
inflates the overlap with text that never shipped.

```
n=3  mine=267  overlap=13  ['2026 07 10', 'about your brand', 'collected 2026 07',
                            'english language answers', 'french language answers',
                            'gestion de patrimoine', 'is not the', 'it is a', ...]
n=4  mine=273  overlap=2   ['collected 2026 07 10', 'is not the same']
n=5  mine=273  overlap=0
n=6  mine=273  overlap=0
n=7  mine=273  overlap=0
```

Clean at n=5 and above. Residual at n=4 is the collection date and one generic
connective.

**This mattered, and a first pass had to be rewritten because of it.**
`run-20260730-0613/tiktok` is already a Paris language-divergence cut and
`run-20260730-0613/youtube` covers Paris as one beat, both in English, both
about an hour before this one. The first version of these cuts collided with
them on the hook and on both language-side beats:

- `The same question. / In two languages.` against their
  `The same question, / asked twice.`
- `Asked once in French, / once in English.` against their
  `Once in French. / Once in English.`
- `IN FRENCH` / `Independent French / advisory firms.` against their
  `IN FRENCH` / `INDEPENDENT / FRENCH FIRMS.`
- `IN ENGLISH` / `International / private banks.` against their
  `IN ENGLISH` / `INTERNATIONAL / PRIVATE BANKS.`
- a later attempt at `Change the language / of the question.` against their
  `the language of the question`

All five were rewritten and both cuts re-rendered. Reading the prior notes did
not catch these; the n-gram diff did, twice, because the second rewrite
introduced a new collision of its own.

---

## Scene boundaries

Built as a numbered PNG frame sequence at `-framerate 30`, which is frame-exact
by construction. **No `ffconcat`**, so there is no cumulative float drift. Eleven
scenes, hard cuts, no fades anywhere.

Declared cuts, frames: `90, 186, 288, 366, 450, 534, 618, 714, 804, 894`.

Detected by counting ink pixels per frame over a full sequential decode and
looking for step changes. Swept over four ink thresholds AND four step gates,
because a gate set too low lets intra-scene quantisation noise exceed a real
boundary:

**All 10 declared cuts detected in 24 of 24 threshold-by-gate combinations, in
both cuts.** Only the count of SPURIOUS extra steps varies (36 down to 0 as the
gate rises from 10 to 200). The real boundary positions never move, which is the
invariant that separates a detector artefact from a render fault. At ink
threshold 70 or 170 with a gate of 40, and at any threshold with a gate of 200,
the detector returns exactly the 10 declared cuts and nothing else.

---

## Covers

Extracted FROM the delivered master, not rendered separately, so the check is
meaningful rather than circular.

```
fr  cover / silent frame0 / scored frame0   md5(raw rgb24)  ce6586b82a...  IDENTICAL
en  cover / silent frame0 / scored frame0   md5(raw rgb24)  256d1182a7...  IDENTICAL
negative control: fr cover vs en frame 0                                   DIFFER
```

Scene 1 hard-starts at full opacity, so frame 0 is the real first frame and the
cover is not a blank rectangle.

---

## Audio

`assets/audio/music/tension-minor.wav`, BrandGEO-composed, cleared for commercial
use, no attribution line. Trimmed to 33.4 s, two-pass `loudnorm` to
-16 LUFS / -1.5 dBTP (`measured_I=-15.94 measured_TP=-4.41 measured_LRA=3.50
measured_thresh=-25.94 offset=-1.12 linear=true`), resampled back to 48 kHz,
**then** faded, so normalisation cannot undo the fade.

`afade=t=in:st=0:d=0.08` and `afade=t=out:st=31.9:d=1.5`.

| file | first 64 samples \|max\| | rms of first 64 | peak | \|max\| in last 0.25 s |
|---|---|---|---|---|
| `paris-fr-scored.mp4` | **0.002644** | 0.001273 | 0.5969 | 0.045088 |
| `paris-en-scored.mp4` | **0.002644** | 0.001273 | 0.5969 | 0.045088 |

Limit is 0.005. Negative control: the identical mux with `afade=t=in` removed
gives **0.058122**, more than ten times the limit, so the check is real.

The track does not start at zero, which is why the fade-in is mandatory rather
than cosmetic.

**How it sounds, honestly.** A minor-key tension bed: sparse, slightly uneasy,
built to sit under text rather than carry the piece. It suits a finding about
something being wrong with your visibility. It is not a hook and it will not
compete with an in-app track. The silent master remains the one to post
organically; the scored cut is for paid, embeds and decks.

---

## ffprobe, DELIVERED files

A mux can exit 0 and be unreadable, so every delivered file was probed after
copying into this folder.

| file | streams | duration | video | audio |
|---|---|---|---|---|
| `paris-fr-silent.mp4` | 1 | 33.400000 | h264 1080x1920 yuv420p 30/1, 1002 frames | none |
| `paris-fr-scored.mp4` | 2 | 33.400000 | h264 1080x1920 yuv420p 30/1, 1002 frames | aac 48000 Hz stereo, 1567 frames |
| `paris-en-silent.mp4` | 1 | 33.400000 | h264 1080x1920 yuv420p 30/1, 1002 frames | none |
| `paris-en-scored.mp4` | 2 | 33.400000 | h264 1080x1920 yuv420p 30/1, 1002 frames | aac 48000 Hz stereo, 1567 frames |
| `paris-fr-cover.png` | | | 1080x1920 rgb24 | |
| `paris-en-cover.png` | | | 1080x1920 rgb24 | |

Both containers report exactly 33.400000 s. `-shortest` trimmed the AAC tail, so
the scored cuts do not run past the video.

The scored video streams are **byte-identical** to the silent ones
(`md5(raw yuv420p)` matches: fr `465d8a5b9e68...`, en `474d7e82ddc1...`), confirming
`-c:v copy` re-muxed rather than re-encoded.

---

## Exact commands

Scene PNG (one opaque render per scene, so no alpha layer exists and none of the
`format=rgba` / `colorchannelmixer` / `drawbox replace=1` alpha traps apply):

```
ffmpeg -y -f lavfi -i color=c=0x090A0F:s=1080x1920:d=1 -frames:v 1 -vf \
 "drawbox=x=56:y=250:w=6:h=<RAIL>:color=0x8B5CF6@1:t=fill:replace=1,\
  drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=tf/wordmark.txt:fontcolor=0xA78BFA:fontsize=30:x=96:y=250,\
  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=tf/<lang>_s<NN>_l<NN>.txt:fontcolor=0xE8E9ED:fontsize=50:x=96:y=<Y>" \
 -pix_fmt rgb24 scenes/sNN.png
```

The rail is drawn as one static box per scene, at a length proportional to
elapsed frames, so it advances across the cut without `drawbox` ever needing to
animate. `drawbox` cannot animate on ffmpeg 8.1.2: it has no `eval` option and
evaluates `x/y/w/h` once at init, so an expression would render frozen at its
t=0 value with no warning.

Master:

```
ffmpeg -y -framerate 30 -i frames/%06d.png -c:v libx264 -preset medium -crf 18 \
 -pix_fmt yuv420p -movflags +faststart paris-<lang>-silent.mp4
```

Cover:

```
ffmpeg -y -i paris-<lang>-silent.mp4 -vf "select=eq(n\,0)" -frames:v 1 -update 1 \
 paris-<lang>-cover.png
```

Scored:

```
ffmpeg -y -i paris-<lang>-silent.mp4 -i tension-minor.wav -filter_complex \
 "[1:a]atrim=0:33.4,asetpts=N/SR/TB,\
  loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-15.94:measured_TP=-4.41:\
measured_LRA=3.50:measured_thresh=-25.94:offset=-1.12:linear=true,\
  aresample=48000,afade=t=in:st=0:d=0.08,afade=t=out:st=31.9:d=1.5[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
 -shortest paris-<lang>-scored.mp4
```

---

## Open items for whoever picks this up

1. **This finding has now shipped three times in ~2 hours** (run 0613 TikTok,
   run 0613 YouTube as one beat, and this bilingual pair). The French cut is
   genuinely new inventory; the English one is the third English treatment of
   the same Paris data. Worth deciding whether the English cut ships at all, or
   whether the French cut ships alone as the thing that does not already exist.
2. **The French cut is the asset with no substitute.** If only one goes out,
   send `paris-fr-silent.mp4`.
3. `ai-visibility-for-miami.html` has a result-column cell,
   `ChatGPT/Claude 2-engine match (loose)`, that is an engine-agreement state
   sitting in a column otherwise holding company names. It poisons any harvester
   that reads that column. Worth fixing on the page rather than working around
   it in every scanner.
4. The Paris page's own unanimity claim carries an unverifiable cross-corpus
   superlative and a hidden denominator, both described above. It is still live
   on the site and in that page's FAQPage JSON-LD.
