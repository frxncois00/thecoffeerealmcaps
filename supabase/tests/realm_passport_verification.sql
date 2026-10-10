-- Read-only verification of the deployed passport feature.
select count(*) as passport_count, count(distinct realm_id) as unique_ids,
  count(*) filter (where realm_id !~ '^TCR-[0-9]{4}$') as invalid_ids,
  (select count(*) from public.profiles where role = 'customer') as customer_count
from public.realm_passports;
select p.proname, p.prosecdef, p.proconfig,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as customer_can_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anonymous_can_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('ensure_realm_passport', 'allocate_realm_passport', 'provision_customer_realm_passport');
select tgname, tgenabled from pg_trigger
where tgrelid = 'public.profiles'::regclass and tgname = 'provision_customer_realm_passport';
select relrowsecurity, has_table_privilege('authenticated','public.realm_passports','INSERT') as customer_can_insert,
  has_table_privilege('authenticated','public.realm_passports','UPDATE') as customer_can_update
from pg_class where oid = 'public.realm_passports'::regclass;
select policyname, cmd, qual from pg_policies where tablename = 'realm_passports' and schemaname = 'public';

begin;
-- Exercise the public endpoint as an authenticated customer without exposing identifiers.
select set_config('request.jwt.claim.sub', (select id::text from public.profiles where role = 'customer' order by id limit 1), true) is not null as test_customer_selected;
set local role authenticated;
select public.ensure_realm_passport() = public.ensure_realm_passport() as stable_id,
  public.ensure_realm_passport() ~ '^TCR-[0-9]{4}$' as valid_id,
  (select count(*) from public.realm_passports) = 1 as only_own_passport_visible;
rollback;
