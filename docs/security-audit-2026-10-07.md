# The Coffee Realm whole-system security audit — 7 October 2026

## Remediation update — 7 October 2026

The four October 6 security migrations are now present in the linked database;
a read-only check found all four main fixes, zero removed profiles retaining an
old role, and the built-in SHA-256 contact limiter. Their unique versions were
recorded as applied in Supabase migration history. The old order-email endpoint
was redeployed as HTTP 410, and the OTP, outbox, PayMongo checkout/webhook, and
active-profile Edge Function changes were deployed. The webhook rejected an
unsigned request with HTTP 401. Security source changes were pushed to `main`
at `9e80dc5`, excluding passport work. The test suite passed (66 tests) and
the production build completed.

The findings below describe the state **before** this remediation. Remaining
work includes end-to-end regression tests for OTP/email/payment, migration
backlog reconciliation, CSV formula handling, response security headers, and
dependency updates. No live payment or customer message was created for testing.

## Scope and limits

Reviewed the current Vite customer/staff application, Express OCR service,
Supabase migrations and Edge Function source, the uncommitted Realm Passport
feature, locked npm dependencies, linked Supabase deployment metadata, and
public site response headers. The audited Git commit is `0b6d7d5` on `main`;
the passport files remain uncommitted. Checks were read-only. No account was
created, no payment or email was sent, no customer data was dumped, and no
destructive production test was run. A schema-only dump could not run because
Docker Desktop is unavailable, so migration history and deployment timestamps
do not prove the exact current SQL/function bodies if someone changed them
outside the normal deployment workflow.

## Findings

### High — backend security fixes are not deployed with the frontend

The linked Supabase migration ledger reports `20261006100000`,
`20261006110000`, `20261006111000`, and `20261006112000` as local-only. These
contain customer text constraints, active-profile role/RLS checks, atomic OTP
attempt claims, and contact-message rate limits. The linked project reports
45 local-only migration entries overall. In contrast, `main` is deployed by
Vercel. A Git/Vercel deployment therefore must not be treated as deployment
of these database protections.

**Action:** reconcile the migration history, test the SQL against staging,
then apply the security migrations in dependency order and verify effective
policies and grants. Do not run an unreviewed bulk `db push` against production.

### High — removed internal accounts may retain privileged access

`20261006110000_active_profile_security.sql` is not recorded as applied.
Earlier role helpers and policies do not consistently test `removed_at`, and
`admin-manage-user`, `reply-customer-message`, and `record-portal-session`
authorize by stored role without an active-profile check. Employee removal
soft-deletes the Auth user and sets `removed_at`; the stored role remains until
the pending migration changes it. An already-issued token may remain useful
until expiry against paths that accept it. This was established from source
and migration/deployment metadata; no removed-account production token was
tested.

**Evidence:** `supabase/functions/admin-manage-user/index.ts:31-40,207-225`,
`supabase/functions/reply-customer-message/index.ts:35-44`,
`supabase/functions/record-portal-session/index.ts:39-44`, and the pending
`supabase/migrations/20261006110000_active_profile_security.sql`.

**Action:** apply and verify the migration, add `removed_at is null` checks to
every service-role Edge Function role gate, and test with a token issued before
removal. Review token/session revocation on account removal.

### Medium — sensitive Edge Functions still predate the repository fixes

The linked project lists these active deployments, all older than the 6
October fixes: `verify-customer-otp` (4 Sep), `send-order-email` (9 Aug),
`process-order-email-outbox` (9 Aug), `create-paymongo-checkout` (3 Oct), and
`paymongo-webhook` (25 Sep). The repository now has atomic OTP verification,
amount-bound payment verification, a retired arbitrary-recipient email
endpoint, and a hardened outbox caller check. The active deployment metadata
does not show those versions. In particular, the old email endpoint is still
listed as ACTIVE, whereas the repository version returns HTTP 410.

**Action:** after their database dependencies are ready, redeploy those
functions in staging, run payment/OTP/email regression tests, then promote
them to production. Confirm webhook signature verification remains enabled
while gateway JWT verification remains disabled for PayMongo delivery.

### Medium — public contact form has no deployed server-side rate limit

The new contact page calls the anonymous `submit_customer_message` RPC.
`20261006112000_customer_message_rate_limit.sql` is not recorded as applied.
The existing RPC validates the message but has no atomic request budget,
allowing inbox flooding regardless of browser-side limits.

**Evidence:** `src/pages/customer/ContactPage.jsx:13-22` and
`supabase/migrations/20261006112000_customer_message_rate_limit.sql`.

**Action:** deploy and test the rate-limit migration; monitor rejected and
accepted volume. Add a gateway challenge if bot volume remains high.

### Medium — CSV exports do not neutralize spreadsheet formulas

Sales, inventory, and activity exports wrap values in double quotes, but a
cell such as `=1+1` remains a formula when opened in spreadsheet software.
Those exports include customer names, reasons, item labels, and audit labels
that may originate from users or less trusted records. No production payload
was submitted. [OWASP documents this CSV injection behavior](https://community.owasp.org/attacks/CSV_Injection).

**Evidence:** `src/services/salesReportService.js:529-562`,
`src/services/inventoryReportService.js:65-78`, and
`src/services/usersAccessService.js:132-139`.

**Action:** use a shared spreadsheet-safe cell encoder for human-opened CSVs
and add tests for `=`, `+`, `-`, `@`, control characters, separators, and quotes.

### Medium — migration identifiers collide and backlog is large

Five timestamp identifiers occur twice locally: `20260924120000`,
`20261005120000`, `20261005160000`, `20261005200000`, and `20261005210000`.
The last two each have a passport migration and a different migration under
the same version. The linked ledger maps one entry for each version to a
remote record and another to a local-only record; a version alone cannot
identify which file was applied. This makes a blind migration push unsafe and
can obscure whether an intended change is live.

**Action:** inventory the actual remote schema, assign unique ordered
versions to pending files, and reconcile the migration ledger in staging
before applying production changes.

### Low to medium — browser security headers are incomplete

A read-only `HEAD` request to `https://thecoffeerealm.store/` returned HSTS,
but no `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, or `Permissions-Policy`. No exploit was demonstrated. A
carefully tested CSP and `frame-ancestors` policy would limit the impact of
future script injection and framing attacks. See the
[OWASP CSP guidance](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html).

### Dependency advisories — triage by reachable use

`npm audit` reports 10 advisories in the full lockfile, 6 with `--omit=dev`
(3 high, 2 moderate, 1 low). Production packages include
`react-router-dom@7.18.1`, `exceljs@4.4.0` with `uuid@8.3.2`, and
`jspdf@4.2.1` with `dompurify@3.4.13`. The reported React Router high-severity
advisory affects its unstable RSC APIs; this project is a Vite SPA and no RSC
use was found, so it is not a confirmed exploit here. The `uuid` advisory
requires particular buffer APIs; no application call to those APIs was found.
Update tested packages and rerun the audit without assuming each package-level
advisory is reachable. See the
[React Router advisory](https://github.com/advisories/GHSA-qwww-vcr4-c8h2)
and [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

### Passport work in progress — reward count is not authoritative

The passport UI is uncommitted, though both passport SQL migration versions
appear in the linked ledger. `completedPassportOrders` counts orders by
`Completed`/`Received` status and non-refunded status, without requiring a
settled payment. Rewards and milestones exist only in client code; there is
no server-side earning/redemption ledger or atomic redemption guard in this
feature. The current UI is a display, not proof of an earned benefit.

**Evidence:** `src/utils/realmPassport.js:2-25`,
`src/pages/customer/RealmPassportPage.jsx:110-126`, and
`supabase/migrations/20261005200000_realm_passport.sql`.

**Action:** before launching redeemable rewards, calculate eligibility from
paid, non-refunded orders in the database and record each redemption
server-side exactly once.

## Verified positives and limits

- The committed frontend escapes customer-controlled text in staff receipt and
  report HTML. The local regression test passed during the previous release.
- The repository payment validator binds checkout session, currency, paid
  state, and exact amount; the corresponding deployed Edge Functions are older.
- The PayMongo webhook deployment has gateway `verify_jwt=false`, as required
  for provider callbacks; its HMAC check still needs deployment regression
  verification.
- No tracked `.env` file or obvious private key assignment was found by a
  targeted source scan. The public Supabase anon key in browser code is
  expected and must be protected by deployed RLS.
- No live payment, OTP, account-removal, or customer-message attack was run.

## Immediate order of work

1. Reconcile duplicate migration versions and the 45-entry backlog against a
   staging copy of the linked project.
2. Apply the October 6 security migrations and verify removed-account RLS,
   atomic OTP attempts, and anonymous message throttling.
3. Redeploy the older security-sensitive Edge Functions and test payment,
   webhook, OTP, and email behavior end to end.
4. Fix CSV formula handling, then add and test response security headers.
5. Triage dependency updates and keep passport rewards unreleased until
   payment-backed earning and server-side redemption exist.
