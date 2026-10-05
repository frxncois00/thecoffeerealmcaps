alter table public.profiles
  add column if not exists birthdate date;

alter table public.profiles
  drop constraint if exists profiles_birthdate_valid;

alter table public.profiles
  add constraint profiles_birthdate_valid
  check (birthdate is null or birthdate >= date '1900-01-01');

create or replace function public.enforce_customer_birthdate_age()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.role, '') = 'customer' and new.birthdate is not null
     and new.birthdate > (current_date - interval '13 years')::date then
    raise exception 'Customers must be at least 13 years old';
  end if;
  return new;
end;
$$;

drop trigger if exists customer_birthdate_age on public.profiles;
create trigger customer_birthdate_age
before insert or update of birthdate, role on public.profiles
for each row execute function public.enforce_customer_birthdate_age();
