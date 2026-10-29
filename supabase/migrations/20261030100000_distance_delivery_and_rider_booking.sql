-- Manual distance rates, verified road quotes, and rider booking responsibility.
begin;
alter table public.orders
  add column if not exists rider_booking text check (rider_booking in ('customer','staff')),
  add column if not exists delivery_distance_km numeric,
  add column if not exists delivery_quote_id uuid,
  add column if not exists delivery_rate_snapshot jsonb;

insert into public.portal_configuration(scope,key,value,is_public)
values ('system','delivery','{"baseFare":50,"tiers":[{"upTo":3,"rate":6.5},{"upTo":7,"rate":6.2},{"upTo":10,"rate":6},{"upTo":15,"rate":null},{"upTo":null,"rate":5}],"storeLat":14.7088,"storeLng":121.0605,"pickupImageUrl":""}',true)
on conflict (scope,key) do nothing;

create table if not exists public.delivery_quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  latitude numeric not null, longitude numeric not null,
  barangay text not null, distance_km numeric not null check(distance_km between 0 and 200),
  fee numeric(12,2) not null check(fee>=0), rates jsonb not null,
  settings_updated_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '1 hour'),
  order_id uuid unique references public.orders(id)
);
create index if not exists delivery_quotes_customer_created_idx on public.delivery_quotes(customer_id,created_at);
alter table public.delivery_quotes enable row level security;
revoke all on public.delivery_quotes from anon,authenticated;
grant all on public.delivery_quotes to service_role;

create or replace function public.checkout_delivery_fee(payload jsonb)
returns numeric language plpgsql security definer set search_path=public as $$
declare
  booking text:=coalesce(payload->>'rider_booking','staff');
  q public.delivery_quotes%rowtype;
  settings jsonb;
begin
  if not public.is_customer_profile() then raise exception 'Customer account access required'; end if;
  if booking not in ('customer','staff') then raise exception 'Choose who books the rider'; end if;
  if booking='customer' then
    if payload->>'payment_method'='cod' then raise exception 'Pay online when booking your own rider'; end if;
    return 0;
  end if;
  select * into q from public.delivery_quotes
  where id=nullif(payload->>'delivery_quote_id','')::uuid and customer_id=auth.uid() for update;
  if not found or q.expires_at<=now() or q.order_id is not null then raise exception 'Refresh your delivery estimate at checkout'; end if;
  if lower(q.barangay)<>lower(coalesce(payload#>>'{customer,barangay}',''))
     or q.latitude is distinct from (payload#>>'{customer,coordinates,lat}')::numeric
     or q.longitude is distinct from (payload#>>'{customer,coordinates,lng}')::numeric
  then raise exception 'Delivery pin changed. Refresh the estimate'; end if;
  if not exists(select 1 from public.delivery_areas where lower(barangay)=lower(q.barangay) and is_active) then raise exception 'Delivery area unavailable'; end if;
  select value into settings from public.portal_configuration where scope='system' and key='delivery';
  if settings is distinct from q.rates then raise exception 'Delivery rates changed. Refresh the estimate'; end if;
  return q.fee;
end; $$;
revoke all on function public.checkout_delivery_fee(jsonb) from public,anon,authenticated;

-- Patch only the legacy fee lookup so all current menu, schedule, stock,
-- pricing, and idempotency safeguards in the deployed function are retained.
do $migration$
declare definition text; old_block text; new_definition text;
begin
  definition:=pg_get_functiondef('public.create_customer_order_internal(jsonb)'::regprocedure);
  old_block:='select da.fee into fee\s+from public.delivery_areas da\s+where lower\(da.barangay\)=lower\(requested_barangay\) and da.is_active=true;\s+if not found then raise exception ''The selected delivery area is unavailable''; end if;';
  new_definition:=regexp_replace(definition,old_block,'fee:=public.checkout_delivery_fee(request_payload);');
  if new_definition=definition and position('checkout_delivery_fee(request_payload)' in definition)=0 then
    raise exception 'Delivery migration could not locate the legacy fee lookup; no changes applied';
  end if;
  execute new_definition;
end; $migration$;

create or replace function public.create_customer_order(request_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  result jsonb; v_order_id uuid; placed public.orders%rowtype;
  payload jsonb:=request_payload;
  v_method text:=lower(btrim(coalesce(request_payload->>'payment_method','gcash')));
  booking text:=coalesce(request_payload->>'rider_booking','staff');
  quote public.delivery_quotes%rowtype;
  request_id uuid:=nullif(request_payload->>'request_key','')::uuid;
begin
  if not public.is_customer_profile() then raise exception 'Customer account access required'; end if;
  if request_id is null then raise exception 'Checkout request key is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||request_id::text,0));
  select * into placed from public.orders where customer_id=auth.uid() and request_key=request_id;
  if found then
    return jsonb_build_object('id',placed.id,'order_id',placed.id,'order_number',placed.order_number,'receipt_number',placed.receipt_number,'subtotal',placed.subtotal,'delivery_fee',placed.delivery_fee,'total',placed.final_total,'status',placed.status,'rider_booking',placed.rider_booking,'delivery_distance_km',placed.delivery_distance_km);
  end if;
  if v_method in ('paymongo','qrph') then payload:=jsonb_set(payload,'{payment_method}',to_jsonb('gcash'::text)); end if;
  result:=public.create_customer_order_internal(payload);
  v_order_id:=(result->>'id')::uuid;
  if v_method in ('paymongo','qrph') then
    update public.payments set method=v_method,provider='paymongo',provider_status='pending' where payments.order_id=v_order_id;
  end if;
  if coalesce(payload->>'fulfillment_method','delivery')='delivery' then
    if booking='staff' then
      select * into quote from public.delivery_quotes where id=(payload->>'delivery_quote_id')::uuid;
      update public.delivery_quotes set order_id=v_order_id where id=quote.id;
    end if;
    update public.orders set rider_booking=booking,delivery_distance_km=quote.distance_km,
      delivery_quote_id=quote.id,delivery_rate_snapshot=quote.rates,
      delivery_address=case when booking='customer' then null else delivery_address end,
      delivery_notes=nullif(payload#>>'{customer,instructions}','')
    where id=v_order_id;
  end if;
  select * into placed from public.orders where id=v_order_id;
  return result||jsonb_build_object('order_number',placed.order_number,'receipt_number',placed.receipt_number,'rider_booking',placed.rider_booking,'delivery_distance_km',placed.delivery_distance_km);
end; $$;
revoke all on function public.create_customer_order(jsonb) from public,anon,authenticated;
grant execute on function public.create_customer_order(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
