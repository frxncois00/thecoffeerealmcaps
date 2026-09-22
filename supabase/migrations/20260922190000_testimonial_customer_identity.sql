alter table public.site_testimonials
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists source_feedback_id uuid references public.order_feedback(id) on delete set null;

update public.site_testimonials
set username = name
where username is null or trim(username) = '';

create unique index if not exists site_testimonials_source_feedback_uidx
  on public.site_testimonials (source_feedback_id)
  where source_feedback_id is not null;

comment on column public.site_testimonials.username is
  'Public customer username displayed with an approved testimonial.';
comment on column public.site_testimonials.avatar_url is
  'Optional public profile image snapshot used with an approved testimonial.';
comment on column public.site_testimonials.source_feedback_id is
  'Completed-order feedback selected by an administrator for publication.';
