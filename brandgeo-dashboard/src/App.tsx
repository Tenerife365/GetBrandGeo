import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { supabase, isDemoMode } from './lib/supabase'
import { MarketProvider } from './lib/marketContext'
import { ThemeProvider } from './lib/themeContext'
import { ClientProvider, useClient } from './lib/clientContext'
import { I18nProvider } from './lib/i18nContext'
import { CollectionProvider } from './lib/collectionContext'
import { ResultsProvider } from './lib/resultsContext'
import { LocationsProvider } from './lib/locationsContext'
import { TimeFilterProvider } from './lib/timeFilterContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import RouteSkeleton from './components/RouteSkeleton'
import { peekOauthNext } from './lib/oauthNext'

const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Invite = lazy(() => import('./pages/Invite'))
const Signup = lazy(() => import('./pages/Signup'))
const Welcome = lazy(() => import('./pages/Welcome'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Mentions = lazy(() => import('./pages/Mentions'))
const Competitors = lazy(() => import('./pages/Competitors'))
const Prompts = lazy(() => import('./pages/Prompts'))
const AIVisibility = lazy(() => import('./pages/AIVisibility'))
const BrandSentiment = lazy(() => import('./pages/BrandSentiment'))
const Recommendations = lazy(() => import('./pages/Recommendations'))
const Onboard = lazy(() => import('./pages/Onboard'))
const Revenue = lazy(() => import('./pages/Revenue'))
const Prospects = lazy(() => import('./pages/Prospects'))
const Social = lazy(() => import('./pages/Social'))
const SEO = lazy(() => import('./pages/SEO'))
const Account = lazy(() => import('./pages/Account'))
const Tickets = lazy(() => import('./pages/Tickets'))
const AuditRequest = lazy(() => import('./pages/AuditRequest'))
const AuditReport = lazy(() => import('./pages/AuditReport'))
const AffiliatesAdmin = lazy(() => import('./pages/AffiliatesAdmin'))
const AffiliateLogin = lazy(() => import('./pages/affiliate/AffiliateLogin'))
const AffiliateJoin = lazy(() => import('./pages/affiliate/AffiliateJoin'))
const AffiliatePortal = lazy(() => import('./pages/affiliate/AffiliatePortal'))
const OAuthAuthorize = lazy(() => import('./pages/OAuthAuthorize'))

// ---------------------------------------------------------------------------
// Stale chunk recovery (review finding R1). Every page is a lazy chunk with a
// hashed filename. After a deploy, a tab opened on the previous bundle asks for
// a chunk that no longer exists: the SPA fallback answers with index.html (or a
// 404), the dynamic import rejects, React.lazy throws on render, and without a
// boundary React 18 unmounts the whole root. Suspense does not catch rejected
// imports. So: catch it, reload ONCE (guarded by a sessionStorage flag so it can
// never loop), and otherwise show a card with a Reload button.
// ---------------------------------------------------------------------------
const CHUNK_RELOAD_FLAG = 'bg_chunk_reload'
const CHUNK_ERROR_RE = /dynamically imported module|Importing a module script failed|Failed to fetch|ChunkLoadError|error loading dynamically imported/i

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err ?? '')
  return CHUNK_ERROR_RE.test(msg)
}

// Reloads the page once per stale-tab event. Returns true when a reload was
// started, false when one was already tried (or storage is unavailable, in
// which case we refuse to reload rather than risk a loop).
function reloadOnce(): boolean {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_FLAG)) return false
    sessionStorage.setItem(CHUNK_RELOAD_FLAG, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

function clearReloadFlag() {
  try { sessionStorage.removeItem(CHUNK_RELOAD_FLAG) } catch { /* storage blocked: nothing to clear */ }
}

// Vite fires this when a preload (dependency chunk or CSS) fails. Reload once;
// if that was already tried, let the error propagate to the boundary below.
// On /invite no reload happens: a reload would drop the token the page holds in
// memory, so the page's own catch shows its inline retry error instead.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (e) => {
    if (window.location.pathname === '/invite') return
    if (reloadOnce()) e.preventDefault()
  })
}

interface BoundaryProps {
  children: React.ReactNode
  /** Inline card inside the layout (sidebar survives) instead of a full page. */
  compact?: boolean
  /** When this value changes, a previously caught error is cleared. */
  resetKey?: string
}

class ChunkErrorBoundary extends Component<BoundaryProps, { error: unknown | null }> {
  state: { error: unknown | null } = { error: null }
  private clearTimer: number | undefined

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error)) reloadOnce()
  }

  componentDidMount() {
    // A page that has stayed up for a few seconds without a chunk failure
    // counts as a successful load: re-arm the one-shot reload for the next deploy.
    this.clearTimer = window.setTimeout(clearReloadFlag, 5000)
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (this.state.error !== null && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  componentWillUnmount() {
    if (this.clearTimer !== undefined) window.clearTimeout(this.clearTimer)
  }

  render() {
    const { error } = this.state
    if (error === null) return this.props.children
    const stale = isChunkLoadError(error)
    return (
      <div
        role="alert"
        className={this.props.compact ? 'w-full p-4 md:p-6' : 'min-h-screen flex items-center justify-center p-6 bg-dark-900'}
      >
        <div className="max-w-md mx-auto rounded-xl border border-dark-700 bg-dark-800 p-6 text-center space-y-3">
          <h2 className="text-lg font-semibold text-white">
            {stale ? 'A new version is available' : 'This page hit a problem'}
          </h2>
          <p className="text-sm text-slate-300">
            {stale
              ? 'BrandGEO was updated while this tab was open. Reload to continue.'
              : 'Reload the page to try again. If it keeps happening, contact support.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-accent-strong hover:bg-accent-strong-hover text-on-accent text-sm font-medium"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}

// Boundary that resets when the route changes, so a failed page does not keep
// the error card after the user navigates elsewhere. Must render inside the router.
function RouteBoundary({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  const { pathname } = useLocation()
  return <ChunkErrorBoundary compact={compact} resetKey={pathname}>{children}</ChunkErrorBoundary>
}

// Per-route wrapper used inside Layout: the sidebar and providers survive a
// failed chunk, only the page area shows the card.
function RouteView({ children }: { children: React.ReactNode }) {
  return (
    <RouteBoundary compact>
      <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
    </RouteBoundary>
  )
}

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
  if (!authed) return <Navigate to="/login" replace />
  // Returning from a Google sign-in that began on the OAuth consent flow: the
  // provider drops the user on "/", so resume the stashed consent path (only
  // ever a safe /oauth/authorize? path, see lib/oauthNext.ts). Read only here;
  // OAuthAuthorize clears the stash when it mounts.
  const resume = window.location.pathname === '/' ? peekOauthNext() : null
  if (resume) return <Navigate to={resume} replace />
  return <>{children}</>
}

// Affiliate portal gate: same session check as PrivateRoute but bounces to the
// affiliate sign-in page, and deliberately NOT wrapped in OnboardGate or
// Layout. An affiliate has an auth user and no user_profiles row, so the
// customer shell would send them to /welcome to create a client they do not
// want. affiliate-portal.js re-verifies the JWT and the affiliate row itself.
function AffiliateRoute({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  useEffect(() => {
    if (isDemoMode) { setAuthed(sessionStorage.getItem('demo_logged_in') === 'true'); return }
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setAuthed(!!session))
    return () => listener.subscription.unsubscribe()
  }, [])
  if (authed === null) return null
  return authed ? <>{children}</> : <Navigate to="/affiliate/login" replace />
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

// Admin only: the partner portal rendered read only for one affiliate ("View as
// partner" on /affiliates). Presentation only, like the platform's view as
// user: the admin keeps their own session, affiliate-admin.js portal.preview
// re-checks the admin role server side, and nothing is minted or swapped.
function AffiliatePreviewRoute() {
  const { isAdmin } = useClient()
  const { affiliateId } = useParams()
  if (!isAdmin && !isDemoMode) return <Navigate to="/" replace />
  return <AffiliatePortal previewId={affiliateId || ''} />
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
        <LocationsProvider>
        <MarketProvider>
          <CollectionProvider>
          <ResultsProvider>
          <TimeFilterProvider>
          <BrowserRouter>
            <RouteBoundary><Suspense fallback={<RouteSkeleton />}>
            <Routes>
              <Route path="/login" element={<DemoLoginInterceptor />} />
              <Route path="/signup" element={<Signup />} />
              {/* Post-auth onboarding — authed but not yet provisioned. No Layout,
                  and NOT behind OnboardGate (that would loop). */}
              <Route path="/welcome" element={<PrivateRoute><Welcome /></PrivateRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Public landing page for the 7 day invite email. Makes no call on load. */}
              <Route path="/invite" element={<Invite />} />
              {/* Public, unauthenticated — Instant Audit Engine (SALES-ENGINE.md §2, CLAUDE.md §10) */}
              {/* MCP stage 3 consent page. Own session check (sends to
                  /login?next=...), so NOT behind PrivateRoute, OnboardGate or Layout. */}
              <Route path="/oauth/authorize" element={<OAuthAuthorize />} />
              <Route path="/audit" element={<AuditRequest />} />
              <Route path="/audit/:token" element={<AuditReport />} />
              {/* Affiliate module (docs/affiliates/README.md). The portal has its
                  own shell and its own gate: see AffiliateRoute above. The join
                  page is public, the single-use token in the URL is the credential.
                  Referral links /r/:slug/:code never reach React: netlify.toml
                  rewrites them to the affiliate-redirect function first. */}
              <Route path="/affiliate/login" element={<AffiliateLogin />} />
              <Route path="/affiliate/join/:token" element={<AffiliateJoin />} />
              {/* Public sample partner dashboard (made-up data, no login, read only) */}
              <Route path="/affiliate/demo" element={<AffiliatePortal sample />} />
              <Route path="/affiliate" element={<AffiliateRoute><AffiliatePortal /></AffiliateRoute>} />
              <Route path="/" element={<PrivateRoute><OnboardGate><Layout><RouteView><Dashboard /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/mentions" element={<PrivateRoute><OnboardGate><Layout><RouteView><Mentions /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/competitors" element={<PrivateRoute><OnboardGate><Layout><RouteView><Competitors /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/prompts" element={<PrivateRoute><OnboardGate><Layout><RouteView><Prompts /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/ai-visibility" element={<PrivateRoute><OnboardGate><Layout><RouteView><AIVisibility /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/sentiment" element={<PrivateRoute><OnboardGate><Layout><RouteView><BrandSentiment /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/recommendations" element={<PrivateRoute><OnboardGate><Layout><RouteView><Recommendations /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/onboard" element={<PrivateRoute><OnboardGate><Layout><RouteView><Onboard /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/social" element={<PrivateRoute><OnboardGate><Layout><RouteView><Social /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/seo" element={<PrivateRoute><OnboardGate><Layout><RouteView><SEO /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/usage" element={<PrivateRoute><OnboardGate><Layout><RouteView><Revenue /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/prospects" element={<PrivateRoute><OnboardGate><Layout><RouteView><Prospects /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/affiliates/preview/:affiliateId" element={<PrivateRoute><OnboardGate><AffiliatePreviewRoute /></OnboardGate></PrivateRoute>} />
              <Route path="/affiliates" element={<PrivateRoute><OnboardGate><Layout><RouteView><AffiliatesAdmin /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="/account" element={<PrivateRoute><OnboardGate><Layout><RouteView><Account /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              {/* One route, two views. Admins get the triage queue (customer
                  requests plus BrandGEO's own internal work); everyone else
                  gets their own requests. The split is inside Tickets.tsx. */}
              <Route path="/tickets" element={<PrivateRoute><OnboardGate><Layout><RouteView><Tickets /></RouteView></Layout></OnboardGate></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense></RouteBoundary>
          </BrowserRouter>
          </TimeFilterProvider>
          </ResultsProvider>
          </CollectionProvider>
        </MarketProvider>
        </LocationsProvider>
      </ClientProvider>
      </I18nProvider>
    </ThemeProvider>
    </MotionConfig>
  )
}
