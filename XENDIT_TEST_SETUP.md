# Xendit test checkout

The customer checkout uses Xendit Payment Sessions in test mode. The browser is redirected to Xendit's hosted test checkout, while a verified webhook remains the payment source of truth.

## Supabase secrets

Add these secrets to the linked Supabase project:

```text
XENDIT_TEST_SECRET_KEY=xnd_development_...
XENDIT_WEBHOOK_TOKEN=your-xendit-webhook-verification-token
XENDIT_RETURN_ORIGIN=https://www.thecoffeerealm.store
```

`XENDIT_RETURN_ORIGIN` must be an HTTPS origin accepted by Xendit. Keep it on the live or a preview deployment while testing; localhost can start checkout, but Xendit returns the browser to this HTTPS origin.

## Deploy the functions

```text
supabase functions deploy create-xendit-checkout
supabase functions deploy xendit-webhook --no-verify-jwt
```

## Register the webhook

In Xendit test mode, register this Payment Session webhook URL:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/xendit-webhook
```

Subscribe to `payment_session.completed` and copy the webhook verification token into `XENDIT_WEBHOOK_TOKEN`.

The integration rejects callbacks without the matching `x-callback-token`, verifies the session currency and amount, and handles repeat callbacks safely.
