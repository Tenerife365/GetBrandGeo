/**
 * affiliate-programs-public.js -- GET, no auth. The list the public
 * /affiliates page renders: ACTIVE and PUBLIC programs only, with the fields a
 * prospective affiliate needs and nothing else (no api key, no internal notes,
 * no counts). Draft, paused, archived and private programs never appear here.
 *
 * Cached for five minutes at the edge; a program change shows within that.
 */

const { createClient } = require('@supabase/supabase-js')
const { corsHeaders, preflight, PUBLIC_ALLOWED_ORIGINS } = require('./_prospect_guard')
const { summarizeRules, centsToMajor } = require('./_affiliate_core')

function publicShape(p) {
  let destinationHost = null
  try { destinationHost = new URL(p.destination_url).hostname } catch { /* leave null */ }
  return {
    slug: p.slug,
    name: p.name,
    tagline: p.tagline || null,
    description: p.description || null,
    logo_url: p.logo_url || null,
    brand_color: p.brand_color || null,
    destination_host: destinationHost,
    currency: p.currency,
    commission_summary: summarizeRules(p),
    lead_commission: centsToMajor(p.lead_commission_cents),
    sale_commission_type: p.sale_commission_type,
    sale_commission: p.sale_commission_type === 'fixed' ? centsToMajor(p.sale_commission_cents) : null,
    sale_commission_percent: p.sale_commission_type === 'percent' ? Number(p.sale_commission_bps) / 100 : null,
    recurring_percent: Number(p.recurring_commission_bps) > 0 ? Number(p.recurring_commission_bps) / 100 : null,
    recurring_months: p.recurring_months,
    attribution_days: p.attribution_days,
    approval_days: p.approval_days,
    min_payout: centsToMajor(p.min_payout_cents),
    payout_schedule: p.payout_schedule,
    terms_url: p.terms_url || 'https://getbrandgeo.com/affiliate-terms.html',
  }
}

async function handle(event, { supabase = null } = {}) {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  const headers = { ...corsHeaders(origin), 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Cache-Control': 'public, max-age=300' }
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (origin && !PUBLIC_ALLOWED_ORIGINS.includes(origin)) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: origin not allowed' }) }

  const db = supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data, error } = await db.from('affiliate_programs').select('*').eq('status', 'active').eq('is_public', true).order('created_at', { ascending: true })
  if (error) {
    console.error('[affiliate-programs-public] list failed:', error.message)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Programs are unavailable right now' }) }
  }
  return { statusCode: 200, headers, body: JSON.stringify({ programs: (data || []).map(publicShape) }) }
}

exports.handler = (event) => handle(event)
exports.handle = handle
exports.publicShape = publicShape
