# Handoff, 2026-08-02

Written at the end of the content and acquisition session. Everything below was
verified against the repo, the live site or Supabase at the time of writing, not
recalled. Where a claim could not be checked, it says so.

**This supersedes the 2026-08-01 handoff.** That document described three
parallel tracks (articles, the Ai Fy email, the Drive migration) plus a Track B
(dashboard audit, campaign rebuild, video pipeline). Everything from it that is
still open has been carried forward into section 6 and re-checked. Everything
that closed is recorded in section 4. The old file is in git history at
`388f42d` if the detail is needed.

---

## 1) Goal

One thread this session, arrived at in three steps:

1. Answer whether anything built was sitting unpublished. It was not, but the
   **newsroom had stopped**: Radar shipped in code on 2026-07-31, reached the
   pricing table, and no announcement was ever written.
2. Publish the Radar launch, and explain the free tier moving off ChatGPT in the
   same piece, because a price change with no stated reason reads as a downgrade.
3. **Restart the content engine on a traffic and conversion footing.** Eight
   articles off the unpublished bilingual dataset, keyword-targeted, plus one
   call to action pointing at the free audit on every page of the site.

---

## 2) Current state

- `origin/main` and local `main` are identical, **0 ahead, 0 behind**, working
  tree clean. Checked after `git fetch`.
- HEAD is not one of my commits. Two other sessions committed on top
  (`12cfb5f` sprint council, `13bb92d` billing package naming). My two commits
  are ancestors of `origin/main`, confirmed with `git merge-base --is-ancestor`.
- **Netlify builds: one spent 2026-08-01**, carrying the other session's
  `_email.js` change that sat between my commits. Constantin approved it
  ("for this push we have credits").

**Content: LIVE and verified by content, not status codes.** All 94 HTML pages
the series commit touched were fetched and compared against disk with line
endings normalised: **94 of 94 match**. 34 articles now exist, all 200. The
Radar press release, the 8 OG cards and the live sitemap (96 URLs, parses) all
confirmed.

**Call to action: LIVE on 92 of 98 pages.** Zero pages still point their primary
CTA at `/#contact`. The six without one are legal and terminal pages, by
decision.

**Indexing: submitted everywhere it can be automatically.** The 05:10 UTC run on
2026-08-02 pinged 11 URLs with `indexnowOk: 11`, covering all 8 articles and the
Radar release. **Google receives nothing automatically and this is by design**
(`google_skipped: "NO_CREDENTIALS"`, the 2026-07-28 ruling). Constantin
submitted the 9 URLs by hand in Search Console and Google crawled and re-read
the sitemap in response.

**What that crawl does and does not mean.** It proves the sitemap is valid and
fetchable, the pages return 200 to Googlebot and nothing in `robots.txt`, the
CSP headers or cPanel is blocking a crawler. It is **not** evidence of authority:
re-reading the sitemap is what URL Inspection causes. See section 6 item 1 for
the test that would be.

---

## 3) Active files

| File | Why it matters |
|---|---|
| `scripts/build_articles.py` | Renders every article from ONE template. Never hand-copy a `bg-*.html` again: six pages got a pre-consent GA tag that way. |
| `scripts/articles_content.py` | The 8 articles' content, plus a header documenting every SQL figure and where it came from. |
| `scripts/cta_sweep.py` | Site-wide CTA repoint, gtag strip, CTA injection. Idempotent, safe to re-run. |
| `scripts/wire_series.py` | Inserts blog cards and sitemap entries at a known anchor rather than hand-editing an interleaved list. |
| `docs/growth/og-cards/build_og_cards.py` | Patched: a `BG-0NN:` title now yields the headline as the card hero, not the id. |
| `brandgeo/web/index.html` | Carries `id="free-audit"` on the hero. **Load bearing: 90+ pages link to it.** |
| `brandgeo/web/site.js` | Focuses `#brandInput` on arrival at `#free-audit`. |
| `brandgeo-dashboard/src/lib/planConfig.ts` | Still the only source for plans, prices and engines. |

**Do not touch**

- `brandgeo/web/article-builder.html`, the one JSON-LD failure site-wide, known,
  and excluded from the cPanel upload. Not a defect to fix.
- The 34 city and industry research pages' engine lists. They are dated
  measurements. Rewriting them to today's lineup falsifies the record.

---

## 4) Changes made

**Radar press release (`f899804`, live).** `news/radar-plan-launch/`. States the
EUR 29 launch price and the free tier moving to Gemini as one decision, with the
production figures: 152 ChatGPT rows averaging EUR 0.0615, five of them EUR
0.307 against a EUR 0.30 budget, so a free signup was stopped on its last prompt.
Linked from the news hub, sitemap, homepage Radar card, and bg-021/023/025.
Deliberately does **not** quote the modelled EUR 0.108 per check: `_cost.js:384`
records that it is not what this account bills.

**The bilingual series, BG-027 to BG-034 (`8bccdb3`, live).** Eight articles off
`ai_results` data collected 2026-07-10 that had never been published. 486
companies named across Berlin, Madrid, Paris and Rome, **82.1% appearing in only
one of the two languages**, per-pair overlap 15.9%, 13 of 46 pairs sharing
nothing. Full method and every figure's provenance is in the header of
`scripts/articles_content.py`. The reusable finding is in memory as
`bilingual-research-dataset`.

**The call to action, which was the larger defect.** 77 pages ended with a button
pointing at `/#contact`, the 48-hour manual form, while the instant audit sat in
the hero with nothing linking to it. All repointed. 14 pages had no CTA at all,
including all five newsroom pages.

**Six pages were loading Google Analytics before consent** (`bg-020`, `bg-022`
to `bg-026`). `399723c` removed exactly that from the other 79 pages on
2026-07-29; these were written afterwards from a pre-sweep copy. Removed.

**One stale schema claim corrected:** `bg-021`'s FAQPage still told Google the
free plan includes ChatGPT.

**Closed from the previous handoff:** the Ai Fy email is done. `686ace9` landed
and Constantin confirmed the send worked; the free account was informed of the
Gemini switch and offered Radar at the promotional price. `scripts/migrate_social_to_drive.py`
was committed in `388f42d`.

---

## 5) Failed attempts

**I could not measure layout in the Browser pane, and nearly reported an
unverified claim as verified.** The pane does not composite when it is not
displayed, so `document.documentElement.clientWidth` reads **0** and every
geometry number from it is meaningless. `resize_window` does not fix it and
screenshots fail outright. Recorded in memory as
`preview-pane-cannot-measure-layout`, with the working alternative: headless
Chrome over CDP, which Node 24 can drive with its global `WebSocket` and no
dependency.

**That harness immediately caught a regression I had introduced.** Putting "Test
my website free" in the nav overflowed 375px by 46px, because below 640px the
text links hide but the lockup, the CTA and the theme toggle still have to fit.
Fixed by shortening the nav label to "Free test" and shrinking all three.

**`scrollWidth` is not evidence of a horizontal scroll.** Always attempt a real
`window.scrollTo(600, 0)` and read `scrollX` back. To prove a change is not the
cause, remove that element in the live page and re-measure rather than reasoning
about it. Both of those turned an assumption into a fact this session.

**A basename keyed exemption list silently skipped five pages.** `NO_CTA`
matched on `os.path.basename`, and every newsroom page is called `index.html`, so
all five were exempted from the CTA injection without a word. Keyed on the
relative path now.

**The push carried another session's commit and I did not try to avoid it.**
`686ace9` touched `brandgeo-dashboard/` and sat between my two commits.
Reordering to dodge one Netlify build is exactly what destroyed 615 files on
2026-08-01, so I used `BATCH_PUSH=1`, spent the build, and said so. The safe
push sequence is now written into the `never-reset-hard-parallel-sessions`
memory.

---

## 6) Next steps

**Verification owed, and it is cheap.**

1. **Test whether the crawl was authority or just obedience.** Publish the next
   article and **do not submit it**. If Google crawls it within a couple of days
   unprompted, that is crawl demand and the real signal. Then check Search
   Console → Crawl stats for a rising trend, and the Pages report for the ratio
   of Indexed to `Discovered - currently not indexed`. About seven days from
   2026-08-02.
2. **Check the 2026-08-03 05:10 UTC `ping-sitemap` run.** `job_runs.ok` is
   `true` whenever a submitter was merely configured, even if every submission
   failed, so read `pinged` against `indexnowOk` in `detail`, not `ok`.

**Live defect, measured, not mine, not fixed.**

3. **The site scrolls sideways on a phone.** Measured over CDP at 375 CSS px with
   a real scroll attempt: **`bg-026` 146px, `bg-019` 428px, the homepage 123px**
   from `.mode-switch` (two buttons of 221px and 233px in a 320px wrapper, with
   `flex-wrap: nowrap`), and 53px at 768px from `.footer-grid` never collapsing.
   BG-027 to BG-034 are the only articles on the site that measure **zero**; the
   fix that got them there is in `build_articles.py`'s media query and is four
   lines. The mode-switch fix carries a design choice (stack, shrink, or wrap),
   which is why I did not make it.

**Carried forward from 2026-08-01, re-checked and still open.**

4. **Deactivate the six old Stripe payment links** (those without
   `metadata.rotation = 2026-07-31`). Stripe UI, no deploy. Until then the
   exposure the rotation was meant to close stays open.
5. **Fix the DMARC `rua`.** `_dmarc.getbrandgeo.com` points at
   `constantin@talentwelove.com` with no cross-domain authorization record, so
   BrandGEO has never received a single aggregate report. Change to
   `constantin@getbrandgeo.com`. One DNS record at CyberFolks.
6. **The 486 MB of mp4 renders are still only on this machine.** The finished
   posts (146 MB) are on Drive; the raw renders are not backed up anywhere.
7. **Where `product/` lives on the Drive.** 21 listings, a reusable asset library
   rather than campaign content, deliberately not migrated. Suggested a sibling
   top-level `Product Assets\` folder.
8. **Council item D-6**, scheduled collection destroys history.
   `_enqueue.js:144-150` deletes prior `ai_results` with no date filter, so
   weekly automatic collection erases last week. This is the Radar business case.

**Blocked on Constantin, unchanged.**

9. The voice take (about 3 minutes of reading, sections A to E of
   `docs/growth/voice/RECORDING-KIT.md`), and saying "GEO" and "BrandGEO" aloud
   on it. Open since 2026-07-29.
10. The 8 screen recordings
    (`docs/growth/CAMPAIGN-2026-07-30/youtube/longform/CONSTANTIN-CAPTURE-AND-VOICE.md`),
    Threads setup, and the 18 profile and banner uploads. **The avatars are still
    the retired mark on every account.**
11. Decisions owed: **D6** the time filter, **D8** the muted-text ladder, the
    **Remotion licence** (free to 3 employees, paid above), and whether the
    long-form video specs should be force-added to git. They are on disk only and
    in no backup.

**Social posting is still manual and still deferred.** The 226-asset package is
postable. Auto-posting needs OAuth apps for Meta, LinkedIn, TikTok, YouTube and
X, none of which an agent can create; Meta's review takes longest.

---

## Rules in force, do not relearn them

- **Commit per task. Do not push anything touching `brandgeo-dashboard/`** unless
  it is the block's batch push; target 2 Netlify builds/day across all sessions.
  A pre-push hook enforces it and needs `BATCH_PUSH=1` to override.
- **Never `git reset --hard` and never reorder commits.** Another session commits
  concurrently. The safe push sequence, including verifying the deploy by
  content rather than status code, is in the
  `never-reset-hard-parallel-sessions` memory.
- **Social and campaign media never enters git or Netlify.** Articles under
  `brandgeo/web/` MUST be committed: git IS the cPanel deploy mechanism.
- `planConfig.ts` is the only source for plans, prices and engine lineups.
  CLAUDE.md and the growth skill are stale on both.
- No em dashes, no en dashes, no AI-tell vocabulary in anything a user reads.
- **Do not measure layout in the Browser pane.** It reports `clientWidth` 0.
- No agent-created admin. Admin surfaces are source-verified only.
