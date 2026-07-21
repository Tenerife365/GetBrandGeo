// ============================================================================
// expire-plan-grants.js  --  scheduled (daily). Reverts any trial/comp grant
// whose plan_grant_until has passed back to the Free plan, logs it, drops an
// in-dashboard notice for the client, and emails the admin a summary.
//
// Only touches clients whose plan_source is 'trial'/'comp' with a past
// plan_grant_until — paid ('stripe'/'manual') plans are never auto-changed.
// Service key bypasses RLS (admin cleanup), same posture as purge-old-results.js.
// Scheduled in netlify.toml.
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const { PLAN_LABELS } = require('./_plans');
const { sendBrandedEmail, APP_URL } = require('./_email');
const { recordAdminEvent } = require('./_admin_notify');

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'constantin@getbrandgeo.com';

exports.handler = async () => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  const { data: due, error } = await supabase
    .from('clients')
    .select('id, name, plan, plan_source, plan_grant_until')
    .in('plan_source', ['trial', 'comp'])
    .not('plan_grant_until', 'is', null)
    .lt('plan_grant_until', today)
    .neq('plan', 'free');

  if (error) {
    console.error('[expire-plan-grants] query failed:', error.message);
    return { statusCode: 500, body: error.message };
  }
  if (!due || !due.length) {
    console.log('[expire-plan-grants] nothing to expire');
    return { statusCode: 200, body: 'Nothing to expire' };
  }

  const expired = [];
  for (const c of due) {
    const fromPlan = c.plan;
    const { error: ue } = await supabase.from('clients').update({
      plan: 'free', plan_source: 'expired', plan_grant_until: null, plan_grant_note: null,
    }).eq('id', c.id);
    if (ue) { console.error(`[expire-plan-grants] update ${c.id} failed:`, ue.message); continue; }

    await supabase.from('client_events').insert({
      client_id: c.id, actor: null, type: 'trial_expired', from_plan: fromPlan, to_plan: 'free',
      meta: { was: c.plan_source, ended: c.plan_grant_until },
    });

    await supabase.from('client_notifications').insert({
      client_id: c.id, kind: 'trial_expired',
      title: `Your complimentary ${PLAN_LABELS[fromPlan] || fromPlan} plan has ended`,
      body: `Your BrandGEO workspace has returned to the Free plan. To keep the ${PLAN_LABELS[fromPlan] || fromPlan} features, reach out and we'll help you continue.`,
      meta: { from_plan: fromPlan }, cta_label: 'View plans', cta_url: `${APP_URL}/account`,
    });

    // Bell row for the admin feed (email:false — the summary email below covers it).
    await recordAdminEvent(supabase, {
      type: 'trial_expired', client_id: c.id, email: false,
      title: `Trial expired: ${c.name || `client ${c.id}`}`,
      body: `Reverted from ${PLAN_LABELS[fromPlan] || fromPlan} to Free.`,
      meta: { from_plan: fromPlan },
    });

    expired.push({ id: c.id, name: c.name || `client ${c.id}`, fromPlan });
    console.log(`[expire-plan-grants] client ${c.id} (${c.name}): ${fromPlan} -> free`);
  }

  // Admin summary (Pass 1: the admin notification bell isn't built yet, so email).
  if (expired.length) {
    await sendBrandedEmail({
      to: ADMIN_ALERT_EMAIL,
      subject: `${expired.length} BrandGEO trial${expired.length > 1 ? 's' : ''} expired to Free`,
      heading: `${expired.length} complimentary plan${expired.length > 1 ? 's' : ''} ended today`,
      paragraphs: ['These clients reached the end of their trial/comp period and were reverted to Free:'],
      bullets: expired.map((e) => `${e.name} — was ${PLAN_LABELS[e.fromPlan] || e.fromPlan}`),
      cta: { label: 'Open dashboard', url: APP_URL },
    });
  }

  return { statusCode: 200, body: `Expired ${expired.length} grant(s)` };
};
