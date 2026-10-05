create or replace function public.reset_approved_benefit_application(p_id uuid, p_revision integer)
returns public.benefit_applications language plpgsql security definer set search_path = public as $$
declare v_row public.benefit_applications;
declare v_note text := 'Please update your benefit type and upload the correct supporting ID for re-verification.';
begin
  if not public.is_admin_profile() then raise exception 'Administrator access required'; end if;
  update public.benefit_applications set status='resubmission', review_note=v_note, reviewed_by=auth.uid(), reviewed_at=now(), submitted_at=now(), revision=revision+1
    where id=p_id and status='approved' and revision=p_revision returning * into v_row;
  if not found then raise exception 'Application changed or is no longer approved. Refresh and try again'; end if;
  insert into public.benefit_application_events(application_id,actor_id,status,note,revision) values(v_row.id,auth.uid(),'resubmission',v_note,v_row.revision);
  return v_row;
end;
$$;
revoke all on function public.reset_approved_benefit_application(uuid, integer) from public;
grant execute on function public.reset_approved_benefit_application(uuid, integer) to authenticated;
