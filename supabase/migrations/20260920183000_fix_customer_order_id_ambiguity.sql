-- Avoid collisions between the local order id and order_id table columns when
-- checkout creates an order immediately before uploading digital-payment proof.
create or replace function public.create_customer_order_with_benefit_discount(request_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_order_id uuid;
  v_benefit_kind text;
  v_target_item uuid;
  v_target_unit numeric(12,2);
  v_base_price numeric(12,2);
  v_discount numeric(12,2);
  v_savings numeric(12,2);
  v_order public.orders%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if coalesce((request_payload ->> 'apply_benefit_discount')::boolean, false) then
    select application.kind
      into v_benefit_kind
    from public.benefit_applications as application
    where application.customer_id = auth.uid()
      and application.status = 'approved'
    limit 1;

    if not found then
      raise exception 'Senior Citizen/PWD verification is not approved';
    end if;
  end if;

  v_result := public.create_customer_order(request_payload - 'apply_benefit_discount');

  if not coalesce((request_payload ->> 'apply_benefit_discount')::boolean, false) then
    return v_result;
  end if;

  v_order_id := (v_result ->> 'id')::uuid;

  select placed_order.*
    into v_order
  from public.orders as placed_order
  where placed_order.id = v_order_id
  for update;

  if coalesce(v_order.discount_amount, 0) > 0 then
    return v_result;
  end if;

  select item.id, item.unit_price
    into v_target_item, v_target_unit
  from public.order_items as item
  join public.menu_items as menu_item on menu_item.id = item.menu_item_id
  where item.order_id = v_order_id
    and menu_item.online_benefit_eligible
  order by item.unit_price desc, item.id
  limit 1;

  if v_target_item is null then
    raise exception 'No eligible item in this order';
  end if;

  v_base_price := round(v_target_unit / 1.12, 2);
  v_discount := round(v_base_price * 0.20, 2);
  v_savings := round(v_target_unit - (v_base_price - v_discount), 2);

  update public.order_items as item
  set line_total = item.line_total - v_savings,
      is_discounted = true,
      discount_amount = v_discount
  where item.id = v_target_item;

  update public.orders as placed_order
  set discount_type = case when v_benefit_kind = 'pwd' then 'PWD' else 'Senior' end,
      discount_customer_name = v_order.customer_name,
      discount_subtotal = v_base_price,
      discount_amount = v_discount,
      final_total = v_order.final_total - v_savings,
      updated_at = now()
  where placed_order.id = v_order_id;

  update public.payments as payment
  set amount_due = payment.amount_due - v_savings
  where payment.order_id = v_order_id;

  return v_result || jsonb_build_object(
    'discount_amount', v_discount,
    'total', v_order.final_total - v_savings
  );
end;
$$;

revoke all on function public.create_customer_order_with_benefit_discount(jsonb) from public;
grant execute on function public.create_customer_order_with_benefit_discount(jsonb) to authenticated;

notify pgrst, 'reload schema';
