-- Preserve verified pins on saved customer addresses so checkout can quote
-- immediately without geocoding the same address again.

alter table public.customer_addresses
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.customer_addresses
  drop constraint if exists customer_addresses_coordinates_check;

alter table public.customer_addresses
  add constraint customer_addresses_coordinates_check check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180)
  );
