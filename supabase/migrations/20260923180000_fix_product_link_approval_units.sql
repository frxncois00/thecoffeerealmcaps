-- Selling units and inventory units do not need identical labels. The mapping's
-- units_per_sale is the conversion boundary (for example, one whole cake uses
-- eight inventory slices). This also unblocks existing cake approval requests.

create or replace function public.staff_set_menu_item_configuration(
  p_menu_item_id uuid,
  p_inventory_source text,
  p_ingredients jsonb default '[]'::jsonb,
  p_products jsonb default '[]'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.menu_items%rowtype;
  v_row jsonb;
  v_product public.finished_products%rowtype;
  v_is_cake boolean := false;
  v_units_per_sale numeric;
begin
  perform public.assert_menu_availability_writer();

  select * into v_item
  from public.menu_items
  where id = p_menu_item_id
  for update;

  if not found then raise exception 'Menu item not found'; end if;
  if p_inventory_source not in ('none', 'ingredients', 'products') then
    raise exception 'Choose a valid inventory source';
  end if;

  select lower(coalesce(category.name, '') || ' ' || coalesce(category.display_name, '')) like '%cake%'
  into v_is_cake
  from public.subcategories category
  where category.id = v_item.subcategory_id;

  if p_inventory_source = 'ingredients' then
    for v_row in select value from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb)) loop
      if not exists (
        select 1 from public.ingredients
        where id = (v_row->>'ingredient_id')::uuid and not is_archived
      ) then raise exception 'Ingredient link is invalid'; end if;
      if coalesce((v_row->>'quantity_per_serving')::numeric, 0) <= 0 then
        raise exception 'Ingredient quantity must be greater than zero';
      end if;
    end loop;
  elsif p_inventory_source = 'products' then
    for v_row in select value from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) loop
      select * into v_product
      from public.finished_products
      where id = (v_row->>'finished_product_id')::uuid and not is_archived;

      if not found then raise exception 'Product link is invalid'; end if;

      v_units_per_sale := case
        when v_is_cake and v_item.slug like '%-slice' then 1
        when v_is_cake then 8
        else coalesce(nullif(v_row->>'quantity_per_sale', '')::numeric, 1)
      end;

      if v_units_per_sale <= 0 then
        raise exception 'Product quantity per sale must be greater than zero';
      end if;
    end loop;
  end if;

  delete from public.menu_item_ingredients where menu_item_id = p_menu_item_id;
  delete from public.finished_product_sale_mappings where menu_item_id = p_menu_item_id;

  update public.menu_items
  set inventory_source = p_inventory_source, updated_at = now()
  where id = p_menu_item_id;

  if p_inventory_source = 'ingredients' then
    insert into public.menu_item_ingredients (
      menu_item_id, ingredient_id, quantity_per_serving, unit
    )
    select p_menu_item_id,
      (value->>'ingredient_id')::uuid,
      (value->>'quantity_per_serving')::numeric,
      ingredient.unit
    from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb)) value
    join public.ingredients ingredient on ingredient.id = (value->>'ingredient_id')::uuid;
  elsif p_inventory_source = 'products' then
    insert into public.finished_product_sale_mappings (
      finished_product_id, menu_item_id, variant_key, units_per_sale
    )
    select
      (value->>'finished_product_id')::uuid,
      p_menu_item_id,
      case when v_is_cake then null else nullif(value->>'variant_key', '') end,
      case
        when v_is_cake and v_item.slug like '%-slice' then 1
        when v_is_cake then 8
        else coalesce(nullif(value->>'quantity_per_sale', '')::numeric, 1)
      end
    from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) value;
  end if;
end;
$$;

revoke all on function public.staff_set_menu_item_configuration(uuid, text, jsonb, jsonb) from public;
grant execute on function public.staff_set_menu_item_configuration(uuid, text, jsonb, jsonb) to authenticated;

notify pgrst, 'reload schema';
