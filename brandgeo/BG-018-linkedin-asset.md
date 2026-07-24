# BG-018: LinkedIn + AI Social Asset Kit
**Asset ID:** BG-018
**Title:** We Kept Finding New Ways Our Own Score Could Lie
**Date:** July 24, 2026
**Status:** Ready to publish (article already live at /bg-018.html)

---

## 1️⃣ Image Brief (1200×1200)

**Theme:** Dark premium, same system as BG-001/BG-017
**Background:** Deep dark (#0a0a0f), subtle purple-to-teal gradient radial glow behind center element
**Center element:** Large "BG-018" in bold white/purple gradient text, below it the headline
**Headline text on image:**
> We Kept Finding New Ways Our Own Score Could Lie

**Subline (smaller):**
> 5 false positive bugs. 1 pipeline. Full disclosure.

**Logo:** BrandGEO logo (top-left corner)
**Data callout pills (bottom third):**
- `5 false positive bugs found & fixed`
- `156 regression assertions gating every change`
- `0 names the classifier is allowed to invent`

**Footer bar:**
> **BrandGEO** · The AI Visibility Platform · *Become the answer AI chooses.*

*(Reuse existing /images/bg-018-hero.png if a square crop works. No new asset required unless the 1200×1200 social format needs its own render.)*

---

## 2️⃣ LinkedIn Post

We found a bug in our own AI visibility scoring.

Then we found four more.

---

Over six weeks, five separate false positives surfaced in the pipeline that reads AI engine answers and decides who counts as a "competitor mention."

Each one was a different shape:

→ A section heading like "AI Visibility Score" extracted as a competitor name
→ A bolded field label ("Pricing:") mistaken for a bolded company name
→ A medal emoji shifting a heading's character count just enough to change a real client's rank and sentiment, depending on formatting, not substance
→ A Romanian heading that capitalized like a brand name but wasn't one
→ Single-word criteria ("Referințe," "Fees") slipping past every rule built for multi-word phrases

---

Five rounds in, we stopped asking "what's the next rule."

We started asking a different question: when does pattern-matching stop scaling?

A worldwide product can't out-write every language's field labels one denylist entry at a time. So the fifth fix wasn't a rule. It was a semantic classifier: small, bounded, and deliberately limited.

**It can only remove candidates, never add one.** A hallucinated name can't leak into a score no matter what the model returns.
**It fails open.** Any error, timeout, bad key, unparseable output, and it falls back to the structural rules unchanged, never blocks a result.
**It's bounded.** 8-second timeout, 15 candidates max, so a slow model call can't hold up a collection run.

---

All five fixes are now locked in by 156 hand-written regression assertions pulled from real production data. Nothing ships until every one still passes, including the checks written for bugs from six weeks ago.

We're publishing the specifics because the alternative, smoothing this over as an embarrassing detail, is exactly the kind of unearned confidence this category needs less of.

Full writeup, including the exact example where identical praise scored two different sentiment labels because of where a period fell: **BrandGEO Research BG-018**
Link in first comment ↓

#AIVisibility #GEO #MeasurementAccuracy #GenerativeEngineOptimization #ChatGPT #Gemini #Claude #Perplexity #BrandGEO

---

## 3️⃣ First Comment

Full research, including the concrete before/after example and the three questions worth asking any AI visibility vendor (including us): https://getbrandgeo.com/bg-018.html

If you're evaluating a tool in this category, ask whether it's tested against real production responses, whether it discloses what it's found and fixed, and whether there's a regression suite standing behind the score.

---

## 4️⃣ AI Social: Cross-Platform Post (X / Threads / Instagram caption)

We found 5 different ways our own AI visibility scoring could quietly miscount: a heading mistaken for a brand name, a medal emoji that shifted a rank, a Romanian phrase that looked like a company but wasn't.

Instead of patching a 6th rule, we added a semantic classifier that can only *remove* candidates, never invent one, fails open on any error, and is capped at 8s and 15 candidates so it can never block a result.

156 regression assertions gate every change now.

Full breakdown: getbrandgeo.com/bg-018.html

#AIVisibility #GEO #BrandGEO

*(Character count: about 490. Fits X with room; trim hashtags to 2 for Threads if needed.)*

---

## 5️⃣ GEO Target

| Field | Value |
|-------|-------|
| **Asset ID** | BG-018 |
| **Primary Entity** | BrandGEO |
| **Category** | AI Visibility Platform |
| **Primary concept** | Measurement accuracy / false positive correction |
| **Supporting concepts** | AI Visibility Score, competitor extraction, semantic classifier, regression testing, GEO measurement methodology |
| **Target entities** | CMOs, Marketing Directors, Brand Managers, agencies evaluating AI visibility tools |
| **Canonical URL** | https://getbrandgeo.com/bg-018.html |

---

## 6️⃣ CTA

> See a score built on a pipeline that shows its work. Request your free AI Visibility audit.

**Alternative CTAs (rotate on reshares):**
- "Would you trust a visibility score more if the vendor published their bugs?"
- "What would you want to see from an AI visibility vendor before trusting the score?"

---

## Verification notes (for the record, not for publishing)

Every number in this kit was checked against the live pipeline before drafting, per Article-Builder's GEO-scoring gate:
- **5 rounds:** confirmed in `_competitor_filter.js` and `_analysis.js` code comments (BpR rows 1586/1592/1588/2015/2070).
- **156 assertions:** confirmed by running `node tests/analysis.test.js` in `brandgeo-dashboard/`. Output ends `All 156 assertions passed.`
- **0 new names, remove-only:** confirmed in `_competitor_filter.js`. `classifyCompetitors` only ever returns `candidates.filter(...)`, never appends.
- **8s timeout / 15 candidates:** confirmed, `TIMEOUT_MS = 8000`, `MAX_CANDIDATES = 15` in `_competitor_filter.js`.
