-- Affiliate module: a program rate for custom services (2026-10-22)
--
-- A one-time fee (work sold outside the plans: a setup, an audit, a content
-- project; a custom conversion with metadata.one_time) has so far earned the
-- program's sale rule, so a program that pays 10 percent on subscriptions paid
-- 10 percent on services too unless the admin typed another rate on each fee.
-- services_commission_bps is the program's own rate for those fees, in basis
-- points (500 = 5 percent), paid once when the fee is recorded. The same key is
-- accepted in affiliate_memberships.custom_rules and
-- affiliate_attributions.custom_rules (jsonb, no schema change needed there).
--
-- Order for a fee: a rate typed on that fee, else services_commission_bps from
-- the account, membership or program (last layer wins), else the sale rule.
-- A fee marked as plan time paid up front (metadata.fee_kind = 'plan') keeps
-- the sale rule.
--
-- Additive and nullable: null means "fees earn the sale rule", which is what
-- every program does today, so applying this changes no amount. Commissions
-- already written keep their amount and their rule_snapshot. The value for the
-- brandgeo program is set by the admin on the Programs tab, not here. RLS and
-- policies on affiliate_programs are unchanged. Safe to re-run.

alter table public.affiliate_programs
  add column if not exists services_commission_bps integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'affiliate_programs_services_bps_check') then
    alter table public.affiliate_programs
      add constraint affiliate_programs_services_bps_check
      check (services_commission_bps is null or services_commission_bps between 0 and 10000);
  end if;
end $$;

comment on column public.affiliate_programs.services_commission_bps is 'Commission on one-time fees for custom services, basis points, paid once. Null: fees earn the sale rule.';
