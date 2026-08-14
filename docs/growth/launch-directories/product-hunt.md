# Product Hunt pack and launch-day runbook

Lane: 2, launch-mechanics. **LIVE 2026-08-04** (Constantin launched today,
not the originally staged Day 10/2026-08-10, confirmed via
`producthunt.com/products/brandgeo-2?launch=brandgeo-2` showing "Live now").
The runbook below applies starting now, not on 08-10.

**Two live corrections still needed on the page as of 2026-08-04, flagged
urgent because the launch is running:**
- **Topic is set to "Social Media", wrong category.** Replace with
  Artificial Intelligence / Marketing / SaaS / Analytics per the picker
  below. A launch ranks partly by topic-relevant traffic, so a wrong topic
  actively hurts today's placement, fix this first.
- **Gallery still has only 1 image.** PH lets images be edited during a live
  launch; add the 2-4 more listed below as soon as they can be captured,
  every hour live without them is lost gallery-driven engagement.

## Current state, confirmed live 2026-08-04

Page exists at `producthunt.com/products/brandgeo-2` (prelaunch/upcoming
state, not yet a live launch). Confirmed as-is:

| Field | Current value | Status |
|---|---|---|
| Name | BrandGEO | fine |
| Tagline | "Are AI models recommending your brand, or your competitors?" | check length, PH caps taglines around 60 chars, this reads close to or over that; verify on the live editor and trim if flagged |
| Description | Names ChatGPT, Gemini, Grok, Google AI Overviews only | **stale, needs the full seven-engine list** (also names Claude, Perplexity, Google AI Mode per `planConfig.ts` LIVE_ENGINES) |
| Website | `getbrandgeo.com`, no UTM tag | **needs the tagged link below** |
| Launch date | Shows "2026" generically | **needs to be set precisely to 2026-08-10** |
| Followers | 0 | needs pre-launch "notify me" drive |
| Gallery | 1 image | **PH rewards 3-5+**, more needed |
| First comment | Not yet posted (goes live at launch) | **drafted below, ready to paste at launch** |

## UTM link

```
https://getbrandgeo.com/?utm_source=producthunt&utm_campaign=launch#free-audit
```

## Corrected description (replace the current one, which under-lists engines)

```
BrandGEO runs your brand's real buyer questions against up to seven AI
engines, ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI
Overviews, and Grok, and reports whether you're mentioned, where you rank
against named competitors, and what sentiment the answer carries. Free tier
available; paid plans start at EUR 29/month.
```

## Topics/categories to select (PH's tag picker)

```
Artificial Intelligence
Marketing
SaaS
Analytics
```
(Pick from PH's current live picker, these four are the closest match; add
"Generative AI" if it exists as a distinct tag.)

## Gallery, needs 3-5 images total (currently 1)

| Slot | Source |
|---|---|
| 1 (existing) | keep whatever is already uploaded if it's a real product shot, replace if it's a placeholder |
| 2 | **NEEDS CAPTURE**, `/ai-visibility` dashboard, real data |
| 3 | **NEEDS CAPTURE**, `/sentiment` dashboard, real data |
| 4 | **NEEDS CAPTURE**, `/competitors` dashboard, real data |
| 5 (optional) | logo/wordmark card, `docs/growth/CAMPAIGN-2026-07-30/_shared/logo/brandgeo-lockup-dark-transparent-w512.png` |

## First comment (already delivered live this session, reproduced here for
the record)

```
Hey Product Hunt,

I'm Constantin, the founder of BrandGEO.

I built this because more and more buying decisions start with a question
typed into ChatGPT, Gemini, Claude, or Perplexity instead of a Google
search, and most businesses have no idea what those tools are actually
saying about them. The answer engines pick names to recommend, and if
yours isn't one of them, you find out from a lost deal, not a dashboard.

BrandGEO runs your brand's real buyer questions (the kind your customers
actually ask, like "best CRM for small teams" or "best moving company in
Austin") against up to seven AI engines: ChatGPT, Gemini, Claude,
Perplexity, Google AI Mode, Google AI Overviews, and Grok. It tells you
whether you're mentioned, where you rank against competitors, what
sentiment the answer takes, and who's showing up instead of you.

Most of the tools doing this well are priced and built for enterprise
marketing teams. I built BrandGEO for the businesses that conversation
usually skips: no growth team, but a brand that AI is already forming an
opinion about, whether anyone told them or not. There's a free tier to
check your own visibility today, and Radar, a EUR 29 a month launch tier
(EUR 39 after launch), is built to make ongoing monitoring affordable for a
smaller business or a solo operator.

This is a young product and I'm close to every part of it. If something
doesn't behave the way you'd expect, or you're in a category of business
we haven't thought about yet, tell me here. I'd rather hear it from you
directly than guess.

Thanks for taking a look today.
```

---

## Launch-day runbook, 2026-08-10

### Before the day
- Confirm launch date is set to 2026-08-10 in PH's scheduler (PH launches go
  live at 12:01 AM Pacific time, plan the first-comment posting and
  Constantin's availability around that, not around Madrid/Canary Islands
  local time).
- Finish the gallery (3-5 images) and corrected description before
  scheduling, PH reviews the page ahead of the launch slot.
- Spend the days before building followers on the prelaunch page (0 today):
  share the prelaunch "notify me" link through the daily pulse layer (S22)
  and personal network, without asking anyone to upvote, PH's own guidelines
  treat explicit vote solicitation as manipulation and can get a launch
  penalized.

### Launch day
1. **Post the first comment immediately once the launch goes live** (draft
   above, already written).
2. **Reply cadence**: the first 3-4 hours set the day's ranking momentum.
   Reply to every comment within 15-30 minutes during that window, then
   check every 1-2 hours for the rest of the day. Every reply should be
   specific to what the commenter actually asked, generic thank-yous read as
   disengaged.
3. **Cross-post the launch, once it's live, not before**: per the S22 daily
   pulse layer, the launch is exactly the kind of "sprint progress" or
   "opportunity hook" the pulse session generates same-day units for. Have
   the daily pulse chat stage a same-day LinkedIn post and an X post/thread
   linking to the live PH page (not the prelaunch page), each carrying its
   own UTM: `utm_source=linkedin&utm_medium=ph_launch&utm_campaign=launch`
   and the X equivalent. Post these AFTER the PH page is live, sharing
   before launch just sends traffic to a page that isn't accepting votes
   yet.
4. **Do not ask for upvotes anywhere**, in the first comment, the cross-posts,
   or any reply. Share the page and the story; let people decide.
5. **Track the day** in `docs/growth/SPRINT-100-SCOREBOARD.md`, per S9's
   capture rule, the day's PH rank, comment count, and referred signups
   (readable in Plausible by `utm_source=producthunt`) all belong in that
   day's row.

### After the day
- If BrandGEO places (top 5, top product of the day, etc.), that badge is
  fair game to add to the marketing site and other directory listings once
  it's real, not before.
- Screenshot the final ranking and comment thread for the S23 registry
  record.

---

## Walkthrough checklist

1. [ ] Fix the tagline length if PH flags it over the cap.
2. [ ] Replace the description with the corrected seven-engine version above.
3. [ ] Update the website field to the UTM-tagged link.
4. [ ] Set topics/categories.
5. [ ] Add gallery images 2-4 (real dashboard screenshots) plus optional
   image 5.
6. [ ] Confirm the launch date is precisely 2026-08-10.
7. [ ] Run the pre-launch follower drive over the days before 08-10.
8. [ ] On launch day, follow the runbook above: first comment immediately,
   reply cadence, cross-post after (not before) going live, no upvote asks.
9. [ ] Record the day's result in the scoreboard and confirm the final live
   URL and ranking back in this chat for the S23 registry row.
