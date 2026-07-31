-- ================================================================
-- BrandGEO — Meta AI data (final platform)
-- Run in Supabase → SQL Editor
-- Result: BpR mentioned 2/20 — only Q4 (#4) and Q10 (#4)
-- ================================================================

-- Add new competitors surfaced by Meta AI
INSERT INTO public.competitors (name, website, source, created_at) VALUES
  ('Blueberry Catering',  'https://blueberrrycatering.ro', 'auto', NOW()),
  ('Yummy Catering',      'https://yummycatering.ro',      'auto', NOW()),
  ('Violeta''s Catering', 'https://violetascatering.ro',   'auto', NOW()),
  ('SoldOut Catering',    'https://soldoutcatering.ro',    'auto', NOW())
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- META AI — 2/20 BpR mentioned ⚠️ (Q4 pos #4, Q10 pos #4)
-- Meta recommends: Blueberry, SoldOut, Flavours, Yummy, Violeta's
-- ================================================================
INSERT INTO public.ai_results (prompt_id, llm, brand_mentioned, brand_position, response_snippet, sentiment, competitors_mentioned, checked_at) VALUES
(1,  'meta', false, null, '[BpR absent] Blueberry Catering – cel mai bun raport calitate-preț pe corporate mediu', 'neutral', '["Blueberry Catering","Yummy Catering","Flavours Catering"]', NOW()),
(2,  'meta', false, null, '[BpR absent] Violeta''s Catering – recomandarea #1 pe nunți boutique, decor platouri spectaculos', 'neutral', '["Violeta''s Catering","Flavours Catering","Blueberry Catering","Privileg Catering"]', NOW()),
(3,  'meta', false, null, '[BpR absent] Flavours Food Design – experiență extinsă pe conferințe mari, coffee break+lunch box', 'neutral', '["Flavours Catering","Yummy Catering","Blueberry Catering"]', NOW()),
(4,  'meta', true,  4,    'concept street-food adaptat la evenimente, cost/persoană foarte bun', 'positive', '["Blueberry Catering","Yummy Catering","Flavours Catering"]', NOW()),
(5,  'meta', false, null, '[BpR absent] Yummy Catering – specialiști pe lunch corporate zilnic/săptămânal, abonamente flexibile', 'neutral', '["Yummy Catering","Blueberry Catering","Flavours Catering"]', NOW()),
(6,  'meta', false, null, '[BpR absent] Flavours Food Design – lider pe gale și evenimente black-tie, design culinar 5*', 'neutral', '["Flavours Catering","Violeta''s Catering","Privileg Catering","SoldOut Catering"]', NOW()),
(7,  'meta', false, null, '[BpR absent] SoldOut Catering – specializați pe 500-2000 persoane, bucătărie mobilă proprie', 'neutral', '["SoldOut Catering","Flavours Catering","Blueberry Catering"]', NOW()),
(8,  'meta', false, null, '[BpR absent] Flavours Food Design – pachete full-service: meniu, open bar, servire, decor mese', 'neutral', '["Flavours Catering","Violeta''s Catering","Privileg Catering","Premier Catering & Events"]', NOW()),
(9,  'meta', false, null, '[BpR absent] SoldOut Catering – infrastructură pentru 700+ invitați, timpi de servire sub 30 min', 'neutral', '["SoldOut Catering","Flavours Catering","Blueberry Catering"]', NOW()),
(10, 'meta', true,  4,    'concept flexibil tip street food, ideal pentru public tânăr la festivaluri', 'positive', '["SoldOut Catering","Blueberry Catering","Flavours Catering"]', NOW()),
(11, 'meta', false, null, '[BpR absent] SoldOut Catering – unul din puținii care duc 1000+ persoane cu bucătărie proprie', 'neutral', '["SoldOut Catering","Flavours Catering","Blueberry Catering","Premier Catering & Events"]', NOW()),
(12, 'meta', false, null, '[BpR absent] SoldOut Catering – lider național pe 1000-5000 persoane, flotă proprie de echipamente', 'neutral', '["SoldOut Catering","Flavours Catering","Blueberry Catering"]', NOW()),
(13, 'meta', false, null, '[BpR absent] SoldOut Catering – experiență pe Neversea, Untold, Saga – știu flux festival', 'neutral', '["SoldOut Catering","Blueberry Catering"]', NOW()),
(14, 'meta', false, null, '[BpR absent] Flavours Food Design – prima opțiune pentru multinaționale, standarde HACCP+ISO', 'neutral', '["Flavours Catering","SoldOut Catering","Blueberry Catering","Yummy Catering"]', NOW()),
(15, 'meta', false, null, '[BpR absent] Flavours Food Design – specializați pe gale corporate, decor+meniu+servire sincronizate', 'neutral', '["Flavours Catering","Privileg Catering","Violeta''s Catering","SoldOut Catering"]', NOW()),
(16, 'meta', false, null, '[BpR absent] Flavours Food Design – top absolut pe segmentul premium și imagine de brand', 'neutral', '["Flavours Catering","Violeta''s Catering","Blueberry Catering","SoldOut Catering","Yummy Catering"]', NOW()),
(17, 'meta', false, null, '[BpR absent] Flavours Food Design – prezenți în București/Cluj/Timișoara, standard unitar premium', 'neutral', '["Flavours Catering","SoldOut Catering","Blueberry Catering","Yummy Catering"]', NOW()),
(18, 'meta', false, null, '[BpR absent] SoldOut Catering – dacă ai 500+ persoane, ei sunt standardul de siguranță logistică', 'neutral', '["SoldOut Catering","Flavours Catering","Blueberry Catering","Premier Catering & Events"]', NOW()),
(19, 'meta', false, null, '[BpR absent] Flavours Food Design – full service: locație, decor, meniu, bar, entertainment, logistică 360', 'neutral', '["Flavours Catering","Violeta''s Catering","Privileg Catering","SoldOut Catering"]', NOW()),
(20, 'meta', false, null, '[BpR absent] Flavours Food Design – 4,9/5 din 500+ recenzii Google, lăudați pentru gust+prezentare', 'neutral', '["Flavours Catering","Violeta''s Catering","Blueberry Catering","Yummy Catering","SoldOut Catering"]', NOW());
