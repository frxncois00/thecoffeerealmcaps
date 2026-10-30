begin;

create function public.return_purchase_order_delivery(
  p_id uuid, p_lines jsonb, p_document_ids uuid[], p_notes text default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_order record; v_item record; v_line jsonb; v_received numeric; v_outstanding numeric;
  v_lines jsonb:='[]'::jsonb; v_issues jsonb; v_answers jsonb;
  v_count integer; v_returned numeric:=0; v_shortage boolean:=false; v_report_id uuid;
begin
  perform public.assert_purchase_order_access(false);
  select * into v_order from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_order.created_by<>auth.uid() then raise exception 'Only the staff member who created this purchase order can return it'; end if;
  if v_order.status not in ('sent','receiving_correction','receiving_rejected','receiving_information') then
    raise exception 'This purchase order cannot be returned at this stage';
  end if;
  if exists(select 1 from public.purchase_order_items where purchase_order_id=p_id and accepted_quantity>0)
    or v_order.inventory_posted_at is not null then
    raise exception 'This order already has stocked items. Use the receiving review flow instead';
  end if;
  if jsonb_typeof(p_lines) is distinct from 'array' then raise exception 'Receiving lines are required'; end if;
  select count(*) into v_count from public.purchase_order_items where purchase_order_id=p_id and accepted_quantity<quantity_ordered;
  if v_count=0 or jsonb_array_length(p_lines)<>v_count or
    (select count(distinct line->>'id') from jsonb_array_elements(p_lines) line)<>v_count then
    raise exception 'Every outstanding item must appear exactly once';
  end if;
  for v_line in select value from jsonb_array_elements(p_lines) loop
    select * into v_item from public.purchase_order_items
      where id=(v_line->>'id')::uuid and purchase_order_id=p_id and accepted_quantity<quantity_ordered for update;
    if not found then raise exception 'A receiving line does not belong to this order'; end if;
    v_outstanding:=v_item.quantity_ordered-v_item.accepted_quantity;
    v_received:=(v_line->>'receivedQuantity')::numeric;
    if v_received is null or v_received::text in ('NaN','Infinity','-Infinity')
      or v_received<0 or v_received>v_outstanding then
      raise exception 'Received quantity must be between zero and the outstanding quantity';
    end if;
    v_returned:=v_returned+v_received;
    v_shortage:=v_shortage or v_received<v_outstanding;
    v_issues:=case when v_received>0 then jsonb_build_array(jsonb_build_object('type','return_all','quantity',v_received)) else '[]'::jsonb end;
    if v_received<v_outstanding then
      v_issues:=v_issues||jsonb_build_array(jsonb_build_object('type',case when v_received=0 then 'not_received' else 'missing_quantity' end,'quantity',v_outstanding-v_received));
    end if;
    v_lines:=v_lines||jsonb_build_array(jsonb_build_object('id',v_item.id,'receivedQuantity',v_received,'selected',true,'issues',v_issues));
  end loop;
  if v_returned=0 then raise exception 'No received items were entered to return'; end if;
  v_answers:=jsonb_build_object('0','no','1',case when v_shortage then 'no' else 'yes' end,'2','yes','3','yes');
  v_report_id:=public.submit_purchase_order_delivery(p_id,v_lines,v_answers,p_document_ids,p_notes,true);
  update public.purchase_order_receiving_reports
    set status='approved',reviewed_at=now(),review_note='All physically received items returned; no inventory added.'
    where id=v_report_id;
  update public.purchase_orders
    set status='returned',has_receiving_issues=true,payable_amount=0,
      closed_by=auth.uid(),closed_at=now(),updated_at=now()
    where id=p_id and status='pending_receiving_review';
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by)
    values(p_id,'pending_receiving_review','returned','all_received_returned',
      'All physically received items returned; no inventory added.',auth.uid());
  return v_report_id;
end; $$;

revoke all on function public.return_purchase_order_delivery(uuid,jsonb,uuid[],text) from public,anon;
grant execute on function public.return_purchase_order_delivery(uuid,jsonb,uuid[],text) to authenticated;

commit;
notify pgrst,'reload schema';
