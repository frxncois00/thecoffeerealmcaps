-- User-requested fictional supplier assignments for the 63 ingredient catalog.
-- Contact numbers are placeholders; .example emails are non-deliverable.
-- The earliest admin owns seeded records because created_by is mandatory.
begin;
create temporary table supplier_assignment_seed(name text primary key, contact text) on commit drop;
insert into supplier_assignment_seed values
  ('Highland Brew Trading', 'Sample contact: 09XX-000-0001 | orders@highlandbrew.example'),
  ('Meadow Fresh Dairy Supply', 'Sample contact: 09XX-000-0002 | orders@meadowfresh.example'),
  ('Sweetcraft Café Essentials', 'Sample contact: 09XX-000-0003 | orders@sweetcraft.example'),
  ('Harvest Lane Produce', 'Sample contact: 09XX-000-0004 | orders@harvestlane.example'),
  ('Prime Chiller Foods', 'Sample contact: 09XX-000-0005 | orders@primechiller.example'),
  ('Pantry Basket Wholesale', 'Sample contact: 09XX-000-0006 | orders@pantrybasket.example'),
  ('Savory Kitchen Supply', 'Sample contact: 09XX-000-0007 | orders@savorykitchen.example'),
  ('ClearSpring Beverage Supply', 'Sample contact: 09XX-000-0008 | orders@clearspring.example');
create temporary table ingredient_assignment_seed(name text primary key, supplier_name text) on commit drop;
insert into ingredient_assignment_seed values
  ('Espresso Beans', 'Highland Brew Trading'),
  ('Black Tea Leaves', 'Highland Brew Trading'),
  ('Thai Tea Leaves', 'Highland Brew Trading'),
  ('Fresh Milk', 'Meadow Fresh Dairy Supply'),
  ('Oat Milk', 'Meadow Fresh Dairy Supply'),
  ('Soy Milk', 'Meadow Fresh Dairy Supply'),
  ('Evaporated Milk', 'Meadow Fresh Dairy Supply'),
  ('Condensed Milk', 'Meadow Fresh Dairy Supply'),
  ('Heavy Cream', 'Meadow Fresh Dairy Supply'),
  ('Matcha Powder', 'Highland Brew Trading'),
  ('Hojicha Powder', 'Highland Brew Trading'),
  ('Black Sesame Paste', 'Sweetcraft Café Essentials'),
  ('Cinnamon Powder', 'Pantry Basket Wholesale'),
  ('Biscoff Spread', 'Sweetcraft Café Essentials'),
  ('Honey Citron Jam', 'Sweetcraft Café Essentials'),
  ('Simple Syrup', 'Sweetcraft Café Essentials'),
  ('Earl Grey Syrup', 'Sweetcraft Café Essentials'),
  ('Maple Syrup', 'Sweetcraft Café Essentials'),
  ('Caramel Syrup', 'Sweetcraft Café Essentials'),
  ('Caramel Sauce', 'Sweetcraft Café Essentials'),
  ('Lychee Syrup', 'Sweetcraft Café Essentials'),
  ('Lemon Syrup', 'Sweetcraft Café Essentials'),
  ('Yuzu Syrup', 'Sweetcraft Café Essentials'),
  ('Sala Syrup', 'Sweetcraft Café Essentials'),
  ('Arnibal Syrup', 'Sweetcraft Café Essentials'),
  ('Dark Chocolate Sauce', 'Sweetcraft Café Essentials'),
  ('White Chocolate Sauce', 'Sweetcraft Café Essentials'),
  ('Strawberry Puree', 'Harvest Lane Produce'),
  ('Passion Fruit Puree', 'Harvest Lane Produce'),
  ('Coconut Water', 'ClearSpring Beverage Supply'),
  ('Drinking Water', 'ClearSpring Beverage Supply'),
  ('Ice', 'ClearSpring Beverage Supply'),
  ('Marshmallow', 'Sweetcraft Café Essentials'),
  ('Sago Pearls', 'Sweetcraft Café Essentials'),
  ('Rice', 'Pantry Basket Wholesale'),
  ('Egg', 'Prime Chiller Foods'),
  ('Beef Tapa', 'Prime Chiller Foods'),
  ('Bangus Fillet', 'Prime Chiller Foods'),
  ('Pork Katsu', 'Prime Chiller Foods'),
  ('Corned Beef', 'Prime Chiller Foods'),
  ('Spam', 'Prime Chiller Foods'),
  ('Hungarian Sausage', 'Prime Chiller Foods'),
  ('Chicken Tenders', 'Prime Chiller Foods'),
  ('Chicken Nuggets', 'Prime Chiller Foods'),
  ('Potato', 'Harvest Lane Produce'),
  ('Carrot', 'Harvest Lane Produce'),
  ('Shoestring Fries', 'Prime Chiller Foods'),
  ('Potato Wedges', 'Prime Chiller Foods'),
  ('Nacho Chips', 'Pantry Basket Wholesale'),
  ('Japanese Curry Sauce', 'Savory Kitchen Supply'),
  ('Cheese Sauce', 'Savory Kitchen Supply'),
  ('Salsa', 'Savory Kitchen Supply'),
  ('White Sauce', 'Savory Kitchen Supply'),
  ('Pesto Sauce', 'Savory Kitchen Supply'),
  ('Chili Peanut Sauce', 'Savory Kitchen Supply'),
  ('Ketchup', 'Savory Kitchen Supply'),
  ('Mustard', 'Savory Kitchen Supply'),
  ('Fries Seasoning', 'Pantry Basket Wholesale'),
  ('Fettuccine Pasta', 'Pantry Basket Wholesale'),
  ('Penne Pasta', 'Pantry Basket Wholesale'),
  ('Macaroni Pasta', 'Pantry Basket Wholesale'),
  ('Knife-cut Noodles', 'Pantry Basket Wholesale'),
  ('Toasted Loaf', 'Pantry Basket Wholesale');
do $$ begin
  if not exists (select 1 from public.profiles where role='admin') then
    raise exception 'An admin profile is required to own the sample suppliers';
  end if;
  if (select count(*) from public.ingredients i join ingredient_assignment_seed a on lower(i.name)=lower(a.name) where not i.is_archived) <> 63 then
    raise exception 'Expected exactly 63 active matching ingredients; review catalog before assigning';
  end if;
end $$;
insert into public.suppliers(name,contact,created_by)
select s.name,s.contact,(select id from public.profiles where role='admin' order by created_at,id limit 1)
from supplier_assignment_seed s
on conflict(name) do update set contact=excluded.contact,updated_at=now();

-- Replace the targeted ingredients' supplier links, including old default links.
-- Product links, supplier records, and historical PO snapshots are preserved.
delete from public.supplier_items si
using public.ingredients i, ingredient_assignment_seed a
where si.item_type='ingredient' and si.ingredient_id=i.id
  and not i.is_archived and lower(i.name)=lower(a.name);
insert into public.supplier_items(supplier_id,item_type,ingredient_id)
select s.id,'ingredient',i.id
from ingredient_assignment_seed a
join public.ingredients i on lower(i.name)=lower(a.name) and not i.is_archived
join public.suppliers s on s.name=a.supplier_name;
update public.ingredients i set supplier=a.supplier_name
from ingredient_assignment_seed a
where lower(i.name)=lower(a.name) and not i.is_archived;

do $$ begin
  if (select count(*) from public.supplier_items si
      join public.ingredients i on i.id=si.ingredient_id and not i.is_archived
      join ingredient_assignment_seed a on lower(a.name)=lower(i.name)
      join public.suppliers s on s.id=si.supplier_id and s.name=a.supplier_name
      where si.item_type='ingredient' and i.supplier=s.name) <> 63 then
    raise exception 'Ingredient supplier assignment verification failed';
  end if;
end $$;
commit;
