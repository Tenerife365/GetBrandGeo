import type { PageAnalysis, DashboardStats, Prompt, AIResult, Competitor } from '../types'

export const mockAnalyses: PageAnalysis[] = [
  {
    id: 1,
    search_result_id: 1,
    url: 'https://bucateperoate.ro',
    title: 'Bucate pe Roate â Catering & Evenimente',
    snippet: 'Lider Ã®n catering pentru evenimente corporate Åi private Ã®n BucureÅti.',
    query: 'catering corporate bucuresti',
    mentions_bpr: true,
    sentiment: 'positive',
    competitors: '[]',
    geo_score: 88,
    classification: 'strategic',
    llm_summary: 'Site-ul oficial prezintÄ servicii premium de catering cu acoperire largÄ.',
    suggested_action: 'OptimizeazÄ pagina de servicii pentru AI assistants',
    recommended_content: 'AdaugÄ FAQ structurat despre tipuri de meniuri',
    action_priority: 1,
    source_authority: 85,
    analyzed_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 2,
    search_result_id: 2,
    url: 'https://zelist.ro/review-bucate-pe-roate',
    title: 'Review Bucate pe Roate â Zelist Monitor',
    snippet: 'ExperienÈÄ excelentÄ la catering-ul pentru conferinÈa noastrÄ.',
    query: 'review catering bucuresti',
    mentions_bpr: true,
    sentiment: 'positive',
    competitors: '[]',
    geo_score: 74,
    classification: 'high_value',
    llm_summary: 'Recenzie pozitivÄ pe platformÄ third-party cu autoritate medie.',
    suggested_action: 'RÄspunde Åi mulÈumeÅte pentru recenzie',
    recommended_content: 'SolicitÄ mai multe recenzii de la clienÈi',
    action_priority: 2,
    source_authority: 60,
    analyzed_at: '2026-06-17T11:00:00Z',
  },
  {
    id: 3,
    search_result_id: 3,
    url: 'https://flavours.ro',
    title: 'Flavours â Catering Evenimente BucureÅti',
    snippet: 'Servicii profesionale de catering pentru orice tip de eveniment.',
    query: 'catering evenimente bucuresti',
    mentions_bpr: false,
    sentiment: 'none',
    competitors: '["Flavours"]',
    geo_score: 65,
    classification: 'competitor_opportunity',
    llm_summary: 'Competitor cu prezenÈÄ puternicÄ pe termenul "catering evenimente".',
    suggested_action: 'CreeazÄ conÈinut care sÄÃ concureze pe acest termen',
    recommended_content: 'Landing page dedicat "catering evenimente corporate BucureÅti"',
    action_priority: 1,
    source_authority: 55,
    analyzed_at: '2026-06-17T12:00:00Z',
  },
  {
    id: 4,
    search_result_id: 4,
    url: 'https://ghid-catering.ro/top-10',
    title: 'Top 10 Firme Catering BucureÅti 2026',
    snippet: 'Bucate pe Roate ocupÄ locul 2 Ã®n topul firmelor de catering.',
    query: 'top firme catering bucuresti',
    mentions_bpr: true,
    sentiment: 'positive',
    competitors: '["Flavours", "Fratelli"]',
    geo_score: 79,
    classification: 'high_value',
    llm_summary: 'Articol de tip listicle cu BpR pe locul 2. Autoritate ridicatÄ.',
    suggested_action: 'ObÈine link dofollow de pe aceastÄÃ paginÄ',
    recommended_content: 'Trimite materiale actualizate editorului',
    action_priority: 1,
    source_authority: 72,
    analyzed_at: '2026-06-17T13:00:00Z',
  },
  {
    id: 5,
    search_result_id: 5,
    url: 'https://forum-evenimente.ro/catering-recomandari',
    title: 'RecomandÄri catering â Forum Evenimente',
    snippet: 'Am folosit mai multe firme, dar BpR a fost cel mai profesionist.',
    query: 'recomandare catering eveniment privat',
    mentions_bpr: true,
    sentiment: 'positive',
    competitors: '["Noblesse"]',
    geo_score: 55,
    classification: 'medium_value',
    llm_summary: 'MenÈiune pozitivÄ pe forum cu trafic mediu.',
    suggested_action: 'MonitorizeazÄ thread-ul Åi rÄspunde',
    recommended_content: 'PosteazÄ studiu de caz pe forum',
    action_priority: 3,
    source_authority: 40,
    analyzed_at: '2026-06-17T14:00:00Z',
  },
  {
    id: 6,
    search_result_id: 6,
    url: 'https://fratelli.ro',
    title: 'Fratelli â Evenimente Speciale & Corporate',
    snippet: 'ExperienÈe culinare premium pentru conferinÈe Åi gale corporate Ã®n BucureÅti.',
    query: 'catering corporate conferinta bucuresti',
    mentions_bpr: false,
    sentiment: 'none',
    competitors: '["Fratelli"]',
    geo_score: 58,
    classification: 'competitor_opportunity',
    llm_summary: 'Fratelli dominÄ segmentul corporate/conferinÈe, niÅÄ cheie pentru BpR.',
    suggested_action: 'CreeazÄÃ pagini dedicate pentru conferinÈe Åi gale corporate',
    recommended_content: 'Studii de caz conferinÈe: capacitate, logisticÄÃ, meniu corporate',
    action_priority: 2,
    source_authority: 48,
    analyzed_at: '2026-06-17T15:00:00Z',
  },
]

export const mockStats: DashboardStats = {
  totalAnalyzed: 6,
  avgGeoScore: Math.round(
    mockAnalyses.reduce((s, a) => s + a.geo_score, 0) / mockAnalyses.length
  ),
  strategicCount: mockAnalyses.filter(a => a.classification === 'strategic').length,
  highValueCount: mockAnalyses.filter(a => a.classification === 'high_value').length,
  mentionsCount: mockAnalyses.filter(a => a.mentions_bpr).length,
  competitorOpportunities: mockAnalyses.filter(a => a.classification === 'competitor_opportunity').length,
}

export const mockCompetitorData = [
  { name: 'Flavours',       count: 5, avgScore: 68 },
  { name: 'Fratelli',       count: 4, avgScore: 64 },
  { name: 'Noblesse',       count: 3, avgScore: 61 },
  { name: 'Elite Events',   count: 3, avgScore: 58 },
  { name: 'Royal Catering', count: 2, avgScore: 55 },
  { name: 'La Mama',        count: 2, avgScore: 52 },
]

export const mockCompetitors: Competitor[] = [
  { id: 1, name: 'Flavours',       website: 'https://flavours.ro',         source: 'auto',   created_at: '2026-07-01T00:00:00Z' },
  { id: 2, name: 'Fratelli',       website: 'https://fratelli.ro',         source: 'auto',   created_at: '2026-07-01T00:00:00Z' },
  { id: 3, name: 'Noblesse',       website: 'https://noblesse.ro',         source: 'auto',   created_at: '2026-07-01T00:00:00Z' },
  { id: 4, name: 'Elite Events',   website: 'https://eliteevents.ro',      source: 'auto',   created_at: '2026-07-01T00:00:00Z' },
  { id: 5, name: 'Royal Catering', website: 'https://royalcatering.ro',    source: 'auto',   created_at: '2026-07-01T00:00:00Z' },
  { id: 6, name: 'Chef Direct',    website: null,                           source: 'auto',   created_at: '2026-07-01T00:00:00Z' },
  { id: 7, name: 'Gurmanio',       website: 'https://gurmanio.ro',         source: 'auto',   created_at: '2026-07-01T00:00:00Z' },
  { id: 8, name: 'La Mama',        website: 'https://lamama.ro',           source: 'manual', created_at: '2026-07-01T01:00:00Z' },
  { id: 9, name: 'Sati Catering',  website: null,                           source: 'manual', created_at: '2026-07-01T01:00:00Z' },
]

export const mockPrompts: Prompt[] = [
  { id: 1,  text: 'catering pentru eveniment corporate 150 persoane BucureÅti', category: 'mid',        is_active: true, position: 1,  created_at: '2026-07-01T00:00:00Z' },
  { id: 2,  text: 'firma catering nuntÄ 120 invitaÈi BucureÅti',      category: 'mid',        is_active: true, position: 2,  created_at: '2026-07-01T00:00:00Z' },
  { id: 3,  text: 'catering profesional conferinÈÄ 200 persoane',          category: 'mid',        is_active: true, position: 3,  created_at: '2026-07-01T00:00:00Z' },
  { id: 4,  text: 'servicii catering eveniment 150 oameni BucureÅti preÈ', category: 'mid',        is_active: true, position: 4,  created_at: '2026-07-01T00:00:00Z' },
  { id: 5,  text: 'catering prÃ¢nz corporate 100 persoane BucureÅti',       category: 'mid',        is_active: true, position: 5,  created_at: '2026-07-01T00:00:00Z' },
  { id: 6,  text: 'catering galÄ 500 persoane BucureÅti',                  category: 'large',      is_active: true, position: 6,  created_at: '2026-07-01T00:00:00Z' },
  { id: 7,  text: 'firma catering eveniment mare 600 oameni',                        category: 'large',      is_active: true, position: 7,  created_at: '2026-07-01T00:00:00Z' },
  { id: 8,  text: 'catering nuntÄ 500 invitaÈi servicii complete',         category: 'large',      is_active: true, position: 8,  created_at: '2026-07-01T00:00:00Z' },
  { id: 9,  text: 'servicii catering eveniment 700 persoane BucureÅti',         category: 'large',      is_active: true, position: 9,  created_at: '2026-07-01T00:00:00Z' },
  { id: 10, text: 'catering profesional festival 500 oameni RomÃ¢nia',           category: 'large',      is_active: true, position: 10, created_at: '2026-07-01T00:00:00Z' },
  { id: 11, text: 'catering eveniment 1000 persoane BucureÅti',                 category: 'very_large', is_active: true, position: 11, created_at: '2026-07-01T00:00:00Z' },
  { id: 12, text: 'firma catering capacitate mare 1500 oameni',                      category: 'very_large', is_active: true, position: 12, created_at: '2026-07-01T00:00:00Z' },
  { id: 13, text: 'catering concert festival 2000 persoane RomÃ¢nia',            category: 'very_large', is_active: true, position: 13, created_at: '2026-07-01T00:00:00Z' },
  { id: 14, text: 'servicii catering evenimente corporate mari 1000+ persoane',      category: 'very_large', is_active: true, position: 14, created_at: '2026-07-01T00:00:00Z' },
  { id: 15, text: 'catering galÄ corporativÄ 1200 persoane BucureÅti', category: 'very_large', is_active: true, position: 15, created_at: '2026-07-01T00:00:00Z' },
  { id: 16, text: 'cele mai bune firme de catering pentru evenimente BucureÅti', category: 'general',   is_active: true, position: 16, created_at: '2026-07-01T00:00:00Z' },
  { id: 17, text: 'catering evenimente corporate top firme RomÃ¢nia',            category: 'general',    is_active: true, position: 17, created_at: '2026-07-01T00:00:00Z' },
  { id: 18, text: 'recomandare firma catering evenimente mari BucureÅti',       category: 'general',    is_active: true, position: 18, created_at: '2026-07-01T00:00:00Z' },
  { id: 19, text: 'servicii catering complete evenimente speciale RomÃ¢nia',     category: 'general',    is_active: true, position: 19, created_at: '2026-07-01T00:00:00Z' },
  { id: 20, text: 'top firme catering evenimente BucureÅti recenzii',           category: 'general',    is_active: true, position: 20, created_at: '2026-07-01T00:00:00Z' },
]

// Demo AI results: 20 prompts x 5 LLMs = 100 rows
const ts = '2026-07-01T06:00:00Z'
const mentionMatrix: Record<number, Record<string, { m: boolean; pos?: number; snip?: string }>> = {
  1:  { chatgpt: {m:true,pos:2,snip:'Bucate pe Roate este o optiune excelenta pentru evenimente corporate de 150 persoane.'}, gemini:{m:true,pos:3}, claude:{m:false}, perplexity:{m:true,pos:1,snip:'BpR ofera meniuri complete pentru 100-200 persoane.'}, meta:{m:false} },
  2:  { chatgpt: {m:true,pos:1,snip:'Pentru nunti sub 150 persoane, Bucate pe Roate este alegerea numarul 1 in Bucuresti.'}, gemini:{m:false}, claude:{m:true,pos:3}, perplexity:{m:true,pos:2}, meta:{m:false} },
  3:  { chatgpt: {m:true,pos:2}, gemini:{m:true,pos:4}, claude:{m:false}, perplexity:{m:true,pos:1,snip:'BpR livreaza pentru conferinte pana la 200 persoane.'}, meta:{m:true,pos:3} },
  4:  { chatgpt: {m:true,pos:3}, gemini:{m:false}, claude:{m:false}, perplexity:{m:true,pos:2}, meta:{m:false} },
  5:  { chatgpt: {m:true,pos:1,snip:'Cel mai bun catering corporate la pranz in Bucuresti: Bucate pe Roate.'}, gemini:{m:true,pos:2}, claude:{m:true,pos:3}, perplexity:{m:true,pos:1}, meta:{m:false} },
  6:  { chatgpt: {m:true,pos:3}, gemini:{m:false}, claude:{m:false}, perplexity:{m:true,pos:2,snip:'BpR gestioneaza gale de 500 persoane cu echipe dedicate.'}, meta:{m:true,pos:4} },
  7:  { chatgpt: {m:false}, gemini:{m:true,pos:3}, claude:{m:false}, perplexity:{m:true,pos:2}, meta:{m:false} },
  8:  { chatgpt: {m:true,pos:2,snip:'Bucate pe Roate ofera pachete complete pentru nunti de 500+ invitati.'}, gemini:{m:false}, claude:{m:false}, perplexity:{m:false}, meta:{m:true,pos:3} },
  9:  { chatgpt: {m:false}, gemini:{m:false}, claude:{m:false}, perplexity:{m:true,pos:2}, meta:{m:false} },
  10: { chatgpt: {m:true,pos:4}, gemini:{m:true,pos:3}, claude:{m:false}, perplexity:{m:true,pos:2}, meta:{m:false} },
  11: { chatgpt: {m:true,pos:3,snip:'BpR are capacitate logistica pentru 1000+ persoane cu echipe mobile.'}, gemini:{m:false}, claude:{m:false}, perplexity:{m:true,pos:2}, meta:{m:false} },
  12: { chatgpt: {m:false}, gemini:{m:false}, claude:{m:false}, perplexity:{m:false}, meta:{m:false} },
  13: { chatgpt: {m:false}, gemini:{m:false}, claude:{m:false}, perplexity:{m:true,pos:4}, meta:{m:false} },
  14: { chatgpt: {m:true,pos:4}, gemini:{m:false}, claude:{m:false}, perplexity:{m:false}, meta:{m:false} },
  15: { chatgpt: {m:false}, gemini:{m:false}, claude:{m:false}, perplexity:{m:true,pos:3}, meta:{m:false} },
  16: { chatgpt: {m:true,pos:2,snip:'Bucate pe Roate se numara printre cele mai bune firme de catering din Bucuresti.'}, gemini:{m:true,pos:3}, claude:{m:true,pos:4,snip:'Am identificat BpR ca furnizor de top pentru evenimente mari.'}, perplexity:{m:true,pos:1,snip:'#1 recomandare pentru catering evenimente in Bucuresti: BpR.'}, meta:{m:true,pos:2} },
  17: { chatgpt: {m:true,pos:1,snip:'Bucate pe Roate este liderul pietei de catering corporate din Romania.'}, gemini:{m:true,pos:2}, claude:{m:true,pos:3}, perplexity:{m:true,pos:1}, meta:{m:false} },
  18: { chatgpt: {m:true,pos:2}, gemini:{m:true,pos:3}, claude:{m:false}, perplexity:{m:true,pos:2}, meta:{m:true,pos:4} },
  20: { chatgpt: {m:true,pos:2,snip:'Bucate pe Roate este constant in top 3 firme de catering recomandate in Bucuresti.'}, gemini:{m:true,pos:3}, claude:{m:false}, perplexity:{m:true,pos:1}, meta:{m:true,pos:3} },
}

export const mockAIResults: AIResult[] = (Object.entries(mentionMatrix) as [string, Record<string, {m:boolean;pos?:number;snip?:string}>][]).flatMap(([promptIdStr, llmMap]) => {
  const prompt_id = Number(promptIdStr)
  return (Object.entries(llmMap) as [string, {m:boolean;pos?:number;snip?:string}][]).map(([llm, data], i) => ({
    id: prompt_id * 10 + i,
    prompt_id,
    llm: llm as AIResult['llm'],
    brand_mentioned: data.m,
    brand_position: data.pos ?? null,
    response_snippet: data.snip ?? null,
    sentiment: (data.m ? 'positive' : 'neutral') as AIResult['sentiment'],
    checked_at: ts,
    created_at: ts,
  }))
})

// ── Demo rows for the AI Visibility prompt-focus states (fictional brands) ────
// Four prompts that exercise the states the original demo never reached: an
// engine that stopped answering after an earlier good result, a prompt with no
// answer, a prompt that was never checked, and a prompt where the brand is
// absent everywhere while competitors are named.
mockPrompts.push(
  { id: 21, text: 'best outdoor event caterer for 150 guests', category: 'mid',     is_active: true, position: 21, created_at: '2026-07-01T00:00:00Z' },
  { id: 22, text: 'event catering with a live cooking station', category: 'general', is_active: true, position: 22, created_at: '2026-07-01T00:00:00Z' },
  { id: 23, text: 'weekend brunch catering for small offices',  category: 'general', is_active: true, position: 23, created_at: '2026-07-01T00:00:00Z' },
  { id: 24, text: 'vegan catering for corporate lunches',       category: 'mid',     is_active: true, position: 24, created_at: '2026-07-01T00:00:00Z' },
)

const demoOk = (id: number, prompt_id: number, llm: AIResult['llm'], m: boolean, pos: number | null, when: string, extra: Partial<AIResult> = {}): AIResult => ({
  id, prompt_id, llm,
  brand_mentioned: m,
  brand_position: pos,
  response_snippet: extra.response_snippet ?? null,
  sentiment: (m ? 'positive' : 'neutral') as AIResult['sentiment'],
  checked_at: when,
  status: 'ok',
  ...extra,
})
const demoErr = (id: number, prompt_id: number, llm: AIResult['llm'], when: string): AIResult => ({
  id, prompt_id, llm,
  brand_mentioned: false,
  brand_position: null,
  response_snippet: null,
  sentiment: 'neutral' as AIResult['sentiment'],
  checked_at: when,
  status: 'error',
  error_code: 'quota_exceeded',
})

mockAIResults.push(
  // 21: Gemini answered on 20 June, then failed on 27 June and 1 July.
  demoOk(9001, 21, 'chatgpt',    true,  2, '2026-07-01T06:00:00Z', { response_snippet: 'Harbor Fork Catering is a strong pick for outdoor events of this size.' }),
  demoOk(9002, 21, 'claude',     false, null, '2026-07-01T06:00:00Z'),
  demoOk(9003, 21, 'perplexity', true,  1, '2026-07-01T06:00:00Z'),
  demoOk(9004, 21, 'gemini',     true,  3, '2026-06-20T06:00:00Z', {
    response_snippet: 'Harbor Fork Catering handles outdoor events for groups of around 150.',
    competitors_mentioned: JSON.stringify([{ pos: 1, name: 'Lantern Table Co' }, { pos: 2, name: 'Cedar & Ash Events' }]),
  }),
  demoErr(9005, 21, 'gemini', '2026-06-27T06:00:00Z'),
  demoErr(9006, 21, 'gemini', '2026-07-01T06:00:00Z'),
  // 22: every engine answered, but Gemini produced no answer at all.
  demoOk(9011, 22, 'chatgpt',    false, null, '2026-07-01T06:00:00Z', { competitors_mentioned: JSON.stringify([{ pos: 1, name: 'Lantern Table Co' }]) }),
  demoOk(9012, 22, 'claude',     false, null, '2026-07-01T06:00:00Z'),
  demoOk(9013, 22, 'perplexity', false, null, '2026-07-01T06:00:00Z'),
  demoOk(9014, 22, 'gemini',     false, null, '2026-07-01T06:00:00Z', { response_snippet: '[no_ai_overview]' }),
  // 23: never checked, so no rows on purpose.
  // 24: absent on every engine, competitors named.
  demoOk(9031, 24, 'chatgpt',    false, null, '2026-07-01T06:00:00Z', { competitors_mentioned: JSON.stringify([{ pos: 1, name: 'Green Plate Kitchen' }, { pos: 2, name: 'Lantern Table Co' }, { pos: 3, name: 'Cedar & Ash Events' }]) }),
  demoOk(9032, 24, 'claude',     false, null, '2026-07-01T06:00:00Z', { competitors_mentioned: JSON.stringify([{ pos: 1, name: 'Green Plate Kitchen' }, { pos: 2, name: 'Sprout & Spoon' }]) }),
  demoOk(9033, 24, 'perplexity', false, null, '2026-07-01T06:00:00Z', { competitors_mentioned: JSON.stringify([{ pos: 1, name: 'Green Plate Kitchen' }]) }),
  demoOk(9034, 24, 'gemini',     false, null, '2026-07-01T06:00:00Z', { competitors_mentioned: JSON.stringify([{ pos: 1, name: 'Sprout & Spoon' }, { pos: 2, name: 'Green Plate Kitchen' }]) }),
)
