-- Persist customer usernames from auth metadata so username sign-in can
-- resolve an account without exposing email addresses to the browser.

with username_candidates as (
  select
    p.id,
    nullif(btrim(u.raw_user_meta_data->>'username'), '') as username,
    row_number() over (
      partition by lower(btrim(u.raw_user_meta_data->>'username'))
      order by p.created_at, p.id
    ) as duplicate_rank
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.normalize_role(p.role) = 'customer'
    and nullif(btrim(p.username), '') is null
    and nullif(btrim(u.raw_user_meta_data->>'username'), '') is not null
), safe_usernames as (
  select candidate.id, candidate.username
  from username_candidates candidate
  where candidate.duplicate_rank = 1
    and candidate.username ~ '^[A-Za-z0-9._-]{3,24}$'
    and not exists (
      select 1 from public.profiles existing
      where existing.id <> candidate.id
        and lower(btrim(existing.username)) = lower(candidate.username)
    )
)
update public.profiles profile
set username = safe.username,
    updated_at = now()
from safe_usernames safe
where profile.id = safe.id;

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_username text := nullif(btrim(new.raw_user_meta_data->>'username'), '');
begin
  if v_username is not null and v_username !~ '^[A-Za-z0-9._-]{3,24}$' then
    raise exception 'Invalid username format';
  end if;

  insert into public.profiles (id, email, full_name, username, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', v_username, split_part(new.email, '@', 1)),
    v_username,
    'customer'
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    updated_at = now();
  return new;
end;
$$;

notify pgrst, 'reload schema';
