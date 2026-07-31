# ASSISTANT-SPEC.md — BrandGEO AI Assistant (site chat widget)

> **Status:** ✅ BUILT 2026-07-18 (verified locally, NOT yet deployed). Approved
> direction: **custom** (widget in `site.js` + public Netlify functions proxying
> Claude Haiku, grounded in `llms-full.txt`). See **CLAUDE.md §18** for the build
> log, the 7 files shipped, and the exact deploy steps Constantin must run to go
> live (migration → env vars → push functions → cPanel-upload `site.js`).
>
> Files: `netlify/functions/{assistant.js, assistant-lead.js, _assistant_kb.js}`,
> `brandgeo/web/site.js` (widget IIFE), `supabase-assistant-events-migration.sql`.
>
> Companion clickable UI preview: published as an Artifact the prior session. This
> doc is the plan the build followed.

---

## 1. Purpose & jobs-to-be-done

A floating chat assistant on every `getbrandgeo.com` page that:

1. **Answers questions** about BrandGEO — what it does, the AI Visibility Score,
   the 5 engines, pricing tiers, the free audit, methodology — **accurately**,
   grounded in real facts (not hallucinated).
2. **Captures a lead** when a visitor needs something — name, email, and what
   they want — and routes it.
3. **Fast-routes to a human** — *sales* (book a call / contact) or *support*
   (existing customers → support.html / email).
4. **Kicks off the free audit** directly from the chat (hands the domain to the
   existing audit flow / signup).

It is a **top-of-funnel concierge**, not a product-support bot for logged-in
dashboard users (that stays on `support.html` / in-app).

---

## 2. Architecture (custom, fits the existing stack)

```
Visitor (getbrandgeo.com, static)
   │  widget UI lives in site.js + CSS  (drops onto all 59 pages at once)
   ▼
POST https://app.getbrandgeo.com/.netlify/functions/assistant   (NEW, public)
   │  • CORS allow-list: https://getbrandgeo.com (+ www)  — same note as the
   │    public-audit stub already in site.js
   │  • rate-limited + token-bounded (reuse _prospect_guard.js hashIp pattern)
   │  • system prompt = grounded facts from llms-full.txt (+ a tight persona)
   ▼
Claude Haiku (claude-haiku-4-5-20251001)   — ANTHROPIC_API_KEY already set
   │  cheap, fast; precedent: generate-recommendations.js, _competitor_filter.js
   ▼
Response → widget renders it; may include a structured "action" (see §4)
```

**Why custom (vs Intercom/Crisp/Tidio):** keeps client data in-house (privacy,
EU/GDPR), no recurring per-seat SaaS fee, matches the current no-build static
architecture, and — critically — can trigger **BrandGEO's own** audit and sales
flows, which a third-party bot cannot.

**Frontend:** pure static — a floating button + panel injected by `site.js`
(same progressive-enhancement pattern as the mobile-nav module), styled with the
existing CSS custom properties (`--ac`/`--ac2`/`--bg`/`--s`/`--bd`/`--t*`), so it
inherits dark/light theme automatically and needs **no per-page HTML edits**.

**Backend:** one new underscore-free public function `assistant.js` under
`brandgeo-dashboard/netlify/functions/`. It is intentionally **unauthenticated**
(public marketing site), so it does NOT use `_auth.js`'s authenticated-origin
lock — it needs its own CORS entry for `getbrandgeo.com`, exactly as the
`public-audit` stub documents in `site.js`.

---

## 3. Conversation design

**Voice (finalized, modeled on similar products).** Benchmarked against Intercom
Fin, Drift, peec.ai, and Profound's own assistants — the convention that
converts is *concise, first-person, knowledgeable, low-pressure*, not chirpy or
salesy. So BrandGEO's assistant:
- Speaks in the **first person singular** ("I"), names itself once, then gets to
  work.
- **Short sentences, plain words.** Confident but honest — matches the site's own
  tone ("Be the brand AI recommends"), never hypey.
- **At most one emoji, and only on the quick-reply chips** — none in prose (Fin/
  Profound keep prose clean; emoji spam reads as a toy).
- **Never pushy.** Offers value first (answer, audit, pricing) and always leaves a
  human hand-off visible. No fake urgency, no invented social proof.
- **Honest about limits.** If it can't confirm something from the grounded docs,
  it says so and hands off — it does not guess (see §6).

**Finalized opening line** (before the user types):
> "Hi — I'm the BrandGEO assistant. I can show you how your brand appears across
> ChatGPT, Gemini, Claude, Perplexity and Meta AI, walk you through pricing, run
> a free audit, or connect you with our team. What can I help with?"

**Persona summary:** a concise, honest BrandGEO product specialist. Helpful, not
pushy; always offers a human hand-off; never oversells.

**Grounding (system prompt):** inline the contents of `llms-full.txt` (312 lines
of real product/pricing/engine/research facts) as authoritative context. The
model answers **only** from that + the conversation. This is what makes the bot
safe to represent the brand (see §6).

**Opening state** (before the user types) — a welcome line + 4 quick-reply chips:
- "💶 See pricing"  → answers from grounded pricing, links `/#pricing`
- "🔍 Run a free audit" → collects domain, hands to the audit flow / signup
- "📞 Talk to sales" → lead capture → sales route
- "🛟 I'm a customer" → routes to `support.html` / support email

**Escalation is always one tap away.** Any turn can surface "Talk to a human →"
which opens the lead-capture step (§4).

---

## 4. Lead capture & routing

When the visitor wants sales / a call / "email me", the widget collects the
**minimum**: name, work email, and a one-line "what do you need". Optional:
company/domain (pre-fills the audit).

The model can emit a structured action the widget acts on, e.g.:
```json
{ "reply": "...", "action": { "type": "capture_lead", "reason": "sales" } }
{ "reply": "...", "action": { "type": "start_audit", "domain": "acme.com" } }
{ "reply": "...", "action": { "type": "route_support" } }
```

**Where leads go — DECIDED: HubSpot.** A small `assistant-lead.js` Netlify
function writes the captured lead into **HubSpot** (the CRM/sales pipeline in
`SALES-ENGINE.md`), via the HubSpot Contacts/Forms API server-side (token in a
Netlify env var, never client-side). Tag the source as `assistant` and carry the
reason (sales / audit / support-note) + any domain so sales has context. Email
notification to the team is a nice secondary, but HubSpot is the system of
record — not `formsubmit.co`.

**Audit hand-off — DECIDED: deep-link signup.** `start_audit` does **not** call
the (still-stubbed) public-audit endpoint. It redirects to
`https://app.getbrandgeo.com/signup?domain=<domain>` — the exact pattern the hero
audit widget already falls back to (`redirectToSignup` in `site.js`). Simple, no
new backend dependency, and it drops the visitor straight into the real product
with their domain pre-filled.

**Support routing:** `route_support` → deep-link `support.html` + show the
support email. (Existing customers; no HubSpot lead needed unless they choose to
leave a note.)

**GDPR:** collect the minimum, store an IP only as a salted hash (reuse
`_prospect_guard.js`'s `hashIp`), show a one-line consent/privacy note with a
link to `/privacy.html` before the first submit. EU-hosted, consistent with the
rest of the site.

---

## 5. UI/UX (matches the published preview)

- **Launcher:** floating pill/button, bottom-right, `z-index` above content,
  hidden-friendly on mobile (doesn't cover the nav CTA). Subtle one-time pulse,
  respects `prefers-reduced-motion`.
- **Panel:** ~360px wide, rounded, elevated; header with "BrandGEO Assistant" +
  an online dot + close; scrollable message list; quick-reply chips; input row
  with send. Full-width sheet on small phones.
- **Messages:** assistant left, user right; typing indicator while awaiting the
  function; links open in-page; action buttons (Book a call / Run audit /
  Support) render as buttons, not raw text.
- **Theme + a11y:** inherits site tokens (dark/light), visible focus states,
  `aria-live` on the message list, Escape closes, focus trap while open.

---

## 6. Guardrails (content-integrity compliance)

Per the project's content-integrity rule, the assistant must not fabricate:
- **Pricing/claims come only from the grounded facts.** If asked something not in
  `llms-full.txt`, it says so and offers a human hand-off — it does **not** guess.
- **Scope-limited:** politely declines off-topic requests, steering back to
  BrandGEO / AI visibility.
- **No overselling / no invented case studies or testimonials** (same reason the
  testimonials block is still gated on real quotes).
- **Always offers a human path.** The bot is a concierge, not a gatekeeper.
- **Abuse/cost:** per-IP rate limit + max tokens + short context window; the
  function fails closed to a "reach us at contact@getbrandgeo.com / book a call"
  fallback on any error, timeout, or missing key (mirrors the audit widget's
  fail-open-to-a-working-path pattern).

---

## 7. Cost

- **Model:** Claude Haiku — small in/out, grounded context (~a few K tokens),
  bounded `max_tokens`. Precedent for Haiku + `ANTHROPIC_API_KEY` already in the
  codebase (`generate-recommendations.js`, `_competitor_filter.js`).
- **Rate limit:** per-IP/day cap (reuse `_prospect_guard.js`), plus a per-session
  soft cap client-side. Protects against someone using the endpoint as a free
  Claude proxy.
- Fold assistant token spend into the cost-accounting rebuild when that lands.

---

## 8. Build plan (dedicated chat)

1. **Widget UI in `site.js` + CSS** — launcher, panel, message rendering, quick
   replies, lead-capture step, theme/a11y. (Ships to all 59 pages at once.)
2. **`assistant.js` Netlify function** — CORS for getbrandgeo.com, grounded
   system prompt (inline `llms-full.txt`), Haiku call, structured-action parsing,
   rate limit, fail-closed fallback. **Needs `SERPAPI`-style env? No — only the
   existing `ANTHROPIC_API_KEY`.**
3. **Lead routing** — `assistant-lead.js` (or reuse formsubmit/HubSpot path).
4. **Guardrails + tests** — off-topic refusal, no-fabrication, rate-limit, the
   fail-closed path.
5. **Deploy** (Netlify auto-deploy on push) + **cPanel upload** of `site.js`;
   live-verify the widget on getbrandgeo.com with a cache-buster.

**Scope note:** items 2–4 live in `brandgeo-dashboard/netlify/functions/`
(Netlify repo, auto-deploys on push); item 1 + the final `site.js` upload are the
static-site side (manual cPanel). Keep the two clearly separated per the
parallel-task-scoping rule.

---

## 9. Decisions (resolved 2026-07-17)

- ✅ **Lead destination: HubSpot** (server-side via `assistant-lead.js`, source
  tagged `assistant`). See §4.
- ✅ **Audit hand-off: deep-link signup** — `app.getbrandgeo.com/signup?domain=…`,
  no public-audit dependency. See §4.
- ✅ **Voice + opening copy: finalized** (concise/first-person/low-pressure,
  modeled on Intercom Fin / peec.ai / Profound). See §3.

**Still to confirm during the build:**
- **HubSpot specifics** — which portal/pipeline, private-app token (Netlify env),
  and whether to map to an existing "source" property or create one.
- **Which pages** — all 59, or suppress the widget on legal/thanks/article-builder.
