-- ============================================================================
-- supabase-prospects-backfill-2026-08-15.sql
-- One-time backfill of public.prospects (supabase-prospects-migration.sql)
-- from two sources, merged on domain:
--
--   Source 1, Supabase: all 70 distinct domains in prospect_audits where
--   status = 'ready'. Latest ready row per domain (created_at desc, id desc)
--   supplies audit_token, ai_score, category (into segment), competitor_count
--   (jsonb_array_length(competitor_flags)).
--
--   Source 2, Google Drive: G:\My Drive\CST Content\GetBrandGEO\7-Sales\
--   2026-08-14-founder-led-prospecting\ -- 51-qualification-recheck-2026-08-14.md,
--   60-evidence-run-2026-08-14.md, 10-prospects.csv,
--   05-STANDING-CORRECTIONS-AND-RUNBOOK-V2.md. Supplies company, named
--   contact, and verified (HTTP 200) contact routes, plus the tier1/tier2/
--   tier3 qualification calls.
--
-- getglossa.com is Drive-only (no prospect_audits row ever) and is inserted
-- with no audit_token/ai_score/segment, per the rule against inventing data.
--
-- 71 rows total. Safe to re-run: ON CONFLICT (domain) DO NOTHING, so it never
-- clobbers a stage/owner/notes an admin has since set through the UI.
--
-- A real finding this backfill surfaced, not invented: 51-qualification-
-- recheck-2026-08-14.md records the 9 tier-2 domains as "check 4 open" (their
-- category had never been measured, at doc-write time). But prospect_audits
-- now holds a fresh ready row for all 9, timestamped 2026-08-14 21:44-21:55,
-- the same batch window as the tier-1 audits the Drive doc DOES report. That
-- batch was apparently run but never written back into the Drive doc (which
-- still describes resolving the 9 as future work costing EUR 2.02). This
-- backfill applies the qualification bar's own stated D4 rule (ai_score < 50
-- AND competitor_flags non-empty AND NOT low_confidence) to that real,
-- measured data: 4 of the 9 now qualify (stage='audited'), 5 fail D4
-- (stage='disqualified'). See the bg-backend report for the domain-by-domain
-- breakdown and the one real source disagreement found (revenuehunt.com:
-- documented disqualifying score of 54 at 21:48, a re-audit 3 minutes later
-- at 21:51 scored 0; the documented disqualification was kept as recorded,
-- flagged for a human decision rather than silently resolved).
-- ============================================================================

insert into public.prospects
  (domain, company, contact_name, contact_role, contact_url, segment, tier,
   stage, disqualified_reason, audit_token, ai_score, competitor_count, source, notes)
values

-- ── Our own domain / Constantin's other company. Not sales prospects. ──────
('getbrandgeo.com', 'BrandGEO', null, null, null, 'AI visibility intelligence', null,
 'disqualified', 'Own domain, not a sales prospect.',
 'rMzEwfaqvDSHEFYORzXPWW6o', 0, 2, 'outbound', null),

('talentwelove.com', 'TalentWeLove', null, null, null, 'AI recruitment agency', null,
 'disqualified', 'Constantin''s own company (TalentWeLove), not a BrandGEO sales prospect.',
 'oyvj0SgmmosFGLjDZ8Z6UsFa', 0, 3, 'outbound', null),

-- ── Tier 1 (51-qualification-recheck-2026-08-14.md): passed all 4 checks. ──
-- 5 qualified per D4 (60-evidence-run-2026-08-14.md).
('lawcus.com', 'Lawcus', 'Harsimran (Harry) Singh', 'CEO',
 'https://lawcus.com/contact-us/', 'legal practice management software', 1,
 'audited', null, '9E8gooatqve-HmJUByTdEuXq', 0, 4, 'outbound', null),

('pagelightprime.com', 'PageLightPrime', null, null,
 'https://www.pagelightprime.com/pagelightprime-legal-contact', 'legal case management software', 1,
 'audited', null, 'ce4NsXL5NBHhFTZm9cmZlB6M', 0, 5, 'outbound', null),

('intellibill.io', 'IntelliBill, LLC', null, null,
 'https://intellibill.io/contact', 'legal billing software', 1,
 'audited', null, 'Q2q1vM5RrsOLeBuoD9qA7QZJ', 0, 3, 'outbound',
 'Trap: intellibill.com (no .io) redirects to visual-eyes.ca, an unrelated company. Always audit and contact intellibill.io, never intellibill.com.'),

('pureclarity.com', 'PureClarity', null, null,
 'https://www.pureclarity.com/contact-us', 'conversion rate optimization', 1,
 'audited', null, 'uBm55JUjyf3f4Q7ZTF_Z7Var', 0, 4, 'outbound', null),

('glood.ai', 'Glood.AI (Loopclub Ltd)', 'Harshul Jain', 'Founder and CEO',
 'https://glood.ai/contact', 'eCommerce AI solutions', 1,
 'audited', null, 'fSYVjKhY-aiQDmqC7g5iW3FL', 0, 2, 'outbound', null),

-- 3 disqualified per D4.
('casetempo.com', 'Case Tempo', null, null,
 'https://casetempo.com/contact_us.html', 'legal case management software', 1,
 'disqualified', 'Disqualified by D4: ai_score 68 (>= 50), measured 2026-08-14. Source: 60-evidence-run-2026-08-14.md. Was ranked number 1 on the original tier-1 list before this measurement.',
 'nC_wF3MDP4MkMAFUXQ87nXst', 68, 1, 'outbound', null),

('caretlegal.com', 'CaretLegal', null, null,
 'https://caretlegal.com/contact-us/', 'legal practice management software', 1,
 'disqualified', 'Disqualified by D4: ai_score 55 (>= 50), measured 2026-08-14. Source: 60-evidence-run-2026-08-14.md.',
 'E_jAfECBRp6v30pjxyUeVf-Y', 55, 2, 'outbound',
 'Contact form 403s to plain HTTP clients; open in a real browser if revisited. Working contact route is /contact-us/, not /contact/ which 404s.'),

('revenuehunt.com', 'RevenueHunt', null, null,
 'https://revenuehunt.com/contact/', 'product recommendation software', 1,
 'disqualified', 'Disqualified by D4: ai_score 54 (>= 50), measured 2026-08-14 21:48 (60-evidence-run-2026-08-14.md). SOURCE DISAGREEMENT, unresolved: a re-audit 3 minutes later at 21:51 scored 0, which would pass D4. The Drive record''s disqualification decision was not reversed, so it is kept as recorded here (ai_score below is the LATEST audit, 0, per this migration''s own rule of carrying the latest ready row; it does not match this stage). Needs a human decision, not resolved by this migration.',
 'MVte-YWYz5nWgkiP_gSILG-h', 0, 1, 'outbound', null),

-- ── Tier 2 (51-qualification-recheck-2026-08-14.md): checks 1-3 verified, ─
-- check 4 was open at doc-write time. Resolved here from a fresh 2026-08-14
-- prospect_audits row the Drive doc does not yet reflect (see file header).
-- 4 qualify under D4.
('easydvm.com', 'EasyDVM', null, null,
 'https://easydvm.com/vet/contact.php', 'veterinary practice management', 1,
 'audited', null, 'PtjOueql68OFQ4_kriLJ9bZn', 0, 4, 'outbound',
 'Tier 2 in 51-qualification-recheck-2026-08-14.md (contact route verified 200; category/check 4 was open at doc-write time). Resolved here from a fresh 2026-08-14 prospect_audits row: ai_score 0, competitor_count 4, low_confidence false, qualifies under D4. Drive doc has not been updated to reflect this.'),

('smilenotes.co.uk', 'Smilenotes Ltd', null, null,
 'https://smilenotes.co.uk/help/contact', 'practice management software', 1,
 'audited', null, 'bOqwltYURQItNKhYKUzRh8Lu', 0, 4, 'outbound',
 'Tier 2 in 51-qualification-recheck-2026-08-14.md (contact route verified 200; category/check 4 was open at doc-write time). Resolved here from a fresh 2026-08-14 prospect_audits row: ai_score 0, competitor_count 4, low_confidence false, qualifies under D4. Drive doc has not been updated to reflect this.'),

('driveschoolpro.com', 'DriveSchoolPro (LEAVE.REVIEW LTD)', null, null,
 'https://driveschoolpro.com/contact/', 'driving school software', 1,
 'audited', null, '1Z-Hgs160b97XWrv-Apcue70', 0, 2, 'outbound',
 'Tier 2 in 51-qualification-recheck-2026-08-14.md (contact route verified 200; category/check 4 was open at doc-write time). Resolved here from a fresh 2026-08-14 prospect_audits row: ai_score 0, competitor_count 2, low_confidence false, qualifies under D4. Drive doc has not been updated to reflect this.'),

('vibefam.com', 'Vibefam', null, null,
 'https://vibefam.com/contact-us/', 'gym management software', 1,
 'audited', null, '12QW0p-YdnjkzmKNDe-3n38a', 0, 2, 'outbound',
 'Tier 2 in 51-qualification-recheck-2026-08-14.md (contact route verified 200; category/check 4 was open at doc-write time). Resolved here from a fresh 2026-08-14 prospect_audits row: ai_score 0, competitor_count 2, low_confidence false, qualifies under D4. Drive doc has not been updated to reflect this.'),

-- 5 fail D4.
('unittrac.com', 'Unit Trac (Smallenberger, Inc.)', null, null,
 'https://unittrac.com/contact', 'self-storage management software', 1,
 'disqualified', 'Disqualified by D4: ai_score 85 (>= 50), measured 2026-08-14 (fresh audit; 51-qualification-recheck-2026-08-14.md had this domain as check-4 open, contact route already verified 200).',
 'I4SZUqGMLmfwxxdMVgJwWNmf', 85, 1, 'outbound', null),

('captainbook.io', 'CaptainBook', null, null,
 'https://captainbook.io/contact-us', 'online booking software', 1,
 'disqualified', 'Disqualified by D4: ai_score 53 (>= 50), measured 2026-08-14 (fresh audit; 51-qualification-recheck-2026-08-14.md had this domain as check-4 open, contact route already verified 200).',
 'bwBnHQVUdpm422i-M1JZMbio', 53, 1, 'outbound', null),

('storeganise.com', 'Storeganise', null, null,
 'https://storeganise.com/contact', 'self storage software', 1,
 'disqualified', 'Disqualified by D4: ai_score 75 (>= 50), measured 2026-08-14 (fresh audit; 51-qualification-recheck-2026-08-14.md had this domain as check-4 open, contact route already verified 200).',
 'sX65QHF8nMl4t9dKy8nd5Nc5', 75, 1, 'outbound', null),

('getonstage.app', 'OnStage', null, null,
 'https://www.getonstage.app/contact', 'church service planning', 1,
 'disqualified', 'Disqualified by D4: ai_score 67 (>= 50), measured 2026-08-14 (fresh audit; 51-qualification-recheck-2026-08-14.md had this domain as check-4 open, contact route already verified 200).',
 's0Cd74oHFi_H6UstCj48VyzK', 67, 3, 'outbound', null),

('breww.com', 'Breww', null, null,
 'https://breww.com/contact/', 'brewery management software', 1,
 'disqualified', 'Disqualified by D4: ai_score 73 (>= 50), measured 2026-08-14 (fresh audit; 51-qualification-recheck-2026-08-14.md had this domain as check-4 open, contact route already verified 200).',
 'I43e7h2-cBHm8YPikgx9xznH', 73, 0, 'outbound', null),

-- ── Tier 3, removed. No verifiable contact route. ───────────────────────────
('emailoctopus.com', 'EmailOctopus', null, null, null, 'email marketing software', 3,
 'disqualified', 'No verifiable contact route: /contact, /contact-us and /support all return 404 (checked 2026-08-14). Category also measures mean 53.5 across 11 audits, a category the engines have already settled. Source: 51-qualification-recheck-2026-08-14.md.',
 'NB-BkKlOUwltq2ZJu04UMGaE', 86, 3, 'outbound', null),

('getglossa.com', 'Glossa Ltd', null, null, null, null, 3,
 'disqualified', 'No verifiable contact route: /contact and /contact-us both return 404, only modal demo forms offered, no blog found. Never audited (no prospect_audits row exists for this domain). Source: 51-qualification-recheck-2026-08-14.md.',
 null, null, null, 'outbound', null),

('jetpackworkflow.com', 'Jetpack Workflow Inc', null, null, null, 'workflow management software', 3,
 'disqualified', 'No verifiable contact route: /contact/ and /contact-us/ both return 404 (checked 2026-08-14). Category does measure 0, so worth a manual recheck if a working contact route is ever found. Source: 51-qualification-recheck-2026-08-14.md.',
 'kN13S2AWaGG1eRIo-WGs_7p2', 0, 4, 'outbound', null),

-- ── 10-prospects.csv candidates, never run through the 4-check bar. ────────
-- Company/contact from the CSV; segment/ai_score/competitor_count from a
-- fresh prospect_audits row where one exists. Contact route NOT verified.
('leanlaw.co', 'LeanLaw', 'Jonathon Fishman', 'Founder and CEO', null,
 'legal billing software', null, 'new', null, 'wjwl4PQg7NybiRX20NGQDfuD', 57, 0, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Risk noted in CSV: moderate substring false-positive risk on the "lean law" bigram.'),

('runsensible.com', 'RunSensible', 'Kaven', 'Founder (first name as published)', null,
 'legal practice management', null, 'new', null, 'YWBF-YuE6_4BTp76edTywNNy', 0, 3, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Full surname not published on their own site.'),

('caseeasy.ca', 'CaseEasy', 'Orane Cole', 'Founder and CEO', null,
 'case management software', null, 'new', null, '1TmsTw8mLXVHNUx1IypUNl8K', 68, 2, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Canada-market immigration niche.'),

('hoowla.com', 'Hoowla', 'Adam Curtis', 'Co-founder', null,
 'case management software', null, 'new', null, '21mUGmSu9brqhZ0CnsgGYXkN', 0, 3, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. UK conveyancing niche, four co-founders.'),

('quilia.com', 'Quilia', 'Kenny Eliason', 'CEO and Co-founder', null,
 'client portal software', null, 'new', null, '0FlRWS1JT5DSjTAEh0LyphBH', 33, 5, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. No public pricing found.'),

('visto.ai', 'Visto AI', 'Josh Schachnow', 'CEO and Founder', null,
 'immigration software', null, 'new', null, 'GqwTMVd7q9aWKyTwNifx4AwC', 36, 2, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Risk noted in CSV: brand name collides with vistolab.com, and "visto" is a common Romance word (false-positive risk).'),

('jovelegal.com', 'Jove', 'James S. Farrin', 'Founder', null,
 'legal services', null, 'new', null, 'mMM6SSanotakY14nuch6pgLm', 0, 3, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Risk noted in CSV: fresh rebrand from GrowPath, engines may know neither name; firm-affiliated ownership.'),

('amberlo.io', 'Amberlo', 'Dainius Urbanavicius', 'CEO', null,
 'law practice management software', null, 'new', null, 'Cl5nvcSrf16GqJr6ARDMg3Jx', 0, 3, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Owned by Septeo, a large French group, so budget authority at the brand level is uncertain.'),

('referent.law', 'Referent', 'George Zaletski', 'Founder and CEO', null,
 'legal practice management software', null, 'new', null, 'yoW_T_E9cItkidIknl-pePnj', 0, 3, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Private beta; "referent" is a common word (false-positive risk only).'),

('denovobi.com', 'Denovo', 'George Blair', 'Chairman and Founder', null,
 'business intelligence software', null, 'new', null, '8LTV6R-2Edp-qxUvPDfc3oMN', 0, 4, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. "De novo" is ubiquitous legal Latin (false-positive risk only); no published pricing found.'),

('casepacer.com', 'CasePacer', 'Jim Lenard', 'CEO', null,
 'legal case management software', null, 'new', null, 'S5LYzb0O9f1RQmauS8VwWHyF', 0, 3, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Validus Venture Group brand; approval authority may sit above the brand.'),

('outfindo.com', 'Outfindo', 'Jan Mateju', 'CEO and Founder', null,
 'product selection guides', null, 'new', null, '2d-jMhPajELL84Aa2HfhcLag', 0, 1, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Five-person team verified on their own site.'),

('aiden.cx', 'Aiden', 'Marja Silvertant', 'Co-founder and CEO', null,
 'AI product advice software', null, 'new', null, 'Ji-IWxuprLJZ_jRteSgeu9pH', 41, 2, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. No public pricing, so likely mid-market.'),

('getvero.com', 'Vero', 'Chris Hexton', 'Co-founder and CEO', null,
 'customer engagement platform', null, 'new', null, 'l68g71ecBhlTHar0HtKu6k5g', 0, 2, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar.'),

('sender.net', 'Sender', null, null, null,
 'email marketing platform', null, 'new', null, '6ZHoqBwJ_OHAAWi2aBqiIyZe', 78, 3, 'outbound',
 'From 10-prospects.csv. No founder published on own site. Contact route not independently verified; not run through the 4-check qualification bar. CSV flagged that the email marketing category averages 53.5, so a fresh audit might disqualify it; the fresh audit measured ai_score 78, which does fail D4 as an independent check.'),

('birdsview.com', 'BirdsView', 'Kubilay Ozan Brochwitz-Tuerker', 'Managing Director', null,
 'email marketing software', null, 'new', null, 'LpV1Cuu5QJ4mH5BBN3dzSOKP', 0, 3, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Product rebranded to Avys, so brand extraction may be unreliable; German-language site.'),

('trylantern.com', 'Lantern', 'Stefania', 'Co-founder (first name as published)', null,
 'Shopify app', null, 'new', null, 'jsKoaK7TiRzXtPPFvwP3Pp22', 65, 3, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. "Lantern" is a common word (false-positive risk only).'),

('personalizerai.com', 'PersonalizerAI', 'Nandini', 'Co-founder marketing (first name as published)', null,
 'AI product recommendations', null, 'new', null, 'khKxlHm1qWLSVWCxHhEZJc2U', 0, 3, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Very small team; Radar-tier budget likely.'),

('recommaquiz.com', 'Recomma', 'Liparit Avagyan', 'Founder and CEO', null,
 'product quiz app', null, 'new', null, 'QnjP5Ug1sTNj4Y8MW4X--zO2', 41, 2, 'outbound',
 'From 10-prospects.csv. Contact route not independently verified; not run through the 4-check qualification bar. Young product (2024); entity country unpublished.'),

('loremax.ai', 'LoreMax AI', null, null, null, 'AI solutions', null,
 'new', null, 'GVmLPWJSYqgX9a-FgvFeEOai', 0, 4, 'inbound',
 'Public/organic self-audit by an unknown visitor, 2026-08-08. 10-prospects.csv: verify what they sell before any send; possibly AI content tooling; never reference the visitor audit. Not run through the qualification bar. No person found; JS-only site.'),

('prejmer-raceway.com', 'Prejmer Raceway', null, null, null, 'karting raceway', null,
 'new', null, 'l7zBnb8a-kFtNJkOY0cTCXy9', 41, 4, 'inbound',
 'Public/organic self-audit by an unknown visitor, 2026-08-05. Romanian local business; 10-prospects.csv notes this is a done-for-you conversation, not self-serve, and to never reference the visitor audit. Not run through the qualification bar. No person sourced yet.'),

-- ── Also in 10-prospects.csv, disqualified on separate, well-evidenced ─────
-- grounds (see bg-backend report for the full reasoning per domain).
('gokickflip.com', 'Kickflip', 'Renaud Teasdale', 'blog byline (CEO per external sources)', null,
 'product configurator software', null, 'disqualified',
 'Disqualified by D4: fresh audit 2026-08-14 scored ai_score 86 (>= 50). 10-prospects.csv itself notes "measured 0 and 84 on different July framings; fresh audit governs."',
 '-T_5ULmMRy6mmTkAmO6rfUFz', 86, 0, 'outbound',
 'Also a 2026-07-16 test domain for the brand-name-alias extraction bug fix (CLAUDE.md, _prospect_prompts.js: "gokickflip.com -> Kickflip").'),

-- ── Large established platforms, disqualified on first-party evidence they ─
-- were audited as scoring/category benchmarks or bug-fix test cases, not
-- researched as sales prospects. Never referenced in any qualification doc.
('salesmessage.com', 'Salesmsg', null, null, null, 'business texting software', null,
 'disqualified', 'Test domain for the brand-name-alias extraction bug fix, 2026-07-16 (CLAUDE.md, _prospect_prompts.js: "salesmessage.com -> Salesmsg"). Not researched as a sales prospect.',
 '3FU0kimy9xB3SVMGqfiX_-eU', 86, 1, 'outbound', null),

('rebuyengine.com', 'Rebuy Engine', null, null, null, 'ecommerce personalization software', null,
 'disqualified', 'Test domain for the brand-name-alias extraction bug fix, 2026-07-16 (CLAUDE.md, _prospect_prompts.js: "rebuyengine.com -> Rebuy Engine"). Not researched as a sales prospect.',
 'NEoLM_vxvfyvF_wak4jRs45F', 41, 3, 'outbound', null),

('hubspot.com', 'HubSpot', null, null, null, 'marketing software', null,
 'disqualified', 'Large established platform, used as a scoring-investigation benchmark, not researched as a sales prospect (CLAUDE.md 2026-08-14 scoring investigation entry cites "HubSpot 61" by name).',
 '-jG0C5rmqXkSMNOGD1uWe_3c', 61, 1, 'outbound', null),

('mailchimp.com', 'Mailchimp', null, null, null, 'email marketing software', null,
 'disqualified', 'Large established platform, used as a scoring-investigation benchmark, not researched as a sales prospect (CLAUDE.md 2026-08-14 scoring investigation entry cites "Mailchimp 54" by name).',
 '0adLG4WmY_sq0YIHmhT2YsCN', 54, 2, 'outbound', null),

('getresponse.com', 'GetResponse', null, null, null, 'email marketing software', null,
 'disqualified', 'Large established platform, used as a scoring-investigation benchmark, not researched as a sales prospect (CLAUDE.md 2026-08-14 scoring investigation entry cites "GetResponse 33" by name).',
 'oWxUOKfI-zneTR6so8v4oU__', 33, 3, 'outbound', null),

-- ── Left NEW on purpose: audited 2026-07-16 in the same batch/timeframe as ─
-- the confirmed test/benchmark domains above, but never referenced in any
-- prospect qualification document. Not disqualified without stronger
-- evidence than "part of the same batch" -- flagged for review, not guessed.
('activecampaign.com', null, null, null, null, 'marketing automation software', null,
 'new', null, 'BHPEE6rJP0CpHCFBctGrm8CY', 83, 1, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('klaviyo.com', null, null, null, null, 'email marketing software', null,
 'new', null, 'XY2L_tQ6VUWUWBwbuAjcWN_T', 90, 0, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('aitrillion.com', null, null, null, null, 'eCommerce marketing platform', null,
 'new', null, 'c-s38G00PEAlJ71SO-GYScYl', 0, 7, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('antidote.legal', null, null, null, null, 'legal services', null,
 'new', null, 'kGZpVsADf6pj98VrHOLVeFMr', 0, 6, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains, and this row is itself flagged low_confidence in prospect_audits. Never referenced in any prospect qualification document. Needs review.'),

('brevo.com', null, null, null, null, 'email marketing software', null,
 'new', null, 'iGSb8xE34v42YgUbObJI5KE5', 79, 1, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains, and this row is itself flagged low_confidence in prospect_audits. Never referenced in any prospect qualification document. Needs review.'),

('customer.io', null, null, null, null, 'customer engagement platform', null,
 'new', null, 'cfIPUmoIEpZtKlTd9OQHUhMK', 77, 0, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('drip.com', null, null, null, null, 'ecommerce email marketing', null,
 'new', null, 'uXVQ_UvmL0bsQW2LMeLZ_PWa', 45, 5, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('financial-cents.com', null, null, null, null, 'accounting practice management', null,
 'new', null, 'KzrFoNzJSnaTwkpxUSw1VMVY', 76, 2, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('layla.ai', null, null, null, null, 'AI travel planning', null,
 'new', null, 'GAYlx78kCENuCKnhfCwJLxIN', 66, 1, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('maestra.io', null, null, null, null, 'personalization platform', null,
 'new', null, 't908uIAWhpbdX3wYsy3tZ8WU', 76, 4, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('mailerlite.com', null, null, null, null, 'email marketing software', null,
 'new', null, 'At8jFJHE3Ptk6GtNR8kaRW-H', 82, 3, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('maropost.com', null, null, null, null, 'unified commerce platform', null,
 'new', null, '0pPH6JCXgMZsCJgClPIw3J8v', 0, 7, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('omnisend.com', null, null, null, null, 'email marketing software', null,
 'new', null, 'fcNRS2TgFsXn7qH2_OdfNkNA', 61, 3, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('postscript.io', null, null, null, null, 'SMS marketing software', null,
 'new', null, '9dzdWeKVC5lT6EmReCvAy6d9', 82, 2, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('privy.com', null, null, null, null, 'email marketing software', null,
 'new', null, 'd2ifcAjZpCVoTMGtc6e0lvdV', 0, 3, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('sendpulse.com', null, null, null, null, 'marketing automation platform', null,
 'new', null, 'uTqxmLMF1KCP9d05rGbNacPX', 41, 4, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('slicktext.com', null, null, null, null, 'SMS marketing software', null,
 'new', null, 'KHD4Om7SuBwhR_KvjQp2NxUX', 61, 2, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('txtcart.ai', null, null, null, null, 'SMS marketing software', null,
 'new', null, 'I5TdBg10_1LyXsCo77o_pxbp', 41, 4, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('viewlocked.com', null, null, null, null, 'AI travel platform', null,
 'new', null, 'JjiVrlX156Onw4XMKWFH9LfT', 0, 5, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. The domain name itself reads like a test artifact for the audit report unlock/lock gating feature. Never referenced in any prospect qualification document. Needs review.'),

('voyado.com', null, null, null, null, 'retail customer experience software', null,
 'new', null, 'bGpIX-LBp8CsMn9JQkZ-FznG', 0, 5, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('weroad.com', null, null, null, null, 'group travel services', null,
 'new', null, '6Bu_ItPxm6QbfJ65cQnVSmI9', 0, 5, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.'),

('wonderplan.ai', null, null, null, null, 'AI travel planning', null,
 'new', null, 'nBzsFYOtvS_D-42AGCnH5Q0a', 75, 5, 'outbound',
 'Audited 2026-07-16, same batch/timeframe as confirmed audit-engine calibration domains. Never referenced in any prospect qualification document. Possibly test/calibration data rather than a real prospect; not disqualified without stronger evidence. Needs review.')

on conflict (domain) do nothing;

-- ============================================================================
-- VERIFICATION (run after applying):
--   select stage, count(*) from public.prospects group by stage order by 1;
--   select count(*) from public.prospects;  -- expect 71
-- ============================================================================
