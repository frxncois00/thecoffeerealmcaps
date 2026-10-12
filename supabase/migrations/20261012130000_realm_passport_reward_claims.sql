begin;

create table public.realm_passport_reward_claims (
  customer_id uuid not null references public.realm_passports(customer_id) on delete cascade,
  reward_number integer not null check (reward_number between 1 and 10),
  claimed_at timestamptz not null default now(),
  claimed_by uuid references public.profiles(id) on delete set null,
  primary key (customer_id, reward_number)
);
create index realm_passport_reward_claims_claimed_at_idx on public.realm_passport_reward_claims(claimed_at);
alter table public.realm_passport_reward_claims enable row level security;
revoke all on public.realm_passport_reward_claims from anon, authenticated;
grant select on public.realm_passport_reward_claims to authenticated;
create policy "Customers read own reward claims" on public.realm_passport_reward_claims
  for select to authenticated using (customer_id = auth.uid());

-- The cashier sees only the claim state for the exact Passport ID they checked.
create or replace function public.lookup_realm_passport(p_realm_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare member_id uuid; result jsonb; eligible_purchases integer;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'cashier')) then
    raise exception 'Cashier access required';
  end if;
  select customer_id into member_id from public.realm_passports where realm_id = upper(btrim(p_realm_id));
  if member_id is null then return null; end if;
  select count(*) into eligible_purchases from public.orders o
    where o.customer_id = member_id
      and lower(btrim(o.status)) in ('completed', 'received')
      and coalesce(nullif(lower(btrim(o.payment_status)), ''), 'paid') = 'paid'
      and lower(coalesce(o.refund_status, '')) not in ('refunded', 'partially_refunded', 'fully_refunded')
      and coalesce(o.is_voided, false) = false;
  select jsonb_build_object(
    'id', upper(btrim(p_realm_id)),
    'profile', jsonb_build_object('full_name', p.full_name, 'username', p.username,
      'birthdate', p.birthdate, 'favorite_drink', to_jsonb(p)->>'favorite_drink', 'favorite_food', to_jsonb(p)->>'favorite_food'),
    'benefit', (select jsonb_build_object('status', b.status, 'kind', b.kind, 'full_name', b.full_name, 'id_number', b.id_number)
      from public.benefit_applications b where b.customer_id = member_id and b.status = 'approved' limit 1),
    'orders', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'status', o.status, 'refund_status', o.refund_status,
      'payment_status', o.payment_status, 'is_voided', o.is_voided, 'created_at', o.created_at))
      from public.orders o where o.customer_id = member_id), '[]'::jsonb),
    'eligible_rewards', coalesce((select jsonb_agg(n.reward_number) from generate_series(1, least(10, eligible_purchases / 5)) as n(reward_number)), '[]'::jsonb),
    'claims', coalesce((select jsonb_agg(jsonb_build_object('reward_number', c.reward_number, 'claimed_at', c.claimed_at))
      from public.realm_passport_reward_claims c where c.customer_id = member_id), '[]'::jsonb)
  ) into result from public.profiles p where p.id = member_id and p.role = 'customer';
  return result;
end;
$$;
revoke all on function public.lookup_realm_passport(text) from public, anon;
grant execute on function public.lookup_realm_passport(text) to authenticated;

create or replace function public.claim_realm_passport_reward(p_realm_id text, p_reward_number integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare member_id uuid; eligible_purchases integer; claim_time timestamptz;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'cashier')) then
    raise exception 'Cashier access required';
  end if;
  if p_reward_number is null or p_reward_number not between 1 and 10 then
    raise exception 'Invalid reward';
  end if;
  select customer_id into member_id from public.realm_passports where realm_id = upper(btrim(p_realm_id)) for update;
  if member_id is null then raise exception 'Realm Passport not found'; end if;
  if exists (select 1 from public.realm_passport_reward_claims
      where customer_id = member_id and reward_number = p_reward_number) then
    raise exception 'This reward has already been claimed';
  end if;
  select count(*) into eligible_purchases from public.orders o
    where o.customer_id = member_id
      and lower(btrim(o.status)) in ('completed', 'received')
      and coalesce(nullif(lower(btrim(o.payment_status)), ''), 'paid') = 'paid'
      and lower(coalesce(o.refund_status, '')) not in ('refunded', 'partially_refunded', 'fully_refunded')
      and coalesce(o.is_voided, false) = false;
  if eligible_purchases < p_reward_number * 5 then
    raise exception 'This reward is not yet available';
  end if;
  insert into public.realm_passport_reward_claims(customer_id, reward_number, claimed_by)
    values(member_id, p_reward_number, auth.uid()) returning claimed_at into claim_time;
  return jsonb_build_object('reward_number', p_reward_number, 'claimed_at', claim_time);
end;
$$;
revoke all on function public.claim_realm_passport_reward(text, integer) from public, anon;
grant execute on function public.claim_realm_passport_reward(text, integer) to authenticated;

notify pgrst, 'reload schema';
commit;
