-- The public homepage reads only quotes an administrator has published.
-- Keep the admin helper restricted; anonymous readers do not need to execute it.
begin;

drop policy if exists "Public reads visible testimonials" on public.site_testimonials;
drop policy if exists "Anon reads visible testimonials" on public.site_testimonials;
drop policy if exists "Authenticated reads testimonials" on public.site_testimonials;

create policy "Anon reads visible testimonials"
  on public.site_testimonials for select to anon
  using (visible = true);

create policy "Authenticated reads testimonials"
  on public.site_testimonials for select to authenticated
  using (visible = true or public.is_admin_profile());

commit;
