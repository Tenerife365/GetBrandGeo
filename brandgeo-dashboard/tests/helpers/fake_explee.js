/**
 * fake_explee.js: an in-memory Explee API for the lead import suites
 * (docs/arch/explee-lead-import.md 5.5). It is a `fetch` replacement, so the
 * real _explee_client.js runs against it unchanged.
 *
 * Models: the projects list; the project inbox with offset paging, whose
 * items can be removed (hidden) between runs; threads with `sent` and `reply`
 * messages; a mutable lead_status per person that touches nothing else; the
 * shared note (GET and POST); replies answering 403, 409, 429 or deduped on
 * demand; /me; 402 on demand; inbox pages that fail on demand; a per-call log
 * for asserting methods, paths and abort signals.
 *
 * Fixtures use example.com style addresses and invented companies only.
 */
const BASE = 'https://api.explee.com/public/api/v1'

/*
 * Revision 3 additions, every one opt-in (the defaults match the OpenAPI and
 * the revision 2 behaviour):
 *   onCall(entry)        called at the start of every request with its log
 *                        entry; a test advances its injected clock here to
 *                        model a slow Explee (M3)
 *   omitHasMore          true: inbox pages carry neither has_more nor
 *                        next_offset (the importer must stop only on an empty page)
 *   pageSizeCap          number: serve at most this many items a page, with
 *                        has_more and next_offset still correct (a short page
 *                        that is not the last)
 *   moveToFront          { personId, afterOffset }: once the page at
 *                        afterOffset has been served, that item moves to index
 *                        0 (new activity while the inbox is paged, M2)
 *   replyStatus values   'not_ok' answers 200 { ok: false } (L2);
 *                        'deduped_only' answers 200 { deduped: true }
 *   addSkeleton(projectId)  lists { person_id: null, erased: true } (ops I7)
 */
function createFakeExplee({ projects = [{ id: 11, name: 'Outreach test', domain: 'brandgeo.example' }], onCall = null, omitHasMore = false, pageSizeCap = null, moveToFront = null } = {}) {
  const fx = {
    projects: projects.slice(),
    inbox: new Map(),          // projectId -> array of listing items (order kept)
    threads: new Map(),        // `${campaignId}:${personId}` -> thread
    notes: new Map(),          // `${campaignId}:${personId}` -> string
    log: [],
    paymentRequired: false,
    failInboxOffsets: new Set(),   // `${projectId}:${offset}` -> answers 500 (twice, so the retry fails too)
    failThreads: new Set(),        // personId -> 500
    replyStatus: new Map(),        // personId -> 403 | 409 | 429 | 'deduped' | 'not_ok' | 'deduped_only'
    me: { plan: 'free', balance: { remain: 100 } },
    onCall,
    omitHasMore,
    pageSizeCap,
    moveToFront,
  }

  function addSkeleton(projectId = 11) {
    const list = fx.inbox.get(projectId) || []
    list.push({ erased: true, person_id: null, campaign_id: null, email: null, name: null, latest_intent: null, reply_count: 0, latest_reply_at: null, needs_reply: false, lead_status: null })
    fx.inbox.set(projectId, list)
  }

  function addLead({ projectId = 11, campaignId = 21, personId, item = {}, thread = {} }) {
    const list = fx.inbox.get(projectId) || []
    list.push(Object.assign({
      erased: false, person_id: personId, campaign_id: campaignId, email: null, name: 'Sample Person',
      latest_intent: null, reply_count: 1, latest_reply_at: '2026-11-01T10:00:00Z', needs_reply: true, lead_status: null,
    }, item))
    fx.inbox.set(projectId, list)
    fx.threads.set(`${campaignId}:${personId}`, Object.assign({
      erased: false, can_reply: true, reply_blocked_reason: null, latest_intent: null, messages: [],
      lead: { erased: false, name: 'Sample Person', email: null, company_name: 'Sample Co', company_domain: 'sample.example', country: 'ES', note: null },
    }, thread))
  }

  function find(personId) {
    for (const [pid, list] of fx.inbox) {
      const it = list.find((x) => x.person_id === personId)
      if (it) return { projectId: pid, item: it }
    }
    return null
  }
  function threadOf(personId) {
    const f = find(personId)
    return f ? fx.threads.get(`${f.item.campaign_id}:${personId}`) : null
  }
  function setStatus(personId, status) { const f = find(personId); if (f) f.item.lead_status = status }
  function hide(personId) { for (const [pid, list] of fx.inbox) fx.inbox.set(pid, list.filter((x) => x.person_id !== personId)) }
  function erase(personId) {
    const t = threadOf(personId)
    if (t) { t.erased = true; if (t.lead) t.lead.erased = true }
    const f = find(personId)
    if (f) f.item.erased = true
  }
  function addReply(personId, { intent, body = '', from = null, ts }) {
    const t = threadOf(personId)
    t.messages.push({ type: 'reply', from_email: from, to_email: 'outreach@brandgeo.example', cc: [], body_text: body, intent, ts })
    t.latest_intent = intent
    const f = find(personId)
    if (f) { f.item.latest_intent = intent; f.item.latest_reply_at = ts; f.item.reply_count = (f.item.reply_count || 0) + 1 }
  }

  function res(status, data, headers = {}) {
    return {
      status, ok: status >= 200 && status < 300,
      headers: { get: (k) => headers[String(k).toLowerCase()] ?? null },
      async json() { return data === undefined ? null : JSON.parse(JSON.stringify(data)) },
    }
  }

  async function fetchImpl(url, init = {}) {
    const method = init.method || 'GET'
    const u = new URL(url)
    const path = u.pathname.replace('/public/api/v1', '') + (u.search || '')
    const entry = { method, path, hasSignal: !!init.signal, hasKey: !!(init.headers && init.headers['X-API-Key']) }
    fx.log.push(entry)
    if (typeof fx.onCall === 'function') fx.onCall(entry)
    if (fx.paymentRequired) return res(402, { detail: 'payment required' })
    const parts = u.pathname.replace('/public/api/v1/', '').split('/').map(decodeURIComponent)

    if (method === 'GET' && parts.join('/') === 'me') return res(200, Object.assign({ organization: {}, key: {}, rate_limits: {}, docs: {} }, fx.me))
    if (parts[0] !== 'autogtm') return res(404, {})
    if (method === 'GET' && parts.length === 2 && parts[1] === 'projects') return res(200, { projects: fx.projects, total: fx.projects.length })
    if (method === 'GET' && parts[1] === 'projects' && parts[3] === 'inbox' && parts.length === 4) {
      const pid = Number(parts[2])
      const offset = Number(u.searchParams.get('offset') || 0)
      const limit = Number(u.searchParams.get('limit') || 50)
      if (fx.failInboxOffsets.has(`${pid}:${offset}`)) return res(500, {})
      const list = fx.inbox.get(pid) || []
      const served = fx.pageSizeCap ? Math.min(limit, fx.pageSizeCap) : limit
      const page = list.slice(offset, offset + served)
      const more = offset + served < list.length
      const body = { contacts: page, total: list.length }
      if (!fx.omitHasMore) { body.has_more = more; body.next_offset = more ? offset + served : null }
      const mv = fx.moveToFront
      if (mv && !mv.done && mv.afterOffset === offset) {
        const idx = list.findIndex((x) => x.person_id === mv.personId)
        if (idx > 0) { const [it] = list.splice(idx, 1); list.unshift(it) }
        mv.done = true
      }
      return res(200, body)
    }
    if (parts[1] === 'campaigns' && parts[3] === 'inbox') {
      const key = `${Number(parts[2])}:${parts[4]}`
      const thread = fx.threads.get(key)
      if (method === 'GET' && parts.length === 5) {
        if (fx.failThreads.has(parts[4])) return res(500, {})
        return thread ? res(200, thread) : res(404, {})
      }
      if (parts[5] === 'note') {
        if (method === 'GET') return res(200, { note: fx.notes.get(key) ?? null })
        if (method === 'POST') {
          const b = JSON.parse(init.body || '{}')
          fx.notes.set(key, b.note)
          return res(200, { note: b.note })
        }
      }
      if (parts[5] === 'reply' && method === 'POST') {
        const s = fx.replyStatus.get(parts[4])
        if (s === 403 || s === 409 || s === 429) return res(s, { detail: 'refused' }, s === 409 ? { 'retry-after': '30' } : {})
        if (s === 'not_ok') return res(200, { ok: false })
        if (thread) thread.messages.push({ type: 'sent', from_email: 'outreach@brandgeo.example', to_email: null, cc: [], body_text: '(follow-up)', intent: null, ts: null })
        if (s === 'deduped_only') return res(200, { deduped: true })
        return res(200, { ok: true, deduped: s === 'deduped' })
      }
      if (parts[5] === 'status') return res(200, { ok: true })
    }
    return res(404, {})
  }

  const posts = () => fx.log.filter((l) => l.method !== 'GET')
  return Object.assign(fx, { addLead, addSkeleton, setStatus, hide, erase, addReply, threadOf, fetch: fetchImpl, posts, BASE })
}

module.exports = { createFakeExplee }
