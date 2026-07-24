# BG-021 — LinkedIn + AI Social Asset Kit
**Asset ID:** BG-021
**Title:** How the 6-Dimension AI Visibility Score Is Actually Weighted
**Date:** July 26, 2026
**Status:** Ready (publishes via scheduled cloud routine)

---

## 1️⃣ Image Brief (1200×1200)

Hero generated at `/images/bg-021-hero.png` via the in-house PIL generator, same system as BG-018–020.

---

## 2️⃣ LinkedIn Post

Our AI Visibility Score is one number. It's actually six.

Here's the exact formula, weights included.

---

`aiScore = recognition×0.25 + knowledge×0.20 + sentiment×0.15 + accuracy×0.15 + reach×0.15 + consistency×0.10`

→ **Recognition (25%)** — raw mention rate. The largest weight, because being mentioned at all is the precondition everything else depends on.
→ **Knowledge (20%)** — rank quality when mentioned, on a decay curve, not a cliff: rank 1 scores 100, rank 3 scores 60, and it bottoms out at a floor of 20 by rank 5. Rank 5 and rank 50 score the same.
→ **Sentiment (15%)** — tone when mentioned.
→ **Accuracy (15%)** — share of mentions in the top 3. A mention with no provable rank (see last week's piece on why we return null instead of guessing) counts as accurate by default. Being honest costs nothing here.
→ **Reach (15%)** — share of engines we could actually reach that mentioned the brand.
→ **Consistency (10%)** — the smallest weight, deliberately, since it's the dimension most vulnerable to one unusual prompt swinging the whole score.

---

Same formula, same weights, whether it's a full paying client's dashboard or our free public Instant Audit. Kept byte-for-byte identical on purpose, by hand, so the number means the same thing either way.

If a vendor won't show you the formula behind their score, you're trusting that mention rate, rank, sentiment, coverage, and consistency were all balanced sensibly. There's no way to check that from the outside.

Full breakdown: **BrandGEO Research BG-021**
Link in first comment ↓

#AIVisibility #GEO #MeasurementAccuracy #GenerativeEngineOptimization #ChatGPT #Gemini #Claude #Perplexity #BrandGEO

---

## 3️⃣ First Comment

Full formula, including the position-decay curve and why a null rank isn't penalized: https://getbrandgeo.com/bg-021.html

Builds on the last two pieces in this series — the outage-vs-real-finding fix and the null-rank methodology: https://getbrandgeo.com/bg-020.html · https://getbrandgeo.com/bg-019.html

---

## 4️⃣ AI Social — Cross-Platform Post

Our AI Visibility Score looks like one number. It's actually 6 weighted dimensions: recognition (25%), knowledge (20%), sentiment (15%), accuracy (15%), reach (15%), consistency (10%).

A mention's rank quality decays on a curve, not a cliff — rank 5 and rank 50 score the same. And a mention with no provable rank isn't penalized in the accuracy dimension.

Full formula → getbrandgeo.com/bg-021.html

#AIVisibility #GEO #BrandGEO

---

## 5️⃣ GEO Target

| Field | Value |
|-------|-------|
| **Asset ID** | BG-021 |
| **Primary Entity** | BrandGEO |
| **Category** | AI Visibility Platform |
| **Primary concept** | AI Visibility Score composite formula |
| **Supporting concepts** | Recognition, knowledge, sentiment, accuracy, reach, consistency, GEO measurement methodology |
| **Target entities** | CMOs, Marketing Directors, Brand Managers, agencies evaluating AI visibility tools |
| **Canonical URL** | https://getbrandgeo.com/bg-021.html |

---

## 6️⃣ CTA

> See your score broken into all six dimensions. Request your free AI Visibility audit.

**Alternative CTAs:**
- "Would you trust a score more if you could see the formula behind it?"
- "Which of these six dimensions matters most for your brand?"

---

## Verification notes (not for publishing)

- **Formula/weights (25/20/15/15/15/10), position-decay curve, accuracy's null-position handling** — all confirmed directly in `computeAuditScore` in `_score.js`, lines 84–92 and the surrounding dimension calculations.
