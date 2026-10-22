-- Repair deployments where an older function overwrote immediate stock commitment.
-- Existing orders are not backfilled: historical stock requires reconciliation.
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

notify pgrst, 'reload schema';
