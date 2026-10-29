begin;

-- Fill only untouched stock thresholds. Never change counted quantity or
-- thresholds that staff have already customized.
create temporary table desired_inventory_thresholds on commit drop as
select i.id,
    case
      when lower(i.name) ~ 'bread|loaf|bun|croissant' then
        case when lower(i.unit) in ('gram','g') then 600 when lower(i.unit) in ('kilogram','kg') then 0.6 else 6 end
      when lower(i.name) ~ 'cheese' then
        case when lower(i.unit) in ('gram','g','milliliter','ml') then 500
             when lower(i.unit) in ('kilogram','kg','liter','l') then 0.5 else 4 end
      when lower(i.name) ~ 'chicken' then
        case when lower(i.unit) in ('gram','g') then 1000 when lower(i.unit) in ('kilogram','kg') then 1 else 8 end
      when lower(i.unit) in ('piece','pieces','pc','pcs') then 5
      when lower(i.unit) in ('kilogram','kg','liter','l') then 0.5
      when lower(i.category) ~ 'coffee|tea|powder|seasoning' then 125
      else 500
    end as low_point,
    case
      when lower(i.name) ~ 'bread|loaf|bun|croissant' then
        case when lower(i.unit) in ('gram','g') then 2400 when lower(i.unit) in ('kilogram','kg') then 2.4 else 24 end
      when lower(i.name) ~ 'cheese' then
        case when lower(i.unit) in ('gram','g','milliliter','ml') then 2000
             when lower(i.unit) in ('kilogram','kg','liter','l') then 2 else 16 end
      when lower(i.name) ~ 'chicken' then
        case when lower(i.unit) in ('gram','g') then 4000 when lower(i.unit) in ('kilogram','kg') then 4 else 32 end
      when lower(i.unit) in ('piece','pieces','pc','pcs') then 20
      when lower(i.unit) in ('kilogram','kg','liter','l') then 2
      when lower(i.category) ~ 'coffee|tea|powder|seasoning' then 500
      else 2000
    end as healthy_point
from public.ingredients i
where not i.is_archived;

update public.inventory_stock stock
set min_stock_level = d.low_point, high_stock_level = d.healthy_point, updated_at = now()
from desired_inventory_thresholds d
where stock.ingredient_id = d.id
  and ((stock.min_stock_level = 0 and stock.high_stock_level = 0)
    or (stock.min_stock_level = 10 and stock.high_stock_level in (100, 500)));

-- A missing stock row is treated as zero stock, not an invented opening count.
insert into public.inventory_stock(ingredient_id, quantity, min_stock_level, high_stock_level)
select d.id, 0, d.low_point, d.healthy_point
from desired_inventory_thresholds d
where not exists (select 1 from public.inventory_stock stock where stock.ingredient_id = d.id);

-- Replace only the earlier generic starter rate for Bread/Cheese/Chicken.
-- Recorded inventory costs and manually changed supplier prices take priority.
update public.supplier_items si
set unit_price = case
  when lower(i.name) ~ 'bread|loaf|bun|croissant' then
    case when lower(i.unit) in ('gram','g') then 0.1800 when lower(i.unit) in ('kilogram','kg') then 180.0000 else 18.0000 end
  when lower(i.name) ~ 'cheese' then
    case when lower(i.unit) in ('gram','g','milliliter','ml') then 0.3500
         when lower(i.unit) in ('kilogram','kg','liter','l') then 350.0000 else 25.0000 end
  when lower(i.name) ~ 'chicken' then
    case when lower(i.unit) in ('gram','g') then 0.2500 when lower(i.unit) in ('kilogram','kg') then 250.0000 else 85.0000 end
end
from public.ingredients i
where si.item_type = 'ingredient' and si.ingredient_id = i.id and not i.is_archived
  and lower(i.name) ~ 'bread|loaf|bun|croissant|cheese|chicken'
  and nullif(i.cost_per_unit, 0) is null
  and si.unit_price = case
    when lower(i.unit) in ('gram','g') then 0.2000
    when lower(i.unit) in ('milliliter','ml') then 0.1500
    else 25.0000
  end;

-- Existing supplier links (including staff-entered prices) are authoritative.
-- For unlinked items, honor an existing named supplier before classifying by
-- ingredient name/category. The final fallback creates a general supplier.
create temporary table missing_ingredient_suppliers on commit drop as
select i.id, i.name, i.category, i.unit,
  case
    when nullif(btrim(i.supplier), '') is not null
      and lower(btrim(i.supplier)) not in ('other','unassigned','unassigned supplier')
      then coalesce((select s.name from public.suppliers s where lower(s.name) = lower(btrim(i.supplier)) order by s.id limit 1), btrim(i.supplier))
    when lower(i.name) ~ 'sauce|salsa|pesto|ketchup|mustard' then 'Savory Kitchen Supply'
    when lower(i.name) ~ 'bread|loaf|bun|croissant' then 'Pantry Basket Wholesale'
    when lower(i.name) ~ 'cheese|milk|cream|yogurt|butter' then 'Meadow Fresh Dairy Supply'
    when lower(i.name) ~ 'chicken|nugget|tender|beef|pork|fish|bangus|sausage|egg|spam' then 'Prime Chiller Foods'
    when lower(i.name) ~ 'carrot|potato|fruit|berry|banana|mango|lemon|onion|tomato' then 'Harvest Lane Produce'
    when lower(i.name) ~ 'coffee|espresso|tea|matcha|hojicha' then 'Highland Brew Trading'
    when lower(i.name) ~ 'water|ice|beverage' then 'ClearSpring Beverage Supply'
    when lower(i.name) ~ 'syrup|spread|jam|chocolate|topping' then 'Sweetcraft Café Essentials'
    when lower(coalesce(i.category,'')) ~ 'bakery|bread|grain|pasta|dry goods' then 'Pantry Basket Wholesale'
    when lower(coalesce(i.category,'')) ~ 'dairy|cheese' then 'Meadow Fresh Dairy Supply'
    when lower(coalesce(i.category,'')) ~ 'protein|meat|poultry|seafood|frozen' then 'Prime Chiller Foods'
    when lower(coalesce(i.category,'')) ~ 'produce|fruit|vegetable' then 'Harvest Lane Produce'
    when lower(coalesce(i.category,'')) ~ 'sauce|condiment' then 'Savory Kitchen Supply'
    when lower(coalesce(i.category,'')) ~ 'coffee|tea|powder' then 'Highland Brew Trading'
    when lower(coalesce(i.category,'')) ~ 'beverage|water' then 'ClearSpring Beverage Supply'
    when lower(coalesce(i.category,'')) ~ 'syrup|spread|topping' then 'Sweetcraft Café Essentials'
    else 'General Inventory Supply'
  end as supplier_name,
  greatest(round(coalesce(nullif(i.cost_per_unit, 0),
    case
      when lower(i.name) ~ 'bread|loaf|bun|croissant' then
        case when lower(i.unit) in ('gram','g') then 0.1800 when lower(i.unit) in ('kilogram','kg') then 180.0000 else 18.0000 end
      when lower(i.name) ~ 'cheese' then
        case when lower(i.unit) in ('gram','g','milliliter','ml') then 0.3500
             when lower(i.unit) in ('kilogram','kg','liter','l') then 350.0000 else 25.0000 end
      when lower(i.name) ~ 'chicken' then
        case when lower(i.unit) in ('gram','g') then 0.2500 when lower(i.unit) in ('kilogram','kg') then 250.0000 else 85.0000 end
      when lower(i.unit) in ('gram','g') then
        case when lower(coalesce(i.category,'')) ~ 'protein|meat|poultry' then 0.3000
             when lower(coalesce(i.category,'')) ~ 'seasoning|powder' then 0.6000
             when lower(coalesce(i.category,'')) ~ 'produce|vegetable' then 0.1200 else 0.2000 end
      when lower(i.unit) in ('kilogram','kg') then
        case when lower(coalesce(i.category,'')) ~ 'protein|meat|poultry' then 300.0000
             when lower(coalesce(i.category,'')) ~ 'produce|vegetable' then 120.0000 else 200.0000 end
      when lower(i.unit) in ('milliliter','ml') then
        case when lower(coalesce(i.category,'')) ~ 'dairy' then 0.1200
             when lower(coalesce(i.category,'')) ~ 'beverage|water' then 0.0300 else 0.1500 end
      when lower(i.unit) in ('liter','l') then
        case when lower(coalesce(i.category,'')) ~ 'dairy' then 120.0000
             when lower(coalesce(i.category,'')) ~ 'beverage|water' then 30.0000 else 150.0000 end
      when lower(coalesce(i.category,'')) ~ 'bakery|bread' then 18.0000
      else 25.0000
    end), 4), 0.0001) as unit_price
from public.ingredients i
where not i.is_archived
  and not exists (
    select 1 from public.supplier_items si
    where si.item_type = 'ingredient' and si.ingredient_id = i.id
  );

do $$ begin
  if exists (select 1 from missing_ingredient_suppliers)
    and not exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'An admin profile is required to own new supplier records';
  end if;
end $$;

insert into public.suppliers(name, contact, created_by)
select distinct m.supplier_name, null,
  (select p.id from public.profiles p where p.role = 'admin' order by p.created_at, p.id limit 1)
from missing_ingredient_suppliers m
where not exists (select 1 from public.suppliers s where s.name = m.supplier_name)
on conflict(name) do nothing;

insert into public.supplier_items(supplier_id, item_type, ingredient_id, unit_price)
select s.id, 'ingredient', m.id, m.unit_price
from missing_ingredient_suppliers m
join public.suppliers s on s.name = m.supplier_name
where not exists (
  select 1 from public.supplier_items si
  where si.item_type = 'ingredient' and si.ingredient_id = m.id
);

update public.ingredients i
set supplier = m.supplier_name
from missing_ingredient_suppliers m
where i.id = m.id;

with singly_linked as (
  select si.ingredient_id, min(s.name) as supplier_name
  from public.supplier_items si
  join public.suppliers s on s.id = si.supplier_id
  where si.item_type = 'ingredient'
  group by si.ingredient_id
  having count(distinct si.supplier_id) = 1
)
update public.ingredients i
set supplier = linked.supplier_name
from singly_linked linked
where i.id = linked.ingredient_id and not i.is_archived
  and (nullif(btrim(i.supplier), '') is null
    or lower(btrim(i.supplier)) in ('other','unassigned','unassigned supplier'));

do $$ begin
  if exists (
    select 1 from missing_ingredient_suppliers m
    where not exists (
      select 1 from public.supplier_items si
      where si.item_type = 'ingredient' and si.ingredient_id = m.id and si.unit_price > 0
    )
  ) then raise exception 'A remaining ingredient has no priced supplier link'; end if;
end $$;

commit;
