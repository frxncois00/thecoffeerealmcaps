drop trigger if exists capture_notification on public.inventory_stock;
drop trigger if exists capture_notification on public.finished_products;

create or replace function public.capture_inventory_status_notification() returns trigger
language plpgsql security definer set search_path = public as $function$
declare
  n jsonb := to_jsonb(new);
  o jsonb := case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  quantity numeric := (n->>'quantity')::numeric;
  critical numeric := (n->>'critical_stock_level')::numeric;
  minimum numeric := (n->>'min_stock_level')::numeric;
  old_quantity numeric := (o->>'quantity')::numeric;
  old_critical numeric := (o->>'critical_stock_level')::numeric;
  old_minimum numeric := (o->>'min_stock_level')::numeric;
  current_level int;
  previous_level int := 0;
  label text;
  title text;
  typ text;
  target jsonb;
begin
  if coalesce(n->>'is_archived','false')='true' or quantity is null or critical is null or minimum is null then return new; end if;
  current_level := case when quantity<=0 then 3 when quantity<=critical then 2 when quantity<=minimum then 1 else 0 end;
  if tg_op='UPDATE' then
    previous_level := case when old_quantity<=0 then 3 when old_quantity<=old_critical then 2 when old_quantity<=old_minimum then 1 else 0 end;
  end if;
  if current_level=previous_level then return new; end if;
  if current_level=3 then typ:='out_of_stock'; title:='Out of stock';
  elsif current_level=2 then typ:='low_stock'; title:='Critical stock';
  elsif current_level=1 then typ:='low_stock'; title:='Low stock';
  elsif current_level=0 and previous_level>0 then typ:='stock_restored'; title:='Stock restored';
  else return new;
  end if;
  label := n->>'name';
  if tg_table_name='inventory_stock' then
    select name into label from public.ingredients where id=(n->>'ingredient_id')::uuid and not is_archived;
  end if;
  if label is null then return new; end if;
  target := jsonb_build_object('kind','inventory','itemType',case tg_table_name when 'inventory_stock' then 'ingredient' else 'finished_product' end,'name',label);
  perform public.emit_team_notification(array['staff','operational_staff','admin'],gen_random_uuid()::text,typ,'inventory',title,label||' - '||quantity||' remaining',target,typ<>'stock_restored');
  return new;
end;
$function$;

revoke all on function public.capture_inventory_status_notification() from public, anon, authenticated;
create trigger capture_notification after insert or update on public.inventory_stock for each row execute function public.capture_inventory_status_notification();
create trigger capture_notification after insert or update on public.finished_products for each row execute function public.capture_inventory_status_notification();

