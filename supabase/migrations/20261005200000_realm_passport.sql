create table if not exists public.realm_passports (
  customer_id uuid primary key references public.profiles(id) on delete cascade,
  realm_id text not null unique check (realm_id ~ '^TCR-[0-9]{4}$'),
  created_at timestamptz not null default now()
);
alter table public.realm_passports enable row level security;
create policy "Customers read own passport" on public.realm_passports
  for select to authenticated using (customer_id = auth.uid());

create or replace function public.ensure_realm_passport()
returns text language plpgsql security definer set search_path = public as $$
declare result text; candidate text;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'customer') then
    raise exception 'Customer account required';
  end if;
  perform pg_advisory_xact_lock(729105);
  select realm_id into result from realm_passports where customer_id = auth.uid();
  if result is not null then return result; end if;
  select 'TCR-' || lpad(n::text, 4, '0') into candidate
    from generate_series(0, 9999) n
    where not exists (select 1 from realm_passports where realm_id = 'TCR-' || lpad(n::text, 4, '0'))
    order by random() limit 1;
  if candidate is null then raise exception 'Realm ID capacity reached'; end if;
  insert into realm_passports(customer_id, realm_id) values (auth.uid(), candidate);
  return candidate;
end;
$$;
revoke all on function public.ensure_realm_passport() from public;
grant execute on function public.ensure_realm_passport() to authenticated;
