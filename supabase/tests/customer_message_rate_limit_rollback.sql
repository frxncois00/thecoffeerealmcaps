-- Run after 20261006112000. All inserted messages and counters roll back.
begin;
set local role anon;
do $$ declare i integer; begin
  for i in 1..3 loop
    perform public.submit_customer_message(
      'general_inquiry', 'landing', 'Rate Limit Test',
      'rate-limit-regression@example.invalid', null, 'Test message', 'Test body'
    );
  end loop;
  begin
    perform public.submit_customer_message(
      'general_inquiry', 'landing', 'Rate Limit Test',
      'rate-limit-regression@example.invalid', null, 'Test message', 'Test body'
    );
    raise exception 'Fourth message was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Too many messages. Please try again later.' then raise; end if;
  end;
end $$;
reset role;
rollback;
