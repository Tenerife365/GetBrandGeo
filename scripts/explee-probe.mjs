// explee-probe.mjs: a read-only look at an Explee account, to plan the lead import.
//
// What it does: GET requests only. It reads who the key is, the outreach
// projects and campaigns, the contacted leads of each campaign, and (for leads
// who replied) the intent label Explee's classifier gave the latest reply.
//
// What it prints: counts only. No name, no email address, no company, no reply
// text and never the key. The point is to learn the real intent labels and how
// many leads the import rule would pick, before anything is built on them.
//
// What it never does: POST, PATCH, PUT or DELETE. Nothing is created, sent or
// changed in Explee or anywhere else.
//
// Run (PowerShell, from the repo root). Copy the key in Explee first, then:
//   $env:EXPLEE_API_KEY = (Get-Clipboard).Trim()
//   node scripts\explee-probe.mjs
//   Remove-Item Env:EXPLEE_API_KEY
// The key lives only in that terminal window and is never written to a file.

const KEY = (process.env.EXPLEE_API_KEY || '').trim()
const BASE = 'https://api.explee.com/public/api/v1'
const MAX_THREADS = Number(process.env.EXPLEE_PROBE_MAX_THREADS || 300)
const PAGE = 500

if (!KEY) {
  console.log('EXPLEE_API_KEY is not set in this terminal. See the run steps at the top of this file.')
  process.exit(1)
}

// Anything printed passes through here, so the key cannot leak through an error body.
const safe = (v) => String(v).split(KEY).join('[key]')
const out = (...a) => console.log(...a.map(safe))

let requests = 0
async function get(path, params = {}) {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  for (let attempt = 1; attempt <= 3; attempt++) {
    requests++
    let res
    try {
      res = await fetch(url, { method: 'GET', headers: { 'X-API-Key': KEY, accept: 'application/json' }, signal: AbortSignal.timeout(60000) })
    } catch (e) {
      if (attempt === 3) return { ok: false, status: 0, error: 'network: ' + (e && e.name) }
      continue
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt === 3) return { ok: false, status: res.status, error: (await res.text()).slice(0, 200) }
      await new Promise((r) => setTimeout(r, 1500 * attempt))
      continue
    }
    const text = await res.text()
    if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 300) }
    try { return { ok: true, status: res.status, data: JSON.parse(text) } } catch { return { ok: false, status: res.status, error: 'not JSON' } }
  }
}

const tally = () => new Map()
const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1)
const show = (title, m) => {
  out('  ' + title + ':')
  if (m.size === 0) { out('    (none)'); return }
  for (const [k, v] of [...m.entries()].sort((a, b) => b[1] - a[1])) out('    ' + String(v).padStart(5) + '  ' + k)
}

const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com', 'aol.com', 'gmx.com', 'gmx.de', 'web.de', 'mail.com', 'yandex.com'])
// The 61 markets the dashboard knows (src/lib/markets.ts), minus WW. A country outside it falls back to Worldwide.
const MARKETS = new Set('RO US GB DE FR ES IT NL BE AT CH IE PT PL SE DK CA AU BR MX SG IN JP AE SA KR NZ HK TW MY TH ID PH VN NO FI IS LU GR CZ HU SK SI HR BG EE LV LT CY MT TR IL QA KW BH OM ZA AR CL CO'.split(' '))
const TEAM_OUT = new Set(['lost', 'unqualified'])
// Only label published by Explee as an example. The run below shows the real set.
const DECLINE_GUESS = new Set(['not_interested'])

out('Explee read-only probe. GET requests only, counts only.')
out('')

// 1. Who is this key
const me = await get('/me')
if (!me.ok) {
  out('The key did not work on /me. HTTP ' + me.status + '. ' + (me.error || ''))
  out(me.status === 401 || me.status === 403 ? 'Check that the whole key was copied.' : 'Try again in a minute.')
  process.exit(1)
}
const k = me.data.key || {}
out('1. Connection: OK')
out('  plan: ' + (me.data.plan ?? 'unknown'))
out('  key can write: ' + (k.read_only === true ? 'no (read-only key)' : 'yes'))
out('  key scope: ' + (Array.isArray(k.project_ids) ? k.project_ids.length + ' project(s)' : 'every project'))
out('  balance visible: ' + (me.data.balance ? 'yes' : 'no'))
const rl = me.data.rate_limits || {}
out('  rate limits: ' + (rl.requests_per_hour ?? '?') + ' per hour, ' + (rl.max_concurrent_requests ?? '?') + ' at once')
out('')

// 2. Projects and campaigns
const pr = await get('/autogtm/projects')
if (!pr.ok) { out('2. Projects: could not be read. HTTP ' + pr.status + '. ' + (pr.error || '')); process.exit(1) }
const projects = pr.data.projects || []
out('2. Outreach projects: ' + projects.length)
const cr = await get('/autogtm/campaigns', { include_archived: true })
if (!cr.ok) { out('   Campaigns: could not be read. HTTP ' + cr.status + '. ' + (cr.error || '')); process.exit(1) }
const campaigns = cr.data.campaigns || []
const campStatus = tally()
for (const c of campaigns) bump(campStatus, c.status || 'unknown')
out('   Campaigns: ' + campaigns.length)
show('campaign status', campStatus)
out('')

// 3. Contacted leads
const T = { contacted: 0, replied: 0, bounced: 0, unsubscribed: 0, erased: 0 }
const teamStatus = tally(), repliedCountry = tally(), hotVsNot = tally()
let repliedNoDomain = 0, repliedFreeMail = 0, repliedMarketKnown = 0, repliedDomainMismatch = 0
const replied = []
const seenPerson = new Set()
let leadReadErrors = 0
for (const c of campaigns) {
  let offset = 0
  for (let page = 0; page < 200; page++) {
    const r = await get('/autogtm/campaigns/' + c.id + '/leads', { limit: PAGE, offset })
    if (!r.ok) { leadReadErrors++; break }
    for (const l of r.data.leads || []) {
      T.contacted++
      if (l.erased) T.erased++
      if (l.bounced) T.bounced++
      if (l.unsubscribed) T.unsubscribed++
      if (!l.replied) continue
      T.replied++
      bump(teamStatus, l.status || '(no status set)')
      bump(hotVsNot, String(l.status || '').toLowerCase() === 'hot' ? 'tagged Hot' : 'replied, not tagged Hot')
      const key = l.person_id || (c.id + ':' + T.replied)
      if (seenPerson.has(key)) continue
      seenPerson.add(key)
      const cc = String(l.country || '').toUpperCase()
      bump(repliedCountry, cc || '(none)')
      if (MARKETS.has(cc)) repliedMarketKnown++
      const dom = String(l.company_domain || '').toLowerCase().replace(/^www\./, '')
      const mailDom = String(l.email || '').toLowerCase().split('@')[1] || ''
      if (!dom) repliedNoDomain++
      if (FREE_MAIL.has(mailDom)) repliedFreeMail++
      if (dom && mailDom && !FREE_MAIL.has(mailDom) && mailDom !== dom && !mailDom.endsWith('.' + dom) && !dom.endsWith('.' + mailDom)) repliedDomainMismatch++
      replied.push({ campaign_id: c.id, person_id: l.person_id, erased: !!l.erased, bounced: !!l.bounced, unsubscribed: !!l.unsubscribed, status: String(l.status || '').toLowerCase(), hasReplyText: !!(l.last_reply && String(l.last_reply).trim()) })
    }
    if (!r.data.has_more || r.data.next_offset == null) break
    offset = r.data.next_offset
  }
}
out('3. Leads across all campaigns')
out('  contacted:    ' + T.contacted)
out('  replied:      ' + T.replied + '  (' + replied.length + ' distinct people)')
out('  bounced:      ' + T.bounced)
out('  unsubscribed: ' + T.unsubscribed)
out('  erased:       ' + T.erased)
if (leadReadErrors) out('  campaigns whose leads could not be read: ' + leadReadErrors)
show('replied leads, by the status your team set', teamStatus)
show('replied leads, Hot tag', hotVsNot)
out('')

// 4. Intent labels of the people who replied
const intents = tally()
let threadErrors = 0, threadsRead = 0, noReplyBlocked = 0
const sample = replied.filter((x) => x.person_id).slice(0, MAX_THREADS)
for (const x of sample) {
  const t = await get('/autogtm/campaigns/' + x.campaign_id + '/inbox/' + encodeURIComponent(x.person_id))
  if (!t.ok) { threadErrors++; x.intent = '(thread not readable)'; continue }
  threadsRead++
  x.intent = t.data.latest_intent || '(no intent label)'
  if (t.data.can_reply === false) noReplyBlocked++
  bump(intents, x.intent)
}
out('4. Intent label of the latest reply (Explee classifier), ' + threadsRead + ' conversations read' + (replied.length > sample.length ? ' of ' + replied.length + ' (capped, set EXPLEE_PROBE_MAX_THREADS to read more)' : ''))
show('intent labels', intents)
if (threadErrors) out('  conversations that could not be read: ' + threadErrors)
out('  conversations where Explee blocks a reply: ' + noReplyBlocked)
out('')

// 5. What the import rule would pick, as far as it can be judged from here
const verdict = tally()
for (const x of sample) {
  if (x.erased) bump(verdict, 'out: asked to be removed')
  else if (x.unsubscribed) bump(verdict, 'out: unsubscribed')
  else if (x.bounced) bump(verdict, 'out: bounced')
  else if (TEAM_OUT.has(x.status)) bump(verdict, 'out: team marked Lost or Unqualified')
  else if (DECLINE_GUESS.has(String(x.intent).toLowerCase())) bump(verdict, 'out: declined (not_interested)')
  else bump(verdict, 'IN: would get a free account (before the duplicate check)')
}
out('5. The rule "everyone who replied, except proper declines", applied to those ' + sample.length)
show('outcome', verdict)
out('  Note: only "not_interested" is treated as a decline here. Section 4 shows which other labels exist.')
out('')

// 6. Data quality of the people who replied
out('6. Data on the ' + replied.length + ' distinct people who replied')
out('  country is one of our 61 markets: ' + repliedMarketKnown + '  (the rest would start on Worldwide)')
out('  no company website from Explee:   ' + repliedNoDomain)
out('  wrote from a free mail address:   ' + repliedFreeMail)
out('  email domain differs from the company website: ' + repliedDomainMismatch)
show('country of replied leads', repliedCountry)
out('')
// 7. The inbox view. The lead list above counts only human replies ("replied" leaves out
// auto-replies), so an out-of-office that names a colleague is invisible there. The inbox
// carries the classifier label of the latest reply for every conversation, auto-replies included.
const inboxIntent = tally(), inboxByKind = tally(), inboxStatus = tally(), threadLabels = tally()
let inboxTotal = 0, inboxWithIntent = 0, inboxErrors = 0, colleagueReplies = 0, extraThreads = 0, addressHidden = 0
const alreadyRead = new Set(sample.map((x) => x.person_id))
for (const p of projects) {
  let offset = 0
  for (let page = 0; page < 100; page++) {
    const r = await get('/autogtm/projects/' + p.id + '/inbox', { limit: 200, offset })
    if (!r.ok) { inboxErrors++; break }
    for (const c of r.data.contacts || []) {
      inboxTotal++
      if (!c.latest_intent) continue
      inboxWithIntent++
      bump(inboxIntent, c.latest_intent)
      bump(inboxByKind, (c.reply_count > 0 ? 'human reply' : 'auto-reply only') + ' / ' + c.latest_intent)
      bump(inboxStatus, c.lead_status || '(no status set)')
      if (!c.email) addressHidden++
      // Read the conversation only to count labels and senders. Nothing of its text is kept or printed.
      if (c.person_id && c.campaign_id && extraThreads < MAX_THREADS) {
        const t = await get('/autogtm/campaigns/' + c.campaign_id + '/inbox/' + encodeURIComponent(c.person_id))
        if (!t.ok) continue
        if (!alreadyRead.has(c.person_id)) extraThreads++
        const inbound = (t.data.messages || []).filter((m) => m.type === 'reply')
        const senders = new Set(inbound.map((m) => String(m.from_email || '').toLowerCase()).filter(Boolean))
        if (senders.size > 1) colleagueReplies++
        for (const label of new Set(inbound.map((m) => m.intent || '(no label)'))) bump(threadLabels, label)
      }
    }
    if (!r.data.has_more || r.data.next_offset == null) break
    offset = r.data.next_offset
  }
}
out('7. Inbox view: ' + inboxTotal + ' conversations, ' + inboxWithIntent + ' with a classified reply')
if (inboxErrors) out('  projects whose inbox could not be read: ' + inboxErrors)
show('label of the latest reply', inboxIntent)
show('human reply or auto-reply only, by label', inboxByKind)
show('status your team set, on conversations with a classified reply', inboxStatus)
show('every label that appears anywhere in those conversations (a conversation counts once per label)', threadLabels)
out('  conversations with a classified reply that the lead list in section 3 did not count as replied: ' + extraThreads)
out('  conversations answered from more than one address (a colleague wrote back): ' + colleagueReplies)
out('  conversations where Explee does not reveal the address: ' + addressHidden)
out('')
out('Done. ' + requests + ' GET requests, nothing written anywhere.')
