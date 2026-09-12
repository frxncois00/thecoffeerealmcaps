-- Accept the current online-order payment status and keep proof retries safe.
create or replace function public.attach_customer_payment_proof(
  p_order_id uuid,
  p_path text,
  p_reference_number text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_payment_confirmed boolean;
  v_fulfillment_hold boolean;
  v_cancellation_status text;
  v_method text;
  v_reference text := btrim(coalesce(p_reference_number, ''));
begin
  if not public.is_customer_profile() then
    raise exception 'Customer account access required';
  end if;

  select
    o.status,
    o.payment_confirmed,
    o.fulfillment_hold,
    o.cancellation_status,
    p.method
    into
      v_status,
      v_payment_confirmed,
      v_fulfillment_hold,
      v_cancellation_status,
      v_method
  from public.orders o
  join public.payments p on p.order_id = o.id
  where o.id = p_order_id
    and o.customer_id = auth.uid()
    and p.method in ('gcash', 'bank_transfer')
  limit 1;

  if not found then
    raise exception 'Payment order not found or not owned by the signed-in customer';
  end if;
  if coalesce(v_payment_confirmed, false) then
    raise exception 'This payment has already been confirmed';
  end if;
  if coalesce(v_fulfillment_hold, false)
    or lower(btrim(coalesce(v_cancellation_status, ''))) = 'requested' then
    raise exception 'Payment proof cannot be changed while cancellation is under review';
  end if;
  if lower(btrim(coalesce(v_status, ''))) not in (
    'awaiting payment verification',
    'pending confirmation',
    'order received'
  ) then
    raise exception 'This order no longer accepts payment proofs';
  end if;

  if v_method = 'gcash' and v_reference !~ '^[0-9]{13}$' then
    raise exception 'GCash reference number must be exactly 13 digits';
  end if;
  if v_method = 'bank_transfer' and v_reference !~ '^[A-Za-z0-9-]{6,30}$' then
    raise exception 'Bank reference must be 6 to 30 letters, numbers, or hyphens';
  end if;
  if p_path is null or p_path !~ (
    '^' || auth.uid()::text || '/' || p_order_id::text || '_[0-9]{8}[.](jpg|png|webp)$'
  ) then
    raise exception 'Invalid payment proof path';
  end if;

  perform 1
  from storage.objects proof
  where proof.bucket_id = 'payment-proofs'
    and proof.name = p_path
    and lower(coalesce(proof.metadata->>'mimetype', '')) in (
      'image/jpeg',
      'image/png',
      'image/webp'
    );
  if not found then
    raise exception 'Payment proof object was not found';
  end if;

  update public.orders
  set payment_proof_path = p_path,
      payment_status = 'pending',
      payment_confirmed = false,
      updated_at = now()
  where id = p_order_id
    and customer_id = auth.uid();

  update public.payments
  set reference_number = v_reference,
      status = 'pending'
  where order_id = p_order_id
    and method = v_method;
end;
$$;

revoke all on function public.attach_customer_payment_proof(uuid, text, text) from public, anon;
grant execute on function public.attach_customer_payment_proof(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
