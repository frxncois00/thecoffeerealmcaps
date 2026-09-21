-- Employee portal accounts may authenticate with username only.
-- Keep customer email requirements unchanged at the application layer; this
-- removes the database-level requirement that prevented internal accounts
-- from omitting an email address.
alter table public.profiles
  alter column email drop not null;
