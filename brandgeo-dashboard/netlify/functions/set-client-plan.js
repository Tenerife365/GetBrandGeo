// ============================================================================
// set-client-plan.js  --  admin-only: change a client's plan/tier, or grant a
// one-off trial / complimentary plan for a period, with an optional
// congratulatory notification (in-dashboard banner + branded email) to the client.
//
// The clients table is service-role write-only, so this holds the service key
// behind requireAuth({ adminOnly: true }). Every change writes an append-only
// client_events audit row. Trials/comps set plan_grant_until so expire-plan-grants.js
// reverts them to Free automatically.
//
// POST body:
//   { client_id, plan,
//     grant_type: 'manual' | 'trial' | 'comp',   (default 'manual')
//     period_days?: number,        // trial/comp: days from today
//     grant_until?: 'YYYY-MM-DD',  // trial/comp: explicit end date (overrides period_days)
//     note?: string,               // internal label, e.g. "Managed launch bonus"
//     notify?: boolean,            // default true — banner + email to the client
//     message?: string }           // optional extra line in the client notice
//
// -> { ok, client_id, plan, plan_source, plan_grant_until, tone, warning?,
//      notified, email }
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('./_auth');
const { isValidPlan, planRank, planUnlocks, PLAN_LABELS } = require('./_plans');
const { sendBrandedEmail, APP_URL } = require('./_email');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const GRANT_TYPES = new Set(['manual', 'trial', 'comp']);

function todayPlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function fmtDate(ymd) {
  const d = new Date(ymd);
  if (isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Build the client-facing notice (banner text + email content) for a change.
function buildNotice({ brandName, fromPlan, toPlan, grantType, grantUntil, message }) {
  const u = planUnlocks(toPlan);
  const isGrant = grantType === 'trial' || grantType === 'comp';
  const tone = planRank(toPlan) > planRank(fromPlan) ? 'upgrade'
    : planRank(toPlan) < planRank(fromPlan) ? 'downgrade' : 'same';

  const engineLine = u.engineLabels.length
    ? `${u.engineLabels.length} AI engine${u.engineLabels.length > 1 ? 's' : ''} monitored: ${u.engineLabels.join(', ')}.`
    : null;
  const untilHuman = grantUntil ? fmtDate(grantUntil) : null;

  let title;
  let leadPara;
  if (isGrant) {
    title = `You've unlocked ${u.label} on BrandGEO`;
    leadPara = `We've activated the ${u.label} plan on your BrandGEO workspace${untilHuman ? `, complimentary through ${untilHuman}` : ''}. There's nothing to pay.`;
  } else if (tone === 'upgrade') {
    title = `Your BrandGEO plan is now ${u.label}`;
    leadPara = `Your BrandGEO workspace has been upgraded to the ${u.label} plan.`;
  } else {
    title = `Your BrandGEO plan is now ${u.label}`;
    leadPara = `Your BrandGEO workspace is now on the ${u.label} plan.`;
  }

  const bullets = [];
  if (engineLine) bullets.push(engineLine);
  if (u.blurb) bullets.push(u.blurb);
  if (isGrant && untilHuman) {
    bullets.push(`Complimentary through ${untilHuman}. Your workspace returns to Free after that unless you choose to continue.`);
  }

  // Banner body: one compact plain-text line.
  const body = [leadPara, engineLine, message ? message.trim() : null].filter(Boolean).join(' ');

  const paragraphs = [`Hi ${brandName} team,`, leadPara];
  if (message && message.trim()) paragraphs.push(message.trim());
  paragraphs.push('Sign in to see it in action.');

  return {
    kind: isGrant ? 'plan_grant' : 'plan_change',
    tone,
    title,
    body,
    meta: { plan: toPlan, unlocked: u.engineLabels, until: grantUntil || null, tone, grant_type: grantType },
    email: {
      subject: title,
      heading: title,
      paragraphs,
      bullets,
      cta: { label: 'Open your dashboard', url: APP_URL },
      footerNote: isGrant && untilHuman
        ? `This is a complimentary ${u.label} plan through ${untilHuman}. When it ends, your workspace returns to the Free plan unless you choose to continue. No card is charged.`
        : null,
    },
  };
}

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true });
  if (auth.response) return auth.response;
  const { headers } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id, plan, note, message } = body;
  const grant_type = body.grant_type || 'manual';
  const notify = body.notify !== false;

  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };
  if (!isValidPlan(plan)) return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid plan. One of: free, essentials, growth, managed, pro, enterprise` }) };
  if (!GRANT_TYPES.has(grant_type)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'grant_type must be manual, trial or comp' }) };

  // Resolve the grant end date for trial/comp.
  let grantUntil = null;
  if (grant_type === 'trial' || grant_type === 'comp') {
    if (body.grant_until) {
      if (!DATE_RE.test(body.grant_until) || isNaN(Date.parse(body.grant_until))) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'grant_until must be YYYY-MM-DD' }) };
      }
      grantUntil = body.grant_until;
    } else if (Number.isInteger(body.period_days) && body.period_days > 0 && body.period_days <= 3650) {
      grantUntil = todayPlusDays(body.period_days);
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'A trial or comp needs period_days (1-3650) or grant_until (YYYY-MM-DD)' }) };
    }
    if (plan === 'free') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'A trial or comp grant needs a paid plan, not Free' }) };
    }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Load the current state (for from_plan, brand name, Stripe warning).
  const { data: client, error: ce } = await supabase
    .from('clients').select('id, name, plan, plan_source, stripe_subscription_id').eq('id', client_id).single();
  if (ce || !client) return { statusCode: 404, headers, body: JSON.stringify({ error: 'client not found' }) };

  const fromPlan = client.plan || 'free';

  // ---- update the plan ------------------------------------------------------
  const update = { plan, plan_source: grant_type };
  if (grant_type === 'trial' || grant_type === 'comp') {
    update.plan_grant_until = grantUntil;
    update.plan_grant_note = note || `${PLAN_LABELS[plan]} ${grant_type}`;
  } else {
    update.plan_grant_until = null;
    update.plan_grant_note = note || null;
  }

  const { error: ue } = await supabase.from('clients').update(update).eq('id', client_id);
  if (ue) {
    console.error('[set-client-plan] update failed:', ue.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: ue.message }) };
  }

  // ---- audit event ----------------------------------------------------------
  const eventType = grant_type === 'trial' ? 'trial_grant' : grant_type === 'comp' ? 'comp_grant' : 'plan_change';
  await supabase.from('client_events').insert({
    client_id, actor: auth.user.id, type: eventType, from_plan: fromPlan, to_plan: plan,
    meta: { grant_until: grantUntil, note: note || null, notified: notify },
  });

  // A manual change to a Stripe-billed client can be overwritten by the next
  // webhook — surface it rather than silently letting them drift.
  const warning = client.stripe_subscription_id
    ? 'This client has an active Stripe subscription; a Stripe event may later overwrite this manual change.'
    : null;

  // ---- notify the client (banner + email) -----------------------------------
  const notice = buildNotice({ brandName: client.name || 'there', fromPlan, toPlan: plan, grantType: grant_type, grantUntil, message });
  let emailResult = { sent: false };

  if (notify) {
    await supabase.from('client_notifications').insert({
      client_id, kind: notice.kind, title: notice.title, body: notice.body,
      meta: notice.meta, cta_label: 'Open your dashboard', cta_url: APP_URL,
    });

    // Resolve the client's login email(s) via user_profiles -> auth.users.
    const emails = [];
    try {
      const { data: profs } = await supabase.from('user_profiles').select('id').eq('client_id', client_id);
      for (const p of profs || []) {
        try {
          const { data } = await supabase.auth.admin.getUserById(p.id);
          if (data?.user?.email) emails.push(data.user.email);
        } catch { /* skip a user we can't resolve */ }
      }
    } catch (e) { console.warn('[set-client-plan] email lookup failed:', e.message); }

    if (emails.length) {
      const r = await sendBrandedEmail({ to: emails, ...notice.email });
      emailResult = { sent: r.ok, skipped: r.skipped, error: r.error, recipients: emails.length };
    } else {
      emailResult = { sent: false, skipped: true, error: 'no client login email found' };
    }
  }

  console.log(`[set-client-plan] client ${client_id}: ${fromPlan} -> ${plan} (${grant_type}${grantUntil ? ' until ' + grantUntil : ''}) by ${auth.user.id}`);
  return {
    statusCode: 200, headers,
    body: JSON.stringify({
      ok: true, client_id, plan, plan_source: grant_type, plan_grant_until: grantUntil,
      tone: notice.tone, warning, notified: notify, email: emailResult,
    }),
  };
};
