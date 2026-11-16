/**
 * klibon.ts: Klibon affiliate network tag on app.getbrandgeo.com (2026-11-16).
 *
 * Klibon credits a partner when a visitor they sent signs up or pays. Its tag
 * turns ?via=<code> into the first-party cookie _klb. On getbrandgeo.com the
 * tag loads only after the visitor accepts cookies (brandgeo/web/ga4-init.js),
 * with data-cookie-domain=".getbrandgeo.com", so the cookie it writes is also
 * readable here, where accounts are created.
 *
 * THE CONSENT RULE ON THIS HOST. The dashboard has no cookie banner, and the
 * marketing site's answer lives in that site's localStorage, which this origin
 * cannot read. So the tag loads here only when _klb is already present. The
 * cookie can only exist because a visitor accepted it on getbrandgeo.com, so
 * this never stores anything a visitor did not agree to. A visitor with no
 * referral never loads the script at all, and window.Klibon stays undefined,
 * which makes reportKlibonSignup a no-op for them.
 *
 * Consequence for setup: a Klibon partner link must point at getbrandgeo.com,
 * not at app.getbrandgeo.com, because a ?via= that lands here first is ignored.
 *
 * SEPARATE FROM THE IN-HOUSE PROGRAM. BrandGEO's own affiliate module
 * (affiliateRef.ts, ?ref= and bg_ref) is untouched by this file, and Klibon's
 * script reads neither of those.
 *
 * CSP: netlify.toml must allow https://go.klibon.com in script-src and
 * connect-src (signup posts there with sendBeacon).
 */

const KLIBON_SRC = 'https://go.klibon.com/klibon.js?p=a6a42293-3165-4107-b986-e923c3b71598'
const KLIBON_COOKIE_DOMAIN = '.getbrandgeo.com'

interface KlibonApi {
  signup(input: string | { email: string }): boolean
  referral(): string | null
}

declare global {
  interface Window {
    Klibon?: KlibonApi
  }
}

function onOwnHost(): boolean {
  const h = window.location.hostname
  return h === 'getbrandgeo.com' || h.endsWith('.getbrandgeo.com')
}

function hasKlibonCookie(): boolean {
  return /(?:^|;\s*)_klb=[^;]+/.test(document.cookie)
}

/** Load the Klibon tag once, and only for a visitor who already holds _klb. */
export function initKlibon(): void {
  try {
    if (typeof document === 'undefined' || !hasKlibonCookie()) return
    if (document.querySelector('script[data-klibon-tag]')) return
    const s = document.createElement('script')
    s.async = true
    s.src = KLIBON_SRC
    s.setAttribute('data-klibon-tag', '')
    if (onOwnHost()) s.setAttribute('data-cookie-domain', KLIBON_COOKIE_DOMAIN)
    document.head.appendChild(s)
  } catch {
    /* a tracking tag must never stop the app from starting */
  }
}

/**
 * Tell Klibon an account was created with this email. Not awaited, never
 * throws, and Klibon sends nothing for a visitor nobody referred.
 */
export function reportKlibonSignup(email: string | null | undefined): void {
  try {
    if (email) window.Klibon?.signup(email)
  } catch {
    /* attribution is best effort; signup itself already succeeded */
  }
}
