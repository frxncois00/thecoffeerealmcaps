-- Restore existing sandwich products that were hidden or archived.
-- This does not create a new item; it only makes existing sandwich records
-- available again in the customer catalog.
update public.menu_items item
set is_archived = false,
    is_available = true,
    manual_available = true,
    updated_at = now()
where (
  lower(coalesce(item.name, '')) like '%sandwich%'
  or exists (
    select 1
    from public.subcategories subcategory
    where subcategory.id = item.subcategory_id
      and lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%sandwich%'
  )
);
