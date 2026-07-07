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
  category: PromptCategory
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
}

export interface DashboardStats {
  totalAnalyzed: number
  avgGeoScore: number
  strategicCount: number
  highValueCount: number
  mentionsCount: number
  competitorOpportunities: number
}
