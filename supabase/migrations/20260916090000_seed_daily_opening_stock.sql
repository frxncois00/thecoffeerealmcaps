-- Seed a practical one-day opening stock baseline for the current ingredient catalog.
-- This updates quantities and replenishment thresholds only; it does not create
-- movement history because these values represent the starting stock count.

begin;

with desired(name, quantity, min_stock_level, high_stock_level) as (
  values
    ('Toasted Loaf', 12, 3, 12),
    ('Coconut Water', 3000, 750, 3000),
    ('Drinking Water', 12000, 3000, 12000),
    ('Ice', 15000, 4000, 15000),
    ('Espresso Beans', 1500, 400, 1500),
    ('Ketchup', 1000, 250, 1000),
    ('Mustard', 500, 125, 500),
    ('Condensed Milk', 2500, 600, 2500),
    ('Evaporated Milk', 4000, 1000, 4000),
    ('Fresh Milk', 10000, 2500, 10000),
    ('Heavy Cream', 2500, 600, 2500),
    ('Oat Milk', 5000, 1250, 5000),
    ('Soy Milk', 3000, 750, 3000),
    ('Fettuccine Pasta', 3000, 750, 3000),
    ('Knife-cut Noodles', 2000, 500, 2000),
    ('Macaroni Pasta', 2500, 600, 2500),
    ('Nacho Chips', 3000, 750, 3000),
    ('Penne Pasta', 2500, 600, 2500),
    ('Potato Wedges', 3000, 750, 3000),
    ('Shoestring Fries', 3000, 750, 3000),
    ('Passion Fruit Puree', 2500, 600, 2500),
    ('Strawberry Puree', 2500, 600, 2500),
    ('Rice', 12000, 3000, 12000),
    ('Hojicha Powder', 500, 125, 500),
    ('Matcha Powder', 500, 125, 500),
    ('Carrot', 2500, 600, 2500),
    ('Potato', 5000, 1250, 5000),
    ('Bangus Fillet', 15, 4, 15),
    ('Beef Tapa', 3000, 750, 3000),
    ('Chicken Nuggets', 3000, 750, 3000),
    ('Chicken Tenders', 4000, 1000, 4000),
    ('Corned Beef', 2500, 600, 2500),
    ('Egg', 36, 9, 36),
    ('Hungarian Sausage', 15, 4, 15),
    ('Pork Katsu', 3000, 750, 3000),
    ('Spam', 2000, 500, 2000),
    ('Caramel Sauce', 1500, 375, 1500),
    ('Cheese Sauce', 3000, 750, 3000),
    ('Chili Peanut Sauce', 2500, 600, 2500),
    ('Dark Chocolate Sauce', 1500, 375, 1500),
    ('Japanese Curry Sauce', 3000, 750, 3000),
    ('Pesto Sauce', 2500, 600, 2500),
    ('Salsa', 2500, 600, 2500),
    ('White Chocolate Sauce', 1500, 375, 1500),
    ('White Sauce', 3000, 750, 3000),
    ('Cinnamon Powder', 250, 60, 250),
    ('Fries Seasoning', 500, 125, 500),
    ('Biscoff Spread', 1500, 375, 1500),
    ('Black Sesame Paste', 1000, 250, 1000),
    ('Honey Citron Jam', 1500, 375, 1500),
    ('Arnibal Syrup', 2000, 500, 2000),
    ('Caramel Syrup', 2000, 500, 2000),
    ('Earl Grey Syrup', 2000, 500, 2000),
    ('Lemon Syrup', 2000, 500, 2000),
    ('Lychee Syrup', 2000, 500, 2000),
    ('Maple Syrup', 2000, 500, 2000),
    ('Sala Syrup', 2000, 500, 2000),
    ('Simple Syrup', 3000, 750, 3000),
    ('Yuzu Syrup', 2000, 500, 2000),
    ('Black Tea Leaves', 500, 125, 500),
    ('Thai Tea Leaves', 500, 125, 500),
    ('Marshmallow', 1000, 250, 1000),
    ('Sago Pearls', 1500, 375, 1500)
), updated as (
  update public.inventory_stock stock
  set
    quantity = desired.quantity,
    min_stock_level = desired.min_stock_level,
    high_stock_level = desired.high_stock_level,
    updated_at = now()
  from desired
  join public.ingredients ingredient on lower(ingredient.name) = lower(desired.name)
  where stock.ingredient_id = ingredient.id
  returning stock.ingredient_id
)
select count(*) as updated_rows from updated;

commit;
