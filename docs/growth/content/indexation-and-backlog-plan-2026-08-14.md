# Indexation and backlog plan, 2026-08-14 (Sprint 17, Day 2)

Written because the Day-1 session that owed this file hit its subscription
limit before producing it. `docs/growth/content/` was empty. This is the
first file in it.

Scope: `docs/growth/content/indexation-and-backlog-plan-2026-08-14.md` only,
write scope per `docs/growth/GTM-TEAM.md`. Everything else in this repo was
read-only. No git command was run, nothing was posted, nothing was submitted.
No new long-form was produced anywhere; the one new sentence-level content in
this file is the deliverable itself (a queue and a map), not an article.

---

## 0. The material change, verified against the working tree today

`docs/growth/sprint17/PLAN-2026-08-13.md` was written before three commits
landed. Verified via `git log` and `git show --stat` on 2026-08-14:

| Commit | Date | What |
|---|---|---|
| `76cfe75` | 2026-08-13 15:48 | BG-035 to BG-054, 25 pieces |
| `3043ed3` | 2026-08-14 03:00 | BG-055 to BG-104, 50 pieces |
| `44ca26b` | 2026-08-14 05:04 | OG share-card images for BG-055 to BG-104 (images only, does not touch the html files) |

**Verified count on disk:** `ls brandgeo/web/bg-*.html | wc -l` returns **104**
files. Range is `bg-001.html` through `bg-104.html`, with one exception:
`bg-021.html` does not exist as such, the file is
`bg-021-retrieval-not-engine-count.html` (confirmed live, `curl` returns 200;
`bg-021.html` itself returns 404). The sitemap already uses the correct
slug for that one entry.

**Sampled for live HTTP status** (not assumed from disk): `bg-035`, `bg-055`,
`bg-080`, `bg-104`, all ten `brandgeo-vs-*` pages, all ten industry pages, all
27 city pages, `get-found-online.html`, and 13 named BG-035-104 articles used
below all returned `200` via direct `curl` against `getbrandgeo.com` today.
Full list of what was checked is in the Verification log at the end of this
file. **Production ran ahead of distribution by roughly 75 pages** (BG-035 to
BG-104, plus this is on top of the pre-existing 27 city, 10 industry, 10
comparison, 4 press-release and 34 original-article inventory). The PLAN's
"no new long-form until the staged backlog is fired" rule is accordingly
tightened, not relaxed: nothing new gets written until indexation and social
both catch up to what already exists.

---

## FINDING 0 (blocking, addressed first): the sitemap does not contain the new batch

**Verified two ways.** `brandgeo/web/sitemap.xml` on disk and the live
`https://getbrandgeo.com/sitemap.xml` (fetched via `curl` today) are
byte-identical (`diff` returns nothing), so this is not a stale-local-copy
question, it is live. Parsed both with the same regex `ping-sitemap.js` uses
(`<url>...</url>` blocks): **54** `bg-*` entries are present, highest is
`bg-054.html`. **`bg-055.html` through `bg-104.html`, 50 pages, do not appear
in the sitemap at all.**

**Why this matters more than a cosmetic gap.** `ping-sitemap.js` (the daily
05:10 UTC cron that feeds IndexNow) works by fetching the *live* sitemap.xml
and diffing it against `sitemap_pings` (source read today,
`brandgeo-dashboard/netlify/functions/ping-sitemap.js:37,58-69,93`). A URL
that is not in the sitemap is invisible to that job, permanently, not just
until the next run. So the 50 new pages have never been pinged to IndexNow
either. This is not a Google-only gap; it is a total-syndication gap. Every
future ping-sitemap run will keep missing these 50 pages until the sitemap
is fixed, independent of anything below.

**This does not block manual Search Console submission**, which works
URL-by-URL and does not require sitemap membership. Section 1 below can
proceed today regardless. But the fix is still first because it is the
cheapest highest-leverage item on this whole page: one file edit re-opens a
free, automatic channel (IndexNow to Bing/Yandex/Seznam/Naver) for 50 pages
at once, and it is not something `gtm-content` can do directly.

**The exact fix.** Insert the following 50 `<url>` blocks into
`brandgeo/web/sitemap.xml`, in the same place and same shape as the existing
`bg-035` to `bg-054` entries (`lastmod` matches the commit date, `changefreq
monthly`, `priority 0.8`, matching every existing `bg-0XX` research-article
entry). This is a mechanical, zero-judgement append, not a content decision:

```xml
  <url>
    <loc>https://getbrandgeo.com/bg-055.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-056.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-057.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-058.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-059.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-060.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-061.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-062.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-063.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-064.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-065.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-066.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-067.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-068.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-069.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-070.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-071.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-072.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-073.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-074.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-075.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-076.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-077.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-078.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-079.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-080.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-081.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-082.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-083.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-084.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-085.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-086.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-087.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-088.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-089.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-090.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-091.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-092.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-093.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-094.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-095.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-096.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-097.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-098.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-099.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-100.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-101.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-102.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-103.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://getbrandgeo.com/bg-104.html</loc>
    <lastmod>2026-08-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
```

Insert this block immediately after the existing `bg-054` entry (or anywhere
inside `<urlset>...</urlset>`, order inside the file does not matter to the
parser). **Owner: `bg-web`** (mechanical file edit, `brandgeo/web/` is its
write scope, `gtm-content` cannot edit repo source per `GTM-TEAM.md` section
2) **or Constantin directly**, since this is a pure append with no judgement
call. **Constantin commits and pushes**, since git is the cPanel deploy for
this file:

```
cd "C:\Users\const\Constantin Daniel Goane\BrandGEO"
git add brandgeo/web/sitemap.xml
git commit -m "fix(web): add BG-055 to BG-104 to sitemap.xml, 50 pages missing since the batch shipped"
git push
```

After this lands and cPanel deploys it, the next 05:10 UTC `ping-sitemap` run
will treat all 50 as new and IndexNow-ping them automatically (capped at 25
per run per `MAX_PINGS_PER_RUN`, so it will take 2 runs to clear all 50; no
action needed beyond the file fix, the cron does the rest).

**Minor secondary finding, not blocking.** Sitemap `<priority>` values are
internally inconsistent with actual business priority: all ten
`brandgeo-vs-*` comparison pages carry `priority 0.6`, while the BG-035 to
BG-054 research articles carry `0.8`. Google has not used the sitemap
priority field for ranking in years, so this has no real effect, but it is
worth a footnote so nobody reads the sitemap's own priority field as this
plan's priority order. This document's Section 1 order is the one that
counts, and it does not use the sitemap's `priority` field at all.

---

## 1. Indexation: prioritized manual Search Console submission queue

**Google gets nothing automatically.** `ping-sitemap.js` reaches IndexNow
(Bing, Yandex, Seznam, Naver) only; the Google Indexing API's credential was
permanently dropped 2026-07-28 (4KB Netlify Lambda env-var ceiling), and no
Search Console submission has ever been recorded anywhere in this repo. The
only path to Google is manual URL Inspection.

**Click path, stated once.** `search.google.com/search-console` → select the
`getbrandgeo.com` property → **URL Inspection** (top search bar) → paste the
full URL → wait for the result panel → if it reads "URL is not on Google,"
click **Request indexing** → wait for the request to queue before pasting the
next URL. Do not open multiple inspection tabs at once; the tool serializes
by design and rapid parallel requests are what triggers the daily quota
message.

**Sane batch size: 10 URLs per day.** INFERRED, not measured; Search Console
does not publish an exact daily cap on manual "Request indexing" actions.
Widely reported practitioner experience (and this queue's own design margin)
treats 10 to 12 per property per day as sustainable without hitting a "quota
exceeded" message, and it keeps the daily task under 15 minutes, which is
what makes it survive past day 2 of a sprint. Do not batch faster than this
to "catch up" the material-change gap; a rejected quota run wastes the day
entirely, a paced one does not.

**What is in this queue and what is deliberately left out.** The 10
comparison pages, the 10 industry pages, a ranked 12-city subset of the 27
city pages, and a 13-piece high-intent subset of the new BG-035-104 batch,
plus `get-found-online.html` and the 4 press releases, total **52 URLs**.
This is a deliberate cut, not the full ~150-page inventory. Per the standing
rule (`docs/audit/gtm-channel-audit-2026-08-13.md`, confirmed again in
`GTM-TEAM.md`'s framing of the sprint), informational city research
outweighs BOFU inventory roughly 4 to 1 by page count and must not be
allowed to eat the submission budget. Submitting all 27 cities and all ~90
remaining bg-articles before the highest-intent 52 is the exact failure mode
this cut prevents. The remainder is named as Tier Z below, deferred past day
7, not abandoned.

**City ranking basis, stated plainly.** The 12-city subset below is ranked
by general metro population and business-hub recognisability (INFERRED,
common-knowledge reasoning, not sourced from any analytics, since no
per-page traffic data exists for any of the 27 city pages). This is an
operational triage call, not a claim about which city's research is
strongest, richest or first; per the cross-program-superlative-ledger rule,
no such comparative claim is made anywhere in this document about the city
research itself.

### Indexation state, what was actually checked

No agent here holds Search Console credentials, so no row below is MEASURED
against Google's own index directly; only Constantin can produce that
reading. What was done: a same-day sample query through this session's
`WebSearch` tool, `site:getbrandgeo.com <slug>`, run against `peec` (a
comparison page), `newyork` (a city page), and `bg-055`, `bg-088`, `bg-036`
(new-batch pieces). This is explicitly a **weak instrument**: the search
backing `WebSearch` is not confirmed to be Google's own index, results
change source to source, and it is exactly the kind of check the audit
already flagged as weak. Result: none of the five sampled URLs surfaced;
the only getbrandgeo.com pages that surfaced across all three queries were
`bg-001.html` through `bg-004.html`, `terms.html`, and `blog.html`,
consistent with the 2026-08-13 audit's own sample. Every row below is
therefore marked `NOT ON GOOGLE (weak signal)` rather than a confident
MEASURED negative, and the one honestly measured fact is: **no comparison
page, city page, or BG-035+ article showed up in this sample, and no page at
all has ever been through Search Console.** Confirming any single URL's real
state requires Constantin's Search Console access; that is what Day 2's
batch is for.

### Batch 1: Day 2, 2026-08-14 (today)

| # | Page type | Buyer intent | URL | Indexed? | Batch |
|---|---|---|---|---|---|
| 1 | Done-for-you landing page | High, self-identifies the SMB/agency buyer who wants it handled | https://getbrandgeo.com/get-found-online.html | NOT CHECKED individually; INFERRED not on Google (never submitted) | Day 2 |
| 2 | Comparison | High, buyer actively comparing vendors | https://getbrandgeo.com/brandgeo-vs-ahrefs-brand-radar.html | NOT ON GOOGLE (weak signal, see above) | Day 2 |
| 3 | Comparison | High | https://getbrandgeo.com/brandgeo-vs-athenahq.html | NOT CHECKED individually; INFERRED not on Google | Day 2 |
| 4 | Comparison | High | https://getbrandgeo.com/brandgeo-vs-conductor.html | NOT CHECKED individually; INFERRED not on Google | Day 2 |
| 5 | Comparison | High | https://getbrandgeo.com/brandgeo-vs-goodie.html | NOT CHECKED individually; INFERRED not on Google | Day 2 |
| 6 | Comparison | High | https://getbrandgeo.com/brandgeo-vs-otterly.html | NOT CHECKED individually; INFERRED not on Google | Day 2 |
| 7 | Comparison | High | https://getbrandgeo.com/brandgeo-vs-peec.html | NOT ON GOOGLE (weak signal, sampled directly) | Day 2 |
| 8 | Comparison | High | https://getbrandgeo.com/brandgeo-vs-profound.html | NOT CHECKED individually; INFERRED not on Google | Day 2 |
| 9 | Comparison | High | https://getbrandgeo.com/brandgeo-vs-rankscale.html | NOT CHECKED individually; INFERRED not on Google | Day 2 |
| 10 | Comparison | High | https://getbrandgeo.com/brandgeo-vs-scrunch.html | NOT CHECKED individually; INFERRED not on Google | Day 2 |

### Batch 2: Day 3, 2026-08-15

| # | Page type | Buyer intent | URL | Indexed? | Batch |
|---|---|---|---|---|---|
| 11 | Comparison | High | https://getbrandgeo.com/brandgeo-vs-semrush.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |
| 12 | Industry | High, vertical buyer self-identifies | https://getbrandgeo.com/ai-visibility-for-ecommerce.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |
| 13 | Industry | High | https://getbrandgeo.com/ai-visibility-for-education.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |
| 14 | Industry | High | https://getbrandgeo.com/ai-visibility-for-financial-services.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |
| 15 | Industry | High | https://getbrandgeo.com/ai-visibility-for-healthcare.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |
| 16 | Industry | High | https://getbrandgeo.com/ai-visibility-for-home-services.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |
| 17 | Industry | High | https://getbrandgeo.com/ai-visibility-for-hotels.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |
| 18 | Industry | High | https://getbrandgeo.com/ai-visibility-for-law-firms.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |
| 19 | Industry | High | https://getbrandgeo.com/ai-visibility-for-real-estate.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |
| 20 | Industry | High | https://getbrandgeo.com/ai-visibility-for-restaurants.html | NOT CHECKED individually; INFERRED not on Google | Day 3 |

### Batch 3: Day 4, 2026-08-16

| # | Page type | Buyer intent | URL | Indexed? | Batch |
|---|---|---|---|---|---|
| 21 | Industry | High | https://getbrandgeo.com/ai-visibility-for-saas.html | NOT CHECKED individually; INFERRED not on Google | Day 4 |
| 22 | New batch, 3-way vendor comparison | High, functions as a comparison page in research framing | https://getbrandgeo.com/bg-088.html: "Profound vs Peec vs Otterly: Which AI Visibility Tool Fits Your Budget" | NOT ON GOOGLE (weak signal, sampled directly) | Day 4 |
| 23 | New batch, buyer's guide | High | https://getbrandgeo.com/bg-036.html: "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing" | NOT ON GOOGLE (weak signal, sampled directly) | Day 4 |
| 24 | New batch, funnel-decision article | High, maps directly onto BrandGEO's own free-to-paid decision | https://getbrandgeo.com/bg-094.html: "Free AI Visibility Audit vs Paid Monitoring: When You Actually Need to Upgrade" | NOT CHECKED individually; INFERRED not on Google | Day 4 |
| 25 | New batch, buyer's guide, SMB ICP | High | https://getbrandgeo.com/bg-093.html: "How to Choose an AI Brand Monitoring Tool on a Small Business Budget" | NOT CHECKED individually; INFERRED not on Google | Day 4 |
| 26 | New batch, pricing research | Medium-high, price-evaluation stage | https://getbrandgeo.com/bg-089.html: "The Real Cost of Starting at Dollar X" | NOT CHECKED individually; INFERRED not on Google | Day 4 |
| 27 | New batch, actionable/product-adjacent | Medium-high, mirrors the product's own competitor-tracking feature | https://getbrandgeo.com/bg-081.html: "A 10-Minute Way to Check If Your Competitors Outrank You in AI Answers" | NOT CHECKED individually; INFERRED not on Google | Day 4 |
| 28 | New batch, actionable/product-adjacent | Medium-high, mirrors the free audit's own function | https://getbrandgeo.com/bg-103.html: "How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately" | NOT CHECKED individually; INFERRED not on Google | Day 4 |
| 29 | Original batch, actionable/DIY audit | Medium-high | https://getbrandgeo.com/bg-053.html: "How to Read Your Own Brand's AI Answers Like an Auditor" | NOT CHECKED individually; INFERRED not on Google | Day 4 |
| 30 | New batch, enterprise tier intent | Medium, Managed/Enterprise-tier buyer | https://getbrandgeo.com/bg-092.html: "What a Six-Figure Enterprise GEO Contract Actually Includes" | NOT CHECKED individually; INFERRED not on Google | Day 4 |

### Batch 4: Day 5, 2026-08-17

| # | Page type | Buyer intent | URL | Indexed? | Batch |
|---|---|---|---|---|---|
| 31 | New batch, agency/partner channel | Medium, channel-partner intent | https://getbrandgeo.com/bg-091.html: "How Agencies Are Reselling AI Visibility Monitoring to Their SEO Clients" | NOT CHECKED individually; INFERRED not on Google | Day 5 |
| 32 | New batch, vertical ICP (local/home services) | Medium | https://getbrandgeo.com/bg-097.html: "A Local Service Business Guide to Showing Up in AI Overviews, Not Just Maps" | NOT CHECKED individually; INFERRED not on Google | Day 5 |
| 33 | New batch, vertical ICP (SaaS) | Medium | https://getbrandgeo.com/bg-098.html: "How SaaS Companies Should Track Competitor Mentions Across AI Engines" | NOT CHECKED individually; INFERRED not on Google | Day 5 |
| 34 | New batch, ICP framing | Medium | https://getbrandgeo.com/bg-095.html: "Why B2B Software Buyers Now Start Vendor Research in an AI Chat, Not a Search Bar" | NOT CHECKED individually; INFERRED not on Google | Day 5 |
| 35 | City | Medium-high, major metro | https://getbrandgeo.com/ai-visibility-for-newyork.html | NOT ON GOOGLE (weak signal, sampled directly) | Day 5 |
| 36 | City | Medium-high | https://getbrandgeo.com/ai-visibility-for-london.html | NOT CHECKED individually; INFERRED not on Google | Day 5 |
| 37 | City | Medium-high | https://getbrandgeo.com/ai-visibility-for-losangeles.html | NOT CHECKED individually; INFERRED not on Google | Day 5 |
| 38 | City | Medium-high | https://getbrandgeo.com/ai-visibility-for-chicago.html | NOT CHECKED individually; INFERRED not on Google | Day 5 |
| 39 | City | Medium-high | https://getbrandgeo.com/ai-visibility-for-paris.html | NOT CHECKED individually; INFERRED not on Google | Day 5 |
| 40 | City | Medium-high | https://getbrandgeo.com/ai-visibility-for-sanfrancisco.html | NOT CHECKED individually; INFERRED not on Google | Day 5 |

### Batch 5: Day 6, 2026-08-18

| # | Page type | Buyer intent | URL | Indexed? | Batch |
|---|---|---|---|---|---|
| 41 | City | Medium | https://getbrandgeo.com/ai-visibility-for-houston.html | NOT CHECKED individually; INFERRED not on Google | Day 6 |
| 42 | City | Medium | https://getbrandgeo.com/ai-visibility-for-boston.html | NOT CHECKED individually; INFERRED not on Google | Day 6 |
| 43 | City | Medium | https://getbrandgeo.com/ai-visibility-for-washingtondc.html | NOT CHECKED individually; INFERRED not on Google | Day 6 |
| 44 | City | Medium | https://getbrandgeo.com/ai-visibility-for-miami.html | NOT CHECKED individually; INFERRED not on Google | Day 6 |
| 45 | City | Medium | https://getbrandgeo.com/ai-visibility-for-dallas.html | NOT CHECKED individually; INFERRED not on Google | Day 6 |
| 46 | City | Medium | https://getbrandgeo.com/ai-visibility-for-berlin.html | NOT CHECKED individually; INFERRED not on Google | Day 6 |
| 47 | Press release | Medium, product-announcement, names the Radar EUR 29 tier | https://getbrandgeo.com/news/radar-plan-launch/ | NOT CHECKED individually; INFERRED not on Google | Day 6 |
| 48 | Thought-leadership methodology | Medium, citable DOI-style paper | https://getbrandgeo.com/ai-visibility-index-2026-07.html | NOT CHECKED individually; INFERRED not on Google | Day 6 |
| 49 | Press release | Low-medium | https://getbrandgeo.com/news/real-time-ai-visibility-engine-launch/ | NOT CHECKED individually; INFERRED not on Google | Day 6 |
| 50 | Press release | Low-medium | https://getbrandgeo.com/news/grok-google-ai-overviews-launch/ | NOT CHECKED individually; INFERRED not on Google | Day 6 |

### Batch 6: Day 7, 2026-08-19 (short batch, 2 URLs)

| # | Page type | Buyer intent | URL | Indexed? | Batch |
|---|---|---|---|---|---|
| 51 | Press release | Low-medium | https://getbrandgeo.com/news/ai-visibility-index-launch/ | NOT CHECKED individually; INFERRED not on Google | Day 7 |
| 52 | News index | Low | https://getbrandgeo.com/news/ | NOT CHECKED individually; INFERRED not on Google | Day 7 |

**"Date submitted" column.** Not included above because no submission has
happened yet; add a `Submitted` column with the actual date once Constantin
runs a batch and reports back, per this file's role as a living queue.

### Tier Z: deferred past Day 7, not abandoned

Everything not listed above: the bulk of BG-035 to BG-104 (the roughly 60
pieces not named as high-intent in Batches 3-4), the remaining 15 city pages,
and the original BG-005 to BG-034 articles (BG-001 to BG-004 already show
weak presence in the sample check above, so they are lowest priority of all:
something already reaching a search index needs the submission budget
less than something that has never been checked). Do not submit any of Tier
Z before Batches 1-6 land and Search Console's own Performance report has
had a few days to show whether the 52 above actually got crawled. Submitting
Tier Z early is exactly the "informational research eats the BOFU budget"
failure this cut exists to prevent.

---

## 2. Fire the staged backlog: re-dating map

### Inventory, verified on disk today (not carried from the audit)

`docs/growth/social/1-Pending/` contains **14 day-folders plus a `pulse/`
subfolder** (verified via directory listing, 2026-08-14). `2-Posted/`
contains **exactly one**, `2026-08-03 August 3 - Berlin language gap`. This
matches `GTM-TEAM.md`'s "13 staged social day-folders" claim as a floor, not
an exact count; the real number today is 14, one more folder (08-14) than
was staged when that constitution was written.

**Reconciling the "9 expired" figure.** The 2026-08-13 audit and the PLAN
both say 9 folders expired unposted, dated 08-04 through 08-12. Recounting
against today's actual folder list: dates 08-04, 08-05, 08-06, 08-07, 08-10,
08-11, 08-12 in that range is **7** folders on disk, not 9 (weekends 08-08
and 08-09 have no folders, consistent with the weekday-only original
runway). Adding 08-13 (Day 1, built and due yesterday, still unposted today)
makes **8** folders currently overdue as of today, 2026-08-14. This document
uses 8, the number actually on disk, rather than repeating the prior
figure. If the prior "9" referred to something no longer on disk, that is
unrecoverable and does not change what needs firing today.

**The 8 overdue folders**, oldest first:

| Original date | Folder | Platforms built |
|---|---|---|
| 2026-08-04 | Madrid smallest gap | facebook, instagram, tiktok, youtube |
| 2026-08-05 | No analytics event | facebook, instagram, linkedin, tiktok, youtube |
| 2026-08-06 | Two results one answer | facebook, instagram, linkedin, tiktok, youtube |
| 2026-08-07 | Free audit and the ladder | facebook, gbp, instagram, linkedin, tiktok, youtube |
| 2026-08-10 | Paris independents vs banks | campaign.md, facebook, gbp, instagram, linkedin, threads, tiktok, x, youtube |
| 2026-08-11 | Rome trattoria vs three-star | campaign.md, facebook, gbp, instagram, linkedin, threads, tiktok, x, youtube |
| 2026-08-12 | A firm that does not exist | campaign.md, facebook, gbp, instagram, linkedin, threads, tiktok, x, youtube |
| 2026-08-13 | The near miss | campaign.md, facebook, gbp, instagram, linkedin, threads, tiktok, x, youtube |

**Matching `pulse/` supplements exist for the first four of these**, dated
identically: `pulse/2026-08-04/`, `pulse/2026-08-05/`, `pulse/2026-08-06/`
(each gbp, threads, x) and `pulse/2026-08-07/` (threads, x only, no gbp file
present, verified by directory listing). When a day-folder moves, its
matching `pulse/YYYY-MM-DD/` folder moves with it to the same new date; they
are the same day's content split across two directories by convention, not
two separate decisions.

**Already-built future folders, left untouched by this map**: 08-14 (today,
"Companies converge"), 08-17 ("Which engine changes most"), 08-18 ("Test
your own brand"), 08-19 ("The nine item checklist"), 08-20 ("Retrieval not
engine count"), 08-21 ("An empty field"). These fire on their own existing
dates; nothing below reassigns them. Note each of these currently holds only
3 to 5 platforms plus a `bilingual/` folder, thinner than the 8-9 platform
coverage of 08-10 through 08-13. That is an existing gap in what was
pre-built for those dates, not something this map fixes, since fixing it
would mean producing new content, which is out of scope here.

**Content check before re-dating.** Grepped every file under
`docs/growth/social/1-Pending/` for `Meta AI`, `five engines`, `five AI
engines`, and `#contact` (the three known stale-content patterns:
retired-engine references, the five-vs-seven engine contradiction, and the
old 48-hour-form CTA). **Zero hits.** The backlog is clean; nothing needs to
be pulled per the "dead link or retired engine" edge case. Two of the
sampled bilingual LinkedIn posts (08-05 "No analytics event" and 08-12 "A
firm that does not exist") explicitly and correctly flag Meta AI's
retirement and ChatGPT's exclusion from their specific dataset in their own
verification notes, which is a historical-measurement fact about that
collection run, not a live-claim error.

**Finding: internal `When:` and `scheduled:` metadata is already stale and
will drift further.** Spot-checked `linkedin/feed/source-01-post.md` in two
folders: the 08-05 folder's post header reads `**When:** Monday 2026-08-24,
morning slot`, and the 08-12 folder's reads `**When:** Monday 2026-09-14,
morning slot`, both already wrong relative to their own folder's current
date, let alone the re-dated one below. Similarly, `pulse/2026-08-04/x/feed/
post.md` carries `scheduled: 2026-08-04T16:00:00Z` in its frontmatter. These
lines are leftover authoring metadata, not something the current manual
posting process reads (`PUBLISHING-PLAN.md`'s own Day-1 instructions are
"post... move to 2-Posted/ after," no automated read of `When:` implied).
**Whoever fires a re-dated post should treat the folder's assigned fire-date
below as authoritative and ignore the internal `When:`/`scheduled:` line**,
which will read wrong regardless of which empty date a given folder lands
on. This is worth fixing once the auto-poster's real item shape is decided
(see the schema note below), not worth hand-editing 8 files today for a
line nothing currently reads.

### Empty dates through Day 17

Day 1 = 2026-08-13 (Thu), Day 17 = 2026-08-29 (Sat), confirmed by direct date
calculation. Dates with no built folder today, excluding 2026-08-24 (ruled
"no posting, measurement day" in `PUBLISHING-PLAN.md`, kept clear on
purpose): **2026-08-15, 08-16, 08-22, 08-23, 08-25, 08-26, 08-27, 08-28,
08-29**: 9 open dates against 8 overdue folders, one spare.

`G3` ("3 or more channels firing daily by day 7 and still firing on day 17")
reads as continuity including weekends, so weekend dates (08-15, 08-16,
08-22, 08-23) are used below rather than left empty; nothing in
`GTM-TEAM.md` or the PLAN restricts firing to weekdays only, that convention
came from the original fixed four-week runway design, not from a rule.

### The re-dating map

FIFO by original date: oldest-overdue folder gets the earliest open slot.
The content is evergreen by the task's own framing and by the "no stale
claim" check above, so this order is a default, not a dependency: any 1:1
swap among these 8 rows is equally valid if Constantin prefers a different
sequence (for example, firing "The near miss," only one day overdue, sooner
rather than last).

| New fire date | Day of week | Source folder (move + rename date prefix) | Move matching pulse folder too? |
|---|---|---|---|
| 2026-08-15 | Sat | `1-Pending/2026-08-04 August 4 - Madrid smallest gap/` | Yes, `pulse/2026-08-04/` |
| 2026-08-16 | Sun | `1-Pending/2026-08-05 August 5 - No analytics event/` | Yes, `pulse/2026-08-05/` |
| 2026-08-22 | Sat | `1-Pending/2026-08-06 August 6 - Two results one answer/` | Yes, `pulse/2026-08-06/` |
| 2026-08-23 | Sun | `1-Pending/2026-08-07 August 7 - Free audit and the ladder/` | Yes, `pulse/2026-08-07/` (threads, x only, no gbp file) |
| 2026-08-25 | Tue | `1-Pending/2026-08-10 August 10 - Paris independents vs banks/` | No pulse folder for this date |
| 2026-08-26 | Wed | `1-Pending/2026-08-11 August 11 - Rome trattoria vs three-star/` | No pulse folder for this date |
| 2026-08-27 | Thu | `1-Pending/2026-08-12 August 12 - A firm that does not exist/` | No pulse folder for this date |
| 2026-08-28 | Fri | `1-Pending/2026-08-13 August 13 - The near miss/` | No pulse folder for this date |
| 2026-08-29 (spare) | Sat | none assigned | n/a |

08-29 (Day 17 itself) is left open on purpose. The PLAN's own Day 17
instruction is "honest retro. Which channel produced anything... and what
continues into the next sprint": a wrap post drawing on the sprint's actual
measured numbers fits that slot better than a pre-written evergreen piece,
and writing that post now would mean inventing numbers that do not exist
yet, which this role does not do.

**Mechanics, since the auto-posting engine's item shape is not yet defined.**
Until it is, treat this as a manual instruction, matching current practice
(`PUBLISHING-PLAN.md` Day 1: "Post today's staged folder... Move to
2-Posted/ after"): rename the folder's date prefix to the new fire date,
post the content inside on that date, then move the folder to `2-Posted/`.
If the auto-poster is ready before some of these fire, hand it this table
as (source folder path → fire date → platforms already built inside that
folder) triples, which is the shape above, already. **Flagging, not
inventing:** whether the auto-poster wants folders physically renamed ahead
of time or reads a separate schedule file mapping old-path to new-date is
an open schema question for whoever finishes building it; this document
does not assume either.

---

## 3. Repurposing candidates: named source, finding, and angle only

Per scope, these are names and angles for a `pulse` session to draft, not
finished posts. Every figure below is quoted from the live page's own `<meta
name="description">` or verified body copy, not recomputed. These are
candidates for extending the runway past Day 17 or filling the spare 08-29
slot if the retro angle is not used there; none of them are assigned a date
by this document.

| Source | Exact figure, as published | Where it appears | Angle |
|---|---|---|---|
| `bg-055.html` | "ChatGPT citations fell 86-94% across five markets between February and April 2026, then rebounded in May." | `<meta name="description">` | A sharp before/after stat with a recovery arc, good for a single-card static post, not a thread |
| `bg-073.html` | "Ahrefs found its own AI-referred traffic converting 23x higher than organic; Semrush found 4.4x; Adobe found 54% better." | `<meta name="description">` | Three independently sourced numbers on the same claim, framed honestly as a range rather than picking the biggest one, matches the site's own no-superlative discipline |
| `bg-079.html` | "Yext's 6.8-million-citation study found 86% of AI citations come from brand-owned sources, apparently contradicting Muck Rack's 84%-earned-media finding." | `<meta name="description">` | A genuine tension between two named studies, good for a "here is the actual disagreement" post rather than a flattened takeaway |
| `bg-076.html` | "an honest look at a widely repeated 28% figure this research could not verify" | `<meta name="description">` | A rare "we checked and could not confirm this" piece, strong credibility angle, distinct in tone from the rest of the queue |
| `bg-102.html` | "94% of CMOs plan to increase AEO spend in 2026, per Conductor's own vendor-sponsored survey. What that spend actually buys is still genuinely unsettled." | `<meta name="description">` | Big number plus the caveat that it is vendor-sponsored, same honest-tension pattern as bg-079 |
| `bg-061.html` / `bg-062.html` | Claude AI-referral traffic "reportedly grew about 320% year over year, with a single-month spike near 159% in March 2026"; Gemini "reportedly grew about 231% year over year" | `<meta name="description">`, both pages | Paired post: the two least-discussed engines both grew fastest, a natural two-panel comparison |
| `bg-095.html` | "51% of B2B software buyers now start vendor research in a chatbot, up from 29%." | `<meta name="description">` | Direct ICP-naming stat for the SaaS/B2B software vertical, ties into the sprint's ICP-on-the-front-door work |
| `ai-visibility-for-newyork.html` | "8 New York categories, 4 AI engines. StreetEasy swept every engine. Legacy brokerages beat star agents. National law firms beat NYC boutiques." | `<meta name="description">` | Major-metro city study, never had its own social treatment (unlike the bilingual Berlin/Madrid/Paris/Rome series); one clean single-engine-sweep finding (StreetEasy) is postable on its own |
| `ai-visibility-for-losangeles.html` | "6 Los Angeles categories, 5 AI engines. Loeb & Loeb sweeps entertainment law. Personal injury and property management show the strongest cross-engine consensus." | `<meta name="description">` | Same pattern, different metro and vertical (entertainment law) |
| `ai-visibility-for-london.html` | "We ran 8 real London buyer prompts across 4 AI engines... Some categories are unanimous. Others are wide open." | `<meta name="description">` | International-market angle, useful for the EU/UK audience the bilingual series already targets |
| `bg-088.html` | "Profound vs Peec vs Otterly compared side by side: pricing, engine coverage, funding, and which buyer each one actually fits." | `<meta name="description">` | Competitor-comparison content that is not about BrandGEO at all, useful as a neutral-authority post that still lives on getbrandgeo.com |
| `bg-036.html` | "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline" | `<title>` | Long-form buyer's guide, good source for a LinkedIn Article repurpose in the same shape as the existing BG-028 to BG-034 Article pattern |

None of these are dated in the calendar below; they are the bench for
whoever runs the next `pulse` or repurpose session once the backlog above is
actually firing, so the channel does not go quiet again after Day 17 the way
it did after 08-03.

---

## Calendar, one line per day, Day 1 to Day 17

| Day | Date | Indexation | Social |
|---|---|---|---|
| 1 | 2026-08-13 (Thu) | none (already past) | "The near miss" built but unfired; now overdue, re-dated below to 08-28 |
| 2 | 2026-08-14 (Fri) | Sitemap fix (Finding 0) lands; submit Batch 1, 10 URLs (get-found-online + 9 comparison pages) | Fire today's built folder, "Companies converge" |
| 3 | 2026-08-15 (Sat) | Submit Batch 2, 10 URLs (last comparison page + 9 industry pages) | Fire re-dated "Madrid smallest gap" (was 08-04) + its pulse folder |
| 4 | 2026-08-16 (Sun) | Submit Batch 3, 10 URLs (last industry page + 9 new-batch high-intent articles) | Fire re-dated "No analytics event" (was 08-05) + its pulse folder |
| 5 | 2026-08-17 (Mon) | Submit Batch 4, 10 URLs (4 new-batch articles + 6 top cities) | Fire "Which engine changes most" (already built for this date) |
| 6 | 2026-08-18 (Tue) | Submit Batch 5, 10 URLs (6 cities + 4 announcements) | Fire "Test your own brand" (already built) |
| 7 | 2026-08-19 (Wed) | Submit Batch 6, final 2 URLs; queue of 52 exhausted | Fire "The nine item checklist" (already built) |
| 8 | 2026-08-20 (Thu) | None scheduled; optional early Search Console Performance check on Batch 1 | Fire "Retrieval not engine count" (already built) |
| 9 | 2026-08-21 (Fri) | None scheduled | Fire "An empty field" (already built) |
| 10 | 2026-08-22 (Sat) | None scheduled | Fire re-dated "Two results one answer" (was 08-06) + its pulse folder |
| 11 | 2026-08-23 (Sun) | None scheduled | Fire re-dated "Free audit and the ladder" (was 08-07) + its pulse folder |
| 12 | 2026-08-24 (Mon) | None; use the week's Performance data for the daily close | No posting, measurement day per `PUBLISHING-PLAN.md` |
| 13 | 2026-08-25 (Tue) | None scheduled | Fire re-dated "Paris independents vs banks" (was 08-10) |
| 14 | 2026-08-26 (Wed) | None scheduled | Fire re-dated "Rome trattoria vs three-star" (was 08-11) |
| 15 | 2026-08-27 (Thu) | None scheduled | Fire re-dated "A firm that does not exist" (was 08-12) |
| 16 | 2026-08-28 (Fri) | None scheduled | Fire re-dated "The near miss" (was 08-13) |
| 17 | 2026-08-29 (Sat) | Optional: begin Tier Z if Batches 1-6 show real Google pickup | Spare slot open; retro post or draw from Section 3's bench |

---

## Verification log

Every URL and file path in this document was checked one of these ways,
2026-08-14:

- **File existence on disk:** `ls brandgeo/web/bg-*.html | wc -l` (104),
  `ls brandgeo/web/brandgeo-vs-*.html` (10, named), directory listings of
  `docs/growth/social/1-Pending/` and `2-Posted/`, and `find` over the
  `pulse/` subfolder and two sampled day-folders' full file trees.
- **Live HTTP 200, via direct `curl` against `getbrandgeo.com`:** all 10
  comparison pages, all 10 industry pages, all 12 cities named in Batches
  4-5 plus `newyork`, `london`, `losangeles` sampled again individually,
  `get-found-online.html`, all 4 press releases plus the `/news/` index,
  `bg-035`, `bg-055`, `bg-080`, `bg-104`, and all 13 named high-intent
  BG-035-104 pieces (bg-036, 053, 081, 088, 089, 091, 092, 093, 094, 095,
  097, 098, 103). `bg-021.html` returns 404; the real file
  `bg-021-retrieval-not-engine-count.html` returns 200.
- **Sitemap gap:** `brandgeo/web/sitemap.xml` (disk) diffed byte-identical
  against a fresh `curl` of `https://getbrandgeo.com/sitemap.xml`; both
  parsed with a small Python script for `<loc>`/`<priority>` pairs; bg-range
  compared against the disk file list via `comm`.
- **Weak indexation sample:** `WebSearch` tool, `site:getbrandgeo.com
  <slug>` for `brandgeo-vs-peec`, `ai-visibility-for-newyork`, and `bg-055 OR
  bg-088 OR bg-036`, three separate queries, results recorded verbatim above.
- **Meta descriptions and titles** for every repurposing candidate and every
  named high-intent article: `grep -oE` against the live HTML source on disk
  for `<title>` and `<meta name="description">`, quoted exactly, not
  paraphrased.
- **Commit dates:** `git show -s --format="%h %ci %s"` for `76cfe75`,
  `3043ed3`, `44ca26b`.
- **Stale-content sweep:** `grep -rli` across all of
  `docs/growth/social/1-Pending/` for "meta ai", "five engines", "five ai
  engines", "#contact": zero matches.
- **Day-of-week and Day-1/Day-17 arithmetic:** `date -d` for every date
  2026-08-13 through 2026-08-29.
- **Superlative guardrail:** checked against the
  `cross-program-superlative-ledger` memory before writing any city-ranking
  language; no ordinal or "strongest/first" claim about the city research
  itself appears in this document, only an explicitly-labelled operational
  triage ranking by general market size.
