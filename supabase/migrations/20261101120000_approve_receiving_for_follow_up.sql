begin;

-- Approved receiving reports always leave any unaccepted balance for a later
-- staff delivery check. Supplier settlement is handled outside this review.
create or replace function public.decide_purchase_order_receiving(
  p_id uuid, p_report_id uuid, p_decision text, p_note text default null,
  p_replacement boolean default true
) returns void
language plpgsql security definer set search_path=public as $$
declare v_order record; v_report record; v_next text;
begin
  perform public.assert_purchase_order_access(true);
  select * into v_order from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  select * into v_report from public.purchase_order_receiving_reports
    where id=p_report_id and purchase_order_id=p_id for update;
  if not found or v_report.status<>'pending' or v_order.status<>'pending_receiving_review' then
    raise exception 'This report is no longer awaiting review';
  end if;
  if p_decision is distinct from 'approve' then raise exception 'Only report approval is available'; end if;
  perform public.post_purchase_order_delivery(v_report.id);
  v_next:=case when exists(
    select 1 from public.purchase_order_items
    where purchase_order_id=p_id and accepted_quantity<quantity_ordered
  ) then 'awaiting_replacement' else 'completed_with_issues' end;
  update public.purchase_order_receiving_reports
    set status='approved',reviewed_by=auth.uid(),reviewed_at=now(),
      review_note=nullif(btrim(p_note),''),replacement_expected=(v_next='awaiting_replacement')
    where id=v_report.id;
  update public.purchase_orders
    set status=v_next,receiving_reviewed_by=auth.uid(),receiving_reviewed_at=now(),
      receiving_review_note=nullif(btrim(p_note),''),
      closed_by=case when v_next='completed_with_issues' then auth.uid() else closed_by end,
      closed_at=case when v_next='completed_with_issues' then now() else closed_at end,
      updated_at=now()
    where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by)
    values(p_id,v_order.status,v_next,'receiving_approved',
      concat_ws(' ',nullif(btrim(p_note),''),case when v_next='awaiting_replacement' then 'Follow-up delivery expected.' end),auth.uid());
end; $$;

commit;
notify pgrst,'reload schema';
