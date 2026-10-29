drop function if exists public.staff_upsert_finished_product(uuid,text,text,uuid,text,numeric,numeric,text,text,numeric);

create function public.staff_upsert_finished_product(
  p_id uuid, p_name text, p_category text, p_menu_item_id uuid, p_unit text,
  p_critical numeric, p_min numeric, p_high numeric,
  p_supplier text, p_notes text, p_initial_quantity numeric
) returns uuid language plpgsql security definer set search_path = public as $function$
declare v_id uuid;
begin
  perform public.assert_inventory_writer();
  if btrim(coalesce(p_name,'')) = '' then raise exception 'Product name is required'; end if;
  if coalesce(p_critical,0) < 0 or coalesce(p_min,0) < 0 or coalesce(p_high,0) < 0 then raise exception 'Thresholds cannot be negative'; end if;
  if coalesce(p_critical,0) > coalesce(p_min,0) then raise exception 'The critical level cannot exceed the low-stock level'; end if;
  if coalesce(p_min,0) > coalesce(p_high,0) then raise exception 'The low-stock level cannot exceed the restock target'; end if;
  begin
    if p_id is null then
      insert into public.finished_products(name,category,menu_item_id,unit,quantity,critical_stock_level,min_stock_level,high_stock_level,supplier,notes)
      values(btrim(p_name),nullif(btrim(coalesce(p_category,'')),''),p_menu_item_id,coalesce(nullif(btrim(p_unit),''),'unit'),greatest(coalesce(p_initial_quantity,0),0),coalesce(p_critical,20),coalesce(p_min,45),coalesce(p_high,100),nullif(btrim(coalesce(p_supplier,'')),''),nullif(btrim(coalesce(p_notes,'')),''))
      returning id into v_id;
    else
      v_id := p_id;
      update public.finished_products set name=btrim(p_name),category=nullif(btrim(coalesce(p_category,'')),''),menu_item_id=p_menu_item_id,
        unit=coalesce(nullif(btrim(p_unit),''),'unit'),critical_stock_level=coalesce(p_critical,critical_stock_level),
        min_stock_level=coalesce(p_min,min_stock_level),high_stock_level=coalesce(p_high,high_stock_level),
        supplier=nullif(btrim(coalesce(p_supplier,'')),''),notes=nullif(btrim(coalesce(p_notes,'')),''),updated_at=now()
      where id=v_id and not is_archived;
      if not found then raise exception 'Finished product not found'; end if;
    end if;
  exception when unique_violation then
    raise exception 'A finished product with this name already exists in this category';
  end;
  return v_id;
end;
$function$;

revoke all on function public.staff_upsert_finished_product(uuid,text,text,uuid,text,numeric,numeric,numeric,text,text,numeric) from public;
grant execute on function public.staff_upsert_finished_product(uuid,text,text,uuid,text,numeric,numeric,numeric,text,text,numeric) to authenticated;

