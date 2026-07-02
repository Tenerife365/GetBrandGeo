import { createContext, useContext, useState, type ReactNode } from 'react'

export interface Region {
  id:    string
  label: string
}

export interface Market {
  id:      string
  label:   string
  flag:    string
  regions: Region[]
}

export const MARKETS: Market[] = [
  {
    id:    'RO',
    label: 'Romania',
    flag:  '🇷🇴',   // 🇷🇴
    regions: [
      { id: 'ALL',  label: 'Toate regiunile' },
      { id: 'B',    label: 'București' },
      { id: 'SB',   label: 'Sibiu' },
      { id: 'CJ',   label: 'Cluj-Napoca' },
      { id: 'CT',   label: 'Constanța' },
      { id: 'IS',   label: 'Iași' },
    ],
  },
  // Future markets — uncomment and add when onboarding new clients:
  // { id: 'DE', label: 'Germany', flag: '🇩🇪', regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BE', label: 'Berlin' }] },
  // { id: 'GB', label: 'UK',      flag: '🇬🇧', regions: [{ id: 'ALL', label: 'All regions' }, { id: 'LDN', label: 'London' }] },
]

interface MarketCtx {
  market:    Market
  setMarket: (m: Market) => void
  region:    Region
  setRegion: (r: Region) => void
}

const Ctx = createContext<MarketCtx>({
  market:    MARKETS[0],
  setMarket: () => {},
  region:    MARKETS[0].regions[0],
  setRegion: () => {},
})

export function MarketProvider({ children }: { children: ReactNode }) {
  const savedMarket = MARKETS.find(m => m.id === localStorage.getItem('brandgeo_market')) ?? MARKETS[0]
  const savedRegionId = localStorage.getItem('brandgeo_region') ?? 'ALL'
  const savedRegion = savedMarket.regions.find(r => r.id === savedRegionId) ?? savedMarket.regions[0]

  const [market, setMarketState] = useState<Market>(savedMarket)
  const [region, setRegionState] = useState<Region>(savedRegion)

  const setMarket = (m: Market) => {
    localStorage.setItem('brandgeo_market', m.id)
    localStorage.setItem('brandgeo_region', 'ALL')
    setMarketState(m)
    setRegionState(m.regions[0])
  }

  const setRegion = (r: Region) => {
    localStorage.setItem('brandgeo_region', r.id)
    setRegionState(r)
  }

  return <Ctx.Provider value={{ market, setMarket, region, setRegion }}>{children}</Ctx.Provider>
}

export function useMarket() {
  return useContext(Ctx)
}
