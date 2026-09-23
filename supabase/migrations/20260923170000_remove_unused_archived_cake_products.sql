-- Permanently remove archived cake inventory products only when no operational
-- or historical record still references them.

begin;

delete from public.finished_products product
where product.is_archived
  and (
    lower(coalesce(product.category, '')) = 'cakes'
    or lower(coalesce(product.category, '')) like '%ready%made%'
  )
  and lower(product.name) ~ '(cake|cheesecake|tiramisu)'
  and product.menu_item_id is null
  and not exists (
    select 1 from public.finished_product_sale_mappings mapping
    where mapping.finished_product_id = product.id
  )
  and not exists (
    select 1 from public.finished_product_movements movement
    where movement.finished_product_id = product.id
  )
  and not exists (
    select 1 from public.order_inventory_deductions deduction
    where deduction.finished_product_id = product.id
  )
  and not exists (
    select 1 from public.purchase_order_items purchase_item
    where purchase_item.finished_product_id = product.id
  )
  and not exists (
    select 1 from public.supplier_items supplier_item
    where supplier_item.finished_product_id = product.id
  );

commit;

notify pgrst, 'reload schema';
