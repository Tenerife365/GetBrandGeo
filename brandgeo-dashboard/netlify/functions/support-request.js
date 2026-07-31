/**
 * support-request.js -- receives a support message from a signed-in dashboard
 * user (SupportWidget.tsx), PERSISTS IT AS A TICKET, then emails
 * support@getbrandgeo.com via Resend as a notification.
 *
 * WHAT CHANGED AND WHY
 *   This used to only send the email. Nothing was stored, so there was no
 *   record, no status, no assignee and no history -- an answered request and a
 *   dropped one were indistinguishable. The row in public.tickets is now the
 *   record and the email is a notification on top of it. Order matters:
 *   INSERT FIRST, MAIL SECOND. A Resend outage costs a notification, never a
 *   customer request.
 *
 * WHAT DID NOT CHANGE
 *   1. The auth gate. requireAuth still runs first and still validates JWT and
 *      origin, so this is not an open relay.
 *   2. The 503 + mailto fallback, on the path where it actually matters. See
 *      the next block, which is the one non-obvious decision in this file.
 *
 * THE 503 CONTRACT, RESTATED PRECISELY
 *   Before, "no RESEND_API_KEY" meant the request was lost, so 503 and a
 *   mailto fallback was the honest answer. Now there are two different
 *   failures and they deserve different answers:
 *
 *     ticket INSERT succeeded  -> 200, always, with the ticket id.
 *                                 The request is recorded and an agent will
 *                                 see it in the queue. Returning 503 here
 *                                 because email failed would tell the customer
 *                                 their message was lost when it was not, and
 *                                 push them into sending a duplicate by mail.
 *                                 `notified: false` carries the email outcome.
 *
 *     ticket INSERT failed     -> exactly the old behaviour. Nothing was
 *                                 recorded, so email is once again the only
 *                                 record: 503 (mailto fallback) if the key is
 *                                 missing, 502 on a provider error, 200 if the
 *                                 mail actually went out.
 *
 *   That second branch is also what makes this function safe to deploy BEFORE
 *   db/supabase-tickets-migration.sql is applied. Until the table exists every
 *   insert fails with Postgres 42P01 and this degrades to precisely the
 *   pre-ticket behaviour. Same pattern as promotions-admin.js.
 *
 * TENANCY
 *   client_id is never taken from the request body for a non-admin. It comes
 *   from the caller's own user_profiles row, which requireAuth has already
 *   loaded. An admin may pass a client_id (the widget sends the currently
 *   active client); an admin with no active client raises an INTERNAL ticket,
 *   which is the correct reading of BrandGEO staff filing something from
 *   inside the product.
 *
 * AI TRIAGE (added on top of the above, and deliberately subordinate to it)
 *   Once the row exists, one cheap Haiku call (_triage.js) judges urgency and
 *   drafts an acknowledgement. What that produces is written back as:
 *     - tickets.priority, with the SERVICE ROLE client. This is the one
 *       legitimate way the RLS-pinned 'normal' is raised. The pin is what makes
 *       the raise safe: a customer cannot declare its own ticket urgent, so the
 *       priority in the queue always came from BrandGEO, never from the filer.
 *     - an INTERNAL comment (is_internal = true) carrying the reasoning. The
 *       comments SELECT policy makes that unreadable to any customer, which is
 *       why the reasoning needs no new column and no new migration.
 *     - a PUBLIC comment (is_internal = false) carrying the acknowledgement, so
 *       the customer sees a reply immediately.
 *   Then recordAdminEvent fires with the resolved priority in the title, so an
 *   urgent ticket is legible in the dashboard bell at a glance.
 *
 *   NONE OF THIS CAN COST THE CUSTOMER THEIR TICKET. triageTicket never throws
 *   and is hard-timeout-bounded; every write below is individually try/caught
 *   and only warns. A total triage failure leaves a normal-priority ticket for
 *   a human to triage, which is exactly the pre-triage behaviour.
 *
 * POST body:  { message, subject?, email?, brand?, page?, client_id? }
 * 200 ->      { ok: true, ticket_id: number|null, persisted: boolean, notified: boolean,
 *               priority: string|null, triaged: boolean }
 * 503 ->      { error } only when nothing was persisted AND email is unconfigured.
 */
const { requireAuth } = require('./_auth')
const { triageTicket } = require('./_triage')
const { recordAdminEvent } = require('./_admin_notify')

const MAX_SUBJECT = 200
const MAX_BODY = 20000

const APP_URL = 'https://app.getbrandgeo.com'

/** Only these two are worth interrupting an admin over. */
const NOTIFY_PRIORITIES = new Set(['high', 'urgent'])

exports.handler = async (event) => {
  // requireAuth handles the OPTIONS preflight itself, so the method check has
  // to come after it or CORS preflight would 405.
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  const headers = auth.headers
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return json(400, { error: 'Bad JSON' }) }

  const message = (body.message || '').toString().trim()
  if (!message) return json(400, { error: 'Message is required' })

  const subject   = ((body.subject || '').toString().trim() || 'Support request').slice(0, MAX_SUBJECT)
  const fromEmail = (body.email || '').toString().slice(0, MAX_SUBJECT)
  const brand     = (body.brand || '').toString().slice(0, MAX_SUBJECT)
  const page      = (body.page || '').toString().slice(0, MAX_SUBJECT)

  const isAdmin = auth.profile && auth.profile.role === 'admin'

  // Non-admin: the caller's own tenant, full stop. Admin: whatever client the
  // dashboard had active, or none (an internal ticket).
  let clientId = null
  if (isAdmin) {
    const asked = Number(body.client_id)
    clientId = Number.isInteger(asked) && asked > 0 ? asked : null
  } else {
    clientId = auth.profile && auth.profile.client_id != null ? auth.profile.client_id : null
  }

  // tickets_source_tenancy_check pairs these two, so they are derived together
  // and never passed in from the client.
  const source = clientId === null ? 'internal' : 'customer'

  // ---- 1. Persist -----------------------------------------------------------
  // auth.supabase is the service-key client requireAuth already built. It
  // bypasses RLS, which is why every tenancy field above is derived from the
  // verified profile rather than from the request body.
  let ticketId = null
  let persistError = null
  try {
    const { data, error } = await auth.supabase
      .from('tickets')
      .insert({
        client_id:  clientId,
        created_by: auth.user.id,
        source,
        subject,
        body:       message.slice(0, MAX_BODY),
        status:     'open',
        priority:   'normal',
        page:       page || null,
      })
      .select('id')
      .single()

    if (error) {
      persistError = error
    } else {
      ticketId = data.id
    }
  } catch (e) {
    persistError = e
  }

  if (persistError) {
    // Logged with enough context to diagnose: the Postgres code tells apart
    // "migration not applied" (42P01) from a constraint or connectivity fault.
    console.error(
      '[support-request] ticket insert failed',
      `code=${persistError.code || 'none'}`,
      `client_id=${clientId}`,
      `user=${auth.user.id}`,
      String(persistError.message || persistError).slice(0, 300),
    )
  }

  // ---- 2. Triage ------------------------------------------------------------
  // Only runs when there is a row to attach the result to. Everything here is
  // best-effort: the ticket is already safe at this point.
  let priority = ticketId === null ? null : 'normal'
  let triaged = false

  if (ticketId !== null) {
    // Plan and name are context for judging impact (a paying customer blocked
    // is worse than a free one browsing). Failure here is not worth a retry;
    // triage just runs with less context.
    let plan = null
    let clientName = null
    if (clientId !== null) {
      try {
        const { data: client } = await auth.supabase
          .from('clients').select('plan, name').eq('id', clientId).maybeSingle()
        if (client) { plan = client.plan || null; clientName = client.name || null }
      } catch (e) {
        console.warn('[support-request] client lookup for triage failed:', String(e.message || e).slice(0, 200))
      }
    }

    const result = await triageTicket({
      subject,
      body: message,
      plan,
      clientName,
    })

    triaged = result.ok
    console.log(
      `[support-request] triage ticket ${ticketId}`,
      `ok=${result.ok}`,
      `priority=${result.priority}`,
      `failure=${result.failure || 'none'}`,
      `safe_reply=${result.replyIsSafeFallback}`,
    )

    // 2a. Raise the priority. SERVICE ROLE, bypassing the RLS pin on purpose.
    // Skipped when triage returned 'normal', because the row already is.
    if (result.priority !== 'normal') {
      try {
        const { error } = await auth.supabase
          .from('tickets').update({ priority: result.priority }).eq('id', ticketId)
        if (error) {
          console.error(
            `[support-request] priority update failed for ticket ${ticketId}`,
            `code=${error.code || 'none'}`,
            String(error.message || error).slice(0, 300),
          )
        } else {
          priority = result.priority
        }
      } catch (e) {
        console.error(`[support-request] priority update threw for ticket ${ticketId}`, String(e.message || e).slice(0, 300))
      }
    }

    // 2b. The reasoning, as an INTERNAL comment. A customer can never read this
    // (ticket_comments_select excludes is_internal rows for a viewer), which is
    // what lets the reasoning be stored without a schema change. author is NULL
    // because no human wrote it; the body says so.
    const internalLines = [
      result.ok
        ? `Automatic triage: ${result.priority.toUpperCase()}`
        : 'Automatic triage did not run. Priority left at normal for manual triage.',
    ]
    if (result.summary) internalLines.push(`Summary: ${result.summary}`)
    if (result.reason) internalLines.push(`Reason: ${result.reason}`)
    if (result.failure) internalLines.push(`Note: ${result.failure}`)
    if (result.replyIsSafeFallback) {
      internalLines.push('The customer received the fixed acknowledgement, not generated text.')
    }
    internalLines.push('Written by the intake assistant. Not reviewed by a person.')

    await addComment(auth.supabase, ticketId, internalLines.join('\n'), true)

    // 2c. The acknowledgement, as a PUBLIC comment. Always safe to post: it is
    // either guardrail-validated model text or the fixed fallback.
    await addComment(auth.supabase, ticketId, result.reply, false)

    // 2d. The dashboard bell. Priority leads the title so an urgent ticket is
    // legible at a glance in the feed. The bell row is written for every
    // ticket; the ADMIN_ALERT_EMAIL only fires for high and urgent, because
    // support@ already receives an email for every ticket below and a second
    // one per routine ticket is noise, not speed.
    const label = (priority || 'normal').toUpperCase()
    await recordAdminEvent(auth.supabase, {
      type: 'support_ticket',
      client_id: clientId,
      title: `[${label}] Support ticket #${ticketId}: ${subject}`,
      body: result.summary || message.slice(0, 300),
      // ticket id in meta so the UI can deep-link straight to the queue.
      meta: {
        ticket_id: ticketId,
        priority: priority || 'normal',
        triaged: result.ok,
        triage_failure: result.failure || null,
        source,
        page: page || null,
        url: `${APP_URL}/tickets`,
      },
      // Owner's call 2026-07-29: email on EVERY ticket, not only high and
      // urgent. Ticket volume is currently zero, so there is no noise to
      // suppress, and missing the first real customer ticket costs more than
      // a redundant email. Narrow this to NOTIFY_PRIORITIES once volume
      // makes routine tickets noise rather than signal.
      email: true,
    })
  }

  // ---- 3. Notify ------------------------------------------------------------
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    if (ticketId === null) {
      // Nothing recorded and no way to mail it. This is the original 503 case,
      // unchanged, and the widget still offers its mailto fallback here.
      return json(503, { error: 'Support email not configured' })
    }
    console.warn(`[support-request] ticket ${ticketId} saved but RESEND_API_KEY is absent; no notification sent`)
    return json(200, { ok: true, ticket_id: ticketId, persisted: true, notified: false, priority, triaged })
  }

  const ref = ticketId === null ? 'unsaved' : `#${ticketId}`
  const prio = (priority || 'normal').toUpperCase()
  const html = `
    <h2 style="margin:0 0 12px">New dashboard support request ${esc(ref)}</h2>
    <p style="margin:2px 0"><strong>Priority:</strong> ${esc(prio)}${triaged ? '' : ' (not triaged automatically)'}</p>
    <p style="margin:2px 0"><strong>From:</strong> ${esc(fromEmail) || 'unknown'}</p>
    <p style="margin:2px 0"><strong>Brand:</strong> ${esc(brand) || '-'}</p>
    <p style="margin:2px 0"><strong>Client id:</strong> ${esc(clientId === null ? 'internal (none)' : clientId)}</p>
    <p style="margin:2px 0"><strong>Page:</strong> ${esc(page) || '-'}</p>
    <p style="margin:2px 0"><strong>Subject:</strong> ${esc(subject)}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:14px 0" />
    <p style="white-space:pre-wrap;margin:0">${esc(message)}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:14px 0" />
    <p style="margin:0;font-size:12px;color:#64748b">${
      ticketId === null
        ? 'NOT SAVED as a ticket. The insert failed, so this email is the only record. Check the function log.'
        : `Triage it at https://app.getbrandgeo.com/tickets (ticket ${esc(ref)}).`
    }</p>
  `

  let notified = false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'BrandGEO Support <noreply@mail.getbrandgeo.com>',
        to: ['support@getbrandgeo.com'],
        reply_to: fromEmail || undefined,
        subject: `[Dashboard][${prio}] ${ref} ${subject}`,
        html,
      }),
    })
    if (res.ok) {
      notified = true
    } else {
      const t = await res.text().catch(() => '')
      console.error('[support-request] resend error', res.status, t.slice(0, 300))
      // Only fatal when nothing was persisted. Same 502 as before in that case.
      if (ticketId === null) return json(502, { error: 'Email provider error' })
    }
  } catch (e) {
    console.error('[support-request] send failed', e)
    if (ticketId === null) return json(500, { error: 'Send failed' })
  }

  return json(200, { ok: true, ticket_id: ticketId, persisted: ticketId !== null, notified, priority, triaged })
}

/**
 * Best-effort comment insert. Never throws and never fails the request: a
 * ticket with no acknowledgement comment is worse UX, not a lost request.
 * author is NULL because no human wrote it, and there is no service-role user
 * id to attribute it to. tickets.created_by is ON DELETE SET NULL and
 * ticket_comments.author is nullable, so a NULL author is an expected shape
 * (tickets-admin.js already renders it as 'unknown').
 */
async function addComment(supabase, ticketId, body, isInternal) {
  const text = String(body || '').trim()
  // ticket_comments_body_check rejects an empty body; do not send one.
  if (!text) return false
  try {
    const { error } = await supabase.from('ticket_comments').insert({
      ticket_id: ticketId,
      author: null,
      body: text.slice(0, MAX_BODY),
      is_internal: isInternal,
    })
    if (error) {
      console.error(
        `[support-request] ${isInternal ? 'internal' : 'public'} comment insert failed for ticket ${ticketId}`,
        `code=${error.code || 'none'}`,
        String(error.message || error).slice(0, 300),
      )
      return false
    }
    return true
  } catch (e) {
    console.error(
      `[support-request] ${isInternal ? 'internal' : 'public'} comment insert threw for ticket ${ticketId}`,
      String(e.message || e).slice(0, 300),
    )
    return false
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
