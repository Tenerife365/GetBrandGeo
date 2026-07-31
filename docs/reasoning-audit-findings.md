# Reasoning & Logic Audit — First Pass (Master-Reasoning §8)

> **Date:** 2026-07-09 · **Lens:** Score accuracy / trustworthiness (Constantin's
> pick from §8.2) · **Status:** audit only, nothing shipped.
> **Files read:** `collect-prompt.js`, `collect-claude.js`, `collect-chatgpt.js`,
> `generate-recommendations.js` (+ the shared `analyseResponse` copied verbatim
> into all three collectors, per §2.1).
>
> This audits the *reasoning* behind the metrics — not code bugs, not styling.
> The question throughout: does the logic produce a number a client can trust?

---

## 0. How confident is each finding — and the data caveat

Every Tier 1 finding below is established **deductively from the code** — the
logic is visible and the flaw is structural, so confidence is high regardless
of data volume.

The production `ai_results` table is currently a **seed/test dataset, not real
traffic**: 31 total rows (27 `ok`, 4 `error`), 4 clients, 6 distinct prompts,
all collected in a 3-day window (2026-07-06 → 07-08). Only **14 rows** have
`brand_mentioned = true`. That is far too small to *prove* any distributional
claim. Where the data can speak, it is quoted below as *corroboration, not
proof*, and labelled as such.

A meta-point falls out of this: there isn't enough data flowing through the
system for the product to validate its own metrics. That is itself an argument
for the freshness/scheduled-collection thread (deferred here, since the lens is
accuracy).

---

## 1. Tier 1 — the headline numbers are not trustworthy

These four feed the Overview AI Visibility Score, the AI Visibility page, and
the Brand Sentiment page — i.e. everything a client looks at.

### 1.1 Sentiment is "does a positive word appear *anywhere* in the response"

**Where:** `analyseResponse`, the `posWords`/`negWords` block.

```js
const posWords = ['recomandat','recomandam','recommend','best','top','excelen',
                  'calitat','profesional','lider','prima','leading','trusted','award']
if (mentioned) {
  if (posWords.some(w => lower.includes(w))) sentiment = 'positive'
  else if (negWords.some(w => lower.includes(w))) sentiment = 'negative'
}
```

`lower` is the **entire response text**, not the clause about the brand. The
prompts are commercial "best X" queries, so the words `best`, `top`,
`recommend`, `leading` are *guaranteed* to appear in almost every response.
Result: a brand is scored `positive` because the listicle it sits in contains
the word "best" — even if the sentence about the brand is neutral, or negative
("cheaper but lower-quality options like Brand X").

Consequences:
- **Sentiment ≈ constant positive whenever mentioned.** The entire Brand
  Sentiment page (#83) — score, per-engine breakdown, trend — is built on a
  signal with almost no discriminating power for this prompt type.
- **Positive is checked before negative** (`if pos else if neg`), so any
  response containing both words resolves positive.
- **Non-RO/EN markets always score `neutral`.** The word lists are Romanian +
  English only. A German or French client gets zero sentiment signal — a §4.1
  Scalability-Rule violation sitting in the flagship metric.

*Data (corroboration, n=14):* 11 positive / 2 neutral / 1 negative = 79%
positive. Consistent with "leans positive," not conclusive at this n.

**Fix direction:** score sentiment on the **brand's own sentence/clause**, not
the whole document — and ideally with an LLM-based or at least
proximity-windowed classifier rather than a global keyword `OR`. This is the
highest-leverage single fix for trust, because a whole product page depends on
it.

**✅ Part (a) FIXED 2026-07-09 (audit step 2).** Added `extractBrandContext()`
to `_analysis.js`: splits the response at sentence boundaries + newlines, keeps
only the segment(s) that mention the brand, and sentiment now scans *that*, not
the whole doc. Decision rule made conservative: positive-and-not-negative →
`positive`, negative-and-not-positive → `negative`, **both-or-neither →
`neutral`** (a mixed or signal-less mention no longer coin-flips to positive).
Verified on 6 fixtures incl. the exact bug (a "best X" listicle with a neutral
brand line now scores `neutral`, was `positive`). **Note:** existing `ai_results`
rows keep their old sentiment; only newly collected / force-refreshed rows get
the corrected scoring.

**Part (b) — RO lexicon expansion (partial, 2026-07-09).** A live force-refresh
right after shipping (a) exposed the flip side: the thin RO word list now
*under*-claimed genuine praise — a 🥇 #1 *"Recomandarea #1 … cea mai potrivită
alegere"* (prod id 1559) and an *"în primul rând"* first-pick (id 1553) scored
`neutral`. Expanded the pos/neg lists with **stem-based** RO/EN terms drawn from
that data (`recomand` covering recomandat/recomandăm/recomandare/recomandarea,
`potrivit`, `primul rând`, `cea mai bun`, `de încredere`, `premiat`, `ideal`,
`🥇`; negatives `nu recomand`, `dezamăg`, `plânger`, `prost`). Re-verified all
6 originals + 4 real-data cases (10/10). Known keyword limits remain: explicit
negation ("nu recomand …") resolves to `neutral` not `negative` (the pos stem
also matches), and any non-RO/EN language or novel phrasing is still uncovered.
**The long-term fix stays open:** LLM-based classification of the brand clause
(multilingual, nuance-aware) — a cost/latency decision (§8.2 lens (d)), not the
whack-a-mole lexicon path.

### 1.2 `brand_position` blends list-rank with sentence-index (two different units)

**Where:** `analyseResponse` position logic + `detectListPosition` fallback.

```js
if (brandInList)   position = brandInList.pos          // rank in a numbered list (good)
else if (mentioned) position = detectListPosition(...)  // fallback
```

`detectListPosition`, when the brand is **not** in a numbered list, falls
through to:

```js
const sentences = text.split(/(?<=[.!?])\s+/)
for (let i = 0; i < sentences.length; i++)
  if (matchesAlias(sentences[i], ...)) return i + 1   // <-- sentence index
```

So `brand_position` stores **either** "ranked #3 of 10 caterers" **or**
"appeared in the 9th sentence of prose" in the same column — different units,
same field. Any `avgPos` (shown to clients, and fed to the recommendation
engine as `avg position #N`) averages them together. A brand mentioned in
passing deep in a paragraph gets a large position that drags its average down
as if it ranked poorly on a list.

*Data (important honesty check):* in the current 14-row sample, every
`brand_position` is 1–10 (max 6), so the leakage has **not yet** corrupted live
data — every mentioned brand here happened to be in a list. This is a **latent
correctness bug**: it fires the moment a brand is mentioned only in prose
(common in Claude/Meta, which list less than ChatGPT/Perplexity). Verified by
code, not yet by data.

**Fix direction:** don't overload one column. Either (a) only record a position
when it's a genuine list rank and leave prose mentions `null`, or (b) add a
`position_kind` ('list_rank' | 'prose_order') so stats can filter. Never average
the two.

**✅ FIXED 2026-07-09 (audit step 4).** Took option (a) — no schema change.
`detectListPosition` no longer falls back to the sentence index; a prose mention
(brand present but not in a numbered list) now returns `null`, so `brand_position`
holds only genuine list ranks and `avgPos` is computed from ranks alone. Also
added a `1..50` guard so a year/price that leads a line ("2019. Brand expanded…")
isn't read as rank 2019. Verified: real list rank kept (2), rank #7 beyond the
top-5 parser still recovered, prose mentions → null (were sentence indices 1/3),
"2019." → null. `brand_mentioned` is unchanged for prose mentions (still true) —
only the fake rank is removed.

### 1.3 Mention detection is substring matching with no word boundaries

**Where:** `matchesAlias` + the `mentionedInText` block.

```js
return aliases.some(a => sl.includes(a)) ||
       aliasesStripped.some(a => a && sls.includes(a)) ||   // space-stripped both sides
       (website && sl.includes(website))
```

Two compounding problems:
- **No tokenization.** `includes()` matches an alias inside a larger word. Short
  or common aliases are dangerous, and `analyseResponse` allows 2-char aliases
  (`length >= 2`). A brand aliased "ON" or "Ace" matches inside "restaurati**on**",
  "sp**ace**", etc.
- **The space-stripped pass widens the blast radius.** `aliasesStripped` and
  `lowerStrip` remove *all* spaces before matching, so an alias like "the loft"
  → `theloft` can match across word boundaries in the stripped text that it
  never would with spaces intact.

This is the most load-bearing function in the product — "is my brand mentioned"
is *the* number — and it has no boundary logic. It systematically **inflates**
mention rate (false positives), and inflation is silent because nobody notices
a `true` that should be `false`.

**Fix direction:** match on word boundaries (`\b` / token split), set a minimum
alias length or require whole-token match for short aliases, and drop or
tightly guard the space-stripped pass (keep it only for known multi-word brands
where it's demonstrably needed, e.g. "Bucate pe Roate" → "bucateperoate").

**✅ FIXED 2026-07-09 (audit step 3).** Replaced substring matching (and the
inlined `mentionedInText` substring check — the real headline-metric path) with a
per-alias **boundary-anchored, separator-flexible regex**: `buildAliasRegex`
turns "brand geo" into `(?<![\p{L}\p{N}])brand[\s_.-]*geo(?![\p{L}\p{N}])`, so it
matches "brand geo"/"brandgeo"/"brand-geo" but never inside a larger word.
Unicode `\p{L}\p{N}` boundaries so Romanian diacritics count as letters.
`buildBrandMatchers(cfg)` precompiles the alias+website matchers once;
`matchesAlias(text, matchers)`, `detectListPosition`, `extractBrandContext`,
`scanForKnownCompetitors` and the snippet centring all use it. Verified against
the real client aliases: "bpr" matches standalone but not inside "subprocess";
"brandgeo" no longer matches inside "rebrandgeography"; smushed/dashed/website/
phrase forms still match. **Known gap left open (a false-*negative*, separate
from 1.3's false-positive focus):** matching is diacritic-sensitive, so an ASCII
alias ("paunescu si asociatii") still won't match diacritic text ("Păunescu și
Asociații") — worth a later diacritic-folding pass.

### 1.4 Claude's 2500-char abort turns low-ranked brands into false negatives

**Where:** `callClaude` in `collect-claude.js` (and `collect-prompt.js`).

```js
max_tokens: 1000,               // ~4000 chars of possible output
const MAX_TEXT = 2500           // stream cancelled here
if (text.length >= MAX_TEXT) { partial = true; reader.cancel('enough'); break outer }
```

The stream is cut at 2500 chars — roughly the first 60% of a capped response.
A brand ranked #7–10 in a "top 10" list frequently lives *past* char 2500 and
is never seen → recorded as **not mentioned**. The abort was added for latency
(web search can take 24–26s), so this is a direct **latency-for-correctness**
trade on the core metric, and the error is biased (always drops the *tail* of
the list, i.e. the brands that most need to know they're ranking low).

Two secondary notes:
- The truncation also underlies §2.3's known competitor-miss, but the
  mention false-negative is the more serious one because it hits the headline
  number.
- **Doc/code mismatch:** CLAUDE.md §1.2 describes Claude as "training-data mode
  (no web search)," but the code sends the `web_search_20250305` tool with
  `max_uses: 1`. One of the two is stale — worth reconciling, because "does
  Claude search the web" changes how its results should be interpreted vs. the
  other engines.

*Data (corroboration, weak):* Claude mention rate is 50% (5/10) — tied lowest
with Gemini, below ChatGPT (75%, n=4) and Perplexity (60%, n=5). Consistent
with mild depression, but n is far too small to attribute to truncation.

**Fix direction:** raise or remove `MAX_TEXT` and instead bound by *time*
(abort on a wall-clock budget, not a char count), or lower `max_tokens` and let
the full (shorter) response complete. Either way, stop cutting mid-list.

---

## 2. Cross-cutting accuracy multiplier

### 2.1 `analyseResponse` was copied into three files — ✅ EXTRACTED 2026-07-09

Every Tier 1 fix must be made **once**, not three times. This was the enabling
risk for all of Section 1, so it was done first.

**Done:** extracted the whole analysis pipeline (`normalizeText`,
`extractTopRankedResults`, `matchesAlias`, `NOT_A_COMPANY`/`isCompanyName`,
`scanForKnownCompetitors`, `detectListPosition`, `analyseResponse`) into
`netlify/functions/_analysis.js` (underscore-prefixed so Netlify doesn't expose
it as an endpoint, same convention as `_auth.js`). All three collectors now
`require('./_analysis')` and call the shared `analyseResponse`; ~175 duplicated
lines removed from each. Pure functions, no I/O — unit-testable, and the
helpers are exported for the upcoming fixes' fixtures.

**The drift was already real, not hypothetical.** A byte-level diff before
extraction found `collect-chatgpt.js` split ranked-list names on `[--]` (two
ASCII hyphens) while `collect-prompt.js`/`collect-claude.js` used `[–—]`
(en/em-dash). So ChatGPT had been extracting competitor/brand names slightly
differently from the other engines — exactly the §2.1 drift this warns about.
The shared module standardises on `[–—]` (the majority form, and the one LLM
listicles actually emit: "Brand — tagline"). This is the **one intentional
behavioural change** in the refactor; everything else is byte-preserving.

**Verification:** all four files pass `node --check`; the shared module was
runtime-tested on a fixture (brand matched at correct list position, competitors
extracted, em/en-dash split working). Not yet built on Netlify or committed —
see the handoff. The next fixes (sentiment → mention → position → truncation)
now land in this one file, each behind a fixture.

---

## 3. Lower-tier findings (recorded for later threads, out of the accuracy lens)

These are real but belong to the actionability / freshness / cost lenses
Constantin de-prioritized for this pass. Captured so the next session doesn't
rediscover them.

- **Single-tenant filters in the shared core.** `NOT_A_COMPANY` (Romanian
  abstract nouns) and `CATERING_STRIP_RE` (`catering|events|restaurant`) are
  applied to *every* client regardless of vertical/language. §4.1 violation;
  would wrongly strip "Events" from a firm named "Events Co." *(Data: 10/27 ok
  rows carry a `pos:99` prose-competitor, so this path is active.)*
- **`pos:99` sentinel skews competitor `avgPos`.** Prose-matched known
  competitors are stored at position 99; any average over competitor positions
  is distorted. Use `null`, not 99.
- **Geo is a prompt prefix, not real geolocation, for 4 of 5 engines.** Only
  ChatGPT passes `user_location` to its search tool. Gemini/Claude/Perplexity
  run their web search from the US Netlify IP; the "You are a user based in X"
  sentence doesn't move the SERP. Cross-market comparisons are only truly
  geo-accurate for ChatGPT. (§8.1 item 3.)
- **Prose competitors are invisible unless already known.** List-regex only;
  unknown competitors named in prose are dropped.
- **Recommendation prompt primes fabrication.** Its worked example
  ("…because [competitor] appears immediately after their Trustpilot rating is
  cited") is a template for asserting mechanisms not present in the data; Haiku
  will pattern-match it into inventing citations. Also `absent_snippets` pass
  `text.slice(0,300)` (top of response), which often doesn't contain the
  competitor the rec is meant to explain. Recs aren't stored → ROI unprovable.
- **"Mentioned" conflates "recommended #1" with "named as a bad example."**
  Central product-framing gap; ties into 1.1 and 1.3.
- **Monthly dedup vs. on-demand usage.** Non-force runs skip if any non-error
  row exists "this month," so a client can't re-check whether a fix worked
  without a force-delete, and runs straddling a month boundary look like a
  monthly trend.

---

## 4. Suggested sequence for the accuracy work

1. ✅ **DONE 2026-07-09 — Extract `analyseResponse` → `_analysis.js`** (§2.1).
   One-place, testable. Behaviour-preserving except the ChatGPT dash
   reconciliation noted in §2.1. Not yet committed/deployed.
2. ✅ **DONE 2026-07-09 — Fix sentiment (1.1a)** — brand-clause-scoped via
   `extractBrandContext`, both/neither → neutral. Fixture at
   `tests/analysis.test.js`. Part (b), multilingual, still open.
3. ✅ **DONE 2026-07-09 — Fix mention matching (1.3)** — boundary-anchored,
   separator-flexible per-alias regex (`buildBrandMatchers`/`buildAliasRegex`).
   Diacritic-folding for the paunescu-type false-negative left open.
4. ✅ **DONE 2026-07-09 — Fix position (1.2)** — prose mentions → null (no
   sentence-index fallback), list-rank guarded to 1..50.
5. **Fix Claude truncation (1.4)** — time-bound, not char-bound.
6. Add a small **unit-test fixture** of real response snippets asserting each
   of the above, so the three-copy drift risk (§2.1) can't silently reappear.

Each is independently shippable and independently verifiable against a fixture —
good fits for scoped Task chats under the parallel-work window.
