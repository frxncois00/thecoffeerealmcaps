# Google Drive backups

The `Google Drive backup` workflow runs from the private `frxncois00/thecoffeerealm-backups` GitHub repository every day at 2:00 AM Philippine time and can also be started manually. It keeps daily and monthly backup files for 90 days.

## What it protects

- A complete logical database export: roles, schema, and data
- All Supabase Storage buckets, including payment proofs, benefit documents, purchase-order documents, menu images, profile pictures, and portal assets
- A manifest and checksums used to verify and track the backup

Daily runs export the complete database and only new or changed Storage objects. On the first day of each month, the Storage export is a complete snapshot. Every archive is encrypted before it is uploaded.

## Google Drive layout

```text
Coffee Realm Backups/
  Daily/<year>/<month>/<YYYY-MM-DD>/
    database/database.tar.gz.enc
    uploaded-files/uploaded-files.tar.gz.enc
    checksums.txt
    backup-report.txt
  Monthly Full/<year>/<YYYY-MM>/
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

## First-run check

Run **Google Drive backup** manually from the repository Actions page. Confirm that the dated folder appears in Drive, the workflow succeeds, and Admin → System Settings → Backups reports a successful run. A backup is not considered ready until a test restore has been completed with the saved encryption password.
