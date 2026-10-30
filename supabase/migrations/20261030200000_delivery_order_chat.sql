-- Delivery-only conversations, atomic dispatch, delivery proof and receipt deadlines.
-- Apply the whole file. Existing pickup/counter workflows are retained.
begin;

alter table public.orders
  add column if not exists delivery_chat_opened_at timestamptz,
  add column if not exists delivery_chat_closed_at timestamptz,
  add column if not exists delivery_confirmation_started_at timestamptz,
  add column if not exists delivery_confirmation_deadline timestamptz;

create table if not exists public.delivery_chat_messages (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_name text not null,
  sender_role text not null check(sender_role in ('customer','staff','system')),
  kind text not null default 'text' check(kind in ('text','system','tracking','proof')),
  body text not null check(char_length(body) between 1 and 2000),
  tracking_url text,
  attachment_paths text[] not null default '{}',
  client_key uuid,
  event_key text,
  created_at timestamptz not null default clock_timestamp(),
  unique(order_id,sender_id,client_key), unique(order_id,event_key),
  check(cardinality(attachment_paths)<=3)
);
create index if not exists delivery_chat_messages_order_idx on public.delivery_chat_messages(order_id,id desc);
create index if not exists delivery_chat_messages_sender_idx on public.delivery_chat_messages(sender_id,created_at);
create table if not exists public.delivery_chat_reads (
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_id bigint not null default 0,
  primary key(order_id,user_id)
);

create or replace function public.is_delivery_chat_staff() returns boolean
language sql stable security definer set search_path=public as $$
  select auth.uid() is not null and exists(select 1 from public.profiles
    where id=auth.uid() and removed_at is null
      and public.normalize_role(role) in ('admin','staff','operational_staff'));
$$;
create or replace function public.can_read_delivery_chat(p_order_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select auth.uid() is not null and exists(select 1 from public.orders
    where id=p_order_id and order_type='delivery' and delivery_chat_opened_at is not null
      and (public.is_delivery_chat_staff() or (customer_id=auth.uid() and public.is_customer_profile())));
$$;
revoke all on function public.is_delivery_chat_staff() from public;
revoke all on function public.can_read_delivery_chat(uuid) from public;
grant execute on function public.is_delivery_chat_staff(),public.can_read_delivery_chat(uuid) to authenticated;

alter table public.delivery_chat_messages enable row level security;
alter table public.delivery_chat_reads enable row level security;
revoke all on public.delivery_chat_messages,public.delivery_chat_reads from anon,authenticated;
grant select on public.delivery_chat_messages,public.delivery_chat_reads to authenticated;
drop policy if exists "Participants read delivery messages" on public.delivery_chat_messages;
create policy "Participants read delivery messages" on public.delivery_chat_messages for select to authenticated
  using(public.can_read_delivery_chat(order_id));
drop policy if exists "Participants read own delivery read position" on public.delivery_chat_reads;
create policy "Participants read own delivery read position" on public.delivery_chat_reads for select to authenticated
  using(user_id=auth.uid() and public.can_read_delivery_chat(order_id));

create or replace function public.sync_delivery_chat_state() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.order_type<>'delivery' then return new; end if;
  if new.delivery_chat_opened_at is null and new.status in ('Ready for Pickup','Out for Delivery') then
    new.delivery_chat_opened_at:=clock_timestamp();
  end if;
  if new.delivery_chat_opened_at is not null and new.status in ('Completed','Received','Cancelled') then
    new.delivery_chat_closed_at:=coalesce(new.delivery_chat_closed_at,clock_timestamp());
  end if;
  if new.status='Out for Delivery' and new.rider_booking='customer' then new.tracking_url:=null; end if;
  if new.status='Out for Delivery' and old.status is distinct from new.status and coalesce(new.rider_booking,'staff')='staff'
    and (nullif(btrim(new.tracking_url),'') is null or length(new.tracking_url)>500 or new.tracking_url !~* '^https?://[^[:space:]]+$') then
    raise exception 'Enter a valid rider tracking link';
  end if;
  return new;
end; $$;
drop trigger if exists delivery_chat_state_before_update on public.orders;
create trigger delivery_chat_state_before_update before update on public.orders
  for each row execute function public.sync_delivery_chat_state();

create or replace function public.publish_delivery_chat_events() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.order_type<>'delivery' or new.delivery_chat_opened_at is null then return new; end if;
  if old.delivery_chat_opened_at is null then
    insert into public.delivery_chat_messages(order_id,sender_name,sender_role,kind,body,event_key)
    values(new.id,'The Coffee Realm','system','system','Your order is ready for delivery. You can now message our team.','opened') on conflict do nothing;
  end if;
  if new.status='Out for Delivery' and coalesce(new.rider_booking,'staff')='staff'
     and nullif(btrim(new.tracking_url),'') is not null
     and (old.status is distinct from new.status or old.tracking_url is distinct from new.tracking_url) then
    insert into public.delivery_chat_messages(order_id,sender_name,sender_role,kind,body,tracking_url,event_key)
    values(new.id,'The Coffee Realm','system','tracking','Your rider is on the way. Track your delivery below.',new.tracking_url,'tracking:'||new.tracking_url) on conflict do nothing;
  end if;
  if new.delivery_chat_closed_at is not null and old.delivery_chat_closed_at is null then
    insert into public.delivery_chat_messages(order_id,sender_name,sender_role,kind,body,event_key)
    values(new.id,'The Coffee Realm','system','system',case when new.status='Cancelled' then 'Order cancelled. This chat is now closed.' else 'Order completed. Thank you for ordering from The Coffee Realm! This chat is now closed.' end,'closed') on conflict do nothing;
  end if;
  return new;
end; $$;
drop trigger if exists delivery_chat_events_after_update on public.orders;
create trigger delivery_chat_events_after_update after update on public.orders
  for each row execute function public.publish_delivery_chat_events();
-- Open conversations for already prepared active deliveries; don't reopen old finished orders.
update public.orders set delivery_chat_opened_at=coalesce(delivery_chat_opened_at,now())
where order_type='delivery' and status in ('Ready for Pickup','Out for Delivery');

create or replace function public.list_delivery_chats() returns jsonb
language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(thread.payload order by thread.latest_id desc nulls last,thread.opened_at desc),'[]'::jsonb)
  from (
    select o.delivery_chat_opened_at opened_at,last_message.id latest_id,
      jsonb_build_object('id',o.id,'order_number',o.order_number,'status',o.status,
        'customer_name',o.customer_name,'customer_phone',o.customer_phone,'customer_avatar',p.avatar_url,
        'delivery_address',o.delivery_address,'rider_booking',coalesce(o.rider_booking,'staff'),
        'delivery_fee',o.delivery_fee,'final_total',o.final_total,'payment_status',o.payment_status,
        'payment_confirmed',o.payment_confirmed,'opened_at',o.delivery_chat_opened_at,'closed_at',o.delivery_chat_closed_at,
        'confirmation_deadline',o.delivery_confirmation_deadline,'fulfillment_hold',coalesce(o.fulfillment_hold,false),
        'cancellation_status',o.cancellation_status,'latest_body',last_message.body,'latest_at',last_message.created_at,
        'unread_count',(select count(*) from public.delivery_chat_messages m where m.order_id=o.id
          and m.id>coalesce(reads.last_read_id,0) and m.sender_id is distinct from auth.uid()),
        'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'name',coalesce(i.display_name,i.item_name),
          'quantity',i.quantity,'line_total',i.line_total,'customizations',i.customizations)) from public.order_items i where i.order_id=o.id),'[]'::jsonb)
      ) payload
    from public.orders o
    left join public.profiles p on p.id=o.customer_id
    left join public.delivery_chat_reads reads on reads.order_id=o.id and reads.user_id=auth.uid()
    left join lateral (select id,body,created_at from public.delivery_chat_messages where order_id=o.id order by id desc limit 1) last_message on true
    where public.can_read_delivery_chat(o.id)
    order by (o.delivery_chat_closed_at is null) desc,last_message.id desc nulls last
    limit 200
  ) thread;
$$;
revoke all on function public.list_delivery_chats() from public,anon;
grant execute on function public.list_delivery_chats() to authenticated;

create or replace function public.mark_delivery_chat_read(p_order_id uuid,p_last_id bigint) returns void
language plpgsql security definer set search_path=public as $$
declare v_last bigint;
begin
  if not public.can_read_delivery_chat(p_order_id) then raise exception 'Conversation unavailable'; end if;
  select coalesce(max(id),0) into v_last from public.delivery_chat_messages where order_id=p_order_id and id<=p_last_id;
  insert into public.delivery_chat_reads(order_id,user_id,last_read_id) values(p_order_id,auth.uid(),v_last)
  on conflict(order_id,user_id) do update set last_read_id=greatest(delivery_chat_reads.last_read_id,excluded.last_read_id);
end; $$;
revoke all on function public.mark_delivery_chat_read(uuid,bigint) from public,anon;
grant execute on function public.mark_delivery_chat_read(uuid,bigint) to authenticated;

create or replace function public.send_delivery_chat_message(p_order_id uuid,p_body text,p_client_key uuid)
returns public.delivery_chat_messages language plpgsql security definer set search_path=public as $$
declare v_order public.orders%rowtype; v_message public.delivery_chat_messages%rowtype; v_name text;
begin
  if not public.can_read_delivery_chat(p_order_id) then raise exception 'Conversation unavailable'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  select * into v_message from public.delivery_chat_messages where order_id=p_order_id and sender_id=auth.uid() and client_key=p_client_key;
  if found then return v_message; end if;
  if p_client_key is null or nullif(btrim(p_body),'') is null or char_length(p_body)>2000 then raise exception 'Enter a message up to 2000 characters'; end if;
  if v_order.delivery_chat_closed_at is not null or v_order.status in ('Completed','Received','Cancelled')
    or v_order.fulfillment_hold or v_order.cancellation_status='requested'
    or v_order.delivery_confirmation_deadline<=clock_timestamp() then raise exception 'This chat is closed'; end if;
  if (select count(*) from public.delivery_chat_messages where sender_id=auth.uid() and created_at>now()-interval '1 minute')>=30 then raise exception 'Please wait a moment before sending another message'; end if;
  select coalesce(nullif(full_name,''),nullif(username,''),'Customer') into v_name from public.profiles where id=auth.uid();
  insert into public.delivery_chat_messages(order_id,sender_id,sender_name,sender_role,body,client_key)
  values(p_order_id,auth.uid(),coalesce(v_name,'Team member'),case when public.is_delivery_chat_staff() then 'staff' else 'customer' end,btrim(p_body),p_client_key)
  returning * into v_message;
  return v_message;
end; $$;
revoke all on function public.send_delivery_chat_message(uuid,text,uuid) from public,anon;
grant execute on function public.send_delivery_chat_message(uuid,text,uuid) to authenticated;

-- Keep dispatch and its tracking message atomic, retaining the existing transition checks.
create or replace function public.staff_dispatch_delivery(p_order_id uuid,p_tracking_url text default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_order public.orders%rowtype; v_url text:=nullif(btrim(p_tracking_url),'');
begin
  if not public.is_delivery_chat_staff() then raise exception 'Staff access required'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.order_type<>'delivery' then raise exception 'Delivery order not found'; end if;
  if v_order.status='Out for Delivery' then return jsonb_build_object('id',v_order.id,'status',v_order.status,'tracking_url',v_order.tracking_url); end if;
  if v_order.status<>'Ready for Pickup' then raise exception 'Mark the order ready before dispatch'; end if;
  if coalesce(v_order.rider_booking,'staff')='staff' then
    if v_url is null or length(v_url)>500 or v_url !~* '^https?://[^[:space:]]+$' then raise exception 'Enter a valid rider tracking link'; end if;
  else v_url:=null; end if;
  -- Stored before the status transition in this same transaction; events publish only after dispatch.
  update public.orders set tracking_url=v_url where id=p_order_id;
  perform public.staff_advance_order_status(p_order_id,'Out for Delivery');
  return jsonb_build_object('id',p_order_id,'status','Out for Delivery','tracking_url',v_url);
end; $$;
revoke all on function public.staff_dispatch_delivery(uuid,text) from public,anon;
grant execute on function public.staff_dispatch_delivery(uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('delivery-proofs','delivery-proofs',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
drop policy if exists "Participants read delivery proof" on storage.objects;
create policy "Participants read delivery proof" on storage.objects for select to authenticated
using(bucket_id='delivery-proofs' and public.can_read_delivery_chat((storage.foldername(name))[1]::uuid));
drop policy if exists "Staff upload delivery proof" on storage.objects;
create policy "Staff upload delivery proof" on storage.objects for insert to authenticated
with check(bucket_id='delivery-proofs' and public.is_delivery_chat_staff()
  and (storage.foldername(name))[2]=auth.uid()::text
  and exists(select 1 from public.orders where id=(storage.foldername(name))[1]::uuid and order_type='delivery'
    and status='Out for Delivery' and delivery_chat_closed_at is null and delivery_confirmation_started_at is null));
drop policy if exists "Staff clean unused delivery uploads" on storage.objects;
create policy "Staff clean unused delivery uploads" on storage.objects for delete to authenticated
using(bucket_id='delivery-proofs' and public.is_delivery_chat_staff() and (storage.foldername(name))[2]=auth.uid()::text
  and not exists(select 1 from public.delivery_chat_messages where name=any(attachment_paths)));

create or replace function public.staff_confirm_delivery(p_order_id uuid,p_attachment_paths text[] default '{}') returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_order public.orders%rowtype; v_path text; v_deadline timestamptz; v_paths text[]:=coalesce(p_attachment_paths,'{}'); v_existing text[];
begin
  if not public.is_delivery_chat_staff() then raise exception 'Staff access required'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.order_type<>'delivery' then raise exception 'Delivery order not found'; end if;
  if v_order.delivery_confirmation_started_at is not null then
    select attachment_paths into v_existing from public.delivery_chat_messages where order_id=p_order_id and event_key='delivery-proof';
    return jsonb_build_object('id',p_order_id,'status',v_order.status,'deadline',v_order.delivery_confirmation_deadline,'attachment_paths',coalesce(v_existing,'{}'));
  end if;
  if v_order.status<>'Out for Delivery' or v_order.delivery_chat_closed_at is not null or v_order.fulfillment_hold or v_order.cancellation_status='requested' then raise exception 'This order cannot be confirmed for delivery'; end if;
  if cardinality(v_paths)>3 or (select count(distinct item) from unnest(v_paths) item)<>cardinality(v_paths) then raise exception 'Upload up to 3 different images'; end if;
  foreach v_path in array v_paths loop
    if v_path is null or split_part(v_path,'/',1)<>p_order_id::text or split_part(v_path,'/',2)<>auth.uid()::text
      or not exists(select 1 from storage.objects where bucket_id='delivery-proofs' and name=v_path
        and metadata->>'mimetype' in ('image/jpeg','image/png','image/webp') and (metadata->>'size')::bigint<=5242880)
    then raise exception 'Upload valid proof images for this order'; end if;
  end loop;
  v_deadline:=clock_timestamp()+interval '1 hour';
  update public.orders set delivery_confirmation_started_at=clock_timestamp(),delivery_confirmation_deadline=v_deadline,updated_at=now() where id=p_order_id;
  insert into public.delivery_chat_messages(order_id,sender_id,sender_name,sender_role,kind,body,attachment_paths,event_key)
  values(p_order_id,auth.uid(),'The Coffee Realm','staff','proof',
    'Thank you for ordering from The Coffee Realm! Please confirm that you received your order below. This order will complete and the chat will close automatically in 1 hour.',v_paths,'delivery-proof');
  return jsonb_build_object('id',p_order_id,'status','Out for Delivery','deadline',v_deadline,'attachment_paths',v_paths);
end; $$;
revoke all on function public.staff_confirm_delivery(uuid,text[]) from public,anon;
grant execute on function public.staff_confirm_delivery(uuid,text[]) to authenticated;

create or replace function public.complete_delivery_order_internal(p_order_id uuid,p_confirmation text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_order public.orders%rowtype; v_cod boolean; v_at timestamptz:=clock_timestamp();
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.order_type<>'delivery' then raise exception 'Delivery order not found'; end if;
  if v_order.status in ('Completed','Received') then return jsonb_build_object('id',p_order_id,'status',v_order.status,'received_at',v_order.received_at); end if;
  if v_order.status<>'Out for Delivery' or v_order.fulfillment_hold or v_order.cancellation_status='requested' then raise exception 'This order is not awaiting receipt confirmation'; end if;
  if p_confirmation not in ('customer','automatic') or p_confirmation is null then raise exception 'Invalid delivery confirmation'; end if;
  if p_confirmation='automatic' and (v_order.delivery_confirmation_deadline is null or v_order.delivery_confirmation_deadline>v_at) then raise exception 'Confirmation time has not expired'; end if;
  select exists(select 1 from public.payments where order_id=p_order_id and method='cod') into v_cod;
  update public.payments set status='paid',confirmed_at=coalesce(confirmed_at,v_at),confirmed_by=case when p_confirmation='customer' then coalesce(confirmed_by,auth.uid()) else confirmed_by end
  where order_id=p_order_id and method='cod';
  update public.orders set status='Completed',received_at=v_at,receipt_confirmation=p_confirmation,
    payment_status=case when v_cod then 'paid' else payment_status end,
    payment_confirmed=case when v_cod then true else payment_confirmed end,
    payment_confirmed_at=case when v_cod then coalesce(payment_confirmed_at,v_at) else payment_confirmed_at end,
    updated_at=v_at where id=p_order_id;
  perform public.deduct_order_ingredients(p_order_id);
  return jsonb_build_object('id',p_order_id,'status','Completed','received_at',v_at,'receipt_confirmation',p_confirmation);
end; $$;
revoke all on function public.complete_delivery_order_internal(uuid,text) from public,anon,authenticated;

create or replace function public.customer_confirm_order_received(p_order_id uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
begin
  if not public.is_customer_profile() or not exists(select 1 from public.orders where id=p_order_id and customer_id=auth.uid()) then raise exception 'Order not found'; end if;
  return public.complete_delivery_order_internal(p_order_id,'customer');
end; $$;
revoke all on function public.customer_confirm_order_received(uuid) from public,anon;
grant execute on function public.customer_confirm_order_received(uuid) to authenticated;

-- Replace the old 24-hour dispatch timeout with the explicit one-hour staff confirmation window.
create or replace function public.auto_receive_unconfirmed_delivery_orders() returns integer
language plpgsql security definer set search_path=public as $$
declare v_order record; v_count integer:=0;
begin
  for v_order in select id from public.orders where order_type='delivery' and status='Out for Delivery'
    and delivery_confirmation_deadline<=clock_timestamp() and not coalesce(fulfillment_hold,false)
    and coalesce(cancellation_status,'')<>'requested' for update skip locked
  loop
    perform public.complete_delivery_order_internal(v_order.id,'automatic');
    v_count:=v_count+1;
  end loop;
  return v_count;
end; $$;
revoke all on function public.auto_receive_unconfirmed_delivery_orders() from public,anon,authenticated;
create extension if not exists pg_cron with schema pg_catalog;
do $$ declare v_job bigint; begin
  for v_job in select jobid from cron.job where jobname='auto-receive-delivery-orders' loop perform cron.unschedule(v_job); end loop;
end; $$;
select cron.schedule('auto-receive-delivery-orders','* * * * *','select public.auto_receive_unconfirmed_delivery_orders();');

-- Subscribe with the existing authenticated clients; row policies filter every message.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='delivery_chat_messages') then
      alter publication supabase_realtime add table public.delivery_chat_messages;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='delivery_chat_reads') then
      alter publication supabase_realtime add table public.delivery_chat_reads;
    end if;
  end if;
end; $$;
revoke all on function public.sync_delivery_chat_state(),public.publish_delivery_chat_events() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
