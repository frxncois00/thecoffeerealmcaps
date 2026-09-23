-- Repair payment-proof storage independently of older bootstrap scripts.
-- Safe to run more than once: the bucket is upserted and policies are replaced.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Customers upload their payment proofs" on storage.objects;
create policy "Customers upload their payment proofs"
on storage.objects for insert to authenticated
with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Customers view their payment proofs" on storage.objects;
create policy "Customers view their payment proofs"
on storage.objects for select to authenticated
using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Customers delete unreferenced payment proofs" on storage.objects;
create policy "Customers delete unreferenced payment proofs"
on storage.objects for delete to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not exists (
    select 1 from public.orders o
    where o.customer_id = auth.uid() and o.payment_proof_path = name
  )
);
