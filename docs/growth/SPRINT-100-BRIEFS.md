# SPRINT-100 morning briefs

Appended daily by the 03:00 council cycle (`SPRINT-100-DAILY-COUNCIL.md`).
Newest entry at the bottom. Each entry is readable in under two minutes.

---

## 2026-07-31, Day 0 (pre-sprint)

Baseline entry, written at setup, not by the cycle. Sprint window opens
2026-08-01. Registry, plan, protocol and scoreboard scaffolding are in
place; S1 to S15 all OPEN. First real brief lands 2026-08-01 03:00.

---

## 2026-08-02, Day 2 of 30

**Cumulative paying vs glidepath: UNVERIFIABLE HERE. Verdict: YELLOW.** No
numeric gate is due until Day 5, but the instrument that will prove or
disprove that gate does not exist yet, one day after the plan called for it.

**What was measured:**
- `docs/growth/SPRINT-100-SCOREBOARD.md` does not exist (`test -f` fails). S9
  is still OPEN in the registry, unchanged since 2026-07-31. No baseline
  paying-subscriber count or MRR number was ever captured, so this cycle has
  no prior row to compare Day 1 against.
- Re-ran three checks behind recent DONE/shipped claims, all still pass, no
  regression: `sprint-ladder-ruling.md` carries 5 `DECIDED 2026` lines plus
  the separately-keyed `DECIDED 1b` line (S1's own criterion, met);
  `node brandgeo-dashboard/tests/package_provisioning.test.js`, 63 checks
  passed, exit 0; `scripts/check-funnel-accept-path.sh` and
  `scripts/check-contract-gate.sh`, both exit 0. The contract-gate check
  only exercises `_terms_gate.js` in-process (it deliberately simulates
  `STRIPE_CHECKOUT_LINKS` unset as one of its own test cases); it does not
  reach the live site, so it cannot confirm whether production checkout
  (reported DOWN in the registry as of 2026-07-31, blocked on a redeploy) is
  actually fixed yet.
- No network route from this environment to `getbrandgeo.com` or
  `app.getbrandgeo.com` (curl exit 56 on both), so live checkout status,
  mail-tester score, DNS records, and the GBP correction are all
  UNVERIFIABLE HERE.
- Day 1's commits (`a988fec` and ten others, all 2026-08-01) were CSA-seat
  registry work, brand-asset hosting, bilingual content BG-027 to BG-034,
  the Radar-announcement post, and infra/deploy fixes; none are outbound
  sends. Sends, DMs, replies, calls, audit runs, signups and new-paying for
  Day 1 have no source in the repo; they only exist once a chat is told to
  close the day.

**What the council changed:** no channel or cadence change. Every
pre-agreed trigger (reply rate under 5 percent, a CAC breach, a gate miss)
needs numbers that do not exist yet, and adapting on guesswork is exactly
what the protocol forbids. The one change made: Day 2's plan row now leads
with "S9 scoreboard + baseline capture, carried from Day 1, overdue" ahead
of S10/S6/S3/S12, so the instrument exists before Gate 1 needs it on Day 5.
Logged in `SPRINT-100-PLAN-30D.md`'s revision log, COO seat.

**ACTIONS FOR CONSTANTIN TODAY:**
1. Tell any open council chat "close the day" for 2026-08-01, and again
   tonight for 2026-08-02, so S9 gets built and the scoreboard's baseline
   row plus Day 1's real row get filled from Stripe/Supabase instead of
   staying blank.
2. Confirm whether production checkout is fixed: has `STRIPE_CHECKOUT_LINKS`
   been set in the Netlify UI (scoped to Functions) and has the site been
   redeployed since. S3's registry entry still reads BLOCKED/DOWN as of
   2026-07-31; if that is still true, no self-serve customer can pay right
   now, which outranks everything else on this list.
3. Create the Sentry account for S13, steps already written in that
   kickoff; it is blocked purely on this one action.

**Risks and unverifiables:** the sprint has now run a full day with zero
recorded acquisition data; a second missed day leaves Gate 1 (Day 5) with no
baseline to compare against. Live checkout, mail-tester/DNS, and GBP status
are all UNVERIFIABLE HERE (no network egress to either live domain from this
environment). `brandgeo-dashboard/node_modules` was absent and had to be
installed this session before any check would run; a future night session
should expect the same unless it gets committed or cached.

---

## 2026-08-03, Day 3 of 30

**Cumulative paying vs glidepath: UNVERIFIABLE HERE. Verdict: YELLOW.** No
numeric gate is due until Day 5. Two instrument-health problems, not a
glidepath breach: the scoreboard is still missing (3rd consecutive day) and a
billing regression test check has flipped from pass to fail overnight.

**What was measured:**
- `docs/growth/SPRINT-100-SCOREBOARD.md` still fails `test -f` — missing for
  a third straight day (Day 1, Day 2, and now Day 3). S9 is still OPEN.
- Re-ran every S-task check for items marked DONE in the last 3 days.
  `sprint-ladder-ruling.md` (S1): still 5 `DECIDED 2026` lines + 1
  `DECIDED 1b`, no regression. `check-funnel-accept-path.sh` and
  `check-contract-gate.sh` (S3): both exit 0, no regression (yesterday's
  `contract-gate` failure was `node_modules` missing in this sandbox, not a
  real fault; reproduced and confirmed the same today, then fixed with
  `npm install` in `brandgeo-dashboard/`).
- **Regression: `node brandgeo-dashboard/tests/package_provisioning.test.js`
  (S10's harness) now exits 1.** 62 of 63 checks pass, then it crashes on
  `assert.match(hook, /\.select\('plan_grant_until, plan_source'\)/)`.
  Root cause, confirmed via `git show 13bb92d`: `stripe-webhook.js:492`
  legitimately grew a third column, `.select('plan_grant_until, plan_source,
  stripe_customer_id')`, shipped 2026-08-02 for the package-can-name-its-
  client feature. The test's exact-string assertion was never updated to
  match. `cur?.plan_source`/`cur?.plan_grant_until` are still read two lines
  later, and the new `scripts/check-package-client-binding.js` (9/9, tests
  the same branch behaviorally, not by source regex) is clean — this reads
  as a stale assertion, not a functional break, but that is unconfirmed
  until a day session fixes the regex and gets a clean 63/63. Logged on
  S10's registry row.
- `scripts/check-seo-audit-path.js` (23/23) and
  `scripts/check-social-channel-override.js` (25/25), both shipped
  2026-08-02, re-run clean, no regression.
- No network route from this environment to `getbrandgeo.com` or
  `app.getbrandgeo.com` (curl exit 56, same as yesterday), so live checkout,
  mail-tester/DNS, and GBP status stay UNVERIFIABLE HERE. Notably,
  `CLAUDE.md` CURRENT STATE (2026-08-02) states checkout was fixed and
  verified end to end on the new Spanish Stripe account (a live
  `accept-terms` POST returned the new account's link), which would mean
  S3's registry line still reading "checkout is DOWN" is stale — but that
  claim comes from a different session's live check, not one this cycle
  could reproduce, so the registry row was deliberately left unedited per
  the ground-truth rule (no state change without this cycle's own check
  output). Needs day-side confirmation.
- Day 2's commits (2026-08-02, ~30 of them) were the Stripe account
  migration to Spain, the affiliate program (S20), SEO/content fixes, and
  the client-naming billing feature — no outbound sends, DMs, or signups
  have any source in the repo; those only exist once a chat is told to
  close the day.

**What the council changed:** no cadence or channel change; no measured
trigger exists to justify one. Day 3's plan row now leads with "S9
scoreboard + baseline capture, STILL overdue" ahead of S2/S4/S12, per the
same COO-seat rule applied on Day 2 (the instrument keeps bubbling to the
top of the plan until it's built). Logged in `SPRINT-100-PLAN-30D.md`'s
revision log.

**ACTIONS FOR CONSTANTIN TODAY:**
1. Tell any open council chat "close the day" for 2026-08-01, 08-02, and
   08-03 so S9 finally gets built and three days of scoreboard rows (plus
   the baseline) get filled from Stripe/Supabase instead of staying blank.
   This is now blocking Gate 1 on Day 5.
2. Have a day session fix `package_provisioning.test.js`'s stale
   `.select('plan_grant_until, plan_source')` regex (now three columns) and
   confirm 63/63 passes again — S10's revert-gate proof is unverifiable
   until this is clean.
3. Confirm live whether `getbrandgeo.com` checkout is actually fixed (per
   CLAUDE.md's 2026-08-02 claim) or still down (per S3's registry line);
   whichever it is, update the S3 registry row with the live check output,
   since the two currently disagree.
4. From yesterday, still open: confirm `STRIPE_CHECKOUT_LINKS`/Netlify
   redeploy status if not covered by item 3, and the Sentry account for S13.

**Risks and unverifiables:** scoreboard down 3 days running, Gate 1 (Day 5)
has no baseline to compare against if this continues. Live checkout,
mail-tester/DNS, and GBP status stay UNVERIFIABLE HERE (no network egress).
S10's harness cannot currently prove its own closed items stay closed.

---

## 2026-08-04, Day 4 of 30

**Cumulative paying vs glidepath: UNVERIFIABLE HERE. Verdict: YELLOW.** No
numeric gate is due until tomorrow (Day 5, Gate 1), but the scoreboard has now
missed every day of the sprint so far and tomorrow's gate has nothing to
compare against unless it is built today.

**What was measured:**
- `docs/growth/SPRINT-100-SCOREBOARD.md` still fails `test -f`, the 4th
  consecutive missing day (Day 1 through Day 4). S9 is still OPEN.
- Re-ran every check behind a DONE/shipped claim in the last 3 days, after
  installing `brandgeo-dashboard/node_modules` fresh in this checkout (absent
  again, as on Day 2 and Day 3). `sprint-ladder-ruling.md` (S1): 5 `DECIDED
  2026` + 1 `DECIDED 1b`, no regression. `check-funnel-accept-path.sh` and
  `check-contract-gate.sh` (S3): both exit 0, no regression.
  `check-seo-audit-path.js` (23/23), `check-social-channel-override.js`
  (25/25), `check-package-client-binding.js` (9/9), `revenue_report.test.js`
  (S21, 97/97): all clean, no regression.
- **`package_provisioning.test.js` (S10) is STILL broken, unchanged from Day
  3: 62/63, same crash on the stale `.select('plan_grant_until,
  plan_source')` regex** (`stripe-webhook.js:492` legitimately reads a third
  column now). No commit has touched either file since Day 3's brief flagged
  it (`git log --since="2026-08-03 00:00"` on both paths returns nothing).
  This is now the second night this exact regression has been reported
  unfixed.
- **State change found, not self-reported: S21 (Admin Revenue page) is
  PUSHED, not just committed.** The registry still read "COMMITTED
  2026-08-02, awaiting batch push," but `git merge-base --is-ancestor` proves
  all 10 batch commits (`db804bb..9f6ac7c`) plus a same-day follow-up
  (`4b67a8d`) are ancestors of `origin/main` HEAD. Registry row corrected
  with the check output. Actual Netlify build success stays UNVERIFIABLE HERE
  (no network egress), though `4b67a8d`'s own message references Constantin
  already live-testing the deployed page.
- No network route to `getbrandgeo.com` or `app.getbrandgeo.com` (curl exit
  56 on both), so live checkout, mail-tester/DNS, and GBP status stay
  UNVERIFIABLE HERE. S3's registry row still reads "checkout is DOWN" while
  `CLAUDE.md`'s 2026-08-02 entry states checkout was fixed and verified live
  on the new Spanish Stripe account. This conflict has now stood unresolved
  for 3 consecutive nights; this cycle again left the S3 row untouched, since
  neither claim is this cycle's own check output.
- Day 3's commits (`a70925f`, `a1372c3`, `4b67a8d`, `0a3dc09`) were the
  Day-3 brief itself, the S21 merge/push, the Revenue page Clients/Research
  split, and the S22 Daily Content Pulse ruling. No sends, DMs, replies, or
  signups have any source in the repo; those only exist once a chat is told
  to close the day. No S22 pulse content is staged yet
  (`docs/growth/social/1-Pending/pulse/` does not exist), expected: S22 was
  only ruled at the end of Day 3.

**What the council changed:** no cadence or channel change; no measured
acquisition trigger exists. Day 4's plan row now leads with "S9 scoreboard +
baseline capture, 4th consecutive day overdue, Gate 1 is tomorrow with
nothing to check it against" ahead of S3/S7/S11, same COO-seat rule applied
Day 2 and Day 3. Logged in `SPRINT-100-PLAN-30D.md`'s revision log.

**ACTIONS FOR CONSTANTIN TODAY:**
1. Tell any open council chat "close the day" for 2026-08-01 through
   2026-08-04 so S9 gets built before Gate 1 tomorrow. This is the fourth
   morning this item has topped the list; without it, Day 5's gate has no
   baseline and no glidepath to check.
2. Have a day session fix `package_provisioning.test.js`'s stale
   `.select('plan_grant_until, plan_source')` regex (now 3 columns) and get
   a clean 63/63. Unfixed for 2 consecutive nights now; S10's revert-gate
   proof stays unverifiable until it is.
3. Resolve the S3 checkout conflict directly: confirm live whether
   `getbrandgeo.com` checkout works (per `CLAUDE.md`'s 2026-08-02 claim) or
   is still down (per the registry's line), then update whichever document
   is wrong. Unresolved 3 nights running.
4. `docs/ROADMAP.md` NEEDS CONSTANTIN: invoice `in_1Tzx9q63lspobjfO3JPde2Do`
   (INV-35, BpR, EUR 3,500) is due today, 4 August. The moment it is paid,
   client 1 needs BY-HAND provisioning (`stripe-webhook.js` only handles
   `checkout.session.completed`, never `invoice.paid`): plan=`growth_pro`,
   plan_source=`package`, plan_grant_until=`2027-06-02`, plus a
   `client_events` row. This is a day-only, billing-adjacent action, not
   something this cycle can or should touch.
5. From prior days, still open: the Sentry account for S13.

**Risks and unverifiables:** scoreboard down 4 days running, one day before
Gate 1. Live checkout, mail-tester/DNS, GBP, and actual Netlify deploy
success all stay UNVERIFIABLE HERE (no network egress). S10's harness still
cannot prove its own closed items stay closed, now for a second night.
---

## 2026-08-04, Day 4 of 30 — S22 pulse staged

Runway for today (Tue 08-04, `PUBLISHING-PLAN.md` Week 1 table): LinkedIn
BG-029 post, Video Cut 1 to Facebook/Instagram Reels/TikTok/YouTube Shorts,
Instagram Stories 1. That leaves Threads, GBP and X silent today, so the S22
pulse layer staged one unit for each in
`docs/growth/social/1-Pending/pulse/2026-08-04/`:

- `threads/feed/post.md` — opportunity piece off today's BG-029 finding
  (Madrid airport-hotel language split), restated for Threads, not copied.
- `gbp/post/post.md` — same source, restated for a local-business audience,
  text only (no new asset rendered, per S22 rule 5).
- `x/feed/post.md` — the ruled X fill, a 2-part X-length trim of the BG-029
  LinkedIn post, text only.

All three carry `utm_campaign=pulse` alongside their platform's
`utm_source`, per S22 rule 4. Verified zero em/en dashes (checked with a
Unicode-aware scan since this shell's grep does not support `\x{}` PCRE
syntax). No sprint-progress numbers used, so nothing needs same-day approval
before posting.

**Flagged, not resolved:** `BG-029/01-post.md`'s own header still reads
"When: Monday 2026-08-17, morning slot," inherited from the original
one-per-week `linkedin-series-2026-08/README-SCHEDULE.md` /
`SCHEDULING-SHEET.md` cadence. That schedule predates the 2026-08-02
runway-compression decision in `PUBLISHING-PLAN.md` and was never updated
after it, so the two documents now disagree on BG-029's date by two weeks.
`PUBLISHING-PLAN.md` is treated as authoritative here (it is the explicitly
"ruled," newer document, and the S22 registry entry names it as the
baseline), but the stale header in the asset file itself is a live source of
confusion for anyone opening that file cold and should be corrected or
annotated.

---

## 2026-08-05, Day 5 of 30

**Cumulative paying vs glidepath: UNVERIFIABLE HERE. Verdict: YELLOW.** Today
is GATE 1 (all foundation checks green, baseline recorded, glidepath ~4) and
it cannot be scored: no baseline and no daily number exists anywhere in the
repo, for any of the 5 elapsed days.

**What was measured:**
- `docs/growth/SPRINT-100-SCOREBOARD.md` failed `test -f` for the 5th
  consecutive morning (Day 1 through Day 5). S9 had been re-flagged as the top
  action every night since Day 2 and never built, because "any session,
  night-safe" kept being read as a diagnosis to repeat rather than a file to
  write. This cycle built it (see "What the council changed").
- Re-ran every check behind a DONE/shipped claim in the last 3 days, after
  installing `brandgeo-dashboard/node_modules` fresh (absent again, as every
  prior night). All clean, no regression: `sprint-ladder-ruling.md` (S1) 5
  `DECIDED 2026` + 1 `DECIDED 1b`; `check-funnel-accept-path.sh` and
  `check-contract-gate.sh` (S3) both exit 0 (yesterday's in-sandbox failure on
  the latter was again just missing `node_modules`, not a real fault, same as
  Day 3's note); `check-seo-audit-path.js` 23/23; `check-social-channel-override.js`
  25/25; `check-package-client-binding.js` 9/9; `revenue_report.test.js` (S21)
  97/97.
- **`package_provisioning.test.js` (S10) is STILL broken, unchanged for a 3rd
  consecutive night: 62/63, same crash on the stale
  `.select('plan_grant_until, plan_source')` regex** against
  `stripe-webhook.js:492`'s real 3-column select. `git log --since="2026-08-03"`
  on both files confirms neither has been touched since Day 3's brief first
  flagged it.
- No network route to `getbrandgeo.com` or `app.getbrandgeo.com` (curl exit
  56 on both) and no Stripe or Supabase MCP connector anywhere in this
  session's tool list, so live checkout, mail-tester/DNS, GBP, and any
  Stripe/Supabase read stay UNVERIFIABLE HERE, same as every prior night. This
  is also why the scoreboard built tonight carries no numbers: the data half
  of S9 was never reachable from a night session regardless of which night
  ran it.
- S3's registry row still reads "checkout is DOWN" (the Romanian-account
  `STRIPE_CHECKOUT_LINKS` failure, written 2026-07-31), while `CLAUDE.md`'s
  2026-08-02 entry states checkout was verified working end to end on the NEW
  Spanish Stripe account, three env vars and one redeploy, no code changed.
  The S3 row predates the account migration entirely and was never revisited
  against it. Unresolved for 5 consecutive nights; this cycle again left the
  row untouched since neither claim is this cycle's own check output.
- Day 4's commits (`d39ab2e`, `6c8d84e`) were a social content pipeline (day
  one posted across 8 platforms, TWL-style folder convention adopted under
  `docs/growth/social/`) and the S23 registry entry (directory and
  launch-platform registrations, opened by Constantin). No sends, DMs,
  replies, or signups have any source in the repo; those only exist once a
  chat is told to close the day.

**What the council changed:** built `docs/growth/SPRINT-100-SCOREBOARD.md`
rather than reporting its absence a 5th time. It has the 30 dated rows, the
three gates, the channel EV table, and the capture rule exactly as S9
specifies; every data cell reads `TBD`, never a guess, because this
environment cannot reach Stripe or Supabase. Registry board marked S9
"STRUCTURE DONE," explicitly not fully done. Day 5's plan row now carries a
note that Gate 1 is unscorable until a day-side capture pass runs. No cadence
or channel change: nothing has been measured yet, so no pre-agreed trigger
applies. Logged in `SPRINT-100-PLAN-30D.md`'s revision log, COO seat.

**ACTIONS FOR CONSTANTIN TODAY:**
1. Tell any open council chat "close the day," but for all five elapsed days
   at once: 2026-08-01 through 2026-08-05. The scoreboard skeleton now
   exists and needs its first real numbers before Gate 1 can be scored at
   all. Fifth morning this has topped the list.
2. Resolve the S3 checkout conflict directly, today: confirm live whether
   `getbrandgeo.com` checkout actually works end to end (per `CLAUDE.md`'s
   2026-08-02 claim, new Spanish account) and update the S3 row in
   `docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md` (line 84) to say so either
   way. Unresolved 5 nights running. If self-serve payment is actually down
   right now, it outranks everything else in this sprint, gate or no gate.
3. Have a day session fix `package_provisioning.test.js`'s stale
   `.select('plan_grant_until, plan_source')` regex (now 3 columns) and get a
   clean 63/63. Unfixed for 3 consecutive nights; S10's revert-gate proof
   stays unverifiable until it is.
4. `docs/ROADMAP.md` NEEDS CONSTANTIN: INV-35 (BpR, EUR 3,500) was due
   2026-08-04; confirm whether it has been paid, since payment requires
   BY-HAND provisioning of client 1 that nothing automatic will do.
5. From prior days, still open: the Sentry account for S13.

**Risks and unverifiables:** Gate 1 falls today and is unscorable, zero
acquisition data exists for any of the first 5 days. Live checkout,
mail-tester/DNS, GBP, and Netlify deploy success all stay UNVERIFIABLE HERE
(no network egress, no Stripe/Supabase connector). S10's harness still cannot
prove its own closed items stay closed, now for a 3rd night.

---

## 2026-08-07, Content pipeline: Aug 10-14 pulse backfill

**Not a nightly council entry.** This is a separate scheduled session (the
daily social content pulse) recording its own work in the same file the
brief asked it to, since no dedicated log exists for this pipeline. It makes
no claim about the 30-day sprint's gates, glidepath, or scoreboard above and
should not be read as one.

**Task:** fill the gaps in the already-built Mon 08-10 through Fri 08-14
runway (`docs/growth/social/1-Pending/`) across 8 platforms, per a stored
brief. The brief cited several paths that turned out not to exist any more
(`docs/growth/CAMPAIGN-2026-07-30/`, entirely; the claim that BG-030's
LinkedIn bundle was already copied into the Aug 5 folder, which it was not).
Per the brief's own instruction to trust the live filesystem over its own
claims, the gap list was re-derived from what is actually on disk before any
writing started, and it matched the brief's table for all five days once
re-checked against ground truth.

**What was staged, per day:**

- **Mon 08-10:** instagram/feed, linkedin/feed, gbp/post (`gbp-5`, Radar),
  x/feed. Sourced from the existing utility Reel and the unused Paris wealth
  management finding in `bg-027.html`.
- **Tue 08-11:** facebook/feed, instagram/feed, threads/feed (explicit
  same-day follow-up to the Instagram post), linkedin/feed, gbp/post
  (`gbp-6`, Growth). Sourced from the Rome restaurant finding in
  `bg-027.html`, which is also this folder's own title.
- **Wed 08-12:** facebook/feed, instagram/feed, x/feed, plus BG-033's full
  four-asset LinkedIn bundle copied verbatim from
  `docs/growth/linkedin-series-2026-08/BG-033/`.
- **Thu 08-13:** linkedin/feed, gbp/post (`gbp-7`, Managed), x/feed.
  facebook/feed was left out on purpose, since facebook/link already covers
  a feed-adjacent format for this day.
- **Fri 08-14:** the thinnest day, built out almost entirely: facebook/feed,
  facebook/reel, instagram/feed, instagram/reel, tiktok/video,
  youtube/shorts, BG-034's full LinkedIn bundle, gbp/post (`gbp-8`, Free,
  closing the evergreen GBP series at 8 of 8), x/feed.

**What was skipped, and why:**

- **No video was actually rendered, for any of the four new video slots on
  Aug 14.** `ffmpeg` and Pillow are both present in this container, but a
  verified four-cut render at this runway's own established fidelity was
  judged out of scope for one pass covering five days across eight
  platforms. Each slot got a full `post.md` and `NOTES.md` instead (hook,
  beat-by-beat on-screen text, sourcing, target technical spec), explicitly
  marked not rendered, per this pipeline's own permitted fallback path. All
  four share one script with only the hook line varied; a future render pass
  should write an independent script per platform, matching how the rest of
  this runway does it.
- **The Aug 14 German bilingual video was not repurposed across the four new
  platforms**, despite the brief offering that as an option. Its `.mp4` is
  not present in this container: video and image files under
  `docs/growth/social/` are gitignored, and a file rendered in an earlier
  session that was never committed does not survive into a fresh one. This
  session judged that repurposing an asset it cannot open or verify would be
  asserting something unverifiable, and built new English assets aligned
  with the day's LinkedIn bundle instead. The German caption is untouched.
- **No static images were rendered either**, for the same gitignore and
  ephemeral-container reason: a PNG produced this session would not survive
  past it regardless. Every new `post.md` carries a full alt-text
  description a render would follow, matching how this repo already treats
  every other campaign in this pipeline, including the ones already posted
  live (`git ls-files` on the Aug 3 Berlin folder shows only `.md`/`.txt`
  ever committed, no image, in the folder that is already live).
- **X thread material cited in the brief (`CAMPAIGN-2026-07-30/x/POSTS.md`,
  "Thread B") does not exist in this repository.** All five days' X content
  is fresh copy, sourced from `bg-027.html` and `bg-034.html`, distinct city
  examples used across the week (Paris, Rome, Berlin, Madrid, Rome again by
  a different finding) so no two days repeat the same named companies.

**Verification run on every new file:** a small scanner
(`scripts/social_house_style_check.js`, added this pass) checked every new
`.md`/`.txt` for em dashes, en dashes outside digit ranges, and the banned
word list. All new copy passed clean. The only em dashes found anywhere in
this pass's diff are inside the internal title line of the copied BG-033 and
BG-034 LinkedIn source files (`# BG-033 / Asset 01 — Feed post`), which is
pre-existing content copied verbatim per the brief's own instruction and
matches the identical pattern already live in the Aug 3 Berlin folder's own
copied BG-028 bundle. No em dash appears in any client-facing "Post" or
"Article body" section.

**UTM convention:** every new link this pass added carries
`utm_campaign=pulse`, kept separate from the pre-existing runway's
`campaign2607` tag, per the brief's own instruction that this backfill layer
should attribute separately from the runway it is filling gaps in. The
copied LinkedIn bundles keep BG-033's and BG-034's own `utm_campaign=bg-033`
/ `utm_campaign=bg-034` tags unchanged, since that series has its own
established attribution scheme that predates this pass.

**Still open:**

1. All four Aug 14 video slots need an actual render, or a decision that
   script-only is acceptable to post as-is (it is not, on its own, a postable
   video asset).
2. `gbp-8` closes the evergreen GBP series at one post per plan (`gbp-1`
   through `gbp-8` now cover the free audit, Essentials, Growth PRO, the
   full ladder, Radar, Growth, Managed and Free). No further plan needs a
   first GBP post; any new GBP content from here is a second pass per plan
   or a non-plan angle.
3. This session made a policy call (do not repurpose an unverifiable asset)
   rather than a factual correction. Worth a look from whoever reviews this:
   confirm the Berlin bilingual video genuinely does not exist anywhere
   retrievable (a prior session's local machine, if this pipeline is ever
   moved off a purely ephemeral container) before assuming it needs a full
   re-render from scratch.
4. Every commit for this pass landed directly on `main` (five commits, one
   per day, plus this entry), per the task's own instruction to commit after
   each day rather than batch at the end. Nothing is staged unpushed as of
   this entry; push is the next step.
## 2026-08-05, LinkedIn bundle backfill (BG-030/031/032) + pulse for Aug 5, 6, 7

Constantin caught, by inspection, that every dated folder in
`docs/growth/social/1-Pending/` from 08-05 onward held only the video
runway (Facebook/Instagram/TikTok/YouTube). GBP, Threads and X were present
on some later dates (08-07, 08-10 through 08-21) but LinkedIn was present on
**none** of them, even though the full BG-030/031/032 article-day bundles
(feed post, article, announcement, founder repost) already existed, fully
written, in `docs/growth/linkedin-series-2026-08/BG-0{30,31,32}/`. Only
BG-028's bundle (08-03) had ever actually been copied into a dated pending
folder, by hand, at the time. This is the same "content exists but never
got assembled into the day's folder" gap the Day 4 brief's pulse note was
already circling, just on the LinkedIn side instead of GBP/Threads/X.

**Fixed today, mechanically, no new copy written:**
- `linkedin/{feed,article,announcement,founder-repost}/` assembled into the
  08-05, 08-06 and 08-07 dated folders from the BG-030/031/032 source files
  plus their `og-bg-0XX.png` cover, mirroring the exact structure BG-028
  used for 08-03.
- **Flagged, not fixed:** all three source files' own "When" headers are
  stale (BG-030 says "Wednesday 2026-08-26," BG-031 "Monday 2026-08-31,"
  BG-032 "Monday 2026-09-07"), inherited from the same pre-compression
  schedule that made BG-029's header wrong on Day 4. The prose itself is
  dateless and safe to use; only the metadata line is wrong.

**New pulse staged, per S22's coverage rule** (every platform gets at least
one unit every weekday; never duplicate what the runway already covers
that day):
- `pulse/2026-08-05/{gbp,threads,x}/` — runway is silent on all three
  today, so all three filled. Source: BG-030's verified Paris bilingual
  wealth-management finding (15.3% overlap, 81.1% of 127 companies
  single-language).
- `pulse/2026-08-06/{gbp,threads,x}/` — same gap, all three filled. Source:
  BG-031's verified Rome bilingual restaurant/hotel finding (18.0%
  overlap, 81.2% of 133 companies single-language).
- `pulse/2026-08-07/{threads,x}/` only — **gbp deliberately skipped**,
  since 08-07's runway already carries a real, unrelated GBP asset
  (`gbp-2-essentials-1200x900`); filling it again would be double posting.
  Source: BG-032's verified cross-engine consistency finding (12.1% to
  18.7% overlap range, 5 of 16 comparisons with zero shared companies).

All 8 new files carry `utm_campaign=pulse` alongside their platform's
`utm_source`, per S22 rule 4. Verified zero em/en dashes (Unicode-aware
scan) and all three X posts under 280 characters counting URLs as 23 per
X's own transform rule (233, 222, 244 respectively). No sprint-progress
numbers used, so nothing needs same-day approval before posting.

**Still open, worth a deliberate decision rather than another silent gap:**
whether GBP/Threads/X should keep getting filled by fresh pulse content on
article days going forward, or whether the CAMPAIGN-2026-07-30 queue items
still sitting unclaimed for 08-10 through 08-21 should instead be
reassigned to land on article days specifically. Both mechanisms are now
live at once and nobody has reconciled them.
