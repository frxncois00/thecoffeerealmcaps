# Admin MFA and portal sessions rollout

This feature is off until `VITE_PORTAL_SECURITY_ENABLED=true` is set at build
time. No production database or function deployment is performed by this file.

## Staging order

1. Reconcile the pending Supabase migrations and duplicate migration versions
   described in `security-audit-2026-10-07.md`. Apply
   `20261007160000_portal_session_security.sql` to staging. It deletes legacy
   `internal_user_sessions` rows because those browser-tab records cannot be
   matched to real Auth sessions. This is the requested history reset.
2. Deploy `portal-security`, then redeploy `admin-manage-user`, `support-chat`,
   `reply-customer-message`, `process-order-email-outbox`, and
   `staff-session-info` with their shared `portalAccess.ts` helper.
3. In a maintenance window, deploy the frontend with
   `VITE_PORTAL_SECURITY_ENABLED=true`, then immediately run
   `supabase/sql_editor/20261008_enable_portal_guard.sql` before reopening
   portal access. Existing valid Auth sessions are registered on their next
   page load; admins must complete MFA before accessing admin data. Do not
   expose the new frontend to users until the final database guard is active.

## Staging checks

- New admin browser: password alone cannot read admin Data API tables or use
  privileged Edge Functions. Only an existing authenticator or unused security
  code unlocks access; the sign-in page never enrolls keys or generates codes.
- Enroll the initial admin authenticator before enabling the portal guard.
  Accounts without an authenticator or security codes require administrator
  recovery. Additional authenticators are added in the Settings MFA modal after
  verifying an existing key; existing keys remain enrolled.
- Replacing backup codes in the Settings modal requires an authenticator code
  and explicit confirmation that the previous codes become invalid.
- Trusted browser: the same browser can sign in without another TOTP for 30
  days; a private window, different profile, or cleared storage requires it.
- Backup codes: ten are shown once; each works once; regenerating invalidates
  the previous set.
- Admin session view: includes admin, staff, and cashier; activity changes from
  Active to Idle after two minutes without a heartbeat.
- Revocation: the target session loses Data API and privileged Edge Function
  access immediately; its browser returns to login on the next heartbeat
  (within about 30 seconds while running). Revoking an admin session also
  revokes the trusted-browser credential linked to it.
- Ended history: Clear ended history removes signed-out and revoked records,
  while leaving active and idle sessions intact.

The final SQL file includes a commented emergency rollback and a restrictive
Storage policy. Supabase access tokens remain valid until expiry, so every
privileged Data API, Storage, and Edge path must use the session check. Any
newly added Edge Functions also need the same gate before serving portal users.
