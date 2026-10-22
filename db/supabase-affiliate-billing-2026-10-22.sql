-- Affiliate module: the price an attached account really pays (2026-10-22)
--
-- The affiliate portal estimates what a referred account will still earn the
-- partner. Hand-sold accounts rarely pay the list price (a package paid once,
-- an annual invoice, a custom monthly fee, or nothing), so the admin sets the
-- real price on the attribution and the estimate uses it. These columns feed
-- the estimate only; commissions are still computed from the payments.
--
-- Additive and nullable: existing rows keep working, and a null interval
-- means "no price set". Attributions stay admin-only under the existing RLS
-- policies (no affiliate policy exists on this table), so billing_note is
-- never visible to a partner. Safe to re-run.

alter table public.affiliate_attributions
  add column if not exists billing_amount_cents integer,
  add column if not exists billing_interval text,
  add column if not exists billing_paid_until timestamptz,
  add column if not exists billing_note text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'affiliate_attributions_billing_interval_check') then
    alter table public.affiliate_attributions
      add constraint affiliate_attributions_billing_interval_check
      check (billing_interval is null or billing_interval in ('month', 'year', 'once', 'none'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'affiliate_attributions_billing_amount_check') then
    alter table public.affiliate_attributions
      add constraint affiliate_attributions_billing_amount_check
      check (billing_amount_cents is null or billing_amount_cents >= 0);
  end if;
end $$;

comment on column public.affiliate_attributions.billing_amount_cents is 'What the account pays per billing_interval, in the program currency, cents. Estimate only.';
comment on column public.affiliate_attributions.billing_interval is 'month | year | once (prepaid package, no renewal estimated) | none (complimentary). Null: no price set.';
comment on column public.affiliate_attributions.billing_paid_until is 'For once: the date the prepaid period runs to.';
comment on column public.affiliate_attributions.billing_note is 'Admin-only note on the price.';
