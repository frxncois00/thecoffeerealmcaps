# The Coffee Realm security audit — 6 October 2026

## Scope and evidence

Reviewed the React/Vite customer and staff flows; Supabase migration history,
RLS policies, storage buckets, and privileged RPCs; authentication and OTP
functions; PayMongo checkout and webhook code; customer messages; the optional
Express OCR server; locked dependencies; and the generated production bundle.
This is a repository audit. No production requests or destructive tests were
run. A migration in Git is not evidence that it was deployed.

## Confirmed source findings

### High — stored XSS in staff receipt printing

- **Affected:** `src/components/common/ReceiptDocument.jsx:419-590`, especially
  the item customizations inserted into `document.write` at the former lines
  432-443. The sales and transaction print templates in
  `src/services/salesReportService.js:565-626` and
  `src/services/transactionsService.js:420-454` had the same raw HTML pattern.
- **Boundary:** customer order text and database report labels entered a same
  origin staff print window as HTML.
- **Reproduction:** submit a customer order RPC directly with markup in
  `special_instructions` (the database limit checked length, not HTML syntax),
  then have staff open its receipt. The markup executes in the print window.
- **Impact:** staff session theft or actions as the staff user; report templates
  also allowed markup from stored labels. **Fix:** encode all variable text
  before writing HTML. Implemented with `src/utils/escapeHtml.js` and a
  regression test. React's normal JSX rendering was already escaped.

### High — removed accounts retained role based database access

- **Affected:** `supabase/migrations/20260902100000_customer_profile_pictures.sql:8-20`
  redefined `is_customer_profile()` without `removed_at`; the staff helper in
  `20260731120000_normalize_staff_role_checks.sql:26-31`, and the admin helper
  in `20260809180000_admin_content_and_system_settings.sql:33-44` also lacked
  the active account check. Some policies and RPCs checked `role` directly.
- **Boundary:** an account marked removed could still use an unexpired JWT
  against RLS or SECURITY DEFINER RPCs that tested its preserved role.
- **Reproduction:** remove a staff or customer account while retaining a
  previously issued token, then call an allowed Data API query or RPC with
  that token. These role predicates still evaluated true in the repository
  schema. Live token acceptance must be verified separately.
- **Impact:** post removal access to orders, financial or administrative
  functions, and customer data until token expiry. **Fix:**
  `20261006110000_active_profile_security.sql` restores active role helpers,
  tightens core policies, and changes removed rows to a nonprivileged role.
  A rollback SQL regression test was added.

### Medium — OTP attempt count could be bypassed with parallel requests

- **Affected:** `supabase/functions/verify-customer-otp/index.ts:38-83`
  previously read, incremented, then wrote `attempt_count` in separate calls.
- **Boundary:** untrusted OTP guesses crossed into an administrative Auth user
  creation path.
- **Reproduction:** send parallel wrong codes for one email. Multiple calls
  can read the same counter before any writes, so more than five guesses are
  tested while the stored count advances by fewer than five.
- **Impact:** reduced resistance to OTP guessing and automated account
  registration abuse. **Fix:** `20261006111000_atomic_customer_otp_claim.sql`
  serializes attempts with a row lock and consumes a valid code before user
  creation; the Edge Function calls only that service role RPC.

### Medium — PayMongo customer verification trusted paid status without amount

- **Affected:** `supabase/functions/create-paymongo-checkout/index.ts:89-138`.
- **Boundary:** provider session data was promoted to the local payment and
  order ledger.
- **Reproduction:** supply a provider response for the bound session with a
  paid payment whose amount differs from `payments.amount_due`; the old verify
  branch marked the order paid. Exploiting this against PayMongo requires a
  corresponding provider side mismatch; no live mismatch was tested.
- **Impact:** an underpaid order could be recorded as settled. **Fix:**
  `paymentValidation.mjs` requires the bound session, a paid PHP payment,
  and the exact minor unit amount. The webhook now requires a bound checkout
  session and validates the paid payment currency and amount. Unit tests cover
  mismatched amount, status, currency, and session.

### Medium — caller controlled PayMongo return origin

- **Affected:** `supabase/functions/create-paymongo-checkout/index.ts:28-32,145-169`.
- **Boundary:** a customer supplied API body value became a trusted provider
  redirect URL.
- **Reproduction:** call the checkout function for an owned order with an
  attacker controlled `origin`, then share the hosted checkout link. Its
  success or cancel redirect leads to that origin.
- **Impact:** payment flow phishing and misleading post payment navigation.
  **Fix:** the function now uses only `PAYMONGO_RETURN_ORIGIN` from Edge
  Function configuration, accepting HTTPS or local development HTTP.

### Medium — legacy email endpoint accepted arbitrary recipient and HTML

- **Affected:** the former `supabase/functions/send-order-email/index.ts:390-445`.
- **Boundary:** an admin or cashier browser session supplied recipient and
  receipt HTML to server SMTP credentials.
- **Reproduction:** invoke the function with a valid cashier token, an
  unrelated address, and a forged `receipt_html` payload.
- **Impact:** store branded phishing or spam, and no order recipient binding.
  **Fix:** the unused legacy endpoint now returns HTTP 410. Order email goes
  through `process-order-email-outbox` using database events.

### Medium — unauthenticated OCR accepted untrusted image uploads

- **Affected:** `server/server.js:13-32,69-123`.
- **Boundary:** a public HTTP upload launched Sharp and Tesseract processing;
  the old filter trusted client supplied MIME type.
- **Reproduction:** repeatedly POST a 10 MB file with `Content-Type: image/png`
  to an OCR route. The old server accepted it without a credential and spent
  CPU on preprocessing or OCR.
- **Impact:** resource exhaustion if this optional server is exposed. **Fix:**
  require `OCR_API_KEY` before multipart parsing, restrict CORS, and decode
  metadata with Sharp before OCR. Focused tests cover key and format checks.

### Medium — anonymous contact RPC had no rate limit

- **Affected:** `supabase/migrations/20260904140000_enforce_customer_input_limits.sql:3-47`.
- **Boundary:** anyone with the public anon key could insert validated
  customer messages through a SECURITY DEFINER RPC.
- **Reproduction:** call `submit_customer_message` repeatedly with distinct
  addresses, bypassing any browser interaction limits.
- **Impact:** inbox flooding and staff workload. **Fix:**
  `20261006112000_customer_message_rate_limit.sql` adds atomic per email and
  global counters and wraps the existing validator. A rollback SQL test covers
  the per email limit. A gateway CAPTCHA remains advisable if bot volume grows.

### Medium — untrusted workbook can exhaust staff browser memory

- **Affected:** `src/lib/raimuFileReader.js:11-18` called ExcelJS `xlsx.load`
  on a staff uploaded file without checking ZIP expansion sizes.
- **Boundary:** untrusted workbook bytes entered the staff browser parser.
- **Reproduction:** attach a small highly compressed workbook with very large
  declared uncompressed entries to Raimu.
- **Impact:** browser tab crash or freeze. **Fix:**
  `src/utils/validateWorkbookZip.js` rejects oversized archives, entry counts,
  and high expansion ratios before ExcelJS loads them; tests cover those
  limits. This addresses the known ExcelJS decompression risk in this flow.

## Review observations and live checks

- The production bundle contains the expected public Supabase anon JWT. The
  bundle scan found no service role environment name, PayMongo secret pattern,
  SMTP secret name, or source map marker. The anon key alone is safe only if
  deployed RLS and function grants match the hardened migration state.
- Customer orders use a SECURITY DEFINER RPC that derives menu prices and
  delivery fees in SQL; proof attachment checks order ownership, path shape,
  and object metadata. Staff refunds use role checked RPCs and order row locks.
  These are source conclusions, not live configuration verification.
- No confirmed SQL injection was found in the traced order, payment, refund,
  message, and admin paths. They use typed RPC parameters or Supabase query
  builders. Client search filters assembled with `.or()` may alter a staff
  search expression, but RLS still governs returned rows.
- The password reset page calls Supabase Auth recovery methods directly. Its
  abuse limits and redirect policy depend on Supabase Auth configuration.
  Wildcard CORS on authenticated Edge Functions is not an authorization bypass
  by itself; verify JWT enforcement and allowed origins in the deployment.
- The PayMongo webhook validates an HMAC over the raw body and a five minute
  timestamp window. Its deployment must disable gateway JWT verification for
  PayMongo delivery while keeping webhook signature verification enabled.
- The outbox Edge Function previously parsed an unsigned JWT payload to
  recognize `service_role`. That shortcut was removed. Verify that the cron
  caller sends the configured service key and that no other Edge Function
  accepts unsigned role claims.
- The lockfile includes `uuid@8.3.2` through ExcelJS. A reviewed advisory
  affects particular `uuid` API calls using caller provided buffers; no such
  application call was found. This is a dependency follow up, not a confirmed
  exploit. `npm audit` could not reach the npm advisory endpoint here.
- Supabase Auth email confirmation, signup settings, OTP function JWT mode,
  redirect allowlists, deployed migration versions, actual storage bucket
  settings, and PayMongo webhook secrets/events could not be read from the
  production project. Direct Auth signup may bypass custom OTP if email
  confirmation is disabled; verify the intended policy in the dashboard.

## Verification and deployment

`npm test`: 66 passed. Vite customer and realm tour builds passed with
`--configLoader runner`; the default config loader hit a local Windows sandbox
directory access error. `git diff --check` passed. The new SQL rollback tests
were not run because no linked database or local `psql`/Deno runtime was
available. No production tests were run.

Apply migrations `20261006110000`, `20261006111000`, and `20261006112000` in
order after all earlier migrations. Run the SQL rollback tests against a
staging copy, inspect effective RLS policies and grants, then deploy the
updated Edge Functions: `create-paymongo-checkout`, `paymongo-webhook`,
`verify-customer-otp`, `process-order-email-outbox`, and the retired
`send-order-email` endpoint. Set `PAYMONGO_RETURN_ORIGIN`; if the OCR server is
deployed, set `OCR_API_KEY` and `OCR_ALLOWED_ORIGIN`. Confirm webhook delivery,
OTP verification, customer message throttling, and removed account denial in
staging before production rollout.
