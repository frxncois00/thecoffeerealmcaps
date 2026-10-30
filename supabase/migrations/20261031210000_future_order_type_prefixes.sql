-- Use fulfillment-specific prefixes for orders created after this migration.
-- Existing order numbers are intentionally left unchanged.

create sequence if not exists public.short_pickup_order_seq;
create sequence if not exists public.short_delivery_order_seq;

create or replace function public.next_short_order_number(
  p_prefix text,
  p_created_at timestamptz
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sequence bigint;
  v_prefix text := upper(btrim(coalesce(p_prefix, '')));
begin
  if v_prefix = 'WI' then
    v_sequence := nextval('public.short_walk_in_order_seq');
  elsif v_prefix = 'PU' then
    v_sequence := nextval('public.short_pickup_order_seq');
  elsif v_prefix = 'D' then
    v_sequence := nextval('public.short_delivery_order_seq');
  elsif v_prefix = 'CR' then
    v_sequence := nextval('public.short_customer_order_seq');
  else
    raise exception 'Unsupported short order prefix';
  end if;

  return v_prefix || '-' ||
    to_char(coalesce(p_created_at, clock_timestamp()) at time zone 'Asia/Manila', 'MMDD') || '-' ||
    lpad(v_sequence::text, 4, '0');
end;
$$;

create or replace function public.assign_short_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_type text := lower(btrim(coalesce(new.order_type, '')));
  v_prefix text;
begin
  v_prefix := case
    when coalesce(new.order_source, '') = 'cashier_pos'
      or v_order_type in ('walk-in', 'walk in', 'walkin')
      then 'WI'
    when v_order_type = 'pickup'
      then 'PU'
    when v_order_type = 'delivery'
      then 'D'
    else 'CR'
  end;

  new.order_number := public.next_short_order_number(v_prefix, new.created_at);
  return new;
end;
$$;

revoke all on function public.next_short_order_number(text, timestamptz) from public, anon, authenticated;
revoke all on function public.assign_short_order_number() from public, anon, authenticated;
revoke all on sequence public.short_pickup_order_seq from public, anon, authenticated;
revoke all on sequence public.short_delivery_order_seq from public, anon, authenticated;
