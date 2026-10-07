-- Final rollout step after schema, Edge Functions, and frontend are live.
alter role authenticator set pgrst.db_pre_request = 'public.check_portal_request';
notify pgrst, 'reload config';

drop policy if exists "Internal portal session gate" on storage.objects;
create policy "Internal portal session gate" on storage.objects
  as restrictive for all to authenticated
  using ((select public.current_portal_session_allowed()))
  with check ((select public.current_portal_session_allowed()));

-- Emergency rollback if the portal is unexpectedly blocked:
-- alter role authenticator reset pgrst.db_pre_request;
-- notify pgrst, 'reload config';
-- drop policy if exists "Internal portal session gate" on storage.objects;
