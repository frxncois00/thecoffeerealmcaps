-- Keep disabled selling-option metadata aligned with the authoritative menu price.
-- Customer ordering must use menu_items.price when additional selling options
-- are disabled, but repair existing stale default values as well.

begin;

with repaired as (
  update public.menu_items item
  set variant_options = jsonb_set(
        jsonb_set(item.variant_options, '{options,0,price}', to_jsonb(item.price), false),
        '{prices,default}',
        to_jsonb(item.price),
        false
      ),
      updated_at = now()
  where not item.is_archived
    and item.price > 0
    and coalesce(item.variant_options->>'enabled', 'false') <> 'true'
    and item.variant_options->'options'->0->>'key' = 'default'
    and coalesce(item.variant_options->'options'->0->>'price', '0')::numeric = 0
    and coalesce(item.variant_options->'prices'->>'default', '0')::numeric = 0
  returning item.name
)
select count(*) as repaired_rows, string_agg(name, ', ' order by name) as repaired_items
from repaired;

commit;

notify pgrst, 'reload schema';
