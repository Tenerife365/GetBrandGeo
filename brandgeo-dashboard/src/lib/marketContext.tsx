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

export interface MarketSelection {
  market: Market
  region: Region
}

export const MARKETS: Market[] = [
  // ── Global & Regions ──────────────────────────────────────────────────────
  {
    id: 'WW', label: 'Worldwide', flag: '', flagCode: 'un',
    regions: [
      { id: 'ALL',   label: 'All regions'          },
      { id: 'EU',    label: 'Europe'               },
      { id: 'NA',    label: 'North America'        },
      { id: 'LATAM', label: 'Latin America'        },
      { id: 'APAC',  label: 'Asia Pacific'         },
      { id: 'MEA',   label: 'Middle East & Africa' },
      { id: 'OCE',   label: 'Oceania'              },
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
  {
    id: 'PT', label: 'Portugal', flag: '', flagCode: 'pt',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'LIS', label: 'Lisbon' }, { id: 'OPO', label: 'Porto' }],
  },
  {
    id: 'BE', label: 'Belgium', flag: '', flagCode: 'be',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BRU', label: 'Brussels' }, { id: 'ANT', label: 'Antwerp' }],
  },
  {
    id: 'CH', label: 'Switzerland', flag: '', flagCode: 'ch',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'ZRH', label: 'Zurich' }, { id: 'GVA', label: 'Geneva' }],
  },
  {
    id: 'AT', label: 'Austria', flag: '', flagCode: 'at',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'VIE', label: 'Vienna' }],
  },
  {
    id: 'SE', label: 'Sweden', flag: '', flagCode: 'se',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'STO', label: 'Stockholm' }],
  },
  {
    id: 'DK', label: 'Denmark', flag: '', flagCode: 'dk',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'CPH', label: 'Copenhagen' }],
  },
  // ── Americas ──────────────────────────────────────────────────────────────
  {
    id: 'US', label: 'USA', flag: '', flagCode: 'us',
    regions: [{ id: 'ALL', label: 'All states' }, { id: 'NYC', label: 'New York' }, { id: 'LA', label: 'Los Angeles' }, { id: 'CHI', label: 'Chicago' }, { id: 'MIA', label: 'Miami' }, { id: 'HOU', label: 'Houston' }, { id: 'DAL', label: 'Dallas' }],
  },
  {
    id: 'CA', label: 'Canada', flag: '', flagCode: 'ca',
    regions: [{ id: 'ALL', label: 'All provinces' }, { id: 'TOR', label: 'Toronto' }, { id: 'VAN', label: 'Vancouver' }, { id: 'MTL', label: 'Montreal' }],
  },
  {
    id: 'BR', label: 'Brazil', flag: '', flagCode: 'br',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SAO', label: 'São Paulo' }, { id: 'RIO', label: 'Rio de Janeiro' }],
  },
  {
    id: 'MX', label: 'Mexico', flag: '', flagCode: 'mx',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MEX', label: 'Mexico City' }, { id: 'GDL', label: 'Guadalajara' }],
  },
  // ── APAC ──────────────────────────────────────────────────────────────────
  {
    id: 'AU', label: 'Australia', flag: '', flagCode: 'au',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SYD', label: 'Sydney' }, { id: 'MEL', label: 'Melbourne' }, { id: 'BNE', label: 'Brisbane' }],
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

function loadSaved(): MarketSelection[] {
  try {
    // v2 multi-select storage
    const v2 = localStorage.getItem('brandgeo_markets_v2')
    if (v2) {
      const parsed = JSON.parse(v2) as { marketId: string; regionId: string }[]
      const result = parsed.flatMap(({ marketId, regionId }) => {
        const market = MARKETS.find(m => m.id === marketId)
        if (!market) return []
        const region = market.regions.find(r => r.id === regionId) ?? market.regions[0]
        return [{ market, region }] as MarketSelection[]
      })
      if (result.length > 0) return result
    }
  } catch {}
  // Migrate from v1 single-market storage
  const oldId = localStorage.getItem('brandgeo_market')
  const oldReg = localStorage.getItem('brandgeo_region') ?? 'ALL'
  const mkt = MARKETS.find(m => m.id === oldId) ?? MARKETS[1] // default RO
  const reg = mkt.regions.find(r => r.id === oldReg) ?? mkt.regions[0]
  return [{ market: mkt, region: reg }]
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<MarketSelection[]>(loadSaved)

  const persist = (sels: MarketSelection[]) => {
    localStorage.setItem('brandgeo_markets_v2', JSON.stringify(
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
