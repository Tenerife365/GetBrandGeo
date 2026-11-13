import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Archive, Check, X, Bot, Send, PlusCircle, Lock, MessageSquare } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { mockPrompts } from '../lib/mockData'
import type { Prompt } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'
import { categorizePrompt, promptCategoryLabel } from '../lib/promptCategories'
import RouteSkeleton from '../components/RouteSkeleton'
import AllowanceMeter from '../components/AllowanceMeter'
import EmptyState from '../components/EmptyState'
import { Page, PageHeader, Button, IconButton, Badge, Chip, ChipGroup, Notice, Card, DataList, MultiCombobox } from '../components/ui'
import type { ComboboxOption } from '../components/ui'
import { removalMode, removalVerb, removalConfirm, removalFailure, removalWrite } from '../lib/promptRemoval'
import { PLAN_PROMPTS, PLAN_LABELS, type Plan } from '../lib/planConfig'
import { useLocations, LocationFlag, LOCATION_CHIP_MAX } from '../lib/locationsContext'
import { locationLabel, filterPromptsByLocation, promptLocationId, promptCountLabel } from '../lib/locations'

// Category is a grouping, not an alert: one quiet neutral Badge everywhere, and
// the label comes from the shared general taxonomy (lib/promptCategories.ts).

function buildSystemPrompt(name?: string, website?: string) {
  const brandLine = name    ? `Business: ${name}`       : ''
  const siteLine  = website ? `Website: ${website}` : ''
  return `You are an AI visibility monitoring expert. Your task: generate prompts (search queries) that real users type into AI assistants — ChatGPT, Perplexity, Gemini, Claude — when looking for products or services.

${brandLine}
${siteLine}

Rules:
1. Generate 8-12 prompts that sound like natural human searches, NOT marketing copy.
2. Write in the language the business operates in (detect from brand name / website).
3. Match the REAL scale and niche of this business — do NOT generate queries about Fortune 500 competitors unless this is that kind of business.
4. Cover multiple angles: discovery ("best X in Y city"), comparison ("X vs alternatives"), use-case ("X for [scenario]"), local/geographic, price/value.
5. Assign a category to each prompt:
   - "general"    → discovery, recommendations, brand lookups
   - "local"      → city/region/neighborhood-specific searches
   - "comparison" → vs competitors, alternatives, ranking queries
   - "use_case"   → specific scenarios, occasions, industries

Respond with ONLY a valid JSON array — no markdown, no extra text:
[
  { "text": "prompt text here", "category": "general" },
  ...
]`
}

interface SuggestedPrompt {
  text: string
  added?: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function Prompts() {
  const { activeClientId, activeClient, isAdmin } = useClient()
  const brandName = activeClient?.name
  const { t } = useI18n()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  // Cap is read from the DB (plan_prompt_caps) rather than from PLAN_PROMPTS,
  // so the number shown here is the number the trigger actually enforces. The
  // planConfig value is only a fallback for demo mode and for the moment before
  // the fetch resolves. See db/supabase-prompt-cap-migration.sql.
  const [cap, setCap] = useState<number | null>(null)
  const [capError, setCapError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [editId, setEditId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [saving, setSaving] = useState(false)

  // Multi-location: one country per prompt. The view filter is the global one
  // from useLocations (no second, local filter on this page).
  const { locations, primary, isMulti, selected, setSelected, refresh } = useLocations()
  const [askIn, setAskIn] = useState<string[]>([])
  const [discoverAskIn, setDiscoverAskIn] = useState<string[]>([])
  const [announce, setAnnounce] = useState('')

  const [showDiscover, setShowDiscover] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! Describe your business and I'll generate the best AI monitoring prompts for you. For example: \"We're a project-management SaaS for small teams\" or \"We run a boutique law firm in Berlin.\""
    }
  ])
  const [userInput, setUserInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestedPrompt[]>([])
  const [clientConfig, setClientConfig] = useState<{ name: string; brand_website: string } | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load client config and auto-generate prompts when AI Discover opens
  useEffect(() => {
    if (!showDiscover || isDemoMode) return
    supabase
      .from('clients')
      .select('name, brand_website')
      .eq('id', activeClientId)
      .single()
      .then(({ data }) => {
        if (!data) return
        setClientConfig(data)
        // Auto-trigger prompt generation using the client website
        const autoMsg = data.brand_website
          ? `Analyze this business and generate monitoring prompts: ${data.name}, website: ${data.brand_website}`
          : `Generate monitoring prompts for: ${data.name}`
        // Use a short delay so the panel renders first
        setTimeout(() => {
          const newMessages: ChatMessage[] = [
            { role: 'assistant', content: `Hi! I can see this is for **${data.name}**. Let me generate the best monitoring prompts now…` },
            { role: 'user', content: autoMsg },
          ]
          setChatMessages(newMessages)
          autoGeneratePrompts(newMessages, data.name, data.brand_website)
        }, 300)
      })
  }, [showDiscover, activeClientId])

  const autoGeneratePrompts = async (messages: ChatMessage[], name: string, website: string) => {
    setAiLoading(true)
    setSuggestions([])
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/suggest-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: buildSystemPrompt(name, website) },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 1500,
        }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? ''
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed: SuggestedPrompt[] = JSON.parse(jsonMatch[0])
        setDiscoverAskIn(defaultAskIn())
        setSuggestions(parsed.map(p => ({
          text: p.text,
          added: prompts.some(existing => existing.text === p.text),
        })))
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `Here are ${parsed.length} prompts tailored for ${name}. Add individually or click "Add all".`
        }])
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Could not generate prompts. Please describe your business below.' }])
    }
    setAiLoading(false)
  }

  const load = async () => {
    if (isDemoMode) {
      setPrompts(mockPrompts)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('prompts')
      .select('*')
      .eq('client_id', activeClientId)
      .eq('is_active', true)
      .order('position', { ascending: true })
    if (data) setPrompts(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [activeClientId])

  // Plan prompt cap. Falls back to PLAN_PROMPTS if the table is not there yet
  // (the migration is applied separately), so this page never breaks on a
  // missing table — it just stops showing a cap.
  useEffect(() => {
    const plan = (activeClient?.plan ?? 'free') as Plan
    // Demo mode has no plan, so there is no cap to show (never "N of 5 on Free").
    if (isDemoMode) { setCap(null); return }
    supabase
      .from('plan_prompt_caps')
      .select('prompt_cap')
      .eq('plan', plan)
      .maybeSingle()
      .then(({ data }) => setCap(data?.prompt_cap ?? PLAN_PROMPTS[plan] ?? null))
  }, [activeClient?.plan])

  // Only ACTIVE prompts consume the allowance — same rule the DB trigger uses.
  // `prompts` is already filtered to is_active in load().
  const used = prompts.length
  const atCap = cap !== null && used >= cap
  // Admins may deliberately exceed a customer's cap (the trigger lets them
  // through too). isAdmin is false while an admin is viewing-as-customer, which
  // is correct: that mode exists to show what the customer sees.
  const capBlocks = atCap && !isAdmin
  const verb = removalVerb(removalMode(isAdmin))
  const remaining = cap === null ? Infinity : Math.max(0, cap - used)
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, suggestions])

  // ── Locations ───────────────────────────────────────────────────────────────
  const primaryId = primary?.id ?? null
  const locationById = new Map(locations.map(l => [l.id, l] as const))
  const locationOptions: ComboboxOption[] = locations.map(l => ({
    value: String(l.id),
    label: locationLabel(l),
    keywords: [l.market_id],
    icon: <LocationFlag marketId={l.market_id} size={16} />,
  }))
  const liveIds = new Set(locations.map(l => String(l.id)))
  const askInValid = askIn.filter(v => liveIds.has(v))
  const discoverAskInValid = discoverAskIn.filter(v => liveIds.has(v))
  const discoverNeedsLocation = isMulti && discoverAskInValid.length === 0
  // A viewer cannot pick more locations than the plan has prompts left.
  const limitK = !isAdmin && Number.isFinite(remaining) ? remaining : undefined
  const defaultAskIn = (): string[] => {
    const base = selected.size > 0
      ? locations.filter(l => selected.has(l.id)).map(l => String(l.id))
      : primary ? [String(primary.id)] : []
    return limitK !== undefined ? base.slice(0, limitK) : base
  }
  const openAdd = () => { setAskIn(defaultAskIn()); setShowAdd(true) }
  const toggleLocationFilter = (id: number) => {
    if (selected.size === 0) { setSelected([id]); return }
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }
  const countAt = (id: number) => prompts.filter(p => promptLocationId(p, primaryId) === id).length
  const selectedLocations = locations.filter(l => selected.has(l.id))

  const locFiltered = filterPromptsByLocation(prompts, selected, primaryId)
  const catPresent = filterCat === 'all' || locFiltered.some(p => p.category === filterCat)
  const activeCat = catPresent ? filterCat : 'all'
  const filtered = activeCat === 'all' ? locFiltered : locFiltered.filter(p => p.category === activeCat)

  const startEdit = (p: Prompt) => { setEditId(p.id); setEditText(p.text) }

  // One place that shows a notice and one that clears it.
  const showNotice = (message: string) => setCapError(message)
  const clearNotice = () => setCapError(null)

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true)
    const cat = categorizePrompt(editText, brandName)   // re-categorise from the edited text
    if (!isDemoMode) {
      const { error } = await supabase.from('prompts').update({ text: editText, category: cat }).eq('id', editId)
      if (error) {
        // Local state and the open editor are both left exactly as they
        // were, so a failed save never overwrites the saved text with the
        // edited draft the database actually rejected. The raw driver error
        // goes to the console, never to the customer.
        console.error('[Prompts] saveEdit failed', error)
        showNotice('Could not save that edit. Try again, and if it keeps failing, contact support.')
        setSaving(false)
        return
      }
    }
    setPrompts(prev => prev.map(p => p.id === editId ? { ...p, text: editText, category: cat } : p))
    setEditId(null)
    setSaving(false)
  }

  const deletePrompt = async (id: number) => {
    // This file has no existing inline confirm-state pattern for a
    // destructive action, so a plain confirm dialog is used rather than
    // inventing a new interaction just for this one button. The prompt's
    // own foreign key to ai_results is ON DELETE CASCADE (verified against
    // production, db has no separate migration file for it), so a delete
    // always succeeds and always takes the collected history with it. The
    // confirm says that plainly rather than the milder, and wrong, claim
    // that a constraint could stop it.
    // A viewer never hard deletes (the DELETE policy is admin only, so it
    // would silently affect 0 rows): the same control archives instead, an
    // update of is_active, and the list drops it the way load() already does.
    const mode = removalMode(isAdmin)
    if (!window.confirm(removalConfirm(mode))) return
    if (!isDemoMode) {
      const write = removalWrite(mode)
      const { error } = write.op === 'delete'
        ? await supabase.from('prompts').delete().eq('id', id)
        : await supabase.from('prompts').update(write.patch).eq('id', id)
      if (error) {
        console.error('[Prompts] removePrompt failed', error)
        showNotice(removalFailure(mode))
        return
      }
    }
    setPrompts(prev => prev.filter(p => p.id !== id))
    clearNotice()   // a deletion is what unblocks a capped client
    void refresh()
  }

  const addPrompt = async (text?: string, locIdsArg?: number[]): Promise<boolean> => {
    const promptText = (text ?? newText).trim()
    if (!promptText) return false
    // One country per prompt: K chosen locations make K prompts in one insert.
    // A client with one location never sends location_id (the trigger fills the
    // primary). A multi client always sends it, even for one chosen location,
    // because omitting it would silently place the prompt in the primary.
    const locIds = isMulti ? (locIdsArg ?? askInValid.map(Number)) : []
    if (isMulti && locIds.length === 0) return false
    const k = Math.max(1, locIds.length)
    // Client-side check is a courtesy, not the limit — the real one is the
    // enforce_prompt_cap() trigger, which is why the insert error below is
    // handled rather than assumed away.
    if (!isAdmin && cap !== null && remaining < k) {
      showNotice(`Your plan allows ${cap} active prompts. ${verb} one to add another, or upgrade.`)   // copy: pending bg-copy
      return false
    }
    // Category is auto-assigned from the prompt text (general taxonomy), not
    // chosen by the user — clients are diverse, so the old per-client picker is
    // gone. See lib/promptCategories.ts.
    const cat = categorizePrompt(promptText, brandName)
    setSaving(true)
    const position = prompts.length + 1
    if (!isDemoMode) {
      const rows = Array.from({ length: k }, (_, i) => ({
        text: promptText,
        category: cat,
        position: position + i,
        client_id: activeClientId,
        ...(isMulti ? { location_id: locIds[i] } : {}),
      }))
      const { data, error } = await supabase
        .from('prompts')
        .insert(rows)
        .select()
      if (error) {
        if (error.message.includes('location_archived') || error.message.includes('location_invalid')) {
          showNotice(error.message.includes('location_archived')
            ? 'One of those locations was archived. Pick again.'            // copy: pending bg-copy
            : 'That location is not on this account. Pick again.')          // copy: pending bg-copy
          void refresh()
          setSaving(false)
          return false
        }
        // The trigger raises with this token when the plan cap is hit. Anything
        // else is a real failure and is shown verbatim rather than swallowed —
        // this insert used to discard its error entirely, so a rejected write
        // just silently did nothing.
        // When the cap itself is unknown, say so in words. The old fallback
        // interpolated a bare dash glyph, producing the broken string
        // "Your plan allows [dash] active prompts."
        showNotice(
          !error.message.includes('prompt_cap_reached')
            ? `Could not add prompt: ${error.message}`
            : cap != null
              ? `Your plan allows ${cap} active prompts. ${verb} one to add another, or upgrade.`
              : 'You have reached your plan\'s active prompt limit. ' + verb + ' one to add another, or upgrade.'
        )
        setSaving(false)
        return false
      }
      if (data) setPrompts(prev => [...prev, ...(data as Prompt[])])
      // Location prompt counts changed: re-read the list.
      void refresh()
    } else {
      setPrompts(prev => [...prev, { id: Date.now(), text: promptText, category: cat, is_active: true, position, created_at: new Date().toISOString() }])
    }
    clearNotice()
    if (k > 1) setAnnounce(`Added in ${k} locations`)   // copy: pending bg-copy
    if (!text) { setNewText(''); setShowAdd(false) }
    setSaving(false)
    return true
  }

  const addSuggestion = async (s: SuggestedPrompt, idx: number) => {
    const ok = await addPrompt(s.text, discoverAskInValid.map(Number))
    if (ok) setSuggestions(prev => prev.map((p, i) => i === idx ? { ...p, added: true } : p))
  }

  const addAllSuggestions = async () => {
    const toAdd = suggestions
      .filter(s => !s.added && !prompts.some(p => p.text === s.text))
      // Take only what fits. Without this, "Add all" on a 12-prompt suggestion
      // list for a Free tenant fires 12 inserts, 7 of which the trigger rejects,
      // and the user gets seven identical error messages for one action.
      // Each suggestion makes one prompt per chosen location, so a viewer gets
      // floor(remaining / K) of them.
      .slice(0, isAdmin ? undefined : Math.floor(remaining / Math.max(1, isMulti ? discoverAskInValid.length : 1)))
    const addedText = new Set<string>()
    for (const s of toAdd) {
      if (await addPrompt(s.text, discoverAskInValid.map(Number))) addedText.add(s.text)
    }
    setSuggestions(prev => prev.map(s => (addedText.has(s.text) ? { ...s, added: true } : s)))
  }

  const sendMessage = async () => {
    const msg = userInput.trim()
    if (!msg || aiLoading) return

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: msg }]
    setChatMessages(newMessages)
    setUserInput('')
    setAiLoading(true)
    setSuggestions([])

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/suggest-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            { role: 'system', content: buildSystemPrompt(clientConfig?.name, clientConfig?.brand_website) },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 1500,
        }),
      })
      clearTimeout(timeout)

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Function error ${res.status}: ${errText.slice(0, 200)}`)
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? data.error ?? ''

      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed: SuggestedPrompt[] = JSON.parse(jsonMatch[0])
        setDiscoverAskIn(defaultAskIn())
        setSuggestions(parsed.map(p => ({
          text: p.text,
          added: prompts.some(existing => existing.text === p.text),
        })))
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `Here are ${parsed.length} prompts tailored for your business. Click + to add individually or "Add all" to import them all at once.`
        }])
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content }])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${msg}` }])
    }

    setAiLoading(false)
  }

  // Derive filter categories dynamically from actual prompts (works for any client)
  const usedCategories = [...new Set(locFiltered.map(p => p.category))]
  const catCounts = usedCategories.reduce((acc, cat) => {
    acc[cat] = locFiltered.filter(p => p.category === cat).length
    return acc
  }, {} as Record<string, number>)

  if (loading) return <RouteSkeleton />

  const planLabel = PLAN_LABELS[(activeClient?.plan ?? 'free') as Plan]
  const showMeter = cap !== null && cap < 100000
  const inputClass = 'w-full h-10 bg-surface-2 border border-edge rounded-control px-3 text-body text-ink placeholder:text-ink-3 focus:border-accent-ink disabled:opacity-60'
  const shortText = (text: string) => (text.length > 40 ? text.slice(0, 40) + '…' : text)

  const showLocBadge = isMulti && selected.size !== 1
  const locationLabelOf = (p: Prompt) => {
    const l = locationById.get(promptLocationId(p, primaryId) ?? -1)
    return l ? locationLabel(l) : 'an archived location'   // copy: pending bg-copy
  }
  const locBadge = (p: Prompt, cls: string) => {
    const l = locationById.get(promptLocationId(p, primaryId) ?? -1)
    if (!l) return null
    const label = locationLabel(l)
    return (
      <Badge tone="neutral" className={cls} glyph={<LocationFlag marketId={l.market_id} size={12} />}>
        <span className="truncate" title={label}>{label}</span>
      </Badge>
    )
  }
  const locSubtitle = selected.size === 1
    ? `${promptCountLabel(locFiltered.length)} in ${selectedLocations.map(locationLabel).join('')}`   // copy: pending bg-copy
    : `${promptCountLabel(locFiltered.length)} in ${selected.size} locations`                           // copy: pending bg-copy

  return (
    <Page>
      <div className="sr-only" role="status" aria-live="polite">{announce}</div>
      <PageHeader
        title={t.pr_title}
        subtitle={showMeter ? undefined : (isMulti && selected.size > 0 ? locSubtitle : fmt(t.pr_titleCount, { n: used }))}
        actions={
          <>
            {showMeter && cap !== null && (
              <AllowanceMeter label={`Prompts on ${planLabel}`} used={used} cap={cap} />
            )}
            <Button
              variant="secondary"
              icon={Bot}
              aria-expanded={showDiscover}
              onClick={() => { setShowDiscover(v => !v); setSuggestions([]); if (showDiscover) { setClientConfig(null); setChatMessages([{ role: 'assistant', content: "Hi! Describe your business and I will generate the best AI monitoring prompts for you." }]) } }}
            >
              {t.pr_aiDiscover}
            </Button>
            {/* Prompt management is available to any signed-in user for THEIR OWN
                client, not admin-only. Cross-tenant safety is enforced in the DB:
                the prompts RLS policies pin writes to
                `is_admin() OR client_id = get_my_client_id()`.
                See SECURITY-AUDIT.md section 0.5. */}
            <Button
              variant="primary"
              icon={capBlocks ? Lock : Plus}
              aria-disabled={capBlocks}
              title={capBlocks ? `Plan limit reached (${cap} prompts)` : undefined}
              onClick={() => (capBlocks ? showNotice(`Your plan allows ${cap} active prompts. ${verb} one to add another, or upgrade.`) : openAdd())}
            >
              {t.pr_addPrompt}
            </Button>
          </>
        }
      />

      <div className="space-y-4 md:space-y-6">
        {/* One alarm per route: a save or add failure outranks the plan-limit
            notice. The limit notice has two states, a customer who is blocked and
            needs the way out, and an admin who is over a cap on purpose. */}
        {capError ? (
          <Notice
            tone="neg"
            // copy: pending bg-copy
            title={capError}
            action={<Button variant="tertiary" onClick={clearNotice}>Dismiss</Button>}
          />
        ) : atCap && (
          <Notice
            tone={capBlocks ? 'warn' : 'accent'}
            // copy: pending bg-copy
            title={capBlocks ? `You have used all ${cap} prompts on ${planLabel}.` : `This client is at its plan limit (${used} of ${cap}).`}
            action={capBlocks ? <Button variant="tertiary" onClick={() => { window.location.assign('/account') }}>Upgrade</Button> : undefined}
          >
            {capBlocks
              ? `${verb} a prompt you no longer track to add a new one, or upgrade for more.`
              : 'You can add beyond it as an admin. The customer cannot.'}
          </Notice>
        )}

        {isMulti && (locations.length <= LOCATION_CHIP_MAX ? (
          <ChipGroup label="Location">
            <Chip selected={selected.size === 0} count={prompts.length} onClick={() => setSelected([])}>All</Chip>
            {locations.map(l => (
              <Chip key={l.id} selected={selected.has(l.id)} count={countAt(l.id)} onClick={() => toggleLocationFilter(l.id)}>
                {locationLabel(l)}
              </Chip>
            ))}
          </ChipGroup>
        ) : (
          <MultiCombobox
            size="md"
            className="w-full sm:w-80"
            options={locationOptions}
            values={[...selected].map(String)}
            onChange={vals => setSelected(vals.map(Number))}
            ariaLabel="Show prompts from"
            placeholder="All locations"
          />
        ))}

        {usedCategories.length > 0 && (
          <ChipGroup label="Category">
            <Chip selected={activeCat === 'all'} count={locFiltered.length} onClick={() => setFilterCat('all')}>All</Chip>
            {usedCategories.map(cat => (
              <Chip key={cat} selected={activeCat === cat} count={catCounts[cat]} onClick={() => setFilterCat(activeCat === cat ? 'all' : cat)}>
                {promptCategoryLabel(cat)}
              </Chip>
            ))}
          </ChipGroup>
        )}

        {showDiscover && (
          <Card pad="none" className="overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center gap-2">
              <Bot size={16} aria-hidden="true" className="text-accent-ink" />
              <span className="text-heading text-ink">{t.pr_aiDiscoveryTitle}</span>
              <span className="text-meta text-ink-3 ml-auto">{t.pr_poweredBy}</span>
            </div>

            <div className="px-4 py-4 space-y-3 max-h-64 overflow-y-auto">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-control text-body text-ink ${
                    m.role === 'user' ? 'bg-accent-tint' : 'bg-surface-2'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-2 text-ink-2 px-3 py-2 rounded-control text-body motion-safe:animate-pulse">
                    {t.pr_generatingPrompts}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {suggestions.length > 0 && (
              <div className="border-t border-line px-4 py-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-meta text-ink-3">
                    {fmt(t.pr_suggestions, { n: suggestions.length })}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {isMulti && (
                      <MultiCombobox
                        size="sm"
                        className="w-56"
                        options={locationOptions}
                        values={discoverAskInValid}
                        onChange={setDiscoverAskIn}
                        ariaLabel="Ask suggestions in"
                        placeholder="Ask suggestions in"
                        maxSelected={limitK !== undefined ? Math.max(1, limitK) : undefined}
                        maxReason="Plan limit"
                        invalid={discoverNeedsLocation}
                        describedBy={discoverNeedsLocation ? 'prompts-discover-ask-empty' : undefined}
                      />
                    )}
                    <Button variant="tertiary" size="sm" icon={PlusCircle} onClick={addAllSuggestions} disabled={discoverNeedsLocation}>
                      {t.pr_addAll}
                    </Button>
                  </div>
                </div>
                {discoverNeedsLocation && (
                  <p id="prompts-discover-ask-empty" role="alert" className="m-0 mb-2 text-meta text-neg">Pick at least one location to add these prompts</p>/* copy: pending bg-copy */
                )}
                {suggestions.map((s, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-control border ${
                    s.added ? 'bg-surface-2 border-line' : 'bg-surface border-line hover:bg-surface-2'
                  }`}>
                    <Badge tone="neutral">{promptCategoryLabel(categorizePrompt(s.text, brandName))}</Badge>
                    <span className="text-body text-ink flex-1">{s.text}</span>
                    <IconButton
                      label={s.added ? 'Already added' : discoverNeedsLocation ? 'Pick a location first to add this prompt' : `Add suggested prompt: ${s.text}`}
                      icon={s.added ? Check : Plus}
                      disabled={s.added || discoverNeedsLocation}
                      onClick={() => addSuggestion(s, i)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-line px-4 py-3 flex gap-2">
              <input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={t.pr_placeholder}
                aria-label="Message to AI Discover"
                className={`flex-1 ${inputClass}`}
                disabled={aiLoading}
              />
              <IconButton
                label="Send message"
                icon={Send}
                variant="secondary"
                onClick={sendMessage}
                disabled={!userInput.trim() || aiLoading}
              />
            </div>
          </Card>
        )}

        {showAdd && (
          <Card className="flex gap-3 items-start">
            <div className="flex-1 space-y-2 min-w-0">
              <input
                autoFocus
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPrompt()}
                placeholder={t.pr_searchPlaceholder}
                aria-label="New prompt text"
                title="The category is auto-detected from your prompt text, so there is no need to pick one."   // copy: pending bg-copy
                className={inputClass}
              />
              {isMulti ? (
                <>
                  <label htmlFor="prompts-ask-in" className="block text-meta text-ink-2">Ask in</label>{/* copy: pending bg-copy */}
                  <MultiCombobox
                    id="prompts-ask-in"
                    size="md"
                    options={locationOptions}
                    values={askInValid}
                    onChange={setAskIn}
                    ariaLabel="Ask in"
                    placeholder="Pick locations"
                    maxSelected={limitK !== undefined ? Math.max(1, limitK) : undefined}
                    maxReason="Plan limit"
                    invalid={askInValid.length === 0}
                    describedBy={askInValid.length === 0 ? 'prompts-ask-empty' : undefined}
                  />
                  {askInValid.length === 0 ? (
                    <p id="prompts-ask-empty" role="alert" className="m-0 text-meta text-neg">Pick at least one location</p>
                  ) : (
                    <>
                      <p className="m-0 text-meta text-ink-3">Each location makes its own copy and uses one prompt of your plan.</p>
                      <p className={`m-0 text-meta ${(!isAdmin && askInValid.length > remaining) || (isAdmin && cap !== null && used + askInValid.length > cap) ? 'text-warn' : 'text-ink-3'}`}>
                        {isAdmin
                          ? (cap !== null && used + askInValid.length > cap ? 'Goes over the plan limit. Allowed for admins.' : `Uses ${promptCountLabel(askInValid.length)} of your plan.`)
                          : Number.isFinite(remaining)
                            ? `Uses ${askInValid.length} of ${remaining} prompts left on your plan.`
                            : `Uses ${promptCountLabel(askInValid.length)} of your plan.`}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <p className="m-0 text-meta text-ink-3">The category is auto-detected from your prompt text, so there is no need to pick one.</p>
              )}
            </div>
            <div className="flex gap-2">
              <IconButton label="Add prompt" icon={Check} variant="secondary" onClick={() => addPrompt()} disabled={saving || !newText.trim() || (isMulti && askInValid.length === 0)} />
              <IconButton label="Cancel adding prompt" icon={X} onClick={() => setShowAdd(false)} />
            </div>
          </Card>
        )}

        {prompts.length === 0 && !showAdd && !showDiscover ? (
          <Card pad="feature" className="flex flex-col items-center gap-4 text-center">
            <EmptyState
              icon={MessageSquare}
              // copy: pending bg-copy
              title="No prompts yet"
              body={t.pr_noPrompts}
              minHeight={0}
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="primary" icon={Plus} onClick={openAdd}>{t.pr_addPrompt}</Button>
              <Button variant="secondary" icon={Bot} onClick={() => setShowDiscover(true)}>{t.pr_aiDiscover}</Button>
            </div>
          </Card>
        ) : (
          <>
            {filtered.length > 0 && (
              <DataList
                ariaLabel="Prompts"
                rows={filtered}
                getKey={p => p.id}
                renderRow={(p, i) => {
                  const isEditing = editId === p.id
                  return (
                    <>
                      <span className="text-meta text-ink-3 tabular-nums w-5 text-right shrink-0">{i + 1}</span>
                      <span className="hidden sm:flex w-28 shrink-0"><Badge tone="neutral">{promptCategoryLabel(p.category)}</Badge></span>
                      {showLocBadge && <span className="hidden md:flex w-40 shrink-0 min-w-0">{locBadge(p, 'max-w-full')}</span>}
                      {isEditing ? (
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex gap-3 items-center">
                            <input
                              autoFocus
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && saveEdit()}
                              aria-label="Edit prompt text"
                              className={`flex-1 min-w-0 ${inputClass}`}
                            />
                            <div className="flex gap-2 shrink-0">
                              <IconButton label="Save prompt" icon={Check} variant="secondary" onClick={saveEdit} disabled={saving} />
                              <IconButton label="Cancel editing prompt" icon={X} onClick={() => setEditId(null)} />
                            </div>
                          </div>
                          {isMulti && (
                            <p className="m-0 text-meta text-ink-3">
                              {/* copy: pending bg-copy */}
                              {`Asked in ${locationLabelOf(p)}. To move it, archive it and add it again.`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 min-w-0">
                            <span className="block text-body text-ink">{p.text}</span>
                            <span className="sm:hidden mt-1 flex flex-wrap gap-1.5">
                              <Badge tone="neutral">{promptCategoryLabel(p.category)}</Badge>
                              {showLocBadge && locBadge(p, 'max-w-full')}
                            </span>
                            {showLocBadge && <span className="hidden sm:flex md:hidden mt-1">{locBadge(p, 'max-w-full')}</span>}
                          </span>
                          {/* Row actions are always visible (no hover reveal), so a touch
                              device can reach them. The 44px hit area on a phone comes
                              from the primitive's own padding. */}
                          <div className="row-actions flex gap-2 shrink-0">
                            <IconButton label={`Edit prompt: ${shortText(p.text)}`} icon={Pencil} onClick={() => startEdit(p)} />
                            <button
                              type="button"
                              onClick={() => deletePrompt(p.id)}
                              aria-label={`${verb} prompt: ${shortText(p.text)}`}
                              title={`${verb} prompt`}
                              className="relative inline-flex items-center justify-center w-8 h-8 rounded-control text-ink-2 hover:bg-surface-2 hover:text-neg transition-colors duration-[180ms] after:absolute after:-inset-1.5 after:content-[''] md:after:hidden"
                            >
                              {isAdmin ? <Trash2 size={14} /> : <Archive size={14} />}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )
                }}
              />
            )}

            {locFiltered.length === 0 && selected.size > 0 && prompts.length > 0 ? (
              <Card pad="feature" className="flex flex-col items-center gap-4 text-center">
                <EmptyState
                  icon={MessageSquare}
                  // copy: pending bg-copy
                  title={`No prompts in ${selectedLocations.map(locationLabel).join(', ')} yet`}
                  body="Add a question to see how AI answers it from this location."
                  minHeight={0}
                />
                <Button variant="primary" icon={Plus} onClick={openAdd}>Add a prompt here</Button>
              </Card>
            ) : filtered.length === 0 && (
              <p className="m-0 py-12 text-center text-body text-ink-3">
                {prompts.length === 0 ? t.pr_noPrompts : t.pr_noFilter}
              </p>
            )}
          </>
        )}
      </div>
    </Page>
  )
}
