create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.daily_opening_stock_settings (
  id boolean primary key default true check (id),
  opening_time time not null default '09:00',
  is_active boolean not null default false,
  last_run_date date,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_opening_stock_items (
  finished_product_id uuid primary key references public.finished_products(id) on delete cascade,
  opening_quantity numeric not null check (opening_quantity >= 0),
  unit text not null check (length(btrim(unit)) between 1 and 24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.daily_opening_stock_settings (id) values (true) on conflict (id) do nothing;

alter table public.daily_opening_stock_settings enable row level security;
alter table public.daily_opening_stock_items enable row level security;
create policy "Staff read daily opening stock settings" on public.daily_opening_stock_settings for select to authenticated using (public.is_staff_profile());
create policy "Staff read daily opening stock items" on public.daily_opening_stock_items for select to authenticated using (public.is_staff_profile());

create or replace function public.staff_save_daily_opening_stock_plan(p_opening_time time, p_is_active boolean, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_item jsonb; v_product_id uuid; v_quantity numeric; v_unit text; v_local_date date := timezone('Asia/Manila', now())::date; v_local_time time := timezone('Asia/Manila', now())::time;
begin
  perform public.assert_inventory_writer();
  if p_opening_time is null then raise exception 'Reset time is required'; end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'Select at least one product'; end if;
  create temporary table if not exists opening_stock_input(product_id uuid primary key, quantity numeric, unit text) on commit drop;
  truncate opening_stock_input;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := nullif(v_item->>'product_id','')::uuid;
    v_quantity := nullif(v_item->>'opening_quantity','')::numeric;
    v_unit := btrim(coalesce(v_item->>'unit',''));
    if v_product_id is null or not exists (select 1 from public.finished_products where id=v_product_id and not is_archived) then raise exception 'A selected product is unavailable'; end if;
    if v_quantity is null or v_quantity < 0 then raise exception 'Starting quantities must be zero or greater'; end if;
    if length(v_unit) < 1 or length(v_unit) > 24 then raise exception 'Enter a valid unit'; end if;
    insert into opening_stock_input values(v_product_id,v_quantity,v_unit);
  end loop;
  delete from public.daily_opening_stock_items;
  insert into public.daily_opening_stock_items(finished_product_id,opening_quantity,unit)
    select product_id,quantity,unit from opening_stock_input;
  update public.finished_products product set unit=input.unit, updated_at=now() from opening_stock_input input where product.id=input.product_id and product.unit is distinct from input.unit;
  update public.daily_opening_stock_settings set opening_time=p_opening_time, is_active=coalesce(p_is_active,false),
    last_run_date=case when v_local_time >= p_opening_time then v_local_date else null end,
    updated_by=auth.uid(), updated_at=now() where id=true;
end; $$;

create or replace function public.run_daily_opening_stock()
returns integer language plpgsql security definer set search_path = public as $$
declare v_settings public.daily_opening_stock_settings%rowtype; v_line record; v_local_date date := timezone('Asia/Manila', now())::date; v_local_time time := timezone('Asia/Manila', now())::time; v_previous numeric; v_count integer := 0;
begin
  select * into v_settings from public.daily_opening_stock_settings where id=true for update;
  if not found or not v_settings.is_active or v_settings.last_run_date = v_local_date or v_local_time < v_settings.opening_time then return 0; end if;
  for v_line in select plan.finished_product_id,plan.opening_quantity,plan.unit from public.daily_opening_stock_items plan join public.finished_products product on product.id=plan.finished_product_id where not product.is_archived loop
    select quantity into v_previous from public.finished_products where id=v_line.finished_product_id for update;
    update public.finished_products set quantity=v_line.opening_quantity, unit=v_line.unit, updated_at=now() where id=v_line.finished_product_id;
    if v_previous is distinct from v_line.opening_quantity then
      insert into public.finished_product_movements(finished_product_id,movement_type,quantity,reason,created_by)
      values(v_line.finished_product_id,'adjustment',abs(v_line.opening_quantity-v_previous),format('Daily opening stock: %s to %s %s',v_previous,v_line.opening_quantity,v_line.unit),null);
    end if;
    v_count := v_count + 1;
  end loop;
  update public.daily_opening_stock_settings set last_run_date=v_local_date,updated_at=now() where id=true;
  return v_count;
end; $$;

revoke all on function public.staff_save_daily_opening_stock_plan(time,boolean,jsonb) from public;
grant execute on function public.staff_save_daily_opening_stock_plan(time,boolean,jsonb) to authenticated;
revoke all on function public.run_daily_opening_stock() from public;

do $$ declare v_job_id bigint; begin
  for v_job_id in select jobid from cron.job where jobname='daily-opening-stock' loop perform cron.unschedule(v_job_id); end loop;
end $$;
select cron.schedule('daily-opening-stock','* * * * *',$$select public.run_daily_opening_stock();$$);

notify pgrst, 'reload schema';
