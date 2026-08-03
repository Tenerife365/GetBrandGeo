# Publishing plan: deplete the runway, then measure

Open this every morning. Do the day. Tick the boxes.

**The decision, 2026-08-02.** Everything already produced gets published across
every platform over four weeks. Then we read the numbers and cut what did not
work. The content is already paid for and posting it costs minutes, so the
question is not whether it is worth making. It is which platforms return
anything, and that is only answerable by shipping it and measuring.

**This overrides the council's recommendation, deliberately.** Three advisors
said mirror to fewer platforms. Their cost case was about producing content, and
production already happened. The measurement plan below is what makes this a
test rather than a guess.

**Nothing below needs generating. Every asset exists on disk and has never been
posted.**

---

## Attribution, read this before you post anything

If this part is wrong, four weeks of work produces no answer and we do it again.

**Every link in the copy is UTM tagged.** You do not need to do anything, it is
already in the text you paste. Do not retype links by hand or the tag is lost.

**Three platforms cannot carry a link at all.** TikTok and Threads captions take
none, and Instagram captions take none that is clickable. Counted on disk: TikTok
0 of 18 sidecars carry a link, Threads 0 of 9, Instagram 4 of 26. For those, the
bio link is the only attribution path.

**Set these bio links today, before the first post goes out.** Each platform gets
its own tagged URL so Plausible can tell them apart:

| Platform | Bio link to set |
|---|---|
| Instagram | `https://getbrandgeo.com/?utm_source=instagram&utm_medium=bio#free-audit` |
| TikTok | `https://getbrandgeo.com/?utm_source=tiktok&utm_medium=bio#free-audit` |
| Threads | `https://getbrandgeo.com/?utm_source=threads&utm_medium=bio#free-audit` |
| YouTube channel | `https://getbrandgeo.com/?utm_source=youtube&utm_medium=channel#free-audit` |
| X profile | `https://getbrandgeo.com/?utm_source=x&utm_medium=bio#free-audit` |

**These override `threads/PROFILE.md`, which argues for a bare bio link with no
parameters on the grounds that a profile link is read for years and a query
string is visible clutter.** That reasoning is sound for a permanent link and
wrong for these four weeks: Instagram feed, Reels, TikTok and Threads carry no
link in any caption, so the bio is their only attribution path. Untagged, those
platforms report nothing on 31 August regardless of how they perform, and you
cannot cut what you cannot read. **Strip the parameters back out on 1 September**
once the test has answered the question.

The query string sits before any `#` fragment, never after, or the link breaks
silently.

**One rule for every video upload: use `-silent.mp4`, never `-scored.mp4`.** The
silent masters carry no audio stream, so the platform pairs them with in-app
audio, which is what earns distribution on Reels, TikTok and Shorts.

**Every media file has a `.txt` sidecar of the same name holding exactly the copy
that ships with it.** Upload the media, paste the whole txt. Nothing to assemble.

---

# TOMORROW, Monday 2026-08-03

Do the bio links first, once, five minutes. Then:

### Morning, about 10 minutes

**1. Post BG-028 to the BrandGEO company page.**
Text: `linkedin-series-2026-08/BG-028/01-post.md`, everything under `## Post`
Image: `og-cards/cards/og-bg-028.png`
No link in the body.

**2. Add the first comment, straight after it appears.**
Text: same file, under `## First comment`. Already UTM tagged.

### Afternoon, about 15 minutes. Leave at least four hours after the morning post.

**3. Publish the BG-028 Article.** Company page, "Write article".
Text: `BG-028/02-article.md` under `## Article body`
Title: the `**Suggested title:**` line. Cover: `og-bg-028.png`
Bold the subheads after pasting, they are listed at the bottom of that file.

**4. Post the announcement.** Text: `BG-028/03-article-announcement-post.md`.
Paste the Article URL where marked. An Article does not reach the feed on its own.

**5. Founder repost, personal profile.** Text: `BG-028/04-founder-repost.md`.
Repost with commentary, never a bare reshare.

---

# The daily pulse layer (S22), ruled 2026-08-03

The runway above is a fixed queue and stays untouched. On top of it,
**every platform gets at least one unit every weekday** for the full 30-day
sprint. Where the tables below leave a platform silent on a weekday, a
daily pulse chat generates an adaptive unit for it: sprint progress
(numbers only after Constantin approves them that day), one industry trend
scan per day with the source cited in the sidecar, or an opportunity hook.
Full protocol and the kickoff: registry S22 in
`SPRINT-100-KICKOFFS-2026-07-31.md`.

Three rules that protect the measurement this file exists for:

1. Pulse links carry `utm_campaign=pulse` beside the platform's
   `utm_source`. Runway posts keep their tags. On 08-24 the layers read
   separately; the cut rule applies to each platform's combined number.
2. The pulse never displaces or reorders a runway unit. If both exist for a
   platform on a day, the runway posts first.
3. **The X gap is closed by ruling:** the 8 LinkedIn research posts get
   X-length trims from the pulse session. The "decision owed before week 2"
   above is settled.

Constantin posts everything; the pulse chat only generates and stages into
`social/1-Pending/pulse/YYYY-MM-DD/` with sidecars, paste-ready.

---

# The four weeks

Research lane is LinkedIn. Market lane is everything else. Video cut N means
upload that cut to Instagram Reels, TikTok, YouTube Shorts and Facebook, four
uploads, same silent master, each with its own sidecar text.

## Inventory against 15 weekdays, counted 2026-08-03

Every channel runs from day one. A video "cut" is one silent master posted to
four platforms, so 9 cuts is 9 posting days per video platform, not 36.

| Channel | Units | Per weekday | Verdict |
|---|---|---|---|
| LinkedIn research | 8 posts + 8 Articles | 0.5 + 0.5 | fine |
| Facebook | 4 feed + 4 link + 9 video = 17 | 1.1 | fine |
| Instagram | 4 feed + 4 stories + 9 reels = 17 | 1.1 | fine |
| TikTok | 9 + 8 bilingual = 17 | 1.1 | fine |
| YouTube Shorts | 9 + 8 bilingual = 17 | 1.1 | fine |
| Threads | 14 (P1 to P4 chained, P5 to P14) | 0.9 | fine |
| GBP | 4 | 0.27 | fine, see note |
| X | **4** (2 threads, 2 standalones) | **0.27** | **UNDER-SUPPLIED** |

**GBP is fine at four.** A GBP post expires after 7 days, so one or two a week is
the native cadence. Four covers three weeks.

**X is the one real gap.** Four units across 15 weekdays is one post every four
days, which is below the cadence X rewards, so a weak result there would be
ambiguous between "the channel does not work" and "we barely showed up." The
cheap fill is to trim the 8 LinkedIn research posts to X length. That is editing
existing copy, not new research. Decision owed before week 2.

**YouTube long-form is not in the runway.** `youtube/longform/` holds a script, a
storyboard and an `OPEN-QUESTIONS.md`, and zero video. It needs Constantin on
camera. Treat it as a production task, not a posting task.

## Week 1, 08-03 to 08-07

| Day | LinkedIn | Video (IG/TikTok/YT/FB) | Static |
|---|---|---|---|
| Mon 08-03 | BG-028 post, Article, announce, repost | | Bio links, GBP 1, FB link 1, IG feed 1, Threads P5, X standalone 1 |
| Tue 08-04 | BG-029 post | Cut 1 | IG stories 1 |
| Wed 08-05 | BG-029 Article, announce, repost | Cut 2 | FB feed 1, Threads P6 |
| Thu 08-06 | | Cut 3 | FB link 2, Threads P7 |
| Fri 08-07 | | Cut 4 | GBP 2, IG feed 2, Threads P8 |

## Week 2, 08-10 to 08-14

| Day | LinkedIn | Video (IG/TikTok/YT/FB) | Static |
|---|---|---|---|
| Mon 08-10 | BG-030 post | Cut 5 | FB feed 2, Threads P9 |
| Tue 08-11 | BG-031 post | Cut 6 | IG stories 2, X thread A |
| Wed 08-12 | BG-030 Article, announce, repost | Cut 7 | GBP 3, Threads P10 |
| Thu 08-13 | BG-031 Article, announce, repost | Cut 8 | FB link 3, IG feed 3 |
| Fri 08-14 | | Cut 9 | LinkedIn carousel, Threads P11 |

The carousel needs assembling into a PDF first. LinkedIn document posts take PDF
only, and whether it renders correctly cannot be checked from here.

## Week 3, 08-17 to 08-21

| Day | LinkedIn | Video (IG/TikTok/YT/FB) | Static |
|---|---|---|---|
| Mon 08-17 | BG-032 post | Bilingual Berlin, DE + EN | FB feed 3, Threads P12 |
| Tue 08-18 | BG-033 post | Bilingual Madrid, ES + EN | IG stories 3, X thread B |
| Wed 08-19 | BG-032 Article, announce, repost | Bilingual Paris, FR + EN | GBP 4, Threads P13 |
| Thu 08-20 | BG-033 Article, announce, repost | Bilingual Rome, IT + EN | IG feed 4 |
| Fri 08-21 | BG-034 post | | IG stories 4, Threads P14, X standalone 2 |

## Monday 2026-08-24: the measurement day

No posting. Read the numbers and cut.

**Two things spill past the measurement point, deliberately.** BG-034's Article
and the whole of BG-021 fall outside the three weeks, because 8 research topics
at 2 posts and 2 Articles a week needs four. That is fine: the measurement is
about which CHANNELS earn their keep, not about finishing the research queue.
Carry both into week 4 whatever the numbers say.

**`fb-link-04` and `fb-feed-04` are excluded from every week above.** Both point
at `/bg-004.html`, which the campaign README calls unusable for any engine count.
That is why Facebook shows 15 scheduled units rather than 17.

---

## The scoreboard, fill it weekly

Plausible reads UTM parameters for free under Sources. One row per platform per
week. Takes ten minutes on a Friday.

| Week | Platform | Visits | Audits started | Emails captured | Signups | Paid |
|---|---|---|---|---|---|---|
| 1 | linkedin | | | | | |
| 1 | instagram | | | | | |
| 1 | tiktok | | | | | |
| 1 | youtube | | | | | |
| 1 | facebook | | | | | |
| 1 | x | | | | | |
| 1 | threads | | | | | |
| 1 | gbp | | | | | |

Copy the block for weeks 2, 3 and 4.

**The cut rule, agreed in advance so the result is not argued afterwards: any
platform with zero emails captured after four weeks is dropped.** Deciding the
metric now is the point. Picking it after seeing the numbers means the winner is
whichever metric got looked at first.

---

## Two gaps that will blunt the measurement, neither fixed

Both are code, not posting, and both are worth closing before 08-31.

1. **`SPRINT-100-SCOREBOARD.md` has no channel column.** Fill it faithfully for
   30 days and it still cannot attribute a single subscriber to a platform.
2. **`prospect_leads` does not capture `utm_source`.** That is the only point in
   the schema where attribution could survive from a post to a Stripe
   subscription. Without it, a signup 20 days later has no way back to the post
   that started it. The audit email gate is where it would be captured.

Until 2 is fixed, the last two columns of the scoreboard have to be filled by
hand from Stripe, and the link back to a platform is an inference rather than a
record.

---

## Ledger, tick as you go

### Research lane
- [ ] BG-028 post - [ ] BG-028 Article
- [ ] BG-029 post - [ ] BG-029 Article
- [ ] BG-030 post - [ ] BG-030 Article
- [ ] BG-031 post - [ ] BG-031 Article
- [ ] BG-032 post - [ ] BG-032 Article
- [ ] BG-033 post - [ ] BG-033 Article
- [ ] BG-034 post - [ ] BG-034 Article
- [ ] BG-021 post - [ ] BG-021 Article

### Video cuts, four platforms each
- [ ] Cut 1 - [ ] Cut 2 - [ ] Cut 3 - [ ] Cut 4 - [ ] Cut 5
- [ ] Cut 6 - [ ] Cut 7 - [ ] Cut 8 - [ ] Cut 9

### Bilingual cuts, two languages each
- [ ] Berlin - [ ] Madrid - [ ] Paris - [ ] Rome

### Static
- [ ] X thread 1 - [ ] X thread 2 - [ ] X thread 3
- [ ] Threads 1 - [ ] Threads 2
- [ ] GBP 1 - [ ] GBP 2 - [ ] GBP 3
- [ ] LinkedIn carousel (assemble PDF first)
- [ ] Instagram feed set - [ ] Instagram stories set
- [ ] Facebook feed set - [ ] Facebook link cards

### Setup
- [ ] Five bio links set

---

## Two things not to trip over

**The engine lineup in old files is stale.** Grok and Google AI Overviews went
live 2026-07-29, so it is seven engines on Growth PRO and above. Meta AI is
retired. Anything saying five engines is out of date.

**A measurement keeps the denominator it was measured with.** The bilingual cuts
report a 2026-07-10 run on four engines, one of them Meta AI, with ChatGPT
failing that day. That is a fact about that run, not a claim about today's
product. Never restate a historical count as the current lineup.
