# Klibon affiliate network: how it is installed (2026-11-16)

BrandGEO joined the Klibon affiliate network alongside its own in-house
affiliate program (README.md and INTEGRATION.md in this folder). The two
are separate systems and do not share parameters, cookies or Stripe fields.

| | In-house program | Klibon |
|---|---|---|
| Link | `getbrandgeo.com/r/<program>/<code>` then `?ref=` | `?via=<code>` on a getbrandgeo.com URL |
| Cookie | `bg_ref` (affiliate-track.js) | `_klb` (Klibon's own script) |
| Stripe | `client_reference_id` = terms acceptance UUID, plus `prefilled_promo_code` | nothing yet, see "Checkout" |

## The tag

Program id `a6a42293-3165-4107-b986-e923c3b71598`, script
`https://go.klibon.com/klibon.js?p=<program id>`, always loaded from Klibon,
never self-hosted.

- **getbrandgeo.com.** `brandgeo/web/ga4-init.js` injects it into `<head>`,
  async, with `data-cookie-domain=".getbrandgeo.com"`, only after the visitor
  presses Accept on the cookie banner. Every public page already loads
  `ga4-init.js`, so no HTML file and no article template changed. Consent
  version moved from 1 to 2, so every earlier answer is asked again once.
  Reject, including a later change of mind, deletes `_klb`.
- **app.getbrandgeo.com.** `src/lib/klibon.ts`, called from `main.tsx`, loads
  the tag only when `_klb` already exists. The dashboard has no banner, and the
  cookie can only exist because the visitor accepted it on getbrandgeo.com.
- **CSP.** `go.klibon.com` is in `script-src` and `connect-src` in both
  `brandgeo/web/.htaccess` and `brandgeo-dashboard/netlify.toml`.
- **Cookie Policy.** `cookies.html` version 1.1 lists `_klb` (60 days) and what
  Klibon receives.

Setup rule that follows from the dashboard behaviour: **Klibon partner links
must point at getbrandgeo.com**, never straight at app.getbrandgeo.com, or the
`?via=` lands where no banner can ask for consent and is ignored.

## Signups

`Welcome.tsx` calls `Klibon.signup(email)` once, right after
`provision-account` succeeds. Both signup paths (email invite and Google) end
there, and the email is the one the account was created with. Klibon then
credits later payments made under that email.

## Checkout: deliberately not wired

Klibon reads the code from the Checkout Session's `client_reference_id` or
`metadata.klibon`. BrandGEO sells through Stripe Payment Links issued by
`accept-terms.js`, which already put the terms acceptance UUID in
`client_reference_id`, and `_affiliate_stripe.resolveContext` reads that UUID
to credit the in-house program. A Payment Link URL cannot carry metadata.
So the code can reach Stripe only by changing protected billing files
(`accept-terms.js`, `_terms_gate.js`, the webhook), which needs a ruling.

Until then: a Klibon visitor who signs up before paying is credited by email.
One who pays through a Payment Link without an account first is not credited
on that payment.

Open question for Klibon: every sale reaches them with our UUID in
`client_reference_id`, which has the shape of a code. Does an unknown code on
the payment override the email match? Their docs say a code on the payment
wins over a signup.

## Not checked

- The shared cookie across subdomains on the live hosts. It was only tested on
  localhost, where the domain attribute is left off on purpose.
- The Welcome call with a real referred signup. That is the first live test:
  open the Klibon test link in a private window, accept cookies, sign up once.
