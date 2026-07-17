/**
 * support-request.js — receives a support message from a signed-in dashboard
 * user (SupportWidget.tsx) and emails it to support@getbrandgeo.com via Resend
 * (the same verified sending domain used for the auth emails, CLAUDE.md §106).
 *
 * Requires the RESEND_API_KEY env var in Netlify. If it's missing the function
 * returns 503 and the widget offers a mailto: fallback, so nothing is lost.
 */
const { requireAuth } = require('./_auth')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // Authenticated users only (validates JWT + origin) — keeps this off the open
  // internet so it can't be used as an anonymous email relay.
  const auth = await requireAuth(event)
  if (auth && auth.response) return auth.response

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return json(400, { error: 'Bad JSON' }) }

  const message = (body.message || '').toString().trim()
  if (!message) return json(400, { error: 'Message is required' })
  const subject   = (body.subject || 'Support request').toString().slice(0, 200)
  const fromEmail = (body.email || '').toString().slice(0, 200)
  const brand     = (body.brand || '').toString().slice(0, 200)
  const page      = (body.page || '').toString().slice(0, 200)

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return json(503, { error: 'Support email not configured' })

  const html = `
    <h2 style="margin:0 0 12px">New dashboard support request</h2>
    <p style="margin:2px 0"><strong>From:</strong> ${esc(fromEmail) || 'unknown'}</p>
    <p style="margin:2px 0"><strong>Brand:</strong> ${esc(brand) || '-'}</p>
    <p style="margin:2px 0"><strong>Page:</strong> ${esc(page) || '-'}</p>
    <p style="margin:2px 0"><strong>Subject:</strong> ${esc(subject)}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:14px 0" />
    <p style="white-space:pre-wrap;margin:0">${esc(message)}</p>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'BrandGEO Support <noreply@mail.getbrandgeo.com>',
        to: ['support@getbrandgeo.com'],
        reply_to: fromEmail || undefined,
        subject: `[Dashboard] ${subject}`,
        html,
      }),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      console.error('[support-request] resend error', res.status, t.slice(0, 300))
      return json(502, { error: 'Email provider error' })
    }
    return json(200, { ok: true })
  } catch (e) {
    console.error('[support-request] send failed', e)
    return json(500, { error: 'Send failed' })
  }
}

function json(statusCode, obj) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
