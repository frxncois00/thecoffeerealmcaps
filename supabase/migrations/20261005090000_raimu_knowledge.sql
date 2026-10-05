-- Approved, store-scoped knowledge. Live operational data stays in its source tables.
create table if not exists public.raimu_knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 3 and 160),
  category text not null check (category in ('policy','procedure','recipe','menu','inventory','orders','payments','customers','system','other')),
  content text not null check (length(btrim(content)) between 10 and 20000),
  allowed_roles text[] not null default array['admin','staff']::text[]
    check (allowed_roles <@ array['admin','staff','cashier']::text[] and cardinality(allowed_roles) > 0),
  status text not null default 'draft' check (status in ('draft','published','retired')),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored
);

create index if not exists raimu_knowledge_search_idx on public.raimu_knowledge using gin (search_vector);
create index if not exists raimu_knowledge_status_idx on public.raimu_knowledge (status, updated_at desc);
alter table public.raimu_knowledge enable row level security;
revoke all on public.raimu_knowledge from anon, authenticated;
grant select, insert, update, delete on public.raimu_knowledge to authenticated;

create policy "Raimu readers see approved role content" on public.raimu_knowledge
  for select to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.removed_at is null
        and public.normalize_role(p.role) in ('admin','staff','operational_staff','cashier')
        and (
          public.normalize_role(p.role) = 'admin'
          or (status = 'published' and (case when public.normalize_role(p.role) = 'operational_staff' then 'staff' else public.normalize_role(p.role) end) = any(allowed_roles))
        )
    )
  );
create policy "Admins create Raimu knowledge" on public.raimu_knowledge
  for insert to authenticated with check (
    created_by = auth.uid() and updated_by = auth.uid() and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.removed_at is null and public.normalize_role(p.role) = 'admin'
    )
  );
create policy "Admins update Raimu knowledge" on public.raimu_knowledge
  for update to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.removed_at is null and public.normalize_role(p.role) = 'admin')
  ) with check (
    updated_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.removed_at is null and public.normalize_role(p.role) = 'admin')
  );
create policy "Admins delete Raimu knowledge" on public.raimu_knowledge
  for delete to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.removed_at is null and public.normalize_role(p.role) = 'admin')
  );

create or replace function public.search_raimu_knowledge(p_query text, p_limit integer default 5)
returns table (id uuid, title text, category text, content text, updated_at timestamptz)
language sql stable security invoker set search_path = public as $$
  with terms as (
    select to_tsquery('english', array_to_string(tsvector_to_array(to_tsvector('english', left(coalesce(p_query, ''), 500))), ' | ')) as query
  )
  select k.id, k.title, k.category, k.content, k.updated_at
  from public.raimu_knowledge k cross join terms
  where k.status = 'published' and k.search_vector @@ terms.query
  order by ts_rank(k.search_vector, terms.query) desc, k.updated_at desc
  limit least(greatest(coalesce(p_limit, 5), 1), 8);
$$;
revoke all on function public.search_raimu_knowledge(text, integer) from public;
grant execute on function public.search_raimu_knowledge(text, integer) to authenticated;

-- Starter facts taken from the implemented portal workflows. These are system
-- guides, not invented store policies or recipes. Admins may revise or retire.
insert into public.raimu_knowledge (id, title, category, content, allowed_roles, status)
values
  ('10000000-0000-4000-8000-000000000001', 'What Raimu can help with', 'system',
   'Raimu supports internal work for The Coffee Realm. Ask about current orders, menu availability, inventory, sales and transactions, purchase orders, customer concerns, reports, and approved knowledge. Raimu may prepare an order status update or purchase order draft for confirmation. Menu changes are prepared in Manage Menu so the approval includes exact item fields. The signed-in user role determines which information and actions are available. Raimu should say when a fact is missing instead of guessing.',
   array['admin','staff','cashier'], 'published'),
  ('10000000-0000-4000-8000-000000000002', 'Order preparation in the portal', 'procedure',
   'The Order Preparation workspace shows active orders and their statuses. Staff should review the order and payment information before confirming or advancing it. The application validates status transitions and blocks updates when an order is cancelled, finished, or held for cancellation review. Pickup and walk-in orders can be completed after they are ready. Delivery orders have a delivery stage and customer receipt confirmation. Follow the current order record rather than assuming a status from an earlier conversation.',
   array['admin','staff'], 'published'),
  ('10000000-0000-4000-8000-000000000003', 'Inventory monitoring in the portal', 'procedure',
   'The inventory workspace tracks ingredients and finished products. Each item may have a quantity and minimum stock level. An item at or below its minimum needs review. Inventory movement records capture restocks, deductions, adjustments, or waste when those workflows are used. Raimu can identify low-stock records, but a physical count should be confirmed by staff before correcting stock.',
   array['admin','staff'], 'published'),
  ('10000000-0000-4000-8000-000000000004', 'Purchase order workflow', 'procedure',
   'Operations staff can prepare a purchase order draft with an existing supplier and inventory items, then submit it for approval. The portal tracks draft, pending approval, approved, rejected, sent, receiving, disputed, closed, and cancelled states. Administrators review approval decisions. A Raimu-created draft must be reviewed for quantity, unit, price, supplier, and delivery details before submission.',
   array['admin','staff'], 'published'),
  ('10000000-0000-4000-8000-000000000005', 'Menu change review', 'procedure',
   'Staff menu changes that require review are prepared in Manage Menu and recorded as structured approval requests. Administrators use Menu Approvals to approve or reject pending requests. Menu availability changes may follow a separate direct workflow in the portal. Raimu can guide staff to Manage Menu, but it cannot turn an arbitrary sentence into a safe structured menu change.',
   array['admin','staff'], 'published'),
  ('10000000-0000-4000-8000-000000000006', 'Transactions and refunds', 'procedure',
   'The Transactions workspace shows order payment and refund states. Voids, refund requests, refund processing, and payment status corrections use guarded application workflows and write audit records. Review the transaction and its current status before taking financial action. Raimu can explain recorded states, but a pending refund is not a completed refund.',
   array['admin','staff'], 'published'),
  ('10000000-0000-4000-8000-000000000007', 'Customer message inbox', 'procedure',
   'Customer inquiries and help requests appear in the customer message inbox with new or replied status. Staff and administrators can review the permitted message records. A drafted reply is only a draft until a person reviews it and the reply workflow confirms it was sent.',
   array['admin','staff'], 'published'),
  ('10000000-0000-4000-8000-000000000008', 'System settings ownership', 'system',
   'Administrators manage store profile, ordering availability and hours, delivery zones, payment methods, pricing and VAT, and platform security in System Settings. A setting should be treated as changed only after its save succeeds. Raimu can explain selected recorded configuration to an administrator; it does not expose security settings or credentials to staff.',
   array['admin'], 'published'),
  ('10000000-0000-4000-8000-000000000009', 'Using reports', 'procedure',
   'Use the portal report pages for authoritative filters and totals. Raimu can prepare available sales, transaction, walk-in, inventory, and receipt files and offers CSV, Excel, or PDF downloads for those generated reports. Always check the report period, order status, payment status, voids, and refunds before interpreting a total. Raimu should not invent a number when the needed report data is unavailable.',
   array['admin','staff'], 'published')
on conflict (id) do nothing;
