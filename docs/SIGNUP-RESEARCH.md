# SIGNUP-RESEARCH.md

Research and a decision-ready recommendation for redesigning BrandGEO's self-service signup.
Compiled 2026-07-21. Scope: research and written recommendation only, no code changes.
Focus: how leading SaaS and the direct GEO / AI-visibility competitors handle signup as of 2026,
and how BrandGEO should handle company accounts, personal-brand accounts, SSO, email
verification, and anti-abuse. Follows the project no-em-dash rule.

---

## 0. TL;DR (the one-paragraph answer)

Ship a single, low-friction signup flow with three entry buttons stacked in this order:
**Continue with Google**, **Continue with LinkedIn**, and **Continue with email**. Do NOT
require a work email and do NOT require the email to match the monitored brand's domain, because
that rule breaks four of BrandGEO's most legitimate segments at once (agencies, consultants,
personal brands, and anyone evaluating on a personal Gmail). Instead, capture intent with one
lightweight question during onboarding ("What do you want to monitor?" with a "Company / brand"
vs "Personal brand / myself" toggle) and let that branch drive the "brand" object, not the auth.
Keep abuse out with three cheap, invisible-until-triggered controls that BrandGEO already partly
has: mandatory email verification via the existing Supabase invite/magic link (a real inbox is
required before any data runs), a disposable-domain blocklist check, and the per-IP rate limit
plus honeypot already added in the F1/F2 security work. This is exactly the pattern the closest
comparable, Peec AI, uses (Google + Microsoft social login, self-serve, no work-email wall), and
it is more permissive than AthenaHQ (which gates behind an SSO or work-email wall and has no
trial), which is the right call for a product that must also serve solopreneurs and personal
brands like the real "Edyta" client.

---

## 1. Executive recommendation (the specific flow to ship)

**Signup screen (one screen, no fork up front):**

1. **Continue with Google** (primary button, top). Google OIDC returns a verified email, name,
   and profile picture with zero typing. For Google Workspace accounts it also returns the `hd`
   (hosted domain) claim, which BrandGEO can read to auto-detect the user's company domain and
   pre-fill the brand domain field. This is the highest-converting path and should be first.
2. **Continue with LinkedIn** (secondary button). LinkedIn OIDC returns verified email, name, and
   picture. It is the strongest signal that a signup is a real professional (high lead quality for
   a B2B GEO tool) even though, as of 2026, LinkedIn's basic Sign In product does NOT return the
   person's employer/company (that scope is not part of standard Sign In with LinkedIn using
   OpenID Connect). Worth having as a trust and quality signal, not as a data-enrichment source.
3. **Continue with email** (tertiary, still visible). Keeps the current email + brand-domain path
   for anyone who does not want to use social login. This is where personal-brand users, agencies
   on shared inboxes, and privacy-conscious evaluators land, so it must never be hidden or
   deprioritized to the point of feeling second-class.

**After auth, one onboarding question (this is where the real branching happens, NOT at auth):**

> "What are you monitoring in AI answers?"
> - **A company or brand** (has a website) -> ask for the brand's website/domain, auto-prefill from
>   Google `hd` or the email domain when available.
> - **A personal brand or myself** (a person, may have no company site) -> ask for the person's
>   full name as it appears publicly, plus optional links (LinkedIn URL, personal site, portfolio).

**Verification and gating:**

- Every path requires a verified email before collection runs. Social login (Google/LinkedIn)
  arrives pre-verified. The email path uses the existing Supabase invite / magic-link flow, so a
  real, reachable inbox is proven before any AI-engine budget is spent. This is already how
  BrandGEO's signup works today (`inviteUserByEmail`), so no regression.
- Run a disposable-email-domain check on the email path and soft-block (clear message, ask for a
  real address), do not hard-fail silently.
- Keep the honeypot field and per-IP/day cap already shipped in the F2 security fix.

**Role:** stays `viewer` for all self-serve signups (already enforced, and required by the F1
security rule that `role: 'admin'` is only ever written by the admin-gated onboarding path).

**Why this shape:** it matches the category leader's low-friction, social-first, no-work-email
model (Peec AI), avoids AthenaHQ's conversion-killing work-email/SSO wall, and it explicitly
designs for the personal-brand case that a domain-matching rule would have excluded.

---

## 2. Company / brand accounts (work email, Google, LinkedIn)

### 2.1 Do NOT require a work email, and do NOT require domain-match

The single most important finding: **requiring the signup email to be at the same domain as the
monitored brand is not a common pattern and it breaks real BrandGEO use cases.** Even the milder
version (require any work email, block Gmail) is a deliberate conversion-for-lead-quality trade
that most self-serve products avoid unless they have high ACV and a sales team chasing every
trial. Guidance from practitioners is consistent: blocking free webmail noticeably reduces signup
volume, and many genuine evaluators (founders, consultants, developers) prefer a personal Gmail
for a first trial even when they will later use a work address. The recommended default is to
**allow any email**, then use soft signals (flagging free-webmail signups as lower-priority
leads) rather than a hard block.

For BrandGEO specifically, a domain-match rule fails at least four legitimate segments:

- **Agencies and SEO consultancies** monitoring their clients' brands. Their email domain
  (agency.com) will never match the client brand they are tracking (client.com). This is a core
  ICP for GEO tools.
- **Consultants / fractional CMOs** who monitor several brands from one personal or agency inbox.
- **Personal brands and solopreneurs** (the real "Edyta" case) who have no corporate domain at
  all, and often only a Gmail.
- **Anyone evaluating** who signs up on personal email before involving their company.

So: allow any email. Use domain matching only as an *optional convenience* (auto-prefill the
brand domain when the email domain or Google `hd` claim happens to look like a company), never as
a *gate*.

### 2.2 Continue with Google (recommended primary)

Google OIDC (Sign in with Google) returns, in the verified ID token: `email`, `email_verified`,
`name`, `given_name`, `family_name`, `picture`, and, for Google Workspace accounts, the **`hd`
(hosted domain) claim**. The `hd` claim is trustworthy because it lives inside a Google-signed
token (not a request parameter), and Google Workspace domains are DNS-verified at the Workspace
level, so an `hd` value is real proof the user belongs to that organization's Google Workspace.

Practical uses for BrandGEO:
- If `hd` is present, the user is on a real company Workspace: pre-fill the brand domain with `hd`
  and treat the signup as a company account by default.
- If `hd` is absent, the account is a personal Gmail: do not block, just route to the normal "what
  are you monitoring" question (likely a personal brand or an agency).
- Never use email-domain string matching alone to decide "is this a work account" (the email
  domain is not sufficient proof of org membership; only the `hd` claim inside the token is).

### 2.3 Continue with LinkedIn (recommended secondary, B2B quality signal)

The current product name is **Sign In with LinkedIn using OpenID Connect** (LinkedIn migrated off
the old OAuth2 sign-in to OIDC). Supported scopes are `openid`, `profile`, and `email`. Claims
returned include `sub`, `name`, `given_name`, `family_name`, `email`, `email_verified`, `picture`,
and `locale`. Notably, **it does NOT return the person's current employer/company** as part of the
standard sign-in product, so do not plan to auto-detect the company from LinkedIn.

Value for a B2B GEO tool: LinkedIn login is a strong "this is a real working professional" signal
and is a familiar, trusted B2B button. Setup hurdles to budget for:
- Create a LinkedIn Developer app, then request the "Sign In with LinkedIn using OpenID Connect"
  product on the app's Products tab. Approval for basic sign-in is generally self-serve and fast
  (it is the OpenID sign-in product, not the restricted Marketing or member-data APIs).
- LinkedIn requires a company page association for the developer app and a privacy-policy URL.
- Redirect URI must be registered exactly (the Supabase callback URL, see section 6).

Recommendation: include LinkedIn, but treat Google as the primary because Google converts higher
and gives the `hd` domain signal that LinkedIn cannot.

---

## 3. Personal-brand / individual accounts

### 3.1 The category already serves individuals, so BrandGEO should too

The GEO/AI-visibility category has a clear low end explicitly aimed at freelancers, consultants,
and personal brands. Otterly.AI's Lite plan is $29/month (15 prompts) and is repeatedly described
as accessible for freelancers and small teams. Genrank offers a completely free ChatGPT-tracking
plan. "Am I on AI" is positioned for SEO freelancers, small agencies, and consultancies. These
tools track "linked and unlinked references to brands, products, businesses, or personal names",
so a person's name is a first-class monitored entity, not an edge case. BrandGEO's "Edyta" client
is exactly this segment, and it is a real, monetizable one, not a support burden to be designed
away.

### 3.2 How a personal brand is actually monitored (no website needed)

BrandGEO's own pipeline already supports this. The "brand" object needs, at minimum:
`brand_name` / `brand_aliases` (the person's public name and variants), and optionally
`brand_website`. The domain is used for domain-match detection and TLD-based geo fallback, but it
is *optional*: mention detection runs off `brand_aliases` against the AI response text. So a
personal brand with no site is monitored by seeding the person's name and known aliases (for
"Edyta", that means her public name spellings, handles, and any personal domain/portfolio if she
has one) and letting the existing `analyseResponse` alias matching do the work. The prompts for a
personal brand should be person-shaped ("Who are the best [niche] consultants/coaches?", "Who is
[Name]?") rather than company-shaped.

### 3.3 Signup UX for the personal case

Do NOT put a hard "Business vs Personal" fork on the very first screen (that adds friction and
forces a choice before the user understands the product). Instead, use the post-auth single
question in section 1. The two branches then diverge only in what they collect:

- **Company branch:** brand website/domain is the anchor. Auto-prefill from Google `hd` or email
  domain. Seed company-shaped prompts.
- **Personal branch:** the person's public name is the anchor. Website is optional. Offer a
  "add your LinkedIn / personal site / portfolio" optional field so there is still a URL to anchor
  citation checks when one exists. Seed person-shaped prompts.

Copy should make neither audience feel excluded. Peec, Otterly, and Slack-style onboarding all
use inclusive framing; for BrandGEO, "What do you want to see in AI answers, a company or
yourself?" reads naturally to both a CMO and a solo coach.

---

## 4. Account-type branching and positioning (industry pattern)

The dominant modern pattern is **one signup flow, branch during onboarding with a short
micro-survey**, not a hard fork on the landing/signup screen. Concrete examples:

- **Dropbox** segments users into personal vs business and tailors the first-run experience
  (business users see collaboration first, personal users see backup first), but the account is
  created first and the branch shapes onboarding, not auth.
- **Slack** asks a "what is your team focused on" question right after signup and routes setup
  accordingly. Reported effect: personalized onboarding cut time-to-value meaningfully versus a
  generic flow.
- The general best-practice writeups (Appcues, Chameleon, Userpilot, Auth0) converge on: a 2 to 4
  question micro-survey immediately after signup that segments by role/use-case/goal and routes
  into a tailored flow, because it removes irrelevant steps and shortens time-to-aha.

For BrandGEO this means: keep the single auth flow (Google / LinkedIn / email), then ask the one
"company or personal brand" question, which is the minimum viable branch. Do not over-survey; one
question is enough to pick the right "brand" template.

---

## 5. Email verification and anti-abuse

The goal is to prove a reachable inbox and keep out bots/competitors/disposable addresses without
adding conversion-killing steps.

### 5.1 Verify email ownership (already mostly in place)

- **Social login (Google/LinkedIn)** arrives with `email_verified: true`, so no extra step.
- **Email path:** BrandGEO already uses `inviteUserByEmail` (the user must click the invite link
  and set a password via the reset flow), which is a de facto double opt-in: no inbox access, no
  account. Keep this. It also means no password ever transits the public endpoint, which is
  strictly better for an unauthenticated route (this is the current, already-shipped behavior).
- Do not grant any AI-engine collection budget until the email is verified, so a fake signup can
  never spend money.

On method choice: magic link / invite link is the right primary for a web SaaS with infrequent
login (which BrandGEO is), and it is what is already wired. OTP is mainly a win for mobile/phone
signups (not BrandGEO's case). Note the 2025 regulatory and FBI/CISA guidance against SMS-only
OTP, another reason to stay on email links rather than adding SMS.

### 5.2 Block disposable / temporary email domains

Add a disposable-domain check on the email path (social login does not need it). Use a maintained
open-source blocklist, cached locally so a GitHub outage cannot break signup. Well-known lists:

- `eramitgupta/disposable-email` (110,000+ domains, auto-updated daily via GitHub Actions).
- `disposable/disposable-email-blocklist` (a `disposable_domains.txt` plus generated JSON/XML).
- `wesbos/burner-email-providers` (widely used, monitors known temp providers).
- A hosted API such as UserCheck if a real-time, always-current check is wanted later.

Best practice from the research: prefer a **soft block** with a clear, specific message ("Please
use a permanent email address so we can send your results") over a silent hard reject. Generic
rejections lose users who do not understand what happened; specific messages recover most of them.
Static lists cannot catch every new disposable domain, so treat the list as an indicator, backed
by the invite/verification requirement which is the real gate.

### 5.3 Rate-limit and bot controls (already partly shipped)

BrandGEO's F2 security work already added a honeypot field on the signup form and a per-IP/day cap
(reusing the salted-IP-hash helper, GDPR-minimized). Keep both. Together with mandatory email
verification and the disposable-domain check, this is a proportionate anti-abuse stack for a
free-tier B2B product: it stops scripted mass-signup and email-bombing without a CAPTCHA wall on
the happy path. Add a CAPTCHA (for example hCaptcha/Turnstile) only if abuse is observed after
launch, not pre-emptively, to protect conversion.

---

## 6. Implementation notes for BrandGEO's stack (Supabase Auth)

BrandGEO uses Supabase Auth, which supports both social providers natively:

- **Google:** enable the Google provider in the Supabase dashboard. Create an OAuth 2.0 client in
  the Google Cloud console (OAuth consent screen + client), add BrandGEO's app URL under
  Authorized JavaScript origins and the Supabase callback under Authorized redirect URIs. Sign in
  with `supabase.auth.signInWithOAuth({ provider: 'google' })`. To read the `hd` claim, request
  it via the Google scopes and read it from the returned ID token / user metadata to detect a
  Workspace domain.
- **LinkedIn:** enable the LinkedIn (OIDC) provider in Supabase. The provider string is
  **`linkedin_oidc`** (the older `linkedin` provider is deprecated). Create the LinkedIn app,
  request the "Sign In with LinkedIn using OpenID Connect" product, set scopes `openid profile
  email`, and register the Supabase callback URL as the redirect URI. Sign in with
  `supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc' })`.
- **Callback URL** for both is `https://<project-ref>.supabase.co/auth/v1/callback`.
- **Origin whitelist:** BrandGEO's Netlify functions enforce an origin whitelist
  (`app.getbrandgeo.com` etc.); confirm the OAuth redirect returns to an allowed origin.
- **Existing email path:** unchanged. The `signup-client.js` function already creates the `clients`
  row (with correct columns after the F1 fix) and invites the user as `viewer`. The social paths
  should converge on the same provisioning logic: on first social login, create the `clients` row
  and `user_profiles` row (role `viewer`), then drop the user into the same "company or personal
  brand" onboarding question.

**Security guardrails to preserve (from the security audit):** self-serve signup must always write
`role: 'viewer'`, never `admin`. The social login paths must go through the same server-side
provisioning so a crafted client cannot set its own role or `client_id`. Keep the honeypot,
per-IP cap, and `signup_attempts` logging.

---

## 7. Comparison table: what leading and comparable products do at signup

| Product | Category | Social login at signup | Work-email required? | Free trial / free tier | Personal / individual friendly | Notes |
|---|---|---|---|---|---|---|
| **Peec AI** | GEO / AI-visibility (closest comparable) | Yes: Google + Microsoft | No (self-serve, any email) | 7-day trial, no card | Yes (self-serve, low friction) | Auto-suggests prompts from your website. This is the model to copy. ([pricing](https://peec.ai/pricing), [review](https://www.marketermilk.com/blog/peec-ai-review)) |
| **AthenaHQ** | GEO / AI-visibility | Yes: Google / Microsoft SSO | Effectively yes (SSO or work-email wall) | No free tier, no trial | No (built for teams, white-glove) | Gates evaluation behind a wall; higher lead quality, lower top-of-funnel. Do NOT copy this for BrandGEO's free tier. ([signup writeup](https://www.stackinsight.net/athenahq-sign-up/), [vs Profound](https://openlens.com/blog/en/profound-vs-athenahq)) |
| **Profound** | GEO / AI-visibility (enterprise) | SSO (enterprise) | Yes (enterprise, sales-led) | Custom / sales-led | No (enterprise) | $1B valuation, enterprise motion, custom pricing. Different tier than BrandGEO's self-serve. ([alternatives](https://www.visiblie.com/blog/profound-alternatives)) |
| **Otterly.AI** | GEO / AI-visibility | Self-serve signup | No (any email) | 14-day trial, no card; Lite $29/mo | Yes (explicitly freelancer-friendly) | Low entry price aimed at freelancers/small teams. Proof the personal/solo segment is real. ([pricing](https://otterly.ai/pricing), [site](https://otterly.ai/)) |
| **Scrunch AI** | GEO / AI-visibility | Self-serve signup | No | 7-day trial; Core $250/mo | Team-oriented but self-serve | 5 seats / 125 prompts at Core. ([alternatives](https://blog.timsoulo.com/14-scrunch-ai-alternatives-for-tracking-your-brand-in-ai-search-2026/)) |
| **Genrank** | GEO (ChatGPT focus) | Self-serve | No | Completely free plan | Yes | Free ChatGPT-mention tracking; a true no-friction on-ramp. ([overview](https://genrank.io/blog/tools-for-geo-content-optimization)) |
| **"Am I on AI"** | GEO point tool | Self-serve | No | Low-cost / freemium | Yes (SEO freelancers, small agencies) | Positioned for consultancies and individuals. ([context](https://otterly.ai/)) |
| **Semrush AI toolkit / SE Ranking** | SEO suites with AI-visibility | Google SSO (suite login) | No (any email) | Trials via parent suite | Mixed (SMB to enterprise) | Signup inherits the parent SEO suite's any-email self-serve model. ([Semrush](https://www.semrush.com/blog/best-ai-visibility-tools/), [SE Ranking](https://seranking.com/ai-visibility-tracker.html)) |
| **Slack** | General SaaS (onboarding benchmark) | Google / Apple | No | Free tier | Yes | Post-signup micro-survey ("what is your team focused on") drives branched onboarding. ([onboarding examples](https://www.appcues.com/blog/saas-user-onboarding)) |
| **Dropbox** | General SaaS (branching benchmark) | Google / Apple | No | Free tier | Yes (explicit personal vs business branch) | Segments personal vs business and tailors first-run, after account creation not before. ([onboarding examples](https://www.appcues.com/blog/saas-user-onboarding)) |

**Read of the table:** the direct GEO competitors split into two camps. The self-serve, any-email,
trial-friendly camp (Peec, Otterly, Scrunch, Genrank) is where BrandGEO's free tier belongs. The
walled, work-email/SSO, no-trial camp (AthenaHQ, Profound) is an enterprise motion BrandGEO can
add later for a sales-led tier, but must not impose on the free self-serve funnel. Google (and for
BrandGEO also LinkedIn) social login is the common, expected on-ramp; none of the self-serve
competitors force a domain-matched work email.

---

## 8. Explicit answers to the five research questions

1. **Work-email enforcement:** Uncommon among self-serve B2B tools and a deliberate
   conversion-for-lead-quality trade only high-ACV, sales-led products (AthenaHQ, Profound) make.
   Most self-serve GEO tools (Peec, Otterly, Scrunch, Genrank) allow any email. Verifying that an
   email truly belongs to a domain is only reliable via the Google Workspace `hd` claim inside a
   signed token, not via email-domain string matching. Requiring "an email at the same domain as
   the monitored brand" is NOT a common pattern and it breaks agencies, consultants, and personal
   brands, so BrandGEO should not do it (use it only as optional auto-prefill).

2. **Google / LinkedIn SSO:** Very common and expected. Google OIDC gives verified email, name,
   picture, and (Workspace only) the trustworthy `hd` domain claim, so it can both authenticate and
   hint the company domain. LinkedIn's current product is "Sign In with LinkedIn using OpenID
   Connect" (scopes `openid profile email`); it gives verified email, name, and picture but NOT the
   employer/company. It is worth it as a B2B trust/quality signal. Both are natively supported by
   Supabase Auth (`signInWithOAuth({ provider: 'google' })` and `provider: 'linkedin_oidc'`).

3. **Personal / individual accounts:** The category already serves them (Otterly $29 Lite, Genrank
   free, "Am I on AI"). Do not require a company or domain. Monitor a personal brand off the
   person's name/aliases (BrandGEO's `brand_aliases` matching already supports a website-less
   brand). Capture the case with a post-auth "company or personal brand" question, not a hard fork
   on the first screen.

4. **Account-type branching:** Leading tools keep ONE signup flow and branch during onboarding via
   a short micro-survey (Slack, Dropbox), rather than forking business vs personal at auth. Copy
   should welcome both ("a company or yourself"). Recommended for BrandGEO: single auth flow, one
   onboarding question.

5. **Email verification and anti-abuse:** Verify ownership before access (BrandGEO's existing
   invite/magic link is effectively double opt-in and already avoids sending passwords over the
   wire). Block disposable domains with a cached open-source blocklist (eramitgupta,
   disposable-email-blocklist, wesbos/burner-email-providers) using a soft block with a clear
   message. Keep the already-shipped honeypot + per-IP cap; add CAPTCHA only if abuse appears.
   Never grant AI-engine budget before verification.

---

## 9. Sources

- Peec AI pricing and signup (Google/Microsoft login, 7-day trial): https://peec.ai/pricing , https://www.marketermilk.com/blog/peec-ai-review , https://getairefs.com/blog/peec-ai-review/
- Otterly.AI pricing (14-day trial, $29 Lite, freelancer positioning): https://otterly.ai/pricing , https://otterly.ai/
- Scrunch AI, Profound, AthenaHQ comparison and signup walls: https://www.visiblie.com/blog/profound-alternatives , https://www.stackinsight.net/athenahq-sign-up/ , https://openlens.com/blog/en/profound-vs-athenahq , https://blog.timsoulo.com/14-scrunch-ai-alternatives-for-tracking-your-brand-in-ai-search-2026/
- Genrank / freelancer-oriented GEO tools and personal-name tracking: https://genrank.io/blog/tools-for-geo-content-optimization , https://www.semrush.com/blog/best-ai-visibility-tools/ , https://seranking.com/ai-visibility-tracker.html
- Work-email vs personal-email tradeoffs at signup: https://kevinyun.substack.com/p/how-i-prevent-unwanted-users-from-signing-up , https://shalini-murugan.medium.com/how-to-create-a-frictionless-saas-signup-page-practical-tips-examples-ec62ec19de00 , https://bulkemailchecker.com/blog/saas-free-trial-abuse-email-verification/
- Google `hd` (hosted domain) claim verification: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token , https://community.auth0.com/t/get-hd-claim-from-google-sign-in-to-verify-user-belongs-to-a-google-workspace-or-cloud-organization-account/168525 , https://jpassing.com/2021/01/27/what-does-the-email_verified-claim-indicate-in-google-idtokens/
- Sign In with LinkedIn using OpenID Connect (scopes, claims, setup): https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2 , https://www.linkedin.com/developers/news/featured-updates/openid-connect-authentication , https://dev.to/lovestaco/3-step-guide-to-add-linkedin-openid-sign-in-to-your-app-2025-edition-1mjh
- Supabase Auth Google + LinkedIn (linkedin_oidc) setup: https://supabase.com/docs/guides/auth/social-login/auth-google , https://supabase.com/docs/guides/auth/social-login/auth-linkedin , https://supabase.com/docs/guides/auth/social-login
- Account-type branching / onboarding micro-survey (Slack, Dropbox): https://www.appcues.com/blog/saas-user-onboarding , https://www.chameleon.io/blog/onboarding-flows , https://auth0.com/blog/user-onboarding-strategies-b2b-saas/
- Disposable email blocklists and soft-block best practice: https://github.com/eramitgupta/disposable-email , https://github.com/Chrisdbhr/disposable-email-blocklist , https://www.usercheck.com/guides/how-to-block-disposable-email-addresses , https://bulkemailchecker.com/blog/block-disposable-emails/
- Email verification method choice (magic link vs OTP, conversion, 2025 SMS guidance): https://www.scalekit.com/blog/otp-vs-magic-links-passwordless-authentication , https://supabase.com/docs/guides/auth/auth-email-passwordless , https://securityboulevard.com/2026/05/sms-otp-vs-email-magic-links-vs-passkeys-for-ecommerce-which-converts-best/
