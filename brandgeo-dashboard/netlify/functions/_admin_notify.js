// ============================================================================
// _admin_notify.js  --  record an admin-facing notification (feed row for the
// dashboard bell) and optionally email the admin. Best-effort: never throws, so
// it can be dropped into signup / stripe / expiry paths without risking the
// underlying operation.
// ============================================================================
const { sendBrandedEmail, APP_URL } = require('./_email');

// CORRECTION 2026-07-29: an earlier version of this comment claimed the old
// default constantin@getbrandgeo.com was never provisioned and received no
// mail. That was WRONG. getbrandgeo.com's MX is SMTP.GOOGLE.com and the address
// is a verified Google Workspace send-as alias, so it has been receiving all
// along. No admin alert was lost.
//
// support@ is still the right default, for the real reason: a shared, monitored
// mailbox does not stop being read when one person is away, and admin alerts
// (signup, Stripe, plan expiry, client deletion, tickets) are operational mail
// rather than personal mail.
//
// NOTE the env var still wins. If ADMIN_ALERT_EMAIL is set in Netlify, changing
// this default does nothing.
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'support@getbrandgeo.com';

// How a client is named in an admin notification. One implementation, because
// this was already open-coded as `c.name || \`client ${c.id}\`` in
// expire-plan-grants.js while stripe-webhook.js said "A client" and named
// nobody at all. An admin reading "A client canceled" has to go and find out
// which one, which is exactly the work the bell exists to remove.
//
// Falls back to the id rather than to a friendly noun on purpose: "client 26"
// is still actionable (it is the row id, and the notification links to it),
// whereas "a client" is not. Pass any row that has id and, ideally, name.
function clientLabel(row) {
  if (!row) return 'A client'
  const name = typeof row.name === 'string' ? row.name.trim() : ''
  return name || `Client ${row.id}`
}

// supabase: a service-role client (bypasses RLS to insert the feed row).
// email: also send the admin an email (default true) — use false for events that
//        already send their own summary (e.g. the expiry job).
async function recordAdminEvent(supabase, { type, client_id = null, title, body = '', meta = {}, email = true }) {
  try {
    await supabase.from('admin_notifications').insert({ type, client_id, title, body, meta });
  } catch (e) {
    console.warn('[admin-notify] insert failed:', e.message);
  }
  if (email) {
    try {
      await sendBrandedEmail({
        to: ADMIN_ALERT_EMAIL,
        subject: title,
        heading: title,
        paragraphs: [body].filter(Boolean),
        cta: { label: 'Open dashboard', url: APP_URL },
      });
    } catch (e) {
      console.warn('[admin-notify] email failed:', e.message);
    }
  }
}

module.exports = { recordAdminEvent, clientLabel, ADMIN_ALERT_EMAIL };
