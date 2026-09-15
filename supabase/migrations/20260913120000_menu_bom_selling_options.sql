-- Menu inventory ownership and selling-option quantities.
alter table public.menu_items add column if not exists inventory_source text not null default 'none';
alter table public.menu_items drop constraint if exists menu_items_inventory_source_check;
alter table public.menu_items add constraint menu_items_inventory_source_check check (inventory_source in ('none','ingredients','products'));

-- Existing scheduled windows are retired by the new editor.
update public.menu_items set available_from = null, available_until = null where available_from is not null or available_until is not null;

create or replace function public.staff_set_menu_item_configuration(
  p_menu_item_id uuid, p_inventory_source text, p_ingredients jsonb default '[]'::jsonb, p_products jsonb default '[]'::jsonb
) returns void language plpgsql security definer set search_path=public as $$
declare v_item public.menu_items%rowtype; v_row jsonb; v_product public.finished_products%rowtype; v_option jsonb; v_unit text; v_qty numeric;
begin
  perform public.assert_menu_availability_writer();
  if p_inventory_source not in ('none','ingredients','products') then raise exception 'Choose a valid inventory source'; end if;
  select * into v_item from public.menu_items where id=p_menu_item_id for update;
  if not found then raise exception 'Menu item not found'; end if;
  if p_inventory_source='ingredients' then
    for v_row in select value from jsonb_array_elements(coalesce(p_ingredients,'[]'::jsonb)) loop
      if not exists(select 1 from public.ingredients where id=(v_row->>'ingredient_id')::uuid and not is_archived) then raise exception 'Ingredient link is invalid'; end if;
      if coalesce((v_row->>'quantity_per_serving')::numeric,0)<=0 then raise exception 'Ingredient quantity must be greater than zero'; end if;
    end loop;
  elsif p_inventory_source='products' then
    -- A menu item always has an implicit default sale format; additional formats are optional.
    for v_row in select value from jsonb_array_elements(coalesce(p_products,'[]'::jsonb)) loop
      select * into v_product from public.finished_products where id=(v_row->>'finished_product_id')::uuid and not is_archived;
      if not found then raise exception 'Product link is invalid'; end if;
      v_option := (select value from jsonb_array_elements(coalesce(v_item.variant_options->'options','[]'::jsonb)) value where value->>'key'=v_row->>'variant_key' limit 1);
      if v_option is null then raise exception 'Product link must use a valid selling option'; end if;
      v_unit := nullif(lower(btrim(v_option->>'unit')),'');
      if v_unit is null or lower(btrim(v_product.unit)) <> v_unit then raise exception 'Selling option unit must match product stock unit'; end if;
      v_qty := (v_option->>'quantity')::numeric;
      if v_qty<=0 then raise exception 'Selling option quantity must be greater than zero'; end if;
    end loop;
  end if;
  delete from public.menu_item_ingredients where menu_item_id=p_menu_item_id;
  delete from public.finished_product_sale_mappings where menu_item_id=p_menu_item_id;
  update public.menu_items set inventory_source=p_inventory_source, updated_at=now() where id=p_menu_item_id;
  if p_inventory_source='ingredients' then
    insert into public.menu_item_ingredients(menu_item_id,ingredient_id,quantity_per_serving,unit)
    select p_menu_item_id,(value->>'ingredient_id')::uuid,(value->>'quantity_per_serving')::numeric,i.unit
    from jsonb_array_elements(coalesce(p_ingredients,'[]'::jsonb)) value join public.ingredients i on i.id=(value->>'ingredient_id')::uuid;
  elsif p_inventory_source='products' then
    insert into public.finished_product_sale_mappings(finished_product_id,menu_item_id,variant_key,units_per_sale)
    select (prow.value->>'finished_product_id')::uuid,p_menu_item_id,prow.value->>'variant_key',((opt.value->>'quantity')::numeric)
    from jsonb_array_elements(coalesce(p_products,'[]'::jsonb)) prow
    cross join lateral (select value from jsonb_array_elements(v_item.variant_options->'options') value where value->>'key'=prow.value->>'variant_key' limit 1) opt;
  end if;
end; $$;
revoke all on function public.staff_set_menu_item_configuration(uuid,text,jsonb,jsonb) from public;
grant execute on function public.staff_set_menu_item_configuration(uuid,text,jsonb,jsonb) to authenticated;

-- Keep the existing approval flow authoritative while applying BOM atomically after the menu row.
create or replace function public.admin_decide_menu_approval(p_id uuid, p_state text)
returns void language plpgsql security definer set search_path=public as $$
declare v_request public.menu_change_approvals%rowtype;
begin
  if not public.is_admin_profile() then raise exception 'Administrator access required'; end if;
  if p_state not in ('approved','rejected') then raise exception 'Invalid approval decision'; end if;
  select * into v_request from public.menu_change_approvals where id=p_id and state='pending' for update;
  if not found then raise exception 'Approval request not found or already decided'; end if;
  if p_state='approved' then
    if v_request.operation='upsert_menu_item' then
      perform public.staff_upsert_menu_item(nullif(v_request.payload->>'id','')::uuid,nullif(v_request.payload->>'mainCategoryId','')::uuid,nullif(v_request.payload->>'subcategoryId','')::uuid,v_request.payload->>'name',v_request.payload->>'slug',v_request.payload->>'description',(v_request.payload->>'price')::numeric,v_request.payload->>'itemType',v_request.payload->>'temperatureType',coalesce((v_request.payload->>'allowIce')::boolean,false),coalesce((v_request.payload->>'allowSugar')::boolean,false),coalesce((v_request.payload->>'allowAddons')::boolean,false),v_request.payload->>'imageUrl',coalesce((v_request.payload->>'manualAvailable')::boolean,true),coalesce((v_request.payload->>'isFeatured')::boolean,false),coalesce((v_request.payload->>'isBestseller')::boolean,false),nullif(v_request.payload->>'prepTimeMinutes','')::integer,null,null,coalesce((v_request.payload->>'sortOrder')::integer,0),coalesce(v_request.payload->'variantOptions','{}'::jsonb));
      update public.menu_items set online_benefit_eligible=coalesce((v_request.payload->>'onlineBenefitEligible')::boolean,online_benefit_eligible) where id=v_request.held_item_id;
      perform public.staff_set_menu_item_configuration(v_request.held_item_id,coalesce(v_request.payload->>'inventorySource','none'),coalesce(v_request.payload->'ingredients','[]'::jsonb),coalesce(v_request.payload->'products','[]'::jsonb));
    elsif v_request.operation='set_online_benefit_eligibility' then update public.menu_items set online_benefit_eligible=(v_request.payload->>'onlineBenefitEligible')::boolean where id=v_request.held_item_id;
    elsif v_request.operation='archive_menu_item' then perform public.staff_archive_menu_item((v_request.payload->>'id')::uuid);
    elsif v_request.operation='duplicate_menu_item' then perform public.staff_duplicate_menu_item((v_request.payload->>'id')::uuid);
    else raise exception 'Unsupported menu approval operation'; end if;
  end if;
  if v_request.held_item_id is not null and ((p_state='rejected' and not coalesce(v_request.held_item_was_archived,false)) or (p_state='approved' and v_request.action<>'remove')) then update public.menu_items set is_archived=false,updated_at=now() where id=v_request.held_item_id; end if;
  update public.menu_change_approvals set state=p_state,reviewed_by=auth.uid(),decided_at=now() where id=p_id;
end; $$;
revoke all on function public.admin_decide_menu_approval(uuid,text) from public;
grant execute on function public.admin_decide_menu_approval(uuid,text) to authenticated;

-- Inventory mode is explicit: a product BOM never silently falls back to an ingredient recipe.
create or replace function public.deduct_order_item_inventory(p_order_item_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare v_item public.order_items%rowtype; v_order public.orders%rowtype; v_variant text; v_mapping record; v_recipe record; v_amount numeric; v_current numeric; v_source text;
begin
 select * into v_item from public.order_items where id=p_order_item_id for update; if not found then raise exception 'Order item not found'; end if;
 select * into v_order from public.orders where id=v_item.order_id for update;
 if v_order.status='Cancelled' or coalesce(v_order.is_voided,false) then return; end if;
 if v_order.order_source='customer_pos' and not coalesce(v_order.payment_confirmed,false) then return; end if;
 if v_order.order_source='cashier_pos' and (v_order.receipt_number is null or not coalesce(v_order.payment_confirmed,false)) then return; end if;
 select inventory_source into v_source from public.menu_items where id=v_item.menu_item_id;
 v_variant := nullif(coalesce(v_item.customizations->>'variation_id',v_item.customizations->>'variantKey',''),'');
 if v_source='products' then
   for v_mapping in select mapping.* from public.finished_product_sale_mappings mapping join public.finished_products product on product.id=mapping.finished_product_id and not product.is_archived where mapping.menu_item_id=v_item.menu_item_id and (mapping.variant_key is not distinct from v_variant or (mapping.variant_key is null and not exists(select 1 from public.finished_product_sale_mappings x where x.menu_item_id=v_item.menu_item_id and x.variant_key is not distinct from v_variant))) loop
     if exists(select 1 from public.order_inventory_deductions where order_item_id=v_item.id and finished_product_id=v_mapping.finished_product_id) then continue; end if;
     v_amount:=v_mapping.units_per_sale*v_item.quantity; select quantity into v_current from public.finished_products where id=v_mapping.finished_product_id for update; if v_current<v_amount then raise exception 'Insufficient product stock for this order'; end if;
     update public.finished_products set quantity=quantity-v_amount,updated_at=now() where id=v_mapping.finished_product_id;
     insert into public.finished_product_movements(finished_product_id,order_id,order_item_id,movement_type,quantity,reason,created_by) values(v_mapping.finished_product_id,v_order.id,v_item.id,'deduction',v_amount,'Order stock deduction',auth.uid());
     insert into public.order_inventory_deductions(order_id,order_item_id,finished_product_id,quantity) values(v_order.id,v_item.id,v_mapping.finished_product_id,v_amount);
   end loop;
 elsif v_source='ingredients' then
   for v_recipe in select ingredient_id,quantity_per_serving from public.menu_item_ingredients where menu_item_id=v_item.menu_item_id loop
     if exists(select 1 from public.order_inventory_deductions where order_item_id=v_item.id and ingredient_id=v_recipe.ingredient_id) then continue; end if;
     v_amount:=v_recipe.quantity_per_serving*v_item.quantity; select quantity into v_current from public.inventory_stock where ingredient_id=v_recipe.ingredient_id for update; if v_current<v_amount then raise exception 'Insufficient ingredient stock for this order'; end if;
     update public.inventory_stock set quantity=quantity-v_amount,updated_at=now() where ingredient_id=v_recipe.ingredient_id;
     insert into public.inventory_movements(ingredient_id,order_id,order_item_id,movement_type,quantity,reason,created_by) values(v_recipe.ingredient_id,v_order.id,v_item.id,'deduction',v_amount,'Order stock deduction',auth.uid());
     insert into public.order_inventory_deductions(order_id,order_item_id,ingredient_id,quantity) values(v_order.id,v_item.id,v_recipe.ingredient_id,v_amount);
   end loop;
 end if;
end; $$;
