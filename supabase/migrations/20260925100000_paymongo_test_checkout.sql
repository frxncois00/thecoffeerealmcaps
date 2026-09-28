-- PayMongo Hosted Checkout metadata for the test-mode integration.
-- The provider columns are intentionally generic so a future provider can be
-- added without changing the customer order model again.

alter table public.payments
  add column if not exists provider text,
  add column if not exists provider_checkout_session_id text,
  add column if not exists provider_checkout_url text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_status text,
  add column if not exists provider_payload jsonb not null default '{}'::jsonb;

-- QRPh and PayMongo are recorded on the payment row so the selected method
-- remains visible to customers, staff, webhooks, and reports.
alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments
  add constraint payments_method_check
  check (method = any (array['cash','gcash','bank_transfer','cod','qrph','paymongo']::text[]));

create unique index if not exists payments_provider_checkout_session_idx
  on public.payments(provider_checkout_session_id)
  where provider_checkout_session_id is not null;

create unique index if not exists payments_provider_payment_id_idx
  on public.payments(provider_payment_id)
  where provider_payment_id is not null;

-- The original customer checkout function predates PayMongo and validates the
-- legacy methods only. Keep that validation intact, then translate paymongo to
-- the existing pending digital-payment path and restore the provider method.
create or replace function public.create_customer_order(request_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_order_id uuid;
  v_order public.orders%rowtype;
  v_payload jsonb := request_payload;
  v_payment_method text := lower(btrim(coalesce(request_payload ->> 'payment_method', 'gcash')));
begin
  if not public.is_customer_profile() then
    raise exception 'Customer account access required';
  end if;

  if v_payment_method = 'paymongo' then
    v_payload := jsonb_set(v_payload, '{payment_method}', to_jsonb('gcash'::text), true);
  end if;

  v_result := public.create_customer_order_internal(v_payload);
  v_order_id := nullif(v_result ->> 'id', '')::uuid;

  if v_order_id is null then
    return v_result;
  end if;

  if v_payment_method = 'paymongo' then
    update public.payments
    set method = 'paymongo', provider = 'paymongo', provider_status = 'pending'
    where order_id = v_order_id;
  end if;

  select * into v_order
  from public.orders
  where id = v_order_id;

  if not found then
    return v_result;
  end if;

  return v_result || jsonb_build_object(
    'order_number', v_order.order_number,
    'receipt_number', v_order.receipt_number
  );
end;
$$;

revoke all on function public.create_customer_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_customer_order(jsonb) to authenticated;

notify pgrst, 'reload schema';
