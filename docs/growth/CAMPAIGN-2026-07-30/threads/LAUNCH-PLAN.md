# Threads launch plan, first 14 days

For an account created 2026-07-31 with zero followers and zero posts.

Nothing here has been posted or scheduled. Every day is released on its own and
approving one day is not approving the next.

Copy for every slot is in `POSTS.md`. Profile setup must be finished first, per
`SETUP.md`.

---

## 1. What a cold account changes, and it changes almost everything

Most posting advice assumes a follower base. This account has none, and three
things follow from that.

**Distribution does not come from followers.** The Threads "For You" feed serves
posts from accounts the viewer does not follow, heavily and by default. That is
unusual among social platforms and it is the reason a day-one account can be
read at all. The practical consequence is that **each post is judged on its own,
cold, by people with no context**, which is exactly the constraint the X copy was
written for and the opposite of the LinkedIn copy's assumption.

**Replies are the faster half of the mechanic.** A reply from this account on
somebody else's post is seen by that post's audience, which on day one is larger
than this account's audience by an unbounded factor. Section 8 budgets time for
this and it is not optional garnish.

**A link on day one reads as spam.** An account with no history whose first post
carries a URL is the exact shape of a link-dropper. The link waits until Day 7,
by which point six posts of published findings sit above it as the argument for
clicking it.

**What this plan does not do:** it does not chase a follower count, and section 7
deliberately does not treat follower count as the success signal.

---

## 2. The order, and why it is not "best post first"

The instinct is to open with the sharpest finding. This plan does not, for one
reason: on a profile with three posts, **the posts are the header** (see
`PROFILE.md` section 7). A visitor arriving on Day 3 reads the top three as a
statement of what the account is.

So the first three establish the register in a specific order: what this is
(Day 1), a finding with its denominator (Day 2), then a question that costs the
reader nothing (Day 3). A visitor landing after Day 3 sees a measurement account
that talks to people, which is the position everything after depends on.

The two posts about BrandGEO's own bugs are held to Day 6 and Day 9. Conceding a
fault is the strongest thing in this corpus and it is also the easiest to
misread as a small account apologising. It lands once two straight findings have
established that the numbers are real. This is the same reasoning `linkedin/POSTS.md`
gives for its 1, 4, 2, 3 order, applied to a longer runway.

---

## 3. Register: how this differs from X and from LinkedIn

`POSTS.md` already carries an X-against-Threads table. It is correct and is not
restated. What it does not cover is LinkedIn, and the three-way difference is
what stops this channel becoming a reformatted feed of the other two.

| | X | LinkedIn | Threads |
|---|---|---|---|
| **Hard limit** | 280 characters | roughly 3,000, effectively unbounded | **500 characters, and emoji cost UTF-8 bytes** |
| **Unit of argument** | One post is one assertion; seven stack into an argument | One post carries the whole argument, with limits, sources and a footer | One post is one whole thought and nothing carries over |
| **Reader** | An analyst handed an artefact to check | A peer being shown working | A person being told what happened |
| **Opening** | The figure, first clause, with denominator attached | A first-person observation or a flat declarative | A situation or an admission; the figure arrives mid-post |
| **Sentences** | Clipped declaratives, no contractions | Long, subordinate clauses, paragraph breaks doing structural work | Contractions throughout, sentences allowed to run |
| **Sourcing** | A URL at the end of the last post | An explicit italic source line naming dataset, categories, engines, date | **In the sentence or absent.** No footer, no source block, there is no room |
| **Close** | Practical implication, then the URL | Practical implication addressed to the reader's next decision | Practical implication, and often a question |
| **Question marks** | Never | Never | **Yes, at the close.** This is the register's main tool and the other two channels do not use it |
| **Product mention** | One URL, no claim | One narrow sentence at the end | Rare, and never in the same post as a finding |

**The load-bearing difference is the 500-character cap, and it is not a style
preference.** LinkedIn post 1 states its finding, its limit, its non-naming
policy, its engine count and its source line in about 1,400 characters. On
Threads, the same finding gets 500 characters total. Something is cut, and the
choice of what to cut is the channel's actual editorial position: **the limit
stays, the source line goes.** A finding without its limit is a different claim.
A finding without a footer is the same claim, told to a person.

**The other difference worth naming is the question mark.** Four of the fourteen
posts close on a direct question. Neither the X file nor the LinkedIn file has a
single one, correctly, because a question at the end of an X post reads as
engagement bait and at the end of a LinkedIn post reads as a consultant's
prompt. On Threads it is how a post joins a conversation rather than announcing
into one. The campaign brief's rule stands throughout: **no question opens a
post.** All four are closers.

---

## 4. Length: the growth skill's Threads target is wrong, and this plan does not follow it

The skill file's section 4 matrix gives Threads a target of **100 to 150 words**.
`POSTS.md`'s existing word-count table is measured against that band and reports
all four posts inside it, 132 to 142 words.

**That target cannot be met.** Threads has a hard 500-character cap, documented
first-party in `channel-specs-2026-07-29.md`. 100 words of English is roughly
600 to 700 characters. The band and the platform limit are incompatible at every
point in the band.

Measured, not estimated. The four existing posts, counted on the delivered bytes
of `POSTS.md`:

| Existing post | Characters | UTF-8 bytes | Limit | Over by |
|---|---|---|---|---|
| Post 1 | 813 | 813 | 500 | 313 |
| Post 2 | 760 | 760 | 500 | 260 |
| Post 3 | 762 | 762 | 500 | 262 |
| Post 4 | 704 | 704 | 500 | 204 |

**All four would be rejected by Threads as written.** This is a real defect in
the delivered package, not a nuance. `POSTS.md` section "Word counts" measured
the right thing against the wrong limit: it counted words against the skill
file's band and never counted characters against the platform's cap.

The fix does not rewrite a single word. Threads' native format is a **chained
thread of sub-500 posts**, so each existing post is split at a paragraph
boundary into 2 or 3 chained posts, verbatim. Exact splits are in the new
"Existing posts 1 to 4, split for the 500-character cap" section of `POSTS.md`.

**Posts 5 to 14 are written to the platform, not to the skill:** 72 to 92 words,
397 to 494 bytes, all measured.

---

## 5. The 14 days

One post per day. Every slot names a real file in
`docs/growth/CAMPAIGN-2026-07-30/` or is marked `[NEEDS ASSET]`.

**Every image listed has been checked against the Threads 1440 px maximum
width.** All are within it.

### Week 1: establish the register. No link until Day 7.

| Day | Post | Asset | Funnel | What it is trying to earn |
|---|---|---|---|---|
| **1** | **P5**, what this account is | none, text only | TOFU | A reason to follow before any finding exists. Closes on a question that costs one word to answer. Text-only on purpose: an image on a first post from an unknown account is what a promotional account does. |
| **2** | **P1a + P1b** (existing post 1, chained) | `threads/images/threads-1-companies-converge-1080x1350.png` on P1a | TOFU | The first real finding, with two cities, six categories each and the collection date in the same paragraph. Establishes that "we measure things" was not a figure of speech. |
| **3** | **P6**, has your category settled | none, text only | TOFU | First reply-bait. One measured contrast, then a question answerable without disclosing anything commercially sensitive. Deliberately no image: an image competes with the question for the eye. |
| **4** | **P3a + P3b** (existing post 3, chained) | `threads/images/threads-3-the-near-miss-1080x1350.png` on P3a | TOFU | The near miss. The strongest TOFU idea in the corpus because it reframes the reader's problem from absence to misdescription. |
| **5** | **P7**, the reply-thread post | none, text only | TOFU | **This is the reply-collection post.** Its entire job is section 6. |
| **6** | **P2a + P2b + P2c** (existing post 2, chained, 3 parts) | `threads/images/threads-2-an-emoji-changed-the-score-1080x1350.png` on P2a | TOFU | First admission. A bug in BrandGEO's own scoring, told in full. Lands now because Days 2 and 4 established the numbers are real. |
| **7** | **P8**, the first link | **none.** See the link-card note below | MOFU | First ask. One week of published findings sits above it. |

### Week 2: the account has history. Add product truth and utility.

| Day | Post | Asset | Funnel | What it is trying to earn |
|---|---|---|---|---|
| **8** | **P9**, seven engines and when | `[NEEDS ASSET]` A, spec below | MOFU | The only present-tense product claim in the fourteen days. Also states the historical-versus-current rule in public, which is a credibility asset. |
| **9** | **P4a + P4b** (existing post 4, chained) | `threads/images/threads-4-an-empty-field-1080x1350.png` on P4a | TOFU | Second admission, and the better of the two: a fallback removed on purpose, leaving an empty field. |
| **10** | **P10**, rankings and answers are two measurements | none, text only | MOFU | Contrarian, with the concession built in. Closes on a question. |
| **11** | **P11**, one question, five engines, the ranks | `instagram/feed/feed-04-one-prompt-five-engines.png` (1080x1350) | MOFU | Concrete proof. Keeps the Gemini fourth-place row, which is the row that weakens the story. |
| **12** | **P12**, three of our own pages claim the same record | `linkedin/feed/li-03-pages-contradict-1200x1200.png` (1200x1200) | MOFU | Third admission and the largest. A defect in BrandGEO's own writing, found by its own scanner. |
| **13** | **P13**, the three-step check | `[NEEDS ASSET]` B, spec below, **optional** | MOFU | Utility. Hands over something usable with no account and no payment. |
| **14** | **P14**, the language picked the shortlist | `linkedin/feed/li-02-language-picked-the-list-1080x1350.png` (1080x1350) | MOFU | Closes the fortnight on the finding with the widest audience, and carries a disclosed collection failure. |

### Chained posts: how to post them

Days 2, 4, 6 and 9 are chains, not single posts. In the Threads composer, write
the first post, press the **+** below it to add the next in the same chain, then
post the whole chain at once. It publishes as one thread.

**The image goes on the first post of the chain only.** An image on each part
makes a two-part finding look like two separate posts in the feed.

### The Day 7 link card, and its blocker

**Do not attach an image to the Day 7 post.** Threads renders a link preview
card from the destination's Open Graph tags, and attaching an image suppresses
that card. The card is the better asset here: `og:image` resolves to
`getbrandgeo.com/images/og-home.png`, confirmed present at 1200 x 630.

**Blocker, and it is live.** `brandgeo/web/index.html` line 25 has an
`og:description` naming five engines, which has been stale since 2026-07-29. The
Day 7 copy does not mention an engine count, so the contradiction is between the
card and the **bio**, which says seven, in the same profile.

Two paths, both acceptable:

- **Preferred:** `bg-web` updates the `og:description` to the seven-engine
  lineup and deploys before Day 7. Meta caches Open Graph data, so allow a day.
- **Fallback:** post P8 on Day 7 with the final line `getbrandgeo.com` removed,
  which turns it into a plain statement of method with no card, and move the
  link post to Day 8, pushing P9 to Day 9 and compressing the tail by one day.

`SETUP.md` step 16 carries this as a gate.

---

## 6. The reply-thread post, Day 5

`POSTS.md` P7. Its whole job is to start a thread of replies, and it is the one
post in the fourteen whose output is not the post.

It asks the reader to type the exact question a customer would ask an AI engine
before buying what they sell, as a full sentence rather than a keyword, plus the
city or country.

**Why anyone would answer.** The ask costs one sentence, discloses nothing a
competitor could use, and the post gives a real reason to bother: the wording
changes the answer, evidenced by the Paris French-against-English run. It is
also the rare reply-bait where the replier's answer is useful to the replier.

**Why it is useful to BrandGEO beyond the replies.** Every answer is a real
buyer prompt in a real category, typed by someone who sells there. That is the
input the collection pipeline needs and the hardest input to source. This post
is prompt research that looks like a conversation, honestly, because it is both.

**How to run it, and this is where the value is:**

1. Post it in the morning, local time, not the evening. Replies arrive over
   hours and each reply resurfaces the post.
2. **Reply to every single answer within the first two hours.** Not with thanks.
   With something specific: whether the category converges or fragments in the
   published runs, or that the wording would change the answer, and how.
3. Where a published run covers the category, say so and name the city. There
   are 27 city pages and 10 industry pages, so the hit rate is real.
4. **Do not link the site in any reply.** Day 7 is the link post. A URL dropped
   into a reply thread on Day 5 converts the post into an ad.
5. If a reply names their own company, do not repeat the name in the reply. The
   campaign's no-named-subject rule exists for measured subjects, and a person
   volunteering their name in public is not consent to be quoted in a brand's
   copy.

**If it gets fewer than three replies**, that is information rather than a
failure: on a six-day-old account it means reach, not the ask. Re-run the same
post in week 4 with the account's own answer as the first reply, which is a
different post because the thread is no longer empty.

---

## 7. What changes after week one, and how to tell it is working

### What changes

**The account gets a memory on Day 8.** Posts 1 to 7 are written for a reader
with no context. From Day 8 a post may assume the account has published findings
before, which is what lets P9 say "every finding we published before that date
was measured on fewer" without explaining what findings.

**The link becomes normal.** After Day 7 a URL in a post is an account that
publishes research linking to its research, not an unknown account dropping a
link.

**Pin a post on Day 8, and pin P12, not the Day 1 post.** Threads allows one
pinned post on the profile. The Day 1 post is an introduction and ages badly.
P12, three of our own pages claiming the same record, is the post that most
efficiently tells a stranger what kind of account this is. Pin it after Day 12,
once it exists; between Day 8 and Day 12, pin P3a.

**Replying stops being the main activity.** Section 8's budget can drop from
roughly 30 minutes a day to 15 after Day 7, and the balance moves from replying
on other people's posts to replying under this account's own.

### The signal it is working

**Not follower count.** A cold Threads account accumulates followers from the
For You feed largely independently of whether the posts are landing with the
right people, and a hundred followers who will never buy is a worse outcome than
twelve who will.

In priority order, and all four are visible in Threads Insights on a
professional account (`SETUP.md` step 3):

1. **Replies from accounts that do not follow you.** The single strongest early
   signal. It means the post reached the For You feed and was worth answering
   cold. One of these in week one is a good week.
2. **Profile taps per post.** Someone read a post and went to find out who wrote
   it. This is the intent that becomes a follow or a click later, and it moves
   before follower count does.
3. **Reply rate**, replies divided by views. On this plan, four posts are built
   to earn replies (Days 1, 3, 5, 10) and ten are not. Compare the four against
   each other, never against the ten.
4. **Link clicks, from Day 7 only.** Small numbers. Six days of published
   findings should mean the clicks that do arrive are from people who read
   several posts first.

**Decide which metric judges this before Day 1.** The same trap the package
README names for the video runs applies here: a reply-bait post will win on
replies and lose on clicks, and a proof post does the reverse. Picking the
metric after seeing the numbers means the winner is whichever metric was looked
at first. **The metric for these fourteen days is signal 1, replies from
non-followers, with signal 2 as the tiebreak.**

**What would say it is not working**, and each has a different fix:

- Views but no replies: the copy is landing as a broadcast. Increase the share
  of question-closers above 4 in 14.
- Replies but no profile taps: the posts are conversational but the finding is
  not carrying. Lead with the figure sooner.
- Nothing at all after Day 4: check `SETUP.md` steps 12, 13 and 15 before
  changing any copy. A private profile, a narrowed reply control, or Hidden
  Words filtering all look exactly like bad copy.

---

## 8. Time budget

Posting the copy is the small half.

| | Week 1 | Week 2 |
|---|---|---|
| Posting | 5 min/day | 5 min/day |
| Replying under own posts | 10 min/day | 10 min/day |
| Replying on other accounts' posts | 15 min/day | 5 min/day |
| **Day 5 only** | **+45 min**, section 6 | |

**Do not schedule these through a tool.** Threads posts can be scheduled through
the API, but half the value of this plan is replying inside the first hour, and
a scheduler posts while nobody is there to do that.

---

## 9. Assets needed, complete list

Two, and one is optional. Everything else maps to a file that exists.

### `[NEEDS ASSET]` A, Day 8. The engine lineup card. **Required.**

Nothing in the package shows the current seven-engine lineup. Every existing
image is a research finding measured on a historical lineup, so reusing one
under P9 would attach the wrong date to the right number, which is the one error
the campaign brief calls out by name.

```
FILENAME:    threads/images/threads-9-seven-engines-1440x1440.png
SIZE:        1440 x 1440 px, 1:1
             (1440 is the Threads maximum width; a square card holds seven
              rows of type at a legible size where 4:5 would force two columns)
FORMAT:      PNG, sRGB, under 8 MB
RENDERER:    Reuse x/_build/render_campaign_images.py. Pillow only.
             matplotlib, cairosvg and ImageMagick are not installed.
FONTS:       _shared/fonts/, Inter. Not a system font on this machine.
LOGO:        _shared/logo/brandgeo-lockup-dark-transparent-w512.png
             Clear space of at least the mark's own height on every side.
             Do not scale beyond 1033 px wide; the brand kit asserts against
             upscaling.

CONTENT, exactly:
  Eyebrow:   COLLECTION PIPELINE . 2026-07-31
  Head:      Seven engines today.
  List, in this order, one per row:
             ChatGPT
             Gemini
             Claude
             Perplexity
             Google AI Mode
             Google AI Overviews      <- tag this row LIVE 2026-07-29
             Grok                     <- tag this row LIVE 2026-07-29
  Footer:    Findings published before 2026-07-29 were measured on fewer.

COLOUR:      canvas #0a0b0e, card #101116, hairline #23242b
             engine names #e8e9ed (16.22:1 on canvas)
             the two LIVE tags in #a78bfa (7.23:1), never #8b5cf6
             footer line #9ba1ac (7.58:1)
             #8b5cf6 is a FILL ONLY. White on it is 4.23:1 and fails AA.

MUST NOT:    name Meta AI, Copilot or DeepSeek anywhere. Meta AI is retired;
             the other two have never collected. Do not show a plan name or a
             price: this is a TOFU asset.

VERIFY:      measure every text colour against the surface it actually sits on,
             sRGB relative luminance, 4.5:1 body and 3:1 large text. Report the
             ratios. Negative-control the checker before believing a clean run.
```

### `[NEEDS ASSET]` B, Day 13. The three-step check card. **Optional.**

P13 works as text. The card would help only because a numbered list is easier to
save as an image than as a post.

```
FILENAME:    threads/images/threads-13-three-step-check-1440x1800.png
SIZE:        1440 x 1800 px, 4:5
FORMAT:      PNG, sRGB, under 8 MB
CONTENT:     Eyebrow  A CHECK YOU CAN RUN YOURSELF
             Head     Ask the buyer question. Then read three things.
             1  Whether you are named at all.
             2  The sentence attached to your name.
             3  Who else is in the list.
             Footer   No account needed.
SAME:        renderer, fonts, logo, colour tokens and verification as asset A.
MUST NOT:    carry a URL, a price or a plan name.
```

### Assets confirmed reusable, no work needed

| File | Size | Used on |
|---|---|---|
| `threads/images/threads-1-companies-converge-1080x1350.png` | 1080x1350 | Day 2 |
| `threads/images/threads-2-an-emoji-changed-the-score-1080x1350.png` | 1080x1350 | Day 6 |
| `threads/images/threads-3-the-near-miss-1080x1350.png` | 1080x1350 | Day 4 |
| `threads/images/threads-4-an-empty-field-1080x1350.png` | 1080x1350 | Day 9 |
| `instagram/feed/feed-04-one-prompt-five-engines.png` | 1080x1350 | Day 11 |
| `linkedin/feed/li-03-pages-contradict-1200x1200.png` | 1200x1200 | Day 12 |
| `linkedin/feed/li-02-language-picked-the-list-1080x1350.png` | 1080x1350 | Day 14 |

All seven measured with Pillow and confirmed inside Threads' 320 to 1440 px
width range.

### Assets that look reusable and are not

- **`x/images/*.png` are 1600 x 900.** Above the Threads 1440 px maximum width.
  Do not upload them. `channel-specs-2026-07-29.md` calls the 1440 ceiling the
  most important number on this channel and the one aggregators get wrong. If an
  X card is ever wanted here, re-render at 1440 x 810 rather than downscaling a
  finished raster, so the type is laid out at the target size.
- **`instagram/stories/*.png` are 1080 x 1920.** Legal on Threads, since 0.5625:1
  is well inside the 10:1 limit, but they render as a very tall feed card with
  the type small. Built for a full-screen story surface, not a feed row.
- **The reel `-silent.mp4` masters.** The package README's rule, upload silent
  not scored, is a Reels, TikTok and Shorts rule: those platforms pair a silent
  master with in-app audio and that pairing is what earns distribution. **Threads
  has no equivalent**, so a silent master plays as silence. If video is ever put
  on Threads, the `-scored.mp4` cut is the correct one. No video slot is in these
  fourteen days.

### The existing Threads images are 1080 px wide, not 1440

Legal and in use. Worth knowing for the next render: `channel-specs-2026-07-29.md`
recommends rendering Threads images at exactly 1440 x 1800 or 1440 x 1440, and
the four existing files were built at 1080 x 1350, which is the Instagram feed
size. They are inside the valid range so this is not a defect and they are not
being re-rendered. New Threads assets should be built at 1440.

---

## 10. What this plan does not include

- **No pricing, and no mention of the Radar tier.** All fourteen slots are TOFU
  or MOFU, and the campaign brief section 3 rule 9 forbids pricing on a TOFU
  asset. Radar is verified and documented in `PROFILE.md` section 8 so that the
  first BOFU post on this channel has the real numbers, but it appears in no post
  here.
- **No Grok or Google AI Overviews figure.** Both went live 2026-07-29. P9 names
  them as part of the lineup with their live date, which is a product fact. No
  rate, share or finding is computed from them, because a rate from a few days of
  rows is worthless and a company selling measurement cannot publish one.
- **No superlative about the research program.** Sixteen of the 27 city pages
  assert one and they contradict each other, which P12 is about.
- **No named measured subject.** No company, firm, restaurant, bank or agent from
  any result set is named. The engines are named throughout, because they are the
  instrument rather than the subject.
- **No third-party statistic.** Every figure in these fourteen days traces to a
  BrandGEO collection run on a named date.
