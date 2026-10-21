-- Reinstall the final serving rules for databases that received the earlier
-- draft which multiplied per-cup recipes by option size (e.g. 16 ounces).
-- This changes functions only; it does not edit stock, recipes, or orders.
begin;

-- Recipes describe one base serving. Product mappings already describe the
-- complete selling option, so they must never receive a second multiplier.
create or replace function public.menu_serving_multiplier(p_item uuid, p_variant text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_config jsonb; v_option jsonb;
begin
  select variant_options into v_config from public.menu_items where id = p_item;
  -- Legacy cake recipes are recorded per slice; their Whole option is eight.
  if v_config->>'type' = 'cake' and p_variant = 'whole' then return 8; end if;
  if coalesce((v_config->>'enabled')::boolean, false) then
    if p_variant is null then
      v_option := v_config->'options'->0;
    else
      select value into v_option from jsonb_array_elements(coalesce(v_config->'options', '[]'))
      where value->>'key' = p_variant;
    end if;
    -- Other recipes are configured per sale (e.g. a 16-ounce drink), not
    -- per unit of the option's volume or weight.
    if lower(v_option->>'unit') in ('slice', 'slices') then
      return greatest(coalesce((v_option->>'quantity')::numeric, 1), 1);
    end if;
  end if;
  return 1;
end;
$$;
revoke all on function public.menu_serving_multiplier(uuid,text) from public, anon, authenticated;

create or replace function public.cart_stock_available(p_items jsonb)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_line jsonb; v_item public.menu_items%rowtype; v_variant text;
  v_quantity numeric; v_need record; v_key text; v_amount numeric;
  v_demands jsonb := '{}'::jsonb; v_found boolean; v_stock numeric;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 200 then return false; end if;
  for v_line in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_line->>'quantity')::numeric;
    if v_quantity is null or v_quantity < 1 or v_quantity > 99 or trunc(v_quantity) <> v_quantity then return false; end if;
    select * into v_item from public.menu_items where id = (v_line->>'menu_item_id')::uuid;
    if not found or v_item.is_archived or not v_item.manual_available
      or current_date < v_item.available_from or current_date > v_item.available_until then return false; end if;
    v_variant := nullif(v_line->>'variant_key', '');
    if v_variant is null and coalesce((v_item.variant_options->>'enabled')::boolean, false) then
      v_variant := v_item.variant_options->'options'->0->>'key';
    end if;
    if v_variant is not null and coalesce((v_item.variant_options->>'enabled')::boolean, false)
      and not exists (select 1 from jsonb_array_elements(coalesce(v_item.variant_options->'options','[]')) o where o->>'key' = v_variant)
      and not coalesce(v_item.variant_options->'prices' ? v_variant, false) then return false; end if;
    v_found := false;
    for v_need in
      select 'i:' || r.ingredient_id::text as key,
        r.quantity_per_serving * public.menu_serving_multiplier(v_item.id, v_variant) as amount
      from public.menu_item_ingredients r where r.menu_item_id = v_item.id and v_item.inventory_source = 'ingredients'
      union all
      select 'p:' || m.finished_product_id::text, m.units_per_sale
      from public.finished_product_sale_mappings m
      where m.menu_item_id = v_item.id and v_item.inventory_source = 'products'
        and (m.variant_key is not distinct from v_variant or (m.variant_key is null and not exists (
          select 1 from public.finished_product_sale_mappings x where x.menu_item_id = v_item.id and x.variant_key is not distinct from v_variant)))
    loop
      v_found := true;
      if v_need.amount is null or v_need.amount <= 0 then return false; end if;
      v_demands := jsonb_set(v_demands, array[v_need.key], to_jsonb(coalesce((v_demands->>v_need.key)::numeric,0) + v_need.amount * v_quantity));
    end loop;
    if v_item.inventory_source in ('ingredients','products') and not v_found then return false; end if;
  end loop;
  for v_key, v_amount in select key, value::numeric from jsonb_each_text(v_demands) loop
    if left(v_key,2) = 'i:' then
      select s.quantity into v_stock from public.inventory_stock s join public.ingredients i on i.id = s.ingredient_id
      where s.ingredient_id = substring(v_key from 3)::uuid and not i.is_archived;
    else
      select quantity into v_stock from public.finished_products where id = substring(v_key from 3)::uuid and not is_archived;
    end if;
    if v_stock is null or v_stock < v_amount then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.cart_stock_available(jsonb) from public;
grant execute on function public.cart_stock_available(jsonb) to anon, authenticated;


notify pgrst, 'reload schema';
commit;
