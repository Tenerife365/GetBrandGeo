# 05. Instagram

Carousel plus Reel. Exact pixel dimensions get reconciled against
`docs/growth/channel-specs-2026-07-29.md` before any render.

---

## 5a. Carousel, 7 slides (MOFU)

**Driver:** Curiosity gap. **12 words per slide maximum, enforced.**
Paired visual: **V5** (the slide system).

| # | On slide | Words |
|---|---|---|
| 1 | **Your AI tool lists 9 engines. How many actually searched the web?** | 12 |
| 2 | **An engine with no retrieval answers from memory, not from today.** | 11 |
| 3 | **Launched this year? Invisible to it. Closed in 2024? Still ranked.** | 11 |
| 4 | **The output looks identical either way. That is the dangerous part.** | 11 |
| 5 | **We removed Meta AI from our own product on 16 July.** | 11 |
| 6 | **Seven engines now. Every one runs live web search.** | 9 |
| 7 | **Ask your vendor: what is your standard for removing an engine?** | 11 |

**Caption, 118 words:**

> Engine count is the easiest number in this category to raise and the least
> useful one to compare on.
>
> A model with no retrieval answers from training data. You still get a list, a
> ranking and a percentage. You just get them about a version of the market that
> no longer exists. And nothing in the output flags it, which is why it slips past
> people who know better.
>
> We retired an engine from our own pricing page over this two weeks ago, and
> turned down two more since. The two we did add today, Grok and Google AI
> Overviews, both qualified on the same test.
>
> Free audit on your own domain, link in bio.
>
> #AIsearch #GEO #SEO #brandvisibility #ChatGPT #AIvisibility

**Slide notes:** slide 5 is the credibility beat and should be visually distinct
from the rest of the set, not just another slide in the sequence. Slide 7 carries
no logo lockup, so the question is the last thing on screen.

---

## 5b. Reel, 28 seconds (TOFU)

**Driver:** Status threat.
Visual state change inside the first 1.5 seconds, per the skill's rule.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-1.5s | Hard cut onto a dashboard showing **"9 ENGINES MONITORED"** in large type. At 1.2s a red strike-through slashes across it. No slide, no fade. | "Nine engines." |
| 1.5-4s | Strike-through holds. Text underneath types on: **"how many searched the web?"** | "The number nobody checks is how many of them actually searched the web." |
| 4-9s | Split screen. Left panel labelled WITH SEARCH fills with a ranked list. Right panel labelled NO SEARCH fills with a visibly different ranked list. | "An engine with no retrieval answers from training data. Same format. Same confidence." |
| 9-14s | Right panel only. A business card slides in labelled "Launched 2026" then greys out and drops. | "Anything that launched this year is invisible to it." |
| 14-19s | Right panel. A card labelled "Closed 2024" sits at position 3, glowing violet. | "A competitor that shut down two years ago can still be sitting at number three." |
| 19-24s | Full frame. Text: **"We cut an engine from our own product on 16 July."** Engine count ticks 6 to 5 on screen, then 5 to 7. | "We removed one from our own product over this. Our engine count went down. Today two went in, and both had to pass the same test." |
| 24-28s | Seven engine marks resolve, each with a small check. End card: **"Check your own domain, free."** | "Seven engines. All seven retrieve. Ask your tool which of theirs do." |

**On-screen caption track:** burned in, not platform auto-captions. The split
screen at 4 to 9 seconds is the whole argument and it fails without readable
labels.

**Safe area, and this is the constraint that will break this asset.** Meta's
first-party inset on a 1080x1920 master is 14% top and **35% bottom**, which is a
**672 px bottom inset**. The usable band is roughly **y=269 to y=1248**, about
half the frame. Source: `docs/growth/channel-specs-2026-07-29.md`.

Consequences for this script:
- The 19 to 24 second full-frame text card is the one at risk. Centre it in the
  usable band, not in the frame.
- The 4 to 9 second split screen carries the entire argument. Both panel labels
  must sit above y=1248. If the composition does not fit, drop to a stacked
  layout rather than shrinking the labels.
- The 24 to 28 second end card sits lowest by instinct. Move it up.
- Burned-in captions go inside the band too, not at a comfortable 200 px from the
  bottom, which lands underneath the caption block and CTA.

**Encoding:** `-movflags +faststart`. The `moov` atom must lead the file for Reels
and most encoders write it last by default.

**Audio:** voiceover plus a low ambient bed. No trending audio. The argument does
not survive being cut to a beat.

---

## Notes

- Carousel and Reel do not run the same week. The carousel is MOFU and belongs
  after the Reel has done TOFU work.
- **Hold both until the send gate clears.**
