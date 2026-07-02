import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Users, LogOut, BookText, Bot, Lightbulb, ChevronDown, Sun, Moon, Globe2, Menu, X } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useMarket, MARKETS } from '../lib/marketContext'
import { useClient } from '../lib/clientContext'
import { MapPin, Building2 } from 'lucide-react'
import { useTheme } from '../lib/themeContext'

const nav = [
  { to: '/',               icon: LayoutDashboard, label: 'Overview'      },
  { to: '/mentions',       icon: MessageSquare,   label: 'Mentions'      },
  { to: '/competitors',    icon: Users,           label: 'Competitors'   },
  { to: '/prompts',        icon: BookText,        label: 'Prompts'       },
  { to: '/ai-visibility',  icon: Bot,             label: 'AI Visibility' },
  { to: '/recommendations',icon: Lightbulb,       label: 'Recomandări'   },
]

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

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { market, setMarket, region, setRegion } = useMarket()
  const { activeClientId, setActiveClientId, clients, isAdmin } = useClient()
  const { theme, toggle } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showMarkets, setShowMarkets] = useState(false)
  const [showRegions, setShowRegions] = useState(false)
  const [showClients, setShowClients] = useState(false)

  const handleLogout = async () => {
    if (!isDemoMode) await supabase.auth.signOut()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 flex flex-col',
          'transition-transform duration-200 ease-in-out',
          'md:relative md:w-56 md:flex-shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-dark-700 flex items-center justify-between flex-shrink-0">
          <BrandGeoLogo />
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">Demo</span>
            )}
            <button
              onClick={closeSidebar}
              className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-brand-500/20 text-brand-300 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Client switcher — admin only */}
        {isAdmin && clients.length > 0 && (
          <div className="p-3 border-t border-dark-700 flex-shrink-0">
            <div className="text-xs text-slate-600 uppercase tracking-wider px-1 mb-1.5">Client</div>
            <div className="relative">
              <button
                onClick={() => { setShowClients(v => !v); setShowMarkets(false); setShowRegions(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
              >
                <Building2 size={13} className="text-brand-400 flex-shrink-0" />
                <span className="flex-1 text-left truncate font-medium">
                  {clients.find(c => c.id === activeClientId)?.name ?? 'Select client'}
                </span>
                <ChevronDown size={13} className="text-slate-500 flex-shrink-0" />
              </button>
              {showClients && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-dark-700 border border-dark-600 rounded-lg overflow-hidden shadow-xl z-50">
                  {clients.map(c => (
                    <button key={c.id}
                      onClick={() => { setActiveClientId(c.id); setShowClients(false) }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${c.id === activeClientId ? 'text-brand-300 bg-brand-500/10' : 'text-slate-300 hover:bg-dark-600'}`}
                    >
                      <Building2 size={12} className="flex-shrink-0" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market / Region pickers */}
        <div className="p-3 border-t border-dark-700 space-y-1.5 flex-shrink-0">
          <div className="text-xs text-slate-600 uppercase tracking-wider px-1">Market</div>

          <div className="relative">
            <button
              onClick={() => { setShowMarkets(v => !v); setShowRegions(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 bg-dark-700 hover:bg-dark-600 transition-colors"
            >
              {market.flagCode === 'un'
                ? <Globe2 size={18} className="text-slate-400 flex-shrink-0" />
                : <img src={`https://flagcdn.com/w20/${market.flagCode}.png`} alt={market.label} className="w-5 h-auto rounded-sm flex-shrink-0" />
              }
              <span className="flex-1 text-left">{market.label}</span>
              {MARKETS.length > 1 && <ChevronDown size={13} className="text-slate-500" />}
            </button>
            {showMarkets && MARKETS.length > 1 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-dark-700 border border-dark-600 rounded-lg overflow-hidden shadow-xl z-50">
                {MARKETS.map(m => (
                  <button key={m.id} onClick={() => { setMarket(m); setShowMarkets(false) }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${m.id === market.id ? 'text-brand-300 bg-brand-500/10' : 'text-slate-300 hover:bg-dark-600'}`}
                  >
                    {m.flagCode === 'un'
                      ? <Globe2 size={16} className="text-slate-400" />
                      : <img src={`https://flagcdn.com/w20/${m.flagCode}.png`} alt={m.label} className="w-5 h-auto rounded-sm" />
                    }
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowRegions(v => !v); setShowMarkets(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors"
            >
              <MapPin size={13} className="text-slate-500 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{region.label}</span>
              <ChevronDown size={13} className="text-slate-500 flex-shrink-0" />
            </button>
            {showRegions && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-dark-700 border border-dark-600 rounded-lg overflow-hidden shadow-xl z-50">
                {market.regions.map(r => (
                  <button key={r.id} onClick={() => { setRegion(r); setShowRegions(false) }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${r.id === region.id ? 'text-brand-300 bg-brand-500/10' : 'text-slate-300 hover:bg-dark-600'}`}
                  >
                    <MapPin size={12} className="flex-shrink-0" />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t border-dark-700 space-y-0.5 flex-shrink-0">
          <button onClick={toggle} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex-shrink-0 h-14 bg-dark-800 border-b border-dark-700 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <BrandGeoLogo />
        </header>

        <main className="flex-1 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
