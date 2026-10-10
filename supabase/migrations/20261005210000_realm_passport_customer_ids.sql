-- Requires 20261005200000_realm_passport.sql. IDs are allocated only on the server.
begin;
revoke all on public.realm_passports from anon, authenticated;
grant select on public.realm_passports to authenticated;

create or replace function public.allocate_realm_passport(p_customer_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare result text; candidate text;
begin
  perform pg_advisory_xact_lock(729105);
  select realm_id into result from realm_passports where customer_id = p_customer_id;
  if result is not null then return result; end if;
  if not exists (select 1 from profiles where id = p_customer_id and role = 'customer') then
    raise exception 'Customer account required';
  end if;
  select 'TCR-' || lpad(n::text, 4, '0') into candidate
    from generate_series(0, 9999) n
    where not exists (select 1 from realm_passports where realm_id = 'TCR-' || lpad(n::text, 4, '0'))
    order by random() limit 1;
  if candidate is null then raise exception 'Realm ID capacity reached'; end if;
  insert into realm_passports(customer_id, realm_id) values (p_customer_id, candidate);
  return candidate;
end;
$$;
revoke all on function public.allocate_realm_passport(uuid) from public, anon, authenticated;

create or replace function public.ensure_realm_passport()
returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  return public.allocate_realm_passport(auth.uid());
end;
$$;
revoke all on function public.ensure_realm_passport() from public, anon;
grant execute on function public.ensure_realm_passport() to authenticated;

create or replace function public.provision_customer_realm_passport()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'customer' then perform public.allocate_realm_passport(new.id); end if;
  return new;
end;
$$;
revoke all on function public.provision_customer_realm_passport() from public, anon, authenticated;
create trigger provision_customer_realm_passport
after insert or update of role on public.profiles
for each row execute function public.provision_customer_realm_passport();

do $$
declare customer record;
begin
  for customer in select id from public.profiles where role = 'customer' order by id loop
    perform public.allocate_realm_passport(customer.id);
  end loop;
end;
$$;
notify pgrst, 'reload schema';
commit;
