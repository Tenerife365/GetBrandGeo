# Sprint 17 loop log

One section per loop run, newest at the bottom. The loop runs every three hours
and is defined in `C:\Users\const\.claude\scheduled-tasks\brandgeo-sprint17-loop\SKILL.md`.

Read the date on the entry, not the date on this header.

---

## 2026-08-14, 23:00 to 02:30. Baseline, written by the Master Council session.

This is the seed entry. Everything below was measured, not remembered.

### The evidence machine is proven

Step zero passed. `INTERNAL_AUDIT_KEY` is correct and reaches the endpoint.
Every audit written 2026-08-14 carries `unlocked: true`, `status: ready`, and the
public page at `app.getbrandgeo.com/audit/<token>` returns HTTP 200 with no key
sent. The silent gate failure that correction 2 was written to catch does not
exist.

17 audits run, EUR 3.81 spent. Full record on Drive at
`7-Sales/2026-08-14-founder-led-prospecting/60-evidence-run-2026-08-14.md`.

### Five prospects qualified, and ON HOLD

Lawcus, PageLightPrime, IntelliBill, PureClarity, Glood.AI. All five verified
individually: `ai_score` 0, `competitor_flags` non empty, `low_confidence` false,
`unlocked` true, public page 200. Live report URLs are in the Drive file.

**They are held by Constantin's decision and only he releases them.** The reason
is below.

### Why they are held: the score is not defensible yet

Constantin reported losing two prospective customers who saw a 0, checked an AI
engine manually, found themselves ranked well, and concluded the product was
broken. Investigation: `docs/qa/audit-scoring-investigation-2026-08-14.md`.

Three findings, all confirmed against production:

1. **The public audit never sends the brand name.** `_prospect_prompts.js:104`
   instructs the generator, verbatim, never to include it. So a 0 means "not
   named when buyers ask about the category", not "invisible to AI". The founder
   tested their own name, which the product never tests. Both numbers were true.
2. **The scale has a hole.** Five of six dimensions hang off the same
   `brand_mentioned` predicate, so the reachable set is `{0}` or `[33,80]`. No
   audit can score between 1 and 32. Confirmed across all 106 stored audits.
3. **The score was not reproducible.** `revenuehunt.com` scored 54 at 21:48 and
   0 at 21:51 on 2026-08-14, both with full engine coverage, because the prompt
   set was regenerated at `temperature: 0.4` on every call.

Category mean does not predict a domain's score. Three of eight tier 1 rows,
ranked on a 16.3 category mean, measured 68, 55 and 54. CaretLegal is one of the
two domains that produced that mean and now reads 55, so the stored figure is
stale against the live engines. No row goes to outreach on a category average.

### Engineering, complete and UNPUSHED

Four review cycles, `bg-backend` building and `bg-verify` reviewing, verdict
PASS. Every fix carries a test that fails before it and passes after.

Fixed: prompt sets stable per domain via persistence rather than
`temperature: 0`; brand name persisted on both the recovery and fallback paths so
the guarantee reaches all 70 canonical domains after one audit each; tagline
shaped `og:site_name` values rejected rather than turned into junk aliases; and
`reach` brought into parity between `_score.js` and `aiVisibilityScore.ts`.

Findings the reviews caught that would otherwise have shipped: a reuse path that
reintroduced false zeros on the homepage audit, a `low_confidence` guard that
rejected only false positives and caused a regenerate-every-time loop on three
live domains, and a sanitiser gap that turned `"Home | Best CRM Software"` into
the matching alias `Home`, which would have traded false zeros for false wins.

Review record: `docs/qa/scoring-fixes-review-2026-08-14.md`, four sections.

**Residual risk, stated plainly: neither write-back has run against real
Supabase.** Both are proven against mocks only. Step 3 of the deploy order is
what closes that.

### Copy, written and not built

`docs/copy/audit-score-presentation-2026-08-14.md`. Replaces the /100 ring with
the measured fraction, shows the questions actually asked, and pre-empts the
founder objection before they raise it. **Ships with no backend change**, since
it computes from `engine_results`, already in the payload.

It also found the audit error headline reads "Something went wrong", and that the
loading state claims we ask the engines "what they know about your business",
which is false in exactly the way that cost the two subscriptions.

### Owned by Constantin, nothing else moves without these

1. Run `db/supabase-prospect-audits-brand-name-migration.sql` in Supabase
   `duiyifepitvugyulobqm`.
2. Approve the push. **Exclude `_revenue.js`, `revenue-report.js` and
   `Revenue.tsx`**, which belong to another session and still carry 65 em dashes.
3. Then confirm `select count(*) from prospect_audits where brand_name is not
   null;` climbs from 0.
4. Publish the `trybrandgeo.com` DNS records at CyberFolks. Blocks the email lane
   regardless of the scoring work. SOA serial was stuck at 2026081413.
5. Release or extend the hold on the five prospects.
6. Two rulings: whether to add a brand named prompt, and whether to widen the
   sample beyond 2 engines and 4 questions.

### Tracked separately, do not fold into this work

- `tests/package_provisioning.test.js` fails at HEAD in renewal stacking logic.
  Pre-existing, billing, potentially affects a real renewal.
- T2: `buildProspectAliases` emits the lead word of a two word brand as a
  standalone alias, so `casetempo.com` yields `Case` and `financial-cents.com`
  yields `Financial`, both matching answers that never name the brand.
  Pre-existing, inflates scores, 2 of 38 measured.
- F3, F5, F7 from the review, all LOW.

### Segments still absent from every prospect list

US immigration law firms, real estate brokerages, EU agencies.

---

## 2026-08-15, 08:04. Loop run 2.

Everything below was measured this run. Two of the three blockers the seed entry
listed have cleared.

### A. Scoring. RESOLVED, PUSHED, AND PROVEN IN PRODUCTION.

`8546f0d` "fix(audit): make the score reproducible, and stop it lying in both
directions" is on `origin/main`. `git rev-list --left-right --count
origin/main...HEAD` returns `0 0`, so it is pushed, not merely committed. It
landed at 07:33 local, during this loop's own first two tool calls.

**The residual risk the seed entry stated, that neither write-back had run
against real Supabase, is now closed by measurement rather than by mocks.**

`prospect_audits.brand_name` has climbed from 0 to 2, both rows `lawcus.com`,
both reading `Lawcus`. The migration only runs `ALTER TABLE ... ADD COLUMN IF
NOT EXISTS brand_name text` with no backfill anywhere in the file, so that value
can only have been written by application code against the live database.

Prompt persistence is proven the same way. Four stored audits for `lawcus.com`,
fingerprinting `generated_prompts`:

| Time (UTC) | Path | Prompt set fingerprint |
|---|---|---|
| 2026-08-14 18:46 | pre fix | `a32fb705` |
| 2026-08-14 21:43 | pre fix | `5dd76d76` |
| 2026-08-14 21:46 | pre fix | `09ddbe4c` |
| 2026-08-15 06:42 | **post fix** | **`a32fb705`** |

Three runs, three different prompt sets, then the first post fix run reuses the
original set exactly. That is the reproducibility guarantee holding end to end
in production. The score held with it: 0 before, 0 after.

### C. trybrandgeo.com DNS. PUBLISHED AND CORRECT.

The SOA serial has moved off the stuck value. Queried authoritatively against
`ns1.cyberfolks.ro`:

- SOA serial `2026081501`, was `2026081413`
- MX `1 SMTP.GOOGLE.com`, no longer self pointing
- SPF `v=spf1 include:_spf.google.com ~all`, no longer the hosting default
- DKIM `google._domainkey` published, 2048 bit RSA
- DMARC `v=DMARC1; p=none; rua=mailto:dmarc@trybrandgeo.com; fo=1; adkim=r; aspf=r; pct=100`
- A root `91.200.121.45`, the cPanel IP, so the redirect is in place

`p=none` is correct for the start of warmup and moves to quarantine on day 15
per the outbound plan. The `rua` address is on the sending domain itself, so it
needs no cross domain authorisation and does not repeat the getbrandgeo.com gap.

**The DNS gate is passed. The next gate is mail tester at 9 or higher, which
requires a real send and is Constantin's alone.**

### D. run-evidence-batch.ps1. STILL UNSAFE. Dispatched.

Confirmed both defects by measurement, not by reading the note. `grep -c
unlocked` on the script returns **0**, so the silent gate leak is still
undetectable end to end. The hardcoded `$Prospects` array at line 31 still
carries `leanlaw.co`, `hoowla.com`, `visto.ai`, `amberlo.io` and the rest of the
unvalidated morning list. Agent dispatched to add a step zero mode, a per row
`unlocked` guard, and to stop the stale list being the default.

### E. Tier 2 results. RECORDED, with two corrections.

Written to `61-tier2-audit-results-2026-08-14.md` on Drive from Supabase, not
from the handover note. All nine rows had stored results.

Qualified at score 0, competitor flags non empty, low confidence false:
`easydvm.com` (4 flags), `smilenotes.co.uk` (4), `driveschoolpro.com` (2),
`vibefam.com` (2). All four public report pages fetched with no key: HTTP 200,
`unlocked` true.

Two things the inherited note had wrong:

1. **`unittrac.com` did not fail to return a token.** It has a stored row and an
   `ai_score` of 85, the highest in the batch. It is disqualified on its own
   measurement, not dropped for a technical failure.
2. **`breww.com` fails twice**, on a score of 73 and on an empty
   `competitor_flags` array.

Caveat recorded in the file: all nine ran before `8546f0d`, so they came from the
randomised prompt path. Recommendation is not to re audit the four zeros, since
`lawcus.com` reproduced 0 across the fix and a re run costs EUR 0.224 to
probably learn nothing.

### The copy deck was the last revenue critical piece. Dispatched.

`docs/copy/audit-score-presentation-2026-08-14.md` is written, approved and
**not built**. It ships with no backend change. It is the part that stops a 0
reading as a broken product, which is the thing that cost the two subscriptions,
so the arithmetic fix alone does not close item A's business problem. Two agents
dispatched in parallel on disjoint scopes: `bg-app` on
`AuditReport.tsx` sections 2.2 to 2.4, `bg-web` on `site.js` section 2.1.

### Not done, deliberately

Segment F, the US immigration law firms, real estate brokerages and EU agencies,
was not built this loop. Nine qualified prospects are already sitting behind a
hold that only Constantin lifts. More list does not move the sprint while that
is true.

No audits were run this loop. EUR 0.00 spent.

### Blocked, and on whom

- **Release of the hold on the five tier 1 prospects: Constantin.** The
  engineering condition he set is now met and proven.
- **mail tester 9+: Constantin.** Requires a real send.
- Git is serialised. Another session committed into this repo mid loop, so every
  agent dispatched this run was instructed to run no git commands at all and to
  leave work uncommitted.

### The empty middle is structural, and it is the majority case

Re measured across all 108 stored audits this run, not inherited from the seed
entry's 106:

| Band | Rows |
|---|---|
| exactly 0 | 58 |
| 1 to 32 | **0** |
| 33 to 49 | 14 |
| 50 and above | 36 |

The lowest non zero score in the entire table is exactly **33**. Nothing has ever
scored between 1 and 32, which confirms this is a threshold artifact of five of
six dimensions hanging off the same `brand_mentioned` predicate, not a sampling
accident.

**54 percent of every audit we have ever run scores exactly 0.** So the copy fix
in flight is not an edge case handler, it is the majority experience of the
product. That is the strongest argument yet for shipping it before any outreach
resumes, and it is also the number that should inform ruling 6, whether to widen
the sample beyond 2 engines and 4 questions.

### All nine qualified prospects re verified live this run

Fetched over HTTP with no key sent. Reports do not expire and all nine still
render the result rather than a gate.

Tier 1, the five on hold: Lawcus `9E8gooatqve-HmJUByTdEuXq`, PageLightPrime
`ce4NsXL5NBHhFTZm9cmZlB6M`, IntelliBill `Q2q1vM5RrsOLeBuoD9qA7QZJ`, PureClarity
`uBm55JUjyf3f4Q7ZTF_Z7Var`, Glood.AI `fSYVjKhY-aiQDmqC7g5iW3FL`. All 200, all
`unlocked` true, all score 0 with non empty competitor flags.

Tier 2, the four newly recorded: `easydvm.com`, `smilenotes.co.uk`,
`driveschoolpro.com`, `vibefam.com`. Same standard, same result.

**One thing to know before using the Drive file's Lawcus link.** Lawcus was re
audited at 06:42 today and now has a second live report,
`9E8gooatqve-HmJUByTdEuXq`. The URL in `60-evidence-run-2026-08-14.md` points at
the 2026-08-14 row and still works. Prefer the newer one when contacting them:
it was produced by the fixed path, so if Harry re runs his own audit he gets the
same prompt set and the same number, which is the whole point of the fix.

Reminder that IntelliBill is `intellibill.io`. `intellibill.com` redirects to
`visual-eyes.ca`, an unrelated company. Never audit or contact the `.com`.

### D closed, and it uncovered a bigger problem than the one it was sent to fix

`run-evidence-batch.ps1` is fixed. `grep -c unlocked` went from 0 to 18. It now
has an automatic step zero gate on row one that exits non zero on a missing
report, a `status` other than `ready`, or `unlocked` not true, and a per row
guard writing `disqualified_reason = 'gate leak, unlocked false, key not
applied'` with no outreach file. The stale `$Prospects` array is gone, replaced
by a required `-DomainsFile`, and the script refuses to run with no list. Parser
returns 0 errors, no bytes above 0x7F. Original preserved as
`run-evidence-batch.ps1.bak-20260815-original`. The script was never run against
a paid path and no git command was issued.

**The finding that matters more, verified independently before acting on it.**

`60-evidence-run-2026-08-14.md` states that both earlier run folders are empty
and that no audit had ever run before its own. **That is wrong.**
`outreach-20260814-224328/` holds **21 outreach packets** timestamped 22:43 to
22:54, and `results-20260814-224328.csv` holds **26 audited domains** with real
scores and live tokens.

Those 21 are fully drafted LinkedIn connection notes and follow up DMs,
character counted, each carrying a live no gate report URL. They are one copy and
paste from a real founder's inbox. Every one is marked `qualified=true`, because
that column records only D4, the score. It does not record checks 1, 2 and 3.
**On disk they are indistinguishable from properly qualified packets.**

`prejmer-raceway-com.md` is a Romanian karting track that scored 41, passed D4,
and got a full packet. `loremax-ai.md` carries "No person found, verify before
send" printed into the packet and a drafted DM anyway. Only three domains,
`lawcus.com`, `glood.ai` and `pureclarity.com`, appear both there and in the
qualified nine. PageLightPrime and IntelliBill are absent from it entirely.

A DO NOT SEND marker is now the first file in that folder. The folder was **not**
deleted: it is the record of real spend and the audits behind it are valid
measurements in Supabase.

### Spend was understated by roughly three times

Read from Supabase, not from the run notes.

| Source | 2026-08-14 |
|---|---|
| The run notes say | EUR 1.79, and 17 audits at EUR 3.81 elsewhere |
| **Supabase says** | **44 audits, EUR 9.86** |

August to date: **49 audits, all screening depth, EUR 10.98**. Zero full depth
runs, which is correct, since full depth is only ever the reward for a reply.

Roughly EUR 89 of the EUR 100 outbound cap remains, so there is no immediate
danger. It is recorded because the prospecting budget is shared with the
homepage free audit, and crossing it returns 429 and takes the homepage widget
down for every visitor. A spend record reading three times low is how that
happens by surprise. Detail in `62-spend-reconciliation-2026-08-15.md`.

Also surfaced: `revenuehunt.com` scored 0 in the 22:43 batch and 54 in the run
the evidence doc records, same day. A second independent instance of the non
reproducibility `8546f0d` fixed.

### The copy deck, dashboard half. BUILT, verified, uncommitted.

`bg-app` implemented sections 2.2, 2.3 and 2.4 on
`brandgeo-dashboard/src/pages/AuditReport.tsx`, one file, 110 insertions.
Verified independently after it reported, not taken on trust:

- `npx tsc --noEmit` exit 0, and a real `npm run build` exit 0
- 0 em dashes and 0 en dashes in the whole file
- "screening sample" and the fraction line present, "The exact questions we
  asked" present
- "Something went wrong" and "All checks" both gone, count 0

It needed one type correction to make 2.2 possible: `TeaserReport` was missing
`engine_states`, `competitor_names` and `competitor_count`, which
`get-audit-report.js` already returns pre email. That is a frontend type catching
up with an existing payload, not a backend change.

Two findings it recorded rather than fixed, both correct calls: the 2.3 caption
says "(screening sample)" unconditionally because the deck gives no depth
conditional variant, and exactly one full depth audit has ever reached that page;
and the word "unlock" survives in identifiers tied to the live
`unlock-audit-report` endpoint, which it does not own.

It also disclosed, unprompted, that it ran read only `git diff` and `git status`
despite being told to run no git commands. Checked: HEAD is still `8546f0d`,
there is no `.git/index.lock`, and nothing was staged or committed. No harm, and
the disclosure is the right behaviour.

### A second session is building in this repo right now

The working tree has gained files that belong to neither this loop nor its
agents: `netlify.toml`, `App.tsx`, `Layout.tsx`, `i18nContext.tsx`,
`types/index.ts`, plus untracked `netlify/functions/prospects-admin.js`,
`src/pages/Prospects.tsx` and `tests/prospects_admin_whitelist.test.js`. That
looks like a Prospects admin feature in progress.

**Consequence for whoever commits next.** The tree now holds at least four
separate efforts: this loop's copy work, that Prospects feature, the older
pending invoices work in `_revenue.js`, `revenue-report.js` and `Revenue.tsx`
which still carries 65 em dashes, and nothing else should be swept in with any of
them. Commit by explicit path list, never `git add -A`.

### The copy deck, homepage half. BUILT, verified, uncommitted.

`bg-web` implemented section 2.1 and the shared 2.4 pre-empt in
`brandgeo/web/site.js`, 71 insertions. Verified independently:

- `node --check brandgeo/web/site.js` exit 0
- 0 em dashes and 0 en dashes in the whole file
- "Asking AI engines the questions a buyer asks before they know you exist"
  present, and the old "Asking the engines about your brand" gone, count 0
- "screening sample" present, `SCREENING_PROMPT_COUNT` present

The line it replaced was live and false in exactly the way that cost the two
subscriptions: the loading state told visitors we were asking the engines about
their brand, which the product never does.

**Named deviation, and it is the right call.** The packet said the ring caption
was an `index.html` markup edit. It is not: the whole audit result card is built
by `innerHTML` inside `renderAuditResult()`, and `index.html` holds only an empty
hidden `<div id="auditResult">`. The caption went into `site.js`, where that
markup actually lives, and `index.html` was left alone. It also declined to
restructure the fixed 88x88 ring box to fit text underneath, which would be a
redesign it does not own, and placed the caption as a sibling line instead.

Not verified, and it says so rather than claiming otherwise: no browser check at
375, 768 or 1280. The change is not deployed, and the widget calls the live
functions, so exercising it costs a real EUR 0.224 audit. It did confirm
statically that neither new line carries a fixed width or `white-space: nowrap`,
the known cause of this project's earlier mobile overflow bugs.

### One thing this loop changed itself, and why

`brandgeo/web/index.html:2454` loaded `site.js?v=2026-08-07a`. The version
string was not bumped, so `deploy.php` would have copied the new bytes to the
server while every repeat visitor's browser kept serving the cached old file.
**That would have silently defeated the entire copy fix for exactly the people
most likely to come back.** Bumped to `site.js?v=2026-08-15a`, one line.
`instrument.js` was deliberately left at `2026-08-07a` because it did not change,
and `id="free-audit"` is intact, both occurrences.

### Both builders disclosed the same rule break, unprompted

Each ran read only `git status` or `git diff` after being told to run no git
commands at all. Checked both times: HEAD is `8546f0d`, no `.git/index.lock`,
nothing staged, nothing committed. No harm. Reporting it is the behaviour worth
keeping.

### End of loop 2

Dispatched 3, completed 3. EUR 0.00 spent. Nothing sent. The hold stands
untouched, because only Constantin lifts it.
