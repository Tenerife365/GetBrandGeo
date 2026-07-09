/**
 * Recommendations.tsx — Dynamic, data-driven recommendations
 * All recs generated from actual ai_results: LLM gaps, weak categories, real competitors.
 * No hardcoded client IDs, no static catalogues.
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, Zap, Target, TrendingUp, RefreshCw, Sparkles, Lightbulb } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import type { LLMName } from '../types'

// --- AI insight types --------------------------------------------------------

interface AiRec {
  title: string
  insight: string
  action: string
  engines: LLMName[]
  priority: 'critical' | 'high' | 'medium'
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rec {
  id: string
  impact: 'critical' | 'high' | 'medium'
  effort: 'low' | 'medium' | 'high'
  title: string
  why: string
  how: string[]
  fixes: LLMName[]
  timeEst: string
}

interface LLMStat {
  llm: LLMName
  total: number
  mentioned: number
  rate: number
  avgPos: number | null
}

interface CatStat {
  cat: string
  label: string
  total: number
  mentioned: number
  rate: number
}

interface CompetitorStat {
  name: string
  count: number
  avgPos: number | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LLM_LABEL: Record<string, string> = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude',
  perplexity: 'Perplexity', meta: 'Meta AI',
  google_ai: 'Google AI', copilot: 'Copilot', deepseek: 'DeepSeek', grok: 'Grok',
}

const LLM_COLOR: Record<string, string> = {
  chatgpt:    'bg-emerald-500/15 text-emerald-400',
  gemini:     'bg-blue-500/15 text-blue-400',
  claude:     'bg-violet-500/15 text-violet-400',
  perplexity: 'bg-cyan-500/15 text-cyan-400',
  meta:       'bg-amber-500/15 text-amber-400',
  google_ai:  'bg-red-500/15 text-red-400',
  copilot:    'bg-sky-500/15 text-sky-400',
  deepseek:   'bg-indigo-500/15 text-indigo-400',
  grok:       'bg-slate-500/15 text-slate-400',
}

const CATEGORY_LABEL: Record<string, string> = {
  mid: 'Mid (100-200)', large: 'Large (500+)', very_large: 'Very Large (1k+)',
  tool_discovery: 'Tool Discovery', geo_category: 'GEO / AIO', problem_based: 'Problem-based',
  general: 'General', direct_brand: 'Direct Brand',
  large_scale: 'Large Scale', corporate: 'Corporate', wedding: 'Wedding',
  galas: 'Galas & Events', quality: 'Quality & Awards', location: 'Location',
  competitive: 'Competitive', portfolio: 'Portfolio',
}

/** Per-LLM explanation of what drives its recommendations */
const LLM_SOURCE: Record<string, string> = {
  chatgpt:    'ChatGPT sources from web crawl data and Bing search — backlinks, directory listings, and well-indexed pages drive its recommendations.',
  gemini:     "Gemini is deeply integrated with Google's ecosystem — Google Business Profile, Google Maps, and Google-indexed structured data are the fastest path to appearing here.",
  claude:     'Claude sources from high-quality web content — authoritative pages, reputable citations, and clear brand descriptions help most.',
  perplexity: 'Perplexity uses real-time web search — fresh, well-indexed content on platforms it actively crawls appears fastest.',
  meta:       'Meta AI combines web search with social signals — LinkedIn company pages, Facebook presence, and web directory listings all contribute.',
  google_ai:  'Google AI uses Google Search index data — being well-indexed and having structured data on your site helps most.',
  copilot:    'Copilot leverages Bing search index — ensuring your site is crawlable and listed on Bing-indexed directories boosts visibility.',
  deepseek:   'DeepSeek sources from high-quality web content — comprehensive, well-structured pages with clear brand information perform best.',
  grok:       'Grok uses real-time web data and X/Twitter — an active social presence combined with fresh indexed content helps visibility.',
}

/** Fastest fixes per LLM (generic enough for any client) */
const LLM_QUICK_WINS: Record<string, string[]> = {
  chatgpt: [
    'Get listed on 3+ authoritative directories in your industry (Tripadvisor, Trustpilot, G2, etc.) — ChatGPT reads these directly',
    'Publish 2+ pieces of content in the past 90 days — ChatGPT weights recently indexed pages',
    'Ensure your brand name appears in page titles, H1, and the opening paragraph of your key service pages',
    'Earn 1–2 press mentions from established sites — third-party citations signal authority to ChatGPT',
  ],
  gemini: [
    'Complete your Google Business Profile 100%: all service categories, photos, a description with specific capacity or scale data',
    'Add LocalBusiness or Organization schema markup to your homepage with complete details',
    'Build 5+ citations on Google-indexed directories — Yelp, Tripadvisor, or industry-specific platforms',
    'Verify your site in Google Search Console and confirm key pages are crawled and indexed without errors',
  ],
  claude: [
    'Create a detailed About page with verifiable credentials, history, and team information',
    'Publish long-form content (800+ words) that directly answers the questions your clients ask AI',
    'Get cited in guides or articles published on established sites in your sector',
    'Add schema markup so Claude can parse your services, location, and credentials unambiguously',
  ],
  perplexity: [
    'List on Perplexity-indexed platforms: Yelp, TripAdvisor, LinkedIn, industry-specific directories',
    'Publish fresh content (blog posts, case studies, press releases) — Perplexity favors sources from the past 6 months',
    'Ensure your site is fast, mobile-friendly, and fully crawlable — Perplexity scores page quality',
    'Secure 2–3 mentions from news sites or industry blogs published recently',
  ],
  meta: [
    'Complete your LinkedIn Company Page: description, services, specialties, and company size — Meta AI reads LinkedIn directly',
    'Ensure your Facebook Business Page is complete if relevant to your audience',
    'List on web directories Meta AI crawls: Trustpilot, Capterra, local and industry business directories',
    'Publish LinkedIn content mentioning your key services — these surface in Meta AI responses',
  ],
  google_ai: [
    'Ensure your site is fully indexed in Google Search Console with no crawl errors',
    'Complete your Google Business Profile with all categories, services, and photos',
    'Add structured data (Organization, LocalBusiness) to your homepage',
    'Earn backlinks from authoritative, Google-trusted domains in your industry',
  ],
  copilot: [
    'Submit your site to Bing Webmaster Tools and verify indexing',
    'List on Bing-indexed directories and review platforms',
    'Ensure your site loads quickly and is mobile-friendly',
    'Publish clear, factual content about your brand and services',
  ],
  deepseek: [
    'Publish comprehensive, well-structured content about your brand and services',
    'Ensure your site has clear navigation and is easy to crawl',
    'Build authoritative backlinks from established industry publications',
    'Create a dedicated About page with verifiable company information',
  ],
  grok: [
    'Maintain an active presence on X (Twitter) with regular updates about your brand',
    'Ensure your site is indexed and well-structured for web search',
    'Publish timely content and news updates — Grok weights recency',
    'Earn mentions in recently published online articles and news sites',
  ],
}

const IMPACT_STYLE = {
  critical: { badge: 'bg-red-500/15 text-red-400 border border-red-500/20',       icon: <AlertTriangle size={13} />, label: 'Critical'      },
  high:     { badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/20', icon: <Zap size={13} />,           label: 'High Impact'  },
  medium:   { badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',    icon: <TrendingUp size={13} />,    label: 'Medium Impact' },
}

// ─── Stats computation ────────────────────────────────────────────────────────

function computeStats(aiResults: any[], prompts: any[], brandName: string, activeLLMs: LLMName[]) {
  // Filter results to only active engines before computing anything
  const filtered = aiResults.filter(r => activeLLMs.includes(r.llm as LLMName))

  // Per-LLM
  const llmMap: Record<string, { total: number; mentioned: number; positions: number[] }> = {}
  for (const r of filtered) {
    if (!llmMap[r.llm]) llmMap[r.llm] = { total: 0, mentioned: 0, positions: [] }
    llmMap[r.llm].total++
    if (r.brand_mentioned) {
      llmMap[r.llm].mentioned++
      if (r.brand_position) llmMap[r.llm].positions.push(r.brand_position)
    }
  }
  const llmStats: LLMStat[] = activeLLMs
    .map(llm => {
      const s = llmMap[llm] ?? { total: 0, mentioned: 0, positions: [] }
      const avgPos = s.positions.length > 0
        ? Math.round(s.positions.reduce((a: number, b: number) => a + b, 0) / s.positions.length * 10) / 10
        : null
      return { llm, ...s, rate: s.total > 0 ? s.mentioned / s.total : 0, avgPos }
    })
    .filter(s => s.total > 0)

  // Per-category
  const promptMap = new Map(prompts.map((p: any) => [p.id, p]))
  const catMap: Record<string, { total: number; mentioned: number }> = {}
  for (const r of filtered) {
    const prompt: any = promptMap.get(r.prompt_id)
    if (!prompt?.category) continue
    const cat = prompt.category
    if (!catMap[cat]) catMap[cat] = { total: 0, mentioned: 0 }
    catMap[cat].total++
    if (r.brand_mentioned) catMap[cat].mentioned++
  }
  const catStats: CatStat[] = Object.entries(catMap)
    .map(([cat, { total, mentioned }]) => ({
      cat,
      label: CATEGORY_LABEL[cat] ?? cat,
      total,
      mentioned,
      rate: total > 0 ? mentioned / total : 0,
    }))
    .sort((a, b) => a.rate - b.rate)

  // Competitors — from actual ranked results only
  // Must match GENERIC_TOKENS in Competitors.tsx and NOT_A_COMPANY in collect functions
  const GENERIC_TOKENS = [
    'experienta', 'experiență', 'recomandare', 'capacitate', 'planificare',
    'infrastructur', 'specializare', 'diversitate', 'acoperire', 'competitivitate',
    'masiva', 'masivă', 'proprie', 'proprii',
    ' pentru ', 'datorit', 'grație', 'gratie',
    'options', 'providers', 'vendors', 'services', 'alternatives', 'solutions',
    'alte ', 'altele', 'optiuni', 'opțiuni', 'furnizori', 'companii de',
    'firme de', 'si altele', 'și altele',
  ]
  const isCompanyName = (name: string) => {
    if (!name || name.length < 2 || name.length > 60) return false
    const lower = name.toLowerCase()
    if (GENERIC_TOKENS.some(t => lower.includes(t))) return false
    return /[a-zA-ZăâîșțÎȘȚĂÂ]/.test(name)
  }

  const compMap: Record<string, { count: number; positions: number[] }> = {}
  for (const r of filtered) {
    try {
      const comps = JSON.parse(r.competitors_mentioned || '[]')
      if (!Array.isArray(comps)) continue
      for (const c of comps) {
        const name = typeof c === 'string' ? c : c?.name
        const pos  = typeof c === 'object' ? c?.pos : null
        if (!isCompanyName(name)) continue
        const key = name.toLowerCase().trim()
        if (!compMap[key]) compMap[key] = { count: 0, positions: [] }
        compMap[key].count++
        if (pos) compMap[key].positions.push(pos)
      }
    } catch { /* malformed JSON */ }
  }
  const competitors: CompetitorStat[] = Object.entries(compMap)
    .map(([key, { count, positions }]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count,
      avgPos: positions.length > 0
        ? Math.round(positions.reduce((a: number, b: number) => a + b, 0) / positions.length * 10) / 10
        : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // Overall brand position
  const allPositions = filtered
    .filter(r => r.brand_mentioned && r.brand_position)
    .map(r => r.brand_position as number)
  const avgBrandPos = allPositions.length > 0
    ? Math.round(allPositions.reduce((a, b) => a + b, 0) / allPositions.length * 10) / 10
    : null

  const totalChecks    = filtered.length
  const totalMentioned = filtered.filter(r => r.brand_mentioned).length
  const overallRate    = totalChecks > 0 ? totalMentioned / totalChecks : 0

  return { llmStats, catStats, competitors, avgBrandPos, totalChecks, totalMentioned, overallRate, brandName }
}

// ─── Rec generators ───────────────────────────────────────────────────────────

function generateRecs(data: ReturnType<typeof computeStats>): Rec[] {
  const { llmStats, catStats, competitors, avgBrandPos, brandName, totalChecks, overallRate } = data
  if (totalChecks === 0) return []

  const recs: Rec[] = []
  const gapLLMs     = llmStats.filter(s => s.rate < 0.5)
  const zeroLLMs    = llmStats.filter(s => s.rate === 0)
  const partialLLMs = llmStats.filter(s => s.rate >= 0.5 && s.rate < 0.85)
  const weakCats    = catStats.filter(s => s.rate < 0.5)
  const topComp     = competitors[0] ?? null
  const secondComp  = competitors[1] ?? null

  // 1. Zero-visibility LLMs (critical, one rec per engine, max 2)
  for (const s of zeroLLMs.slice(0, 2)) {
    recs.push({
      id: `zero-${s.llm}`,
      impact: 'critical',
      effort: 'low',
      title: `${brandName} is invisible on ${LLM_LABEL[s.llm]} — 0% across ${s.total} prompts`,
      why: `Not a single one of your ${s.total} tracked prompts results in a mention on ${LLM_LABEL[s.llm]}. ${LLM_SOURCE[s.llm]}`,
      how: LLM_QUICK_WINS[s.llm],
      fixes: [s.llm],
      timeEst: '2–4h',
    })
  }

  // 2. Weakest category below 40%
  const weakestCat = weakCats[0] ?? null
  if (weakestCat && weakestCat.rate < 0.4) {
    const compHint = topComp
      ? ` ${topComp.name} is the most frequent alternative AI recommends for these queries.`
      : ''
    recs.push({
      id: `weak-cat-${weakestCat.cat}`,
      impact: gapLLMs.length >= 2 ? 'critical' : 'high',
      effort: 'medium',
      title: `"${weakestCat.label}" category: ${Math.round(weakestCat.rate * 100)}% visibility (${weakestCat.mentioned}/${weakestCat.total} checks)`,
      why: `Your lowest-performing category by mention rate.${compHint} Every missed mention here is a potential client being sent to a competitor.`,
      how: [
        `Read the prompts in the "${weakestCat.label}" category — these are the exact questions real clients type into AI about your services`,
        `Create or expand content that directly answers each of those prompts: dedicated service pages, case studies, or FAQ entries`,
        `Include specific, verifiable details in the content (capacity, pricing range, certifications, past event references) — AI engines prioritize specificity`,
        weakCats.length > 1
          ? `Also check "${weakCats[1].label}" (${Math.round(weakCats[1].rate * 100)}%) — your second weakest category`
          : `Once "${weakestCat.label}" is addressed, re-run collection to measure the improvement`,
      ],
      fixes: gapLLMs.map(s => s.llm),
      timeEst: '4–8h',
    })
  }

  // 3. Top competitor gap (if competitor appears 3+ times)
  if (topComp && topComp.count >= 3) {
    const posText   = topComp.avgPos ? ` at an average position of #${topComp.avgPos}` : ''
    const secText   = secondComp && secondComp.count >= 2 ? ` ${secondComp.name} is the second most common (${secondComp.count}×).` : ''
    recs.push({
      id: 'top-competitor',
      impact: 'high',
      effort: 'medium',
      title: `${topComp.name} appears${posText} in ${topComp.count} responses where ${brandName} is absent`,
      why: `${topComp.name} is the most frequently recommended alternative across your tracked prompts.${secText} Closing this gap is the most direct path to recapturing those AI recommendations.`,
      how: [
        `Audit ${topComp.name}'s website: which pages do they have that you don't? (service pages, case studies, certifications, FAQ)`,
        `Identify which of your prompts ${topComp.name} appears in — those topics are your highest-priority content gaps`,
        `Create content that directly targets the prompts where ${topComp.name} ranks and you don't`,
        `Build citations from the same directories and publications that mention ${topComp.name}`,
        secondComp
          ? `Repeat the analysis for ${secondComp.name} (appears ${secondComp.count}×) once you've addressed the primary gap`
          : `After closing the content gap, re-run collection to see if ${topComp.name}'s lead shrinks`,
      ],
      fixes: gapLLMs.length > 0 ? gapLLMs.map(s => s.llm) : llmStats.map(s => s.llm),
      timeEst: '6–12h',
    })
  }

  // 4. Position improvement — mentioned but ranked low
  if (avgBrandPos && avgBrandPos > 2.5) {
    const lowPosLLMs = llmStats.filter(s => s.avgPos !== null && s.avgPos > 2.5)
    recs.push({
      id: 'position-improve',
      impact: 'high',
      effort: 'medium',
      title: `Mentioned but ranked #${avgBrandPos} on average — push into top 2`,
      why: `Being in the AI response is good — being first is significantly better. Clients and users act on the first 1–2 recommendations far more than position #3+. ${lowPosLLMs.length > 0 ? `${lowPosLLMs.map(s => LLM_LABEL[s.llm]).join(' and ')} rank you lowest.` : ''}`,
      how: [
        `Review the response snippets in the AI Visibility tab for prompts where you appear at position #3 or lower — what brands are above you?`,
        `Add more verifiable, specific data to your content: exact numbers, awards, certifications, named client references`,
        `Increase citation volume from authoritative sources — each new credible mention raises your authority score`,
        `Ensure your brand name and core value proposition appear in the first 100 words of your key landing pages`,
        `Add or improve structured schema markup so AI can parse your entity clearly alongside competitors`,
      ],
      fixes: lowPosLLMs.map(s => s.llm),
      timeEst: '4–8h',
    })
  }

  // 5. Partial LLM coverage (50–85%)
  if (partialLLMs.length > 0 && zeroLLMs.length === 0) {
    const names = partialLLMs.map(s => `${LLM_LABEL[s.llm]} (${Math.round(s.rate * 100)}%)`).join(', ')
    recs.push({
      id: 'partial-llms',
      impact: 'medium',
      effort: 'low',
      title: `Inconsistent coverage on ${names}`,
      why: `You appear in some prompts on these engines but not others. This means your brand is recognized, but not authoritative enough across all query types. Targeted content in your weaker categories typically closes this gap.`,
      how: [
        `Filter AI Visibility by each underperforming category and note which engine misses you most`,
        `Ensure your brand name, core services, and key differentiators appear in page titles and H1 headings — not just in body text`,
        `Add or expand schema markup (LocalBusiness, Organization, or SoftwareApplication) to help AI parse your entity clearly`,
        `Ask satisfied clients to mention you by name in reviews on indexed platforms — brand name mentions from third parties are powerful`,
      ],
      fixes: partialLLMs.map(s => s.llm),
      timeEst: '2–4h',
    })
  }

  // Sort: critical → high → medium
  return recs.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 }
    return order[a.impact] - order[b.impact]
  })
}

// ─── RecCard ──────────────────────────────────────────────────────────────────

function RecCard({ rec, defaultOpen = false }: { rec: Rec; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const imp = IMPACT_STYLE[rec.impact]

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-dark-700/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${imp.badge}`}>
              {imp.icon}{imp.label}
            </span>
            <span className={`text-xs ${rec.effort === 'low' ? 'text-emerald-400' : rec.effort === 'medium' ? 'text-amber-400' : 'text-slate-400'}`}>
              <Clock size={11} className="inline mr-0.5" />
              {rec.effort === 'low' ? 'Quick win' : rec.effort === 'medium' ? 'Medium effort' : 'High effort'} · {rec.timeEst}
            </span>
          </div>
          <div className="font-semibold text-slate-100 text-sm leading-snug">{rec.title}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {rec.fixes.map(f => (
              <span key={f} className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${LLM_COLOR[f]}`}>
                {LLM_LABEL[f]}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 mt-1 text-slate-500">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-dark-700/60">
          <div className="mt-4 mb-4 p-3.5 bg-dark-700/50 rounded-lg border border-dark-600/40">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Why this matters</div>
            <p className="text-sm text-slate-300 leading-relaxed">{rec.why}</p>
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Action steps</div>
          <ol className="space-y-2">
            {rec.how.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Recommendations() {
  const { activeClientId, activeClient, activeEngines } = useClient()
  const brandName = activeClient?.name ?? 'Your brand'

  const [stats, setStats]     = useState<ReturnType<typeof computeStats> | null>(null)
  const [recs, setRecs]       = useState<Rec[]>([])
  const [loading, setLoading] = useState(true)
  const [aiRecs, setAiRecs]   = useState<AiRec[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  // Store raw ai_results for passing to the AI function
  const [rawResults, setRawResults] = useState<any[]>([])
  const [rawPrompts, setRawPrompts] = useState<any[]>([])

  const load = async () => {
    setLoading(true)

    const [{ data: aiResults }, { data: prompts }] = await Promise.all([
      supabase
        .from('ai_results')
        .select('llm, brand_mentioned, brand_position, competitors_mentioned, prompt_id, response_snippet')
        .eq('client_id', activeClientId),
      supabase
        .from('prompts')
        .select('id, category, text')
        .eq('client_id', activeClientId)
        .eq('is_active', true),
    ])

    setRawResults(aiResults ?? [])
    setRawPrompts(prompts ?? [])
    const computed = computeStats(aiResults ?? [], prompts ?? [], brandName, activeEngines as LLMName[])
    setStats(computed)
    setRecs(generateRecs(computed))
    setLoading(false)
  }

  const generateAiInsights = async () => {
    if (!stats || rawResults.length === 0) return
    setAiLoading(true)
    setAiError(null)

    // Build engine_stats payload
    const engineStats: Record<string, any> = {}
    for (const s of stats.llmStats) {
      engineStats[s.llm] = { total: s.total, mentioned: s.mentioned, rate: s.rate, avgPos: s.avgPos }
    }

    // Collect up to 4 snippets where brand was mentioned
    const mentionedSnippets = rawResults
      .filter(r => r.brand_mentioned && r.response_snippet)
      .slice(0, 4)
      .map(r => {
        const prompt = rawPrompts.find((p: any) => p.id === r.prompt_id)
        return { engine: r.llm, prompt: prompt?.text ?? '', snippet: r.response_snippet }
      })

    // Collect up to 5 snippets where brand was absent — include top competitor name
    const absentSnippets = rawResults
      .filter(r => !r.brand_mentioned && r.response_snippet)
      .slice(0, 5)
      .map(r => {
        const prompt = rawPrompts.find((p: any) => p.id === r.prompt_id)
        let topComp: string | null = null
        try {
          const comps = JSON.parse(r.competitors_mentioned || '[]')
          topComp = comps[0]?.name ?? comps[0] ?? null
        } catch {}
        return { engine: r.llm, prompt: prompt?.text ?? '', snippet: r.response_snippet, topComp }
      })

    const payload = {
      client_id:         activeClientId,
      brand_name:        brandName,
      engine_stats:      engineStats,
      top_competitors:   stats.competitors,
      mentioned_snippets: mentionedSnippets,
      absent_snippets:   absentSnippets,
      prompts:           rawPrompts.map((p: any) => ({ text: p.text, category: p.category })),
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/generate-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const text = await res.text()
      let data: any
      try {
        data = JSON.parse(text)
      } catch {
        // Netlify returned HTML (function timeout or crash)
        console.error('[GenRec] non-JSON response:', res.status, text.slice(0, 300))
        throw new Error(
          res.status === 524 || res.status === 502
            ? 'The analysis timed out — try again in a moment'
            : `Function error (HTTP ${res.status}) — check Netlify logs`
        )
      }
      if (data.error) {
        setAiError(data.error)
      } else {
        setAiRecs(data.recommendations ?? [])
      }
    } catch (e: any) {
      setAiError(e.message ?? 'Network error')
    }
    setAiLoading(false)
  }

  useEffect(() => { load() }, [activeClientId, brandName, activeEngines.join(',')])

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading recommendations…</div>

  const overallPct  = stats ? Math.round(stats.overallRate * 100) : 0
  const gapLLMCount = stats?.llmStats.filter(s => s.rate < 0.5).length ?? 0

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Recommendations</h1>
            {recs.length > 0 && (
              <span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-medium">
                {recs.length} action{recs.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Generated from {stats?.totalChecks ?? 0} real AI checks — no generic advice.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-dark-700 text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* No data state */}
      {(stats?.totalChecks ?? 0) === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Target size={40} className="mx-auto mb-3 opacity-20" />
          <div className="text-sm font-medium mb-1">No AI results yet</div>
          <div className="text-xs">Run a collection from the AI Visibility tab to generate recommendations.</div>
        </div>
      ) : (
        <>
          {/* LLM score grid */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
              {stats.llmStats.map(s => (
                <div key={s.llm} className="bg-dark-800 border border-dark-700 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">{LLM_LABEL[s.llm]}</div>
                  <div className={`text-lg font-bold ${s.rate >= 0.85 ? 'text-emerald-400' : s.rate >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                    {Math.round(s.rate * 100)}%
                  </div>
                  {s.avgPos !== null && (
                    <div className="text-[10px] text-slate-600 mt-0.5">avg #{s.avgPos}</div>
                  )}
                  <div className="flex justify-center mt-1">
                    {s.rate >= 0.85
                      ? <CheckCircle size={13} className="text-emerald-500" />
                      : <AlertTriangle size={13} className={s.rate < 0.5 ? 'text-red-500' : 'text-amber-500'} />
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Competitor context */}
          {stats && stats.competitors.length > 0 && (
            <div className="mb-6 p-4 bg-dark-800 border border-dark-700 rounded-xl">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Top competitors in AI responses</div>
              <div className="flex flex-wrap gap-2">
                {stats.competitors.map(c => (
                  <div key={c.name} className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <Target size={10} className="text-red-400 shrink-0" />
                    <span className="text-xs font-medium text-red-300">{c.name}</span>
                    <span className="text-[10px] text-red-500/60">{c.count}×</span>
                    {c.avgPos && <span className="text-[10px] text-slate-600">avg #{c.avgPos}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status banner */}
          {gapLLMCount === 0 && overallPct >= 85 ? (
            <div className="mb-6 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl flex gap-3">
              <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-emerald-300 mb-0.5">Strong AI visibility</div>
                <p className="text-xs text-slate-400">All engines are above threshold. Focus on improving your average position and expanding to new prompt categories.</p>
              </div>
            </div>
          ) : gapLLMCount > 0 ? (
            <div className="mb-6 p-4 bg-red-500/8 border border-red-500/20 rounded-xl flex gap-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-red-300 mb-0.5">
                  {gapLLMCount} engine{gapLLMCount !== 1 ? 's' : ''} below 50% — address these first
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Overall visibility: {overallPct}%. The recommendations below are ordered by impact — fix critical gaps first.
                </p>
              </div>
            </div>
          ) : null}

          {/* AI-generated insights */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-violet-400" />
                <span className="text-sm font-semibold text-slate-200">AI Analysis</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">
                  Claude
                </span>
              </div>
              <button
                onClick={generateAiInsights}
                disabled={aiLoading || rawResults.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 border border-violet-500/20 transition-colors disabled:opacity-50"
              >
                <Sparkles size={12} className={aiLoading ? 'animate-spin' : ''} />
                {aiLoading ? 'Analysing…' : aiRecs.length > 0 ? 'Regenerate' : 'Generate insights'}
              </button>
            </div>

            {aiLoading && (
              <div className="bg-dark-800 border border-violet-500/20 rounded-xl p-5 text-sm text-slate-400 animate-pulse">
                Claude is reading your actual AI responses and competitor data…
              </div>
            )}

            {aiError && !aiLoading && (
              <div className="bg-dark-800 border border-red-500/20 rounded-xl p-4 text-xs text-red-400">
                Error generating insights: {aiError}
              </div>
            )}

            {!aiLoading && aiRecs.length === 0 && !aiError && (
              <div className="bg-dark-800 border border-dark-700 border-dashed rounded-xl p-5 text-center text-sm text-slate-600">
                Click "Generate insights" — Claude will read your actual response snippets and competitor data to produce specific, evidence-based advice.
              </div>
            )}

            {aiRecs.length > 0 && !aiLoading && (
              <div className="space-y-3">
                {aiRecs.map((rec, i) => {
                  const imp = rec.priority === 'critical'
                    ? { badge: 'bg-red-500/15 text-red-400 border border-red-500/20', label: 'Critical' }
                    : rec.priority === 'high'
                    ? { badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/20', label: 'High Impact' }
                    : { badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20', label: 'Medium' }
                  return (
                    <div key={i} className="bg-dark-800 border border-violet-500/15 rounded-xl p-5">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${imp.badge}`}>
                          {imp.label}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/15">
                          <Lightbulb size={9} className="inline mr-0.5" />AI insight
                        </span>
                        {(rec.engines ?? []).map(e => (
                          <span key={e} className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${LLM_COLOR[e] ?? ''}`}>
                            {LLM_LABEL[e] ?? e}
                          </span>
                        ))}
                      </div>
                      <div className="font-semibold text-slate-100 text-sm mb-3">{rec.title}</div>
                      <div className="p-3 bg-dark-700/50 rounded-lg border border-dark-600/40 mb-3">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">What the data shows</div>
                        <p className="text-sm text-slate-300 leading-relaxed">{rec.insight}</p>
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Action</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{rec.action}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Rule-based recs */}
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-400">Priority actions</span>
          </div>

          {recs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <CheckCircle size={32} className="mx-auto mb-3 opacity-30" />
              No priority actions right now — keep running monthly collections to track trends.
            </div>
          ) : (
            <div className="space-y-3">
              {recs.map((rec, i) => (
                <RecCard key={rec.id} rec={rec} defaultOpen={i === 0} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
