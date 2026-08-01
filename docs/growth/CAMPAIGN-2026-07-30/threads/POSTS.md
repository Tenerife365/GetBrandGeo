# Threads, CAMPAIGN-2026-07-30

Four posts, one image each. TOFU, soft ask, no pricing. Nothing here has been
posted or scheduled.

Images are in `threads/images/`, rendered by
`x/_build/render_campaign_images.py`.

---

## How this differs from the X copy, deliberately

These are not the X posts with the numbering removed. Threads punishes anything
that reads like a press release, and the two channels are doing different jobs
with the same corpus.

| | X | Threads |
|---|---|---|
| **What opens the post** | The figure, first clause, with its denominator and date attached, because a post on X is read alone and quoted alone | A situation or an admission, with the figure arriving mid-paragraph as support rather than as a headline |
| **Unit** | One post is one assertion. Seven of them stack into an argument | One post is one whole thought, opening, evidence and implication, and nothing carries over |
| **Sentences** | Clipped declaratives, few subordinate clauses, no contractions | Contractions throughout, sentences allowed to run, asides kept in |
| **The reader's position** | An analyst being handed an artefact to check | A person being told what happened, in the order it happened to us |
| **Person** | Mostly agentless. "Two of five engines returned" | First person plural, and the mistakes are ours by name. "It took us five rounds of bug fixes to get to it" |
| **Close** | A practical implication, then the URL | A practical implication, and often no URL at all |
| **Which findings** | The two hardest external findings, plus the raw artefact | Two external findings and two faults in our own product, because the conceding register is what this surface rewards |

Two of the four posts below are about bugs in BrandGEO's own measurement. That
is the split on purpose. In the published archive the persuading is done by
conceding, and on a flatter surface the concession is what reads as a person
rather than as a brand.

Only one finding appears on both channels, the invented firm name, and it is
making a different claim in each place. On X it is the artefact and the repeat.
Here it is the near miss, which is a claim about the reader's own name rather
than about the fiction.

---

## Post 1

**Image:** `images/threads-1-companies-converge-1080x1350.png`

```text
Here's a pattern that turned up in two cities on the same day, and it changes what AI visibility work is worth in a given category.

We ran six buyer categories in Boston and six in Houston on 24 July 2026, five engines each: ChatGPT, Claude, Gemini, Perplexity and Google AI Mode. Property management converged hard. One company was named by all five engines in Boston, and two companies were named by four of the five in Houston.

Then we asked the same engines "Best real estate agents for buying a home in Boston", and the Houston equivalent. No individual agent's name got past a loose match across two of the five, in either city.

Companies converge. Individuals fragment. Before you decide whether AI visibility is worth your time, it's worth knowing which side of that line your category already sits on.
```

---

## Post 2

**Image:** `images/threads-2-an-emoji-changed-the-score-1080x1350.png`

```text
An emoji changed one of our clients' scores, and it took us five rounds of bug fixes to get to it.

Two AI answers, functionally the same: the brand named as the top recommendation, praised in the line right underneath. One answer put a medal emoji in front of the heading, the other didn't. Before we fixed it, the first scored rank 1 and positive sentiment, the second scored no rank at all and neutral. Our position detection counted the characters between the start of a line and the rank digit to decide whether that line was a ranked list item, and the emoji ate the budget.

After the fifth false positive in six weeks, adding a sixth rule stopped feeling like the right instinct. So we wrote all five up instead, and put a regression suite behind them.
```

---

## Post 3

**Image:** `images/threads-3-the-near-miss-1080x1350.png`

```text
Two of the five engines we ran returned a law firm name that does not exist. Chicago, corporate law, 24 July 2026. Then the identical invented name came back in Boston, in a different category, from the same two engines, on the same collection date.

We left it in the published data. Two engines making the same mistake independently, in two cities, is more interesting than a tidy table.

The invented firm isn't really the risk though. You can check whether a firm exists. What's harder to catch is the near miss: your company name merged with another one, a trading name you dropped years ago, a wrong legal suffix. Those look right at a glance, and they're what reaches a buyer with your name attached.

Worth checking which version of yours is coming back.
```

---

## Post 4

**Image:** `images/threads-4-an-empty-field-1080x1350.png`

```text
We took a fallback out of our own scoring in July and the product got quieter on purpose.

If an AI answer says "here are the top three, in order", that's a rank. If it says "here are a few good options" and then bullets them, it isn't one. To a parser counting bullet points those two look identical, and our older scorer treated them identically. It also treated a brand mentioned in the third sentence as rank 3, which isn't a rank at all, it's a position in a paragraph.

Now a number only appears when the engine actually claimed one. Otherwise the field is empty.

An empty field is uncomfortable to put in front of a customer. It's still better than a number that can't be traced back to anything.
```

---

## Word counts

Counted programmatically by `x/_build/scan_copy.py` on the fenced bodies above,
whitespace-split. Target is 100 to 150.

| Post | Words | In band |
|---|---|---|
| Post 1 | 142 | yes |
| Post 2 | 139 | yes |
| Post 3 | 135 | yes |
| Post 4 | 132 | yes |

---

## Every figure, and the page it was measured on

| Claim | Source | Wording on that page |
|---|---|---|
| Six categories in Boston, six in Houston, five engines each | `brandgeo/web/ai-visibility-for-boston.html`, `ai-visibility-for-houston.html` | "We ran 6 real Boston categories ... each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity" |
| Both collected 24 July 2026 | both pages | "Original research, data collected 2026-07-24" |
| Property management, Boston 5 of 5 | Boston consensus table | "Property management \| [company] \| 5/5, full unanimous presence" |
| Property management, Houston 4 of 5, two companies | Houston consensus table | "Property management \| [two companies] \| 4/5 each" |
| Real estate agents, 2 of 5 in both, loose match | both consensus tables | "Real estate agents \| [name] (loose) \| 2/5, fragmented" and "2/5, most fragmented" |
| No agent name went past that | Houston FAQ | "No single agent name crossed 2 of 5 engines" |
| The quoted prompt | Boston prompt table | "Best real estate agents for buying a home in Boston" |
| The medal emoji changed a score | `brandgeo/web/bg-018.html` | "One used a level 2 heading with the medal emoji directly in front of the rank number, the other a level 3 heading. Before this fix, the first scored rank 1 and positive sentiment. The second scored no rank at all and neutral sentiment" |
| Position detection counted a character budget | same page | "Our position detection counted the character budget between the line start and the rank digit to decide whether a line was a ranked list item" |
| Five false positives in six weeks, then a classifier | same page | "Over six weeks ... five distinct false positive bugs"; "a semantic classifier ... can only remove already-extracted candidates" |
| A regression suite behind the fixes | same page | "a hand written test file with 156 individual assertions, each one a real example pulled from production data" |
| Two engines returned a firm name that does not exist, Chicago | `ai-visibility-for-chicago.html` | "both ChatGPT and Gemini independently rendered the real firm [name] as [name], a name that doesn't exist" |
| The identical name recurred in Boston | `ai-visibility-for-boston.html` | "the identical error already documented in Chicago's corporate-law dataset, appearing independently in the same two engines" |
| The sentence-position fallback was removed | `brandgeo/web/bg-019.html` | "An earlier version of this pipeline fell back to sentence position ... if a brand was named in the third sentence of the answer, it scored rank 3" |
| A rank now needs one of three explicit claims | same page | "a brand only gets a numeric position when the engine's answer makes one of three specific, checkable claims. Anything short of that ... returns null" |

---

## Restraints

1. **No measured subject is named.** Not the Boston or Houston property
   managers, not the agents, not the real law firm or the invented one, and not
   the client in post 2, whose name is printed on `bg-018.html` and is a client
   rather than a research subject, which makes naming it worse rather than
   better. The engines are named because they are the instrument.
2. **No superlative about the research program**, and the pages that assert one
   about themselves were read and not quoted. Boston's own meta description
   calls it "the most 5/5-dense city we've measured"; Chicago, collected the
   same day, claims to be first. Both cannot hold.
3. **The 2 of 5 agent figures are stated as loose matches**, which is how the
   pages qualify them. Dropping the qualifier would have made the contrast
   look cleaner than it is.
4. **No Grok, no Google AI Overviews, no Meta AI.** The first two went live
   2026-07-29 with one day of rows. Meta AI is retired.
5. **No pricing, no plan names, no engine total for today's product**, because
   every finding here predates the current seven-engine lineup and mixing the
   two in one post would misdate the result.

---

## Verification

Scanned by `x/_build/scan_copy.py` over the delivered bytes of this file,
headings included. Every check is negative-controlled by
`x/_build/negative_control_copy.py` before a clean result is reported.

Nothing was posted, scheduled or committed. No git command was run.

---
---

# Account launch extension, 2026-07-31

Everything above this line is the original campaign drop and **not one word of
posts 1 to 4 has been changed.** Everything below is added for the account
launch: the fourteen-day plan in `LAUNCH-PLAN.md` needs more slots than four
posts can fill, and the four existing posts need splitting to be postable at all.

Profile identity is in `PROFILE.md`. The ordered setup checklist is `SETUP.md`.

Nothing here has been posted or scheduled, no account was logged into, and no
git command was run.

---

## The 500-character cap, and what it does to posts 1 to 4

**Posts 1 to 4 exceed the Threads hard limit and cannot be posted as single
posts.** Measured on the delivered bytes of this file:

| Post | Characters | UTF-8 bytes | Limit | Over by |
|---|---|---|---|---|
| Post 1 | 813 | 813 | 500 | 313 |
| Post 2 | 760 | 760 | 500 | 260 |
| Post 3 | 762 | 762 | 500 | 262 |
| Post 4 | 704 | 704 | 500 | 204 |

The "Word counts" table above is not wrong about what it measured. It measured
**words** against the growth skill file's 100 to 150 word target for Threads, and
all four are genuinely inside that band. The problem is the target: Threads caps
at **500 characters**, documented first-party in
`docs/growth/channel-specs-2026-07-29.md`, and 100 words of English runs to
roughly 600 to 700 characters. **The skill file's Threads word target cannot be
met on Threads at any point in its band.** Posts 5 to 14 below are written to
the platform limit instead, at 72 to 92 words.

**No word is being rewritten to fix this.** Threads' native format is a chained
thread of sub-500 posts, so each existing post splits at a paragraph boundary and
posts as a chain. The copy is verbatim; only the paragraph break becomes a post
break.

Split points were computed, not chosen by eye: every paragraph boundary was
tested and the split producing the most even halves under 500 bytes was taken.

---

## Existing posts 1 to 4, split for the 500-character cap

Post the parts as one chain. In the composer, write the first part, press **+**
to add the next, then post the chain. **The image goes on the first part only.**

### Post 1, chained. 2 parts. Image on 1a.

**Image:** `images/threads-1-companies-converge-1080x1350.png`

**1a**, 431 characters. Paragraphs 1 and 2, verbatim.

```text
Here's a pattern that turned up in two cities on the same day, and it changes what AI visibility work is worth in a given category.

We ran six buyer categories in Boston and six in Houston on 24 July 2026, five engines each: ChatGPT, Claude, Gemini, Perplexity and Google AI Mode. Property management converged hard. One company was named by all five engines in Boston, and two companies were named by four of the five in Houston.
```

**1b**, 380 characters. Paragraphs 3 and 4, verbatim.

```text
Then we asked the same engines "Best real estate agents for buying a home in Boston", and the Houston equivalent. No individual agent's name got past a loose match across two of the five, in either city.

Companies converge. Individuals fragment. Before you decide whether AI visibility is worth your time, it's worth knowing which side of that line your category already sits on.
```

### Post 2, chained. **3 parts.** Image on 2a.

**Image:** `images/threads-2-an-emoji-changed-the-score-1080x1350.png`

Post 2 is the one that will not split in two. Its middle paragraph is 480
characters on its own, so any two-way split puts it with something else and
breaches. Three parts, verbatim, no reflow.

**2a**, 98 characters.

```text
An emoji changed one of our clients' scores, and it took us five rounds of bug fixes to get to it.
```

**2b**, 480 characters. 20 characters of headroom. Do not add a word to this one.

```text
Two AI answers, functionally the same: the brand named as the top recommendation, praised in the line right underneath. One answer put a medal emoji in front of the heading, the other didn't. Before we fixed it, the first scored rank 1 and positive sentiment, the second scored no rank at all and neutral. Our position detection counted the characters between the start of a line and the rank digit to decide whether that line was a ranked list item, and the emoji ate the budget.
```

**2c**, 178 characters.

```text
After the fifth false positive in six weeks, adding a sixth rule stopped feeling like the right instinct. So we wrote all five up instead, and put a regression suite behind them.
```

### Post 3, chained. 2 parts. Image on 3a.

**Image:** `images/threads-3-the-near-miss-1080x1350.png`

**3a**, 389 characters.

```text
Two of the five engines we ran returned a law firm name that does not exist. Chicago, corporate law, 24 July 2026. Then the identical invented name came back in Boston, in a different category, from the same two engines, on the same collection date.

We left it in the published data. Two engines making the same mistake independently, in two cities, is more interesting than a tidy table.
```

**3b**, 371 characters.

```text
The invented firm isn't really the risk though. You can check whether a firm exists. What's harder to catch is the near miss: your company name merged with another one, a trading name you dropped years ago, a wrong legal suffix. Those look right at a glance, and they're what reaches a buyer with your name attached.

Worth checking which version of yours is coming back.
```

### Post 4, chained. 2 parts. Image on 4a.

**Image:** `images/threads-4-an-empty-field-1080x1350.png`

**4a**, 474 characters. 26 characters of headroom.

```text
We took a fallback out of our own scoring in July and the product got quieter on purpose.

If an AI answer says "here are the top three, in order", that's a rank. If it says "here are a few good options" and then bullets them, it isn't one. To a parser counting bullet points those two look identical, and our older scorer treated them identically. It also treated a brand mentioned in the third sentence as rank 3, which isn't a rank at all, it's a position in a paragraph.
```

**4b**, 228 characters.

```text
Now a number only appears when the engine actually claimed one. Otherwise the field is empty.

An empty field is uncomfortable to put in front of a customer. It's still better than a number that can't be traced back to anything.
```

---

## New posts 5 to 14

Written to the 500-character platform limit rather than to the skill file's word
band. All ten are pure ASCII, so the character count and the UTF-8 byte count are
the same number, which is what keeps the count trustworthy under the emoji rule
in the next section.

Day assignments and the reasoning for the order are in `LAUNCH-PLAN.md`
section 5.

### P5. Day 1. What this account is. No image.

Text only on purpose. An image on a first post from an account with no history is
what a promotional account does. Closes on a question that costs one word.

```text
New account, so here is what will be on it.

We fire buyer questions at AI engines on a schedule and keep what comes back, including the runs where our own code got it wrong. Two of the four posts already written for this account are about bugs we shipped.

No tips thread. Findings, with the collection date and the denominator attached, and the limits in the same paragraph as the result.

Say the category you sell in and I will tell you whether we have published a run that covers it.
```

**488 characters.** Reply-bait. The closing ask is answerable in one word and
discloses nothing, and answering it is cheap for us: 27 city pages and 10
industry pages are published, so the hit rate on "yes, we have covered that" is
real rather than a stalling move.

### P6. Day 3. Has your category settled. No image.

```text
We asked five engines the same buyer question in Chicago on 24 July 2026: top-rated property management companies. One company came back from all five.

Same city, same day, other categories in that run came back with almost no overlap between engines at all.

So the useful question is not whether AI visibility matters to you. It is whether your category has settled on a short list yet, because the answer changes what the work is.

Which one is yours?
```

**455 characters.** Reply-bait. No image deliberately: the question is the
object of the post and an image competes with it for the eye.

### P7. Day 5. **The reply-thread post.** No image.

This is the post whose entire job is to start a thread of replies. How to run it,
including the two-hour reply window and the rule against linking in replies, is
`LAUNCH-PLAN.md` section 6.

```text
Something worth collecting out loud.

Type the exact question a customer would ask an AI engine before buying what you sell. Not a keyword. The whole sentence, the way a person actually types it. Add the city or country it applies to.

Reply with yours and I will read every one.

Why it is worth the minute: the wording changes the answer. We have a run where the same question in French and in English came back with different firms, not the same firms reordered.
```

**465 characters.** The ask costs one sentence, reveals nothing a competitor
could use, and carries its own reason to bother. It is also genuine prompt
research, which is the hardest input for the collection pipeline to source.

### P8. Day 7. The first link. **No image, and that is deliberate.**

Attaching an image suppresses the Threads link preview card. The card is the
better asset: `og:image` resolves to `getbrandgeo.com/images/og-home.png`,
confirmed present at 1200 x 630. **Gated on the stale `og:description`, see
`SETUP.md` step 16.**

```text
One week in, so here is the thing itself.

We publish the runs. The prompts, the per-engine results, and the collection date sit on every page. Where an engine failed to return data, the page says so rather than dropping the row and quietly shrinking the denominator.

If you want to see what comes back for your own domain, the check on the site is free and takes about a minute.

getbrandgeo.com
```

**397 characters.** First ask of the fortnight, with six days of published
findings above it. No plan name and no price.

### P9. Day 8. Seven engines, and when. `[NEEDS ASSET]` A.

The only present-tense product claim in the fourteen days.

```text
An engine count is only worth anything if you say when.

Our collection pipeline runs seven today: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews and Grok. The last two went live on 29 July 2026, so every finding we published before that date was measured on fewer, and we are not going to restate them.

AI Mode and AI Overviews are two different Google products. One is a tab you switch to. The other is the block on an ordinary results page.
```

**470 characters.** Verified against `planConfig.ts` `PLAN_ENGINES` on
2026-07-31. Stated as a fact about the **collection pipeline**, not about what a
given plan includes, because plan gating is a BOFU subject and there is no
pricing on this channel in these fourteen days. Meta AI is not named. No rate or
finding is computed from Grok or AI Overviews, which have only days of rows.

### P10. Day 10. Two different measurements. No image.

```text
Ranking on page one and being named in an answer are two different measurements, and a strong number in one does not carry across into the other.

A results page tells you where you sit among ten links the buyer still has to work through. A generated answer names a handful of options and the buyer works through nothing else.

This is not an argument that rankings stopped mattering. The pages that earn them are the same pages an engine reads.

Where does your category sit?
```

**476 characters.** Contrarian with the concession built in, so it cannot be
read as an SEO-is-dead post. Reply-bait closer.

### P11. Day 11. One question, five engines, the ranks.

**Image:** `../instagram/feed/feed-04-one-prompt-five-engines.png` (1080x1350)

```text
One buyer question, five engines, 24 July 2026. Top-rated property management companies in Chicago.

One company came back from all five. ChatGPT first, Claude first, Perplexity second, Gemini fourth. Google AI Mode named it without ranking it at all.

The Gemini row is why this is worth posting. A fourth place sitting inside a result that reads as unanimous is the part a summary rounds off.

These systems are not deterministic. Run it tomorrow and the ranks can move.
```

**472 characters.** The Gemini fourth-place row is kept for the same reason the
X standalone keeps it: a proof post works because the reader can go and check, so
the row that weakens the story stays in.

### P12. Day 12. Three of our own pages claim the same record.

**Image:** `../linkedin/feed/li-03-pages-contradict-1200x1200.png` (1200x1200)

```text
Three of our own research pages, all built from the same day's collection, each claim to hold a record across the whole program. At most one of them can be right.

Madrid, Paris and Dublin, all collected 10 July 2026.

We found it with a scanner written for a marketing campaign rather than through a reader complaint, which is the uncomfortable part. A scan of all 27 city pages on 30 July 2026 found a claim of that shape on 16 of them.

The tables underneath are fine.
```

**471 characters.** Reports that BrandGEO's pages make superlative claims without
asserting one, the same construction `linkedin/POSTS.md` uses, so the scanner
stayed strict and needed no exemption. **Pin this post from Day 12 onward**, per
`LAUNCH-PLAN.md` section 7.

### P13. Day 13. The three-step check. `[NEEDS ASSET]` B, optional.

```text
A check you can run on yourself in about a minute, free, no account anywhere.

Ask an engine the buyer question for your category, then read three things.

One. Whether you are named at all.

Two. The sentence attached to your name. An engine writes a line about you out of pages you did not write, and being described badly is a different problem from being absent.

Three. Who else is in the list. That is your competitive set as the engine sees it.
```

**451 characters.** Utility. Hands over something usable with no account, no
payment and no visit to the site, and claims nothing about the product.

### P14. Day 14. The language picked the shortlist.

**Image:** `../linkedin/feed/li-02-language-picked-the-list-1080x1350.png` (1080x1350)

```text
One prompt, asked in French and then in English. The answers were not the same firms in a different order. They were different firms.

Paris, 10 July 2026, wealth management. The French answers named independent boutique French firms. The English answers named large international private banks. One boutique firm appeared in three of the four French responses and in none of the four English ones.

Four engines returned usable data that run. ChatGPT's collection failed on every Paris prompt.
```

**494 characters, 6 to spare.** The tightest post in the set. The disclosed
ChatGPT failure is kept because dropping it would silently shrink the
denominator, which is the exact fault P8 says the published pages do not commit.
No engine count is attached to the Paris finding: that run fired four engines and
one has since been retired, so a count would date the result wrongly.

---

## Character counts, counted the way Threads counts

**Threads counts emoji as UTF-8 bytes, not as characters.** A single emoji can
cost 4, and a ZWJ sequence such as a multi-person family emoji can cost well over
20. Copy that measures 480 in a text editor can be rejected at 500 bytes. Source:
`docs/growth/channel-specs-2026-07-29.md`, from
`developers.facebook.com/docs/threads/posts` retrieved 2026-07-29.

So every post below is measured **both ways** and the byte count is the one that
governs. **No post in this file contains an emoji or any non-ASCII character**,
which is why the two columns are identical, and that is a deliberate choice
rather than a coincidence: it makes the count auditable by anyone with a text
editor.

Counted programmatically on the fenced bodies, not estimated.

| Post | Characters | UTF-8 bytes | Limit | Headroom | Words |
|---|---|---|---|---|---|
| 1a (split) | 431 | 431 | 500 | 69 | 78 |
| 1b (split) | 380 | 380 | 500 | 120 | 64 |
| 2a (split) | 98 | 98 | 500 | 402 | 21 |
| 2b (split) | 480 | 480 | 500 | **20** | 86 |
| 2c (split) | 178 | 178 | 500 | 322 | 32 |
| 3a (split) | 389 | 389 | 500 | 111 | 69 |
| 3b (split) | 371 | 371 | 500 | 129 | 66 |
| 4a (split) | 474 | 474 | 500 | **26** | 91 |
| 4b (split) | 228 | 228 | 500 | 272 | 41 |
| **P5** | 488 | 488 | 500 | 12 | 92 |
| **P6** | 455 | 455 | 500 | 45 | 80 |
| **P7** | 465 | 465 | 500 | 35 | 85 |
| **P8** | 397 | 397 | 500 | 103 | 72 |
| **P9** | 470 | 470 | 500 | 30 | 85 |
| **P10** | 476 | 476 | 500 | 24 | 86 |
| **P11** | 472 | 472 | 500 | 28 | 79 |
| **P12** | 471 | 471 | 500 | 29 | 88 |
| **P13** | 451 | 451 | 500 | 49 | 84 |
| **P14** | 494 | 494 | 500 | **6** | 79 |

Every post is under the cap. The three tightest are 2b, 4a and P14. **Do not add
a word to any of those three** without re-counting, and do not paste any of them
through an editor that converts a straight apostrophe to a curly one: a single
U+2019 costs 3 bytes instead of 1.

---

## Register, the third channel

The X-against-Threads table near the top of this file is correct and stands. It
does not cover LinkedIn, and the three-way comparison is in `LAUNCH-PLAN.md`
section 3, because it is the thing that stops this channel becoming a
reformatted feed of the other two.

The short version, and the only two differences that change what gets written:

1. **The 500-character cap forces an editorial choice, not a trimming
   exercise.** LinkedIn post 1 fits its finding, its limit, its non-naming
   policy, its engine count and an italic source line into about 1,400
   characters. The same finding gets 500 here. What is cut is the source line,
   never the limit. A finding without its limit is a different claim; a finding
   without a footer is the same claim told to a person.
2. **Four of these fourteen posts close on a direct question.** Neither the X
   file nor the LinkedIn file contains one, correctly: on X it reads as
   engagement bait, on LinkedIn as a consultant's prompt. On Threads it is how a
   post joins a conversation instead of announcing into one. The brief's rule
   holds throughout, no question opens a post, and all four are closers.

---

## Sources for the new posts

Every figure in P5 to P14 traces to a BrandGEO collection run on a named date, or
to source read in this repo on 2026-07-31. Nothing is third-party.

| Claim | Post | Source |
|---|---|---|
| Five engines, Chicago, top-rated property management, 24 July 2026, one company from all five | P6, P11 | `brandgeo/web/ai-visibility-for-chicago.html`, prompt card and consensus table; already sourced in `x/POSTS.md` |
| Per-engine ranks, ChatGPT 1st, Claude 1st, Perplexity 2nd, Gemini 4th, Google AI Mode unranked | P11 | same page, quoted in `x/POSTS.md` sourcing table |
| Other categories in that run had almost no overlap | P6 | `instagram/reels/POSTS.md` post 5 caption, drawn from the same Chicago run |
| Same prompt in French and English returned different firms, Paris, 10 July 2026, wealth management | P7, P14 | `brandgeo/web/ai-visibility-for-paris.html`; sourced in `x/POSTS.md` and `linkedin/POSTS.md` |
| One boutique firm in 3 of 4 French responses, 0 of 4 English | P14 | same page, "appeared in 3 of 4 French-language responses and in zero English-language ones" |
| Four engines returned usable data on the Paris run, ChatGPT's collection failed | P14 | same page, data-quality note, ChatGPT `status: error` on every Paris prompt |
| Three pages claim a program-wide record, Madrid, Paris, Dublin, collected 10 July 2026 | P12 | `linkedin/POSTS.md` post 3, which sources the three city pages |
| Scan of 27 city pages on 30 July 2026 found the claim on 16 | P12 | `linkedin/POSTS.md` post 3 |
| Two of the four existing posts are about our own bugs | P5 | posts 2 and 4 in this file, `bg-018.html` and `bg-019.html` |
| Seven engines, named, live today | P9 | `brandgeo-dashboard/src/lib/planConfig.ts` `PLAN_ENGINES.growth_pro` and `.managed`, read 2026-07-31 |
| Grok and Google AI Overviews live 2026-07-29 | P9 | same file, inline comments on the `growth_pro` line |
| AI Mode and AI Overviews are different Google products | P9 | same file, `EngineId` comment on `ai_overview` |
| Free audit on the site, no account, about a minute | P8, P13 | `brandgeo/web/index.html` audit path; `_prospect_engines.js` runs the public audit |
| `og:image` present at 1200 x 630 | P8 note | `brandgeo/web/index.html` line 28, file measured with Pillow |

---

## Restraints on the new posts

The five restraints listed above for posts 1 to 4 apply unchanged. Three
additions specific to this set:

6. **Seven engines appears in exactly one post, P9, and never beside a
   measurement.** Every finding in P5 to P14 comes from a run collected on
   24 July or 10 July 2026, both of which predate Grok and Google AI Overviews.
   P9 is a present-tense claim about the pipeline with its own date, and it says
   in its own body that earlier findings were measured on fewer. No post mixes
   the two, which is the error `_shared/BRIEF.md` section 2 calls the one most
   likely to trip an agent here.
7. **No pricing, no plan name, and no mention of the Radar tier**, although Radar
   is verified as live in `planConfig.ts` and is documented with its numbers in
   `PROFILE.md` section 8. All fourteen slots are TOFU or MOFU and the brief
   forbids pricing on a TOFU asset. P9 describes the collection pipeline, not a
   plan, for the same reason.
8. **No named measured subject, still.** P6, P11 and P14 all describe companies
   inside result sets without naming any of them. The engines are named
   throughout, which the brief permits, because they are the instrument rather
   than the subject.

---

## Verification of this extension

Every new post was scanned programmatically on its exact delivered text, for:
UTF-8 byte length against the 500 cap, code-point length, em dash and en dash,
any non-ASCII character, the banned vocabulary list from `_shared/BRIEF.md`
section 3 rule 2, superlative tokens, and a question mark in the opening line.

**The scanner was negative-controlled before any clean result was believed**, per
`_shared/BRIEF.md` section 4. Each defect it claims to catch was injected into a
known-clean post one at a time and the check confirmed to fire:

| Injected defect | Result |
|---|---|
| Padding past 500 bytes | FIRED |
| An em dash | FIRED |
| A curly apostrophe (U+2019) | FIRED |
| A banned vocabulary token from the brief's list | FIRED |
| A superlative ("The first company") | FIRED |
| A question as the opening line | FIRED |

**6 of 6 injections fired.** Injections were then removed and the scan re-run
clean over all ten new posts, 0 flags.

One flag was caught and fixed rather than exempted: an early draft of P5 read
"Two of the first four posts", which tripped the superlative check on "the
first". It was reworded to "the four posts already written" so the scanner could
stay strict, the same approach `linkedin/POSTS.md` records for its post 3.

The character counts in the table above are the scanner's output, not estimates.

**What was not verified, and is flagged rather than assumed:** whether a Stripe
checkout link for the `radar` plan exists in the `STRIPE_CHECKOUT_LINKS`
environment variable on Netlify. `_terms_gate.js` lists `radar` in
`SELF_SERVE_CHECKOUT_PLANS`, but it reads the link catalogue from an env var at
runtime, so code permitting Radar checkout is not evidence a link is behind it.
No post here depends on it.

Nothing was posted, scheduled or committed. No account was logged into and no
credential was entered anywhere. No git command was run.
