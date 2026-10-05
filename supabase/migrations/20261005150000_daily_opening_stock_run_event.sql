-- Distinguish a completed scheduled reset from edits to its plan.
alter table public.daily_opening_stock_settings
  add column if not exists last_run_at timestamptz;

create or replace function public.run_daily_opening_stock()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_settings public.daily_opening_stock_settings%rowtype;
  v_line record;
  v_local_date date := timezone('Asia/Manila', now())::date;
  v_local_time time := timezone('Asia/Manila', now())::time;
  v_previous numeric;
  v_count integer := 0;
begin
  select * into v_settings from public.daily_opening_stock_settings where id=true for update;
  if not found or not v_settings.is_active or v_settings.last_run_date = v_local_date
    or v_local_time < v_settings.opening_time then return 0; end if;

  for v_line in
    select plan.finished_product_id,plan.opening_quantity,plan.unit
    from public.daily_opening_stock_items plan
    join public.finished_products product on product.id=plan.finished_product_id
    where not product.is_archived
  loop
    select quantity into v_previous from public.finished_products
      where id=v_line.finished_product_id for update;
    update public.finished_products
      set quantity=v_line.opening_quantity, unit=v_line.unit, updated_at=now()
      where id=v_line.finished_product_id;
    if v_previous is distinct from v_line.opening_quantity then
      insert into public.finished_product_movements(finished_product_id,movement_type,quantity,reason,created_by)
      values(v_line.finished_product_id,'adjustment',abs(v_line.opening_quantity-v_previous),
        format('Daily opening stock: %s to %s %s',v_previous,v_line.opening_quantity,v_line.unit),null);
    end if;
    v_count := v_count + 1;
  end loop;

  update public.daily_opening_stock_settings
    set last_run_date=v_local_date,
        last_run_at=case when v_count > 0 then now() else last_run_at end,
        updated_at=now()
    where id=true;
  return v_count;
end; $$;

notify pgrst, 'reload schema';
