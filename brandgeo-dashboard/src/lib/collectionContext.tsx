/**
 * collectionContext.tsx
 * Holds collection state at the App level so it survives tab navigation.
 */

import { createContext, useContext, useRef, useState, useCallback } from 'react'
import { supabase } from './supabase'

interface Progress {
  done: number
  total: number
  clientId: number
  clientName: string
}

interface CollectionCtx {
  collecting: boolean
  progress: Progress | null
  runCollection: (clientId: number) => Promise<void>
  stopCollection: () => void
}

const CollectionContext = createContext<CollectionCtx>({
  collecting: false,
  progress: null,
  runCollection: async () => {},
  stopCollection: () => {},
})

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [collecting, setCollecting] = useState(false)
  const [progress, setProgress]     = useState<Progress | null>(null)
  const abortRef = useRef(false)
  // Track whether a collection is in flight (avoids stale closure on `collecting`)
  const runningRef = useRef(false)

  const stopCollection = useCallback(() => {
    abortRef.current = true
  }, [])

  const runCollection = useCallback(async (clientId: number) => {
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

      // Fetch active prompts only
      const { data: prompts } = await supabase
        .from('prompts')
        .select('id, text')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('position')

      if (!prompts || prompts.length === 0) return

      setProgress({ done: 0, total: prompts.length, clientId, clientName: clientRow?.name ?? '' })

      for (let i = 0; i < prompts.length; i++) {
        if (abortRef.current) break

        setProgress({ done: i, total: prompts.length, clientId, clientName: clientRow?.name ?? '' })

        try {
          await fetch('/.netlify/functions/collect-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt_id:     prompts[i].id,
              prompt_text:   prompts[i].text,
              client_id:     clientId,
              client_config: clientConfig,
            }),
          })
        } catch { /* network blip — skip prompt, keep going */ }
      }
    } finally {
      runningRef.current = false
      setCollecting(false)
      setProgress(null)
    }
  }, [])

  return (
    <CollectionContext.Provider value={{ collecting, progress, runCollection, stopCollection }}>
      {children}
    </CollectionContext.Provider>
  )
}

export const useCollection = () => useContext(CollectionContext)
