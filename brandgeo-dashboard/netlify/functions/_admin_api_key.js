/**
 * Admin MCP key helpers (docs/arch/mcp-admin-tools.md section 3).
 *
 * A key is bgadm_<48 hex>: 24 random bytes, shown once, never stored. The
 * database keeps only its sha256 and a display prefix (bgadm_ plus 6 hex).
 * Plain JavaScript, no .ts require, so the default bundler can load it.
 */
const crypto = require('crypto')

const ADMIN_API_KEY_RE = /^bgadm_([a-f0-9]{48})$/

function makeAdminApiKey() { return `bgadm_${crypto.randomBytes(24).toString('hex')}` }

function hashAdminApiKey(key) { return crypto.createHash('sha256').update(String(key)).digest('hex') }

function adminApiKeyPrefix(key) {
  const m = ADMIN_API_KEY_RE.exec(String(key || ''))
  return m ? `bgadm_${m[1].slice(0, 6)}` : ''
}

module.exports = { ADMIN_API_KEY_RE, makeAdminApiKey, hashAdminApiKey, adminApiKeyPrefix }
