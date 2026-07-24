-- Signup redesign (2026-07-21): unified post-auth onboarding.
-- `onboarding_complete` gates the /welcome onboarding screen. A brand-new
-- self-serve signup (email OR social) lands with NO clients row; provision-account.js
-- creates it with onboarding_complete = true once the "company vs personal brand"
-- onboarding question is answered. Every pre-existing client is already set up, so
-- they are backfilled to true and never see onboarding.
alter table clients add column if not exists onboarding_complete boolean not null default false;
update clients set onboarding_complete = true where onboarding_complete = false;
