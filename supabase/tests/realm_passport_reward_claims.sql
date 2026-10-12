-- Run after both 20261012 Passport migrations in a seeded test database.
begin;
do $$
declare cashier uuid; customer uuid; passport text; first_claim jsonb; duplicate_rejected boolean := false;
begin
  select id into cashier from public.profiles where role in ('admin', 'cashier') limit 1;
  select customer_id, realm_id into customer, passport from public.realm_passports limit 1;
  if cashier is null or customer is null then raise exception 'Seed a cashier and customer first'; end if;
  perform set_config('request.jwt.claim.sub', customer::text, true);
  begin
    perform public.claim_realm_passport_reward(passport, 1);
    raise exception 'Customer redemption unexpectedly allowed';
  exception when raise_exception then
    assert sqlerrm = 'Cashier access required', 'Customers must not redeem their own reward';
  end;
  perform set_config('request.jwt.claim.sub', cashier::text, true);
  assert public.lookup_realm_passport(passport) ? 'claims', 'Cashier lookup must include claim history';
  assert public.lookup_realm_passport(passport) ? 'eligible_rewards', 'Cashier lookup must include server eligibility';
  assert not has_function_privilege('anon', 'public.claim_realm_passport_reward(text,integer)', 'execute'), 'Anonymous redemption must be denied';
  begin
    perform public.claim_realm_passport_reward(passport, 11);
  exception when raise_exception then
    assert sqlerrm = 'Invalid reward', 'Out-of-range reward must be rejected';
  end;
  -- Exercise one real eligible reward, if the seed contains one. Rollback below keeps the seed unchanged.
  select rp.customer_id, rp.realm_id into customer, passport
    from public.realm_passports rp
    where (select count(*) from public.orders o where o.customer_id = rp.customer_id
      and lower(btrim(o.status)) in ('completed', 'received')
      and lower(coalesce(o.payment_status, '')) = 'paid'
      and lower(coalesce(o.refund_status, '')) not in ('refunded', 'partially_refunded', 'fully_refunded')
      and coalesce(o.is_voided, false) = false) >= 5
      and not exists (select 1 from public.realm_passport_reward_claims c where c.customer_id = rp.customer_id and c.reward_number = 1)
    limit 1;
  if customer is not null then
    first_claim := public.claim_realm_passport_reward(passport, 1);
    assert first_claim->>'reward_number' = '1', 'Eligible reward should be recorded';
    begin
      perform public.claim_realm_passport_reward(passport, 1);
    exception when raise_exception then
      duplicate_rejected := sqlerrm = 'This reward has already been claimed';
    end;
    assert duplicate_rejected, 'A second claim must be rejected';
  end if;
end;
$$;
rollback;
