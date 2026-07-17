-- ============================================================
-- City AI-Visibility Research Program — seed SQL (2026-07-10)
-- Creates 6 internal research clients (one per city) + bilingual
-- industry-specific prompt sets. Purpose: run the real collection
-- pipeline per city to generate original, citable data for the
-- upcoming city landing pages (per rules/content-integrity.md —
-- real data, real content, no thin stubs).
--
-- Notes:
--  * plan = 'pro' so all 5 live engines collect.
--  * brand_name is a deliberate never-matching probe string — we are
--    measuring which LOCAL businesses get cited (competitors_mentioned),
--    not BrandGEO's own visibility. brand_mentioned will be false; the
--    signal lives in competitors_mentioned + per-engine response data.
--  * Non-EN cities use paired local/English prompts (same intent) so the
--    language delta per city is directly measurable (extends BG-014).
--  * Dublin excluded: no 'IE' market exists in marketContext.tsx yet.
--  * Run city collections one at a time from the dashboard (rate limit
--    is 150 rows/hr/client — each city is ~8 prompts x 5 engines = 40).
--
-- Cleanup when done (per city): DELETE FROM ai_results WHERE client_id = X;
-- DELETE FROM prompts WHERE client_id = X; DELETE FROM clients WHERE id = X;
-- ============================================================

-- 1. Research clients
-- (Note: the live clients table has NO brand_name column — CLAUDE.md §3 is
--  stale on this. Brand identity = name + brand_aliases.)
INSERT INTO clients (name, slug, plan, brand_aliases, brand_website, known_competitors, default_market_id, default_region_id)
VALUES
  ('Research — London',   'research-london',  'pro', ARRAY['brandgeo research probe zzqx'], NULL, ARRAY[]::text[], 'GB', 'LDN'),
  ('Research — Berlin',   'research-berlin',  'pro', ARRAY['brandgeo research probe zzqx'], NULL, ARRAY[]::text[], 'DE', 'BE'),
  ('Research — Madrid',   'research-madrid',  'pro', ARRAY['brandgeo research probe zzqx'], NULL, ARRAY[]::text[], 'ES', 'MAD'),
  ('Research — New York', 'research-newyork', 'pro', ARRAY['brandgeo research probe zzqx'], NULL, ARRAY[]::text[], 'US', 'NYC'),
  ('Research — Paris',    'research-paris',   'pro', ARRAY['brandgeo research probe zzqx'], NULL, ARRAY[]::text[], 'FR', 'PAR'),
  ('Research — Rome',     'research-rome',    'pro', ARRAY['brandgeo research probe zzqx'], NULL, ARRAY[]::text[], 'IT', 'ROM');

-- 2. Prompts (category 'geo_category', all active)
-- London: law firms, SaaS, financial services (EN only)
INSERT INTO prompts (client_id, text, category, is_active, position)
SELECT id, t, 'geo_category', true, pos FROM clients,
  (VALUES
    (1, 'Best employment law firms in London'),
    (2, 'Which London law firm should I use for a commercial contract dispute?'),
    (3, 'Best UK-based CRM software for a small business in London'),
    (4, 'Top project management SaaS tools used by London startups'),
    (5, 'Best independent financial advisors in London'),
    (6, 'Which London wealth management firms are recommended for expats?'),
    (7, 'Best fintech apps for business banking in the UK'),
    (8, 'Top-rated solicitors for property purchase in London')
  ) AS p(pos, t)
WHERE slug = 'research-london';

-- Berlin: SaaS, law firms, healthcare (DE/EN pairs)
INSERT INTO prompts (client_id, text, category, is_active, position)
SELECT id, t, 'geo_category', true, pos FROM clients,
  (VALUES
    (1, 'Beste Arbeitsrechtsanwälte in Berlin'),
    (2, 'Best employment lawyers in Berlin'),
    (3, 'Beste Buchhaltungssoftware für Startups in Deutschland'),
    (4, 'Best accounting software for startups in Germany'),
    (5, 'Beste Privatkliniken für Orthopädie in Berlin'),
    (6, 'Best private orthopedic clinics in Berlin'),
    (7, 'Welche HR-Software nutzen Berliner Startups?'),
    (8, 'Which HR software do Berlin startups use?')
  ) AS p(pos, t)
WHERE slug = 'research-berlin';

-- Madrid: hotels, real estate, restaurants (ES/EN pairs)
INSERT INTO prompts (client_id, text, category, is_active, position)
SELECT id, t, 'geo_category', true, pos FROM clients,
  (VALUES
    (1, 'Mejores hoteles boutique en el centro de Madrid'),
    (2, 'Best boutique hotels in central Madrid'),
    (3, 'Mejores agencias inmobiliarias para comprar piso en Madrid'),
    (4, 'Best real estate agencies for buying an apartment in Madrid'),
    (5, 'Mejores restaurantes para una cena de negocios en Madrid'),
    (6, 'Best restaurants for a business dinner in Madrid'),
    (7, '¿Qué hotel recomiendan cerca del aeropuerto de Madrid-Barajas?'),
    (8, 'Which hotel is recommended near Madrid-Barajas airport?')
  ) AS p(pos, t)
WHERE slug = 'research-madrid';

-- New York: law firms, real estate, SaaS (EN only)
INSERT INTO prompts (client_id, text, category, is_active, position)
SELECT id, t, 'geo_category', true, pos FROM clients,
  (VALUES
    (1, 'Best personal injury law firms in New York City'),
    (2, 'Which NYC law firm should I use for a startup incorporation?'),
    (3, 'Best real estate brokers for buying a condo in Manhattan'),
    (4, 'Top-rated property management companies in New York'),
    (5, 'Best CRM software for small businesses in the US'),
    (6, 'Which payroll software do New York startups recommend?'),
    (7, 'Best immigration lawyers in New York'),
    (8, 'Best rental listing platforms for apartments in NYC')
  ) AS p(pos, t)
WHERE slug = 'research-newyork';

-- Paris: hotels, restaurants, financial services (FR/EN pairs)
INSERT INTO prompts (client_id, text, category, is_active, position)
SELECT id, t, 'geo_category', true, pos FROM clients,
  (VALUES
    (1, 'Meilleurs hôtels boutique dans le Marais à Paris'),
    (2, 'Best boutique hotels in the Marais, Paris'),
    (3, 'Meilleurs restaurants gastronomiques pour un dîner d''affaires à Paris'),
    (4, 'Best fine dining restaurants for a business dinner in Paris'),
    (5, 'Meilleurs conseillers en gestion de patrimoine à Paris'),
    (6, 'Best wealth management advisors in Paris'),
    (7, 'Quelle banque en ligne recommandez-vous pour une PME française ?'),
    (8, 'Which online bank is recommended for a French small business?')
  ) AS p(pos, t)
WHERE slug = 'research-paris';

-- Rome: hotels, restaurants, real estate (IT/EN pairs)
INSERT INTO prompts (client_id, text, category, is_active, position)
SELECT id, t, 'geo_category', true, pos FROM clients,
  (VALUES
    (1, 'Migliori hotel boutique vicino al centro storico di Roma'),
    (2, 'Best boutique hotels near Rome''s historic center'),
    (3, 'Migliori ristoranti per una cena di lavoro a Roma'),
    (4, 'Best restaurants for a business dinner in Rome'),
    (5, 'Migliori agenzie immobiliari per comprare casa a Roma'),
    (6, 'Best real estate agencies for buying a home in Rome'),
    (7, 'Quale hotel consigliate vicino alla stazione Termini?'),
    (8, 'Which hotel is recommended near Termini station in Rome?')
  ) AS p(pos, t)
WHERE slug = 'research-rome';

-- 3. Verify
SELECT c.slug, c.default_market_id, c.default_region_id, count(p.id) AS prompts
FROM clients c LEFT JOIN prompts p ON p.client_id = c.id
WHERE c.slug LIKE 'research-%'
GROUP BY c.slug, c.default_market_id, c.default_region_id
ORDER BY c.slug;
