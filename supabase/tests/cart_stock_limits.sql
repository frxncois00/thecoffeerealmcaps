-- Run against a seeded test database after all three 20261021 stock migrations
-- (120000, 130000, 140000). All fixture changes roll back.
begin;
do $$
declare cake uuid; product uuid; ingredient uuid; whole jsonb; slice jsonb;
  online_order uuid; cancelled_order uuid; stock numeric;
begin
  select id into cake from public.menu_items where not is_archived limit 1;
  select id into product from public.finished_products where not is_archived limit 1;
  select ingredient_id into ingredient from public.inventory_stock limit 1;
  if cake is null or product is null or ingredient is null then
    raise exception 'Seed a menu item, finished product and ingredient stock first';
  end if;
  update public.menu_items set manual_available=true, available_from=null, available_until=null,
    variant_options='{"enabled":true,"options":[{"key":"slice","quantity":1,"unit":"slice"},{"key":"whole","quantity":8,"unit":"slice"}]}'
    where id=cake;
  delete from public.finished_product_sale_mappings where menu_item_id=cake;
  delete from public.menu_item_ingredients where menu_item_id=cake;
  insert into public.finished_product_sale_mappings(menu_item_id,finished_product_id,variant_key,units_per_sale)
    values(cake,product,'slice',1),(cake,product,'whole',8);
  update public.menu_items set inventory_source='products' where id=cake;
  whole := jsonb_build_object('menu_item_id',cake,'quantity',1,'variant_key','whole');
  slice := jsonb_build_object('menu_item_id',cake,'quantity',1,'variant_key','slice');
  update public.finished_products set quantity=7 where id=product;
  assert not public.cart_stock_available(jsonb_build_array(whole)), 'Seven slices cannot supply a whole cake';
  assert public.cart_stock_available(jsonb_build_array(slice)), 'Slice remains orderable';
  update public.finished_products set quantity=8 where id=product;
  assert public.cart_stock_available(jsonb_build_array(whole)), 'Exactly eight supplies one whole cake without double multiplication';
  assert not public.cart_stock_available(jsonb_build_array(whole,slice)), 'Shared stock must include mixed portions';
  assert not public.cart_stock_available(jsonb_build_array(whole,whole)), 'Duplicate cart lines share stock';
  insert into public.menu_item_ingredients(menu_item_id,ingredient_id,quantity_per_serving) values(cake,ingredient,1);
  update public.menu_items set inventory_source='ingredients' where id=cake;
  update public.ingredients set is_archived=false where id=ingredient;
  update public.inventory_stock set quantity=7 where ingredient_id=ingredient;
  assert not public.cart_stock_available(jsonb_build_array(whole)), 'Ingredient portions also require eight';
  update public.inventory_stock set quantity=8 where ingredient_id=ingredient;
  assert public.cart_stock_available(jsonb_build_array(whole)), 'Exact ingredient boundary';
  assert not public.cart_stock_available(jsonb_build_array(whole,slice)), 'Shared ingredient demand';
  -- Coffee recipes are per cup, even when a size is expressed in ounces.
  update public.menu_items set variant_options='{"enabled":true,"options":[{"key":"cup","quantity":16,"unit":"oz"}]}' where id=cake;
  update public.inventory_stock set quantity=10 where ingredient_id=ingredient;
  assert public.menu_serving_multiplier(cake,'cup') = 1,
    'Coffee recipe is per cup: a 16-ounce size must have multiplier 1. Apply 20261021140000_repair_stock_serving_calculation.sql';
  if not public.cart_stock_available(jsonb_build_array(jsonb_build_object('menu_item_id',cake,'quantity',10,'variant_key','cup'))) then
    raise exception 'Ten cups rejected. multiplier=%, stock=%, recipe=%, inventory_source=%, options=%',
      public.menu_serving_multiplier(cake,'cup'),
      (select quantity from public.inventory_stock where ingredient_id=ingredient),
      (select quantity_per_serving from public.menu_item_ingredients where menu_item_id=cake and ingredient_id=ingredient),
      (select inventory_source from public.menu_items where id=cake),
      (select variant_options from public.menu_items where id=cake);
  end if;
  assert not public.cart_stock_available(jsonb_build_array(jsonb_build_object('menu_item_id',cake,'quantity',11,'variant_key','cup'))), 'Eleventh cup must be rejected';
  insert into public.orders(order_source,order_type,status,payment_confirmed,customer_name,customer_email,customer_phone,schedule_date,schedule_time)
    values('customer_pos','pickup','Awaiting Payment Verification',false,
      'Stock Test Customer','stock-test@example.com','09123456789',(clock_timestamp() at time zone 'Asia/Manila')::date+2,'12:00') returning id into online_order;
  insert into public.order_items(order_id,menu_item_id,item_name,display_name,unit_price,line_total,quantity,customizations)
    values(online_order,cake,'Stock test','Stock test',100,600,6,'{"variation_id":"cup"}');
  set constraints commit_placed_order_stock_trigger immediate;
  select quantity into stock from public.inventory_stock where ingredient_id=ingredient;
  assert stock = 4, 'Pending online order must immediately leave only four cups';
  assert not public.cart_stock_available(jsonb_build_array(jsonb_build_object('menu_item_id',cake,'quantity',5,'variant_key','cup'))), 'Other carts cannot spend committed stock';
  update public.orders set status='Preparing' where id=online_order;
  select quantity into stock from public.inventory_stock where ingredient_id=ingredient;
  assert stock = 4, 'Preparation must not deduct again';
  set constraints commit_placed_order_stock_trigger deferred;
  insert into public.orders(order_source,order_type,status,payment_confirmed,customer_name,customer_email,customer_phone,schedule_date,schedule_time)
    values('customer_pos','pickup','Awaiting Payment Verification',false,
      'Stock Test Customer','stock-test@example.com','09123456789',(clock_timestamp() at time zone 'Asia/Manila')::date+2,'12:00') returning id into cancelled_order;
  insert into public.order_items(order_id,menu_item_id,item_name,display_name,unit_price,line_total,quantity,customizations)
    values(cancelled_order,cake,'Stock test','Stock test',100,400,4,'{"variation_id":"cup"}');
  set constraints commit_placed_order_stock_trigger immediate;
  select quantity into stock from public.inventory_stock where ingredient_id=ingredient;
  assert stock = 0, 'Second pending order consumes the remaining capacity';
  update public.orders set status='Cancelled' where id=cancelled_order;
  perform public.restore_order_inventory(cancelled_order);
  select quantity into stock from public.inventory_stock where ingredient_id=ingredient;
  assert stock = 4, 'Cancellation releases its stock exactly once';
end;
$$;
rollback;
