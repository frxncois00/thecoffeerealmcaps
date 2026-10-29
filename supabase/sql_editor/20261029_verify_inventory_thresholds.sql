with checks as (
  select
    'inventory_stock.critical_stock_level column'::text as check_name,
    case when exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='inventory_stock' and column_name='critical_stock_level'
    ) then 'PASS' else 'FAIL' end as status,
    'Required for ingredient Critical status'::text as details

  union all
  select
    'finished_products.critical_stock_level column',
    case when exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='finished_products' and column_name='critical_stock_level'
    ) then 'PASS' else 'FAIL' end,
    'Required for finished-product Critical status'

  union all
  select
    'Ingredient threshold percentages',
    case when count(*) filter (
      where critical_stock_level <> ceil(high_stock_level * 0.20)
         or min_stock_level <> ceil(high_stock_level * 0.45)
         or critical_stock_level > min_stock_level
         or min_stock_level > high_stock_level
    ) = 0 then 'PASS' else 'FAIL' end,
    count(*) filter (
      where critical_stock_level <> ceil(high_stock_level * 0.20)
         or min_stock_level <> ceil(high_stock_level * 0.45)
         or critical_stock_level > min_stock_level
         or min_stock_level > high_stock_level
    )::text || ' invalid ingredient rows'
  from public.inventory_stock

  union all
  select
    'Finished-product threshold percentages',
    case when count(*) filter (
      where critical_stock_level <> ceil(high_stock_level * 0.20)
         or min_stock_level <> ceil(high_stock_level * 0.45)
         or critical_stock_level > min_stock_level
         or min_stock_level > high_stock_level
    ) = 0 then 'PASS' else 'FAIL' end,
    count(*) filter (
      where critical_stock_level <> ceil(high_stock_level * 0.20)
         or min_stock_level <> ceil(high_stock_level * 0.45)
         or critical_stock_level > min_stock_level
         or min_stock_level > high_stock_level
    )::text || ' invalid finished-product rows'
  from public.finished_products

  union all
  select
    'Ingredient upsert function',
    case when to_regprocedure('public.staff_upsert_ingredient(uuid,text,text,text,text,numeric,numeric,numeric,text,text,numeric)') is not null then 'PASS' else 'FAIL' end,
    'Function accepts Critical, Low, and Restock Target values'

  union all
  select
    'Finished-product upsert function',
    case when to_regprocedure('public.staff_upsert_finished_product(uuid,text,text,uuid,text,numeric,numeric,numeric,text,text,numeric)') is not null then 'PASS' else 'FAIL' end,
    'Function accepts Critical, Low, and Restock Target values'

  union all
  select
    'Inventory notification function',
    case when to_regprocedure('public.capture_inventory_status_notification()') is not null then 'PASS' else 'FAIL' end,
    'Handles Out of Stock, Critical, Low Stock, and Stock Restored'

  union all
  select
    'Inventory notification triggers',
    case when count(*) = 2 then 'PASS' else 'FAIL' end,
    count(*)::text || ' of 2 triggers installed'
  from pg_trigger trigger
  join pg_class relation on relation.oid=trigger.tgrelid
  join pg_namespace namespace on namespace.oid=relation.relnamespace
  join pg_proc function on function.oid=trigger.tgfoid
  where not trigger.tgisinternal
    and namespace.nspname='public'
    and relation.relname in ('inventory_stock','finished_products')
    and trigger.tgname='capture_notification'
    and function.proname='capture_inventory_status_notification'
)
select check_name, status, details
from checks
order by check_name;

