import { useState, useEffect } from 'react'
import { Building2, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
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

const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition'

// Common personal-mailbox providers — an email at one of these should NOT be
// treated as a company domain for the auto-prefill (SIGNUP-RESEARCH.md §2.2).
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com', 'aol.com', 'proton.me',
  'protonmail.com', 'gmx.com', 'gmx.net', 'mail.com', 'yandex.com', 'zoho.com',
])

type AccountType = 'company' | 'personal'

export default function Welcome() {
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [brandName, setBrandName] = useState('')
  const [brandWebsite, setBrandWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Light prefill: if the user's email is at a company (non-personal) domain,
  // default to the Company branch and pre-fill the website. A gmail/outlook user
  // gets no default, so the influencer path is never nudged toward "company".
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const email = user?.email || ''
      const at = email.lastIndexOf('@')
      if (at === -1) return
      const domain = email.slice(at + 1).toLowerCase()
      if (domain && !PERSONAL_EMAIL_DOMAINS.has(domain)) {
        setAccountType('company')
        setBrandWebsite(domain)
      }
    })
  }, [])

  async function submit() {
    if (loading || !accountType) return
    setError('')

    if (accountType === 'company' && !brandWebsite.trim()) {
      setError('Please enter your company website.')
      return
    }
    if (accountType === 'personal' && !brandName.trim()) {
      setError('Please enter your name as it appears publicly.')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { window.location.assign('/login'); return }

      const res = await fetch('/.netlify/functions/provision-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          account_type: accountType,
          brand_name: brandName.trim(),
          brand_website: brandWebsite.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Setup failed. Please try again.')

      // Full reload so ClientProvider re-inits with the new profile/client, then
      // lands on the dashboard.
      window.location.assign('/')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const ChoiceCard = ({ type, icon: Icon, title, desc }: { type: AccountType; icon: typeof Building2; title: string; desc: string }) => (
    <button
      type="button"
      onClick={() => setAccountType(type)}
      className={`flex-1 text-left p-4 rounded-xl border transition-colors ${
        accountType === type
          ? 'border-brand-500 bg-brand-500/10'
          : 'border-dark-600 bg-dark-700/40 hover:border-dark-500'
      }`}
      aria-pressed={accountType === type}
    >
      <Icon size={20} className={accountType === type ? 'text-brand-300' : 'text-slate-400'} />
      <div className="mt-2 text-sm font-semibold text-white">{title}</div>
      <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
    </button>
  )

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8"><BrandGeoLogo /></div>
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
          <h1 className="text-lg font-semibold text-white mb-1">What do you want to track in AI answers?</h1>
          <p className="text-sm text-slate-400 mb-5">This sets up what we monitor for you. You can change it later.</p>

          <div className="flex gap-3 mb-5">
            <ChoiceCard type="company" icon={Building2} title="A company or brand" desc="You have a website." />
            <ChoiceCard type="personal" icon={User} title="A personal brand" desc="You, a creator, or consultant." />
          </div>

          {accountType === 'company' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Company website</label>
                <input value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} placeholder="yourcompany.com" className={ic} autoFocus />
                <p className="text-xs text-slate-600 mt-1.5">The site you want to appear for in AI results.</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Brand name <span className="text-slate-600">(optional)</span></label>
                <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Your Company" className={ic} />
              </div>
            </div>
          )}

          {accountType === 'personal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Your public name</label>
                <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Jane Doe" className={ic} autoFocus />
                <p className="text-xs text-slate-600 mt-1.5">The name people would search for you by.</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Link <span className="text-slate-600">(optional)</span></label>
                <input value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} placeholder="LinkedIn, portfolio, or personal site" className={ic} />
                <p className="text-xs text-slate-600 mt-1.5">A website is not required. We track your name across AI answers.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-4">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {accountType && (
            <button
              onClick={submit}
              disabled={loading}
              className="w-full mt-5 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
