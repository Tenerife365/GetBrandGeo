/**
 * affiliateRef.ts: carries an affiliate referral across the signup round trip
 * (docs/affiliates/README.md, "Attribution on app.getbrandgeo.com").
 *
 * The referral redirect (/r/<program>/<code>, affiliate-redirect.js) lands a
 * visitor on the program destination with ?ref=<code>&bg_rid=<visit token>
 * &ref_days=<attribution window>. When that visitor reaches /signup on this
 * app the query string may still carry those values (the marketing site's
 * affiliate-track.js appends them to every app.getbrandgeo.com link). Signup
 * stores them here; Welcome.tsx forwards them to provision-account, which
 * records the lead server side and keys the attribution on the signup email.
 *
 * Same design as signupDomain.ts, for the same reason: the invite email and
 * the OAuth hop both lose React state and the query string, storage does not.
 * Values originate in a URL a stranger controls, so they are shape-checked on
 * the way in and never used to decide anything on the client. The server
 * validates again and computes every amount itself.
 */

const STORAGE_KEY = 'bgAffiliateRef'
const DEFAULT_DAYS = 30
const MAX_DAYS = 365

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/
const TOKEN_RE = /^[A-Za-z0-9_-]{8,64}$/
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,39}$/

export interface AffiliateRef {
  code: string | null
  visit: string | null
  program: string | null
  at: number
  days: number
}

/** Parse the referral fields off a query string. Returns null when none is present or valid. */
export function affiliateRefFromQuery(search: string): AffiliateRef | null {
  const q = new URLSearchParams(search)
  const code = String(q.get('ref') || '').trim().toUpperCase()
  const visit = String(q.get('bg_rid') || '').trim()
  const program = String(q.get('bg_prog') || q.get('utm_campaign') || '').trim().toLowerCase()
  const daysRaw = Number(q.get('ref_days'))
  const days = Number.isInteger(daysRaw) && daysRaw > 0 && daysRaw <= MAX_DAYS ? daysRaw : DEFAULT_DAYS
  const out: AffiliateRef = {
    code: CODE_RE.test(code) ? code : null,
    visit: TOKEN_RE.test(visit) ? visit : null,
    program: SLUG_RE.test(program) ? program : null,
    at: Date.now(),
    days,
  }
  if (!out.code && !out.visit) return null
  return out
}

/** Persist a referral for the rest of the signup flow. Does nothing for an invalid one. */
export function rememberAffiliateRef(ref: AffiliateRef | null): void {
  if (!ref || (!ref.code && !ref.visit)) return
  try {
    // Last touch wins by default, matching the server's default attribution mode.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ref))
  } catch {
    // Storage unavailable: the referral is a convenience, never a blocker.
  }
}

/** The remembered referral, or null once expired or absent. */
export function readAffiliateRef(): AffiliateRef | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    let parsed: Partial<AffiliateRef>
    try { parsed = JSON.parse(raw) } catch { clearAffiliateRef(); return null }
    const code = typeof parsed.code === 'string' && CODE_RE.test(parsed.code) ? parsed.code : null
    const visit = typeof parsed.visit === 'string' && TOKEN_RE.test(parsed.visit) ? parsed.visit : null
    const program = typeof parsed.program === 'string' && SLUG_RE.test(parsed.program) ? parsed.program : null
    const at = typeof parsed.at === 'number' ? parsed.at : 0
    const days = typeof parsed.days === 'number' && parsed.days > 0 && parsed.days <= MAX_DAYS ? parsed.days : DEFAULT_DAYS
    if (!at || (!code && !visit)) { clearAffiliateRef(); return null }
    const age = Date.now() - at
    if (age < 0 || age > days * 24 * 60 * 60 * 1000) { clearAffiliateRef(); return null }
    return { code, visit, program, at, days }
  } catch {
    return null
  }
}

export function clearAffiliateRef(): void {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* see rememberAffiliateRef */ }
}
