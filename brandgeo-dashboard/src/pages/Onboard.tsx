import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useClient } from '../lib/clientContext'
import { useCollection } from '../lib/collectionContext'
import { getActiveEngines, PLAN_ORDER, PLAN_LABELS, PLAN_PROMPTS, PLAN_LOCATION_LIMIT, type Plan } from '../lib/planConfig'
import { MARKETS } from '../lib/marketContext'
import type { Market } from '../lib/markets'
import { supabase } from '../lib/supabase'
import { CheckCircle2, ChevronRight, Loader2, Building2, Globe, Tag, Users, Mail, Zap, MessageSquarePlus, X } from 'lucide-react'
import { PageTitle } from '../components/Typography'
import { Combobox, MultiCombobox, Button, IconButton, type ComboboxOption } from '../components/ui'
import { buildMarketOptions, buildRegionOptions } from '../lib/marketOptions'
import { locationLabel } from '../lib/locations'
import { LocationFlag } from '../lib/locationsContext'
import PendingInvitesPanel from '../components/PendingInvitesPanel'

const MARKET_OPTIONS = buildMarketOptions(MARKETS)

type Step = 1 | 2 | 3 | 4 | 5 | 6

// One chosen location besides the primary. The server key is 'MARKET:REGION'.
type LocPair = { marketId: string; regionId: string }

// askIn: null means "every location the wizard has now", so a location added later
// is included without touching the prompts already typed. An array is an explicit
// choice made on that row. Keys are 'primary' or 'MARKET:REGION'.
type WizardPrompt = { text: string; askIn: string[] | null }

const PRIMARY_KEY = 'primary'
const pairKey = (marketId: string, regionId: string) => `${marketId}:${regionId}`

// copy: pending bg-copy (every string in this block)
const COPY = {
  primaryLegend: 'Primary location',
  country: 'Country',
  region: 'Region',
  primaryHelp: 'New prompts are asked from here unless you choose other locations.',
  otherLegend: 'Other locations (optional)',
  addAria: 'Add another location',
  addPlaceholder: 'Add a country',
  isPrimary: 'Primary',
  alreadyAdded: 'Added',
  otherEmpty: 'Only the primary location. Add more if this client sells in several places.',
  askNew: 'Ask new prompts in',
  askIn: 'Ask in',
  askInAria: 'Ask this prompt in',
  askEmpty: 'Pick at least one location',
  overWhy: 'Each location of a question uses one prompt.',
  override: 'Go over the plan limit for this client (admin, recorded)',
  summaryTitle: 'What will be created',
  errLocation: 'One of the locations is not valid. Check step 1.',
  errCap: 'Too many prompts for this plan. Remove some or tick the override.',
}

function swapKey(arr: string[] | null, from: string, to: string): string[] | null {
  if (arr === null || !arr.includes(from)) return arr
  const rest = arr.filter(k => k !== from)
  return rest.includes(to) ? rest : rest.concat(to)
}

export default function Onboard() {
  const { isAdmin, refreshClients } = useClient()
  const { collecting, progress: collectionProgress, runCollection } = useCollection()
  const navigate = useNavigate()

  // Form state
  const [step, setStep] = useState<Step>(1)
  const [name, setName]           = useState('')
  const [slug, setSlug]           = useState('')
  const [website, setWebsite]     = useState('')
  const [plan, setPlan]           = useState<Plan>('essentials')
  const [marketId, setMarketId]   = useState<string>('WW')
  const [regionId, setRegionId]   = useState<string>('ALL')
  const [aliasInput, setAliasInput]       = useState('')
  const [aliases, setAliases]             = useState<string[]>([])
  const [competitorInput, setCompetitorInput] = useState('')
  const [competitors, setCompetitors]     = useState<string[]>([])
  const [promptInput, setPromptInput]     = useState('')
  const [prompts, setPrompts]             = useState<WizardPrompt[]>([])
  const [extras, setExtras]               = useState<LocPair[]>([])
  const [adding, setAdding]               = useState<string | null>(null)
  const [addRegions, setAddRegions]       = useState<string[]>([])
  const [askNew, setAskNew]               = useState<string[] | null>(null)
  const [overrideCap, setOverrideCap]     = useState(false)
  const [live, setLive]                   = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const refocus = useRef(false)
  const [email, setEmail]         = useState('')
  const [role, setRole]           = useState<'admin' | 'viewer'>('viewer')
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [newClientId, setNewClientId] = useState<number | null>(null)
  const [collectionRunning, setCollectionRunning] = useState(false)
  const [lastTotal, setLastTotal] = useState<number | null>(null)

  // Live slug-availability check (debounced) — surfaces a duplicate slug
  // on step 1 instead of only at the final submit on step 5.
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  useEffect(() => {
    if (!slug) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    const t = setTimeout(async () => {
      const { data } = await supabase.from('clients').select('id').eq('slug', slug).maybeSingle()
      setSlugStatus(data ? 'taken' : 'available')
    }, 400)
    return () => clearTimeout(t)
  }, [slug])

  // Resend-invite state (step 6, in case the first email was missed/spam-filtered)
  const [resending, setResending]           = useState(false)
  const [resendMessage, setResendMessage]   = useState<string | null>(null)
  const [resendError, setResendError]       = useState<string | null>(null)

  const handleResendInvite = async () => {
    setResending(true); setResendMessage(null); setResendError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/resend-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Resend failed')
      setResendMessage(`Invite re-sent to ${email}.`)
    } catch (err: unknown) {
      setResendError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setResending(false)
    }
  }

  // Snapshot the last known prompt count while collectionContext's progress
  // is live — it resets to null when the run finishes, so this is what the
  // "Collection complete!" card reads after the fact.
  useEffect(() => {
    if (collectionProgress) setLastTotal(collectionProgress.total)
  }, [collectionProgress])

  // ── Locations and prompt rows (derived) ─────────────────────────────────

  const primaryPairKey = pairKey(marketId, regionId)
  const extraKeys = extras.map(p => pairKey(p.marketId, p.regionId))
  const takenKeys = new Set<string>([primaryPairKey, ...extraKeys])
  const isMultiWizard = extras.length > 0
  const allKeys = [PRIMARY_KEY, ...extraKeys]
  const locationCount = allKeys.length
  const locationLimit = PLAN_LOCATION_LIMIT[plan]
  const locationsOver = locationCount > locationLimit

  const locationOptions: ComboboxOption[] = [
    {
      value: PRIMARY_KEY,
      label: `${locationLabel({ market_id: marketId, region_id: regionId })} (primary)`,
      icon: <LocationFlag marketId={marketId} size={16} />,
    },
    ...extras.map(p => ({
      value: pairKey(p.marketId, p.regionId),
      label: locationLabel({ market_id: p.marketId, region_id: p.regionId }),
      icon: <LocationFlag marketId={p.marketId} size={16} />,
    })),
  ]
  const keyLabel = (k: string): string => locationOptions.find(o => o.value === k)?.label ?? k

  const askEffective = (p: WizardPrompt): string[] =>
    p.askIn === null ? allKeys : p.askIn.filter(k => allKeys.includes(k))

  const promptRows = isMultiWizard
    ? prompts.reduce((n, p) => n + askEffective(p).length, 0)
    : prompts.length
  const promptCap = PLAN_PROMPTS[plan]
  // The server counts rows for both prompt shapes, so the cap applies to both.
  const overCap = promptRows > promptCap
  const anyAskEmpty = isMultiWizard && prompts.some(p => askEffective(p).length === 0)
  const askNewEffective: string[] = askNew === null ? allKeys : askNew.filter(k => allKeys.includes(k))

  // Getting back under the cap clears the override, so it cannot stay ticked unseen.
  useEffect(() => {
    if (!overCap && overrideCap) setOverrideCap(false)
  }, [overCap, overrideCap])

  // After a submit error sends the admin back a step, put focus on that step's heading.
  useEffect(() => {
    if (refocus.current) {
      refocus.current = false
      headingRef.current?.focus()
    }
  }, [step])

  if (!isAdmin) return (
    <div className="p-8 text-slate-500 text-sm">
      Access restricted to admins.{' '}
      <Link to="/" className="text-brand-400 hover:text-brand-300 font-medium">Back to Dashboard</Link>
    </div>
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

  const addPrompt = () => {
    const v = promptInput.trim()
    if (v && !prompts.some(p => p.text === v)) {
      setPrompts(prev => [...prev, { text: v, askIn: askNew === null ? null : askNew.slice() }])
    }
    setPromptInput('')
  }

  const autoSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const selectedMarket = MARKETS.find(m => m.id === marketId) ?? MARKETS[0]

  // The primary changes. A listed pair equal to the new primary leaves the list
  // (the server dedupes the same way), and prompts that named it now name 'primary'.
  const applyPrimary = (nextMarketId: string, nextRegionId: string) => {
    const nextKey = pairKey(nextMarketId, nextRegionId)
    setMarketId(nextMarketId)
    setRegionId(nextRegionId)
    if (extras.some(p => pairKey(p.marketId, p.regionId) === nextKey)) {
      setExtras(prev => prev.filter(p => pairKey(p.marketId, p.regionId) !== nextKey))
      setPrompts(prev => prev.map(p => ({ ...p, askIn: swapKey(p.askIn, nextKey, PRIMARY_KEY) })))
      setAskNew(prev => swapKey(prev, nextKey, PRIMARY_KEY))
      setLive(`${locationLabel({ market_id: nextMarketId, region_id: nextRegionId })} is the primary now, so it left the other locations`)
    }
  }

  const handleMarketChange = (id: string) => {
    const mkt = MARKETS.find(m => m.id === id) ?? MARKETS[0]
    applyPrimary(id, mkt.regions[0]?.id ?? 'ALL')
  }

  // ── Other locations ──────────────────────────────────────────────────────

  const addPairs = (mId: string, regionIds: string[]) => {
    const fresh = regionIds.filter(r => !takenKeys.has(pairKey(mId, r)))
    if (fresh.length === 0) return
    setExtras(prev => prev.concat(fresh.map(r => ({ marketId: mId, regionId: r }))))
    setLive(`Added ${fresh.map(r => locationLabel({ market_id: mId, region_id: r })).join(', ')}`)
  }

  const pickMarket = (id: string) => {
    const mkt = MARKETS.find(m => m.id === id)
    if (!mkt) return
    if (mkt.regions.length <= 1) {
      addPairs(id, [mkt.regions[0]?.id ?? 'ALL'])
      return
    }
    setAdding(id)
    setAddRegions(takenKeys.has(pairKey(id, 'ALL')) ? [] : ['ALL'])
  }

  const confirmAdd = () => {
    if (adding) addPairs(adding, addRegions)
    setAdding(null)
    setAddRegions([])
  }

  const cancelAdd = () => {
    setAdding(null)
    setAddRegions([])
  }

  const removeExtra = (idx: number) => {
    const gone = extras[idx]
    if (!gone) return
    const key = pairKey(gone.marketId, gone.regionId)
    const label = locationLabel({ market_id: gone.marketId, region_id: gone.regionId })
    // Prompts whose only location was this one fall back to the primary.
    const moved = prompts.filter(p => p.askIn !== null && p.askIn.includes(key) && p.askIn.filter(k => k !== key).length === 0).length
    setExtras(prev => prev.filter((_, i) => i !== idx))
    setPrompts(prev => prev.map(p => {
      if (p.askIn === null || !p.askIn.includes(key)) return p
      const rest = p.askIn.filter(k => k !== key)
      return { ...p, askIn: rest.length === 0 ? [PRIMARY_KEY] : rest }
    }))
    setAskNew(prev => {
      if (prev === null || !prev.includes(key)) return prev
      const rest = prev.filter(k => k !== key)
      return rest.length === 0 ? [PRIMARY_KEY] : rest
    })
    setLive(moved > 0
      ? `Removed ${label}. ${moved === 1 ? '1 prompt moved' : `${moved} prompts moved`} to the primary location`
      : `Removed ${label}`)
  }

  // Extra locations grouped by market, in the order they were added.
  const locationsPayload = (): { market_id: string; region_ids: string[] }[] => {
    const out: { market_id: string; region_ids: string[] }[] = []
    for (const p of extras) {
      const found = out.find(o => o.market_id === p.marketId)
      if (found) found.region_ids.push(p.regionId)
      else out.push({ market_id: p.marketId, region_ids: [p.regionId] })
    }
    return out
  }

  const addingMarket: Market | undefined = adding ? MARKETS.find(m => m.id === adding) : undefined
  const marketFullyTaken = (m: Market) => m.regions.length > 0 && m.regions.every(r => takenKeys.has(pairKey(m.id, r.id)))
  const pickerOptions = buildMarketOptions(MARKETS.filter(m => !marketFullyTaken(m)))

  // Regions of a market that cannot be picked again, with the reason shown in the option.
  const regionReasons = (m: Market): Record<string, string> => {
    const out: Record<string, string> = {}
    for (const r of m.regions) {
      const k = pairKey(m.id, r.id)
      if (k === primaryPairKey) out[r.id] = COPY.isPrimary
      else if (extraKeys.includes(k)) out[r.id] = COPY.alreadyAdded
    }
    return out
  }

  const goBackTo =(s: Step) => { refocus.current = true; setStep(s) }

  // ── Step 5: Create client + user + initial prompts ───────────────────────

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
          brand_website:      website,
          brand_aliases:      aliases,
          known_competitors:  competitors,
          plan,
          default_market_id:  marketId,
          default_region_id:  regionId,
          contact_email:      email,
          role,
          // One location: prompts stay a plain list of strings, as before. Several:
          // each prompt names where it is asked, 'primary' or 'MARKET:REGION'.
          prompts: isMultiWizard
            ? prompts.map(p => ({ text: p.text, location_keys: askEffective(p) }))
            : prompts.map(p => p.text),
          ...(isMultiWizard ? { locations: locationsPayload() } : {}),
          ...(overCap && overrideCap ? { allow_over_cap: true } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'invalid_location') { setError(COPY.errLocation); goBackTo(1); return }
        if (data.code === 'prompt_cap_exceeded') { setError(COPY.errCap); goBackTo(4); return }
        throw new Error(data.error ?? 'Onboarding failed')
      }
      setNewClientId(data.client_id)
      setStep(6)

      // Pull the new client into the switcher and make it active. Without this
      // the row exists in Supabase but is invisible for the rest of the tab's
      // life: ClientProvider loads its list once per mount, this page finishes
      // with navigate('/') which does not remount it, and patchClient can only
      // update a row already loaded. Found 2026-08-02, client 52.
      // Deliberately NOT awaited: the wizard's step 6 does not depend on it,
      // and OnboardGate's settledOnce guard means the `loading` flip it causes
      // cannot unmount this page mid-collection.
      refreshClients(data.client_id)

      // Fire the same 3-parallel-function collection every other page uses
      // (collectionContext.tsx), gated to this client's actual plan — not
      // the hand-rolled, collect-prompt-only loop this page used to run.
      const engines = getActiveEngines(data.plan ?? plan, data.engines_enabled ?? null)
      setCollectionRunning(true)
      runCollection(data.client_id, true, undefined, engines).finally(() => setCollectionRunning(false))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCreating(false)
    }
  }

  // ── Step indicators ───────────────────────────────────────────────────────

  const steps = [
    { n: 1, label: 'Company',     icon: Building2 },
    { n: 2, label: 'Brand',       icon: Tag },
    { n: 3, label: 'Competitors', icon: Users },
    { n: 4, label: 'Prompts',     icon: MessageSquarePlus },
    { n: 5, label: 'Invite',      icon: Mail },
    { n: 6, label: 'Collecting',  icon: Zap },
  ]

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <PageTitle className="mb-1">Onboard New Client</PageTitle>
        <p className="text-sm text-slate-400">Set up a new client account with AI monitoring in minutes.</p>
      </div>

      {/* Step bar. flex-wrap is load-bearing: six pills plus five separators are
          wider than <main> between 768 and about 810px, where the sidebar has
          appeared but the viewport has not caught up, and the row overflowed the
          scroll container by 197px. Nobody had seen it because this route is
          admin-only and never renders under demo. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-8">
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
              {/* Decorative step separator. text-slate-700 has no dark-mode remap in
                  index.css, so it rendered at 1.84:1 on the page in dark, against a
                  3:1 floor for a non-text indicator. */}
              {idx < steps.length - 1 && <ChevronRight size={12} className="text-slate-500 shrink-0" aria-hidden="true" />}
            </div>
          )
        })}
      </div>

      {/* rounded-xl (12px), not rounded-2xl (16px) — the only 16px radius left in
          the app (dashboard-visual-system.md A8/F-20); every other card uses the
          same --card-radius value. */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">

        {/* ── Step 1: Company info ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-white flex items-center gap-2 focus:outline-none"><Building2 size={18} className="text-brand-400" /> Company Info</h2>
            <p className="sr-only" aria-live="polite">{live}</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company name *</label>
              <input value={name} onChange={e => { setName(e.target.value); setSlug(autoSlug(e.target.value)) }}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                placeholder="Bucate pe Roate" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Slug (URL key) *</label>
              <input value={slug} onChange={e => setSlug(e.target.value)}
                className={`w-full bg-dark-700 border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none font-mono ${
                  slugStatus === 'taken' ? 'border-red-500/50' : 'border-dark-600 focus:border-brand-500/50'
                }`}
                placeholder="bucate-pe-roate" />
              {slugStatus === 'checking' && <p className="text-xs text-slate-500 mt-1">Checking availability…</p>}
              {slugStatus === 'available' && <p className="text-xs text-emerald-400 mt-1">✓ Available</p>}
              {slugStatus === 'taken' && <p className="text-xs text-red-400 mt-1">✗ Already taken by another client. Choose a different slug.</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1"><Globe size={11} /> Website domain</label>
              <input value={website} onChange={e => setWebsite(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                placeholder="bucateperoate.ro" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Plan *</label>
              <select value={plan} onChange={e => setPlan(e.target.value as Plan)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50">
                {PLAN_ORDER.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
              </select>
            </div>

            <fieldset className="min-w-0">
              <legend className="text-meta text-ink-2 mb-1">{COPY.primaryLegend}</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="onboard-market" className="block text-meta text-ink-2 mb-1">{COPY.country}</label>
                  <Combobox id="onboard-market" options={MARKET_OPTIONS} value={marketId} onChange={handleMarketChange}
                    ariaLabel="Default market" placeholder="Type to search markets" />
                </div>
                <div>
                  <label htmlFor="onboard-region" className="block text-meta text-ink-2 mb-1">{COPY.region}</label>
                  <Combobox id="onboard-region" options={buildRegionOptions(selectedMarket)} value={regionId} onChange={id => applyPrimary(marketId, id)}
                    ariaLabel="Default region" placeholder="Type to search regions" />
                </div>
              </div>
              <p className="text-meta text-ink-3 mt-2">{COPY.primaryHelp}</p>
            </fieldset>

            <fieldset className="min-w-0 space-y-2">
              <legend className="text-meta text-ink-2 mb-1">{COPY.otherLegend}</legend>
              <Combobox id="onboard-add-location" options={pickerOptions} value={null} onChange={pickMarket}
                ariaLabel={COPY.addAria} placeholder={COPY.addPlaceholder} clearOnSelect />

              {addingMarket && (
                <div className="rounded-control border border-line p-3 space-y-2">
                  <p className="text-meta text-ink-2">Regions of {addingMarket.label}</p>
                  <MultiCombobox size="md" ariaLabel={`Regions of ${addingMarket.label}`}
                    options={buildRegionOptions(addingMarket)} values={addRegions} onChange={setAddRegions}
                    exclusiveValue="ALL" maxSelected={25} placeholder="Type to search regions"
                    disabledReasons={regionReasons(addingMarket)} />
                  <div className="flex items-center gap-2">
                    <Button variant="primary" size="sm" disabled={addRegions.length === 0} onClick={confirmAdd}>Add</Button>
                    <Button variant="ghost" size="sm" onClick={cancelAdd}>Cancel</Button>
                  </div>
                </div>
              )}

              {extras.length > 0 ? (
                <ul role="list" aria-label="Other locations" className="space-y-1.5">
                  {extras.map((p, idx) => {
                    const label = locationLabel({ market_id: p.marketId, region_id: p.regionId })
                    return (
                      <li key={pairKey(p.marketId, p.regionId)} className="flex items-center gap-2 h-10 px-3 rounded-control bg-surface-2 border border-line">
                        <LocationFlag marketId={p.marketId} size={16} />
                        <span className="flex-1 truncate text-body text-ink">{label}</span>
                        <IconButton icon={X} label={`Remove ${label}`} onClick={() => removeExtra(idx)} />
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-meta text-ink-3">{COPY.otherEmpty}</p>
              )}

              <p className={`text-meta tabular-nums ${locationsOver ? 'text-warn' : 'text-ink-2'}`}>
                {locationsOver
                  ? `${locationCount} locations, above the ${locationLimit} on ${PLAN_LABELS[plan]}. Allowed because you are an admin; it is recorded.`
                  : `${locationCount} of ${locationLimit} locations on ${PLAN_LABELS[plan]}`}
              </p>
            </fieldset>
            <p className="text-xs text-slate-500">
              Plan controls which AI engines collect for this client.
            </p>
            {error && <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            <button disabled={!name || !slug || slugStatus === 'taken' || slugStatus === 'checking'}
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

        {/* ── Step 4: Initial Prompts ── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-white flex items-center gap-2 focus:outline-none"><MessageSquarePlus size={18} className="text-brand-400" /> Initial Prompts</h2>
            {error && <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            <p className="text-xs text-slate-500">
              Real questions a customer might ask an AI assistant when looking for a business like this one.
              These are what get sent to each AI engine every month. At least one is required, since without
              it there's nothing for the collection step to run.
            </p>
            <div className="flex gap-2">
              <input value={promptInput} onChange={e => setPromptInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPrompt()}
                className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                placeholder="e.g. Best catering companies in Bucharest" />
              <button onClick={addPrompt} className="px-4 py-2 rounded-lg bg-brand-500/20 text-brand-300 text-sm border border-brand-500/30 hover:bg-brand-500/30">Add</button>
            </div>
            {isMultiWizard && (
              <div className="flex items-center gap-2">
                <span className="text-meta text-ink-2 shrink-0">{COPY.askNew}</span>
                <MultiCombobox size="sm" className="flex-1 min-w-0" ariaLabel={COPY.askNew}
                  options={locationOptions} values={askNewEffective} onChange={setAskNew} />
              </div>
            )}
            {isMultiWizard ? (
              <ul role="list" className="space-y-2 max-h-96 overflow-y-auto min-h-[40px]">
                {prompts.map((p, idx) => {
                  const eff = askEffective(p)
                  return (
                    <li key={p.text} className="rounded-control border border-line bg-surface-2 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-meta text-ink-3 tabular-nums">{idx + 1}.</span>
                        <span className="text-body text-ink flex-1 min-w-0 break-words">{p.text}</span>
                        <IconButton icon={X} label={`Remove prompt: ${p.text.slice(0, 40)}`}
                          onClick={() => setPrompts(prev => prev.filter(x => x.text !== p.text))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-meta text-ink-2 shrink-0">{COPY.askIn}</span>
                        <MultiCombobox size="sm" className="flex-1 min-w-0" ariaLabel={COPY.askInAria}
                          options={locationOptions} values={eff}
                          invalid={eff.length === 0}
                          describedBy={eff.length === 0 ? `onboard-ask-empty-${idx}` : undefined}
                          onChange={v => setPrompts(prev => prev.map(x => x.text === p.text ? { ...x, askIn: v } : x))} />
                      </div>
                      {eff.length === 0 && <p id={`onboard-ask-empty-${idx}`} role="alert" className="text-meta text-neg">{COPY.askEmpty}</p>}
                    </li>
                  )
                })}
                {prompts.length === 0 && <li className="text-meta text-ink-3 italic">No prompts added yet. At least one is required.</li>}
              </ul>
            ) : (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto min-h-[40px]">
                {prompts.map(p => (
                  <span key={p.text} className="flex items-center justify-between gap-2 px-3 py-1.5 bg-dark-700 border border-dark-600 rounded-lg text-xs text-slate-300">
                    <span className="truncate">{p.text}</span>
                    <button onClick={() => setPrompts(prev => prev.filter(x => x.text !== p.text))} className="text-slate-600 hover:text-red-400 shrink-0 ml-2">×</button>
                  </span>
                ))}
                {prompts.length === 0 && <span className="text-xs text-slate-600 italic">No prompts added yet. At least one is required.</span>}
              </div>
            )}
            {(isMultiWizard || overCap) && (
              <div className="space-y-2">
                <p aria-live="polite" className={`text-meta tabular-nums ${overCap ? 'text-neg' : 'text-ink-2'}`}>
                  {isMultiWizard
                    ? `${promptRows} prompts of ${promptCap} on ${PLAN_LABELS[plan]}. ${Math.floor(promptCap / locationCount)} questions fit in all ${locationCount} locations.`
                    : `${promptRows} prompts of ${promptCap} on ${PLAN_LABELS[plan]}.`}
                </p>
                {overCap && (
                  <>
                    {isMultiWizard && <p className="text-meta text-neg">{COPY.overWhy}</p>}
                    <label className="flex items-start gap-2 text-meta text-ink-2 max-md:min-h-[44px]">
                      <input type="checkbox" checked={overrideCap} onChange={e => setOverrideCap(e.target.checked)}
                        className="h-4 w-4 mt-0.5 accent-[rgb(var(--accent-strong))]" />
                      <span>{COPY.override}</span>
                    </label>
                  </>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="flex-1 py-2 rounded-lg bg-dark-700 text-slate-400 text-sm hover:bg-dark-600 transition-colors">Back</button>
              <button disabled={prompts.length === 0 || anyAskEmpty || (overCap && !overrideCap)}
                onClick={() => setStep(5)}
                className="flex-1 py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-sm font-medium hover:bg-brand-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Client invite ──
             No password field — onboard-client.js now uses Supabase's
             auth.admin.inviteUserByEmail, which emails the client a link to
             /reset-password to set their own password. The admin never
             sees or relays a password (task, 2026-07-09). */}
        {step === 5 && (
          <div className="space-y-4">
            {isMultiWizard && (
              <section aria-labelledby="onboard-summary-title" className="space-y-2">
                <h3 id="onboard-summary-title" className="text-heading text-ink">{COPY.summaryTitle}</h3>
                <ul role="list" className="max-h-48 overflow-y-auto space-y-1">
                  {allKeys.map(k => {
                    const mId = k === PRIMARY_KEY ? marketId : k.split(':')[0]
                    const n = prompts.filter(p => askEffective(p).includes(k)).length
                    return (
                      <li key={k} className="flex items-center gap-2 text-body text-ink-2">
                        <LocationFlag marketId={mId} size={16} />
                        <span className="truncate">{keyLabel(k)}</span>
                        <span className="ml-auto text-meta text-ink-3 tabular-nums">{n === 1 ? '1 prompt' : `${n} prompts`}</span>
                      </li>
                    )
                  })}
                </ul>
                <p className="text-meta text-ink-3">{`${promptRows} prompt rows in total.`}</p>
              </section>
            )}
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Mail size={18} className="text-brand-400" /> Client Invite</h2>
            {/* copy: pending bg-copy. C-O1: a viewer gets the 7 day BrandGEO link, an
                admin login stays on the Supabase invite (24 hours). */}
            <p className="text-xs text-slate-500">
              {`We will email this address an invite link, valid for ${role === 'viewer' ? '7 days' : '24 hours'}, to set their own password and log in.`}
            </p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                placeholder="client@company.com" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Access level</label>
              <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'viewer')}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50">
                <option value="viewer">Viewer: sees only this client's data</option>
                <option value="admin">Admin: full access to every client</option>
              </select>
              {role === 'admin' && (
                <p className="text-xs text-amber-400 mt-1">
                  Admin access lets this person view and manage every client, not just {name || 'this one'}. Use sparingly.
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-dark-700/50 border border-dark-600 p-4 space-y-1.5 text-xs text-slate-400">
              <div><span className="text-slate-600">Company:</span> <span className="text-slate-300">{name}</span></div>
              <div><span className="text-slate-600">Website:</span> {website
                ? <span className="text-slate-300">{website}</span>
                : <span className="text-slate-300 italic">Not set</span>}</div>
              <div><span className="text-slate-600">Plan:</span> <span className="text-slate-300">{PLAN_LABELS[plan]}</span></div>
              <div><span className="text-slate-600">Access:</span> <span className="text-slate-300">{role === 'admin' ? 'Admin' : 'Viewer'}</span></div>
              <div><span className="text-slate-600">Market:</span> <span className="text-slate-300">{selectedMarket.regions.find(r => r.id === regionId)?.label ?? regionId}, {selectedMarket.label}</span></div>
              <div><span className="text-slate-600">Aliases:</span> {aliases.length > 0
                ? <span className="text-slate-300">{aliases.join(', ')}</span>
                : <span className="text-slate-300 italic">None added</span>}</div>
              <div><span className="text-slate-600">Competitors:</span> <span className="text-slate-300">{competitors.length} added</span></div>
              <div><span className="text-slate-600">Prompts:</span> <span className="text-slate-300">{prompts.length} added</span></div>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button onClick={() => setStep(4)} disabled={creating} className="flex-1 py-2 rounded-lg bg-dark-700 text-slate-400 text-sm hover:bg-dark-600 transition-colors disabled:opacity-40">Back</button>
              <button onClick={handleCreate} disabled={creating || !email}
                className="flex-1 py-2 rounded-lg bg-accent-strong text-on-accent text-sm font-semibold hover:bg-accent-strong-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Client & Send Invite'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 6: Collection in progress ──
             Uses collectionContext.tsx's shared runCollection/progress/collecting
             state — same code path AIVisibility.tsx's Force Refresh uses — instead
             of a separate hand-rolled loop, so Claude/ChatGPT and plan-based engine
             gating are no longer silently skipped (task #73 fix, 2026-07-08). */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Zap size={18} className="text-brand-400" /> Running Initial Collection</h2>

            {collectionRunning || collecting ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Prompt {(collectionProgress?.done ?? 0) + 1} of {collectionProgress?.total ?? promptRows}</span>
                  <span>{Math.round(((collectionProgress?.done ?? 0) / (collectionProgress?.total || promptRows)) * 100)}%</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${((collectionProgress?.done ?? 0) / (collectionProgress?.total || promptRows)) * 100}%` }} />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={12} className="animate-spin text-brand-400" />
                  Querying your active AI engines in parallel…
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-300">Collection complete!</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {lastTotal ?? promptRows} prompt{(lastTotal ?? promptRows) === 1 ? '' : 's'} collected across this client's active engines.
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 bg-dark-700/50 rounded-lg p-3">
                  <div className="font-medium text-slate-400 mb-1">Client ready:</div>
                  <div>Email: <span className="text-slate-300">{email}</span></div>
                  <div>Client ID: <span className="text-slate-300">#{newClientId}</span></div>
                </div>

                {/* Resend invite: an invite link lasts 24 hours on the Supabase channel (admin
                    logins) and 7 days on the BrandGEO channel (viewer logins); covers a missed
                    or spam-filtered first email without needing the Supabase
                    Dashboard (task, 2026-07-09). */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">Didn't receive the invite email?</span>
                  <button onClick={handleResendInvite} disabled={resending}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 text-slate-300 hover:bg-dark-600 transition-colors disabled:opacity-50">
                    {resending ? <><Loader2 size={12} className="animate-spin" /> Resending…</> : 'Resend invite'}
                  </button>
                </div>
                {resendMessage && <p className="text-xs text-emerald-400">{resendMessage}</p>}
                {resendError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{resendError}</p>}

                <button onClick={() => navigate('/')} className="w-full py-2 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-sm font-medium hover:bg-brand-500/30 transition-colors">
                  Go to Dashboard
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Every invited account that has not accepted yet, across all clients.
          Reloads when the wizard creates a client. Sits behind the isAdmin
          early return above, so a viewer never reaches it. */}
      <PendingInvitesPanel refreshKey={newClientId} />
    </div>
  )
}
