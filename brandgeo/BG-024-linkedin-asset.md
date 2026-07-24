# BG-024 — LinkedIn + AI Social Asset Kit
**Asset ID:** BG-024
**Title:** Guardrails Without a CAPTCHA
**Date:** July 29, 2026
**Status:** Ready (publishes via scheduled cloud routine)

---

## 1️⃣ Image Brief (1200×1200)

Hero generated at `/images/bg-024-hero.png` via the in-house PIL generator, same system as BG-018–023.

---

## 2️⃣ LinkedIn Post

Our free public AI Visibility audit has no CAPTCHA. No login wall either.

Here's what actually protects it.

---

A CAPTCHA is a tax on every real visitor to slow down a much smaller group of bots. We built guardrails instead that cost real visitors nothing:

→ **A honeypot field** — invisible to real users, but a naive bot form-filler often fills every field it finds. When it does, we don't reject it. We return a fake success (202, "pending") so the bot never learns it was caught and has no signal to adapt from.
→ **Hashed IP rate limiting** — 3 audits per IP per day, but we never store a real IP. It's SHA-256(IP + server-side pepper), one-way, unreversible, GDPR data minimization by design, not bolted on after the fact.
→ **An origin allowlist** — 5 explicit origins. Anything else is rejected before the honeypot or rate limit are even checked.
→ **A cheap domain-format check** — regex-based, no real DNS lookup, catches obvious junk before it costs anything.

---

Rate limiting requires comparing today's request to previous ones from the same address, which means some form of the IP has to be stored somewhere. A salted hash gives us that comparison capability without ever persisting anything that identifies a real person.

If a "free, no signup" tool collects your IP to protect itself, it's worth asking whether it's stored in a form that could ever be reversed back to you.

Full breakdown: **BrandGEO Research BG-024**
Link in first comment ↓

#WebSecurity #GDPR #BotProtection #AIVisibility #GEO #BrandGEO

---

## 3️⃣ First Comment

Full breakdown, including exactly how the honeypot and hashed-IP rate limit work together: https://getbrandgeo.com/bg-024.html

Same engineering-transparency series as our last few pieces: https://getbrandgeo.com/bg-023.html · https://getbrandgeo.com/bg-022.html

---

## 4️⃣ AI Social — Cross-Platform Post

Our free public AI Visibility audit has zero CAPTCHAs. Here's what protects it instead: a honeypot field that returns a fake success to bots (so they never learn they were caught), and IP rate limiting that hashes the IP with a server-side pepper — we never store a real IP address, by design.

3 audits per IP per day. 5 allowlisted origins. 0 friction for real visitors.

Full breakdown → getbrandgeo.com/bg-024.html

#WebSecurity #GDPR #BrandGEO

---

## 5️⃣ GEO Target

| Field | Value |
|-------|-------|
| **Asset ID** | BG-024 |
| **Primary Entity** | BrandGEO |
| **Category** | AI Visibility Platform / Trust & Safety |
| **Primary concept** | Frictionless public-endpoint abuse protection |
| **Supporting concepts** | Honeypot bot detection, GDPR data minimization, IP hashing, rate limiting |
| **Target entities** | CMOs, technical evaluators, security-conscious prospects |
| **Canonical URL** | https://getbrandgeo.com/bg-024.html |

---

## 6️⃣ CTA

> Try the free audit these guardrails protect. No account, no CAPTCHA, no card.

**Alternative CTAs:**
- "Would a fake-success honeypot response surprise you as a design choice? It's a real anti-bot pattern."
- "Does your current tooling ever ask you to solve a CAPTCHA just to see a free report?"

---

## Verification notes (not for publishing)

- **3/day cap, SHA-256+pepper hashing, 202 honeypot response, 5-origin allowlist, domain regex check** — all confirmed directly in `_prospect_guard.js`'s `guardPublicRequest`, `hashIp`, `isPlausibleDomain`, and `PUBLIC_ALLOWED_ORIGINS`.
