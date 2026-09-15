-- Reset the ingredient catalog and replace it with the approved basic setup.
-- This intentionally removes old ingredient stock, movement history, and
-- recipe links. Finished products, product BOM links, orders, and their
-- tables are not touched.

begin;

delete from public.order_inventory_deductions where ingredient_id is not null;
delete from public.inventory_movements;
delete from public.menu_item_ingredients;
delete from public.inventory_stock;
delete from public.ingredients;

drop table if exists tmp_basic_recipe_seed;
drop table if exists tmp_basic_ingredient_seed;

create temp table tmp_basic_ingredient_seed (
  name text primary key,
  category text not null,
  type text not null,
  unit text not null
);

insert into tmp_basic_ingredient_seed (name, category, type, unit) values
  ('Espresso Beans', 'Coffee', 'dry', 'gram'),
  ('Black Tea Leaves', 'Tea', 'dry', 'gram'),
  ('Thai Tea Leaves', 'Tea', 'dry', 'gram'),
  ('Fresh Milk', 'Dairy', 'wet', 'milliliter'),
  ('Oat Milk', 'Dairy Alternative', 'wet', 'milliliter'),
  ('Soy Milk', 'Dairy Alternative', 'wet', 'milliliter'),
  ('Evaporated Milk', 'Dairy', 'wet', 'milliliter'),
  ('Condensed Milk', 'Dairy', 'wet', 'milliliter'),
  ('Heavy Cream', 'Dairy', 'wet', 'milliliter'),
  ('Matcha Powder', 'Powder', 'dry', 'gram'),
  ('Hojicha Powder', 'Powder', 'dry', 'gram'),
  ('Black Sesame Paste', 'Spread', 'dry', 'gram'),
  ('Cinnamon Powder', 'Seasoning', 'dry', 'gram'),
  ('Biscoff Spread', 'Spread', 'dry', 'gram'),
  ('Honey Citron Jam', 'Spread', 'dry', 'gram'),
  ('Simple Syrup', 'Syrup', 'wet', 'milliliter'),
  ('Earl Grey Syrup', 'Syrup', 'wet', 'milliliter'),
  ('Maple Syrup', 'Syrup', 'wet', 'milliliter'),
  ('Caramel Syrup', 'Syrup', 'wet', 'milliliter'),
  ('Caramel Sauce', 'Sauce', 'wet', 'milliliter'),
  ('Lychee Syrup', 'Syrup', 'wet', 'milliliter'),
  ('Lemon Syrup', 'Syrup', 'wet', 'milliliter'),
  ('Yuzu Syrup', 'Syrup', 'wet', 'milliliter'),
  ('Sala Syrup', 'Syrup', 'wet', 'milliliter'),
  ('Arnibal Syrup', 'Syrup', 'wet', 'milliliter'),
  ('Dark Chocolate Sauce', 'Sauce', 'wet', 'milliliter'),
  ('White Chocolate Sauce', 'Sauce', 'wet', 'milliliter'),
  ('Strawberry Puree', 'Fruit', 'wet', 'milliliter'),
  ('Passion Fruit Puree', 'Fruit', 'wet', 'milliliter'),
  ('Coconut Water', 'Beverage Base', 'wet', 'milliliter'),
  ('Drinking Water', 'Beverage Base', 'wet', 'milliliter'),
  ('Ice', 'Beverage Base', 'wet', 'gram'),
  ('Marshmallow', 'Topping', 'dry', 'gram'),
  ('Sago Pearls', 'Topping', 'dry', 'gram'),
  ('Rice', 'Grain', 'dry', 'gram'),
  ('Egg', 'Protein', 'other', 'piece'),
  ('Beef Tapa', 'Protein', 'dry', 'gram'),
  ('Bangus Fillet', 'Protein', 'other', 'piece'),
  ('Pork Katsu', 'Protein', 'dry', 'gram'),
  ('Corned Beef', 'Protein', 'dry', 'gram'),
  ('Spam', 'Protein', 'dry', 'gram'),
  ('Hungarian Sausage', 'Protein', 'other', 'piece'),
  ('Chicken Tenders', 'Protein', 'dry', 'gram'),
  ('Chicken Nuggets', 'Protein', 'dry', 'gram'),
  ('Potato', 'Produce', 'dry', 'gram'),
  ('Carrot', 'Produce', 'dry', 'gram'),
  ('Shoestring Fries', 'Frozen', 'dry', 'gram'),
  ('Potato Wedges', 'Frozen', 'dry', 'gram'),
  ('Nacho Chips', 'Dry Goods', 'dry', 'gram'),
  ('Japanese Curry Sauce', 'Sauce', 'wet', 'gram'),
  ('Cheese Sauce', 'Sauce', 'wet', 'gram'),
  ('Salsa', 'Sauce', 'wet', 'gram'),
  ('White Sauce', 'Sauce', 'wet', 'gram'),
  ('Pesto Sauce', 'Sauce', 'dry', 'gram'),
  ('Chili Peanut Sauce', 'Sauce', 'wet', 'gram'),
  ('Ketchup', 'Condiment', 'wet', 'gram'),
  ('Mustard', 'Condiment', 'wet', 'gram'),
  ('Fries Seasoning', 'Seasoning', 'dry', 'gram'),
  ('Fettuccine Pasta', 'Dry Goods', 'dry', 'gram'),
  ('Penne Pasta', 'Dry Goods', 'dry', 'gram'),
  ('Macaroni Pasta', 'Dry Goods', 'dry', 'gram'),
  ('Knife-cut Noodles', 'Dry Goods', 'dry', 'gram'),
  ('Toasted Loaf', 'Bakery', 'other', 'piece');

insert into public.ingredients (name, category, type, unit)
select name, category, type, unit
from tmp_basic_ingredient_seed;

-- Stock starts empty on purpose. Staff can restock each ingredient after
-- checking the real opening inventory; no artificial stock is invented.
insert into public.inventory_stock (ingredient_id, quantity, min_stock_level, high_stock_level)
select id, 0, 0, 0
from public.ingredients;

create temp table tmp_basic_recipe_seed (
  product_slug text not null,
  ingredient_name text not null,
  quantity numeric not null check (quantity > 0),
  primary key (product_slug, ingredient_name)
);

insert into tmp_basic_recipe_seed (product_slug, ingredient_name, quantity) values
  -- Drinks
  ('earl-grey-oat-matcha-latte', 'Matcha Powder', 5),
  ('earl-grey-oat-matcha-latte', 'Oat Milk', 180),
  ('earl-grey-oat-matcha-latte', 'Earl Grey Syrup', 20),
  ('earl-grey-oat-matcha-latte', 'Ice', 150),
  ('hojicha-coconut-cloud', 'Hojicha Powder', 4),
  ('hojicha-coconut-cloud', 'Coconut Water', 150),
  ('hojicha-coconut-cloud', 'Heavy Cream', 30),
  ('hojicha-coconut-cloud', 'Simple Syrup', 15),
  ('hojicha-coconut-cloud', 'Ice', 150),
  ('taho-latte', 'Soy Milk', 180),
  ('taho-latte', 'Sago Pearls', 40),
  ('taho-latte', 'Arnibal Syrup', 30),
  ('taho-latte', 'Ice', 150),
  ('black-sesame-matcha-latte', 'Matcha Powder', 5),
  ('black-sesame-matcha-latte', 'Fresh Milk', 180),
  ('black-sesame-matcha-latte', 'Black Sesame Paste', 20),
  ('black-sesame-matcha-latte', 'Heavy Cream', 30),
  ('black-sesame-matcha-latte', 'Simple Syrup', 10),
  ('black-sesame-matcha-latte', 'Ice', 150),
  ('passion-fruit-yuzu-black-tea', 'Black Tea Leaves', 5),
  ('passion-fruit-yuzu-black-tea', 'Passion Fruit Puree', 40),
  ('passion-fruit-yuzu-black-tea', 'Yuzu Syrup', 25),
  ('passion-fruit-yuzu-black-tea', 'Drinking Water', 120),
  ('passion-fruit-yuzu-black-tea', 'Ice', 150),
  ('biscoff-latte', 'Espresso Beans', 18),
  ('biscoff-latte', 'Fresh Milk', 160),
  ('biscoff-latte', 'Biscoff Spread', 30),
  ('biscoff-latte', 'Heavy Cream', 30),
  ('biscoff-latte', 'Ice', 150),
  ('maple-oat-latte', 'Espresso Beans', 18),
  ('maple-oat-latte', 'Oat Milk', 180),
  ('maple-oat-latte', 'Maple Syrup', 20),
  ('maple-oat-latte', 'Cinnamon Powder', 1),
  ('spanish-latte', 'Espresso Beans', 18),
  ('spanish-latte', 'Fresh Milk', 180),
  ('spanish-latte', 'Condensed Milk', 25),
  ('seasalt-latte', 'Espresso Beans', 18),
  ('seasalt-latte', 'Fresh Milk', 160),
  ('seasalt-latte', 'Heavy Cream', 40),
  ('seasalt-latte', 'Ice', 150),
  ('white-mocha', 'Espresso Beans', 18),
  ('white-mocha', 'Fresh Milk', 170),
  ('white-mocha', 'White Chocolate Sauce', 30),
  ('white-mocha', 'Heavy Cream', 30),
  ('caramel-latte', 'Espresso Beans', 18),
  ('caramel-latte', 'Fresh Milk', 180),
  ('caramel-latte', 'Caramel Syrup', 20),
  ('caramel-latte', 'Caramel Sauce', 15),
  ('dark-mocha-latte', 'Espresso Beans', 18),
  ('dark-mocha-latte', 'Fresh Milk', 180),
  ('dark-mocha-latte', 'Dark Chocolate Sauce', 30),
  ('americano', 'Espresso Beans', 18),
  ('americano', 'Drinking Water', 200),
  ('latte', 'Espresso Beans', 18),
  ('latte', 'Fresh Milk', 200),
  ('cappuccino', 'Espresso Beans', 18),
  ('cappuccino', 'Fresh Milk', 180),
  ('matcha-latte', 'Matcha Powder', 5),
  ('matcha-latte', 'Fresh Milk', 200),
  ('matcha-latte', 'Simple Syrup', 15),
  ('dark-white-chocolate', 'Fresh Milk', 200),
  ('dark-white-chocolate', 'Dark Chocolate Sauce', 40),
  ('dark-white-chocolate', 'Heavy Cream', 30),
  ('dark-white-chocolate', 'Marshmallow', 10),
  ('lychee-fruit-tea', 'Black Tea Leaves', 5),
  ('lychee-fruit-tea', 'Lychee Syrup', 30),
  ('lychee-fruit-tea', 'Simple Syrup', 10),
  ('lychee-fruit-tea', 'Drinking Water', 180),
  ('lemon-fruit-tea', 'Black Tea Leaves', 5),
  ('lemon-fruit-tea', 'Lemon Syrup', 30),
  ('lemon-fruit-tea', 'Simple Syrup', 10),
  ('lemon-fruit-tea', 'Drinking Water', 180),
  ('iced-shaken-honey-citron-tea', 'Black Tea Leaves', 5),
  ('iced-shaken-honey-citron-tea', 'Honey Citron Jam', 30),
  ('iced-shaken-honey-citron-tea', 'Simple Syrup', 10),
  ('iced-shaken-honey-citron-tea', 'Drinking Water', 150),
  ('iced-shaken-honey-citron-tea', 'Ice', 150),
  ('pink-milk', 'Sala Syrup', 30),
  ('pink-milk', 'Condensed Milk', 30),
  ('pink-milk', 'Evaporated Milk', 150),
  ('pink-milk', 'Ice', 150),
  ('strawberry-milk', 'Fresh Milk', 180),
  ('strawberry-milk', 'Strawberry Puree', 40),
  ('strawberry-milk', 'Simple Syrup', 10),
  ('strawberry-milk', 'Ice', 150),
  ('thai-milktea', 'Thai Tea Leaves', 8),
  ('thai-milktea', 'Condensed Milk', 30),
  ('thai-milktea', 'Evaporated Milk', 150),
  ('thai-milktea', 'Ice', 150),

  -- Made-to-order meals use raw ingredients only.
  ('beef-tapa', 'Rice', 200),
  ('beef-tapa', 'Beef Tapa', 120),
  ('beef-tapa', 'Egg', 1),
  ('bangus', 'Bangus Fillet', 1),
  ('bangus', 'Rice', 200),
  ('bangus', 'Egg', 1),
  ('katsu-curry', 'Rice', 200),
  ('katsu-curry', 'Pork Katsu', 120),
  ('katsu-curry', 'Japanese Curry Sauce', 120),
  ('katsu-curry', 'Potato', 60),
  ('katsu-curry', 'Carrot', 40),
  ('corned-beef-spam', 'Rice', 200),
  ('corned-beef-spam', 'Corned Beef', 90),
  ('corned-beef-spam', 'Spam', 60),
  ('corned-beef-spam', 'Egg', 1),
  ('hungarian', 'Rice', 200),
  ('hungarian', 'Hungarian Sausage', 1),
  ('hungarian', 'Egg', 1),
  ('chicken-tenders', 'Chicken Tenders', 150),
  ('nuggets', 'Chicken Nuggets', 150),
  ('nuggets', 'Shoestring Fries', 120),
  ('potato-wedges', 'Potato Wedges', 200),
  ('potato-wedges', 'Ketchup', 30),
  ('potato-wedges', 'Mustard', 20),
  ('potato-wedges', 'Fries Seasoning', 3),
  ('classic-nachos', 'Nacho Chips', 120),
  ('classic-nachos', 'Cheese Sauce', 60),
  ('classic-nachos', 'Salsa', 60),

  -- Pasta. Pesto sauce is intentionally tracked in grams.
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
  ('mac-and-cheese', 'Toasted Loaf', 1),

  -- Add-on menu items are also made-to-order recipes.
  ('plain-rice', 'Rice', 200),
  ('scrambled-egg', 'Egg', 1),
  ('sunny-side-up-egg', 'Egg', 1),
  ('cheese-sauce', 'Cheese Sauce', 60),
  ('salsa', 'Salsa', 60);

update public.menu_items
set inventory_source = 'ingredients', updated_at = now()
where slug in (
  'earl-grey-oat-matcha-latte','hojicha-coconut-cloud','taho-latte','black-sesame-matcha-latte',
  'passion-fruit-yuzu-black-tea','biscoff-latte','maple-oat-latte','spanish-latte','seasalt-latte',
  'white-mocha','caramel-latte','dark-mocha-latte','americano','latte','cappuccino','matcha-latte',
  'dark-white-chocolate','lychee-fruit-tea','lemon-fruit-tea','iced-shaken-honey-citron-tea','pink-milk',
  'strawberry-milk','thai-milktea','beef-tapa','bangus','katsu-curry','corned-beef-spam','hungarian',
  'chicken-tenders','nuggets','potato-wedges','classic-nachos','alfredo','pesto','spicy-peanut',
  'mac-and-cheese','plain-rice','scrambled-egg','sunny-side-up-egg','cheese-sauce','salsa'
);

-- Ready-made cakes and cookies are not ingredients. They remain available
-- for product BOM linking; unlinked rows wait for staff to configure them.
update public.menu_items
set inventory_source = case
  when exists (
    select 1 from public.finished_product_sale_mappings mapping
    where mapping.menu_item_id = menu_items.id
  ) then 'products'
  else 'none'
end,
updated_at = now()
where slug in (
  'blueberry-cheesecake','matcha-cheesecake','leche-flan-cheesecake','basque-burnt-cheesecake',
  'biscoff-burnt-cheesecake','carrot-walnut-cake','red-velvet-cake','tiramisu',
  'chocolate-chip-cookie','red-velvet-cookie','biscoff-cookie','macadamia-cookie',
  'matcha-cookie','smores-cookie','walnut-cookie','bestseller-box','sampler-box-of-6'
);

insert into public.menu_item_ingredients (menu_item_id, ingredient_id, quantity_per_serving, unit)
select menu.id, ingredient.id, recipe.quantity, ingredient.unit
from tmp_basic_recipe_seed recipe
join public.menu_items menu on menu.slug = recipe.product_slug
join public.ingredients ingredient on lower(ingredient.name) = lower(recipe.ingredient_name)
where not exists (
  select 1 from public.menu_item_ingredients existing
  where existing.menu_item_id = menu.id and existing.ingredient_id = ingredient.id
);

drop table tmp_basic_recipe_seed;
drop table tmp_basic_ingredient_seed;

commit;

notify pgrst, 'reload schema';
