# Facebook link-preview cards, ready to paste

Four 1200x630 PNGs, one per destination page. Nothing here has been posted or
scheduled.

Rendered by `../_build/render_facebook_static.py`. Copy-checked by
`../_build/scan.py`, negative-controlled, injection table in
`../feed/POSTS.md`.

## How to use this

**These are og:image cards, not feed images.** Each one belongs to a specific
`getbrandgeo.com` URL, named under its filename below. Set it as that page's
`og:image` and `twitter:image` so the unfurl is correct wherever the URL is
shared, and paste the matching body as the link post.

**A link card is read at thumbnail size in a scrolling feed.** Each carries an
eyebrow, a headline of at most two lines, and one qualifier line. That is the
whole budget. If a third line looks necessary, the content belongs on the feed
image in `../feed/`, not here.

**Paste the URL on its own line at the end.** Facebook renders the link from the
post body directly, so there is no first-comment trick to run.

**Same truncation rule as the feed posts.** The first sentence is complete and
under 125 characters, because everything after that sits behind "See more".

**MOFU.** The call to action is the free audit or the published run, never a
plan. No body below carries a price, a tier, or a trial mechanic.

---

## fb-link-01-description-1200x630.png

**Destination:** https://getbrandgeo.com/
**Pairs with:** `../feed/fb-feed-01-description-1440x1800.png`
**Why this page:** the card's claim is that the description is readable and worth
reading before a buyer does. The homepage is where that becomes an action. It
offers a free audit, results in under a minute, no credit card, which is what the
card implies and what the page says.

```
An AI answer gives you two results, and the second one is the one your buyer
reads.

The first is whether you were named. The second is how you were described. An
engine can list you and frame you as the budget option, or the one for small
jobs, and that sentence arrives with your name attached to it.

You can get a rough version of this yourself in a few minutes. Type the question
a customer would actually ask, then read past your own name to the sentence
beside it.

The audit on our homepage runs that across the engines we monitor and keeps the
wording, so you can tell whether it moved.

getbrandgeo.com
```

**Alt text:** BrandGEO link card on a dark violet-black background. Eyebrow reads
"Free AI visibility audit", headline reads "Read the description before your
buyer does", and a line below reads "An AI can name your company and still
describe it wrong."

---

## fb-link-02-madrid-1200x630.png

**Destination:** https://getbrandgeo.com/ai-visibility-for-madrid.html
**Pairs with:** `../feed/fb-feed-02-language-split-1440x1800.png`
**Why this page:** the card states the reversal; the page is where the prompt
pair, the engine behaviour and the disclosed collection failure are recorded.

```
Two languages, one prompt, and the answers pointed in opposite directions.

Madrid, hotels near the airport, collected 10 July 2026. One engine answered
fully in English and returned nothing usable in Spanish. Another engine did the
exact reverse on the identical question.

We are not attaching an engine count to that. A further engine failed to collect
on every Madrid prompt in that run, and the page calls it a data gap rather than
quietly reporting on what was left.

If your buyers ask in more than one language, those are closer to two separate
markets than to one market with a translation layer.

https://getbrandgeo.com/ai-visibility-for-madrid.html
```

**Alt text:** BrandGEO link card, dark background. Eyebrow reads "Madrid,
collected 10 July 2026", headline reads "The same question, answered in opposite
directions", and a line below reads "Once in Spanish, once in English. One
prompt, one city, one day."

---

## fb-link-03-chicago-1200x630.png

**Destination:** https://getbrandgeo.com/ai-visibility-for-chicago.html
**Pairs with:** `../feed/fb-feed-03-placement-1440x1800.png`
**Why this page:** the card states the split verdict; the page carries the exact
prompt, all six categories from that run, every engine response and the
data-quality notes.

```
On 24 July 2026, five AI engines returned the same company for one question.

Chicago, property management. First on ChatGPT, first on Claude, second on
Perplexity, fourth on Gemini, and named by Google AI Mode with no position given
at all.

The fourth-place row is the one that makes the rest of it worth trusting. An edit
made to persuade would have dropped it and shown only the ones that agreed.

There is no single position to hold across five answers. Presence and placement
turn out to be different questions, and only one of them has an equivalent in a
rank tracker.

https://getbrandgeo.com/ai-visibility-for-chicago.html
```

**Alt text:** BrandGEO link card, dark background. Eyebrow reads "Chicago,
collected 24 July 2026", headline reads "Five engines named the same company.
Three different ranks", and a line below reads "First, first, second, fourth, and
one that named it with no position at all."

---

## fb-link-04-bg004-1200x630.png

**Destination:** https://getbrandgeo.com/bg-004.html
**Pairs with:** `../feed/fb-feed-04-rank-vs-answer-1440x1800.png`
**Why this page:** the card states the gap; the page is the audit, including the
exact twenty questions put to each engine.

```
Page one on Google predicted nothing about whether one AI engine would name the
brand at all.

We put twenty real customer questions to a brand that reaches page one without
trying hard, in July 2026, identical questions across every engine. It came back
as the number one recommendation on three of them, across the majority of the
twenty though not on every single one. On one engine it did not appear anywhere.

Neither measurement replaces the other, and a good result in one is not evidence
about the other. That argument is smaller and more boring than "search is
finished", which is why it holds up.

https://getbrandgeo.com/bg-004.html
```

**Alt text:** BrandGEO link card, dark background. Eyebrow reads "Audit,
published 2 July 2026", headline reads "Page one on Google. Zero mentions on one
AI engine", and a line below reads "One brand, twenty identical customer
questions."

---

## Destination checks, run 2026-07-30

Each URL was fetched and read, not assumed. What each page still says, against
what its card implies:

| Card | URL | Status | Confirmed on the page |
|---|---|---|---|
| 01 | `getbrandgeo.com/` | live | "Free audit", "Results in under a minute", "No credit card required", CTA "Check my visibility" |
| 02 | `getbrandgeo.com/ai-visibility-for-madrid.html` | live | "data collected 2026-07-10"; the Spanish and English airport-hotel prompt pair; one engine full in English and nothing in Spanish; another "did the exact opposite on that same prompt"; ChatGPT's collection failure disclosed |
| 03 | `getbrandgeo.com/ai-visibility-for-chicago.html` | live | "data collected 2026-07-24"; the exact prompt; ChatGPT #1, Claude #1, Perplexity #2, Gemini #4, Google AI Mode surfaced by name; "All 5 engines returned usable data on every prompt this run, no collection errors" |
| 04 | `getbrandgeo.com/bg-004.html` | live | "July 2, 2026"; "20 Real customer questions tested, identical across every engine"; "3 Platforms where the brand was the #1 recommendation"; "0 Times the brand appeared anywhere in Gemini's answers"; "page one of Google without trying very hard" |

**One wording difference worth knowing before card 02 is edited.** The run
NOTES quote the Madrid page as "Gemini returned nothing usable in Spanish". The
live page reads "returned nothing in Spanish". The copy above uses "nothing
usable", which is the weaker of the two claims and is therefore safe either way.

**Card 04 states no engine count, and that is not an oversight.** BG-004's audit
ran ChatGPT, Perplexity, Microsoft Copilot, Claude and Gemini. That is not the
lineup we run now, so attaching any count to those numbers would import today's
product into a July audit. "Three of them" and "one engine" are exact and need no
denominator.

**Card 03's five is that run's denominator and travels with its date.** It is not
a statement about what BrandGEO monitors today.
