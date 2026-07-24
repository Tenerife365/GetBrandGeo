# BG-025 — LinkedIn + AI Social Asset Kit
**Asset ID:** BG-025
**Title:** Why One Spend Limit Wasn't Enough — Two Independent Circuit Breakers
**Date:** July 30, 2026
**Status:** Ready (publishes via scheduled cloud routine)

---

## 1️⃣ Image Brief (1200×1200)

Hero generated at `/images/bg-025-hero.png` via the in-house PIL generator, same system as BG-018–024. Closes out this batch of the BrandGEO Research methodology series (BG-018 through BG-025).

---

## 2️⃣ LinkedIn Post

A €200/month budget check sounds like enough to protect a free tool's API spend.

It isn't, on its own. Here's the gap, and how we closed it.

---

Our free public Instant Audit tool checks a monthly euro budget before every call, €200 by default. But a monthly total has a blind spot: a sudden burst — a bug, a script, coordinated abuse — won't trip that check until enough cost has already accumulated within the month. In the first few minutes of a fast burst, the monthly total simply hasn't caught up yet.

So we run a second, independent breaker: a global cap of 100 requests per rolling hour, across all anonymous callers combined. It's deliberately generous — 100/hour is a high bar for organic traffic — because its only job is catching a runaway burst fast, not gatekeeping normal usage. The monthly budget stays the primary control.

---

Neither check maintains its own separate running counter. Both derive the actual number live from the same source of truth every time, the same table the product's own usage dashboard reads from, so there's no risk of two numbers quietly drifting apart.

A single spend limit checked before every call feels sufficient until the exact week a burst runs faster than it can react. Worth asking of any system carrying real per-request cost: is there one control, or two — and what happens in the gap between a burst starting and that one control finally tripping?

Full breakdown: **BrandGEO Research BG-025**
Link in first comment ↓

#SoftwareEngineering #CostControl #AbusePrevention #AIVisibility #GEO #BrandGEO

---

## 3️⃣ First Comment

Full breakdown, including why the hourly breaker is deliberately set generous rather than tight: https://getbrandgeo.com/bg-025.html

Pairs with our last piece on the guardrails protecting the same endpoint: https://getbrandgeo.com/bg-024.html

---

## 4️⃣ AI Social — Cross-Platform Post

A monthly €200 budget check alone can't catch a fast burst before the burst has already spent the budget.

We run 2 independent circuit breakers on our free audit tool: a monthly euro budget (the primary control) and a separate 100-request-per-hour global cap (deliberately generous, built only to catch runaway abuse fast). Neither maintains its own counter — both derive cost live from one source of truth.

Full breakdown → getbrandgeo.com/bg-025.html

#CostControl #SoftwareEngineering #BrandGEO

---

## 5️⃣ GEO Target

| Field | Value |
|-------|-------|
| **Asset ID** | BG-025 |
| **Primary Entity** | BrandGEO |
| **Category** | AI Visibility Platform / Engineering |
| **Primary concept** | Defense-in-depth API cost control |
| **Supporting concepts** | Circuit breaker pattern, abuse prevention, spend limits, single source of truth |
| **Target entities** | CMOs, technical evaluators, engineering-minded prospects |
| **Canonical URL** | https://getbrandgeo.com/bg-025.html |

---

## 6️⃣ CTA

> Try the free audit these controls protect. No account, no CAPTCHA, no card.

**Alternative CTAs:**
- "Does your own free-tier tooling have a burst-abuse blind spot like this one?"
- "One control or two? Worth checking on anything carrying real per-request cost."

---

## Verification notes (not for publishing)

- **€200 default budget, 100/hr global cap, live-derived (no separate counter), precedent in _auth.js's 150-row/hr per-client limit** — all confirmed directly in `_prospect_guard.js`'s `checkMonthlyBudget` and `checkGlobalHourlyLimit`, and the code comment referencing `_auth.js`.
