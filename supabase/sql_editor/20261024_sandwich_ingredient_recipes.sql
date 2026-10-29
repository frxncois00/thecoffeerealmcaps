-- Approved sandwich recipes: direct catalog correction, no menu approval request.
-- New stock starts at zero; existing quantities and product history are preserved.
begin;

create temporary table sandwich_recipe_plan (
  menu_name text, ingredient_name text, quantity numeric, unit text, category text
) on commit drop;
insert into sandwich_recipe_plan values
 ('Chicken Sandwich','Bread',2,'slice','Bakery'),
 ('Chicken Sandwich','Chicken',80,'gram','Protein'),
 ('Chicken Sandwich','Mayonnaise',15,'gram','Condiment'),
 ('Chicken Sandwich','Lettuce',10,'gram','Produce'),
 ('Tuna Melt Sandwich','Bread',2,'slice','Bakery'),
 ('Tuna Melt Sandwich','Tuna',70,'gram','Protein'),
 ('Tuna Melt Sandwich','Mayonnaise',15,'gram','Condiment'),
 ('Tuna Melt Sandwich','Cheese',1,'slice','Dairy'),
 ('Bacon Egg and Cheese Sandwich','Bread',2,'slice','Bakery'),
 ('Bacon Egg and Cheese Sandwich','Bacon',50,'gram','Protein'),
 ('Bacon Egg and Cheese Sandwich','Egg',1,'piece','Protein'),
 ('Bacon Egg and Cheese Sandwich','Cheese',1,'slice','Dairy');

create temporary table sandwich_targets on commit drop as
 select id,name from public.menu_items
 where not is_archived and name in (select menu_name from sandwich_recipe_plan);

do $$ begin
 if (select count(*) from sandwich_targets) <> 3
    or (select count(distinct name) from sandwich_targets) <> 3 then
   raise exception 'Expected exactly the three approved sandwich menu items';
 end if;
 if exists (
   select 1 from public.finished_product_sale_mappings m
   join public.finished_products p on p.id=m.finished_product_id
   where p.menu_item_id in (select id from sandwich_targets)
     and m.menu_item_id not in (select id from sandwich_targets)
 ) then raise exception 'A sandwich product is shared with another menu item'; end if;
end $$;

insert into public.ingredients(name,unit,category,type,notes)
 select distinct r.ingredient_name,r.unit,r.category,'other',
   'Sandwich recipe ingredient. Enter actual stock before selling.'
 from sandwich_recipe_plan r
 where not exists (select 1 from public.ingredients i where lower(i.name)=lower(r.ingredient_name));

do $$ begin
 if exists (
   select r.ingredient_name from (select distinct ingredient_name,unit from sandwich_recipe_plan) r
   left join public.ingredients i on lower(i.name)=lower(r.ingredient_name) and not i.is_archived
   group by r.ingredient_name,r.unit
   having count(i.id)<>1 or min(i.unit)<>r.unit
 ) then raise exception 'Missing, ambiguous, archived, or incompatible ingredient unit'; end if;
end $$;

insert into public.inventory_stock(ingredient_id,quantity,min_stock_level,high_stock_level)
 select i.id,0,0,0 from public.ingredients i
 where i.name in (select ingredient_name from sandwich_recipe_plan)
   and not exists (select 1 from public.inventory_stock s where s.ingredient_id=i.id);

-- Remove stale recipes and old product deductions before installing the full recipes.
delete from public.menu_item_ingredients where menu_item_id in (select id from sandwich_targets);
delete from public.finished_product_sale_mappings where menu_item_id in (select id from sandwich_targets);
update public.menu_items set inventory_source='ingredients',updated_at=now()
 where id in (select id from sandwich_targets);
insert into public.menu_item_ingredients(menu_item_id,ingredient_id,quantity_per_serving,unit)
 select t.id,i.id,r.quantity,i.unit from sandwich_recipe_plan r
 join sandwich_targets t on t.name=r.menu_name
 join public.ingredients i on lower(i.name)=lower(r.ingredient_name) and not i.is_archived;

-- Archive instead of deleting product rows referenced by receipts and stock movements.
update public.finished_products set is_archived=true,updated_at=now()
 where menu_item_id in (select id from sandwich_targets);
select public.recompute_menu_item_availability(id) from sandwich_targets;

do $$ begin
 if (select count(*) from public.menu_item_ingredients where menu_item_id in (select id from sandwich_targets)) <> 12
 then raise exception 'Expected twelve ingredient recipe links'; end if;
 if exists(select 1 from public.finished_product_sale_mappings where menu_item_id in(select id from sandwich_targets))
 then raise exception 'A sandwich still has a product deduction link'; end if;
end $$;
commit;
