/**
 * Recommendations.tsx — data-driven recommendations, now with an audit trail.
 *
 * Three things changed here (Master-Recommendations, CLIENT-HEALTH-BPR.md §6):
 *
 * 1. INPUTS ARE FILTERED. The ai_results query had NO status filter and did not even
 *    select `status`, so API-failure rows (BpR: 3 x quota_exceeded) were counted as
 *    genuine non-mentions. The engine could emit "critical: 0% on ChatGPT" about an
 *    unpaid API bill. Errors are now excluded from every stat and surfaced separately.
 *
 * 2. COMPETITORS ARE SCORED BY RANKINGS, NOT BY NOISE. This page used to build its own
 *    competitor aggregation that counted `pos: 99` prose matches — names that only
 *    appear because the client seeded them into their own competitor list, never ranked
 *    by any engine — identically with real rankings. That polluted `top_competitors`
 *    before it ever reached the model. Aggregation now lives in one place
 *    (lib/competitorFilter.ts) and distinguishes the two.
 *
 * 3. ADVICE IS PERSISTED. Generation writes recommendation_runs + recommendations, so
 *    what a client was told, and when, and from what evidence, survives the page reload.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Clock, ChevronDown, ChevronUp, Zap, Target, RefreshCw, Sparkles, History, Check, X, CircleSlash,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { useResults } from '../lib/resultsContext'
import { nextSeq, isStale } from '../lib/resultsGuards'
import { buildSnapshotView } from '../lib/metrics'
import {
  buildRecommendationsStats, buildEngineErrors, buildAiSnippets, type RecommendationsStats,
} from '../lib/views/recommendationsView'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import EngineChip from '../components/EngineChip'
import SharedEmptyState from '../components/EmptyState'
import LoadErrorCard from '../components/LoadErrorCard'
import { SkeletonList } from '../components/ui/skeletons'
import {
  Page, PageHeader, SectionHeader, HeroAnswer, Card, Badge, Button, Notice, Disclosure, StatusGlyph,
  type BadgeTone,
} from '../components/ui'
import type { LLMName } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type RecStatus = 'new' | 'acknowledged' | 'actioned' | 'dismissed'

/** A persisted recommendation item (public.recommendations). */
interface StoredRec {
  id: number
  run_id: number
  position: number
  title: string
  insight: string | null
  action: string | null
  engines: string[]
  priority: 'critical' | 'high' | 'medium'
  status: RecStatus
  actioned_at: string | null
  notes: string | null
}

/** A generation batch (public.recommendation_runs). */
interface StoredRun {
  id: number
  generated_at: string
  model: string
  rec_count: number
}

/** Shape returned by the function before it is saved (only shown if the save failed). */
interface AiRec {
  title: string
  insight: string | null
  action: string | null
  engines: string[]
  priority: 'critical' | 'high' | 'medium'
}

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

// ─── Constants ────────────────────────────────────────────────────────────────

// Derived from ENGINE_META, not hand-written. This map was a sixth independent
// engine list and it drifted: several call sites below read LLM_LABEL[s.llm]
// with NO fallback, so a newly shipped engine rendered the literal string
// "undefined" into customer-facing recommendation copy. Deriving it means a new
// engine is labelled correctly the moment it is added to ENGINE_META.
const LLM_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(ENGINE_META).map(([id, m]) => [id, m.label])
)

// LLM_COLOR (a fifth independent hand-picked engine-colour map) is DELETED:
// one source (ENGINE_META[id].chartColor), never a second hand-picked map.
// EngineTag is the read-only EngineChip (swatch plus ink label). An id with no
// ENGINE_META entry (a retired engine in an old stored row) falls back to a
// neutral Badge so a missing key never crashes the page.
function EngineTag({ id, fallbackLabel }: { id: string; fallbackLabel: string }) {
  if (!ENGINE_META[id as EngineId]) return <Badge tone="neutral">{fallbackLabel}</Badge>
  return <EngineChip id={id as EngineId} interactive={false} />
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
  chatgpt:    'ChatGPT sources from web crawl data and Bing search, so backlinks, directory listings, and well-indexed pages drive its recommendations.',
  gemini:     "Gemini is deeply integrated with Google's ecosystem, so Google Business Profile, Google Maps, and Google-indexed structured data are the fastest path to appearing here.",
  claude:     'Claude sources from high-quality web content, so authoritative pages, reputable citations, and clear brand descriptions help most.',
  perplexity: 'Perplexity uses real-time web search, so fresh, well-indexed content on platforms it actively crawls appears fastest.',
  meta:       'Meta AI combines web search with social signals, so LinkedIn company pages, Facebook presence, and web directory listings all contribute.',
  google_ai:  'Google AI uses Google Search index data, so being well-indexed and having structured data on your site helps most.',
  copilot:    'Copilot reads the Bing search index, so making sure your site is crawlable and listed on Bing-indexed directories boosts visibility.',
  deepseek:   'DeepSeek sources from high-quality web content, so comprehensive, well-structured pages with clear brand information perform best.',
  grok:       'Grok uses real-time web data and X/Twitter, so an active social presence combined with fresh indexed content helps visibility.',
  ai_overview: 'Google AI Overviews summarise the ordinary Google results page, so the same signals that win classic rankings apply: being well indexed, having clear structured data, and earning citations from pages Google already trusts.',
}

/** Fastest fixes per LLM (generic enough for any client) */
// Advice that holds for any engine, used when an engine has no tailored list.
// EVERY engine in LIVE_ENGINES should really have its own entry; this exists so
// that shipping an engine and forgetting its copy degrades to something true and
// generic rather than crashing the page.
const GENERIC_QUICK_WINS: string[] = [
  'Publish a clear, factual page about what you do, who you serve and where, so an answer engine has something unambiguous to quote',
  'Add Organization or LocalBusiness schema markup with your real details, so the facts are machine readable rather than inferred',
  'Earn citations on sites the engine already trusts in your category, since answer engines lean on sources they have seen elsewhere',
  'Keep your key pages current, because stale pages get quoted less often than recently updated ones',
]

const LLM_QUICK_WINS: Record<string, string[]> = {
  chatgpt: [
    'Get listed on 3+ authoritative directories in your industry (Tripadvisor, Trustpilot, G2, and the like), because ChatGPT reads these directly',
    'Publish 2+ pieces of content in the past 90 days, since ChatGPT weights recently indexed pages',
    'Ensure your brand name appears in page titles, H1, and the opening paragraph of your key service pages',
    'Earn one or two press mentions from established sites, because third-party citations signal authority to ChatGPT',
  ],
  gemini: [
    'Complete your Google Business Profile 100%: all service categories, photos, a description with specific capacity or scale data',
    'Add LocalBusiness or Organization schema markup to your homepage with complete details',
    'Build 5+ citations on Google-indexed directories such as Yelp, Tripadvisor, or industry-specific platforms',
    'Verify your site in Google Search Console and confirm key pages are crawled and indexed without errors',
  ],
  ai_overview: [
    'Google AI Overviews are assembled from the ordinary Google index, so the fastest lever is being indexed and crawlable for the queries you care about',
    'Add FAQPage or Product schema to the pages that answer your buyers questions directly, since Overviews favour pages that already answer in a quotable form',
    'Answer one question per page section, with the question as the heading, because an Overview quotes passages rather than whole pages',
    'Earn citations from sites that already rank for your category, as Overviews draw on sources Google ranks rather than discovering new ones',
  ],
  claude: [
    'Create a detailed About page with verifiable credentials, history, and team information',
    'Publish long-form content (800+ words) that directly answers the questions your clients ask AI',
    'Get cited in guides or articles published on established sites in your sector',
    'Add schema markup so Claude can parse your services, location, and credentials unambiguously',
  ],
  perplexity: [
    'List on Perplexity-indexed platforms: Yelp, TripAdvisor, LinkedIn, industry-specific directories',
    'Publish fresh content (blog posts, case studies, press releases), because Perplexity favours sources from the past 6 months',
    'Ensure your site is fast, mobile-friendly, and fully crawlable, since Perplexity scores page quality',
    'Secure two or three mentions from news sites or industry blogs published recently',
  ],
  meta: [
    'Complete your LinkedIn Company Page with description, services, specialties, and company size, because Meta AI reads LinkedIn directly',
    'Ensure your Facebook Business Page is complete if relevant to your audience',
    'List on web directories Meta AI crawls: Trustpilot, Capterra, local and industry business directories',
    'Publish LinkedIn content mentioning your key services, since these surface in Meta AI responses',
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
    'Publish timely content and news updates, since Grok weights recency',
    'Earn mentions in recently published online articles and news sites',
  ],
}

// Impact is a neutral Badge with a bolt glyph (spec 11.6); the word carries the severity.
const IMPACT_LABEL: Record<'critical' | 'high' | 'medium', string> = {
  critical: 'Critical',
  high:     'High impact',
  medium:   'Medium impact',
}

const STATUS_STYLE: Record<RecStatus, { tone: BadgeTone; label: string }> = {
  new:          { tone: 'neutral', label: 'New'          },
  acknowledged: { tone: 'accent',  label: 'Acknowledged' },
  actioned:     { tone: 'pos',     label: 'Actioned'     },
  dismissed:    { tone: 'neutral', label: 'Dismissed'    },
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

// ─── Rec generators ───────────────────────────────────────────────────────────

function generateRecs(data: RecommendationsStats): Rec[] {
  const { llmStats, catStats, competitors, avgBrandPos, brandName, totalChecks } = data
  if (totalChecks === 0) return []

  const recs: Rec[] = []
  const gapLLMs     = llmStats.filter(s => s.rate < 0.5)
  const zeroLLMs    = llmStats.filter(s => s.rate === 0)
  const partialLLMs = llmStats.filter(s => s.rate >= 0.5 && s.rate < 0.85)
  const weakCats    = catStats.filter(s => s.rate < 0.5)

  // Only a GENUINELY RANKED competitor can be described as beating the brand. A
  // prose-only name was never ranked by any engine — it is on the board solely because
  // the client seeded it. (BpR's "Elegant Catering": 14 mentions, 0 rankings, #2 on the
  // leaderboard. CLIENT-HEALTH-BPR.md §4.5.)
  const ranked      = competitors.filter(c => !c.proseOnly)
  const topComp     = ranked[0] ?? null
  const secondComp  = ranked[1] ?? null

  // 1. Zero-visibility LLMs (critical, one rec per engine, max 2)
  for (const s of zeroLLMs.slice(0, 2)) {
    recs.push({
      id: `zero-${s.llm}`,
      impact: 'critical',
      effort: 'low',
      title: `${brandName} is invisible on ${LLM_LABEL[s.llm]}: 0% across ${s.total} prompts`,
      why: `Not a single one of your ${s.total} tracked prompts results in a mention on ${LLM_LABEL[s.llm]}. ${LLM_SOURCE[s.llm]}`,
      // ?? GENERIC_QUICK_WINS is load-bearing, not defensive habit. `how` is
      // rendered with rec.how.map(), this card is `critical` so it sorts first
      // and renders defaultOpen, and there is no ErrorBoundary anywhere in
      // src/. A missing key here is not a blank section, it is a white screen
      // on the page a customer opens to find out what to do next.
      how: LLM_QUICK_WINS[s.llm] ?? GENERIC_QUICK_WINS,
      fixes: [s.llm],
      timeEst: '2 to 4h',
    })
  }

  // 2. Weakest category below 40%
  const weakestCat = weakCats[0] ?? null
  if (weakestCat && weakestCat.rate < 0.4) {
    const compHint = topComp
      ? ` ${topComp.name} is the alternative AI engines rank most often for these queries.`
      : ''
    recs.push({
      id: `weak-cat-${weakestCat.cat}`,
      impact: gapLLMs.length >= 2 ? 'critical' : 'high',
      effort: 'medium',
      title: `"${weakestCat.label}" category: ${Math.round(weakestCat.rate * 100)}% visibility (${weakestCat.mentioned}/${weakestCat.total} checks)`,
      why: `Your lowest-performing category by mention rate.${compHint} Every missed mention here is a potential client being sent to a competitor.`,
      how: [
        `Read the prompts in the "${weakestCat.label}" category, because these are the exact questions real clients type into AI about your services`,
        `Create or expand content that directly answers each of those prompts: dedicated service pages, case studies, or FAQ entries`,
        `Include specific, verifiable details in the content (capacity, pricing range, certifications, past event references), because AI engines prioritise specificity`,
        weakCats.length > 1
          ? `Also check "${weakCats[1].label}" at ${Math.round(weakCats[1].rate * 100)}%, your second weakest category`
          : `Once "${weakestCat.label}" is addressed, re-run collection to measure the improvement`,
      ],
      fixes: gapLLMs.map(s => s.llm),
      timeEst: '4 to 8h',
    })
  }

  // 3. Top competitor gap — fires on RANKED appearances only, never on prose matches.
  if (topComp && topComp.rankedMentions >= 3) {
    const posText = topComp.avgPos ? ` at an average rank of #${topComp.avgPos}` : ''
    const secText = secondComp && secondComp.rankedMentions >= 2
      ? ` ${secondComp.name} is the second most often ranked (${secondComp.rankedMentions}×).`
      : ''
    recs.push({
      id: 'top-competitor',
      impact: 'high',
      effort: 'medium',
      title: `${topComp.name} is ranked${posText} in ${topComp.rankedMentions} responses`,
      why: `${topComp.name} is the alternative AI engines rank most often across your tracked prompts.${secText} Closing this gap is the most direct path to recapturing those AI recommendations.`,
      how: [
        `Audit ${topComp.name}'s website: which pages do they have that you don't? (service pages, case studies, certifications, FAQ)`,
        `Identify which of your prompts ${topComp.name} appears in, because those topics are your highest-priority content gaps`,
        `Create content that directly targets the prompts where ${topComp.name} ranks and you don't`,
        `Build citations from the same directories and publications that mention ${topComp.name}`,
        secondComp
          ? `Repeat the analysis for ${secondComp.name} (ranked ${secondComp.rankedMentions}×) once you've addressed the primary gap`
          : `After closing the content gap, re-run collection to see if ${topComp.name}'s lead shrinks`,
      ],
      fixes: gapLLMs.length > 0 ? gapLLMs.map(s => s.llm) : llmStats.map(s => s.llm),
      timeEst: '6 to 12h',
    })
  }

  // 4. Position improvement — mentioned but ranked low
  if (avgBrandPos && avgBrandPos > 2.5) {
    const lowPosLLMs = llmStats.filter(s => s.avgPos !== null && s.avgPos > 2.5)
    recs.push({
      id: 'position-improve',
      impact: 'high',
      effort: 'medium',
      title: `Mentioned but ranked #${avgBrandPos} on average, so push into the top 2`,
      why: `Being in the AI response is good. Being first is significantly better. Clients and users act on the first one or two recommendations far more than on position #3 and below. ${lowPosLLMs.length > 0 ? `${lowPosLLMs.map(s => LLM_LABEL[s.llm]).join(' and ')} rank you lowest.` : ''}`,
      how: [
        `Review the response snippets in the AI Visibility tab for prompts where you appear at position #3 or lower, and note what brands are above you`,
        `Add more verifiable, specific data to your content: exact numbers, awards, certifications, named client references`,
        `Increase citation volume from authoritative sources, since each new credible mention raises your authority score`,
        `Ensure your brand name and core value proposition appear in the first 100 words of your key landing pages`,
        `Add or improve structured schema markup so AI can parse your entity clearly alongside competitors`,
      ],
      fixes: lowPosLLMs.map(s => s.llm),
      timeEst: '4 to 8h',
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
        `Ensure your brand name, core services, and key differentiators appear in page titles and H1 headings, not just in body text`,
        `Add or expand schema markup (LocalBusiness, Organization, or SoftwareApplication) to help AI parse your entity clearly`,
        `Ask satisfied clients to mention you by name in reviews on indexed platforms, because brand name mentions from third parties carry a lot of weight`,
      ],
      fixes: partialLLMs.map(s => s.llm),
      timeEst: '2 to 4h',
    })
  }

  return recs.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 }
    return order[a.impact] - order[b.impact]
  })
}

// ─── RecCard (rule-based) ─────────────────────────────────────────────────────

function RecCard({ rec, defaultOpen = false }: { rec: Rec; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const effortLabel = rec.effort === 'low' ? 'Quick win' : rec.effort === 'medium' ? 'Medium effort' : 'High effort'

  return (
    <Card pad="none">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-start gap-4 p-4 md:p-5 text-left rounded-card hover:bg-surface-2 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge tone="neutral" glyph={<Zap size={12} aria-hidden="true" />}>{IMPACT_LABEL[rec.impact]}</Badge>
            <span className="inline-flex items-center gap-1 text-meta text-ink-3">
              <Clock size={12} aria-hidden="true" />
              {effortLabel} · {rec.timeEst}
            </span>
          </div>
          <div className="text-body font-semibold text-ink leading-snug">{rec.title}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {rec.fixes.map(f => (
              <EngineTag key={f} id={f} fallbackLabel={LLM_LABEL[f] ?? f} />
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 mt-1 text-ink-3" aria-hidden="true">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div id={panelId} className="px-4 md:px-5 pb-5 border-t border-line">
          <div className="mt-4 mb-4 p-3.5 bg-surface-2 rounded-control">
            <div className="text-meta text-ink-3 mb-1">Why this matters</div>
            <p className="text-body text-ink-2 leading-relaxed">{rec.why}</p>
          </div>
          <div className="text-meta text-ink-3 mb-2">Action steps</div>
          <ol className="space-y-2">
            {rec.how.map((step, i) => (
              <li key={i} className="flex gap-3 text-body text-ink-2 leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-3 text-ink flex items-center justify-center text-meta font-semibold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  )
}

// ─── Stored AI rec card (with workflow status) ────────────────────────────────

function StoredRecCard({
  rec, canEdit, onStatus,
}: {
  rec: StoredRec
  canEdit: boolean
  onStatus: (id: number, status: RecStatus) => void
}) {
  const st  = STATUS_STYLE[rec.status]
  const dim = rec.status === 'dismissed'

  return (
    <Card className={dim ? 'opacity-60' : ''}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Badge tone="neutral" glyph={<Zap size={12} aria-hidden="true" />}>{IMPACT_LABEL[rec.priority]}</Badge>
        <Badge tone={st.tone}>{st.label}</Badge>
        {(rec.engines ?? []).map(e => (
          <EngineTag key={e} id={e} fallbackLabel={LLM_LABEL[e] ?? e} />
        ))}
      </div>

      <div className="text-body font-semibold text-ink mb-3">{rec.title}</div>

      {rec.insight && (
        <div className="p-3 bg-surface-2 rounded-control mb-3">
          <div className="text-meta text-ink-3 mb-1">What the data shows</div>
          <p className="text-body text-ink-2 leading-relaxed">{rec.insight}</p>
        </div>
      )}

      {rec.action && (
        <>
          <div className="text-meta text-ink-3 mb-1">Action</div>
          <p className="text-body text-ink-2 leading-relaxed">{rec.action}</p>
        </>
      )}

      {rec.actioned_at && (
        <div className="mt-3 inline-flex items-center gap-1 text-meta text-ink-2">
          <Check size={12} aria-hidden="true" />
          Marked actioned {fmtDate(rec.actioned_at)}
        </div>
      )}

      {canEdit && (
        <div className="mt-4 pt-3 border-t border-line flex flex-wrap gap-2">
          <Button
            variant="secondary" size="sm" icon={Check}
            onClick={() => onStatus(rec.id, 'actioned')}
            disabled={rec.status === 'actioned'}
            aria-label={`Mark actioned: ${rec.title}`}
          >
            Actioned
          </Button>
          <Button
            variant="secondary" size="sm" icon={CircleSlash}
            onClick={() => onStatus(rec.id, 'acknowledged')}
            disabled={rec.status === 'acknowledged'}
            aria-label={`Mark acknowledged: ${rec.title}`}
          >
            Acknowledged
          </Button>
          <Button
            variant="ghost" size="sm" icon={X}
            onClick={() => onStatus(rec.id, 'dismissed')}
            disabled={rec.status === 'dismissed'}
            aria-label={`Dismiss: ${rec.title}`}
          >
            Dismiss
          </Button>
        </div>
      )}
    </Card>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

/**
 * Content-shaped loading state for the body of this page (2026-07-30 audit F8).
 * The page header renders unchanged during the fetch so the Refresh control
 * stays reachable and the header box never moves when data lands. The hero is
 * the shared HeroAnswer skeleton; the list below mirrors the first action card.
 */
function RecommendationsSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading recommendations</span>
      <div aria-hidden="true" className="space-y-6">
        <HeroAnswer loading answer="" />
        <SkeletonList rows={2} />
      </div>
    </div>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Recommendations() {
  const { activeClientId, activeClient, activeEngines, isAdmin } = useClient()
  const brandName = activeClient?.name ?? 'Your brand'
  const { snapshot, status, loadError: snapshotError, reload } = useResults()

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)
  /** Only populated when the function generated advice but FAILED to persist it. */
  const [unsavedRecs, setUnsavedRecs] = useState<AiRec[]>([])

  const [runs, setRuns]           = useState<StoredRun[]>([])
  const [storedRecs, setStoredRecs] = useState<StoredRec[]>([])
  const [showAllRuns, setShowAllRuns] = useState(false)
  // True when the saved-history read failed. A failed read must never look like "no history".
  const [historyError, setHistoryError] = useState(false)

  // Snapshot numbers: one shared population over the provider's rows.
  const derived = useMemo(() => {
    if (!snapshot) return null
    const activeIds = snapshot.activePrompts.map(pr => pr.id)
    const view = buildSnapshotView(snapshot.rows, activeIds, activeEngines)
    const stats = buildRecommendationsStats(view, snapshot.activePrompts, brandName)
    return {
      view,
      stats,
      recs: generateRecs(stats),
      engineErrors: buildEngineErrors(snapshot.rows, activeEngines),
      snippets: buildAiSnippets(view, snapshot.activePrompts),
    }
  }, [snapshot, activeEngines, brandName])

  const stats = derived?.stats ?? null
  const recs = derived?.recs ?? []
  const engineErrors = derived?.engineErrors ?? []
  const loading = snapshot === null && status !== 'error'
  const loadFailedNoData = snapshot === null && status === 'error'
  const loadError = loadFailedNoData || !!snapshotError || historyError
  const hasResults = (stats?.totalChecks ?? 0) > 0

  // ── Saved advice history ──────────────────────────────────────────────────
  // One read: runs with their items embedded, so there is no second round trip.
  // Each call carries a sequence number so a slow earlier read cannot overwrite
  // a newer one.
  const historySeq = useRef(0)
  const loadHistory = useCallback(async (): Promise<boolean> => {
    const mine = nextSeq(historySeq)
    if (isDemoMode) {
      if (!isStale(historySeq, mine)) { setRuns([]); setStoredRecs([]); setHistoryError(false) }
      return true
    }
    const { data, error } = await supabase
      .from('recommendation_runs')
      .select('id, generated_at, model, rec_count, recommendations(id, run_id, position, title, insight, action, engines, priority, status, actioned_at, notes)')
      .eq('client_id', activeClientId)
      .order('generated_at', { ascending: false })
      .limit(20)
    if (isStale(historySeq, mine)) return true
    if (error) {
      console.error('[Recs] history load failed:', error.message)
      setHistoryError(true)
      return false
    }
    const rows = (data ?? []) as Array<StoredRun & { recommendations: StoredRec[] | null }>
    setRuns(rows.map(r => ({ id: r.id, generated_at: r.generated_at, model: r.model, rec_count: r.rec_count })))
    setStoredRecs(
      rows.flatMap(r => r.recommendations ?? []).sort((a, b) => a.position - b.position),
    )
    setHistoryError(false)
    return true
  }, [activeClientId])

  useEffect(() => {
    // A client switch must never keep another client's saved history on screen
    // (its status buttons would write to that client's rows).
    setRuns([])
    setStoredRecs([])
    setHistoryError(false)
    void loadHistory()
  }, [loadHistory])

  const retryAll = () => {
    reload(snapshot ? { quiet: true } : undefined)
    void loadHistory()
  }

  // ── Generate ──────────────────────────────────────────────────────────────
  const generateAiInsights = async () => {
    if (!derived || !stats || stats.totalChecks === 0 || !activeClientId || !snapshot || snapshot.clientId !== activeClientId) return
    setAiLoading(true)
    setAiError(null)
    setUnsavedRecs([])

    const engineStats: Record<string, any> = {}
    for (const s of stats.llmStats) {
      engineStats[s.llm] = { total: s.total, mentioned: s.mentioned, rate: s.rate, avgPos: s.avgPos }
    }

    const payload = {
      client_id:           activeClientId,
      brand_name:          brandName,
      engine_stats:        engineStats,
      engines_with_errors: engineErrors,
      top_competitors:     stats.competitors,   // carries rankedMentions + proseOnly
      mentioned_snippets:  derived.snippets.mentioned,
      absent_snippets:     derived.snippets.absent,
      prompts:             snapshot.activePrompts.map(p => ({ text: p.text, category: p.category })),
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/generate-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const text = await res.text()
      let data: any
      try {
        data = JSON.parse(text)
      } catch {
        // Driver/status detail is logged for diagnosis, not shown -- a raw
        // HTTP status and a pointer at internal infrastructure name nothing a
        // customer can act on.
        console.error('[GenRec] non-JSON response:', res.status, text.slice(0, 300))
        throw new Error(
          res.status === 524 || res.status === 502
            ? 'The analysis timed out. Try again in a moment.'
            : 'Something went wrong generating insights. Try again, and if it keeps happening contact support.'
        )
      }

      if (data.error) {
        setAiError(data.error)
      } else if (data.persisted) {
        await loadHistory()
      } else {
        // Generated but not stored. Show it rather than throw it away -- but say so
        // plainly, because an unsaved deliverable has no audit trail. The driver's
        // own persist_error is logged for diagnosis, not shown -- it can name
        // internal tables and migrations.
        if (data.persist_error) console.error('[GenRec] persist failed:', data.persist_error)
        setUnsavedRecs(data.recommendations ?? [])
        setAiError('Generated, but not saved to your history. Try again, and if it keeps happening contact support.')
      }
    } catch (e: any) {
      setAiError(e.message ?? 'Network error')
    }
    setAiLoading(false)
  }

  // ── Status update ─────────────────────────────────────────────────────────
  const setItemStatus = async (id: number, status: RecStatus) => {
    const prev = storedRecs
    // Optimistic. actioned_at is set server-side by the freeze trigger, so refetch after.
    setStoredRecs(rs => rs.map(r => (r.id === id ? { ...r, status } : r)))
    const { error } = await supabase.from('recommendations').update({ status }).eq('id', id)
    if (error) {
      console.error('[Recs] status update failed:', error.message)
      setStoredRecs(prev)
      setAiError(`Could not update status: ${error.message}`)
      return
    }
    await loadHistory()
  }


  const gapLLMCount = stats?.llmStats.filter(s => s.rate < 0.5).length ?? 0
  const visibleRuns = showAllRuns ? runs : runs.slice(0, 1)
  const latestRunId = runs[0]?.id ?? null
  const firstRun = !loading && !(loadError && !stats) && (stats?.totalChecks ?? 0) === 0
  const showBody = !loading && !(loadError && !stats)

  // Hero engine status (spec 11.6): one badge, warn when anything needs attention.
  const heroBadge: { label: string; tone: BadgeTone } | undefined = !stats ? undefined
    : engineErrors.length > 0
      ? { label: `${engineErrors.length} engine${engineErrors.length !== 1 ? 's' : ''} unavailable`, tone: 'warn' } // copy: pending bg-copy
      : gapLLMCount > 0
        ? { label: `${gapLLMCount} engine${gapLLMCount !== 1 ? 's' : ''} below 50%`, tone: 'warn' } // copy: pending bg-copy
        : { label: 'All engines above 50%', tone: 'pos' } // copy: pending bg-copy

  const generateButton = (
    <Button
      variant="primary"
      icon={Sparkles}
      onClick={generateAiInsights}
      loading={aiLoading}
      disabled={!hasResults}
      aria-label="Generate AI insights"
    >
      {aiLoading ? 'Analysing…' : runs.length > 0 ? 'Generate new analysis' : 'Generate insights'}
    </Button>
  )

  return (
    <Page>
      {/* Header. Rendered identically while loading: the title, the count badge slot
          and the Refresh control do not depend on the fetch, so the header's box is
          the same before and after data lands. aria-disabled, not disabled: a
          `disabled` button leaves the tab order, which is how this page once had
          ZERO focusable controls in <main> for the whole wait (audit F8). The
          click is guarded instead. */}
      <PageHeader
        title="Recommendations"
        badge={!loading && recs.length > 0 && !(showBody && stats && hasResults)
          ? <Badge tone="neutral">{recs.length} action{recs.length !== 1 ? 's' : ''}</Badge>
          : undefined}
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => { if (!loading) retryAll() }}
            aria-disabled={loading}
            aria-label="Refresh recommendations"
          >
            Refresh
          </Button>
        }
      />

      {loading && <RecommendationsSkeleton />}

      <div className="space-y-6">
        {/* API-failure notice. This is OUR outage, not the brand's invisibility.
            The route's one Notice (C7). */}
        {!loading && engineErrors.length > 0 && (
          <Notice tone="warn" title={`No usable data from ${engineErrors.map(e => LLM_LABEL[e.engine] ?? e.engine).join(', ')}`}>
            {/* copy: pending bg-copy */}
            These engines returned only API errors ({engineErrors.map(e => `${e.count}`).join(', ')} failed prompt checks),
            so they are excluded from every score and from the AI analysis below. This is a collection
            failure, not a visibility failure. It does not mean these engines ignore your brand.
          </Notice>
        )}

        {!loading && loadError && (
          <LoadErrorCard
            message={stats ? "Couldn't refresh these results. What you see may be out of date." : undefined}
            onRetry={retryAll}
          />
        )}

        {/* Hero */}
        {firstRun && (
          <HeroAnswer
            answer=""
            empty={{
              icon: Target,
              title: 'Not measured yet',
              body: 'Actions are generated after your first collection.', // copy: pending bg-copy
              actionLabel: 'Run first collection',
              actionTo: '/ai-visibility',
              minHeight: 220,
            }}
          />
        )}

        {showBody && stats && hasResults && (
          <HeroAnswer
            value={recs.length}
            unit="actions"
            badge={heroBadge}
            answer={recs.length > 0 ? `Start with: ${recs[0].title.replace(/[.!?]+$/, '')}.` : 'No priority actions right now.'} // copy: pending bg-copy
            context={`Generated from ${stats.totalChecks} successful AI checks`} // copy: pending bg-copy
          >
            <h2 className="sr-only">Visibility by engine</h2>
            <ul className="m-0 list-none p-0">
              {stats.llmStats.map(s => {
                const pct = Math.round(s.rate * 100)
                const tier: { label: string; tone: BadgeTone; kind: 'pos' | 'warn' | 'neg' } =
                  s.rate >= 0.85 ? { label: 'Strong',  tone: 'pos',  kind: 'pos' }
                  : s.rate >= 0.5 ? { label: 'Partial', tone: 'warn', kind: 'warn' }
                  : { label: 'Low', tone: 'neg', kind: 'neg' }
                return (
                  <li key={s.llm} className="flex items-center justify-between gap-3 py-2 border-t border-line first:border-t-0">
                    <EngineTag id={s.llm} fallbackLabel={LLM_LABEL[s.llm] ?? s.llm} />
                    <div className="flex items-center gap-3">
                      <span className="text-body font-semibold text-ink tabular-nums">{pct}%</span>
                      {s.avgPos !== null && <span className="text-meta text-ink-3">avg #{s.avgPos}</span>}
                      <Badge tone={tier.tone} glyph={<StatusGlyph kind={tier.kind} size={12} />}>{tier.label}</Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          </HeroAnswer>
        )}

        {/* Priority actions */}
        {showBody && hasResults && (
          <section>
            <SectionHeader title="Priority actions" />
            {recs.length === 0 ? (
              <Card>
                <SharedEmptyState
                  variant="inline"
                  icon={Target}
                  body="No priority actions right now. Keep running monthly collections to track trends." // copy: pending bg-copy
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {recs.map((rec, i) => (
                  <RecCard key={rec.id} rec={rec} defaultOpen={i === 0} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* AI analysis + advice history */}
        {showBody && (
          <section>
            <SectionHeader
              title="AI analysis"
              description={runs.length > 0 ? `Last generated ${fmtDate(runs[0].generated_at)}` : undefined}
              actions={
                <>
                  <Badge tone="neutral">Claude</Badge>
                  {generateButton}
                </>
              }
            />

            {aiLoading && (
              <Card role="status" className="space-y-3">
                <p className="text-body text-ink-2">Claude is reading your actual AI responses and competitor data…</p>
                <SkeletonList rows={2} />
              </Card>
            )}

            {aiError && !aiLoading && (
              <div role="alert" className="mb-3 flex items-start justify-between gap-3 rounded-card border border-line border-l-[3px] border-l-neg bg-surface p-4">
                <p className="text-body text-ink-2">{aiError}</p>
                <Button variant="secondary" size="sm" icon={RefreshCw} onClick={generateAiInsights} disabled={!hasResults}>
                  Retry
                </Button>
              </div>
            )}

            {/* Unsaved fallback, only when persistence failed. */}
            {unsavedRecs.length > 0 && !aiLoading && (
              <div className="space-y-3 mb-3">
                {unsavedRecs.map((rec, i) => (
                  <StoredRecCard
                    key={`unsaved-${i}`}
                    rec={{
                      id: -1 - i, run_id: -1, position: i,
                      title: rec.title, insight: rec.insight, action: rec.action,
                      engines: rec.engines ?? [], priority: rec.priority,
                      status: 'new', actioned_at: null, notes: null,
                    }}
                    canEdit={false}
                    onStatus={() => {}}
                  />
                ))}
              </div>
            )}

            {!aiLoading && runs.length === 0 && unsavedRecs.length === 0 && !aiError && (
              <Card>
                <SharedEmptyState
                  variant="inline"
                  icon={Sparkles}
                  body={'Click "Generate insights". Claude reads your actual response snippets and ranked competitors and produces specific, evidence-based advice. Every run is saved, so you keep a record of what was advised and when.'} // copy: pending bg-copy
                />
              </Card>
            )}

            {/* Persisted history */}
            {!aiLoading && visibleRuns.map(run => {
              const items = storedRecs
                .filter(r => r.run_id === run.id)
                .sort((a, b) => a.position - b.position)
              const isLatest = run.id === latestRunId
              return (
                <div key={run.id} className="mb-5">
                  <div className="flex items-center gap-2 mb-2 text-meta text-ink-3">
                    <History size={12} aria-hidden="true" />
                    <span>
                      {isLatest ? 'Latest analysis' : 'Earlier analysis'} · {fmtDate(run.generated_at)} · {run.model}
                    </span>
                    <span>
                      · {items.filter(i => i.status === 'actioned').length}/{items.length} actioned
                    </span>
                  </div>
                  <div className="space-y-3">
                    {items.map(item => (
                      <StoredRecCard
                        key={item.id}
                        rec={item}
                        canEdit={isAdmin}
                        onStatus={setItemStatus}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {runs.length > 1 && !aiLoading && (
              <Button
                variant="ghost"
                icon={showAllRuns ? ChevronUp : ChevronDown}
                onClick={() => setShowAllRuns(v => !v)}
                aria-expanded={showAllRuns}
                className="w-full"
              >
                {showAllRuns
                  ? 'Hide earlier analyses'
                  : `Show ${runs.length - 1} earlier analys${runs.length - 1 === 1 ? 'is' : 'es'}`}
              </Button>
            )}
          </section>
        )}

        {/* Who AI names instead */}
        {showBody && stats && stats.competitors.length > 0 && (
          <Disclosure title="Who AI names instead" count={stats.competitors.length}>
            <div className="flex flex-wrap gap-2">
              {stats.competitors.map(c => (
                <span
                  key={c.name}
                  title={c.proseOnly
                    ? 'Named in prose, but never ranked in a list by any engine, usually because they are on your own competitor seed list'
                    : `Ranked ${c.rankedMentions}× by AI engines`}
                >
                  <Badge tone="neutral">
                    {c.name}
                    {c.proseOnly ? ' · prose only' : ` · ranked ${c.rankedMentions}×`}
                    {c.avgPos ? ` · avg #${c.avgPos}` : ''}
                  </Badge>
                </span>
              ))}
            </div>
            {stats.competitors.some(c => c.proseOnly) && (
              <p className="text-meta text-ink-3 mt-3 leading-relaxed">
                {/* copy: pending bg-copy */}
                "Prose only" names were never ranked by any engine. They appear because they are on your
                own competitor list and an engine happened to mention them. They are not counted as losses.
              </p>
            )}
          </Disclosure>
        )}
      </div>
    </Page>
  )
}
