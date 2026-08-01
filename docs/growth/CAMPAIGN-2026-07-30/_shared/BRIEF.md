# Shared brief, CAMPAIGN-2026-07-30

Binding on every agent producing an asset in this package. Read all of it before
writing anything. Where this contradicts `CLAUDE.md`, the skill file, or any
`docs/` prose, **this file wins, because it was verified against source on
2026-07-30.** Where this contradicts the repo itself, the repo wins and you flag
the mismatch in your report.

---

## 1. What this package is

One folder holding the entire campaign, every channel, so nothing has to be
assembled at posting time. Each channel folder holds its media and one
`POSTS.md` giving the exact text for each file, keyed by filename.

The video half already exists: 36 vertical cuts across nine hourly runs, plus 8
bilingual cuts. The gaps this brief closes are **static images** (there are none,
so no ordinary feed post can be made) and **text for the five channels that have
none** (LinkedIn, X, Threads, Google Business Profile, and the blog).

---

## 2. Product truth, verified against source 2026-07-30

**Do not take engine counts or prices from `CLAUDE.md`, from the growth skill
file, or from any published page. Both are stale on the engine lineup.**

### Engines, from `brandgeo-dashboard/src/lib/planConfig.ts` `PLAN_ENGINES`

| Plan | Engines | Count |
|---|---|---|
| Free | ChatGPT | 1 |
| Essentials | ChatGPT, Gemini, Claude | 3 |
| Growth | + Perplexity, Google AI Mode | 5 |
| Growth PRO | + Grok, Google AI Overviews | **7** |
| Managed | same as Growth PRO | 7 |
| Enterprise | + Copilot, DeepSeek, which are still `COMING_SOON` | 7 live |

**Grok and Google AI Overviews went live 2026-07-29**, one day before this
campaign. `CLAUDE.md` says five and is stale. Google AI Mode and Google AI
Overviews are two different products and both are measured: one is a tab the
user opts into, the other is the summary block on an ordinary results page.

**Meta AI is retired** and is in no plan set. It is `COMING_SOON` alongside
Copilot and DeepSeek, none of which collect. **Never list Meta AI as live.**

### Prices, from `planConfig.ts` and `pages/Account.tsx`

Free, Essentials EUR 99/mo, Growth EUR 299/mo, Growth PRO EUR 449/mo, Managed
from EUR 1,500/mo, Enterprise custom. `pro` is a legacy tier, never offered.

### The historical-versus-current rule, and it is the one most likely to trip you

Every measured finding in this campaign comes from a collection run on a
specific date, when a specific set of engines was live. **A finding keeps the
denominator it was measured with.** A 2026-07-10 Madrid run collected four
engines, one of which was Meta AI, and ChatGPT failed. That is what it is.

So:

- **Reporting a measurement:** use that run's engines and date, name them if the
  cut names them, and never restate the count as today's lineup.
- **Describing what the product does now:** use the seven above.
- **Never mix the two in one sentence.** "We measured seven engines in Madrid in
  July" is false. "We monitor seven engines; the Madrid run predates two of
  them" is true and is the shape to use if both must appear.

---

## 3. Content rules, non-negotiable

1. **No em dashes, no en dashes, no minus signs used as punctuation.** Comma,
   full stop, or restructure. This is the single most-violated rule in the
   campaign so far and it has been caught in agents' own section headings, not
   just in copy.
2. **Banned vocabulary:** delve, unlock, unleash, elevate, harness, leverage as
   a verb, game-changer, supercharge, revolutionize, seamless, robust,
   cutting-edge, transformative, "dive in", "in today's fast-paced world",
   "it's not just X, it's Y".
3. **No rhetorical question as an opener.** A question may close a post.
4. **No superlatives about the research program.** No "first", "only",
   "strongest", "most unanimous", "cleanest". Several published city pages
   assert these about themselves and **they contradict each other**, so a page
   asserting a program-wide maximum is not a source for it. This is an open
   corpus defect, not a style preference.
5. **No universals.** A claim quantifying over all people or all businesses
   ("nobody does this by hand", "every brand is invisible") is refuted by one
   counterexample. Describing one reader's situation is fine: "you do not get a
   copy" is a true statement about how AI answers work.
6. **No named measured subject.** The research pages name real companies. Do not
   put any of them in campaign copy. Match with NFKD normalisation, then strip
   combining marks, then casefold, in that order, or `Engel & Völkers` will pass
   while `Engel & Volkers` fires.
7. **Every figure carries its denominator, its date and its scope**, in the same
   paragraph as the finding, not in a footnote. If a figure cannot carry them in
   the space available, drop the figure.
8. **No invented customer proof.** No testimonials, no case-study numbers, no
   logos, no review quotes.
9. **No pricing on a TOFU asset.** No BOFU asset without one.

---

## 4. Verification, and this is the part that actually matters

**A scan that passes everything is indistinguishable from one that does not
work.** Four checkers in this campaign, including the coordinator's own, were
found broken by this rule alone. One silently globbed zero files and had been
reporting "clean" for hours.

So, for every scanner you write:

1. Write the scanner.
2. **Inject each defect it claims to catch, one at a time, and confirm it fires
   on each.** Report the count, "N of N injections fired".
3. Restore, re-run, confirm exit 0.
4. If a check cannot be made to fire, it is blind. Say so and fix it. Do not
   report a clean result from a checker you have not seen go red.

Specific traps already paid for:

- **Camel-case hashtags evade word-boundary matching.** `#FirstEverStudy` passes
  `\bfirst\b`. Split camel case before matching.
- **A wrapped on-screen line matches nothing.** Index each text block both
  per-line and joined-and-whitespace-normalised.
- **Sub-span matches.** `Google` and `Google AI` are sub-spans of the permitted
  `Google AI Mode`. Make the matcher span-aware and discard non-maximal matches.
- **Scan the whole delivered file, including your own headings.**

---

## 5. Visual system

Every image in this package must be renderable, reproducible from a script that
is checked in, and must carry the logo.

**Renderer to reuse:** `docs/growth/grok-launch/images/_build/render_launch_images.py`.
Pillow only. No matplotlib, no cairosvg, no ImageMagick, none of which are
installed. Shapes are drawn into 8x supersampled masks and downsampled with
Lanczos. Read it before writing a new one; it already solves the hard parts.

**Fonts:** `_shared/fonts/` holds Inter Regular, Medium, SemiBold, Bold,
ExtraBold. Inter is not a system font on this machine.

**Logo:** `_shared/logo/` holds the mark, the wordmark, and the lockup, all
transparent. **Every image gets the lockup.** Place it with clear space of at
least the mark's own height on every side, and never scale it above its native
raster: 512px wide for the lockup and the wordmark, 512px tall for the mark.

**The source is `docs/growth/brand-identity-2026-07-29/v3/`, and it is NOT
`brand-kit-2026-07-29/`.** This line used to say the opposite and the whole
package was rendered from the wrong logo because of it. The brand kit holds a
retired mark, a blue-to-violet `b` with a teardrop base and a dark navy disc in
the counter. The live mark, the one both properties serve today from
`brandgeo/web/logo.png` and `brandgeo-dashboard/public/logo.png`, is the flat
violet monoline `b` in v3.

Do not copy logo files in from anywhere. Run `python _shared/build_logo_v3.py`,
which draws the mark from v3's own geometry and sets the wordmark in
`_shared/fonts/Inter-Bold.ttf`, then re-run the channel renderers. Two things
that build guarantees and a hand copy does not: the wordmark is proven to be
real letterforms rather than a silent font fallback, and the lockup's measured
footprint is held fixed, which is what stops every layout that places it from
quietly rescaling.

`python _shared/check_logo.py` scans the whole package for the retired art by
its pixels and names any file carrying it. Run it before calling a render done.

**Tokens**, from `docs/growth/channel-specs-2026-07-29.md`:

| Token | Value | Use |
|---|---|---|
| canvas | `#0a0b0e` | page |
| surface | `#101116` | card |
| raised | `#16171e` | raised card |
| border | `#23242b` | hairline |
| border strong | `#32333c` | |
| accent | `#8b5cf6` | **fill only**, 4.65:1 |
| accent strong | `#7c3aed` | CTA fill, 5.7:1 |
| accent text | `#a78bfa` | accent **words**, 7.23:1 |
| text | `#e8e9ed` | primary, 16.22:1 |
| text 2 | `#9ba1ac` | secondary, 7.58:1 |
| text 3 | `#7d838f` | muted, 5.17:1 |
| ok / partial / bad / info / warn | `#34d399` `#fb923c` `#f87171` `#c4b5fd` `#fbbf24` | status |

`#8b5cf6` is a **fill**, never a text colour. White on it measures 4.23:1 and
fails AA. Accent words use `#a78bfa`.

Dark canvas always. Never a white background.

**Measure contrast, do not eyeball it.** Every text colour against the surface
it actually sits on, sRGB relative luminance, 4.5:1 for body and 3:1 for large
text and non-text indicators. Report the measured ratios.

---

## 6. Where the verified claims live

Do not invent a finding. Every claim already exists, sourced, in one of:

- `docs/growth/reel-campaign-ab/run-*/[platform]/NOTES.md`, 36 files. Each holds
  a sourcing table quoting the live HTML it came from, plus the exact strings
  drawn on screen.
- `docs/growth/reel-campaign-ab/captions/`, the caption files for the video
  channels, already voice-calibrated and scanned.
- `docs/growth/reel-campaign-ab/bilingual/*/NOTES.md`.
- The published research: 27 city pages, 10 industry pages, 10 comparison pages
  in `brandgeo/web/`.

**Read the NOTES before writing about a cut.** The claims are load-bearing and
several carry disclosed limits that the copy has to inherit.

Three known corpus defects, so do not source from them:

- `bg-004.html` names a contradictory engine lineup including Copilot. Unusable
  for any engine count.
- Chicago, Boston, Madrid and Paris city pages each assert a program-wide
  superlative, and they are mutually exclusive. Use their tables, not their
  claims.
- Three FAQPage JSON-LD blocks were invalid on Baltimore, Charlotte and Detroit
  and have been fixed; validate any JSON-LD you emit.

---

## 7. Voice

Calibrate against the published archives, not against an idea of a caption:
`docs/linkedin-posts-2026-07-24.md`, `docs/linkedin-post-bg-018-2026-07-22.md`,
`docs/linkedin-teaser-posts-published-paper-2026-07-16.md`,
`docs/linkedin-company-posts-2026-07-15.md`. **Read them.** Report the voice
traits you extracted so the calibration can be checked.

What those four files actually do, already extracted by two agents
independently:

- **Open on the thing itself**, flat and declarative. Never a tease, never a
  question.
- **The strongest line is usually an admission.** "The last two pieces of
  research we published were both about mistakes in our own product." The brand
  persuades by conceding.
- **Numbers arrive naked, with denominator and date**, and the limit is stated
  in the same breath as the finding.
- **Close on a practical implication addressed to the reader's next decision**,
  not a CTA verb. Product mention, if any, is one narrow sentence at the end
  claiming only what the pipeline literally does.
- Short declaratives. Plain verbs. One idea per line.

---

## 8. Rules of engagement

- **Write only inside the paths your own task names.** Other agents are working
  in this folder concurrently. Do not touch a folder you were not given, do not
  read-modify-write a shared file, and do not tidy anything.
- **Do not run any git command.** Not add, not commit, not stash.
- **Do not post, schedule, or send anything anywhere.**
- **Do not touch** `brandgeo/web/` or `brandgeo-dashboard/`. This campaign
  produces drafts under `docs/`.
- Report what you could not verify as unverified. A gap reported is cheap. A gap
  papered over costs a research page's credibility, which is the product.
