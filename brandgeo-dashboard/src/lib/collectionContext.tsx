/**
 * collectionContext.tsx
 * Holds collection state at the App level so it survives tab navigation.
 */

import { createContext, useContext, useRef, useState, useCallback } from 'react'
import { supabase } from './supabase'
import type { MarketSelection } from './marketContext'

interface Progress {
  done: number
  total: number
  clientId: number
  clientName: string
}

interface CollectionCtx {
  collecting: boolean
  progress: Progress | null
  lastCompletedAt: number   // increments after each prompt — watch to reload data
  runCollection:    (clientId: number, force?: boolean, markets?: MarketSelection[]) => Promise<void>
  runSinglePrompt:  (clientId: number, promptId: number, promptText: string, markets?: MarketSelection[]) => Promise<void>
  stopCollection:   () => void
}

const CollectionContext = createContext<CollectionCtx>({
  collecting: false,
  progress: null,
  lastCompletedAt: 0,
  runCollection:   async (_clientId: number, _force?: boolean, _markets?: MarketSelection[]) => {},
  runSinglePrompt: async (_clientId: number, _promptId: number, _promptText: string, _markets?: MarketSelection[]) => {},
  stopCollection:  () => {},
})

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [collecting, setCollecting] = useState(false)
  const [progress, setProgress]     = useState<Progress | null>(null)
  const [lastCompletedAt, setLastCompletedAt] = useState(0)
  const abortRef = useRef(false)
  // Track whether a collection is in flight (avoids stale closure on `collecting`)
  const runningRef = useRef(false)

  const stopCollection = useCallback(() => {
    abortRef.current = true
  }, [])

  const runCollection = useCallback(async (
    clientId: number,
    force = false,
    markets?: MarketSelection[],
  ) => {
    if (runningRef.current) return
    runningRef.current = true
    abortRef.current   = false
    setCollecting(true)

    try {
      // Fetch client config + name
      const { data: clientRow } = await supabase
        .from('clients')
        .select('name, brand_aliases, brand_website, known_competitors')
        .eq('id', clientId)
        .single()

      const clientConfig = {
        brand_aliases:     clientRow?.brand_aliases     ?? [],
        brand_website:     clientRow?.brand_website     ?? '',
        known_competitors: clientRow?.known_competitors ?? [],
      }
      // Debug — visible in browser console (F12)
      console.log('[Collection] client config loaded:', {
        name: clientRow?.name,
        brand_aliases: clientConfig.brand_aliases,
        brand_website: clientConfig.brand_website,
        aliases_empty: clientConfig.brand_aliases.length === 0,
        markets: markets?.map(s => `${s.market.label} / ${s.region.label}`),
      })

      // Fetch active prompts only
      const { data: prompts } = await supabase
        .from('prompts')
        .select('id, text')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('position')

      if (!prompts || prompts.length === 0) return

      setProgress({ done: 0, total: prompts.length, clientId, clientName: clientRow?.name ?? '' })

      // Primary market drives the geo context for LLM calls.
      // When multiple markets are selected, future versions can fan-out one
      // collection job per market and store results tagged by market.
      // For now, primary (first) selection is used.
      const primaryMarket = markets?.[0]
      const market_label  = primaryMarket?.market.label ?? null
      const region_label  = primaryMarket?.region.label ?? null
      const market_id     = primaryMarket?.market.id    ?? null   // ISO 3166-1 alpha-2 e.g. "RO"

      for (let i = 0; i < prompts.length; i++) {
        if (abortRef.current) break

        setProgress({ done: i, total: prompts.length, clientId, clientName: clientRow?.name ?? '' })

        try {
          const res  = await fetch('/.netlify/functions/collect-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt_id:     prompts[i].id,
              prompt_text:   prompts[i].text,
              client_id:     clientId,
              client_config: clientConfig,
              force,
              market_label,
              region_label,
              market_id,
            }),
          })
          const json = await res.json().catch(() => null)
          console.log(`[Collection] prompt ${i + 1}/${prompts.length} →`, json)
        } catch { /* network blip — skip prompt, keep going */ }
        setLastCompletedAt(Date.now())
      }
    } finally {
      runningRef.current = false
      setCollecting(false)
      setProgress(null)
    }
  }, [])

  const runSinglePrompt = useCallback(async (
    clientId: number,
    promptId: number,
    promptText: string,
    markets?: MarketSelection[],
  ) => {
    const { data: clientRow } = await supabase
      .from('clients')
      .select('brand_aliases, brand_website, known_competitors')
      .eq('id', clientId)
      .single()

    const clientConfig = {
      brand_aliases:     clientRow?.brand_aliases     ?? [],
      brand_website:     clientRow?.brand_website     ?? '',
      known_competitors: clientRow?.known_competitors ?? [],
    }

    const primaryMarket = markets?.[0]
    const market_label  = primaryMarket?.market.label ?? null
    const region_label  = primaryMarket?.region.label ?? null
    const market_id     = primaryMarket?.market.id    ?? null

    try {
      await fetch('/.netlify/functions/collect-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id:     promptId,
          prompt_text:   promptText,
          client_id:     clientId,
          client_config: clientConfig,
          force:         true,   // always force — per-prompt refresh deletes & re-runs
          market_label,
          region_label,
          market_id,
        }),
      })
    } catch { /* network blip — caller handles UI reset */ }

    setLastCompletedAt(Date.now())
  }, [])

  return (
    <CollectionContext.Provider value={{ collecting, progress, lastCompletedAt, runCollection, runSinglePrompt, stopCollection }}>
      {children}
    </CollectionContext.Provider>
  )
}

export const useCollection = () => useContext(CollectionContext)
