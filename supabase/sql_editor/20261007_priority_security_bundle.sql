-- Priority security migrations for the linked Supabase project's SQL Editor.
-- Run the separate read-only preflight first. Paste this entire file as one query.
-- One transaction means any SQL error rolls all four migrations back.
-- SQL Editor execution does not write Supabase migration history.

begin;

do $$
begin
  if current_setting('server_version_num')::integer < 160000 then
    raise exception 'PostgreSQL 16 or newer is required by this bundle';
  end if;
  if to_regclass('public.orders') is null
    or to_regclass('public.order_items') is null
    or to_regclass('public.order_feedback') is null
    or to_regclass('public.payments') is null
    or to_regclass('public.profiles') is null
    or to_regclass('public.customer_messages') is null
    or to_regclass('public.customer_email_otps') is null
    or to_regclass('storage.objects') is null
    or to_regprocedure('public.normalize_role(text)') is null
    or to_regprocedure('public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)') is null then
    raise exception 'One or more prerequisite tables or functions are missing';
  end if;
  if to_regprocedure('public.submit_customer_message_internal(text,text,text,text,text,text,text,text,date,text)') is not null then
    raise exception 'Contact-message wrapper appears already applied; inspect before rerunning';
  end if;
  if exists (
    select 1 from public.profiles
    where role is not null
      and role not in ('customer', 'admin', 'cashier', 'staff', 'operational_staff', 'removed')
  ) then
    raise exception 'Profiles contain role values outside the new constraint';
  end if;
end;
$$;

-- BEGIN 20261006100000_customer_text_limits.sql

-- Enforce customer input limits even when a caller bypasses the browser.
-- Customer RPCs pass values as typed parameters; no customer text is executed as SQL.

create or replace function public.validate_customer_order_text() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.order_source is distinct from 'customer_pos' then return new; end if;
  if tg_op = 'UPDATE' then
    if (new.customer_name, new.customer_email, new.customer_phone, new.delivery_address)
      is not distinct from
      (old.customer_name, old.customer_email, old.customer_phone, old.delivery_address) then
      return new;
    end if;
  end if;
  if btrim(coalesce(new.customer_name, '')) !~ '^[[:alpha:]][[:alpha:] .''-]{1,59}$' then
    raise exception 'Enter a valid customer name of 2 to 60 characters';
  end if;
  if length(coalesce(new.customer_email, '')) > 160 or
     coalesce(new.customer_email, '') !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid customer email address';
  end if;
  if coalesce(new.customer_phone, '') !~ '^09[0-9]{9}$' then
    raise exception 'Contact number must contain 11 digits and start with 09';
  end if;
  if length(coalesce(new.delivery_address, '')) > 400 then
    raise exception 'Delivery address is too long';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_customer_order_text_trigger on public.orders;
create trigger validate_customer_order_text_trigger
before insert or update on public.orders
for each row execute function public.validate_customer_order_text();

create or replace function public.validate_customer_order_item_text() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.customizations is not distinct from old.customizations then return new; end if;
  end if;
  if length(coalesce(new.customizations ->> 'special_instructions', '')) > 300 then
    raise exception 'Special instructions must be 300 characters or fewer';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_customer_order_item_text_trigger on public.order_items;
create trigger validate_customer_order_item_text_trigger
before insert or update on public.order_items
for each row execute function public.validate_customer_order_item_text();

create or replace function public.validate_customer_feedback_text() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.comment is not null and length(new.comment) > 500 then
    raise exception 'Feedback comment must be 500 characters or fewer';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_customer_feedback_text_trigger on public.order_feedback;
create trigger validate_customer_feedback_text_trigger
before insert or update on public.order_feedback
for each row execute function public.validate_customer_feedback_text();


-- END 20261006100000_customer_text_limits.sql


-- BEGIN 20261006110000_active_profile_security.sql

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


-- END 20261006110000_active_profile_security.sql


-- BEGIN 20261006111000_atomic_customer_otp_claim.sql

-- Serialize verification attempts so concurrent guesses share the same
-- five-attempt limit. Only the service role can call this function.
create or replace function public.claim_customer_registration_otp(
  p_email text,
  p_code_hash text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_otp public.customer_email_otps%rowtype;
  v_attempts integer;
begin
  select * into v_otp from public.customer_email_otps
  where email = lower(btrim(p_email)) and purpose = 'register' and used_at is null
  order by created_at desc limit 1 for update;

  if not found or v_otp.expires_at <= now() then
    return 'invalid';
  end if;
  if v_otp.blocked_until > now() or v_otp.attempt_count >= 5 then
    return 'blocked';
  end if;

  if v_otp.code_hash = p_code_hash then
    update public.customer_email_otps set used_at = now() where id = v_otp.id;
    return 'valid';
  end if;

  v_attempts := v_otp.attempt_count + 1;
  update public.customer_email_otps set
    attempt_count = v_attempts,
    blocked_until = case when v_attempts >= 5 then now() + interval '10 minutes' else null end,
    used_at = case when v_attempts >= 5 then now() else null end
  where id = v_otp.id;
  return case when v_attempts >= 5 then 'blocked' else 'invalid' end;
end;
$$;

revoke all on function public.claim_customer_registration_otp(text,text) from public, anon, authenticated;
grant execute on function public.claim_customer_registration_otp(text,text) to service_role;


-- END 20261006111000_atomic_customer_otp_claim.sql


-- BEGIN 20261006112000_customer_message_rate_limit.sql

-- Anonymous message submissions need a database-side limit; browser controls
-- can be bypassed by calling the RPC with the public anon key.
create table if not exists public.customer_message_rate_limits (
  scope text not null check (scope in ('email', 'global')),
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  primary key (scope, key_hash)
);
alter table public.customer_message_rate_limits enable row level security;

alter function public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)
  rename to submit_customer_message_internal;
revoke all on function public.submit_customer_message_internal(text,text,text,text,text,text,text,text,date,text)
  from public, anon, authenticated;

create function public.submit_customer_message(
  p_category text, p_source text, p_name text, p_email text, p_phone text,
  p_subject text, p_message text, p_inquiry_type text default null,
  p_preferred_date date default null, p_quantity text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_count integer;
  v_key text;
begin
  if length(v_email) > 160 or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid email address';
  end if;

  -- Fixed order of acquisition avoids deadlocks under concurrent submissions.
  foreach v_key in array array['global:' || current_date::text, 'email:' || v_email] loop
    insert into public.customer_message_rate_limits as rate
      (scope, key_hash, window_started_at, request_count)
    values (
      case when v_key like 'global:%' then 'global' else 'email' end,
      encode(pg_catalog.sha256(pg_catalog.convert_to(v_key, 'UTF8')), 'hex'), now(), 1
    )
    on conflict (scope, key_hash) do update set
      window_started_at = case
        when rate.window_started_at <= now() - case when rate.scope = 'global' then interval '1 minute' else interval '10 minutes' end then now()
        else rate.window_started_at end,
      request_count = case
        when rate.window_started_at <= now() - case when rate.scope = 'global' then interval '1 minute' else interval '10 minutes' end then 1
        else rate.request_count + 1 end
    returning request_count into v_count;
    if (v_key like 'global:%' and v_count > 60) or (v_key like 'email:%' and v_count > 3) then
      raise exception 'Too many messages. Please try again later.';
    end if;
  end loop;

  return public.submit_customer_message_internal(
    p_category, p_source, p_name, v_email, p_phone, p_subject,
    p_message, p_inquiry_type, p_preferred_date, p_quantity
  );
end;
$$;

revoke all on function public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)
  from public;
grant execute on function public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)
  to anon, authenticated;
notify pgrst, 'reload schema';


-- END 20261006112000_customer_message_rate_limit.sql


commit;
