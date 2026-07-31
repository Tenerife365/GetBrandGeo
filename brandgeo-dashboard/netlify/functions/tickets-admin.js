/**
 * tickets-admin.js -- admin-only triage for the ticket queue. Backend half of
 * the admin view in src/pages/Tickets.tsx.
 *
 * POST body, one of:
 *   { action: 'list', status?, priority?, assignee?, source?, client_id?, q? }
 *     -> { tickets: Ticket[] }
 *   { action: 'detail', id }
 *     -> { ticket: Ticket, comments: Comment[] }   (INCLUDING internal notes)
 *   { action: 'create', subject, body, source, client_id?, priority?, assignee? }
 *     -> { ticket: Ticket }
 *   { action: 'update', id, status?, priority?, assignee? }
 *     -> { ticket: Ticket }
 *   { action: 'comment', id, body, is_internal? }
 *     -> { comment: Comment }
 *   { action: 'agents' }
 *     -> { agents: [{ id, email }] }
 *
 * WHY AN ADMIN FUNCTION AT ALL, when RLS already lets an admin read everything
 * over PostgREST:
 *   1. auth.users is not readable from the browser at any role, and
 *      user_profiles has exactly one SELECT policy, `id = auth.uid()`
 *      (supabase-multitenant-migration.sql). So an admin CANNOT list the other
 *      admins from the frontend, and the assignee picker has no data source
 *      without a service-key hop. Same reason client-users.js exists.
 *   2. Every enum is validated here, server-side, against the same values the
 *      CHECK constraints hold. A 400 with a readable message beats a raw
 *      Postgres 23514 surfacing in the UI.
 *   3. Assignment is validated as "this uuid is an admin", which is a rule
 *      about roles that the tickets table cannot express in a CHECK.
 *
 * The customer path deliberately does NOT come through here. See the comment
 * in src/pages/Tickets.tsx for that decision.
 *
 * Service key behind requireAuth({ adminOnly: true }), the same shape as
 * promotions-admin.js, set-client-plan.js and client-users.js.
 *
 * There is no delete action, matching the deliberate absence of a DELETE policy
 * on both tables (db/supabase-tickets-migration.sql).
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')

// Mirrors tickets_status_check / tickets_priority_check / tickets_source_check.
// If these ever disagree with the migration, the CHECK constraint wins and the
// caller gets a 500 instead of a 400, which is the loud failure we want.
const STATUSES   = ['open', 'in_progress', 'waiting', 'resolved', 'closed']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']
const SOURCES    = ['customer', 'internal']

const MAX_SUBJECT = 200
const MAX_BODY    = 20000

const TICKET_COLS =
  'id, client_id, created_by, source, subject, body, status, priority, assignee, page, created_at, updated_at, resolved_at'
const COMMENT_COLS = 'id, ticket_id, author, body, is_internal, created_at'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Postgres 42P01 = undefined_table. The migration has not been applied yet. */
function isMissingTable(error) {
  return !!error && (error.code === '42P01' || /relation .*tickets.* does not exist/i.test(error.message || ''))
}

// auth.users is not joinable from PostgREST, so an email costs one admin API
// call. This function has no timeout override in netlify.toml, so it inherits
// the 10s default. A hard cap is cheaper than a timeout: past it, names simply
// render as "unknown" and the queue still loads. Distinct users, not tickets,
// so this is generous in practice.
const MAX_EMAIL_LOOKUPS = 60

/**
 * Resolve a set of auth user ids to emails, deduplicated and capped. Same
 * approach as client-users.js.
 */
async function resolveEmails(supabase, ids) {
  const out = new Map()
  const unique = [...new Set(ids.filter(Boolean))]

  if (unique.length > MAX_EMAIL_LOOKUPS) {
    console.warn(`[tickets-admin] ${unique.length} distinct users in this result set, resolving the first ${MAX_EMAIL_LOOKUPS}`)
  }

  for (const id of unique.slice(0, MAX_EMAIL_LOOKUPS)) {
    try {
      const { data } = await supabase.auth.admin.getUserById(id)
      out.set(id, (data && data.user && data.user.email) || null)
    } catch {
      out.set(id, null)   // a user that no longer exists must not break the list
    }
  }
  return out
}

/** Attach client name, author email and assignee email to a set of ticket rows. */
async function decorate(supabase, rows) {
  if (!rows.length) return []

  const clientIds = [...new Set(rows.map(r => r.client_id).filter(v => v !== null && v !== undefined))]
  const names = new Map()
  if (clientIds.length) {
    const { data } = await supabase.from('clients').select('id, name').in('id', clientIds)
    for (const c of data || []) names.set(c.id, c.name)
  }

  const userIds = [...new Set([...rows.map(r => r.created_by), ...rows.map(r => r.assignee)].filter(Boolean))]
  const emails = await resolveEmails(supabase, userIds)

  return rows.map(r => ({
    ...r,
    client_name:    r.client_id != null ? (names.get(r.client_id) || `Client ${r.client_id}`) : null,
    created_by_email: r.created_by ? (emails.get(r.created_by) || null) : null,
    assignee_email:   r.assignee   ? (emails.get(r.assignee)   || null) : null,
  }))
}

/** true when the uuid belongs to a user_profiles row with role = 'admin'. */
async function isAdminUser(supabase, uuid) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('id', uuid)
    .maybeSingle()
  if (error) throw error
  return !!data && data.role === 'admin'
}

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  const headers = auth.headers
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const missing = () => {
    console.log('[tickets-admin] tickets table missing; migration not applied yet')
    return json(404, { error: 'Tickets backend is not deployed yet.' })
  }
  const fail = (where, error) => {
    console.error(`[tickets-admin] ${where} failed:`, error.message || error)
    return json(500, { error: error.message || 'Unexpected error' })
  }

  try {
    // ── agents ──────────────────────────────────────────────────────────────
    // The assignee picker's only data source. See the header for why this
    // cannot be a frontend query.
    if (body.action === 'agents') {
      const { data, error } = await supabase.from('user_profiles').select('id').eq('role', 'admin')
      if (error) return fail('agents', error)

      const ids = (data || []).map(r => r.id)
      const emails = await resolveEmails(supabase, ids)
      const agents = ids
        .map(id => ({ id, email: emails.get(id) || null }))
        .filter(a => a.email)
        .sort((a, b) => a.email.localeCompare(b.email))

      return json(200, { agents })
    }

    // ── list ────────────────────────────────────────────────────────────────
    if (body.action === 'list') {
      let query = supabase.from('tickets').select(TICKET_COLS).order('created_at', { ascending: false }).limit(500)

      if (body.status) {
        if (!STATUSES.includes(body.status)) return json(400, { error: `Unknown status: ${body.status}.` })
        query = query.eq('status', body.status)
      }
      if (body.priority) {
        if (!PRIORITIES.includes(body.priority)) return json(400, { error: `Unknown priority: ${body.priority}.` })
        query = query.eq('priority', body.priority)
      }
      if (body.source) {
        if (!SOURCES.includes(body.source)) return json(400, { error: `Unknown source: ${body.source}.` })
        query = query.eq('source', body.source)
      }
      if (body.assignee === 'unassigned') {
        query = query.is('assignee', null)
      } else if (body.assignee) {
        if (!UUID_RE.test(body.assignee)) return json(400, { error: 'assignee must be a uuid or "unassigned".' })
        query = query.eq('assignee', body.assignee)
      }
      if (body.client_id !== undefined && body.client_id !== null && body.client_id !== '') {
        const cid = Number(body.client_id)
        if (!Number.isInteger(cid) || cid <= 0) return json(400, { error: 'client_id must be a positive integer.' })
        query = query.eq('client_id', cid)
      }
      if (typeof body.q === 'string' && body.q.trim()) {
        // Escape the PostgREST pattern delimiters so a comma or a paren in the
        // search box cannot restructure the or() filter.
        const term = body.q.trim().slice(0, 120).replace(/[,()*\\]/g, ' ')
        query = query.or(`subject.ilike.%${term}%,body.ilike.%${term}%`)
      }

      const { data, error } = await query
      if (error) return isMissingTable(error) ? missing() : fail('list', error)

      return json(200, { tickets: await decorate(supabase, data || []) })
    }

    // ── detail ──────────────────────────────────────────────────────────────
    // Returns internal comments too. That is the point of the admin view, and
    // it is why this action is behind adminOnly rather than shared with the
    // customer path.
    if (body.action === 'detail') {
      const id = Number(body.id)
      if (!Number.isInteger(id) || id <= 0) return json(400, { error: 'Missing or invalid id.' })

      const { data: ticket, error } = await supabase.from('tickets').select(TICKET_COLS).eq('id', id).maybeSingle()
      if (error) return isMissingTable(error) ? missing() : fail('detail', error)
      if (!ticket) return json(400, { error: `Ticket ${id} not found.` })

      const { data: comments, error: cErr } = await supabase
        .from('ticket_comments').select(COMMENT_COLS).eq('ticket_id', id).order('created_at', { ascending: true })
      if (cErr) return fail('detail comments', cErr)

      const authorIds = [...new Set((comments || []).map(c => c.author).filter(Boolean))]
      const emails = await resolveEmails(supabase, authorIds)

      const [decorated] = await decorate(supabase, [ticket])
      return json(200, {
        ticket: decorated,
        comments: (comments || []).map(c => ({ ...c, author_email: c.author ? (emails.get(c.author) || null) : null })),
      })
    }

    // ── create ──────────────────────────────────────────────────────────────
    // How BrandGEO's own pending work gets onto the same board, and how an
    // admin raises a ticket on a customer's behalf after a call or an email.
    if (body.action === 'create') {
      const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
      if (!subject) return json(400, { error: 'Subject is required.' })
      if (subject.length > MAX_SUBJECT) return json(400, { error: `Subject must be ${MAX_SUBJECT} characters or fewer.` })

      const text = typeof body.body === 'string' ? body.body.trim() : ''
      if (!text) return json(400, { error: 'Description is required.' })

      const source = body.source
      if (!SOURCES.includes(source)) return json(400, { error: "Source must be 'customer' or 'internal'." })

      // tickets_source_tenancy_check enforces this pairing in the database as
      // well. Checked here so the caller gets a sentence instead of a 23514.
      let clientId = null
      if (source === 'customer') {
        const cid = Number(body.client_id)
        if (!Number.isInteger(cid) || cid <= 0) return json(400, { error: 'A customer ticket needs a client_id.' })
        const { data: client, error: cErr } = await supabase.from('clients').select('id').eq('id', cid).maybeSingle()
        if (cErr) return fail('create client lookup', cErr)
        if (!client) return json(400, { error: `Client ${cid} not found.` })
        clientId = cid
      } else if (body.client_id !== undefined && body.client_id !== null && body.client_id !== '') {
        return json(400, { error: 'An internal ticket cannot have a client_id.' })
      }

      const priority = body.priority === undefined || body.priority === null || body.priority === ''
        ? 'normal' : body.priority
      if (!PRIORITIES.includes(priority)) return json(400, { error: `Unknown priority: ${priority}.` })

      let assignee = null
      if (body.assignee) {
        if (!UUID_RE.test(body.assignee)) return json(400, { error: 'assignee must be a uuid.' })
        if (!(await isAdminUser(supabase, body.assignee))) {
          return json(400, { error: 'Tickets can only be assigned to an admin.' })
        }
        assignee = body.assignee
      }

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          client_id:  clientId,
          created_by: auth.user.id,
          source,
          subject,
          body:       text.slice(0, MAX_BODY),
          status:     'open',
          priority,
          assignee,
          page:       typeof body.page === 'string' ? body.page.slice(0, MAX_SUBJECT) : null,
        })
        .select(TICKET_COLS)
        .single()

      if (error) return isMissingTable(error) ? missing() : fail('create', error)

      console.log(`[tickets-admin] created ticket ${data.id} (${source}) by ${auth.user.id}`)
      const [decorated] = await decorate(supabase, [data])
      return json(200, { ticket: decorated })
    }

    // ── update ──────────────────────────────────────────────────────────────
    // status, priority and assignee only. subject, body, client_id and source
    // are not editable here on purpose: rewriting what a customer asked for
    // after the fact destroys the record this table exists to keep.
    if (body.action === 'update') {
      const id = Number(body.id)
      if (!Number.isInteger(id) || id <= 0) return json(400, { error: 'Missing or invalid id.' })

      const patch = {}

      if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) return json(400, { error: `Unknown status: ${body.status}.` })
        patch.status = body.status
      }
      if (body.priority !== undefined) {
        if (!PRIORITIES.includes(body.priority)) return json(400, { error: `Unknown priority: ${body.priority}.` })
        patch.priority = body.priority
      }
      if (body.assignee !== undefined) {
        if (body.assignee === null || body.assignee === '') {
          patch.assignee = null
        } else {
          if (!UUID_RE.test(body.assignee)) return json(400, { error: 'assignee must be a uuid or null.' })
          if (!(await isAdminUser(supabase, body.assignee))) {
            return json(400, { error: 'Tickets can only be assigned to an admin.' })
          }
          patch.assignee = body.assignee
        }
      }

      if (Object.keys(patch).length === 0) {
        return json(400, { error: 'Nothing to update. Send status, priority or assignee.' })
      }

      // updated_at and resolved_at are set by the tickets_touch_updated_at
      // trigger, not here, so that every writer gets the same behaviour.
      const { data, error } = await supabase.from('tickets').update(patch).eq('id', id).select(TICKET_COLS).maybeSingle()
      if (error) return isMissingTable(error) ? missing() : fail('update', error)
      if (!data) return json(400, { error: `Ticket ${id} not found.` })

      console.log(`[tickets-admin] ticket ${id} updated ${JSON.stringify(patch)} by ${auth.user.id}`)
      const [decorated] = await decorate(supabase, [data])
      return json(200, { ticket: decorated })
    }

    // ── comment ─────────────────────────────────────────────────────────────
    if (body.action === 'comment') {
      const id = Number(body.id)
      if (!Number.isInteger(id) || id <= 0) return json(400, { error: 'Missing or invalid id.' })

      const text = typeof body.body === 'string' ? body.body.trim() : ''
      if (!text) return json(400, { error: 'Comment body is required.' })

      if (body.is_internal !== undefined && typeof body.is_internal !== 'boolean') {
        return json(400, { error: 'is_internal must be true or false.' })
      }
      const isInternal = body.is_internal === true

      // status comes back so the touch below can write it straight back and
      // fire the trigger without changing anything.
      const { data: ticket, error: tErr } = await supabase.from('tickets').select('id, status').eq('id', id).maybeSingle()
      if (tErr) return isMissingTable(tErr) ? missing() : fail('comment ticket lookup', tErr)
      if (!ticket) return json(400, { error: `Ticket ${id} not found.` })

      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({ ticket_id: id, author: auth.user.id, body: text.slice(0, MAX_BODY), is_internal: isInternal })
        .select(COMMENT_COLS)
        .single()

      if (error) return isMissingTable(error) ? missing() : fail('comment', error)

      // Touch the parent so the queue sorts and reads as active. The trigger
      // owns updated_at, so this is a no-op write purely to fire it.
      const { error: touchErr } = await supabase.from('tickets').update({ status: ticket.status }).eq('id', id)
      if (touchErr) console.warn(`[tickets-admin] could not touch ticket ${id}:`, touchErr.message)

      console.log(`[tickets-admin] comment on ticket ${id} internal=${isInternal} by ${auth.user.id}`)
      return json(200, { comment: { ...data, author_email: auth.user.email || null } })
    }

    return json(400, { error: "Unknown action. One of: 'list', 'detail', 'create', 'update', 'comment', 'agents'." })
  } catch (e) {
    console.error('[tickets-admin] unhandled error:', e && e.message ? e.message : e)
    return json(500, { error: 'Unexpected error' })
  }
}
