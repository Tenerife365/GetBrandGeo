/**
 * activate-client-background.js
 * First-run activation for a freshly provisioned self-serve client: seed their
 * prompts and enqueue their first collection.
 *
 * Netlify Background Function (the `-background` filename suffix), so it gets up
 * to 15 minutes and takes no netlify.toml timeout entry, same mechanism as
 * collection-worker-background.js and run-full-audit-background.js. That is the
 * whole reason it is a separate endpoint: the work can include a homepage fetch
 * and an LLM call, and provision-account.js runs on a 15s budget with the
 * customer watching a spinner. Provisioning fires this and returns immediately.
 *
 * Triggered by provision-account.js only. The actual rules live in _activation.js.
 *
 * POST body: { client_id: number, user_id?: string }
 * Header:    X-Internal-Key (REQUIRED, see the gate below).
 *
 * THE GATE FAILS CLOSED, unlike collection-worker-background.js:35-43, which
 * accepts an unauthenticated trigger when INTERNAL_AUDIT_KEY is unset and warns
 * to a log nobody reads. That behaviour is recorded as a known latent defect
 * (R1) and is not worth copying into a new file: this endpoint takes an
 * arbitrary client_id, writes rows for it and spends engine budget on it, so an
 * unset environment variable, the single most likely serverless
 * misconfiguration, must stop it rather than open it. _cron_auth.js took the
 * same decision for the same reason. The cost of failing closed here is that
 * activation quietly does not happen, which is precisely the behaviour this
 * whole change replaces, so degradation is graceful.
 */

const { createClient } = require('@supabase/supabase-js')
const { activateClient } = require('./_activation')

function json(statusCode, payload) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method not allowed' })

  const expected = process.env.INTERNAL_AUDIT_KEY
  if (!expected) {
    console.error('[Activate] INTERNAL_AUDIT_KEY is not set, refusing all requests')
    return json(503, { error: 'activation not configured' })
  }
  const provided = event.headers['x-internal-key'] || event.headers['X-Internal-Key'] || ''
  if (provided !== expected) return json(401, { error: 'unauthorized' })

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return json(400, { error: 'invalid body' }) }

  const clientId = Number(body.client_id)
  if (!Number.isInteger(clientId) || clientId <= 0) return json(400, { error: 'client_id required' })
  const userId = typeof body.user_id === 'string' && body.user_id ? body.user_id : null

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Every field comes off the clients row, never off the request body. The
  // caller supplies an id and nothing else that can steer what gets seeded or
  // which engines get spent.
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, plan, brand_website, brand_aliases, name')
    .eq('id', clientId)
    .maybeSingle()

  if (clientErr) {
    console.error(`[Activate] client ${clientId} read failed: ${clientErr.message}`)
    return json(500, { error: 'client read failed' })
  }
  if (!client) return json(404, { error: 'client not found' })

  const aliases = Array.isArray(client.brand_aliases) ? client.brand_aliases : []
  const summary = await activateClient(supabase, {
    clientId:     client.id,
    plan:         client.plan || 'free',
    domain:       client.brand_website || '',
    brandAliases: aliases.length > 0 ? aliases : (client.name ? [client.name] : []),
    createdBy:    userId,
  })

  console.log(`[Activate] client ${clientId}: ${JSON.stringify(summary)}`)

  // Best-effort trail, so "did this customer's dashboard inherit their public
  // audit's prompts, and did their first collection start" is answerable from
  // the database later. client_events already carries this client's 'signup'
  // row from provision-account.js; this is the second half of that story.
  // A plan write is the only thing that needs from_plan/to_plan to differ, and
  // nothing here writes a plan, so both name the plan the client is already on.
  try {
    await supabase.from('client_events').insert({
      client_id: clientId,
      actor:     userId,
      type:      'activated',
      from_plan: client.plan || 'free',
      to_plan:   client.plan || 'free',
      meta:      { source: 'activate-client-background', ...summary },
    })
  } catch (e) {
    console.error(`[Activate] audit row threw for client ${clientId}: ${e.message}`)
  }

  return json(200, summary)
}
