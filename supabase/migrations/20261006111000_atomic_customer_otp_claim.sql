-- Serialize verification attempts so concurrent guesses share the same
-- five-attempt limit. Only the service role can call this function.
create or replace function public.claim_customer_registration_otp(
  p_email text,
  p_code_hash text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_otp public.customer_email_otps%rowtype;
  v_attempts integer;
begin
  select * into v_otp from public.customer_email_otps
  where email = lower(btrim(p_email)) and purpose = 'register' and used_at is null
  order by created_at desc limit 1 for update;

  if not found or v_otp.expires_at <= now() then
    return 'invalid';
  end if;
  if v_otp.blocked_until > now() or v_otp.attempt_count >= 5 then
    return 'blocked';
  end if;

  if v_otp.code_hash = p_code_hash then
    update public.customer_email_otps set used_at = now() where id = v_otp.id;
    return 'valid';
  end if;

  v_attempts := v_otp.attempt_count + 1;
  update public.customer_email_otps set
    attempt_count = v_attempts,
    blocked_until = case when v_attempts >= 5 then now() + interval '10 minutes' else null end,
    used_at = case when v_attempts >= 5 then now() else null end
  where id = v_otp.id;
  return case when v_attempts >= 5 then 'blocked' else 'invalid' end;
end;
$$;

revoke all on function public.claim_customer_registration_otp(text,text) from public, anon, authenticated;
grant execute on function public.claim_customer_registration_otp(text,text) to service_role;
