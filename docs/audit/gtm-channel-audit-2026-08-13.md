# GTM channel audit, 2026-08-13 (Pillar 5: channels and targeting)

Seat: go-to-market, five-seat product-status audit. Question: is anyone
actually driving qualified traffic today, and did the early interest come
from channels that then went silent?

Method: repo read (sprint registry, directory packs, social folders, git
log), live external checks run today (Product Hunt, SaaSHub, Uneed,
AlternativeTo, Fazier, G2, Indie Hackers, DevHunt searches and direct
fetches, Threads profile, DNS on the outbound domain, live homepage and
site.js fetch). Every claim is tagged MEASURED (a URL, file, command output
or search result observed this session) or INFERRED (a conclusion drawn from
measured facts). No file outside this one was written; no account, form,
post, or login was touched.

---

## TL;DR

**The quiet is not a mystery and it is not channel decay. It is the
scheduled result of three facts:**

1. **Every source of the first-weeks interest was a one-time or
   founder-manual event** (July LinkedIn post bursts, the Jul 14 AI
   Visibility Index paper, the Jul 24 content wave, the Aug 4 Product Hunt
   and SaaSHub listings). None of them was a repeating channel. When the
   founder stopped pushing, arrivals stopped. MEASURED: last LinkedIn draft
   doc 2026-08-02, last social posting day 2026-08-03, last repo commit of
   any kind 2026-08-07.
2. **Neither of the two planned always-on channels ever ran.** Cold
   outbound: the sending domain `trybrandgeo.com` returns NXDOMAIN today,
   so it was never registered and zero cold emails have ever been possible
   (MEASURED: nslookup 2026-08-13; the full build-out instruction set has
   sat ready in `docs/growth/outbound-infra.md` since 2026-07-31). Daily
   social: 14 day-folders are fully staged in
   `docs/growth/social/1-Pending/` but `2-Posted/` contains exactly one day
   (2026-08-03); the nine folders dated 08-04 through 08-12 expired
   unposted (MEASURED: folder listing today).
3. **Since 2026-08-07 the site has no web analytics at all**, so what
   traffic remains is invisible. Plausible was removed when the
   subscription lapsed (MEASURED: commit `1b9bd24`), and the live homepage,
   `site.js`, and `bg-001.html` fetched today contain zero
   gtag/googletagmanager/plausible references (MEASURED: curl + grep,
   2026-08-13). The sprint scoreboard has TBD in every cell for all 13
   elapsed days (MEASURED: `SPRINT-100-SCOREBOARD.md`). The repo's own
   words: "The traffic drop that follows is measurement, not demand"
   (commit `5e789a8`).

**Is it a traffic problem?** Yes, but a self-inflicted and specific one:
there is currently no channel firing at all, and no instrument that could
show one firing. It is not evidence that the channels tried and failed;
apart from Product Hunt (which ran and produced 3 upvotes), the channels
were never tried.

**Single biggest channel gap:** no continuously firing channel exists.
The cheapest fixes are assets already built and idle: the staged social
runway (13 more days of content, ready to paste) and the outbound
infrastructure (738 lines of copy-paste instructions, blocked only on a
EUR 12 domain registration that never happened).

---

## Channel matrix

States: LIVE (verified externally today), PARTIAL, NOT EXECUTED, DEAD
(was running, stopped), N/A.

| Channel | Planned where | Executed? External evidence (2026-08-13) | Current state | Result signal |
|---|---|---|---|---|
| Product Hunt | `launch-directories/product-hunt.md`, S23 lane 2, staged Day 10, launched early 08-04 | YES. MEASURED: producthunt.com/products/brandgeo-2 live, launched ~9 days ago, topics now Analytics/SaaS/AI (the wrong-topic fix landed) | LIVE, dormant | **3 upvotes, 7 followers, 0 reviews** (MEASURED). Launched with zero audience prep (0 pre-launch followers, 1 gallery image per the pack). A one-day trickle, then nothing |
| SaaSHub | `launch-directories/saashub.md`, S23 lane 1 | YES. MEASURED: saashub.com/brandgeo-global-alternatives live, copy accurate (7 engines, EUR 29 Radar), 14 alternatives listed | LIVE, static | Backlink + comparison placement exists. No engagement signal visible |
| Uneed | `launch-directories/uneed.md`, mid-submission 08-04 | NO. MEASURED: uneed.best/tool/brandgeo returns 404; no listing surfaced in search | NOT EXECUTED (submission died mid-flow) | None |
| Fazier | `launch-directories/fazier.md`, staged Day 10 | NO. MEASURED: no listing at fazier.com/launches/brandgeo, search negative | NOT EXECUTED | None |
| DevHunt | `launch-directories/devhunt.md`, staged Day 10, fit flagged as questionable in the pack itself | NO. MEASURED: search negative | NOT EXECUTED (pack itself recommends verifying fit first) | None |
| AlternativeTo | `launch-directories/alternativeto.md`, lane 1; requires a 1-week-old account before submitting | NO. MEASURED: alternativeto.net/software/brandgeo/ returns 404, search negative | NOT EXECUTED. INFERRED: the account-age clock was likely never started | None |
| G2 | `launch-directories/g2.md`, lane 1; 3-5 day approval | NO. MEASURED: search negative. 9 days have passed since the pack was written, longer than the approval window | NOT EXECUTED. INFERRED: never submitted | None |
| Indie Hackers | `launch-directories/indie-hackers.md`, lane 1 | NO. MEASURED: search negative | NOT EXECUTED | None |
| LinkedIn company page | `launch-directories/linkedin-company-page.md` (CTA button + Featured item); page exists at linkedin.com/company/79409681 | Page exists (MEASURED: referenced in site JSON-LD and by the Dealroom profile). CTA/Featured edits and posting activity UNVERIFIABLE here (auth wall) | UNKNOWN, founder check needed | Founder's personal + company LinkedIn posting was the main July channel (draft docs dated 07-14, 07-15, 07-16, 07-17, 07-22, 07-24, 08-02); drafts stop 08-02 |
| Google Business Profile | `launch-directories/gbp.md` + `outbound-infra.md` STEP 6 (photo/description fix, Products entries) | UNVERIFIABLE here (needs Maps/owner view). Last known state: advertising retired Meta AI and a wrong engine count (`gbp-live-assets-stale` memory). No execution record in repo | STALE until proven otherwise | None. 8 GBP posts (gbp-1 to gbp-8, one per plan) are written and staged, unposted |
| Threads @brandgeo_global | Footer + daily pulse layer (S22) | YES, briefly. MEASURED: profile live, 4 posts (Jul 31 to Aug 3) | DEAD since 08-03 | **0 followers** (MEASURED) |
| X | Daily pulse (S22 ruled X trims of LinkedIn posts, staged in every pulse folder) | NO. MEASURED: no BrandGEO/getbrandgeo X account surfaced in search | NOT EXECUTED. INFERRED: no public X account exists; staged X copy has nowhere to go | None |
| Facebook / Instagram / TikTok / YouTube | Daily runway folders, 8 platforms | One day. MEASURED: commit `d39ab2e` "day one posted across 8 platforms" (08-03); `2-Posted/` holds only that day | DEAD since 08-03 | Unknown (no analytics, no platform check possible here) |
| Cold outbound (2 inboxes, Saleshandy, warmup) | `outbound-infra.md` (S8): trybrandgeo.com, 2 Workspace inboxes, exact SPF/DKIM/DMARC, Saleshandy USD 25/mo, 20 to 50/day ramp | NO. MEASURED: `nslookup trybrandgeo.com` = NXDOMAIN today, domain never registered. S8 registry row frozen at "Constantin is on STEP 1" since 07-31 | NOT EXECUTED (step zero) | Zero sends, ever. The sprint's entire Volume pillar (75 touches/day) never existed |
| SEO content (34 bg-* articles, 27 city, 10 industry, 10 comparison, 4 press releases) | Live on getbrandgeo.com; 92 of 98 pages carry the /#free-audit CTA (CLAUDE.md, verified 08-02) | Pages LIVE (MEASURED: fetched today, CTA present on homepage). Indexing: IndexNow only (Bing/Yandex/Seznam/Naver); Google gets nothing automatic and no manual Search Console submission is recorded anywhere in the repo | LIVE but largely invisible to Google | MEASURED: site:getbrandgeo.com via this session's search surfaced only a handful of pages (terms, bg-001, bg-002, blog). Weak instrument, but consistent with IndexNow-only reality. Exact count needs Search Console. INFERRED: most of the ~100 pages are not in Google |
| Free audit tool | Homepage hero, target of every UTM link | YES. MEASURED: live today, `#free-audit` + `brandInput` present on the fetched homepage; end-to-end verified 07-31 (S3, ~EUR 0.24 real run) | LIVE, working | MEASURED (S3 registry, 07-31): lifetime counters were public audits 4, unlocked 2, emails 2, including internal tests. Effectively unused |
| Affiliate/referral (S20, PromoteKit) | Stripe coupon `BPRFREE` live | Stripe side only. PromoteKit account never created (S20 registry row) | NOT EXECUTED | None |
| Paid ads | Not planned in window | N/A | N/A | N/A |

Adjacent finding, discoverability: **brandgeo.co is a different company**
selling AI visibility audits ("all 5 AI engines, white-label PDFs, $79
Starter") and it surfaces in the same searches as BrandGEO; this session's
own web searches repeatedly conflated the two products in summaries
(MEASURED). Brand-name searches are being split with a near-identical
competitor. `brandgeo.com` itself is parked for sale at USD 9,995 (known,
ruled OPEN 07-31).

---

## The first-weeks-interest explanation

Public since ~2026-07-06. The interest window (roughly Jul 10 to Aug 4) maps
one-to-one onto one-time pushes, all MEASURED from git history and docs:

- **2026-07-14 to 07-17:** AI Visibility Index Issue #1 published (07-14),
  "published paper" LinkedIn article + teaser posts (07-16), plus LinkedIn
  post batches drafted 07-14, 07-15, 07-17. This was the founder posting by
  hand, the only channel that ever ran repeatedly.
- **2026-07-16 to 07-19:** IndexNow goes live; 57 then 79 URLs pushed to
  Bing/Yandex/Seznam/Naver. Any search-driven arrivals in this window were
  from non-Google engines by construction.
- **2026-07-24:** the content wave: BG-019 through BG-026 plus 10 new US
  city pages committed in one day, with LinkedIn kits.
- **2026-08-01:** bilingual series BG-027 to BG-034 published plus the
  Radar plan announcement press page.
- **2026-08-03:** social day one posted across 8 platforms (the only
  posted day).
- **2026-08-04:** Product Hunt launch (3 upvotes) and SaaSHub listing.

What that interest actually consisted of, from repo records: a competitor
(SlateHQ) creating a self-serve account to scout the product
(`slatehq-competitor-signup` memory, MEASURED); a handful of free signups,
some of whom hit the then-broken free-tier activation
(`free-tier-activation-broken` memory); and the real revenue, which was
founder-sold entirely outside any channel: the S21 revenue work found
`clients.stripe_customer_id` populated for only 1 of 38 clients (a test
row), meaning **every real paying client was provisioned by hand**
(MEASURED: CLAUDE.md S21 entry). The paying-shaped mix on 2026-08-01 was 1
essentials, 2 growth, 1 growth_pro, 3 managed, 2 free (MEASURED: CSA
baseline).

Then every input stopped inside five days: LinkedIn drafts stop 08-02,
social posting stops 08-03, the PH launch spike ends 08-04/05, the last
repo commit is 08-07, and Plausible is removed 08-07. INFERRED, with high
confidence: the "then silence" is fully explained by the inputs stopping
plus the measurement going dark; no channel decayed, because no channel was
running.

One caveat the founder should close: the S3 registry row still says
checkout was DOWN (2026-07-31) while CLAUDE.md's 2026-08-02 entry says it
was fixed and verified end to end on the new Spanish Stripe account. The
newer claim is the better-evidenced one (live POST + EUR 1 provisioning
test), but the conflict has stood unresolved since Day 3 of the sprint. If
checkout is down, no channel matters; confirm it first.

---

## Feedback-loop status

**There is none. Plainly.** MEASURED by search across the whole repo:

- No exit survey, no user interview notes, no churn or cancellation record,
  no NPS, no abandonment analysis exists anywhere in `docs/` or the
  dashboard code. The only "churn" mentions are forward-looking assumptions
  in strategy docs (`GTM-STRATEGY.md`, pricing feasibility docs).
- The audit tool's email capture works and records failures honestly
  (`prospect_leads.hubspot_error = not_configured`), but HubSpot is not
  configured, so captured leads trigger nothing (MEASURED: S3 registry).
- The error monitor (S13, Sentry) was never stood up; the account creation
  has been on the founder's action list since Day 1 (MEASURED: registry +
  every daily brief).
- The sprint's own instrument, the scoreboard, has never held a single
  number: sends, DMs, replies, signups, paying, MRR all TBD for all 13
  elapsed days (MEASURED).

Consequence: the company currently cannot learn anything from a visitor,
a signup, a customer, or a failure, by any mechanism other than the founder
noticing.

---

## Traffic data: what only the founder can pull

Plausible was the analytics from launch until 2026-08-07 and was then
removed because the subscription lapsed (MEASURED: commit `1b9bd24`).
Whether the dashboard is still viewable depends on Plausible's lapsed-account
grace handling; if the dashboard still opens (or after reactivating), it
covers 07-06 to 08-07, which is exactly the interest window this audit is
asking about. **Five views to screenshot, all scoped 2026-07-01 to
2026-08-07:**

1. **Top Sources**, full window. Answers where the first-weeks interest
   actually came from (expect: linkedin.com, direct, bing).
2. **Weekly visitors trend**, full window. The spike-then-quiet shape and
   which weeks carried it.
3. **Top Pages / Entry Pages**, full window. Which content pulled: hero vs
   bg-* articles vs city pages vs comparison pages. This is the
   traffic-quality question in one screenshot.
4. **UTM breakdown** (utm_source / utm_campaign). Caveat: the directory
   UTM links only went live 08-04 and Plausible died 08-07, so at most 3
   days of directory attribution exist. campaign2607 and bg-0xx tags from
   the social/LinkedIn series are the more likely rows.
5. **Goal conversions** for the audit CTA, if any goals were ever
   configured. If the goals list is empty, screenshot that too: it means
   conversion was never measured even while analytics ran.

For traffic after 2026-08-07, no web analytics exists. The three
instruments still available today, all founder-only:

- **Google Search Console**: Performance (clicks/impressions/queries, last
  30 days) and Index coverage (how many of the ~100 pages Google actually
  has; this session's external check suggests very few).
- **cPanel access logs / AWStats** on the 91.200.121.45 box: raw hits
  since 08-07, the only record of current traffic volume.
- **Supabase server-side counters**, which are analytics-independent and
  are the real funnel truth: `prospect_leads` rows and audit counters
  (lifetime 4 public audits as of 07-31), `client_events`, signups. One
  SQL read answers "did anyone use the product this week."

---

## Channel-product fit assessment (EUR 29-99 self-serve entry)

- **Directories** (PH, SaaSHub, AlternativeTo, G2, Uneed, Fazier): good
  fit, low-cost evergreen backlinks and comparison placement for a
  self-serve tool. State: 2 of 10 live, the rest unexecuted with packs
  ready. PH specifically was spent (a product gets one launch) at 3
  upvotes with zero audience prep.
- **Organic social**: right fit for the research-led wedge (the posts are
  data findings, not ads), and the asset factory works: 14 day-folders
  staged across 8 platforms. The last mile (a human pasting) ran once.
  Threads has 0 followers; X has no account; distribution to zero-follower
  surfaces cannot produce traffic regardless of content quality. LinkedIn
  (founder profile) is the only surface with any evidence of pull, and it
  went quiet 08-02.
- **Cold outbound at 2 warming inboxes**: fits the EUR 29-99 offer only
  with the evidence-led angle (the Evidence Machine one-pagers, S6), which
  was never built. The infra itself was never started. Even executed
  perfectly from today, first sends land ~day 8 at 20/day; this channel
  cannot explain or fix anything within two weeks alone.
- **SEO content**: the 10 comparison pages and "best-X" city pages are
  bottom-of-funnel intent, exactly right for self-serve. But the pages are
  invisible on Google (IndexNow only, no Search Console submissions
  recorded), and the informational city research (interesting, shareable)
  outweighs BOFU pages in volume ~4:1. The intent inventory is right; the
  distribution of it is absent on the one engine that matters most.
- **GBP**: marginal fit for a global SaaS (it serves local intent), but it
  is a free trust surface and it is currently actively wrong (retired
  engine advertised). Fix is written; unexecuted.
- **The free audit tool**: the strongest asset. Instant value, zero
  friction, already the target of every CTA and every UTM link, verified
  working end to end. 4 lifetime runs means the funnel INTO it, not the
  tool, is the constraint.

---

## Top 5 gaps, ranked by expected impact

1. **No measurement.** No web analytics since 08-07, scoreboard empty for
   all 13 sprint days, no error monitor, no feedback instrument. Until this
   is fixed nothing else can even be evaluated. (Cost to fix: one
   subscription decision plus one "close the day" ritual.)
2. **Outbound never started.** NXDOMAIN on the sending domain; the
   sprint's entire planned volume engine (target 75 touches/day) does not
   exist. Instructions have been ready, step by step, since 07-31. Every
   day unregistered pushes first-send day another day out (5 to 7 day
   warmup is physics, not process).
3. **Distribution stopped after one day with 13 days of content staged.**
   Nine built day-folders expired unposted (08-04 to 08-12); today's and
   tomorrow's are ready right now. The marginal cost of firing this channel
   is minutes per day of pasting; the marginal cost of NOT firing it was
   the entire social presence flatlining at 0 followers.
4. **Google cannot see the BOFU content.** ~100 pages, 92 with the audit
   CTA, submitted to IndexNow only. No recorded Search Console submissions.
   Comparison and alternative pages, the highest-intent inventory, cannot
   convert searchers who never see them. Compounded by brandgeo.co (a
   different company) absorbing brand-name search.
5. **Directory lane 60 percent unexecuted, and the executed half
   under-leveraged.** Uneed died mid-submission; AlternativeTo/G2/IH/
   Fazier never submitted (packs ready, exact paste text written); the
   LinkedIn CTA button and GBP Products edits (highest-leverage single
   edits on each surface, per their own packs) unconfirmed; PH page live
   but with 1 gallery image and an unanswered maker comment thread.

---

## 14-day channel plan sketch (existing, ready-to-fire assets ONLY)

Nothing below requires producing a single new asset. Every item names a
thing that already exists on disk or live.

**Day 1 (today):**
- Decide analytics: reactivate Plausible or accept Search Console + cPanel
  logs + Supabase counters as the stack. Screenshot the 5 Plausible views
  above if the dashboard still opens. Verify Search Console access works.
- Post today's staged folder: `1-Pending/2026-08-13 August 13 - The near
  miss/` has all 8 platform folders built. Move to `2-Posted/` after.
- Register `trybrandgeo.com` and start `outbound-infra.md` STEP 1-4
  (domain, 2 inboxes, DNS records are written out verbatim; ~EUR 35 total).
  The warmup clock only starts when this does.
- Create the AlternativeTo account (starts its mandatory 7-day age clock;
  submission itself happens day 8).
- Say "close the day" in a council chat so the scoreboard finally gets a
  baseline row from Stripe/Supabase.

**Days 2-5:**
- Post the staged folders on their days: 08-14 is fully built (BG-034
  LinkedIn bundle, gbp-8, x, reels scripts). 08-17 to 08-21 are built and
  waiting.
- Re-date the nine expired folders (08-04 to 08-12, all evergreen research
  findings) onto the empty back-half dates 08-24 to 08-30. This refills the
  calendar to month-end with zero new production.
- Execute the remaining lane-1 packs, one per day, exact paste text
  already written: Indie Hackers, G2 (3-5 day approval, so early), LinkedIn
  company page CTA button + Featured item, GBP STEP 6 photo fix + Products
  entries.
- Product Hunt post-launch runbook: add gallery images (three .avif
  product images already exist in `marketing/Product Publish/`), reply in
  the comment thread.
- Saleshandy free trial + warmup ON for both inboxes
  (`outbound-infra.md` STEP 5).

**Days 6-10:**
- Uneed: redo the submission from the pack (it is written end to end);
  Fazier likewise; DevHunt only after the fit check its own pack demands.
- Day 8: AlternativeTo submission (account clock cleared), including the
  "alternative to" links to the five competitor pages the pack names.
- mail-tester gate per `outbound-infra.md` 7.3 (target 9+). No real send
  before it passes.
- Manually submit the 10 comparison pages + top 10 city pages in Search
  Console URL Inspection (the decided manual path; ~20 minutes, uses pages
  that already exist).

**Days 11-14:**
- If mail-tester passed AND the S11 outreach scripts exist by then, first
  20/day sends pointing at the free audit. If S11 scripts do not exist,
  keep warming and do NOT improvise copy; S11 is a named, unstarted
  prerequisite, and this plan does not invent assets.
- Post the week's staged folders; "close the day" daily so the 08-24
  measurement checkpoint (S22's own success gate) reads clean.
- Screenshot Search Console performance for the first before/after read on
  the manual submissions.

What this plan deliberately does not do: build the Evidence Machine (S6),
write outreach scripts (S11), render the four missing Aug-14 videos, create
an X account, or produce any new article or campaign. Those are real gaps,
but they are production work, and the audit's finding is that the constraint
has never been production. It is the last mile: registering, pasting,
posting, submitting, and measuring.

---

*Audit trail: sprint registry `docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md`
(board rows S1-S23), `docs/growth/SPRINT-100-BRIEFS.md` (daily council
entries, last 2026-08-05/07), `docs/growth/SPRINT-100-SCOREBOARD.md` (all
TBD), `docs/growth/launch-directories/*.md` (10 packs, working tree),
`docs/growth/outbound-infra.md`, `docs/growth/social/` (1-Pending 14
folders, 2-Posted 1 folder), commits `1b9bd24`, `5e789a8`, `d39ab2e`,
`c48fd5b`, git log to 2026-08-07. External: producthunt.com/products/
brandgeo-2, saashub.com/brandgeo-global-alternatives, threads.com/
@brandgeo_global, 404s at uneed.best/tool/brandgeo and alternativeto.net/
software/brandgeo/, negative searches for G2/IH/Fazier/DevHunt listings,
nslookup trybrandgeo.com (NXDOMAIN), curl getbrandgeo.com + site.js +
bg-001.html (zero analytics tags), all 2026-08-13.*
