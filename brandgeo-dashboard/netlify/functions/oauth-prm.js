/**
 * oauth-prm.js -- the protected resource metadata entry (RFC 9728, spec 3.2)
 * for both well-known paths. Its own function so the document never depends
 * on how Netlify reports the request path after a rewrite (review L6).
 */
const meta = require('./oauth-metadata')

exports.handler = (event) => meta.handle({ ...event, path: '/.well-known/oauth-protected-resource' })
