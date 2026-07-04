import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, isDemoMode } from './lib/supabase'
import { MarketProvider } from './lib/marketContext'
import { ThemeProvider } from './lib/themeContext'
import { ClientProvider } from './lib/clientContext'
import { I18nProvider } from './lib/i18nContext'
import { CollectionProvider } from './lib/collectionContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Mentions from './pages/Mentions'
import Competitors from './pages/Competitors'
import Prompts from './pages/Prompts'
import AIVisibility from './pages/AIVisibility'
import Recommendations from './pages/Recommendations'
import Onboard from './pages/Onboard'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    if (isDemoMode) {
      setAuthed(sessionStorage.getItem('demo_logged_in') === 'true')
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (authed === null) return null
  return authed ? <>{children}</> : <Navigate to="/login" replace />
}

function DemoLoginInterceptor() {
  useEffect(() => {
    if (isDemoMode) sessionStorage.setItem('demo_logged_in', 'true')
  }, [])
  return <Login />
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
      <ClientProvider>
        <MarketProvider>
          <CollectionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<DemoLoginInterceptor />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
              <Route path="/mentions" element={<PrivateRoute><Layout><Mentions /></Layout></PrivateRoute>} />
              <Route path="/competitors" element={<PrivateRoute><Layout><Competitors /></Layout></PrivateRoute>} />
              <Route path="/prompts" element={<PrivateRoute><Layout><Prompts /></Layout></PrivateRoute>} />
              <Route path="/ai-visibility" element={<PrivateRoute><Layout><AIVisibility /></Layout></PrivateRoute>} />
              <Route path="/recommendations" element={<PrivateRoute><Layout><Recommendations /></Layout></PrivateRoute>} />
              <Route path="/onboard" element={<PrivateRoute><Layout><Onboard /></Layout></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </CollectionProvider>
        </MarketProvider>
      </ClientProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
