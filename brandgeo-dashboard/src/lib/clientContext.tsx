import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isDemoMode } from './supabase'

export interface Client {
  id:   number
  name: string
  slug: string
}

interface ClientCtx {
  activeClientId: number
  setActiveClientId: (id: number) => void
  clients: Client[]       // populated only for admin
  isAdmin: boolean
  loading: boolean
}

const Ctx = createContext<ClientCtx>({
  activeClientId:    1,
  setActiveClientId: () => {},
  clients:           [],
  isAdmin:           false,
  loading:           true,
})

export function ClientProvider({ children }: { children: ReactNode }) {
  const saved = parseInt(localStorage.getItem('brandgeo_client') ?? '1', 10)
  const [activeClientId, setActiveClientIdState] = useState<number>(saved)
  const [clients, setClients]   = useState<Client[]>([])
  const [isAdmin, setIsAdmin]   = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (isDemoMode) { setLoading(false); return }

    async function init() {
      // 1. Get this user's profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('client_id, role')
        .eq('id', user.id)
        .single()

      if (!profile) { setLoading(false); return }

      const admin = profile.role === 'admin'
      setIsAdmin(admin)

      if (admin) {
        // Admin: load all clients + restore last selected
        const { data: allClients } = await supabase
          .from('clients')
          .select('id, name, slug')
          .order('id')
        if (allClients) setClients(allClients)
        // Default to saved or first client
        const validId = allClients?.find(c => c.id === saved)?.id ?? allClients?.[0]?.id ?? 1
        setActiveClientIdState(validId)
      } else {
        // Regular viewer: locked to their client
        const cid = profile.client_id ?? 1
        setActiveClientIdState(cid)
        setClients([])
      }
      setLoading(false)
    }

    init()
  }, [])

  const setActiveClientId = (id: number) => {
    localStorage.setItem('brandgeo_client', String(id))
    setActiveClientIdState(id)
  }

  return (
    <Ctx.Provider value={{ activeClientId, setActiveClientId, clients, isAdmin, loading }}>
      {children}
    </Ctx.Provider>
  )
}

export function useClient() {
  return useContext(Ctx)
}
