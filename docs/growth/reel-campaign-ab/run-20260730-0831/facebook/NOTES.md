# Facebook Reel, run 20260730-0831

Built with ffmpeg 8.1.2 directly, node v24.16.0 and numpy 2.4.6. Remotion is not
installed and nothing was installed. Nothing here has been posted or scheduled.
No git command was run. Nothing outside this folder was written.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master. Zero audio streams**, not a muted one. Pair with a track from Facebook's in-app music library. |
| `facebook-scored.mp4` | Identical video bitstream plus the BrandGEO-composed track `tension-minor`. For paid, site embeds and decks. |
| `facebook-cover.png` | 1080x1920 cover. Verified byte-identical to frame 0 of the master at the final delivery path. |

```
facebook-silent.mp4  md5 6270d520ffa1ebb4ca4e4324525e5b71
facebook-scored.mp4  md5 71fc9d48af7b00e5f711c42ea28e9c9e
facebook-cover.png   md5 0f0be2724ecb934f3c33c5dbe0305f90
```

---

## Hook driver

**#4, contrarian, SECOND PASS.** "Ranking first in Google does not mean you
exist in an AI answer."

The first pass is `run-20260730-0113/facebook/`. This run exists to separate
"the contrarian driver works" from "that particular cut worked", so the whole
point is that the execution differs structurally rather than in wording. Its
`NOTES.md` was read in full before a line of this one was written.

### How this cut differs from run 0113, structurally

| | run 0113 | this run |
|---|---|---|
| **Argument order** | belief first, then disagreement, then evidence | mechanism first, the belief never stated, the contradiction arrives at beat 3 as a **consequence** |
| **Beat 1** | the search-versus-AI-answer contrast, stated outright | how an AI engine assembles an answer. No contrast, no comparison, no second term |
| **Evidence class** | one client audit with counts: three engines, twenty questions, zero appearances | no result set at all. Only how the answer is built and how it has to be checked |
| **Numbers on screen** | four (three, twenty, one, zero, spelled as words) | **none.** Not a digit, not a number word, no denominator, no count of anything |
| **Named platform** | Google, three times | none. The claim is carried by "your search position", so no platform is named anywhere |
| **Close** | a concession beat, "Google still works. It just measures something else." | no concession. It ends on what the viewer can do, which makes the last beat a soft CTA rather than a hedge |
| **Beat count / runtime** | 6 beats, 28.000 s | **5 beats, 25.400 s** |
| **Composition** | lockup bottom-left, short horizontal accent rule above the type | **lockup top-left**, vertical accent rail down the left of the type, type block anchored low |
| **Which edges the safe zone tests** | bottom and top were both furniture-bound; only the right edge tested the copy | **bottom and right are both type-bound.** Two of three edges now move when the copy is edited, see the safe-zone section |
| **Wordmark** | drawn as `drawtext` text | the shipped **wordmark artwork** from `_shared/logo/`, so the cut carries the real lockup |

Two things run 0113 did are banned this round and neither appears here:

1. **The search-ranking-versus-AI-answer contrast is not the first beat.** It is
   not in beat 1 or beat 2 at all. Beat 1 and beat 2 describe only how an AI
   answer is assembled. The contradiction lands in beat 3, and it lands as a
   consequence of beats 1 and 2 rather than as an assertion the viewer is
   invited to argue with.
2. **`bg-004` is not used, in any form.** Its "#1 on three AI engines" figure
   does not appear, and neither does its twenty-questions count, its zero-on-one-engine
   count, or its page-one framing. The page is not cited anywhere in this build.
   Independent of the instruction, it could not have been used correctly: its
   body names **Microsoft Copilot** among its five engines and its methodology
   names retired **Meta AI**, so its engine set cannot be stated against today's
   lineup at all. Run 0113 handled that by stating no denominator; this cut goes
   further and states no count of anything, which removes the trap rather than
   working around it.

**Facebook-native treatment.** Plainest of the four platforms: short
declaratives, no rhetorical structure, no wordplay, no antithesis, no category
vocabulary. No "GEO", no "AI visibility", no "generative engine", no "SERP", no
"ranking" as a noun. Longest sentence on screen is nine words. Five beats over
25.4 s, and the last beat gets 5.8 s rather than the 4.6 s the middle beats get,
so the domain has time to land.

---

## On-screen text, verbatim

Line breaks below are the actual rendered line breaks, one `drawtext` per line.
Nothing else appears on screen except the persistent top-left lockup and the
per-beat accent rail. The last line of every beat is the accent line, Inter
ExtraBold 76 in `#A78BFA`; every other line is Inter SemiBold 72 in `#E8E9ED`.

**Beat 1, 0.000 to 5.000 s.** Four lines. Fully opaque from frame 0. No fade in,
no rise, no stagger, because this frame is the cover.

```
An AI engine puts
its answer together
from how you
are described.
```

**Beat 2, 5.200 to 9.800 s.** Three lines.

```
What you publish
is one part of
that picture.
```

**Beat 3, 10.000 to 14.600 s.** Three lines. This is the contrarian payload.

```
So your search
position does not
transfer.
```

**Beat 4, 14.800 to 19.400 s.** Three lines.

```
It is a separate
check, run on the
engines directly.
```

**Beat 5, 19.600 to 25.400 s.** Four lines.

```
You can look this
up for the domain
you run.
getbrandgeo.com
```

**Persistent, whole runtime:** the BrandGEO mark at 48x68 plus the BrandGEO
wordmark at 192x32, top left, both from
`docs/growth/CAMPAIGN-2026-07-30/_shared/logo/`. No text is drawn for the
wordmark; it is the shipped artwork.

Exact rendered strings, read back out of the seventeen text files ffmpeg draws
from. These are the bytes every scanner below ran on, not a transcription:

```
l0  'An AI engine puts'      l9  'transfer.'
l1  'its answer together'    l10 'It is a separate'
l2  'from how you'           l11 'check, run on the'
l3  'are described.'         l12 'engines directly.'
l4  'What you publish'       l13 'You can look this'
l5  'is one part of'         l14 'up for the domain'
l6  'that picture.'          l15 'you run.'
l7  'So your search'         l16 'getbrandgeo.com'
l8  'position does not'
```

---

## Every claim on screen, and the live HTML it comes from

**There is not a single number on screen.** No digit, no number word, no
percentage, no count, no denominator, no engine tally. Confirmed by regex over
the seventeen rendered strings, and negative-controlled. That removes the whole
class of provenance failure this campaign has hit repeatedly, and it removes the
engine-lineup trap by construction rather than by careful wording.

What is left to source is four claims. Both source pages are BrandGEO's own
published research and both quotes below are the visible body text of the live
files, not a paraphrase.

| On screen | Claim | What the page states, verbatim |
|---|---|---|
| Beat 1, `An AI engine puts its answer together from how you are described.` | an AI answer is assembled from how the brand is described, not looked up | `bg-001.html`: "They synthesize information, weigh authority signals differently, and generate answers that are **heavily influenced by how a brand is described** across the broader knowledge ecosystem" |
| Beat 2, `What you publish is one part of that picture.` | the brand's own site is one input among others | `bg-001.html`, same sentence: "across the broader knowledge ecosystem, **not just its own website**" |
| Beat 3, `So your search position does not transfer.` | a search position is not a proxy for presence in an AI answer | `bg-001.html`: "A brand can be **ranking on page one of Google** for competitive keywords and **still be completely absent** from every AI engine's output", and, of AI Visibility, "It is **distinct from SEO rankings** and requires its own measurement and optimization strategy" |
| Beat 4, `It is a separate check, run on the engines directly.` | it has to be measured by querying the engines, not inferred | `bg-001.html`: "requires its own measurement and optimization strategy". `bg-021-retrieval-not-engine-count.html`: "An engine earns a slot when we can **query it with retrieval switched on, through a documented path, for every run that produces a customer's report**" |
| Beat 5, `You can look this up for the domain you run.` | the check is available to the viewer, unpaid | `bg-021-retrieval-not-engine-count.html`, its own CTA: "**Run the free audit on your own domain.** We will show you what the engines actually return when your customers ask." |

### Restraints, each of which cost this cut something

1. **No count of any kind, so no denominator problem.** The strongest available
   evidence for this driver is `bg-004`'s divergence, and it is banned this
   round for good reason. What was available instead, `bg-021`'s seven-engine
   lineup, is correct today but would have dated the asset the next time the
   ladder moves, and the brief is explicit that an engine count is a claim about
   the lineup on the day of collection. Neither is on screen.
2. **No platform is named.** Naming Google would have made beat 3 more concrete,
   and the campaign rule now permits it, since Google is the platform being
   measured rather than a measured subject. It was left out anyway, because run
   0113 already named it three times and repeating that would blur the very
   comparison this run exists to make. "Your search position" carries the same
   claim.
3. **`bg-001` is dated 1 July 2026 and lists seven engines including Microsoft
   Copilot and Meta AI.** Only its mechanism sentences are used. Nothing that
   depends on its engine table or its Key Findings block appears, so the stale
   lineup on that page cannot leak onto the screen.
4. **`bg-001`'s "0 Standard SEO tools that measure AI Visibility" was rejected.**
   It is a claim about every other tool on the market, which is a universal, and
   the page asserting it is the one source that cannot confirm it. It is exactly
   the shape the brief warns about.
5. **`bg-001`'s "The question is no longer 'do you rank?' It's 'do you get
   cited?'"** is the sharpest line on the page and is not used. It is an
   antithesis built on a rhetorical question, and Facebook is the platform where
   that is least appropriate.
6. **Nothing is generalised into a rate.** The video says how the mechanism works
   and does not claim how often it bites anyone.

### Copy compliance, run as a script on the drawn bytes

`compliance.py` reads `t/l0.txt` through `t/l16.txt`, the files `textfile=`
points at, so it scans what ffmpeg draws and not what this document says.

```
dash                   CLEAN     (U+2012 U+2013 U+2014 U+2015 U+2212)
banned vocabulary      CLEAN     (16 terms, substring, case-folded)
superlative            CLEAN     (15 terms incl. first, only, most, best, leading)
universal              CLEAN     (13 terms incl. nobody, everyone, always, never, anyone)
measured subject       CLEAN     (814-name corpus, NFKD -> strip marks -> casefold)
engine count           CLEAN     (number word or digit adjacent to engine/platform/model)
percentage or digit    CLEAN     (no % and no digit anywhere on screen)
question opener        CLEAN     (first drawn line is not a question)
```

**Every one of those eight was negative-controlled**: the defect it is supposed
to catch was injected into the drawn strings, the scanner had to fire, then the
real strings were restored and re-scanned.

```
dash                   inject 'AI engines <em dash> not search'  -> FIRED
banned vocabulary      inject 'A seamless answer'                -> FIRED
superlative            inject 'the first study anywhere'         -> FIRED
universal              inject 'nobody checks this'               -> FIRED
measured subject       inject 'Engel & Volkers'                  -> FIRED
engine count           inject 'five AI engines agreed'           -> FIRED
percentage or digit    inject '48% of answers'                   -> FIRED
question opener        inject 'Does any of this matter?'         -> FIRED
                                                       8 of 8 fired
restored, re-scanned                                   CLEAN
```

**The name scanner was controlled on spelling variants, not just one spelling**,
because the campaign's own record has a raw-byte matcher passing `Engel &
Volkers` while catching `Engel & Völkers`. Normalisation is NFKD, then strip
combining marks, then case-fold, in that order, plus the eszett and the oe/ae
ligature transliterations, because case-folding first lets an upper-cased
accented form through.

```
'Engel & Völkers'  -> FIRED      'engel & volkers'  -> FIRED
'Engel & Volkers'  -> FIRED      'Bucate pe Roate'  -> FIRED
'ENGEL & VÖLKERS'  -> FIRED      'BUCATE PE ROATE'  -> FIRED
                                                       6 of 6 fired
```

**Two real harvester bugs were found by insisting on those controls**, and both
were letting genuine names through rather than producing false alarms:

- The first harvester only accepted a capitalised sequence that sat mid-sentence
  or directly after a list marker, to keep headings out of the corpus. That is
  the rule that produced a clean-looking 410-name corpus **missing `Engel &
  Völkers`**, which sits alone in a table cell, and **missing `Fratelli
  Catering`**, which sits inside a quoted string after `"1. `. Both are real
  names on live pages. The position restriction was removed; the corpus went to
  814 and both names are now in it.
- Requiring at least two tokens was kept, and single-token candidates were
  dropped, because the earlier single-token pass put `Answer`, `Across` and
  `Absent` in the corpus. Those would have fired on this cut's own copy and the
  resulting noise is exactly what hides a real hit.

The corpus is harvested from all 20 `bg-*.html` pages and all 37
`ai-visibility-for-*.html` pages. Engine and platform names are excluded from
it by design, per the brief's split between the instrument being measured, which
may appear, and the subject of a measurement, which may not. This cut names
neither: no engine, no platform, no company, no person.

---

## n-gram diff against every previous NOTES in this campaign

Run **last**, after the render and after the deliverables were in place, because
sibling runs land on disk while this one is built.

**Reference corpus.** The drawn strings of all **40** previous `NOTES.md` files
in `docs/growth/reel-campaign-ab/`: 36 platform cuts across nine runs plus the
four bilingual cuts. Strings are pulled out of each file's "On-screen text"
section, index-ordered where the file lists them as `l0 'x'  l10 'y'` in two
columns, so draw order is preserved rather than interleaved. **4,827 drawn
tokens.** The diff runs on those strings, not on the notes prose around them,
per the campaign rule that the diff belongs on the `textfile=` bytes.

**Unit is the SCENE STREAM**, not the individual `drawtext`. Each beat's layers
are concatenated in draw order first, because a scene that draws one sentence as
four stacked layers never forms a long n-gram and a seven-word reuse walks
through a per-layer diff. Each previous file is treated as one stream, which
also admits n-grams that span its scene boundaries: that makes the reference
strictly larger and the test strictly harder.

**Floor 2**, with a closed-class exemption. An n-gram is exempt only if **every**
token is a function word or one of the domain terms the campaign says may
recur: the engine list and the URL (`ai`, `engine`, `engines`, `brandgeo`,
`getbrandgeo.com`, `google`, `chatgpt`, `gemini`, `claude`, `perplexity`,
`grok`). Nothing else is exempted. Both sides are NFKD-normalised, stripped of
combining marks and case-folded before tokenising.

```
scene 1  'An AI engine puts its answer together from how you are described.'
scene 2  'What you publish is one part of that picture.'
scene 3  'So your search position does not transfer.'
scene 4  'It is a separate check, run on the engines directly.'
scene 5  'You can look this up for the domain you run. getbrandgeo.com'

RESULT: 0 non-exempt overlapping n-grams at floor 2.
```

**The diff was negative-controlled three ways before that result was believed**,
because the campaign's record has two separate diffs reporting CLEAN while
structurally unable to see:

```
NC1  a verbatim ten-token run lifted out of run 0113's own facebook cut,
     'We checked a brand sitting on page one of Google.'
     -> FIRED at n=10, attributed to run-20260730-0113/facebook   PASS
NC2  a bare two-word content collision, 'twenty questions'
     -> FIRED at n=2                                              PASS
NC3  a reuse SPLIT ACROSS TWO LAYERS of one scene, 'Google still' +
     ' works.', which a per-drawtext diff cannot see
     -> FIRED at n=3 on the concatenated stream                    PASS
                                                        3 of 3 controls fired
```

A fourth control arrived by accident and is worth recording, because it is the
strongest one of the four. A path-exclusion bug briefly left **this file's own
NOTES.md** in the reference corpus. The diff immediately returned all five
scenes as verbatim matches at n=12, 11, 10, 9 and 7, correctly attributed to
`run-20260730-0831/facebook`. A diff that reports CLEAN because it cannot see
would have stayed silent there. The exclusion was fixed and the run repeated
against the intended 40 files.

**Nine collisions were rewritten across successive drafts, none argued away.**
The first draft returned six non-exempt overlaps; fixing those introduced three
more, which the diff caught in turn:

```
'that answer names'  n=3  <- run-20260730-0413/instagram
'your own site is one' n=5 <- run-20260730-0513/instagram
'engine writes its'  n=3  <- run-20260730-0513/youtube
'an answer'          n=2  <- run-20260729-2318/youtube
'leaves out'         n=2  <- run-20260730-0413/instagram
'get named'          n=2  <- run-20260730-0113/youtube
'not carry'          n=2  <- run-20260730-0613/tiktok
'see which'          n=2  <- run-20260730-0413/youtube
'a few businesses'   n=3  <- run-20260730-0413/facebook
```

Three of those were two-word collisions that a floor of 3 would have passed, and
one, `'not carry'`, came from a **TikTok** cut rather than a Facebook one, so a
diff scoped to this platform's own history would have missed it too.

---

## Duration, exact ffprobe output on the DELIVERED files

Probed at the final delivery path, not in the build scratch directory.

`facebook-silent.mp4`
```
nb_streams      : 1
format duration : 25.400000
video           : h264, 1080x1920, yuv420p, 30/1 fps, 762 frames, duration 25.400000
audio streams   : 0
```

`facebook-scored.mp4`
```
nb_streams      : 2
format duration : 25.400000
video           : h264, 762 frames, duration 25.400000
audio           : aac, 48000 Hz, 2 ch, 1192 frames, stream duration 25.400000
```

**The silent master has zero audio streams**, confirmed directly rather than
inferred: `ffprobe -select_streams a -show_entries stream=index` returns **no
rows at all**, not a row describing a silent track.

Both containers report **25.400000 s**. Target band is 20 to 30 s.

The AAC quantisation the brief warns about is present and contained. A raw
decode of the scored cut's audio yields 1,219,584 samples, **25.4080 s** of
coded audio, because 1192 AAC frames of 1024 samples overshoot the cut.
`-shortest` plus the mp4 edit list trims playback back to 25.400.

Video bitstream identity between the two files, confirmed rather than assumed:

```
facebook-silent.mp4  video stream MD5 = bec0a9587f8bb6b670883cfb3b84286e
facebook-scored.mp4  video stream MD5 = bec0a9587f8bb6b670883cfb3b84286e
```

The scored cut was muxed with `-c:v copy`, so it is the same picture.

---

## Cover, verified against frame 0

Beat 1 hard-starts. Its `alpha` is a constant 1 until the fade-out at 4.650 s,
there is no per-line stagger and there is no rise term in its `y` expression.
The beat 1 accent rail likewise starts at its full 0.95 opacity rather than
stepping up through 0.32 and 0.64 the way beats 2 to 5 do.

Verified at the final delivery path, decoding both to raw RGB24 and hashing:

```
frame 0 of facebook-silent.mp4   md5 dfd4c59edaf48d6e55019e7cf4a87d04  (6,220,800 bytes)
facebook-cover.png               md5 dfd4c59edaf48d6e55019e7cf4a87d04  (6,220,800 bytes)
byte identical                   True
```

The cover PNG is 1080x1920 rgb24.

And it is not a blank rectangle: the cover carries **52,784 pixels above luma
85**, bounding box `x[100..802] y[301..1218]`, which is the accent rail, four
lines of type and the lockup.

An independent check that no fade snuck in: per-frame ink counts over the whole
file put frame 0 at **53,034 px** against beat 1's steady state of **53,017 px**
at frames 60 to 64. A 17 pixel spread is x264 quantisation noise on a static
picture, not a ramp. A one-frame fade would have put frame 0 near zero.

---

## Safe zone verification

Facebook Reels reserves: **220 px top, 440 px bottom, 180 px right.** Usable
band is `y 220..1480` and `x <= 900`.

### The ink threshold, argued from a measured control

A text-free control was rendered through the identical background pipeline with
identical x264 settings, then decoded back **out of the encoded mp4** and
histogrammed over all 762 frames, 1,580,083,200 pixels:

```
control (background only, decoded from the encoded mp4)
  luma min 8   PEAK 24
  top of the distribution: 14:159.1M  15:235.9M  16:329.4M  17:341.3M
                           19:229.7M  20:109.1M  21:48.8M   22:6.48M
                           23:79,032  24:75
```

The background peaks at **24** and dies out there. The dimmest thing deliberately
drawn is the accent violet `#A78BFA`, luma about 153. Body ink `#E8E9ED` is about
232. The accent rail is `#8B5CF6` at 0.95 over the plate, measured at 117 mean
luma in its own column.

That leaves an empty band from 24 to 117. **Threshold 85 sits inside it**, 61
levels clear of the background peak and 32 clear of the dimmest drawn element. A
second pass at **30**, six levels above the measured control peak, catches
antialiased glyph fringes that 85 drops.

### Method A, absolute threshold, all 762 frames of the delivered file

```
th > 85   union x[100..802]  y[301..1248]
th > 30   union x[100..802]  y[300..1254]

worst frames: right edge 802 @ frame 0, top edge 300/301 @ frame 0,
              bottom edge 1248 @ frame 457 (th 85), 1254 @ frame 453 (th 30)
```

### Method B, per-frame diff against the text-free control

All 762 frames of both files decoded sequentially in one pass, in lockstep,
compared frame-for-frame. Diffed against **the control**, never against an
assumed canvas colour, because rows 0 and 1 of a yuv420p frame decode
differently from the rest of the picture and a flat-colour diff reports that
codec artefact as ink on every edge.

**The diff threshold was measured, not chosen.** A control cancels artefacts it
shares; it cannot cancel the encoder's response to content it does not have, so
adding text moves x264's rate control across the whole frame. The noise floor
was measured in three regions that are empty by design in this layout:

```
max |delta| in regions empty by design
  above the lockup      (y 0..259)              4
  right of the type     (x 940..1079, y 500..1399)   4
  below the type        (y 1500..1919)          4
  -> diff threshold set to 7 (floor 4 + 3)
```

```
union x[100..802]  y[300..1255]
worst: right 802 @ frame 0, top 300 @ frame 0, bottom 1255 @ frame 452
```

Method B did not report ink at `y=0` or `x=0`. That is positive evidence that
the control-based correction works here, not an assertion that it should.

### Method C, declared geometry

Pixel methods cannot see anything within about 10 luma of the background and a
control diff shares the blind spot, so the lockup's declared rects are folded in
explicitly. Both `overlay` y values are **even by construction** (300 and 318),
because ffmpeg 8.1.2 rounds an odd overlay `y` DOWN to even under yuv420p and a
rect computed from the requested y would then be off by one against what
rendered. The declared rects below are the effective even y.

```
mark      overlay x=100 y=300 at 48x68   ->  rect x[100..148] y[300..368]
wordmark  overlay x=168 y=318 at 192x32  ->  rect x[168..360] y[318..350]
rail      drawbox x=100 w=6              ->  x[100..106]
```

Here the pixel methods and the declared rects agree: the mark is violet on a
near-black plate, not dark-on-dark, so 300 is both measured and declared.

### Union of all three, against the three reserves

| Edge | Limit | Measured / declared ink | Headroom | Verdict |
|---|---|---|---|---|
| Top | `y >= 220` | 300 | **80 px** | PASS |
| Bottom | `y <= 1480` | 1255 | **225 px** | PASS |
| Right | `x <= 900` | 802 | **98 px** | PASS |

No edge is under 20 px and none is in single digits.

### BOTH numbers, because a copy edit only moves the second

The brief asks for the union the platform crops against **and** the widest TYPE
extent, and warns that if the two never differ the layout carries no headroom
information.

```
UNION of everything drawn      x[100..802]  y[300..1255]
TYPE alone, rail and lockup
excluded by declared geometry  x[132..802]  y[824..1248]
```

| Edge | Union | Type only | Binding element |
|---|---|---|---|
| Top | 300 (headroom 80) | 824 (headroom 604) | **furniture**, the logo mark |
| Bottom | 1255 (headroom 225) | 1248 (headroom 232) | **type**, the accent descender |
| Right | 802 (headroom 98) | 802 (headroom 98) | **type**, two lines tie at 802 |

**This is the recurrence the task asked about, and it is halved rather than
repeated.** The brief records that in several previous runs Facebook's binding
constraint was a declared logo rect on the bottom, which means the safe-zone
pass was measuring the furniture and saying nothing about whether the copy fits.
Run 0113 is exactly that case: its bottom bound was the logo rect at 1412 while
its own type stopped at 976, and its top bound was the accent rule rather than
type, so only the right edge tested the copy.

Moving the lockup to the top inverts which edge pays. Here **bottom and right are
both type-bound**: two of three edges now move when the copy is edited, against
one in run 0113. The top is still furniture-bound at 300 and that is honest to
report rather than hide, because a lockup has to sit somewhere in frame and
whichever edge it sits on stops testing the type. The choice was deliberate: the
right edge is what a longer line actually breaks, the bottom is what an extra
line breaks, and the top is what neither touches.

The 7 px gap between the union bottom (1255, method B) and the type-only bottom
(1248, threshold 85) is the antialiased fringe below the accent descender, the
same ink read two ways, not a different element. The rail's own bottom is 1205,
below both, so it never sets the bottom edge.

### Line widths were measured before the layout was fixed, not after

Every line was rendered alone on black at its final font, size and `x`, decoded,
and its ink box taken, so the type size was chosen from measurement rather than
adjusted after a failure. Left margin for type is `x=132`, which is the rail at
`x=100` plus a 26 px gap.

Final measured right edges, worst first, against the `x <= 900` limit:

```
body   Inter-SemiBold  @ 72  l1  'its answer together'  right 802  headroom  98  <- binding
accent Inter-ExtraBold  @ 76  l16 'getbrandgeo.com'      right 802  headroom  98  <- binding
accent                        l12 'engines directly.'    right 756  headroom 144
body                          l0  'An AI engine puts'    right 742  headroom 158
                              l14 'up for the domain'    right 739  headroom 161
                              l11 'check, run on the'    right 733  headroom 167
                              l4  'What you publish'     right 731  headroom 169
                              l8  'position does not'    right 729  headroom 171
                              l13 'You can look this'    right 718  headroom 182
accent                        l3  'are described.'       right 667  headroom 233
body                          l7  'So your search'       right 648  headroom 252
                              l10 'It is a separate'     right 635  headroom 265
                              l2  'from how you'         right 603  headroom 297
                              l5  'is one part of'       right 588  headroom 312
accent                        l6  'that picture.'        right 587  headroom 313
accent                        l9  'transfer.'            right 450  headroom 450
body                          l15 'you run.'             right 412  headroom 488
```

The accent size was set from this measurement rather than by eye. At the 80 px
this campaign has used, `getbrandgeo.com` measured a right edge of **836**, only
**64 px** of clearance and the sole binding line in the video, which is a
layout whose one constraint is a string nobody will ever edit. At 76 px it drops
to 802 and **ties with an editable body line**, so the binding constraint is now
a sentence a copy edit can actually move. Headroom went from 64 to 98 px at the
same time.

**The pre-render measurement and the delivered file agree to the pixel**: 802
predicted, 802 measured by all three methods on the encoded mp4. A right edge
three independent methods put at the same pixel is a number worth trusting.

**Any copy edit that lengthens a line needs this rerun.** The practical ceiling
at these sizes is about 19 characters for a body line and about 17 for an accent
line.

### The drawbox traps, and proof neither fired

**The alpha trap.** On a transparent RGBA source `drawbox` blends instead of
writing alpha, renders at alpha 0 and vanishes with no error. This build removes
the precondition: the plate is forced to `format=rgb24` before any drawing and
both logo overlays are pinned to `format=rgb`, so **no alpha plane exists
anywhere in the draw chain**. `replace=1` is therefore unnecessary and would be
wrong here, because the rail's fade is built from stacked boxes at 0.32 / 0.64 /
0.95 / 0.58 / 0.24 that must alpha-blend against the plate.

The positive check is a direct luma measurement of the rail column rather than
an inference, because the rail sits at the left edge where the lockup also
starts and a bounding box alone could not tell them apart:

```
rail column      x[100..106) y[1000..1200] mean luma  117.34   (frame 360, beat 3)
plate beside it  x[112..118) y[1000..1200] mean luma   13.57
ratio 8.6x   ->  the rail is present, not alpha 0
rail column mean across the whole run: min 13.48, max 120.83
```

The minimum of 13.48 is a between-beats frame where the rail is correctly gone;
the maximum of 120.83 is a beat at full opacity. If the alpha trap had fired,
that column would have sat at plate value for all 762 frames.

**The animation trap.** `drawbox` has no `eval` option on 8.1.2 and evaluates
`x/y/w/h` once at init, so any expression in those fields freezes silently at
its t=0 value. Nothing in this build animates a box: every rail is a static rect
whose only time dependence is `enable`, which is evaluated per frame and does
work. **No `drawbox` geometry field contains `t`**, asserted by the generator
that writes the filtergraph and printed at build time.

### The timeline is not built with ffconcat

There is no concat and no segment list. It is a single looped background at
`-framerate 30` with all timing carried in `enable` and `alpha` expressions,
which the filter chain evaluates per frame.

Verified rather than assumed, by counting ink pixels per frame across all 762
frames of the delivered file, since frame hashing does not detect scene changes
in an encoded H.264 file. Boundaries are taken as the **FLOOR of the plateau
centre, never the round**, because an even-width plateau has no integer centre
and rounding produces a uniform one-frame offset on every cut that reads exactly
like drift.

The ink threshold was swept, which is the check that separates a detector fault
from a render fault: **the plateau WIDTH moves with threshold, the CENTRE does
not.**

```
expected cut centres (frames): 153, 297, 441, 585

th> 50   plateau widths  9 10 10  9   centres 153 297 441 585   offsets 0 0 0 0
th> 70   plateau widths 12 12 12 12   centres 153 297 441 585   offsets 0 0 0 0
th> 90   plateau widths 14 14 14 14   centres 153 297 441 585   offsets 0 0 0 0
th>150   plateau widths 20 20 20 20   centres 153 297 441 585   offsets 0 0 0 0

16 of 16 boundaries exact across four thresholds.
```

At thresholds 90 and 150 a fifth plateau appears near frames 758 and 760. That
is the final fade-out running past the last bright frame, not a sixth cut, and
it is the only plateau whose centre moves with threshold, which is the tell.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.

Original BrandGEO composition, cleared for commercial use including paid ads, no
attribution line required. Nothing was synthesized for this cut and nothing was
downloaded. **Held constant across runs on purpose: the hook is the variable
under test, so the bed must not vary with it.** Run 0113's Facebook cut used the
same track, and holding it fixed is what makes the two comparable.

**No voice anywhere.** No TTS, no narration, no voiceover file, and no LibriTTS
attribution line, because there is no voice in this campaign and adding that
line would be a false statement about the asset.

Source is 60.000 s, 48 kHz, 24-bit stereo PCM. Trimmed to the first 25.400 s
with a **0.08 s fade in at t=0** and a **1.5 s fade out starting at 23.900 s**,
then two-pass normalized.

### The fade in is mandatory, re-measured on the source rather than assumed

```
tension-minor.wav  sample[0]        = (-0.025158, -0.005769)
                   first 64 samples   abs max 0.061709
                   first 10 ms        abs max 0.112205
                   overall peak       0.660526
```

The first sample is already at 0.025 and the first 64 samples reach 0.0617. A
hard cut out of digital silence into that is a step discontinuity and it clicks
regardless of where the musical beat falls. What matters is the amplitude at
sample zero, and it is not zero.

**Verified on the DELIVERED file**, decoding the audio back out of
`facebook-scored.mp4` at the final path after AAC encoding:

```
first 64 samples abs max = 0.002653     (requirement: below 0.005)   PASS
first sample pair        = (-0.0000201, 0.0000040)
first 10 ms  abs max     = 0.01413
overall peak             = 0.6013
last 64 samples abs max  = 0.000004     (the fade out lands clean too)
```

### Loudness, two-pass

Pass 1 measured the trimmed and faded excerpt. Pass 2 applied those values with
`linear=true`, which engages because the required gain is small and the true
peak stays well under the ceiling. Linear mode matters twice: it is the correct
mode when the gain is small, and it is a constant gain, so it cannot distort the
0.08 s fade-in ramp the way dynamic mode would.

```
pass 1 (measure)   I -16.36   TP -4.70   LRA 3.10   thresh -26.42   offset -1.08
pass 2 (apply)     Output Integrated -16.0 LUFS, True Peak -4.3 dBTP, LRA 5.9 LU
                   Normalization Type: Linear
```

Re-measured after AAC encoding, decoding the audio back out of the delivered
`facebook-scored.mp4`:

```
loudnorm   I -16.02 LUFS   TP -4.41 dBTP   LRA 3.10   thresh -26.07
ebur128    I (target -16)  true peak -4.4 dBFS   LRA 5.6 LU
                           LRA low -19.9, LRA high -14.3
```

Target is -16 LUFS and the delivered file is at -16.02. True peak is 2.9 dB
under the -1.5 dBTP ceiling. **The two LRA figures disagree, 3.10 against 5.6,
because `loudnorm` and `ebur128` gate differently**; both are reported rather
than picking the flattering one.

### Honest read on how it sounds

I cannot listen to it. What follows is measurement, and someone should audition
it once before it runs anywhere paid.

It is real music rather than a drone, on the two axes a synthesized bed fails on:

- **Stereo.** L and R differ on **100.00%** of samples, channel correlation
  0.884.
- **Movement.** Per-second RMS of the delivered audio, dBFS:

```
-20 -21 -22 -21 -20 -15 -15 -16 -15 -17 -16 -17 -15 -15 -17 -16 -16 -16 -15 -16
-15 -16 -15 -16 -18
```

The intro, a lift at second 5, a steady body and the fade in the last second are
all visible in that row.

**The lift at second 5 lands on the beat 1 to beat 2 cut at 5.000 to 5.200 s.**
That is inherited luck, not arrangement: the beat grid here is 5.0 / 9.8 / 14.6 /
19.4, different from run 0113's 5.2 / 9.6 / 14.0 / 18.4, and nothing was moved to
make it happen. The later cuts do not sit near anything in the arrangement.

The honest qualification: this 25.4 s window measures LRA 3.10 against the parent
60 s track's **6.80**. A 25 second window captures part of one section and misses
the arrangement's wider swing, so this cut is calmer than the track it came from.
Fine for a bed under text. Do not quote 6.80 as if it described this file.

**Ship the silent master for the organic post.** Facebook favours audio picked
from its own in-app library.

---

## Technical spec

- 1080x1920, 9:16, 30 fps, H.264 High@4.0, `yuv420p`, `+faststart`, CRF 18,
  preset slow. 762 frames.
- Background is a generated **PNG** intermediate, never JPEG, so the pipeline
  stays limited-range `yuv420p` and does not pick up the `yuvj420p` shift.
- Background: canvas `#0A0B0E` with three soft radial glows (`#7C3AED` upper
  left, `#6366F1` right, `#8B5CF6` lower) under a vignette, generated with numpy
  and written to PNG by ffmpeg from a raw rgb24 pipe, so nothing hand-rolls a
  PNG encoder and nothing was installed. A 4x4 ordered dither is baked in at
  +/- 0.8 levels because an 8-bit gradient at this size bands visibly without it.
  Dark only. Measured plate peak luma 22, measured peak luma 24 after encoding.
  `md5(bg.png) = ddd0665f9cb792d291e13ece65dee0c8`.
- Motion: the plate is generated at 1188x2112 and cropped to 1080x1920 with a
  slow sinusoidal horizontal drift (14 px, 21 s period) and a slow vertical rise
  (30 px over the runtime), so the frame is never static while the type stays
  still. The 10% overscan guarantees the crop never reaches an edge.
- Text ink `#E8E9ED`, accent text `#A78BFA`. **`#8B5CF6` appears only as a FILL**,
  in the background glows and the accent rail, and never as text, because white
  on it measures 4.23:1 and fails AA.
- Type: vendored Inter from `docs/growth/grok-launch/images/_build/fonts/`.
  SemiBold 72 px body, ExtraBold 76 px accent. Nothing downloaded, nothing
  substituted.
- Lockup: `brandgeo-mark-transparent-h512.png` scaled to 48x68 and
  `brandgeo-wordmark-dark-transparent-w512.png` scaled to 192x32, both from
  `docs/growth/CAMPAIGN-2026-07-30/_shared/logo/`, top left. The wordmark is
  artwork, not drawn text.
- Layout: type at `x=132`, beats **bottom-aligned** with the last line at
  `y=1160` and a 112 px pitch, so the accent line sits at the same height in
  every beat regardless of whether the beat is three lines or four.
- Motion per line: 0.40 s fade in, 22 px rise over 0.55 s, 0.12 s stagger
  between lines within a beat, 0.35 s fade out. Beat 1 has none of these.

---

## Exact commands

Working directory is the build scratch dir, holding `bg.py`, `bg.png`,
`mark.png`, `wordmark.png`, `fonts/` (copied from the vendored Inter), `t/` (one
file per rendered line) and `fc.txt`. Relative paths throughout, deliberately, to
avoid escaping the drive-letter colon inside filtergraph options.

### 1. Background PNG

```sh
python bg.py            # numpy -> raw rgb24 -> ffmpeg -> bg.png, 1188x2112
```

### 2. Silent master

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 25.4 -i bg.png \
  -loop 1 -framerate 30 -t 25.4 -i mark.png \
  -loop 1 -framerate 30 -t 25.4 -i wordmark.png \
  -/filter_complex fc.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 -movflags +faststart \
  facebook-silent.mp4
```

### 3. Text-free control, for the threshold and for method B

Identical encode, background only, no logo and no text, so the diff can see the
lockup as well as the type.

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 25.4 -i bg.png \
  -/filter_complex fc_ctrl.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 control.mp4
```

`fc_ctrl.txt`, in full:

```
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+14*sin(2*PI*t/21)':y='(in_h-out_h)/2-30*(t/25.400)',format=rgb24,format=yuv420p[v]
```

### 4. Music, trim, fade in and out, two-pass loudnorm

```sh
ffmpeg -y -t 25.4 -i ../../../../../assets/audio/music/tension-minor.wav \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=23.9:d=1.5" \
  -c:a pcm_s24le -ar 48000 -ac 2 music_cut.wav

# pass 1, measure
ffmpeg -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values linearly
ffmpeg -y -i music_cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:\
measured_I=-16.36:measured_TP=-4.70:measured_LRA=3.10:measured_thresh=-26.42:\
offset=-1.08:linear=true:print_format=summary" \
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

40 draw operations, 17 text layers. `drawbox` takes no alpha expression, so each
accent rail fade is built from three to five stacked static boxes on staggered
`enable` windows. Beat 1 has no fade in, no stagger and no rise, so frame 0 is a
clean fully-opaque still that doubles as the cover. Line files `t/l0.txt`
through `t/l16.txt` hold the beat lines in the order listed under "On-screen
text" above, one line of text per file. Text is passed by file rather than inline
so the comma inside `check, run on the` needs no filtergraph escaping.

`md5(fc.txt) = 553adae90b358c5fd87058f652757173`. Newlines below sit only at
filter boundaries and are cosmetic.

```
[1:v]scale=48:68[mk];
[2:v]scale=192:32[wm];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+14*sin(2*PI*t/21)':y='(in_h-out_h)/2-30*(t/25.400)',format=rgb24[bgp];
[bgp][mk]overlay=x=100:y=300:format=rgb[b1];
[b1][wm]overlay=x=168:y=318:format=rgb[b2];
[b2]drawbox=x=100:y=850:w=6:h=355:color=0x8B5CF6@0.95:t=fill:enable='between(t\,0.000\,4.650)',
drawbox=x=100:y=850:w=6:h=355:color=0x8B5CF6@0.58:t=fill:enable='between(t\,4.650\,4.825)',
drawbox=x=100:y=850:w=6:h=355:color=0x8B5CF6@0.24:t=fill:enable='between(t\,4.825\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l0.txt:x=132:y=824:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l1.txt:x=132:y=936:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l2.txt:x=132:y=1048:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l3.txt:x=132:y=1160:fontsize=76:fontcolor=0xA78BFA:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.32:t=fill:enable='between(t\,5.200\,5.400)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.64:t=fill:enable='between(t\,5.400\,5.600)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.95:t=fill:enable='between(t\,5.600\,9.450)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.58:t=fill:enable='between(t\,9.450\,9.625)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.24:t=fill:enable='between(t\,9.625\,9.800)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l4.txt:x=132:y='936+22*(1-min(1\,max(0\,(t-5.200))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.200)\,0\,if(lt(t\,5.600)\,(t-5.200)/0.40\,if(lt(t\,9.450)\,1\,if(lt(t\,9.800)\,(9.800-t)/0.35\,0))))':enable='between(t\,5.200\,9.800)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l5.txt:x=132:y='1048+22*(1-min(1\,max(0\,(t-5.320))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.320)\,0\,if(lt(t\,5.720)\,(t-5.320)/0.40\,if(lt(t\,9.450)\,1\,if(lt(t\,9.800)\,(9.800-t)/0.35\,0))))':enable='between(t\,5.320\,9.800)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l6.txt:x=132:y='1160+22*(1-min(1\,max(0\,(t-5.440))/0.55))':fontsize=76:fontcolor=0xA78BFA:alpha='if(lt(t\,5.440)\,0\,if(lt(t\,5.840)\,(t-5.440)/0.40\,if(lt(t\,9.450)\,1\,if(lt(t\,9.800)\,(9.800-t)/0.35\,0))))':enable='between(t\,5.440\,9.800)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.32:t=fill:enable='between(t\,10.000\,10.200)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.64:t=fill:enable='between(t\,10.200\,10.400)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.95:t=fill:enable='between(t\,10.400\,14.250)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.58:t=fill:enable='between(t\,14.250\,14.425)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.24:t=fill:enable='between(t\,14.425\,14.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l7.txt:x=132:y='936+22*(1-min(1\,max(0\,(t-10.000))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,10.000)\,0\,if(lt(t\,10.400)\,(t-10.000)/0.40\,if(lt(t\,14.250)\,1\,if(lt(t\,14.600)\,(14.600-t)/0.35\,0))))':enable='between(t\,10.000\,14.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l8.txt:x=132:y='1048+22*(1-min(1\,max(0\,(t-10.120))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,10.120)\,0\,if(lt(t\,10.520)\,(t-10.120)/0.40\,if(lt(t\,14.250)\,1\,if(lt(t\,14.600)\,(14.600-t)/0.35\,0))))':enable='between(t\,10.120\,14.600)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l9.txt:x=132:y='1160+22*(1-min(1\,max(0\,(t-10.240))/0.55))':fontsize=76:fontcolor=0xA78BFA:alpha='if(lt(t\,10.240)\,0\,if(lt(t\,10.640)\,(t-10.240)/0.40\,if(lt(t\,14.250)\,1\,if(lt(t\,14.600)\,(14.600-t)/0.35\,0))))':enable='between(t\,10.240\,14.600)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.32:t=fill:enable='between(t\,14.800\,15.000)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.64:t=fill:enable='between(t\,15.000\,15.200)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.95:t=fill:enable='between(t\,15.200\,19.050)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.58:t=fill:enable='between(t\,19.050\,19.225)',
drawbox=x=100:y=962:w=6:h=243:color=0x8B5CF6@0.24:t=fill:enable='between(t\,19.225\,19.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l10.txt:x=132:y='936+22*(1-min(1\,max(0\,(t-14.800))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,14.800)\,0\,if(lt(t\,15.200)\,(t-14.800)/0.40\,if(lt(t\,19.050)\,1\,if(lt(t\,19.400)\,(19.400-t)/0.35\,0))))':enable='between(t\,14.800\,19.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l11.txt:x=132:y='1048+22*(1-min(1\,max(0\,(t-14.920))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,14.920)\,0\,if(lt(t\,15.320)\,(t-14.920)/0.40\,if(lt(t\,19.050)\,1\,if(lt(t\,19.400)\,(19.400-t)/0.35\,0))))':enable='between(t\,14.920\,19.400)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l12.txt:x=132:y='1160+22*(1-min(1\,max(0\,(t-15.040))/0.55))':fontsize=76:fontcolor=0xA78BFA:alpha='if(lt(t\,15.040)\,0\,if(lt(t\,15.440)\,(t-15.040)/0.40\,if(lt(t\,19.050)\,1\,if(lt(t\,19.400)\,(19.400-t)/0.35\,0))))':enable='between(t\,15.040\,19.400)',
drawbox=x=100:y=850:w=6:h=355:color=0x8B5CF6@0.32:t=fill:enable='between(t\,19.600\,19.800)',
drawbox=x=100:y=850:w=6:h=355:color=0x8B5CF6@0.64:t=fill:enable='between(t\,19.800\,20.000)',
drawbox=x=100:y=850:w=6:h=355:color=0x8B5CF6@0.95:t=fill:enable='between(t\,20.000\,25.050)',
drawbox=x=100:y=850:w=6:h=355:color=0x8B5CF6@0.58:t=fill:enable='between(t\,25.050\,25.225)',
drawbox=x=100:y=850:w=6:h=355:color=0x8B5CF6@0.24:t=fill:enable='between(t\,25.225\,25.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l13.txt:x=132:y='824+22*(1-min(1\,max(0\,(t-19.600))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,19.600)\,0\,if(lt(t\,20.000)\,(t-19.600)/0.40\,if(lt(t\,25.050)\,1\,if(lt(t\,25.400)\,(25.400-t)/0.35\,0))))':enable='between(t\,19.600\,25.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l14.txt:x=132:y='936+22*(1-min(1\,max(0\,(t-19.720))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,19.720)\,0\,if(lt(t\,20.120)\,(t-19.720)/0.40\,if(lt(t\,25.050)\,1\,if(lt(t\,25.400)\,(25.400-t)/0.35\,0))))':enable='between(t\,19.720\,25.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l15.txt:x=132:y='1048+22*(1-min(1\,max(0\,(t-19.840))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,19.840)\,0\,if(lt(t\,20.240)\,(t-19.840)/0.40\,if(lt(t\,25.050)\,1\,if(lt(t\,25.400)\,(25.400-t)/0.35\,0))))':enable='between(t\,19.840\,25.400)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l16.txt:x=132:y='1160+22*(1-min(1\,max(0\,(t-19.960))/0.55))':fontsize=76:fontcolor=0xA78BFA:alpha='if(lt(t\,19.960)\,0\,if(lt(t\,20.360)\,(t-19.960)/0.40\,if(lt(t\,25.050)\,1\,if(lt(t\,25.400)\,(25.400-t)/0.35\,0))))':enable='between(t\,19.960\,25.400)',format=yuv420p[v]
```

---

## Suggested feed caption

Not posted. Provided for review alongside the video.

> An AI answer is not retrieved, it is assembled. The engine reads how a brand is
> described across the web, then writes one answer and names a small number of
> businesses in it.
>
> That is why a strong search position does not settle the question. The two are
> built from different inputs and produced by different systems, so one of them
> being healthy tells you very little about the other.
>
> The check is a separate one. It means putting real buyer questions to the
> engines themselves and reading what comes back, rather than inferring it from a
> rankings report.
>
> You can run that on your own domain.
>
> getbrandgeo.com

---

## Open items for whoever reviews this

1. **Audition `facebook-scored.mp4`.** The music has been measured, not heard.
   The first-64-sample check confirms there is no click (0.002653 against a
   0.005 limit) but that is a number, not an ear.
2. **The top edge is furniture-bound at 300 px** and that is a deliberate trade,
   not an oversight. A lockup has to sit somewhere, and whichever edge it sits on
   stops testing the type. Moving it to the top bought a type-bound bottom and a
   type-bound right, which are the two edges a copy edit actually moves. If a
   reviewer wants all three edges type-bound, the lockup has to leave the frame
   entirely, which is a brand decision rather than a layout one.
3. **This cut states no number and names no platform.** Both were choices made to
   keep the run 0113 comparison clean, and both cost the cut concreteness. If the
   A/B result comes back weak, the first thing to test is whether it was the
   contrarian driver that failed or the decision to argue it without a single
   figure on screen. Those are separable and this run does not separate them.
4. **`RUN.md` for run 20260730-0831 is not written**, and it sits one level above
   this folder, outside this task's write scope. Driver **#4, contrarian, second
   pass**, track `tension-minor`, for this run.
5. **`bg-004` is now effectively unusable for this campaign** and it is worth
   recording that rather than rediscovering it. Its body names Microsoft Copilot
   and its methodology names retired Meta AI, so no correct engine count can be
   stated over its figures, and its numbers are the most quotable ones in the
   corpus. Every run so far has reached for it and declined it. Either the page
   gets a dated engine-lineup note added to it, or it should be treated as off
   limits for on-screen use.
6. **Unverified, stated as unverified.** Whether Facebook's live UI overlay in
   2026 matches the 220 / 440 / 180 reserves in the brief. Those numbers were
   taken from the brief and applied; they were not confirmed against a current
   Facebook Reels screenshot, because no such reference exists in this repo. Every
   measurement in this document is against those declared reserves.
