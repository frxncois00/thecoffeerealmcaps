-- Keep the profiles role constraint aligned with the canonical roles used by
-- portal authentication, RLS policies, and employee management.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'admin', 'cashier', 'staff', 'operational_staff'));
