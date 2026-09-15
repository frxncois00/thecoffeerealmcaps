alter table public.orders add column if not exists tracking_url text;
create or replace function public.staff_set_order_tracking_url(p_order_id uuid,p_tracking_url text)
returns public.orders language plpgsql security definer set search_path=public as $$
declare v_order public.orders;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','staff','operational_staff')) then raise exception 'Staff access required'; end if;
 if p_tracking_url is not null and (length(btrim(p_tracking_url))>500 or btrim(p_tracking_url) !~* '^https?://[^[:space:]]+$') then raise exception 'Enter a valid HTTP or HTTPS tracking link'; end if;
 update public.orders set tracking_url=nullif(btrim(p_tracking_url),''),updated_at=now() where id=p_order_id and order_type='delivery' and status='Out for Delivery' returning * into v_order;
 if not found then raise exception 'Only delivery orders out for delivery can have a tracking link'; end if;
 return v_order;
end; $$;
revoke all on function public.staff_set_order_tracking_url(uuid,text) from public;
grant execute on function public.staff_set_order_tracking_url(uuid,text) to authenticated;
