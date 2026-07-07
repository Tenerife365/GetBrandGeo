/**
 * purge-old-results.js
 * Scheduled Netlify function — runs daily at 03:00 UTC.
 * Deletes ai_results rows older than 24 months to enforce the
 * data retention policy documented in privacy.html.
 *
 * Service key bypasses RLS — this is intentional (admin cleanup).
 */

const { createClient } = require('@supabase/supabase-js')

exports.handler = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
  )

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 24)

  const { error, count } = await supabase
    .from('ai_results')
    .delete({ count: 'exact' })
    .lt('checked_at', cutoff.toISOString())

  if (error) {
    console.error('[Purge] Failed:', error.message)
    return { statusCode: 500, body: error.message }
  }

  console.log(`[Purge] Deleted ${count ?? 0} ai_results rows older than 24 months`)
  return { statusCode: 200, body: `Deleted ${count ?? 0} rows` }
}
