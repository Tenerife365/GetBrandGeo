# Facebook feed images, ready to paste

Four 1440x1800 PNGs, one finding each. Nothing here has been posted or scheduled.

Rendered by `../_build/render_facebook_static.py`. Copy-checked by
`../_build/scan.py`, which is negative-controlled: see the injection table at
the bottom of this file.

## How to use this

**Upload the PNG as a feed photo post and paste the body under it.** Facebook
favours 4:5 in the feed, which is why these are 1440x1800 rather than square.

**The first sentence has to carry alone.** Facebook truncates at roughly 125
characters and hides the rest behind "See more", so every body below opens with
one sentence that is complete, under 125 characters, and states the finding. If
you shorten a body, cut from the middle. The last line before the URL is the only
line doing CTA work.

**Facebook is MOFU here.** The call to action is the free audit on
getbrandgeo.com, never a plan. No body below mentions a price, a tier, or a trial
mechanic.

**Every figure carries its denominator, its date and its scope in the same
paragraph as the finding.** Where a run had a collection failure, the body says
so. Those sentences are not padding and should not be cut.

---

## fb-feed-01-description-1440x1800.png

**Finding:** an engine can list you and still write the sentence beside your name
wrong, and you are not sent a copy of it.
**Source:** `docs/growth/reel-campaign-ab/run-20260730-0513/facebook/NOTES.md`,
hook driver #2 second pass. Carries no number and no engine count by design.
**Destination:** https://getbrandgeo.com/

```
An AI can name your company and still describe it wrong.

The sentence sitting next to your name is assembled by the engine out of
material it can match to you. Your own pages, directories, review sites, press,
old forum threads. Anything thin or years out of date in that pile is material
the answer gets built out of.

It is also why the engines disagree with each other. They read different
sources and weight them differently, so each one writes its own version, and
there is no single description to go and correct.

Being listed and being described accurately are two separate results. Worth
knowing which one you have before a buyer reads it for you.

getbrandgeo.com
```

**Alt text:** Dark violet-on-black BrandGEO graphic. Headline reads "An AI can
name your company and still describe it wrong." Below it a card headed "Recorded
per engine, per question" lists three rows: whether you were named, where you
were placed, and, highlighted in violet, the wording used about you.

---

## fb-feed-02-language-split-1440x1800.png

**Finding:** one prompt, asked once in Spanish and once in English on the same
day, produced two engines failing in opposite directions.
**Source:** `docs/growth/reel-campaign-ab/run-20260730-0613/facebook/NOTES.md`,
hook driver #3 second pass, sourced from the published Madrid run.
**Destination:** https://getbrandgeo.com/ai-visibility-for-madrid.html

```
We put one question to AI twice in Madrid, once in Spanish and once in English.

Hotels near Madrid-Barajas, one collection day, 10 July 2026. One engine gave a
full, real answer in English and nothing usable in Spanish. Another engine did
the exact reverse on the identical prompt: a real answer in Spanish, nothing in
English.

There is no engine count on that finding, deliberately. A further engine failed
to collect on every Madrid prompt in that run, and the page reports it as a data
gap rather than folding it into a result.

If you sell in more than one language, a clean result in one of them is weak
evidence about the other.

https://getbrandgeo.com/ai-visibility-for-madrid.html
```

**Alt text:** Dark BrandGEO graphic headed "Madrid, collected 10 July 2026" with
the headline "One question, asked in two languages, answered in opposite
directions." A card shows one engine returning a full answer in English and
nothing usable in Spanish, and another engine returning a real answer in Spanish
and nothing in English.

---

## fb-feed-03-placement-1440x1800.png

**Finding:** five engines returned the same company for one question and placed
it differently, including one row that is unflattering to the story.
**Source:** `docs/growth/reel-campaign-ab/run-20260730-0216/facebook/NOTES.md`,
hook driver #5, sourced from the published Chicago run.
**Destination:** https://getbrandgeo.com/ai-visibility-for-chicago.html

```
On 24 July 2026, five AI engines named the same company. Two agreed on the rank.

The question was "Top-rated property management companies in Chicago". ChatGPT
first, Claude first, Perplexity second, Gemini fourth, and Google AI Mode
surfaced the company by name without giving it a position at all.

The Gemini row is the useful one. A rank tracker hands you a single number to
defend. This run handed back five separate answers, and being present in them
is a different question from being placed in them.

All five returned usable data on every prompt in that run. The other five
questions from the same run are on the page.

https://getbrandgeo.com/ai-visibility-for-chicago.html
```

**Alt text:** Dark BrandGEO graphic headed "Chicago, collected 24 July 2026" with
the headline "Five engines named the same company. They did not agree on the
order." A card titled "Where it landed" lists ChatGPT 1st, Claude 1st, Perplexity
2nd, Gemini 4th, and Google AI Mode named. The card is labelled "one company, not
named here", and a note says all five engines returned usable data on every
prompt that run.

---

## fb-feed-04-rank-vs-answer-1440x1800.png

**Finding:** a brand ranking on page one of Google appeared zero times in one AI
engine's answers across twenty identical questions.
**Source:** `docs/growth/reel-campaign-ab/run-20260730-0113/facebook/NOTES.md`,
hook driver #4, sourced from the published BG-004 audit.
**Destination:** https://getbrandgeo.com/bg-004.html

```
A brand sitting on page one of Google appeared zero times in one AI engine's
answers.

We audited it in July 2026 against twenty real customer questions, identical
across every engine we put them to. It came back as the number one
recommendation on three of them, consistently across the majority of the twenty
though not on every single one. On one engine it did not appear at all.

The part worth reading is that the business had no way to notice. The rankings
were fine, so the reporting said everything was fine.

A rank tracker measures a position in a list of links. It has no view of whether
a company gets named inside a generated answer at all.

https://getbrandgeo.com/bg-004.html
```

**Alt text:** Dark BrandGEO graphic headed "One brand, twenty questions, July
2026" with the headline "Page one on Google. Absent from one AI engine's
answers." A card shows two figures: 3, engines where it was the number one
recommendation, and 0, times it appeared anywhere in one engine's answers.

---

## What these four are, and what they are not

The four findings are deliberately non-overlapping in mechanism, not just in
wording:

| File | Mechanism | Number carried |
|---|---|---|
| 01 | what an engine SAYS, separate from whether it LISTS | none at all |
| 02 | the same prompt behaves differently by language | none, one engine failed to collect |
| 03 | engines agree on presence and disagree on placement | five engines, 24 July 2026 |
| 04 | a Google rank and an AI answer are two measurements | twenty questions, July 2026 |

Findings considered and rejected, so they are not re-added later on the
assumption they were overlooked:

- **Loss aversion, runs `20260729-2200` and `20260730-0413`.** Neither cut
  carries a measurement of its own; the second pass's Washington DC evidence is a
  cross-engine consensus result, which is the lane file 03 already occupies with a
  harder artefact.
- **Status threat, run `20260729-2318`.** Occupancy argument, no measurement.
  File 01 is the same driver's evidence-shaped sibling and was preferred.
- **Curiosity gap, run `20260730-0013`.** The Philadelphia convergence versus
  fragmentation contrast. The nearest miss by a distance. Rejected only because it
  is also a cross-engine agreement finding and file 03 renders better as a static
  artefact.
- **Utility, run `20260730-0313`.** A method the reader can run, not a finding.

**Not used, and this is deliberate:** the Chicago page attaches a program-wide
unanimity superlative to its own 5-of-5 result. That claim is false, contradicted
by the Boston page over the same collection date, and it is not quoted here, on
file 03, or in its body. The exact wording is recorded in
`run-20260730-0216/facebook/NOTES.md` for whoever fixes the page.

---

# Verification

Covers both folders. Reproduce with:

```
python ../_build/render_facebook_static.py             # render, token-surface contrast
python ../_build/render_facebook_static.py --verify-bg # contrast against real pixels
python ../_build/scan.py --controls                    # negative controls, then the sweep
```

## Negative controls: 20 of 20 injections fired

A scan that passes everything is indistinguishable from one that does not work,
so every check was made to go red before its clean result was believed.

**The injection payloads are described below, never reproduced.** Writing them
out here would trip this file's own sweep, which is a trap run 1 of the video
campaign already paid for. The literal strings live in `controls()` in
`../_build/scan.py`, which the sweep does not read.

| # | What was injected | Check | Result |
|---|---|---|---|
| 1 | a sentence containing an em dash | dash | FIRED |
| 2 | a spaced ASCII hyphen used as punctuation | dash | FIRED |
| 3 | two banned adjectives in one clause | banned-vocab | FIRED |
| 4 | a banned verb hidden inside a camel-case hashtag | banned-vocab | FIRED, camel case split before matching |
| 5 | the Chicago page's program-wide unanimity superlative, verbatim | program-superlative | FIRED |
| 6 | the same string broken across two rendered lines | program-superlative | FIRED, joined-and-normalised index |
| 7 | a hyphenated primacy claim about the research | program-superlative | FIRED |
| 8 | a claim quantifying over all people | universal | FIRED |
| 9 | a claim quantifying over the majority of teams | universal | FIRED |
| 10 | a hospital system named inside a result set | measured-subject | FIRED |
| 11 | the same firm with its umlaut stripped | measured-subject | FIRED, NFKD then strip combining then casefold |
| 12 | the retired engine listed among live ones | meta-ai-live | FIRED |
| 13 | a tier name with a monthly price | pricing-on-mofu | FIRED |
| 14 | today's engine count attached to a dated run | lineup-mixed-with-measurement | FIRED |
| 15 | a plural engine count with no date in its block | engine-count-no-date | FIRED |
| 16 | a first sentence past the 125 character cut | truncation | FIRED |
| 17 | a body with no sentence terminator | truncation | FIRED |
| 18 | a body opening on a rhetorical question | rhetorical-opener | FIRED |
| 19 | a five word body | word-count | FIRED |
| 20 | an allowed engine name that contains a shorter allowed name | measured-subject | **stayed silent, as required** |

Row 20 is the span-aware control, and it is the only one that passes by staying
quiet. The short form is a sub-span of the long product name; non-maximal matches
are discarded, so an engine being measured does not read as a party inside a
result.

Rows 11 and 14 are worth keeping in any future scanner. Row 11 is why the
normalisation order is NFKD, then strip combining marks, then casefold, in that
order. Row 14 is the one the brief cares about most: today's lineup must never be
stated over a historical measurement.

**Two checks were found broken by their own controls and fixed rather than
believed.** `PROGRAM_NOUN` matched `ever` inside `everything` for want of a
trailing `\b`, and reported a superlative in this file's own how-to prose. And
the renderer's overlap assertion was comparing font metric boxes, which
legitimately overlap at tight leading; it now compares ink bboxes from
`textbbox`.

**The sweep then found ten real defects in this campaign's own copy**, all fixed:
two verbatim reproductions of the false Chicago superlative, two people-quantifying
universals in the prose above, two undated plural engine counts, and one 130 word
body. Two more surfaced on the pass that added this section, both from the
injection table quoting itself, which is why it now describes rather than
reproduces.

## What the scanner reads

Not the source. `render_facebook_static.py` appends every string handed to
`text()` into `DRAWN`, in draw order, and `scan.py` imports the module and reads
that list. A string edited in the source but never drawn cannot pass, and a
string drawn but absent from the source cannot hide. It also reads **the whole of
both `POSTS.md` files, headings and prose included**, which is how eight of those
ten defects were caught.

## Absolutes ruled on rather than auto-rewritten

The scanner reports `never`, `cannot`, `nothing` and `none` as warnings needing a
human ruling. All six occurrences were ruled situational, none is a universal:

| Where | Word | Ruling |
|---|---|---|
| drawn | `nothing` | "nothing usable in Spanish", "nothing" in English. A measured result about one engine's output on one prompt. |
| feed, link | `Nothing` | "Nothing here has been posted or scheduled." A statement about these files. |
| feed, link | `never` | "never a plan". An instruction to whoever posts, not a claim about the world. |
| feed | `none` | "none at all" in the mechanism table, describing a file that carries no number. |
| feed | `cannot` | Three occurrences, all in the Verification section, all about what this scanner is and is not able to detect. Claims about a program, not about people. |

## Contrast, measured twice

First against the token surface each string sits on, then against the real
background: every sheet is re-rendered with the type suppressed, and the
**lightest** background pixel inside each string's own ink bbox is sampled out of
that text-free control. The second number is the one that counts, because the
violet vignette measurably lightens the field under the eyebrow and the headline.

| Role | Colour | Token surface | Measured worst surface | Measured ratio | Floor | |
|---|---|---|---|---|---|---|
| card head, card note | `#7d838f` | `#101116` | `#101116` | **4.95:1** | 4.5 | PASS |
| domain | `#7d838f` | `#0a0b0e` | `#0e0d15` | 5.07:1 | 4.5 | PASS |
| eyebrow | `#a78bfa` | `#0a0b0e` | `#1e1831` | **6.27:1** | 4.5 | PASS |
| card value, card stat | `#f87171` | `#101116` | `#101116` | 6.82:1 | 3.0 | PASS |
| card row, card value | `#a78bfa` | `#101116` | `#101116` | 6.93:1 | 3.0 | PASS |
| deck, sub, card sub, stat label | `#9ba1ac` | `#0a0b0e` / `#101116` | `#11101c` | 7.26:1 | 3.0 / 4.5 | PASS |
| card value | `#fb923c` | `#101116` | `#101116` | 8.33:1 | 3.0 | PASS |
| card value | `#34d399` | `#101116` | `#101116` | 9.81:1 | 3.0 | PASS |
| headline | `#e8e9ed` | `#0a0b0e` | `#1b162d` | 14.43:1 | 3.0 | PASS |
| card row, card group | `#e8e9ed` | `#101116` | `#101116` | 15.54:1 | 3.0 | PASS |

**Worst body text 4.95:1. Worst large text 6.82:1.** The eyebrow is the string the
vignette costs the most: the token table says 7.23:1 and the real field under it
reaches `#1e1831`, which is 6.27:1. Both numbers are true; only the second is
about the delivered pixels.

`#8b5cf6` never reached a `text()` call. It is asserted at render time, not
promised: it is used as the fill of the accent rule and the row bars only, where
white on it would have measured 4.23:1 and failed.

## Lockup clear space, asserted not eyeballed

Every drawn element declares its rect. The lockup box is grown by the mark's own
height on all four sides and asserted against every other rect and against the
canvas edge. The mark's share of the stacked lockup is measured from the file's
alpha channel on every run, not hardcoded.

| Sheet | Lockup | Mark height | Reserve | Rects checked |
|---|---|---|---|---|
| four feed images, 1440x1800 | 192x150 at (120, 1530) | 104.6 px | (15, 1425) to (417, 1785) | 17 to 22 each |
| four link cards, 1200x630 | 97x76 at (64, 64) | 53.0 px | (11, 11) to (214, 193) | 6 each |

The lockup is downscaled only; the source raster is 512x400 and an upscale
assertion guards it.

## Files, probed on disk

| File | Probed | Bytes |
|---|---|---|
| `feed/fb-feed-01-description-1440x1800.png` | 1440x1800 PNG | 193 KB |
| `feed/fb-feed-02-language-split-1440x1800.png` | 1440x1800 PNG | 201 KB |
| `feed/fb-feed-03-placement-1440x1800.png` | 1440x1800 PNG | 197 KB |
| `feed/fb-feed-04-rank-vs-answer-1440x1800.png` | 1440x1800 PNG | 204 KB |
| `link/fb-link-01-description-1200x630.png` | 1200x630 PNG | 73 KB |
| `link/fb-link-02-madrid-1200x630.png` | 1200x630 PNG | 82 KB |
| `link/fb-link-03-chicago-1200x630.png` | 1200x630 PNG | 84 KB |
| `link/fb-link-04-bg004-1200x630.png` | 1200x630 PNG | 80 KB |

Body lengths, measured:

| File | Words | First sentence |
|---|---|---|
| feed 01 | 118 | 57 chars |
| feed 02 | 116 | 80 chars |
| feed 03 | 110 | 57 chars |
| feed 04 | 120 | 86 chars |
| link 01 | 115 | 84 chars |
| link 02 | 104 | 75 chars |
| link 03 | 102 | 77 chars |
| link 04 | 107 | 94 chars |

## Unverified, stated as such

- **No image was viewed inside Facebook's own renderer.** Sizes, contrast and
  clear space are measured on the files; how Facebook crops or compresses them at
  upload is not.
- **The Madrid page's exact wording moved between the run NOTES and the live
  page.** The NOTES quote "returned nothing usable in Spanish", the live page
  reads "returned nothing in Spanish". The copy uses "nothing usable", the weaker
  claim, so it is safe under either. Recorded rather than smoothed over.
- **`#4th` and `#1` are measured ranks and are exempt from the superlative
  check by construction.** That exemption is a judgement, not a measurement. If
  a future asset uses "top" or "best" as a marketing word rather than as a quoted
  rank, this scanner will not catch it.
- **Nothing here has been posted, scheduled or uploaded, and no git command was
  run.**
