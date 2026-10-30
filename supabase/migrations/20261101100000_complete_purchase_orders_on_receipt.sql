begin;

-- Keep the validated receiving implementation, then close fully accepted deliveries
-- without implying that a supplier payment was recorded in the website.
alter function public.submit_purchase_order_delivery(uuid,jsonb,jsonb,uuid[],text,boolean)
  rename to submit_purchase_order_delivery_with_payment_stage;

create function public.submit_purchase_order_delivery(
  p_id uuid, p_lines jsonb, p_answers jsonb, p_document_ids uuid[],
  p_notes text default null, p_report boolean default true
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_report_id uuid; v_next text;
begin
  v_report_id := public.submit_purchase_order_delivery_with_payment_stage(
    p_id, p_lines, p_answers, p_document_ids, p_notes, p_report
  );
  if not p_report then
    select case when has_receiving_issues then 'completed_with_issues' else 'closed' end
      into v_next from public.purchase_orders where id=p_id and status='approved_for_payment';
    if v_next is null then raise exception 'The received order could not be completed'; end if;
    update public.purchase_orders
      set status=v_next, closed_by=auth.uid(), closed_at=now(), updated_at=now()
      where id=p_id;
    update public.purchase_order_events
      set to_status=v_next
      where purchase_order_id=p_id and action='delivery_received'
        and to_status='approved_for_payment'
        and created_by=auth.uid()
        and id=(select id from public.purchase_order_events
          where purchase_order_id=p_id and action='delivery_received'
            and to_status='approved_for_payment' order by created_at desc, id desc limit 1);
  end if;
  return v_report_id;
end; $$;

revoke all on function public.submit_purchase_order_delivery(uuid,jsonb,jsonb,uuid[],text,boolean) from public,anon;
revoke all on function public.submit_purchase_order_delivery_with_payment_stage(uuid,jsonb,jsonb,uuid[],text,boolean) from public,anon,authenticated;
grant execute on function public.submit_purchase_order_delivery(uuid,jsonb,jsonb,uuid[],text,boolean) to authenticated;

-- Orders already received under the previous flow should not remain in a
-- payment stage that the store does not use.
update public.purchase_orders
  set status=case when has_receiving_issues then 'completed_with_issues' else 'closed' end,
      closed_at=coalesce(closed_at,receiving_submitted_at,now()), updated_at=now()
  where status='approved_for_payment' and payment_submitted_at is null
    and exists (select 1 from public.purchase_order_receiving_reports r
      where r.purchase_order_id=purchase_orders.id and r.status='approved');

commit;
notify pgrst,'reload schema';
