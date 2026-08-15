# Audit score presentation: replacing the /100 ring with the truth it is made of

Owner: `bg-copy`. Source: `docs/qa/audit-scoring-investigation-2026-08-14.md` (read-only investigation, cited by section throughout). Claim in one line, restated from that investigation: the number is computed correctly and answers a question we never told the visitor we asked. This deck fixes the telling, not the math.

Surfaces touched: `brandgeo/web/site.js` (homepage instant-audit widget) and `brandgeo/web/index.html` (its markup), `brandgeo-dashboard/src/pages/AuditReport.tsx` (the public `/audit/:token` report, both the locked teaser and the full email-gated view).

---

## 1. Voice check

Restated from `docs/strategy/hook-thesis-web.md` section 1 and this brief's own framing, not invented here.

**Who is speaking:** BrandGEO, in the plain, factual register already established on this page ("A true zero has to read as a FINDING, not as a failure," `site.js:374`). Not a salesperson, not an apologist. A measurement instrument that shows its work.

**To whom:** A small or niche B2B business owner who has just typed their own domain into a box on a homepage. Per `docs/AGENT-OS.md` and this brief: assume they do not know the word GEO, do not know what a screening audit is, and their working mental model of "AI visibility" is "I searched my own name and I was there." They are not wrong. They are answering a different question than the one this page asked.

**At what level of knowledge:** Zero GEO vocabulary. Every term this page uses that isn't a plain English word (screening, engine, cell, dimension) either gets defined in the sentence that uses it or gets cut. The three-second comprehension target from `hook-thesis-web.md` section 1 applies here too: after reading the top of this card, the visitor must be able to say back what was measured, and know it wasn't their own name.

---

## 2. Copy table

Every "why" is under ten words. Every number is sourced to a file or a stored value; anything needing a new field is marked **NEW FIELD**.

### 2.1 Homepage widget (`brandgeo/web/site.js`)

| Location | Current text | New text | Reason |
|---|---|---|---|
| `site.js:394-396`, zero-score headline | `0/100. You were not named in any answer we collected.` | `0 of {engine_count} AI engines named you, at least once, across {prompt_const} buyer questions.` | Leads with the fraction, drops the /100 frame |
| `site.js:394-396`, non-zero headline | `You're at {score}/100 AI Visibility` | `{engines_named} of {engine_count} AI engines named you, at least once, across {prompt_const} buyer questions.` | Same template both cases, no /100 claim |
| New line under the headline, both cases | (does not exist) | `See the exact questions below.` | Points at the new "what we asked" block, item 2.3 |
| `site.js:194`, skeleton stage 1 label | `Asking the engines about your brand` | `Asking AI engines the questions a buyer asks before they know you exist` | Current line is false; we never send the brand name (`_prospect_prompts.js:104`) |
| `site.js:195`, skeleton stage 2 | `Reading what each engine came back with` | (no change) | Already accurate |
| `site.js:196`, skeleton stage 3 | `Scoring the answers, nearly there` | (no change) | Already accurate |
| Ring caption (new, small text under the ring number, design to place) | (none today, ring reads bare) | `AI Visibility Score (screening sample)` | Names the number honestly without dropping the brand term, see section 3 |
| `site.js:349-368`, `setAuditGap()` | Unchanged logic | (no change) | Already gap-count driven and honest post 2026-08-14 |

`{engine_count}` = `Object.keys(engine_states).length`, already returned by `get-audit-report` (`get-audit-report.js:149`, field is in `shared`, present pre-email). `{engines_named}` = count of `engine_states` entries whose value is `'know'` or `'partial'` (site.js already has `STATE_PHRASE` for these two states at `site.js:267-268`, this is the same predicate, just counted). `{prompt_const}` = the literal `4`, sourced to `SCREENING_PROMPT_COUNT` (`audit-domain.js:34`), safe to hardcode because the public widget is always forced to screening depth (`audit-domain.js:74`) and this is a request count, not an answered count, so partial-coverage cases (investigation section 5) don't undermine it.

**Sequencing note for the builder.** `renderAuditResult()` fires on the FIRST response (score and category only, `site.js:370`), before `engine_states` arrives from the second call (`setAuditEvidence()`). The fraction headline above needs `engine_states`, so it cannot render at `renderAuditResult()` time. Two-phase copy:

- **Phase 1** (score known, engine_states pending): `Scored against {category} buyer questions.` (fallback if `category` is null: `Scored against buyer-question answers.`)
- **Phase 2** (engine_states lands, seconds later): swap in the fraction headline above.

This is the same "hidden until ready" pattern `setAuditEvidence()` already uses (`site.js:296-340`), just applied one function earlier.

### 2.2 Full report page, locked teaser (`AuditReport.tsx:160-200`)

| Location | Current text | New text | Reason |
|---|---|---|---|
| `AuditReport.tsx:166`, h1 | `AI Visibility Score` | `AI Visibility Score (screening sample)` | Names the sample size in the label itself |
| `AuditReport.tsx:163-165`, ring | `{score}<span>/100</span>` | (ring number unchanged, design's call whether the ring itself stays) | Copy scope stops at the label; flagged in section 7 |
| New line above the existing gap sentence | (does not exist) | `{engines_named} of {engine_count} AI engines named you, at least once, across {prompt_const} buyer questions.` | Same fraction as the homepage widget, ships today, `engine_states` is already in the locked payload (`get-audit-report.js:149`) |
| New block (ported from `site.js`, currently missing here entirely) | (does not exist on this page) | Per-engine chips: `{Engine}: {phrase}` using the same plain-language map as `site.js:266-271` (names you / names you sometimes / did not name you / could not be reached), plus competitor names if `competitor_count > 0` | This page is missing evidence the homepage widget already shows for the same data; parity fix |
| New block, the pre-empt (shared, see section 2.4) | (does not exist) | See section 2.4 | Item 3 of the brief |
| `AuditReport.tsx:168-170`, gap sentence | `We found {gap_count} visibility gap(s). See exactly where AI assistants aren't finding you.` / `Enter your email to see the full per-engine breakdown.` | (no change) | Already honest, already conditional on real data |
| `AuditReport.tsx:172-176`, low confidence note | `We couldn't fully analyse your homepage, so this is a lower-confidence estimate. The full report will still show exactly what we checked.` | (no change) | Already names the limitation and the next step |
| `AuditReport.tsx:196`, reveal-report button | `See my full breakdown` | (no change) | Accurate, no change needed |

### 2.3 Full report page, full email-gated view (`AuditReport.tsx:210-298`)

| Location | Current text | New text | Reason |
|---|---|---|---|
| `AuditReport.tsx:216`, score | `{score}<span>/100</span>` | (ring number unchanged) | Design's call, see section 7 |
| `AuditReport.tsx:219`, caption | `AI Visibility Score · {depth} audit · {n} engine(s) checked` | `AI Visibility Score (screening sample) · {mentioned_count} of {cells_checked} answers named you · {n} engine(s) checked` | Cell-level fraction now available client-side from `engine_results`, which this view already has |
| New block, pre-empt (shared, section 2.4) | (does not exist) | See section 2.4 | Placed directly under the score card, above Breakdown |
| `AuditReport.tsx:238-258`, "By AI engine" chip labels | `{Engine}: {STATE.toUpperCase()}` e.g. `Gemini: MISSING` | `{Engine}: {phrase}` using `names you` / `names you sometimes` / `did not name you` / `could not be reached`, same map `site.js:266-271` already uses | Shouty jargon reads as an accusation; the homepage widget already solved this, this page didn't inherit it |
| `AuditReport.tsx:282`, section header | `All checks` | `The exact questions we asked` | Names the section by what it proves, not by what it is called internally |
| New line under that header | (does not exist) | `We asked {domain} {prompt_count} questions a buyer types before they've heard of you. Here is what each AI engine said back.` | Item 2 of the brief: this line is what collapses the misunderstanding |
| `AuditReport.tsx:317`, terminal CTA lead | `Want to keep track of this, and work through each gap?` | (no change) | Accurate, no change needed |

`{mentioned_count}` = `report.engine_results.filter(r => r.brand_mentioned).length`. `{cells_checked}` = `report.engine_results.length`. Both already exist in this page's own data, no backend change, no new field: this is the one surface where the exact cell-level fraction ships with zero dependency.

### 2.4 Shared block: the pre-empt (new, appears on all three surfaces above)

This is the single highest-impact string in the deck. It has to land before the visitor forms the objection, not after.

```
Search your own name and you already show up. That's not what we tested here.
We asked {engine_count} AI engines the kind of question a buyer types before
they've ever heard of you, not your name, and checked who got named back.
```

Fallback if `engine_count` is unavailable at render time (Phase 1 on the homepage widget, section 2.1): drop the number, keep the sentence: `We asked AI engines the kind of question a buyer types before they've ever heard of you, not your name, and checked who got named back.`

Placement: directly under the score fraction, above any gap detail, on all three surfaces. It is not conditional on score. It runs identically whether the score is 0 or 75, because the objection it answers ("but I searched my own name") is the same objection either way.

---

## 3. Variants: naming the number (item 6)

The brief asks whether "AI Visibility Score" overclaims what a 4-question, 2-engine screening sample can support. It does. Per the investigation, the reachable score set below 33 is empty (`docs/qa/audit-scoring-investigation-2026-08-14.md` section 1.2), so the /100 scale reads as far more granular than the eight yes/no observations behind it. Three directions, one recommended.

**Direction A: rename outright.** `Category Mention Score`. Describes exactly what is measured: whether the brand is named when the category is asked about, not the brand itself. Intent: maximum honesty at the label level, so the objection dies before the visitor reads a word of body copy.

**Direction B: reframe around the buyer's shortlist.** `AI Shortlist Score`. Intent: ties the number to the thing the business owner actually cares about (am I on the list an AI hands a buyer), trades a little precision for resonance.

**Direction C, RECOMMENDED: keep the term, add a permanent qualifier.** `AI Visibility Score (screening sample)`. Reason: "AI Visibility Score" is not local to this one card. It is the label on the paid dashboard (`AIVisibility.tsx`), in the FAQ (`index.html:2199`), across ninety-plus pages of comparison and industry content, and it is the product's actual brand term for this metric family. Renaming it here alone creates a second name for the same concept, which is its own honesty problem: a visitor who signs up now sees a different-sounding number on day one. The qualifier does the same job R2 asks for (the number stops implying more precision than it has) without fragmenting a term used everywhere else in the product. The fraction-first headline in section 2 is doing the real honesty work; the label only has to stop overselling on its own.

**What this does not fix, and is not a copy decision.** The paid dashboard's own AI Visibility Score runs the identical six-dimension formula (investigation section 6.1) and inherits the same step-function structure, just with a wider prompt set that includes a self-named prompt for most registered clients. Whether to qualify that surface too, and whether to widen the screening sample so the scale can actually resolve below 33 (investigation R5), are both flagged in section 7. This deck only rules on the free-audit surfaces named in scope.

---

## 4. Number narration

For every number a visitor sees on these three surfaces: what it is, what good looks like, and the one thing it tells them to do.

**The fraction (`{engines_named} of {engine_count}` or `{mentioned_count} of {cells_checked}`).** What it is: how many of the answers we collected actually named the brand. What good looks like: any number above 0 means at least one AI engine already recommends the brand for a category question; the practical ceiling for a screening sample is the full count (2 engines, or however many cells returned). What it implies: 0 means start the free breakdown to see who got named instead; nonzero means check which questions still miss, since a nonzero score does not mean every question is covered (storeganise scored 75 and still missed 5 of 7 answers).

**The score (`{score}/100`, kept as a ring, relabeled per section 3).** What it is: a weighted composite of six sub-scores, all of them zero unless at least one answer named the brand (investigation section 1.1). What good looks like: per the investigation, no score between 1 and 32 is reachable on a screening audit, so treat anything at or above 33 as "at least one solid mention landed," and 0 as "no mentions yet," rather than reading the number as a smooth percentile. What it implies: the fraction above is the number to act on; the /100 score is a secondary summary of the same fraction, not a separate measurement.

**Per-engine state (`names you` / `names you sometimes` / `did not name you` / `could not be reached`).** What it is: whether that specific AI engine mentioned the brand in any of the questions it answered. What good looks like: `names you` on both screening engines. What it implies: `did not name you` on an engine is where to focus first; `could not be reached` is on BrandGEO, not the brand, and never counts against the score (`_score.js:70-74`, already correctly excluded).

**Competitor names shown pre-email.** What it is: the deduplicated set of brands that got named in an answer where this brand did not (`get-audit-report.js:44-60`). What good looks like: zero named competitors, meaning nobody is winning the spot instead. What it implies: these are the brands to study for what made them nameable; the full breakdown (behind email) shows which question and which engine, so the fix is specific rather than a guess.

**Cell coverage (`{cells_checked}` of the 8 requested).** What it is: how many of the 4 questions times 2 engines actually returned an answer; the investigation found this ranges 5 to 8 across stored audits and is never shown today (section 5, F4). What good looks like: 8 of 8, meaning nothing was lost to an engine timeout. What it implies: if `cells_checked` is below 8, say so plainly rather than silently scoring on a smaller sample; do not let a visitor believe every question got a full hearing when one didn't answer.

---

## 5. Error and empty states

| State | What happened | Visitor's fault? | Current text | New text |
|---|---|---|---|---|
| Audit still running (`pending` / `generating_prompts` / `collecting`) | We are still querying engines | No | Headline `Auditing {domain}…` / body `Asking AI assistants what they know about your business. This usually takes under a minute.` | Headline unchanged. Body: `Asking AI engines the questions a buyer asks before they know you exist. This usually takes under a minute.` |
| Audit failed (`status: 'error'`) | The check did not complete | No, unless a bad domain was entered, which `error_message` already distinguishes | Headline `Something went wrong` / body `error_message` or fallback `Please try running a new audit.` | Headline: `We couldn't finish this audit`. Body when `error_message` exists: unchanged (already specific). Fallback body: `Something interrupted the check before we could score {domain}. Run it again, it usually finishes in under a minute.` |
| Engine unreachable during a completed audit | We failed to ask that engine | No | `could not be reached`, chip tooltip `We could not reach this engine during your audit. This is not a result about your brand.` | (no change, already correct and already excluded from the score) |
| Low confidence (`low_confidence: true`) | We read too little of the homepage to be sure | No | `We couldn't fully analyse your homepage, so this is a lower-confidence estimate. The full report will still show exactly what we checked.` | (no change) |
| Zero cells returned | Nothing to score | No | `audit-domain.js:241-250` refuses to publish this case entirely | (no visitor-facing copy needed, correctly never shown) |
| Partial coverage (`cells_checked` below 8, no visitor-facing string exists today) | We only heard back from part of the sample | No | (nothing shown) | New line, full view only: `{cells_checked} of 8 questions returned an answer.` shown whenever `cells_checked < 8`, placed next to the fraction | 

`Something went wrong` is the exact phrase this role's own guardrails reject (no apology without a next step). It is now retired everywhere on this surface.

---

## 6. Compliance pass

Checked against this file, `docs/copy/audit-score-presentation-2026-08-14.md`, using the two required commands from this role's Operational Commands block (the em-dash and en-dash scan, and the banned-vocabulary scan). Both were run against the file on disk after writing it, not asserted from memory.

Run 1, the dash scan: no output (confirmed, ripgrep exit code 1, no match).
Run 2, the vocabulary scan: no output (confirmed, ripgrep exit code 1, no match).

Note on method: the first pass of this same check returned several hits, all self-referential or incidental. This section had quoted the two check commands verbatim, including their own dash character class and their own word list, which is content that matches its own filter. Separately, two ordinary words elsewhere in the deck happened to contain a banned four-letter and seven-letter substring as part of a longer word, with no relation to the banned meaning. Neither is a defect in the copy this deck delivers to a visitor; both were rephrased anyway so the mechanical check passes cleanly rather than passing only "in spirit." Re-run after both fixes: still no output. A separate manual read for the remaining items on this role's banned-word list (the ones outside the two required commands, such as the word for doing a task with no effort and the phrase about handing off responsibility) found nothing either.

- **Zero em dashes, zero en dashes.** Confirmed above.
- **Zero banned vocabulary.** Confirmed above.
- **Every factual claim traceable.** Every number in sections 2 to 4 cites a file, a line, or an investigation section. The two genuinely new values (`mentioned_count`, `cells_checked` on the full view) are computed from `engine_results`, a field that page already receives; nothing is invented.
- **No scaled or duplicated content.** This is one deck for one surface family, not templated per domain or per audit.
- **schema.org types honest.** Not touched by this deck; no structured data on these three surfaces changes.
- **No customer counts invented.** None appear in this copy. The one anonymized client reference already live on the homepage (`index.html:1540-1558`) is untouched by this deck.
- **No unverifiable claim added.** The two example audits (lawcus.com, storeganise.com) are quoted from what actually renders live today, not paraphrased.

---

## 7. Needs Constantin's ruling, not mine

1. **Whether to add `mentioned_count` and `cells_checked` to the teaser payload** (`get-audit-report.js` `shared` object, section 2.1 to 2.2). Both are aggregate counts, not a join, so they are consistent with the 2026-08-14 granularity ruling in that same file's header comment ("the gate protects the JOIN, not the VALUES"), but that ruling was written today by a different session and this deck is relying on its own reading of it. Worth a second look before `bg-backend` ships it.
2. **Whether to add `prompts_asked` (the 4 question strings, no engine, no answer) to the teaser payload**, so "the exact questions we asked" can render before the email gate on the homepage widget and the locked report, not only after. This deck did not build that into the required copy table because it is not needed to satisfy items 1 through 5 of the brief (the pre-empt block and the fraction both ship without it), but it would make the pre-empt concrete instead of general ("like X" becomes a real quoted question). Flag only, not blocking.
3. **Whether the ring stays as a visual element at all**, given section 3's finding that a 0 to 100 dial implies far more resolution than an 8-cell sample can support. This deck kept the ring and only changed its label and the text around it, because removing or replacing the ring is a layout call for `bg-design`, not a copy call.
4. **The FAQ answer to "How is the AI Visibility Score calculated?"** (`index.html:2199`) describes the same six-dimension formula and is not qualified as a screening sample. It covers both this free-audit surface and the paid dashboard's score, so fixing it here alone would create a new inconsistency rather than close one. Out of this deck's scope by the brief's own surface list; flagged for whoever owns the FAQ pass.
5. **The stale hero claim numbers** at `index.html:1519-1523` ("31 of 63 audited domains scored exactly 0, every large brand audited scored 33-61") are already refuted by current data and already tracked as finding F2 / fix R8 in the investigation this deck is built on. Not re-litigated here, just confirmed still open.
6. **R5 from the investigation** (the scale cannot resolve below 33; widening the sample is a spend decision) is explicitly called out in that document as needing Constantin, not a builder. This deck's naming fix in section 3 works whether or not R5 is ever acted on, but it does not substitute for it.

---

## 8. Handoff packet

```
---
id: (assigned by bg-orchestrator on write)
from: bg-copy
to: bg-web, bg-app
status: READY
scope_write: brandgeo/web/site.js, brandgeo/web/index.html (ring caption markup only),
             brandgeo-dashboard/src/pages/AuditReport.tsx
scope_read: docs/copy/audit-score-presentation-2026-08-14.md,
            docs/qa/audit-scoring-investigation-2026-08-14.md,
            brandgeo-dashboard/netlify/functions/get-audit-report.js
model: sonnet
---

## Decision
Replace the /100-led headline on all three audit surfaces with a measured
fraction, add the missing pre-empt sentence about searching one's own name,
rename the score label to "AI Visibility Score (screening sample)" rather
than inventing a new proper noun, and port the homepage widget's existing
plain-language engine-state phrasing into AuditReport.tsx, which never
inherited it.

## Do
1. bg-web: apply section 2.1's table to site.js, including the two-phase
   headline sequencing note (score-only, then fraction once engine_states
   lands).
2. bg-app: apply sections 2.2 and 2.3's tables to AuditReport.tsx, including
   the new "By AI engine" plain-language chip labels and the new "exact
   questions we asked" section header and intro line.
3. Both: add the shared pre-empt block from section 2.4 verbatim, in the
   placement described there.
4. bg-app: fix the "Something went wrong" error headline and the "about
   your business" loading line per section 5. These are guardrail
   violations independent of the score-presentation fix and should not
   wait on it.

## Do not
- Do not touch brandgeo-dashboard/src/pages/AIVisibility.tsx or any paid
  dashboard surface. Out of scope, see section 7 item 4.
- Do not remove or redesign the score ring itself. That is a bg-design
  layout call, flagged in section 7 item 3, not authorized here.
- Do not add mentioned_count, cells_checked, or prompts_asked to
  get-audit-report.js without Constantin's sign-off on section 7 items 1
  and 2. The full-view fraction in section 2.3 needs none of these
  fields and can ship first.

## Acceptance criteria
- No surface states a /100 score as the primary claim; the fraction leads.
- The pre-empt sentence appears on all three surfaces, unconditionally.
- "Something went wrong" no longer appears anywhere on this page.
- "About your business" no longer appears in any loading state on this page.
- AuditReport.tsx's per-engine chips read as plain phrases, not
  uppercase state names.
- The dash scan and the banned-vocabulary scan from the Operational
  Commands block both return nothing when run against the changed files.

## Open questions for Constantin
See section 7 of docs/copy/audit-score-presentation-2026-08-14.md.
```
