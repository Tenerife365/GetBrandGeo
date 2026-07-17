import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { supabase, isDemoMode } from './lib/supabase'
import { MarketProvider } from './lib/marketContext'
import { ThemeProvider } from './lib/themeContext'
import { ClientProvider } from './lib/clientContext'
import { I18nProvider } from './lib/i18nContext'
import { CollectionProvider } from './lib/collectionContext'
import { TimeFilterProvider } from './lib/timeFilterContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Mentions from './pages/Mentions'
import Competitors from './pages/Competitors'
import Prompts from './pages/Prompts'
import AIVisibility from './pages/AIVisibility'
import BrandSentiment from './pages/BrandSentiment'
import Recommendations from './pages/Recommendations'
import Onboard from './pages/Onboard'
import Usage from './pages/Usage'
import Account from './pages/Account'
import AuditRequest from './pages/AuditRequest'
import AuditReport from './pages/AuditReport'

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
    // reducedMotion="user" — the SINGLE reduced-motion switch for the whole
    // app (DASHBOARD-UX-2026.md §3/§7). Every motion.* component anywhere in
    // the tree automatically snaps to its final state with no transform/
    // opacity animation when the OS has prefers-reduced-motion set, with zero
    // per-component logic. Layout animations (height/position, e.g. Phase D's
    // expand/collapse) still run — only the decorative transform/opacity
    // motion is suppressed, which is the correct behavior per WCAG 2.3.3.
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <I18nProvider>
      <ClientProvider>
        <MarketProvider>
          <CollectionProvider>
          <TimeFilterProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<DemoLoginInterceptor />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Public, unauthenticated — Instant Audit Engine (SALES-ENGINE.md §2, CLAUDE.md §10) */}
              <Route path="/audit" element={<AuditRequest />} />
              <Route path="/audit/:token" element={<AuditReport />} />
              <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
              <Route path="/mentions" element={<PrivateRoute><Layout><Mentions /></Layout></PrivateRoute>} />
              <Route path="/competitors" element={<PrivateRoute><Layout><Competitors /></Layout></PrivateRoute>} />
              <Route path="/prompts" element={<PrivateRoute><Layout><Prompts /></Layout></PrivateRoute>} />
              <Route path="/ai-visibility" element={<PrivateRoute><Layout><AIVisibility /></Layout></PrivateRoute>} />
              <Route path="/sentiment" element={<PrivateRoute><Layout><BrandSentiment /></Layout></PrivateRoute>} />
              <Route path="/recommendations" element={<PrivateRoute><Layout><Recommendations /></Layout></PrivateRoute>} />
              <Route path="/onboard" element={<PrivateRoute><Layout><Onboard /></Layout></PrivateRoute>} />
              <Route path="/usage" element={<PrivateRoute><Layout><Usage /></Layout></PrivateRoute>} />
              <Route path="/account" element={<PrivateRoute><Layout><Account /></Layout></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </TimeFilterProvider>
          </CollectionProvider>
        </MarketProvider>
      </ClientProvider>
      </I18nProvider>
    </ThemeProvider>
    </MotionConfig>
  )
}
