// ============================================================================
// _admin_notify.js  --  record an admin-facing notification (feed row for the
// dashboard bell) and optionally email the admin. Best-effort: never throws, so
// it can be dropped into signup / stripe / expiry paths without risking the
// underlying operation.
// ============================================================================
const { sendBrandedEmail, APP_URL } = require('./_email');

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'constantin@getbrandgeo.com';

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

module.exports = { recordAdminEvent, ADMIN_ALERT_EMAIL };
