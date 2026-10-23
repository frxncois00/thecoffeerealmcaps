-- Admins can review every PO; staff can only read their own orders and evidence.
drop policy if exists "Internal users read purchase orders" on public.purchase_orders;
create policy "Internal users read purchase orders" on public.purchase_orders
  for select to authenticated
  using (public.is_admin_profile() or (public.is_staff_profile() and created_by = auth.uid()));

drop policy if exists "Internal users read purchase order items" on public.purchase_order_items;
create policy "Internal users read purchase order items" on public.purchase_order_items
  for select to authenticated
  using (exists (select 1 from public.purchase_orders where id = purchase_order_id));

drop policy if exists "Internal users read purchase order events" on public.purchase_order_events;
create policy "Internal users read purchase order events" on public.purchase_order_events
  for select to authenticated
  using (exists (select 1 from public.purchase_orders where id = purchase_order_id));

drop policy if exists "Internal users read purchase order documents" on public.purchase_order_documents;
create policy "Internal users read purchase order documents" on public.purchase_order_documents
  for select to authenticated
  using (exists (select 1 from public.purchase_orders where id = purchase_order_id));

drop policy if exists "Internal users add purchase order documents" on public.purchase_order_documents;
create policy "Internal users add purchase order documents" on public.purchase_order_documents
  for insert to authenticated
  with check (uploaded_by = auth.uid() and exists (
    select 1 from public.purchase_orders where id = purchase_order_id
  ));

drop policy if exists "Staff read purchase order documents" on storage.objects;
create policy "Staff read purchase order documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'purchase-order-documents' and exists (
    select 1 from public.purchase_orders where id::text = split_part(name, '/', 1)
  ));

drop policy if exists "Staff upload purchase order documents" on storage.objects;
create policy "Staff upload purchase order documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'purchase-order-documents' and exists (
    select 1 from public.purchase_orders where id::text = split_part(name, '/', 1)
  ));
