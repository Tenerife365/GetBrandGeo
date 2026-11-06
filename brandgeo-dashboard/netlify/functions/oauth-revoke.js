/**
 * oauth-revoke.js -- the /oauth/revoke entry (docs/arch/mcp-stage3-oauth.md 4.4).
 * Its own function so the endpoint never depends on how Netlify reports the
 * request path after a rewrite (review L6); the logic lives in oauth-token.js.
 */
const token = require('./oauth-token')

exports.handler = (event, context) => token.handle({ ...event, path: '/oauth/revoke' }, context)
