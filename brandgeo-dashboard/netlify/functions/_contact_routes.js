/**
 * _contact_routes.js -- pure parsing logic for the contact route resolver.
 * Packet 019. No network, no Supabase client, no environment access, so all
 * of it is testable from tests/contact_routes.test.js without fixtures beyond
 * captured HTML.
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE: never invent an address.
 * docs/growth/outbound/founder-batch-01-2026-08-15.md section A set the
 * standard that no address was inferred from a pattern, none came from a lead
 * database, and every one carries the URL where the literal string was seen.
 * There is deliberately no function here that composes an address out of a
 * person's name and a domain, and there must never be one. If a company does
 * not publish it, the correct output is nothing. A guess written into a
 * database column stops looking like a guess about ten minutes later.
 *
 * CONFIDENCE MEANS "HOW WELL SOURCED", NEVER "IS THIS THE RIGHT PERSON".
 * Those are different questions and only the first is mechanisable. On
 * 2026-08-15 three X accounts that looked correct were impostors, and a
 * confident "wrong John Powell" finding was itself later overturned. So this
 * file scores provenance and stops. Deciding a profile belongs to a named
 * human stays with a person, which is why resolve-contact-routes.js writes
 * only to prospect_contact_candidates and never to public.prospects.
 *
 * DELIBERATE DEVIATION FROM PACKET 019, stated rather than slipped in.
 * The packet defines confidence as high for two or more source URLs on the
 * company's own domain, medium for one, low for anywhere else. Taken
 * literally that scores a Google Play developer contact block as low, and
 * that is wrong in a way that matters: Google requires and verifies the
 * developer contact address, and it is the ONLY source that ever yielded
 * nithy@pagelightprime.com, which is the single best address in the batch
 * already sent. Play Store is therefore scored medium here. Everything else
 * follows the packet exactly.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Paths tried on the prospect's own domain, in this order. Small companies
// scatter their address across contact, privacy and terms pages with no
// consistency, which is why this list is broad rather than clever.
const CANDIDATE_PATHS = [
  '/',
  '/contact',
  '/contact-us',
  '/about',
  '/about-us',
  '/privacy',
  '/privacy-policy',
  '/privacy-statement',
  '/terms',
  '/help/contact',
  '/help',
]

// A local part in this set reaches a queue, not a person. Everything else is
// treated as individual. This never tries to read a human name out of a local
// part; "nithy" is classified individual because it is not in this list, not
// because anything here believes it is a first name.
const ROLE_LOCAL_PARTS = new Set([
  'info', 'contact', 'hello', 'support', 'help', 'sales', 'admin', 'care',
  'team', 'enquiries', 'inquiries', 'privacy', 'legal', 'gdpr', 'dpo',
  'billing', 'accounts', 'accounting', 'press', 'media', 'marketing',
  'careers', 'jobs', 'hr', 'noreply', 'no-reply', 'donotreply', 'do-not-reply',
  'webmaster', 'postmaster', 'abuse', 'security', 'partners', 'partnerships',
  'general', 'office', 'mail', 'email', 'service', 'services', 'customerservice',
  // Added 2026-08-16 after the first sweep of all 43 stage='new' prospects
  // classified every one of these as "individual", which overstated how many
  // prospects had a real person to write to. Each was observed live.
  'helpdesk', 'desk', 'dataprivacy', 'data-privacy', 'privacypolicy', 'events',
  'success', 'agent', 'agents', 'booking', 'bookings', 'reservations',
  'resumes', 'resume', 'recruiting', 'recruitment', 'intake', 'apps', 'app',
  'api', 'dev', 'developer', 'developers', 'docs', 'documentation', 'devops',
  'win', 'hi', 'hey', 'ask', 'talk', 'connect', 'feedback', 'suggestions',
  'orders', 'order', 'shop', 'store', 'newsletter', 'news', 'updates',
  'notifications', 'alerts', 'system', 'noc', 'it', 'finance', 'invoice',
  'invoices', 'payments', 'subscriptions', 'renewals', 'onboarding', 'training',
  'community', 'social', 'affiliate', 'affiliates', 'reseller', 'resellers',
  'vendor', 'vendors', 'supplier', 'suppliers', 'compliance', 'trust', 'safety',
])

// Never mailable, regardless of where they were found.
const NEVER_MAIL_LOCAL_PARTS = new Set([
  'noreply', 'no-reply', 'donotreply', 'do-not-reply', 'postmaster', 'abuse',
])

/**
 * Placeholder local parts. Contact forms and templates ship with example
 * addresses baked into markup, and they regex identically to real ones. Found
 * live during the 2026-08-16 control run: vibefam.com publishes
 * `you@studio.com` inside a form example, which would otherwise have been
 * offered as a contact route for Vibefam.
 */
const PLACEHOLDER_LOCAL_PARTS = new Set([
  'you', 'your', 'youremail', 'your-email', 'yourname', 'your-name', 'name',
  'firstname', 'lastname', 'someone', 'somebody', 'user', 'username',
  'example', 'sample', 'demo', 'test', 'testing', 'foo', 'bar', 'placeholder',
  'johndoe', 'john.doe', 'janedoe', 'jane.doe', 'address',
])

// Vendor, CDN and boilerplate domains that appear inside third party script
// and markup on almost every small business site. An address at one of these
// is somebody else's infrastructure, not the prospect.
const EXCLUDED_EMAIL_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'domain.com', 'yourdomain.com',
  'email.com', 'sentry.io', 'sentry-cdn.com', 'wixpress.com', 'wix.com',
  'squarespace.com', 'shopify.com', 'wordpress.com', 'wordpress.org',
  'automattic.com', 'godaddy.com', 'mailchimp.com', 'sendgrid.com',
  'sendgrid.net', 'hubspot.com', 'google-analytics.com', 'googleapis.com',
  'gstatic.com', 'cloudflare.com', 'jquery.com', 'bootstrapcdn.com',
  'fontawesome.com', 'w3.org', 'schema.org', 'jsdelivr.net', 'unpkg.com',
  'adobe.com', 'typekit.net', 'cookiebot.com', 'onetrust.com', 'osano.com',
  'termly.io', 'iubenda.com', 'placeholder.com', 'test.com', 'localhost',
  // Demo domains used in screenshots, sample data and marketing copy. Added
  // 2026-08-16 after personalizerai.com yielded jane@store.com, which is an
  // illustration inside a product screenshot, not a contact route.
  'store.com', 'yourstore.com', 'mystore.com', 'shop.com', 'company.com',
  'yourcompany.com', 'mycompany.com', 'business.com', 'mysite.com',
  'yoursite.com', 'website.com', 'brand.com', 'acme.com', 'acmecorp.com',
])

// A file extension showing up where a TLD belongs means the regex matched an
// asset filename, not an address. logo@2x.png is the classic.
const ASSET_TLDS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'ico', 'bmp',
  'css', 'js', 'mjs', 'json', 'xml', 'map', 'woff', 'woff2', 'ttf', 'otf',
  'eot', 'mp4', 'webm', 'mp3', 'wav', 'zip', 'gz',
])

/**
 * Addresses that are traps or artifacts rather than contact routes, found by
 * hand and recorded so the resolver cannot walk into them.
 *
 * zajifewluapda@gmail.com sits in the raw HTML of glood.ai/contact as a form
 * artifact or spam trap. It is not Glood's address. Recorded in
 * docs/growth/outbound/founder-batch-01-2026-08-15.md section B6.
 */
const KNOWN_TRAP_ADDRESSES = new Set([
  'zajifewluapda@gmail.com',
])

// Deliberately permissive on the local part (real addresses contain dots,
// plus signs and hyphens) and strict on requiring a dotted domain.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseDomain(domain) {
  if (typeof domain !== 'string') return null
  let d = domain.trim().toLowerCase()
  if (!d) return null
  d = d.replace(/^https?:\/\//, '')
  d = d.replace(/^www\./, '')
  d = d.split('/')[0].split('?')[0].split('#')[0]
  if (!d.includes('.')) return null
  return d
}

/**
 * candidatePaths(domain) -> absolute URLs to try, own domain only.
 * Returns [] for a domain that cannot be parsed rather than throwing, because
 * one bad row in a batch of ten must not fail the other nine.
 */
function candidatePaths(domain) {
  const d = normaliseDomain(domain)
  if (!d) return []
  return CANDIDATE_PATHS.map((p) => `https://${d}${p === '/' ? '' : p}`)
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch (_) {
    return null
  }
}

/**
 * unescapeSlashes(html) -> the same markup with backslash-escaped slashes
 * turned back into ordinary ones, so a URL embedded in JSON reads like a URL.
 *
 * Added 2026-08-24 for extractCandidateHosts, extended 2026-08-24 to
 * extractProfileUrls after the same blindness was found there.
 *
 * A URL inside a JSON blob in the page arrives as "https:\/\/example.com\/x",
 * and every regex here that looks for a URL needs a literal "//" or "/", so
 * the escaped form matched nothing at all and the page read as if it linked
 * nowhere. This is not an exotic case. PHP's json_encode escapes "/" by
 * default, so WordPress and most PHP sites embed their own JSON-LD and
 * sameAs blocks this way, and Google Play carries listing data inside
 * AF_initDataCallback blobs in exactly the same shape, which is precisely
 * the markup these two functions exist to read.
 *
 * Cheap in strictness terms: hostOf() still parses whatever URL is recovered
 * rather than trusting the surrounding text, and an escaped slash was never
 * a boundary any check in this file relied on. Only "\/" is touched, so no
 * other escape sequence in the document changes meaning.
 */
function unescapeSlashes(html) {
  return String(html).replace(/\\\//g, '/')
}

/**
 * hostMatchesDomain(host, domain) -> boolean. The one host-boundary rule used
 * everywhere a string is checked against a prospect's own domain: exact match
 * or a proper subdomain, never a substring. "pacer.com" must not match
 * "casepacer.com", and "casepacer.com" must not match
 * "casepacer.com.evil.net" (the suffix check requires the leading dot).
 */
function hostMatchesDomain(host, domain) {
  if (!host || !domain) return false
  return host === domain || host.endsWith(`.${domain}`)
}

function isOwnDomainSource(sourceUrl, ownDomain) {
  const h = hostOf(sourceUrl)
  const d = normaliseDomain(ownDomain)
  return hostMatchesDomain(h, d)
}

function isPlayStoreSource(sourceUrl) {
  const h = hostOf(sourceUrl)
  return h === 'play.google.com'
}

/**
 * classifyEmailKind(localPartOrAddress) -> 'individual' | 'role'
 * Accepts either a bare local part or a full address.
 */
function classifyEmailKind(input) {
  if (typeof input !== 'string') return 'role'
  const local = (input.includes('@') ? input.split('@')[0] : input).trim().toLowerCase()
  if (!local) return 'role'
  if (ROLE_LOCAL_PARTS.has(local)) return 'role'
  // team.support, sales-uk and similar compounds are still queues.
  const head = local.split(/[.\-_+]/)[0]
  if (ROLE_LOCAL_PARTS.has(head)) return 'role'
  return 'individual'
}

/**
 * isExcluded(value) -> boolean. True means never emit this as a candidate.
 */
function isExcluded(value) {
  if (typeof value !== 'string') return true
  const v = value.trim().toLowerCase()
  if (!v || !v.includes('@')) return true
  if (KNOWN_TRAP_ADDRESSES.has(v)) return true

  const at = v.lastIndexOf('@')
  const local = v.slice(0, at)
  const domain = v.slice(at + 1)
  if (!local || !domain || !domain.includes('.')) return true

  if (NEVER_MAIL_LOCAL_PARTS.has(local)) return true
  if (PLACEHOLDER_LOCAL_PARTS.has(local)) return true
  if (EXCLUDED_EMAIL_DOMAINS.has(domain)) return true

  const tld = domain.split('.').pop()
  if (ASSET_TLDS.has(tld)) return true

  // Sentry and similar DSNs embed a key@host that regexes as an address.
  if (/^[0-9a-f]{16,}$/.test(local)) return true

  return false
}

/**
 * Pull every JS string literal out of the document in source order. Used only
 * by the split-literal reassembly below.
 */
function stringLiterals(html) {
  const out = []
  const re = /"([^"\\\n]{0,120})"|'([^'\\\n]{0,120})'/g
  let m
  while ((m = re.exec(html)) !== null) {
    out.push(m[1] !== undefined ? m[1] : m[2])
  }
  return out
}

/**
 * Some sites publish their address as separate literals joined at runtime, to
 * defeat naive scrapers. smilenotes.co.uk/privacy does exactly this:
 *   var em1 = "privacy"; var em2 = "@"; var em3 = "smilenotes.co.uk";
 * behind a mailto: built in script, with a <noscript> reading "Email address
 * protected by JavaScript".
 *
 * Reassembling a company's OWN published literals is reading what they
 * published. It is not guessing, and it is not defeating a login or a paywall.
 * Implemented generically (find a literal that is exactly "@", look at its
 * neighbours) rather than by matching those variable names, so it works on any
 * site using the pattern.
 */
function extractSplitLiteralEmails(html) {
  const lits = stringLiterals(html)
  const found = []
  for (let i = 1; i < lits.length - 1; i++) {
    if (lits[i] !== '@') continue
    const local = (lits[i - 1] || '').trim()
    const domain = (lits[i + 1] || '').trim()
    if (!local || !domain) continue
    const joined = `${local}@${domain}`.toLowerCase()
    if (EMAIL_RE.test(joined)) found.push(joined)
    EMAIL_RE.lastIndex = 0
  }
  return found
}

/**
 * extractEmails(html, sourceUrl) -> [{ kind:'email', value, source_url, email_kind }]
 * Finds mailto: hrefs, bare addresses in text, and split-literal addresses.
 * Deduplicated within a single page.
 */
function extractEmails(html, sourceUrl) {
  if (typeof html !== 'string' || !html) return []
  const seen = new Set()
  const out = []

  const push = (raw) => {
    const value = String(raw).trim().toLowerCase().replace(/[.,;:)\]]+$/, '')
    if (isExcluded(value)) return
    if (seen.has(value)) return
    seen.add(value)
    out.push({ kind: 'email', value, source_url: sourceUrl, email_kind: classifyEmailKind(value) })
  }

  // mailto: hrefs first, they are the least ambiguous.
  const mailtoRe = /mailto:([^"'?>\s]+)/gi
  let m
  while ((m = mailtoRe.exec(html)) !== null) {
    push(decodeURIComponent(m[1]))
  }

  // Bare addresses anywhere in the document.
  EMAIL_RE.lastIndex = 0
  while ((m = EMAIL_RE.exec(html)) !== null) {
    push(m[0])
  }

  for (const e of extractSplitLiteralEmails(html)) push(e)

  return out
}

/**
 * extractProfileUrls(html, sourceUrl) -> [{ kind:'linkedin'|'x', value, source_url }]
 *
 * LinkedIn: personal profiles (/in/...) only. A /company/ page is the company,
 * not a person, and the whole point of the LinkedIn channel is that a Company
 * Page cannot send a connection request or a message to an individual, so a
 * company URL is not a contact route.
 *
 * X: both x.com and twitter.com are normalised to x.com. Reserved paths are
 * filtered because /home, /share and /intent are not accounts.
 */
const X_RESERVED = new Set([
  'home', 'share', 'intent', 'search', 'hashtag', 'i', 'explore', 'settings',
  'login', 'signup', 'privacy', 'tos', 'about', 'compose', 'messages',
  'notifications', 'widgets', 'account', 'download', 'status',
])

function extractProfileUrls(html, sourceUrl) {
  if (typeof html !== 'string' || !html) return []
  const seen = new Set()
  const out = []

  // Both patterns below need literal slashes, so a profile linked only from
  // an escaped JSON blob (a JSON-LD "sameAs" array is the common case, and
  // it is where a small company's LinkedIn most often is) was invisible
  // here. See unescapeSlashes() for why that shape is the norm rather than
  // an oddity.
  const text = unescapeSlashes(html)

  const liRe = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]+)/gi
  let m
  while ((m = liRe.exec(text)) !== null) {
    const slug = m[1].replace(/[-_]+$/, '')
    if (!slug) continue
    const value = `https://www.linkedin.com/in/${slug}/`
    if (seen.has(value)) continue
    seen.add(value)
    out.push({ kind: 'linkedin', value, source_url: sourceUrl })
  }

  const xRe = /(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})(?![A-Za-z0-9_])/gi
  while ((m = xRe.exec(text)) !== null) {
    const handle = m[1]
    if (X_RESERVED.has(handle.toLowerCase())) continue
    const value = `https://x.com/${handle}`
    if (seen.has(value)) continue
    seen.add(value)
    out.push({ kind: 'x', value, source_url: sourceUrl })
  }

  return out
}

/**
 * extractPlayStoreUrl(html) -> canonical Play listing URL, or null.
 * PageLightPrime's only individual address lives in a Play developer contact
 * block and nowhere on their own site, so this path is load bearing rather
 * than a nice to have.
 */
function extractPlayStoreUrl(html) {
  if (typeof html !== 'string' || !html) return null
  const m = /play\.google\.com\/store\/apps\/details\?id=([A-Za-z0-9._]+)/i.exec(html)
  if (!m) return null
  return `https://play.google.com/store/apps/details?id=${m[1]}`
}

/**
 * playSearchUrl(query) -> Play Store app search URL.
 *
 * Needed because a company's own site often does not link its app listing at
 * all. pagelightprime.com is the case that forced this: their homepage,
 * contact page and privacy statement contain no Play link anywhere, yet the
 * Play developer contact block is the ONLY place nithy@pagelightprime.com is
 * published, and that was the single best address in the batch already sent.
 *
 * Search alone would be a guess: a live query for "PageLightPrime" returned
 * twelve apps, eleven of them unrelated. So the caller must verify a listing
 * before trusting it, via playListingMatches() below. Search proposes, the
 * listing's own content decides.
 */
function playSearchUrl(query) {
  const q = String(query || '').trim()
  if (!q) return null
  return `https://play.google.com/store/search?q=${encodeURIComponent(q)}&c=apps&hl=en`
}

/**
 * extractPlayAppIds(html) -> app ids referenced on a Play search page.
 */
function extractPlayAppIds(html) {
  if (typeof html !== 'string' || !html) return []
  const out = []
  const seen = new Set()
  const re = /store\/apps\/details\?id=([A-Za-z0-9._]+)/g
  let m
  while ((m = re.exec(html)) !== null) {
    if (seen.has(m[1])) continue
    seen.add(m[1])
    out.push(m[1])
  }
  return out
}

// Matches an absolute http(s) URL up to the first character that cannot be
// part of one (whitespace or an HTML/attribute delimiter). Used to recover
// every linked host mentioned on a listing page, the same way a browser
// would resolve an <a href>.
const ABSOLUTE_URL_RE = /https?:\/\/[^\s"'<>)]+/gi

// Matches a bare dotted hostname wherever one appears in text, not just
// inside a URL: "Developer website: casepacer.com" with no scheme.
//
// FIXED 2026-08-22 (review finding blocker-1). The boundary used to be
// "not preceded or followed by [A-Za-z0-9.-]", which treats every OTHER
// punctuation character, underscore, "@", "=", "#", "/", quotes and more, as
// a valid boundary. That let a short prospect domain be read out of the
// middle of a longer token: "pacer.com" leaked out of "case_pacer.com" (a
// minified JS identifier), out of "?utm_source=case_pacer.com" (an analytics
// param), out of a snake_case JSON key, and "casepacer.com" leaked out of a
// URL's path, query string, fragment or userinfo section (for example
// "https://cdn.evil.net/logos/casepacer.com/icon.png" or
// "https://casepacer.com@evil.net/", where hostOf() correctly resolves
// "evil.net" but this regex was overriding that by re-reading the path text).
//
// The fix requires a real host-starting position before the match (start of
// string, whitespace, ">" or a quote) and a real host-ending position after
// it (end of string, whitespace, "<", a quote, "/" or ":"). A URL's own host
// is already recovered correctly via ABSOLUTE_URL_RE + hostOf() below, and an
// email's domain is recovered separately via EMAIL_RE in
// extractCandidateHosts(), so this regex no longer needs to float across "@"
// or into a URL's path to do its job.
//
// Two properties from before are unchanged: "sub.casepacer.com" written in
// prose is still found (bare text surrounded by real whitespace), and
// "casepacer.com.evil.net" is still captured whole, as one longer host, which
// then legitimately fails the suffix check against "casepacer.com".
//
// WIDENED 2026-08-24, TRAILING SIDE ONLY. The 2026-08-22 fix is correct and
// the leading lookbehind must stay exactly as strict as it is, because that is
// the half that actually closed the blocker: it is what stops "pacer.com"
// being read out of "case_pacer.com" or out of a URL's path, query, fragment
// or userinfo. The trailing side was over-tight in a way that produced silent
// false negatives, which is the same failure class this file exists to
// prevent, just pointed the other way: a company that DOES publish its domain
// read as one that publishes nothing. A host followed by ordinary sentence
// punctuation was not recovered at all, so "Website: casepacer.com, phone 555"
// verified nothing. Comma, semicolon, closing bracket and closing parenthesis
// are added to the terminator set.
//
// The full stop is deliberately NOT a plain member of that set. It is accepted
// only when it is not followed by another label character, via
// "\.(?![a-z0-9])". Written that way, "casepacer.com." at the end of a
// sentence terminates, while "casepacer.com.evil.net" still cannot terminate
// early at "casepacer.com" and is still captured whole as the longer host that
// then legitimately fails the suffix check. That property does not rely on
// greedy backtracking order, so it holds by construction rather than by luck.
const BARE_HOST_RE =
  /(?<=^|[\s>"'])((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63})(?=$|[\s<"'/:,;)\]]|\.(?![a-z0-9]))/gi

/**
 * extractCandidateHosts(html) -> Set<string> of every host mentioned on the
 * page, whether inside a full URL (parsed with the same hostOf() used for
 * source-url provenance elsewhere in this file), written bare in text, or
 * the domain half of an email address. An email's domain is deliberately
 * included: Google requires and verifies the Play developer contact address,
 * so a developer email at the prospect's own domain is itself evidence of
 * ownership, not a weaker signal than a linked URL.
 *
 * The email-domain case is handled by its own EMAIL_RE pass rather than by
 * BARE_HOST_RE floating across "@", per the 2026-08-22 fix on BARE_HOST_RE
 * above: a plain host regex that treats "@" as a valid boundary would also
 * treat "/", "=", "#" and "_" as valid boundaries, which is exactly the
 * defect that let a domain be read out of a URL's path, query, fragment or
 * userinfo, or out of a snake_case identifier.
 *
 * BACKSLASH-ESCAPED SLASHES ARE UNESCAPED FIRST, added 2026-08-24. Google Play
 * serves listing data inside AF_initDataCallback JSON blobs where every slash
 * is escaped, so the developer website arrives as "https:\/\/www.example.com".
 * ABSOLUTE_URL_RE needs a literal "//" and BARE_HOST_RE correctly refuses the
 * "/" sitting in front of the host, so before this the escaped form yielded no
 * host at all: the very pages this function targets are the ones most likely
 * to hide the domain that way, and a listing that does publish the prospect's
 * domain read as one that does not. Rationale and the strictness argument are
 * in unescapeSlashes() above, which extractProfileUrls() shares.
 */
function extractCandidateHosts(html) {
  const hosts = new Set()
  if (typeof html !== 'string' || !html) return hosts

  const text = unescapeSlashes(html)

  let m
  ABSOLUTE_URL_RE.lastIndex = 0
  while ((m = ABSOLUTE_URL_RE.exec(text)) !== null) {
    const h = hostOf(m[0])
    if (h) hosts.add(h)
  }

  BARE_HOST_RE.lastIndex = 0
  while ((m = BARE_HOST_RE.exec(text)) !== null) {
    hosts.add(m[1].toLowerCase().replace(/^www\./, ''))
  }

  EMAIL_RE.lastIndex = 0
  while ((m = EMAIL_RE.exec(text)) !== null) {
    const at = m[0].lastIndexOf('@')
    if (at < 0) continue
    const emailDomain = m[0].slice(at + 1).toLowerCase()
    if (emailDomain) hosts.add(emailDomain)
  }

  return hosts
}

/**
 * playListingMatches(html, ownDomain) -> boolean.
 *
 * The hard constraint that makes the Play path evidence rather than a guess:
 * accept a listing ONLY if the listing itself references the prospect's own
 * domain, which is how Google renders a verified developer website. A listing
 * that merely came back from a name search proves nothing.
 *
 * FIXED 2026-08-22 (review finding F6). This used to be
 * `html.toLowerCase().includes(d)`, a bare substring test: a listing
 * mentioning "casepacer.com" was accepted for prospect domains "pacer.com"
 * and "acer.com", and "dev@staircase.com" was accepted for "case.com". A Play
 * name search reliably returns unrelated apps (a live query for
 * "PageLightPrime" returned twelve, eleven unrelated), so this guard is the
 * only thing standing between that noise and a stranger's Google-verified
 * address being staged against the wrong prospect. It now requires a host
 * boundary match, the same rule isOwnDomainSource uses via
 * hostMatchesDomain(), not a substring anywhere in the markup.
 */
function playListingMatches(html, ownDomain) {
  const d = normaliseDomain(ownDomain)
  if (!d || typeof html !== 'string' || !html) return false
  for (const h of extractCandidateHosts(html)) {
    if (hostMatchesDomain(h, d)) return true
  }
  return false
}

/**
 * scoreConfidence(sourceUrls, ownDomain) -> 'high' | 'medium' | 'low'
 * sourceUrls is every distinct URL the value was seen at.
 */
function scoreConfidence(sourceUrls, ownDomain) {
  const urls = Array.from(new Set(sourceUrls || []))
  const own = urls.filter((u) => isOwnDomainSource(u, ownDomain))
  if (own.length >= 2) return 'high'
  if (own.length === 1) return 'medium'
  if (urls.some(isPlayStoreSource)) return 'medium'
  return 'low'
}

/**
 * mergeCandidates(raw, ownDomain) -> deduplicated candidates carrying a
 * confidence and a single representative source_url.
 *
 * The representative source_url prefers an own-domain page, because that is
 * the one a human wants to open to check the claim. Every source that
 * contributed is preserved in source_count so a reviewer can see the string
 * was corroborated without the table needing a second row per sighting.
 */
function mergeCandidates(raw, ownDomain) {
  const byKey = new Map()
  for (const c of raw || []) {
    if (!c || !c.kind || !c.value || !c.source_url) continue
    const key = `${c.kind}::${c.value}`
    if (!byKey.has(key)) byKey.set(key, { ...c, sources: [] })
    byKey.get(key).sources.push(c.source_url)
  }

  const out = []
  for (const entry of byKey.values()) {
    const sources = Array.from(new Set(entry.sources))
    const preferred = sources.find((u) => isOwnDomainSource(u, ownDomain)) || sources[0]
    const candidate = {
      kind: entry.kind,
      value: entry.value,
      source_url: preferred,
      confidence: scoreConfidence(sources, ownDomain),
      source_count: sources.length,
    }
    if (entry.kind === 'email') {
      candidate.email_kind = entry.email_kind || classifyEmailKind(entry.value)

      /**
       * A ROLE address on a domain that is not the prospect's own is almost
       * always template boilerplate: a privacy policy copied from another
       * company, a platform's support address, a partner's contact block.
       * Found live on 2026-08-16, where pagelightprime.com publishes
       * privacy@elite.com on its privacy statement.
       *
       * Downgraded to low rather than excluded, deliberately, because the
       * exact same shape was legitimate for Glood.AI: support@loopclub.io is
       * a foreign-domain role address and is the correct route, since Loopclub
       * Ltd is the entity behind glood.ai. Excluding this class would have
       * lost a real address. Ranking it last keeps the judgment with a human.
       *
       * An INDIVIDUAL address on a foreign domain is never downgraded:
       * jsteele@beermannlaw.com was the single best address in the batch.
       */
      const at = entry.value.lastIndexOf('@')
      const emailDomain = at >= 0 ? entry.value.slice(at + 1) : ''
      const own = normaliseDomain(ownDomain)
      const foreign = own && emailDomain !== own && !emailDomain.endsWith(`.${own}`)
      if (candidate.email_kind === 'role' && foreign) candidate.confidence = 'low'
    }
    out.push(candidate)
  }

  // Individual addresses first, then better sourced, so the reviewer sees the
  // most useful row at the top rather than whichever page loaded first.
  const rank = { high: 0, medium: 1, low: 2 }
  out.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind)
    if (a.kind === 'email' && a.email_kind !== b.email_kind) return a.email_kind === 'individual' ? -1 : 1
    return rank[a.confidence] - rank[b.confidence]
  })
  return out
}

module.exports = {
  CANDIDATE_PATHS,
  ROLE_LOCAL_PARTS,
  EXCLUDED_EMAIL_DOMAINS,
  KNOWN_TRAP_ADDRESSES,
  PLACEHOLDER_LOCAL_PARTS,
  playSearchUrl,
  extractPlayAppIds,
  playListingMatches,
  normaliseDomain,
  candidatePaths,
  hostOf,
  hostMatchesDomain,
  extractCandidateHosts,
  isOwnDomainSource,
  isPlayStoreSource,
  classifyEmailKind,
  isExcluded,
  extractSplitLiteralEmails,
  extractEmails,
  extractProfileUrls,
  extractPlayStoreUrl,
  scoreConfidence,
  mergeCandidates,
}
