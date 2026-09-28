-- Allow QRPh to use the same PayMongo Hosted Checkout backend as the
-- general PayMongo option while keeping the selected method visible on the
-- order and in reports.

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

  if v_payment_method in ('paymongo', 'qrph') then
    v_payload := jsonb_set(v_payload, '{payment_method}', to_jsonb('gcash'::text), true);
  end if;

  v_result := public.create_customer_order_internal(v_payload);
  v_order_id := nullif(v_result ->> 'id', '')::uuid;

  if v_order_id is null then
    return v_result;
  end if;

  if v_payment_method in ('paymongo', 'qrph') then
    update public.payments
    set method = v_payment_method, provider = 'paymongo', provider_status = 'pending'
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
