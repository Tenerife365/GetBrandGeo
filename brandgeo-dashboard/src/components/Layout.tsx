import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Users, LogOut, BookText, Bot, ChevronDown, Sun, Moon } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useMarket, MARKETS } from '../lib/marketContext'
import { useTheme } from '../lib/themeContext'

const nav = [
  { to: '/',              icon: LayoutDashboard, label: 'Overview'      },
  { to: '/mentions',      icon: MessageSquare,   label: 'Mentions'      },
  { to: '/competitors',   icon: Users,           label: 'Competitors'   },
  { to: '/prompts',       icon: BookText,        label: 'Prompts'       },
  { to: '/ai-visibility', icon: Bot,             label: 'AI Visibility' },
]

function BrandGeoLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1f9baa" />
            <stop offset="100%" stopColor="#3ab8c4" />
          </linearGradient>
        </defs>
        <path
          d="M14 2L24.39 8v12L14 26 3.61 20V8z"
          fill="url(#logoGrad)"
          opacity="0.15"
        />
        <path
          d="M14 2L24.39 8v12L14 26 3.61 20V8z"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="14" cy="11.5" r="3" fill="url(#logoGrad)" />
        <path d="M14 14.5c-3 3-4.5 5-4.5 5h9S17 17.5 14 14.5z" fill="url(#logoGrad)" opacity="0.6" />
      </svg>
      <div className="leading-none">
        <span className="font-bold text-base tracking-tight text-white">Brand</span>
        <span className="font-bold text-base tracking-tight text-brand-400">GEO</span>
      </div>
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { market, setMarket } = useMarket()
  const { theme, toggle } = useTheme()
  const [showMarkets, setShowMarkets] = useState(false)

  const handleLogout = async () => {
    if (!isDemoMode) await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-dark-900">
      <aside className="w-56 flex-shrink-0 bg-dark-800 border-r border-dark-700 flex flex-col">
        <div className="px-4 py-4 border-b border-dark-700 flex items-center justify-between">
          <BrandGeoLogo />
          {isDemoMode && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">
              Demo
            </span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-dark-700">
          <div className="text-xs text-slate-600 uppercase tracking-wider px-1 mb-1.5">Market</div>
          <div className="relative">
            <button
              onClick={() => setShowMarkets(v => !v)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 bg-dark-700 hover:bg-dark-600 transition-colors"
            >
              <span className="text-base leading-none">{market.flag}</span>
              <span className="flex-1 text-left">{market.label}</span>
              {MARKETS.length > 1 && <ChevronDown size={13} className="text-slate-500" />}
            </button>
            {showMarkets && MARKETS.length > 1 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-dark-700 border border-dark-600 rounded-lg overflow-hidden shadow-xl z-50">
                {MARKETS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMarket(m); setShowMarkets(false) }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                      m.id === market.id ? 'text-brand-300 bg-brand-500/10' : 'text-slate-300 hover:bg-dark-600'
                    }`}
                  >
                    <span>{m.flag}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-dark-700 space-y-0.5">
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto scrollbar-thin">
        {children}
      </main>
    </div>
  )
}
