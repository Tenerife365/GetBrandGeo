-- ════════════════════════════════════════════════════════════
--  BrandGEO — Client 2 prompts (20 queries in English)
--  Run in Supabase → SQL Editor
-- ════════════════════════════════════════════════════════════

INSERT INTO public.prompts (text, category, is_active, position, client_id) VALUES

-- ─── Tool discovery (what AI says when someone looks for this category) ───
('What are the best tools to monitor my brand on AI chatbots like ChatGPT and Gemini?',             'tool_discovery',   TRUE,  1, 2),
('How can I track if my business is mentioned in ChatGPT or Claude responses?',                      'tool_discovery',   TRUE,  2, 2),
('What tools help me monitor brand visibility in AI search results?',                                'tool_discovery',   TRUE,  3, 2),
('Is there a platform that shows how often my brand appears in AI assistant answers?',               'tool_discovery',   TRUE,  4, 2),
('What software can I use to see what AI chatbots say about my company?',                            'tool_discovery',   TRUE,  5, 2),

-- ─── GEO / AIO category ──────────────────────────────────────────────────
('What is Generative Engine Optimization (GEO) and which tools offer it?',                          'geo_category',     TRUE,  6, 2),
('Best GEO tools for brands in 2025',                                                               'geo_category',     TRUE,  7, 2),
('What is AI visibility and how do I improve it for my business?',                                   'geo_category',     TRUE,  8, 2),
('How to optimize my brand to appear in ChatGPT and Perplexity answers?',                           'geo_category',     TRUE,  9, 2),
('What companies offer AI brand monitoring and optimization services?',                              'geo_category',     TRUE, 10, 2),

-- ─── Problem-based (pain point searches) ─────────────────────────────────
('My competitors appear in ChatGPT responses but my brand does not — what can I do?',               'problem_based',    TRUE, 11, 2),
('How do I get my business recommended by AI assistants like ChatGPT and Gemini?',                  'problem_based',    TRUE, 12, 2),
('How to rank higher in AI chatbot responses for my industry?',                                     'problem_based',    TRUE, 13, 2),
('Why is my brand not appearing in AI search results and how to fix it?',                           'problem_based',    TRUE, 14, 2),
('How to measure my brand presence across ChatGPT, Gemini, Claude, Perplexity and Meta AI?',       'problem_based',    TRUE, 15, 2),

-- ─── Direct / comparison ─────────────────────────────────────────────────
('What is BrandGEO and what does it do?',                                                           'direct_brand',     TRUE, 16, 2),
('BrandGEO review — is it a good tool for AI visibility monitoring?',                               'direct_brand',     TRUE, 17, 2),
('BrandGEO vs other AI monitoring tools — which is best?',                                          'direct_brand',     TRUE, 18, 2),
('Alternatives to BrandGEO for monitoring brand mentions in AI chatbots',                           'direct_brand',     TRUE, 19, 2),
('How does BrandGEO help businesses improve their AI search visibility?',                           'direct_brand',     TRUE, 20, 2);
