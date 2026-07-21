/**
 * _disposable_domains.js — disposable / temporary email domain blocklist.
 *
 * Underscore prefix = Netlify does NOT expose this as an endpoint.
 *
 * Used by signup-client.js to SOFT-block throwaway addresses on the email path
 * (SIGNUP-RESEARCH.md §5.2). Social login (Google/LinkedIn) arrives pre-verified,
 * so it never needs this check. Soft block = a clear "use a permanent address"
 * message, never a silent reject.
 *
 * This is a curated subset of the well-known open-source blocklists
 * (eramitgupta/disposable-email, wesbos/burner-email-providers). It covers the
 * highest-volume throwaway providers; it is deliberately NOT the full 100k-domain
 * list (that would bloat the function bundle). The real gate is still the mandatory
 * invite/verification step — this list is an early, cheap indicator. Expand it, or
 * swap in a hosted check (e.g. UserCheck), if abuse from newer domains appears.
 */

const DISPOSABLE_DOMAINS = new Set([
  '0-mail.com', '0clock.net', '10minutemail.com', '10minutemail.net', '20minutemail.com',
  '33mail.com', 'anonbox.net', 'armyspy.com', 'byom.de', 'cuvox.de',
  'dayrep.com', 'discard.email', 'discardmail.com', 'dispostable.com', 'einrot.com',
  'emailondeck.com', 'emailtemporario.com.br', 'fakeinbox.com', 'fakemailgenerator.com',
  'fakemail.net', 'gettempmail.com', 'getairmail.com', 'getnada.com', 'grr.la',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz',
  'guerrillamailblock.com', 'harakirimail.com', 'inboxbear.com', 'inboxkitten.com',
  'jetable.org', 'mail-temp.com', 'mail.tm', 'mailcatch.com', 'maildrop.cc',
  'mailexpire.com', 'mailinator.com', 'mailinator.net', 'mailnesia.com', 'mailnull.com',
  'mailsac.com', 'mailtothis.com', 'mintemail.com', 'mohmal.com', 'moakt.com',
  'mytemp.email', 'nada.email', 'nowmymail.com', 'objectmail.com', 'onetimeemail.net',
  'pokemail.net', 'proxymail.eu', 'rcpt.at', 'rhyta.com', 'sharklasers.com',
  'shieldedmail.com', 'spam4.me', 'spamgourmet.com', 'spambog.com', 'spambox.us',
  'superrito.com', 'temp-mail.io', 'temp-mail.org', 'tempail.com', 'tempinbox.com',
  'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempmailaddress.com', 'tempr.email',
  'temporary-mail.net', 'throwawaymail.com', 'tmail.ws', 'tmpmail.net', 'tmpmail.org',
  'trashmail.com', 'trashmail.de', 'trashmail.net', 'trbvm.com', 'vomoto.com',
  'wegwerfmail.de', 'wegwerfmail.net', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'you-spam.com', 'zetmail.com', 'mailto.plus', 'fexpost.com', 'fexbox.org',
  'burnermail.io', 'emltmp.com', 'luxusmail.org', 'tmpbox.net', 'vintomaper.com',
])

/** true if the email's domain is a known disposable/temporary provider. */
function isDisposableEmail(email) {
  const at = String(email || '').lastIndexOf('@')
  if (at === -1) return false
  const domain = email.slice(at + 1).trim().toLowerCase()
  return DISPOSABLE_DOMAINS.has(domain)
}

module.exports = { DISPOSABLE_DOMAINS, isDisposableEmail }
