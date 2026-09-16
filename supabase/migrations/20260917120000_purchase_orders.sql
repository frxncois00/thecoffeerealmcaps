-- Purchase Orders for the internal inventory workflow.
-- Operations staff prepare and receive orders; admins approve and close them.
-- Cashiers can read the records but cannot mutate purchase orders or stock.

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  supplier_name text not null,
  supplier_contact text,
  requested_delivery_date date,
  supplier_reference text,
  reason text,
  notes text,
  receiving_notes text,
  closure_notes text,
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','rejected','sent','partially_received','received','disputed','closed','cancelled')),
  created_by uuid not null references public.profiles(id),
  submitted_by uuid references public.profiles(id),
  submitted_at timestamptz,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  rejected_by uuid references public.profiles(id),
  rejected_at timestamptz,
  rejection_reason text,
  sent_by uuid references public.profiles(id),
  sent_at timestamptz,
  received_by uuid references public.profiles(id),
  received_at timestamptz,
  closed_by uuid references public.profiles(id),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  item_type text not null check (item_type in ('ingredient','finished_product')),
  ingredient_id uuid references public.ingredients(id),
  finished_product_id uuid references public.finished_products(id),
  item_name text not null,
  unit text not null,
  quantity_ordered numeric not null check (quantity_ordered > 0),
  estimated_unit_cost numeric not null default 0 check (estimated_unit_cost >= 0),
  received_quantity numeric not null default 0 check (received_quantity >= 0),
  accepted_quantity numeric not null default 0 check (accepted_quantity >= 0),
  damaged_quantity numeric not null default 0 check (damaged_quantity >= 0),
  missing_quantity numeric not null default 0 check (missing_quantity >= 0),
  actual_unit_cost numeric check (actual_unit_cost is null or actual_unit_cost >= 0),
  batch_number text,
  expiration_date date,
  receiving_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(ingredient_id, finished_product_id) = 1)
);

create table if not exists public.purchase_order_events (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  action text not null,
  note text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists purchase_orders_status_updated_idx on public.purchase_orders(status, updated_at desc);
create index if not exists purchase_orders_supplier_idx on public.purchase_orders(lower(supplier_name));
create index if not exists purchase_order_items_order_idx on public.purchase_order_items(purchase_order_id);
create index if not exists purchase_order_events_order_idx on public.purchase_order_events(purchase_order_id, created_at desc);

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.purchase_order_events enable row level security;

drop policy if exists "Internal users read purchase orders" on public.purchase_orders;
create policy "Internal users read purchase orders" on public.purchase_orders
  for select to authenticated using (public.is_staff_profile());
drop policy if exists "Internal users read purchase order items" on public.purchase_order_items;
create policy "Internal users read purchase order items" on public.purchase_order_items
  for select to authenticated using (public.is_staff_profile());
drop policy if exists "Internal users read purchase order events" on public.purchase_order_events;
create policy "Internal users read purchase order events" on public.purchase_order_events
  for select to authenticated using (public.is_staff_profile());

create or replace function public.assert_purchase_order_access(p_admin_only boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare v_role text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select public.normalize_role(role) into v_role from public.profiles where id = auth.uid();
  if p_admin_only then
    if v_role <> 'admin' then raise exception 'Admin approval required'; end if;
  elsif v_role not in ('admin','staff','operational_staff') then
    raise exception 'Operations Staff or Admin access required';
  end if;
end;
$$;

create or replace function public.purchase_order_item_snapshot(p_item_type text, p_item_id uuid)
returns table(item_name text, item_unit text) language plpgsql security definer set search_path = public as $$
begin
  if p_item_type = 'ingredient' then
    return query select i.name, i.unit from public.ingredients i where i.id = p_item_id and not i.is_archived;
  elsif p_item_type = 'finished_product' then
    return query select p.name, p.unit from public.finished_products p where p.id = p_item_id and not p.is_archived;
  else
    raise exception 'Unsupported purchase order item type';
  end if;
end;
$$;

create or replace function public.save_purchase_order(
  p_id uuid,
  p_supplier_name text,
  p_supplier_contact text,
  p_requested_delivery_date date,
  p_reason text,
  p_notes text,
  p_items jsonb,
  p_submit boolean default false
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_status text := case when p_submit then 'pending_approval' else 'draft' end;
  v_existing_status text;
  v_line jsonb;
  v_item_type text;
  v_item_id uuid;
  v_name text;
  v_unit text;
  v_quantity numeric;
  v_cost numeric;
begin
  perform public.assert_purchase_order_access(false);
  if nullif(btrim(coalesce(p_supplier_name,'')), '') is null then raise exception 'Supplier name is required'; end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'Add at least one item'; end if;

  if p_id is null then
    insert into public.purchase_orders(id, po_number, supplier_name, supplier_contact, requested_delivery_date, reason, notes, status, created_by, submitted_by, submitted_at)
    values(v_id, 'PO-' || to_char(clock_timestamp(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)), btrim(p_supplier_name), nullif(btrim(coalesce(p_supplier_contact,'')),''), p_requested_delivery_date, nullif(btrim(coalesce(p_reason,'')),''), nullif(btrim(coalesce(p_notes,'')),''), v_status, auth.uid(), case when p_submit then auth.uid() end, case when p_submit then now() end);
  else
    select status into v_existing_status from public.purchase_orders where id = p_id for update;
    if not found then raise exception 'Purchase order not found'; end if;
    if v_existing_status <> 'draft' then raise exception 'Only Draft purchase orders can be edited'; end if;
    update public.purchase_orders set supplier_name=btrim(p_supplier_name), supplier_contact=nullif(btrim(coalesce(p_supplier_contact,'')),''), requested_delivery_date=p_requested_delivery_date, reason=nullif(btrim(coalesce(p_reason,'')),''), notes=nullif(btrim(coalesce(p_notes,'')),''), status=v_status, submitted_by=case when p_submit then auth.uid() else submitted_by end, submitted_at=case when p_submit then now() else submitted_at end, updated_at=now() where id=v_id;
  end if;

  delete from public.purchase_order_items where purchase_order_id = v_id;
  for v_line in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_item_type := lower(btrim(coalesce(v_line->>'item_type','')));
    v_item_id := nullif(v_line->>'item_id','')::uuid;
    v_quantity := (v_line->>'quantity_ordered')::numeric;
    v_cost := coalesce(nullif(v_line->>'estimated_unit_cost','')::numeric, 0);
    if v_item_type not in ('ingredient','finished_product') or v_item_id is null then raise exception 'Each PO line needs a valid inventory item'; end if;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Order quantities must be greater than zero'; end if;
    if v_cost < 0 then raise exception 'Estimated costs cannot be negative'; end if;
    select item_name, item_unit into v_name, v_unit from public.purchase_order_item_snapshot(v_item_type, v_item_id);
    if not found then raise exception 'One of the selected inventory items is unavailable'; end if;
    if exists (select 1 from public.purchase_order_items where purchase_order_id=v_id and ((v_item_type='ingredient' and ingredient_id=v_item_id) or (v_item_type='finished_product' and finished_product_id=v_item_id))) then raise exception 'An item can appear only once on a purchase order'; end if;
    insert into public.purchase_order_items(purchase_order_id,item_type,ingredient_id,finished_product_id,item_name,unit,quantity_ordered,estimated_unit_cost)
    values(v_id,v_item_type,case when v_item_type='ingredient' then v_item_id end,case when v_item_type='finished_product' then v_item_id end,v_name,v_unit,v_quantity,v_cost);
  end loop;

  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by)
  values(v_id, v_existing_status, v_status, case when p_submit then 'submitted' else 'saved' end, null, auth.uid());
  return v_id;
end;
$$;

create or replace function public.approve_purchase_order(p_id uuid, p_approved boolean, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text;
begin
  perform public.assert_purchase_order_access(true);
  select status into v_previous from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_previous <> 'pending_approval' then raise exception 'Only pending purchase orders can be reviewed'; end if;
  if not p_approved and nullif(btrim(coalesce(p_reason,'')),'') is null then raise exception 'A rejection reason is required'; end if;
  update public.purchase_orders set status=case when p_approved then 'approved' else 'rejected' end, approved_by=case when p_approved then auth.uid() else approved_by end, approved_at=case when p_approved then now() else approved_at end, rejected_by=case when not p_approved then auth.uid() else rejected_by end, rejected_at=case when not p_approved then now() else rejected_at end, rejection_reason=case when not p_approved then btrim(p_reason) else null end, updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,case when p_approved then 'approved' else 'rejected' end,case when p_approved then 'approved' else 'rejected' end,nullif(btrim(coalesce(p_reason,'')),''),auth.uid());
end;
$$;

create or replace function public.mark_purchase_order_sent(p_id uuid, p_supplier_reference text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text;
begin
  perform public.assert_purchase_order_access(false);
  select status into v_previous from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_previous <> 'approved' then raise exception 'Only approved purchase orders can be sent'; end if;
  update public.purchase_orders set status='sent', supplier_reference=nullif(btrim(coalesce(p_supplier_reference,'')),''), sent_by=auth.uid(), sent_at=now(), updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,created_by) values(p_id,v_previous,'sent','sent',auth.uid());
end;
$$;

create or replace function public.receive_purchase_order(p_id uuid, p_lines jsonb, p_receiving_notes text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_previous text;
  v_line jsonb;
  v_item_id uuid;
  v_stock_item_id uuid;
  v_received numeric;
  v_accepted numeric;
  v_damaged numeric;
  v_missing numeric;
  v_old_accepted numeric;
  v_all_complete boolean := true;
  v_any_received boolean := false;
  v_item_type text;
  v_actual_cost numeric;
  v_batch text;
  v_expiration date;
begin
  perform public.assert_purchase_order_access(false);
  select status into v_previous from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_previous not in ('sent','partially_received','disputed') then raise exception 'This purchase order is not ready for receiving'; end if;

  for v_line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    v_item_id := nullif(v_line->>'id','')::uuid;
    v_received := coalesce(nullif(v_line->>'received_quantity','')::numeric,0);
    v_accepted := coalesce(nullif(v_line->>'accepted_quantity','')::numeric,0);
    v_damaged := coalesce(nullif(v_line->>'damaged_quantity','')::numeric,0);
    v_missing := coalesce(nullif(v_line->>'missing_quantity','')::numeric,0);
    v_actual_cost := nullif(v_line->>'actual_unit_cost','')::numeric;
    v_batch := nullif(btrim(coalesce(v_line->>'batch_number','')),'');
    v_expiration := nullif(v_line->>'expiration_date','')::date;
    select item_type, accepted_quantity, case when item_type = 'ingredient' then ingredient_id else finished_product_id end
      into v_item_type, v_old_accepted, v_stock_item_id
      from public.purchase_order_items where id=v_item_id and purchase_order_id=p_id for update;
    if not found then raise exception 'A receiving line does not belong to this purchase order'; end if;
    if v_stock_item_id is null then raise exception 'The receiving line is not linked to an inventory item'; end if;
    if v_received < 0 or v_accepted < 0 or v_damaged < 0 or v_missing < 0 then raise exception 'Receiving quantities cannot be negative'; end if;
    if v_accepted > v_received then raise exception 'Accepted quantity cannot exceed received quantity'; end if;
    if v_received + v_missing < (select quantity_ordered from public.purchase_order_items where id=v_item_id) then v_all_complete := false; end if;
    if v_received > 0 then v_any_received := true; end if;
    if v_accepted < (select quantity_ordered from public.purchase_order_items where id=v_item_id) then v_all_complete := false; end if;
    if v_accepted < v_old_accepted then raise exception 'Accepted quantities cannot be reduced'; end if;
    if v_accepted > v_old_accepted then perform public.staff_adjust_stock(v_item_type, v_stock_item_id, v_accepted-v_old_accepted, 'restock', 'PO ' || (select po_number from public.purchase_orders where id=p_id) || ' received'); end if;
    update public.purchase_order_items set received_quantity=v_received, accepted_quantity=v_accepted, damaged_quantity=v_damaged, missing_quantity=v_missing, actual_unit_cost=coalesce(v_actual_cost,actual_unit_cost), batch_number=coalesce(v_batch,batch_number), expiration_date=coalesce(v_expiration,expiration_date), receiving_notes=nullif(btrim(coalesce(v_line->>'receiving_notes','')),''), updated_at=now() where id=v_item_id;
    if v_actual_cost is not null then
      if v_item_type = 'ingredient' then update public.ingredients set cost_per_unit=v_actual_cost where id=v_stock_item_id;
      else update public.finished_products set cost_per_unit=v_actual_cost, updated_at=now() where id=v_stock_item_id; end if;
    end if;
    if v_expiration is not null then
      if v_item_type = 'ingredient' then update public.ingredients set expiration_date=v_expiration where id=v_stock_item_id;
      else update public.finished_products set expiration_date=v_expiration, updated_at=now() where id=v_stock_item_id; end if;
    end if;
  end loop;

  update public.purchase_orders set status=case when v_all_complete then 'received' when v_any_received then 'partially_received' else v_previous end, receiving_notes=coalesce(nullif(btrim(coalesce(p_receiving_notes,'')),''),receiving_notes), received_by=auth.uid(), received_at=now(), updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,case when v_all_complete then 'received' when v_any_received then 'partially_received' else v_previous end,'received',nullif(btrim(coalesce(p_receiving_notes,'')),''),auth.uid());
end;
$$;

create or replace function public.close_purchase_order(p_id uuid, p_notes text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text;
begin
  perform public.assert_purchase_order_access(true);
  select status into v_previous from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_previous not in ('received','partially_received','disputed') then raise exception 'Only received or resolved purchase orders can be closed'; end if;
  update public.purchase_orders set status='closed', closure_notes=nullif(btrim(coalesce(p_notes,'')),''), closed_by=auth.uid(), closed_at=now(), updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,'closed','closed',nullif(btrim(coalesce(p_notes,'')),''),auth.uid());
end;
$$;

create or replace function public.cancel_purchase_order(p_id uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text;
begin
  perform public.assert_purchase_order_access(false);
  select status into v_previous from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_previous in ('closed','cancelled','received') then raise exception 'This purchase order cannot be cancelled'; end if;
  update public.purchase_orders set status='cancelled', closure_notes=nullif(btrim(coalesce(p_reason,'')),''), updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,'cancelled','cancelled',nullif(btrim(coalesce(p_reason,'')),''),auth.uid());
end;
$$;

revoke all on function public.assert_purchase_order_access(boolean) from public;
revoke all on function public.purchase_order_item_snapshot(text,uuid) from public;
revoke all on function public.save_purchase_order(uuid,text,text,date,text,text,jsonb,boolean) from public;
revoke all on function public.approve_purchase_order(uuid,boolean,text) from public;
revoke all on function public.mark_purchase_order_sent(uuid,text) from public;
revoke all on function public.receive_purchase_order(uuid,jsonb,text) from public;
revoke all on function public.close_purchase_order(uuid,text) from public;
revoke all on function public.cancel_purchase_order(uuid,text) from public;
grant execute on function public.save_purchase_order(uuid,text,text,date,text,text,jsonb,boolean) to authenticated;
grant execute on function public.approve_purchase_order(uuid,boolean,text) to authenticated;
grant execute on function public.mark_purchase_order_sent(uuid,text) to authenticated;
grant execute on function public.receive_purchase_order(uuid,jsonb,text) to authenticated;
grant execute on function public.close_purchase_order(uuid,text) to authenticated;
grant execute on function public.cancel_purchase_order(uuid,text) to authenticated;

notify pgrst, 'reload schema';
