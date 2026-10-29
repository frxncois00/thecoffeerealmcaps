-- Run in the project's Supabase SQL Editor after the sandwich recipe setup.
-- Adds stock for 25 sandwiches: 9 chicken, 8 tuna melt, 8 bacon/egg/cheese.
-- Assumes one sandwich per customer and the recipes currently in the database.
-- Existing stock is preserved. The unique movement reason prevents repeat adds.
begin;
select pg_advisory_xact_lock(hashtext('sandwich-stock-25-customers-20261025'));

create temporary table sandwich_stock_plan on commit drop as
select i.id as ingredient_id, i.name, i.unit,
       sum(r.quantity_per_serving * p.servings) as quantity
from (values ('Chicken Sandwich',9), ('Tuna Melt Sandwich',8),
             ('Bacon Egg and Cheese Sandwich',8)) p(name,servings)
join public.menu_items m on m.name=p.name and not m.is_archived
join public.menu_item_ingredients r on r.menu_item_id=m.id
join public.ingredients i on i.id=r.ingredient_id and not i.is_archived
group by i.id,i.name,i.unit;

do $$
declare
  v_reason constant text := 'Sandwich restock 20261025: 25 customers (9 chicken, 8 tuna melt, 8 bacon egg cheese)';
  v_row record;
begin
  if (select count(*) from sandwich_stock_plan) <> 8 or exists (
    select 1 from (values ('Bread','slice',50),('Chicken','gram',720),
      ('Mayonnaise','gram',255),('Lettuce','gram',90),('Tuna','gram',560),
      ('Cheese','slice',16),('Bacon','gram',400),('Egg','piece',8)) expected(name,unit,quantity)
    full join sandwich_stock_plan actual using(name)
    where actual.ingredient_id is null or expected.name is null
       or actual.unit is distinct from expected.unit
       or actual.quantity is distinct from expected.quantity
  ) then
    raise exception 'Recipes differ from the reviewed 25-customer plan; no stock added';
  end if;

  if exists(select 1 from public.inventory_movements where reason=v_reason) then
    if (select count(*) from public.inventory_movements where reason=v_reason) <> 8 then
      raise exception 'Partial prior restock detected; review movement history';
    end if;
    raise notice 'Restock already recorded; no additional stock added';
    return;
  end if;

  for v_row in select * from sandwich_stock_plan order by ingredient_id loop
    update public.inventory_stock
      set quantity=quantity+v_row.quantity, updated_at=now()
      where ingredient_id=v_row.ingredient_id;
    if not found then raise exception 'Missing stock record for %',v_row.name; end if;
    insert into public.inventory_movements
      (ingredient_id,movement_type,quantity,reason,created_by)
      values(v_row.ingredient_id,'restock',v_row.quantity,v_reason,auth.uid());
  end loop;
end $$;

select public.recompute_menu_item_availability(id)
from public.menu_items where not is_archived and name in
  ('Chicken Sandwich','Tuna Melt Sandwich','Bacon Egg and Cheese Sandwich');
select p.name,p.quantity as planned_addition,p.unit,s.quantity as current_stock
from sandwich_stock_plan p join public.inventory_stock s using(ingredient_id)
order by p.name;
commit;
