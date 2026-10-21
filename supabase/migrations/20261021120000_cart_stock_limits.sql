-- Recipes describe one base serving. Product mappings already describe the
-- complete selling option, so they must never receive a second multiplier.
create or replace function public.menu_serving_multiplier(p_item uuid, p_variant text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_config jsonb; v_option jsonb;
begin
  select variant_options into v_config from public.menu_items where id = p_item;
  -- Legacy cake recipes are recorded per slice; their Whole option is eight.
  if v_config->>'type' = 'cake' and p_variant = 'whole' then return 8; end if;
  if coalesce((v_config->>'enabled')::boolean, false) then
    if p_variant is null then
      v_option := v_config->'options'->0;
    else
      select value into v_option from jsonb_array_elements(coalesce(v_config->'options', '[]'))
      where value->>'key' = p_variant;
    end if;
    -- Other recipes are configured per sale (e.g. a 16-ounce drink), not
    -- per unit of the option's volume or weight.
    if lower(v_option->>'unit') in ('slice', 'slices') then
      return greatest(coalesce((v_option->>'quantity')::numeric, 1), 1);
    end if;
  end if;
  return 1;
end;
$$;
revoke all on function public.menu_serving_multiplier(uuid,text) from public, anon, authenticated;

create or replace function public.cart_stock_available(p_items jsonb)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_line jsonb; v_item public.menu_items%rowtype; v_variant text;
  v_quantity numeric; v_need record; v_key text; v_amount numeric;
  v_demands jsonb := '{}'::jsonb; v_found boolean; v_stock numeric;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 200 then return false; end if;
  for v_line in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_line->>'quantity')::numeric;
    if v_quantity is null or v_quantity < 1 or v_quantity > 99 or trunc(v_quantity) <> v_quantity then return false; end if;
    select * into v_item from public.menu_items where id = (v_line->>'menu_item_id')::uuid;
    if not found or v_item.is_archived or not v_item.manual_available
      or current_date < v_item.available_from or current_date > v_item.available_until then return false; end if;
    v_variant := nullif(v_line->>'variant_key', '');
    if v_variant is null and coalesce((v_item.variant_options->>'enabled')::boolean, false) then
      v_variant := v_item.variant_options->'options'->0->>'key';
    end if;
    if v_variant is not null and coalesce((v_item.variant_options->>'enabled')::boolean, false)
      and not exists (select 1 from jsonb_array_elements(coalesce(v_item.variant_options->'options','[]')) o where o->>'key' = v_variant)
      and not coalesce(v_item.variant_options->'prices' ? v_variant, false) then return false; end if;
    v_found := false;
    for v_need in
      select 'i:' || r.ingredient_id::text as key,
        r.quantity_per_serving * public.menu_serving_multiplier(v_item.id, v_variant) as amount
      from public.menu_item_ingredients r where r.menu_item_id = v_item.id and v_item.inventory_source = 'ingredients'
      union all
      select 'p:' || m.finished_product_id::text, m.units_per_sale
      from public.finished_product_sale_mappings m
      where m.menu_item_id = v_item.id and v_item.inventory_source = 'products'
        and (m.variant_key is not distinct from v_variant or (m.variant_key is null and not exists (
          select 1 from public.finished_product_sale_mappings x where x.menu_item_id = v_item.id and x.variant_key is not distinct from v_variant)))
    loop
      v_found := true;
      if v_need.amount is null or v_need.amount <= 0 then return false; end if;
      v_demands := jsonb_set(v_demands, array[v_need.key], to_jsonb(coalesce((v_demands->>v_need.key)::numeric,0) + v_need.amount * v_quantity));
    end loop;
    if v_item.inventory_source in ('ingredients','products') and not v_found then return false; end if;
  end loop;
  for v_key, v_amount in select key, value::numeric from jsonb_each_text(v_demands) loop
    if left(v_key,2) = 'i:' then
      select s.quantity into v_stock from public.inventory_stock s join public.ingredients i on i.id = s.ingredient_id
      where s.ingredient_id = substring(v_key from 3)::uuid and not i.is_archived;
    else
      select quantity into v_stock from public.finished_products where id = substring(v_key from 3)::uuid and not is_archived;
    end if;
    if v_stock is null or v_stock < v_amount then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.cart_stock_available(jsonb) from public;
grant execute on function public.cart_stock_available(jsonb) to anon, authenticated;

-- Existing checkout trigger uses the same rule as both carts.
create or replace function public.assert_order_stock_available(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.cart_stock_available(coalesce((select jsonb_agg(jsonb_build_object(
    'menu_item_id', menu_item_id, 'quantity', quantity,
    'variant_key', coalesce(customizations->>'variation_id', customizations->>'variantKey')))
    from public.order_items where order_id = p_order_id), '[]'::jsonb)) then
    raise exception 'The selected quantity is unavailable. Please reduce the quantity or choose another item.';
  end if;
end;
$$;
revoke all on function public.assert_order_stock_available(uuid) from public, anon, authenticated;

-- Match ingredient deductions to the validated selling quantity.
create or replace function public.deduct_order_item_inventory(p_order_item_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_item public.order_items%rowtype;
  v_order public.orders%rowtype;
  v_variant text;
  v_mapping record;
  v_recipe record;
  v_amount numeric;
  v_current numeric;
  v_source text;
begin
  select * into v_item from public.order_items where id = p_order_item_id for update;
  if not found then raise exception 'Order item not found'; end if;
  select * into v_order from public.orders where id = v_item.order_id for update;
  if v_order.status not in ('Order Received','Awaiting Payment Verification','Pending Confirmation','Preparing') or v_order.inventory_deducted_at is not null
     or coalesce(v_order.is_voided, false) then return; end if;

  select inventory_source into v_source from public.menu_items where id = v_item.menu_item_id;
  v_variant := nullif(coalesce(v_item.customizations->>'variation_id', v_item.customizations->>'variantKey', ''), '');
  if v_variant is null then
    select case when coalesce((variant_options->>'enabled')::boolean,false)
      then variant_options->'options'->0->>'key' else null end into v_variant
    from public.menu_items where id = v_item.menu_item_id;
  end if;
  if v_source = 'products' then
    for v_mapping in
      select mapping.* from public.finished_product_sale_mappings mapping
      join public.finished_products product on product.id = mapping.finished_product_id and not product.is_archived
      where mapping.menu_item_id = v_item.menu_item_id
        and (mapping.variant_key is not distinct from v_variant
          or (mapping.variant_key is null and not exists (
            select 1 from public.finished_product_sale_mappings x
            where x.menu_item_id = v_item.menu_item_id and x.variant_key is not distinct from v_variant)))
    loop
      if exists (select 1 from public.order_inventory_deductions
                 where order_item_id = v_item.id and finished_product_id = v_mapping.finished_product_id) then continue; end if;
      v_amount := v_mapping.units_per_sale * v_item.quantity;
      select quantity into v_current from public.finished_products where id = v_mapping.finished_product_id for update;
      if v_current is null or v_current < v_amount then raise exception 'Insufficient product stock for this order'; end if;
      update public.finished_products set quantity = quantity - v_amount, updated_at = now() where id = v_mapping.finished_product_id;
      insert into public.finished_product_movements (finished_product_id, order_id, order_item_id, movement_type, quantity, reason, created_by)
        values (v_mapping.finished_product_id, v_order.id, v_item.id, 'deduction', v_amount, 'Order stock committed', auth.uid());
      insert into public.order_inventory_deductions (order_id, order_item_id, finished_product_id, quantity)
        values (v_order.id, v_item.id, v_mapping.finished_product_id, v_amount);
    end loop;
  elsif v_source = 'ingredients' then
    for v_recipe in select ingredient_id, quantity_per_serving from public.menu_item_ingredients
                    where menu_item_id = v_item.menu_item_id loop
      if exists (select 1 from public.order_inventory_deductions
                 where order_item_id = v_item.id and ingredient_id = v_recipe.ingredient_id) then continue; end if;
      v_amount := v_recipe.quantity_per_serving * v_item.quantity * public.menu_serving_multiplier(v_item.menu_item_id, v_variant);
      select quantity into v_current from public.inventory_stock where ingredient_id = v_recipe.ingredient_id for update;
      if v_current is null or v_current < v_amount then raise exception 'Insufficient ingredient stock for this order'; end if;
      update public.inventory_stock set quantity = quantity - v_amount, updated_at = now() where ingredient_id = v_recipe.ingredient_id;
      insert into public.inventory_movements (ingredient_id, order_id, order_item_id, movement_type, quantity, reason, created_by)
        values (v_recipe.ingredient_id, v_order.id, v_item.id, 'deduction', v_amount, 'Order stock deduction', auth.uid());
      insert into public.order_inventory_deductions (order_id, order_item_id, ingredient_id, quantity)
        values (v_order.id, v_item.id, v_recipe.ingredient_id, v_amount);
    end loop;
  end if;
end;
$$;
revoke all on function public.deduct_order_item_inventory(uuid) from public, anon, authenticated;


notify pgrst, 'reload schema';
