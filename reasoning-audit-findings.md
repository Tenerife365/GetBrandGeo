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

### 2.1 `analyseResponse` is copied into three files (§2.1, reaffirmed)

Every Tier 1 fix above must be made **identically in three places**
(`collect-prompt.js`, `collect-claude.js`, `collect-chatgpt.js`). They are
currently byte-identical, but three copies means a fix can land in two and
drift in the third — and there is no test asserting they match. **This is the
enabling risk for all of Section 1:** extracting `_analysis.js` first makes the
accuracy fixes a one-place change and lets them be unit-tested. Recommended as
the *first* concrete step of any accuracy work, before touching the logic.

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

## 4. Suggested sequence for the accuracy work (if pursued)

1. **Extract `analyseResponse` → `_analysis.js`** (§2.1). Enables everything
   else as a one-place, testable change. No behaviour change — safe first step.
2. **Fix sentiment (1.1)** — brand-clause-scoped, not whole-document. Highest
   trust impact (whole page depends on it).
3. **Fix mention matching (1.3)** — word boundaries + short-alias guard.
4. **Fix position (1.2)** — stop blending units.
5. **Fix Claude truncation (1.4)** — time-bound, not char-bound.
6. Add a small **unit-test fixture** of real response snippets asserting each
   of the above, so the three-copy drift risk (§2.1) can't silently reappear.

Each is independently shippable and independently verifiable against a fixture —
good fits for scoped Task chats under the parallel-work window.
