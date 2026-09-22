-- Split cake selling units into dedicated slice and whole-cake menu items.
-- Existing cake recipes represent one slice. Whole cakes consume eight slices.

begin;

-- Some databases already contain a manually-created Biscoff slice. Preserve it
-- as the canonical sellable item and archive the redundant legacy base record.
update public.menu_items legacy
set name = 'Legacy Biscoff Burnt Cheesecake ' || left(legacy.id::text, 8),
    is_archived = true,
    is_available = false,
    updated_at = now()
where legacy.slug = 'biscoff-burnt-cheesecake'
  and lower(legacy.name) <> 'biscoff burnt cheesecake / slice'
  and exists (
    select 1
    from public.menu_items existing
    where existing.id <> legacy.id
      and existing.subcategory_id = legacy.subcategory_id
      and lower(existing.name) = 'biscoff burnt cheesecake / slice'
  );

create temp table tmp_cake_source on commit drop as
with candidates as (
select
  m.*,
  case when lower(m.name) = 'biscoff burnt cheesecake / slice'
    then 'biscoff-burnt-cheesecake' else m.slug end as canonical_slug,
  row_number() over (
    partition by case when lower(m.name) = 'biscoff burnt cheesecake / slice'
      then 'biscoff-burnt-cheesecake' else m.slug end
    order by case when lower(m.name) = 'biscoff burnt cheesecake / slice' then 0 else 1 end, m.created_at
  ) as preference
from public.menu_items m
join public.subcategories cake_category on cake_category.id = m.subcategory_id
where cake_category.name = 'cakes'
  and not m.is_archived
  and (
    m.slug in (
      'blueberry-cheesecake','matcha-cheesecake','leche-flan-cheesecake',
      'basque-burnt-cheesecake','biscoff-burnt-cheesecake',
      'carrot-walnut-cake','red-velvet-cake','tiramisu'
    )
    or lower(m.name) = 'biscoff burnt cheesecake / slice'
  )
)
select
  m.id,
  m.canonical_slug as slug,
  m.main_category_id,
  m.subcategory_id,
  m.item_type,
  m.name,
  m.description,
  m.temperature_type,
  m.allow_addons,
  m.allow_sugar,
  m.allow_ice,
  m.image_url,
  m.is_available,
  m.is_archived,
  m.sort_order,
  coalesce(
    nullif(m.variant_options->'prices'->>'slice', '')::numeric,
    m.price,
    0
  )::numeric as slice_price,
  case m.slug
    when 'blueberry-cheesecake' then 1900
    when 'matcha-cheesecake' then 2100
    when 'leche-flan-cheesecake' then 2400
    when 'basque-burnt-cheesecake' then 2200
    when 'carrot-walnut-cake' then 2400
    when 'red-velvet-cake' then 2400
    when 'tiramisu' then 2700
    else null
  end::numeric as whole_price
from candidates m
where m.preference = 1;

create temp table tmp_cake_recipe on commit drop as
select r.menu_item_id, r.ingredient_id, r.quantity_per_serving, r.unit
from public.menu_item_ingredients r
join tmp_cake_source c on c.id = r.menu_item_id;

-- Remove the old slice/whole selector and make each original record a single unit.
-- Biscoff is intentionally slice-only.
update public.menu_items m
set
  name = case when c.slug = 'biscoff-burnt-cheesecake'
    then 'Biscoff Burnt Cheesecake / Slice'
    else 'Whole ' || c.name end,
  price = case when c.slug = 'biscoff-burnt-cheesecake'
    then c.slice_price else c.whole_price end,
  variant_options = '{}'::jsonb,
  updated_at = now()
from tmp_cake_source c
where m.id = c.id;

-- The original recipes now belong to whole cakes (except Biscoff). Rebuild them
-- from the captured slice recipe at the correct serving scale.
delete from public.menu_item_ingredients r
using tmp_cake_source c
where r.menu_item_id = c.id
  and c.slug <> 'biscoff-burnt-cheesecake';

insert into public.menu_item_ingredients (menu_item_id, ingredient_id, quantity_per_serving, unit)
select c.id, r.ingredient_id, r.quantity_per_serving * 8, r.unit
from tmp_cake_source c
join tmp_cake_recipe r on r.menu_item_id = c.id
where c.slug <> 'biscoff-burnt-cheesecake';

-- Add one dedicated slice record for each of the seven whole cakes.
insert into public.menu_items (
  main_category_id, subcategory_id, item_type, name, slug, description, price,
  temperature_type, allow_addons, allow_sugar, allow_ice, image_url,
  is_available, is_archived, sort_order, variant_options
)
select
  c.main_category_id,
  c.subcategory_id,
  c.item_type,
  c.name || ' / Slice',
  c.slug || '-slice',
  c.description,
  c.slice_price,
  c.temperature_type,
  false,
  false,
  false,
  c.image_url,
  c.is_available,
  c.is_archived,
  c.sort_order + 100,
  '{}'::jsonb
from tmp_cake_source c
where c.slug <> 'biscoff-burnt-cheesecake'
  and not exists (
    select 1 from public.menu_items existing where existing.slug = c.slug || '-slice'
  );

-- Re-running the migration remains safe: normalize any already-created slice rows.
update public.menu_items m
set
  name = c.name || ' / Slice',
  price = c.slice_price,
  variant_options = '{}'::jsonb,
  updated_at = now()
from tmp_cake_source c
where m.slug = c.slug || '-slice';

-- Slice BOMs use the captured one-slice quantities.
delete from public.menu_item_ingredients r
using tmp_cake_source c
join public.menu_items slice on slice.slug = c.slug || '-slice'
where r.menu_item_id = slice.id;

insert into public.menu_item_ingredients (menu_item_id, ingredient_id, quantity_per_serving, unit)
select slice.id, r.ingredient_id, r.quantity_per_serving, r.unit
from tmp_cake_source c
join public.menu_items slice on slice.slug = c.slug || '-slice'
join tmp_cake_recipe r on r.menu_item_id = c.id
where c.slug <> 'biscoff-burnt-cheesecake';

-- Cakes are ready-made inventory products. Stock is represented in slice units:
-- a slice sale consumes one unit, while a whole cake consumes eight.
create temp table tmp_cake_sales on commit drop as
select
  c.slug,
  c.name as base_name,
  c.id as whole_or_slice_id,
  c.id as slice_menu_item_id,
  1::numeric as units_per_sale
from tmp_cake_source c
where c.slug = 'biscoff-burnt-cheesecake'
union all
select c.slug, c.name, c.id, slice.id, 1::numeric
from tmp_cake_source c
join public.menu_items slice on slice.slug = c.slug || '-slice'
where c.slug <> 'biscoff-burnt-cheesecake'
union all
select c.slug, c.name, c.id, c.id, 8::numeric
from tmp_cake_source c
where c.slug <> 'biscoff-burnt-cheesecake';

insert into public.finished_products (
  name, category, unit, quantity, min_stock_level, high_stock_level, notes
)
select distinct
  sales.base_name || ' — ready-made stock',
  'Ready-made Cakes',
  'slice',
  0,
  0,
  100,
  'Cake inventory is tracked as individual slice units.'
from tmp_cake_sales sales
where not exists (
  select 1 from public.finished_products product
  where lower(product.name) = lower(sales.base_name || ' — ready-made stock')
    and coalesce(product.category, '') = 'Ready-made Cakes'
);

delete from public.finished_product_sale_mappings mapping
using tmp_cake_sales sales
where mapping.menu_item_id = sales.slice_menu_item_id;

insert into public.finished_product_sale_mappings (
  finished_product_id, menu_item_id, variant_key, units_per_sale
)
select product.id, sales.slice_menu_item_id, null, sales.units_per_sale
from tmp_cake_sales sales
join public.finished_products product
  on lower(product.name) = lower(sales.base_name || ' — ready-made stock')
 and coalesce(product.category, '') = 'Ready-made Cakes'
 and not product.is_archived;

update public.menu_items item
set inventory_source = 'products', updated_at = now()
from tmp_cake_sales sales
where item.id = sales.slice_menu_item_id;

commit;

notify pgrst, 'reload schema';
