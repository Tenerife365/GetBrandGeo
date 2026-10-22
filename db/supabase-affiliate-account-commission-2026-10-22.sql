-- Affiliate module: a commission rate per attached account (2026-10-22)
--
-- A partner earns the program's rate, or the custom rate on their membership.
-- Some hand-sold accounts are agreed at a different rate for that one account
-- (an account commissioned at 5 percent while the partner's other accounts earn
-- 10). custom_rules on the attribution is a partial object with the same keys
-- as affiliate_memberships.custom_rules (sale_commission_type,
-- sale_commission_bps, sale_commission_cents, recurring_commission_bps,
-- recurring_months, lead_commission_cents); any key present overrides the
-- membership and the program for payments of that account only.
--
-- Additive and nullable: a null means "no account rate", so existing rows keep
-- the rate they have today. Commissions already written keep their amount and
-- their rule_snapshot; the account rate applies to payments recorded after it
-- is set. Attributions stay admin-only under the existing RLS policies (no
-- affiliate policy exists on this table). Safe to re-run.

alter table public.affiliate_attributions
  add column if not exists custom_rules jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'affiliate_attributions_custom_rules_check') then
    alter table public.affiliate_attributions
      add constraint affiliate_attributions_custom_rules_check
      check (custom_rules is null or jsonb_typeof(custom_rules) = 'object');
  end if;
end $$;

comment on column public.affiliate_attributions.custom_rules is 'Commission rate for this account only, partial, same keys as affiliate_memberships.custom_rules. Overrides membership and program. Null: none.';
