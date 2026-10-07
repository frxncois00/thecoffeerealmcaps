-- Run in the linked project's SQL Editor before the security bundle.
-- This is read-only. The last two counts should be zero.

select
  current_database() as database_name,
  current_setting('server_version') as postgres_version,
  to_regclass('public.orders') is not null as has_orders,
  to_regclass('public.order_items') is not null as has_order_items,
  to_regclass('public.order_feedback') is not null as has_order_feedback,
  to_regclass('public.payments') is not null as has_payments,
  to_regclass('public.profiles') is not null as has_profiles,
  to_regclass('public.customer_messages') is not null as has_customer_messages,
  to_regclass('public.customer_email_otps') is not null as has_customer_email_otps,
  to_regclass('storage.objects') is not null as has_storage_objects,
  to_regprocedure('public.normalize_role(text)') is not null as has_normalize_role,
  to_regprocedure('public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)') is not null as has_contact_rpc,
  to_regprocedure('public.submit_customer_message_internal(text,text,text,text,text,text,text,text,date,text)') is not null as contact_rpc_already_wrapped,
  (select count(*) from public.profiles
   where role is not null and role not in
     ('customer', 'admin', 'cashier', 'staff', 'operational_staff', 'removed')) as invalid_profile_roles,
  (select count(*) from supabase_migrations.schema_migrations
   where version in
     ('20261006100000', '20261006110000', '20261006111000', '20261006112000')) as already_recorded_versions;
