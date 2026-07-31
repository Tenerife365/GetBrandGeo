/**
 * signupDomain.ts — carries the domain a visitor typed into the marketing site's
 * audit widget across the signup round trip, so account setup can prefill it
 * instead of asking for it a second time.
 *
 * ROADMAP.md Stream C item C2. Before this, `/signup?domain=acme.com` was a
 * valid URL that nothing read: site.js had been building it since the error path
 * was written, Signup.tsx never looked at the query string, and Welcome.tsx
 * prefilled the company website from the user's EMAIL domain only. So a visitor
 * who audited acme.com and signed up with a gmail address arrived at company
 * setup with an empty field and no memory of what they had come to track.
 *
 * WHY A SHARED MODULE AND NOT A useState IN EACH PAGE. The two ends of this are
 * separated by an email round trip: /signup sends an invite, the user clicks it
 * in their mail client, sets a password on /reset-password, and only then
 * reaches /welcome. No React state, no route state and no query string survives
 * that. Storage does.
 *
 * WHY localStorage AND NOT sessionStorage. The round trip above can take
 * minutes and routinely involves closing the tab, which ends the session store.
 * The trade is that the value outlives the browsing session, so it is cleared
 * the moment it has been used (see clearSignupDomain, called by Welcome once
 * provisioning succeeds) rather than left to prefill somebody else's setup on a
 * shared machine.
 *
 * WHAT THIS IS NOT. It is a convenience prefill and nothing more. Every value
 * here originates in a URL a stranger controls, so it is validated on the way in
 * (never trust ?domain=), it is only ever rendered as text by React, and it is
 * never used to authorise anything or to decide what a client is entitled to.
 */

const STORAGE_KEY = 'bgSignupDomain'

/**
 * Strip a domain down to its bare host: no scheme, no www., no path, no query,
 * no port. Mirrors normalizeDomain() in netlify/functions/_prospect_guard.js,
 * which is what produced the value at the other end of this hop.
 */
export function normalizeDomain(input: string): string {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
}

/**
 * Same shape test as _prospect_guard.js's isPlausibleDomain: labels of allowed
 * characters, at least one dot, 253 characters at most. Deliberately a format
 * check and not a DNS lookup.
 */
export function isPlausibleDomain(input: string): boolean {
  const d = normalizeDomain(input)
  if (!d || d.length > 253) return false
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(d)
}

/**
 * Read `?domain=` off a query string, normalised, or null when it is absent or
 * not a plausible domain. Junk is dropped rather than stored, so a hand-edited
 * URL cannot seed the setup form with arbitrary text.
 */
export function domainFromQuery(search: string): string | null {
  const raw = new URLSearchParams(search).get('domain')
  if (!raw) return null
  return isPlausibleDomain(raw) ? normalizeDomain(raw) : null
}

/** Persist a domain for the next step. Silently does nothing if it is not one. */
export function rememberSignupDomain(input: string | null | undefined): void {
  if (!input || !isPlausibleDomain(input)) return
  try {
    localStorage.setItem(STORAGE_KEY, normalizeDomain(input))
  } catch {
    // Private mode, a full quota, or storage disabled by policy. The prefill is
    // a nicety; losing it must never break signup, so this is swallowed.
  }
}

/** The remembered domain, or null. Re-validated on read: storage is user-writable too. */
export function readSignupDomain(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v && isPlausibleDomain(v) ? normalizeDomain(v) : null
  } catch {
    return null
  }
}

/** Forget it. Called once the domain has been used, so it cannot leak into a later signup. */
export function clearSignupDomain(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* see rememberSignupDomain */
  }
}
