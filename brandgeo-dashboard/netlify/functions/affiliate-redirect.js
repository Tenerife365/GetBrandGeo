/**
 * affiliate-redirect.js -- GET /r/:programSlug/:code  (netlify.toml rewrites
 * /r/* to this function; getbrandgeo.com/.htaccess forwards its own /r/* here
 * so the short link works on the primary domain too).
 *
 *   1. validate the program and the affiliate's link code
 *   2. record the click (one RPC, rate-limited per ip hash inside Postgres)
 *   3. mint an anonymous referral id (visit token)
 *   4. 302 to the program's destination with ref, bg_rid, ref_days and the
 *      affiliate UTMs, keeping any UTM the click already carried
 *
 * A dead or paused link STILL redirects to the destination (a partner's old
 * post must not land on an error page), it just records nothing. The only
 * time a visitor sees a page from here is an unknown program, which has no
 * destination to send them to.
 *
 * Privacy: no raw IP is stored. ip_hash is SHA-256 of the IP with a daily
 * rotating salt (IP_HASH_PEPPER plus the UTC date), so it can rate-limit a
 * burst today and cannot be joined to anything tomorrow. The user agent is
 * reduced to a family name. Raw click rows expire after 90 days.
 */

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const core = require('./_affiliate_core')
const service = require('./_affiliate_service')

const CLICKS_PER_MINUTE_PER_IP = Number(process.env.AFFILIATE_CLICK_RATE_LIMIT || 30)
const FALLBACK_HOME = 'https://getbrandgeo.com/'

function dailyIpHash(event, now = new Date()) {
  const ip = (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()
  const pepper = process.env.IP_HASH_PEPPER || 'brandgeo-dev-pepper-change-in-prod'
  const day = now.toISOString().slice(0, 10)
  return crypto.createHash('sha256').update(`${ip}:${pepper}:${day}`).digest('hex')
}

function uaFamily(ua) {
  const s = String(ua || '')
  if (!s) return null
  if (/bot|crawl|spider|slurp|preview|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegram/i.test(s)) return 'bot'
  if (/iphone|ipad|ipod/i.test(s)) return 'ios'
  if (/android/i.test(s)) return 'android'
  if (/windows/i.test(s)) return 'windows'
  if (/macintosh|mac os/i.test(s)) return 'mac'
  if (/linux/i.test(s)) return 'linux'
  return 'other'
}

function referrerHost(ref) {
  try { return ref ? new URL(ref).hostname.slice(0, 120) : null } catch { return null }
}

/** Path params from either the rewritten path (/r/a/b) or the raw function path. */
function parsePath(event) {
  const raw = decodeURIComponent(event.path || '')
  let m = /\/r\/([^/]+)\/([^/?#]+)/.exec(raw)
  if (!m) m = /affiliate-redirect\/([^/]+)\/([^/?#]+)/.exec(raw)
  if (m) return { programSlug: m[1].toLowerCase(), code: m[2] }
  const q = event.queryStringParameters || {}
  if (q.program && q.code) return { programSlug: String(q.program).toLowerCase(), code: String(q.code) }
  return null
}

function redirect(url, extraHeaders = {}) {
  return {
    statusCode: 302,
    headers: { Location: url, 'Cache-Control': 'no-store, private', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Robots-Tag': 'noindex, nofollow', ...extraHeaders },
    body: '',
  }
}

async function handle(event, { supabase = null, now = new Date() } = {}) {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return { statusCode: 405, headers: { Allow: 'GET, HEAD' }, body: 'Method Not Allowed' }
  }
  const params = parsePath(event)
  if (!params || !core.isValidSlug(params.programSlug)) return redirect(FALLBACK_HOME)

  const db = supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  let resolved
  try {
    resolved = await service.resolveReferralLink(db, params.programSlug, params.code)
  } catch (e) {
    console.error('[affiliate-redirect] resolve failed:', e.message)
    return redirect(FALLBACK_HOME)
  }

  const query = event.queryStringParameters || {}

  if (!resolved.ok) {
    console.log(`[affiliate-redirect] not tracked (${resolved.reason}) program=${params.programSlug} code=${params.code}`)
    const dest = resolved.program && core.isSafeDestination(resolved.program.destination_url) ? resolved.program.destination_url : FALLBACK_HOME
    return redirect(dest)
  }

  const { program, code, membership } = resolved
  const visitToken = core.randomToken(16)
  const ua = event.headers['user-agent'] || ''
  const family = uaFamily(ua)
  const utm = {}
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    if (typeof query[k] === 'string' && query[k]) utm[k] = query[k].slice(0, 120)
  }

  // Bots get the redirect but never a click: a link preview fetch is not a visit.
  if (family !== 'bot' && event.httpMethod === 'GET') {
    try {
      const { data, error } = await db.rpc('affiliate_record_visit', {
        p_program: program.id,
        p_membership: membership.id,
        p_code: code.id,
        p_token: visitToken,
        p_landing: String(event.path || '').slice(0, 300),
        p_referrer: referrerHost(event.headers['referer'] || event.headers['Referer']),
        p_utm: Object.keys(utm).length ? utm : null,
        p_ua: family,
        p_ip_hash: dailyIpHash(event, now),
        p_rate_limit: CLICKS_PER_MINUTE_PER_IP,
      })
      if (error) console.warn('[affiliate-redirect] visit not recorded:', error.message)
      else if (data && data.recorded === false) console.log(`[affiliate-redirect] visit skipped: ${data.reason}`)
    } catch (e) {
      console.warn('[affiliate-redirect] visit rpc threw:', e.message)
    }
  }

  const url = core.buildRedirectUrl({
    destination: program.destination_url,
    code: code.code,
    visitToken,
    programSlug: program.slug,
    attributionDays: program.attribution_days,
    incomingQuery: query,
  })
  return redirect(url)
}

exports.handler = (event) => handle(event)
exports.handle = handle
exports.parsePath = parsePath
exports.uaFamily = uaFamily
