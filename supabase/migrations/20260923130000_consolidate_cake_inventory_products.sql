-- The menu has two sellable records per cake, but inventory keeps one product.
-- Consolidate migration-created "ready-made stock" duplicates into the original
-- Bakery - Ready Made products, then link both menu records to that survivor.

begin;

create temp table tmp_cake_targets (
  slug text primary key,
  inventory_name text not null,
  name_prefix text not null
) on commit drop;

insert into tmp_cake_targets (slug, inventory_name, name_prefix) values
  ('blueberry-cheesecake', 'Blueberry Cheesecake', 'blueberry cheesecake'),
  ('matcha-cheesecake', 'Matcha Cheesecake', 'matcha cheesecake'),
  ('leche-flan-cheesecake', 'Leche Flan Cheesecake', 'leche flan cheesecake'),
  ('basque-burnt-cheesecake', 'Basque Burnt Cheesecake', 'basque burnt cheesecake'),
  ('biscoff-burnt-cheesecake', 'Biscoff Burnt Cheesecake', 'biscoff burnt cheesecake'),
  ('carrot-walnut-cake', 'Carrot Walnut Cake', 'carrot walnut cake'),
  ('red-velvet-cake', 'Red Velvet Cake', 'red velvet cake'),
  ('tiramisu', 'Tiramisu Cake', 'tiramisu');

create temp table tmp_cake_survivors on commit drop as
select target.*,
  coalesce(
    (
      select product.id
      from public.finished_products product
      where lower(product.name) = lower(target.inventory_name)
      order by
        case when product.category = 'Bakery - Ready Made' then 0 else 1 end,
        product.is_archived,
        product.updated_at
      limit 1
    ),
    (
      select product.id
      from public.finished_products product
      where lower(product.name) like target.name_prefix || '%'
        and product.category = 'Ready-made Cakes'
      order by product.is_archived, product.updated_at
      limit 1
    )
  ) as product_id
from tmp_cake_targets target;

insert into public.finished_products (
  name, category, unit, quantity, min_stock_level, high_stock_level, notes
)
select survivor.inventory_name, 'Bakery - Ready Made', 'slice', 0, 0, 100,
  'One inventory product supplies both the whole-cake and slice menu items.'
from tmp_cake_survivors survivor
where survivor.product_id is null;

update tmp_cake_survivors survivor
set product_id = product.id
from public.finished_products product
where survivor.product_id is null
  and lower(product.name) = lower(survivor.inventory_name)
  and product.category = 'Bakery - Ready Made';

-- Normalize the single inventory-facing name. Portion labels stay in Manage Menu.
update public.finished_products product
set name = survivor.inventory_name,
    category = 'Bakery - Ready Made',
    unit = 'slice',
    is_archived = false,
    updated_at = now()
from tmp_cake_survivors survivor
where product.id = survivor.product_id;

create temp table tmp_cake_duplicates on commit drop as
select product.id as duplicate_id, survivor.product_id as survivor_id
from tmp_cake_survivors survivor
join public.finished_products product
  on product.id <> survivor.product_id
 and product.category = 'Ready-made Cakes'
 and lower(product.name) like survivor.name_prefix || '%'
where survivor.product_id is not null;

-- Preserve quantities and useful thresholds before removing generated duplicates.
update public.finished_products survivor
set quantity = survivor.quantity + totals.quantity,
    min_stock_level = greatest(survivor.min_stock_level, totals.min_stock_level),
    high_stock_level = greatest(survivor.high_stock_level, totals.high_stock_level),
    updated_at = now()
from (
  select duplicates.survivor_id,
    coalesce(sum(product.quantity), 0) as quantity,
    coalesce(max(product.min_stock_level), 0) as min_stock_level,
    coalesce(max(product.high_stock_level), 0) as high_stock_level
  from tmp_cake_duplicates duplicates
  join public.finished_products product on product.id = duplicates.duplicate_id
  group by duplicates.survivor_id
) totals
where survivor.id = totals.survivor_id;

update public.finished_product_movements movement
set finished_product_id = duplicates.survivor_id
from tmp_cake_duplicates duplicates
where movement.finished_product_id = duplicates.duplicate_id;

update public.purchase_order_items item
set finished_product_id = duplicates.survivor_id
from tmp_cake_duplicates duplicates
where item.finished_product_id = duplicates.duplicate_id;

delete from public.supplier_items duplicate_link
using tmp_cake_duplicates duplicates
where duplicate_link.finished_product_id = duplicates.duplicate_id
  and exists (
    select 1 from public.supplier_items survivor_link
    where survivor_link.supplier_id = duplicate_link.supplier_id
      and survivor_link.finished_product_id = duplicates.survivor_id
  );

update public.supplier_items supplier_link
set finished_product_id = duplicates.survivor_id
from tmp_cake_duplicates duplicates
where supplier_link.finished_product_id = duplicates.duplicate_id;

delete from public.order_inventory_deductions duplicate_deduction
using tmp_cake_duplicates duplicates
where duplicate_deduction.finished_product_id = duplicates.duplicate_id
  and exists (
    select 1 from public.order_inventory_deductions survivor_deduction
    where survivor_deduction.order_item_id = duplicate_deduction.order_item_id
      and survivor_deduction.finished_product_id = duplicates.survivor_id
  );

update public.order_inventory_deductions deduction
set finished_product_id = duplicates.survivor_id
from tmp_cake_duplicates duplicates
where deduction.finished_product_id = duplicates.duplicate_id;

-- Pending menu approvals may still carry a generated duplicate product ID.
-- Point those payloads to the surviving inventory product before deletion.
update public.menu_change_approvals approval
set payload = jsonb_set(
  approval.payload,
  '{products}',
  coalesce((
    select jsonb_agg(
      case when duplicates.survivor_id is null then product_link
        else jsonb_set(product_link, '{finished_product_id}', to_jsonb(duplicates.survivor_id::text), true)
      end
    )
    from jsonb_array_elements(approval.payload->'products') product_link
    left join tmp_cake_duplicates duplicates
      on duplicates.duplicate_id::text = product_link->>'finished_product_id'
  ), '[]'::jsonb),
  true
)
where approval.state = 'pending'
  and jsonb_typeof(approval.payload->'products') = 'array';

update public.menu_change_approvals approval
set payload = jsonb_set(
  approval.payload,
  '{productBom}',
  coalesce((
    select jsonb_agg(
      case when duplicates.survivor_id is null then product_link
        else jsonb_set(product_link, '{productId}', to_jsonb(duplicates.survivor_id::text), true)
      end
    )
    from jsonb_array_elements(approval.payload->'productBom') product_link
    left join tmp_cake_duplicates duplicates
      on duplicates.duplicate_id::text = product_link->>'productId'
  ), '[]'::jsonb),
  true
)
where approval.state = 'pending'
  and jsonb_typeof(approval.payload->'productBom') = 'array';

-- Rebuild the cake links: slice consumes 1 stock unit, whole consumes 8.
delete from public.finished_product_sale_mappings mapping
using public.menu_items menu, tmp_cake_survivors survivor
where mapping.menu_item_id = menu.id
  and menu.slug in (survivor.slug, survivor.slug || '-slice');

insert into public.finished_product_sale_mappings
  (finished_product_id, menu_item_id, variant_key, units_per_sale)
select survivor.product_id, menu.id, null,
  case when menu.slug = survivor.slug then 8 else 1 end
from tmp_cake_survivors survivor
join public.menu_items menu
  on menu.slug in (survivor.slug, survivor.slug || '-slice')
 and not menu.is_archived
where survivor.product_id is not null;

update public.menu_items menu
set inventory_source = 'products', updated_at = now()
from tmp_cake_survivors survivor
where menu.slug in (survivor.slug, survivor.slug || '-slice')
  and not menu.is_archived;

-- All references have been transferred; remove only the generated duplicates.
delete from public.finished_products product
using tmp_cake_duplicates duplicates
where product.id = duplicates.duplicate_id;

commit;

notify pgrst, 'reload schema';
