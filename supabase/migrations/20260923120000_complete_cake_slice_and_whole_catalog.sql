-- Keep the cake catalog as eight whole cakes plus eight dedicated slice items.
-- Slice records intentionally have no uploaded product image.

begin;

do $$
declare
  v_slice public.menu_items%rowtype;
  v_whole_id uuid;
  v_product_id uuid;
begin
  select item.* into v_slice
  from public.menu_items item
  join public.subcategories category on category.id = item.subcategory_id
  where category.name = 'cakes'
    and not item.is_archived
    and (
      item.slug = 'biscoff-burnt-cheesecake-slice'
      or lower(item.name) = 'biscoff burnt cheesecake / slice'
      or (item.slug = 'biscoff-burnt-cheesecake' and lower(item.name) not like 'whole %')
    )
  order by case when item.slug = 'biscoff-burnt-cheesecake-slice' then 0 else 1 end
  limit 1;

  if found then
    select item.id into v_whole_id
    from public.menu_items item
    where item.id <> v_slice.id
      and item.slug = 'biscoff-burnt-cheesecake'
    order by item.is_archived desc, item.created_at
    limit 1;

    update public.menu_items
    set slug = 'biscoff-burnt-cheesecake-slice',
        name = 'Biscoff Burnt Cheesecake / Slice',
        variant_options = '{}'::jsonb,
        inventory_source = 'products',
        updated_at = now()
    where id = v_slice.id;

    if v_whole_id is null then
      insert into public.menu_items (
        main_category_id, subcategory_id, item_type, name, slug, description, price,
        temperature_type, allow_addons, allow_sugar, allow_ice, image_url,
        manual_available, is_available, is_archived, is_featured, is_bestseller,
        prep_time_minutes, sort_order, variant_options, inventory_source,
        online_benefit_eligible
      ) values (
        v_slice.main_category_id, v_slice.subcategory_id, v_slice.item_type,
        'Whole Biscoff Burnt Cheesecake', 'biscoff-burnt-cheesecake',
        v_slice.description, 2600, v_slice.temperature_type, false, false, false,
        coalesce(v_slice.image_url, 'assets/img/Cakes/BurntBiscoffCheesecake.jpg'), v_slice.manual_available, v_slice.is_available, false,
        v_slice.is_featured, v_slice.is_bestseller, v_slice.prep_time_minutes,
        v_slice.sort_order, '{}'::jsonb, 'products', false
      ) returning id into v_whole_id;
    else
      update public.menu_items item
      set main_category_id = v_slice.main_category_id,
          subcategory_id = v_slice.subcategory_id,
          item_type = v_slice.item_type,
          name = 'Whole Biscoff Burnt Cheesecake',
          description = v_slice.description,
          price = 2600,
          temperature_type = v_slice.temperature_type,
          allow_addons = false,
          allow_sugar = false,
          allow_ice = false,
          image_url = coalesce(item.image_url, 'assets/img/Cakes/BurntBiscoffCheesecake.jpg'),
          manual_available = v_slice.manual_available,
          is_available = v_slice.is_available,
          is_archived = false,
          is_featured = v_slice.is_featured,
          is_bestseller = v_slice.is_bestseller,
          prep_time_minutes = v_slice.prep_time_minutes,
          variant_options = '{}'::jsonb,
          inventory_source = 'products',
          online_benefit_eligible = false,
          updated_at = now()
      where item.id = v_whole_id;
    end if;

    delete from public.menu_item_ingredients
    where menu_item_id = v_whole_id;

    insert into public.menu_item_ingredients (menu_item_id, ingredient_id, quantity_per_serving, unit)
    select v_whole_id, ingredient_id, quantity_per_serving * 8, unit
    from public.menu_item_ingredients
    where menu_item_id = v_slice.id;

    select product.id into v_product_id
    from public.finished_products product
    where not product.is_archived
      and product.category = 'Ready-made Cakes'
      and lower(product.name) like 'biscoff burnt cheesecake%'
    order by product.updated_at desc
    limit 1;

    if v_product_id is not null then
      delete from public.finished_product_sale_mappings
      where menu_item_id in (v_slice.id, v_whole_id);

      insert into public.finished_product_sale_mappings
        (finished_product_id, menu_item_id, variant_key, units_per_sale)
      values
        (v_product_id, v_slice.id, null, 1),
        (v_product_id, v_whole_id, null, 8);
    end if;
  end if;
end;
$$;

-- Remove uploaded images from every slice while retaining all whole-cake images.
update public.menu_items item
set image_url = null,
    variant_options = '{}'::jsonb,
    updated_at = now()
where item.subcategory_id in (
    select category.id from public.subcategories category where category.name = 'cakes'
  )
  and not item.is_archived
  and (item.slug like '%-slice' or lower(item.name) like '% / slice')
  and item.slug <> 'biscoff-burnt-cheesecake-slice';

commit;

notify pgrst, 'reload schema';
