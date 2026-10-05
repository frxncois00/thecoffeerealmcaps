-- The order is approved before it is sent. Receiving closes it and posts stock.
begin;

alter table public.purchase_orders drop constraint if exists purchase_orders_status_check;
alter table public.purchase_orders add constraint purchase_orders_status_check
  check (status in ('draft','pending_approval','approved','rejected','sent','partially_received','pending_receiving_review','approved_for_payment','payment_review','received','disputed','closed','returned','cancelled'));

alter table public.purchase_order_documents drop constraint if exists purchase_order_documents_document_type_check;
alter table public.purchase_order_documents add constraint purchase_order_documents_document_type_check
  check (document_type in ('receiving_proof','supplier_invoice','supplier_receipt','payment_receipt','issue_evidence'));

update storage.buckets set allowed_mime_types=array[
  'image/jpeg','image/png','image/webp','application/pdf','application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] where id='purchase-order-documents';

create or replace function public.submit_purchase_order_receiving(p_id uuid, p_lines jsonb, p_receiving_notes text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_previous text;
  v_number text;
  v_posted timestamptz;
  v_line jsonb;
  v_item record;
  v_count integer;
begin
  perform public.assert_purchase_order_access(false);
  select status, po_number, inventory_posted_at into v_previous, v_number, v_posted
    from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  -- Older in-flight records may be received again through the new flow.
  if v_previous not in ('sent','pending_receiving_review','approved_for_payment','payment_review')
    then raise exception 'This purchase order is not ready for receiving'; end if;
  if v_posted is not null then raise exception 'Inventory was already posted for this order'; end if;
  if not exists (select 1 from public.purchase_order_documents where purchase_order_id=p_id and document_type='receiving_proof')
    then raise exception 'Proof of items received is required'; end if;
  if not exists (select 1 from public.purchase_order_documents where purchase_order_id=p_id and document_type='supplier_invoice')
    then raise exception 'Supplier invoice is required'; end if;
  if not exists (select 1 from public.purchase_order_documents where purchase_order_id=p_id and document_type='supplier_receipt')
    then raise exception 'Supplier delivery receipt is required'; end if;
  if coalesce(jsonb_typeof(p_lines),'') <> 'array' then raise exception 'Receiving lines are required'; end if;
  select count(*) into v_count from public.purchase_order_items where purchase_order_id=p_id;
  if jsonb_array_length(p_lines) <> v_count then raise exception 'Every ordered item must be confirmed'; end if;
  if (select count(distinct line->>'id') from jsonb_array_elements(p_lines) line) <> v_count
    then raise exception 'Each ordered item must appear exactly once'; end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    select * into v_item from public.purchase_order_items
      where id=nullif(v_line->>'id','')::uuid and purchase_order_id=p_id for update;
    if not found then raise exception 'A receiving line does not belong to this purchase order'; end if;
    if coalesce(nullif(v_line->>'received_quantity','')::numeric,-1) <> v_item.quantity_ordered
      or coalesce(nullif(v_line->>'accepted_quantity','')::numeric,-1) <> v_item.quantity_ordered
      or coalesce(nullif(v_line->>'damaged_quantity','')::numeric,-1) <> 0
      or coalesce(nullif(v_line->>'missing_quantity','')::numeric,-1) <> 0
      then raise exception 'Only complete, undamaged deliveries can be received'; end if;
    update public.purchase_order_items set
      received_quantity=v_item.quantity_ordered,
      accepted_quantity=v_item.quantity_ordered,
      damaged_quantity=0,
      missing_quantity=0,
      actual_unit_cost=coalesce(nullif(v_line->>'actual_unit_cost','')::numeric,actual_unit_cost),
      updated_at=now()
      where id=v_item.id;
    perform public.staff_adjust_stock(v_item.item_type,
      case when v_item.item_type='ingredient' then v_item.ingredient_id else v_item.finished_product_id end,
      v_item.quantity_ordered, 'restock', 'PO ' || v_number || ' received');
  end loop;

  update public.purchase_orders set status='closed', received_by=auth.uid(), received_at=now(),
    receiving_submitted_by=auth.uid(), receiving_submitted_at=now(),
    receiving_notes=nullif(btrim(coalesce(p_receiving_notes,'')),''),
    inventory_posted_at=now(), closed_by=auth.uid(), closed_at=now(), updated_at=now()
    where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by)
    values(p_id,v_previous,'closed','received',nullif(btrim(coalesce(p_receiving_notes,'')),''),auth.uid());
end; $$;

create or replace function public.report_purchase_order_issue(p_id uuid, p_reason text, p_resolution text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text; v_posted timestamptz;
begin
  perform public.assert_purchase_order_access(false);
  select status, inventory_posted_at into v_previous, v_posted from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_previous not in ('sent','pending_receiving_review','approved_for_payment','payment_review') or v_posted is not null
    then raise exception 'This purchase order cannot be returned at this stage'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null then raise exception 'Issue reason is required'; end if;
  update public.purchase_orders set status='returned', issue_reason=btrim(p_reason),
    requested_resolution=coalesce(nullif(btrim(coalesce(p_resolution,'')),''),'Return items'),
    receiving_notes=nullif(btrim(coalesce(p_note,'')),''),
    closed_by=auth.uid(), closed_at=now(), updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by)
    values(p_id,v_previous,'returned','returned',
      concat(btrim(p_reason), case when nullif(btrim(coalesce(p_note,'')),'') is not null then ' · '||btrim(p_note) else '' end),auth.uid());
end; $$;

-- Recording payment is bookkeeping on a completed order, not another approval.
create or replace function public.submit_purchase_order_payment(p_id uuid, p_amount numeric, p_method text, p_reference text) returns void
language plpgsql security definer set search_path = public as $$
declare v_status text; v_paid timestamptz;
begin
  perform public.assert_purchase_order_access(true);
  select status, payment_submitted_at into v_status, v_paid from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_status <> 'closed' then raise exception 'Only completed orders can have payment recorded'; end if;
  if v_paid is not null then raise exception 'Payment is already recorded'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'Payment amount is required'; end if;
  if nullif(btrim(coalesce(p_method,'')),'') is null then raise exception 'Payment method is required'; end if;
  if not exists (select 1 from public.purchase_order_documents where purchase_order_id=p_id and document_type='payment_receipt')
    then raise exception 'Payment receipt is required'; end if;
  update public.purchase_orders set payment_amount=p_amount, payment_method=btrim(p_method),
    payment_reference=nullif(btrim(coalesce(p_reference,'')),''),
    payment_submitted_by=auth.uid(), payment_submitted_at=now(), updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by)
    values(p_id,'closed','closed','payment_recorded',nullif(btrim(coalesce(p_reference,'')),''),auth.uid());
end; $$;

-- Old RPCs cannot bypass receiving and stock posting rules.
create or replace function public.receive_purchase_order(p_id uuid, p_lines jsonb, p_receiving_notes text default null) returns void
language plpgsql security definer set search_path = public as $$
begin raise exception 'Use the current delivery receiving flow'; end; $$;
create or replace function public.close_purchase_order(p_id uuid, p_notes text default null) returns void
language plpgsql security definer set search_path = public as $$
begin raise exception 'Orders close automatically when received or returned'; end; $$;
create or replace function public.review_purchase_order_receiving(p_id uuid, p_approved boolean, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin raise exception 'Receiving no longer requires approval'; end; $$;
create or replace function public.verify_purchase_order_payment(p_id uuid, p_approved boolean, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin raise exception 'Payment verification is no longer part of the purchase order flow'; end; $$;

create or replace function public.cancel_purchase_order(p_id uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text;
begin
  perform public.assert_purchase_order_access(false);
  select status into v_previous from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_previous not in ('draft','pending_approval','approved','rejected')
    then raise exception 'This purchase order cannot be cancelled'; end if;
  update public.purchase_orders set status='cancelled', closure_notes=nullif(btrim(coalesce(p_reason,'')),''), updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by)
    values(p_id,v_previous,'cancelled','cancelled',nullif(btrim(coalesce(p_reason,'')),''),auth.uid());
end; $$;

commit;
notify pgrst, 'reload schema';
