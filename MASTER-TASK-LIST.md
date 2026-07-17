# MASTER-TASK-LIST.md — Global Pending-Work Dashboard

> **Owner session: `Master-Task-List`.** Full rescan performed 2026-07-13/14.
> Unlike the first pass, this rescan didn't just trust doc text saying "done" —
> where possible, each critical claim was **independently verified**: live
> Supabase queries (Postgres data + RLS/function config on the real
> `duiyifepitvugyulobqm` project), `git log` on the dashboard repo, and live
> `getbrandgeo.com` fetches with cache-busting params. Every item below is
> tagged with **how** it was confirmed, not just which doc claims it.
>
> ⚠️ Still true: this can't see live conversations in other open chats — only
> what's been committed to git, applied to the live DB, deployed, or uploaded
> to cPanel. Ask me to rescan again after a batch of work lands.

---

## Top 3 pending per chat/owner — quick reference

Pulled straight from the tables below, re-prioritized by severity within each
owner (Critical → High → Medium → Low), not just table order. Where an owner
had fewer than 3 real items on record, the gap is filled with the next
logical step *(marked proposed)* rather than left short — full detail and
verification evidence for every line is in the tables further down.

**Constantin (direct actions)**
1. ✅ **DONE** — Stripe live secret key confirmed (was: verify not on the
   ~7-day expiry window). Constantin confirmed 2026-07-14.
2. ✅ **DONE** — `index.html` re-uploaded to cPanel, GDPR badge / "Registered
   in Spain" regression resolved. Constantin confirmed 2026-07-14.
3. 🟠 Review and either approve or kill the drafted LinkedIn push
   (`GTM-LINKEDIN-DRAFTS.md`) — six open flags, untouched since 07-12.
   **Constantin: doing this first thing tomorrow (2026-07-15).**

**Master-DashboardDesign**
1. ✅ **DONE — confirmed by Constantin 2026-07-15.** Rate-limit
   *enforcement* half (plan-derived hourly cap + monthly euro budget)
   shipped, committed, and published live. The Growth-tier 429 bug this
   was fixing is resolved.
2. 🟡 **IN PROGRESS as of 2026-07-15** — collection queue
   (`collection_jobs` table + scheduler + background worker), the real
   1,000-client scalability blocker. Constantin will confirm when done.
3. 🟡 *(Proposed)* Once ~2 weeks of real `cost_eur` history has
   accumulated (data collection only started 07-13), true up the quota
   ladder from measured numbers instead of the earlier estimate.

**Master-GTM**
1. 🟠 Decide the public cost/depth positioning — Master-SiteDesign's
   pricing copy is waiting on this.
2. 🟠 Reconcile the plan-to-engine mapping (Managed/Pro/Enterprise sharing
   5 engines) against Master-Reasoning's engine-value findings.
3. 🟡 *(Proposed)* Once Constantin rules on the LinkedIn push, fold the
   decision into the channel plan — and once the cost/depth call above
   lands, jointly settle the add-on "check pack" framing with
   Master-Billing rather than each deciding half of it independently.

**Master-Billing**
1. 🟠 Restate the Stripe add-on prices as "check packs" — current pricing
   breaks the cost-ratio rule.
2. 🟠 Configure VAT/Stripe Tax for the Canary Islands origin — needs a tax
   advisor's sign-off first.
3. 🟠 Archive the stray mislabeled Stripe price (not independently
   re-checked this pass, treat as still open).

**Master-Security**
1. 🟡 F5 — lock down `purge-old-results.js` (status unknown since the last
   check, treat as still open).
2. 🟡 F4 — consolidate the duplicate RLS policies / two parallel helper
   function families (explicitly low-priority, not a rush).
3. 🟢 F7 — enable Supabase's leaked-password protection (Constantin-side
   dashboard toggle; not re-checked, presumed still open).

**Master-SalesEngine (Prospect Radar)**
1. 🟡 Decide whether to formalize the weekly Radar run as a scheduled
   automation, or keep it manual.
2. 🟡 Reconcile the reported HubSpot write-path change against the
   original read-only design — no new evidence either way yet.
3. 🟡 *(Proposed)* Once the automation-vs-manual call is made, confirm
   cadence/cap before any `scheduled-tasks` call is resubmitted.

**Master-Writer**
1. 🔴 **NOW ACTIVE — publish a monthly proprietary-data report.**
   Constantin flagged this as next relevant 2026-07-14. Was blocked on
   confirming real aggregate data was actually queryable; `ai_results`/
   `cost_eur` has real data accumulating daily since 07-13, so the
   original blocker may now be partially lifted — the first step for
   whichever chat picks this up is confirming exactly what's queryable
   (volume, date range, which fields are safe to aggregate/publish) before
   drafting anything, not assuming the block is fully clear. **Note:**
   this recurring report is a separate thing from the AI Visibility Index
   the new weekly pipeline below already gates on a 30-day/real-trend
   rule — check whether they should be the same publication or two
   distinct ones before drafting either.
2. ✅ **New weekly content pipeline confirmed live and correctly scoped
   2026-07-15** (Mon roadmap → Wed onsite/offsite content → Fri LinkedIn
   personal+company drafts) — see the dedicated section above. No changes
   needed; first full cycle completes ~07-20 to ~07-24, worth a quality
   spot-check then, not urgent now.
3. 🟢 Run the §9.2 own-GEO dogfooding collection (still open, not
   re-checked).

**Compliance / passive watch (no single chat owner in the tracker)**
1. 🟡 M2 — `ai-visibility-for-hotels.html` schema-type consistency fix
   (not independently re-checked this pass).
2. 🟡 M3 — watch Search Console for scaled-content flags on the ~20
   templated pages (passive, no action unless something surfaces).
3. 🟢 Off-site distribution kit follow-ups (Crunchbase/HARO/GitHub
   glossary/GitBook/Substack/Notion/directory listings/resource-page
   outreach) — the Crunchbase "done" vs. "never signed up" conflict is
   still unresolved, worth a 30-second manual check.

---

## 🆕 Two new priorities from Constantin — 2026-07-15, updated same day after verification

Originally logged verbatim from a direct conversation. This update folds in
a second follow-up message the same day plus real tool-level verification
(HubSpot, Clay, GA4/GSC connector search, connected browsers) — not just
doc text anymore. Constantin is expecting a large wave of free-tier
signups and wants both pieces solid before that wave hits, not after, and
has separately stated a hard business constraint that should reprioritize
everything in section B: **he is a solo operator and needs a few paying
clients within 2 weeks** — fastest-to-revenue items should be sequenced
first, not built in doc order.

### A. Free-tier activation flow — signup → first value → upgrade nudge
The concern: when someone signs up for a Free account, is the flow (1)
smooth to fill in, (2) generating something genuinely useful even on Free's
1-engine (ChatGPT-only) allowance, and (3) compelling enough on its own to
push them toward a paid tier.

**Update 2026-07-15: Constantin is running his own live test first thing
tomorrow (07-15 morning)** — a real Free signup for an actual different
company that's genuinely enrolling, not a synthetic test account. This is
stronger ground truth than a code audit alone. **Sequencing for whichever
chat picks this up:** do the code-level audit of `Signup.tsx`/
`Onboard.tsx`/the Free-tier dashboard experience in parallel or right
after, then specifically ask Constantin for his own real first-hand
impressions from the live test before finalizing any recommendation — his
lived experience as the tester is a second, independent signal the code
read alone can't produce. **Owner: Master-DashboardDesign** (same chat
that owns `Signup.tsx`/`Onboard.tsx`).

### B. GTM data pipeline — visitor tracking, signup tracking, LinkedIn, HubSpot wiring, more prospect sources

**Tool stack, corrected 2026-07-15 (do not plan around tools Constantin
doesn't have):** he has a live **HubSpot** portal and a **Clay** account.
He does **not** have Cognism, Cleanlist, or 6sense — any earlier
suggestion naming those tools is superseded.

**Browser rule — very important, applies to every future BrandGEO browser
action, not just this task:** two browsers are connected
(`mcp__claude-in-chrome__list_connected_browsers`) — **"Browser 1"**
(deviceId `7d720f6a-bdd7-40c0-b17d-a4bd77075cc8`) is the correct one for
all BrandGEO work (this is Constantin's "CST" browser, where the real
BrandGEO LinkedIn company page and other BrandGEO-logged-in sessions live).
**"Browser 2"** (deviceId `e760be97-d97b-4e33-b34e-11ede41d467b`) is a
different project's browser (the one that surfaced Workfully recruiting
activity when queried in error) — never use it for BrandGEO. Any BrandGEO
chat doing browser automation must select Browser 1 explicitly (the Chrome
MCP still requires an `AskUserQuestion` confirmation before any browser
action per its own tool instructions — list both browsers as options but
Browser 1 is the correct answer every time for BrandGEO).

**Correction on the LinkedIn item — this was about growth, not an API
build.** Constantin's actual concern is BrandGEO's LinkedIn company page
sitting at **162 followers** and how to grow that number, not a request to
build a LinkedIn API integration. A prior response over-focused on the API
angle before this was clarified. Once a BrandGEO chat is actually looking
at the real page through Browser 1, the follower-growth plan should be
built from what's really there (current post cadence, engagement,
follower count) rather than proposed generically.

Several distinct pieces, all under one strategic goal (know who's
interested, get them into HubSpot, act on it), **now sequenced by
fastest-to-revenue given the 2-week goal:**

1. **Fastest, zero build cost — act on the existing Prospect Radar
   backlog.** `sales-radar/` at repo root already holds screened
   candidates with drafted-but-never-sent outreach openers from prior
   runs. This needs no new building, no new connector, nothing wired up —
   just a decision to send. **This should be the very first thing acted
   on toward the 2-week goal**, ahead of any of the wiring work below.
2. **Clay MCP connector — ✅ connected 2026-07-15.** `plugin:sales:clay` is
   now live, giving Prospect Radar real enrichment tools:
   `find-and-enrich-contacts-at-company`, `find-and-enrich-list-of-contacts`,
   `find-and-enrich-company`, `add-contact-data-points`,
   `add-company-data-points`, `get-credits-available`. This is the direct
   replacement for the Cognism/Cleanlist/6sense suggestions Constantin
   doesn't have. **Caveat: Constantin is on Clay's free/limited plan, not
   paid** — call `get-credits-available` before any bulk enrichment run,
   prefer targeted lookups on already-shortlisted prospects over broad
   exploratory enrichment, and flag Constantin if credits run low rather
   than silently failing.
3. **Free-signup tracking → HubSpot**, so a signup can actually be traced
   and pushed toward conversion, not just sit in Supabase.
4. **GA4 (and, separately, Search Console) → HubSpot — 🔴 BOTH BLOCKED ON
   PAID UPGRADES, real cost now confirmed by Constantin trying it
   himself 2026-07-15.** GA4 integration requires a paid HubSpot add-on
   (Marketing Hub's ads/analytics tier, not the free CRM). Search Console
   integration requires a HubSpot account-tier upgrade as well (HubSpot
   gates its Search Insights/SEO features to Marketing Hub Professional+).
   **Neither is a quick free wiring job — both cost real money on a
   recurring basis.**

   **Recommendation given the 2-week paying-client goal: park both for
   now, don't spend on this yet.** Visitor/search analytics feeding
   HubSpot is a mid-funnel nurture/attribution layer — valuable, but not
   what closes the first few paying clients in 2 weeks. The
   zero-cost items above (Prospect Radar backlog, Clay-powered
   enrichment) are far higher leverage for the immediate goal and cost
   nothing. Revisit this once there's revenue to justify the HubSpot tier
   bump, not before.

   **Free-tier workarounds that get partial value without paying, if
   wanted in the meantime:** (a) GA4 already has its own free reporting
   (Realtime, Acquisition, Engagement) — check traffic directly in GA4
   rather than needing it inside HubSpot; (b) HubSpot's own free CRM tier
   includes a native tracking snippet that can attribute a visitor to a
   contact once they submit a form, independent of GA4 — worth confirming
   this base tracking code is actually installed on getbrandgeo.com,
   since it may already give lightweight visitor-to-contact tracking for
   free; (c) Search Console can just be checked directly at
   search.google.com/search-console for SEO/content-strategy decisions —
   it was never going to give contact-level attribution inside HubSpot
   anyway (aggregate, anonymized data, no visitor identity), so the paid
   upgrade wouldn't unlock that outcome even if bought.
5. **A LinkedIn follower-growth strategy** (see correction above) — build
   from the real, currently-live BrandGEO LinkedIn page via Browser 1, not
   generically.
6. **More prospect-source suggestions**, revised to the real tool stack:
   HubSpot (owned) + Clay (owned, needs connecting per item 2 above) cover
   enrichment; no further paid tool purchase is needed to make meaningful
   progress in the next 2 weeks.

**Verified this session, worth recording as fact not assumption:**
HubSpot MCP is connected and live (`get_organization_details` →
`accountId: 148866779`, `uiDomain: app-eu1.hubspot.com`, EU1 data center).
**Not yet confirmed which business this portal actually belongs to** — the
same "wrong instance" risk that already happened once with the browser
mixup, so whichever chat builds on this should have Constantin explicitly
confirm this is the BrandGEO portal, not Workfully's, before writing any
data into it.

**Owner: propose Master-SalesEngine** as the strategy + build home (it
already owns Prospect Radar and `sales-radar/`, giving the most direct
path to item 1's immediate quick win) — Master-GTM stays the channel/
positioning strategy layer if Constantin would rather split it, but given
the 2-week urgency, one chat actually executing beats two chats
coordinating. Kickoff prompt below.

---

## 🚀 Kickoff prompts drafted 2026-07-15

Ready to paste into a fresh chat. Both are grounded in this session's
verified facts (HubSpot portal ID, Clay connector status, no native GA4/
GSC connector, the two real browser device IDs) rather than assumptions,
per Constantin's explicit request: *"I do want you to drop the kickoff
prompts. Consider also what I mentioned in this chat."*

### Kickoff 1 — Master-SalesEngine: GTM data pipeline, sequenced for a 2-week paying-client goal
```
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then start
Master-SalesEngine per CLAUDE.md §10.4/SALES-ENGINE.md, working from
MASTER-TASK-LIST.md §B (2026-07-15 update).

Context: Constantin is a solo operator with a hard 2-week goal to land a
few paying clients. Sequence everything by fastest-to-revenue, not doc
order:

1. FIRST, today if possible: review sales-radar/ at the repo root — it
   already holds screened prospects with drafted-but-never-sent outreach
   openers from prior Prospect Radar runs. Decide with Constantin which
   to send now. Zero new building required for this step.
2. Recommend Constantin connect the Clay MCP (registry id
   plugin:sales:clay, matches his real Clay account, currently not
   connected) via Settings > Capabilities on his end — this session
   cannot run the OAuth flow. Once connected, wire Clay's
   find-and-enrich-* tools into Prospect Radar as the direct replacement
   for the Cognism/Cleanlist/6sense tooling Constantin does not have.
3. HubSpot is connected in this environment (accountId 148866779,
   portal app-eu1.hubspot.com, EU1). CONFIRM WITH CONSTANTIN FIRST that
   this is actually BrandGEO's portal and not Workfully's before writing
   any data into it (the exact same wrong-instance mistake already
   happened once with a browser mixup this project hit).
4. Free-signup tracking into HubSpot: design how a Supabase signup
   (clients table, plan='free') gets pushed as a HubSpot contact/deal so
   it can be tracked toward conversion.
5. GA4 to HubSpot: this is most likely a one-time manual step inside
   HubSpot's own Settings UI (pasting the GA4 Measurement ID into
   HubSpot's native GA4 integration) — no MCP tool reaches that settings
   page. Give Constantin exact click-by-click instructions rather than
   assuming it can be automated.
6. Search Console is confirmed live by Constantin. Important: GSC data is
   aggregate/anonymous with no visitor identity, unlike GA4 — it cannot
   be linked to an individual contact. Treat it as an SEO/content-strategy
   input, not a contact-tracking source, and say so plainly to Constantin
   so expectations are correct.
7. LinkedIn: Constantin's actual ask is growing BrandGEO's company page
   follower count (currently 162), not building an API integration.
   Standing rule for ALL BrandGEO browser actions: only use "Browser 1"
   (deviceId 7d720f6a-bdd7-40c0-b17d-a4bd77075cc8) via the claude-in-chrome
   MCP — never the other connected browser, which belongs to a different
   project. The Chrome MCP still requires an AskUserQuestion confirmation
   before any browser action per its own tool instructions; list both
   browsers but Browser 1 is the correct answer. Once on the real
   BrandGEO LinkedIn page via Browser 1, build a concrete follower-growth
   plan (posting cadence, content types, engagement tactics) from what's
   actually there, not generically. No free/non-paid LinkedIn API
   connector exists in the registry (checked) — only paid multi-source
   aggregators (Supermetrics, Windsor.ai) which Constantin doesn't have
   and doesn't need for this.

Produce a short, dated plan doc (or update SALES-ENGINE.md) sequencing
these by real speed-to-revenue, and update MASTER-TASK-LIST.md's section B
when done.
```

### Kickoff 2 — Master-DashboardDesign: free-tier activation audit, paired with Constantin's own live test
```
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then start
(or continue) Master-DashboardDesign per MASTER-TASK-LIST.md §A
(2026-07-15).

Constantin is running his own live test tomorrow morning (2026-07-15) — a
real Free-tier signup for an actual different company genuinely enrolling,
not a synthetic account. Your job: (1) a code-level audit of Signup.tsx,
Onboard.tsx, and whatever a brand-new Free (ChatGPT-only, 1 engine) client
actually sees on first login to the dashboard — is the flow smooth, does
it generate something genuinely useful on a 1-engine allowance, is there a
real upgrade nudge; (2) once Constantin has run his real test, ask him
directly for his own first-hand impression as the tester and treat that as
a second, independent signal alongside the code audit, not a
confirmation-only checkbox. Produce a short findings doc with concrete,
specific fixes if the flow falls short, and update MASTER-TASK-LIST.md §A
when done.
```

---

## 🔴 CRITICAL — reconciled

| Item | Verified status | Evidence |
|---|---|---|
| **OpenAI quota (ChatGPT down since 07-07)** | ✅ **RESOLVED.** Top-up has landed. | Live Supabase query: the 10 most recent `chatgpt` rows in `ai_results` are all `status='ok'`, latest at **2026-07-13 11:25** — zero errors in that window. Day-by-day breakdown shows the last error was 07-12; 07-13 shows 15/15 ok so far. |
| **Security F1 — signup grants global admin** | ✅ **FIXED.** | `git log`: `ad6d641` "Security: signup no longer grants global admin; repair broken signup + add abuse throttle." Verified live: `user_profiles` has exactly **1 admin** (Constantin's own account) and 5 viewers — no stray self-serve admins exist. |
| **Security F2 — signup abuse throttle** | ✅ **FIXED** (same commit as F1). | Live Supabase query confirms the `signup_attempts` table now exists (per-IP throttle table from the fix). |
| **Engine-cost correction (blocking the pricing/quota rollout)** | ✅ **DONE, with one revert worth knowing.** | `git log`: `8b7496c` removed Claude's web-search tool (closes the never-actually-applied task #63) and capped `gpt-5.5` reasoning effort. Gemini was first moved to 3.5-flash grounding for a further saving, but that **timed out 10/10 requests** in production — `8b72b0c` reverted it back to `gemini-2.5-flash` with a new per-attempt deadline so the model-fallback chain actually works. Net result: real cost per check dropped meaningfully, verified as **actually metered now** — `30146d1` added a `cost_eur` column written on every `ai_results` insert; live query shows 44 rows already carrying real costs, all timestamped today (2026-07-13, starting 08:36). No more guessing — the quota ladder can now be built off measured data. |
| **Stripe live secret key expiring ~2026-07-17** | ✅ **CONFIRMED by Constantin, 2026-07-14.** | Not tool-verifiable (Stripe doesn't expose key-expiration metadata via API) — resolved by Constantin checking the Stripe Dashboard directly, as recommended. |

**Net: all 4 original fires are now out — 3 independently tool-verified, the 4th (Stripe key) confirmed directly by Constantin since no tool could check it.**

---

## ✅ New infrastructure — weekly content pipeline (2026-07-15, verified, working as intended, no changes)

Constantin confirmed 2026-07-15 this flow is exactly what he wanted, no
changes needed — logged here so a future rescan doesn't have to rediscover
it. Verified directly via `mcp__scheduled-tasks__list_scheduled_tasks` +
reading each task's real `SKILL.md` content, not just trusting a doc claim.

Three enabled scheduled tasks, forming one weekly loop:

| Task | Fires | Does |
|---|---|---|
| `brandgeo-monday-roadmap` | Mon 08:03 (next: 07-20) | Reads CLAUDE.md fresh, takes stock of every content initiative, decides the week's ONE real focus, seeds any new Supabase client/prompt rows needed (free), writes `ROADMAP-YYYY-MM-DD.md`. Also the gate for the AI Visibility Index — only proposes a new issue if ~30 days have passed since the last one AND there's real new trend data, never on a fixed cadence. |
| `brandgeo-wednesday-content` | Wed 09:04 (next: 07-22) | Reads that week's ROADMAP file, **verifies in Supabase the planned data actually landed** (`status='ok'`, recent `checked_at`) before writing about it, drafts the onsite content (BG-articles/city pages/Index issues/`/news/`) + off-page content, wires it into `blog.html`/`sitemap.xml` per the established conventions. |
| `brandgeo-weekly-linkedin-content` | Fri 09:05 (next: 07-17) | Reads what Wednesday actually published that week, drafts personal + company LinkedIn posts as `linkedin-posts-YYYY-MM-DD.md` (distinct voice/copy per channel, never a verbatim reshare), plus a Newsletter-issue section when an Index issue published and a native-article section every 3-4 weeks. |

**Important boundary, by explicit design (Constantin's 2026-07-15
decisions, written into each task's own hard rules) — this is fully
automated planning + drafting, fully manual execution:**
- **Collection is never auto-triggered.** Monday prepares/seeds data but
  always stops short of clicking "Run Collection" — that's Constantin's
  step alone, since it spends real API money per call.
- **Nothing auto-publishes.** Wednesday writes/wires content locally; it
  never goes live until Constantin manually uploads via cPanel.
- **Nothing auto-posts to LinkedIn.** Friday only ever produces a draft
  file — there's no posting/scheduling connector wired in, Constantin
  posts/schedules manually.

**Status as of 2026-07-15: none have run yet** — all three are freshly
enabled with future `nextRunAt` dates. Friday (07-17) fires first,
standalone, since Monday/Wednesday haven't run yet this week (its own
fallback logic handles that gracefully); the full three-task loop starts
properly the week of 07-20.

**Worth a light follow-up, not urgent:** once the pipeline completes its
first full cycle (~07-20 through ~07-24), spot-check the actual output
quality (ROADMAP file, the drafted content, the LinkedIn draft) before
assuming it'll keep running unattended indefinitely — same standing
principle as everywhere else in this project, verify rather than trust a
"done" claim, including the pipeline's own.

---

## ✅ Homepage regression from last rescan — RESOLVED 2026-07-14

While spot-checking the compliance fixes, an earlier pass found `getbrandgeo.com`'s footer still showing the old, supposedly-fixed content (a leftover "🔒 GDPR Compliant" badge, and "Registered in Spain 🇪🇸 (EU)" instead of the softened "Based in Spain"). Constantin re-uploaded the current `index.html` to cPanel and confirmed done 2026-07-14. Worth a quick live re-fetch on the next rescan to independently reconfirm, same as every other "done" claim in this file, but no longer blocking anything.

---

## 🟠 HIGH

### Reconciled as done this rescan (git-verified)
| Item | Evidence |
|---|---|
| #109 (Gemini silent-null), #110 (Instant Audit Gemini bug), #111 (Gemini bullet-list rank) | `git log`: `7eddd31`, `76627dd`, `de949f6` — all committed, pushed. |
| §8.12 BpR heading-prefix + sentiment-window bugs | `git log`: `8e79bd7` — committed. |
| Analysis rounds 4 & 5 (certification-name rejector, domain/name dedupe, stated-superlative rank, emoji-deletion bug, bare single-word criterion nouns) | `git log`: `a40e87b`, `3ff322a` — committed. Round 5 also closes the "residual numbered-list-label leakage" item that was previously flagged as still open. |
| Competitors.tsx front-end company-name filter consolidated into the one shared module | `git log`: `8f04fdf` — committed. Only two copies of the filter now exist project-wide (this module + the write-time `_analysis.js`), matching the documented "honest floor." |
| Recommendations: filter API-failure rows, stop feeding prose-only competitors to the model, stop priming fabricated causes, persist every run as an auditable trail | `git log`: `6f07ac7` — committed. Live-verified: `recommendation_runs` and `recommendations` tables both exist in the DB. |
| Score divergence fix (Overview vs. AI Visibility showing different numbers) | `git log`: `329e4e4` — committed. |
| Competitor leaderboard ranking-vs-prose-only fix | `git log`: `525170a` — committed. |
| **Force Refresh BpR** (client_id 1) | ✅ Done. Live Supabase query shows fresh BpR rows across all 5 engines at **2026-07-13 11:24–11:25**, all carrying real `cost_eur`. This means BpR's data is now running on every shipped accuracy fix — the case-study data is finally trustworthy. |
| The big cPanel upload backlog (compliance batch, `/news/` folder, 6 remaining city pages, glossary) | ✅ **Mostly live**, confirmed by direct fetch: `/news/` is live and links all 7 city pages (London/Berlin/Madrid/New York/Paris/Rome/Dublin); `blog.html` shows all 15 `bg-00X` articles as "Published," the full "Compare BrandGEO" (10 cards) and "AI Visibility by Industry" (10 cards) and "AI Visibility by City" (7 cards) sections, and the glossary link in its footer. **Exception: `index.html` itself** — see the regression flagged above. |
| Plan-derived rate limit / monthly euro budget enforcement (SCALE-SPEC §2.2–2.3) | ✅ **DONE — confirmed by Constantin 2026-07-15**: completed, committed, and published; verified live. The Growth-tier 429 bug this was fixing is resolved. Not yet independently re-verified via a fresh tool check this pass — logged on Constantin's confirmation, worth a spot-check on the next rescan. |

### Still genuinely open
| Task | Owner | Difficulty | Notes |
|---|---|---|---|
| **Collection queue / scheduler / background worker** (`collection_jobs` table + async collection) | Master-DashboardDesign | **Involved** | 🟡 **IN PROGRESS as of 2026-07-15** (Constantin: "currently work in progress, will let you know when it's done"). Previously confirmed not built (`collection_jobs` table didn't exist in the live DB as of last check). This remains the one real scalability blocker (State-of-Product's own framing: the thing that unlocks the self-serve thesis at 1,000 clients). Kickoff prompt already handed to Constantin 2026-07-15 (Opus 4.8, per SCALE-SPEC.md §3). |
| True up quota ladder from real `cost_eur` data (needs ~2 weeks of data first) | Master-DashboardDesign | Quick once ready | Data collection only started today (07-13) — not enough history yet regardless of code status. |
| Master-GTM: decide public cost/depth positioning before Master-SiteDesign writes pricing copy | Master-GTM | Moderate (judgment call) | No evidence this decision has been made yet |
| Master-GTM: reconcile plan-to-engine mapping against Master-Reasoning's engine-value findings | Master-GTM | Moderate | Still open |
| Review + approve (or kill) the drafted LinkedIn push | Constantin | Quick | `GTM-LINKEDIN-DRAFTS.md` unchanged since 07-12 22:04 — still explicitly "DRAFT ONLY, nothing posted, scheduled, or sent." Six open flags still need your call. **Constantin: doing this first thing tomorrow (2026-07-15).** |
| Master-Billing: restate add-on prices as "check packs" (current pricing breaks the cost-ratio rule) | Master-Billing | Quick | No evidence of a Stripe price change for this yet |
| Master-Billing: VAT/Stripe Tax config for the Canary Islands origin | Master-Billing | Involved (needs a tax advisor) | Still open, deliberately unconfigured |
| Master-Billing: archive the stray mislabeled Stripe price | Master-Billing | Quick | Not independently re-checked this pass |

---

## 🟡 MEDIUM

| Task | Owner | Status |
|---|---|---|
| Security F3: pin `search_path=''` on the 4 RLS-helper functions | Constantin / any chat | ✅ **DONE — verified live.** `pg_proc` query confirms all 4 (`my_role`, `my_client_id`, `is_admin`, `get_my_client_id`) now show `search_path=""`. |
| Security F5: lock down `purge-old-results.js` | Master-Security | Not independently re-checked — status unknown, treat as still open |
| Security F4: consolidate duplicate RLS policies / helper families | Master-Security | Still open (low-priority cleanup, explicitly "not a rush") |
| M2 (compliance): `ai-visibility-for-hotels.html` schema-type consistency fix | — | Not independently re-checked this pass |
| Sales Radar: formalize as a scheduled automation vs. keep manual; reconcile the reported HubSpot write-path change against the original read-only design | Constantin ↔ Master-SalesEngine | Still open, no new evidence either way |
| `terms.html` effective date bump | Constantin | Still open |
| M3 (compliance): watch Search Console for scaled-content flags on the ~20 templated pages | Constantin (passive) | Watch-only, no action needed |
| **Publish a monthly proprietary data report** — recurring content built only from real, already-processed BrandGEO data; no invented/estimated numbers | Master-Writer + whichever chat has query/tracking data access | 🔴 **PROMOTED TO ACTIVE 2026-07-14** — Constantin flagged this as next relevant. Previously blocked on confirming what real aggregate data is actually queryable; `ai_results`/`cost_eur` now has real historical data accumulating daily since 07-13. First step for whoever picks this up: confirm exact queryable volume/date-range/fields before drafting, don't assume the block is fully clear just because data exists. Also confirm whether this is meant to be the same publication as the AI Visibility Index or a distinct one. |
| **New weekly content pipeline** (Mon roadmap → Wed content → Fri LinkedIn) — first-cycle quality spot-check | Constantin / any chat | ✅ Confirmed live and correctly scoped 2026-07-15, no changes needed. Not urgent — just watch the actual output once the first full cycle completes (~07-20 through ~07-24) before assuming it'll run unattended indefinitely. |
| 🟠🟡 **Weekly "Effort + Wrong Tool = No Result" content pillar** (new 2026-07-15) — recurring content theme, not a one-off post. Core hook: companies are putting in real marketing/SEO effort but using the wrong tool for the AI-visibility era, which is why they get no results — BrandGEO is the right tool for that job. Original creative only (before/after examples, case-style posts, short-form hooks) — no reproduced third-party artwork or content, message/concept only. **Constantin considers this the central emotional angle for the sales team's actual pitch, not just a content idea.** | Master-Writer (content) in coordination with **Master-GTM** (this is core sales positioning, not just a content theme — GTM needs to sign off on the framing before it's the thing sales leads with) | 🆕 **Not yet scoped.** Priority Medium-High per Constantin — core to the sales narrative, but a new recurring commitment, not urgent today. Fold into the existing weekly content pipeline (Mon roadmap → Wed content → Fri LinkedIn, row above) as a standing content day — **at minimum one dedicated day per week** built around this framing — rather than treating it as a standalone one-off task. **Next step for whoever picks this up:** scope an actual weekly execution plan (cadence, format rotation, who approves the "wrong tool" framing before it ships as sales collateral) — a single post proves nothing here, this needs to become a running series. |

---

## 🟢 LOW

| Task | Owner | Status |
|---|---|---|
| Security F7: enable Supabase leaked-password protection | Constantin | Not re-checked, presumed still open |
| Off-site distribution kit (Crunchbase, HARO, GitHub glossary, GitBook, Substack article, Notion template, directory listings, resource-page outreach) | Constantin | Not re-checked this pass — the earlier doc conflict (Crunchbase "done" vs. "never signed up for") is still unresolved, worth a 30-second manual check on crunchbase.com |
| L1 trust-signal follow-ups (DPA draft, TrustArc, UK ICO) | Constantin, whenever triggered | Deliberately parked |
| Retrofit "related research" grid onto BG-001–004 | Master-Writer | ✅ Confirmed **already done** — live fetch of `bg-001.html` shows a full "Related research" 4-card grid at the bottom (BG-002/003/004/005). No longer open — remove from backlog. |
| §9.2 own-GEO dogfooding collection run | Master-Writer / Master-DashboardDesign | Not re-checked, presumed still open |
| **Per-engine + per-term content series** (dedicated pieces per AI engine; broaden beyond "GEO" to AI visibility/AEO/LLMO terminology) | Master-Writer (any instance) | Captured for later, no action needed now |

---

## Already resolved / confirmed — no action needed

- Task #109, #110, #111 — shipped, committed, verified.
- §8.12 BpR heading/sentiment bugs — shipped, committed.
- Analysis extraction rounds 4 & 5 — shipped, committed. Closes the "round-4 leakage" item that was previously open.
- Competitors.tsx filter consolidation — shipped, committed.
- Recommendations persistence + input-quality fixes — shipped, committed, tables live.
- Score-divergence fix (Overview vs. AI Visibility) — shipped, committed.
- Competitor leaderboard ranking fix — shipped, committed.
- **Force Refresh BpR** — done, verified live with fresh data across all 5 engines.
- §6.4 RLS leak — still fixed, re-confirmed (only 1 admin, correct role counts).
- DB indexes + `competitors` tenant-scoped uniqueness (SCALE-SPEC step 0) — applied and previously verified live.
- Glossary page — live, confirmed via `blog.html` footer link.
- All 7 city-research pages — live (confirmed via `/news/` and `blog.html` fetches: London, Berlin, Madrid, New York, Paris, Rome, Dublin all linked and reachable).
- `/news/` folder — live, confirmed via direct fetch.
- Dublin market in the dashboard's market selector — live (unchanged from last check).
- Injected `/news/` link-scheme block — removed, access revoked, closed.
- "Related research" grid on BG-001–004 — confirmed live this pass, was previously listed as still-open in error.
- Compliance H1 (round 1 + round 2, the "7 engines" false claim) — confirmed live and correct on `bg-001.html` and `blog.html`.
- `cost_eur` real-cost metering — confirmed live, populating since today.

---

## How to keep this current

1. Best option: have each live Master-* chat write its status to its own persistent doc when it finishes a scoped piece of work (already this project's convention) — then ask me to rescan.
2. Faster: paste me a live-chat update directly and I'll fold it in without waiting for a file write.
3. Where possible I'll keep verifying independently (Supabase queries, live fetches, git log) rather than trusting doc text alone — that's what caught the `index.html` regression this pass.
