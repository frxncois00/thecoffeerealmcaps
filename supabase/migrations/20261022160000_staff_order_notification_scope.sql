-- Checkout stock recalculation can update every ordered menu item. Keep those
-- menu-change notifications for admins, not the staff order bell.
create or replace function public.emit_team_notification(p_roles text[], p_key text, p_type text, p_category text, p_title text, p_message text, p_target jsonb, p_toast boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare recipient record;
begin
  for recipient in
    select id from public.profiles
    where public.normalize_role(role)=any(case when p_type='menu_changed' then array['admin']::text[] else p_roles end)
      and removed_at is null
  loop
    perform public.emit_user_notification(recipient.id,p_key,p_type,p_category,p_title,p_message,p_target,p_toast);
  end loop;
end;
$$;
