# Google Drive backups

The `Google Drive backup` workflow runs from the private `frxncois00/thecoffeerealm-backups` GitHub repository every day at 2:00 AM Philippine time and can also be started manually. It keeps daily and monthly backup files for 90 days.

## What it protects

- A complete logical database export: roles, schema, and data
- All Supabase Storage buckets, including payment proofs, benefit documents, purchase-order documents, menu images, profile pictures, and portal assets
- A manifest and checksums used to verify and track the backup

Daily runs export the complete database and only new or changed Storage objects. On the first day of each month, the Storage export is a complete snapshot. Every recovery archive is encrypted before it is uploaded. Daily Storage archives can depend on earlier snapshots and incremental exports when restoring unchanged files.

Manual runs and workflow retries export a full Storage snapshot to preserve files
when replacing an archive from earlier the same day.

## Google Drive layout

```text
Coffee Realm Backups/
  Daily/<YYYY-MM-DD>/
    database.tar.gz.enc
    uploaded-files.tar.gz.enc
    checksums.txt
    backup-report.txt
  Monthly Full/<year>/<YYYY-MM>/
  Reports/<YYYY-MM-DD>/
    menu.xlsx
    daily-summary.pdf
    Operational/
      orders.xlsx
      payments.xlsx
      inventory.xlsx
      purchase-orders.xlsx
  Backup Status/
    latest-backup-report.txt
    storage-manifest.json
```

## Required GitHub secrets

These are stored only in the private backup repository under **Settings → Secrets and variables → Actions**:

- `SUPABASE_URL`: the project URL
- `SUPABASE_SERVICE_ROLE_KEY`: a server-only service-role key
- `SUPABASE_PROJECT_REF`: the protected Supabase project identifier
- `SUPABASE_ACCESS_TOKEN`: a project-scoped token with Database read-write access for the temporary export login
- `GDRIVE_TOKEN`: the token JSON produced by `rclone authorize drive`
- `BACKUP_ENCRYPTION_PASSWORD`: a long recovery password stored in a password manager outside GitHub and Google Drive

Never put these values in a source file, issue, commit, or workflow log. The recovery password copy is saved locally as `BACKUP_RECOVERY_KEY.txt`, which is excluded from Git.

## Readable reports and access

The separate backup repository generates Excel/PDF reports from the same database
export after the encrypted backup has completed. Workbooks contain all available
records for filtering, with PHP amounts and Philippine timestamps. The daily PDF
covers the previous complete Philippine calendar day. It labels order value as
distinct from net revenue or cash collected and includes snapshot inventory and
open purchase-order counts.

Explicit field allowlists exclude customer personal details, staff records,
uploaded documents, payment references and payment-proof links. The `.enc` files
remain the recovery copies; readable reports cannot restore the system.

Repository variables `REPORT_ADMIN_EMAILS` and `REPORT_STAFF_EMAILS` control
approved individual Google accounts. The sole approved account is currently
`francissszx@gmail.com`, with full report access and no separate staff grants.
An account with admin access cannot simultaneously be restricted as staff.
Future distinct staff accounts receive viewer access only to Operational folders.
Menu and daily summaries remain restricted to owners/admins.

The workflow audits parent folders, recovery folders and retained reports before
publishing. Public, domain, group and unapproved-user access blocks readable uploads.
Do not share the backup root with staff. To remove a staff account, revoke its
existing Drive shares as well as removing it from the repository variable.
Reports have 90-day retention. Report failures fail the GitHub Actions run while
preserving the completed recovery backup. The Admin Settings history describes
the encrypted backup result; check Actions for readable-report delivery status.

To retry reports without repeating a backup, run the workflow manually with
`report_date` set to an existing backup date. It verifies the saved database
checksum and decrypts the export only on the temporary runner. Leave that input
empty for a normal complete backup. Drive quota errors use paced retries;
authorization failures still block publication.

## First-run check

Run **Google Drive backup** manually from the repository Actions page. Confirm that the dated folder appears in Drive, the workflow succeeds, and Admin → System Settings → Backups reports a successful run. A backup is not considered ready until a test restore has been completed with the saved encryption password.
