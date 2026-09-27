-- Internal portal device sessions. Authentication tokens are never stored here.
create table if not exists public.internal_user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_key uuid not null,
  ip_address inet,
  browser text not null default 'Unknown browser',
  operating_system text not null default 'Unknown system',
  device_type text not null default 'Desktop',
  user_agent text,
  signed_in_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  signed_out_at timestamptz,
  unique (user_id, session_key)
);

create index if not exists internal_user_sessions_user_activity_idx
  on public.internal_user_sessions (user_id, last_seen_at desc);

alter table public.internal_user_sessions enable row level security;

drop policy if exists "Internal users view their sessions" on public.internal_user_sessions;
create policy "Internal users view their sessions"
on public.internal_user_sessions for select to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and public.normalize_role(p.role) in ('admin', 'staff', 'operational_staff', 'cashier')
  )
);

revoke insert, update, delete on public.internal_user_sessions from anon, authenticated;
grant select on public.internal_user_sessions to authenticated;
