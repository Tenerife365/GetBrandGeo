/**
 * explee_rules.test.js: the pure decisions of the Explee lead import
 * (docs/arch/explee-lead-import.md, revision 3, criteria 2 to 5; rev 3: 28,
 * 37, 38, 47 (pure parts), 48).
 * Run from brandgeo-dashboard/:  node tests/explee_rules.test.js
 *
 * No clock is read: every date below is a fixed literal. Fixtures use
 * example.com style addresses and invented companies only.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const R = require('../netlify/functions/_explee_rules')

let passes = 0
let failures = 0
function check(name, fn) {
  try { fn(); passes++; console.log(`  ok   ${name}`) } catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e && e.message}`) }
}

const SETTINGS = {
  include_intents: ['hot_lead'], referral_intents: ['out_of_office', 'email_changed'],
  exclude_intents: ['not_interested', 'unsubscribe'], unknown_label_policy: 'hold',
}
const OUR = 'outreach@brandgeo.example'

function item(over = {}) {
  return Object.assign({ erased: false, person_id: 'p1', campaign_id: 21, email: 'ana@acme.example', latest_intent: 'hot_lead', reply_count: 1, lead_status: null, latest_reply_at: '2026-11-01T10:00:00Z' }, over)
}
function reply(over = {}) {
  return Object.assign({ type: 'reply', from_email: 'ana@acme.example', to_email: OUR, cc: [], body_text: 'Yes, tell me more.', intent: 'hot_lead', ts: '2026-11-01T10:00:00Z' }, over)
}
function sent(over = {}) {
  return Object.assign({ type: 'sent', from_email: OUR, to_email: 'ana@acme.example', cc: [], body_text: 'Hello', intent: null, ts: '2026-10-30T10:00:00Z' }, over)
}
function thread(over = {}) {
  return Object.assign({
    erased: false, can_reply: true, reply_blocked_reason: null, latest_intent: 'hot_lead',
    messages: [sent(), reply()],
    lead: { erased: false, name: 'Ana Sample', email: 'enriched@acme.example', company_name: 'Acme Widgets Ltd', company_domain: 'acme.example', country: 'ES' },
  }, over)
}
const q = (i, t, s = SETTINGS) => R.qualifyLead({ item: i, thread: t }, s)

console.log('\n1. D3 table, in order')
check('rule 10: a hot lead replying from the listed address creates for that address', () => {
  const d = q(item(), thread())
  assert.deepStrictEqual(d, { action: 'create', invitee: 'ana@acme.example', inviteeSource: 'replier', intent: 'hot_lead' })
})
check('rule 1: an erased hot lead (listing) is skipped erased, final', () => {
  const d = q(item({ erased: true }), thread())
  assert.strictEqual(d.reason, 'erased'); assert.strictEqual(d.final, true)
})
check('rule 1: erased on the thread', () => assert.strictEqual(q(item(), thread({ erased: true })).reason, 'erased'))
check('rule 1: erased on the profile', () => {
  const t = thread(); t.lead.erased = true
  assert.strictEqual(q(item(), t).reason, 'erased')
})
check('rule 1 wins over rule 2', () => assert.strictEqual(q(item({ erased: true, latest_intent: 'not_interested' }), thread({ latest_intent: 'not_interested' })).reason, 'erased'))
check('rule 2: reply_blocked_reason unsubscribe declines', () => {
  const d = q(item(), thread({ reply_blocked_reason: 'unsubscribe' }))
  assert.strictEqual(d.reason, 'declined'); assert.strictEqual(d.final, true)
})
check('rule 2: unsubscribe label alone declines, with no other signal', () => {
  const d = q(item({ latest_intent: 'unsubscribe' }), thread({ latest_intent: 'unsubscribe', messages: [sent(), reply({ intent: 'unsubscribe' })] }))
  assert.strictEqual(d.reason, 'declined')
})
check('rule 2: an earlier unsubscribe excludes a later hot_lead', () => {
  const t = thread({ messages: [sent(), reply({ intent: 'unsubscribe', ts: '2026-10-31T10:00:00Z' }), reply()] })
  assert.strictEqual(q(item(), t).reason, 'declined')
})
check('rule 2: not_interested declines', () => assert.strictEqual(q(item({ latest_intent: 'not_interested' }), thread({ latest_intent: 'not_interested' })).reason, 'declined'))
check('rule 2 wins over rule 3', () => assert.strictEqual(q(item({ latest_intent: 'not_interested', lead_status: 'Lost' }), thread({ latest_intent: 'not_interested' })).reason, 'declined'))
check('rule 3: lead_status Lost is team_lost, final', () => {
  const d = q(item({ lead_status: 'Lost' }), thread())
  assert.strictEqual(d.reason, 'team_lost'); assert.strictEqual(d.final, true)
})
check('rule 3: lead_status unqualified, any case', () => assert.strictEqual(q(item({ lead_status: 'UNQUALIFIED' }), thread()).reason, 'team_lost'))
check('rule 3: lead_status Hot does not block', () => assert.strictEqual(q(item({ lead_status: 'Hot' }), thread()).action, 'create'))
check('rule 4: no reply-type message is no_reply, soft', () => {
  const d = q(item(), thread({ messages: [sent()] }))
  assert.strictEqual(d.reason, 'no_reply'); assert.strictEqual(d.final, false)
})
check('rule 5: lead null is profile_missing, soft', () => {
  const d = q(item(), thread({ lead: null }))
  assert.strictEqual(d.reason, 'profile_missing'); assert.strictEqual(d.final, false)
})
check('rule 6: out_of_office with no address is auto_reply_no_referral', () => {
  const d = q(item({ latest_intent: 'out_of_office' }), thread({ latest_intent: 'out_of_office', messages: [sent(), reply({ intent: 'out_of_office', body_text: 'I am away until Monday.' })] }))
  assert.strictEqual(d.reason, 'auto_reply_no_referral'); assert.strictEqual(d.final, false)
})
check('rule 6: out_of_office naming one colleague on the company domain creates a referral', () => {
  const d = q(item({ latest_intent: 'out_of_office' }), thread({ latest_intent: 'out_of_office', messages: [sent(), reply({ intent: 'out_of_office', body_text: 'Away. Please write to bo@acme.example instead.' })] }))
  assert.deepStrictEqual(d, { action: 'create', invitee: 'bo@acme.example', inviteeSource: 'referral', intent: 'out_of_office' })
})
check('rule 6: email_changed takes the referral path', () => {
  const d = q(item({ latest_intent: 'email_changed' }), thread({ latest_intent: 'email_changed', messages: [sent(), reply({ intent: 'email_changed', body_text: 'My new address is ana.new@acme.example.' })] }))
  assert.strictEqual(d.inviteeSource, 'referral'); assert.strictEqual(d.invitee, 'ana.new@acme.example')
})
check('rule 6: label normalisation, "Out Of Office" and "email-changed"', () => {
  assert.strictEqual(R.normaliseIntent('Out Of Office'), 'out_of_office')
  assert.strictEqual(R.normaliseIntent('email-changed'), 'email_changed')
})
check('rule 7: an unknown label is held as unknown_intent with the label', () => {
  const d = q(item({ latest_intent: 'meeting_request' }), thread({ latest_intent: 'meeting_request', messages: [sent(), reply({ intent: 'meeting_request' })] }))
  assert.strictEqual(d.reason, 'unknown_intent'); assert.strictEqual(d.label, 'meeting_request'); assert.strictEqual(d.held, true)
})
check('rule 7: a null label is held as (none)', () => {
  const d = q(item({ latest_intent: null }), thread({ latest_intent: null, messages: [sent(), reply({ intent: null })] }))
  assert.strictEqual(d.reason, 'unknown_intent'); assert.strictEqual(d.label, '(none)')
})
check('rule 7, include policy: an unknown label passes to create', () => {
  const d = q(item({ latest_intent: 'meeting_request' }), thread({ latest_intent: 'meeting_request', messages: [sent(), reply({ intent: 'meeting_request' })] }), Object.assign({}, SETTINGS, { unknown_label_policy: 'include' }))
  assert.strictEqual(d.action, 'create')
})
check('rule 7, include policy: a decline is still declined (rule 2 first)', () => {
  const d = q(item({ latest_intent: 'remove_me' }), thread({ latest_intent: 'remove_me', messages: [sent(), reply({ intent: 'remove_me' })] }), Object.assign({}, SETTINGS, { unknown_label_policy: 'include' }))
  assert.strictEqual(d.reason, 'declined')
})
check('rule 8: an empty reply on a non-hot label is empty_reply', () => {
  const s = Object.assign({}, SETTINGS, { unknown_label_policy: 'include' })
  const d = q(item({ latest_intent: 'neutral' }), thread({ latest_intent: 'neutral', messages: [sent(), reply({ intent: 'neutral', body_text: '   ' })] }), s)
  assert.strictEqual(d.reason, 'empty_reply')
})
check('rule 8: an empty reply on hot_lead still creates', () => {
  const d = q(item(), thread({ messages: [sent(), reply({ body_text: '' })] }))
  assert.strictEqual(d.action, 'create')
})
check('rule 9: listing email null with an include label is replied_by_other', () => {
  const d = q(item({ email: null }), thread())
  assert.strictEqual(d.reason, 'replied_by_other'); assert.strictEqual(d.held, true); assert.strictEqual(d.final, false)
})
check('rule 9: listing email matching no reply message is replied_by_other', () => {
  const d = q(item({ email: 'someone.else@acme.example' }), thread())
  assert.strictEqual(d.reason, 'replied_by_other')
})
check('rule 9: LeadProfile.email is never the invitee', () => {
  const t = thread(); t.lead.email = 'ana@acme.example'
  const d = q(item({ email: null }), t)
  assert.strictEqual(d.action, 'skip')
})
check('rule 9: replier match is case insensitive', () => {
  const d = q(item({ email: 'ANA@Acme.Example' }), thread())
  assert.strictEqual(d.invitee, 'ana@acme.example')
})
check('criterion 4: null listing email on email_changed with one company address in the body creates for it', () => {
  const d = q(item({ email: null, latest_intent: 'email_changed' }), thread({ latest_intent: 'email_changed', messages: [sent(), reply({ from_email: 'ana@acme.example', intent: 'email_changed', body_text: 'I moved. Reach me at ana@new.acme.example.' })] }))
  assert.strictEqual(d.action, 'create'); assert.strictEqual(d.invitee, 'ana@new.acme.example'); assert.strictEqual(d.inviteeSource, 'referral')
})

console.log('\n2. decline pattern')
for (const label of ['Not Interested', 'not-interested', 'unsubscribed', 'remove_me', 'do_not_contact', 'opt-out', 'bounce', 'spam_complaint', 'declined']) {
  check(`"${label}" declines`, () => assert.ok(R.DECLINE_RE.test(R.normaliseIntent(label))))
}
for (const label of ['interested', 'hot_lead', 'out_of_office', 'email_changed', 'meeting_request']) {
  check(`"${label}" does not match the decline pattern`, () => assert.ok(!R.DECLINE_RE.test(R.normaliseIntent(label))))
}

console.log('\n3. reply_count has no effect')
for (const rc of [0, 1, 5, null]) {
  check(`reply_count ${rc} gives the same decisions`, () => {
    assert.deepStrictEqual(q(item({ reply_count: rc }), thread()), q(item(), thread()))
    const ooo = (x) => q(item({ reply_count: x, latest_intent: 'out_of_office' }), thread({ latest_intent: 'out_of_office', messages: [sent(), reply({ intent: 'out_of_office', body_text: 'Away.' })] }))
    assert.deepStrictEqual(ooo(rc), ooo(1))
  })
}
check('isCandidate: a label or a positive reply_count', () => {
  assert.ok(R.isCandidate({ latest_intent: 'x', reply_count: 0 }))
  assert.ok(R.isCandidate({ latest_intent: null, reply_count: 2 }))
  assert.ok(!R.isCandidate({ latest_intent: null, reply_count: 0 }))
})

console.log('\n4. live label set (hot_lead, not_interested, unsubscribe, email_changed, out_of_office)')
check('the five live labels map to create, declined, declined, referral, referral', () => {
  const mk = (lab, body) => q(item({ latest_intent: lab }), thread({ latest_intent: lab, messages: [sent(), reply({ intent: lab, body_text: body || 'ok' })] }))
  assert.strictEqual(mk('hot_lead').action, 'create')
  assert.strictEqual(mk('not_interested').reason, 'declined')
  assert.strictEqual(mk('unsubscribe').reason, 'declined')
  assert.strictEqual(mk('email_changed', 'New: ana2@acme.example').inviteeSource, 'referral')
  assert.strictEqual(mk('out_of_office', 'Contact bo@acme.example').inviteeSource, 'referral')
})

console.log('\n5. referral extraction (adversarial)')
const ctx = { replierEmail: 'ana@acme.example', replyFromEmails: ['ana@acme.example'], ourAddresses: [OUR], allowedDomains: ['acme.example'] }
const ADVERSARIAL = [
  ['plain', 'Write to bo@acme.example please.', 'bo@acme.example'],
  ['mailto link', 'Contact <a href="mailto:bo@acme.example">Bo</a>', 'bo@acme.example'],
  ['plus addressing', 'Use bo+sales@acme.example', 'bo+sales@acme.example'],
  ['subdomain of the company', 'Use bo@eu.acme.example', 'bo@eu.acme.example'],
  ['quoted history removed', 'Use bo@acme.example\n> earlier: cy@acme.example', 'bo@acme.example'],
  ['On ... wrote: removed', 'Use bo@acme.example\nOn Mon, someone wrote:\ncy@acme.example', 'bo@acme.example'],
  ['From: block removed', 'Use bo@acme.example\nFrom: cy@acme.example', 'bo@acme.example'],
  ['signature with the replier only', 'Please write to bo@acme.example\n--\nana@acme.example', 'bo@acme.example'],
  ['another domain', 'Write to bo@other.example', null],
  ['two addresses', 'Write to bo@acme.example or cy@acme.example', null],
  ['four addresses', 'a1@acme.example a2@acme.example a3@acme.example a4@acme.example', null],
  ['free mail (wildcard entry gmx.*)', 'Write to bo@gmx.example', null],
  ['our own mailbox', `Write to ${OUR}`, null],
  ['noreply local part', 'Write to noreply@acme.example', null],
  ['mailer-daemon', 'mailer-daemon@acme.example', null],
  ['cyrillic lookalike in the local part', 'Write to bо@acme.example', null],
  ['cyrillic lookalike in the domain', 'Write to bo@аcme.example', null],
  ['lookalike domain suffix', 'Write to bo@acme.example.evil.example', null],
  ['address inside a longer token', 'xbo@acme.examplex', null],
  ['no address', 'I am away.', null],
  ['only the replier', 'I am ana@acme.example', null],
  ['upper case, lowered', 'Write to Bo@ACME.example', 'bo@acme.example'],
]
for (const [name, body, want] of ADVERSARIAL) {
  check(`referral: ${name}`, () => {
    const got = R.extractReferral(body, ctx)
    assert.strictEqual(got, want)
    if (got) assert.ok(body.toLowerCase().includes(got), 'result must be a literal substring of the lowercased input')
  })
}
check('referral: every result over a generated batch is a substring of the input', () => {
  const pieces = ['bo@acme.example', 'mailto:', '>', 'cy@acme.example', 'x', 'о', '+tag', '@', '.', ' ', '\n', 'acme.example', 'On a, b wrote:', 'z@sub.acme.example']
  let seed = 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
  for (let i = 0; i < 400; i++) {
    let s = ''
    const n = 1 + Math.floor(rnd() * 8)
    for (let j = 0; j < n; j++) s += pieces[Math.floor(rnd() * pieces.length)]
    const got = R.extractReferral(s, ctx)
    if (got !== null) assert.ok(s.toLowerCase().includes(got), `not a substring: ${JSON.stringify(s)}`)
  }
})
check('referral: unknown replier allows only the brand domain', () => {
  assert.strictEqual(R.extractReferral('Use bo@acme.example', { replierEmail: null, replyFromEmails: [], ourAddresses: [], allowedDomains: ['acme.example'] }), 'bo@acme.example')
  assert.strictEqual(R.extractReferral('Use bo@acme.example', { replierEmail: null, replyFromEmails: [], ourAddresses: [], allowedDomains: [] }), null)
})
check('referral: a candidate on an excluded domain returns null even when allowed', () => {
  assert.strictEqual(R.extractReferral('Use bo@yahoo.example', { allowedDomains: ['yahoo.example'] }), null)
})
check('referral: non-string input is null', () => assert.strictEqual(R.extractReferral(null, ctx), null))

console.log('\n6. domains (criterion 3)')
check('free mail and platform domains are excluded, with wildcards and subdomains', () => {
  for (const d of ['gmail.com', 'hotmail.co.uk', 'yahoo.fr', 'gmx.de', 'shop.wixsite.com', 'acme.github.io', 'sites.google.com', 'linkedin.com']) assert.ok(R.isExcludedDomain(d), d)
  for (const d of ['acme.example', 'hotmailer.example', 'mygmail.example']) assert.ok(!R.isExcludedDomain(d), d)
})
check('brand domain is the profile domain when usable, even when the email domain differs', () => {
  assert.strictEqual(R.brandDomainFor('acme.example', 'ana@acme-group.example'), 'acme.example')
  assert.strictEqual(R.brandDomainFor('https://www.Acme.example/about', 'ana@x.example'), 'acme.example')
})
check('a free-mail or platform company_domain falls back to the email domain', () => {
  assert.strictEqual(R.brandDomainFor('gmail.com', 'ana@acme.example'), 'acme.example')
  assert.strictEqual(R.brandDomainFor('acme.wixsite.com', 'ana@acme.example'), 'acme.example')
})
check('both excluded gives null (no_company_domain)', () => {
  assert.strictEqual(R.brandDomainFor('gmail.com', 'ana@hotmail.example'), null)
  assert.strictEqual(R.brandDomainFor(null, 'ana@outlook.example'), null)
})
check('domainsMatch: equal and subdomain in both directions', () => {
  assert.ok(R.domainsMatch('acme.example', 'acme.example'))
  assert.ok(R.domainsMatch('eu.acme.example', 'acme.example'))
  assert.ok(R.domainsMatch('acme.example', 'eu.acme.example'))
  assert.ok(!R.domainsMatch('notacme.example', 'acme.example'))
  assert.ok(!R.domainsMatch('', 'acme.example'))
})
check('normalizeDomain and isPlausibleDomain mirror _prospect_guard.js for plain inputs', () => {
  const G = require('../netlify/functions/_prospect_guard')
  for (const d of ['Acme.example', 'www.acme.example', 'https://acme.example/x']) assert.strictEqual(R.normalizeDomain(d), G.normalizeDomain(d))
  for (const d of ['acme.example', 'bad', 'a..b']) assert.strictEqual(R.isPlausibleDomain(d), G.isPlausibleDomain(d))
})

console.log('\n7. brand, market')
check('cleanCompanyName strips one trailing legal form and cuts to 80', () => {
  assert.strictEqual(R.cleanCompanyName('Acme Widgets Ltd'), 'Acme Widgets')
  assert.strictEqual(R.cleanCompanyName('Sample Foods, S.L.'), 'Sample Foods')
  assert.strictEqual(R.cleanCompanyName('Nordic Tools Oy'), 'Nordic Tools')
  assert.strictEqual(R.cleanCompanyName('Casa'), 'Casa')
  assert.strictEqual(R.cleanCompanyName('n/a'), null)
  assert.strictEqual(R.cleanCompanyName('x'.repeat(100)).length, 80)
})
check('deriveBrand: company name first, aliases deduplicated, at most 6, none shorter than 3', () => {
  const b = R.deriveBrand({ brandDomain: 'acme-widgets.example', companyName: 'Acme Widgets GmbH', llmBrandName: 'AcmeW', ogSiteName: null })
  assert.strictEqual(b.brandName, 'Acme Widgets')
  assert.strictEqual(b.website, 'acme-widgets.example')
  assert.ok(b.aliases.length <= 6 && b.aliases.every((a) => a.length >= 3))
  assert.strictEqual(new Set(b.aliases.map((a) => a.toLowerCase())).size, b.aliases.length)
  assert.ok(b.aliases.includes('AcmeW'))
})
check('deriveBrand: falls back to the domain root, title-cased', () => {
  assert.strictEqual(R.deriveBrand({ brandDomain: 'blue-river.example', companyName: null, llmBrandName: null, ogSiteName: 'Widgets | Shop | Blog' }).brandName, 'Blue River')
  assert.strictEqual(R.deriveBrand({ brandDomain: 'blue-river.example', companyName: null, llmBrandName: null, ogSiteName: 'Blue Rivr' }).brandName, 'Blue Rivr')
})
const MARKETS = [{ id: 'WW', regions: [{ id: 'ALL' }] }, { id: 'ES', regions: [{ id: 'ALL' }, { id: 'MAD' }] }, { id: 'GB', regions: [{ id: 'ALL' }] }]
check('resolveMarket: known country, UK alias, unknown, junk', () => {
  assert.deepStrictEqual(R.resolveMarket('es', MARKETS), { marketId: 'ES', regionId: 'ALL', country: 'ES' })
  assert.deepStrictEqual(R.resolveMarket('UK', MARKETS), { marketId: 'GB', regionId: 'ALL', country: 'GB' })
  assert.deepStrictEqual(R.resolveMarket('FR', MARKETS), { marketId: 'WW', regionId: null, country: 'FR' })
  assert.deepStrictEqual(R.resolveMarket('Spain', MARKETS), { marketId: 'WW', regionId: null, country: null })
})
check('countryConflict: a different ccTLD conflicts, generic ones do not', () => {
  assert.strictEqual(R.countryConflict('acme.de', 'ES'), true)
  assert.strictEqual(R.countryConflict('acme.es', 'ES'), false)
  assert.strictEqual(R.countryConflict('acme.io', 'ES'), false)
  assert.strictEqual(R.countryConflict('acme.co.uk', 'GB'), false)
  assert.strictEqual(R.countryConflict('acme.de', 'WW'), false)
})

console.log('\n8. validatePrompts (criterion 5)')
const terms = { brandTerms: ['Acme', 'Café Lumière', 'acme-widgets'], count: 5 }
const good = [
  'best project management tools for small agencies',
  'which accounting software do freelancers in Madrid recommend',
  'top rated suppliers of industrial widgets in Spain',
  'how do I choose a reliable widget manufacturer for prototypes',
  'affordable alternatives for bulk widget orders in Europe',
  'which companies make durable widgets for outdoor use',
  'recommended widget wholesalers with fast delivery',
  'where can a startup buy custom widgets at low volume',
]
check('5 kept from 8', () => {
  const v = R.validatePrompts(good, terms)
  assert.strictEqual(v.ok, true); assert.strictEqual(v.prompts.length, 5); assert.deepStrictEqual(v.prompts, good.slice(0, 5))
})
check('4 valid gives ok:false', () => {
  const v = R.validatePrompts(good.slice(0, 4), terms)
  assert.strictEqual(v.ok, false)
})
check('brand term with diacritics is rejected (folded)', () => {
  const v = R.validatePrompts(['is cafe lumiere a good bakery chain in Lyon'], terms)
  assert.strictEqual(v.rejected[0].rule, 'brand_term')
})
check('whole-word match: a brand term inside a longer word does not reject', () => {
  const v = R.validatePrompts(['best acmes and other widget makers in Spain'], terms)
  assert.strictEqual(v.rejected.length, 0)
  const w = R.validatePrompts(['is Acme a good widget maker in Spain'], terms)
  assert.strictEqual(w.rejected[0].rule, 'brand_term')
})
check('URL rejected', () => assert.strictEqual(R.validatePrompts(['compare widget makers on https://x.example today'], terms).rejected[0].rule, 'url'))
check('at sign rejected', () => assert.strictEqual(R.validatePrompts(['ask sales at sales@x.example about widgets'], terms).rejected[0].rule.length > 0, true))
check('braces rejected', () => assert.strictEqual(R.validatePrompts(['best widget makers in {city} for startups'], terms).rejected[0].rule, 'brackets'))
check('line break rejected', () => assert.strictEqual(R.validatePrompts(['best widget makers\nin Spain for startups'], terms).rejected[0].rule, 'line_break'))
check('too short rejected', () => assert.strictEqual(R.validatePrompts(['best widgets'], terms).rejected[0].rule, 'length'))
check('duplicate after folding rejected', () => {
  const v = R.validatePrompts(['Best widget makers in Spain for startups', 'best  widget makers in spain for startups?'], terms)
  assert.strictEqual(v.rejected[0].rule, 'duplicate')
})
check('fallback template rejected', () => assert.strictEqual(R.validatePrompts(['best companies like blue river widgets'], terms).rejected[0].rule, 'fallback_template'))
check('one valid Japanese, Chinese and Thai prompt each', () => {
  const v = R.validatePrompts(['東京でおすすめの会計ソフトは', '上海最好的会计软件公司', 'ซอฟต์แวร์บัญชีที่ดีที่สุดในกรุงเทพ'], { brandTerms: ['Acme'], count: 3 })
  assert.strictEqual(v.ok, true, JSON.stringify(v.rejected))
})
check('a CJK prompt shorter than 6 characters is rejected', () => assert.strictEqual(R.validatePrompts(['会计软件'], { brandTerms: [], count: 1 }).ok, false))
check('the Free count equals PLAN_PROMPTS.free in planConfig.ts', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'planConfig.ts'), 'utf8')
  const m = src.match(/PLAN_PROMPTS: Record<Plan, number> = \{\s*free:\s*(\d+)/)
  assert.ok(m, 'PLAN_PROMPTS.free not found')
  assert.strictEqual(Number(m[1]), R.FREE_PROMPT_COUNT)
})

console.log('\n9. storage helpers')
check('maskEmail', () => {
  assert.strictEqual(R.maskEmail('Ana@Acme.example'), 'a***@acme.example')
  assert.strictEqual(R.maskEmail('nope'), '***')
})
check('excerpt masks addresses except the kept one, masks phone numbers, max 280', () => {
  const e = R.excerpt('Call me on +34 600 12 34 56 or write ana@acme.example or bo@acme.example. ' + 'x'.repeat(400), 'bo@acme.example')
  assert.ok(!e.includes('600 12'), e)
  assert.ok(e.includes('[number]'))
  assert.ok(e.includes('a***@acme.example'))
  assert.ok(e.includes('bo@acme.example'))
  assert.ok(Array.from(e).length <= 280)
})
check('excerpt drops quoted history', () => assert.ok(!R.excerpt('Hi\n> old text with cy@acme.example', null).includes('old text')))
check('emailSha256 is stable and case insensitive', () => {
  assert.strictEqual(R.emailSha256('Ana@Acme.example'), R.emailSha256(' ana@acme.example '))
  assert.strictEqual(R.emailSha256('a@b.example').length, 64)
})
check('rulesHash changes with a list and ignores order and case', () => {
  const h1 = R.rulesHash(SETTINGS)
  assert.strictEqual(h1, R.rulesHash(Object.assign({}, SETTINGS, { exclude_intents: ['Unsubscribe', 'not_interested'] })))
  assert.notStrictEqual(h1, R.rulesHash(Object.assign({}, SETTINGS, { include_intents: ['hot_lead', 'meeting'] })))
  assert.notStrictEqual(h1, R.rulesHash(Object.assign({}, SETTINGS, { unknown_label_policy: 'include' })))
})
check('noteLine and appendNote (no duplicate, dated lines compared without the date)', () => {
  const line = R.noteLine({ date: '2026-11-11', inviteeMasked: 'a***@acme.example', clientId: 7, referral: false })
  assert.strictEqual(line, '[BrandGEO] Free account created 2026-11-11 for a***@acme.example, client 7.')
  assert.strictEqual(R.appendNote(null, line), line)
  assert.strictEqual(R.appendNote('Team note', line), `Team note\n${line}`)
  assert.strictEqual(R.appendNote(`Team note\n${line}`, line), null)
  const later = R.noteLine({ date: '2026-11-12', inviteeMasked: 'a***@acme.example', clientId: 7, referral: false })
  assert.strictEqual(R.appendNote(`Team note\n${line}`, later), null)
  assert.ok(R.noteLine({ date: 'd', inviteeMasked: 'm', clientId: 1, referral: true }).includes('referred colleague'))
})

console.log('\n10. follow-up decision')
// rev 4, V4: followUpDecision reads include_intents (the importer always passes the settings row).
const FU = { follow_up_enabled: true, follow_up_body: 'Hi {first_name}', follow_up_delay_min: 60, follow_up_max_age_hours: 72, exclude_intents: ['not_interested', 'unsubscribe'], include_intents: ['hot_lead'] }
const created = { invitee_source: 'replier', created_at_account: '2026-11-10T10:00:00Z', follow_up_status: null, follow_up_attempts: 0 }
const fu = (over) => R.followUpDecision(Object.assign({ row: created, thread: thread(), item: item(), listingComplete: true, settings: FU }, over))
check('off when disabled or no body', () => {
  assert.strictEqual(fu({ now: new Date('2026-11-10T12:00:00Z'), settings: Object.assign({}, FU, { follow_up_enabled: false }) }), 'off')
  assert.strictEqual(fu({ now: new Date('2026-11-10T12:00:00Z'), settings: Object.assign({}, FU, { follow_up_body: null }) }), 'off')
})
check('wait before the delay, send after it', () => {
  assert.strictEqual(fu({ now: new Date('2026-11-10T10:30:00Z') }), 'wait')
  assert.strictEqual(fu({ now: new Date('2026-11-10T11:00:00Z') }), 'send')
})
check('referral, blocked, answered', () => {
  const n = new Date('2026-11-10T12:00:00Z')
  assert.strictEqual(fu({ row: Object.assign({}, created, { invitee_source: 'referral' }), now: n }), 'skipped_referral')
  assert.strictEqual(fu({ thread: thread({ can_reply: false }), now: n }), 'skipped_blocked')
  assert.strictEqual(fu({ thread: thread({ messages: [reply(), sent({ ts: '2026-11-02T10:00:00Z' })] }), now: n }), 'skipped_answered')
})
check('rev 3: an item absent from the listing, or an incomplete listing, gives wait (no send this run)', () => {
  const n = new Date('2026-11-10T12:00:00Z')
  assert.strictEqual(fu({ item: null, now: n }), 'wait')
  assert.strictEqual(fu({ listingComplete: false, now: n }), 'wait')
})

console.log('\n11. revision 3: F2, the follow-up never goes to a lead who declined (criterion 28)')
{
  // Created 10:00 from a hot_lead reply; at 10:30 the lead replies not_interested
  // (can_reply stays true); the run is at 11:05, the delay 60 minutes.
  const createdRow = { invitee_source: 'replier', created_at_account: '2026-11-10T10:00:00Z', follow_up_status: null, follow_up_attempts: 0 }
  const at = new Date('2026-11-10T11:05:00Z')
  const declinedThread = (label, extra = {}) => thread(Object.assign({
    latest_intent: label,
    messages: [sent(), reply({ ts: '2026-11-10T09:50:00Z' }), reply({ intent: label, body_text: 'Actually, no thanks.', ts: '2026-11-10T10:30:00Z' })],
  }, extra))
  check('a not_interested reply 30 minutes after creation gives skipped_declined (was send)', () => {
    assert.strictEqual(R.followUpDecision({ row: createdRow, thread: declinedThread('not_interested'), item: item({ latest_intent: 'not_interested' }), listingComplete: true, now: at, settings: FU }), 'skipped_declined')
  })
  check('the same with remove_me (decline pattern, not in the exclude list)', () => {
    assert.strictEqual(R.followUpDecision({ row: createdRow, thread: declinedThread('remove_me'), item: item({ latest_intent: 'remove_me' }), listingComplete: true, now: at, settings: FU }), 'skipped_declined')
  })
  check("reply_blocked_reason 'unsubscribe' gives skipped_declined", () => {
    assert.strictEqual(R.followUpDecision({ row: createdRow, thread: thread({ reply_blocked_reason: 'unsubscribe' }), item: item(), listingComplete: true, now: at, settings: FU }), 'skipped_declined')
  })
  check("the listing item's lead_status Lost gives skipped_declined", () => {
    assert.strictEqual(R.followUpDecision({ row: createdRow, thread: thread(), item: item({ lead_status: 'Lost' }), listingComplete: true, now: at, settings: FU }), 'skipped_declined')
    assert.strictEqual(R.followUpDecision({ row: createdRow, thread: thread(), item: item({ lead_status: 'unqualified' }), listingComplete: true, now: at, settings: FU }), 'skipped_declined')
  })
}

console.log('\n12. revision 3: follow-up gates before any read (L3, L4) and the body rule (A2, criterion 47)')
check('followUpPreGate: terminal statuses, gave_up at 3 failures, skipped_expired past the maximum age', () => {
  const n = new Date('2026-11-10T12:00:00Z')
  const st = { follow_up_max_age_hours: 72 }
  for (const s of ['sent', 'skipped_answered', 'skipped_referral', 'skipped_blocked', 'skipped_declined', 'skipped_expired', 'gave_up']) {
    assert.strictEqual(R.followUpPreGate({ row: Object.assign({}, created, { follow_up_status: s }), now: n, settings: st }), 'terminal', s)
  }
  assert.strictEqual(R.followUpPreGate({ row: Object.assign({}, created, { follow_up_status: 'failed', follow_up_attempts: 3 }), now: n, settings: st }), 'gave_up')
  assert.strictEqual(R.followUpPreGate({ row: Object.assign({}, created, { follow_up_status: 'failed', follow_up_attempts: 2 }), now: n, settings: st }), 'proceed')
  assert.strictEqual(R.followUpPreGate({ row: Object.assign({}, created, { created_at_account: '2026-11-06T07:59:00Z' }), now: n, settings: st }), 'skipped_expired', '100 hours old')
  assert.strictEqual(R.followUpPreGate({ row: Object.assign({}, created, { created_at_account: '2026-11-07T12:00:00Z' }), now: n, settings: st }), 'proceed', 'exactly 72 hours')
})
check('followUpDecision answers gave_up and skipped_expired from the gate, and off for a terminal status', () => {
  const n = new Date('2026-11-10T12:00:00Z')
  assert.strictEqual(fu({ row: Object.assign({}, created, { follow_up_status: 'failed', follow_up_attempts: 3 }), now: n }), 'gave_up')
  assert.strictEqual(fu({ row: Object.assign({}, created, { created_at_account: '2026-11-01T00:00:00Z' }), now: n }), 'skipped_expired')
  assert.strictEqual(fu({ row: Object.assign({}, created, { follow_up_status: 'skipped_declined' }), now: n }), 'off')
})
check('followUpBodyValid: only {brand} and {first_name}, no %', () => {
  assert.strictEqual(R.followUpBodyValid('Hi {first_name}, your score is {score}.'), false)
  assert.strictEqual(R.followUpBodyValid('Hi {first_name}, {mentions} mentions so far.'), false)
  assert.strictEqual(R.followUpBodyValid('Hi {first_name}, you are seen in 40% of answers.'), false)
  assert.strictEqual(R.followUpBodyValid('Hi {first_name} {unclosed'), false)
  assert.strictEqual(R.followUpBodyValid('Hi {first_name}, a free BrandGEO account was set up for {brand}. It holds 5 prompts.'), true)
  assert.strictEqual(R.followUpBodyValid(null), false)
  assert.strictEqual(fu({ now: new Date('2026-11-10T12:00:00Z'), settings: Object.assign({}, FU, { follow_up_body: 'Your score is {score}' }) }), 'off')
})

console.log('\n13. revision 3: A3, the invitee is never on one of our sending domains (criterion 48)')
{
  const A3 = Object.assign({}, SETTINGS, { own_sender_domains: ['getbrandgeo.com', 'trybrandgeo.com'] })
  check('a hot_lead replier on a subdomain of trybrandgeo.com: skip own_sender_domain, soft, held', () => {
    const t = thread({ messages: [sent(), reply({ from_email: 'ana@mail.trybrandgeo.com' })] })
    const d = q(item({ email: 'ana@mail.trybrandgeo.com' }), t, A3)
    assert.strictEqual(d.action, 'skip'); assert.strictEqual(d.reason, 'own_sender_domain'); assert.strictEqual(d.final, false); assert.strictEqual(d.held, true)
  })
  check('a hot_lead replier on the domain our sent messages came from (a persona not in the setting): own_sender_domain', () => {
    const t = thread({ messages: [sent({ from_email: 'team@persona.example' }), reply({ from_email: 'ana@persona.example' })] })
    assert.strictEqual(q(item({ email: 'ana@persona.example' }), t, A3).reason, 'own_sender_domain')
  })
  check('an email_changed reply naming only bob@persona.example in that thread never creates', () => {
    const t = thread({ latest_intent: 'email_changed', messages: [sent({ from_email: 'team@persona.example' }), reply({ from_email: 'ana@persona.example', intent: 'email_changed', body_text: 'Please write to bob@persona.example from now on.' })] })
    const d = q(item({ email: 'ana@persona.example', latest_intent: 'email_changed' }), t, A3)
    assert.strictEqual(d.action, 'skip')
    assert.ok(['own_sender_domain', 'auto_reply_no_referral'].includes(d.reason), d.reason)
  })
  check('a company_domain under one of our domains is own_sender_domain too', () => {
    const t = thread({ messages: [sent(), reply()] }); t.lead.company_domain = 'shop.getbrandgeo.com'
    assert.strictEqual(q(item(), t, A3).reason, 'own_sender_domain')
  })
  check('a replier at acme.example with our sent messages from sales@getbrandgeo.com creates normally', () => {
    const t = thread({ messages: [sent({ from_email: 'sales@getbrandgeo.com' }), reply()] })
    assert.deepStrictEqual(q(item(), t, A3), { action: 'create', invitee: 'ana@acme.example', inviteeSource: 'replier', intent: 'hot_lead' })
  })
  check('the guard applies with the default list when the setting is absent', () => {
    const t = thread({ messages: [sent(), reply({ from_email: 'ana@getbrandgeo.com' })] })
    assert.strictEqual(q(item({ email: 'ana@getbrandgeo.com' }), t, SETTINGS).reason, 'own_sender_domain')
  })
  check('isOwnDomain: equal and under; a bare label or a look-alike is never own', () => {
    assert.ok(R.isOwnDomain('mail.trybrandgeo.com', ['trybrandgeo.com']))
    assert.ok(R.isOwnDomain('trybrandgeo.com', ['trybrandgeo.com']))
    assert.ok(!R.isOwnDomain('com', ['trybrandgeo.com']))
    assert.ok(!R.isOwnDomain('nottrybrandgeo.com', ['trybrandgeo.com']))
  })
  check('rulesHash changes when own_sender_domains changes', () => {
    assert.notStrictEqual(R.rulesHash(A3), R.rulesHash(Object.assign({}, A3, { own_sender_domains: ['getbrandgeo.com', 'trybrandgeo.com', 'persona.example'] })))
    assert.strictEqual(R.rulesHash(A3), R.rulesHash(Object.assign({}, A3, { own_sender_domains: ['TRYBRANDGEO.com', 'getbrandgeo.com'] })))
  })
}

console.log('\n14. revision 3: M4 and L1, dense scripts (criteria 37 and 38)')
{
  const brand = { brandTerms: ['acme'], count: 1 }
  check('the brand inside Japanese text is rejected brand_term (was kept)', () => {
    const v = R.validatePrompts(['東京でacmeのような会計ソフトは'], brand)
    assert.strictEqual(v.ok, false); assert.strictEqual(v.rejected[0].rule, 'brand_term')
  })
  check('the brand between Thai characters is rejected brand_term', () => {
    const v = R.validatePrompts(['ซอฟต์แวร์acmeบัญชีที่ดีที่สุด'], brand)
    assert.strictEqual(v.rejected[0].rule, 'brand_term')
  })
  check('the brand followed by a Hangul particle is rejected brand_term', () => {
    const v = R.validatePrompts(['서울에서 acme는 좋은 회계 프로그램인가요'], brand)
    assert.strictEqual(v.rejected[0].rule, 'brand_term')
  })
  check('a Latin term inside a Latin word still needs a word boundary (kept)', () => {
    assert.strictEqual(R.validatePrompts(['Is acmesoft a good tool for small shops?'], brand).ok, true)
    assert.strictEqual(R.validatePrompts(['東京でacmesoftのような会計ソフトは'], brand).ok, true)
  })
  check('brandTermMatches and isDenseScript', () => {
    assert.ok(R.brandTermMatches('東京でacmeの', 'Acme'))
    assert.ok(!R.brandTermMatches('acmesoft tools', 'acme'))
    assert.ok(R.isDenseScript('회계')); assert.ok(R.isDenseScript('会計')); assert.ok(!R.isDenseScript('accounting'))
  })
  check('a Korean prompt of 4 words is kept under the dense rule (was rejected length)', () => {
    const v = R.validatePrompts(['서울 회계사 추천해 주세요'], { brandTerms: [], count: 1 })
    assert.strictEqual(v.ok, true, JSON.stringify(v.rejected))
  })
  check('a 5-character Hangul prompt is rejected length', () => {
    const v = R.validatePrompts(['회계사추천'], { brandTerms: [], count: 1 })
    assert.strictEqual(v.ok, false); assert.strictEqual(v.rejected[0].rule, 'length')
  })
}

console.log('\n15. revision 3: D5 alias cap')
check('deriveBrand caps the importer alias list at 5 (the helper adds the name, at most 6 stored)', () => {
  const b = R.deriveBrand({ brandDomain: 'acme-widgets-group.example', companyName: 'Acme Widgets Group International', llmBrandName: 'AWG Global', ogSiteName: null })
  assert.ok(b.aliases.length <= 5, String(b.aliases.length))
})

console.log('\n16. revision 4: V2, V3 and N3 pure helpers (criteria 51, 52, 57)')
check('suppresses(): a row with only invite_sent_at set, and a final half_made row, suppress the address', () => {
  assert.strictEqual(typeof R.suppresses, 'function', 'suppresses is a pure export of _explee_rules.js')
  const base = { decision: 'failed', reason: 'explee_error', final: false, erased_at: null, undone_at: null, invite_sent_at: null }
  assert.strictEqual(R.suppresses(base), false)
  assert.strictEqual(R.suppresses(Object.assign({}, base, { invite_sent_at: '2026-11-11T05:00:00Z' })), true)
  assert.strictEqual(R.suppresses(Object.assign({}, base, { reason: 'half_made', final: true })), true)
  assert.strictEqual(R.suppresses(Object.assign({}, base, { decision: 'skipped', reason: 'already_customer', final: true, invite_sent_at: '2026-11-11T05:00:00Z' })), true)
  for (const d of ['creating', 'created']) assert.strictEqual(R.suppresses(Object.assign({}, base, { decision: d })), true)
  for (const why of ['erased', 'hidden', 'provision_error']) assert.strictEqual(R.suppresses(Object.assign({}, base, { reason: why, final: true })), true, why)
})
check("companyConflict: the other row's email_domain counts; excluded domains are dropped on both sides", () => {
  assert.strictEqual(typeof R.companyConflict, 'function', 'companyConflict is a pure export of _explee_rules.js')
  assert.strictEqual(R.companyConflict(['acme.example', null], ['other.example', 'sales.acme.example']), true)
  assert.strictEqual(R.companyConflict(['acme.example', 'gmail.com'], ['other.example', 'gmail.com']), false)
  assert.strictEqual(R.companyConflict(['shop.acme.example'], ['acme.example', null]), true)
  assert.strictEqual(R.companyConflict(['acme.example'], ['acmeother.example']), false)
  assert.strictEqual(R.companyConflict([null], [null, undefined]), false)
})
check('isFinalFailure: 3 consecutive or 10 in total, or forced', () => {
  assert.strictEqual(R.MAX_TOTAL_ATTEMPTS, 10)
  assert.strictEqual(R.isFinalFailure({ attempts: 1, attempts_total: 9, forced: false }), false)
  assert.strictEqual(R.isFinalFailure({ attempts: 1, attempts_total: 10, forced: false }), true)
  assert.strictEqual(R.isFinalFailure({ attempts: 3, attempts_total: 3, forced: false }), true)
  assert.strictEqual(R.isFinalFailure({ attempts: 1, attempts_total: 1, forced: true }), true)
})

console.log('\n17. revision 4: V4, the follow-up goes out only when every label is an include label (criterion 53)')
{
  const createdRow = { invitee_source: 'replier', created_at_account: '2026-11-10T10:00:00Z', follow_up_status: null, follow_up_attempts: 0 }
  const at = new Date('2026-11-10T11:05:00Z')
  const fu4 = (t, i) => R.followUpDecision({ row: createdRow, thread: t, item: i, listingComplete: true, now: at, settings: FU })
  const twoReplies = (label) => thread({ latest_intent: label, messages: [sent(), reply({ ts: '2026-11-10T09:50:00Z' }), reply({ intent: label, body_text: 'Another note.', ts: '2026-11-10T10:30:00Z' })] })
  check('a hot_lead reply then an opted_out reply gives skipped_declined (was send)', () => {
    assert.strictEqual(fu4(twoReplies('opted_out'), item({ latest_intent: 'opted_out' })), 'skipped_declined')
  })
  check('the same with wrong_person gives skipped_label (was send)', () => {
    assert.strictEqual(fu4(twoReplies('wrong_person'), item({ latest_intent: 'wrong_person' })), 'skipped_label')
  })
  check('an out_of_office reply BEFORE the hot_lead reply gives skipped_label', () => {
    const t = thread({ messages: [sent(), reply({ intent: 'out_of_office', body_text: 'Away.', ts: '2026-11-10T09:00:00Z' }), reply({ ts: '2026-11-10T09:50:00Z' })] })
    assert.strictEqual(fu4(t, item()), 'skipped_label')
  })
  check('every reply hot_lead (one message with a null intent) and both latest labels hot_lead gives send', () => {
    const t = thread({ messages: [sent(), reply({ intent: null, ts: '2026-11-10T09:00:00Z' }), reply({ ts: '2026-11-10T09:50:00Z' })] })
    assert.strictEqual(fu4(t, item()), 'send')
  })
  check('the listing latest_intent null gives skipped_label', () => {
    assert.strictEqual(fu4(thread(), item({ latest_intent: null })), 'skipped_label')
  })
  check('the thread latest_intent null gives skipped_label', () => {
    assert.strictEqual(fu4(thread({ latest_intent: null }), item()), 'skipped_label')
  })
  check('DECLINE_RE matches opted_out, optedout, opt_out, optout, opted-out; not opted_in', () => {
    for (const l of ['opted_out', 'optedout', 'opt_out', 'optout', 'opted-out', 'Opted Out']) assert.ok(R.DECLINE_RE.test(R.normaliseIntent(l)), l)
    assert.ok(!R.DECLINE_RE.test(R.normaliseIntent('opted_in')))
  })
  check('qualifyLead: a hot_lead thread with an earlier opted_out label is skip declined final (was create)', () => {
    const t = thread({ messages: [sent(), reply({ intent: 'opted_out', ts: '2026-10-31T10:00:00Z' }), reply()] })
    const d = q(item(), t)
    assert.strictEqual(d.reason, 'declined'); assert.strictEqual(d.final, true)
  })
  check('skipped_label is terminal: the pre-gate never selects it again', () => {
    assert.ok(R.FOLLOW_UP_TERMINAL.has('skipped_label'))
    assert.strictEqual(R.followUpPreGate({ row: Object.assign({}, createdRow, { follow_up_status: 'skipped_label' }), now: at, settings: { follow_up_max_age_hours: 72 } }), 'terminal')
  })
}

console.log('\n18. revision 4: I-1, the own-domain guard in both directions, defaults always on (criterion 54)')
{
  check('isOwnDomain: a parent of an own domain is own; a bare label never is', () => {
    assert.strictEqual(R.isOwnDomain('persona.example', ['mail.persona.example']), true)
    assert.strictEqual(R.isOwnDomain('eu.persona.example', ['persona.example']), true)
    assert.strictEqual(R.isOwnDomain('example', ['mail.persona.example']), false)
    assert.strictEqual(R.isOwnDomain('acme.example', ['getbrandgeo.com']), false)
  })
  check('a hot_lead replier at the PARENT of our sent-from domain is own_sender_domain, soft, held (was create)', () => {
    const t = thread({ messages: [sent({ from_email: 'team@mail.persona.example' }), reply({ from_email: 'ana@persona.example' })] })
    const d = q(item({ email: 'ana@persona.example' }), t)
    assert.strictEqual(d.reason, 'own_sender_domain'); assert.strictEqual(d.final, false); assert.strictEqual(d.held, true)
  })
  for (const [label, value] of [['[]', []], ['null', null]]) {
    check(`own_sender_domains = ${label} keeps the two defaults: getbrandgeo.com and mail.trybrandgeo.com repliers are own`, () => {
      const s = Object.assign({}, SETTINGS, { own_sender_domains: value })
      for (const addr of ['ana@getbrandgeo.com', 'ana@mail.trybrandgeo.com']) {
        const t = thread({ messages: [sent(), reply({ from_email: addr })] })
        assert.strictEqual(q(item({ email: addr }), t, s).reason, 'own_sender_domain', addr)
      }
    })
  }
  check('rulesHash: [] equals the two defaults; a persona domain changes it', () => {
    const h = (v) => R.rulesHash(Object.assign({}, SETTINGS, { own_sender_domains: v }))
    assert.strictEqual(h([]), h(['getbrandgeo.com', 'trybrandgeo.com']))
    assert.strictEqual(h(null), h(['getbrandgeo.com', 'trybrandgeo.com']))
    assert.notStrictEqual(h(['persona.example']), h([]))
  })
}

console.log('\n19. revision 4: N2, fullwidth Latin letters in the brand-term rule (criterion 56)')
{
  const brand = { brandTerms: ['acme'], count: 1 }
  const FW = 'ＡＣＭＥ'   // fullwidth A C M E
  check('the Japanese prompt of criterion 37 with acme in fullwidth letters is rejected brand_term (was kept)', () => {
    const v = R.validatePrompts([`東京で${FW}のような会計ソフトは`], brand)
    assert.strictEqual(v.ok, false); assert.strictEqual(v.rejected[0] && v.rejected[0].rule, 'brand_term')
  })
  check('a fullwidth brand term against ASCII acme in the text is rejected brand_term', () => {
    const v = R.validatePrompts(['東京でacmeのような会計ソフトは'], { brandTerms: [FW], count: 1 })
    assert.strictEqual(v.ok, false); assert.strictEqual(v.rejected[0] && v.rejected[0].rule, 'brand_term')
  })
  check('the acmesoft Japanese prompt of criterion 37 is still kept', () => {
    assert.strictEqual(R.validatePrompts(['東京でacmesoftのような会計ソフトは'], brand).ok, true)
  })
  check('brandTermMatches applies NFKC; fold() itself is unchanged (NFKC lives in brandTermMatches only)', () => {
    assert.ok(R.brandTermMatches(`東京で${FW}の`, 'acme'))
    assert.strictEqual(typeof R.fold, 'function')
    assert.notStrictEqual(R.fold(FW), 'acme')
    assert.strictEqual(R.fold(FW), FW.toLowerCase())
  })
}

console.log(`\n${passes} passed, ${failures} failed`)
if (failures) process.exit(1)
