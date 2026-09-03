/**
 * contact_routes_fetch_guard.test.js -- guards the fetch target check that
 * closes review findings F7 (SSRF) and F5 (source_url provenance) from
 * docs/qa/contact-routes-and-reply-handling-review-2026-08-20.md.
 * Run: `node tests/contact_routes_fetch_guard.test.js` (exits non-zero on failure).
 *
 * WHAT THE TWO FINDINGS WERE. fetchPage() used `redirect: 'follow'` and
 * checked nothing about where it was going.
 *
 *   F7. normaliseDomain() only required a dot, so 127.0.0.1, 10.0.0.5,
 *       192.168.1.1 and 169.254.169.254 all parsed as domains, and any of the
 *       12 candidate paths on a prospect's own site could 302 the resolver
 *       onto an internal address. EMAIL_RE then ran over whatever came back
 *       and anything matching was staged as a candidate visible in the admin
 *       UI, with the internal URL recorded as its source. That is a read
 *       oracle onto the function's own network.
 *   F5. Because redirects were followed, res.url (which becomes source_url)
 *       could be any host at all, while the design document and packet 019
 *       both state the resolver reads only the prospect's own pages plus the
 *       Play Store. The guarantee was one of intent, not of code.
 *
 * Both are the same check in the same place, so they are one function:
 * checkFetchTarget() in netlify/functions/_contact_routes.js, which is PURE
 * (it takes the addresses the caller already resolved) so every branch below
 * runs with no network and no DNS.
 *
 * The last section drives resolveOne() end to end with a stubbed fetch and a
 * stubbed lookup, which is the part that proves the guard is actually WIRED
 * rather than merely present.
 */
const assert = require('assert')
const path = require('path')

const MOD = path.join(__dirname, '..', 'netlify', 'functions', '_contact_routes.js')
const RESOLVER_MOD = path.join(__dirname, '..', 'netlify', 'functions', 'resolve-contact-routes.js')
const { checkFetchTarget, addressIsPublic, expandIpv6 } = require(MOD)

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

const OWN = { ownDomain: 'casepacer.com' }
const PUBLIC_V4 = '93.184.216.34'

async function run() {
  section('F7: every address class the reviewer named is refused')
  {
    // The exact list from the finding, plus the IPv6 equivalents.
    const blocked = [
      ['127.0.0.1', 'loopback'],
      ['10.0.0.1', 'private class A'],
      ['172.16.0.1', 'private class B'],
      ['192.168.1.1', 'private class C'],
      ['169.254.169.254', 'link local, where cloud metadata lives'],
      ['::1', 'IPv6 loopback'],
      ['fe80::1', 'IPv6 link local'],
      ['fc00::1', 'IPv6 unique local'],
      ['ff02::1', 'IPv6 multicast'],
      ['::ffff:169.254.169.254', 'IPv4 mapped metadata address'],
      ['::', 'unspecified'],
      ['0.0.0.0', 'unspecified v4'],
      ['100.64.0.1', 'carrier grade NAT'],
      ['224.0.0.1', 'multicast v4'],
    ]
    for (const [address, why] of blocked) {
      assert.strictEqual(addressIsPublic(address), false, `${address} (${why}) was treated as public`)
      const verdict = checkFetchTarget('https://casepacer.com/contact', [address], OWN)
      assert.strictEqual(verdict.allow, false, `${address} was allowed`)
      assert.ok(/non-public address/.test(verdict.reason), `unhelpful reason for ${address}: ${verdict.reason}`)
    }
    ok(`${blocked.length} loopback, private, link local, multicast and unspecified addresses are all refused`)

    for (const address of [PUBLIC_V4, '8.8.8.8', '2606:4700::1111', '172.32.0.1', '192.169.0.1']) {
      assert.strictEqual(addressIsPublic(address), true, `${address} should be public`)
    }
    ok('ordinary public addresses stay allowed, including 172.32.x and 192.169.x just outside the private blocks')

    // An answer this function cannot classify is one it cannot vouch for.
    for (const junk of ['', 'not-an-ip', '999.1.1.1', 'localhost', null, undefined]) {
      assert.strictEqual(addressIsPublic(junk), false, `${junk} must fail closed`)
    }
    ok('an unparseable address fails CLOSED rather than being assumed public')
  }

  section('F7: a host with one bad answer among good ones is refused')
  {
    const verdict = checkFetchTarget('https://casepacer.com/contact', [PUBLIC_V4, '127.0.0.1'], OWN)
    assert.strictEqual(verdict.allow, false)
    ok('a mixed answer is refused: the next connection could pick the private one')

    assert.strictEqual(checkFetchTarget('https://casepacer.com/contact', [], OWN).allow, false)
    assert.strictEqual(checkFetchTarget('https://casepacer.com/contact', null, OWN).allow, false)
    ok('a host that resolves to nothing is refused rather than fetched anyway')
  }

  section('F7: schemes and internal names')
  {
    for (const url of ['file:///etc/passwd', 'ftp://casepacer.com/x', 'gopher://casepacer.com/', 'data:text/html,x']) {
      const v = checkFetchTarget(url, [PUBLIC_V4], OWN)
      assert.strictEqual(v.allow, false, `${url} was allowed`)
    }
    ok('only http and https are ever fetched')

    for (const url of ['http://localhost/', 'http://db.internal/', 'http://printer.local/', 'http://x.home.arpa/']) {
      assert.strictEqual(checkFetchTarget(url, [PUBLIC_V4], { ownDomain: null }).allow, false, `${url} was allowed`)
    }
    ok('internal-only names are refused before DNS even matters')

    assert.strictEqual(checkFetchTarget('not a url', [PUBLIC_V4], OWN).allow, false)
    ok('an unparseable URL is refused')
  }

  section('F5: provenance, only the prospect own domain and the Play Store')
  {
    assert.strictEqual(checkFetchTarget('https://casepacer.com/contact', [PUBLIC_V4], OWN).allow, true)
    assert.strictEqual(checkFetchTarget('https://www.casepacer.com/about', [PUBLIC_V4], OWN).allow, true)
    assert.strictEqual(checkFetchTarget('https://blog.casepacer.com/', [PUBLIC_V4], OWN).allow, true)
    ok('the own domain, its www form and a real subdomain are allowed')

    assert.strictEqual(checkFetchTarget('https://play.google.com/store/apps/details?id=x', [PUBLIC_V4], OWN).allow, true)
    ok('the Play Store, the one deliberate exception, is allowed')

    // The redirect target on another host. This is F5 itself: the resolver
    // used to follow it and record ITS url as the candidate's source_url.
    const foreign = checkFetchTarget('https://rocketreach.co/a-person-email_000000000', [PUBLIC_V4], OWN)
    assert.strictEqual(foreign.allow, false)
    assert.ok(/not the prospect's own domain/.test(foreign.reason))
    ok('a redirect target on a lead database host is refused, not followed and recorded as provenance')

    for (const url of [
      'https://casepacer.com.evil.net/contact',   // suffix lookalike
      'https://evilcasepacer.com/contact',        // prefix lookalike
      'https://pacer.com/contact',                // the F6 substring family
      'https://legaltechcompare.example/head-to-head/casepacer.com',
    ]) {
      assert.strictEqual(checkFetchTarget(url, [PUBLIC_V4], OWN).allow, false, `${url} was allowed`)
    }
    ok('lookalike hosts and a stranger URL merely naming the domain in its path are all refused')
  }

  section('F7 second entry path: an IP literal is not a domain')
  {
    const { normaliseDomain, candidatePaths } = require(MOD)
    for (const d of ['127.0.0.1', '169.254.169.254', '10.0.0.5', '192.168.1.1:8080', '[::1]', 'localhost']) {
      assert.strictEqual(normaliseDomain(d), null, `${d} still parses as a domain`)
      assert.deepStrictEqual(candidatePaths(d), [], `${d} still produced URLs to crawl`)
    }
    ok('an IP literal in prospects.domain yields no URLs at all, so nothing is even attempted')

    assert.strictEqual(normaliseDomain('casepacer.com'), 'casepacer.com')
    assert.strictEqual(normaliseDomain('https://www.CasePacer.com/contact'), 'casepacer.com')
    assert.strictEqual(normaliseDomain('example.com:8080'), 'example.com:8080')
    ok('real domains, including a host:port form, are unaffected')
  }

  section('the IPv6 expander, since every v6 decision rests on it')
  {
    assert.deepStrictEqual(expandIpv6('::1'), [0, 0, 0, 0, 0, 0, 0, 1])
    assert.deepStrictEqual(expandIpv6('fe80::1'), [0xfe80, 0, 0, 0, 0, 0, 0, 1])
    assert.deepStrictEqual(expandIpv6('::ffff:127.0.0.1'), [0, 0, 0, 0, 0, 0xffff, 0x7f00, 1])
    assert.deepStrictEqual(expandIpv6('[fe80::1]'), [0xfe80, 0, 0, 0, 0, 0, 0, 1])
    assert.deepStrictEqual(expandIpv6('fe80::1%eth0'), [0xfe80, 0, 0, 0, 0, 0, 0, 1])
    assert.strictEqual(expandIpv6('1:2:3'), null)
    assert.strictEqual(expandIpv6('::1::2'), null)
    assert.strictEqual(expandIpv6('93.184.216.34'), null)
    ok('compressed, bracketed, zone-suffixed and IPv4-mapped forms expand; malformed ones return null')
  }

  section('the guard is WIRED: resolveOne refuses a foreign redirect and says so')
  {
    const origFetch = global.fetch
    const seen = []
    // Every own-domain page 302s to a lead database, which is precisely the
    // F5 exploit path: the resolver used to follow it, harvest addresses from
    // that page, and store the foreign URL as source_url.
    global.fetch = async (url) => {
      seen.push(String(url))
      if (String(url).includes('rocketreach.co')) {
        return {
          ok: true,
          status: 200,
          url: String(url),
          headers: { get: () => 'text/html' },
          text: async () => '<p>Contact: contact@runsensible.com</p>',
        }
      }
      return {
        ok: false,
        status: 302,
        url: String(url),
        headers: { get: (h) => (h.toLowerCase() === 'location' ? 'https://rocketreach.co/a-person-email_000000000' : null) },
        text: async () => '',
      }
    }
    try {
      const { resolveOne } = require(RESOLVER_MOD)
      const result = await resolveOne(
        { id: 24, domain: 'runsensible.com', company: 'RunSensible' },
        { lookup: async () => [PUBLIC_V4] }
      )
      assert.strictEqual(result.candidates.length, 0, 'nothing may be staged from a refused host')
      assert.strictEqual(
        seen.some((u) => u.includes('rocketreach.co')),
        false,
        'the resolver must not even request the foreign host'
      )
      assert.ok(
        result.errors.some((e) => /refused host rocketreach\.co/.test(e)),
        `the refusal must be reported in errors, got: ${JSON.stringify(result.errors.slice(0, 2))}`
      )
      ok('a 302 off the prospect own domain is refused, never requested, and recorded in errors')
    } finally {
      global.fetch = origFetch
    }
  }

  section('the guard is WIRED: a same-host redirect is still followed')
  {
    const origFetch = global.fetch
    let hops = 0
    global.fetch = async (url) => {
      const u = String(url)
      if (u === 'https://runsensible.com/contact') {
        hops++
        return {
          ok: false,
          status: 301,
          url: u,
          headers: { get: (h) => (h.toLowerCase() === 'location' ? 'https://www.runsensible.com/contact-us' : null) },
          text: async () => '',
        }
      }
      if (u === 'https://www.runsensible.com/contact-us') {
        return {
          ok: true,
          status: 200,
          url: u,
          headers: { get: () => 'text/html' },
          text: async () => '<p>Write to hello@runsensible.com</p>',
        }
      }
      return { ok: true, status: 200, url: u, headers: { get: () => 'text/html' }, text: async () => '<html></html>' }
    }
    try {
      const { resolveOne } = require(RESOLVER_MOD)
      const result = await resolveOne(
        { id: 24, domain: 'runsensible.com', company: 'RunSensible' },
        { lookup: async () => [PUBLIC_V4] }
      )
      assert.ok(hops > 0, 'the redirecting page must actually have been requested')
      const hit = result.candidates.find((c) => c.value === 'hello@runsensible.com')
      assert.ok(hit, `the address behind the redirect must still be found: ${JSON.stringify(result.candidates)}`)
      assert.strictEqual(hit.source_url, 'https://www.runsensible.com/contact-us')
      ok('an apex to www redirect on the prospect own domain is followed, and source_url is the URL actually fetched')
    } finally {
      global.fetch = origFetch
    }
  }

  // N3 (2026-09-03 re-review): NAT64 and 6to4 forms embed an IPv4 address.
  {
    for (const ip of [
      '64:ff9b::7f00:1',
      '64:ff9b::a00:5',
      '64:ff9b::c0a8:101',
      '64:ff9b::a9fe:a9fe',
      '2002:7f00:1::',
      '2002:a00:5::1',
      '64:ff9b:1::5db8:d822',
    ]) {
      assert.strictEqual(addressIsPublic(ip), false, ip)
    }
    ok('NAT64 and 6to4 literals embedding 127.0.0.1, 10.0.0.5, 192.168.1.1 and 169.254.169.254, and the local-use NAT64 prefix, are not public')
    for (const ip of ['64:ff9b::5db8:d822', '2002:5db8:d822::']) {
      assert.strictEqual(addressIsPublic(ip), true, ip)
    }
    ok('NAT64 and 6to4 literals embedding a public address stay public, so the rule is not a blanket block')
  }

  // N1 (2026-09-03 re-review): the DNS phase runs inside the per-page budget.
  {
    const { fetchPage } = require(RESOLVER_MOD)
    const origFetch = global.fetch
    let fetched = false
    global.fetch = async () => {
      fetched = true
      throw new Error('fetch must not run after the deadline')
    }
    try {
      const started = Date.now()
      const slowLookup = () => new Promise((resolve) => setTimeout(() => resolve([PUBLIC_V4]), 1500))
      const result = await fetchPage('https://casepacer.com/contact', 200, { ownDomain: 'casepacer.com', lookup: slowLookup })
      const elapsed = Date.now() - started
      assert.strictEqual(result.error, 'timeout')
      assert.ok(elapsed < 1200, `expected the deadline to win, took ${elapsed}ms`)
      assert.strictEqual(fetched, false)
    } finally {
      global.fetch = origFetch
    }
    ok('a DNS lookup slower than the page budget returns timeout at the deadline and never reaches fetch')
  }

  console.log(`\n${passed} assertions passed.`)
}

run().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
