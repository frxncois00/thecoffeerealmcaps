-- Stock quantity is available-to-sell stock. Commit it as soon as an order is
-- placed, including orders awaiting payment, so another channel cannot sell it.
-- The existing deduction ledger makes retries and preparation idempotent.
create or replace function public.deduct_order_ingredients(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype; v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status not in ('Order Received','Awaiting Payment Verification','Pending Confirmation','Preparing')
    or v_order.inventory_deducted_at is not null or coalesce(v_order.is_voided,false) then return; end if;
  for v_item in select id from public.order_items where order_id = p_order_id order by id loop
    perform public.deduct_order_item_inventory(v_item.id);
  end loop;
  update public.orders set inventory_deducted_at = now() where id = p_order_id;
end;
$$;
revoke all on function public.deduct_order_ingredients(uuid) from public, anon, authenticated;

create or replace function public.commit_placed_order_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists(select 1 from public.orders where id = new.order_id and order_source in ('customer_pos','cashier_pos')) then
    perform public.deduct_order_ingredients(new.order_id);
  end if;
  return new;
end;
$$;
revoke all on function public.commit_placed_order_stock() from public, anon, authenticated;

-- Wait until all lines exist, but commit stock before the checkout transaction
-- succeeds. Locked stock rows prevent two simultaneous checkouts overselling.
create constraint trigger commit_placed_order_stock_trigger
after insert on public.order_items deferrable initially deferred
for each row execute function public.commit_placed_order_stock();

create or replace function public.release_unprepared_order_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status in ('Order Received','Awaiting Payment Verification','Pending Confirmation')
    and (new.status = 'Cancelled' or (coalesce(new.is_voided,false) and not coalesce(old.is_voided,false))) then
    perform public.restore_order_inventory(new.id);
  end if;
  return new;
end;
$$;
revoke all on function public.release_unprepared_order_stock() from public, anon, authenticated;
create trigger release_unprepared_order_stock_trigger
after update of status, is_voided on public.orders
for each row execute function public.release_unprepared_order_stock();

-- Changing committed lines would bypass the ledger. Order edits require an
-- explicit cancel/reorder flow rather than silently retaining stale deductions.
create or replace function public.protect_committed_order_items() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists(select 1 from public.orders where id = case when tg_op = 'INSERT' then new.order_id else old.order_id end and inventory_deducted_at is not null) then
    raise exception 'Stock is already committed for this order. Cancel and place a new order to change its items.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.protect_committed_order_items() from public, anon, authenticated;
create trigger protect_committed_order_items_trigger
before insert or update of menu_item_id, quantity, customizations, order_id or delete on public.order_items
for each row execute function public.protect_committed_order_items();

-- Availability recomputation updates menu_items even when an item remains
-- available. Customers subscribe to this public signal, never raw stock rows.
do $$
declare v_table text;
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array array['menu_items','inventory_stock','finished_products'] loop
      if not exists(select 1 from pg_publication_tables where pubname = 'supabase_realtime'
        and schemaname = 'public' and tablename = v_table) then
        execute format('alter publication supabase_realtime add table public.%I',v_table);
      end if;
    end loop;
  end if;
end;
$$;
notify pgrst, 'reload schema';
