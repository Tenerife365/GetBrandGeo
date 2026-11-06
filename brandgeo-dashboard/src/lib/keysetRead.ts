/**
 * Read every row a query matches, newest id first, in keyset pages.
 *
 * PostgREST caps a plain select at 1,000 rows, so a client with more answers
 * than that saw only its newest 1,000 on the AI Visibility page while the MCP
 * server scanned them all, and the two built different Fix This lists
 * (docs/qa/mcp-stage2-fixes-review-2026-11-06.md, M1). Both now read through
 * this one function: the page in the browser, mcp-server.js through esbuild.
 *
 * `build` returns a fresh filtered query each call (select and filters, no
 * order and no limit); this adds `id < last`, the order and the page size.
 * It stops at `ceiling` rows or after `budgetMs` and reports `truncated`.
 */

// The query builders of supabase-js and of the server's client differ in type
// only; this needs nothing beyond lt, order and limit.
interface KeysetQuery<Row> {
  lt(column: string, value: unknown): KeysetQuery<Row>
  order(column: string, opts: { ascending: boolean }): KeysetQuery<Row>
  limit(n: number): PromiseLike<{ data: Row[] | null; error: unknown }>
}

export interface KeysetOptions {
  page?: number
  ceiling?: number
  budgetMs?: number
}

export const KEYSET_PAGE = 1000
export const KEYSET_CEILING = 50_000

export async function readAllById<Row extends { id: number | string }>(
  build: () => unknown,
  opts: KeysetOptions = {},
): Promise<{ rows: Row[]; truncated: boolean; error: unknown }> {
  const page = opts.page ?? KEYSET_PAGE
  const ceiling = opts.ceiling ?? KEYSET_CEILING
  const budgetMs = opts.budgetMs ?? Infinity
  const t0 = Date.now()
  let rows: Row[] = []
  let lastId: number | string | null = null
  for (;;) {
    let q = build() as KeysetQuery<Row>
    if (lastId !== null) q = q.lt('id', lastId)
    const { data, error } = await q.order('id', { ascending: false }).limit(page)
    if (error) return { rows, truncated: false, error }
    rows = rows.concat(data ?? [])
    if (!data || data.length < page) return { rows, truncated: false, error: null }
    lastId = data[data.length - 1].id
    if (rows.length >= ceiling || Date.now() - t0 > budgetMs) return { rows, truncated: true, error: null }
  }
}
