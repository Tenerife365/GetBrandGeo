/**
 * affiliate_auth.test.js: who can reach what.
 *
 *   admin endpoint   -> 401 without a token, 401 unknown token, 403 viewer, 403 foreign origin, 204 preflight
 *   affiliate portal -> 401 / 401 / 403 suspended / 403 rejected / no affiliate row, and an affiliate
 *                       never sees another affiliate's commissions, payouts or documents
 *   conversion API   -> 401 missing, malformed or unknown key; the key pins the program
 *   public endpoints -> origin whitelist; private and draft programs are hidden; no api key material leaks
 *
 * Run: `node tests/affiliate_auth.test.js` from brandgeo-dashboard/.
 */
const assert = require('assert')
const env = require('./helpers/affiliate_test_env')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

env.installAuthMock({
  tokens: {
    'admin-jwt': { role: 'admin', user: { id: 'admin-1', email: 'admin@example.com' } },
    'viewer-jwt': { role: 'viewer', user: { id: 'viewer-1', email: 'viewer@example.com' }, client_id: 7 },
  },
})
const admin = env.fn('affiliate-admin.js')
const portal = env.fn('affiliate-portal.js')
const conversions = env.fn('affiliate-conversions.js')
const apply = env.fn('affiliate-apply.js')
const redirect = env.fn('affiliate-redirect.js')
const programsPublic = env.fn('affiliate-programs-public.js')
const core = env.fn('_affiliate_core.js')

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

async function main() {
  const db = createFakeSupabase()
  const key = core.makeApiKey('brandgeo')
  const [p1] = db.seed('affiliate_programs', [{ slug: 'brandgeo', name: 'BrandGEO', destination_url: 'https://getbrandgeo.com/', status: 'active', is_public: true, sale_commission_bps: 2000, api_key_hash: core.hashApiKey(key), api_key_prefix: core.apiKeyPrefix(key) }])
  db.seed('affiliate_programs', [
    { slug: 'private-one', name: 'Private', destination_url: 'https://private.example.com/', status: 'active', is_public: false },
    { slug: 'draft-one', name: 'Draft', destination_url: 'https://draft.example.com/', status: 'draft', is_public: true },
  ])
  const [ana, ben, sam, rex] = db.seed('affiliates', [
    { email: 'ana@partner-a.example.com', full_name: 'Ana Partner', status: 'active', user_id: 'u-ana' },
    { email: 'ben@creator-b.example.com', full_name: 'Ben Creator', status: 'active', user_id: 'u-ben' },
    { email: 'sam@paused.example.com', full_name: 'Sam Paused', status: 'suspended', user_id: 'u-sam' },
    { email: 'rex@rejected.example.com', full_name: 'Rex Rejected', status: 'rejected', user_id: 'u-rex' },
  ])
  const [mAna, mBen] = db.seed('affiliate_memberships', [
    { affiliate_id: ana.id, program_id: p1.id, status: 'active' },
    { affiliate_id: ben.id, program_id: p1.id, status: 'active' },
  ])
  db.seed('affiliate_codes', [
    { program_id: p1.id, membership_id: mAna.id, affiliate_id: ana.id, code: 'ANA10', kind: 'link', is_primary: true },
    { program_id: p1.id, membership_id: mBen.id, affiliate_id: ben.id, code: 'BEN20', kind: 'link', is_primary: true },
  ])
  const [cAna, cBen] = db.seed('affiliate_conversions', [
    { program_id: p1.id, membership_id: mAna.id, idempotency_key: 'k1', conversion_type: 'sale', amount_cents: 29900, currency: 'EUR', source: 'link', occurred_at: '2026-09-01T00:00:00Z', customer_ref: 'a***@buyer.example.com' },
    { program_id: p1.id, membership_id: mBen.id, idempotency_key: 'k2', conversion_type: 'sale', amount_cents: 10000, currency: 'EUR', source: 'link', occurred_at: '2026-09-02T00:00:00Z', customer_ref: 'b***@buyer.example.com' },
  ])
  db.seed('affiliate_commissions', [
    { conversion_id: cAna.id, program_id: p1.id, membership_id: mAna.id, affiliate_id: ana.id, amount_cents: 5980, currency: 'EUR', status: 'approved' },
    { conversion_id: cBen.id, program_id: p1.id, membership_id: mBen.id, affiliate_id: ben.id, amount_cents: 2000, currency: 'EUR', status: 'approved' },
  ])
  const [bAna, bBen] = db.seed('affiliate_payout_batches', [
    { affiliate_id: ana.id, currency: 'EUR', status: 'paid', total_cents: 5980, item_count: 1, external_reference: 'WISE-1', documents: [{ name: 'inv-ana.pdf', path: `${ana.id}/x/inv-ana.pdf`, kind: 'invoice' }] },
    { affiliate_id: ben.id, currency: 'EUR', status: 'draft', total_cents: 2000, item_count: 1, documents: [{ name: 'inv-ben.pdf', path: `${ben.id}/y/inv-ben.pdf`, kind: 'invoice' }] },
  ])
  for (const [tok, a] of [['ana-jwt', ana], ['ben-jwt', ben], ['sam-jwt', sam], ['rex-jwt', rex]]) db.addUser(tok, { id: a.user_id, email: a.email })
  db.addUser('nobody-jwt', { id: 'u-none', email: 'client@example.com' })

  const call = (h, ev) => h.handle(ev, { supabase: db }).then(env.parse)

  section('admin endpoint (requireAuth adminOnly)')
  let r = await call(admin, env.post({ action: 'programs.list' }))
  assert.strictEqual(r.status, 401)
  r = await call(admin, env.post({ action: 'programs.list' }, { token: 'made-up' }))
  assert.strictEqual(r.status, 401)
  r = await call(admin, env.post({ action: 'programs.list' }, { token: 'viewer-jwt' }))
  assert.strictEqual(r.status, 403)
  r = await call(admin, env.post({ action: 'programs.list' }, { token: 'admin-jwt', origin: 'https://evil.example.com' }))
  assert.strictEqual(r.status, 403)
  r = await call(admin, { ...env.post({}, { token: 'admin-jwt' }), httpMethod: 'OPTIONS' })
  assert.strictEqual(r.status, 204)
  r = await call(admin, env.post({ action: 'programs.list' }, { token: 'admin-jwt' }))
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.programs.length, 3)
  ok('admin endpoint: 401 no token, 401 bad token, 403 viewer, 403 foreign origin, 204 preflight, 200 admin')
  const raw = JSON.stringify(r.body)
  assert.ok(!raw.includes('api_key_hash'), 'hash must never leave the server')
  assert.ok(!raw.includes(key), 'plaintext key never appears after the one-time reveal')
  assert.strictEqual(r.body.programs.find((p) => p.slug === 'brandgeo').has_api_key, true)
  ok('admin program listing exposes has_api_key, never the hash or the key')
  r = await call(admin, env.post({ action: 'programs.list' }, { token: 'admin-jwt', origin: null }))
  assert.strictEqual(r.status, 200)
  ok('a server-to-server call with no Origin header is allowed (same as _auth.js)')

  section('affiliate portal (requireAffiliate)')
  r = await call(portal, env.post({ action: 'me' }))
  assert.strictEqual(r.status, 401)
  r = await call(portal, env.post({ action: 'me' }, { token: 'made-up' }))
  assert.strictEqual(r.status, 401)
  r = await call(portal, env.post({ action: 'me' }, { token: 'ana-jwt', origin: 'https://evil.example.com' }))
  assert.strictEqual(r.status, 403)
  ok('portal: 401 no token, 401 bad token, 403 foreign origin')
  r = await call(portal, env.post({ action: 'me' }, { token: 'sam-jwt' }))
  assert.strictEqual(r.status, 403)
  assert.match(r.body.error, /suspended/)
  r = await call(portal, env.post({ action: 'me' }, { token: 'rex-jwt' }))
  assert.strictEqual(r.status, 403)
  ok('a suspended or rejected affiliate is refused before any data is read')
  r = await call(portal, env.post({ action: 'me' }, { token: 'nobody-jwt' }))
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.affiliate, null)
  r = await call(portal, env.post({ action: 'update_profile', full_name: 'X' }, { token: 'nobody-jwt' }))
  assert.strictEqual(r.status, 403)
  ok('a login with no affiliate row gets an empty "me" and nothing else')

  r = await call(portal, env.post({ action: 'me' }, { token: 'ana-jwt' }))
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.affiliate.email, ana.email)
  assert.strictEqual(r.body.commissions.length, 1)
  assert.strictEqual(r.body.commissions[0].amount, '59.80')
  assert.strictEqual(r.body.payouts.length, 1)
  assert.strictEqual(r.body.payouts[0].external_reference, 'WISE-1')
  assert.strictEqual(r.body.conversions.length, 1)
  assert.strictEqual(r.body.conversions[0].customer_ref, 'a***@buyer.example.com')
  const meRaw = JSON.stringify(r.body)
  for (const forbidden of ['customer_email', 'stripe_customer', 'stripe_invoice', 'external_customer_id', 'ip_hash', 'idempotency_key', ben.email, 'BEN20']) {
    assert.ok(!meRaw.includes(forbidden), `portal "me" must not carry ${forbidden}`)
  }
  ok('Ana sees exactly her own commission, payout and conversion, with masked customer refs and no Stripe ids')
  r = await call(portal, env.post({ action: 'me' }, { token: 'ben-jwt' }))
  assert.strictEqual(r.body.commissions.length, 1)
  assert.strictEqual(r.body.commissions[0].amount, '20.00')
  assert.strictEqual(r.body.payouts[0].id, bBen.id)
  ok('Ben sees only his')
  r = await call(portal, env.post({ action: 'document_url', batch_id: bBen.id, path: `${ben.id}/y/inv-ben.pdf` }, { token: 'ana-jwt' }))
  assert.strictEqual(r.status, 404)
  r = await call(portal, env.post({ action: 'upload_url', batch_id: bBen.id, filename: 'x.pdf' }, { token: 'ana-jwt' }))
  assert.strictEqual(r.status, 404)
  r = await call(portal, env.post({ action: 'attach_document', batch_id: bAna.id, path: `${ben.id}/y/inv-ben.pdf`, name: 'steal.pdf' }, { token: 'ana-jwt' }))
  assert.strictEqual(r.status, 400)
  r = await call(portal, env.post({ action: 'document_url', batch_id: bAna.id, path: `${ana.id}/x/inv-ana.pdf` }, { token: 'ana-jwt' }))
  assert.strictEqual(r.status, 200)
  assert.ok(r.body.url.includes(`${ana.id}/x/inv-ana.pdf`))
  ok("Ana cannot open, upload to, or attach into Ben's payout; her own document works")

  section('conversion API (program api key)')
  r = await call(conversions, env.post({ idempotency_key: 'x', conversion_type: 'sale' }, { origin: null }))
  assert.strictEqual(r.status, 401)
  r = await call(conversions, env.post({ idempotency_key: 'x', conversion_type: 'sale' }, { token: 'not-a-key', origin: null }))
  assert.strictEqual(r.status, 401)
  const wrong = core.makeApiKey('brandgeo')
  r = await call(conversions, env.post({ idempotency_key: 'x', conversion_type: 'sale' }, { token: wrong, origin: null }))
  assert.strictEqual(r.status, 401)
  assert.deepStrictEqual(r.body, { error: 'unauthorized' })
  ok('conversion API: 401 without a key, for a malformed key, and for a well-formed unknown key, with a fixed body')
  r = await call(conversions, env.post({ idempotency_key: 'x', conversion_type: 'sale', program: 'private-one', affiliate_code: 'ANA10' }, { token: key, origin: null }))
  assert.strictEqual(r.status, 400)
  assert.match(r.body.error, /does not match/)
  ok('the key pins the program: a body naming another program is refused')
  r = await call(conversions, env.post({ idempotency_key: 'x', conversion_type: 'sale', affiliate_code: 'ANA10', amount: '10.00' }, { headers: { 'x-api-key': key }, origin: null }))
  assert.strictEqual(r.status, 201)
  ok('X-Api-Key works as an alternative to the Bearer header')
  const rows = db.rows('affiliate_commissions')
  assert.strictEqual(rows[rows.length - 1].amount_cents, 200)
  ok('and the commission was computed server side (20% of 10.00)')

  section('public endpoints')
  r = await call(apply, env.post({ program: 'brandgeo' }, { origin: 'https://evil.example.com' }))
  assert.strictEqual(r.status, 403)
  r = await call(programsPublic, env.get('/x', { headers: { origin: 'https://evil.example.com' } }))
  assert.strictEqual(r.status, 403)
  ok('the public form and program list refuse a foreign origin')
  r = await call(programsPublic, env.get('/x', { headers: { origin: 'https://getbrandgeo.com' } }))
  assert.strictEqual(r.status, 200)
  assert.deepStrictEqual(r.body.programs.map((p) => p.slug), ['brandgeo'])
  const pubRaw = JSON.stringify(r.body)
  for (const forbidden of ['api_key', 'created_by', 'notes', 'clicks']) assert.ok(!pubRaw.includes(forbidden), `public list must not carry ${forbidden}`)
  assert.strictEqual(r.body.programs[0].commission_summary, '20% of the first payment')
  ok('the public list shows active public programs only, with the public shape')
  r = await call(redirect, env.get('/r/brandgeo/ANA10', { method: 'POST' }))
  assert.strictEqual(r.status, 405)
  r = await call(redirect, env.get('/r/brandgeo/ANA10', { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0)', origin: 'https://anything.example.com' } }))
  assert.strictEqual(r.status, 302)
  ok('the redirect takes GET from anywhere (it is a link) and refuses other methods')

  console.log(`\n${passed} checks passed`)
}

main().catch((e) => { console.error(e); process.exit(1) })
