-- ================================================
-- BrandGEO — Platform data: ChatGPT + Gemini
-- Run AFTER supabase-seed-schema.sql
-- ================================================

-- Add unique constraint so we can upsert competitors safely
ALTER TABLE public.competitors ADD CONSTRAINT IF NOT EXISTS competitors_name_unique UNIQUE (name);

-- Add new competitors surfaced by ChatGPT & Gemini
INSERT INTO public.competitors (name, website, source, created_at) VALUES
  ('Flavours Catering',         'https://flavours.ro',          'auto', NOW()),
  ('Privileg Catering',         'https://privilegcatering.ro',  'auto', NOW()),
  ('Fratelli Catering',         'https://fratelligroup.ro',     'auto', NOW()),
  ('On Set Events & Catering',  'https://onsetevents.ro',       'auto', NOW()),
  ('Jubilé Events',             'https://jubile.ro',            'auto', NOW())
ON CONFLICT (name) DO NOTHING;

-- ========================
-- CHATGPT — 20/20 BpR mentioned, #1 in 13/20
-- ========================
INSERT INTO public.ai_results (prompt_id, llm, brand_mentioned, brand_position, response_snippet, sentiment, competitors_mentioned, checked_at) VALUES
(1,  'chatgpt', true, 1, 'experiență corporate, bucătărie proprie certificată și logistică completă', 'positive', '["Privileg Catering","Flavours Catering","Premier Catering & Events"]', NOW()),
(2,  'chatgpt', true, 3, 'catering complet pentru nunți, meniuri personalizate și servire la locația aleasă', 'positive', '["Privileg Catering","Jubilé Events","Flavours Catering"]', NOW()),
(3,  'chatgpt', true, 1, 'servicii dedicate conferințelor, adaptare meniuri coffee break și bufet la buget și program', 'positive', '["Flavours Catering","Privileg Catering","Premier Catering & Events"]', NOW()),
(4,  'chatgpt', true, 1, 'infrastructură proprie, adaptează oferta la buget – raport bun între cost și siguranță operațională', 'positive', '["Catering Delicios","A la Catering","Premier Catering & Events"]', NOW()),
(5,  'chatgpt', true, 2, 'experiență și logistică pentru livrarea programată a unor cantități mari de mâncare', 'positive', '["BunBun","A la Catering","Premier Catering & Events"]', NOW()),
(6,  'chatgpt', true, 3, 'Carte Blanche (brand de lux al Bucate pe Roate) – gală premium, experiență la Gala Premiilor Gopo', 'positive', '["Privileg Catering","Gala Catering","Flavours Catering"]', NOW()),
(7,  'chatgpt', true, 1, 'capacitate demonstrată recent: 4.100 de porții pe zi – marjă operațională excelentă pentru 600 persoane', 'positive', '["Privileg Catering","Gala Catering","On Set Events & Catering"]', NOW()),
(8,  'chatgpt', true, 3, 'capacitate de producție și servicii complete pentru o nuntă mare la locație externă', 'positive', '["Privileg Catering","Jubilé Events","Flavours Catering"]', NOW()),
(9,  'chatgpt', true, 1, 'cea mai sigură recomandare: capacitate producție, transport frigorific, servire la locație', 'positive', '["Privileg Catering","On Set Events & Catering","Jubilé Events"]', NOW()),
(10, 'chatgpt', true, 2, 'servicii naționale, experiență cu producție și distribuție de volum mare', 'positive', '["Flavours Catering","On Set Events & Catering","Gala Catering"]', NOW()),
(11, 'chatgpt', true, 1, 'cea mai clară dovadă recentă de producție la scară: 4.100 de porții/zi la Arena Națională', 'positive', '["Privileg Catering","On Set Events & Catering","Flavours Catering"]', NOW()),
(12, 'chatgpt', true, 1, 'capacitate demonstrată 4.000+ porții/zi și acoperire națională', 'positive', '["Privileg Catering","On Set Events & Catering","Gala Catering"]', NOW()),
(13, 'chatgpt', true, 1, 'recomandarea principală pentru producție centralizată, lunch-box-uri, catering backstage la festivaluri', 'positive', '["Privileg Catering","On Set Events & Catering","Gala Catering"]', NOW()),
(14, 'chatgpt', true, 1, 'combinație: capacitate mare demonstrată, certificare FSSC 22000, transport frigorific, experiență corporate', 'positive', '["Privileg Catering","On Set Events & Catering","Flavours Catering"]', NOW()),
(15, 'chatgpt', true, 2, 'Carte Blanche (Bucate pe Roate) – gală premium cu volum mare și prezentare sofisticată', 'positive', '["Privileg Catering","Gala Catering","On Set Events & Catering"]', NOW()),
(16, 'chatgpt', true, 1, 'scor Google 4,9/5 din 358 recenzii – cel mai puternic semnal public dintre toate firmele analizate', 'positive', '["Privileg Catering","Flavours Catering","Gala Catering","Premier Catering & Events"]', NOW()),
(17, 'chatgpt', true, 1, 'prima alegere: capacitate, siguranță alimentară, catering corporate și acoperire națională', 'positive', '["Privileg Catering","Flavours Catering","On Set Events & Catering"]', NOW()),
(18, 'chatgpt', true, 1, 'cea mai sigură recomandare generală: volum demonstrat recent și infrastructură proprie', 'positive', '["Privileg Catering","On Set Events & Catering","Gala Catering"]', NOW()),
(19, 'chatgpt', true, 3, 'planificare, producție certificată, transport frigorific, servire și servicii suplimentare pentru evenimente speciale', 'positive', '["Privileg Catering","Flavours Catering","On Set Events & Catering"]', NOW()),
(20, 'chatgpt', true, 1, 'scor Google 4,9/5 din 358 recenzii; Gala Catering 100% recomandări din 92 recenzii Facebook', 'positive', '["Gala Catering","Premier Catering & Events"]', NOW());

-- ========================
-- GEMINI — 0/20 BpR mentioned ⚠️ AI visibility gap!
-- This is the key finding: Gemini completely ignores Bucate pe Roate.
-- Gemini's default picks: Flavours (#1 in 14/20), Privileg (#1 in 6/20)
-- ========================
INSERT INTO public.ai_results (prompt_id, llm, brand_mentioned, brand_position, response_snippet, sentiment, competitors_mentioned, checked_at) VALUES
(1,  'gemini', false, null, '[BpR negăsit] Flavours Catering – meniuri gourmet, prezentare impecabilă, logistică corporate premium', 'neutral', '["Flavours Catering","Fratelli Catering","Privileg Catering"]', NOW()),
(2,  'gemini', false, null, '[BpR negăsit] Maison de Catering – fine dining, atenție la designul farfuriilor pentru nunți elegante', 'neutral', '["Maison de Catering","Privileg Catering","Flavours Catering"]', NOW()),
(3,  'gemini', false, null, '[BpR negăsit] Privileg Catering – logistică impecabilă pentru pauze de cafea și bufete de conferință', 'neutral', '["Privileg Catering","Flavours Catering","Premier Catering & Events"]', NOW()),
(4,  'gemini', false, null, '[BpR negăsit] Catering pe Gustul Tău – porții generoase, prețuri competitive pentru evenimente medii', 'neutral', '["Premier Catering & Events","Flavours Catering"]', NOW()),
(5,  'gemini', false, null, '[BpR negăsit] City Grill Catering – varietate mare de preparate calde pentru prânzuri corporate', 'neutral', '["Privileg Catering","Flavours Catering"]', NOW()),
(6,  'gemini', false, null, '[BpR negăsit] Flavours Catering – capacitate logistică uriașă și estetică de revistă pentru gale spectaculoase', 'neutral', '["Flavours Catering","Fratelli Catering","Privileg Catering"]', NOW()),
(7,  'gemini', false, null, '[BpR negăsit] Privileg Catering – structură logistică pentru sute de oameni, personal numeros', 'neutral', '["Privileg Catering","Flavours Catering","Fratelli Catering"]', NOW()),
(8,  'gemini', false, null, '[BpR negăsit] Privileg Catering – servicii complete (veselă, mobilier, personal) pentru nunți de proporții', 'neutral', '["Privileg Catering","Flavours Catering","Fratelli Catering"]', NOW()),
(9,  'gemini', false, null, '[BpR negăsit] Flavours Catering – lideri pentru evenimente de 700 persoane, bucătării mobile performante', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(10, 'gemini', false, null, '[BpR negăsit] Flavours/Stradale – experiență festivaluri (Untold, Electric Castle), street food premium', 'neutral', '["Flavours Catering","Fratelli Catering"]', NOW()),
(11, 'gemini', false, null, '[BpR negăsit] Flavours Catering – una din puținele firme care pot livra mâncare caldă premium pentru 1000+ persoane', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(12, 'gemini', false, null, '[BpR negăsit] Flavours Catering – bucătării centrale capabile să susțină evenimente oriunde în țară', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(13, 'gemini', false, null, '[BpR negăsit] Flavours/Stradale/Mitzu – structură logistică pentru mii de oameni în format Food Court', 'neutral', '["Flavours Catering","Privileg Catering"]', NOW()),
(14, 'gemini', false, null, '[BpR negăsit] Flavours Catering – portofoliu cu cele mai mari companii din România, concepte tailor-made', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(15, 'gemini', false, null, '[BpR negăsit] Flavours Catering – design culinar de avangardă, capacitate de servire 1200 persoane', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(16, 'gemini', false, null, '[BpR negăsit] Flavours Catering – lider de piață pe inovație, prezentare și evenimente premium', 'neutral', '["Flavours Catering","Privileg Catering","Maison de Catering","Fratelli Catering"]', NOW()),
(17, 'gemini', false, null, '[BpR negăsit] Flavours Catering – prezenți național, prima opțiune pentru companii multinaționale', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(18, 'gemini', false, null, '[BpR negăsit] Privileg Catering – siguranță logistică și experiență în volume mari', 'neutral', '["Privileg Catering","Flavours Catering","Fratelli Catering"]', NOW()),
(19, 'gemini', false, null, '[BpR negăsit] Flavours Catering – servicii integrate 360°: locații proprii, design, logistică, meniuri', 'neutral', '["Flavours Catering","Privileg Catering","Maison de Catering"]', NOW()),
(20, 'gemini', false, null, '[BpR negăsit] Flavours Catering – cele mai bune recenzii pentru creativitate și profesionalism', 'neutral', '["Flavours Catering","Privileg Catering","Maison de Catering"]', NOW());
