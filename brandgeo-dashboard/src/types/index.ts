export type Classification =
  | 'strategic'
  | 'high_value'
  | 'medium_value'
  | 'low_value'
  | 'competitor_opportunity'

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'none'

export type PromptCategory =
  | 'mid' | 'large' | 'very_large' | 'general'
  | 'tool_discovery' | 'geo_category' | 'problem_based' | 'direct_brand'

// Keep in sync with EngineId in src/lib/planConfig.ts, same set, and
// ai_results.llm stores exactly these strings.
// `ai_overview` (Google AI Overviews) is separate from `google_ai` (Google AI
// Mode) on purpose: two different Google surfaces, measured independently.
export type LLMName =
  | 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'meta'
  | 'google_ai' | 'ai_overview' | 'copilot' | 'deepseek' | 'grok'

export interface SearchResult {
  id: number
  query: string
  url: string
  title: string
  snippet: string
  collected_at: string
  processing_status: string
}

export interface PageAnalysis {
  id: number
  search_result_id: number
  mentions_bpr: boolean
  sentiment: Sentiment
  competitors: string
  geo_score: number
  classification: Classification
  llm_summary: string
  suggested_action: string
  recommended_content: string
  action_priority: number
  source_authority: number
  analyzed_at: string
  url?: string
  title?: string
  snippet?: string
  query?: string
}

export interface Mention {
  id: number
  page_analysis_id: number
  entity: string
  mention_type: string
  sentiment: Sentiment
  created_at: string
}

export interface Competitor {
  id: number
  name: string
  website: string | null
  source: 'auto' | 'manual'
  created_at: string
}

export interface Prompt {
  id: number
  text: string
  // Free-form since categories are now a general, auto-assigned taxonomy
  // (lib/promptCategories.ts) rather than the old fixed per-client union.
  category: string
  is_active: boolean
  position: number
  created_at: string
}

export interface AIResult {
  id: number
  prompt_id: number
  llm: LLMName
  response_snippet: string | null
  brand_mentioned: boolean
  brand_position: number | null
  sentiment: Sentiment
  checked_at: string
  competitors_mentioned?: string | null
  status?: 'ok' | 'error'
  error_code?: string | null
}

// ── Prospects (sales CRM, replaces HubSpot) ────────────────────────────────
// Row shape and writable-field list are the fixed contract with
// netlify/functions/prospects-admin.js (bg-backend, built in parallel).
// See src/pages/Prospects.tsx header comment for the full contract.
export type ProspectStage =
  | 'new' | 'qualified' | 'audited' | 'contacted' | 'replied'
  | 'meeting' | 'won' | 'lost' | 'disqualified'

// contact_email_kind distinguishes a mailbox that reaches one named person
// from one that reaches a queue (info@, hello@, sales@) — the difference
// changes how a cold touch should be written and who is actually going to
// read it.
export type ContactEmailKind = 'individual' | 'role'

export interface Prospect {
  id:                  number
  domain:              string
  company:             string | null
  contact_name:        string | null
  contact_role:        string | null
  contact_url:         string | null
  linkedin_url:        string | null
  segment:             string | null
  tier:                number | null
  stage:               ProspectStage
  disqualified_reason: string | null
  audit_token:         string | null
  ai_score:            number | null
  competitor_count:    number | null
  source:              string | null
  owner:               string | null
  last_contacted_at:   string | null
  next_action_at:      string | null
  replied_at:          string | null
  reply_note:          string | null
  notes:               string | null
  created_at:          string
  updated_at:          string
  // Research-derived, read only from prospects-admin.js — never offer an
  // edit control for any of the six fields below.
  contact_email:        string | null
  contact_email_source: string | null
  contact_email_kind:   ContactEmailKind | null
  x_url:                string | null
  // NOT NULL / default false on the column, and false is DELIBERATELY
  // ambiguous: it means "never researched" AND "checked and could not be
  // confirmed" (LinkedIn returns HTTP 999 to automated clients, so a
  // LinkedIn URL can never be positively denied, only positively confirmed
  // or left unconfirmed). Never render false as "unverified" or "invalid" —
  // that claims more than the data knows. See ScoreChip-style honesty rule
  // already established on this page for ai_score === 0.
  x_verified:           boolean
  linkedin_verified:    boolean
  // Nested on the row by prospects-admin.js's 'list' action, most recent
  // first. Populated on every row it returns; absent (undefined) only on the
  // partial Prospect a 'touch'/'update' response returns, which is why
  // callers merge rather than trust that response's touches key.
  touches:              Touch[]
  // Staged contact routes the resolver found but nobody has chosen yet
  // (public.prospect_contact_candidates), strongest evidence first. Nested by
  // every prospects-admin.js action, same uniform-shape rule as `touches`.
  candidates:           ContactCandidate[]
}

// ── Contact route candidates (resolve-contact-routes.js, packet 019) ────────
// The resolver stages what it found here instead of writing the prospect row,
// because it can prove a string appeared at a URL but cannot prove the string
// belongs to the person you mean. Promotion is a human click, and it goes
// through prospects-admin.js's 'promote' action, which accepts only a
// candidate id.
export type ContactCandidateKind = 'email' | 'linkedin' | 'x'

// How well SOURCED the string is. Never how likely it is to be the right
// person -- those are different questions and only the first is mechanisable.
export type ContactConfidence = 'high' | 'medium' | 'low'

export interface ContactCandidate {
  id:          number
  prospect_id: number
  kind:        ContactCandidateKind
  value:       string
  // NOT NULL by design: the exact URL the literal string was seen at. A
  // candidate with no source is a guess wearing a database column.
  source_url:  string
  email_kind:  ContactEmailKind | null
  confidence:  ContactConfidence
  // "Has been promoted at some point", not "is the one currently live" --
  // the live one is derived by comparing value against the prospect field,
  // which cannot drift out of sync the way a second flag would.
  promoted:    boolean
  created_at:  string
}

// The only fields the UI is allowed to write via `update`. Kept as a const
// tuple (not just a comment) so ProspectPatch below is derived from it, not
// hand-typed twice. The six research-derived fields above and `touches` are
// deliberately absent — they come from research/backfill/re-audit jobs and
// from the `touch` action, never from an `update` patch.
export const PROSPECT_WRITABLE_FIELDS = [
  'stage', 'notes', 'owner', 'next_action_at', 'last_contacted_at', 'replied_at', 'reply_note',
] as const
export type ProspectPatch = Partial<Pick<Prospect, typeof PROSPECT_WRITABLE_FIELDS[number]>>

// ── Prospect touches (channel-aware contact history) ────────────────────────
// public.prospect_touches, db/supabase-prospect-channels-migration.sql.
// One row per real outreach event. A `touch` NEVER carries a stage — it
// records that contact happened, nothing about pipeline progress, and it
// server-side stamps last_contacted_at (direction 'out') or replied_at
// (direction 'in') on the parent prospect in the same request.
export type TouchChannel = 'email' | 'linkedin' | 'x'
export type TouchDirection = 'out' | 'in'

export interface Touch {
  id:          number
  prospect_id: number
  channel:     TouchChannel
  direction:   TouchDirection
  occurred_at: string
  subject:     string | null
  body:        string | null
  note:        string | null
  created_at:  string
}

// Input shape for the `touch` action. channel and direction are required;
// occurred_at defaults server-side to now() when omitted; subject/body/note
// are optional free text.
export interface TouchLogInput {
  prospect_id: number
  channel:     TouchChannel
  direction:   TouchDirection
  occurred_at?: string
  subject?:    string | null
  body?:       string | null
  note?:       string | null
}

export interface DashboardStats {
  totalAnalyzed: number
  avgGeoScore: number
  strategicCount: number
  highValueCount: number
  mentionsCount: number
  competitorOpportunities: number
}

// ── AI Social ────────────────────────────────────────────────────────────────
// Internal platform ids (mirror the DB check constraints + _publishing.js).
// Ayrshare translation (gbp->gmb, x->twitter) is hidden inside the provider.
export type SocialPlatform =
  | 'instagram' | 'facebook' | 'linkedin' | 'gbp' | 'x'
  | 'bluesky' | 'pinterest' | 'reddit' | 'snapchat' | 'telegram' | 'threads' | 'tiktok' | 'youtube'

export type SocialPostStatus =
  | 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'partial' | 'canceled'

export type SocialTargetStatus =
  | 'pending' | 'scheduled' | 'published' | 'failed' | 'skipped' | 'canceled'

export interface SocialMedia {
  url: string
  type?: 'image' | 'video'
  alt?: string
}

export interface SocialAccount {
  platform: SocialPlatform
  displayName: string | null
  externalId: string | null
  status: 'connected' | 'disconnected' | 'error'
}

export interface SocialPostTarget {
  id: number
  post_id: number
  platform: SocialPlatform
  text_override: string | null
  media_override: SocialMedia[] | null
  status: SocialTargetStatus
  provider_ref: string | null
  permalink: string | null
  error: string | null
  published_at: string | null
}

export interface SocialPost {
  id: number
  client_id: number
  status: SocialPostStatus
  source: 'manual' | 'ai'
  brief: string | null
  base_text: string | null
  base_media: SocialMedia[]
  scheduled_at: string | null
  provider_post_id: string | null
  error: string | null
  created_at: string
  updated_at: string
  targets?: SocialPostTarget[]
}

// ── Client-facing in-dashboard notifications (plan grants, changes, expiries) ──
export interface ClientNotification {
  id: number
  client_id: number
  kind: 'plan_grant' | 'plan_change' | 'trial_expired'
  title: string
  body: string
  meta: Record<string, unknown>
  cta_label: string | null
  cta_url: string | null
  created_at: string
  dismissed_at: string | null
}

// ── AI SEO (content-action layer) ────────────────────────────────────────────
// A new-content opportunity derived from a client's GEO data (seo_briefs).
// Deterministic briefs (seo-opportunities.js) with an on-demand GEO-scored
// draft (seo-draft.js).
export type SeoBriefSource = 'visibility_gap' | 'recommendation' | 'competitor' | 'manual'
export type SeoBriefStatus = 'idea' | 'drafting' | 'drafted' | 'published' | 'dismissed'

export interface SeoGeoScore {
  seo: number | null
  geo: number | null
  verdict: 'ready' | 'needs_revision'
  notes: string
}

export interface SeoBrief {
  id: number
  source: SeoBriefSource
  source_ref?: string
  title: string
  target_prompt: string | null
  outline: string[]
  guidance: string | null
  target_entities: { brand?: string; competitors?: string[] } | null
  status: SeoBriefStatus
  draft_text?: string | null
  geo_score: SeoGeoScore | null
  context?: string | null
  drafted_at: string | null
  updated_at?: string
}

// Phase 2 — crawled pages + per-page GEO audit (seo_pages / seo_crawls).
export type SeoPageStatus = 'crawled' | 'audited' | 'stale'
export interface SeoPageAudit {
  summary: string
  issues: { severity: 'high' | 'med' | 'low'; text: string }[]
  suggestions: string[]
}
export interface SeoPage {
  id: number
  url: string
  title: string | null
  geo_score: number | null
  audit: SeoPageAudit | null
  status: SeoPageStatus
  fetched_at: string | null
}
export interface SeoCrawl {
  id: number
  status: 'running' | 'done' | 'error'
  pages: number
  error: string | null
  started_at: string
  finished_at: string | null
}
