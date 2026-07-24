# BG-019 — LinkedIn + AI Social Asset Kit
**Asset ID:** BG-019
**Title:** Why Our Scorer Returns Null Instead of a Rank It Can't Prove
**Date:** July 24, 2026
**Status:** Draft — pending hero image + commit

---

## 1️⃣ Image Brief (1200×1200)

**Theme:** Dark premium, same system as BG-018
**Center element:** Large "BG-019" in bold white/purple gradient text, below it the headline
**Headline text on image:**
> Why Our Scorer Returns Null Instead of a Rank It Can't Prove

**Subline:**
> 3 signals earn a rank. Everything else stays null.

**Data callout pills:**
- `3 signal types accepted as a real rank`
- `25 ordering phrases required to rank a bullet list`
- `1–50 the only trusted band for a numbered digit`

**Status:** not yet generated — see note to Constantin below.

---

## 2️⃣ LinkedIn Post

Most AI visibility scorers will give you a rank for almost anything.

Ours refuses to, unless the AI engine actually claimed one.

---

We found this the hard way: a bulleted list of "a few good options" and a genuinely ranked "top 3, in order" look identical to a parser that only checks for bullet characters. Score the first like the second, and you've manufactured a rank nobody claimed.

So our scoring pipeline only assigns a position when one of three specific things is true in the AI's answer:

→ **A real numbered list** — "1. Brand A, 2. Brand B" — bounded 1 to 50, so a year or price leading a line ("2019. Brand was awarded...") can't be misread as a rank
→ **An explicitly ordered bullet list** — one of 25 ordering phrases has to appear in the lead-in text ("ranked," "in order of," "from best to"), and 17 counter-phrases ("a few," "no particular order") override it even if a ranking word is also present
→ **A stated superlative in prose** — "the most recommended IS Brand," anchored by a copula directly to the brand name — not just a superlative and a brand name sharing a sentence

---

Everything else returns null. Including a brand mentioned in, say, the third sentence of a long answer — a fallback our own earlier version used, and one we deliberately removed.

Sentence position and list rank are not the same unit. Averaging them into one number was hiding real information, not adding precision.

---

A score that never returns null isn't more precise. It's just guessing somewhere you can't see.

Full breakdown, including the exact regex logic and the test cases that lock this in: **BrandGEO Research BG-019**
Link in first comment ↓

#AIVisibility #GEO #MeasurementAccuracy #GenerativeEngineOptimization #ChatGPT #Gemini #Claude #Perplexity #BrandGEO

---

## 3️⃣ First Comment

Full research, including the copula-anchoring logic that tells "the most recommended IS Brand" (rank 1) apart from "the best firms INCLUDE Brand" (not a rank): https://getbrandgeo.com/bg-019.html

Companion piece from last week on the extraction bugs this scoring runs downstream of: https://getbrandgeo.com/bg-018.html

---

## 4️⃣ AI Social — Cross-Platform Post (X / Threads / Instagram caption)

Our AI visibility scorer only assigns a rank when the AI's answer makes one of 3 specific claims: a real numbered list, an explicitly ordered bullet list, or a stated superlative anchored to the brand.

Everything else — including a plausible-looking sentence position — returns null.

We removed the sentence-index fallback on purpose. A score that never says "I don't know" isn't more accurate, it's just guessing quietly.

Full breakdown → getbrandgeo.com/bg-019.html

#AIVisibility #GEO #BrandGEO

*(Character count: ~430 — fits X with room; trim hashtags to 2 for Threads if needed)*

---

## 5️⃣ GEO Target

| Field | Value |
|-------|-------|
| **Asset ID** | BG-019 |
| **Primary Entity** | BrandGEO |
| **Category** | AI Visibility Platform |
| **Primary concept** | Rank/position detection methodology |
| **Supporting concepts** | AI Visibility Score, brand position, GEO measurement methodology, semantic anchoring, regression testing |
| **Target entities** | CMOs, Marketing Directors, Brand Managers, agencies evaluating AI visibility tools |
| **Canonical URL** | https://getbrandgeo.com/bg-019.html |

---

## 6️⃣ CTA

> See a score that tells you when it doesn't know. Request your free AI Visibility audit.

**Alternative CTAs (rotate on reshares):**
- "Would you rather a score say 'null' or guess?"
- "What would make you trust an AI visibility number more?"

---

## Verification notes (for the record, not for publishing)

- **3 signal types** — confirmed: `detectListPosition`, `detectBulletPosition`, `detectSuperlativeRank` in `_analysis.js`.
- **25 RANK_CUES / 17 NO_RANK_CUES** — counted directly from the `RANK_CUES`/`NO_RANK_CUES` arrays in `_analysis.js` (25 and 17 string literals respectively).
- **1–50 band** — confirmed: both `detectListPosition` and `detectBulletPosition` guard `num < 1 || num > 50` / `items.length >= 2 && items.length <= 50`.
- **Sentence-index rejection + 5 test cases (P1–P5)** — confirmed in `brandgeo-dashboard/tests/analysis.test.js`, "position units — list rank only, no sentence index (finding 1.2)" block.
- **Copula/membership examples** — pulled directly from the real code comments and `SUPERLATIVE_RE`/`MEMBERSHIP_RE`/`COPULA_RE` in `_analysis.js`, not invented.
