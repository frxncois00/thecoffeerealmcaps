-- Ready-made breads and sandwiches are tracked as finished inventory products.
-- Each menu sale consumes one stocked piece.

begin;

with ready_made_items as (
  select item.id, item.name
  from public.menu_items item
  join public.subcategories subcategory on subcategory.id = item.subcategory_id
  where not item.is_archived
    and (
      lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%bread%'
      or lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%sandwich%'
      or lower(coalesce(item.name, '')) like '%sandwich%'
    )
)
insert into public.finished_products (menu_item_id, name, category, unit, quantity, min_stock_level, high_stock_level, notes)
select item.id, item.name, 'Ready-made', 'piece', 0, 0, 0,
       'Inventory product linked to the ready-made menu item.'
from ready_made_items item
where not exists (
  select 1 from public.finished_products product
  where product.menu_item_id = item.id
     or (lower(product.name) = lower(item.name) and lower(coalesce(product.category, '')) = 'ready-made')
);

update public.menu_items item
set inventory_source = 'products', updated_at = now()
where item.id in (
  select menu.id
  from public.menu_items menu
  join public.subcategories subcategory on subcategory.id = menu.subcategory_id
  where not menu.is_archived
    and (
      lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%bread%'
      or lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%sandwich%'
      or lower(coalesce(menu.name, '')) like '%sandwich%'
    )
);

insert into public.finished_product_sale_mappings (finished_product_id, menu_item_id, units_per_sale)
select product.id, product.menu_item_id, 1
from public.finished_products product
join public.menu_items item on item.id = product.menu_item_id
where not product.is_archived
  and lower(coalesce(product.category, '')) = 'ready-made'
  and not exists (
    select 1 from public.finished_product_sale_mappings mapping
    where mapping.finished_product_id = product.id
      and mapping.menu_item_id = product.menu_item_id
      and mapping.variant_key is null
  );

commit;

notify pgrst, 'reload schema';
