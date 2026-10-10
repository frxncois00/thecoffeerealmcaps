-- Paste and run this in Supabase Dashboard -> SQL Editor to restore anon reads on published portal configuration and testimonials.

begin;

-- Separate anon policy from authenticated policy so anon queries never evaluate is_admin_profile.
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

commit;
