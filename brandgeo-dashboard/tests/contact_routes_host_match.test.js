/**
 * contact_routes_host_match.test.js -- regression test for review finding F6
 * (docs/qa/contact-routes-and-reply-handling-review-2026-08-20.md), guarding
 * netlify/functions/_contact_routes.js's playListingMatches().
 * Run: `node tests/contact_routes_host_match.test.js` (exits non-zero on
 * failure).
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM contact_routes.test.js. The finding is
 * narrow and dangerous enough to deserve its own guard rather than being
 * folded into the general suite: playListingMatches() used to be a bare
 * substring test (`html.toLowerCase().includes(domain)`), so any listing
 * whose HTML happened to contain the prospect's domain as a substring of a
 * longer string was accepted as verified. A live Play name search for
 * "PageLightPrime" returned twelve apps, eleven unrelated, and this guard is
 * the only thing standing between that noise and a stranger's
 * Google-verified developer contact address being staged against the wrong
 * prospect. The fix requires a host boundary match, the same rule
 * isOwnDomainSource() already uses (h === d || h.endsWith('.' + d)), via the
 * shared hostMatchesDomain() helper.
 *
 * EXTENDED 2026-08-22 after a second adversarial review round found F6 was
 * not actually closed (blocker-1: BARE_HOST_RE's boundary character class
 * excluded "-" from the disallowed set but nothing else, so underscore and
 * most punctuation were treated as valid host boundaries) and a second,
 * related defect (blocker-2: an accepted listing licensed harvesting every
 * address on the page with no domain filter, so a domain merely mentioned in
 * a stranger's URL path, query string, fragment or userinfo section could
 * stage a stranger's address). Both are closed in _contact_routes.js and
 * resolve-contact-routes.js; the sections below pin every evidence string the
 * reviewer produced as a permanent regression. Also extended with two
 * resolveOne()-level tests (blocker-3, major-4) that stub global.fetch, the
 * same no-network technique the reviewer used, to guard the per-prospect time
 * budget actually being a deadline and every silent exit actually being
 * loud.
 *
 * EXTENDED 2026-08-24 with the other half of the same problem. The 2026-08-22
 * fix is correct and the sections above must keep passing untouched, but it
 * left two demonstrated FALSE NEGATIVES. Both fail safe in the sense that they
 * reject rather than accept, and both are still defects of exactly the kind
 * this file exists to catch: a company that DOES publish its domain on its
 * listing read as one that publishes nothing, so the resolver reports an empty
 * result that is indistinguishable from a genuine absence. The two cases are a
 * bare host followed by ordinary prose punctuation ("casepacer.com, phone
 * 555"), and a backslash-escaped URL ("https:\/\/www.casepacer.com"), which is
 * the exact form Google Play uses inside its AF_initDataCallback JSON blobs,
 * so the pages this module targets are the ones most likely to hide the domain
 * that way. The last two sections pin both, and deliberately re-run the F6 and
 * blocker-2 exploit strings through the newly widened paths to prove the
 * widening did not reopen them.
 */
const assert = require('assert')
const path = require('path')

const MOD = path.join(__dirname, '..', 'netlify', 'functions', '_contact_routes.js')
const { playListingMatches, hostMatchesDomain, extractCandidateHosts, isOwnDomainSource } = require(MOD)

const RESOLVER_MOD = path.join(__dirname, '..', 'netlify', 'functions', 'resolve-contact-routes.js')

// resolveOne() now resolves every host it is about to fetch and refuses any
// answer that is not public (review finding F7). These tests must not touch
// DNS, so they inject a lookup that reports one ordinary public address for
// whatever host is asked about. The guard itself is tested exhaustively, with
// hostile addresses, in tests/contact_routes_fetch_guard.test.js.
const PUBLIC_LOOKUP = { lookup: async () => ['93.184.216.34'] }

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

async function run() {
  section('F6 reproduced cases: the substring guard used to accept all four of these, only one is correct')
  {
    const listing1 = 'Developer website: https://www.casepacer.com'

    assert.strictEqual(playListingMatches(listing1, 'casepacer.com'), true)
    ok('the listing genuinely links the prospect own domain: still accepted')

    assert.strictEqual(playListingMatches(listing1, 'pacer.com'), false)
    ok('"pacer.com" is a substring of "casepacer.com" but not its host or a subdomain: now rejected')

    assert.strictEqual(playListingMatches(listing1, 'acer.com'), false)
    ok('"acer.com" is a substring of "casepacer.com" too: now rejected')

    const listing2 = 'contact dev@staircase.com'
    assert.strictEqual(playListingMatches(listing2, 'case.com'), false)
    ok('"case.com" is a substring of the email domain "staircase.com": now rejected')
  }

  section('F6 additional coverage: subdomain accepted, lookalike rejected')
  {
    assert.strictEqual(
      playListingMatches('See our app page at sub.casepacer.com for details.', 'casepacer.com'),
      true
    )
    ok('a genuine subdomain of the prospect own domain is accepted, matching isOwnDomainSource')

    assert.strictEqual(
      playListingMatches('Contact the developer at casepacer.com.evil.net', 'casepacer.com'),
      false
    )
    ok('a lookalike domain that merely starts with the prospect domain is rejected, not treated as a subdomain')
  }

  section('The email-embedded host is deliberately treated as evidence, not ignored')
  {
    // Documented choice: a developer contact email at the prospect own domain
    // is itself evidence of ownership (Google requires and verifies the Play
    // developer contact address), so it must pass the same host boundary
    // check a linked URL would.
    assert.strictEqual(
      playListingMatches('Contact the developer: support@casepacer.com', 'casepacer.com'),
      true
    )
    ok('an email at the exact prospect domain is accepted as evidence of ownership')

    assert.strictEqual(
      playListingMatches('Contact the developer: support@notcasepacer.com', 'casepacer.com'),
      false
    )
    ok('an email at an unrelated domain that merely shares a suffix run is rejected')
  }

  section('hostMatchesDomain: the single shared rule, exact match or a proper subdomain only')
  {
    assert.strictEqual(hostMatchesDomain('casepacer.com', 'casepacer.com'), true)
    assert.strictEqual(hostMatchesDomain('sub.casepacer.com', 'casepacer.com'), true)
    assert.strictEqual(hostMatchesDomain('pacer.com', 'casepacer.com'), false)
    assert.strictEqual(hostMatchesDomain('casepacer.com.evil.net', 'casepacer.com'), false)
    assert.strictEqual(hostMatchesDomain(null, 'casepacer.com'), false)
    assert.strictEqual(hostMatchesDomain('casepacer.com', null), false)
    ok('hostMatchesDomain is the one rule reused by both isOwnDomainSource and playListingMatches')

    assert.strictEqual(isOwnDomainSource('https://sub.casepacer.com/x', 'casepacer.com'), true)
    assert.strictEqual(isOwnDomainSource('https://casepacer.com.evil.net/x', 'casepacer.com'), false)
    ok('isOwnDomainSource still behaves identically after the refactor to hostMatchesDomain')
  }

  section('extractCandidateHosts: recovers hosts from URLs, bare text and email addresses alike')
  {
    const hosts = extractCandidateHosts(
      'Site: https://www.casepacer.com/about  bare: sub.casepacer.com  mail: dev@staircase.com'
    )
    assert.ok(hosts.has('casepacer.com'), 'expected the URL host, stripped of www')
    assert.ok(hosts.has('sub.casepacer.com'), 'expected the bare-text host')
    assert.ok(hosts.has('staircase.com'), 'expected the email domain as a host')
    ok('a URL, a bare hostname and an email domain are all recovered from one page')

    assert.deepStrictEqual([...extractCandidateHosts('')], [])
    assert.deepStrictEqual([...extractCandidateHosts(null)], [])
    ok('empty or non-string HTML returns an empty set rather than throwing')
  }

  section('Rejection guard: no listing HTML makes playListingMatches accept anything')
  {
    assert.strictEqual(playListingMatches('<div>Some other developer, otherapp.io</div>', 'casepacer.com'), false)
    ok('a listing referencing an unrelated domain is rejected')

    assert.strictEqual(playListingMatches('', 'casepacer.com'), false)
    assert.strictEqual(playListingMatches('<div>anything</div>', null), false)
    ok('empty listing HTML or an unparseable domain rejects rather than throwing')
  }

  section('blocker-1 regression: punctuation other than the boundary class must not leak a short domain')
  {
    // Every one of these was ACCEPTED before the 2026-08-22 fix to
    // BARE_HOST_RE, because its old boundary check only excluded
    // [A-Za-z0-9.-], leaving underscore and every other punctuation
    // character as a valid host-starting position.
    assert.strictEqual(playListingMatches('var app_pacer.com=1', 'pacer.com'), false)
    ok('a minified JS identifier (app_pacer.com) does not leak "pacer.com"')

    assert.strictEqual(playListingMatches('<div class="card__pacer.com">', 'pacer.com'), false)
    ok('a BEM class name (card__pacer.com) does not leak "pacer.com"')

    assert.strictEqual(playListingMatches('?utm_source=case_pacer.com', 'pacer.com'), false)
    ok('an analytics query param (case_pacer.com) does not leak "pacer.com"')

    assert.strictEqual(playListingMatches('{"vendor_pacer.com": 1}', 'pacer.com'), false)
    ok('a snake_case JSON key (vendor_pacer.com) does not leak "pacer.com"')

    assert.strictEqual(playListingMatches('case_pacer.com', 'pacer.com'), false)
    ok('the reviewer\'s own reproduction call, playListingMatches(\'case_pacer.com\', \'pacer.com\'), is now false')
  }

  section('blocker-2 regression: a domain merely mentioned in a URL path, query, fragment or userinfo must not verify a listing')
  {
    assert.strictEqual(
      playListingMatches('<p>Reviewed at https://appreviews.example.net/reviews/casepacer.com</p>', 'casepacer.com'),
      false
    )
    ok('a path segment naming the domain does not verify the listing')

    assert.strictEqual(
      playListingMatches('<p>Tracked via https://cdn.tracker.net/px?ref=casepacer.com&id=9</p>', 'casepacer.com'),
      false
    )
    ok('a query parameter naming the domain does not verify the listing')

    assert.strictEqual(
      playListingMatches('<p>Discussed at https://forum.example.net/t/1#casepacer.com</p>', 'casepacer.com'),
      false
    )
    ok('a URL fragment naming the domain does not verify the listing')

    assert.strictEqual(
      playListingMatches('<p>Logo: https://cdn.evil.net/logos/casepacer.com/icon.png</p>', 'casepacer.com'),
      false
    )
    ok('a domain-shaped path component of an image URL does not verify the listing')

    assert.strictEqual(playListingMatches('<p>https://casepacer.com@evil.net/</p>', 'casepacer.com'), false)
    ok('userinfo before "@" in a URL does not verify the listing (hostOf correctly resolves evil.net)')

    assert.strictEqual(
      playListingMatches(
        '<p>Compare us: https://legaltechcompare.example/head-to-head/casepacer.com</p>',
        'casepacer.com'
      ),
      false
    )
    ok('the reviewer\'s exact stranger-listing evidence string is rejected')
  }

  section('blocker-2 defense in depth: an accepted listing only ever stages own-domain addresses')
  {
    // Even if playListingMatches ever accepts a listing wrongly, resolveOne
    // must not be able to stage a foreign address from it. This exercises
    // resolveOne end to end with a stubbed fetch (no network), reproducing
    // the reviewer's "stranger listing" scenario: the only mention of the
    // prospect's domain is a comparison link, so the listing must not verify
    // and the stranger's own address must never appear in the candidates.
    const origFetch = global.fetch
    global.fetch = async (url) => {
      const u = String(url)
      if (u.includes('play.google.com/store/search')) {
        return {
          ok: true,
          status: 200,
          url: u,
          headers: { get: () => 'text/html' },
          text: async () => '<a href="/store/apps/details?id=com.otherlegal.suite">x</a>',
        }
      }
      if (u.includes('play.google.com/store/apps/details')) {
        return {
          ok: true,
          status: 200,
          url: u,
          headers: { get: () => 'text/html' },
          text: async () =>
            '<p>Compare us: https://legaltechcompare.example/head-to-head/casepacer.com</p>' +
            '<p>Contact: founder@otherlegal.example</p>',
        }
      }
      return {
        ok: true,
        status: 200,
        url: u,
        headers: { get: () => 'text/html' },
        text: async () => '<html><body>no address here</body></html>',
      }
    }
    try {
      const { resolveOne } = require(RESOLVER_MOD)
      const result = await resolveOne({ id: 3, domain: 'casepacer.com', company: 'CasePacer' }, PUBLIC_LOOKUP)
      assert.strictEqual(
        result.candidates.some((c) => c.value === 'founder@otherlegal.example'),
        false
      )
      assert.strictEqual(result.candidates.length, 0)
      ok('a stranger listing that merely mentions the domain in a comparison link stages nothing')
    } finally {
      global.fetch = origFetch
    }
  }

  section('blocker-3 regression: a truncated crawl must be loud, not identical to a genuinely empty one')
  {
    // Case A: the Play search returns several listings and every listing
    // fetch hangs (simulating a slow or unresponsive server) until the
    // per-prospect time budget forces a stop mid-scan.
    const origFetch = global.fetch
    global.fetch = async (url, opts) => {
      const u = String(url)
      if (u.includes('play.google.com/store/search')) {
        return {
          ok: true,
          status: 200,
          url: u,
          headers: { get: () => 'text/html' },
          text: async () =>
            Array.from({ length: 6 }, (_, i) => `<a href="/store/apps/details?id=com.unrelated.app${i}">x</a>`).join(''),
        }
      }
      if (u.includes('play.google.com/store/apps/details')) {
        return new Promise((_resolve, reject) => {
          const sig = opts && opts.signal
          if (sig) {
            sig.addEventListener('abort', () =>
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
            )
          }
        })
      }
      return {
        ok: true,
        status: 200,
        url: u,
        headers: { get: () => 'text/html' },
        text: async () => '<html><body>no address here</body></html>',
      }
    }
    try {
      const { resolveOne } = require(RESOLVER_MOD)
      const truncated = await resolveOne({
        id: 1,
        domain: 'truncated-crawl-test.com',
        company: 'Truncated Crawl Test',
      }, PUBLIC_LOOKUP)
      assert.strictEqual(truncated.candidates.length, 0)
      assert.ok(truncated.errors.length > 0, 'a truncated crawl must record at least one error')
      assert.ok(
        truncated.errors.some((e) => /time budget reached/.test(e)),
        'the budget-exhaustion exit must be recorded explicitly, not swallowed'
      )
      ok('a crawl truncated by the per-prospect time budget records it in errors, not silently')

      // Case B: the search genuinely returns no listings, nothing was ever
      // truncated. This must NOT read the same as case A.
      global.fetch = async (u2) => {
        const u = String(u2)
        if (u.includes('play.google.com/store/search')) {
          return { ok: true, status: 200, url: u, headers: { get: () => 'text/html' }, text: async () => '<html>no results</html>' }
        }
        return {
          ok: true,
          status: 200,
          url: u,
          headers: { get: () => 'text/html' },
          text: async () => '<html><body>no address here</body></html>',
        }
      }
      const complete = await resolveOne({ id: 2, domain: 'genuinely-empty-company.com', company: 'Genuinely Empty Company' }, PUBLIC_LOOKUP)
      assert.strictEqual(complete.candidates.length, 0)
      assert.deepStrictEqual(complete.errors, [])
      ok('a genuinely complete crawl with nothing published still reports zero errors')

      assert.notStrictEqual(truncated.errors.length, complete.errors.length)
      ok('a truncated crawl and a genuinely empty one are no longer byte-identical')
    } finally {
      global.fetch = origFetch
    }
  }

  section('major-4 regression: PER_PROSPECT_BUDGET_MS is an actual deadline, not a pre-check')
  {
    // Reproduces the reviewer's exact scenario: own pages resolve fast, the
    // Play search returns several listings, and every listing fetch hangs
    // until aborted. Before the fix this measured 24001ms
    // (PER_PROSPECT_BUDGET_MS + PER_PAGE_TIMEOUT_MS); after the fix every
    // fetch is clamped to the budget actually remaining, so the real worst
    // case is close to PER_PROSPECT_BUDGET_MS (18000ms) alone.
    const origFetch = global.fetch
    global.fetch = async (url, opts) => {
      const u = String(url)
      if (u.includes('play.google.com/store/search')) {
        return {
          ok: true,
          status: 200,
          url: u,
          headers: { get: () => 'text/html' },
          text: async () =>
            Array.from({ length: 6 }, (_, i) => `<a href="/store/apps/details?id=com.unrelated.app${i}">x</a>`).join(''),
        }
      }
      if (u.includes('play.google.com/store/apps/details')) {
        return new Promise((_resolve, reject) => {
          const sig = opts && opts.signal
          if (sig) {
            sig.addEventListener('abort', () =>
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
            )
          }
        })
      }
      return {
        ok: true,
        status: 200,
        url: u,
        headers: { get: () => 'text/html' },
        text: async () => '<html><body>no address here</body></html>',
      }
    }
    try {
      const { resolveOne } = require(RESOLVER_MOD)
      const t0 = Date.now()
      await resolveOne({ id: 4, domain: 'deadline-test-company.com', company: 'Deadline Test Company' }, PUBLIC_LOOKUP)
      const elapsed = Date.now() - t0
      // 20000ms is the assertion threshold: comfortably above the fixed
      // worst case (~18000ms plus a small margin for the abort to land) and
      // comfortably below the old, confirmed-broken worst case (24001ms).
      assert.ok(elapsed < 20000, `resolveOne took ${elapsed}ms, expected under 20000ms (old worst case was 24001ms)`)
      ok(`resolveOne's real worst case is now bounded (measured ${elapsed}ms, was 24001ms before the fix)`)
    } finally {
      global.fetch = origFetch
    }
  }

  section('2026-08-24 false negative 1: a host followed by ordinary prose punctuation is still recovered')
  {
    // Every accept below returned false before the trailing lookahead was
    // widened, so each one was a listing that publishes the prospect's own
    // domain being scored as one that publishes nothing.
    assert.strictEqual(playListingMatches('Website: casepacer.com, phone 555', 'casepacer.com'), true)
    ok('a comma after the host no longer hides it (the reported reproduction, verbatim)')

    assert.strictEqual(playListingMatches('Developer website: casepacer.com.', 'casepacer.com'), true)
    ok('a sentence-ending full stop no longer hides the host')

    assert.strictEqual(playListingMatches('Visit casepacer.com. Then call us.', 'casepacer.com'), true)
    ok('a full stop mid paragraph no longer hides the host')

    assert.strictEqual(playListingMatches('Website: casepacer.com; phone 555', 'casepacer.com'), true)
    ok('a semicolon after the host no longer hides it')

    assert.strictEqual(playListingMatches('Developer site (see casepacer.com) verified', 'casepacer.com'), true)
    ok('a closing parenthesis after the host no longer hides it')

    assert.strictEqual(playListingMatches('Developer sites: casepacer.com] end', 'casepacer.com'), true)
    ok('a closing bracket after the host no longer hides it')

    assert.strictEqual(playListingMatches('Contact us at sub.casepacer.com, or call.', 'casepacer.com'), true)
    ok('a genuine subdomain followed by punctuation is accepted, same rule as the unpunctuated case')
  }

  section('2026-08-24: widening the TRAILING side did not reopen F6 or blocker-2')
  {
    // The leading lookbehind is the half that actually closed the blocker, and
    // it is unchanged. These re-run the original exploit strings with the
    // newly accepted trailing characters appended, so a future edit that
    // relaxes the leading side to "fix" the asymmetry fails here rather than
    // in production.
    assert.strictEqual(playListingMatches('Website: casepacer.com, phone 555', 'pacer.com'), false)
    ok('the newly recovered comma case still does not leak the shorter domain "pacer.com"')

    assert.strictEqual(playListingMatches('var app_pacer.com, x=1', 'pacer.com'), false)
    assert.strictEqual(playListingMatches('?utm_source=case_pacer.com; id=9', 'pacer.com'), false)
    assert.strictEqual(playListingMatches('{"vendor_pacer.com": 1}', 'pacer.com'), false)
    ok('an underscore before the host still blocks it, with a comma, semicolon or brace after')

    assert.strictEqual(
      playListingMatches('<p>Logo: https://cdn.evil.net/logos/casepacer.com, cached</p>', 'casepacer.com'),
      false
    )
    assert.strictEqual(
      playListingMatches('<p>Compare us: https://legaltechcompare.example/head-to-head/casepacer.com.</p>', 'casepacer.com'),
      false
    )
    ok('a domain in a stranger URL path is still rejected when a comma or full stop follows it')

    assert.strictEqual(playListingMatches('Contact us at casepacer.com.evil.net, really', 'casepacer.com'), false)
    ok('the lookalike is still captured whole and still fails the suffix check, punctuation or not')

    assert.strictEqual(playListingMatches('Our logo is casepacer.com.png, see above', 'casepacer.com'), false)
    ok('a full stop followed by another label does not terminate the host early, so a filename cannot leak the domain')

    // Deliberate asymmetry, recorded so it is not "tidied up" later. Only the
    // trailing side was widened, so a host OPENED by a bracket or parenthesis
    // is still missed. Both are fail-safe misses and both are the price of the
    // blocker-1 fix: widening the leading class is exactly what reopens
    // "case_pacer.com", so it must not be done to close these. If they ever
    // need closing, it has to be by enumerating opening delimiters, never by
    // going back to "any character that is not [A-Za-z0-9.-]".
    assert.strictEqual(playListingMatches('hosts: [casepacer.com]', 'casepacer.com'), false)
    assert.strictEqual(playListingMatches('Developer site (casepacer.com) verified', 'casepacer.com'), false)
    ok('the leading lookbehind stays strict and is not to be loosened, even at the cost of these two misses')
  }

  section('2026-08-24 false negative 2: a backslash-escaped URL is recovered, as Google Play actually serves it')
  {
    // String.raw is load bearing. Written as a normal quoted string, "\/"
    // collapses to "/" at parse time and the fixture silently stops testing
    // anything, so the escape is asserted before it is used.
    const ESCAPED = String.raw`["https:\/\/www.casepacer.com"]`
    assert.ok(ESCAPED.includes('\\/'), 'the fixture must really contain a backslash-escaped slash')
    ok('the escaped fixture carries a literal backslash, not a parse-time collapsed one')

    // Before the fix this returned an empty set: ABSOLUTE_URL_RE needs a
    // literal "//" and BARE_HOST_RE correctly refuses the "/" in front of the
    // host, so nothing recovered it.
    assert.ok(extractCandidateHosts(ESCAPED).has('casepacer.com'))
    ok('extractCandidateHosts recovers the host from an escaped URL (it returned [] before)')

    assert.strictEqual(playListingMatches(ESCAPED, 'casepacer.com'), true)
    ok('a listing whose only mention of the domain is an escaped URL now verifies')

    // The real shape: Play embeds listing data in an AF_initDataCallback JSON
    // blob, which is why this case matters on the pages this module targets
    // rather than being a curiosity. The developer contact here is deliberately
    // a gmail address, both because small developers commonly list one and
    // because it makes the escaped URL the ONLY own-domain evidence on the
    // page. An earlier draft used support@casepacer.com and passed against the
    // pre-fix module, since EMAIL_RE recovers an email's domain whatever the
    // slashes around it do, so the fixture proved nothing about escaping.
    const AF = String.raw`AF_initDataCallback({key:'ds:5',data:[[["CasePacer LLC","https:\/\/www.casepacer.com\/","casepacerapp@gmail.com"]]],sideChannel:{}});`
    assert.ok(!AF.includes('@casepacer.com'), 'the blob must not carry own-domain evidence other than the escaped URL')
    assert.strictEqual(playListingMatches(AF, 'casepacer.com'), true)
    ok('a realistic AF_initDataCallback blob verifies on its escaped developer website alone')

    assert.strictEqual(playListingMatches(String.raw`["https:\/\/sub.casepacer.com\/app"]`, 'casepacer.com'), true)
    ok('an escaped subdomain URL is accepted, matching the unescaped behaviour')
  }

  section('2026-08-24: unescaping did not weaken any host boundary check')
  {
    // hostOf() still parses the recovered URL, so every blocker-2 exploit has
    // to stay closed in its escaped form too. Each of these mentions the
    // prospect domain only somewhere a URL's host is not.
    assert.strictEqual(
      playListingMatches(String.raw`["https:\/\/cdn.evil.net\/logos\/casepacer.com\/icon.png"]`, 'casepacer.com'),
      false
    )
    ok('an escaped stranger URL with the domain in its path does not verify')

    assert.strictEqual(playListingMatches(String.raw`["https:\/\/casepacer.com@evil.net\/"]`, 'casepacer.com'), false)
    ok('escaped userinfo before "@" does not verify (hostOf still resolves evil.net)')

    assert.strictEqual(
      playListingMatches(String.raw`{"u":"https:\/\/cdn.tracker.net\/px?ref=casepacer.com&id=9"}`, 'casepacer.com'),
      false
    )
    ok('an escaped tracking URL naming the domain in a query parameter does not verify')

    assert.strictEqual(
      playListingMatches(String.raw`["https:\/\/forum.example.net\/t\/1#casepacer.com"]`, 'casepacer.com'),
      false
    )
    ok('an escaped URL naming the domain in its fragment does not verify')

    assert.strictEqual(playListingMatches(String.raw`["https:\/\/www.casepacer.com"]`, 'pacer.com'), false)
    assert.strictEqual(playListingMatches(String.raw`["https:\/\/www.casepacer.com"]`, 'acer.com'), false)
    ok('the original F6 substring cases stay rejected against an escaped URL as well')

    assert.strictEqual(
      playListingMatches(String.raw`["https:\/\/www.casepacer.com.evil.net"]`, 'casepacer.com'),
      false
    )
    ok('an escaped lookalike host is still rejected rather than read as a subdomain')
  }

  console.log(`\n${passed} assertions passed.`)
}

run().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
