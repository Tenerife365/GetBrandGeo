/**
 * _client_api_key.js -- the per-client MCP API key (docs/arch/mcp-access.md
 * section 3.1). The client-key twin of the affiliate program key helpers in
 * _affiliate_core.js, deliberately NOT requiring that module: it would pull
 * the whole affiliate module into the mcp-server bundle for one sha256.
 *
 * Format: bgmcp_<client_id>_<48 hex chars> (192 bits of randomness).
 * The client id inside the key is a routing hint and a cross-check, never the
 * authority: the authority is the client_api_keys row found by hash.
 *
 * The key itself is never stored, logged or listed. The table holds its
 * sha256 hex (key_hash) and a display prefix (key_prefix). Nothing in this
 * module logs anything.
 */
const crypto = require('crypto')

const CLIENT_API_KEY_RE = /^bgmcp_([1-9][0-9]{0,9})_([a-f0-9]{48})$/

function makeClientApiKey(clientId) {
  return `bgmcp_${Number(clientId)}_${crypto.randomBytes(24).toString('hex')}`
}

function hashClientApiKey(key) {
  return crypto.createHash('sha256').update(String(key)).digest('hex')
}

// Display only: "bgmcp_42_" plus the first 6 hex characters of the secret.
function clientApiKeyPrefix(key) {
  const m = CLIENT_API_KEY_RE.exec(key)
  return m ? `bgmcp_${m[1]}_${m[2].slice(0, 6)}` : ''
}

/** The client id embedded in a well-formed key, as a string, or null. */
function clientIdFromKey(key) {
  const m = CLIENT_API_KEY_RE.exec(key)
  return m ? m[1] : null
}

module.exports = { CLIENT_API_KEY_RE, makeClientApiKey, hashClientApiKey, clientApiKeyPrefix, clientIdFromKey }
