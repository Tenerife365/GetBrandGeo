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

export type LLMName =
  | 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'meta'
  | 'google_ai' | 'copilot' | 'deepseek' | 'grok'

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
  | 'pending' | 'scheduled' | 'published' | 'failed' | 'skipped'

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
