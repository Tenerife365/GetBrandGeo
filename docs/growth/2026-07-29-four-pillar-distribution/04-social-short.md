# 04. Short-form social: X single, Threads, Facebook

Twelve posts. Three channels, four pillars each. Written to the shared brief at
`00-BRIEF.md` and to `SKILL.md` sections 1, 3, 4 and 6.

**Status: DRAFT. Nothing here is scheduled or sent.**

---

## Read this before scheduling

**Register is deliberately different per channel.** `docs/linkedin-posts-2026-07-24.md`
is the voice calibration point and everything below sits *under* it in formality.
LinkedIn opens with a first-person observation and closes with a source line.
Threads opens mid-thought and closes with something a person can reply to.
Facebook opens with the reader's situation, not ours. None of the three carry the
`*Source:*` italic footer that the LinkedIn batch uses; it reads as a press
release on a social feed.

**Driver allocation, no repeats inside a channel:**

| Post | Pillar | Channel | Funnel | Driver |
|---|---|---|---|---|
| 1.1 | P1 | X single | TOFU | Contrarian |
| 1.2 | P2 | X single | TOFU | Curiosity gap |
| 1.3 | P3 | X single | TOFU | Concrete proof |
| 1.4 | P4 | X single | TOFU | Status threat |
| 2.1 | P1 | Threads | TOFU | Utility |
| 2.2 | P2 | Threads | TOFU | Curiosity gap |
| 2.3 | P3 | Threads | TOFU | Contrarian |
| 2.4 | P4 | Threads | TOFU | Concrete proof |
| 3.1 | P1 | Facebook | MOFU | Concrete proof |
| 3.2 | P2 | Facebook | MOFU | Status threat |
| 3.3 | P3 | Facebook | MOFU | Loss aversion |
| 3.4 | P4 | Facebook | MOFU | Curiosity gap |

**P1 does not repeat the earlier package.** `docs/growth/2026-07-29-grok-sixth-engine/`
already ships an X single on status threat ("ask your vendor which of theirs
do"), a Threads post on curiosity gap ("was web search switched on"), and a
Facebook post on loss aversion ("your report may be out of date"). All three P1
assets below take a different beat: the two-Google-surfaces distinction (1.1),
the remove-an-engine standard (2.1), and the four-way add/decline record (3.1).
No sentence is reused.

**No pricing anywhere in this file.** Every asset here is TOFU or MOFU. Prices
live in `08-gbp.md` only.

---

# Section 1. X, standalone quote posts (TOFU)

Standalone, not attached to a thread. No outbound links; a link in a standalone X
post suppresses reach and there is no MOFU destination these need to reach.
Character counts are plain Unicode code points, stated per post. All four sit
under 280 with room for X's own weighted-length rounding.

---

## 1.1. P1, TOFU, Contrarian

**269 characters.** Visual: **V1**.

> When a tool says it monitors Google, ask which Google.
>
> AI Mode is a tab people opt into. AI Overviews is the summary above the links on an ordinary search.
>
> Different reach, different answers. We count them as two engines because averaging them hides the one you need.

**Note:** the contrarian move is refusing the category's own shorthand. Everyone
writes "Google" as one engine. Source: `bg-021-retrieval-not-engine-count.html`,
the surface table. Do not add a link, the whole post is the payload.

---

## 1.2. P2, TOFU, Curiosity gap

**267 characters.** Visual: none, runs as text.

> 20 buyer categories. Four cities. Five AI engines, queried separately.
>
> In 10 of those categories, three or more engines independently named the same brand.
>
> In the other 10, no agreement at all.
>
> The split is not random and it has almost nothing to do with the city.

**Note:** the gap is deliberately left open. What decides the split is in BG-016
and in post 3.2, which is where the link lives. Do not resolve it here.

---

## 1.3. P3, TOFU, Concrete proof

**248 characters.** Visual: **V2**.

> One line in a Romanian answer began "2019. Bucate pe Roate a fost premiată".
>
> Our scorer read that leading 2019 as a list number and gave the brand rank 2019.
>
> List digits are trusted between 1 and 50 now. Everything outside that band returns null.

**Note:** this is the sharpest single artifact in the whole four-pillar set. A
real bug, a real client name, a real absurd output, a real fix, all in three
lines. Source: `bg-019.html`, the 1 to 50 band. Bucate pe Roate is BrandGEO's own
first client and appears by name on the published page already, so no permission
question arises.

---

## 1.4. P4, TOFU, Status threat

**247 characters.** Visual: none, runs as text.

> 222 AI responses. 56 buyer prompts. 7 cities. Read by hand, then published to Zenodo with a permanent DOI under CC BY 4.0.
>
> Anyone can check it, and the licence lets the engines quote it.
>
> Ask whoever measures your brand where their dataset lives.

**Note:** the threat is aimed at the reader's current vendor and is phrased as a
question the reader asks, never as an assertion about a named company. That
framing is not stylistic, comparison claims are a legal surface. The second line
is the one that lands with an SEO lead: an openly licensed paper is itself a
GEO asset, which is the argument the product makes.

---

# Section 2. Threads (TOFU)

Threads is not X with more room. It rewards a post that reads like one side of a
conversation already in progress, and reply volume drives distribution harder
here than anywhere else in this package. Every post below opens mid-thought and
ends on something repliable. No hashtags, no link, no sign-off.

---

## 2.1. P1, TOFU, Utility

**141 words.** Visual: none.

> Every AI visibility tool has an add-an-engine story. Ask for the remove-an-engine story instead.
>
> We retired Meta AI on 16 July. The models we could reach ran on training data with no web search in that path, so the answers looked current and structurally could not be. A business that launched this year was invisible to it. A competitor that closed two years ago could still be sitting at number three. Removing it lowered our engine count and we did it anyway.
>
> DeepSeek is out for the same reason. Copilot is out because Microsoft ships no public API, so anyone claiming to monitor it is measuring something adjacent and calling it Copilot.
>
> Two questions worth putting to whoever measures your brand. Was web search switched on for the run that produced my report. And what would make you drop an engine.

**Note:** ends on two flat statements rather than a question mark, which reads
less like bait on Threads and still pulls replies. Reply to every reply for the
first two hours.

---

## 2.2. P2, TOFU, Curiosity gap

**136 words.** Visual: none.

> Rome broke the pattern we found in every other city.
>
> We ran real buyer questions through five AI engines across seven cities. Most cities produced at least one category where three or four engines independently landed on the same brand. Paris gave the cleanest one anywhere: every engine that answered named Qonto as the top pick for French small business banking, in French and in English, no exceptions.
>
> Rome produced none. Not one category reached even three-engine agreement.
>
> What it produced instead was the opposite result inside single engines. One engine we tested at the time, Meta AI, which we have since retired, returned an identical, identically ordered five-restaurant list in Italian and in English.
>
> Perfect self-consistency. Zero agreement with anyone else. Each engine in Rome has built its own worldview and none of them transfer.

**Note:** Meta AI is named as a historical record of what it answered on a stated
collection date, which is the only legitimate mention per the brief. The clause
"which we have since retired" is load-bearing and must not be cut for length.
Source: `bg-016.html` and `bg-017.html`, Rome section.

---

## 2.3. P3, TOFU, Contrarian

**146 words.** Visual: none.

> Most tools in this category will hand you a rank for almost anything you ask them to score. Ours used to.
>
> The old version fell back to sentence position. Brand named in the third sentence of the answer, score it rank 3. That felt like a reasonable fallback and it was wrong on its own terms, because "third sentence to mention the brand" and "third-ranked recommendation" are not the same unit. Averaging them into one column was hiding information rather than adding precision.
>
> We removed the fallback instead of tightening it. A brand gets a number now only from a real numbered list, a bullet list whose lead-in explicitly says it is ordered, or a superlative grammatically tied to the brand name. Everything else returns null.
>
> A score that never says "I don't know" is not more precise. It is guessing somewhere you cannot see it.

**Note:** the closing line is adapted from the published LinkedIn post of
2026-07-24, deliberately, because it is the sharpest formulation of this pillar
and the audiences barely overlap. It is rephrased rather than copied. Source:
`bg-019.html`.

---

## 2.4. P4, TOFU, Concrete proof

**140 words.** Visual: none.

> The paper we published has a hole in it and we put the hole on page one.
>
> The design implied 280 engine-level responses across seven cities. 278 were actually recorded, two lost to a transient collection gap. Then 56 more came back as a recorded API error rather than an answer, every one of them ChatGPT, caused by a sustained quota failure on the account we were collecting with during the exact window we were gathering data.
>
> So the analytic dataset is 222 responses across four engines, and ChatGPT is excluded from the analysis rather than counted as an absence that says something about ChatGPT.
>
> We also named the single most noise-corrupted response in the whole program, and a Madrid answer recommending a restaurant that appears to have closed.
>
> A dataset someone can check beats one that only sounds authoritative.

**Note:** this is the pillar's real differentiator and it is uncomfortable on
purpose. Do not soften "hole". Source: `bg-017.html`, disclosed limits section.

---

# Section 3. Facebook, post with link preview (MOFU)

Facebook is the one channel here where an outbound link does not materially
suppress reach, so all four carry one. **No new image asset is needed for any of
these four.** Each destination already ships a correct `og:image`, verified on
disk and in the page head:

| Post | Destination | og:image on file |
|---|---|---|
| 3.1 | `/bg-021-retrieval-not-engine-count.html` | `images/bg-021-hero.png` |
| 3.2 | `/bg-016.html` | `images/bg-016-hero.png` |
| 3.3 | `/bg-018.html` | `images/bg-018-hero.png` |
| 3.4 | `/bg-017.html` | `images/bg-017-hero.png` |

Paste the URL, let the preview resolve, then delete the raw URL from the body
before posting. If a preview fails to render, run the destination through
Facebook's Sharing Debugger to force a re-scrape rather than uploading a
standalone image, which would drop the link.

---

## 3.1. P1, MOFU, Concrete proof

**105 words.** Link: `https://getbrandgeo.com/bg-021-retrieval-not-engine-count.html`

> We added two AI engines this week and turned two others down. The second half is the more useful story.
>
> An engine earns a slot with us only if we can query it with web search switched on, through a documented path, on every run that produces a customer's report. Grok passed, but only because we run it with the web plugin enabled. DeepSeek did not, because every model we can reach through OpenRouter answers from training data. Meta AI was retired in July for exactly that reason, which lowered our engine count.
>
> The full standard, and four questions worth putting to your current vendor:

---

## 3.2. P2, MOFU, Status threat

**111 words.** Link: `https://getbrandgeo.com/bg-016.html`

> In half the buyer categories we tested, the AI engines have already picked a winner.
>
> We ran 20 categories across four cities through five engines and compared every answer by hand. In 10 of them, three or more engines independently named the same brand. CRM software in London. Small business banking in Paris. Accounting software in Berlin. In the other 10, nothing lined up at all.
>
> If your category has already converged and the name it converged on is not yours, that is a specific, measurable gap rather than a vague worry. If it has not converged, nobody has won it yet.
>
> Which side you are on, and what decides it:

---

## 3.3. P3, MOFU, Loss aversion

**106 words.** Link: `https://getbrandgeo.com/bg-018.html`

> Over six weeks we found five separate ways our own scoring pipeline could miscount, and we published all five.
>
> A section heading from the AI's own answer counted as a competitor name. A bolded field label counted as a company. A medal emoji sitting exactly on the edge of a character budget changed a real client's result from rank 1 to no rank at all, because of heading depth and nothing else. Same answer, same praise, different score.
>
> Every fix is locked behind 156 hand-written assertions taken from real production responses.
>
> If your current report has never been wrong, it may be that nobody has looked:

---

## 3.4. P4, MOFU, Curiosity gap

**93 words.** Link: `https://getbrandgeo.com/bg-017.html`

> Same question, same city, same day. Asked in French you get one set of companies. Asked in English you get a different set entirely.
>
> Wealth management in Paris. The French-language runs converged on independent boutique patrimoine firms. The English runs converged on major international private banking divisions, which were almost entirely absent from the French answers. Not the same list reordered by language. A different class of provider considered at all.
>
> It is in the open-access paper we published from our seven-city dataset, alongside every limit in the data we could not close:

---

# Visual briefs

Format per `SKILL.md` 5.2. Numbered to the post each serves. Only two assets in
this file need a new image; Facebook is covered by existing `og:image` files and
Threads runs text-only by design, because a card on Threads costs reply volume
and reply volume is the metric this channel is being run for.

---

### V1. serves post 1.1 (X, P1)

```
ENGINE: flux
SUBJECT: Two stacked browser-chrome fragments, unlabelled by logo. Upper
         fragment shows a results page with an AI summary block sitting above a
         list of blue links. Lower fragment shows the same query in a separate
         tab view, the links absent, a single generated answer filling the
         frame. A thin violet rule runs between them with the words "not the
         same product" set small and lowercase.
COMPOSITION: 16:9, split horizontally 50/50, generous dead space at the outer
         margins so the two fragments read as specimens rather than screenshots.
         No cursor, no browser buttons, no address bar text.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Flat, no vignette. Accent glow confined to the dividing rule and the
         AI summary block's left edge.
MOOD: Forensic. Two exhibits laid on a dark table, not a product ad.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, recognisable
          Google branding, real logos, fake UI copy long enough to read
ASPECT: 16:9
```

**Do not render any real search-engine logo or wordmark.** The post already
names the two surfaces; the image only has to show that they are shaped
differently.

---

### V2. serves post 1.3 (X, P3)

```
ENGINE: flux
SUBJECT: A single line of monospace text on a dark card, reading
         "2019. Bucate pe Roate a fost premiată". Directly beneath it, two
         result chips side by side: one struck through, reading "rank 2019",
         one clean, reading "null". A narrow band marked "1 to 50" sits below
         both, with the 2019 value plotted far outside it.
COMPOSITION: 16:9, text left-aligned and dominant, chips lower right, band
         spanning the lower third. Heavy negative space top right.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Even. Faint violet underglow beneath the "null" chip only, so the
         correct answer is the one that is lit.
MOOD: Dry, technical, slightly funny. The absurdity of rank 2019 does the work.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, red error icons,
          warning triangles, emoji
ASPECT: 16:9
```

**Proof the Romanian diacritic before export.** Most image models drop or mangle
"ă". If the render will not hold it, set the line as flat text in post rather
than accepting a misspelling, because the whole asset is a claim about
precision.

---

## Scheduling notes

- **Never run an X post and its Threads counterpart within the same 24 hours.**
  The two audiences overlap hard at the top of this category and a near-duplicate
  reads badly on both.
- Suggested order across the week, strongest first: 1.3, then 3.2, then 2.1,
  then everything else spread one post per channel per day.
- 1.3 and 2.3 are the same pillar. Leave at least 48 hours between them.
- Verify the four Facebook destinations return 200 and that the preview resolves
  before scheduling. `bg-021-retrieval-not-engine-count.html` is confirmed in
  `sitemap.xml` and linked from `blog.html`; the other three are long-established.
- **Hold all twelve until the send gate clears.** Nothing in this folder is
  approved for publication.

## Sourcing and flags

- Every figure traces to a published page: 20 categories / four cities / 10 of 20
  consensus / Qonto sweep to `bg-016.html`; 222 responses / 56 prompts / 7 cities
  / 278 of 280 / 56 ChatGPT errors / Paris language finding / DOI
  10.5281/zenodo.21395598 to `bg-017.html`; five false positives / 156 assertions
  / medal emoji to `bg-018.html`; 1 to 50 band / the 2019 case / removed sentence
  fallback to `bg-019.html`; Meta AI retirement 16 July / DeepSeek / Copilot /
  Grok web plugin / two Google surfaces to `bg-021-retrieval-not-engine-count.html`.
- **No engine count, price, prompt cap or refresh cadence is stated anywhere in
  this file.** That was a deliberate scope choice, not an oversight. Those
  numbers moved twice on 2026-07-29 and they belong in `08-gbp.md`, which is the
  one asset here that has to carry them.
- **No `ai_results` row counts are used.** The brief's three prohibitions are
  respected in full: no Grok or AI Overviews rate, no attribution of all-client
  rows to a brand, no trend language.
- **Discrepancy found in the brief, flagged not acted on.** `00-BRIEF.md` P2 says
  "the 37 city pages". On disk there are 38 `ai-visibility-*.html` files, of which
  **27 are cities**, 10 are industries, and one is the Index issue. The 37 is
  almost certainly 27 cities plus 10 industries counted together. No asset in this
  file states a city-page count, so nothing here is affected, but the number
  should be corrected in the brief before another agent quotes it.
- No em dashes or en dashes in this file. Checked directly, not assumed.
