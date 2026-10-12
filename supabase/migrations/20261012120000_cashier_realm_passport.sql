begin;

alter table public.orders add column if not exists realm_passport_id text;

-- Snapshot the ID on orders, including online customer orders.
create or replace function public.snapshot_order_realm_passport()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.customer_id is not null then
    select realm_id into new.realm_passport_id from public.realm_passports where customer_id = new.customer_id;
  else
    new.realm_passport_id := null;
  end if;
  return new;
end;
$$;
revoke all on function public.snapshot_order_realm_passport() from public, anon, authenticated;
drop trigger if exists snapshot_order_realm_passport on public.orders;
create trigger snapshot_order_realm_passport before insert or update of customer_id, realm_passport_id on public.orders
for each row execute function public.snapshot_order_realm_passport();

update public.orders o set realm_passport_id = rp.realm_id
from public.realm_passports rp where rp.customer_id = o.customer_id;

-- The later reward-claims migration owns lookup_realm_passport. Keeping it
-- out of this file lets this migration be rerun without replacing the newer
-- response (eligible rewards and claims).

-- Keep pricing, payment checks and inventory deduction in the existing atomic checkout.
create or replace function public.create_cashier_order_with_passport(request_payload jsonb, p_realm_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb; member_id uuid; member_name text; realm_id_value text := nullif(upper(btrim(p_realm_id)), '');
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'cashier')) then
    raise exception 'Cashier access required';
  end if;
  if realm_id_value is not null then
    select rp.customer_id, p.full_name into member_id, member_name
      from public.realm_passports rp join public.profiles p on p.id = rp.customer_id
      where rp.realm_id = realm_id_value and p.role = 'customer';
    if member_id is null then raise exception 'Realm Passport owner no longer available. Check the ID again.'; end if;
  end if;
  result := public.create_cashier_order(request_payload);
  if member_id is not null then
    update public.orders set customer_id = member_id, customer_name = coalesce(nullif(member_name, ''), customer_name)
      where id = (result->>'id')::uuid;
  end if;
  return result || jsonb_build_object('realm_passport_id', realm_id_value);
end;
$$;
revoke all on function public.create_cashier_order_with_passport(jsonb, text) from public, anon;
grant execute on function public.create_cashier_order_with_passport(jsonb, text) to authenticated;
notify pgrst, 'reload schema';
commit;
