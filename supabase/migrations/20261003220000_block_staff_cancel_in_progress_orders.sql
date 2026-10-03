-- Block staff cancellation of orders in progress (Preparing, Ready for Pickup, Out for Delivery, Received, Completed).

create or replace function public.staff_cancel_order(p_order_id uuid, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_role text;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_needs_review boolean;
  v_email_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select public.normalize_role(role) into v_role from public.profiles where id = auth.uid();
  if v_role is null or v_role not in ('admin','staff','operational_staff','cashier') then
    raise exception 'Operations access required';
  end if;
  if v_reason = '' then raise exception 'A cancellation reason is required'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status = 'Cancelled' then raise exception 'This order is already cancelled'; end if;
  if v_order.status = 'Completed' then raise exception 'A completed order cannot be cancelled'; end if;

  if lower(coalesce(v_order.status, '')) in ('preparing', 'ready for pickup', 'out for delivery', 'received') then
    raise exception 'Orders in progress can''t be cancelled.';
  end if;

  if v_order.cancellation_status = 'requested' then
    raise exception 'A cancellation request is already under review';
  end if;

  select * into v_payment
  from public.payments
  where order_id = p_order_id
  order by created_at desc
  limit 1;

  v_needs_review := coalesce(v_order.payment_confirmed, false)
    or lower(coalesce(v_order.payment_status, '')) = 'paid'
    or lower(coalesce(v_payment.status, '')) = 'paid'
    or (coalesce(v_payment.method, '') in ('gcash','bank_transfer') and v_order.payment_proof_path is not null);

  if v_needs_review then
    update public.orders set
      cancellation_status = 'requested',
      fulfillment_hold = true,
      cancellation_reason = v_reason,
      cancellation_notes = null,
      cancellation_requested_at = now(),
      cancellation_requested_by = auth.uid(),
      cancellation_requested_by_role = 'Operations Staff',
      cancellation_reviewed_at = null,
      cancellation_reviewed_by = null,
      cancellation_review_notes = null,
      cancellation_resolved = false,
      refund_status = 'pending_review',
      updated_at = now()
    where id = p_order_id;

    insert into public.order_cancellations (
      order_id, customer_id, previous_status, cancellation_reason, cancellation_notes,
      cancelled_by, cancelled_by_role, payment_status, refund_status, event_type
    ) values (
      p_order_id, v_order.customer_id, v_order.status, v_reason, null,
      auth.uid(), 'Operations Staff', v_order.payment_status, 'pending_review', 'requested'
    );

    v_email_id := public.queue_order_email(
      p_order_id, 'cancellation_requested',
      p_order_id::text || ':staff_cancellation_requested:' || extract(epoch from clock_timestamp())::text
    );

    return jsonb_build_object(
      'id', p_order_id,
      'action', 'review_requested',
      'status', v_order.status,
      'cancellation_status', 'requested',
      'refund_status', 'pending_review',
      'email_event_id', v_email_id
    );
  end if;

  update public.orders set
    status = 'Cancelled',
    cancellation_status = 'resolved',
    fulfillment_hold = false,
    cancellation_reason = v_reason,
    cancellation_notes = null,
    cancelled_by = auth.uid(),
    cancelled_by_role = 'Operations Staff',
    cancelled_at = now(),
    cancellation_resolved = true,
    refund_status = 'not_applicable',
    updated_at = now()
  where id = p_order_id;

  insert into public.order_cancellations (
    order_id, customer_id, previous_status, cancellation_reason, cancellation_notes,
    cancelled_by, cancelled_by_role, payment_status, refund_status, event_type
  ) values (
    p_order_id, v_order.customer_id, v_order.status, v_reason, null,
    auth.uid(), 'Operations Staff', v_order.payment_status, 'not_applicable', 'cancelled'
  );

  v_email_id := public.queue_order_email(
    p_order_id, 'order_cancelled',
    p_order_id::text || ':staff_order_cancelled:' || extract(epoch from clock_timestamp())::text
  );

  return jsonb_build_object(
    'id', p_order_id,
    'action', 'cancelled',
    'status', 'Cancelled',
    'cancellation_status', 'resolved',
    'refund_status', 'not_applicable',
    'email_event_id', v_email_id
  );
end;
$$;

revoke all on function public.staff_cancel_order(uuid, text) from public;
grant execute on function public.staff_cancel_order(uuid, text) to authenticated;

notify pgrst, 'reload schema';
