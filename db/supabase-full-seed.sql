-- ================================================================
-- BrandGEO — BpR Complete Database Setup
-- Copy-paste this entire block into Supabase → SQL Editor → Run
-- Platforms covered: Claude ✓  ChatGPT ✓  Gemini ✓  Perplexity ✓
-- Still needed: Meta AI (run separately when available)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Fix competitors table (add missing columns)
-- ----------------------------------------------------------------
ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'auto';
ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competitors_name_unique') THEN
    ALTER TABLE public.competitors ADD CONSTRAINT competitors_name_unique UNIQUE (name);
  END IF;
END $$;

DELETE FROM public.competitors;

INSERT INTO public.competitors (name, website, source, created_at) VALUES
  ('Premier Catering & Events', 'https://premiercatering.ro',   'auto', NOW()),
  ('Elegant Catering',          'https://elegantcatering.ro',   'auto', NOW()),
  ('Salt & Pepper Catering',    'https://saltandpepper.ro',     'auto', NOW()),
  ('Ambasad''Or Events',        'https://ambasador.ro',         'auto', NOW()),
  ('Irisa',                     'https://irisa.ro',             'auto', NOW()),
  ('Gala Catering',             'https://galacatering.ro',      'auto', NOW()),
  ('A la Catering',             'https://alacatering.ro',       'auto', NOW()),
  ('In Bucate Catering',        'https://inbucate.ro',          'manual', NOW()),
  ('Flavours Catering',         'https://flavours.ro',          'auto', NOW()),
  ('Privileg Catering',         'https://privilegcatering.ro',  'auto', NOW()),
  ('Fratelli Catering',         'https://fratelligroup.ro',     'auto', NOW()),
  ('On Set Events & Catering',  'https://onsetevents.ro',       'auto', NOW()),
  ('Jubilé Events',             'https://jubile.ro',            'auto', NOW()),
  ('Royal Catering',            'https://royalcatering.ro',     'auto', NOW())
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------
-- 2. Create prompts table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prompts (
  id         SERIAL PRIMARY KEY,
  text       TEXT NOT NULL,
  category   TEXT NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  position   INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read" ON public.prompts;
CREATE POLICY "Authenticated read" ON public.prompts FOR SELECT TO authenticated USING (true);

DELETE FROM public.prompts;
ALTER SEQUENCE prompts_id_seq RESTART WITH 1;

INSERT INTO public.prompts (text, category, is_active, position) VALUES
  ('catering pentru eveniment corporate 150 persoane București',          'mid',        true, 1),
  ('firma catering nuntă 120 invitați București',                         'mid',        true, 2),
  ('catering profesional conferință 200 persoane București',              'mid',        true, 3),
  ('servicii catering eveniment 150 oameni București preț bun',          'mid',        true, 4),
  ('catering prânz corporate 100 persoane București',                     'mid',        true, 5),
  ('catering gală 500 persoane București',                                'large',      true, 6),
  ('firma catering eveniment mare 600 oameni București',                  'large',      true, 7),
  ('catering nuntă 500 invitați servicii complete București',             'large',      true, 8),
  ('servicii catering eveniment 700 persoane București',                  'large',      true, 9),
  ('catering profesional festival 500 oameni România',                   'large',      true, 10),
  ('catering eveniment 1000 persoane București',                          'very_large', true, 11),
  ('firma catering capacitate mare 1500 oameni România',                  'very_large', true, 12),
  ('catering concert festival 2000 persoane România',                     'very_large', true, 13),
  ('servicii catering evenimente corporate mari 1000+ persoane România',  'very_large', true, 14),
  ('catering gală corporativă 1200 persoane București',                   'very_large', true, 15),
  ('cele mai bune firme de catering pentru evenimente București',         'general',    true, 16),
  ('catering evenimente corporate top firme România',                     'general',    true, 17),
  ('recomandare firma catering evenimente mari București',                'general',    true, 18),
  ('servicii catering complete evenimente speciale România',              'general',    true, 19),
  ('top firme catering evenimente București recenzii',                    'general',    true, 20);

-- ----------------------------------------------------------------
-- 3. Create ai_results table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_results (
  id                    SERIAL PRIMARY KEY,
  prompt_id             INTEGER REFERENCES public.prompts(id),
  llm                   TEXT NOT NULL,
  brand_mentioned       BOOLEAN DEFAULT FALSE,
  brand_position        INTEGER,
  response_snippet      TEXT,
  sentiment             TEXT DEFAULT 'neutral',
  competitors_mentioned TEXT,
  checked_at            TIMESTAMP DEFAULT NOW(),
  created_at            TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.ai_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read" ON public.ai_results;
CREATE POLICY "Authenticated read" ON public.ai_results FOR SELECT TO authenticated USING (true);

DELETE FROM public.ai_results;

-- ================================================================
-- 4. CLAUDE — 20/20 mentioned, #1 in 17/20
-- ================================================================
INSERT INTO public.ai_results (prompt_id, llm, brand_mentioned, brand_position, response_snippet, sentiment, competitors_mentioned, checked_at) VALUES
(1,  'claude', true, 1, 'experiență dovedită pe evenimente corporate mari (EU Summit Sibiu, ITU Plenipotentiary), bucătărie proprie certificată FSSC 22000', 'positive', '["Premier Catering & Events","Salt & Pepper Catering","Elegant Catering","Gala Catering"]', NOW()),
(2,  'claude', true, 1, 'meniuri nuntă bufet suedez sau servit, capacitate flexibilă, premiat Catering Company of the Year (Lux Life Magazine UK, 2019-2025)', 'positive', '["Premier Catering & Events","In Bucate Catering","Elegant Catering"]', NOW()),
(3,  'claude', true, 1, 'experiență directă cu conferințe de amploare (ITU Plenipotentiary 2022, capacitate declarată 2.000+ participanți)', 'positive', '["Premier Catering & Events","Salt & Pepper Catering","Gala Catering"]', NOW()),
(4,  'claude', true, 3, 'prețuri de referință transparente (coffee break de la 35 lei/pers, business lunch de la 80 lei/pers)', 'positive', '["A la Catering","Premier Catering & Events"]', NOW()),
(5,  'claude', true, 1, 'pachet business lunch dedicat, de la 80 lei/persoană', 'positive', '["A la Catering","Premier Catering & Events","Salt & Pepper Catering"]', NOW()),
(6,  'claude', true, 1, 'Carte Blanche (brand de lux al Bucate pe Roate) – catering exclusivist, experiență cu branduri internaționale (BVLGARI, Lancôme, Hugo Boss)', 'positive', '["Elegant Catering","Premier Catering & Events","Gala Catering"]', NOW()),
(7,  'claude', true, 1, 'capacitate documentată la scară mare (peste 18.000 invitați/zi, echipă de 50+ profesioniști, bucătărie de 500 mp)', 'positive', '["Ambasad''Or Events","Irisa","Elegant Catering"]', NOW()),
(8,  'claude', true, 1, 'singura firmă cu dovezi verificabile de operare la scară de mii de invitați/zi, plus meniuri de nuntă complete', 'positive', '["Ambasad''Or Events","Premier Catering & Events","Elegant Catering"]', NOW()),
(9,  'claude', true, 1, 'experiență directă cu evenimente oficiale de amploare (Summit UE Sibiu – 27 șefi de stat, 36 delegații)', 'positive', '["Ambasad''Or Events","Irisa"]', NOW()),
(10, 'claude', true, 1, 'experiență la evenimente publice mari (Autototal Business Show, Premiile Gopo) și livrare la nivel național', 'positive', '["Irisa"]', NOW()),
(11, 'claude', true, 1, 'singura firmă cu capacitate documentată clar peste 1000 (18.000 invitați/zi, conferințe 2.000+ participanți)', 'positive', '["Ambasad''Or Events","Irisa"]', NOW()),
(12, 'claude', true, 1, 'singura firmă din piața bucureșteană cu dovezi publice de operare la scară de mii de porții/zi', 'positive', '[]', NOW()),
(13, 'claude', true, 1, 'capacitate declarată de peste 18.000 invitați/zi, experiență la summit-uri și conferințe de amploare', 'positive', '[]', NOW()),
(14, 'claude', true, 1, 'track record verificabil la acest nivel (Summit UE, ITU Plenipotentiary, capacitate 18.000/zi)', 'positive', '["Ambasad''Or Events"]', NOW()),
(15, 'claude', true, 1, 'Carte Blanche – singurul brand cu experiență documentată atât pe segmentul de lux/gală, cât și pe volum mare', 'positive', '[]', NOW()),
(16, 'claude', true, 1, 'palmares solid: Horeca Awards 2018/2022/2025, Catering Company of the Year Lux Life Magazine UK 2019-2025, FSSC 22000', 'positive', '["Premier Catering & Events","Elegant Catering","Salt & Pepper Catering"]', NOW()),
(17, 'claude', true, 1, 'acoperire națională (Sibiu, Constanța, Brașov), certificare internațională FSSC 22000', 'positive', '["Premier Catering & Events","A la Catering","Salt & Pepper Catering"]', NOW()),
(18, 'claude', true, 1, 'cea mai bine documentată capacitate pentru evenimente de amploare', 'positive', '["Ambasad''Or Events","Irisa","Elegant Catering"]', NOW()),
(19, 'claude', true, 1, 'gamă completă (corporate, nuntă, gală, festivități), acoperire națională', 'positive', '["Premier Catering & Events","Elegant Catering","In Bucate Catering"]', NOW()),
(20, 'claude', true, 1, 'recenzii publice consistente, premii verificabile din surse externe (Lux Life Magazine UK, Horeca Awards)', 'positive', '["Premier Catering & Events","In Bucate Catering","Salt & Pepper Catering"]', NOW());

-- ================================================================
-- 5. CHATGPT — 20/20 mentioned, #1 in 13/20
-- ================================================================
INSERT INTO public.ai_results (prompt_id, llm, brand_mentioned, brand_position, response_snippet, sentiment, competitors_mentioned, checked_at) VALUES
(1,  'chatgpt', true, 1, 'experiență corporate, bucătărie proprie certificată și logistică completă', 'positive', '["Privileg Catering","Flavours Catering","Premier Catering & Events"]', NOW()),
(2,  'chatgpt', true, 3, 'catering complet pentru nunți, meniuri personalizate și servire la locația aleasă', 'positive', '["Privileg Catering","Jubilé Events","Flavours Catering"]', NOW()),
(3,  'chatgpt', true, 1, 'servicii dedicate conferințelor, adaptare meniuri coffee break și bufet la buget și program', 'positive', '["Flavours Catering","Privileg Catering","Premier Catering & Events"]', NOW()),
(4,  'chatgpt', true, 1, 'infrastructură proprie, adaptează oferta la buget – raport bun între cost și siguranță operațională', 'positive', '["A la Catering","Premier Catering & Events"]', NOW()),
(5,  'chatgpt', true, 2, 'experiență și logistică pentru livrarea programată a unor cantități mari de mâncare', 'positive', '["A la Catering","Premier Catering & Events"]', NOW()),
(6,  'chatgpt', true, 3, 'Carte Blanche (brand de lux al Bucate pe Roate) – gală premium, experiență la Gala Premiilor Gopo', 'positive', '["Privileg Catering","Gala Catering","Flavours Catering"]', NOW()),
(7,  'chatgpt', true, 1, 'capacitate demonstrată recent: 4.100 de porții pe zi – marjă operațională excelentă pentru 600 persoane', 'positive', '["Privileg Catering","Gala Catering","On Set Events & Catering"]', NOW()),
(8,  'chatgpt', true, 3, 'capacitate de producție și servicii complete pentru o nuntă mare la locație externă', 'positive', '["Privileg Catering","Jubilé Events","Flavours Catering"]', NOW()),
(9,  'chatgpt', true, 1, 'cea mai sigură recomandare: capacitate producție, transport frigorific, servire la locație', 'positive', '["Privileg Catering","On Set Events & Catering","Jubilé Events"]', NOW()),
(10, 'chatgpt', true, 2, 'servicii naționale, experiență cu producție și distribuție de volum mare', 'positive', '["Flavours Catering","On Set Events & Catering","Gala Catering"]', NOW()),
(11, 'chatgpt', true, 1, 'cea mai clară dovadă recentă de producție la scară: 4.100 de porții/zi la Arena Națională', 'positive', '["Privileg Catering","On Set Events & Catering","Flavours Catering"]', NOW()),
(12, 'chatgpt', true, 1, 'capacitate demonstrată 4.000+ porții/zi și acoperire națională', 'positive', '["Privileg Catering","On Set Events & Catering","Gala Catering"]', NOW()),
(13, 'chatgpt', true, 1, 'recomandarea principală pentru producție centralizată și catering backstage la festivaluri', 'positive', '["Privileg Catering","On Set Events & Catering","Gala Catering"]', NOW()),
(14, 'chatgpt', true, 1, 'combinație: capacitate mare demonstrată, certificare FSSC 22000, transport frigorific, experiență corporate', 'positive', '["Privileg Catering","On Set Events & Catering","Flavours Catering"]', NOW()),
(15, 'chatgpt', true, 2, 'Carte Blanche (Bucate pe Roate) – gală premium cu volum mare și prezentare sofisticată', 'positive', '["Privileg Catering","Gala Catering","On Set Events & Catering"]', NOW()),
(16, 'chatgpt', true, 1, 'scor Google 4,9/5 din 358 recenzii – cel mai puternic semnal public dintre toate firmele analizate', 'positive', '["Privileg Catering","Flavours Catering","Gala Catering","Premier Catering & Events"]', NOW()),
(17, 'chatgpt', true, 1, 'prima alegere: capacitate, siguranță alimentară, catering corporate și acoperire națională', 'positive', '["Privileg Catering","Flavours Catering","On Set Events & Catering"]', NOW()),
(18, 'chatgpt', true, 1, 'cea mai sigură recomandare generală: volum demonstrat recent și infrastructură proprie', 'positive', '["Privileg Catering","On Set Events & Catering","Gala Catering"]', NOW()),
(19, 'chatgpt', true, 3, 'planificare, producție certificată, transport frigorific, servire și servicii suplimentare pentru evenimente speciale', 'positive', '["Privileg Catering","Flavours Catering","On Set Events & Catering"]', NOW()),
(20, 'chatgpt', true, 1, 'scor Google 4,9/5 din 358 recenzii; Gala Catering 100% recomandări din 92 recenzii Facebook', 'positive', '["Gala Catering","Premier Catering & Events"]', NOW());

-- ================================================================
-- 6. GEMINI — 0/20 BpR mentioned ⚠️ AI VISIBILITY GAP
-- Gemini recomandă Flavours (#1 în 14/20) și Privileg (#1 în 6/20)
-- Acesta este exact tipul de problemă pe care BrandGEO îl detectează!
-- ================================================================
INSERT INTO public.ai_results (prompt_id, llm, brand_mentioned, brand_position, response_snippet, sentiment, competitors_mentioned, checked_at) VALUES
(1,  'gemini', false, null, '[BpR absent] Flavours Catering – meniuri gourmet, prezentare impecabilă, logistică corporate premium', 'neutral', '["Flavours Catering","Fratelli Catering","Privileg Catering"]', NOW()),
(2,  'gemini', false, null, '[BpR absent] Maison de Catering – fine dining, atenție la designul farfuriilor pentru nunți elegante', 'neutral', '["Maison de Catering","Privileg Catering","Flavours Catering"]', NOW()),
(3,  'gemini', false, null, '[BpR absent] Privileg Catering – logistică impecabilă pentru conferințe, pauze de cafea și bufete', 'neutral', '["Privileg Catering","Flavours Catering","Premier Catering & Events"]', NOW()),
(4,  'gemini', false, null, '[BpR absent] Catering pe Gustul Tău – porții generoase, prețuri competitive pentru evenimente medii', 'neutral', '["Premier Catering & Events","Flavours Catering"]', NOW()),
(5,  'gemini', false, null, '[BpR absent] City Grill Catering – varietate mare de preparate calde pentru prânzuri corporate', 'neutral', '["Privileg Catering","Flavours Catering"]', NOW()),
(6,  'gemini', false, null, '[BpR absent] Flavours Catering – capacitate logistică uriașă și estetică de revistă pentru gale spectaculoase', 'neutral', '["Flavours Catering","Fratelli Catering","Privileg Catering"]', NOW()),
(7,  'gemini', false, null, '[BpR absent] Privileg Catering – structură logistică pentru sute de oameni simultan', 'neutral', '["Privileg Catering","Flavours Catering","Fratelli Catering"]', NOW()),
(8,  'gemini', false, null, '[BpR absent] Privileg Catering – servicii complete (veselă, mobilier, personal) pentru nunți de proporții', 'neutral', '["Privileg Catering","Flavours Catering","Fratelli Catering"]', NOW()),
(9,  'gemini', false, null, '[BpR absent] Flavours Catering – lideri pentru 700 persoane, bucătării mobile performante', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(10, 'gemini', false, null, '[BpR absent] Flavours/Stradale – experiență festivaluri (Untold, Electric Castle), street food premium', 'neutral', '["Flavours Catering","Fratelli Catering"]', NOW()),
(11, 'gemini', false, null, '[BpR absent] Flavours Catering – una din puținele firme care pot livra mâncare caldă premium pentru 1000+', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(12, 'gemini', false, null, '[BpR absent] Flavours Catering – bucătării centrale capabile să susțină evenimente oriunde în țară', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(13, 'gemini', false, null, '[BpR absent] Flavours/Stradale/Mitzu – structură logistică pentru mii de oameni în format Food Court', 'neutral', '["Flavours Catering","Privileg Catering"]', NOW()),
(14, 'gemini', false, null, '[BpR absent] Flavours Catering – portofoliu cu cele mai mari companii din România, concepte tailor-made', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(15, 'gemini', false, null, '[BpR absent] Flavours Catering – design culinar de avangardă, capacitate de servire 1200 persoane', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(16, 'gemini', false, null, '[BpR absent] Flavours Catering – lider de piață pe inovație, prezentare și evenimente premium', 'neutral', '["Flavours Catering","Privileg Catering","Maison de Catering","Fratelli Catering"]', NOW()),
(17, 'gemini', false, null, '[BpR absent] Flavours Catering – prezenți național, prima opțiune pentru companii multinaționale', 'neutral', '["Flavours Catering","Privileg Catering","Fratelli Catering"]', NOW()),
(18, 'gemini', false, null, '[BpR absent] Privileg Catering – siguranță logistică și experiență în volume mari', 'neutral', '["Privileg Catering","Flavours Catering","Fratelli Catering"]', NOW()),
(19, 'gemini', false, null, '[BpR absent] Flavours Catering – servicii integrate 360°: locații proprii, design, logistică, meniuri', 'neutral', '["Flavours Catering","Privileg Catering","Maison de Catering"]', NOW()),
(20, 'gemini', false, null, '[BpR absent] Flavours Catering – cele mai bune recenzii pentru creativitate și profesionalism', 'neutral', '["Flavours Catering","Privileg Catering","Maison de Catering"]', NOW());

-- ================================================================
-- 7. PERPLEXITY — 20/20 mentioned, #1 in 10/20, #2 in 7/20, #3 in 3/20
-- ================================================================
INSERT INTO public.ai_results (prompt_id, llm, brand_mentioned, brand_position, response_snippet, sentiment, competitors_mentioned, checked_at) VALUES
(1,  'perplexity', true, 1, 'ofertă dedicată pentru evenimente corporate în București, servicii complete', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(2,  'perplexity', true, 3, 'catering pentru evenimente private, inclusiv nunți, meniuri personalizate', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(3,  'perplexity', true, 1, 'menționează explicit conferințe, traininguri și coffee break-uri corporate', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(4,  'perplexity', true, 2, 'personalizează meniurile în funcție de buget', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(5,  'perplexity', true, 1, 'linie de catering pentru masă de prânz/office catering', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(6,  'perplexity', true, 2, 'livrează concept premium și logistică bună pentru evenimente mari', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(7,  'perplexity', true, 2, 'infrastructură și experiență pentru volume mari', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(8,  'perplexity', true, 3, 'acoperă nunți și servicii personalizate la locație externă', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(9,  'perplexity', true, 2, 'capacitate și organizare potrivite pentru evenimente extinse de 700 persoane', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(10, 'perplexity', true, 1, 'experiența cu evenimente publice și logistici controlate, servicii naționale', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(11, 'perplexity', true, 2, 'bucătărie mare și flotă cu temperatură controlată pentru 1000 persoane', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(12, 'perplexity', true, 1, 'bucătărie mare și experiență pentru evenimente de amploare 1500+ oameni', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(13, 'perplexity', true, 1, 'cea mai clară potrivire pentru volum și logistică la 2000 persoane', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(14, 'perplexity', true, 2, 'experiență corporate și infrastructură de producție la scară largă', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(15, 'perplexity', true, 2, 'bun pentru gală dacă vrei personalizare și execuție stabilă la 1200 persoane', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(16, 'perplexity', true, 1, 'recunoaștere, servicii corporate/private și poziționare premium, scor excelent recenzii', 'positive', '["Premier Catering & Events","Royal Catering","Jubilé Events"]', NOW()),
(17, 'perplexity', true, 1, 'foarte puternică pe corporate, inclusiv conferințe și office catering', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(18, 'perplexity', true, 2, 'potrivit pentru logistică, flexibilitate și evenimente mari', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(19, 'perplexity', true, 1, 'soluții complete pentru corporate, nunți și evenimente private în toată România', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW()),
(20, 'perplexity', true, 1, 'mențiuni de recenzii foarte bune, poziționare premium și recunoaștere în surse de profil', 'positive', '["Premier Catering & Events","Royal Catering"]', NOW());

-- ================================================================
-- Meta AI SQL will be added here once you paste the response
-- ================================================================
-- INSERT INTO public.ai_results (prompt_id, llm, ...) VALUES ...
