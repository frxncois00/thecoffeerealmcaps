-- Rollback-only integration checks; no test orders or catalog edits persist.
begin;
do $$
declare item uuid; product uuid; order_id uuid; target timestamp; rejected boolean := false;
begin
  select id into item from public.menu_items where not is_archived limit 1;
  if item is null then raise exception 'Seed a menu item first'; end if;
  select id into product from public.finished_products where not is_archived limit 1;
  if product is null then raise exception 'Seed a finished product first'; end if;
  update public.finished_products set quantity=1000 where id=product;
  delete from public.finished_product_sale_mappings where menu_item_id=item;
  insert into public.finished_product_sale_mappings(menu_item_id,finished_product_id,units_per_sale,variant_key)
  values(item,product,1,null);
  update public.menu_items set prep_time_minutes=10,inventory_source='products',
    manual_available=true,available_from=null,available_until=null,variant_options='{}' where id=item;
  target := (clock_timestamp() at time zone 'Asia/Manila') + interval '90 minutes';
  insert into public.orders(order_source,order_type,status,payment_confirmed,customer_name,customer_email,customer_phone,schedule_date,schedule_time,delivery_address)
  values('customer_pos','pickup','Awaiting Payment Verification',false,'Preparation Test','prep-test@example.com','09123456789',target::date,target::time,'Test address, Quezon City')
  returning id into order_id;
  -- Ten units need 105 minutes, so 90 minutes must fail.
  begin
    insert into public.order_items(order_id,menu_item_id,item_name,unit_price,line_total,quantity)
    values(order_id,item,'Preparation test',100,1000,10);
    set constraints validate_order_preparation_schedule_trigger immediate;
  exception when raise_exception then
    if sqlerrm not like '%enough preparation time%' then raise; end if;
    rejected := true;
  end;
  assert rejected, 'Large order must reject insufficient preparation time';
  -- One unit at the same time is valid.
  insert into public.order_items(order_id,menu_item_id,item_name,unit_price,line_total,quantity)
  values(order_id,item,'Preparation test',100,100,1);
  set constraints validate_order_preparation_schedule_trigger immediate;
  set constraints validate_order_preparation_schedule_trigger deferred;
  -- Delivery retains its own 60-minute minimum even for a small order.
  target := (clock_timestamp() at time zone 'Asia/Manila') + interval '45 minutes';
  insert into public.orders(order_source,order_type,status,payment_confirmed,customer_name,customer_email,customer_phone,schedule_date,schedule_time,delivery_address)
  values('customer_pos','delivery','Awaiting Payment Verification',false,'Preparation Test','prep-test@example.com','09123456789',target::date,target::time,'Test address, Quezon City')
  returning id into order_id;
  rejected := false;
  begin
    insert into public.order_items(order_id,menu_item_id,item_name,unit_price,line_total,quantity)
    values(order_id,item,'Preparation test',100,100,1);
    set constraints validate_order_preparation_schedule_trigger immediate;
  exception when raise_exception then
    if sqlerrm not like '%enough preparation time%' then raise; end if;
    rejected := true;
  end;
  assert rejected, 'Delivery minimum lead time must still apply';
end;
$$;
rollback;
