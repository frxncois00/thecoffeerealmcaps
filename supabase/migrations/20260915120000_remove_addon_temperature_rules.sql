-- Add-ons are scoped by menu subcategory only. Temperature is no longer
-- configurable for an add-on, so normalize legacy records to the neutral
-- value still understood by older checkout functions.
update public.addons
set target_temperature = 'both'
where target_temperature is distinct from 'both';
