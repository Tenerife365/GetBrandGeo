/**
 * historyRead.ts - the one way a page reads ai_results history
 * (docs/arch/phase2-results-layer-spec.md section 5.1).
 *
 * Keyset-paged through readAllById so the 1,000-row PostgREST cap cannot cut a
 * trend short. Error rows are always excluded; no-answer rows are the caller's
 * to drop (isNoAnswerRow). Rows come back newest first (compareNewestFirst).
 */
import { readAllById } from './keysetRead'
import { compareNewestFirst } from './metrics'

// Only what the builder needs: select, eq, neq, gte.
interface HistoryQuery {
  select(columns: string): HistoryQuery
  eq(column: string, value: unknown): HistoryQuery
  neq(column: string, value: unknown): HistoryQuery
  gte(column: string, value: unknown): HistoryQuery
}
interface HistoryClient {
  from(table: string): unknown
}

export interface HistoryReadOptions {
  clientId: number
  /** ISO lower bound on checked_at, or null for all time. */
  sinceIso: string | null
  /** PostgREST column list. Must include id and checked_at. */
  columns: string
  mentionedOnly?: boolean
}

export async function readResultHistory<Row extends { id: number; checked_at: string }>(
  sb: HistoryClient,
  opts: HistoryReadOptions,
): Promise<{ rows: Row[]; truncated: boolean; error: unknown }> {
  const res = await readAllById<Row>(() => {
    let q = (sb.from('ai_results') as HistoryQuery)
      .select(opts.columns)
      .eq('client_id', opts.clientId)
      .neq('status', 'error')
    if (opts.mentionedOnly) q = q.eq('brand_mentioned', true)
    if (opts.sinceIso) q = q.gte('checked_at', opts.sinceIso)
    return q
  })
  return { rows: res.rows.slice().sort(compareNewestFirst), truncated: res.truncated, error: res.error }
}
