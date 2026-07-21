import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { supabase, isDemoMode } from './lib/supabase'
import { MarketProvider } from './lib/marketContext'
import { ThemeProvider } from './lib/themeContext'
import { ClientProvider, useClient } from './lib/clientContext'
import { I18nProvider } from './lib/i18nContext'
import { CollectionProvider } from './lib/collectionContext'
import { TimeFilterProvider } from './lib/timeFilterContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Signup from './pages/Signup'
import Welcome from './pages/Welcome'
import Dashboard from './pages/Dashboard'
import Mentions from './pages/Mentions'
import Competitors from './pages/Competitors'
import Prompts from './pages/Prompts'
import AIVisibility from './pages/AIVisibility'
import BrandSentiment from './pages/BrandSentiment'
import Recommendations from './pages/Recommendations'
import Onboard from './pages/Onboard'
import Usage from './pages/Usage'
import Social from './pages/Social'
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

// Sits between PrivateRoute (authed?) and Layout: a freshly-authenticated user
// who has no profile/client yet (email or social signup) is routed to /welcome
// to finish onboarding. Existing users (needsOnboarding=false) pass straight
// through. Waits for ClientProvider to finish loading to avoid a flash.
function OnboardGate({ children }: { children: React.ReactNode }) {
  const { loading, needsOnboarding } = useClient()
  // Only blank on the VERY FIRST load. ClientProvider re-runs init() on later
  // SIGNED_IN events (Supabase fires these on tab refocus / token refresh, not
  // just real logins), which flips `loading` true again. Returning null then
  // would UNMOUNT the whole page and wipe in-progress work (e.g. a half-written
  // social post + generated copy). After we've settled once, keep rendering the
  // children through subsequent re-inits; the redirect below still fires if the
  // user genuinely has no profile.
  const settledOnce = useRef(false)
  if (!loading) settledOnce.current = true
  if (loading && !settledOnce.current) return null
  if (needsOnboarding) return <Navigate to="/welcome" replace />
  return <>{children}</>
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
              {/* Post-auth onboarding — authed but not yet provisioned. No Layout,
                  and NOT behind OnboardGate (that would loop). */}
              <Route path="/welcome" element={<PrivateRoute><Welcome /></PrivateRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Public, unauthenticated — Instant Audit Engine (SALES-ENGINE.md §2, CLAUDE.md §10) */}
              <Route path="/audit" element={<AuditRequest />} />
              <Route path="/audit/:token" element={<AuditReport />} />
              <Route path="/" element={<PrivateRoute><OnboardGate><Layout><Dashboard /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/mentions" element={<PrivateRoute><OnboardGate><Layout><Mentions /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/competitors" element={<PrivateRoute><OnboardGate><Layout><Competitors /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/prompts" element={<PrivateRoute><OnboardGate><Layout><Prompts /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/ai-visibility" element={<PrivateRoute><OnboardGate><Layout><AIVisibility /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/sentiment" element={<PrivateRoute><OnboardGate><Layout><BrandSentiment /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/recommendations" element={<PrivateRoute><OnboardGate><Layout><Recommendations /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/onboard" element={<PrivateRoute><OnboardGate><Layout><Onboard /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/social" element={<PrivateRoute><OnboardGate><Layout><Social /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/usage" element={<PrivateRoute><OnboardGate><Layout><Usage /></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/account" element={<PrivateRoute><OnboardGate><Layout><Account /></Layout></OnboardGate></PrivateRoute>} />
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
