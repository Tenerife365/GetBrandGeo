// Pure search helpers for the Combobox primitive. No React, no imports: loaded
// by node tests through a type-stripping require, so plain functions only.

export interface ComboboxFilterable {
  label:     string
  keywords?: string[]
}

/** Lowercase, trim, strip diacritics, collapse inner whitespace. */
export function normalizeForSearch(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Filter in three tiers, keeping the incoming order inside each tier and never
 * repeating an option: label starts with the query, then a word of the label or
 * of a keyword starts with it, then the label or a keyword contains it.
 * An empty or whitespace query returns the options unchanged.
 */
export function filterComboboxOptions<T extends ComboboxFilterable>(options: T[], query: string): T[] {
  const q = normalizeForSearch(query)
  if (!q) return options

  const tier1: T[] = []
  const tier2: T[] = []
  const tier3: T[] = []

  for (const o of options) {
    const label = normalizeForSearch(o.label)
    const terms: string[] = [label]
    if (o.keywords) for (const k of o.keywords) terms.push(normalizeForSearch(k))

    if (label.startsWith(q)) { tier1.push(o); continue }

    let wordStart = false
    let contains = false
    for (const t of terms) {
      if (t.startsWith(q)) { wordStart = true; break }
      for (const w of t.split(' ')) {
        if (w.startsWith(q)) { wordStart = true; break }
      }
      if (wordStart) break
      if (t.indexOf(q) !== -1) contains = true
    }
    if (wordStart) tier2.push(o)
    else if (contains) tier3.push(o)
  }

  return tier1.concat(tier2, tier3)
}
