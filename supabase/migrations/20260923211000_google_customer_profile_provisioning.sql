-- Provision Google OAuth customers without overwriting an existing profile.
-- Provider display names that fail the store's validation use a safe placeholder
-- and can be completed later from the customer profile page.

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_username text := nullif(btrim(new.raw_user_meta_data->>'username'), '');
  v_full_name text := nullif(btrim(coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name'
  )), '');
begin
  if v_username is not null and v_username !~ '^[A-Za-z0-9._-]{3,24}$' then
    v_username := null;
  end if;

  if v_full_name is null or v_full_name !~ '^[[:alpha:]][[:alpha:] .''-]{1,59}$' then
    v_full_name := 'Coffee Realm Customer';
  end if;

  insert into public.profiles (id, email, full_name, username, role, avatar_url)
  values (
    new.id,
    new.email,
    v_full_name,
    v_username,
    'customer',
    nullif(btrim(coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )), '')
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    full_name = coalesce(nullif(btrim(public.profiles.full_name), ''), excluded.full_name),
    avatar_url = coalesce(nullif(btrim(public.profiles.avatar_url), ''), excluded.avatar_url),
    updated_at = now();
  return new;
end;
$$;

notify pgrst, 'reload schema';
