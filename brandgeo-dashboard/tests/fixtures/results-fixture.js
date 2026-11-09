// Fictional history for the Phase 2 results layer tests. No real brands or people.
// Active prompts 1 to 3, inactive prompt 4. Active engines chatgpt, gemini,
// claude; perplexity is an inactive engine. Timestamps are distinct per engine
// except claude's two prompt-3 rows (the equal checked_at case).
const COMP = JSON.stringify([{ pos: 1, name: 'Acme Co' }, { pos: 2, name: 'Beta Ltd' }])
function r(id, prompt_id, llm, o) {
  return {
    id, prompt_id, llm,
    status: o.status || 'ok',
    error_code: o.status === 'error' ? 'api_error' : null,
    brand_mentioned: !!o.m,
    brand_position: o.pos === undefined ? null : o.pos,
    sentiment: o.s || (o.m ? 'neutral' : 'none'),
    response_snippet: o.snip === undefined ? 'sample answer' : o.snip,
    competitors_mentioned: o.c || null,
    checked_at: o.at,
    model: null,
  }
}
const NOANS = '[no_ai_overview] no overview shown'
const history = [
  r(1, 1, 'chatgpt', { m: 1, pos: 2, s: 'positive', at: '2026-11-01T10:00:00' }),
  r(10, 1, 'chatgpt', { m: 1, pos: 1, s: 'positive', at: '2026-11-05T10:00:00', c: COMP }),
  r(2, 1, 'gemini', { at: '2026-11-01T10:00:00', c: COMP }),
  r(11, 1, 'gemini', { status: 'error', at: '2026-11-05T11:00:00' }),
  r(3, 1, 'claude', { m: 1, s: 'neutral', at: '2026-11-01T10:00:00' }),
  r(4, 2, 'chatgpt', { at: '2026-11-02T10:00:00', c: COMP }),
  r(5, 2, 'gemini', { m: 1, pos: 3, s: 'negative', at: '2026-11-01T11:00:00' }),
  r(12, 2, 'gemini', { status: 'error', at: '2026-11-03T10:00:00' }),
  r(13, 2, 'gemini', { status: 'error', at: '2026-11-04T10:00:00' }),
  r(14, 2, 'gemini', { status: 'error', at: '2026-11-05T09:00:00' }),
  r(15, 2, 'claude', { status: 'error', at: '2026-11-04T10:00:00' }),
  r(6, 3, 'chatgpt', { m: 1, pos: 4, s: 'neutral', at: '2026-11-02T11:00:00' }),
  r(16, 3, 'chatgpt', { snip: NOANS, at: '2026-11-05T12:00:00' }),
  r(8, 3, 'gemini', { at: '2026-11-02T12:00:00' }),
  r(18, 3, 'gemini', { status: 'error', at: '2026-11-04T12:00:00' }),
  r(17, 3, 'gemini', { snip: NOANS, at: '2026-11-05T13:00:00' }),
  r(19, 3, 'claude', { m: 1, pos: 2, s: 'positive', at: '2026-11-03T13:00:00' }),
  r(20, 3, 'claude', { at: '2026-11-03T13:00:00' }),
  r(21, 4, 'chatgpt', { m: 1, pos: 1, s: 'positive', at: '2026-11-02T13:00:00' }),
  r(22, 1, 'perplexity', { m: 1, pos: 1, s: 'positive', at: '2026-11-02T14:00:00' }),
]
const prompts = [
  { id: 1, text: 'best sample tool', category: 'general', is_active: true, position: 1, created_at: '2026-10-01T00:00:00' },
  { id: 2, text: 'sample tool pricing', category: 'mid', is_active: true, position: 2, created_at: '2026-10-01T00:00:00' },
  { id: 3, text: 'sample tool alternatives', category: 'mid', is_active: true, position: 3, created_at: '2026-10-01T00:00:00' },
  { id: 4, text: 'retired question', category: 'mid', is_active: false, position: 4, created_at: '2026-10-01T00:00:00' },
]
module.exports = {
  history, prompts,
  activePromptIds: [1, 2, 3],
  activeEngines: ['chatgpt', 'gemini', 'claude'],
}
