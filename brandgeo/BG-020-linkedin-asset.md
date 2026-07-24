# BG-020 — LinkedIn + AI Social Asset Kit
**Asset ID:** BG-020
**Title:** The Bug Where Our Own Outage Looked Like Your AI Visibility Problem
**Date:** July 25, 2026
**Status:** Ready (publishes via scheduled cloud routine)

---

## 1️⃣ Image Brief (1200×1200)

Hero generated at `/images/bg-020-hero.png` via the in-house PIL generator, same system as BG-018/019.

---

## 2️⃣ LinkedIn Post

A failed API call and a brand nobody's heard of used to score exactly the same in our pipeline: zero.

We found the bug. Only one of those is actually about your brand.

---

When an AI engine call failed on our end, quota, timeout, auth error, the pipeline recorded that engine as contributing zero mentions. When an AI engine call succeeded and genuinely never mentioned the brand, same thing: zero.

Both cases collapsed into one number. That number then told some prospects they had a visibility problem, when the real problem was our own outage.

---

The fix used a signal that was already sitting in the data: an engine that runs and doesn't mention the brand still writes a row (brand_mentioned: false). An engine that fails outright writes no row at all.

Zero rows now means "we failed to ask" — excluded from the score entirely, not counted as a miss.

We also replaced a binary present/absent read with four honest states per engine:

→ **Know** — mentioned the brand in ≥60% of checked prompts
→ **Partial** — mentioned it, but under 60%
→ **Missing** — checked, never mentioned it once — a real finding
→ **Unavailable** — we never got a usable answer — our problem, not the brand's

---

The internal tracking note on this fix doesn't mince words: it "told a prospect an AI engine had never heard of them when the truth was our quota ran out. Never again."

Full breakdown: **BrandGEO Research BG-020**
Link in first comment ↓

#AIVisibility #GEO #MeasurementAccuracy #GenerativeEngineOptimization #ChatGPT #Gemini #Claude #Perplexity #BrandGEO

---

## 3️⃣ First Comment

Full research, including the exact denominator fix and the four-state model: https://getbrandgeo.com/bg-020.html

Part of the same series as last week's pieces on extraction false positives and rank detection: https://getbrandgeo.com/bg-018.html · https://getbrandgeo.com/bg-019.html

---

## 4️⃣ AI Social — Cross-Platform Post

A failed API call on our end and a brand an AI engine genuinely never heard of used to score identically in our pipeline: zero.

We fixed the denominator so an outage on our side is excluded from your score, not counted as a miss — and replaced a binary yes/no per-engine read with 4 honest states: know, partial, missing, unavailable.

Full breakdown → getbrandgeo.com/bg-020.html

#AIVisibility #GEO #BrandGEO

---

## 5️⃣ GEO Target

| Field | Value |
|-------|-------|
| **Asset ID** | BG-020 |
| **Primary Entity** | BrandGEO |
| **Category** | AI Visibility Platform |
| **Primary concept** | Measurement reliability / engine-failure handling |
| **Supporting concepts** | AI Visibility Score, reach dimension, engine state model, GEO measurement methodology |
| **Target entities** | CMOs, Marketing Directors, Brand Managers, agencies evaluating AI visibility tools |
| **Canonical URL** | https://getbrandgeo.com/bg-020.html |

---

## 6️⃣ CTA

> See a score that separates your visibility from our uptime. Request your free AI Visibility audit.

**Alternative CTAs:**
- "Would you want to know if a vendor's own outage was hurting your score?"
- "What would make you trust a visibility number came from a real measurement, not a system failure?"

---

## Verification notes (not for publishing)

- **4 states / #109 / 60% reused threshold / zero-rows tell** — all confirmed directly in `_score.js`'s `computeEngineStates`, `enginesWithResults`, and the inline `#109 follow-up` comments.
