-- Read-only backup health history for the Admin Settings backup tab.
-- The scheduled backup uses the service role to write one row per run.
create table if not exists public.backup_runs (
  id bigint generated always as identity primary key,
  backup_date date not null,
  backup_type text not null check (backup_type in ('daily', 'monthly')),
  status text not null check (status in ('success', 'failed')),
  destination text not null default 'Google Drive',
  drive_path text,
  database_bytes bigint not null default 0 check (database_bytes >= 0),
  storage_files integer not null default 0 check (storage_files >= 0),
  storage_bytes bigint not null default 0 check (storage_bytes >= 0),
  error_summary text check (char_length(error_summary) <= 300),
  started_at timestamptz not null,
  completed_at timestamptz not null default now()
);

create index if not exists backup_runs_completed_idx on public.backup_runs(completed_at desc);
alter table public.backup_runs enable row level security;

drop policy if exists "Admins read backup history" on public.backup_runs;
create policy "Admins read backup history"
  on public.backup_runs for select to authenticated
  using (public.is_admin_profile());

revoke all on public.backup_runs from anon, authenticated;
grant select on public.backup_runs to authenticated;

comment on table public.backup_runs is 'Status-only history written by the off-site backup workflow and visible to administrators.';
