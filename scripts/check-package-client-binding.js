#!/usr/bin/env node
/**
 * check-package-client-binding.js
 *
 * Acceptance harness for price.metadata.client_id binding on the package path
 * (stripe-webhook.js resolveBoundClient + handleCheckoutCompleted).
 *
 * WHY A HARNESS AND NOT A READ-THROUGH. The defects this change nearly shipped
 * were both invisible to `node --check` and to reading the diff: a `profile`
 * reference left outside the block it is now scoped to, and an `existingUser`
 * dereference on a path where it is null. Both are runtime-only. A checker that
 * cannot fail on those is not a checker.
 *
 * Run:  node scripts/check-package-client-binding.js
 * Exits 0 on PASS, 1 on FAIL.
 */
const path = require('path');
const Module = require('module');

const FN_DIR = path.join(__dirname, '..', 'brandgeo-dashboard', 'netlify', 'functions');

// ---- fake Supabase -------------------------------------------------------
// Records every write so the assertions can check WHICH client was updated,
// which is the entire point of the feature.
function makeSupabase({ clients, users, profiles }) {
  const calls = { updates: [], inserts: [], listUsers: 0 };

  function table(name) {
    const q = { _t: name, _f: {}, _sel: null };
    q.select = (s) => { q._sel = s; return q; };
    q.eq = (c, v) => { q._f[c] = v; return q; };
    q.in = () => q;
    q.neq = () => q;
    q.maybeSingle = async () => {
      if (name === 'clients') {
        const row = clients.find((c) => c.id === q._f.id) || null;
        return { data: row, error: null };
      }
      if (name === 'user_profiles') {
        const row = profiles.find((p) => p.id === q._f.id) || null;
        return { data: row, error: null };
      }
      return { data: null, error: null };
    };
    q.update = (patch) => {
      const u = { table: name, patch, where: null };
      const chain = {
        eq: async (c, v) => {
          u.where = { [c]: v };
          calls.updates.push(u);
          const row = clients.find((x) => x.id === v);
          if (row) Object.assign(row, patch);
          return { error: null };
        },
      };
      return chain;
    };
    // insert() is awaited directly in some places and chained as
    // .insert().select().single() in createClientRow, so the stub must be BOTH
    // a thenable and a chain. Without this the negative control crashed instead
    // of asserting, which hides which check actually caught the regression.
    q.insert = (rows) => {
      calls.inserts.push({ table: name, rows });
      const row = Array.isArray(rows) ? rows[0] : rows;
      const made = { id: 999, ...row };
      const res = { data: made, error: null };
      const chain = {
        select: () => ({ single: async () => res, maybeSingle: async () => res }),
        then: (fn) => Promise.resolve({ error: null, data: rows }).then(fn),
      };
      return chain;
    };
    q.delete = () => ({ eq: async () => ({ error: null }) });
    return q;
  }

  return {
    calls,
    from: table,
    auth: {
      admin: {
        listUsers: async () => { calls.listUsers += 1; return { data: { users }, error: null }; },
        inviteUserByEmail: async () => ({ data: { user: { id: 'new-user' } }, error: null }),
        deleteUser: async () => ({}),
      },
    },
  };
}

// ---- load stripe-webhook.js with its heavy deps stubbed ------------------
function loadWebhook(supabase) {
  const realResolve = Module._resolveFilename;
  const realLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === 'stripe') return () => ({ checkout: { sessions: { listLineItems: async () => LINE_ITEMS } }, webhooks: {} });
    if (request === '@supabase/supabase-js') return { createClient: () => supabase };
    if (request === './_admin_notify') return { recordAdminEvent: async () => {}, clientLabel: async () => 'x' };
    return realLoad.apply(this, arguments);
  };
  let mod;
  try {
    delete require.cache[require.resolve(path.join(FN_DIR, 'stripe-webhook.js'))];
    mod = require(path.join(FN_DIR, 'stripe-webhook.js'));
  } finally {
    Module._load = realLoad;
    Module._resolveFilename = realResolve;
  }
  return mod;
}

let LINE_ITEMS = { data: [], has_more: false };

function session(overrides = {}) {
  return {
    id: 'cs_test_1',
    mode: 'payment',
    customer: 'cus_PAYER',
    customer_details: { email: 'accounts.payable@some-other-company.com' },
    ...overrides,
  };
}

function priceWith(metadata) {
  return { id: 'price_TEST', metadata };
}

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail || '' });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  -- ${detail}` : ''}`);
}

async function run() {
  const webhook = loadWebhook(makeSupabase({ clients: [], users: [], profiles: [] }));
  const handle = webhook.__test__ && webhook.__test__.handleCheckoutCompleted;
  if (!handle) {
    console.error('\nhandleCheckoutCompleted is not exported for testing.');
    console.error('Add at the bottom of stripe-webhook.js:');
    console.error("  exports.__test__ = { handleCheckoutCompleted, resolveBoundClient }");
    process.exit(1);
  }

  // ---- 1. BOUND: a stranger pays, the named client is provisioned ---------
  {
    const clients = [{ id: 1, name: 'Bucate pe Roate', plan: 'growth_pro', plan_source: null, plan_grant_until: null, stripe_customer_id: null, category: 'customer' }];
    const sb = makeSupabase({ clients, users: [], profiles: [] });
    const w = loadWebhook(sb);
    LINE_ITEMS = { data: [{ quantity: 1, price: priceWith({ plan: 'growth_pro', months: '10', client_id: '1' }) }], has_more: false };
    await w.__test__.handleCheckoutCompleted(session(), () => {});

    const upd = sb.calls.updates.find((u) => u.table === 'clients');
    check('bound: provisions the NAMED client, not the payer', upd && upd.where.id === 1, upd ? `updated client ${upd.where.id}` : 'no update at all');
    check('bound: never looks up the payer by email', sb.calls.listUsers === 0, `listUsers called ${sb.calls.listUsers}x`);
    check('bound: writes package source + grant', upd && upd.patch.plan_source === 'package' && !!upd.patch.plan_grant_until, upd ? JSON.stringify({ s: upd.patch.plan_source, g: upd.patch.plan_grant_until }) : '');
    check('bound: creates no new client', !sb.calls.inserts.some((i) => i.table === 'clients'), '');
  }

  // ---- 2. BOUND + existing customer id: must NOT be repointed -------------
  {
    const clients = [{ id: 1, name: 'BpR', plan: 'growth', plan_source: 'stripe', plan_grant_until: null, stripe_customer_id: 'cus_THEIRS', category: 'customer' }];
    const sb = makeSupabase({ clients, users: [], profiles: [] });
    const w = loadWebhook(sb);
    LINE_ITEMS = { data: [{ quantity: 1, price: priceWith({ plan: 'growth_pro', months: '10', client_id: '1' }) }], has_more: false };
    await w.__test__.handleCheckoutCompleted(session(), () => {});
    const upd = sb.calls.updates.find((u) => u.table === 'clients');
    check('bound: does not repoint an existing stripe_customer_id',
      upd && !Object.prototype.hasOwnProperty.call(upd.patch, 'stripe_customer_id'),
      upd ? `patch had stripe_customer_id=${upd.patch.stripe_customer_id}` : 'no update');
  }

  // ---- 3. NEGATIVE CONTROL: unbound package still uses the email path -----
  {
    const clients = [{ id: 7, name: 'Someone', plan: 'free', plan_source: null, plan_grant_until: null, stripe_customer_id: null, category: 'customer' }];
    const users = [{ id: 'u7', email: 'accounts.payable@some-other-company.com' }];
    const profiles = [{ id: 'u7', client_id: 7 }];
    const sb = makeSupabase({ clients, users, profiles });
    const w = loadWebhook(sb);
    LINE_ITEMS = { data: [{ quantity: 1, price: priceWith({ plan: 'growth_pro', months: '10' }) }], has_more: false };
    await w.__test__.handleCheckoutCompleted(session(), () => {});
    const upd = sb.calls.updates.find((u) => u.table === 'clients');
    check('unbound: falls back to the payer email path unchanged', upd && upd.where.id === 7, upd ? `updated ${upd.where.id}` : 'no update');
    check('unbound: DOES look the payer up by email', sb.calls.listUsers > 0, `listUsers ${sb.calls.listUsers}x`);
  }

  // ---- 4. FAIL CLOSED: unknown client_id provisions nothing ---------------
  {
    const sb = makeSupabase({ clients: [], users: [], profiles: [] });
    const w = loadWebhook(sb);
    LINE_ITEMS = { data: [{ quantity: 1, price: priceWith({ plan: 'growth_pro', months: '10', client_id: '9999' }) }], has_more: false };
    await w.__test__.handleCheckoutCompleted(session(), () => {});
    check('unknown client_id: provisions nothing', sb.calls.updates.length === 0 && !sb.calls.inserts.some((i) => i.table === 'clients'), `${sb.calls.updates.length} updates`);
  }

  // ---- 5. FAIL CLOSED: non-numeric client_id -----------------------------
  {
    const sb = makeSupabase({ clients: [{ id: 1, name: 'x', plan: 'free', category: 'customer' }], users: [], profiles: [] });
    const w = loadWebhook(sb);
    LINE_ITEMS = { data: [{ quantity: 1, price: priceWith({ plan: 'growth_pro', months: '10', client_id: '1 BpR' }) }], has_more: false };
    await w.__test__.handleCheckoutCompleted(session(), () => {});
    check('malformed client_id: provisions nothing', sb.calls.updates.length === 0, `${sb.calls.updates.length} updates`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((e) => { console.error('HARNESS ERROR:', e.stack || e.message); process.exit(1); });
