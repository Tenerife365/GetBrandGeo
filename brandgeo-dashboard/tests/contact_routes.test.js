/**
 * contact_routes.test.js -- guards netlify/functions/_contact_routes.js, the
 * parsing half of the contact route resolver (packet 019).
 * Run: `node tests/contact_routes.test.js` (exits non-zero on failure).
 *
 * WHY THIS SHAPE. Same pattern as every other test here: import pure
 * functions and call them, no network, no Supabase, no mocking. All fetching
 * lives in resolve-contact-routes.js and none of it is exercised here.
 *
 * WHAT THIS TEST IS REALLY FOR. The danger with a resolver is not that it
 * crashes, it is that it quietly produces a plausible wrong address that
 * someone then mails. So most assertions below are about what must NOT come
 * out: no pattern guesses, no vendor addresses, no asset filenames, and above
 * all not the glood.ai spam trap. A resolver that finds nothing is fine. One
 * that finds something wrong is worse than useless, because a guess written
 * into a database column stops looking like a guess very quickly.
 *
 * The HTML fixtures below are reduced from the real pages named in
 * docs/growth/outbound/founder-batch-01-2026-08-15.md section B, keeping the
 * exact markup shapes that mattered.
 */
const assert = require('assert')
const path = require('path')

const MOD = path.join(__dirname, '..', 'netlify', 'functions', '_contact_routes.js')
const {
  candidatePaths, normaliseDomain, classifyEmailKind, isExcluded, extractEmails,
  extractProfileUrls, extractPlayStoreUrl, extractSplitLiteralEmails, scoreConfidence,
  playSearchUrl, extractPlayAppIds, playListingMatches,
  mergeCandidates, isOwnDomainSource,
} = require(MOD)

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)
const values = (list, kind) => list.filter((c) => c.kind === kind).map((c) => c.value)

async function run() {
  section('candidatePaths: own domain only, normalised, no guessing at subdomains')
  {
    const paths = candidatePaths('easydvm.com')
    assert.ok(paths.length >= 10, 'expected at least 10 candidate paths')
    assert.strictEqual(paths[0], 'https://easydvm.com')
    assert.ok(paths.includes('https://easydvm.com/privacy-policy'))
    assert.ok(paths.includes('https://easydvm.com/help/contact'))
    ok('candidatePaths returns the documented own-domain path list')

    assert.deepStrictEqual(candidatePaths('https://www.EasyDVM.com/vet/'), candidatePaths('easydvm.com'))
    ok('protocol, www and a trailing path all normalise to the same domain')

    assert.deepStrictEqual(candidatePaths('not-a-domain'), [])
    assert.deepStrictEqual(candidatePaths(null), [])
    assert.deepStrictEqual(candidatePaths(42), [])
    ok('an unparseable domain returns [] rather than throwing, so one bad row cannot fail a batch')
    assert.strictEqual(normaliseDomain('  WWW.Smilenotes.CO.UK  '), 'smilenotes.co.uk')
    ok('normaliseDomain trims, lowercases and strips www')
  }

  section('classifyEmailKind: role addresses reach a queue, individuals reach a person')
  {
    for (const role of ['info', 'contact', 'support', 'sales', 'care', 'help', 'privacy', 'legal', 'gdpr', 'admin', 'team']) {
      assert.strictEqual(classifyEmailKind(`${role}@example.org`), 'role', `${role} should be role`)
    }
    ok('every documented role local part classifies as role')

    assert.strictEqual(classifyEmailKind('nithy@pagelightprime.com'), 'individual')
    assert.strictEqual(classifyEmailKind('jsteele@beermannlaw.com'), 'individual')
    ok('the two genuinely individual addresses from the sent batch classify as individual')

    assert.strictEqual(classifyEmailKind('sales-uk@example.org'), 'role')
    assert.strictEqual(classifyEmailKind('support.team@example.org'), 'role')
    ok('compound role addresses such as sales-uk@ and support.team@ are still role')

    assert.strictEqual(classifyEmailKind('care@easydvm.com'), 'role')
    ok('care@easydvm.com is role even though a three-person company means the founder reads it')
  }

  section('isExcluded: the things that must never become a candidate')
  {
    assert.strictEqual(isExcluded('zajifewluapda@gmail.com'), true)
    ok('the glood.ai spam trap is excluded by literal, the single most important assertion here')

    for (const asset of ['logo@2x.png', 'sprite@3x.jpg', 'icon@2x.svg', 'app@2x.css']) {
      assert.strictEqual(isExcluded(asset), true, `${asset} should be excluded`)
    }
    ok('asset filenames that regex as addresses (logo@2x.png) are excluded by TLD')

    for (const vendor of ['a@sentry.io', 'x@wixpress.com', 'y@squarespace.com', 'z@example.com', 'q@schema.org']) {
      assert.strictEqual(isExcluded(vendor), true, `${vendor} should be excluded`)
    }
    ok('vendor, CDN and boilerplate domains are excluded')

    for (const nr of ['noreply@realcompany.com', 'no-reply@realcompany.com', 'postmaster@realcompany.com']) {
      assert.strictEqual(isExcluded(nr), true, `${nr} should be excluded`)
    }
    ok('noreply and postmaster addresses are excluded, they are not contact routes')

    assert.strictEqual(isExcluded('0123456789abcdef0123@sentry.wixpress.com'), true)
    ok('a hex-key local part (a Sentry DSN) is excluded')

    assert.strictEqual(isExcluded('nithy@pagelightprime.com'), false)
    assert.strictEqual(isExcluded('privacy@smilenotes.co.uk'), false)
    assert.strictEqual(isExcluded('jsteele@beermannlaw.com'), false)
    ok('genuine addresses from the sent batch are NOT excluded, including an off-domain individual one')

    for (const junk of ['', null, undefined, 42, 'notanemail', 'a@b']) {
      assert.strictEqual(isExcluded(junk), true, `${JSON.stringify(junk)} should be excluded`)
    }
    ok('empty, non-string and malformed input is excluded rather than crashing')
  }

  section('extractEmails: mailto hrefs and bare text, with provenance')
  {
    const html = `
      <html><body>
        <p>Email: <a href="mailto:care@easydvm.com">care@easydvm.com</a></p>
        <p>Billing questions go to accounts@easydvm.com.</p>
        <img src="/img/logo@2x.png">
        <script src="https://o1.ingest.sentry.io/api"></script>
      </body></html>`
    const src = 'https://easydvm.com/vet/contact.php'
    const got = extractEmails(html, src)
    const vals = got.map((c) => c.value)

    assert.ok(vals.includes('care@easydvm.com'), 'expected the mailto address')
    assert.ok(vals.includes('accounts@easydvm.com'), 'expected the bare-text address')
    ok('both a mailto href and a bare address in prose are found')

    assert.ok(!vals.some((v) => v.includes('2x.png')), 'logo@2x.png leaked through')
    ok('the asset filename in the same document does not leak through')

    assert.strictEqual(new Set(vals).size, vals.length)
    ok('an address written twice on one page yields one candidate, not two')

    for (const c of got) {
      assert.strictEqual(c.source_url, src)
      assert.strictEqual(c.kind, 'email')
      assert.ok(c.email_kind === 'individual' || c.email_kind === 'role')
    }
    ok('every candidate carries the exact source URL it was seen at, which is the whole provenance rule')

    const trailing = extractEmails('<p>Write to care@easydvm.com.</p>', src)
    assert.deepStrictEqual(trailing.map((c) => c.value), ['care@easydvm.com'])
    ok('a trailing full stop is stripped rather than becoming part of the address')

    assert.deepStrictEqual(extractEmails('', src), [])
    assert.deepStrictEqual(extractEmails(null, src), [])
    ok('empty or non-string HTML returns [] rather than throwing')
  }

  section('extractEmails: the smilenotes.co.uk split-literal obfuscation')
  {
    // Their own published literals, assembled in page script behind a mailto:
    // link, with a <noscript> reading "Email address protected by JavaScript".
    const html = `
      <script>
        var em1 = "privacy";
        var em2 = "@";
        var em3 = "smilenotes.co.uk";
        document.write('<a href="mailto:' + em1 + em2 + em3 + '">click here to email us</a>');
      </script>
      <noscript>Email address protected by JavaScript</noscript>`
    const src = 'https://smilenotes.co.uk/privacy'

    assert.deepStrictEqual(extractSplitLiteralEmails(html), ['privacy@smilenotes.co.uk'])
    ok('the split-literal address is reassembled from published strings the company itself serves')

    const vals = extractEmails(html, src).map((c) => c.value)
    assert.ok(vals.includes('privacy@smilenotes.co.uk'))
    ok('extractEmails surfaces it end to end, with smilenotes.co.uk/privacy as the source')

    // Generic, not name-matched: different variable names must still work.
    const generic = `<script>var a="hello"; var b="@"; var c="vibefam.com";</script>`
    assert.deepStrictEqual(extractSplitLiteralEmails(generic), ['hello@vibefam.com'])
    ok('reassembly keys off a literal "@" and its neighbours, not off variable names')

    assert.deepStrictEqual(extractSplitLiteralEmails('<script>var x="@";</script>'), [])
    ok('a lone "@" literal with no usable neighbours produces nothing rather than junk')
  }

  section('extractProfileUrls: personal profiles only, normalised')
  {
    const html = `
      <a href="https://www.linkedin.com/in/lawcusharry/">Harry</a>
      <a href="https://linkedin.com/company/lawcus">Company page</a>
      <a href="https://twitter.com/LawcusHQ">Twitter</a>
      <a href="https://x.com/intent/tweet?text=hi">Share</a>
      <a href="https://x.com/home">Home</a>`
    const got = extractProfileUrls(html, 'https://lawcus.com/meet-the-team/')

    assert.deepStrictEqual(values(got, 'linkedin'), ['https://www.linkedin.com/in/lawcusharry/'])
    ok('a LinkedIn /in/ profile is captured')

    assert.ok(!got.some((c) => c.value.includes('/company/')))
    ok('a LinkedIn /company/ page is NOT captured: a Company Page cannot message an individual, so it is not a contact route')

    assert.ok(values(got, 'x').includes('https://x.com/LawcusHQ'))
    ok('a twitter.com handle is captured and normalised to x.com')

    const xs = values(got, 'x')
    assert.ok(!xs.some((v) => /\/(intent|home)$/i.test(v)))
    ok('x.com/intent and x.com/home are filtered, they are not accounts')

    const regional = extractProfileUrls('<a href="https://sg.linkedin.com/in/serenelimshuying">S</a>', 'https://vibefam.com/team/serenelim/')
    assert.deepStrictEqual(values(regional, 'linkedin'), ['https://www.linkedin.com/in/serenelimshuying/'])
    ok('a regional LinkedIn host (sg.linkedin.com) normalises to the canonical www URL')
  }

  section('extractProfileUrls: a profile linked only from an escaped JSON blob is still found')
  {
    // Added 2026-08-24. Both patterns in extractProfileUrls need literal
    // slashes, so a profile published only inside a JSON blob returned []
    // and the page read as linking nobody. This is the common shape, not an
    // exotic one: PHP's json_encode escapes "/" by default, so WordPress and
    // most PHP sites emit their JSON-LD "sameAs" block exactly like this.
    //
    // String.raw is load bearing. Written as a normal quoted string, "\/"
    // collapses to "/" at parse time and the fixture silently stops testing
    // anything, so the escape is asserted before it is used.
    const ESCAPED = String.raw`<script type="application/ld+json">{"sameAs":["https:\/\/www.linkedin.com\/in\/janedev","https:\/\/x.com\/janedev"]}</script>`
    assert.ok(ESCAPED.includes('\\/'), 'the fixture must really contain a backslash-escaped slash')
    ok('the escaped fixture carries a literal backslash, not a parse-time collapsed one')

    const src = 'https://casepacer.com/about'
    const got = extractProfileUrls(ESCAPED, src)
    assert.deepStrictEqual(values(got, 'linkedin'), ['https://www.linkedin.com/in/janedev/'])
    assert.deepStrictEqual(values(got, 'x'), ['https://x.com/janedev'])
    ok('a LinkedIn profile and an X handle inside an escaped JSON-LD sameAs block are both recovered')

    // The strongest form of the guarantee: escaping must make no difference
    // at all, so the escaped page and the same page written plainly must
    // produce byte-identical candidates.
    const PLAIN = ESCAPED.replace(/\\\//g, '/')
    assert.notStrictEqual(PLAIN, ESCAPED, 'the plain fixture must actually differ from the escaped one')
    assert.deepStrictEqual(extractProfileUrls(ESCAPED, src), extractProfileUrls(PLAIN, src))
    ok('an escaped page and its unescaped equivalent yield identical candidates')

    // Unescaping must not smuggle anything past the two filters that already
    // exist, so both are re-run in escaped form.
    const company = extractProfileUrls(String.raw`<a href="https:\/\/linkedin.com\/company\/lawcus">Company</a>`, src)
    assert.deepStrictEqual(values(company, 'linkedin'), [])
    ok('an escaped LinkedIn /company/ URL is still NOT a contact route, same as the plain form')

    const reserved = extractProfileUrls(String.raw`<a href="https:\/\/x.com\/intent\/tweet?text=hi">Share</a>`, src)
    assert.deepStrictEqual(values(reserved, 'x'), [])
    ok('an escaped x.com/intent share link is still filtered as a reserved path, not read as an account')

    assert.deepStrictEqual(extractProfileUrls('', src), [])
    assert.deepStrictEqual(extractProfileUrls(null, src), [])
    ok('empty or non-string HTML still returns [] rather than throwing')
  }

  section('extractPlayStoreUrl: the only source that ever yielded PageLightPrime')
  {
    const html = `<a href="https://play.google.com/store/apps/details?id=com.pagelightprime.mobileapp&hl=en">Get it on Google Play</a>`
    assert.strictEqual(
      extractPlayStoreUrl(html),
      'https://play.google.com/store/apps/details?id=com.pagelightprime.mobileapp'
    )
    ok('a Play listing link is found and stripped to its canonical id form')

    assert.strictEqual(extractPlayStoreUrl('<p>no app here</p>'), null)
    assert.strictEqual(extractPlayStoreUrl(null), null)
    ok('no Play link returns null')
  }

  section('scoreConfidence: describes how well sourced, never whether it is the right person')
  {
    const own = 'pagelightprime.com'
    assert.strictEqual(scoreConfidence(['https://pagelightprime.com/privacy-statement/', 'https://pagelightprime.com/contact'], own), 'high')
    ok('two distinct own-domain sources scores high')

    assert.strictEqual(scoreConfidence(['https://pagelightprime.com/privacy-statement/'], own), 'medium')
    ok('one own-domain source scores medium')

    assert.strictEqual(
      scoreConfidence(['https://play.google.com/store/apps/details?id=com.pagelightprime.mobileapp'], own),
      'medium'
    )
    ok('a Play developer contact block scores medium, the documented deviation from packet 019, because Google verifies it')

    assert.strictEqual(scoreConfidence(['https://somedirectory.example/listing'], own), 'low')
    ok('anywhere else scores low')

    assert.strictEqual(scoreConfidence([], own), 'low')
    ok('no source at all scores low rather than throwing')

    assert.strictEqual(isOwnDomainSource('https://www.pagelightprime.com/x', 'pagelightprime.com'), true)
    assert.strictEqual(isOwnDomainSource('https://evil.com/pagelightprime.com', 'pagelightprime.com'), false)
    ok('own-domain matching is on host, so a lookalike path cannot pass as a page on the company own domain')
  }

  section('mergeCandidates: dedupe across pages, corroboration raises confidence')
  {
    const own = 'pureclarity.com'
    const raw = [
      { kind: 'email', value: 'sales@pureclarity.com', source_url: 'https://www.pureclarity.com/contact-us/', email_kind: 'role' },
      { kind: 'email', value: 'sales@pureclarity.com', source_url: 'https://www.pureclarity.com/about-us/', email_kind: 'role' },
      { kind: 'email', value: 'john@pureclarity.com', source_url: 'https://www.pureclarity.com/about-us/', email_kind: 'individual' },
      { kind: 'linkedin', value: 'https://www.linkedin.com/in/john-barton-9067bb22/', source_url: 'https://www.pureclarity.com/about-us/' },
    ]
    const merged = mergeCandidates(raw, own)

    assert.strictEqual(merged.filter((c) => c.value === 'sales@pureclarity.com').length, 1)
    ok('the same address seen on two pages becomes one candidate, not two')

    const sales = merged.find((c) => c.value === 'sales@pureclarity.com')
    assert.strictEqual(sales.confidence, 'high')
    assert.strictEqual(sales.source_count, 2)
    ok('corroboration across two own-domain pages raises it to high and records source_count 2')

    const john = merged.find((c) => c.value === 'john@pureclarity.com')
    assert.strictEqual(john.confidence, 'medium')
    ok('a single-source address stays medium')

    const emails = merged.filter((c) => c.kind === 'email')
    assert.strictEqual(emails[0].email_kind, 'individual')
    ok('individual addresses sort ahead of role addresses, so the reviewer sees the useful row first')

    assert.ok(merged.every((c) => typeof c.source_url === 'string' && c.source_url.length > 0))
    ok('every merged candidate still carries a source URL: a candidate without provenance must be unrepresentable')

    assert.deepStrictEqual(mergeCandidates([], own), [])
    assert.deepStrictEqual(mergeCandidates(null, own), [])
    ok('empty input merges to empty rather than throwing')
  }

  section('Placeholder addresses: template examples must not become contact routes')
  {
    // Found live on 2026-08-16: vibefam.com publishes you@studio.com inside a
    // form example, and it regexes identically to a real address.
    assert.strictEqual(isExcluded('you@studio.com'), true)
    ok('you@studio.com, a real form placeholder found on vibefam.com, is excluded')

    for (const p of ['your@x.com', 'yourname@x.com', 'name@x.com', 'firstname@x.com', 'user@x.com', 'example@x.com', 'johndoe@x.com']) {
      assert.strictEqual(isExcluded(p), true, `${p} should be excluded`)
    }
    ok('the placeholder local-part list is excluded')

    assert.strictEqual(isExcluded('harry@lawcus.com'), false)
    ok('a real first-name address is NOT caught by the placeholder filter')
  }

  section('Foreign-domain role addresses rank last without being thrown away')
  {
    // pagelightprime.com publishes privacy@elite.com on its privacy statement,
    // copied boilerplate. Found live on 2026-08-16.
    const merged = mergeCandidates([
      { kind: 'email', value: 'privacy@elite.com', source_url: 'https://pagelightprime.com/privacy-statement', email_kind: 'role' },
      { kind: 'email', value: 'info@pagelightprime.com', source_url: 'https://pagelightprime.com/contact', email_kind: 'role' },
    ], 'pagelightprime.com')

    const foreign = merged.find((c) => c.value === 'privacy@elite.com')
    assert.strictEqual(foreign.confidence, 'low')
    ok('a role address on a foreign domain is downgraded to low, since it is nearly always copied boilerplate')

    assert.strictEqual(merged.find((c) => c.value === 'info@pagelightprime.com').confidence, 'medium')
    ok('an own-domain role address keeps its normal confidence')

    // The same shape was LEGITIMATE for Glood.AI, which is why this downgrades
    // rather than excludes: support@loopclub.io is the correct route because
    // Loopclub Ltd is the entity behind glood.ai.
    const glood = mergeCandidates([
      { kind: 'email', value: 'support@loopclub.io', source_url: 'https://glood.ai/privacy', email_kind: 'role' },
    ], 'glood.ai')
    assert.strictEqual(glood.length, 1)
    assert.strictEqual(glood[0].value, 'support@loopclub.io')
    ok('the identical shape is kept, not deleted: the real Glood.AI address is a foreign-domain role address')

    const individual = mergeCandidates([
      { kind: 'email', value: 'jsteele@beermannlaw.com', source_url: 'https://intellibill.io/about', email_kind: 'individual' },
    ], 'intellibill.io')
    assert.strictEqual(individual[0].confidence, 'medium')
    ok('a foreign-domain INDIVIDUAL address is never downgraded: jsteele@beermannlaw.com was the best address in the batch')
  }

  section('Play Store: search proposes, the listing content decides')
  {
    assert.ok(playSearchUrl('PageLightPrime').startsWith('https://play.google.com/store/search?q=PageLightPrime'))
    assert.strictEqual(playSearchUrl(''), null)
    assert.strictEqual(playSearchUrl(null), null)
    ok('playSearchUrl builds a Play app search and returns null for empty input')

    const searchHtml = `
      <a href="/store/apps/details?id=com.unrelated.one">x</a>
      <a href="/store/apps/details?id=com.pagelightprime.mobileapp">y</a>
      <a href="/store/apps/details?id=com.unrelated.one">dupe</a>`
    const ids = extractPlayAppIds(searchHtml)
    assert.deepStrictEqual(ids, ['com.unrelated.one', 'com.pagelightprime.mobileapp'])
    ok('app ids are extracted in order and deduplicated')

    // This is the assertion that keeps the Play path honest. A live search for
    // "PageLightPrime" on 2026-08-16 returned twelve apps, eleven unrelated.
    assert.strictEqual(playListingMatches('<div>PAGELIGHTPRIME INC pagelightprime.com</div>', 'pagelightprime.com'), true)
    ok('a listing that publishes the prospect own domain is accepted')

    assert.strictEqual(playListingMatches('<div>Some other developer, otherapp.io</div>', 'pagelightprime.com'), false)
    ok('a listing that does NOT reference the prospect domain is rejected, so a name-search hit alone can never attach an address')

    assert.strictEqual(playListingMatches('', 'pagelightprime.com'), false)
    assert.strictEqual(playListingMatches('<div>anything</div>', null), false)
    ok('empty listing HTML or an unparseable domain rejects rather than throwing')
  }


  section('Role list widened after the 2026-08-16 sweep of all 43 new prospects')
  {
    // Every one of these was classified individual by the first version, which
    // overstated how many prospects had a real person to write to. All observed
    // live on the domains named.
    const observed = {
      'helpdesk@denovobi.com': 'denovobi.com',
      'dataprivacy@getvero.com': 'getvero.com',
      'events@prejmer-raceway.com': 'prejmer-raceway.com',
      'success@maropost.com': 'maropost.com',
      'agent@layla.ai': 'layla.ai',
      'booking@weroad.com': 'weroad.com',
      'resumes@financial-cents.com': 'financial-cents.com',
      'intake@vanstoneinjury.law': 'casepacer.com',
      'apps@myleanlaw.com': 'leanlaw.co',
    }
    for (const addr of Object.keys(observed)) {
      assert.strictEqual(classifyEmailKind(addr), 'role', addr + ' should be role')
    }
    ok('the nine addresses the first sweep misclassified as individual are now role')

    assert.strictEqual(classifyEmailKind('adam@hoowla.com'), 'individual')
    assert.strictEqual(classifyEmailKind('k.makarov@sendpulse.com'), 'individual')
    ok('the genuinely individual addresses found in that same sweep are still individual')

    assert.strictEqual(isExcluded('jane@store.com'), true)
    ok('jane@store.com, an illustration inside a personalizerai.com screenshot, is excluded as a demo domain')
  }

  section('The negative guarantee: nothing in this module can invent an address')
  {
    const mod = require(MOD)
    const names = Object.keys(mod).join(' ').toLowerCase()
    for (const forbidden of ['guess', 'permut', 'pattern', 'generateemail', 'composeemail']) {
      assert.ok(!names.includes(forbidden), `_contact_routes.js exports something named like "${forbidden}"`)
    }
    ok('no exported function is named for guessing, permuting or generating an address')

    // A page naming a person but publishing no address must yield no email.
    const html = '<h1>About John Powell</h1><p>Founder and SaaS Entrepreneur</p>'
    assert.deepStrictEqual(extractEmails(html, 'https://driveschoolpro.com/about/'), [])
    ok('a page that names a founder but publishes no address yields ZERO email candidates, never john@driveschoolpro.com')
  }

  console.log(`\n${passed} assertions passed.`)
}

run().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
