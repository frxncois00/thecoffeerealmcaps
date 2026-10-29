drop function if exists public.staff_upsert_ingredient(uuid,text,text,text,text,numeric,numeric,text,text,numeric);

create function public.staff_upsert_ingredient(
  p_id uuid, p_name text, p_category text, p_type text, p_unit text,
  p_critical numeric, p_min numeric, p_high numeric,
  p_supplier text, p_notes text, p_initial_quantity numeric
) returns uuid language plpgsql security definer set search_path = public as $function$
declare v_id uuid;
begin
  perform public.assert_inventory_writer();
  if btrim(coalesce(p_name,'')) = '' then raise exception 'Ingredient name is required'; end if;
  if p_type not in ('wet','dry','other') then raise exception 'Invalid ingredient type'; end if;
  if coalesce(p_critical,0) < 0 or coalesce(p_min,0) < 0 or coalesce(p_high,0) < 0 then raise exception 'Thresholds cannot be negative'; end if;
  if coalesce(p_critical,0) > coalesce(p_min,0) then raise exception 'The critical level cannot exceed the low-stock level'; end if;
  if coalesce(p_min,0) > coalesce(p_high,0) then raise exception 'The low-stock level cannot exceed the restock target'; end if;
  begin
    if p_id is null then
      insert into public.ingredients(name,category,type,unit,supplier,notes)
      values(btrim(p_name),nullif(btrim(coalesce(p_category,'')),''),p_type,coalesce(nullif(btrim(p_unit),''),'unit'),nullif(btrim(coalesce(p_supplier,'')),''),nullif(btrim(coalesce(p_notes,'')),''))
      returning id into v_id;
      insert into public.inventory_stock(ingredient_id,quantity,critical_stock_level,min_stock_level,high_stock_level)
      values(v_id,greatest(coalesce(p_initial_quantity,0),0),coalesce(p_critical,20),coalesce(p_min,45),coalesce(p_high,100));
    else
      v_id := p_id;
      update public.ingredients set name=btrim(p_name),category=nullif(btrim(coalesce(p_category,'')),''),type=p_type,
        unit=coalesce(nullif(btrim(p_unit),''),'unit'),supplier=nullif(btrim(coalesce(p_supplier,'')),''),notes=nullif(btrim(coalesce(p_notes,'')),'')
      where id=v_id and not is_archived;
      if not found then raise exception 'Ingredient not found'; end if;
      update public.inventory_stock set critical_stock_level=coalesce(p_critical,critical_stock_level),
        min_stock_level=coalesce(p_min,min_stock_level),high_stock_level=coalesce(p_high,high_stock_level),updated_at=now()
      where ingredient_id=v_id;
    end if;
  exception when unique_violation then
    raise exception 'An ingredient with this name already exists in this category';
  end;
  return v_id;
end;
$function$;

revoke all on function public.staff_upsert_ingredient(uuid,text,text,text,text,numeric,numeric,numeric,text,text,numeric) from public;
grant execute on function public.staff_upsert_ingredient(uuid,text,text,text,text,numeric,numeric,numeric,text,text,numeric) to authenticated;

