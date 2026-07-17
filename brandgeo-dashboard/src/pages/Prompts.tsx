import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Bot, Send, PlusCircle } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { mockPrompts } from '../lib/mockData'
import type { Prompt } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'
import { categorizePrompt, promptCategoryLabel } from '../lib/promptCategories'

// Category is a grouping, not an alert — one quiet neutral chip everywhere, and
// the label comes from the shared general taxonomy (lib/promptCategories.ts).
const CAT_BADGE = 'bg-dark-700 text-slate-400'

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
  const { activeClientId, activeClient } = useClient()
  const brandName = activeClient?.name
  const { t } = useI18n()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [editId, setEditId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [saving, setSaving] = useState(false)

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
          ? `Analyze this business and generate monitoring prompts: ${data.name} — website: ${data.brand_website}`
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
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, suggestions])

  const filtered = filterCat === 'all' ? prompts : prompts.filter(p => p.category === filterCat)

  const startEdit = (p: Prompt) => { setEditId(p.id); setEditText(p.text) }

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true)
    const cat = categorizePrompt(editText, brandName)   // re-categorise from the edited text
    if (!isDemoMode) await supabase.from('prompts').update({ text: editText, category: cat }).eq('id', editId)
    setPrompts(prev => prev.map(p => p.id === editId ? { ...p, text: editText, category: cat } : p))
    setEditId(null)
    setSaving(false)
  }

  const deletePrompt = async (id: number) => {
    if (!isDemoMode) await supabase.from('prompts').delete().eq('id', id)
    setPrompts(prev => prev.filter(p => p.id !== id))
  }

  const addPrompt = async (text?: string) => {
    const promptText = (text ?? newText).trim()
    if (!promptText) return
    // Category is auto-assigned from the prompt text (general taxonomy), not
    // chosen by the user — clients are diverse, so the old per-client picker is
    // gone. See lib/promptCategories.ts.
    const cat = categorizePrompt(promptText, brandName)
    setSaving(true)
    const position = prompts.length + 1
    if (!isDemoMode) {
      const { data } = await supabase
        .from('prompts')
        .insert({ text: promptText, category: cat, position, client_id: activeClientId })
        .select()
        .single()
      if (data) setPrompts(prev => [...prev, data])
    } else {
      setPrompts(prev => [...prev, { id: Date.now(), text: promptText, category: cat, is_active: true, position, created_at: new Date().toISOString() }])
    }
    if (!text) { setNewText(''); setShowAdd(false) }
    setSaving(false)
  }

  const addSuggestion = async (s: SuggestedPrompt, idx: number) => {
    await addPrompt(s.text)
    setSuggestions(prev => prev.map((p, i) => i === idx ? { ...p, added: true } : p))
  }

  const addAllSuggestions = async () => {
    const toAdd = suggestions.filter(s => !s.added && !prompts.some(p => p.text === s.text))
    for (const s of toAdd) await addPrompt(s.text)
    setSuggestions(prev => prev.map(s => ({ ...s, added: true })))
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
  const usedCategories = [...new Set(prompts.map(p => p.category))]
  const catCounts = usedCategories.reduce((acc, cat) => {
    acc[cat] = prompts.filter(p => p.category === cat).length
    return acc
  }, {} as Record<string, number>)

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">{t.pr_loading}</div>

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.pr_title}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{fmt(t.pr_titleCount, { n: prompts.length })}</p>
        </div>
        {/* Prompt management is available to any signed-in user for THEIR OWN
            client — not admin-only. This used to be gated behind `isAdmin`,
            which meant every self-serve account (free signup AND paying
            Essentials/Growth, both provisioned as `viewer`) landed on a
            dashboard they could not fill. Cross-tenant safety is enforced in
            the DB, not here: the prompts RLS policies pin writes to
            `is_admin() OR client_id = get_my_client_id()`.
            See SECURITY-AUDIT.md §0.5. */}
        <div className="flex gap-2">
          <button
            onClick={() => { setShowDiscover(v => !v); setSuggestions([]); if (showDiscover) { setClientConfig(null); setChatMessages([{ role: 'assistant', content: "Hi! Describe your business and I will generate the best AI monitoring prompts for you." }]) } }}
            aria-expanded={showDiscover}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              showDiscover
                ? 'bg-brand-500/30 text-brand-200 border border-brand-500/50'
                : 'bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/20'
            }`}
          >
            <Bot size={14} />
            {t.pr_aiDiscover}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-dark-700 text-slate-300 hover:bg-dark-600 transition-colors border border-dark-600"
          >
            <Plus size={14} />
            {t.pr_addPrompt}
          </button>
        </div>
      </div>

      {/* Dynamic category filter — shows only categories that exist in this client's prompts */}
      {usedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterCat('all')}
            aria-pressed={filterCat === 'all'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filterCat === 'all'
                ? 'border-brand-500/50 bg-brand-500/15 text-brand-300'
                : 'border-dark-700 bg-dark-800 text-slate-400 hover:border-dark-600 hover:text-slate-300'
            }`}
          >
            All · {prompts.length}
          </button>
          {usedCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? 'all' : cat)}
              aria-pressed={filterCat === cat}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filterCat === cat
                  ? 'border-brand-500/50 bg-brand-500/15 text-brand-300'
                  : 'border-dark-700 bg-dark-800 text-slate-400 hover:border-dark-600 hover:text-slate-300'
              }`}
            >
              {promptCategoryLabel(cat)} · {catCounts[cat]}
            </button>
          ))}
        </div>
      )}

      {showDiscover && (
        <div className="mb-6 bg-dark-800 border border-brand-500/25 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-700/60 flex items-center gap-2">
            <Bot size={15} className="text-brand-400" />
            <span className="text-sm font-semibold text-brand-300">{t.pr_aiDiscoveryTitle}</span>
            <span className="text-xs text-slate-500 ml-auto">{t.pr_poweredBy}</span>
          </div>

          <div className="px-4 py-4 space-y-3 max-h-64 overflow-y-auto">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  m.role === 'user'
                    ? 'bg-brand-500/20 text-brand-100'
                    : 'bg-dark-700 text-slate-300'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-dark-700 text-slate-400 px-3 py-2 rounded-xl text-sm animate-pulse">
                  {t.pr_generatingPrompts}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {suggestions.length > 0 && (
            <div className="border-t border-dark-700/60 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {fmt(t.pr_suggestions, { n: suggestions.length })}
                </span>
                <button
                  onClick={addAllSuggestions}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand-300 hover:text-brand-200 transition-colors"
                >
                  <PlusCircle size={12} />
                  {t.pr_addAll}
                </button>
              </div>
              {suggestions.map((s, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                  s.added ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-dark-700/50 border-dark-600/50 hover:border-dark-500'
                }`}>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${CAT_BADGE}`}>
                    {promptCategoryLabel(categorizePrompt(s.text, brandName))}
                  </span>
                  <span className="text-xs text-slate-300 flex-1">{s.text}</span>
                  <button
                    onClick={() => addSuggestion(s, i)}
                    disabled={s.added}
                    aria-label={s.added ? 'Already added' : `Add suggested prompt: ${s.text}`}
                    className={`shrink-0 p-1 rounded-lg transition-colors ${
                      s.added
                        ? 'text-emerald-500 cursor-default'
                        : 'text-slate-500 hover:text-brand-300 hover:bg-brand-500/10'
                    }`}
                  >
                    {s.added ? <Check size={13} /> : <Plus size={13} />}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-dark-700/60 px-4 py-3 flex gap-2">
            <input
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={t.pr_placeholder}
              aria-label="Message to AI Discover"
              className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              disabled={aiLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!userInput.trim() || aiLoading}
              aria-label="Send message"
              className="px-3 py-2 rounded-lg bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 disabled:opacity-40 transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="mb-4 bg-dark-800 border border-brand-500/30 rounded-xl p-4 flex gap-3 items-start">
          <div className="flex-1 space-y-2">
            <input
              autoFocus
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPrompt()}
              placeholder={t.pr_searchPlaceholder}
              aria-label="New prompt text"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
            <p className="text-[11px] text-slate-600">The category is auto-detected from your prompt text — no need to pick one.</p>
          </div>
          <div className="flex gap-2 pt-0.5">
            <button onClick={() => addPrompt()} disabled={saving || !newText.trim()} aria-label="Add prompt" className="p-2 rounded-lg bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 disabled:opacity-40 transition-colors"><Check size={16} /></button>
            <button onClick={() => setShowAdd(false)} aria-label="Cancel adding prompt" className="p-2 rounded-lg bg-dark-700 text-slate-400 hover:bg-dark-600 transition-colors"><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map((p, i) => {
          const isEditing = editId === p.id
          return (
            <div key={p.id} className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 flex items-center gap-4 group hover:border-dark-600 transition-colors">
              <span className="text-xs text-slate-600 tabular-nums w-5 text-right flex-shrink-0">{i + 1}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${CAT_BADGE}`}>{promptCategoryLabel(p.category)}</span>
              {isEditing ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                    aria-label="Edit prompt text"
                    className="flex-1 bg-dark-700 border border-brand-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none"
                  />
                  <button onClick={saveEdit} disabled={saving} aria-label="Save prompt" className="p-1.5 rounded-lg bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 disabled:opacity-40"><Check size={14} /></button>
                  <button onClick={() => setEditId(null)} aria-label="Cancel editing prompt" className="p-1.5 rounded-lg bg-dark-700 text-slate-400 hover:bg-dark-600"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-300">{p.text}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(p)} aria-label={`Edit prompt: ${p.text.length > 40 ? p.text.slice(0, 40) + '…' : p.text}`} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-dark-700 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => deletePrompt(p.id)} aria-label={`Delete prompt: ${p.text.length > 40 ? p.text.slice(0, 40) + '…' : p.text}`} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          {prompts.length === 0
            ? t.pr_noPrompts
            : t.pr_noFilter}
        </div>
      )}
    </div>
  )
}
