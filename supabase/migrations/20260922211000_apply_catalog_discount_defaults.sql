-- Apply the requested catalog discount defaults during local/bootstrap migrations.
-- The trigger still blocks normal client writes; only the migration owner is allowed
-- to perform this initial catalog setup.

create or replace function public.guard_online_benefit_eligibility()
returns trigger language plpgsql set search_path=public as $$
begin
  if ((tg_op='INSERT' and new.online_benefit_eligible)
     or (tg_op='UPDATE' and new.online_benefit_eligible is distinct from old.online_benefit_eligible))
     and not public.is_admin_profile()
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Discount eligibility requires administrator approval';
  end if;
  return new;
end;
$$;

update public.menu_items
set online_benefit_eligible = true, updated_at = now()
where not is_archived;

update public.menu_items
set online_benefit_eligible = false, updated_at = now()
where name like 'Whole %'
  and subcategory_id in (select id from public.subcategories where name = 'cakes');
