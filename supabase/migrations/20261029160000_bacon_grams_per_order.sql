begin;

do $$
declare
  v_bacon_id uuid;
  v_unit text;
begin
  select id, lower(unit) into v_bacon_id, v_unit
  from public.ingredients
  where lower(name) = 'bacon' and not is_archived;

  if v_bacon_id is null then
    raise notice 'Bacon is not installed yet; the sandwich setup script will create it in grams';
    return;
  end if;
  if v_unit not in ('strip', 'strips', 'gram', 'g') then
    raise exception 'Unexpected Bacon inventory unit: %', v_unit;
  end if;

  if v_unit in ('strip', 'strips') then
    -- The existing sandwich BOM uses two strips; each old strip is 25 g.
    update public.inventory_stock
    set quantity = quantity * 25,
        min_stock_level = case
          when (min_stock_level, high_stock_level) in ((0, 0), (500, 2000)) then 250
          else min_stock_level * 25 end,
        high_stock_level = case
          when (min_stock_level, high_stock_level) in ((0, 0), (500, 2000)) then 1000
          else high_stock_level * 25 end,
        updated_at = now()
    where ingredient_id = v_bacon_id;

    update public.inventory_movements
    set quantity = quantity * 25
    where ingredient_id = v_bacon_id;

    update public.menu_item_ingredients
    set quantity_per_serving = quantity_per_serving * 25, unit = 'gram'
    where ingredient_id = v_bacon_id;

    update public.purchase_order_items
    set quantity_ordered = quantity_ordered * 25,
        received_quantity = received_quantity * 25,
        accepted_quantity = accepted_quantity * 25,
        damaged_quantity = damaged_quantity * 25,
        missing_quantity = missing_quantity * 25,
        estimated_unit_cost = estimated_unit_cost / 25,
        actual_unit_cost = actual_unit_cost / 25,
        unit = 'gram', updated_at = now()
    where ingredient_id = v_bacon_id and lower(unit) in ('strip', 'strips');

    update public.supplier_items
    set unit_price = greatest(round(unit_price / 25, 4), 0.0001)
    where item_type = 'ingredient' and ingredient_id = v_bacon_id;

    update public.ingredients
    set unit = 'gram', cost_per_unit = cost_per_unit / 25
    where id = v_bacon_id;
  end if;

  -- One Bacon Egg and Cheese Sandwich consumes 50 g of Bacon.
  update public.menu_item_ingredients recipe
  set quantity_per_serving = 50, unit = 'gram'
  from public.menu_items menu
  where recipe.menu_item_id = menu.id and recipe.ingredient_id = v_bacon_id
    and menu.name = 'Bacon Egg and Cheese Sandwich' and not menu.is_archived;

  if not found then
    raise exception 'Bacon Egg and Cheese Sandwich recipe not found';
  end if;
end $$;

commit;
