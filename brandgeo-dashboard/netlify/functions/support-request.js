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
 * POST body:  { message, subject?, email?, brand?, page?, client_id? }
 * 200 ->      { ok: true, ticket_id: number|null, persisted: boolean, notified: boolean }
 * 503 ->      { error } only when nothing was persisted AND email is unconfigured.
 */
const { requireAuth } = require('./_auth')

const MAX_SUBJECT = 200
const MAX_BODY = 20000

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

  // ---- 2. Notify ------------------------------------------------------------
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    if (ticketId === null) {
      // Nothing recorded and no way to mail it. This is the original 503 case,
      // unchanged, and the widget still offers its mailto fallback here.
      return json(503, { error: 'Support email not configured' })
    }
    console.warn(`[support-request] ticket ${ticketId} saved but RESEND_API_KEY is absent; no notification sent`)
    return json(200, { ok: true, ticket_id: ticketId, persisted: true, notified: false })
  }

  const ref = ticketId === null ? 'unsaved' : `#${ticketId}`
  const html = `
    <h2 style="margin:0 0 12px">New dashboard support request ${esc(ref)}</h2>
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
        subject: `[Dashboard] ${ref} ${subject}`,
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

  return json(200, { ok: true, ticket_id: ticketId, persisted: ticketId !== null, notified })
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
