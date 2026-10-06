-- Run after 20261006110000. All changes roll back.
begin;
create temporary table audit_principals(role text primary key, id uuid not null);
insert into audit_principals
select 'customer', id from public.profiles
where public.normalize_role(role) = 'customer' and removed_at is null limit 1;
insert into audit_principals
select 'staff', id from public.profiles
where public.normalize_role(role) in ('staff', 'operational_staff', 'cashier') and removed_at is null limit 1;
insert into audit_principals
select 'admin', id from public.profiles
where public.normalize_role(role) = 'admin' and removed_at is null limit 1;

do $$ begin
  if (select count(*) from audit_principals) <> 3 then
    raise exception 'Test needs an active customer, staff member, and admin';
  end if;
end $$;

update public.profiles set removed_at = now()
where id in (select id from audit_principals);
grant select on audit_principals to authenticated;
set local role authenticated;
do $$ declare v_role text; v_id uuid; begin
  for v_role, v_id in select role, id from audit_principals loop
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_id, 'role', 'authenticated')::text, true);
    if public.is_customer_profile() or public.is_staff_profile() or public.is_admin_profile() then
      raise exception 'Removed % passed an active role helper', v_role;
    end if;
    if exists (select 1 from public.profiles where id = v_id) then
      raise exception 'Removed % can still read own profile', v_role;
    end if;
    if v_role = 'staff' then
      begin
        perform public.assert_transaction_writer();
        raise exception 'Removed staff can manage transactions';
      exception when raise_exception then
        if sqlerrm <> 'Transaction management access required' then raise; end if;
      end;
    end if;
  end loop;
end $$;
reset role;
rollback;
