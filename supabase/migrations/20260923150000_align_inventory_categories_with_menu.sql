-- Inventory product categories mirror their linked menu subcategories.
-- Operational wording such as "Ready-made" does not belong in Category.

begin;

with linked_categories as (
  select mapping.finished_product_id as product_id,
    case
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%cookie%' then 'Cookies'
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%bread%' then 'Breads'
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%cake%' then 'Cakes'
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%sandwich%' then 'Sandwiches'
      else null
    end as category_name
  from public.finished_product_sale_mappings mapping
  join public.menu_items menu on menu.id = mapping.menu_item_id
  join public.subcategories subcategory on subcategory.id = menu.subcategory_id

  union all

  select product.id,
    case
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%cookie%' then 'Cookies'
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%bread%' then 'Breads'
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%cake%' then 'Cakes'
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%sandwich%' then 'Sandwiches'
      else null
    end
  from public.finished_products product
  join public.menu_items menu on menu.id = product.menu_item_id
  join public.subcategories subcategory on subcategory.id = menu.subcategory_id
), resolved as (
  select product_id, max(category_name) as category_name
  from linked_categories
  where category_name is not null
  group by product_id
)
update public.finished_products product
set category = resolved.category_name,
    updated_at = now()
from resolved
where product.id = resolved.product_id;

-- Cover older unlinked bakery records by their established inventory names.
update public.finished_products
set category = 'Breads', updated_at = now()
where lower(coalesce(category, '')) like '%bread%';

update public.finished_products
set category = 'Sandwiches', updated_at = now()
where lower(coalesce(category, '')) like '%sandwich%';

update public.finished_products
set category = 'Cakes', updated_at = now()
where lower(coalesce(category, '')) like '%ready%made%'
  and lower(name) ~ '(cake|cheesecake|tiramisu)';

update public.finished_products
set category = 'Cookies', updated_at = now()
where lower(coalesce(category, '')) like '%ready%made%'
  and lower(name) like '%cookie%';

update public.finished_products
set category = 'Sandwiches', updated_at = now()
where lower(coalesce(category, '')) like '%ready%made%'
  and lower(name) like '%sandwich%';

commit;

notify pgrst, 'reload schema';
