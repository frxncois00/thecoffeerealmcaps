-- Add the requested bakery items and apply the requested preparation and
-- Senior Citizen/PWD eligibility defaults to the active menu catalog.

begin;

-- The eligibility guard requires an administrator context. The migration runs
-- as the database owner, so use an existing active administrator only for the
-- duration of this transaction.
do $$
declare
  v_admin_id uuid;
  v_foods_id uuid;
  v_breads_id uuid;
begin
  select id into v_admin_id
  from public.profiles
  where public.normalize_role(role) = 'admin'
    and removed_at is null
  order by id
  limit 1;

  if v_admin_id is null then
    raise exception 'Cannot apply menu defaults without an active administrator';
  end if;

  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  select id into v_foods_id
  from public.main_categories
  where lower(name) = 'foods'
    and not coalesce(is_archived, false)
  order by sort_order, id
  limit 1;

  if v_foods_id is null then
    insert into public.main_categories (name, display_name, sort_order, is_active)
    values ('foods', 'Foods', 2, true)
    returning id into v_foods_id;
  end if;

  select id into v_breads_id
  from public.subcategories
  where main_category_id = v_foods_id
    and lower(name) = 'breads'
    and not coalesce(is_archived, false)
  order by sort_order, id
  limit 1;

  if v_breads_id is null then
    insert into public.subcategories (main_category_id, name, display_name, sort_order, is_active)
    values (v_foods_id, 'Breads', 'Breads', 0, true)
    returning id into v_breads_id;
  end if;
end;
$$;

with requested(name, slug, description, price, sort_order) as (
  values
    ('Cinnamon Roll', 'cinnamon-roll', 'Soft cinnamon-swirled roll topped with creamy icing', 145.00, 1),
    ('S’mores Bar', 'smores-bar', 'Sweet baked bar topped with chocolate, marshmallows, and graham crumbs', 100.00, 2),
    ('Biscoff Crookie', 'biscoff-crookie', 'Buttery pastry filled and topped with Biscoff cookie butter and cookie crumbs', 245.00, 3),
    ('Pistachio Crookie', 'pistachio-crookie', 'Buttery pastry filled and topped with pistachio cream and crushed pistachios', 310.00, 4)
)
update public.menu_items item
set main_category_id = foods.id,
    subcategory_id = breads.id,
    name = requested.name,
    description = requested.description,
    price = requested.price,
    item_type = 'food',
    temperature_type = 'none',
    prep_time_minutes = 5,
    sort_order = requested.sort_order,
    is_archived = false,
    updated_at = now()
from requested
join public.main_categories foods on lower(foods.name) = 'foods'
join public.subcategories breads on breads.main_category_id = foods.id and lower(breads.name) = 'breads'
where item.slug = requested.slug
   or (lower(item.name) = lower(requested.name) and item.subcategory_id = breads.id);

with requested(name, slug, description, price, sort_order) as (
  values
    ('Cinnamon Roll', 'cinnamon-roll', 'Soft cinnamon-swirled roll topped with creamy icing', 145.00, 1),
    ('S’mores Bar', 'smores-bar', 'Sweet baked bar topped with chocolate, marshmallows, and graham crumbs', 100.00, 2),
    ('Biscoff Crookie', 'biscoff-crookie', 'Buttery pastry filled and topped with Biscoff cookie butter and cookie crumbs', 245.00, 3),
    ('Pistachio Crookie', 'pistachio-crookie', 'Buttery pastry filled and topped with pistachio cream and crushed pistachios', 310.00, 4)
)
insert into public.menu_items (
  main_category_id, subcategory_id, item_type, name, slug, description, price,
  temperature_type, allow_addons, allow_sugar, allow_ice, image_url,
  manual_available, is_available, is_archived, is_featured, is_bestseller,
  prep_time_minutes, sort_order, variant_options, online_benefit_eligible
)
select foods.id, breads.id, 'food', requested.name, requested.slug, requested.description, requested.price,
  'none', false, false, false, null,
  true, true, false, false, false, 5, requested.sort_order, '{}'::jsonb, true
from requested
join public.main_categories foods on lower(foods.name) = 'foods'
join public.subcategories breads on breads.main_category_id = foods.id and lower(breads.name) = 'breads'
where not exists (
  select 1
  from public.menu_items existing
  where existing.slug = requested.slug
     or (lower(existing.name) = lower(requested.name) and existing.subcategory_id = breads.id)
);

-- Breads use five minutes and sandwich items use seven minutes. The sandwich
-- branch intentionally wins for a combined “Sandwiches & Breads” category.
update public.menu_items item
set prep_time_minutes = case
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%sandwich%' then 7
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%bread%' then 5
      else item.prep_time_minutes
    end,
    updated_at = now()
from public.subcategories subcategory
where subcategory.id = item.subcategory_id
  and not item.is_archived
  and (
    lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%sandwich%'
    or lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%bread%'
  );

-- Enable SC/PWD eligibility for all active items except cakes and the two
-- explicitly excluded boxes. Eligibility is applied to the item base price;
-- the existing checkout rules remain authoritative for the discount formula.
update public.menu_items item
set online_benefit_eligible = case
      when lower(coalesce(subcategory.name, '') || ' ' || coalesce(subcategory.display_name, '')) like '%cake%' then false
      when regexp_replace(lower(coalesce(item.name, '')), '[^a-z0-9]+', '', 'g') in ('bestsellerbox', 'samplerbox', 'samplerboxof6') then false
      when lower(coalesce(item.slug, '')) in ('bestseller-box', 'sampler-box', 'sampler-box-of-6') then false
      else true
    end,
    updated_at = now()
from public.subcategories subcategory
where subcategory.id = item.subcategory_id
  and not item.is_archived;

commit;

notify pgrst, 'reload schema';
