import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Bot, Send, PlusCircle } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { mockPrompts } from '../lib/mockData'
import type { Prompt, PromptCategory } from '../types'

const CATEGORY_META: Record<string, { label: string; color: string; desc: string }> = {
  // BpR categories
  mid:            { label: 'Mid (100-200)',    color: 'bg-blue-500/20 text-blue-300',     desc: 'Events with 100-200 guests' },
  large:          { label: 'Large (500+)',     color: 'bg-purple-500/20 text-purple-300', desc: 'Events with 500+ guests' },
  very_large:     { label: 'Very Large (1k+)', color: 'bg-amber-500/20 text-amber-300',   desc: 'Events with 1000+ guests' },
  general:        { label: 'General',          color: 'bg-slate-500/20 text-slate-300',   desc: 'General discovery' },
  // BrandGEO categories
  tool_discovery: { label: 'Tool Discovery',   color: 'bg-emerald-500/20 text-emerald-300', desc: 'Searching for monitoring tools' },
  geo_category:   { label: 'GEO / AIO',        color: 'bg-blue-500/20 text-blue-300',       desc: 'GEO & AI optimization queries' },
  problem_based:  { label: 'Problem-based',    color: 'bg-amber-500/20 text-amber-300',     desc: 'Pain point searches' },
  direct_brand:   { label: 'Direct Brand',     color: 'bg-violet-500/20 text-violet-300',   desc: 'Searching for BrandGEO directly' },
}

const getCategoryMeta = (cat: string) =>
  CATEGORY_META[cat] ?? { label: cat, color: 'bg-slate-500/20 text-slate-300', desc: '' }

const SYSTEM_PROMPT = `You are an AI visibility monitoring expert. Your job is to generate prompts (search queries) that real people type into AI assistants like ChatGPT, Perplexity, or Gemini when looking for products or services.

Given a business description, generate 8-12 natural-sounding monitoring prompts. Each prompt should:
- Sound exactly like something a real person would type into an AI chatbot
- Be in the same language the user describes their business (if they write in Romanian, generate Romanian prompts)
- Cover different angles: recommendations, price inquiries, comparisons, specific event types, locations
- Include a category from exactly these four options: "mid" (events 100-500 people), "large" (events 500-1000 people), "very_large" (events 1000+ people), or "general" (brand discovery, comparisons, reviews)

Respond with ONLY a valid JSON array, no markdown, no explanation, no extra text:
[
  { "text": "prompt text here", "category": "general" },
  ...
]`

interface SuggestedPrompt {
  text: string
  category: PromptCategory
  added?: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function Prompts() {
  const { activeClientId } = useClient()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<PromptCategory | 'all'>('all')
  const [editId, setEditId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [editCat, setEditCat] = useState<PromptCategory>('general')
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [newCat, setNewCat] = useState<PromptCategory>('general')
  const [saving, setSaving] = useState(false)

  const [showDiscover, setShowDiscover] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! Describe your business and I will generate the best AI monitoring prompts for you. For example: \"We are a corporate catering company in Bucharest serving events of 100-2000 people.\""
    }
  ])
  const [userInput, setUserInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestedPrompt[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

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
      .order('position', { ascending: true })
    if (data) setPrompts(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [activeClientId])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, suggestions])

  const filtered = filterCat === 'all' ? prompts : prompts.filter(p => p.category === filterCat)

  const startEdit = (p: Prompt) => { setEditId(p.id); setEditText(p.text); setEditCat(p.category) }

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true)
    if (!isDemoMode) await supabase.from('prompts').update({ text: editText, category: editCat }).eq('id', editId)
    setPrompts(prev => prev.map(p => p.id === editId ? { ...p, text: editText, category: editCat } : p))
    setEditId(null)
    setSaving(false)
  }

  const deletePrompt = async (id: number) => {
    if (!isDemoMode) await supabase.from('prompts').delete().eq('id', id)
    setPrompts(prev => prev.filter(p => p.id !== id))
  }

  const addPrompt = async (text?: string, category?: PromptCategory) => {
    const t = (text ?? newText).trim()
    const cat = category ?? newCat
    if (!t) return
    setSaving(true)
    const position = prompts.length + 1
    if (!isDemoMode) {
      const { data } = await supabase
        .from('prompts')
        .insert({ text: t, category: cat, position, client_id: activeClientId })
        .select()
        .single()
      if (data) setPrompts(prev => [...prev, data])
    } else {
      setPrompts(prev => [...prev, { id: Date.now(), text: t, category: cat, is_active: true, position, created_at: new Date().toISOString() }])
    }
    if (!text) { setNewText(''); setShowAdd(false) }
    setSaving(false)
  }

  const addSuggestion = async (s: SuggestedPrompt, idx: number) => {
    await addPrompt(s.text, s.category)
    setSuggestions(prev => prev.map((p, i) => i === idx ? { ...p, added: true } : p))
  }

  const addAllSuggestions = async () => {
    const toAdd = suggestions.filter(s => !s.added && !prompts.some(p => p.text === s.text))
    for (const s of toAdd) await addPrompt(s.text, s.category)
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
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) throw new Error('VITE_OPENAI_API_KEY not set')

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      })

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? ''

      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed: SuggestedPrompt[] = JSON.parse(jsonMatch[0])
        setSuggestions(parsed.map(p => ({
          text: p.text,
          category: (['mid', 'large', 'very_large', 'general'].includes(p.category) ? p.category : 'general') as PromptCategory,
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
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${msg}. Check that VITE_OPENAI_API_KEY is set.` }])
    }

    setAiLoading(false)
  }

  const catCounts = (Object.keys(CATEGORY_META) as PromptCategory[]).reduce((acc, cat) => {
    acc[cat] = prompts.filter(p => p.category === cat).length
    return acc
  }, {} as Record<PromptCategory, number>)

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitored Prompts</h1>
          <p className="text-sm text-slate-400 mt-0.5">{prompts.length} prompts - checked across all major LLMs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowDiscover(v => !v); setSuggestions([]) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              showDiscover
                ? 'bg-brand-500/30 text-brand-200 border border-brand-500/50'
                : 'bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 border border-brand-500/20'
            }`}
          >
            <Bot size={14} />
            AI Discover
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-dark-700 text-slate-300 hover:bg-dark-600 transition-colors border border-dark-600"
          >
            <Plus size={14} />
            Add prompt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(CATEGORY_META).map(([cat, meta]) => (
          <button
            key={cat}
            onClick={() => setFilterCat(filterCat === cat ? 'all' : (cat as PromptCategory))}
            className={`rounded-xl border p-4 text-left transition-all ${
              filterCat === cat ? 'border-brand-500/50 bg-brand-500/10' : 'border-dark-700 bg-dark-800 hover:border-dark-600'
            }`}
          >
            <div className="text-2xl font-bold text-white tabular-nums">{catCounts[cat]}</div>
            <div className={`text-xs font-medium mt-1 inline-flex px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</div>
            <div className="text-xs text-slate-500 mt-1">{meta.desc}</div>
          </button>
        ))}
      </div>

      {showDiscover && (
        <div className="mb-6 bg-dark-800 border border-brand-500/25 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-700/60 flex items-center gap-2">
            <Bot size={15} className="text-brand-400" />
            <span className="text-sm font-semibold text-brand-300">AI Prompt Discovery</span>
            <span className="text-xs text-slate-500 ml-auto">Powered by GPT-4o</span>
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
                  Generating prompts...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {suggestions.length > 0 && (
            <div className="border-t border-dark-700/60 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {suggestions.length} suggestions
                </span>
                <button
                  onClick={addAllSuggestions}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand-300 hover:text-brand-200 transition-colors"
                >
                  <PlusCircle size={12} />
                  Add all
                </button>
              </div>
              {suggestions.map((s, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                  s.added ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-dark-700/50 border-dark-600/50 hover:border-dark-500'
                }`}>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${getCategoryMeta(s.category).color}`}>
                    {getCategoryMeta(s.category).label}
                  </span>
                  <span className="text-xs text-slate-300 flex-1">{s.text}</span>
                  <button
                    onClick={() => addSuggestion(s, i)}
                    disabled={s.added}
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
              placeholder="Describe your business, location, target clients..."
              className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
              disabled={aiLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!userInput.trim() || aiLoading}
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
              placeholder="e.g. catering eveniment 500 persoane Bucuresti..."
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
            <select
              value={newCat}
              onChange={e => setNewCat(e.target.value as PromptCategory)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
            >
              {Object.entries(CATEGORY_META).map(([cat, meta]) => (
                <option key={cat} value={cat}>{meta.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-0.5">
            <button onClick={() => addPrompt()} disabled={saving || !newText.trim()} className="p-2 rounded-lg bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 disabled:opacity-40 transition-colors"><Check size={16} /></button>
            <button onClick={() => setShowAdd(false)} className="p-2 rounded-lg bg-dark-700 text-slate-400 hover:bg-dark-600 transition-colors"><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map((p, i) => {
          const meta = getCategoryMeta(p.category)
          const isEditing = editId === p.id
          return (
            <div key={p.id} className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 flex items-center gap-4 group hover:border-dark-600 transition-colors">
              <span className="text-xs text-slate-600 tabular-nums w-5 text-right flex-shrink-0">{p.position || i + 1}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${meta.color}`}>{meta.label}</span>
              {isEditing ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                    className="flex-1 bg-dark-700 border border-brand-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none"
                  />
                  <select
                    value={editCat}
                    onChange={e => setEditCat(e.target.value as PromptCategory)}
                    className="bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    {Object.keys(CATEGORY_META).map(cat => (
                      <option key={cat} value={cat}>{getCategoryMeta(cat).label}</option>
                    ))}
                  </select>
                  <button onClick={saveEdit} disabled={saving} className="p-1.5 rounded-lg bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 disabled:opacity-40"><Check size={14} /></button>
                  <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-dark-700 text-slate-400 hover:bg-dark-600"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-300">{p.text}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-dark-700 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => deletePrompt(p.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
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
            ? <><p className="mb-3">No prompts yet.</p><button onClick={() => setShowDiscover(true)} className="px-4 py-2 rounded-lg bg-brand-500/15 text-brand-300 text-sm hover:bg-brand-500/25 transition-colors flex items-center gap-2 mx-auto"><Bot size={14} />Discover prompts with AI</button></>
            : 'No prompts in this category.'
          }
        </div>
      )}
    </div>
  )
}
