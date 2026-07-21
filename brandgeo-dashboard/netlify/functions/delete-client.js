// ============================================================================
// delete-client.js  --  admin-only: permanently delete a client, ALL its data,
// and its login user(s), in the one order the schema allows. This is the single
// source of truth for account deletion so nothing is ever left orphaned.
//
// Why a function (not raw SQL): the schema does NOT cascade cleanly. Deleting an
// auth user cascades user_profiles but NOT the clients row; deleting a clients
// row is BLOCKED by ai_results / prompts / competitors / user_profiles (no
// cascade). So the correct order is:
//   1. delete each attached auth user (cascades their user_profiles)
//   2. delete any leftover user_profiles rows for the client
//   3. delete the no-cascade children (ai_results, prompts, competitors, user_clients)
//   4. delete the clients row (cascades social_*, recommendations,
//      client_events, client_notifications)
//
// POST body: { client_id, confirm }
//   confirm must equal the client's slug (typed by the admin) — a guard against
//   deleting the wrong account. Refuses if any attached user is an admin.
//
// -> { ok, client_id, name, deleted: { auth_users, ... }, warnings? }
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('./_auth');
const { recordAdminEvent } = require('./_admin_notify');

// Best-effort delete from a table that may not exist in every environment
// (e.g. user_clients). A missing table is not an error for this operation.
async function tryDelete(supabase, table, clientId, warnings) {
  try {
    const { error } = await supabase.from(table).delete().eq('client_id', clientId);
    if (error && !/does not exist|relation .* does not exist/i.test(error.message)) {
      warnings.push(`${table}: ${error.message}`);
    }
  } catch (e) {
    warnings.push(`${table}: ${e.message}`);
  }
}

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true });
  if (auth.response) return auth.response;
  const { headers } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  const { client_id, confirm } = body;
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Load the client so we can validate the confirmation and report its name.
  const { data: client, error: ce } = await supabase
    .from('clients').select('id, name, slug').eq('id', client_id).single();
  if (ce || !client) return { statusCode: 404, headers, body: JSON.stringify({ error: 'client not found' }) };

  // Typed-confirmation guard: the admin must echo the slug.
  if (!confirm || String(confirm).trim() !== client.slug) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: `Confirmation does not match. Type the account slug "${client.slug}" to delete.` }) };
  }

  // Who is attached? Refuse to delete an account that has an admin user, so this
  // can never nuke an administrator's own login.
  const { data: profs, error: pe } = await supabase
    .from('user_profiles').select('id, role').eq('client_id', client_id);
  if (pe) return { statusCode: 500, headers, body: JSON.stringify({ error: `user lookup failed: ${pe.message}` }) };
  if ((profs || []).some((p) => p.role === 'admin')) {
    return { statusCode: 409, headers, body: JSON.stringify({ error: 'This account has an admin user attached. Remove or downgrade that user before deleting.' }) };
  }

  const warnings = [];

  // 1. Delete each attached auth user (cascades their user_profiles row).
  let authDeleted = 0;
  for (const p of profs || []) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(p.id);
      if (error) warnings.push(`auth user ${p.id}: ${error.message}`);
      else authDeleted++;
    } catch (e) {
      warnings.push(`auth user ${p.id}: ${e.message}`);
    }
  }

  // 2. Remove any leftover user_profiles rows (e.g. an auth delete that failed),
  //    so the no-cascade FK from user_profiles.client_id can't block step 4.
  {
    const { error } = await supabase.from('user_profiles').delete().eq('client_id', client_id);
    if (error) warnings.push(`user_profiles: ${error.message}`);
  }

  // 3. No-cascade children that would otherwise block the clients delete.
  await tryDelete(supabase, 'ai_results', client_id, warnings);
  await tryDelete(supabase, 'prompts', client_id, warnings);
  await tryDelete(supabase, 'competitors', client_id, warnings);
  await tryDelete(supabase, 'user_clients', client_id, warnings); // multi-brand links, if present

  // 4. Delete the client (cascades social_*, recommendations, client_events,
  //    client_notifications).
  const { error: de } = await supabase.from('clients').delete().eq('id', client_id);
  if (de) {
    console.error('[delete-client] clients delete failed:', de.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: `Could not delete the client row: ${de.message}`, warnings }) };
  }

  // Audit row in the admin feed (client_id nulls out on delete; the title keeps
  // the name). email:false — the admin performed this themselves.
  await recordAdminEvent(supabase, {
    type: 'account_deleted', client_id: null, email: false,
    title: `Account deleted: ${client.name}`,
    body: `Client "${client.name}" (${client.slug}) and ${authDeleted} login user(s) were permanently deleted by an admin.`,
    meta: { deleted_client_id: client_id, slug: client.slug, actor: auth.user.id },
  });

  console.log(`[delete-client] deleted client ${client_id} (${client.slug}), ${authDeleted} auth user(s), by ${auth.user.id}`);
  return {
    statusCode: 200, headers,
    body: JSON.stringify({ ok: true, client_id, name: client.name, deleted: { auth_users: authDeleted }, warnings: warnings.length ? warnings : undefined }),
  };
};
