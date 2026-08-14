# Funnel defect briefs: the painkiller unlock, the anonymous front door, the pricing surface, the return loop

Seat: `gtm-conversion`. Written 2026-08-14, Sprint 17 Day 2 (Day 1 = 2026-08-13,
Day 17 = 2026-08-29). This is the Day 1 to 3 deliverable named in
`docs/growth/sprint17/PLAN-2026-08-13.md` section 3, which was never produced
because the prior session ran out of subscription budget.

Constitution: `docs/growth/GTM-TEAM.md`. Evidence discipline per its section 4:
every claim below is tagged MEASURED (file:line, SQL, URL, date) or INFERRED. No
number here is imported from an industry benchmark, and no uplift figure is
asserted, because at 8 lifetime public audits no effect size on this funnel is
measurable. Where a change is argued, it is argued from mechanism and the
argument is labelled INFERRED.

**What this file is:** four briefs, each with a measured defect, a fixed state,
a smallest-shippable cut, an owner, externally checkable acceptance criteria,
and the rollback. **What this file is not:** it is not a handoff packet. Per the
task scope this run produced exactly one file, so section 6 below carries four
packet-ready route blocks in `.claude/handoffs/_TEMPLATE.md` shape with the id
field left unallocated. Packet ids are allocated when the packet is written to
disk, never reserved inside an artifact (AGENT-OS, and the `006` collision that
rule exists to prevent). No repo source file was edited by this run. No git
command was run. No collection was triggered.

---

## 1. Ranking, and the one to ship first

| # | Defect | Leverage | Blocked on a section 6 decision? | Owner | Deploy pipeline |
|---|---|---|---|---|---|
| 1 | The free taste withholds the painkiller | Highest | No, for the shippable cut | `bg-architect` then `bg-backend`, then `bg-web` | Netlify, then cPanel |
| 2 | The front door names nobody | High | Partly. Full fix waits on decision 1; the narrow cut does not | `bg-copy` then `bg-web` | cPanel only |
| 3 | The pricing surface presents nine choices | Medium | Yes. Decision 5, unsigned | `bg-web`, sequenced with brief 2 | cPanel only |
| 4 | Nothing brings anyone back | Medium, but slowest to land | Yes. Decision 3, and a spend checkpoint | `bg-architect` then `bg-backend` | Netlify |

**If exactly one shipped, ship brief 1.**

The reasoning, stated so it can be argued with. Every channel this sprint is
turning on points at one destination: the instant audit. Brief 1 is the only
change that alters what a visitor receives when they arrive there. It is also
the only one of the four where the asset is already built, already paid for, and
already sitting in the database unread: on 8 of 8 public audits ever run, the
competitor names were computed, stored, and hidden (MEASURED, SQL in 2.1). Every
other brief improves the odds that someone reaches the audit. Brief 1 improves
what happens when they do, and it is the step where 6 of the last 7 people
stopped.

The honest counter, recorded rather than buried: brief 2 acts on 100 percent of
arrivals and brief 1 acts only on people who already typed a domain, which was
8 people in 38 days. At that volume neither has a measurable effect size. The
tiebreak is that brief 1 is a defect (computed value deliberately withheld) and
brief 2 is an absence (value never written), and a defect on the path every
channel feeds is the one to close first. INFERRED.

**Deploy batching.** PLAN section 4 requires these to batch, because Netlify
builds are capped at roughly two a day platform-wide. Note that brands 1 and 2
do not actually contend: `getbrandgeo.com` deploys through the GitHub webhook to
`brandgeo/web/deploy.php` on cPanel and costs no Netlify credit, while the
Netlify pipeline serves `app.getbrandgeo.com` and the functions. So brief 1's
function change is the only item in this file that consumes a Netlify build.
Brief 1's site.js change, brief 2 and brief 3 all ride the free cPanel pipeline
and should be batched into one push for review economy, not for credit economy.

---

## 2. Brief 1: the free taste withholds the painkiller

### 2.1 The defect, measured

The instant audit computes competitor names and per-engine presence, writes them
to the database, and then serves neither to the visitor until an email is
entered.

MEASURED, read-only SQL against project `duiyifepitvugyulobqm`, run 2026-08-14:

```sql
SELECT count(*) FILTER (WHERE created_via='public')                AS public_audits,
       count(*) FILTER (WHERE created_via='public' AND unlocked)   AS public_unlocked
FROM prospect_audits;
-- public_audits: 8, public_unlocked: 2
```

Both unlocked rows are founder tests on `getbrandgeo.com` (ids 1 and 59). Of the
seven most recent public audits (ids 57, 58, 59, 60, 61, 62, 63), exactly one
unlocked, and that one is the founder's own domain. This is the audit's "6 of
the last 7 never unlocked" claim, reproduced independently today rather than
inherited (GTM-TEAM section 4).

MEASURED, same run, per-audit detail:

```sql
SELECT id, domain, unlocked, ai_score, engine_states,
       jsonb_array_length(to_jsonb(competitor_flags)) AS comp_flags
FROM prospect_audits WHERE created_via='public' ORDER BY created_at DESC;
```

| id | domain | unlocked | ai_score | engine_states | competitor_flags |
|---|---|---|---|---|---|
| 63 | loremax.ai | false | 0 | gemini missing, perplexity missing | 4 |
| 62 | getbrandgeo.com | false | 0 | gemini missing, perplexity missing | 2 |
| 61 | prejmer-raceway.com | false | 0 | gemini missing, perplexity missing | 6 |
| 60 | talentwelove.com | false | 0 | gemini missing, perplexity missing | 3 |
| 59 | getbrandgeo.com | true | 0 | gemini missing, perplexity missing | 4 |
| 58 | getbrandgeo.com | false | 0 | gemini missing, perplexity missing | 2 |
| 57 | getbrandgeo.com | false | 0 | gemini missing, perplexity missing | 3 |
| 1 | getbrandgeo.com | true | 0 | gemini missing, perplexity missing | 4 |

Three facts fall out of that table, and all three are load-bearing.

**a. The withheld asset exists on 100 percent of audits.** 8 of 8 carry between
2 and 6 named competitors. There is no case where unlocking the names would
reveal an empty box.

**b. The delivered asset is a zero.** 8 of 8 public audits scored `ai_score: 0`
with both screening engines in state `missing`. So what a visitor currently
receives is the number 0 out of 100 and a gap count, with no evidence attached.
The one differentiated, specific, loss-framed thing the audit knows, which
brand the engine named instead, is the part that is hidden. INFERRED: a bare
0/100 with no evidence is easier to dismiss as a broken tool than to accept as a
finding, which is a mechanism for non-conversion independent of any gate.

**c. The names are real and specific.** MEASURED, `competitor_flags` on id 61
(`prejmer-raceway.com`) includes Perplexity naming "Vmax Electric Indoor
Karting" for the prompt "best karting tracks in Romania", and Gemini naming
"K1 Speed" for "family-friendly karting venues". Id 60 (`talentwelove.com`) has
Gemini naming "Insight Global" for "best recruitment agencies for AI
professionals". This is the painkiller, in the database, unread.

### 2.2 The code path, exactly

Three files decide this, and only one of them holds the gate.

- **`brandgeo-dashboard/netlify/functions/audit-domain.js`** computes everything.
  `computeEngineStates` at line 253 and `computeGapsAndFlags` at line 254
  produce `engineStates`, `topGaps` and `competitorFlags`; all of them are
  persisted by the update at lines 256 to 265. Its own HTTP response at lines
  271 to 279 returns only `{ token, status, teaser: { domain, ai_score,
  category } }`. **This file does not need to change.**
- **`brandgeo-dashboard/netlify/functions/get-audit-report.js`** is the gate.
  Line 45 computes `canSeeFullReport = audit.unlocked || isInternalCaller(event)`.
  The locked branch at lines 48 to 60 returns exactly six fields: `status`,
  `unlocked`, `domain`, `category`, `ai_score`, `low_confidence`, `gap_count`.
  The unlocked branch at lines 63 to 80 returns everything. **This is the single
  file where the split lives.**
- **`brandgeo/web/site.js`** renders the locked view. `renderAuditResult` at
  line 244 draws the ring, the score, the domain, the gap sentence and the email
  form. `setAuditGap` at line 230 writes the one sentence built from the locked
  payload, and its own comment at line 228 states that only three fields are
  readable before the email step. **This is where the new fields get shown.**

`brandgeo-dashboard/src/pages/AuditReport.tsx` renders the same two states on
the app side: the locked branch at lines 160 to 199 (score, gap sentence, email
form) and `FullReportView` at line 210. It is in scope for parity but it is not
where the funnel loss happens, because the site widget is what a visitor meets
first.

### 2.3 The finding that changes the ruling

**The split named in the audit and in the plan, "show competitor names, keep
`top_gaps` behind the gate", is not implementable as written, because
`top_gaps` currently contains nothing that is not already in
`competitor_flags`.**

MEASURED, `_score.js:167-170`:

```js
const topGaps = [
  ...competitorFlags.map(f => ({ engine: f.engine, prompt: f.prompt, issue: 'competitor_named', competitor_named: f.competitor_name })),
  ...plainGaps,
].slice(0, 3)
```

`topGaps` is the first three `competitorFlags`, re-keyed. Confirmed against
production: on audit 63, `top_gaps` is exactly the first three of the four
`competitor_flags`, same engine, same prompt, same competitor name. Because 8 of
8 public audits carry 2 or more competitor flags, and 6 of 8 carry 3 or more,
`top_gaps` is a strict subset of `competitor_flags` on every public audit that
has ever run.

Consequence: if `competitor_flags` moves in front of the gate as a whole object,
the gate protects nothing. The email would be traded for information the visitor
already has. That is not a smaller gate, it is a gate that has quietly become
decorative, and it would be discovered by the first prospect who compares the
two screens.

So the split cannot be by field name. It has to be by **granularity**, and that
is a data-contract decision, which is `bg-architect`'s to rule and not
`gtm-conversion`'s to make. My recommendation to the architect, with the
reasoning, is in 2.4.

### 2.4 The fixed state, as observable behaviour

At 1280px and at 375px, immediately after the score ring finishes animating and
without typing anything, a visitor sees on the homepage result card:

1. The score and domain, as today.
2. **A per-engine row.** One chip per engine actually asked, each labelled with
   the engine name and its state, using the four existing states `know`,
   `partial`, `missing`, `unavailable`. The `unavailable` state must keep its
   existing meaning and its existing explanation, that BrandGEO could not reach
   the engine and this is not a result about the visitor's brand
   (`_score.js:124-139` and `AuditReport.tsx:252-257`). On today's data this row
   would read "Gemini: MISSING, Perplexity: MISSING", which is a far more
   specific and more alarming statement than "0/100".
3. **The distinct competitor names, as a deduplicated set, with no attribution.**
   For audit 61 that is "Vmax Electric Indoor Karting, Andretti Indoor Karting
   and Games, Fast Lane Boise, K1 Speed, Crofton Go-Kart Raceway, Bay Area
   Raceway". A count, and the names. Not which engine, not which question.
4. One line naming what the email buys, written to be true.

Behind the email gate, unchanged in substance but now genuinely distinct:

5. **The attribution.** Which engine named which competitor, in answer to which
   buyer question. This is `competitor_flags` and `top_gaps` in their current
   per-row form.
6. The six-dimension breakdown (`dimensions`).
7. `engine_results`, including the response snippets, which is the strongest
   asset in the report and has never been visible anywhere before the gate.

**Why that split still leaves a reason to give an email.** The free view answers
"am I invisible, and to whom did I lose". The gated view answers "on which
question, in which engine, in whose words". The first is the diagnosis and it is
what makes someone care. The second is the thing you act on, and it is what a
consultant would charge for. A prospect who reads six competitor names and two
MISSING chips has been given a genuine reason to want the sentence that produced
them. INFERRED, and it is a mechanism claim, not a rate claim.

Secondary reason, MEASURED rather than inferred: the gated report is the only
surface that carries `engine_results` snippets at all, and today nothing anywhere
in the funnel previews their existence.

### 2.5 The smallest version that ships this week

Two changes, in this order. Neither depends on an open section 6 decision.

**Step 1, `bg-backend`, one file.** In `get-audit-report.js`, add exactly two
fields to the locked branch at lines 48 to 60, leaving the unlocked branch at
63 to 80 untouched:

- `engine_states`, passed through verbatim from `audit.engine_states`.
- a new derived field, name to be fixed by `bg-architect`, holding the
  deduplicated list of competitor names with no engine and no prompt attached,
  derived in this function from `audit.competitor_flags`. Derived at read time,
  not stored, so no migration and no backfill, and so the eight existing rows
  gain the field with no write.

This is additive and backwards compatible. `site.js` and `AuditReport.tsx` both
ignore unknown fields today, so shipping step 1 alone changes nothing a visitor
sees and cannot regress the funnel.

**Step 2, `bg-web`, one file.** In `brandgeo/web/site.js`, extend
`renderAuditResult` (line 244) and `setAuditGap` (line 230) to render the two
new fields above the existing `#auditEmailForm`. The gap sentence at lines 236
to 239 is rewritten to describe what the email buys, since the current wording
("The full report names them") becomes false once the names are shown.

`AuditReport.tsx`'s locked branch is deliberately **out of the smallest cut**.
It is the second screen, it needs a Netlify build of its own, and shipping it
later cannot break the first.

### 2.6 Owner and route

Three seats, strictly sequenced, disjoint write scopes:

1. `bg-architect`, writes `docs/arch/audit-teaser-contract.md`. Rules the field
   split and the new field's name and shape. Reads
   `get-audit-report.js`, `_score.js`, `audit-domain.js`, `site.js`,
   `AuditReport.tsx`.
2. `bg-backend`, writes `brandgeo-dashboard/netlify/functions/get-audit-report.js`
   only.
3. `bg-web`, writes `brandgeo/web/site.js` only.

Explicitly out of scope for all three: `audit-domain.js` (it already computes and
stores everything needed), `_score.js` (changing `computeGapsAndFlags` would
alter the stored shape of eight existing rows and the internal Prospect Radar
contract), `unlock-audit-report.js` (the unlock mechanism, the lead write and
the HubSpot push are unchanged), and `brandgeo/web/index.html`, which brief 2
owns. No two packets touch the same file.

### 2.7 Acceptance criteria

Checkable externally by `gtm-verify` or `bg-verify` without asking me what I
meant. Run a fresh public audit on a domain with no prior row.

- [ ] `GET https://app.getbrandgeo.com/.netlify/functions/get-audit-report?token=<new token>`
      with no `X-Internal-Key` header returns HTTP 200 with `unlocked: false`
      and a JSON body containing a non-null `engine_states` object.
- [ ] The same response contains the competitor-name field named in
      `docs/arch/audit-teaser-contract.md`, and it is an array of strings.
- [ ] No element of that array is an object, and no element contains an engine
      id or a prompt string. Grep the raw response body for `"engine"` and
      `"prompt"`: both return zero matches outside `engine_states`.
- [ ] The same response contains no `top_gaps`, no `competitor_flags`, no
      `dimensions` and no `engine_results` key.
- [ ] The same request WITH a valid `X-Internal-Key` still returns all of
      `dimensions`, `engine_states`, `engine_results`, `top_gaps` and
      `competitor_flags`.
- [ ] On `https://getbrandgeo.com/#free-audit` at viewport 375x812 and at
      1280x800, after an audit completes and before any email is typed, the
      result card displays at least one engine chip and at least one competitor
      name, and `#auditEmailForm` is still present in the DOM.
- [ ] The string "The full report names them" no longer appears in the served
      `https://getbrandgeo.com/site.js`.
- [ ] Unlock still works end to end: submitting a valid email returns HTTP 200
      from `unlock-audit-report`, and a new `prospect_leads` row exists for that
      audit id.
- [ ] An audit whose `engine_states` contains `unavailable` renders that chip
      with the existing not-a-result-about-your-brand explanation, and does not
      render it as `missing`.

### 2.8 Rollback

Revert the two commits. Step 1 alone is inert to visitors, so reverting step 2
(`site.js`, cPanel, no Netlify credit) restores the current locked card in one
push without touching the function.

### 2.9 Risk if it ships wrong

- **The gate becomes decorative.** If `competitor_flags` or `top_gaps` ship whole
  rather than as a name-only set, the email buys nothing and the only lead
  capture in the funnel stops working. This is the specific failure 2.3 exists to
  prevent, and the third acceptance criterion is the check for it.
- **Free competitor-set harvesting.** Public audits cost a measured average of
  EUR 0.2053 each, range EUR 0.0380 to EUR 0.2420 over 8 rows (MEASURED, SQL on
  `prospect_audits.estimated_cost_eur`, 2026-08-14). Making the differentiated
  output free raises the value of scripted abuse. The existing controls stay in
  force and must be verified as unchanged: per-IP and monthly spend caps in
  `_prospect_guard.js`, the global hourly circuit breaker at
  `audit-domain.js:66-72`, and the client-side 3-per-10-minutes limit at
  `site.js:93-95`. INFERRED risk, not observed: one competitor has already run
  recon on this product (the Slatehq signup), so treat harvesting as plausible
  rather than theoretical.
- **Score credibility.** On today's data the card would read 0/100 next to six
  competitor names. That is coherent. If an audit ever returns a high score AND
  competitor names, the two read as contradictory unless the copy frames the
  names as "also named", not "named instead of you". `bg-web` must not import
  the gated "instead of you" phrasing from `AuditReport.tsx:271` into the free
  view, because free-view names carry no per-prompt attribution and therefore
  cannot support that claim.

### 2.10 Open decisions this touches

None blocking. It is adjacent to section 6 decision 2, quoted verbatim:

> ChatGPT in the free screening audit at ~EUR 0.43/audit, rate-limited?
> Options: yes / no (then name engines on the card). Blocks: B.6

Ruled NO on cost, 2026-08-13. Under that ruling this brief becomes more
important, not less: the screening audit is Gemini and Perplexity only
(MEASURED: `_prospect_engines.js:395`), so the per-engine row shipped here is
also the mechanism that stops a visitor assuming ChatGPT was asked. PLAN section
5 records that production has since measured EUR 0.0615 per ChatGPT check
(`_cost.js:383-391`), putting the real figure near EUR 0.25 per audit rather
than EUR 0.43. That is Constantin's to revisit; nothing in this brief waits on
it.

---

## 3. Brief 2: the front door names nobody

### 3.1 The defect, measured

MEASURED, case-insensitive occurrence counts in
`brandgeo/web/index.html`, run 2026-08-14, reproducing the audit's Pillar 1
measurement rather than inheriting it:

| Term | Count | Term | Count |
|---|---|---|---|
| agency | 0 | revenue | 0 |
| marketer | 0 | leads | 0 |
| SMB | 0 | traffic | 0 |
| CMO | 0 | ROI | 0 |
| B2B | 0 | lost | 0 |
| small business | 0 | invisible | 0 |

MEASURED: `grep -c "get-found-online" index.html` returns 0. The done-for-you SMB
page that `GTM-STRATEGY.md` 4.2b ruled PRIMARY on 2026-07-18 is linked from the
homepage exactly zero times, thirteen months of ruling notwithstanding.

The hero as served (MEASURED, `index.html:1506-1510`):

- eyebrow: "01 &middot; AI Visibility Platform"
- h1: "Are AI models recommending your brand, or your competitors?"
- hero-sub: "See what the top AI engines tell your customers when they ask about
  your category. Type your domain and get a scored answer in under a minute."

That names a capability and a speed. It does not name a buyer and it does not
name a consequence. INFERRED: a visitor who cannot tell in three seconds whether
a product is for them does not self-select in, and the audit scored the hook 3
out of 5 for exactly this reason.

### 3.2 The constraint the fix must respect

The homepage was rebuilt 2026-08-07 as the Live Instrument and the hero card
prints real anonymized client data. Binding, from CLAUDE.md CURRENT STATE
2026-08-07 and verified in the source comment at `index.html:1526-1544`:

- Never relabel the hero card as sample data, never name the client, never print
  the client domain.
- **Six type sizes only.** MEASURED, `index.html:203-208`: `--d1: 56px`,
  `--d2: 32px`, `--l: 18px`, `--b: 15px`, `--da: 14px`, `--m: 12px`, with a
  640px override to `--d1: 36px`, `--d2: 26px`, `--l: 17px` at line 235. The
  source comment at line 201 states these variables are the only font-size
  values any rule may reference. A new copy line must reuse an existing role, so
  it must be an eyebrow (`--m`, mono, uppercase, `.14em` tracking, per
  `index.html:279-288`), a hero-sub (`--l`), or a hero-trust item (`--da`).
- **Fold colour budget:** 0 red, 0 orange, 1 green, about 6 violet. A new element
  must not introduce a status colour. Weight cap 600.

Therefore this fix is words in existing slots. It is not a new component, not a
new type size, and not a new colour.

### 3.3 The fixed state

At 375x812 and at 1280x800, within the first viewport, the visitor can read a
noun that describes them and a consequence that costs them something, without
scrolling and without any new visual element appearing.

Concretely, three slots and no others:

1. **The eyebrow** (`index.html:1506`) carries the buyer instead of the
   category. It currently spends the highest-attention monospace line in the
   fold on the words "AI Visibility Platform", which is what the company is, not
   who it is for.
2. **The hero-sub** (`index.html:1510`) names the consequence. It currently
   names the mechanism twice (what the engines tell customers, and that a score
   arrives fast) and the stake zero times.
3. **The nav** gains one route to `get-found-online.html`, closing the
   zero-links measurement. PLAN section 8 already commits to this as the working
   assumption: self-serve owns the homepage for the 17 days, with the
   done-for-you page given a named nav route rather than being unreachable.

The h1 is deliberately left alone. It already does loss framing ("or your
competitors"), it is the one line that survived the 2026-08-07 rebuild on
merit, and changing it would put the biggest type role in the fold into play for
a benefit the smaller roles can deliver.

### 3.4 The smallest version that ships this week

`bg-copy` writes a copy deck holding exactly three strings, then `bg-web`
applies them. Constraints binding on `bg-copy`, from GTM-TEAM section 5 and the
audit's section 7:

- No customer counts, no logos, no testimonials, no "trusted by".
- No "cheapest", no "most engines per euro", no engine-count superlative.
- No trial language. No deadline urgency.
- No em dashes and no en dashes.
- The eyebrow must fit one line at 375px in mono at 12px with `.14em` tracking.
  Under about 28 characters. This is a hard layout constraint, not a preference.
- The consequence claim must be a thing BrandGEO can evidence. "Your competitor
  is named and you are not" is evidenced by `competitor_flags` on 8 of 8 public
  audits. "You are losing revenue" is not evidenced by anything and is banned.

Direction, not final copy, since the words are `bg-copy`'s to write: the eyebrow
should name the buyer segment that decision 1 selects, and the hero-sub should
end on what the visitor loses when an engine answers with someone else's name.

### 3.5 Owner and route

- `bg-copy`, writes `docs/copy/homepage-icp-2026-08.md` only.
- `bg-web`, writes `brandgeo/web/index.html` only, applying the deck verbatim.

Out of scope: `brandgeo/web/site.js` (brief 1 owns it), the hero data card and
every `data-final` attribute inside `.hero-visual`, the h1, the `:root` token
block, and `get-found-online.html` itself. No packet in this file writes
`index.html` except this one, so brief 3's pricing edits must be sequenced into
the same `bg-web` packet rather than racing it. See 4.5.

### 3.6 Acceptance criteria

- [ ] `curl -s https://getbrandgeo.com/ | grep -c "get-found-online"` returns 1
      or more.
- [ ] At least three of the terms measured at zero in 3.1 return a non-zero
      count in the served homepage HTML, and at least one of them appears inside
      the `<section class="hero" id="free-audit">` block.
- [ ] `id="free-audit"` and `id="brandInput"` both still exist in the served
      HTML, unchanged. 90 or more inbound pages depend on both.
- [ ] The served homepage contains no font-size declaration other than the six
      `--d1 --d2 --l --b --da --m` variables. Grep the inline stylesheet for
      `font-size:` followed by a digit: zero matches outside the `:root` and
      640px override blocks.
- [ ] No em dash (U+2014) and no en dash (U+2013) anywhere in the served HTML.
- [ ] Above 812px of page height at 375px width, measured over CDP with a real
      layout pass, no element carries a computed colour equal to `--bad`,
      `--warn` or `--part`. The fold status budget is unchanged.
- [ ] The hero data card still carries its 2026-08-07 real-data framing and the
      client domain appears nowhere in the served HTML.

### 3.7 Rollback

One `bg-web` commit against one file on the cPanel pipeline. Revert the commit,
push, the webhook redeploys. No Netlify credit either way.

### 3.8 Risk if it ships wrong

- **Naming the wrong buyer.** If the eyebrow names the self-serve marketer and
  Constantin then rules decision 1 option B, the fold is selling to the
  secondary buyer and the fix has to be undone. This is why 3.9 exists and why
  the nav link is included: the link is correct under both options.
- **A claim the product cannot keep.** The consequence line is the exact spot
  where invented proof enters a page. The acceptance criteria cannot catch a
  false claim, so `bg-copy` carries the guardrail list explicitly in its packet
  and `gtm-verify` reads the deck against it before `bg-web` applies it.
- **Type system drift.** One hand-written `font-size` in a new rule breaks the
  six-size system that the 2026-08-07 rebuild was built on, and it will not be
  visible in review. The fourth acceptance criterion is the check.

### 3.9 Open decisions it depends on

Section 6 decision 1, quoted verbatim:

> Which motion owns the homepage? `GTM-STRATEGY.md` 4.2b ruled done-for-you SMB
> primary on Jul 18; the homepage sells self-serve and links the done-for-you
> page 0 times.
> Options: A: self-serve owns it, give get-found-online.html its own channel.
> B: done-for-you owns it, fold names the SMB buyer, ladder moves to /pricing.
> Blocks: Every positioning fix (B.7)

**What changes under each option.**

Under A, the eyebrow names the self-serve operator, the hero-sub keeps the
instant audit as the primary action, the pricing ladder stays on the homepage,
and `get-found-online.html` gets the nav route as its channel. This is what
PLAN section 8 already assumes for the 17 days.

Under B, the eyebrow names the SMB owner, the hero-sub leads with the
done-for-you outcome, the whole pricing section moves off the homepage to
`/pricing`, and brief 3 changes shape entirely because the visible ladder is no
longer on the front door.

**The narrow cut does not wait for this.** The nav link to
`get-found-online.html` is correct under A and required under B, and the
zero-count on outcome words is a defect under both. `bg-copy` writes the deck
against option A, which is the standing working assumption, and flags in its own
deck which of the three strings would be rewritten under B. That is one string,
the eyebrow.

---

## 4. Brief 3: the pricing surface presents nine choices

**Status: READY TO EXECUTE ON APPROVAL. Constantin has not signed this off.**
Section 6 decision 5 is open. Nothing in this brief is routed to a builder until
he rules. It is written now so that the ruling is the only remaining step, per
GTM-TEAM section 1.

### 4.1 The defect, measured

MEASURED, `brandgeo/web/index.html` lines 1949 to 2170, read 2026-08-14:

- A mode switch with two tabs at lines 1960 to 1963, "Run it yourself from
  EUR 0" and "Done for you from EUR 1,500".
- A global monthly/yearly billing toggle at lines 1966 to 1972.
- Five self-serve cards in `#grid-self`: Free (1979), Radar (1998), Essentials
  (2019), Growth (2040, `featured`, "Most Popular"), Growth PRO (2068), plus
  Managed at 1500 (2100).
- A separate 48-hour audit offer in section 10 at line 2215.

That is nine things a visitor must resolve before choosing one, which is the
audit's Pillar 3 count reproduced.

**Every card is priced in supply units.** MEASURED, the feature lists:

- Free (1992 to 1994): "1 project, 5 buyer prompts", "Gemini visibility",
  "Monthly refresh + dashboard".
- Radar (2012 to 2014): "1 project, 7 buyer prompts", "Gemini and Claude",
  "Weekly refresh + dashboard".
- Essentials (2034 to 2036): "18 commercial prompts", "ChatGPT, Gemini and
  Claude", "Weekly refresh + competitor tracking".
- Growth (2061 to 2064): "35 commercial prompts", "5 AI engines", "Weekly
  refresh", "Site audit, 10 pages".

Not one card states an outcome. `docs/strategy/sprint-ladder-ruling.md` decision
4 already ruled that a package sells a tier and not prompts. The cards never
caught up.

**Radar is monthly-only against a global yearly toggle.** MEASURED: the
Essentials, Growth, Growth PRO and Managed cards each carry a
`billing-monthly` and a `billing-yearly` price div (2023 to 2025, 2050 to 2052,
2072 to 2074, 2100 to 2102). Radar's price row at 2001 to 2004 has no
`billing-yearly` variant at all. Flipping the global toggle therefore leaves
Radar reading EUR 29/mo with no explanation on the card. This is the same class
of defect as the 2026-08-02 incident where `site.js` sent `period: 'annual'` for
a plan with no annual price.

**Honesty gap on engines.** Free is Gemini only and Radar is Gemini and Claude
(MEASURED, and the cards do say so). But nothing on the Free or Radar card tells
a visitor that ChatGPT, the engine most buyers mean by "AI", starts at
Essentials. Combined with the screening audit also being Gemini and Perplexity
only, a visitor can go from homepage to free account without ever being told
ChatGPT was not asked.

### 4.2 The fixed state, on approval

Per PLAN section 5, which is the recommendation awaiting the ruling:

1. `#grid-self` shows three cards: Free, Radar EUR 29, Growth EUR 299.
2. Essentials EUR 99, Growth PRO EUR 449 and Managed move behind a "Compare all
   plans" disclosure or link. Nothing is deleted. No ruled price moves. Every
   hidden tier stays buyable at its existing checkout link.
3. Every visible card names its engines explicitly, and the Free and Radar cards
   state where ChatGPT starts.
4. Every visible card leads with an outcome line and keeps the unit line
   underneath, rather than replacing units with outcomes. Buyers comparing
   against Otterly and Peec need the units; they just should not be the headline.
5. Radar's card carries one line explaining that it is monthly only, so the
   global toggle stops producing an unexplained non-response.

Explicitly not in scope, per the audit's section 5C: no repricing of Radar. The
ladder arithmetic is sound and there is no volume against which to measure a
price change.

### 4.3 The smallest version that ships on approval

Items 3 and 5 alone. They are copy inside existing cards, they need no layout
change, they carry no risk to checkout, and they are the two that stop a visitor
being allowed to believe something untrue. Items 1, 2 and 4 are the layout
change and can follow.

Worth noting: items 3 and 5 are arguably not blocked by decision 5 at all, since
naming engines honestly and explaining a monthly-only card are correct whether
the ladder shows three cards or five. If Constantin wants motion before he rules,
that is the cut to take, and it can ride brief 2's `bg-web` packet.

### 4.4 Owner and route

`bg-web`, writing `brandgeo/web/index.html` only. If item 4 is included,
`bg-copy` writes the outcome lines first into
`docs/copy/pricing-cards-2026-08.md` and `bg-web` applies them verbatim.

Out of scope, and this matters: `brandgeo/web/site.js` (brief 1 owns it, and it
also owns `MONTHLY_ONLY_PLANS` and the checkout wiring),
`netlify/functions/_terms_gate.js`, every `data-checkout` attribute, and every
Stripe payment link. No price string that a customer could be charged may change
without naming the migration and the affected customers, and this brief changes
none.

### 4.5 Sequencing note, because two briefs share one file

Briefs 2 and 3 both write `brandgeo/web/index.html`. They must go out as **one
`bg-web` packet with an ordered task list**, not two packets. Two builders on one
file is the collision the disjoint-scope rule exists to prevent. Order inside
that packet: hero and nav first (brief 2), then pricing (brief 3), because the
hero edit is unblocked today and the pricing edit is not.

### 4.6 Acceptance criteria, on approval

- [ ] The served homepage's `#grid-self` contains exactly 3 elements with class
      `pricing-box`.
- [ ] A "Compare all plans" control exists, and from it a visitor can reach a
      working checkout for Essentials, Growth PRO and Managed. Each
      `data-checkout` value present today is still reachable.
- [ ] Every visible card names its engines by name in its feature list.
- [ ] The Free card and the Radar card each contain a string naming the plan at
      which ChatGPT becomes available, and that plan is Essentials.
- [ ] Toggling the billing switch to Yearly leaves the Radar card showing a
      price and a visible explanation, not an unchanged price with no note.
- [ ] No price string on the page differs from the corresponding value in
      `src/lib/planConfig.ts`.
- [ ] No banned claim appears: grep the served page for "cheapest", "most
      engines", "free trial", "trusted by". Zero matches.
- [ ] No em dash and no en dash anywhere in the served HTML.

### 4.7 Rollback

One commit against one file on the cPanel pipeline. Because nothing is deleted
and no checkout wiring changes, reverting restores the five-card ladder exactly.
PLAN section 5 states this is reversible in one edit, and the acceptance criteria
above are written to keep that true.

### 4.8 Risk if it ships wrong

- **A hidden tier becomes unbuyable.** The whole recommendation depends on
  "hidden" meaning "one click away", not "removed". If the disclosure fails to
  render or its links break, three tiers stop selling and nothing reports it.
  Second acceptance criterion is the check, and it must be run against the live
  page, not the source.
- **Revenue tier buried.** Growth EUR 299 is the anchor and is where the
  done-for-you conversation lands. If the three-card layout demotes it out of the
  `featured` treatment it currently holds at line 2040, the anchor that makes
  EUR 29 read as small is gone.
- **Outcome copy drifting into a claim.** Rewriting cards in outcomes is exactly
  where "get found by AI" becomes "get more customers". The guardrail list in
  GTM-TEAM section 5 binds `bg-copy` here.

### 4.9 The decision it waits on

Section 6 decision 5, quoted verbatim:

> Collapse visible pricing to 3 cards?
> Options: yes / keep 5
> Blocks: B.8

**HUMAN CHECKPOINT.** Under "yes", section 4.2 executes as written. Under "keep
5", items 1, 2 and 4 are dropped, and items 3 and 5 (engine naming and the Radar
monthly-only line) should still ship, because both are honesty fixes independent
of card count.

---

## 5. Brief 4: nothing brings anyone back

Kept short deliberately. This defect is owned end to end by PLAN section 7,
which already carries the correct sequence and the checkpoint. `gtm-conversion`
adds the funnel framing and the one piece that is genuinely unblocked; it does
not re-plan what is already ruled.

### 5.1 The defect, measured

- **No lifecycle email of any kind exists.** MEASURED,
  `brandgeo-dashboard/netlify/functions/_email.js` exports exactly
  `sendBrandedEmail, renderShell, esc, FROM, APP_URL`. There is no welcome, no
  "your results are ready", no "your refresh ran". The activation audit's L8
  records the same, and admin alerts are the only mail the system sends about a
  user.
- **The weekly refresh sold on every paid card is not delivered.** MEASURED,
  SQL run 2026-08-14, unchanged from the audit's 2026-08-13 reading:

  ```sql
  SELECT COALESCE(refresh_cadence,'(null)') AS cadence, count(*) FROM clients GROUP BY 1;
  -- manual: 36, weekly: 2
  ```

  Zero clients on `monthly`, so the free tier's designed comeback loop has fired
  zero times in the product's life.
- **Scheduled refreshes delete the trend.** MEASURED,
  `brandgeo-dashboard/netlify/functions/_enqueue.js:138-152`: on a forced run the
  function deletes existing `ai_results` rows for the client, prompt set and
  engine set, then recollects. Scheduled runs are forced runs. Proven in
  production on client 52, whose 2026-08-02 rows were gone after the 08-09
  scheduled run.
- **Free's manual cooldown is a 30-day wall.** MEASURED, `_cost.js:566-569` and
  `planConfig.ts:560-563`, 720 hours.

### 5.2 The sequencing trap, restated because reversing it is destructive

Binding, from CLAUDE.md and PLAN section 7. **The history fix ships BEFORE any
cadence backfill.** Backfilling weekly cadence across the book while
`_enqueue.js:138-152` still force-deletes would wipe every client's history every
week, permanently, on a product whose stated upgrade argument is that the trend
is the point (`planConfig.ts:615`). Order:

1. `bg-architect` rules snapshot-and-append or archive-before-delete, and rules
   the dashboard read change from all-rows to newest-per-(prompt, engine), which
   is the reason the delete exists at all. Then `bg-backend` builds it.
2. Only then, the `refresh_cadence` backfill, with the 27 research rows excluded.
3. Only then, the "your refresh ran, here is what changed" email.

### 5.3 What is unblocked today

Step 1 is worth shipping on its own and needs no ruling from Constantin. It
spends nothing, changes nothing a customer receives today (36 of 38 clients are
on manual, so almost nobody is being force-deleted right now), and it is the
precondition for everything else in this brief. Ship it during the sprint even
though its funnel payoff lands after Day 17.

Adjacent and cheap, from the activation audit's L4: enqueue block reasons are
console-logged and invisible (`collectionContext.tsx:103-107` against
`enqueue-collection.js:44-60`), so a blocked free user sees a spinner that stops.
That is a return-loop defect too, it is one file each side, and it is not
blocked by anything. It is not routed here because it is `bg-app` plus
`bg-backend` work on the dashboard and it consumes a Netlify build that brief 1
should have priority on this week.

### 5.4 Owner and route

`bg-architect` writes `docs/arch/scheduled-refresh-history.md`. `bg-backend`
then writes `_enqueue.js` and the dashboard read path named in that spec. Not
routed in this file; it belongs to the PLAN section 7 chain and should be raised
by `gtm-lead` in the day close.

### 5.5 Acceptance criteria for step 1

- [ ] After two consecutive scheduled runs for one client, `ai_results` holds
      rows with two distinct `checked_at` dates for at least one
      (prompt_id, llm) pair.
- [ ] The dashboard score for that client is computed from the newest row per
      (prompt_id, llm), not an average across both, verified by comparing the
      rendered score against a hand-computed newest-row score.
- [ ] No user-visible number changes for a client with exactly one collection
      date. The fix must be inert on single-snapshot clients.

### 5.6 Rollback

Revert the `_enqueue.js` change. Rows already appended remain; nothing is lost by
reverting, which is the asymmetry that makes step 1 safe to ship first.

### 5.7 Risk if it ships wrong

- **Duplicate rows inflate every metric.** If append lands without the
  newest-per-pair read change, every rate on every dashboard silently doubles as
  history accumulates. The two changes are one packet, never two.
- **Cost.** Appending rather than deleting grows `ai_results` without bound. The
  existing 24-month pg_cron purge already covers this, and `bg-architect` should
  confirm it in the spec rather than assume it.

### 5.8 Open decisions it depends on

Section 6 decision 3, quoted verbatim:

> Backfill refresh_cadence for the existing book (turns on real spend), or pull
> the "weekly refresh" claim off the cards until true?
> Options: backfill / pull claim
> Blocks: B.1

Ruled on 2026-08-13: weekly, backfill. **Step 2 of 5.2 is a spend HUMAN
CHECKPOINT and remains one**, because it turns on real API budget across 38
client rows. PLAN section 7 records that deriving cadence from plan alone, without
the research exclusion, would switch on roughly EUR 6,075 a month of budget
ceiling for rows that are studies rather than customers. Step 1 needs no
checkpoint. Step 3 needs no checkpoint beyond the usual review of anything a
customer receives.

---

## 6. Packet-ready route blocks

Four blocks, `_TEMPLATE.md` shape, **ids deliberately unallocated**. Whoever
writes these to `.claude/handoffs/` allocates the number at write time. The
highest id currently on disk is `014`, so the next is `015`, but do not treat
that as reserved: check the directory at write time.

Blocks A and B are ready to write today. Block C waits on decision 5 and must be
merged into block B's task list rather than written separately, because both
write `brandgeo/web/index.html`.

### Block A, `bg-architect` to itself then `bg-backend`

```
from: gtm-conversion
to: bg-architect
status: READY
created: 2026-08-14
scope_write: docs/arch/audit-teaser-contract.md
scope_read: brandgeo-dashboard/netlify/functions/get-audit-report.js,
            brandgeo-dashboard/netlify/functions/_score.js,
            brandgeo-dashboard/netlify/functions/audit-domain.js,
            brandgeo-dashboard/src/pages/AuditReport.tsx,
            brandgeo/web/site.js,
            docs/growth/conversion/painkiller-unlock-and-funnel-briefs-2026-08-14.md
model: opus
```

Decision to carry: move per-engine presence and the deduplicated competitor-name
set in front of the email gate; keep per-prompt attribution, dimensions and
`engine_results` behind it. Rule the field name and shape of the new
name-only field, and rule that it is derived at read time in
`get-audit-report.js` rather than stored, so no migration and no backfill of the
eight existing rows is required. Note section 2.3 above: `top_gaps` is currently
a strict subset of `competitor_flags`, so a field-name split does not work and
the split must be by granularity.

Do not: change `_score.js`, change `audit-domain.js`, change the internal-caller
path, or alter what `unlock-audit-report.js` does.

### Block B, `bg-backend`

```
from: bg-architect
to: bg-backend
status: BLOCKED on block A
created: 2026-08-14
scope_write: brandgeo-dashboard/netlify/functions/get-audit-report.js
scope_read: docs/arch/audit-teaser-contract.md, brandgeo-dashboard/netlify/functions/_score.js
model: opus
```

Acceptance criteria: the first five checkboxes in section 2.7.

### Block C, `bg-copy`

```
from: gtm-conversion
to: bg-copy
status: READY
created: 2026-08-14
scope_write: docs/copy/homepage-icp-2026-08.md
scope_read: brandgeo/web/index.html, docs/growth/GTM-TEAM.md,
            docs/strategy/positioning-pricing-audit-2026-08-13.md
model: opus
```

Three strings only: hero eyebrow, hero-sub, nav label for
`get-found-online.html`. Write against decision 1 option A and flag which string
changes under option B. Hard constraints: eyebrow under about 28 characters,
guardrail list in GTM-TEAM section 5, no em or en dashes, no claim the product
cannot evidence.

### Block D, `bg-web`, one packet covering briefs 2 and 3

```
from: bg-copy
to: bg-web
status: BLOCKED on block C
created: 2026-08-14
scope_write: brandgeo/web/index.html, brandgeo/web/site.js
scope_read: docs/copy/homepage-icp-2026-08.md,
            docs/growth/conversion/painkiller-unlock-and-funnel-briefs-2026-08-14.md
model: sonnet
```

Ordered task list: (1) apply the copy deck to the hero eyebrow and hero-sub and
add the nav route, per brief 2. (2) render the two new teaser fields in
`site.js`, per brief 1 step 2, only after block B is verified live. (3) pricing
card changes, per brief 3, only after Constantin rules decision 5.

Do not: rename `id="free-audit"` or `id="brandInput"`, touch the hero data card
or any `data-final` attribute, add a font-size outside the six tokens, or change
any `data-checkout` value or price string.

**A note on the shared scope.** Block D writes both `index.html` and `site.js`.
That is deliberate and it is why briefs 1, 2 and 3 route to one `bg-web` packet
rather than three. No other packet in this file writes either file.

---

## 7. HUMAN CHECKPOINT, for Constantin

Three items, in the order they unblock work.

1. **Decision 5, the pricing surface.** Quoted at 4.9. Brief 3 is written and
   ready; it moves no price and deletes no tier. Answer "yes" or "keep 5". If
   you want motion before you decide, say so and the engine-naming and
   Radar-monthly-only fixes (4.3) ship inside brief 2's packet this week.
2. **Confirm decision 1 stays at option A for the sprint.** PLAN section 8
   already assumes it. Brief 2 is written against A. One string changes if you
   move to B, and it is cheaper to hear that now than after `bg-web` ships.
3. **No spend approval is requested by this file.** Brief 1 turns on no new API
   spend; it changes what an already-paid-for audit displays. Brief 4 step 1
   turns on no spend. The `refresh_cadence` backfill (brief 4 step 2) does turn
   on spend and is not routed here.

Your controls, per the seat definition: "smallest version" for the
ship-this-week cut, "who owns it" for the route, "is it still broken" to force
re-verification, "decision N is A" to unblock, `/compact` to strip this to
defects and owners.

---

## 8. Evidence inventory

- **SQL**, read-only, project `duiyifepitvugyulobqm`, run 2026-08-14, four
  SELECTs, no writes: public audit count and unlock count; per-audit
  `unlocked`/`ai_score`/`engine_states`/`competitor_flags` length for all 8
  public rows; `competitor_flags` and `top_gaps` full content for ids 60, 61, 63;
  average, min and max `estimated_cost_eur` across the 8 public rows;
  `refresh_cadence` distribution across `clients`.
- **Source read**: `audit-domain.js` (all 313 lines), `get-audit-report.js` (all
  81), `unlock-audit-report.js` (all 75), `_score.js` (all 175),
  `_prospect_engines.js:389-431`, `_enqueue.js:136-155`, `_email.js` exports,
  `AuditReport.tsx:140-279`, `brandgeo/web/site.js:1-460`,
  `brandgeo/web/index.html:198-290, 440-520, 1490-1549, 1949-2084`.
- **Grep measurements** on `brandgeo/web/index.html`, 2026-08-14: twelve ICP and
  outcome terms at zero; `get-found-online` at zero.
- **Documents read**: `docs/growth/GTM-TEAM.md`,
  `docs/growth/sprint17/PLAN-2026-08-13.md`,
  `docs/audit/product-status-audit-2026-08-13.md`,
  `docs/audit/activation-audit-2026-08-13.md`,
  `.claude/handoffs/_TEMPLATE.md`, `.claude/handoffs/` directory listing.
- **Not done, by rule**: no repo source edited, no git command run, no
  collection triggered, no database write, no packet written to
  `.claude/handoffs/`.

---

## Orchestrator verification note, 2026-08-14 (added after this file was written)

The "8 of 8 scored 0 with both engines missing" figure above was checked
against production before being acted on, because it has two opposite
readings: genuine invisibility, or a brand-detection false negative. A
false negative would mean every prospect is told they are invisible
regardless of truth, which would be a credibility failure at the top of
every channel this sprint turns on.

**Verdict: NOT a defect. The zeros are truthful.** Evidence, read-only SQL,
no new API spend: `position(lower('brandgeo') in lower(engine_results::text))`
returns 0 for audits 59 and 62 (both `getbrandgeo.com`), and the stored
answers for audit 60 (`talentwelove.com`) likewise never name the brand.
The engines answered, competitors were extracted from those same answers
(2 to 6 per audit), and the brand simply is not in the text. Caveat kept
honest: `engine_results` stores snippets (about 4 KB per audit), not full
answers, so this is strong evidence rather than proof.

**But the verification produced a finding the brief above does not have,
and it strengthens brief 1 rather than weakening it.**

The split in the data is not public-versus-internal code paths, it is
brand size. Audits 52 to 56 (`hubspot.com` 61, `mailchimp.com` 54,
`caretlegal.com` 56 and 42, `getresponse.com` 33) scored non-zero with
engines reading `know` or `partial`. Every audit since is a small or new
brand and every one reads `0 / missing / missing`.

The public audit asks generic category questions ("how to measure brand
visibility in AI", "how to find top AI talent quickly"). A small brand is
essentially never named in the answer to a generic category question. So
**the free audit returns a near-constant result for the entire SMB segment
it is aimed at**: score 0, both engines missing. It is honest, it is
on-thesis, and it cannot differentiate one prospect from another.

Consequences for the funnel, ranked:

1. The one part of the output that IS unique to the visitor, which
   competitors were named instead of them and on which prompt and engine,
   is exactly the part sitting behind the email gate. The free view is
   identical for everyone; the differentiated view is unread. This is a
   stronger argument for brief 1 than the unlock rate alone.
2. A bare 0 with no evidence is dismissable as a broken tool. The same 0
   next to "these four competitors were named instead of you" is a
   diagnosis. Same data, opposite reading.
3. Worth a separate ruling, owner `bg-strategy`: whether the screening
   audit should ask at least one prompt where a small brand could
   plausibly appear (a niche or geographic variant), so the output can
   vary. A score that is always 0 teaches the prospect nothing about
   whether the instrument works.
