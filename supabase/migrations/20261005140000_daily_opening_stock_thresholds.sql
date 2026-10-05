-- Each planned opening quantity is the product's healthy stock point.
-- Warn at one quarter of that quantity, rounded up to a whole item.
create or replace function public.sync_daily_opening_stock_thresholds()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.finished_products
  set min_stock_level = ceil(new.opening_quantity / 4),
      high_stock_level = new.opening_quantity,
      updated_at = now()
  where id = new.finished_product_id
    and (min_stock_level, high_stock_level)
      is distinct from (ceil(new.opening_quantity / 4), new.opening_quantity);
  return new;
end; $$;

drop trigger if exists sync_daily_opening_stock_thresholds on public.daily_opening_stock_items;
create trigger sync_daily_opening_stock_thresholds
after insert or update of opening_quantity on public.daily_opening_stock_items
for each row execute function public.sync_daily_opening_stock_thresholds();

-- Apply the rule to products already selected in the saved daily plan.
update public.finished_products product
set min_stock_level = ceil(plan.opening_quantity / 4),
    high_stock_level = plan.opening_quantity,
    updated_at = now()
from public.daily_opening_stock_items plan
where product.id = plan.finished_product_id
  and (product.min_stock_level, product.high_stock_level)
    is distinct from (ceil(plan.opening_quantity / 4), plan.opening_quantity);

notify pgrst, 'reload schema';
