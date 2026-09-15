-- Preset bundle component quantities are independent from the bundle total.
create or replace function public.staff_set_menu_item_configuration(p_menu_item_id uuid,p_inventory_source text,p_ingredients jsonb default '[]'::jsonb,p_products jsonb default '[]'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v_item public.menu_items%rowtype; v_row jsonb; v_product public.finished_products%rowtype; v_option jsonb; v_unit text;
begin
 perform public.assert_menu_availability_writer(); select * into v_item from public.menu_items where id=p_menu_item_id for update; if not found then raise exception 'Menu item not found'; end if;
 if p_inventory_source not in ('none','ingredients','products') then raise exception 'Choose a valid inventory source'; end if;
 if p_inventory_source='products' then
  for v_row in select value from jsonb_array_elements(coalesce(p_products,'[]'::jsonb)) loop
   select * into v_product from public.finished_products where id=(v_row->>'finished_product_id')::uuid and not is_archived; if not found then raise exception 'Product link is invalid'; end if;
   v_option:=(select value from jsonb_array_elements(coalesce(v_item.variant_options->'options','[]'::jsonb)) value where value->>'key'=coalesce(v_row->>'variant_key','default') limit 1);
   if v_option is null and (v_item.variant_options->'options'->0->>'key') = 'bundle-default' then v_option:=(v_item.variant_options->'options'->0); end if;
   if v_option is null then raise exception 'Product link must use a valid selling option'; end if;
   v_unit:=nullif(lower(btrim(v_option->>'unit')),''); if v_unit is null or lower(btrim(v_product.unit))<>v_unit then raise exception 'Selling option unit must match product stock unit'; end if;
   if coalesce((v_row->>'quantity_per_sale')::numeric,1)<=0 then raise exception 'Preset product quantity must be greater than zero'; end if;
  end loop;
 end if;
 delete from public.menu_item_ingredients where menu_item_id=p_menu_item_id; delete from public.finished_product_sale_mappings where menu_item_id=p_menu_item_id;
 update public.menu_items set inventory_source=p_inventory_source,updated_at=now() where id=p_menu_item_id;
 if p_inventory_source='ingredients' then
  insert into public.menu_item_ingredients(menu_item_id,ingredient_id,quantity_per_serving,unit) select p_menu_item_id,(value->>'ingredient_id')::uuid,(value->>'quantity_per_serving')::numeric,i.unit from jsonb_array_elements(coalesce(p_ingredients,'[]'::jsonb)) value join public.ingredients i on i.id=(value->>'ingredient_id')::uuid;
 elsif p_inventory_source='products' then
  insert into public.finished_product_sale_mappings(finished_product_id,menu_item_id,variant_key,units_per_sale) select (value->>'finished_product_id')::uuid,p_menu_item_id,value->>'variant_key',coalesce((value->>'quantity_per_sale')::numeric,1) from jsonb_array_elements(coalesce(p_products,'[]'::jsonb)) value;
 end if;
end; $$;
