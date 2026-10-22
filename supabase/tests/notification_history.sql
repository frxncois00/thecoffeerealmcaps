-- Run after the notification migration. All test records are rolled back.
begin;
do $$
declare recipient uuid; total integer;
begin
  select id into recipient from auth.users limit 1;
  if recipient is null then raise exception 'A test recipient is required'; end if;
  perform public.emit_user_notification(recipient, 'notification-test:duplicate', 'test', 'test', 'Test', '', null, true);
  perform public.emit_user_notification(recipient, 'notification-test:duplicate', 'test', 'test', 'Test', '', null, true);
  select count(*) into total from public.user_notifications where user_id=recipient and event_key='notification-test:duplicate';
  if total<>1 then raise exception 'Duplicate prevention failed'; end if;
  if has_table_privilege('authenticated', 'public.user_notifications', 'INSERT')
    or has_table_privilege('authenticated', 'public.user_notifications', 'UPDATE')
    or has_table_privilege('authenticated', 'public.user_notifications', 'DELETE') then
    raise exception 'Clients must not mutate notification content';
  end if;
  if has_function_privilege('authenticated', 'public.emit_user_notification(uuid,text,text,text,text,text,jsonb,boolean)', 'EXECUTE') then
    raise exception 'Clients must not generate notifications';
  end if;
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
  perform public.mark_notifications_read();
  if exists(select 1 from public.user_notifications where user_id=recipient and event_key='notification-test:duplicate' and read_at is not null) then
    raise exception 'Read action crossed recipient boundary';
  end if;
end;
$$;
rollback;
