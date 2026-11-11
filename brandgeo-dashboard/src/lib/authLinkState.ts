// Reads what an auth email link left in the address bar, without touching
// window and without throwing. Pure on purpose: the node tests load it
// through tests/helpers/ts_require, so it must have no imports.
//
// Supabase Auth reports a failed GET /verify by redirecting to redirect_to
// with error, error_code and error_description in the fragment (and, for the
// PKCE flow, in the query as well). A link built from an email template that
// points at the app instead carries token_hash and type, and the page verifies
// it only when the person acts, so a mail scanner that follows the link does
// not spend the single-use token.

export type EmailLinkType = 'invite' | 'recovery' | 'signup' | 'magiclink' | 'email'

export type AuthLinkState =
  | { kind: 'error'; code: string; description: string }
  | { kind: 'token'; tokenHash: string; type: EmailLinkType }
  | { kind: 'none' }

const EMAIL_LINK_TYPES: readonly EmailLinkType[] = ['invite', 'recovery', 'signup', 'magiclink', 'email']
const TOKEN_HASH_RE = /^[A-Za-z0-9_-]{16,256}$/
const MAX_DESCRIPTION = 200

function isEmailLinkType(v: string): v is EmailLinkType {
  return (EMAIL_LINK_TYPES as readonly string[]).includes(v)
}

// First non-null value for a key, query first, then fragment.
function pick(sources: URLSearchParams[], key: string): string | null {
  for (const s of sources) {
    const v = s.get(key)
    if (v !== null) return v
  }
  return null
}

export function parseAuthLink(href: string): AuthLinkState {
  try {
    const url = new URL(href)
    const query = url.searchParams
    const rawHash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
    // URLSearchParams decodes plus signs and percent escapes, and leaves a
    // malformed escape as literal text instead of throwing.
    const fragment = new URLSearchParams(rawHash)
    const sources = [query, fragment]

    const error = pick(sources, 'error')
    const errorCode = pick(sources, 'error_code')
    const errorDescription = pick(sources, 'error_description')
    if (error !== null || errorCode !== null || errorDescription !== null) {
      const codeSource = (errorCode && errorCode.trim()) || (error && error.trim()) || 'unknown'
      const code = codeSource.trim().toLowerCase()
      const description = (errorDescription ?? '').slice(0, MAX_DESCRIPTION)
      return { kind: 'error', code, description }
    }

    const tokenHash = pick(sources, 'token_hash')
    const type = pick(sources, 'type')
    if (tokenHash !== null && type !== null) {
      if (isEmailLinkType(type) && TOKEN_HASH_RE.test(tokenHash)) {
        return { kind: 'token', tokenHash, type }
      }
    }

    return { kind: 'none' }
  } catch {
    return { kind: 'none' }
  }
}

export function isExpiredLinkCode(code: string): boolean {
  return code.trim().toLowerCase() === 'otp_expired'
}
