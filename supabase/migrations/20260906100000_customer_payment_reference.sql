-- Save customer-entered transaction references together with payment proofs.
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
  v_method text;
  v_reference text := btrim(coalesce(p_reference_number, ''));
begin
  if not public.is_customer_profile() then
    raise exception 'Customer account access required';
  end if;

  select p.method
    into v_method
  from public.orders o
  join public.payments p on p.order_id = o.id
  where o.id = p_order_id
    and o.customer_id = auth.uid()
    and p.method in ('gcash', 'bank_transfer')
  limit 1;

  if not found then
    raise exception 'Eligible payment was not found';
  end if;

  if v_method = 'gcash' and v_reference !~ '^[0-9]{13}$' then
    raise exception 'GCash reference number must be exactly 13 digits';
  end if;
  if v_method = 'bank_transfer' and v_reference !~ '^[A-Za-z0-9-]{6,30}$' then
    raise exception 'Bank reference must be 6 to 30 letters, numbers, or hyphens';
  end if;

  perform public.attach_customer_payment_proof(p_order_id, p_path);

  update public.payments
  set reference_number = v_reference
  where order_id = p_order_id
    and method = v_method;
end;
$$;

revoke all on function public.attach_customer_payment_proof(uuid, text, text) from public, anon;
grant execute on function public.attach_customer_payment_proof(uuid, text, text) to authenticated;
