begin;

-- Existing installations may have the original composite primary key. Replace
-- it with a surrogate key so ingredient_id and finished_product_id can be
-- nullable on opposite item types.
alter table if exists public.supplier_items add column if not exists id uuid default gen_random_uuid();
update public.supplier_items set id = gen_random_uuid() where id is null;
alter table if exists public.supplier_items alter column id set not null;
alter table if exists public.supplier_items drop constraint if exists supplier_items_pkey;
alter table if exists public.supplier_items alter column ingredient_id drop not null;
alter table if exists public.supplier_items alter column finished_product_id drop not null;
alter table if exists public.supplier_items add constraint supplier_items_pkey primary key (id);

notify pgrst, 'reload schema';
commit;
