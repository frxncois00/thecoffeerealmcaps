begin;

alter table public.supplier_items
  add column if not exists unit_price numeric(14,4)
  check (unit_price is null or unit_price > 0);

create or replace function public.save_supplier(p_name text, p_contact text, p_items jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_line jsonb; v_type text; v_item_id uuid; v_price numeric;
begin
  perform public.assert_purchase_order_access(false);
  if nullif(btrim(coalesce(p_name,'')), '') is null then raise exception 'Supplier name is required'; end if;
  insert into public.suppliers(name,contact,created_by)
  values(btrim(p_name),nullif(btrim(coalesce(p_contact,'')),''),auth.uid())
  on conflict(name) do update set contact=excluded.contact,updated_at=now()
  returning id into v_id;
  delete from public.supplier_items where supplier_id=v_id;
  for v_line in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    v_type := v_line->>'item_type';
    v_item_id := nullif(v_line->>'item_id','')::uuid;
    v_price := nullif(v_line->>'unit_price','')::numeric;
    if v_type not in ('ingredient','finished_product') or v_item_id is null then raise exception 'Invalid supplier item'; end if;
    if v_price is not null and v_price <= 0 then raise exception 'Unit price must be greater than zero'; end if;
    insert into public.supplier_items(supplier_id,item_type,ingredient_id,finished_product_id,unit_price)
    values(v_id,v_type,case when v_type='ingredient' then v_item_id end,
      case when v_type='finished_product' then v_item_id end,v_price);
  end loop;
  return v_id;
end;
$$;

notify pgrst, 'reload schema';
commit;
