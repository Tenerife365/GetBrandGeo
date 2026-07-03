import { createContext, useContext, useState, type ReactNode } from 'react'

export interface Region {
  id:    string
  label: string
}

export interface Market {
  id:       string
  label:    string
  flag:     string
  flagCode: string
  regions:  Region[]
}

export const MARKETS: Market[] = [
  // ── Global & Regions ──────────────────────────────────────────────────────
  {
    id: 'WW', label: 'Worldwide', flag: '', flagCode: 'un',
    regions: [
      { id: 'ALL',  label: 'All regions'       },
      { id: 'EU',   label: 'Europe'            },
      { id: 'NA',   label: 'North America'     },
      { id: 'LATAM',label: 'Latin America'     },
      { id: 'APAC', label: 'Asia Pacific'      },
      { id: 'MEA',  label: 'Middle East & Africa' },
      { id: 'OCE',  label: 'Oceania'           },
    ],
  },
  // ── Europe ────────────────────────────────────────────────────────────────
  {
    id: 'RO', label: 'Romania', flag: '', flagCode: 'ro',
    regions: [
      { id: 'ALL', label: 'All regions'  },
      { id: 'B',   label: 'Bucharest'   },
      { id: 'SB',  label: 'Sibiu'       },
      { id: 'CJ',  label: 'Cluj-Napoca' },
      { id: 'CT',  label: 'Constanta'   },
      { id: 'IS',  label: 'Iasi'        },
    ],
  },
  {
    id: 'DE', label: 'Germany', flag: '', flagCode: 'de',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BE', label: 'Berlin' }, { id: 'MU', label: 'Munich' }, { id: 'HH', label: 'Hamburg' }, { id: 'FRA', label: 'Frankfurt' }],
  },
  {
    id: 'GB', label: 'UK', flag: '', flagCode: 'gb',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'LDN', label: 'London' }, { id: 'MAN', label: 'Manchester' }, { id: 'EDI', label: 'Edinburgh' }],
  },
  {
    id: 'FR', label: 'France', flag: '', flagCode: 'fr',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'PAR', label: 'Paris' }, { id: 'LYO', label: 'Lyon' }, { id: 'MRS', label: 'Marseille' }],
  },
  {
    id: 'ES', label: 'Spain', flag: '', flagCode: 'es',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MAD', label: 'Madrid' }, { id: 'BCN', label: 'Barcelona' }, { id: 'VAL', label: 'Valencia' }],
  },
  {
    id: 'NL', label: 'Netherlands', flag: '', flagCode: 'nl',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'AMS', label: 'Amsterdam' }, { id: 'RTM', label: 'Rotterdam' }],
  },
  {
    id: 'IT', label: 'Italy', flag: '', flagCode: 'it',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MIL', label: 'Milan' }, { id: 'ROM', label: 'Rome' }],
  },
  {
    id: 'PL', label: 'Poland', flag: '', flagCode: 'pl',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'WAW', label: 'Warsaw' }, { id: 'KRK', label: 'Krakow' }],
  },
  // ── Americas ──────────────────────────────────────────────────────────────
  {
    id: 'US', label: 'USA', flag: '', flagCode: 'us',
    regions: [{ id: 'ALL', label: 'All states' }, { id: 'NYC', label: 'New York' }, { id: 'LA', label: 'Los Angeles' }, { id: 'CHI', label: 'Chicago' }, { id: 'MIA', label: 'Miami' }],
  },
  {
    id: 'CA', label: 'Canada', flag: '', flagCode: 'ca',
    regions: [{ id: 'ALL', label: 'All provinces' }, { id: 'TOR', label: 'Toronto' }, { id: 'VAN', label: 'Vancouver' }, { id: 'MTL', label: 'Montreal' }],
  },
  {
    id: 'BR', label: 'Brazil', flag: '', flagCode: 'br',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SAO', label: 'São Paulo' }, { id: 'RIO', label: 'Rio de Janeiro' }],
  },
  // ── APAC ──────────────────────────────────────────────────────────────────
  {
    id: 'AU', label: 'Australia', flag: '', flagCode: 'au',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SYD', label: 'Sydney' }, { id: 'MEL', label: 'Melbourne' }],
  },
  {
    id: 'SG', label: 'Singapore', flag: '', flagCode: 'sg',
    regions: [{ id: 'ALL', label: 'Singapore' }],
  },
  {
    id: 'IN', label: 'India', flag: '', flagCode: 'in',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BOM', label: 'Mumbai' }, { id: 'BLR', label: 'Bangalore' }, { id: 'DEL', label: 'Delhi' }],
  },
  {
    id: 'JP', label: 'Japan', flag: '', flagCode: 'jp',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'TYO', label: 'Tokyo' }, { id: 'OSA', label: 'Osaka' }],
  },
  // ── Middle East ───────────────────────────────────────────────────────────
  {
    id: 'AE', label: 'UAE', flag: '', flagCode: 'ae',
    regions: [{ id: 'ALL', label: 'All emirates' }, { id: 'DXB', label: 'Dubai' }, { id: 'AUH', label: 'Abu Dhabi' }],
  },
  {
    id: 'SA', label: 'Saudi Arabia', flag: '', flagCode: 'sa',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'RIY', label: 'Riyadh' }, { id: 'JED', label: 'Jeddah' }],
  },
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
