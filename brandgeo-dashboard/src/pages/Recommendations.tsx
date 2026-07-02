import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, Zap, Target, TrendingUp } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import type { LLMName } from '../types'

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

// ─── Static recommendation catalogue ──────────────────────────────────────────
const ALL_RECS: Rec[] = [
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LLM_LABEL: Record<LLMName, string> = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude',
  perplexity: 'Perplexity', meta: 'Meta AI',
}
const LLM_COLOR: Record<LLMName, string> = {
  chatgpt: 'bg-emerald-500/15 text-emerald-400',
  gemini:  'bg-red-500/15 text-red-400',
  claude:  'bg-violet-500/15 text-violet-400',
  perplexity: 'bg-sky-500/15 text-sky-400',
  meta:    'bg-orange-500/15 text-orange-400',
}
const IMPACT_STYLE = {
  critical: { badge: 'bg-red-500/15 text-red-400 border border-red-500/20',   icon: <AlertTriangle size={13} />, label: 'Critical' },
  high:     { badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/20', icon: <Zap size={13} />,          label: 'High Impact' },
  medium:   { badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',   icon: <TrendingUp size={13} />,   label: 'Medium Impact' },
}
const EFFORT_LABEL = { low: 'Efort mic', medium: 'Efort mediu', high: 'Efort mare' }
const EFFORT_COLOR = {
  low:    'text-emerald-400',
  medium: 'text-amber-400',
  high:   'text-slate-400',
}

function relevantRecs(scores: LLMScore[]): Rec[] {
  const gapLlms = new Set(scores.filter(s => s.rate < 0.5).map(s => s.llm))
  const partialLlms = new Set(scores.filter(s => s.rate >= 0.5 && s.rate < 0.85).map(s => s.llm))

  return ALL_RECS.filter(r => {
    const fixesCritical = r.fixes.some(f => gapLlms.has(f))
    const fixesPartial  = r.fixes.some(f => partialLlms.has(f))
    if (r.impact === 'critical') return fixesCritical
    if (r.impact === 'high')     return fixesCritical || fixesPartial
    if (r.impact === 'medium')   return fixesCritical || fixesPartial
    return false
  })
}

// ─── Component ────────────────────────────────────────────────────────────────
function RecCard({ rec, defaultOpen = false }: { rec: Rec; defaultOpen?: boolean }) {
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
            <span className={`text-xs ${EFFORT_COLOR[rec.effort]}`}>
              <Clock size={11} className="inline mr-0.5" />{EFFORT_LABEL[rec.effort]} · {rec.timeEst}
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
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">De ce contează</div>
            <p className="text-sm text-slate-300 leading-relaxed">{rec.why}</p>
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Pași concreți</div>
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
  const [scores, setScores]   = useState<LLMScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (isDemoMode) {
        // Demo: simulate realistic gaps
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
  }, [])

  const recs = relevantRecs(scores)
  const gapCount = scores.filter(s => s.rate < 0.5).length
  const overallRate = scores.length
    ? Math.round(scores.reduce((s, x) => s + x.rate, 0) / scores.length * 100)
    : 0

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-slate-100">Recomandări</h1>
          <span className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-medium">
            {recs.length} acțiuni
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Acțiuni prioritizate pentru a crește vizibilitatea AI — ordonate după impact
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Se analizează datele...</div>
      ) : (
        <>
          {/* Gap summary */}
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
                  {gapCount === 1 ? '1 platformă AI' : `${gapCount} platforme AI`} cu vizibilitate critică
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vizibilitate medie actuală: <strong className="text-slate-200">{overallRate}%</strong>.
                  Acțiunile de mai jos sunt ordonate după impactul estimat — cele marcate <em>Critical</em> rezolvă cea mai mare parte din gap în cel mai scurt timp.
                </p>
              </div>
            </div>
          )}

          {gapCount === 0 && (
            <div className="mb-6 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl flex gap-3">
              <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-emerald-300 mb-0.5">Vizibilitate bună pe toate platformele</div>
                <p className="text-xs text-slate-400">Acțiunile de mai jos te ajută să îmbunătățești pozițiile și să menții avantajul față de concurenți.</p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Target size={32} className="mx-auto mb-3 opacity-30" />
              Nu sunt suficiente date pentru recomandări. Rulează colectarea LLM mai întâi.
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
