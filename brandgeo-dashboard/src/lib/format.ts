/**
 * src/lib/format.ts
 * Number and date formatting rules (dashboard-visual-system.md §12.1). One
 * place so every KPI tile, table cell, and chart tooltip renders a number the
 * same way, instead of each page hand-rolling its own `.toFixed()`/template
 * string.
 *
 * `tabular-nums` (the actual monospaced-digit CSS) is a class the caller adds
 * where the value can change in place — it isn't baked into these string
 * helpers, which only decide the TEXT.
 */

/** Integer percentage, no decimal, "%" suffix. Below 1% (but not 0), reads
 *  "<1%" rather than "0%" or a decimal — a real signal should never look like
 *  no signal. Exactly 0 renders "0%": zero IS the measurement here, unlike a
 *  zero-DATA state, which is a separate empty-state rule (§11), not a
 *  formatting one. */
export function formatPercent(value: number): string {
  if (value > 0 && value < 1) return '<1%'
  return `${Math.round(value)}%`
}

/** Plain integer under 1,000; one decimal + "k" at or above it. */
export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n)}`
}

/** "EUR 11.88" — two decimals, always. Callers add `tabular-nums` themselves. */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return `${currency} ${amount.toFixed(2)}`
}

/** "3 of 5 engines" — never a bare fraction. */
export function formatRatio(numerator: number, denominator: number, noun: string): string {
  return `${numerator} of ${denominator} ${noun}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "14 Jul", plus the year only when it differs from the current one. */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`
}

/** "2 days ago" under 7 days, otherwise the plain date — never both, never a raw ISO string. */
export function formatRelativeOrDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days < 0) return formatDate(d)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(d)
}

/** "3rd" — position or rank, never a bare number where the meaning is "place". */
export function formatOrdinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

/*
 * There is deliberately no shared "no data" glyph constant here.
 *
 * `NO_DATA = '<em dash>'` used to live at this spot with zero callers, and its
 * docstring invited the next author to reuse the character (UI/UX audit
 * 2026-07-30). Two rules make that the wrong abstraction: the content rules ban
 * em and en dashes anywhere a user can read them, and a bare dash standing in
 * for a missing value reads as a broken string rather than as an absence.
 *
 * Word each empty case where it renders, the way `Account.tsx`'s `Field` does:
 * "Not set", "Not measured yet", "No prompts yet". See the empty-state rule in
 * dashboard-visual-system.md §11.
 */
