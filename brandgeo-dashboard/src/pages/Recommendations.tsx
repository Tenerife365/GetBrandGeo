import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, Zap, Target, TrendingUp } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import type { LLMName } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LLMScore { llm: LLMName; total: number; mentioned: number; rate: number }

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

// ─── BpR recommendation catalogue (Romanian) ─────────────────────────────────
const ALL_RECS_BPR: Rec[] = [
  {
    id: 'gbp',
    impact: 'critical',
    effort: 'low',
    title: 'Optimizează Google Business Profile complet',
    why: 'Gemini este construit pe datele Google. Un GBP incomplet este cauza principală a absenței totale pe Gemini — nu contează cât de bun ești dacă Google nu știe ce servicii oferi.',
    how: [
      'Adaugă categoria principală "Catering" + categorii secundare: "Servicii organizare evenimente", "Catering corporate"',
      'Completează câmpul "Descriere" cu capacitate explicită: "18.000 invitați/zi, 500 mp bucătărie, certificare FSSC 22000"',
      'Adaugă TOATE serviciile: catering corporate, nuntă, gală, conferință, festival, outdoor, bufet suedez, servit la masă',
      'Setează aria de servicii: București + județe (Sibiu, Constanța, Brașov, Ilfov)',
      'Încarcă minim 20 de fotografii recente cu evenimente mari (nu doar mâncare)',
    ],
    fixes: ['gemini'],
    timeEst: '2–3h',
  },
  {
    id: 'service-pages',
    impact: 'critical',
    effort: 'medium',
    title: 'Creează pagini dedicate per tip de eveniment și volum',
    why: 'Gemini și Meta AI caută pagini care răspund direct la o întrebare specifică. O pagină generică de "catering" nu apare când cineva caută "catering gală 500 persoane București".',
    how: [
      'Creează pagina /catering-nunta-bucuresti — H1: "Catering Nuntă București | Bucate pe Roate", includentă capacitate, meniu, preț/pers',
      'Creează pagina /catering-corporate-150-200-persoane — cu exemple de coffee break, business lunch, conferință',
      'Creează pagina /catering-gala-500-1000-persoane — cu referința EU Summit Sibiu, ITU Plenipotentiary, Arena Națională',
      'Creează pagina /catering-festival-outdoor — cu date concrete (4100 porții/zi, transport frigorific, bucătărie mobilă)',
      'Fiecare pagină: 600-900 cuvinte, H1/H2 cu termenul exact, FAQ la final, date verificabile',
    ],
    fixes: ['gemini', 'meta'],
    timeEst: '4–6h total',
  },
  {
    id: 'faq-schema',
    impact: 'critical',
    effort: 'medium',
    title: 'Pagină FAQ + Schema markup structurat',
    why: 'Gemini extrage răspunsuri directe din paginile FAQ cu schema markup. Dacă întrebarea "Care este cel mai bun catering pentru 1000 persoane în București?" are răspuns explicit pe site-ul tău, Gemini îl citează.',
    how: [
      'Creează /intrebari-frecvente cu 15-20 întrebări similare cu prompturile monitorizate',
      'Include întrebări ca: "Ce firmă de catering poate servi 2000 de persoane?", "Care catering are certificare FSSC 22000 în România?"',
      'Adaugă FAQPage schema JSON-LD pe pagină (cere developerului sau folosește un plugin WordPress)',
      'Adaugă LocalBusiness schema cu: name, address, areaServed, priceRange, aggregateRating, hasOfferCatalog',
      'Adaugă FoodEstablishment schema cu: servesCuisine, menu, maximumAttendeeCapacity: 18000',
    ],
    fixes: ['gemini', 'meta'],
    timeEst: '3–5h',
  },
  {
    id: 'capacity-proof',
    impact: 'high',
    effort: 'low',
    title: 'Publică dovezi de capacitate verificabile pe site',
    why: 'ChatGPT și Perplexity te citează ca #1 parțial pentru că au găsit date concrete (4100 porții/zi, Arena Națională, EU Summit). Gemini are nevoie de aceleași date structurate pe propriul tău site, nu doar menționate în presă.',
    how: [
      'Adaugă pe homepage o secțiune "Capacitate și experiență" cu cifre exacte: 18.000 invitați/zi, 500 mp bucătărie, 50+ profesioniști',
      'Creează o pagina /despre-noi#capacitate cu timeline de proiecte mari: EU Summit 2019, ITU Plenipotentiary 2022, Arena Națională 2024',
      'Adaugă certificarile vizibil: FSSC 22000, Horeca Awards 2018/2022/2025, Catering Company of the Year Lux Life Magazine UK 2019-2025',
      'Include logouri ale clienților corporate mari (dacă ai acordul lor)',
    ],
    fixes: ['gemini', 'meta', 'perplexity'],
    timeEst: '2–4h',
  },
  {
    id: 'directories',
    impact: 'high',
    effort: 'low',
    title: 'Listare în directoare de profil indexate de AI',
    why: 'Perplexity și Meta AI crawlează directoare de business pentru a valida că o firmă există și are reputație. Lipsa din aceste surse scade scorul de autoritate.',
    how: [
      'Actualizează profilul pe Soimii Gastronomiei (deja existent — completează cu capacitate și premii)',
      'Listare pe Tripadvisor Business ca "Catering Company" (nu restaurant) — adaugă categorii de servicii',
      'Listare/actualizare pe Zomato, TheFork pentru secțiunea de catering',
      'Adaugă compania pe Google Maps ca locație secundară pentru "bucătărie centrală" / "depozit catering"',
      'Completează profilul LinkedIn Company cu servicii, specialități și size (50-200 angajați)',
    ],
    fixes: ['meta', 'perplexity'],
    timeEst: '2–3h',
  },
  {
    id: 'press-backlinks',
    impact: 'medium',
    effort: 'high',
    title: 'Obține mențiuni în presă și bloguri de evenimente',
    why: 'Autoritatea de citare (câte surse credibile te menționează) este cel mai important factor pe termen lung pentru poziția în toate LLM-urile. ChatGPT și Perplexity te citează la #1 și în parte pentru că ai mențiuni credibile (Wikipedia, guerrillaradio, soimiigastronomiei).',
    how: [
      'Propune un articol despre "Catering la scară mare" pe un blog de organizare evenimente (Nunta.ro, EventsMax.ro)',
      'Trimite un comunicat de presă după fiecare eveniment major (+500 persoane) pe PR.ro sau Agerpres',
      'Solicită unui jurnalist food/business un interviu despre industria de catering la scară mare în România',
      'Publică studii de caz detaliate pe propriul blog (ex: "Cum am servit 2000 de oameni la Gala X")',
    ],
    fixes: ['gemini', 'meta', 'perplexity'],
    timeEst: '8–16h/lună',
  },
]

// ─── BrandGEO recommendation catalogue (English / SaaS) ─────────────────────
const ALL_RECS_BRANDGEO: Rec[] = [
  {
    id: 'ai-directories',
    impact: 'critical',
    effort: 'low',
    title: 'Submit to AI tool directories & aggregators',
    why: 'LLMs learn about SaaS tools primarily from aggregator sites like Futurepedia, Product Hunt, and G2. These are crawled frequently and cited directly when users ask "what\'s the best tool for AI brand monitoring." Being absent means competitors get recommended instead.',
    how: [
      'Submit to Futurepedia.io — the #1 AI tools directory crawled by all major LLMs',
      'Launch on Product Hunt with a focused pitch around "AI brand monitoring" and "GEO for SaaS"',
      'Submit to There\'s An AI For That (theresanaiforthat.com) and TopAI.tools',
      'List on AlternativeTo.net as an alternative to BrightEdge, Semrush, and Peec AI',
      'Submit to AI Tool Report newsletter (10k+ subscribers, highly cited by LLMs)',
    ],
    fixes: ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta'],
    timeEst: '2–3h',
  },
  {
    id: 'comparison-pages',
    impact: 'critical',
    effort: 'medium',
    title: 'Create "BrandGEO vs [Competitor]" comparison pages',
    why: 'ChatGPT and Perplexity frequently answer "best alternative to Peec AI" or "BrightEdge vs [X]" queries. Without comparison pages you\'re invisible in these queries — and competitors\' comparison pages mention them, not you.',
    how: [
      'Create /vs/peec-ai — "BrandGEO vs Peec AI: which tracks AI brand mentions better?"',
      'Create /vs/brightedge — "BrandGEO vs BrightEdge: GEO monitoring vs traditional SEO platform"',
      'Create /vs/semrush — "BrandGEO vs Semrush: AI visibility beyond traditional SEO"',
      'Create /vs/athenahq — "BrandGEO vs AthenaHQ: AI brand monitoring comparison"',
      'Each page: 700–1000 words, feature comparison table, clear positioning, H1 with both names',
    ],
    fixes: ['chatgpt', 'perplexity', 'meta'],
    timeEst: '5–8h total',
  },
  {
    id: 'faq-schema',
    impact: 'critical',
    effort: 'medium',
    title: 'Publish a FAQ page + SoftwareApplication schema markup',
    why: 'Gemini and ChatGPT extract answers directly from FAQ pages with schema markup. Questions like "how to monitor brand mentions in AI" or "what is GEO for SaaS" should have explicit, well-structured answers on getbrandgeo.com.',
    how: [
      'Create /faq with 15–20 questions matching tracked prompts (e.g. "Which tool monitors brand mentions in ChatGPT?")',
      'Add FAQPage schema JSON-LD — LLMs read this structure directly when generating answers',
      'Add SoftwareApplication schema to homepage: applicationCategory, description, offers, aggregateRating',
      'Add Organization schema: foundingDate, areaServed: Worldwide, sameAs → LinkedIn, Product Hunt',
      'Target: "how to track AI visibility", "what is generative engine optimization", "GEO vs SEO"',
    ],
    fixes: ['gemini', 'chatgpt', 'claude'],
    timeEst: '3–5h',
  },
  {
    id: 'g2-reviews',
    impact: 'high',
    effort: 'low',
    title: 'Get listed and reviewed on G2, Capterra & Product Hunt',
    why: 'Perplexity and ChatGPT cite G2 and Capterra when recommending SaaS tools. Even 3–5 reviews dramatically increase the chance of being recommended. These platforms also rank in Google, giving you a second AI-visible surface.',
    how: [
      'Create your G2 profile under categories: "Brand Management", "SEO Tools", "AI Analytics"',
      'Ask your first 5 clients to leave a G2 review — even short reviews trigger LLM citations',
      'Create Capterra profile: category "Marketing Analytics", "Brand Monitoring"',
      'Set up GetApp and Trustpilot profiles as secondary review surfaces',
      'After Product Hunt launch, follow up with reviewers to cross-post on G2',
    ],
    fixes: ['perplexity', 'chatgpt', 'meta'],
    timeEst: '2–4h',
  },
  {
    id: 'thought-leadership',
    impact: 'high',
    effort: 'medium',
    title: 'Publish original AI visibility research & data reports',
    why: 'LLMs heavily cite data-backed reports when answering industry questions. A "State of AI Brand Visibility" report from BrandGEO would be referenced when users ask about GEO, AI brand monitoring, or LLM marketing trends — the single highest-leverage content investment.',
    how: [
      'Publish "The State of AI Brand Visibility 2025" — use ai_results data to show industry benchmarks',
      'Write "Which brands get mentioned most in ChatGPT?" across key industry verticals',
      'Pitch guest posts to Search Engine Journal, Moz Blog, or Marketing Land about GEO vs SEO',
      'Get featured in TLDR Marketing, The Rundown AI, or Marketing Brew newsletters',
      'Create a free "AI Visibility Score" calculator — generates backlinks and captures leads',
    ],
    fixes: ['chatgpt', 'gemini', 'claude', 'perplexity'],
    timeEst: '8–16h/month',
  },
  {
    id: 'backlinks',
    impact: 'medium',
    effort: 'high',
    title: 'Build backlinks from SEO & AI marketing blogs',
    why: 'Authority signals — citations from credible sources — are a core ranking factor for all LLMs. ChatGPT and Perplexity cite sources they find via Bing/Google. Getting mentioned in authoritative SEO/marketing content is the long-term moat.',
    how: [
      'Reach out to Ahrefs, Semrush, or Moz blogs for a guest post on "AI brand monitoring"',
      'Offer to be a source for journalists covering AI marketing trends (HARO, Qwoted)',
      'Partner with GEO/AEO influencers on LinkedIn for co-created content',
      'Publish a free dataset (e.g. "Top 100 brands by AI visibility") to attract natural backlinks',
      'Submit to "Best AI marketing tools 2025" roundups on HubSpot, Buffer, Hootsuite blogs',
    ],
    fixes: ['chatgpt', 'gemini', 'perplexity', 'meta'],
    timeEst: '10–20h/month',
  },
]



// ─── Helpers ──────────────────────────────────────────────────────────────────
const LLM_LABEL: Record<LLMName, string> = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude',
  perplexity: 'Perplexity', meta: 'Meta AI',
}
const LLM_COLOR: Record<LLMName, string> = {
  chatgpt:    'bg-emerald-500/15 text-emerald-400',
  gemini:     'bg-red-500/15 text-red-400',
  claude:     'bg-violet-500/15 text-violet-400',
  perplexity: 'bg-sky-500/15 text-sky-400',
  meta:       'bg-orange-500/15 text-orange-400',
}
const IMPACT_STYLE = {
  critical: { badge: 'bg-red-500/15 text-red-400 border border-red-500/20',    icon: <AlertTriangle size={13} />, label: 'Critical'      },
  high:     { badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/20', icon: <Zap size={13} />,          label: 'High Impact'  },
  medium:   { badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',    icon: <TrendingUp size={13} />,   label: 'Medium Impact'},
}

function relevantRecs(scores: LLMScore[], recs: Rec[]): Rec[] {
  const gapLlms     = new Set(scores.filter(s => s.rate < 0.5).map(s => s.llm))
  const partialLlms = new Set(scores.filter(s => s.rate >= 0.5 && s.rate < 0.85).map(s => s.llm))
  return recs.filter(r => {
    const fixesCritical = r.fixes.some(f => gapLlms.has(f))
    const fixesPartial  = r.fixes.some(f => partialLlms.has(f))
    if (r.impact === 'critical') return fixesCritical
    if (r.impact === 'high')     return fixesCritical || fixesPartial
    if (r.impact === 'medium')   return fixesCritical || fixesPartial
    return false
  })
}

// ─── RecCard ──────────────────────────────────────────────────────────────────
function RecCard({ rec, defaultOpen = false }: {
  rec: Rec
  defaultOpen?: boolean
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(defaultOpen)
  const imp = IMPACT_STYLE[rec.impact]

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-dark-700/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${imp.badge}`}>
              {imp.icon}{imp.label}
            </span>
            <span className={`text-xs ${rec.effort === 'low' ? 'text-emerald-400' : rec.effort === 'medium' ? 'text-amber-400' : 'text-slate-400'}`}>
              <Clock size={11} className="inline mr-0.5" />{rec.effort === 'low' ? t.rec_effortLow : rec.effort === 'medium' ? t.rec_effortMedium : t.rec_effortHigh} · {rec.timeEst}
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
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t.rec_whyLabel}</div>
            <p className="text-sm text-slate-300 leading-relaxed">{rec.why}</p>
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{t.rec_stepsLabel}</div>
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
  const { activeClientId } = useClient()
  const { t } = useI18n()
  const [scores, setScores]   = useState<LLMScore[]>([])
  const [loading, setLoading] = useState(true)

  const isBrandGEO = activeClientId === 2
  const allRecs = isBrandGEO ? ALL_RECS_BRANDGEO : ALL_RECS_BPR

  useEffect(() => {
    setLoading(true)
    setScores([])

    async function load() {
      if (isDemoMode) {
        setScores([
          { llm: 'chatgpt',    total: 20, mentioned: 20, rate: 1.0 },
          { llm: 'gemini',     total: 20, mentioned: 0,  rate: 0.0 },
          { llm: 'claude',     total: 20, mentioned: 20, rate: 1.0 },
          { llm: 'perplexity', total: 20, mentioned: 20, rate: 1.0 },
          { llm: 'meta',       total: 20, mentioned: 2,  rate: 0.1 },
        ])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('ai_results')
        .select('llm, brand_mentioned')
        .eq('client_id', activeClientId)

      if (data) {
        const map: Record<string, { total: number; mentioned: number }> = {}
        for (const row of data) {
          if (!map[row.llm]) map[row.llm] = { total: 0, mentioned: 0 }
          map[row.llm].total++
          if (row.brand_mentioned) map[row.llm].mentioned++
        }
        const llms: LLMName[] = ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta']
        setScores(llms.map(llm => {
          const s = map[llm] || { total: 0, mentioned: 0 }
          return { llm, ...s, rate: s.total ? s.mentioned / s.total : 0 }
        }).filter(s => s.total > 0))
      }
      setLoading(false)
    }
    load()
  }, [activeClientId])

  const recs        = relevantRecs(scores, allRecs)
  const gapCount    = scores.filter(s => s.rate < 0.5).length
  const overallRate = scores.length
    ? Math.round(scores.reduce((s, x) => s + x.rate, 0) / scores.length * 100)
    : 0

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-slate-100">{t.nav_recommendations}</h1>
          <span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-medium">
            {recs.length} {t.rec_actions}
          </span>
        </div>
        <p className="text-sm text-slate-400">{t.rec_subtitle}</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">{t.rec_loading}</div>
      ) : (
        <>
          {/* LLM score grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {scores.map(s => (
              <div key={s.llm} className="bg-dark-800 border border-dark-700 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">{LLM_LABEL[s.llm]}</div>
                <div className={`text-lg font-bold ${s.rate >= 0.85 ? 'text-emerald-400' : s.rate >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                  {Math.round(s.rate * 100)}%
                </div>
                <div className="flex justify-center mt-1">
                  {s.rate >= 0.85
                    ? <CheckCircle size={13} className="text-emerald-500" />
                    : <AlertTriangle size={13} className={s.rate < 0.5 ? 'text-red-500' : 'text-amber-500'} />
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Context banner */}
          {gapCount > 0 && (
              <div className="mb-6 p-4 bg-red-500/8 border border-red-500/20 rounded-xl flex gap-3">
                <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-red-300 mb-0.5">
                    {gapCount === 1 ? t.rec_criticalPlatform : fmt(t.rec_criticalPlatforms, { n: gapCount })}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {fmt(t.rec_criticalBody, { rate: overallRate })}
                  </p>
                </div>
              </div>
          )}

          {gapCount === 0 && scores.length > 0 && (
            <div className="mb-6 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl flex gap-3">
              <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-emerald-300 mb-0.5">{t.rec_goodTitle}</div>
                <p className="text-xs text-slate-400">{t.rec_goodBody}</p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Target size={32} className="mx-auto mb-3 opacity-30" />
              {t.rec_empty}
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
