# Fire cards, 2026-08-13 (Sprint 17, Day 1)

Written by `gtm-demand`. Scope: `docs/growth/channels/` write, read-only
elsewhere. No account was created, no form was submitted, no post was
published, no login happened while writing this file. Every field below is
paste-ready; the submit action is named once per card and is Constantin's
alone.

Sources for every MEASURED claim: `docs/growth/GTM-TEAM.md`,
`docs/growth/sprint17/PLAN-2026-08-13.md`,
`docs/audit/gtm-channel-audit-2026-08-13.md`, every pack in
`docs/growth/launch-directories/`, plus live fetches run today (fazier.com,
fazier.com/submit, producthunt.com/products/brandgeo-2, getbrandgeo.com) and
two third-party submission guides for Fazier's field order (Fazier's own
authenticated form did not render to this session's fetch, see the Fazier
card for the exact gap). Everything else is INFERRED and marked as such.

---

## Today's fire order (quick reference, detail below)

| # | Action | Minutes | Deadline | Why this position |
|---|---|---|---|---|
| 1 | Create the AlternativeTo account (do this even though the listing fires later) | 2 | Today, 2026-08-13 | 7 day account age clock; every day this waits pushes the listing back a day |
| 2 | Fire LinkedIn company page card | 8 | This week | Only owned audience in the list; edit is live the moment you save it |
| 3 | Fire Uneed redo card | 9 | This week | Was mid-submission once already; lowest redo cost |
| 4 | Fix GBP (Products entries + the two stale images) | 12 | This week | Actively publishing a false claim right now, independent of traffic upside |
| 5 | Reply to the one Product Hunt comment thread | 5 | This week | Gallery appears already fixed (see finding below); this is the only real gap left |
| 6 | Start G2 | 10 | This week, early | 3 to 5 day approval clock; free profile carries no link so start it for the clock, not for near term traffic |
| 7 | Indie Hackers | 10 | This week | Community traffic, moderate |
| 8 | Record the Fazier demo video (separate toolchain), then fire the Fazier card | 10 (card only) | As soon as the video exists | Full card below, only blocker is the video |
| 9 | AlternativeTo actual submission | 10 | Earliest 2026-08-20 (Day 8) | Gated by #1's clock, not by effort |
| - | DevHunt | 0 | Do not fire | Blocked on a fit decision, escalated below, not decided in this file |

---

# PRIORITY 1: FAZIER

## What changed since the pack was written (2026-08-04)

The pack's own source note said Fazier's live form sits behind the app and
returned no field spec to that session's fetch. Same result today: two
direct fetches of `fazier.com/launch` and `fazier.com/submit` returned only
navigation and a loading state, and `fazier.com/launch-guide` 404s. The real,
authenticated submission form could not be rendered by this session's fetch
tools either. What is new and MEASURED today, from `fazier.com/submit`
(fetched 2026-08-13):

- **Pricing tiers changed and are now precise.** Basic (free): "Reviewed and
  listed within 30 days," a backlink is required. Lite: USD 29 (shown as
  reduced from USD 39). Premium: USD 49 (reduced from USD 69). Super: USD
  149 (reduced from USD 119). The pack only said "check current pricing;"
  these are the live numbers.
- **The field order below is drawn from two independent third-party
  submission guides** (`submitator.com/submit-to-fazier`,
  `launchdirectories.com/directory/fazier`), fetched 2026-08-13, since the
  real form would not render. Both agree on: product name, tagline, website
  URL, category, Twitter/X profile, LinkedIn page, topics (up to three),
  description, key features. Confirm this order against the live form before
  pasting; if it has changed, that is a finding against this card, not a
  reason to guess.
- **Neither fetch nor either guide mentions a demo video field.** Constantin
  reports directly, from having opened the real authenticated form himself,
  that Fazier does ask for one, and that this is the one blocker on an
  otherwise-ready page. His first-hand account of the live form outranks
  third-party guides that could not see it either, so the video field is
  treated as real below.

## Fire-by and cost

**Fire-by: as soon as the video exists, target no later than 2026-08-19**
(inside the PLAN's Days 4-9 directory-lane window, with two days of buffer
before that lane closes 2026-08-21). **Cost: under 10 minutes once the video
is recorded and hosted.** The video itself is the long pole, not the form.

## Prerequisites (yes/no)

| Prerequisite | Status |
|---|---|
| Fazier account exists | Unknown, Constantin to confirm before starting |
| Logo file on disk | YES, `C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\brand-identity-2026-07-29\v3\png\mark-512.png` |
| Screenshots on disk | YES, three real product images already exist at `C:\Users\const\Constantin Daniel Goane\BrandGEO\marketing\Product Publish\1.avif`, `2.avif`, `3.avif` |
| Demo video recorded | NO, this is the blocker, see the shot list below |
| LinkedIn page to link | YES, `https://www.linkedin.com/company/79409681` |

## Click path

1. Go to `fazier.com`.
2. Click **Join** (top right) if not signed in, or **Sign In** if the
   account already exists.
3. Click **Submit Product** (footer link) or go directly to
   `fazier.com/submit`.
4. Fill the fields below in the order the live form actually presents them.
   The order used here is the best current source available (see the note
   above); confirm it matches before pasting.

## Fields, exact text

**Product name**
```
BrandGEO
```

**Tagline** (guides report a 60 character cap; this is 35, no cut needed)
```
See how AI engines rank your brand
```

**Website URL**
```
https://getbrandgeo.com/?utm_source=fazier&utm_campaign=launch#free-audit
```

**Category** (pick the single closest match on the live picker)
```
AI Tools
```
Secondary, if the picker allows a second tag: `Marketing`

**Twitter/X profile**
```
LEAVE BLANK
```
No BrandGEO X account exists (MEASURED, `gtm-channel-audit-2026-08-13.md`:
"no BrandGEO/getbrandgeo X account surfaced in search"). Do not invent a
handle to fill the field.

**LinkedIn page**
```
https://www.linkedin.com/company/79409681
```

**Topics** (up to three, pick closest matches on the live picker)
```
AI Tools
Marketing
Analytics
```

**Description** (the same 189 character description used on every other live
listing, kept identical for entity consistency)
```
See how visible your brand is across up to seven AI engines, from ChatGPT and Gemini to Grok and Google AI Overviews. BrandGEO scores your AI presence.
```

**Full description** (if the form has a second, longer field)
```
BrandGEO runs your brand's real buyer questions against up to seven AI engines (ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews, Grok) and reports whether you're mentioned, where you rank against named competitors, and what sentiment the answer carries.

Built for the business one tier down from who the enterprise AI-visibility tools serve: a free tier to check today, and Radar at EUR 29/month (launch price, EUR 39 after) to monitor it ongoing without needing a growth team's budget.
```

**Key features**
```
Runs your brand's real buyer questions against up to seven AI engines
Shows exactly where you rank against named competitors
Tracks sentiment, positive, neutral, or negative, per engine and per prompt
Turns gaps into specific, prompt level recommendations
Free tier to check today; Radar at EUR 29/month to monitor it ongoing
```

**Demo video**
```
[Field confirmed by Constantin directly, 2026-08-13, from the live
authenticated form; not visible to this session's fetch. Likely wants a
hosted video URL rather than a raw file upload, for example an unlisted
YouTube link or a Loom link, both free to create. Confirm the exact field
type on the live form. Paste the hosted URL here once the shot list below
is recorded.]
```

**Pricing tier for launch visibility**
```
Recommended default: Basic (Free).

Fazier's own text for this tier (fetched fazier.com/submit, 2026-08-13):
"Reviewed & listed within 30 days," a backlink is required.

CHECK BEFORE CHOOSING: if Basic requires a backlink or badge embedded on
getbrandgeo.com, that is a one-line HTML change and belongs with bg-web,
not inside this submission. If the live form does not actually require it,
Basic needs nothing further.

Paid alternatives exist and are NOT decided here, this is a spend decision
and a HUMAN CHECKPOINT per GTM-TEAM.md section 7:
  Lite    USD 29 (shown as reduced from USD 39)
  Premium USD 49 (shown as reduced from USD 69)
  Super   USD 149 (shown as reduced from USD 119)
```

## Assets

| Asset | Absolute path |
|---|---|
| Logo | `C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\brand-identity-2026-07-29\v3\png\mark-512.png` |
| Screenshot 1 | `C:\Users\const\Constantin Daniel Goane\BrandGEO\marketing\Product Publish\1.avif` |
| Screenshot 2 | `C:\Users\const\Constantin Daniel Goane\BrandGEO\marketing\Product Publish\2.avif` |
| Screenshot 3 | `C:\Users\const\Constantin Daniel Goane\BrandGEO\marketing\Product Publish\3.avif` |
| Demo video | not yet recorded, see shot list below |

## Submit

Click **Submit** (or the live form's equivalent final button). Constantin
does this. Nobody else does.

## External check

**URL to fetch:** `https://fazier.com/launches/brandgeo` (slug pattern
INFERRED from other live Fazier listings observed today, for example
`fazier.com/launches/copyboost` and `fazier.com/launches/taskject`; the real
slug is whatever Fazier assigns at approval, confirm and correct this URL
once known).

**String to look for:** `BrandGEO`

**Earliest date the check can pass, by tier:**
- Basic (free): up to 30 days from submission, per Fazier's own published
  text. If submitted 2026-08-19, earliest realistic pass is 2026-09-18,
  though Fazier may list sooner.
- Lite/Premium/Super (paid): described as skipping the wait; no exact SLA
  published for the paid tiers in anything fetched this session, so treat
  "a few business days" as INFERRED, not confirmed, and re-check.

---

## The demo video: shot list

**Format:** MP4 primary, converted to GIF for any directory that only takes
one. **Length: 45 to 75 seconds. No voiceover.** Captions below are on-screen
text overlays, added in whatever free editor records or trims the capture;
none of this requires a paid tool. The recording toolchain itself is being
solved separately; this list assumes only that a free screen recorder
producing MP4 is available.

**Opens on the real free audit, live, no login, because it is the product's
fastest proof.** Nothing in this list requires data BrandGEO does not have:
no customer count, no testimonial, no dashboard that needs a login (the
paying client's dashboard is never shown, and its data is never named).

Live UI copy confirmed by fetching `getbrandgeo.com` today (2026-08-13):
input placeholder "Type your domain and get a scored answer in under a
minute," button "Check my visibility," loading state "Live audit running" /
"Querying the engines for your domain," result headline "One number, six
dimensions," across recognition, knowledge, sentiment, accuracy, reach, and
consistency.

| # | Time | Duration | Screen / URL | Action | On-screen caption |
|---|---|---|---|---|---|
| 1 | 0:00-0:06 | 6s | `getbrandgeo.com`, hero, fully loaded | Open the homepage. Let it sit, cursor visible near the audit input. No click yet. | none |
| 2 | 0:06-0:14 | 8s | `getbrandgeo.com`, hero, the audit input field | Click into the input, type `getbrandgeo.com`, click "Check my visibility." If typing reads slow on camera, record at normal speed and speed this segment up 2x in the edit rather than typing unnaturally fast on screen. | "No signup. No card." |
| 3 | 0:14-0:24 | 10s | `getbrandgeo.com`, loading state | Hold on the "Live audit running" / "Querying the engines for your domain" state. Do not skip it, it is the proof the check is real and live, not canned. | "Checking real AI engines, live" |
| 4 | 0:24-0:38 | 14s | `getbrandgeo.com`, audit result | Let the score render fully. Hold on "One number, six dimensions" without scrolling yet. | "One number, six dimensions" |
| 5 | 0:38-0:50 | 12s | `getbrandgeo.com`, audit result detail | Scroll slowly to reveal the six dimensions: recognition, knowledge, sentiment, accuracy, reach, consistency. | "Recognition. Knowledge. Sentiment. Accuracy. Reach. Consistency." |
| 6 | 0:50-0:58 | 8s | `getbrandgeo.com`, pricing section | Scroll down to the pricing section. Hold on the Free and Radar cards. | "Free to check. Plans from EUR 29/month." |
| 7 | 0:58-1:03 | 5s | Static end card, not a live page | Cut to a still frame: logo plus URL. Use `C:\Users\const\Constantin Daniel Goane\BrandGEO\marketing\Product Publish\logo wide background.png` as the background/logo asset. | "getbrandgeo.com" |

**Total: 63 seconds.** Inside the 45 to 75 second window with room to trim
shot 5 by a few seconds if it runs long.

**Do not record:** any dashboard route behind login (`/ai-visibility`,
`/sentiment`, `/competitors`), the paying client's name or domain, any
customer count, testimonial, or logo wall, any "trusted by" claim, any
trial language, any countdown or deadline framing on the Radar price.

---

# PRIORITY 2: the other unexecuted directories, ranked

Ranked by expected qualified traffic per minute of founder effort, given
what is actually true today, not the packs' original assumptions. Product
Hunt and SaaSHub are excluded here, they are already live (see Priority 3
for Product Hunt; SaaSHub needs no action).

## 1. LinkedIn company page (highest ratio: owned audience, edit is live
instantly)

The page already exists and already carries the only channel with any
measured pull this whole run (MEASURED, audit: "LinkedIn (founder profile)
is the only surface with any evidence of pull"). This is not a new
directory, it is a fast edit to something with a real, if quiet, audience.

**Fire-by:** this week. **Cost: 8 minutes.**

**Prerequisites:** page exists and is admin-accessible, YES
(`https://www.linkedin.com/company/79409681`, MEASURED live, referenced in
`index.html`'s own JSON-LD).

**Click path:** Log in as page admin, open **Edit page**.

**Fields:**

CTA button
```
Button: Visit website
Destination URL: https://getbrandgeo.com/?utm_source=linkedin&utm_campaign=launch#free-audit
```

Website field (Overview tab)
```
https://getbrandgeo.com/?utm_source=linkedin&utm_campaign=launch#free-audit
```

Featured section item
```
Link: https://getbrandgeo.com/?utm_source=linkedin&utm_campaign=launch#free-audit
Title: Check your brand's AI visibility, free
Description: See how visible your brand is across up to seven AI engines, from ChatGPT and Gemini to Grok and Google AI Overviews. BrandGEO scores your AI presence.
```

About/Overview text, replace only if it currently names Meta AI or says
"five engines"
```
BrandGEO monitors how brands appear across up to seven AI engines: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews, and Grok. Free to check your own visibility; paid plans start at EUR 29/month.
```

**Assets:** logo, if the page's current logo needs refreshing,
`C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\brand-assets-v3-2026-07-31\png\gbp\gbp-logo-720-violet.png`.
Cover banner: no asset exists in the brand kit at LinkedIn's 1128x191 ratio,
flag to design rather than stretch a mismatched image.

**Submit:** Click **Save** / **Publish** on each edited section. Constantin
does this.

**External check:** fetch `https://www.linkedin.com/company/79409681/`
(logged out view). LinkedIn heavily restricts what an unauthenticated fetch
can see, so this check is best effort; look for the string "Visit website"
near a CTA button. Earliest pass: same day, LinkedIn page edits publish
immediately.

## 2. Uneed (second: submission was already mid-flow once, lowest redo cost)

**Fire-by:** this week. **Cost: 9 minutes.**

**Prerequisites:** Uneed account exists (Constantin was mid-submission
2026-08-04), YES per the pack; current listing is a 404 (MEASURED,
`uneed.best/tool/brandgeo`, audit 2026-08-13), so this is a redo, not a
first attempt.

**Click path:** Log into `uneed.best`, find **Submit a Product** (account
menu or a "+" New Product control). Exact live button label was not
independently re-verified this session, since it sits behind login; confirm
against what the account menu actually shows before proceeding.

**Fields:** unchanged from the existing pack, reproduced for convenience.

Product name
```
BrandGEO
```

Tagline
```
See how AI engines rank your brand
```

Detailed description: the long-form copy already delivered and pasted once
mid-submission on 2026-08-04, preserved verbatim in
`docs/growth/launch-directories/uneed.md` under "Detailed Description."
Reuse it exactly, do not rewrite it.

Website URL
```
https://getbrandgeo.com/?utm_source=uneed&utm_campaign=launch#free-audit
```

Pricing model
```
Freemium
```

Twitter/X handle
```
LEAVE BLANK
```
No confirmed BrandGEO X account exists.

Maker field
```
Constantin Daniel
```

**Assets:**

| Asset | Absolute path |
|---|---|
| Square logo | `C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\brand-identity-2026-07-29\v3\png\mark-512.png` |
| Wordmark | `C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\CAMPAIGN-2026-07-30\_shared\logo\brandgeo-wordmark-dark-transparent-w512.png` |
| Screenshot | `C:\Users\const\Constantin Daniel Goane\BrandGEO\marketing\Product Publish\1.avif` (a real dashboard-style asset already on disk; if Uneed's gallery wants a literal in-app screenshot rather than this marketing asset, that still needs live capture) |

**Submit:** Click **Submit** on Uneed's form. Constantin does this.

**External check:** fetch `https://www.uneed.best/tool/brandgeo`, string to
look for: `BrandGEO`. Earliest pass: same day, Uneed does not require a
scheduled launch date per the pack. Re-check within 24 hours given the prior
attempt died mid-flow; if still 404 after a day, that is a finding, not a
retry-forever situation.

## 3. Indie Hackers (community traffic, moderate)

**Fire-by:** this week. **Cost: 10 minutes.**

**Prerequisites:** Indie Hackers account, unknown, Constantin to confirm.

**Click path:** Log into Indie Hackers, go to **Profile → Products → Add
Product** (or the current equivalent; this flow lives behind login and was
not independently re-verified this session).

**Fields:**

Product name
```
BrandGEO
```

Tagline
```
See how ChatGPT, Gemini, and five other AI engines answer for your brand
```
74 characters. If the live field caps shorter, use instead:
```
See how AI engines rank your brand
```

Full description
```
BrandGEO runs a brand's real buyer questions against up to seven AI engines (ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews, Grok) and reports whether the brand is mentioned, how it ranks against named competitors, and what sentiment the answer carries.

I built it because the tools doing this well are priced for enterprise marketing teams. BrandGEO has a free tier to check your own visibility today, and Radar, a EUR 29/month entry tier (EUR 39 after launch), for a smaller business or solo operator who wants to monitor this ongoing rather than check once.

Built and run solo from the Canary Islands, Spain.
```

Website
```
https://getbrandgeo.com/?utm_source=indiehackers&utm_campaign=launch#free-audit
```

Revenue field, if the form asks
```
LEAVE BLANK unless Constantin chooses to fill it himself. This is a founder
financial disclosure, not something to pre-fill.
```

**Assets:** logo,
`C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\brand-identity-2026-07-29\v3\png\mark-256.png`.

**Submit:** Click **Publish** / **Add Product**. Constantin does this.

**External check:** the URL is assigned at creation and cannot be predicted
in advance; record the exact URL Indie Hackers gives immediately after
submitting, and pass it to `gtm-verify`. String to look for once known:
`BrandGEO`. Earliest pass: same day (INFERRED, Indie Hackers product pages
are not known to sit behind a review queue, not directly confirmed this
session).

## 4. AlternativeTo (highest long-run ceiling, delayed by the account-age
clock, start the clock today regardless)

**This is why the account creation sits at the top of today's fire order
above, separately from this ranked position.** The listing itself cannot
happen until the account is seven days old, so its traffic contribution
today is zero no matter how good the eventual placement is. Its long-run
value is real: once live, it supports "suggest as an alternative" links on
Profound, peec.ai, and AthenaHQ's own pages, which is BrandGEO's exact ICP
browsing for exactly this kind of comparison.

**Fire-by (account creation): today, 2026-08-13. Cost: 2 minutes.**
**Fire-by (the actual listing): no earlier than 2026-08-20 (Day 8). Cost: 10
minutes.**

**Prerequisites:** AlternativeTo account, INFERRED not yet created or not
yet seven days old (audit: "the account-age clock was likely never
started"), Constantin to confirm.

**Click path (today, account only):** Go to `alternativeto.net`, create an
account. Nothing else today.

**Click path (Day 8, the listing):** User icon (top right) → **Suggest new
application** → fill the fields below → **Submit the application**.

**Fields (for Day 8):**

App name
```
BrandGEO
```

Platforms
```
Web
```

License
```
Free with Limited Functionality
```

Description
```
BrandGEO tracks how your brand appears across up to seven AI engines (ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews, and Grok): mention rate, sentiment, ranking against named competitors. Free tier available; paid tiers from EUR 29/month. Based in Spain, built for brands worldwide.
```
268 characters. No published cap found; this matches AlternativeTo's typical
listing length.

Tags
```
AI Visibility, GEO monitoring, Generative Engine Optimization, AI search tracking, brand mention tracking
```

Website
```
https://getbrandgeo.com/?utm_source=alternativeto&utm_campaign=launch#free-audit
```

**Assets:**

| Asset | Absolute path |
|---|---|
| Logo | `C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\brand-identity-2026-07-29\v3\png\mark-256.png` |
| Screenshot | not on disk, needs a real capture of `/ai-visibility` before Day 8 |

**Submit:** Click **Submit the application**. Constantin does this, on or
after 2026-08-20.

**Follow-on (after approval, separate from the listing itself):** visit each
of Profound, peec.ai, AthenaHQ, Semrush AI Toolkit, and Ahrefs Brand Radar's
AlternativeTo pages (if they exist, check live first), **Contribute to this
page → Suggest Alternatives**, add BrandGEO, link to the matching
`brandgeo-vs-*.html` page. Do not claim any of the five are inferior;
AlternativeTo can mark an overclaiming suggestion as non-genuine.

**External check:** fetch `https://alternativeto.net/software/brandgeo/`,
string to look for: `BrandGEO`. Currently 404 (MEASURED, audit 2026-08-13).
Earliest pass: submission no earlier than 2026-08-20, plus AlternativeTo's
own review window of "a couple of days to up to a week," so earliest
realistic pass is 2026-08-22, possibly as late as 2026-08-27.

## 5. G2 (start the clock today, but the free profile carries no link, so
near-term traffic is close to zero)

**This ranks below AlternativeTo and Indie Hackers on near-term traffic
specifically because G2's own pack states free profiles get no clickable
website link or CTA button** (MEASURED, `g2.md`: "Free G2 profiles do NOT
get a direct website link or CTA button"). The reason to start it today
regardless is the 3 to 5 business day approval clock; PLAN section 3 puts it
first in the Days 4-9 lane for exactly this reason.

**Fire-by:** as early as possible, ideally today or tomorrow. **Cost: 10
minutes.**

**Prerequisites:** a `getbrandgeo.com` work email for verification, YES,
`constantin@getbrandgeo.com` or `support@getbrandgeo.com` both exist per the
pack.

**Click path:** `learn.g2.com/claim-free-g2-profile` or G2's current "Get
Listed" flow.

**Fields:**

Company name
```
BrandGEO
```

Category (check the live picker; G2's AI-specific taxonomy has changed
through 2026)
```
AI Search Optimization
```
or
```
Marketing Analytics Software
```
whichever the current picker treats as the closer match.

Short description
```
See how visible your brand is across up to seven AI engines, from ChatGPT and Gemini to Grok and Google AI Overviews. BrandGEO scores your AI presence.
```

Full description
```
BrandGEO is an AI Visibility and Generative Engine Optimization (GEO) platform. It runs a brand's real, commercial buyer-intent prompts against up to seven AI engines (ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Google AI Overviews, and Grok), reports whether the brand is mentioned, how it ranks against named competitors, and what sentiment the answer carries, and surfaces specific recommendations for closing the gaps.

Self-serve plans start with a free tier and Radar (EUR 29/month at launch, EUR 39/month list). Managed and Enterprise tiers are done-for-you, for teams that want the monitoring and remediation work handled directly.
```

Work email for verification
```
constantin@getbrandgeo.com
```

Pricing table
```
Free: EUR 0/month
Radar: EUR 29/month (launch), EUR 39/month (list)
Essentials: EUR 99/month
Growth: EUR 299/month
Growth PRO: EUR 449/month
Managed: from EUR 1,500/month
Enterprise: custom
```

**Assets:**

| Asset | Absolute path |
|---|---|
| Logo | `C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\growth\brand-identity-2026-07-29\v3\png\mark-512.png` |
| Screenshot | not on disk, needs a real dashboard capture |

**Do not solicit reviews.** No real customer base exists yet to invite
(GTM-TEAM.md section 5 bans customer counts and testimonials outright, and
G2's own review-generation rules require real users). This step stays closed
until there are real users to invite.

**Submit:** Click **Submit** / **Get Listed**. Constantin does this.

**External check:** search `g2.com` for a BrandGEO profile; no stable direct
URL is known in advance. String to look for: `BrandGEO`, plus the short
description text (the free profile will not carry a clickable outbound
link, so do not treat a missing link as a failure). Earliest pass: 3 to 5
business days from submission, plus 1 to 3 more to claim; if submitted
2026-08-13, earliest live-and-claimed is roughly 2026-08-20 to 2026-08-21.

## 6. DevHunt: BLOCKED, not fired, not decided here

DevHunt's own pack flags the fit question itself: BrandGEO is a
marketing/analytics SaaS, not a developer tool, and DevHunt's scope may have
narrowed to strictly dev-facing tools. This is exactly the case the
constitution names as needing a decision, not a submission
(`GTM-TEAM.md`/AGENT-OS pattern: "a channel needs a decision, do not decide
it inside a fire card"). This session's fetches could not confirm DevHunt's
current scope (`devhunt.org/submit` renders client-side, no field content
returned). **Escalated: `gtm-lead` or Constantin decides fit before any card
is written for this channel.** If the fit call is yes, the existing pack at
`docs/growth/launch-directories/devhunt.md` already has the field text
ready and can be turned into a fire card in the same shape as the ones
above.

---

# PRIORITY 3: Product Hunt and Google Business Profile, worth founder
minutes or not

## Product Hunt: YES, but capped at two small fixes, nothing more

**Verdict: worth about 5 minutes, no more.**

**Finding: the audit's "1 gallery image" claim is already stale, same day.**
Fetching `producthunt.com/products/brandgeo-2` today (2026-08-13) shows
**3 images in the gallery**, not 1. This contradicts the audit written
earlier the same day. Either the audit undercounted or Constantin (or
someone) uploaded the three images from `marketing/Product Publish/` since
the audit ran. Either way, the gallery item on the audit's own punch list
appears done; do not re-do it. MEASURED via two separate live fetches today:
`3 points` upvotes, `7 followers`, `0 reviews` ("No reviews yet"), `3 images`
in gallery, no replies visible on the maker's comment thread.

**Reasoning against doing more:** a Product Hunt launch happens once
(INFERRED, standard platform mechanics and the audit's own framing: "a
product launches once"). It already launched 2026-08-04 with zero audience
prep and produced 3 upvotes and 7 followers in 9 days, a one-day trickle
that has not moved since (MEASURED). There is no re-launch mechanism to
invest founder minutes into; the page is a static, low-traffic asset now.
It does not serve G3 (three channels firing daily), since it cannot fire
again.

**The one thing left worth doing:** reply to the unanswered maker comment
thread. Zero cost beyond the reply itself, keeps the page from looking
abandoned to the rare visitor who does land on it, and is honest, not a
growth bet.

## Google Business Profile: YES, this is not a traffic bet, it is stopping
an active falsehood

**Verdict: worth the 12 minutes in today's fire order.**

**Reasoning:** this is not ranked against other channels on
traffic-per-minute, because it is not really a growth investment, it is
stopping something that is actively wrong right now. The profile is
advertising a retired engine (Meta AI) and a stale engine count
(`gbp-live-assets-stale` memory; last known state, not independently
re-verifiable here since GBP requires owner login this session does not
have). A free, public, currently-live surface publishing a false claim
about what the product does is a reputational risk regardless of how much
traffic GBP itself sends, and it is cheap to fix: the corrected images
already exist and are already rendered at
`docs/growth/CAMPAIGN-2026-07-30/google-business-profile/`, per
`outbound-infra.md` STEP 6, and the Products-tab card is already fully
written in `docs/growth/launch-directories/gbp.md`. Nothing new needs
writing; the existing pack is fire-ready as-is. The only reason it has not
fired is that it needs GBP owner access, which only Constantin has
(PLAN section 4: "GBP owner access | Constantin | the stale profile fix").

**Do not carry a new card here**, the existing `gbp.md` pack already meets
the fire-card bar; use it directly.

---

## What this file deliberately does not do

It does not create any account, log into anything, submit any form, or post
any reply. It does not decide DevHunt's fit, that is `gtm-lead`'s or
Constantin's call. It does not invent a customer count, a testimonial, an
engine-count superlative, trial language, or deadline urgency anywhere in
any field above; every field was checked against `GTM-TEAM.md` section 5
before being written. It does not touch any file outside
`docs/growth/channels/`.
