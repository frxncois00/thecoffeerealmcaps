-- Expose only aggregate ratings to the public menu, never individual feedback.
create or replace function public.customer_feedback_summary()
returns table(average_rating numeric, review_count bigint)
language sql stable security definer
set search_path = public
as $$
  select round(avg(rating)::numeric, 1), count(*)
  from public.order_feedback
  where rating between 1 and 5;
$$;

revoke all on function public.customer_feedback_summary() from public;
grant execute on function public.customer_feedback_summary() to anon, authenticated;
