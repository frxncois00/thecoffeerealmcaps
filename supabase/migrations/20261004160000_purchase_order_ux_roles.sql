-- Align payment ownership and revision with the purchasing workflow.
begin;
create or replace function public.submit_purchase_order_payment(p_id uuid, p_amount numeric, p_method text, p_reference text) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text; begin perform public.assert_purchase_order_access(true); select status into v_previous from public.purchase_orders where id=p_id for update; if v_previous <> 'approved_for_payment' then raise exception 'This purchase order is not ready for payment'; end if; if p_amount is null or p_amount < 0 then raise exception 'Payment amount is required'; end if; if not exists (select 1 from public.purchase_order_documents where purchase_order_id=p_id and document_type='payment_receipt') then raise exception 'Supplier payment receipt is required'; end if; update public.purchase_orders set status='payment_review', payment_amount=p_amount, payment_method=nullif(btrim(coalesce(p_method,'')),''), payment_reference=nullif(btrim(coalesce(p_reference,'')),''), payment_submitted_by=auth.uid(), payment_submitted_at=now(), updated_at=now() where id=p_id; insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,'payment_review','payment_submitted',nullif(btrim(coalesce(p_reference,'')),''),auth.uid()); end; $$;

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
    if v_existing_status not in ('draft','rejected') then raise exception 'Only draft or returned purchase orders can be edited'; end if;
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


commit;
