-- Anonymous message submissions need a database-side limit; browser controls
-- can be bypassed by calling the RPC with the public anon key.
create table if not exists public.customer_message_rate_limits (
  scope text not null check (scope in ('email', 'global')),
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  primary key (scope, key_hash)
);
alter table public.customer_message_rate_limits enable row level security;

alter function public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)
  rename to submit_customer_message_internal;
revoke all on function public.submit_customer_message_internal(text,text,text,text,text,text,text,text,date,text)
  from public, anon, authenticated;

create function public.submit_customer_message(
  p_category text, p_source text, p_name text, p_email text, p_phone text,
  p_subject text, p_message text, p_inquiry_type text default null,
  p_preferred_date date default null, p_quantity text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_count integer;
  v_key text;
begin
  if length(v_email) > 160 or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid email address';
  end if;

  -- Fixed order of acquisition avoids deadlocks under concurrent submissions.
  foreach v_key in array array['global:' || current_date::text, 'email:' || v_email] loop
    insert into public.customer_message_rate_limits as rate
      (scope, key_hash, window_started_at, request_count)
    values (
      case when v_key like 'global:%' then 'global' else 'email' end,
      encode(pg_catalog.sha256(pg_catalog.convert_to(v_key, 'UTF8')), 'hex'), now(), 1
    )
    on conflict (scope, key_hash) do update set
      window_started_at = case
        when rate.window_started_at <= now() - case when rate.scope = 'global' then interval '1 minute' else interval '10 minutes' end then now()
        else rate.window_started_at end,
      request_count = case
        when rate.window_started_at <= now() - case when rate.scope = 'global' then interval '1 minute' else interval '10 minutes' end then 1
        else rate.request_count + 1 end
    returning request_count into v_count;
    if (v_key like 'global:%' and v_count > 60) or (v_key like 'email:%' and v_count > 3) then
      raise exception 'Too many messages. Please try again later.';
    end if;
  end loop;

  return public.submit_customer_message_internal(
    p_category, p_source, p_name, v_email, p_phone, p_subject,
    p_message, p_inquiry_type, p_preferred_date, p_quantity
  );
end;
$$;

revoke all on function public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)
  from public;
grant execute on function public.submit_customer_message(text,text,text,text,text,text,text,text,date,text)
  to anon, authenticated;
notify pgrst, 'reload schema';
