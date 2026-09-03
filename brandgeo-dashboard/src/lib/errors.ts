// Turns a raw fetch/Supabase error into copy a customer can act on. Before
// this, four auth screens printed err.message straight to the page, so the
// first error text a cold prospect could meet was a driver string like
// "Failed to fetch" (Signup.tsx, Welcome.tsx) rather than anything actionable.
//
// Dependency-free on purpose: any caller can import this with no risk of
// pulling in something heavier.
const NETWORK_MESSAGE =
  'We could not reach BrandGEO. Check your connection and try again.'

type ErrorLike = { name?: unknown; message?: unknown; fromServer?: unknown }

function asErrorLike(err: unknown): ErrorLike {
  return typeof err === 'object' && err !== null ? (err as ErrorLike) : {}
}

// Wraps a message the API wrote FOR the customer (a validation sentence such
// as "Please enter a valid email address", or a rate-limit sentence) so that
// humanizeError shows it verbatim instead of the generic fallback. The first
// version of this helper swallowed those, which turned a rejected disposable
// address and a daily rate limit into "Signup failed. Please try again." with
// nothing to change, a closed loop for that visitor. Only use it for a body
// the API returned on purpose, never for a driver or transport string.
export function serverError(message: string): Error {
  const e = new Error(message) as Error & { fromServer: boolean }
  e.fromServer = true
  return e
}

// Whether an API error body is copy meant for the customer. A validation or
// rate-limit answer is. An auth failure ("Unauthorized: invalid or expired
// token") or a server fault is not: those are logged and shown as a fixed
// sentence, the rule the shell already applies to the billing portal.
export function isCustomerFacingStatus(status: number): boolean {
  return status >= 400 && status < 500 && status !== 401 && status !== 403
}

export function humanizeError(err: unknown, fallback: string): string {
  const e = asErrorLike(err)
  const name = typeof e.name === 'string' ? e.name : ''
  const rawMessage =
    typeof e.message === 'string'
      ? e.message
      : typeof err === 'string'
        ? err
        : ''
  const message = rawMessage.toLowerCase()

  // Copy the server wrote for the customer passes through untouched.
  if (e.fromServer === true && rawMessage.trim()) {
    return rawMessage
  }

  // Browser fetch/network failures. Chrome throws "Failed to fetch", Safari
  // throws "Load failed", and a stalled request can surface as a plain
  // TypeError, AbortError or NetworkError with no message at all.
  if (
    name === 'TypeError' ||
    name === 'AbortError' ||
    name === 'SyntaxError' ||
    message.includes('failed to fetch') ||
    message.includes('load failed') ||
    message.includes('networkerror')
  ) {
    return NETWORK_MESSAGE
  }

  if (message.includes('invalid login credentials')) {
    return 'That email and password do not match. Check them and try again, or reset your password.'
  }

  if (message.includes('email not confirmed')) {
    return 'Confirm your email first. Check your inbox for the link we sent, then try again.'
  }

  return fallback
}
