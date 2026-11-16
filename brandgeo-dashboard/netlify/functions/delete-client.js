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
//   deleting the wrong account. Refuses if any attached user is an admin, and
//   (docs/arch/agency-multi-brand.md 9.5) with a 409 naming the logins when the
//   brand is an agency home brand or its logins reach other brands through an
//   account or a user_clients row. Every refusal runs before step 1.
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

// Emails of the given login ids, for a 409 that names them. A login that
// cannot be resolved is named by its id. Admin-only response, so the address
// is shown to an admin, never to a customer.
async function loginNames(supabase, ids) {
  const out = [];
  for (const id of ids) {
    let name = id;
    try {
      const { data, error } = await supabase.auth.admin.getUserById(id);
      if (!error && data && data.user && data.user.email) name = data.user.email;
    } catch { /* keep the id */ }
    out.push(name);
  }
  return out;
}

const errTag = (e) => (e && (e.code || e.message)) || 'unknown';

// The three refusals of docs/arch/agency-multi-brand.md 9.5, in order. Reads
// only. -> {} (no refusal) | { message } (409) | { error } (a read failed).
//   1. the brand is the home brand of an agency account;
//   2. a login whose default brand is this brand is a member of an agency
//      account, or of a direct account that holds other brands;
//   3. such a login holds a user_clients row on any other brand.
// An ordinary direct customer (one brand, its logins owners of that brand's
// own direct account and nothing else) passes all three.
async function agencyRefusal(supabase, client, profs) {
  const ids = profs.map((p) => p.id);

  if (client.account_id !== null && client.account_id !== undefined) {
    const { data: acct, error } = await supabase
      .from('accounts').select('id, kind, home_client_id').eq('id', client.account_id).maybeSingle();
    if (error) return { error: `accounts read: ${errTag(error)}` };
    if (acct && acct.kind === 'agency' && String(acct.home_client_id) === String(client.id)) {
      const names = await loginNames(supabase, ids);
      return { message: `This brand is the home brand of an agency account and cannot be deleted. Logins on it: ${names.length ? names.join(', ') : 'none'}.` };
    }
  }
  if (!ids.length) return {};

  const { data: mems, error: me } = await supabase
    .from('account_members').select('account_id, user_id').in('user_id', ids);
  if (me) return { error: `account_members read: ${errTag(me)}` };
  const memberRows = mems || [];
  if (memberRows.length) {
    const acctIds = Array.from(new Set(memberRows.map((m) => m.account_id)));
    const { data: accts, error: ae } = await supabase.from('accounts').select('id, kind').in('id', acctIds);
    if (ae) return { error: `accounts read: ${errTag(ae)}` };
    const { data: brands, error: be } = await supabase.from('clients').select('id, account_id').in('account_id', acctIds);
    if (be) return { error: `clients read: ${errTag(be)}` };
    const kindOf = new Map((accts || []).map((a) => [String(a.id), a.kind]));
    const blocked = [];
    for (const m of memberRows) {
      const kind = kindOf.get(String(m.account_id));
      const others = (brands || []).filter((b) => String(b.account_id) === String(m.account_id) && String(b.id) !== String(client.id)).length;
      // An account row that cannot be found is refused, not assumed direct.
      if (kind !== 'direct' || others > 0) blocked.push(m.user_id);
    }
    if (blocked.length) {
      const names = await loginNames(supabase, Array.from(new Set(blocked)));
      return { message: `Logins on this brand belong to an agency account or to an account with other brands. Remove them from that account first: ${names.join(', ')}.` };
    }
  }

  const { data: rows, error: re } = await supabase
    .from('user_clients').select('user_id, client_id').in('user_id', ids);
  if (re) return { error: `user_clients read: ${errTag(re)}` };
  const elsewhere = (rows || []).filter((r) => String(r.client_id) !== String(client.id)).map((r) => r.user_id);
  if (elsewhere.length) {
    const names = await loginNames(supabase, Array.from(new Set(elsewhere)));
    return { message: `Logins on this brand can also reach other brands. Remove their access to those brands first: ${names.join(', ')}.` };
  }
  return {};
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
    .from('clients').select('id, name, slug, account_id').eq('id', client_id).single();
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

  // Agency refusals (ledger row 29, docs/arch/agency-multi-brand.md 9.5). All
  // three run here, BEFORE the first destructive step below, because a late
  // refusal would leave a half-deleted brand. A read error refuses too (500):
  // this function must never delete what it could not check.
  const refusal = await agencyRefusal(supabase, client, profs || []);
  if (refusal.error) {
    console.error(`[delete-client] agency checks for client ${client_id} failed: ${refusal.error}`);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not check the account links of this brand. Nothing was deleted.' }) };
  }
  if (refusal.message) {
    return { statusCode: 409, headers, body: JSON.stringify({ error: refusal.message }) };
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
