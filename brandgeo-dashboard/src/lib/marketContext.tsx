import { createContext, useContext, useState, type ReactNode } from 'react'

export interface Region {
  id:    string
  label: string
}

export interface Market {
  id:       string
  label:    string
  flag:     string   // kept for fallback
  flagCode: string   // ISO 3166-1 alpha-2 lowercase, used for flagcdn.com image
  regions:  Region[]
}

export const MARKETS: Market[] = [
  {
    id:       'WW',
    label:    'Worldwide',
    flag:     '🌍',
    flagCode: 'un',   // UN flag from flagcdn
    regions:  [{ id: 'ALL', label: 'All regions' }],
  },
  {
    id:       'RO',
    label:    'Romania',
    flag:     '🇷🇴',
    flagCode: 'ro',
    regions: [
      { id: 'ALL',  label: 'Toate regiunile' },
      { id: 'B',    label: 'București' },
      { id: 'SB',   label: 'Sibiu' },
      { id: 'CJ',   label: 'Cluj-Napoca' },
      { id: 'CT',   label: 'Constanța' },
      { id: 'IS',   label: 'Iași' },
    ],
  },
  { id: 'DE', label: 'Germany', flag: '🇩🇪', flagCode: 'de', regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BE', label: 'Berlin' }, { id: 'MU', label: 'Munich' }] },
  { id: 'GB', label: 'UK',      flag: '🇬🇧', flagCode: 'gb', regions: [{ id: 'ALL', label: 'All regions' }, { id: 'LDN', label: 'London' }] },
  { id: 'US', label: 'USA',     flag: '🇺🇸', flagCode: 'us', regions: [{ id: 'ALL', label: 'All states' }, { id: 'NYC', label: 'New York' }, { id: 'LA', label: 'Los Angeles' }] },
  { id: 'ES', label: 'Spain',   flag: '🇪🇸', flagCode: 'es', regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MAD', label: 'Madrid' }, { id: 'BCN', label: 'Barcelona' }] },
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
