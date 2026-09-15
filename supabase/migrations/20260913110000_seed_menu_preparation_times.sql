-- Set preparation guidance only for items that do not have a value yet.
-- The minimum of each range is stored because the order queue sorts by the
-- lowest preparation time; staff can still edit each item in Manage Menu.
with item_context as (
  select
    m.id,
    lower(
      coalesce(c.name, '') || ' ' ||
      coalesce(sc.name, '') || ' ' ||
      coalesce(m.item_type, '')
    ) as search_text
  from public.menu_items m
  left join public.main_categories c on c.id = m.main_category_id
  left join public.subcategories sc on sc.id = m.subcategory_id
  where m.prep_time_minutes is null
)
update public.menu_items m
set prep_time_minutes = case
  when item_context.search_text ~ 'cookie|cake|add.?on|ready.?made' then 3
  when item_context.search_text ~ 'snack' then 10
  when item_context.search_text ~ 'meal|pasta' then 15
  when item_context.search_text ~ 'drink|coffee|beverage' then 8
  else m.prep_time_minutes
end
from item_context
where item_context.id = m.id
  and m.prep_time_minutes is null;
