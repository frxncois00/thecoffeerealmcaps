-- Use the same conservative per-unit estimate as the customer display.
-- Validate after all lines exist, before the transaction can commit.
create or replace function public.validate_order_preparation_schedule() returns trigger
language plpgsql security definer set search_path=public as $$
declare o public.orders%rowtype; prep numeric;
begin
  select * into o from public.orders where id=new.order_id;
  if o.order_source <> 'customer_pos' then return new; end if;
  select greatest(5,ceil(sum(i.quantity * coalesce(m.prep_time_minutes,
    case when m.inventory_source='products' then 5 when m.item_type='drink' then 8 when m.item_type='food' then 15 else 10 end))/5)*5)+5
    into prep from public.order_items i join public.menu_items m on m.id=i.menu_item_id where i.order_id=o.id;
  if o.schedule_date is null or o.schedule_time is null or
    o.schedule_date+o.schedule_time <= (clock_timestamp() at time zone 'Asia/Manila') +
      make_interval(mins => greatest(case when o.order_type='delivery' then 60 else 30 end,coalesce(prep,30))::integer) then
    raise exception 'This time no longer allows enough preparation time. Choose a later time.';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_order_preparation_schedule() from public,anon,authenticated;
drop trigger if exists validate_order_preparation_schedule_trigger on public.order_items;
create constraint trigger validate_order_preparation_schedule_trigger
after insert on public.order_items deferrable initially deferred
for each row execute function public.validate_order_preparation_schedule();
