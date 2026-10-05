-- Existing benefit applicants already supplied a verified date of birth.
-- Use it to complete the new profile field without overwriting any value
-- the customer has entered during onboarding.
update public.profiles as profile
set birthdate = application.date_of_birth,
    updated_at = now()
from public.benefit_applications as application
where application.customer_id = profile.id
  and profile.birthdate is null
  and application.date_of_birth is not null;
