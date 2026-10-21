-- Admin-marked items take priority; monthly sales fill the remaining five slots.
-- Only aggregate menu IDs/ranks are public; order and customer data stay private.
begin;
create or replace function public.customer_menu_bestsellers()
returns table(menu_item_id uuid, bestseller_rank bigint)
language sql stable security definer
set search_path = public
as $$
  with monthly_sales as (
    select oi.menu_item_id, sum(oi.quantity) as units
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.created_at >= (date_trunc('month', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila')
      and o.created_at < ((date_trunc('month', now() at time zone 'Asia/Manila') + interval '1 month') at time zone 'Asia/Manila')
      and lower(coalesce(o.status, '')) not in ('cancelled', 'canceled', 'refunded', 'rejected')
      and not coalesce(o.is_voided, false)
      and lower(coalesce(o.refund_status, '')) not in ('processed', 'completed', 'refunded')
      and (o.payment_confirmed or lower(coalesce(o.payment_status, '')) in ('paid', 'verified', 'confirmed'))
    group by oi.menu_item_id
  )
  select m.id, row_number() over (
    order by m.is_bestseller desc, case when m.is_bestseller then m.sort_order end asc nulls last,
      coalesce(s.units, 0) desc, m.id
  )
  from public.menu_items m
  left join monthly_sales s on s.menu_item_id = m.id
  where not m.is_archived and (m.is_bestseller or s.units > 0)
    and not exists (select 1 from public.subcategories sc where sc.id = m.subcategory_id and sc.name = 'add_ons')
  order by 2
  limit 5;
$$;
revoke all on function public.customer_menu_bestsellers() from public;
grant execute on function public.customer_menu_bestsellers() to anon, authenticated;
commit;
