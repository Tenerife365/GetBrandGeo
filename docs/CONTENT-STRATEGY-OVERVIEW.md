# BrandGEO Content Strategy — Overview (as of 2026-07-15)

A snapshot across every content channel: what's automated, what's live, and what's still backlog. Sourced from `CLAUDE.md` §9 (Content, SEO & Own-GEO Initiative) and `marketing/offsite-2026-07/OFFSITE-GROWTH-KIT.md`.

---

## 1. Automation currently in place

Three scheduled tasks now work together as a weekly pipeline (built 2026-07-15):

| Task | Schedule | What it does |
|---|---|---|
| `brandgeo-monday-roadmap` | Every Monday, 8:03 AM local | Takes stock of real backlog across every initiative, checks Supabase for real data freshness, picks one clear focus for the week, seeds any new client/prompt rows needed (free), and writes `ROADMAP-YYYY-MM-DD.md` naming exactly what needs to be manually collected before Wednesday, if anything. Never triggers paid collection itself. |
| `brandgeo-wednesday-content` | Every Wednesday, 9:04 AM local | Reads that week's roadmap, verifies any planned new data actually landed, writes whatever's genuinely ready (website + off-page content) following established templates, wires it into the site, and ends with an explicit upload checklist. Nothing auto-deploys. |
| `brandgeo-weekly-linkedin-content` | Every Friday, 9:05 AM local | Reads what Monday/Wednesday actually published this week and drafts LinkedIn content from it: Personal + Company posts always; a native LinkedIn Newsletter issue when a new Index report published; a native LinkedIn Article republish of a strong BG-article every 3-4 weeks. Saves as `linkedin-posts-YYYY-MM-DD.md`. Never auto-posts, no em dashes, every post cites its real source. |

**Real limits, worth knowing:** collection has no headless trigger (it runs through a logged-in dashboard tab and spends real API money per call), so the Monday task only ever prepares data and tells you what to click, never spends the money itself. The Index report only gets a new issue when one is genuinely due (~30 days + real new trend data), never on a fixed schedule regardless of substance. First full loop: Monday 2026-07-20 → Wednesday 2026-07-22 → Friday 2026-07-24 (the 2026-07-17 Friday run fires before any Monday/Wednesday run exists, so it falls back to reading CLAUDE.md directly for that one week only).

Off-site submissions remain one-off, not on this timer (see §7 below) — the Wednesday task will pick up the next pending off-site item if nothing else is due that week, but doesn't run a dedicated cadence for them.

---

## 2. Website content (getbrandgeo.com)

**Live and current:**
- 16 BG-0XX research articles (BG-001 through BG-016, the last shipped 2026-07-14)
- 7 city AI-visibility research pages (London, Berlin, Madrid, New York, Paris, Rome, Dublin)
- 10 industry landing pages, 10 competitor comparison pages
- The AI Visibility Index monthly report, Issue #1 (2026-07-14)
- A glossary page (22 terms) and FAQ (20 questions)
- `/news/` newsroom with 2 press releases so far

**Backlog, not yet started:**
- **AI Visibility Index, Issue #2** — gated on real paying-client trend data (only started accumulating daily as of 2026-07-13) and a second city-research collection pass. No date set.
- **BG-017 onward** — no topic queued yet; the weekly LinkedIn task will flag when one's due but won't invent a topic on its own without a clear angle.
- **Real testimonial cards** on the homepage motion pass — blocked on Constantin supplying actual customer quotes and logos, not something to fabricate.
- **A dedicated "Reports" landing page** — worth building once the Index passes ~4-6 issues; right now it's one card in a `.simple-grid` section on `blog.html`.
- **Top-level nav "Compare" / "Industries" link** — currently only reachable via footer/blog hub, not the main nav. Flagged, not prioritized.

---

## 3. LinkedIn, personal profile

No automation posts on your behalf; every batch is drafted by the weekly task (or an ad hoc session) and you post/schedule manually.

**Current state:** the 2026-07-14 batch (6 posts) had post 1 posted, the rest scheduled through Tuesday 2026-07-21.

**Next:** the 2026-07-17 weekly run drafts the following week's batch, picking up right after the 21st so there's no gap.

---

## 4. LinkedIn, BrandGEO company page

Same mechanism, deliberately distinct copy from the personal posts (not reshares) — brand voice, more official/product-and-data-forward. Now includes a matching branded stat-card image per post (1200x627, generated programmatically per the brand-kit rule, not AI image generation).

**Current state:** the 2026-07-15 catch-up batch (5 posts + 5 images) had post 1 posted, the rest scheduled through Monday.

**Next:** the weekly task now covers both lists going forward, so this shouldn't fall a week behind again without you knowing.

---

## 5. Newsletter

A signup form exists on `blog.html` ("Get new research first," posts to `formsubmit.co/contact@getbrandgeo.com`), but **there is no actual send pipeline** — no compiled newsletter has ever gone out, and nothing is scheduled to change that. The form only captures interest. If you want an actual newsletter cadence, that's a separate build (either a manual "compile what shipped this month and email the list" step, or a real ESP integration) and isn't in scope of anything currently running.

---

## 6. News / announcements

Two press releases live so far in `/news/`:
1. "BrandGEO Launches High-Frequency Real-Time AI Visibility Monitoring Engine" (2026-07-10)
2. "BrandGEO Publishes Its First AI Visibility Index Report" (2026-07-14)

No fixed cadence, these get written when there's a real announcement (a new product capability, or a new Index issue). The weekly LinkedIn task will flag if a news-worthy item is due but won't fabricate an announcement to fill a slot.

---

## 7. Off-site content

Tracked separately in `marketing/offsite-2026-07/OFFSITE-GROWTH-KIT.md` (from a legitimate off-site distribution push, distinct from an earlier link-injection scheme that was declined twice, see CLAUDE.md §9.15/§9.18/§9.19 for that history).

| # | Item | Status |
|---|---|---|
| 1 | Crunchbase organization profile | Live |
| 2 | HARO / Connectively source profile | Live, pitches submitted |
| 3 | GitHub glossary repository | Live |
| 4 | GitBook methodology guide | Live |
| 5 | Substack / Medium / LinkedIn Pulse article | Live on all three |
| 6 | Notion template + Gumroad + ProductHunt launch | **Pending, not started** |
| 7a | SourceForge listing | Live |
| 7b | Slashdot listing | **Pending** Slashdot's approval email |
| 7c | AlternativeTo listing | **Pending** platform reopening new listings |
| 8 | Resource-page outreach | **Pending, not started** |
| 9 | On-site glossary | Live, reference only |

Live URLs on file: GitHub `github.com/Tenerife365/generative-engine-optimization-framework`, GitBook `brandgeo.gitbook.io/brandgeo-docs`, Substack, Medium, and LinkedIn Pulse versions of the law-firms article, SourceForge `sourceforge.net/projects/getbrandgeo`, Crunchbase `crunchbase.com/organization/brandgeo`.

**5 items still open here**, all self-contained "pick up here" instructions already written in `OFFSITE-GROWTH-KIT.md` — nothing needs re-deriving, just execution whenever there's time. None of these are on the weekly automation, since they're one-time platform submissions, not recurring content.

---

## Quick summary

- **Automated:** LinkedIn content drafting only (personal + company), weekly.
- **Manual, no fixed schedule:** new BG-articles, news items, Index report issues, off-site submissions.
- **Not built at all:** an actual newsletter send.
- **Biggest open backlog items:** AI Visibility Index Issue #2 (data-gated), 5 remaining off-site submissions, real testimonials (content-gated on you).
