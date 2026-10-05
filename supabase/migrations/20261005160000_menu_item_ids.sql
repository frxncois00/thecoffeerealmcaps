-- Permanent, human-readable IDs for menu items.
--
-- Item IDs are deliberately scoped to menu_items only: ingredients and
-- inventory products continue to use their existing UUIDs/SKUs. A category
-- keeps one sequence, while the two-letter prefix makes every ID globally
-- unique. Existing cake slices are numbered before whole-cake records.

begin;

alter table public.menu_items add column if not exists item_code text;

create table if not exists public.menu_item_code_sequences (
  category_scope text primary key,
  category_name text not null,
  prefix varchar(2) not null unique check (prefix ~ '^[A-Z]{2}$'),
  last_value integer not null default 0 check (last_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The approved codes for the current menu taxonomy. The fallback only applies
-- when a newly created category is not yet in this list.
create or replace function public.menu_item_code_prefix(p_category_name text)
returns varchar(2)
language plpgsql
immutable
set search_path = public
as $$
declare
  v_category text := lower(btrim(coalesce(p_category_name, '')));
  v_letters text;
begin
  case v_category
    when 'cookies' then return 'CK';
    when 'cakes' then return 'CA';
    when 'breads' then return 'BR';
    when 'sandwiches' then return 'SW';
    when 'espresso' then return 'ES';
    when 'tcr specials' then return 'TS';
    when 'non-coffee' then return 'NC';
    when 'meals' then return 'ML';
    when 'pasta' then return 'PS';
    when 'snacks' then return 'SN';
  end case;

  v_letters := regexp_replace(upper(v_category), '[^A-Z0-9]', '', 'g');
  if length(v_letters) = 0 then return 'MI'; end if;
  if length(v_letters) = 1 then return v_letters || 'X'; end if;
  return left(v_letters, 2);
end;
$$;

create or replace function public.assign_menu_item_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category_scope text;
  v_category_name text;
  v_prefix varchar(2);
  v_next_value integer;
begin
  if new.subcategory_id is not null then
    select coalesce(nullif(btrim(display_name), ''), btrim(name))
      into v_category_name from public.subcategories where id = new.subcategory_id;
    v_category_scope := 'subcategory:' || new.subcategory_id::text;
  elsif new.main_category_id is not null then
    select coalesce(nullif(btrim(display_name), ''), btrim(name))
      into v_category_name from public.main_categories where id = new.main_category_id;
    v_category_scope := 'main_category:' || new.main_category_id::text;
  else
    v_category_name := 'Uncategorized';
    v_category_scope := 'uncategorized';
  end if;

  if nullif(btrim(coalesce(v_category_name, '')), '') is null then
    raise exception 'The selected menu category no longer exists';
  end if;

  v_prefix := public.menu_item_code_prefix(v_category_name);
  begin
    insert into public.menu_item_code_sequences(category_scope, category_name, prefix)
      values (v_category_scope, v_category_name, v_prefix)
      on conflict (category_scope) do update
        set category_name = excluded.category_name, updated_at = now();
  exception when unique_violation then
    raise exception 'Menu category "%" needs a different two-letter item ID code', v_category_name;
  end;

  update public.menu_item_code_sequences
    set last_value = last_value + 1, updated_at = now()
    where category_scope = v_category_scope
    returning prefix, last_value into v_prefix, v_next_value;

  new.item_code := v_prefix || v_next_value::text;
  return new;
end;
$$;

-- Backfill in creation order. For Cakes, all slice records are numbered ahead
-- of whole-cake records, as requested.
with classified as (
  select
    item.id,
    case when item.subcategory_id is not null then 'subcategory:' || item.subcategory_id::text
         when item.main_category_id is not null then 'main_category:' || item.main_category_id::text
         else 'uncategorized' end as category_scope,
    coalesce(nullif(btrim(subcategory.display_name), ''), btrim(subcategory.name),
      nullif(btrim(main_category.display_name), ''), btrim(main_category.name), 'Uncategorized') as category_name,
    item.created_at, item.id as stable_id,
    case when lower(coalesce(subcategory.display_name, subcategory.name, main_category.display_name, main_category.name, '')) = 'cakes'
           and (item.slug like '%-slice' or lower(item.name) like 'slice of %' or lower(item.name) like '% / slice') then 0
         when lower(coalesce(subcategory.display_name, subcategory.name, main_category.display_name, main_category.name, '')) = 'cakes' then 1
         else 0 end as cake_priority
  from public.menu_items item
  left join public.subcategories subcategory on subcategory.id = item.subcategory_id
  left join public.main_categories main_category on main_category.id = item.main_category_id
), ranked as (
  select *, public.menu_item_code_prefix(category_name) as prefix,
    row_number() over (partition by category_scope order by cake_priority, created_at, stable_id) as sequence_number
  from classified
)
insert into public.menu_item_code_sequences(category_scope, category_name, prefix, last_value)
select category_scope, max(category_name), max(prefix), max(sequence_number)::integer
from ranked
group by category_scope
on conflict (category_scope) do update
  set category_name = excluded.category_name,
      prefix = excluded.prefix,
      last_value = greatest(public.menu_item_code_sequences.last_value, excluded.last_value),
      updated_at = now();

with classified as (
  select
    item.id,
    case when item.subcategory_id is not null then 'subcategory:' || item.subcategory_id::text
         when item.main_category_id is not null then 'main_category:' || item.main_category_id::text
         else 'uncategorized' end as category_scope,
    coalesce(nullif(btrim(subcategory.display_name), ''), btrim(subcategory.name),
      nullif(btrim(main_category.display_name), ''), btrim(main_category.name), 'Uncategorized') as category_name,
    item.created_at, item.id as stable_id,
    case when lower(coalesce(subcategory.display_name, subcategory.name, main_category.display_name, main_category.name, '')) = 'cakes'
           and (item.slug like '%-slice' or lower(item.name) like 'slice of %' or lower(item.name) like '% / slice') then 0
         when lower(coalesce(subcategory.display_name, subcategory.name, main_category.display_name, main_category.name, '')) = 'cakes' then 1
         else 0 end as cake_priority
  from public.menu_items item
  left join public.subcategories subcategory on subcategory.id = item.subcategory_id
  left join public.main_categories main_category on main_category.id = item.main_category_id
), ranked as (
  select id, public.menu_item_code_prefix(category_name) as prefix,
    row_number() over (partition by category_scope order by cake_priority, created_at, stable_id) as sequence_number
  from classified
)
update public.menu_items item
set item_code = ranked.prefix || ranked.sequence_number::text
from ranked
where item.id = ranked.id and item.item_code is null;

alter table public.menu_items alter column item_code set not null;
alter table public.menu_items add constraint menu_items_item_code_format_check
  check (item_code ~ '^[A-Z]{2}[1-9][0-9]*$');
create unique index if not exists menu_items_item_code_uidx on public.menu_items (item_code);

drop trigger if exists assign_menu_item_code_before_insert on public.menu_items;
create trigger assign_menu_item_code_before_insert
  before insert on public.menu_items
  for each row execute function public.assign_menu_item_code();

notify pgrst, 'reload schema';

commit;
