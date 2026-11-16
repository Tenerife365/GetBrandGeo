-- supabase-agency-readback-2026-11-16.sql
--
-- READ-BACK BLOCKS for release P1 of docs/arch/agency-multi-brand.md,
-- revision 4. Written 2026-11-16 by bg-backend (Opus). NOT a migration.
--
-- Where: Supabase dashboard, project duiyifepitvugyulobqm, SQL Editor
-- (https://supabase.com/dashboard/project/duiyifepitvugyulobqm/sql/new),
-- run as the editor's role (postgres). Paste ONE section at a time.
--
-- Every section writes scratch rows (clients, auth users, profiles,
-- memberships) and then ALWAYS ends in a deliberate error raised by
-- pg_temp.rb_finish(). The error is the result: its message reads
--   READBACK <section>: <n> pass, <n> fail. ...
-- followed by every line of the log. Because the section ends in an error,
-- PostgreSQL rolls back everything it wrote, even if the closing "rollback;"
-- were forgotten. A section that stops on an UNEXPECTED error instead (any
-- message not starting with READBACK) has also rolled back; the message names
-- what broke.
--
-- Scratch rows carry the names "Readback ..." and addresses at the reserved
-- domain example.invalid. No real client, person or address appears here.
--
--   Section  Run after                                   Covers
--   R2       db/supabase-agency-accounts-2026-11-16.sql  spec 13 step 1 and 2 read-back: 5.5, 4.4,
--                                                        the three 1.5 insert paths and their
--                                                        rollbacks (as service_role), the scratch
--                                                        auth user variants, 23514 on an agency
--                                                        home brand, account_id_on_insert, the
--                                                        re-home rule of cleanup_empty_account,
--                                                        privilege probes (V19)
--   R3       db/supabase-agency-rls-group-b-2026-11-16.sql  the 4.6 functions end to end (convert,
--                                                        attach and its Stripe refusal, staff,
--                                                        guest profile, remove_member,
--                                                        remove_guest, detach, revert, repoint
--                                                        refusal), the three 4.4 checks after
--                                                        each, guest RLS (V5), credentials (V14),
--                                                        roles (V22, V23). Needs 'account_change'
--                                                        and 'agency-admin', which step 3 adds.
--   R4       db/supabase-agency-watchdog-2026-11-16.sql  V11: each of the four new watchdog
--                                                        findings fires on a violating row
--
-- Expected answer of each section: "READBACK R<n>: <N> pass, 0 fail."

-- ============================================================================
-- SECTION R2. After the step 1+2 file. Paste from here to the end of R2.
-- ============================================================================
begin;

create or replace function pg_temp.rb(p_name text, p_ok boolean, p_got text)
returns void language plpgsql as $f$
begin
  perform set_config('rb.log', coalesce(current_setting('rb.log', true), '') || chr(10)
                     || case when coalesce(p_ok, false) then 'PASS ' else 'FAIL ' end
                     || p_name || ' [got ' || coalesce(p_got, 'null') || ']', true);
end $f$;

create or replace function pg_temp.rb_finish(p_section text)
returns void language plpgsql as $f$
declare
  v      text := coalesce(current_setting('rb.log', true), '');
  n_pass integer;
  n_fail integer;
  fails  text;
begin
  select count(*) filter (where l like 'PASS %'),
         count(*) filter (where l like 'FAIL %'),
         string_agg(l, ' | ') filter (where l like 'FAIL %')
    into n_pass, n_fail, fails
    from regexp_split_to_table(v, chr(10)) as l;
  raise exception using errcode = 'P0001',
    message = format('READBACK %s: %s pass, %s fail. %s Deliberate error: every scratch row is rolled back. LOG:%s',
                     p_section, n_pass, n_fail,
                     coalesce('FAILURES: ' || fails || '.', 'No failure.'), v);
end $f$;

create or replace function pg_temp.fanout()
returns text language sql as $f$
  select format('missing=%s stale=%s stray=%s',
    (select count(*) from public.account_members am
       join public.clients c on c.account_id = am.account_id
       left join public.user_clients uc on uc.user_id = am.user_id and uc.client_id = c.id
      where uc.user_id is null),
    (select count(*) from public.user_clients uc
       join public.clients c on c.id = uc.client_id
      where uc.grant_source = 'account'
        and not exists (select 1 from public.account_members am
                         where am.user_id = uc.user_id and am.account_id = c.account_id)),
    (select count(*) from public.user_clients uc
       join public.clients c on c.id = uc.client_id
       join public.accounts a on a.id = c.account_id and a.kind = 'agency'
      where not exists (select 1 from public.account_members am
                         where am.user_id = uc.user_id and am.account_id = a.id)
        and not exists (select 1 from public.user_profiles p
                         where p.id = uc.user_id and p.client_id = uc.client_id)
        and uc.grant_source <> 'direct'));
$f$;

do $$ begin perform set_config('rb.log', '', true); end $$;

-- R2.0 snapshot (spec 5.5 and 4.4, the same queries as R1 of the migration header)
do $$
declare v_n bigint; v_m bigint; v_txt text;
begin
  select count(*) into v_n from public.clients where account_id is null;
  perform pg_temp.rb('R2.0 5.5 #3 no client without an account', v_n = 0, v_n::text);

  select count(*) into v_n from public.user_clients uc join public.user_profiles p on p.id = uc.user_id
   where uc.client_id <> p.client_id;
  perform pg_temp.rb('R2.0 5.5 #1 no row outside the default brand', v_n = 0, v_n::text);

  select count(*) into v_n from public.user_profiles p
    left join public.user_clients uc on uc.user_id = p.id and uc.client_id = p.client_id
   where p.client_id is not null and uc.user_id is null;
  perform pg_temp.rb('R2.0 5.5 #2 every profile holds its default-brand row', v_n = 0, v_n::text);

  select count(*) into v_n from public.user_clients where grant_source in ('account', 'direct');
  perform pg_temp.rb('R2.0 5.5 #4 no account or direct row', v_n = 0, v_n::text);

  perform pg_temp.rb('R2.0 the three 4.4 checks', pg_temp.fanout() = 'missing=0 stale=0 stray=0', pg_temp.fanout());

  select count(*) into v_n from public.accounts;
  select count(*) into v_m from public.clients;
  perform pg_temp.rb('R2.0 one account per client', v_n = v_m, format('accounts %s clients %s', v_n, v_m));

  select count(*) into v_n from public.accounts a
   where a.kind <> 'direct' or a.home_client_id is null
      or not exists (select 1 from public.clients c where c.id = a.home_client_id and c.account_id = a.id);
  perform pg_temp.rb('R2.0 every account is direct with a home inside it', v_n = 0, v_n::text);

  select count(*) into v_n from public.account_members;
  select count(*) into v_m from public.user_profiles where client_id is not null;
  perform pg_temp.rb('R2.0 one owner member row per profile', v_n = v_m
    and not exists (select 1 from public.account_members where role <> 'owner'),
    format('members %s profiles %s', v_n, v_m));

  select string_agg(relname || '=' || relrowsecurity::text, ',' order by relname) into v_txt
    from pg_class
   where oid in ('public.accounts'::regclass, 'public.account_members'::regclass, 'public.user_clients'::regclass);
  perform pg_temp.rb('R2.0 relrowsecurity', v_txt = 'account_members=true,accounts=true,user_clients=true', v_txt);
end $$;

-- R2.1 to R2.3: the three insert paths of spec 1.5, each with its exact
-- column list, as service_role, then the path's own rollback (delete).
do $$
declare
  v_cid integer; v_acc integer; v_home integer; v_lc bigint; v_la bigint;
  sfx text := substr(md5(random()::text), 1, 8);
begin
  -- provision-account.js:180-182
  set local role service_role;
  insert into public.clients (name, slug, brand_website, brand_aliases, plan, refresh_cadence,
                              last_refresh_at, default_market_id, onboarding_complete)
  values ('Readback scratch signup', 'readback-p1-' || sfx, 'readback-scratch.invalid',
          array['Readback scratch signup'], 'free', 'manual', now(), 'WW', true)
  returning id, account_id into v_cid, v_acc;
  select a.home_client_id into v_home from public.accounts a where a.id = v_acc;
  delete from public.clients where id = v_cid;
  select count(*) into v_lc from public.clients where id = v_cid;
  select count(*) into v_la from public.accounts where id = v_acc;
  reset role;
  perform pg_temp.rb('R2.1 provision-account.js insert gets a direct account, home = itself',
    v_acc is not null and v_home = v_cid, format('account %s home %s', v_acc, v_home));
  perform pg_temp.rb('R2.1 provision-account.js rollback leaves no clients and no accounts row',
    v_lc = 0 and v_la = 0, format('clients %s accounts %s', v_lc, v_la));

  -- _provision_client.js:331 (the row object built just above that line)
  set local role service_role;
  insert into public.clients (name, slug, brand_website, brand_aliases, known_competitors, plan,
                              refresh_cadence, last_refresh_at, default_market_id, default_region_id,
                              onboarding_complete)
  values ('Readback scratch onboard', 'readback-p2-' || sfx, 'readback-scratch.invalid',
          array['Readback scratch onboard'], array['Readback competitor'], 'essentials',
          'weekly', now(), 'GB', 'ALL', false)
  returning id, account_id into v_cid, v_acc;
  select a.home_client_id into v_home from public.accounts a where a.id = v_acc;
  delete from public.clients where id = v_cid;
  select count(*) into v_lc from public.clients where id = v_cid;
  select count(*) into v_la from public.accounts where id = v_acc;
  reset role;
  perform pg_temp.rb('R2.2 _provision_client.js insert gets a direct account, home = itself',
    v_acc is not null and v_home = v_cid, format('account %s home %s', v_acc, v_home));
  perform pg_temp.rb('R2.2 _provision_client.js rollback leaves no clients and no accounts row',
    v_lc = 0 and v_la = 0, format('clients %s accounts %s', v_lc, v_la));

  -- stripe-webhook.js:1085-1088 (createClientRow)
  set local role service_role;
  insert into public.clients (name, slug, plan, stripe_customer_id, stripe_subscription_id,
                              plan_source, plan_grant_until, refresh_cadence, last_refresh_at,
                              default_market_id)
  values ('readback-scratch.invalid', 'readback-p3-' || sfx, 'growth', 'cus_readbackscratch',
          'sub_readbackscratch', 'stripe', null, 'weekly', now(), 'WW')
  returning id, account_id into v_cid, v_acc;
  select a.home_client_id into v_home from public.accounts a where a.id = v_acc;
  delete from public.clients where id = v_cid;
  select count(*) into v_lc from public.clients where id = v_cid;
  select count(*) into v_la from public.accounts where id = v_acc;
  reset role;
  perform pg_temp.rb('R2.3 stripe-webhook.js insert gets a direct account, home = itself',
    v_acc is not null and v_home = v_cid, format('account %s home %s', v_acc, v_home));
  perform pg_temp.rb('R2.3 stripe-webhook.js rollback leaves no clients and no accounts row',
    v_lc = 0 and v_la = 0, format('clients %s accounts %s', v_lc, v_la));
end $$;

-- R2.4: client, scratch auth user and its profile, deleted in the code's own
-- rollback orders. (a) _provision_client.js:426-429: profile, auth user,
-- client. (b) stripe-webhook.js:690-692: auth user (its profile cascades),
-- client. The auth.users statements run as postgres: service_role has no
-- grant on auth.users; the code reaches it through the Auth admin API.
do $$
declare
  v_cid integer; v_acc integer; v_u uuid; v_left text; v_trig boolean;
  sfx text := substr(md5(random()::text), 1, 8);
  v_variant text;
begin
  foreach v_variant in array array['a', 'b'] loop
    v_u := gen_random_uuid();
    set local role service_role;
    insert into public.clients (name, slug, plan)
    values ('Readback scratch login ' || v_variant, 'readback-u' || v_variant || '-' || sfx, 'free')
    returning id, account_id into v_cid, v_acc;
    reset role;
    insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
    values (v_u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'readback-' || sfx || '-' || v_variant || '@example.invalid', now(), now());
    set local role service_role;
    insert into public.user_profiles (id, client_id, role) values (v_u, v_cid, 'viewer');
    reset role;

    v_trig := exists (select 1 from public.user_clients
                       where user_id = v_u and client_id = v_cid and grant_source = 'primary' and role = 'owner')
          and exists (select 1 from public.account_members
                       where account_id = v_acc and user_id = v_u and role = 'owner');
    perform pg_temp.rb('R2.4' || v_variant || ' profile trigger writes a primary owner row and an owner member row',
      v_trig, null);

    if v_variant = 'a' then
      set local role service_role;
      delete from public.user_profiles where id = v_u;
      reset role;
      delete from auth.users where id = v_u;
      set local role service_role;
      delete from public.clients where id = v_cid;
      reset role;
    else
      delete from auth.users where id = v_u;
      set local role service_role;
      delete from public.clients where id = v_cid;
      reset role;
    end if;

    select format('clients=%s accounts=%s members=%s user_clients=%s profiles=%s',
             (select count(*) from public.clients where id = v_cid),
             (select count(*) from public.accounts where id = v_acc),
             (select count(*) from public.account_members where account_id = v_acc or user_id = v_u),
             (select count(*) from public.user_clients where client_id = v_cid or user_id = v_u),
             (select count(*) from public.user_profiles where id = v_u))
      into v_left;
    perform pg_temp.rb('R2.4' || v_variant || ' rollback order leaves nothing behind',
      v_left = 'clients=0 accounts=0 members=0 user_clients=0 profiles=0', v_left);
  end loop;
end $$;

-- R2.5: deleting an agency home brand raises check_violation (23514).
-- Uses a client this block inserts itself (no child rows).
do $$
declare
  v_cid integer; v_acc integer; v_state text := 'no error';
  sfx text := substr(md5(random()::text), 1, 8);
begin
  set local role service_role;
  insert into public.clients (name, slug, plan)
  values ('Readback scratch agency home', 'readback-ah-' || sfx, 'free')
  returning id, account_id into v_cid, v_acc;
  reset role;
  update public.accounts set kind = 'agency' where id = v_acc;
  begin
    set local role service_role;
    delete from public.clients where id = v_cid;
    v_state := 'deleted';
  exception when check_violation then
    v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.5 deleting an agency home brand raises 23514', v_state = '23514', v_state);
  perform pg_temp.rb('R2.5 the refused delete left the brand and its account in place',
    exists (select 1 from public.clients where id = v_cid)
    and exists (select 1 from public.accounts where id = v_acc and home_client_id = v_cid), null);
end $$;

-- R2.6: an insert naming account_id raises account_id_on_insert (P0001)
do $$
declare
  v_any integer; v_state text := 'no error';
  sfx text := substr(md5(random()::text), 1, 8);
begin
  select min(id) into v_any from public.accounts;
  begin
    set local role service_role;
    insert into public.clients (name, slug, plan, account_id)
    values ('Readback scratch named account', 'readback-na-' || sfx, 'free', v_any);
    v_state := 'inserted';
  exception when raise_exception then
    v_state := sqlstate || ' ' || sqlerrm;
  end;
  reset role;
  perform pg_temp.rb('R2.6 an insert naming account_id raises account_id_on_insert',
    v_state = 'P0001 account_id_on_insert', v_state);
end $$;

-- R2.7: cleanup_empty_account re-homes a direct account that still holds a
-- brand when its home brand is deleted (N3-I1). A two-brand direct account
-- does not exist in P1, so the block builds one by hand.
do $$
declare
  v_c1 integer; v_c2 integer; v_a1 integer; v_a2 integer; v_home integer; v_alive boolean;
  sfx text := substr(md5(random()::text), 1, 8);
begin
  insert into public.clients (name, slug, plan) values ('Readback scratch rehome one', 'readback-r1-' || sfx, 'free')
  returning id, account_id into v_c1, v_a1;
  insert into public.clients (name, slug, plan) values ('Readback scratch rehome two', 'readback-r2-' || sfx, 'free')
  returning id, account_id into v_c2, v_a2;
  update public.clients set account_id = v_a1 where id = v_c2;
  delete from public.accounts where id = v_a2;
  set local role service_role;
  delete from public.clients where id = v_c1;
  reset role;
  select home_client_id into v_home from public.accounts where id = v_a1;
  v_alive := exists (select 1 from public.accounts where id = v_a1);
  perform pg_temp.rb('R2.7 deleting a direct home brand re-homes the account to its remaining brand',
    v_alive and v_home = v_c2, format('alive %s home %s expected %s', v_alive, v_home, v_c2));
end $$;

-- R2.8: privileges (V19). Every call below must fail with 42501
-- (insufficient_privilege) except the ones marked allowed.
do $$
declare v_state text; v_res jsonb; v_bool boolean;
begin
  v_state := 'no error';
  begin
    set local role authenticated;
    perform public.convert_to_agency(-1, array[]::uuid[], null);
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 authenticated cannot execute convert_to_agency', v_state = '42501', v_state);

  v_state := 'no error';
  begin
    set local role authenticated;
    perform public.account_create_guest_profile(-1, gen_random_uuid(), null);
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 authenticated cannot execute account_create_guest_profile', v_state = '42501', v_state);

  v_state := 'no error';
  begin
    set local role anon;
    perform public.account_remove_member(-1, gen_random_uuid(), null);
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 anon cannot execute account_remove_member', v_state = '42501', v_state);

  v_state := 'no error';
  begin
    set local role service_role;
    perform public.account_lock_brand(-1);
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 service_role cannot execute the internal helper account_lock_brand', v_state = '42501', v_state);

  v_state := 'no error';
  begin
    set local role anon;
    perform public.is_account_member(-1);
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 anon cannot execute is_account_member', v_state = '42501', v_state);

  v_state := 'allowed';
  begin
    set local role authenticated;
    v_bool := public.is_account_member(-1);
    v_state := 'allowed ' || coalesce(v_bool::text, 'null') || ' ' || coalesce(public.brand_account_kind(-1), 'null');
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 authenticated may execute is_account_member and brand_account_kind',
    v_state = 'allowed false null', v_state);

  v_state := 'no error';
  begin
    set local role service_role;
    v_res := public.account_reconcile(-1);
    v_state := 'allowed ' || v_res::text;
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 service_role may execute account_reconcile',
    v_state like 'allowed %', v_state);

  v_state := 'no error';
  begin
    set local role authenticated;
    insert into public.user_clients (user_id, client_id) values (gen_random_uuid(), -1);
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 authenticated cannot insert into user_clients', v_state = '42501', v_state);

  v_state := 'no error';
  begin
    set local role authenticated;
    insert into public.accounts (name) values ('Readback scratch forbidden');
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 authenticated cannot insert into accounts', v_state = '42501', v_state);

  v_state := 'no error';
  begin
    set local role authenticated;
    update public.account_members set role = 'owner' where account_id = -1;
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 authenticated cannot update account_members', v_state = '42501', v_state);

  v_state := 'no error';
  begin
    set local role anon;
    perform 1 from public.accounts limit 1;
  exception when others then v_state := sqlstate;
  end;
  reset role;
  perform pg_temp.rb('R2.8 anon cannot read accounts', v_state = '42501', v_state);
end $$;

select pg_temp.rb_finish('R2');
rollback;
-- ============================================================================
-- END OF SECTION R2. Expected: "READBACK R2: 34 pass, 0 fail."
-- ============================================================================


-- ============================================================================
-- SECTION R3. After the step 3 file (it needs 'account_change' in
-- client_events_type_check and 'agency-admin' in
-- client_invite_links_source_check). Runs every 4.6 function end to end on
-- scratch rows and asserts the three 4.4 checks after each successful call.
-- Runs as postgres (the function owner); the grants are proven in R2.8.
-- Paste from here to the end of R3.
-- ============================================================================
begin;

create or replace function pg_temp.rb(p_name text, p_ok boolean, p_got text)
returns void language plpgsql as $f$
begin
  perform set_config('rb.log', coalesce(current_setting('rb.log', true), '') || chr(10)
                     || case when coalesce(p_ok, false) then 'PASS ' else 'FAIL ' end
                     || p_name || ' [got ' || coalesce(p_got, 'null') || ']', true);
end $f$;

create or replace function pg_temp.rb_finish(p_section text)
returns void language plpgsql as $f$
declare
  v      text := coalesce(current_setting('rb.log', true), '');
  n_pass integer;
  n_fail integer;
  fails  text;
begin
  select count(*) filter (where l like 'PASS %'),
         count(*) filter (where l like 'FAIL %'),
         string_agg(l, ' | ') filter (where l like 'FAIL %')
    into n_pass, n_fail, fails
    from regexp_split_to_table(v, chr(10)) as l;
  raise exception using errcode = 'P0001',
    message = format('READBACK %s: %s pass, %s fail. %s Deliberate error: every scratch row is rolled back. LOG:%s',
                     p_section, n_pass, n_fail,
                     coalesce('FAILURES: ' || fails || '.', 'No failure.'), v);
end $f$;

create or replace function pg_temp.fanout()
returns text language sql as $f$
  select format('missing=%s stale=%s stray=%s',
    (select count(*) from public.account_members am
       join public.clients c on c.account_id = am.account_id
       left join public.user_clients uc on uc.user_id = am.user_id and uc.client_id = c.id
      where uc.user_id is null),
    (select count(*) from public.user_clients uc
       join public.clients c on c.id = uc.client_id
      where uc.grant_source = 'account'
        and not exists (select 1 from public.account_members am
                         where am.user_id = uc.user_id and am.account_id = c.account_id)),
    (select count(*) from public.user_clients uc
       join public.clients c on c.id = uc.client_id
       join public.accounts a on a.id = c.account_id and a.kind = 'agency'
      where not exists (select 1 from public.account_members am
                         where am.user_id = uc.user_id and am.account_id = a.id)
        and not exists (select 1 from public.user_profiles p
                         where p.id = uc.user_id and p.client_id = uc.client_id)
        and uc.grant_source <> 'direct'));
$f$;

-- expected refusal: runs p_sql in a subtransaction, returns the refusal token
create or replace function pg_temp.refusal(p_sql text)
returns text language plpgsql as $f$
begin
  execute p_sql;
  return 'no error';
exception when others then
  return case when sqlstate = 'P0001' then sqlerrm else sqlstate || ' ' || sqlerrm end;
end $f$;

do $$ begin perform set_config('rb.log', '', true); end $$;

do $$
declare
  sfx   text := substr(md5(random()::text), 1, 8);
  v_l   uuid := gen_random_uuid();   -- agency lead, owner
  v_c   uuid := gen_random_uuid();   -- customer of the client brand, later a guest
  v_s   uuid := gen_random_uuid();   -- staff member created by account_create_staff_profile
  v_g   uuid := gen_random_uuid();   -- guest created by account_create_guest_profile
  v_h   integer; v_b integer; v_acc integer; v_bacc integer; v_new integer; v_research integer;
  v_st1 integer; v_st2 integer;      -- scratch brands carrying a Stripe customer, a Stripe subscription
  v_res jsonb; v_r text; v_n bigint; v_n2 bigint; v_n3 bigint; v_k1 text; v_k2 text;
  v_key uuid; v_grant uuid; v_oc text;
  v_ok  constant text := 'missing=0 stale=0 stray=0';
  v_step text := 'setup';
begin
  begin
    -- scratch logins (postgres: service_role has no grant on auth.users)
    insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
    select t.u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'readback-' || sfx || '-' || t.n || '@example.invalid', now(), now()
      from unnest(array[v_l, v_c, v_s, v_g]) with ordinality as t(u, n);

    insert into public.clients (name, slug, plan) values ('Readback agency home', 'readback-h-' || sfx, 'growth')
    returning id, account_id into v_h, v_acc;
    insert into public.clients (name, slug, plan) values ('Readback client brand', 'readback-b-' || sfx, 'essentials')
    returning id, account_id into v_b, v_bacc;
    insert into public.user_profiles (id, client_id, role) values (v_l, v_h, 'viewer'), (v_c, v_b, 'viewer');

    perform pg_temp.rb('E0 lead: primary owner row on its brand, owner of its direct account',
      exists (select 1 from public.user_clients where user_id = v_l and client_id = v_h
                 and grant_source = 'primary' and role = 'owner')
      and exists (select 1 from public.account_members where account_id = v_acc and user_id = v_l and role = 'owner'),
      null);
    perform pg_temp.rb('E0 4.4 checks', pg_temp.fanout() = v_ok, pg_temp.fanout());

    v_step := 'E1';
    v_r := pg_temp.refusal(format('select public.convert_to_agency(%s, array[]::uuid[], null)', v_acc));
    perform pg_temp.rb('E1 convert refuses while a login on the brand is unconfirmed (V23)', v_r = 'unconfirmed_users', v_r);

    v_step := 'E2';
    v_res := public.convert_to_agency(v_acc, array[v_l], null);
    perform pg_temp.rb('E2 convert returns {account_id, home_client_id}',
      v_res = jsonb_build_object('account_id', v_acc, 'home_client_id', v_h), v_res::text);
    perform pg_temp.rb('E2 account is agency, no backfill row on the home brand, lead row primary member (V23)',
      (select kind from public.accounts where id = v_acc) = 'agency'
      and not exists (select 1 from public.user_clients where client_id = v_h and grant_source = 'backfill')
      and exists (select 1 from public.user_clients where user_id = v_l and client_id = v_h
                     and grant_source = 'primary' and role = 'member'),
      null);
    perform pg_temp.rb('E2 4.4 checks', pg_temp.fanout() = v_ok, pg_temp.fanout());
    v_r := pg_temp.refusal(format('select public.convert_to_agency(%s, array[%L]::uuid[], null)', v_acc, v_l));
    perform pg_temp.rb('E2 a second convert refuses', v_r = 'account_already_agency', v_r);

    v_step := 'E3';
    select min(id) into v_research from public.clients where category = 'research';
    if v_research is null then
      perform pg_temp.rb('E3 attach refuses a research brand (V20): no research brand exists, skipped', true, 'skipped');
    else
      v_r := pg_temp.refusal(format('select public.account_attach_brand(%s, %s, array[]::uuid[], null)', v_acc, v_research));
      perform pg_temp.rb('E3 attach refuses a research brand (V20)', v_r = 'brand_not_attachable', v_r);
    end if;

    v_step := 'E4';
    v_r := pg_temp.refusal(format('select public.account_attach_brand(%s, %s, array[]::uuid[], null)', v_acc, v_b));
    perform pg_temp.rb('E4 attach refuses a brand with an unconfirmed login (V20)', v_r = 'unconfirmed_users', v_r);
    v_r := pg_temp.refusal(format('select public.account_attach_brand(%s, %s, array[]::uuid[], null)', v_bacc, v_b));
    perform pg_temp.rb('E4 attach refuses a direct target account', v_r = 'account_not_agency', v_r);
    -- review F1: a brand carrying a Stripe customer or subscription is never attached
    insert into public.clients (name, slug, plan, stripe_customer_id)
    values ('Readback stripe customer brand', 'readback-sc-' || sfx, 'growth', 'cus_readbackscratch')
    returning id into v_st1;
    insert into public.clients (name, slug, plan, stripe_subscription_id)
    values ('Readback stripe subscription brand', 'readback-ss-' || sfx, 'growth', 'sub_readbackscratch')
    returning id into v_st2;
    v_r := pg_temp.refusal(format('select public.account_attach_brand(%s, %s, array[]::uuid[], null)', v_acc, v_st1));
    perform pg_temp.rb('E4 attach refuses a brand with a Stripe customer id (F1)', v_r = 'brand_has_stripe', v_r);
    v_r := pg_temp.refusal(format('select public.account_attach_brand(%s, %s, array[]::uuid[], null)', v_acc, v_st2));
    perform pg_temp.rb('E4 attach refuses a brand with a Stripe subscription id (F1)', v_r = 'brand_has_stripe', v_r);

    v_step := 'E5';
    v_res := public.account_attach_brand(v_acc, v_b, array[v_c], null);
    perform pg_temp.rb('E5 attach returns {account_id, client_id, brand_name}',
      v_res = jsonb_build_object('account_id', v_acc, 'client_id', v_b, 'brand_name', 'Readback client brand'),
      v_res::text);
    perform pg_temp.rb('E5 brand moved into the agency, its empty direct account deleted',
      (select account_id from public.clients where id = v_b) = v_acc
      and not exists (select 1 from public.accounts where id = v_bacc), null);
    perform pg_temp.rb('E5 former customer: primary member on the brand, in no account (V22)',
      exists (select 1 from public.user_clients where user_id = v_c and client_id = v_b
                 and grant_source = 'primary' and role = 'member')
      and not exists (select 1 from public.account_members where user_id = v_c), null);
    perform pg_temp.rb('E5 lead reaches the brand through an account row, role owner',
      exists (select 1 from public.user_clients where user_id = v_l and client_id = v_b
                 and grant_source = 'account' and role = 'owner'), null);
    perform pg_temp.rb('E5 4.4 checks', pg_temp.fanout() = v_ok, pg_temp.fanout());

    v_step := 'E6';
    v_r := pg_temp.refusal(format('select public.account_attach_brand(%s, %s, array[%L]::uuid[], null)', v_acc, v_h, v_l));
    perform pg_temp.rb('E6 attach refuses the agency''s own home brand', v_r = 'brand_is_agency_home', v_r);

    v_step := 'E7';
    v_res := public.account_create_staff_profile(v_acc, v_s, 'manager', null);
    perform pg_temp.rb('E7 create_staff_profile returns {account_id, user_id, client_id}',
      v_res = jsonb_build_object('account_id', v_acc, 'user_id', v_s, 'client_id', v_h), v_res::text);
    perform pg_temp.rb('E7 staff: default = home, primary member on home, account member row on the client brand',
      (select client_id from public.user_profiles where id = v_s) = v_h
      and exists (select 1 from public.user_clients where user_id = v_s and client_id = v_h
                     and grant_source = 'primary' and role = 'member')
      and exists (select 1 from public.user_clients where user_id = v_s and client_id = v_b
                     and grant_source = 'account' and role = 'member')
      and exists (select 1 from public.account_members where account_id = v_acc and user_id = v_s and role = 'manager'),
      null);
    perform pg_temp.rb('E7 4.4 checks', pg_temp.fanout() = v_ok, pg_temp.fanout());

    v_step := 'E8';
    v_r := pg_temp.refusal(format('select public.account_create_staff_profile(%s, %L, ''manager'', null)', v_acc, v_s));
    perform pg_temp.rb('E8 create_staff_profile refuses a login that has a profile', v_r = 'profile_exists', v_r);
    v_r := pg_temp.refusal(format('select public.account_add_staff(%s, %L, ''manager'', null)', v_acc, v_c));
    perform pg_temp.rb('E8 add_staff refuses a login whose default is not the home brand', v_r = 'not_home_default', v_r);
    v_r := pg_temp.refusal(format('select public.account_add_staff(%s, %L, ''boss'', null)', v_acc, v_s));
    perform pg_temp.rb('E8 add_staff refuses an unknown role', v_r = 'invalid_role', v_r);
    v_r := pg_temp.refusal(format('select public.account_add_staff(%s, %L, ''manager'', null)', v_acc, v_s));
    perform pg_temp.rb('E8 add_staff refuses a login already in an account', v_r = 'user_in_account', v_r);

    v_step := 'E9';
    v_r := pg_temp.refusal(format('select public.account_create_guest_profile(%s, %L, null)', v_h, gen_random_uuid()));
    perform pg_temp.rb('E9 create_guest_profile refuses the agency home brand (F4)', v_r = 'brand_is_agency_home', v_r);
    v_r := pg_temp.refusal(format('select public.account_create_guest_profile(%s, %L, null)', v_st1, gen_random_uuid()));
    perform pg_temp.rb('E9 create_guest_profile refuses a brand of a direct account (F4)', v_r = 'brand_not_in_agency', v_r);
    v_res := public.account_create_guest_profile(v_b, v_g, null);
    perform pg_temp.rb('E9 create_guest_profile returns {account_id, user_id, client_id} (F4)',
      v_res = jsonb_build_object('account_id', v_acc, 'user_id', v_g, 'client_id', v_b), v_res::text);
    v_r := pg_temp.refusal(format('select public.account_create_guest_profile(%s, %L, null)', v_b, v_g));
    perform pg_temp.rb('E9 create_guest_profile refuses a login that has a profile (F4)', v_r = 'profile_exists', v_r);
    perform pg_temp.rb('E9 a login created on an agency brand is a primary member and in no account (4.5)',
      exists (select 1 from public.user_clients where user_id = v_g and client_id = v_b
                 and grant_source = 'primary' and role = 'member')
      and not exists (select 1 from public.account_members where user_id = v_g), null);
    perform pg_temp.rb('E9 4.4 checks', pg_temp.fanout() = v_ok, pg_temp.fanout());

    v_step := 'E10';
    -- guest RLS (V5), as the authenticated role with the guest's claims
    perform set_config('request.jwt.claims', json_build_object('sub', v_g, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_g::text, true);
    set local role authenticated;
    select count(*) into v_n  from public.accounts;
    select count(*) into v_n2 from public.account_members;
    select count(*) into v_n3 from public.clients where id in (v_h, v_b);
    v_k1 := public.brand_account_kind(v_b);
    v_k2 := public.brand_account_kind(v_h);
    reset role;
    perform pg_temp.rb('E10 guest reads 0 accounts and 0 account_members rows (V5)',
      v_n = 0 and v_n2 = 0, format('accounts %s members %s', v_n, v_n2));
    perform pg_temp.rb('E10 guest reads its own brand only',
      v_n3 = 1, v_n3::text);
    perform pg_temp.rb('E10 guest reads kind agency on its brand and nothing on the home brand',
      v_k1 = 'agency' and v_k2 is null, format('brand %s home %s', v_k1, v_k2));
    -- the lead, an account owner
    perform set_config('request.jwt.claims', json_build_object('sub', v_l, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_l::text, true);
    set local role authenticated;
    select count(*) into v_n  from public.accounts;
    select count(*) into v_n2 from public.account_members;
    select count(*) into v_n3 from public.clients where id in (v_h, v_b);
    reset role;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform pg_temp.rb('E10 lead reads its account, its 2 members and both brands',
      v_n = 1 and v_n2 = 2 and v_n3 = 2, format('accounts %s members %s brands %s', v_n, v_n2, v_n3));

    v_step := 'E11';
    -- credentials of the staff member on the client brand (V14)
    v_oc := 'https://readback.example.invalid/oauth-client/' || sfx;
    insert into public.client_api_keys (client_id, key_hash, key_prefix, created_by)
    values (v_b, md5('k1' || sfx) || md5('k2' || sfx), 'bgmcp_rb', v_s)
    returning id into v_key;
    insert into public.oauth_clients (id, kind, name) values (v_oc, 'cimd', 'Readback scratch');
    insert into public.oauth_grants (client_id, user_id, oauth_client_id, expires_at)
    values (v_b, v_s, v_oc, now() + interval '1 day')
    returning id into v_grant;
    insert into public.oauth_tokens (grant_id, kind, token_hash, scope, expires_at)
    values (v_grant, 'access', md5('t1' || sfx) || md5('t2' || sfx), 'mcp:read', now() + interval '1 hour');
    insert into public.oauth_codes (request_id_hash, oauth_client_id, user_id, client_id, redirect_uri,
                                    code_challenge, scope_requested, expires_at)
    values (md5('r1' || sfx) || md5('r2' || sfx), v_oc, v_s, v_h, 'https://readback.example.invalid/cb',
            md5('c1' || sfx) || md5('c2' || sfx), 'mcp:read', now() + interval '10 minutes');
    insert into public.client_invite_links (user_id, client_id, token_hash, source, expires_at)
    values (v_s, v_h, md5('i1' || sfx) || md5('i2' || sfx), 'agency-admin', now() + interval '7 days');
    perform pg_temp.rb('E11 step 3 accepts invite source agency-admin', true, null);

    v_step := 'E12';
    v_res := public.account_remove_member(v_acc, v_s, null);
    perform pg_temp.rb('E12 remove_member returns the contract shape and counts',
      v_res = jsonb_build_object('ban_login', true, 'account_id', v_acc, 'user_id', v_s, 'rows_deleted', 2,
                                 'keys_revoked', 1, 'grants_revoked', 1, 'codes_used', 1, 'invites_revoked', 1),
      v_res::text);
    perform pg_temp.rb('E12 removed staff holds no row on any brand of the account (V13)',
      not exists (select 1 from public.user_clients where user_id = v_s and client_id in (v_h, v_b)), null);
    perform pg_temp.rb('E12 key revoked, grant and its token revoked, code used, invite revoked (V14)',
      (select revoked_at is not null from public.client_api_keys where id = v_key)
      and (select revoked_at is not null from public.oauth_grants where id = v_grant)
      and not exists (select 1 from public.oauth_tokens where grant_id = v_grant and revoked_at is null)
      and not exists (select 1 from public.oauth_codes where user_id = v_s and used_at is null)
      and not exists (select 1 from public.client_invite_links where user_id = v_s and revoked_at is null),
      null);
    perform pg_temp.rb('E12 4.4 checks', pg_temp.fanout() = v_ok, pg_temp.fanout());

    v_step := 'E13';
    v_r := pg_temp.refusal(format('select public.account_remove_member(%s, %L, null)', v_acc, v_s));
    perform pg_temp.rb('E13 remove_member refuses a login that is no longer a member', v_r = 'user_not_member', v_r);
    v_r := pg_temp.refusal(format('select public.account_remove_member(%s, %L, null)', v_acc, v_l));
    perform pg_temp.rb('E13 remove_member refuses the last owner', v_r = 'last_owner', v_r);

    v_step := 'E14';
    v_res := public.account_remove_guest(v_b, v_g, null);
    perform pg_temp.rb('E14 remove_guest returns ban_login, the brand''s account and 1 row deleted',
      (v_res ->> 'ban_login')::boolean and (v_res ->> 'account_id')::integer = v_acc
      and (v_res ->> 'rows_deleted')::integer = 1 and (v_res ->> 'user_id')::uuid = v_g,
      v_res::text);
    perform pg_temp.rb('E14 guest holds no row on the brand',
      not exists (select 1 from public.user_clients where user_id = v_g and client_id = v_b), null);
    perform pg_temp.rb('E14 4.4 checks', pg_temp.fanout() = v_ok, pg_temp.fanout());
    v_r := pg_temp.refusal(format('select public.account_remove_guest(%s, %L, null)', v_h, v_l));
    perform pg_temp.rb('E14 remove_guest refuses an account member', v_r = 'user_is_account_member', v_r);

    v_step := 'E15';
    v_r := pg_temp.refusal(format('select public.revert_agency_to_direct(%s, null)', v_acc));
    perform pg_temp.rb('E15 revert refuses while a client brand is attached', v_r = 'account_has_client_brands', v_r);
    v_r := pg_temp.refusal(format('select public.account_detach_brand(%s, %s, null)', v_acc, v_h));
    perform pg_temp.rb('E15 detach refuses the home brand', v_r = 'brand_is_home', v_r);

    v_step := 'E16';
    v_res := public.account_detach_brand(v_acc, v_b, null);
    v_new := (v_res ->> 'account_id')::integer;
    perform pg_temp.rb('E16 detach returns {account_id (new direct), client_id}',
      v_res = jsonb_build_object('account_id', v_new, 'client_id', v_b) and v_new <> v_acc, v_res::text);
    perform pg_temp.rb('E16 brand is the home of a new direct account',
      (select account_id from public.clients where id = v_b) = v_new
      and exists (select 1 from public.accounts where id = v_new and kind = 'direct' and home_client_id = v_b), null);
    perform pg_temp.rb('E16 former customer owns the brand and the new account again (V22)',
      exists (select 1 from public.user_clients where user_id = v_c and client_id = v_b and role = 'owner')
      and exists (select 1 from public.account_members where account_id = v_new and user_id = v_c and role = 'owner'),
      null);
    perform pg_temp.rb('E16 lead lost its account row; the removed guest stays removed',
      not exists (select 1 from public.user_clients where user_id = v_l and client_id = v_b)
      and not exists (select 1 from public.user_clients where user_id = v_g and client_id = v_b)
      and not exists (select 1 from public.account_members where user_id = v_g), null);
    perform pg_temp.rb('E16 4.4 checks', pg_temp.fanout() = v_ok, pg_temp.fanout());

    v_step := 'E17';
    v_r := pg_temp.refusal(format('select public.repoint_default_brand(%L, %s, null)', v_l, v_b));
    perform pg_temp.rb('E17 repoint refuses a brand the login holds no row on', v_r = 'no_row_on_brand', v_r);

    v_step := 'E18';
    v_res := public.revert_agency_to_direct(v_acc, null);
    perform pg_temp.rb('E18 revert returns {account_id}', v_res = jsonb_build_object('account_id', v_acc), v_res::text);
    perform pg_temp.rb('E18 account direct again, the owner owns the home brand again',
      (select kind from public.accounts where id = v_acc) = 'direct'
      and exists (select 1 from public.user_clients where user_id = v_l and client_id = v_h
                     and grant_source = 'primary' and role = 'owner'), null);
    perform pg_temp.rb('E18 4.4 checks', pg_temp.fanout() = v_ok, pg_temp.fanout());

    v_step := 'E19';
    select count(*) into v_n from public.client_events where client_id = v_h and type = 'account_change';
    select count(*) into v_n2 from public.client_events
     where client_id in (v_h, v_b) and type = 'account_change' and meta::text like '%@%';
    perform pg_temp.rb('E19 one account_change row on the home brand per successful call (convert, attach, staff, guest, remove_member, remove_guest, detach, revert), no email',
      v_n = 8 and v_n2 = 0, format('rows %s with_at_sign %s', v_n, v_n2));
  exception when others then
    perform pg_temp.rb('R3 aborted at step ' || v_step, false, sqlstate || ' ' || sqlerrm);
  end;
end $$;

select pg_temp.rb_finish('R3');
rollback;
-- ============================================================================
-- END OF SECTION R3. Expected: "READBACK R3: 58 pass, 0 fail." (one line per
-- check; a run aborted mid-way shows a single FAIL naming the step).
-- ============================================================================


-- ============================================================================
-- SECTION R4. After db/supabase-agency-watchdog-2026-11-16.sql. V11: each of
-- the four new findings fires on a violating scratch row, built by hand
-- outside the 4.6 functions on purpose. Paste from here to the end of R4.
-- ============================================================================
begin;

create or replace function pg_temp.rb(p_name text, p_ok boolean, p_got text)
returns void language plpgsql as $f$
begin
  perform set_config('rb.log', coalesce(current_setting('rb.log', true), '') || chr(10)
                     || case when coalesce(p_ok, false) then 'PASS ' else 'FAIL ' end
                     || p_name || ' [got ' || coalesce(p_got, 'null') || ']', true);
end $f$;

create or replace function pg_temp.rb_finish(p_section text)
returns void language plpgsql as $f$
declare
  v      text := coalesce(current_setting('rb.log', true), '');
  n_pass integer;
  n_fail integer;
  fails  text;
begin
  select count(*) filter (where l like 'PASS %'),
         count(*) filter (where l like 'FAIL %'),
         string_agg(l, ' | ') filter (where l like 'FAIL %')
    into n_pass, n_fail, fails
    from regexp_split_to_table(v, chr(10)) as l;
  raise exception using errcode = 'P0001',
    message = format('READBACK %s: %s pass, %s fail. %s Deliberate error: every scratch row is rolled back. LOG:%s',
                     p_section, n_pass, n_fail,
                     coalesce('FAILURES: ' || fails || '.', 'No failure.'), v);
end $f$;

do $$ begin perform set_config('rb.log', '', true); end $$;

do $$
declare
  sfx  text := substr(md5(random()::text), 1, 8);
  v_u1 uuid := gen_random_uuid();
  v_u2 uuid := gen_random_uuid();
  v_ag integer; v_ag_acc integer; v_d integer; v_d_acc integer;
  v_kinds text;
begin
  select string_agg(kind, ',' order by kind) into v_kinds from ops.watchdog_findings()
   where kind in ('agency_stripe_id', 'account_fanout_missing', 'account_fanout_stale', 'account_fanout_stray');
  perform pg_temp.rb('R4.0 none of the four findings is open before the probe', v_kinds is null, v_kinds);

  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
  select t.u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'readback-' || sfx || '-w' || t.n || '@example.invalid', now(), now()
    from unnest(array[v_u1, v_u2]) with ordinality as t(u, n);

  insert into public.clients (name, slug, plan) values ('Readback watchdog agency', 'readback-wa-' || sfx, 'free')
  returning id, account_id into v_ag, v_ag_acc;
  insert into public.clients (name, slug, plan) values ('Readback watchdog direct', 'readback-wd-' || sfx, 'free')
  returning id, account_id into v_d, v_d_acc;
  update public.accounts set kind = 'agency' where id = v_ag_acc;

  -- guard 3: an agency brand with a Stripe id
  update public.clients set stripe_customer_id = 'cus_readbackscratch' where id = v_ag;
  -- check 1 (missing): a member with no row on a brand of the account
  insert into public.account_members (account_id, user_id, role) values (v_ag_acc, v_u1, 'manager');
  -- check 2 (stale): an 'account' row with no membership behind it
  insert into public.user_clients (user_id, client_id, role, grant_source) values (v_u1, v_d, 'member', 'account');
  -- check 3 (stray): a non-direct row on an agency brand, no membership, not the default brand
  insert into public.user_clients (user_id, client_id, role, grant_source) values (v_u2, v_ag, 'member', 'primary');

  select string_agg(kind, ',' order by kind) into v_kinds from ops.watchdog_findings()
   where kind in ('agency_stripe_id', 'account_fanout_missing', 'account_fanout_stale', 'account_fanout_stray');
  perform pg_temp.rb('R4.1 all four findings fire on violating rows (V11)',
    v_kinds = 'account_fanout_missing,account_fanout_stale,account_fanout_stray,agency_stripe_id', v_kinds);
  perform pg_temp.rb('R4.1 summaries carry no address',
    not exists (select 1 from ops.watchdog_findings()
                 where (kind like 'account_fanout%' or kind = 'agency_stripe_id')
                   and (summary like '%@%' or evidence::text like '%@%')), null);
end $$;

select pg_temp.rb_finish('R4');
rollback;
-- ============================================================================
-- END OF SECTION R4. Expected: "READBACK R4: 3 pass, 0 fail."
-- ============================================================================
