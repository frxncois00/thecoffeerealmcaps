begin;
create policy "Participants upload chat images" on storage.objects for insert to authenticated
with check(bucket_id='delivery-proofs' and (storage.foldername(name))[2]=auth.uid()::text
  and public.can_read_delivery_chat((storage.foldername(name))[1]::uuid)
  and exists(select 1 from public.orders where id=(storage.foldername(name))[1]::uuid
    and delivery_chat_opened_at is not null and delivery_chat_closed_at is null
    and status not in ('Completed','Received','Cancelled') and not coalesce(fulfillment_hold,false)
    and coalesce(cancellation_status,'')<>'requested'
    and (delivery_confirmation_deadline is null or delivery_confirmation_deadline>now())));

create or replace function public.send_delivery_chat_image(p_order_id uuid,p_path text,p_client_key uuid)
returns public.delivery_chat_messages language plpgsql security definer set search_path=public as $$
declare v_message public.delivery_chat_messages%rowtype;
begin
  if not public.can_read_delivery_chat(p_order_id) then raise exception 'Conversation unavailable'; end if;
  select * into v_message from public.delivery_chat_messages where order_id=p_order_id and sender_id=auth.uid() and client_key=p_client_key;
  if found then return v_message; end if;
  if p_path is null or split_part(p_path,'/',1)<>p_order_id::text or split_part(p_path,'/',2)<>auth.uid()::text
    or not exists(select 1 from storage.objects where bucket_id='delivery-proofs' and name=p_path
      and metadata->>'mimetype' in ('image/jpeg','image/png','image/webp') and (metadata->>'size')::bigint between 1 and 5242880)
    then raise exception 'Choose one valid image up to 5 MB'; end if;
  v_message:=public.send_delivery_chat_message(p_order_id,'Shared an image',p_client_key);
  update public.delivery_chat_messages set attachment_paths=array[p_path] where id=v_message.id returning * into v_message;
  return v_message;
end; $$;
revoke all on function public.send_delivery_chat_image(uuid,text,uuid) from public,anon;
grant execute on function public.send_delivery_chat_image(uuid,text,uuid) to authenticated;
commit;
