-- Item-level receiving: immutable delivery snapshots, approval-gated stock,
-- replacement cycles, and settlement restricted to accepted quantities.
begin;

alter table public.purchase_orders drop constraint if exists purchase_orders_status_check;
alter table public.purchase_orders add constraint purchase_orders_status_check check (status in (
  'draft','pending_approval','approved','rejected','sent','partially_received','pending_receiving_review',
  'approved_for_payment','payment_review','received','disputed','closed','returned','cancelled',
  'receiving_correction','receiving_rejected','receiving_information','awaiting_replacement',
  'awaiting_adjustment','completed_with_issues'
));
alter table public.purchase_orders add column if not exists payable_amount numeric not null default 0;
alter table public.purchase_orders add column if not exists has_receiving_issues boolean not null default false;
alter table public.purchase_order_documents drop constraint if exists purchase_order_documents_document_type_check;
alter table public.purchase_order_documents add constraint purchase_order_documents_document_type_check check (
  document_type in ('receiving_proof','supplier_invoice','supplier_receipt','payment_receipt','issue_evidence','adjusted_invoice','supplier_credit')
);

create table public.purchase_order_receiving_reports (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id),
  previous_status text not null,
  status text not null default 'pending' check (status in ('pending','approved','correction_requested','rejected','information_requested')),
  is_issue boolean not null,
  answers jsonb not null,
  lines jsonb not null,
  document_ids uuid[] not null,
  notes text,
  order_total numeric not null,
  accepted_value numeric not null,
  return_value numeric not null,
  missing_value numeric not null,
  not_received_value numeric not null,
  submitted_by uuid not null references public.profiles(id),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  replacement_expected boolean,
  check (order_total >= 0 and accepted_value >= 0 and return_value >= 0 and missing_value >= 0 and not_received_value >= 0),
  check (order_total = accepted_value + return_value + missing_value + not_received_value)
);
create index purchase_order_receiving_reports_order_idx on public.purchase_order_receiving_reports(purchase_order_id,submitted_at desc);
create unique index purchase_order_one_pending_report on public.purchase_order_receiving_reports(purchase_order_id) where status='pending';
alter table public.purchase_order_receiving_reports enable row level security;
create policy "Internal users read receiving reports" on public.purchase_order_receiving_reports for select to authenticated using (exists(select 1 from public.purchase_orders where id=purchase_order_id));
grant select on public.purchase_order_receiving_reports to authenticated;
revoke insert,update,delete on public.purchase_order_receiving_reports from authenticated,anon;

-- Internal helper. Only the validated submit/review RPCs may post a snapshot.
create function public.post_purchase_order_delivery(p_report_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare v_report record; v_order record; v_line jsonb; v_item record; v_accepted numeric; v_returned numeric;
begin
  select * into strict v_report from public.purchase_order_receiving_reports where id=p_report_id for update;
  select * into strict v_order from public.purchase_orders where id=v_report.purchase_order_id for update;
  if v_report.status <> 'pending' then raise exception 'This delivery was already processed'; end if;
  for v_line in select * from jsonb_array_elements(v_report.lines) loop
    select * into strict v_item from public.purchase_order_items where id=(v_line->>'id')::uuid and purchase_order_id=v_order.id for update;
    v_accepted := (v_line->>'acceptedQuantity')::numeric;
    v_returned := (v_line->>'returnQuantity')::numeric;
    if v_item.accepted_quantity + v_accepted > v_item.quantity_ordered then raise exception 'Accepted quantity exceeds the outstanding order'; end if;
    if v_accepted > 0 then
      perform public.staff_adjust_stock(v_item.item_type,case when v_item.item_type='ingredient' then v_item.ingredient_id else v_item.finished_product_id end,
        v_accepted,'restock','PO '||v_order.po_number||' accepted delivery '||v_report.id);
    end if;
    update public.purchase_order_items set
      received_quantity=received_quantity+(v_line->>'receivedQuantity')::numeric,
      accepted_quantity=accepted_quantity+v_accepted,
      damaged_quantity=damaged_quantity+coalesce((select sum((i->>'quantity')::numeric) from jsonb_array_elements(v_line->'issues') i where i->>'type'='damaged'),0),
      missing_quantity=(v_line->>'missingQuantity')::numeric+(v_line->>'notReceivedQuantity')::numeric,
      actual_unit_cost=estimated_unit_cost, updated_at=now() where id=v_item.id;
  end loop;
  update public.purchase_orders set payable_amount=(select round(sum(accepted_quantity*estimated_unit_cost),2) from public.purchase_order_items where purchase_order_id=v_order.id),
    inventory_posted_at=now(), received_by=v_report.submitted_by,received_at=now(),updated_at=now() where id=v_order.id;
end; $$;
revoke all on function public.post_purchase_order_delivery(uuid) from public,anon,authenticated;

create function public.submit_purchase_order_delivery(p_id uuid,p_lines jsonb,p_answers jsonb,p_document_ids uuid[],p_notes text default null,p_report boolean default true) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_order record; v_item record; v_line jsonb; v_issue jsonb; v_lines jsonb := '[]'; v_issues jsonb;
  v_ordered numeric; v_received numeric; v_quantity numeric; v_returns numeric; v_missing numeric; v_absent numeric;
  v_total numeric:=0; v_return_value numeric:=0; v_missing_value numeric:=0; v_absent_value numeric:=0;
  v_type text; v_selected boolean; v_selected_count integer:=0; v_count integer; v_index integer;
  v_types text[]; v_seen text[]:='{}'; v_id uuid; v_next text;
begin
  perform public.assert_purchase_order_access(false);
  select * into v_order from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_order.created_by<>auth.uid() and not exists(select 1 from public.profiles where id=auth.uid() and public.normalize_role(role)='admin') then raise exception 'This purchase order belongs to another staff member'; end if;
  if v_order.status not in ('sent','awaiting_replacement','receiving_correction','receiving_rejected','receiving_information') then raise exception 'This purchase order is not ready for a delivery check'; end if;
  if p_report is null or jsonb_typeof(p_answers) is distinct from 'object' then raise exception 'Every delivery check must be answered'; end if;
  for v_index in 0..3 loop
    if coalesce(p_answers->>v_index::text,'') not in ('yes','no') then raise exception 'Every delivery check must be Yes or No'; end if;
  end loop;
  if p_report and not exists(select 1 from jsonb_each_text(p_answers) a where a.key in ('0','1','2','3') and a.value='no') then raise exception 'An issue report requires a failed delivery check'; end if;
  if not p_report and exists(select 1 from jsonb_each_text(p_answers) a where a.key in ('0','1','2','3') and a.value<>'yes') then raise exception 'Only complete deliveries can be received without review'; end if;
  if coalesce(cardinality(p_document_ids),0)=0 or exists(select 1 from unnest(p_document_ids) d where not exists(select 1 from public.purchase_order_documents where id=d and purchase_order_id=p_id)) then raise exception 'Attach valid documents for this delivery'; end if;
  foreach v_type in array array['receiving_proof','supplier_invoice','supplier_receipt'] loop
    if not exists(select 1 from public.purchase_order_documents where id=any(p_document_ids) and purchase_order_id=p_id and document_type=v_type) then raise exception 'Proof, supplier invoice, and delivery receipt are required'; end if;
  end loop;
  if jsonb_typeof(p_lines) is distinct from 'array' then raise exception 'Receiving lines are required'; end if;
  select count(*) into v_count from public.purchase_order_items where purchase_order_id=p_id and accepted_quantity<quantity_ordered;
  if v_count=0 or jsonb_array_length(p_lines)<>v_count or (select count(distinct l->>'id') from jsonb_array_elements(p_lines) l)<>v_count then raise exception 'Every outstanding item must appear exactly once'; end if;
  for v_line in select * from jsonb_array_elements(p_lines) loop
    select * into v_item from public.purchase_order_items where id=(v_line->>'id')::uuid and purchase_order_id=p_id and accepted_quantity<quantity_ordered for update;
    if not found then raise exception 'A delivery line does not belong to this order or was already accepted'; end if;
    v_ordered := v_item.quantity_ordered-v_item.accepted_quantity;
    v_received := (v_line->>'receivedQuantity')::numeric;
    if v_received is null or v_received::text in ('NaN','Infinity','-Infinity') or v_received<0 or v_received>v_ordered then raise exception 'Received quantity must be between zero and the outstanding quantity'; end if;
    v_selected := coalesce((v_line->>'selected')::boolean,false);
    v_issues := coalesce(v_line->'issues','[]');
    if jsonb_typeof(v_issues)<>'array' then raise exception 'Issue details must be an array'; end if;
    if not v_selected and (jsonb_array_length(v_issues)>0 or v_received<v_ordered) then raise exception 'Every affected item must be selected'; end if;
    if v_selected and jsonb_array_length(v_issues)=0 then raise exception 'Choose an issue for each selected item'; end if;
    if not p_report and (v_selected or v_received<>v_ordered or jsonb_array_length(v_issues)>0) then raise exception 'Only full quantities without issues can be received directly'; end if;
    v_returns:=0; v_missing:=0; v_absent:=0; v_types:='{}';
    if v_selected then v_selected_count:=v_selected_count+1; end if;
    for v_issue in select * from jsonb_array_elements(v_issues) loop
      v_type:=v_issue->>'type'; v_quantity:=(v_issue->>'quantity')::numeric;
      if v_type is null or v_type not in ('wrong_item','damaged','expired','missing_quantity','not_received','return_all') then raise exception 'Choose a valid issue type'; end if;
      if v_type=any(v_types) then raise exception 'Combine duplicate issue types'; end if;
      v_types:=array_append(v_types,v_type); v_seen:=array_append(v_seen,v_type);
      if v_quantity is null or v_quantity::text in ('NaN','Infinity','-Infinity') or v_quantity<=0 then raise exception 'Issue quantities must be greater than zero'; end if;
      if v_type='return_all' and v_quantity<>v_received then raise exception 'Return all received must include every delivered unit'; end if;
      if v_type='missing_quantity' then
        if not (v_received>0 and v_received<v_ordered and v_quantity=v_ordered-v_received) then raise exception 'Missing quantity must equal ordered minus received for a partial delivery'; end if;
        v_missing:=v_quantity;
      elsif v_type='not_received' then
        if v_received<>0 or v_quantity<>v_ordered then raise exception 'Not received requires zero received quantity'; end if;
        v_absent:=v_quantity;
      else v_returns:=v_returns+v_quantity;
      end if;
      v_index:=case v_type when 'wrong_item' then 0 when 'missing_quantity' then 1 when 'not_received' then 1 when 'damaged' then 2 when 'expired' then 3 else null end;
      if v_index is not null and p_answers->>v_index::text<>'no' then raise exception 'Issue type must match a failed delivery check'; end if;
    end loop;
    if v_returns>v_received then raise exception 'Return quantities cannot exceed received quantities'; end if;
    if v_missing+v_absent<>v_ordered-v_received then raise exception 'Record all undelivered quantities'; end if;
    v_total:=v_total+v_ordered*v_item.estimated_unit_cost;
    v_return_value:=v_return_value+v_returns*v_item.estimated_unit_cost;
    v_missing_value:=v_missing_value+v_missing*v_item.estimated_unit_cost;
    v_absent_value:=v_absent_value+v_absent*v_item.estimated_unit_cost;
    v_lines:=v_lines||jsonb_build_array(jsonb_build_object('id',v_item.id,'item_name',v_item.item_name,'unit',v_item.unit,
      'quantityOrdered',v_ordered,'estimatedUnitCost',v_item.estimated_unit_cost,'receivedQuantity',v_received,
      'acceptedQuantity',v_received-v_returns,'returnQuantity',v_returns,'missingQuantity',v_missing,'notReceivedQuantity',v_absent,
      'selected',v_selected,'issues',v_issues));
  end loop;
  if p_report and v_selected_count=0 then raise exception 'Select at least one affected item'; end if;
  for v_index in 0..3 loop
    v_types:=case v_index when 0 then array['wrong_item','return_all'] when 1 then array['missing_quantity','not_received'] when 2 then array['damaged','return_all'] else array['expired','return_all'] end;
    if p_answers->>v_index::text='no' and not (v_types && v_seen) then raise exception 'Identify affected items for every failed delivery check'; end if;
  end loop;
  v_total:=round(v_total,2); v_return_value:=round(v_return_value,2); v_missing_value:=round(v_missing_value,2); v_absent_value:=round(v_absent_value,2);
  insert into public.purchase_order_receiving_reports(purchase_order_id,previous_status,is_issue,answers,lines,document_ids,notes,order_total,accepted_value,return_value,missing_value,not_received_value,submitted_by)
    values(p_id,v_order.status,p_report,p_answers,v_lines,p_document_ids,nullif(btrim(p_notes),''),v_total,v_total-v_return_value-v_missing_value-v_absent_value,v_return_value,v_missing_value,v_absent_value,auth.uid()) returning id into v_id;
  v_next:=case when p_report then 'pending_receiving_review' else 'approved_for_payment' end;
  if not p_report then
    perform public.post_purchase_order_delivery(v_id);
    update public.purchase_order_receiving_reports set status='approved',reviewed_at=now(),review_note='All delivery checks passed.' where id=v_id;
  end if;
  update public.purchase_orders set status=v_next,receiving_submitted_by=auth.uid(),receiving_submitted_at=now(),receiving_notes=nullif(btrim(p_notes),''),
    has_receiving_issues=has_receiving_issues or p_report,updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by)
    values(p_id,v_order.status,v_next,case when p_report then 'receiving_report_submitted' else 'delivery_received' end,nullif(btrim(p_notes),''),auth.uid());
  return v_id;
end; $$;

create function public.decide_purchase_order_receiving(p_id uuid,p_report_id uuid,p_decision text,p_note text default null,p_replacement boolean default false) returns void
language plpgsql security definer set search_path=public as $$
declare v_order record; v_report record; v_next text; v_report_status text;
begin
  perform public.assert_purchase_order_access(true);
  select * into v_order from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  select * into v_report from public.purchase_order_receiving_reports where id=p_report_id and purchase_order_id=p_id for update;
  if not found or v_report.status<>'pending' or v_order.status<>'pending_receiving_review' then raise exception 'This report is no longer awaiting review'; end if;
  if p_decision is null or p_decision not in ('approve','correct','reject','information') then raise exception 'Choose a valid review decision'; end if;
  if p_decision<>'approve' and nullif(btrim(p_note),'') is null then raise exception 'A reason or information request is required'; end if;
  if p_decision='approve' then
    if p_replacement is null then raise exception 'Specify whether a replacement is expected'; end if;
    perform public.post_purchase_order_delivery(v_report.id);
    v_next:=case when p_replacement then 'awaiting_replacement' else 'awaiting_adjustment' end;
    v_report_status:='approved';
  else
    v_next:=case p_decision when 'correct' then 'receiving_correction' when 'reject' then 'receiving_rejected' else 'receiving_information' end;
    v_report_status:=case p_decision when 'correct' then 'correction_requested' when 'reject' then 'rejected' else 'information_requested' end;
  end if;
  update public.purchase_order_receiving_reports set status=v_report_status,reviewed_by=auth.uid(),reviewed_at=now(),review_note=nullif(btrim(p_note),''),replacement_expected=case when p_decision='approve' then p_replacement end where id=v_report.id;
  update public.purchase_orders set status=v_next,receiving_reviewed_by=auth.uid(),receiving_reviewed_at=now(),receiving_review_note=nullif(btrim(p_note),''),updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by)
    values(p_id,v_order.status,v_next,'receiving_'||v_report_status,concat(nullif(btrim(p_note),''),case when p_decision='approve' then case when p_replacement then ' Replacement expected.' else ' Adjusted invoice or supplier credit required.' end else '' end),auth.uid());
end; $$;

-- Records an already-made payment; this RPC never initiates a transfer.
create function public.settle_purchase_order_delivery(p_id uuid,p_amount numeric,p_reference text,p_document_ids uuid[]) returns void
language plpgsql security definer set search_path=public as $$
declare v_order record; v_next text; v_reviewed timestamptz;
begin
  perform public.assert_purchase_order_access(true);
  select * into v_order from public.purchase_orders where id=p_id for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_order.status not in ('approved_for_payment','awaiting_adjustment') or v_order.payment_submitted_at is not null then raise exception 'This order is not ready for settlement'; end if;
  if p_amount is null or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount<>v_order.payable_amount then raise exception 'Payment must equal the accepted payable amount'; end if;
  if nullif(btrim(p_reference),'') is null then raise exception 'Payment or settlement reference is required'; end if;
  if coalesce(cardinality(p_document_ids),0)=0 or exists(select 1 from unnest(p_document_ids) d where not exists(select 1 from public.purchase_order_documents where id=d and purchase_order_id=p_id)) then raise exception 'Attach settlement evidence'; end if;
  if v_order.status='awaiting_adjustment' and not exists(select 1 from public.purchase_order_documents where id=any(p_document_ids) and purchase_order_id=p_id and document_type in ('adjusted_invoice','supplier_credit') and created_at>=v_order.receiving_reviewed_at) then raise exception 'An adjusted invoice or supplier credit is required after approval'; end if;
  if p_amount>0 and not exists(select 1 from public.purchase_order_documents where id=any(p_document_ids) and purchase_order_id=p_id and document_type='payment_receipt') then raise exception 'Attach proof of payment'; end if;
  v_next:=case when v_order.has_receiving_issues then 'completed_with_issues' else 'closed' end;
  update public.purchase_orders set status=v_next,payment_amount=p_amount,payment_reference=btrim(p_reference),payment_submitted_by=auth.uid(),payment_submitted_at=now(),closed_by=auth.uid(),closed_at=now(),updated_at=now() where id=p_id;
  insert into public.purchase_order_events(purchase_order_id,from_status,to_status,action,note,created_by) values(p_id,v_order.status,v_next,'payment_recorded',btrim(p_reference),auth.uid());
end; $$;

-- Retired entry points must not bypass the item-level validation/review gate.
create or replace function public.submit_purchase_order_receiving(p_id uuid,p_lines jsonb,p_receiving_notes text default null) returns void
language plpgsql security definer set search_path=public as $$ begin raise exception 'Use the item-level delivery receiving flow'; end; $$;
create or replace function public.report_purchase_order_issue(p_id uuid,p_reason text,p_resolution text,p_note text default null) returns void
language plpgsql security definer set search_path=public as $$ begin raise exception 'Use the item-level receiving issue report'; end; $$;

revoke all on function public.submit_purchase_order_delivery(uuid,jsonb,jsonb,uuid[],text,boolean) from public,anon;
revoke all on function public.decide_purchase_order_receiving(uuid,uuid,text,text,boolean) from public,anon;
revoke all on function public.settle_purchase_order_delivery(uuid,numeric,text,uuid[]) from public,anon;
grant execute on function public.submit_purchase_order_delivery(uuid,jsonb,jsonb,uuid[],text,boolean) to authenticated;
grant execute on function public.decide_purchase_order_receiving(uuid,uuid,text,text,boolean) to authenticated;
grant execute on function public.settle_purchase_order_delivery(uuid,numeric,text,uuid[]) to authenticated;
commit;
notify pgrst,'reload schema';
