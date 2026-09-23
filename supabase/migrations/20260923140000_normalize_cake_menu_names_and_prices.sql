-- Present each cake as a whole item named after the cake itself, plus a
-- dedicated "Slice of ..." item priced from the whole cake divided by eight.

begin;

create temp table tmp_cake_names (
  slug text primary key,
  cake_name text not null
) on commit drop;

insert into tmp_cake_names (slug, cake_name) values
  ('blueberry-cheesecake', 'Blueberry Cheesecake'),
  ('matcha-cheesecake', 'Matcha Cheesecake'),
  ('leche-flan-cheesecake', 'Leche Flan Cheesecake'),
  ('basque-burnt-cheesecake', 'Basque Burnt Cheesecake'),
  ('biscoff-burnt-cheesecake', 'Biscoff Burnt Cheesecake'),
  ('carrot-walnut-cake', 'Carrot Walnut Cake'),
  ('red-velvet-cake', 'Red Velvet Cake'),
  ('tiramisu', 'Tiramisu Cake');

update public.menu_items whole_cake
set name = cake.cake_name,
    variant_options = '{}'::jsonb,
    updated_at = now()
from tmp_cake_names cake
where whole_cake.slug = cake.slug
  and not whole_cake.is_archived;

update public.menu_items slice
set name = 'Slice of ' || cake.cake_name,
    price = whole_cake.price / 8,
    image_url = case
      when cake.slug = 'biscoff-burnt-cheesecake' then slice.image_url
      else null
    end,
    variant_options = '{}'::jsonb,
    updated_at = now()
from tmp_cake_names cake
join public.menu_items whole_cake
  on whole_cake.slug = cake.slug
 and not whole_cake.is_archived
where slice.slug = cake.slug || '-slice'
  and not slice.is_archived;

commit;

notify pgrst, 'reload schema';
