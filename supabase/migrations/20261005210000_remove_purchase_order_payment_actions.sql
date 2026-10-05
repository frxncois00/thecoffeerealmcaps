-- Payment is not part of the purchase order workflow. Keep existing payment
-- records for history, but disable the retired purchase order RPC actions.
begin;

drop function if exists public.submit_purchase_order_payment(uuid, numeric, text, text);
drop function if exists public.verify_purchase_order_payment(uuid, boolean, text);

commit;

notify pgrst, 'reload schema';
