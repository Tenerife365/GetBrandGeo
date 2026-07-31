// ============================================================================
// expire-plan-grants.js  --  daily cron job. Reverts any time-boxed grant
// whose plan_grant_until has passed back to the Free plan, logs it, drops an
// in-dashboard notice for the client, and emails the admin a summary.
//
// Only touches clients whose plan_source is 'trial'/'comp'/'package' with a
// past plan_grant_until — open-ended paid plans ('stripe'/'manual') are never
// auto-changed. Service key bypasses RLS (admin cleanup).
//
// 'package' added 2026-07-31 (ROADMAP A1, docs/arch/custom-entitlements.md
// §2.1/§3.3) IN THE SAME CHANGE as the stripe-webhook.js code that starts
// writing it. That pairing is the whole point and is not optional: a package is
// a multi-month entitlement bought with ONE payment, so nothing else ever ends
// it. Left out of this filter, a client who paid for twelve months would keep
// the plan forever, silently and permanently, and it would not surface until
// someone audited plans against payments by hand.
//
// A package client is a PAYING customer, not a comp, so the customer-facing
// notice below is worded per source. The client_notifications.kind stays
// 'trial_expired' for every source because ClientBanner.tsx:51 and
// src/types/index.ts:162 both switch on that literal; only the words change.
//
// Invoked by Supabase pg_cron over pg_net at 06:10 UTC
// (db/supabase-scheduled-jobs-migration.sql), authenticated by the X-Cron-Key
// shared secret. It used to be a Netlify-scheduled function with no auth at
// all, which made it an unauthenticated plan-reversion and email amplifier —
// docs/qa/deploy-pipeline-netlify.md F1, redesigned in
// docs/arch/scheduled-function-auth.md.
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const { PLAN_LABELS } = require('./_plans');
const { sendBrandedEmail, APP_URL } = require('./_email');
const { recordAdminEvent } = require('./_admin_notify');
const { requireCronAuth } = require('./_cron_auth');

// Second copy of the default that lives in _admin_notify.js. Kept in sync by
// hand, which is exactly how it drifted: the first copy moved to support@ and
// this one did not, so plan-expiry alerts would have gone somewhere different
// from every other admin alert.
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'support@getbrandgeo.com';

// One row per invocation, success or failure, so "did the job run and what did
// it do" is answerable in SQL (arch doc §6.4). Never allowed to break the job:
// an observability write that throws would turn a good run into a bad one.
// Both failure shapes are handled on purpose: supabase-js RETURNS { error } for
// a database-level failure (missing table, RLS denial) and only THROWS at the
// network layer. Catching just the throw would silently swallow the likeliest
// failure of all — this code deployed before the migration that creates the
// table — and the job would look healthy while recording nothing.
async function recordJobRun(supabase, ok, detail) {
  try {
    const { error } = await supabase.from('job_runs').insert({ job: 'expire-plan-grants', ok, detail });
    if (error) console.error('[expire-plan-grants] job_runs write failed:', error.message);
  } catch (err) {
    console.error('[expire-plan-grants] job_runs write threw:', err.message);
  }
}

exports.handler = async (event) => {
  const gate = requireCronAuth(event);
  if (gate) return gate.response;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  const { data: due, error } = await supabase
    .from('clients')
    .select('id, name, plan, plan_source, plan_grant_until')
    .in('plan_source', ['trial', 'comp', 'package'])
    .not('plan_grant_until', 'is', null)
    .lt('plan_grant_until', today)
    .neq('plan', 'free');

  if (error) {
    console.error('[expire-plan-grants] query failed:', error.message);
    await recordJobRun(supabase, false, { error: error.message });
    return { statusCode: 500, body: error.message };
  }
  if (!due || !due.length) {
    console.log('[expire-plan-grants] nothing to expire');
    await recordJobRun(supabase, true, { expired: 0, due: 0 });
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

    // A package customer PAID for this period. Calling it "complimentary" in the
    // banner they see at the moment it lapses would be a plain falsehood about a
    // paid relationship, so the two words that make the claim are chosen by
    // source. Everything else, including kind, is identical.
    const wasPaid = c.plan_source === 'package';
    const planLabel = PLAN_LABELS[fromPlan] || fromPlan;
    await supabase.from('client_notifications').insert({
      client_id: c.id, kind: 'trial_expired',
      title: wasPaid
        ? `Your ${planLabel} package has ended`
        : `Your complimentary ${planLabel} plan has ended`,
      body: wasPaid
        ? `Your BrandGEO workspace has returned to the Free plan. To continue on ${planLabel}, reach out and we'll set up your next period.`
        : `Your BrandGEO workspace has returned to the Free plan. To keep the ${planLabel} features, reach out and we'll help you continue.`,
      meta: { from_plan: fromPlan, was: c.plan_source }, cta_label: 'View plans', cta_url: `${APP_URL}/account`,
    });

    // Bell row for the admin feed (email:false — the summary email below covers it).
    // The type stays 'trial_expired' (AdminBell.tsx:30 maps it to an icon); the
    // title says which kind of grant it was, because a lapsed PACKAGE is a
    // renewal conversation with a paying customer and a lapsed trial is not.
    await recordAdminEvent(supabase, {
      type: 'trial_expired', client_id: c.id, email: false,
      title: `${wasPaid ? 'Package' : 'Trial'} expired: ${c.name || `client ${c.id}`}`,
      body: `Reverted from ${planLabel} to Free.`,
      meta: { from_plan: fromPlan, was: c.plan_source },
    });

    expired.push({ id: c.id, name: c.name || `client ${c.id}`, fromPlan, source: c.plan_source });
    console.log(`[expire-plan-grants] client ${c.id} (${c.name}): ${fromPlan} -> free`);
  }

  // Admin summary (Pass 1: the admin notification bell isn't built yet, so email).
  if (expired.length) {
    await sendBrandedEmail({
      to: ADMIN_ALERT_EMAIL,
      // Admin-facing. Worded for all three sources since 'package' joined the
      // filter — calling a paid package a "trial" in the one place the team
      // reads each morning is how a renewal gets missed.
      subject: `${expired.length} BrandGEO plan grant${expired.length > 1 ? 's' : ''} expired to Free`,
      heading: `${expired.length} time-boxed plan${expired.length > 1 ? 's' : ''} ended today`,
      paragraphs: ['These clients reached the end of their trial, comp or package period and were reverted to Free:'],
      bullets: expired.map((e) => `${e.name} — was ${PLAN_LABELS[e.fromPlan] || e.fromPlan} (${e.source || 'unknown source'})`),
      cta: { label: 'Open dashboard', url: APP_URL },
    });
  }

  await recordJobRun(supabase, true, { expired: expired.length, due: due.length, clients: expired });
  return { statusCode: 200, body: `Expired ${expired.length} grant(s)` };
};
