import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useTheme } from '../lib/themeContext'

type Mode = 'login' | 'forgot' | 'sent'

function BrandGeoLogo() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.png" alt="BrandGEO icon" style={{ height: '40px', width: 'auto', display: 'block' }} />
      <span className="text-2xl font-bold tracking-tight">
        <span className={isDark ? 'text-white' : 'text-slate-900'}>Brand</span>
        <span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6D28D9 55%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GEO</span>
      </span>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (isDemoMode) { setTimeout(() => { navigate('/') }, 600); return }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) setError(err.message)
    else navigate('/')
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://app.getbrandgeo.com/reset-password',
    })
    setLoading(false)
    if (err) setError(err.message)
    else setMode('sent')
  }

  const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition'
  const bc = 'w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2'

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8"><BrandGeoLogo /></div>
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">

          {mode === 'sent' && (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-3 text-emerald-400" size={36} />
              <h1 className="text-lg font-semibold text-white mb-2">Check your inbox</h1>
              <p className="text-sm text-slate-400 mb-6">Reset link sent to <strong className="text-slate-300">{email}</strong>.</p>
              <button onClick={() => { setMode('login'); setError('') }} className="text-sm text-brand-400 hover:text-brand-300 transition-colors">Back to sign in</button>
            </div>
          )}

          {mode === 'forgot' && (
            <div>
              <h1 className="text-lg font-semibold text-white mb-1">Reset password</h1>
              <p className="text-sm text-slate-400 mb-6">Enter your email to receive a reset link.</p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={ic} />
                </div>
                {error && <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle size={14} /> {error}</div>}
                <button type="submit" disabled={loading} className={bc}>{loading && <Loader2 size={16} className="animate-spin" />}{loading ? 'Sending...' : 'Send reset link'}</button>
                <button type="button" onClick={() => { setMode('login'); setError('') }} className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors text-center">Back to sign in</button>
              </form>
            </div>
          )}

          {mode === 'login' && (
            <div>
              <h1 className="text-lg font-semibold text-white mb-1">Sign in</h1>
              <p className="text-sm text-slate-400 mb-6">Access your GEO dashboard</p>
              {isDemoMode && <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">Demo mode</div>}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={ic} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-slate-400 font-medium">Password</label>
                    <button type="button" onClick={() => { setMode('forgot'); setError('') }} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Forgot password?</button>
                  </div>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={ic} />
                </div>
                {error && <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle size={14} /> {error}</div>}
                <button type="submit" disabled={loading} className={bc}>{loading && <Loader2 size={16} className="animate-spin" />}{loading ? 'Signing in...' : 'Sign in'}</button>
              </form>
            </div>
          )}

        </div>
        <p className="text-center text-xs text-slate-500 mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 transition-colors">Sign up free</Link>
        </p>
        <p className="text-center text-xs text-slate-600 mt-3">2026 BrandGEO - AI Visibility Intelligence</p>
      </div>
    </div>
  )
}
