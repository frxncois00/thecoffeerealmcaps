-- Block voiding transactions whose status is Preparing, Received, or Completed.

create or replace function public.staff_void_order(p_order_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  perform public.assert_transaction_writer();
  if btrim(coalesce(p_reason,'')) = '' then raise exception 'A void reason is required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.is_voided then raise exception 'This transaction is already voided'; end if;

  if lower(coalesce(v_order.status, '')) in ('preparing', 'out for delivery', 'received', 'completed') then
    raise exception 'Cannot void a transaction that is already preparing, out for delivery, received, or completed';
  end if;

  update public.orders set is_voided = true, voided_reason = btrim(p_reason), voided_by = auth.uid(), voided_at = now(), updated_at = now()
    where id = p_order_id;

  insert into public.transaction_audit_log (order_id, action, reason, previous_value, new_value, performed_by)
    values (p_order_id, 'void', p_reason, jsonb_build_object('is_voided', false), jsonb_build_object('is_voided', true), auth.uid());
end;
$$;

revoke all on function public.staff_void_order(uuid, text) from public;
grant execute on function public.staff_void_order(uuid, text) to authenticated;

notify pgrst, 'reload schema';
