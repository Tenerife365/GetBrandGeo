# Instagram stories, CAMPAIGN-2026-07-30

Four frames at 1080x1920, one per feed post, each built to drive to that post.
Rendered by
`docs/growth/CAMPAIGN-2026-07-30/instagram/_build/render_instagram_statics.py`
and checked by `verify.py` in the same folder.

**Safe zone.** Instagram's own furniture covers roughly the top 220px and the
bottom 420px. Every pixel of ink on all four frames sits inside y=220 to
y=1500, verified by scanning the delivered PNGs for the topmost and bottommost
non canvas pixel, not by trusting the layout code.

**Tap target.** Each frame carries a violet `getbrandgeo.com` pill, and the band
directly beneath it, up to y=1500, is left deliberately empty. Put the link
sticker in that empty band. Do not drop it on the pill, which is drawn to be
the visible affordance the sticker sits under.

**A story has no comment thread.** The four blocks below keep the same four
headings as the feed file so the two read the same way, but on a story the
"first comment" line is the URL to put on the link sticker, and the hashtags go
on a hashtag sticker or are dropped. They are worth less on a story than on a
feed post and skipping them costs nothing.

All four are top of funnel. None carries a price.

---

## story-01-invented-name.png

Drives to feed post 1, the carousel. Add a "See the carousel" text sticker over
the empty band if you are posting the story after the carousel is live.

**CAPTION** (the line already drawn on the frame, repeated here for reference)

```
Two AI engines returned a firm name that does not exist. Then the identical name came back in a second city, in a different category, from the same two engines.
```

**HASHTAGS** (hashtag sticker, optional)

```
#AIVisibility #AISearch #AIHallucination
```

**LINK STICKER URL**

```
https://getbrandgeo.com/ai-visibility-for-chicago.html
```

**ALT TEXT**

```
A tall dark violet frame. A violet label reads 2 of 5 engines, collected 24 July 2026. The headline reads that two AI engines returned a firm name that does not exist. Below it a line reads that the identical name came back in a second city, in a different category, from the same two engines. A violet pill reads getbrandgeo.com. The BrandGEO lockup sits near the top.
```

---

## story-02-converge-fragment.png

Drives to feed post 2.

**CAPTION** (the line already drawn on the frame)

```
Companies converge. Individuals fragment. Property management reached 5 of 5 engines in Boston and 4 of 5 in Houston. Real estate agents reached 2 of 5 in both.
```

**HASHTAGS** (hashtag sticker, optional)

```
#AIVisibility #LocalSEO #AISearch
```

**LINK STICKER URL**

```
https://getbrandgeo.com/ai-visibility-for-boston.html
```

**ALT TEXT**

```
A tall dark violet frame. A violet label reads two cities, six categories each, 24 July 2026. The headline reads companies converge, individuals fragment. Below it a line records that property management reached 5 of 5 engines in Boston and 4 of 5 in Houston, and that real estate agents reached 2 of 5 in both. A violet pill reads getbrandgeo.com. The BrandGEO lockup sits near the top.
```

---

## story-03-first-and-absent.png

Drives to feed post 3.

**CAPTION** (the line already drawn on the frame)

```
Top answer on several engines. Zero mentions on another. Same brand, the same 20 questions, run identically across every engine in that audit.
```

**HASHTAGS** (hashtag sticker, optional)

```
#SEO #AIVisibility #AISearch
```

**LINK STICKER URL**

```
https://getbrandgeo.com/bg-004.html
```

**ALT TEXT**

```
A tall dark violet frame. A violet label reads one brand audit, 20 questions, published 2 July 2026. The headline reads top answer on several engines, zero mentions on another. Below it a line reads same brand, the same 20 questions, run identically across every engine in that audit. A violet pill reads getbrandgeo.com. The BrandGEO lockup sits near the top.
```

---

## story-04-one-prompt-five-engines.png

Drives to feed post 4.

**CAPTION** (the line already drawn on the frame)

```
Named by all five. Ranked anywhere from #1 to #4. The prompt, the engines, the ranks and the collection date are published in full.
```

**HASHTAGS** (hashtag sticker, optional)

```
#AIVisibility #OpenResearch #AISearch
```

**LINK STICKER URL**

```
https://getbrandgeo.com/ai-visibility-for-chicago.html
```

**ALT TEXT**

```
A tall dark violet frame. A violet label reads one prompt, five engines, 24 July 2026. The headline reads named by all five, ranked anywhere from number 1 to number 4. Below it a line reads that the prompt, the engines, the ranks and the collection date are published in full. A violet pill reads getbrandgeo.com. The BrandGEO lockup sits near the top.
```

---

## Notes worth reading before posting

- **Post each story after its feed post is live**, not before. Every frame is
  built to send a viewer to a post, and a story pointing at a post that does not
  exist yet spends the reach for nothing.
- **No frame states today's engine lineup.** All four findings were measured on
  five engine runs. A frame that carried the current seven would read as the
  denominator of the finding on it.
- **No frame names a company or a person from inside a result set.**
- Story 1 and story 4 both link to the Chicago city page, which carries a
  program wide superlative claim that does not hold up. Nothing on either frame
  quotes it.
