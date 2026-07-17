# Brief — `_analysis.js` extraction & sentiment gaps (round 4)

**For:** a `Master-Reasoning` session.
**From:** `Master-Debug` (#109/#110/#111), 2026-07-13.
**Scope:** `brandgeo-dashboard/netlify/functions/_analysis.js` + `tests/analysis.test.js`.
**Nothing here is fixed.** All four findings are open.

---

## Why these surfaced now, and why they weren't visible before

#109 fixed a silent-failure bug that had kept Gemini at **zero rows, ever**, for BpR.
#110 fixed the same bug in the prospect pipeline. The OpenAI quota was topped up on
2026-07-13.

**As of 2026-07-13 07:23, BpR collected all 5 engines successfully for the first
time** (prompt 238, rows 2013–2017: chatgpt/gemini/claude/meta/perplexity, all
`status='ok'`, zero error rows). That first clean cross-engine sample is what exposed
these four. They are **not** regressions from #109/#110/#111 — they are pre-existing
`_analysis.js` gaps that were previously masked by missing data.

All four are **client-agnostic** (they live in the shared analysis module) and affect
**both** the paying-client pipeline (`ai_results` → dashboard) and the **public
prospect scorecard** (`prospect_audits` → `AuditReport.tsx`), which is the outbound
sales asset. Treat prospect-facing impact as the priority lens.

---

## Finding 1 🔴 — A certification standard is extracted as a competitor

**Row 2015** (perplexity, client 1, prompt 238) stored:

```json
[{"pos":1,"name":"Premier Catering & Events"},
 {"pos":2,"name":"FSSC 22000"},              // ← not a company
 {"pos":3,"name":"Pastel Lab Catering"},
 {"pos":4,"name":"A la Catering"}]
```

`FSSC 22000` is a food-safety certification standard. It reaches the competitor list
because `looksLikeBrandName` accepts a token that is uppercase-plus-digits, and
`RANK_LABEL_RE` only rejects `Band 2` / `Tier 1`-shaped labels.

This is the **same class** as the false positives already fixed in §8.10 (instructional
headings), §8.11 r2 (bold section headings) and §8.11 r3 (colon field labels / numbered
criteria) — a non-company noun phrase passing the brand-name gates.

**Note the domain interaction:** BpR's own prompt 243 explicitly asks about
`HACCP / ISO 22000` certification, so certification names will recur across this
client's whole prompt set, not just once.

**Suggested direction:** a standards/certification rejector — `ISO \d+`, `HACCP`,
`FSSC \d+`, `SOC ?2`, `GDPR`, `PCI[- ]DSS`, `IFS`, `BRC`, and the general shape
`^[A-Z]{2,6} ?\d{3,5}$`. Structural where possible, denylist only where it must be.
Careful not to break real brands containing digits (`Capsule CRM`, `Monday.com`,
`7-Eleven`).

---

## Finding 2 🟠 — The same competitor is counted twice (name + bare domain)

**Row 2017** (claude, same prompt) stored:

```json
[{"pos":2,"name":"Premier Catering & Events"},
 {"pos":3,"name":"Chat Noir Catering"},
 {"pos":4,"name":"premiercatering.ro"}]     // ← same company as pos 2
```

Two defects in one:

1. A **bare domain** is accepted as a competitor *name*.
2. **Dedupe does not recognise a domain and a company name as the same entity**, so
   Premier Catering is counted twice.

Impact: inflates competitor counts and distorts the leaderboard on `Competitors.tsx`
(and `competitor_flags` on the prospect scorecard). §13.6 already flagged the
leaderboard as fragile — this compounds it.

**Suggested direction:** either drop bare-domain candidates, or normalise them
(`premiercatering.ro` → `premiercatering`) and fold them into the dedupe key used for
the existing name matching. `cleanCandidateName` is the natural home.

---

## Finding 3 🟠 — Sentiment misses explicit RO praise; engines disagree on the same brand

Prompt 238, same brand, same day, four engines that mentioned BpR:

| engine | sentiment | verdict |
|---|---|---|
| chatgpt | positive | ✅ |
| gemini | positive | ✅ |
| perplexity | positive | ✅ |
| **claude** | **neutral** | ❌ **wrong** |

Claude's actual text (row 2017, verbatim):

```
Iată recomandările mele principale:

## 🥇 1. Bucate pe Roate / Carte Blanche — *Alegerea #1 pentru C-level*

Aceasta este, fără îndoială, cea mai solidă opțiune pentru un eveniment de
anvergură cu VIP-uri.
```

*"The #1 choice for C-level"*, *"without doubt the most solid option"*. That is
unambiguous praise, scored `neutral`.

The heading-rank fix (§8.12) worked — `brand_position = 1` was captured correctly. The
**sentiment lexicon** is what missed: `alegerea #1`, `fără îndoială`, `cea mai solidă`
are not in the RO word lists. This is finding **1.1b** (keyword-based sentiment,
RO/EN-only) hitting real client data.

**This is not cosmetic.** BpR's Brand Sentiment score is being pulled down by a
vocabulary gap rather than by anything an engine actually said, and it makes Claude look
like the outlier engine when it is in fact the most flattering.

**Suggested direction:** two options, and this needs a decision, not a patch:
- **(a)** Extend the RO/EN stems again (cheap, but this is the third lexicon expansion
  — §8.6 step 2b was the last; the pattern of "add words when a client complains" does
  not scale to a worldwide ICP per `GTM-STRATEGY.md`).
- **(b)** Replace keyword sentiment with a cheap LLM classification of the brand clause
  only (already scoped in §8.2 lens (d) and §8.6's note as the real long-term fix).
  `extractBrandContext` already isolates exactly the text that would need classifying,
  so the input is small and the cost is bounded.

Recommend (b), or (a) explicitly framed as a stopgap with (b) scheduled.

---

## Finding 4 🟠 — Prose #1 loses to a listed #2: the dashboard can invert a win

**Row 2015** (perplexity). The response says, verbatim:

> "firma de catering **cea mai recomandat** este **Bucate pe Roate**, urmată de
> **Premier Catering & Events**"

("the most recommended catering firm is **Bucate pe Roate**, followed by **Premier
Catering & Events**")

Stored: `brand_position = null`, and the extracted top-results list is
`Premier Catering & Events` at **#1**.

So BpR is named as the #1 recommendation in prose, while the UI renders a competitor at
#1 and BpR nowhere in the list. **The engine gave BpR the win and the product displays a
loss.** For a client this is a credibility problem; on a prospect scorecard it is worse,
because "a competitor was named instead of you" is exactly the loss-aversion hook
`computeGapsAndFlags` is built around — and here it would be false.

**Why:** `detectListPosition` only reads numbered lists; the brand is in prose while the
bullets/numbers hold only the other firms. §8.8 (finding 1.2) *deliberately* made prose
mentions `null` rather than fabricate a sentence-index rank, and that decision was
correct. #111 added bullet-rank but only for lead-ins that declare an ordering, which
this is not.

**So this is a genuinely new sub-problem, not a re-litigation of 1.2:** an explicit
*superlative claim about the brand* ("cea mai recomandată", "the top choice", "our #1
pick") is a **stated rank of 1**, not an inferred position. It is a different signal from
list order.

**Suggested direction:** detect an explicit superlative-rank claim scoped to the brand
clause (reuse `extractBrandContext`, which already isolates it) and treat it as
`position = 1`. Guard hard: it must be a claim about *the brand*, not a generic
superlative floating in the document — that guard is the whole risk, and the fixture
below is the counterexample to protect.

---

## Fixtures to write (all verbatim from live rows, 2026-07-13)

| id | engine | prompt | asserts |
|---|---|---|---|
| 2015 | perplexity | 238 | `FSSC 22000` NOT a competitor; the 3 real firms kept; brand gets `position = 1` from the superlative claim (finding 4) |
| 2017 | claude | 238 | `premiercatering.ro` folded into `Premier Catering & Events` (one entry, not two); sentiment `positive`, not `neutral`; `position = 1` still captured (regression guard for §8.12) |
| 2013–2016 | all | 238 | cross-engine sentiment agreement: all four mentioning engines score `positive` |

Counterexamples that must NOT regress:
- A generic superlative with the brand merely present ("Cele mai bune firme includ
  Bucate pe Roate") must stay `position = null` — §8.8's rule still holds.
- Real digit-bearing brands (`Capsule CRM`, `Monday.com`, `7-Eleven`) must survive the
  certification rejector.
- The 112 existing assertions in `tests/analysis.test.js` must all still pass.

Run with:
```
cd "C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard"
node tests/analysis.test.js
```

---

## Suggested order

1. **Finding 1** (certification rejector) — smallest, best-precedented, clear win.
2. **Finding 2** (domain dedupe) — small, contained in `cleanCandidateName`.
3. **Finding 4** (superlative rank) — needs care; the guard is the hard part.
4. **Finding 3** (sentiment) — needs a **decision** (lexicon vs. LLM) before code.

1 and 2 can share a commit. 3 and 4 deserve their own.

---

## Operational notes

- These are **Netlify functions**: `npm run build` does NOT exercise them (§8.5).
  `node tests/analysis.test.js` + Netlify's esbuild bundling at deploy are the real
  validation.
- ⚠️ **`_analysis.js` runs at collection time and its output is STORED.** Fixing it
  changes nothing about existing `ai_results` rows — they keep the analysis they were
  written with. Corrections only appear on **re-collection** (Force Refresh). Plan a BpR
  Force Refresh after these land, and do not expect historical rows to heal themselves.
- ⚠️ **The bash sandbox mount goes stale on this file** ([[brandgeo_bash_mount_staleness]]).
  `node --check` via the mount reported a truncated file repeatedly during #109/#111.
  Verify via the Read tool, or run node from PowerShell on the real path.
- ⚠️ **Another BrandGEO session was mid-flight on 2026-07-13** — `HEAD` was `8b7496c`
  (SCALE-SPEC engine costs) with **uncommitted** changes to
  `netlify/functions/_prospect_engines.js` and `src/pages/Prompts.tsx`. Check
  `git status` and serialize git (§0) before committing.
