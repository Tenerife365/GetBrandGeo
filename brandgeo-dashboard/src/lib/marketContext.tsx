import { createContext, useContext, useState, type ReactNode } from 'react'

export interface Market {
  id:    string
  label: string
  flag:  string
}

export const MARKETS: Market[] = [
  { id: 'RO', label: 'Romania', flag: 'ð·ð´' },
  // Future: { id: 'DE', label: 'Germany', flag: 'ð©ðª' }, etc.
]

interface MarketCtx {
  market:    Market
  setMarket: (m: Market) => void
}

const Ctx = createContext<MarketCtx>({
  market:    MARKETS[0],
  setMarket: () => {},
})

export function MarketProvider({ children }: { children: ReactNode }) {
  const saved  = MARKETS.find(m => m.id === localStorage.getItem('brandgeo_market')) ?? MARKETS[0]
  const [market, setMarketState] = useState<Market>(saved)

  const setMarket = (m: Market) => {
    localStorage.setItem('brandgeo_market', m.id)
    setMarketState(m)
  }

  return <Ctx.Provider value={{ market, setMarket }}>{children}</Ctx.Provider>
}

export function useMarket() {
  return useContext(Ctx)
}
