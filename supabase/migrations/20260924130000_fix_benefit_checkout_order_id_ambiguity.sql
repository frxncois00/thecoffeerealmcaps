-- Preserve the current VAT-exempt SC/PWD calculation while removing the
-- order_id PL/pgSQL variable that collides with order_items.order_id and
-- payments.order_id during customer checkout.
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
  v_eligible_base numeric(12,2);
  v_discount numeric(12,2);
  v_vat_removed numeric(12,2);
  v_savings numeric(12,2);
  v_order public.orders%rowtype;
  v_vat_rate numeric := 0.12;
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

  v_vat_rate := coalesce(v_order.vat_rate, 0.12);

  select
    order_item.id,
    round(order_item.line_total / greatest(order_item.quantity, 1), 2)
    into v_target_item, v_target_unit
  from public.order_items as order_item
  join public.menu_items as menu_item on menu_item.id = order_item.menu_item_id
  where order_item.order_id = v_order_id
    and menu_item.online_benefit_eligible
  order by
    (order_item.line_total / greatest(order_item.quantity, 1)) desc,
    order_item.id
  limit 1;

  if v_target_item is null then
    raise exception 'No eligible item in this order';
  end if;

  v_eligible_base := case
    when v_vat_rate = 0 then v_target_unit
    else round(v_target_unit / (1 + v_vat_rate), 2)
  end;
  v_vat_removed := round(v_target_unit - v_eligible_base, 2);
  v_discount := round(v_eligible_base * 0.20, 2);
  v_savings := round(v_vat_removed + v_discount, 2);

  update public.order_items as order_item
  set is_discounted = true,
      discount_amount = v_discount,
      vat_exempt_amount = v_vat_removed
  where order_item.id = v_target_item;

  update public.orders as placed_order
  set discount_type = case when v_benefit_kind = 'pwd' then 'PWD' else 'Senior' end,
      discount_customer_name = v_order.customer_name,
      discount_subtotal = v_target_unit,
      discount_amount = v_discount,
      vat_exempt_amount = v_vat_removed,
      final_total = v_order.final_total - v_savings,
      updated_at = now()
  where placed_order.id = v_order_id;

  update public.payments as payment
  set amount_due = round(payment.amount_due - v_savings, 2)
  where payment.order_id = v_order_id;

  return v_result || jsonb_build_object(
    'discount_amount', v_discount,
    'vat_exempt_amount', v_vat_removed,
    'total', round(v_order.final_total - v_savings, 2)
  );
end;
$$;

revoke all on function public.create_customer_order_with_benefit_discount(jsonb) from public;
grant execute on function public.create_customer_order_with_benefit_discount(jsonb) to authenticated;

notify pgrst, 'reload schema';
