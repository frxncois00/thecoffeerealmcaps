-- Customers must be at least 13 years old when a birthdate is saved.
-- This protects both onboarding and direct API/profile updates.
create or replace function public.enforce_customer_birthdate_age()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.role, '') = 'customer'
     and new.birthdate is not null
     and new.birthdate > (current_date - interval '13 years')::date then
    raise exception 'Customers must be at least 13 years old';
  end if;
  return new;
end;
$$;

drop trigger if exists customer_birthdate_age on public.profiles;

create trigger customer_birthdate_age
before insert or update of birthdate, role
on public.profiles
for each row
execute function public.enforce_customer_birthdate_age();
