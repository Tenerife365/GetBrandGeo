/**
 * csv.ts - CSV export helpers (docs/arch/phase2-results-layer-spec.md 8.1).
 *
 * csvEscapeCell, toCsv and csvFilename are pure. downloadCsv touches the DOM
 * and is called only from a click handler.
 */

/**
 * One cell. null and undefined give ''. A number is written as is (a negative
 * number is not a formula). A string starting with = + - @ TAB or CR gets a
 * leading single quote so a spreadsheet cannot run it; then a cell holding a
 * quote, comma, CR or LF is wrapped in double quotes with quotes doubled.
 */
export function csvEscapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return String(value)
  let s = value
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/["\r\n,]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

/** BOM, then header and rows, every line ending CRLF. */
export function toCsv(
  header: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const lines = [header, ...rows].map(r => r.map(csvEscapeCell).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

export type CsvKind = 'ai-visibility' | 'competitors'

/** brandgeo-<kind>-<slug>-<YYYY-MM-DD>.csv */
export function csvFilename(
  kind: CsvKind,
  slug: string | null | undefined,
  clientId: number,
  date: Date,
): string {
  let s = (slug ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  s = s.replace(/^-+|-+$/g, '')
  if (!s) s = `client-${clientId}`
  return `brandgeo-${kind}-${s}-${date.toISOString().slice(0, 10)}.csv`
}

/** Browser only. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
