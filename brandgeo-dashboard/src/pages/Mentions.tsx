import { useEffect, useState } from 'react'
import { ExternalLink, ChevronDown } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockAnalyses } from '../lib/mockData'
import { ClassificationBadge, SentimentDot } from '../components/ScoreBadge'
import type { PageAnalysis, Classification, Sentiment } from '../types'

type FilterClass = Classification | 'all'
type FilterSentiment = Sentiment | 'all'

export default function Mentions() {
  const [analyses, setAnalyses] = useState<PageAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClass, setFilterClass] = useState<FilterClass>('all')
  const [filterSentiment, setFilterSentiment] = useState<FilterSentiment>('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      if (isDemoMode) {
        setAnalyses(mockAnalyses)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('page_analysis')
        .select('*, search_results(url, title, snippet, query)')
        .eq('mentions_bpr', true)
        .order('geo_score', { ascending: false })
      if (data) {
        setAnalyses(data.map((r: any) => ({
          ...r,
          url:     r.search_results?.url,
          title:   r.search_results?.title,
          snippet: r.search_results?.snippet,
          query:   r.search_results?.query,
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = analyses.filter(a => {
    if (filterClass !== 'all' && a.classification !== filterClass) return false
    if (filterSentiment !== 'all' && a.sentiment !== filterSentiment) return false
    return true
  })

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading…</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Mentions</h1>
        <p className="text-sm text-slate-400 mt-0.5">{filtered.length} results</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select
          value={filterClass}
          onChange={v => setFilterClass(v as FilterClass)}
          options={[
            { value: 'all', label: 'All types' },
            { value: 'strategic', label: 'Strategic' },
            { value: 'high_value', label: 'High value' },
            { value: 'medium_value', label: 'Medium value' },
            { value: 'low_value', label: 'Low value' },
            { value: 'competitor_opportunity', label: 'Competitor opp.' },
          ]}
        />
        <Select
          value={filterSentiment}
          onChange={v => setFilterSentiment(v as FilterSentiment)}
          options={[
            { value: 'all', label: 'All sentiment' },
            { value: 'positive', label: 'Positive' },
            { value: 'neutral', label: 'Neutral' },
            { value: 'negative', label: 'Negative' },
          ]}
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(a => (
          <div key={a.id} className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
            <button
              className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-dark-700/30 transition-colors"
              onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            >
              {/* Score */}
              <div className="flex-shrink-0 w-12 text-center">
                <div
                  className="text-lg font-bold tabular-nums"
                  style={{
                    color: a.geo_score >= 76 ? '#10b981' :
                           a.geo_score >= 51 ? '#1f9baa' :
                           a.geo_score >= 21 ? '#3b82f6' : '#64748b'
                  }}
                >
                  {a.geo_score}
                </div>
                <div className="text-xs text-slate-600">score</div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <ClassificationBadge value={a.classification} />
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <SentimentDot value={a.sentiment} />
                    {a.sentiment}
                  </span>
                  {a.mentions_bpr && (
                    <span className="text-xs text-emerald-400">✓ mentions BpR</span>
                  )}
                </div>
                <div className="text-sm font-medium text-slate-200 truncate">{a.title || a.url}</div>
                <div className="text-xs text-slate-500 truncate">{a.url}</div>
              </div>

              <ChevronDown
                size={16}
                className={`flex-shrink-0 text-slate-600 transition-transform mt-1 ${expanded === a.id ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expanded */}
            {expanded === a.id && (
              <div className="border-t border-dark-700 px-5 py-4 space-y-3">
                <div>
                  <h4 className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">AI Summary</h4>
                  <p className="text-sm text-slate-300">{a.llm_summary}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Suggested Action</h4>
                    <p className="text-sm text-slate-300">{a.suggested_action}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Recommended Content</h4>
                    <p className="text-sm text-slate-300">{a.recommended_content || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Query: <span className="text-slate-400 italic">{a.query}</span>
                  </span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    View page <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">No mentions match these filters.</div>
      )}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-dark-800 border border-dark-700 text-sm text-slate-300 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-brand-500 cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-500 pointer-events-none" />
    </div>
  )
}
