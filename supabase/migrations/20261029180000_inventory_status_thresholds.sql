-- Inventory status bands use the restock target as 100%:
--   out of stock = 0, critical <= 20%, low stock <= 45%, stocked > 45%.
-- high_stock_level remains the purchase-order restock target.

alter table public.inventory_stock
  add column if not exists critical_stock_level numeric not null default 0
  check (critical_stock_level >= 0);

alter table public.finished_products
  add column if not exists critical_stock_level numeric not null default 0
  check (critical_stock_level >= 0);

-- Prevent the threshold backfill from creating a notification for every item.
drop trigger if exists capture_notification on public.inventory_stock;
drop trigger if exists capture_notification on public.finished_products;

update public.inventory_stock
set high_stock_level = case when high_stock_level > 0 then high_stock_level else greatest(quantity, 1) end,
    critical_stock_level = ceil((case when high_stock_level > 0 then high_stock_level else greatest(quantity, 1) end) * 0.20),
    min_stock_level = ceil((case when high_stock_level > 0 then high_stock_level else greatest(quantity, 1) end) * 0.45),
    updated_at = now();

update public.finished_products
set high_stock_level = case when high_stock_level > 0 then high_stock_level else greatest(quantity, 1) end,
    critical_stock_level = ceil((case when high_stock_level > 0 then high_stock_level else greatest(quantity, 1) end) * 0.20),
    min_stock_level = ceil((case when high_stock_level > 0 then high_stock_level else greatest(quantity, 1) end) * 0.45),
    updated_at = now();

alter table public.inventory_stock
  drop constraint if exists inventory_stock_status_thresholds_check;
alter table public.inventory_stock
  add constraint inventory_stock_status_thresholds_check
  check (critical_stock_level <= min_stock_level and min_stock_level <= high_stock_level);

alter table public.finished_products
  drop constraint if exists finished_products_status_thresholds_check;
alter table public.finished_products
  add constraint finished_products_status_thresholds_check
  check (critical_stock_level <= min_stock_level and min_stock_level <= high_stock_level);

drop function if exists public.staff_upsert_ingredient(uuid,text,text,text,text,numeric,numeric,text,text,numeric);
create function public.staff_upsert_ingredient(
  p_id uuid, p_name text, p_category text, p_type text, p_unit text,
  p_critical numeric, p_min numeric, p_high numeric, p_supplier text, p_notes text, p_initial_quantity numeric
) returns uuid language plpgsql security definer set search_path = public as $$
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
  exception when unique_violation then raise exception 'An ingredient with this name already exists in this category';
  end;
  return v_id;
end;
$$;

drop function if exists public.staff_upsert_finished_product(uuid,text,text,uuid,text,numeric,numeric,text,text,numeric);
create function public.staff_upsert_finished_product(
  p_id uuid, p_name text, p_category text, p_menu_item_id uuid, p_unit text,
  p_critical numeric, p_min numeric, p_high numeric, p_supplier text, p_notes text, p_initial_quantity numeric
) returns uuid language plpgsql security definer set search_path = public as $$
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
  exception when unique_violation then raise exception 'A finished product with this name already exists in this category';
  end;
  return v_id;
end;
$$;

revoke all on function public.staff_upsert_ingredient(uuid,text,text,text,text,numeric,numeric,numeric,text,text,numeric) from public;
revoke all on function public.staff_upsert_finished_product(uuid,text,text,uuid,text,numeric,numeric,numeric,text,text,numeric) from public;
grant execute on function public.staff_upsert_ingredient(uuid,text,text,text,text,numeric,numeric,numeric,text,text,numeric) to authenticated;
grant execute on function public.staff_upsert_finished_product(uuid,text,text,uuid,text,numeric,numeric,numeric,text,text,numeric) to authenticated;

drop trigger if exists capture_notification on public.inventory_stock;
drop trigger if exists capture_notification on public.finished_products;

create or replace function public.capture_inventory_status_notification() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n jsonb := to_jsonb(new); o jsonb := case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  quantity numeric := (n->>'quantity')::numeric; critical numeric := (n->>'critical_stock_level')::numeric; minimum numeric := (n->>'min_stock_level')::numeric;
  old_quantity numeric := (o->>'quantity')::numeric; old_critical numeric := (o->>'critical_stock_level')::numeric; old_minimum numeric := (o->>'min_stock_level')::numeric;
  current_level int; previous_level int := 0; label text; title text; typ text; target jsonb;
begin
  if coalesce(n->>'is_archived','false')='true' or quantity is null or critical is null or minimum is null then return new; end if;
  current_level := case when quantity<=0 then 3 when quantity<=critical then 2 when quantity<=minimum then 1 else 0 end;
  if tg_op='UPDATE' then previous_level := case when old_quantity<=0 then 3 when old_quantity<=old_critical then 2 when old_quantity<=old_minimum then 1 else 0 end; end if;
  if current_level=previous_level then return new; end if;
  if current_level=3 then typ:='out_of_stock'; title:='Out of stock';
  elsif current_level=2 then typ:='low_stock'; title:='Critical stock';
  elsif current_level=1 then typ:='low_stock'; title:='Low stock';
  elsif current_level=0 and previous_level>0 then typ:='stock_restored'; title:='Stock restored';
  else return new; end if;
  label := n->>'name';
  if tg_table_name='inventory_stock' then select name into label from public.ingredients where id=(n->>'ingredient_id')::uuid and not is_archived; end if;
  if label is null then return new; end if;
  target := jsonb_build_object('kind','inventory','itemType',case tg_table_name when 'inventory_stock' then 'ingredient' else 'finished_product' end,'name',label);
  perform public.emit_team_notification(array['staff','operational_staff','admin'],gen_random_uuid()::text,typ,'inventory',title,label||' - '||quantity||' remaining',target,typ<>'stock_restored');
  return new;
end;
$$;

revoke all on function public.capture_inventory_status_notification() from public, anon, authenticated;
create trigger capture_notification after insert or update on public.inventory_stock for each row execute function public.capture_inventory_status_notification();
create trigger capture_notification after insert or update on public.finished_products for each row execute function public.capture_inventory_status_notification();
