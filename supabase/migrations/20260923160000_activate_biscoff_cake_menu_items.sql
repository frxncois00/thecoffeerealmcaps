-- Finalize the two Biscoff selling formats against one inventory product.
-- Inventory is stored in slice units: one slice = 1, one whole cake = 8.

begin;

do $$
declare
  v_product_id uuid;
  v_whole_id uuid;
  v_slice_id uuid;
  v_whole_price numeric;
  v_current_stock numeric;
  v_added_stock numeric;
begin
  select id, price into v_whole_id, v_whole_price
  from public.menu_items
  where slug = 'biscoff-burnt-cheesecake'
  limit 1;

  select id into v_slice_id
  from public.menu_items
  where slug = 'biscoff-burnt-cheesecake-slice'
  limit 1;

  select id, quantity into v_product_id, v_current_stock
  from public.finished_products
  where lower(name) = 'biscoff burnt cheesecake'
  order by is_archived, updated_at desc
  limit 1
  for update;

  if v_whole_id is not null and v_slice_id is not null and v_product_id is not null then
    v_added_stock := greatest(8 - coalesce(v_current_stock, 0), 0);

    if v_added_stock > 0 then
      update public.finished_products
      set quantity = quantity + v_added_stock,
          is_archived = false,
          updated_at = now()
      where id = v_product_id;

      insert into public.finished_product_movements (
        finished_product_id, movement_type, quantity, reason
      ) values (
        v_product_id, 'restock', v_added_stock,
        'Initial stock for linked Biscoff whole cake and slice menu items'
      );
    else
      update public.finished_products
      set is_archived = false, updated_at = now()
      where id = v_product_id;
    end if;

    delete from public.finished_product_sale_mappings
    where menu_item_id in (v_whole_id, v_slice_id);

    insert into public.finished_product_sale_mappings (
      finished_product_id, menu_item_id, variant_key, units_per_sale
    ) values
      (v_product_id, v_whole_id, null, 8),
      (v_product_id, v_slice_id, null, 1);

    update public.menu_items
    set name = 'Biscoff Burnt Cheesecake',
        variant_options = '{}'::jsonb,
        inventory_source = 'products',
        is_archived = false,
        manual_available = true,
        is_available = true,
        unavailable_reason = null,
        updated_at = now()
    where id = v_whole_id;

    update public.menu_items
    set name = 'Slice of Biscoff Burnt Cheesecake',
        price = v_whole_price / 8,
        variant_options = '{}'::jsonb,
        inventory_source = 'products',
        is_archived = false,
        manual_available = true,
        is_available = true,
        unavailable_reason = null,
        updated_at = now()
    where id = v_slice_id;
  end if;
end;
$$;

commit;

notify pgrst, 'reload schema';
