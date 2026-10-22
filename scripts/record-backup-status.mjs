/* global process, fetch */
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Supabase status credentials are missing.')
const backupDate = process.env.BACKUP_DATE || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

const response = await fetch(`${url}/rest/v1/backup_runs`, {
  method: 'POST',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({
    backup_date: backupDate,
    backup_type: process.env.BACKUP_TYPE || 'daily',
    status: process.env.BACKUP_RUN_STATUS === 'success' ? 'success' : 'failed',
    destination: 'Google Drive',
    drive_path: process.env.BACKUP_DRIVE_PATH || null,
    database_bytes: Number(process.env.BACKUP_DATABASE_BYTES || 0),
    storage_files: Number(process.env.BACKUP_STORAGE_FILES || 0),
    storage_bytes: Number(process.env.BACKUP_STORAGE_BYTES || 0),
    error_summary: process.env.BACKUP_RUN_STATUS === 'success' ? null : 'The scheduled backup did not complete. Review the GitHub Actions run.',
    started_at: process.env.BACKUP_STARTED_AT || new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }),
})
if (!response.ok) throw new Error(`Could not record backup status (${response.status}).`)
