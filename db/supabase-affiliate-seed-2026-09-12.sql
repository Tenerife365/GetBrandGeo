-- ============================================================================
-- supabase-affiliate-seed-2026-09-12.sql
-- Seed data for the affiliate module. Requires
-- db/supabase-affiliate-migration-2026-09-12.sql to be applied first.
--
-- Two sections, run them separately:
--
--   A. PRODUCTION. The BrandGEO program (the one the Stripe webhook credits,
--      slug 'brandgeo', see AFFILIATE_STRIPE_PROGRAM_SLUG) and a second,
--      private, DRAFT program for TalentWeLove so the multi-program shape is
--      exercised from day one. A draft program is invisible everywhere and
--      records nothing until an admin sets it to active. Idempotent: re-running
--      changes nothing that already exists.
--
--   B. DEMO / STAGING ONLY. Two placeholder affiliates (@example.com, no login,
--      status 'invited') with memberships, a link code each and one coupon code
--      wired to the existing Stripe promotion code for the partner free month.
--      Do NOT run this on production: affiliates cannot be deleted from the
--      admin page (financial rows are never hard-deleted), so placeholders
--      would sit in the list forever. On production, invite the real partners
--      from the admin page instead (docs/affiliates/ADMIN-GUIDE.md).
--
-- Money is in integer cents / basis points, never floats.
-- ============================================================================

-- ─── A. Programs ─────────────────────────────────────────────────────────────

INSERT INTO public.affiliate_programs (
  slug, name, tagline, description, destination_url, status, is_public, currency,
  lead_commission_cents, sale_commission_type, sale_commission_cents, sale_commission_bps,
  recurring_commission_bps, recurring_months, attribution_days, attribution_mode, approval_days,
  min_payout_cents, payout_schedule, terms_url, terms_version, brand_color
) VALUES (
  'brandgeo',
  'BrandGEO',
  'AI visibility monitoring for brands',
  'Refer companies that want to know how ChatGPT, Gemini, Claude, Perplexity and Google AI Mode describe them. You earn 20% of every payment your referrals make for their first 12 months. Free accounts earn nothing until they upgrade.',
  'https://getbrandgeo.com/',
  'active',
  true,
  'EUR',
  0,            -- no payment for a free signup
  'percent',
  0,
  2000,         -- 20% of every sale
  2000,         -- 20% of every renewal ...
  12,           -- ... for 12 months from the first sale
  30,           -- attribution window in days
  'last_touch',
  30,           -- approval delay: a refund inside 30 days reverses the commission before it is payable
  5000,         -- EUR 50.00 minimum payout
  'Monthly, within 15 days after month end',
  'https://getbrandgeo.com/affiliate-terms.html',
  '2026-09-12',
  '#8b5cf6'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.affiliate_programs (
  slug, name, tagline, description, destination_url, status, is_public, currency,
  lead_commission_cents, sale_commission_type, sale_commission_cents, sale_commission_bps,
  recurring_commission_bps, recurring_months, attribution_days, attribution_mode, approval_days,
  min_payout_cents, payout_schedule, terms_url, terms_version
) VALUES (
  'talentwelove',
  'TalentWeLove',
  'Recruiting services, referred by partners',
  'Private program: partners are invited by hand. A qualified lead (a company that books a discovery call) pays a fixed fee; a signed engagement pays a fixed fee on top.',
  'https://talentwelove.com/',
  'draft',      -- nothing is visible or tracked until an admin sets this to active
  false,        -- never listed on the public page even when active
  'EUR',
  5000,         -- EUR 50.00 per qualified lead
  'fixed',
  50000,        -- EUR 500.00 per signed engagement
  0,
  0,            -- one-time only
  NULL,
  60,
  'first_touch',
  30,
  10000,        -- EUR 100.00 minimum payout
  'Monthly, within 15 days after month end',
  'https://getbrandgeo.com/affiliate-terms.html',
  '2026-09-12'
)
ON CONFLICT (slug) DO NOTHING;

-- Promotional material shown to active members of the BrandGEO program.
INSERT INTO public.affiliate_resources (program_id, title, kind, url, body, sort_order)
SELECT p.id, r.title, r.kind, r.url, r.body, r.sort_order
FROM public.affiliate_programs p
CROSS JOIN (VALUES
  ('Free AI visibility audit (the page your link lands on)', 'link', 'https://getbrandgeo.com/#free-audit', NULL, 1),
  ('Pricing and plans', 'link', 'https://getbrandgeo.com/#pricing', NULL, 2),
  ('Research library (BG-001 to BG-105)', 'link', 'https://getbrandgeo.com/blog.html', NULL, 3),
  ('One-line pitch', 'text', NULL, 'BrandGEO shows you exactly what ChatGPT, Gemini, Claude and Perplexity say when someone asks for companies like yours, and what to fix so they name you.', 4)
) AS r(title, kind, url, body, sort_order)
WHERE p.slug = 'brandgeo'
  AND NOT EXISTS (SELECT 1 FROM public.affiliate_resources x WHERE x.program_id = p.id AND x.title = r.title);

-- ─── B. Demo affiliates (staging only, see the header) ───────────────────────
-- Uncomment to run. Everything below is placeholder data and creates no login.
/*
INSERT INTO public.affiliates (email, full_name, company, website, country, promo_method, status, payout_method, payout_details, email_hash, notes)
VALUES
  ('ana@partner-a.example.com', 'Ana Partner', 'Partner A Agency', 'https://partner-a.example.com', 'ES', 'Client newsletter and LinkedIn', 'invited', 'wise',
   '{"account_holder": "Ana Partner", "email": "ana@partner-a.example.com"}'::jsonb, encode(digest('ana@partner-a.example.com', 'sha256'), 'hex'), 'Seed placeholder'),
  ('ben@creator-b.example.com', 'Ben Creator', NULL, 'https://creator-b.example.com', 'DE', 'YouTube channel on AI tools', 'invited', 'paypal',
   '{"account_holder": "Ben Creator", "email": "ben@creator-b.example.com"}'::jsonb, encode(digest('ben@creator-b.example.com', 'sha256'), 'hex'), 'Seed placeholder')
ON CONFLICT DO NOTHING;

-- Ana in both programs, Ben in BrandGEO only.
INSERT INTO public.affiliate_memberships (affiliate_id, program_id, status)
SELECT a.id, p.id, 'invited'
FROM public.affiliates a JOIN public.affiliate_programs p ON (
  (a.email = 'ana@partner-a.example.com' AND p.slug IN ('brandgeo', 'talentwelove')) OR
  (a.email = 'ben@creator-b.example.com' AND p.slug = 'brandgeo'))
ON CONFLICT (affiliate_id, program_id) DO NOTHING;

-- One primary link code per membership.
INSERT INTO public.affiliate_codes (program_id, membership_id, affiliate_id, code, kind, is_primary)
SELECT m.program_id, m.id, m.affiliate_id,
       CASE WHEN a.email LIKE 'ana@%' THEN 'ANA10' ELSE 'BEN20' END || CASE WHEN p.slug = 'talentwelove' THEN 'TWL' ELSE '' END,
       'link', true
FROM public.affiliate_memberships m
JOIN public.affiliates a ON a.id = m.affiliate_id
JOIN public.affiliate_programs p ON p.id = m.program_id
WHERE a.email IN ('ana@partner-a.example.com', 'ben@creator-b.example.com')
  AND NOT EXISTS (SELECT 1 FROM public.affiliate_codes c WHERE c.membership_id = m.id AND c.kind = 'link');

-- A coupon code for Ben in BrandGEO, tied to the live "partner free month"
-- Stripe promotion code (coupon XKfymWe7, the 2026-08-02 affiliate ruling).
-- A checkout that uses this promotion code is attributed to Ben even without
-- a click. Replace the id with the real promotion code id from Stripe.
INSERT INTO public.affiliate_codes (program_id, membership_id, affiliate_id, code, kind, is_primary, stripe_promotion_code_id, note)
SELECT m.program_id, m.id, m.affiliate_id, 'BPRFREE', 'coupon', false, 'promo_1U06XY63lspobjfOcXNBKaSI', 'Partner free month'
FROM public.affiliate_memberships m
JOIN public.affiliates a ON a.id = m.affiliate_id
JOIN public.affiliate_programs p ON p.id = m.program_id
WHERE a.email = 'ben@creator-b.example.com' AND p.slug = 'brandgeo'
  AND NOT EXISTS (SELECT 1 FROM public.affiliate_codes c WHERE c.program_id = m.program_id AND upper(c.code) = 'BPRFREE');
*/

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT slug, status, is_public, sale_commission_bps, recurring_commission_bps, recurring_months, min_payout_cents FROM public.affiliate_programs ORDER BY created_at;
-- SELECT p.slug, count(r.*) AS resources FROM public.affiliate_programs p LEFT JOIN public.affiliate_resources r ON r.program_id = p.id GROUP BY p.slug;
