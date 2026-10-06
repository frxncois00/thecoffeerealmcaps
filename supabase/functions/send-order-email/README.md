# Retired order email endpoint

`send-order-email` now returns HTTP 410. It previously accepted a recipient and
HTML receipt from the caller, which could be used to send forged email.

Deploy the retired function to close any existing endpoint, or remove the
deployed function after verifying no external caller depends on it. Order mail
is generated from database outbox events by `process-order-email-outbox`.
