-- A payment reference identifies one real transfer and must not be reused.
-- Normalize case and surrounding whitespace so equivalent values cannot bypass
-- the constraint. NULL and blank references remain allowed for COD payments and
-- payment rows that have not received proof yet.
create unique index if not exists payments_unique_reference_number_idx
  on public.payments (lower(btrim(reference_number)))
  where reference_number is not null
    and btrim(reference_number) <> '';

notify pgrst, 'reload schema';
