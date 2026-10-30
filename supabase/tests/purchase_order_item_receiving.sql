-- Rollback-only integration checks. Requires an admin, a staff profile, and
-- four ingredients. Run after 20261101090000_purchase_order_item_receiving_review.
begin;

create function pg_temp.receiving_test_order(p_staff uuid) returns uuid language plpgsql as $$
declare po uuid; ing record; n integer:=0; quantities numeric[]:=array[10,24,6,3]; prices numeric[]:=array[850,95,620,280];
begin
  insert into public.purchase_orders(po_number,supplier_name,status,created_by) values('TEST-'||gen_random_uuid(),'Receiving regression','sent',p_staff) returning id into po;
  for ing in select id,name,unit from public.ingredients where not is_archived order by id limit 4 loop
    n:=n+1;
    insert into public.purchase_order_items(purchase_order_id,item_type,ingredient_id,item_name,unit,quantity_ordered,estimated_unit_cost)
      values(po,'ingredient',ing.id,ing.name,ing.unit,quantities[n],prices[n]);
  end loop;
  assert n=4,'Seed four ingredients first';
  insert into public.purchase_order_documents(purchase_order_id,document_type,storage_path,file_name,uploaded_by)
    select po,type,po||'/test/'||type,'test.png',p_staff from unnest(array['receiving_proof','supplier_invoice','supplier_receipt']) type;
  return po;
end; $$;

do $$
declare
  staff_id uuid; admin_id uuid; po uuid; report_id uuid; next_report uuid; docs uuid[]; lines jsonb; bad jsonb;
  answers jsonb:='{"0":"no","1":"no","2":"no","3":"yes"}'; yes_answers jsonb:='{"0":"yes","1":"yes","2":"yes","3":"yes"}';
  rejected boolean; decision text; baseline numeric; stocked numeric; payload jsonb;
begin
  select id into staff_id from public.profiles where public.normalize_role(role) in ('staff','operational_staff') limit 1;
  select id into admin_id from public.profiles where public.normalize_role(role)='admin' limit 1;
  assert staff_id is not null and admin_id is not null,'Seed a staff and admin profile first';
  perform set_config('request.jwt.claim.sub',staff_id::text,true);
  select coalesce(sum(quantity),0) into baseline from public.inventory_stock;
  po:=pg_temp.receiving_test_order(staff_id);
  select array_agg(id) into docs from public.purchase_order_documents where purchase_order_id=po;
  select jsonb_agg(jsonb_build_object('id',id,'receivedQuantity',case quantity_ordered when 24 then 20 when 3 then 0 else quantity_ordered end,'selected',true,
    'issues',jsonb_build_array(jsonb_build_object('type',case quantity_ordered when 10 then 'damaged' when 24 then 'missing_quantity' when 6 then 'wrong_item' else 'not_received' end,
      'quantity',case quantity_ordered when 10 then 2 when 24 then 4 when 6 then 1 else 3 end))) order by quantity_ordered desc) into lines from public.purchase_order_items where purchase_order_id=po;

  -- Reject malformed input without changing stock or leaving a report behind.
  for bad in select value from jsonb_array_elements(jsonb_build_array(
    jsonb_set(lines,'{0,receivedQuantity}','25'),
    jsonb_set(lines,'{0,issues,0,quantity}','3'),
    jsonb_set(lines,'{0,issues,0,type}','"not_received"'),
    jsonb_set(lines,'{1,issues,0,quantity}','11'),
    jsonb_set(lines,'{1,issues,0,quantity}','0'),
    jsonb_set(lines,'{1,issues,0,type}','"expired"'),
    jsonb_set(lines,'{0,selected}','false'),
    jsonb_set(lines,'{1,id}',lines->0->'id')
  )) loop
    rejected:=false;
    begin perform public.submit_purchase_order_delivery(po,bad,answers,docs,null,true); exception when raise_exception then rejected:=true; end;
    assert rejected,'Invalid delivery must be rejected';
  end loop;
  rejected:=false;
  begin perform public.submit_purchase_order_delivery(po,lines,'{"0":"no"}',docs,null,true); exception when raise_exception then rejected:=true; end;
  assert rejected,'Unanswered delivery checks must be rejected';
  rejected:=false;
  begin perform public.submit_purchase_order_delivery(po,lines,answers,'{}',null,true); exception when raise_exception then rejected:=true; end;
  assert rejected,'Evidence is required';

  report_id:=public.submit_purchase_order_delivery(po,lines,answers,docs,'Reference example',true);
  assert (select status='pending_receiving_review' and payable_amount=0 from public.purchase_orders where id=po),'Report must hold payment';
  assert (select sum(quantity)=baseline from public.inventory_stock),'Reporting must not post inventory';
  assert (select order_total=15340 and accepted_value=11800 and return_value=2320 and missing_value=380 and not_received_value=840 from public.purchase_order_receiving_reports where id=report_id),'Financial breakdown must match reference';
  rejected:=false;
  begin perform public.decide_purchase_order_receiving(po,report_id,'approve',null,false); exception when raise_exception then rejected:=true; end;
  assert rejected,'Staff cannot approve their own report';
  rejected:=false;
  begin perform public.submit_purchase_order_delivery(po,lines,answers,docs,null,true); exception when raise_exception then rejected:=true; end;
  assert rejected,'Duplicate submission must be rejected';

  foreach decision in array array['correct','information','reject'] loop
    perform set_config('request.jwt.claim.sub',admin_id::text,true);
    rejected:=false;
    begin perform public.decide_purchase_order_receiving(po,report_id,decision,null,false); exception when raise_exception then rejected:=true; end;
    assert rejected,'Non-approval decisions require a reason';
    perform public.decide_purchase_order_receiving(po,report_id,decision,'Please verify the delivery.',false);
    assert (select sum(quantity)=baseline from public.inventory_stock),'Review feedback must not post stock';
    perform set_config('request.jwt.claim.sub',staff_id::text,true);
    report_id:=public.submit_purchase_order_delivery(po,lines,answers,docs,'Corrected report',true);
  end loop;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  perform public.decide_purchase_order_receiving(po,report_id,'approve','Accept good items.',false);
  assert (select sum(quantity)=baseline+33 from public.inventory_stock),'Only 8 beans + 20 milk + 5 matcha should be stocked';
  assert (select status='awaiting_adjustment' and payable_amount=11800 from public.purchase_orders where id=po),'Only accepted value is payable';
  rejected:=false;
  begin perform public.decide_purchase_order_receiving(po,report_id,'approve',null,false); exception when raise_exception then rejected:=true; end;
  assert rejected,'Approval cannot post stock twice';
  rejected:=false;
  begin perform public.settle_purchase_order_delivery(po,11800,'Payment test',docs); exception when raise_exception then rejected:=true; end;
  assert rejected,'Settlement requires adjustment and proof of payment';
  insert into public.purchase_order_documents(purchase_order_id,document_type,storage_path,file_name,uploaded_by)
    select po,type,po||'/test/'||type,'test.pdf',admin_id from unnest(array['adjusted_invoice','payment_receipt']) type;
  select array_agg(id) into docs from public.purchase_order_documents where purchase_order_id=po;
  rejected:=false;
  begin perform public.settle_purchase_order_delivery(po,15340,'Wrong amount',docs); exception when raise_exception then rejected:=true; end;
  assert rejected,'Payment cannot include rejected or undelivered units';
  perform public.settle_purchase_order_delivery(po,11800,'Accepted items paid',docs);
  assert (select status='completed_with_issues' from public.purchase_orders where id=po),'Issue order completes after settlement';
  assert (select count(*)=4 from public.purchase_order_receiving_reports where purchase_order_id=po),'All report versions are preserved';

  -- Replacement cycle receives only outstanding units, without reposting accepted stock.
  perform set_config('request.jwt.claim.sub',staff_id::text,true);
  po:=pg_temp.receiving_test_order(staff_id);
  select array_agg(id) into docs from public.purchase_order_documents where purchase_order_id=po;
  select jsonb_agg(jsonb_build_object('id',id,'receivedQuantity',case quantity_ordered when 24 then 20 else quantity_ordered end,'selected',quantity_ordered=24,
    'issues',case quantity_ordered when 24 then '[{"type":"missing_quantity","quantity":4}]'::jsonb else '[]'::jsonb end)) into lines from public.purchase_order_items where purchase_order_id=po;
  report_id:=public.submit_purchase_order_delivery(po,lines,'{"0":"yes","1":"no","2":"yes","3":"yes"}',docs,null,true);
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  perform public.decide_purchase_order_receiving(po,report_id,'approve',null,true);
  assert (select status='awaiting_replacement' and payable_amount=14960 from public.purchase_orders where id=po),'Replacement order remains open';
  select sum(quantity) into stocked from public.inventory_stock;
  select jsonb_agg(jsonb_build_object('id',id,'receivedQuantity',quantity_ordered-accepted_quantity,'selected',false,'issues','[]'::jsonb)) into lines from public.purchase_order_items where purchase_order_id=po and accepted_quantity<quantity_ordered;
  perform set_config('request.jwt.claim.sub',staff_id::text,true);
  next_report:=public.submit_purchase_order_delivery(po,lines,yes_answers,docs,'Replacement received',false);
  assert (select sum(quantity)=stocked+4 from public.inventory_stock),'Only four replacement cartons are stocked';
  assert (select status='approved_for_payment' and payable_amount=15340 from public.purchase_orders where id=po),'Replacement completes the accepted payable amount';

  -- All-Yes flow posts full stock and stops at Ready for Payment.
  po:=pg_temp.receiving_test_order(staff_id);
  select array_agg(id) into docs from public.purchase_order_documents where purchase_order_id=po;
  select sum(quantity) into stocked from public.inventory_stock;
  select jsonb_agg(jsonb_build_object('id',id,'receivedQuantity',quantity_ordered,'selected',false,'issues','[]'::jsonb)) into lines from public.purchase_order_items where purchase_order_id=po;
  report_id:=public.submit_purchase_order_delivery(po,lines,yes_answers,docs,null,false);
  assert (select status='approved_for_payment' and payable_amount=15340 from public.purchase_orders where id=po),'All-Yes delivery uses full order value';
  assert (select sum(quantity)=stocked+43 from public.inventory_stock),'All-Yes delivery posts all quantities';

  -- No accepted units: physical returns exclude missing/absent quantities and
  -- a supplier credit can settle the zero balance without a fictitious payment.
  po:=pg_temp.receiving_test_order(staff_id);
  select array_agg(id) into docs from public.purchase_order_documents where purchase_order_id=po;
  select sum(quantity) into stocked from public.inventory_stock;
  select jsonb_agg(jsonb_build_object('id',id,'receivedQuantity',case quantity_ordered when 24 then 20 when 3 then 0 else quantity_ordered end,'selected',true,
    'issues',case quantity_ordered
      when 24 then '[{"type":"missing_quantity","quantity":4},{"type":"return_all","quantity":20}]'::jsonb
      when 3 then '[{"type":"not_received","quantity":3}]'::jsonb
      else jsonb_build_array(jsonb_build_object('type','return_all','quantity',quantity_ordered)) end)) into lines from public.purchase_order_items where purchase_order_id=po;
  report_id:=public.submit_purchase_order_delivery(po,lines,answers,docs,'Return all delivered goods',true);
  assert (select accepted_value=0 and return_value=14120 and missing_value=380 and not_received_value=840 from public.purchase_order_receiving_reports where id=report_id),'Physical returns exclude all undelivered quantities';
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  perform public.decide_purchase_order_receiving(po,report_id,'approve',null,false);
  assert (select sum(quantity)=stocked from public.inventory_stock),'Returning all delivered goods adds no stock';
  insert into public.purchase_order_documents(purchase_order_id,document_type,storage_path,file_name,uploaded_by) values(po,'supplier_credit',po||'/test/credit','credit.pdf',admin_id);
  select array_agg(id) into docs from public.purchase_order_documents where purchase_order_id=po;
  perform public.settle_purchase_order_delivery(po,0,'Supplier credit received',docs);
  assert (select status='completed_with_issues' and payment_amount=0 from public.purchase_orders where id=po),'Zero accepted value closes on supplier credit';
  assert not has_function_privilege('authenticated','public.post_purchase_order_delivery(uuid)','execute'),'Posting helper must not be callable by clients';
  raise notice 'Receiving integration checks passed: validation, role gates, review decisions, values, stock idempotency, settlement, replacement, full receipt.';
end; $$;
rollback;
