-- Fix public/anon read access for portal_configuration and site_testimonials.
-- When is_admin_profile was revoked from anon in 20261006110000_active_profile_security.sql,
-- the existing RLS policies on portal_configuration and site_testimonials:
--   using (is_public or public.is_admin_profile())
-- threw "permission denied for function is_admin_profile" when unauthenticated anon users read published configuration.

-- Separate anon policy from authenticated policy so anon queries never depend on is_admin_profile.
drop policy if exists "Public reads published portal configuration" on public.portal_configuration;
drop policy if exists "Anon reads published portal configuration" on public.portal_configuration;
drop policy if exists "Authenticated reads portal configuration" on public.portal_configuration;

create policy "Anon reads published portal configuration"
  on public.portal_configuration for select
  to anon
  using (is_public = true);

create policy "Authenticated reads portal configuration"
  on public.portal_configuration for select
  to authenticated
  using (is_public = true or public.is_admin_profile());

drop policy if exists "Public reads visible testimonials" on public.site_testimonials;
drop policy if exists "Anon reads visible testimonials" on public.site_testimonials;
drop policy if exists "Authenticated reads testimonials" on public.site_testimonials;

create policy "Anon reads visible testimonials"
  on public.site_testimonials for select
  to anon
  using (visible = true);

create policy "Authenticated reads testimonials"
  on public.site_testimonials for select
  to authenticated
  using (visible = true or public.is_admin_profile());
