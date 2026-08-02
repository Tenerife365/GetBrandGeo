# LinkedIn scheduling sheet, 2026-08 to 2026-09

Everything you need to sit down once and queue the series. Nine articles, four
assets each, eight weeks. All 36 assets are written. All images exist.

`README-SCHEDULE.md` explains why the order is what it is. This file is the
operational one: what to schedule, when, with which file and which image.

---

## Correction to the plan before you start

You said the founder repost is the only thing you cannot schedule. **Three of
the four are live actions, not one.** Worth knowing before you sit down expecting
to queue eight weeks in one session.

| Asset | Schedulable in advance? | Why |
|---|---|---|
| 01 feed post, body plus image | **Yes** | Nothing about it depends on anything going live first. |
| 01 first comment | **No** | The comment carries the article links. LinkedIn native scheduling posts the body only. You add the comment by hand once the post appears. |
| 02 Article | **Probably not, verify** | LinkedIn's Article composer saves drafts and publishes on click. I have not confirmed it offers a scheduled publish. Check the composer once; if it does, this becomes schedulable and week 1 answers it for all eight weeks. |
| 03 article announcement | **No** | Its body needs the Article's live URL, which does not exist until 02 publishes. |
| 04 founder repost | **No** | Reposts 02. Same dependency, plus it is a personal-profile action. |

**So the realistic pattern is:** queue all nine Monday posts in one sitting now,
then spend about ten minutes each Monday adding a first comment, and about
fifteen minutes each Wednesday publishing, announcing and reposting.

If you want more of it queued, a third-party scheduler (Buffer, Hootsuite,
Publer) does support first-comment scheduling, which would fold the Monday
manual step into the queue. It still cannot solve Wednesday, because that is a
genuine data dependency and not a tooling limit.

---

## 1. Schedule these now: nine Monday feed posts

One sitting. Each is a body plus one native image attachment. Morning slot means
08:00 to 09:30 CET.

| # | Date | Article | Body file | Image to attach |
|---|---|---|---|---|
| 1 | ~~2026-08-02~~ | BG-027 | `brandgeo/BG-027-linkedin-asset.md` | **POSTED** |
| 2 | Mon 2026-08-10 | BG-028 Berlin | `BG-028/01-post.md` | `og-bg-028.png` |
| 3 | Mon 2026-08-17 | BG-029 Madrid | `BG-029/01-post.md` | `og-bg-029.png` |
| 4 | Mon 2026-08-24 | BG-030 Paris | `BG-030/01-post.md` | `og-bg-030.png` |
| 5 | Mon 2026-08-31 | BG-031 Rome | `BG-031/01-post.md` | `og-bg-031.png` |
| 6 | Mon 2026-09-07 | BG-032 engines | `BG-032/01-post.md` | `og-bg-032.png` |
| 7 | Mon 2026-09-14 | BG-033 test your brand | `BG-033/01-post.md` | `og-bg-033.png` |
| 8 | Mon 2026-09-21 | BG-034 checklist | `BG-034/01-post.md` | `og-bg-034.png` |
| 9 | Mon 2026-09-28 | BG-021 retrieval | `BG-021/01-post.md` | `bg-021-hero.png` |

Paths are relative to `docs/growth/linkedin-series-2026-08/`. Images are in
`docs/growth/og-cards/cards/`, except `bg-021-hero.png` which is in
`brandgeo/web/images/`.

**Copy the body only.** Everything above the `---` in each file is instructions
for you, and everything below the `## First comment` heading is Monday's manual
step. Take what sits under `## Post`.

**Do not put the link in the body.** It goes in the first comment. That is what
the image attachment is compensating for: no link in the body means no preview
card, so the post needs its own visual.

---

## 2. Each Monday, right after the post appears

Open the post, add the first comment. It is already written, sitting under
`## First comment` in the same file. Two or three links, typically the article,
one related piece, and the free audit.

Do it within a few minutes. The comment carries the only path to the site.

---

## 3. Each Wednesday, in this order

The order matters because 03 and 04 both need the URL that 02 creates.

**Step 1. Publish the Article.** `BG-0NN/02-article.md`. Company page, "Write
article". Copy the body under `## Article body`. Set the title from
`**Suggested title:**` at the top; two alternatives are offered if you prefer one.
Upload the cover image. Publish. Copy the resulting URL.

The composer does not read markdown. After pasting, bold the subheads by hand.
Each file lists them explicitly under `## Subheads to bold after pasting`, so you
can work down that line rather than hunting through the text.

**Step 2. Post the announcement.** `BG-0NN/03-article-announcement-post.md`. An
Article does not reach the feed on its own; this is what puts it there. Paste the
Article URL where the file marks it.

**Step 3. Founder repost.** `BG-0NN/04-founder-repost.md`. Your personal profile.
Repost the Article with commentary, never a bare reshare. The commentary is
written in first person and is deliberately not a summary of the post: it states
an opinion the company page cannot. No hashtags, no CTA, no audit link, because
the Article link is already carried by the repost.

### Wednesday dates

| Date | Article | Live URL to publish |
|---|---|---|
| ~~2026-08-05~~ | BG-027 | **PUBLISHED**, assets 03 and 04 also done |
| Wed 2026-08-12 | BG-028 | `getbrandgeo.com/bg-028.html` |
| Wed 2026-08-19 | BG-029 | `getbrandgeo.com/bg-029.html` |
| Wed 2026-08-26 | BG-030 | `getbrandgeo.com/bg-030.html` |
| Wed 2026-09-02 | BG-031 | `getbrandgeo.com/bg-031.html` |
| Wed 2026-09-09 | BG-032 | `getbrandgeo.com/bg-032.html` |
| Wed 2026-09-16 | BG-033 | `getbrandgeo.com/bg-033.html` |
| Wed 2026-09-23 | BG-034 | `getbrandgeo.com/bg-034.html` |
| Wed 2026-09-30 | BG-021 | `getbrandgeo.com/bg-021-retrieval-not-engine-count.html` |

All nine source articles confirmed present in `brandgeo/web/` and live.

---

## 4. Images: yes, you have all of them

Measured 2026-08-02, not assumed. Every asset in this series has its image on
disk and, for the eight og cards, already deployed to the live site.

| Article | Image | Size | On live site |
|---|---|---|---|
| BG-027 | `og-bg-027.png` | 1200x630 | yes |
| BG-028 | `og-bg-028.png` | 1200x630 | yes |
| BG-029 | `og-bg-029.png` | 1200x630 | yes |
| BG-030 | `og-bg-030.png` | 1200x630 | yes |
| BG-031 | `og-bg-031.png` | 1200x630 | yes |
| BG-032 | `og-bg-032.png` | 1200x630 | yes |
| BG-033 | `og-bg-033.png` | 1200x630 | yes |
| BG-034 | `og-bg-034.png` | 1200x630 | yes |
| BG-021 | `bg-021-hero.png` | **1600x900** | yes |

Both copies of the og cards are byte-identical: the build output in
`docs/growth/og-cards/cards/` and the deployed set in `brandgeo/web/images/og/`.
Use either.

**The one thing worth knowing about crops.** LinkedIn's Article cover is 16:9,
ratio 1.778. The og cards are ratio 1.905, so an Article cover built from one
loses roughly 7% off the width. It has been fine on BG-027, but check the preview
if any text sits near the left or right edge.

**BG-021 is the exception and it is the good kind.** Its hero is 1600x900, ratio
1.778 exactly, so it crops nothing at all as an Article cover. There is no og
card for BG-021 and none is needed. An earlier note in that folder said the
dimensions were unverified and suggested generating one; that is now measured and
the suggestion is withdrawn.

If you ever want the og cards at a true 16:9, `docs/growth/og-cards/build_og_cards.py`
renders them and can output 1920x1080. Not required.

---

## 5. Per-week file map

Everything for week N lives in `docs/growth/linkedin-series-2026-08/BG-0NN/`,
four files each, named in posting order.

```
BG-021/  BG-028/  BG-029/  BG-030/  BG-031/  BG-032/  BG-033/  BG-034/
  01-post.md
  02-article.md
  03-article-announcement-post.md
  04-founder-repost.md
```

BG-027 is the exception, because it was written before this folder existed:

- 01 feed post: `brandgeo/BG-027-linkedin-asset.md`, posted 2026-08-02
- 02 Article: `docs/linkedin-article-bg-027-2026-08-02.md`, published
- 03 and 04: in `BG-027/` with the rest, both done

---

## 6. Two things not to trip over

**Do not quote BG-021's plan ladder from the live page.** The visible copy on
`bg-021-retrieval-not-engine-count.html` still reads "Free: ChatGPT", which
became false on 31 July when the free tier moved to Gemini. The page's own
structured data is already correct, so it contradicts itself. The LinkedIn assets
for BG-021 take the ladder from `planConfig.ts` instead and are right. The page
still needs fixing, and it is the only page on the site carrying the stale claim.

**The nine older kits are not part of this series and are not ready.**
`brandgeo/BG-0NN-linkedin-asset.md` for BG-001, BG-018 to BG-020, and BG-022 to
BG-026 still close with the old `/#contact` CTA, which is the 48-hour manual form
rather than the instant audit. Correct them before reposting any of those.
Everything in this folder already points at `/#free-audit`.
