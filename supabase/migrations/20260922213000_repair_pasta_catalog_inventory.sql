-- Restore the pasta ingredient catalog, BOM links, and sellable availability.
-- All statements are idempotent so this is safe after a partial deployment.

begin;

with required(name, category, type, unit) as (
  values
    ('Fettuccine Pasta', 'Dry Goods', 'dry', 'gram'),
    ('Penne Pasta', 'Dry Goods', 'dry', 'gram'),
    ('Knife-cut Noodles', 'Dry Goods', 'dry', 'gram'),
    ('Macaroni Pasta', 'Dry Goods', 'dry', 'gram'),
    ('White Sauce', 'Sauce', 'wet', 'gram'),
    ('Pesto Sauce', 'Sauce', 'dry', 'gram'),
    ('Chili Peanut Sauce', 'Sauce', 'wet', 'gram'),
    ('Cheese Sauce', 'Sauce', 'wet', 'gram'),
    ('Toasted Loaf', 'Bakery', 'other', 'piece'),
    ('Chicken Tenders', 'Protein', 'dry', 'gram')
)
insert into public.ingredients (name, category, type, unit)
select required.name, required.category, required.type, required.unit
from required
where not exists (
  select 1 from public.ingredients ingredient
  where lower(ingredient.name) = lower(required.name)
);

with stock(name, quantity, min_stock_level, high_stock_level) as (
  values
    ('Fettuccine Pasta', 3000, 750, 3000),
    ('Penne Pasta', 2500, 600, 2500),
    ('Knife-cut Noodles', 2000, 500, 2000),
    ('Macaroni Pasta', 2500, 600, 2500),
    ('White Sauce', 3000, 750, 3000),
    ('Pesto Sauce', 2500, 600, 2500),
    ('Chili Peanut Sauce', 2500, 600, 2500),
    ('Cheese Sauce', 3000, 750, 3000),
    ('Toasted Loaf', 12, 3, 12),
    ('Chicken Tenders', 4000, 1000, 4000)
)
insert into public.inventory_stock (ingredient_id, quantity, min_stock_level, high_stock_level)
select ingredient.id, stock.quantity, stock.min_stock_level, stock.high_stock_level
from stock
join public.ingredients ingredient on lower(ingredient.name) = lower(stock.name)
where not exists (
  select 1 from public.inventory_stock existing
  where existing.ingredient_id = ingredient.id
);

with recipe(product_slug, ingredient_name, quantity) as (
  values
    ('alfredo', 'Fettuccine Pasta', 150),
    ('alfredo', 'Toasted Loaf', 1),
    ('alfredo', 'White Sauce', 150),
    ('alfredo', 'Chicken Tenders', 80),
    ('pesto', 'Penne Pasta', 150),
    ('pesto', 'Toasted Loaf', 1),
    ('pesto', 'Pesto Sauce', 120),
    ('spicy-peanut', 'Knife-cut Noodles', 150),
    ('spicy-peanut', 'Chili Peanut Sauce', 120),
    ('mac-and-cheese', 'Macaroni Pasta', 150),
    ('mac-and-cheese', 'Cheese Sauce', 150),
    ('mac-and-cheese', 'Toasted Loaf', 1)
)
insert into public.menu_item_ingredients (menu_item_id, ingredient_id, quantity_per_serving, unit)
select menu.id, ingredient.id, recipe.quantity, ingredient.unit
from recipe
join public.menu_items menu on menu.slug = recipe.product_slug
join public.ingredients ingredient on lower(ingredient.name) = lower(recipe.ingredient_name)
where not exists (
  select 1 from public.menu_item_ingredients existing
  where existing.menu_item_id = menu.id
    and existing.ingredient_id = ingredient.id
);

update public.menu_items
set manual_available = true, is_archived = false, updated_at = now()
where slug in ('alfredo', 'pesto', 'spicy-peanut', 'mac-and-cheese');

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
