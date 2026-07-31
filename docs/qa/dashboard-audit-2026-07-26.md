# BrandGEO Dashboard — Audit, 2026-07-26

**Auditor:** dashboard-auditor (read-only)
**Target:** `brandgeo-dashboard/` at `http://localhost:5173`, authenticated admin session, live Supabase
**Method:** source reading + live computed-style measurement + live interaction. No code was edited. No collection, refresh, or LLM-firing control was activated.

---

## Verdict

A competent, genuinely dark-first product with a real design system underneath it, undermined by a first-run experience that tells brand-new customers their score is 0% and by a plan dropdown that silently provisions the wrong tier — the craft is better than its reputation, the onboarding path is worse.

| Lens | Score | One-sentence justification |
|---|---|---|
| **1 — Functional correctness** | **2** | Error and locked states are handled with real care, but the onboarding wizard silently coerces two live paid plans to Essentials and every cross-page navigation lands the user mid-page. |
| **2 — Capability & navigation** | **2** | Routing is clean and never reloads, but 30% of terminal states have no way out, the logo is inert in both shells, unknown URLs vanish without a word, and no command palette or slide-over layer exists at all. |
| **3 — Visual & interaction craft** | **3** | One coherent dark theme really is applied on all twelve routes with real card elevation and a motion system — held back by an active-nav state resting on a 3px rail, a panel at 1.07:1 against its canvas, and a chart palette where one hue means three different things. |

---

## HUMAN CHECKPOINT — S1 found

```
=== HUMAN CHECKPOINT ===
NEED:      Should onboard-client.js reject an unknown plan, or keep silently
           coercing it to 'essentials'?
WHY:       The Onboard wizard offers "Growth" (EUR 299) and "Growth PRO"
           (EUR 449). Neither is in that function's VALID_PLANS. Line 67
           rewrites both to 'essentials' (EUR 99) with no error. A customer
           sold Growth is provisioned with Essentials entitlements.
OPTIONS:   A) Add 'growth','growth_pro' to VALID_PLANS -> wizard works as the
              admin already believes it does; entitlements match the sale.
           B) Reject unknown plans with a 400 -> no silent mismatch, but the
              wizard breaks loudly until (A) is also done.
           C) Do nothing -> every Growth/Growth PRO client onboarded through
              the wizard is under-provisioned, silently, including any already
              created this way.
DEFAULT:   Nothing changes; the mismatch keeps being created on each onboard.
TO RUN:    Inspect C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard\netlify\functions\onboard-client.js
           lines 44 and 67. Then audit existing rows: which clients have
           plan='essentials' but were sold Growth or Growth PRO?
TO VERIFY: Onboard wizard -> pick Growth PRO -> the created client's
           clients.plan reads 'growth_pro', not 'essentials'.
=== END CHECKPOINT ===
```

This is a **finding about provisioning, not a proven revenue loss** — I could not query the database to see whether any client was actually onboarded this way. That check is listed under "what was not audited".

---

## Top 5 actions

Ranked by user impact over effort.

| # | Action | Where | Why it matters | Effort | Expected change |
|---|---|---|---|---|---|
| 1 | Add `growth` and `growth_pro` to `VALID_PLANS`, and make an unknown plan return 400 instead of coercing | `netlify/functions/onboard-client.js:44,67` | Two of the seven sellable tiers are silently downgraded at provisioning. Everything downstream — engines, budget, prompt caps — inherits the wrong tier. | **S** | Onboarding provisions the tier that was sold. |
| 2 | Give Overview and AI Visibility a real zero-data state instead of rendering 0% and "Needs Work" | `Dashboard.tsx` score card; `AIVisibility.tsx` score ring | A brand-new customer's first screen currently reads as a verdict that their brand is invisible, when the truth is that nothing has been measured. This is the single worst moment in the product. | **M** | First run explains itself and offers one action instead of six zeros. |
| 3 | Reset scroll to top on route change | `Layout.tsx:711` `<main>` | Scrolled to 900px on `/mentions`, clicking `/competitors` lands at 516px — past the H1 and every headline stat. Affects every cross-page navigation. | **S** | Users arrive at the top of the page they chose. |
| 4 | Make the wordmark a link — marketing site when signed out, `/` when signed in | `Login.tsx` wordmark; `Layout.tsx:271,682` `BrandGeoLogo` | The universal "go home" affordance is inert in both shells. Confirmed: no anchor ancestor, `cursor: auto`. | **S** | The most-attempted navigation gesture in any web app starts working. |
| 5 | Turn the five prose pointers ("Run a collection from the AI Visibility tab") into real links or buttons | `BrandSentiment.tsx:289`, `Mentions.tsx`, `Competitors.tsx:439`, `Recommendations.tsx:820`, `AIVisibility.tsx` prompt table | Five empty states name the destination and then make the user find it. `/sentiment` at zero data has **zero** buttons and **zero** links. | **S** | Removes both dead ends and three detours in one pass. |

---

## Findings ledger

Ranked S1 first.

| ID | Lens | Sev | Title | Location | Evidence | Fix | Effort |
|---|---|---|---|---|---|---|---|
| F-01 | 1 | **S1** | Onboard wizard silently provisions the wrong plan | `netlify/functions/onboard-client.js:44,67` | `VALID_PLANS = ['free','essentials','managed','pro','enterprise']`. `planConfig.ts:26` defines `growth` and `growth_pro`; `:152-153` prices them at EUR 299 / EUR 449; `:164-165` label them. Live DOM of the wizard's plan `<select>`: `Free, Essentials, Growth, Growth PRO, Managed, Pro, Enterprise`. Line 67 is `VALID_PLANS.includes(plan) ? plan : 'essentials'` — a coercion, not a rejection. | See FIX F-01 | S |
| F-02 | 1/2 | **S2** | Zero-data Overview renders a 0% verdict, not an empty state | `Dashboard.tsx` score card (comment at `:429` explicitly declined an empty callout) | Measured on a real zero-data free tenant: "0% AI VISIBILITY SCORE / RECOGNITION 0% / KNOWLEDGE 0% / SENTIMENT 0% / ACCURACY 0% / REACH 0% / CONSISTENCY 0% / MENTION RATE 0% / TOTAL CHECKS 0". 2 buttons, 1 link on the whole page. No CTA, no explanation. | See FIX F-02 | M |
| F-03 | 1/2 | **S2** | AI Visibility labels an unmeasured brand "Needs Work" | `AIVisibility.tsx` score ring band | Same tenant: "AI VISIBILITY SCORE / **Needs Work** / 0%" with 0 prompts and 0 checks. The product issues a judgement before it has any data. | Suppress the band label when `totalChecks === 0`; show "Not measured yet". | S |
| F-04 | 2 | **S2** | `/sentiment` at zero data is an absolute dead end | `BrandSentiment.tsx:289` | Measured: `buttons: 0, links: 0` in `#main-content`. Text reads "Run a collection from the AI Visibility tab" with no control of any kind on the page. | See FIX F-05 | S |
| F-05 | 1/2 | **S2** | Scroll position carries across route changes | `Layout.tsx:711` | Set `/mentions` scrollTop = 900, clicked `/competitors`, measured `scrollTop` on arrival = **516** (that page's max). `<main>` is the scroll container and never unmounts. Grep for `scrollTo\|scrollTop\|ScrollRestoration` across `src/` returns exactly one unrelated hit (`Prompts.tsx:161`, a chat autoscroll) — positive control confirms the pattern matches. | See FIX F-05b | S |
| F-06 | 2 | **S2** | Wordmark is not a link in either shell | `Login.tsx` wordmark; `Layout.tsx:23-35` `BrandGeoLogo`, rendered at `:271` and `:682` | Live DOM: both `/logo.png` images return `inAnchor: false`, `inButton: false`, `parentCursor: "auto"`. Ancestry is `IMG -> DIV.flex items-center gap-2 -> DIV.px-5 py-5 -> ASIDE`. No anchor anywhere in the chain. Extends the seeded login-screen finding to the authenticated shell. | See FIX F-06 | S |
| F-07 | 2 | **S2** | Unknown URLs vanish silently | `App.tsx:118` `<Route path="*" element={<Navigate to="/" replace />} />` | Pushed `/definitely-not-a-route-xyz`, dispatched popstate: landed on `/` with Overview content and no message. A mistyped or stale link gives the user no feedback that anything was wrong. | Render a 404 view with the attempted path and links to Overview + Prompts, rather than redirecting. | S |
| F-08 | 1/2 | **S2** | `/usage` renders a blank page for viewers | `Usage.tsx:112` `if (!isAdmin) return null` | A viewer reaching `/usage` by URL gets an empty `<main>` — no message, no link. Compare `Onboard.tsx:88-93`, which returns "Access restricted to admins." plus a working `<Link to="/">`. Two files, two behaviours. | Return the Onboard-style restricted view. | S |
| F-09 | 3 | **S3** | Side panel is 1.07:1 against the page canvas | `Layout.tsx:263` `bg-dark-800` vs `:247` `bg-dark-900` | Measured computed styles: sidebar `rgb(15,23,42)`, canvas `rgb(10,15,30)` → **1.07:1**. Its border `rgba(30,41,59,0.6)` is **1.31:1** vs canvas and **1.22:1** vs the sidebar. WCAG 1.4.11 wants 3:1 for a meaningful non-text boundary. The panel does not read as a distinct surface. | See FIX F-09 | S |
| F-10 | 3 | **S3** | Active nav state rests entirely on a 3px rail | `Layout.tsx:195-203` `navItemClass` | Measured: active text `rgb(196,181,253)` vs inactive `rgb(203,213,225)` = **1.24:1**. Active background composited = `rgb(34,33,73)` vs sidebar = **1.17:1**. The rail `rgb(167,139,250)` vs sidebar = **6.56:1**. So two of the three cues are effectively invisible and a 3px × 20px element carries the entire state. | See FIX F-10 | S |
| F-11 | 3 | **S3** | Time-filter active state is weaker than the nav's, with no rail at all | `Layout.tsx:699-703` | Measured: active text `rgb(196,181,253)` vs inactive `rgb(148,163,184)` = **1.39:1**; active pill composited `rgb(36,30,73)` vs canvas = **1.23:1**. No rail, no border, no weight change. `aria-pressed` is correctly set, so AT users are fine; sighted users have almost nothing. | Add a border or a weight change to the pressed pill; reuse the nav's rail token. | S |
| F-12 | 2 | **S3** | Five empty states name a destination they do not link | `BrandSentiment.tsx:289`, `Competitors.tsx:439`, `Recommendations.tsx:820`, `Mentions.tsx`, `AIVisibility.tsx` prompt table | Measured on the zero-data tenant. Four say "Run a collection from the AI Visibility tab"; one says "Add prompts in the Prompts tab". None is a link. `/prompts` is the counterexample done right — "AI Discover" and "Add prompt" are both real buttons on the page. | See FIX F-05 | S |
| F-13 | 1/3 | **S3** | Heading outline is broken or absent on most pages | measured per route | h2 count by route: `/ai-visibility` **0** (and an h3 with no h2 — a level skip), `/mentions` **0** (4,800 chars of content), `/recommendations` **0**, `/prompts` **0**, `/usage` **0**. Where h2 exists it is 12px/600 (`/sentiment`, `/competitors`), 14px/600 (`/`, `/account`), 14px/500 (`/social`, `/seo`), 18px/600 (`/onboard`) — four different treatments. Screen-reader users get no document outline on five of twelve routes. | Introduce one `SectionHeading` component; apply to every card header. | M |
| F-14 | 3 | **S3** | One hue carries three different meanings | `planConfig.ts:91-99`; `BrandSentiment.tsx:333-335,377-379`; `Competitors.tsx:258` | `#10b981` = ChatGPT (engine identity) **and** Positive (sentiment status). `#ef4444` = Google AI Mode (identity), Negative (status), **and** `groupColors[1]` (a categorical series). `#f59e0b` = Meta AI (identity) **and** `groupColors[2]`. Per the dataviz rule "status colors are reserved and never reused for series 4", this is a three-way collision. | See FIX F-14 | M |
| F-15 | 3 | **S3** | Claude and Meta AI are not separable, in charts or as chips | `planConfig.ts:93,95` | Handed-down validator result, confirmed against source: chart pair `#f97316` / `#f59e0b` = ΔE **9.6** vs a normal-vision floor of 15 (**FAIL**); deutan 6.2, **tritan 3.4** (WARN). The identity-chip pair is worse: `text-orange-400` `#fb923c` vs `text-amber-400` `#fbbf24`. **Where they co-render:** engine filter chip rows on `/sentiment` (`BrandSentiment.tsx:417-422`) and `/mentions` (`Mentions.tsx:204`), and per-mention badges (`BrandSentiment.tsx:452`). **Not** on the AI Visibility engine card grid — measured there, the labels render `rgb(255,255,255)` (active) or `rgb(148,163,184)` (locked), so `ENGINE_META.color` is not applied on that surface. Meta is retired, but it still renders for historical rows and still occupies a locked card. | See FIX F-14 | M |
| F-16 | 3 | **S3** | Grok reads as a disabled series | `planConfig.ts:99` | `chartColor: '#94a3b8'`, `color: 'text-slate-300'`. Validator: chroma **0.035**, below the floor — it is functionally gray. Next to eight saturated hues it looks switched-off rather than branded. | Assign a chromatic slot from the re-validated palette. | S |
| F-17 | 2/4 | **S3** | Internal cost control is shown to customers as a headline | `AIVisibility.tsx` budget meter | Zero-data free tenant renders "MONTHLY API BUDGET / EUR 0.00 / EUR 0.30 / 0%" above the score. EUR 0.30 is BrandGEO's own spend ceiling (`planConfig.ts:150`), not a customer value metric. A customer reading "your budget is 30 cents" learns nothing they can act on and something they were not meant to weigh. | Show remaining *checks* or *refreshes*, not euros; keep the euro meter admin-only. | S |
| F-18 | 3 | **S3** | Primary next action is a 16px-tall touch target on mobile | Overview "View full breakdown →" | Viewport asserted `innerWidth === 375`. Measured `height: 16px`, width 287. WCAG 2.5.8 minimum target is 24×24. It is the only link on the page. | Pad to 44px min height. | S |
| F-19 | 3 | **S4** | Page title weight is split two ways | measured per route | h1 is `24px/600` on `/`, `/social`, `/seo`, `/account`; `24px/700` on `/ai-visibility`, `/sentiment`, `/mentions`, `/competitors`, `/recommendations`, `/prompts`, `/usage`, `/onboard`. Four pages against eight. | One `PageTitle` component. | S |
| F-20 | 3 | **S4** | Card padding has eleven values and radius four | measured per route | Padding observed: `32px`, `28px`, `24px`, `20px`, `16px`, `12px`, `0px`, `12px 16px`, `6px 12px`, `4px 10px`, `4px 12px`. Radius: `8px`, `12px`, `16px` (`/onboard` only), `9999px`. Same conceptual card, different geometry per page. | Define `--card-pad` / `--card-radius`; three sanctioned sizes. | M |
| F-21 | 3 | **S4** | Dashed gridlines on four charts | `Competitors.tsx:387,548`; `BrandSentiment.tsx:323,368` | `strokeDasharray="3 3"` on `CartesianGrid`. Dataviz anti-pattern: dashing reads as "projection" or "threshold" when it is just a grid. (The `strokeDasharray` at `Dashboard.tsx:392,397` and `AIVisibility.tsx:654,659` is arc geometry for the score rings — correct, not a finding.) | Solid hairline, one shade off the surface. | S |
| F-22 | 3 | **S4** | Chart series coloured by array index, not entity | `Competitors.tsx:258,398` | `groupColors = ['#8b5cf6','#ef4444','#f59e0b','#3b82f6']` applied as `fill={groupColors[i]}`. If the engine-group set changes — a plan change, an engine going quiet — the survivors repaint. Dataviz anti-pattern "recolor-on-filter". | Key colour off the engine id via `ENGINE_META`. | S |
| F-23 | 3 | **S4** | WebKit scrollbar rules are dead code in Chrome | `index.css:231-240` | `scrollbar-width: thin` and `::-webkit-scrollbar { width: 8px }` both declared. Chrome honours the standard property and ignores the pseudo-elements. Measured actual scrollbar width: **10px**, not 8px — so `width: 8px` and `border-radius: 4px` never apply. | Keep one mechanism; drop or comment the dead half. | S |
| F-24 | 1 | **S4** | Pluralisation bug | `Competitors.tsx` stat subtitle | Zero-data tenant renders "across **1 engines**". | Pluralise. | S |

---

## Dead-end census

Method per row: **LIVE-EMPTY** = measured on a real zero-data free-plan tenant reached via the client switcher; **LIVE-DATA** = measured on the populated tenant; **LIVE-NAV** = measured by navigation; **SOURCE** = read from code.

| # | Route / state | Most plausible next action | Status | Method |
|---|---|---|---|---|
| 1 | `/` populated | Drill into the score | REACHABLE | LIVE-DATA |
| 2 | `/` **zero data** | Add a prompt / run first collection | **DEAD END** | LIVE-EMPTY |
| 3 | `/ai-visibility` populated | Run collection, inspect a prompt | REACHABLE | LIVE-DATA |
| 4 | `/ai-visibility` zero prompts | Go add prompts | DETOUR | LIVE-EMPTY |
| 5 | `/ai-visibility` engine UNAVAILABLE | Retry that engine | REACHABLE | SOURCE `AIVisibility.tsx:765` |
| 6 | `/sentiment` populated | Filter, read a response | REACHABLE | LIVE-DATA |
| 7 | `/sentiment` **zero data** | Run a collection | **DEAD END** (0 buttons, 0 links) | LIVE-EMPTY |
| 8 | `/mentions` populated | Expand a mention | REACHABLE | LIVE-DATA |
| 9 | `/mentions` zero data | Run a collection | DETOUR | LIVE-EMPTY |
| 10 | `/competitors` populated | Add / inspect competitor | REACHABLE | LIVE-DATA |
| 11 | `/competitors` zero data | Add manually (real button) | REACHABLE | LIVE-EMPTY |
| 12 | `/competitors` trend, insufficient data | Wait / collect | DETOUR | LIVE-EMPTY |
| 13 | `/recommendations` populated | Action a recommendation | REACHABLE | LIVE-DATA |
| 14 | `/recommendations` zero data | Run a collection | DETOUR | LIVE-EMPTY |
| 15 | `/prompts` zero prompts | AI Discover / Add prompt | REACHABLE | LIVE-EMPTY |
| 16 | `/prompts` populated | Edit / add | REACHABLE | LIVE-DATA |
| 17 | `/social` plan-locked | See plans | REACHABLE | SOURCE `FeatureLocked.tsx:33-38` |
| 18 | `/seo` plan-locked | See plans | REACHABLE | SOURCE, same |
| 19 | `/seo` zero briefs | Create a brief | DETOUR | SOURCE `SEO.tsx:539` |
| 20 | `/usage` admin, empty period | Widen the time filter | DETOUR | SOURCE `Usage.tsx:174` |
| 21 | `/usage` **as viewer** | Leave | **DEAD END** (renders `null`) | SOURCE `Usage.tsx:112` |
| 22 | `/onboard` as viewer | Back to Dashboard | REACHABLE | SOURCE `Onboard.tsx:88-93` |
| 23 | `/account` | Manage / upgrade | REACHABLE | LIVE-DATA |
| 24 | **Unknown URL** | Understand what happened | **DEAD END** (silent redirect) | LIVE-NAV |
| 25 | `/login` unauthenticated | Reach the marketing site | **DEAD END** (only exit is `/signup`) | SOURCE + seeded |

**REACHABLE 13 · DETOUR 6 · DEAD END 6 · total 25**

> ### Headline number for Lens 2: **52% reachable. 24% are dead ends.**

Every one of the six dead ends is a terminal state a real user hits: five of them on their first day.

---

## Direction conformance

| Directive | Status | Evidence | Worth adding? |
|---|---|---|---|
| Zero dead-ends | **PARTIAL** | 6 of 25 states are dead ends (24%); 6 more are detours. | Already the top of the fix plan. |
| Command palette (Cmd+K) | **ABSENT** | Two methods: grep for `metaKey\|cmdk\|CommandPalette` across `src/` returns 0 (positive control — `keydown\|onKeyDown\|ctrlKey\|e.key` returns 20 hits in 8 files, so the pattern class works). Live: dispatched Cmd+K and Ctrl+K at both `document` and `window`; `[role="dialog"]` count stayed 0. | **Yes, but not first.** With 12 routes and a client switcher, a palette is real value. Cost: ~4KB with `cmdk`, or hand-roll on the existing dropdown pattern. Do it after the dead ends. |
| Contextual slide-over panels | **ABSENT** | Measured `[role="dialog"]` and `[aria-modal]` = 0 on every route walked. Drill-downs are inline expand/collapse (`Collapse.tsx`, `MotionCard.tsx`). | Partly. Inline disclosure is a legitimate choice and it works. The real cost is that nothing has dialog semantics — see the Shadcn row. |
| Inline deep-linking | **PARTIAL** | Routes deep-link correctly and never full-reload. But in-page state does not: measured `<a href>` count inside `#main-content` is **0 on 10 of 12 routes** (1 on `/` and `/account`). Every drill-in, filter and row expansion is a `<button>` — 50 on `/mentions`, 35 on `/sentiment`. Nothing is shareable, middle-clickable, or restorable. | Yes. Encode filter/selection in the query string. |
| Glassmorphism | **PARTIAL** | `backdrop-blur-sm` on the time-filter bar (`Layout.tsx:693`), `backdrop-blur-md` on the mobile nav (`:718`). Two instances, both structural chrome. Applied with restraint rather than everywhere — which is the correct reading of the directive. | No change needed. |
| Responsive micro-interactions | **MET** | `motion` v12 present; `MotionConfig reducedMotion="user"` at `App.tsx:88`; `.card-hover-lift` at `index.css:336-349` with a `prefers-reduced-motion` guard at `:358-374` that also freezes `animate-pulse`. This is more disciplined than most products manage. | No. |
| Dark-mode first | **MET** | All 12 routes measured `rgb(10,15,30)` with `documentElement.className === ""`. Light mode is the opt-in. | No. |
| Spatial layout hierarchy | **PARTIAL** | Sidebar is grouped into Insights / Strategy / Manage (`Layout.tsx:148-180`) — genuinely good. Undercut by F-09 (panel 1.07:1 from canvas), F-13 (no heading outline), F-20 (11 padding values). | Covered by the fix plan. |
| React / Next.js App Router | **DIFFERS — no user cost** | Vite 5.3.1 + react-router-dom 6.23.1. Measured: a sentinel set on `window` survived **all 12** route changes plus the catch-all redirect — no full reload anywhere. The behaviour the directive wants is present. | No. Do not migrate. |
| Tailwind | **MET** | v3.4.4, `darkMode: 'class'`. | No. |
| Framer Motion | **MET** | Present as `motion` ^12.0.0 — the current package name for Framer Motion. It was **not** missing. | No. |
| Shadcn/ui primitives | **DIFFERS — with one real cost** | 14 hand-rolled components. Accessibility is largely done by hand and done well: `aria-haspopup`/`aria-expanded` on all four dropdowns, `role="tablist"`/`aria-selected`, `aria-pressed`, `role="switch"` + `aria-checked`, a skip link, `:focus-visible` at `index.css:295-302`, Escape + outside-click handlers at `Layout.tsx:98-120`. **The cost:** zero elements in the app have `role="dialog"` or `aria-modal`, and there is no focus trap anywhere — so if any overlay is ever added, the accessible-modal work starts from nothing. | Only if a true modal layer is planned. Otherwise the hand-rolled primitives pass. |
| Wagmi / Viem | **N/A** | Grep for `wagmi\|viem\|WalletConnect\|ethereum\|web3\|metaMask` across `brandgeo-dashboard/`: **0 occurrences in 0 files.** No wallet, no chain, no token gate. | No. Stated once and not raised again. |

---

## Role-based navigation: admin vs viewer (Amendment 2)

Assessed **from source only** — I cannot change my own role. See "what was not audited".

### What is gated, and whether the server backs it up

| Surface | UI hidden from viewer | Server-enforced | Verdict |
|---|---|---|---|
| Client switcher | `Layout.tsx:340` `isAdmin && clients.length > 0` | `clientContext.tsx` populates `clients` from a role-scoped query; RLS scopes `clients` | OK |
| Internal / Research switcher | `Layout.tsx:429` (inside the admin block) | same | OK |
| Client group `<select>` | `Layout.tsx:401` (inside the admin block) | `set-client-category.js:20` `adminOnly: true` | OK |
| `/usage` nav entry | `Layout.tsx:176` | page returns `null` at `Usage.tsx:112`; data scoped by RLS | **UI dead end — F-08** |
| `/onboard` nav entry | `Layout.tsx:177` | `Onboard.tsx:88` in-page guard **and** `onboard-client.js:50` `adminOnly: true` | Best-in-app: three layers |
| Promotions panel | `Account.tsx:647` | `promotions-admin.js:111` `adminOnly: true` | OK |
| Client users / billing dates | `Account.tsx:451,463,524,703` | `client-users.js:12`, `set-client-billing.js:29` `adminOnly: true` | OK |
| Force Refresh, engine overrides | `AIVisibility.tsx:561,591,735,1045,1129` | collection functions gate on plan + `checkCollectionLimits` | OK |
| AdminBell | `AdminBell.tsx:81` `if (!isAdmin) return null` | admin-only data fetch guarded at `:50,66` | OK |
| AI Social / AI SEO | shown **locked**, not hidden (`Layout.tsx:145-146,330-331`) | `Social.tsx:792`, `SEO.tsx:451` render `FeatureLocked` | Good pattern — locked beats hidden |

**No admin-only surface was found that is hidden in the UI and relies on that hiding.** `_auth.js:67-113` verifies the JWT, loads `user_profiles.role` server-side, and rejects non-admins with `adminOnly: true` on all twelve privileged functions. The client cannot talk its way past it. That is the right architecture and it is worth saying plainly.

### Is the viewer's sidebar coherent on its own?

Mostly yes — and this surprised me. Removing the two admin entries leaves Insights (4) / Strategy (2) / Manage (3: Prompts, AI Social, AI SEO). That is a complete, sensible product. The viewer also gets a dedicated identity block (`Layout.tsx:473-483`) showing their brand logo, name, and "Your dashboard" — a deliberate replacement for the switcher, not a hole.

Two seams remain:

- **`/usage` is the one real hole (F-08).** The link is gone but the route resolves to a blank screen.
- **The "Manage" group becomes lopsided.** For a free-plan viewer it reads Prompts, AI Social 🔒, AI SEO 🔒 — one usable entry and two locks. The group label promises management and delivers an upsell.

### Does the viewer's product still explain its value?

**No, and it is worse for them than for an admin.** Every finding in the value-legibility section below lands harder on a viewer: they see the same undefined 93% score, the same "Needs Work" verdict, the same EUR 0.30 API budget meter (F-17) — but without the client switcher, the Usage page, or the engine-override panel that give an admin context. A free-plan viewer's first screen is a 0% score, a 30-cent budget, and eight locked engines.

---

## Value legibility (P4)

Measured on the populated tenant's Overview: **423 characters of text, 1 link, 2 buttons.**

The page leads with **"93%"** labelled **"AI VISIBILITY SCORE"**, then six sub-dimensions — RECOGNITION 83%, KNOWLEDGE 100%, SENTIMENT 84%, ACCURACY 100%, REACH 100%, CONSISTENCY 100%.

What a user cannot learn anywhere on this screen:

- **What 93% is out of, or what "good" is.** No benchmark, no peer comparison, no target.
- **Whether it moved.** No trend, no delta, no "up 4 since last month" — on a product whose entire premise is monitoring change over time.
- **What any dimension means.** "KNOWLEDGE 100%" and "CONSISTENCY 100%" are undefined on the page. `/ai-visibility` does better — it subtitles them ("Prompt coverage", "Position quality", "Top-3 placement", "Cross-prompt rate") — but the landing page, which is where the user actually lands, does not.
- **What to do.** One link, "View full breakdown →".

Four of six dimensions read 100%, which makes the composite feel like a participation score rather than a measurement. The one genuinely legible tile is "MENTION RATE 79% — of AI checks include brand": a number with a unit and a sentence. That is the model the other seven numbers should follow.

---

## Verified as correct — claims I set out to confirm and had to refute

Recording these matters as much as the findings. Four of the five stale-doc claims I was asked to check are **false against current code**, and re-filing them would waste a build cycle.

| Claim | Source of claim | Verdict | Measurement |
|---|---|---|---|
| "Overview renders in a plain light/white theme" | `CLAUDE.md` §7.1, flagged 🔴 Critical | **REFUTED** | All 12 routes measured `body` background `rgb(10,15,30)` with `documentElement.className === ""`. Overview is dark, like everything else. |
| "The Overview chart overflows/cuts off at the right edge" | `CLAUDE.md` §7.1 | **REFUTED** | Real horizontal scroll attempted, not inferred from `scrollWidth`: `window.scrollX` unchanged, `main.scrollLeft` unchanged, `document.scrollWidth === innerWidth === 1280`. The only over-wide node is an SVG `<text>` tick 7px past its box with `overflow: visible` — ancestor-clipped and decorative. Re-checked at 375: `docScrollW === 375`, no scroll on any of 5 routes. |
| "Cards are flat-bordered with no elevation/depth" | `CLAUDE.md` §7.1 | **REFUTED** | `index.css:269-286` applies two-layer shadows plus a hairline ring. Measured across 12 routes: **163 of 164 cards have a computed `box-shadow`.** The single exception is one 8px-radius pill on Overview. |
| "Teal is used for active/selected states in `AIVisibility.tsx` and `Prompts.tsx`" | `CLAUDE.md` §7.1 / task #72 finding 4 | **REFUTED** | Grep for `teal-` across `src/` returns 2 hits, both in `index.css` (`:172`, `:184`) and both light-mode remaps of a class no page uses. Zero occurrences in `AIVisibility.tsx` or `Prompts.tsx`. Measured active nav/filter states render brand violet. |
| "The scrollbar is unstyled and does not fit the design" | owner, P3(a) | **REFUTED as of current code** | Measured `scrollbar-color: rgb(100,116,139) transparent` on `documentElement`. Thumb contrast **4.01:1** vs canvas, **3.75:1** vs sidebar — both clear WCAG 1.4.11's 3:1. It is styled and it passes. The residual issue is cosmetic and minor (F-23): it is neutral slate rather than brand-tinted, and the intended 8px/4px-radius geometry is dead code in Chrome. |
| Wide tables overflow on mobile | my own suspicion at 375 | **REFUTED** | The `min-w-[640px]` engine table on `/ai-visibility` sits in an `.overflow-x-auto` wrapper. I attempted a real scroll on it: `scrollWidth 765` vs `clientWidth 343`, `scrollLeft` **moved**. Correct pattern, not a defect. |
| "Refresh" buttons might fire paid LLM calls | my own suspicion | **REFUTED** | `Dashboard.tsx:364` and `Recommendations.tsx:790` both call a local `load` — a Supabase refetch. The paid path is a separate, differently-named control (`generateAiInsights` → `generate-recommendations`, `Recommendations.tsx:708,935`). Cost-bearing verbs are correctly segregated. I still did not click either, per instruction. |

Also passing, unprompted:

- **No dual-axis charts.** No `yAxisId` anywhere in `src/` — the single most common charting error is absent.
- **Legends correct.** Present on every multi-series chart (`Competitors.tsx:396,566`; `BrandSentiment.tsx:332,376`), absent on the single-series bar (`Competitors.tsx:372`) where the dataviz rule says it should be.
- **No number on every data point.** All lines use `dot={false}` with `activeDot` on hover.
- **Sentiment scale is correctly diverging** — `#10b981` / `#64748b` / `#ef4444`, two opposed hues with a genuinely neutral gray midpoint, plus a legend so identity is never colour-alone. (Its hues collide with other meanings — F-14 — but the scale construction itself is right.)
- **Reduced motion is handled properly** at both layers, including the `animate-pulse` freeze most products miss.
- **`FeatureLocked.tsx` is the best empty state in the app** — names the feature, names the unlock plan, and ships a working CTA. It is the template the five prose-only empty states should copy.

---

## Fix specs

```
FIX F-01
FILE:     brandgeo-dashboard/netlify/functions/onboard-client.js
CHANGE:   Line 44 — derive VALID_PLANS from the same source _auth.js:28 uses
          (Object.keys(PLAN_LIVE_ENGINE_COUNT)) instead of a hand-written
          array, so it can never drift from planConfig again. Line 67 — on an
          unrecognised plan, return 400 with the offending value and the
          accepted list; do not coerce. Keep 'essentials' as the default ONLY
          when `plan` is absent from the request body.
ACCEPT:   POST with plan='growth_pro' creates a client whose clients.plan is
          'growth_pro'. POST with plan='nonsense' returns 400 and creates no
          client, no auth user, and no profile (rollback chain intact).
RISK:     Any existing caller relying on silent coercion now gets a 400. Grep
          for callers of onboard-client before shipping. Re-check the wizard's
          success screen, which reads `plan` back from the response.
EFFORT:   S
```

```
FIX F-02
FILE:     brandgeo-dashboard/src/pages/Dashboard.tsx
CHANGE:   When totalChecks === 0, replace the score card and the six dimension
          tiles with a single first-run panel: what BrandGEO is about to
          measure, why there is no number yet, and one primary action. Route
          the action to /prompts when promptCount === 0, otherwise to
          /ai-visibility. Never render 0% as though it were a measurement.
          The comment at :429 declining an empty callout was reasoned about
          the chart, not the score — the score is the thing that misleads.
ACCEPT:   On a client with zero ai_results, Overview shows no percentage
          anywhere and exactly one primary CTA. On a client with >=1 result,
          the current layout is unchanged.
RISK:     `promptCount` may not be loaded on that code path; confirm before
          branching on it. Do not let the panel flash during load — gate on
          loaded && totalChecks === 0.
EFFORT:   M
```

```
FIX F-05
FILE:     brandgeo-dashboard/src/pages/BrandSentiment.tsx (:289),
          Competitors.tsx (:439), Recommendations.tsx (:820),
          Mentions.tsx (empty branch), AIVisibility.tsx (prompt-table empty)
CHANGE:   Replace each prose destination with a real control. Extract one
          <EmptyState icon title body actionLabel actionTo> component modelled
          on FeatureLocked.tsx, which already does this correctly. "Run a
          collection from the AI Visibility tab" becomes a button linking to
          /ai-visibility; "Add prompts in the Prompts tab" becomes a link to
          /prompts.
ACCEPT:   On a zero-data client, every one of the five routes has at least one
          focusable control in <main> that leads somewhere. /sentiment in
          particular must no longer measure 0 buttons and 0 links.
RISK:     None structural. Keep the copy — only the affordance changes.
EFFORT:   S
```

```
FIX F-05b
FILE:     brandgeo-dashboard/src/components/Layout.tsx
CHANGE:   Add a scroll reset keyed to useLocation().pathname that sets the
          <main id="main-content"> element's scrollTop to 0 on route change.
          It must target that element, not window — <main> is the scroll
          container (Layout.tsx:711) and window never scrolls in this app.
          Skip the reset when only the query string changed, so a future
          deep-linked filter does not jump the page.
ACCEPT:   Scroll /mentions to 900px, navigate to /competitors: arrival
          scrollTop is 0, not 516.
RISK:     If in-page expansion state is ever moved into the URL, the
          query-string exemption is what stops this fighting it. Re-check the
          Prompts chat autoscroll (Prompts.tsx:161) still works.
EFFORT:   S
```

```
FIX F-06
FILE:     brandgeo-dashboard/src/components/Layout.tsx (BrandGeoLogo, :23-35)
          and brandgeo-dashboard/src/pages/Login.tsx (wordmark)
CHANGE:   Give BrandGeoLogo an optional `href`/`to`. In Layout (authenticated
          shell, both call sites :271 and :682) wrap it in <Link to="/"> with
          aria-label "BrandGEO — go to Overview". On Login, ResetPassword and
          Signup, wrap it in <a href="https://getbrandgeo.com"> — linking to
          "/" there would bounce straight back to the login screen, since the
          route is gated by PrivateRoute.
ACCEPT:   Authenticated: clicking the sidebar wordmark from /mentions lands on
          / with no full reload. Unauthenticated: the login wordmark is a real
          anchor to the marketing site, and computed cursor is 'pointer' in
          both shells.
RISK:     The mobile header logo (:682) sits next to the hamburger — verify the
          tap targets do not overlap at 375px.
EFFORT:   S
```

```
FIX F-09
FILE:     brandgeo-dashboard/src/index.css
CHANGE:   Separate the sidebar from the canvas by measurable contrast. Either
          darken the canvas or lighten the panel so the pair clears 3:1, or
          keep the fills and raise the divider: set the aside's right border to
          a solid token that measures >=3:1 against BOTH rgb(10,15,30) and
          rgb(15,23,42). rgb(100,116,139) — already in use for the scrollbar
          thumb — measures 4.01:1 and 3.75:1 respectively and would work
          without introducing a new value.
ACCEPT:   Computed contrast between the sidebar surface (or its border) and the
          page canvas is >= 3.0:1, measured, in both dark and light themes.
RISK:     A brighter divider can read as heavy at 1px — check at 1280 and 375.
          Light mode already tints the sidebar separately (index.css:125-127);
          re-measure that path too rather than assuming it inherits.
EFFORT:   S
```

```
FIX F-10
FILE:     brandgeo-dashboard/src/components/Layout.tsx (navItemClass, :195-203)
CHANGE:   Do not rely on the 3px rail alone. Add a second cue that occupies
          real area: raise the active background so it clears ~1.5:1 against
          the sidebar, or drop inactive item text to a dimmer step so the
          active/inactive text pair clears 1.5:1. Today they are 1.17:1 and
          1.24:1 — both effectively invisible. Note the constraint recorded in
          the comment at :188-194: inactive items were deliberately brightened
          to slate-300 to stay distinct from the group headers, so darken the
          headers or shift the active state, not the inactive items.
ACCEPT:   With the rail hidden in devtools, the active item is still
          identifiable at a glance. Measured active-vs-inactive text OR
          background contrast >= 1.5:1.
RISK:     Touching inactive text re-opens the header/item hierarchy the comment
          protects. Re-measure all three levels (active, item, group header)
          after any change.
EFFORT:   S
```

```
FIX F-14
FILE:     brandgeo-dashboard/src/lib/planConfig.ts (ENGINE_META :91-99),
          Competitors.tsx (:258), BrandSentiment.tsx (:333-335,:377-379)
CHANGE:   Three moves, in order.
          1. Reserve #10b981 and #ef4444 for sentiment status ONLY. Re-slot
             ChatGPT and Google AI Mode onto non-status hues.
          2. Re-step Claude and Meta AI so the adjacent pair clears the
             normal-vision floor (dE >= 15) and CVD (dE >= 8). They currently
             measure 9.6 normal / 3.4 tritan. Move one of them off the
             orange-amber band entirely rather than nudging within it.
          3. Give Grok a chromatic slot; #94a3b8 is chroma 0.035 and reads as
             disabled.
          Delete Competitors.tsx:258 groupColors and key those bars off
          ENGINE_META by engine id, which fixes F-22 in the same edit.
          The palette must hold in BOTH places engine colour appears: charts
          (chartColor) and identity chips (color/bg Tailwind classes at
          BrandSentiment.tsx:422,452 and Mentions.tsx:204). Re-derive the
          -400 chip hues from the same re-validated ramp — do not hand-pick
          them separately, which is how orange-400/amber-400 got this close.
ACCEPT:   `node scripts/validate_palette.js "<the 9 chartColors>" --mode dark`
          passes the adjacent-pair CVD check, the normal-vision floor, and the
          chroma floor against the app's real surface rgb(10,15,30) — not the
          validator's default surface. No status hue appears in the categorical
          set. Re-run for --mode light.
RISK:     Engine colours are brand-recognisable (Claude/orange, ChatGPT/green).
          Moving ChatGPT off green is the contentious one — consider instead
          moving the sentiment scale off #10b981/#ef4444 to a dedicated status
          ramp, which is cheaper and less brand-disruptive. Decide that before
          implementing. Historical meta rows must still render.
EFFORT:   M
```

```
FIX F-VIEWAS  (Amendment 3 — "View as current user")
FILE:     new file: brandgeo-dashboard/src/lib/viewAsContext.tsx
          + brandgeo-dashboard/src/components/Layout.tsx
CHANGE:   A CLIENT-SIDE PRESENTATION TOGGLE ONLY.
          Placement: in the admin block of the sidebar, directly under the
          client switcher (Layout.tsx, inside the isAdmin && block at :340),
          so it reads as part of the admin toolset and is never visible to a
          real viewer.
          Mechanism: a ViewAsProvider exposing `effectiveIsAdmin`. Every
          current `isAdmin` consumer switches to `effectiveIsAdmin` for
          PRESENTATION decisions only. The raw `isAdmin` stays available and
          stays the value any security-relevant branch reads.
          Unmistakable state: while active, a persistent full-width bar pinned
          at the top of <main>, above ClientBanner, in a colour used nowhere
          else in the app, reading "Viewing as a member. You are still signed
          in as an admin." with an always-visible Exit button. It must not be
          dismissible and must not scroll away. An admin must never be able to
          mistake this for the real thing.
          Exits: the Exit button; the Escape key; and automatically on reload —
          the state lives in React only, never in localStorage, sessionStorage,
          or the URL, so a refresh always returns to true admin. This is
          deliberate: a persisted impersonation state is a state someone
          forgets they are in.
          HARD BOUNDARIES — the toggle MUST NOT:
            - mint, swap, exchange, or modify any token;
            - change any Authorization header on any request;
            - alter what _auth.js authorises — the server keeps deciding on the
              real JWT and the real user_profiles.role, unchanged;
            - be reachable, inferable, or activatable by a non-admin. A viewer
              flipping this flag in devtools must gain exactly nothing, because
              it only ever REMOVES affordances.
          Note the asymmetry that makes this safe: the toggle can only hide UI,
          never reveal it. That property must be preserved by every consumer —
          `effectiveIsAdmin` may only ever be `isAdmin && !viewingAsUser`.
ACCEPT:   With the toggle on, an admin sees exactly the twelve-route sidebar a
          viewer sees, minus the client switcher, plus the persistent banner.
          A viewer account with the flag forced true in devtools sees no new
          data and gains no new control. Every adminOnly Netlify function still
          returns 200 for the admin and 403 for the viewer, unchanged by the
          toggle's state. Reload while active returns to full admin view.
RISK:     Touches the auth surface. Per this project's own rules (CLAUDE.md §0
          model routing; AGENT-OS §2) this needs an INDEPENDENT SECURITY REVIEW
          before it ships — I am specifying it, not approving it. The specific
          review question: has any consumer used `effectiveIsAdmin` in a branch
          that GRANTS rather than HIDES? Enumerate all 60+ isAdmin references
          (listed in the role table above) and classify each as
          presentation-or-authorisation before converting any of them.
          Secondary risk: F-08 must be fixed first, or an admin toggling into
          viewer mode on /usage lands on the blank page and may read it as a
          crash.
EFFORT:   M
```

---

## What was not audited

- **The viewer experience live.** Assessed entirely from source. I cannot change my own role, and I was instructed under no circumstances to sign out — correctly, since no viewer password is available and the session could not be restored. Every claim in the role section is a source claim. **This is a real limitation:** a live viewer session could reveal layout or data problems that reading `isAdmin` branches cannot. The absence of a "view as user" control is precisely what forced this method, which is the argument for building it.
- **Light mode.** `index.css` carries roughly 60 `html.light … !important` overrides — a per-utility remap layer rather than semantic tokens, which its own comment at `:138` concedes. Exercising it means toggling a persisted user preference, so I left it alone. **This is the largest unaudited surface in the product** and it deserves its own pass.
- **768px viewport.** I measured 1280 and 375 with `innerWidth` asserted at each. I did not measure 768. Note that one `resize_window` call reported "reset to native size" while `innerWidth` stayed at 375 — I caught it on assertion and discarded the readings taken in that window. Any measurement not preceded by an assertion in this report does not exist.
- **Scroll restoration on *return* to a page.** F-05 establishes that scroll carries *forward* to a new route. Whether returning to a previously-visited route restores its own prior offset is untested — my first attempt ran on the zero-data tenant where the page was too short to scroll, and I am reporting that as inconclusive rather than guessing.
- **Every control that costs money.** Run Collection, Force Refresh, per-prompt refresh, AI Discover, prompt discovery, recommendation generation, the audit pipeline. Their *handlers* were read; their *behaviour* was not observed. Loading states, progress, partial failure, and mid-run cancellation for all of these are **NOT AUDITED**.
- **Mutation paths.** Create/edit/delete of clients, prompts, competitors, promotions; plan changes; onboarding completion; any form submission. Validation, error recovery, and optimistic-update correctness are **NOT AUDITED**.
- **`/welcome`, `/audit`, `/audit/:token`, `/reset-password`.** Source only. `/welcome` needs a profile-less account; `/audit/:token` needs a real token. Note that `/audit` and `/audit/:token` are **public routes with no link from anywhere in the authenticated app** — orphans by construction.
- **Whether F-01 has already cost money.** I did not query Supabase. Someone should check whether any existing client has `plan='essentials'` but was sold Growth or Growth PRO.
- **Screenshots.** Not used. Every visual claim here rests on computed style, measured contrast, or source — which is the stronger evidence anyway, and is why the four stale-doc claims could be refuted rather than repeated.
- **Real customer data.** The client switcher exposes the full customer roster to any admin, which is expected for this tool. Nine tenant names were visible; they are not reproduced here. No secrets, tokens, or credentials were encountered in any surface I inspected.
- **A rewrite was never considered and is not recommended.** The design system, the motion layer, the auth architecture, and the routing are all sound. Every finding in this ledger is a scoped fix.
