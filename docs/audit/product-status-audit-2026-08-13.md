# BrandGEO Product Status Audit - 2026-08-13 (master synthesis)

Live 1 month 7 days (public since ~2026-07-06). Question asked: "we had some
interest in the first weeks, now it's very quiet - why?"

Method: five parallel read-only audit seats, each with its own evidence file.
Every claim in those files is tagged MEASURED (SQL, URL, file:line, CDP pixel
measurement, git sha) or INFERRED. This synthesis cites them; where seats
disagreed, the disagreement was re-verified and the resolution is recorded in
section 5.

| Seat | Pillar | File |
|---|---|---|
| Data (funnel truth) | all | `docs/audit/funnel-data-2026-08-13.md` |
| Landing page | 1, 2 | `docs/audit/landing-page-audit-2026-08-13.md` |
| Positioning and pricing | 1, 3 | `docs/strategy/positioning-pricing-audit-2026-08-13.md` |
| Activation and onboarding | 4 | `docs/audit/activation-audit-2026-08-13.md` |
| GTM channels | 5 | `docs/audit/gtm-channel-audit-2026-08-13.md` |

---

## 1. The diagnosis

**The product is quiet because the inputs stopped, not because the market said
no.** There was never enough demand flowing to test the offer: lifetime public
audits number 8 (the week-2 "spike" of 54 was an internal prospecting batch),
lifetime self-serve signups number roughly 5, and zero self-serve subscriptions
have ever closed. The early "interest" was the founder pushing by hand
(LinkedIn bursts, the Index #1 paper, content waves, the Aug 4 Product Hunt and
SaaSHub listings) and hand-onboarding clients; every real client was
founder-provisioned. All of those pushes stopped between Aug 2 and Aug 7, and
the silence followed mechanically. Meanwhile web measurement went mostly dark
on Aug 7 (Plausible removed), so what little traffic remains is invisible.

The causes stack in this order:

1. **No always-on channel has ever run** (Pillar 5). 2 of 10 launch directories
   live. Cold outbound at step zero: trybrandgeo.com was never registered
   (NXDOMAIN today) while its 738-line build-out doc has sat ready since Jul 31.
   Social posted exactly one day (Aug 3); 9 staged day-folders expired unposted.
   No X account exists. ~100 SEO pages are live but Google-invisible (IndexNow
   only; no Search Console submissions recorded) while brandgeo.co, a different
   company, absorbs brand searches.
2. **Measurement is dark, so nothing can be learned.** Plausible removed Aug 7;
   GA4 survives but consent-gated (only accepting visitors measured); the
   sprint scoreboard is TBD in every cell for all 13 elapsed days; no error
   monitor; no exit survey, interview, or churn record has ever existed.
3. **The front door is anonymous** (Pillars 1-2). Fast, accessible, honestly
   built, zero dead ends, one-field entry - and it never names who it is for,
   never quantifies the cost of the problem, and shows zero named customers,
   zero testimonials, zero product screenshots while all four competitors show
   proof. On a phone, the entire real-data hero card sits below the fold.
4. **The free taste withholds the painkiller** (Pillars 1, 3). The instant
   audit computes competitor names and per-engine presence, then hides them
   behind the email gate, showing only a score and a gap count; 6 of the last 7
   audits never unlocked. And nobody sees ChatGPT - the engine every buyer
   means by "AI" - on any surface below EUR 99.
5. **Nothing brings anyone back** (Pillar 4). The first session as shipped
   today is genuinely good (measured 5m21s signup-to-first-value), but every
   activation fix landed after the July traffic had passed. There is no
   lifecycle email of any kind, 36 of 38 clients still sit on manual refresh
   (the backfill never ran, so the weekly refresh paid tiers are sold on is not
   delivered), and scheduled refreshes force-delete prior rows, so the trend
   history that is the product's own upgrade argument never accumulates.
6. **Pricing is currently untestable and unfavourably positioned at entry**
   (Pillar 3). At this volume no conversion rate exists to diagnose. On paper,
   Radar EUR 29 loses to Otterly $29 (7 prompts / 2 engines / weekly vs 15 / 4
   incl. ChatGPT / daily) and Essentials EUR 99 loses to Peec EUR 85 (18
   prompts weekly vs 50 daily). Do not reprice first: the ladder arithmetic is
   sound, and repricing without traffic and without fixing the free taste
   changes nothing measurable.

---

## 2. The funnel, measured end to end (38 days)

| Stage | Number | Note |
|---|---|---|
| Visitors | unknown | Plausible removed Aug 7; GA4 consent-gated; founder-only sources listed in section 6 |
| Public instant audits | 8 | peak 3/week; 55 more were internal batches |
| Emails captured | 2 | 1 of 2 has a HubSpot sync error; HubSpot unconfigured |
| Self-serve signups | ~5 | of 13 auth users total; incl. the Slatehq competitor recon and 2 who died at /welcome |
| Customer workspaces | 7 | of 38 clients; 27 are own research, rest internal/test |
| Ran a collection themselves | 1 | Ai Fy, 2026-07-23; the other 14 customer-side runs were admin-triggered |
| Returned a second day | 0 | both second-day rows were admin-triggered |
| Organic checkout intents | 0 | all 12 terms acceptances match founder gate-testing (Jul 31 / Aug 2) |
| Self-serve subscriptions | 0 | the one subscription ever created was a founder test, canceled in 5 minutes |
| Cash collected, all time | EUR 1.00 | founder's own E2E test |
| Contracted revenue | EUR 3,500 | BpR invoice INV-35, hand-sold; UNPAID at last recorded check (Aug 2); current state only visible in the Stripe Dashboard (webhook does not handle invoice.paid) |
| Measured API cost | EUR 37.12 | against EUR 1.00 collected |

Dates that matter: last organic self-serve signup Jul 23; last signup of any
kind Aug 2; last social post Aug 3; last repo commit Aug 7; Plausible removed
Aug 7; zero customer sign-ins since Aug 2.

---

## 3. Pillar verdicts

### Pillar 1 - Positioning and value proposition: FAIL on audience, vitamin as merchandised

- No ICP is named anywhere in the homepage's visible copy (measured word
  counts: agency 0, marketer 0, SMB 0, CMO 0, B2B 0). The done-for-you SMB
  buyer that `GTM-STRATEGY.md` ruled PRIMARY on 2026-07-18 has its own live
  page (`get-found-online.html`) which the homepage links exactly 0 times.
- The hero promises measurement and speed, not outcomes: revenue, leads,
  traffic, ROI, lost, invisible all appear 0 times on the page.
- The painkiller (which competitors the engines named instead of you) is
  generated, stored, and withheld behind the email gate.
- Genuine differentiators exist (7 engines measured identically, citable DOI
  methodology, instant no-signup audit, done-for-you tier, EU/GDPR) but none
  appears above the fold as a differentiator; the fold sells a score, which
  every competitor also sells.

### Pillar 2 - Landing page: not broken, anonymous (scores: hook 3, path 4, credibility 2, AI-readiness 4)

- Passes the mechanical 3-second test at both widths; 644ms LCP; 87KB; zero
  dead ends across 75 links; 8 of 11 CTA states covered; reduced-motion
  correct. Signup friction is best-in-class: one field, no card.
- CRITICAL: zero named customers / testimonials / screenshots (3 images on the
  whole page: nav logo twice, a Fazier badge). CRITICAL: at 375px the entire
  proof card sits below the fold (first data leaf at 794.9px of an 812px fold).
- Two solid-violet primaries compete above the fold; the one field visitors
  must type into is the only control with its focus ring removed
  (`index.html:256`) and it is auto-focused by ~90 pages' CTAs; consent panel
  eats 22 percent of the mobile fold; contact-form fields measure 1.04:1
  against their panel.
- Articles contradict the homepage: bg-019/bg-026 promise "five AI engines" in
  their CTA sentence (homepage says seven) and send their nav CTA to
  `/#contact` (the 48-hour form) while newer articles send it to
  `/#free-audit`.

### Pillar 3 - Pricing: untestable at this volume; entry tiers lose published head-to-heads

- Nine choices in one pricing section (5 cards + mode switch to 2 more + a
  billing toggle + a second free offer). Radar is monthly-only against a
  global yearly toggle, unexplained on the card.
- Every tier is described in supply-side units (prompts, engines, pages); not
  one card states an outcome. The ruling's own rule ("a package sells a tier,
  not prompts") has not reached the cards.
- The ladder from free to EUR 99 never contains ChatGPT: audit = Gemini +
  Perplexity, Free = Gemini, Radar = Gemini + Claude. Putting ChatGPT into the
  screening audit costs ~EUR 0.43/audit (~EUR 13/month at current volume).
- Friction is correctly self-serve below Managed; the terms-gate modal on a
  EUR 29 purchase is a named tradeoff, not a defect. Launch scarcity is inert
  ("first 100" with "not time-limited" stated in the announcement).
- Market shape (first-party, fetched 2026-08-13): crowded $29-99 self-serve
  band (Otterly, Writesonic, Peec, Profound), thin $150-250 band, proof-heavy
  $250+ band (AthenaHQ, Scrunch). Only AthenaHQ has a real free tier, and it
  runs BrandGEO's exact free-audit hero play from a far stronger proof
  position.

### Pillar 4 - Activation: mechanically good now, but every fix arrived after the traffic, and there is no return loop

- Designed path measured: ~10 clicks, 1 typed field, 4-7 minutes to real first
  data; the one clean self-serve activation took 5m21s. Live bundle = repo
  (nothing newer than Aug 3 exists to deploy).
- Confirmed fixed and live: viewer collection gate (6fe9b38), Free=Gemini
  (6d2196c, in planConfig, _cost, and the served bundle), Google SSO enabled,
  honest "Not measured yet" empty states, /sentiment dead end.
- REFUTED: "every free signup errors since launch." The budget defect was real
  but no real free client ever carried enough prompts to trigger it; zero
  error rows exist for self-serve clients.
- The leaks: 2 of 13 auth users died at /welcome; enqueue blocks (budget/skip)
  are console-logged and invisible to the user; Free's manual cooldown is a
  30-day wall; no lifecycle email exists (not even "your results are ready");
  refresh_cadence backfill never ran (36 of 38 on manual, zero on monthly, so
  the free comeback loop has fired 0 times ever); scheduled refreshes
  force-delete history, proven live on the one weekly client (their Aug 2 rows
  are gone), guaranteeing no client ever accumulates the trend the upgrade
  pitch depends on; a free user's pre-ruling ChatGPT rows silently vanished
  from their dashboard when Free moved to Gemini.

### Pillar 5 - GTM: the engine was never turned on

- Channel matrix (externally verified today): Product Hunt LIVE but spent (3
  upvotes, launched Aug 4 with zero prep, 1 gallery image, unanswered
  comments); SaaSHub LIVE; Uneed died mid-submission (404); AlternativeTo, G2,
  Indie Hackers, Fazier, DevHunt never submitted despite ready-to-paste packs;
  LinkedIn company page unverifiable from here; GBP stale (advertising a
  retired engine); Threads live with 4 posts and 0 followers, silent since
  Aug 3; X account does not exist; cold outbound never started (domain never
  registered); affiliate never configured; paid not planned.
- Feedback loop: none. No survey, no interview, no churn record, no Sentry;
  captured leads trigger nothing (HubSpot unconfigured).
- The staged-but-idle inventory is the cheapest lever in this entire audit:
  13+ day-folders of social content built for 8 platforms, 8 directory packs
  written to paste, outbound instructions written line by line, 3 product
  images sitting in `marketing/Product Publish/` that the PH gallery needs.

---

## 4. What the audit refuted (stop believing these)

1. **"Growth PRO cannot be bought self-serve"** - STALE. `_terms_gate.js:141`
   lists it in `SELF_SERVE_CHECKOUT_PLANS`; seven live payment links exist.
   The CLAUDE.md backlog entry is outdated.
2. **"Radar is only announced on the news page"** - it is the second card on
   the homepage pricing section with its own launch-price flag.
3. **"Every free signup has been hitting billing errors since launch"** - the
   defect existed Jul 6-31 but no real customer ever triggered it; the fix is
   deployed.
4. **"The homepage scrolls sideways on mobile"** - fixed and holding (real
   scroll measured, scrollX stays 0 at 375).
5. **"Otterly 403s plain HTTP clients"** - returns 200 now; its pricing here is
   first-party.
6. **"The site has no analytics at all since Aug 7"** - mostly true but not
   quite: GA4 `G-9H6C2NSYPH` is live behind the consent gate, so
   consent-accepting visitors ARE measured. Plausible's removal broke the
   deliberate design in `ga4-init.js` whose comment assumes Plausible covers
   everyone cookielessly. Founder should check the GA4 property for data.
7. **"Checkout is DOWN" (S3 registry row)** - contradicted by the Aug 2
   end-to-end verification on the Spanish Stripe account and by the live terms
   gate today. The registry row is stale, but re-verify with one EUR 1 test
   before spending any effort driving traffic.

---

## 5. The plan

### A. This week - founder actions, no code (ordered)

1. **Confirm money and checkout.** Open the Stripe Dashboard: has INV-35
   (EUR 3,500, due Aug 4) been paid? If paid, run the provisioning runbook in
   `handoff-billing-2026-08-02.md`; if not, chase it - it is the only real
   revenue. Then run one EUR 1 live checkout to close the stale "checkout
   DOWN" registry row.
2. **Turn measurement back on.** Check GA4 property `G-9H6C2NSYPH` for data;
   decide: reactivate Plausible, or formally adopt GA4 + Search Console +
   cPanel logs + Supabase counters. If the lapsed Plausible dashboard still
   opens, screenshot the 5 views listed in the GTM report (Top Sources, weekly
   trend, Entry Pages, UTM breakdown, Goals) scoped Jul 1 - Aug 7.
3. **Register trybrandgeo.com (~EUR 12) and start outbound STEP 1-4** from
   `docs/growth/outbound-infra.md`. The 5-7 day warmup clock only starts at
   registration; every day of delay moves first sends a day out.
4. **Restart the social runway.** Post today's staged folder
   (`docs/growth/social/1-Pending/`), move it to `2-Posted/`, and re-date the
   9 expired folders (Aug 4-12, all evergreen) onto Aug 24-30. Minutes per day
   of pasting; the content is built.
5. **Directory sweep, one per day.** Create the AlternativeTo account today
   (its mandatory 7-day age clock), then G2 (3-5 day approval), Indie Hackers,
   LinkedIn company-page CTA button + Featured item, GBP photo/description fix
   (it is actively advertising a retired engine), redo Uneed, then Fazier.
   Add the 3 existing product images to the Product Hunt gallery and answer
   its comment thread.
6. **Google:** manually submit the 10 comparison pages + top 10 city pages via
   Search Console URL Inspection (~20 minutes; the decided manual path).

### B. Product build queue (small, high-leverage, in dependency order)

1. Backfill `refresh_cadence` for existing non-research clients (one UPDATE,
   research guard exists; NEEDS SIGN-OFF, turns on spend) and add a "your
   results are ready" email. This turns on the only comeback mechanism for the
   only users who exist, and makes the weekly-refresh promise on paid cards
   true.
2. Stop scheduled runs deleting history (snapshot-and-append or archive before
   delete). The trend IS the upgrade argument; today the pipeline deletes it
   weekly.
3. Surface enqueue block reasons in the UI (429s and skips are currently
   invisible; a blocked viewer sees a spinner that stops).
4. Seed the 5 free prompts and enqueue the first collection at provisioning
   (suggest-prompts already exists and is viewer-authorized). Time-to-value
   drops from ~5 minutes to ~60 seconds and the first dashboard render becomes
   a live filling scoreboard.
5. Move the painkiller in front of the email gate: show competitor names and
   per-engine presence unlocked; keep the fix list (top_gaps) behind the
   email. Needs a bg-architect contract ruling first, then bg-backend.
6. ChatGPT in the free screening audit (NEEDS SIGN-OFF: ~EUR 0.43/audit,
   ship behind a per-IP rate limit). If declined, name the audit's engines on
   the card instead of letting visitors assume ChatGPT.
7. Landing fixes (bg-design/bg-copy/bg-web): name the ICP in the eyebrow/h1
   area; get one proof token above the mobile fold; demote one of the two
   violet primaries; restore the focus ring on `#brandInput`
   (`index.html:256`); defer `ga4-init.js`; fix bg-019/bg-026 "five engines"
   and the `/#contact` nav CTA split.
8. Pricing surface (NEEDS SIGN-OFF): collapse the visible ladder to 3 cards
   (Free, one recommended, one step up; "compare all plans" link for the
   rest) and rewrite cards in buyer outcomes per decision 4's own rule.

### C. Explicitly not now

- Do NOT reprice Radar as a first move; arithmetic is sound and there is no
  volume to measure a change against.
- Do NOT invent proof: no logos, no testimonials, no customer counts exist
  truthfully today. The path to proof runs through BpR and the next handful of
  real clients; ask for the first testimonial when INV-35 is settled.
- Do NOT produce new content assets before the staged ones are fired.

---

## 6. Decisions owed (only Constantin can make these)

| # | Decision | Options | Blocks |
|---|---|---|---|
| 1 | Which motion owns the homepage? `GTM-STRATEGY.md` 4.2b ruled done-for-you SMB primary on Jul 18; the homepage sells self-serve and links the done-for-you page 0 times | A: self-serve owns it, give get-found-online.html its own channel. B: done-for-you owns it, fold names the SMB buyer, ladder moves to /pricing | Every positioning fix (B.7) |
| 2 | ChatGPT in the free screening audit at ~EUR 0.43/audit, rate-limited? | yes / no (then name engines on the card) | B.6 |
| 3 | Backfill refresh_cadence for the existing book (turns on real spend), or pull the "weekly refresh" claim off the cards until true? | backfill / pull claim | B.1 |
| 4 | Analytics stack going forward | reactivate Plausible / GA4 + consoles only | A.2, all future measurement |
| 5 | Collapse visible pricing to 3 cards? | yes / keep 5 | B.8 |

---

## 7. What we will not claim (guardrails for all future copy)

No customer counts, no "used by N brands", no logos (11 non-research rows,
zero self-serve subscriptions). No "cheapest" (Otterly wins). No "most engines
per euro" as a general claim (true vs Profound, false vs Peec). No engine-count
superlative (AthenaHQ publishes nine). No trial language (no trial mechanism
exists). No deadline urgency (the launch price is explicitly not
time-limited, by ruling).
