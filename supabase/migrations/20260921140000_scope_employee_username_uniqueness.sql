-- Customer profiles and internal employee profiles are separate account
-- roles. Allow a customer username to coexist with an internal username while
-- keeping usernames unique within the internal portal.
alter table public.profiles
  drop constraint if exists profiles_username_key;

create unique index if not exists profiles_internal_username_uidx
  on public.profiles (lower(username))
  where username is not null
    and role in ('admin', 'staff', 'operational_staff', 'cashier');
