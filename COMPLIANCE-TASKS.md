# COMPLIANCE-TASKS.md — Master-Compliance Audit Findings

> Generated 2026-07-10 by `Master-Compliance` — a standing SEO/content-compliance
> audit session, separate from `Master-Writer02` (which builds content).
> Source: a full live-site + codebase compliance pass (structured data, internal
> links, marketing-claims-vs-product-reality, scaled-content risk, trust signals).
> **Nothing has been fixed yet — this is a task list only, for Constantin to work
> through locally.** Each item lists what it is, why it matters, and the exact
> file path(s) to edit. Re-derive nothing — this file is self-contained.
>
> Cross-reference: the underlying rule this audit checks against is
> `rules/content-integrity.md` (CLAUDE.md §0/§9.15) — BrandGEO content exists to
> bring clients genuine value, not to manipulate SEO/AI-citation ranking.

---

## HIGH — real risk, fix soon

### H1. ✅ FIXED 2026-07-10 (code-complete, NOT yet live — needs cPanel re-upload)

False "7 engines" product claim baked into core content — includes a literal broken promise on the free-audit CTA

**What:** `bg-001.html`, `bg-002.html`, and `bg-003.html` all carry this exact live
CTA: *"We'll audit how ChatGPT, Gemini, Claude, Perplexity, **Microsoft Copilot,
Meta AI, and Grok** respond to queries about your brand — free, in 48 hours."*
`bg-004.html` and `blog.html` repeat the same "all seven major AI engines"
framing in body copy, the og:description meta tag, and the shared footer
paragraph. Confirmed live on production via direct fetch of `bg-001.html`.

**Why it matters:** `brandgeo-dashboard/src/lib/planConfig.ts`
(`PLAN_ENGINES`, `COMING_SOON_ENGINES`) confirms only 5 engines are actually
live and collected — ChatGPT, Gemini, Claude, Perplexity, Meta AI. Copilot,
Grok, DeepSeek, and Google AI are `coming_soon` and never collected. This
isn't just a content-accuracy nit — it's a direct commercial promise made to
every visitor who fills out the free-audit form, and the product cannot
deliver on it. It also contradicts the 9 comparison pages
(`brandgeo-vs-*.html`), which all correctly state "5 core engines" — so the
newer content is accurate and only the original four articles + blog.html are
stale.

**Files to fix:**
- `brandgeo/web/bg-001.html` (the CTA line + the "seven major AI engines" body claim)
- `brandgeo/web/bg-002.html` (same CTA line + body claim)
- `brandgeo/web/bg-003.html` (same CTA line + body claim)
- `brandgeo/web/bg-004.html` (the "seven major AI engines" body claim, no literal CTA line but same false-count issue)
- `brandgeo/web/blog.html` (og:description meta tag + shared footer paragraph)

**Suggested fix direction:** change all instances to the accurate 5-engine
list (ChatGPT, Gemini, Claude, Perplexity, Meta AI) matching the language
already used correctly on `index.html` and every `brandgeo-vs-*.html` page.
Requires a cPanel re-upload of all 5 files once edited, per this project's
standard static-site deploy process.

**What was actually fixed (2026-07-10, `Master-Compliance`):** in each of
`bg-001.html`, `bg-002.html`, `bg-003.html` — the CTA line ("We'll audit how
ChatGPT, Gemini, Claude, Perplexity, Microsoft Copilot, Meta AI, and Grok
respond...") and the "seven major AI engines" body claim were both rewritten
to "5 core AI engines — ChatGPT, Gemini, Claude, Perplexity, and Meta AI",
matching the language already correct on `index.html`/`brandgeo-vs-*.html`.
In `bg-004.html`, the one "seven major AI engines" body claim (no separate
CTA line exists on this page) was fixed the same way. In `blog.html`, the
`og:description` meta tag was fixed the same way — no separate "shared
footer paragraph" instance of the false claim was found on this page (only
the og:description carried it).

**Deliberately left untouched** (out of this fix's scope per the audit's own
file list — these are either genuine historical case-study details or
general-market descriptions, not "BrandGEO currently monitors N engines"
claims): `bg-001.html`'s meta description/JSON-LD `mentions`/keywords/hero
alt text/table rows (these describe the general AI-engine landscape or list
entities the article discusses, not a BrandGEO coverage claim); `bg-002.html`/
`bg-003.html`'s keywords meta + JSON-LD `mentions` (same reasoning);
`bg-004.html`'s hero alt text and line 237 body text (these describe the
*actual, historical* 5-engine case-study test result — including Copilot,
which genuinely was tested at the time — not a forward-looking product
claim). If a stricter full sweep is wanted later (removing Copilot/Grok from
JSON-LD `mentions`/keywords entirely, sitewide), that's a separate, larger
task — flag if wanted.

**Verified 2026-07-10:** all 4 touched JSON-LD blocks (`bg-001–004.html`)
still parse valid after editing; `blog.html` was confirmed to have zero
JSON-LD blocks (none to break). Grepped all 5 files afterward for "seven
major"/"seven AI" and the old CTA phrasing — zero matches remain.

**✅ Uploaded 2026-07-10 — but live re-verification found 2 more instances
the first sweep's regex missed, now also fixed (round 2, code-complete, NOT
yet live):**
1. `bg-001.html`'s `og:description` used the **numeral** "7" ("We analyzed
   how 7 major AI engines respond...") — the original grep only searched for
   the spelled-out word "seven", so this slipped through. This is a
   high-visibility social-share summary, same risk category as the
   `og:description` already fixed in `blog.html`. Reworded to "We analyzed
   how leading AI engines respond..." (dropped the specific count rather
   than hardcoding a new number, since this line frames general market
   research, not a specific "BrandGEO tracks N engines" product claim).
2. `blog.html`'s **footer tagline** (`.footer-brand p`, line ~567) —
   "Monitor and measure your presence across every major AI engine —
   ChatGPT, Gemini, Claude, Perplexity, Copilot, Meta AI, and Grok." This is
   the real "shared footer paragraph" the original audit entry referred to;
   it was missed the first time because the sandbox's bash grep silently
   returned a stale/truncated view of `blog.html` (a documented recurring
   issue in this project — `brandgeo_bash_mount_staleness`) and only the
   `Read` tool caught it on a second pass. Fixed to "...Monitor and measure
   your presence across ChatGPT, Gemini, Claude, Perplexity, and Meta AI."
   Confirmed via `Grep` (reads the real file, unaffected by mount
   staleness) that this was the only occurrence of that sentence sitewide —
   `index.html` has no equivalent tagline with an engine list.

**Lesson for future passes on this file set:** when sweeping for a specific
phrase across `brandgeo/web/`, search both spelled-out and numeral forms
("seven" / "7"), and don't trust a single bash grep pass on `blog.html` (or
any file that's been recently edited) — cross-check with `Read`/`Grep` tool
output before concluding a phrase doesn't exist.

**Still requires your action — round 2 not live yet.** Upload the 2
re-edited files to cPanel: `bg-001.html`, `blog.html`. (Round 1's other 3
files — `bg-002.html`, `bg-003.html`, `bg-004.html` — are already confirmed
live via cache-busted fetch and need no further action.)

---

### H2. ✅ FIXED 2026-07-10 (code-complete, NOT yet live — `/news/` folder itself is also still unuploaded per CLAUDE.md §9.15)

`/news/` article's Copilot claim — same defect as H1, must be fixed before this page goes live

**What:** `brandgeo/web/news/real-time-ai-visibility-engine-launch/index.html`
states BrandGEO offers "live tracking across ChatGPT, Gemini, Perplexity,
Claude, and **Microsoft Copilot**." Already flagged once before (CLAUDE.md
§9.15) and still unfixed.

**Why it matters:** Same root cause as H1 — Copilot is `coming_soon`, not
live, per `planConfig.ts`. This content is typed as `NewsArticle` in its
JSON-LD, which is a stronger factual claim in the eyes of both search engines
and AI crawlers than ordinary marketing copy. **Confirmed via live fetch that
`/news/` is not yet uploaded to production** — so this is currently zero
public risk, but it must be corrected as part of (not after) the upload, or
it becomes a live false claim the moment it's published.

**Files to fix:**
- `brandgeo/web/news/real-time-ai-visibility-engine-launch/index.html` (meta description, JSON-LD `description`, and body dateline paragraph — 3 occurrences)

**Re-verification finding (2026-07-10, `Master-Compliance`):** the file had
already been *partially* hand-edited locally (by Constantin, presumably)
since this audit was first written — Copilot is no longer claimed as live.
The body paragraph now correctly reads "...live tracking across ChatGPT,
Gemini, Perplexity, and Claude, with Microsoft Copilot support coming soon"
— that framing is now accurate (Copilot genuinely is `coming_soon` per
`planConfig.ts`). **However, that partial fix introduced a new gap**: all 3
occurrences (meta description, JSON-LD `description`, and the body
paragraph) were missing **Meta AI** — one of the 5 engines that actually
*is* live — from the "live tracking across" list. Only 4 engines were named
(ChatGPT, Gemini, Perplexity, Claude) where 5 should be.

**Fixed 2026-07-10:** added "and Meta AI" to all 3 occurrences (meta
description, JSON-LD `description`, body paragraph), keeping the
already-correct "Microsoft Copilot support coming soon" framing untouched.
The article now accurately lists all 5 live engines and correctly frames
Copilot as not-yet-live rather than omitting it or falsely including it.

**Verified 2026-07-10:** the file's `NewsArticle` JSON-LD still parses valid
after editing. Grepped the full file for "Copilot" — the only remaining
occurrence is the now-accurate "coming soon" mention.

**Still requires your action.** Per CLAUDE.md §9.15, the entire `/news/`
folder (`news/index.html` +
`news/real-time-ai-visibility-engine-launch/index.html`) is still not yet
uploaded to cPanel at all — so this fix, plus the rest of that batch, all
need the same upload + the `index.html`/`blog.html`/`sitemap.xml` nav/footer
wiring described in §9.15, before any of `/news/` is live. This H2 fix
should go up as part of that same upload, not separately.

---

### H3. ✅ FIXED 2026-07-10 (code-complete, NOT yet live — needs cPanel re-upload)

"GDPR Compliant" footer badge is an unbacked trust claim

**What:** The sitewide footer badge — a lock icon + "GDPR Compliant" text —
links to `gdpr.eu`. That's a general public-information website, not a
certification or registration authority. There is no central body that
issues a "GDPR Compliant" certificate the way there is for SOC 2 or ISO
27001, so the badge visually implies a third-party verification that doesn't
actually exist.

**Why it matters:** A visitor (or a regulator) could reasonably read this as
a real compliance certification rather than a self-description. It's a soft
misleading-claim risk, adjacent to the same "don't claim more than is true"
principle behind H1/H2, just on the trust-signal side rather than the
product-capability side.

**Files to fix:**
- `brandgeo/web/index.html` (footer — 2 occurrences of the badge)
- Likely also present in the shared footer of `blog.html` and other pages using the same footer template — check all files for `gdpr-badge` class / `gdpr.eu` link before considering this done.

**Suggested fix direction:** either (a) drop the seal/badge visual styling
and just link the phrase to the real Privacy Policy / data-processing terms,
or (b) if there's real substance behind it (a written DPA, EU-based hosting,
a named data controller), state that specifically instead of an
unearned-looking badge. See L1 below for the related business-registration
trust-signal gap.

**Fixed 2026-07-10 (option a):** confirmed via sitewide grep that
`index.html` was the *only* page with the actual visible badge (`blog.html`
has the `.gdpr-badge` CSS class defined but never used in its HTML — dead
CSS, no visible claim, left as-is). Removed both occurrences:
1. The "Legal" footer column's `<li>` wrapping the badge/`gdpr.eu` link was
   removed entirely and replaced with a plain `Terms` link (Privacy Policy
   was already the sibling item in that same list; Terms wasn't previously
   duplicated in this column, so this isn't a redundant addition —
   confirmed by checking the rest of the footer first).
2. The footer-bottom's standalone `<a ... class="gdpr-badge">🔒 GDPR</a>`
   was removed outright (Terms + Privacy Policy already sit right next to
   it in the same row, so nothing was lost).

No new claim was invented to replace it — the fix is a straight removal,
consistent with there being no real DPA/certification substance confirmed
to state instead. Verified the surrounding `<div>`/`<li>` structure is still
balanced after both edits (Read tool, both footer blocks read back clean).

**Still requires your action — not live yet.** Upload `index.html` to
cPanel and verify live per `brandgeo_verify_cpanel_upload`.

---

## MEDIUM — worth fixing, not urgent

### M1. ✅ FIXED 2026-07-10 (code-complete, NOT yet live — needs cPanel re-upload, LARGE batch)

`cookies.html` is a real orphan page — no click-path from anywhere on the site

**What:** `brandgeo/web/cookies.html` has zero inbound links from any other
page (confirmed via a full internal-link sweep) — not the footer, not the
nav, nowhere. `privacy.html` and `terms.html` are both properly linked from
the footer; `cookies.html` isn't.

**Why it matters:** It's `noindex` and present in `sitemap.xml`, so bots can
still reach it, but a real visitor looking for the cookie policy has no way
to click through to it. Minor UX/legal-access gap, not an SEO violation.

**Files to fix:**
- `brandgeo/web/index.html` (footer "Legal" column — add a Cookies link alongside Privacy Policy)
- Same footer template wherever it's duplicated (`blog.html` and others — check)

**Fixed 2026-07-10 — turned out to be a genuinely sitewide gap, not just
`index.html`/`blog.html`.** Grepped the whole `brandgeo/web/` tree for the
Privacy footer link pattern and found it duplicated across **39 files**
(all 4 `bg-00X` article batches, all 9 `brandgeo-vs-*.html` comparison
pages, all 10 `ai-visibility-for-*.html` industry pages, `faq.html`,
`terms.html`, `support.html`, `index.html`, `blog.html`, plus the internal
`article-builder.html` tool). Ran a scripted batch fix (verified pattern
was byte-identical 6-space-indented `<a href="/privacy.html">Privacy</a>`
across every file before touching anything) that inserted
`<a href="/cookies.html">Cookies</a>` immediately after the existing
Privacy link in each file's footer.

**Same batch also folded in M4's fix sitewide** (see M4 below) — the
"Registered in Spain 🇪🇸 (EU)" phrase turned out to be duplicated across
**25** of those same files (every `bg-00X` article, all 9 comparison pages,
all 10 industry pages, `faq.html`, `privacy.html`, `support.html`,
`terms.html`), not just `index.html`. Fixed all 25 to "Based in Spain" in
the same pass, for consistency with the `index.html` fix already applied
earlier in this session.

**Verified 2026-07-10:**
- Zero remaining "Registered in Spain" instances anywhere in `brandgeo/web/`.
- Zero duplicate Cookies links (each file has exactly one).
- Spot-checked 3 representative files via the `Read`/`Grep` tools (not bash
  — this batch touched `bg-001.html`, which is the exact file where a bash
  mount staleness/encoding quirk gave a false "binary file" grep result;
  the `Read` tool confirmed the real content is correct plain text) — all
  footer HTML reads clean, no broken markup.
- Ran the JSON-LD validity check across all 41 touched-or-adjacent files —
  all pass except `article-builder.html`, which has a pre-existing (not
  newly introduced) JS-template-literal false positive already documented
  in L3 below; the actual footer edit in that file (line ~529) is
  correctly formed and unrelated to that failure.

**Still requires your action — not live yet.** This is a large upload: all
39 files above need re-uploading to cPanel. Given the volume, prioritize
verifying a handful after upload (e.g. `bg-001.html`, `brandgeo-vs-peec.html`,
`ai-visibility-for-saas.html`, `faq.html`) with a cache-busting fetch rather
than manually checking all 39 — the batch script's pattern-matching was
uniform across the set, so a few spot-checks are a reasonable confirmation
that the rest landed correctly too.

---

### M2. ✅ FIXED 2026-07-10 (code-complete, NOT yet live — needs cPanel re-upload)

`ai-visibility-for-hotels.html` uses inconsistent schema type vs. its 9 sibling pages

**What:** All 10 `ai-visibility-for-*.html` pages share one template. 9 of
them use `WebPage` as the primary JSON-LD `@type`; `ai-visibility-for-hotels.html`
uses `Article` instead.

**Why it matters:** Not incorrect on its own — the page's content genuinely
reads as an article/guide — but it's an unintentional inconsistency across
an otherwise identical page family, worth normalizing one way or the other.

**Files to fix:**
- `brandgeo/web/ai-visibility-for-hotels.html`

**Fixed 2026-07-10:** confirmed the sibling template's exact shape first
(`ai-visibility-for-saas.html`) — sibling pages use `WebPage` with
`name`/`description`/`url`/`inLanguage`/`isPartOf`/`publisher`/`about`/
`mentions`, not `Article`'s `headline`/`image`/`datePublished`/
`dateModified`/`author`. Rewrote the hotels page's JSON-LD block to match
the `WebPage` shape field-for-field (not just swapping the `@type` string),
preserving the same headline text as `name` and dropping the
Article-only fields that don't apply. **Also found and fixed one more
inconsistency in the same block while there:** `og:type` was `"article"` on
this page vs. `"website"` on every sibling — normalized to match.

**Verified 2026-07-10:** JSON-LD still parses valid after the rewrite (both
blocks on the page — WebPage + FAQPage — checked).

**Still requires your action — not live yet.** Upload
`ai-visibility-for-hotels.html` to cPanel and verify live.

---

### M3. 19 templated pages (10 industry + 9 comparison) — not a violation today, but worth monitoring

**What:** The 10 `ai-visibility-for-*.html` pages and 9 `brandgeo-vs-*.html`
pages all share one structural template, published the same week.

**Why it matters:** Spot-checked titles, meta descriptions, and body stats —
each page has genuinely unique, freshly-sourced data (not swapped-noun
boilerplate), so this isn't scaled-content abuse as Google defines it today.
But ~20 near-identical-shaped pages launched at once is exactly the pattern
Google's spam systems scrutinize most closely. No action needed right now —
just keep an eye on Google Search Console for any manual-action flags after
these have been indexed for a few weeks.

**Files involved:** `brandgeo/web/ai-visibility-for-*.html` (10 files),
`brandgeo/web/brandgeo-vs-*.html` (9 files) — no specific file needs editing,
this is a "watch" item.

---

### M4. ✅ WORDING SOFTENED 2026-07-10 (registration number itself deliberately NOT pursued — see below)

Business registration is a text claim only, no verifiable registry link

**What:** The footer says "Registered in Spain 🇪🇸 (EU)" with no company
registration number (CIF/NIF) and no link to the actual public business
registry entry.

**Why it matters:** This is the one genuinely fixable trust-signal gap from
the audit — if the entity is properly registered, adding the real
registration number and a link to the public registry (Spain's Mercantile
Registry, or the relevant Canary Islands registry) turns this from an
unverifiable claim into a real, checkable trust signal. Requires Constantin
to supply the actual registration number/paperwork — nothing to invent.

**Update 2026-07-10 — real constraint found, original suggestion doesn't
apply.** Constantin operates as an **Autónomo** (Spanish sole trader), not
an SL — so there is no CIF (company tax ID) to publish. An Autónomo trades
under their own personal NIF/NIE, which is also the number used for
invoicing and tax filing. **He does not want to publish that number
publicly**, which is a reasonable and correct call — a NIE is a personal
government ID number, not a business registration number, and this project
already treats personal ID numbers as sensitive (see the memory-system
"government identifiers" exclusion). **This task should NOT push for
publishing a NIE.** The original "add the real registration number" fix
direction was written assuming an SL/company structure and doesn't fit an
Autónomo — corrected here rather than followed as originally written.

**Recommended alternative (not yet applied, needs Constantin's go-ahead):**
soften the footer copy so it states location/jurisdiction honestly without
implying a checkable "registration" that doesn't exist in the form a
visitor might expect. Concretely: the footer-bottom currently reads
"Registered in Spain 🇪🇸 (EU)" — the word "Registered" is the part doing
the unearned-claim work (same root issue as H3). Could change to just
"Spain 🇪🇸 (EU)" or "Based in Spain 🇪🇸 (EU)", leaving the existing
`reg-info` block (Santa Cruz de Tenerife / Canary Islands, Spain / European
Union) as the honest, already-accurate location statement — no new claim
needed, no personal ID exposed.

**Other paths if a checkable credential is wanted later** (not something to
decide as part of a compliance cleanup — flagging only): a registered trade
name (*nombre comercial*) gets its own public registry number distinct from
a personal NIE, or incorporating as an SL later would generate a public CIF
by design. Both are business-structure decisions, not doc-fix tasks.

**✅ Wording fix applied 2026-07-10 (Constantin approved), sitewide.**
Changed "Registered in Spain 🇪🇸 (EU)" → "Based in Spain 🇪🇸 (EU)" — first
in `index.html` on its own, then found (while working M1 above) that the
exact same phrase was duplicated across **25 files total** — every
`bg-00X` article, all 9 `brandgeo-vs-*.html` comparison pages, all 10
`ai-visibility-for-*.html` industry pages, `faq.html`, `privacy.html`,
`support.html`, and `terms.html` — fixed all of them in the same batch
pass as M1. Verified zero remaining "Registered in Spain" instances
sitewide. No registration number was invented or published anywhere —
this is a wording softening only, per Constantin's explicit direction not
to expose his personal NIE.

**Separately discussed and parked, for reference:** looked into the UK
ICO (Information Commissioner's Office) data protection fee/registration
as a *real*, cheap (~£52/yr), publicly-checkable alternative credential —
unlike the removed GDPR badge, ICO registration is genuine and searchable
on their public register. Applies if a non-UK company has UK
customers/visitors whose personal data it processes (territorial scope
under UK GDPR Art. 3(2)), and separately Art. 27 would require designating
a UK representative. **Constantin confirmed he has no UK customers
currently, so this is parked — not needed yet.** Revisit if/when UK
customers exist. Also discussed but not pursued: a DPA (Data Processing
Agreement) draft (parked, "not yet" — useful once enterprise clients ask
for one) and TrustArc/TRUSTe (a real paid cross-jurisdiction privacy seal,
but enterprise-priced — contracts typically start ~$10k/yr, not
appropriate at current stage).

**Still requires your action — not live yet.** The 25 files above need
the same cPanel upload as M1 (largely the same file set — see M1's upload
note; this can go up as one combined batch, not two separate uploads).

**Files to fix (if Constantin approves the softened-copy direction):**
- `brandgeo/web/index.html` (footer-bottom line only — the `reg-info` block itself doesn't need to change, it's already non-claiming)
- Same footer template elsewhere it's duplicated

---

## LOW — cosmetic / informational, no action required

### L1. Trust-signal inventory — what's real, what needs paperwork, what's premature

Not a bug list — a reference for future trust-signal decisions:

- **SSL/security seals:** already fine. HTTPS is in place, no fake seals
  (Norton/McAfee etc.) found anywhere on the site. Third-party SSL seals
  aren't standard practice for a SaaS at this stage — nothing to add here.
- **SOC 2 / ISO 27001:** not claimed anywhere for BrandGEO itself (only
  mentioned as competitor context, or as advice to clients). Correct as-is —
  these require real audits. Don't add any claim until actually earned.
- **Review platforms (Trustpilot / G2 / Capterra):** no BrandGEO profile
  referenced anywhere on the site. Nothing false, but also no positive trust
  signal here yet. Worth pursuing once there are a handful of real paying
  customers who can leave reviews — premature before that.

### L2. Caching layer occasionally serves a stale `blog.html` on first request

**What:** First fetch of `blog.html` without a cache-busting query param
returned a stale version (showed BG-002 through BG-006 as "Coming soon" when
all 15 articles are actually published live). A cache-busting param resolved
it immediately, and this matches previously-documented site behavior
(`brandgeo_verify_cpanel_upload` project memory).

**Why it's low priority:** Not a content bug — the real file is correct. Only
flagged because a crawler or new visitor hitting a cold cache edge could
briefly see stale/incomplete content. If this keeps recurring after uploads,
it may be worth a CDN/cache-header review — no code fix needed today.

**Files involved:** none — this is a hosting/cache-layer note, not a content fix.

### L3. Confirmed clean — no action needed

- No broken internal links or broken anchor fragments found across ~40 pages
  checked (aside from harmless JS-template-literal false positives inside the
  internal-only `article-builder.html` tool, which isn't public-facing).
- `NewsArticle` schema is used correctly and only on the one real news
  article — no schema misapplication found anywhere else on the site. The
  link-injection/city-duplication request declined earlier by
  `Master-Writer02` was not built.
- `robots.txt` is clean and correctly allows AI retrieval bots
  (GPTBot, ClaudeBot, PerplexityBot, etc.) alongside standard search crawlers.

---

## Suggested order of work

**All HIGH and MEDIUM (fixable) items are now code-complete as of
2026-07-10. Nothing is blocked — everything remaining is upload +
live-verification.**

1. ✅ H1 — round 1 uploaded + live-verified. Round 2 (2 missed instances)
   code-complete, not yet uploaded.
2. ✅ H2 — code-complete, not yet live (bundled with the rest of the
   still-unuploaded `/news/` folder per CLAUDE.md §9.15).
3. ✅ H3 (GDPR badge) — code-complete, not yet live.
4. ✅ M2 (hotels page schema type) — code-complete, not yet live.
5. ✅ M1 (cookies.html link) — code-complete, not yet live. Turned out to
   be a 39-file sitewide gap, not just 2 files — see M1 section.
6. ✅ M4 (business registration wording) — code-complete, not yet live.
   Constantin confirmed: soften wording only ("Based in Spain", no
   registration number), NIE will not be published. Same 25-file batch as
   M1. UK ICO registration researched and discussed — parked, no UK
   customers yet.
7. M3 — no fix, just monitor Search Console periodically.
8. L1/L2/L3 — no action needed now; L1 is a reference for future trust-signal
   decisions (DPA drafting and TrustArc both discussed and parked — "not
   yet" — see M4 section), L2/L3 are informational.

All `brandgeo/web/` edits require the standard manual cPanel re-upload +
live-fetch verification (with a cache-busting param) before being considered
done — same process as every other static-site change in this project.

**Pending cPanel upload as of 2026-07-10 — full list, this session's work:**
- `index.html`, `blog.html` — H1 round 2 + H3 + M1 + M4 (all overlap here)
- `bg-001.html` through `bg-015.html` (15 files) — M1 + M4
- All 9 `brandgeo-vs-*.html` comparison pages — M1 + M4
- All 10 `ai-visibility-for-*.html` industry pages — M1 + M4 (+ M2 for
  `ai-visibility-for-hotels.html` specifically)
- `faq.html`, `terms.html`, `support.html`, `privacy.html` — M1 and/or M4
  (see each section for which files needed which fix)
- `article-builder.html` — M1 only (internal tool, low priority to upload
  but included for consistency)

That's the vast majority of `brandgeo/web/`'s public HTML files in one
batch. Given the volume, spot-check a handful after upload (`bg-001.html`,
`brandgeo-vs-peec.html`, `ai-visibility-for-saas.html`, `faq.html`,
`index.html`) with a cache-busting fetch rather than checking all ~40
individually — the fixes were applied via a verified, uniform scripted
pattern match, so a few spot-checks are a reasonable confirmation the rest
landed correctly.

**Already confirmed live from earlier in this session:** `bg-002.html`,
`bg-003.html`, `bg-004.html` (H1 round 1 — but note these 3 files also now
have *additional*, not-yet-uploaded M1/M4 changes from this later batch, so
they need re-uploading again despite being "confirmed live" for round 1).

**Next up for `Master-Compliance`:** nothing left to fix from this audit
pass except M3 (watch-only) and the parked L1 items. A fresh audit pass on
different pages, or picking up the DPA draft / UK ICO follow-through
whenever those become relevant, would be reasonable next steps.
