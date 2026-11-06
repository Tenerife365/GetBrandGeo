/**
 * oauth-metadata.js -- the three well-known documents of MCP stage 3
 * (docs/arch/mcp-stage3-oauth.md sections 3, 3.2 and 3.3).
 *
 *   GET /.well-known/oauth-protected-resource/mcp   RFC 9728, the one the 401 points at
 *   GET /.well-known/oauth-protected-resource       the same document (Claude's fallback probe)
 *   GET /.well-known/oauth-authorization-server     RFC 8414
 *
 * netlify.toml rewrites each path here (status 200, force, above the /*
 * fallback). A rewrite keeps the original request path in event.path, which
 * is what picks the document. Public, static, no database, no secret: JSON,
 * Cache-Control public max-age 3600, and Access-Control-Allow-Origin * so a
 * browser-based MCP client can read them too. Anything else is 404; any
 * method but GET and HEAD is 405 (OPTIONS answers the CORS preflight).
 */
const { PROTECTED_RESOURCE_METADATA, AUTHORIZATION_SERVER_METADATA } = require('./_oauth')

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=3600',
  'Access-Control-Allow-Origin': '*',
  'X-Content-Type-Options': 'nosniff',
}

/** Which document a request path asks for: 'prm', 'as' or null. */
function documentFor(path) {
  const p = String(path || '').replace(/\/+$/, '')
  if (p.endsWith('/.well-known/oauth-authorization-server')) return 'as'
  if (p.endsWith('/.well-known/oauth-protected-resource') || p.endsWith('/.well-known/oauth-protected-resource/mcp')) return 'prm'
  return null
}

async function handle(event) {
  const method = event.httpMethod
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: { ...HEADERS, 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version' }, body: '' }
  }
  if (method !== 'GET' && method !== 'HEAD') return { statusCode: 405, headers: { Allow: 'GET, HEAD', 'X-Content-Type-Options': 'nosniff' }, body: '' }
  const doc = documentFor(event.path)
  if (!doc) return { statusCode: 404, headers: { ...HEADERS, 'Cache-Control': 'no-store' }, body: JSON.stringify({ error: 'not_found' }) }
  const body = JSON.stringify(doc === 'as' ? AUTHORIZATION_SERVER_METADATA : PROTECTED_RESOURCE_METADATA)
  return { statusCode: 200, headers: { ...HEADERS }, body: method === 'HEAD' ? '' : body }
}

exports.handler = (event) => handle(event)
exports.handle = handle
exports.documentFor = documentFor
