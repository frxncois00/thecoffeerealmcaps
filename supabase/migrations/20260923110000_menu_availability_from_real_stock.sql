-- The existing availability engine only considered ingredient recipes. Ready-made
-- cakes, breads and sandwiches consume finished-product stock instead.
create or replace function public.recompute_menu_item_availability(p_menu_item_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_item public.menu_items%rowtype;
  v_reason text;
  v_available boolean;
begin
  select * into v_item from public.menu_items where id = p_menu_item_id for update;
  if not found then return; end if;

  if v_item.is_archived then
    v_available := false; v_reason := 'archived';
  elsif not v_item.manual_available then
    v_available := false; v_reason := 'manual';
  elsif v_item.available_from is not null and current_date < v_item.available_from then
    v_available := false; v_reason := 'scheduled';
  elsif v_item.available_until is not null and current_date > v_item.available_until then
    v_available := false; v_reason := 'scheduled';
  elsif v_item.inventory_source = 'ingredients' and (
    not exists (select 1 from public.menu_item_ingredients recipe
                where recipe.menu_item_id = p_menu_item_id)
    or exists (
      select 1 from public.menu_item_ingredients recipe
      left join public.inventory_stock stock on stock.ingredient_id = recipe.ingredient_id
      where recipe.menu_item_id = p_menu_item_id
        and coalesce(stock.quantity, 0) < recipe.quantity_per_serving
    )
  ) then
    v_available := false; v_reason := 'insufficient_stock';
  elsif v_item.inventory_source = 'products' and (
    not exists (select 1 from public.finished_product_sale_mappings mapping
                where mapping.menu_item_id = p_menu_item_id)
    or exists (
      select 1 from public.finished_product_sale_mappings mapping
      left join public.finished_products product on product.id = mapping.finished_product_id
      where mapping.menu_item_id = p_menu_item_id
        and (product.id is null or product.is_archived
          or product.quantity < mapping.units_per_sale)
    )
  ) then
    v_available := false; v_reason := 'insufficient_stock';
  else
    v_available := true; v_reason := null;
  end if;

  update public.menu_items
  set is_available = v_available, unavailable_reason = v_reason, updated_at = now()
  where id = p_menu_item_id;
end;
$$;

create or replace function public.recompute_menu_items_from_product_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_menu_item_id uuid;
begin
  for v_menu_item_id in
    select distinct menu_item_id from public.finished_product_sale_mappings
    where finished_product_id = new.id
  loop
    perform public.recompute_menu_item_availability(v_menu_item_id);
  end loop;
  return new;
end;
$$;
drop trigger if exists recompute_menu_items_on_product_stock_change on public.finished_products;
create trigger recompute_menu_items_on_product_stock_change
after update of quantity, is_archived on public.finished_products
for each row execute function public.recompute_menu_items_from_product_stock();

create or replace function public.recompute_menu_item_from_product_mapping() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_menu_item_availability(old.menu_item_id);
    return old;
  elsif tg_op = 'INSERT' then
    perform public.recompute_menu_item_availability(new.menu_item_id);
    return new;
  else
    if old.menu_item_id is distinct from new.menu_item_id then
      perform public.recompute_menu_item_availability(old.menu_item_id);
    end if;
    perform public.recompute_menu_item_availability(new.menu_item_id);
    return new;
  end if;
end;
$$;
drop trigger if exists recompute_menu_item_on_product_mapping_change on public.finished_product_sale_mappings;
create trigger recompute_menu_item_on_product_mapping_change
after insert or update or delete on public.finished_product_sale_mappings
for each row execute function public.recompute_menu_item_from_product_mapping();

create or replace function public.recompute_menu_item_from_inventory_source() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_menu_item_availability(new.id);
  return new;
end;
$$;
drop trigger if exists recompute_menu_item_on_inventory_source_change on public.menu_items;
create trigger recompute_menu_item_on_inventory_source_change
after update of inventory_source on public.menu_items
for each row when (old.inventory_source is distinct from new.inventory_source)
execute function public.recompute_menu_item_from_inventory_source();

-- Check the complete order's demand at checkout, including duplicate lines
-- for one item. The customer and cashier checkout functions insert order_items
-- transactionally, so a shortage rolls back the whole new order.
create or replace function public.assert_order_stock_available(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_item record;
  v_need record;
  v_current numeric;
begin
  for v_item in
    select oi.id, oi.menu_item_id, oi.customizations, mi.inventory_source
    from public.order_items oi join public.menu_items mi on mi.id = oi.menu_item_id
    where oi.order_id = p_order_id
  loop
    if v_item.inventory_source = 'ingredients' and not exists (
      select 1 from public.menu_item_ingredients where menu_item_id = v_item.menu_item_id
    ) then
      raise exception 'A selected menu item has no ingredient recipe';
    end if;
    if v_item.inventory_source = 'products' and not exists (
      select 1 from public.finished_product_sale_mappings mapping
      join public.finished_products product on product.id = mapping.finished_product_id and not product.is_archived
      where mapping.menu_item_id = v_item.menu_item_id
        and (mapping.variant_key is not distinct from nullif(coalesce(v_item.customizations->>'variation_id', v_item.customizations->>'variantKey', ''), '')
          or (mapping.variant_key is null and not exists (
            select 1 from public.finished_product_sale_mappings exact_mapping
            where exact_mapping.menu_item_id = v_item.menu_item_id
              and exact_mapping.variant_key is not distinct from nullif(coalesce(v_item.customizations->>'variation_id', v_item.customizations->>'variantKey', ''), '')
          )))
    ) then
      raise exception 'A selected product is out of stock';
    end if;
  end loop;

  for v_need in
    select recipe.ingredient_id as id, sum(recipe.quantity_per_serving * oi.quantity) as quantity
    from public.order_items oi
    join public.menu_items mi on mi.id = oi.menu_item_id and mi.inventory_source = 'ingredients'
    join public.menu_item_ingredients recipe on recipe.menu_item_id = oi.menu_item_id
    where oi.order_id = p_order_id group by recipe.ingredient_id order by recipe.ingredient_id
  loop
    select quantity into v_current from public.inventory_stock where ingredient_id = v_need.id;
    if v_current is null or v_current < v_need.quantity then
      raise exception 'A selected menu item is out of stock';
    end if;
  end loop;

  for v_need in
    select mapping.finished_product_id as id, sum(mapping.units_per_sale * oi.quantity) as quantity
    from public.order_items oi
    join public.menu_items mi on mi.id = oi.menu_item_id and mi.inventory_source = 'products'
    join public.finished_product_sale_mappings mapping on mapping.menu_item_id = oi.menu_item_id
      and (mapping.variant_key is not distinct from nullif(coalesce(oi.customizations->>'variation_id', oi.customizations->>'variantKey', ''), '')
        or (mapping.variant_key is null and not exists (
          select 1 from public.finished_product_sale_mappings exact_mapping
          where exact_mapping.menu_item_id = oi.menu_item_id
            and exact_mapping.variant_key is not distinct from nullif(coalesce(oi.customizations->>'variation_id', oi.customizations->>'variantKey', ''), '')
        )))
    where oi.order_id = p_order_id group by mapping.finished_product_id order by mapping.finished_product_id
  loop
    select quantity into v_current from public.finished_products where id = v_need.id and not is_archived;
    if v_current is null or v_current < v_need.quantity then
      raise exception 'A selected product is out of stock';
    end if;
  end loop;
end;
$$;
revoke all on function public.assert_order_stock_available(uuid) from public, anon, authenticated;

create or replace function public.check_order_stock_on_item_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.orders where id = new.order_id
             and order_source in ('customer_pos', 'cashier_pos')) then
    perform public.assert_order_stock_available(new.order_id);
  end if;
  return new;
end;
$$;
drop trigger if exists check_order_stock_on_item_change_trigger on public.order_items;
create trigger check_order_stock_on_item_change_trigger
after insert or update of menu_item_id, quantity, customizations on public.order_items
for each row execute function public.check_order_stock_on_item_change();

-- Repair the currently stale flags, including products already at zero.
do $$
declare v_id uuid;
begin
  for v_id in select id from public.menu_items order by id loop
    perform public.recompute_menu_item_availability(v_id);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
