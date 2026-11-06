/**
 * oauth-as-metadata.js -- the authorization server metadata entry (RFC 8414,
 * spec 3.3). Its own function so the document never depends on how Netlify
 * reports the request path after a rewrite (review L6).
 */
const meta = require('./oauth-metadata')

exports.handler = (event) => meta.handle({ ...event, path: '/.well-known/oauth-authorization-server' })
