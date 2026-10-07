-- Read-only check after running security SQL in the linked project.
-- True means the main objects of that fix are present; review any false result.

select
  (select count(*) = 3 from pg_trigger
   where not tgisinternal and tgname in (
     'validate_customer_order_text_trigger',
     'validate_customer_order_item_text_trigger',
     'validate_customer_feedback_text_trigger'
   )) as customer_text_limits,
  (to_regprocedure('public.revoke_removed_profile_role()') is not null
   and exists (select 1 from pg_trigger
               where not tgisinternal and tgname = 'zz_revoke_removed_profile_role')
   and exists (select 1 from pg_proc
               where oid = to_regprocedure('public.is_staff_profile()')
                 and pg_get_functiondef(oid) ilike '%removed_at is null%'))
    as active_profile_security,
  (exists (select 1 from pg_proc
           where oid = to_regprocedure('public.claim_customer_registration_otp(text,text)')
             and prosecdef
             and pg_get_functiondef(oid) ilike '%for update%')
   and not coalesce(has_function_privilege(
     'anon', to_regprocedure('public.claim_customer_registration_otp(text,text)'), 'execute'), false))
    as atomic_otp_claim,
  (to_regclass('public.customer_message_rate_limits') is not null
   and to_regprocedure('public.submit_customer_message_internal(text,text,text,text,text,text,text,text,date,text)') is not null
   and exists (select 1 from pg_proc
               where oid = to_regprocedure('public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)')
                 and pg_get_functiondef(oid) like '%customer_message_rate_limits%'))
    as contact_message_rate_limit,
  (select count(*) from public.profiles
   where removed_at is not null and role is distinct from 'removed')
    as removed_profiles_with_old_role,
  exists (select 1 from pg_proc
          where oid = to_regprocedure('public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)')
            and pg_get_functiondef(oid) ilike '%pg_catalog.sha256%')
    as contact_limit_uses_builtin_sha256;
