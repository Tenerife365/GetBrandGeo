/**
 * Post-login return path for the OAuth consent page (docs/arch/mcp-stage3-oauth.md
 * section 4.2 step 2). Pure helpers plus a tiny session-scoped stash for sign-in
 * routes that leave the app (Google), where the `next` query parameter is lost.
 *
 * Open-redirect rule: a `next` value is honoured ONLY when it starts with
 * `/oauth/authorize?`. Anything else is ignored, so a crafted login link can
 * never send a user to another path or another site.
 */

const PREFIX = '/oauth/authorize?'
const STASH_KEY = 'bg_oauth_next'
const STASH_TTL_MS = 10 * 60 * 1000

/** Returns the value when it is a safe in-app consent path, else null. */
export function safeOauthNext(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  if (!raw.startsWith(PREFIX)) return null
  if (raw.length > 4096) return null
  // Control characters and backslashes have no place in a consent query.
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i)
    if (c < 32 || c === 127 || c === 92) return null
  }
  return raw
}

/** The login URL that brings the user back to `path` (pathname plus search). */
export function loginUrlWithNext(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`
}

export function stashOauthNext(next: string | null): void {
  try {
    if (next) window.sessionStorage.setItem(STASH_KEY, JSON.stringify({ next, at: Date.now() }))
    else window.sessionStorage.removeItem(STASH_KEY)
  } catch { /* storage can be unavailable; the user then lands on the dashboard */ }
}

/** Reads the stash without clearing it; null when absent, stale or unsafe. */
export function peekOauthNext(now: number = Date.now()): string | null {
  try {
    const raw = window.sessionStorage.getItem(STASH_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { next?: unknown; at?: unknown }
    if (typeof v.at !== 'number' || now - v.at > STASH_TTL_MS) return null
    return safeOauthNext(v.next)
  } catch { return null }
}

export function clearOauthNext(): void {
  try { window.sessionStorage.removeItem(STASH_KEY) } catch { /* ignore */ }
}
