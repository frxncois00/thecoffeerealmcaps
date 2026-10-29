begin;

-- Use recorded inventory cost where possible. The remaining values are editable
-- starter estimates per inventory unit, not quotes from the fictional suppliers.
update public.supplier_items si
set unit_price = greatest(round(coalesce(nullif(i.cost_per_unit, 0), seed.price,
  case when lower(i.unit) in ('gram','g') then 0.2000
       when lower(i.unit) in ('milliliter','ml') then 0.1500
       else 25.0000 end), 4), 0.0001)
from public.ingredients i
left join (values
  ('Espresso Beans', 0.7500), ('Black Tea Leaves', 0.3500), ('Thai Tea Leaves', 0.3000),
  ('Fresh Milk', 0.1200), ('Oat Milk', 0.1800), ('Soy Milk', 0.1500),
  ('Evaporated Milk', 0.1700), ('Condensed Milk', 0.1600), ('Heavy Cream', 0.3000),
  ('Matcha Powder', 2.5000), ('Hojicha Powder', 1.8000),
  ('Black Sesame Paste', 0.6500), ('Cinnamon Powder', 0.8000),
  ('Biscoff Spread', 0.7500), ('Honey Citron Jam', 0.4500),
  ('Simple Syrup', 0.0800), ('Earl Grey Syrup', 0.2500),
  ('Maple Syrup', 0.4500), ('Caramel Syrup', 0.2000),
  ('Caramel Sauce', 0.2500), ('Lychee Syrup', 0.2200),
  ('Lemon Syrup', 0.1800), ('Yuzu Syrup', 0.4500),
  ('Sala Syrup', 0.2000), ('Arnibal Syrup', 0.1200),
  ('Dark Chocolate Sauce', 0.3500), ('White Chocolate Sauce', 0.3500),
  ('Strawberry Puree', 0.3800), ('Passion Fruit Puree', 0.4500),
  ('Coconut Water', 0.0700), ('Drinking Water', 0.0200), ('Ice', 0.0300),
  ('Marshmallow', 0.3200), ('Sago Pearls', 0.1000),
  ('Rice', 0.0500), ('Egg', 9.2500),
  ('Beef Tapa', 0.5500), ('Bangus Fillet', 85.0000),
  ('Pork Katsu', 0.4500), ('Corned Beef', 0.4000),
  ('Spam', 0.6500), ('Hungarian Sausage', 35.0000),
  ('Chicken Tenders', 0.3500), ('Chicken Nuggets', 0.2800),
  ('Potato', 0.1200), ('Carrot', 0.1100),
  ('Shoestring Fries', 0.1800), ('Potato Wedges', 0.1600),
  ('Nacho Chips', 0.2400),
  ('Japanese Curry Sauce', 0.2500), ('Cheese Sauce', 0.3500),
  ('Salsa', 0.2400), ('White Sauce', 0.2000),
  ('Pesto Sauce', 0.5500), ('Chili Peanut Sauce', 0.2600),
  ('Ketchup', 0.1600), ('Mustard', 0.2500),
  ('Fries Seasoning', 0.6500), ('Fettuccine Pasta', 0.1200),
  ('Penne Pasta', 0.1200), ('Macaroni Pasta', 0.1200),
  ('Knife-cut Noodles', 0.1300), ('Toasted Loaf', 18.0000)
) as seed(name, price) on lower(seed.name) = lower(i.name)
where si.item_type = 'ingredient' and si.ingredient_id = i.id and si.unit_price is null;

update public.supplier_items si
set unit_price = greatest(round(coalesce(nullif(p.cost_per_unit, 0), 60.0000), 4), 0.0001)
from public.finished_products p
where si.item_type = 'finished_product' and si.finished_product_id = p.id and si.unit_price is null;

alter table public.supplier_items alter column unit_price set not null;

create or replace function public.save_supplier(p_name text, p_contact text, p_items jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_line jsonb; v_type text; v_item_id uuid; v_price numeric;
begin
  perform public.assert_purchase_order_access(false);
  if nullif(btrim(coalesce(p_name,'')), '') is null then raise exception 'Supplier name is required'; end if;
  insert into public.suppliers(name,contact,created_by)
  values(btrim(p_name),nullif(btrim(coalesce(p_contact,'')),''),auth.uid())
  on conflict(name) do update set contact=excluded.contact,updated_at=now()
  returning id into v_id;
  delete from public.supplier_items where supplier_id=v_id;
  for v_line in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    v_type := v_line->>'item_type';
    v_item_id := nullif(v_line->>'item_id','')::uuid;
    v_price := nullif(v_line->>'unit_price','')::numeric;
    if v_type not in ('ingredient','finished_product') or v_item_id is null then raise exception 'Invalid supplier item'; end if;
    if v_price is null or v_price <= 0 then raise exception 'A positive unit price is required for every linked item'; end if;
    insert into public.supplier_items(supplier_id,item_type,ingredient_id,finished_product_id,unit_price)
    values(v_id,v_type,case when v_type='ingredient' then v_item_id end,
      case when v_type='finished_product' then v_item_id end,v_price);
  end loop;
  return v_id;
end;
$$;

-- New PO lines snapshot the supplier's current rate. Historical lines remain unchanged.
create or replace function public.apply_supplier_purchase_price()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_supplier_id uuid; v_price numeric;
begin
  select s.id into v_supplier_id
  from public.suppliers s
  join public.purchase_orders po on po.supplier_name = s.name
  where po.id = new.purchase_order_id;
  if v_supplier_id is not null then
    select si.unit_price into v_price
    from public.supplier_items si
    where si.supplier_id = v_supplier_id and si.item_type = new.item_type
      and ((new.item_type = 'ingredient' and si.ingredient_id = new.ingredient_id)
        or (new.item_type = 'finished_product' and si.finished_product_id = new.finished_product_id));
    if v_price is null then raise exception 'Selected item has no price for this supplier'; end if;
    new.estimated_unit_cost := v_price;
  end if;
  return new;
end;
$$;

drop trigger if exists apply_supplier_purchase_price on public.purchase_order_items;
create trigger apply_supplier_purchase_price
before insert on public.purchase_order_items
for each row execute function public.apply_supplier_purchase_price();

notify pgrst, 'reload schema';
commit;
