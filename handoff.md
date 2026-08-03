# Handoff, 2026-08-03 end of day

Supersedes the 2026-08-02 handoff. Read this top to bottom before doing
anything. Everything below was verified on disk or against a live surface today,
not remembered.

---

## 1. What this work is

A **15-weekday depletion run**, 2026-08-03 to 2026-08-21, publishing an already
built content library across 8 platforms, then reading the numbers on
**Monday 2026-08-24** and cutting whatever did not earn its place.

**Constantin ruled this deliberately against a three-expert council**, which
recommended mirroring to fewer platforms. His reasoning stands and is not to be
re-argued: the content is sunk cost, his marginal minute per post is small, and
the only way to learn which platforms work is to ship and measure. **Do not
reopen this.** If you think it is wrong, the place to say so is the 08-24 review.

## 2. Where everything lives

```
docs/growth/social/
  1-Pending/   14 remaining day campaigns, 2026-08-04 to 2026-08-21
  2-Posted/    2026-08-03, complete
  _scored/     88 music-bed videos, the DESKTOP posting path
  README - how this folder works.md    <- the convention, read it first
docs/growth/PUBLISHING-PLAN.md         <- the schedule, plus an S22 pulse layer
                                          Constantin added himself
G:\My Drive\GetBrandGEO\1-Pending\     <- silent videos + captions, for phone
```

Structure mirrors the TalentWeLove convention at `G:\My Drive\Talentwelove`,
with two deliberate deviations, both recorded in the social README: the library
is local rather than Drive, and `_scored/` exists where TWL forbids alternates.

**A campaign folder is one posting day.** Naming is `2026-08-04 August 4 - Title`.
Channel folders use each channel's own word: Reel on Instagram and Facebook,
Short on YouTube, video on TikTok. Each format folder holds the asset plus a
`post.md` whose front matter carries `link`, `alt`, `scheduled`, `posted_at`,
`posted_url`. Filling the last two is what moves a day to `2-Posted`.

## 3. Rules learned the hard way today

**Video files must be rendered with `-movflags +faststart` and a real audio
track.** Both were missing from every rendered file. The `moov` atom sitting at
the end of the file is what made Facebook uploads stall then fail; the missing
audio is why Instagram and YouTube first went out silent and had to be reposted.
**All 88 existing files are fixed. The render pipeline still produces broken
ones.** Fixing that at source is the highest-value task outstanding.

**Instagram and TikTok have no sound picker on desktop.** So:
- from **phone**: use `-silent.mp4` from Drive, then pick a sound in the app
- from **desktop**: use `-scored.mp4` from `_scored/`, music already baked in
- **never** post a silent file with no sound added, it gets almost no distribution

**Never rewrite content files with PowerShell `Get-Content` / `Set-Content`.** It
corrupts UTF-8 silently and these captions carry accents and arrows. Use the Edit
tool, or `[System.IO.File]::ReadAllText/WriteAllText` with explicit UTF8.

**A measurement keeps the denominator it was measured with.** Bilingual captions
report a 10 July 2026 run across four engines including Meta AI, with ChatGPT
failing that day. The product now covers seven. **Do not "correct" these.**
Present-tense product claims are different and must name the plan, because the
engine set varies by tier.

**No em dashes, no en dashes, no AI-tell vocabulary.** Standing project rule.

## 4. Attribution, which the whole run exists to produce

236 links are UTM tagged. Plausible reads them free under Sources.

Bio links are live and are the ONLY attribution path for Instagram feed and
reels, TikTok and Threads, whose captions cannot carry a link:

```
https://getbrandgeo.com/?utm_source=<platform>&utm_medium=bio#free-audit
```

Query string before the `#`, never after. **Strip these parameters on
2026-09-01**; they are a temporary override of `threads/PROFILE.md`.

**Cut rule, agreed in advance so it is not argued afterwards: any platform with
zero emails captured by 2026-08-24 is dropped.**

## 5. Open items, in priority order

1. **Render pipeline bugs** (`+faststart`, audio track). Friday 08-08 generation
   repeats today's entire cleanup unless fixed first.
2. **`prospect_leads` has no `utm_source`, and `SPRINT-100-SCOREBOARD.md` has no
   channel column.** Without both, 08-24 gives visit counts and cannot connect a
   platform to a paying customer. Spec and sequencing:
   `docs/growth/channel-attribution-spec.md`. Migration first, then the Netlify
   function, then `site.js`, or lead capture fails outright. One Netlify build.
3. **`gbp-4-plan-ladder-1200x900.png` is wrong; its post is marked BLOCKED.**
   Essentials shows 15 questions against 18 enforced, Growth PRO shows 35 against
   56, and Radar is missing entirely. Re-render before 08-19.
4. **Missing `post.md` files.** Nine format folders in the 08-03 campaign (4
   video, X, 4 LinkedIn) and all of 08-04 to 08-07, because an agent stalled.
   Media and `.txt` captions are present, so nothing is blocked.
5. **Turn off Instagram auto-share to Threads.** Every Instagram post currently
   lands on Threads carrying an Instagram-tagged bio pointer, contaminating the
   Threads number.
6. **Runway thins after 08-13.** Days 14 to 21 carry 1 to 2 videos instead of 4,
   because bilingual cuts are one render each rather than four platform renders.
   Constantin plans to generate more on Friday 08-08.
7. **X is under-supplied**, 4 units for 15 days. Constantin's S22 pulse layer in
   `PUBLISHING-PLAN.md` rules that the 8 LinkedIn research posts get X-length
   trims. Decision settled, execution outstanding.
8. **`posted_url` reads PENDING on every 08-03 post.** Constantin supplies the
   permalinks on 08-04.
9. **Uncommitted.** Today's work is not committed. `docs/growth/social/` media is
   gitignored by extension while `post.md` and `campaign.md` stay tracked, which
   is deliberate and written into `.gitignore`.

## 6. What happened today

All 8 platforms posted: LinkedIn post plus first comment with the Article
scheduled and announcement done, Instagram feed and Reel, Facebook link card and
Reel, TikTok, YouTube Short, X, Threads, GBP. Founder repost follows when the
Article publishes.

Scheduled counts as posted by Constantin's ruling, since it fires automatically.

Also today: two live marketing-site pages were corrected where the visible plan
ladder still said "Free: ChatGPT", false since 31 July. `bg-021` was corrected
directly; the dated news announcement got an update note instead, because
silently rewriting a dated announcement falsifies the record.

## 7. How he wants to be worked with

- **Give him the exact copy inline**, not a file path to open. He posts from chat.
- **Verify before asserting.** Several claims this session were wrong until
  measured: "only one page has the stale ladder" (two did), "the campaign never
  links to the free audit" (46 links already pointed at the root).
- **Correct yourself plainly and move on.** No preamble, no self-flagellation.
- **Hand him commands to run** rather than running git yourself.
- He challenges plans directly and is usually right. Answer the challenge rather
  than defending the plan.
