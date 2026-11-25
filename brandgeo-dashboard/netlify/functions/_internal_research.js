// ============================================================================
// _internal_research.js  --  one rule for "this clients row is BrandGEO's own
// internal research, not a client".
//
// Ruling, Constantin, 2026-11-25: the 37 city research workspaces get their
// own plan source, 'internal_research'. They carry plan 'pro' only because the
// plan decides which engines research collection runs on; they pay nothing,
// are compensated by nothing, and must never be counted as clients or have
// their API cost read as client cost.
//
// The rule reads BOTH markers: plan_source 'internal_research' (the new one,
// set by db/supabase-internal-research-plan-source-2026-11-25.sql) and
// category 'research' (the older one). So a row reads the same before and
// after that migration is applied, and the order of migration and deploy
// cannot put a research row back into a client count.
//
// Mirror of the same names in src/lib/planConfig.ts. No function may require
// a .ts file (tests/ts_require_bundler.test.js), so the server keeps its own
// copy; tests/internal_research.test.js fails if the two disagree.
// ============================================================================

const INTERNAL_RESEARCH_PLAN_SOURCE = 'internal_research'
const INTERNAL_RESEARCH_LABEL = 'Internal research'
const RESEARCH_CATEGORY = 'research'

function isInternalResearch(c) {
  if (!c) return false
  return c.plan_source === INTERNAL_RESEARCH_PLAN_SOURCE || c.category === RESEARCH_CATEGORY
}

function internalResearchLine(n) {
  return `${INTERNAL_RESEARCH_LABEL} (${n})`
}

/**
 * Census split: clients on one side, internal research on the other.
 * `costByClientId` is optional ({ [id]: eur }); when given, the API cost is
 * split the same way, so internal research cost is never client cost.
 */
function splitCensus(clients, costByClientId) {
  const out = { clients: 0, internal_research: 0, client_cost_eur: 0, internal_research_cost_eur: 0 }
  for (const c of clients || []) {
    if (!c) continue
    const cost = costByClientId ? Number(costByClientId[c.id] ?? costByClientId[String(c.id)] ?? 0) || 0 : 0
    if (isInternalResearch(c)) {
      out.internal_research += 1
      out.internal_research_cost_eur += cost
    } else {
      out.clients += 1
      out.client_cost_eur += cost
    }
  }
  out.client_cost_eur = Math.round(out.client_cost_eur * 10000) / 10000
  out.internal_research_cost_eur = Math.round(out.internal_research_cost_eur * 10000) / 10000
  return out
}

module.exports = {
  INTERNAL_RESEARCH_PLAN_SOURCE,
  INTERNAL_RESEARCH_LABEL,
  RESEARCH_CATEGORY,
  isInternalResearch,
  internalResearchLine,
  splitCensus,
}
