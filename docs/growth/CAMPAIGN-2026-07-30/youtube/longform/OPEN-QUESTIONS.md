# Open questions, long-form brand introduction

Short by design. Each item needs a decision or a check before rendering.

---

## 1. The voice, and what changes either way

The script is written to survive all three options a parallel agent is currently
weighing: Constantin's cloned voice, a licensed synthetic voice, or him reading
it himself.

**What is already voice-neutral, and why.** Sentences average under 14 words.
There is no sentence that needs a held pause or an ironic lift to land. There is
no question mark in the narration at all, so no interrogative contour has to be
synthesised. Nothing depends on emphasis falling on a specific word.

### If it is a synthesised or cloned voice

- **Pace 140 to 145 words per minute.** Synthesis at 150 or above blurs the
  digit strings, and this script has several.
- **Insert explicit breaks, do not rely on the full stop.** 500ms after each
  sentence in sections 1 and 6, 250ms elsewhere. Section 1 is four short
  statements that need air between them and section 6 is three concessions
  delivered flat.
- **Render section by section and splice.** A single 380-second generation drifts
  in pace across its own length in every engine tested publicly, and a drift you
  cannot fix locally means regenerating the lot.
- **Shorten nothing further.** The sentences are already short. Shortening more
  makes it sound clipped, which reads as a machine rather than as a person being
  direct.

### If Constantin reads it

- **Add about 15 seconds of budget**, to 6:35. A human reading this material
  naturally slows on the numbers, which is correct and which synthesis will not
  do on its own.
- The line at 3:40, "the one we would most like to be wrong about", is the only
  line in the script with a dry note in it. A human can land it. Neither
  synthesis option will, and it is fine flat, so this does not gate the choice.

### Pronunciation list for a clone or a synthetic voice

The deliverable that makes the clone usable. Every proper noun, product name and
figure in the narration, with the wanted pronunciation.

| Written | Say | Note |
|---|---|---|
| BrandGEO | `BRAND-jee-oh` | Three syllables. **Not** `brand-GAY-oh` and **not** `brand-jee-EE-oh`. |
| GEO | `jee-oh` | Only if the acronym is ever spoken alone. It does not appear alone in this script. |
| ChatGPT | `chat-jee-pee-TEE` | Letters, not `chat-gippity`. |
| Gemini | `JEM-in-eye` | Google's own pronunciation. **Not** `jem-EE-nee`. |
| Claude | `klawd` | One syllable. |
| Perplexity | `per-PLEX-it-ee` | |
| Grok | `grok` | Rhymes with rock. One syllable. |
| Google AI Mode | `google, ay-eye, mode` | Letters for AI. |
| Google AI Overviews | `google, ay-eye, OH-ver-views` | Letters for AI. |
| Meta AI | `meh-tuh, ay-eye` | Appears once, at 3:28, described as retired. |
| getbrandgeo.com | `get brand jee-oh dot com` | Four spoken units. Many engines read the whole string as one token and produce noise. |
| the twenty-fourth of July | as written | The script already spells it out. **Do not feed a synthesiser `2026-07-24`.** Every engine reads an ISO date differently and several read it as three numbers. |
| 5 of 5 | `five of five` | Spelled out in the narration already. |
| 4 of 5 | `four of five` | |
| 2 of 5 | `two of five` | |
| 3 of 4 | `three of four` | |
| twenty nine euros | as written | **Do not feed `EUR 29` or `€29`.** Engines variously produce `E U R twenty nine`, `euro twenty nine` and `twenty nine E U R`. |
| French | `french` | Appears twice. Some voices apply a French accent to the following word; check the render. |

**One trap worth a listen on the first render.** At 2:54 the narration says
"once in French, once in English" and at 3:08 "French-language answers". Several
cloning engines shift phoneme set after the word French and mangle the word
following it. Listen to those two lines specifically.

---

## 2. Runtime, already decided but stated so it is visible

**6:20, at the short end of the 6 to 10 minute band.** Reasoning is in
`SCRIPT.md`. The honest inventory of real product and real results supports about
six minutes. The four minutes needed to reach ten would be motion graphics
restating claims already made, on a channel whose product is measurement.

**Confirm or overrule before any card is rendered**, because the cards are the
long pole and rebuilding them for a different runtime is the expensive mistake.

---

## 3. The universal at 5:14, flagged rather than silently kept

The narration says "Nobody controls that, and anyone selling you a guarantee is
selling you a guess."

`nobody` and `anyone` both quantify over people, which is what the shared brief's
universals rule bans. It is kept in the draft because the sentence is a
concession against our own commercial interest rather than a claim about anyone's
behaviour, and because the alternative readings are weaker.

**Safe rewrite, ready to drop in:**

> We cannot promise you a position in an AI answer. These systems expose no
> control that would make that promise keepable.

That asserts a property of the systems and cannot be refuted by a counterexample.
It is the shape the campaign converged on independently in run 6.

**Constantin's call.** Either version is defensible; only one of them survives a
strict scanner.

---

## 4. The price line at 6:06

The script closes with "There is a free tier. Paid plans start at twenty nine
euros a month."

The skill's rule is that a TOFU asset carries no pricing. This is MOFU, and the
rule as written does not forbid it. A six-minute brand introduction that never
says what it costs reads as evasive, which is a bad trade for a brand whose whole
position is that it shows its numbers.

**Verified against source, 2026-07-31:** `PLAN_LABELS` and `PLAN_ORDER` in
`planConfig.ts` carry `radar`, and `Account.tsx` line 46 lists it at `€29 / mo`.
`_terms_gate.js` line 141 includes `radar` in `SELF_SERVE_CHECKOUT_PLANS`, so it
is genuinely buyable and not a paper tier.

**One thing to decide.** The ruling sets Radar at **EUR 39 list, EUR 29 launch
for the first 100 customers**. `Account.tsx` displays the launch price with no
qualifier. The script follows the app. If the launch cohort fills, or if the
list price is what should be advertised, the line becomes "from thirty nine euros
a month" and the end card changes with it. **Do not render card `25-end-card`
until this is settled.**

---

## 5. What could not be verified

- **No performance data exists, for anything.** Nothing on this channel has ever
  been posted. So no claim in this video, and no decision in it, is informed by
  what has worked. The hook driver was chosen on the argument in `SCRIPT.md`, not
  on evidence, and it should be revisited once there is a week of real data.
- **Site allowances are not enforced by any constant.** The ladder table in
  `planConfig.ts` shows a sites column, 1 / 1 / 2 / 2 / 3 / 10 / 25, but there is
  **no `PLAN_SITES` constant anywhere** and the comment itself says the feature
  "has not shipped". The script therefore claims nothing about how many websites
  a plan covers, and nothing downstream should either.
- **The engine count is stale in several campaign documents.**
  `_shared/BRIEF.md` and `product/COPY.md` both say Free is ChatGPT. As of
  2026-07-31 `PLAN_ENGINES.free` is `['gemini']`, changed so a free signup could
  finish its own first collection inside the EUR 0.30 budget.
  **`product/COPY.md`'s Free block is wrong today and is outside this task's
  write scope**, so it is reported rather than edited. The long-form script names
  no engine for the free tier, so it is unaffected.
- **Radar is absent from `_shared/BRIEF.md`'s plan table**, which predates the
  ruling by one day. Same category of staleness, same handling.
- **Two scanners were run over these four files, both negative-controlled.**
  Results, per the brief's section 4 requirement to report injection counts:
  - **Dash and banned-vocabulary scan: clean, 11 of 11 injections fired.**
    Three dash characters (U+2014, U+2013, U+2212) and eight terms drawn from the
    shared brief's own banned list were injected one at a time. Each fired.
    Baseline restores to zero hits across all four files.
    **The payload terms are deliberately not spelled out here**, because a later
    scanner run over this folder would then go red on this audit record. Take
    them from `_shared/BRIEF.md` section 3 rule 2, which is where the list lives.
  - **Measured-subject scan: clean after one real fix, 4 of 4 variants fired.**
    The corpus of ten names was taken from the four source research pages. **It
    caught a genuine hit in `SCRIPT.md`**, where shot 1's direction had written
    the invented firm name out in order to say it must not be rendered. Naming it
    to forbid it still puts it in campaign copy, so the direction was rewritten
    to forbid it without quoting it. **A blind spot was found while controlling
    it:** the first version normalised `&` to whitespace, so the `and` spelling
    of a name containing an ampersand passed clean. Fixed by mapping `&` to
    ` and ` before matching. Both the ampersand and the `and` spellings now fire,
    as do the upper-cased and extra-whitespace variants.
  - **What these scanners do not cover.** Superlatives, universals and engine-
    lineup mixing were checked by reading only, and reading is what let the
    measured-subject hit above survive four passes. **A scanner over the
    delivered `.srt` and over the rendered card strings is still owed before this
    ships**, built the same way: write it, inject each defect one at a time,
    confirm it fires on each, restore, re-run.
- **The audio bed is unresolved.** The existing tracks are 27 to 44 seconds and
  were built for text-only cuts with no voice to duck under. See `ASSETS.md`
  section 2.3.
- **Capture C7 may be unshootable.** If no viewer account has real collection
  history, the Overview renders zero across all six dimensions. The fallback is
  written into `STORYBOARD.md`. Staging data to fill it is not an option.
- **Capture C8 renders measured subjects by name by design.** The competitor view
  shows real companies. Whether a tenant exists whose competitor set names nobody
  identifiable is unknown from here and needs Constantin's eyes on the actual
  screen.
