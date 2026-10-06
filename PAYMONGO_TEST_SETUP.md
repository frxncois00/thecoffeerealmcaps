# PayMongo test-mode checkout

This integration uses PayMongo Hosted Checkout v2. Customers are redirected to
PayMongo, and the order is marked paid only after a signed
`checkout_session.payment.paid` webhook is received.

The PayMongo public key is not used by this flow. Do not put the secret key in
React, `.env`, Git, or any browser-visible variable. The secret key belongs in
Supabase Edge Function secrets only.

## 1. Apply the database migration

Run this migration in the linked Supabase project:

```bash
supabase db push
```

Or run the file below in Supabase Dashboard → SQL Editor:

```text
supabase/migrations/20260925100000_paymongo_test_checkout.sql
```

## 2. Deploy the Edge Functions

```bash
supabase functions deploy create-paymongo-checkout
supabase functions deploy paymongo-webhook --no-verify-jwt
```

The webhook must be public because PayMongo calls it directly. The webhook
still rejects requests unless their `Paymongo-Signature` matches the signing
secret for the endpoint.

## 3. Add test secrets

In Supabase Dashboard → Edge Functions → Secrets, add:

```text
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PAYMENT_METHOD_TYPES=card,gcash,qrph
PAYMONGO_RETURN_ORIGIN=https://thecoffeerealm.store
```

`PAYMONGO_SECRET_KEY` must start with `sk_test_`. You can change the payment
method list if your PayMongo test account has a different set of enabled
channels.

The app also exposes a separate **QRPh via PayMongo** checkout option. It uses
the same integration but forces the PayMongo session to `qrph`, instead of
showing the full PayMongo method list.

## 4. Register the PayMongo test webhook

In PayMongo Dashboard → Developers → Webhooks, create a **test-mode** endpoint:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paymongo-webhook
```

Subscribe to:

```text
checkout_session.payment.paid
```

Copy the endpoint’s separate signing secret and add it to Supabase Function
secrets as:

```text
PAYMONGO_WEBHOOK_SECRET=the_webhook_signing_secret
```

This is not the same value as the PayMongo API secret key.

## 5. Customer checkout

QRPh is intentionally customer-checkout-only. It is not exposed as an admin
payment-method toggle. Once the migration and Edge Functions are configured,
the customer checkout shows **QRPh via PayMongo** alongside the store’s normal
payment methods. The success page
polls briefly for the webhook result, but the webhook remains the source of
truth for payment confirmation.

## Local testing

For local return redirects, set `PAYMONGO_RETURN_ORIGIN` to
`http://localhost:5173` in a separate test Supabase project. The Edge Function
uses this server setting for success and cancel URLs, regardless of the origin
in a browser request.

After completing a test payment, verify all three points:

1. PayMongo shows the test checkout as paid.
2. The webhook endpoint shows a successful delivery.
3. The order in the app changes to `Order Received` with payment status `paid`.

Never enable this option for live traffic until the live key, live webhook,
refund handling, and production callback URLs have been configured separately.
