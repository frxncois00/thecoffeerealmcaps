create or replace function public.enforce_senior_account_age()
returns trigger language plpgsql security definer set search_path = public as $$
declare account_birthdate date;
begin
  if new.kind = 'senior' then
    select birthdate into account_birthdate from public.profiles where id = new.customer_id;
    if account_birthdate is null then
      raise exception 'A customer account birthdate is required for Senior Citizen applications';
    end if;
    if account_birthdate > (current_date - interval '60 years')::date then
      raise exception 'Senior Citizen applications require an account birthdate showing age 60 or older';
    end if;
    if new.date_of_birth <> account_birthdate then
      raise exception 'The Senior Citizen birthdate must match the birthdate on the customer account';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists benefit_application_senior_age on public.benefit_applications;
create trigger benefit_application_senior_age
before insert or update of kind, customer_id, date_of_birth on public.benefit_applications
for each row execute function public.enforce_senior_account_age();
