# Run 20260730-0613

**Hook driver: #3, curiosity gap, SECOND PASS.** Replication round. Next run
advances to #4, contrarian, second pass.

**Music: `tension-minor`** on all four, held constant for all nine runs.

---

## Status

| Platform | Silent | Scored | Audio streams (silent) | Band | Scored start |
|---|---|---|---|---|---|
| instagram | 27.000s | 27.000s | 0 | 20 to 30 s, yes | 0.0027 |
| facebook | 27.000s | 27.000s | 0 | 20 to 30 s, yes | 0.0027 |
| tiktok | 30.000s | 30.000s | 0 | 25 to 40 s, yes | 0.0035 |
| youtube | 44.200s | 44.200s | 0 | 30 to 45 s, yes | 0.0029 |

## Safe zones, union AND type

Reported both for the first time, per the rule added after run 8. Where they
coincide on an edge, type owns it and the number responds to a copy edit.

| Platform | Union headroom | Type headroom | Right edge owned by |
|---|---|---|---|
| instagram | 90 / 101 / 79 | same right | **type** |
| facebook | 452 / 83 / 73 | same right | **type** |
| tiktok | 46 / 429 / 69 | same right | **type** |
| youtube | 346 / 358 / 100 | 411 / 359 / 99 | type |

All four now have the right reserve testing copy rather than furniture. Three
switched a bottom progress bar for a vertical left rail specifically to achieve
that.

## Two spines, both new, both away from run 3

Run 3 was a cross-city category contrast. This pass split:

**Language divergence** (facebook, tiktok, youtube). One prompt, two languages.
facebook found the reversal inside a single Madrid prompt: one engine full in
English and nothing usable in Spanish, another doing the exact reverse. youtube
spanned three cities in one arc. tiktok closed on `NOT A REORDER. / A DIFFERENT
SET OF FIRMS. / THE LANGUAGE PICKED THE SHORTLIST.`

**The fabricated firm** (instagram). `Two AI engines returned the same firm
name. / That firm does not exist.` Then it recurred, another city, another
category, same two engines.

## The instagram finding is the best story in the corpus

Verified independently against both source pages: ChatGPT and Gemini
independently rendered the real firm "McDermott Will & Emery" as **"McDermott
Will & Schulte"**, a name that does not exist, and it recurred in a second city
and a different category from the same two engines. Both runs 2026-07-24, all
five engines returning usable data with no collection errors, so the denominator
is genuinely five.

**This deserves its own research page.** A reproducible cross-city,
cross-category hallucination of a specific firm name, caught by measurement, is
the thing the product exists to find, and it is currently a bullet on two city
pages.

The agent did not name the two engines, reasoning "the repeat is the point, not
the identity". Defensible for a TOFU ad. Note the campaign rule PERMITS naming
the engine being measured, so this was a choice rather than a constraint, and
for a research post naming them is the stronger and still-defensible version.

## Denominator discipline, again decisive

Madrid and Paris are x/4 pages: ChatGPT's collection failed on every prompt in
both. So facebook stated **no engine count at all** ("one engine", "another
engine" need no denominator), tiktok showed `3 ANSWERS` and `NONE` as raw counts
of answers labelled by language with no denominator near them, and youtube put
no denominator on screen anywhere and rejected Paris's 4/4 unanimous sweep, the
strongest figure available, for that reason.

## Five verification findings, four of them bugs in the checkers

**1. The n-gram diff was too weak in two different ways, and both diffs reported
CLEAN before their controls existed.** tiktok's compared n-grams inside each
`drawtext`; run 3 draws one sentence as four stacked layers, so a seven-word
reuse passed. That is exactly how the run 8 reuse got in. instagram's used a
3-gram floor and a verbatim previous line passed because the earlier pass
rendered `Companies` and `converge.` on separate lines. Fixes: diff SCENE
STREAMS, floor at 2 with a function-word exemption.

**2. Name scanners matching raw bytes fail on diacritics.** facebook's control
showed `Engel & Völkers` firing while `Engel & Volkers` passed clean, walking a
484-name corpus. Fixed with NFKD folding. Propagated to the bilingual agents
mid-flight, where it matters far more.

**3. Two harvester bugs**, found only because controls ran. youtube's candidate
regex used `\s+` and crossed newlines, fabricating names like `'Common
Questions\n\nDoes'`; its lexicon came from four pages on which `questions` never
appears lowercase, so it was classed a proper noun and fired on our own copy.
Lexicon now spans the corpus, 6,661 tokens against 885.

**4. False positives that would have failed clean copy.** tiktok's harvester
returned 7 (`Wealth`, `Asked`, `Coverage`), fixed with a corpus-derived oracle:
a capitalised token is proper-noun-ish only if the corpus never uses it
lowercase.

**5. Wrong instrument, quietly.** tiktok's first-1.5s check by ink count would
have reported its second cut as a 129px event. Changed-pixel count reports
34,972 against a non-cut maximum of 297. Ink count measures how much is drawn,
not how much changed.

## A fifth corpus defect, and it is systemic

youtube found Madrid and Paris BOTH claiming a program-wide maximum, from the
same 2026-07-10 collection, mutually exclusive. Verified:

- madrid: "the most unanimous result of any city tested so far" and "the
  strongest consensus of any category, any city, in this program so far"
- paris: "the cleanest, most unanimous consensus found anywhere in this research
  program"
- chicago, 2026-07-24: "the first fully unanimous result measured anywhere in
  this research program", asserted four times including inside its FAQPage
  JSON-LD
- boston, same day as chicago: "the most 5/5-dense city measured in this
  research program", reporting three unanimous results

At most one page in each pair can be right. Filed as a corpus-wide audit task
superseding the three narrower ones, because the shape is systemic: a claim
about the whole program made from inside a single page, which is the one place
it cannot be verified.

## Previous run verification, 20260730-0513

All four in band, silent masters at zero audio streams, scored at one with
matching durations. Seven em dashes fixed in `facebook/NOTES.md`.

**The coordinator's own scanner was negative-controlled for the first time and
failed.** It produced no output at all, not "clean", because a shell variable
did not expand inside a heredoc so it globbed zero files. Every "totals dash=0"
reported earlier in this campaign came from a scanner never proven able to go
red. Re-run with an explicit path it fires on all four defect types and stays
silent on a clean control.

## Upload guidance

Silent masters for organic, paired with each platform's in-app audio. Scored
cuts for paid, embeds and decks.

## Verification of this run, performed 2026-07-30 08:31 before run 10

All four platforms PASS on video. Measured, not asserted:

| Platform | Silent | Scored | Audio silent/scored | Ink box | Headroom T/B/R | Control |
|---|---|---|---|---|---|---|
| instagram | 27.000 | 27.000 | 0 / 1 | x100..821 y327..1399 | 107 / 101 / 79 | 0 |
| facebook | 27.000 | 27.000 | 0 / 1 | x100..827 y676..1381 | 456 / 99 / 73 | 0 |
| tiktok | 30.000 | 30.000 | 0 / 1 | x64..804 y250..1483 | 50 / 77 / 76 | 0 |
| youtube | 44.200 | 44.200 | 0 / 1 | x177..799 y526..1463 | 346 / 77 / 101 | 0 |

Every silent master has zero audio streams, every scored cut has exactly one,
durations match to within 50ms and all four sit inside their platform band. The
ink box is the UNION across five sampled times, not one frame, so furniture
appearing only near the end is included. The control region reports 0 ink on
every cut, which is what makes those headroom numbers mean anything.

Ink boxes now include the brand lockup composited into TikTok and YouTube after
this run shipped. TikTok's top headroom of 50 is the tightest number in the run
and comes from its top wordmark, not from copy.

**Every dash and banned-word hit was a false positive and the checker was
wrong, not the notes.** All of them sit inside the agents' own negative-control
injection tables, which by design contain `seamless`, `SEAMLESS AND ROBUST`,
`delve into it` and injected em dashes as proof their scanners fire. A scan that
reads an injection table and reports the injections is measuring the wrong
thing. Same class as scanning a `_build/` folder.

One genuine defect, fixed: `youtube/NOTES.md` prose used `unlock`, now
`follow-up`. Prose only, nothing rendered.

No Grok or AI Overviews percentage anywhere in the run.
