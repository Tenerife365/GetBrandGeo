# Activation Audit (Pillar 4: dashboard and onboarding) - 2026-08-13

Seat: ACTIVATION, five-seat product-status audit. Question: when someone did sign up, what did they actually experience, and where did they die?

Method notes. Every claim is tagged MEASURED (file:line, git sha, URL, SQL, or bundle grep) or INFERRED. "Repo" means the working tree at HEAD `63a005c`; "live" means what app.getbrandgeo.com serves right now. The two were compared directly: the served bundle is `assets/index-Y23I9p4d.js` (MEASURED, fetched 2026-08-13), and it contains marker strings from `4b67a8d` (2026-08-03), the newest commit that touches `brandgeo-dashboard/` (MEASURED: `git log 4b67a8d..HEAD -- brandgeo-dashboard/` is empty). So for every activation surface in this report, LIVE EQUALS REPO. `main` equals `origin/main` (MEASURED: `git status -sb`), so committed also means pushed. Netlify functions deploy from the same commit as the bundle, so the deployed functions include everything through `4b67a8d` as well (INFERRED from Netlify's atomic deploy model, supported by live probes below). 7 read-only Supabase SELECTs were run; no writes, no logins, no form submissions, no collections triggered.

---

## TL;DR verdict

**The first session, as shipped today, is mechanically good and delivers real first-value in about 5 minutes. The tragedy is sequencing: every major activation fix landed between 2026-07-21 and 2026-08-03, AFTER the launch-window traffic had come and gone. The users who arrived during the interest wave (launch ~2026-07-06 through late July) met the broken version: viewers who could not trigger collection at all (until 07-21), a "0% AI VISIBILITY SCORE / Needs Work" verdict on an unmeasured brand and a /sentiment dead end (until 07-28), and a free tier whose 5 prompts could not fit its own budget (until 07-31). The funnel does not leak in one place; it has almost no inflow (5 email signup attempts EVER, MEASURED), it loses authenticated users at /welcome (2 of 13 auth users have no profile, MEASURED), and it gives activated free users no reason to return: a 30-day manual cooldown, zero lifecycle emails, and a monthly auto-refresh that has never fired for any free client because all pre-2026-07-31 rows still sit on refresh_cadence='manual' (MEASURED: 36 of 38 clients are 'manual'; zero clients on 'monthly').**

Completed self-serve signups since the audit trail began on 2026-07-31: **zero** (MEASURED: no `client_events` row of type 'signup' exists). The entire self-serve population of the product's life is roughly three accounts: slatehq (competitor recon, died at the empty dashboard with 0 prompts), ai-fy (activated in 5.5 minutes, last seen 2026-07-31), and alexandru-teodor (likely admin-assisted, one day of activity). The landing page promise ("see how AI answers name you") IS delivered by the current build, with one honesty gap: the Free tier's own first-run copy names ChatGPT while Free collects only Gemini.

---

## The first-session walkthrough (numbered, from code)

State of the flow as shipped: live equals repo (see method notes). Click/field counts are for the happy path. Two entry variants are traced.

### Variant A: audit entry + Google SSO (the designed path)

1. **getbrandgeo.com hero.** Visitor types their domain into the audit widget (`#brandInput`, `id="free-audit"` hero) and clicks run. 1 field, 1 click. The audit takes ~27-32s (MEASURED: live site.js `AUDIT_TIMEOUT_MS = 32000` and its comment "a real screening audit measured 26.9s"; widget confirmed live: `free-audit|brandInput` matches 7 times in the served homepage).
2. **Audit result card.** Score renders, plus an unlock-report email form, plus the forward step: "Or start a free account for {domain}" linking to `https://app.getbrandgeo.com/signup?domain=...` (MEASURED: live site.js `signupUrl()` at line ~108 and the `audit-forward` block; this success-path link only exists since C1b, 2026-07-31, before which only a FAILED audit forwarded to signup). 1 click.
3. **/signup.** Headline reads "Start tracking {domain}" because the query param is validated and stored to localStorage on arrival (MEASURED: Signup.tsx:34-36, 104-113; "Start tracking" present in live bundle x2). Two paths offered: "Continue with Google" (SocialAuthButtons) or email. Google path: 1 click here plus the provider's own account chooser (1-2 external clicks). The Google provider is genuinely enabled on the Supabase project (MEASURED: `GET /auth/v1/settings` returns `"google": true`; `linkedin_oidc: false`, so the LinkedIn button renders its "soon" variant, SocialAuthButtons.tsx:68-77).
4. **OnboardGate.** The freshly-authed user has no `user_profiles` row, so `needsOnboarding` routes them to /welcome (MEASURED: clientContext.tsx:169-172, App.tsx:57-71,102).
5. **/welcome ("What do you want to track in AI answers?").** Company/personal choice cards. For the audit arrival, both the account type ('company') and the website field are prefilled from the carried domain (MEASURED: Welcome.tsx:47-52); a work-email user gets the same prefill from their email domain (Welcome.tsx:54-63). Click Continue. 1 click, 0 typed fields on this variant.
6. **provision-account.** Server creates the `clients` row: plan 'free', `refresh_cadence` from `refreshCadenceFor('free')` = 'monthly', `last_refresh_at` stamped now (so the first automatic run is one month out), `default_market_id: 'WW'`, role 'viewer', writes a `client_events` 'signup' audit row and an admin new-signup alert (MEASURED: provision-account.js:173-192, 206-208, 241-272). **It seeds NO prompts and fires NO collection.** The comment "the activation collection the app already fires at signup" (provision-account.js:170-171) describes nothing that exists in src/: no code path outside AIVisibility's buttons and the admin Onboard wizard calls runCollection (MEASURED: grep of `runCollection|enqueue-collection` across src/). Full reload lands on "/".
7. **First dashboard render.** "Good {daypart}, {brand}" plus the zero-data hero: an empty-state card titled **"Not measured yet"** with body "BrandGEO measures how AI engines like ChatGPT and Gemini answer real buyer questions about {brand}. Add a prompt to start." and a single CTA **"Add a prompt"** routing to /prompts (MEASURED: Dashboard.tsx:388-412; "Not measured yet" x2 and "Add a prompt" present in live bundle). No 0% ring, no verdict. 1 click.
8. **/prompts.** Two ways to create prompts: type them (1 field + save each), or the **AI Discover** panel (1 click), which auto-generates tailored suggestions from the brand website via `suggest-prompts` (viewer-authorized, requireAuth without adminOnly, MEASURED: Prompts.tsx:85-150, suggest-prompts.js:7) and offers **"Add all"**, sliced to the plan's remaining allowance so a Free user gets exactly their 5 and not 7 errors (MEASURED: Prompts.tsx:270-282; `PLAN_PROMPTS.free = 5`, planConfig.ts:541; DB trigger `enforce_prompt_cap` is the real cap, Prompts.tsx:218-251). 2 clicks on this variant, ~5-15s generation wait.
9. **Run the first collection.** Nav to AI Visibility (1 click). The **Run Collection** button is the page's primary CTA and is visible and enabled for viewers; for a brand-new client there is no cooldown because no manual `collection_runs` row exists yet (MEASURED: AIVisibility.tsx:681-697, disabled only on `!isAdmin && !!collectionAllowance.nextAvailableAt`; allowance derives from collection_runs, AIVisibility.tsx:406-441). Click it (1 click). The run is ENQUEUED server-side (enqueue-collection.js), the worker is kicked immediately, and the browser just polls every 4s; closing the tab does not kill the run (MEASURED: collectionContext.tsx:89-132, _enqueue.js:222-233).
10. **Wait ~30-90s.** Free plan collects ONE engine, Gemini, across the 5 prompts (MEASURED: `PLAN_ENGINES.free = ['gemini']` planConfig.ts:75, `PLAN_LIVE_ENGINES.free = ['gemini']` _cost.js:408, and server-side re-gating in _enqueue.js:74-78 so a forged engine list cannot widen it). Real job durations run 14-33s each (MEASURED: collection_jobs for client 52, finished_at minus created_at).
11. **First value.** Score ring counts up from empty to the real score, one active engine card (Gemini) with mention %, the prompt table fills row by row as polls land, and Sentiment/Competitors/Mentions populate from the same rows. Locked engine cards render upgrade labels from `ENGINE_UNLOCK_PLAN` (ChatGPT correctly says Essentials, not the next rung, MEASURED: planConfig.ts:226-237, corrected in the 6d2196c family).

**Variant A totals: ~10 clicks, 1 typed field, roughly 4-7 minutes including the 30s audit, ~10s generation and ~60s collection.**

### Variant B: email path (adds the inbox round trip)

Same as A except step 3: type email (1 field), click "Continue with email" (signup-client sends a Supabase invite via `inviteUserByEmail`; the screen says "Check your email"), open the inbox, click the link (1 click, context switch), land on /reset-password and set a password (2 fields, 1 click), then continue at step 4 (MEASURED: Signup.tsx:38-92, signup-client.js:118-135). Guards: honeypot, 3 signups/IP/day, disposable-email block (MEASURED: signup-client.js:51, 77-96). **Variant B totals: ~13 clicks, 4 fields, 6-10 minutes, with the classic pre-value email cliff in the middle.**

### Measured real-world confirmation

ai-fy, the one clean self-serve activation on record: client created 2026-07-23 09:01:01, first prompt 09:04:50, manual run 09:06:04, **first ai_results row 09:06:22, 5 minutes 21 seconds signup-to-value** (MEASURED: SQL timeline, clients/prompts/collection_runs/ai_results). The admin path is faster still: doctor-mihail (Radar, admin-onboarded 2026-08-02, the day's `client_events` 'onboarded' row) had prompts 2 seconds after creation and jobs done in 33s.

Note the ADMIN wizard (/onboard, Onboard.tsx) is a different flow entirely: admin-only nav entry, seeds prompts in the wizard, fires collection itself (Onboard.tsx:172). Nothing in this walkthrough uses it.

---

## Founder questions

### a. Time-to-Value

**Verdict: 4-7 minutes and ~10 clicks on the designed path; measured 5m21s for the one real user who completed it. Mechanically competitive.** Evidence: walkthrough above; ai-fy timeline (MEASURED). The Aha moment is real data about their own brand from a real engine run, not a demo. The two big waits (30s audit, 60s collection) are both animated with live progress. The email variant's inbox round trip is the slowest segment and sits before any value.

### b. Empty-state guidance

**Verdict: guided, but a chain of single CTAs rather than a setup checklist.** First login greets the user with one purposeful empty state ("Not measured yet" + "Add a prompt"), and each surface at zero data carries exactly one focusable next action (Dashboard.tsx:388-412; AIVisibility.tsx:1525-1533 "No prompts yet / Add prompts"; BrandSentiment.tsx:328-338 "Run a collection"; shared component EmptyState.tsx built explicitly to kill the prose-only dead ends, MEASURED). There is no persistent 3-step checklist (add prompts, run collection, see score) with progress state; the user must bounce Dashboard -> Prompts -> AI Visibility and re-read the next instruction each hop. INFERRED risk: a user who adds prompts and stops on /prompts is never told the run happens on another page; the "Run first collection" branch of the Dashboard empty state is only seen if they return to Overview.

### c. Friction points (where users drop off)

Ranked by measured evidence:
1. **Before the app: almost nobody enters.** 5 email-path signup attempts in the product's whole life (2026-07-13 to 07-30) (MEASURED: signup_attempts). This is a traffic problem, not a UX problem, but it dominates everything downstream.
2. **/welcome.** 13 auth.users, 11 profiles: 2 authenticated users never completed provisioning (1 of them never signed in at all, an unaccepted invite) (MEASURED). That is a real loss step at the only screen between auth and the dashboard.
3. **The empty dashboard, historically.** slatehq (2026-07-21) provisioned and left 0 prompts, 0 runs (MEASURED). They saw the pre-2026-07-28 build whose first screen was "0% AI VISIBILITY SCORE ... Needs Work" (fixed in 75e1ede). The current build's guided empty state postdates every organic visitor.
4. **Silent failure on the primary button.** If enqueue returns 429 (budget) or a skip ("no active prompts", "nothing to collect"), collectionContext logs to console and resets; nothing is shown to the user (MEASURED: collectionContext.tsx:103-107 vs enqueue-collection.js:44-60). Viewers are pre-empted on COOLDOWN by the disabled button + countdown chip (AIVisibility.tsx:690, 741-743), but a budget block or zero-prompt click is an invisible no-op: spinner flashes, nothing changes, no message. The euro budget meter is admin-only by design (AIVisibility.tsx:767-774), so a budget-blocked viewer has no surface that explains it.
5. **After the first run: a 30-day wall with no comeback.** Free's manual cooldown is 720h (MEASURED: _cost.js:566-569, planConfig.ts:560-563); the countdown chip then reads "Next run available in ~30 days". No lifecycle email exists (grep of _email.js: invite only, no welcome/nudge, MEASURED), and see (d) for why the automatic refresh has never fired for any existing free client. ai-fy's pattern fits: two visits (07-23, 07-31), then silence.

### d. Value visibility

**Verdict: with data, the dashboard is value-forward, not a tool menu; but the product actively destroys the trend that would earn the second visit.** With rows present, Overview leads with the score ring, six dimensions and sparklines; AI Visibility leads with per-engine mention rates and a Fix This hub (MEASURED: Dashboard.tsx:414+, AIVisibility.tsx:778+). Two undercuts:
- **Scheduled refreshes are force-refreshes: they DELETE the prior rows and recollect** (MEASURED: _enqueue.js:12-26 "TREND-HISTORY NOTE", :138-152; and proven in production: client 52's manual run 48 on 2026-08-02 completed all 3 jobs 'done', yet the client's oldest surviving ai_results row is 2026-08-09, the day the weekly scheduled run wiped and replaced them). The upgrade argument stated in planConfig.ts:615 is "one data point is not a trend, and the trend is the entire upgrade argument", and the pipeline currently guarantees every auto-refreshed client holds exactly one data point.
- **A Free user's history went invisible on 2026-07-31.** ai-fy's first-run rows are chatgpt (07-23, pre-1b); after Free moved to Gemini their dashboard computes over active engines only, so those rows no longer render anywhere (MEASURED: ai_results rows chatgpt x2 + gemini x2 for client 26; AIVisibility stats map over `activeLLMs`, AIVisibility.tsx:447-451). INFERRED: to that user it looked like their first week of data vanished.

### e. In-app prompting when stuck

**Verdict: minimal but not zero, and entirely in-app; the email channel is unused.** Present: the askmywebsiteai chat widget is loaded in the live app shell (MEASURED: `askmywebsiteai` in served index.html; the old sidebar assistant was removed in its favour, Layout.tsx:967-980), every empty state carries a CTA, the cooldown has a live countdown chip, cap errors name the limit and the way out ("Delete one to add another, or upgrade", Prompts.tsx:245-251), and locked engines/features render upgrade paths (FeatureLocked, ENGINE_UNLOCK_PLAN). Absent: onboarding tour, tooltips on first visit, any post-signup email (welcome, "your first results are ready", "your monthly refresh ran"), and any notification when the scheduled run completes. A free user's monthly auto-refresh (once it ever applies) would land silently into a dashboard nobody is looking at (INFERRED from absence of any mailer call in schedule-collections.js/collection-worker, MEASURED grep).

---

## Status of the four known-history items

### 1. ~2026-07-21 free-tier viewers could not trigger collection (fatal frontend gate). Fix in repo AND live?

**CONFIRMED FIXED, in repo and live.** The fix is commit `6fe9b38` (2026-07-21, "Free tier: let self-service viewers trigger their own collection", MEASURED: `git log -S "Visible to VIEWERS too"`). Repo: the Run Collection button renders for viewers with an explanatory comment, disabled only by cooldown (AIVisibility.tsx:681-697), and the server authorizes viewers for their own client (enqueue-collection.js:36-39, _auth.js step 5). Live: the served bundle postdates it by six weeks (contains 2026-08-03 markers) and carries the viewer-only allowance strings "Next run available in" and "Included runs" added 2026-07-29 (MEASURED bundle greps); the deployed endpoint exists and 401s an unauthenticated POST (MEASURED probe).

### 2. Free = 5 ChatGPT prompts vs EUR 0.30 budget; ruling 1b moved PLAN_ENGINES.free to ['gemini']. Shipped everywhere?

**CONFIRMED SHIPPED end to end: planConfig.ts AND _cost.js, committed, pushed, and in the DEPLOYED build.** Commit `6d2196c` (2026-07-31) changed both copies plus `_plans.js` (MEASURED: `git show 6d2196c --stat`); repo now reads `free: ['gemini']` at planConfig.ts:75 and _cost.js:408; main equals origin/main; the live bundle literally contains `free:["gemini"]` and `radar:["gemini","claude"]` (MEASURED bundle grep), and the functions deploy from the same commit as that bundle.

**Two corrections to the inherited story, both from evidence rather than memory:**
- The severity model was slightly off. _cost.js:383-391 records the measured figure: 152 real chatgpt rows averaged EUR 0.0615/check (range 0.060-0.123), not the roadmap's 0.108. So five prompts averaged EUR 0.307 vs the 0.30 budget: the block hit on the LAST prompt at typical rates and around the third only when rows ran expensive.
- **"Every free signup's first run has been erroring since launch" is REFUTED as a description of what actually happened.** The defect was real and live from launch until 2026-07-31, but it required a free client to carry enough prompts to breach EUR 0.30 in a month. The only free-tier collections in that window were ai-fy (2 prompts, ~EUR 0.12/run) and alexandru-teodor (1 prompt) (MEASURED: SQL, ai_results by client/llm); neither could hit the ceiling, and zero ai_results error rows exist for any self-serve client (MEASURED: status='error' count is 0 for clients 25/26/27/52; note a budget block surfaces as an enqueue 429, not an error row, and zero manual runs were blocked in that window given the run counts line up with the results). The bug was a landmine on the designed path, not the cause of the observed quiet.

### 3. Signup redesign Phase 1 (Google SSO + email + post-auth onboarding), needed provider enablement + deploy. Live?

**CONFIRMED LIVE, all three parts.** Built in `11b4dba` (2026-07-21), domain-carry added in `fc97dbc` (2026-07-31) (MEASURED: git log on Welcome.tsx/provision-account.js). Live bundle contains "Continue with Google", "Continue with email", "Start tracking", and "What do you want to track in AI answers" (MEASURED greps); the Supabase project's auth settings return `"google": true` (MEASURED: /auth/v1/settings with the public anon key), so the provider is enabled, and `provision-account` is deployed and gated (401 probe). LinkedIn remains disabled (`linkedin_oidc: false`), which the UI already handles with a "soon" button.

### 4. Prior audit (docs/qa/dashboard-audit-2026-07-26.md): 0% score verdict, /sentiment dead end, 52% reachable / 24% dead ends. Still true?

**The two named defects are FIXED in repo and live; the percentages were not re-measured.** The 0%-verdict first run was replaced by the "Not measured yet" empty-state hero with routing CTAs in `75e1ede` (2026-07-28, dashboard visual system, audit F-02/F-03), and /sentiment at zero data now renders the shared EmptyState with a "Run a collection" link (EmptyState.tsx's own header documents "/sentiment at zero data measured zero buttons and zero links before this existed"). Both strings are in the live bundle ("Not measured yet" x2, "Sentiment appears here once AI engines mention", "Run a collection") (MEASURED). The 52%/24% reachability census would require an authenticated crawl, which this audit is barred from; INFERRED that the dead-end share is materially lower now given the class fix, but not re-measured.

---

## Severity-ranked defect and friction ledger

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| L1 | HIGH | **No existing free/self-serve client will ever auto-refresh.** `feed1d5` (2026-07-31) writes refresh_cadence only for NEW clients; no backfill ran. 36 of 38 clients sit on 'manual', including every free client; zero clients on 'monthly'. The free tier's designed comeback loop has fired 0 times in production. | MEASURED: SQL cadence distribution; schedule-collections.js:21-34; provision-account.js:173 |
| L2 | HIGH | **Scheduled refresh destroys history: force-delete + recollect.** Weekly clients hold one snapshot, never a trend; the trend is the stated upgrade argument. Proven live on client 52 (rows from 08-02 gone after the 08-09 scheduled run). | MEASURED: _enqueue.js:12-26,138-152; SQL collection_jobs + ai_results for client 52 |
| L3 | HIGH | **Zero completed self-serve signups since 2026-07-31**, and ~5 signup attempts ever. The rebuilt funnel has processed no one. Not a code defect; the governing fact of Pillar 4. | MEASURED: client_events has no 'signup' rows; signup_attempts = 5 |
| L4 | MED | **Budget/skip blocks are invisible to the user.** enqueue 429s and skip reasons are console-logged, never rendered; a blocked viewer sees a spinner that stops. Cooldown is the only pre-empted case. | MEASURED: collectionContext.tsx:103-107; enqueue-collection.js:44-60; AIVisibility.tsx:690 |
| L5 | MED | **First-run copy promises ChatGPT to a Gemini-only tier.** Dashboard empty state: "AI engines like ChatGPT and Gemini ..." shown to Free, whose plan never runs ChatGPT; the S2-owned locked-engine copy consequence from ruling 1b, half-addressed (ENGINE_UNLOCK_PLAN is fixed, this string is not). | MEASURED: Dashboard.tsx:404; planConfig.ts:75 |
| L6 | MED | **/welcome loses real users.** 2 of 13 auth users have no profile (1 never signed in). Small numbers, but it is 2 of ~4 organic auth events since the redesign. | MEASURED: SQL auth.users vs user_profiles |
| L7 | MED | **A Free user's pre-1b ChatGPT rows became invisible** after the engine swap (stats compute over active engines only). Their first week of data appears deleted. | MEASURED: ai_results client 26; AIVisibility.tsx:447-451 |
| L8 | LOW | **No lifecycle email of any kind after the invite.** No welcome, no "results ready", no refresh notification; admin gets alerts, the user gets nothing. | MEASURED: _email.js grep; schedule-collections.js has no mailer |
| L9 | LOW | provision-account.js:170 comment claims "the activation collection the app already fires at signup"; no such trigger exists in src/. A future reader will design against a phantom. | MEASURED: grep runCollection/enqueue-collection across src/ |
| L10 | LOW | Guidance is a CTA chain, not a checklist; the "run it on AI Visibility" step is only discoverable back on Overview or via nav. | MEASURED: Dashboard.tsx:388-412; INFERRED drop-off risk |
| L11 | INFO | Free allowance surfaces are honest and well-built: cooldown countdown, prompts meter, cap errors with upgrade path, "Add all" sliced to allowance. | MEASURED: AIVisibility.tsx:741-765; Prompts.tsx:245-282 |
| L12 | INFO | site.js comment still says free refresh_cadence defaults to 'manual'; since feed1d5 a new free signup gets 'monthly'. Cosmetic staleness in a load-bearing comment. | MEASURED: live site.js ~line 303 vs provision-account.js:173 |

---

## Top 5 fixes ranked by expected activation impact

1. **Backfill refresh_cadence for existing non-research clients** (one UPDATE deriving from plan via `refreshCadenceFor`, research guard already double-enforced), and add a "your refresh ran" email. This turns on the only mechanism that brings a free user back, for the only users who exist. (L1, L8)
2. **Stop scheduled runs deleting history.** Make the scheduled path snapshot-and-append (or archive rows before delete) so week 2 shows movement. The pricing thesis says the trend IS the product; today the pipeline deletes it weekly. (L2)
3. **Surface enqueue blocks in the UI.** Render `resp.reason`/`error` from enqueue-collection as a toast or inline notice on AI Visibility, and show a viewer-friendly allowance message for budget blocks. One file each side. (L4)
4. **Collapse the first session to one screen.** Seed the 5 free prompts automatically at /welcome (suggest-prompts already exists server-side and is viewer-authorized) and enqueue the first collection from provision-account, making the first dashboard render a live filling scoreboard instead of a two-hop CTA chain. This also makes the phantom comment at provision-account.js:170 true. (L10, L9, and it moves time-to-value from ~5 minutes to ~60 seconds)
5. **Fix the Free-tier promise copy.** Dashboard.tsx:404 should name what Free actually runs (Gemini) and let the locked ChatGPT card do the Essentials upsell it already does correctly; render historical rows from since-locked engines as a greyed "collected on a previous plan" band instead of hiding them. (L5, L7)

---

## Appendix: evidence inventory

- Live bundle: `https://app.getbrandgeo.com/assets/index-Y23I9p4d.js` (1,407,491 bytes, fetched 2026-08-13). Marker greps (all present): "Not measured yet" x2, "Continue with Google", "Start tracking" x2, "What do you want to track in AI answers", "Run Collection", "Continue with email", `free:["gemini"]`, `radar:["gemini","claude"]`, "Add a prompt", "Run first collection", "Next run available in", "Included runs", "Sentiment appears here once AI engines mention", "Run a collection" x2, "Real clients only" (from 4b67a8d, 2026-08-03), "revenue-report", "Gross invoiced".
- Live probes: POST enqueue-collection unauthenticated returns 401; POST provision-account unauthenticated returns `{"error":"Unauthorized: missing token"}`; `GET https://duiyifepitvugyulobqm.supabase.co/auth/v1/settings` returns `"google": true`, `"linkedin_oidc": false`; live getbrandgeo.com site.js carries `signupUrl(domain)` and the audit-success forward link; askmywebsiteai widget in live app index.html.
- Git shas (all on main = origin/main): `11b4dba` 2026-07-21 signup redesign Phase 1; `6fe9b38` 2026-07-21 viewer collection fix; `75e1ede` 2026-07-28 dashboard visual system (empty states); `6d2196c` 2026-07-31 Free runs Gemini (planConfig + _cost + _plans); `fc97dbc` 2026-07-31 domain carry; `feed1d5` 2026-07-31 cadence written for new clients; `e0d3350` 2026-07-31 dash/overflow/touch fixes; `4b67a8d` 2026-08-03 last commit touching brandgeo-dashboard/.
- SQL (7 read-only SELECTs, project duiyifepitvugyulobqm): funnel counts (auth.users 13, never_signed_in 1, profiles 11, viewers 10, users_without_profile 2, signup_attempts 5 spanning 2026-07-13 to 07-30); non-research roster with prompt/result/run counts; per-client activation timelines (ids 25, 26, 27, 52); collection_jobs for client 52 (runs 48 and 52, all jobs 'done', engines {gemini,claude}); ai_results by llm/status for self-serve clients (zero error rows; ai-fy chatgpt 07-23 then gemini 07-31); client_events type counts (onboarded 1, comp_grant 1, stripe_change 1, plan_change 1, signup 0); refresh_cadence distribution (manual 36, weekly 2, monthly 0).
