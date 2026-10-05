-- Keep the opening-stock plan in sync without an unrestricted DELETE.
create or replace function public.staff_save_daily_opening_stock_plan(p_opening_time time, p_is_active boolean, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_unit text;
  v_local_date date := timezone('Asia/Manila', now())::date;
  v_local_time time := timezone('Asia/Manila', now())::time;
begin
  perform public.assert_inventory_writer();
  if p_opening_time is null then raise exception 'Reset time is required'; end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Select at least one product';
  end if;

  create temporary table if not exists opening_stock_input(product_id uuid primary key, quantity numeric, unit text) on commit drop;
  truncate opening_stock_input;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := nullif(v_item->>'product_id','')::uuid;
    v_quantity := nullif(v_item->>'opening_quantity','')::numeric;
    v_unit := btrim(coalesce(v_item->>'unit',''));
    if v_product_id is null or not exists (select 1 from public.finished_products where id=v_product_id and not is_archived) then
      raise exception 'A selected product is unavailable';
    end if;
    if v_quantity is null or v_quantity < 0 then raise exception 'Starting quantities must be zero or greater'; end if;
    if length(v_unit) < 1 or length(v_unit) > 24 then raise exception 'Enter a valid unit'; end if;
    insert into opening_stock_input values(v_product_id,v_quantity,v_unit);
  end loop;

  delete from public.daily_opening_stock_items plan
    where not exists (select 1 from opening_stock_input input where input.product_id = plan.finished_product_id);
  insert into public.daily_opening_stock_items(finished_product_id,opening_quantity,unit)
    select product_id,quantity,unit from opening_stock_input where true
    on conflict (finished_product_id) do update
      set opening_quantity=excluded.opening_quantity, unit=excluded.unit, updated_at=now()
      where (daily_opening_stock_items.opening_quantity,daily_opening_stock_items.unit)
        is distinct from (excluded.opening_quantity,excluded.unit);

  update public.finished_products product set unit=input.unit, updated_at=now()
    from opening_stock_input input
    where product.id=input.product_id and product.unit is distinct from input.unit;
  update public.daily_opening_stock_settings
    set opening_time=p_opening_time, is_active=coalesce(p_is_active,false),
        last_run_date=case when v_local_time >= p_opening_time then v_local_date else null end,
        updated_by=auth.uid(), updated_at=now()
    where id=true;
end; $$;

notify pgrst, 'reload schema';
