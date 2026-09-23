-- Add three cakes as separate whole and slice menu items.
-- Inventory is shared per cake and stored in slice units:
-- one slice consumes 1 unit and one whole cake consumes 8 units.

begin;

do $$
declare
  v_foods_id uuid;
  v_cakes_id uuid;
  v_product_id uuid;
  v_whole_id uuid;
  v_slice_id uuid;
  v_product_created boolean;
  cake record;
begin
  select id into v_foods_id
  from public.main_categories
  where lower(name) = 'foods'
  limit 1;

  select id into v_cakes_id
  from public.subcategories
  where main_category_id = v_foods_id
    and lower(name) = 'cakes'
  limit 1;

  if v_foods_id is null or v_cakes_id is null then
    raise exception 'Foods > Cakes category is required before adding the new cakes';
  end if;

  for cake in
    select * from (values
      (
        'Brownie Tiramisu', 'brownie-tiramisu',
        'Chocolate brownie layered with tiramisu cream and cocoa.',
        290::numeric, 'assets/img/Cakes/BrownieTiramisuWhole.png',
        'assets/img/Cakes/BrownieTiramisuSlice.png', 201
      ),
      (
        'Ube Leche Flan', 'ube-leche-flan',
        'Creamy ube cake finished with a caramelized leche flan layer.',
        225::numeric, 'assets/img/Cakes/UbeLecheFlanWhole.png',
        'assets/img/Cakes/UbeLecheFlanSlice.png', 203
      ),
      (
        'Banana Nutella Almond', 'banana-nutella-almond',
        'Banana cake layered with Nutella and topped with roasted almonds.',
        195::numeric, 'assets/img/Cakes/BananaNutellaAlmondWhole.png',
        'assets/img/Cakes/BananaNutellaAlmondSlice.png', 205
      )
    ) as requested(name, slug, description, slice_price, whole_image, slice_image, sort_order)
  loop
    update public.menu_items
    set main_category_id = v_foods_id,
        subcategory_id = v_cakes_id,
        item_type = 'food',
        name = cake.name,
        description = cake.description,
        price = cake.slice_price * 8,
        temperature_type = 'none',
        allow_addons = false,
        allow_sugar = false,
        allow_ice = false,
        image_url = cake.whole_image,
        manual_available = true,
        is_archived = false,
        prep_time_minutes = 5,
        sort_order = cake.sort_order,
        variant_options = '{}'::jsonb,
        inventory_source = 'products',
        online_benefit_eligible = false,
        updated_at = now()
    where slug = cake.slug
    returning id into v_whole_id;

    if v_whole_id is null then
      insert into public.menu_items (
        main_category_id, subcategory_id, item_type, name, slug, description, price,
        temperature_type, allow_addons, allow_sugar, allow_ice, image_url,
        manual_available, is_available, is_archived, is_featured, is_bestseller,
        prep_time_minutes, sort_order, variant_options, inventory_source,
        online_benefit_eligible
      ) values (
        v_foods_id, v_cakes_id, 'food', cake.name, cake.slug, cake.description,
        cake.slice_price * 8, 'none', false, false, false, cake.whole_image,
        true, true, false, false, false, 5, cake.sort_order, '{}'::jsonb,
        'products', false
      ) returning id into v_whole_id;
    end if;

    update public.menu_items
    set main_category_id = v_foods_id,
        subcategory_id = v_cakes_id,
        item_type = 'food',
        name = 'Slice of ' || cake.name,
        description = cake.description,
        price = cake.slice_price,
        temperature_type = 'none',
        allow_addons = false,
        allow_sugar = false,
        allow_ice = false,
        image_url = cake.slice_image,
        manual_available = true,
        is_archived = false,
        prep_time_minutes = 5,
        sort_order = cake.sort_order + 1,
        variant_options = '{}'::jsonb,
        inventory_source = 'products',
        online_benefit_eligible = false,
        updated_at = now()
    where slug = cake.slug || '-slice'
    returning id into v_slice_id;

    if v_slice_id is null then
      insert into public.menu_items (
        main_category_id, subcategory_id, item_type, name, slug, description, price,
        temperature_type, allow_addons, allow_sugar, allow_ice, image_url,
        manual_available, is_available, is_archived, is_featured, is_bestseller,
        prep_time_minutes, sort_order, variant_options, inventory_source,
        online_benefit_eligible
      ) values (
        v_foods_id, v_cakes_id, 'food', 'Slice of ' || cake.name,
        cake.slug || '-slice', cake.description, cake.slice_price,
        'none', false, false, false, cake.slice_image,
        true, true, false, false, false, 5, cake.sort_order + 1, '{}'::jsonb,
        'products', false
      ) returning id into v_slice_id;
    end if;

    v_product_created := false;
    select id into v_product_id
    from public.finished_products
    where lower(name) = lower(cake.name)
    order by is_archived, updated_at desc
    limit 1
    for update;

    if v_product_id is null then
      insert into public.finished_products (
        name, category, unit, quantity, min_stock_level, high_stock_level, notes
      ) values (
        cake.name, 'Cakes', 'slice', 8, 0, 100,
        'One inventory product supplies the whole-cake and slice menu items.'
      ) returning id into v_product_id;
      v_product_created := true;
    else
      update public.finished_products
      set name = cake.name,
          category = 'Cakes',
          unit = 'slice',
          is_archived = false,
          updated_at = now()
      where id = v_product_id;
    end if;

    if v_product_created then
      insert into public.finished_product_movements (
        finished_product_id, movement_type, quantity, reason
      ) values (
        v_product_id, 'restock', 8,
        'Initial stock for linked whole cake and slice menu items'
      );
    end if;

    delete from public.finished_product_sale_mappings
    where menu_item_id in (v_whole_id, v_slice_id);

    insert into public.finished_product_sale_mappings (
      finished_product_id, menu_item_id, variant_key, units_per_sale
    ) values
      (v_product_id, v_whole_id, null, 8),
      (v_product_id, v_slice_id, null, 1);
  end loop;
end;
$$;

commit;

notify pgrst, 'reload schema';
