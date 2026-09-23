-- Stock is consumed once, in the same transaction that starts preparation.
-- Keep a durable order-level marker even for recipes with no tracked stock.
alter table public.orders add column if not exists inventory_deducted_at timestamptz;

-- Orders consumed by the previous checkout/payment/completion flows must never
-- be consumed a second time after this migration.
update public.orders o
set inventory_deducted_at = deductions.first_deduction
from (
  select order_id, min(created_at) as first_deduction
  from public.order_inventory_deductions
  group by order_id
) deductions
where o.id = deductions.order_id and o.inventory_deducted_at is null;

drop trigger if exists deduct_confirmed_online_order_inventory_trigger on public.orders;
drop trigger if exists deduct_receipted_walk_in_item_inventory_trigger on public.order_items;
drop trigger if exists restore_reversed_order_inventory_trigger on public.orders;

-- This function keeps using the configured ingredient recipe or finished-product
-- BOM, the ordered quantity, and the locked real stock row.
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
  if v_order.status <> 'Preparing' or v_order.inventory_deducted_at is not null
     or coalesce(v_order.is_voided, false) then return; end if;

  select inventory_source into v_source from public.menu_items where id = v_item.menu_item_id;
  v_variant := nullif(coalesce(v_item.customizations->>'variation_id', v_item.customizations->>'variantKey', ''), '');
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
        values (v_mapping.finished_product_id, v_order.id, v_item.id, 'deduction', v_amount, 'Order stock deduction', auth.uid());
      insert into public.order_inventory_deductions (order_id, order_item_id, finished_product_id, quantity)
        values (v_order.id, v_item.id, v_mapping.finished_product_id, v_amount);
    end loop;
  elsif v_source = 'ingredients' then
    for v_recipe in select ingredient_id, quantity_per_serving from public.menu_item_ingredients
                    where menu_item_id = v_item.menu_item_id loop
      if exists (select 1 from public.order_inventory_deductions
                 where order_item_id = v_item.id and ingredient_id = v_recipe.ingredient_id) then continue; end if;
      v_amount := v_recipe.quantity_per_serving * v_item.quantity;
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

create or replace function public.deduct_order_ingredients(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status <> 'Preparing' or v_order.inventory_deducted_at is not null
     or coalesce(v_order.is_voided, false) then return; end if;

  for v_item in select id from public.order_items where order_id = p_order_id order by id loop
    perform public.deduct_order_item_inventory(v_item.id);
  end loop;
  update public.orders set inventory_deducted_at = now() where id = p_order_id;
end;
$$;
revoke all on function public.deduct_order_ingredients(uuid) from public, anon, authenticated;

create or replace function public.deduct_order_when_preparing() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'Preparing' and old.status is distinct from new.status then
    perform public.deduct_order_ingredients(new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists deduct_order_when_preparing_trigger on public.orders;
create trigger deduct_order_when_preparing_trigger
after update of status on public.orders
for each row execute function public.deduct_order_when_preparing();

-- Walk-in checkout creates the order already in Preparing. Its items are only
-- complete after the internal checkout function returns, so deduct them here.
create or replace function public.create_cashier_order(request_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_result jsonb;
  v_order_id uuid;
  v_order public.orders%rowtype;
begin
  v_result := public.create_cashier_order_internal(request_payload);
  v_order_id := nullif(v_result ->> 'id', '')::uuid;
  if v_order_id is null then return v_result; end if;

  select * into v_order from public.orders where id = v_order_id;
  if not found then return v_result; end if;
  perform public.deduct_order_ingredients(v_order_id);

  return v_result || jsonb_build_object(
    'order_number', v_order.order_number,
    'receipt_number', v_order.receipt_number
  );
end;
$$;
revoke all on function public.create_cashier_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_cashier_order(jsonb) to authenticated;

notify pgrst, 'reload schema';
