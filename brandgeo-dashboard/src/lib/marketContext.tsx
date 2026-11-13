import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocations } from './locationsContext'

import { MARKETS, type Region, type Market } from './markets'

export { MARKETS }
export type { Region, Market }


export interface MarketSelection {
  market: Market
  region: Region
}

// ---------------------------------------------------------------------------
// Kept for compatibility. The sidebar no longer steers collection: one country
// per prompt, and the server resolves geography from each prompt's location.
// `selections` now mirrors the client's live locations (primary first), and the
// write functions are no-ops (locations change only through useLocations()).
// The old localStorage keys (brandgeo_markets_v2*) are no longer read or written.

export interface MarketCtx {
  selections:      MarketSelection[]
  addSelection:    (market: Market, region?: Region) => void
  removeSelection: (marketId: string) => void
  updateRegion:    (marketId: string, region: Region) => void
  /** Primary location's market */
  primaryMarket:   Market | null
  primaryRegion:   Region | null
}

const WW = MARKETS.find(m => m.id === 'WW') ?? MARKETS[0]

const noop = () => {}

const Ctx = createContext<MarketCtx>({
  selections:      [],
  addSelection:    noop,
  removeSelection: noop,
  updateRegion:    noop,
  primaryMarket:   null,
  primaryRegion:   null,
})

/**
 * MarketProvider must be nested INSIDE LocationsProvider. Until the location
 * list has loaded (or when it is empty) the selection is Worldwide.
 */
export function MarketProvider({ children }: { children: ReactNode }) {
  const { locations } = useLocations()

  const selections = useMemo<MarketSelection[]>(() => {
    const out: MarketSelection[] = []
    for (const l of locations) {
      const market = MARKETS.find(m => m.id === l.market_id)
      if (!market) continue
      const region = market.regions.find(r => r.id === l.region_id) ?? market.regions[0]
      out.push({ market, region })
    }
    return out.length > 0 ? out : [{ market: WW, region: WW.regions[0] }]
  }, [locations])

  const value = useMemo<MarketCtx>(() => ({
    selections,
    addSelection: noop,
    removeSelection: noop,
    updateRegion: noop,
    primaryMarket: selections[0]?.market ?? null,
    primaryRegion: selections[0]?.region ?? null,
  }), [selections])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMarket() {
  return useContext(Ctx)
}
