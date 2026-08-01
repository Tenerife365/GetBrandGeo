# X, CAMPAIGN-2026-07-30

Two threads and two standalone posts. All four assets are TOFU, the ask is soft,
and there is no pricing anywhere. Nothing here has been posted or scheduled.

Every figure carries its denominator, its date and its scope in the post that
states it, because a post on X is read alone and quoted alone. The sourcing
table at the end gives the page each figure was read out of.

Images are in `x/images/`, rendered by `x/_build/render_campaign_images.py`.

---

## Thread A: the firm that does not exist

**Image on post 1:** `images/x-thread-a-firm-that-does-not-exist-1600x900.png`

### Post 1

```text
Two of the five AI engines we ran returned the same law firm name. That firm does not exist. Chicago, corporate law, collected 24 July 2026. All five engines returned usable data on every prompt, no collection errors.
```

### Post 2

```text
It was not a typo. Both engines took a real firm and swapped one of the names in it for a name from somewhere else. What comes back reads like a firm you could look up and instruct. There is no such firm.
```

### Post 3

```text
Then it happened again. Boston, same collection date, a different category: biotech and life sciences law. Same invented name. Same two engines, ChatGPT and Gemini. Again five engines fired and five returned usable data.
```

### Post 4

```text
We left it in the published dataset instead of correcting it. Two engines producing the identical error independently, in two cities, in two categories, is the finding. Cleaning it up would have deleted it.
```

### Post 5

```text
The other three engines did not produce that name. So this is not a fact about AI answers in general. It is a fact about some engines, in categories built from a long tail of similar local firms.
```

### Post 6

```text
The invented firm is the easy case, because you can check that it does not exist. The hard case is the near miss: your name merged with another, a trading name you dropped, a wrong legal suffix. Those read as correct.
```

### Post 7

```text
Both runs are published with their prompts and their per-engine results. If you want to know which version of your own name is coming back, that is a thing you can check. getbrandgeo.com
```

---

## Thread B: the language picked the shortlist

**Image on post 1:** `images/x-thread-b-language-picked-the-shortlist-1600x900.png`

### Post 1

```text
We asked one question twice, in French and in English: best wealth management advisors in Paris. What came back was not the same list reordered. It was a different set of firms. Paris, collected 10 July 2026.
```

### Post 2

```text
The French answers named independent boutique French firms. The English answers named large international private banks. Same city, same category, same day. The language of the question is what changed, and nothing else did.
```

### Post 3

```text
One boutique firm appeared in three of the four French-language answers and in zero of the English ones. Four answers per language, one from each engine that responded that day.
```

### Post 4

```text
The limit, stated plainly. Four engines ran on 10 July 2026. ChatGPT's collection failed on every Paris prompt, and one of the four that did run has since been retired from our lineup. There is no engine consensus figure here and we are not offering one.
```

### Post 5

```text
What survives that limit is the shape of the result. A firm that publishes only in French was not ranked lower in the English answers. It was not in them at all.
```

### Post 6

```text
If you sell in more than one language, AI visibility is not one number. It is one number per language, and the two can disagree about who your competitors are.
```

### Post 7

```text
The Paris run is published with its prompts, its per-language answers, and the ChatGPT failure disclosed on the page rather than dropped. Worth checking your own category in both languages. getbrandgeo.com
```

---

## Standalone 1: the exact prompt and the exact five answers

**Image:** `images/x-standalone-1-one-question-five-engines-1600x900.png`

```text
One buyer question, five AI engines, 24 July 2026: "Top-rated property management companies in Chicago". One company came back from all five. ChatGPT 1st, Claude 1st, Perplexity 2nd, Gemini 4th, Google AI Mode named it without ranking it. getbrandgeo.com
```

The Gemini row is the point of posting this. A proof post works because the
reader can go and check, so the row that weakens the story stays in.

---

## Standalone 2: what a 5 of 5 actually counts

**Image:** `images/x-standalone-2-what-a-five-of-five-counts-1600x900.png`

```text
A 5 of 5 in an AI visibility report can mean five engines agreed. In our own Rome run, 10 July 2026, it means one engine returned five names, in two languages. Ask what the 5 counts before you read it as consensus. getbrandgeo.com
```

---

## Character counts, counted the way X counts

Counted programmatically by `x/_build/scan_copy.py`, not estimated. Unicode
code points, with any URL replaced by 23 characters regardless of its real
length, per X's own transformed-URL rule. `getbrandgeo.com` is 15 characters of
text and counts as 23.

| Post | Characters | Limit | Headroom |
|---|---|---|---|
| Thread A post 1 | 217 | 280 | 63 |
| Thread A post 2 | 204 | 280 | 76 |
| Thread A post 3 | 220 | 280 | 60 |
| Thread A post 4 | 206 | 280 | 74 |
| Thread A post 5 | 195 | 280 | 85 |
| Thread A post 6 | 217 | 280 | 63 |
| Thread A post 7 | 194 | 280 | 86 |
| Thread B post 1 | 208 | 280 | 72 |
| Thread B post 2 | 224 | 280 | 56 |
| Thread B post 3 | 177 | 280 | 103 |
| Thread B post 4 | 254 | 280 | 26 |
| Thread B post 5 | 161 | 280 | 119 |
| Thread B post 6 | 159 | 280 | 121 |
| Thread B post 7 | 213 | 280 | 67 |
| **Standalone 1** | **262** | **280** | **18** |
| **Standalone 2** | **238** | **280** | **42** |

The two standalones are the ones the task caps at 280; every thread post is
under it too, so each can be quoted, screenshotted or posted on its own without
being truncated.

---

## Every figure, and the page it was measured on

Read out of the live HTML in this repo, not recalled. No figure here is
third-party, so nothing traces to a page while tracing to no BrandGEO
measurement.

| Claim | Source | Wording on that page |
|---|---|---|
| Two engines returned a firm name that does not exist, Chicago, corporate law | `brandgeo/web/ai-visibility-for-chicago.html` | "for corporate law, both ChatGPT and Gemini independently rendered the real firm [name] as [name], a name that doesn't exist" |
| The identical name recurred in Boston, biotech and life sciences law | `brandgeo/web/ai-visibility-for-boston.html` | "This is the identical error already documented in Chicago's corporate-law dataset, appearing independently in the same two engines" |
| Both runs 24 July 2026 | both pages | "Original research, data collected 2026-07-24" |
| Five engines fired, five returned usable data, no collection errors | both pages | "All 5 engines returned usable data on every prompt this run, no collection errors" |
| The five engines in those runs | both pages | "each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity" |
| We kept the error as reported | both pages | "Kept as reported rather than silently corrected, since two engines making the identical error independently is itself a notable data point" |
| One prompt, French and English, Paris wealth advisors | `brandgeo/web/ai-visibility-for-paris.html` | prompt pair: "Meilleurs conseillers en gestion de patrimoine a Paris" / "Best wealth management advisors in Paris" |
| French answers named boutique French firms, English answers named international private banks | same page | "French-language answers consistently named independent, boutique French patrimoine firms ... English-language answers instead converged on major international private banks" |
| Three of four French-language answers, zero English | same page | "appeared in 3 of 4 French-language responses and in zero English-language ones" |
| Not a re-ranking | same page and `bg-017.html` | "This isn't the same brands reordered by language ... it's a genuinely different competitive set" |
| A French-only publisher is absent from the English set | same page | "structurally invisible to English-language AI searchers in this category" |
| Paris ran four engines on 10 July 2026, ChatGPT's collection failed | same page, data-quality note | ChatGPT recorded `status: error` on every Paris prompt |
| The prompt behind standalone 1 | `brandgeo/web/ai-visibility-for-chicago.html` | prompt card: "Top-rated property management companies in Chicago" |
| The five per-engine results | same page | "appears in every single one of the 5 engines' responses ... ChatGPT and Claude both rank it #1, Gemini names it #4, Google AI Mode surfaces it by name ... Perplexity ranks it #2" |
| Rome's 5 of 5 counts restaurants from one engine across two languages | `brandgeo/web/ai-visibility-for-rome.html`, via `CAMPAIGN-2026-07-30/bilingual/rome/NOTES.md` section 2.2 | "The page's 5/5 counts restaurants from one engine across two languages. It is not five engines agreeing" |

---

## Restraints, each of which cost a stronger post

1. **No measured subject is named.** The pages name the real firm, the invented
   firm, the Chicago property manager, the Paris boutique, the two international
   banks and the Rome restaurants. Every one of them is the SUBJECT of a
   measurement, the finding is about them, and none agreed to appear in
   advertising. Naming the ENGINE is a different act and is allowed: ChatGPT,
   Claude, Gemini, Perplexity and Google AI Mode are the instruments, and the
   product is undescribable without them.
2. **No superlative anywhere.** Chicago asserts "the first fully unanimous
   result measured anywhere in this research program", Boston asserts "the most
   5/5-dense city measured in this research program", and they were collected on
   the same day. Paris and Madrid assert two more that are mutually exclusive.
   A claim about the whole corpus cannot be checked from inside one page, so
   none of them is used. The findings need no ranking.
3. **No engine count on the Paris finding.** That run fired four engines and one
   of them is now retired, so a count would attach the wrong lineup to the
   result. Thread B post 3 states raw counts of answers, labelled by language.
4. **No "27 cities".** The first seven city runs used the retired Meta AI engine,
   so that is not one comparable population.
5. **No Grok and no Google AI Overviews figure.** Both went live 2026-07-29 with
   a single day of rows. A rate from that is worthless and a company selling
   measurement cannot publish it.
6. **No Meta AI listed as live.** It is retired and is in no plan set.
7. **The two uncited homepage stats, 73% and 4.2x, are not used.** They have no
   source and are an open defect.

---

## Verification

`x/_build/scan_copy.py` reads this file and `threads/POSTS.md` as delivered
bytes, including these headings, and checks: dashes, banned vocabulary,
superlatives, universals, measured subjects, engine lineup, pricing, opening
questions, and the character counts above. `x/_build/negative_control_copy.py`
injects each defect and confirms every check fires before any clean result is
believed.

`x/_build/negative_control_render.py` does the same for the image checks:
the fill-as-text guard, card overflow, block collision, the legibility floor,
lockup clear space, lockup upscaling and contrast.

Nothing was posted, scheduled or committed. No git command was run.
