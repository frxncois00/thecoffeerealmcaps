-- Add-on catalog management with explicit menu-subcategory placement.

begin;

alter table public.addons
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.addon_subcategories (
  addon_id uuid not null references public.addons(id) on delete cascade,
  subcategory_id uuid not null references public.subcategories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (addon_id, subcategory_id)
);
create index if not exists addon_subcategories_subcategory_idx
  on public.addon_subcategories (subcategory_id);

alter table public.addon_subcategories enable row level security;
drop policy if exists "Public read available add-on placements" on public.addon_subcategories;
create policy "Public read available add-on placements"
  on public.addon_subcategories for select to anon, authenticated
  using (
    exists (select 1 from public.addons addon where addon.id = addon_id and addon.is_available)
    and exists (select 1 from public.subcategories subcategory where subcategory.id = subcategory_id and not subcategory.is_archived)
  );
drop policy if exists "Staff read all add-on placements" on public.addon_subcategories;
create policy "Staff read all add-on placements"
  on public.addon_subcategories for select to authenticated
  using (public.is_staff_profile());

-- Existing add-ons keep their current broad drink/food behavior on first run.
-- Staff can narrow the assignment later in Manage Add-ons.
insert into public.addon_subcategories (addon_id, subcategory_id)
select addon.id, subcategory.id
from public.addons addon
cross join public.subcategories subcategory
join public.main_categories main_category on main_category.id = subcategory.main_category_id
where not subcategory.is_archived
  and (
    coalesce(addon.applies_to, 'both') = 'both'
    or (addon.applies_to = 'drink' and lower(main_category.name) = 'drinks')
    or (addon.applies_to = 'food' and lower(main_category.name) = 'foods')
  )
  and not exists (
    select 1 from public.addon_subcategories existing
    where existing.addon_id = addon.id and existing.subcategory_id = subcategory.id
  );

create or replace function public.staff_upsert_addon(
  p_id uuid,
  p_name text,
  p_price numeric,
  p_applies_to text,
  p_target_temperature text,
  p_is_available boolean,
  p_sort_order integer,
  p_subcategory_ids uuid[]
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := p_id;
  v_name text := btrim(coalesce(p_name, ''));
  v_applies_to text := lower(btrim(coalesce(p_applies_to, 'both')));
  -- Retained only in the function signature for compatibility with an
  -- already-deployed RPC. Temperature is no longer an add-on rule.
  v_target_temperature text := 'both';
begin
  perform public.assert_menu_writer();
  if v_name = '' then raise exception 'Add-on name is required'; end if;
  if coalesce(p_price, -1) < 0 then raise exception 'Add-on price cannot be negative'; end if;
  if v_applies_to not in ('drink', 'food', 'both') then raise exception 'Invalid add-on scope'; end if;
  if p_subcategory_ids is null or cardinality(p_subcategory_ids) < 1 then
    raise exception 'Choose at least one menu subcategory';
  end if;
  if (select count(distinct selected_id) from unnest(p_subcategory_ids) as selected(selected_id)) <> cardinality(p_subcategory_ids) then
    raise exception 'An add-on cannot be assigned to the same subcategory twice';
  end if;
  if exists (
    select 1
    from unnest(p_subcategory_ids) selected(id)
    left join public.subcategories subcategory on subcategory.id = selected.id
    left join public.main_categories main_category on main_category.id = subcategory.main_category_id
    where subcategory.id is null or subcategory.is_archived or main_category.id is null or main_category.is_archived
  ) then
    raise exception 'Add-on placement must use active menu subcategories';
  end if;
  if exists (
    select 1 from public.addons addon
    where lower(addon.name) = lower(v_name) and (v_id is null or addon.id <> v_id)
  ) then
    raise exception 'An add-on with this name already exists';
  end if;

  if v_id is null then
    insert into public.addons (name, price, applies_to, target_temperature, is_available, sort_order, updated_at)
    values (v_name, p_price, v_applies_to, v_target_temperature, coalesce(p_is_available, true),
      coalesce(nullif(p_sort_order, 0), (select coalesce(max(sort_order), 0) + 1 from public.addons)), now())
    returning id into v_id;
  else
    update public.addons
    set name = v_name,
        price = p_price,
        applies_to = v_applies_to,
        target_temperature = v_target_temperature,
        is_available = coalesce(p_is_available, true),
        sort_order = coalesce(p_sort_order, sort_order),
        updated_at = now()
    where id = v_id;
    if not found then raise exception 'Add-on not found'; end if;
  end if;

  delete from public.addon_subcategories where addon_id = v_id;
  insert into public.addon_subcategories (addon_id, subcategory_id)
  select v_id, selected.id from unnest(p_subcategory_ids) selected(id);
  return v_id;
end;
$$;

revoke all on function public.staff_upsert_addon(uuid, text, numeric, text, text, boolean, integer, uuid[]) from public;
grant execute on function public.staff_upsert_addon(uuid, text, numeric, text, text, boolean, integer, uuid[]) to authenticated;

-- Keep category approvals and menu-item/BOM approvals working while adding
-- the new add-on operation to the same admin review boundary.
create or replace function public.staff_create_menu_approval(
  p_action text, p_item_name text, p_summary text, p_change_types text[], p_operation text, p_payload jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_item_id uuid;
  v_was_archived boolean;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_slug text;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and public.normalize_role(role) in ('admin', 'staff', 'operational_staff')
      and removed_at is null
  ) then
    raise exception 'Staff access required';
  end if;
  if p_action not in ('add', 'change', 'remove') or btrim(coalesce(p_item_name, '')) = '' then
    raise exception 'Invalid menu approval request';
  end if;
  if p_operation not in (
    'set_online_benefit_eligibility','upsert_menu_item','archive_menu_item','duplicate_menu_item',
    'upsert_main_category','upsert_subcategory','archive_main_category','archive_subcategory','upsert_addon'
  ) then
    raise exception 'Unsupported menu approval operation';
  end if;
  if v_payload ? 'onlineBenefitEligible' and jsonb_typeof(v_payload->'onlineBenefitEligible') <> 'boolean' then
    raise exception 'Discount eligibility must be on or off';
  end if;
  if p_operation = 'set_online_benefit_eligibility'
     and (p_action <> 'change' or not (v_payload ? 'onlineBenefitEligible') or nullif(v_payload->>'id', '') is null) then
    raise exception 'Choose an item and its discount eligibility';
  end if;
  if p_operation = 'upsert_addon' and p_action = 'change' and nullif(v_payload->>'id', '') is null then
    raise exception 'Add-on changes need an existing add-on';
  end if;
  if p_operation = 'upsert_addon' and exists (
    select 1 from public.menu_change_approvals pending
    where pending.state = 'pending'
      and pending.operation = 'upsert_addon'
      and pending.payload->>'id' = v_payload->>'id'
  ) then
    raise exception 'This add-on already has a pending change request';
  end if;

  if p_operation = 'upsert_menu_item' and p_action = 'add' and nullif(v_payload->>'id', '') is null then
    if btrim(coalesce(v_payload->>'name', '')) = '' then raise exception 'Item name is required'; end if;
    if coalesce((v_payload->>'price')::numeric, -1) < 0 then raise exception 'Price cannot be negative'; end if;
    v_slug := nullif(btrim(coalesce(v_payload->>'slug', '')), '');
    if v_slug is null then
      v_slug := trim(both '-' from lower(regexp_replace(btrim(v_payload->>'name'), '[^a-zA-Z0-9]+', '-', 'g')));
      if v_slug = '' then v_slug := 'menu-item-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12); end if;
    end if;
    insert into public.menu_items (
      main_category_id, subcategory_id, name, slug, description, price, item_type, temperature_type,
      allow_ice, allow_sugar, allow_addons, image_url, manual_available, is_available, is_featured, is_bestseller,
      prep_time_minutes, available_from, available_until, sort_order, variant_options, is_archived
    ) values (
      nullif(v_payload->>'mainCategoryId', '')::uuid, nullif(v_payload->>'subcategoryId', '')::uuid,
      btrim(v_payload->>'name'), v_slug, nullif(btrim(coalesce(v_payload->>'description', '')), ''),
      (v_payload->>'price')::numeric, coalesce(v_payload->>'itemType', 'food'), coalesce(v_payload->>'temperatureType', 'none'),
      coalesce((v_payload->>'allowIce')::boolean, false), coalesce((v_payload->>'allowSugar')::boolean, false),
      coalesce((v_payload->>'allowAddons')::boolean, false), nullif(btrim(coalesce(v_payload->>'imageUrl', '')), ''),
      coalesce((v_payload->>'manualAvailable')::boolean, true), false,
      coalesce((v_payload->>'isFeatured')::boolean, false), coalesce((v_payload->>'isBestseller')::boolean, false),
      nullif(v_payload->>'prepTimeMinutes', '')::integer, nullif(v_payload->>'availableFrom', '')::date,
      nullif(v_payload->>'availableUntil', '')::date, coalesce((v_payload->>'sortOrder')::integer, 0),
      coalesce(v_payload->'variantOptions', '{}'::jsonb), true
    ) returning id into v_item_id;
    v_payload := jsonb_set(v_payload, '{id}', to_jsonb(v_item_id::text), true);
    v_was_archived := true;
  elsif p_operation in ('upsert_menu_item', 'archive_menu_item', 'set_online_benefit_eligibility') then
    v_item_id := nullif(v_payload->>'id', '')::uuid;
    if v_item_id is not null then
      select is_archived into v_was_archived from public.menu_items where id = v_item_id for update;
      if not found then raise exception 'Menu item not found'; end if;
      if exists (select 1 from public.menu_change_approvals where held_item_id = v_item_id and state = 'pending') then
        raise exception 'This item already has a pending change request';
      end if;
      update public.menu_items set is_archived = true, updated_at = now() where id = v_item_id;
    end if;
  end if;

  insert into public.menu_change_approvals (
    submitted_by, action, item_name, summary, change_types, operation, payload, held_item_id, held_item_was_archived
  ) values (
    auth.uid(), p_action, left(btrim(p_item_name), 120), left(btrim(p_summary), 500),
    coalesce(p_change_types, '{}'), p_operation, v_payload, v_item_id, v_was_archived
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_decide_menu_approval(p_id uuid, p_state text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_request public.menu_change_approvals%rowtype;
  v_subcategory_ids uuid[];
begin
  if not public.is_admin_profile() then raise exception 'Administrator access required'; end if;
  if p_state not in ('approved', 'rejected') then raise exception 'Invalid approval decision'; end if;
  select * into v_request from public.menu_change_approvals where id = p_id and state = 'pending' for update;
  if not found then raise exception 'Approval request not found or already decided'; end if;
  if p_state = 'approved' then
    if v_request.operation = 'upsert_menu_item' then
      if v_request.held_item_id is not null then update public.menu_items set is_archived = false where id = v_request.held_item_id; end if;
      perform public.staff_upsert_menu_item(
        nullif(v_request.payload->>'id', '')::uuid, nullif(v_request.payload->>'mainCategoryId', '')::uuid,
        nullif(v_request.payload->>'subcategoryId', '')::uuid, v_request.payload->>'name', v_request.payload->>'slug',
        v_request.payload->>'description', (v_request.payload->>'price')::numeric, v_request.payload->>'itemType',
        v_request.payload->>'temperatureType', coalesce((v_request.payload->>'allowIce')::boolean, false),
        coalesce((v_request.payload->>'allowSugar')::boolean, false), coalesce((v_request.payload->>'allowAddons')::boolean, false),
        v_request.payload->>'imageUrl', coalesce((v_request.payload->>'manualAvailable')::boolean, true),
        coalesce((v_request.payload->>'isFeatured')::boolean, false), coalesce((v_request.payload->>'isBestseller')::boolean, false),
        nullif(v_request.payload->>'prepTimeMinutes', '')::integer, null, null,
        coalesce((v_request.payload->>'sortOrder')::integer, 0), coalesce(v_request.payload->'variantOptions', '{}'::jsonb)
      );
      update public.menu_items
      set online_benefit_eligible = coalesce((v_request.payload->>'onlineBenefitEligible')::boolean, online_benefit_eligible), updated_at = now()
      where id = v_request.held_item_id;
      perform public.staff_set_menu_item_configuration(
        v_request.held_item_id, coalesce(v_request.payload->>'inventorySource', 'none'),
        coalesce(v_request.payload->'ingredients', '[]'::jsonb), coalesce(v_request.payload->'products', '[]'::jsonb)
      );
    elsif v_request.operation = 'set_online_benefit_eligibility' then
      update public.menu_items set online_benefit_eligible = (v_request.payload->>'onlineBenefitEligible')::boolean, updated_at = now()
      where id = v_request.held_item_id;
      if not found then raise exception 'Menu item not found'; end if;
    elsif v_request.operation = 'archive_menu_item' then
      perform public.staff_archive_menu_item((v_request.payload->>'id')::uuid);
    elsif v_request.operation = 'duplicate_menu_item' then
      perform public.staff_duplicate_menu_item((v_request.payload->>'id')::uuid);
    elsif v_request.operation = 'upsert_main_category' then
      perform public.staff_upsert_main_category(nullif(v_request.payload->>'id', '')::uuid, v_request.payload->>'name', v_request.payload->>'displayName', coalesce((v_request.payload->>'sortOrder')::integer, 0));
    elsif v_request.operation = 'upsert_subcategory' then
      perform public.staff_upsert_subcategory(nullif(v_request.payload->>'id', '')::uuid, nullif(v_request.payload->>'mainCategoryId', '')::uuid, v_request.payload->>'name', v_request.payload->>'displayName', coalesce((v_request.payload->>'sortOrder')::integer, 0));
    elsif v_request.operation = 'archive_main_category' then
      perform public.staff_archive_main_category((v_request.payload->>'id')::uuid);
    elsif v_request.operation = 'archive_subcategory' then
      perform public.staff_archive_subcategory((v_request.payload->>'id')::uuid);
    elsif v_request.operation = 'upsert_addon' then
      select coalesce(array_agg(selected_id::uuid), '{}'::uuid[]) into v_subcategory_ids
      from jsonb_array_elements_text(coalesce(v_request.payload->'subcategoryIds', '[]'::jsonb)) as selected(selected_id);
      perform public.staff_upsert_addon(
        nullif(v_request.payload->>'id', '')::uuid,
        v_request.payload->>'name',
        (v_request.payload->>'price')::numeric,
        coalesce(v_request.payload->>'appliesTo', 'both'),
        coalesce(v_request.payload->>'targetTemperature', 'both'),
        coalesce((v_request.payload->>'isAvailable')::boolean, true),
        nullif(v_request.payload->>'sortOrder', '')::integer,
        v_subcategory_ids
      );
    else
      raise exception 'Unsupported menu approval operation';
    end if;
  end if;

  if v_request.held_item_id is not null
     and ((p_state = 'rejected' and not coalesce(v_request.held_item_was_archived, false))
       or (p_state = 'approved' and v_request.action <> 'remove')) then
    update public.menu_items set is_archived = false, updated_at = now() where id = v_request.held_item_id;
  end if;
  update public.menu_change_approvals
  set state = p_state, reviewed_by = auth.uid(), decided_at = now()
  where id = p_id;
end;
$$;

revoke all on function public.staff_create_menu_approval(text, text, text, text[], text, jsonb) from public;
grant execute on function public.staff_create_menu_approval(text, text, text, text[], text, jsonb) to authenticated;
revoke all on function public.admin_decide_menu_approval(uuid, text) from public;
grant execute on function public.admin_decide_menu_approval(uuid, text) to authenticated;

commit;

notify pgrst, 'reload schema';
