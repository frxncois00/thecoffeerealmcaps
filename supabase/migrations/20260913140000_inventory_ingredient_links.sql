create or replace function public.staff_set_ingredient_menu_links(p_ingredient_id uuid, p_links jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v_link jsonb;
begin
  perform public.assert_menu_writer();
  if not exists (select 1 from public.ingredients where id=p_ingredient_id and not is_archived) then raise exception 'Ingredient not found'; end if;
  delete from public.menu_item_ingredients where ingredient_id=p_ingredient_id;
  for v_link in select value from jsonb_array_elements(coalesce(p_links,'[]'::jsonb)) loop
    if not exists (select 1 from public.menu_items where id=(v_link->>'menu_item_id')::uuid and not is_archived) then raise exception 'Menu item link is invalid'; end if;
    if coalesce((v_link->>'quantity_per_serving')::numeric,0)<=0 then raise exception 'Ingredient quantity must be greater than zero'; end if;
    insert into public.menu_item_ingredients(menu_item_id,ingredient_id,quantity_per_serving,unit)
    values((v_link->>'menu_item_id')::uuid,p_ingredient_id,(v_link->>'quantity_per_serving')::numeric,(select unit from public.ingredients where id=p_ingredient_id));
  end loop;
end; $$;
revoke all on function public.staff_set_ingredient_menu_links(uuid,jsonb) from public;
grant execute on function public.staff_set_ingredient_menu_links(uuid,jsonb) to authenticated;
