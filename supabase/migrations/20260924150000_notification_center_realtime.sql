-- The existing Notification Center listens on its Supabase Realtime channel.
-- Publish the stock and approval tables that feed its live alerts.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'inventory_stock',
    'finished_products',
    'purchase_orders',
    'menu_change_approvals'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
