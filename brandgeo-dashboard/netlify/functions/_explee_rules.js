/**
 * _explee_rules.js: the pure decisions of the Explee lead import
 * (docs/arch/explee-lead-import.md, revision 4, D3 to D6, D9 and section 5.3).
 *
 * No I/O and no clock of its own. Anything that decides on time takes an
 * injected `now`. The only Node module used is `crypto` (emailSha256,
 * rulesHash). Two pure helpers are borrowed from _prospect_prompts.js
 * (buildProspectAliases, sanitizeRecoveredBrandName); that file has no
 * top-level I/O, so requiring it loads code only.
 *
 * Everything that comes from Explee (labels, reply text, addresses, company
 * names) is third-party, possibly hostile input. Nothing here builds an email
 * address: extractReferral can only return a substring of the reply text it
 * was given, and asserts that before returning.
 */
const crypto = require('crypto')
const { buildProspectAliases, sanitizeRecoveredBrandName } = require('./_prospect_prompts')

// Mirror of PLAN_PROMPTS.free in src/lib/planConfig.ts, pinned by a test that
// reads that file (tests/explee_rules.test.js).
const FREE_PROMPT_COUNT = 5

const PERSON_ID_RE = /^[A-Za-z0-9_-]{1,64}$/

// Rule 2 pattern, applied to normalised labels (lowercase, spaces and hyphens
// as underscores). rev 4, V4: opt(ed)?_?out, so opted_out and optedout match.
const DECLINE_RE = /(^|_)(not_?interested|unsub|remove|do_?not|opt(ed)?_?out|stop|bounce|spam|complain|declin)/

// D5: free mail and shared platforms. An entry ending in `.*` matches its stem
// followed by one or two final labels (hotmail.com, hotmail.co.uk).
const EXCLUDED_DOMAINS = Object.freeze([
  // free mail
  'gmail.com', 'googlemail.com', 'outlook.*', 'hotmail.*', 'live.*', 'msn.com',
  'yahoo.*', 'ymail.com', 'rocketmail.com', 'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'proton.me', 'protonmail.com', 'protonmail.ch', 'pm.me', 'gmx.*',
  'web.de', 't-online.de', 'mail.ru', 'yandex.*', 'zoho.com', 'zohomail.com',
  'mail.com', 'fastmail.com', 'tutanota.com', 'tuta.io', 'hey.com', 'qq.com',
  '163.com', '126.com', 'naver.com', 'daum.net', 'seznam.cz', 'wp.pl', 'o2.pl',
  'libero.it', 'orange.fr', 'free.fr', 'laposte.net', 'btinternet.com',
  'comcast.net', 'verizon.net', 'att.net', 'yopmail.com', 'mailinator.com',
  // shared platforms
  'wixsite.com', 'wix.com', 'github.io', 'github.com', 'blogspot.com',
  'wordpress.com', 'linktr.ee', 'facebook.com', 'instagram.com', 'linkedin.com',
  'google.com', 'sites.google.com', 'notion.site', 'notion.so', 'squarespace.com',
  'webflow.io', 'carrd.co', 'medium.com', 'substack.com', 'myshopify.com',
  'shopify.com', 'x.com', 'twitter.com', 'youtube.com', 'tiktok.com',
  'vercel.app', 'netlify.app', 'herokuapp.com', 'godaddysites.com', 'weebly.com',
  'jimdo.com', 'bit.ly', 'explee.com',
])

const NOREPLY_LOCALS = new Set(['noreply', 'no-reply', 'donotreply', 'mailer-daemon', 'postmaster'])

const FALLBACK_TEMPLATES = ['best companies like', 'top alternatives to', 'recommended providers similar to']

// Common two-letter TLDs used as generic names, never read as a country.
const GENERIC_CC_TLDS = new Set(['io', 'ai', 'co', 'me', 'tv', 'ly', 'gg', 'fm', 'so', 'to', 'sh', 'ws', 'cc', 'am', 'ag', 'gl', 'is', 'it'])

// D6 (rev 3, L1): the DENSE scripts. Hangul was added in revision 3.
const DENSE_CLASS = '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Thai}\\p{Script=Hangul}'
const DENSE_RE = new RegExp(`[${DENSE_CLASS}]`, 'u')

// D3 (rev 3, A3; rev 4, I-1): our own sending domains. A code constant the
// setting own_sender_domains can only ADD to; no setting value removes them.
const OWN_SENDER_DEFAULTS = Object.freeze(['getbrandgeo.com', 'trybrandgeo.com'])

// D9 (rev 3; rev 4 adds skipped_label): follow-up statuses never selected again.
const FOLLOW_UP_TERMINAL = new Set(['sent', 'skipped_answered', 'skipped_referral', 'skipped_blocked', 'skipped_declined', 'skipped_expired', 'gave_up', 'skipped_label'])
const FOLLOW_UP_MAX_ATTEMPTS = 3

// D8 "Attempts" (rev 4, N3): a failed row is final at 3 consecutive failures of
// the same reason, or at 10 failures of any reason in total.
const MAX_CONSECUTIVE_ATTEMPTS = 3
const MAX_TOTAL_ATTEMPTS = 10

// D5 duplicate 2 (rev 4, V2): final reasons whose stored hash suppresses the address.
const SUPPRESSING_REASONS = Object.freeze(['erased', 'hidden', 'provision_error', 'half_made'])

// One address, ASCII only, bounded on both sides so that a unicode lookalike
// next to it (a Cyrillic letter inside the local part) prevents a partial
// match instead of yielding the ASCII tail as an address.
const EMAIL_BOUNDED_RE = /(?<![\p{L}\p{N}._%+\-@])[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?![\p{L}\p{N}_@-]|\.[\p{L}\p{N}])/gu
// Loose form for masking only: anything shaped like an address is masked.
const EMAIL_LOOSE_RE = /[^\s<>()[\]{},;:"']+@[^\s<>()[\]{},;:"']+/g
// 7 or more digits, possibly separated by spaces, dots, hyphens, brackets, with
// an optional leading plus.
const PHONE_RE = /\+?\(?\d(?:[\s.\-()]*\d){6,}\)?/g

// ── small helpers ──────────────────────────────────────────────────────────

function isPlausibleDomain(input) {
  if (typeof input !== 'string') return false
  const d = input.trim().toLowerCase()
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(d) && d.length <= 253
}

function normalizeDomain(input) {
  if (input === null || input === undefined) return ''
  return String(input).trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
}

function emailDomainOf(email) {
  if (typeof email !== 'string') return null
  const at = email.lastIndexOf('@')
  if (at < 1) return null
  const d = normalizeDomain(email.slice(at + 1))
  return d || null
}

function lowerEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function looksLikeEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'brand'
}

function titleCase(input) {
  return String(input).replace(/\b\w/g, (c) => c.toUpperCase())
}

function fold(s) {
  return String(s).normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function tsOf(m) {
  const t = Date.parse(m && m.ts ? m.ts : '')
  return Number.isFinite(t) ? t : null
}

// ── labels ─────────────────────────────────────────────────────────────────

function normaliseIntent(label) {
  if (typeof label !== 'string') return null
  const t = label.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return t || null
}

function isCandidate(item) {
  if (!item) return false
  if (item.latest_intent !== null && item.latest_intent !== undefined && item.latest_intent !== '') return true
  return Number(item.reply_count) > 0
}

function replyMessages(thread) {
  const msgs = thread && Array.isArray(thread.messages) ? thread.messages : []
  return msgs.filter((m) => m && m.type === 'reply')
}

function sentMessages(thread) {
  const msgs = thread && Array.isArray(thread.messages) ? thread.messages : []
  return msgs.filter((m) => m && m.type === 'sent')
}

/** The latest reply-type message: by ts when parsable, else the last one listed. */
function latestReply(thread) {
  const replies = replyMessages(thread)
  if (!replies.length) return null
  let best = replies[replies.length - 1]
  let bestTs = tsOf(best)
  for (const m of replies) {
    const t = tsOf(m)
    if (t !== null && (bestTs === null || t > bestTs)) { best = m; bestTs = t }
  }
  return best
}

function threadIntents(item, thread) {
  const out = new Set()
  for (const m of replyMessages(thread)) {
    const n = normaliseIntent(m.intent)
    if (n) out.add(n)
  }
  const a = normaliseIntent(thread && thread.latest_intent)
  if (a) out.add(a)
  const b = normaliseIntent(item && item.latest_intent)
  if (b) out.add(b)
  return out
}

function latestIntentOf(item, thread) {
  return normaliseIntent(thread && thread.latest_intent) || normaliseIntent(item && item.latest_intent)
}

function isDeclineLabel(label, excludeSet) {
  if (!label) return false
  if (excludeSet && excludeSet.has(label)) return true
  return DECLINE_RE.test(label)
}

/**
 * rev 4, I-1: the EFFECTIVE own list, OWN_SENDER_DEFAULTS plus whatever the
 * setting adds, normalised, sorted, deduplicated. An empty, null or missing
 * setting leaves the two defaults; nothing can remove them.
 */
function ownSenderDomains(settings) {
  const s = settings || {}
  const extra = Array.isArray(s.own_sender_domains) ? s.own_sender_domains : []
  return Array.from(new Set(OWN_SENDER_DEFAULTS.concat(extra).map((d) => normalizeDomain(d)).filter(Boolean))).sort()
}

function settingsSets(settings) {
  const s = settings || {}
  const set = (arr) => new Set((Array.isArray(arr) ? arr : []).map(normaliseIntent).filter(Boolean))
  return {
    include: set(s.include_intents),
    exclude: set(s.exclude_intents),
    referral: set(s.referral_intents),
    policy: s.unknown_label_policy === 'include' ? 'include' : 'hold',
    own: ownSenderDomains(s),
  }
}

/**
 * rev 4, I-1, both directions: the domain is equal to an own domain, under it,
 * or a parent of it that has at least two labels (so a bare `example` or `com`
 * is never a parent match). A public-suffix parent (`co.uk`) is held, which
 * is fail-safe.
 */
function isOwnDomain(domain, ownDomains) {
  const d = normalizeDomain(domain)
  if (!d) return false
  for (const o of ownDomains || []) {
    const n = normalizeDomain(o)
    if (!n) continue
    if (d === n || d.endsWith('.' + n)) return true
    if (d.includes('.') && n.endsWith('.' + d)) return true
  }
  return false
}

/** rev 3, A3: the setting plus the from_email domain of every sent-type message of the thread. */
function ownDomainsFor(settings, thread) {
  const own = new Set(ownSenderDomains(settings))
  for (const m of sentMessages(thread)) {
    const d = emailDomainOf(m.from_email)
    if (d) own.add(d)
  }
  return Array.from(own)
}

// ── replier and referral ───────────────────────────────────────────────────

/**
 * The replier is the listing item's email, and only when it equals (case
 * insensitive) the from_email of at least one reply-type message. The enriched
 * LeadProfile.email is never a replier.
 */
function resolveReplier(item, thread) {
  const listed = lowerEmail(item && item.email)
  if (!listed || !looksLikeEmail(listed)) return null
  for (const m of replyMessages(thread)) {
    if (lowerEmail(m.from_email) === listed) return listed
  }
  return null
}

function stripQuoted(bodyText) {
  if (typeof bodyText !== 'string') return ''
  const out = []
  for (const line of bodyText.split(/\r?\n/)) {
    const t = line.trim()
    if (/^On .* wrote:$/.test(t) || /^From:/i.test(t) || /^-----Original Message/i.test(t)) break
    if (/^>/.test(t)) continue
    out.push(line)
  }
  return out.join('\n')
}

function isExcludedDomain(domain) {
  const d = normalizeDomain(domain)
  if (!d) return false
  for (const entry of EXCLUDED_DOMAINS) {
    if (entry.endsWith('.*')) {
      const stem = escapeRe(entry.slice(0, -2))
      if (new RegExp(`(^|\\.)${stem}\\.[a-z0-9-]+(\\.[a-z0-9-]+)?$`).test(d)) return true
    } else if (d === entry || d.endsWith('.' + entry)) {
      return true
    }
  }
  return false
}

function domainsMatch(a, b) {
  const x = normalizeDomain(a)
  const y = normalizeDomain(b)
  if (!x || !y) return false
  return x === y || x.endsWith('.' + y) || y.endsWith('.' + x)
}

/**
 * rev 4, V3: ONE predicate for D5 duplicate 4 and the F3 post-reservation
 * re-check. `mine` is this lead's brand and email domain, `theirs` the other
 * row's stored brand_domain and email_domain; on each side nulls and every
 * excluded (free-mail or platform) domain are dropped; true when any pair
 * satisfies domainsMatch.
 */
function companyConflict(mine, theirs) {
  const keep = (list) => (Array.isArray(list) ? list : [])
    .map((d) => normalizeDomain(d))
    .filter((d) => d && !isExcludedDomain(d))
  const a = keep(mine)
  const b = keep(theirs)
  return a.some((x) => b.some((y) => domainsMatch(x, y)))
}

/**
 * D5 duplicate 2 (rev 4, V2): a stored hash suppresses a new create when the
 * row is creating or created, carries erased_at, undone_at or invite_sent_at
 * (an invite went to that address, whatever the decision), or is final with a
 * reason in SUPPRESSING_REASONS.
 */
function suppresses(r) {
  if (!r) return false
  if (r.decision === 'creating' || r.decision === 'created') return true
  if (r.erased_at || r.undone_at || r.invite_sent_at) return true
  return !!r.final && SUPPRESSING_REASONS.includes(r.reason)
}

/** D8 "Attempts" (rev 4, N3): forced || attempts >= 3 || attempts_total >= 10. */
function isFinalFailure({ attempts, attempts_total: total, forced }) {
  return !!forced || (Number(attempts) || 0) >= MAX_CONSECUTIVE_ATTEMPTS || (Number(total) || 0) >= MAX_TOTAL_ATTEMPTS
}

function domainAllowed(domain, allowed) {
  for (const a of allowed || []) {
    const n = normalizeDomain(a)
    if (n && (domain === n || domain.endsWith('.' + n))) return true
  }
  return false
}

function findAddresses(text) {
  const lower = String(text || '').toLowerCase()
  const found = []
  for (const m of lower.matchAll(EMAIL_BOUNDED_RE)) found.push(m[0])
  return { lower, found }
}

/**
 * extractReferral(bodyText, ctx) -> string | null
 * D4: exactly one address, literally present in the reply, on the company's
 * own domain (or the replier's when known), never ours, never a no-reply or
 * excluded domain. Never constructs an address.
 */
function extractReferral(bodyText, ctx) {
  if (typeof bodyText !== 'string' || !bodyText) return null
  const c = ctx || {}
  const { lower, found } = findAddresses(stripQuoted(bodyText))
  const distinct = Array.from(new Set(found))
  if (distinct.length > 3) return null

  const drop = new Set()
  if (c.replierEmail) drop.add(lowerEmail(c.replierEmail))
  for (const e of c.replyFromEmails || []) drop.add(lowerEmail(e))
  for (const e of c.ourAddresses || []) drop.add(lowerEmail(e))

  const kept = distinct.filter((addr) => {
    if (!lower.includes(addr)) return false             // substring property, asserted
    if (drop.has(addr)) return false
    const at = addr.lastIndexOf('@')
    const local = addr.slice(0, at)
    const domain = addr.slice(at + 1)
    if (NOREPLY_LOCALS.has(local)) return false
    if (isExcludedDomain(domain)) return false
    if (!domainAllowed(domain, c.allowedDomains)) return false
    return true
  })
  if (kept.length !== 1) return null
  const result = kept[0]
  if (!lower.includes(result)) return null
  return result
}

// ── domains and brand ──────────────────────────────────────────────────────

function usableDomain(d) {
  const n = normalizeDomain(d)
  return n && isPlausibleDomain(n) && !isExcludedDomain(n) ? n : null
}

/** Brand domain: the profile's company_domain when usable, else the invitee's email domain, else null. */
function brandDomainFor(profileDomain, inviteeEmail) {
  return usableDomain(profileDomain) || usableDomain(emailDomainOf(inviteeEmail))
}

const LEGAL_FORM_RE = /[\s,]+(pty\.?\s+ltd\.?|ltd\.?|limited|llc\.?|inc\.?|gmbh|s\.r\.l\.?|srl|s\.a\.?|sa|s\.l\.?|sl|b\.?v\.?|ab|oy|sas|s\.?p\.?a\.?|plc)$/i

function cleanCompanyName(name) {
  if (typeof name !== 'string') return null
  let v = name.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!v || /^(n\/a|na|unknown|none|null|undefined|-)$/i.test(v)) return null
  v = v.replace(LEGAL_FORM_RE, '').replace(/[\s,]+$/, '').trim()
  if (!v) return null
  return v.slice(0, 80)
}

function deriveBrand({ brandDomain, companyName, llmBrandName, ogSiteName }) {
  const domain = normalizeDomain(brandDomain)
  const root = domain.split('.')[0] || domain
  const company = cleanCompanyName(companyName)
  const llm = cleanCompanyName(llmBrandName)
  const brandName = company || llm || sanitizeRecoveredBrandName(ogSiteName) || titleCase(root.replace(/-/g, ' '))

  const list = buildProspectAliases(domain, brandName)
  if (company && company.toLowerCase() !== brandName.toLowerCase()) list.push(company)
  if (llm && llm.toLowerCase() !== brandName.toLowerCase()) list.push(llm)
  const seen = new Set()
  const aliases = []
  for (const a of list) {
    const t = String(a || '').trim()
    if (t.length < 3) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    aliases.push(t)
    // rev 3, D5: capped at 5; _provision_client.js then puts the account name
    // first (A1), so the stored list holds at most 6.
    if (aliases.length >= 5) break
  }
  return { brandName, aliases, website: domain }
}

function resolveMarket(country, markets) {
  let c = typeof country === 'string' ? country.trim().toUpperCase() : ''
  if (c === 'UK') c = 'GB'
  if (!/^[A-Z]{2}$/.test(c)) c = null
  const market = c ? (markets || []).find((m) => m && m.id === c) : null
  if (market) {
    const first = Array.isArray(market.regions) && market.regions.length ? market.regions[0].id : null
    return { marketId: market.id, regionId: first || null, country: c }
  }
  return { marketId: 'WW', regionId: null, country: c }
}

function countryConflict(brandDomain, marketId) {
  const d = normalizeDomain(brandDomain)
  const tld = d.split('.').pop() || ''
  if (!/^[a-z]{2}$/.test(tld) || GENERIC_CC_TLDS.has(tld)) return false
  if (!marketId || marketId === 'WW') return false
  const asMarket = tld === 'uk' ? 'GB' : tld.toUpperCase()
  return asMarket !== marketId
}

// ── qualification ──────────────────────────────────────────────────────────

/**
 * qualifyLead({ item, thread }, settings) -> Decision
 * D3, first match wins. Reads only the listing item and the thread fetched in
 * the same run (Rule F); stored columns are never input.
 */
function qualifyLead(input, settings) {
  const item = (input && input.item) || {}
  const thread = (input && input.thread) || {}
  const sets = settingsSets(settings)
  const intents = threadIntents(item, thread)
  const latest = latestIntentOf(item, thread)
  const skip = (reason, final, extra) => Object.assign({ action: 'skip', reason, final, intent: latest }, extra || {})
  // rev 3, A3: every create passes the own-domain guard before it is returned.
  const guarded = (create) => {
    const own = ownDomainsFor(settings, thread)
    const companyDomain = thread.lead ? normalizeDomain(thread.lead.company_domain) : ''
    if (isOwnDomain(emailDomainOf(create.invitee), own) || (companyDomain && isOwnDomain(companyDomain, own))) {
      return skip('own_sender_domain', false, { held: true })
    }
    return create
  }

  // 1
  if (item.erased || thread.erased || (thread.lead && thread.lead.erased)) return skip('erased', true)
  // 2
  if (thread.reply_blocked_reason === 'unsubscribe') return skip('declined', true)
  for (const label of intents) if (isDeclineLabel(label, sets.exclude)) return skip('declined', true)
  // 3
  const status = typeof item.lead_status === 'string' ? item.lead_status.trim().toLowerCase() : ''
  if (status === 'lost' || status === 'unqualified') return skip('team_lost', true)
  // 4
  if (replyMessages(thread).length === 0) return skip('no_reply', false)
  // 5
  if (!thread.lead) return skip('profile_missing', false)

  const replier = resolveReplier(item, thread)
  // 6
  if (latest && sets.referral.has(latest)) {
    const reply = latestReply(thread)
    const allowed = []
    const company = usableDomain(thread.lead.company_domain)
    const replierDomain = replier ? usableDomain(emailDomainOf(replier)) : null
    if (company) allowed.push(company)
    else if (replierDomain) allowed.push(replierDomain)
    if (replierDomain && !allowed.includes(replierDomain)) allowed.push(replierDomain)
    const ours = []
    for (const m of sentMessages(thread)) {
      if (m.from_email) ours.push(m.from_email)
      if (m.to_email) ours.push(m.to_email)
      for (const x of Array.isArray(m.cc) ? m.cc : []) ours.push(x)
    }
    const referral = extractReferral(reply && reply.body_text, {
      replierEmail: replier,
      replyFromEmails: replyMessages(thread).map((m) => m.from_email).filter(Boolean),
      ourAddresses: ours,
      allowedDomains: allowed,
    })
    if (referral) return guarded({ action: 'create', invitee: referral, inviteeSource: 'referral', intent: latest })
    return skip('auto_reply_no_referral', false)
  }
  // 7
  if (sets.policy === 'hold' && (!latest || !sets.include.has(latest))) {
    return skip('unknown_intent', false, { label: latest || '(none)', held: true })
  }
  // 8
  const reply = latestReply(thread)
  const body = reply && typeof reply.body_text === 'string' ? reply.body_text.trim() : ''
  if (!body && latest !== 'hot_lead') return skip('empty_reply', false)
  // 9
  if (!replier) return skip('replied_by_other', false, { held: true })
  // 10
  return guarded({ action: 'create', invitee: replier, inviteeSource: 'replier', intent: latest })
}

// ── prompts ────────────────────────────────────────────────────────────────

const URL_RE = /(https?:\/\/|www\.|\b[\p{L}\p{N}-]+\.(com|net|org|io|ai|co|app|dev|eu|uk|de|es|fr|it|ro|nl|info|biz)\b)/iu

function isDenseScript(text) {
  return typeof text === 'string' && DENSE_RE.test(text)
}

/**
 * rev 3, M4 boundary rule: the term matches where the character before it and
 * the character after it are each absent, not a letter or digit, OR a DENSE
 * character. Only non-dense letters and digits block a match, so a Latin term
 * inside a Latin word still needs a word boundary, while a term written
 * against kana, Han, Thai or Hangul matches.
 */
function brandTermRegex(foldedTerm) {
  const blocker = `(?![${DENSE_CLASS}])[\\p{L}\\p{N}]`
  return new RegExp(`(?<!${blocker})${escapeRe(foldedTerm)}(?!${blocker})`, 'u')
}

/**
 * rev 4, N2: inside the brand-term rule only, prompt and term are normalised
 * with NFKC BEFORE fold(), so fullwidth Latin letters and digits, halfwidth
 * katakana and other compatibility forms compare as their ordinary forms.
 * fold() and its other callers (length, duplicate, template rules) are unchanged.
 */
function brandFold(s) {
  return fold(String(s || '').normalize('NFKC'))
}

function brandTermMatches(prompt, term) {
  const t = brandFold(term)
  if (!t) return false
  return brandTermRegex(t).test(brandFold(prompt))
}

function validatePrompts(candidates, opts) {
  const count = (opts && opts.count) || FREE_PROMPT_COUNT
  const terms = Array.from(new Set(((opts && opts.brandTerms) || [])
    .map((t) => brandFold(t))
    .filter((t) => t.length >= 2)))
  const kept = []
  const keptFolded = new Set()
  const rejected = []
  for (const raw of Array.isArray(candidates) ? candidates : []) {
    if (typeof raw !== 'string') { rejected.push({ text: String(raw), rule: 'not_string' }); continue }
    const reject = (rule) => rejected.push({ text: raw.slice(0, 200), rule })
    if (/[\r\n]/.test(raw.trim())) { reject('line_break'); continue }
    const text = raw.replace(/\s+/g, ' ').trim()
    if (URL_RE.test(text)) { reject('url'); continue }
    if (text.includes('@')) { reject('at_sign'); continue }
    if (/[{}[\]]/.test(text)) { reject('brackets'); continue }
    const chars = Array.from(text).length
    if (DENSE_RE.test(text)) {
      if (chars < 6 || chars > 80) { reject('length'); continue }
    } else {
      const words = text.split(' ').filter(Boolean).length
      if (chars < 15 || chars > 200 || words < 3 || words > 30) { reject('length'); continue }
    }
    const folded = fold(text)
    if (terms.some((t) => brandTermMatches(text, t))) { reject('brand_term'); continue }
    if (FALLBACK_TEMPLATES.some((f) => folded.includes(f))) { reject('fallback_template'); continue }
    const key = folded.replace(/[?.!,;:]+$/, '')
    if (keptFolded.has(key)) { reject('duplicate'); continue }
    keptFolded.add(key)
    kept.push(text)
  }
  const prompts = kept.slice(0, count)
  return { ok: prompts.length >= count, prompts, rejected }
}

// ── storage helpers ────────────────────────────────────────────────────────

function maskEmail(email) {
  const e = lowerEmail(email)
  const at = e.lastIndexOf('@')
  if (at < 1 || at === e.length - 1) return '***'
  return `${e[0]}***@${e.slice(at + 1)}`
}

/** First 280 characters of the reply, addresses masked except `keep`, digit runs masked. */
function excerpt(bodyText, keep) {
  const keepL = keep ? lowerEmail(keep) : null
  let t = stripQuoted(typeof bodyText === 'string' ? bodyText : '')
  t = t.replace(EMAIL_LOOSE_RE, (m) => {
    const tail = (m.match(/[.,;:!?]+$/) || [''])[0]
    const addr = tail ? m.slice(0, -tail.length) : m
    return (keepL && addr.toLowerCase() === keepL ? addr : maskEmail(addr)) + tail
  })
  t = t.replace(PHONE_RE, '[number]')
  t = t.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()
  return Array.from(t).slice(0, 280).join('')
}

function emailSha256(email) {
  return crypto.createHash('sha256').update(lowerEmail(email)).digest('hex')
}

function rulesHash(settings) {
  const s = settingsSets(settings)
  const payload = JSON.stringify({
    include: Array.from(s.include).sort(),
    exclude: Array.from(s.exclude).sort(),
    referral: Array.from(s.referral).sort(),
    policy: s.policy,
    own: s.own,          // rev 3, A3
  })
  return crypto.createHash('sha256').update(payload).digest('hex')
}

// ── follow-up and note ─────────────────────────────────────────────────────

/**
 * rev 3, A2: the follow-up body may hold only the placeholders {brand} and
 * {first_name}, and no '%' at all, so it can never quote a measured figure.
 */
function followUpBodyValid(body) {
  if (typeof body !== 'string' || !body.trim()) return false
  if (body.includes('%')) return false
  const stripped = body.split('{brand}').join('').split('{first_name}').join('')
  return !/[{}]/.test(stripped)
}

/**
 * rev 3, L3 and L4: evaluated BEFORE any thread read.
 * -> 'proceed' | 'skipped_expired' | 'gave_up' | 'terminal'
 */
function followUpPreGate({ row, now, settings }) {
  const status = row && row.follow_up_status
  if (status && FOLLOW_UP_TERMINAL.has(status)) return 'terminal'
  if (status === 'failed' && (Number(row.follow_up_attempts) || 0) >= FOLLOW_UP_MAX_ATTEMPTS) return 'gave_up'
  const created = Date.parse(row && row.created_at_account ? row.created_at_account : '')
  const maxAge = Math.max(1, Number(settings && settings.follow_up_max_age_hours) || 72) * 3600000
  if (Number.isFinite(created) && now.getTime() - created > maxAge) return 'skipped_expired'
  return 'proceed'
}

function lostStatus(item) {
  const s = item && typeof item.lead_status === 'string' ? item.lead_status.trim().toLowerCase() : ''
  return s === 'lost' || s === 'unqualified'
}

/**
 * D9, rev 3 and rev 4. Order: off, pre-gate, referral, listing (wait),
 * erased/blocked, declined, skipped_label (include-only rule, V4), can_reply
 * false, delay (wait), answered, send. item null or listingComplete false
 * gives 'wait' (no send this run).
 */
function followUpDecision({ row, thread, item, listingComplete, now, settings }) {
  const st = settings || {}
  if (!st.follow_up_enabled || !followUpBodyValid(st.follow_up_body)) return 'off'
  const gate = followUpPreGate({ row, now, settings: st })
  if (gate === 'terminal') return 'off'
  if (gate !== 'proceed') return gate
  if (row && row.invitee_source === 'referral') return 'skipped_referral'
  if (!item || listingComplete !== true) return 'wait'
  if (!thread || thread.erased || (thread.lead && thread.lead.erased)) return 'skipped_blocked'
  // F2: a decline at any time, an unsubscribe block, or the team's Lost.
  if (thread.reply_blocked_reason === 'unsubscribe') return 'skipped_declined'
  const exclude = new Set((Array.isArray(st.exclude_intents) ? st.exclude_intents : []).map(normaliseIntent).filter(Boolean))
  for (const label of threadIntents(item, thread)) if (isDeclineLabel(label, exclude)) return 'skipped_declined'
  if (lostStatus(item)) return 'skipped_declined'
  // rev 4, V4, include-only: every non-null reply intent of the whole thread,
  // plus both latest_intent values (each must be non-null), must be an
  // include label; anything else is skipped_label, terminal.
  const include = new Set((Array.isArray(st.include_intents) ? st.include_intents : []).map(normaliseIntent).filter(Boolean))
  const latestThread = normaliseIntent(thread.latest_intent)
  const latestItem = normaliseIntent(item.latest_intent)
  if (!latestThread || !latestItem) return 'skipped_label'
  const labels = [latestThread, latestItem]
  for (const m of replyMessages(thread)) { const n = normaliseIntent(m.intent); if (n) labels.push(n) }
  if (labels.some((l) => !include.has(l))) return 'skipped_label'
  if (thread.can_reply === false) return 'skipped_blocked'
  const created = Date.parse(row && row.created_at_account ? row.created_at_account : '')
  const delayMs = Math.max(0, Number(st.follow_up_delay_min) || 0) * 60000
  if (!Number.isFinite(created) || now.getTime() - created < delayMs) return 'wait'
  const reply = latestReply(thread)
  const replyTs = tsOf(reply)
  if (replyTs !== null && sentMessages(thread).some((m) => { const t = tsOf(m); return t !== null && t > replyTs })) return 'skipped_answered'
  return 'send'
}

function noteLine({ date, inviteeMasked, clientId, referral }) {
  return `[BrandGEO] Free account created ${date} for ${referral ? 'referred colleague ' : ''}${inviteeMasked}, client ${clientId}.`
}

function appendNote(existing, line) {
  const undated = (s) => s.replace(/\d{4}-\d{2}-\d{2}/, '').trim()
  const base = typeof existing === 'string' ? existing : ''
  const target = undated(line)
  if (base.split(/\r?\n/).some((l) => undated(l) === target)) return null
  return base.trim() ? `${base.replace(/\s+$/, '')}\n${line}` : line
}

module.exports = {
  FREE_PROMPT_COUNT, PERSON_ID_RE, DECLINE_RE, EXCLUDED_DOMAINS,
  normaliseIntent, isCandidate, replyMessages, latestReply, threadIntents, latestIntentOf,
  resolveReplier, stripQuoted, qualifyLead, extractReferral, isExcludedDomain, domainsMatch,
  brandDomainFor, cleanCompanyName, deriveBrand, resolveMarket, countryConflict, validatePrompts,
  excerpt, maskEmail, emailSha256, rulesHash, followUpDecision, noteLine, appendNote,
  isPlausibleDomain, normalizeDomain, emailDomainOf, slugify, titleCase, settingsSets,
  // rev 3
  OWN_SENDER_DEFAULTS, FOLLOW_UP_TERMINAL, isOwnDomain, ownDomainsFor, isDenseScript, brandTermMatches,
  followUpPreGate, followUpBodyValid, isDeclineLabel,
  // rev 4
  SUPPRESSING_REASONS, MAX_CONSECUTIVE_ATTEMPTS, MAX_TOTAL_ATTEMPTS, companyConflict, suppresses, isFinalFailure,
  ownSenderDomains, fold,
}
