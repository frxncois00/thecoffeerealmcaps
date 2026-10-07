import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { portalSupabase } from '../lib/supabase'
import { signOutPortal } from '../lib/auth'
import { getPortalSecurityStatus, portalSecurityRequest, trustCurrentBrowser } from '../services/portalSessionService'
import './admin-mfa.css'

export default function AdminMfaPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [setup, setSetup] = useState(null)
  const [code, setCode] = useState('')
  const [backupMode, setBackupMode] = useState(false)
  const [backupCodes, setBackupCodes] = useState(null)
  const [savedCodes, setSavedCodes] = useState(false)
  const [trustBrowser, setTrustBrowser] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    portalSupabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) throw new Error('Sign in to continue.')
      return getPortalSecurityStatus(data.user.id)
    }).then((result) => {
      if (active) setStatus(result)
    }).catch((failure) => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [])

  async function startSetup() {
    setBusy(true); setError('')
    try {
      const { data, error: enrollError } = await portalSupabase.auth.mfa.enroll({
        factorType: 'totp', friendlyName: 'Coffee Realm Admin',
      })
      if (enrollError) throw enrollError
      setSetup(data)
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }

  async function verify(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      if (backupMode) {
        await portalSecurityRequest('verify_backup', { code })
      } else {
        const factorId = setup?.id || status?.factors?.[0]?.id
        if (!factorId) throw new Error('Generate an authenticator key first.')
        const { error: verifyError } = await portalSupabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() })
        if (verifyError) throw verifyError
        await portalSecurityRequest('authorize')
      }
      if (setup && !backupMode) {
        const result = await portalSecurityRequest('generate_backup')
        setBackupCodes(result.codes)
        setCode('')
        return
      }
      if (trustBrowser && !backupMode) await trustCurrentBrowser(status.profile.id)
      navigate('/admin', { replace: true })
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }

  async function finishSetup() {
    if (!savedCodes) return
    setBusy(true); setError('')
    try {
      if (trustBrowser) await trustCurrentBrowser(status.profile.id)
      navigate('/admin', { replace: true })
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }

  async function regenerateBackupCodes(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const factorId = status?.factors?.[0]?.id
      if (!factorId) throw new Error('No authenticator is enrolled.')
      const { error: verifyError } = await portalSupabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() })
      if (verifyError) throw verifyError
      await portalSecurityRequest('authorize')
      const result = await portalSecurityRequest('generate_backup')
      setBackupCodes(result.codes)
      setSavedCodes(false)
      setCode('')
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }

  const hasFactor = Boolean(status?.factors?.length)
  return <main className="admin-mfa-page">
    <section className="admin-mfa-card">
      <span className="admin-mfa-icon"><ShieldCheck size={26} /></span>
      <h1>{backupCodes ? 'Save your backup codes' : hasFactor ? 'Verify your sign-in' : 'Set up admin MFA'}</h1>
      <p>{backupCodes ? 'These one-time codes are shown once. Store them somewhere safe before continuing.' : hasFactor ? 'Enter a code from your authenticator app for this browser.' : 'Scan the QR code with an authenticator app, then enter its six-digit code.'}</p>

      {!status && !error && <p role="status">Checking your account…</p>}
      {error && <p className="admin-mfa-error" role="alert">{error}</p>}

      {backupCodes ? <>
        <div className="admin-mfa-backups" aria-label="One-time backup codes">{backupCodes.map((value) => <code key={value}>{value.match(/.{1,4}/g).join('-')}</code>)}</div>
        <button type="button" className="admin-mfa-secondary" onClick={() => navigator.clipboard.writeText(backupCodes.join('\n'))}>Copy codes</button>
        <label className="admin-mfa-check"><input type="checkbox" checked={savedCodes} onChange={(event) => setSavedCodes(event.target.checked)} />I saved these codes</label>
        <button type="button" className="admin-mfa-primary" disabled={!savedCodes || busy} onClick={finishSetup}>Continue to admin</button>
      </> : status && !status.authorized ? <>
        {!hasFactor && !setup && <button type="button" className="admin-mfa-primary" disabled={busy} onClick={startSetup}><KeyRound size={17} />Generate authenticator key</button>}
        {setup && <div className="admin-mfa-setup">
          <img src={setup.totp.qr_code} alt="Authenticator setup QR code" width="210" height="210" />
          <p>Manual key</p><code>{setup.totp.secret}</code>
        </div>}
        {(hasFactor || setup) && <>
          {hasFactor && <button type="button" className="admin-mfa-secondary" onClick={() => { setBackupMode((value) => !value); setCode(''); setError('') }}>{backupMode ? 'Use authenticator app' : 'Use a backup code'}</button>}
          <form onSubmit={verify}>
            <label htmlFor="admin-mfa-code">{backupMode ? 'Backup code' : 'Authenticator code'}</label>
            <input id="admin-mfa-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" inputMode={backupMode ? 'text' : 'numeric'} maxLength={backupMode ? 39 : 6} required />
            {!backupMode && <label className="admin-mfa-check"><input type="checkbox" checked={trustBrowser} onChange={(event) => setTrustBrowser(event.target.checked)} />Trust this browser for 30 days</label>}
            <button className="admin-mfa-primary" disabled={busy} type="submit">{busy ? 'Verifying…' : 'Verify and continue'}</button>
          </form>
        </>}
      </> : status?.authorized && <>
        {hasFactor && <form onSubmit={regenerateBackupCodes}>
          <label htmlFor="admin-mfa-manage-code">Replace backup codes</label>
          <p>Enter an authenticator code. Existing backup codes will stop working.</p>
          <input id="admin-mfa-manage-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" inputMode="numeric" maxLength={6} required />
          <button type="submit" className="admin-mfa-secondary" disabled={busy}>Generate new backup codes</button>
        </form>}
        <button type="button" className="admin-mfa-primary" onClick={() => navigate('/admin', { replace: true })}>Continue to admin</button>
      </>}
      <button type="button" className="admin-mfa-secondary" onClick={async () => { await signOutPortal(); navigate('/portal', { replace: true }) }}>Sign out</button>
    </section>
  </main>
}
