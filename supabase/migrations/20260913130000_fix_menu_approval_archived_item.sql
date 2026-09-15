-- Approved menu changes are held as archived rows while awaiting review.
-- Restore the held row before calling the existing upsert RPC, which only
-- updates active rows. The whole approval remains one transaction.
create or replace function public.admin_decide_menu_approval(p_id uuid, p_state text)
returns void language plpgsql security definer set search_path=public as $$
declare v_request public.menu_change_approvals%rowtype;
begin
  if not public.is_admin_profile() then raise exception 'Administrator access required'; end if;
  if p_state not in ('approved','rejected') then raise exception 'Invalid approval decision'; end if;
  select * into v_request from public.menu_change_approvals where id=p_id and state='pending' for update;
  if not found then raise exception 'Approval request not found or already decided'; end if;
  if p_state='approved' then
    if v_request.operation='upsert_menu_item' then
      if v_request.held_item_id is not null then update public.menu_items set is_archived=false where id=v_request.held_item_id; end if;
      perform public.staff_upsert_menu_item(nullif(v_request.payload->>'id','')::uuid,nullif(v_request.payload->>'mainCategoryId','')::uuid,nullif(v_request.payload->>'subcategoryId','')::uuid,v_request.payload->>'name',v_request.payload->>'slug',v_request.payload->>'description',(v_request.payload->>'price')::numeric,v_request.payload->>'itemType',v_request.payload->>'temperatureType',coalesce((v_request.payload->>'allowIce')::boolean,false),coalesce((v_request.payload->>'allowSugar')::boolean,false),coalesce((v_request.payload->>'allowAddons')::boolean,false),v_request.payload->>'imageUrl',coalesce((v_request.payload->>'manualAvailable')::boolean,true),coalesce((v_request.payload->>'isFeatured')::boolean,false),coalesce((v_request.payload->>'isBestseller')::boolean,false),nullif(v_request.payload->>'prepTimeMinutes','')::integer,null,null,coalesce((v_request.payload->>'sortOrder')::integer,0),coalesce(v_request.payload->'variantOptions','{}'::jsonb));
      update public.menu_items set online_benefit_eligible=coalesce((v_request.payload->>'onlineBenefitEligible')::boolean,online_benefit_eligible) where id=v_request.held_item_id;
      perform public.staff_set_menu_item_configuration(v_request.held_item_id,coalesce(v_request.payload->>'inventorySource','none'),coalesce(v_request.payload->'ingredients','[]'::jsonb),coalesce(v_request.payload->'products','[]'::jsonb));
    elsif v_request.operation='set_online_benefit_eligibility' then update public.menu_items set online_benefit_eligible=(v_request.payload->>'onlineBenefitEligible')::boolean where id=v_request.held_item_id;
    elsif v_request.operation='archive_menu_item' then perform public.staff_archive_menu_item((v_request.payload->>'id')::uuid);
    elsif v_request.operation='duplicate_menu_item' then perform public.staff_duplicate_menu_item((v_request.payload->>'id')::uuid);
    else raise exception 'Unsupported menu approval operation'; end if;
  end if;
  if v_request.held_item_id is not null and ((p_state='rejected' and not coalesce(v_request.held_item_was_archived,false)) or (p_state='approved' and v_request.action<>'remove')) then update public.menu_items set is_archived=false,updated_at=now() where id=v_request.held_item_id; end if;
  update public.menu_change_approvals set state=p_state,reviewed_by=auth.uid(),decided_at=now() where id=p_id;
end; $$;
revoke all on function public.admin_decide_menu_approval(uuid,text) from public;
grant execute on function public.admin_decide_menu_approval(uuid,text) to authenticated;
