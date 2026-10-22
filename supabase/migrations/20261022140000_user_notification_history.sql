-- Durable, recipient-owned notification history. Clients cannot create alerts or
-- edit their content. Read/clear actions are scoped to the authenticated user.
create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  event_type text not null,
  category text not null,
  title text not null,
  message text not null default '',
  target jsonb,
  toast boolean not null default false,
  read_at timestamptz,
  cleared_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, event_key)
);
create index user_notifications_history_idx on public.user_notifications(user_id, created_at desc, id desc) where cleared_at is null;
create index user_notifications_unread_idx on public.user_notifications(user_id) where read_at is null and cleared_at is null;
alter table public.user_notifications enable row level security;
revoke all on public.user_notifications from anon, authenticated;
grant select on public.user_notifications to authenticated;
create policy "Read own notifications" on public.user_notifications for select to authenticated using (user_id = auth.uid());

create function public.mark_notifications_read(p_id uuid default null, p_through timestamptz default now())
returns void language sql security definer set search_path = public as $$
  update public.user_notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and cleared_at is null
    and (p_id is null or id = p_id) and created_at <= p_through;
$$;
create function public.clear_customer_notifications(p_through timestamptz default now())
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id=auth.uid() and public.normalize_role(role)='customer') then
    raise exception 'Customer access required';
  end if;
  update public.user_notifications set cleared_at=now(), read_at=coalesce(read_at,now())
  where user_id=auth.uid() and cleared_at is null and created_at <= p_through;
end;
$$;
revoke all on function public.mark_notifications_read(uuid,timestamptz), public.clear_customer_notifications(timestamptz) from public;
grant execute on function public.mark_notifications_read(uuid,timestamptz), public.clear_customer_notifications(timestamptz) to authenticated;

-- Internal helpers: only database triggers may generate notifications.
create function public.emit_user_notification(p_user uuid, p_key text, p_type text, p_category text, p_title text, p_message text, p_target jsonb, p_toast boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare pref jsonb;
begin
  if p_user is null then return; end if;
  select to_jsonb(s) into pref from public.staff_preferences s where user_id=p_user;
  if (p_type='new_order' and not coalesce((pref->>'notify_new_orders')::boolean,true))
    or (p_type='payment_proof' and not coalesce((pref->>'notify_payment_proofs')::boolean,true))
    or (p_type in ('low_stock','out_of_stock','stock_restored') and not coalesce((pref->>'notify_low_stock')::boolean,true))
    or (p_type='menu_changed' and not coalesce((pref->>'notify_menu_changes')::boolean,false))
    or (p_type in ('customer_cancelled','cancellation_requested') and not coalesce((pref->>'notify_customer_cancellations')::boolean,true)) then return; end if;
  insert into public.user_notifications(user_id,event_key,event_type,category,title,message,target,toast)
  values(p_user,p_key,p_type,p_category,p_title,left(coalesce(p_message,''),500),p_target,p_toast)
  on conflict(user_id,event_key) do nothing;
end;
$$;
create function public.emit_team_notification(p_roles text[], p_key text, p_type text, p_category text, p_title text, p_message text, p_target jsonb, p_toast boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare recipient record;
begin
  for recipient in select id from public.profiles where public.normalize_role(role)=any(p_roles) and removed_at is null loop
    perform public.emit_user_notification(recipient.id,p_key,p_type,p_category,p_title,p_message,p_target,p_toast);
  end loop;
end;
$$;
revoke all on function public.emit_user_notification(uuid,text,text,text,text,text,jsonb,boolean), public.emit_team_notification(text[],text,text,text,text,text,jsonb,boolean) from public, anon, authenticated;

create function public.capture_user_notification() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n jsonb := case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  o jsonb := case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  k text := gen_random_uuid()::text;
  staff text[] := array['staff','operational_staff'];
  management text[] := array['staff','operational_staff','admin'];
  customer uuid; label text; target jsonb; title text; typ text;
  quantity numeric; minimum numeric; old_quantity numeric; old_minimum numeric;
begin
  if tg_table_name='orders' then
    customer := (n->>'customer_id')::uuid;
    label := coalesce(n->>'order_number','Order');
    target := jsonb_build_object('kind','order','id',n->>'id','orderNumber',label);
    if tg_op='INSERT' then
      perform public.emit_team_notification(staff,'order:'||(n->>'id'),'new_order','orders','New order',label||' · '||coalesce(n->>'customer_name','Customer'),target,true);
    end if;
    if tg_op='UPDATE' and n->>'status' is distinct from o->>'status' then
      title := case n->>'status' when 'Confirmed' then 'Order accepted' when 'Preparing' then 'Order preparing'
        when 'Ready for Pickup' then 'Ready to claim' when 'Ready to Claim' then 'Ready to claim'
        when 'Out for Delivery' then 'Out for delivery' when 'Completed' then 'Order completed'
        when 'Received' then 'Order received' when 'Cancelled' then 'Order cancelled' else null end;
      if title is not null then
        perform public.emit_user_notification(customer,k||':status','order_status','orders',title,label,target,n->>'status' in ('Ready for Pickup','Ready to Claim','Out for Delivery'));
      end if;
    end if;
    if n->>'payment_proof_path' is not null and n->>'payment_proof_path' is distinct from o->>'payment_proof_path' then
      perform public.emit_team_notification(management,k||':proof','payment_proof','payments','Payment proof received',label||' needs verification.',target,true);
      -- Upload confirmation is a toast only, emitted by the upload form.
    end if;
    if tg_op='UPDATE' and (n->>'payment_status' is distinct from o->>'payment_status' or n->>'payment_confirmed' is distinct from o->>'payment_confirmed') then
      if (n->>'payment_confirmed'='true' or n->>'payment_status' in ('paid','verified','confirmed'))
        and not (coalesce(o->>'payment_confirmed','false')='true' or coalesce(o->>'payment_status','') in ('paid','verified','confirmed')) then
        perform public.emit_user_notification(customer,k||':payment','payment_verified','payments','Payment verified',label,target,false);
      elsif n->>'payment_status' in ('failed','rejected') and n->>'payment_status' is distinct from o->>'payment_status' then
        perform public.emit_user_notification(customer,k||':payment','payment_issue','payments','Payment needs attention',label||' · Check your payment details.',target,true);
      end if;
    end if;
    if nullif(n->>'tracking_url','') is not null and n->>'tracking_url' is distinct from o->>'tracking_url' then
      perform public.emit_user_notification(customer,k||':tracking','tracking_updated','orders','Tracking link updated',label,target,false);
    end if;
    if n->>'cancellation_status'='requested' and n->>'cancellation_status' is distinct from o->>'cancellation_status' then
      if n->>'cancellation_requested_by_role'='Customer' then
        perform public.emit_team_notification(management,k||':cancel','cancellation_requested','cancellations','Cancellation review requested',label||' is on hold for review.',target||jsonb_build_object('kind','cancellation'),true);
      end if;
      perform public.emit_user_notification(customer,k||':review','cancellation_review','cancellations','Cancellation under review',label,target,false);
    elsif n->>'status'='Cancelled' and n->>'status' is distinct from o->>'status' and n->>'cancelled_by_role'='Customer' then
      perform public.emit_team_notification(management,k||':cancel','customer_cancelled','cancellations','Customer cancellation',label||' was cancelled.',target||jsonb_build_object('kind','cancellation'),true);
    elsif n->>'cancellation_status'='rejected' and n->>'cancellation_status' is distinct from o->>'cancellation_status' then
      perform public.emit_user_notification(customer,k||':review','cancellation_decision','cancellations','Your order will continue',label||' · '||coalesce(n->>'cancellation_review_notes','Cancellation was not approved.'),target,false);
    end if;
  elsif tg_table_name='benefit_applications' then
    if n->>'status' is distinct from o->>'status' then
      if n->>'status'='pending' then
        perform public.emit_team_notification(array['admin'],k,'benefit_pending','benefits','Benefits application',coalesce(n->>'full_name','Customer')||' · Awaiting review',jsonb_build_object('kind','benefits'),false);
      else
        title := case n->>'status' when 'approved' then 'Benefits approved' when 'rejected' then 'Benefits application rejected' else 'Benefits need corrections' end;
        perform public.emit_user_notification((n->>'customer_id')::uuid,k,'benefit_decision','benefits',title,n->>'review_note',jsonb_build_object('kind','benefits'),n->>'status'<>'approved');
      end if;
    end if;
  elsif tg_table_name='menu_change_approvals' then
    target := jsonb_build_object('kind','menu-approval','id',n->>'id');
    if n->>'state'='pending' and tg_op='INSERT' and coalesce(n->>'operation','') not in ('set_availability','bulk_availability') then
      perform public.emit_team_notification(array['admin'],'approval:menu:'||(n->>'id'),'menu_approval','approvals','Menu approval needed',n->>'item_name',target,false);
    elsif n->>'state' in ('approved','rejected') and n->>'state' is distinct from o->>'state' then
      perform public.emit_user_notification((n->>'submitted_by')::uuid,k,'menu_decision','decisions','Menu change '||(n->>'state'),(n->>'item_name')||coalesce(' · '||nullif(n->>'review_note',''),''),target,false);
    end if;
  elsif tg_table_name='purchase_orders' then
    target := jsonb_build_object('kind','purchase-order','id',n->>'id');
    if n->>'status' is distinct from o->>'status' then
      if n->>'status' in ('pending_approval','returned') then
        perform public.emit_team_notification(array['admin'],k,'purchase_'||(n->>'status'),'approvals',case n->>'status' when 'returned' then 'Purchase order returned' else 'Purchase order approval needed' end,n->>'po_number',target,true);
      elsif n->>'status' in ('approved','rejected') then
        perform public.emit_user_notification(coalesce(n->>'submitted_by',n->>'created_by')::uuid,k,'purchase_decision','decisions','Purchase order '||(n->>'status'),(n->>'po_number')||coalesce(' · '||nullif(n->>'rejection_reason',''),''),target,true);
      end if;
    end if;
  elsif tg_table_name='customer_messages' and tg_op='INSERT' then
    perform public.emit_team_notification(array['admin'],k,'customer_message','messages','New customer inquiry',n->>'subject',jsonb_build_object('kind','message','id',n->>'id'),false);
  elsif tg_table_name='refunds' and n->>'refund_status' is distinct from o->>'refund_status' then
    select customer_id,order_number into customer,label from public.orders where id=(n->>'order_id')::uuid;
    target := jsonb_build_object('kind','order','id',n->>'order_id','orderNumber',label);
    if n->>'refund_status'='pending' then
      perform public.emit_team_notification(array['admin'],k,'refund_pending','refunds','Refund needs action',label,target||jsonb_build_object('kind','refund'),true);
    end if;
    perform public.emit_user_notification(customer,k,'refund_update','refunds',case n->>'refund_status' when 'pending' then 'Refund pending' when 'processed' then 'Refund completed' else 'Refund update' end,label,target,false);
  elsif tg_table_name in ('inventory_stock','finished_products') then
    if coalesce(n->>'is_archived','false')='true' then return new; end if;
    quantity := (n->>'quantity')::numeric; minimum := (n->>'min_stock_level')::numeric;
    old_quantity := (o->>'quantity')::numeric; old_minimum := (o->>'min_stock_level')::numeric;
    if quantity is null or minimum is null then return new; end if;
    if quantity<=0 and (tg_op='INSERT' or old_quantity>0) then typ:='out_of_stock'; title:='Out of stock';
    elsif quantity>0 and quantity<=minimum and (tg_op='INSERT' or old_quantity>old_minimum) then typ:='low_stock'; title:='Low stock';
    elsif quantity>0 and (old_quantity<=0 or (quantity>minimum and old_quantity<=old_minimum)) then typ:='stock_restored'; title:='Stock restored';
    else return new; end if;
    label := n->>'name';
    if tg_table_name='inventory_stock' then select name into label from public.ingredients where id=(n->>'ingredient_id')::uuid and not is_archived; end if;
    if label is null then return new; end if;
    target := jsonb_build_object('kind','inventory','itemType',case tg_table_name when 'inventory_stock' then 'ingredient' else 'finished_product' end,'name',label);
    perform public.emit_team_notification(management,k,typ,'inventory',title,label||' · '||quantity||' remaining',target,typ<>'stock_restored');
  elsif tg_table_name='menu_items' then
    perform public.emit_team_notification(management,k,'menu_changed','menu','Menu changed',coalesce(n->>'name','Menu item')||case tg_op when 'INSERT' then ' added.' when 'DELETE' then ' removed.' else ' updated.' end,null,false);
  elsif tg_table_name='daily_opening_stock_settings' and n->>'last_run_at' is not null and n->>'last_run_at' is distinct from o->>'last_run_at' then
    perform public.emit_team_notification(management,'daily-opening-stock-run:'||(n->>'last_run_at'),'daily_restock','inventory','Daily restock complete','Opening stock has been set for today.',jsonb_build_object('kind','daily-restock'),true);
  end if;
  return coalesce(new,old);
end;
$$;
revoke all on function public.capture_user_notification() from public, anon, authenticated;
do $$ declare tab text; begin
  foreach tab in array array['orders','benefit_applications','menu_change_approvals','purchase_orders','customer_messages','refunds','inventory_stock','finished_products','menu_items','daily_opening_stock_settings'] loop
    execute format('create trigger capture_notification after insert or update%s on public.%I for each row execute function public.capture_user_notification()',case when tab='menu_items' then ' or delete' else '' end,tab);
  end loop;
end $$;

-- Match the preparation queue's scheduled-time overdue rule, once per schedule.
-- Called while a staff workspace is active; history remains available offline.
create function public.check_overdue_notifications() returns void
language plpgsql security definer set search_path = public as $$
declare item record;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and public.normalize_role(role) in ('staff','operational_staff') and removed_at is null) then return; end if;
  for item in select id,order_number,schedule_date,schedule_time from public.orders
    where status not in ('Completed','Received','Cancelled') and not coalesce(fulfillment_hold,false) and not coalesce(is_voided,false)
      and schedule_date is not null and schedule_time is not null
      and (schedule_date::text||' '||schedule_time::text)::timestamp at time zone 'Asia/Manila' < now()
  loop
    perform public.emit_user_notification(auth.uid(),'overdue:'||item.id||':'||item.schedule_date||':'||item.schedule_time,'order_overdue','orders','Order overdue',item.order_number,jsonb_build_object('kind','order','id',item.id),true);
  end loop;
end;
$$;
revoke all on function public.check_overdue_notifications() from public;
grant execute on function public.check_overdue_notifications() to authenticated;
alter publication supabase_realtime add table public.user_notifications;
