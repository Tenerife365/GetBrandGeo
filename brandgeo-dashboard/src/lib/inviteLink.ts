// Pure helpers for the 7 day invite link (spec docs/arch/invite-link-7-days.md,
// section 6.5). No imports on purpose: the node tests load this file through
// tests/helpers/ts_require, and the same literal below is mirrored in
// netlify/functions/_invite_link.js (pinned by tests/invite_link_client.test.js).
//
// The token lives in the URL fragment only ("/invite#t=<token>"), so it never
// reaches a server log or a Referer header. A token in the query string is
// ignored on purpose.

export const INVITE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/

/** Reads the invite token from the fragment of an address. Null when absent or malformed. */
export function parseInviteToken(href: string): string | null {
  try {
    const url = new URL(href)
    const rawHash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
    const value = new URLSearchParams(rawHash).get('t')
    if (value === null) return null
    return INVITE_TOKEN_RE.test(value) ? value : null
  } catch {
    return null
  }
}

export type LinkState = 'expired' | 'valid' | 'unknown'

/** Whether a link with this expiry can still be used. Unknown when the date is missing or unreadable. */
export function linkStateFromExpiry(expiresAt: string | null, now: number = Date.now()): LinkState {
  if (!expiresAt) return 'unknown'
  const t = Date.parse(expiresAt)
  if (Number.isNaN(t)) return 'unknown'
  return now >= t ? 'expired' : 'valid'
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`
}

/** "just now", "3 hours ago", "2 days ago". Empty string for a missing or unparseable date. */
export function formatAge(iso: string | null, now: number = Date.now()): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const minutes = Math.floor(Math.max(0, now - t) / 60_000)
  if (minutes < 1) return 'just now' // copy: pending bg-copy
  if (minutes < 60) return `${plural(minutes, 'minute')} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${plural(hours, 'hour')} ago`
  return `${plural(Math.floor(hours / 24), 'day')} ago`
}

/**
 * Time left on a link: "6 days left", "5 hours left", "less than an hour left".
 * Empty string when the link has no usable expiry or has already expired. Days
 * carry one hour of slack so a link sent a moment ago reads "7 days left".
 */
export function formatTimeLeft(expiresAt: string | null, now: number = Date.now()): string {
  if (!expiresAt) return ''
  const t = Date.parse(expiresAt)
  if (Number.isNaN(t)) return ''
  const ms = t - now
  if (ms <= 0) return ''
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return 'less than an hour left' // copy: pending bg-copy
  if (hours < 24) return `${plural(hours, 'hour')} left`
  const days = Math.max(1, Math.floor((ms + 3_600_000) / 86_400_000))
  return `${plural(days, 'day')} left`
}

export type RedeemResult =
  | { ok: true; token_hash: string; type: 'invite' | 'signup' }
  | { ok: false; code: 'bad_request' | 'invalid' | 'expired' | 'replaced' | 'used' | 'rate_limited' | 'unavailable' }
