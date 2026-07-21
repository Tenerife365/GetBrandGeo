// ============================================================================
// client-users.js  --  admin-only: list the login users attached to a client
// (email, role, last sign-in, confirmed). auth.users isn't readable from the
// browser, so this resolves it server-side via user_profiles -> auth.admin.
//
// POST { client_id } -> { users: [{ email, role, last_sign_in_at, confirmed }] }
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('./_auth');

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true });
  if (auth.response) return auth.response;
  const { headers } = auth;

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: 'Invalid JSON' }; }
  const { client_id } = body;
  if (!client_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) };

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: profs, error } = await supabase.from('user_profiles').select('id, role').eq('client_id', client_id);
  if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };

  const users = [];
  for (const p of profs || []) {
    try {
      const { data } = await supabase.auth.admin.getUserById(p.id);
      if (data?.user) {
        users.push({
          email: data.user.email || null,
          role: p.role,
          last_sign_in_at: data.user.last_sign_in_at || null,
          confirmed: !!data.user.email_confirmed_at,
        });
      }
    } catch { /* skip a user we can't resolve */ }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ users }) };
};
