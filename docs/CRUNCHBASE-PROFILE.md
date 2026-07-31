# BrandGEO — Crunchbase Organization Profile Package

Field-by-field content for creating/claiming the BrandGEO organization page
on Crunchbase. Every fact below is pulled directly from what's already live
on `getbrandgeo.com` (its own JSON-LD `Organization` block) — nothing here
is invented. A few fields are marked **[NEEDS YOUR INPUT]** because they
don't exist anywhere in the codebase or on the live site and shouldn't be
guessed.

This is a legitimate, standard practice — a real company profile on a real
business database, filled with real facts. It's the piece kept from the
`BrandGEO_OffSite_Growth_Blueprint.pdf` review after the manipulative parts
(link-injection network, scaled anchor-text "vehicle" content) were
declined per `rules/content-integrity.md`.

## How to do this (takes ~15 minutes)

1. Go to [crunchbase.com](https://www.crunchbase.com) and create a free
   account (or log in) with an email you control — `constantin@` or
   `support@getbrandgeo.com` recommended so future edit-access requests are
   easy to verify.
2. Search "BrandGEO" first to confirm no page already exists (unlikely, but
   worth 10 seconds).
3. Click **Add a new company** (or the "+" / "Contribute" flow — Crunchbase
   changes this button's exact label periodically).
4. Paste in the fields below, in order. Crunchbase's free tier covers all
   of this — no paid plan needed to create a basic, complete profile.
5. Once submitted, Crunchbase may take a few days to review/publish new
   organization pages — this is normal, not an error.

## Field-by-field content

**Organization Name**
```
BrandGEO
```

**Legal Name**
```
Constantin Daniel — Autónomo (sole proprietor, Spain)
```
Not an S.L. — registered as an autónomo (Spanish sole-proprietor/freelance
registration) rather than a limited company. If Crunchbase's Legal Name
field pushes back on this not looking like a typical registered business
name, it's fine to leave the field as just "BrandGEO" (matching
Organization Name) and skip a separate legal-name entry — autónomo
registrations don't have a distinct trading entity name the way an S.L.
would, so there isn't really a second "legal name" to enter beyond your
own registered name above.

**Website**
```
https://getbrandgeo.com
```

**Short Description** (Crunchbase caps this around 250 characters)
```
BrandGEO is an AI Visibility Intelligence platform that monitors and scores how brands are mentioned, recommended, and cited across ChatGPT, Gemini, Claude, Perplexity, and Meta AI.
```
(This is the exact description string already published in `index.html`'s
own `Organization` schema — reusing it keeps every public listing of the
company consistent, which is itself a trust signal AI engines and search
crawlers both weight.)

**Full Description** (longer field, use this)
```
BrandGEO is an AI Visibility Intelligence platform built for the shift from search-engine optimization to Generative Engine Optimization (GEO). As more buyers research and get recommendations directly from AI engines — ChatGPT, Gemini, Claude, Perplexity, and Meta AI — brands need a way to see whether they're actually being mentioned, how they're positioned relative to competitors, and how AI systems frame their reputation, none of which traditional SEO tools measure.

BrandGEO runs a client's real, commercial-buyer-style prompts against all five engines on a recurring basis and reports a weighted 0–100 AI Visibility Score across six dimensions: recognition, knowledge, sentiment, accuracy, reach, and consistency. The platform surfaces competitor mentions, sentiment trends, and a prioritized "Fix This" action hub, and offers both self-serve software plans and a fully managed, done-for-you service for brands that want AI visibility handled end-to-end.

BrandGEO publishes original research — including cross-city, cross-language studies of how AI engines answer real commercial queries — under the BrandGEO Research™ banner at getbrandgeo.com/blog.html.
```

**Industries / Categories** (select all that apply from Crunchbase's
category picker)
```
Artificial Intelligence (AI)
SEO
Marketing Automation
Analytics
SaaS
Market Research
Business Intelligence
```

**Headquarters Location**
```
Santa Cruz de Tenerife, Canary Islands, Spain
```
(Exact address string as published in `index.html`'s JSON-LD
`PostalAddress` block.)

**Operating Status**
```
Active
```

**Company Type**
```
For Profit, Privately Held
```

**Founded Date**
```
2026
```

**Number of Employees**
```
1
```
(Or the "1" / "1–10" bracket, whichever exact option Crunchbase's dropdown
offers — accurate for a solo autónomo operation.)

**Company Type** (revised — see note above)
Since BrandGEO is run as an autónomo, not a registered company, Crunchbase
may prompt for "Company Type" differently than the "For Profit, Privately
Held" default listed above. If a more specific option like "Sole
Proprietorship" or "Self-Employed" is offered, use that instead — otherwise
"For Profit, Privately Held" is still the closest fit.

**Contact Email**
```
support@getbrandgeo.com
```
(Real, already live — set up in the #106 email-branding pass, forwards to
your existing inbox.)

**Social / Other Profiles**
```
LinkedIn: https://www.linkedin.com/company/79409681
```
(Real, already referenced in `index.html`'s `sameAs` field — this is the
one social link the site itself already claims, so it's the one to use
here for consistency.)

**Logo**
```
https://getbrandgeo.com/logo.png
```
(Upload this file directly when Crunchbase asks for an image — same real
logo used sitewide, not a placeholder.)

**Pricing / Funding Status**
BrandGEO is not shown anywhere in the codebase as having raised outside
funding — leave the Funding section empty/unanswered rather than marking
"Bootstrapped" or any other status unless you want to state that
explicitly. Crunchbase doesn't require a funding history to publish a
profile.

## Why this is worth doing (not just busywork)

Crunchbase entries are exactly the kind of "entity signal" BG-001/BG-003's
own research (already published on the site) says AI engines and
knowledge-graph-driven search weight when deciding whether a brand is a
real, verifiable entity — the same "Entity SEO"/"Trust Signals" disciplines
the site's own glossary now defines. A real, accurate Crunchbase page is a
legitimate contributor to that signal, unlike the injected link-scheme
content that was declined.
