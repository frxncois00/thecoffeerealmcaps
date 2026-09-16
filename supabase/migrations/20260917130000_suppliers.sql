begin;

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_items (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  item_type text not null check (item_type in ('ingredient','finished_product')),
  ingredient_id uuid references public.ingredients(id),
  finished_product_id uuid references public.finished_products(id),
  created_at timestamptz not null default now(),
  unique (supplier_id, item_type, ingredient_id, finished_product_id),
  check (num_nonnulls(ingredient_id, finished_product_id) = 1)
);

-- Repair installations that created the first version with the two nullable
-- inventory foreign keys inside the primary key. Those columns must remain
-- nullable because each row stores either an ingredient or a finished product.
alter table public.supplier_items add column if not exists id uuid default gen_random_uuid();
update public.supplier_items set id = gen_random_uuid() where id is null;
alter table public.supplier_items alter column id set not null;
alter table public.supplier_items drop constraint if exists supplier_items_pkey;
alter table public.supplier_items alter column ingredient_id drop not null;
alter table public.supplier_items alter column finished_product_id drop not null;
alter table public.supplier_items add constraint supplier_items_pkey primary key (id);

alter table public.suppliers enable row level security;
alter table public.supplier_items enable row level security;
drop policy if exists "Internal users read suppliers" on public.suppliers;
create policy "Internal users read suppliers" on public.suppliers for select to authenticated using (public.is_staff_profile());
drop policy if exists "Internal users read supplier items" on public.supplier_items;
create policy "Internal users read supplier items" on public.supplier_items for select to authenticated using (public.is_staff_profile());

create or replace function public.save_supplier(p_name text, p_contact text, p_items jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_line jsonb; v_type text; v_item_id uuid;
begin
  perform public.assert_purchase_order_access(false);
  if nullif(btrim(coalesce(p_name,'')),'') is null then raise exception 'Supplier name is required'; end if;
  insert into public.suppliers(name,contact,created_by)
  values(btrim(p_name),nullif(btrim(coalesce(p_contact,'')),''),auth.uid())
  on conflict(name) do update set contact=excluded.contact,updated_at=now()
  returning id into v_id;
  delete from public.supplier_items where supplier_id=v_id;
  for v_line in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    v_type:=v_line->>'item_type'; v_item_id:=nullif(v_line->>'item_id','')::uuid;
    if v_type not in ('ingredient','finished_product') or v_item_id is null then raise exception 'Invalid supplier item'; end if;
    insert into public.supplier_items(supplier_id,item_type,ingredient_id,finished_product_id)
    values(v_id,v_type,case when v_type='ingredient' then v_item_id end,case when v_type='finished_product' then v_item_id end);
  end loop;
  return v_id;
end;
$$;

revoke all on function public.save_supplier(text,text,jsonb) from public;
grant execute on function public.save_supplier(text,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
