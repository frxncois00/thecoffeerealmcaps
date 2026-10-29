alter table public.inventory_stock
  add column if not exists critical_stock_level numeric not null default 0
  check (critical_stock_level >= 0);

alter table public.finished_products
  add column if not exists critical_stock_level numeric not null default 0
  check (critical_stock_level >= 0);

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

alter table public.inventory_stock drop constraint if exists inventory_stock_status_thresholds_check;
alter table public.inventory_stock add constraint inventory_stock_status_thresholds_check
  check (critical_stock_level <= min_stock_level and min_stock_level <= high_stock_level);

alter table public.finished_products drop constraint if exists finished_products_status_thresholds_check;
alter table public.finished_products add constraint finished_products_status_thresholds_check
  check (critical_stock_level <= min_stock_level and min_stock_level <= high_stock_level);

