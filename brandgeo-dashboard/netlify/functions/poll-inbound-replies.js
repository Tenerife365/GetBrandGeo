// ============================================================================
// poll-inbound-replies.js -- reads the outbound mailbox and logs replies from
// known prospects as inbound touches. Part B of docs/arch/reply-handling.md.
//
// SCHEDULED BY SUPABASE pg_cron, NOT by Netlify (the 2026-07-28 ruling). It is
// gated by requireCronAuth() on the x-cron-key header and fails CLOSED when
// CRON_SECRET is unset, exactly like schedule-collections, expire-plan-grants
// and ping-sitemap.
//
// WHAT IT IS FOR. Before this existed, 13 prospects had been contacted, 0
// inbound touches had ever been logged, and replied_at was null on every row.
// A reply was only ever visible in a human's inbox, so a prospect who answered
// looked identical to one who ignored us and would keep receiving follow-ups.
//
// SCOPE, STATED HONESTLY AND FIRST. This covers EMAIL ONLY. Of the first 14
// outbound touches, 6 were email and 8 were LinkedIn or a web contact form.
// LinkedIn returns HTTP 999 to every automated client and X exposes no usable
// route here, so replies on those channels stay manual forever. This closes
// somewhat under half of "notice a reply", and the manual out/in toggle on the
// Prospects page remains load bearing.
//
// IT ONLY READS MAIL. The OAuth scope is gmail.readonly and nothing else. A
// function holding a send scope is a function that can cold-email without a
// human, which this project does not allow regardless of what the code
// currently does with it. It also never marks anything read and never modifies
// a message, so a human working the same inbox sees no side effects.
//
// IT NEVER SETS A STAGE. It writes an inbound touch through the shared
// recordTouch() in _touches.js, which stamps replied_at and clears
// next_action_at. Advancing a prospect to stage='replied' stays a human call.
//
// KNOWN LIMITS, so they are not rediscovered as bugs:
//   - A reply to a role inbox often comes FROM a different address than the one
//     we mailed (we write to sales@x.com, a named person answers). Sender
//     matching misses that. A thread-id match would close it and is the
//     natural follow-up.
//   - Bounces are invisible: a mailer-daemon address never matches a
//     contact_email, so a dead route keeps getting follow-ups. Separate packet.
//   - A human and this poller can both log the same reply. The human row has a
//     null external_id so the unique index does not catch it. One duplicate
//     history row, no stamp corruption, because the stamp is forward-only.
//
// ENV: CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY,
//      GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER.
// Total added env is well under 500 bytes, so this does not approach the 4KB
// Lambda ceiling that forced GOOGLE_JSON_KEY to be dropped in 2026-07.
// ============================================================================

const { createClient } = require('@supabase/supabase-js')
const { requireCronAuth } = require('./_cron_auth')
const { recordTouch, clampOccurredAt } = require('./_touches')

const SELECT_COLS = `
  id, domain, company, contact_name, contact_role, contact_url, linkedin_url,
  segment, tier, stage, disqualified_reason, audit_token, ai_score,
  competitor_count, source, owner, last_contacted_at, next_action_at,
  replied_at, reply_note, notes, created_at, updated_at,
  contact_email, contact_email_source, contact_email_kind, x_url,
  x_verified, linkedin_verified
`.replace(/\s+/g, ' ').trim()

// Gmail's `q` is a URL parameter, so an unbounded OR list eventually produces a
// request line the API rejects. 25 addresses per query keeps it comfortably
// short and still means one request per 25 open conversations.
const ADDRESSES_PER_QUERY = 25

// How far back to look. Generous enough to catch a reply to a touch sent three
// weeks ago, bounded so the query does not grow without limit.
const LOOKBACK = 'newer_than:30d'

// Belt and braces against a runaway invocation. The scheduled cadence is
// hourly, so there is always another run and nothing is lost by stopping early.
//
// THESE NUMBERS SIT UNDER THE PLATFORM CEILING ON PURPOSE. netlify.toml gives
// this function timeout = 26. Each message costs one metadata GET plus, when
// it is a real reply, the 3 to 4 queries recordTouch makes. At 100 messages
// that is comfortably past 26s, and a function killed mid-run reports NOTHING,
// which reads identically to "nobody replied". That exact failure mode nearly
// shipped in resolve-contact-routes and is the reason for the budget below.
const MAX_MESSAGES_PER_RUN = 40
const INVOCATION_BUDGET_MS = 22000

const TERMINAL_STAGES = ['won', 'lost', 'disqualified']

async function recordJobRun(supabase, ok, detail) {
  try {
    const { error } = await supabase.from('job_runs').insert({ job: 'poll-inbound-replies', ok, detail })
    if (error) console.error('[poll-inbound-replies] job_runs write failed:', error.message)
  } catch (err) {
    console.error('[poll-inbound-replies] job_runs write threw:', err.message)
  }
}

/**
 * Exchange the long-lived refresh token for a short-lived access token.
 * Returns null and logs on any failure; the caller reports it as a job failure.
 */
async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID || '',
    client_secret: process.env.GMAIL_CLIENT_SECRET || '',
    refresh_token: process.env.GMAIL_REFRESH_TOKEN || '',
    grant_type: 'refresh_token',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[poll-inbound-replies] token exchange ${res.status}: ${text.slice(0, 300)}`)
    return null
  }
  const json = await res.json()
  return json.access_token || null
}

/** Split an array into chunks of at most `size`. */
function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Header lookup is case-insensitive per RFC 5322. */
function headerValue(headers, name) {
  const wanted = name.toLowerCase()
  const hit = (headers || []).find(h => (h.name || '').toLowerCase() === wanted)
  return hit ? hit.value : null
}

/**
 * stripQuotedAndComments(header) -> the same header with every quoted-string
 * and every parenthesised comment blanked out, structure otherwise intact.
 *
 * RFC 5322 lets a display name be a quoted-string containing ANY character,
 * including angle brackets, and lets a comment appear almost anywhere. Both
 * are places an attacker can put text that looks like an address, so both are
 * removed before anything in this file goes looking for one. A backslash
 * escapes the next character, so it is honoured here too.
 */
function stripQuotedAndComments(header) {
  let out = ''
  let inQuote = false
  let depth = 0
  let escaped = false
  for (const ch of String(header)) {
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (inQuote) { if (ch === '"') inQuote = false; continue }
    if (depth > 0) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      continue
    }
    if (ch === '"') { inQuote = true; out += ' '; continue }
    if (ch === '(') { depth++; out += ' '; continue }
    out += ch
  }
  return out
}

/**
 * parseFromAddress(from) -> lowercased addr-spec, or null.
 *
 * FIXED 2026-09-03 (review finding F1, HIGH). This used to take the FIRST
 * angle-bracketed token in the raw header. RFC 5322 permits a quoted display
 * name containing angle brackets, so the first token is not the address:
 *
 *   "<sales@casepacer.com>" <spoof@mailer.example>
 *
 * returned sales@casepacer.com, a real prospect address already on file.
 * Gmail's `from:` operator matches display names as well as addresses, so a
 * message crafted that way entered the candidate list, matched byAddress, and
 * recordTouch stamped replied_at and cleared next_action_at on a prospect who
 * had said nothing. The prospect then silently left the follow-up queue, which
 * the design document calls worse than no automation.
 *
 * The rule now: blank out quoted strings and comments FIRST, then read the
 * addr-spec from what is left.
 *   - exactly one <...> token  -> that token is the address (the well-formed
 *     name-addr case, and after stripping it is also the LAST one).
 *     A bracket left anywhere outside that one token refuses the header.
 *   - more than one            -> null. A From with two mailboxes is legal and
 *     rare, and guessing which one "meant it" is exactly the misattribution
 *     this finding is about. Refusing costs one unlogged reply; guessing costs
 *     a wrong prospect record.
 *   - none                     -> the remainder must itself be a bare address.
 * Whatever survives must contain exactly one "@", no whitespace and no
 * remaining bracket or quote, and a domain with a dot.
 */
function parseFromAddress(from) {
  if (!from) return null
  const stripped = stripQuotedAndComments(from)

  const angled = stripped.match(/<[^<>]*>/g) || []
  if (angled.length > 1) return null
  // N2 (2026-09-03 re-review): one well-formed token beside a stray bracket, as
  // in "<<a@b.example>@evil.example>", is not a well-formed name-addr. Nothing
  // left outside the one token may contain a bracket at all.
  if (angled.length === 1 && /[<>]/.test(stripped.replace(angled[0], ''))) return null
  const raw = angled.length === 1 ? angled[0].slice(1, -1) : stripped

  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return null
  if ((trimmed.match(/@/g) || []).length !== 1) return null
  if (/[\s<>"(),;:\\[\]]/.test(trimmed)) return null

  const [local, domain] = trimmed.split('@')
  if (!local || !domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return null
  return trimmed
}

/**
 * isAutomated(headers) -> boolean
 *
 * An out-of-office that clears next_action_at and stops the sequence is WORSE
 * than no automation: it looks exactly like a real reply and silently removes
 * the prospect from the queue. These headers are the standard ways an
 * autoresponder identifies itself (RFC 3834 for Auto-Submitted).
 *
 * EXTENDED 2026-09-03 (review finding F10). Gmail's own vacation responder
 * sets Auto-Submitted, so that case was covered. Microsoft Exchange and
 * Outlook automatic replies frequently set NONE of the original four and are
 * identified instead by X-MS-Exchange-Inbox-Rules-Loop or
 * X-Auto-Response-Suppress, and a subject line beginning "Automatic reply" or
 * "Out of office" is the cheap remainder. None of this is a full solution and
 * it is not claimed to be: it is the 80 percent that costs two request
 * parameters. The failure it prevents is silent, so a false positive (a real
 * reply skipped, still sitting in the human's inbox, prospect still in the
 * queue) is the better error of the two.
 */
const AUTO_SUBJECT_RE = /^\s*(?:re\s*:\s*)?(automatic reply|out of office|out-of-office|auto(?:matic)?[- ]?reply|autoreply|abwesenheit|réponse automatique)\b/i

function isAutomated(headers) {
  const autoSubmitted = (headerValue(headers, 'Auto-Submitted') || '').toLowerCase()
  if (autoSubmitted && autoSubmitted !== 'no') return true

  const precedence = (headerValue(headers, 'Precedence') || '').toLowerCase()
  if (['bulk', 'auto_reply', 'junk', 'list'].includes(precedence)) return true

  if (headerValue(headers, 'X-Autoreply')) return true
  if (headerValue(headers, 'X-Autorespond')) return true
  if (headerValue(headers, 'X-MS-Exchange-Inbox-Rules-Loop')) return true
  if (headerValue(headers, 'X-Auto-Response-Suppress')) return true

  if (AUTO_SUBJECT_RE.test(headerValue(headers, 'Subject') || '')) return true

  return false
}

/**
 * occurredAtFrom(dateHeader) -> ISO string
 *
 * Falls back to now() when the Date header is missing or unparseable rather
 * than refusing the reply, and clamps a future date to now so a sender with a
 * badly wrong clock cannot make a prospect look permanently just-replied.
 *
 * FIXED 2026-09-03 (review finding F3, HIGH). The lower bound was missing.
 * The SENDER writes this header, and "Date: Thu, 01 Jan 1970" wrote
 * occurred_at = 1970 into prospect_touches and, because this function's own
 * prospect query selects rows with replied_at IS NULL, the forward-only
 * stamp's `is null` branch matched and set replied_at = 1970 on a real
 * prospect row. The admin path had rejected exactly that value since
 * 2026-08-15 (bg-verify S1). The bound is now imported from _touches.js, one
 * copy for both callers, rather than being re-stated here.
 */
function occurredAtFrom(dateHeader) {
  return clampOccurredAt(dateHeader)
}

exports.handler = async (event) => {
  const gate = requireCronAuth(event)
  if (gate) return gate.response

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const mailbox = process.env.GMAIL_USER

  if (!mailbox || !process.env.GMAIL_REFRESH_TOKEN) {
    // Fail LOUDLY rather than reporting a clean run of zero replies. A silent
    // "0 found" from a misconfigured poller is indistinguishable from "nobody
    // replied", which is exactly the failure this job exists to prevent.
    console.error('[poll-inbound-replies] GMAIL_USER or GMAIL_REFRESH_TOKEN is not set')
    await recordJobRun(supabase, false, { stage: 'config', error: 'gmail credentials missing' })
    return { statusCode: 503, body: 'gmail not configured' }
  }

  // 1. Who are we still waiting on.
  const { data: prospects, error: prospectsError } = await supabase
    .from('prospects')
    .select('id, domain, contact_email, stage')
    .not('contact_email', 'is', null)
    .not('last_contacted_at', 'is', null)
    .is('replied_at', null)
    .not('stage', 'in', `(${TERMINAL_STAGES.join(',')})`)

  if (prospectsError) {
    console.error('[poll-inbound-replies] prospect read failed:', prospectsError.message)
    await recordJobRun(supabase, false, { stage: 'prospects', error: prospectsError.message })
    return { statusCode: 500, body: 'prospect read failed' }
  }

  const byAddress = new Map()
  for (const p of prospects || []) {
    const addr = (p.contact_email || '').trim().toLowerCase()
    // First writer wins. Two prospects sharing a contact address is a data
    // problem to fix upstream, not something to guess at here, and picking one
    // deterministically beats attributing a reply to whichever row sorted last.
    if (addr && !byAddress.has(addr)) byAddress.set(addr, p)
  }

  if (byAddress.size === 0) {
    await recordJobRun(supabase, true, { awaiting_reply: 0, checked: 0, logged: 0, note: 'nobody is awaiting a reply' })
    return { statusCode: 200, body: JSON.stringify({ awaiting_reply: 0, logged: 0 }) }
  }

  // 2. Mint a short-lived access token.
  let token
  try {
    token = await getAccessToken()
  } catch (err) {
    console.error('[poll-inbound-replies] token exchange threw:', err.message)
    await recordJobRun(supabase, false, { stage: 'oauth', error: err.message })
    return { statusCode: 502, body: 'gmail auth failed' }
  }
  if (!token) {
    await recordJobRun(supabase, false, { stage: 'oauth', error: 'no access token returned' })
    return { statusCode: 502, body: 'gmail auth failed' }
  }

  const authHeaders = { Authorization: `Bearer ${token}` }
  const api = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(mailbox)}`

  // 3. Find candidate message ids, in chunks.
  //
  // FIXED 2026-09-03 (review finding F12). This loop used to break as soon as
  // MAX_MESSAGES_PER_RUN ids had been collected, BEFORE the dedupe below. If
  // the first 25 addresses returned 40 messages inside the 30 day window,
  // chunks 2 and up were never queried, on this run and on every run after
  // it, because the same 40 already-logged messages kept coming back.
  // Addresses 26 and up would never have been asked about at all. Every chunk
  // now runs; the cap moves to AFTER the dedupe, where it applies only to
  // work that actually remains.
  const messageIds = []
  const errors = []
  for (const group of chunk([...byAddress.keys()], ADDRESSES_PER_QUERY)) {
    const q = `${LOOKBACK} from:(${group.join(' OR ')})`
    try {
      const res = await fetch(`${api}/messages?maxResults=${MAX_MESSAGES_PER_RUN}&q=${encodeURIComponent(q)}`, { headers: authHeaders })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        errors.push(`list ${res.status}: ${text.slice(0, 200)}`)
        continue
      }
      const body = await res.json()
      for (const m of body.messages || []) messageIds.push(m.id)
    } catch (err) {
      errors.push(`list threw: ${err.message}`)
    }
  }

  const found = [...new Set(messageIds)]

  // 4. Drop the ones already logged, in ONE query per batch rather than per
  // message. The partial unique index on external_id is the real guarantee;
  // this is just avoiding a pointless fetch and insert attempt for each known
  // message. Chunked because `in` becomes a URL parameter and the id list is
  // no longer capped before this point (finding F12).
  const alreadyLogged = new Set()
  for (const group of chunk(found, 100)) {
    const { data: known, error: knownError } = await supabase
      .from('prospect_touches')
      .select('external_id')
      .in('external_id', group.map(id => `gmail:${id}`))

    if (knownError) {
      // Not fatal: the unique index still prevents a duplicate, we just do
      // more work. Recorded so a persistent failure is visible.
      errors.push(`dedupe read failed: ${knownError.message}`)
    } else {
      for (const r of known || []) alreadyLogged.add(r.external_id)
    }
  }

  // The cap applies to what is LEFT after the dedupe, so a backlog of
  // already-logged mail can no longer consume the whole run (finding F12).
  const unlogged = found.filter(id => !alreadyLogged.has(`gmail:${id}`))

  // Rotate the window between runs. An id that is never LOGGED is also never
  // deduped: an unmatched sender, or a message from an address that maps to no
  // prospect, comes back on every run forever. Without rotation those would
  // permanently occupy the first MAX_MESSAGES_PER_RUN slots and starve
  // everything behind them, which is the same defect F12 names one layer up.
  // The offset is derived from the clock rather than from stored state, so it
  // needs no schema and every message is reached within a few hourly runs.
  const offset = unlogged.length ? Math.floor(Date.now() / (60 * 60 * 1000)) % unlogged.length : 0
  const rotated = unlogged.slice(offset).concat(unlogged.slice(0, offset))
  const unique = rotated.slice(0, MAX_MESSAGES_PER_RUN)
  const deferred = rotated.length - unique.length

  // 5. Fetch headers for each new message and log the real replies.
  let checked = 0
  let logged = 0
  let skippedAutomated = 0
  let unmatched = 0
  let budgetStopped = 0
  const loggedFor = []
  const startedAt = Date.now()

  for (const id of unique) {
    // Report the cap rather than silently truncating. A run that stopped early
    // and a run that found nothing must not look the same in job_runs.
    if (Date.now() - startedAt > INVOCATION_BUDGET_MS) {
      budgetStopped++
      continue
    }

    checked++

    let msg
    try {
      const res = await fetch(
        `${api}/messages/${encodeURIComponent(id)}?format=metadata` +
        '&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=Subject' +
        '&metadataHeaders=Auto-Submitted&metadataHeaders=Precedence' +
        '&metadataHeaders=X-Autoreply&metadataHeaders=X-Autorespond' +
        // Exchange and Outlook autoreplies set neither of the four above
        // (review finding F10).
        '&metadataHeaders=X-MS-Exchange-Inbox-Rules-Loop' +
        '&metadataHeaders=X-Auto-Response-Suppress',
        { headers: authHeaders }
      )
      if (!res.ok) {
        errors.push(`get ${id} ${res.status}`)
        continue
      }
      msg = await res.json()
    } catch (err) {
      errors.push(`get ${id} threw: ${err.message}`)
      continue
    }

    const headers = (msg.payload && msg.payload.headers) || []

    if (isAutomated(headers)) {
      skippedAutomated++
      continue
    }

    const from = parseFromAddress(headerValue(headers, 'From'))
    const prospect = from ? byAddress.get(from) : null
    if (!prospect) {
      // Gmail's `from:` matching is fuzzier than an exact address compare, so
      // this is expected occasionally and is not an error.
      unmatched++
      continue
    }

    const insert = {
      prospect_id: prospect.id,
      channel: 'email',
      direction: 'in',
      occurred_at: occurredAtFrom(headerValue(headers, 'Date')),
      subject: (headerValue(headers, 'Subject') || '').slice(0, 10000) || null,
      // Gmail's own snippet, not the full body. Enough to see what they said
      // without this function storing the entire private correspondence of a
      // named person in a database.
      body: (msg.snippet || '').slice(0, 500) || null,
      note: `Auto-logged from Gmail message ${id} in ${mailbox}.`,
      external_id: `gmail:${id}`,
    }

    const outcome = await recordTouch(supabase, {
      prospect_id: prospect.id,
      insert,
      selectCols: SELECT_COLS,
    })

    if (!outcome.ok) {
      if (outcome.kind === 'duplicate_external_id') continue
      errors.push(`record ${id} for prospect ${prospect.id}: ${outcome.kind}`)
      continue
    }

    logged++
    loggedFor.push({ prospect_id: prospect.id, domain: prospect.domain, message: id })
    console.log(`[poll-inbound-replies] logged reply from ${from} for prospect ${prospect.id} (${prospect.domain})`)
  }

  // A run is COMPLETE when every unlogged message it found was actually
  // examined: nothing deferred past the per-run cap, nothing dropped by the
  // time budget (review finding F11).
  const complete = budgetStopped === 0 && deferred === 0

  const detail = {
    awaiting_reply: byAddress.size,
    candidates: unique.length,
    checked,
    logged,
    skipped_automated: skippedAutomated,
    unmatched_sender: unmatched,
    skipped_time_budget: budgetStopped,
    deferred_over_cap: deferred,
    complete,
    errors: errors.slice(0, 20),
  }

  if (budgetStopped > 0 || deferred > 0) {
    console.warn(`[poll-inbound-replies] stopped early: ${budgetStopped} message(s) hit the time budget and ${deferred} were deferred past the per-run cap. The next hourly run picks them up.`)
  }

  // ok reflects whether the run did its job cleanly. A run that hit API errors
  // is NOT ok even if it happened to log something, because "ok with 0 logged"
  // must keep meaning "nobody replied" and nothing else. This is the exact
  // distinction ping-sitemap's job_runs.ok blurs, called out in CLAUDE.md.
  //
  // TIGHTENED 2026-09-03 (review finding F11). A budget-stopped run used to
  // report ok = true while carrying skipped_time_budget > 0 in detail, which
  // is the narrower version of the same blur: "ok with 0 logged" then meant
  // either "nobody replied" or "we ran out of time before looking". A partial
  // run is now ok = false. EXPECT SOME ok = false ROWS once this is scheduled
  // if the mailbox is busy; read `complete` and `errors` to tell a partial run
  // from a broken one.
  await recordJobRun(supabase, errors.length === 0 && complete, detail)

  return { statusCode: 200, body: JSON.stringify({ ...detail, logged_for: loggedFor }) }
}

// Exported for tests/poll_inbound_replies.test.js. These are pure and take no
// network; the handler above is not exported and is not unit tested.
module.exports.parseFromAddress = parseFromAddress
module.exports.stripQuotedAndComments = stripQuotedAndComments
module.exports.isAutomated = isAutomated
module.exports.occurredAtFrom = occurredAtFrom
module.exports.chunk = chunk
module.exports.headerValue = headerValue
