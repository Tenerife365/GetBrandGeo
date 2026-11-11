// Option builders for the market and region comboboxes (Onboard wizard and the
// sidebar market block), so the two screens cannot drift apart. Display order is
// decided here, never in markets.ts, whose array order is pinned by tests.
import { Globe2 } from 'lucide-react'
import type { Market } from './markets'
import type { ComboboxOption } from '../components/ui/Combobox'

function flagIcon(m: Market) {
  return m.flagCode === 'un'
    ? <Globe2 size={15} className="text-ink-2 flex-shrink-0" />
    : <img src={`https://flagcdn.com/w20/${m.flagCode}.png`} alt="" loading="lazy" className="w-5 h-auto rounded-sm flex-shrink-0" />
}

/** Worldwide first, then every other market A to Z by label. */
export function buildMarketOptions(markets: Market[]): ComboboxOption[] {
  const rest = markets.filter(m => m.id !== 'WW').sort((a, b) => a.label.localeCompare(b.label))
  const ww = markets.filter(m => m.id === 'WW')
  return ww.concat(rest).map(m => ({
    value: m.id,
    label: m.label,
    keywords: [m.id].concat(m.aliases ?? []),
    icon: flagIcon(m),
  }))
}

/** The ALL region first, then the others A to Z by label. */
export function buildRegionOptions(market: Market): ComboboxOption[] {
  const all = market.regions.filter(r => r.id === 'ALL')
  const rest = market.regions.filter(r => r.id !== 'ALL').sort((a, b) => a.label.localeCompare(b.label))
  return all.concat(rest).map(r => ({ value: r.id, label: r.label }))
}
