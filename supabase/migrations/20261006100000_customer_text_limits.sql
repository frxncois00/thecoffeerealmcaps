-- Enforce customer input limits even when a caller bypasses the browser.
-- Customer RPCs pass values as typed parameters; no customer text is executed as SQL.

create or replace function public.validate_customer_order_text() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.order_source is distinct from 'customer_pos' then return new; end if;
  if tg_op = 'UPDATE' then
    if (new.customer_name, new.customer_email, new.customer_phone, new.delivery_address)
      is not distinct from
      (old.customer_name, old.customer_email, old.customer_phone, old.delivery_address) then
      return new;
    end if;
  end if;
  if btrim(coalesce(new.customer_name, '')) !~ '^[[:alpha:]][[:alpha:] .''-]{1,59}$' then
    raise exception 'Enter a valid customer name of 2 to 60 characters';
  end if;
  if length(coalesce(new.customer_email, '')) > 160 or
     coalesce(new.customer_email, '') !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Enter a valid customer email address';
  end if;
  if coalesce(new.customer_phone, '') !~ '^09[0-9]{9}$' then
    raise exception 'Contact number must contain 11 digits and start with 09';
  end if;
  if length(coalesce(new.delivery_address, '')) > 400 then
    raise exception 'Delivery address is too long';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_customer_order_text_trigger on public.orders;
create trigger validate_customer_order_text_trigger
before insert or update on public.orders
for each row execute function public.validate_customer_order_text();

create or replace function public.validate_customer_order_item_text() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.customizations is not distinct from old.customizations then return new; end if;
  end if;
  if length(coalesce(new.customizations ->> 'special_instructions', '')) > 300 then
    raise exception 'Special instructions must be 300 characters or fewer';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_customer_order_item_text_trigger on public.order_items;
create trigger validate_customer_order_item_text_trigger
before insert or update on public.order_items
for each row execute function public.validate_customer_order_item_text();

create or replace function public.validate_customer_feedback_text() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.comment is not null and length(new.comment) > 500 then
    raise exception 'Feedback comment must be 500 characters or fewer';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_customer_feedback_text_trigger on public.order_feedback;
create trigger validate_customer_feedback_text_trigger
before insert or update on public.order_feedback
for each row execute function public.validate_customer_feedback_text();
