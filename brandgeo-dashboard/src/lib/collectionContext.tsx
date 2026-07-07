/**
 * collectionContext.tsx
 * Holds collection state at the App level so it survives tab navigation.
 *
 * Architecture (3 parallel Netlify functions per prompt):
 *   - collect-prompt.js   gemini / perplexity / meta  (20s timeout, ~21s total)
 *   - collect-claude.js   Claude only                  (full 26s window)
 *   - collect-chatgpt.js  ChatGPT / gpt-5.5 only       (full 26s window)
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
  lastCompletedAt: number   // increments after each prompt -- watch to reload data
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
      console.log('[Collection] client config loaded:', {
        name: clientRow?.name,
        brand_aliases: clientConfig.brand_aliases,
        brand_website: clientConfig.brand_website,
        aliases_empty: clientConfig.brand_aliases.length === 0,
        markets: markets?.map(s => `${s.market.label} / ${s.region.label}`),
      })

      const { data: prompts } = await supabase
        .from('prompts')
        .select('id, text')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('position')

      if (!prompts || prompts.length === 0) return

      setProgress({ done: 0, total: prompts.length, clientId, clientName: clientRow?.name ?? '' })

      const primaryMarket = markets?.[0]
      const market_label  = primaryMarket?.market.label ?? null
      const region_label  = primaryMarket?.region.label ?? null
      const market_id     = primaryMarket?.market.id    ?? null

      // Get auth token once for all fetch calls
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const authHeader: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) authHeader['Authorization'] = `Bearer ${token}`

      for (let i = 0; i < prompts.length; i++) {
        if (abortRef.current) break

        setProgress({ done: i, total: prompts.length, clientId, clientName: clientRow?.name ?? '' })

        const payload = {
          prompt_id:     prompts[i].id,
          prompt_text:   prompts[i].text,
          client_id:     clientId,
          client_config: clientConfig,
          force,
          market_label,
          region_label,
          market_id,
        }

        // Fire all 3 functions in parallel -- each has its own 26s Netlify timeout.
        // collect-prompt: gemini + perplexity + meta
        // collect-claude: Claude only
        // collect-chatgpt: ChatGPT (gpt-5.5) only
        try {
          const [fastRes, claudeRes, chatgptRes] = await Promise.allSettled([
            fetch('/.netlify/functions/collect-prompt', {
              method: 'POST',
              headers: authHeader,
              body: JSON.stringify(payload),
            }).then(r => r.json().catch(() => null)),
            fetch('/.netlify/functions/collect-claude', {
              method: 'POST',
              headers: authHeader,
              body: JSON.stringify(payload),
            }).then(r => r.json().catch(() => null)),
            fetch('/.netlify/functions/collect-chatgpt', {
              method: 'POST',
              headers: authHeader,
              body: JSON.stringify(payload),
            }).then(r => r.json().catch(() => null)),
          ])
          console.log(
            `[Collection] prompt ${i + 1}/${prompts.length}`,
            '-> fast:', fastRes.status === 'fulfilled' ? fastRes.value : fastRes.reason,
            '-> claude:', claudeRes.status === 'fulfilled' ? claudeRes.value : claudeRes.reason,
            '-> chatgpt:', chatgptRes.status === 'fulfilled' ? chatgptRes.value : chatgptRes.reason,
          )
        } catch { /* network blip -- skip prompt, keep going */ }
        setLastCompletedAt(Date.now())
        // gpt-5.5 can take 30-40s -- Netlify closes the HTTP connection at 26s but the
        // Lambda saves in the background. Schedule follow-up reloads to catch late saves.
        setTimeout(() => setLastCompletedAt(Date.now()), 15000)
        setTimeout(() => setLastCompletedAt(Date.now()), 40000)
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

    const payload = {
      prompt_id:     promptId,
      prompt_text:   promptText,
      client_id:     clientId,
      client_config: clientConfig,
      force:         true,
      market_label,
      region_label,
      market_id,
    }

    const { data: { session: singleSession } } = await supabase.auth.getSession()
    const singleToken = singleSession?.access_token ?? ''
    const singleAuthHeader: Record<string, string> = { 'Content-Type': 'application/json' }
    if (singleToken) singleAuthHeader['Authorization'] = `Bearer ${singleToken}`

    // Fire all 3 functions in parallel.
    // collect-prompt (force=true) deletes all rows first, then saves gemini/perplexity/meta.
    // collect-claude and collect-chatgpt insert independently with their own 26s windows.
    try {
      await Promise.allSettled([
        fetch('/.netlify/functions/collect-prompt', {
          method: 'POST',
          headers: singleAuthHeader,
          body: JSON.stringify(payload),
        }),
        fetch('/.netlify/functions/collect-claude', {
          method: 'POST',
          headers: singleAuthHeader,
          body: JSON.stringify(payload),
        }),
        fetch('/.netlify/functions/collect-chatgpt', {
          method: 'POST',
          headers: singleAuthHeader,
          body: JSON.stringify(payload),
        }),
      ])
    } catch { /* network blip -- caller handles UI reset */ }

    setLastCompletedAt(Date.now())
    // Follow-up reloads to catch ChatGPT background saves that land after 26s
    setTimeout(() => setLastCompletedAt(Date.now()), 15000)
    setTimeout(() => setLastCompletedAt(Date.now()), 40000)
  }, [])

  return (
    <CollectionContext.Provider value={{ collecting, progress, lastCompletedAt, runCollection, runSinglePrompt, stopCollection }}>
      {children}
    </CollectionContext.Provider>
  )
}

export const useCollection = () => useContext(CollectionContext)
