import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, LogOut, BookText, Bot, Lightbulb,
  ChevronDown, Moon, Sun, Globe2, Menu, X, UserPlus, Loader2,
  StopCircle, Plus, DollarSign, Smile, CreditCard, User,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useMarket, MARKETS } from '../lib/marketContext'
import { useClient } from '../lib/clientContext'
import { Building2 } from 'lucide-react'
import SupportWidget from './SupportWidget'
import { useTheme } from '../lib/themeContext'
import { useI18n, LANGUAGES } from '../lib/i18nContext'
import { useCollection } from '../lib/collectionContext'
import { useTimeFilter } from '../lib/timeFilterContext'
import type { TimeRange } from '../lib/timeFilterContext'

function BrandGeoLogo() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div className="flex items-center gap-2">
      <img src="/logo.png" alt="BrandGEO icon" style={{ height: '32px', width: 'auto', display: 'block' }} />
      <div className="leading-none">
        <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Brand</span>
        <span className="font-bold text-base tracking-tight" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6D28D9 55%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GEO</span>
      </div>
    </div>
  )
}

const TIME_LABELS: Record<TimeRange, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  'all': 'All time',
}

// Admin client-switcher grouping. Each client falls into exactly ONE bucket by
// precedence: test > research > archived > free > active. "Free" derives from an
// explicit category='free' OR the actual plan='free', so real free-plan signups
// land there automatically without needing to be categorised. (Master-DashboardDesign)
type ClientGroupKey = 'active' | 'free' | 'test' | 'research' | 'archived'
function clientBucket(c: { category?: string | null; plan?: string | null }): ClientGroupKey {
  if (c.category === 'test')     return 'test'
  if (c.category === 'research') return 'research'
  if (c.category === 'archived') return 'archived'
  if (c.category === 'free' || c.plan === 'free') return 'free'
  return 'active'
}
const CLIENT_GROUPS: { key: ClientGroupKey; label: string }[] = [
  { key: 'active',   label: 'Active' },
  { key: 'free',     label: 'Free' },
  { key: 'test',     label: 'Test' },
  { key: 'research', label: 'Research' },
  { key: 'archived', label: 'Archived' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { selections, addSelection, removeSelection, updateRegion } = useMarket()
  const { activeClientId, activeClient, setActiveClientId, clients, isAdmin, updateClientCategory } = useClient()
  const { theme, toggle } = useTheme()
  const { lang, setLang, t } = useI18n()
  const { collecting, progress, stopCollection } = useCollection()
  const { timeRange, setTimeRange } = useTimeFilter()
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [showAddMarket, setShowAddMarket] = useState(false)
  const [showClients, setShowClients]   = useState(false)
  const [showLangs, setShowLangs]       = useState(false)
  const [clientGroup, setClientGroup]   = useState<ClientGroupKey>('active')
  const [catSaving, setCatSaving]       = useState(false)

  // Refs for the three dropdown menus below — used only to detect outside clicks
  // (Master-Dashboard-Polish Phase 5, keyboard/focus pass). None of these change the
  // existing toggle-on-click behavior, they just add the missing keyboard/click-away paths.
  const clientMenuRef = useRef<HTMLDivElement>(null)
  const marketMenuRef = useRef<HTMLDivElement>(null)
  const langMenuRef   = useRef<HTMLDivElement>(null)

  // Close any open dropdown on outside click or Escape — none of the 3 dropdowns below
  // previously had this, so keyboard/screen-reader users had no way to dismiss one short
  // of re-clicking the trigger or picking an option.
  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (showClients && clientMenuRef.current && !clientMenuRef.current.contains(target)) setShowClients(false)
      if (showAddMarket && marketMenuRef.current && !marketMenuRef.current.contains(target)) setShowAddMarket(false)
      if (showLangs && langMenuRef.current && !langMenuRef.current.contains(target)) setShowLangs(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowClients(false)
        setShowAddMarket(false)
        setShowLangs(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showClients, showAddMarket, showLangs])

  // Mobile bottom nav keeps this flat order — space-constrained icon bar, grouping doesn't apply.
  // Nav order: AI Visibility → Brand Sentiment → Recommendations → Competitors → AI Mentions → Overview → Prompts
  const nav = [
    { to: '/ai-visibility',   icon: Bot,             label: t.nav_aiVisibility    },
    { to: '/sentiment',       icon: Smile,           label: t.nav_sentiment       },
    { to: '/recommendations', icon: Lightbulb,       label: t.nav_recommendations },
    { to: '/competitors',     icon: Users,           label: t.nav_competitors     },
    { to: '/mentions',        icon: MessageSquare,   label: t.nav_mentions        },
    { to: '/',                icon: LayoutDashboard, label: t.nav_overview        },
    { to: '/prompts',         icon: BookText,        label: t.nav_prompts         },
  ]

  // Desktop sidebar: same pages, grouped into sections for a stronger information hierarchy
  // (Master-Redesign Phase 2, 2026-07-09 — see CLAUDE.md §7.4). Overview leads Insights since
  // it's the "/" landing route; Onboard Client and Usage & Costs (both admin-only) are folded
  // into Manage instead of their own standalone bordered blocks further down the sidebar.
  const navGroups: { label: string; items: typeof nav }[] = [
    {
      label: 'Insights',
      items: [
        { to: '/',              icon: LayoutDashboard, label: t.nav_overview     },
        { to: '/ai-visibility', icon: Bot,             label: t.nav_aiVisibility },
        { to: '/sentiment',     icon: Smile,           label: t.nav_sentiment    },
        { to: '/mentions',      icon: MessageSquare,   label: t.nav_mentions     },
      ],
    },
    {
      label: 'Strategy',
      items: [
        { to: '/competitors',     icon: Users,     label: t.nav_competitors     },
        { to: '/recommendations', icon: Lightbulb, label: t.nav_recommendations },
      ],
    },
    {
      label: 'Manage',
      items: [
        { to: '/prompts', icon: BookText, label: t.nav_prompts },
        ...(isAdmin ? [{ to: '/usage', icon: DollarSign, label: 'Usage & Costs' }] : []),
        ...(isAdmin ? [{ to: '/onboard', icon: UserPlus, label: 'Onboard Client' }] : []),
      ],
    },
  ]

  // Stronger active-state indicator: left accent bar + bg tint, not just a bg tint (§7.4 Phase 2)
  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors border-l-2',
      isActive
        ? 'bg-brand-500/15 text-brand-300 font-medium border-brand-400'
        : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700 border-transparent',
    ].join(' ')

  const handleLogout = async () => {
    if (!isDemoMode) await supabase.auth.signOut()
    navigate('/login')
  }

  // Opens the Stripe Customer Portal for the active client's subscription
  // (update card, switch plan, cancel). Only rendered when the client actually
  // has a Stripe customer id — cancellations flow back via stripe-webhook.js.
  const [billingLoading, setBillingLoading] = useState(false)
  const openBilling = async () => {
    if (billingLoading) return
    setBillingLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ client_id: activeClientId }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.url) {
        window.location.href = data.url   // hand off to Stripe's hosted portal
        return
      }
      alert(data?.error || 'Could not open the billing portal. Please try again.')
    } catch {
      alert('Could not open the billing portal. Please try again.')
    }
    setBillingLoading(false)
  }

  const closeSidebar = () => setSidebarOpen(false)
  const brandInitials = (activeClient?.name ?? '?').trim().split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  // The profile page has no historical data, so hide the global time-filter bar there.
  const hideTimeFilter = useLocation().pathname === '/account'
  const currentLang = LANGUAGES.find(l => l.id === lang) ?? LANGUAGES[0]
  const collectPct  = progress ? Math.round((progress.done / progress.total) * 100) : 0

  // Markets not yet selected — available to add
  const availableMarkets = MARKETS.filter(m => !selections.some(s => s.market.id === m.id))

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">

      {/* Skip-to-content link (WCAG 2.4.1) — visually hidden until keyboard-focused.
          sr-only/focus:not-sr-only are Tailwind built-ins; .skip-link (index.css) handles
          the fixed positioning once it's focused. */}
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
        Skip to main content
      </a>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={[
        'fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700/60 flex flex-col',
        'transition-transform duration-200 ease-in-out',
        'md:relative md:w-64 md:flex-shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-dark-700/60 flex items-center justify-between flex-shrink-0">
          <BrandGeoLogo />
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">Demo</span>
            )}
            <button onClick={closeSidebar} className="md:hidden text-slate-400 hover:text-white transition-colors p-2" aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Collection progress — visible from any tab */}
        {collecting && progress && (
          <div className="px-3 py-2.5 bg-brand-500/8 border-b border-brand-500/20 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin text-brand-400" />
                <span className="text-xs text-brand-300 font-medium truncate max-w-[120px]">
                  {progress.clientName}
                </span>
              </div>
              <button
                onClick={stopCollection}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                title="Stop collection"
              >
                <StopCircle size={11} />
                Stop
              </button>
            </div>
            <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-400 rounded-full transition-all duration-300"
                style={{ width: `${collectPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-600">{progress.done}/{progress.total} prompts</span>
              <span className="text-[10px] text-slate-600">{collectPct}%</span>
            </div>
          </div>
        )}

        {/* Nav links — grouped into sections (Master-Redesign Phase 2) */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto" aria-label="Primary">
          {navGroups.map(group => (
            <div key={group.label}>
              <div className="text-xs text-slate-600 uppercase tracking-wider px-3 mb-2">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to} end={to === '/'}
                    onClick={closeSidebar}
                    className={navItemClass}
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Client switcher — admin only */}
        {isAdmin && clients.length > 0 && (
          <div className="p-4 border-t border-dark-700/60 flex-shrink-0">
            <div className="text-xs text-slate-600 uppercase tracking-wider px-1 mb-1.5">{t.sidebar_client}</div>
            <div className="relative" ref={clientMenuRef}>
              <button
                onClick={() => {
                  setShowClients(v => {
                    const opening = !v
                    // Open on the tab that holds the current client, so the switcher
                    // shows where you already are.
                    if (opening && activeClient) setClientGroup(clientBucket(activeClient))
                    return opening
                  })
                  setShowAddMarket(false); setShowLangs(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-slate-300 bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
                aria-haspopup="listbox"
                aria-expanded={showClients}
              >
                <Building2 size={13} className="text-brand-400 flex-shrink-0" />
                <span className="flex-1 text-left truncate font-medium">
                  {clients.find(c => c.id === activeClientId)?.name ?? t.sidebar_selectClient}
                </span>
                <ChevronDown size={13} className="text-slate-500 flex-shrink-0" />
              </button>
              {showClients && (() => {
                // Bucket every client, then show tabs for the non-empty groups
                // and the list for the selected one (Master-DashboardDesign).
                const grouped: Record<ClientGroupKey, typeof clients> = { active: [], free: [], test: [], research: [], archived: [] }
                clients.forEach(c => { grouped[clientBucket(c)].push(c) })
                const tabs = CLIENT_GROUPS.filter(g => grouped[g.key].length > 0)
                const current: ClientGroupKey = grouped[clientGroup].length ? clientGroup : (tabs[0]?.key ?? 'active')
                return (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-dark-700 border border-dark-600 rounded-lg overflow-hidden shadow-xl z-50">
                    <div className="flex flex-wrap gap-1 p-2 border-b border-dark-600 bg-dark-800/40" role="tablist">
                      {tabs.map(g => (
                        <button key={g.key}
                          role="tab"
                          aria-selected={current === g.key}
                          onClick={() => setClientGroup(g.key)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${current === g.key ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-dark-600 border border-transparent'}`}
                        >
                          {g.label} <span className="opacity-60">{grouped[g.key].length}</span>
                        </button>
                      ))}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {grouped[current].map(c => (
                        <button key={c.id}
                          onClick={() => { setActiveClientId(c.id); setShowClients(false) }}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${c.id === activeClientId ? 'text-brand-300 bg-brand-500/10' : 'text-slate-300 hover:bg-dark-600'}`}
                        >
                          <Building2 size={12} className="flex-shrink-0" />
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Reclassify the current client's group (admin) */}
            {activeClient && (
              <div className="flex items-center gap-2 mt-2 px-1">
                <span className="text-[11px] text-slate-500 flex-shrink-0">Group</span>
                <select
                  value={activeClient.category ?? 'active'}
                  disabled={catSaving}
                  onChange={async (e) => {
                    const next = e.target.value
                    setCatSaving(true)
                    try { await updateClientCategory(activeClient.id, next) }
                    catch (err) { alert('Could not update category: ' + (err as Error).message) }
                    finally { setCatSaving(false) }
                  }}
                  className="flex-1 bg-dark-700 border border-dark-600 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-brand-500/50 disabled:opacity-50"
                  aria-label="Client group category"
                >
                  <option value="active">Active</option>
                  <option value="free">Free</option>
                  <option value="test">Test</option>
                  <option value="research">Research</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Brand identity for non-admins (viewers) — the client switcher above is
            admin-only, so this is where a signed-in member sees whose dashboard
            this is and reaches their own account. (Ownership) */}
        {!isAdmin && activeClient && (
          <div className="p-4 border-t border-dark-700/60 flex-shrink-0">
            <NavLink to="/account" onClick={closeSidebar}
              className="flex items-center gap-2.5 px-1 py-1 rounded-lg hover:bg-dark-700 transition-colors group">
              <span className="w-9 h-9 rounded-lg bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25 flex items-center justify-center text-xs font-bold shrink-0">
                {brandInitials}
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-medium text-slate-200 truncate">{activeClient.name}</span>
                <span className="block text-[11px] text-slate-500 group-hover:text-slate-400">View profile</span>
              </span>
            </NavLink>
          </div>
        )}

        {/* Market selector — multi-select with per-market region pickers */}
        <div className="p-4 border-t border-dark-700/60 space-y-2 flex-shrink-0">
          <div className="text-xs text-slate-600 uppercase tracking-wider px-1">{t.sidebar_market}</div>

          {/* Selected market chips */}
          <div className="space-y-1">
            {selections.map(sel => (
              <div key={sel.market.id} className="bg-dark-700 rounded-lg overflow-hidden">
                {/* Market header row */}
                <div className="flex items-center gap-2 px-3 py-2">
                  {sel.market.flagCode === 'un'
                    ? <Globe2 size={15} className="text-slate-400 flex-shrink-0" />
                    : <img src={`https://flagcdn.com/w20/${sel.market.flagCode}.png`} alt="" className="w-5 h-auto rounded-sm flex-shrink-0" />
                  }
                  <span className="flex-1 text-sm text-slate-300 truncate">{sel.market.label}</span>
                  {selections.length > 1 && (
                    <button
                      onClick={() => removeSelection(sel.market.id)}
                      className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
                      title={`Remove ${sel.market.label}`}
                      aria-label={`Remove ${sel.market.label} from selected markets`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {/* Inline region selector — only shown when market has sub-regions */}
                {sel.market.regions.length > 1 && (
                  <div className="px-2 pb-2">
                    <select
                      value={sel.region.id}
                      onChange={e => {
                        const r = sel.market.regions.find(r => r.id === e.target.value)
                        if (r) updateRegion(sel.market.id, r)
                      }}
                      className="w-full text-xs bg-dark-600 border border-dark-500 rounded px-2 py-1 text-slate-400 focus:outline-none focus:border-brand-500/50 cursor-pointer"
                      aria-label={`Region for ${sel.market.label}`}
                    >
                      {sel.market.regions.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add market picker */}
          {availableMarkets.length > 0 && (
            <div className="relative" ref={marketMenuRef}>
              <button
                onClick={() => { setShowAddMarket(v => !v); setShowClients(false); setShowLangs(false) }}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-dark-700 transition-colors border border-dashed border-dark-600 hover:border-dark-500"
                aria-haspopup="listbox"
                aria-expanded={showAddMarket}
              >
                <Plus size={11} />
                Add market
              </button>
              {showAddMarket && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-dark-700 border border-dark-600 rounded-lg overflow-y-auto max-h-56 shadow-xl z-50">
                  {availableMarkets.map(m => (
                    <button key={m.id}
                      onClick={() => { addSelection(m); setShowAddMarket(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-dark-600 transition-colors"
                    >
                      {m.flagCode === 'un'
                        ? <Globe2 size={15} className="text-slate-400 flex-shrink-0" />
                        : <img src={`https://flagcdn.com/w20/${m.flagCode}.png`} alt="" className="w-5 h-auto rounded-sm flex-shrink-0" />
                      }
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t border-dark-700/60 space-y-1 flex-shrink-0">
          <NavLink to="/account" onClick={closeSidebar}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors">
            <User size={16} />
            My Profile
          </NavLink>
          {/* Billing (only when the client has a Stripe subscription) stays its own row */}
          {activeClient?.stripe_customer_id && (
            <button
              onClick={openBilling}
              disabled={billingLoading}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors disabled:opacity-60"
            >
              {billingLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {t.sidebar_billing}
            </button>
          )}

          {/* Compact controls: language · theme · sign out on ONE line — reclaims
              vertical space so the nav above isn't squeezed on short screens (13").
              The old lucide "Languages" glyph is dropped; the flag already identifies
              the language. Theme is a sun/moon icon toggle (keeps role=switch a11y);
              sign out is an icon button (red on hover). */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="relative flex-1 min-w-0" ref={langMenuRef}>
              <button
                onClick={() => { setShowLangs(v => !v); setShowAddMarket(false); setShowClients(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors"
                aria-haspopup="listbox"
                aria-expanded={showLangs}
                title="Language"
              >
                <img src={`https://flagcdn.com/w20/${currentLang.flagCode}.png`} alt="" className="w-4 h-auto rounded-sm flex-shrink-0" />
                <span className="flex-1 text-left truncate">{currentLang.label}</span>
                <ChevronDown size={13} className="text-slate-500 flex-shrink-0" />
              </button>
              {showLangs && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-dark-700 border border-dark-600 rounded-lg overflow-hidden shadow-xl z-50">
                  {LANGUAGES.map(l => (
                    <button key={l.id}
                      onClick={() => { setLang(l.id); setShowLangs(false) }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${l.id === lang ? 'text-brand-300 bg-brand-500/10' : 'text-slate-300 hover:bg-dark-600'}`}
                    >
                      <img src={`https://flagcdn.com/w20/${l.flagCode}.png`} alt="" className="w-4 h-auto rounded-sm flex-shrink-0" />
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggle}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={t.sidebar_darkMode}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors"
            >
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
              onClick={handleLogout}
              aria-label={t.sidebar_signOut}
              title={t.sidebar_signOut}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-red-400 hover:bg-dark-700 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile header */}
        <header className="md:hidden flex-shrink-0 h-14 bg-dark-800 border-b border-dark-700/60 flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white transition-colors p-2" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <BrandGeoLogo />
          {collecting && progress && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-brand-400">
              <Loader2 size={12} className="animate-spin" />
              <span>{progress.done}/{progress.total}</span>
            </div>
          )}
        </header>

        {/* Global time filter bar — hidden on the profile page (no historical data there) */}
        {!hideTimeFilter && (
        <div className="flex-shrink-0 border-b border-dark-700/40 bg-dark-800/60 backdrop-blur-sm px-4 sm:px-6 py-2 flex items-center gap-1">
          {((['7d', '30d', '90d', 'all'] as const)).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              aria-pressed={timeRange === r}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                timeRange === r
                  ? 'bg-brand-500/20 text-brand-300'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-dark-700/50'
              }`}
            >
              {TIME_LABELS[r]}
            </button>
          ))}
        </div>
        )}

        <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto scrollbar-thin pb-16 md:pb-0 focus:outline-none">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav bar */}
      <nav aria-label="Primary mobile" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-800/95 backdrop-blur-md border-t border-dark-700 flex items-stretch justify-around safe-area-pb">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-2 py-2 flex-1 transition-colors min-w-0 ${
                isActive ? 'text-brand-300' : 'text-slate-500 active:text-slate-300'
              }`
            }
          >
            <Icon size={19} />
            <span className="text-[9px] font-medium leading-none truncate max-w-full">
              {label.split(' ')[0]}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Floating support widget — present on every dashboard page. */}
      <SupportWidget />
    </div>
  )
}
