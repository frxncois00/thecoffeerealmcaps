-- Run after both 20261012 Passport migrations in a seeded test database.
begin;
do $$
declare cashier uuid; customer uuid; passport text; result jsonb;
begin
  select id into cashier from public.profiles where role in ('admin', 'cashier') limit 1;
  select customer_id, realm_id into customer, passport from public.realm_passports limit 1;
  if cashier is null or customer is null then raise exception 'Seed a cashier and a customer before running this test'; end if;
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.lookup_realm_passport(passport);
    raise exception 'Customer lookup unexpectedly allowed';
  exception when raise_exception then
    if sqlerrm <> 'Cashier access required' then raise; end if;
  end;
  perform set_config('request.jwt.claim.sub', cashier::text, true);
  result := public.lookup_realm_passport(' ' || lower(passport) || ' ');
  assert result->>'id' = passport, 'Exact ID lookup should normalize case and spaces';
  assert not (result->'profile' ? 'email'), 'Lookup must not expose email';
  assert not (result->'profile' ? 'phone'), 'Lookup must not expose phone';
  assert not (result->'benefit' ? 'document_path'), 'Lookup must not expose verification documents';
  assert public.lookup_realm_passport('INVALID') is null, 'Unknown IDs must return no match';
  assert not has_function_privilege('anon', 'public.lookup_realm_passport(text)', 'execute'), 'Anonymous lookup must be denied';
  assert not has_function_privilege('anon', 'public.create_cashier_order_with_passport(jsonb,text)', 'execute'), 'Anonymous checkout must be denied';
  assert not exists (
    select 1 from public.orders o join public.realm_passports rp on rp.customer_id = o.customer_id
    where o.realm_passport_id is distinct from rp.realm_id
  ), 'Existing customer receipt IDs should be backfilled';
end;
$$;
rollback;
