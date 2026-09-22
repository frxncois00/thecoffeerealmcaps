-- Purchase order receiving evidence, admin review, and payment verification.
alter table public.purchase_orders
  drop constraint if exists purchase_orders_status_check;
alter table public.purchase_orders
  add constraint purchase_orders_status_check check (status in ('draft','pending_approval','approved','rejected','sent','partially_received','pending_receiving_review','approved_for_payment','payment_review','received','disputed','closed','cancelled'));

alter table public.purchase_orders
  add column if not exists receiving_submitted_by uuid references public.profiles(id),
  add column if not exists receiving_submitted_at timestamptz,
  add column if not exists receiving_reviewed_by uuid references public.profiles(id),
  add column if not exists receiving_reviewed_at timestamptz,
  add column if not exists receiving_review_note text,
  add column if not exists issue_reason text,
  add column if not exists requested_resolution text,
  add column if not exists payment_amount numeric,
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists payment_submitted_by uuid references public.profiles(id),
  add column if not exists payment_submitted_at timestamptz,
  add column if not exists payment_verified_by uuid references public.profiles(id),
  add column if not exists payment_verified_at timestamptz,
  add column if not exists payment_review_note text,
  add column if not exists inventory_posted_at timestamptz;

create table if not exists public.purchase_order_documents (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  document_type text not null check (document_type in ('receiving_proof','supplier_invoice','payment_receipt')),
  storage_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.purchase_order_documents enable row level security;
drop policy if exists "Internal users read purchase order documents" on public.purchase_order_documents;
create policy "Internal users read purchase order documents" on public.purchase_order_documents for select to authenticated using (public.is_staff_profile());
drop policy if exists "Internal users add purchase order documents" on public.purchase_order_documents;
create policy "Internal users add purchase order documents" on public.purchase_order_documents for insert to authenticated with check (public.is_staff_profile() and uploaded_by=auth.uid());
create index if not exists purchase_order_documents_order_idx on public.purchase_order_documents(purchase_order_id, document_type, created_at desc);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('purchase-order-documents','purchase-order-documents',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set file_size_limit=10485760, allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Staff upload purchase order documents" on storage.objects;
create policy "Staff upload purchase order documents" on storage.objects for insert to authenticated with check (bucket_id='purchase-order-documents' and public.is_staff_profile());
drop policy if exists "Staff read purchase order documents" on storage.objects;
create policy "Staff read purchase order documents" on storage.objects for select to authenticated using (bucket_id='purchase-order-documents' and public.is_staff_profile());

create or replace function public.submit_purchase_order_receiving(p_id uuid, p_lines jsonb, p_receiving_notes text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text; v_line jsonb; v_item_id uuid; v_received numeric; v_accepted numeric; v_damaged numeric; v_missing numeric; v_actual_cost numeric; v_batch text; v_expiration date;
begin
  perform public.assert_purchase_order_access(false);
  select status into v_previous from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_previous not in ('sent','partially_received','disputed') then raise exception 'This purchase order is not ready for receiving'; end if;
  if not exists (select 1 from public.purchase_order_documents where purchase_order_id=p_id and document_type='receiving_proof') then raise exception 'Proof of items received is required'; end if;
  if not exists (select 1 from public.purchase_order_documents where purchase_order_id=p_id and document_type='supplier_invoice') then raise exception 'Supplier invoice is required'; end if;
  for v_line in select * from jsonb_array_elements(coalesce(p_lines,'[]'::jsonb)) loop
    v_item_id := nullif(v_line->>'id','')::uuid;
    v_received := coalesce(nullif(v_line->>'received_quantity','')::numeric,0); v_accepted := coalesce(nullif(v_line->>'accepted_quantity','')::numeric,0);
    v_damaged := coalesce(nullif(v_line->>'damaged_quantity','')::numeric,0); v_missing := coalesce(nullif(v_line->>'missing_quantity','')::numeric,0);
    v_actual_cost := nullif(v_line->>'actual_unit_cost','')::numeric; v_batch := nullif(btrim(coalesce(v_line->>'batch_number','')),''); v_expiration := nullif(v_line->>'expiration_date','')::date;
    if not exists (select 1 from public.purchase_order_items where id=v_item_id and purchase_order_id=p_id) then raise exception 'A receiving line does not belong to this purchase order'; end if;
    if v_received < 0 or v_accepted < 0 or v_damaged < 0 or v_missing < 0 then raise exception 'Receiving quantities cannot be negative'; end if;
    if v_accepted > v_received then raise exception 'Accepted quantity cannot exceed received quantity'; end if;
    update public.purchase_order_items set received_quantity=v_received, accepted_quantity=v_accepted, damaged_quantity=v_damaged, missing_quantity=v_missing, actual_unit_cost=coalesce(v_actual_cost,actual_unit_cost), batch_number=coalesce(v_batch,batch_number), expiration_date=coalesce(v_expiration,expiration_date), receiving_notes=nullif(btrim(coalesce(v_line->>'receiving_notes','')),''), updated_at=now() where id=v_item_id;
  end loop;
  update public.purchase_orders set status='pending_receiving_review', receiving_notes=coalesce(nullif(btrim(coalesce(p_receiving_notes,'')),''),receiving_notes), receiving_submitted_by=auth.uid(), receiving_submitted_at=now(), updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,'pending_receiving_review','receiving_submitted',nullif(btrim(coalesce(p_receiving_notes,'')),''),auth.uid());
end; $$;

create or replace function public.review_purchase_order_receiving(p_id uuid, p_approved boolean, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text; begin perform public.assert_purchase_order_access(true); select status into v_previous from public.purchase_orders where id=p_id for update; if v_previous <> 'pending_receiving_review' then raise exception 'This receiving record is not awaiting review'; end if; update public.purchase_orders set status=case when p_approved then 'approved_for_payment' else 'disputed' end, receiving_reviewed_by=auth.uid(), receiving_reviewed_at=now(), receiving_review_note=nullif(btrim(coalesce(p_note,'')),''), updated_at=now() where id=p_id; insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,case when p_approved then 'approved_for_payment' else 'disputed' end,case when p_approved then 'receiving_approved' else 'receiving_rejected' end,nullif(btrim(coalesce(p_note,'')),''),auth.uid()); end; $$;

create or replace function public.report_purchase_order_issue(p_id uuid, p_reason text, p_resolution text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text; begin perform public.assert_purchase_order_access(false); select status into v_previous from public.purchase_orders where id=p_id for update; if v_previous not in ('sent','partially_received') then raise exception 'This purchase order cannot be reported at this stage'; end if; if nullif(btrim(coalesce(p_reason,'')),'') is null or nullif(btrim(coalesce(p_resolution,'')),'') is null then raise exception 'Issue reason and requested resolution are required'; end if; update public.purchase_orders set status='disputed', issue_reason=btrim(p_reason), requested_resolution=btrim(p_resolution), receiving_notes=coalesce(nullif(btrim(coalesce(p_note,'')),''),receiving_notes), updated_at=now() where id=p_id; insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,'disputed','issue_reported',concat(btrim(p_reason),' · ',btrim(p_resolution),case when nullif(btrim(coalesce(p_note,'')),'') is not null then ' · '||btrim(p_note) else '' end),auth.uid()); end; $$;

create or replace function public.submit_purchase_order_payment(p_id uuid, p_amount numeric, p_method text, p_reference text) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text; begin perform public.assert_purchase_order_access(false); select status into v_previous from public.purchase_orders where id=p_id for update; if v_previous <> 'approved_for_payment' then raise exception 'This purchase order is not ready for payment'; end if; if p_amount is null or p_amount < 0 then raise exception 'Payment amount is required'; end if; if not exists (select 1 from public.purchase_order_documents where purchase_order_id=p_id and document_type='payment_receipt') then raise exception 'Supplier payment receipt is required'; end if; update public.purchase_orders set status='payment_review', payment_amount=p_amount, payment_method=nullif(btrim(coalesce(p_method,'')),''), payment_reference=nullif(btrim(coalesce(p_reference,'')),''), payment_submitted_by=auth.uid(), payment_submitted_at=now(), updated_at=now() where id=p_id; insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,'payment_review','payment_submitted',nullif(btrim(coalesce(p_reference,'')),''),auth.uid()); end; $$;

create or replace function public.verify_purchase_order_payment(p_id uuid, p_approved boolean, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_previous text; v_posted timestamptz; v_line record; begin perform public.assert_purchase_order_access(true); select status, inventory_posted_at into v_previous, v_posted from public.purchase_orders where id=p_id for update; if v_previous <> 'payment_review' then raise exception 'This payment is not awaiting review'; end if; if p_approved and v_posted is null then for v_line in select * from public.purchase_order_items where purchase_order_id=p_id loop if v_line.accepted_quantity > 0 then perform public.staff_adjust_stock(v_line.item_type, case when v_line.item_type='ingredient' then v_line.ingredient_id else v_line.finished_product_id end, v_line.accepted_quantity, 'restock', 'PO ' || (select po_number from public.purchase_orders where id=p_id) || ' payment verified'); end if; if v_line.actual_unit_cost is not null then if v_line.item_type='ingredient' then update public.ingredients set cost_per_unit=v_line.actual_unit_cost, expiration_date=coalesce(v_line.expiration_date,expiration_date) where id=v_line.ingredient_id; else update public.finished_products set cost_per_unit=v_line.actual_unit_cost, expiration_date=coalesce(v_line.expiration_date,expiration_date), updated_at=now() where id=v_line.finished_product_id; end if; end if; end loop; end if; update public.purchase_orders set status=case when p_approved then 'closed' else 'approved_for_payment' end, inventory_posted_at=case when p_approved then coalesce(v_posted,now()) else v_posted end, payment_verified_by=case when p_approved then auth.uid() else null end, payment_verified_at=case when p_approved then now() else null end, payment_review_note=nullif(btrim(coalesce(p_note,'')),''), closed_by=case when p_approved then auth.uid() else null end, closed_at=case when p_approved then now() else null end, updated_at=now() where id=p_id; insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_previous,case when p_approved then 'closed' else 'approved_for_payment' end,case when p_approved then 'payment_verified' else 'payment_rejected' end,nullif(btrim(coalesce(p_note,'')),''),auth.uid()); end; $$;

grant execute on function public.submit_purchase_order_receiving(uuid,jsonb,text) to authenticated;
grant execute on function public.review_purchase_order_receiving(uuid,boolean,text) to authenticated;
grant execute on function public.report_purchase_order_issue(uuid,text,text,text) to authenticated;
grant execute on function public.submit_purchase_order_payment(uuid,numeric,text,text) to authenticated;
grant execute on function public.verify_purchase_order_payment(uuid,boolean,text) to authenticated;
notify pgrst, 'reload schema';
