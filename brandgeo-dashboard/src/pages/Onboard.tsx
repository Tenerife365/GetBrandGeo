import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClient } from '../lib/clientContext'
import { useCollection } from '../lib/collectionContext'
import { getActiveEngines } from '../lib/planConfig'
import { supabase } from '../lib/supabase'
import { CheckCircle2, ChevronRight, Loader2, Building2, Globe, Tag, Users, Lock, Zap, MessageSquarePlus } from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 5 | 6

export default function Onboard() {
  const { isAdmin } = useClient()
  const { collecting, progress: collectionProgress, runCollection } = useCollection()
  const navigate = useNavigate()

  // Form state
  const [step, setStep] = useState<Step>(1)
  const [name, setName]           = useState('')
  const [slug, setSlug]           = useState('')
  const [website, setWebsite]     = useState('')
  const [aliasInput, setAliasInput]       = useState('')
  const [aliases, setAliases]             = useState<string[]>([])
  const [competitorInput, setCompetitorInput] = useState('')
  const [competitors, setCompetitors]     = useState<string[]>([])
  const [promptInput, setPromptInput]     = useState('')
  const [prompts, setPrompts]             = useState<string[]>([])
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [newClientId, setNewClientId] = useState<number | null>(null)
  const [collectionRunning, setCollectionRunning] = useState(false)
  const [lastTotal, setLastTotal] = useState<number | null>(null)

  // Snapshot the last known prompt count while collectionContext's progress
  // is live — it resets to null when the run finishes, so this is what the
  // "Collection complete!" card reads after the fact.
  useEffect(() => {
    if (collectionProgress) setLastTotal(collectionProgress.total)
  }, [collectionProgress])

  if (!isAdmin) return (
    <div className="p-8 text-slate-500 text-sm">Access restricted to admins.</div>
  )

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addAlias = () => {
    const v = aliasInput.trim().toLowerCase()
    if (v && !aliases.includes(v)) setAliases(prev => [...prev, v])
    setAliasInput('')
  }

  const addCompetitor = () => {
    const v = competitorInput.trim().toLowerCase()
    if (v && !competitors.includes(v)) setCompetitors(prev => [...prev, v])
    setCompetitorInput('')
  }

  const autoSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // ── Step 4: Create client + user ─────────────────────────────────────────

  const handleCreate = async () => {
    setCreating(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/onboard-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name, slug,
          brand_website:    website,
          brand_aliases:    aliases,
          known_competitors: competitors,
          contact_email:    email,
          contact_password: password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Onboarding failed')
      setNewClientId(data.client_id)
      setStep(5)
      runCollection(data.client_id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCreating(false)
    }
  }

  // ── Step 5: Sequential collection ────────────────────────────────────────

  const runCollection = async (clientId: number) => {
    // Fetch client config from Supabase
    const { data: clientRow } = await supabase
      .from('clients')
      .select('brand_aliases, brand_website, known_competitors')
      .eq('id', clientId)
      .single()

    const clientConfig = {
      brand_aliases:    clientRow?.brand_aliases    ?? [],
      brand_website:    clientRow?.brand_website    ?? '',
      known_competitors: clientRow?.known_competitors ?? [],
    }

    // Fetch active prompts
    const { data: prompts } = await supabase
      .from('prompts')
      .select('id, text')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('position')

    if (!prompts || prompts.length === 0) {
      setProgress({ total: 0, done: 0, current: 'No active prompts found.', errors: 0, finished: true })
      return
    }

    setProgress({ total: prompts.length, done: 0, current: '', errors: 0, finished: false })

    const { data: { session: collSession } } = await supabase.auth.getSession()
    const collToken = collSession?.access_token ?? ''

    let errors = 0
    for (let i = 0; i < prompts.length; i++) {
      const p = prompts[i]
      setProgress(prev => ({ ...prev!, current: p.text.slice(0, 70) + '…', done: i }))
      try {
        const res = await fetch('/.netlify/functions/collect-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(collToken ? { 'Authorization': `Bearer ${collToken}` } : {}),
          },
          body: JSON.stringify({
            prompt_id:     p.id,
            prompt_text:   p.text,
            client_id:     clientId,
            client_config: clientConfig,
          }),
        })
        if (!res.ok) errors++
      } catch { errors++ }
    }

    setProgress({ total: prompts.length, done: prompts.length, current: 'All done!', errors, finished: true })
  }

  // ── Step indicators ───────────────────────────────────────────────────────

  const steps = [
    { n: 1, label: 'Company',     icon: Building2 },
    { n: 2, label: 'Brand',       icon: Tag },
    { n: 3, label: 'Competitors', icon: Users },
    { n: 4, label: 'Login',       icon: Lock },
    { n: 5, label: 'Collecting',  icon: Zap },
  ]

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Onboard New Client</h1>
        <p className="text-sm text-slate-400">Set up a new client account with AI monitoring in minutes.</p>
      </div>

      {/* Step bar */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map(({ n, label, icon: Icon }, idx) => {
          const done    = step > n
          const active  = step === n
          return (
            <div key={n} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                done   ? 'bg-emerald-500/20 text-emerald-400' :
                active ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' :
                         'bg-dark-800 text-slate-600 border border-dark-700'
              }`}>
                {done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                {label}
              </div>
              {idx < steps.length - 1 && <ChevronRight size={12} className="text-slate-700 shrink-0" />}
            </div>
          )
        })}
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">

        {/* ── Step 1: Company info ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Building2 size={18} className="text-brand-400" /> Company Info</h2>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company name *</label>
              <input value={name} onChange={e => { setName(e.target.value); setSlug(autoSlug(e.target.value)) }}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                placeholder="Bucate pe Roate" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Slug (URL key) *</label>
              <input value={slug} onChange={e => setSlug(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 font-mono"
                placeholder="bucate-pe-roate" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1"><Globe size={11} /> Website domain</label>
              <input value={website} onChange={e => setWebsite(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                placeholder="bucateperoate.ro" />
            </div>
            <button disabled={!name || !slug}
              onClick={() => setStep(2)}
              className="w-full py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-sm font-medium hover:bg-brand-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* ── Step 2: Brand aliases ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Tag size={18} className="text-brand-400" /> Brand Aliases</h2>
            <p className="text-xs text-slate-500">All variations of the brand name that AI engines might use. Lowercase.</p>
            <div className="flex gap-2">
              <input value={aliasInput} onChange={e => setAliasInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAlias()}
                className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                placeholder="e.g. bucate pe roate" />
              <button onClick={addAlias} className="px-4 py-2 rounded-lg bg-brand-500/20 text-brand-300 text-sm border border-brand-500/30 hover:bg-brand-500/30">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {aliases.map(a => (
                <span key={a} className="flex items-center gap-1 px-2 py-1 bg-dark-700 border border-dark-600 rounded-full text-xs text-slate-300">
                  {a}
                  <button onClick={() => setAliases(p => p.filter(x => x !== a))} className="text-slate-600 hover:text-red-400 ml-0.5">×</button>
                </span>
              ))}
              {aliases.length === 0 && <span className="text-xs text-slate-600 italic">No aliases added yet</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-2 rounded-lg bg-dark-700 text-slate-400 text-sm hover:bg-dark-600 transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-sm font-medium hover:bg-brand-500/30 transition-colors flex items-center justify-center gap-2">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Competitors ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Users size={18} className="text-brand-400" /> Known Competitors</h2>
            <p className="text-xs text-slate-500">Names the collector will look for in AI responses when your brand is not mentioned.</p>
            <div className="flex gap-2">
              <input value={competitorInput} onChange={e => setCompetitorInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCompetitor()}
                className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                placeholder="e.g. premier catering" />
              <button onClick={addCompetitor} className="px-4 py-2 rounded-lg bg-brand-500/20 text-brand-300 text-sm border border-brand-500/30 hover:bg-brand-500/30">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto min-h-[40px]">
              {competitors.map(c => (
                <span key={c} className="flex items-center gap-1 px-2 py-1 bg-dark-700 border border-dark-600 rounded-full text-xs text-slate-300">
                  {c}
                  <button onClick={() => setCompetitors(p => p.filter(x => x !== c))} className="text-slate-600 hover:text-red-400 ml-0.5">×</button>
                </span>
              ))}
              {competitors.length === 0 && <span className="text-xs text-slate-600 italic">No competitors added yet (optional)</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 py-2 rounded-lg bg-dark-700 text-slate-400 text-sm hover:bg-dark-600 transition-colors">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-sm font-medium hover:bg-brand-500/30 transition-colors flex items-center justify-center gap-2">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Login credentials ── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Lock size={18} className="text-brand-400" /> Client Login</h2>
            <p className="text-xs text-slate-500">These credentials will be used by the client to log in. They'll have viewer-only access.</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                placeholder="client@company.com" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Password *</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPass ? 'text' : 'password'}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 pr-16"
                  placeholder="Minimum 8 characters" />
                <button onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300">
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-dark-700/50 border border-dark-600 p-4 space-y-1.5 text-xs text-slate-400">
              <div><span className="text-slate-600">Company:</span> <span className="text-slate-300">{name}</span></div>
              <div><span className="text-slate-600">Website:</span> <span className="text-slate-300">{website || '—'}</span></div>
              <div><span className="text-slate-600">Aliases:</span> <span className="text-slate-300">{aliases.join(', ') || '—'}</span></div>
              <div><span className="text-slate-600">Competitors:</span> <span className="text-slate-300">{competitors.length} added</span></div>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setStep(3)} disabled={creating} className="flex-1 py-2 rounded-lg bg-dark-700 text-slate-400 text-sm hover:bg-dark-600 transition-colors disabled:opacity-40">Back</button>
              <button onClick={handleCreate} disabled={creating || !email || !password || password.length < 8}
                className="flex-1 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Client'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Collection in progress ── */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Zap size={18} className="text-brand-400" /> Running Initial Collection</h2>

            {progress ? (
              <>
                {!progress.finished ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Prompt {progress.done + 1} of {progress.total}</span>
                      <span>{Math.round((progress.done / progress.total) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 italic truncate">{progress.current}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 size={12} className="animate-spin text-brand-400" />
                      Querying 5 AI engines in parallel…
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-emerald-300">Collection complete!</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {progress.total} prompts × 5 engines collected.
                          {progress.errors > 0 && <span className="text-amber-400"> {progress.errors} errors (will retry next month).</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 bg-dark-700/50 rounded-lg p-3">
                      <div className="font-medium text-slate-400 mb-1">Client ready:</div>
                      <div>Email: <span className="text-slate-300">{email}</span></div>
                      <div>Client ID: <span className="text-slate-300">#{newClientId}</span></div>
                    </div>
                    <button onClick={() => navigate('/')} className="w-full py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-sm font-medium hover:bg-brand-500/30 transition-colors">
                      Go to Dashboard
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Setting up collection…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
