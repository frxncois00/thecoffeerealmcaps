-- Keep menu prices VAT-inclusive while storing a complete tax snapshot for
-- every new order. Qualified SC/PWD lines remove VAT before the 20% discount.

alter table public.orders
  add column if not exists vatable_sales numeric(12,2) not null default 0,
  add column if not exists vat_exempt_sales numeric(12,2) not null default 0,
  add column if not exists zero_rated_sales numeric(12,2) not null default 0,
  add column if not exists vat_amount numeric(12,2) not null default 0,
  add column if not exists vat_exempt_amount numeric(12,2) not null default 0;

alter table public.order_items
  add column if not exists is_discounted boolean not null default false,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists vat_exempt_amount numeric(12,2) not null default 0;

create or replace function public.apply_order_vat_breakdown()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  gross_subtotal numeric(12,2) := round(coalesce(new.subtotal, 0), 2);
  eligible_gross numeric(12,2) := 0;
  eligible_base numeric(12,2) := 0;
  regular_gross numeric(12,2) := gross_subtotal;
  rate numeric := coalesce(new.vat_rate, 0.12);
begin
  if new.prices_include_vat is not true then
    raise exception 'The active pricing policy must keep menu prices VAT-inclusive';
  end if;

  if lower(coalesce(new.discount_type, '')) in ('pwd', 'senior') then
    eligible_gross := round(least(greatest(coalesce(new.discount_subtotal, 0), 0), gross_subtotal), 2);
  end if;

  regular_gross := round(gross_subtotal - eligible_gross, 2);
  new.vatable_sales := case when rate = 0 then regular_gross else round(regular_gross / (1 + rate), 2) end;
  new.vat_amount := round(regular_gross - new.vatable_sales, 2);
  new.zero_rated_sales := 0;

  if eligible_gross > 0 then
    eligible_base := case when rate = 0 then eligible_gross else round(eligible_gross / (1 + rate), 2) end;
    new.vat_exempt_sales := eligible_base;
    new.vat_exempt_amount := round(eligible_gross - eligible_base, 2);
    new.discount_amount := round(eligible_base * 0.20, 2);
    new.final_total := round(regular_gross + eligible_base - new.discount_amount + coalesce(new.delivery_fee, 0), 2);
  else
    new.vat_exempt_sales := 0;
    new.vat_exempt_amount := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists order_vat_breakdown_snapshot on public.orders;
create trigger order_vat_breakdown_snapshot
before insert or update of subtotal, discount_type, discount_subtotal, delivery_fee, vat_rate, prices_include_vat
on public.orders
for each row
execute function public.apply_order_vat_breakdown();

create or replace function public.create_cashier_order_internal(request_payload jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
 o jsonb:=coalesce(request_payload->'order','{}'); p jsonb:=coalesce(request_payload->'payment','{}'); i jsonb; m public.menu_items%rowtype;
 oid uuid:=gen_random_uuid(); ono text:='WI-'||to_char(clock_timestamp(),'YYYYMMDD-HH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
 q integer; total_q integer:=0; base numeric(12,2); adds numeric(12,2); unit numeric(12,2); line numeric(12,2); sub numeric(12,2):=0; discounted_sub numeric(12,2):=0;
 dtype text:=nullif(btrim(o->>'discount_type'),''); discount numeric(12,2):=0; vat_removed numeric(12,2):=0; eligible_base numeric(12,2):=0; grand numeric(12,2);
 method text:=lower(btrim(coalesce(p->>'method',''))); received numeric(12,2); change_due numeric(12,2);
 requested_addons integer; valid_addons integer; temperature text; variant text; is_discounted boolean;
 vat_rate numeric:=0.12; prices_include_vat boolean:=true; item_gross numeric(12,2); item_base numeric(12,2);
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','cashier')) then raise exception 'Cashier access required'; end if;
 if jsonb_array_length(coalesce(request_payload->'items','[]'))=0 then raise exception 'The cashier order has no items'; end if;

 select coalesce((value->>'vatRate')::numeric,0.12),coalesce((value->>'pricesIncludeVat')::boolean,true)
 into vat_rate,prices_include_vat from public.portal_configuration where scope='system' and key='pricing';
 if prices_include_vat is not true then raise exception 'The active pricing policy must keep menu prices VAT-inclusive'; end if;

 for i in select * from jsonb_array_elements(request_payload->'items') loop
  begin q:=(i->>'quantity')::integer; exception when others then raise exception 'Every item must have a valid quantity'; end;
  if q<1 or q>99 then raise exception 'Item quantity must be between 1 and 99'; end if;
  total_q:=total_q+q; if total_q>200 then raise exception 'An order cannot contain more than 200 items'; end if;
  select * into m from public.menu_items where id=(i->>'menu_item_id')::uuid and is_available=true and is_archived=false;
  if not found then raise exception 'A selected menu item is unavailable'; end if;
  base:=m.price; variant:=nullif(btrim(i->'customizations'->>'variantKey'),'');
  if variant is not null then
   if not (m.variant_options?'prices' and (m.variant_options->'prices')?variant) then raise exception 'A selected item variant is unavailable'; end if;
   base:=(m.variant_options->'prices'->>variant)::numeric;
  end if;
  temperature:=lower(btrim(coalesce(i->'customizations'->>'temperature','')));
  if m.temperature_type='iced_only' and temperature not in ('cold','iced') then raise exception 'This item requires a cold temperature'; end if;
  if m.temperature_type='hot_only' and temperature<>'hot' then raise exception 'This item requires a hot temperature'; end if;
  if m.temperature_type='flexible' and temperature not in ('hot','cold','iced') then raise exception 'Select a valid item temperature'; end if;
  select count(distinct lower(btrim(x->>'name'))) into requested_addons from jsonb_array_elements(coalesce(i->'addons','[]')) x;
  if requested_addons>0 and not coalesce(m.allow_addons,false) then raise exception 'Add-ons are not allowed for this item'; end if;
  select count(*),coalesce(sum(a.price),0) into valid_addons,adds from public.addons a
   where lower(a.name) in(select lower(btrim(x->>'name')) from jsonb_array_elements(coalesce(i->'addons','[]')) x)
   and a.is_available=true and a.applies_to in ('both',m.item_type)
   and (a.target_temperature='both' or (a.target_temperature in ('iced','cold') and temperature in ('iced','cold')) or (a.target_temperature='hot' and temperature='hot'));
  if valid_addons<>requested_addons then raise exception 'One or more selected add-ons are unavailable for this item'; end if;
  sub:=sub+((base+adds)*q);
  if dtype is not null and coalesce((i->>'is_discounted')::boolean,false) then discounted_sub:=discounted_sub+(base*q); end if;
 end loop;

 if dtype is not null then
  if dtype not in ('PWD','Senior') then raise exception 'Unsupported discount type'; end if;
  if nullif(btrim(o->>'discount_customer_name'),'') is null or nullif(btrim(o->>'discount_id_number'),'') is null then raise exception 'Discount customer name and ID number are required'; end if;
  if discounted_sub<=0 then raise exception 'At least one item must be selected for the discount'; end if;
  eligible_base:=case when vat_rate=0 then discounted_sub else round(discounted_sub/(1+vat_rate),2) end;
  vat_removed:=round(discounted_sub-eligible_base,2);
  discount:=round(eligible_base*0.20,2);
 end if;
 grand:=round(sub-vat_removed-discount,2);
 if method not in ('cash','gcash','bank_transfer') then raise exception 'Unsupported payment method'; end if;
 if method='cash' then
  received:=coalesce((p->>'amount_received')::numeric,0); if received<grand then raise exception 'Cash received is less than the total'; end if; change_due:=received-grand;
 elsif method='gcash' then
  if coalesce(p->>'reference_number','') !~ '^[0-9]{13}$' then raise exception 'GCash reference number must be exactly 13 digits'; end if; received:=grand; change_due:=0;
 else
  if nullif(btrim(p->>'bank_name'),'') is null then raise exception 'Bank name is required'; end if;
  if coalesce(p->>'reference_number','') !~ '^[A-Za-z0-9-]{6,30}$' then raise exception 'Bank reference must be 6 to 30 letters, numbers, or hyphens'; end if; received:=grand; change_due:=0;
 end if;

 insert into public.orders(id,order_number,order_sequence,order_source,cashier_id,order_type,status,customer_name,subtotal,discount_type,discount_customer_name,discount_id_number,discount_subtotal,discount_amount,vat_exempt_amount,final_total,payment_status,payment_confirmed)
 values(oid,ono,floor(extract(epoch from clock_timestamp()))::bigint,'cashier_pos',auth.uid(),'walk-in','Preparing',coalesce(nullif(btrim(o->>'customer_name'),''),'Walk-in Customer'),sub,dtype,nullif(btrim(o->>'discount_customer_name'),''),nullif(btrim(o->>'discount_id_number'),''),case when dtype is null then 0 else discounted_sub end,discount,vat_removed,grand,'paid',true);

 for i in select * from jsonb_array_elements(request_payload->'items') loop
  select * into m from public.menu_items where id=(i->>'menu_item_id')::uuid; q:=(i->>'quantity')::integer; base:=m.price; variant:=nullif(btrim(i->'customizations'->>'variantKey'),'');
  if variant is not null then base:=(m.variant_options->'prices'->>variant)::numeric; end if;
  select coalesce(sum(a.price),0) into adds from public.addons a where lower(a.name) in(select lower(btrim(x->>'name')) from jsonb_array_elements(coalesce(i->'addons','[]')) x) and a.is_available=true;
  unit:=base+adds; line:=unit*q; is_discounted:=dtype is not null and coalesce((i->>'is_discounted')::boolean,false);
  item_gross:=case when is_discounted then round(base*q,2) else 0 end;
  item_base:=case when item_gross=0 or vat_rate=0 then item_gross else round(item_gross/(1+vat_rate),2) end;
  insert into public.order_items(order_id,menu_item_id,item_name,unit_price,quantity,line_total,is_discounted,discount_amount,vat_exempt_amount,customizations,addons)
  values(oid,m.id,m.name,unit,q,line,is_discounted,case when is_discounted then round(item_base*0.20,2) else 0 end,case when is_discounted then round(item_gross-item_base,2) else 0 end,coalesce(i->'customizations','{}'),coalesce(i->'addons','[]'));
 end loop;

 insert into public.payments(order_id,method,amount_due,amount_received,change_amount,reference_number,account_number,bank_name,status,paid_at)
 values(oid,method,grand,received,change_due,nullif(p->>'reference_number',''),nullif(p->>'account_number',''),nullif(p->>'bank_name',''),'paid',now());
 return jsonb_build_object('id',oid,'order_number',ono,'subtotal',sub,'discount_amount',discount,'vat_exempt_amount',vat_removed,'total',grand,'change_amount',change_due);
end; $$;

revoke all on function public.create_cashier_order_internal(jsonb) from public, anon, authenticated;

create or replace function public.create_customer_order_with_benefit_discount(request_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  result jsonb; order_id uuid; benefit_kind text; target_item uuid; target_unit numeric(12,2); eligible_base numeric(12,2); discount numeric(12,2); vat_removed numeric(12,2); savings numeric(12,2); order_row public.orders%rowtype; vat_rate numeric:=0.12;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if coalesce((request_payload->>'apply_benefit_discount')::boolean,false) then
    select kind into benefit_kind from public.benefit_applications where customer_id=auth.uid() and status='approved' limit 1;
    if not found then raise exception 'Senior Citizen/PWD verification is not approved'; end if;
  end if;
  result:=public.create_customer_order(request_payload-'apply_benefit_discount');
  if not coalesce((request_payload->>'apply_benefit_discount')::boolean,false) then return result; end if;
  order_id:=(result->>'id')::uuid;
  select * into order_row from public.orders where id=order_id for update;
  if coalesce(order_row.discount_amount,0)>0 then return result; end if;
  vat_rate:=coalesce(order_row.vat_rate,0.12);
  select oi.id,round(oi.line_total/greatest(oi.quantity,1),2) into target_item,target_unit
  from public.order_items oi join public.menu_items mi on mi.id=oi.menu_item_id
  where oi.order_id=order_id and mi.online_benefit_eligible
  order by (oi.line_total/greatest(oi.quantity,1)) desc,oi.id limit 1;
  if target_item is null then raise exception 'No eligible item in this order'; end if;
  eligible_base:=case when vat_rate=0 then target_unit else round(target_unit/(1+vat_rate),2) end;
  vat_removed:=round(target_unit-eligible_base,2);
  discount:=round(eligible_base*0.20,2);
  savings:=round(vat_removed+discount,2);
  update public.order_items set is_discounted=true,discount_amount=discount,vat_exempt_amount=vat_removed where id=target_item;
  update public.orders set discount_type=case when benefit_kind='pwd' then 'PWD' else 'Senior' end,discount_customer_name=order_row.customer_name,discount_subtotal=target_unit,discount_amount=discount,vat_exempt_amount=vat_removed,final_total=order_row.final_total-savings,updated_at=now() where id=order_id;
  update public.payments p set amount_due=round(p.amount_due-savings,2) where p.order_id=order_id;
  return result||jsonb_build_object('discount_amount',discount,'vat_exempt_amount',vat_removed,'total',round(order_row.final_total-savings,2));
end; $$;

revoke all on function public.create_customer_order_with_benefit_discount(jsonb) from public;
grant execute on function public.create_customer_order_with_benefit_discount(jsonb) to authenticated;

notify pgrst, 'reload schema';
