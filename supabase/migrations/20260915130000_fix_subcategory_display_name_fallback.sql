-- Optional customer-facing names should fall back to the required internal
-- subcategory name when staff leaves the display name blank.
begin;

create or replace function public.staff_upsert_subcategory(
  p_id uuid,
  p_main_category_id uuid,
  p_name text,
  p_display_name text,
  p_sort_order integer
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_display_name text := coalesce(nullif(btrim(coalesce(p_display_name, '')), ''), v_name);
begin
  perform public.assert_menu_writer();
  if v_name = '' then raise exception 'Subcategory name is required'; end if;
  begin
    if p_id is null then
      insert into public.subcategories (main_category_id, name, display_name, sort_order)
      values (p_main_category_id, v_name, v_display_name, coalesce(p_sort_order, 0))
      returning id into v_id;
    else
      v_id := p_id;
      update public.subcategories
      set main_category_id = p_main_category_id,
          name = v_name,
          display_name = v_display_name,
          sort_order = coalesce(p_sort_order, sort_order)
      where id = v_id and not is_archived;
      if not found then raise exception 'Subcategory not found'; end if;
    end if;
  exception when unique_violation then
    raise exception 'A subcategory with this name already exists in this category';
  end;
  return v_id;
end;
$$;

revoke all on function public.staff_upsert_subcategory(uuid, uuid, text, text, integer) from public;
grant execute on function public.staff_upsert_subcategory(uuid, uuid, text, text, integer) to authenticated;

commit;

notify pgrst, 'reload schema';
