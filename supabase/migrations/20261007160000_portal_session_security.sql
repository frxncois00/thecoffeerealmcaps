-- Portal sessions are tied to Supabase Auth sessions. Legacy browser-tab history
-- cannot be verified and is removed during this one-time cutover.
alter table public.internal_user_sessions
  add column if not exists auth_session_id uuid,
  add column if not exists revoked_at timestamptz,
  add column if not exists admin_authorized_at timestamptz;

delete from public.internal_user_sessions where auth_session_id is null;
alter table public.internal_user_sessions alter column auth_session_id set not null;

create unique index if not exists internal_user_sessions_auth_session_idx
  on public.internal_user_sessions (auth_session_id);

create table if not exists public.admin_trusted_browsers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  browser text not null default 'Unknown browser',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists admin_trusted_browsers_user_idx
  on public.admin_trusted_browsers (user_id, expires_at desc);

alter table public.internal_user_sessions
  add column if not exists trusted_browser_id uuid references public.admin_trusted_browsers(id) on delete set null;

create table if not exists public.admin_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code_hash text not null unique,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists admin_backup_codes_user_idx
  on public.admin_backup_codes (user_id, used_at);

alter table public.admin_trusted_browsers enable row level security;
alter table public.admin_backup_codes enable row level security;
revoke all on public.admin_trusted_browsers, public.admin_backup_codes from anon, authenticated;

-- Edge Functions call this with the service role after verifying the caller.
create or replace function public.consume_admin_backup_code(p_user_id uuid, p_hash text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  update public.admin_backup_codes
     set used_at = now()
   where user_id = p_user_id and code_hash = p_hash and used_at is null;
  return found;
end;
$$;
revoke all on function public.consume_admin_backup_code(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_admin_backup_code(uuid, text) to service_role;

create or replace function public.replace_admin_backup_codes(p_user_id uuid, p_hashes text[])
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  if coalesce(array_length(p_hashes, 1), 0) <> 10 then raise exception 'Exactly ten backup codes required'; end if;
  delete from public.admin_backup_codes where user_id = p_user_id;
  insert into public.admin_backup_codes(user_id, code_hash)
    select p_user_id, unnest(p_hashes);
end;
$$;
revoke all on function public.replace_admin_backup_codes(uuid, text[]) from public, anon, authenticated;
grant execute on function public.replace_admin_backup_codes(uuid, text[]) to service_role;

-- The browser cannot read auth.sessions. This function supplies authoritative
-- session state to the verified portal-security Edge Function.
create or replace function public.list_internal_portal_sessions(p_caller_id uuid)
returns table (
  id uuid, user_id uuid, auth_session_id uuid, browser text,
  operating_system text, device_type text, ip_address inet,
  signed_in_at timestamptz, last_seen_at timestamptz,
  signed_out_at timestamptz, revoked_at timestamptz,
  auth_session_exists boolean, full_name text, email text, role text
) language plpgsql security definer set search_path = public, pg_temp as $$
declare v_is_admin boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  select public.normalize_role(p.role) = 'admin' into v_is_admin
    from public.profiles p where p.id = p_caller_id and p.removed_at is null;
  if v_is_admin is null then raise exception 'Active portal account required'; end if;
  return query
  select s.id, s.user_id, s.auth_session_id, s.browser,
         s.operating_system, s.device_type, s.ip_address,
         s.signed_in_at, s.last_seen_at, s.signed_out_at, s.revoked_at,
         a.id is not null, p.full_name::text, p.email::text, p.role::text
    from public.internal_user_sessions s
    join public.profiles p on p.id = s.user_id
    left join auth.sessions a on a.id = s.auth_session_id and a.user_id = s.user_id
   where (v_is_admin or s.user_id = p_caller_id)
     and public.normalize_role(p.role) in ('admin','staff','operational_staff','cashier')
   order by s.last_seen_at desc
   limit 300;
end;
$$;
revoke all on function public.list_internal_portal_sessions(uuid) from public, anon, authenticated;
grant execute on function public.list_internal_portal_sessions(uuid) to service_role;

create or replace function public.portal_auth_session_exists(p_user_id uuid, p_session_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.role() = 'service_role' and exists (
    select 1 from auth.sessions s where s.id = p_session_id and s.user_id = p_user_id
  );
$$;
revoke all on function public.portal_auth_session_exists(uuid, uuid) from public, anon, authenticated;
grant execute on function public.portal_auth_session_exists(uuid, uuid) to service_role;

create or replace function public.portal_session_permitted(p_user_id uuid, p_session_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.role() = 'service_role' and exists (
    select 1 from public.profiles p
    join public.internal_user_sessions s on s.user_id = p.id
    join auth.sessions a on a.id = s.auth_session_id and a.user_id = p.id
    where p.id = p_user_id and p.removed_at is null
      and s.auth_session_id = p_session_id
      and s.revoked_at is null and s.signed_out_at is null
      and public.normalize_role(p.role) in ('admin','staff','operational_staff','cashier')
      and (public.normalize_role(p.role) <> 'admin' or s.admin_authorized_at is not null)
  );
$$;
revoke all on function public.portal_session_permitted(uuid, uuid) from public, anon, authenticated;
grant execute on function public.portal_session_permitted(uuid, uuid) to service_role;

-- Runs on every Data API request. Admins need an MFA, backup-code, or trusted
-- browser grant for this exact Auth session. Every portal role needs an
-- unrevoked recorded session. Customer and anonymous requests are unchanged.
create or replace function public.check_portal_request()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_role text; v_removed_at timestamptz; v_session_id uuid; v_allowed boolean;
begin
  if auth.role() in ('anon', 'service_role') or auth.uid() is null then return; end if;
  select public.normalize_role(p.role), p.removed_at into v_role, v_removed_at
    from public.profiles p where p.id = auth.uid();
  if v_role is null or v_role not in ('admin','staff','operational_staff','cashier') then return; end if;
  if v_removed_at is not null then
    raise exception 'Portal account was removed' using errcode = '28000';
  end if;
  begin
    v_session_id := (auth.jwt()->>'session_id')::uuid;
  exception when others then
    raise exception 'Portal session is invalid' using errcode = '28000';
  end;
  select exists (
    select 1 from public.internal_user_sessions s
    join auth.sessions a on a.id = s.auth_session_id and a.user_id = s.user_id
    where s.user_id = auth.uid() and s.auth_session_id = v_session_id
      and s.signed_out_at is null and s.revoked_at is null
      and (v_role <> 'admin' or s.admin_authorized_at is not null)
  ) into v_allowed;
  if not v_allowed then
    raise exception 'Portal session requires verification or has been revoked' using errcode = '28000';
  end if;
end;
$$;
revoke all on function public.check_portal_request() from public;
grant execute on function public.check_portal_request() to anon, authenticated, service_role, authenticator;

-- Storage does not use PostgREST's pre-request hook. Apply the same check as
-- a restrictive storage policy for every internal portal role.
create or replace function public.current_portal_session_allowed()
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_role text; v_removed_at timestamptz; v_session_id uuid;
begin
  if auth.uid() is null then return true; end if;
  select public.normalize_role(p.role), p.removed_at into v_role, v_removed_at
    from public.profiles p where p.id = auth.uid();
  if v_role is null or v_role not in ('admin','staff','operational_staff','cashier') then return true; end if;
  if v_removed_at is not null then return false; end if;
  begin
    v_session_id := (auth.jwt()->>'session_id')::uuid;
  exception when others then return false;
  end;
  return exists (
    select 1 from public.internal_user_sessions s
    join auth.sessions a on a.id = s.auth_session_id and a.user_id = s.user_id
    where s.user_id = auth.uid() and s.auth_session_id = v_session_id
      and s.signed_out_at is null and s.revoked_at is null
      and (v_role <> 'admin' or s.admin_authorized_at is not null)
  );
end;
$$;
revoke all on function public.current_portal_session_allowed() from public;
grant execute on function public.current_portal_session_allowed() to authenticated;

-- Enable the guard with sql_editor/20261008_enable_portal_guard.sql after the
-- Edge Functions and frontend are deployed. Keeping activation separate avoids
-- blocking every existing portal login during a partial release.
