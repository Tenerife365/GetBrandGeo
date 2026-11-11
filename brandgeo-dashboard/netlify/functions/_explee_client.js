/**
 * _explee_client.js: the narrow Explee HTTP client of the lead import
 * (docs/arch/explee-lead-import.md, revision 3, D11).
 *
 * Seven calls and no generic request method: listProjects, listInbox,
 * getThread, getNote, getMe (GET) and postNote, postReply (POST). A client
 * built with { write: false } (the dry run) does not HAVE the two POST calls,
 * and its single internal request function refuses any method but GET, so a
 * dry run is structurally unable to POST.
 *
 * The key is read from process.env.EXPLEE_API_KEY at call time, sent only as
 * the X-API-Key header, never logged, never stored, never put in an error.
 * Request headers and bodies are never logged. `fetch` and `sleep` are
 * injected for tests.
 *
 * Errors are ExpleeError with a code only (no address, no body text):
 *   missing_key, insufficient_credits (402, latched: nothing is sent after the
 *   first), unauthorized (401, 403 on a GET), not_found, http_<status>,
 *   timeout, network, bad_id, bad_response.
 */
const BASE_URL = 'https://api.explee.com/public/api/v1'
const PERSON_ID_RE = /^[A-Za-z0-9_-]{1,64}$/
const INT32_MAX = 2147483647

class ExpleeError extends Error {
  constructor(code, status) {
    super(code)
    this.name = 'ExpleeError'
    this.code = code
    this.status = status === undefined ? null : status
  }
}

function positiveInt32(v) {
  const n = typeof v === 'string' && /^\d{1,10}$/.test(v) ? Number(v) : v
  if (!Number.isInteger(n) || n < 1 || n > INT32_MAX) throw new ExpleeError('bad_id')
  return n
}

function personId(v) {
  if (typeof v !== 'string' || !PERSON_ID_RE.test(v)) throw new ExpleeError('bad_id')
  return v
}

/**
 * createExpleeClient({ write, fetchImpl, sleep, baseUrl, getKey })
 * write: true only in live mode.
 */
function createExpleeClient(opts = {}) {
  const write = opts.write === true
  const fetchImpl = opts.fetchImpl || ((...a) => fetch(...a))
  const sleep = opts.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)))
  const baseUrl = opts.baseUrl || BASE_URL
  const getKey = opts.getKey || (() => process.env.EXPLEE_API_KEY)
  let creditsExhausted = false

  async function once(method, path, body) {
    const key = getKey()
    if (!key) throw new ExpleeError('missing_key')
    const init = {
      method,
      headers: { 'X-API-Key': key, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    }
    if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
    try {
      return await fetchImpl(`${baseUrl}${path}`, init)
    } catch (e) {
      const name = e && e.name
      throw new ExpleeError(name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network')
    }
  }

  async function readJson(res) {
    try { return await res.json() } catch { return null }
  }

  // The only function that talks to the network.
  async function request(method, path, body, { retry = true, passStatuses = [] } = {}) {
    if (method !== 'GET' && !(write && method === 'POST')) throw new ExpleeError('method_not_allowed')
    if (creditsExhausted) throw new ExpleeError('insufficient_credits', 402)
    let res = await once(method, path, body)
    if (retry && (res.status === 429 || res.status >= 500) && !passStatuses.includes(res.status)) {
      await sleep(2000)
      res = await once(method, path, body)
    }
    if (res.status === 402) { creditsExhausted = true; throw new ExpleeError('insufficient_credits', 402) }
    if (passStatuses.includes(res.status)) {
      return { status: res.status, data: await readJson(res), retryAfter: res.headers && typeof res.headers.get === 'function' ? res.headers.get('retry-after') : null }
    }
    if (res.status === 401 || (res.status === 403 && method === 'GET')) throw new ExpleeError('unauthorized', res.status)
    if (res.status === 404) throw new ExpleeError('not_found', 404)
    if (res.status < 200 || res.status >= 300) throw new ExpleeError(`http_${res.status}`, res.status)
    const data = await readJson(res)
    if (data === null || typeof data !== 'object') throw new ExpleeError('bad_response', res.status)
    return { status: res.status, data }
  }

  const client = {
    async listProjects() {
      const { data } = await request('GET', '/autogtm/projects')
      return Array.isArray(data.projects) ? data.projects : []
    },
    async listInbox(projectId, { limit = 200, offset = 0 } = {}) {
      const id = positiveInt32(projectId)
      const lim = Math.max(1, Math.min(200, Number(limit) || 200))
      const off = Math.max(0, Math.floor(Number(offset) || 0))
      const { data } = await request('GET', `/autogtm/projects/${encodeURIComponent(id)}/inbox?limit=${lim}&offset=${off}`)
      // rev 3, M2: hasMore is true, false, or null when the field is absent
      // (not a boolean); the importer pages by D1 step 6 on these.
      const contacts = Array.isArray(data.contacts) ? data.contacts : []
      return {
        contacts,
        items: contacts,
        hasMore: typeof data.has_more === 'boolean' ? data.has_more : null,
        nextOffset: Number.isInteger(data.next_offset) ? data.next_offset : null,
      }
    },
    async getThread(campaignId, person) {
      const c = positiveInt32(campaignId)
      const p = personId(person)
      const { data } = await request('GET', `/autogtm/campaigns/${encodeURIComponent(c)}/inbox/${encodeURIComponent(p)}`)
      return data
    },
    async getNote(campaignId, person) {
      const c = positiveInt32(campaignId)
      const p = personId(person)
      const { data } = await request('GET', `/autogtm/campaigns/${encodeURIComponent(c)}/inbox/${encodeURIComponent(p)}/note`)
      return typeof data.note === 'string' ? data.note : null
    },
    async getMe() {
      const { data } = await request('GET', '/me')
      const remain = data.balance && typeof data.balance.remain === 'number' ? data.balance.remain : null
      return { plan: typeof data.plan === 'string' ? data.plan : null, balance_remain: remain }
    },
  }

  if (write) {
    client.postNote = async (campaignId, person, note) => {
      const c = positiveInt32(campaignId)
      const p = personId(person)
      if (typeof note !== 'string' || note.length > 10000) throw new ExpleeError('bad_note')
      await request('POST', `/autogtm/campaigns/${encodeURIComponent(c)}/inbox/${encodeURIComponent(p)}/note`, { note })
      return true
    }
    // Not retried here: a reply 429 means "too many replies to this contact in
    // 24h" (retried by the importer after 24 h), and a 409 goes back to the
    // caller. 403, 409 and 429 are returned with their status, never thrown.
    client.postReply = async (campaignId, person, bodyText) => {
      const c = positiveInt32(campaignId)
      const p = personId(person)
      if (typeof bodyText !== 'string' || !bodyText.trim()) throw new ExpleeError('bad_reply')
      const r = await request('POST', `/autogtm/campaigns/${encodeURIComponent(c)}/inbox/${encodeURIComponent(p)}/reply`,
        { body_text: bodyText, reply_all: false }, { retry: false, passStatuses: [403, 409, 429] })
      // rev 3, L2: ok is true only when the body says ok: true.
      return { status: r.status, ok: !!(r.data && r.data.ok === true), deduped: !!(r.data && r.data.deduped === true), retryAfter: r.retryAfter || null }
    }
  }

  return Object.freeze(client)
}

const ALLOWED_CALLS = Object.freeze(['listProjects', 'listInbox', 'getThread', 'getNote', 'postNote', 'postReply', 'getMe'])

module.exports = { createExpleeClient, ExpleeError, ALLOWED_CALLS, BASE_URL }
