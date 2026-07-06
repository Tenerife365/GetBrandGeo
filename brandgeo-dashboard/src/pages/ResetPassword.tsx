import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/themeContext'

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

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
      else setError('Invalid or expired reset link. Please request a new one.')
    })
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) setError(err.message)
    else setDone(true)
  }

  const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition disabled:opacity-50'

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8"><BrandGeoLogo /></div>
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-3 text-emerald-400" size={36} />
              <h1 className="text-lg font-semibold text-white mb-2">Password updated</h1>
              <p className="text-sm text-slate-400 mb-6">You can now sign in with your new password.</p>
              <button onClick={() => navigate('/login')} className="w-full bg-brand-500 hover:bg-brand-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">Go to sign in</button>
            </div>
          ) : (
            <div>
              <h1 className="text-lg font-semibold text-white mb-1">Set new password</h1>
              <p className="text-sm text-slate-400 mb-6">Choose a strong password for your account.</p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">New password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" disabled={!sessionReady} className={ic} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Confirm password</label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" disabled={!sessionReady} className={ic} />
                </div>
                {error && <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle size={14} /> {error}</div>}
                <button type="submit" disabled={loading || !sessionReady} className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">2026 BrandGEO - AI Visibility Intelligence</p>
      </div>
    </div>
  )
}
