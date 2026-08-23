/**
 * resolve-contact-routes.js -- admin-only contact route resolver. Packet 019.
 *
 *   POST { prospect_ids: number[] }   (max 10)   -> 200 { results: Result[] }
 *   POST { prospect_id: number }                 -> 200 { results: Result[] }
 *
 *   Result = {
 *     prospect_id, domain, pages_fetched, candidates: Candidate[],
 *     written: number, errors: string[]
 *   }
 *   Candidate = { kind, value, source_url, confidence, source_count, email_kind? }
 *
 * WHY THIS EXISTS. Measured 2026-08-16: all 43 prospects at stage='new' have
 * zero contact routes, while 43 of 43 already carry an audit_token and 40 of
 * 43 have named competitors. The evidence is paid for and the address is
 * missing, so there is nobody to write to. The nine prospects contacted that
 * day were the only rows with a route and that research was done by hand, one
 * company at a time, over most of a session.
 *
 * WHAT IT WILL NOT DO, and these are the load bearing constraints:
 *
 *   1. It never guesses. There is no pattern generation anywhere in this
 *      function or in _contact_routes.js. No firstname@, no f.last@, no
 *      permutations, no MX probing to test a guess. If a company publishes no
 *      address, the correct output is no candidate. Eight of the nine
 *      companies in the last batch published no individual address at all, so
 *      an empty result is the expected result more often than not.
 *   2. It never queries a lead database. Hunter, Apollo, RocketReach, Clearbit
 *      and Snov are excluded by standing instruction and none of their results
 *      were used in the batch this replaces.
 *   3. It NEVER writes public.prospects. Not contact_email, not linkedin_url,
 *      not x_url, and above all not x_verified or linkedin_verified. It writes
 *      only prospect_contact_candidates. Promotion is a human confirmation,
 *      because a machine can find a string on a page but cannot decide the
 *      string belongs to the person you mean. On 2026-08-15 three X accounts
 *      that looked right were impostors and one confident "wrong person"
 *      finding was itself wrong.
 *   4. It sends nothing and submits no form.
 *
 * AUTH. requireAuth({ adminOnly: true }), same gate as prospects-admin.js and
 * promotions-admin.js. This reads a service key and writes contact details for
 * named people at real companies.
 *
 * FAILURE POSTURE. One unreachable page must not fail a prospect, and one bad
 * prospect must not fail a batch of ten. Per-page failures are collected into
 * `errors` and reported; the run continues. A 5xx is reserved for a database
 * failure, and follows prospects-admin.js's fail500 shape: log the driver
 * error server side, return a fixed message plus a code, never error.message.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { parseId } = require('./prospects-admin')
const {
  candidatePaths,
  extractEmails,
  extractProfileUrls,
  extractPlayStoreUrl,
  playSearchUrl,
  extractPlayAppIds,
  playListingMatches,
  mergeCandidates,
  normaliseDomain,
  hostMatchesDomain,
} = require('./_contact_routes')

/**
 * TIME BUDGETS. netlify.toml gives this function 26s, the ceiling for a
 * synchronous Netlify function here. Everything below is set under that on
 * purpose: a platform timeout returns nothing at all, so a prospect whose
 * address was one fetch away reports as a failure with no explanation. The
 * function would rather stop early and SAY which prospects it did not reach.
 *
 * FIXED 2026-08-22 (review finding F6b, round 1). MAX_PROSPECTS_PER_CALL was
 * 3, on arithmetic that assumed PER_PROSPECT_BUDGET_MS (18000) was a
 * deadline. It was only a pre-check (see the old budgetLeft() in resolveOne):
 * a listing fetch that started at t=17.9s still ran a full
 * PER_PAGE_TIMEOUT_MS (6000) to t=23.9s, so one prospect's real worst case
 * was PER_PROSPECT_BUDGET_MS + PER_PAGE_TIMEOUT_MS = 24000ms, not 18000ms.
 * MAX_PROSPECTS_PER_CALL was set to 1 as the round 1 remedy, since two
 * prospects cannot both fit under a 22000ms invocation budget once the real
 * worst case is 24000ms.
 *
 * FIXED FURTHER 2026-08-22 (review finding major-4, round 2). Round 1's own
 * arithmetic proved more than it used: 22000 - 24000 being negative does not
 * only rule out a SECOND prospect, it proves the FIRST prospect's worst case
 * (24000ms crawl alone, before four Supabase round trips: requireAuth's
 * getUser and user_profiles lookup, the prospects select, the candidates
 * upsert) leaves under 2000ms of margin under the 26000ms platform ceiling.
 * That is close enough to real production timings to risk the whole
 * invocation being killed, which returns nothing for the one prospect in the
 * batch, the exact silent-failure mode this file exists to prevent, one layer
 * further down than round 1 closed.
 *
 * The chosen remedy is to make PER_PROSPECT_BUDGET_MS an ACTUAL deadline
 * rather than a pre-check: resolveOne's remaining() clamps every fetch after
 * the first parallel batch to the milliseconds actually left, so a fetch that
 * starts near the edge is cut short instead of being allowed to run a full
 * PER_PAGE_TIMEOUT_MS regardless of when it started. A clamped fetch that
 * aborts still returns { error: 'timeout' }, the same as any other fetch
 * failure, so this costs nothing in honesty. The real worst case for one
 * prospect drops to roughly PER_PROSPECT_BUDGET_MS (18000ms) plus a small,
 * bounded margin for the abort to land, not
 * PER_PROSPECT_BUDGET_MS + PER_PAGE_TIMEOUT_MS, which restores real margin
 * under the 26s ceiling for the Supabase round trips and Lambda cold start.
 * The rejected alternative was deleting INVOCATION_BUDGET_MS as a number the
 * code could not honour; that was not chosen because the deadline fix is a
 * bounded, low-risk change (no schema, no auth, no billing, no new env var)
 * that actually restores the safety property the constant was meant to
 * describe, rather than removing the description of a property nobody
 * enforces.
 *
 * MAX_PROSPECTS_PER_CALL stays at 1. This round fixed the deadline so the ONE
 * prospect a normal call makes actually fits with real margin; it did not
 * reopen whether a batch of more than one should be re-enabled, which is a
 * throughput decision for a separate packet. This has no UI cost either way:
 * Prospects.tsx already calls this endpoint with one prospect_id per request
 * (src/pages/Prospects.tsx), never a batch. Only a hypothetical multi-id
 * script caller is affected, and it gets an explicit 400 above the limit
 * instead of a silent truncation.
 */
const MAX_PROSPECTS_PER_CALL = 1
const MAX_PAGES_PER_PROSPECT = 12
const MAX_PLAY_LISTINGS = 6
const PER_PAGE_TIMEOUT_MS = 6000
const PER_PROSPECT_BUDGET_MS = 18000
const INVOCATION_BUDGET_MS = 22000
const MAX_HTML_BYTES = 1500000

// A real browser UA, with an honest identifying comment appended. Small sites
// behind basic bot filters return 403 to a bare fetch, which is why the plain
// research pass used a browser string; appending the identity means anyone
// reading their access log can see exactly who called and why.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0 Safari/537.36 (+BrandGEO contact route resolver; constantin@getbrandgeo.com)'

function fail500(headers, code, error, extra = {}) {
  console.error(`[resolve-contact-routes] ${code}:`, error && error.message ? error.message : error)
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: 'Internal error. Check the function logs for detail.', code, ...extra }),
  }
}

/**
 * fetchPage(url, timeoutMs) -> { url, html } | { url, error }
 * Never throws. A miss is data, not an exception.
 *
 * timeoutMs defaults to PER_PAGE_TIMEOUT_MS but callers inside resolveOne
 * clamp it to whatever is actually left of PER_PROSPECT_BUDGET_MS (review
 * finding major-4), so a fetch started near the edge of the per-prospect
 * budget cannot run a full PER_PAGE_TIMEOUT_MS past it.
 */
async function fetchPage(url, timeoutMs = PER_PAGE_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    })
    if (!res.ok) return { url, error: `HTTP ${res.status}` }
    const ctype = res.headers.get('content-type') || ''
    if (ctype && !/text\/html|application\/xhtml|text\/plain/i.test(ctype)) {
      return { url, error: `skipped content-type ${ctype.split(';')[0]}` }
    }
    const html = (await res.text()).slice(0, MAX_HTML_BYTES)
    // res.url reflects redirects, so provenance records where the string
    // actually was, not where we asked for it.
    return { url: res.url || url, html }
  } catch (e) {
    return { url, error: e && e.name === 'AbortError' ? 'timeout' : String((e && e.message) || e) }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * resolveOne(prospect) -> Result (minus `written`, which the caller fills).
 */
async function resolveOne(prospect) {
  const started = Date.now()
  // remaining() is milliseconds actually left of PER_PROSPECT_BUDGET_MS, not
  // a boolean pre-check. Review finding major-4: the old budgetLeft() only
  // gated whether a fetch was ALLOWED to start, so a fetch starting at
  // t=17.9s still ran a full PER_PAGE_TIMEOUT_MS to t=23.9s. Every fetch
  // below is clamped to min(PER_PAGE_TIMEOUT_MS, remaining()), so the real
  // worst case for this function is close to PER_PROSPECT_BUDGET_MS itself.
  const remaining = () => PER_PROSPECT_BUDGET_MS - (Date.now() - started)

  const domain = prospect.domain
  const urls = candidatePaths(domain).slice(0, MAX_PAGES_PER_PROSPECT)
  const errors = []
  const raw = []
  let pagesFetched = 0

  if (urls.length === 0) {
    return { prospect_id: prospect.id, domain, pages_fetched: 0, candidates: [], errors: ['unparseable domain'] }
  }

  const pages = await Promise.all(
    urls.map((u) => fetchPage(u, Math.min(PER_PAGE_TIMEOUT_MS, Math.max(0, remaining()))))
  )

  let playUrl = null
  for (const page of pages) {
    if (page.error) {
      errors.push(`${page.url}: ${page.error}`)
      continue
    }
    pagesFetched++
    raw.push(...extractEmails(page.html, page.url))
    raw.push(...extractProfileUrls(page.html, page.url))
    if (!playUrl) playUrl = extractPlayStoreUrl(page.html)
  }

  /**
   * The Play developer contact block is the ONLY source that ever yielded
   * nithy@pagelightprime.com, the best address in the batch already sent, so
   * this branch is load bearing rather than a nice to have. Google requires
   * and verifies a developer contact address before a listing can publish.
   *
   * Two ways in. If the site links its own listing, follow that link and
   * trust it. If it does not, and pagelightprime.com does not link its
   * listing from any page we crawl, fall back to a Play name search.
   *
   * The search result is NEVER trusted on its own. A live query for
   * "PageLightPrime" returned twelve apps, eleven unrelated, so accepting the
   * top hit would attach a stranger's address to a prospect. Each candidate
   * listing is fetched and accepted only if the listing itself references the
   * prospect's own domain, which is how Google renders a verified developer
   * website. Search proposes, the listing's own content decides.
   *
   * FIXED 2026-08-22 (review finding blocker-2). Accepting a listing used to
   * license harvesting every address on that page with no further check.
   * playListingMatches() itself is now host-boundary checked (see
   * _contact_routes.js), which closes the specific evidence the reviewer
   * produced (a stranger's page merely linking to the prospect's domain in a
   * path, query string, fragment or userinfo section). This adds a second,
   * independent layer: even if playListingMatches() is ever wrong about a
   * given listing, only addresses AT the prospect's own domain are staged
   * from a search-discovered listing, so a wrong accept cannot hand a
   * stranger's named individual to the promote UI.
   *
   * Every branch below now records why nothing happened, per review finding
   * blocker-3: a crawl truncated by the time budget and a company that
   * genuinely publishes no address used to produce byte-identical responses,
   * because both the loop's budget exit and its per-listing fetch failures
   * recorded nothing.
   */
  if (playUrl && remaining() > 0) {
    const play = await fetchPage(playUrl, Math.min(PER_PAGE_TIMEOUT_MS, remaining()))
    if (play.error) {
      errors.push(`${playUrl}: ${play.error}`)
    } else {
      pagesFetched++
      raw.push(...extractEmails(play.html, play.url))
    }
  } else if (playUrl && remaining() <= 0) {
    errors.push(`${playUrl}: skipped, per-prospect time budget reached before the own listing could be fetched`)
  } else if (!playUrl && remaining() > 0) {
    const query = prospect.company || domain
    const searchUrl = playSearchUrl(query)
    if (searchUrl) {
      const search = await fetchPage(searchUrl, Math.min(PER_PAGE_TIMEOUT_MS, remaining()))
      if (search.error) {
        errors.push(`${searchUrl}: ${search.error}`)
      } else {
        pagesFetched++
        const ids = extractPlayAppIds(search.html).slice(0, MAX_PLAY_LISTINGS)
        const ownDomain = normaliseDomain(domain)
        let examined = 0
        for (const id of ids) {
          const budget = remaining()
          if (budget <= 0) {
            errors.push(
              `play listing scan stopped after ${examined} of ${ids.length} listings: ` +
                'per-prospect time budget reached. Call again for this prospect.'
            )
            break
          }
          examined++
          const listingUrl = `https://play.google.com/store/apps/details?id=${id}&hl=en`
          const listing = await fetchPage(listingUrl, Math.min(PER_PAGE_TIMEOUT_MS, budget))
          if (listing.error) {
            errors.push(`${listingUrl}: ${listing.error}`)
            continue
          }
          pagesFetched++
          if (!playListingMatches(listing.html, domain)) continue
          // Verified: this listing publishes the prospect's own domain.
          // Still filter harvested addresses down to the prospect's own
          // domain (blocker-2's second layer): a search-discovered listing
          // is evidence about a page Google rendered, not a page the
          // prospect controls, so a false accept must not be able to stage
          // a stranger's address.
          for (const c of extractEmails(listing.html, listing.url)) {
            const at = c.value.lastIndexOf('@')
            const emailDomain = at >= 0 ? c.value.slice(at + 1) : ''
            if (hostMatchesDomain(emailDomain, ownDomain)) raw.push(c)
          }
          break
        }
      }
    }
  } else {
    errors.push('skipped Play search: per-prospect time budget reached before it could start')
  }

  return {
    prospect_id: prospect.id,
    domain,
    pages_fetched: pagesFetched,
    candidates: mergeCandidates(raw, domain),
    errors,
  }
}

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  const headers = auth.headers || { 'Content-Type': 'application/json' }
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch (_) {
    return json(400, { error: 'Body must be valid JSON.' })
  }

  // Accept either shape, normalise to a list, reject loose coercions the same
  // way prospects-admin.js does (true, [1], "1e0" and " 1 " must not become 1).
  let rawIds
  if (Array.isArray(body.prospect_ids)) {
    rawIds = body.prospect_ids
  } else if (body.prospect_id !== undefined) {
    rawIds = [body.prospect_id]
  } else {
    return json(400, { error: 'Provide prospect_ids: number[] or prospect_id: number.' })
  }

  if (rawIds.length === 0) return json(400, { error: 'prospect_ids must not be empty.' })
  if (rawIds.length > MAX_PROSPECTS_PER_CALL) {
    return json(400, { error: `At most ${MAX_PROSPECTS_PER_CALL} prospects per call, got ${rawIds.length}.` })
  }

  const ids = []
  for (const raw of rawIds) {
    const id = parseId(raw)
    if (id === null) return json(400, { error: `Invalid prospect id: ${JSON.stringify(raw)}` })
    ids.push(id)
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const { data: prospects, error: readError } = await supabase
    .from('prospects')
    .select('id, domain, company')
    .in('id', ids)

  if (readError) return fail500(headers, 'read_prospects', readError)
  if (!prospects || prospects.length === 0) return json(404, { error: 'No prospect found for those ids.' })

  // The real worst case for one prospect is now PER_PROSPECT_BUDGET_MS itself
  // (see the FIXED 2026-08-22, round 2 comment above MAX_PROSPECTS_PER_CALL):
  // resolveOne clamps every fetch to the budget actually remaining, rather
  // than letting a fetch that starts near the edge run a full extra
  // PER_PAGE_TIMEOUT_MS past it. REMAINING_BUDGET_FOR_NEXT_PROSPECT_MS is the
  // invocation budget left over after that one prospect, which a second
  // prospect would need available in order to safely start and finish within
  // INVOCATION_BUDGET_MS.
  const REMAINING_BUDGET_FOR_NEXT_PROSPECT_MS = INVOCATION_BUDGET_MS - PER_PROSPECT_BUDGET_MS

  const results = []
  const invocationStarted = Date.now()
  let startedCount = 0
  for (const prospect of prospects) {
    // No silent caps. If the invocation is out of time, say which prospects
    // were not reached and why, rather than returning a short list that reads
    // like "we looked and found nothing" for a company nobody looked at.
    //
    // `startedCount > 0` guards the very first prospect from this check
    // regardless of the sign of REMAINING_BUDGET_FOR_NEXT_PROSPECT_MS, so the
    // sole prospect in every normal, single-id call always gets its attempt.
    // The gate exists only to stop a SECOND prospect in the same batch from
    // starting when there is no longer enough budget left for it to safely
    // finish. With MAX_PROSPECTS_PER_CALL = 1 this branch cannot be reached
    // at all today (there is never a second prospect to gate), and it is left
    // in place as the correct behaviour if that constant is ever raised
    // again.
    if (startedCount > 0 && Date.now() - invocationStarted > REMAINING_BUDGET_FOR_NEXT_PROSPECT_MS) {
      results.push({
        prospect_id: prospect.id,
        domain: prospect.domain,
        pages_fetched: 0,
        candidates: [],
        written: 0,
        errors: ['skipped: invocation time budget reached before this prospect was started. Call again for it.'],
      })
      continue
    }

    startedCount++
    let result
    try {
      result = await resolveOne(prospect)
    } catch (e) {
      // A crash resolving one prospect must not lose the others.
      console.error(`[resolve-contact-routes] resolveOne failed for ${prospect.id}:`, (e && e.message) || e)
      results.push({
        prospect_id: prospect.id,
        domain: prospect.domain,
        pages_fetched: 0,
        candidates: [],
        written: 0,
        errors: ['resolver crashed, see function logs'],
      })
      continue
    }

    let written = 0
    if (result.candidates.length > 0) {
      const rows = result.candidates.map((c) => ({
        prospect_id: result.prospect_id,
        kind: c.kind,
        value: c.value,
        source_url: c.source_url,
        email_kind: c.kind === 'email' ? c.email_kind : null,
        confidence: c.confidence,
      }))
      // `promoted` is deliberately absent from the row so an upsert over a
      // candidate a human already promoted cannot silently un-promote it.
      const { error: writeError } = await supabase
        .from('prospect_contact_candidates')
        .upsert(rows, { onConflict: 'prospect_id,kind,value' })

      if (writeError) return fail500(headers, 'write_candidates', writeError, { prospect_id: result.prospect_id })
      written = rows.length
    }

    results.push({ ...result, written })
  }

  const totals = results.reduce(
    (acc, r) => {
      acc.candidates += r.candidates.length
      acc.with_email += r.candidates.some((c) => c.kind === 'email') ? 1 : 0
      acc.with_linkedin += r.candidates.some((c) => c.kind === 'linkedin') ? 1 : 0
      acc.with_x += r.candidates.some((c) => c.kind === 'x') ? 1 : 0
      return acc
    },
    { candidates: 0, with_email: 0, with_linkedin: 0, with_x: 0 }
  )

  console.log(
    `[resolve-contact-routes] ${results.length} prospects, ${totals.candidates} candidates ` +
      `(email ${totals.with_email}, linkedin ${totals.with_linkedin}, x ${totals.with_x}) by ${auth.user.id}`
  )

  return json(200, { results, totals })
}

module.exports.resolveOne = resolveOne
module.exports.fetchPage = fetchPage
module.exports.MAX_PROSPECTS_PER_CALL = MAX_PROSPECTS_PER_CALL
