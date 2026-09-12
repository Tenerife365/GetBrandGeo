/**
 * affiliate_test_env.js: the bootstrap the affiliate handler tests share.
 *
 * _auth.js builds a Supabase client from env at module load and its
 * requireAuth() reads user_profiles over the network, so the tests replace the
 * module in require.cache with a scripted gate BEFORE any handler is loaded.
 * The gate keeps the real contract: 401 without a token, 401 for an unknown
 * one, 403 for a non-admin on an adminOnly endpoint, 403 for a foreign origin,
 * and { user, headers } on success.
 *
 * RESEND_API_KEY is removed so every email becomes a { skipped: true } no-op.
 */
const path = require('path')
const Module = require('module')

const FN = path.join(__dirname, '..', '..', 'netlify', 'functions')
const ALLOWED_ORIGINS = ['https://app.getbrandgeo.com', 'http://localhost:5173', 'http://localhost:3000']

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }
}

/**
 * tokens: { '<jwt>': { role: 'admin'|'viewer', user: { id, email }, client_id? } }
 */
function installAuthMock({ tokens = {} } = {}) {
  delete process.env.RESEND_API_KEY
  const reject = (statusCode, error, headers) => ({ response: { statusCode, headers, body: JSON.stringify({ error }) } })
  const mock = {
    ALLOWED_ORIGINS,
    corsHeaders,
    checkCollectionLimits: async () => ({ ok: true }),
    async requireAuth(event, { adminOnly = false } = {}) {
      const origin = event.headers['origin'] || event.headers['Origin'] || ''
      const headers = corsHeaders(origin)
      if (event.httpMethod === 'OPTIONS') return { response: { statusCode: 204, headers, body: '' } }
      if (origin && !ALLOWED_ORIGINS.includes(origin)) return reject(403, 'Forbidden: origin not allowed', headers)
      const h = event.headers['authorization'] || event.headers['Authorization'] || ''
      const token = h.startsWith('Bearer ') ? h.slice(7).trim() : ''
      if (!token) return reject(401, 'Unauthorized: missing token', headers)
      const entry = tokens[token]
      if (!entry) return reject(401, 'Unauthorized: invalid or expired token', headers)
      if (adminOnly && entry.role !== 'admin') return reject(403, 'Forbidden: admin only', headers)
      return { user: entry.user, role: entry.role, clientId: entry.client_id || null, headers }
    },
  }
  const authPath = require.resolve(path.join(FN, '_auth.js'))
  const m = new Module(authPath, null)
  m.filename = authPath
  m.loaded = true
  m.exports = mock
  require.cache[authPath] = m
  return mock
}

function fn(name) { return require(path.join(FN, name)) }

function post(body, { token = null, origin = 'https://app.getbrandgeo.com', headers = {}, path: p = '/.netlify/functions/x' } = {}) {
  const h = { 'content-type': 'application/json', ...headers }
  if (origin !== null) h.origin = origin
  if (token) h.authorization = `Bearer ${token}`
  return { httpMethod: 'POST', path: p, headers: h, queryStringParameters: {}, body: typeof body === 'string' ? body : JSON.stringify(body) }
}

function get(p, { query = {}, headers = {}, method = 'GET' } = {}) {
  return { httpMethod: method, path: p, headers: { ...headers }, queryStringParameters: query, body: '' }
}

function parse(res) {
  let body = res.body
  if (typeof body === 'string' && (res.headers || {})['Content-Type'] !== 'text/csv; charset=utf-8') {
    try { body = JSON.parse(body) } catch { /* keep the raw string */ }
  }
  return { status: res.statusCode, body, headers: res.headers || {} }
}

module.exports = { installAuthMock, fn, post, get, parse, ALLOWED_ORIGINS, corsHeaders }
