begin;

alter table public.orders
  drop constraint if exists delivery_requires_address_text;

alter table public.orders
  add constraint delivery_requires_address_text check (
    order_type <> 'delivery'
    or coalesce(rider_booking, 'staff') = 'customer'
    or delivery_address is not null
  );

-- The internal order creator runs before the wrapper records rider_booking.
-- Give that insert a temporary non-null value for customer-arranged riders;
-- the wrapper then records rider_booking='customer' and clears the address.
do $migration$
declare
  definition text;
  needle text := 'result:=public.create_customer_order_internal(payload);';
  patch text := 'if coalesce(payload->>''fulfillment_method'',''delivery'')=''delivery'' and booking=''customer'' then payload:=jsonb_set(payload,''{customer,address}'',to_jsonb(''Customer-arranged rider''::text),true); end if;';
begin
  definition := pg_get_functiondef('public.create_customer_order(jsonb)'::regprocedure);
  if position('Customer-arranged rider' in definition) = 0 then
    if position(needle in definition) = 0 then
      raise exception 'Could not locate customer order creation call';
    end if;
    execute replace(definition, needle, patch || chr(10) || needle);
  end if;
end;
$migration$;

notify pgrst, 'reload schema';
commit;
