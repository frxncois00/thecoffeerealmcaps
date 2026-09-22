-- Ensure every ingredient currently used by the pasta BOM has a positive
-- opening stock row, then recalculate the menu availability flags.

begin;

with pasta_ingredients as (
  select distinct recipe.ingredient_id
  from public.menu_item_ingredients recipe
  join public.menu_items item on item.id = recipe.menu_item_id
  where item.slug in ('alfredo', 'pesto', 'spicy-peanut', 'mac-and-cheese')
), updated as (
  update public.inventory_stock stock
  set quantity = greatest(coalesce(stock.quantity, 0), 1000),
      min_stock_level = greatest(coalesce(stock.min_stock_level, 0), 1),
      high_stock_level = greatest(coalesce(stock.high_stock_level, 0), 1000),
      updated_at = now()
  from pasta_ingredients required
  where stock.ingredient_id = required.ingredient_id
  returning stock.ingredient_id
)
insert into public.inventory_stock (ingredient_id, quantity, min_stock_level, high_stock_level)
select required.ingredient_id, 1000, 1, 1000
from pasta_ingredients required
where not exists (
  select 1 from public.inventory_stock stock
  where stock.ingredient_id = required.ingredient_id
);

do $$
declare item_id uuid;
begin
  for item_id in
    select id from public.menu_items
    where slug in ('alfredo', 'pesto', 'spicy-peanut', 'mac-and-cheese')
  loop
    perform public.recompute_menu_item_availability(item_id);
  end loop;
end;
$$;

commit;

notify pgrst, 'reload schema';
