import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useClient } from './clientContext'

import { MARKETS, type Region, type Market } from './markets'

export { MARKETS }
export type { Region, Market }


export interface MarketSelection {
  market: Market
  region: Region
}


// ─────────────────────────────────────────────────────────────────────────────

export interface MarketCtx {
  selections:      MarketSelection[]
  addSelection:    (market: Market, region?: Region) => void
  removeSelection: (marketId: string) => void
  updateRegion:    (marketId: string, region: Region) => void
  /** First selection — used as geo context for collection */
  primaryMarket:   Market | null
  primaryRegion:   Region | null
}

const Ctx = createContext<MarketCtx>({
  selections:      [],
  addSelection:    () => {},
  removeSelection: () => {},
  updateRegion:    () => {},
  primaryMarket:   null,
  primaryRegion:   null,
})

/**
 * Load saved market selections for a specific client.
 * Storage key: brandgeo_markets_v2_${clientId}
 * Falls back (in order) to: the old global key for migration, then the
 * client's own `default_market_id` (set during onboarding, see
 * onboard-client.js), then the old v1 global keys, then a hardcoded RO
 * default as the last resort.
 *
 * `defaultMarketId` param added 2026-07-09: previously any client with no
 * saved localStorage entry — which is every brand-new client — silently
 * fell all the way to the hardcoded Romania default below, regardless of
 * where that client actually operates (#72 audit finding). Onboarding now
 * collects a real default market per client; this is what makes writing
 * `clients.default_market_id` actually do something instead of being a
 * column nobody reads.
 *
 * `defaultRegionId` param added same day: `default_market_id` alone can
 * only pick the country, not e.g. Bucharest specifically within Romania —
 * this narrows to that region when it's a valid region of the resolved
 * market, otherwise falls back to that market's first region as before.
 */
function loadSaved(clientId: number, defaultMarketId?: string | null, defaultRegionId?: string | null): MarketSelection[] {
  try {
    // Per-client key (new) — explicit prior selection always wins
    const clientKey = `brandgeo_markets_v2_${clientId}`
    const perClient = localStorage.getItem(clientKey)
    if (perClient) {
      const parsed = JSON.parse(perClient) as { marketId: string; regionId: string }[]
      const result = parsed.flatMap(({ marketId, regionId }) => {
        const market = MARKETS.find(m => m.id === marketId)
        if (!market) return []
        const region = market.regions.find(r => r.id === regionId) ?? market.regions[0]
        return [{ market, region }] as MarketSelection[]
      })
      if (result.length > 0) return result
    }
    // Migrate from old global key (one-time, first client that loads)
    const legacy = localStorage.getItem('brandgeo_markets_v2')
    if (legacy) {
      const parsed = JSON.parse(legacy) as { marketId: string; regionId: string }[]
      const result = parsed.flatMap(({ marketId, regionId }) => {
        const market = MARKETS.find(m => m.id === marketId)
        if (!market) return []
        const region = market.regions.find(r => r.id === regionId) ?? market.regions[0]
        return [{ market, region }] as MarketSelection[]
      })
      if (result.length > 0) return result
    }
  } catch {}

  // This client's own configured default (set during onboarding) — before
  // falling back to legacy global v1 keys or the hardcoded Romania default.
  if (defaultMarketId) {
    const mkt = MARKETS.find(m => m.id === defaultMarketId)
    if (mkt) {
      const reg = mkt.regions.find(r => r.id === defaultRegionId) ?? mkt.regions[0]
      return [{ market: mkt, region: reg }]
    }
  }

  // v1 migration / final default
  const oldId  = localStorage.getItem('brandgeo_market')
  const oldReg = localStorage.getItem('brandgeo_region') ?? 'ALL'
  const mkt = MARKETS.find(m => m.id === oldId) ?? MARKETS[1] // default RO
  const reg = mkt.regions.find(r => r.id === oldReg) ?? mkt.regions[0]
  return [{ market: mkt, region: reg }]
}

/**
 * MarketProvider must be nested INSIDE ClientProvider so it can call useClient().
 * Each client gets its own market stored under brandgeo_markets_v2_${clientId}.
 * Switching clients reloads that client's saved market instantly.
 */
export function MarketProvider({ children }: { children: ReactNode }) {
  const { activeClientId, activeClient } = useClient()
  const [selections, setSelections] = useState<MarketSelection[]>(
    () => loadSaved(activeClientId, activeClient?.default_market_id, activeClient?.default_region_id)
  )

  // Reload market whenever the active client changes, or once its record
  // (including default_market_id/default_region_id) finishes loading
  // asynchronously.
  useEffect(() => {
    setSelections(loadSaved(activeClientId, activeClient?.default_market_id, activeClient?.default_region_id))
  }, [activeClientId, activeClient?.default_market_id, activeClient?.default_region_id])

  const storageKey = `brandgeo_markets_v2_${activeClientId}`

  const persist = (sels: MarketSelection[]) => {
    localStorage.setItem(storageKey, JSON.stringify(
      sels.map(s => ({ marketId: s.market.id, regionId: s.region.id }))
    ))
    setSelections(sels)
  }

  const addSelection = (market: Market, region?: Region) => {
    if (selections.some(s => s.market.id === market.id)) return
    persist([...selections, { market, region: region ?? market.regions[0] }])
  }

  const removeSelection = (marketId: string) => {
    const next = selections.filter(s => s.market.id !== marketId)
    if (next.length === 0) return // always keep at least one
    persist(next)
  }

  const updateRegion = (marketId: string, region: Region) => {
    persist(selections.map(s => s.market.id === marketId ? { ...s, region } : s))
  }

  return (
    <Ctx.Provider value={{
      selections,
      addSelection,
      removeSelection,
      updateRegion,
      primaryMarket: selections[0]?.market ?? null,
      primaryRegion: selections[0]?.region ?? null,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useMarket() {
  return useContext(Ctx)
}
