-- Access tokens can remain valid briefly after an account is removed. Every
-- role helper used by RLS and SECURITY DEFINER RPCs must require an active row.
-- Replace the stored role too: older RPCs and policies read role directly.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'admin', 'cashier', 'staff', 'operational_staff', 'removed'));

create or replace function public.revoke_removed_profile_role() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.removed_at is not null then new.role := 'removed'; end if;
  return new;
end;
$$;
drop trigger if exists zz_revoke_removed_profile_role on public.profiles;
create trigger zz_revoke_removed_profile_role
before insert or update on public.profiles
for each row execute function public.revoke_removed_profile_role();
update public.profiles set removed_at = removed_at where removed_at is not null;

create or replace function public.is_staff_profile() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and public.normalize_role(role) in ('admin', 'staff', 'operational_staff', 'cashier')
      and removed_at is null
  );
$$;

create or replace function public.is_customer_profile() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and public.normalize_role(role) = 'customer'
      and removed_at is null
  );
$$;

revoke all on function public.is_staff_profile() from public, anon;
revoke all on function public.is_customer_profile() from public, anon;
grant execute on function public.is_staff_profile() to authenticated;
grant execute on function public.is_customer_profile() to authenticated;

create or replace function public.is_admin_profile() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid()
      and public.normalize_role(role) = 'admin' and removed_at is null
  );
$$;
revoke all on function public.is_admin_profile() from public, anon;
grant execute on function public.is_admin_profile() to authenticated;

create or replace function public.assert_transaction_writer() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid()
      and public.normalize_role(role) in ('admin', 'staff', 'operational_staff')
      and removed_at is null
  ) then raise exception 'Transaction management access required'; end if;
end;
$$;

create or replace function public.assert_inventory_writer() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid()
      and public.normalize_role(role) in ('admin', 'staff', 'operational_staff')
      and removed_at is null
  ) then raise exception 'Inventory management access required'; end if;
end;
$$;

drop policy if exists "Customers read only their orders" on public.orders;
create policy "Customers read only their orders" on public.orders
for select to authenticated using (
  (customer_id = auth.uid() and public.is_customer_profile())
  or public.is_staff_profile()
);

drop policy if exists "Customers read only their order items" on public.order_items;
create policy "Customers read only their order items" on public.order_items
for select to authenticated using (
  public.is_staff_profile() or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid() and public.is_customer_profile()
  )
);

drop policy if exists "Customers read only their payments" on public.payments;
create policy "Customers read only their payments" on public.payments
for select to authenticated using (
  public.is_staff_profile() or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid() and public.is_customer_profile()
  )
);

drop policy if exists "Internal staff insert orders" on public.orders;
create policy "Internal staff insert orders" on public.orders
for insert to authenticated with check (public.is_staff_profile());
drop policy if exists "Internal staff insert order items" on public.order_items;
create policy "Internal staff insert order items" on public.order_items
for insert to authenticated with check (public.is_staff_profile());
drop policy if exists "Internal staff insert payments" on public.payments;
create policy "Internal staff insert payments" on public.payments
for insert to authenticated with check (public.is_staff_profile());

drop policy if exists "Customers read own profile" on public.profiles;
create policy "Customers read own profile" on public.profiles
for select to authenticated using (
  (id = auth.uid() and removed_at is null) or public.is_staff_profile()
);
drop policy if exists "Customers update own profile" on public.profiles;
create policy "Customers update own profile" on public.profiles
for update to authenticated using (id = auth.uid() and removed_at is null)
with check (id = auth.uid() and removed_at is null);

drop policy if exists "Staff can view customer messages" on public.customer_messages;
create policy "Staff can view customer messages" on public.customer_messages
for select to authenticated using (
  public.is_staff_profile() and exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and public.normalize_role(p.role) in ('admin', 'staff', 'operational_staff')
  )
);

-- A later storage repair removed the customer-role predicate. Restore it for
-- all three customer proof operations.
drop policy if exists "Customers upload their payment proofs" on storage.objects;
create policy "Customers upload their payment proofs" on storage.objects
for insert to authenticated with check (
  bucket_id = 'payment-proofs' and public.is_customer_profile()
  and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "Customers view their payment proofs" on storage.objects;
create policy "Customers view their payment proofs" on storage.objects
for select to authenticated using (
  bucket_id = 'payment-proofs' and public.is_customer_profile()
  and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "Customers delete unreferenced payment proofs" on storage.objects;
create policy "Customers delete unreferenced payment proofs" on storage.objects
for delete to authenticated using (
  bucket_id = 'payment-proofs' and public.is_customer_profile()
  and (storage.foldername(name))[1] = auth.uid()::text
  and not exists (
    select 1 from public.orders o where o.customer_id = auth.uid()
      and o.payment_proof_path = name
  )
);

notify pgrst, 'reload schema';
